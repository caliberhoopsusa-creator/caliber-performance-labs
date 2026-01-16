import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Award, Repeat2, BarChart3, Users, Camera, Flame, Trophy, Zap, Rss } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface FeedActivity {
  id: number;
  activityType: string;
  playerId: number | null;
  gameId: number | null;
  headline: string;
  subtext: string | null;
  playerName?: string;
  createdAt: Date;
}

const ACTIVITY_ICONS: Record<string, typeof Target> = {
  game: Target,
  badge: Award,
  streak: Flame,
  goal: Trophy,
  challenge: Zap,
  repost: Repeat2,
  poll: BarChart3,
  prediction: Users,
  story: Camera,
};

const ACTIVITY_GRADIENTS: Record<string, string> = {
  game: "from-orange-500/20 to-orange-600/5",
  badge: "from-yellow-500/20 to-amber-600/5",
  streak: "from-red-500/20 to-orange-600/5",
  goal: "from-emerald-500/20 to-green-600/5",
  challenge: "from-purple-500/20 to-violet-600/5",
  repost: "from-blue-500/20 to-cyan-600/5",
  poll: "from-indigo-500/20 to-blue-600/5",
  prediction: "from-pink-500/20 to-rose-600/5",
  story: "from-cyan-500/20 to-teal-600/5",
};

const ACTIVITY_COLORS: Record<string, string> = {
  game: "text-orange-400",
  badge: "text-yellow-400",
  streak: "text-red-400",
  goal: "text-emerald-400",
  challenge: "text-purple-400",
  repost: "text-blue-400",
  poll: "text-indigo-400",
  prediction: "text-pink-400",
  story: "text-cyan-400",
};

function ActivitySkeleton() {
  return (
    <Card className="p-4" data-testid="skeleton-activity">
      <div className="flex items-start gap-4">
        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex items-center gap-2 mt-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
    </Card>
  );
}

function ActivityCard({ activity }: { activity: FeedActivity }) {
  const [, setLocation] = useLocation();
  const Icon = ACTIVITY_ICONS[activity.activityType] || Rss;
  const gradient = ACTIVITY_GRADIENTS[activity.activityType] || "from-gray-500/20 to-gray-600/5";
  const iconColor = ACTIVITY_COLORS[activity.activityType] || "text-gray-400";

  const handleClick = () => {
    if (activity.playerId) {
      setLocation(`/players/${activity.playerId}`);
    }
  };

  const relativeTime = formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true });

  return (
    <Card
      className={cn(
        "p-4 relative overflow-hidden transition-all duration-300",
        activity.playerId && "cursor-pointer hover-elevate"
      )}
      onClick={activity.playerId ? handleClick : undefined}
      data-testid={`card-activity-${activity.id}`}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60", gradient)} />
      
      <div className="relative z-10 flex items-start gap-4">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
          "bg-white/5 border border-white/10"
        )}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 
            className="text-base font-bold text-white leading-tight mb-1"
            data-testid={`text-headline-${activity.id}`}
          >
            {activity.headline}
          </h3>
          
          {activity.subtext && (
            <p 
              className="text-sm text-muted-foreground line-clamp-2 mb-2"
              data-testid={`text-subtext-${activity.id}`}
            >
              {activity.subtext}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {activity.playerName && (
              <Badge 
                variant="secondary" 
                className="text-xs"
                data-testid={`badge-player-${activity.id}`}
              >
                {activity.playerName}
              </Badge>
            )}
            <span 
              className="text-xs text-muted-foreground"
              data-testid={`text-time-${activity.id}`}
            >
              {relativeTime}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function Newsfeed() {
  const { data: activities, isLoading, error } = useQuery<FeedActivity[]>({
    queryKey: ["/api/feed"],
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="page-newsfeed">
      <div>
        <h2 className="text-3xl md:text-4xl font-display font-bold text-white uppercase tracking-tight">
          Activity Feed
        </h2>
        <p className="text-muted-foreground font-medium mt-1">
          Latest updates from players and teams
        </p>
      </div>

      <div className="space-y-3" data-testid="container-activities">
        {isLoading ? (
          <>
            <ActivitySkeleton />
            <ActivitySkeleton />
            <ActivitySkeleton />
            <ActivitySkeleton />
            <ActivitySkeleton />
          </>
        ) : error ? (
          <Card className="p-8 text-center" data-testid="error-container">
            <p className="text-muted-foreground">Failed to load activity feed</p>
          </Card>
        ) : activities && activities.length > 0 ? (
          activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))
        ) : (
          <Card className="p-8 text-center" data-testid="empty-container">
            <div className="flex flex-col items-center gap-3">
              <Rss className="w-12 h-12 text-muted-foreground/50" />
              <div>
                <p className="text-white font-medium mb-1">No activity yet</p>
                <p className="text-sm text-muted-foreground">
                  Activities will appear here as players log games and earn badges
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
