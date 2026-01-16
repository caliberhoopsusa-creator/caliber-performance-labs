import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Award, Activity, Target, Clock, Star, Shield, Zap, CheckCircle, Flame, Crosshair, Share2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BADGE_DEFINITIONS, type Game, type Badge } from "@shared/schema";
import { LikeCount } from "@/components/SocialEngagement";

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

interface GameCardProps {
  game: Game;
  playerName: string;
  badges?: Badge[];
  showShareButton?: boolean;
  className?: string;
}

function getGradeColor(grade: string) {
  const normalizedGrade = grade?.trim().toUpperCase() || "";
  if (["A+", "A", "A-"].includes(normalizedGrade)) {
    return {
      bg: "from-amber-500/20 to-yellow-600/20",
      border: "border-amber-500/50",
      text: "text-amber-400",
      glow: "shadow-amber-500/30",
    };
  }
  if (["B+", "B", "B-"].includes(normalizedGrade)) {
    return {
      bg: "from-slate-400/20 to-gray-500/20",
      border: "border-slate-400/50",
      text: "text-slate-300",
      glow: "shadow-slate-400/30",
    };
  }
  if (["C+", "C", "C-"].includes(normalizedGrade)) {
    return {
      bg: "from-yellow-500/20 to-orange-500/20",
      border: "border-yellow-500/50",
      text: "text-yellow-400",
      glow: "shadow-yellow-500/30",
    };
  }
  return {
    bg: "from-red-500/20 to-orange-600/20",
    border: "border-red-500/50",
    text: "text-red-400",
    glow: "shadow-red-500/30",
  };
}

export function GameCard({ game, playerName, badges = [], showShareButton = true, className }: GameCardProps) {
  const { toast } = useToast();
  const gradeColors = getGradeColor(game.grade || "");

  const fgPct = game.fgAttempted ? ((game.fgMade / game.fgAttempted) * 100).toFixed(0) : "—";
  const threePct = game.threeAttempted ? ((game.threeMade / game.threeAttempted) * 100).toFixed(0) : "—";
  const ftPct = game.ftAttempted ? ((game.ftMade / game.ftAttempted) * 100).toFixed(0) : "—";

  const gameBadges = badges.filter(b => b.gameId === game.id);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/players/${game.playerId}/card?gameId=${game.id}`;
    const shareData = {
      title: `${playerName} Game Report - ${game.grade}`,
      text: `Check out my ${game.points} PTS, ${game.rebounds} REB, ${game.assists} AST game vs ${game.opponent}! Grade: ${game.grade}`,
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
    <div
      data-testid={`game-card-${game.id}`}
      className={cn(
        "relative w-full max-w-[400px] aspect-[4/5] rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]",
        "border-2",
        gradeColors.border,
        "shadow-2xl",
        gradeColors.glow,
        className
      )}
    >
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-30",
        gradeColors.bg
      )} />

      <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="relative z-10 h-full flex flex-col p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Caliber</span>
          </div>
          <div className="flex items-center gap-3">
            <LikeCount gameId={game.id} />
            <span className="text-xs text-muted-foreground font-medium">
              {format(new Date(game.date), "MMM dd, yyyy")}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-2xl font-display font-bold text-white uppercase tracking-tight leading-none">
            {playerName}
          </h2>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            vs {game.opponent}
          </p>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center my-4">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2 font-medium">
            Game Grade
          </div>
          <div
            className={cn(
              "w-28 h-28 rounded-2xl flex items-center justify-center",
              "bg-gradient-to-br",
              gradeColors.bg,
              "border-2",
              gradeColors.border,
              "shadow-lg",
              gradeColors.glow
            )}
          >
            <span className={cn("text-6xl font-display font-bold", gradeColors.text)}>
              {game.grade || "—"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2 mb-4">
          {[
            { label: "PTS", value: game.points },
            { label: "REB", value: game.rebounds },
            { label: "AST", value: game.assists },
            { label: "STL", value: game.steals },
            { label: "BLK", value: game.blocks },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-display font-bold text-white">{stat.value}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-6 mb-4 py-3 border-t border-b border-white/10">
          <div className="text-center">
            <div className="text-lg font-display font-bold text-white">{fgPct}%</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">FG</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-display font-bold text-white">{threePct}%</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">3PT</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-display font-bold text-white">{ftPct}%</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">FT</div>
          </div>
        </div>

        {gameBadges.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {gameBadges.slice(0, 4).map((badge) => {
              const BadgeIcon = BADGE_ICONS[badge.badgeType] || Award;
              const badgeDef = BADGE_DEFINITIONS[badge.badgeType as keyof typeof BADGE_DEFINITIONS];
              return (
                <div
                  key={badge.id}
                  className="flex items-center gap-1.5 bg-primary/20 border border-primary/30 rounded-full px-2.5 py-1"
                >
                  <BadgeIcon className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                    {badgeDef?.name || badge.badgeType}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {showShareButton && (
          <Button
            onClick={handleShare}
            variant="outline"
            size="sm"
            className="w-full bg-white/5 border-white/20 hover:bg-white/10 text-white font-bold gap-2"
            data-testid="button-share-game"
          >
            <Share2 className="w-4 h-4" />
            Share Game
          </Button>
        )}
      </div>
    </div>
  );
}
