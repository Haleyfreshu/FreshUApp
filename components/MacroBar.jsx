"use client";

export function MacroBar({ icon: Icon, label, current, goal, unit, color }) {
  const pct = goal ? Math.min(100, (current / goal) * 100) : 0;
  const remaining = Math.max(0, Math.round(goal - current));
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Icon size={15} color={color} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#0B0E1A" }}>{label}</span>
        </div>
        <span style={{ fontSize: 12, color: "#6B7290" }}>
          {Math.round(current)}{unit} / {goal}{unit}
        </span>
      </div>
      <div style={{ height: 8, borderRadius: 8, background: "#E7EBF7", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 8, transition: "width .7s cubic-bezier(.4,0,.2,1)" }} />
      </div>
      <div style={{ fontSize: 11, color: "#9AA0BF", marginTop: 4 }}>
        {remaining > 0 ? `${remaining}${unit} to go` : "Goal reached 🎉"}
      </div>
    </div>
  );
}
