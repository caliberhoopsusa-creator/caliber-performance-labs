import { usePlayer, usePlayerBadges, useGame } from "@/hooks/use-basketball";
import { useRoute, Link, useSearch } from "wouter";
import { cn } from "@/lib/utils";
import { ArrowLeft, Activity, Share2, Award, Target, Clock, Star, Shield, Zap, CheckCircle, Flame, Crosshair, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BADGE_DEFINITIONS, type Badge } from "@shared/schema";
import { GameCard } from "@/components/GameCard";
import { PlayerArchetype } from "@/components/PlayerArchetype";

const BADGE_ICONS: Record<string, any> = {
  twenty_piece: Target,
  thirty_bomb: Target,
  double_double: Award,
  triple_double: Award,
  ironman: Clock,
  efficiency_master: Star,
  lockdown: Shield,
  hustle_king: Zap,
  clean_sheet: CheckCircle,
  hot_streak_3: Flame,
  hot_streak_5: Flame,
  sharpshooter: Crosshair,
};

function getOverallGrade(games: any[]): string {
  if (!games || games.length === 0) return "—";
  
  const gradeValues: Record<string, number> = {
    "A+": 100, "A": 95, "A-": 90,
    "B+": 88, "B": 85, "B-": 80,
    "C+": 78, "C": 75, "C-": 70,
    "D+": 68, "D": 65, "D-": 60,
    "F": 50
  };
  
  const reverseGrade: Record<number, string> = {
    100: "A+", 95: "A", 90: "A-",
    88: "B+", 85: "B", 80: "B-",
    78: "C+", 75: "C", 70: "C-",
    68: "D+", 65: "D", 60: "D-",
    50: "F"
  };
  
  const total = games.reduce((acc, g) => acc + (gradeValues[g.grade] || 75), 0);
  const avg = total / games.length;
  
  const thresholds = [100, 95, 90, 88, 85, 80, 78, 75, 70, 68, 65, 60, 50];
  for (const t of thresholds) {
    if (avg >= t) return reverseGrade[t];
  }
  return "F";
}

function getGradeColor(grade: string) {
  const normalizedGrade = grade?.trim().toUpperCase() || "";
  if (["A+", "A", "A-"].includes(normalizedGrade)) {
    return {
      bg: "from-amber-500/20 to-yellow-600/20",
      border: "border-amber-500/50",
      text: "text-amber-400",
      glow: "shadow-amber-500/30",
      accent: "bg-gradient-to-r from-amber-500 to-yellow-500",
    };
  }
  if (["B+", "B", "B-"].includes(normalizedGrade)) {
    return {
      bg: "from-slate-400/20 to-gray-500/20",
      border: "border-slate-400/50",
      text: "text-slate-300",
      glow: "shadow-slate-400/30",
      accent: "bg-gradient-to-r from-slate-400 to-gray-400",
    };
  }
  if (["C+", "C", "C-"].includes(normalizedGrade)) {
    return {
      bg: "from-yellow-500/20 to-orange-500/20",
      border: "border-yellow-500/50",
      text: "text-yellow-400",
      glow: "shadow-yellow-500/30",
      accent: "bg-gradient-to-r from-yellow-500 to-orange-500",
    };
  }
  return {
    bg: "from-red-500/20 to-accent/20",
    border: "border-red-500/50",
    text: "text-red-400",
    glow: "shadow-red-500/30",
    accent: "bg-gradient-to-r from-red-500 to-accent",
  };
}

