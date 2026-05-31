-- ════════════════════════════════════════════════════════════════════════
-- UroScan — initial schema
-- profiles (extends auth.users) · tests · results, all guarded by RLS.
-- Idempotent: safe to re-run.
-- ════════════════════════════════════════════════════════════════════════

-- ── profiles ────────────────────────────────────────────────────────────
create table if not exists public.profiles (
	id uuid primary key references auth.users (id) on delete cascade,
	full_name text,
	avatar_url text,
	age_range text,
	sex text,
	conditions text[],
	medications text,
	notification_prefs jsonb not null default '{}'::jsonb,
	settings jsonb not null default '{"dark_mode": false, "units": "metric"}'::jsonb,
	created_at timestamptz not null default now()
);

-- ── tests ───────────────────────────────────────────────────────────────
create table if not exists public.tests (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	created_at timestamptz not null default now(),
	status text check (status in ('normal', 'borderline', 'abnormal')),
	result_summary text,
	ai_insights text,
	thumbnail_url text,
	image_url text,
	raw_analysis jsonb
);

create index if not exists tests_user_created_idx
	on public.tests (user_id, created_at desc);

-- ── results (one row per marker per test) ─────────────────────────────────
create table if not exists public.results (
	id uuid primary key default gen_random_uuid(),
	test_id uuid not null references public.tests (id) on delete cascade,
	marker text not null,
	value text,
	unit text,
	status text check (status in ('normal', 'borderline', 'abnormal')),
	reference_min numeric,
	reference_max numeric,
	color_detected text,
	confidence numeric
);

create index if not exists results_test_idx on public.results (test_id);

-- ── Row Level Security ────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.tests enable row level security;
alter table public.results enable row level security;

drop policy if exists "users own profile" on public.profiles;
create policy "users own profile" on public.profiles
	for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "users own tests" on public.tests;
create policy "users own tests" on public.tests
	for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "users own results" on public.results;
create policy "users own results" on public.results
	for all using (
		test_id in (select id from public.tests where user_id = auth.uid())
	) with check (
		test_id in (select id from public.tests where user_id = auth.uid())
	);

-- ── Auto-create a profile row when a user signs up ─────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
	insert into public.profiles (id, full_name)
	values (new.id, new.raw_user_meta_data ->> 'full_name')
	on conflict (id) do nothing;
	return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
	after insert on auth.users
	for each row execute function public.handle_new_user();

-- ── Storage bucket for avatars ────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatar read" on storage.objects;
create policy "avatar read" on storage.objects
	for select using (bucket_id = 'avatars');

drop policy if exists "avatar write own" on storage.objects;
create policy "avatar write own" on storage.objects
	for insert with check (
		bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
	);

drop policy if exists "avatar update own" on storage.objects;
create policy "avatar update own" on storage.objects
	for update using (
		bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
	);
