import { useState } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Award, Activity, Target, Clock, Star, Shield, Zap, CheckCircle, Flame, Crosshair, Share2, Copy, ShieldCheck } from "lucide-react";
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
  sport?: string;
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

export function GameCard({ game, playerName, badges = [], showShareButton = true, className, playerPhoto, sport = 'basketball' }: GameCardPropsExtended) {
  const [shareOpen, setShareOpen] = useState(false);
  const { toast } = useToast();
  const gradeColors = getGradeColor(game.grade || "");
  const isFootball = sport === 'football';

  const fgPct = game.fgAttempted ? ((game.fgMade / game.fgAttempted) * 100).toFixed(0) : "—";
  const threePct = game.threeAttempted ? ((game.threeMade / game.threeAttempted) * 100).toFixed(0) : "—";
  const ftPct = game.ftAttempted ? ((game.ftMade / game.ftAttempted) * 100).toFixed(0) : "—";
  
  // Football stats
  const totalYards = (game.passingYards || 0) + (game.rushingYards || 0) + (game.receivingYards || 0);
  const totalTDs = (game.passingTouchdowns || 0) + (game.rushingTouchdowns || 0) + (game.receivingTouchdowns || 0);
  const compPct = game.passAttempts ? (((game.completions || 0) / game.passAttempts) * 100).toFixed(0) : "—";

  const gameBadges = badges.filter(b => b.gameId === game.id);

  return (
    <div
      data-testid={`game-card-${game.id}`}
      className={cn(
        "relative w-full max-w-[400px] aspect-[4/5] rounded-2xl overflow-hidden",
        "border-2",
        gradeColors.border,
        "shadow-2xl",
        gradeColors.glow,
        "transition-all duration-500 hover:border-accent/20",
        className
      )}
    >
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-30",
        gradeColors.bg
      )} />

      <div className="absolute top-0 left-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-40 h-40 bg-accent/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="relative z-10 h-full flex flex-col p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            <span className="text-xs font-bold uppercase tracking-widest text-accent">Caliber</span>
          </div>
          <div className="flex items-center gap-3">
            <LikeCount gameId={game.id} />
            <span className="text-xs text-muted-foreground font-medium">
              {format(new Date(game.date), "MMM dd, yyyy")}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-2xl font-display font-bold text-foreground uppercase tracking-tight leading-none">
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
            <span className={cn("text-6xl font-display font-bold relative z-10", gradeColors.text)}>
              {game.grade || "—"}
            </span>
          </div>
        </div>

        {isFootball ? (
          <>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {[
                { label: "YDS", value: totalYards },
                { label: "TDs", value: totalTDs },
                { label: "TCK", value: game.tackles || 0 },
                { label: "SACK", value: game.sacks || 0 },
                { label: "INT", value: game.defensiveInterceptions || 0 },
              ].map((stat) => (
                <div key={stat.label} className="text-center p-2 rounded-lg bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/10 transition-all duration-300 hover:border-accent/30 hover:from-accent/15 hover:to-accent/8">
                  <div className="stat-value text-foreground">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-3 mb-4 py-3 px-2 rounded-lg bg-muted/50 border border-border/50">
              <div className="text-center px-3 py-1 rounded-md bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/10 transition-all duration-300 hover:border-blue-500/20 hover:from-blue-500/15 flex-1">
                <div className="stat-value text-foreground text-2xl">{game.passingYards || 0}</div>
                <div className="stat-label">PASS YDS</div>
              </div>
              <div className="text-center px-3 py-1 rounded-md bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/10 transition-all duration-300 hover:border-purple-500/20 hover:from-purple-500/15 flex-1">
                <div className="stat-value text-foreground text-2xl">{game.rushingYards || 0}</div>
                <div className="stat-label">RUSH YDS</div>
              </div>
              <div className="text-center px-3 py-1 rounded-md bg-gradient-to-br from-accent/10 to-accent/5 border border-border transition-all duration-300 hover:border-accent/20 hover:from-accent/15 flex-1">
                <div className="stat-value text-foreground text-2xl">{game.receivingYards || 0}</div>
                <div className="stat-label">REC YDS</div>
              </div>
            </div>

            {(game.efficiencyGrade || game.playmakingGrade || game.ballSecurityGrade || game.impactGrade) && (
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { label: "EFF", value: game.efficiencyGrade, icon: Target, color: "from-blue-500/10 to-sky-600/5 border-blue-500/20", testId: "grade-efficiency" },
                  { label: "PLAY", value: game.playmakingGrade, icon: Zap, color: "from-purple-500/10 to-violet-600/5 border-purple-500/20", testId: "grade-playmaking" },
                  { label: "SEC", value: game.ballSecurityGrade, icon: ShieldCheck, color: "from-green-500/10 to-emerald-600/5 border-green-500/20", testId: "grade-security" },
                  { label: "IMP", value: game.impactGrade, icon: Flame, color: "from-accent/10 to-red-600/5 border-accent/20", testId: "grade-impact" },
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
          </>
        ) : (
          <>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {[
                { label: "PTS", value: game.points },
                { label: "REB", value: game.rebounds },
                { label: "AST", value: game.assists },
                { label: "STL", value: game.steals },
                { label: "BLK", value: game.blocks },
              ].map((stat) => (
                <div key={stat.label} className="text-center p-2 rounded-lg bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/10 transition-all duration-300 hover:border-accent/30 hover:from-accent/15 hover:to-accent/8">
                  <div className="stat-value text-foreground">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-3 mb-4 py-3 px-2 rounded-lg bg-muted/50 border border-border/50">
              <div className="text-center px-3 py-1 rounded-md bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/10 transition-all duration-300 hover:border-blue-500/20 hover:from-blue-500/15 flex-1">
                <div className="stat-value text-foreground text-2xl">{fgPct}%</div>
                <div className="stat-label">FG</div>
              </div>
              <div className="text-center px-3 py-1 rounded-md bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/10 transition-all duration-300 hover:border-purple-500/20 hover:from-purple-500/15 flex-1">
                <div className="stat-value text-foreground text-2xl">{threePct}%</div>
                <div className="stat-label">3PT</div>
              </div>
              <div className="text-center px-3 py-1 rounded-md bg-gradient-to-br from-accent/10 to-accent/5 border border-border transition-all duration-300 hover:border-accent/20 hover:from-accent/15 flex-1">
                <div className="stat-value text-foreground text-2xl">{ftPct}%</div>
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
          </>
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
                      ? "bg-gradient-to-r from-accent/30 to-accent/20 border-accent/50 hover:border-accent/70 hover:shadow-lg hover:shadow-accent/30"
                      : "bg-gradient-to-r from-accent/20 to-accent/15 border-accent/40 hover:border-accent/60 hover:shadow-lg hover:shadow-accent/20"
                  )}
                  data-testid={`badge-${badge.badgeType}-${badge.id}`}
                >
                  <BadgeIcon className={cn(
                    "w-3.5 h-3.5",
                    isPremiumBadge ? "text-accent" : "text-accent"
                  )} />
                  <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
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
            className="w-full bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/30 hover:border-accent/50 text-accent font-bold gap-2 transition-all duration-300 hover:shadow-lg hover:shadow-accent/20"
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
        shareText={isFootball 
          ? `Check out my ${totalYards} YDS, ${totalTDs} TD game vs ${game.opponent}! Grade: ${game.grade} on @CaliberApp`
          : `Check out my ${game.points} PTS, ${game.rebounds} REB, ${game.assists} AST game vs ${game.opponent}! Grade: ${game.grade} on @CaliberApp`}
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
