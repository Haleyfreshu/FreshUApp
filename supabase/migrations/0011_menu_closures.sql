-- Lets staff cancel a specific upcoming delivery (holiday, supplier issue,
-- one-off skip) without touching the recurring weekly ordering-window
-- logic. A closure is keyed to one exact delivery date for one menu, so
-- only that single cycle is affected — the next week's cycle for that
-- same menu resumes normally.

create table public.menu_closures (
  id uuid primary key default gen_random_uuid(),
  menu_key text not null check (menu_key in ('monday', 'thursday')),
  delivery_date date not null,
  note text,
  created_at timestamptz not null default now(),
  unique (menu_key, delivery_date)
);

alter table public.menu_closures enable row level security;

create policy "menu_closures: readable by any signed-in user" on public.menu_closures
  for select using (auth.uid() is not null);

create policy "menu_closures: staff write" on public.menu_closures
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
