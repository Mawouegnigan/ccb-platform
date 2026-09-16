-- ============================================================================
-- Données de référence — 12 départements du Bénin, chacun subdivisé en
-- 12 sous-régions nommées A à L (144 sous-régions au total).
-- Les paroisses ne sont pas encore renseignées : à ajouter au fur et à
-- mesure avec la Coordination (une paroisse appartient à une sous-région).
-- ============================================================================

insert into public.regions (nom, code) values
  ('Alibori', 'ALI'),
  ('Atacora', 'ATA'),
  ('Atlantique', 'ATL'),
  ('Borgou', 'BOR'),
  ('Collines', 'COL'),
  ('Couffo', 'COU'),
  ('Donga', 'DON'),
  ('Littoral', 'LIT'),
  ('Mono', 'MON'),
  ('Ouémé', 'OUE'),
  ('Plateau', 'PLA'),
  ('Zou', 'ZOU')
on conflict (nom) do nothing;

do $$
declare
  region_rec record;
  lettre text;
begin
  for region_rec in select id, nom from public.regions loop
    foreach lettre in array array['A','B','C','D','E','F','G','H','I','J','K','L'] loop
      insert into public.sous_regions (nom, region_id)
      values (region_rec.nom || ' ' || lettre, region_rec.id)
      on conflict (nom, region_id) do nothing;
    end loop;
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- Paroisses FICTIVES — donnÃ©es de test uniquement, prÃ©fixÃ©es "[FICTIF]"
-- pour repÃ©rage sans ambiguÃ¯tÃ©. Ã€ supprimer intÃ©gralement quand les vraies
-- paroisses seront saisies avec la Coordination (Ã©tape 5 de la feuille de
-- route). 2 paroisses par sous-rÃ©gion, suffisant pour tester la cascade
-- RÃ©gion â†’ Sous-rÃ©gion â†’ Paroisse de bout en bout.
-- ----------------------------------------------------------------------------

do $$
declare
  sr_rec record;
begin
  for sr_rec in select id, nom from public.sous_regions loop
    insert into public.paroisses (nom, sous_region_id)
    values
      ('[FICTIF] Paroisse Centrale â€” ' || sr_rec.nom, sr_rec.id),
      ('[FICTIF] Paroisse Nord â€” ' || sr_rec.nom, sr_rec.id)
    on conflict (nom, sous_region_id) do nothing;
  end loop;
end $$;