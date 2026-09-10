# Backend (Supabase)

Base de données, authentification par rôles, et règles d'accès (Row Level Security).

## Rôles (à modéliser en RLS)

- `admin_national` — accès total + nomination des admins région/sous-région
- `admin_region` — accès aux sous-régions de sa région
- `admin_sous_region` — accès aux membres de sa sous-région
- `membre` — accès à sa propre fiche

## Tables principales (esquisse)

- `regions` (id, nom)
- `sous_regions` (id, nom, region_id)
- `paroisses` (id, nom, sous_region_id)
- `membres` (id, nom, prenoms, statut, poste, contact, paroisse_id, photo_url, statut_validation, date_inscription, date_validation, user_id)
- `roles_attribues` (id, membre_id, role, perimetre_id, attribue_par, date_attribution) — historique des nominations
- `documents` (id, titre, fichier_url, type, publie_par, date_publication) — module d'information

## À initialiser

```bash
npx supabase init
npx supabase start
```

Puis écrire les migrations SQL dans `supabase/migrations/` (schéma ci-dessus + policies RLS par rôle).
