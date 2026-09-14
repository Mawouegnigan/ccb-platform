-- ============================================================================
-- CCB Platform — Migration 1 : schéma de base
-- Régions > Sous-régions > Paroisses > Membres, historique de nomination,
-- module d'information. Réf. Cahier des charges v2.2.
-- ============================================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "pg_trgm";    -- similarité de texte (doublons)

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------

create type public.role_type as enum (
  'admin_national',
  'admin_region',
  'admin_sous_region',
  'membre'
);

create type public.membre_statut as enum (
  'moniteur',
  'assistant'
);

create type public.validation_statut as enum (
  'en_attente',
  'valide',
  'rejete'
);

create type public.document_type as enum (
  'circulaire',
  'support_formation',
  'conference_video',
  'conference_image',
  'autre'
);

-- ----------------------------------------------------------------------------
-- Géographie : régions > sous-régions > paroisses
-- ----------------------------------------------------------------------------

create table public.regions (
  id          uuid primary key default gen_random_uuid(),
  nom         text not null unique,
  created_at  timestamptz not null default now()
);

create table public.sous_regions (
  id          uuid primary key default gen_random_uuid(),
  nom         text not null,
  region_id   uuid not null references public.regions(id) on delete restrict,
  created_at  timestamptz not null default now(),
  unique (nom, region_id)
);

create table public.paroisses (
  id             uuid primary key default gen_random_uuid(),
  nom            text not null,
  sous_region_id uuid not null references public.sous_regions(id) on delete restrict,
  created_at     timestamptz not null default now(),
  unique (nom, sous_region_id)
);

create index idx_sous_regions_region_id on public.sous_regions(region_id);
create index idx_paroisses_sous_region_id on public.paroisses(sous_region_id);

-- ----------------------------------------------------------------------------
-- Membres (moniteurs / assistants / admins)
-- ----------------------------------------------------------------------------

create table public.membres (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid unique references auth.users(id) on delete set null,

  nom                 text not null,
  prenoms             text not null,
  statut              public.membre_statut not null,
  poste               text,                      -- ex. Président, Vice-Président (bureau)
  contact             text not null,              -- téléphone / email

  paroisse_id         uuid references public.paroisses(id) on delete restrict,
  sous_region_id      uuid references public.sous_regions(id) on delete restrict,
  region_id           uuid references public.regions(id) on delete restrict, -- déduit automatiquement

  photo_url           text,

  role                public.role_type not null default 'membre',
  -- périmètre de gestion si le membre est admin région / sous-région
  admin_region_id      uuid references public.regions(id),
  admin_sous_region_id uuid references public.sous_regions(id),

  statut_validation   public.validation_statut not null default 'en_attente',
  date_inscription     timestamptz not null default now(),
  date_validation       timestamptz,
  valide_par           uuid references public.membres(id),

  charte_acceptee       boolean not null default false,
  reglement_interieur_accepte boolean not null default false,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- Le périmètre de gestion doit correspondre au rôle attribué
  constraint chk_perimetre_role check (
    (role = 'admin_national') or
    (role = 'admin_region' and admin_region_id is not null) or
    (role = 'admin_sous_region' and admin_sous_region_id is not null) or
    (role = 'membre')
  ),
  -- Un moniteur/assistant doit être rattaché à une sous-région dès l'inscription
  constraint chk_sous_region_membre check (
    role <> 'membre' or sous_region_id is not null
  )
);

create index idx_membres_sous_region_id on public.membres(sous_region_id);
create index idx_membres_region_id on public.membres(region_id);
create index idx_membres_role on public.membres(role);
create index idx_membres_statut_validation on public.membres(statut_validation);
create index idx_membres_user_id on public.membres(user_id);

-- Détection de doublons : index trigram sur nom + contact normalisés.
-- Le blocage strict est laissé à l'application (au moment de la validation),
-- voir la fonction find_duplicate_membres() en migration 2.
create index idx_membres_nom_trgm on public.membres using gin (lower(btrim(nom)) gin_trgm_ops);
create index idx_membres_contact_trgm on public.membres using gin (lower(btrim(contact)) gin_trgm_ops);

-- ----------------------------------------------------------------------------
-- Historique des nominations (Superviseur/Administrateur National → admins)
-- ----------------------------------------------------------------------------

create table public.roles_attribues (
  id                uuid primary key default gen_random_uuid(),
  membre_id         uuid not null references public.membres(id) on delete cascade,
  role_attribue     public.role_type not null,
  perimetre_type    text check (perimetre_type in ('region', 'sous_region')),
  perimetre_id      uuid,
  attribue_par      uuid not null references public.membres(id),
  date_attribution  timestamptz not null default now()
);

create index idx_roles_attribues_membre_id on public.roles_attribues(membre_id);

-- ----------------------------------------------------------------------------
-- Module d'information (diffusion descendante Coordination → membres)
-- ----------------------------------------------------------------------------

create table public.documents (
  id               uuid primary key default gen_random_uuid(),
  titre            text not null,
  description      text,
  fichier_url      text,
  type             public.document_type not null,
  publie_par       uuid not null references public.membres(id),
  date_publication timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Triggers utilitaires
-- ----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_membres_updated_at
  before update on public.membres
  for each row execute function public.set_updated_at();

create trigger trg_documents_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

-- Déduction automatique de la région à partir de la sous-région
create or replace function public.derive_region_from_sous_region()
returns trigger
language plpgsql
as $$
begin
  if new.sous_region_id is not null then
    select region_id into new.region_id
    from public.sous_regions
    where id = new.sous_region_id;
  else
    new.region_id := null;
  end if;
  return new;
end;
$$;

create trigger trg_membres_derive_region
  before insert or update of sous_region_id on public.membres
  for each row execute function public.derive_region_from_sous_region();

-- Horodatage automatique de la validation
create or replace function public.set_date_validation()
returns trigger
language plpgsql
as $$
begin
  if new.statut_validation in ('valide', 'rejete')
     and old.statut_validation = 'en_attente' then
    new.date_validation := now();
  end if;
  return new;
end;
$$;

create trigger trg_membres_date_validation
  before update of statut_validation on public.membres
  for each row execute function public.set_date_validation();
