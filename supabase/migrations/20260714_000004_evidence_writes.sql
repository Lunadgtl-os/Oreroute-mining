drop policy if exists "members register evidence" on public.documents;
create policy "members register evidence"
on public.documents for insert to authenticated
with check (
  public.is_org_member(uploaded_by_org_id)
  and uploaded_by = auth.uid()
  and split_part(storage_path, '/', 1) = uploaded_by_org_id::text
);
