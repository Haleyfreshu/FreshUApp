"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Plus, Trash2 } from "lucide-react";
import { MealCard, Tag } from "@/components/MealCard";
import { FRESHU_LOGO } from "@/components/Shell";
import { LogFoodModal } from "@/components/LogFoodModal";
import { BUDDY_STATES, fuelState, computeFuelScore } from "@/lib/fuel";
import { addMinutes, minutesOfDay, timeStrFromMinutes, fmtTime } from "@/lib/format";
import { computeMealMinutes, DEFAULT_MEAL_MINUTES } from "@/lib/schedule";
import { optionsLabel } from "@/lib/mealOptions";
import { civilDateStr, MENUS } from "@/lib/orderWindow";
import { createClient } from "@/lib/supabase/client";

export function DashboardView({ profile, todayLog, weeklyMeals, weekEatenMealIds, todayEvents }) {
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

  const eatenTodayIds = new Set(todayLog.map(l => l.meal_id));
  const eatenThisWeekIds = new Set(weekEatenMealIds);

  // Quick Log meals are already-purchased order items — their macros and
  // any customization are locked in from checkout, so logging them just
  // records exactly what was ordered, no picker needed.
  const handleEatOrdered = async (item) => {
    setPending(item.meal_id);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("daily_logs").upsert({
      athlete_id: user.id,
      meal_id: item.meal_id,
      log_date: civilDateStr(),
      name: item.name, emoji: item.emoji,
      calories: item.calories, protein: item.protein, carbs: item.carbs, fat: item.fat,
      selected_options: item.selected_options || [],
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
          <div style={{ fontSize: 13, color: "var(--fu-text-secondary)" }}>Welcome back,</div>
          <div style={{ fontFamily: "'Baloo 2',sans-serif", fontWeight: 800, fontSize: 21, color: "var(--fu-text)" }}>{profile.name?.split(" ")[0] || "Athlete"}</div>
        </div>
        <div style={{ height: 40, borderRadius: 12, background: "var(--fu-card)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 10px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={FRESHU_LOGO} alt="FreshU" style={{ height: 16, width: "auto", display: "block" }} />
        </div>
      </div>

      <div style={{ background: "var(--fu-cta-bg)", color: "var(--fu-cta-text)", borderRadius: 24, padding: "20px 20px 22px", marginTop: 18, boxShadow: "0 4px 20px rgba(0,0,0,0.35)" }}>
        <div style={{ fontFamily: "'Baloo 2',sans-serif", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", letterSpacing: 1, opacity: 0.6 }}>Fuel Score</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, gap: 14 }}>
          <div style={{ fontFamily: "'Baloo 2',sans-serif", fontWeight: 800, fontSize: 62, lineHeight: 0.85, fontVariantNumeric: "tabular-nums" }}>{score}</div>
          <span style={{
            fontFamily: "'Baloo 2',sans-serif", fontWeight: 700, fontSize: 12.5, padding: "6px 13px",
            borderRadius: 999, color: "#fff", background: state.color, whiteSpace: "nowrap"
          }}>{state.label}</span>
        </div>
        <div style={{ fontSize: 13, marginTop: 12, lineHeight: 1.4, opacity: 0.7 }}>{state.msg}</div>
      </div>

      <div style={{ background: "var(--fu-card)", borderRadius: 24, padding: "18px 18px 20px", marginTop: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.35)" }}>
        <div style={{ fontFamily: "'Baloo 2',sans-serif", fontWeight: 800, fontSize: 15, color: "var(--fu-text)" }}>Today&apos;s Fuel</div>
        <div style={{ height: 2.5, background: "#fff", margin: "12px 0 2px", borderRadius: 1 }} />
        {[
          ["Calories", totals.calories, profile.calorie_goal, ""],
          ["Protein", totals.protein, profile.protein_goal, "g"],
          ["Carbs", totals.carbs, profile.carb_goal, "g"],
          ["Fat", totals.fat, profile.fat_goal, "g"],
        ].map(([label, current, goal, unit], i, arr) => (
          <div key={label}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "5px 0" }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--fu-text-muted)" }}>{label}</span>
              <span style={{ fontFamily: "'Baloo 2',sans-serif", fontWeight: 700, fontSize: 17, color: "var(--fu-text)", fontVariantNumeric: "tabular-nums" }}>
                {current}{unit} <span style={{ fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 12.5, color: "var(--fu-text-muted)" }}>/ {goal}{unit}</span>
              </span>
            </div>
            <div style={{ height: i === arr.length - 1 ? 2.5 : 1, background: i === arr.length - 1 ? "#fff" : "var(--fu-border)", margin: "9px 0", borderRadius: 1 }} />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontFamily: "'Baloo 2',sans-serif", fontWeight: 800, fontSize: 15, color: "var(--fu-text)" }}>Today&apos;s Log</div>
          <button onClick={() => setShowLogFood(true)} style={{
            display: "flex", alignItems: "center", gap: 6, background: "var(--fu-cta-bg)", border: "none", borderRadius: 12,
            padding: "8px 12px", color: "var(--fu-cta-text)", fontWeight: 700, fontSize: 12, cursor: "pointer"
          }}>
            <Plus size={13} /> Log food
          </button>
        </div>
        {todayLog.length === 0 ? (
          <div style={{ background: "var(--fu-card)", borderRadius: 18, padding: "20px 16px", textAlign: "center", color: "var(--fu-text-muted)", fontSize: 13, boxShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>
            Nothing logged yet today.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {todayLog.map(entry => (
              <div key={entry.id} style={{ background: "var(--fu-card)", borderRadius: 16, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>
                <div style={{ fontSize: 20 }}>{entry.emoji || "🍽️"}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "var(--fu-text)" }}>{entry.name}</div>
                  {entry.selected_options?.length > 0 && (
                    <div style={{ fontSize: 11, color: "var(--fu-text-secondary)", marginTop: 1 }}>{optionsLabel(entry.selected_options)}</div>
                  )}
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
        <div style={{ fontFamily: "'Baloo 2',sans-serif", fontWeight: 800, fontSize: 15, color: "var(--fu-text)" }}>Your Fueling Schedule</div>
        {scheduleAdjusted && (
          <div style={{ fontSize: 11.5, color: "var(--fu-text-muted)", marginTop: 2, marginBottom: 8 }}>Auto-adjusted around today&apos;s training</div>
        )}
        <div style={{ background: "var(--fu-card)", borderRadius: 20, padding: "6px 4px", boxShadow: "0 4px 20px rgba(0,0,0,0.35)", marginTop: scheduleAdjusted ? 0 : 10 }}>
          {schedule.map((s, i) => (
            <div key={`${s.slot}-${s.minutes}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: i < schedule.length - 1 ? "1px solid var(--fu-border)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Clock size={15} color="var(--fu-text-muted)" />
                <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--fu-text)" }}>{s.slot}</span>
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--fu-text-secondary)" }}>{s.time}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ fontFamily: "'Baloo 2',sans-serif", fontWeight: 800, fontSize: 15, color: "var(--fu-text)", marginBottom: 10 }}>Quick Log</div>
        {weeklyMeals.length === 0 ? (
          <div style={{ background: "var(--fu-card)", borderRadius: 18, padding: "20px 16px", textAlign: "center", color: "var(--fu-text-muted)", fontSize: 13, boxShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>
            No meals ordered yet — order Sunday-Wednesday for Monday delivery, or any day the week before for Thursday delivery, and they&apos;ll show up here.
          </div>
        ) : (
          Object.keys(MENUS).map((menuKey) => {
            const items = weeklyMeals.filter((m) => m.menuKey === menuKey);
            if (items.length === 0) return null;
            return (
              <div key={menuKey} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--fu-text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>{MENUS[menuKey].label}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {items.map(item => (
                    <MealCard key={item.id} meal={item} compact onEat={() => handleEatOrdered(item)}
                      eaten={eatenThisWeekIds.has(item.meal_id) || eatenTodayIds.has(item.meal_id) || pending === item.meal_id} />
                  ))}
                </div>
              </div>
            );
          })
        )}
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
