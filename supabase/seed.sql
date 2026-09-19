-- ============================================================================
-- Données de référence — 12 départements du Bénin, chacun subdivisé en
-- 12 sous-régions nommées A à L (144 sous-régions au total).
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
-- Paroisses historiques réelles — rattachées à la sous-région A (vitrine) de
-- leur département respectif. Données de démonstration présentables.
-- ----------------------------------------------------------------------------

do $$
declare
  sr_id uuid;
begin
  select id into sr_id from public.sous_regions where nom = 'Ouémé A';
  insert into public.paroisses (nom, sous_region_id) values
    ('Paroisse Mère de Porto-Novo (Saint-Siège)', sr_id),
    ('Paroisse d''Akpro-Missérété', sr_id)
  on conflict (nom, sous_region_id) do nothing;

  select id into sr_id from public.sous_regions where nom = 'Littoral A';
  insert into public.paroisses (nom, sous_region_id) values
    ('Paroisse Mont Sinaï', sr_id),
    ('Paroisse de Cadjehoun', sr_id),
    ('Paroisse de Mènontin (Cité de Paix)', sr_id),
    ('Paroisse Saint Michel de Tanto Centre', sr_id),
    ('Paroisse d''Akpakpa', sr_id),
    ('Paroisse d''Akossombo', sr_id),
    ('Paroisse Saint Samuel', sr_id)
  on conflict (nom, sous_region_id) do nothing;

  select id into sr_id from public.sous_regions where nom = 'Atlantique A';
  insert into public.paroisses (nom, sous_region_id) values
    ('Paroisse Lumière du Christ (Hèvié Djêganto)', sr_id),
    ('Paroisse Saint Matthieu (Abomey-Calavi)', sr_id),
    ('Paroisse Ebenezer d''Oschoffa (Calavi)', sr_id),
    ('Paroisse Les 3 Anges (Zogbohoué)', sr_id)
  on conflict (nom, sous_region_id) do nothing;

  select id into sr_id from public.sous_regions where nom = 'Plateau A';
  insert into public.paroisses (nom, sous_region_id) values
    ('Paroisse Jesu-Kpégo Ayidjédo-Dodji Centre (Sakété)', sr_id),
    ('Paroisse de Pobè Centre', sr_id),
    ('Paroisse de Kétou', sr_id)
  on conflict (nom, sous_region_id) do nothing;

  select id into sr_id from public.sous_regions where nom = 'Mono A';
  insert into public.paroisses (nom, sous_region_id) values
    ('Paroisse Grand-Popo Centre', sr_id),
    ('Paroisse de Lokossa (Cité de Grâce)', sr_id)
  on conflict (nom, sous_region_id) do nothing;

  select id into sr_id from public.sous_regions where nom = 'Couffo A';
  insert into public.paroisses (nom, sous_region_id) values
    ('Paroisse de Dogbo', sr_id)
  on conflict (nom, sous_region_id) do nothing;

  select id into sr_id from public.sous_regions where nom = 'Zou A';
  insert into public.paroisses (nom, sous_region_id) values
    ('Paroisse Mère d''Abomey', sr_id),
    ('Paroisse de Bohicon (Gohého)', sr_id)
  on conflict (nom, sous_region_id) do nothing;

  select id into sr_id from public.sous_regions where nom = 'Collines A';
  insert into public.paroisses (nom, sous_region_id) values
    ('Paroisse de Dassa-Zoumé Centre', sr_id),
    ('Paroisse de Savalou', sr_id)
  on conflict (nom, sous_region_id) do nothing;

  select id into sr_id from public.sous_regions where nom = 'Borgou A';
  insert into public.paroisses (nom, sous_region_id) values
    ('Paroisse Mère de Parakou (Zongo)', sr_id),
    ('Paroisse Sacré-Cœur de Parakou', sr_id)
  on conflict (nom, sous_region_id) do nothing;

  select id into sr_id from public.sous_regions where nom = 'Alibori A';
  insert into public.paroisses (nom, sous_region_id) values
    ('Paroisse de Kandi', sr_id),
    ('Paroisse de Malanville (Frontière Nord)', sr_id)
  on conflict (nom, sous_region_id) do nothing;

  select id into sr_id from public.sous_regions where nom = 'Atacora A';
  insert into public.paroisses (nom, sous_region_id) values
    ('Paroisse de Natitingou Centre', sr_id)
  on conflict (nom, sous_region_id) do nothing;

  select id into sr_id from public.sous_regions where nom = 'Donga A';
  insert into public.paroisses (nom, sous_region_id) values
    ('Paroisse de Djougou', sr_id)
  on conflict (nom, sous_region_id) do nothing;
end $$;

-- ----------------------------------------------------------------------------
-- Complément de démonstration — au moins 5 paroisses par sous-région, noms
-- plausibles dans le style biblique/céleste déjà utilisé par l'église, pour
-- qu'aucune liste déroulante ne soit vide lors de la démo aux experts.
-- ----------------------------------------------------------------------------

do $$
declare
  noms_bibliques text[] := array[
    'Béthel','Sion','Emmanuel','Elim','Ebenezer','Horeb','Nazareth','Béthanie',
    'Cana','Patmos','Golgotha','Gethsémané','Jourdain','Carmel','Galilée',
    'Bethléem','Tabor','Siloé','Jéricho','Rédemption'
  ];
  sr_rec record;
  i int;
  idx int;
  compteur int := 0;
begin
  for sr_rec in select id, nom from public.sous_regions order by nom loop
    for i in 0..4 loop
      idx := ((compteur + i) % array_length(noms_bibliques, 1)) + 1;
      insert into public.paroisses (nom, sous_region_id)
      values (
        'Paroisse ' || noms_bibliques[idx] || ' — ' || sr_rec.nom,
        sr_rec.id
      )
      on conflict (nom, sous_region_id) do nothing;
    end loop;
    compteur := compteur + 3;
  end loop;
end $$;