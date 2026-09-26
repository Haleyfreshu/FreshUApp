"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus } from "lucide-react";
import { TopBar } from "@/components/Shell";
import { Tag } from "@/components/MealCard";
import { useMealOptionsSelection, MealOptionsPicker } from "@/components/MealOptionsPicker";
import { useCart } from "@/lib/cartContext";
import { applyOptionsToMeal } from "@/lib/mealOptions";
import { MENUS } from "@/lib/orderWindow";

export function MealDetailView({ meal, initialMenu, orderingOpenFor }) {
  const router = useRouter();
  const bothMenus = meal.on_monday_menu && meal.on_thursday_menu;
  const [menuKey, setMenuKey] = useState(initialMenu);
  const { cart, addToCart } = useCart(menuKey);
  const { groups, selections, pickSingle, toggleMulti, selectedOptions, missingRequired } = useMealOptionsSelection(meal);

  const orderingOpen = orderingOpenFor[menuKey];
  const inCart = cart.some(c => c.id === meal.id);
  const hasOptions = groups.length > 0;
  const totals = applyOptionsToMeal(meal, selectedOptions);
  const canAdd = orderingOpen && !inCart && !(hasOptions && missingRequired);

  return (
    <div>
      <TopBar title={meal.category} onBack={() => router.push(`/menu?menu=${menuKey}`)} />
      <div style={{ padding: "0 20px 24px" }}>
        <div style={{
          width: "100%", height: 200, borderRadius: 20, background: `${meal.color}1a`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 72, overflow: "hidden", marginBottom: 16
        }}>
          {meal.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={meal.photo_url} alt={meal.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : meal.emoji}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 21, color: "var(--fu-text)", lineHeight: 1.2 }}>{meal.name}</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 19, color: "#2A3EFF", whiteSpace: "nowrap" }}>${totals.price.toFixed(2)}</div>
        </div>

        {meal.ingredients && (
          <div style={{ fontSize: 13.5, color: "var(--fu-text-secondary)", marginTop: 10, lineHeight: 1.55 }}>{meal.ingredients}</div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <Tag label={`${totals.calories} cal`} />
          <Tag label={`${totals.protein}g P`} />
          <Tag label={`${totals.carbs}g C`} />
          <Tag label={`${totals.fat}g F`} />
        </div>

        {hasOptions && (
          <div style={{ marginTop: 22 }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 15, color: "var(--fu-text)", marginBottom: 4 }}>Customize</div>
            <div style={{ fontSize: 12, color: "var(--fu-text-muted)", marginBottom: 14 }}>Pick your options before adding to cart.</div>
            <MealOptionsPicker groups={groups} selections={selections} pickSingle={pickSingle} toggleMulti={toggleMulti} />
          </div>
        )}

        {bothMenus && (
          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--fu-text-muted)", marginBottom: 6 }}>Add to which delivery?</div>
            <div style={{ display: "flex", gap: 8 }}>
              {Object.entries(MENUS).map(([key, m]) => (
                <button key={key} onClick={() => setMenuKey(key)} style={{
                  flex: 1, padding: "9px 10px", borderRadius: 12,
                  border: menuKey === key ? "1.5px solid #2A3EFF" : "1.5px solid var(--fu-border)",
                  background: menuKey === key ? "#2A3EFF" : "var(--fu-card-alt)",
                  color: menuKey === key ? "#fff" : "var(--fu-text-muted)",
                  fontWeight: 700, fontSize: 12.5, cursor: "pointer"
                }}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {!orderingOpen && (
          <div style={{ background: "#FFB64822", border: "1px solid #FFB64855", borderRadius: 14, padding: "12px 14px", marginTop: 16, fontSize: 13, color: "var(--fu-text)", lineHeight: 1.4 }}>
            {MENUS[menuKey].label} ordering is closed right now.
          </div>
        )}

        <button onClick={() => addToCart(meal, selectedOptions)} disabled={!canAdd}
          style={{
            width: "100%", marginTop: 20, padding: "13px 10px", borderRadius: 14, border: "1.5px solid #2A3EFF",
            background: inCart ? "#2A3EFF" : "var(--fu-cta-bg)", color: inCart ? "#fff" : "#2A3EFF",
            fontWeight: 800, fontSize: 13.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            cursor: canAdd ? "pointer" : "not-allowed", opacity: !canAdd && !inCart ? 0.5 : 1
          }}>
          {inCart ? <><Check size={16} /> In Cart</> : <><Plus size={16} /> Add to Cart — ${totals.price.toFixed(2)}</>}
        </button>
      </div>
    </div>
  );
}
