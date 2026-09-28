-- True BOGO (one specific item free, capped at exactly one regardless of
-- cart size) can't be expressed as a Stripe Coupon — Stripe coupons are a
-- fixed percent-off or dollar-off the whole order, decided at creation
-- time, with no concept of "the cheapest line item" or "only one pair".
-- So BOGO codes are validated and applied entirely on our side (in the
-- checkout API, before Stripe ever sees the order) rather than through
-- Stripe's promotion-code system — kept in their own table so a BOGO code
-- can never be typed into Stripe's own "promo code" field and misfire.

create table public.bogo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  active boolean not null default true,
  expires_at date,
  max_redemptions int,
  times_redeemed int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.bogo_codes enable row level security;

create policy "bogo_codes: readable by any signed-in user" on public.bogo_codes
  for select using (auth.uid() is not null);

create policy "bogo_codes: staff write" on public.bogo_codes
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- Athletes redeem a code through checkout using their own session, not a
-- staff one, so incrementing times_redeemed can't go through the
-- staff-only write policy above. This function does that one narrow
-- thing under elevated privilege instead of loosening the table's RLS.
create or replace function public.redeem_bogo_code(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.bogo_codes
  set times_redeemed = times_redeemed + 1
  where code = p_code and active = true;
end;
$$;

grant execute on function public.redeem_bogo_code(text) to authenticated;
