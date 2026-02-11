import { forwardRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Zap, Trophy, Crown, Sparkles } from "lucide-react";
import { type PlayerWithGames, type Badge as BadgeType, TIER_THRESHOLDS } from "@shared/schema";
import { type SkillBadge } from "@/hooks/use-basketball";
import { FOOTBALL_POSITIONS, FOOTBALL_POSITION_LABELS, type FootballPosition } from "@shared/sports-config";
import caliberLogo from "@assets/caliber-logo-orange.png";

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

function getGradeGlowColor(grade: string): { bg: string; glow: string; text: string } {
  const letter = grade.charAt(0).toUpperCase();
  switch (letter) {
    case 'A':
      return { bg: 'bg-emerald-500', glow: 'shadow-emerald-500/50', text: 'text-emerald-400' };
    case 'B':
      return { bg: 'bg-accent', glow: 'shadow-accent/50', text: 'text-accent' };
    case 'C':
      return { bg: 'bg-yellow-500', glow: 'shadow-yellow-500/50', text: 'text-yellow-400' };
    case 'D':
      return { bg: 'bg-orange-500', glow: 'shadow-orange-500/50', text: 'text-orange-400' };
    case 'F':
      return { bg: 'bg-red-500', glow: 'shadow-red-500/50', text: 'text-red-400' };
    default:
      return { bg: 'bg-gray-500', glow: 'shadow-gray-500/50', text: 'text-gray-400' };
  }
}

