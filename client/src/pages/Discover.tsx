import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { GradeBadge } from "@/components/GradeBadge";
import { Search, MapPin, GraduationCap, Users, ChevronRight, Sparkles, Eye, CheckCircle, Target, Film, Trophy } from "lucide-react";

interface DiscoverPlayer {
  id: number;
  name: string;
  position: string;
  height: string | null;
  team: string | null;
  photoUrl: string | null;
  city: string | null;
  state: string | null;
  school: string | null;
  graduationYear: number | null;
  currentTier: string;
  ppg: number;
  rpg: number;
  apg: number;
  avgGrade: string | null;
  gamesPlayed: number;
  openToOpportunities: boolean;
  highlightCount?: number;
  badgeCount?: number;
}

function getProfileCompleteness(player: DiscoverPlayer): number {
  let score = 0;
  const maxScore = 10;
  
  if (player.name) score += 1;
  if (player.position) score += 1;
  if (player.height) score += 1;
  if (player.photoUrl) score += 1;
  if (player.school) score += 1;
  if (player.city || player.state) score += 1;
  if (player.graduationYear) score += 1;
  if (player.team) score += 1;
  if (player.gamesPlayed > 0) score += 1;
  if (player.highlightCount && player.highlightCount > 0) score += 1;
  
  return Math.round((score / maxScore) * 100);
}

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

const GRADUATION_YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

const TIER_COLORS: Record<string, string> = {
  "Rookie": "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  "Starter": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "All-Star": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "MVP": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Hall of Fame": "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30",
};

