import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { api } from "@shared/routes";
import { GradeBadge } from "@/components/GradeBadge";
import { useSport } from "@/components/SportToggle";
import { Trophy, Medal, Filter, X, Users } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkeletonLeaderboardRow } from "@/components/ui/skeleton-premium";

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

// Helper to format comma-separated positions with full labels
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

export default function Leaderboard() {
  const currentSport = useSport();
  const [stateFilter, setStateFilter] = useState<string>("");
  const [positionFilter, setPositionFilter] = useState<string>("");
  const [levelFilter, setLevelFilter] = useState<string>("");

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

  const hasFilters = stateFilter || positionFilter || levelFilter;

  const clearFilters = () => {
    setStateFilter("");
    setPositionFilter("");
    setLevelFilter("");
  };

  if (isLoading) {
    return (
      <div className="space-y-6 md:space-y-8 animate-fade-in pb-24 md:pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="h-10 w-56 skeleton-cyan rounded" />
            <div className="h-4 w-48 skeleton-premium rounded" />
          </div>
        </div>
        <div className="space-y-3">
          <SkeletonLeaderboardRow />
          <SkeletonLeaderboardRow />
          <SkeletonLeaderboardRow />
          <SkeletonLeaderboardRow />
          <SkeletonLeaderboardRow />
        </div>
      </div>
    );
  }

  const isBasketball = currentSport === 'basketball';

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl md:text-4xl font-display font-bold bg-gradient-to-b from-white to-cyan-100/80 bg-clip-text text-transparent tracking-wide" data-testid="text-leaderboard-title">Player Leaderboard</h2>
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs font-medium border",
                isBasketball 
                  ? "border-orange-500/30 text-orange-400 bg-orange-500/10" 
                  : "border-amber-700/30 text-amber-500 bg-amber-700/10"
              )}
              data-testid="badge-current-sport"
            >
              {isBasketball ? "Basketball" : "Football"}
            </Badge>
          </div>
          <p className="text-sm md:text-base text-cyan-200/50 font-medium">Top performers based on average game grade</p>
        </div>
      </div>

      <div className="relative rounded-xl p-4 bg-gradient-to-br from-cyan-500/[0.04] to-transparent border border-cyan-500/[0.08] backdrop-blur-xl overflow-hidden">
        <div className="absolute inset-x-[20%] top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-white">Filters</span>
          {hasFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="ml-auto text-xs text-cyan-400 hover:text-cyan-300"
              data-testid="button-clear-filters"
            >
              <X className="w-3 h-3 mr-1" />
              Clear All
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select value={stateFilter || "all"} onValueChange={(v) => setStateFilter(v === "all" ? "" : v)}>
            <SelectTrigger data-testid="select-state-filter">
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
            <SelectTrigger data-testid="select-position-filter">
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
            <SelectTrigger data-testid="select-level-filter">
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
      </div>

      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-cyan-500/[0.03] to-transparent border border-cyan-500/[0.08] backdrop-blur-xl animate-fade-up delay-300">
        <div className="absolute inset-x-[15%] top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <div className="min-w-[700px] md:min-w-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-cyan-500/[0.05] to-transparent border-b border-cyan-500/[0.08]">
                  <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-cyan-300/60">Rank</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-cyan-300/60">Player</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-cyan-300/60">Grade</th>
                  {isBasketball ? (
                    <>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-cyan-300/60">PPG</th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-cyan-300/60">RPG</th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-cyan-300/60">APG</th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-cyan-300/60">FG%</th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-cyan-300/60">3P%</th>
                    </>
                  ) : (
                    <>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-cyan-300/60">Pass YDS</th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-cyan-300/60">Rush YDS</th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-cyan-300/60">Rec YDS</th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-cyan-300/60">Tackles</th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-cyan-300/60">TDs</th>
                    </>
                  )}
                  <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-cyan-300/60">Games</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/[0.06]">
                {leaderboard?.length === 0 ? (
                  <tr>
                    <td colSpan={isBasketball ? 9 : 9} className="px-3 md:px-6 py-4">
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
                  leaderboard?.map((entry: any, index: number) => (
                    <tr 
                      key={entry.playerId} 
                      className={cn(
                        "animate-row-fade table-row-hover transition-all duration-300 group",
                        index === 0 && "glow-gold",
                        index === 1 && "glow-silver",
                        index === 2 && "glow-bronze"
                      )}
                      data-row-index={index}
                      data-testid={`row-leaderboard-${index}`}
                    >
                      <td className="px-3 md:px-6 py-4 md:py-6">
                        <div className="flex items-center gap-2 md:gap-3">
                          {index === 0 && <Trophy className={cn("w-4 h-4 md:w-5 md:h-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]", index < 3 && "pulse-rank-badge")} />}
                          {index === 1 && <Medal className={cn("w-4 h-4 md:w-5 md:h-5 text-slate-300 drop-shadow-[0_0_6px_rgba(148,163,184,0.4)]", index < 3 && "pulse-rank-badge")} />}
                          {index === 2 && <Medal className={cn("w-4 h-4 md:w-5 md:h-5 text-rose-400 drop-shadow-[0_0_6px_rgba(251,113,133,0.4)]", index < 3 && "pulse-rank-badge")} />}
                          <span className={cn(
                            "font-display font-bold text-base md:text-lg",
                            index < 3 ? "bg-gradient-to-b from-white to-cyan-100/80 bg-clip-text text-transparent" : "text-cyan-200/50"
                          )}>
                            #{index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-4 md:py-6">
                        <Link href={`/players/${entry.playerId}`} data-testid={`link-player-profile-${entry.playerId}`}>
                          <div className="flex items-center gap-2 md:gap-4 cursor-pointer">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-transparent border border-cyan-400/20 flex items-center justify-center font-bold text-xs md:text-sm shrink-0 text-cyan-300 shadow-[0_0_15px_rgba(100,200,255,0.1)]">
                              {entry.jerseyNumber || "#"}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-sm md:text-base text-white group-hover:text-cyan-300 transition-colors truncate">{entry.name}</div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] md:text-xs text-cyan-200/40 truncate">{entry.team || "No Team"}</span>
                                <span className="text-[10px] text-cyan-400/60">{formatPositions(entry.position)}</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-3 md:px-6 py-4 md:py-6">
                        <GradeBadge grade={entry.avgGrade} size="sm" />
                      </td>
                      {isBasketball ? (
                        <>
                          <td className="px-3 md:px-6 py-4 md:py-6 font-mono font-bold text-sm md:text-base bg-gradient-to-b from-white to-cyan-100/80 bg-clip-text text-transparent">
                            {entry.avgPoints ?? 0}
                          </td>
                          <td className="px-3 md:px-6 py-4 md:py-6 font-mono text-sm md:text-base text-cyan-200/70">
                            {entry.avgRebounds ?? 0}
                          </td>
                          <td className="px-3 md:px-6 py-4 md:py-6 font-mono text-sm md:text-base text-cyan-200/70">
                            {entry.avgAssists ?? 0}
                          </td>
                          <td className="px-3 md:px-6 py-4 md:py-6 font-mono text-sm md:text-base text-cyan-200/70">
                            {entry.fgPct ?? 0}%
                          </td>
                          <td className="px-3 md:px-6 py-4 md:py-6 font-mono text-sm md:text-base text-cyan-200/70">
                            {entry.threePct ?? 0}%
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 md:px-6 py-4 md:py-6 font-mono font-bold text-sm md:text-base bg-gradient-to-b from-white to-cyan-100/80 bg-clip-text text-transparent">
                            {entry.avgPassYds ?? 0}
                          </td>
                          <td className="px-3 md:px-6 py-4 md:py-6 font-mono text-sm md:text-base text-cyan-200/70">
                            {entry.avgRushYds ?? 0}
                          </td>
                          <td className="px-3 md:px-6 py-4 md:py-6 font-mono text-sm md:text-base text-cyan-200/70">
                            {entry.avgRecYds ?? 0}
                          </td>
                          <td className="px-3 md:px-6 py-4 md:py-6 font-mono text-sm md:text-base text-cyan-200/70">
                            {entry.avgTackles ?? 0}
                          </td>
                          <td className="px-3 md:px-6 py-4 md:py-6 font-mono text-sm md:text-base text-cyan-200/70">
                            {entry.totalTDs ?? 0}
                          </td>
                        </>
                      )}
                      <td className="px-3 md:px-6 py-4 md:py-6 text-sm md:text-base text-cyan-200/50">
                        {entry.gamesPlayed}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
