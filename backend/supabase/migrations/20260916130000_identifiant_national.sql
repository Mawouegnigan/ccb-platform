-- ============================================================================
-- CCB Platform — Migration 6 : identifiant national des membres validés
-- Format : CCB-{CODE_REGION}{LETTRE_SOUS_REGION}-{NUMERO}
-- Exemple : CCB-LITG-0042
-- Numérotation nationale continue (un seul compteur, toutes régions
-- confondues), attribuée uniquement à la validation — pas à l'inscription,
-- pour ne pas "consommer" un numéro sur un compte finalement rejeté.
-- ============================================================================

-- Note : cette colonne est volontairement NOT NULL sans backfill ici —
-- au moment où les migrations s'exécutent (avant le seed), la table
-- regions est encore vide, donc aucune violation de contrainte. Les
-- codes sont fournis directement par seed.sql à l'insertion.
alter table public.regions add column code char(3) not null;

alter table public.membres add column identifiant text unique;

-- Compteur national unique, incrémenté à chaque validation.
create sequence public.identifiant_seq start 1;

create or replace function public.set_identifiant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code   text;
  v_lettre text;
  v_num    text;
begin
  if new.statut_validation = 'valide'
     and old.statut_validation is distinct from 'valide'
     and new.identifiant is null then

    select r.code, right(sr.nom, 1)
    into v_code, v_lettre
    from public.sous_regions sr
    join public.regions r on r.id = sr.region_id
    where sr.id = new.sous_region_id;

    v_num := lpad(nextval('public.identifiant_seq')::text, 4, '0');

    new.identifiant := 'CCB-' || coalesce(v_code, 'XXX') || coalesce(v_lettre, 'X') || '-' || v_num;
  end if;

  return new;
end;
$$;

create trigger trg_membres_set_identifiant
  before update of statut_validation on public.membres
  for each row execute function public.set_identifiant();