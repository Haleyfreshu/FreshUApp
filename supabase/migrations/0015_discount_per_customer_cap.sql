-- Stripe's own promotion-code max_redemptions is a total cap across every
-- customer combined — there's no native Stripe concept of "each customer
-- can use this code up to N times." So per-customer caps are tracked here
-- instead: staff's "max uses" number is now stored in the promotion
-- code's metadata (max_uses_per_customer) rather than passed to Stripe's
-- max_redemptions, and every time a discount code is used at checkout a
-- row is recorded here so the next checkout can count how many times
-- *this athlete* has already used *this code*.
create table public.discount_redemptions (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  redeemed_at timestamptz not null default now()
);

create index discount_redemptions_code_athlete_idx on public.discount_redemptions(code, athlete_id);

alter table public.discount_redemptions enable row level security;

create policy "discount_redemptions: athlete manages own" on public.discount_redemptions
  for all using (athlete_id = auth.uid()) with check (athlete_id = auth.uid());

create policy "discount_redemptions: staff read" on public.discount_redemptions
  for select using (public.is_staff(auth.uid()));