interface ShareCardProps {
  player: PlayerWithGames;
  badges?: BadgeType[];
  skillBadges?: SkillBadge[];
  progression?: {
    totalXp: number;
    currentTier: string;
    progressPercent: number;
    nextTier: string | null;
  };
  sport?: string;
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  ({ player, badges = [], skillBadges = [], progression, sport }, ref) => {
    const games = player.games || [];
    const isFootball = sport === 'football' || player.sport === 'football';
    
    // Basketball averages
    const avgPoints = games.length ? (games.reduce((acc, g) => acc + g.points, 0) / games.length).toFixed(1) : "—";
    const avgReb = games.length ? (games.reduce((acc, g) => acc + g.rebounds, 0) / games.length).toFixed(1) : "—";
    const avgAst = games.length ? (games.reduce((acc, g) => acc + g.assists, 0) / games.length).toFixed(1) : "—";
    
    // Football averages
    const avgPassYds = games.length ? (games.reduce((acc, g) => acc + (g.passingYards || 0), 0) / games.length).toFixed(0) : "—";
    const avgRushYds = games.length ? (games.reduce((acc, g) => acc + (g.rushingYards || 0), 0) / games.length).toFixed(0) : "—";
    const totalTDs = games.reduce((acc, g) => acc + (g.passingTouchdowns || 0) + (g.rushingTouchdowns || 0) + (g.receivingTouchdowns || 0), 0);
    const avgTackles = games.length ? (games.reduce((acc, g) => acc + (g.tackles || 0), 0) / games.length).toFixed(1) : "—";
    
    const averageGrade = getAverageGrade(games);
    const gradeColors = getGradeGlowColor(averageGrade);
    
    const currentTier = progression?.currentTier || player.currentTier || "Rookie";
    const totalXp = progression?.totalXp || player.totalXp || 0;
    const TierIcon = TIER_ICONS[currentTier] || Star;
    const tierColor = TIER_COLORS[currentTier] || "text-gray-400";

    return (
      <div
        ref={ref}
        className="relative overflow-hidden"
        style={{
          width: 400,
          height: 500,
          background: 'linear-gradient(160deg, hsl(220 14% 6%) 0%, hsl(220 12% 10%) 40%, hsl(220 10% 12%) 70%, hsl(220 14% 8%) 100%)',
        }}
        data-testid="share-card"
      >
        {/* Accent gradient overlay for branded look */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, hsl(var(--accent) / 0.15) 0%, transparent 60%)',
          }}
        />
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 80% 100%, hsl(var(--accent) / 0.08) 0%, transparent 50%)',
          }}
        />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(234,88,12,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(234,88,12,0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        
        <div className="relative h-full p-6 flex flex-col">
          {/* Caliber Logo Header */}
          <div className="flex items-center justify-center mb-6">
            <img 
              src={caliberLogo} 
              alt="Caliber" 
              className="h-8 object-contain"
              style={{ filter: 'drop-shadow(0 0 8px rgba(234, 88, 12, 0.3))' }}
            />
          </div>
          
          {/* Player Photo & Info */}
          <div className="flex items-center gap-5 mb-6">
            <div className="relative">
              <div 
                className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-accent/40"
                style={{ 
                  boxShadow: '0 0 20px rgba(234, 88, 12, 0.2), inset 0 0 20px rgba(234, 88, 12, 0.05)',
                }}
              >
                {player.photoUrl ? (
                  <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" loading="lazy" width={96} height={96} />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white font-display">{getInitials(player.name)}</span>
                  </div>
                )}
              </div>
              {/* Tier badge */}
              <div 
                className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-black/80 border border-accent/30 flex items-center justify-center ${tierColor}`}
                style={{ boxShadow: '0 0 10px rgba(234, 88, 12, 0.15)' }}
              >
                <TierIcon className="w-5 h-5" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              {player.jerseyNumber && (
                <span className="text-2xl font-bold text-accent font-display">#{player.jerseyNumber}</span>
              )}
              <h2 className="text-2xl font-bold text-white font-display uppercase tracking-tight truncate leading-tight">
                {player.name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold uppercase tracking-wider bg-accent/20 text-accent px-2 py-1 rounded border border-accent/30">
                  {player.position?.split(',').map(p => p.trim()).map(pos => 
                    FOOTBALL_POSITIONS.includes(pos as FootballPosition)
                      ? FOOTBALL_POSITION_LABELS[pos as FootballPosition]
                      : pos
                  ).join(' / ') || player.position}
                </span>
                {player.team && (
                  <span className="text-xs text-white/50">{player.team}</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Grade with Glow Effect */}
          <div className="flex justify-center mb-6">
            <div 
              className={`relative w-20 h-20 rounded-2xl flex items-center justify-center ${gradeColors.bg} shadow-lg ${gradeColors.glow}`}
              style={{ 
                boxShadow: `0 0 30px ${averageGrade.charAt(0) === 'A' ? 'rgba(16, 185, 129, 0.4)' : averageGrade.charAt(0) === 'B' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
              }}
            >
              <span className="text-4xl font-black text-white font-display drop-shadow-lg">{averageGrade}</span>
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {isFootball ? (
              <>
                <div className="bg-white/5 rounded-xl p-4 text-center border border-border backdrop-blur-sm">
                  <div className="text-3xl font-bold text-white font-display">{totalTDs}</div>
                  <div className="text-[10px] text-accent/70 uppercase tracking-wider mt-1">TDs</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center border border-border backdrop-blur-sm">
                  <div className="text-3xl font-bold text-white font-display">{avgRushYds}</div>
                  <div className="text-[10px] text-accent/70 uppercase tracking-wider mt-1">Rush YPG</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center border border-border backdrop-blur-sm">
                  <div className="text-3xl font-bold text-white font-display">{avgTackles}</div>
                  <div className="text-[10px] text-accent/70 uppercase tracking-wider mt-1">TCK/G</div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white/5 rounded-xl p-4 text-center border border-border backdrop-blur-sm">
                  <div className="text-3xl font-bold text-white font-display">{avgPoints}</div>
                  <div className="text-[10px] text-accent/70 uppercase tracking-wider mt-1">PPG</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center border border-border backdrop-blur-sm">
                  <div className="text-3xl font-bold text-white font-display">{avgReb}</div>
                  <div className="text-[10px] text-accent/70 uppercase tracking-wider mt-1">RPG</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center border border-border backdrop-blur-sm">
                  <div className="text-3xl font-bold text-white font-display">{avgAst}</div>
                  <div className="text-[10px] text-accent/70 uppercase tracking-wider mt-1">APG</div>
                </div>
              </>
            )}
          </div>
          
          {/* Tier & XP */}
          <div className="flex items-center justify-center gap-3 mb-6 py-3 px-4 bg-white/5 rounded-xl border border-border">
            <TierIcon className={`w-6 h-6 ${tierColor}`} />
            <div className="text-center">
              <div className={`text-lg font-bold font-display ${tierColor}`}>{currentTier}</div>
              <div className="text-[10px] text-white/40">{totalXp.toLocaleString()} XP</div>
            </div>
          </div>
          
          {/* Games Played */}
          <div className="text-center mb-4">
            <span className="text-sm text-white/40">{games.length} Games Played</span>
          </div>
          
          {/* Footer Branding */}
          <div className="mt-auto pt-4 border-t border-border">
            <div className="flex items-center justify-center gap-2">
              <div 
                className="w-6 h-6 rounded bg-accent/20 flex items-center justify-center border border-accent/30"
                style={{ boxShadow: '0 0 10px rgba(234, 88, 12, 0.2)' }}
              >
                <span className="text-accent font-bold text-xs">C</span>
              </div>
              <span className="text-sm font-medium text-accent/60 uppercase tracking-widest">View on Caliber</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ShareCard.displayName = "ShareCard";
