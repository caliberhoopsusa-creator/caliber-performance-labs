import { usePlayerProgression } from "@/hooks/use-basketball";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Flame, Star, Trophy, Crown, Sparkles, Zap, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEquippedItems } from "@/contexts/EquippedItemsContext";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useCelebrationContext } from "@/components/CelebrationOverlay";

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
  const { getBadgeStyle, equippedBadgeStyle } = useEquippedItems();
  const { user } = useAuth();
  const { triggerCelebration } = useCelebrationContext();
  
  const isOwnProfile = user?.playerId === playerId;
  const badgeStyle = isOwnProfile ? getBadgeStyle() : null;
  
  // Track previous tier and XP for animations and celebrations
  const previousTierRef = useRef<string | null>(null);
  const previousXpRef = useRef<number | null>(null);
  const [xpIncreased, setXpIncreased] = useState(false);
  
  // Detect tier changes and trigger celebration
  useEffect(() => {
    if (!progression) return;
    
    // Tier promotion detected
    if (previousTierRef.current && previousTierRef.current !== progression.currentTier) {
      triggerCelebration("tier_promotion", {
        value: progression.currentTier,
      });
    }
    
    previousTierRef.current = progression.currentTier;
  }, [progression?.currentTier, triggerCelebration]);
  
  // Detect XP increases for animation
  useEffect(() => {
    if (!progression) return;
    
    if (previousXpRef.current !== null && progression.totalXp > previousXpRef.current) {
      setXpIncreased(true);
      const timer = setTimeout(() => setXpIncreased(false), 1500);
      return () => clearTimeout(timer);
    }
    
    previousXpRef.current = progression.totalXp;
  }, [progression?.totalXp]);
  
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
        <Badge 
          variant="outline" 
          className={cn("gap-1.5 px-2.5 py-1", tierConfig.color)}
          style={badgeStyle ? {
            borderColor: badgeStyle.ringColor,
            boxShadow: badgeStyle.glowColor,
            background: badgeStyle.gradient,
            animation: badgeStyle.animation,
          } : undefined}
        >
          <TierIcon className="w-3.5 h-3.5" />
          <span className="text-xs font-bold">{progression.currentTier}</span>
        </Badge>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Zap className="w-3.5 h-3.5 text-accent" />
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
      className="rounded-xl p-5 animate-in fade-in duration-500"
      data-testid="player-progression"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4 animate-in slide-in-from-left duration-500">
          <motion.div 
            className={cn(
              "relative w-16 h-16 rounded-xl flex items-center justify-center",
              "bg-gradient-to-br from-accent/30 to-accent/10 border-2",
              badgeStyle ? "" : "border-accent/20 shadow-lg shadow-accent/20"
            )}
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={badgeStyle ? {
              borderColor: badgeStyle.ringColor,
              boxShadow: badgeStyle.glowColor,
              background: badgeStyle.gradient,
              animation: badgeStyle.animation,
            } : undefined}
            data-testid="tier-icon-pulse"
          >
            {badgeStyle && (
              <div 
                className="absolute inset-0 rounded-xl opacity-50"
                style={{
                  background: badgeStyle.gradient,
                  animation: badgeStyle.animation,
                  filter: "blur(8px)",
                }}
              />
            )}
            <TierIcon className={cn("w-8 h-8 relative z-10", tierConfig.color)} />
          </motion.div>
          <div>
            <h3 className={cn("text-2xl font-bold font-display", tierConfig.color)}>
              {progression.currentTier}
            </h3>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Current Tier</p>
            {badgeStyle && equippedBadgeStyle && (
              <p className="text-[10px] text-accent/70 mt-0.5">{equippedBadgeStyle.item.name}</p>
            )}
          </div>
        </div>
        
        <div className="flex flex-col gap-3 animate-in slide-in-from-right duration-500">
          {progression.currentStreak > 0 && (
            <motion.div 
              className={cn(
                "flex flex-col items-center bg-gradient-to-br from-orange-500/15 to-orange-600/5 rounded-lg px-4 py-3 border border-orange-500/30 shadow-lg shadow-orange-500/10 transition-all hover:shadow-orange-500/20 hover:border-orange-500/40",
                progression.streakInGracePeriod && "border-orange-500/50 shadow-lg shadow-orange-500/30"
              )}
              animate={{
                scale: progression.streakInGracePeriod ? [1, 1.02, 1] : 1,
              }}
              transition={{
                duration: progression.streakInGracePeriod ? 1.5 : 0,
                repeat: progression.streakInGracePeriod ? Infinity : 0,
              }}
              data-testid="streak-display"
            >
              <div className="flex items-center gap-1.5">
                <Flame className={cn("w-5 h-5 text-orange-400", progression.streakInGracePeriod ? "animate-pulse" : "")} />
                <span className="text-2xl font-bold text-orange-400">{progression.currentStreak}</span>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-orange-400/70 font-semibold">Streak</span>
            </motion.div>
          )}
          
          {/* Grace Period Warning */}
          {progression.streakInGracePeriod && (
            <motion.div 
              className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/40 rounded-lg px-3 py-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              data-testid="grace-period-warning"
            >
              <AlertCircle className="w-4 h-4 text-yellow-400" />
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-yellow-400">Grace Period</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-yellow-400" />
                  <span className="text-xs text-yellow-400">{progression.hoursUntilStreakLost}h</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      
      <div className="h-px bg-border my-5" />
      
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground uppercase tracking-wider font-medium text-xs">XP Progress</span>
          <motion.span 
            className="font-bold text-accent text-base"
            animate={xpIncreased ? { scale: [1, 1.1, 1], color: ["hsl(24, 95%, 53%)", "#ffeb3b", "hsl(24, 95%, 53%)"] } : {}}
            transition={{ duration: 0.6 }}
            data-testid="xp-display"
          >
            {progression.totalXp.toLocaleString()} XP
          </motion.span>
        </div>
        
        <div className="relative rounded-lg overflow-hidden">
          {/* Animated overlay */}
          {xpIncreased && (
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/20 to-transparent pointer-events-none z-20"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
          )}
          
          {/* Static background */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/10 to-transparent pointer-events-none z-10" />
          
          <Progress 
            value={progression.progressPercent} 
            className="h-3"
            data-testid="progress-xp-bar"
          />
        </div>
        
        {progression.nextTier && (
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium animate-in fade-in duration-300">
            <span className="uppercase tracking-wider">Next: {progression.nextTier}</span>
            <span className="text-accent font-semibold">{progression.xpToNextTier.toLocaleString()} XP to go</span>
          </div>
        )}
        
        {!progression.nextTier && (
          <div className="text-center text-xs text-yellow-400 font-bold mt-3 px-3 py-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20 animate-pulse">
            Maximum tier reached!
          </div>
        )}
      </div>
      
      <div className="mt-6 pt-5 border-t border-accent/10">
        <div className="grid grid-cols-5 gap-2 text-center">
          {Object.entries(progression.tierThresholds).map(([tier, xp]) => {
            const isCurrentTier = tier === progression.currentTier;
            const isPastTier = progression.totalXp >= xp;
            const config = TIER_CONFIG[tier] || TIER_CONFIG.Rookie;
            const Icon = config.icon;
            
            return (
              <div 
                key={tier} 
                className={cn(
                  "py-2 px-1 rounded-lg transition-all duration-300",
                  isCurrentTier && "bg-accent/15 border border-accent/30 shadow-lg shadow-accent/10",
                  !isCurrentTier && isPastTier && "bg-white/5 border border-white/10",
                  !isPastTier && "opacity-40"
                )}
                style={isCurrentTier && badgeStyle ? {
                  borderColor: badgeStyle.ringColor,
                  boxShadow: badgeStyle.glowColor,
                } : undefined}
              >
                <Icon className={cn("w-5 h-5 mx-auto mb-1 transition-all duration-300", isPastTier ? config.color : "text-muted-foreground/50")} />
                <div className="text-[10px] font-bold uppercase tracking-wide truncate px-0.5">{tier}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
