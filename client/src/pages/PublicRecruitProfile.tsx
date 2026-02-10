import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, MapPin, GraduationCap, Trophy, Award, Share2, ExternalLink, ChevronLeft, Star, Target, Shield, Zap, Activity } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import caliberLogo from "@assets/caliber-logo-cyan.png";

interface PublicProfileData {
  player: {
    id: number;
    name: string;
    photoUrl: string | null;
    sport: string;
    position: string;
    team: string | null;
    city: string | null;
    state: string | null;
    height: string | null;
    school: string | null;
    graduationYear: number | null;
    level: string | null;
    currentTier: string;
    totalXp: number;
    jerseyNumber: number | null;
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
  shareUrl: string;
}

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Rookie: { bg: "bg-gray-500/20", text: "text-gray-300", border: "border-gray-500/30" },
  Starter: { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/30" },
  "All-Star": { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
  MVP: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30" },
  "Hall of Fame": { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30" },
};

const GRADE_COLORS: Record<string, string> = {
  'A+': 'text-amber-400', 'A': 'text-amber-400', 'A-': 'text-amber-400',
  'B+': 'text-slate-300', 'B': 'text-slate-300', 'B-': 'text-slate-300',
  'C+': 'text-orange-400', 'C': 'text-orange-400', 'C-': 'text-orange-400',
  'D+': 'text-red-400', 'D': 'text-red-400', 'D-': 'text-red-400',
  'F': 'text-red-500',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getGradeColor(grade: string | null): string {
  if (!grade) return 'text-muted-foreground';
  return GRADE_COLORS[grade.trim().toUpperCase()] || 'text-muted-foreground';
}

export default function PublicRecruitProfile() {
  const [, params] = useRoute("/recruit/:id");
  const id = params?.id;
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
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied",
        description: "Recruiting profile link copied to clipboard",
      });
    } catch {
      toast({
        title: "Share URL",
        description: url,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[hsl(220,25%,6%)] via-[hsl(220,20%,5%)] to-[hsl(220,25%,4%)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
          <p className="text-white/60">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[hsl(220,25%,6%)] via-[hsl(220,20%,5%)] to-[hsl(220,25%,4%)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Target className="w-10 h-10 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white" data-testid="text-error-title">Player Not Found</h2>
          <p className="text-white/60">This recruiting profile doesn't exist or has been removed.</p>
          <Link href="/">
            <Button variant="outline" className="mt-4" data-testid="button-back-home">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { player, overallGrade, gamesPlayed, averages, recentGames, badgeCount } = data;
  const tierStyle = TIER_COLORS[player.currentTier] || TIER_COLORS.Rookie;
  const isBasketball = player.sport === 'basketball';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(220,25%,6%)] via-[hsl(220,20%,5%)] to-[hsl(220,25%,4%)] text-white">
      <div className="absolute inset-0 cyber-grid pointer-events-none opacity-20" />

      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[hsl(220,25%,6%)]/80 border-b border-cyan-500/10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <img src={caliberLogo} alt="Caliber" className="h-8" data-testid="img-caliber-logo" />
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

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Card className="p-6 md:p-8 relative overflow-visible">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <Avatar className="w-24 h-24 md:w-28 md:h-28 border-2 border-cyan-500/30">
              {player.photoUrl ? (
                <AvatarImage src={player.photoUrl} alt={player.name} />
              ) : null}
              <AvatarFallback className="text-2xl bg-cyan-500/10 text-cyan-400">
                {getInitials(player.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2">
                {player.jerseyNumber && (
                  <span className="text-cyan-400 font-bold text-lg" data-testid="text-jersey-number">#{player.jerseyNumber}</span>
                )}
                <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight" data-testid="text-player-name">
                  {player.name}
                </h1>
              </div>

              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2">
                <Badge variant="secondary" className="text-xs" data-testid="badge-position">
                  <span data-testid="text-player-position">{player.position}</span>
                </Badge>
                <Badge variant="outline" className="text-xs" data-testid="badge-sport">
                  {player.sport === 'basketball' ? 'Basketball' : 'Football'}
                </Badge>
                {player.team && (
                  <span className="text-sm text-white/60" data-testid="text-team">{player.team}</span>
                )}
              </div>

              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 text-sm text-white/50">
                {(player.city || player.state) && (
                  <span className="flex items-center gap-1" data-testid="text-location">
                    <MapPin className="w-3.5 h-3.5" />
                    {[player.city, player.state].filter(Boolean).join(', ')}
                  </span>
                )}
                {player.school && (
                  <span className="flex items-center gap-1" data-testid="text-school">
                    <GraduationCap className="w-3.5 h-3.5" />
                    {player.school}
                  </span>
                )}
                {player.graduationYear && (
                  <span data-testid="text-grad-year">Class of {player.graduationYear}</span>
                )}
                {player.height && (
                  <span data-testid="text-height">{player.height}</span>
                )}
              </div>
            </div>

            {overallGrade && (
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs uppercase tracking-wider text-white/40">Overall</span>
                <div className={`text-4xl font-bold font-display ${getGradeColor(overallGrade)}`} data-testid="text-overall-grade">
                  {overallGrade}
                </div>
              </div>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 text-center">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Games</p>
            <p className="text-2xl font-bold text-white" data-testid="text-games-played">{gamesPlayed}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Tier</p>
            <div className="flex items-center justify-center gap-1.5">
              <Trophy className={`w-4 h-4 ${tierStyle.text}`} />
              <p className={`text-lg font-bold ${tierStyle.text}`} data-testid="text-tier">{player.currentTier}</p>
            </div>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Badges</p>
            <div className="flex items-center justify-center gap-1.5">
              <Award className="w-4 h-4 text-cyan-400" />
              <p className="text-2xl font-bold text-white" data-testid="text-badge-count">{badgeCount}</p>
            </div>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">XP</p>
            <p className="text-2xl font-bold text-cyan-400" data-testid="text-xp">{player.totalXp.toLocaleString()}</p>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-bold font-display uppercase tracking-wide mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" /> Season Averages
          </h2>
          {isBasketball ? (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[
                { label: 'PPG', key: 'ppg', value: averages.ppg ?? 0 },
                { label: 'RPG', key: 'rpg', value: averages.rpg ?? 0 },
                { label: 'APG', key: 'apg', value: averages.apg ?? 0 },
                { label: 'SPG', key: 'spg', value: averages.spg ?? 0 },
                { label: 'BPG', key: 'bpg', value: averages.bpg ?? 0 },
              ].map(stat => (
                <div key={stat.label} className="text-center p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className="text-xl font-bold text-white" data-testid={`text-season-avg-${stat.key}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[
                { label: 'Pass YPG', key: 'passingYPG', value: averages.passingYPG ?? 0 },
                { label: 'Rush YPG', key: 'rushingYPG', value: averages.rushingYPG ?? 0 },
                { label: 'Rec YPG', key: 'receivingYPG', value: averages.receivingYPG ?? 0 },
                { label: 'Total TDs', key: 'totalTDs', value: averages.totalTDs ?? 0 },
                { label: 'Tackles', key: 'tackles', value: averages.tackles ?? 0 },
              ].map(stat => (
                <div key={stat.label} className="text-center p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className="text-xl font-bold text-white" data-testid={`text-season-avg-${stat.key}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {recentGames.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-bold font-display uppercase tracking-wide mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-cyan-400" /> Recent Performance
            </h2>
            <div className="space-y-3">
              {recentGames.map(game => (
                <div
                  key={game.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                  data-testid={`card-recent-game-${game.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">vs {game.opponent}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-white/40">
                      <span>{format(new Date(game.date), 'MMM d, yyyy')}</span>
                      {game.result && <span>{game.result}</span>}
                    </div>
                  </div>
                  {isBasketball ? (
                    <div className="flex items-center gap-3 text-xs text-white/60">
                      <span>{game.points}pts</span>
                      <span>{game.rebounds}reb</span>
                      <span>{game.assists}ast</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-xs text-white/60">
                      {(game.passingYards || 0) > 0 && <span>{game.passingYards}pass</span>}
                      {(game.rushingYards || 0) > 0 && <span>{game.rushingYards}rush</span>}
                      {(game.receivingYards || 0) > 0 && <span>{game.receivingYards}rec</span>}
                    </div>
                  )}
                  {game.grade && (
                    <div className={`text-lg font-bold font-display ${getGradeColor(game.grade)}`} data-testid={`text-game-grade-${game.id}`}>
                      {game.grade}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 pb-8">
          <Button
            onClick={handleShare}
            variant="outline"
            className="gap-2 w-full sm:w-auto"
            data-testid="button-share-bottom"
          >
            <Share2 className="w-4 h-4" /> Copy Profile Link
          </Button>
          <Link href={`/players/${player.id}`}>
            <Button className="gap-2 w-full sm:w-auto" data-testid="button-view-full-profile">
              <ExternalLink className="w-4 h-4" /> View Full Profile
            </Button>
          </Link>
        </div>

        <div className="text-center pb-8">
          <img src={caliberLogo} alt="Caliber" className="h-6 mx-auto opacity-40" />
          <p className="text-xs text-white/20 mt-2">Powered by Caliber</p>
        </div>
      </main>
    </div>
  );
}
