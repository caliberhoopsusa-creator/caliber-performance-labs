import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CaliberLogo } from "@/components/CaliberLogo";
import { Search, MapPin, GraduationCap, Trophy, Award, Video, ChevronLeft, ChevronRight, Users, X, ArrowLeft } from "lucide-react";

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

const GRADE_CONFIG: Record<string, { bg: string; text: string }> = {
  'A+': { bg: 'bg-emerald-500', text: 'text-white' },
  'A': { bg: 'bg-emerald-500', text: 'text-white' },
  'A-': { bg: 'bg-emerald-500/90', text: 'text-white' },
  'B+': { bg: 'bg-blue-500', text: 'text-white' },
  'B': { bg: 'bg-blue-500', text: 'text-white' },
  'B-': { bg: 'bg-blue-500/90', text: 'text-white' },
  'C+': { bg: 'bg-amber-500', text: 'text-white' },
  'C': { bg: 'bg-amber-500', text: 'text-white' },
  'C-': { bg: 'bg-amber-500/90', text: 'text-white' },
  'D+': { bg: 'bg-orange-500', text: 'text-white' },
  'D': { bg: 'bg-orange-500', text: 'text-white' },
  'D-': { bg: 'bg-orange-500/90', text: 'text-white' },
  'F': { bg: 'bg-red-500', text: 'text-white' },
};

interface DirectoryPlayer {
  id: number;
  name: string;
  username: string | null;
  photoUrl: string | null;
  position: string;
  city: string | null;
  state: string | null;
  school: string | null;
  graduationYear: number | null;
  height: string | null;
  gpa: number | null;
  currentTier: string;
  totalXp: number;
  highlightVideoUrl: string | null;
  gamesPlayed: number;
  averageGrade: string | null;
  ppg: number;
  rpg: number;
  apg: number;
  badgeCount: number;
  lastGameDate: string | null;
}

interface DirectoryResponse {
  players: DirectoryPlayer[];
  total: number;
  page: number;
  totalPages: number;
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function PlayerDirectory() {
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState<string>("");
  const [state, setState] = useState<string>("");
  const [graduationYear, setGraduationYear] = useState<string>("");
  const [sort, setSort] = useState("grade");
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();
  const handleSearchChange = (value: string) => {
    setSearch(value);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  };

  const params = new URLSearchParams();
  if (debouncedSearch) params.set('search', debouncedSearch);
  if (position) params.set('position', position);
  if (state) params.set('state', state);
  if (graduationYear) params.set('graduationYear', graduationYear);
  params.set('sort', sort);
  params.set('page', String(page));
  params.set('limit', '20');

  const queryString = params.toString();
  const queryUrl = `/api/public/players/directory?${queryString}`;

  const { data, isLoading } = useQuery<DirectoryResponse>({
    queryKey: [queryUrl],
  });

  const hasActiveFilters = position || state || graduationYear || debouncedSearch;

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setPosition("");
    setState("");
    setGraduationYear("");
    setPage(1);
  };

  const currentYear = new Date().getFullYear();
  const gradYears = Array.from({ length: 6 }, (_, i) => currentYear + i);

