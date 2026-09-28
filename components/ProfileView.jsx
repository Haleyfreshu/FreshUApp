"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Field } from "@/components/Fields";
import { TrainingScheduleEditor } from "@/components/TrainingScheduleEditor";
import { fmtTime } from "@/lib/format";
import { calculateNutritionGoals } from "@/lib/nutritionCalc";
import { createClient } from "@/lib/supabase/client";

export function ProfileView({ profile, initialEvents }) {
  const router = useRouter();
  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(profile);
  useEffect(() => setForm(profile), [profile]);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const [editSchedule, setEditSchedule] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [events, setEvents] = useState(initialEvents);
  useEffect(() => setEvents(initialEvents), [initialEvents]);

  const save = async () => {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("profiles").update({
      school: form.school, sport: form.sport, sex: form.sex,
      age: form.age === "" ? null : Number(form.age),
      height: form.height === "" ? null : Number(form.height),
      weight: form.weight === "" ? null : Number(form.weight),
      calorie_goal: Number(form.calorie_goal), protein_goal: Number(form.protein_goal),
      carb_goal: Number(form.carb_goal), fat_goal: Number(form.fat_goal),
    }).eq("id", profile.id);
    setSaving(false);
    setEdit(false);
    router.refresh();
  };

  const recalculate = () => {
    const computed = calculateNutritionGoals({
      sex: form.sex, age: Number(form.age), heightIn: Number(form.height), weightLb: Number(form.weight),
      sport: form.sport, goal: profile.goal,
    });
    if (!computed) return;
    setForm(f => ({ ...f, calorie_goal: computed.calories, protein_goal: computed.protein, carb_goal: computed.carbs, fat_goal: computed.fat }));
  };

  const saveSchedule = async () => {
    setSavingSchedule(true);
    const supabase = createClient();
    await supabase.from("training_events").delete().eq("athlete_id", profile.id);
    const cleanEvents = events.filter(e => e.label.trim());
    if (cleanEvents.length > 0) {
      await supabase.from("training_events").insert(
        cleanEvents.map(e => ({ athlete_id: profile.id, day_of_week: e.day_of_week, label: e.label.trim(), event_time: e.event_time, is_game_day: !!e.is_game_day }))
      );
    }
    setSavingSchedule(false);
    setEditSchedule(false);
    router.refresh();
  };

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div style={{ padding: "18px 20px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: "'Baloo 2',sans-serif", fontWeight: 800, fontSize: 22, color: "var(--fu-text)" }}>Profile</div>
        <button onClick={() => edit ? save() : setEdit(true)} disabled={saving} style={{ background: "var(--fu-cta-bg)", border: "none", borderRadius: 12, padding: "9px 14px", color: "var(--fu-cta-text)", fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>
          {saving ? "Saving…" : edit ? "Save" : "Edit"}
        </button>
      </div>

      <div style={{ background: "var(--fu-card)", borderRadius: 20, padding: 18, marginTop: 16, boxShadow: "0 2px 14px rgba(0,0,0,0.35)", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--fu-card-alt)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 20 }}>
          {(profile.name || "A")[0]}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: "var(--fu-text)" }}>{profile.name}</div>
          <div style={{ fontSize: 12.5, color: "var(--fu-text-muted)" }}>{profile.email}</div>
        </div>
      </div>

      <div style={{ background: "var(--fu-card)", borderRadius: 20, padding: 18, marginTop: 14, boxShadow: "0 2px 14px rgba(0,0,0,0.35)" }}>
        <Field label="School" value={form.school} edit={edit} onChange={v => set("school", v)} />
        <Field label="Sport" value={form.sport} edit={edit} onChange={v => set("sport", v)} />
        <div style={{ flex: 1, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--fu-text-muted)", marginBottom: 4 }}>Sex</div>
          {edit ? (
            <div style={{ display: "flex", gap: 8 }}>
              {["female", "male"].map(s => (
                <button key={s} type="button" onClick={() => set("sex", s)} style={{
                  flex: 1, padding: "8px 10px", borderRadius: 10, textTransform: "capitalize",
                  border: form.sex === s ? "1.5px solid #fff" : "1.5px solid var(--fu-border)",
                  background: form.sex === s ? "var(--fu-card-alt)" : "transparent", color: "var(--fu-text)", fontWeight: 700, fontSize: 12.5, cursor: "pointer"
                }}>{s}</button>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--fu-text)", textTransform: "capitalize" }}>{form.sex || "—"}</div>
          )}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="Age" value={form.age} edit={edit} onChange={v => set("age", v)} />
          <Field label="Height (in)" value={form.height} edit={edit} onChange={v => set("height", v)} />
          <Field label="Weight (lb)" value={form.weight} edit={edit} onChange={v => set("weight", v)} />
        </div>
      </div>

      <div style={{ background: "var(--fu-card)", borderRadius: 20, padding: 18, marginTop: 14, boxShadow: "0 2px 14px rgba(0,0,0,0.35)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 13.5, color: "var(--fu-text)" }}>Nutrition goal: {form.goal}</div>
          {edit && (
            <button type="button" onClick={recalculate} style={{ background: "var(--fu-card-alt)", border: "none", borderRadius: 10, padding: "6px 10px", color: "var(--fu-text)", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
              Recalculate from my stats
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="Calories" value={form.calorie_goal} edit={edit} onChange={v => set("calorie_goal", v)} />
          <Field label="Protein" value={form.protein_goal} edit={edit} onChange={v => set("protein_goal", v)} />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="Carbs" value={form.carb_goal} edit={edit} onChange={v => set("carb_goal", v)} />
          <Field label="Fat" value={form.fat_goal} edit={edit} onChange={v => set("fat_goal", v)} />
        </div>
        <div style={{ fontSize: 11, color: "var(--fu-text-muted)", marginTop: 2, lineHeight: 1.4 }}>Your carb target is automatically boosted on any day you&apos;ve tagged as a game in your training schedule below.</div>
      </div>

      <div style={{ background: "var(--fu-card)", borderRadius: 20, padding: 18, marginTop: 14, boxShadow: "0 2px 14px rgba(0,0,0,0.35)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 13.5, color: "var(--fu-text)" }}>Training schedule</div>
          <button onClick={() => editSchedule ? saveSchedule() : setEditSchedule(true)} disabled={savingSchedule} style={{ background: "var(--fu-card-alt)", border: "none", borderRadius: 10, padding: "6px 12px", color: "var(--fu-text)", fontWeight: 700, fontSize: 11.5, cursor: "pointer" }}>
            {savingSchedule ? "Saving…" : editSchedule ? "Save" : "Edit"}
          </button>
        </div>
        {editSchedule ? (
          <TrainingScheduleEditor events={events} onChange={setEvents} />
        ) : events.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "var(--fu-text-muted)" }}>No training events added yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {events.map(ev => (
              <div key={ev.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--fu-text-secondary)" }}>
                <span>
                  <strong style={{ color: "var(--fu-text)" }}>{ev.day_of_week}</strong> · {ev.label}
                  {ev.is_game_day && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 800, color: "var(--fu-cta-text)", background: "var(--fu-cta-bg)", padding: "2px 6px", borderRadius: 999 }}>GAME</span>}
                </span>
                <span>{fmtTime(ev.event_time)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={logout} style={{
        width: "100%", marginTop: 20, padding: 14, borderRadius: 14, border: "1.5px solid rgba(255,90,95,0.35)",
        background: "var(--fu-card)", color: "#FF5A5F", fontWeight: 800, cursor: "pointer", display: "flex",
        alignItems: "center", justifyContent: "center", gap: 8
      }}>
        <LogOut size={16} /> Log out
      </button>
    </div>
  );
}
