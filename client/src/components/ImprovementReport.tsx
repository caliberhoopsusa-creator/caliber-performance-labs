import { useState, useMemo, useRef } from "react";
import { usePlayer } from "@/hooks/use-basketball";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSport } from "@/components/SportToggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Printer,
  Download,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Game } from "@shared/schema";

// Premium tooltip component with glassmorphic styling
const PremiumTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/80 backdrop-blur-md border border-primary/20 rounded-lg p-3 shadow-xl shadow-primary/10">
        <p className="text-xs text-muted-foreground">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

type TimePeriod = "7" | "30" | "season";

interface ImprovementReportProps {
  playerId: number;
}

const GRADE_VALUES: Record<string, number> = {
  "A+": 12,
  "A": 11,
  "A-": 10,
  "B+": 9,
  "B": 8,
  "B-": 7,
  "C+": 6,
  "C": 5,
  "C-": 4,
  "D+": 3,
  "D": 2,
  "D-": 1,
  "F": 0,
};

const GRADE_COLORS: Record<string, string> = {
  "A+": "#22c55e",
  "A": "#22c55e",
  "A-": "#4ade80",
  "B+": "#60a5fa",
  "B": "#3b82f6",
  "B-": "#93c5fd",
  "C+": "#fbbf24",
  "C": "#f59e0b",
  "C-": "#fcd34d",
  "D+": "#f97316",
  "D": "#ea580c",
  "D-": "#fb923c",
  "F": "#ef4444",
};

function gradeToValue(grade: string | null): number {
  return grade ? (GRADE_VALUES[grade] ?? 5) : 5;
}

function valueToGrade(value: number): string {
  const rounded = Math.round(value);
  const entries = Object.entries(GRADE_VALUES);
  const closest = entries.reduce((prev, curr) =>
    Math.abs(curr[1] - rounded) < Math.abs(prev[1] - rounded) ? curr : prev
  );
  return closest[0];
}

function filterGamesByPeriod(games: Game[], period: TimePeriod): Game[] {
  const now = new Date();
  const cutoff = new Date();
  
  if (period === "7") {
    cutoff.setDate(now.getDate() - 7);
  } else if (period === "30") {
    cutoff.setDate(now.getDate() - 30);
  } else {
    cutoff.setFullYear(now.getFullYear() - 1);
  }
  
  return games.filter((g) => new Date(g.date) >= cutoff);
}

function getPreviousPeriodGames(games: Game[], period: TimePeriod): Game[] {
  const now = new Date();
  let startCutoff = new Date();
  let endCutoff = new Date();
  
  if (period === "7") {
    startCutoff.setDate(now.getDate() - 14);
    endCutoff.setDate(now.getDate() - 7);
  } else if (period === "30") {
    startCutoff.setDate(now.getDate() - 60);
    endCutoff.setDate(now.getDate() - 30);
  } else {
    startCutoff.setFullYear(now.getFullYear() - 2);
    endCutoff.setFullYear(now.getFullYear() - 1);
  }
  
  return games.filter((g) => {
    const date = new Date(g.date);
    return date >= startCutoff && date < endCutoff;
  });
}

function calculateAverages(games: Game[]) {
  if (games.length === 0) {
    return {
      points: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      fgPercent: 0,
      threePercent: 0,
      ftPercent: 0,
      avgGrade: 0,
      gamesPlayed: 0,
    };
  }

  const totals = games.reduce(
    (acc, g) => ({
      points: acc.points + g.points,
      rebounds: acc.rebounds + g.rebounds,
      assists: acc.assists + g.assists,
      steals: acc.steals + g.steals,
      blocks: acc.blocks + g.blocks,
      turnovers: acc.turnovers + g.turnovers,
      fgMade: acc.fgMade + g.fgMade,
      fgAttempted: acc.fgAttempted + g.fgAttempted,
      threeMade: acc.threeMade + g.threeMade,
      threeAttempted: acc.threeAttempted + g.threeAttempted,
      ftMade: acc.ftMade + g.ftMade,
      ftAttempted: acc.ftAttempted + g.ftAttempted,
      gradeSum: acc.gradeSum + gradeToValue(g.grade),
    }),
    {
      points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0,
      fgMade: 0, fgAttempted: 0, threeMade: 0, threeAttempted: 0,
      ftMade: 0, ftAttempted: 0, gradeSum: 0,
    }
  );

  const count = games.length;
  return {
    points: totals.points / count,
    rebounds: totals.rebounds / count,
    assists: totals.assists / count,
    steals: totals.steals / count,
    blocks: totals.blocks / count,
    turnovers: totals.turnovers / count,
    fgPercent: totals.fgAttempted > 0 ? (totals.fgMade / totals.fgAttempted) * 100 : 0,
    threePercent: totals.threeAttempted > 0 ? (totals.threeMade / totals.threeAttempted) * 100 : 0,
    ftPercent: totals.ftAttempted > 0 ? (totals.ftMade / totals.ftAttempted) * 100 : 0,
    avgGrade: totals.gradeSum / count,
    gamesPlayed: count,
  };
}

