import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Star, 
  Zap, 
  Trophy, 
  Crown, 
  Sparkles, 
  Copy, 
  Mail, 
  MapPin, 
  GraduationCap, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ChevronRight,
  User,
  Target,
  Award,
  Activity,
  MessageSquareQuote,
  Film,
  Play
} from "lucide-react";
import { FOOTBALL_POSITIONS, FOOTBALL_POSITION_LABELS, type FootballPosition } from "@shared/sports-config";
import { cn } from "@/lib/utils";
import { CoachRecommendations } from "@/components/CoachRecommendations";

interface PublicPlayerData {
  player: {
    id: number;
    name: string;
    position: string;
    jerseyNumber: number | null;
    photoUrl: string | null;
    bannerUrl: string | null;
    sport: string;
    currentTier: string;
    totalXp: number;
    school: string | null;
    graduationYear: number | null;
    state: string | null;
    gpa: string | null;
    height: string | null;
    level: string | null;
    bio: string | null;
  };
  stats: {
    gamesPlayed: number;
    averageGrade: string;
    performanceTrend: 'improving' | 'stable' | 'declining';
    basketball: {
      ppg: number;
      rpg: number;
      apg: number;
    };
    football: {
      passingYpg: number;
      rushingYpg: number;
      receivingYpg: number;
      totalTDs: number;
      tacklesPerGame: number;
    };
  };
  recentGames: Array<{
    id: number;
    date: string;
    opponent: string;
    grade: string | null;
    points: number;
    rebounds: number;
    assists: number;
    passingYards?: number;
    rushingYards?: number;
    receivingYards?: number;
    passingTouchdowns?: number;
    rushingTouchdowns?: number;
    receivingTouchdowns?: number;
    tackles?: number;
  }>;
  badges: Array<{
    type: string;
    earnedAt: string | null;
  }>;
  skillBadges: Array<{
    skillType: string;
    level: string;
  }>;
  accolades: Array<{
    id: number;
    type: string;
    title: string;
    season: string | null;
  }>;
  shareUrl: string;
  ogImage: string;
}

const TIER_ICONS: Record<string, typeof Star> = {
  Rookie: Star,
  Starter: Zap,
  "All-Star": Sparkles,
  MVP: Trophy,
  "Hall of Fame": Crown,
};

const TIER_COLORS: Record<string, string> = {
  Rookie: "text-gray-400 bg-gray-500/10 border-gray-500/20",
  Starter: "text-green-400 bg-green-500/10 border-green-500/20",
  "All-Star": "text-blue-400 bg-blue-500/10 border-blue-500/20",
  MVP: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  "Hall of Fame": "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
};

const GRADE_COLORS: Record<string, string> = {
  'A': "from-green-500 to-emerald-500",
  'B': "from-blue-500 to-accent",
  'C': "from-yellow-500 to-orange-500",
  'D': "from-orange-500 to-red-500",
  'F': "from-red-500 to-rose-500",
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getGradeColor(grade: string): string {
  const letter = grade.charAt(0).toUpperCase();
  return GRADE_COLORS[letter] || GRADE_COLORS['C'];
}

function formatPosition(position: string | null | undefined): string {
  if (!position) return '';
  return position.split(',').map(p => {
    const pos = p.trim();
    if (FOOTBALL_POSITIONS.includes(pos as FootballPosition)) {
      return FOOTBALL_POSITION_LABELS[pos as FootballPosition];
    }
    return pos;
  }).join(' / ');
}

function PublicPlayerProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(220,25%,6%)] via-[hsl(220,20%,5%)] to-[hsl(220,25%,4%)] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-24 h-24 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}

