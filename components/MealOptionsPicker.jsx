"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { optionMacroSummary } from "@/lib/mealOptions";

// Selection state for a meal's customization groups — shared by the
// checkout-flow modal and the inline picker on the meal detail screen so
// both stay in sync with the same rules (single vs multi, required groups).
export function useMealOptionsSelection(meal) {
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

  return { groups, selections, pickSingle, toggleMulti, selectedOptions, missingRequired };
}

export function MealOptionsPicker({ groups, selections, pickSingle, toggleMulti }) {
  return (
    <>
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
              const macroSummary = optionMacroSummary(o);
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
                  <span style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 600, color: "var(--fu-text)" }}>
                      {isSelected && <Check size={14} color="#2A3EFF" />} {o.label}
                    </span>
                    {macroSummary && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--fu-text-muted)" }}>{macroSummary}</span>
                    )}
                  </span>
                  {Number(o.price_delta) !== 0 && (
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--fu-text-secondary)", whiteSpace: "nowrap", flexShrink: 0, marginLeft: 10 }}>
                      {Number(o.price_delta) > 0 ? "+" : ""}${Number(o.price_delta).toFixed(2)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
