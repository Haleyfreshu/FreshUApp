-- Meal options now hold the meal's ACTUAL total macros when that option
-- is picked, not a delta added on top of the base meal. "High Protein"
-- replaces the meal's calories/protein/carbs/fat with its own numbers
-- rather than adding to them — matches how staff actually think about a
-- variant (a full replacement profile, not an add-on).
--
-- Price stays additive: a variant can still cost extra on top of the
-- base price, so price_delta is untouched.
--
-- Existing delta values are converted to absolute equivalents
-- (base meal's macro + old delta), so anything already selectable today
-- keeps computing to the exact same result it does right now — only
-- future edits in Staff Admin use the new absolute fields.

alter table public.meal_options add column if not exists calories int;
alter table public.meal_options add column if not exists protein int;
alter table public.meal_options add column if not exists carbs int;
alter table public.meal_options add column if not exists fat int;

update public.meal_options mo
set
  calories = m.calories + mo.calories_delta,
  protein = m.protein + mo.protein_delta,
  carbs = m.carbs + mo.carbs_delta,
  fat = m.fat + mo.fat_delta
from public.meal_option_groups g
join public.meals m on m.id = g.meal_id
where mo.group_id = g.id;

alter table public.meal_options alter column calories set not null;
alter table public.meal_options alter column protein set not null;
alter table public.meal_options alter column carbs set not null;
alter table public.meal_options alter column fat set not null;

alter table public.meal_options drop column calories_delta;
alter table public.meal_options drop column protein_delta;
alter table public.meal_options drop column carbs_delta;
alter table public.meal_options drop column fat_delta;
