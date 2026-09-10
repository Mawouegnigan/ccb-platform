# Mobile (Flutter)

Application pour moniteurs/assistants : inscription, consultation de fiche, carte de membre.

## Fonctionnalités prévues (Phase 2)

- Saisie et consultation hors-ligne
- Synchronisation automatique dès que le réseau est disponible
- Génération/consultation de la carte de membre (PDF + QR code)
- Accès filtré par rôle (identique au web)

## À initialiser

```bash
flutter create .
```

Puis intégrer le SDK Supabase Flutter (`supabase_flutter`) et une couche de stockage local (ex. `drift` ou `hive`) pour le mode hors-ligne.
