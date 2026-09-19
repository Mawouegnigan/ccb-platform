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

do $$
declare
  sr_rec record;
begin
  for sr_rec in select id, nom from public.sous_regions loop
    insert into public.paroisses (nom, sous_region_id)
    values
      ('[FICTIF] Paroisse Centrale - ' || sr_rec.nom, sr_rec.id),
      ('[FICTIF] Paroisse Nord - ' || sr_rec.nom, sr_rec.id)
    on conflict (nom, sous_region_id) do nothing;
  end loop;
end $$;