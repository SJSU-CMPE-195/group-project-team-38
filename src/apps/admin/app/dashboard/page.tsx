"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../api/convex/_generated/api";
import { loadAuth, clearAuth, type AuthUser } from "../../lib/auth";

// ─── Risk badge ───────────────────────────────────────────────────────────────
function RiskBadge({ level }: { level: "safe" | "warning" | "danger" }) {
  const map = {
    safe:    { label: "SAFE",    color: "var(--safe)",   bg: "var(--safe-bg)" },
    warning: { label: "WARN",    color: "var(--warn)",   bg: "var(--warn-bg)" },
    danger:  { label: "DANGER",  color: "var(--danger)", bg: "var(--danger-bg)" },
  };
  const { label, color, bg } = map[level] ?? map.safe;
  return (
    <span style={{
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: "0.1em",
      padding: "3px 8px",
      borderRadius: 4,
      color,
      background: bg,
      border: `1px solid ${color}`,
    }}>
      {label}
    </span>
  );
}

// ─── Timestamp formatter ──────────────────────────────────────────────────────
function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
}
function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short", day: "numeric",
  });
}

// ─── Scan log row ─────────────────────────────────────────────────────────────
function ScanRow({ log }: { log: any }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr
        style={{ borderBottom: "1px solid var(--border)", cursor: "pointer" }}
        onClick={() => setOpen((v) => !v)}
      >
        <td style={td}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-dim)" }}>
            {formatDate(log.scannedAt)}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text)" }}>
            {formatTime(log.scannedAt)}
          </div>
        </td>
        <td style={td}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-bright)" }}>{log.patientName}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-dim)" }}>{log.wristbandUid}</div>
        </td>
        <td style={td}>
          <span style={{ fontSize: 13, color: "var(--text)" }}>{log.nurseName}</span>
        </td>
        <td style={td}>
          <RiskBadge level={log.riskLevel} />
        </td>
        <td style={{ ...td, color: "var(--text-dim)", fontSize: 12 }}>
          {log.conflicts.length === 0
            ? <span style={{ color: "var(--safe)", fontSize: 12 }}>No conflicts</span>
            : <span style={{ color: "var(--danger)", fontSize: 12 }}>{log.conflicts.length} conflict{log.conflicts.length > 1 ? "s" : ""}</span>
          }
        </td>
        <td style={{ ...td, color: "var(--muted)", fontSize: 18, textAlign: "center" }}>
          {open ? "▲" : "▼"}
        </td>
      </tr>
      {open && (
        <tr style={{ background: "var(--navy-light)" }}>
          <td colSpan={6} style={{ padding: "12px 16px" }}>
            {log.conflicts.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
                  Conflicts
                </div>
                {log.conflicts.map((c: string, i: number) => (
                  <div key={i} style={{
                    fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--danger)",
                    background: "var(--danger-bg)", padding: "6px 10px", borderRadius: 4,
                    marginBottom: 4, borderLeft: "3px solid var(--danger)",
                  }}>
                    {c}
                  </div>
                ))}
              </div>
            )}
            {log.aiExplanation && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
                  AI Summary
                </div>
                <div style={{
                  fontSize: 13, color: "var(--text)", lineHeight: 1.6,
                  background: "var(--accent-dim)", padding: "10px 14px",
                  borderRadius: 6, borderLeft: "3px solid var(--accent)",
                }}>
                  {log.aiExplanation}
                </div>
              </div>
            )}
            {!log.aiExplanation && log.conflicts.length === 0 && (
              <span style={{ fontSize: 12, color: "var(--text-dim)" }}>No additional details.</span>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const logoutMutation = useMutation(api.auth.logout);

  useEffect(() => {
    const { token: t, user: u } = loadAuth();
    if (!t) { router.replace("/login"); return; }
    setToken(t);
    setUser(u);
  }, [router]);

  const logs = useQuery(
    api.scanLogs.listAll,
    token ? { token, limit: 50 } : "skip"
  );

  async function handleLogout() {
    if (token) await logoutMutation({ token }).catch(() => {});
    clearAuth();
    router.replace("/login");
  }

  if (!token) return null;

  const dangerCount = logs?.filter((l: any) => l.riskLevel === "danger").length ?? 0;
  const warnCount   = logs?.filter((l: any) => l.riskLevel === "warning").length ?? 0;
  const safeCount   = logs?.filter((l: any) => l.riskLevel === "safe").length ?? 0;

  return (
    <div style={styles.shell}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>MediTag</div>
        <nav style={styles.nav}>
          <div style={{ ...styles.navItem, ...styles.navActive }}>
            <span>⬡</span> Scan Logs
          </div>
          <div style={{ ...styles.navItem, color: "var(--muted)", cursor: "not-allowed" }}>
            <span>◻</span> Patients
          </div>
          <div style={{ ...styles.navItem, color: "var(--muted)", cursor: "not-allowed" }}>
            <span>◻</span> Wristbands
          </div>
        </nav>
        <div style={styles.sidebarFooter}>
          <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>{user?.email}</div>
          <button style={styles.logoutBtn} onClick={handleLogout}>Sign out</button>
        </div>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.h1}>Scan Logs</h1>
            <p style={styles.headerSub}>Live feed · updates in real-time</p>
          </div>
          <div style={styles.liveChip}>
            <span style={styles.liveDot} />
            LIVE
          </div>
        </div>

        {/* Stats row */}
        <div style={styles.statsRow}>
          {[
            { label: "Total Scans", value: logs?.length ?? "—", color: "var(--text-bright)" },
            { label: "Danger",      value: dangerCount,          color: "var(--danger)" },
            { label: "Warning",     value: warnCount,            color: "var(--warn)" },
            { label: "Safe",        value: safeCount,            color: "var(--safe)" },
          ].map(({ label, value, color }) => (
            <div key={label} style={styles.statCard}>
              <span style={{ ...styles.statValue, color }}>{value}</span>
              <span style={styles.statLabel}>{label}</span>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={styles.tableWrap}>
          {logs === undefined ? (
            <div style={styles.empty}>Loading…</div>
          ) : logs.length === 0 ? (
            <div style={styles.empty}>No scans yet. Scan a wristband from the mobile app to see results here.</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)" }}>
                  {["Time", "Patient", "Nurse", "Risk", "Conflicts", ""].map((h) => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any) => <ScanRow key={log._id} log={log} />)}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const td: React.CSSProperties = { padding: "12px 16px", verticalAlign: "middle" };
const th: React.CSSProperties = {
  padding: "10px 16px", textAlign: "left", fontSize: 11,
  fontWeight: 600, color: "var(--text-dim)", letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const styles: Record<string, React.CSSProperties> = {
  shell: { display: "flex", height: "100vh", overflow: "hidden" },
  sidebar: {
    width: 220, background: "var(--navy-mid)", borderRight: "1px solid var(--border)",
    display: "flex", flexDirection: "column", padding: "24px 0",
    flexShrink: 0,
  },
  logo: {
    fontSize: 20, fontWeight: 700, color: "var(--text-bright)",
    letterSpacing: "-0.5px", padding: "0 20px 24px",
    borderBottom: "1px solid var(--border)",
  },
  nav: { flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 },
  navItem: {
    padding: "9px 12px", borderRadius: 6, fontSize: 13, fontWeight: 500,
    color: "var(--text-dim)", display: "flex", gap: 10, alignItems: "center",
    cursor: "pointer",
  },
  navActive: {
    background: "var(--navy-light)", color: "var(--text-bright)",
    border: "1px solid var(--border)",
  },
  sidebarFooter: {
    padding: "16px 20px", borderTop: "1px solid var(--border)",
    display: "flex", flexDirection: "column", gap: 4,
  },
  logoutBtn: {
    marginTop: 10, background: "transparent", border: "1px solid var(--border)",
    borderRadius: 6, padding: "7px 0", color: "var(--text-dim)",
    fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)",
  },
  main: { flex: 1, overflow: "auto", padding: "32px 36px", display: "flex", flexDirection: "column", gap: 24 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  h1: { fontSize: 26, fontWeight: 700, color: "var(--text-bright)", letterSpacing: "-0.5px" },
  headerSub: { fontSize: 13, color: "var(--text-dim)", marginTop: 4 },
  liveChip: {
    display: "flex", alignItems: "center", gap: 7,
    fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600,
    color: "var(--safe)", background: "var(--safe-bg)",
    border: "1px solid var(--safe)", borderRadius: 4, padding: "5px 10px",
    letterSpacing: "0.1em",
  },
  liveDot: {
    width: 7, height: 7, borderRadius: "50%", background: "var(--safe)",
    display: "inline-block",
    boxShadow: "0 0 0 3px rgba(16,185,129,0.25)",
    animation: "pulse 2s infinite",
  },
  statsRow: { display: "flex", gap: 16 },
  statCard: {
    flex: 1, background: "var(--navy-mid)", border: "1px solid var(--border)",
    borderRadius: 10, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 4,
  },
  statValue: { fontSize: 32, fontWeight: 700, fontFamily: "var(--font-mono)", letterSpacing: "-1px" },
  statLabel: { fontSize: 11, color: "var(--text-dim)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" },
  tableWrap: {
    background: "var(--navy-mid)", border: "1px solid var(--border)",
    borderRadius: 10, overflow: "hidden", flex: 1,
  },
  table: { width: "100%", borderCollapse: "collapse" },
  empty: { padding: "48px 24px", textAlign: "center", color: "var(--text-dim)", fontSize: 14 },
};
