# Ore Route Supabase setup

## 1. Create the project

Create a new Supabase project for Ore Route. Use a strong database password and select the region closest to the primary operating market.

## 2. Apply the database migration

Open **SQL Editor** in Supabase, copy the contents of:

`supabase/migrations/20260714_000001_initial_schema.sql`

Run it once against the new project.

## 3. Configure the frontend

Copy `.env.example` to `.env.local` and populate:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Never commit `.env.local`, service-role keys, database passwords or JWT secrets.

## 4. Authentication

Email/password authentication is supported by the frontend service in `src/lib/auth.js`. The migration creates a profile automatically whenever a new Supabase Auth user is created.

## 5. Organisation onboarding

The first controlled onboarding process should:

1. Create an organisation.
2. Add the authenticated user to `organisation_members` with role `owner`.
3. Require verification before the organisation can transact.

Do not allow users to assign themselves to arbitrary organisations.

## 6. Current scope

This foundation provides organisations, user profiles, memberships, material passports, custody events, shipments, documents, private evidence storage and initial row-level security.

The next migration should add transport tenders, tender bids, wash-plant batches, trade dossiers and payment milestones.
