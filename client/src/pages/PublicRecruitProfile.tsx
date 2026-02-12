import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, MapPin, GraduationCap, Trophy, Award, Share2, ExternalLink, Star, Target, Activity, TrendingUp, TrendingDown, Minus, Flame, Mail, Copy, Shield, Zap, Clock, CheckCircle, Eye, BookOpen, Video } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { CaliberLogo } from "@/components/CaliberLogo";

interface PublicBadge {
  type: string;
  name: string;
  earnedAt: string | null;
}

interface PublicProfileData {
  player: {
    id: number;
    name: string;
    username: string | null;
    photoUrl: string | null;
    bannerUrl: string | null;
    bio: string | null;
    sport: string;
    position: string;
    team: string | null;
    city: string | null;
    state: string | null;
    height: string | null;
    school: string | null;
    graduationYear: number | null;
    level: string | null;
    gpa: number | null;
    currentTier: string;
    totalXp: number;
    jerseyNumber: number | null;
    stateRank: number | null;
    countryRank: number | null;
    openToOpportunities: boolean | null;
    highlightVideoUrl: string | null;
  };
  overallGrade: string | null;
  gamesPlayed: number;
  averages: Record<string, number>;
  recentGames: {
    id: number;
    date: string;
    opponent: string;
    result: string | null;
    grade: string | null;
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    passingYards: number | null;
    rushingYards: number | null;
    receivingYards: number | null;
    passingTouchdowns: number | null;
    rushingTouchdowns: number | null;
    receivingTouchdowns: number | null;
    tackles: number | null;
  }[];
  badgeCount: number;
  badges: PublicBadge[];
  streak: { type: string; current: number; longest: number } | null;
  bestGame: {
    id: number;
    date: string;
    opponent: string;
    result: string | null;
    grade: string | null;
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    passingYards: number | null;
    rushingYards: number | null;
    receivingYards: number | null;
    passingTouchdowns: number | null;
    rushingTouchdowns: number | null;
    receivingTouchdowns: number | null;
    tackles: number | null;
  } | null;
  trend: string | null;
  shareUrl: string;
}

const TIER_CONFIG: Record<string, { gradient: string; text: string; icon: string }> = {
  Rookie: { gradient: "from-gray-600 to-gray-700", text: "text-gray-300", icon: "text-gray-400" },
  Starter: { gradient: "from-emerald-600 to-emerald-700", text: "text-emerald-300", icon: "text-emerald-400" },
  "All-Star": { gradient: "from-blue-600 to-blue-700", text: "text-blue-300", icon: "text-blue-400" },
  MVP: { gradient: "from-purple-600 to-purple-700", text: "text-purple-300", icon: "text-purple-400" },
  "Hall of Fame": { gradient: "from-accent to-accent/80", text: "text-accent", icon: "text-accent" },
};

const XP_THRESHOLDS: Record<string, number> = {
  Rookie: 500,
  Starter: 2000,
  "All-Star": 5000,
  MVP: 10000,
  "Hall of Fame": 25000,
};

const GRADE_CONFIG: Record<string, { bg: string; text: string; ring: string }> = {
  'A+': { bg: 'bg-emerald-500', text: 'text-white', ring: 'ring-emerald-400/30' },
  'A': { bg: 'bg-emerald-500', text: 'text-white', ring: 'ring-emerald-400/30' },
  'A-': { bg: 'bg-emerald-500/90', text: 'text-white', ring: 'ring-emerald-400/20' },
  'B+': { bg: 'bg-blue-500', text: 'text-white', ring: 'ring-blue-400/30' },
  'B': { bg: 'bg-blue-500', text: 'text-white', ring: 'ring-blue-400/30' },
  'B-': { bg: 'bg-blue-500/90', text: 'text-white', ring: 'ring-blue-400/20' },
  'C+': { bg: 'bg-amber-500', text: 'text-white', ring: 'ring-amber-400/30' },
  'C': { bg: 'bg-amber-500', text: 'text-white', ring: 'ring-amber-400/30' },
  'C-': { bg: 'bg-amber-500/90', text: 'text-white', ring: 'ring-amber-400/20' },
  'D+': { bg: 'bg-orange-500', text: 'text-white', ring: 'ring-orange-400/30' },
  'D': { bg: 'bg-orange-500', text: 'text-white', ring: 'ring-orange-400/30' },
  'D-': { bg: 'bg-orange-500/90', text: 'text-white', ring: 'ring-orange-400/20' },
  'F': { bg: 'bg-red-500', text: 'text-white', ring: 'ring-red-400/30' },
};

