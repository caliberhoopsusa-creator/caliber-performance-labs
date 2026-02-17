import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ReferenceLine,
} from "recharts";
import {
  Crosshair,
  Ruler,
  Scale,
  Target,
  TrendingUp,
  Shield,
  Award,
  BarChart3,
  Zap,
} from "lucide-react";

interface ScoutViewProps {
  player: {
    id: number;
    name: string;
    position: string;
    height: string | null;
    weight?: string | number | null;
    wingspan?: string | number | null;
    gpa?: string | number | null;
    graduationYear?: number | null;
    school?: string | null;
    sport?: string;
  };
  games: Array<{
    date?: string;
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    fgMade: number;
    fgAttempted: number;
    threeMade: number;
    threeAttempted: number;
    ftMade: number;
    ftAttempted: number;
    offensiveRebounds?: number | null;
    defensiveRebounds?: number | null;
    defenseRating?: number | null;
    minutes: number;
  }>;
}

interface Endorsement {
  id: number;
  coachUserId: string;
  playerId: number;
  title: string;
  message: string;
  skills: string;
  createdAt: string;
}

function MetricBox({
  label,
  value,
  icon: Icon,
  testId,
}: {
  label: string;
  value: string;
  icon?: typeof Target;
  testId: string;
}) {
  return (
    <div
      className="flex flex-col gap-1 p-3 rounded-lg bg-muted/30 border border-border/50"
      data-testid={testId}
    >
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
          {label}
        </span>
      </div>
      <span className="text-xl font-display font-bold text-foreground leading-none">
        {value}
      </span>
    </div>
  );
}

