"use client";

import { Check, Sparkles, Plus } from "lucide-react";

export function Tag({ label }) {
  return <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--fu-label)", background: "var(--fu-card-alt)", padding: "3px 8px", borderRadius: 8 }}>{label}</span>;
}

export function MealCard({ meal, onEat, eaten, onAdd, inCart, cartFull, compact }) {
  return (
    <div style={{
      background: "var(--fu-card)", borderRadius: 20, padding: 14, boxShadow: "0 2px 14px rgba(0,0,0,0.35)",
      display: "flex", gap: 12, alignItems: compact ? "center" : "flex-start"
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16, background: `${meal.color}1a`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0,
        overflow: "hidden"
      }}>
        {meal.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={meal.photo_url} alt={meal.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : meal.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14.5, color: "var(--fu-text)", lineHeight: 1.25 }}>{meal.name}</div>
            <div style={{ fontSize: 11.5, color: "var(--fu-text-muted)", marginTop: 2 }}>{meal.category}</div>
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#2A3EFF", whiteSpace: "nowrap" }}>${Number(meal.price).toFixed(2)}</div>
        </div>
        {!compact && <div style={{ fontSize: 11.5, color: "var(--fu-text-secondary)", marginTop: 6, lineHeight: 1.4 }}>{meal.ingredients}</div>}
        <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
          <Tag label={`${meal.calories} cal`} />
          <Tag label={`${meal.protein}g P`} />
          <Tag label={`${meal.carbs}g C`} />
          <Tag label={`${meal.fat}g F`} />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button onClick={() => onEat(meal)} disabled={eaten}
            style={{
              flex: 1, padding: "9px 10px", borderRadius: 12,
              border: eaten ? "1.5px solid var(--fu-border)" : "1.5px solid transparent",
              background: eaten ? "var(--fu-card-alt)" : "var(--fu-cta-bg)", color: eaten ? "var(--fu-text-muted)" : "var(--fu-cta-text)",
              fontWeight: 700, fontSize: 12.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              cursor: eaten ? "default" : "pointer"
            }}>
            {eaten ? <><Check size={14} /> Logged</> : <><Sparkles size={14} /> I Ate This</>}
          </button>
          {onAdd && (
            <button onClick={() => onAdd(meal)} disabled={inCart || cartFull}
              style={{
                flex: 1, padding: "9px 10px", borderRadius: 12, border: "1.5px solid #2A3EFF",
                background: inCart ? "#2A3EFF" : "var(--fu-cta-bg)", color: inCart ? "#fff" : "#2A3EFF",
                fontWeight: 700, fontSize: 12.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                cursor: cartFull && !inCart ? "not-allowed" : "pointer", opacity: cartFull && !inCart ? 0.5 : 1
              }}>
              {inCart ? <><Check size={14} /> In Cart</> : <><Plus size={14} /> Add</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
