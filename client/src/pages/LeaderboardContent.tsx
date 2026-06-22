import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { api } from "@shared/routes";
import { GradeBadge } from "@/components/GradeBadge";
import { useSport } from "@/components/SportToggle";
import { 
  Trophy, Medal, Filter, X, Users, Search, Crown, 
  TrendingUp, Star, ChevronRight, Target, Share2
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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SkeletonLeaderboardRow, SkeletonLeaderboardHeader } from "@/components/ui/skeleton-premium";
import { ShareableRankingCard } from "@/components/ShareableCard";
import html2canvas from "html2canvas";

function formatPositions(position: string): string {
  return position?.split(',').map(p => p.trim()).join(' / ') || position;
}

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

const BASKETBALL_POSITIONS = ["Guard", "Wing", "Big"];

const LEVELS = [
  { value: "middle_school", label: "Middle School" },
  { value: "high_school", label: "High School" },
  { value: "college", label: "College" },
];

const RANK_STYLES = {
  1: {
    bg: "from-yellow-500/20",
    border: "border-yellow-500/40",
    glow: "shadow-[0_0_30px_rgba(234,179,8,0.3)]",
    icon: Trophy,
    iconColor: "text-yellow-600 dark:text-yellow-400",
    ringColor: "ring-yellow-500/30",
  },
  2: {
    bg: "from-slate-300/20",
    border: "border-slate-400/40",
    glow: "shadow-[0_0_20px_rgba(148,163,184,0.2)]",
    icon: Medal,
    iconColor: "text-slate-600 dark:text-slate-300",
    ringColor: "ring-slate-400/30",
  },
  3: {
    bg: "from-orange-600/20",
    border: "border-orange-600/40",
    glow: "shadow-[0_0_20px_rgba(234,88,12,0.2)]",
    icon: Medal,
    iconColor: "text-orange-600 dark:text-orange-400",
    ringColor: "ring-orange-500/30",
  },
};

