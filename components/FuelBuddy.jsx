"use client";

import { BUDDY_STATES, fuelState } from "@/lib/fuel";

export function FuelBuddy({ score, size = 96 }) {
  const key = fuelState(score);
  const s = BUDDY_STATES[key];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: `radial-gradient(circle at 35% 30%, ${s.color}33, ${s.color}0d)`,
        boxShadow: `0 0 0 6px ${s.glow}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "box-shadow .6s ease"
      }}>
        <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill={s.color} opacity="0.14" />
          <circle cx="50" cy="50" r="34" fill={s.color} />
          <circle cx="38" cy="46" r="5" fill="#0B0E1A" />
          <circle cx="62" cy="46" r="5" fill="#0B0E1A" />
          <path d={s.mouth} stroke="#0B0E1A" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15, color: "#0B0E1A" }}>{s.label}</div>
      </div>
    </div>
  );
}
