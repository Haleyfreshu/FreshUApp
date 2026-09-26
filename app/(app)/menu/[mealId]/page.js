import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MealDetailView } from "@/components/MealDetailView";
import { civilDateStr, isOrderingOpenFor, MENU_KEYS } from "@/lib/orderWindow";

export default async function MealDetailPage({ params, searchParams }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const today = civilDateStr();

  const [{ data: meal }, { data: todayLog }] = await Promise.all([
    supabase.from("meals").select("*, meal_option_groups(*, meal_options(*))").eq("id", params.mealId).single(),
    supabase.from("daily_logs").select("meal_id").eq("athlete_id", user.id).eq("log_date", today),
  ]);

  if (!meal) notFound();

  const requestedMenu = searchParams?.menu;
  const requestedMenuValid = requestedMenu === "monday" ? meal.on_monday_menu : requestedMenu === "thursday" ? meal.on_thursday_menu : false;
  const initialMenu = requestedMenuValid ? requestedMenu : meal.on_monday_menu ? "monday" : "thursday";

  const orderingOpenFor = Object.fromEntries(MENU_KEYS.map((k) => [k, isOrderingOpenFor(k)]));
  const eaten = (todayLog || []).some((l) => l.meal_id === meal.id);

  return <MealDetailView meal={meal} initialMenu={initialMenu} orderingOpenFor={orderingOpenFor} eaten={eaten} />;
}
