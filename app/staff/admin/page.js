import { createClient } from "@/lib/supabase/server";
import { AdminView } from "@/components/AdminView";
import { getStripe } from "@/lib/stripe";
import { civilDateStr, currentDayAbbrev } from "@/lib/orderWindow";

export default async function AdminPage() {
  const supabase = createClient();
  const today = civilDateStr();

  const [{ data: meals }, { data: athletes }, { data: orders }, { data: closures }, { data: bogoCodes }, promos, { data: todayLogs }, { data: todayEvents }] = await Promise.all([
    supabase.from("meals").select("*, meal_option_groups(*, meal_options(*))").order("created_at", { ascending: true }),
    supabase.from("profiles").select("*").eq("role", "athlete").order("name", { ascending: true }),
    // Unpaid orders (abandoned checkout, expired Stripe session) aren't
    // real orders — only show ones payment was actually confirmed for.
    supabase.from("orders").select("*, order_items(*)").in("status", ["This Week", "Delivered"]).order("created_at", { ascending: false }),
    supabase.from("menu_closures").select("*").order("delivery_date", { ascending: true }),
    supabase.from("bogo_codes").select("*").order("created_at", { ascending: false }),
    getStripe().promotionCodes.list({ limit: 100, expand: ["data.coupon"] }),
    supabase.from("daily_logs").select("*").eq("log_date", today),
    supabase.from("training_events").select("*").eq("day_of_week", currentDayAbbrev()),
  ]);

  const normalizedOrders = (orders || []).map(o => ({ ...o, items: o.order_items || [] }));

  return (
    <AdminView
      initialMeals={meals || []}
      athletes={athletes || []}
      orders={normalizedOrders}
      initialClosures={closures || []}
      initialDiscounts={promos?.data || []}
      initialBogoCodes={bogoCodes || []}
      todayLogs={todayLogs || []}
      todayEvents={todayEvents || []}
    />
  );
}
