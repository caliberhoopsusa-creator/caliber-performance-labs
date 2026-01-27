import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { useSport } from "@/components/SportToggle";
import { BASKETBALL_POSITIONS, FOOTBALL_POSITIONS, FOOTBALL_POSITION_LABELS } from "@shared/sports-config";
import { Search, MapPin, GraduationCap, Users, ChevronRight, Sparkles, Eye, CheckCircle, Target, Film, Trophy, BookOpen, Crosshair, Award, Shield, Zap, UserPlus, UserCheck, Loader2, ArrowUpDown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DiscoverPlayer {
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
  highlightCount?: number;
  badgeCount?: number;
  gpa: number | null;
  threePtPct: number | null;
  completionPct: number | null;
  hasCaliberBadge: boolean;
}

// Helper to check if player has any of the given positions (supports comma-separated multi-positions)
function hasPosition(playerPosition: string, positions: string[]): boolean {
  const playerPositions = playerPosition?.split(',').map(p => p.trim()) || [];
  return playerPositions.some(pos => positions.includes(pos));
}

function getProfileCompleteness(player: DiscoverPlayer): number {
  let score = 0;
  const maxScore = 11;
  
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
  if (player.gpa !== null) score += 1;
  
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

interface PlayerDiscoverCardProps {
  player: DiscoverPlayer;
  sport: 'basketball' | 'football';
  isAuthenticated: boolean;
  isFollowing: boolean;
  isFollowPending: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
  currentUserPlayerId?: number | null;
}

function PlayerDiscoverCard({ 
  player, 
  sport,
  isAuthenticated, 
  isFollowing, 
  isFollowPending,
  onFollow, 
  onUnfollow,
  currentUserPlayerId 
}: PlayerDiscoverCardProps) {
  const tierClass = TIER_COLORS[player.currentTier] || TIER_COLORS["Rookie"];
  const initials = player.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const profileComplete = getProfileCompleteness(player);
  const isRecruitReady = player.openToOpportunities && profileComplete >= 70;
  const isOwnProfile = currentUserPlayerId === player.id;
  const isFootball = sport === 'football';

  const handleFollowClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFollowing) {
      onUnfollow();
    } else {
      onFollow();
    }
  };

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
                <AvatarImage src={player.photoUrl || undefined} alt={player.name} className="object-cover" width={64} height={64} />
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
                    <span className="font-medium">
                      {player.position?.split(',').map(p => p.trim()).map(pos => 
                        FOOTBALL_POSITION_LABELS[pos as keyof typeof FOOTBALL_POSITION_LABELS] || pos
                      ).join(' / ') || player.position}
                    </span>
                    {player.height && (
                      <>
                        <span className="text-border">|</span>
                        <span>{player.height}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {isAuthenticated && !isOwnProfile && (
                    <Button
                      size="sm"
                      variant={isFollowing ? "secondary" : "default"}
                      onClick={handleFollowClick}
                      disabled={isFollowPending}
                      className="h-7 text-xs px-2"
                      data-testid={`button-follow-${player.id}`}
                    >
                      {isFollowPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : isFollowing ? (
                        <>
                          <UserCheck className="w-3 h-3 mr-1" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3 mr-1" />
                          Follow
                        </>
                      )}
                    </Button>
                  )}
                  <ChevronRight className="w-5 h-5 text-muted-foreground mt-1" />
                </div>
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
                {isFootball ? (
                  <>
                    {hasPosition(player.position, ['QB']) && (
                      <>
                        <div className="text-center">
                          <div className="font-bold text-white text-base">{player.passingYards}</div>
                          <div className="text-[10px] uppercase text-muted-foreground tracking-wide">PASS YDS</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-white text-base">{player.passingTouchdowns}</div>
                          <div className="text-[10px] uppercase text-muted-foreground tracking-wide">PASS TD</div>
                        </div>
                        {player.completionPct !== null && (
                          <div className="text-center">
                            <div className="font-bold text-white text-base">{player.completionPct}%</div>
                            <div className="text-[10px] uppercase text-muted-foreground tracking-wide">CMP%</div>
                          </div>
                        )}
                      </>
                    )}
                    {hasPosition(player.position, ['RB']) && (
                      <>
                        <div className="text-center">
                          <div className="font-bold text-white text-base">{player.rushingYards}</div>
                          <div className="text-[10px] uppercase text-muted-foreground tracking-wide">RUSH YDS</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-white text-base">{player.rushingTouchdowns}</div>
                          <div className="text-[10px] uppercase text-muted-foreground tracking-wide">RUSH TD</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-white text-base">{player.receivingYards}</div>
                          <div className="text-[10px] uppercase text-muted-foreground tracking-wide">REC YDS</div>
                        </div>
                      </>
                    )}
                    {hasPosition(player.position, ['WR', 'TE']) && (
                      <>
                        <div className="text-center">
                          <div className="font-bold text-white text-base">{player.receivingYards}</div>
                          <div className="text-[10px] uppercase text-muted-foreground tracking-wide">REC YDS</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-white text-base">{player.receivingTouchdowns}</div>
                          <div className="text-[10px] uppercase text-muted-foreground tracking-wide">REC TD</div>
                        </div>
                      </>
                    )}
                    {hasPosition(player.position, ['DL', 'LB', 'DB']) && (
                      <>
                        <div className="text-center">
                          <div className="font-bold text-white text-base">{player.tackles}</div>
                          <div className="text-[10px] uppercase text-muted-foreground tracking-wide">TCK</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-white text-base">{player.sacks}</div>
                          <div className="text-[10px] uppercase text-muted-foreground tracking-wide">SCK</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-white text-base">{player.defensiveInterceptions}</div>
                          <div className="text-[10px] uppercase text-muted-foreground tracking-wide">INT</div>
                        </div>
                      </>
                    )}
                    {hasPosition(player.position, ['OL', 'K', 'P']) && (
                      <div className="text-center">
                        <div className="font-bold text-white text-base">{player.gamesPlayed}</div>
                        <div className="text-[10px] uppercase text-muted-foreground tracking-wide">GAMES</div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
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
                    {player.threePtPct !== null && (
                      <div className="text-center">
                        <div className="font-bold text-white text-base">{player.threePtPct}%</div>
                        <div className="text-[10px] uppercase text-muted-foreground tracking-wide">3PT</div>
                      </div>
                    )}
                  </>
                )}
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

              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                {player.gpa !== null ? (
                  <span className="text-blue-400 font-medium">{player.gpa.toFixed(2)} GPA</span>
                ) : (
                  <span className="text-muted-foreground italic">No GPA listed</span>
                )}
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
                {player.hasCaliberBadge && (
                  <Badge 
                    variant="outline" 
                    className="text-[10px] px-2 py-0.5 border-0"
                    style={{ 
                      background: '#0a0a0a', 
                      color: '#D4AF37',
                      border: '1px solid rgba(212, 175, 55, 0.5)'
                    }}
                  >
                    <Award className="w-3 h-3 mr-1" style={{ color: '#D4AF37' }} />
                    Caliber
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

const GPA_OPTIONS = ["All", "2.0", "2.5", "3.0", "3.5"];
const THREE_PT_OPTIONS = ["All", "30", "35", "40", "45"];
const PPG_OPTIONS = ["All", "5", "10", "15", "20", "25"];
const RPG_OPTIONS = ["All", "3", "5", "7", "10"];
const APG_OPTIONS = ["All", "2", "4", "6", "8"];
const SPG_OPTIONS = ["All", "1", "2", "3"];
const BPG_OPTIONS = ["All", "1", "2", "3"];

// Football-specific filter options
const PASS_YDS_OPTIONS = ["All", "100", "150", "200", "250", "300"];
const RUSH_YDS_OPTIONS = ["All", "50", "75", "100", "150"];
const REC_YDS_OPTIONS = ["All", "50", "75", "100", "150"];
const TACKLES_OPTIONS = ["All", "3", "5", "7", "10"];
const SACKS_OPTIONS = ["All", "1", "2", "3", "5"];
const DEF_INT_OPTIONS = ["All", "1", "2", "3"];

export default function Discover() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const sport = useSport();
  const [position, setPosition] = useState("All");
  const [state, setState] = useState("All");
  const [graduationYear, setGraduationYear] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [caliberOnly, setCaliberOnly] = useState(false);
  const [minGpa, setMinGpa] = useState("All");
  const [minThreePct, setMinThreePct] = useState("All");
  const [minPpg, setMinPpg] = useState("All");
  const [minRpg, setMinRpg] = useState("All");
  const [minApg, setMinApg] = useState("All");
  const [minSpg, setMinSpg] = useState("All");
  const [minBpg, setMinBpg] = useState("All");
  // Football-specific filters
  const [minPassYds, setMinPassYds] = useState("All");
  const [minRushYds, setMinRushYds] = useState("All");
  const [minRecYds, setMinRecYds] = useState("All");
  const [minTackles, setMinTackles] = useState("All");
  const [minSacks, setMinSacks] = useState("All");
  const [minDefInt, setMinDefInt] = useState("All");
  const [sortBy, setSortBy] = useState("grade");
  const [followingMap, setFollowingMap] = useState<Record<number, boolean>>({});
  const [pendingFollows, setPendingFollows] = useState<Set<number>>(new Set());
  const prevSportRef = useRef(sport);

  const isFootball = sport === 'football';

  // Reset sport-specific filters when switching sports
  useEffect(() => {
    if (prevSportRef.current !== sport) {
      // Reset position filter since positions differ between sports
      setPosition("All");
      // Reset basketball-specific filters
      setMinThreePct("All");
      setMinPpg("All");
      setMinRpg("All");
      setMinApg("All");
      setMinSpg("All");
      setMinBpg("All");
      // Reset football-specific filters
      setMinPassYds("All");
      setMinRushYds("All");
      setMinRecYds("All");
      setMinTackles("All");
      setMinSacks("All");
      setMinDefInt("All");
      // Reset sort to default
      setSortBy("grade");
      prevSportRef.current = sport;
    }
  }, [sport]);

  const queryParams = new URLSearchParams();
  queryParams.append("sport", sport);
  if (position !== "All") queryParams.append("position", position);
  if (state !== "All") queryParams.append("state", state);
  if (graduationYear !== "All") queryParams.append("graduationYear", graduationYear);
  if (searchQuery.trim()) queryParams.append("search", searchQuery.trim());
  if (openOnly) queryParams.append("openOnly", "true");
  if (caliberOnly) queryParams.append("caliberOnly", "true");
  if (minGpa !== "All") queryParams.append("minGpa", minGpa);
  // Basketball filters
  if (minThreePct !== "All") queryParams.append("minThreePct", minThreePct);
  if (minPpg !== "All") queryParams.append("minPpg", minPpg);
  if (minRpg !== "All") queryParams.append("minRpg", minRpg);
  if (minApg !== "All") queryParams.append("minApg", minApg);
  if (minSpg !== "All") queryParams.append("minSpg", minSpg);
  if (minBpg !== "All") queryParams.append("minBpg", minBpg);
  // Football filters
  if (minPassYds !== "All") queryParams.append("minPassYds", minPassYds);
  if (minRushYds !== "All") queryParams.append("minRushYds", minRushYds);
  if (minRecYds !== "All") queryParams.append("minRecYds", minRecYds);
  if (minTackles !== "All") queryParams.append("minTackles", minTackles);
  if (minSacks !== "All") queryParams.append("minSacks", minSacks);
  if (minDefInt !== "All") queryParams.append("minDefInt", minDefInt);
  if (sortBy !== "grade") queryParams.append("sortBy", sortBy);

  const { data: players, isLoading } = useQuery<DiscoverPlayer[]>({
    queryKey: ["/api/discover", sport, position, state, graduationYear, searchQuery, openOnly, caliberOnly, minGpa, minThreePct, minPpg, minRpg, minApg, minSpg, minBpg, minPassYds, minRushYds, minRecYds, minTackles, minSacks, minDefInt, sortBy],
    queryFn: async () => {
      const res = await fetch(`/api/discover?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch players");
      return res.json();
    }
  });

  // Fetch follow status for all displayed players
  useQuery({
    queryKey: ["/api/discover/follow-status", players?.map(p => p.id)],
    queryFn: async () => {
      if (!players || players.length === 0 || !isAuthenticated) return {};
      const newFollowingMap: Record<number, boolean> = {};
      await Promise.all(
        players.map(async (player) => {
          try {
            const res = await fetch(`/api/players/${player.id}/is-following`);
            if (res.ok) {
              const data = await res.json();
              newFollowingMap[player.id] = data.isFollowing;
            }
          } catch {
            newFollowingMap[player.id] = false;
          }
        })
      );
      setFollowingMap(newFollowingMap);
      return newFollowingMap;
    },
    enabled: isAuthenticated && !!players && players.length > 0
  });

  const handleFollow = async (playerId: number) => {
    if (!isAuthenticated) {
      toast({ title: "Sign in required", description: "Please sign in to follow players", variant: "destructive" });
      return;
    }
    setPendingFollows(prev => new Set(prev).add(playerId));
    try {
      await apiRequest("POST", `/api/players/${playerId}/follow`);
      setFollowingMap(prev => ({ ...prev, [playerId]: true }));
      toast({ title: "Following", description: "You are now following this player" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to follow player", variant: "destructive" });
    } finally {
      setPendingFollows(prev => {
        const next = new Set(prev);
        next.delete(playerId);
        return next;
      });
    }
  };

  const handleUnfollow = async (playerId: number) => {
    setPendingFollows(prev => new Set(prev).add(playerId));
    try {
      await apiRequest("DELETE", `/api/players/${playerId}/follow`);
      setFollowingMap(prev => ({ ...prev, [playerId]: false }));
      toast({ title: "Unfollowed", description: "You are no longer following this player" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to unfollow player", variant: "destructive" });
    } finally {
      setPendingFollows(prev => {
        const next = new Set(prev);
        next.delete(playerId);
        return next;
      });
    }
  };

  const currentUserPlayerId = (user as any)?.playerId || null;

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
              <h1 className="text-2xl md:text-3xl font-display font-bold bg-gradient-to-b from-white to-cyan-100/80 bg-clip-text text-transparent tracking-wide">
                Discover Players
              </h1>
              <p className="text-sm text-cyan-200/50">
                Find and connect with talented {isFootball ? 'football' : 'basketball'} players
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

          <div className="border-t border-border/50 mt-4 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Scout Filters</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3" />
                  Min GPA
                </label>
                <Select value={minGpa} onValueChange={setMinGpa}>
                  <SelectTrigger className="h-9" data-testid="select-min-gpa">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">Any GPA</SelectItem>
                    {GPA_OPTIONS.filter(g => g !== "All").map((g) => (
                      <SelectItem key={g} value={g}>{g}+</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isFootball ? (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                      <Target className="w-3 h-3" />
                      Min Pass YDS
                    </label>
                    <Select value={minPassYds} onValueChange={setMinPassYds}>
                      <SelectTrigger className="h-9" data-testid="select-min-pass-yds">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">Any Pass YDS</SelectItem>
                        {PASS_YDS_OPTIONS.filter(p => p !== "All").map((p) => (
                          <SelectItem key={p} value={p}>{p}+</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                      <Zap className="w-3 h-3" />
                      Min Rush YDS
                    </label>
                    <Select value={minRushYds} onValueChange={setMinRushYds}>
                      <SelectTrigger className="h-9" data-testid="select-min-rush-yds">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">Any Rush YDS</SelectItem>
                        {RUSH_YDS_OPTIONS.filter(r => r !== "All").map((r) => (
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
                    <Select value={minRecYds} onValueChange={setMinRecYds}>
                      <SelectTrigger className="h-9" data-testid="select-min-rec-yds">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">Any Rec YDS</SelectItem>
                        {REC_YDS_OPTIONS.filter(r => r !== "All").map((r) => (
                          <SelectItem key={r} value={r}>{r}+</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                      <Shield className="w-3 h-3" />
                      Min Tackles
                    </label>
                    <Select value={minTackles} onValueChange={setMinTackles}>
                      <SelectTrigger className="h-9" data-testid="select-min-tackles">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">Any Tackles</SelectItem>
                        {TACKLES_OPTIONS.filter(t => t !== "All").map((t) => (
                          <SelectItem key={t} value={t}>{t}+</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                      <Zap className="w-3 h-3" />
                      Min Sacks
                    </label>
                    <Select value={minSacks} onValueChange={setMinSacks}>
                      <SelectTrigger className="h-9" data-testid="select-min-sacks">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">Any Sacks</SelectItem>
                        {SACKS_OPTIONS.filter(s => s !== "All").map((s) => (
                          <SelectItem key={s} value={s}>{s}+</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                      <Shield className="w-3 h-3" />
                      Min INTs
                    </label>
                    <Select value={minDefInt} onValueChange={setMinDefInt}>
                      <SelectTrigger className="h-9" data-testid="select-min-def-int">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">Any INTs</SelectItem>
                        {DEF_INT_OPTIONS.filter(i => i !== "All").map((i) => (
                          <SelectItem key={i} value={i}>{i}+</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                      <Crosshair className="w-3 h-3" />
                      Min 3PT%
                    </label>
                    <Select value={minThreePct} onValueChange={setMinThreePct}>
                      <SelectTrigger className="h-9" data-testid="select-min-three-pct">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">Any 3PT%</SelectItem>
                        {THREE_PT_OPTIONS.filter(t => t !== "All").map((t) => (
                          <SelectItem key={t} value={t}>{t}%+</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                      <Target className="w-3 h-3" />
                      Min PPG
                    </label>
                    <Select value={minPpg} onValueChange={setMinPpg}>
                      <SelectTrigger className="h-9" data-testid="select-min-ppg">
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
                      <Zap className="w-3 h-3" />
                      Min RPG
                    </label>
                    <Select value={minRpg} onValueChange={setMinRpg}>
                      <SelectTrigger className="h-9" data-testid="select-min-rpg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">Any RPG</SelectItem>
                        {RPG_OPTIONS.filter(r => r !== "All").map((r) => (
                          <SelectItem key={r} value={r}>{r}+</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                      <Users className="w-3 h-3" />
                      Min APG
                    </label>
                    <Select value={minApg} onValueChange={setMinApg}>
                      <SelectTrigger className="h-9" data-testid="select-min-apg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">Any APG</SelectItem>
                        {APG_OPTIONS.filter(a => a !== "All").map((a) => (
                          <SelectItem key={a} value={a}>{a}+</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                      <Shield className="w-3 h-3" />
                      Min SPG
                    </label>
                    <Select value={minSpg} onValueChange={setMinSpg}>
                      <SelectTrigger className="h-9" data-testid="select-min-spg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">Any SPG</SelectItem>
                        {SPG_OPTIONS.filter(s => s !== "All").map((s) => (
                          <SelectItem key={s} value={s}>{s}+</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                      <Shield className="w-3 h-3" />
                      Min BPG
                    </label>
                    <Select value={minBpg} onValueChange={setMinBpg}>
                      <SelectTrigger className="h-9" data-testid="select-min-bpg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">Any BPG</SelectItem>
                        {BPG_OPTIONS.filter(b => b !== "All").map((b) => (
                          <SelectItem key={b} value={b}>{b}+</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          </div>

          {isFootball && (
            <div className="border-t border-border/50 mt-4 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quick Filters</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={position === "QB" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPosition(position === "QB" ? "All" : "QB")}
                  className="h-7 text-xs"
                  data-testid="button-preset-qb"
                >
                  Quarterbacks
                </Button>
                <Button
                  variant={position === "RB" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPosition(position === "RB" ? "All" : "RB")}
                  className="h-7 text-xs"
                  data-testid="button-preset-rb"
                >
                  Running Backs
                </Button>
                <Button
                  variant={["WR", "TE"].includes(position) ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPosition(["WR", "TE"].includes(position) ? "All" : "WR")}
                  className="h-7 text-xs"
                  data-testid="button-preset-receivers"
                >
                  Receivers
                </Button>
                <Button
                  variant={["DL", "LB", "DB"].includes(position) ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPosition(["DL", "LB", "DB"].includes(position) ? "All" : "LB")}
                  className="h-7 text-xs"
                  data-testid="button-preset-defense"
                >
                  Defensive
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPosition("All");
                    setMinPassYds("All");
                    setMinRushYds("All");
                    setMinRecYds("All");
                    setMinTackles("All");
                    setMinSacks("All");
                    setMinDefInt("All");
                  }}
                  className="h-7 text-xs text-muted-foreground"
                  data-testid="button-clear-filters"
                >
                  Clear All
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>
            {isLoading ? "Loading..." : `${players?.length || 0} players found`}
          </span>
        </div>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-8 w-[140px] text-xs" data-testid="select-sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grade">Best Grade</SelectItem>
                <SelectItem value="games">Most Games</SelectItem>
                {isFootball ? (
                  <>
                    <SelectItem value="passYds">Pass Yards</SelectItem>
                    <SelectItem value="rushYds">Rush Yards</SelectItem>
                    <SelectItem value="recYds">Rec Yards</SelectItem>
                    <SelectItem value="tackles">Tackles</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="ppg">Points (PPG)</SelectItem>
                    <SelectItem value="rpg">Rebounds (RPG)</SelectItem>
                    <SelectItem value="apg">Assists (APG)</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <label 
              htmlFor="caliber-only" 
              className="text-sm text-muted-foreground cursor-pointer flex items-center gap-2"
            >
              <Award className="w-4 h-4" style={{ color: '#D4AF37' }} />
              Caliber Certified Only
            </label>
            <Switch
              id="caliber-only"
              checked={caliberOnly}
              onCheckedChange={setCaliberOnly}
              data-testid="switch-caliber-only"
            />
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
            <PlayerDiscoverCard 
              key={player.id} 
              player={player}
              sport={sport}
              isAuthenticated={isAuthenticated}
              isFollowing={followingMap[player.id] || false}
              isFollowPending={pendingFollows.has(player.id)}
              onFollow={() => handleFollow(player.id)}
              onUnfollow={() => handleUnfollow(player.id)}
              currentUserPlayerId={currentUserPlayerId}
            />
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
