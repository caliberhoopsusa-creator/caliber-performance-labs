import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Award, Repeat2, BarChart3, Users, Camera, Flame, Trophy, Zap, Rss, UserCheck, UsersRound, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

function getSessionId(): string {
  const key = "caliber_session_id";
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
}

interface FeedActivity {
  id: number;
  activityType: string;
  playerId: number | null;
  gameId: number | null;
  headline: string;
  subtext: string | null;
  playerName?: string;
  createdAt: string;
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
  game: "from-accent/30 to-accent/10",
  badge: "from-yellow-500/30 to-accent/10",
  streak: "from-red-500/30 to-accent/10",
  goal: "from-emerald-500/30 to-green-600/10",
  challenge: "from-purple-500/30 to-violet-600/10",
  repost: "from-blue-500/30 to-accent/10",
  poll: "from-indigo-500/30 to-blue-600/10",
  prediction: "from-pink-500/30 to-rose-600/10",
  story: "from-accent/30 to-teal-600/10",
};

const ACTIVITY_COLORS: Record<string, string> = {
  game: "text-accent",
  badge: "text-yellow-400",
  streak: "text-red-400",
  goal: "text-emerald-400",
  challenge: "text-purple-400",
  repost: "text-blue-400",
  poll: "text-indigo-400",
  prediction: "text-pink-400",
  story: "text-accent",
};

const ACTIVITY_GLOW: Record<string, string> = {
  game: "#F97316",
  badge: "#FBBF24",
  streak: "#EF4444",
  goal: "#10B981",
  challenge: "#A855F7",
  repost: "#3B82F6",
  poll: "#6366F1",
  prediction: "#EC4899",
  story: "#06B6D4",
};

function ActivitySkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card 
        className="p-4 bg-card/80 border-border" 
        data-testid="skeleton-activity"
      >
        <div className="flex items-start gap-4">
          <Skeleton className="w-12 h-12 rounded-xl shrink-0 bg-muted/50" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4 bg-muted/50" />
            <Skeleton className="h-4 w-1/2 bg-muted/50" />
            <div className="flex items-center gap-2 mt-2">
              <Skeleton className="h-5 w-20 rounded-full bg-muted/50" />
              <Skeleton className="h-3 w-16 bg-muted/50" />
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function ActivityCard({ activity, index }: { activity: FeedActivity; index: number }) {
  const [, setLocation] = useLocation();
  const Icon = ACTIVITY_ICONS[activity.activityType] || Rss;
  const gradient = ACTIVITY_GRADIENTS[activity.activityType] || "from-gray-500/30 to-gray-600/10";
  const iconColor = ACTIVITY_COLORS[activity.activityType] || "text-gray-400";
  const glowColor = ACTIVITY_GLOW[activity.activityType] || "#6B7280";

  const handleClick = () => {
    if (activity.playerId) {
      setLocation(`/players/${activity.playerId}`);
    }
  };

  const relativeTime = formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card
        className={cn(
          "p-4 relative overflow-hidden transition-all duration-300",
          "bg-card/80 border-border",
          "hover:border-accent/30",
          activity.playerId && "cursor-pointer hover:scale-[1.01]"
        )}
        onClick={activity.playerId ? handleClick : undefined}
        data-testid={`card-activity-${activity.id}`}
      >
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", gradient)} />
        <div 
          className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-20"
          style={{ backgroundColor: glowColor }}
        />
        
        <div className="relative z-10 flex items-start gap-4">
          <div 
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
              "bg-muted/50 border border-border"
            )}
          >
            <Icon 
              className={cn("w-6 h-6", iconColor)} 
              style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 
              className="text-base font-bold text-foreground leading-tight mb-1"
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
                  className="text-xs bg-muted border-border"
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
    </motion.div>
  );
}

interface FeedListProps {
  activities: FeedActivity[] | undefined;
  isLoading: boolean;
  error: Error | null;
  emptyMessage: string;
  emptyDescription: string;
  emptyIcon: typeof Rss;
}