export default function LeaderboardContent() {
  const currentSport = useSport();
  const [stateFilter, setStateFilter] = useState<string>("");
  const [positionFilter, setPositionFilter] = useState<string>("");
  const [levelFilter, setLevelFilter] = useState<string>("");
  const [cityFilter, setCityFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [shareRanking, setShareRanking] = useState<{
    rank: number;
    entry: any;
  } | null>(null);
  const rankCardRef = useRef<HTMLDivElement>(null);

  const positions = BASKETBALL_POSITIONS;

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: [api.analytics.leaderboard.path, currentSport, stateFilter, positionFilter, levelFilter, cityFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("sport", currentSport);
      if (stateFilter) params.append("state", stateFilter);
      if (positionFilter) params.append("position", positionFilter);
      if (levelFilter) params.append("level", levelFilter);
      if (cityFilter) params.append("city", cityFilter);
      
      const url = `${api.analytics.leaderboard.path}?${params.toString()}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    }
  });

  const hasFilters = stateFilter || positionFilter || levelFilter || cityFilter || searchQuery;

  const clearFilters = () => {
    setStateFilter("");
    setPositionFilter("");
    setLevelFilter("");
    setCityFilter("");
    setSearchQuery("");
  };

  const filteredLeaderboard = leaderboard?.filter((entry: any) => {
    if (!searchQuery) return true;
    return entry.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           entry.team?.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  const handleDownloadRankCard = async () => {
    if (!rankCardRef.current) return;
    try {
      const canvas = await html2canvas(rankCardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `caliber-ranking-${shareRanking?.entry.name?.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Error generating image:", error);
    }
  };

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
      <div className="relative overflow-hidden rounded-2xl bg-card/80 border border-yellow-500/20">
        <div className="absolute inset-0 opacity-20" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-500/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 blur-[60px] rounded-full" />
        
        <div className="relative z-10 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" style={{ filter: "drop-shadow(0 0 8px #c8d4de)" }} />
                <span className="text-xs uppercase tracking-wider text-yellow-600 dark:text-yellow-400 font-semibold">Rankings</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold" data-testid="text-leaderboard-title">
                <span className="from-white">
                  Player Leaderboard
                </span>
              </h2>
              <p className="text-muted-foreground">
                Top performers ranked by average game grade
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge
                className="px-4 py-2 text-sm font-bold flex items-center gap-2 from-accent to-accent/90 text-accent-foreground"
                data-testid="badge-current-sport"
              >
                <Target className="w-4 h-4" />
                Basketball
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <Card className="relative overflow-hidden bg-card/80 border-border">
        <div className="absolute inset-x-[20%] top-0 h-px from-transparent via-accent/30 to-transparent" />
        
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-foreground">Filters</span>
            </div>
            {hasFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="text-xs text-accent"
                data-testid="button-clear-filters"
              >
                <X className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-muted/50 border-border focus:border-accent/50"
                data-testid="input-search"
              />
            </div>
            
            <Select value={stateFilter || "all"} onValueChange={(v) => setStateFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="bg-muted/50 border-border" data-testid="select-state-filter">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {US_STATES.map((state) => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Filter by city..."
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="bg-muted/50 border-border focus:border-accent/50"
              data-testid="input-city-filter"
            />

            <Select value={positionFilter || "all"} onValueChange={(v) => setPositionFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="bg-muted/50 border-border" data-testid="select-position-filter">
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
              <SelectTrigger className="bg-muted/50 border-border" data-testid="select-level-filter">
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
                className="group relative"
              >
                <Link href={`/players/${entry.playerId}`} data-testid={`link-top-player-${index}`}>
                  <Card className={cn(
                    "relative overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-pointer",
                    "border",
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
                            "from-muted to-muted/50"
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
                          <h3 className="font-bold text-lg text-foreground truncate">{entry.name}</h3>
                          <p className="text-sm text-muted-foreground">{entry.team || "No Team"}</p>
                          <p className="text-xs text-muted-foreground">{formatPositions(entry.position)}</p>
                          {(entry.city || entry.state) && (
                            <p className="text-xs text-accent/60">{[entry.city, entry.state].filter(Boolean).join(', ')}</p>
                          )}
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
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="absolute top-3 left-3 invisible group-hover:visible transition-opacity z-10"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShareRanking({ rank: index + 1, entry }); }}
                  data-testid={`button-share-ranking-${index + 1}`}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </motion.div>
            );
          })}
        </div>
      )}

      <Card className="relative overflow-hidden bg-card/80 border-border">
        <div className="absolute inset-x-[15%] top-0 h-px from-transparent via-accent/30 to-transparent" />
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="from-accent/5 to-transparent border-b border-border/50">
                <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider text-accent/60">Rank</th>
                <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider text-accent/60">Player</th>
                <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider text-accent/60">Grade</th>
                <>
                    <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider text-accent/60">PPG</th>
                    <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider text-accent/60">RPG</th>
                    <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider text-accent/60">APG</th>
                    <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider text-accent/60">FG%</th>
                  </>
                <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider text-accent/60">Games</th>
                <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider text-accent/60"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-4">
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
                        className="transition-all duration-300 hover:hover:from-accent/5 hover:to-transparent group"
                        data-testid={`row-leaderboard-${rank}`}
                      >
                        <td className="px-4 md:px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg text-accent/50">#{rank}</span>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <Link href={`/players/${entry.playerId}`} data-testid={`link-player-profile-${entry.playerId}`}>
                            <div className="flex items-center gap-3 cursor-pointer">
                              <div className="w-10 h-10 rounded-lg from-accent/20 to-transparent border border-accent/20 flex items-center justify-center font-bold text-sm text-accent shrink-0">
                                {entry.jerseyNumber || "#"}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-foreground group-hover:text-accent transition-colors truncate">
                                  {entry.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {entry.team || "No Team"} • {entry.position}
                                  {(entry.city || entry.state) && ` • ${[entry.city, entry.state].filter(Boolean).join(', ')}`}
                                </p>
                              </div>
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <GradeBadge grade={entry.avgGrade} size="sm" />
                        </td>
                        <>
                            <td className="px-4 md:px-6 py-4 font-mono font-bold text-foreground">{entry.avgPoints ?? 0}</td>
                            <td className="px-4 md:px-6 py-4 font-mono text-accent/70">{entry.avgRebounds ?? 0}</td>
                            <td className="px-4 md:px-6 py-4 font-mono text-accent/70">{entry.avgAssists ?? 0}</td>
                            <td className="px-4 md:px-6 py-4 font-mono text-accent/70">{entry.fgPct ?? 0}%</td>
                          </>
                        <td className="px-4 md:px-6 py-4 text-accent/50">{entry.gamesPlayed}</td>
                        <td className="px-4 md:px-6 py-4">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="invisible group-hover:visible"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShareRanking({ rank, entry }); }}
                            data-testid={`button-share-ranking-${rank}`}
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {shareRanking && (
        <Dialog open={!!shareRanking} onOpenChange={() => setShareRanking(null)}>
          <DialogContent className="max-w-[450px] bg-card border-border">
            <div className="flex flex-col items-center gap-4">
              <div ref={rankCardRef}>
                <ShareableRankingCard
                  playerName={shareRanking.entry.name}
                  playerPhoto={shareRanking.entry.photoUrl}
                  rank={shareRanking.rank}
                  totalPlayers={filteredLeaderboard.length}
                  avgGrade={shareRanking.entry.avgGrade}
                  sport={currentSport}
                  position={formatPositions(shareRanking.entry.position)}
                  city={shareRanking.entry.city}
                  state={shareRanking.entry.state}
                />
              </div>
              <Button onClick={handleDownloadRankCard} data-testid="button-download-ranking-card">
                Download Card
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
