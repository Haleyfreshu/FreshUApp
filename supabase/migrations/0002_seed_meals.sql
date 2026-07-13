-- Seeds the weekly menu with the same starter meals from the FreshU prototype.
-- Safe to re-run — it only inserts if the meals table is empty.

insert into public.meals (name, category, emoji, color, ingredients, calories, protein, carbs, fat, price)
select * from (values
  ('Grilled Chicken Power Bowl', 'Lunch', '🍗', '#2A3EFF', 'Grilled chicken breast, quinoa, roasted vegetables, avocado, lemon-herb dressing', 620, 52, 58, 18, 12.5),
  ('Sweet Potato Turkey Hash', 'Breakfast', '🍳', '#FFB648', 'Ground turkey, sweet potato, peppers, onion, fried egg', 480, 38, 45, 16, 10.5),
  ('Salmon & Farro Recovery Plate', 'Dinner', '🐟', '#1A28C4', 'Wild salmon, farro, charred broccoli, citrus glaze', 590, 44, 50, 22, 14),
  ('Overnight Protein Oats', 'Breakfast', '🥣', '#33D3A3', 'Rolled oats, whey protein, chia, banana, almond butter', 410, 32, 48, 10, 8.5),
  ('Beef & Rice Power Bowl', 'Post-Practice Recovery', '🥩', '#2A3EFF', 'Grass-fed beef, jasmine rice, charred corn, chimichurri', 650, 48, 62, 20, 13),
  ('Egg White Veggie Scramble', 'Breakfast', '🍳', '#FFB648', 'Egg whites, spinach, mushroom, feta, whole-grain toast', 350, 30, 24, 14, 9),
  ('Peanut Butter Recovery Shake', 'Post-Practice Recovery', '🥤', '#33D3A3', 'Whey isolate, peanut butter, banana, oat milk', 420, 35, 40, 14, 7.5),
  ('Mediterranean Chicken Wrap', 'Lunch', '🌯', '#2A3EFF', 'Grilled chicken, hummus, cucumber, tomato, spinach wrap', 540, 40, 48, 18, 11),
  ('Pre-Practice Energy Bowl', 'Pre-Practice Fuel', '🍌', '#FFB648', 'Oats, banana, honey, almond butter, sea salt', 380, 22, 58, 8, 9.5),
  ('Teriyaki Tofu Bowl', 'Dinner', '🥢', '#1A28C4', 'Crispy tofu, jasmine rice, edamame, teriyaki glaze', 520, 32, 60, 14, 11.5),
  ('Greek Yogurt Berry Parfait', 'Evening Snack', '🍓', '#33D3A3', 'Greek yogurt, mixed berries, granola, honey', 260, 22, 30, 6, 6),
  ('BBQ Chicken Sweet Potato Plate', 'Dinner', '🍠', '#2A3EFF', 'BBQ chicken thigh, mashed sweet potato, green beans', 610, 50, 55, 16, 13.5)
) as seed(name, category, emoji, color, ingredients, calories, protein, carbs, fat, price)
where not exists (select 1 from public.meals);
