"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Shell";
import { AuthField } from "@/components/Fields";
import { createClient } from "@/lib/supabase/client";

export function StaffLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profile?.role !== "staff") {
      await supabase.auth.signOut();
      setLoading(false);
      setError("This account doesn't have staff access.");
      return;
    }

    setLoading(false);
    router.push("/staff/admin");
    router.refresh();
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 26px" }}>
      <Logo height={30} />
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 22, color: "var(--fu-text)", marginTop: 22, marginBottom: 4 }}>Staff access</div>
      <div style={{ fontSize: 13, color: "var(--fu-text-secondary)", marginBottom: 18 }}>Log in with your staff account to manage meals and orders.</div>
      <AuthField label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="staff@example.com" />
      <AuthField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
      {error && <div style={{ color: "#FF5A5F", fontSize: 12.5, marginTop: -6, marginBottom: 12, fontWeight: 600 }}>{error}</div>}
      <button onClick={handleLogin} disabled={loading}
        style={{ padding: 15, borderRadius: 14, border: "none", background: "var(--fu-cta-bg)", color: "var(--fu-cta-text)", fontWeight: 800, fontSize: 15, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}>
        {loading ? "Checking…" : "Enter"}
      </button>
      <a href="/login" style={{ marginTop: 14, background: "none", border: "none", color: "var(--fu-text-muted)", fontSize: 12.5, cursor: "pointer", textDecoration: "none", textAlign: "center" }}>← Back to athlete login</a>
    </div>
  );
}
