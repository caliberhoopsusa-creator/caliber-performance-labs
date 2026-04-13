// client/src/components/HeroHeader.tsx
// Reusable hero banner for the Community/Feed page top section.
// Shows the current player's avatar, name, position, team, a primary CTA,
// and a compact stat strip (PPG, grade, rank, games played).

import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GradeBadge } from "@/components/GradeBadge";
import { Trophy } from "lucide-react";
import type { User } from "@shared/models/auth";

interface PublicPlayerData {
  player: {
    name: string;
    position: string | null;
    school: string | null;
    photoUrl: string | null;
    sport: string;
    leaderboardRank: number | null;
  };
  stats: {
    gamesPlayed: number;
    averageGrade: string;
    basketball: { ppg: number; rpg: number; apg: number };
  };
}

interface HeroHeaderProps {
  user: User | null | undefined;
}

export function HeroHeader({ user }: HeroHeaderProps) {
  const [, setLocation] = useLocation();

  const { data } = useQuery<PublicPlayerData>({
    queryKey: ["/api/players", user?.playerId, "public"],
    queryFn: async () => {
      const res = await fetch(`/api/players/${user!.playerId}/public`);
      if (!res.ok) throw new Error("Failed to fetch player profile");
      return res.json();
    },
    enabled: !!user?.playerId,
  });

  if (!user) return null;

  const displayName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Athlete";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const player = data?.player;
  const stats = data?.stats;
  const grade = stats?.averageGrade ?? "—";

  const statItems = [
    { label: "PPG",   value: stats?.basketball?.ppg != null ? Number(stats.basketball.ppg).toFixed(1)  : "—", isGrade: false },
    { label: "Grade", value: grade, isGrade: true },
    { label: "APG",   value: stats?.basketball?.apg != null ? Number(stats.basketball.apg).toFixed(1)  : "—", isGrade: false },
    { label: "RPG",   value: stats?.basketball?.rpg != null ? Number(stats.basketball.rpg).toFixed(1)  : "—", isGrade: false },
  ] as const;

  return (
    <div className="relative rounded-2xl overflow-hidden" data-testid="hero-header">
      {/* Amber radial glow backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 15% 60%, rgba(198,208,216,0.20) 0%, rgba(198,208,216,0.06) 45%, transparent 68%), " +
            "linear-gradient(135deg, rgba(14,11,8,0.97) 0%, rgba(9,9,13,0.97) 100%)",
        }}
      />
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #4f6878 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />
      {/* Amber left-edge accent line */}
      <div className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full bg-gradient-to-b from-amber-500/60 via-amber-400/80 to-amber-600/40" />

      <div className="relative z-10 flex items-center justify-between gap-3 px-5 py-5 sm:px-6">
        {/* LEFT — Avatar + identity + CTA */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Avatar className="w-14 h-14 shrink-0 border-2 border-amber-500/40 ring-1 ring-amber-500/10">
            <AvatarImage src={player?.photoUrl ?? undefined} alt={displayName} />
            <AvatarFallback className="bg-amber-950/60 text-amber-300 font-display font-bold text-xl">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <p className="font-display font-bold text-white text-base sm:text-lg leading-tight">
              {player?.name || displayName}
            </p>
            <p className="text-xs sm:text-sm text-amber-400/75 font-medium truncate mt-0.5">
              {[player?.position, player?.school].filter(Boolean).join(" · ") || "Complete your profile"}
            </p>
            <Button
              size="sm"
              className="mt-2 h-7 px-3 text-xs bg-amber-500 hover:bg-amber-400 text-black font-bold leading-none"
              onClick={() => setLocation("/analyze")}
              data-testid="hero-cta-log-game"
            >
              Log Game
            </Button>
          </div>
        </div>

        {/* RIGHT — Compact stat strip */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {statItems.map(({ label, value, isGrade }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              {isGrade && typeof value === "string" && value !== "—" ? (
                <GradeBadge grade={value} size="sm" />
              ) : (
                <span className="font-display font-bold text-white text-base sm:text-lg leading-none tabular-nums">
                  {String(value)}
                </span>
              )}
              <span className="text-[10px] text-amber-200/40 uppercase tracking-widest leading-none">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
