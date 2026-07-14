"use client";

export function OrderCard({ order }) {
  return (
    <div style={{ background: "var(--fu-card)", borderRadius: 20, padding: 16, marginBottom: 12, boxShadow: "0 2px 14px rgba(0,0,0,0.35)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, color: "var(--fu-text)" }}>Week of {order.week_of}</div>
          <div style={{ fontSize: 11.5, color: "var(--fu-text-muted)", marginTop: 2 }}>{order.items.length} meals</div>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 800, padding: "5px 10px", borderRadius: 10,
          background: order.status === "This Week" ? "#33D3A322" : "var(--fu-card-alt)",
          color: order.status === "This Week" ? "#33D3A3" : "var(--fu-text-secondary)"
        }}>{order.status}</span>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        {order.items.map((it, i) => (
          <span key={i} style={{ fontSize: 18 }}>{it.emoji}</span>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--fu-border)" }}>
        <span style={{ fontSize: 12.5, color: "var(--fu-text-secondary)" }}>Total</span>
        <span style={{ fontWeight: 800, fontSize: 14, color: "var(--fu-text)" }}>${Number(order.total).toFixed(2)}</span>
      </div>
    </div>
  );
}
