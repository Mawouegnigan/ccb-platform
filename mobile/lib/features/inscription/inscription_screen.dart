import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../data/models/membre.dart';
import '../fiche/fiche_screen.dart';
import '../../theme/app_theme.dart';

class InscriptionScreen extends StatefulWidget {
  const InscriptionScreen({super.key});

  @override
  State<InscriptionScreen> createState() => _InscriptionScreenState();
}

class _InscriptionScreenState extends State<InscriptionScreen> {
  final _formKey = GlobalKey<FormState>();
  final _client = Supabase.instance.client;

  final _nomController = TextEditingController();
  final _prenomsController = TextEditingController();
  final _posteController = TextEditingController();
  final _contactController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  String _statut = 'moniteur';
  String? _sousRegionId;
  String? _paroisseId;
  bool _charteAcceptee = false;
  bool _reglementAccepte = false;

  bool _loading = false;
  String? _error;

  List<Map<String, dynamic>> _sousRegions = [];
  List<Map<String, dynamic>> _paroisses = [];
  bool _chargementListes = true;

  @override
  void initState() {
    super.initState();
    _chargerListesGeo();
  }

  Future<void> _chargerListesGeo() async {
    try {
      final sousRegions = await _client
          .from('sous_regions')
          .select('id, nom, region_id, regions(nom)')
          .order('nom');
      final paroisses = await _client
          .from('paroisses')
          .select('id, nom, sous_region_id')
          .order('nom');

      if (!mounted) return;
      setState(() {
        _sousRegions = List<Map<String, dynamic>>.from(sousRegions);
        _paroisses = List<Map<String, dynamic>>.from(paroisses);
        _chargementListes = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = "Impossible de charger les régions. Vérifiez votre connexion : "
            "l'inscription nécessite d'être en ligne au moins une fois.";
        _chargementListes = false;
      });
    }
  }

  List<Map<String, dynamic>> get _paroissesFiltrees =>
      _paroisses.where((p) => p['sous_region_id'] == _sousRegionId).toList();

  Future<void> _soumettre() async {
    if (!_formKey.currentState!.validate()) return;
    if (_sousRegionId == null) {
      setState(() => _error = 'Merci de sélectionner votre sous-région.');
      return;
    }
    if (!_charteAcceptee || !_reglementAccepte) {
      setState(() => _error = "Merci d'accepter la charte et le règlement intérieur.");
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      // Détection de doublons avant envoi (fonction SQL côté backend).
      final doublons = await _client.rpc('find_duplicate_membres', params: {
        'p_nom': _nomController.text.trim(),
        'p_contact': _contactController.text.trim(),
      });

      if (doublons is List && doublons.isNotEmpty && mounted) {
        final continuer = await _confirmerMalgreDoublons(doublons);
        if (!continuer) {
          setState(() => _loading = false);
          return;
        }
      }

      final authResponse = await _client.auth.signUp(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );

      final userId = authResponse.user?.id;
      if (userId == null) {
        throw Exception('Compte non créé.');
      }

      final membre = Membre(
        nom: _nomController.text.trim(),
        prenoms: _prenomsController.text.trim(),
        statut: _statut,
        poste: _posteController.text.trim().isEmpty ? null : _posteController.text.trim(),
        contact: _contactController.text.trim(),
        sousRegionId: _sousRegionId!,
        paroisseId: _paroisseId,
        charteAcceptee: _charteAcceptee,
        reglementInterieurAccepte: _reglementAccepte,
      );

      await _client.from('membres').insert(membre.toInsertJson(userId));

      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const FicheScreen()),
      );
    } catch (e) {
      setState(() => _error = "L'inscription a échoué : ${e.toString()}");
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<bool> _confirmerMalgreDoublons(List doublons) async {
    return await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Fiche(s) similaire(s) trouvée(s)'),
            content: Text(
              'Une fiche avec un nom ou un contact proche existe déjà '
              '(${doublons.length} correspondance(s)). Voulez-vous confirmer '
              'votre inscription malgré tout ?',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('Corriger mes informations'),
              ),
              ElevatedButton(
                onPressed: () => Navigator.pop(context, true),
                child: const Text('Confirmer quand même'),
              ),
            ],
          ),
        ) ??
        false;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Inscription')),
      body: _chargementListes
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _champTexte(_nomController, 'Nom'),
                    const SizedBox(height: 12),
                    _champTexte(_prenomsController, 'Prénoms'),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: _statut,
                      decoration: const InputDecoration(labelText: 'Statut'),
                      items: const [
                        DropdownMenuItem(value: 'moniteur', child: Text('Moniteur')),
                        DropdownMenuItem(value: 'assistant', child: Text('Assistant')),
                      ],
                      onChanged: (v) => setState(() => _statut = v!),
                    ),
                    const SizedBox(height: 12),
                    _champTexte(_posteController, 'Poste (bureau, le cas échéant)', obligatoire: false),
                    const SizedBox(height: 12),
                    _champTexte(_contactController, 'Contact (téléphone ou email)'),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: _sousRegionId,
                      decoration: const InputDecoration(labelText: 'Sous-région'),
                      items: _sousRegions.map((sr) {
                        final region = sr['regions'];
                        final regionNom = region is Map ? region['nom'] : (region is List && region.isNotEmpty ? region.first['nom'] : '');
                        return DropdownMenuItem<String>(
                          value: sr['id'] as String,
                          child: Text('${sr['nom']} ($regionNom)'),
                        );
                      }).toList(),
                      onChanged: (v) => setState(() {
                        _sousRegionId = v;
                        _paroisseId = null;
                      }),
                      validator: (v) => v == null ? 'Champ requis' : null,
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: _paroisseId,
                      decoration: const InputDecoration(labelText: 'Paroisse'),
                      items: _paroissesFiltrees
                          .map((p) => DropdownMenuItem<String>(
                                value: p['id'] as String,
                                child: Text(p['nom'] as String),
                              ))
                          .toList(),
                      onChanged: _sousRegionId == null ? null : (v) => setState(() => _paroisseId = v),
                    ),
                    const Divider(height: 32),
                    _champTexte(_emailController, 'Email (identifiant de connexion)'),
                    const SizedBox(height: 12),
                    _champTexte(_passwordController, 'Mot de passe', motDePasse: true),
                    const SizedBox(height: 16),
                    CheckboxListTile(
                      value: _charteAcceptee,
                      onChanged: (v) => setState(() => _charteAcceptee = v ?? false),
                      title: const Text("J'ai lu et j'accepte la charte / le code de bonne conduite."),
                      controlAffinity: ListTileControlAffinity.leading,
                      contentPadding: EdgeInsets.zero,
                    ),
                    CheckboxListTile(
                      value: _reglementAccepte,
                      onChanged: (v) => setState(() => _reglementAccepte = v ?? false),
                      title: const Text('J\'ai pris connaissance du Règlement Intérieur des Cours Bibliques.'),
                      controlAffinity: ListTileControlAffinity.leading,
                      contentPadding: EdgeInsets.zero,
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 8),
                      Text(_error!, style: const TextStyle(color: Colors.red)),
                    ],
                    const SizedBox(height: 20),
                    ElevatedButton(
                      onPressed: _loading ? null : _soumettre,
                      child: Text(_loading ? 'Envoi…' : "S'inscrire"),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _champTexte(
    TextEditingController controller,
    String label, {
    bool obligatoire = true,
    bool motDePasse = false,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: motDePasse,
      decoration: InputDecoration(labelText: label),
      validator: obligatoire ? (v) => (v == null || v.isEmpty) ? 'Champ requis' : null : null,
    );
  }
}
