create or replace function public.guard_validation_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
$$;

create trigger trg_membres_guard_validation
  before update of statut_validation on public.membres
  for each row execute function public.guard_validation_change();