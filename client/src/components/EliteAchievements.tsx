import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSport } from "@/components/SportToggle";

interface EliteAchievementsProps {
  ppg?: number;
  rpg?: number;
  apg?: number;
  ydsPerGame?: number;
  tdsPerGame?: number;
  tacklesPerGame?: number;
}

const BASKETBALL_THRESHOLDS = {
  ppg: [
    { tier: "bronze" as const, min: 15, label: "15+ PPG" },
    { tier: "silver" as const, min: 20, label: "20+ PPG" },
    { tier: "gold" as const, min: 25, label: "25+ PPG" },
    { tier: "elite" as const, min: 30, label: "30+ PPG" },
  ],
  rpg: [
    { tier: "bronze" as const, min: 5, label: "5+ RPG" },
    { tier: "silver" as const, min: 7, label: "7+ RPG" },
    { tier: "gold" as const, min: 10, label: "10+ RPG" },
    { tier: "elite" as const, min: 12, label: "12+ RPG" },
  ],
  apg: [
    { tier: "bronze" as const, min: 4, label: "4+ APG" },
    { tier: "silver" as const, min: 6, label: "6+ APG" },
    { tier: "gold" as const, min: 8, label: "8+ APG" },
    { tier: "elite" as const, min: 10, label: "10+ APG" },
  ],
};

const FOOTBALL_THRESHOLDS = {
  ydsPerGame: [
    { tier: "bronze" as const, min: 50, label: "50+ YPG" },
    { tier: "silver" as const, min: 100, label: "100+ YPG" },
    { tier: "gold" as const, min: 150, label: "150+ YPG" },
    { tier: "elite" as const, min: 200, label: "200+ YPG" },
  ],
  tdsPerGame: [
    { tier: "bronze" as const, min: 0.5, label: "0.5+ TD/G" },
    { tier: "silver" as const, min: 1, label: "1+ TD/G" },
    { tier: "gold" as const, min: 1.5, label: "1.5+ TD/G" },
    { tier: "elite" as const, min: 2, label: "2+ TD/G" },
  ],
  tacklesPerGame: [
    { tier: "bronze" as const, min: 4, label: "4+ TCK/G" },
    { tier: "silver" as const, min: 6, label: "6+ TCK/G" },
    { tier: "gold" as const, min: 8, label: "8+ TCK/G" },
    { tier: "elite" as const, min: 10, label: "10+ TCK/G" },
  ],
};

const TIER_STYLES = {
  bronze: {
    bg: "bg-gradient-to-r from-amber-700/30 to-amber-600/20",
    border: "border-amber-600/50",
    text: "text-amber-500",
    glow: "shadow-amber-600/30",
    fire: "text-amber-500",
  },
  silver: {
    bg: "bg-gradient-to-r from-slate-400/30 to-slate-300/20",
    border: "border-slate-400/50",
    text: "text-slate-300",
    glow: "shadow-slate-400/30",
    fire: "text-slate-300",
  },
  gold: {
    bg: "bg-gradient-to-r from-yellow-500/30 to-amber-400/20",
    border: "border-yellow-500/50",
    text: "text-yellow-400",
    glow: "shadow-yellow-500/40",
    fire: "text-yellow-400",
  },
  elite: {
    bg: "bg-gradient-to-r from-orange-500/40 to-red-500/30",
    border: "border-orange-500/60",
    text: "text-orange-400",
    glow: "shadow-orange-500/50",
    fire: "text-orange-500",
  },
};

type Threshold = { tier: "bronze" | "silver" | "gold" | "elite"; min: number; label: string };

function getAchievementTier(value: number, thresholds: Threshold[]): { tier: "bronze" | "silver" | "gold" | "elite"; label: string } | null {
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (value >= thresholds[i].min) {
      return thresholds[i];
    }
  }
  return null;
}

function AchievementBadge({ label, tier }: { label: string; tier: "bronze" | "silver" | "gold" | "elite" }) {
  const styles = TIER_STYLES[tier];
  const isElite = tier === "elite" || tier === "gold";
  
  return (
    <div
      className={cn(
        "relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border",
        "text-xs font-bold uppercase tracking-wider",
        "transition-all duration-300",
        styles.bg,
        styles.border,
        styles.text,
        isElite && `shadow-lg ${styles.glow}`
      )}
      data-testid={`achievement-badge-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
    >
      {isElite && (
        <>
          <Flame 
            className={cn(
              "w-3.5 h-3.5 absolute -left-1 -top-1",
              styles.fire,
              "animate-pulse"
            )} 
          />
          <Flame 
            className={cn(
              "w-3 h-3 absolute -right-0.5 -top-0.5",
              styles.fire,
              "animate-pulse",
              "animation-delay-150"
            )} 
          />
        </>
      )}
      
      {isElite && (
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
          <div 
            className={cn(
              "absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent",
              ""
            )}
            style={{
              animation: "2s infinite",
            }}
          />
        </div>
      )}
      
      <Flame className={cn("w-3 h-3", styles.fire, isElite && "animate-bounce")} />
      <span className="relative z-10">{label}</span>
    </div>
  );
}

export function EliteAchievements({ ppg, rpg, apg, ydsPerGame, tdsPerGame, tacklesPerGame }: EliteAchievementsProps) {
  const sport = useSport();
  const achievements: { label: string; tier: "bronze" | "silver" | "gold" | "elite" }[] = [];
  
  if (sport === 'basketball') {
    if (ppg !== undefined) {
      const ppgAchievement = getAchievementTier(ppg, BASKETBALL_THRESHOLDS.ppg);
      if (ppgAchievement) achievements.push(ppgAchievement);
    }
    if (rpg !== undefined) {
      const rpgAchievement = getAchievementTier(rpg, BASKETBALL_THRESHOLDS.rpg);
      if (rpgAchievement) achievements.push(rpgAchievement);
    }
    if (apg !== undefined) {
      const apgAchievement = getAchievementTier(apg, BASKETBALL_THRESHOLDS.apg);
      if (apgAchievement) achievements.push(apgAchievement);
    }
  } else {
    if (ydsPerGame !== undefined) {
      const ydsAchievement = getAchievementTier(ydsPerGame, FOOTBALL_THRESHOLDS.ydsPerGame);
      if (ydsAchievement) achievements.push(ydsAchievement);
    }
    if (tdsPerGame !== undefined) {
      const tdsAchievement = getAchievementTier(tdsPerGame, FOOTBALL_THRESHOLDS.tdsPerGame);
      if (tdsAchievement) achievements.push(tdsAchievement);
    }
    if (tacklesPerGame !== undefined) {
      const tacklesAchievement = getAchievementTier(tacklesPerGame, FOOTBALL_THRESHOLDS.tacklesPerGame);
      if (tacklesAchievement) achievements.push(tacklesAchievement);
    }
  }
  
  if (achievements.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2" data-testid="elite-achievements">
      {achievements.map((achievement, index) => (
        <AchievementBadge
          key={`${achievement.label}-${index}`}
          label={achievement.label}
          tier={achievement.tier}
        />
      ))}
    </div>
  );
}
