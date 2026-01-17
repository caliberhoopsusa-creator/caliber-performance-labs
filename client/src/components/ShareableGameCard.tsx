import { forwardRef } from "react";
import { Target, Award, Clock, Star, Shield, Zap, CheckCircle, Flame, Crosshair, Trophy, Calendar, Users } from "lucide-react";
import { type Game, BADGE_DEFINITIONS } from "@shared/schema";
import { format } from "date-fns";

const BADGE_ICONS: Record<string, typeof Target> = {
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

function getGradeGlow(grade: string): string {
  const letter = grade.charAt(0).toUpperCase();
  switch (letter) {
    case 'A': return 'shadow-green-500/40';
    case 'B': return 'shadow-green-500/40';
    case 'C': return 'shadow-yellow-500/40';
    case 'D': return 'shadow-orange-500/40';
    case 'F': return 'shadow-red-500/40';
    default: return 'shadow-gray-500/40';
  }
}

interface ShareableGameCardProps {
  game: Game;
  playerName: string;
  badges?: { badgeType: string }[];
  aspectRatio?: "1:1" | "16:9";
}

export const ShareableGameCard = forwardRef<HTMLDivElement, ShareableGameCardProps>(
  ({ game, playerName, badges = [], aspectRatio = "16:9" }, ref) => {
    const gameDate = new Date(game.date);
    const grade = game.grade || "—";
    const gameBadges = badges.slice(0, 4);
    
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
        data-testid="shareable-game-card"
      >
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, hsl(24 100% 50% / 0.2) 0%, transparent 50%)',
          }}
        />
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 80% 100%, hsl(142 71% 45% / 0.1) 0%, transparent 40%)',
          }}
        />
        
        <div className="relative h-full p-6 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                <Calendar className="w-4 h-4" />
                <span>{format(gameDate, 'MMMM d, yyyy')}</span>
              </div>
              <h2 className="text-2xl font-bold text-white font-display uppercase tracking-tight">
                {playerName}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Users className="w-4 h-4 text-white/50" />
                <span className="text-lg text-white/80">vs {game.opponent}</span>
                {game.result && (
                  <span className={`ml-2 text-sm font-bold ${game.result.startsWith('W') ? 'text-green-400' : 'text-red-400'}`}>
                    {game.result}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className={`w-20 h-20 rounded-xl flex items-center justify-center text-4xl font-bold text-white font-display shadow-2xl ${getGradeColor(grade)} ${getGradeGlow(grade)}`}>
                {grade}
              </div>
              <span className="text-[10px] text-white/50 uppercase mt-1.5 tracking-wider">Game Grade</span>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-white/5 rounded-lg p-4 text-center border border-white/10">
              <div className="text-3xl font-bold text-orange-400 font-display">{game.points}</div>
              <div className="text-[10px] text-white/50 uppercase tracking-wider">Points</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center border border-white/10">
              <div className="text-3xl font-bold text-white font-display">{game.rebounds}</div>
              <div className="text-[10px] text-white/50 uppercase tracking-wider">Rebounds</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center border border-white/10">
              <div className="text-3xl font-bold text-white font-display">{game.assists}</div>
              <div className="text-[10px] text-white/50 uppercase tracking-wider">Assists</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center border border-white/10">
              <div className="text-3xl font-bold text-white font-display">{game.steals + game.blocks}</div>
              <div className="text-[10px] text-white/50 uppercase tracking-wider">Stl+Blk</div>
            </div>
          </div>
          
          {game.fgAttempted && game.fgAttempted > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-white/3 rounded px-3 py-2 text-center border border-white/5">
                <span className="text-sm text-white/80 font-medium">
                  {game.fgMade}/{game.fgAttempted} FG
                </span>
                <span className="text-xs text-white/40 ml-1">
                  ({((game.fgMade || 0) / game.fgAttempted * 100).toFixed(0)}%)
                </span>
              </div>
              {game.threeAttempted && game.threeAttempted > 0 && (
                <div className="bg-white/3 rounded px-3 py-2 text-center border border-white/5">
                  <span className="text-sm text-white/80 font-medium">
                    {game.threeMade}/{game.threeAttempted} 3PT
                  </span>
                  <span className="text-xs text-white/40 ml-1">
                    ({((game.threeMade || 0) / game.threeAttempted * 100).toFixed(0)}%)
                  </span>
                </div>
              )}
              {game.ftAttempted && game.ftAttempted > 0 && (
                <div className="bg-white/3 rounded px-3 py-2 text-center border border-white/5">
                  <span className="text-sm text-white/80 font-medium">
                    {game.ftMade}/{game.ftAttempted} FT
                  </span>
                  <span className="text-xs text-white/40 ml-1">
                    ({((game.ftMade || 0) / game.ftAttempted * 100).toFixed(0)}%)
                  </span>
                </div>
              )}
            </div>
          )}
          
          <div className="flex-1 flex items-end justify-between">
            {gameBadges.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {gameBadges.map((badge, i) => {
                  const Icon = BADGE_ICONS[badge.badgeType] || Trophy;
                  const badgeDef = BADGE_DEFINITIONS[badge.badgeType as keyof typeof BADGE_DEFINITIONS];
                  return (
                    <div 
                      key={i}
                      className="flex items-center gap-1.5 bg-orange-500/10 rounded-md px-2 py-1 border border-orange-500/30"
                    >
                      <Icon className="w-3.5 h-3.5 text-orange-400" />
                      <span className="text-[10px] font-bold text-orange-300 uppercase">{badgeDef?.name || badge.badgeType}</span>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="flex items-center gap-2 text-white/30">
              <div className="w-6 h-6 rounded bg-orange-500/20 flex items-center justify-center">
                <span className="text-orange-500 font-bold text-xs">C</span>
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider">Caliber</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ShareableGameCard.displayName = "ShareableGameCard";
