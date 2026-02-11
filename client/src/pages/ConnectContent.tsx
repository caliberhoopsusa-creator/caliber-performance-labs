import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FollowButton } from "@/components/FollowButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, Users, UserPlus, Activity, Target, Award, Flame, 
  TrendingUp, Medal, Zap, Clock, BarChart2, Star, MessageCircle
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";

interface Player {
  id: number;
  name: string;
  position: string;
  team: string | null;
  height: string | null;
  jerseyNumber: number | null;
  lastActivityTime?: Date | null;
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

interface FeedActivity {
  id: number;
  activityType: string;
  playerId: number | null;
  gameId: number | null;
  badgeId: number | null;
  relatedId: number | null;
  headline: string;
  subtext: string | null;
  createdAt: string;
  playerName?: string;
}

const ACTIVITY_ICONS: Record<string, typeof Target> = {
  game: Target,
  badge: Award,
  streak: Flame,
  story: MessageCircle,
  default: Activity,
};

const ACTIVITY_COLORS: Record<string, string> = {
  game: "from-green-500/20 to-transparent",
  badge: "from-yellow-500/20 to-transparent",
  streak: "from-accent/20 to-transparent",
  story: "from-blue-500/20 to-transparent",
  default: "from-accent/20 to-transparent",
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

function FeedSkeleton() {
  return (
    <Card className="p-4" data-testid="skeleton-feed">
      <div className="flex gap-3">
        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-16 mt-2" />
        </div>
      </div>
    </Card>
  );
}

function FeedActivityCard({ activity }: { activity: FeedActivity }) {
  const Icon = ACTIVITY_ICONS[activity.activityType] || ACTIVITY_ICONS.default;
  const gradientColor = ACTIVITY_COLORS[activity.activityType] || ACTIVITY_COLORS.default;
  
  const initials = activity.playerName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'game': return 'Game Stats';
      case 'badge': return 'New Badge';
      case 'streak': return 'Streak';
      case 'story': return 'Story';
      case 'goal': return 'Goal';
      case 'challenge': return 'Challenge';
      default: return 'Activity';
    }
  };

  return (
    <Card
      className="p-4 relative overflow-hidden transition-all duration-300 hover-elevate group"
      data-testid={`feed-activity-${activity.id}`}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", gradientColor)} />
      
      <div className="relative z-10 flex gap-3">
        {activity.playerId && (
          <Link href={`/players/${activity.playerId}`}>
            <Avatar className="w-10 h-10 border-2 border-white/10 cursor-pointer hover:border-accent/50 transition-colors shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-accent/20 to-secondary text-white font-display font-bold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {activity.playerName && activity.playerId && (
              <Link href={`/players/${activity.playerId}`}>
                <span className="text-sm font-semibold text-white hover:text-accent transition-colors cursor-pointer">
                  {activity.playerName}
                </span>
              </Link>
            )}
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              <Icon className="w-3 h-3 mr-1" />
              {getActivityLabel(activity.activityType)}
            </Badge>
          </div>
          
          <p className="text-white font-medium text-sm leading-snug mb-1">
            {activity.headline}
          </p>
          
          {activity.subtext && (
            <p className="text-muted-foreground text-xs leading-relaxed">
              {activity.subtext}
            </p>
          )}
          
          <div className="flex items-center gap-2 mt-2">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
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

  // Calculate if player is recently active (within 15 minutes)
  const isRecentlyActive = player.lastActivityTime
    ? differenceInMinutes(new Date(), new Date(player.lastActivityTime)) <= 15
    : false;

  const lastSeenText = player.lastActivityTime
    ? formatDistanceToNow(new Date(player.lastActivityTime), { addSuffix: true })
    : null;

  return (
    <Card
      className="p-4 relative overflow-hidden transition-all duration-300 hover-elevate group"
      data-testid={`card-player-${player.id}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative z-10 flex items-center gap-4">
        <div className="relative">
          <Link href={`/players/${player.id}`}>
            <Avatar className="w-14 h-14 border-2 border-white/10 cursor-pointer hover:border-accent/50 transition-colors">
              <AvatarFallback className="bg-gradient-to-br from-accent/20 to-secondary text-white font-display font-bold text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
          {isRecentlyActive && (
            <div
              className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white/90 shadow-lg"
              data-testid={`indicator-online-${player.id}`}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <Link href={`/players/${player.id}`}>
            <h3
              className="text-base font-bold text-white leading-tight mb-0.5 truncate hover:text-accent transition-colors cursor-pointer"
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
            {lastSeenText && (
              <span
                className="flex items-center gap-1 text-accent/70"
                data-testid={`text-last-seen-${player.id}`}
              >
                <Clock className="w-3 h-3" />
                {lastSeenText}
              </span>
            )}
            {player.recentActivity && ActivityIcon && (
              <span className="flex items-center gap-1 text-accent/80">
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

function FeedTab() {
  const { data: feedActivities, isLoading, error } = useQuery<FeedActivity[]>({
    queryKey: ["/api/feed/following"],
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <FeedSkeleton />
        <FeedSkeleton />
        <FeedSkeleton />
        <FeedSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center" data-testid="error-container">
        <p className="text-muted-foreground">Failed to load feed</p>
      </Card>
    );
  }

  if (!feedActivities || feedActivities.length === 0) {
    return (
      <Card className="p-8 text-center" data-testid="empty-feed-container">
        <div className="flex flex-col items-center gap-3">
          <TrendingUp className="w-12 h-12 text-muted-foreground/50" />
          <div>
            <p className="text-white font-display font-medium mb-1">No updates yet</p>
            <p className="text-sm text-muted-foreground">
              Follow players to see their game stats, badges, and stories here
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3" data-testid="container-feed">
      {feedActivities.map((activity) => (
        <FeedActivityCard key={activity.id} activity={activity} />
      ))}
    </div>
  );
}

function DiscoverTab() {
  const [search, setSearch] = useState("");

  const { data: players, isLoading, error } = useQuery<Player[]>({
    queryKey: ["/api/players"],
    select: (data: Player[]) => {
      // Mock lastActivityTime for demo purposes (some players active recently, some not)
      return data.map((player, index) => ({
        ...player,
        lastActivityTime: new Date(Date.now() - Math.random() * 60 * 60 * 1000), // Random time in last hour
      }));
    },
  });

  const filteredPlayers = players?.filter(
    (player) =>
      player.name.toLowerCase().includes(search.toLowerCase()) ||
      player.position.toLowerCase().includes(search.toLowerCase()) ||
      player.team?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
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
                <p className="text-white font-display font-medium mb-1">No players found</p>
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

export default function ConnectContent() {
  return (
    <div className="space-y-6" data-testid="connect-content">
      <Tabs defaultValue="discover" className="w-full">
        <TabsList className="w-full grid grid-cols-2 mb-4 bg-card border border-white/10" data-testid="tabs-connect">
          <TabsTrigger value="discover" className="gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground" data-testid="tab-discover-players">
            <Search className="w-4 h-4" />
            Find Players
          </TabsTrigger>
          <TabsTrigger value="following" className="gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground" data-testid="tab-following">
            <TrendingUp className="w-4 h-4" />
            Following Activity
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="discover">
          <DiscoverTab />
        </TabsContent>
        
        <TabsContent value="following">
          <FeedTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
