create extension if not exists pgcrypto;

create type public.organisation_type as enum ('miner','carrier','wash_plant','trader','buyer','exporter','regulator');
create type public.membership_role as enum ('owner','admin','operations','compliance','finance','viewer');
create type public.passport_status as enum ('at_mine','in_transit_to_washplant','at_washplant','processing','processed','in_transit_to_export','at_warehouse','at_border','at_port','on_vessel','delivered','disputed','blocked');
create type public.shipment_status as enum ('pending','loading','in_transit','at_checkpoint','delayed','arrived','unloading','completed','exception');

create table public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  org_type public.organisation_type not null,
  registration_number text,
  country text,
  region text,
  contact_email text,
  contact_phone text,
  logo_url text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

create table public.organisation_members (
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.membership_role not null default 'viewer',
  primary key (organisation_id, user_id)
);

create table public.material_passports (
  id uuid primary key default gen_random_uuid(),
  lot_id text not null unique,
  mineral_type text not null,
  origin_mine text not null,
  origin_region text,
  origin_country text,
  weight_kg numeric(18,3) not null check (weight_kg >= 0),
  grade text,
  status public.passport_status not null default 'at_mine',
  source_org_id uuid not null references public.organisations(id),
  current_holder_org_id uuid references public.organisations(id),
  destination_org_id uuid references public.organisations(id),
  parent_lot_id uuid references public.material_passports(id),
  quality_score numeric(5,2),
  evidence_confidence numeric(5,2),
  notes text,
  tags text[] not null default '{}',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.custody_events (
  id uuid primary key default gen_random_uuid(),
  passport_id uuid not null references public.material_passports(id) on delete cascade,
  event_type text not null,
  location text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  from_org_id uuid references public.organisations(id),
  to_org_id uuid references public.organisations(id),
  weight_kg numeric(18,3),
  notes text,
  evidence_urls text[] not null default '{}',
  recorded_by uuid not null references public.profiles(id),
  verified boolean not null default false,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  shipment_ref text not null unique,
  passport_id uuid references public.material_passports(id),
  carrier_org_id uuid references public.organisations(id),
  driver_name text,
  driver_phone text,
  vehicle_registration text,
  origin text not null,
  destination text not null,
  status public.shipment_status not null default 'pending',
  weight_at_origin numeric(18,3),
  weight_at_destination numeric(18,3),
  current_latitude numeric(10,7),
  current_longitude numeric(10,7),
  departed_at timestamptz,
  eta timestamptz,
  arrived_at timestamptz,
  exception_notes text,
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  doc_type text not null,
  storage_path text not null,
  passport_id uuid references public.material_passports(id) on delete cascade,
  shipment_id uuid references public.shipments(id) on delete cascade,
  uploaded_by_org_id uuid not null references public.organisations(id),
  uploaded_by uuid not null references public.profiles(id),
  confidence_score numeric(5,2),
  verified boolean not null default false,
  access_level text not null default 'org_only',
  created_at timestamptz not null default now()
);

create or replace function public.is_org_member(org_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organisation_members
    where organisation_id = org_id and user_id = auth.uid()
  );
$$;

alter table public.organisations enable row level security;
alter table public.profiles enable row level security;
alter table public.organisation_members enable row level security;
alter table public.material_passports enable row level security;
alter table public.custody_events enable row level security;
alter table public.shipments enable row level security;
alter table public.documents enable row level security;

create policy "profiles self read" on public.profiles for select using (id = auth.uid());
create policy "profiles self update" on public.profiles for update using (id = auth.uid());
create policy "members view own organisations" on public.organisation_members for select using (user_id = auth.uid() or public.is_org_member(organisation_id));
create policy "organisations visible to members" on public.organisations for select using (public.is_org_member(id));
create policy "passports visible to parties" on public.material_passports for select using (
  public.is_org_member(source_org_id) or public.is_org_member(current_holder_org_id) or public.is_org_member(destination_org_id)
);
create policy "members create passports" on public.material_passports for insert with check (public.is_org_member(source_org_id) and created_by = auth.uid());
create policy "holders update passports" on public.material_passports for update using (public.is_org_member(current_holder_org_id) or public.is_org_member(source_org_id));
create policy "custody visible through passport" on public.custody_events for select using (
  exists (select 1 from public.material_passports p where p.id = passport_id and (
    public.is_org_member(p.source_org_id) or public.is_org_member(p.current_holder_org_id) or public.is_org_member(p.destination_org_id)
  ))
);
create policy "members create custody events" on public.custody_events for insert with check (recorded_by = auth.uid());
create policy "shipments visible to carrier and passport parties" on public.shipments for select using (
  public.is_org_member(carrier_org_id) or exists (
    select 1 from public.material_passports p where p.id = passport_id and (
      public.is_org_member(p.source_org_id) or public.is_org_member(p.current_holder_org_id) or public.is_org_member(p.destination_org_id)
    )
  )
);
create policy "documents visible to uploading organisation" on public.documents for select using (public.is_org_member(uploaded_by_org_id));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', false)
on conflict (id) do nothing;
