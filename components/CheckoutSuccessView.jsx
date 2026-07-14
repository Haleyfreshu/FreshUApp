"use client";

import { useEffect } from "react";
import { Check } from "lucide-react";
import { Shell } from "@/components/Shell";

export function CheckoutSuccessView({ userId, order }) {
  useEffect(() => {
    window.localStorage.removeItem(`freshu:cart:${userId}`);
  }, [userId]);

  const stillProcessing = order?.status === "pending_payment";

  return (
    <Shell>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "0 26px" }}>
        <div style={{ background: "var(--fu-card)", borderRadius: 24, padding: "34px 26px", textAlign: "center", width: "100%" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#33D3A322", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <Check size={30} color="#33D3A3" />
          </div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 18, color: "var(--fu-text)" }}>
            {stillProcessing ? "Payment received!" : "Order confirmed!"}
          </div>
          <div style={{ fontSize: 13, color: "var(--fu-text-secondary)", marginTop: 6 }}>
            {stillProcessing
              ? "We're finalizing your order — it'll show up in the Orders tab in just a moment."
              : "Your meals are locked in for this week. Check the Orders tab for delivery details."}
          </div>
          <a href="/orders" style={{ display: "block", textDecoration: "none", width: "100%", marginTop: 18, padding: 14, borderRadius: 14, border: "none", background: "var(--fu-cta-bg)", color: "var(--fu-cta-text)", fontWeight: 800, cursor: "pointer" }}>
            View Orders
          </a>
        </div>
      </div>
    </Shell>
  );
}
