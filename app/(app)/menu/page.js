import { createClient } from "@/lib/supabase/server";
import { MenuView } from "@/components/MenuView";
import { isOrderingOpenFor, civilDateStr, MENU_KEYS } from "@/lib/orderWindow";

export default async function MenuPage({ searchParams }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const today = civilDateStr();

  const [{ data: meals }, { data: todayLog }] = await Promise.all([
    supabase.from("meals").select("*, meal_option_groups(*, meal_options(*))").eq("is_active", true).order("created_at", { ascending: true }),
    supabase.from("daily_logs").select("meal_id").eq("athlete_id", user.id).eq("log_date", today),
  ]);

  const orderingOpenFor = Object.fromEntries(MENU_KEYS.map((k) => [k, isOrderingOpenFor(k)]));

  return <MenuView meals={meals || []} eatenMealIds={(todayLog || []).map(l => l.meal_id)} orderingOpenFor={orderingOpenFor} initialMenu={searchParams?.menu} />;
}