const BADGE_ICONS: Record<string, typeof Target> = {
  twenty_piece: Target,
  thirty_bomb: Target,
  double_double: Award,
  triple_double: Award,
  ironman: Clock,
  efficiency_master: Star,
  lockdown: Shield,
  hustle_king: Zap,
  clean_sheet: CheckCircle,
  hot_streak_3: Flame,
  hot_streak_5: Flame,
  sharpshooter: Target,
  most_improved: TrendingUp,
  hustle_champion: Zap,
  scoring_machine: Target,
  consistency_king: Star,
  tier_starter: Trophy,
  tier_allstar: Trophy,
  tier_mvp: Trophy,
  tier_hof: Trophy,
  streak_3: Flame,
  streak_7: Flame,
  streak_14: Flame,
  streak_30: Flame,
  xp_100: Star,
  xp_500: Star,
  xp_1000: Star,
  xp_5000: Star,
};

function getYouTubeEmbedUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
  }
  return null;
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getGradeConfig(grade: string | null) {
  if (!grade) return null;
  return GRADE_CONFIG[grade.trim().toUpperCase()] || null;
}

function GradeCircle({ grade, size = "lg" }: { grade: string | null; size?: "sm" | "lg" }) {
  if (!grade) return null;
  const config = getGradeConfig(grade);
  if (!config) return null;
  const sizeClasses = size === "lg" ? "w-16 h-16 text-2xl" : "w-10 h-10 text-sm";
  return (
    <div className={`${sizeClasses} rounded-full ${config.bg} ${config.text} ring-4 ${config.ring} flex items-center justify-center font-bold font-display`} data-testid="grade-circle">
      {grade}
    </div>
  );
}

