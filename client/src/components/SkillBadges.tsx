import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { usePlayerSkillBadges, type SkillBadge } from "@/hooks/use-basketball";
import { useSport } from "@/components/SportToggle";
import { getBadgesForPosition } from "@shared/schema";
import { Target, Crosshair, Zap, Shield, Hand, Grab, Flame, Footprints, Radar, Eye, Swords, Castle } from "lucide-react";

const SKILL_ICONS: Record<string, typeof Target> = {
  sharpshooter: Crosshair,
  pure_passer: Zap,
  bucket_getter: Target,
  glass_cleaner: Shield,
  rim_protector: Hand,
  pickpocket: Grab,
  gunslinger: Flame,
  workhorse: Footprints,
  deep_threat: Radar,
  ball_hawk: Eye,
  sack_artist: Swords,
  iron_wall: Castle,
};

const LEVEL_COLORS: Record<string, { 
  bg: string; 
  border: string; 
  text: string;
  iconGradient: string;
  glow: string;
  shadowColor: string;
}> = {
  none: { 
    bg: "bg-muted/20", 
    border: "border-muted/30", 
    text: "text-muted-foreground",
    iconGradient: "from-muted/40 to-muted/20",
    glow: "shadow-sm shadow-muted/10",
    shadowColor: "shadow-muted/5"
  },
  brick: { 
    bg: "bg-gradient-to-br from-red-950/40 to-red-900/20", 
    border: "border-red-800/40", 
    text: "text-red-400",
    iconGradient: "from-red-700/60 to-red-900/40",
    glow: "shadow-lg shadow-red-500/20",
    shadowColor: "shadow-red-500/10"
  },
  bronze: { 
    bg: "bg-gradient-to-br from-amber-950/40 to-amber-900/20", 
    border: "border-amber-700/40", 
    text: "text-amber-400",
    iconGradient: "from-amber-600/60 to-amber-800/40",
    glow: "shadow-lg shadow-amber-500/20",
    shadowColor: "shadow-amber-500/10"
  },
  silver: { 
    bg: "bg-gradient-to-br from-slate-400/30 to-slate-300/15", 
    border: "border-slate-400/40", 
    text: "text-slate-300",
    iconGradient: "from-slate-300/60 to-slate-400/40",
    glow: "shadow-lg shadow-slate-400/15",
    shadowColor: "shadow-slate-400/10"
  },
  gold: { 
    bg: "bg-gradient-to-br from-amber-500/30 to-amber-600/15", 
    border: "border-amber-500/50", 
    text: "text-amber-300",
    iconGradient: "from-amber-500/70 to-yellow-600/50",
    glow: "shadow-lg shadow-amber-500/25",
    shadowColor: "shadow-amber-500/15"
  },
  platinum: { 
    bg: "bg-gradient-to-br from-accent/30 to-accent/15", 
    border: "border-accent/50", 
    text: "text-accent",
    iconGradient: "from-accent/70 to-blue-500/50",
    glow: "",
    shadowColor: "shadow-accent/15"
  },
  hall_of_fame: { 
    bg: "bg-gradient-to-br from-purple-500/30 to-purple-600/15", 
    border: "border-purple-400/50", 
    text: "text-purple-300",
    iconGradient: "from-purple-500/70 to-purple-700/50",
    glow: "shadow-lg shadow-purple-500/25",
    shadowColor: "shadow-purple-500/15"
  },
  legend: { 
    bg: "bg-gradient-to-br from-orange-500/30 to-orange-600/15", 
    border: "border-orange-400/50", 
    text: "text-orange-300",
    iconGradient: "from-orange-500/70 to-red-600/50",
    glow: "shadow-lg shadow-orange-500/25",
    shadowColor: "shadow-orange-500/15"
  },
  goat: { 
    bg: "bg-gradient-to-br from-amber-500/35 via-yellow-500/25 to-purple-500/25", 
    border: "border-amber-400/50", 
    text: "text-amber-200",
    iconGradient: "from-amber-500/80 via-yellow-500/70 to-purple-600/60",
    glow: "shadow-xl shadow-amber-500/30",
    shadowColor: "shadow-amber-500/20"
  },
};

const LEVEL_NAMES: Record<string, string> = {
  none: "Locked",
  brick: "Brick",
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  hall_of_fame: "HOF",
  legend: "Legend",
  goat: "GOAT",
};

interface SkillBadgeCardProps {
  badge: SkillBadge;
  index: number;
}

