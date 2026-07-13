"use client";

export function OrderCard({ order }) {
  return (
    <div style={{ background: "#fff", borderRadius: 20, padding: 16, marginBottom: 12, boxShadow: "0 2px 14px rgba(15,20,50,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14 }}>Week of {order.week_of}</div>
          <div style={{ fontSize: 11.5, color: "#9AA0BF", marginTop: 2 }}>{order.items.length} meals</div>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 800, padding: "5px 10px", borderRadius: 10,
          background: order.status === "This Week" ? "#33D3A322" : "#E7EBF7",
          color: order.status === "This Week" ? "#1B9A73" : "#6B7290"
        }}>{order.status}</span>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        {order.items.map((it, i) => (
          <span key={i} style={{ fontSize: 18 }}>{it.emoji}</span>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: "1px solid #F3F5FB" }}>
        <span style={{ fontSize: 12.5, color: "#6B7290" }}>Total</span>
        <span style={{ fontWeight: 800, fontSize: 14 }}>${Number(order.total).toFixed(2)}</span>
      </div>
    </div>
  );
}
