import { Shell } from "@/components/Shell";
import { X } from "lucide-react";

export default function CheckoutCancelPage() {
  return (
    <Shell>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "0 26px" }}>
        <div style={{ background: "#fff", borderRadius: 24, padding: "34px 26px", textAlign: "center", width: "100%" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#FFE0E0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <X size={30} color="#FF5A5F" />
          </div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 18, color: "#0B0E1A" }}>Checkout canceled</div>
          <div style={{ fontSize: 13, color: "#6B7290", marginTop: 6 }}>Your cart is still saved. Head back to the menu whenever you&apos;re ready.</div>
          <a href="/menu" style={{ display: "block", textDecoration: "none", width: "100%", marginTop: 18, padding: 14, borderRadius: 14, border: "none", background: "#0B0E1A", color: "#fff", fontWeight: 800, cursor: "pointer" }}>
            Back to Menu
          </a>
        </div>
      </div>
    </Shell>
  );
}
