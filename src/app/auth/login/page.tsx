"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getAuthClient } from "@/lib/auth-client";

function LoginForm() {
  const searchParams = useSearchParams();
  const [email,   setEmail]   = useState("");
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const urlError = searchParams.get("error");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const error = submitError ?? (urlError ? decodeURIComponent(urlError) : null);

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setSubmitError(null);

    const { error: authError } = await getAuthClient().sendMagicLink(
      email,
      `${window.location.origin}/auth/callback`,
    );

    setLoading(false);
    if (authError) {
      setSubmitError(authError);
    } else {
      setSent(true);
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: "440px" }}>
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <div style={{ fontSize: "48px", fontWeight: "900", color: "#58cc02", letterSpacing: "-2px", marginBottom: "8px" }}>bloom</div>
        <div style={{ fontSize: "14px", color: "#afafaf" }}>Grow beyond your habits</div>
      </div>

      {!sent ? (
        <div style={{ background: "white", borderRadius: "24px", padding: "40px", boxShadow: "0 4px 40px rgba(0,0,0,0.08)", border: "2px solid #eeeeee" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "900", marginBottom: "8px", color: "#1f1f1f" }}>Welcome back 👋</h1>
          <p style={{ color: "#afafaf", fontSize: "14px", marginBottom: "32px", lineHeight: 1.6 }}>
            Enter your email — we'll send you a magic link. No password needed.
          </p>

          {error && (
            <div style={{ background: "#fff5f5", border: "2px solid #fca5a5", borderRadius: "12px", padding: "12px 16px", marginBottom: "20px", fontSize: "13px", color: "#c0392b", fontWeight: "600" }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={sendMagicLink}>
            <label style={{ display: "block", fontWeight: "700", fontSize: "13px", marginBottom: "8px", color: "#4b4b4b" }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
              style={{
                width: "100%", padding: "14px 18px",
                borderRadius: "14px", border: "2px solid #eeeeee",
                fontSize: "16px", fontFamily: "inherit", outline: "none",
                marginBottom: "16px", boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={e => (e.target.style.borderColor = "#58cc02")}
              onBlur={e => (e.target.style.borderColor = "#eeeeee")}
            />
            <button
              type="submit"
              disabled={loading || !email.trim()}
              style={{
                width: "100%", padding: "16px",
                borderRadius: "14px", border: "none",
                borderBottom: loading ? "none" : "4px solid #46a302",
                background: loading ? "#a8e063" : "#58cc02",
                color: "white", fontWeight: "800",
                fontSize: "15px", cursor: loading ? "default" : "pointer",
                letterSpacing: "0.5px", transition: "all 0.15s",
              }}
            >
              {loading ? "Sending..." : "✉️ Send Magic Link"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: "12px", color: "#afafaf", marginTop: "24px", lineHeight: 1.6 }}>
            New to Bloom? Just enter your email above — we'll create your account automatically.
          </p>
        </div>
      ) : (
        /* Success state */
        <div style={{ background: "white", borderRadius: "24px", padding: "48px 40px", boxShadow: "0 4px 40px rgba(0,0,0,0.08)", border: "2px solid #b8f0a0", textAlign: "center" }}>
          <div style={{ fontSize: "64px", marginBottom: "20px", animation: "bounce 1s ease-in-out" }}>📬</div>
          <h2 style={{ fontSize: "22px", fontWeight: "900", marginBottom: "12px" }}>Check your email!</h2>
          <p style={{ color: "#afafaf", fontSize: "15px", lineHeight: 1.7, marginBottom: "28px" }}>
            We sent a magic link to <strong style={{ color: "#1f1f1f" }}>{email}</strong>.<br />
            Click it to sign in — no password needed.
          </p>
          <div style={{ background: "#f7f7f7", borderRadius: "12px", padding: "16px", fontSize: "13px", color: "#777" }}>
            💡 The link expires in 1 hour. Check your spam folder if you don't see it.
          </div>
          <button
            onClick={() => { setSent(false); setEmail(""); }}
            style={{ marginTop: "24px", background: "none", border: "none", color: "#afafaf", fontWeight: "600", fontSize: "13px", cursor: "pointer", textDecoration: "underline" }}
          >
            Use a different email
          </button>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <main style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #f0fde4 0%, #ffffff 50%, #e0f7fe 100%)",
      padding: "32px 20px",
    }}>
      {/* Decorative orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(88,204,2,0.07) 0%, transparent 70%)", top: "-200px", left: "-200px" }} />
        <div style={{ position: "absolute", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(28,176,246,0.07) 0%, transparent 70%)", bottom: "-150px", right: "-150px" }} />
      </div>

      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>

      <style jsx>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-10px); }
        }
      `}</style>
    </main>
  );
}
