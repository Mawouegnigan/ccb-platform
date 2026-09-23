-- Boîte à commentaires : recueil des avis des utilisateurs connectés,
-- consultable uniquement par admin_national.
create table public.commentaires (
  id uuid primary key default gen_random_uuid(),
  membre_id uuid not null default (public.current_membre()).id references public.membres(id) on delete cascade,
  contenu text not null,
  page_url text,
  lu boolean not null default false,
  created_at timestamp with time zone not null default now()
);

alter table public.commentaires enable row level security;

-- Insertion : tout utilisateur connecté, uniquement pour lui-même (le
-- défaut de la colonne couvre déjà le cas normal, ce check bloque toute
-- tentative de spoofing d'un membre_id différent).
create policy "commentaires_insertion_authentifie"
on public.commentaires
for insert
to public
with check (membre_id = (public.current_membre()).id);

-- Lecture et gestion (marquer comme lu, supprimer) : admin_national seul.
create policy "commentaires_lecture_admin_national"
on public.commentaires
for select
to public
using (public."current_role"() = 'admin_national'::public.role_type);

create policy "commentaires_gestion_admin_national"
on public.commentaires
for update
to public
using (public."current_role"() = 'admin_national'::public.role_type)
with check (public."current_role"() = 'admin_national'::public.role_type);

create policy "commentaires_suppression_admin_national"
on public.commentaires
for delete
to public
using (public."current_role"() = 'admin_national'::public.role_type);