function SkillBadgeCard({ badge, index }: SkillBadgeCardProps) {
  const Icon = SKILL_ICONS[badge.skillType] || Target;
  const colors = LEVEL_COLORS[badge.currentLevel] || LEVEL_COLORS.none;
  const isPremium = ['hall_of_fame', 'legend', 'goat'].includes(badge.currentLevel);
  
  const getNextThreshold = () => {
    if (badge.currentLevel === 'goat') return badge.thresholds.goat;
    if (badge.currentLevel === 'legend') return badge.thresholds.goat;
    if (badge.currentLevel === 'hall_of_fame') return badge.thresholds.legend;
    if (badge.currentLevel === 'platinum') return badge.thresholds.hall_of_fame;
    if (badge.currentLevel === 'gold') return badge.thresholds.platinum;
    if (badge.currentLevel === 'silver') return badge.thresholds.gold;
    if (badge.currentLevel === 'bronze') return badge.thresholds.silver;
    if (badge.currentLevel === 'brick') return badge.thresholds.bronze;
    return badge.thresholds.brick;
  };
  
  const getCurrentThreshold = () => {
    if (badge.currentLevel === 'goat') return badge.thresholds.legend;
    if (badge.currentLevel === 'legend') return badge.thresholds.hall_of_fame;
    if (badge.currentLevel === 'hall_of_fame') return badge.thresholds.platinum;
    if (badge.currentLevel === 'platinum') return badge.thresholds.gold;
    if (badge.currentLevel === 'gold') return badge.thresholds.silver;
    if (badge.currentLevel === 'silver') return badge.thresholds.bronze;
    if (badge.currentLevel === 'bronze') return badge.thresholds.brick;
    if (badge.currentLevel === 'brick') return 0;
    return 0;
  };
  
  const nextThreshold = getNextThreshold();
  const currentThreshold = getCurrentThreshold();
  const progressRange = nextThreshold - currentThreshold;
  const progressValue = badge.careerValue - currentThreshold;
  const progressPercent = badge.currentLevel === 'goat' 
    ? 100 
    : Math.min(100, Math.round((progressValue / progressRange) * 100));

  const delayOptions = ['delay-100', 'delay-200', 'delay-300', 'delay-400', 'delay-500'];
  const delayClass = delayOptions[Math.min(index, delayOptions.length - 1)];

  return (
    <div 
      className={`p-4 rounded-lg border backdrop-blur-sm transition-all duration-300 animate-fade-up ${delayClass} ${isPremium ? 'sparkle' : ''} ${colors.bg} ${colors.border} ${colors.glow}`}
      data-testid={`skill-badge-${badge.skillType}`}
    >
      <div className="flex items-center gap-3 mb-3 relative z-10">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors.iconGradient} flex items-center justify-center border border-white/20 ${colors.shadowColor}`}>
          <Icon className={`w-5 h-5 ${colors.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`font-semibold text-sm truncate ${colors.text}`}>{badge.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-md font-bold backdrop-blur-sm border ${colors.text} bg-muted/50 border-border`}>
              {LEVEL_NAMES[badge.currentLevel]}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{badge.description}</p>
        </div>
      </div>
      
      <div className="space-y-2 relative z-10">
        <div className="relative">
          <Progress 
            value={progressPercent} 
            className="h-2 bg-muted/50"
            data-testid={`progress-${badge.skillType}`}
          />
          {progressPercent > 0 && badge.currentLevel !== 'none' && (
            <div 
              className={`absolute inset-0 h-2 rounded-full opacity-40 blur-sm pointer-events-none ${colors.shadowColor}`}
              style={{ width: `${progressPercent}%` }}
            />
          )}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground/80 font-medium">
          <span>{badge.careerValue.toLocaleString()}</span>
          <span>{nextThreshold.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

interface SkillBadgesProps {
  playerId: number;
  position?: string;
}

export function SkillBadges({ playerId, position }: SkillBadgesProps) {
  const sport = useSport();
  const { data: skillBadges, isLoading } = usePlayerSkillBadges(playerId);
  
  // Get position-relevant badges
  const relevantBadgeTypes = position 
    ? getBadgesForPosition(sport, position) 
    : null;
  
  // Filter badges by position relevance
  const filteredBadges = relevantBadgeTypes && skillBadges
    ? skillBadges.filter(b => relevantBadgeTypes.includes(b.skillType))
    : skillBadges;

  if (isLoading) {
    return (
      <Card className="p-6 border-border/50" data-testid="skill-badges-loading">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted/30 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted/20 rounded-lg"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!filteredBadges || filteredBadges.length === 0) {
    return null;
  }

  const unlockedBadges = filteredBadges.filter(b => b.currentLevel !== 'none');
  const lockedBadges = filteredBadges.filter(b => b.currentLevel === 'none');

  return (
    <Card className="p-6 border-border/50 overflow-hidden" data-testid="skill-badges">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
            <Target className="w-5 h-5 text-accent" />
          </div>
          <h3 className="text-lg font-bold font-display text-foreground uppercase tracking-wider">Skill Badges</h3>
          {unlockedBadges.length > 0 && (
            <span className="ml-auto text-sm font-medium px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
              {unlockedBadges.length}/{filteredBadges.length}
            </span>
          )}
        </div>
        
        {unlockedBadges.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            {unlockedBadges.map((badge, index) => (
              <SkillBadgeCard key={badge.skillType} badge={badge} index={index} />
            ))}
          </div>
        )}
        
        {lockedBadges.length > 0 && (
          <>
            {unlockedBadges.length > 0 && (
              <div className="border-t border-border/50 pt-5 mt-5">
                <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest mb-3">Locked Badges</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-50">
              {lockedBadges.map((badge, index) => (
                <SkillBadgeCard key={badge.skillType} badge={badge} index={unlockedBadges.length + index} />
              ))}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
