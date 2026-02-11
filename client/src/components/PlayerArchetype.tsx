import { cn } from "@/lib/utils";
import { ARCHETYPES, getPlayerArchetype, type ArchetypeId, type ArchetypeResult } from "@shared/archetypes";
import { FOOTBALL_ARCHETYPES, getFootballPlayerArchetype, type FootballArchetypeId, type FootballArchetypeResult } from "@shared/football-archetypes";
import type { Game } from "@shared/schema";
import { 
  Target, 
  Brain, 
  Crosshair, 
  Zap, 
  Maximize2, 
  Shield, 
  Wrench, 
  Flame, 
  Lock, 
  Star,
  ChevronRight,
  Rocket,
  Hand,
  Footprints,
  Eye,
  Anchor,
  Wind,
  Gauge,
  Focus,
  PersonStanding,
  ShieldAlert,
  Radar,
  Swords,
  CircleDot,
  Timer
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSport } from "@/components/SportToggle";

const ARCHETYPE_ICONS: Record<ArchetypeId, React.ElementType> = {
  scoring_guard: Target,
  floor_general: Brain,
  three_and_d: Crosshair,
  two_way_slasher: Zap,
  stretch_big: Maximize2,
  paint_beast: Shield,
  glue_guy: Wrench,
  sharpshooter: Flame,
  lockdown_defender: Lock,
  all_around_star: Star,
};

const FOOTBALL_ARCHETYPE_ICONS: Record<FootballArchetypeId, React.ElementType> = {
  pocket_passer: Target,
  dual_threat_qb: Zap,
  game_manager: Brain,
  power_back: Shield,
  speed_back: Rocket,
  receiving_back: Hand,
  deep_threat: Rocket,
  possession_receiver: Hand,
  playmaker_wr: Star,
  blocking_te: Anchor,
  receiving_te: Focus,
  run_stuffer: ShieldAlert,
  pass_rusher: Swords,
  run_stopper_lb: Shield,
  coverage_lb: Radar,
  blitzer: Zap,
  shutdown_corner: Lock,
  ballhawk: Eye,
  hard_hitter: Flame,
  accurate_kicker: Target,
  power_leg: Wind,
  precision_punter: CircleDot,
};

const ARCHETYPE_COLORS: Record<ArchetypeId, { bg: string; border: string; text: string; glow: string }> = {
  scoring_guard: {
    bg: "from-orange-500/20 to-red-500/20",
    border: "border-orange-500/40",
    text: "text-orange-400",
    glow: "shadow-orange-500/20",
  },
  floor_general: {
    bg: "from-blue-500/20 to-accent/20",
    border: "border-blue-500/40",
    text: "text-blue-400",
    glow: "shadow-blue-500/20",
  },
  three_and_d: {
    bg: "from-green-500/20 to-teal-500/20",
    border: "border-green-500/40",
    text: "text-green-400",
    glow: "shadow-green-500/20",
  },
  two_way_slasher: {
    bg: "from-purple-500/20 to-pink-500/20",
    border: "border-purple-500/40",
    text: "text-purple-400",
    glow: "shadow-purple-500/20",
  },
  stretch_big: {
    bg: "from-amber-500/20 to-yellow-500/20",
    border: "border-amber-500/40",
    text: "text-amber-400",
    glow: "shadow-amber-500/20",
  },
  paint_beast: {
    bg: "from-red-500/20 to-rose-500/20",
    border: "border-red-500/40",
    text: "text-red-400",
    glow: "shadow-red-500/20",
  },
  glue_guy: {
    bg: "from-slate-500/20 to-gray-500/20",
    border: "border-slate-400/40",
    text: "text-slate-300",
    glow: "shadow-slate-500/20",
  },
  sharpshooter: {
    bg: "from-yellow-500/20 to-orange-500/20",
    border: "border-yellow-500/40",
    text: "text-yellow-400",
    glow: "shadow-yellow-500/20",
  },
  lockdown_defender: {
    bg: "from-indigo-500/20 to-blue-500/20",
    border: "border-indigo-500/40",
    text: "text-indigo-400",
    glow: "shadow-indigo-500/20",
  },
  all_around_star: {
    bg: "from-amber-500/20 to-yellow-400/20",
    border: "border-amber-400/50",
    text: "text-amber-300",
    glow: "shadow-amber-400/30",
  },
};

