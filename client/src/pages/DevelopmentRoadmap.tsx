import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { BENCHMARK_STAT_LABELS } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp,
  TrendingDown,
  Star,
  Lightbulb,
  Dumbbell,
  Users,
  Trophy,
  Target,
  Zap,
  ChevronRight,
  ArrowUp,
  Crosshair,
} from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";

interface DevelopmentRoadmapProps {
  playerId: number;
}

interface GapItem {
  stat: string;
  label: string;
  current: number;
  target: number;
  gap: number;
  percentOfTarget: number;
  trends: { recent: number; overall: number; direction: "up" | "down" | "stable" };
  drills: Array<{ name: string; description: string; duration: string }>;
  contextLabel: string;
}

interface WeeklyFocusItem {
  stat: string;
  label: string;
  current: number;
  target: number;
  improvement: string;
}

interface BestGame {
  date: string;
  opponent: string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  fgPct: number;
}

interface PeerRanking {
  totalPeers: number;
  rankings: Array<{ stat: string; label: string; rank: number; totalAtPosition: number }>;
}

interface WhatIfItem {
  stat: string;
  label: string;
  current: number;
  needed: number;
  unlocksLevel: string;
}

interface RoadmapData {
  ready: boolean;
  message?: string;
  gamesNeeded?: number;
  position?: string;
  gamesAnalyzed?: number;
  playerStats?: Record<string, number>;
  recentStats?: Record<string, number>;
  currentLevel?: string;
  nextLevel?: string;
  overallPercentile?: number;
  gaps?: GapItem[];
  weeklyFocus?: WeeklyFocusItem[];
  benchmarks?: Record<string, number>;
  bestGame?: BestGame | null;
  peerRanking?: PeerRanking;
  whatIf?: WhatIfItem[];
}

const DIVISION_LEVELS = ["D1", "D2", "D3", "NAIA"] as const;

function getBarColor(percent: number): string {
  if (percent >= 100) return "#10B981";
  if (percent >= 70) return "#F59E0B";
  return "#EF4444";
}

