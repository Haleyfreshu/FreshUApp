-- Replaces the single practice_days/practice_time fields on profiles with
-- multiple labeled training events per day-of-week (e.g. "Lift" at 7am and
-- "Practice" at 4pm on the same day), each with its own time, so the
-- dashboard's fueling schedule can react to each day's actual events
-- instead of one blanket practice time.

create table public.training_events (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  day_of_week text not null check (day_of_week in ('Mon','Tue','Wed','Thu','Fri','Sat','Sun')),
  label text not null,
  event_time text not null,
  created_at timestamptz not null default now()
);

create index training_events_athlete_day_idx on public.training_events(athlete_id, day_of_week);

alter table public.training_events enable row level security;

create policy "training_events: athlete manages own" on public.training_events
  for all using (athlete_id = auth.uid()) with check (athlete_id = auth.uid());

alter table public.profiles drop column if exists practice_days;
alter table public.profiles drop column if exists practice_time;