  return (
    <div className="min-h-screen bg-[hsl(220,15%,8%)] text-white">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[hsl(220,15%,8%)]/90 border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button size="icon" variant="ghost" data-testid="button-back-to-app">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/">
              <CaliberLogo size={28} color="#E8192C" />
            </Link>
            <div>
              <h1 className="text-lg font-bold font-display tracking-tight" data-testid="text-directory-title">Player Directory</h1>
              <p className="text-xs text-white/40 hidden sm:block">Find and recruit top basketball talent</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-400 text-xs gap-1">
              <Users className="w-3 h-3" /> {data?.total || 0} Players
            </Badge>
          </div>
        </div>
      </header>

      <div className="bg-gradient-to-b from-accent/10 to-transparent">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight mb-2" data-testid="text-hero-title">
            Discover Basketball Talent
          </h2>
          <p className="text-white/50 text-sm sm:text-base max-w-lg mx-auto">
            Browse verified player profiles with real game stats, grades, and highlight videos.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-6">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              placeholder="Search players..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/30"
              data-testid="input-search-players"
            />
          </div>

          <Select value={position} onValueChange={(v) => { setPosition(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-[130px] bg-white/[0.06] border-white/[0.08] text-white" data-testid="select-position">
              <SelectValue placeholder="Position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Positions</SelectItem>
              <SelectItem value="Guard">Guard</SelectItem>
              <SelectItem value="Wing">Wing</SelectItem>
              <SelectItem value="Big">Big</SelectItem>
            </SelectContent>
          </Select>

          <Select value={state} onValueChange={(v) => { setState(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-[120px] bg-white/[0.06] border-white/[0.08] text-white" data-testid="select-state">
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={graduationYear} onValueChange={(v) => { setGraduationYear(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-[140px] bg-white/[0.06] border-white/[0.08] text-white" data-testid="select-grad-year">
              <SelectValue placeholder="Class Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {gradYears.map(y => <SelectItem key={y} value={String(y)}>Class of {y}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1); }}>
            <SelectTrigger className="w-[130px] bg-white/[0.06] border-white/[0.08] text-white" data-testid="select-sort">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grade">Top Rated</SelectItem>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="xp">Most XP</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-white/50 gap-1" data-testid="button-clear-filters">
              <X className="w-3.5 h-3.5" /> Clear
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-white/[0.06]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/[0.06] rounded w-3/4" />
                    <div className="h-3 bg-white/[0.06] rounded w-1/2" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : data?.players.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <h3 className="text-lg font-bold font-display text-white/60" data-testid="text-no-results">No Players Found</h3>
            <p className="text-sm text-white/30 mt-1">Try adjusting your filters or search terms.</p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4 gap-1" data-testid="button-clear-no-results">
                <X className="w-3.5 h-3.5" /> Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data?.players.map(player => {
                const gradeConfig = player.averageGrade ? GRADE_CONFIG[player.averageGrade] : null;
                return (
                  <Link key={player.id} href={`/recruit/${player.id}`}>
                    <Card className="p-4 hover-elevate cursor-pointer transition-colors" data-testid={`card-player-${player.id}`}>
                      <div className="flex items-start gap-3">
                        <Avatar className="w-12 h-12 border-2 border-white/10">
                          {player.photoUrl ? <AvatarImage src={player.photoUrl} alt={player.name} /> : null}
                          <AvatarFallback className="bg-accent/10 text-accent font-display text-sm">
                            {getInitials(player.name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-white truncate" data-testid={`text-player-name-${player.id}`}>{player.name}</h3>
                            {player.highlightVideoUrl && (
                              <Video className="w-3.5 h-3.5 text-accent shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{player.position}</Badge>
                            {player.graduationYear && (
                              <span className="text-[10px] text-white/40">{player.graduationYear}</span>
                            )}
                          </div>
                        </div>

                        {gradeConfig && (
                          <div className={`w-9 h-9 rounded-full ${gradeConfig.bg} ${gradeConfig.text} flex items-center justify-center text-xs font-bold font-display shrink-0`} data-testid={`badge-grade-${player.id}`}>
                            {player.averageGrade}
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/40">
                        {(player.city || player.state) && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />
                            {[player.city, player.state].filter(Boolean).join(', ')}
                          </span>
                        )}
                        {player.school && (
                          <span className="flex items-center gap-0.5">
                            <GraduationCap className="w-3 h-3" />
                            {player.school}
                          </span>
                        )}
                        {player.height && <span>{player.height}</span>}
                        {player.gpa != null && <span>{player.gpa} GPA</span>}
                      </div>

                      {player.gamesPlayed > 0 && (
                        <div className="mt-3 flex items-center gap-2">
                          <div className="flex-1 grid grid-cols-3 gap-1">
                            {[
                              { label: 'PPG', value: player.ppg },
                              { label: 'RPG', value: player.rpg },
                              { label: 'APG', value: player.apg },
                            ].map(s => (
                              <div key={s.label} className="text-center p-1.5 rounded bg-white/[0.04]">
                                <p className="text-[9px] text-white/30 uppercase">{s.label}</p>
                                <p className="text-xs font-bold text-white font-display">{s.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {player.badgeCount > 0 && (
                            <Badge variant="secondary" className="text-[10px] gap-0.5 px-1.5 py-0">
                              <Award className="w-3 h-3" /> {player.badgeCount}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-[10px] gap-0.5 px-1.5 py-0">
                            <Trophy className="w-3 h-3" /> {player.currentTier}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-white/25">
                          {player.gamesPlayed} games
                        </span>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="gap-1"
                  data-testid="button-prev-page"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Button>
                <span className="text-sm text-white/40" data-testid="text-page-info">
                  Page {data.page} of {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="gap-1"
                  data-testid="button-next-page"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}

        <div className="text-center mt-12 pb-8 space-y-3">
          <p className="text-sm text-white/30">Are you a player?</p>
          <Link href="/">
            <Button className="gap-2" data-testid="button-join-caliber">
              Join Caliber to get discovered
            </Button>
          </Link>
          <div className="mt-4">
            <CaliberLogo size={20} color="#E8192C" className="mx-auto opacity-30" />
            <p className="text-[10px] text-white/15 mt-1.5">Powered by Caliber Performance Labs</p>
          </div>
        </div>
      </div>
    </div>
  );
}