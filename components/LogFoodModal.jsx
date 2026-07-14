"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { SmallField } from "@/components/Fields";
import { createClient } from "@/lib/supabase/client";

export function LogFoodModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const canSave = form.name.trim() && form.calories !== "";

  const save = async () => {
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error: insertError } = await supabase.from("daily_logs").insert({
      athlete_id: user.id,
      meal_id: null,
      log_date: new Date().toISOString().slice(0, 10),
      name: form.name.trim(),
      emoji: "🍽️",
      calories: Number(form.calories) || 0,
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fat: Number(form.fat) || 0,
    });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    onSaved();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(11,14,26,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 80, padding: 16 }}>
      <div style={{ background: "var(--fu-card)", borderRadius: 20, padding: 20, width: "100%", maxWidth: 420, maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 17 }}>Log a food</div>
          <button onClick={onClose} style={{ background: "var(--fu-card-alt)", border: "none", borderRadius: 10, padding: 6, cursor: "pointer", color: "var(--fu-text)" }}><X size={16} /></button>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--fu-text-secondary)", marginBottom: 14 }}>
          Anything you ate that wasn&apos;t one of this week&apos;s meals — enter your best estimate of the macros.
        </div>
        <SmallField label="Food" value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Protein shake" />
        <SmallField label="Calories" type="number" value={form.calories} onChange={e => set("calories", e.target.value)} />
        <div style={{ display: "flex", gap: 10 }}>
          <SmallField label="Protein (g)" type="number" value={form.protein} onChange={e => set("protein", e.target.value)} />
          <SmallField label="Carbs (g)" type="number" value={form.carbs} onChange={e => set("carbs", e.target.value)} />
          <SmallField label="Fat (g)" type="number" value={form.fat} onChange={e => set("fat", e.target.value)} />
        </div>
        {error && <div style={{ color: "#FF5A5F", fontSize: 12.5, marginTop: 4, fontWeight: 600 }}>{error}</div>}
        <button onClick={save} disabled={!canSave || saving} style={{
          width: "100%", marginTop: 10, padding: 14, borderRadius: 14, border: "none",
          background: canSave ? "var(--fu-cta-bg)" : "var(--fu-card-alt)", color: canSave ? "var(--fu-cta-text)" : "var(--fu-text-muted)",
          fontWeight: 800, cursor: canSave && !saving ? "pointer" : "default", opacity: saving ? 0.7 : 1
        }}>
          {saving ? "Saving…" : "Add to today's log"}
        </button>
      </div>
    </div>
  );
}
