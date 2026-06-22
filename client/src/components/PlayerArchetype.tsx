import { cn } from "@/lib/utils";
import { ARCHETYPES, getPlayerArchetype, type ArchetypeId, type ArchetypeResult } from "@shared/archetypes";
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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


const ARCHETYPE_COLORS: Record<ArchetypeId, { bg: string; border: string; text: string; glow: string }> = {
  scoring_guard: {
    bg: "from-accent/20 to-red-500/20",
    border: "border-accent/40",
    text: "text-accent",
    glow: "shadow-accent/20",
  },
  floor_general: {
    bg: "from-blue-500/20 to-accent/20",
    border: "border-blue-500/40",
    text: "text-blue-400",
    glow: "shadow-blue-500/20",
  },
  three_and_d: {
    bg: "from-green-500/20 to-amber-500/20",
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
    bg: "from-accent/20 to-yellow-500/20",
    border: "border-accent/40",
    text: "text-accent",
    glow: "shadow-accent/20",
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
    text: "text-slate-400",
    glow: "shadow-slate-500/20",
  },
  sharpshooter: {
    bg: "from-yellow-500/20 to-accent/20",
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
    bg: "from-accent/20 to-yellow-400/20",
    border: "border-accent/50",
    text: "text-accent",
    glow: "shadow-accent/30",
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
              "bg-gradient-to-br from-muted to-muted/50",
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
          
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            {primaryArchetype.description}
          </p>
        </div>
      </div>

      {secondaryArchetype && (
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50 border border-border">
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

