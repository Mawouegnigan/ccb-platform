-- ============================================================================
-- CCB Platform — Migration 4 : stockage des photos de profil (bucket privé)
-- ============================================================================

-- Bucket privé : aucune URL publique directe, accès uniquement via les
-- policies RLS ci-dessous + URLs signées générées côté serveur.
-- Limite 2 Mo, formats image courants.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'photos-profil',
  'photos-profil',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Convention de chemin : {membre_id}/avatar.{ext}
-- Le premier segment du chemin = l'identité du propriétaire, sans jointure
-- complexe. Sert de base à toutes les policies ci-dessous.

create policy "photos_lecture_soi_meme" on storage.objects
  for select using (
    bucket_id = 'photos-profil'
    and (storage.foldername(name))[1] = (select id::text from public.membres where user_id = auth.uid())
  );

create policy "photos_lecture_admin_national" on storage.objects
  for select using (
    bucket_id = 'photos-profil'
    and public.current_role() = 'admin_national'
  );

create policy "photos_lecture_admin_region" on storage.objects
  for select using (
    bucket_id = 'photos-profil'
    and public.current_role() = 'admin_region'
    and exists (
      select 1 from public.membres m
      where m.id::text = (storage.foldername(name))[1]
        and m.region_id = public.current_region_id()
    )
  );

create policy "photos_lecture_admin_sous_region" on storage.objects
  for select using (
    bucket_id = 'photos-profil'
    and public.current_role() = 'admin_sous_region'
    and exists (
      select 1 from public.membres m
      where m.id::text = (storage.foldername(name))[1]
        and m.sous_region_id = public.current_sous_region_id()
    )
  );

create policy "photos_ecriture_soi_meme" on storage.objects
  for insert with check (
    bucket_id = 'photos-profil'
    and (storage.foldername(name))[1] = (select id::text from public.membres where user_id = auth.uid())
  );

create policy "photos_maj_soi_meme" on storage.objects
  for update using (
    bucket_id = 'photos-profil'
    and (storage.foldername(name))[1] = (select id::text from public.membres where user_id = auth.uid())
  )
  with check (
    bucket_id = 'photos-profil'
    and (storage.foldername(name))[1] = (select id::text from public.membres where user_id = auth.uid())
  );

create policy "photos_suppression_soi_meme" on storage.objects
  for delete using (
    bucket_id = 'photos-profil'
    and (storage.foldername(name))[1] = (select id::text from public.membres where user_id = auth.uid())
  );