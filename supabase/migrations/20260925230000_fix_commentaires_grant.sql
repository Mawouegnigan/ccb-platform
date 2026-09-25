-- Corrige l'erreur 42501 "permission denied for table commentaires" :
-- la migration initiale de la table n'accordait pas les droits SQL de
-- base aux rôles PostgREST (RLS ne s'évalue qu'après ce GRANT).
grant select, insert, update, delete on public.commentaires to authenticated;