function FeedList({ activities, isLoading, error, emptyMessage, emptyDescription, emptyIcon: EmptyIcon }: FeedListProps) {
  if (isLoading) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <ActivitySkeleton key={i} index={i} />
          ))}
        </motion.div>
      </AnimatePresence>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card 
          className="p-8 text-center bg-card/80 border-red-500/20" 
          data-testid="error-container"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full" />
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center relative z-10">
                <Rss className="w-8 h-8 text-red-400" style={{ filter: "drop-shadow(0 0 8px #EF4444)" }} />
              </div>
            </div>
            <p className="text-muted-foreground">Failed to load activity feed</p>
          </div>
        </Card>
      </motion.div>
    );
  }

  if (activities && activities.length > 0) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {activities.map((activity, idx) => (
            <ActivityCard key={activity.id} activity={activity} index={idx} />
          ))}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="empty"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <Card 
          className="p-10 text-center bg-card/80 border-border" 
          data-testid="empty-container"
        >
          <div className="flex flex-col items-center gap-5">
            <div className="relative">
              <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full" />
              <motion.div 
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 flex items-center justify-center relative z-10"
                animate={{ 
                  boxShadow: [
                    "0 0 20px rgba(234, 88, 12, 0.2)",
                    "0 0 40px rgba(234, 88, 12, 0.4)",
                    "0 0 20px rgba(234, 88, 12, 0.2)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <EmptyIcon 
                  className="w-10 h-10 text-accent" 
                  style={{ filter: "drop-shadow(0 0 10px hsl(24, 95%, 53%))" }} 
                />
              </motion.div>
            </div>
            <div className="space-y-2">
              <p className="text-foreground font-bold text-xl">{emptyMessage}</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {emptyDescription}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

const TAB_ICONS = {
  all: Rss,
  following: UserCheck,
  team: UsersRound,
};

const TAB_LABELS = {
  all: "All",
  following: "Following",
  team: "Team",
};

export default function Newsfeed() {
  const [activeTab, setActiveTab] = useState("all");

  const { data: allData, isLoading: allLoading, error: allError } = useQuery<{ items: FeedActivity[]; nextCursor?: number; hasMore: boolean }>({
    queryKey: ["/api/feed", "newsfeed-page"],
    queryFn: async () => {
      const res = await fetch("/api/feed?limit=50");
      if (!res.ok) throw new Error("Failed to fetch feed");
      return res.json();
    },
  });
  const allActivities = allData?.items;

  const { data: followingActivities, isLoading: followingLoading, error: followingError } = useQuery<FeedActivity[]>({
    queryKey: ["/api/feed/following"],
    enabled: activeTab === "following",
  });

  const sessionId = getSessionId();
  const { data: teamActivities, isLoading: teamLoading, error: teamError } = useQuery<FeedActivity[]>({
    queryKey: ["/api/feed/team", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/feed/team?sessionId=${sessionId}`);
      if (!res.ok) throw new Error("Failed to fetch team feed");
      return res.json();
    },
    enabled: activeTab === "team",
  });

  return (
    <div className="pb-24 md:pb-6 space-y-8" data-testid="page-newsfeed">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card/80 via-card to-card/80 border border-accent/20">
        <div className="absolute inset-0 opacity-30" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full" />
        
        <div className="relative z-10 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-accent" style={{ filter: "drop-shadow(0 0 8px hsl(24, 95%, 53%))" }} />
                <span className="text-xs uppercase tracking-wider text-accent font-semibold">Live Updates</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">
                <span className="bg-gradient-to-r from-white via-accent to-accent bg-clip-text text-transparent">
                  Activity Feed
                </span>
              </h1>
              <p className="text-muted-foreground max-w-md">
                Stay updated with the latest activities from players and teams
              </p>
            </div>
            
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-gradient-to-r from-accent/15 to-accent/5 border border-accent/30 backdrop-blur-sm">
              <div className="relative">
                <Rss className="w-7 h-7 text-accent" style={{ filter: "drop-shadow(0 0 8px hsl(24, 95%, 53%))" }} />
                <motion.div 
                  className="absolute inset-0"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Rss className="w-7 h-7 text-accent/30" />
                </motion.div>
              </div>
              <div>
                <p className="text-xs text-accent/80 uppercase tracking-wide">Live Feed</p>
                <p className="text-lg font-bold text-accent" style={{ textShadow: "0 0 20px rgba(234,88,12,0.5)" }}>
                  {allActivities?.length || 0} Updates
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList 
          className="w-full h-auto p-1.5 bg-muted/80 border border-border rounded-xl grid grid-cols-3 gap-1" 
          data-testid="tabs-feed"
        >
          {(["all", "following", "team"] as const).map((tab) => {
            const Icon = TAB_ICONS[tab];
            return (
              <TabsTrigger
                key={tab}
                value={tab}
                className={cn(
                  "flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all",
                  "data-[state=active]:bg-gradient-to-br data-[state=active]:from-accent data-[state=active]:to-accent",
                  "data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-accent/20"
                )}
                data-testid={`tab-${tab}`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{TAB_LABELS[tab]}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="space-y-3" data-testid="container-activities-all">
            <FeedList
              activities={allActivities}
              isLoading={allLoading}
              error={allError}
              emptyMessage="No activity yet"
              emptyDescription="Activities will appear here as players log games and earn badges"
              emptyIcon={Rss}
            />
          </div>
        </TabsContent>

        <TabsContent value="following" className="mt-6">
          <div className="space-y-3" data-testid="container-activities-following">
            <FeedList
              activities={followingActivities}
              isLoading={followingLoading}
              error={followingError}
              emptyMessage="No updates from followed players"
              emptyDescription="Follow players to see their updates here"
              emptyIcon={UserCheck}
            />
          </div>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <div className="space-y-3" data-testid="container-activities-team">
            <FeedList
              activities={teamActivities}
              isLoading={teamLoading}
              error={teamError}
              emptyMessage="No team activity"
              emptyDescription="Team updates will appear here when teammates log games or earn badges"
              emptyIcon={UsersRound}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
