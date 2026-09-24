"use client";

import { Shell } from "@/components/Shell";
import { BottomNav } from "@/components/BottomNav";
import { CartProvider, useCartCounts } from "@/lib/cartContext";

function AppShellInner({ children }) {
  const { total } = useCartCounts();
  return (
    <Shell>
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: "calc(70px + env(safe-area-inset-bottom, 0px))" }}>{children}</div>
      <BottomNav cartCount={total} />
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