function StatBar({ label, value, max, suffix = "" }: { label: string; value: number; max: number; suffix?: string }) {
  const pct = Math.min((value / (max || 1)) * 100, 100);
  const testIdBase = label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1" data-testid={`stat-bar-${testIdBase}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-white/50 uppercase tracking-wider">{label}</span>
        <span className="text-sm font-bold text-white" data-testid={`stat-value-${testIdBase}`}>{value}{suffix}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function PublicRecruitProfile() {
  const [, params] = useRoute("/recruit/:id");
  const routeParams2 = useRoute("/profile/:id/public");
  const id = params?.id || routeParams2[1]?.id;
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<PublicProfileData>({
    queryKey: ['/api/public/players', id, 'profile'],
    queryFn: async () => {
      const res = await fetch(`/api/public/players/${id}/profile`);
      if (!res.ok) throw new Error('Player not found');
      return res.json();
    },
    enabled: !!id,
  });

  const handleShare = async () => {
    const url = `${window.location.origin}/recruit/${id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${data?.player.name} - Caliber Profile`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link Copied", description: "Recruiting profile link copied to clipboard" });
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link Copied", description: "Recruiting profile link copied to clipboard" });
      } catch {
        toast({ title: "Share URL", description: url });
      }
    }
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/recruit/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link Copied", description: "Recruiting profile link copied to clipboard" });
    } catch {
      toast({ title: "Share URL", description: url });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(220,15%,8%)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto" />
          <p className="text-white/40 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[hsl(220,15%,8%)] flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <Target className="w-10 h-10 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white" data-testid="text-error-title">Player Not Found</h2>
          <p className="text-white/50 text-sm">This recruiting profile doesn't exist or has been removed.</p>
          <Link href="/">
            <Button variant="outline" className="mt-4" data-testid="button-back-home">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { player, overallGrade, gamesPlayed, averages, recentGames, badges, badgeCount, streak, bestGame, trend } = data;
  const tierConfig = TIER_CONFIG[player.currentTier] || TIER_CONFIG.Rookie;
  const isBasketball = player.sport === 'basketball';
  const nextTierXp = XP_THRESHOLDS[player.currentTier] || 500;
  const xpProgress = Math.min((player.totalXp / nextTierXp) * 100, 100);

  return (
    <div className="min-h-screen bg-[hsl(220,15%,8%)] text-white">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[hsl(220,15%,8%)]/90 border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CaliberLogo size={28} color="#E8192C" />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="gap-1.5"
            data-testid="button-share-profile"
          >
            <Share2 className="w-3.5 h-3.5" /> Share
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto">
        <div className="relative">
          {player.bannerUrl ? (
            <div className="h-36 sm:h-44 w-full overflow-hidden">
              <img
                src={player.bannerUrl}
                alt="Cover"
                className="w-full h-full object-cover"
                data-testid="img-cover-photo"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[hsl(220,15%,8%)]" />
            </div>
          ) : (
            <div className="h-36 sm:h-44 w-full bg-card">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[hsl(220,15%,8%)]" />
            </div>
          )}

          <div className="relative px-4 -mt-14 sm:-mt-16">
            <div className="flex items-end gap-4">
              <Avatar className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-[hsl(220,15%,8%)] ring-2 ring-white/10">
                {player.photoUrl ? (
                  <AvatarImage src={player.photoUrl} alt={player.name} />
                ) : null}
                <AvatarFallback className="text-2xl bg-accent/10 text-accent font-display">
                  {getInitials(player.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 pb-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {player.jerseyNumber != null && (
                    <span className="text-accent font-bold text-base font-display" data-testid="text-jersey-number">#{player.jerseyNumber}</span>
                  )}
                  <Badge variant="secondary" className="text-xs" data-testid="badge-position">{player.position}</Badge>
                  <Badge variant="outline" className="text-xs" data-testid="badge-sport">
                    {isBasketball ? 'Basketball' : 'Football'}
                  </Badge>
                </div>
              </div>

              {overallGrade && (
                <div className="pb-1">
                  <GradeCircle grade={overallGrade} size="lg" />
                </div>
              )}
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight" data-testid="text-player-name">
                  {player.name}
                </h1>
                {player.openToOpportunities && (
                  <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-400 text-xs" data-testid="badge-open">
                    <Eye className="w-3 h-3 mr-1" /> Open to Offers
                  </Badge>
                )}
              </div>
              {player.username && (
                <p className="text-sm text-white/40" data-testid="text-username">@{player.username}</p>
              )}

              {player.bio && (
                <p className="text-sm text-white/60 leading-relaxed" data-testid="text-bio">{player.bio}</p>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/40">
                {(player.city || player.state) && (
                  <span className="flex items-center gap-1" data-testid="text-location">
                    <MapPin className="w-3 h-3" />
                    {[player.city, player.state].filter(Boolean).join(', ')}
                  </span>
                )}
                {player.school && (
                  <span className="flex items-center gap-1" data-testid="text-school">
                    <GraduationCap className="w-3 h-3" />
                    {player.school}
                  </span>
                )}
                {player.graduationYear && (
                  <span data-testid="text-grad-year">Class of {player.graduationYear}</span>
                )}
                {player.height && (
                  <span data-testid="text-height">{player.height}</span>
                )}
                {player.gpa != null && (
                  <span className="flex items-center gap-1" data-testid="text-gpa">
                    <BookOpen className="w-3 h-3" /> {player.gpa.toFixed(2)} GPA
                  </span>
                )}
                {player.team && (
                  <span data-testid="text-team">{player.team}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 mt-5 space-y-4">
          {player.highlightVideoUrl && (
            <Card className="p-4 mt-4" data-testid="card-highlight-video">
              <h2 className="text-sm font-bold font-display uppercase tracking-wider mb-3 flex items-center gap-2 text-white/70">
                <Video className="w-4 h-4 text-accent" /> Highlight Reel
              </h2>
              <div className="rounded-lg overflow-hidden bg-black aspect-video">
                {getYouTubeEmbedUrl(player.highlightVideoUrl) ? (
                  <iframe
                    src={getYouTubeEmbedUrl(player.highlightVideoUrl)!}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Highlight Reel"
                    data-testid="iframe-highlight-video"
                  />
                ) : (
                  <a
                    href={player.highlightVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center h-full text-white/50 hover:text-accent transition-colors"
                    data-testid="link-highlight-video"
                  >
                    <div className="text-center space-y-2">
                      <ExternalLink className="w-8 h-8 mx-auto" />
                      <p className="text-sm font-medium">Watch Highlights</p>
                    </div>
                  </a>
                )}
              </div>
            </Card>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Card className="p-3 text-center">
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">Games</p>
              <p className="text-xl font-bold text-white font-display" data-testid="text-games-played">{gamesPlayed}</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">Tier</p>
              <div className="flex items-center justify-center gap-1">
                <Trophy className={`w-3.5 h-3.5 ${tierConfig.icon}`} />
                <p className={`text-sm font-bold ${tierConfig.text} font-display`} data-testid="text-tier">{player.currentTier}</p>
              </div>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">Badges</p>
              <div className="flex items-center justify-center gap-1">
                <Award className="w-3.5 h-3.5 text-accent" />
                <p className="text-xl font-bold text-white font-display" data-testid="text-badge-count">{badgeCount}</p>
              </div>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">Trend</p>
              <div className="flex items-center justify-center gap-1">
                {trend === 'improving' ? (
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                ) : trend === 'declining' ? (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                ) : (
                  <Minus className="w-4 h-4 text-white/40" />
                )}
                <p className={`text-sm font-bold font-display ${trend === 'improving' ? 'text-emerald-400' : trend === 'declining' ? 'text-red-400' : 'text-white/50'}`} data-testid="text-trend">
                  {trend ? trend.charAt(0).toUpperCase() + trend.slice(1) : 'Stable'}
                </p>
              </div>
            </Card>
          </div>

          {(player.stateRank || player.countryRank) && (
            <div className="flex items-center gap-2 flex-wrap">
              {player.stateRank && (
                <Badge variant="secondary" className="bg-accent/15 text-accent gap-1" data-testid="badge-state-rank">
                  <Trophy className="w-3 h-3" /> #{player.stateRank} in {player.state || 'State'}
                </Badge>
              )}
              {player.countryRank && (
                <Badge variant="secondary" className="bg-purple-500/15 text-purple-400 gap-1" data-testid="badge-country-rank">
                  <Trophy className="w-3 h-3" /> #{player.countryRank} in USA
                </Badge>
              )}
            </div>
          )}

          <Card className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Star className={`w-4 h-4 ${tierConfig.icon}`} />
                <span className="text-xs text-white/50 uppercase tracking-wider">XP Progress</span>
              </div>
              <span className="text-xs text-white/40" data-testid="text-xp-progress">{player.totalXp.toLocaleString()} / {nextTierXp.toLocaleString()} XP</span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${tierConfig.gradient} transition-all duration-700`}
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </Card>

          {streak && streak.current > 0 && (
            <Card className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center">
                <Flame className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white" data-testid="text-streak-current">{streak.current}-day streak</p>
                <p className="text-xs text-white/40">Best: {streak.longest} days</p>
              </div>
            </Card>
          )}

          <Card className="p-4">
            <h2 className="text-sm font-bold font-display uppercase tracking-wider mb-3 flex items-center gap-2 text-white/70">
              <Activity className="w-4 h-4 text-accent" /> Season Averages
            </h2>
            {isBasketball ? (
              <div className="space-y-3">
                <StatBar label="Points" value={averages.ppg ?? 0} max={35} suffix="/g" />
                <StatBar label="Rebounds" value={averages.rpg ?? 0} max={15} suffix="/g" />
                <StatBar label="Assists" value={averages.apg ?? 0} max={12} suffix="/g" />
                <StatBar label="Steals" value={averages.spg ?? 0} max={5} suffix="/g" />
                <StatBar label="Blocks" value={averages.bpg ?? 0} max={5} suffix="/g" />
              </div>
            ) : (
              <div className="space-y-3">
                <StatBar label="Pass YPG" value={averages.passingYPG ?? 0} max={400} />
                <StatBar label="Rush YPG" value={averages.rushingYPG ?? 0} max={200} />
                <StatBar label="Rec YPG" value={averages.receivingYPG ?? 0} max={200} />
                <StatBar label="Total TDs" value={averages.totalTDs ?? 0} max={30} />
                <StatBar label="Tackles" value={averages.tackles ?? 0} max={100} />
              </div>
            )}
          </Card>

          {bestGame && (
            <Card className="p-4">
              <h2 className="text-sm font-bold font-display uppercase tracking-wider mb-3 flex items-center gap-2 text-white/70">
                <Star className="w-4 h-4 text-accent" /> Best Performance
              </h2>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-medium text-white">vs {bestGame.opponent}</p>
                  <p className="text-xs text-white/40">{format(new Date(bestGame.date), 'MMM d, yyyy')}</p>
                </div>
                <GradeCircle grade={bestGame.grade} size="sm" />
              </div>
              {isBasketball ? (
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { label: 'PTS', value: bestGame.points },
                    { label: 'REB', value: bestGame.rebounds },
                    { label: 'AST', value: bestGame.assists },
                    { label: 'STL', value: bestGame.steals },
                    { label: 'BLK', value: bestGame.blocks },
                  ].map(s => (
                    <div key={s.label} className="text-center p-2 rounded-md bg-white/[0.03]">
                      <p className="text-[10px] text-white/40 uppercase">{s.label}</p>
                      <p className="text-base font-bold text-white font-display" data-testid={`text-best-${s.label.toLowerCase()}`}>{s.value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Pass', value: bestGame.passingYards || 0, suffix: 'yds' },
                    { label: 'Rush', value: bestGame.rushingYards || 0, suffix: 'yds' },
                    { label: 'Rec', value: bestGame.receivingYards || 0, suffix: 'yds' },
                  ].filter(s => s.value > 0).map(s => (
                    <div key={s.label} className="text-center p-2 rounded-md bg-white/[0.03]">
                      <p className="text-[10px] text-white/40 uppercase">{s.label}</p>
                      <p className="text-base font-bold text-white font-display" data-testid={`text-best-${s.label.toLowerCase()}`}>{s.value} <span className="text-xs text-white/40">{s.suffix}</span></p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {badges && badges.length > 0 && (
            <Card className="p-4">
              <h2 className="text-sm font-bold font-display uppercase tracking-wider mb-3 flex items-center gap-2 text-white/70">
                <Award className="w-4 h-4 text-accent" /> Badges Earned
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {badges.slice(0, 8).map((badge, i) => {
                  const IconComp = BADGE_ICONS[badge.type] || Award;
                  return (
                    <div
                      key={`${badge.type}-${i}`}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                      data-testid={`card-badge-${badge.type}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                        <IconComp className="w-4 h-4 text-accent" />
                      </div>
                      <p className="text-[10px] text-white/60 text-center leading-tight font-medium">{badge.name}</p>
                    </div>
                  );
                })}
              </div>
              {badges.length > 8 && (
                <p className="text-xs text-white/30 text-center mt-2">+{badges.length - 8} more badges</p>
              )}
            </Card>
          )}

          {recentGames.length > 0 && (
            <Card className="p-4">
              <h2 className="text-sm font-bold font-display uppercase tracking-wider mb-3 flex items-center gap-2 text-white/70">
                <Activity className="w-4 h-4 text-accent" /> Recent Games
              </h2>
              <div className="space-y-2">
                {recentGames.map(game => (
                  <div
                    key={game.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                    data-testid={`card-recent-game-${game.id}`}
                  >
                    <GradeCircle grade={game.grade} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">vs {game.opponent}</p>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/40">
                        <span>{format(new Date(game.date), 'MMM d')}</span>
                        {game.result && <span>{game.result}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/50 shrink-0" data-testid={`text-game-stats-${game.id}`}>
                      {isBasketball ? (
                        <>
                          <span className="font-medium text-white">{game.points}</span>
                          <span className="text-white/30">/</span>
                          <span>{game.rebounds}</span>
                          <span className="text-white/30">/</span>
                          <span>{game.assists}</span>
                        </>
                      ) : (
                        <>
                          {(game.passingYards || 0) > 0 && <span>{game.passingYards}p</span>}
                          {(game.rushingYards || 0) > 0 && <span>{game.rushingYards}r</span>}
                          {(game.receivingYards || 0) > 0 && <span>{game.receivingYards}rc</span>}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-5 border-accent/20 bg-gradient-to-br from-card to-card">
            <div className="text-center space-y-3">
              <h3 className="text-lg font-bold font-display" data-testid="text-recruiting-cta">
                Interested in recruiting {player.name.split(' ')[0]}?
              </h3>
              <p className="text-sm text-white/50">
                Get in touch or share this profile with your coaching staff.
              </p>
              <div className="flex flex-wrap flex-col sm:flex-row items-center justify-center gap-2">
                <Button
                  onClick={handleShare}
                  className="gap-2 w-full sm:w-auto"
                  data-testid="button-contact-recruiting"
                >
                  <Mail className="w-4 h-4" /> Contact for Recruiting
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCopyLink}
                  className="gap-2 w-full sm:w-auto"
                  data-testid="button-copy-link"
                >
                  <Copy className="w-4 h-4" /> Copy Link
                </Button>
              </div>
            </div>
          </Card>

          <div className="flex items-center justify-center pt-2 pb-4">
            <Link href={`/players/${player.id}`}>
              <Button variant="outline" className="gap-2" data-testid="button-view-full-profile">
                <ExternalLink className="w-4 h-4" /> View Full Profile on Caliber
              </Button>
            </Link>
          </div>

          <div className="text-center pb-8">
            <CaliberLogo size={20} color="#E8192C" className="mx-auto opacity-30" />
            <p className="text-[10px] text-white/15 mt-1.5">Powered by Caliber Performance Labs</p>
          </div>
        </div>
      </main>
    </div>
  );
}
