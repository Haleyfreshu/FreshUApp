import { Shell } from "@/components/Shell";
import { X } from "lucide-react";

export default function CheckoutCancelPage() {
  return (
    <Shell>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "0 26px" }}>
        <div style={{ background: "var(--fu-card)", borderRadius: 24, padding: "34px 26px", textAlign: "center", width: "100%" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--fu-danger-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <X size={30} color="#FF5A5F" />
          </div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 18, color: "var(--fu-text)" }}>Checkout canceled</div>
          <div style={{ fontSize: 13, color: "var(--fu-text-secondary)", marginTop: 6 }}>Your cart is still saved. Head back to the menu whenever you&apos;re ready.</div>
          <a href="/menu" style={{ display: "block", textDecoration: "none", width: "100%", marginTop: 18, padding: 14, borderRadius: 14, border: "none", background: "var(--fu-cta-bg)", color: "var(--fu-cta-text)", fontWeight: 800, cursor: "pointer" }}>
            Back to Menu
          </a>
        </div>
      </div>
    </Shell>
  );
}
