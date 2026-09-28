-- Hydration tracking (own its own table rather than overloading
-- daily_logs, since a water entry has no meal/macro shape).
create table public.hydration_logs (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null default current_date,
  ounces int not null,
  logged_at timestamptz not null default now()
);

create index hydration_logs_athlete_date_idx on public.hydration_logs(athlete_id, log_date);

alter table public.hydration_logs enable row level security;

create policy "hydration_logs: athlete manages own" on public.hydration_logs
  for all using (athlete_id = auth.uid()) with check (athlete_id = auth.uid());

create policy "hydration_logs: staff read" on public.hydration_logs
  for select using (public.is_staff(auth.uid()));

-- Staff need to see today's fuel status across the team (a "who's
-- under-fueled today" view), which daily_logs didn't allow before —
-- athletes could only see their own rows. Also needed: today's training
-- events, to know which athletes are on a game day for that same view.
create policy "daily_logs: staff read" on public.daily_logs
  for select using (public.is_staff(auth.uid()));

create policy "training_events: staff read" on public.training_events
  for select using (public.is_staff(auth.uid()));