function PlayerDiscoverCard({ player }: { player: DiscoverPlayer }) {
  const tierClass = TIER_COLORS[player.currentTier] || TIER_COLORS["Rookie"];
  const initials = player.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const profileComplete = getProfileCompleteness(player);
  const isRecruitReady = player.openToOpportunities && profileComplete >= 70;

  return (
    <Link href={`/players/${player.id}`}>
      <Card 
        className={`hover-elevate cursor-pointer transition-all h-full ${
          isRecruitReady 
            ? "border-green-500/50 bg-gradient-to-br from-green-500/5 to-card/80 backdrop-blur-sm" 
            : "border-border/50 bg-card/80 backdrop-blur-sm"
        }`}
        data-testid={`card-player-${player.id}`}
      >
        <CardContent className="p-4">
          {isRecruitReady && (
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-green-500/20">
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <Target className="w-3.5 h-3.5 text-green-400" />
              </div>
              <span className="text-xs font-bold text-green-400 uppercase tracking-wider">
                Recruit Ready
              </span>
              <div className="ml-auto flex items-center gap-1 text-xs text-green-400/70">
                <CheckCircle className="w-3 h-3" />
                {profileComplete}% Complete
              </div>
            </div>
          )}
          
          <div className="flex gap-4">
            <div className="flex-shrink-0 relative">
              <Avatar className={`w-16 h-16 rounded-lg border ${isRecruitReady ? 'border-green-500/50' : 'border-border/50'}`}>
                <AvatarImage src={player.photoUrl || undefined} alt={player.name} className="object-cover" />
                <AvatarFallback className="rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 text-primary font-bold text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {player.openToOpportunities && !isRecruitReady && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center border-2 border-card">
                  <Sparkles className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="min-w-0">
                  <h3 className="font-bold text-white text-lg leading-tight truncate">
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
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
              </div>

              {player.school && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span className="truncate">{player.school}</span>
                  {player.graduationYear && (
                    <span className="text-xs font-bold text-primary">'{String(player.graduationYear).slice(-2)}</span>
                  )}
                </div>
              )}

              {(player.city || player.state) && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate">
                    {[player.city, player.state].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm mb-3">
                <div className="text-center">
                  <div className="font-bold text-white text-base">{player.ppg}</div>
                  <div className="text-[10px] uppercase text-muted-foreground tracking-wide">PPG</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-white text-base">{player.rpg}</div>
                  <div className="text-[10px] uppercase text-muted-foreground tracking-wide">RPG</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-white text-base">{player.apg}</div>
                  <div className="text-[10px] uppercase text-muted-foreground tracking-wide">APG</div>
                </div>
                <div className="ml-auto">
                  {player.avgGrade ? (
                    <GradeBadge grade={player.avgGrade} size="sm" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">
                      N/A
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge 
                  variant="secondary" 
                  className={`text-[10px] px-2 py-0.5 ${tierClass}`}
                >
                  {player.currentTier}
                </Badge>
                {player.openToOpportunities && !isRecruitReady && (
                  <Badge 
                    variant="secondary" 
                    className="text-[10px] px-2 py-0.5 bg-green-500/20 text-green-400 border-green-500/30"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Open
                  </Badge>
                )}
                <Badge 
                  variant="outline" 
                  className="text-[10px] px-2 py-0.5"
                >
                  {player.gamesPlayed} GP
                </Badge>
                {player.highlightCount && player.highlightCount > 0 && (
                  <Badge 
                    variant="outline" 
                    className="text-[10px] px-2 py-0.5 text-primary border-primary/30"
                  >
                    <Film className="w-3 h-3 mr-1" />
                    {player.highlightCount}
                  </Badge>
                )}
                {player.badgeCount && player.badgeCount > 0 && (
                  <Badge 
                    variant="outline" 
                    className="text-[10px] px-2 py-0.5 text-amber-400 border-amber-500/30"
                  >
                    <Trophy className="w-3 h-3 mr-1" />
                    {player.badgeCount}
                  </Badge>
                )}
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
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Discover() {
  const [position, setPosition] = useState("All");
  const [state, setState] = useState("All");
  const [graduationYear, setGraduationYear] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [openOnly, setOpenOnly] = useState(false);

  const queryParams = new URLSearchParams();
  if (position !== "All") queryParams.append("position", position);
  if (state !== "All") queryParams.append("state", state);
  if (graduationYear !== "All") queryParams.append("graduationYear", graduationYear);
  if (searchQuery.trim()) queryParams.append("search", searchQuery.trim());
  if (openOnly) queryParams.append("openOnly", "true");

  const { data: players, isLoading } = useQuery<DiscoverPlayer[]>({
    queryKey: ["/api/discover", position, state, graduationYear, searchQuery, openOnly],
    queryFn: async () => {
      const res = await fetch(`/api/discover?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch players");
      return res.json();
    }
  });

  return (
    <div className="space-y-6" data-testid="page-discover">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/20 p-6 md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
                Discover Players
              </h1>
              <p className="text-sm text-muted-foreground">
                Find and connect with talented basketball players
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2">
              <label className="text-xs text-muted-foreground mb-1.5 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, school, or team..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                  data-testid="input-search"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Position</label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger className="h-9" data-testid="select-position">
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
              <label className="text-xs text-muted-foreground mb-1.5 block">State</label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger className="h-9" data-testid="select-state">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All States</SelectItem>
                  {US_STATES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Class Year</label>
              <Select value={graduationYear} onValueChange={setGraduationYear}>
                <SelectTrigger className="h-9" data-testid="select-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Years</SelectItem>
                  {GRADUATION_YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>
            {isLoading ? "Loading..." : `${players?.length || 0} players found`}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label 
            htmlFor="open-only" 
            className="text-sm text-muted-foreground cursor-pointer flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-green-400" />
            Open to Opportunities Only
          </label>
          <Switch
            id="open-only"
            checked={openOnly}
            onCheckedChange={setOpenOnly}
            data-testid="switch-open-only"
          />
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
            <PlayerDiscoverCard key={player.id} player={player} />
          ))
        ) : (
          <div className="col-span-full text-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-white text-lg mb-2">No players found</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Try adjusting your search or filters to find more players.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
