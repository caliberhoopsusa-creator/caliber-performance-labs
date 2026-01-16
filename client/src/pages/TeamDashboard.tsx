import { useState, useMemo } from "react";
import { useTeamDashboard, type TeamDashboardPlayer } from "@/hooks/use-basketball";
import { Link } from "wouter";
import { 
  Users, TrendingUp, Activity, Target, Trophy, 
  ChevronRight, ArrowUpDown, ArrowUp, ArrowDown,
  Crosshair, Medal, Zap, Calendar
} from "lucide-react";
import { Paywall } from "@/components/Paywall";
import { GradeBadge } from "@/components/GradeBadge";
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

type SortKey = 'name' | 'position' | 'avgGradeScore' | 'ppg' | 'rpg' | 'apg' | 'spg' | 'bpg' | 'gamesPlayed';
type SortDirection = 'asc' | 'desc';

export default function TeamDashboard() {
  const { data, isLoading } = useTeamDashboard();
  const [positionFilter, setPositionFilter] = useState<string>("All");
  const [sortKey, setSortKey] = useState<SortKey>('avgGradeScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedPlayers = useMemo(() => {
    if (!data?.players) return [];
    
    let players = [...data.players];
    
    if (positionFilter !== "All") {
      players = players.filter(p => p.position === positionFilter);
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
  }, [data?.players, positionFilter, sortKey, sortDirection]);

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
                          <span>{game.points}pts</span> • <span>{game.rebounds}reb</span> • <span>{game.assists}ast</span>
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
            <Select value={positionFilter} onValueChange={setPositionFilter} data-testid="select-position-filter">
              <SelectTrigger className="w-[140px] bg-secondary/30 border-white/10" data-testid="filter-position-trigger">
                <SelectValue placeholder="Filter Position" />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/10">
                <SelectItem value="All" data-testid="filter-all">All Positions</SelectItem>
                <SelectItem value="Guard" data-testid="filter-guard">Guard</SelectItem>
                <SelectItem value="Wing" data-testid="filter-wing">Wing</SelectItem>
                <SelectItem value="Big" data-testid="filter-big">Big</SelectItem>
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
                  <SortableHeader label="PPG" sortKeyName="ppg" />
                  <SortableHeader label="RPG" sortKeyName="rpg" />
                  <SortableHeader label="APG" sortKeyName="apg" />
                  <SortableHeader label="SPG" sortKeyName="spg" />
                  <SortableHeader label="BPG" sortKeyName="bpg" />
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
                      <TableCell className="font-medium">{player.ppg}</TableCell>
                      <TableCell className="font-medium">{player.rpg}</TableCell>
                      <TableCell className="font-medium">{player.apg}</TableCell>
                      <TableCell className="font-medium">{player.spg}</TableCell>
                      <TableCell className="font-medium">{player.bpg}</TableCell>
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
