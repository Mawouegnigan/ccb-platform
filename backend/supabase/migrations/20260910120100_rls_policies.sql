-- ============================================================================
-- CCB Platform — Migration 2 : fonctions de périmètre, RLS, garde-fous
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Fonctions utilitaires (SECURITY DEFINER pour éviter la récursion RLS)
-- ----------------------------------------------------------------------------

create or replace function public.current_membre()
returns public.membres
language sql
security definer
stable
set search_path = public
as $$
  select * from public.membres where user_id = auth.uid();
$$;

create or replace function public.current_role()
returns public.role_type
language sql
security definer
stable
set search_path = public
as $$
  select role from public.membres where user_id = auth.uid();
$$;

create or replace function public.current_region_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select admin_region_id from public.membres where user_id = auth.uid();
$$;

create or replace function public.current_sous_region_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select admin_sous_region_id from public.membres where user_id = auth.uid();
$$;

-- Détection de doublons potentiels (nom + contact), utilisée par l'app
-- au moment de la validation par un administrateur.
create or replace function public.find_duplicate_membres(
  p_nom text,
  p_contact text,
  p_exclude_id uuid default null
)
returns setof public.membres
language sql
security definer
stable
set search_path = public
as $$
  select *
  from public.membres m
  where (m.id <> p_exclude_id or p_exclude_id is null)
    and (
      lower(btrim(m.nom)) = lower(btrim(p_nom))
      or lower(btrim(m.contact)) = lower(btrim(p_contact))
      or similarity(lower(btrim(m.nom)), lower(btrim(p_nom))) > 0.6
    );
$$;

-- ----------------------------------------------------------------------------
-- Garde-fou : seul l'Administrateur National peut changer le rôle
-- (nomination Administrateur Région / Sous-Région) et son périmètre.
-- Toute nomination est historisée dans roles_attribues.
-- ----------------------------------------------------------------------------

create or replace function public.guard_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_role public.role_type;
  acting_membre_id uuid;
begin
  if new.role is distinct from old.role
     or new.admin_region_id is distinct from old.admin_region_id
     or new.admin_sous_region_id is distinct from old.admin_sous_region_id then

    select role, id into acting_role, acting_membre_id
    from public.membres where user_id = auth.uid();

    if acting_role is distinct from 'admin_national' then
      raise exception 'Seul l''Administrateur National peut nommer ou modifier un rôle d''administrateur.';
    end if;

    insert into public.roles_attribues (
      membre_id, role_attribue, perimetre_type, perimetre_id, attribue_par
    ) values (
      new.id,
      new.role,
      case
        when new.role = 'admin_region' then 'region'
        when new.role = 'admin_sous_region' then 'sous_region'
        else null
      end,
      coalesce(new.admin_region_id, new.admin_sous_region_id),
      acting_membre_id
    );
  end if;

  return new;
end;
$$;

create trigger trg_membres_guard_role_change
  before update of role, admin_region_id, admin_sous_region_id on public.membres
  for each row execute function public.guard_role_change();

-- ----------------------------------------------------------------------------
-- Activation de RLS
-- ----------------------------------------------------------------------------

alter table public.regions enable row level security;
alter table public.sous_regions enable row level security;
alter table public.paroisses enable row level security;
alter table public.membres enable row level security;
alter table public.roles_attribues enable row level security;
alter table public.documents enable row level security;

-- ----------------------------------------------------------------------------
-- Régions / Sous-régions / Paroisses
-- Lecture ouverte à tout utilisateur authentifié (listes déroulantes
-- d'inscription) ; écriture réservée à l'Administrateur National.
-- ----------------------------------------------------------------------------

create policy "geo_lecture_authentifie" on public.regions
  for select using (auth.role() = 'authenticated');
create policy "geo_ecriture_admin_national" on public.regions
  for all using (public.current_role() = 'admin_national')
  with check (public.current_role() = 'admin_national');

create policy "geo_lecture_authentifie" on public.sous_regions
  for select using (auth.role() = 'authenticated');
create policy "geo_ecriture_admin_national" on public.sous_regions
  for all using (public.current_role() = 'admin_national')
  with check (public.current_role() = 'admin_national');

create policy "geo_lecture_authentifie" on public.paroisses
  for select using (auth.role() = 'authenticated');
create policy "geo_ecriture_admin_national" on public.paroisses
  for all using (public.current_role() = 'admin_national')
  with check (public.current_role() = 'admin_national');

-- ----------------------------------------------------------------------------
-- Membres
-- ----------------------------------------------------------------------------

-- Lecture : chacun voit son périmètre (cf. cahier des charges §3.4)
create policy "membres_lecture_national" on public.membres
  for select using (public.current_role() = 'admin_national');

create policy "membres_lecture_region" on public.membres
  for select using (
    public.current_role() = 'admin_region'
    and region_id = public.current_region_id()
  );

create policy "membres_lecture_sous_region" on public.membres
  for select using (
    public.current_role() = 'admin_sous_region'
    and sous_region_id = public.current_sous_region_id()
  );

create policy "membres_lecture_soi_meme" on public.membres
  for select using (user_id = auth.uid());

-- Insertion : auto-inscription — un utilisateur authentifié crée sa
-- propre fiche, avec le rôle par défaut "membre" et statut "en attente".
create policy "membres_auto_inscription" on public.membres
  for insert with check (
    user_id = auth.uid()
    and role = 'membre'
    and statut_validation = 'en_attente'
  );

-- L'Administrateur National peut aussi créer/importer des fiches (ex. admins)
create policy "membres_insertion_admin_national" on public.membres
  for insert with check (public.current_role() = 'admin_national');

-- Mise à jour : le membre modifie sa propre fiche (hors rôle/périmètre,
-- protégé par le trigger guard_role_change) ; les admins valident/modifient
-- selon leur périmètre ; l'Administrateur National a un accès complet.
create policy "membres_maj_soi_meme" on public.membres
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "membres_maj_sous_region" on public.membres
  for update using (
    public.current_role() = 'admin_sous_region'
    and sous_region_id = public.current_sous_region_id()
  )
  with check (
    public.current_role() = 'admin_sous_region'
    and sous_region_id = public.current_sous_region_id()
  );

create policy "membres_maj_region" on public.membres
  for update using (
    public.current_role() = 'admin_region'
    and region_id = public.current_region_id()
  )
  with check (
    public.current_role() = 'admin_region'
    and region_id = public.current_region_id()
  );

create policy "membres_maj_national" on public.membres
  for update using (public.current_role() = 'admin_national')
  with check (public.current_role() = 'admin_national');

-- ----------------------------------------------------------------------------
-- Historique des nominations : lecture par les administrateurs, écriture
-- exclusivement via le trigger guard_role_change (SECURITY DEFINER).
-- ----------------------------------------------------------------------------

create policy "roles_attribues_lecture_admins" on public.roles_attribues
  for select using (
    public.current_role() in ('admin_national', 'admin_region', 'admin_sous_region')
  );

-- ----------------------------------------------------------------------------
-- Documents (module d'information — diffusion descendante)
-- Lecture : tout utilisateur authentifié. Écriture : administrateurs.
-- ----------------------------------------------------------------------------

create policy "documents_lecture_authentifie" on public.documents
  for select using (auth.role() = 'authenticated');

create policy "documents_ecriture_admins" on public.documents
  for all using (
    public.current_role() in ('admin_national', 'admin_region', 'admin_sous_region')
  )
  with check (
    public.current_role() in ('admin_national', 'admin_region', 'admin_sous_region')
    and publie_par = (public.current_membre()).id
  );
