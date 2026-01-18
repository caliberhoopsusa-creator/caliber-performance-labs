import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FollowButton } from "@/components/FollowButton";
import { Search, Users, UserPlus, Activity, Target, Award, Flame } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface Player {
  id: number;
  name: string;
  position: string;
  team: string | null;
  height: string | null;
  jerseyNumber: number | null;
}

interface FollowStats {
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

interface PlayerWithStats extends Player {
  followStats?: FollowStats;
  recentActivity?: {
    type: string;
    description: string;
  };
}

const ACTIVITY_ICONS: Record<string, typeof Target> = {
  game: Target,
  badge: Award,
  streak: Flame,
  default: Activity,
};

function PlayerSkeleton() {
  return (
    <Card className="p-4" data-testid="skeleton-player">
      <div className="flex items-center gap-4">
        <Skeleton className="w-14 h-14 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
    </Card>
  );
}

function PlayerCard({ player }: { player: PlayerWithStats }) {
  const { data: followStats } = useQuery<FollowStats>({
    queryKey: ["/api/players", player.id, "follow-stats"],
  });

  const initials = player.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const ActivityIcon = player.recentActivity
    ? ACTIVITY_ICONS[player.recentActivity.type] || ACTIVITY_ICONS.default
    : null;

  return (
    <Card
      className="p-4 relative overflow-hidden transition-all duration-300 hover-elevate group"
      data-testid={`card-player-${player.id}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative z-10 flex items-center gap-4">
        <Link href={`/players/${player.id}`}>
          <Avatar className="w-14 h-14 border-2 border-white/10 cursor-pointer hover:border-primary/50 transition-colors">
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary text-white font-display font-bold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          <Link href={`/players/${player.id}`}>
            <h3
              className="text-base font-bold text-white leading-tight mb-0.5 truncate hover:text-primary transition-colors cursor-pointer"
              data-testid={`text-player-name-${player.id}`}
            >
              {player.name}
            </h3>
          </Link>

          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge
              variant="secondary"
              className="text-xs"
              data-testid={`badge-position-${player.id}`}
            >
              {player.position}
            </Badge>
            {player.team && (
              <span className="text-xs text-muted-foreground truncate">
                {player.team}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span
              className="flex items-center gap-1"
              data-testid={`text-followers-${player.id}`}
            >
              <Users className="w-3 h-3" />
              {followStats?.followersCount ?? 0} followers
            </span>
            {player.recentActivity && ActivityIcon && (
              <span className="flex items-center gap-1 text-primary/80">
                <ActivityIcon className="w-3 h-3" />
                {player.recentActivity.description}
              </span>
            )}
          </div>
        </div>

        <FollowButton
          playerId={player.id}
          initialIsFollowing={followStats?.isFollowing ?? false}
          className="shrink-0"
          data-testid={`button-follow-${player.id}`}
        />
      </div>
    </Card>
  );
}

export default function SocialHub() {
  const [search, setSearch] = useState("");

  const { data: players, isLoading, error } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const filteredPlayers = players?.filter(
    (player) =>
      player.name.toLowerCase().includes(search.toLowerCase()) ||
      player.position.toLowerCase().includes(search.toLowerCase()) ||
      player.team?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="space-y-6 animate-in fade-in duration-500"
      data-testid="page-social-hub"
    >
      <div>
        <h2 className="text-3xl md:text-4xl font-display font-bold text-white uppercase tracking-tight">
          Discover Players
        </h2>
        <p className="text-muted-foreground font-medium mt-1">
          Find and follow players to see their updates in your feed
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input
          type="text"
          placeholder="Search players by name, position, or team..."
          className="w-full bg-card border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-muted-foreground"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-players"
        />
      </div>

      <div className="space-y-3" data-testid="container-players">
        {isLoading ? (
          <>
            <PlayerSkeleton />
            <PlayerSkeleton />
            <PlayerSkeleton />
            <PlayerSkeleton />
            <PlayerSkeleton />
          </>
        ) : error ? (
          <Card className="p-8 text-center" data-testid="error-container">
            <p className="text-muted-foreground">Failed to load players</p>
          </Card>
        ) : filteredPlayers && filteredPlayers.length > 0 ? (
          filteredPlayers.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))
        ) : (
          <Card className="p-8 text-center" data-testid="empty-container">
            <div className="flex flex-col items-center gap-3">
              <UserPlus className="w-12 h-12 text-muted-foreground/50" />
              <div>
                <p className="text-white font-medium mb-1">No players found</p>
                <p className="text-sm text-muted-foreground">
                  {search
                    ? "Try adjusting your search terms"
                    : "Players will appear here when they join the platform"}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
