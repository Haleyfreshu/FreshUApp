"use client";

import { useRouter } from "next/navigation";
import { TopBar } from "@/components/Shell";
import { BUDDY_STATES, fuelState, computeFuelScore } from "@/lib/fuel";
import { calculateNutritionGoals } from "@/lib/nutritionCalc";

function fmtHistoryDate(dateStr) {
  return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
}

export function FuelHistoryView({ profile, days }) {
  const router = useRouter();

  const rows = days.map((d) => {
    const totals = d.logs.reduce((acc, m) => ({
      calories: acc.calories + (m.calories || 0), protein: acc.protein + (m.protein || 0),
      carbs: acc.carbs + (m.carbs || 0), fat: acc.fat + (m.fat || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    const hasLogs = d.logs.length > 0;
    const gameDayGoals = d.isGameDay ? calculateNutritionGoals({
      sex: profile.sex, age: profile.age, heightIn: profile.height, weightLb: profile.weight,
      sport: profile.sport, goal: profile.goal, dayType: "game",
    }) : null;
    const targets = gameDayGoals || {
      calories: profile.calorie_goal, protein: profile.protein_goal, carbs: profile.carb_goal, fat: profile.fat_goal,
    };
    const score = hasLogs ? computeFuelScore(totals, { calorie_goal: targets.calories, protein_goal: targets.protein, carb_goal: targets.carbs, fat_goal: targets.fat }) : null;
    const state = score !== null ? BUDDY_STATES[fuelState(score)] : null;

    return { ...d, totals, hasLogs, score, state };
  });

  return (
    <>
      <TopBar title="Fuel History" onBack={() => router.push("/dashboard")} />
      <div style={{ padding: "0 20px 20px" }}>
        <div style={{ fontSize: 12.5, color: "var(--fu-text-secondary)", marginBottom: 16, lineHeight: 1.4 }}>
          Your last {days.length} days — how you fueled compared to your daily target.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((r) => (
            <div key={r.date} style={{ background: "var(--fu-card)", borderRadius: 16, padding: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: "var(--fu-text)" }}>{fmtHistoryDate(r.date)}</span>
                  {r.isGameDay && <span style={{ fontSize: 9.5, fontWeight: 800, color: "var(--fu-cta-text)", background: "var(--fu-cta-bg)", padding: "2px 6px", borderRadius: 999 }}>GAME</span>}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--fu-text-muted)", marginTop: 2 }}>
                  {r.hasLogs ? `${r.totals.calories} cal · ${r.totals.protein}g P · ${r.totals.carbs}g C · ${r.totals.fat}g F` : "Nothing logged"}
                </div>
              </div>
              {r.state ? (
                <span style={{
                  fontFamily: "'Baloo 2',sans-serif", fontWeight: 700, fontSize: 13, padding: "6px 12px",
                  borderRadius: 999, color: "#fff", background: r.state.color, whiteSpace: "nowrap"
                }}>{r.score} · {r.state.label}</span>
              ) : (
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--fu-text-muted)", whiteSpace: "nowrap" }}>No log</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
