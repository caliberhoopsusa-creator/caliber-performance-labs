import { forwardRef } from "react";
import { Target, Award, Clock, Star, Shield, Zap, CheckCircle, Flame, Crosshair, Trophy, Sparkles } from "lucide-react";
import { BADGE_DEFINITIONS } from "@shared/schema";

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
  hustle_champion: Zap,
  scoring_machine: Target,
  consistency_king: Star,
  tier_starter: Sparkles,
  tier_allstar: Sparkles,
  tier_mvp: Trophy,
  tier_hof: Trophy,
  streak_3: Flame,
  streak_7: Flame,
  streak_14: Flame,
  streak_30: Flame,
  xp_100: Star,
  xp_500: Star,
  xp_1000: Star,
  xp_5000: Star,
};

const BADGE_COLORS: Record<string, { bg: string; border: string; glow: string; text: string }> = {
  twenty_piece: { bg: 'from-accent/30 to-accent/10', border: 'border-accent/50', glow: 'shadow-accent/40', text: 'text-accent' },
  thirty_bomb: { bg: 'from-red-500/30 to-red-600/10', border: 'border-red-500/50', glow: 'shadow-red-500/40', text: 'text-red-400' },
  double_double: { bg: 'from-purple-500/30 to-purple-600/10', border: 'border-purple-500/50', glow: 'shadow-purple-500/40', text: 'text-purple-400' },
  triple_double: { bg: 'from-accent/30 to-accent/10', border: 'border-accent/50', glow: 'shadow-accent/40', text: 'text-accent' },
  efficiency_master: { bg: 'from-green-500/30 to-green-600/10', border: 'border-green-500/50', glow: 'shadow-green-500/40', text: 'text-green-400' },
  lockdown: { bg: 'from-blue-500/30 to-blue-600/10', border: 'border-blue-500/50', glow: 'shadow-blue-500/40', text: 'text-blue-400' },
  default: { bg: 'from-accent/30 to-accent/10', border: 'border-accent/50', glow: 'shadow-accent/40', text: 'text-accent' },
};

interface ShareableBadgeCardProps {
  badgeType: string;
  playerName: string;
  earnedDate?: Date;
  aspectRatio?: "1:1" | "16:9";
}

export const ShareableBadgeCard = forwardRef<HTMLDivElement, ShareableBadgeCardProps>(
  ({ badgeType, playerName, earnedDate, aspectRatio = "1:1" }, ref) => {
    const badgeDef = BADGE_DEFINITIONS[badgeType as keyof typeof BADGE_DEFINITIONS];
    const Icon = BADGE_ICONS[badgeType] || Trophy;
    const colors = BADGE_COLORS[badgeType] || BADGE_COLORS.default;
    
    const cardWidth = aspectRatio === "16:9" ? 640 : 400;
    const cardHeight = aspectRatio === "16:9" ? 360 : 400;

    return (
      <div
        ref={ref}
        className="relative overflow-hidden"
        style={{
          width: cardWidth,
          height: cardHeight,
          background: 'linear-gradient(135deg, hsl(222 47% 6%) 0%, hsl(220 35% 10%) 50%, hsl(222 47% 6%) 100%)',
        }}
        data-testid="shareable-badge-card"
      >
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, hsl(24 100% 50% / 0.25) 0%, transparent 60%)',
          }}
        />
        
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute pointer-events-none"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              animation: `sparkle ${2 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          >
            <Sparkles 
              className="text-accent/40" 
              style={{ 
                width: 8 + Math.random() * 12, 
                height: 8 + Math.random() * 12 
              }} 
            />
          </div>
        ))}
        
        {[...Array(20)].map((_, i) => (
          <div
            key={`confetti-${i}`}
            className="absolute w-2 h-2 rounded-full pointer-events-none"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${-10 + Math.random() * 30}%`,
              backgroundColor: ['#f97316', '#22c55e', '#3b82f6', '#a855f7', '#eab308'][Math.floor(Math.random() * 5)],
              opacity: 0.6,
              animation: `fall ${3 + Math.random() * 3}s linear infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
        
        <div className="relative h-full p-6 flex flex-col items-center justify-center text-center">
          <div className="text-[10px] text-white/40 uppercase tracking-widest mb-4">Badge Unlocked</div>
          
          <div 
            className={`relative w-32 h-32 rounded-2xl bg-gradient-to-br ${colors.bg} border-2 ${colors.border} flex items-center justify-center mb-6 shadow-2xl ${colors.glow}`}
          >
            <div 
              className="absolute inset-0 rounded-2xl"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)',
              }}
            />
            <Icon className={`w-16 h-16 ${colors.text}`} />
            
            <div className="absolute -inset-1 rounded-2xl border border-white/10 pointer-events-none" />
          </div>
          
          <h2 className={`text-3xl font-bold font-display uppercase tracking-wide mb-2 ${colors.text}`}>
            {badgeDef?.name || badgeType}
          </h2>
          
          <p className="text-sm text-white/60 max-w-xs mb-6">
            {badgeDef?.description || "Achievement unlocked!"}
          </p>
          
          <div className="bg-white/5 rounded-lg px-4 py-2 border border-white/10">
            <span className="text-sm text-white/80">Earned by </span>
            <span className="text-sm font-bold text-white">{playerName}</span>
          </div>
          
          <div className="absolute bottom-4 right-4 flex items-center gap-2 text-white/30">
            <div className="w-6 h-6 rounded bg-accent/20 flex items-center justify-center">
              <span className="text-accent font-bold text-xs">C</span>
            </div>
            <span className="text-[10px] font-medium uppercase tracking-wider">Caliber</span>
          </div>
        </div>
        
        <style>{`
          @keyframes sparkle {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.2); }
          }
          @keyframes fall {
            0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
            10% { opacity: 0.6; }
            90% { opacity: 0.6; }
            100% { transform: translateY(420px) rotate(720deg); opacity: 0; }
          }
        `}</style>
      </div>
    );
  }
);

ShareableBadgeCard.displayName = "ShareableBadgeCard";
