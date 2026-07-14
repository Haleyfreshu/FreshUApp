-- Fixes "infinite recursion detected in policy for relation profiles".
--
-- The original policies checked "is this user staff?" by querying
-- public.profiles from *within* a policy defined on public.profiles,
-- which re-triggers the same policy forever. The fix is a small
-- SECURITY DEFINER helper that checks the role while bypassing RLS,
-- so it terminates instead of recursing.
--
-- Run this once in the Supabase SQL Editor against a project that
-- already ran 0001_init.sql.

create or replace function public.is_staff(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = user_id and role = 'staff');
$$;

-- profiles
drop policy if exists "profiles: select own or staff" on public.profiles;
create policy "profiles: select own or staff" on public.profiles
  for select using (id = auth.uid() or public.is_staff(auth.uid()));

drop policy if exists "profiles: update own or staff" on public.profiles;
create policy "profiles: update own or staff" on public.profiles
  for update using (id = auth.uid() or public.is_staff(auth.uid()));

-- meals
drop policy if exists "meals: staff write" on public.meals;
create policy "meals: staff write" on public.meals
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- orders
drop policy if exists "orders: athlete sees own, staff sees all" on public.orders;
create policy "orders: athlete sees own, staff sees all" on public.orders
  for select using (athlete_id = auth.uid() or public.is_staff(auth.uid()));

drop policy if exists "orders: staff can update" on public.orders;
create policy "orders: staff can update" on public.orders
  for update using (public.is_staff(auth.uid()));

-- order_items
drop policy if exists "order_items: visible if parent order visible" on public.order_items;
create policy "order_items: visible if parent order visible" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.athlete_id = auth.uid() or public.is_staff(auth.uid()))
    )
  );

-- storage: meal photos
drop policy if exists "meal-photos: staff write" on storage.objects;
create policy "meal-photos: staff write" on storage.objects
  for insert with check (bucket_id = 'meal-photos' and public.is_staff(auth.uid()));

drop policy if exists "meal-photos: staff update" on storage.objects;
create policy "meal-photos: staff update" on storage.objects
  for update using (bucket_id = 'meal-photos' and public.is_staff(auth.uid()));

drop policy if exists "meal-photos: staff delete" on storage.objects;
create policy "meal-photos: staff delete" on storage.objects
  for delete using (bucket_id = 'meal-photos' and public.is_staff(auth.uid()));
