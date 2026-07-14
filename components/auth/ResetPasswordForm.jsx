"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Shell";
import { AuthField } from "@/components/Fields";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "60px 26px 30px" }}>
      <Logo height={34} />
      <div style={{ marginTop: 26, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 24, color: "var(--fu-text)" }}>Set a new password</div>
      <div style={{ fontSize: 13.5, color: "var(--fu-text-secondary)", marginTop: 6, marginBottom: 20 }}>
        Choose a new password for your account.
      </div>
      <AuthField label="New password" type="password" placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} />
      <AuthField label="Confirm password" type="password" placeholder="Re-enter password" value={confirm} onChange={e => setConfirm(e.target.value)} />
      {error && <div style={{ color: "#FF5A5F", fontSize: 12.5, marginBottom: 10, fontWeight: 600 }}>{error}</div>}
      <button
        onClick={handleSubmit} disabled={loading}
        style={{ width: "100%", marginTop: 6, padding: "16px", borderRadius: 16, border: "none", background: "var(--fu-cta-bg)", color: "var(--fu-cta-text)", fontWeight: 800, fontSize: 15.5, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}>
        {loading ? "Saving…" : "Save new password"}
      </button>
    </div>
  );
}
