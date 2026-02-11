import { Users } from "lucide-react";
import { GradeBadge } from "@/components/GradeBadge";
import { cn } from "@/lib/utils";

interface TeamStatsCardProps {
  teamName: string;
  playerCount: number;
  avgGrade: string;
  avgPPG: number;
  avgRPG: number;
  avgAPG: number;
  fgPct: number;
  threePct: number;
  side?: "left" | "right";
}

export function TeamStatsCard({
  teamName,
  playerCount,
  avgGrade,
  avgPPG,
  avgRPG,
  avgAPG,
  fgPct,
  threePct,
  side = "left"
}: TeamStatsCardProps) {
  return (
    <div className={cn(
      "rounded-2xl p-6",
      side === "left" ? "bg-accent/5" : "bg-secondary/5"
    )} data-testid={`card-team-stats-${side}`}>
      <div className="flex flex-col items-center gap-4">
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center text-3xl font-display font-bold shadow-xl",
          side === "left" 
            ? "bg-accent/20 text-accent border-2 border-accent/30" 
            : "bg-secondary text-white border-2 border-white/10"
        )}>
          <Users className="w-10 h-10" />
        </div>
        
        <div className="text-center">
          <h3 className="text-2xl font-bold font-display text-white uppercase tracking-tight" data-testid={`text-team-name-${side}`}>
            {teamName}
          </h3>
          <p className="text-sm text-muted-foreground font-medium">
            {playerCount} Players
          </p>
        </div>

        <GradeBadge grade={avgGrade} size="lg" />

        <div className="grid grid-cols-3 gap-4 w-full mt-2">
          <div className="text-center">
            <p className="text-2xl font-display font-bold text-white">{avgPPG}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">PPG</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-display font-bold text-white">{avgRPG}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">RPG</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-display font-bold text-white">{avgAPG}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">APG</p>
          </div>
        </div>

        <div className="flex gap-6 mt-2">
          <div className="text-center">
            <p className="text-lg font-display font-bold text-white">{fgPct}%</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">FG%</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-display font-bold text-white">{threePct}%</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">3PT%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
