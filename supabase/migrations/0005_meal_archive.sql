-- Meals can't be hard-deleted once they've been ordered or logged (the
-- order_items/daily_logs foreign keys block it), and the admin UI was
-- silently failing in that case. Add an is_active flag so staff can
-- archive a meal (hide it from the athlete-facing menu) instead, while
-- keeping order history intact.

alter table public.meals add column if not exists is_active boolean not null default true;
