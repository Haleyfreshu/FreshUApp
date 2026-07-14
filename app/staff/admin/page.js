import { createClient } from "@/lib/supabase/server";
import { AdminView } from "@/components/AdminView";

export default async function AdminPage() {
  const supabase = createClient();

  const [{ data: meals }, { data: athletes }, { data: orders }] = await Promise.all([
    supabase.from("meals").select("*, meal_option_groups(*, meal_options(*))").order("created_at", { ascending: true }),
    supabase.from("profiles").select("*").eq("role", "athlete").order("name", { ascending: true }),
    supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }),
  ]);

  const normalizedOrders = (orders || []).map(o => ({ ...o, items: o.order_items || [] }));

  return <AdminView initialMeals={meals || []} athletes={athletes || []} orders={normalizedOrders} />;
}
