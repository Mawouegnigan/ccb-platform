/// Modèle aligné sur la table `membres` (backend/supabase/migrations).
class Membre {
  final String? id;
  final String? userId;
  final String nom;
  final String prenoms;
  final String statut; // 'moniteur' | 'assistant'
  final String? poste;
  final String contact;
  final String? paroisseId;
  final String sousRegionId;
  final String? regionId;
  final String? photoUrl;
  final String role; // 'admin_national' | 'admin_region' | 'admin_sous_region' | 'membre'
  final String statutValidation; // 'en_attente' | 'valide' | 'rejete'
  final String? dateInscription;
  final bool charteAcceptee;
  final bool reglementInterieurAccepte;

  const Membre({
    this.id,
    this.userId,
    required this.nom,
    required this.prenoms,
    required this.statut,
    this.poste,
    required this.contact,
    this.paroisseId,
    required this.sousRegionId,
    this.regionId,
    this.photoUrl,
    this.role = 'membre',
    this.statutValidation = 'en_attente',
    this.dateInscription,
    this.charteAcceptee = false,
    this.reglementInterieurAccepte = false,
  });

  factory Membre.fromJson(Map<String, dynamic> json) => Membre(
        id: json['id'] as String?,
        userId: json['user_id'] as String?,
        nom: json['nom'] as String,
        prenoms: json['prenoms'] as String,
        statut: json['statut'] as String,
        poste: json['poste'] as String?,
        contact: json['contact'] as String,
        paroisseId: json['paroisse_id'] as String?,
        sousRegionId: json['sous_region_id'] as String,
        regionId: json['region_id'] as String?,
        photoUrl: json['photo_url'] as String?,
        role: json['role'] as String? ?? 'membre',
        statutValidation: json['statut_validation'] as String? ?? 'en_attente',
        dateInscription: json['date_inscription'] as String?,
        charteAcceptee: json['charte_acceptee'] as bool? ?? false,
        reglementInterieurAccepte:
            json['reglement_interieur_accepte'] as bool? ?? false,
      );

  /// Pour l'insertion Supabase (les colonnes générées côté serveur sont omises).
  Map<String, dynamic> toInsertJson(String userId) => {
        'user_id': userId,
        'nom': nom,
        'prenoms': prenoms,
        'statut': statut,
        'poste': poste,
        'contact': contact,
        'paroisse_id': paroisseId,
        'sous_region_id': sousRegionId,
        'role': 'membre',
        'statut_validation': 'en_attente',
        'charte_acceptee': charteAcceptee,
        'reglement_interieur_accepte': reglementInterieurAccepte,
      };

  /// Pour le cache local SQLite (sqflite ne gère pas les booléens nativement).
  Map<String, dynamic> toLocalMap() => {
        'id': id,
        'user_id': userId,
        'nom': nom,
        'prenoms': prenoms,
        'statut': statut,
        'poste': poste,
        'contact': contact,
        'paroisse_id': paroisseId,
        'sous_region_id': sousRegionId,
        'region_id': regionId,
        'photo_url': photoUrl,
        'role': role,
        'statut_validation': statutValidation,
        'date_inscription': dateInscription,
        'charte_acceptee': charteAcceptee ? 1 : 0,
        'reglement_interieur_accepte': reglementInterieurAccepte ? 1 : 0,
      };

  factory Membre.fromLocalMap(Map<String, dynamic> map) => Membre(
        id: map['id'] as String?,
        userId: map['user_id'] as String?,
        nom: map['nom'] as String,
        prenoms: map['prenoms'] as String,
        statut: map['statut'] as String,
        poste: map['poste'] as String?,
        contact: map['contact'] as String,
        paroisseId: map['paroisse_id'] as String?,
        sousRegionId: map['sous_region_id'] as String,
        regionId: map['region_id'] as String?,
        photoUrl: map['photo_url'] as String?,
        role: map['role'] as String? ?? 'membre',
        statutValidation: map['statut_validation'] as String? ?? 'en_attente',
        dateInscription: map['date_inscription'] as String?,
        charteAcceptee: (map['charte_acceptee'] as int? ?? 0) == 1,
        reglementInterieurAccepte:
            (map['reglement_interieur_accepte'] as int? ?? 0) == 1,
      );
}
