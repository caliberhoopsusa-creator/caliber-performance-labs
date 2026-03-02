import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Trophy, Calendar, Users, BarChart3, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CareerTimelineProps {
  playerId: number;
}

interface TimelineEntry {
  season: string;
  seasonData: { name: string; startDate: string; endDate: string; isCurrent: boolean } | null;
  teamName: string | null;
  gamesPlayed: number;
  averages: {
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
  };
  avgGradeNum: number;
  overallGrade: string;
  growth: {
    points: number;
    rebounds: number;
    assists: number;
    gradeChange: number;
  } | null;
}

interface CareerTimelineData {
  careerTotals: {
    gamesPlayed: number;
    totalPoints: number;
    totalRebounds: number;
    totalAssists: number;
    totalSteals: number;
    totalBlocks: number;
    seasonsPlayed: number;
  };
  timeline: TimelineEntry[];
}

function GrowthIndicator({ value, label, suffix }: { value: number; label: string; suffix?: string }) {
  if (value === 0) return null;
  const isPositive = value > 0;
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 text-xs font-medium",
      isPositive ? "text-green-500" : "text-red-400"
    )} data-testid={`growth-${label}`}>
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isPositive ? "+" : ""}{value}{suffix || ""}
    </span>
  );
}

function GradeBadgeSmall({ grade }: { grade: string }) {
  const colorMap: Record<string, string> = {
    'A': 'bg-green-500/20 text-green-400 border-green-500/30',
    'B': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'C': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'D': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'F': 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  const cls = colorMap[grade] || colorMap['C'];
  return (
    <span className={cn("px-2 py-0.5 rounded-md text-xs font-bold border", cls)} data-testid={`grade-badge-${grade}`}>
      {grade}
    </span>
  );
}

export function CareerTimeline({ playerId }: CareerTimelineProps) {
  const { data, isLoading } = useQuery<CareerTimelineData>({
    queryKey: ['/api/players', playerId, 'career-timeline'],
  });

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="career-timeline-loading">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!data || data.timeline.length === 0) {
    return (
      <Card className="p-6 text-center" data-testid="career-timeline-empty">
        <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">No career data available yet. Games will appear here once logged.</p>
      </Card>
    );
  }

  const { careerTotals, timeline } = data;

  return (
    <div className="space-y-6" data-testid="career-timeline">
      <Card className="p-4 md:p-6" data-testid="career-totals">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-accent" />
          <h3 className="font-display font-bold text-lg uppercase tracking-wide">Career Totals</h3>
          <Badge variant="secondary" className="ml-auto" data-testid="text-seasons-count">
            {careerTotals.seasonsPlayed} Season{careerTotals.seasonsPlayed !== 1 ? "s" : ""}
          </Badge>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: "Games", value: careerTotals.gamesPlayed },
            { label: "Points", value: careerTotals.totalPoints },
            { label: "Rebounds", value: careerTotals.totalRebounds },
            { label: "Assists", value: careerTotals.totalAssists },
            { label: "Steals", value: careerTotals.totalSteals },
            { label: "Blocks", value: careerTotals.totalBlocks },
          ].map(stat => (
            <div key={stat.label} className="text-center" data-testid={`career-stat-${stat.label.toLowerCase()}`}>
              <p className="text-xl md:text-2xl font-bold font-display">{stat.value.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="relative">
        <div className="absolute left-4 md:left-6 top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-4">
          {timeline.map((entry, idx) => {
            const isCurrent = entry.seasonData?.isCurrent;
            return (
              <div key={entry.season} className="relative pl-10 md:pl-14" data-testid={`timeline-entry-${entry.season}`}>
                <div className={cn(
                  "absolute left-2.5 md:left-4.5 top-5 w-3 h-3 rounded-full border-2 z-10",
                  isCurrent
                    ? "bg-accent border-accent shadow-lg shadow-accent/30"
                    : "bg-muted border-border"
                )} />

                <Card className={cn("p-4 md:p-5", isCurrent && "border-accent/30")}>
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-display font-bold text-base" data-testid={`text-season-name-${idx}`}>
                          {entry.season}
                        </h4>
                        {isCurrent && (
                          <Badge variant="default" className="text-[10px]" data-testid="badge-current-season">Current</Badge>
                        )}
                        <GradeBadgeSmall grade={entry.overallGrade} />
                      </div>
                      {entry.teamName && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground" data-testid={`text-team-${idx}`}>{entry.teamName}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground" data-testid={`text-games-played-${idx}`}>
                      {entry.gamesPlayed} game{entry.gamesPlayed !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {[
                      { label: "PPG", value: entry.averages.points, growth: entry.growth?.points },
                      { label: "RPG", value: entry.averages.rebounds, growth: entry.growth?.rebounds },
                      { label: "APG", value: entry.averages.assists, growth: entry.growth?.assists },
                      { label: "SPG", value: entry.averages.steals },
                      { label: "BPG", value: entry.averages.blocks },
                    ].map(stat => (
                      <div key={stat.label} className="text-center" data-testid={`stat-${stat.label.toLowerCase()}-${idx}`}>
                        <p className="text-lg font-bold font-display">{stat.value}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                        {stat.growth !== undefined && stat.growth !== null && (
                          <GrowthIndicator value={stat.growth} label={`${stat.label.toLowerCase()}-${idx}`} />
                        )}
                      </div>
                    ))}
                  </div>

                  {entry.growth && entry.growth.gradeChange !== 0 && (
                    <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-xs">
                      <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Grade trend:</span>
                      <GrowthIndicator value={entry.growth.gradeChange} label={`grade-${idx}`} suffix=" pts" />
                    </div>
                  )}
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
