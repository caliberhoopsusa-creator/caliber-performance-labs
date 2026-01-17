import { cn } from "@/lib/utils";

interface LiveGameStatsProps {
  stats: {
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    fouls: number;
    fgMade: number;
    fgAttempted: number;
    threeMade: number;
    threeAttempted: number;
    ftMade: number;
    ftAttempted: number;
  };
  animatingStats?: Set<string>;
}

export function LiveGameStats({ stats, animatingStats = new Set() }: LiveGameStatsProps) {
  const statItems = [
    { key: "points", label: "PTS", value: stats.points, primary: true },
    { key: "rebounds", label: "REB", value: stats.rebounds },
    { key: "assists", label: "AST", value: stats.assists },
    { key: "steals", label: "STL", value: stats.steals },
    { key: "blocks", label: "BLK", value: stats.blocks },
    { key: "turnovers", label: "TO", value: stats.turnovers, negative: true },
    { key: "fouls", label: "FOULS", value: stats.fouls, negative: true },
  ];

  const fgPct = stats.fgAttempted > 0 ? ((stats.fgMade / stats.fgAttempted) * 100).toFixed(0) : "0";
  const threePct = stats.threeAttempted > 0 ? ((stats.threeMade / stats.threeAttempted) * 100).toFixed(0) : "0";
  const ftPct = stats.ftAttempted > 0 ? ((stats.ftMade / stats.ftAttempted) * 100).toFixed(0) : "0";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-2 text-center">
        {statItems.map((stat) => (
          <div 
            key={stat.key}
            className={cn(
              "p-2 rounded-lg transition-all duration-300",
              stat.primary && "bg-primary/20 border border-primary/30",
              stat.negative && stats[stat.key as keyof typeof stats] >= 4 && "bg-red-500/20",
              animatingStats.has(stat.key) && "scale-110 ring-2 ring-primary"
            )}
            data-testid={`stat-${stat.key}`}
          >
            <div className={cn(
              "stat-value text-2xl md:text-3xl transition-transform duration-200",
              stat.primary && "text-primary",
              stat.negative && stats[stat.key as keyof typeof stats] >= 4 && "text-red-400",
              animatingStats.has(stat.key) && "scale-125"
            )}>
              {stat.value}
            </div>
            <div className="stat-label text-[10px] md:text-xs">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-6 text-sm text-muted-foreground">
        <div className="text-center" data-testid="stat-fg">
          <span className="font-semibold text-foreground">{stats.fgMade}/{stats.fgAttempted}</span>
          <span className="ml-1 text-xs">FG ({fgPct}%)</span>
        </div>
        <div className="text-center" data-testid="stat-three">
          <span className="font-semibold text-foreground">{stats.threeMade}/{stats.threeAttempted}</span>
          <span className="ml-1 text-xs">3PT ({threePct}%)</span>
        </div>
        <div className="text-center" data-testid="stat-ft">
          <span className="font-semibold text-foreground">{stats.ftMade}/{stats.ftAttempted}</span>
          <span className="ml-1 text-xs">FT ({ftPct}%)</span>
        </div>
      </div>
    </div>
  );
}
