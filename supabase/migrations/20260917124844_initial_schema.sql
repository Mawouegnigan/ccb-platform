create extension if not exists "pg_trgm" with schema "public";

create type "public"."document_type" as enum ('circulaire', 'support_formation', 'conference_video', 'conference_image', 'autre');

create type "public"."membre_statut" as enum ('moniteur', 'assistant');

create type "public"."role_type" as enum ('admin_national', 'admin_region', 'admin_sous_region', 'membre');

create type "public"."validation_statut" as enum ('en_attente', 'valide', 'rejete');

create sequence "public"."identifiant_seq";


  create table "public"."documents" (
    "id" uuid not null default gen_random_uuid(),
    "titre" text not null,
    "description" text,
    "fichier_url" text,
    "type" public.document_type not null,
    "publie_par" uuid not null,
    "date_publication" timestamp with time zone not null default now(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."documents" enable row level security;


  create table "public"."membres" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "nom" text not null,
    "prenoms" text not null,
    "statut" public.membre_statut not null,
    "poste" text,
    "contact" text not null,
    "paroisse_id" uuid,
    "sous_region_id" uuid,
    "region_id" uuid,
    "photo_url" text,
    "role" public.role_type not null default 'membre'::public.role_type,
    "admin_region_id" uuid,
    "admin_sous_region_id" uuid,
    "statut_validation" public.validation_statut not null default 'en_attente'::public.validation_statut,
    "date_inscription" timestamp with time zone not null default now(),
    "date_validation" timestamp with time zone,
    "valide_par" uuid,
    "charte_acceptee" boolean not null default false,
    "reglement_interieur_accepte" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "identifiant" text
      );


alter table "public"."membres" enable row level security;


  create table "public"."paroisses" (
    "id" uuid not null default gen_random_uuid(),
    "nom" text not null,
    "sous_region_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."paroisses" enable row level security;


  create table "public"."regions" (
    "id" uuid not null default gen_random_uuid(),
    "nom" text not null,
    "created_at" timestamp with time zone not null default now(),
    "code" character(3) not null
      );


alter table "public"."regions" enable row level security;


  create table "public"."roles_attribues" (
    "id" uuid not null default gen_random_uuid(),
    "membre_id" uuid not null,
    "role_attribue" public.role_type not null,
    "perimetre_type" text,
    "perimetre_id" uuid,
    "attribue_par" uuid not null,
    "date_attribution" timestamp with time zone not null default now()
      );


alter table "public"."roles_attribues" enable row level security;


  create table "public"."sous_regions" (
    "id" uuid not null default gen_random_uuid(),
    "nom" text not null,
    "region_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."sous_regions" enable row level security;

CREATE UNIQUE INDEX documents_pkey ON public.documents USING btree (id);

CREATE INDEX idx_membres_contact_trgm ON public.membres USING gin (lower(btrim(contact)) public.gin_trgm_ops);

CREATE INDEX idx_membres_nom_trgm ON public.membres USING gin (lower(btrim(nom)) public.gin_trgm_ops);

CREATE INDEX idx_membres_region_id ON public.membres USING btree (region_id);

CREATE INDEX idx_membres_role ON public.membres USING btree (role);

CREATE INDEX idx_membres_sous_region_id ON public.membres USING btree (sous_region_id);

CREATE INDEX idx_membres_statut_validation ON public.membres USING btree (statut_validation);

CREATE INDEX idx_membres_user_id ON public.membres USING btree (user_id);

CREATE INDEX idx_paroisses_sous_region_id ON public.paroisses USING btree (sous_region_id);

CREATE INDEX idx_roles_attribues_membre_id ON public.roles_attribues USING btree (membre_id);

CREATE INDEX idx_sous_regions_region_id ON public.sous_regions USING btree (region_id);

CREATE UNIQUE INDEX membres_identifiant_key ON public.membres USING btree (identifiant);

CREATE UNIQUE INDEX membres_pkey ON public.membres USING btree (id);

CREATE UNIQUE INDEX membres_user_id_key ON public.membres USING btree (user_id);

CREATE UNIQUE INDEX paroisses_nom_sous_region_id_key ON public.paroisses USING btree (nom, sous_region_id);

CREATE UNIQUE INDEX paroisses_pkey ON public.paroisses USING btree (id);

CREATE UNIQUE INDEX regions_nom_key ON public.regions USING btree (nom);

CREATE UNIQUE INDEX regions_pkey ON public.regions USING btree (id);

CREATE UNIQUE INDEX roles_attribues_pkey ON public.roles_attribues USING btree (id);

CREATE UNIQUE INDEX sous_regions_nom_region_id_key ON public.sous_regions USING btree (nom, region_id);

CREATE UNIQUE INDEX sous_regions_pkey ON public.sous_regions USING btree (id);

alter table "public"."documents" add constraint "documents_pkey" PRIMARY KEY using index "documents_pkey";

alter table "public"."membres" add constraint "membres_pkey" PRIMARY KEY using index "membres_pkey";

alter table "public"."paroisses" add constraint "paroisses_pkey" PRIMARY KEY using index "paroisses_pkey";

alter table "public"."regions" add constraint "regions_pkey" PRIMARY KEY using index "regions_pkey";

alter table "public"."roles_attribues" add constraint "roles_attribues_pkey" PRIMARY KEY using index "roles_attribues_pkey";

alter table "public"."sous_regions" add constraint "sous_regions_pkey" PRIMARY KEY using index "sous_regions_pkey";

alter table "public"."documents" add constraint "documents_publie_par_fkey" FOREIGN KEY (publie_par) REFERENCES public.membres(id) not valid;

alter table "public"."documents" validate constraint "documents_publie_par_fkey";

alter table "public"."membres" add constraint "chk_perimetre_role" CHECK (((role = 'admin_national'::public.role_type) OR ((role = 'admin_region'::public.role_type) AND (admin_region_id IS NOT NULL)) OR ((role = 'admin_sous_region'::public.role_type) AND (admin_sous_region_id IS NOT NULL)) OR (role = 'membre'::public.role_type))) not valid;

alter table "public"."membres" validate constraint "chk_perimetre_role";

alter table "public"."membres" add constraint "chk_sous_region_membre" CHECK (((role <> 'membre'::public.role_type) OR (sous_region_id IS NOT NULL))) not valid;

alter table "public"."membres" validate constraint "chk_sous_region_membre";

alter table "public"."membres" add constraint "membres_admin_region_id_fkey" FOREIGN KEY (admin_region_id) REFERENCES public.regions(id) not valid;

alter table "public"."membres" validate constraint "membres_admin_region_id_fkey";

alter table "public"."membres" add constraint "membres_admin_sous_region_id_fkey" FOREIGN KEY (admin_sous_region_id) REFERENCES public.sous_regions(id) not valid;

alter table "public"."membres" validate constraint "membres_admin_sous_region_id_fkey";

alter table "public"."membres" add constraint "membres_identifiant_key" UNIQUE using index "membres_identifiant_key";

alter table "public"."membres" add constraint "membres_paroisse_id_fkey" FOREIGN KEY (paroisse_id) REFERENCES public.paroisses(id) ON DELETE RESTRICT not valid;

alter table "public"."membres" validate constraint "membres_paroisse_id_fkey";

alter table "public"."membres" add constraint "membres_region_id_fkey" FOREIGN KEY (region_id) REFERENCES public.regions(id) ON DELETE RESTRICT not valid;

alter table "public"."membres" validate constraint "membres_region_id_fkey";

alter table "public"."membres" add constraint "membres_sous_region_id_fkey" FOREIGN KEY (sous_region_id) REFERENCES public.sous_regions(id) ON DELETE RESTRICT not valid;

alter table "public"."membres" validate constraint "membres_sous_region_id_fkey";

alter table "public"."membres" add constraint "membres_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."membres" validate constraint "membres_user_id_fkey";

alter table "public"."membres" add constraint "membres_user_id_key" UNIQUE using index "membres_user_id_key";

alter table "public"."membres" add constraint "membres_valide_par_fkey" FOREIGN KEY (valide_par) REFERENCES public.membres(id) not valid;

alter table "public"."membres" validate constraint "membres_valide_par_fkey";

alter table "public"."paroisses" add constraint "paroisses_nom_sous_region_id_key" UNIQUE using index "paroisses_nom_sous_region_id_key";

alter table "public"."paroisses" add constraint "paroisses_sous_region_id_fkey" FOREIGN KEY (sous_region_id) REFERENCES public.sous_regions(id) ON DELETE RESTRICT not valid;

alter table "public"."paroisses" validate constraint "paroisses_sous_region_id_fkey";

alter table "public"."regions" add constraint "regions_nom_key" UNIQUE using index "regions_nom_key";

alter table "public"."roles_attribues" add constraint "roles_attribues_attribue_par_fkey" FOREIGN KEY (attribue_par) REFERENCES public.membres(id) not valid;

alter table "public"."roles_attribues" validate constraint "roles_attribues_attribue_par_fkey";

alter table "public"."roles_attribues" add constraint "roles_attribues_membre_id_fkey" FOREIGN KEY (membre_id) REFERENCES public.membres(id) ON DELETE CASCADE not valid;

alter table "public"."roles_attribues" validate constraint "roles_attribues_membre_id_fkey";

alter table "public"."roles_attribues" add constraint "roles_attribues_perimetre_type_check" CHECK ((perimetre_type = ANY (ARRAY['region'::text, 'sous_region'::text]))) not valid;

alter table "public"."roles_attribues" validate constraint "roles_attribues_perimetre_type_check";

alter table "public"."sous_regions" add constraint "sous_regions_nom_region_id_key" UNIQUE using index "sous_regions_nom_region_id_key";

alter table "public"."sous_regions" add constraint "sous_regions_region_id_fkey" FOREIGN KEY (region_id) REFERENCES public.regions(id) ON DELETE RESTRICT not valid;

alter table "public"."sous_regions" validate constraint "sous_regions_region_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.current_membre()
 RETURNS public.membres
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select * from public.membres where user_id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.current_region_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select admin_region_id from public.membres where user_id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public."current_role"()
 RETURNS public.role_type
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select role from public.membres where user_id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.current_sous_region_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select admin_sous_region_id from public.membres where user_id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.derive_region_from_sous_region()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.find_duplicate_membres(p_nom text, p_contact text, p_exclude_id uuid DEFAULT NULL::uuid)
 RETURNS SETOF public.membres
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select *
  from public.membres m
  where (m.id <> p_exclude_id or p_exclude_id is null)
    and (
      lower(btrim(m.nom)) = lower(btrim(p_nom))
      or lower(btrim(m.contact)) = lower(btrim(p_contact))
      or similarity(lower(btrim(m.nom)), lower(btrim(p_nom))) > 0.6
    );
$function$
;

CREATE OR REPLACE FUNCTION public.guard_role_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.guard_validation_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  acting public.membres;
begin
  if new.statut_validation is distinct from old.statut_validation then
    select * into acting from public.membres where user_id = auth.uid();

    if acting.role = 'admin_national' then
      return new;
    elsif acting.role = 'admin_region' and acting.admin_region_id = old.region_id then
      return new;
    elsif acting.role = 'admin_sous_region' and acting.admin_sous_region_id = old.sous_region_id then
      return new;
    else
      raise exception 'Seul un administrateur de votre périmètre peut valider ou rejeter cette fiche.';
    end if;
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_date_validation()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if new.statut_validation in ('valide', 'rejete')
     and old.statut_validation = 'en_attente' then
    new.date_validation := now();
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_identifiant()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

grant delete on table "public"."documents" to "anon";

grant insert on table "public"."documents" to "anon";

grant references on table "public"."documents" to "anon";

grant select on table "public"."documents" to "anon";

grant trigger on table "public"."documents" to "anon";

grant truncate on table "public"."documents" to "anon";

grant update on table "public"."documents" to "anon";

grant delete on table "public"."documents" to "authenticated";

grant insert on table "public"."documents" to "authenticated";

grant references on table "public"."documents" to "authenticated";

grant select on table "public"."documents" to "authenticated";

grant trigger on table "public"."documents" to "authenticated";

grant truncate on table "public"."documents" to "authenticated";

grant update on table "public"."documents" to "authenticated";

grant delete on table "public"."documents" to "service_role";

grant insert on table "public"."documents" to "service_role";

grant references on table "public"."documents" to "service_role";

grant select on table "public"."documents" to "service_role";

grant trigger on table "public"."documents" to "service_role";

grant truncate on table "public"."documents" to "service_role";

grant update on table "public"."documents" to "service_role";

grant delete on table "public"."membres" to "anon";

grant insert on table "public"."membres" to "anon";

grant references on table "public"."membres" to "anon";

grant select on table "public"."membres" to "anon";

grant trigger on table "public"."membres" to "anon";

grant truncate on table "public"."membres" to "anon";

grant update on table "public"."membres" to "anon";

grant delete on table "public"."membres" to "authenticated";

grant insert on table "public"."membres" to "authenticated";

grant references on table "public"."membres" to "authenticated";

grant select on table "public"."membres" to "authenticated";

grant trigger on table "public"."membres" to "authenticated";

grant truncate on table "public"."membres" to "authenticated";

grant update on table "public"."membres" to "authenticated";

grant delete on table "public"."membres" to "service_role";

grant insert on table "public"."membres" to "service_role";

grant references on table "public"."membres" to "service_role";

grant select on table "public"."membres" to "service_role";

grant trigger on table "public"."membres" to "service_role";

grant truncate on table "public"."membres" to "service_role";

grant update on table "public"."membres" to "service_role";

grant delete on table "public"."paroisses" to "anon";

grant insert on table "public"."paroisses" to "anon";

grant references on table "public"."paroisses" to "anon";

grant select on table "public"."paroisses" to "anon";

grant trigger on table "public"."paroisses" to "anon";

grant truncate on table "public"."paroisses" to "anon";

grant update on table "public"."paroisses" to "anon";

grant delete on table "public"."paroisses" to "authenticated";

grant insert on table "public"."paroisses" to "authenticated";

grant references on table "public"."paroisses" to "authenticated";

grant select on table "public"."paroisses" to "authenticated";

grant trigger on table "public"."paroisses" to "authenticated";

grant truncate on table "public"."paroisses" to "authenticated";

grant update on table "public"."paroisses" to "authenticated";

grant delete on table "public"."paroisses" to "service_role";

grant insert on table "public"."paroisses" to "service_role";

grant references on table "public"."paroisses" to "service_role";

grant select on table "public"."paroisses" to "service_role";

grant trigger on table "public"."paroisses" to "service_role";

grant truncate on table "public"."paroisses" to "service_role";

grant update on table "public"."paroisses" to "service_role";

grant delete on table "public"."regions" to "anon";

grant insert on table "public"."regions" to "anon";

grant references on table "public"."regions" to "anon";

grant select on table "public"."regions" to "anon";

grant trigger on table "public"."regions" to "anon";

grant truncate on table "public"."regions" to "anon";

grant update on table "public"."regions" to "anon";

grant delete on table "public"."regions" to "authenticated";

grant insert on table "public"."regions" to "authenticated";

grant references on table "public"."regions" to "authenticated";

grant select on table "public"."regions" to "authenticated";

grant trigger on table "public"."regions" to "authenticated";

grant truncate on table "public"."regions" to "authenticated";

grant update on table "public"."regions" to "authenticated";

grant delete on table "public"."regions" to "service_role";

grant insert on table "public"."regions" to "service_role";

grant references on table "public"."regions" to "service_role";

grant select on table "public"."regions" to "service_role";

grant trigger on table "public"."regions" to "service_role";

grant truncate on table "public"."regions" to "service_role";

grant update on table "public"."regions" to "service_role";

grant delete on table "public"."roles_attribues" to "anon";

grant insert on table "public"."roles_attribues" to "anon";

grant references on table "public"."roles_attribues" to "anon";

grant select on table "public"."roles_attribues" to "anon";

grant trigger on table "public"."roles_attribues" to "anon";

grant truncate on table "public"."roles_attribues" to "anon";

grant update on table "public"."roles_attribues" to "anon";

grant delete on table "public"."roles_attribues" to "authenticated";

grant insert on table "public"."roles_attribues" to "authenticated";

grant references on table "public"."roles_attribues" to "authenticated";

grant select on table "public"."roles_attribues" to "authenticated";

grant trigger on table "public"."roles_attribues" to "authenticated";

grant truncate on table "public"."roles_attribues" to "authenticated";

grant update on table "public"."roles_attribues" to "authenticated";

grant delete on table "public"."roles_attribues" to "service_role";

grant insert on table "public"."roles_attribues" to "service_role";

grant references on table "public"."roles_attribues" to "service_role";

grant select on table "public"."roles_attribues" to "service_role";

grant trigger on table "public"."roles_attribues" to "service_role";

grant truncate on table "public"."roles_attribues" to "service_role";

grant update on table "public"."roles_attribues" to "service_role";

grant delete on table "public"."sous_regions" to "anon";

grant insert on table "public"."sous_regions" to "anon";

grant references on table "public"."sous_regions" to "anon";

grant select on table "public"."sous_regions" to "anon";

grant trigger on table "public"."sous_regions" to "anon";

grant truncate on table "public"."sous_regions" to "anon";

grant update on table "public"."sous_regions" to "anon";

grant delete on table "public"."sous_regions" to "authenticated";

grant insert on table "public"."sous_regions" to "authenticated";

grant references on table "public"."sous_regions" to "authenticated";

grant select on table "public"."sous_regions" to "authenticated";

grant trigger on table "public"."sous_regions" to "authenticated";

grant truncate on table "public"."sous_regions" to "authenticated";

grant update on table "public"."sous_regions" to "authenticated";

grant delete on table "public"."sous_regions" to "service_role";

grant insert on table "public"."sous_regions" to "service_role";

grant references on table "public"."sous_regions" to "service_role";

grant select on table "public"."sous_regions" to "service_role";

grant trigger on table "public"."sous_regions" to "service_role";

grant truncate on table "public"."sous_regions" to "service_role";

grant update on table "public"."sous_regions" to "service_role";


  create policy "documents_ecriture_admins"
  on "public"."documents"
  as permissive
  for all
  to public
using ((public."current_role"() = ANY (ARRAY['admin_national'::public.role_type, 'admin_region'::public.role_type, 'admin_sous_region'::public.role_type])))
with check (((public."current_role"() = ANY (ARRAY['admin_national'::public.role_type, 'admin_region'::public.role_type, 'admin_sous_region'::public.role_type])) AND (publie_par = (public.current_membre()).id)));



  create policy "documents_lecture_authentifie"
  on "public"."documents"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "membres_auto_inscription"
  on "public"."membres"
  as permissive
  for insert
  to public
with check (((user_id = auth.uid()) AND (role = 'membre'::public.role_type) AND (statut_validation = 'en_attente'::public.validation_statut)));



  create policy "membres_insertion_admin_national"
  on "public"."membres"
  as permissive
  for insert
  to public
with check ((public."current_role"() = 'admin_national'::public.role_type));



  create policy "membres_lecture_national"
  on "public"."membres"
  as permissive
  for select
  to public
using ((public."current_role"() = 'admin_national'::public.role_type));



  create policy "membres_lecture_region"
  on "public"."membres"
  as permissive
  for select
  to public
using (((public."current_role"() = 'admin_region'::public.role_type) AND (region_id = public.current_region_id())));



  create policy "membres_lecture_soi_meme"
  on "public"."membres"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "membres_lecture_sous_region"
  on "public"."membres"
  as permissive
  for select
  to public
using (((public."current_role"() = 'admin_sous_region'::public.role_type) AND (sous_region_id = public.current_sous_region_id())));



  create policy "membres_maj_national"
  on "public"."membres"
  as permissive
  for update
  to public
using ((public."current_role"() = 'admin_national'::public.role_type))
with check ((public."current_role"() = 'admin_national'::public.role_type));



  create policy "membres_maj_region"
  on "public"."membres"
  as permissive
  for update
  to public
using (((public."current_role"() = 'admin_region'::public.role_type) AND (region_id = public.current_region_id())))
with check (((public."current_role"() = 'admin_region'::public.role_type) AND (region_id = public.current_region_id())));



  create policy "membres_maj_soi_meme"
  on "public"."membres"
  as permissive
  for update
  to public
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));



  create policy "membres_maj_sous_region"
  on "public"."membres"
  as permissive
  for update
  to public
using (((public."current_role"() = 'admin_sous_region'::public.role_type) AND (sous_region_id = public.current_sous_region_id())))
with check (((public."current_role"() = 'admin_sous_region'::public.role_type) AND (sous_region_id = public.current_sous_region_id())));



  create policy "geo_ecriture_admin_national"
  on "public"."paroisses"
  as permissive
  for all
  to public
using ((public."current_role"() = 'admin_national'::public.role_type))
with check ((public."current_role"() = 'admin_national'::public.role_type));



  create policy "geo_lecture_anon"
  on "public"."paroisses"
  as permissive
  for select
  to public
using ((auth.role() = 'anon'::text));



  create policy "geo_lecture_authentifie"
  on "public"."paroisses"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "geo_ecriture_admin_national"
  on "public"."regions"
  as permissive
  for all
  to public
using ((public."current_role"() = 'admin_national'::public.role_type))
with check ((public."current_role"() = 'admin_national'::public.role_type));



  create policy "geo_lecture_anon"
  on "public"."regions"
  as permissive
  for select
  to public
using ((auth.role() = 'anon'::text));



  create policy "geo_lecture_authentifie"
  on "public"."regions"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "roles_attribues_lecture_admins"
  on "public"."roles_attribues"
  as permissive
  for select
  to public
using ((public."current_role"() = ANY (ARRAY['admin_national'::public.role_type, 'admin_region'::public.role_type, 'admin_sous_region'::public.role_type])));



  create policy "geo_ecriture_admin_national"
  on "public"."sous_regions"
  as permissive
  for all
  to public
using ((public."current_role"() = 'admin_national'::public.role_type))
with check ((public."current_role"() = 'admin_national'::public.role_type));



  create policy "geo_lecture_anon"
  on "public"."sous_regions"
  as permissive
  for select
  to public
using ((auth.role() = 'anon'::text));



  create policy "geo_lecture_authentifie"
  on "public"."sous_regions"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));


CREATE TRIGGER trg_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_membres_date_validation BEFORE UPDATE OF statut_validation ON public.membres FOR EACH ROW EXECUTE FUNCTION public.set_date_validation();

CREATE TRIGGER trg_membres_derive_region BEFORE INSERT OR UPDATE OF sous_region_id ON public.membres FOR EACH ROW EXECUTE FUNCTION public.derive_region_from_sous_region();

CREATE TRIGGER trg_membres_guard_role_change BEFORE UPDATE OF role, admin_region_id, admin_sous_region_id ON public.membres FOR EACH ROW EXECUTE FUNCTION public.guard_role_change();

CREATE TRIGGER trg_membres_guard_validation BEFORE UPDATE OF statut_validation ON public.membres FOR EACH ROW EXECUTE FUNCTION public.guard_validation_change();

CREATE TRIGGER trg_membres_set_identifiant BEFORE UPDATE OF statut_validation ON public.membres FOR EACH ROW EXECUTE FUNCTION public.set_identifiant();

CREATE TRIGGER trg_membres_updated_at BEFORE UPDATE ON public.membres FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


