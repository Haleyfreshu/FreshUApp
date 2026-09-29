-- bogo_codes.max_redemptions was a total cap shared across every
-- customer combined (the same issue the Stripe-based discount codes
-- had, already fixed the same way in migration 0015) — a code set to
-- "1" meant the entire team could redeem it exactly once, ever, not
-- "each athlete gets one use." Renaming the column to match its new
-- per-customer meaning, and adding a redemption-tracking table so
-- checkout can count how many times *this athlete* has used *this*
-- BOGO code specifically.
alter table public.bogo_codes rename column max_redemptions to max_uses_per_customer;

create table public.bogo_redemptions (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  redeemed_at timestamptz not null default now()
);

create index bogo_redemptions_code_athlete_idx on public.bogo_redemptions(code, athlete_id);

alter table public.bogo_redemptions enable row level security;

create policy "bogo_redemptions: athlete manages own" on public.bogo_redemptions
  for all using (athlete_id = auth.uid()) with check (athlete_id = auth.uid());

create policy "bogo_redemptions: staff read" on public.bogo_redemptions
  for select using (public.is_staff(auth.uid()));
