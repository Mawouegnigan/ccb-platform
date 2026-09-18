-- Bucket privé pour les fichiers/photos des annonces, actualités, circulaires, etc.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents-ccb',
  'documents-ccb',
  false,
  10485760, -- 10 Mo
  array['application/pdf', 'image/jpeg', 'image/png']
);

-- Lecture : tout membre authentifié (cohérent avec la policy de lecture sur la table documents)
create policy "documents_ccb_lecture_authentifie"
on storage.objects
for select
to public
using (
  bucket_id = 'documents-ccb'
  and auth.role() = 'authenticated'
);

-- Écriture (upload/update/delete) : admin_national uniquement
create policy "documents_ccb_ecriture_admin_national"
on storage.objects
for all
to public
using (
  bucket_id = 'documents-ccb'
  and public."current_role"() = 'admin_national'::public.role_type
)
with check (
  bucket_id = 'documents-ccb'
  and public."current_role"() = 'admin_national'::public.role_type
);