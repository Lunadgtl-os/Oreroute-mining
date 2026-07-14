create or replace function public.onboard_organisation(
  organisation_name text,
  organisation_kind public.organisation_type,
  organisation_country text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if trim(organisation_name) = '' then raise exception 'Organisation name is required'; end if;
  if exists (select 1 from public.organisation_members where user_id = auth.uid()) then
    raise exception 'Account already belongs to an organisation';
  end if;
  insert into public.organisations (name, org_type, country)
  values (trim(organisation_name), organisation_kind, nullif(trim(organisation_country), ''))
  returning id into new_org_id;
  insert into public.organisation_members (organisation_id, user_id, role)
  values (new_org_id, auth.uid(), 'owner');
  return new_org_id;
end;
$$;

revoke all on function public.onboard_organisation(text, public.organisation_type, text) from public, anon;
grant execute on function public.onboard_organisation(text, public.organisation_type, text) to authenticated;
