import { usePlayerProgression } from "@/hooks/use-basketball";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Flame, Star, Trophy, Crown, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const TIER_CONFIG: Record<string, { icon: typeof Star; color: string; bgGradient: string }> = {
  Rookie: { 
    icon: Star, 
    color: "text-gray-400", 
    bgGradient: "from-gray-500/20 to-gray-600/10" 
  },
  Starter: { 
    icon: Zap, 
    color: "text-green-400", 
    bgGradient: "from-green-500/20 to-green-600/10" 
  },
  "All-Star": { 
    icon: Sparkles, 
    color: "text-blue-400", 
    bgGradient: "from-blue-500/20 to-blue-600/10" 
  },
  MVP: { 
    icon: Trophy, 
    color: "text-purple-400", 
    bgGradient: "from-purple-500/20 to-purple-600/10" 
  },
  "Hall of Fame": { 
    icon: Crown, 
    color: "text-yellow-400", 
    bgGradient: "from-yellow-500/20 to-yellow-600/10" 
  },
};

interface PlayerProgressionProps {
  playerId: number;
  compact?: boolean;
}

export function PlayerProgression({ playerId, compact = false }: PlayerProgressionProps) {
  const { data: progression, isLoading } = usePlayerProgression(playerId);
  
  if (isLoading) {
    return (
      <div className="animate-pulse bg-secondary/30 rounded-xl p-4 h-24" data-testid="loading-progression" />
    );
  }
  
  if (!progression) return null;
  
  const tierConfig = TIER_CONFIG[progression.currentTier] || TIER_CONFIG.Rookie;
  const TierIcon = tierConfig.icon;
  
  if (compact) {
    return (
      <div className="flex items-center gap-3" data-testid="player-progression-compact">
        <Badge variant="outline" className={cn("gap-1.5 px-2.5 py-1", tierConfig.color)}>
          <TierIcon className="w-3.5 h-3.5" />
          <span className="text-xs font-bold">{progression.currentTier}</span>
        </Badge>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span className="font-medium">{progression.totalXp.toLocaleString()} XP</span>
        </div>
        {progression.currentStreak > 0 && (
          <div className="flex items-center gap-1 text-sm text-orange-400">
            <Flame className="w-3.5 h-3.5" />
            <span className="font-bold">{progression.currentStreak}</span>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div 
      className={cn(
        "rounded-xl border border-white/5 p-4 bg-gradient-to-br",
        tierConfig.bgGradient
      )}
      data-testid="player-progression"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            "bg-gradient-to-br from-background/80 to-secondary/50 border border-white/10"
          )}>
            <TierIcon className={cn("w-6 h-6", tierConfig.color)} />
          </div>
          <div>
            <h3 className={cn("text-lg font-bold font-display", tierConfig.color)}>
              {progression.currentTier}
            </h3>
            <p className="text-xs text-muted-foreground">Current Tier</p>
          </div>
        </div>
        
        {progression.currentStreak > 0 && (
          <div className="flex flex-col items-center bg-orange-500/10 rounded-lg px-3 py-2 border border-orange-500/20">
            <div className="flex items-center gap-1.5">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="text-xl font-bold text-orange-400">{progression.currentStreak}</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-orange-400/70">Day Streak</span>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">XP Progress</span>
          <span className="font-bold text-primary">{progression.totalXp.toLocaleString()} XP</span>
        </div>
        
        <Progress 
          value={progression.progressPercent} 
          className="h-2.5"
          data-testid="progress-xp-bar"
        />
        
        {progression.nextTier && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Next: {progression.nextTier}</span>
            <span>{progression.xpToNextTier.toLocaleString()} XP to go</span>
          </div>
        )}
        
        {!progression.nextTier && (
          <div className="text-center text-xs text-yellow-400 font-medium mt-2">
            Maximum tier reached!
          </div>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="grid grid-cols-5 gap-1 text-center">
          {Object.entries(progression.tierThresholds).map(([tier, xp]) => {
            const isCurrentTier = tier === progression.currentTier;
            const isPastTier = progression.totalXp >= xp;
            const config = TIER_CONFIG[tier] || TIER_CONFIG.Rookie;
            const Icon = config.icon;
            
            return (
              <div 
                key={tier} 
                className={cn(
                  "py-1 rounded transition-all",
                  isCurrentTier && "bg-white/5",
                  isPastTier ? config.color : "text-muted-foreground/30"
                )}
              >
                <Icon className={cn("w-4 h-4 mx-auto mb-0.5")} />
                <div className="text-[9px] font-medium truncate px-0.5">{tier}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
