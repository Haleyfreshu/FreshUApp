"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";
import { applyOptionsToMeal } from "@/lib/mealOptions";

export function MealOptionsModal({ meal, actionLabel, onCancel, onConfirm }) {
  const groups = [...(meal.meal_option_groups || [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(g => ({ ...g, meal_options: [...g.meal_options].sort((a, b) => a.sort_order - b.sort_order) }));
  const [selections, setSelections] = useState(() => {
    const initial = {};
    groups.forEach(g => { initial[g.id] = g.selection_type === "single" ? null : []; });
    return initial;
  });

  const pickSingle = (groupId, optionId) => setSelections(s => ({ ...s, [groupId]: optionId }));
  const toggleMulti = (groupId, optionId) => setSelections(s => {
    const current = s[groupId] || [];
    const next = current.includes(optionId) ? current.filter(id => id !== optionId) : [...current, optionId];
    return { ...s, [groupId]: next };
  });

  const selectedOptions = groups.flatMap(g => {
    const picked = selections[g.id];
    const ids = g.selection_type === "single" ? (picked ? [picked] : []) : picked;
    return g.meal_options.filter(o => ids.includes(o.id));
  });

  const missingRequired = groups.some(g => g.required && (
    g.selection_type === "single" ? !selections[g.id] : (selections[g.id] || []).length === 0
  ));

  const totals = applyOptionsToMeal(meal, selectedOptions);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(11,14,26,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 80, padding: 16 }}>
      <div style={{ background: "var(--fu-card)", borderRadius: 20, padding: 20, width: "100%", maxWidth: 420, maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 17, color: "var(--fu-text)" }}>{meal.name}</div>
          <button onClick={onCancel} style={{ background: "var(--fu-card-alt)", border: "none", borderRadius: 10, padding: 6, cursor: "pointer", color: "var(--fu-text)" }}><X size={16} /></button>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--fu-text-secondary)", marginBottom: 16 }}>Customize this meal</div>

        {groups.map(g => (
          <div key={g.id} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--fu-label)", marginBottom: 8 }}>
              {g.name}{g.required && <span style={{ color: "#FF5A5F" }}> *</span>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {g.meal_options.map(o => {
                const isSelected = g.selection_type === "single"
                  ? selections[g.id] === o.id
                  : (selections[g.id] || []).includes(o.id);
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => g.selection_type === "single" ? pickSingle(g.id, o.id) : toggleMulti(g.id, o.id)}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      textAlign: "left", padding: "11px 14px", borderRadius: 12,
                      border: isSelected ? "2px solid #2A3EFF" : "1.5px solid var(--fu-border)",
                      background: isSelected ? "#2A3EFF29" : "var(--fu-card-alt)", cursor: "pointer"
                    }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 600, color: "var(--fu-text)" }}>
                      {isSelected && <Check size={14} color="#2A3EFF" />} {o.label}
                    </span>
                    {Number(o.price_delta) !== 0 && (
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--fu-text-secondary)" }}>
                        {Number(o.price_delta) > 0 ? "+" : ""}${Number(o.price_delta).toFixed(2)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingTop: 10, borderTop: "1px solid var(--fu-border)" }}>
          <span style={{ fontWeight: 700, color: "var(--fu-text-secondary)", fontSize: 13.5 }}>Total</span>
          <span style={{ fontWeight: 800, fontSize: 18, color: "var(--fu-text)" }}>${totals.price.toFixed(2)}</span>
        </div>

        <button
          disabled={missingRequired}
          onClick={() => onConfirm(selectedOptions)}
          style={{
            width: "100%", padding: 14, borderRadius: 14, border: "none",
            background: missingRequired ? "var(--fu-card-alt)" : "var(--fu-cta-bg)",
            color: missingRequired ? "var(--fu-text-muted)" : "var(--fu-cta-text)",
            fontWeight: 800, cursor: missingRequired ? "default" : "pointer"
          }}>
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
