# Backend (Supabase)

Schéma PostgreSQL, authentification et règles d'accès (Row Level Security) pour la plateforme CCB.
Réf. Cahier des charges v2.2 (`../docs/cahier-des-charges.docx`).

## Contenu

```
supabase/
├── config.toml                                   → config du projet local
├── seed.sql                                       → données de référence (à adapter)
└── migrations/
    ├── 20260910120000_init_schema.sql             → enums, tables, contraintes, triggers
    └── 20260910120100_rls_policies.sql            → fonctions de périmètre + RLS par rôle
```

## Modèle de données

- `regions` / `sous_regions` / `paroisses` — hiérarchie géographique.
- `membres` — fiche moniteur/assistant/admin : identité, statut, poste, contact,
  périmètre (`sous_region_id` / `region_id` déduit automatiquement), rôle,
  statut de validation, charte et règlement intérieur acceptés.
- `roles_attribues` — historique des nominations (auteur, date, rôle attribué),
  alimenté automatiquement par un trigger.
- `documents` — module d'information (circulaires, supports, contenus conférence).

## Rôles et permissions (RLS)

| Rôle | Lecture | Écriture |
|---|---|---|
| `admin_national` | Tout le registre | Tout, y compris nomination des admins région/sous-région |
| `admin_region` | Sa région | Fiches de sa région (validation/modification) |
| `admin_sous_region` | Sa sous-région | Fiches de sa sous-région (validation/modification) |
| `membre` | Sa propre fiche | Sa propre fiche (hors rôle/périmètre) |

Le changement de `role` (nomination) est protégé par un trigger : seul un
`admin_national` peut l'effectuer, et chaque nomination est journalisée dans
`roles_attribues`. Un utilisateur ne peut jamais modifier son propre rôle.

La détection de doublons (nom + contact) est exposée via la fonction SQL
`find_duplicate_membres(nom, contact)`, à appeler côté application au moment
de la validation par un administrateur (plutôt qu'un blocage strict à
l'inscription, pour laisser la main à l'admin en cas de faux positif).

## Démarrage local

Prérequis : [Supabase CLI](https://supabase.com/docs/guides/cli) + Docker.

```bash
cd backend
supabase init          # si supabase/ n'existe pas encore côté CLI
supabase start          # lance Postgres, Auth, Studio en local
supabase db reset        # applique les migrations + seed.sql
```

Studio local : http://localhost:54323 — API : http://localhost:54321

Copier `.env.example` en `.env` et renseigner les clés affichées par `supabase start`.

## Déploiement sur un projet Supabase distant

```bash
supabase link --project-ref <project-ref>
supabase db push
```

## À faire avant la mise en production

- [ ] Remplacer les données de `seed.sql` par la structure géographique réelle
      (régions/sous-régions/paroisses) fournie par la Coordination.
- [ ] Créer le premier `admin_national` manuellement (via SQL ou Studio) pour
      amorcer les nominations suivantes.
- [ ] Configurer le Storage Supabase pour les photos d'identité et les
      documents du module d'information.
- [ ] Valider les migrations sur une instance réelle (`supabase db reset`)
      avant tout déploiement — elles n'ont pu être testées qu'en revue de
      code dans cet environnement, faute d'accès réseau/Docker.
