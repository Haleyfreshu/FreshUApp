"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Trash2, ShoppingBag, Search } from "lucide-react";
import { MealCard } from "@/components/MealCard";
import { MealOptionsModal } from "@/components/MealOptionsModal";
import { useCart } from "@/lib/cartContext";
import { applyOptionsToMeal, optionsLabel } from "@/lib/mealOptions";
import { MENUS, mealIsOnMenu } from "@/lib/orderWindow";

const MENU_WINDOW_LABEL = { monday: "Sunday through Wednesday", thursday: "Sunday through the following Sunday, the week before delivery" };
const MENU_NEXT_OPEN_LABEL = { monday: "Sunday", thursday: "Sunday" };

export function MenuView({ meals, orderingOpenFor, initialMenu }) {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState(
    initialMenu && MENUS[initialMenu] ? initialMenu :
    orderingOpenFor.monday && !orderingOpenFor.thursday ? "monday" :
    orderingOpenFor.thursday && !orderingOpenFor.monday ? "thursday" : "monday"
  );
  const { cart, addToCart, removeFromCart } = useCart(activeMenu);
  const [query, setQuery] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");
  const [customizing, setCustomizing] = useState(null); // meal | null

  const orderingOpen = orderingOpenFor[activeMenu];
  const menuMeals = meals.filter(m => mealIsOnMenu(m, activeMenu));
  const filtered = menuMeals.filter(m =>
    m.name.toLowerCase().includes(query.toLowerCase()) || m.category.toLowerCase().includes(query.toLowerCase())
  );
  const grouped = [...new Set(filtered.map(m => m.category))].map(cat => [cat, filtered.filter(m => m.category === cat)]);
  const cartIds = new Set(cart.map(c => c.id));
  const total = cart.reduce((s, m) => s + applyOptionsToMeal(m, m.selectedOptions || []).price, 0);

  const handleAdd = (meal) => {
    if (meal.meal_option_groups?.length) {
      setCustomizing(meal);
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
          menuKey: activeMenu,
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
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 22, color: "var(--fu-text)" }}>Menu</div>
        <button onClick={() => setShowCart(true)} style={{
          position: "relative", background: "var(--fu-cta-bg)", border: "none", borderRadius: 14, padding: "10px 12px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6
        }}>
          <ShoppingBag size={16} color="var(--fu-cta-text)" />
          <span style={{ color: "var(--fu-cta-text)", fontWeight: 700, fontSize: 12.5 }}>{cart.length}</span>
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        {Object.entries(MENUS).map(([key, m]) => (
          <button key={key} onClick={() => setActiveMenu(key)} style={{
            flex: 1, padding: "10px 8px", borderRadius: 12,
            border: activeMenu === key ? "1.5px solid #2A3EFF" : "1.5px solid var(--fu-border)",
            background: activeMenu === key ? "#2A3EFF" : "var(--fu-card)",
            color: activeMenu === key ? "#fff" : "var(--fu-text)",
            fontWeight: 700, fontSize: 12.5, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2
          }}>
            {m.label}
            {orderingOpenFor[key] && <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.85 }}>Open now</span>}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 13, color: "var(--fu-text-secondary)", marginTop: 10 }}>{cart.length} meal{cart.length === 1 ? "" : "s"} selected for {MENUS[activeMenu].label.toLowerCase()}.</div>

      {!orderingOpen && (
        <div style={{ background: "#FFB64822", border: "1px solid #FFB64855", borderRadius: 14, padding: "12px 14px", marginTop: 14, fontSize: 13, color: "var(--fu-text)", lineHeight: 1.4 }}>
          {MENUS[activeMenu].label} ordering is open {MENU_WINDOW_LABEL[activeMenu]}. You can browse the menu, but adding meals and checkout are turned off until it reopens {MENU_NEXT_OPEN_LABEL[activeMenu]}.
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--fu-card)", borderRadius: 14, padding: "10px 14px", marginTop: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>
        <Search size={16} color="var(--fu-text-muted)" />
        <input placeholder="Search meals or category" value={query} onChange={e => setQuery(e.target.value)}
          style={{ border: "none", outline: "none", fontSize: 13.5, flex: 1, background: "transparent", color: "var(--fu-text)" }} />
      </div>

      {grouped.length === 0 && (
        <div style={{ background: "var(--fu-card)", borderRadius: 18, padding: "20px 16px", textAlign: "center", color: "var(--fu-text-muted)", fontSize: 13, marginTop: 20 }}>
          No meals on the {MENUS[activeMenu].label.toLowerCase()} menu yet.
        </div>
      )}

      {grouped.map(([cat, items]) => (
        <div key={cat} style={{ marginTop: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 13.5, color: "var(--fu-label)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>{cat}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map(m => (
              <MealCard key={m.id} meal={m}
                onAdd={handleAdd} inCart={cartIds.has(m.id)} cartFull={!orderingOpen}
                onOpen={() => router.push(`/menu/${m.id}?menu=${activeMenu}`)} />
            ))}
          </div>
        </div>
      ))}

      {showCart && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", justifyContent: "flex-end", maxWidth: 430, margin: "0 auto" }}>
          <div onClick={() => setShowCart(false)} style={{ position: "absolute", inset: 0, background: "rgba(11,14,26,0.5)" }} />
          <div style={{ position: "relative", background: "var(--fu-card)", borderRadius: "24px 24px 0 0", padding: "20px 20px 24px", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 18, color: "var(--fu-text)" }}>{MENUS[activeMenu].label} cart</div>
              <button onClick={() => setShowCart(false)} style={{ background: "var(--fu-card-alt)", border: "none", borderRadius: 10, padding: 6, cursor: "pointer", color: "var(--fu-text)" }}><X size={16} /></button>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {cart.length === 0 && <div style={{ color: "var(--fu-text-muted)", fontSize: 13.5, textAlign: "center", padding: "30px 0" }}>Your cart is empty.</div>}
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
              {checkingOut ? "Redirecting to secure checkout…" : orderingOpen ? "Continue to checkout" : `Ordering opens ${MENU_NEXT_OPEN_LABEL[activeMenu]}`}
            </button>
          </div>
        </div>
      )}

      {customizing && (
        <MealOptionsModal
          meal={customizing}
          actionLabel="Add to cart"
          onCancel={() => setCustomizing(null)}
          onConfirm={(selectedOptions) => {
            addToCart(customizing, selectedOptions);
            setCustomizing(null);
          }}
        />
      )}
    </div>
  );
}
