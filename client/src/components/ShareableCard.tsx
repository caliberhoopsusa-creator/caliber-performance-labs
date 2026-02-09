import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Activity, Award, Trophy, Flame, TrendingUp, Star, Zap, Sparkles, Crown } from "lucide-react";
import { BADGE_DEFINITIONS, type Game, type Badge } from "@shared/schema";

const TIER_CONFIG: Record<string, { icon: typeof Star; color: string }> = {
  Rookie: { icon: Star, color: "text-gray-400" },
  Starter: { icon: Zap, color: "text-green-400" },
  "All-Star": { icon: Sparkles, color: "text-blue-400" },
  MVP: { icon: Trophy, color: "text-purple-400" },
  "Hall of Fame": { icon: Crown, color: "text-yellow-400" },
};

interface ShareableGameCardProps {
  game: Game;
  playerName: string;
  playerPhoto?: string;
  badges?: Badge[];
}

function getGradeColor(grade: string) {
  const normalizedGrade = grade?.trim().toUpperCase() || "";
  if (["A+", "A", "A-"].includes(normalizedGrade)) {
    return {
      bg: "from-amber-500 to-yellow-600",
      bgLight: "from-amber-500/20 to-yellow-600/20",
      border: "border-amber-500",
      text: "text-amber-400",
    };
  }
  if (["B+", "B", "B-"].includes(normalizedGrade)) {
    return {
      bg: "from-slate-400 to-gray-500",
      bgLight: "from-slate-400/20 to-gray-500/20",
      border: "border-slate-400",
      text: "text-slate-300",
    };
  }
  if (["C+", "C", "C-"].includes(normalizedGrade)) {
    return {
      bg: "from-yellow-500 to-orange-500",
      bgLight: "from-yellow-500/20 to-orange-500/20",
      border: "border-yellow-500",
      text: "text-yellow-400",
    };
  }
  return {
    bg: "from-red-500 to-orange-600",
    bgLight: "from-red-500/20 to-orange-600/20",
    border: "border-red-500",
    text: "text-red-400",
  };
}

