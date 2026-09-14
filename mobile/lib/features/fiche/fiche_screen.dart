import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../data/models/membre.dart';
import '../../data/repository/membre_repository.dart';
import '../auth/login_screen.dart';
import '../sync/sync_banner.dart';
import '../../theme/app_theme.dart';

class FicheScreen extends StatefulWidget {
  const FicheScreen({super.key});

  @override
  State<FicheScreen> createState() => _FicheScreenState();
}

class _FicheScreenState extends State<FicheScreen> {
  final _repository = MembreRepository();
  Membre? _membre;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _repository.synchroniserModificationsEnAttente();
    _charger();
  }

  Future<void> _charger() async {
    final membre = await _repository.getMaFiche();
    if (!mounted) return;
    setState(() {
      _membre = membre;
      _loading = false;
    });
  }

  Future<void> _seDeconnecter() async {
    await Supabase.instance.client.auth.signOut();
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  Future<void> _modifierContact() async {
    final controller = TextEditingController(text: _membre?.contact ?? '');
    final nouveauContact = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Modifier mon contact'),
        content: TextField(controller: controller, decoration: const InputDecoration(labelText: 'Téléphone ou email')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Annuler')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, controller.text.trim()),
            child: const Text('Enregistrer'),
          ),
        ],
      ),
    );

    if (nouveauContact == null || nouveauContact.isEmpty || _membre?.id == null) return;

    await _repository.updateMaFiche(_membre!.id!, {'contact': nouveauContact});
    await _charger();

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Modification enregistrée (envoyée dès que possible).')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Ma fiche'),
        actions: [
          IconButton(onPressed: _seDeconnecter, icon: const Icon(Icons.logout)),
        ],
      ),
      body: Column(
        children: [
          const SyncBanner(),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _membre == null
                    ? const Center(child: Text('Aucune fiche trouvée localement. Reconnectez-vous en ligne.'))
                    : _contenu(_membre!),
          ),
        ],
      ),
    );
  }

  Widget _contenu(Membre membre) {
    return RefreshIndicator(
      onRefresh: _charger,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _carteDeMembre(membre),
          const SizedBox(height: 24),
          Text('Informations', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          _ligneInfo('Statut', membre.statut == 'moniteur' ? 'Moniteur' : 'Assistant'),
          if (membre.poste != null) _ligneInfo('Poste', membre.poste!),
          _ligneInfo('Contact', membre.contact, action: _modifierContact),
          _ligneInfo('Statut de validation', _libelleValidation(membre.statutValidation)),
        ],
      ),
    );
  }

  Widget _carteDeMembre(Membre membre) {
    final estValide = membre.statutValidation == 'valide';

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.navy,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'COORDINATION DES COURS BIBLIQUES',
            style: TextStyle(color: AppColors.goldLight, fontSize: 11, letterSpacing: 0.5),
          ),
          const SizedBox(height: 4),
          Text(
            '${membre.prenoms} ${membre.nom}',
            style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          if (estValide && membre.id != null)
            Center(
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8)),
                child: QrImageView(
                  data: 'ccb-membre:${membre.id}',
                  size: 120,
                  backgroundColor: Colors.white,
                ),
              ),
            )
          else
            Text(
              estValide
                  ? 'Carte en attente de génération'
                  : 'Carte générée après validation de votre inscription',
              style: TextStyle(color: Colors.white.withOpacity(0.75), fontSize: 12),
            ),
        ],
      ),
    );
  }

  Widget _ligneInfo(String label, String valeur, {VoidCallback? action}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          SizedBox(width: 140, child: Text(label, style: TextStyle(color: AppColors.ink.withOpacity(0.6)))),
          Expanded(child: Text(valeur, style: const TextStyle(fontWeight: FontWeight.w500))),
          if (action != null) IconButton(icon: const Icon(Icons.edit, size: 18), onPressed: action),
        ],
      ),
    );
  }

  String _libelleValidation(String statut) {
    switch (statut) {
      case 'valide':
        return 'Validée';
      case 'rejete':
        return 'Rejetée';
      default:
        return 'En attente';
    }
  }
}
