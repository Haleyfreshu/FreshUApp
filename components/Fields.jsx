"use client";

export function AuthField({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: "#4C5378", marginBottom: 6 }}>{label}</div>
      <input {...props} style={{
        width: "100%", boxSizing: "border-box", padding: "13px 14px", borderRadius: 14,
        border: "1.5px solid #E7EBF7", fontSize: 15, outline: "none", background: "#fff", color: "#0B0E1A"
      }} />
    </div>
  );
}

export function Field({ label, value, edit, onChange }) {
  return (
    <div style={{ flex: 1, marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#9AA0BF", marginBottom: 4 }}>{label}</div>
      {edit ? (
        <input value={value ?? ""} onChange={e => onChange(e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "9px 10px", borderRadius: 10, border: "1.5px solid #E7EBF7", fontSize: 13.5, outline: "none" }} />
      ) : (
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0B0E1A" }}>{value || "—"}</div>
      )}
    </div>
  );
}

export function SmallField({ label, ...props }) {
  return (
    <div style={{ flex: 1, marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#9AA0BF", marginBottom: 4 }}>{label}</div>
      <input {...props} style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #E7EBF7", fontSize: 13.5, outline: "none" }} />
    </div>
  );
}

export function EmptyState({ text }) {
  return <div style={{ background: "#fff", borderRadius: 18, padding: "24px 18px", textAlign: "center", color: "#9AA0BF", fontSize: 13, boxShadow: "0 2px 10px rgba(15,20,50,0.05)" }}>{text}</div>;
}
