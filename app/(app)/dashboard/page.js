import { createClient } from "@/lib/supabase/server";
import { DashboardView } from "@/components/DashboardView";
import { SLOT_ORDER } from "@/lib/constants";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: profile }, { data: todayLog }, { data: meals }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("daily_logs").select("*").eq("athlete_id", user.id).eq("log_date", today),
    supabase.from("meals").select("*").order("created_at", { ascending: true }),
  ]);

  const suggested = (meals || []).filter(m => SLOT_ORDER.includes(m.category)).slice(0, 4);

  return <DashboardView profile={profile} todayLog={todayLog || []} suggested={suggested} />;
}