function calculateFootballAverages(games: Game[]) {
  if (games.length === 0) {
    return {
      passingYards: 0,
      rushingYards: 0,
      receivingYards: 0,
      totalTDs: 0,
      tackles: 0,
      sacks: 0,
      interceptions: 0,
      compPercent: 0,
      avgGrade: 0,
      gamesPlayed: 0,
    };
  }

  const totals = games.reduce(
    (acc, g) => ({
      passingYards: acc.passingYards + (g.passingYards || 0),
      rushingYards: acc.rushingYards + (g.rushingYards || 0),
      receivingYards: acc.receivingYards + (g.receivingYards || 0),
      passingTDs: acc.passingTDs + (g.passingTouchdowns || 0),
      rushingTDs: acc.rushingTDs + (g.rushingTouchdowns || 0),
      receivingTDs: acc.receivingTDs + (g.receivingTouchdowns || 0),
      tackles: acc.tackles + (g.tackles || 0),
      sacks: acc.sacks + (g.sacks || 0),
      interceptions: acc.interceptions + (g.defensiveInterceptions || 0),
      completions: acc.completions + (g.completions || 0),
      passAttempts: acc.passAttempts + (g.passAttempts || 0),
      gradeSum: acc.gradeSum + gradeToValue(g.grade),
    }),
    {
      passingYards: 0, rushingYards: 0, receivingYards: 0,
      passingTDs: 0, rushingTDs: 0, receivingTDs: 0,
      tackles: 0, sacks: 0, interceptions: 0,
      completions: 0, passAttempts: 0, gradeSum: 0,
    }
  );

  const count = games.length;
  return {
    passingYards: totals.passingYards / count,
    rushingYards: totals.rushingYards / count,
    receivingYards: totals.receivingYards / count,
    totalTDs: (totals.passingTDs + totals.rushingTDs + totals.receivingTDs) / count,
    tackles: totals.tackles / count,
    sacks: totals.sacks / count,
    interceptions: totals.interceptions / count,
    compPercent: totals.passAttempts > 0 ? (totals.completions / totals.passAttempts) * 100 : 0,
    avgGrade: totals.gradeSum / count,
    gamesPlayed: count,
  };
}

