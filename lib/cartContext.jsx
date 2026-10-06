"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { MENU_KEYS } from "@/lib/orderWindow";

const CartContext = createContext(null);

const emptyCarts = () => Object.fromEntries(MENU_KEYS.map((k) => [k, []]));

export function CartProvider({ userId, children }) {
  const storageKey = `freshu:carts:${userId}`;
  const [carts, setCarts] = useState(emptyCarts);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Backfill cartItemId/quantity for carts saved before multi-quantity
        // support existed, so a stale localStorage cart doesn't break.
        Object.keys(parsed).forEach((menuKey) => {
          parsed[menuKey] = (parsed[menuKey] || []).map((m) => ({
            ...m, quantity: m.quantity || 1, cartItemId: m.cartItemId || `${m.id}-${Math.random().toString(36).slice(2)}`,
          }));
        });
        setCarts({ ...emptyCarts(), ...parsed });
      }
    } catch {
      // ignore corrupt localStorage
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(storageKey, JSON.stringify(carts));
  }, [carts, hydrated, storageKey]);

  const optionsKey = (selectedOptions) => (selectedOptions || []).map((o) => o.id).sort().join(",");

  // Adding the same meal with the same options again increases quantity on
  // that existing line rather than being blocked — only a different set of
  // options gets its own separate line.
  const addToCart = (menuKey, meal, selectedOptions = []) => {
    setCarts((c) => {
      const list = c[menuKey] || [];
      const key = optionsKey(selectedOptions);
      const idx = list.findIndex((m) => m.id === meal.id && optionsKey(m.selectedOptions) === key);
      if (idx !== -1) {
        const updated = [...list];
        updated[idx] = { ...updated[idx], quantity: (updated[idx].quantity || 1) + 1 };
        return { ...c, [menuKey]: updated };
      }
      return { ...c, [menuKey]: [...list, { ...meal, selectedOptions, quantity: 1, cartItemId: crypto.randomUUID() }] };
    });
  };
  const removeFromCart = (menuKey, cartItemId) =>
    setCarts((c) => ({ ...c, [menuKey]: (c[menuKey] || []).filter((m) => m.cartItemId !== cartItemId) }));
  const incrementQty = (menuKey, cartItemId) =>
    setCarts((c) => ({
      ...c,
      [menuKey]: (c[menuKey] || []).map((m) => (m.cartItemId === cartItemId ? { ...m, quantity: (m.quantity || 1) + 1 } : m)),
    }));
  const decrementQty = (menuKey, cartItemId) =>
    setCarts((c) => ({
      ...c,
      [menuKey]: (c[menuKey] || []).flatMap((m) => {
        if (m.cartItemId !== cartItemId) return [m];
        const quantity = (m.quantity || 1) - 1;
        return quantity <= 0 ? [] : [{ ...m, quantity }];
      }),
    }));
  const clearCart = (menuKey) => setCarts((c) => ({ ...c, [menuKey]: [] }));

  return (
    <CartContext.Provider value={{ carts, addToCart, removeFromCart, incrementQty, decrementQty, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

function useCartContext() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

const lineUnits = (list) => list.reduce((sum, m) => sum + (m.quantity || 1), 0);

// Scoped to one menu's cart — what MenuView and checkout work with.
export function useCart(menuKey) {
  const { carts, addToCart, removeFromCart, incrementQty, decrementQty, clearCart } = useCartContext();
  return {
    cart: carts[menuKey] || [],
    addToCart: (meal, selectedOptions) => addToCart(menuKey, meal, selectedOptions),
    removeFromCart: (cartItemId) => removeFromCart(menuKey, cartItemId),
    incrementQty: (cartItemId) => incrementQty(menuKey, cartItemId),
    decrementQty: (cartItemId) => decrementQty(menuKey, cartItemId),
    clearCart: () => clearCart(menuKey),
  };
}

// Combined unit counts across both menus — what the bottom nav badge uses.
export function useCartCounts() {
  const { carts } = useCartContext();
  const counts = Object.fromEntries(MENU_KEYS.map((k) => [k, lineUnits(carts[k] || [])]));
  counts.total = MENU_KEYS.reduce((sum, k) => sum + counts[k], 0);
  return counts;
}
