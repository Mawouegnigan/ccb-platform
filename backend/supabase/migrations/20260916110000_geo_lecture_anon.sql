-- ============================================================================
-- CCB Platform — Migration 5 : lecture publique de la géographie
-- La page /inscription est accessible avant connexion (auth.role() = 'anon').
-- Les policies existantes ("geo_lecture_authentifie") n'autorisaient que les
-- utilisateurs déjà connectés, laissant les dropdowns vides pour un nouveau
-- visiteur. Régions/sous-régions/paroisses ne sont pas des données
-- confidentielles : on ouvre leur lecture aussi aux visiteurs anonymes.
-- ============================================================================

create policy "geo_lecture_anon" on public.regions
  for select using (auth.role() = 'anon');

create policy "geo_lecture_anon" on public.sous_regions
  for select using (auth.role() = 'anon');

create policy "geo_lecture_anon" on public.paroisses
  for select using (auth.role() = 'anon');