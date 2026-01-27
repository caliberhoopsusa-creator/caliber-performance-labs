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
import { BASKETBALL_POSITIONS, FOOTBALL_POSITIONS, FOOTBALL_POSITION_LABELS, type FootballPosition } from "@shared/sports-config";
import { 
  Search, MapPin, GraduationCap, Users, Target, Award, 
  Trophy, Filter, ArrowUpDown, Crosshair, Zap, BookOpen,
  TrendingUp, Star, Eye, UserSearch
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
  passingYards: number;
  passingTouchdowns: number;
  rushingYards: number;
  rushingTouchdowns: number;
  receivingYards: number;
  receivingTouchdowns: number;
  tackles: number;
  sacks: number;
  defensiveInterceptions: number;
  avgGrade: string | null;
  gamesPlayed: number;
  openToOpportunities: boolean;
  gpa: number | null;
  threePtPct: number | null;
  completionPct: number | null;
  hasCaliberBadge: boolean;
  stateRank: number | null;
  countryRank: number | null;
  // Football scouting metrics
  fortyYardDash: string | null;
  verticalJump: string | null;
  totalPointsSIS: string | null;
  physicality: number | null;
  footballIQ: number | null;
  leadership: number | null;
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
const PASSING_YDS_OPTIONS = ["All", "100", "150", "200", "250"];
const RUSHING_YDS_OPTIONS = ["All", "50", "75", "100", "150"];
const RECEIVING_YDS_OPTIONS = ["All", "50", "75", "100", "150"];

const TIER_COLORS: Record<string, string> = {
  "Rookie": "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  "Starter": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "All-Star": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "MVP": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Hall of Fame": "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30",
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
  sport: 'basketball' | 'football';
}

function ScoutPlayerCard({ player, sport }: ScoutPlayerCardProps) {
  const tierClass = TIER_COLORS[player.currentTier] || TIER_COLORS["Rookie"];
  const initials = player.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const isFootball = sport === 'football';
  const isRecruitReady = player.openToOpportunities;

  // Handle comma-separated multi-positions
  const positionLabel = player.position?.split(',').map(p => p.trim()).map(pos => 
    isFootball && FOOTBALL_POSITIONS.includes(pos as FootballPosition)
      ? FOOTBALL_POSITION_LABELS[pos as FootballPosition]
      : pos
  ).join(' / ') || player.position;
  
  // Helper to check if player has any of the given positions
  const hasPos = (positions: string[]) => {
    const playerPositions = player.position?.split(',').map(p => p.trim()) || [];
    return playerPositions.some(pos => positions.includes(pos));
  };

  return (
    <Link href={`/players/${player.id}`}>
      <Card 
        className={`hover-elevate cursor-pointer transition-all h-full ${
          isRecruitReady 
            ? "border-green-500/50 bg-gradient-to-br from-green-500/5 to-card/80 backdrop-blur-sm" 
            : "border-border/50 bg-card/80 backdrop-blur-sm"
        }`}
        data-testid={`card-scout-player-${player.id}`}
      >
        <CardContent className="p-4">
          {isRecruitReady && (
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-green-500/20">
              <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                <Target className="w-3 h-3 text-green-400" />
              </div>
              <span className="text-xs font-bold text-green-400 uppercase tracking-wider">
                Open to Opportunities
              </span>
            </div>
          )}

          <div className="flex gap-4">
            <Avatar className="w-16 h-16 rounded-lg border-2 border-primary/20">
              <AvatarImage src={player.photoUrl || undefined} alt={player.name} width={64} height={64} />
              <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="min-w-0">
                  <h3 className="font-bold text-foreground truncate">{player.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{positionLabel}</span>
                    {player.height && <span>• {player.height}</span>}
                  </div>
                </div>
                {player.avgGrade && (
                  <GradeBadge grade={player.avgGrade} size="lg" />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {player.school && (
                  <Badge variant="outline" className="text-xs gap-1 py-0.5">
                    <GraduationCap className="w-3 h-3" />
                    {player.school}
                  </Badge>
                )}
                {(player.city || player.state) && (
                  <Badge variant="outline" className="text-xs gap-1 py-0.5">
                    <MapPin className="w-3 h-3" />
                    {player.city && player.state ? `${player.city}, ${player.state}` : player.state || player.city}
                  </Badge>
                )}
                {player.graduationYear && (
                  <Badge variant="outline" className="text-xs py-0.5">
                    Class of {player.graduationYear}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/50">
            {isFootball ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                {hasPos(['QB']) ? (
                  <>
                    <div>
                      <div className="text-lg font-bold text-primary">{player.passingYards || 0}</div>
                      <div className="text-xs text-muted-foreground">Pass YDS</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">{player.passingTouchdowns || 0}</div>
                      <div className="text-xs text-muted-foreground">Pass TD</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">{player.rushingYards || 0}</div>
                      <div className="text-xs text-muted-foreground">Rush YDS</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">{player.gamesPlayed || 0}</div>
                      <div className="text-xs text-muted-foreground">Games</div>
                    </div>
                  </>
                ) : hasPos(['RB']) ? (
                  <>
                    <div>
                      <div className="text-lg font-bold text-primary">{player.rushingYards || 0}</div>
                      <div className="text-xs text-muted-foreground">Rush YDS</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">{player.rushingTouchdowns || 0}</div>
                      <div className="text-xs text-muted-foreground">Rush TD</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">{player.receivingYards || 0}</div>
                      <div className="text-xs text-muted-foreground">Rec YDS</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">{player.gamesPlayed || 0}</div>
                      <div className="text-xs text-muted-foreground">Games</div>
                    </div>
                  </>
                ) : hasPos(['WR', 'TE']) ? (
                  <>
                    <div>
                      <div className="text-lg font-bold text-primary">{player.receivingYards || 0}</div>
                      <div className="text-xs text-muted-foreground">Rec YDS</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">{player.receivingTouchdowns || 0}</div>
                      <div className="text-xs text-muted-foreground">Rec TD</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">{player.rushingYards || 0}</div>
                      <div className="text-xs text-muted-foreground">Rush YDS</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">{player.gamesPlayed || 0}</div>
                      <div className="text-xs text-muted-foreground">Games</div>
                    </div>
                  </>
                ) : hasPos(['DL', 'LB', 'DB']) ? (
                  <>
                    <div>
                      <div className="text-lg font-bold text-primary">{player.tackles || 0}</div>
                      <div className="text-xs text-muted-foreground">Tackles</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">{player.sacks || 0}</div>
                      <div className="text-xs text-muted-foreground">Sacks</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">{player.defensiveInterceptions || 0}</div>
                      <div className="text-xs text-muted-foreground">INT</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">{player.gamesPlayed || 0}</div>
                      <div className="text-xs text-muted-foreground">Games</div>
                    </div>
                  </>
                ) : hasPos(['OL']) ? (
                  <>
                    <div>
                      <div className="text-lg font-bold text-primary">{player.gamesPlayed || 0}</div>
                      <div className="text-xs text-muted-foreground">Games</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">-</div>
                      <div className="text-xs text-muted-foreground">Pancakes</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">-</div>
                      <div className="text-xs text-muted-foreground">Sacks Alwd</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">{player.currentTier}</div>
                      <div className="text-xs text-muted-foreground">Tier</div>
                    </div>
                  </>
                ) : hasPos(['K']) ? (
                  <>
                    <div>
                      <div className="text-lg font-bold text-primary">{player.gamesPlayed || 0}</div>
                      <div className="text-xs text-muted-foreground">Games</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">-</div>
                      <div className="text-xs text-muted-foreground">FG Made</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">-</div>
                      <div className="text-xs text-muted-foreground">XP Made</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">{player.currentTier}</div>
                      <div className="text-xs text-muted-foreground">Tier</div>
                    </div>
                  </>
                ) : hasPos(['P']) ? (
                  <>
                    <div>
                      <div className="text-lg font-bold text-primary">{player.gamesPlayed || 0}</div>
                      <div className="text-xs text-muted-foreground">Games</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">-</div>
                      <div className="text-xs text-muted-foreground">Punts</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">-</div>
                      <div className="text-xs text-muted-foreground">Avg YDS</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">{player.currentTier}</div>
                      <div className="text-xs text-muted-foreground">Tier</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="text-lg font-bold text-primary">{player.gamesPlayed || 0}</div>
                      <div className="text-xs text-muted-foreground">Games</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">{(player.rushingYards || 0) + (player.passingYards || 0) + (player.receivingYards || 0)}</div>
                      <div className="text-xs text-muted-foreground">Total YDS</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">{player.tackles || 0}</div>
                      <div className="text-xs text-muted-foreground">Tackles</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">{player.currentTier}</div>
                      <div className="text-xs text-muted-foreground">Tier</div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center">
                <div>
                  <div className="text-lg font-bold text-primary">{(player.ppg || 0).toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">PPG</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-primary">{(player.rpg || 0).toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">RPG</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-primary">{(player.apg || 0).toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">APG</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-primary">{(player.spg || 0).toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">SPG</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-primary">{(player.bpg || 0).toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">BPG</div>
                </div>
              </div>
            )}

            {/* Football Scouting Metrics */}
            {isFootball && (player.fortyYardDash || player.totalPointsSIS || player.physicality || player.footballIQ || player.leadership) && (
              <div className="mt-3 pt-3 border-t border-cyan-500/20">
                <div className="grid grid-cols-3 gap-2 text-center">
                  {player.fortyYardDash && (
                    <div>
                      <div className="text-sm font-bold text-cyan-400">{player.fortyYardDash}s</div>
                      <div className="text-xs text-muted-foreground">40 Time</div>
                    </div>
                  )}
                  {player.totalPointsSIS && (
                    <div>
                      <div className="text-sm font-bold text-cyan-400">{player.totalPointsSIS}</div>
                      <div className="text-xs text-muted-foreground">SIS Pts</div>
                    </div>
                  )}
                  {player.physicality !== null && player.physicality > 0 && (
                    <div>
                      <div className="text-sm font-bold text-cyan-400">{player.physicality}/10</div>
                      <div className="text-xs text-muted-foreground">Physical</div>
                    </div>
                  )}
                  {player.footballIQ !== null && player.footballIQ > 0 && (
                    <div>
                      <div className="text-sm font-bold text-cyan-400">{player.footballIQ}/10</div>
                      <div className="text-xs text-muted-foreground">IQ</div>
                    </div>
                  )}
                  {player.leadership !== null && player.leadership > 0 && (
                    <div>
                      <div className="text-sm font-bold text-cyan-400">{player.leadership}/10</div>
                      <div className="text-xs text-muted-foreground">Leader</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <Badge variant="outline" className={tierClass}>
              {player.currentTier}
            </Badge>
            {player.gpa && player.gpa >= 3.0 && (
              <Badge variant="outline" className="text-xs gap-1 border-blue-500/30 text-blue-400">
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
                  color: '#D4AF37'
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
                  color: '#D4AF37'
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
                  color: '#3B82F6'
                }}
              >
                <Star className="w-3 h-3" />
                #{player.countryRank} USA
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {player.gamesPlayed} games
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function PlayerCardSkeleton() {
  return (
    <Card className="border-cyan-500/[0.08] bg-gradient-to-br from-[hsl(220,25%,8%)] via-[hsl(220,20%,6%)] to-[hsl(220,25%,5%)] relative overflow-hidden">
      <div className="absolute inset-x-[10%] top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Skeleton className="w-16 h-16 rounded-lg skeleton-cyan" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-5 w-3/4 skeleton-cyan" />
            <Skeleton className="h-4 w-1/2 skeleton-premium" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-5 w-20 rounded-full skeleton-premium" />
              <Skeleton className="h-5 w-16 rounded-full skeleton-premium" />
            </div>
          </div>
          <Skeleton className="h-10 w-10 rounded-full skeleton-cyan" />
        </div>
        <div className="mt-4 pt-3 border-t border-cyan-500/[0.06]">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="space-y-1">
              <Skeleton className="h-6 w-10 mx-auto skeleton-cyan" />
              <Skeleton className="h-3 w-8 mx-auto skeleton-premium" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-6 w-10 mx-auto skeleton-cyan" />
              <Skeleton className="h-3 w-8 mx-auto skeleton-premium" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-6 w-10 mx-auto skeleton-cyan" />
              <Skeleton className="h-3 w-8 mx-auto skeleton-premium" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-6 w-10 mx-auto skeleton-cyan" />
              <Skeleton className="h-3 w-8 mx-auto skeleton-premium" />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          <Skeleton className="h-5 w-16 rounded-full skeleton-premium" />
          <Skeleton className="h-5 w-20 rounded-full skeleton-premium" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ScoutHub() {
  const [sport, setSport] = useState<'basketball' | 'football'>('basketball');
  const [position, setPosition] = useState("All");
  const [state, setState] = useState("All");
  const [graduationYear, setGraduationYear] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [minGrade, setMinGrade] = useState("All");
  const [sortBy, setSortBy] = useState("grade");
  const [minPpg, setMinPpg] = useState("All");
  const [minPassingYds, setMinPassingYds] = useState("All");
  const [minRushingYds, setMinRushingYds] = useState("All");
  const [minReceivingYds, setMinReceivingYds] = useState("All");
  const [minTackles, setMinTackles] = useState("All");
  const [minSacks, setMinSacks] = useState("All");
  const [minDefInt, setMinDefInt] = useState("All");

  const isFootball = sport === 'football';

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
    queryKey: ["/api/scout", sport, position, state, graduationYear, searchQuery, openOnly, minGrade, sortBy, minPpg, minPassingYds, minRushingYds, minReceivingYds],
    queryFn: async () => {
      const res = await fetch(`/api/discover?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch players");
      const data = await res.json();
      
      let filtered = data;
      
      if (minGrade !== "All") {
        const minGradeValue = getGradeValue(minGrade);
        filtered = filtered.filter((p: ScoutPlayer) => getGradeValue(p.avgGrade) >= minGradeValue);
      }
      
      if (isFootball) {
        if (minPassingYds !== "All") {
          filtered = filtered.filter((p: ScoutPlayer) => p.passingYards >= parseInt(minPassingYds));
        }
        if (minRushingYds !== "All") {
          filtered = filtered.filter((p: ScoutPlayer) => p.rushingYards >= parseInt(minRushingYds));
        }
        if (minReceivingYds !== "All") {
          filtered = filtered.filter((p: ScoutPlayer) => p.receivingYards >= parseInt(minReceivingYds));
        }
      }
      
      if (sortBy === "grade") {
        filtered.sort((a: ScoutPlayer, b: ScoutPlayer) => getGradeValue(b.avgGrade) - getGradeValue(a.avgGrade));
      } else if (sortBy === "ppg") {
        filtered.sort((a: ScoutPlayer, b: ScoutPlayer) => b.ppg - a.ppg);
      } else if (sortBy === "games") {
        filtered.sort((a: ScoutPlayer, b: ScoutPlayer) => b.gamesPlayed - a.gamesPlayed);
      } else if (sortBy === "yards") {
        filtered.sort((a: ScoutPlayer, b: ScoutPlayer) => 
          (b.passingYards + b.rushingYards + b.receivingYards) - 
          (a.passingYards + a.rushingYards + a.receivingYards)
        );
      }
      
      return filtered;
    }
  });

  const handleSportChange = (newSport: 'basketball' | 'football') => {
    setSport(newSport);
    setPosition("All");
    setMinPpg("All");
    setMinPassingYds("All");
    setMinRushingYds("All");
    setMinReceivingYds("All");
  };

  return (
    <div className="space-y-6" data-testid="page-scout-hub">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/20 p-6 md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="absolute inset-0 cyber-grid opacity-10" />
        <div className="relative">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-cyan-600 flex items-center justify-center shadow-lg shadow-primary/20">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-display font-bold bg-gradient-to-b from-white to-cyan-100/80 bg-clip-text text-transparent tracking-wide">
                  Scout Hub
                </h1>
                <p className="text-sm text-cyan-200/50">
                  Find and evaluate talented athletes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm rounded-lg p-1 border border-border/50">
              <Button
                variant={sport === 'basketball' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleSportChange('basketball')}
                className="gap-2"
                data-testid="button-sport-basketball"
              >
                <span className="text-lg">🏀</span>
                Basketball
              </Button>
              <Button
                variant={sport === 'football' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleSportChange('football')}
                className="gap-2"
                data-testid="button-sport-football"
              >
                <span className="text-lg">🏈</span>
                Football
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Filters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="lg:col-span-2">
              <label className="text-xs text-muted-foreground mb-1.5 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, school, or team..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                  data-testid="input-scout-search"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Position</label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger className="h-9" data-testid="select-scout-position">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Positions</SelectItem>
                  {isFootball ? (
                    FOOTBALL_POSITIONS.map((pos) => (
                      <SelectItem key={pos} value={pos}>
                        {FOOTBALL_POSITION_LABELS[pos]}
                      </SelectItem>
                    ))
                  ) : (
                    BASKETBALL_POSITIONS.map((pos) => (
                      <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">State</label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger className="h-9" data-testid="select-scout-state">
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
                <SelectTrigger className="h-9" data-testid="select-scout-year">
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
              <label className="text-xs text-muted-foreground mb-1.5 block">Min Grade</label>
              <Select value={minGrade} onValueChange={setMinGrade}>
                <SelectTrigger className="h-9" data-testid="select-scout-grade">
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

          <div className="border-t border-border/50 mt-4 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Performance Filters</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {!isFootball && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                    <Target className="w-3 h-3" />
                    Min PPG
                  </label>
                  <Select value={minPpg} onValueChange={setMinPpg}>
                    <SelectTrigger className="h-9" data-testid="select-scout-ppg">
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
              )}

              {isFootball && (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                      <Zap className="w-3 h-3" />
                      Min Pass YDS
                    </label>
                    <Select value={minPassingYds} onValueChange={setMinPassingYds}>
                      <SelectTrigger className="h-9" data-testid="select-scout-pass-yds">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">Any</SelectItem>
                        {PASSING_YDS_OPTIONS.filter(p => p !== "All").map((p) => (
                          <SelectItem key={p} value={p}>{p}+</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                      <Crosshair className="w-3 h-3" />
                      Min Rush YDS
                    </label>
                    <Select value={minRushingYds} onValueChange={setMinRushingYds}>
                      <SelectTrigger className="h-9" data-testid="select-scout-rush-yds">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">Any</SelectItem>
                        {RUSHING_YDS_OPTIONS.filter(r => r !== "All").map((r) => (
                          <SelectItem key={r} value={r}>{r}+</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                      <Users className="w-3 h-3" />
                      Min Rec YDS
                    </label>
                    <Select value={minReceivingYds} onValueChange={setMinReceivingYds}>
                      <SelectTrigger className="h-9" data-testid="select-scout-rec-yds">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">Any</SelectItem>
                        {RECEIVING_YDS_OPTIONS.filter(r => r !== "All").map((r) => (
                          <SelectItem key={r} value={r}>{r}+</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                  <ArrowUpDown className="w-3 h-3" />
                  Sort By
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-9" data-testid="select-scout-sort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grade">Performance Grade</SelectItem>
                    {!isFootball && <SelectItem value="ppg">Points Per Game</SelectItem>}
                    {isFootball && <SelectItem value="yards">Total Yards</SelectItem>}
                    <SelectItem value="games">Games Played</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <div className="flex items-center gap-2">
                  <Switch
                    id="openOnly"
                    checked={openOnly}
                    onCheckedChange={setOpenOnly}
                    data-testid="switch-open-only"
                  />
                  <label htmlFor="openOnly" className="text-sm cursor-pointer flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-green-500" />
                    Open Only
                  </label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {isLoading ? (
            "Loading players..."
          ) : players ? (
            <>
              <span className="font-medium text-foreground">{players.length}</span> players found
            </>
          ) : (
            "No players found"
          )}
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
          {players.map((player) => (
            <ScoutPlayerCard key={player.id} player={player} sport={sport} />
          ))}
        </div>
      ) : (
        <Card className="border-cyan-500/[0.08] bg-gradient-to-br from-[hsl(220,25%,8%)] via-[hsl(220,20%,6%)] to-[hsl(220,25%,5%)] relative overflow-hidden">
          <div className="absolute inset-x-[10%] top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
          <CardContent className="py-8">
            <EmptyState
              icon={UserSearch}
              title="No Players Match Your Filters"
              description="Try adjusting your search criteria, clearing filters, or broadening your position and location preferences."
              variant="compact"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
