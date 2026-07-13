"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Shell";
import { AuthField } from "@/components/Fields";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
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
      .select("role, onboarded")
      .eq("id", data.user.id)
      .single();

    setLoading(false);
    if (profile?.role === "staff") {
      router.push("/staff/admin");
    } else if (!profile?.onboarded) {
      router.push("/onboarding");
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "60px 26px 30px", justifyContent: "space-between" }}>
      <div>
        <Logo height={40} />
        <div style={{ marginTop: 34, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 27, color: "#0B0E1A", lineHeight: 1.2 }}>
          Fuel your <span style={{ color: "#2A3EFF" }}>performance.</span>
        </div>
        <div style={{ fontSize: 14, color: "#6B7290", marginTop: 8 }}>Log in to track your nutrition and order this week&apos;s meals.</div>

        <div style={{ marginTop: 30 }}>
          <AuthField label="Email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          <div style={{ position: "relative" }}>
            <AuthField label="Password" type={showPw ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            <button onClick={() => setShowPw(s => !s)} type="button" style={{ position: "absolute", right: 14, top: 34, background: "none", border: "none", cursor: "pointer" }}>
              {showPw ? <EyeOff size={17} color="#9AA0BF" /> : <Eye size={17} color="#9AA0BF" />}
            </button>
          </div>
        </div>
        {error && <div style={{ color: "#FF5A5F", fontSize: 12.5, marginBottom: 10, fontWeight: 600 }}>{error}</div>}
        <button
          onClick={handleLogin} disabled={loading}
          style={{ width: "100%", marginTop: 8, padding: "16px", borderRadius: 16, border: "none", background: "#0B0E1A", color: "#fff", fontWeight: 800, fontSize: 15.5, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "Logging in…" : "Log In"}
        </button>
        <div style={{ fontSize: 11.5, color: "#9AA0BF", textAlign: "center", marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          <ShieldCheck size={13} /> Your data is encrypted and stored securely
        </div>
      </div>

      <div>
        <div style={{ textAlign: "center", fontSize: 13.5, color: "#6B7290" }}>
          New to FreshU? <a href="/signup" style={{ background: "none", border: "none", color: "#2A3EFF", fontWeight: 800, cursor: "pointer", fontSize: 13.5, textDecoration: "none" }}>Create account</a>
        </div>
        <a href="/staff/login" style={{ display: "block", margin: "14px auto 0", background: "none", border: "none", color: "#9AA0BF", fontSize: 12, cursor: "pointer", textAlign: "center", textDecoration: "none" }}>Staff login →</a>
      </div>
    </div>
  );
}
