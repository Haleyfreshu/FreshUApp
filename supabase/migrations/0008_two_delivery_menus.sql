-- FreshU now runs two fully separate weekly menus, each with its own
-- delivery day: order Sunday-Wednesday for Monday delivery, or order
-- Wednesday-Sunday for Thursday delivery. Meals belong to exactly one
-- menu; staff maintains each list independently.
--
-- Existing meals default to 'monday' so nothing disappears from the menu
-- athletes already see — staff will need to go create/reassign meals for
-- the new Thursday delivery.

alter table public.meals add column if not exists delivery_day text not null default 'monday'
  check (delivery_day in ('monday', 'thursday'));

alter table public.orders add column if not exists delivery_day text not null default 'monday'
  check (delivery_day in ('monday', 'thursday'));

create index if not exists meals_delivery_day_idx on public.meals(delivery_day);
