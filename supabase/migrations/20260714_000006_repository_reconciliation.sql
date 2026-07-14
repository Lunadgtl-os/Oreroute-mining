-- Reconciles source control with the hardened live project. Safe to rerun.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;
revoke all on function public.is_org_member(uuid) from public, anon;
grant execute on function public.is_org_member(uuid) to authenticated;

drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "organisations visible to members" on public.organisations;
create policy "organisations visible to members" on public.organisations for select to authenticated using (public.is_org_member(id));
drop policy if exists "owners manage organisation" on public.organisations;
create policy "owners manage organisation" on public.organisations for update to authenticated
using (public.has_org_role(id, array['owner','admin']::public.membership_role[]))
with check (public.has_org_role(id, array['owner','admin']::public.membership_role[]));

drop policy if exists "members view own organisations" on public.organisation_members;
create policy "members view own organisations" on public.organisation_members for select to authenticated
using (user_id = auth.uid() or public.is_org_member(organisation_id));

drop policy if exists "members create shipments" on public.shipments;
create policy "members create shipments" on public.shipments for insert to authenticated
with check (
  public.has_org_role(carrier_org_id, array['owner','admin','operations']::public.membership_role[])
  or exists (select 1 from public.material_passports p where p.id = passport_id and public.has_org_role(p.source_org_id, array['owner','admin','operations']::public.membership_role[]))
);
drop policy if exists "members update shipments" on public.shipments;
create policy "members update shipments" on public.shipments for update to authenticated
using (public.has_org_role(carrier_org_id, array['owner','admin','operations']::public.membership_role[]))
with check (public.has_org_role(carrier_org_id, array['owner','admin','operations']::public.membership_role[]));

drop policy if exists "carriers update own bids" on public.tender_bids;
create policy "carriers update own bids" on public.tender_bids for update to authenticated
using (public.has_org_role(carrier_org_id, array['owner','admin','operations','finance']::public.membership_role[]))
with check (public.has_org_role(carrier_org_id, array['owner','admin','operations','finance']::public.membership_role[]));

drop policy if exists "members update own documents" on public.documents;
create policy "members update own documents" on public.documents for update to authenticated
using (public.has_org_role(uploaded_by_org_id, array['owner','admin','compliance']::public.membership_role[]))
with check (public.has_org_role(uploaded_by_org_id, array['owner','admin','compliance']::public.membership_role[]));

drop policy if exists "evidence members read" on storage.objects;
create policy "evidence members read" on storage.objects for select to authenticated using (
  bucket_id = 'evidence' and exists (select 1 from public.organisation_members om where om.user_id = auth.uid() and om.organisation_id::text = split_part(name, '/', 1))
);
drop policy if exists "evidence members upload" on storage.objects;
create policy "evidence members upload" on storage.objects for insert to authenticated with check (
  bucket_id = 'evidence' and owner_id = auth.uid()::text and exists (select 1 from public.organisation_members om where om.user_id = auth.uid() and om.organisation_id::text = split_part(name, '/', 1))
);
drop policy if exists "evidence owners update" on storage.objects;
drop policy if exists "evidence members update" on storage.objects;
create policy "evidence owners update" on storage.objects for update to authenticated
using (bucket_id = 'evidence' and owner_id = auth.uid()::text and exists (select 1 from public.organisation_members om where om.user_id = auth.uid() and om.organisation_id::text = split_part(name, '/', 1)))
with check (bucket_id = 'evidence' and owner_id = auth.uid()::text and exists (select 1 from public.organisation_members om where om.user_id = auth.uid() and om.organisation_id::text = split_part(name, '/', 1)));
drop policy if exists "evidence owners delete" on storage.objects;
drop policy if exists "evidence members delete" on storage.objects;
create policy "evidence owners delete" on storage.objects for delete to authenticated
using (bucket_id = 'evidence' and owner_id = auth.uid()::text and exists (select 1 from public.organisation_members om where om.user_id = auth.uid() and om.organisation_id::text = split_part(name, '/', 1)));
