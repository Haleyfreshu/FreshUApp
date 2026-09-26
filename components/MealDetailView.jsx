"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles, Plus } from "lucide-react";
import { TopBar } from "@/components/Shell";
import { Tag } from "@/components/MealCard";
import { MealOptionsModal } from "@/components/MealOptionsModal";
import { useCart } from "@/lib/cartContext";
import { createClient } from "@/lib/supabase/client";
import { applyOptionsToMeal } from "@/lib/mealOptions";
import { civilDateStr, MENUS } from "@/lib/orderWindow";

export function MealDetailView({ meal, initialMenu, orderingOpenFor, eaten: initialEaten }) {
  const router = useRouter();
  const bothMenus = meal.on_monday_menu && meal.on_thursday_menu;
  const [menuKey, setMenuKey] = useState(initialMenu);
  const { cart, addToCart } = useCart(menuKey);
  const [customizing, setCustomizing] = useState(null); // 'add' | 'eat' | null
  const [pending, setPending] = useState(false);
  const [eaten, setEaten] = useState(initialEaten);

  const orderingOpen = orderingOpenFor[menuKey];
  const inCart = cart.some(c => c.id === meal.id);
  const hasOptions = meal.meal_option_groups?.length > 0;

  const logMeal = async (selectedOptions) => {
    setPending(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const totals = applyOptionsToMeal(meal, selectedOptions);
    await supabase.from("daily_logs").upsert({
      athlete_id: user.id,
      meal_id: meal.id,
      log_date: civilDateStr(),
      name: meal.name, emoji: meal.emoji,
      calories: totals.calories, protein: totals.protein, carbs: totals.carbs, fat: totals.fat,
      selected_options: selectedOptions.map(o => ({ id: o.id, label: o.label })),
    }, { onConflict: "athlete_id,meal_id,log_date" });
    setPending(false);
    setEaten(true);
    router.refresh();
  };

  const handleEat = () => {
    if (hasOptions) setCustomizing("eat");
    else logMeal([]);
  };

  const handleAdd = () => {
    if (hasOptions) setCustomizing("add");
    else addToCart(meal, []);
  };

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
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 19, color: "#2A3EFF", whiteSpace: "nowrap" }}>${Number(meal.price).toFixed(2)}</div>
        </div>

        {meal.ingredients && (
          <div style={{ fontSize: 13.5, color: "var(--fu-text-secondary)", marginTop: 10, lineHeight: 1.55 }}>{meal.ingredients}</div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <Tag label={`${meal.calories} cal`} />
          <Tag label={`${meal.protein}g P`} />
          <Tag label={`${meal.carbs}g C`} />
          <Tag label={`${meal.fat}g F`} />
        </div>

        {bothMenus && (
          <div style={{ marginTop: 22 }}>
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
            {MENUS[menuKey].label} ordering is closed right now — you can still log it below if you already have it.
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={handleEat} disabled={eaten || pending}
            style={{
              flex: 1, padding: "13px 10px", borderRadius: 14,
              border: eaten ? "1.5px solid var(--fu-border)" : "1.5px solid transparent",
              background: eaten ? "var(--fu-card-alt)" : "var(--fu-cta-bg)", color: eaten ? "var(--fu-text-muted)" : "var(--fu-cta-text)",
              fontWeight: 800, fontSize: 13.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              cursor: eaten ? "default" : "pointer"
            }}>
            {eaten ? <><Check size={16} /> Logged</> : <><Sparkles size={16} /> I Ate This</>}
          </button>
          <button onClick={handleAdd} disabled={inCart || !orderingOpen}
            style={{
              flex: 1, padding: "13px 10px", borderRadius: 14, border: "1.5px solid #2A3EFF",
              background: inCart ? "#2A3EFF" : "var(--fu-cta-bg)", color: inCart ? "#fff" : "#2A3EFF",
              fontWeight: 800, fontSize: 13.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              cursor: !orderingOpen && !inCart ? "not-allowed" : "pointer", opacity: !orderingOpen && !inCart ? 0.5 : 1
            }}>
            {inCart ? <><Check size={16} /> In Cart</> : <><Plus size={16} /> Add to Cart</>}
          </button>
        </div>
      </div>

      {customizing && (
        <MealOptionsModal
          meal={meal}
          actionLabel={customizing === "add" ? "Add to cart" : "Log this"}
          onCancel={() => setCustomizing(null)}
          onConfirm={(selectedOptions) => {
            if (customizing === "add") {
              addToCart(meal, selectedOptions);
            } else {
              logMeal(selectedOptions);
            }
            setCustomizing(null);
          }}
        />
      )}
    </div>
  );
}
