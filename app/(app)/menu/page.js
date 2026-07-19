import { createClient } from "@/lib/supabase/server";
import { MenuView } from "@/components/MenuView";
import { isOrderingOpen, civilDateStr } from "@/lib/orderWindow";

export default async function MenuPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const today = civilDateStr();

  const [{ data: meals }, { data: todayLog }] = await Promise.all([
    supabase.from("meals").select("*, meal_option_groups(*, meal_options(*))").eq("is_active", true).order("created_at", { ascending: true }),
    supabase.from("daily_logs").select("meal_id").eq("athlete_id", user.id).eq("log_date", today),
  ]);

  return <MenuView meals={meals || []} eatenMealIds={(todayLog || []).map(l => l.meal_id)} orderingOpen={isOrderingOpen()} />;
}
