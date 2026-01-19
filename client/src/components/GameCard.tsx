import { useState } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Award, Activity, Target, Clock, Star, Shield, Zap, CheckCircle, Flame, Crosshair, Share2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BADGE_DEFINITIONS, type Game, type Badge } from "@shared/schema";
import { LikeCount } from "@/components/SocialEngagement";
import { ShareModal } from "@/components/ShareModal";
import { ShareableGameCard } from "@/components/ShareableCard";

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

interface GameCardPropsExtended extends GameCardProps {
  playerPhoto?: string;
}

export function GameCard({ game, playerName, badges = [], showShareButton = true, className, playerPhoto }: GameCardPropsExtended) {
  const [shareOpen, setShareOpen] = useState(false);
  const { toast } = useToast();
  const gradeColors = getGradeColor(game.grade || "");

  const fgPct = game.fgAttempted ? ((game.fgMade / game.fgAttempted) * 100).toFixed(0) : "—";
  const threePct = game.threeAttempted ? ((game.threeMade / game.threeAttempted) * 100).toFixed(0) : "—";
  const ftPct = game.ftAttempted ? ((game.ftMade / game.ftAttempted) * 100).toFixed(0) : "—";

  const gameBadges = badges.filter(b => b.gameId === game.id);

  return (
    <div
      data-testid={`game-card-${game.id}`}
      className={cn(
        "relative w-full max-w-[400px] aspect-[4/5] rounded-2xl overflow-hidden",
        "glass-card card-shine",
        "border-2",
        gradeColors.border,
        "shadow-2xl",
        gradeColors.glow,
        "transition-all duration-500 hover:border-primary/20",
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
          <div className="stat-label mb-2">
            Game Grade
          </div>
          <div
            className={cn(
              "w-28 h-28 rounded-2xl flex items-center justify-center",
              "bg-gradient-to-br",
              gradeColors.bg,
              "border-2",
              gradeColors.border,
              "shadow-2xl",
              gradeColors.glow,
              "transition-all duration-300 hover:shadow-2xl relative overflow-hidden"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
            <span className={cn("text-6xl font-display font-bold relative z-10 text-glow", gradeColors.text)}>
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
            <div key={stat.label} className="text-center p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 transition-all duration-300 hover:border-primary/30 hover:from-primary/15 hover:to-primary/8">
              <div className="stat-value text-white">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-3 mb-4 py-3 px-2 rounded-lg bg-gradient-to-r from-white/[0.02] to-transparent border border-white/5">
          <div className="text-center px-3 py-1 rounded-md bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/10 transition-all duration-300 hover:border-blue-500/20 hover:from-blue-500/15 flex-1">
            <div className="stat-value text-white text-2xl">{fgPct}%</div>
            <div className="stat-label">FG</div>
          </div>
          <div className="text-center px-3 py-1 rounded-md bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/10 transition-all duration-300 hover:border-purple-500/20 hover:from-purple-500/15 flex-1">
            <div className="stat-value text-white text-2xl">{threePct}%</div>
            <div className="stat-label">3PT</div>
          </div>
          <div className="text-center px-3 py-1 rounded-md bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/10 transition-all duration-300 hover:border-cyan-500/20 hover:from-cyan-500/15 flex-1">
            <div className="stat-value text-white text-2xl">{ftPct}%</div>
            <div className="stat-label">FT</div>
          </div>
        </div>

        {(game.defensiveGrade || game.shootingGrade || game.reboundingGrade || game.passingGrade) && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: "DEF", value: game.defensiveGrade, icon: Shield, color: "from-green-500/10 to-emerald-600/5 border-green-500/20", testId: "grade-defense" },
              { label: "SHOT", value: game.shootingGrade, icon: Target, color: "from-red-500/10 to-rose-600/5 border-red-500/20", testId: "grade-shooting" },
              { label: "REB", value: game.reboundingGrade, icon: Zap, color: "from-blue-500/10 to-sky-600/5 border-blue-500/20", testId: "grade-rebounding" },
              { label: "PASS", value: game.passingGrade, icon: Activity, color: "from-purple-500/10 to-violet-600/5 border-purple-500/20", testId: "grade-passing" },
            ].map((cat) => (
              <div 
                key={cat.label} 
                data-testid={`${cat.testId}-${game.id}`}
                className={cn(
                  "text-center p-2 rounded-lg bg-gradient-to-br border transition-colors duration-300",
                  cat.color
                )}
              >
                <cat.icon className="w-3 h-3 mx-auto mb-1 text-muted-foreground" />
                <div className={cn("text-lg font-bold", getGradeColor(cat.value || "").text)}>
                  {cat.value || "—"}
                </div>
                <div className="stat-label text-[9px]">{cat.label}</div>
              </div>
            ))}
          </div>
        )}

        {gameBadges.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {gameBadges.slice(0, 4).map((badge, index) => {
              const BadgeIcon = BADGE_ICONS[badge.badgeType] || Award;
              const badgeDef = BADGE_DEFINITIONS[badge.badgeType as keyof typeof BADGE_DEFINITIONS];
              const isPremiumBadge = ['triple_double', 'thirty_bomb', 'efficiency_master', 'lockdown'].includes(badge.badgeType);
              return (
                <div
                  key={badge.id}
                  className={cn(
                    "badge-elite flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-all duration-300 border",
                    isPremiumBadge 
                      ? "bg-gradient-to-r from-primary/30 to-primary/20 border-primary/50 hover:border-primary/70 hover:shadow-lg hover:shadow-primary/30"
                      : "bg-gradient-to-r from-primary/20 to-orange-500/20 border-primary/40 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/20"
                  )}
                  data-testid={`badge-${badge.badgeType}-${badge.id}`}
                >
                  <BadgeIcon className={cn(
                    "w-3.5 h-3.5",
                    isPremiumBadge ? "text-primary" : "text-primary"
                  )} />
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
            onClick={() => setShareOpen(true)}
            variant="outline"
            size="sm"
            className="w-full bg-gradient-to-r from-primary/10 to-orange-500/10 border border-primary/30 hover:border-primary/50 text-primary font-bold gap-2 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
            data-testid="button-share-game"
          >
            <Share2 className="w-4 h-4" />
            Share Game
          </Button>
        )}
      </div>

      <ShareModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        title="Share Game Performance"
        shareUrl={`${window.location.origin}/players/${game.playerId}/card?gameId=${game.id}`}
        shareText={`Check out my ${game.points} PTS, ${game.rebounds} REB, ${game.assists} AST game vs ${game.opponent}! Grade: ${game.grade} on @CaliberApp`}
      >
        <ShareableGameCard 
          game={game} 
          playerName={playerName} 
          playerPhoto={playerPhoto}
          badges={badges}
        />
      </ShareModal>
    </div>
  );
}
