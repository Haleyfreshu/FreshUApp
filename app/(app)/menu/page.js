import { createClient } from "@/lib/supabase/server";
import { MenuView } from "@/components/MenuView";
import { isOrderingOpenFor, MENU_KEYS } from "@/lib/orderWindow";

export default async function MenuPage({ searchParams }) {
  const supabase = createClient();

  const { data: meals } = await supabase
    .from("meals")
    .select("*, meal_option_groups(*, meal_options(*))")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  const orderingOpenFor = Object.fromEntries(MENU_KEYS.map((k) => [k, isOrderingOpenFor(k)]));

  return <MenuView meals={meals || []} orderingOpenFor={orderingOpenFor} initialMenu={searchParams?.menu} />;
}
