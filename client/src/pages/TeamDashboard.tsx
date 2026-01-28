import { useState, useMemo, useEffect } from "react";
import { useTeamDashboard, type TeamDashboardPlayer } from "@/hooks/use-basketball";
import { Link } from "wouter";
import { 
  Users, TrendingUp, Activity, Target, Trophy, 
  ChevronRight, ArrowUpDown, ArrowUp, ArrowDown,
  Crosshair, Medal, Zap, Calendar, Shield
} from "lucide-react";
import { Paywall } from "@/components/Paywall";
import { GradeBadge } from "@/components/GradeBadge";
import { useSport } from "@/components/SportToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BASKETBALL_POSITIONS, FOOTBALL_POSITIONS, FOOTBALL_POSITION_LABELS } from "@shared/sports-config";

type SortKey = 'name' | 'position' | 'avgGradeScore' | 'ppg' | 'rpg' | 'apg' | 'spg' | 'bpg' | 'gamesPlayed' | 'passYpg' | 'rushYpg' | 'recYpg' | 'tdsPerGame' | 'compPct' | 'ypc' | 'tackles' | 'sacks';
type SortDirection = 'asc' | 'desc';
type SportFilter = 'all' | 'basketball' | 'football';

export default function TeamDashboard() {
  const { data, isLoading } = useTeamDashboard();
  const currentSport = useSport();
  const [positionFilter, setPositionFilter] = useState<string>("All");
  const [sportFilter, setSportFilter] = useState<SportFilter>(currentSport);
  const [sortKey, setSortKey] = useState<SortKey>('avgGradeScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  useEffect(() => {
    setSportFilter(currentSport);
    setPositionFilter("All");
  }, [currentSport]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const hasMixedSports = useMemo(() => {
    if (!data?.players) return false;
    const sports = new Set(data.players.map(p => p.sport));
    return sports.size > 1;
  }, [data?.players]);

  const hasFootballPlayers = useMemo(() => {
    if (!data?.players) return false;
    return data.players.some(p => p.sport === 'football');
  }, [data?.players]);

  const hasBasketballPlayers = useMemo(() => {
    if (!data?.players) return false;
    return data.players.some(p => p.sport === 'basketball');
  }, [data?.players]);

  const effectiveSport = useMemo(() => {
    if (sportFilter !== 'all') return sportFilter;
    if (hasFootballPlayers && !hasBasketballPlayers) return 'football';
    if (hasBasketballPlayers && !hasFootballPlayers) return 'basketball';
    return 'basketball';
  }, [sportFilter, hasFootballPlayers, hasBasketballPlayers]);

  const filteredAndSortedPlayers = useMemo(() => {
    if (!data?.players) return [];
    
    let players = [...data.players];
    
    if (sportFilter !== 'all') {
      players = players.filter(p => p.sport === sportFilter);
    }
    
    if (positionFilter !== "All") {
      // Support comma-separated positions - match if player has ANY of the specified positions
      players = players.filter(p => {
        const playerPositions = p.position?.split(',').map(pos => pos.trim()) || [];
        return playerPositions.includes(positionFilter);
      });
    }
    
    players.sort((a, b) => {
      let aVal: string | number = a[sortKey] ?? '';
      let bVal: string | number = b[sortKey] ?? '';
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      
      const numA = Number(aVal) || 0;
      const numB = Number(bVal) || 0;
      return sortDirection === 'asc' ? numA - numB : numB - numA;
    });
    
    return players;
  }, [data?.players, positionFilter, sportFilter, sortKey, sortDirection]);

  const availablePositions = useMemo(() => {
    if (effectiveSport === 'football') {
      return FOOTBALL_POSITIONS;
    }
    return BASKETBALL_POSITIONS;
  }, [effectiveSport]);

  const footballBestPerformers = useMemo(() => {
    if (!data?.players) return { topPasser: null, topRusher: null, topTackler: null };
    
    const footballPlayers = data.players.filter(p => p.sport === 'football');
    if (footballPlayers.length === 0) return { topPasser: null, topRusher: null, topTackler: null };
    
    const topPasser = footballPlayers.reduce((best, p) => {
      const currentYds = p.passYpg || 0;
      const bestYds = best?.passYpg || 0;
      return currentYds > bestYds ? p : best;
    }, null as TeamDashboardPlayer | null);
    
    const topRusher = footballPlayers.reduce((best, p) => {
      const currentYds = p.rushYpg || 0;
      const bestYds = best?.rushYpg || 0;
      return currentYds > bestYds ? p : best;
    }, null as TeamDashboardPlayer | null);
    
    const topTackler = footballPlayers.reduce((best, p) => {
      const currentTackles = p.tackles || 0;
      const bestTackles = best?.tackles || 0;
      return currentTackles > bestTackles ? p : best;
    }, null as TeamDashboardPlayer | null);
    
    return {
      topPasser: topPasser && (topPasser.passYpg || 0) > 0 ? { id: topPasser.id, name: topPasser.name, value: topPasser.passYpg } : null,
      topRusher: topRusher && (topRusher.rushYpg || 0) > 0 ? { id: topRusher.id, name: topRusher.name, value: topRusher.rushYpg } : null,
      topTackler: topTackler && (topTackler.tackles || 0) > 0 ? { id: topTackler.id, name: topTackler.name, value: topTackler.tackles } : null,
    };
  }, [data?.players]);

  const footballPositionDistribution = useMemo(() => {
    if (!data?.players) return {};
    const footballPlayers = data.players.filter(p => p.sport === 'football');
    const distribution: Record<string, number> = {};
    FOOTBALL_POSITIONS.forEach(pos => { distribution[pos] = 0; });
    footballPlayers.forEach(p => {
      if (p.position && distribution[p.position] !== undefined) {
        distribution[p.position]++;
      }
    });
    return distribution;
  }, [data?.players]);

  const SortableHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => {
    const isActive = sortKey === sortKeyName;
    return (
      <TableHead 
        className="cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => handleSort(sortKeyName)}
        data-testid={`sort-${sortKeyName}`}
      >
        <div className="flex items-center gap-1">
          {label}
          {isActive ? (
            sortDirection === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
          ) : (
            <ArrowUpDown className="w-3 h-3 opacity-50" />
          )}
        </div>
      </TableHead>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load team dashboard data.
      </div>
    );
  }

  const { teamStats, bestPerformers, recentGames, positionDistribution } = data;

  return (
    <Paywall requiredTier="coach_pro" featureName="Team Dashboard">
      <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white uppercase tracking-tight">Coach Dashboard</h2>
          <p className="text-muted-foreground font-medium">Team roster overview and performance metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-card to-card/50 border-white/5" data-testid="card-total-games">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Games</CardTitle>
            <Activity className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-bold text-white">{teamStats.totalGamesPlayed}</div>
            <p className="text-xs text-muted-foreground mt-1">Across {teamStats.totalPlayers} players</p>
          </CardContent>
        </Card>

        {effectiveSport === 'basketball' ? (
          <>
            <Card className="bg-gradient-to-br from-card to-card/50 border-white/5" data-testid="card-team-ppg">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Team PPG</CardTitle>
                <Target className="w-5 h-5 text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-display font-bold text-white">{teamStats.teamPpg}</div>
                <p className="text-xs text-muted-foreground mt-1">Average points per player</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card/50 border-white/5" data-testid="card-team-rpg">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Team RPG</CardTitle>
                <TrendingUp className="w-5 h-5 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-display font-bold text-white">{teamStats.teamRpg}</div>
                <p className="text-xs text-muted-foreground mt-1">Average rebounds per player</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card/50 border-white/5" data-testid="card-team-apg">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Team APG</CardTitle>
                <Zap className="w-5 h-5 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-display font-bold text-white">{teamStats.teamApg}</div>
                <p className="text-xs text-muted-foreground mt-1">Average assists per player</p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card className="bg-gradient-to-br from-card to-card/50 border-white/5" data-testid="card-team-yds">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total YDS/G</CardTitle>
                <Target className="w-5 h-5 text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-display font-bold text-white">
                  {filteredAndSortedPlayers.length > 0 
                    ? Math.round(filteredAndSortedPlayers.reduce((acc, p) => acc + (p.passYpg || 0) + (p.rushYpg || 0) + (p.recYpg || 0), 0) / filteredAndSortedPlayers.length)
                    : 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Average total yards per game</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card/50 border-white/5" data-testid="card-team-tds">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">TD/G</CardTitle>
                <TrendingUp className="w-5 h-5 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-display font-bold text-white">
                  {filteredAndSortedPlayers.length > 0 
                    ? (filteredAndSortedPlayers.reduce((acc, p) => acc + (p.tdsPerGame || 0), 0) / filteredAndSortedPlayers.length).toFixed(1)
                    : 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Average touchdowns per game</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card/50 border-white/5" data-testid="card-team-tackles">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">TCK/G</CardTitle>
                <Zap className="w-5 h-5 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-display font-bold text-white">
                  {filteredAndSortedPlayers.length > 0 
                    ? (filteredAndSortedPlayers.reduce((acc, p) => acc + (p.tackles || 0), 0) / filteredAndSortedPlayers.length).toFixed(1)
                    : 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Average tackles per game</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-card/50 border-white/5" data-testid="card-best-performers">
          <CardHeader>
            <CardTitle className="text-lg font-display text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Best Performers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {effectiveSport === 'basketball' ? (
              <>
                {bestPerformers.topScorer && (
                  <Link href={`/players/${bestPerformers.topScorer.id}`} className="block">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 transition-colors" data-testid="link-top-scorer">
                      <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-orange-400" />
                        <div>
                          <p className="text-xs text-orange-400 uppercase font-bold">Top Scorer</p>
                          <p className="text-white font-semibold">{bestPerformers.topScorer.name}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-orange-500/20 text-orange-300">
                        {bestPerformers.topScorer.value} PPG
                      </Badge>
                    </div>
                  </Link>
                )}
                {bestPerformers.topRebounder && (
                  <Link href={`/players/${bestPerformers.topRebounder.id}`} className="block">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors" data-testid="link-top-rebounder">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="text-xs text-green-400 uppercase font-bold">Top Rebounder</p>
                          <p className="text-white font-semibold">{bestPerformers.topRebounder.name}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                        {bestPerformers.topRebounder.value} RPG
                      </Badge>
                    </div>
                  </Link>
                )}
                {bestPerformers.topAssister && (
                  <Link href={`/players/${bestPerformers.topAssister.id}`} className="block">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors" data-testid="link-top-assister">
                      <div className="flex items-center gap-3">
                        <Medal className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="text-xs text-blue-400 uppercase font-bold">Top Assister</p>
                          <p className="text-white font-semibold">{bestPerformers.topAssister.name}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                        {bestPerformers.topAssister.value} APG
                      </Badge>
                    </div>
                  </Link>
                )}
                {!bestPerformers.topScorer && !bestPerformers.topRebounder && !bestPerformers.topAssister && (
                  <p className="text-muted-foreground text-sm text-center py-4">No performance data yet</p>
                )}
              </>
            ) : (
              <>
                {footballBestPerformers.topPasser && (
                  <Link href={`/players/${footballBestPerformers.topPasser.id}`} className="block">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors" data-testid="link-top-passer">
                      <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-amber-400" />
                        <div>
                          <p className="text-xs text-amber-400 uppercase font-bold">Top Passer</p>
                          <p className="text-white font-semibold">{footballBestPerformers.topPasser.name}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-amber-500/20 text-amber-300">
                        {footballBestPerformers.topPasser.value} YDS
                      </Badge>
                    </div>
                  </Link>
                )}
                {footballBestPerformers.topRusher && (
                  <Link href={`/players/${footballBestPerformers.topRusher.id}`} className="block">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors" data-testid="link-top-rusher">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="text-xs text-green-400 uppercase font-bold">Top Rusher</p>
                          <p className="text-white font-semibold">{footballBestPerformers.topRusher.name}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                        {footballBestPerformers.topRusher.value} YDS
                      </Badge>
                    </div>
                  </Link>
                )}
                {footballBestPerformers.topTackler && (
                  <Link href={`/players/${footballBestPerformers.topTackler.id}`} className="block">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors" data-testid="link-top-tackler">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-red-400" />
                        <div>
                          <p className="text-xs text-red-400 uppercase font-bold">Top Tackler</p>
                          <p className="text-white font-semibold">{footballBestPerformers.topTackler.name}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-red-500/20 text-red-300">
                        {footballBestPerformers.topTackler.value} TCK
                      </Badge>
                    </div>
                  </Link>
                )}
                {!footballBestPerformers.topPasser && !footballBestPerformers.topRusher && !footballBestPerformers.topTackler && (
                  <p className="text-muted-foreground text-sm text-center py-4">No performance data yet</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/5" data-testid="card-position-distribution">
          <CardHeader>
            <CardTitle className="text-lg font-display text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Position Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {effectiveSport === 'basketball' ? (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Guards</span>
                    <span className="text-sm font-bold text-white">{positionDistribution.Guard}</span>
                  </div>
                  <div className="h-3 bg-secondary/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                      style={{ width: `${(positionDistribution.Guard / teamStats.totalPlayers) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Wings</span>
                    <span className="text-sm font-bold text-white">{positionDistribution.Wing}</span>
                  </div>
                  <div className="h-3 bg-secondary/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
                      style={{ width: `${(positionDistribution.Wing / teamStats.totalPlayers) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Bigs</span>
                    <span className="text-sm font-bold text-white">{positionDistribution.Big}</span>
                  </div>
                  <div className="h-3 bg-secondary/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-500"
                      style={{ width: `${(positionDistribution.Big / teamStats.totalPlayers) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                {[
                  { key: 'QB', label: 'Quarterbacks', color: 'from-amber-500 to-amber-400' },
                  { key: 'RB', label: 'Running Backs', color: 'from-green-500 to-green-400' },
                  { key: 'WR', label: 'Wide Receivers', color: 'from-blue-500 to-blue-400' },
                  { key: 'TE', label: 'Tight Ends', color: 'from-cyan-500 to-cyan-400' },
                  { key: 'OL', label: 'Offensive Line', color: 'from-slate-500 to-slate-400' },
                  { key: 'DL', label: 'Defensive Line', color: 'from-red-500 to-red-400' },
                  { key: 'LB', label: 'Linebackers', color: 'from-orange-500 to-orange-400' },
                  { key: 'DB', label: 'Defensive Backs', color: 'from-purple-500 to-purple-400' },
                ].map(({ key, label, color }) => {
                  const count = footballPositionDistribution[key] || 0;
                  const footballTotal = Object.values(footballPositionDistribution).reduce((a, b) => a + b, 0);
                  return (
                    <div key={key}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-muted-foreground">{label}</span>
                        <span className="text-xs font-bold text-white">{count}</span>
                      </div>
                      <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-500`}
                          style={{ width: `${footballTotal > 0 ? (count / footballTotal) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/5" data-testid="card-recent-activity">
          <CardHeader>
            <CardTitle className="text-lg font-display text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentGames.length > 0 ? (
              <div className="space-y-3">
                {recentGames.map((game, index) => (
                  <Link 
                    key={`${game.playerId}-${game.id}`} 
                    href={`/players/${game.playerId}`}
                    className="block"
                  >
                    <div 
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors"
                      data-testid={`recent-game-${index}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{game.playerName}</p>
                        <p className="text-xs text-muted-foreground">vs {game.opponent} • {new Date(game.date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right text-xs text-muted-foreground">
                          {game.sport === 'football' ? (
                            <>
                              <span>{game.passingYards + game.rushingYards + game.receivingYards} yds</span> • <span>{game.touchdowns} TDs</span>
                            </>
                          ) : (
                            <>
                              <span>{game.points}pts</span> • <span>{game.rebounds}reb</span> • <span>{game.assists}ast</span>
                            </>
                          )}
                        </div>
                        {game.grade && <GradeBadge grade={game.grade} size="sm" />}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">No recent games</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 border-white/5">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-xl font-display text-white flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-primary" />
            Roster Performance
          </CardTitle>
          <div className="flex items-center gap-3">
            {hasMixedSports && (
              <Tabs value={sportFilter} onValueChange={(v) => { setSportFilter(v as SportFilter); setPositionFilter("All"); }}>
                <TabsList className="bg-card border border-white/10">
                  <TabsTrigger value="all" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="sport-filter-all">All</TabsTrigger>
                  <TabsTrigger value="basketball" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="sport-filter-basketball">Basketball</TabsTrigger>
                  <TabsTrigger value="football" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="sport-filter-football">Football</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
            <Select value={positionFilter} onValueChange={setPositionFilter} data-testid="select-position-filter">
              <SelectTrigger className="w-[140px] bg-secondary/30 border-white/10" data-testid="filter-position-trigger">
                <SelectValue placeholder="Filter Position" />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/10">
                <SelectItem value="All" data-testid="filter-all">All Positions</SelectItem>
                {availablePositions.map((pos) => (
                  <SelectItem key={pos} value={pos} data-testid={`filter-${pos.toLowerCase()}`}>
                    {effectiveSport === 'football' ? FOOTBALL_POSITION_LABELS[pos as keyof typeof FOOTBALL_POSITION_LABELS] || pos : pos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <SortableHeader label="Player" sortKeyName="name" />
                  <SortableHeader label="Position" sortKeyName="position" />
                  <SortableHeader label="Grade" sortKeyName="avgGradeScore" />
                  {effectiveSport === 'basketball' ? (
                    <>
                      <SortableHeader label="PPG" sortKeyName="ppg" />
                      <SortableHeader label="RPG" sortKeyName="rpg" />
                      <SortableHeader label="APG" sortKeyName="apg" />
                      <SortableHeader label="SPG" sortKeyName="spg" />
                      <SortableHeader label="BPG" sortKeyName="bpg" />
                    </>
                  ) : (
                    <>
                      <SortableHeader label="Pass YDS" sortKeyName="passYpg" />
                      <SortableHeader label="Rush YDS" sortKeyName="rushYpg" />
                      <SortableHeader label="Rec YDS" sortKeyName="recYpg" />
                      <SortableHeader label="TDs" sortKeyName="tdsPerGame" />
                      <SortableHeader label="Tackles" sortKeyName="tackles" />
                    </>
                  )}
                  <SortableHeader label="Games" sortKeyName="gamesPlayed" />
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedPlayers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No players found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedPlayers.map((player) => (
                    <TableRow 
                      key={player.id} 
                      className="border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                      data-testid={`player-row-${player.id}`}
                    >
                      <TableCell>
                        <Link href={`/players/${player.id}`} className="flex items-center gap-3" data-testid={`link-player-${player.id}`}>
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold font-display text-secondary-foreground border border-white/10">
                            {player.jerseyNumber || "#"}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{player.name}</p>
                            {player.team && <p className="text-xs text-muted-foreground">{player.team}</p>}
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {player.position}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {player.avgGrade ? <GradeBadge grade={player.avgGrade} size="sm" /> : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      {effectiveSport === 'basketball' ? (
                        <>
                          <TableCell className="font-medium">{player.ppg}</TableCell>
                          <TableCell className="font-medium">{player.rpg}</TableCell>
                          <TableCell className="font-medium">{player.apg}</TableCell>
                          <TableCell className="font-medium">{player.spg}</TableCell>
                          <TableCell className="font-medium">{player.bpg}</TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="font-medium">{player.passYpg}</TableCell>
                          <TableCell className="font-medium">{player.rushYpg}</TableCell>
                          <TableCell className="font-medium">{player.recYpg}</TableCell>
                          <TableCell className="font-medium">{player.tdsPerGame}</TableCell>
                          <TableCell className="font-medium">{player.tackles || 0}</TableCell>
                        </>
                      )}
                      <TableCell className="font-medium">{player.gamesPlayed}</TableCell>
                      <TableCell>
                        <Link href={`/players/${player.id}`} data-testid={`link-view-${player.id}`}>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      </div>
    </Paywall>
  );
}
