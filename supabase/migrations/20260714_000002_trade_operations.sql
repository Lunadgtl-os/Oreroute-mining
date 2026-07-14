create table public.transport_tenders (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  passport_id uuid references public.material_passports(id),
  origin_location text not null,
  destination_location text not null,
  weight_kg numeric(18,3) not null,
  mineral_type text,
  required_by_date date,
  status text not null default 'open',
  posted_by_org_id uuid not null references public.organisations(id),
  awarded_to_org_id uuid references public.organisations(id),
  awarded_bid_amount numeric(18,2),
  special_requirements text,
  created_at timestamptz not null default now()
);

create table public.tender_bids (
  id uuid primary key default gen_random_uuid(),
  tender_id uuid not null references public.transport_tenders(id) on delete cascade,
  carrier_org_id uuid not null references public.organisations(id),
  amount numeric(18,2) not null,
  currency text not null default 'USD',
  estimated_days integer,
  vehicle_type text,
  notes text,
  status text not null default 'submitted',
  created_at timestamptz not null default now()
);

create table public.wash_plant_batches (
  id uuid primary key default gen_random_uuid(),
  batch_ref text not null unique,
  plant_org_id uuid not null references public.organisations(id),
  input_passport_ids uuid[] not null default '{}',
  output_passport_id uuid references public.material_passports(id),
  mineral_type text not null,
  input_weight_kg numeric(18,3),
  output_weight_kg numeric(18,3),
  yield_percent numeric(6,3),
  grade_input text,
  grade_output text,
  status text not null default 'receiving',
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table public.trade_dossiers (
  id uuid primary key default gen_random_uuid(),
  trade_ref text not null unique,
  passport_id uuid references public.material_passports(id),
  seller_org_id uuid not null references public.organisations(id),
  buyer_org_id uuid not null references public.organisations(id),
  mineral_type text not null,
  weight_kg numeric(18,3) not null,
  agreed_price numeric(18,2),
  currency text not null default 'USD',
  status text not null default 'draft',
  payment_structure text not null default 'milestone_based',
  total_paid numeric(18,2) not null default 0,
  total_due numeric(18,2),
  incoterm text,
  vessel_name text,
  destination_port text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.payment_milestones (
  id uuid primary key default gen_random_uuid(),
  passport_id uuid references public.material_passports(id),
  trade_id uuid not null references public.trade_dossiers(id) on delete cascade,
  milestone_type text not null,
  milestone_label text,
  tranche_percent numeric(6,3) not null,
  tranche_amount numeric(18,2),
  currency text not null default 'USD',
  seller_confirmed boolean not null default false,
  seller_confirmed_at timestamptz,
  buyer_confirmed boolean not null default false,
  buyer_confirmed_at timestamptz,
  status text not null default 'pending',
  evidence_urls text[] not null default '{}',
  dispute_reason text,
  release_reference text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.transport_tenders enable row level security;
alter table public.tender_bids enable row level security;
alter table public.wash_plant_batches enable row level security;
alter table public.trade_dossiers enable row level security;
alter table public.payment_milestones enable row level security;

create policy "tenders visible to participating organisations" on public.transport_tenders for select using (
  public.is_org_member(posted_by_org_id) or public.is_org_member(awarded_to_org_id) or status in ('open','bidding')
);
create policy "members post tenders" on public.transport_tenders for insert with check (public.is_org_member(posted_by_org_id));
create policy "carriers view own bids" on public.tender_bids for select using (public.is_org_member(carrier_org_id));
create policy "carriers submit bids" on public.tender_bids for insert with check (public.is_org_member(carrier_org_id));
create policy "plant members view batches" on public.wash_plant_batches for select using (public.is_org_member(plant_org_id));
create policy "plant members manage batches" on public.wash_plant_batches for all using (public.is_org_member(plant_org_id)) with check (public.is_org_member(plant_org_id));
create policy "trade parties view dossiers" on public.trade_dossiers for select using (public.is_org_member(seller_org_id) or public.is_org_member(buyer_org_id));
create policy "trade parties create dossiers" on public.trade_dossiers for insert with check (public.is_org_member(seller_org_id) or public.is_org_member(buyer_org_id));
create policy "trade parties view milestones" on public.payment_milestones for select using (
  exists (select 1 from public.trade_dossiers t where t.id = trade_id and (public.is_org_member(t.seller_org_id) or public.is_org_member(t.buyer_org_id)))
);
