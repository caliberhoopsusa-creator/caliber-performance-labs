import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import {
  ArrowLeftRight,
  MapPin,
  GraduationCap,
  Search,
  Filter,
  Star,
  Clock,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface PortalPlayer {
  id: number;
  name: string;
  sport: string;
  position: string;
  height: string | null;
  school: string | null;
  state: string | null;
  graduationYear: number | null;
  level: string | null;
  photoUrl: string | null;
  transferPortalNote: string | null;
  transferPortalEnteredAt: string | null;
  gpa: string | null;
  verifiedAthlete: boolean;
  currentTier: string;
  ppg?: number;
  rpg?: number;
  apg?: number;
}

const TIER_COLORS: Record<string, string> = {
  "Hall of Fame": "#FFD700",
  MVP: "#C6D0D8",
  "All-Star": "#4f6878",
  Starter: "#6b7280",
  Rookie: "#374151",
};

const POSITIONS = ["All", "Guard", "Wing", "Big", "Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"];
const LEVELS = ["All", "high_school", "college"];
const STATES = ["All", "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

function daysInPortal(enteredAt: string | null): string {
  if (!enteredAt) return "";
  const days = Math.floor((Date.now() - new Date(enteredAt).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function PlayerPortalCard({ player }: { player: PortalPlayer }) {
  const tierColor = TIER_COLORS[player.currentTier] ?? "#374151";
  return (
    <Link href={`/player/${player.id}`}>
      <div className="group rounded-xl border border-white/8 p-5 transition-all duration-200 hover:border-white/20 hover:bg-white/3 cursor-pointer"
        style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {player.photoUrl ? (
              <img src={player.photoUrl} alt={player.name}
                className="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-white/10" />
            ) : (
              <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold"
                style={{ background: "rgba(198,208,216,0.1)", color: "#C6D0D8", border: "1px solid rgba(198,208,216,0.2)" }}>
                {player.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-white text-sm">{player.name}</span>
                {player.verifiedAthlete && (
                  <CheckCircle2 size={13} className="text-amber-400 flex-shrink-0" />
                )}
              </div>
              <div className="text-xs text-white/40 mt-0.5">
                {player.position}{player.height ? ` · ${player.height}` : ""}
                {player.level === "college" && " · College"}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${tierColor}18`, color: tierColor, border: `1px solid ${tierColor}30` }}>
              {player.currentTier}
            </span>
            {player.transferPortalEnteredAt && (
              <span className="text-xs text-white/30 flex items-center gap-1">
                <Clock size={10} /> {daysInPortal(player.transferPortalEnteredAt)}
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/40">
          {player.school && (
            <span className="flex items-center gap-1">
              <GraduationCap size={11} /> {player.school}
            </span>
          )}
          {player.state && (
            <span className="flex items-center gap-1">
              <MapPin size={11} /> {player.state}
            </span>
          )}
          {player.graduationYear && (
            <span>Class of {player.graduationYear}</span>
          )}
          {player.gpa && (
            <span>GPA {Number(player.gpa).toFixed(2)}</span>
          )}
        </div>

        {player.transferPortalNote && (
          <p className="mt-3 text-xs text-white/50 italic leading-relaxed border-l-2 border-white/10 pl-3">
            "{player.transferPortalNote}"
          </p>
        )}

        {(player.ppg || player.rpg || player.apg) && (
          <div className="mt-3 flex gap-4 text-xs">
            {player.ppg != null && (
              <div className="text-center">
                <div className="font-bold text-white">{player.ppg.toFixed(1)}</div>
                <div className="text-white/30">PPG</div>
              </div>
            )}
            {player.rpg != null && (
              <div className="text-center">
                <div className="font-bold text-white">{player.rpg.toFixed(1)}</div>
                <div className="text-white/30">RPG</div>
              </div>
            )}
            {player.apg != null && (
              <div className="text-center">
                <div className="font-bold text-white">{player.apg.toFixed(1)}</div>
                <div className="text-white/30">APG</div>
              </div>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center justify-end text-xs text-white/25 group-hover:text-white/50 transition-colors">
          View Profile <ChevronRight size={12} className="ml-0.5" />
        </div>
      </div>
    </Link>
  );
}

function EnterPortalPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [inPortal, setInPortal] = useState(false);

  const { data: myPlayer } = useQuery<{ inTransferPortal: boolean; transferPortalNote: string | null }>({
    queryKey: ["/api/me/transfer-portal-status"],
    enabled: !!user,
    queryFn: () => fetch("/api/me/transfer-portal-status", { credentials: "include" }).then(r => r.json()),
  });

  const enterMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/me/transfer-portal", { note }),
    onSuccess: () => {
      toast({ title: "You're in the Transfer Portal", description: "Coaches and recruiters can now find you." });
      qc.invalidateQueries({ queryKey: ["/api/me/transfer-portal-status"] });
      qc.invalidateQueries({ queryKey: ["/api/transfer-portal"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to update portal status.", variant: "destructive" }),
  });

  const exitMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/me/transfer-portal"),
    onSuccess: () => {
      toast({ title: "Removed from Transfer Portal" });
      qc.invalidateQueries({ queryKey: ["/api/me/transfer-portal-status"] });
      qc.invalidateQueries({ queryKey: ["/api/transfer-portal"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to update portal status.", variant: "destructive" }),
  });

  const isCurrentlyInPortal = myPlayer?.inTransferPortal;

  if (!user) {
    return (
      <div className="rounded-xl border border-white/8 p-5 text-center" style={{ background: "rgba(255,255,255,0.02)" }}>
        <ArrowLeftRight size={24} className="mx-auto mb-3 text-white/30" />
        <p className="text-sm text-white/50 mb-3">Sign in to enter the Transfer Portal</p>
        <Link href="/login">
          <Button size="sm" style={{ background: "linear-gradient(135deg, #4f6878, #3d5262)" }}>Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-5 space-y-4"
      style={{
        background: isCurrentlyInPortal ? "rgba(79,104,120,0.12)" : "rgba(255,255,255,0.02)",
        borderColor: isCurrentlyInPortal ? "rgba(79,104,120,0.4)" : "rgba(255,255,255,0.08)",
      }}>
      <div className="flex items-center gap-2">
        <ArrowLeftRight size={16} style={{ color: "#C6D0D8" }} />
        <span className="font-semibold text-white text-sm">Your Portal Status</span>
      </div>

      {isCurrentlyInPortal ? (
        <>
          <div className="flex items-center gap-2 text-sm" style={{ color: "#C6D0D8" }}>
            <CheckCircle2 size={15} />
            You are currently in the Transfer Portal
          </div>
          {myPlayer?.transferPortalNote && (
            <p className="text-xs text-white/40 italic">"{myPlayer.transferPortalNote}"</p>
          )}
          <Button variant="outline" size="sm" className="w-full border-white/15 text-white/60 hover:text-white hover:border-white/30"
            onClick={() => exitMutation.mutate()} disabled={exitMutation.isPending}>
            {exitMutation.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
            Remove from Portal
          </Button>
        </>
      ) : (
        <>
          <p className="text-xs text-white/40 leading-relaxed">
            Entering the Transfer Portal makes your profile visible to college coaches and recruiters actively looking for transfers.
          </p>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Brief note to recruiters (optional) — e.g. 'Grad transfer, immediate eligibility, 3.4 GPA'"
            maxLength={200}
            rows={2}
            className="w-full text-xs text-white/70 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-white/30 transition-colors"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
          <Button size="sm" className="w-full font-semibold"
            style={{ background: "linear-gradient(135deg, #4f6878, #3d5262)" }}
            onClick={() => enterMutation.mutate()} disabled={enterMutation.isPending}>
            {enterMutation.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : <Zap size={14} className="mr-2" />}
            Enter Transfer Portal
          </Button>
        </>
      )}
    </div>
  );
}

export default function TransferPortal() {
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("All");
  const [level, setLevel] = useState("All");
  const [state, setState] = useState("All");

  const { data: players = [], isLoading } = useQuery<PortalPlayer[]>({
    queryKey: ["/api/transfer-portal", { position, level, state }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (position !== "All") params.set("position", position);
      if (level !== "All") params.set("level", level);
      if (state !== "All") params.set("state", state);
      const res = await apiRequest("GET", `/api/transfer-portal?${params}`);
      return res.json();
    },
  });

  const filtered = (players as PortalPlayer[]).filter((p: PortalPlayer) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.school?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{ background: "#080808", color: "#fff", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div className="border-b border-white/6 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ArrowLeftRight size={18} style={{ color: "#C6D0D8" }} />
              <h1 className="text-xl font-bold text-white">Transfer Portal</h1>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: "rgba(198,208,216,0.1)", color: "#C6D0D8", border: "1px solid rgba(198,208,216,0.2)" }}>
                {players.length} players
              </span>
            </div>
            <p className="text-sm text-white/40">Athletes actively seeking new programs</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-4">
          <EnterPortalPanel />

          {/* Filters */}
          <div className="rounded-xl border border-white/8 p-4 space-y-3" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-center gap-2 text-xs font-semibold text-white/50 uppercase tracking-wider">
              <Filter size={12} /> Filters
            </div>

            <div>
              <label className="text-xs text-white/40 mb-1 block">Position</label>
              <select value={position} onChange={e => setPosition(e.target.value)}
                className="w-full text-xs rounded-lg px-3 py-2 text-white/70 focus:outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-white/40 mb-1 block">Level</label>
              <select value={level} onChange={e => setLevel(e.target.value)}
                className="w-full text-xs rounded-lg px-3 py-2 text-white/70 focus:outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <option value="All">All</option>
                <option value="high_school">High School</option>
                <option value="college">College</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-white/40 mb-1 block">State</label>
              <select value={state} onChange={e => setState(e.target.value)}
                className="w-full text-xs rounded-lg px-3 py-2 text-white/70 focus:outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Why Caliber Portal */}
          <div className="rounded-xl border border-white/8 p-4 space-y-2" style={{ background: "rgba(255,255,255,0.02)" }}>
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Why use Caliber Portal?</p>
            {[
              "Verified stats — coaches see real numbers",
              "Performance grades on every player",
              "Direct messaging to recruiter contacts",
              "Immediate eligibility flags",
            ].map(t => (
              <div key={t} className="flex items-start gap-2 text-xs text-white/40">
                <CheckCircle2 size={11} className="mt-0.5 flex-shrink-0 text-amber-500/60" />
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Main list */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or school…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white/70 placeholder:text-white/25 focus:outline-none focus:border-white/25 transition-colors"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="rounded-xl border border-white/6 p-5 animate-pulse h-32"
                  style={{ background: "rgba(255,255,255,0.02)" }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-white/6 p-12 text-center" style={{ background: "rgba(255,255,255,0.01)" }}>
              <ArrowLeftRight size={32} className="mx-auto mb-3 text-white/15" />
              <p className="text-white/40 text-sm">No players in the portal matching your filters</p>
              <p className="text-white/25 text-xs mt-1">Be the first to enter — athletes who list early get more recruiter views</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(filtered as PortalPlayer[]).map((p: PortalPlayer) => <PlayerPortalCard key={p.id} player={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
