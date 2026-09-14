# Web — Dashboard (Next.js)

Dashboard de gestion pour les rôles Administrateur National / Région / Sous-Région,
et formulaire d'auto-inscription public. Réf. Cahier des charges v2.2.

## Ce qui est implémenté (Phase 1 — MVP)

- **`/`** — page d'accueil (liens inscription / connexion)
- **`/inscription`** — auto-inscription : identité, statut, sous-région/paroisse,
  détection de doublons (via la fonction SQL `find_duplicate_membres`), acceptation
  de la charte et du règlement intérieur, création du compte Supabase Auth + fiche `membres`
- **`/login`** — connexion des administrateurs
- **`/dashboard`** — vue d'ensemble (statistiques, filtrées par périmètre via RLS)
- **`/dashboard/membres`** — liste des fiches de son périmètre, validation / rejet,
  et — pour l'Administrateur National uniquement — nomination d'un membre au poste
  d'Administrateur Région ou Sous-Région
- `middleware.ts` — protège `/dashboard/*`, redirige vers `/login` si non connecté

Toute la logique de permission (qui voit quoi, qui peut valider/nommer) est
appliquée par les policies RLS définies dans `../backend/supabase/migrations/` —
le code web ne fait qu'exécuter des requêtes Supabase normales.

## Reste à faire

- Upload de la photo d'identité (Supabase Storage) — nécessaire pour la carte de membre (Phase 2)
- Génération de la carte de membre (PDF + QR code) — Phase 2
- Export PDF/Excel du tableau de bord — Phase 3
- Module d'information (documents, conférences) — Phase 3
- Emails de confirmation Supabase Auth à personnaliser (charte, ton de la Coordination)

## Installation

```bash
cd web
npm install
cp .env.local.example .env.local   # renseigner avec les clés de `supabase start`
npm run dev
```

L'application suppose que le backend (`../backend`) tourne déjà en local
(`supabase start`) ou pointe vers un projet Supabase distant.

## Important

Ce code a été écrit et relu attentivement (vérification de syntaxe TypeScript
effectuée), mais n'a pas pu être exécuté avec `npm run dev` dans cet
environnement, faute d'accès réseau pour installer les dépendances. Fais un
premier `npm install && npm run dev` avant de t'appuyer dessus en production,
et signale-moi toute erreur d'exécution pour que je corrige.
