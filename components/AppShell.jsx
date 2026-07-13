"use client";

import { Shell } from "@/components/Shell";
import { BottomNav } from "@/components/BottomNav";
import { CartProvider, useCart } from "@/lib/cartContext";

function AppShellInner({ children }) {
  const { cart } = useCart();
  return (
    <Shell>
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 6 }}>{children}</div>
      <BottomNav cartCount={cart.length} />
    </Shell>
  );
}

export function AppShell({ userId, children }) {
  return (
    <CartProvider userId={userId}>
      <AppShellInner>{children}</AppShellInner>
    </CartProvider>
  );
}
