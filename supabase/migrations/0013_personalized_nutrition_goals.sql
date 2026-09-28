-- Personalized nutrition targets need to know sex (the BMR formula used
-- to derive calorie/macro targets has a different constant for men and
-- women) and which training events are game days (competition days call
-- for a higher carb target than a normal practice day).

alter table public.profiles
  add column sex text check (sex in ('male', 'female'));

alter table public.training_events
  add column is_game_day boolean not null default false;
