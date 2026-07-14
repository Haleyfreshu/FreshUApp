"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, Beef, Wheat, Droplet, Clock, Plus, Trash2 } from "lucide-react";
import { Ring } from "@/components/Ring";
import { FuelBuddy } from "@/components/FuelBuddy";
import { MacroBar } from "@/components/MacroBar";
import { MealCard, Tag } from "@/components/MealCard";
import { FRESHU_LOGO } from "@/components/Shell";
import { LogFoodModal } from "@/components/LogFoodModal";
import { BUDDY_STATES, fuelState, computeFuelScore } from "@/lib/fuel";
import { addMinutes, minutesOfDay, timeStrFromMinutes, fmtTime } from "@/lib/format";
import { computeMealMinutes, DEFAULT_MEAL_MINUTES } from "@/lib/schedule";
import { createClient } from "@/lib/supabase/client";

export function DashboardView({ profile, todayLog, suggested, todayEvents }) {
  const router = useRouter();
  const [pending, setPending] = useState(null);
  const [showLogFood, setShowLogFood] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const totals = useMemo(() => todayLog.reduce((acc, m) => ({
    calories: acc.calories + (m.calories || 0), protein: acc.protein + (m.protein || 0),
    carbs: acc.carbs + (m.carbs || 0), fat: acc.fat + (m.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 }), [todayLog]);

  const score = useMemo(() => computeFuelScore(totals, profile), [totals, profile]);
  const state = BUDDY_STATES[fuelState(score)];

  const mealMinutes = useMemo(() => computeMealMinutes(todayEvents), [todayEvents]);
  const scheduleAdjusted = useMemo(
    () => Object.keys(mealMinutes).some(k => mealMinutes[k] !== DEFAULT_MEAL_MINUTES[k]),
    [mealMinutes]
  );

  const schedule = useMemo(() => {
    const mealTimes = Object.values(mealMinutes);
    // A meal already covers a pre/post training window if it lands within
    // 20 minutes of it — showing both would just be the same eating
    // occasion listed twice (e.g. an early lift can push Breakfast right
    // up against its own pre-fuel snack).
    const coveredByMeal = (minutes) => mealTimes.some(m => Math.abs(m - minutes) <= 20);

    const entries = Object.entries(mealMinutes).map(([label, minutes]) => (
      { slot: label, minutes, time: fmtTime(timeStrFromMinutes(minutes)) }
    ));
    todayEvents.forEach(ev => {
      entries.push({ slot: ev.label, minutes: minutesOfDay(ev.event_time), time: fmtTime(ev.event_time) });
      const pre = addMinutes(ev.event_time, -60);
      const preMinutes = minutesOfDay(pre);
      if (!coveredByMeal(preMinutes)) {
        entries.push({ slot: `Pre-${ev.label} Fuel`, minutes: preMinutes, time: fmtTime(pre) });
      }
      const post = addMinutes(ev.event_time, 45);
      const postMinutes = minutesOfDay(post);
      if (!coveredByMeal(postMinutes)) {
        entries.push({ slot: `Post-${ev.label} Recovery`, minutes: postMinutes, time: fmtTime(post) });
      }
    });
    return entries.sort((a, b) => a.minutes - b.minutes);
  }, [mealMinutes, todayEvents]);

  const eatenMealIds = new Set(todayLog.map(l => l.meal_id));

  const handleEat = async (meal) => {
    setPending(meal.id);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("daily_logs").upsert({
      athlete_id: user.id,
      meal_id: meal.id,
      log_date: new Date().toISOString().slice(0, 10),
      name: meal.name, emoji: meal.emoji,
      calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat,
    }, { onConflict: "athlete_id,meal_id,log_date" });
    setPending(null);
    router.refresh();
  };

  const handleDeleteLog = async (logId) => {
    setDeletingId(logId);
    const supabase = createClient();
    await supabase.from("daily_logs").delete().eq("id", logId);
    setDeletingId(null);
    router.refresh();
  };

  return (
    <div style={{ padding: "18px 20px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13, color: "#6B7290" }}>Welcome back,</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 21, color: "#0B0E1A" }}>{profile.name?.split(" ")[0] || "Athlete"}</div>
        </div>
        <div style={{ height: 40, borderRadius: 12, background: "#0B0E1A", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 10px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={FRESHU_LOGO} alt="FreshU" style={{ height: 16, width: "auto", display: "block" }} />
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 24, padding: "22px 16px", marginTop: 18, boxShadow: "0 4px 20px rgba(15,20,50,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 26, flexWrap: "wrap" }}>
          <Ring size={168} stroke={14} progress={score} gradientId="fuelGrad" colors={["#2A3EFF", "#33D3A3"]}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 42, color: "#0B0E1A", lineHeight: 1 }}>{score}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9AA0BF", letterSpacing: 1, marginTop: 2 }}>FUEL SCORE</div>
            </div>
          </Ring>
          <FuelBuddy score={score} size={104} />
        </div>
        <div style={{
          marginTop: 16, background: `${state.color}12`, borderRadius: 14, padding: "12px 14px",
          fontSize: 13, color: "#0B0E1A", fontWeight: 600, textAlign: "center", lineHeight: 1.4
        }}>
          {state.msg}
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 24, padding: "18px 18px 6px", marginTop: 16, boxShadow: "0 4px 20px rgba(15,20,50,0.06)" }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 15, color: "#0B0E1A", marginBottom: 14 }}>Today&apos;s Fuel</div>
        <MacroBar icon={Flame} label="Calories" current={totals.calories} goal={profile.calorie_goal} unit="" color="#2A3EFF" />
        <MacroBar icon={Beef} label="Protein" current={totals.protein} goal={profile.protein_goal} unit="g" color="#33D3A3" />
        <MacroBar icon={Wheat} label="Carbs" current={totals.carbs} goal={profile.carb_goal} unit="g" color="#FFB648" />
        <MacroBar icon={Droplet} label="Fat" current={totals.fat} goal={profile.fat_goal} unit="g" color="#8C93B8" />
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 15, color: "#0B0E1A" }}>Today&apos;s Log</div>
          <button onClick={() => setShowLogFood(true)} style={{
            display: "flex", alignItems: "center", gap: 6, background: "#2A3EFF", border: "none", borderRadius: 12,
            padding: "8px 12px", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer"
          }}>
            <Plus size={13} /> Log food
          </button>
        </div>
        {todayLog.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 18, padding: "20px 16px", textAlign: "center", color: "#9AA0BF", fontSize: 13, boxShadow: "0 2px 10px rgba(15,20,50,0.05)" }}>
            Nothing logged yet today.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {todayLog.map(entry => (
              <div key={entry.id} style={{ background: "#fff", borderRadius: 16, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 2px 10px rgba(15,20,50,0.05)" }}>
                <div style={{ fontSize: 20 }}>{entry.emoji || "🍽️"}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#0B0E1A" }}>{entry.name}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                    <Tag label={`${entry.calories} cal`} />
                    <Tag label={`${entry.protein}g P`} />
                    <Tag label={`${entry.carbs}g C`} />
                    <Tag label={`${entry.fat}g F`} />
                  </div>
                </div>
                <button onClick={() => handleDeleteLog(entry.id)} disabled={deletingId === entry.id} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, flexShrink: 0 }}>
                  <Trash2 size={15} color="#FF5A5F" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 15, color: "#0B0E1A" }}>Your Fueling Schedule</div>
        {scheduleAdjusted && (
          <div style={{ fontSize: 11.5, color: "#9AA0BF", marginTop: 2, marginBottom: 8 }}>Auto-adjusted around today&apos;s training</div>
        )}
        <div style={{ background: "#fff", borderRadius: 20, padding: "6px 4px", boxShadow: "0 4px 20px rgba(15,20,50,0.06)", marginTop: scheduleAdjusted ? 0 : 10 }}>
          {schedule.map((s, i) => (
            <div key={`${s.slot}-${s.minutes}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: i < schedule.length - 1 ? "1px solid #F3F5FB" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Clock size={15} color="#2A3EFF" />
                <span style={{ fontSize: 13.5, fontWeight: 600, color: "#0B0E1A" }}>{s.slot}</span>
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "#6B7290" }}>{s.time}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 15, color: "#0B0E1A", marginBottom: 10 }}>Quick Log</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {suggested.map(m => (
            <MealCard key={m.id} meal={m} compact onEat={() => handleEat(m)} eaten={eatenMealIds.has(m.id) || pending === m.id} />
          ))}
        </div>
      </div>

      {showLogFood && (
        <LogFoodModal
          onClose={() => setShowLogFood(false)}
          onSaved={() => { setShowLogFood(false); router.refresh(); }}
        />
      )}
    </div>
  );
}
