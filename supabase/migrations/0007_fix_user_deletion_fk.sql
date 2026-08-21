-- Deleting an athlete's auth user cascades to delete their profiles row,
-- but orders/daily_logs referencing that profile had no ON DELETE action,
-- so Postgres blocked the whole deletion with a foreign key violation for
-- any athlete who ever placed an order or logged a meal.
--
-- Orders are financial/business records worth keeping for accounting even
-- after an athlete's account is gone (orders already store athlete_name/
-- athlete_email as a snapshot), so athlete_id is set null rather than the
-- row being deleted. daily_logs are just personal tracking data with no
-- value once the account is gone, so those are deleted along with the user.

alter table public.orders alter column athlete_id drop not null;
alter table public.orders drop constraint orders_athlete_id_fkey;
alter table public.orders add constraint orders_athlete_id_fkey
  foreign key (athlete_id) references public.profiles(id) on delete set null;

alter table public.daily_logs drop constraint daily_logs_athlete_id_fkey;
alter table public.daily_logs add constraint daily_logs_athlete_id_fkey
  foreign key (athlete_id) references public.profiles(id) on delete cascade;
