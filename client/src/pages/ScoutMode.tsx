import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { GradeBadge } from "@/components/GradeBadge";
import { Paywall } from "@/components/Paywall";
import { Binoculars, Users, TrendingUp, Filter, ChevronRight, Trophy, Zap, Shield, Target, Flame, Star } from "lucide-react";
import { BADGE_DEFINITIONS } from "@shared/schema";
import { ARCHETYPES, getPlayerArchetype, type ArchetypeId } from "@shared/archetypes";

interface ScoutPlayer {
  id: number;
  name: string;
  position: string;
  height: string | null;
  team: string | null;
  jerseyNumber: number | null;
  ppg: number;
  rpg: number;
  apg: number;
  avgGrade: string | null;
  hustleScore: number;
  gamesPlayed: number;
  topBadge: string | null;
  archetype: string | null;
}

const ARCHETYPE_ICONS: Record<ArchetypeId, React.ElementType> = {
  scoring_guard: Target,
  floor_general: Zap,
  three_and_d: Target,
  two_way_slasher: Zap,
  stretch_big: TrendingUp,
  paint_beast: Shield,
  glue_guy: Flame,
  sharpshooter: Target,
  lockdown_defender: Shield,
  all_around_star: Star,
};

function PlayerScoutCard({ player }: { player: ScoutPlayer }) {
  const badgeInfo = player.topBadge ? BADGE_DEFINITIONS[player.topBadge as keyof typeof BADGE_DEFINITIONS] : null;

  return (
    <Link href={`/players/${player.id}`}>
      <Card 
        className="hover-elevate cursor-pointer transition-all border-border/50 bg-card/80"
        data-testid={`scout-card-${player.id}`}
      >
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              {player.avgGrade ? (
                <GradeBadge grade={player.avgGrade} size="lg" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs">
                  N/A
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-bold text-white text-lg leading-tight truncate" data-testid={`scout-player-name-${player.id}`}>
                    {player.jerseyNumber && <span className="text-muted-foreground mr-1">#{player.jerseyNumber}</span>}
                    {player.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                    <span className="font-medium">{player.position}</span>
                    {player.height && (
                      <>
                        <span className="text-border">|</span>
                        <span>{player.height}</span>
                      </>
                    )}
                    {player.team && (
                      <>
                        <span className="text-border">|</span>
                        <span className="truncate">{player.team}</span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
              </div>

              <div className="flex items-center gap-4 text-sm mb-3">
                <div className="text-center">
                  <div className="font-bold text-white text-lg">{player.ppg}</div>
                  <div className="text-[10px] uppercase text-muted-foreground tracking-wide">PPG</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-white text-lg">{player.rpg}</div>
                  <div className="text-[10px] uppercase text-muted-foreground tracking-wide">RPG</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-white text-lg">{player.apg}</div>
                  <div className="text-[10px] uppercase text-muted-foreground tracking-wide">APG</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-white text-lg">{player.gamesPlayed}</div>
                  <div className="text-[10px] uppercase text-muted-foreground tracking-wide">GP</div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {player.archetype && (
                  <Badge 
                    variant="secondary" 
                    className="text-[10px] px-2 py-0.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30"
                    data-testid={`scout-archetype-${player.id}`}
                  >
                    <Star className="w-3 h-3 mr-1" />
                    {player.archetype}
                  </Badge>
                )}
                {badgeInfo && (
                  <Badge 
                    variant="secondary" 
                    className="text-[10px] px-2 py-0.5 bg-primary/20 text-primary border-primary/30"
                    data-testid={`scout-badge-${player.id}`}
                  >
                    <Trophy className="w-3 h-3 mr-1" />
                    {badgeInfo.name}
                  </Badge>
                )}
                <Badge 
                  variant="outline" 
                  className="text-[10px] px-2 py-0.5"
                >
                  Hustle: {player.hustleScore}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function PlayerCardSkeleton() {
  return (
    <Card className="border-border/50 bg-card/80">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Skeleton className="w-16 h-16 rounded-lg" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-4">
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-8 w-12" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ScoutMode() {
  const [position, setPosition] = useState("All");
  const [height, setHeight] = useState("All");
  const [grade, setGrade] = useState("All");
  const [sortBy, setSortBy] = useState("avgGradeScore");

  const queryParams = new URLSearchParams();
  if (position !== "All") queryParams.append("position", position);
  if (height !== "All") queryParams.append("minHeight", height);
  if (grade !== "All") queryParams.append("minGrade", grade);
  queryParams.append("sortBy", sortBy);

  const { data: players, isLoading } = useQuery<ScoutPlayer[]>({
    queryKey: ["/api/scout/players", position, height, grade, sortBy],
    queryFn: async () => {
      const res = await fetch(`/api/scout/players?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch players");
      return res.json();
    }
  });

  return (
    <Paywall requiredTier="pro" featureName="Scout Mode">
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Binoculars className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
                Caliber Scout Mode
              </h1>
              <p className="text-sm text-muted-foreground">
                Discover and evaluate standout talent
              </p>
            </div>
          </div>
        </div>

        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Filters</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Position</label>
                <Select value={position} onValueChange={setPosition}>
                  <SelectTrigger className="h-9" data-testid="filter-position">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Positions</SelectItem>
                    <SelectItem value="Guard">Guard</SelectItem>
                    <SelectItem value="Wing">Wing</SelectItem>
                    <SelectItem value="Big">Big</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Height</label>
                <Select value={height} onValueChange={setHeight}>
                  <SelectTrigger className="h-9" data-testid="filter-height">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Heights</SelectItem>
                    <SelectItem value="under-5-10">Under 5'10"</SelectItem>
                    <SelectItem value="5-10-to-6-2">5'10" - 6'2"</SelectItem>
                    <SelectItem value="6-2-to-6-6">6'2" - 6'6"</SelectItem>
                    <SelectItem value="6-6-plus">6'6"+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Grade</label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger className="h-9" data-testid="filter-grade">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Grades</SelectItem>
                    <SelectItem value="A">A Players Only</SelectItem>
                    <SelectItem value="B+">B+ and Above</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-9" data-testid="filter-sort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="avgGradeScore">Overall Grade</SelectItem>
                    <SelectItem value="ppg">Points Per Game</SelectItem>
                    <SelectItem value="rpg">Rebounds Per Game</SelectItem>
                    <SelectItem value="apg">Assists Per Game</SelectItem>
                    <SelectItem value="hustleScore">Hustle Score</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>
              {isLoading ? "Loading..." : `${players?.length || 0} players found`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="w-3 h-3" />
            <span>Sorted by {sortBy === "avgGradeScore" ? "Overall Grade" : sortBy.toUpperCase()}</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <>
              <PlayerCardSkeleton />
              <PlayerCardSkeleton />
              <PlayerCardSkeleton />
              <PlayerCardSkeleton />
              <PlayerCardSkeleton />
              <PlayerCardSkeleton />
            </>
          ) : players && players.length > 0 ? (
            players.map((player) => (
              <PlayerScoutCard key={player.id} player={player} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-white mb-1">No players found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or add more players to the roster.
              </p>
            </div>
          )}
        </div>
      </div>
    </Paywall>
  );
}
