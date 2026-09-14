-- ============================================================================
-- Données de référence — 12 départements du Bénin, chacun subdivisé en
-- 12 sous-régions nommées A à L (144 sous-régions au total).
-- Les paroisses ne sont pas encore renseignées : à ajouter au fur et à
-- mesure avec la Coordination (une paroisse appartient à une sous-région).
-- ============================================================================

insert into public.regions (nom) values
  ('Alibori'),
  ('Atacora'),
  ('Atlantique'),
  ('Borgou'),
  ('Collines'),
  ('Couffo'),
  ('Donga'),
  ('Littoral'),
  ('Mono'),
  ('Ouémé'),
  ('Plateau'),
  ('Zou')
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