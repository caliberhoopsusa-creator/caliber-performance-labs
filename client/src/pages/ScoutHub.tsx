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
import { BASKETBALL_POSITIONS } from "@shared/sports-config";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Search, MapPin, GraduationCap, Users, Target, Award, 
  Trophy, Filter, ArrowUpDown, Crosshair, Zap, BookOpen,
  TrendingUp, Star, Eye, UserSearch, Sparkles
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface ScoutPlayer {
  id: number;
  name: string;
  sport: string;
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
  spg: number;
  bpg: number;
  avgGrade: string | null;
  gamesPlayed: number;
  openToOpportunities: boolean;
  gpa: number | null;
  threePtPct: number | null;
  hasCaliberBadge: boolean;
  stateRank: number | null;
  countryRank: number | null;
}

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

const GRADUATION_YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];
const GRADE_OPTIONS = ["All", "A+", "A", "A-", "B+", "B", "B-", "C+", "C"];
const PPG_OPTIONS = ["All", "5", "10", "15", "20", "25"];

const TIER_GLOW_COLORS: Record<string, { glow: string; border: string; text: string }> = {
  "Rookie": { glow: "rgba(113,113,122,0.3)", border: "border-zinc-500/40", text: "text-zinc-400" },
  "Starter": { glow: "rgba(59,130,246,0.4)", border: "border-blue-500/50", text: "text-blue-400" },
  "All-Star": { glow: "rgba(168,85,247,0.5)", border: "border-purple-500/50", text: "text-purple-400" },
  "MVP": { glow: "rgba(198,208,216,0.5)", border: "border-accent/50", text: "text-accent" },
  "Hall of Fame": { glow: "rgba(251,146,60,0.6)", border: "border-accent/50", text: "text-accent" },
};

function getGradeValue(grade: string | null): number {
  if (!grade) return 0;
  const gradeMap: Record<string, number> = {
    'A+': 12, 'A': 11, 'A-': 10,
    'B+': 9, 'B': 8, 'B-': 7,
    'C+': 6, 'C': 5, 'C-': 4,
    'D+': 3, 'D': 2, 'D-': 1,
    'F': 0
  };
  return gradeMap[grade] || 0;
}

interface ScoutPlayerCardProps {
  player: ScoutPlayer;
  index: number;
}

