import { createClient } from "@/lib/supabase/server";
import { FuelHistoryView } from "@/components/FuelHistoryView";
import { civilDateStr, addCivilDays } from "@/lib/orderWindow";

const HISTORY_DAYS = 14;

function weekdayAbbrevOf(dateStr) {
  return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
}

export default async function FuelHistoryPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const today = civilDateStr();
  // Yesterday back through HISTORY_DAYS-1 days ago — "previous days," not
  // including today (today's score is still moving and already lives on
  // the Dashboard).
  const dateStrs = Array.from({ length: HISTORY_DAYS }, (_, i) => addCivilDays(today, -(i + 1)));
  const oldestDate = dateStrs[dateStrs.length - 1];

  const [{ data: profile }, { data: logs }, { data: events }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("daily_logs").select("*").eq("athlete_id", user.id).gte("log_date", oldestDate).lte("log_date", dateStrs[0]),
    supabase.from("training_events").select("day_of_week, is_game_day").eq("athlete_id", user.id),
  ]);

  const days = dateStrs.map((dateStr) => {
    const dayAbbrev = weekdayAbbrevOf(dateStr);
    const isGameDay = (events || []).some((e) => e.day_of_week === dayAbbrev && e.is_game_day);
    const dayLogs = (logs || []).filter((l) => l.log_date === dateStr);
    return { date: dateStr, isGameDay, logs: dayLogs };
  });

  return <FuelHistoryView profile={profile} days={days} />;
}
