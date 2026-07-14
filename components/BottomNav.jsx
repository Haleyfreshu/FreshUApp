"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, UtensilsCrossed, Package, User } from "lucide-react";

const NAV_ITEMS = [
  { key: "dashboard", label: "Home", icon: Home, href: "/dashboard" },
  { key: "menu", label: "Menu", icon: UtensilsCrossed, href: "/menu" },
  { key: "orders", label: "Orders", icon: Package, href: "/orders" },
  { key: "profile", label: "Profile", icon: User, href: "/profile" },
];

export function BottomNav({ cartCount = 0 }) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <div style={{
      position: "sticky", bottom: 0, left: 0, right: 0, background: "var(--fu-card)",
      borderTop: "1px solid var(--fu-border)", display: "flex", padding: "8px 6px calc(env(safe-area-inset-bottom,0px) + 8px)",
      boxShadow: "0 -4px 20px rgba(0,0,0,0.35)", zIndex: 20
    }}>
      {NAV_ITEMS.map(it => {
        const Icon = it.icon;
        const isActive = pathname?.startsWith(it.href);
        return (
          <button key={it.key} onClick={() => router.push(it.href)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            background: "none", border: "none", padding: "6px 0", position: "relative", cursor: "pointer"
          }}>
            <div style={{ position: "relative" }}>
              <Icon size={22} color={isActive ? "#2A3EFF" : "var(--fu-text-muted)"} strokeWidth={isActive ? 2.4 : 2} />
              {it.key === "menu" && cartCount > 0 && (
                <span style={{
                  position: "absolute", top: -6, right: -8, background: "#33D3A3", color: "#fff",
                  fontSize: 9, fontWeight: 800, borderRadius: 8, minWidth: 15, height: 15,
                  display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px"
                }}>{cartCount}</span>
              )}
            </div>
            <span style={{ fontSize: 10.5, fontWeight: isActive ? 800 : 600, color: isActive ? "#2A3EFF" : "var(--fu-text-muted)" }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}
