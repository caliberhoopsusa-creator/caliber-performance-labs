import { cn } from "@/lib/utils";

interface StatComparison {
  label: string;
  team1Value: number;
  team2Value: number;
  suffix?: string;
}

interface ComparisonBarChartProps {
  stats: StatComparison[];
  team1Name: string;
  team2Name: string;
}

export function ComparisonBarChart({ stats, team1Name, team2Name }: ComparisonBarChartProps) {
  return (
    <div className="bg-card border border-white/5 rounded-2xl p-6 shadow-xl" data-testid="comparison-bar-chart">
      <h3 className="text-xl font-bold font-display text-white mb-6 text-center uppercase tracking-widest">
        Statistical Comparison
      </h3>
      
      <div className="flex justify-between items-center mb-4 px-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary" />
          <span className="text-sm font-medium text-muted-foreground">{team1Name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">{team2Name}</span>
          <div className="w-4 h-4 rounded bg-white/30" />
        </div>
      </div>
      
      <div className="space-y-6">
        {stats.map((stat, index) => {
          const total = stat.team1Value + stat.team2Value;
          const team1Pct = total > 0 ? (stat.team1Value / total) * 100 : 50;
          const team2Pct = total > 0 ? (stat.team2Value / total) * 100 : 50;
          const team1Wins = stat.team1Value > stat.team2Value;
          const team2Wins = stat.team2Value > stat.team1Value;
          const suffix = stat.suffix || "";

          return (
            <div key={index} className="space-y-2" data-testid={`stat-row-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <span className={cn("tabular-nums", team1Wins && "text-primary")}>
                  {stat.team1Value}{suffix}
                </span>
                <span>{stat.label}</span>
                <span className={cn("tabular-nums", team2Wins && "text-primary")}>
                  {stat.team2Value}{suffix}
                </span>
              </div>
              <div className="flex h-3 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-700 ease-out",
                    team1Wins ? "bg-primary" : "bg-primary/40"
                  )} 
                  style={{ width: `${team1Pct}%` }} 
                />
                <div 
                  className={cn(
                    "h-full transition-all duration-700 ease-out",
                    team2Wins ? "bg-white/50" : "bg-white/20"
                  )} 
                  style={{ width: `${team2Pct}%` }} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
