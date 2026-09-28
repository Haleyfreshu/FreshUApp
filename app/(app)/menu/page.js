import { createClient } from "@/lib/supabase/server";
import { MenuView } from "@/components/MenuView";
import { isOrderingOpenFor, closureFor, MENU_KEYS } from "@/lib/orderWindow";

export default async function MenuPage({ searchParams }) {
  const supabase = createClient();

  const [{ data: meals }, { data: closures }] = await Promise.all([
    supabase.from("meals").select("*, meal_option_groups(*, meal_options(*))").eq("is_active", true).order("created_at", { ascending: true }),
    supabase.from("menu_closures").select("*"),
  ]);

  const orderingOpenFor = {};
  const closureNoteFor = {};
  for (const k of MENU_KEYS) {
    const closure = closureFor(k, new Date(), closures || []);
    closureNoteFor[k] = closure?.note || null;
    orderingOpenFor[k] = isOrderingOpenFor(k) && !closure;
  }

  return <MenuView meals={meals || []} orderingOpenFor={orderingOpenFor} closureNoteFor={closureNoteFor} initialMenu={searchParams?.menu} />;
}
