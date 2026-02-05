import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { api } from "@shared/routes";
import { GradeBadge } from "@/components/GradeBadge";
import { useSport } from "@/components/SportToggle";
import { 
  Trophy, Medal, Filter, X, Users, Search, Crown, 
  TrendingUp, Star, ChevronRight, Flame, Target
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkeletonLeaderboardRow, SkeletonLeaderboardHeader } from "@/components/ui/skeleton-premium";

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming"
];

import { FOOTBALL_POSITION_LABELS, type FootballPosition } from "@shared/sports-config";

const BASKETBALL_POSITIONS = ["Guard", "Wing", "Big"];
const FOOTBALL_POSITIONS = ["QB", "RB", "WR", "TE", "OL", "DL", "LB", "DB", "K", "P"];

function formatPositions(position: string): string {
  return position?.split(',').map(p => p.trim()).map(pos => 
    FOOTBALL_POSITION_LABELS[pos as FootballPosition] || pos
  ).join(' / ') || position;
}

const LEVELS = [
  { value: "middle_school", label: "Middle School" },
  { value: "high_school", label: "High School" },
  { value: "college", label: "College" },
];

const RANK_STYLES = {
  1: {
    bg: "from-yellow-500/20 to-yellow-600/10",
    border: "border-yellow-500/40",
    glow: "shadow-[0_0_30px_rgba(234,179,8,0.3)]",
    icon: Trophy,
    iconColor: "text-yellow-400",
    ringColor: "ring-yellow-500/30",
  },
  2: {
    bg: "from-slate-300/20 to-slate-400/10",
    border: "border-slate-400/40",
    glow: "shadow-[0_0_20px_rgba(148,163,184,0.2)]",
    icon: Medal,
    iconColor: "text-slate-300",
    ringColor: "ring-slate-400/30",
  },
  3: {
    bg: "from-orange-600/20 to-orange-700/10",
    border: "border-orange-600/40",
    glow: "shadow-[0_0_20px_rgba(234,88,12,0.2)]",
    icon: Medal,
    iconColor: "text-orange-400",
    ringColor: "ring-orange-500/30",
  },
};

