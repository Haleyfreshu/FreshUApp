-- FreshU schema: profiles, meals, orders, order_items, daily_logs.
-- Run this once in the Supabase SQL Editor (or via `supabase db push`).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  role text not null default 'athlete' check (role in ('athlete', 'staff')),
  school text,
  sport text,
  age int,
  height numeric,
  weight numeric,
  goal text default 'Lean Performance',
  calorie_goal int default 2400,
  protein_goal int default 160,
  carb_goal int default 250,
  fat_goal int default 70,
  practice_days text[] default '{}',
  practice_time text default '16:00',
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Checks the staff role via SECURITY DEFINER so it bypasses RLS instead of
-- re-triggering the policy it's used in (a plain subquery here would cause
-- "infinite recursion detected in policy for relation profiles").
create function public.is_staff(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = user_id and role = 'staff');
$$;

create policy "profiles: select own or staff" on public.profiles
  for select using (
    id = auth.uid()
    or public.is_staff(auth.uid())
  );

create policy "profiles: insert own" on public.profiles
  for insert with check (id = auth.uid());

create policy "profiles: update own or staff" on public.profiles
  for update using (
    id = auth.uid()
    or public.is_staff(auth.uid())
  );

-- Auto-create a profile row the moment someone signs up, so the app never
-- has to special-case "no profile yet" beyond the onboarded flag.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- meals
-- ---------------------------------------------------------------------------
create table public.meals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  emoji text default '🍽️',
  color text default '#2A3EFF',
  ingredients text,
  calories int not null default 0,
  protein int not null default 0,
  carbs int not null default 0,
  fat int not null default 0,
  price numeric(10,2) not null default 0,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.meals enable row level security;

create policy "meals: readable by any signed-in user" on public.meals
  for select using (auth.uid() is not null);

create policy "meals: staff write" on public.meals
  for all using (
    public.is_staff(auth.uid())
  ) with check (
    public.is_staff(auth.uid())
  );

-- ---------------------------------------------------------------------------
-- orders + order_items
-- ---------------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles(id),
  athlete_name text,
  athlete_email text,
  week_of text not null,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'This Week', 'Delivered', 'Canceled')),
  total numeric(10,2) not null default 0,
  stripe_session_id text unique,
  stripe_payment_status text,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  meal_id uuid references public.meals(id),
  name text not null,
  emoji text,
  category text,
  calories int,
  protein int,
  carbs int,
  fat int,
  price numeric(10,2)
);

create index order_items_order_id_idx on public.order_items(order_id);
create index orders_athlete_id_idx on public.orders(athlete_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "orders: athlete sees own, staff sees all" on public.orders
  for select using (
    athlete_id = auth.uid()
    or public.is_staff(auth.uid())
  );

create policy "orders: athlete inserts own" on public.orders
  for insert with check (athlete_id = auth.uid());

create policy "orders: staff can update" on public.orders
  for update using (
    public.is_staff(auth.uid())
  );

create policy "order_items: visible if parent order visible" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.athlete_id = auth.uid()
             or public.is_staff(auth.uid()))
    )
  );

create policy "order_items: insert if parent order owned" on public.order_items
  for insert with check (
    exists (select 1 from public.orders o where o.id = order_items.order_id and o.athlete_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- daily_logs ("I Ate This" quick log)
-- ---------------------------------------------------------------------------
create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles(id),
  meal_id uuid references public.meals(id),
  log_date date not null default current_date,
  name text not null,
  emoji text,
  calories int,
  protein int,
  carbs int,
  fat int,
  logged_at timestamptz not null default now(),
  unique (athlete_id, meal_id, log_date)
);

create index daily_logs_athlete_date_idx on public.daily_logs(athlete_id, log_date);

alter table public.daily_logs enable row level security;

create policy "daily_logs: athlete manages own" on public.daily_logs
  for all using (athlete_id = auth.uid()) with check (athlete_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage: meal photos
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('meal-photos', 'meal-photos', true)
on conflict (id) do nothing;

create policy "meal-photos: public read" on storage.objects
  for select using (bucket_id = 'meal-photos');

create policy "meal-photos: staff write" on storage.objects
  for insert with check (
    bucket_id = 'meal-photos'
    and public.is_staff(auth.uid())
  );

create policy "meal-photos: staff update" on storage.objects
  for update using (
    bucket_id = 'meal-photos'
    and public.is_staff(auth.uid())
  );

create policy "meal-photos: staff delete" on storage.objects
  for delete using (
    bucket_id = 'meal-photos'
    and public.is_staff(auth.uid())
  );