export default function PlayerCard() {
  const [, params] = useRoute("/players/:id/card");
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const gameId = searchParams.get("gameId");
  
  const id = Number(params?.id);
  const { data: player, isLoading } = usePlayer(id);
  const { data: badges = [] } = usePlayerBadges(id);
  const { data: singleGame } = useGame(gameId ? Number(gameId) : 0);
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center">
        <h2 className="text-2xl font-display font-bold text-white mb-2">Player Not Found</h2>
        <Link href="/players" className="text-accent hover:underline">Return to Roster</Link>
      </div>
    );
  }

  const games = player.games || [];

  if (gameId && singleGame) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Link href={`/players/${id}`} className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-white transition-colors uppercase tracking-wider mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </Link>
        <GameCard 
          game={singleGame} 
          playerName={player.name} 
          badges={badges}
          showShareButton={true}
        />
      </div>
    );
  }

  const avgPoints = games.length ? (games.reduce((acc: number, g: any) => acc + g.points, 0) / games.length).toFixed(1) : "—";
  const avgReb = games.length ? (games.reduce((acc: number, g: any) => acc + g.rebounds, 0) / games.length).toFixed(1) : "—";
  const avgAst = games.length ? (games.reduce((acc: number, g: any) => acc + g.assists, 0) / games.length).toFixed(1) : "—";
  
  const overallGrade = getOverallGrade(games);
  const gradeColors = getGradeColor(overallGrade);

  const recentBadges = [...badges].sort((a, b) => 
    new Date(b.earnedAt || 0).getTime() - new Date(a.earnedAt || 0).getTime()
  ).slice(0, 6);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/players/${id}/card`;
    const shareData = {
      title: `${player.name} - Caliber Player Card`,
      text: `Check out ${player.name}'s stats: ${avgPoints} PPG, ${avgReb} RPG, ${avgAst} APG. Overall Grade: ${overallGrade}`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          copyToClipboard(shareUrl);
        }
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied!",
      description: "Share link copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Link href={`/players/${id}`} className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-white transition-colors uppercase tracking-wider mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Profile
      </Link>

      <div
        data-testid="player-card"
        className={cn(
          "relative w-full max-w-[400px] aspect-[4/5] rounded-3xl overflow-hidden",
          "bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]",
          "border-2",
          gradeColors.border,
          "shadow-2xl",
          gradeColors.glow,
          "animate-fade-up"
        )}
      >
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-30",
          gradeColors.bg
        )} />

        <div className="absolute top-0 right-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-accent/5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />

        <div className={cn(
          "absolute top-0 left-0 right-0 h-1",
          gradeColors.accent
        )} />

        <div className="relative z-10 h-full flex flex-col p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" />
              <span className="text-xs font-bold uppercase tracking-widest text-accent">Caliber</span>
            </div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {games.length} Games
            </div>
          </div>

          <div className="flex items-start gap-5 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary to-background border-2 border-white/20 flex items-center justify-center text-3xl font-display font-bold text-white shadow-xl">
              {player.jerseyNumber || "#"}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                  gradeColors.accent,
                  "text-white"
                )}>
                  {player.position}
                </span>
              </div>
              <h1 className="text-3xl font-display font-bold text-white uppercase tracking-tight leading-none">
                {player.name}
              </h1>
              <p className="text-sm text-muted-foreground font-medium mt-1">
                {player.team || "Free Agent"} • {player.height || "—"}
              </p>
            </div>
          </div>

          {games.length > 0 && (
            <div className="mb-4">
              <PlayerArchetype 
                games={games} 
                position={player.position as "Guard" | "Wing" | "Big"}
                variant="badge"
              />
            </div>
          )}

          <div className="flex-1 flex flex-col justify-center items-center my-2">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium">
              Overall Grade
            </div>
            <div
              className={cn(
                "w-32 h-32 rounded-2xl flex items-center justify-center",
                "bg-gradient-to-br",
                gradeColors.bg,
                "border-2",
                gradeColors.border,
                "shadow-xl",
                gradeColors.glow
              )}
            >
              <span className={cn("text-7xl font-display font-bold", gradeColors.text)}>
                {overallGrade}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "PPG", value: avgPoints },
              { label: "RPG", value: avgReb },
              { label: "APG", value: avgAst },
            ].map((stat) => (
              <div key={stat.label} className="text-center bg-white/5 rounded-xl py-3 border border-white/10">
                <div className="text-2xl font-display font-bold text-white">{stat.value}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {recentBadges.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-accent" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recent Badges</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentBadges.map((badge) => {
                  const BadgeIcon = BADGE_ICONS[badge.badgeType] || Award;
                  const badgeDef = BADGE_DEFINITIONS[badge.badgeType as keyof typeof BADGE_DEFINITIONS];
                  return (
                    <div
                      key={badge.id}
                      className="flex items-center gap-1.5 bg-accent/20 border border-accent/30 rounded-full px-2.5 py-1"
                    >
                      <BadgeIcon className="w-3.5 h-3.5 text-accent" />
                      <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
                        {badgeDef?.name || badge.badgeType}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Button
            onClick={handleShare}
            variant="outline"
            className="w-full bg-white/5 border-white/20 hover:bg-white/10 text-white font-bold gap-2"
            data-testid="button-share-card"
          >
            <Share2 className="w-4 h-4" />
            Share Card
          </Button>
        </div>
      </div>
    </div>
  );
}
