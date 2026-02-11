import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShotChart, calculateZoneStats, type Shot } from "@/components/ShotChart";
import { ZoneStats } from "@/components/ZoneStats";
import { usePlayers, useShotsByPlayer, usePlayer } from "@/hooks/use-basketball";
import { Target, Users, Filter, Calendar, TrendingUp, Crosshair } from "lucide-react";
import { Paywall } from "@/components/Paywall";

type ShotFilter = "all" | "2pt" | "3pt";
type TimeFilter = "all" | "last5" | "last10" | "last30";

export default function ShotChartPage() {
  const [location] = useLocation();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [shotFilter, setShotFilter] = useState<ShotFilter>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");

  const { data: players, isLoading: playersLoading } = usePlayers();
  const playerId = selectedPlayerId ? parseInt(selectedPlayerId) : 0;
  const { data: playerData, isLoading: playerLoading } = usePlayer(playerId);
  const { data: shots, isLoading: shotsLoading } = useShotsByPlayer(playerId);

  const filteredShots = useMemo(() => {
    if (!shots) return [];

    let filtered = [...shots];

    if (shotFilter === "2pt") {
      filtered = filtered.filter(s => !s.shotType.includes("3"));
    } else if (shotFilter === "3pt") {
      filtered = filtered.filter(s => s.shotType.includes("3"));
    }

    if (timeFilter !== "all") {
      const days = timeFilter === "last5" ? 5 : timeFilter === "last10" ? 10 : 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filtered = filtered.filter(s => new Date(s.createdAt) >= cutoffDate);
    }

    return filtered;
  }, [shots, shotFilter, timeFilter]);

  const zoneStats = useMemo(() => calculateZoneStats(filteredShots), [filteredShots]);

  const totalStats = useMemo(() => {
    const total = filteredShots.length;
    const made = filteredShots.filter(s => s.result === "made").length;
    return { 
      made, 
      total, 
      percentage: total > 0 ? ((made / total) * 100).toFixed(1) : "0.0",
      pointsScored: filteredShots.filter(s => s.result === "made").reduce((sum, s) => {
        return sum + (s.shotType.includes("3") ? 3 : 2);
      }, 0)
    };
  }, [filteredShots]);

  const gameBreakdown = useMemo(() => {
    if (!shots || !playerData?.games) return [];
    
    const gameMap = new Map<number, { game: any; shots: Shot[] }>();
    
    shots.forEach(shot => {
      if (!gameMap.has(shot.gameId)) {
        const game = playerData.games.find(g => g.id === shot.gameId);
        if (game) {
          gameMap.set(shot.gameId, { game, shots: [] });
        }
      }
      const entry = gameMap.get(shot.gameId);
      if (entry) {
        entry.shots.push(shot);
      }
    });

    return Array.from(gameMap.values())
      .sort((a, b) => new Date(b.game.date).getTime() - new Date(a.game.date).getTime())
      .slice(0, 5);
  }, [shots, playerData]);

  const isLoading = playersLoading || (playerId && (playerLoading || shotsLoading));

  return (
    <Paywall requiredTier="pro" featureName="Shot Charts">
    <div className="space-y-6" data-testid="shot-chart-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Crosshair className="h-8 w-8 text-accent" />
            Shot Chart
          </h1>
          <p className="text-muted-foreground mt-1">Analyze shooting performance by zone</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center p-4 bg-card rounded-lg border border-border" data-testid="shot-chart-filters">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
            <SelectTrigger className="w-[180px]" data-testid="select-player">
              <SelectValue placeholder="Select Player" />
            </SelectTrigger>
            <SelectContent>
              {players?.map(player => (
                <SelectItem key={player.id} value={player.id.toString()}>
                  {player.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={shotFilter} onValueChange={(v) => setShotFilter(v as ShotFilter)}>
            <SelectTrigger className="w-[130px]" data-testid="select-shot-type">
              <SelectValue placeholder="Shot Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Shots</SelectItem>
              <SelectItem value="2pt">2-Pointers</SelectItem>
              <SelectItem value="3pt">3-Pointers</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
            <SelectTrigger className="w-[140px]" data-testid="select-time-range">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="last5">Last 5 Days</SelectItem>
              <SelectItem value="last10">Last 10 Days</SelectItem>
              <SelectItem value="last30">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(shotFilter !== "all" || timeFilter !== "all") && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { setShotFilter("all"); setTimeFilter("all"); }}
            data-testid="button-clear-filters"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {!selectedPlayerId ? (
        <Card className="py-16" data-testid="no-player-selected">
          <CardContent className="text-center">
            <Target className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Select a Player</h3>
            <p className="text-muted-foreground">Choose a player from the dropdown above to view their shot chart</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="w-full aspect-square" />
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" data-testid="shooting-summary">
            <Card className="p-4 text-center">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Shots</div>
              <div className="text-3xl font-bold">{totalStats.total}</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Makes</div>
              <div className="text-3xl font-bold text-green-500">{totalStats.made}</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">FG%</div>
              <div className="text-3xl font-bold text-accent">{totalStats.percentage}%</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Points</div>
              <div className="text-3xl font-bold">{totalStats.pointsScored}</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card data-testid="main-shot-chart">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Crosshair className="h-5 w-5 text-accent" />
                    {playerData?.name}'s Shot Chart
                    {filteredShots.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {filteredShots.length} shots
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ShotChart 
                    shots={filteredShots} 
                    showStats={false}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <ZoneStats stats={zoneStats} showTrends={true} />

              {gameBreakdown.length > 0 && (
                <Card data-testid="recent-games-breakdown">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="h-4 w-4 text-accent" />
                      Recent Games
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {gameBreakdown.map(({ game, shots: gameShots }) => {
                      const made = gameShots.filter(s => s.result === "made").length;
                      const total = gameShots.length;
                      const pct = total > 0 ? ((made / total) * 100).toFixed(1) : "0.0";
                      
                      return (
                        <div 
                          key={game.id} 
                          className="flex items-center justify-between p-2 bg-muted/30 rounded-md"
                          data-testid={`game-breakdown-${game.id}`}
                        >
                          <div>
                            <div className="text-sm font-medium">vs {game.opponent}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(game.date).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{made}/{total}</div>
                            <Badge variant="secondary" className="text-xs">
                              {pct}%
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </div>
    </Paywall>
  );
}
