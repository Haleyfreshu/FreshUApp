"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Trash2, ShoppingBag, Search } from "lucide-react";
import { MealCard } from "@/components/MealCard";
import { MealOptionsModal } from "@/components/MealOptionsModal";
import { useCart } from "@/lib/cartContext";
import { applyOptionsToMeal, optionsLabel } from "@/lib/mealOptions";
import { MENUS, mealIsOnMenu, hoursUntilWindowCloses } from "@/lib/orderWindow";
import { SLOT_ORDER } from "@/lib/constants";

const MENU_WINDOW_LABEL = { monday: "Sunday through Wednesday", thursday: "Sunday through the following Sunday, the week before delivery" };
const MENU_NEXT_OPEN_LABEL = { monday: "Sunday", thursday: "Sunday" };

export function MenuView({ meals, orderingOpenFor, closureNoteFor, initialMenu }) {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState(
    initialMenu && MENUS[initialMenu] ? initialMenu :
    orderingOpenFor.monday && !orderingOpenFor.thursday ? "monday" :
    orderingOpenFor.thursday && !orderingOpenFor.monday ? "thursday" : "monday"
  );
  const { cart, addToCart, removeFromCart, incrementQty, decrementQty } = useCart(activeMenu);
  const [query, setQuery] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");
  const [customizing, setCustomizing] = useState(null); // meal | null
  const [bogoCode, setBogoCode] = useState("");
  const [discountCode, setDiscountCode] = useState("");

  const orderingOpen = orderingOpenFor[activeMenu];
  const isClosure = !!closureNoteFor?.[activeMenu];
  const hoursLeft = orderingOpen ? hoursUntilWindowCloses(activeMenu) : null;
  const closingSoon = hoursLeft !== null && hoursLeft <= 24;
  const menuMeals = meals.filter(m => mealIsOnMenu(m, activeMenu));
  const filtered = menuMeals.filter(m =>
    m.name.toLowerCase().includes(query.toLowerCase()) || m.category.toLowerCase().includes(query.toLowerCase())
  );
  // Category is free-typed on older meals, so "Dinner" and "Dinner " (or
  // "dinner") would otherwise group separately — key groups off a
  // trimmed/lowercased version and use the canonical SLOT_ORDER spelling
  // as the displayed heading whenever one matches.
  const normCat = (s) => (s || "").trim().toLowerCase();
  const categoryMap = new Map();
  filtered.forEach(m => {
    const key = normCat(m.category);
    if (!categoryMap.has(key)) categoryMap.set(key, []);
    categoryMap.get(key).push(m);
  });
  const grouped = [...categoryMap.entries()]
    .sort(([a], [b]) => {
      const ai = SLOT_ORDER.findIndex(s => normCat(s) === a);
      const bi = SLOT_ORDER.findIndex(s => normCat(s) === b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    })
    .map(([key, items]) => [SLOT_ORDER.find(s => normCat(s) === key) || items[0].category.trim(), items]);
  const qtyByMealId = cart.reduce((map, m) => ({ ...map, [m.id]: (map[m.id] || 0) + (m.quantity || 1) }), {});
  const totalUnits = cart.reduce((s, m) => s + (m.quantity || 1), 0);
  const total = cart.reduce((s, m) => s + applyOptionsToMeal(m, m.selectedOptions || []).price * (m.quantity || 1), 0);

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
          items: cart.flatMap(m =>
            Array.from({ length: m.quantity || 1 }, () => ({ mealId: m.id, optionIds: (m.selectedOptions || []).map(o => o.id) }))
          ),
          bogoCode: bogoCode.trim() || undefined,
          discountCode: discountCode.trim() || undefined,
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
        <div style={{ fontFamily: "'Baloo 2',sans-serif", fontWeight: 800, fontSize: 22, color: "var(--fu-text)" }}>Menu</div>
        <button onClick={() => setShowCart(true)} style={{
          position: "relative", background: "var(--fu-cta-bg)", border: "none", borderRadius: 14, padding: "10px 12px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6
        }}>
          <ShoppingBag size={16} color="var(--fu-cta-text)" />
          <span style={{ color: "var(--fu-cta-text)", fontWeight: 700, fontSize: 12.5 }}>{totalUnits}</span>
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        {Object.entries(MENUS).map(([key, m]) => (
          <button key={key} onClick={() => setActiveMenu(key)} style={{
            flex: 1, padding: "10px 8px", borderRadius: 12,
            border: activeMenu === key ? "1.5px solid var(--fu-cta-bg)" : "1.5px solid var(--fu-border)",
            background: activeMenu === key ? "var(--fu-cta-bg)" : "var(--fu-card)",
            color: activeMenu === key ? "var(--fu-cta-text)" : "var(--fu-text)",
            fontWeight: 700, fontSize: 12.5, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2
          }}>
            {m.label}
            {orderingOpenFor[key] && <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.85 }}>Open now</span>}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 13, color: "var(--fu-text-secondary)", marginTop: 10 }}>{totalUnits} meal{totalUnits === 1 ? "" : "s"} selected for {MENUS[activeMenu].label.toLowerCase()}.</div>

      {!orderingOpen && (
        <div style={{ background: "#FFB64822", border: "1px solid #FFB64855", borderRadius: 14, padding: "12px 14px", marginTop: 14, fontSize: 13, color: "var(--fu-text)", lineHeight: 1.4 }}>
          {isClosure
            ? closureNoteFor[activeMenu]
            : `${MENUS[activeMenu].label} ordering is open ${MENU_WINDOW_LABEL[activeMenu]}. You can browse the menu, but adding meals and checkout are turned off until it reopens ${MENU_NEXT_OPEN_LABEL[activeMenu]}.`}
        </div>
      )}

      {closingSoon && (
        <div style={{ background: "#FFB64822", border: "1px solid #FFB64855", borderRadius: 14, padding: "12px 14px", marginTop: 14, fontSize: 13, color: "var(--fu-text)", lineHeight: 1.4, fontWeight: 600 }}>
          {MENUS[activeMenu].label} ordering closes in {hoursLeft < 1 ? "less than an hour" : `about ${Math.round(hoursLeft)} hour${Math.round(hoursLeft) === 1 ? "" : "s"}`} — order now if you don&apos;t want to miss this window.
        </div>
      )}

      {!isClosure && (
        <>
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
                    onAdd={handleAdd} qtyInCart={qtyByMealId[m.id] || 0} cartFull={!orderingOpen}
                    onOpen={() => router.push(`/menu/${m.id}?menu=${activeMenu}`)} />
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {showCart && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", justifyContent: "flex-end", maxWidth: 430, margin: "0 auto" }}>
          <div onClick={() => setShowCart(false)} style={{ position: "absolute", inset: 0, background: "rgba(11,14,26,0.5)" }} />
          <div style={{ position: "relative", background: "var(--fu-card)", borderRadius: "24px 24px 0 0", padding: "20px 20px 24px", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontFamily: "'Baloo 2',sans-serif", fontWeight: 800, fontSize: 18, color: "var(--fu-text)" }}>{MENUS[activeMenu].label} cart</div>
              <button onClick={() => setShowCart(false)} style={{ background: "var(--fu-card-alt)", border: "none", borderRadius: 10, padding: 6, cursor: "pointer", color: "var(--fu-text)" }}><X size={16} /></button>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {cart.length === 0 && <div style={{ color: "var(--fu-text-muted)", fontSize: 13.5, textAlign: "center", padding: "30px 0" }}>Your cart is empty.</div>}
              {cart.map(m => {
                const itemTotals = applyOptionsToMeal(m, m.selectedOptions || []);
                const qty = m.quantity || 1;
                return (
                  <div key={m.cartItemId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--fu-border)" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--fu-card-alt)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{m.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "var(--fu-text)" }}>{m.name}</div>
                      {m.selectedOptions?.length > 0 && (
                        <div style={{ fontSize: 11, color: "var(--fu-text-secondary)", marginTop: 1 }}>{optionsLabel(m.selectedOptions)}</div>
                      )}
                      <div style={{ fontSize: 11.5, color: "var(--fu-text-muted)" }}>${itemTotals.price.toFixed(2)} each · ${(itemTotals.price * qty).toFixed(2)} total</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <button onClick={() => decrementQty(m.cartItemId)} style={{ width: 26, height: 26, borderRadius: 8, border: "1px solid var(--fu-border)", background: "var(--fu-card-alt)", color: "var(--fu-text)", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                      <span style={{ fontWeight: 700, fontSize: 13, color: "var(--fu-text)", minWidth: 14, textAlign: "center" }}>{qty}</span>
                      <button onClick={() => incrementQty(m.cartItemId)} style={{ width: 26, height: 26, borderRadius: 8, border: "1px solid var(--fu-border)", background: "var(--fu-card-alt)", color: "var(--fu-text)", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                    </div>
                    <button onClick={() => removeFromCart(m.cartItemId)} style={{ background: "none", border: "none", cursor: "pointer" }}><Trash2 size={16} color="#FF5A5F" /></button>
                  </div>
                );
              })}
            </div>
            {cart.length > 0 && (
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--fu-label)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>BOGO code</div>
                  <input
                    placeholder="Enter code (optional)"
                    value={bogoCode}
                    onChange={e => setBogoCode(e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", background: "var(--fu-card-alt)", border: "1px solid var(--fu-border)", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "var(--fu-text)", outline: "none" }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--fu-label)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Discount code</div>
                  <input
                    placeholder="Enter code (optional)"
                    value={discountCode}
                    onChange={e => setDiscountCode(e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", background: "var(--fu-card-alt)", border: "1px solid var(--fu-border)", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "var(--fu-text)", outline: "none" }}
                  />
                </div>
              </div>
            )}
            {error && <div style={{ color: "#FF5A5F", fontSize: 12.5, marginTop: 8, fontWeight: 600 }}>{error}</div>}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, marginBottom: 12 }}>
              <span style={{ fontWeight: 700, color: "var(--fu-text-secondary)", fontSize: 13.5 }}>Total</span>
              <span style={{ fontWeight: 800, fontSize: 18, color: "var(--fu-text)" }}>${total.toFixed(2)}</span>
            </div>
            <button
              disabled={cart.length === 0 || checkingOut || !orderingOpen}
              onClick={handleCheckout}
              style={{ width: "100%", padding: 15, borderRadius: 14, border: "none", background: cart.length && orderingOpen ? "var(--fu-cta-bg)" : "var(--fu-card-alt)", color: cart.length && orderingOpen ? "var(--fu-cta-text)" : "var(--fu-text-muted)", fontWeight: 800, fontSize: 15, cursor: cart.length && orderingOpen ? "pointer" : "default", opacity: checkingOut ? 0.7 : 1 }}>
              {checkingOut ? "Redirecting to secure checkout…" : orderingOpen ? "Continue to checkout" : isClosure ? "Delivery closed this week" : `Ordering opens ${MENU_NEXT_OPEN_LABEL[activeMenu]}`}
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