export function ScoutView({ player, games }: ScoutViewProps) {
  const sortedGames = useMemo(() => {
    return [...games].sort((a, b) => {
      if (a.date && b.date) return a.date.localeCompare(b.date);
      if (a.date) return -1;
      if (b.date) return 1;
      return 0;
    });
  }, [games]);

  const stats = useMemo(() => {
    if (sortedGames.length === 0) return null;

    const totalPoints = sortedGames.reduce((s, g) => s + g.points, 0);
    const totalFGA = sortedGames.reduce((s, g) => s + g.fgAttempted, 0);
    const totalFTA = sortedGames.reduce((s, g) => s + g.ftAttempted, 0);
    const totalAssists = sortedGames.reduce((s, g) => s + g.assists, 0);
    const totalTurnovers = sortedGames.reduce((s, g) => s + g.turnovers, 0);
    const totalRebounds = sortedGames.reduce((s, g) => s + g.rebounds, 0);
    const totalOffReb = sortedGames.reduce((s, g) => s + (g.offensiveRebounds ?? 0), 0);

    const possessions = totalFGA + 0.44 * totalFTA;
    const tsPct = possessions > 0 ? (totalPoints / (2 * possessions)) * 100 : 0;
    const toPct =
      possessions + totalTurnovers > 0
        ? (totalTurnovers / (possessions + totalTurnovers)) * 100
        : 0;
    const astToRatio =
      totalTurnovers > 0 ? totalAssists / totalTurnovers : null;

    const usagePerGame =
      sortedGames.length > 0
        ? sortedGames.reduce(
            (s, g) => s + g.fgAttempted + 0.44 * g.ftAttempted + g.turnovers,
            0
          ) / sortedGames.length
        : 0;

    const offRebPct =
      totalRebounds > 0 ? (totalOffReb / totalRebounds) * 100 : 0;

    const defRatingGames = sortedGames.filter(
      (g) => g.defenseRating != null && g.defenseRating !== undefined
    );
    const avgDefRating =
      defRatingGames.length > 0
        ? defRatingGames.reduce((s, g) => s + (g.defenseRating ?? 0), 0) /
          defRatingGames.length
        : null;

    const avgPoints = totalPoints / sortedGames.length;
    const pointsArray = sortedGames.map((g) => g.points);
    const variance =
      pointsArray.reduce((s, p) => s + Math.pow(p - avgPoints, 2), 0) /
      sortedGames.length;
    const stdDev = Math.sqrt(variance);
    const coeffOfVariation = avgPoints > 0 ? stdDev / avgPoints : 1;
    const consistencyScore = Math.max(
      1,
      Math.min(100, Math.round(100 * (1 - coeffOfVariation)))
    );

    const bigGameThreshold = avgPoints * 1.5;
    const bigGameCount = sortedGames.filter(
      (g) => g.points > bigGameThreshold
    ).length;

    return {
      tsPct,
      toPct,
      astToRatio,
      usagePerGame,
      offRebPct,
      avgDefRating,
      consistencyScore,
      bigGameCount,
      avgPoints,
      gamesPlayed: sortedGames.length,
    };
  }, [sortedGames]);

  const { data: endorsements } = useQuery<Endorsement[]>({
    queryKey: [`/api/players/${player.id}/endorsements`],
  });

  const consistencyColor =
    stats && stats.consistencyScore >= 70
      ? "bg-emerald-500"
      : stats && stats.consistencyScore >= 40
        ? "bg-yellow-500"
        : "bg-red-500";

  const consistencyLabel =
    stats && stats.consistencyScore >= 70
      ? "Consistent"
      : stats && stats.consistencyScore >= 40
        ? "Moderate"
        : "Volatile";

  const latestEndorsements = (endorsements ?? []).slice(0, 3);

  return (
    <Card className="p-5" data-testid="card-scout-view">
      <div className="flex items-center gap-2 mb-5">
        <Crosshair className="w-5 h-5 text-accent" />
        <h3 className="font-display text-xl uppercase tracking-wider font-bold">
          Scout View
        </h3>
      </div>

      <div className="space-y-5">
        {/* Physical Measurables */}
        <div data-testid="section-measurables">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
            Physical Measurables
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            <MetricBox
              label="Height"
              value={player.height ?? "\u2014"}
              icon={Ruler}
              testId="metric-height"
            />
            <MetricBox
              label="Weight"
              value={
                player.weight != null ? `${player.weight} lbs` : "\u2014"
              }
              icon={Scale}
              testId="metric-weight"
            />
            <MetricBox
              label="Wingspan"
              value={
                player.wingspan != null ? `${player.wingspan}"` : "\u2014"
              }
              icon={Ruler}
              testId="metric-wingspan"
            />
            <MetricBox
              label="Class"
              value={
                player.graduationYear != null
                  ? String(player.graduationYear)
                  : "\u2014"
              }
              testId="metric-grad-year"
            />
            <MetricBox
              label="GPA"
              value={
                player.gpa != null
                  ? Number(player.gpa).toFixed(2)
                  : "\u2014"
              }
              testId="metric-gpa"
            />
          </div>
        </div>

        {/* Efficiency Metrics */}
        {stats && (
          <div data-testid="section-efficiency">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
              Efficiency Metrics
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <MetricBox
                label="TS%"
                value={stats.tsPct.toFixed(1) + "%"}
                icon={Target}
                testId="metric-ts-pct"
              />
              <MetricBox
                label="TO%"
                value={stats.toPct.toFixed(1) + "%"}
                icon={TrendingUp}
                testId="metric-to-pct"
              />
              <MetricBox
                label="AST/TO"
                value={
                  stats.astToRatio != null
                    ? stats.astToRatio.toFixed(2)
                    : "\u2014"
                }
                icon={BarChart3}
                testId="metric-ast-to"
              />
              <MetricBox
                label="Usage/G"
                value={stats.usagePerGame.toFixed(1)}
                icon={TrendingUp}
                testId="metric-usage"
              />
              <MetricBox
                label="OREB%"
                value={stats.offRebPct.toFixed(1) + "%"}
                icon={Target}
                testId="metric-oreb-pct"
              />
              <MetricBox
                label="Def Rating"
                value={
                  stats.avgDefRating != null
                    ? stats.avgDefRating.toFixed(1)
                    : "\u2014"
                }
                icon={Shield}
                testId="metric-def-rating"
              />
            </div>
          </div>
        )}

        {/* Consistency Rating */}
        {stats && (
          <div data-testid="section-consistency">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
              Consistency Rating
            </p>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center justify-between gap-4 mb-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span
                    className="text-2xl font-display font-bold text-foreground"
                    data-testid="text-consistency-score"
                  >
                    {stats.consistencyScore}
                  </span>
                  <span className="text-sm text-muted-foreground">/ 100</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px]",
                      stats.consistencyScore >= 70 &&
                        "bg-emerald-500/15 text-emerald-400",
                      stats.consistencyScore >= 40 &&
                        stats.consistencyScore < 70 &&
                        "bg-yellow-500/15 text-yellow-400",
                      stats.consistencyScore < 40 &&
                        "bg-red-500/15 text-red-400"
                    )}
                    data-testid="badge-consistency-label"
                  >
                    {consistencyLabel}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground" data-testid="text-big-games">
                  {stats.bigGameCount} big game{stats.bigGameCount !== 1 ? "s" : ""}{" "}
                  <span className="text-[10px]">
                    ({">"}
                    {(stats.avgPoints * 1.5).toFixed(0)} pts)
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    consistencyColor
                  )}
                  style={{ width: `${stats.consistencyScore}%` }}
                  data-testid="progress-consistency"
                />
              </div>
            </div>
          </div>
        )}

        {/* Game-by-Game Performance Chart */}
        {stats && sortedGames.length >= 3 && (
          <div data-testid="section-performance-chart">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                Game-by-Game Scoring
              </p>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-accent inline-block" /> Points
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-6 border-t border-dashed border-muted-foreground/50 inline-block" /> Avg
                </span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart
                  data={sortedGames.map((g, i) => ({
                    game: `G${i + 1}`,
                    pts: g.points,
                    isBigGame: g.points > stats.avgPoints * 1.5,
                  }))}
                  margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="scoutPtsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="game"
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value: number, _name: string, entry: any) => {
                      const label = entry?.payload?.isBigGame ? `${value} pts (Big Game)` : `${value} pts`;
                      return [label, 'Points'];
                    }}
                  />
                  <ReferenceLine
                    y={stats.avgPoints}
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="4 4"
                    strokeOpacity={0.5}
                  />
                  <Area
                    type="monotone"
                    dataKey="pts"
                    stroke="hsl(var(--accent))"
                    fill="url(#scoutPtsGrad)"
                    strokeWidth={2}
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      if (payload?.isBigGame) {
                        return (
                          <circle
                            key={`dot-${cx}-${cy}`}
                            cx={cx}
                            cy={cy}
                            r={4}
                            fill="hsl(var(--accent))"
                            stroke="#fff"
                            strokeWidth={1.5}
                          />
                        );
                      }
                      return (
                        <circle
                          key={`dot-${cx}-${cy}`}
                          cx={cx}
                          cy={cy}
                          r={2.5}
                          fill="hsl(var(--accent))"
                          strokeWidth={0}
                        />
                      );
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              {(() => {
                const recentGames = sortedGames.slice(-5);
                const olderGames = sortedGames.slice(0, -5);
                if (olderGames.length >= 3) {
                  const recentAvg = recentGames.reduce((s, g) => s + g.points, 0) / recentGames.length;
                  const olderAvg = olderGames.reduce((s, g) => s + g.points, 0) / olderGames.length;
                  const diff = recentAvg - olderAvg;
                  const pctChange = olderAvg > 0 ? (diff / olderAvg) * 100 : 0;
                  if (Math.abs(pctChange) >= 5) {
                    return (
                      <div className="flex items-center gap-1.5 mt-2 text-[11px]" data-testid="text-trend-indicator">
                        <Zap className={cn("w-3 h-3", diff > 0 ? "text-emerald-400" : "text-red-400")} />
                        <span className={cn(diff > 0 ? "text-emerald-400" : "text-red-400", "font-medium")}>
                          {diff > 0 ? "+" : ""}{pctChange.toFixed(0)}% scoring trend
                        </span>
                        <span className="text-muted-foreground">(last 5 vs. prior)</span>
                      </div>
                    );
                  }
                }
                return null;
              })()}
            </div>
          </div>
        )}

        {/* No games message */}
        {!stats && (
          <div className="text-center py-6 text-sm text-muted-foreground" data-testid="text-no-games">
            No game data available for analysis.
          </div>
        )}

        {/* Coach Endorsements Summary */}
        <div data-testid="section-endorsements">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
            Coach Endorsements
          </p>
          {latestEndorsements.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-accent" />
                <span className="text-sm text-foreground font-medium" data-testid="text-endorsement-count">
                  {endorsements?.length ?? 0} endorsement
                  {(endorsements?.length ?? 0) !== 1 ? "s" : ""}
                </span>
              </div>
              {latestEndorsements.map((e) => {
                let skillTags: string[] = [];
                try {
                  skillTags = JSON.parse(e.skills || "[]");
                } catch {
                  skillTags = [];
                }
                return (
                  <div
                    key={e.id}
                    className="p-3 rounded-lg bg-muted/30 border border-border/50"
                    data-testid={`endorsement-${e.id}`}
                  >
                    <p className="text-sm text-foreground font-medium">
                      {e.title}
                    </p>
                    {e.message && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {e.message}
                      </p>
                    )}
                    {skillTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {skillTags.map((tag: string) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-[10px]"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className="text-center py-4 text-sm text-muted-foreground"
              data-testid="text-no-endorsements"
            >
              No endorsements yet
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default ScoutView;
