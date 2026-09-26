"use client";

import { X } from "lucide-react";
import { applyOptionsToMeal } from "@/lib/mealOptions";
import { useMealOptionsSelection, MealOptionsPicker } from "@/components/MealOptionsPicker";

export function MealOptionsModal({ meal, actionLabel, onCancel, onConfirm }) {
  const { groups, selections, pickSingle, toggleMulti, selectedOptions, missingRequired } = useMealOptionsSelection(meal);
  const totals = applyOptionsToMeal(meal, selectedOptions);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(11,14,26,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 80, padding: 16 }}>
      <div style={{ background: "var(--fu-card)", borderRadius: 20, padding: 20, width: "100%", maxWidth: 420, maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ fontFamily: "'Baloo 2',sans-serif", fontWeight: 800, fontSize: 17, color: "var(--fu-text)" }}>{meal.name}</div>
          <button onClick={onCancel} style={{ background: "var(--fu-card-alt)", border: "none", borderRadius: 10, padding: 6, cursor: "pointer", color: "var(--fu-text)" }}><X size={16} /></button>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--fu-text-secondary)", marginBottom: 16 }}>Customize this meal</div>

        <MealOptionsPicker groups={groups} selections={selections} pickSingle={pickSingle} toggleMulti={toggleMulti} />

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
