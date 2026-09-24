"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { SmallField } from "@/components/Fields";
import { MealOptionsEditor } from "@/components/MealOptionsEditor";
import { createClient } from "@/lib/supabase/client";
import { STAFF_STORAGE_BUCKET } from "@/lib/constants";

export function MealEditor({ meal, defaultDeliveryDay, onCancel, onSaved }) {
  const [form, setForm] = useState(meal || {
    name: "", category: "Lunch", emoji: "🍽️", color: "#2A3EFF", delivery_day: defaultDeliveryDay || "monday",
    ingredients: "", calories: 500, protein: 30, carbs: 40, fat: 15, price: 10, photo_url: null,
  });
  const [currentMeal, setCurrentMeal] = useState(meal);
  const [groups, setGroups] = useState(meal?.meal_option_groups || []);
  const [photoFile, setPhotoFile] = useState(null);
  const [preview, setPreview] = useState(meal?.photo_url || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const onPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const save = async () => {
    setSaving(true);
    setError("");
    const supabase = createClient();
    let photo_url = form.photo_url || null;

    try {
      if (photoFile) {
        const path = `${crypto.randomUUID()}-${photoFile.name}`;
        const { error: uploadError } = await supabase.storage.from(STAFF_STORAGE_BUCKET).upload(path, photoFile);
        if (uploadError) throw uploadError;
        const { data: pub } = supabase.storage.from(STAFF_STORAGE_BUCKET).getPublicUrl(path);
        photo_url = pub.publicUrl;
      }

      const payload = {
        name: form.name, category: form.category, emoji: form.emoji, color: form.color, delivery_day: form.delivery_day,
        ingredients: form.ingredients, calories: +form.calories, protein: +form.protein,
        carbs: +form.carbs, fat: +form.fat, price: +form.price, photo_url,
      };

      let saved;
      if (currentMeal?.id) {
        const { data, error: updateError } = await supabase.from("meals").update(payload).eq("id", currentMeal.id).select().single();
        if (updateError) throw updateError;
        saved = data;
      } else {
        const { data, error: insertError } = await supabase.from("meals").insert(payload).select().single();
        if (insertError) throw insertError;
        saved = data;
      }
      setCurrentMeal({ ...saved, meal_option_groups: groups });
      onSaved({ ...saved, meal_option_groups: groups });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleGroupsChange = (updatedGroups) => {
    setGroups(updatedGroups);
    if (currentMeal) onSaved({ ...currentMeal, meal_option_groups: updatedGroups });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(11,14,26,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 80, padding: 16 }}>
      <div style={{ background: "var(--fu-card)", borderRadius: 20, padding: 20, width: "100%", maxWidth: 420, maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 17, color: "var(--fu-text)" }}>{currentMeal ? "Edit meal" : "Add meal"}</div>
          <button onClick={onCancel} style={{ background: "var(--fu-card-alt)", border: "none", borderRadius: 10, padding: 6, cursor: "pointer", color: "var(--fu-text)" }}><X size={16} /></button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--fu-text-muted)", marginBottom: 6 }}>Meal photo</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: `${form.color}1a`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, overflow: "hidden", flexShrink: 0 }}>
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : form.emoji}
            </div>
            <input type="file" accept="image/*" onChange={onPhotoChange} style={{ fontSize: 12.5 }} />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--fu-text-muted)", marginBottom: 6 }}>Menu</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[["monday", "Monday Delivery"], ["thursday", "Thursday Delivery"]].map(([key, label]) => (
              <button key={key} type="button" onClick={() => set("delivery_day", key)} style={{
                flex: 1, padding: "9px 10px", borderRadius: 12,
                border: form.delivery_day === key ? "1.5px solid #2A3EFF" : "1.5px solid var(--fu-border)",
                background: form.delivery_day === key ? "#2A3EFF" : "var(--fu-card-alt)",
                color: form.delivery_day === key ? "#fff" : "var(--fu-text-muted)",
                fontWeight: 700, fontSize: 12.5, cursor: "pointer"
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <SmallField label="Name" value={form.name} onChange={v => set("name", v.target.value)} />
        <SmallField label="Category" value={form.category} onChange={v => set("category", v.target.value)} />
        <div style={{ display: "flex", gap: 10 }}>
          <SmallField label="Emoji" value={form.emoji} onChange={v => set("emoji", v.target.value)} />
          <SmallField label="Price ($)" type="number" value={form.price} onChange={v => set("price", v.target.value)} />
        </div>
        <SmallField label="Ingredients" value={form.ingredients} onChange={v => set("ingredients", v.target.value)} />
        <div style={{ display: "flex", gap: 10 }}>
          <SmallField label="Calories" type="number" value={form.calories} onChange={v => set("calories", v.target.value)} />
          <SmallField label="Protein (g)" type="number" value={form.protein} onChange={v => set("protein", v.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <SmallField label="Carbs (g)" type="number" value={form.carbs} onChange={v => set("carbs", v.target.value)} />
          <SmallField label="Fat (g)" type="number" value={form.fat} onChange={v => set("fat", v.target.value)} />
        </div>
        {error && <div style={{ color: "#FF5A5F", fontSize: 12.5, marginTop: 4, fontWeight: 600 }}>{error}</div>}
        <button onClick={save} disabled={saving} style={{ width: "100%", marginTop: 10, marginBottom: 16, padding: 14, borderRadius: 14, border: "none", background: "var(--fu-cta-bg)", color: "var(--fu-cta-text)", fontWeight: 800, cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving…" : "Save meal"}
        </button>

        {currentMeal?.id ? (
          <MealOptionsEditor mealId={currentMeal.id} groups={groups} onGroupsChange={handleGroupsChange} />
        ) : (
          <div style={{ fontSize: 12, color: "var(--fu-text-muted)", textAlign: "center", padding: "8px 0" }}>
            Save this meal first to add customization options (extra protein, choose your carb, etc.).
          </div>
        )}
      </div>
    </div>
  );
}
