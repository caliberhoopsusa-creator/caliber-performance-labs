import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CaliberLogo } from "@/components/CaliberLogo";
import { Loader2, ArrowRight, Trophy, BarChart3, GraduationCap } from "lucide-react";

async function loginRequest(email: string, password: string) {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Login failed");
  }
  return res.json();
}

async function registerRequest(email: string, password: string, firstName: string, lastName: string, dateOfBirth?: string) {
  const referralCode = localStorage.getItem("caliber_ref") ?? undefined;
  const res = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password, firstName, lastName, referralCode, dateOfBirth }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Registration failed");
  }
  return res.json();
}

const PERKS = [
  { icon: BarChart3, text: "Performance grade on every game" },
  { icon: GraduationCap, text: "Recruiting profile seen by college programs" },
  { icon: Trophy, text: "Badge & XP system that tracks your progress" },
];

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "11px 14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  color: "#fff",
  fontSize: 14,
  outline: "none",
  transition: "border-color 0.15s",
  fontFamily: "Inter, sans-serif",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "rgba(255,255,255,0.45)",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  marginBottom: 7,
};

export default function Login() {
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"login" | "register">("login");
  const redirectTo = new URLSearchParams(location.split("?")[1] ?? "").get("redirect") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [error, setError] = useState("");

  const isUnder13 = (dob: string) => {
    if (!dob) return false;
    const age = (new Date().getTime() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    return age < 13;
  };
  const under13Warning = mode === "register" && isUnder13(dateOfBirth);

  const mutation = useMutation({
    mutationFn: () =>
      mode === "login"
        ? loginRequest(email, password)
        : registerRequest(email, password, firstName, lastName, dateOfBirth || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      if (mode === "register") localStorage.removeItem("caliber_ref");
      navigate(redirectTo);
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    mutation.mutate();
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080808",
      display: "flex",
      fontFamily: "Inter, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&family=Inter:wght@400;500;600&display=swap');
        .login-input:focus { border-color: rgba(198,208,216,0.4) !important; }
        @keyframes login-glow {
          0%,100% { opacity: 0.5; }
          50% { opacity: 0.85; }
        }
        @keyframes login-in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>

      {/* Left panel — branding (hidden on mobile) */}
      <div style={{
        flex: "0 0 440px",
        background: "linear-gradient(160deg, #0d1117 0%, #080808 60%)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        padding: "48px 40px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }} className="hidden-mobile">

        {/* Logo */}
        <div>
          <Link href="/">
            <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 56 }}>
              <CaliberLogo size={28} color="#4f6878" />
              <span style={{
                fontFamily: "Outfit, sans-serif",
                fontSize: 15,
                fontWeight: 800,
                letterSpacing: "0.12em",
                color: "#C6D0D8",
                textTransform: "uppercase",
              }}>CALIBER</span>
            </div>
          </Link>

          <div style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.1em",
            color: "rgba(198,208,216,0.5)",
            textTransform: "uppercase",
            marginBottom: 16,
          }}>
            Performance Labs
          </div>

          <h2 style={{
            fontFamily: "Outfit, sans-serif",
            fontSize: 34,
            fontWeight: 800,
            color: "#fff",
            lineHeight: 1.2,
            marginBottom: 32,
          }}>
            Your stats.<br />
            Your profile.<br />
            <span style={{ color: "#C6D0D8" }}>Your future.</span>
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {PERKS.map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                  background: "rgba(198,208,216,0.08)",
                  border: "1px solid rgba(198,208,216,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={15} color="#C6D0D8" />
                </div>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ambient glow orb */}
        <div style={{
          width: 300, height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(198,208,216,0.06) 0%, transparent 70%)",
          animation: "login-glow 4s ease infinite",
          position: "absolute",
          bottom: 40,
          left: 40,
          pointerEvents: "none",
        }} />

        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
          © {new Date().getFullYear()} Caliber Performance Labs
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
      }}>
        <div style={{
          width: "100%",
          maxWidth: 420,
          animation: "login-in 0.35s ease both",
        }}>
          {/* Mobile logo */}
          <div style={{ display: "none", justifyContent: "center", marginBottom: 32 }} className="show-mobile">
            <Link href="/">
              <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <CaliberLogo size={24} color="#4f6878" />
                <span style={{ fontFamily: "Outfit, sans-serif", fontSize: 14, fontWeight: 800, letterSpacing: "0.1em", color: "#C6D0D8", textTransform: "uppercase" }}>CALIBER</span>
              </div>
            </Link>
          </div>

          <h1 style={{
            fontFamily: "Outfit, sans-serif",
            fontSize: 26,
            fontWeight: 800,
            color: "#fff",
            marginBottom: 6,
          }}>
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 32 }}>
            {mode === "login"
              ? "Sign in to access your Caliber profile"
              : "Free to start — no credit card required"}
          </p>

          {/* Mode toggle */}
          <div style={{
            display: "flex",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            padding: 4,
            marginBottom: 28,
          }}>
            {(["login", "register"] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  borderRadius: 7,
                  border: "none",
                  background: mode === m ? "rgba(255,255,255,0.09)" : "transparent",
                  color: mode === m ? "#fff" : "rgba(255,255,255,0.35)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {mode === "register" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>First name</label>
                  <input
                    className="login-input"
                    style={inputStyle}
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="First"
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Last name</label>
                  <input
                    className="login-input"
                    style={inputStyle}
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Last"
                    required
                  />
                </div>
              </div>
            )}

            {mode === "register" && (
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Date of Birth</label>
                <input
                  className="login-input"
                  style={{ ...inputStyle, colorScheme: "dark" }}
                  type="date"
                  value={dateOfBirth}
                  onChange={e => setDateOfBirth(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
            )}

            {under13Warning && (
              <div style={{
                padding: "10px 14px",
                borderRadius: 8,
                background: "rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.25)",
                fontSize: 13,
                color: "#f59e0b",
                marginBottom: 16,
                lineHeight: 1.5,
              }}>
                Players under 13 require a parent or guardian to create their account.
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email</label>
              <input
                className="login-input"
                style={inputStyle}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Password</label>
              <input
                className="login-input"
                style={inputStyle}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div style={{
                padding: "10px 14px",
                borderRadius: 8,
                background: "rgba(224,36,36,0.1)",
                border: "1px solid rgba(224,36,36,0.25)",
                fontSize: 13,
                color: "#f87171",
                marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={mutation.isPending || under13Warning}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                padding: "13px 0",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg, #4f6878 0%, #3d5262 100%)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                fontFamily: "Outfit, sans-serif",
                letterSpacing: "0.03em",
                cursor: mutation.isPending || under13Warning ? "not-allowed" : "pointer",
                opacity: mutation.isPending || under13Warning ? 0.7 : 1,
                boxShadow: "0 0 20px rgba(198,208,216,0.15)",
                transition: "all 0.2s",
              }}
            >
              {mutation.isPending
                ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                : <ArrowRight size={16} />}
              {mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: 20 }}>
            By continuing you agree to our{" "}
            <Link href="/terms">
              <a style={{ color: "rgba(198,208,216,0.6)", textDecoration: "none" }}>Terms</a>
            </Link>
            {" "}and{" "}
            <Link href="/privacy">
              <a style={{ color: "rgba(198,208,216,0.6)", textDecoration: "none" }}>Privacy Policy</a>
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