export default function LeaderboardContent() {
  const currentSport = useSport();
  const [stateFilter, setStateFilter] = useState<string>("");
  const [positionFilter, setPositionFilter] = useState<string>("");
  const [levelFilter, setLevelFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const positions = currentSport === 'football' ? FOOTBALL_POSITIONS : BASKETBALL_POSITIONS;

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: [api.analytics.leaderboard.path, currentSport, stateFilter, positionFilter, levelFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("sport", currentSport);
      if (stateFilter) params.append("state", stateFilter);
      if (positionFilter) params.append("position", positionFilter);
      if (levelFilter) params.append("level", levelFilter);
      
      const url = `${api.analytics.leaderboard.path}?${params.toString()}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    }
  });

  const hasFilters = stateFilter || positionFilter || levelFilter || searchQuery;

  const clearFilters = () => {
    setStateFilter("");
    setPositionFilter("");
    setLevelFilter("");
    setSearchQuery("");
  };

  const filteredLeaderboard = leaderboard?.filter((entry: any) => {
    if (!searchQuery) return true;
    return entry.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           entry.team?.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  const isBasketball = currentSport === 'basketball';

  if (isLoading) {
    return (
      <div className="space-y-6 pb-24 md:pb-8">
        <SkeletonLeaderboardHeader />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonLeaderboardRow key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-black/60 via-yellow-950/10 to-black/60 border border-yellow-500/20">
        <div className="absolute inset-0 cyber-grid opacity-20" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-500/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/10 blur-[60px] rounded-full" />
        
        <div className="relative z-10 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" style={{ filter: "drop-shadow(0 0 8px #fbbf24)" }} />
                <span className="text-xs uppercase tracking-wider text-yellow-400 font-semibold">Rankings</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold" data-testid="text-leaderboard-title">
                <span className="bg-gradient-to-r from-white via-yellow-200 to-yellow-400 bg-clip-text text-transparent">
                  Player Leaderboard
                </span>
              </h2>
              <p className="text-muted-foreground">
                Top performers ranked by average game grade
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge 
                className={cn(
                  "px-4 py-2 text-sm font-bold flex items-center gap-2",
                  isBasketball 
                    ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white" 
                    : "bg-gradient-to-r from-amber-700 to-amber-600 text-white"
                )}
                style={{ boxShadow: isBasketball ? "0 0 20px rgba(234,88,12,0.3)" : "0 0 20px rgba(180,83,9,0.3)" }}
                data-testid="badge-current-sport"
              >
                {isBasketball ? (
                  <>
                    <Target className="w-4 h-4" />
                    Basketball
                  </>
                ) : (
                  <>
                    <Flame className="w-4 h-4" />
                    Football
                  </>
                )}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <Card className="relative overflow-hidden bg-gradient-to-br from-black/60 to-black/30 border-white/10">
        <div className="absolute inset-x-[20%] top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
        
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-white">Filters</span>
            </div>
            {hasFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="text-xs text-cyan-400"
                data-testid="button-clear-filters"
              >
                <X className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-black/20 border-white/10 focus:border-cyan-500/50"
                data-testid="input-search"
              />
            </div>
            
            <Select value={stateFilter || "all"} onValueChange={(v) => setStateFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="bg-black/20 border-white/10" data-testid="select-state-filter">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {US_STATES.map((state) => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={positionFilter || "all"} onValueChange={(v) => setPositionFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="bg-black/20 border-white/10" data-testid="select-position-filter">
                <SelectValue placeholder="All Positions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                {positions.map((pos) => (
                  <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={levelFilter || "all"} onValueChange={(v) => setLevelFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="bg-black/20 border-white/10" data-testid="select-level-filter">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredLeaderboard.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredLeaderboard.slice(0, 3).map((entry: any, index: number) => {
            const rankStyle = RANK_STYLES[(index + 1) as keyof typeof RANK_STYLES];
            const Icon = rankStyle?.icon || Medal;
            
            return (
              <motion.div
                key={entry.playerId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/players/${entry.playerId}`} data-testid={`link-top-player-${index}`}>
                  <Card className={cn(
                    "relative overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-pointer",
                    "bg-gradient-to-br border",
                    rankStyle?.bg,
                    rankStyle?.border,
                    rankStyle?.glow,
                    index === 0 && "ring-2",
                    rankStyle?.ringColor
                  )}>
                    <div className="absolute top-3 right-3">
                      <Icon className={cn("w-8 h-8", rankStyle?.iconColor)} style={{ filter: `drop-shadow(0 0 10px currentColor)` }} />
                    </div>
                    
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className={cn(
                            "w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold border-2",
                            rankStyle?.border,
                            "bg-gradient-to-br from-white/10 to-white/5"
                          )}>
                            {entry.jerseyNumber || "#"}
                          </div>
                          <div className={cn(
                            "absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                            index === 0 && "bg-yellow-500 text-black",
                            index === 1 && "bg-slate-400 text-black",
                            index === 2 && "bg-orange-500 text-black"
                          )}>
                            #{index + 1}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-white truncate">{entry.name}</h3>
                          <p className="text-sm text-muted-foreground">{entry.team || "No Team"}</p>
                          <p className="text-xs text-muted-foreground">{formatPositions(entry.position)}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between">
                        <GradeBadge grade={entry.avgGrade} size="lg" />
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Games</p>
                          <p className="font-bold text-lg">{entry.gamesPlayed}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      <Card className="relative overflow-hidden bg-gradient-to-br from-black/60 to-black/30 border-white/10">
        <div className="absolute inset-x-[15%] top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gradient-to-r from-cyan-500/5 to-transparent border-b border-white/5">
                <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider text-cyan-300/60">Rank</th>
                <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider text-cyan-300/60">Player</th>
                <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider text-cyan-300/60">Grade</th>
                {isBasketball ? (
                  <>
                    <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider text-cyan-300/60">PPG</th>
                    <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider text-cyan-300/60">RPG</th>
                    <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider text-cyan-300/60">APG</th>
                    <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider text-cyan-300/60">FG%</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider text-cyan-300/60">Pass YDS</th>
                    <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider text-cyan-300/60">Rush YDS</th>
                    <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider text-cyan-300/60">Rec YDS</th>
                    <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider text-cyan-300/60">TDs</th>
                  </>
                )}
                <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider text-cyan-300/60">Games</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={isBasketball ? 8 : 8} className="px-6 py-4">
                    <EmptyState
                      icon={hasFilters ? Trophy : Users}
                      title={hasFilters ? "No Matches Found" : "No Players Yet"}
                      description={hasFilters 
                        ? "No players match your current filters. Try adjusting your search criteria."
                        : "Add players and log games to see them ranked on the leaderboard."
                      }
                      action={hasFilters 
                        ? { label: "Clear Filters", onClick: clearFilters }
                        : { label: "Add Players", href: "/players" }
                      }
                      variant="compact"
                    />
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filteredLeaderboard.slice(3).map((entry: any, index: number) => {
                    const rank = index + 4;
                    return (
                      <motion.tr 
                        key={entry.playerId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="transition-all duration-300 hover:bg-gradient-to-r hover:from-cyan-500/5 hover:to-transparent group"
                        data-testid={`row-leaderboard-${rank}`}
                      >
                        <td className="px-4 md:px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg text-cyan-200/50">#{rank}</span>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <Link href={`/players/${entry.playerId}`} data-testid={`link-player-profile-${entry.playerId}`}>
                            <div className="flex items-center gap-3 cursor-pointer">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-transparent border border-cyan-400/20 flex items-center justify-center font-bold text-sm text-cyan-300 shrink-0">
                                {entry.jerseyNumber || "#"}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                                  {entry.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {entry.team || "No Team"} • {formatPositions(entry.position)}
                                </p>
                              </div>
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <GradeBadge grade={entry.avgGrade} size="sm" />
                        </td>
                        {isBasketball ? (
                          <>
                            <td className="px-4 md:px-6 py-4 font-mono font-bold text-white">{entry.avgPoints ?? 0}</td>
                            <td className="px-4 md:px-6 py-4 font-mono text-cyan-200/70">{entry.avgRebounds ?? 0}</td>
                            <td className="px-4 md:px-6 py-4 font-mono text-cyan-200/70">{entry.avgAssists ?? 0}</td>
                            <td className="px-4 md:px-6 py-4 font-mono text-cyan-200/70">{entry.fgPct ?? 0}%</td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 md:px-6 py-4 font-mono font-bold text-white">{entry.avgPassYds ?? 0}</td>
                            <td className="px-4 md:px-6 py-4 font-mono text-cyan-200/70">{entry.avgRushYds ?? 0}</td>
                            <td className="px-4 md:px-6 py-4 font-mono text-cyan-200/70">{entry.avgRecYds ?? 0}</td>
                            <td className="px-4 md:px-6 py-4 font-mono text-cyan-200/70">{entry.totalTDs ?? 0}</td>
                          </>
                        )}
                        <td className="px-4 md:px-6 py-4 text-cyan-200/50">{entry.gamesPlayed}</td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
