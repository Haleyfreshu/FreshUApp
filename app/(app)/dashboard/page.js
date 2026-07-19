import { createClient } from "@/lib/supabase/server";
import { DashboardView } from "@/components/DashboardView";
import { civilDateStr, currentDayAbbrev, activeConsumptionWeekDates, activeOrderWindowDates } from "@/lib/orderWindow";

const ORDER_LOOKBACK_DAYS = 16; // generous superset; exact filtering happens by civil date below

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const today = civilDateStr();
  const { start: weekStart, end: weekEnd } = activeConsumptionWeekDates();
  const { start: orderWindowStart, end: orderWindowEnd } = activeOrderWindowDates();
  const lookbackSince = new Date(Date.now() - ORDER_LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: profile }, { data: todayLog }, { data: weekLog }, { data: recentOrders }, { data: todayEvents }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("daily_logs").select("*").eq("athlete_id", user.id).eq("log_date", today),
    supabase.from("daily_logs").select("meal_id").eq("athlete_id", user.id).gte("log_date", weekStart).lte("log_date", weekEnd),
    supabase.from("orders").select("*, order_items(*)").eq("athlete_id", user.id).in("status", ["This Week", "Delivered"]).gte("created_at", lookbackSince),
    supabase.from("training_events").select("*").eq("athlete_id", user.id).eq("day_of_week", currentDayAbbrev()),
  ]);

  // Orders were fetched with a generous lookback window (created_at is a
  // precise instant, awkward to range-query against a civil-date window
  // directly) — narrow to the exact Sun-Wed order window here using each
  // order's actual calendar date for the team's timezone.
  const activeOrders = (recentOrders || []).filter(o => {
    const d = civilDateStr(new Date(o.created_at));
    return d >= orderWindowStart && d <= orderWindowEnd;
  });
  const weeklyMeals = activeOrders.flatMap(o => o.order_items || []).map(item => ({ ...item, color: item.color || "#2A3EFF" }));

  const weekEatenMealIds = (weekLog || []).map(l => l.meal_id);

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
