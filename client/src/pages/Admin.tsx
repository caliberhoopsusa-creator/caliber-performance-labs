import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Lock, Users, BarChart3, MessageSquare, GraduationCap,
  CheckCircle, XCircle, Loader2, Search, Trash2, ShieldCheck,
  ShieldOff, UserCog, Globe, Activity, TrendingUp, Gamepad2,
  ChevronRight, RefreshCw, Crown, Award, Eye, Calendar,
  UserCheck, AlertTriangle, LogOut, ChevronDown, Filter,
  Star, Hash, Zap,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart,
} from "recharts";

// ─── Design tokens ──────────────────────────────────────────────────────────
const T = {
  bg: "#07090f",
  surface: "#0e1117",
  surfaceHover: "#141924",
  border: "rgba(198,208,216,0.08)",
  borderHover: "rgba(198,208,216,0.18)",
  platinum: "#C6D0D8",
  platinumDim: "#7d8a93",
  red: "#e02424",
  redDim: "rgba(224,36,36,0.15)",
  green: "#10b981",
  greenDim: "rgba(16,185,129,0.12)",
  amber: "#f59e0b",
  amberDim: "rgba(245,158,11,0.12)",
  blue: "#3b82f6",
  blueDim: "rgba(59,130,246,0.12)",
  text: "#e8eef2",
  textMuted: "#5a6570",
};

