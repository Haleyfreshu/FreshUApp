import { createClient } from "@/lib/supabase/server";
import { DashboardView } from "@/components/DashboardView";
import { civilDateStr, currentDayAbbrev, activeConsumptionWeekFor, activeOrderWindowFor, MENU_KEYS } from "@/lib/orderWindow";

const ORDER_LOOKBACK_DAYS = 20; // generous superset; exact filtering happens by civil date below

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const today = civilDateStr();

  const consumptionWeeks = Object.fromEntries(MENU_KEYS.map((k) => [k, activeConsumptionWeekFor(k)]));
  const orderWindows = Object.fromEntries(MENU_KEYS.map((k) => [k, activeOrderWindowFor(k)]));
  const weekLogStart = MENU_KEYS.map((k) => consumptionWeeks[k].start).sort()[0];
  const weekLogEnd = MENU_KEYS.map((k) => consumptionWeeks[k].end).sort().at(-1);
  const lookbackSince = new Date(Date.now() - ORDER_LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: profile }, { data: todayLog }, { data: weekLog }, { data: recentOrders }, { data: todayEvents }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("daily_logs").select("*").eq("athlete_id", user.id).eq("log_date", today),
    supabase.from("daily_logs").select("meal_id").eq("athlete_id", user.id).gte("log_date", weekLogStart).lte("log_date", weekLogEnd),
    supabase.from("orders").select("*, order_items(*)").eq("athlete_id", user.id).in("status", ["This Week", "Delivered"]).gte("created_at", lookbackSince),
    supabase.from("training_events").select("*").eq("athlete_id", user.id).eq("day_of_week", currentDayAbbrev()),
  ]);

  // Orders were fetched with a generous lookback window (created_at is a
  // precise instant, awkward to range-query against a civil-date window
  // directly) — narrow each menu to its own exact order window here using
  // each order's actual calendar date for the team's timezone. Since the
  // two menus are fully separate meal catalogs, a meal_id can only ever
  // belong to one of them, so the two batches can be flattened together
  // safely below.
  const weeklyMeals = MENU_KEYS.flatMap((menuKey) => {
    const { start, end } = orderWindows[menuKey];
    const menuOrders = (recentOrders || []).filter((o) => {
      if (o.delivery_day !== menuKey) return false;
      const d = civilDateStr(new Date(o.created_at));
      return d >= start && d <= end;
    });
    return menuOrders.flatMap((o) => o.order_items || []).map((item) => ({ ...item, menuKey }));
  });

  const weekEatenMealIds = (weekLog || []).map((l) => l.meal_id);

  return (
    <DashboardView
      profile={profile}
      todayLog={todayLog || []}
      weeklyMeals={weeklyMeals}
      weekEatenMealIds={weekEatenMealIds}
      todayEvents={todayEvents || []}
    />
  );
}
