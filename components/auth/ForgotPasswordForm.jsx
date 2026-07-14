"use client";

import { useState } from "react";
import { Logo } from "@/components/Shell";
import { AuthField } from "@/components/Fields";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!email) {
      setError("Enter your email.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "60px 26px 30px" }}>
      <Logo height={34} />
      <div style={{ marginTop: 26, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 24, color: "var(--fu-text)" }}>Reset your password</div>

      {sent ? (
        <div style={{ fontSize: 13.5, color: "var(--fu-text-secondary)", marginTop: 10, lineHeight: 1.5 }}>
          If an account exists for <strong style={{ color: "var(--fu-text)" }}>{email}</strong>, a password reset link is on its way. Check your email.
        </div>
      ) : (
        <>
          <div style={{ fontSize: 13.5, color: "var(--fu-text-secondary)", marginTop: 6, marginBottom: 20 }}>
            Enter your email and we&apos;ll send you a link to set a new password.
          </div>
          <AuthField label="Email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          {error && <div style={{ color: "#FF5A5F", fontSize: 12.5, marginBottom: 10, fontWeight: 600 }}>{error}</div>}
          <button
            onClick={handleSubmit} disabled={loading}
            style={{ width: "100%", marginTop: 6, padding: "16px", borderRadius: 16, border: "none", background: "var(--fu-cta-bg)", color: "var(--fu-cta-text)", fontWeight: 800, fontSize: 15.5, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </>
      )}

      <div style={{ textAlign: "center", fontSize: 13.5, color: "var(--fu-text-secondary)", marginTop: 16 }}>
        <a href="/login" style={{ color: "#2A3EFF", fontWeight: 800, textDecoration: "none" }}>← Back to login</a>
      </div>
    </div>
  );
}
