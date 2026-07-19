"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Trash2, ShoppingBag, Search } from "lucide-react";
import { MealCard } from "@/components/MealCard";
import { MealOptionsModal } from "@/components/MealOptionsModal";
import { useCart } from "@/lib/cartContext";
import { createClient } from "@/lib/supabase/client";
import { CART_MAX } from "@/lib/constants";
import { applyOptionsToMeal, optionsLabel } from "@/lib/mealOptions";
import { civilDateStr } from "@/lib/orderWindow";

export function MenuView({ meals, eatenMealIds, orderingOpen }) {
  const router = useRouter();
  const { cart, addToCart, removeFromCart, cartFull } = useCart();
  const [query, setQuery] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(null);
  const [customizing, setCustomizing] = useState(null); // { meal, mode: 'add' | 'eat' }

  const filtered = meals.filter(m =>
    m.name.toLowerCase().includes(query.toLowerCase()) || m.category.toLowerCase().includes(query.toLowerCase())
  );
  const grouped = [...new Set(filtered.map(m => m.category))].map(cat => [cat, filtered.filter(m => m.category === cat)]);
  const eatenSet = new Set(eatenMealIds);
  const cartIds = new Set(cart.map(c => c.id));
  const total = cart.reduce((s, m) => s + applyOptionsToMeal(m, m.selectedOptions || []).price, 0);

  const logMeal = async (meal, selectedOptions) => {
    setPending(meal.id);
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
    setPending(null);
    router.refresh();
  };

  const handleEat = (meal) => {
    if (meal.meal_option_groups?.length) {
      setCustomizing({ meal, mode: "eat" });
    } else {
      logMeal(meal, []);
    }
  };

  const handleAdd = (meal) => {
    if (meal.meal_option_groups?.length) {
      setCustomizing({ meal, mode: "add" });
    } else {
      addToCart(meal, []);
    }
  };

  const handleCheckout = async () => {
    setError("");
    setCheckingOut(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(m => ({ mealId: m.id, optionIds: (m.selectedOptions || []).map(o => o.id) })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed.");
      window.location.href = data.url;
    } catch (e) {
      setError(e.message);
      setCheckingOut(false);
    }
  };

  return (
    <div style={{ padding: "18px 20px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 22, color: "var(--fu-text)" }}>Weekly Menu</div>
        <button onClick={() => setShowCart(true)} style={{
          position: "relative", background: "var(--fu-cta-bg)", border: "none", borderRadius: 14, padding: "10px 12px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6
        }}>
          <ShoppingBag size={16} color="var(--fu-cta-text)" />
          <span style={{ color: "var(--fu-cta-text)", fontWeight: 700, fontSize: 12.5 }}>{cart.length}</span>
        </button>
      </div>
      <div style={{ fontSize: 13, color: "var(--fu-text-secondary)", marginTop: 4 }}>Choose 1–{CART_MAX} meals for this week. {cart.length}/{CART_MAX} selected.</div>

      {!orderingOpen && (
        <div style={{ background: "#FFB64822", border: "1px solid #FFB64855", borderRadius: 14, padding: "12px 14px", marginTop: 14, fontSize: 13, color: "var(--fu-text)", lineHeight: 1.4 }}>
          Ordering is open Sunday through Wednesday. You can browse the menu, but adding meals and checkout are turned off until it reopens Sunday.
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--fu-card)", borderRadius: 14, padding: "10px 14px", marginTop: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>
        <Search size={16} color="var(--fu-text-muted)" />
        <input placeholder="Search meals or category" value={query} onChange={e => setQuery(e.target.value)}
          style={{ border: "none", outline: "none", fontSize: 13.5, flex: 1, background: "transparent", color: "var(--fu-text)" }} />
      </div>

      {grouped.map(([cat, items]) => (
        <div key={cat} style={{ marginTop: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 13.5, color: "var(--fu-label)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>{cat}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map(m => (
              <MealCard key={m.id} meal={m}
                onEat={() => handleEat(m)} eaten={eatenSet.has(m.id) || pending === m.id}
                onAdd={handleAdd} inCart={cartIds.has(m.id)} cartFull={cartFull || !orderingOpen} />
            ))}
          </div>
        </div>
      ))}

      {showCart && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", justifyContent: "flex-end", maxWidth: 430, margin: "0 auto" }}>
          <div onClick={() => setShowCart(false)} style={{ position: "absolute", inset: 0, background: "rgba(11,14,26,0.5)" }} />
          <div style={{ position: "relative", background: "var(--fu-card)", borderRadius: "24px 24px 0 0", padding: "20px 20px 24px", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 18, color: "var(--fu-text)" }}>This week&apos;s cart</div>
              <button onClick={() => setShowCart(false)} style={{ background: "var(--fu-card-alt)", border: "none", borderRadius: 10, padding: 6, cursor: "pointer", color: "var(--fu-text)" }}><X size={16} /></button>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {cart.length === 0 && <div style={{ color: "var(--fu-text-muted)", fontSize: 13.5, textAlign: "center", padding: "30px 0" }}>Your cart is empty. Add up to {CART_MAX} meals.</div>}
              {cart.map(m => {
                const itemTotals = applyOptionsToMeal(m, m.selectedOptions || []);
                return (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--fu-border)" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `${m.color}1a`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{m.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "var(--fu-text)" }}>{m.name}</div>
                      {m.selectedOptions?.length > 0 && (
                        <div style={{ fontSize: 11, color: "var(--fu-text-secondary)", marginTop: 1 }}>{optionsLabel(m.selectedOptions)}</div>
                      )}
                      <div style={{ fontSize: 11.5, color: "var(--fu-text-muted)" }}>${itemTotals.price.toFixed(2)}</div>
                    </div>
                    <button onClick={() => removeFromCart(m.id)} style={{ background: "none", border: "none", cursor: "pointer" }}><Trash2 size={16} color="#FF5A5F" /></button>
                  </div>
                );
              })}
            </div>
            {error && <div style={{ color: "#FF5A5F", fontSize: 12.5, marginTop: 8, fontWeight: 600 }}>{error}</div>}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, marginBottom: 12 }}>
              <span style={{ fontWeight: 700, color: "var(--fu-text-secondary)", fontSize: 13.5 }}>Total</span>
              <span style={{ fontWeight: 800, fontSize: 18, color: "var(--fu-text)" }}>${total.toFixed(2)}</span>
            </div>
            <button
              disabled={cart.length === 0 || checkingOut || !orderingOpen}
              onClick={handleCheckout}
              style={{ width: "100%", padding: 15, borderRadius: 14, border: "none", background: cart.length && orderingOpen ? "#2A3EFF" : "var(--fu-card-alt)", color: cart.length && orderingOpen ? "#fff" : "var(--fu-text-muted)", fontWeight: 800, fontSize: 15, cursor: cart.length && orderingOpen ? "pointer" : "default", opacity: checkingOut ? 0.7 : 1 }}>
              {checkingOut ? "Redirecting to secure checkout…" : orderingOpen ? "Continue to checkout" : "Ordering opens Sunday"}
            </button>
          </div>
        </div>
      )}

      {customizing && (
        <MealOptionsModal
          meal={customizing.meal}
          actionLabel={customizing.mode === "add" ? "Add to cart" : "Log this"}
          onCancel={() => setCustomizing(null)}
          onConfirm={(selectedOptions) => {
            if (customizing.mode === "add") {
              addToCart(customizing.meal, selectedOptions);
            } else {
              logMeal(customizing.meal, selectedOptions);
            }
            setCustomizing(null);
          }}
        />
      )}
    </div>
  );
}
