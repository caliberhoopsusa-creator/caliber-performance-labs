import { useState, useEffect, useRef } from "react";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Target, Award, Repeat2, BarChart3, Users, Camera, Flame, Trophy, Zap, Rss, UserCheck, UsersRound, Activity, Heart, ThumbsUp, HandMetal, ArrowUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

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
  game: "from-orange-500/30 to-orange-600/10",
  badge: "from-yellow-500/30 to-amber-600/10",
  streak: "from-red-500/30 to-orange-600/10",
  goal: "from-emerald-500/30 to-green-600/10",
  challenge: "from-purple-500/30 to-violet-600/10",
  repost: "from-blue-500/30 to-cyan-600/10",
  poll: "from-indigo-500/30 to-blue-600/10",
  prediction: "from-pink-500/30 to-rose-600/10",
  story: "from-cyan-500/30 to-teal-600/10",
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

const REACTION_CONFIGS = [
  { id: "fire", icon: Flame, label: "Fire", color: "text-orange-400", activeColor: "bg-orange-500/20 border-orange-500/40" },
  { id: "like", icon: ThumbsUp, label: "Like", color: "text-blue-400", activeColor: "bg-blue-500/20 border-blue-500/40" },
  { id: "heart", icon: Heart, label: "Love", color: "text-red-400", activeColor: "bg-red-500/20 border-red-500/40" },
  { id: "clap", icon: HandMetal, label: "Clap", color: "text-yellow-400", activeColor: "bg-yellow-500/20 border-yellow-500/40" },
];

interface ReactionData {
  counts: Record<string, number>;
  users: Record<string, string[]>;
  userReactions: string[];
}

