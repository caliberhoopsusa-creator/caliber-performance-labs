import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { GradeBadge } from "@/components/GradeBadge";
import { Trophy, Medal, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const POSITIONS = ["Guard", "Wing", "Big"];
const LEVELS = [
  { value: "middle_school", label: "Middle School" },
  { value: "high_school", label: "High School" },
  { value: "college", label: "College" },
];

export default function Leaderboard() {
  const [stateFilter, setStateFilter] = useState<string>("");
  const [positionFilter, setPositionFilter] = useState<string>("");
  const [levelFilter, setLevelFilter] = useState<string>("");

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: [api.analytics.leaderboard.path, stateFilter, positionFilter, levelFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (stateFilter) params.append("state", stateFilter);
      if (positionFilter) params.append("position", positionFilter);
      if (levelFilter) params.append("level", levelFilter);
      
      const url = params.toString() 
        ? `${api.analytics.leaderboard.path}?${params.toString()}`
        : api.analytics.leaderboard.path;
      
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
      <div className="flex h-full items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-4xl font-display font-bold text-white uppercase tracking-tight" data-testid="text-leaderboard-title">Player Leaderboard</h2>
          <p className="text-sm md:text-base text-muted-foreground font-medium">Top performers based on average game grade</p>
        </div>
      </div>

      <div className="glass-card p-4 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-white">Filters</span>
          {hasFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="ml-auto text-xs"
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
              {POSITIONS.map((pos) => (
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

      <div className="elite-card overflow-hidden animate-fade-up delay-300">
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <div className="min-w-[600px] md:min-w-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground">Rank</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground">Player</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground">Grade</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground">PPG</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground">Games</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leaderboard?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 md:px-6 py-12 text-center">
                      <div className="text-muted-foreground">
                        <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No players found matching your filters</p>
                        {hasFilters && (
                          <Button 
                            variant="ghost" 
                            onClick={clearFilters} 
                            className="text-primary mt-2"
                            data-testid="button-clear-filters-empty"
                          >
                            Clear filters
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  leaderboard?.map((entry: any, index: number) => (
                    <tr key={entry.playerId} className="transition-colors group hover:bg-white/10" data-testid={`row-leaderboard-${index}`}>
                      <td className="px-3 md:px-6 py-4 md:py-6">
                        <div className="flex items-center gap-2 md:gap-3">
                          {index === 0 && <Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />}
                          {index === 1 && <Medal className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />}
                          {index === 2 && <Medal className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />}
                          <span className={cn(
                            "font-display font-bold text-base md:text-lg",
                            index < 3 ? "text-white" : "text-muted-foreground"
                          )}>
                            #{index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-4 md:py-6">
                        <div className="flex items-center gap-2 md:gap-4">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-xs md:text-sm shrink-0">
                            {entry.jerseyNumber || "#"}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-sm md:text-base text-white group-hover:text-primary transition-colors truncate">{entry.name}</div>
                            <div className="text-[10px] md:text-xs text-muted-foreground truncate">{entry.team || "No Team"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-4 md:py-6">
                        <GradeBadge grade={entry.avgGrade} size="sm" />
                      </td>
                      <td className="px-3 md:px-6 py-4 md:py-6 font-mono font-bold text-sm md:text-base text-white">
                        {entry.avgPoints}
                      </td>
                      <td className="px-3 md:px-6 py-4 md:py-6 text-sm md:text-base text-muted-foreground">
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
