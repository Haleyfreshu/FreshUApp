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
      if (raw) setCarts({ ...emptyCarts(), ...JSON.parse(raw) });
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

  const addToCart = (menuKey, meal, selectedOptions = []) => {
    setCarts((c) => {
      const list = c[menuKey] || [];
      if (list.some((m) => m.id === meal.id)) return c;
      return { ...c, [menuKey]: [...list, { ...meal, selectedOptions }] };
    });
  };
  const removeFromCart = (menuKey, id) =>
    setCarts((c) => ({ ...c, [menuKey]: (c[menuKey] || []).filter((m) => m.id !== id) }));
  const clearCart = (menuKey) => setCarts((c) => ({ ...c, [menuKey]: [] }));

  return (
    <CartContext.Provider value={{ carts, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

function useCartContext() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

// Scoped to one menu's cart — what MenuView and checkout work with.
export function useCart(menuKey) {
  const { carts, addToCart, removeFromCart, clearCart } = useCartContext();
  return {
    cart: carts[menuKey] || [],
    addToCart: (meal, selectedOptions) => addToCart(menuKey, meal, selectedOptions),
    removeFromCart: (id) => removeFromCart(menuKey, id),
    clearCart: () => clearCart(menuKey),
  };
}

// Combined counts across both menus — what the bottom nav badge uses.
export function useCartCounts() {
  const { carts } = useCartContext();
  const counts = Object.fromEntries(MENU_KEYS.map((k) => [k, (carts[k] || []).length]));
  counts.total = MENU_KEYS.reduce((sum, k) => sum + counts[k], 0);
  return counts;
}
