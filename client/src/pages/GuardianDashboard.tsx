import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GuardianLinkManager } from "@/components/GuardianLinkManager";
import { PlatformExportModal } from "@/components/PlatformExportModal";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Flame,
  Star,
  Target,
  Gamepad2,
  Users,
  Heart,
  ChevronRight,
  Share2,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import type { Game, Badge as BadgeType } from "@shared/schema";

interface LinkedPlayer {
  link: {
    id: number;
    guardianUserId: string;
    playerId: number;
    relationship: string;
    status: string;
    linkedAt: string | null;
    approvedAt: string | null;
  };
  player: {
    id: number;
    name: string;
    sport: string;
    position: string;
    team: string | null;
    photoUrl: string | null;
    totalXp: number;
    currentTier: string;
  };
}

interface DashboardData {
  player: {
    id: number;
    name: string;
    sport: string;
    position: string;
    team: string | null;
    photoUrl: string | null;
    totalXp: number;
    currentTier: string;
  };
  recentGames: Game[];
  badges: BadgeType[];
  streaks: Array<{ streakType: string; currentCount: number; bestCount: number }>;
  milestones: Array<{ type: string; title: string; description: string; date: string }>;
  goals: Array<{ id: number; title: string; completed: boolean }>;
  gamesThisSeason: number;
  gradeTrend: string;
  currentGrade: string | null;
}

const TIER_COLORS: Record<string, string> = {
  Rookie: "text-muted-foreground",
  Starter: "text-blue-500",
  "All-Star": "text-purple-500",
  MVP: "text-yellow-500",
  "Hall of Fame": "text-accent",
};

function GradeTrendIcon({ trend }: { trend: string }) {
  if (trend === "up") return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (trend === "down") return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
}

