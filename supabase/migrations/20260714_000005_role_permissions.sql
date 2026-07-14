create or replace function public.has_org_role(org_id uuid, allowed_roles public.membership_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.organisation_members where organisation_id = org_id and user_id = auth.uid() and role = any(allowed_roles));
$$;
revoke all on function public.has_org_role(uuid, public.membership_role[]) from public, anon;
grant execute on function public.has_org_role(uuid, public.membership_role[]) to authenticated;

drop policy if exists "members update tenders" on public.transport_tenders;
create policy "members update tenders" on public.transport_tenders for update to authenticated
using (public.has_org_role(posted_by_org_id, array['owner','admin','operations']::public.membership_role[]))
with check (public.has_org_role(posted_by_org_id, array['owner','admin','operations']::public.membership_role[]));

drop policy if exists "trade parties manage milestones" on public.payment_milestones;
create policy "trade parties manage milestones" on public.payment_milestones for all to authenticated
using (exists (select 1 from public.trade_dossiers t where t.id = trade_id and (public.has_org_role(t.seller_org_id, array['owner','admin','finance']::public.membership_role[]) or public.has_org_role(t.buyer_org_id, array['owner','admin','finance']::public.membership_role[]))))
with check (exists (select 1 from public.trade_dossiers t where t.id = trade_id and (public.has_org_role(t.seller_org_id, array['owner','admin','finance']::public.membership_role[]) or public.has_org_role(t.buyer_org_id, array['owner','admin','finance']::public.membership_role[]))));

drop policy if exists "trade parties update dossiers" on public.trade_dossiers;
create policy "trade parties update dossiers" on public.trade_dossiers for update to authenticated
using (public.has_org_role(seller_org_id, array['owner','admin','finance']::public.membership_role[]) or public.has_org_role(buyer_org_id, array['owner','admin','finance']::public.membership_role[]))
with check (public.has_org_role(seller_org_id, array['owner','admin','finance']::public.membership_role[]) or public.has_org_role(buyer_org_id, array['owner','admin','finance']::public.membership_role[]));
