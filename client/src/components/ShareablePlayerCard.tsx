import { forwardRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, Zap, Trophy, Crown, Sparkles, Target, Crosshair, Shield, Hand, Grab } from "lucide-react";
import { type PlayerWithGames, type Badge as BadgeType, BADGE_DEFINITIONS, TIER_THRESHOLDS } from "@shared/schema";
import { type SkillBadge } from "@/hooks/use-basketball";

const SKILL_ICONS: Record<string, typeof Target> = {
  sharpshooter: Crosshair,
  pure_passer: Zap,
  bucket_getter: Target,
  glass_cleaner: Shield,
  rim_protector: Hand,
  pickpocket: Grab,
};

const TIER_ICONS: Record<string, typeof Star> = {
  Rookie: Star,
  Starter: Zap,
  "All-Star": Sparkles,
  MVP: Trophy,
  "Hall of Fame": Crown,
};

const TIER_COLORS: Record<string, string> = {
  Rookie: "text-gray-400",
  Starter: "text-green-400",
  "All-Star": "text-blue-400",
  MVP: "text-purple-400",
  "Hall of Fame": "text-yellow-400",
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAverageGrade(games: { grade: string | null }[]): string {
  if (games.length === 0) return "—";
  const GRADE_VALUES: Record<string, number> = {
    'A+': 100, 'A': 95, 'A-': 90,
    'B+': 88, 'B': 85, 'B-': 80,
    'C+': 78, 'C': 75, 'C-': 70,
    'D+': 68, 'D': 65, 'D-': 60,
    'F': 50,
  };
  
  const totalValue = games.reduce((acc, g) => {
    const grade = g.grade?.trim().toUpperCase() || '';
    return acc + (GRADE_VALUES[grade] || 0);
  }, 0);
  const avgValue = totalValue / games.length;
  
  if (avgValue >= 97) return "A+";
  if (avgValue >= 92) return "A";
  if (avgValue >= 87) return "A-";
  if (avgValue >= 84) return "B+";
  if (avgValue >= 81) return "B";
  if (avgValue >= 77) return "B-";
  if (avgValue >= 74) return "C+";
  if (avgValue >= 71) return "C";
  if (avgValue >= 67) return "C-";
  if (avgValue >= 64) return "D+";
  if (avgValue >= 61) return "D";
  if (avgValue >= 55) return "D-";
  return "F";
}

function getGradeColor(grade: string): string {
  const letter = grade.charAt(0).toUpperCase();
  switch (letter) {
    case 'A': return 'bg-green-500';
    case 'B': return 'bg-green-500';
    case 'C': return 'bg-yellow-500';
    case 'D': return 'bg-orange-500';
    case 'F': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
}

interface ShareablePlayerCardProps {
  player: PlayerWithGames;
  badges?: BadgeType[];
  skillBadges?: SkillBadge[];
  progression?: {
    totalXp: number;
    currentTier: string;
    progressPercent: number;
    nextTier: string | null;
  };
  aspectRatio?: "1:1" | "16:9";
}

export const ShareablePlayerCard = forwardRef<HTMLDivElement, ShareablePlayerCardProps>(
  ({ player, badges = [], skillBadges = [], progression, aspectRatio = "1:1" }, ref) => {
    const games = player.games || [];
    const avgPoints = games.length ? (games.reduce((acc, g) => acc + g.points, 0) / games.length).toFixed(1) : "—";
    const avgReb = games.length ? (games.reduce((acc, g) => acc + g.rebounds, 0) / games.length).toFixed(1) : "—";
    const avgAst = games.length ? (games.reduce((acc, g) => acc + g.assists, 0) / games.length).toFixed(1) : "—";
    const averageGrade = getAverageGrade(games);
    
    const currentTier = progression?.currentTier || player.currentTier || "Rookie";
    const totalXp = progression?.totalXp || player.totalXp || 0;
    const TierIcon = TIER_ICONS[currentTier] || Star;
    const tierColor = TIER_COLORS[currentTier] || "text-gray-400";
    
    const unlockedSkillBadges = skillBadges.filter(b => b.currentLevel !== 'none').slice(0, 4);
    const recentBadges = badges.slice(0, 6);
    
    const cardWidth = aspectRatio === "16:9" ? 640 : 400;
    const cardHeight = aspectRatio === "16:9" ? 360 : 400;

    return (
      <div
        ref={ref}
        className="relative overflow-hidden"
        style={{
          width: cardWidth,
          height: cardHeight,
          background: 'linear-gradient(135deg, hsl(222 47% 8%) 0%, hsl(220 35% 12%) 50%, hsl(222 47% 8%) 100%)',
        }}
        data-testid="shareable-player-card"
      >
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 30% 20%, hsl(24 100% 50% / 0.15) 0%, transparent 50%)',
          }}
        />
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 70% 80%, hsl(220 100% 50% / 0.08) 0%, transparent 50%)',
          }}
        />
        
        <div className="absolute inset-0 backdrop-blur-3xl" />
        
        <div className="relative h-full p-6 flex flex-col">
          <div className="flex items-start gap-4 mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-orange-500/30 shadow-lg shadow-orange-500/20">
                {player.photoUrl ? (
                  <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-500/30 to-orange-600/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white font-display">{getInitials(player.name)}</span>
                  </div>
                )}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-card/90 border border-white/20 flex items-center justify-center ${tierColor}`}>
                <TierIcon className="w-4 h-4" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {player.jerseyNumber && (
                  <span className="text-xl font-bold text-orange-500 font-display">#{player.jerseyNumber}</span>
                )}
                <span className="text-xs font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded border border-orange-500/30">
                  {player.position}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white font-display uppercase tracking-tight truncate">
                {player.name}
              </h2>
              {player.team && (
                <p className="text-sm text-white/60">{player.team}</p>
              )}
            </div>
            
            <div className="flex flex-col items-center">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold text-white font-display ${getGradeColor(averageGrade)}`}>
                {averageGrade}
              </div>
              <span className="text-[10px] text-white/50 uppercase mt-1">Grade</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
              <div className="text-2xl font-bold text-white font-display">{avgPoints}</div>
              <div className="text-[10px] text-white/50 uppercase tracking-wider">PPG</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
              <div className="text-2xl font-bold text-white font-display">{avgReb}</div>
              <div className="text-[10px] text-white/50 uppercase tracking-wider">RPG</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
              <div className="text-2xl font-bold text-white font-display">{avgAst}</div>
              <div className="text-[10px] text-white/50 uppercase tracking-wider">APG</div>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-end">
            {unlockedSkillBadges.length > 0 && (
              <div className="mb-3">
                <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Skill Badges</div>
                <div className="flex gap-2 flex-wrap">
                  {unlockedSkillBadges.map((badge) => {
                    const Icon = SKILL_ICONS[badge.skillType] || Target;
                    return (
                      <div 
                        key={badge.skillType}
                        className="flex items-center gap-1.5 bg-white/5 rounded-md px-2 py-1 border border-white/10"
                      >
                        <Icon className="w-3.5 h-3.5 text-orange-400" />
                        <span className="text-[10px] font-medium text-white/80 uppercase">{badge.currentLevel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TierIcon className={`w-5 h-5 ${tierColor}`} />
                <div>
                  <div className={`text-sm font-bold font-display ${tierColor}`}>{currentTier}</div>
                  <div className="text-[10px] text-white/40">{totalXp.toLocaleString()} XP</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-white/30">
                <div className="w-6 h-6 rounded bg-orange-500/20 flex items-center justify-center">
                  <span className="text-orange-500 font-bold text-xs">C</span>
                </div>
                <span className="text-[10px] font-medium uppercase tracking-wider">Caliber</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ShareablePlayerCard.displayName = "ShareablePlayerCard";
