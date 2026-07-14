"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Shell";
import { AuthField } from "@/components/Fields";
import { createClient } from "@/lib/supabase/client";

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setError("");
    setNotice("");
    if (!name || !email || !password) {
      setError("Fill in your name, email, and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email, password,
      options: { data: { name }, emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (data.session) {
      router.push("/onboarding");
      router.refresh();
    } else {
      setNotice("Check your email to confirm your account, then log in.");
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "50px 26px 30px" }}>
      <Logo height={34} />
      <div style={{ marginTop: 26, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 24, color: "var(--fu-text)" }}>Create your account</div>
      <div style={{ fontSize: 13.5, color: "var(--fu-text-secondary)", marginTop: 6, marginBottom: 20 }}>Built for college athletes.</div>
      <AuthField label="Full name" placeholder="Jordan Ellis" value={name} onChange={e => setName(e.target.value)} />
      <AuthField label="Email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
      <AuthField label="Password" type="password" placeholder="Create a password" value={password} onChange={e => setPassword(e.target.value)} />
      {error && <div style={{ color: "#FF5A5F", fontSize: 12.5, marginBottom: 10, fontWeight: 600 }}>{error}</div>}
      {notice && <div style={{ color: "#33D3A3", fontSize: 12.5, marginBottom: 10, fontWeight: 600 }}>{notice}</div>}
      <button
        onClick={handleSignup} disabled={loading}
        style={{ width: "100%", marginTop: 6, padding: "16px", borderRadius: 16, border: "none", background: "#2A3EFF", color: "#fff", fontWeight: 800, fontSize: 15.5, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}>
        {loading ? "Creating account…" : "Continue"}
      </button>
      <div style={{ textAlign: "center", fontSize: 13.5, color: "var(--fu-text-secondary)", marginTop: 16 }}>
        Already have an account? <a href="/login" style={{ background: "none", border: "none", color: "#2A3EFF", fontWeight: 800, cursor: "pointer", fontSize: 13.5, textDecoration: "none" }}>Log in</a>
      </div>
    </div>
  );
}
