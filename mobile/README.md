# Mobile (Flutter)

Application pour moniteurs/assistants : connexion, inscription, consultation
de sa fiche et carte de membre (QR code), avec mode hors-ligne.
Réf. Cahier des charges v2.2.

## Ce qui est implémenté (Phase 2)

- **Connexion** (`features/auth/login_screen.dart`)
- **Inscription** (`features/inscription/inscription_screen.dart`) — identité,
  statut, sous-région/paroisse, détection de doublons, charte + règlement
  intérieur, création du compte + de la fiche
- **Ma fiche** (`features/fiche/fiche_screen.dart`) — carte de membre avec QR
  code une fois la fiche validée, modification du contact
- **Mode hors-ligne** (`data/local/local_db.dart`, `data/repository/membre_repository.dart`) :
  - lecture de sa fiche depuis un cache SQLite si hors-ligne
  - modifications mises en file d'attente hors-ligne, synchronisées
    automatiquement au retour du réseau (`features/sync/sync_banner.dart`)

**Portée volontairement réaliste sur le hors-ligne** : la création de compte
(Supabase Auth) exige une connexion réseau au moins une fois — impossible de
s'inscrire à zéro sans jamais être en ligne. Le mode hors-ligne couvre la
consultation de sa fiche déjà synchronisée et la modification de ses
informations (mise en file d'attente).

## Reste à faire

- Upload de la photo d'identité (Supabase Storage)
- Export PDF de la carte de membre
- Écran de validation pour les admins mobiles (aujourd'hui réservé au web)
- Notifications push (rappels, changement de rôle)

## Installation

Prérequis : [Flutter SDK](https://docs.flutter.dev/get-started/install) ≥ 3.19.

```bash
cd mobile
flutter pub get
flutter run \
  --dart-define=SUPABASE_URL=http://localhost:54321 \
  --dart-define=SUPABASE_ANON_KEY=<clé anon de `supabase start`>
```

Sur un émulateur Android, remplacer `localhost` par `10.0.2.2` pour joindre
le Supabase local lancé sur la machine hôte.

## Important

Flutter/Dart n'est pas disponible dans l'environnement où ce code a été
écrit : je n'ai donc pas pu exécuter `flutter pub get` / `flutter analyze` /
`flutter run`. Le code a été relu attentivement (structure, imports,
équilibrage des accolades) mais **doit être testé en premier** avant de s'y
fier — signale-moi toute erreur de compilation pour que je corrige.
