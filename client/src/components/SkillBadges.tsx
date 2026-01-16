import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { usePlayerSkillBadges, type SkillBadge } from "@/hooks/use-basketball";
import { Target, Crosshair, Zap, Shield, Hand, Grab } from "lucide-react";

const SKILL_ICONS: Record<string, typeof Target> = {
  sharpshooter: Crosshair,
  pure_passer: Zap,
  bucket_getter: Target,
  glass_cleaner: Shield,
  rim_protector: Hand,
  pickpocket: Grab,
};

const LEVEL_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  none: { bg: "bg-muted/30", border: "border-muted", text: "text-muted-foreground" },
  brick: { bg: "bg-red-900/30", border: "border-red-800", text: "text-red-500" },
  bronze: { bg: "bg-amber-900/30", border: "border-amber-700", text: "text-amber-600" },
  silver: { bg: "bg-slate-300/20", border: "border-slate-400", text: "text-slate-300" },
  gold: { bg: "bg-yellow-500/20", border: "border-yellow-500", text: "text-yellow-400" },
  platinum: { bg: "bg-cyan-500/20", border: "border-cyan-400", text: "text-cyan-300" },
  hall_of_fame: { bg: "bg-purple-500/20", border: "border-purple-400", text: "text-purple-400" },
  legend: { bg: "bg-orange-500/20", border: "border-orange-400", text: "text-orange-400" },
  goat: { bg: "bg-gradient-to-r from-yellow-500/30 to-purple-500/30", border: "border-yellow-400", text: "text-yellow-300" },
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

function SkillBadgeCard({ badge }: { badge: SkillBadge }) {
  const Icon = SKILL_ICONS[badge.skillType] || Target;
  const colors = LEVEL_COLORS[badge.currentLevel] || LEVEL_COLORS.none;
  
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

  return (
    <div 
      className={`p-3 rounded-lg border ${colors.bg} ${colors.border} transition-all hover:scale-[1.02]`}
      data-testid={`skill-badge-${badge.skillType}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${colors.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate">{badge.name}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} font-bold`}>
              {LEVEL_NAMES[badge.currentLevel]}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{badge.description}</p>
        </div>
      </div>
      
      <div className="space-y-1">
        <Progress 
          value={progressPercent} 
          className="h-1.5"
          data-testid={`progress-${badge.skillType}`}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{badge.careerValue.toLocaleString()}</span>
          <span>{nextThreshold.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

interface SkillBadgesProps {
  playerId: number;
}

export function SkillBadges({ playerId }: SkillBadgesProps) {
  const { data: skillBadges, isLoading } = usePlayerSkillBadges(playerId);

  if (isLoading) {
    return (
      <Card className="p-4" data-testid="skill-badges-loading">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!skillBadges || skillBadges.length === 0) {
    return null;
  }

  const unlockedBadges = skillBadges.filter(b => b.currentLevel !== 'none');
  const lockedBadges = skillBadges.filter(b => b.currentLevel === 'none');

  return (
    <Card className="p-4" data-testid="skill-badges">
      <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
        <Target className="w-4 h-4 text-primary" /> Skill Badges
      </h4>
      
      {unlockedBadges.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {unlockedBadges.map((badge) => (
            <SkillBadgeCard key={badge.skillType} badge={badge} />
          ))}
        </div>
      )}
      
      {lockedBadges.length > 0 && (
        <>
          {unlockedBadges.length > 0 && (
            <div className="border-t border-border pt-3 mt-3">
              <p className="text-xs text-muted-foreground mb-2">Locked Badges</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 opacity-60">
            {lockedBadges.map((badge) => (
              <SkillBadgeCard key={badge.skillType} badge={badge} />
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