function getBarColorClass(percent: number): string {
  if (percent >= 100) return "text-[#10B981]";
  if (percent >= 70) return "text-[#F59E0B]";
  return "text-[#EF4444]";
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6" data-testid="loading-skeleton">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-32 w-32 rounded-full" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-32" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DevelopmentRoadmap({ playerId }: DevelopmentRoadmapProps) {
  const [, setLocation] = useLocation();
  const [targetLevel, setTargetLevel] = useState<string>("");
  const { toast } = useToast();
  const celebratedRef = useRef<Set<string>>(new Set());

  const { data, isLoading } = useQuery<RoadmapData>({
    queryKey: ["/api/players", playerId, "development-roadmap", targetLevel],
    queryFn: () => {
      const url = targetLevel
        ? `/api/players/${playerId}/development-roadmap?targetLevel=${targetLevel}`
        : `/api/players/${playerId}/development-roadmap`;
      return fetch(url).then((r) => r.json());
    },
    enabled: !!playerId,
  });

  useEffect(() => {
    if (!data?.ready || !data.gaps || !data.benchmarks || !data.nextLevel) return;

    data.gaps.forEach((gap) => {
      if (
        gap.trends?.direction === "up" &&
        gap.trends.recent >= gap.target &&
        !celebratedRef.current.has(gap.stat)
      ) {
        celebratedRef.current.add(gap.stat);
        toast({
          title: "Milestone Reached!",
          description: `Your ${gap.label} is trending up and now exceeds the ${data.nextLevel} benchmark!`,
        });
      }
    });
  }, [data, toast]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!data) {
    return null;
  }

  if (!data.ready) {
    return (
      <Card data-testid="card-not-ready">
        <CardContent className="p-8 flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Target className="w-8 h-8 text-accent" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-display font-bold" data-testid="text-not-ready-title">
              Building Your Roadmap
            </h2>
            <p className="text-muted-foreground max-w-md" data-testid="text-not-ready-message">
              {data.message}
            </p>
          </div>
          {data.gamesNeeded !== undefined && (
            <div className="flex items-center gap-3" data-testid="games-needed-indicator">
              <div className="flex gap-1.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-10 h-3 rounded-full transition-colors ${
                      i < 3 - data.gamesNeeded! ? "bg-accent" : "bg-muted/50"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {data.gamesNeeded} more game{data.gamesNeeded !== 1 ? "s" : ""} needed
              </span>
            </div>
          )}
          <Button
            onClick={() => setLocation("/dashboard")}
            data-testid="button-log-game"
          >
            Log a Game
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  const {
    position,
    gamesAnalyzed,
    currentLevel,
    nextLevel,
    overallPercentile,
    gaps,
    weeklyFocus,
    bestGame,
    peerRanking,
    whatIf,
  } = data;

  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference - (circumference * (overallPercentile || 0)) / 100;

  const drillsByStatMap = new Map<string, GapItem["drills"]>();
  if (gaps) {
    gaps.forEach((g) => {
      if (g.drills && g.drills.length > 0) {
        drillsByStatMap.set(g.stat, g.drills);
      }
    });
  }

  return (
    <div className="space-y-6" data-testid="development-roadmap">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Crosshair className="w-4 h-4 text-accent" />
          <span data-testid="text-header-level">
            Currently <span className="text-accent font-display font-bold">{currentLevel}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Target:</span>
          <Select
            value={targetLevel}
            onValueChange={(val) => setTargetLevel(val === "auto" ? "" : val)}
            data-testid="select-target-level"
          >
            <SelectTrigger className="w-[160px]" data-testid="select-trigger-target-level">
              <SelectValue placeholder="Auto (Next Level)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto" data-testid="select-item-auto">Auto (Next Level)</SelectItem>
              <SelectItem value="D1" data-testid="select-item-d1">D1</SelectItem>
              <SelectItem value="D2" data-testid="select-item-d2">D2</SelectItem>
              <SelectItem value="D3" data-testid="select-item-d3">D3</SelectItem>
              <SelectItem value="NAIA" data-testid="select-item-naia">NAIA</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card data-testid="card-current-level">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-36 h-36" data-testid="progress-indicator">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="hsl(var(--muted) / 0.3)"
                  strokeWidth="8"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="hsl(var(--accent))"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-display font-bold text-accent" data-testid="text-percentile">
                  {overallPercentile}%
                </span>
                <span className="text-xs text-muted-foreground">ready</span>
              </div>
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-2xl font-display font-bold" data-testid="text-current-level">
                You're at <span className="text-accent">{currentLevel}</span> Level
              </h2>
              <p className="text-muted-foreground" data-testid="text-next-level">
                {overallPercentile}% ready for {nextLevel}
              </p>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5" data-testid="text-position">
                <Crosshair className="w-4 h-4 text-accent" />
                {position}
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-1.5" data-testid="text-games-analyzed">
                <Target className="w-4 h-4 text-accent" />
                {gamesAnalyzed} games analyzed
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {bestGame && (
        <Card data-testid="card-best-game">
          <CardHeader className="flex flex-row items-center gap-2">
            <Star className="w-5 h-5 text-accent" />
            <CardTitle className="font-display text-lg">Best Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground" data-testid="text-best-game-info">
              vs {bestGame.opponent}{bestGame.date ? <> &bull; {format(new Date(bestGame.date), "MMM d, yyyy")}</> : ""}
            </p>
            <div className="grid grid-cols-4 gap-3" data-testid="best-game-stats">
              <div className="text-center space-y-1 p-3 rounded-lg bg-muted/20 border border-border/50">
                <span className="text-xl font-display font-bold text-accent">{bestGame.points}</span>
                <p className="text-xs text-muted-foreground">PTS</p>
              </div>
              <div className="text-center space-y-1 p-3 rounded-lg bg-muted/20 border border-border/50">
                <span className="text-xl font-display font-bold text-accent">{bestGame.rebounds}</span>
                <p className="text-xs text-muted-foreground">REB</p>
              </div>
              <div className="text-center space-y-1 p-3 rounded-lg bg-muted/20 border border-border/50">
                <span className="text-xl font-display font-bold text-accent">{bestGame.assists}</span>
                <p className="text-xs text-muted-foreground">AST</p>
              </div>
              <div className="text-center space-y-1 p-3 rounded-lg bg-muted/20 border border-border/50">
                <span className="text-xl font-display font-bold text-accent">{bestGame.steals}</span>
                <p className="text-xs text-muted-foreground">STL</p>
              </div>
            </div>
            <div className="text-center">
              <span className="text-sm text-muted-foreground" data-testid="text-best-game-fg">
                {bestGame.fgPct}% FG
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {gaps && gaps.length > 0 && (
        <Card data-testid="card-skill-gaps">
          <CardHeader className="flex flex-row items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            <CardTitle className="font-display text-lg">Skill Gap Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {gaps.map((gap) => {
              const percent = Math.min(gap.percentOfTarget, 100);
              const color = getBarColor(gap.percentOfTarget);
              const colorClass = getBarColorClass(gap.percentOfTarget);

              return (
                <div key={gap.stat} className="space-y-1.5" data-testid={`gap-${gap.stat}`}>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{gap.label}</span>
                      {gap.contextLabel && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5" data-testid={`badge-context-${gap.stat}`}>
                          {gap.contextLabel}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={colorClass}>{gap.current}</span>
                      {gap.trends?.direction === "up" && (
                        <TrendingUp className="w-3.5 h-3.5 text-[#10B981]" />
                      )}
                      {gap.trends?.direction === "down" && (
                        <TrendingDown className="w-3.5 h-3.5 text-[#EF4444]" />
                      )}
                      <span className="text-muted-foreground">/</span>
                      <span className="text-muted-foreground">{gap.target}</span>
                      {gap.gap > 0 && (
                        <span className="text-xs text-muted-foreground ml-1">
                          +{gap.gap.toFixed(1)} needed
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted/50 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: color,
                      }}
                      data-testid={`bar-${gap.stat}`}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {whatIf && whatIf.length > 0 && (
        <Card data-testid="card-what-if">
          <CardHeader className="flex flex-row items-center gap-2">
            <Lightbulb className="w-5 h-5 text-accent" />
            <CardTitle className="font-display text-lg">Path to {nextLevel}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {whatIf.map((item) => {
              const improvementNeeded = (item.needed - item.current).toFixed(1);
              return (
                <div
                  key={item.stat}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/50 text-sm"
                  data-testid={`what-if-${item.stat}`}
                >
                  <ArrowUp className="w-4 h-4 text-accent flex-shrink-0" />
                  <span className="flex-1">
                    Improve <span className="font-medium">{item.label}</span> by{" "}
                    <span className="font-display font-bold text-accent">{improvementNeeded}</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <Badge variant="secondary" data-testid={`badge-unlocks-${item.stat}`}>
                    {item.unlocksLevel}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {weeklyFocus && weeklyFocus.length > 0 && (
        <Card data-testid="card-weekly-focus">
          <CardHeader className="flex flex-row items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            <CardTitle className="font-display text-lg">Weekly Training Focus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {weeklyFocus.map((item, index) => {
              const statShort = BENCHMARK_STAT_LABELS[item.stat] || item.label;
              const drills = drillsByStatMap.get(item.stat);

              return (
                <div
                  key={item.stat}
                  className="p-4 rounded-lg bg-muted/20 border border-border/50 space-y-3"
                  data-testid={`focus-${item.stat}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                          {index + 1}
                        </div>
                        <span className="font-medium text-sm">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <ArrowUp className="w-3.5 h-3.5 text-accent" />
                        <span className="font-display font-bold text-accent">
                          {item.improvement}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{item.current}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                      <span className="text-foreground font-medium">{item.target}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Improve {statShort.toLowerCase()} by {item.improvement} to reach {nextLevel} {position} benchmark
                    </p>
                  </div>

                  {drills && drills.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border/30">
                      {drills.map((drill, di) => (
                        <div
                          key={di}
                          className="flex items-start gap-2 p-2 rounded-md bg-muted/10"
                          data-testid={`drill-${item.stat}-${di}`}
                        >
                          <Dumbbell className="w-3.5 h-3.5 text-accent mt-0.5 flex-shrink-0" />
                          <div className="space-y-0.5">
                            <span className="text-xs font-medium">{drill.name}</span>
                            <p className="text-xs text-muted-foreground">{drill.description}</p>
                            <span className="text-[10px] text-muted-foreground/70">{drill.duration}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {peerRanking && peerRanking.rankings && peerRanking.rankings.length > 0 && (
        <Card data-testid="card-peer-ranking">
          <CardHeader className="flex flex-row items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            <CardTitle className="font-display text-lg">How You Stack Up</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {peerRanking.rankings.map((r) => {
              const isTopThree = r.rank <= 3;
              const isTopHalf = r.rank <= Math.ceil(r.totalAtPosition / 2);
              const rankColor = isTopThree
                ? "text-[#10B981]"
                : isTopHalf
                  ? "text-[#F59E0B]"
                  : "text-muted-foreground";

              return (
                <div
                  key={r.stat}
                  className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted/20 border border-border/50"
                  data-testid={`peer-rank-${r.stat}`}
                >
                  <span className="text-sm font-medium">{r.label}</span>
                  <span className={`text-sm font-display font-bold ${rankColor}`}>
                    Rank #{r.rank} of {r.totalAtPosition} {position}s
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card data-testid="card-division-ladder">
        <CardHeader className="flex flex-row items-center gap-2">
          <Trophy className="w-5 h-5 text-accent" />
          <CardTitle className="font-display text-lg">Division Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative space-y-0">
            {DIVISION_LEVELS.map((level, index) => {
              const isCurrent = level === currentLevel;
              const currentIdx = DIVISION_LEVELS.indexOf(currentLevel as typeof DIVISION_LEVELS[number]);
              const isMet = index >= currentIdx && currentIdx !== -1;
              const isAhead = index < currentIdx;

              return (
                <div key={level} className="relative flex items-stretch gap-4" data-testid={`level-${level}`}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center z-10 ${
                        isCurrent
                          ? "bg-accent border-accent text-accent-foreground"
                          : isMet
                            ? "bg-accent/20 border-accent/40 text-accent"
                            : "bg-muted/30 border-border text-muted-foreground"
                      }`}
                    >
                      {isCurrent ? (
                        <Trophy className="w-4 h-4" />
                      ) : isMet ? (
                        <Target className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                    {index < DIVISION_LEVELS.length - 1 && (
                      <div
                        className={`w-0.5 flex-1 min-h-[2rem] ${
                          isMet && !isAhead ? "bg-accent/40" : "bg-border/50"
                        }`}
                      />
                    )}
                  </div>
                  <div className={`pb-6 pt-1.5 ${index === DIVISION_LEVELS.length - 1 ? "pb-0" : ""}`}>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-display font-bold text-lg ${
                          isCurrent ? "text-accent" : isMet ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {level}
                      </span>
                      {isCurrent && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30">
                          Current
                        </span>
                      )}
                      {isAhead && (
                        <span className="text-xs text-muted-foreground">Target</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isCurrent
                        ? "Your current competitive level"
                        : isAhead
                          ? "Keep improving to reach this level"
                          : "You've met this level's benchmarks"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