export function ShareableGameCard({ game, playerName, playerPhoto, badges = [] }: ShareableGameCardProps) {
  const gradeColors = getGradeColor(game.grade || "");
  const fgPct = game.fgAttempted ? ((game.fgMade / game.fgAttempted) * 100).toFixed(0) : "—";
  const threePct = game.threeAttempted ? ((game.threeMade / game.threeAttempted) * 100).toFixed(0) : "—";
  const gameBadges = badges.filter(b => b.gameId === game.id);

  return (
    <div 
      className="w-[400px] h-[500px] rounded-3xl overflow-hidden relative"
      style={{ 
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)",
      }}
      data-testid="shareable-game-card"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-orange-500/15 blur-3xl" />
        <div className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-20 blur-3xl bg-gradient-to-br", gradeColors.bgLight)} />
      </div>

      <div className="relative z-10 h-full flex flex-col p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-primary">Caliber</span>
          </div>
          <span className="text-xs text-white/60 font-medium bg-white/10 px-3 py-1 rounded-full">
            {format(new Date(game.date), "MMM dd, yyyy")}
          </span>
        </div>

        <div className="flex items-center gap-3 mb-5">
          {playerPhoto ? (
            <img src={playerPhoto} alt={playerName} className="w-14 h-14 rounded-xl object-cover border-2 border-white/20" loading="lazy" width={56} height={56} />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-orange-500/30 flex items-center justify-center border-2 border-white/20">
              <span className="text-xl font-bold text-white">{playerName.charAt(0)}</span>
            </div>
          )}
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">{playerName}</h2>
            <p className="text-sm text-white/60">vs {game.opponent}</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <span className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3">Game Grade</span>
          <div className={cn(
            "w-32 h-32 rounded-2xl flex items-center justify-center relative",
            "bg-gradient-to-br",
            gradeColors.bgLight,
            "border-2",
            gradeColors.border
          )}>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent" />
            <span className={cn("text-7xl font-black relative z-10", gradeColors.text)} style={{ textShadow: "0 0 40px currentColor" }}>
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
            <div key={stat.label} className="text-center py-2 px-1 rounded-xl bg-white/5 border border-white/10">
              <div className="text-xl font-black text-white">{stat.value}</div>
              <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-4 mb-4">
          <div className="text-center px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <div className="text-lg font-black text-blue-400">{fgPct}%</div>
            <div className="text-[10px] font-bold text-blue-400/60 uppercase">FG</div>
          </div>
          <div className="text-center px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30">
            <div className="text-lg font-black text-purple-400">{threePct}%</div>
            <div className="text-[10px] font-bold text-purple-400/60 uppercase">3PT</div>
          </div>
        </div>

        {gameBadges.length > 0 && (
          <div className="flex justify-center gap-2">
            {gameBadges.slice(0, 3).map((badge) => {
              const badgeDef = BADGE_DEFINITIONS[badge.badgeType as keyof typeof BADGE_DEFINITIONS];
              return (
                <div key={badge.id} className="flex items-center gap-1 bg-primary/20 border border-primary/40 rounded-full px-2 py-1">
                  <Award className="w-3 h-3 text-primary" />
                  <span className="text-[9px] font-bold text-primary uppercase">{badgeDef?.name || badge.badgeType}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface ShareableBadgeCardProps {
  badgeType: string;
  playerName: string;
  playerPhoto?: string;
  earnedDate: Date;
  rank?: number;
}

export function ShareableBadgeCard({ badgeType, playerName, playerPhoto, earnedDate, rank = 1 }: ShareableBadgeCardProps) {
  const badgeDef = BADGE_DEFINITIONS[badgeType as keyof typeof BADGE_DEFINITIONS];
  
  return (
    <div 
      className="w-[400px] h-[500px] rounded-3xl overflow-hidden relative"
      style={{ 
        background: "linear-gradient(135deg, #1a1a2e 0%, #2d1f3d 50%, #0f0f23 100%)",
      }}
      data-testid="shareable-badge-card"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-purple-500/30 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-yellow-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 h-full flex flex-col p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-primary">Caliber</span>
          </div>
          <span className="text-xs text-white/60 font-medium bg-white/10 px-3 py-1 rounded-full">
            {format(earnedDate, "MMM dd, yyyy")}
          </span>
        </div>

        <div className="text-center mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-yellow-400/80 bg-yellow-500/10 px-4 py-1 rounded-full">
            Badge Unlocked!
          </span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-36 h-36 rounded-3xl bg-gradient-to-br from-yellow-500/30 to-orange-500/20 border-2 border-yellow-500/50 flex items-center justify-center mb-4 relative">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-transparent" />
            <Award className="w-20 h-20 text-yellow-400 relative z-10" style={{ filter: "drop-shadow(0 0 20px rgba(234, 179, 8, 0.5))" }} />
            {rank > 1 && (
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center border-2 border-white/20">
                <span className="text-xs font-black text-white">{rank}</span>
              </div>
            )}
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
            {badgeDef?.name || badgeType}
          </h2>
          <p className="text-sm text-white/60 text-center max-w-[280px]">
            {badgeDef?.description || "Achievement unlocked!"}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-white/10">
          {playerPhoto ? (
            <img src={playerPhoto} alt={playerName} className="w-12 h-12 rounded-xl object-cover border-2 border-white/20" loading="lazy" width={48} height={48} />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-orange-500/30 flex items-center justify-center border-2 border-white/20">
              <span className="text-lg font-bold text-white">{playerName.charAt(0)}</span>
            </div>
          )}
          <div>
            <p className="text-lg font-bold text-white">{playerName}</p>
            <p className="text-xs text-white/50">Earned this badge</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ShareableLevelUpCardProps {
  playerName: string;
  playerPhoto?: string;
  newTier: string;
  totalXp: number;
}

export function ShareableLevelUpCard({ playerName, playerPhoto, newTier, totalXp }: ShareableLevelUpCardProps) {
  const tierConfig = TIER_CONFIG[newTier as keyof typeof TIER_CONFIG] || TIER_CONFIG.Rookie;
  const TierIcon = tierConfig.icon;

  return (
    <div 
      className="w-[400px] h-[500px] rounded-3xl overflow-hidden relative"
      style={{ 
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f0f23 100%)",
      }}
      data-testid="shareable-levelup-card"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-40 h-40 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      <div className="relative z-10 h-full flex flex-col p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-primary">Caliber</span>
          </div>
        </div>

        <div className="text-center mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400/80 bg-cyan-500/10 px-4 py-1 rounded-full inline-flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Level Up!
          </span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className={cn(
            "w-40 h-40 rounded-3xl flex items-center justify-center mb-6 relative",
            "bg-gradient-to-br from-indigo-500/30 to-purple-500/20 border-2 border-indigo-500/50"
          )}>
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-transparent" />
            <TierIcon className="w-24 h-24 text-indigo-400 relative z-10" style={{ filter: "drop-shadow(0 0 30px rgba(99, 102, 241, 0.6))" }} />
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
            {newTier}
          </h2>
          <p className="text-lg text-indigo-400 font-bold mb-4">
            {totalXp.toLocaleString()} XP
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-4 border-t border-white/10">
          {playerPhoto ? (
            <img src={playerPhoto} alt={playerName} className="w-12 h-12 rounded-xl object-cover border-2 border-white/20" loading="lazy" width={48} height={48} />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-orange-500/30 flex items-center justify-center border-2 border-white/20">
              <span className="text-lg font-bold text-white">{playerName.charAt(0)}</span>
            </div>
          )}
          <div>
            <p className="text-lg font-bold text-white">{playerName}</p>
            <p className="text-xs text-white/50">Reached a new tier!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ShareableStreakCardProps {
  playerName: string;
  playerPhoto?: string;
  streakCount: number;
  streakType: "games" | "wins" | "practices";
}

interface ShareableRankingCardProps {
  playerName: string;
  playerPhoto?: string;
  rank: number;
  totalPlayers: number;
  avgGrade: string;
  sport: string;
  position: string;
  city?: string;
  state?: string;
  statLine?: string;
}

export function ShareableRankingCard({ playerName, playerPhoto, rank, totalPlayers, avgGrade, sport, position, city, state, statLine }: ShareableRankingCardProps) {
  const gradeColors = getGradeColor(avgGrade);
  const location = [city, state].filter(Boolean).join(', ');

  return (
    <div 
      className="w-[400px] h-[500px] rounded-3xl overflow-hidden relative"
      style={{ 
        background: "linear-gradient(135deg, #1a1a2e 0%, #1e3a2e 50%, #0f0f23 100%)",
      }}
      data-testid="shareable-ranking-card"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-yellow-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-green-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 h-full flex flex-col p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-primary">Caliber</span>
          </div>
          <span className="text-xs text-white/60 font-medium bg-white/10 px-3 py-1 rounded-full">
            {sport === 'football' ? 'Football' : 'Basketball'}
          </span>
        </div>

        <div className="text-center mb-2">
          <span className="text-xs font-bold uppercase tracking-widest text-yellow-400/80 bg-yellow-500/10 px-4 py-1 rounded-full inline-flex items-center gap-1">
            <Trophy className="w-3 h-3" />
            Leaderboard Ranking
          </span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          {playerPhoto ? (
            <img src={playerPhoto} alt={playerName} className="w-20 h-20 rounded-2xl object-cover border-2 border-yellow-500/40 mb-3" loading="lazy" width={80} height={80} />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-500/30 to-orange-500/30 flex items-center justify-center border-2 border-yellow-500/40 mb-3">
              <span className="text-3xl font-bold text-white">{playerName.charAt(0)}</span>
            </div>
          )}
          
          <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">{playerName}</h2>
          <p className="text-sm text-white/60 mb-1">{position}</p>
          {location && <p className="text-xs text-cyan-400/70 mb-4">{location}</p>}
          
          <div className="text-8xl font-black text-yellow-400 mb-1" style={{ textShadow: "0 0 40px rgba(234, 179, 8, 0.5)" }}>
            #{rank}
          </div>
          <p className="text-sm text-white/50 mb-4">
            out of {totalPlayers} players
          </p>
          
          <div className="flex items-center gap-4">
            <div className={cn(
              "px-4 py-2 rounded-xl border",
              gradeColors.bgLight ? `bg-gradient-to-br ${gradeColors.bgLight}` : "",
              gradeColors.border
            )}>
              <span className={cn("text-2xl font-black", gradeColors.text)}>{avgGrade}</span>
              <p className="text-[10px] text-white/50 uppercase">Avg Grade</p>
            </div>
          </div>
          
          {statLine && (
            <p className="text-xs text-white/40 mt-3">{statLine}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function ShareableStreakCard({ playerName, playerPhoto, streakCount, streakType }: ShareableStreakCardProps) {
  const streakLabel = streakType === "games" ? "Game Streak" : streakType === "wins" ? "Win Streak" : "Practice Streak";

  return (
    <div 
      className="w-[400px] h-[500px] rounded-3xl overflow-hidden relative"
      style={{ 
        background: "linear-gradient(135deg, #1a1a2e 0%, #3d1f1f 50%, #0f0f23 100%)",
      }}
      data-testid="shareable-streak-card"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-orange-500/30 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-red-500/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-yellow-500/15 blur-3xl" />
      </div>

      <div className="relative z-10 h-full flex flex-col p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-primary">Caliber</span>
          </div>
        </div>

        <div className="text-center mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-orange-400/80 bg-orange-500/10 px-4 py-1 rounded-full inline-flex items-center gap-1">
            <Flame className="w-3 h-3" />
            On Fire!
          </span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-36 h-36 rounded-3xl bg-gradient-to-br from-orange-500/30 to-red-500/20 border-2 border-orange-500/50 flex items-center justify-center mb-4 relative">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-transparent" />
            <Flame className="w-20 h-20 text-orange-400 relative z-10" style={{ filter: "drop-shadow(0 0 20px rgba(249, 115, 22, 0.6))" }} />
          </div>
          <div className="text-7xl font-black text-white mb-2" style={{ textShadow: "0 0 40px rgba(249, 115, 22, 0.5)" }}>
            {streakCount}
          </div>
          <h2 className="text-xl font-bold text-orange-400 uppercase tracking-wider">
            {streakLabel}
          </h2>
        </div>

        <div className="flex items-center justify-center gap-3 pt-4 border-t border-white/10">
          {playerPhoto ? (
            <img src={playerPhoto} alt={playerName} className="w-12 h-12 rounded-xl object-cover border-2 border-white/20" loading="lazy" width={48} height={48} />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-orange-500/30 flex items-center justify-center border-2 border-white/20">
              <span className="text-lg font-bold text-white">{playerName.charAt(0)}</span>
            </div>
          )}
          <div>
            <p className="text-lg font-bold text-white">{playerName}</p>
            <p className="text-xs text-white/50">Keep the momentum going!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