// ─── Font injection ──────────────────────────────────────────────────────────
function AdminFonts() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Barlow:wght@400;500;600&display=swap');
      .admin-root * { box-sizing: border-box; }
      .admin-root { font-family: 'Barlow', sans-serif; color: ${T.text}; background: ${T.bg}; }
      .admin-heading { font-family: 'Barlow Condensed', sans-serif; }
      .admin-mono { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
      .admin-scan {
        background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(198,208,216,0.01) 2px, rgba(198,208,216,0.01) 4px);
      }
      @keyframes admin-pulse { 0%,100%{opacity:.6} 50%{opacity:1} }
      @keyframes admin-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
      .admin-animate-in { animation: admin-in 0.3s ease both; }
      .admin-live { animation: admin-pulse 2s ease infinite; }
      .admin-stat-card:hover { border-color: ${T.borderHover} !important; background: ${T.surfaceHover} !important; }
      .admin-row:hover { background: ${T.surfaceHover} !important; }
      .admin-nav-item { transition: all 0.15s ease; }
      .admin-nav-item:hover { background: rgba(198,208,216,0.06) !important; color: ${T.platinum} !important; }
      .admin-nav-item.active { background: rgba(198,208,216,0.1) !important; color: ${T.platinum} !important; border-left-color: ${T.platinum} !important; }
    `}</style>
  );
}

// ─── Auth helpers ────────────────────────────────────────────────────────────
// All admin API calls go to the dedicated admin port (localhost only).
// In production, this port is never exposed publicly — access via SSH tunnel.
const ADMIN_API = (import.meta.env.VITE_ADMIN_API_URL as string | undefined) ?? "";

const KEY = "caliber_admin_pw";
const getPw = () => localStorage.getItem(KEY);
const setPw = (p: string) => localStorage.setItem(KEY, p);
const clearPw = () => localStorage.removeItem(KEY);

async function adminFetch(path: string, opts: RequestInit = {}): Promise<Response> {
  const pw = getPw();
  const headers: Record<string, string> = { ...(opts.headers as any || {}) };
  if (pw) headers["x-admin-password"] = pw;
  if (opts.body && typeof opts.body === "string") headers["Content-Type"] = "application/json";
  const res = await fetch(ADMIN_API + path, { ...opts, headers });
  if (!res.ok) { const t = await res.text(); throw new Error(t || res.statusText); }
  return res;
}

// ─── Login gate ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pw, setPwState] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErr("");
    try {
      const res = await fetch(ADMIN_API + "/api/admin/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Invalid"); }
      setPw(pw); onLogin();
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="admin-root admin-scan" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <AdminFonts />
      <div style={{ width: 380, animation: "admin-in 0.4s ease both" }}>
        {/* Logo mark */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 56, height: 56, borderRadius: 12,
            border: `1px solid ${T.border}`, background: T.surface, marginBottom: 16,
          }}>
            <Lock size={22} color={T.platinum} />
          </div>
          <div className="admin-heading" style={{ fontSize: 28, fontWeight: 800, letterSpacing: "0.08em", color: T.text }}>
            CALIBER ADMIN
          </div>
          <div style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>Command Center · Restricted Access</div>
        </div>

        <form onSubmit={submit} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "28px 24px" }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: T.platinumDim, textTransform: "uppercase", marginBottom: 8 }}>
            Admin Password
          </label>
          <input
            type="password" value={pw} onChange={e => setPwState(e.target.value)}
            placeholder="Enter password"
            style={{
              display: "block", width: "100%", padding: "10px 14px",
              background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8,
              color: T.text, fontSize: 14, outline: "none", marginBottom: 16,
            }}
          />
          {err && <div style={{ color: T.red, fontSize: 13, marginBottom: 12 }}>{err}</div>}
          <button type="submit" disabled={loading} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", padding: "11px 0",
            background: T.platinum, color: "#07090f", border: "none", borderRadius: 8,
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700,
            letterSpacing: "0.06em", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
          }}>
            {loading && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
            AUTHENTICATE
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────
type NavSection = "overview" | "approvals" | "users" | "content" | "colleges" | "guardians" | "seasons";

interface Analytics {
  users: { total: number; byRole: Record<string,number>; new7d: number; new30d: number };
  games: { total: number; thisWeek: number; avgPoints: number };
  engagement: { active7d: number; fivePlusGames: number };
  recruiting: { totalRecruiters: number; verifiedRecruiters: number; pendingRecruiters: number };
  feed: { totalPosts: number };
  guardians: { totalLinks: number; pending: number };
  weeklyGrowth: Array<{ week: string; newUsers: number; newGames: number }>;
  topPerformers: Array<{ playerId: number; playerName: string; totalGames: number }>;
  seasons?: any[];
}

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, accent = T.platinum, badge }: {
  label: string; value: string | number; sub?: string;
  icon: any; accent?: string; badge?: { text: string; color: string };
}) {
  return (
    <div className="admin-stat-card" style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10,
      padding: "18px 20px", transition: "all 0.2s ease", cursor: "default",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ padding: 8, borderRadius: 8, background: `${accent}15`, display: "inline-flex" }}>
          <Icon size={16} color={accent} />
        </div>
        {badge && (
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
            padding: "3px 7px", borderRadius: 4, background: badge.color + "20", color: badge.color,
          }}>{badge.text}</span>
        )}
      </div>
      <div className="admin-mono" style={{ fontSize: 28, fontWeight: 600, color: T.text, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: T.textMuted, marginTop: 6, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: accent, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── Section header ──────────────────────────────────────────────────────────
function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20 }}>
      <div>
        <div className="admin-heading" style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.04em", color: T.text }}>{title}</div>
        {sub && <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

// ─── Badge ───────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: "verified" | "pending" | "rejected" | "active" | string }) {
  const map: Record<string, { color: string; label: string }> = {
    verified: { color: T.green, label: "Verified" },
    active:   { color: T.green, label: "Active" },
    pending:  { color: T.amber, label: "Pending" },
    rejected: { color: T.red,   label: "Rejected" },
    false:    { color: T.amber, label: "Pending" },
    true:     { color: T.green, label: "Verified" },
  };
  const d = map[status] ?? { color: T.platinumDim, label: status };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
      padding: "3px 8px", borderRadius: 4, background: d.color + "20", color: d.color,
    }}>{d.label}</span>
  );
}

// ─── Table wrapper ───────────────────────────────────────────────────────────
function AdminTable({ headers, children, empty }: {
  headers: string[]; children: React.ReactNode; empty?: boolean;
}) {
  return (
    <div style={{ borderRadius: 10, border: `1px solid ${T.border}`, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: T.surface }}>
            {headers.map(h => (
              <th key={h} style={{
                textAlign: "left", padding: "10px 14px",
                fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                color: T.textMuted, borderBottom: `1px solid ${T.border}`,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {empty && (
        <div style={{ padding: "40px 0", textAlign: "center", color: T.textMuted, fontSize: 13 }}>
          No records found
        </div>
      )}
    </div>
  );
}

function TR({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <tr className="admin-row" style={{ borderBottom: `1px solid ${T.border}`, transition: "background 0.15s", ...style }}>
      {children}
    </tr>
  );
}

function TD({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <td className={mono ? "admin-mono" : ""} style={{ padding: "11px 14px", fontSize: 13, color: T.text, verticalAlign: "middle" }}>
      {children}
    </td>
  );
}

// ─── Action button ───────────────────────────────────────────────────────────
function ABtn({ onClick, color = T.green, icon: Icon, label, loading }: {
  onClick: () => void; color?: string; icon: any; label: string; loading?: boolean;
}) {
  return (
    <button onClick={onClick} title={label} disabled={loading} style={{
      display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px",
      border: `1px solid ${color}30`, borderRadius: 6, background: color + "12",
      color, fontSize: 11, fontWeight: 600, cursor: loading ? "wait" : "pointer",
      opacity: loading ? 0.6 : 1, transition: "all 0.15s",
    }}>
      {loading ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Icon size={12} />}
      {label}
    </button>
  );
}

// ─── Overview panel ──────────────────────────────────────────────────────────
function OverviewPanel() {
  const { data: stats, isLoading } = useQuery<Analytics>({
    queryKey: ["/api/admin/analytics"],
    queryFn: async () => (await adminFetch("/api/admin/analytics")).json(),
    refetchInterval: 60_000,
  });

  if (isLoading) return <LoadingSpinner />;
  if (!stats) return null;

  const growth = (stats.weeklyGrowth || []).map((r, i) => ({
    ...r,
    label: `W${i + 1}`,
  }));

  return (
    <div className="admin-animate-in">
      <SectionHeader
        title="Platform Overview"
        sub="Live metrics · refreshes every 60s"
        action={
          <div className="admin-live" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.green }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: T.green }} />
            Live
          </div>
        }
      />

      {/* KPI grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 12, marginBottom: 28 }}>
        <StatCard label="Total Users" value={stats.users.total.toLocaleString()} icon={Users}
          sub={`+${stats.users.new7d} this week`} badge={{ text: "users", color: T.platinum }} />
        <StatCard label="Total Games" value={stats.games.total.toLocaleString()} icon={Gamepad2}
          accent={T.blue} sub={`${stats.games.thisWeek} this week`} />
        <StatCard label="Active Players (7d)" value={stats.engagement.active7d} icon={Activity}
          accent={T.green} sub={`${stats.engagement.fivePlusGames} with 5+ games`} />
        <StatCard label="Pending Approvals" value={stats.recruiting.pendingRecruiters + stats.guardians.pending}
          icon={AlertTriangle} accent={T.amber}
          sub={`${stats.recruiting.pendingRecruiters} recruiter · ${stats.guardians.pending} guardian`} />
        <StatCard label="Feed Posts" value={stats.feed.totalPosts.toLocaleString()} icon={MessageSquare} accent={T.platinumDim} />
        <StatCard label="Avg Points/Game" value={stats.games.avgPoints} icon={Star} accent={T.platinum}
          sub="basketball" />
      </div>

      {/* Role breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
          <div className="admin-heading" style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.05em", color: T.platinumDim, textTransform: "uppercase", marginBottom: 16 }}>
            User Roles
          </div>
          {Object.entries(stats.users.byRole).map(([role, count]) => {
            const pct = stats.users.total ? Math.round((count / stats.users.total) * 100) : 0;
            const colors: Record<string,string> = { player: T.platinum, coach: T.blue, recruiter: T.green, guardian: T.amber };
            const c = colors[role] ?? T.platinumDim;
            return (
              <div key={role} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 13, textTransform: "capitalize" }}>{role}</span>
                  <span className="admin-mono" style={{ fontSize: 13, color: c }}>{count.toLocaleString()}</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: `${c}20` }}>
                  <div style={{ height: "100%", width: `${pct}%`, borderRadius: 2, background: c, transition: "width 0.6s ease" }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Top performers */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
          <div className="admin-heading" style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.05em", color: T.platinumDim, textTransform: "uppercase", marginBottom: 16 }}>
            Top Players by Games
          </div>
          {(stats.topPerformers || []).map((p, i) => (
            <div key={p.playerId} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div className="admin-mono" style={{ width: 20, textAlign: "right", fontSize: 12, color: T.textMuted }}>#{i + 1}</div>
              <div style={{ flex: 1, fontSize: 13 }}>{p.playerName}</div>
              <div className="admin-mono" style={{ fontSize: 13, color: T.platinum }}>{p.totalGames}g</div>
            </div>
          ))}
          {!stats.topPerformers?.length && <div style={{ fontSize: 13, color: T.textMuted }}>No data yet</div>}
        </div>
      </div>

      {/* Growth chart */}
      {growth.length > 0 && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
          <div className="admin-heading" style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.05em", color: T.platinumDim, textTransform: "uppercase", marginBottom: 16 }}>
            8-Week Growth
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={growth} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.platinum} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={T.platinum} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradGames" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.blue} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={T.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="label" stroke={T.textMuted} tick={{ fontSize: 11 }} />
              <YAxis stroke={T.textMuted} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="newUsers" stroke={T.platinum} strokeWidth={2} fill="url(#gradUsers)" name="New Users" />
              <Area type="monotone" dataKey="newGames" stroke={T.blue} strokeWidth={2} fill="url(#gradGames)" name="New Games" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ─── Approvals panel ─────────────────────────────────────────────────────────
function ApprovalsPanel() {
  const { toast } = useToast();

  const { data: recruiterData, isLoading: rLoading, refetch: rRefetch } = useQuery<{ recruiters: any[] }>({
    queryKey: ["/api/admin/recruiters"],
    queryFn: async () => (await adminFetch("/api/admin/recruiters")).json(),
  });

  const { data: coachData, isLoading: cLoading, refetch: cRefetch } = useQuery<{ coaches: any[] }>({
    queryKey: ["/api/admin/coaches"],
    queryFn: async () => (await adminFetch("/api/admin/coaches")).json(),
  });

  const verifyRecruiter = useMutation({
    mutationFn: async ({ id, verified }: { id: number; verified: boolean }) => {
      const res = await adminFetch(`/api/admin/recruiters/${id}/verify`, {
        method: "PATCH", body: JSON.stringify({ verified }),
      });
      return res.json();
    },
    onSuccess: (_, { verified }) => {
      toast({ title: verified ? "Recruiter verified" : "Recruiter rejected" });
      rRefetch();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const verifyCoach = useMutation({
    mutationFn: async ({ id, verified }: { id: string; verified: boolean }) => {
      const res = await adminFetch(`/api/admin/coaches/${id}/verify`, {
        method: "PATCH", body: JSON.stringify({ verified }),
      });
      return res.json();
    },
    onSuccess: (_, { verified }) => {
      toast({ title: verified ? "Coach approved" : "Coach rejected" });
      cRefetch();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const pending = (recruiterData?.recruiters || []).filter(r => !r.isVerified);
  const verified = (recruiterData?.recruiters || []).filter(r => r.isVerified);
  const pendingCoaches = (coachData?.coaches || []).filter(c => !c.coachVerified);
  const approvedCoaches = (coachData?.coaches || []).filter(c => c.coachVerified);

  return (
    <div className="admin-animate-in">
      <SectionHeader
        title="Approvals Queue"
        sub="Review and approve coaches and recruiters"
        action={
          <div style={{ display: "flex", gap: 8 }}>
            {(pending.length + pendingCoaches.length) > 0 && (
              <span style={{
                padding: "4px 12px", borderRadius: 6, background: T.amberDim, border: `1px solid ${T.amber}40`,
                color: T.amber, fontSize: 12, fontWeight: 600,
              }}>
                {pending.length + pendingCoaches.length} pending
              </span>
            )}
          </div>
        }
      />

      {/* Coach approvals */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Crown size={15} color={T.blue} />
          <span className="admin-heading" style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.04em" }}>Coaches</span>
          <span className="admin-mono" style={{ fontSize: 12, color: T.amber }}>{pendingCoaches.length} pending</span>
        </div>

        {cLoading ? <LoadingSpinner /> : (
          <AdminTable
            headers={["Name", "Email", "Joined", "Status", "Actions"]}
            empty={!coachData?.coaches?.length}
          >
            {(coachData?.coaches || []).map((coach: any) => (
              <TR key={coach.id}>
                <TD>{[coach.firstName, coach.lastName].filter(Boolean).join(" ") || "—"}</TD>
                <TD mono>{coach.email || "—"}</TD>
                <TD mono>{coach.createdAt ? new Date(coach.createdAt).toLocaleDateString() : "—"}</TD>
                <TD><StatusBadge status={coach.coachVerified ? "verified" : "pending"} /></TD>
                <TD>
                  <div style={{ display: "flex", gap: 6 }}>
                    {!coach.coachVerified ? (
                      <ABtn onClick={() => verifyCoach.mutate({ id: coach.id, verified: true })}
                        icon={ShieldCheck} label="Approve" loading={verifyCoach.isPending} />
                    ) : (
                      <ABtn onClick={() => verifyCoach.mutate({ id: coach.id, verified: false })}
                        icon={ShieldOff} label="Revoke" color={T.red} loading={verifyCoach.isPending} />
                    )}
                  </div>
                </TD>
              </TR>
            ))}
          </AdminTable>
        )}
      </div>

      {/* Recruiter approvals */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Globe size={15} color={T.green} />
          <span className="admin-heading" style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.04em" }}>Recruiters</span>
          <span className="admin-mono" style={{ fontSize: 12, color: T.amber }}>{pending.length} pending</span>
        </div>

        {rLoading ? <LoadingSpinner /> : (
          <AdminTable
            headers={["Name / Org", "Email", "Role", "Joined", "Status", "Actions"]}
            empty={!recruiterData?.recruiters?.length}
          >
            {(recruiterData?.recruiters || []).map((r: any) => (
              <TR key={r.id}>
                <TD>
                  <div style={{ fontWeight: 500 }}>{r.name || "—"}</div>
                  {r.organization && <div style={{ fontSize: 11, color: T.textMuted }}>{r.organization}</div>}
                </TD>
                <TD mono>{r.email || "—"}</TD>
                <TD><span style={{ fontSize: 12, color: T.platinumDim }}>{r.recruiterType || "—"}</span></TD>
                <TD mono>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}</TD>
                <TD><StatusBadge status={r.isVerified ? "verified" : "pending"} /></TD>
                <TD>
                  <div style={{ display: "flex", gap: 6 }}>
                    {!r.isVerified ? (
                      <ABtn onClick={() => verifyRecruiter.mutate({ id: r.id, verified: true })}
                        icon={ShieldCheck} label="Verify" loading={verifyRecruiter.isPending} />
                    ) : (
                      <ABtn onClick={() => verifyRecruiter.mutate({ id: r.id, verified: false })}
                        icon={ShieldOff} label="Revoke" color={T.red} loading={verifyRecruiter.isPending} />
                    )}
                  </div>
                </TD>
              </TR>
            ))}
          </AdminTable>
        )}
      </div>
    </div>
  );
}

// ─── Users panel ──────────────────────────────────────────────────────────────
function UsersPanel() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const { data, isLoading, refetch } = useQuery<{ users: any[] }>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => (await adminFetch("/api/admin/users")).json(),
  });

  const changeRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const res = await adminFetch(`/api/admin/users/${id}/role`, {
        method: "PATCH", body: JSON.stringify({ role }),
      });
      return res.json();
    },
    onSuccess: () => { toast({ title: "Role updated" }); refetch(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const giveCoins = useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: number }) => {
      const res = await adminFetch("/api/admin/give-coins", {
        method: "POST", body: JSON.stringify({ userId, amount, reason: "Admin grant" }),
      });
      return res.json();
    },
    onSuccess: () => { toast({ title: "Coins granted" }); refetch(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = (data?.users || []).filter(u => {
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || (u.email || "").toLowerCase().includes(q) ||
      (u.firstName || "").toLowerCase().includes(q) || (u.lastName || "").toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  const roles = ["all", "player", "coach", "recruiter", "guardian"];

  return (
    <div className="admin-animate-in">
      <SectionHeader title="User Management" sub={`${data?.users?.length ?? 0} total users`} />

      {/* Search + filter */}
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={14} color={T.textMuted} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
          <input
            placeholder="Search by email or name…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "9px 12px 9px 33px",
              background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8,
              color: T.text, fontSize: 13, outline: "none",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {roles.map(r => (
            <button key={r} onClick={() => setRoleFilter(r)} style={{
              padding: "8px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600,
              border: `1px solid ${roleFilter === r ? T.platinum + "60" : T.border}`,
              background: roleFilter === r ? T.platinum + "15" : T.surface,
              color: roleFilter === r ? T.platinum : T.textMuted,
              cursor: "pointer", textTransform: "capitalize", transition: "all 0.15s",
            }}>{r}</button>
          ))}
        </div>
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <AdminTable
          headers={["User", "Role", "Subscription", "Coins", "Joined", "Actions"]}
          empty={!filtered.length}
        >
          {filtered.slice(0, 100).map((u: any) => (
            <TR key={u.id}>
              <TD>
                <div style={{ fontWeight: 500 }}>{[u.firstName, u.lastName].filter(Boolean).join(" ") || "—"}</div>
                <div className="admin-mono" style={{ fontSize: 11, color: T.textMuted }}>{u.email}</div>
              </TD>
              <TD>
                <select
                  value={u.role || ""}
                  onChange={e => changeRole.mutate({ id: u.id, role: e.target.value })}
                  style={{
                    background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6,
                    color: T.text, fontSize: 12, padding: "4px 8px", cursor: "pointer",
                  }}
                >
                  <option value="">No role</option>
                  {["player", "coach", "recruiter", "guardian"].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </TD>
              <TD>
                {u.subscriptionStatus ? (
                  <StatusBadge status={u.subscriptionStatus === "active" ? "active" : "pending"} />
                ) : <span style={{ fontSize: 12, color: T.textMuted }}>Free</span>}
              </TD>
              <TD mono>{(u.coinBalance || 0).toLocaleString()}</TD>
              <TD mono>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</TD>
              <TD>
                <ABtn onClick={() => giveCoins.mutate({ userId: u.id, amount: 100 })}
                  icon={Zap} label="+100 coins" color={T.amber} loading={giveCoins.isPending} />
              </TD>
            </TR>
          ))}
        </AdminTable>
      )}
      {filtered.length > 100 && (
        <div style={{ fontSize: 12, color: T.textMuted, marginTop: 10, textAlign: "right" }}>
          Showing 100 of {filtered.length} — narrow the search to see more
        </div>
      )}
    </div>
  );
}

// ─── Content panel ───────────────────────────────────────────────────────────
function ContentPanel() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"posts" | "comments">("posts");

  const { data: feedData, isLoading: feedLoading, refetch: feedRefetch } = useQuery<{ posts: any[] }>({
    queryKey: ["/api/admin/feed"],
    queryFn: async () => (await adminFetch("/api/admin/feed")).json(),
  });

  const { data: commentData, isLoading: commentLoading, refetch: commentRefetch } = useQuery<{ comments: any[] }>({
    queryKey: ["/api/admin/comments"],
    queryFn: async () => (await adminFetch("/api/admin/comments")).json(),
  });

  const deletePost = useMutation({
    mutationFn: async (id: number) => (await adminFetch(`/api/admin/feed/${id}`, { method: "DELETE" })).json(),
    onSuccess: () => { toast({ title: "Post deleted" }); feedRefetch(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteComment = useMutation({
    mutationFn: async (id: number) => (await adminFetch(`/api/admin/comments/${id}`, { method: "DELETE" })).json(),
    onSuccess: () => { toast({ title: "Comment deleted" }); commentRefetch(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="admin-animate-in">
      <SectionHeader title="Content Moderation" sub="Review and remove feed posts and comments" />

      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {(["posts", "comments"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "8px 16px", borderRadius: 7, fontSize: 13, fontWeight: 600,
            border: `1px solid ${tab === t ? T.platinum + "60" : T.border}`,
            background: tab === t ? T.platinum + "15" : T.surface,
            color: tab === t ? T.platinum : T.textMuted,
            cursor: "pointer", textTransform: "capitalize", transition: "all 0.15s",
          }}>{t}</button>
        ))}
      </div>

      {tab === "posts" && (
        feedLoading ? <LoadingSpinner /> : (
          <AdminTable headers={["Player", "Type", "Headline", "Reactions", "Comments", "Date", ""]} empty={!feedData?.posts?.length}>
            {(feedData?.posts || []).map((p: any) => (
              <TR key={p.id}>
                <TD>{p.playerName}</TD>
                <TD><span style={{ fontSize: 11, color: T.platinumDim }}>{p.activityType}</span></TD>
                <TD><span style={{ maxWidth: 220, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.headline || "—"}</span></TD>
                <TD mono>{p.reactionCount}</TD>
                <TD mono>{p.commentCount}</TD>
                <TD mono>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}</TD>
                <TD>
                  <ABtn onClick={() => deletePost.mutate(p.id)} icon={Trash2} label="Delete" color={T.red} loading={deletePost.isPending} />
                </TD>
              </TR>
            ))}
          </AdminTable>
        )
      )}

      {tab === "comments" && (
        commentLoading ? <LoadingSpinner /> : (
          <AdminTable headers={["Content", "Date", ""]} empty={!commentData?.comments?.length}>
            {(commentData?.comments || []).map((c: any) => (
              <TR key={c.id}>
                <TD>
                  <span style={{ maxWidth: 400, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: T.text }}>
                    {c.content || "—"}
                  </span>
                </TD>
                <TD mono>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}</TD>
                <TD>
                  <ABtn onClick={() => deleteComment.mutate(c.id)} icon={Trash2} label="Delete" color={T.red} loading={deleteComment.isPending} />
                </TD>
              </TR>
            ))}
          </AdminTable>
        )
      )}
    </div>
  );
}

// ─── Colleges panel ──────────────────────────────────────────────────────────
function CollegesPanel() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [espnInput, setEspnInput] = useState<Record<number, string>>({});

  const { data, isLoading, refetch } = useQuery<{ colleges: any[] }>({
    queryKey: ["/api/admin/colleges/status"],
    queryFn: async () => (await adminFetch("/api/admin/colleges/status")).json(),
  });

  const linkEspn = useMutation({
    mutationFn: async ({ id, espnTeamId }: { id: number; espnTeamId: string | null }) => {
      const res = await adminFetch(`/api/admin/colleges/${id}/espn-link`, {
        method: "PATCH", body: JSON.stringify({ espnTeamId }),
      });
      return res.json();
    },
    onSuccess: () => { toast({ title: "ESPN link updated" }); refetch(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = (data?.colleges || []).filter(c =>
    !search || (c.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-animate-in">
      <SectionHeader title="College Database" sub={`${data?.colleges?.length ?? 0} colleges · ESPN sync management`} />

      <div style={{ marginBottom: 16 }}>
        <div style={{ position: "relative", maxWidth: 360 }}>
          <Search size={14} color={T.textMuted} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
          <input
            placeholder="Search colleges…" value={search} onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "9px 12px 9px 33px",
              background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8,
              color: T.text, fontSize: 13, outline: "none",
            }}
          />
        </div>
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <AdminTable headers={["College", "Division", "Conference", "Roster", "ESPN ID", ""]} empty={!filtered.length}>
          {filtered.map((c: any) => (
            <TR key={c.id}>
              <TD><span style={{ fontWeight: 500 }}>{c.name}</span></TD>
              <TD><span style={{ fontSize: 12, color: T.platinumDim }}>{c.division}</span></TD>
              <TD><span style={{ fontSize: 12, color: T.textMuted }}>{c.conference || "—"}</span></TD>
              <TD mono>{c.rosterCount}</TD>
              <TD>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    placeholder={c.espnTeamId || "ESPN ID"}
                    value={espnInput[c.id] ?? (c.espnTeamId || "")}
                    onChange={e => setEspnInput(prev => ({ ...prev, [c.id]: e.target.value }))}
                    style={{
                      width: 90, padding: "5px 8px",
                      background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6,
                      color: T.text, fontSize: 12, outline: "none",
                    }}
                  />
                  {c.espnTeamId && (
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: T.green }} title="Linked" />
                  )}
                </div>
              </TD>
              <TD>
                <ABtn
                  onClick={() => linkEspn.mutate({ id: c.id, espnTeamId: espnInput[c.id] || null })}
                  icon={RefreshCw} label="Update" loading={linkEspn.isPending}
                />
              </TD>
            </TR>
          ))}
        </AdminTable>
      )}
    </div>
  );
}

// ─── Guardians panel ─────────────────────────────────────────────────────────
function GuardiansPanel() {
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");

  const { data, isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/admin/guardian-links", filter],
    queryFn: async () => {
      const url = filter === "all" ? "/api/admin/guardian-links" : `/api/admin/guardian-links?status=${filter}`;
      return (await adminFetch(url)).json();
    },
  });

  const updateLink = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "approved" | "revoked" }) => {
      const res = await adminFetch(`/api/admin/guardian-links/${id}`, {
        method: "PATCH", body: JSON.stringify({ status }),
      });
      return res.json();
    },
    onSuccess: (_, { status }) => { toast({ title: `Guardian link ${status}` }); refetch(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const links = Array.isArray(data) ? data : [];

  return (
    <div className="admin-animate-in">
      <SectionHeader title="Guardian Links" sub="Family account connections requiring approval" />

      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {["all", "pending", "approved", "revoked"].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: "7px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600,
            border: `1px solid ${filter === s ? T.platinum + "60" : T.border}`,
            background: filter === s ? T.platinum + "15" : T.surface,
            color: filter === s ? T.platinum : T.textMuted,
            cursor: "pointer", textTransform: "capitalize", transition: "all 0.15s",
          }}>{s}</button>
        ))}
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <AdminTable headers={["Guardian", "Player", "Relationship", "Status", "Linked", "Actions"]} empty={!links.length}>
          {links.map((l: any) => (
            <TR key={l.id}>
              <TD>
                <div style={{ fontWeight: 500 }}>{l.guardianName}</div>
                <div className="admin-mono" style={{ fontSize: 11, color: T.textMuted }}>{l.guardianEmail}</div>
              </TD>
              <TD>{l.playerName}</TD>
              <TD><span style={{ fontSize: 12, color: T.platinumDim, textTransform: "capitalize" }}>{l.relationship}</span></TD>
              <TD><StatusBadge status={l.status} /></TD>
              <TD mono>{l.linkedAt ? new Date(l.linkedAt).toLocaleDateString() : "—"}</TD>
              <TD>
                <div style={{ display: "flex", gap: 6 }}>
                  {l.status === "pending" && (
                    <ABtn onClick={() => updateLink.mutate({ id: l.id, status: "approved" })}
                      icon={CheckCircle} label="Approve" loading={updateLink.isPending} />
                  )}
                  {l.status !== "revoked" && (
                    <ABtn onClick={() => updateLink.mutate({ id: l.id, status: "revoked" })}
                      icon={XCircle} label="Revoke" color={T.red} loading={updateLink.isPending} />
                  )}
                </div>
              </TD>
            </TR>
          ))}
        </AdminTable>
      )}
    </div>
  );
}

// ─── Seasons panel ───────────────────────────────────────────────────────────
function SeasonsPanel() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", sport: "basketball", startDate: "", endDate: "", isCurrent: false });
  const [creating, setCreating] = useState(false);

  const { data: analyticsData } = useQuery<Analytics>({
    queryKey: ["/api/admin/analytics"],
    queryFn: async () => (await adminFetch("/api/admin/analytics")).json(),
  });

  const seasons = analyticsData?.seasons;

  const createSeason = useMutation({
    mutationFn: async () => {
      const res = await adminFetch("/api/admin/seasons", {
        method: "POST", body: JSON.stringify(form),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Season created" });
      setForm({ name: "", sport: "basketball", startDate: "", endDate: "", isCurrent: false });
      setCreating(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const field = (label: string, key: keyof typeof form, type = "text") => (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: T.platinumDim, textTransform: "uppercase", marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type} value={form[key] as string}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        style={{
          display: "block", width: "100%", padding: "9px 12px",
          background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8,
          color: T.text, fontSize: 13, outline: "none",
        }}
      />
    </div>
  );

  return (
    <div className="admin-animate-in">
      <SectionHeader
        title="Season Management"
        sub="Define and activate basketball seasons"
        action={
          <button onClick={() => setCreating(c => !c)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
            background: T.platinum, color: T.bg, border: "none", borderRadius: 8,
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700,
            letterSpacing: "0.06em", cursor: "pointer",
          }}>
            {creating ? "Cancel" : "+ New Season"}
          </button>
        }
      />

      {creating && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 24, marginBottom: 24 }}>
          <div className="admin-heading" style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>New Season</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
            {field("Season Name", "name")}
            {field("Start Date", "startDate", "date")}
            {field("End Date", "endDate", "date")}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <input
              type="checkbox" id="isCurrent" checked={form.isCurrent}
              onChange={e => setForm(p => ({ ...p, isCurrent: e.target.checked }))}
              style={{ accentColor: T.platinum, width: 15, height: 15 }}
            />
            <label htmlFor="isCurrent" style={{ fontSize: 13, cursor: "pointer" }}>Set as current season</label>
          </div>
          <button onClick={() => createSeason.mutate()} disabled={createSeason.isPending} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "9px 20px",
            background: T.platinum, color: T.bg, border: "none", borderRadius: 8,
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700,
            cursor: createSeason.isPending ? "wait" : "pointer", opacity: createSeason.isPending ? 0.7 : 1,
          }}>
            {createSeason.isPending && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
            Create Season
          </button>
        </div>
      )}

      <AdminTable headers={["Season", "Sport", "Dates", "Games", "Status"]} empty={!seasons?.length}>
        {(seasons || []).map((s: any) => (
          <TR key={s.id}>
            <TD><span style={{ fontWeight: 500 }}>{s.name}</span></TD>
            <TD><span style={{ fontSize: 12, textTransform: "capitalize" }}>{s.sport}</span></TD>
            <TD mono>
              <span style={{ fontSize: 12 }}>
                {s.start_date ? new Date(s.start_date).toLocaleDateString() : "—"} →{" "}
                {s.end_date ? new Date(s.end_date).toLocaleDateString() : "—"}
              </span>
            </TD>
            <TD mono>{s.game_count ?? 0}</TD>
            <TD>
              {s.is_current
                ? <StatusBadge status="active" />
                : <span style={{ fontSize: 12, color: T.textMuted }}>Past</span>}
            </TD>
          </TR>
        ))}
      </AdminTable>
    </div>
  );
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
function LoadingSpinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 0", gap: 10 }}>
      <Loader2 size={18} color={T.platinumDim} style={{ animation: "spin 1s linear infinite" }} />
      <span style={{ fontSize: 13, color: T.textMuted }}>Loading…</span>
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
const NAV: Array<{ id: NavSection; label: string; icon: any; badge?: string }> = [
  { id: "overview",  label: "Overview",    icon: BarChart3 },
  { id: "approvals", label: "Approvals",   icon: ShieldCheck },
  { id: "users",     label: "Users",       icon: Users },
  { id: "content",   label: "Content",     icon: MessageSquare },
  { id: "colleges",  label: "Colleges",    icon: GraduationCap },
  { id: "guardians", label: "Guardians",   icon: UserCheck },
  { id: "seasons",   label: "Seasons",     icon: Calendar },
];

// ─── Main shell ───────────────────────────────────────────────────────────────
function AdminShell({ onLogout }: { onLogout: () => void }) {
  const [active, setActive] = useState<NavSection>("overview");
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const panels: Record<NavSection, React.ReactNode> = {
    overview:  <OverviewPanel />,
    approvals: <ApprovalsPanel />,
    users:     <UsersPanel />,
    content:   <ContentPanel />,
    colleges:  <CollegesPanel />,
    guardians: <GuardiansPanel />,
    seasons:   <SeasonsPanel />,
  };

  return (
    <div className="admin-root" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AdminFonts />

      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", height: 52,
        borderBottom: `1px solid ${T.border}`, background: T.surface,
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 28, height: 28, borderRadius: 6,
            background: T.platinum + "15", border: `1px solid ${T.platinum}30`,
          }}>
            <ShieldCheck size={14} color={T.platinum} />
          </div>
          <span className="admin-heading" style={{ fontSize: 16, fontWeight: 800, letterSpacing: "0.1em", color: T.text }}>
            CALIBER ADMIN
          </span>
          <span style={{ padding: "2px 8px", borderRadius: 4, background: T.redDim, border: `1px solid ${T.red}30`, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: T.red }}>
            RESTRICTED
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div className="admin-mono" style={{ fontSize: 11, color: T.textMuted }}>
            {time.toLocaleTimeString()}
          </div>
          <button onClick={onLogout} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "5px 10px",
            border: `1px solid ${T.border}`, borderRadius: 6,
            background: "transparent", color: T.textMuted, fontSize: 12, cursor: "pointer",
          }}>
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1 }}>
        {/* Sidebar */}
        <div style={{
          width: 200, flexShrink: 0, borderRight: `1px solid ${T.border}`,
          padding: "20px 12px", display: "flex", flexDirection: "column", gap: 2,
        }}>
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => setActive(n.id)}
              className={`admin-nav-item ${active === n.id ? "active" : ""}`}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                borderRadius: 8, border: "none", background: "transparent",
                color: active === n.id ? T.platinum : T.textMuted,
                fontSize: 13, fontWeight: active === n.id ? 600 : 400, cursor: "pointer",
                textAlign: "left", width: "100%",
                borderLeft: `2px solid ${active === n.id ? T.platinum : "transparent"}`,
              }}
            >
              <n.icon size={15} />
              {n.label}
            </button>
          ))}

          <div style={{ flex: 1 }} />
          <div style={{
            padding: "10px 12px", borderTop: `1px solid ${T.border}`, marginTop: 12,
            fontSize: 11, color: T.textMuted,
          }}>
            <div className="admin-live" style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.green }} />
              System Online
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: "28px 32px", overflow: "auto", minWidth: 0 }}>
          {panels[active]}
        </div>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Admin() {
  const [authed, setAuthed] = useState(!!getPw());

  const handleLogin = () => setAuthed(true);
  const handleLogout = () => { clearPw(); setAuthed(false); };

  if (!authed) return <LoginScreen onLogin={handleLogin} />;
  return <AdminShell onLogout={handleLogout} />;
}