export default function PublicPlayerProfile() {
  const [, params] = useRoute("/profile/:id/public");
  const playerId = Number(params?.id);
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<PublicPlayerData>({
    queryKey: [`/api/players/${playerId}/public`],
    enabled: !!playerId,
  });

  const { data: endorsements = [] } = useQuery({
    queryKey: ['/api/players', playerId, 'endorsements'],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}/endorsements`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!playerId && !isNaN(playerId),
  });

  const { data: highlights = [] } = useQuery({
    queryKey: ['/api/players', playerId, 'highlights'],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/players/${playerId}/highlights`);
        if (!res.ok) return [];
        return res.json();
      } catch { return []; }
    },
    enabled: !!playerId && !isNaN(playerId),
  });

  useEffect(() => {
    if (data?.player) {
      document.title = `${data.player.name} - Player Profile | Caliber`;
      
      const metaTags = [
        { property: 'og:title', content: `${data.player.name} - ${formatPosition(data.player.position)} | Caliber` },
        { property: 'og:description', content: `Check out ${data.player.name}'s player profile. ${data.stats.averageGrade} grade average, ${data.stats.gamesPlayed} games played.` },
        { property: 'og:image', content: data.ogImage },
        { property: 'og:url', content: data.shareUrl },
        { property: 'og:type', content: 'profile' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: `${data.player.name} - Player Profile` },
        { name: 'twitter:description', content: `${data.stats.averageGrade} grade average | ${data.player.currentTier} tier` },
      ];

      metaTags.forEach(({ property, name, content }) => {
        let meta = property 
          ? document.querySelector(`meta[property="${property}"]`)
          : document.querySelector(`meta[name="${name}"]`);
        
        if (!meta) {
          meta = document.createElement('meta');
          if (property) meta.setAttribute('property', property);
          if (name) meta.setAttribute('name', name);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      });
    }
  }, [data]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(data?.shareUrl || window.location.href);
      toast({
        title: "Link Copied!",
        description: "Profile link copied to clipboard",
      });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <PublicPlayerProfileSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[hsl(220,25%,6%)] via-[hsl(220,20%,5%)] to-[hsl(220,25%,4%)] text-white flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">Player Not Found</h2>
          <p className="text-muted-foreground mb-4">This player profile doesn't exist or has been removed.</p>
          <Link href="/">
            <Button data-testid="button-go-home">Go to Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const { player, stats, recentGames, skillBadges, accolades } = data;
  const isFootball = player.sport === 'football';
  const TierIcon = TIER_ICONS[player.currentTier] || Star;
  const tierColorClass = TIER_COLORS[player.currentTier] || TIER_COLORS.Rookie;

  const TrendIcon = stats.performanceTrend === 'improving' ? TrendingUp : 
                    stats.performanceTrend === 'declining' ? TrendingDown : Minus;
  const trendColor = stats.performanceTrend === 'improving' ? 'text-green-400' :
                     stats.performanceTrend === 'declining' ? 'text-red-400' : 'text-gray-400';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(220,25%,6%)] via-[hsl(220,20%,5%)] to-[hsl(220,25%,4%)] text-white">
      <div className="absolute inset-0 pointer-events-none opacity-30" />
      
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[hsl(220,25%,6%)]/80 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-accent">CALIBER</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopyLink}
            className="gap-2"
            data-testid="button-copy-link"
          >
            <Copy className="w-4 h-4" />
            Share
          </Button>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-6 space-y-6 pb-12">
        <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm">
          {player.bannerUrl && (
            <div className="h-32 md:h-48 overflow-hidden">
              <img 
                src={player.bannerUrl} 
                alt="" 
                className="w-full h-full object-cover"
                data-testid="img-player-banner"
              />
            </div>
          )}
          
          <div className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
              <div className="flex items-start gap-4 flex-1">
                <div className="relative flex-shrink-0">
                  <Avatar className="w-20 h-20 md:w-24 md:h-24 border-2 border-accent/30">
                    <AvatarImage src={player.photoUrl || undefined} alt={player.name} data-testid="img-player-photo" />
                    <AvatarFallback className="bg-gradient-to-br from-accent/30 to-blue-600/30 text-xl font-bold">
                      {getInitials(player.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-8 h-8 rounded-lg flex items-center justify-center border",
                    tierColorClass
                  )}>
                    <TierIcon className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {player.jerseyNumber && (
                      <span className="text-xl font-bold text-accent font-display">#{player.jerseyNumber}</span>
                    )}
                    <Badge variant="outline" className="border-accent/30 text-accent text-xs uppercase">
                      {formatPosition(player.position)}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs uppercase",
                        isFootball ? "border-accent/30 text-accent" : "border-accent/30 text-accent"
                      )}
                      data-testid={isFootball ? "badge-sport-football" : "badge-sport-basketball"}
                    >
                      {isFootball ? "Football" : "Basketball"}
                    </Badge>
                  </div>
                  
                  <h1 className="text-2xl md:text-3xl font-bold font-display uppercase tracking-tight truncate" data-testid="text-player-name">
                    {player.name}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-muted-foreground">
                    {player.school && (
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-4 h-4" />
                        {player.school}
                      </span>
                    )}
                    {player.graduationYear && (
                      <span className="font-medium text-accent" data-testid="text-graduation-year">
                        Class of {player.graduationYear}
                      </span>
                    )}
                    {player.state && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {player.state}
                      </span>
                    )}
                    {player.height && <span>{player.height}</span>}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Badge className={cn("gap-1 border", tierColorClass)}>
                      <TierIcon className="w-3 h-3" />
                      {player.currentTier}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center md:justify-end gap-4">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground uppercase mb-1">Overall</div>
                  <div 
                    className={cn(
                      "w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold text-white bg-gradient-to-br",
                      getGradeColor(stats.averageGrade)
                    )}
                    data-testid="badge-overall-grade"
                  >
                    {stats.averageGrade}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground uppercase mb-1">Trend</div>
                  <div className={cn("flex items-center gap-1 font-medium", trendColor)} data-testid="indicator-trend">
                    <TrendIcon className="w-5 h-5" />
                    <span className="capitalize text-sm">{stats.performanceTrend}</span>
                  </div>
                </div>
              </div>
            </div>

            {player.bio && (
              <p className="mt-4 text-sm text-muted-foreground line-clamp-3" data-testid="text-player-bio">
                {player.bio}
              </p>
            )}
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-accent/10 via-accent/5 to-accent/10 border-accent/20 overflow-hidden" data-testid="card-scout-me">
          <div className="p-4 md:p-6 flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 justify-center md:justify-start">
                <Target className="w-5 h-5 text-accent" />
                Interested in Recruiting {player.name.split(' ')[0]}?
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {player.school && `${player.school}`}
                {player.graduationYear && ` - Class of ${player.graduationYear}`}
                {player.state && ` - ${player.state}`}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => {
                  const subject = encodeURIComponent(`Recruiting Interest - ${player.name}`);
                  const body = encodeURIComponent(`Hi,\n\nI'm interested in learning more about ${player.name} as a potential recruit.\n\nPlayer Profile: ${window.location.href}\n\nBest regards`);
                  window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
                }}
                className="gap-2"
                data-testid="button-contact-recruit"
              >
                <Mail className="w-4 h-4" />
                Contact for Recruiting
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast({ title: "Profile Link Copied", description: "Share this link with coaches and recruiters." });
                }}
                className="gap-2"
                data-testid="button-copy-scout-link"
              >
                <Copy className="w-4 h-4" />
                Copy Link
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {isFootball ? (
            <>
              <Card className="p-4 text-center border-border bg-card/50">
                <div className="text-2xl md:text-3xl font-bold text-white font-display" data-testid="stat-total-tds">
                  {stats.football.totalTDs}
                </div>
                <div className="text-xs text-muted-foreground uppercase">Total TDs</div>
              </Card>
              <Card className="p-4 text-center border-border bg-card/50">
                <div className="text-2xl md:text-3xl font-bold text-white font-display" data-testid="stat-rushing-ypg">
                  {stats.football.rushingYpg}
                </div>
                <div className="text-xs text-muted-foreground uppercase">Rush YPG</div>
              </Card>
              <Card className="p-4 text-center border-border bg-card/50">
                <div className="text-2xl md:text-3xl font-bold text-white font-display" data-testid="stat-passing-ypg">
                  {stats.football.passingYpg}
                </div>
                <div className="text-xs text-muted-foreground uppercase">Pass YPG</div>
              </Card>
              <Card className="p-4 text-center border-border bg-card/50">
                <div className="text-2xl md:text-3xl font-bold text-white font-display" data-testid="stat-games-played">
                  {stats.gamesPlayed}
                </div>
                <div className="text-xs text-muted-foreground uppercase">Games</div>
              </Card>
            </>
          ) : (
            <>
              <Card className="p-4 text-center border-border bg-card/50">
                <div className="text-2xl md:text-3xl font-bold text-white font-display" data-testid="stat-ppg">
                  {stats.basketball.ppg}
                </div>
                <div className="text-xs text-muted-foreground uppercase">PPG</div>
              </Card>
              <Card className="p-4 text-center border-border bg-card/50">
                <div className="text-2xl md:text-3xl font-bold text-white font-display" data-testid="stat-rpg">
                  {stats.basketball.rpg}
                </div>
                <div className="text-xs text-muted-foreground uppercase">RPG</div>
              </Card>
              <Card className="p-4 text-center border-border bg-card/50">
                <div className="text-2xl md:text-3xl font-bold text-white font-display" data-testid="stat-apg">
                  {stats.basketball.apg}
                </div>
                <div className="text-xs text-muted-foreground uppercase">APG</div>
              </Card>
              <Card className="p-4 text-center border-border bg-card/50">
                <div className="text-2xl md:text-3xl font-bold text-white font-display" data-testid="stat-games-played">
                  {stats.gamesPlayed}
                </div>
                <div className="text-xs text-muted-foreground uppercase">Games</div>
              </Card>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 md:p-6 border-border bg-card/50">
            <h2 className="text-lg font-bold font-display uppercase tracking-wide mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-accent" />
              Recruiting Info
            </h2>
            <div className="space-y-3">
              {player.graduationYear && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Class Year</span>
                  <span className="font-medium text-lg text-accent" data-testid="text-class-year">{player.graduationYear}</span>
                </div>
              )}
              {player.gpa && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">GPA</span>
                  <span className="font-medium text-lg" data-testid="text-gpa">{player.gpa}</span>
                </div>
              )}
              {player.level && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Level</span>
                  <span className="font-medium capitalize">{player.level.replace('_', ' ')}</span>
                </div>
              )}
              {player.height && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Height</span>
                  <span className="font-medium">{player.height}</span>
                </div>
              )}
            </div>
            <Button 
              className="w-full mt-4 gap-2" 
              variant="outline"
              onClick={() => window.location.href = 'mailto:contact@caliber.app'}
              data-testid="button-contact-player"
            >
              <Mail className="w-4 h-4" />
              Contact Player
            </Button>
          </Card>

          <Card className="p-4 md:p-6 border-border bg-card/50">
            <h2 className="text-lg font-bold font-display uppercase tracking-wide mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" />
              Recent Highlights
            </h2>
            {recentGames.length > 0 ? (
              <div className="space-y-2">
                {recentGames.map((game) => (
                  <div 
                    key={game.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                    data-testid={`highlight-game-${game.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">vs {game.opponent}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-muted-foreground">
                        {isFootball ? (
                          <span>{(game.rushingYards || 0) + (game.passingYards || 0)} yds</span>
                        ) : (
                          <span>{game.points} pts</span>
                        )}
                      </div>
                      <div 
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white bg-gradient-to-br text-sm",
                          getGradeColor(game.grade || 'C')
                        )}
                      >
                        {game.grade || '—'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No games recorded yet
              </div>
            )}
          </Card>
        </div>

        {(skillBadges.length > 0 || accolades.length > 0) && (
          <Card className="p-4 md:p-6 border-border bg-card/50">
            <h2 className="text-lg font-bold font-display uppercase tracking-wide mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-accent" />
              Achievements
            </h2>
            <div className="space-y-4">
              {skillBadges.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground uppercase mb-2">Skill Badges</div>
                  <div className="flex flex-wrap gap-2">
                    {skillBadges.map((badge) => (
                      <Badge 
                        key={badge.skillType} 
                        variant="outline" 
                        className="capitalize gap-1 border-accent/30"
                        data-testid={`badge-skill-${badge.skillType}`}
                      >
                        <Target className="w-3 h-3" />
                        {badge.skillType.replace('_', ' ')} ({badge.level})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {accolades.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground uppercase mb-2">Accolades</div>
                  <div className="flex flex-wrap gap-2">
                    {accolades.map((accolade) => (
                      <Badge 
                        key={accolade.id} 
                        variant="outline" 
                        className="gap-1 border-accent/30 text-accent"
                        data-testid={`badge-accolade-${accolade.id}`}
                      >
                        <Trophy className="w-3 h-3" />
                        {accolade.title}
                        {accolade.season && <span className="text-muted-foreground">({accolade.season})</span>}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {endorsements.length > 0 && (
          <div className="space-y-4" data-testid="section-public-endorsements">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MessageSquareQuote className="w-5 h-5 text-accent" />
              Coach Endorsements
              <Badge className="bg-accent/10 text-accent border-accent/20 no-default-hover-elevate no-default-active-elevate">
                {endorsements.length}
              </Badge>
            </h2>
            <div className="grid gap-3">
              {endorsements.map((e: any) => (
                <Card key={e.id} className="p-4 bg-white/5 border-white/10" data-testid={`public-endorsement-${e.id}`}>
                  <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8 border border-white/10">
                      <AvatarFallback className="bg-accent/20 text-accent text-xs font-bold">
                        {e.coachName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-bold text-white">{e.coachName}</span>
                        <Badge className="text-[10px] bg-white/5 border-white/10 no-default-hover-elevate no-default-active-elevate">
                          {e.skillCategory?.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-white/70">{e.content}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {highlights.length > 0 && (
          <div className="space-y-4" data-testid="section-public-highlights">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Film className="w-5 h-5 text-accent" />
              Highlight Clips
              <Badge className="bg-accent/10 text-accent border-accent/20 no-default-hover-elevate no-default-active-elevate">
                {highlights.length}
              </Badge>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {highlights.map((clip: any) => (
                <Card key={clip.id} className="overflow-hidden border-white/10 bg-white/5" data-testid={`public-highlight-${clip.id}`}>
                  {clip.thumbnailUrl ? (
                    <div className="relative aspect-video bg-black/40">
                      <img src={clip.thumbnailUrl} alt={clip.title || 'Highlight'} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center border border-white/20">
                          <Play className="w-5 h-5 text-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-accent/10 to-blue-600/10 flex items-center justify-center">
                      <Film className="w-10 h-10 text-white/20" />
                    </div>
                  )}
                  <div className="p-3">
                    <h4 className="text-sm font-bold text-white truncate">{clip.title || 'Highlight Clip'}</h4>
                    {clip.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{clip.description}</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            size="lg" 
            onClick={handleCopyLink}
            className="gap-2"
            data-testid="button-copy-profile-link"
          >
            <Copy className="w-4 h-4" />
            Copy Profile Link
          </Button>
          <Link href="/">
            <Button 
              variant="outline" 
              size="lg" 
              className="gap-2 w-full sm:w-auto"
              data-testid="button-view-in-app"
            >
              View in Caliber
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Coach Recommendations Section */}
        <section className="py-12 border-t border-border">
          <CoachRecommendations 
            playerId={player.id}
            isCoachViewing={false}
            showWriteForm={false}
          />
        </section>
      </main>

      <footer className="relative z-10 border-t border-border py-6 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">C</span>
          </div>
          <span className="font-display font-bold">CALIBER</span>
        </div>
        <p>The #1 App for Youth Athletes</p>
      </footer>
    </div>
  );
}
