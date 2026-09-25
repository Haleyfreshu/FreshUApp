-- A meal can now be offered on the Monday menu, the Thursday menu, or
-- both — delivery_day was a single value and couldn't represent that, so
-- it's replaced with two independent flags. (orders.delivery_day is
-- untouched: a given order is always for exactly one delivery.)

alter table public.meals add column if not exists on_monday_menu boolean not null default false;
alter table public.meals add column if not exists on_thursday_menu boolean not null default false;

update public.meals set
  on_monday_menu = (delivery_day = 'monday'),
  on_thursday_menu = (delivery_day = 'thursday');

drop index if exists meals_delivery_day_idx;
alter table public.meals drop column if exists delivery_day;

create index if not exists meals_on_monday_menu_idx on public.meals(on_monday_menu) where on_monday_menu;
create index if not exists meals_on_thursday_menu_idx on public.meals(on_thursday_menu) where on_thursday_menu;
