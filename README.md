# CCB Platform

Plateforme numérique de gestion des moniteurs et assistants — Coordination des Cours Bibliques.

Basé sur le cahier des charges v2.2 (voir `docs/cahier-des-charges.docx`).

## Structure du monorepo

```
ccb-platform/
├── web/       → Dashboard web (Next.js) — admins National / Région / Sous-Région
├── mobile/    → Application mobile (Flutter) — moniteurs/assistants, mode hors-ligne
├── backend/   → Schéma base de données, migrations, config Supabase
└── docs/      → Cahier des charges et documents de cadrage
```

## Rôles

| Rôle | Périmètre |
|---|---|
| Administrateur National | Toutes régions/sous-régions + nomination des admins région/sous-région |
| Administrateur Région | Sous-régions de sa région |
| Administrateur Sous-Région | Membres de sa sous-région |
| Moniteur / Assistant / Membre | Sa propre fiche |

## Stack technique

- **Web** : React / Next.js
- **Mobile** : Flutter (mode hors-ligne + synchronisation)
- **Backend** : Supabase (PostgreSQL + Auth + Storage)
- **Génération carte de membre** : PDF + QR code

## Phasage

- **Phase 1 — MVP** : inscription, base de données, dashboard admin, validation hiérarchique
- **Phase 2** : app mobile, rôles/visibilité, nomination des admins, carte de membre
- **Phase 3** : module d'information, charte/règlement intérieur, statistiques avancées

## Démarrage

Voir le README de chaque dossier (`web/`, `mobile/`, `backend/`) pour les instructions spécifiques.