function TrendIndicator({
  current,
  previous,
  inverted = false,
}: {
  current: number;
  previous: number;
  inverted?: boolean;
}) {
  const diff = current - previous;
  const percentChange = previous !== 0 ? ((diff / previous) * 100) : (diff > 0 ? 100 : 0);
  const threshold = 0.5;

  if (Math.abs(diff) < threshold) {
    return (
      <span className="flex items-center gap-1 text-muted-foreground text-xs">
        <Minus className="w-3 h-3" />
        <span>No change</span>
      </span>
    );
  }

  const isPositive = inverted ? diff < 0 : diff > 0;

  return (
    <span
      className={cn(
        "flex items-center gap-1 text-xs font-medium",
        isPositive ? "text-green-500" : "text-red-500"
      )}
    >
      {isPositive ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      <span>
        {diff > 0 ? "+" : ""}
        {diff.toFixed(1)} ({percentChange > 0 ? "+" : ""}{percentChange.toFixed(0)}%)
      </span>
    </span>
  );
}

function StatComparisonCard({
  label,
  current,
  previous,
  format = "number",
  inverted = false,
}: {
  label: string;
  current: number;
  previous: number;
  format?: "number" | "percent";
  inverted?: boolean;
}) {
  const displayCurrent = format === "percent" ? `${current.toFixed(1)}%` : current.toFixed(1);

  return (
    <div
      className="bg-secondary/20 rounded-lg p-3 space-y-1"
      data-testid={`stat-comparison-${label.toLowerCase().replace(/\s/g, "-")}`}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold">{displayCurrent}</p>
      <TrendIndicator current={current} previous={previous} inverted={inverted} />
    </div>
  );
}

export function ImprovementReport({ playerId }: ImprovementReportProps) {
  const [period, setPeriod] = useState<TimePeriod>("30");
  const reportRef = useRef<HTMLDivElement>(null);
  const { data: player, isLoading } = usePlayer(playerId);
  const sport = useSport();
  const isFootball = sport === 'football';

  const games = useMemo(() => {
    const allGames = player?.games ?? [];
    // Filter games by current sport
    return allGames.filter(g => g.sport === sport);
  }, [player, sport]);

  const { currentPeriodGames, previousPeriodGames, currentStats, previousStats, footballStats, prevFootballStats } = useMemo(() => {
    const current = filterGamesByPeriod(games, period);
    const previous = getPreviousPeriodGames(games, period);
    return {
      currentPeriodGames: current,
      previousPeriodGames: previous,
      currentStats: calculateAverages(current),
      previousStats: calculateAverages(previous),
      footballStats: calculateFootballAverages(current),
      prevFootballStats: calculateFootballAverages(previous),
    };
  }, [games, period]);

  const gradeDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    currentPeriodGames.forEach((g) => {
      const grade = g.grade || "C";
      distribution[grade] = (distribution[grade] || 0) + 1;
    });
    return Object.entries(distribution)
      .map(([grade, count]) => ({
        name: grade,
        value: count,
        color: GRADE_COLORS[grade] || "#6b7280",
      }))
      .sort((a, b) => (GRADE_VALUES[b.name] || 0) - (GRADE_VALUES[a.name] || 0));
  }, [currentPeriodGames]);

  const trendData = useMemo(() => {
    return currentPeriodGames
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((g) => ({
        date: new Date(g.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        points: g.points,
        rebounds: g.rebounds,
        assists: g.assists,
        grade: gradeToValue(g.grade),
      }));
  }, [currentPeriodGames]);

  const improvements = useMemo(() => {
    const items: { label: string; change: number; type: "improvement" | "decline" }[] = [];
    
    if (isFootball) {
      const footballStatsList = [
        { key: "passingYards", label: "Pass YDS" },
        { key: "rushingYards", label: "Rush YDS" },
        { key: "receivingYards", label: "Rec YDS" },
        { key: "totalTDs", label: "Total TDs" },
        { key: "tackles", label: "Tackles" },
        { key: "sacks", label: "Sacks" },
        { key: "interceptions", label: "INTs" },
        { key: "compPercent", label: "CMP%" },
      ] as const;

      footballStatsList.forEach(({ key, label }) => {
        const diff = footballStats[key] - prevFootballStats[key];
        if (Math.abs(diff) > 0.5) {
          items.push({
            label,
            change: diff,
            type: diff > 0 ? "improvement" : "decline",
          });
        }
      });
    } else {
      const stats = [
        { key: "points", label: "Points" },
        { key: "rebounds", label: "Rebounds" },
        { key: "assists", label: "Assists" },
        { key: "steals", label: "Steals" },
        { key: "blocks", label: "Blocks" },
        { key: "fgPercent", label: "FG%" },
        { key: "threePercent", label: "3PT%" },
      ] as const;

      stats.forEach(({ key, label }) => {
        const diff = currentStats[key] - previousStats[key];
        if (Math.abs(diff) > 0.5) {
          items.push({
            label,
            change: diff,
            type: diff > 0 ? "improvement" : "decline",
          });
        }
      });

      const toDiff = previousStats.turnovers - currentStats.turnovers;
      if (Math.abs(toDiff) > 0.3) {
        items.push({
          label: "Turnovers",
          change: toDiff,
          type: toDiff > 0 ? "improvement" : "decline",
        });
      }
    }

    return items.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  }, [currentStats, previousStats, footballStats, prevFootballStats, isFootball]);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!player) return;

    const averages = isFootball 
      ? {
          passingYards: footballStats.passingYards.toFixed(1),
          rushingYards: footballStats.rushingYards.toFixed(1),
          receivingYards: footballStats.receivingYards.toFixed(1),
          totalTDs: footballStats.totalTDs.toFixed(1),
          tackles: footballStats.tackles.toFixed(1),
          sacks: footballStats.sacks.toFixed(1),
          interceptions: footballStats.interceptions.toFixed(1),
          compPercent: footballStats.compPercent.toFixed(1),
          averageGrade: valueToGrade(footballStats.avgGrade),
        }
      : {
          points: currentStats.points.toFixed(1),
          rebounds: currentStats.rebounds.toFixed(1),
          assists: currentStats.assists.toFixed(1),
          steals: currentStats.steals.toFixed(1),
          blocks: currentStats.blocks.toFixed(1),
          turnovers: currentStats.turnovers.toFixed(1),
          fgPercent: currentStats.fgPercent.toFixed(1),
          threePercent: currentStats.threePercent.toFixed(1),
          ftPercent: currentStats.ftPercent.toFixed(1),
          averageGrade: valueToGrade(currentStats.avgGrade),
        };

    const data = {
      player: player.name,
      sport: isFootball ? 'football' : 'basketball',
      period: period === "7" ? "Last 7 Days" : period === "30" ? "Last 30 Days" : "Season",
      gamesPlayed: isFootball ? footballStats.gamesPlayed : currentStats.gamesPlayed,
      averages,
      improvements: improvements.filter((i) => i.type === "improvement").map((i) => i.label),
      areasToImprove: improvements.filter((i) => i.type === "decline").map((i) => i.label),
      gradeDistribution,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${player.name.replace(/\s/g, "_")}_improvement_report.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse" data-testid="loading-improvement-report">
        <div className="h-12 bg-secondary/30 rounded-lg" />
        <div className="h-64 bg-secondary/30 rounded-lg" />
        <div className="h-48 bg-secondary/30 rounded-lg" />
      </div>
    );
  }

  if (!player) {
    return (
      <Card data-testid="improvement-report-error">
        <CardContent className="py-8 text-center text-muted-foreground">
          Player not found
        </CardContent>
      </Card>
    );
  }

  const periodLabel = period === "7" ? "Last 7 Days" : period === "30" ? "Last 30 Days" : "Season";

  return (
    <div ref={reportRef} className="space-y-6 print:p-4" data-testid="improvement-report">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold" data-testid="report-player-name">
            {player.name} - Improvement Report
          </h2>
          <p className="text-muted-foreground text-sm">
            {currentStats.gamesPlayed} games in {periodLabel.toLowerCase()}
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <Select value={period} onValueChange={(v) => setPeriod(v as TimePeriod)}>
            <SelectTrigger className="w-[160px]" data-testid="select-period">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7" data-testid="period-option-7">Last 7 Days</SelectItem>
              <SelectItem value="30" data-testid="period-option-30">Last 30 Days</SelectItem>
              <SelectItem value="season" data-testid="period-option-season">Season</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={handlePrint} data-testid="button-print">
            <Printer className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleExport} data-testid="button-export">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {currentStats.gamesPlayed === 0 ? (
        <Card data-testid="no-games-message">
          <CardContent className="py-12 text-center">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No games recorded in this time period.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card data-testid="stat-averages-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Stat Averages vs Previous Period
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isFootball ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  <StatComparisonCard
                    label="Pass YDS"
                    current={footballStats.passingYards}
                    previous={prevFootballStats.passingYards}
                  />
                  <StatComparisonCard
                    label="Rush YDS"
                    current={footballStats.rushingYards}
                    previous={prevFootballStats.rushingYards}
                  />
                  <StatComparisonCard
                    label="Rec YDS"
                    current={footballStats.receivingYards}
                    previous={prevFootballStats.receivingYards}
                  />
                  <StatComparisonCard
                    label="Total TDs"
                    current={footballStats.totalTDs}
                    previous={prevFootballStats.totalTDs}
                  />
                  <StatComparisonCard
                    label="Tackles"
                    current={footballStats.tackles}
                    previous={prevFootballStats.tackles}
                  />
                  <StatComparisonCard
                    label="Sacks"
                    current={footballStats.sacks}
                    previous={prevFootballStats.sacks}
                  />
                  <StatComparisonCard
                    label="INTs"
                    current={footballStats.interceptions}
                    previous={prevFootballStats.interceptions}
                  />
                  <StatComparisonCard
                    label="CMP%"
                    current={footballStats.compPercent}
                    previous={prevFootballStats.compPercent}
                    format="percent"
                  />
                  <div
                    className="bg-secondary/20 rounded-lg p-3 space-y-1"
                    data-testid="stat-comparison-avg-grade"
                  >
                    <p className="text-xs text-muted-foreground">Avg Grade</p>
                    <p className="text-xl font-bold">{valueToGrade(footballStats.avgGrade)}</p>
                    <TrendIndicator
                      current={footballStats.avgGrade}
                      previous={prevFootballStats.avgGrade}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  <StatComparisonCard
                    label="Points"
                    current={currentStats.points}
                    previous={previousStats.points}
                  />
                  <StatComparisonCard
                    label="Rebounds"
                    current={currentStats.rebounds}
                    previous={previousStats.rebounds}
                  />
                  <StatComparisonCard
                    label="Assists"
                    current={currentStats.assists}
                    previous={previousStats.assists}
                  />
                  <StatComparisonCard
                    label="Steals"
                    current={currentStats.steals}
                    previous={previousStats.steals}
                  />
                  <StatComparisonCard
                    label="Blocks"
                    current={currentStats.blocks}
                    previous={previousStats.blocks}
                  />
                  <StatComparisonCard
                    label="Turnovers"
                    current={currentStats.turnovers}
                    previous={previousStats.turnovers}
                    inverted
                  />
                  <StatComparisonCard
                    label="FG%"
                    current={currentStats.fgPercent}
                    previous={previousStats.fgPercent}
                    format="percent"
                  />
                  <StatComparisonCard
                    label="3PT%"
                    current={currentStats.threePercent}
                    previous={previousStats.threePercent}
                    format="percent"
                  />
                  <StatComparisonCard
                    label="FT%"
                    current={currentStats.ftPercent}
                    previous={previousStats.ftPercent}
                    format="percent"
                  />
                  <div
                    className="bg-secondary/20 rounded-lg p-3 space-y-1"
                    data-testid="stat-comparison-avg-grade"
                  >
                    <p className="text-xs text-muted-foreground">Avg Grade</p>
                    <p className="text-xl font-bold">{valueToGrade(currentStats.avgGrade)}</p>
                    <TrendIndicator
                      current={currentStats.avgGrade}
                      previous={previousStats.avgGrade}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-1 gap-6">
            <Card data-testid="grade-distribution-card" className="animate-fade-up">
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gradeDistribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.5)" }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fontSize: 12, fill: "rgba(255,255,255,0.6)" }}
                        width={40}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      />
                      <Tooltip content={<PremiumTooltip />} cursor={{ fill: 'rgba(234,88,12,0.1)' }} />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} isAnimationActive>
                        {gradeDistribution.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color}
                            filter={`drop-shadow(0 0 4px ${entry.color}40)`}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card data-testid="grade-trend-card" className="animate-fade-up">
            <CardHeader>
              <CardTitle>Grade Progression</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <defs>
                      <linearGradient id="gradeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(24, 95%, 53%)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "rgba(255,255,255,0.5)" }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    />
                    <YAxis
                      domain={[0, 12]}
                      ticks={[0, 3, 6, 9, 12]}
                      tickFormatter={(v) => valueToGrade(v)}
                      tick={{ fontSize: 11, fill: "rgba(255,255,255,0.5)" }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    />
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (active && payload && payload[0]) {
                          return (
                            <div className="bg-card/80 backdrop-blur-md border border-primary/20 rounded-lg p-3 shadow-xl shadow-primary/10">
                              <p className="text-xs text-muted-foreground">{payload[0].payload.date}</p>
                              <p style={{ color: 'hsl(24, 95%, 53%)' }} className="text-sm font-medium">
                                Grade: {valueToGrade(payload[0].value)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                      cursor={{ stroke: 'rgba(234,88,12,0.3)' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="grade"
                      stroke="hsl(24, 95%, 53%)"
                      strokeWidth={3}
                      dot={{ r: 4, fill: 'hsl(24, 95%, 53%)', filter: 'drop-shadow(0 0 8px rgba(234,88,12,0.6))' }}
                      activeDot={{ r: 6, filter: 'drop-shadow(0 0 12px rgba(234,88,12,0.8))' }}
                      isAnimationActive
                      name="Grade"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card data-testid="key-improvements-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-500">
                  <CheckCircle2 className="w-5 h-5" />
                  Key Improvements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {improvements.filter((i) => i.type === "improvement").length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Not enough data to show improvements yet.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {improvements
                      .filter((i) => i.type === "improvement")
                      .slice(0, 5)
                      .map((item) => (
                        <li
                          key={item.label}
                          className="flex items-center justify-between bg-green-500/10 rounded-lg px-3 py-2"
                          data-testid={`improvement-${item.label.toLowerCase()}`}
                        >
                          <span className="font-medium">{item.label}</span>
                          <Badge variant="secondary" className="bg-green-500/20 text-green-500">
                            +{Math.abs(item.change).toFixed(1)}
                          </Badge>
                        </li>
                      ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card data-testid="areas-to-improve-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-500">
                  <Target className="w-5 h-5" />
                  Areas Needing Work
                </CardTitle>
              </CardHeader>
              <CardContent>
                {improvements.filter((i) => i.type === "decline").length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Great job! No significant declines detected.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {improvements
                      .filter((i) => i.type === "decline")
                      .slice(0, 5)
                      .map((item) => (
                        <li
                          key={item.label}
                          className="flex items-center justify-between bg-amber-500/10 rounded-lg px-3 py-2"
                          data-testid={`decline-${item.label.toLowerCase()}`}
                        >
                          <span className="font-medium">{item.label}</span>
                          <Badge variant="secondary" className="bg-amber-500/20 text-amber-500">
                            {item.change.toFixed(1)}
                          </Badge>
                        </li>
                      ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <Card data-testid="summary-card" className="print:break-before-page">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <span className="text-foreground font-semibold">{player.name}</span>
                  {player.team && (
                    <span> plays for <span className="text-foreground font-semibold">{player.team}</span></span>
                  )}
                  {player.position && (
                    <span> as a <span className="text-foreground font-semibold">{player.position}</span></span>
                  )}
                  .
                </p>
                <p>
                  Over the <span className="text-foreground font-semibold">{periodLabel.toLowerCase()}</span>, they played{" "}
                  <span className="text-foreground font-semibold">{isFootball ? footballStats.gamesPlayed : currentStats.gamesPlayed} game{(isFootball ? footballStats.gamesPlayed : currentStats.gamesPlayed) !== 1 ? "s" : ""}</span>{" "}
                  with an average grade of <span className="text-foreground font-semibold">{valueToGrade(isFootball ? footballStats.avgGrade : currentStats.avgGrade)}</span>.
                </p>
                <p>
                  Stat averages:{" "}
                  {isFootball ? (
                    <>
                      <span className="text-foreground font-semibold">{footballStats.passingYards.toFixed(1)} Pass YDS</span>,{" "}
                      <span className="text-foreground font-semibold">{footballStats.rushingYards.toFixed(1)} Rush YDS</span>,{" "}
                      <span className="text-foreground font-semibold">{footballStats.receivingYards.toFixed(1)} Rec YDS</span>,{" "}
                      <span className="text-foreground font-semibold">{footballStats.totalTDs.toFixed(1)} TDs</span>,{" "}
                      <span className="text-foreground font-semibold">{footballStats.tackles.toFixed(1)} Tackles</span>.
                    </>
                  ) : (
                    <>
                      <span className="text-foreground font-semibold">{currentStats.points.toFixed(1)} PPG</span>,{" "}
                      <span className="text-foreground font-semibold">{currentStats.rebounds.toFixed(1)} RPG</span>,{" "}
                      <span className="text-foreground font-semibold">{currentStats.assists.toFixed(1)} APG</span>,{" "}
                      <span className="text-foreground font-semibold">{currentStats.steals.toFixed(1)} SPG</span>,{" "}
                      <span className="text-foreground font-semibold">{currentStats.blocks.toFixed(1)} BPG</span>.
                    </>
                  )}
                </p>
                {(() => {
                  const bestImprovement = improvements.find((i) => i.type === "improvement");
                  const worstDecline = improvements.find((i) => i.type === "decline");
                  
                  const statCategories = isFootball ? [
                    { key: "passingYards", label: "Passing", value: footballStats.passingYards },
                    { key: "rushingYards", label: "Rushing", value: footballStats.rushingYards },
                    { key: "receivingYards", label: "Receiving", value: footballStats.receivingYards },
                    { key: "touchdowns", label: "Scoring TDs", value: footballStats.totalTDs },
                    { key: "tackles", label: "Tackling", value: footballStats.tackles },
                    { key: "compPercent", label: "Completion percentage", value: footballStats.compPercent },
                  ] : [
                    { key: "points", label: "Scoring", value: currentStats.points },
                    { key: "rebounds", label: "Rebounding", value: currentStats.rebounds },
                    { key: "assists", label: "Playmaking", value: currentStats.assists },
                    { key: "steals", label: "Steals", value: currentStats.steals },
                    { key: "blocks", label: "Shot blocking", value: currentStats.blocks },
                    { key: "fgPercent", label: "Field goal shooting", value: currentStats.fgPercent },
                    { key: "threePercent", label: "Three-point shooting", value: currentStats.threePercent },
                  ];
                  
                  const bestStat = statCategories.reduce((a, b) => {
                    if (a.key === "fgPercent" || a.key === "threePercent") {
                      return a.value > b.value ? a : b;
                    }
                    if (b.key === "fgPercent" || b.key === "threePercent") {
                      return b.value > 50 && b.value > a.value ? b : a;
                    }
                    return a.value > b.value ? a : b;
                  });
                  
                  return (
                    <>
                      {bestStat && bestStat.value > 0 && (
                        <p>
                          <span className="text-green-500 font-semibold">Best attribute:</span>{" "}
                          <span className="text-foreground">{bestStat.label}</span>
                          {bestImprovement && (
                            <span className="text-muted-foreground"> - {bestImprovement.label} improved by {Math.abs(bestImprovement.change).toFixed(1)}</span>
                          )}
                        </p>
                      )}
                      {worstDecline && (
                        <p>
                          <span className="text-amber-500 font-semibold">Needs work:</span>{" "}
                          <span className="text-foreground">{worstDecline.label}</span>
                          <span className="text-muted-foreground"> - declined by {Math.abs(worstDecline.change).toFixed(1)} compared to previous period</span>
                        </p>
                      )}
                      {currentStats.turnovers > 3 && (
                        <p>
                          <span className="text-amber-500 font-semibold">Focus area:</span>{" "}
                          <span className="text-foreground">Ball security</span>
                          <span className="text-muted-foreground"> - averaging {currentStats.turnovers.toFixed(1)} turnovers per game</span>
                        </p>
                      )}
                      {!worstDecline && currentStats.turnovers <= 3 && (
                        <p>
                          <span className="text-green-500 font-semibold">Overall:</span>{" "}
                          <span className="text-foreground">Solid all-around performance with no major areas of concern.</span>
                        </p>
                      )}
                    </>
                  );
                })()}
                {previousStats.gamesPlayed > 0 && (
                  <p>
                    Compared to the previous period ({previousStats.gamesPlayed} games),{" "}
                    <span className={cn(
                      "font-semibold",
                      currentStats.avgGrade > previousStats.avgGrade ? "text-green-500" : 
                      currentStats.avgGrade < previousStats.avgGrade ? "text-amber-500" : "text-foreground"
                    )}>
                      {currentStats.avgGrade > previousStats.avgGrade
                        ? "grade improved"
                        : currentStats.avgGrade < previousStats.avgGrade
                        ? "grade declined"
                        : "grade remained stable"}
                    </span>{" "}
                    from {valueToGrade(previousStats.avgGrade)} to {valueToGrade(currentStats.avgGrade)}.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