function ScoutPlayerCard({ player, index }: ScoutPlayerCardProps) {
  const tierStyles = TIER_GLOW_COLORS[player.currentTier] || TIER_GLOW_COLORS["Rookie"];
  const initials = player.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const isRecruitReady = player.openToOpportunities;

  const positionLabel = player.position?.split(',').map(p => p.trim()).join(' / ') || player.position;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link href={`/players/${player.id}`}>
        <Card 
          className={cn(
            "group cursor-pointer transition-all duration-300 h-full overflow-hidden relative",
            "bg-card/80 backdrop-blur-sm",
            "hover:scale-[1.02] hover:-translate-y-1",
            tierStyles.border,
            isRecruitReady && "ring-1 ring-green-500/30"
          )}
          style={{ 
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)" 
          }}
          data-testid={`card-scout-player-${player.id}`}
        >
          <div className="absolute inset-x-[10%] top-0 h-px from-transparent via-accent/30 to-transparent" />
          
          {isRecruitReady && (
            <div className="absolute top-0 left-0 right-0 flex justify-center">
              <Badge 
                className="rounded-t-none rounded-b-lg text-[10px] font-bold px-3 py-1 border-0"
                style={{ 
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  boxShadow: '0 4px 20px rgba(34, 197, 94, 0.4)',
                  color: 'white'
                }}
              >
                <Sparkles className="w-3 h-3 mr-1" />
                OPEN TO OPPORTUNITIES
              </Badge>
            </div>
          )}

          <CardContent className={cn("p-5", isRecruitReady && "pt-8")}>
            <div className="flex gap-4">
              <div className="relative">
                <div 
                  className="absolute inset-0 rounded-xl blur-md opacity-50 group-hover:opacity-80 transition-opacity"
                  style={{ background: tierStyles.glow }}
                />
                <Avatar className={cn(
                  "w-16 h-16 rounded-xl border-2 relative z-10",
                  tierStyles.border
                )}>
                  <AvatarImage src={player.photoUrl || undefined} alt={player.name} width={64} height={64} />
                  <AvatarFallback className="rounded-xl from-accent/20 to-accent/10 text-accent font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="min-w-0">
                    <h3 className="font-bold text-foreground truncate group-hover:text-accent transition-colors">
                      {player.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="text-accent/80">{positionLabel}</span>
                      {player.height && <span className="text-muted-foreground">• {player.height}</span>}
                    </div>
                  </div>
                  {player.avgGrade && (
                    <GradeBadge grade={player.avgGrade} size="lg" />
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {player.school && (
                    <Badge variant="outline" className="text-xs gap-1 py-0.5 border-border bg-muted/50">
                      <GraduationCap className="w-3 h-3 text-accent" />
                      {player.school}
                    </Badge>
                  )}
                  {(player.city || player.state) && (
                    <Badge variant="outline" className="text-xs gap-1 py-0.5 border-border bg-muted/50">
                      <MapPin className="w-3 h-3 text-accent" />
                      {player.city && player.state ? `${player.city}, ${player.state}` : player.state || player.city}
                    </Badge>
                  )}
                  {player.graduationYear && (
                    <Badge variant="outline" className="text-xs py-0.5 border-border bg-muted/50">
                      Class of {player.graduationYear}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center">
                  <StatDisplay value={(player.ppg || 0).toFixed(1)} label="PPG" />
                  <StatDisplay value={(player.rpg || 0).toFixed(1)} label="RPG" />
                  <StatDisplay value={(player.apg || 0).toFixed(1)} label="APG" />
                  <StatDisplay value={(player.spg || 0).toFixed(1)} label="SPG" />
                  <StatDisplay value={(player.bpg || 0).toFixed(1)} label="BPG" />
                </div>

            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-4">
              <Badge 
                variant="outline" 
                className={cn("text-xs", tierStyles.border, tierStyles.text)}
                style={{ background: `${tierStyles.glow.replace(')', ',0.15)')}` }}
              >
                {player.currentTier}
              </Badge>
              {player.gpa && player.gpa >= 3.0 && (
                <Badge variant="outline" className="text-xs gap-1 border-blue-500/30 text-blue-400 bg-blue-500/10">
                  <BookOpen className="w-3 h-3" />
                  {player.gpa.toFixed(1)} GPA
                </Badge>
              )}
              {player.hasCaliberBadge && (
                <Badge 
                  variant="outline"
                  className="text-xs gap-1 py-0.5"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(10,10,10,0.3) 100%)',
                    borderColor: 'rgba(212,175,55,0.4)',
                    color: '#D4AF37',
                    boxShadow: '0 0 10px rgba(212,175,55,0.2)'
                  }}
                >
                  <Award className="w-3 h-3" />
                  Caliber
                </Badge>
              )}
              {player.stateRank && player.state && (
                <Badge 
                  variant="outline"
                  className="text-xs gap-1 py-0.5"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(10,10,10,0.3) 100%)',
                    borderColor: 'rgba(212,175,55,0.4)',
                    color: '#D4AF37',
                    boxShadow: '0 0 10px rgba(212,175,55,0.2)'
                  }}
                >
                  <Trophy className="w-3 h-3" />
                  #{player.stateRank} {player.state}
                </Badge>
              )}
              {player.countryRank && (
                <Badge 
                  variant="outline"
                  className="text-xs gap-1 py-0.5"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(10,10,10,0.3) 100%)',
                    borderColor: 'rgba(59,130,246,0.4)',
                    color: '#3B82F6',
                    boxShadow: '0 0 10px rgba(59,130,246,0.2)'
                  }}
                >
                  <Star className="w-3 h-3" />
                  #{player.countryRank} USA
                </Badge>
              )}
              <Badge variant="outline" className="text-xs border-border bg-muted/50">
                {player.gamesPlayed} games
              </Badge>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

