-- Per-meal customization: staff can attach option groups to a meal
-- (e.g. "Choose your carb" - single choice, "Extras" - multi-select),
-- each option carrying its own price and macro adjustment so an
-- "Extra protein" add-on actually bumps the calories/protein the athlete
-- is credited with, not just the price.

create table public.meal_option_groups (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  name text not null,
  selection_type text not null default 'single' check (selection_type in ('single', 'multi')),
  required boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.meal_options (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.meal_option_groups(id) on delete cascade,
  label text not null,
  price_delta numeric(10,2) not null default 0,
  calories_delta int not null default 0,
  protein_delta int not null default 0,
  carbs_delta int not null default 0,
  fat_delta int not null default 0,
  sort_order int not null default 0
);

create index meal_option_groups_meal_id_idx on public.meal_option_groups(meal_id);
create index meal_options_group_id_idx on public.meal_options(group_id);

alter table public.meal_option_groups enable row level security;
alter table public.meal_options enable row level security;

create policy "meal_option_groups: readable by any signed-in user" on public.meal_option_groups
  for select using (auth.uid() is not null);

create policy "meal_option_groups: staff write" on public.meal_option_groups
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create policy "meal_options: readable by any signed-in user" on public.meal_options
  for select using (auth.uid() is not null);

create policy "meal_options: staff write" on public.meal_options
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- Snapshot of what was picked, for kitchen prep and the CSV export.
alter table public.order_items add column if not exists selected_options jsonb not null default '[]';
alter table public.daily_logs add column if not exists selected_options jsonb not null default '[]';
