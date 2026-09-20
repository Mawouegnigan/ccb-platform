-- Bucket privé pour les photos de profil des membres.
-- Créé initialement à la main dans Supabase Studio local (dette technique
-- connue) : jamais versionné, donc jamais poussé vers Supabase Cloud.
-- Cette migration rattrape ce manque en capturant bucket + policies.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'photos-profil',
  'photos-profil',
  false,
  2097152, -- 2 Mo
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Lecture : le membre lui-même, ou un admin dans son périmètre hiérarchique
-- (même logique que membres_lecture_region / membres_lecture_sous_region).
create policy "photos_profil_lecture"
on storage.objects
for select
to public
using (
  bucket_id = 'photos-profil'
  and (
    (storage.foldername(name))[1] = ((public.current_membre()).id)::text
    or public."current_role"() = 'admin_national'::public.role_type
    or (
      public."current_role"() = 'admin_region'::public.role_type
      and exists (
        select 1 from public.membres m
        where m.id::text = (storage.foldername(name))[1]
        and m.region_id = public.current_region_id()
      )
    )
    or (
      public."current_role"() = 'admin_sous_region'::public.role_type
      and exists (
        select 1 from public.membres m
        where m.id::text = (storage.foldername(name))[1]
        and m.sous_region_id = public.current_sous_region_id()
      )
    )
  )
);

-- Écriture (upload/update/delete) : le membre lui-même uniquement, jamais un
-- admin pour le compte d'un autre — cohérent avec ProfilForm.tsx/InscriptionForm.tsx.
create policy "photos_profil_ecriture_soi_meme"
on storage.objects
for all
to public
using (
  bucket_id = 'photos-profil'
  and (storage.foldername(name))[1] = ((public.current_membre()).id)::text
)
with check (
  bucket_id = 'photos-profil'
  and (storage.foldername(name))[1] = ((public.current_membre()).id)::text
);