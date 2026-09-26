import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MealDetailView } from "@/components/MealDetailView";
import { isOrderingOpenFor, MENU_KEYS } from "@/lib/orderWindow";

export default async function MealDetailPage({ params, searchParams }) {
  const supabase = createClient();

  const { data: meal } = await supabase
    .from("meals")
    .select("*, meal_option_groups(*, meal_options(*))")
    .eq("id", params.mealId)
    .single();

  if (!meal) notFound();

  const requestedMenu = searchParams?.menu;
  const requestedMenuValid = requestedMenu === "monday" ? meal.on_monday_menu : requestedMenu === "thursday" ? meal.on_thursday_menu : false;
  const initialMenu = requestedMenuValid ? requestedMenu : meal.on_monday_menu ? "monday" : "thursday";

  const orderingOpenFor = Object.fromEntries(MENU_KEYS.map((k) => [k, isOrderingOpenFor(k)]));

  return <MealDetailView meal={meal} initialMenu={initialMenu} orderingOpenFor={orderingOpenFor} />;
}
