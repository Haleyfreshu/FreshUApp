"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GOAL_PRESETS, SPORTS, DAYS } from "@/lib/constants";
import { AuthField } from "@/components/Fields";
import { createClient } from "@/lib/supabase/client";

export function OnboardingForm({ userId }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    school: "", sport: "", age: "", height: "", weight: "",
    goal: "Lean Performance", calorieGoal: 2400, proteinGoal: 160, carbGoal: 250, fatGoal: 70,
    days: [], practiceTime: "16:00",
  });
  const steps = ["Basics", "Sport", "Goals", "Schedule"];
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const selectGoal = (g) => {
    const preset = GOAL_PRESETS[g];
    setForm(f => ({ ...f, goal: g, calorieGoal: preset.calories, proteinGoal: preset.protein, carbGoal: preset.carbs, fatGoal: preset.fat }));
  };
  const toggleDay = (d) => setForm(f => ({ ...f, days: f.days.includes(d) ? f.days.filter(x => x !== d) : [...f.days, d] }));

  const canNext = () => {
    if (step === 0) return form.school && form.age && form.height && form.weight;
    if (step === 1) return form.sport;
    if (step === 2) return true;
    if (step === 3) return form.days.length > 0;
    return true;
  };

  const finish = async () => {
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error: updateError } = await supabase.from("profiles").update({
      school: form.school,
      sport: form.sport,
      age: Number(form.age),
      height: Number(form.height),
      weight: Number(form.weight),
      goal: form.goal,
      calorie_goal: form.calorieGoal,
      protein_goal: form.proteinGoal,
      carb_goal: form.carbGoal,
      fat_goal: form.fatGoal,
      practice_days: form.days,
      practice_time: form.practiceTime,
      onboarded: true,
    }).eq("id", userId);
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "50px 24px 24px" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 22 }}>
        {steps.map((s, i) => (
          <div key={s} style={{ flex: 1, height: 5, borderRadius: 4, background: i <= step ? "#2A3EFF" : "#E7EBF7" }} />
        ))}
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 800, color: "#2A3EFF", letterSpacing: 0.5, textTransform: "uppercase" }}>Step {step + 1} of {steps.length}</div>
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 23, color: "#0B0E1A", marginTop: 4, marginBottom: 18 }}>
        {step === 0 && "Tell us about you"}
        {step === 1 && "Your sport"}
        {step === 2 && "Set your nutrition goals"}
        {step === 3 && "Training schedule"}
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {step === 0 && (
          <>
            <AuthField label="School" placeholder="e.g. Rowan University" value={form.school} onChange={e => set("school", e.target.value)} />
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}><AuthField label="Age" type="number" placeholder="20" value={form.age} onChange={e => set("age", e.target.value)} /></div>
              <div style={{ flex: 1 }}><AuthField label="Height (in)" type="number" placeholder="70" value={form.height} onChange={e => set("height", e.target.value)} /></div>
              <div style={{ flex: 1 }}><AuthField label="Weight (lb)" type="number" placeholder="185" value={form.weight} onChange={e => set("weight", e.target.value)} /></div>
            </div>
          </>
        )}

        {step === 1 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {SPORTS.map(sp => (
              <button key={sp} onClick={() => set("sport", sp)} style={{
                padding: "12px 16px", borderRadius: 14, border: form.sport === sp ? "2px solid #2A3EFF" : "1.5px solid #E7EBF7",
                background: form.sport === sp ? "#2A3EFF14" : "#fff", color: "#0B0E1A", fontWeight: 700, fontSize: 13.5, cursor: "pointer"
              }}>{sp}</button>
            ))}
          </div>
        )}

        {step === 2 && (
          <>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#4C5378", marginBottom: 8 }}>Nutrition goal</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
              {Object.keys(GOAL_PRESETS).map(g => (
                <button key={g} onClick={() => selectGoal(g)} style={{
                  textAlign: "left", padding: "13px 14px", borderRadius: 14,
                  border: form.goal === g ? "2px solid #2A3EFF" : "1.5px solid #E7EBF7",
                  background: form.goal === g ? "#2A3EFF14" : "#fff", cursor: "pointer"
                }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: "#0B0E1A" }}>{g}</div>
                  <div style={{ fontSize: 11.5, color: "#9AA0BF", marginTop: 2 }}>{GOAL_PRESETS[g].calories} cal · {GOAL_PRESETS[g].protein}g protein</div>
                </button>
              ))}
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#4C5378", marginBottom: 8 }}>Daily targets (editable)</div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}><AuthField label="Calories" type="number" value={form.calorieGoal} onChange={e => set("calorieGoal", +e.target.value)} /></div>
              <div style={{ flex: 1 }}><AuthField label="Protein (g)" type="number" value={form.proteinGoal} onChange={e => set("proteinGoal", +e.target.value)} /></div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}><AuthField label="Carbs (g)" type="number" value={form.carbGoal} onChange={e => set("carbGoal", +e.target.value)} /></div>
              <div style={{ flex: 1 }}><AuthField label="Fat (g)" type="number" value={form.fatGoal} onChange={e => set("fatGoal", +e.target.value)} /></div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#4C5378", marginBottom: 8 }}>Practice days</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
              {DAYS.map(d => (
                <button key={d} onClick={() => toggleDay(d)} style={{
                  width: 46, height: 46, borderRadius: 12,
                  border: form.days.includes(d) ? "2px solid #2A3EFF" : "1.5px solid #E7EBF7",
                  background: form.days.includes(d) ? "#2A3EFF14" : "#fff", color: "#0B0E1A", fontWeight: 700, fontSize: 12.5, cursor: "pointer"
                }}>{d}</button>
              ))}
            </div>
            <AuthField label="Typical practice start time" type="time" value={form.practiceTime} onChange={e => set("practiceTime", e.target.value)} />
          </>
        )}
      </div>

      {error && <div style={{ color: "#FF5A5F", fontSize: 12.5, marginTop: 8, fontWeight: 600 }}>{error}</div>}

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: "15px", borderRadius: 14, border: "1.5px solid #E7EBF7", background: "#fff", fontWeight: 700, color: "#0B0E1A", cursor: "pointer" }}>Back</button>
        )}
        <button
          disabled={!canNext() || saving}
          onClick={() => step === steps.length - 1 ? finish() : setStep(s => s + 1)}
          style={{ flex: 2, padding: "15px", borderRadius: 14, border: "none", background: canNext() ? "#0B0E1A" : "#E7EBF7", color: canNext() ? "#fff" : "#9AA0BF", fontWeight: 800, cursor: canNext() ? "pointer" : "default" }}>
          {saving ? "Saving…" : step === steps.length - 1 ? "Finish setup" : "Continue"}
        </button>
      </div>
    </div>
  );
}