function ReactionButtons({ 
  activityId,
  playerName,
}: { 
  activityId: number;
  playerName: string;
}) {
  const queryClient = useQueryClient();
  const sessionId = getSessionId();
  const [clickedReaction, setClickedReaction] = useState<string | null>(null);

  const { data: reactionData } = useQuery<{ counts: Record<string, number>; users: Record<string, string[]> }>({
    queryKey: ['/api/feed', activityId, 'reactions'],
    queryFn: async () => {
      const res = await fetch(`/api/feed/${activityId}/reactions`);
      if (!res.ok) throw new Error('Failed to fetch reactions');
      return res.json();
    },
  });

  const { data: userReactionsData } = useQuery<{ userReactions: string[] }>({
    queryKey: ['/api/feed', activityId, 'user-reactions', sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/feed/${activityId}/user-reactions?sessionId=${sessionId}`);
      if (!res.ok) throw new Error('Failed to fetch user reactions');
      return res.json();
    },
  });

  const toggleReactionMutation = useMutation({
    mutationFn: async ({ reactionType, name }: { reactionType: string; name: string }) => {
      return await apiRequest('POST', `/api/feed/${activityId}/reactions`, {
        sessionId,
        reactionType,
        playerName: name,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/feed', activityId, 'reactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/feed', activityId, 'user-reactions', sessionId] });
    },
  });

  const handleReactionClick = (reactionId: string) => {
    setClickedReaction(reactionId);
    toggleReactionMutation.mutate({ reactionType: reactionId, name: playerName });
    setTimeout(() => setClickedReaction(null), 300);
  };

  const counts = reactionData?.counts || {};
  const users = reactionData?.users || {};
  const userReactions = userReactionsData?.userReactions || [];

  return (
    <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-white/5">
      <div className="flex items-center gap-2 flex-wrap">
        {REACTION_CONFIGS.map((reaction) => {
          const Icon = reaction.icon;
          const count = counts[reaction.id] || 0;
          const isClicked = clickedReaction === reaction.id;
          const hasUserReacted = userReactions.includes(reaction.id);
          const reactedUsers = users[reaction.id] || [];

          return (
            <Tooltip key={reaction.id}>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={() => handleReactionClick(reaction.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all",
                    "bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20",
                    hasUserReacted && reaction.activeColor,
                  )}
                  data-testid={`button-reaction-${reaction.id}`}
                  whileTap={{ scale: 0.92 }}
                  disabled={toggleReactionMutation.isPending}
                >
                  <motion.div
                    animate={isClicked ? {
                      scale: [1, 1.3, 0.9, 1],
                      rotate: isClicked ? [0, 15, -15, 0] : 0,
                    } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <Icon className={cn("w-4 h-4", reaction.color)} />
                  </motion.div>
                  {count > 0 && (
                    <motion.span
                      initial={isClicked ? { scale: 0 } : {}}
                      animate={isClicked ? { scale: 1 } : {}}
                      transition={{ type: "spring", stiffness: 200, damping: 10 }}
                      className="text-white/80"
                    >
                      {count}
                    </motion.span>
                  )}
                </motion.button>
              </TooltipTrigger>
              {reactedUsers.length > 0 && (
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-sm">
                    {reactedUsers.slice(0, 5).join(', ')}
                    {reactedUsers.length > 5 && ` and ${reactedUsers.length - 5} more`}
                  </p>
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}

function ActivitySkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card 
        className="p-4 bg-gradient-to-br from-black/60 to-black/30 border-white/10" 
        data-testid="skeleton-activity"
      >
        <div className="flex items-start gap-4">
          <Skeleton className="w-12 h-12 rounded-xl shrink-0 bg-white/5" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4 bg-white/5" />
            <Skeleton className="h-4 w-1/2 bg-white/5" />
            <div className="flex items-center gap-2 mt-2">
              <Skeleton className="h-5 w-20 rounded-full bg-white/5" />
              <Skeleton className="h-3 w-16 bg-white/5" />
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function ActivityCard({ activity, index, currentUserName }: { activity: FeedActivity; index: number; currentUserName: string }) {
  const [, setLocation] = useLocation();
  
  const Icon = ACTIVITY_ICONS[activity.activityType] || Rss;
  const gradient = ACTIVITY_GRADIENTS[activity.activityType] || "from-gray-500/30 to-gray-600/10";
  const iconColor = ACTIVITY_COLORS[activity.activityType] || "text-gray-400";
  const glowColor = ACTIVITY_GLOW[activity.activityType] || "#6B7280";

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-testid^="button-reaction"]')) {
      return;
    }
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
          "bg-gradient-to-br from-black/60 to-black/30 border-white/10",
          "hover:border-cyan-500/30",
          activity.playerId && "cursor-pointer hover:scale-[1.01]"
        )}
        onClick={handleClick}
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
              "bg-gradient-to-br from-white/10 to-white/5 border border-white/10"
            )}
          >
            <Icon 
              className={cn("w-6 h-6", iconColor)} 
              style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
            />
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
                  className="text-xs bg-white/10 border-white/10 hover:bg-white/20"
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

            <ReactionButtons
              activityId={activity.id}
              playerName={currentUserName}
            />
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
  currentUserName: string;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
}

function FeedList({ activities, isLoading, error, emptyMessage, emptyDescription, emptyIcon: EmptyIcon, currentUserName, hasNextPage, isFetchingNextPage, onLoadMore }: FeedListProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onLoadMore || !hasNextPage) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );
    
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    
    return () => observer.disconnect();
  }, [onLoadMore, hasNextPage, isFetchingNextPage]);
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
          className="p-8 text-center bg-gradient-to-br from-black/60 to-black/30 border-red-500/20" 
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
            <ActivityCard key={activity.id} activity={activity} index={idx} currentUserName={currentUserName} />
          ))}
          {onLoadMore && hasNextPage && (
            <div ref={loadMoreRef} className="py-4 flex justify-center">
              <Button
                variant="outline"
                onClick={onLoadMore}
                disabled={isFetchingNextPage}
                className="border-white/10 text-muted-foreground"
                data-testid="button-load-more"
              >
                {isFetchingNextPage ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  'Load more'
                )}
              </Button>
            </div>
          )}
          {!hasNextPage && activities.length > 0 && (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground" data-testid="text-caught-up">You're all caught up!</p>
            </div>
          )}
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
          className="p-10 text-center bg-gradient-to-br from-black/60 to-black/30 border-white/10" 
          data-testid="empty-container"
        >
          <div className="flex flex-col items-center gap-5">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full" />
              <motion.div 
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30 flex items-center justify-center relative z-10"
                animate={{ 
                  boxShadow: [
                    "0 0 20px rgba(0, 212, 255, 0.2)",
                    "0 0 40px rgba(0, 212, 255, 0.4)",
                    "0 0 20px rgba(0, 212, 255, 0.2)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <EmptyIcon 
                  className="w-10 h-10 text-cyan-400" 
                  style={{ filter: "drop-shadow(0 0 10px #00D4FF)" }} 
                />
              </motion.div>
            </div>
            <div className="space-y-2">
              <p className="text-white font-bold text-xl">{emptyMessage}</p>
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

export default function FeedContent() {
  const [activeTab, setActiveTab] = useState("all");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currentUserName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous' : 'Anonymous';

  const { 
    data: allData,
    isLoading: allLoading, 
    error: allError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<{ items: FeedActivity[]; nextCursor?: number; hasMore: boolean }>({
    queryKey: ["/api/feed"],
    queryFn: async ({ pageParam }) => {
      const url = pageParam ? `/api/feed?cursor=${pageParam}&limit=20` : `/api/feed?limit=20`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch feed");
      return res.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as number | undefined,
  });

  const allActivities = allData?.pages.flatMap(page => page.items);

  const latestId = allData?.pages[0]?.items[0]?.id;

  const { data: newCountData } = useQuery<{ count: number }>({
    queryKey: ["/api/feed/new-count", latestId],
    queryFn: async () => {
      if (!latestId) return { count: 0 };
      const res = await fetch(`/api/feed/new-count?since=${latestId}`);
      if (!res.ok) return { count: 0 };
      return res.json();
    },
    refetchInterval: 30000,
    enabled: !!latestId,
  });

  const newPostsCount = newCountData?.count || 0;

  const handleLoadNewPosts = () => {
    queryClient.resetQueries({ queryKey: ["/api/feed"] });
  };

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
    <div className="space-y-6" data-testid="feed-content">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500/15 to-purple-600/5 border border-purple-500/30 backdrop-blur-sm">
        <Rss className="w-6 h-6 text-purple-400" />
        <div>
          <p className="text-xs text-purple-400/80 uppercase tracking-wide">Live Feed</p>
          <p className="text-lg font-bold text-purple-400">
            {allActivities?.length || 0} Updates
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList 
          className="w-full h-auto p-1.5 bg-black/40 border border-white/10 rounded-xl grid grid-cols-3 gap-1" 
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
                  "data-[state=active]:bg-gradient-to-br data-[state=active]:from-cyan-600 data-[state=active]:to-cyan-700",
                  "data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/20"
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
            {newPostsCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-50"
              >
                <Button
                  onClick={handleLoadNewPosts}
                  className="w-full bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-lg shadow-cyan-500/20 rounded-xl"
                  data-testid="button-new-posts"
                >
                  <ArrowUp className="w-4 h-4 mr-2" />
                  {newPostsCount} new {newPostsCount === 1 ? 'post' : 'posts'} available
                </Button>
              </motion.div>
            )}
            <FeedList
              activities={allActivities}
              isLoading={allLoading}
              error={allError}
              emptyMessage="No activity yet"
              emptyDescription="Activities will appear here as players log games and earn badges"
              emptyIcon={Rss}
              currentUserName={currentUserName}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onLoadMore={() => fetchNextPage()}
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
              currentUserName={currentUserName}
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
              currentUserName={currentUserName}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
