# Web — Dashboard (Next.js)

Dashboard de gestion pour les rôles Administrateur National / Région / Sous-Région.

## Fonctionnalités prévues (Phase 1 — MVP)

- Formulaire d'auto-inscription des membres
- Circuit de validation hiérarchique (sous-région → région → national)
- Détection de doublons (nom + contact)
- Vue filtrée par périmètre selon le rôle connecté
- Tableau de bord (statistiques, export PDF/Excel)

## À initialiser

```bash
npx create-next-app@latest . --typescript --tailwind --app
```

Puis connecter le client Supabase (`@supabase/supabase-js`) une fois `backend/` provisionné.