const FOOTBALL_ARCHETYPE_COLORS: Record<FootballArchetypeId, { bg: string; border: string; text: string; glow: string }> = {
  pocket_passer: {
    bg: "from-blue-500/20 to-accent/20",
    border: "border-blue-500/40",
    text: "text-blue-400",
    glow: "shadow-blue-500/20",
  },
  dual_threat_qb: {
    bg: "from-purple-500/20 to-pink-500/20",
    border: "border-purple-500/40",
    text: "text-purple-400",
    glow: "shadow-purple-500/20",
  },
  game_manager: {
    bg: "from-slate-500/20 to-gray-500/20",
    border: "border-slate-400/40",
    text: "text-slate-300",
    glow: "shadow-slate-500/20",
  },
  power_back: {
    bg: "from-red-500/20 to-orange-500/20",
    border: "border-red-500/40",
    text: "text-red-400",
    glow: "shadow-red-500/20",
  },
  speed_back: {
    bg: "from-yellow-500/20 to-amber-500/20",
    border: "border-yellow-500/40",
    text: "text-yellow-400",
    glow: "shadow-yellow-500/20",
  },
  receiving_back: {
    bg: "from-accent/20 to-teal-500/20",
    border: "border-accent/40",
    text: "text-accent",
    glow: "shadow-accent/20",
  },
  deep_threat: {
    bg: "from-orange-500/20 to-red-500/20",
    border: "border-orange-500/40",
    text: "text-orange-400",
    glow: "shadow-orange-500/20",
  },
  possession_receiver: {
    bg: "from-green-500/20 to-teal-500/20",
    border: "border-green-500/40",
    text: "text-green-400",
    glow: "shadow-green-500/20",
  },
  playmaker_wr: {
    bg: "from-amber-500/20 to-yellow-400/20",
    border: "border-amber-400/50",
    text: "text-amber-300",
    glow: "shadow-amber-400/30",
  },
  blocking_te: {
    bg: "from-stone-500/20 to-gray-500/20",
    border: "border-stone-400/40",
    text: "text-stone-300",
    glow: "shadow-stone-500/20",
  },
  receiving_te: {
    bg: "from-indigo-500/20 to-blue-500/20",
    border: "border-indigo-500/40",
    text: "text-indigo-400",
    glow: "shadow-indigo-500/20",
  },
  run_stuffer: {
    bg: "from-red-600/20 to-rose-500/20",
    border: "border-red-500/40",
    text: "text-red-400",
    glow: "shadow-red-500/20",
  },
  pass_rusher: {
    bg: "from-violet-500/20 to-purple-500/20",
    border: "border-violet-500/40",
    text: "text-violet-400",
    glow: "shadow-violet-500/20",
  },
  run_stopper_lb: {
    bg: "from-orange-600/20 to-amber-500/20",
    border: "border-orange-500/40",
    text: "text-orange-400",
    glow: "shadow-orange-500/20",
  },
  coverage_lb: {
    bg: "from-sky-500/20 to-blue-500/20",
    border: "border-sky-500/40",
    text: "text-sky-400",
    glow: "shadow-sky-500/20",
  },
  blitzer: {
    bg: "from-rose-500/20 to-pink-500/20",
    border: "border-rose-500/40",
    text: "text-rose-400",
    glow: "shadow-rose-500/20",
  },
  shutdown_corner: {
    bg: "from-indigo-600/20 to-blue-600/20",
    border: "border-indigo-500/40",
    text: "text-indigo-400",
    glow: "shadow-indigo-500/20",
  },
  ballhawk: {
    bg: "from-emerald-500/20 to-green-500/20",
    border: "border-emerald-500/40",
    text: "text-emerald-400",
    glow: "shadow-emerald-500/20",
  },
  hard_hitter: {
    bg: "from-red-500/20 to-rose-500/20",
    border: "border-red-500/40",
    text: "text-red-400",
    glow: "shadow-red-500/20",
  },
  accurate_kicker: {
    bg: "from-teal-500/20 to-accent/20",
    border: "border-teal-500/40",
    text: "text-teal-400",
    glow: "shadow-teal-500/20",
  },
  power_leg: {
    bg: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/40",
    text: "text-amber-400",
    glow: "shadow-amber-500/20",
  },
  precision_punter: {
    bg: "from-accent/20 to-sky-500/20",
    border: "border-accent/40",
    text: "text-accent",
    glow: "shadow-accent/20",
  },
};

