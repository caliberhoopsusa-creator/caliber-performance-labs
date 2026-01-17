import { usePlayer, useDeleteGame, usePlayerBadges, useUpdatePlayer, type PlayerUpdate } from "@/hooks/use-basketball";
import { GoalsPanel } from "@/components/GoalsPanel";
import { SocialEngagement } from "@/components/SocialEngagement";
import { PlayerProgression } from "@/components/PlayerProgression";
import { SkillBadges } from "@/components/SkillBadges";
import { ShotChart } from "@/components/ShotChart";
import { GameNotes } from "@/components/GameNotes";
import { DrillRecommendations } from "@/components/DrillRecommendations";
import { CoachGoals } from "@/components/CoachGoals";
import { ImprovementReport } from "@/components/ImprovementReport";
import { PreGameReport } from "@/components/PreGameReport";
import { PlayerReportCard } from "@/components/PlayerReportCard";
import { FollowButton } from "@/components/FollowButton";
import { FollowStats } from "@/components/FollowStats";
import { FollowersList } from "@/components/FollowersList";
import { FollowingList } from "@/components/FollowingList";
import { useAuth } from "@/hooks/use-auth";
import { useRoute, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/StatCard";
import { GradeBadge } from "@/components/GradeBadge";
import { PlayerArchetype } from "@/components/PlayerArchetype";
import { ArrowLeft, Plus, Trash2, Award, ClipboardList, Activity, Target, Clock, Star, Shield, Zap, CheckCircle, Flame, Crosshair, Trophy, Share2, BarChart3, Medal, User, ChevronRight, ChevronDown, TrendingUp, Pencil, Camera, Upload, X, FileText, Dumbbell } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ObjectUploader } from "@/components/ObjectUploader";
import { BADGE_DEFINITIONS, type Badge, type Game } from "@shared/schema";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo } from "react";
import { AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const BADGE_ICONS: Record<string, any> = {
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
  sharpshooter: Crosshair,
};

const GRADE_VALUES: Record<string, number> = {
  'A+': 100, 'A': 95, 'A-': 90,
  'B+': 88, 'B': 85, 'B-': 80,
  'C+': 78, 'C': 75, 'C-': 70,
  'D+': 68, 'D': 65, 'D-': 60,
  'F': 50,
};

function getGradeValue(grade: string | null): number {
  if (!grade) return 0;
  return GRADE_VALUES[grade.trim().toUpperCase()] || 0;
}

function getAverageGrade(games: Game[]): string {
  if (games.length === 0) return "—";
  const totalValue = games.reduce((acc, g) => acc + getGradeValue(g.grade), 0);
  const avgValue = totalValue / games.length;
  
  if (avgValue >= 97) return "A+";
  if (avgValue >= 92) return "A";
  if (avgValue >= 87) return "A-";
  if (avgValue >= 84) return "B+";
  if (avgValue >= 81) return "B";
  if (avgValue >= 77) return "B-";
  if (avgValue >= 74) return "C+";
  if (avgValue >= 71) return "C";
  if (avgValue >= 67) return "C-";
  if (avgValue >= 64) return "D+";
  if (avgValue >= 61) return "D";
  if (avgValue >= 55) return "D-";
  return "F";
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface CoachToolsSectionProps {
  playerId: number;
  games: Game[];
}

function CoachToolsSection({ playerId, games }: CoachToolsSectionProps) {
  const [showReportCard, setShowReportCard] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(games[0]?.id || null);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold font-display text-white mb-4 flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-primary" /> Shot Chart
          </h3>
          {games.length > 0 ? (
            <div className="space-y-4">
              <Select
                value={selectedGameId?.toString() || ""}
                onValueChange={(val) => setSelectedGameId(parseInt(val))}
              >
                <SelectTrigger className="bg-secondary/30 border-white/10" data-testid="select-game-for-shot-chart">
                  <SelectValue placeholder="Select a game" />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10">
                  {games.map(game => (
                    <SelectItem key={game.id} value={game.id.toString()}>
                      vs {game.opponent} - {format(new Date(game.date), 'MMM dd, yyyy')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedGameId && <ShotChart gameId={selectedGameId} playerId={playerId} />}
            </div>
          ) : (
            <div className="text-muted-foreground text-sm text-center py-8">
              No games logged yet. Log a game to see shot chart data.
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold font-display text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" /> Coach Goals
          </h3>
          <CoachGoals playerId={playerId} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold font-display text-white mb-4 flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary" /> Drill Recommendations
          </h3>
          <DrillRecommendations playerId={playerId} />
        </Card>

        {selectedGameId && (
          <Card className="p-6">
            <h3 className="text-lg font-bold font-display text-white mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" /> Game Notes
            </h3>
            <GameNotes gameId={selectedGameId} playerId={playerId} />
          </Card>
        )}
      </div>

      <ImprovementReport playerId={playerId} />

      <PreGameReport playerId={playerId} />

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> Player Report Card
          </h3>
          <Button 
            onClick={() => setShowReportCard(!showReportCard)}
            variant={showReportCard ? "secondary" : "default"}
            className="gap-2"
            data-testid="button-toggle-report-card"
          >
            <FileText className="w-4 h-4" />
            {showReportCard ? "Hide Report Card" : "Generate Report Card"}
          </Button>
        </div>
        {showReportCard && <PlayerReportCard playerId={playerId} />}
      </Card>
    </div>
  );
}

interface FollowingPlayer {
  id: number;
  playerId: number;
  name: string;
}

export default function PlayerDetail() {
  const [, params] = useRoute("/players/:id");
  const id = Number(params?.id);
  const { data: player, isLoading } = usePlayer(id);
  const { data: badges = [], isLoading: badgesLoading } = usePlayerBadges(id);
  const { mutate: deleteGame } = useDeleteGame();
  const { mutate: updatePlayer, isPending: isUpdating } = useUpdatePlayer();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [location, navigate] = useLocation();
  const [showAllGames, setShowAllGames] = useState(false);
  const [expandedGameId, setExpandedGameId] = useState<number | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<PlayerUpdate>({});
  const [showFollowersSheet, setShowFollowersSheet] = useState(false);
  const [showFollowingSheet, setShowFollowingSheet] = useState(false);

  const { data: currentUserFollowing = [] } = useQuery<FollowingPlayer[]>({
    queryKey: ["/api/players", user?.playerId, "following"],
    enabled: isAuthenticated && !!user?.playerId,
  });

  const isOwnProfile = useMemo(() => {
    return user?.playerId === id;
  }, [user?.playerId, id]);

  const isFollowingPlayer = useMemo(() => {
    return currentUserFollowing.some(f => f.playerId === id);
  }, [currentUserFollowing, id]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('edit') === 'true' && player) {
      setIsEditDialogOpen(true);
      window.history.replaceState({}, '', `/players/${id}`);
    }
  }, [player, id]);

  useEffect(() => {
    if (player && isEditDialogOpen) {
      setEditForm({
        name: player.name,
        position: player.position as "Guard" | "Wing" | "Big",
        height: player.height || "",
        team: player.team || "",
        jerseyNumber: player.jerseyNumber || undefined,
        photoUrl: player.photoUrl || "",
        bannerUrl: player.bannerUrl || "",
        bio: player.bio || "",
      });
    }
  }, [player, isEditDialogOpen]);

  const handleSaveProfile = () => {
    updatePlayer(
      { id, updates: editForm },
      {
        onSuccess: () => {
          toast({
            title: "Profile Updated",
            description: "Your profile changes have been saved.",
          });
          setIsEditDialogOpen(false);
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to update profile. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handlePhotoUpload = async (file: { name: string; type: string }) => {
    const res = await fetch("/api/object-storage/put-presigned-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        objectDir: "public",
      }),
    });
    const data = await res.json();
    return {
      method: "PUT" as const,
      url: data.url,
      headers: { "Content-Type": file.type },
    };
  };

  const handlePhotoComplete = async (result: any) => {
    if (result.successful?.[0]) {
      const file = result.successful[0];
      const publicUrl = `/api/object-storage/public/${file.meta.name}`;
      setEditForm((prev) => ({ ...prev, photoUrl: publicUrl }));
      toast({ title: "Photo Uploaded", description: "Profile photo uploaded successfully." });
    }
  };

  const handleBannerComplete = async (result: any) => {
    if (result.successful?.[0]) {
      const file = result.successful[0];
      const publicUrl = `/api/object-storage/public/${file.meta.name}`;
      setEditForm((prev) => ({ ...prev, bannerUrl: publicUrl }));
      toast({ title: "Banner Uploaded", description: "Banner image uploaded successfully." });
    }
  };

  const handleShareProfile = async () => {
    const shareUrl = `${window.location.origin}/players/${id}/card`;
    const shareData = {
      title: `${player?.name} - Caliber Player Card`,
      text: `Check out my player card on Caliber!`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          copyToClipboard(shareUrl);
        }
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const handleShareGame = async (gameId: number, opponent: string, grade: string) => {
    const shareUrl = `${window.location.origin}/players/${id}/card?gameId=${gameId}`;
    const shareData = {
      title: `${player?.name} vs ${opponent} - ${grade}`,
      text: `Check out my game card on Caliber!`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          copyToClipboard(shareUrl);
        }
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied!",
      description: "Share link copied to clipboard",
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center">
        <h2 className="text-2xl font-display font-bold text-white mb-2">Player Not Found</h2>
        <Link href="/players" className="text-primary hover:underline">Return to Roster</Link>
      </div>
    );
  }

  const games = player.games || [];
  
  const avgPoints = games.length ? (games.reduce((acc, g) => acc + g.points, 0) / games.length).toFixed(1) : "—";
  const avgReb = games.length ? (games.reduce((acc, g) => acc + g.rebounds, 0) / games.length).toFixed(1) : "—";
  const avgAst = games.length ? (games.reduce((acc, g) => acc + g.assists, 0) / games.length).toFixed(1) : "—";
  const avgSteals = games.length ? (games.reduce((acc, g) => acc + g.steals, 0) / games.length).toFixed(1) : "—";
  const avgBlocks = games.length ? (games.reduce((acc, g) => acc + g.blocks, 0) / games.length).toFixed(1) : "—";
  const avgPER = games.length ? (games.reduce((acc, g) => acc + g.points + g.rebounds + g.assists, 0) / games.length).toFixed(1) : "—";
  
  const totalFgMade = games.reduce((acc, g) => acc + (g.fgMade || 0), 0);
  const totalFgAttempted = games.reduce((acc, g) => acc + (g.fgAttempted || 0), 0);
  const fgPercent = totalFgAttempted > 0 ? ((totalFgMade / totalFgAttempted) * 100).toFixed(1) : "—";
  
  const totalThreeMade = games.reduce((acc, g) => acc + (g.threeMade || 0), 0);
  const totalThreeAttempted = games.reduce((acc, g) => acc + (g.threeAttempted || 0), 0);
  const threePercent = totalThreeAttempted > 0 ? ((totalThreeMade / totalThreeAttempted) * 100).toFixed(1) : "—";
  
  const totalFtMade = games.reduce((acc, g) => acc + (g.ftMade || 0), 0);
  const totalFtAttempted = games.reduce((acc, g) => acc + (g.ftAttempted || 0), 0);
  const ftPercent = totalFtAttempted > 0 ? ((totalFtMade / totalFtAttempted) * 100).toFixed(1) : "—";
  
  const averageGrade = getAverageGrade(games);
  
  const topGames = [...games]
    .sort((a, b) => getGradeValue(b.grade) - getGradeValue(a.grade))
    .slice(0, 5);
  
  const trendData = [...games]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(g => ({
      date: format(new Date(g.date), 'MM/dd'),
      points: g.points,
      gradeVal: getGradeValue(g.grade),
      grade: g.grade
    }))
    .slice(-10);

  const sortedGames = [...games].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const displayedGames = showAllGames ? sortedGames : sortedGames.slice(0, 5);

  const avgHustle = games.length ? games.reduce((acc, g) => acc + (g.hustleScore || 50), 0) / games.length : 50;
  const avgDefense = games.length ? games.reduce((acc, g) => acc + (g.defenseRating || 50), 0) / games.length : 50;
  
  const scoringRating = games.length 
    ? Math.min(100, (parseFloat(avgPoints) / 25) * 100) 
    : 0;
  const reboundingRating = games.length 
    ? Math.min(100, (parseFloat(avgReb) / 10) * 100) 
    : 0;
  const playmakingRating = games.length 
    ? Math.min(100, (parseFloat(avgAst) / 8) * 100) 
    : 0;
  const defenseRating = avgDefense;
  const hustleRating = avgHustle;
  const efficiencyRating = fgPercent !== "—" 
    ? Math.min(100, (parseFloat(fgPercent) / 60) * 100) 
    : 50;

  const radarData = [
    { category: 'Scoring', value: Math.round(scoringRating), fullMark: 100 },
    { category: 'Rebounding', value: Math.round(reboundingRating), fullMark: 100 },
    { category: 'Playmaking', value: Math.round(playmakingRating), fullMark: 100 },
    { category: 'Defense', value: Math.round(defenseRating), fullMark: 100 },
    { category: 'Hustle', value: Math.round(hustleRating), fullMark: 100 },
    { category: 'Efficiency', value: Math.round(efficiencyRating), fullMark: 100 },
  ];

  const strengths = [...radarData].sort((a, b) => b.value - a.value).slice(0, 2);
  const weaknesses = [...radarData].sort((a, b) => a.value - b.value).slice(0, 2);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <Link href="/players" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-white transition-colors uppercase tracking-wider">
        <ArrowLeft className="w-4 h-4" /> Back to Roster
      </Link>
      
      <Card className="p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 bg-primary/3 rounded-full blur-2xl" />

        <div className="flex flex-col lg:flex-row gap-6 relative z-10">
          <div className="flex items-start gap-5">
            <div className="relative group/avatar">
              <Avatar className="w-20 h-20 md:w-28 md:h-28 border-4 border-primary/20">
                {player.photoUrl && <AvatarImage src={player.photoUrl} alt={player.name} />}
                <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-2xl md:text-4xl font-display font-bold text-white">
                  {getInitials(player.name)}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                onClick={() => setIsEditDialogOpen(true)}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity"
                data-testid="button-edit-profile-avatar"
              >
                <Pencil className="w-3 h-3" />
              </Button>
            </div>
            
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {player.jerseyNumber && (
                  <span className="text-3xl md:text-4xl font-display font-bold text-primary/80">#{player.jerseyNumber}</span>
                )}
                <span className="bg-primary/20 text-primary px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border border-primary/20">
                  {player.position}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-display font-bold text-white uppercase tracking-tight leading-none mb-3">
                {player.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {player.height && (
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" /> {player.height}
                  </span>
                )}
                {player.team && (
                  <span className="font-medium">{player.team}</span>
                )}
                <span>{games.length} Games Tracked</span>
              </div>
              {isAuthenticated && (
                <div className="mt-4">
                  <FollowStats 
                    playerId={id} 
                    onFollowersClick={() => setShowFollowersSheet(true)}
                    onFollowingClick={() => setShowFollowingSheet(true)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center lg:items-end gap-4 lg:ml-auto">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Overall Grade</span>
              <GradeBadge grade={averageGrade} size="xl" />
            </div>
            
            <div className="flex flex-wrap gap-3">
              {isAuthenticated && !isOwnProfile && (
                <FollowButton 
                  playerId={id} 
                  initialIsFollowing={isFollowingPlayer}
                />
              )}
              {isOwnProfile && (
                <Button 
                  onClick={() => setIsEditDialogOpen(true)} 
                  variant="outline" 
                  className="gap-2"
                  data-testid="button-edit-profile"
                >
                  <Pencil className="w-4 h-4" /> Edit Profile
                </Button>
              )}
              <Button 
                onClick={handleShareProfile} 
                variant="outline" 
                className="gap-2"
                data-testid="button-share-profile"
              >
                <Share2 className="w-4 h-4" /> Share Profile
              </Button>
              {isOwnProfile && (
                <Link href={`/analyze?playerId=${player.id}`}>
                  <Button className="gap-2" data-testid="button-log-game">
                    <Plus className="w-4 h-4" /> Log Game
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </Card>

      {games.length > 0 && (
        <PlayerArchetype 
          games={games} 
          position={player.position as "Guard" | "Wing" | "Big"}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <PlayerProgression playerId={player.id} />
        
        <Card className="p-4">
          <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> XP Rewards
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center justify-between p-2 rounded bg-secondary/30">
              <span className="text-muted-foreground">Log a Game</span>
              <span className="font-bold text-primary">+50 XP</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-secondary/30">
              <span className="text-muted-foreground">Earn Badge</span>
              <span className="font-bold text-primary">+25 XP</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-secondary/30">
              <span className="text-muted-foreground">A Grade</span>
              <span className="font-bold text-primary">+30 XP</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-secondary/30">
              <span className="text-muted-foreground">A+ Grade</span>
              <span className="font-bold text-primary">+50 XP</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-orange-500/10 border border-orange-500/20">
              <span className="text-orange-400">3-Day Streak</span>
              <span className="font-bold text-orange-400">+25 XP</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-orange-500/10 border border-orange-500/20">
              <span className="text-orange-400">7-Day Streak</span>
              <span className="font-bold text-orange-400">+75 XP</span>
            </div>
          </div>
        </Card>
      </div>

      <SkillBadges playerId={player.id} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h3 className="text-lg font-bold font-display text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" /> Season Statistics
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <StatCard label="Games" value={games.length} />
            <StatCard label="PPG" value={avgPoints} highlight={true} />
            <StatCard label="RPG" value={avgReb} />
            <StatCard label="APG" value={avgAst} />
            <StatCard label="PER" value={avgPER} highlight={true} />
            <StatCard label="SPG" value={avgSteals} />
            <StatCard label="BPG" value={avgBlocks} />
            <StatCard label="FG%" value={fgPercent !== "—" ? `${fgPercent}%` : "—"} />
            <StatCard label="3P%" value={threePercent !== "—" ? `${threePercent}%` : "—"} />
            <StatCard label="FT%" value={ftPercent !== "—" ? `${ftPercent}%` : "—"} />
            <div className="glass-card rounded-xl p-5 flex flex-col justify-between relative overflow-hidden group hover:border-primary/30 transition-colors duration-300">
              <span className="stat-label text-muted-foreground/80">Avg Grade</span>
              <div className="flex items-center justify-center mt-2">
                <GradeBadge grade={averageGrade} size="md" />
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold font-display text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Player Profile
          </h3>
          <Card className="p-4">
            <div className="h-[220px] w-full">
              {games.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis 
                      dataKey="category" 
                      tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                    />
                    <PolarRadiusAxis 
                      angle={30} 
                      domain={[0, 100]} 
                      tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                      tickCount={4}
                    />
                    <Radar
                      name="Rating"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  No data yet
                </div>
              )}
            </div>
            {games.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mt-2 pt-3 border-t border-white/5">
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Strengths</span>
                  {strengths.map((s, i) => (
                    <div key={i} className="text-xs font-medium text-green-400 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      {s.category} ({s.value})
                    </div>
                  ))}
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Areas to Improve</span>
                  {weaknesses.map((w, i) => (
                    <div key={i} className="text-xs font-medium text-amber-400 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      {w.category} ({w.value})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
            <Medal className="w-5 h-5 text-primary" /> Top 5 Games
          </h3>
        </div>
        
        {topGames.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground text-sm">No games logged yet. Log your first game to see your top performances!</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {topGames.map((game, index) => (
              <Collapsible 
                key={game.id}
                open={expandedGameId === game.id}
                onOpenChange={(open) => setExpandedGameId(open ? game.id : null)}
              >
                <Card 
                  className="relative overflow-hidden"
                  data-testid={`card-top-game-${game.id}`}
                >
                  {index === 0 && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                  )}
                  <CollapsibleTrigger asChild>
                    <div className="p-4 cursor-pointer hover-elevate flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary/50 text-muted-foreground font-bold text-sm">
                        #{index + 1}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-white">vs {game.opponent}</span>
                          {index === 0 && (
                            <span className="text-xs font-bold text-primary bg-primary/20 px-2 py-0.5 rounded">Best Game</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(game.date), 'MMMM dd, yyyy')}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 sm:gap-6">
                        <div className="hidden sm:flex gap-4 text-sm font-medium text-white/80">
                          <span><span className="text-muted-foreground text-xs">PTS</span> {game.points}</span>
                          <span><span className="text-muted-foreground text-xs">REB</span> {game.rebounds}</span>
                          <span><span className="text-muted-foreground text-xs">AST</span> {game.assists}</span>
                          <span className="text-primary"><span className="text-primary/60 text-xs">PER</span> {game.points + game.rebounds + game.assists}</span>
                        </div>
                        <GradeBadge grade={game.grade || "-"} size="sm" />
                        <ChevronDown className={cn(
                          "w-4 h-4 text-muted-foreground transition-transform",
                          expandedGameId === game.id && "rotate-180"
                        )} />
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="px-4 pb-4 pt-2 border-t border-white/5">
                      <div className="grid grid-cols-3 sm:grid-cols-7 gap-4">
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">Points</div>
                          <div className="text-lg font-bold text-white">{game.points}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">Rebounds</div>
                          <div className="text-lg font-bold text-white">{game.rebounds}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">Assists</div>
                          <div className="text-lg font-bold text-white">{game.assists}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-primary/60 mb-1">PER</div>
                          <div className="text-lg font-bold text-primary">{game.points + game.rebounds + game.assists}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">Steals</div>
                          <div className="text-lg font-bold text-white">{game.steals}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">Blocks</div>
                          <div className="text-lg font-bold text-white">{game.blocks}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">Minutes</div>
                          <div className="text-lg font-bold text-white">{game.minutes}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/5">
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">FG</div>
                          <div className="text-sm font-medium text-white">
                            {game.fgMade}/{game.fgAttempted}
                            <span className="text-muted-foreground ml-1">
                              ({game.fgAttempted ? ((game.fgMade / game.fgAttempted) * 100).toFixed(0) : 0}%)
                            </span>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">3PT</div>
                          <div className="text-sm font-medium text-white">
                            {game.threeMade}/{game.threeAttempted}
                            <span className="text-muted-foreground ml-1">
                              ({game.threeAttempted ? ((game.threeMade / game.threeAttempted) * 100).toFixed(0) : 0}%)
                            </span>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">FT</div>
                          <div className="text-sm font-medium text-white">
                            {game.ftMade}/{game.ftAttempted}
                            <span className="text-muted-foreground ml-1">
                              ({game.ftAttempted ? ((game.ftMade / game.ftAttempted) * 100).toFixed(0) : 0}%)
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {game.feedback && (
                        <div className="mt-4 pt-4 border-t border-white/5">
                          <div className="text-xs text-muted-foreground mb-2">Coach Notes</div>
                          <p className="text-sm text-white/80">{game.feedback}</p>
                        </div>
                      )}
                      
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <SocialEngagement gameId={game.id} />
                      </div>
                      
                      <div className="flex justify-end gap-2 mt-4">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleShareGame(game.id, game.opponent, game.grade || "")}
                          className="gap-1"
                          data-testid={`button-share-top-game-${game.id}`}
                        >
                          <Share2 className="w-3.5 h-3.5" /> Share
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <GoalsPanel playerId={player.id} games={games} />
        </div>
        
        <div className="lg:col-span-2">
          <Card className="p-6 h-full">
            <h3 className="text-lg font-bold font-display text-white mb-6 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" /> Badges & Awards
            </h3>
            
            {badgesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : badges.length === 0 ? (
              <div className="text-muted-foreground text-sm text-center py-8">
                No badges earned yet. Keep playing to unlock achievements!
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {badges.map((badge: Badge) => {
                  const BadgeIcon = BADGE_ICONS[badge.badgeType] || Award;
                  const badgeDef = BADGE_DEFINITIONS[badge.badgeType as keyof typeof BADGE_DEFINITIONS];
                  const badgeName = badgeDef?.name || badge.badgeType;
                  const badgeDesc = badgeDef?.description || "";
                  
                  return (
                    <div
                      key={badge.id}
                      data-testid={`badge-${badge.badgeType}-${badge.id}`}
                      className="group bg-secondary/20 hover:bg-secondary/40 border border-white/5 p-4 rounded-xl transition-colors flex flex-col items-center text-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <BadgeIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-sm font-bold text-white mb-1">{badgeName}</div>
                      <div className="text-xs text-muted-foreground mb-2 line-clamp-2">{badgeDesc}</div>
                      <div className="text-xs text-muted-foreground/70 mt-auto">
                        {badge.earnedAt ? format(new Date(badge.earnedAt), 'MMM dd, yyyy') : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Tabs defaultValue="trend" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="trend" className="gap-2" data-testid="tab-performance-trend">
            <Activity className="w-4 h-4" /> Performance Trend
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2" data-testid="tab-game-history">
            <ClipboardList className="w-4 h-4" /> Game History
          </TabsTrigger>
          <TabsTrigger value="coach" className="gap-2" data-testid="tab-coach-tools">
            <Dumbbell className="w-4 h-4" /> Coach Tools
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="trend">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> Performance Trend
              </h3>
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-primary" /> Points</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-white/20" /> Grade Score</div>
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="rgba(255,255,255,0.3)" 
                      tick={{fill: 'rgba(255,255,255,0.3)', fontSize: 12}} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      yAxisId="left"
                      stroke="rgba(255,255,255,0.3)" 
                      tick={{fill: 'rgba(255,255,255,0.3)', fontSize: 12}} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      domain={[0, 100]} 
                      hide 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="points" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4}}
                      activeDot={{r: 6, fill: '#fff'}}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="gradeVal" 
                      stroke="rgba(255,255,255,0.2)" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  No game data available for trends.
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" /> Game History
              </h3>
              {games.length > 5 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowAllGames(!showAllGames)}
                  className="text-xs gap-1"
                  data-testid="button-view-all-games"
                >
                  {showAllGames ? "Show Less" : `View All (${games.length})`}
                  <ChevronRight className={cn("w-3 h-3 transition-transform", showAllGames && "rotate-90")} />
                </Button>
              )}
            </div>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {games.length === 0 ? (
                <div className="text-muted-foreground text-sm text-center py-10">No games logged yet.</div>
              ) : (
                displayedGames.map(game => (
                  <div key={game.id} className="bg-secondary/20 hover:bg-secondary/40 border border-white/5 p-4 rounded-xl transition-colors group">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-0.5">
                          {format(new Date(game.date), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-sm font-bold text-white truncate max-w-[120px]">
                          vs {game.opponent}
                        </div>
                      </div>
                      <GradeBadge grade={game.grade || "-"} size="sm" />
                    </div>
                    
                    <div className="flex justify-between items-end border-t border-white/5 pt-3 mt-1">
                      <div className="flex items-center gap-4">
                        <div className="flex gap-3 text-xs font-medium text-white/80">
                          <span><span className="text-muted-foreground">PTS</span> {game.points}</span>
                          <span><span className="text-muted-foreground">REB</span> {game.rebounds}</span>
                          <span><span className="text-muted-foreground">AST</span> {game.assists}</span>
                          <span className="text-primary"><span className="text-primary/60">PER</span> {game.points + game.rebounds + game.assists}</span>
                        </div>
                        <SocialEngagement gameId={game.id} compact />
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleShareGame(game.id, game.opponent, game.grade || "")}
                          className="text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100 p-1"
                          data-testid={`button-share-game-${game.id}`}
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1" data-testid={`button-delete-game-${game.id}`}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-card border-white/10 text-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Game Log?</AlertDialogTitle>
                              <AlertDialogDescription className="text-muted-foreground">
                                This will permanently remove this game and affect the player's averages.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-secondary text-white hover:bg-secondary/80 border-transparent">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteGame(game.id)} className="bg-red-500 hover:bg-red-600 text-white font-bold">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="coach">
          <CoachToolsSection playerId={player.id} games={games} />
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-white/10 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display uppercase tracking-wide">Edit Profile</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update your player profile and upload photos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-primary/20">
                  {editForm.photoUrl && <AvatarImage src={editForm.photoUrl} alt="Profile" />}
                  <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-2xl font-display font-bold text-white">
                    {editForm.name ? getInitials(editForm.name) : "?"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex gap-2">
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={5242880}
                  onGetUploadParameters={handlePhotoUpload}
                  onComplete={handlePhotoComplete}
                  buttonClassName="gap-2"
                >
                  <Camera className="w-4 h-4" /> Upload Photo
                </ObjectUploader>
                {editForm.photoUrl && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setEditForm((prev) => ({ ...prev, photoUrl: "" }))}
                    data-testid="button-remove-photo"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Full Name</label>
                <Input
                  value={editForm.name || ""}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="LeBron James"
                  className="bg-secondary/30 border-white/10 text-white placeholder:text-white/20"
                  data-testid="input-edit-name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Position</label>
                  <Select
                    value={editForm.position}
                    onValueChange={(val) => setEditForm((prev) => ({ ...prev, position: val as "Guard" | "Wing" | "Big" }))}
                  >
                    <SelectTrigger className="bg-secondary/30 border-white/10 text-white" data-testid="select-edit-position">
                      <SelectValue placeholder="Position" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/10 text-white">
                      <SelectItem value="Guard">Guard</SelectItem>
                      <SelectItem value="Wing">Wing</SelectItem>
                      <SelectItem value="Big">Big</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Jersey #</label>
                  <Input
                    type="number"
                    value={editForm.jerseyNumber || ""}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, jerseyNumber: e.target.value ? Number(e.target.value) : undefined }))}
                    placeholder="23"
                    className="bg-secondary/30 border-white/10 text-white placeholder:text-white/20"
                    data-testid="input-edit-jersey"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Height</label>
                  <Input
                    value={editForm.height || ""}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, height: e.target.value }))}
                    placeholder="6'8"
                    className="bg-secondary/30 border-white/10 text-white placeholder:text-white/20"
                    data-testid="input-edit-height"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Team</label>
                  <Input
                    value={editForm.team || ""}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, team: e.target.value }))}
                    placeholder="Lakers"
                    className="bg-secondary/30 border-white/10 text-white placeholder:text-white/20"
                    data-testid="input-edit-team"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Bio</label>
                <Textarea
                  value={editForm.bio || ""}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself as a player..."
                  rows={3}
                  className="bg-secondary/30 border-white/10 text-white placeholder:text-white/20 resize-none"
                  data-testid="textarea-edit-bio"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Banner Image</label>
                <div className="flex gap-2">
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={10485760}
                    onGetUploadParameters={handlePhotoUpload}
                    onComplete={handleBannerComplete}
                    buttonClassName="gap-2 flex-1"
                  >
                    <Upload className="w-4 h-4" /> Upload Banner
                  </ObjectUploader>
                  {editForm.bannerUrl && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setEditForm((prev) => ({ ...prev, bannerUrl: "" }))}
                      data-testid="button-remove-banner"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {editForm.bannerUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-white/10">
                    <img src={editForm.bannerUrl} alt="Banner preview" className="w-full h-24 object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={isUpdating} data-testid="button-save-profile">
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={showFollowersSheet} onOpenChange={setShowFollowersSheet}>
        <SheetContent className="bg-background border-l border-white/10">
          <SheetHeader>
            <SheetTitle className="font-display text-xl text-white uppercase tracking-wider">
              Followers
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <FollowersList playerId={id} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showFollowingSheet} onOpenChange={setShowFollowingSheet}>
        <SheetContent className="bg-background border-l border-white/10">
          <SheetHeader>
            <SheetTitle className="font-display text-xl text-white uppercase tracking-wider">
              Following
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <FollowingList playerId={id} showUnfollowButton={isOwnProfile} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
