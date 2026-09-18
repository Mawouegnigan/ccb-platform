-- Étend l'enum document_type pour les annonces et actualités
alter type "public"."document_type" add value 'annonce';
alter type "public"."document_type" add value 'actualite';

-- Nouvelle table pour les photos liées aux actualités (1-à-N)
create table "public"."documents_photos" (
  "id" uuid not null default gen_random_uuid(),
  "document_id" uuid not null references public.documents(id) on delete cascade,
  "photo_url" text not null,
  "ordre" integer not null default 0,
  "created_at" timestamp with time zone not null default now()
);

alter table "public"."documents_photos" enable row level security;

create unique index documents_photos_pkey on public.documents_photos using btree (id);
alter table "public"."documents_photos" add constraint "documents_photos_pkey" primary key using index "documents_photos_pkey";

create index idx_documents_photos_document_id on public.documents_photos using btree (document_id);

grant delete on table "public"."documents_photos" to "anon";
grant insert on table "public"."documents_photos" to "anon";
grant references on table "public"."documents_photos" to "anon";
grant select on table "public"."documents_photos" to "anon";
grant trigger on table "public"."documents_photos" to "anon";
grant truncate on table "public"."documents_photos" to "anon";
grant update on table "public"."documents_photos" to "anon";

grant delete on table "public"."documents_photos" to "authenticated";
grant insert on table "public"."documents_photos" to "authenticated";
grant references on table "public"."documents_photos" to "authenticated";
grant select on table "public"."documents_photos" to "authenticated";
grant trigger on table "public"."documents_photos" to "authenticated";
grant truncate on table "public"."documents_photos" to "authenticated";
grant update on table "public"."documents_photos" to "authenticated";

grant delete on table "public"."documents_photos" to "service_role";
grant insert on table "public"."documents_photos" to "service_role";
grant references on table "public"."documents_photos" to "service_role";
grant select on table "public"."documents_photos" to "service_role";
grant trigger on table "public"."documents_photos" to "service_role";
grant truncate on table "public"."documents_photos" to "service_role";
grant update on table "public"."documents_photos" to "service_role";

-- Lecture : tout membre authentifié
create policy "documents_photos_lecture_authentifie"
on "public"."documents_photos"
as permissive
for select
to public
using ((auth.role() = 'authenticated'::text));

-- Écriture : admin_national uniquement
create policy "documents_photos_ecriture_admin_national"
on "public"."documents_photos"
as permissive
for all
to public
using ((public."current_role"() = 'admin_national'::public.role_type))
with check ((public."current_role"() = 'admin_national'::public.role_type));

-- Resserre l'écriture sur documents : admin_national uniquement (retire admin_region et admin_sous_region)
drop policy "documents_ecriture_admins" on "public"."documents";

create policy "documents_ecriture_admin_national"
on "public"."documents"
as permissive
for all
to public
using ((public."current_role"() = 'admin_national'::public.role_type))
with check (((public."current_role"() = 'admin_national'::public.role_type) and (publie_par = (public.current_membre()).id)));