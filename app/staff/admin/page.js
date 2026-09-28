import { createClient } from "@/lib/supabase/server";
import { AdminView } from "@/components/AdminView";
import { getStripe } from "@/lib/stripe";

export default async function AdminPage() {
  const supabase = createClient();

  const [{ data: meals }, { data: athletes }, { data: orders }, { data: closures }, promos] = await Promise.all([
    supabase.from("meals").select("*, meal_option_groups(*, meal_options(*))").order("created_at", { ascending: true }),
    supabase.from("profiles").select("*").eq("role", "athlete").order("name", { ascending: true }),
    supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }),
    supabase.from("menu_closures").select("*").order("delivery_date", { ascending: true }),
    getStripe().promotionCodes.list({ limit: 100, expand: ["data.coupon"] }),
  ]);

  const normalizedOrders = (orders || []).map(o => ({ ...o, items: o.order_items || [] }));

  return (
    <AdminView
      initialMeals={meals || []}
      athletes={athletes || []}
      orders={normalizedOrders}
      initialClosures={closures || []}
      initialDiscounts={promos?.data || []}
    />
  );
}
