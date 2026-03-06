"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../api/convex/_generated/api";
import { saveAuth, loadAuth } from "../../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const loginMutation = useMutation(api.auth.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  // If already logged in, go straight to dashboard
  useEffect(() => {
    const { token } = loadAuth();
    if (token) router.replace("/dashboard");
    else setChecking(false);
  }, [router]);

  async function handleLogin() {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);
    try {
      const data = await loginMutation({ email: email.trim(), password });

      if (data.nurse.role !== "admin") {
        setError("Access denied: admin accounts only.");
        return;
      }

      saveAuth(data.token, {
        id: data.nurse.id,
        name: data.nurse.name,
        email: data.nurse.email,
        role: data.nurse.role,
      });
      router.replace("/dashboard");
    } catch (e: any) {
      setError(e?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  if (checking) return null;

  return (
    <div style={styles.page}>
      {/* Left panel — branding */}
      <div style={styles.left}>
        <div style={styles.tagline}>
          <span style={styles.wordmark}>MediTag</span>
          <span style={styles.sub}>Medication Safety Platform</span>
          <div style={styles.pillRow}>
            {["Real-time sync", "AI-assisted", "Wristband scan"].map((t) => (
              <span key={t} style={styles.pill}>{t}</span>
            ))}
          </div>
        </div>
        <div style={styles.grid} aria-hidden="true" />
      </div>

      {/* Right panel — login form */}
      <div style={styles.right}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Admin Portal</span>
            <span style={styles.cardSub}>Sign in to continue</span>
          </div>

          <div style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email</label>
              <input
                style={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@meditag.dev"
                type="email"
                autoComplete="email"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Password</label>
              <input
                style={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                autoComplete="current-password"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}

            <button
              style={{ ...styles.btn, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </div>

          <p style={styles.hint}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
              admin@meditag.dev / admin123
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
  },
  left: {
    flex: 1,
    background: "var(--navy-mid)",
    borderRight: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  grid: {
    position: "absolute",
    inset: 0,
    backgroundImage: `
      linear-gradient(var(--border) 1px, transparent 1px),
      linear-gradient(90deg, var(--border) 1px, transparent 1px)
    `,
    backgroundSize: "40px 40px",
    opacity: 0.4,
    pointerEvents: "none",
  },
  tagline: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  wordmark: {
    fontSize: 52,
    fontWeight: 700,
    color: "var(--text-bright)",
    letterSpacing: "-2px",
    lineHeight: 1,
  },
  sub: {
    fontSize: 16,
    color: "var(--text-dim)",
    fontWeight: 400,
    letterSpacing: "0.02em",
  },
  pillRow: {
    display: "flex",
    gap: 8,
    marginTop: 8,
    flexWrap: "wrap",
  },
  pill: {
    fontSize: 11,
    fontFamily: "var(--font-mono)",
    padding: "4px 10px",
    borderRadius: 4,
    background: "var(--accent-dim)",
    color: "var(--accent)",
    border: "1px solid var(--accent-dim)",
    letterSpacing: "0.05em",
  },
  right: {
    width: 420,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    background: "var(--navy)",
  },
  card: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 28,
  },
  cardHeader: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "var(--text-bright)",
    letterSpacing: "-0.5px",
  },
  cardSub: {
    fontSize: 14,
    color: "var(--text-dim)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-dim)",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  input: {
    background: "var(--navy-light)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "11px 14px",
    fontSize: 14,
    color: "var(--text-bright)",
    outline: "none",
    transition: "border-color 0.15s",
  },
  errorBox: {
    background: "var(--danger-bg)",
    border: "1px solid var(--danger)",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    color: "var(--danger)",
  },
  btn: {
    background: "var(--accent)",
    border: "none",
    borderRadius: 8,
    padding: "13px",
    fontSize: 14,
    fontWeight: 600,
    color: "#fff",
    marginTop: 4,
    transition: "opacity 0.15s",
  },
  hint: {
    textAlign: "center",
    color: "var(--muted)",
    fontSize: 12,
  },
};
