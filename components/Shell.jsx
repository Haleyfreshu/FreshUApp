"use client";

import { ArrowLeft } from "lucide-react";

export const FRESHU_LOGO = "/freshu-logo.png";

export function Shell({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0B0E1A", display: "flex", justifyContent: "center", padding: "0" }}>
      <div style={{
        width: "100%", maxWidth: 430, minHeight: "100vh", background: "#F3F5FB",
        display: "flex", flexDirection: "column", position: "relative", overflow: "hidden"
      }}>
        {children}
      </div>
    </div>
  );
}

export function TopBar({ title, right, onBack }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "18px 20px 12px", background: "#F3F5FB", position: "sticky", top: 0, zIndex: 10
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {onBack && (
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, marginLeft: -6 }}>
            <ArrowLeft size={20} color="#0B0E1A" />
          </button>
        )}
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 20, color: "#0B0E1A" }}>{title}</div>
      </div>
      {right}
    </div>
  );
}

export function Logo({ height = 34 }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", background: "#0B0E1A",
      borderRadius: 14, padding: `${height * 0.28}px ${height * 0.42}px`
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={FRESHU_LOGO} alt="FreshU" style={{ height, width: "auto", display: "block" }} />
    </div>
  );
}