interface PlayerArchetypeProps {
  games: Game[];
  position: string;
  variant?: "full" | "badge" | "compact";
  className?: string;
}

export function PlayerArchetype({ 
  games, 
  position, 
  variant = "full",
  className 
}: PlayerArchetypeProps) {
  const sport = useSport();
  const isFootball = sport === 'football';
  
  if (isFootball) {
    return <FootballPlayerArchetype games={games} position={position} variant={variant} className={className} />;
  }
  
  const basketballPosition = position as "Guard" | "Wing" | "Big";
  const result = getPlayerArchetype(games, basketballPosition);

  if (!result) {
    return (
      <div className={cn("text-muted-foreground text-sm", className)} data-testid="archetype-empty">
        Play more games to discover your play style
      </div>
    );
  }

  const primaryArchetype = ARCHETYPES[result.primary];
  const secondaryArchetype = result.secondary ? ARCHETYPES[result.secondary] : null;
  const PrimaryIcon = ARCHETYPE_ICONS[result.primary];
  const primaryColors = ARCHETYPE_COLORS[result.primary];

  if (variant === "badge") {
    return (
      <Badge 
        className={cn(
          "gap-1.5 px-3 py-1.5 font-bold uppercase tracking-wider text-xs",
          "bg-gradient-to-r",
          primaryColors.bg,
          "border",
          primaryColors.border,
          primaryColors.text,
          className
        )}
        data-testid="archetype-badge"
      >
        <PrimaryIcon className="w-3.5 h-3.5" />
        {primaryArchetype.name}
      </Badge>
    );
  }

  if (variant === "compact") {
    return (
      <div 
        className={cn(
          "inline-flex items-center gap-2 px-3 py-2 rounded-lg",
          "bg-gradient-to-r",
          primaryColors.bg,
          "border",
          primaryColors.border,
          className
        )}
        data-testid="archetype-compact"
      >
        <PrimaryIcon className={cn("w-5 h-5", primaryColors.text)} />
        <div>
          <div className={cn("font-bold text-sm uppercase tracking-wide", primaryColors.text)}>
            {primaryArchetype.name}
          </div>
          <div className="text-xs text-muted-foreground">
            {primaryArchetype.shortDescription}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn("space-y-3", className)}
      data-testid="archetype-full"
    >
      <div 
        className={cn(
          "relative overflow-hidden rounded-xl p-5",
          "bg-gradient-to-br",
          primaryColors.bg,
          "border-2",
          primaryColors.border,
          "shadow-lg",
          primaryColors.glow
        )}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-start gap-4">
            <div className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center",
              "bg-gradient-to-br from-white/10 to-white/5",
              "border",
              primaryColors.border
            )}>
              <PrimaryIcon className={cn("w-7 h-7", primaryColors.text)} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Your Play Style
                </span>
              </div>
              <h3 className={cn(
                "text-2xl font-display font-bold uppercase tracking-tight",
                primaryColors.text
              )}>
                {primaryArchetype.name}
              </h3>
            </div>
          </div>
          
          <p className="mt-4 text-sm text-white/80 leading-relaxed">
            {primaryArchetype.description}
          </p>
        </div>
      </div>

      {secondaryArchetype && (
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            {(() => {
              const SecondaryIcon = ARCHETYPE_ICONS[result.secondary!];
              const secondaryColors = ARCHETYPE_COLORS[result.secondary!];
              return (
                <>
                  <SecondaryIcon className={cn("w-4 h-4", secondaryColors.text)} />
                  <span className="text-sm text-muted-foreground">Also plays like a</span>
                  <span className={cn("font-bold text-sm uppercase tracking-wide", secondaryColors.text)}>
                    {secondaryArchetype.name}
                  </span>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

export function ArchetypeBadgeSimple({ 
  archetypeId, 
  className 
}: { 
  archetypeId: ArchetypeId; 
  className?: string;
}) {
  const archetype = ARCHETYPES[archetypeId];
  const Icon = ARCHETYPE_ICONS[archetypeId];
  const colors = ARCHETYPE_COLORS[archetypeId];

  return (
    <Badge 
      className={cn(
        "gap-1.5 px-2.5 py-1 font-bold uppercase tracking-wider text-[10px]",
        "bg-gradient-to-r",
        colors.bg,
        "border",
        colors.border,
        colors.text,
        className
      )}
      data-testid={`archetype-badge-${archetypeId}`}
    >
      <Icon className="w-3 h-3" />
      {archetype.name}
    </Badge>
  );
}

function FootballPlayerArchetype({ 
  games, 
  position, 
  variant = "full",
  className 
}: PlayerArchetypeProps) {
  const result = getFootballPlayerArchetype(games, position);

  if (!result) {
    return (
      <div className={cn("text-muted-foreground text-sm", className)} data-testid="archetype-empty">
        Play more games to discover your play style
      </div>
    );
  }

  const primaryArchetype = FOOTBALL_ARCHETYPES[result.primary];
  const secondaryArchetype = result.secondary ? FOOTBALL_ARCHETYPES[result.secondary] : null;
  const PrimaryIcon = FOOTBALL_ARCHETYPE_ICONS[result.primary];
  const primaryColors = FOOTBALL_ARCHETYPE_COLORS[result.primary];

  if (variant === "badge") {
    return (
      <Badge 
        className={cn(
          "gap-1.5 px-3 py-1.5 font-bold uppercase tracking-wider text-xs",
          "bg-gradient-to-r",
          primaryColors.bg,
          "border",
          primaryColors.border,
          primaryColors.text,
          className
        )}
        data-testid="archetype-badge"
      >
        <PrimaryIcon className="w-3.5 h-3.5" />
        {primaryArchetype.name}
      </Badge>
    );
  }

  if (variant === "compact") {
    return (
      <div 
        className={cn(
          "inline-flex items-center gap-2 px-3 py-2 rounded-lg",
          "bg-gradient-to-r",
          primaryColors.bg,
          "border",
          primaryColors.border,
          className
        )}
        data-testid="archetype-compact"
      >
        <PrimaryIcon className={cn("w-5 h-5", primaryColors.text)} />
        <div>
          <div className={cn("font-bold text-sm uppercase tracking-wide", primaryColors.text)}>
            {primaryArchetype.name}
          </div>
          <div className="text-xs text-muted-foreground">
            {primaryArchetype.shortDescription}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn("space-y-3", className)}
      data-testid="archetype-full"
    >
      <div 
        className={cn(
          "relative overflow-hidden rounded-xl p-5",
          "bg-gradient-to-br",
          primaryColors.bg,
          "border-2",
          primaryColors.border,
          "shadow-lg",
          primaryColors.glow
        )}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-start gap-4">
            <div className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center",
              "bg-gradient-to-br from-white/10 to-white/5",
              "border",
              primaryColors.border
            )}>
              <PrimaryIcon className={cn("w-7 h-7", primaryColors.text)} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Your Play Style
                </span>
              </div>
              <h3 className={cn(
                "text-2xl font-display font-bold uppercase tracking-tight",
                primaryColors.text
              )}>
                {primaryArchetype.name}
              </h3>
            </div>
          </div>
          
          <p className="mt-4 text-sm text-white/80 leading-relaxed">
            {primaryArchetype.description}
          </p>
        </div>
      </div>

      {secondaryArchetype && (
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            {(() => {
              const SecondaryIcon = FOOTBALL_ARCHETYPE_ICONS[result.secondary!];
              const secondaryColors = FOOTBALL_ARCHETYPE_COLORS[result.secondary!];
              return (
                <>
                  <SecondaryIcon className={cn("w-4 h-4", secondaryColors.text)} />
                  <span className="text-sm text-muted-foreground">Also plays like a</span>
                  <span className={cn("font-bold text-sm uppercase tracking-wide", secondaryColors.text)}>
                    {secondaryArchetype.name}
                  </span>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

export function FootballArchetypeBadgeSimple({ 
  archetypeId, 
  className 
}: { 
  archetypeId: FootballArchetypeId; 
  className?: string;
}) {
  const archetype = FOOTBALL_ARCHETYPES[archetypeId];
  const Icon = FOOTBALL_ARCHETYPE_ICONS[archetypeId];
  const colors = FOOTBALL_ARCHETYPE_COLORS[archetypeId];

  return (
    <Badge 
      className={cn(
        "gap-1.5 px-2.5 py-1 font-bold uppercase tracking-wider text-[10px]",
        "bg-gradient-to-r",
        colors.bg,
        "border",
        colors.border,
        colors.text,
        className
      )}
      data-testid={`archetype-badge-${archetypeId}`}
    >
      <Icon className="w-3 h-3" />
      {archetype.name}
    </Badge>
  );
}