function PlayerDashboardCard({ playerId }: { playerId: number }) {
  const [showExport, setShowExport] = useState(false);

  const { data, isLoading, isError } = useQuery<DashboardData>({
    queryKey: ["/api/guardian/players", playerId, "dashboard"],
  });

  if (isLoading) {
    return (
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="w-14 h-14 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-sm" data-testid="text-dashboard-error">
          Unable to load dashboard data for this player.
        </p>
      </Card>
    );
  }

  const { player, recentGames, badges, streaks, milestones, goals, gamesThisSeason, gradeTrend, currentGrade } = data;
  const activeStreaks = streaks.filter((s) => s.currentCount > 0);

  return (
    <Card className="p-5 space-y-5" data-testid={`card-guardian-player-${player.id}`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Avatar className="w-14 h-14 border-2 border-border">
            <AvatarImage src={player.photoUrl || undefined} alt={player.name} />
            <AvatarFallback className="text-lg font-bold">
              {player.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <Link href={`/players/${player.id}`}>
              <h3
                className="text-lg font-bold font-display tracking-wide hover:text-accent transition-colors cursor-pointer"
                data-testid={`text-player-name-${player.id}`}
              >
                {player.name}
              </h3>
            </Link>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">{player.position}</span>
              {player.team && (
                <>
                  <span className="text-muted-foreground/40">|</span>
                  <span className="text-sm text-muted-foreground">{player.team}</span>
                </>
              )}
              <Badge variant="secondary" className="text-xs" data-testid={`badge-tier-${player.id}`}>
                <Star className={cn("w-3 h-3 mr-1", TIER_COLORS[player.currentTier])} />
                {player.currentTier}
              </Badge>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowExport(true)}
          data-testid={`button-share-${player.id}`}
        >
          <Share2 className="w-4 h-4 mr-1" />
          Share
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg bg-secondary/30 p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className="text-2xl font-bold font-display" data-testid={`text-grade-${player.id}`}>
              {currentGrade || "—"}
            </span>
            <GradeTrendIcon trend={gradeTrend} />
          </div>
          <p className="text-xs text-muted-foreground">Current Grade</p>
        </div>
        <div className="rounded-lg bg-secondary/30 p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-2xl font-bold font-display" data-testid={`text-xp-${player.id}`}>
              {player.totalXp.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Total XP</p>
        </div>
        <div className="rounded-lg bg-secondary/30 p-3 text-center">
          <span className="text-2xl font-bold font-display" data-testid={`text-games-${player.id}`}>
            {gamesThisSeason}
          </span>
          <p className="text-xs text-muted-foreground">Games This Season</p>
        </div>
        <div className="rounded-lg bg-secondary/30 p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-2xl font-bold font-display" data-testid={`text-streak-${player.id}`}>
              {activeStreaks.length > 0 ? activeStreaks[0].currentCount : 0}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Active Streak</p>
        </div>
      </div>

      {recentGames.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Recent Games</h4>
          <div className="space-y-2">
            {recentGames.slice(0, 3).map((game) => (
              <div
                key={game.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-secondary/20 px-3 py-2"
                data-testid={`row-game-${game.id}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Gamepad2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-medium truncate">vs {game.opponent}</span>
                  <span className="text-xs text-muted-foreground">{game.date}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {game.result && (
                    <Badge
                      variant={game.result.startsWith("W") ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {game.result.split(" ")[0]}
                    </Badge>
                  )}
                  {game.grade && (
                    <Badge variant="outline" className="text-xs font-bold">
                      {game.grade}
                    </Badge>
                  )}
                  {game.sport === "basketball" && (
                    <span className="text-xs text-muted-foreground">
                      {game.points}pts {game.rebounds}reb {game.assists}ast
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {milestones.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Recent Milestones
          </h4>
          <div className="space-y-1.5">
            {milestones.slice(0, 5).map((milestone, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-sm"
                data-testid={`milestone-${i}`}
              >
                <Trophy className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                <span className="font-medium">{milestone.title}</span>
                {milestone.date && (
                  <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                    {milestone.date}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {badges.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Badges ({badges.length})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {badges.slice(0, 8).map((badge) => (
              <Badge key={badge.id} variant="secondary" className="text-xs" data-testid={`badge-${badge.id}`}>
                <Trophy className="w-3 h-3 mr-1" />
                {badge.badgeType.replace(/_/g, " ")}
              </Badge>
            ))}
            {badges.length > 8 && (
              <Badge variant="outline" className="text-xs">+{badges.length - 8} more</Badge>
            )}
          </div>
        </div>
      )}

      {goals.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Goals</h4>
          <div className="space-y-1">
            {goals.slice(0, 4).map((goal) => (
              <div key={goal.id} className="flex items-center gap-2 text-sm" data-testid={`goal-${goal.id}`}>
                <Target className={cn("w-4 h-4 flex-shrink-0", goal.completed ? "text-green-500" : "text-muted-foreground")} />
                <span className={cn(goal.completed && "line-through text-muted-foreground")}>{goal.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link href={`/players/${player.id}`}>
        <Button variant="outline" className="w-full" data-testid={`button-view-profile-${player.id}`}>
          View Full Profile
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </Link>

      <PlatformExportModal
        open={showExport}
        onOpenChange={setShowExport}
        playerName={player.name}
      >
        <div className="bg-gradient-to-br from-background to-secondary/50 p-6 rounded-lg text-center space-y-3">
          <h3 className="text-xl font-bold font-display">{player.name}</h3>
          <p className="text-sm text-muted-foreground">{player.position} | {player.team || "Free Agent"}</p>
          <div className="flex items-center justify-center gap-4">
            <div>
              <p className="text-3xl font-bold">{currentGrade || "—"}</p>
              <p className="text-xs text-muted-foreground">Grade</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{player.totalXp.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">XP</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{gamesThisSeason}</p>
              <p className="text-xs text-muted-foreground">Games</p>
            </div>
          </div>
          <Badge>{player.currentTier}</Badge>
        </div>
      </PlatformExportModal>
    </Card>
  );
}

export default function GuardianDashboard() {
  const { data: linkedPlayers, isLoading } = useQuery<LinkedPlayer[]>({
    queryKey: ["/api/guardian/players"],
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto" data-testid="guardian-dashboard">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Heart className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold uppercase tracking-tight text-foreground" data-testid="text-family-title">
              Family Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              {linkedPlayers?.length || 0} linked {(linkedPlayers?.length || 0) === 1 ? "player" : "players"}
            </p>
          </div>
        </div>
      </div>

      <GuardianLinkManager mode="guardian" />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="w-14 h-14 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : linkedPlayers && linkedPlayers.length > 0 ? (
        <div className="space-y-4">
          {linkedPlayers.map(({ link, player }) => (
            <PlayerDashboardCard key={link.id} playerId={player.id} />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center" data-testid="empty-guardian-dashboard">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-accent/60" />
          </div>
          <h3 className="text-lg font-bold mb-2">No Linked Players Yet</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Use an invite code from your player to link their profile and start tracking their progress here.
          </p>
        </Card>
      )}
    </div>
  );
}