function StatDisplay({ value, label, isText }: { value: string | number; label: string; isText?: boolean }) {
  return (
    <div>
      <div 
        className={cn(
          "text-lg font-bold",
          isText ? "text-accent/80 text-sm" : "text-accent"
        )}
        style={!isText ? { textShadow: '0 0 15px rgba(224,36,36,0.4)' } : undefined}
      >
        {value}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function PlayerCardSkeleton() {
  return (
    <Card className="border-accent/[0.08] bg-card/80 relative overflow-hidden">
      <div className="absolute inset-x-[10%] top-0 h-px from-transparent via-accent/20 to-transparent" />
      <CardContent className="p-5">
        <div className="flex gap-4">
          <Skeleton className="w-16 h-16 rounded-xl skeleton-premium" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-5 w-3/4 skeleton-premium" />
            <Skeleton className="h-4 w-1/2 skeleton-premium" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-5 w-20 rounded-full skeleton-premium" />
              <Skeleton className="h-5 w-16 rounded-full skeleton-premium" />
            </div>
          </div>
          <Skeleton className="h-10 w-10 rounded-full skeleton-premium" />
        </div>
        <div className="mt-4 pt-4 border-t border-accent/[0.06]">
          <div className="grid grid-cols-4 gap-3 text-center">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-6 w-10 mx-auto skeleton-premium" />
                <Skeleton className="h-3 w-8 mx-auto skeleton-premium" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-4">
          <Skeleton className="h-5 w-16 rounded-full skeleton-premium" />
          <Skeleton className="h-5 w-20 rounded-full skeleton-premium" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ScoutHub() {
  const sport = 'basketball';
  const [position, setPosition] = useState("All");
  const [state, setState] = useState("All");
  const [graduationYear, setGraduationYear] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [minGrade, setMinGrade] = useState("All");
  const [sortBy, setSortBy] = useState("grade");
  const [minPpg, setMinPpg] = useState("All");

  const queryParams = new URLSearchParams();
  queryParams.append("sport", sport);
  if (position !== "All") queryParams.append("position", position);
  if (state !== "All") queryParams.append("state", state);
  if (graduationYear !== "All") queryParams.append("graduationYear", graduationYear);
  if (searchQuery.trim()) queryParams.append("search", searchQuery.trim());
  if (openOnly) queryParams.append("openOnly", "true");
  if (minGrade !== "All") queryParams.append("minGrade", minGrade);
  if (minPpg !== "All") queryParams.append("minPpg", minPpg);

  const { data: players, isLoading } = useQuery<ScoutPlayer[]>({
    queryKey: ["/api/scout", sport, position, state, graduationYear, searchQuery, openOnly, minGrade, sortBy, minPpg],
    queryFn: async () => {
      const res = await fetch(`/api/discover?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch players");
      const data = await res.json();

      let filtered = data;

      if (minGrade !== "All") {
        const minGradeValue = getGradeValue(minGrade);
        filtered = filtered.filter((p: ScoutPlayer) => getGradeValue(p.avgGrade) >= minGradeValue);
      }

      if (sortBy === "grade") {
        filtered.sort((a: ScoutPlayer, b: ScoutPlayer) => getGradeValue(b.avgGrade) - getGradeValue(a.avgGrade));
      } else if (sortBy === "ppg") {
        filtered.sort((a: ScoutPlayer, b: ScoutPlayer) => b.ppg - a.ppg);
      } else if (sortBy === "games") {
        filtered.sort((a: ScoutPlayer, b: ScoutPlayer) => b.gamesPlayed - a.gamesPlayed);
      }

      return filtered;
    }
  });

  return (
    <div className="pb-24 md:pb-6 space-y-6" data-testid="page-scout-hub">
      <div className="relative overflow-hidden rounded-2xl from-card/80 via-card to-card/80 border border-accent/20">
        <div className="absolute inset-0 opacity-30" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full" />
        
        <div className="relative z-10 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Eye className="w-6 h-6 text-accent" style={{ filter: 'drop-shadow(0 0 8px hsl(var(--accent)))' }} />
                <span className="text-xs uppercase tracking-wider text-accent font-semibold">Talent Discovery</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">
                <span className="from-white via-accent to-accent">
                  Scout Hub
                </span>
              </h1>
              <p className="text-muted-foreground max-w-md">
                Find and evaluate talented athletes across the country
              </p>
            </div>

            <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-muted/80 border border-accent/20 backdrop-blur-sm">
              <span className="text-sm font-medium flex items-center gap-2 px-3 py-1.5">
                <span className="text-lg">🏀</span>
                Basketball
              </span>
            </div>
          </div>
        </div>
      </div>

      <Card className="relative overflow-hidden bg-card/80 border-accent/20 backdrop-blur-sm">
        <div className="absolute inset-x-[10%] top-0 h-px from-transparent via-accent/30 to-transparent" />
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
              <Filter className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h2 className="text-base font-bold">Filter Athletes</h2>
              <p className="text-xs text-muted-foreground">Narrow down your search</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <label className="text-xs text-accent/80 mb-1.5 block font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/60" />
                <Input
                  placeholder="Search by name, school, or team..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-muted/80 border-accent/20 focus:border-accent/50 placeholder:text-muted-foreground/50"
                  data-testid="input-scout-search"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-accent/80 mb-1.5 block font-medium">Position</label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger className="bg-muted/80 border-accent/20 focus:border-accent/50" data-testid="select-scout-position">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Positions</SelectItem>
                  {BASKETBALL_POSITIONS.map((pos) => (
                    <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-accent/80 mb-1.5 block font-medium">State</label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger className="bg-muted/80 border-accent/20 focus:border-accent/50" data-testid="select-scout-state">
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
              <label className="text-xs text-accent/80 mb-1.5 block font-medium">Class Year</label>
              <Select value={graduationYear} onValueChange={setGraduationYear}>
                <SelectTrigger className="bg-muted/80 border-accent/20 focus:border-accent/50" data-testid="select-scout-year">
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

            <div>
              <label className="text-xs text-accent/80 mb-1.5 block font-medium">Min Grade</label>
              <Select value={minGrade} onValueChange={setMinGrade}>
                <SelectTrigger className="bg-muted/80 border-accent/20 focus:border-accent/50" data-testid="select-scout-grade">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">Any Grade</SelectItem>
                  {GRADE_OPTIONS.filter(g => g !== "All").map((g) => (
                    <SelectItem key={g} value={g}>{g}+</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t border-border mt-5 pt-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <span className="text-xs font-bold text-purple-400/80 uppercase tracking-wide">Performance Filters</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                    <Target className="w-3 h-3 text-accent" />
                    Min PPG
                  </label>
                  <Select value={minPpg} onValueChange={setMinPpg}>
                    <SelectTrigger className="bg-muted/80 border-accent/20 focus:border-accent/50" data-testid="select-scout-ppg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">Any PPG</SelectItem>
                      {PPG_OPTIONS.filter(p => p !== "All").map((p) => (
                        <SelectItem key={p} value={p}>{p}+</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                  <ArrowUpDown className="w-3 h-3 text-accent" />
                  Sort By
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="bg-muted/80 border-accent/20 focus:border-accent/50" data-testid="select-scout-sort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grade">Performance Grade</SelectItem>
                    <SelectItem value="ppg">Points Per Game</SelectItem>
                    <SelectItem value="games">Games Played</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-green-500/10 border border-green-500/20">
                  <Switch
                    id="openOnly"
                    checked={openOnly}
                    onCheckedChange={setOpenOnly}
                    data-testid="switch-open-only"
                  />
                  <label htmlFor="openOnly" className="text-sm cursor-pointer flex items-center gap-1.5 text-green-400 font-medium">
                    <Target className="w-4 h-4" />
                    Open Only
                  </label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
            <UserSearch className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h2 className="text-base font-bold">
              {isLoading ? (
                "Loading athletes..."
              ) : players ? (
                <span>
                  <span className="text-accent">{players.length}</span> athletes found
                </span>
              ) : (
                "No athletes found"
              )}
            </h2>
            <p className="text-xs text-muted-foreground">
              Basketball talent database
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <PlayerCardSkeleton key={i} />
          ))}
        </div>
      ) : players && players.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {players.map((player, index) => (
            <ScoutPlayerCard key={player.id} player={player} index={index} />
          ))}
        </div>
      ) : (
        <Card className="border-accent/[0.08] bg-card/80 relative overflow-hidden">
          <div className="absolute inset-x-[10%] top-0 h-px from-transparent via-accent/20 to-transparent" />
          <CardContent className="py-8">
            <EmptyState
              icon={UserSearch}
              title="No Athletes Match Your Filters"
              description="Try adjusting your search criteria, clearing filters, or broadening your position and location preferences."
              variant="compact"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
