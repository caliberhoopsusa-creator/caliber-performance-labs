import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FollowButton } from "@/components/FollowButton";
import {
  Search,
  TrendingUp,
  Users,
  Trophy,
  Compass,
  Flame,
  Clock,
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

interface Player {
  id: number;
  name: string;
  username?: string | null;
  position: string;
  team: string | null;
  sport?: string;
  height: string | null;
  jerseyNumber: number | null;
}

interface LeaderboardEntry {
  playerId: number;
  playerName: string;
  position?: string;
  sport?: string;
  totalPoints?: number;
  gamesPlayed?: number;
  [key: string]: unknown;
}

interface FollowStats {
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

interface FollowingEntry {
  id: number;
  followeePlayerId: number;
  [key: string]: unknown;
}

interface FeedActivity {
  id: number;
  activityType: string;
  playerId: number | null;
  headline: string;
  subtext: string | null;
  playerName?: string;
  createdAt: string;
  reactionCount?: number;
}

function getInitials(name: string | undefined | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function TrendingPlayerCard({ entry }: { entry: LeaderboardEntry }) {
  const initials = getInitials(entry.playerName);

  const { data: followStats } = useQuery<FollowStats>({
    queryKey: ["/api/players", entry.playerId, "follow-stats"],
  });

  return (
    <div
      className="flex-shrink-0 w-48 p-4 rounded-xl border border-white/10 bg-gradient-to-br from-[hsl(220,25%,10%)] to-[hsl(220,25%,7%)] space-y-3"
      data-testid={`card-trending-player-${entry.playerId}`}
    >
      <div className="flex flex-col items-center text-center gap-2">
        <Link href={`/players/${entry.playerId}`}>
          <Avatar className="w-14 h-14 border-2 border-white/10 cursor-pointer">
            <AvatarFallback className="bg-gradient-to-br from-accent/20 to-secondary text-white font-bold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 w-full">
          <Link href={`/players/${entry.playerId}`}>
            <p
              className="text-sm font-semibold text-white truncate cursor-pointer"
              data-testid={`text-trending-name-${entry.playerId}`}
            >
              {entry.playerName}
            </p>
          </Link>
          {entry.position && (
            <Badge variant="secondary" className="mt-1 text-[10px]">
              {entry.position}
            </Badge>
          )}
          {entry.sport && (
            <p className="text-[10px] text-muted-foreground mt-1 capitalize">
              {entry.sport}
            </p>
          )}
        </div>
      </div>
      <FollowButton
        playerId={entry.playerId}
        initialIsFollowing={followStats?.isFollowing ?? false}
        className="w-full"
        data-testid={`button-follow-trending-${entry.playerId}`}
      />
    </div>
  );
}

function SuggestedPlayerCard({ player }: { player: Player }) {
  const initials = getInitials(player.name);

  const { data: followStats } = useQuery<FollowStats>({
    queryKey: ["/api/players", player.id, "follow-stats"],
  });

  return (
    <div
      className="p-4 rounded-xl border border-white/10 bg-gradient-to-br from-[hsl(220,25%,10%)] to-[hsl(220,25%,7%)]"
      data-testid={`card-suggested-player-${player.id}`}
    >
      <div className="flex items-center gap-3">
        <Link href={`/players/${player.id}`}>
          <Avatar className="w-12 h-12 border-2 border-white/10 cursor-pointer">
            <AvatarFallback className="bg-gradient-to-br from-accent/20 to-secondary text-white font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/players/${player.id}`}>
            <p
              className="text-sm font-semibold text-white truncate cursor-pointer"
              data-testid={`text-suggested-name-${player.id}`}
            >
              {player.name}
            </p>
          </Link>
          {player.username && (
            <p className="text-xs text-muted-foreground truncate" data-testid={`text-suggested-username-${player.id}`}>@{player.username}</p>
          )}
          <p className="text-xs text-muted-foreground truncate">
            {player.position}
            {player.team ? ` · ${player.team}` : ""}
          </p>
        </div>
        <FollowButton
          playerId={player.id}
          initialIsFollowing={followStats?.isFollowing ?? false}
          data-testid={`button-follow-suggested-${player.id}`}
        />
      </div>
    </div>
  );
}

export default function DiscoverContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  const { data: leaderboard = [], isLoading: isLeaderboardLoading } = useQuery<
    LeaderboardEntry[]
  >({
    queryKey: ["/api/analytics/leaderboard"],
  });

  const { data: allPlayers = [], isLoading: isPlayersLoading } = useQuery<
    Player[]
  >({
    queryKey: ["/api/players"],
  });

  const currentPlayerId = user?.playerId;

  const { data: followingList = [] } = useQuery<FollowingEntry[]>({
    queryKey: ["/api/players", currentPlayerId, "following"],
    enabled: !!currentPlayerId,
  });

  const { data: feedData, isLoading: isFeedLoading } = useQuery<{
    items: FeedActivity[];
    nextCursor?: number;
    hasMore: boolean;
  }>({
    queryKey: ["/api/feed?limit=10"],
  });

  const feedActivities = feedData?.items ?? [];

  const trendingPlayers = leaderboard.slice(0, 6);

  const followingIds = new Set(followingList.map((f) => f.followeePlayerId));
  const suggestedPlayers = allPlayers
    .filter(
      (p) =>
        p.id !== currentPlayerId &&
        !followingIds.has(p.id)
    )
    .slice(0, 6);

  const filteredPlayers = searchQuery.trim()
    ? allPlayers.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.username && p.username.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const topPerformances = [...feedActivities]
    .sort((a, b) => (b.reactionCount ?? 0) - (a.reactionCount ?? 0))
    .slice(0, 10);

  return (
    <div className="space-y-8" data-testid="page-discover">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 flex items-center justify-center">
          <Compass className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h2 className="text-xl font-display font-bold text-white tracking-wide">Discover</h2>
          <p className="text-xs text-muted-foreground">
            Find players, follow trends, and explore top performances
          </p>
        </div>
      </div>

      <div className="relative" data-testid="search-container">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search players by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card border-white/10"
          data-testid="input-search-players"
        />
      </div>

      {searchQuery.trim() && (
        <div className="space-y-3" data-testid="search-results">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Search Results ({filteredPlayers.length})
          </h3>
          {filteredPlayers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No players found matching "{searchQuery}"
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredPlayers.slice(0, 8).map((player) => (
                <SuggestedPlayerCard key={player.id} player={player} />
              ))}
            </div>
          )}
        </div>
      )}

      {!searchQuery.trim() && (
        <>
          <section data-testid="section-trending">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-display font-bold text-white tracking-wide">Trending Players</h3>
            </div>
            {isLeaderboardLoading ? (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-48 p-4 rounded-xl border border-white/10 animate-pulse space-y-3"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14 rounded-full bg-muted" />
                      <div className="h-4 bg-muted rounded w-24" />
                      <div className="h-3 bg-muted rounded w-16" />
                    </div>
                    <div className="h-9 bg-muted rounded w-full" />
                  </div>
                ))}
              </div>
            ) : trendingPlayers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No trending players yet
              </p>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {trendingPlayers.map((entry) => (
                  <TrendingPlayerCard key={entry.playerId} entry={entry} />
                ))}
              </div>
            )}
          </section>

          <section data-testid="section-suggested">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-display font-bold text-white tracking-wide">Suggested For You</h3>
            </div>
            {isPlayersLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="p-4 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                      <div className="h-9 bg-muted rounded w-20" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : suggestedPlayers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No suggestions available right now
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggestedPlayers.map((player) => (
                  <SuggestedPlayerCard key={player.id} player={player} />
                ))}
              </div>
            )}
          </section>

          <section data-testid="section-top-performances">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-display font-bold text-white tracking-wide">
                Top Performances This Week
              </h3>
            </div>
            {isFeedLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-4 animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </Card>
                ))}
              </div>
            ) : topPerformances.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No performances to show yet
              </p>
            ) : (
              <div className="space-y-3">
                {topPerformances.map((activity, index) => {
                  const initials = activity.playerName
                    ? getInitials(activity.playerName)
                    : "?";
                  return (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-gradient-to-br from-[hsl(220,25%,10%)] to-[hsl(220,25%,7%)]"
                      data-testid={`card-performance-${activity.id}`}
                    >
                      <span className="text-lg font-bold text-muted-foreground w-6 text-center">
                        {index + 1}
                      </span>
                      {activity.playerId ? (
                        <Link href={`/players/${activity.playerId}`}>
                          <Avatar className="w-9 h-9 border border-white/10 cursor-pointer shrink-0">
                            <AvatarFallback className="bg-gradient-to-br from-accent/20 to-secondary text-white text-xs font-bold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                      ) : (
                        <Avatar className="w-9 h-9 border border-white/10 shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-accent/20 to-secondary text-white text-xs font-bold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium text-white truncate"
                          data-testid={`text-performance-headline-${activity.id}`}
                        >
                          {activity.headline}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {activity.playerName && (
                            <span className="text-xs text-muted-foreground">
                              {activity.playerName}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(
                              new Date(activity.createdAt),
                              { addSuffix: true }
                            )}
                          </span>
                        </div>
                      </div>
                      {(activity.reactionCount ?? 0) > 0 && (
                        <Badge variant="secondary" className="shrink-0">
                          <Flame className="w-3 h-3 mr-1 text-accent" />
                          {activity.reactionCount}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
