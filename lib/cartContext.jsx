"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { CART_MAX } from "@/lib/constants";

const CartContext = createContext(null);

export function CartProvider({ userId, children }) {
  const storageKey = `freshu:cart:${userId}`;
  const [cart, setCart] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setCart(JSON.parse(raw));
    } catch {
      // ignore corrupt localStorage
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(storageKey, JSON.stringify(cart));
  }, [cart, hydrated, storageKey]);

  const addToCart = (meal) => {
    setCart((c) => {
      if (c.length >= CART_MAX || c.some((m) => m.id === meal.id)) return c;
      return [...c, meal];
    });
  };
  const removeFromCart = (id) => setCart((c) => c.filter((m) => m.id !== id));
  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, cartFull: cart.length >= CART_MAX }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
