import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GradeBadge } from "@/components/GradeBadge";
import { PlusCircle } from "lucide-react";
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
    <div
      className="relative rounded-xl overflow-hidden border border-accent/[0.15] bg-card/80"
      data-testid="hero-header"
    >
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
      <div className="absolute top-0 right-0 w-56 h-56 bg-accent/[0.07] blur-[70px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between gap-3 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Avatar className="w-13 h-13 shrink-0 border-2 border-accent/30 ring-1 ring-accent/10">
            <AvatarImage src={player?.photoUrl ?? undefined} alt={displayName} />
            <AvatarFallback className="bg-accent/15 text-accent font-display font-bold text-xl">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <p className="font-display font-bold text-foreground text-base sm:text-lg leading-tight">
              {player?.name || displayName}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">
              {[player?.position, player?.school].filter(Boolean).join(" · ") || "Complete your profile"}
            </p>
            <Button
              size="sm"
              className="mt-2 h-7 px-3 text-xs font-semibold gap-1.5"
              onClick={() => setLocation("/analyze")}
              data-testid="hero-cta-log-game"
            >
              <PlusCircle className="w-3 h-3" aria-hidden="true" />
              Log Game
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5 shrink-0">
          {statItems.map(({ label, value, isGrade }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              {isGrade && typeof value === "string" && value !== "—" ? (
                <GradeBadge grade={value} size="sm" />
              ) : (
                <span className="font-display font-bold text-foreground text-base sm:text-lg leading-none tabular-nums">
                  {String(value)}
                </span>
              )}
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest leading-none">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
