import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Target, Award, Repeat2, BarChart3, Users, Camera, Flame, Trophy, Zap, Rss, UserCheck, UsersRound, Heart, ArrowUp, MessageCircle, Send, Trash2, Reply, Bookmark, Dumbbell, Clock, Swords, Quote, Bell, MoreHorizontal, Share2, Plus, X, ChevronLeft, ChevronRight, Eye, User, Star, ThumbsUp, Image, Video } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient as globalQueryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import WeeklyRecapCard from "@/components/WeeklyRecapCard";
import StreakDisplay from "@/components/StreakDisplay";
import ChallengeButton from "@/components/ChallengeButton";
import DiscoveryCards from "@/components/DiscoveryCards";
import { GettingStartedCard, useGuidedOnboarding } from "@/components/GuidedOnboarding";
import type { PlayerStory } from "@shared/schema";

type StoryWithPlayer = PlayerStory & { playerName: string; playerUsername: string | null; playerPhoto: string | null };

function PullToRefresh({ onRefresh, children }: { onRefresh: () => Promise<void>; children: React.ReactNode }) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const threshold = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!pulling) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, 120));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > threshold) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
    setPulling(false);
    setPullDistance(0);
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {(pullDistance > 0 || refreshing) && (
        <div
          className="flex items-center justify-center"
          style={{ height: refreshing ? 60 : pullDistance }}
          data-testid="pull-to-refresh-indicator"
        >
          <motion.div
            animate={refreshing ? { rotate: 360 } : { y: [0, -5, 0] }}
            transition={refreshing ? { repeat: Infinity, duration: 0.8, ease: "linear" } : { repeat: Infinity, duration: 0.5 }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" className="text-accent" data-testid="pull-to-refresh-ball">
              <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M2 16 Q16 10 30 16" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M2 16 Q16 22 30 16" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <line x1="16" y1="2" x2="16" y2="30" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </motion.div>
          {pullDistance > threshold && !refreshing && (
            <span className="text-xs text-muted-foreground ml-2">Release to refresh</span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

interface StoryPlayer {
  playerId: number;
  playerName: string;
  playerUsername: string | null;
  playerPhoto: string | null;
  hasActiveStory: boolean;
}

function InlineStoryViewer({
  stories,
  initialPlayerIndex,
  onClose,
}: {
  stories: StoryWithPlayer[];
  initialPlayerIndex: number;
  onClose: () => void;
}) {
  const playerIds = Array.from(new Set(stories.map(s => s.playerId)));
  const [playerIndex, setPlayerIndex] = useState(initialPlayerIndex);
  const currentPlayerId = playerIds[playerIndex];
  const playerStories = stories.filter(s => s.playerId === currentPlayerId);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionId = getSessionId();

  const currentStory = playerStories[storyIndex];

  const [tappedReaction, setTappedReaction] = useState<string | null>(null);

  const viewMutation = useMutation({
    mutationFn: async (storyId: number) => {
      await apiRequest("POST", `/api/stories/${storyId}/view`, { sessionId });
    },
  });

  const reactionMutation = useMutation({
    mutationFn: async ({ storyId, reaction }: { storyId: number; reaction: string }) => {
      await apiRequest("POST", `/api/stories/${storyId}/reactions`, { sessionId, reaction });
    },
  });

  const handleReaction = (reaction: string) => {
    if (!currentStory) return;
    setTappedReaction(reaction);
    reactionMutation.mutate({ storyId: currentStory.id, reaction });
    setTimeout(() => setTappedReaction(null), 400);
  };

  const reactionButtons = [
    { type: 'fire', icon: Flame },
    { type: 'heart', icon: Heart },
    { type: 'thumbsup', icon: ThumbsUp },
    { type: 'star', icon: Star },
    { type: 'strong', icon: Zap },
  ] as const;

  useEffect(() => {
    if (currentStory) viewMutation.mutate(currentStory.id);
  }, [currentStory?.id]);

  const goNext = useCallback(() => {
    if (storyIndex < playerStories.length - 1) {
      setStoryIndex(prev => prev + 1);
    } else if (playerIndex < playerIds.length - 1) {
      setPlayerIndex(prev => prev + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  }, [storyIndex, playerStories.length, playerIndex, playerIds.length, onClose]);

  const goPrev = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex(prev => prev - 1);
    } else if (playerIndex > 0) {
      setPlayerIndex(prev => prev - 1);
      setStoryIndex(0);
    }
  }, [storyIndex, playerIndex]);

  useEffect(() => {
    setProgress(0);
    const duration = currentStory?.mediaType === 'video' ? 15000 : 5000;
    const interval = 50;
    const increment = (interval / duration) * 100;
    timerRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { goNext(); return 0; }
        return prev + increment;
      });
    }, interval);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [storyIndex, playerIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goPrev, goNext]);

  if (!currentStory) return null;

  const parsedStats: { points?: number; rebounds?: number; assists?: number } | null = (() => {
    try { return currentStory.stats ? JSON.parse(currentStory.stats) : null; } catch { return null; }
  })();

  const containerRef = useRef<HTMLDivElement>(null);

  const handleContainerClick = (e: React.MouseEvent) => {
    if (e.target !== containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 3) goPrev();
    else if (x > (rect.width * 2) / 3) goNext();
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
      onClick={handleContainerClick}
      data-testid="inline-story-viewer"
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-10 text-white"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        data-testid="button-close-inline-story"
        aria-label="Close story"
      >
        <X className="w-6 h-6" />
      </Button>

      <div className="absolute top-4 left-4 right-16 flex gap-1 z-10" onClick={e => e.stopPropagation()}>
        {playerStories.map((_, idx) => (
          <div key={idx} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full"
              style={{ width: idx < storyIndex ? '100%' : idx === storyIndex ? `${progress}%` : '0%', transition: 'width 0.05s linear' }}
            />
          </div>
        ))}
      </div>

      <div className="absolute top-12 left-4 flex items-center gap-3 z-10" onClick={e => e.stopPropagation()}>
        <Avatar className="w-10 h-10 border border-accent/30">
          <AvatarImage src={currentStory.playerPhoto ?? undefined} alt={currentStory.playerName} className="object-cover" />
          <AvatarFallback className="text-xs font-semibold bg-accent/20 text-accent">
            {getInitials(currentStory.playerName)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-white font-semibold text-sm">{currentStory.playerName}</p>
          <p className="text-white/60 text-xs">
            {currentStory.playerUsername ? `@${currentStory.playerUsername}` : ''} {currentStory.playerUsername ? '·' : ''} {formatDistanceToNow(new Date(currentStory.createdAt!), { addSuffix: true })}
          </p>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 top-24 flex flex-col items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto">
          {currentStory.mediaType === 'image' && currentStory.imageUrl && (
            <img src={currentStory.imageUrl} alt={currentStory.headline} className="max-h-[60vh] max-w-full object-contain rounded-md" data-testid="inline-story-image" />
          )}
          {currentStory.mediaType === 'video' && currentStory.videoUrl && (
            <video src={currentStory.videoUrl} autoPlay muted loop playsInline className="max-h-[60vh] max-w-full object-contain rounded-md" data-testid="inline-story-video" />
          )}
          {currentStory.mediaType === 'text' && (
            <Star className="w-24 h-24 text-accent/40" />
          )}
        </div>
        <div className="mt-4 text-center max-w-md pointer-events-auto">
          <h2 className="text-2xl font-bold text-white mb-2">{currentStory.headline}</h2>
          {currentStory.caption && <p className="text-white/80 text-sm mb-4">{currentStory.caption}</p>}
          {parsedStats && (
            <div className="flex justify-center gap-6 mb-4">
              {parsedStats.points !== undefined && (
                <div className="text-center"><p className="text-3xl font-bold text-accent">{parsedStats.points}</p><p className="text-xs text-white/60 uppercase">Points</p></div>
              )}
              {parsedStats.rebounds !== undefined && (
                <div className="text-center"><p className="text-3xl font-bold text-accent">{parsedStats.rebounds}</p><p className="text-xs text-white/60 uppercase">Rebounds</p></div>
              )}
              {parsedStats.assists !== undefined && (
                <div className="text-center"><p className="text-3xl font-bold text-accent">{parsedStats.assists}</p><p className="text-xs text-white/60 uppercase">Assists</p></div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-white/60 text-sm mt-4 pointer-events-auto">
          <Eye className="w-4 h-4" />
          <span>{currentStory.viewCount || 0} views</span>
        </div>
      </div>

      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-black/40 backdrop-blur-sm rounded-full px-4 py-2"
        onClick={e => e.stopPropagation()}
        data-testid="story-reaction-bar"
      >
        {reactionButtons.map(({ type, icon: Icon }) => (
          <motion.button
            key={type}
            onClick={() => handleReaction(type)}
            animate={tappedReaction === type ? { scale: [1, 1.5, 1] } : { scale: 1 }}
            transition={{ duration: 0.35 }}
            className="w-10 h-10 rounded-full flex items-center justify-center hover-elevate"
            data-testid={`story-reaction-${type}`}
            aria-label={`React with ${type}`}
          >
            <Icon className="w-5 h-5 text-white" />
          </motion.button>
        ))}
      </div>

      <button
        className="absolute left-0 top-0 bottom-0 w-1/4 z-20"
        onClick={(e) => { e.stopPropagation(); goPrev(); }}
        data-testid="button-prev-inline-story"
        aria-label="Previous story"
      />
      <button
        className="absolute right-0 top-0 bottom-0 w-1/4 z-20"
        onClick={(e) => { e.stopPropagation(); goNext(); }}
        data-testid="button-next-inline-story"
        aria-label="Next story"
      />
    </div>
  );
}

function StoriesRow({ currentPlayerId, currentUserName }: { currentPlayerId?: number | null; currentUserName: string }) {
  const [, setLocation] = useLocation();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerPlayerIndex, setViewerPlayerIndex] = useState(0);

  const { data: activeStories = [], isLoading } = useQuery<StoryWithPlayer[]>({
    queryKey: ["/api/stories/active"],
    queryFn: async () => {
      const res = await fetch("/api/stories/active?limit=30");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const storyPlayers: StoryPlayer[] = [];
  const seenIds = new Set<number>();
  for (const story of activeStories) {
    if (!seenIds.has(story.playerId)) {
      seenIds.add(story.playerId);
      storyPlayers.push({
        playerId: story.playerId,
        playerName: story.playerName,
        playerUsername: story.playerUsername,
        playerPhoto: story.playerPhoto,
        hasActiveStory: true,
      });
    }
  }

  const handleStoryClick = (playerIndex: number) => {
    setViewerPlayerIndex(playerIndex);
    setViewerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 pb-2 overflow-x-auto scrollbar-hide" data-testid="stories-row">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
            <Skeleton className="w-16 h-16 rounded-full" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    );
  }

  if (storyPlayers.length === 0 && !currentPlayerId) return null;

  return (
    <>
      <div className="flex gap-4 p-2 overflow-x-auto scrollbar-hide" data-testid="stories-row">
        {storyPlayers.map((sp, idx) => (
          <button
            key={sp.playerId}
            onClick={() => handleStoryClick(idx)}
            className="flex flex-col items-center gap-1.5 shrink-0"
            data-testid={`story-avatar-${sp.playerId}`}
          >
            <Avatar className={cn("w-16 h-16", sp.hasActiveStory && "ring-2 ring-accent ring-offset-2 ring-offset-background")}>
              <AvatarImage src={sp.playerPhoto ?? undefined} alt={sp.playerName} className="object-cover" />
              <AvatarFallback className="text-sm font-semibold bg-muted text-muted-foreground">
                {getInitials(sp.playerName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-[11px] text-muted-foreground truncate max-w-[64px]">
              {sp.playerUsername ? `@${sp.playerUsername}` : sp.playerName.split(" ")[0]}
            </span>
          </button>
        ))}
        {currentPlayerId && (
          <button
            onClick={() => setLocation("/community?tab=stories")}
            className="flex flex-col items-center gap-1.5 shrink-0"
            data-testid="story-add-button"
          >
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center">
              <Plus className="w-6 h-6 text-muted-foreground" />
            </div>
            <span className="text-[11px] text-muted-foreground truncate max-w-[64px]">Add Story</span>
          </button>
        )}
      </div>
      {viewerOpen && activeStories.length > 0 && (
        <InlineStoryViewer
          stories={activeStories}
          initialPlayerIndex={viewerPlayerIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}

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
  playerUsername?: string;
  playerPhoto?: string | null;
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
  workout: Dumbbell,
};

const ACTIVITY_COLORS: Record<string, string> = {
  game: "text-accent",
  badge: "text-yellow-600 dark:text-yellow-400",
  streak: "text-red-600 dark:text-red-400",
  goal: "text-emerald-600 dark:text-emerald-400",
  challenge: "text-purple-600 dark:text-purple-400",
  repost: "text-blue-600 dark:text-blue-400",
  poll: "text-indigo-600 dark:text-indigo-400",
  prediction: "text-pink-600 dark:text-pink-400",
  story: "text-accent",
  workout: "text-emerald-600 dark:text-emerald-400",
};

interface FeedComment {
  id: number;
  activityId: number;
  parentId: number | null;
  sessionId: string;
  authorName: string;
  content: string;
  likeCount: number;
  createdAt: string;
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function FeedComments({ activityId }: { activityId: number }) {
  const qc = useQueryClient();
  const sessionId = getSessionId();
  const [authorName, setAuthorName] = useState(() => localStorage.getItem("caliber_author_name") || "");
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data: comments = [] } = useQuery<FeedComment[]>({
    queryKey: ['/api/feed', activityId, 'comments'],
    queryFn: async () => {
      const res = await fetch(`/api/feed/${activityId}/comments`);
      if (!res.ok) throw new Error('Failed to fetch comments');
      return res.json();
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: number }) => {
      localStorage.setItem("caliber_author_name", authorName);
      return apiRequest('POST', `/api/feed/${activityId}/comments`, {
        sessionId,
        authorName,
        content,
        ...(parentId ? { parentId } : {}),
      });
    },
    onSuccess: () => {
      setCommentText("");
      setReplyText("");
      setReplyingTo(null);
      qc.invalidateQueries({ queryKey: ['/api/feed', activityId, 'comments'] });
      qc.invalidateQueries({ queryKey: ['/api/feed', activityId, 'comments', 'count'] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const res = await fetch(`/api/feed/comments/${commentId}?sessionId=${sessionId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete comment');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/feed', activityId, 'comments'] });
      qc.invalidateQueries({ queryKey: ['/api/feed', activityId, 'comments', 'count'] });
    },
  });

  const likeCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      return apiRequest('POST', `/api/feed/comments/${commentId}/like`, { sessionId });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/feed', activityId, 'comments'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !commentText.trim()) return;
    addCommentMutation.mutate({ content: commentText });
  };

  const handleReplySubmit = (parentId: number) => {
    if (!authorName.trim() || !replyText.trim()) return;
    addCommentMutation.mutate({ content: replyText, parentId });
  };

  const topLevel = comments.filter((c) => !c.parentId);
  const replies = comments.filter((c) => c.parentId);
  const repliesByParent: Record<number, FeedComment[]> = {};
  replies.forEach((r) => {
    if (r.parentId) {
      if (!repliesByParent[r.parentId]) repliesByParent[r.parentId] = [];
      repliesByParent[r.parentId].push(r);
    }
  });

  const renderComment = (comment: FeedComment, isReply = false) => (
    <motion.div
      key={comment.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={cn("flex gap-2.5 group", isReply && "ml-8")}
      data-testid={`comment-${comment.id}`}
    >
      <Avatar className="w-7 h-7 shrink-0">
        <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
          {getInitials(comment.authorName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-foreground" data-testid={`comment-author-${comment.id}`}>{comment.authorName}</span>
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5" data-testid={`comment-content-${comment.id}`}>{comment.content}</p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => likeCommentMutation.mutate(comment.id)}
            aria-label="Like comment"
            data-testid={`button-like-comment-${comment.id}`}
            className="h-auto"
          >
            <div className="flex items-center gap-1 text-[10px]">
              <Heart className="w-3 h-3" />
              {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
            </div>
          </Button>
          {!isReply && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              aria-label="Reply to comment"
              data-testid={`button-reply-${comment.id}`}
              className="h-auto"
            >
              <div className="flex items-center gap-1 text-[10px]">
                <Reply className="w-3 h-3" />
                Reply
              </div>
            </Button>
          )}
          {comment.sessionId === sessionId && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => deleteCommentMutation.mutate(comment.id)}
              aria-label="Delete comment"
              data-testid={`button-delete-comment-${comment.id}`}
              className="opacity-0 group-hover:opacity-100 transition-opacity h-auto"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
        {replyingTo === comment.id && (
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Your name"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="max-w-[120px] text-xs"
              data-testid={`reply-author-input-${comment.id}`}
            />
            <Input
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 text-xs"
              data-testid={`reply-text-input-${comment.id}`}
              onKeyDown={(e) => { if (e.key === 'Enter') handleReplySubmit(comment.id); }}
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleReplySubmit(comment.id)}
              disabled={!authorName.trim() || !replyText.trim() || addCommentMutation.isPending}
              data-testid={`button-submit-reply-${comment.id}`}
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-3 px-4 pb-3" data-testid={`comments-section-${activityId}`}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="Your name"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          className="max-w-[120px] text-xs"
          data-testid={`comment-author-input-${activityId}`}
        />
        <Input
          placeholder="Add a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="flex-1 text-xs"
          data-testid={`comment-text-input-${activityId}`}
        />
        <Button
          type="submit"
          size="icon"
          variant="ghost"
          disabled={!authorName.trim() || !commentText.trim() || addCommentMutation.isPending}
          data-testid={`button-submit-comment-${activityId}`}
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>

      {comments.length > 0 ? (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {topLevel.map((comment) => (
              <div key={comment.id}>
                {renderComment(comment)}
                {repliesByParent[comment.id]?.map((reply) => renderComment(reply, true))}
              </div>
            ))}
          </div>
        </AnimatePresence>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-2" data-testid={`text-no-comments-${activityId}`}>
          No comments yet. Be the first!
        </p>
      )}
    </div>
  );
}

function RepostDialog({
  activityId,
  headline,
  playerName,
  open,
  onOpenChange,
}: {
  activityId: number;
  headline: string;
  playerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const sessionId = getSessionId();
  const [caption, setCaption] = useState("");

  const repostMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/feed/${activityId}/repost`, {
        sessionId,
        playerName,
        ...(caption.trim() ? { caption: caption.trim() } : {}),
      });
    },
    onSuccess: () => {
      onOpenChange(false);
      setCaption("");
      qc.invalidateQueries({ queryKey: ['/api/feed'] });
      toast({ title: "Shared to feed!", description: "Your repost is now visible in the feed." });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid={`dialog-repost-${activityId}`}>
        <DialogHeader>
          <DialogTitle>Share to Feed</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-3 rounded-md bg-muted">
            <p className="text-sm text-muted-foreground" data-testid={`text-repost-original-${activityId}`}>{headline}</p>
          </div>
          <Textarea
            placeholder="Add a caption (optional)..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="resize-none text-sm"
            rows={3}
            data-testid={`textarea-repost-caption-${activityId}`}
          />
          <Button
            onClick={() => repostMutation.mutate()}
            disabled={repostMutation.isPending}
            className="w-full"
            data-testid={`button-submit-repost-${activityId}`}
          >
            {repostMutation.isPending ? "Sharing..." : "Share to Feed"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InlineCommentPreview({ activityId, showComments, onToggleComments }: { activityId: number; showComments: boolean; onToggleComments: () => void }) {
  const { data: commentCountData } = useQuery<{ count: number }>({
    queryKey: ['/api/feed', activityId, 'comments', 'count'],
    queryFn: async () => {
      const res = await fetch(`/api/feed/${activityId}/comments/count`);
      if (!res.ok) return { count: 0 };
      return res.json();
    },
  });

  const { data: comments = [] } = useQuery<FeedComment[]>({
    queryKey: ['/api/feed', activityId, 'comments'],
    queryFn: async () => {
      const res = await fetch(`/api/feed/${activityId}/comments`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const commentCount = commentCountData?.count || 0;
  if (commentCount === 0 && !showComments) return null;

  const topLevel = comments.filter((c) => !c.parentId);
  const previewComments = topLevel.slice(0, 2);

  if (showComments) return null;

  return (
    <div className="mt-1.5 space-y-1">
      {commentCount > 2 && (
        <button
          onClick={onToggleComments}
          className="text-sm text-muted-foreground"
          data-testid={`button-view-comments-${activityId}`}
        >
          View all {commentCount} comments
        </button>
      )}
      {previewComments.map((comment) => (
        <p key={comment.id} className="text-sm" data-testid={`preview-comment-${comment.id}`}>
          <span className="font-semibold text-foreground">{comment.authorName}</span>{" "}
          <span className="text-muted-foreground">{comment.content.length > 80 ? comment.content.slice(0, 80) + "..." : comment.content}</span>
        </p>
      ))}
      {commentCount > 0 && commentCount <= 2 && (
        <button
          onClick={onToggleComments}
          className="text-sm text-muted-foreground"
          data-testid={`button-view-comments-${activityId}`}
        >
          View {commentCount === 1 ? 'comment' : 'comments'}
        </button>
      )}
    </div>
  );
}

function ActionBar({ 
  activityId,
  playerName,
  headline,
  showComments,
  onToggleComments,
  currentPlayerId,
}: { 
  activityId: number;
  playerName: string;
  headline: string;
  showComments: boolean;
  onToggleComments: () => void;
  currentPlayerId?: number | null;
}) {
  const queryClient = useQueryClient();
  const sessionId = getSessionId();
  const [repostOpen, setRepostOpen] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);

  const { data: savedData } = useQuery<{ saved: boolean }>({
    queryKey: ['/api/saved-posts', 'check', activityId, currentPlayerId],
    queryFn: async () => {
      if (!currentPlayerId) return { saved: false };
      const res = await fetch(`/api/saved-posts/check?activityId=${activityId}&playerId=${currentPlayerId}`);
      if (!res.ok) return { saved: false };
      return res.json();
    },
    enabled: !!currentPlayerId,
  });

  const toggleSaveMutation = useMutation({
    mutationFn: async () => {
      if (!currentPlayerId) return;
      if (savedData?.saved) {
        await apiRequest("DELETE", `/api/saved-posts?activityId=${activityId}&playerId=${currentPlayerId}`);
      } else {
        await apiRequest("POST", "/api/saved-posts", { activityId, playerId: currentPlayerId, sessionId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/saved-posts', 'check', activityId, currentPlayerId] });
      queryClient.invalidateQueries({ queryKey: ['/api/saved-posts'] });
    },
  });

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

  const counts = reactionData?.counts || {};
  const userReactions = userReactionsData?.userReactions || [];
  const totalLikes = (counts["heart"] || 0) + (counts["like"] || 0) + (counts["fire"] || 0) + (counts["clap"] || 0);
  const hasLiked = userReactions.includes("heart");

  const handleLike = () => {
    setLikeAnimating(true);
    toggleReactionMutation.mutate({ reactionType: "heart", name: playerName });
    setTimeout(() => setLikeAnimating(false), 600);
  };

  return (
    <>
      <div className="px-4 pt-1 pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 flex-wrap">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleLike}
              disabled={toggleReactionMutation.isPending}
              aria-label="Like"
              data-testid={`button-reaction-heart`}
            >
              <div className="relative flex items-center justify-center">
                <motion.div
                  animate={likeAnimating ? { scale: [1, 1.4, 0.9, 1.15, 1] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <Heart className={cn("w-5 h-5", hasLiked ? "text-red-500 fill-red-500" : "")} />
                </motion.div>
                <AnimatePresence>
                  {likeAnimating && hasLiked && (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      initial={{ scale: 0.5, opacity: 0.8 }}
                      animate={{ scale: 2.5, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="w-5 h-5 rounded-full border-2 border-red-500" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={onToggleComments}
              aria-label="Comments"
              data-testid={`button-comments-${activityId}`}
            >
              <MessageCircle className={cn("w-5 h-5", showComments ? "text-accent" : "")} />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => setRepostOpen(true)}
              aria-label="Share"
              data-testid={`button-repost-${activityId}`}
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>

          {currentPlayerId && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => toggleSaveMutation.mutate()}
              disabled={toggleSaveMutation.isPending}
              aria-label={savedData?.saved ? "Unsave post" : "Save post"}
              data-testid={`button-save-${activityId}`}
            >
              <Bookmark className={cn("w-5 h-5", savedData?.saved ? "fill-foreground" : "")} />
            </Button>
          )}
        </div>

        {totalLikes > 0 && (
          <p className="text-sm font-semibold text-foreground mt-1" data-testid={`text-likes-${activityId}`}>
            {totalLikes} {totalLikes === 1 ? 'like' : 'likes'}
          </p>
        )}

        <InlineCommentPreview activityId={activityId} showComments={showComments} onToggleComments={onToggleComments} />
      </div>

      <RepostDialog
        activityId={activityId}
        headline={headline}
        playerName={playerName}
        open={repostOpen}
        onOpenChange={setRepostOpen}
      />
    </>
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
      <Card data-testid="skeleton-activity">
        <div className="flex items-center gap-3 p-4 pb-3 flex-wrap">
          <Skeleton className="w-9 h-9 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="px-4 pb-3 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="px-4 pb-3 flex gap-4">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
      </Card>
    </motion.div>
  );
}

function formatShortTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  const diffWeek = Math.floor(diffDay / 7);
  return `${diffWeek}w`;
}

function parseGameHeadline(headline: string) {
  const match = headline.match(/^(.+?)\s+dropped\s+(\d+)\s+PTS\s+vs\s+(.+)$/i);
  if (match) return { name: match[1], pts: parseInt(match[2]), opponent: match[3] };
  return null;
}

function parseGameSubtext(subtext: string | null) {
  if (!subtext) return null;
  const gradeMatch = subtext.match(/Grade:\s*([A-F][+-]?)/i);
  const rebMatch = subtext.match(/(\d+)\s*REB/i);
  const astMatch = subtext.match(/(\d+)\s*AST/i);
  const stlMatch = subtext.match(/(\d+)\s*STL/i);
  const blkMatch = subtext.match(/(\d+)\s*BLK/i);
  const fgMatch = subtext.match(/FG:\s*(\d+)\/(\d+)\s*\((\d+)%\)/i);
  return {
    grade: gradeMatch?.[1] || null,
    reb: rebMatch ? parseInt(rebMatch[1]) : null,
    ast: astMatch ? parseInt(astMatch[1]) : null,
    stl: stlMatch ? parseInt(stlMatch[1]) : null,
    blk: blkMatch ? parseInt(blkMatch[1]) : null,
    fgPct: fgMatch ? parseInt(fgMatch[3]) : null,
  };
}

function parseBadgeHeadline(headline: string) {
  const match = headline.match(/^(.+?)\s+earned\s+the\s+(.+?)\s+badge!?$/i);
  if (match) return { name: match[1], badgeName: match[2] };
  return null;
}

function parseWorkoutHeadline(headline: string) {
  const match = headline.match(/^(.+?)\s+completed\s+a\s+(\d+)-min\s+(\w+)\s+Workout:\s+(.+)$/i);
  if (match) return { name: match[1], duration: match[2], workoutType: match[3], workoutName: match[4] };
  return null;
}

function parseWorkoutSubtext(subtext: string | null) {
  if (!subtext) return null;
  const match = subtext.match(/Intensity:\s*(\d+)\/(\d+)/i);
  if (match) return { intensity: parseInt(match[1]), max: parseInt(match[2]) };
  return null;
}

function parseStreakHeadline(headline: string) {
  const match = headline.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

function parsePollSubtext(subtext: string | null) {
  if (!subtext) return null;
  const match = subtext.match(/(\d+)\s+options/i);
  return match ? parseInt(match[1]) : null;
}

const GRADE_COLORS: Record<string, string> = {
  "A+": "text-emerald-600 dark:text-emerald-400", "A": "text-emerald-600 dark:text-emerald-400", "A-": "text-emerald-600 dark:text-emerald-400",
  "B+": "text-blue-600 dark:text-blue-400", "B": "text-blue-600 dark:text-blue-400", "B-": "text-blue-600 dark:text-blue-400",
  "C+": "text-yellow-600 dark:text-yellow-400", "C": "text-yellow-600 dark:text-yellow-400", "C-": "text-yellow-600 dark:text-yellow-400",
  "D+": "text-orange-600 dark:text-orange-400", "D": "text-orange-600 dark:text-orange-400", "D-": "text-orange-600 dark:text-orange-400",
  "F": "text-red-600 dark:text-red-400",
};

const GRADE_BG: Record<string, string> = {
  "A+": "bg-emerald-500/15", "A": "bg-emerald-500/15", "A-": "bg-emerald-500/15",
  "B+": "bg-blue-500/15", "B": "bg-blue-500/15", "B-": "bg-blue-500/15",
  "C+": "bg-yellow-500/15", "C": "bg-yellow-500/15", "C-": "bg-yellow-500/15",
  "D+": "bg-orange-500/15", "D": "bg-orange-500/15", "D-": "bg-orange-500/15",
  "F": "bg-red-500/15",
};

function GameContent({ activity }: { activity: FeedActivity }) {
  const game = parseGameHeadline(activity.headline);
  const stats = parseGameSubtext(activity.subtext);
  if (!game) return <p className="text-sm text-muted-foreground px-4" data-testid={`text-headline-${activity.id}`}>{activity.headline}</p>;

  return (
    <div className="px-4 pb-3 space-y-3">
      <p className="text-sm text-foreground" data-testid={`text-headline-${activity.id}`}>
        Dropped <span className="font-bold">{game.pts} PTS</span> vs <span className="font-semibold">{game.opponent}</span>
      </p>
      {activity.subtext && <p className="sr-only" data-testid={`text-subtext-${activity.id}`}>{activity.subtext}</p>}
      <div className="rounded-md bg-muted/50 p-3">
        <div className="flex items-center gap-2 mb-3">
          <Swords className="w-4 h-4 text-accent" />
          <span className="text-xs text-muted-foreground">vs {game.opponent}</span>
        </div>
        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-2xl font-bold text-foreground">{game.pts}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">PTS</p>
          </div>
          {stats?.reb != null && (
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.reb}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">REB</p>
            </div>
          )}
          {stats?.ast != null && (
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.ast}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">AST</p>
            </div>
          )}
          {stats?.grade && (
            <div className={cn("rounded-md flex flex-col items-center justify-center", GRADE_BG[stats.grade])}>
              <p className={cn("text-2xl font-bold", GRADE_COLORS[stats.grade] || "text-foreground")}>{stats.grade}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Grade</p>
            </div>
          )}
        </div>
        {(stats?.stl != null || stats?.blk != null || stats?.fgPct != null) && (
          <div className="flex items-center justify-center gap-4 pt-2 mt-2 border-t border-border/50 flex-wrap">
            {stats.stl != null && stats.stl > 0 && (
              <span className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{stats.stl}</span> STL
              </span>
            )}
            {stats.blk != null && stats.blk > 0 && (
              <span className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{stats.blk}</span> BLK
              </span>
            )}
            {stats.fgPct != null && (
              <span className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{stats.fgPct}%</span> FG
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BadgeContent({ activity }: { activity: FeedActivity }) {
  const parsed = parseBadgeHeadline(activity.headline);
  return (
    <div className="px-4 pb-3 space-y-3">
      <p className="sr-only" data-testid={`text-headline-${activity.id}`}>{activity.headline}</p>
      {activity.subtext && <p className="sr-only" data-testid={`text-subtext-${activity.id}`}>{activity.subtext}</p>}
      <div className="relative rounded-md bg-accent/10 p-4">
        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-md bg-accent/20 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-accent">{parsed?.badgeName || "Achievement"}</p>
            {activity.subtext && (
              <p className="text-xs text-muted-foreground mt-0.5">{activity.subtext}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkoutContent({ activity }: { activity: FeedActivity }) {
  const parsed = parseWorkoutHeadline(activity.headline);
  const intensity = parseWorkoutSubtext(activity.subtext);
  return (
    <div className="px-4 pb-3 space-y-3">
      <p className="sr-only" data-testid={`text-headline-${activity.id}`}>{activity.headline}</p>
      {activity.subtext && <p className="sr-only" data-testid={`text-subtext-${activity.id}`}>{activity.subtext}</p>}
      <div className="rounded-md bg-emerald-500/5 p-3 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-semibold text-foreground">{parsed?.workoutName || "Workout"}</span>
          </div>
          {parsed?.duration && (
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-sm font-bold">{parsed.duration} min</span>
            </div>
          )}
        </div>
        {parsed?.workoutType && (
          <Badge variant="secondary" className="text-xs">{parsed.workoutType}</Badge>
        )}
        {intensity && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">Intensity</span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{intensity.intensity}/{intensity.max}</span>
            </div>
            <Progress value={(intensity.intensity / intensity.max) * 100} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-emerald-400" />
          </div>
        )}
      </div>
    </div>
  );
}

function StreakContent({ activity }: { activity: FeedActivity }) {
  const streakCount = parseStreakHeadline(activity.headline);
  return (
    <div className="px-4 pb-3 space-y-2">
      <p className="sr-only" data-testid={`text-headline-${activity.id}`}>{activity.headline}</p>
      {activity.subtext && <p className="sr-only" data-testid={`text-subtext-${activity.id}`}>{activity.subtext}</p>}
      <div className="rounded-md bg-accent/10 p-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Flame className="w-7 h-7 text-accent" />
            {streakCount && (
              <span className="text-3xl font-bold text-accent">{streakCount}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Day Streak</p>
            {activity.subtext && (
              <p className="text-xs text-muted-foreground">{activity.subtext}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PollContent({ activity }: { activity: FeedActivity }) {
  const optionCount = parsePollSubtext(activity.subtext);
  return (
    <div className="px-4 pb-3 space-y-2">
      <p className="text-sm text-foreground" data-testid={`text-headline-${activity.id}`}>{activity.headline}</p>
      {activity.subtext && <p className="sr-only" data-testid={`text-subtext-${activity.id}`}>{activity.subtext}</p>}
      <div className="rounded-md bg-indigo-500/5 p-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-medium text-foreground">Poll</span>
          {optionCount && (
            <Badge variant="secondary" className="text-xs">{optionCount} options</Badge>
          )}
        </div>
      </div>
    </div>
  );
}

function RepostContent({ activity }: { activity: FeedActivity }) {
  return (
    <div className="px-4 pb-3 space-y-2">
      <p className="sr-only" data-testid={`text-headline-${activity.id}`}>{activity.headline}</p>
      {activity.subtext && <p className="sr-only" data-testid={`text-subtext-${activity.id}`}>{activity.subtext}</p>}
      <div className="rounded-md bg-muted/50 p-3">
        <div className="flex items-start gap-2">
          <Quote className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm text-foreground">{activity.headline}</p>
            {activity.subtext && (
              <p className="text-xs text-muted-foreground mt-1">{activity.subtext}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DefaultContent({ activity }: { activity: FeedActivity }) {
  return (
    <div className="px-4 pb-3 space-y-1">
      <p className="text-sm text-foreground" data-testid={`text-headline-${activity.id}`}>{activity.headline}</p>
      {activity.subtext && (
        <p className="text-xs text-muted-foreground" data-testid={`text-subtext-${activity.id}`}>{activity.subtext}</p>
      )}
    </div>
  );
}

function FeedStreakBanner({ currentPlayerId }: { currentPlayerId: number }) {
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/players/${currentPlayerId}/check-in`);
      return res.json();
    },
    onSuccess: () => {
      globalQueryClient.invalidateQueries({ queryKey: ['/api/players', currentPlayerId, 'activity-streaks'] });
    },
    onError: () => {},
  });

  useEffect(() => {
    checkInMutation.mutate();
  }, [currentPlayerId]);

  const { data: streaks } = useQuery<{ id: number; playerId: number; streakType: string; currentStreak: number; longestStreak: number }[]>({
    queryKey: ['/api/players', currentPlayerId, 'activity-streaks'],
    queryFn: async () => {
      const res = await fetch(`/api/players/${currentPlayerId}/activity-streaks`);
      if (!res.ok) throw new Error("Failed to fetch streaks");
      return res.json();
    },
  });

  const dailyStreak = streaks?.find(s => s.streakType === 'daily_login' || s.streakType === 'daily_game');
  const currentStreak = dailyStreak?.currentStreak || 0;

  if (currentStreak <= 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2",
        currentStreak >= 3 ? "bg-accent/10" : "bg-muted/50"
      )}
      data-testid="feed-streak-banner"
    >
      {currentStreak >= 7 ? (
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
          <Flame className="w-4 h-4 text-accent" />
        </motion.div>
      ) : (
        <Flame className={cn("w-4 h-4", currentStreak >= 3 ? "text-accent" : "text-muted-foreground")} />
      )}
      <span className={cn("text-sm font-bold", currentStreak >= 3 ? "text-accent" : "text-foreground")}>
        {currentStreak} day streak
      </span>
    </motion.div>
  );
}

type ProfileViewer = {
  id: number;
  viewedAt: string;
  viewerName: string | null;
  viewerAvatar: string | null;
  viewerRole: string | null;
  referrer: string | null;
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ProfileViewsCard({ currentPlayerId }: { currentPlayerId: number }) {
  const [expanded, setExpanded] = useState(false);

  const { data } = useQuery<{
    totalViews: number;
    viewsLast30Days: number;
    recentViewers: ProfileViewer[];
  }>({
    queryKey: ['/api/players', currentPlayerId, 'profile-views'],
    queryFn: async () => {
      const res = await fetch(`/api/players/${currentPlayerId}/profile-views`);
      if (!res.ok) throw new Error("Failed to fetch profile views");
      return res.json();
    },
  });

  if (!data || data.totalViews <= 0) return null;

  const viewers = data.recentViewers || [];
  const namedViewers = viewers.filter(v => v.viewerName);
  const anonymousCount = viewers.length - namedViewers.length;
  const displayViewers = expanded ? viewers : viewers.slice(0, 5);

  return (
    <Card className="border-accent/20 p-3" data-testid="card-profile-views">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-foreground">Profile Views</span>
          <Badge variant="secondary" className="text-xs">{data.totalViews}</Badge>
        </div>
        {data.viewsLast30Days > 0 && (
          <span className="text-xs text-muted-foreground">{data.viewsLast30Days} this month</span>
        )}
      </div>

      {viewers.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-1">
          {displayViewers.map((viewer) => (
            <div key={viewer.id} className="flex items-center gap-2.5">
              <Avatar className="w-7 h-7 flex-shrink-0">
                {viewer.viewerAvatar && (
                  <img src={viewer.viewerAvatar} alt="" className="w-full h-full object-cover rounded-full" />
                )}
                <AvatarFallback className="text-xs bg-muted">
                  {viewer.viewerName ? viewer.viewerName[0].toUpperCase() : '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-foreground">
                  {viewer.viewerName || 'Anonymous visitor'}
                </span>
                {viewer.viewerRole && (
                  <span className="ml-1.5 text-[10px] text-muted-foreground capitalize">{viewer.viewerRole}</span>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground flex-shrink-0">{timeAgo(viewer.viewedAt)}</span>
            </div>
          ))}
          {anonymousCount > 0 && !expanded && (
            <p className="text-xs text-muted-foreground pl-0.5">
              + {anonymousCount} anonymous {anonymousCount === 1 ? 'visitor' : 'visitors'}
            </p>
          )}
          {viewers.length > 5 && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-xs text-accent font-medium text-left mt-0.5"
            >
              {expanded ? 'Show less' : `Show all ${viewers.length} viewers`}
            </button>
          )}
        </div>
      )}
    </Card>
  );
}

function ActivityCard({ activity, index, currentUserName, currentPlayerId, isActive }: { activity: FeedActivity; index: number; currentUserName: string; currentPlayerId?: number | null; isActive?: boolean }) {
  const [, setLocation] = useLocation();
  const [showComments, setShowComments] = useState(false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const queryClient = useQueryClient();
  const sessionId = getSessionId();
  const lastTapRef = useRef<number>(0);

  const doubleTapLikeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', `/api/feed/${activity.id}/reactions`, {
        sessionId,
        reactionType: "heart",
        playerName: currentUserName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/feed', activity.id, 'reactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/feed', activity.id, 'user-reactions', sessionId] });
    },
  });

  const handleDoubleTapLike = () => {
    setShowDoubleTapHeart(true);
    doubleTapLikeMutation.mutate();
    setTimeout(() => setShowDoubleTapHeart(false), 800);
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activity.playerId) {
      setLocation(`/players/${activity.playerId}`);
    }
  };

  const shortTime = formatShortTime(activity.createdAt);
  const displayName = activity.playerName || "Unknown";
  const Icon = ACTIVITY_ICONS[activity.activityType] || Rss;
  const iconColor = ACTIVITY_COLORS[activity.activityType] || "text-muted-foreground";

  const renderContent = () => {
    switch (activity.activityType) {
      case "game": return <GameContent activity={activity} />;
      case "badge": return <BadgeContent activity={activity} />;
      case "workout": return <WorkoutContent activity={activity} />;
      case "streak": return <StreakContent activity={activity} />;
      case "poll": return <PollContent activity={activity} />;
      case "repost": return <RepostContent activity={activity} />;
      default: return <DefaultContent activity={activity} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.25 }}
    >
      <Card
        className="overflow-hidden transition-colors hover:border-white/10"
        data-testid={`card-activity-${activity.id}`}
      >
        <div className="flex items-center gap-3 p-4 pb-3 flex-wrap">
          <div
            className={cn("relative shrink-0", activity.playerId && "cursor-pointer")}
            onClick={handleProfileClick}
          >
            <Avatar className="w-9 h-9">
              <AvatarImage src={activity.playerPhoto ?? undefined} alt={displayName} />
              <AvatarFallback className="text-xs font-semibold bg-muted text-muted-foreground">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            {isActive && (
              <div className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-card" data-testid={`indicator-active-${activity.id}`} />
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-card border-2 border-card">
              <Icon className={cn("w-2.5 h-2.5", iconColor)} />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={cn("text-sm font-semibold text-foreground", activity.playerId && "cursor-pointer")}
                onClick={handleProfileClick}
                data-testid={`badge-player-${activity.id}`}
              >
                {displayName}
              </span>
              {activity.playerUsername && (
                <span className="text-xs text-muted-foreground">@{activity.playerUsername}</span>
              )}
            </div>
          </div>

          <span className="text-xs text-muted-foreground shrink-0" data-testid={`text-time-${activity.id}`}>
            {shortTime}
          </span>
        </div>

        <div className="relative" onDoubleClick={handleDoubleTapLike} onTouchEnd={(e) => {
            const now = Date.now();
            if (now - lastTapRef.current < 300) {
              handleDoubleTapLike();
              lastTapRef.current = 0;
            } else {
              lastTapRef.current = now;
            }
          }}>
          {renderContent()}
          <AnimatePresence>
            {showDoubleTapHeart && (
              <motion.div
                data-testid="double-tap-heart-overlay"
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: [0, 1.2, 1], opacity: [1, 1, 0] }}
                  transition={{ duration: 0.8, times: [0, 0.4, 1] }}
                >
                  <Heart className="w-20 h-20 text-white fill-white drop-shadow-lg" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="border-t border-border">
          <ActionBar
            activityId={activity.id}
            playerName={currentUserName}
            headline={activity.headline}
            showComments={showComments}
            onToggleComments={() => setShowComments(!showComments)}
            currentPlayerId={currentPlayerId}
          />
        </div>

        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-border"
            >
              <FeedComments activityId={activity.id} />
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

function AlertCard({ activity, index }: { activity: FeedActivity; index: number }) {
  const [, setLocation] = useLocation();
  const displayName = activity.playerName || "Unknown";
  const Icon = ACTIVITY_ICONS[activity.activityType] || Rss;
  const iconColor = ACTIVITY_COLORS[activity.activityType] || "text-muted-foreground";

  const handleProfileClick = () => {
    if (activity.playerId) {
      setLocation(`/players/${activity.playerId}`);
    }
  };

  const getAlertDescription = () => {
    switch (activity.activityType) {
      case "badge": {
        const parsed = parseBadgeHeadline(activity.headline);
        return parsed ? `Earned the ${parsed.badgeName} badge` : activity.headline;
      }
      case "streak": {
        const count = parseStreakHeadline(activity.headline);
        return count ? `${count}-day streak` : activity.headline;
      }
      case "goal":
        return activity.headline;
      case "challenge":
        return activity.headline;
      default:
        return activity.headline;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.2 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-md transition-colors flex-wrap",
        activity.playerId && "cursor-pointer hover-elevate"
      )}
      onClick={handleProfileClick}
      data-testid={`alert-item-${activity.id}`}
    >
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
        activity.activityType === 'badge' && "bg-accent/10",
        activity.activityType === 'streak' && "bg-accent/10",
        activity.activityType === 'goal' && "bg-emerald-500/10",
        activity.activityType === 'challenge' && "bg-purple-500/10",
      )}>
        <Icon className={cn("w-5 h-5", iconColor)} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">
          <span className="font-semibold">{displayName}</span>
          {activity.playerUsername && (
            <span className="text-muted-foreground ml-1">@{activity.playerUsername}</span>
          )}
        </p>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground truncate">{getAlertDescription()}</p>
          {activity.activityType === 'streak' && (() => {
            const streakCount = parseStreakHeadline(activity.headline);
            return streakCount ? (
              <Badge variant="secondary" className="text-[10px] gap-1 shrink-0" data-testid={`badge-streak-${activity.id}`}>
                <Flame className="w-3 h-3 text-accent" />
                {streakCount}
              </Badge>
            ) : null;
          })()}
        </div>
      </div>

      <span className="text-xs text-muted-foreground shrink-0">
        {formatShortTime(activity.createdAt)}
      </span>
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
  currentPlayerId?: number | null;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  variant?: 'post' | 'alert';
  activePlayerIds?: Set<number>;
}

function FeedList({ activities, isLoading, error, emptyMessage, emptyDescription, emptyIcon: EmptyIcon, currentUserName, currentPlayerId, hasNextPage, isFetchingNextPage, onLoadMore, variant = 'post', activePlayerIds }: FeedListProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!onLoadMore || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
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
      <Card className="p-8 text-center" data-testid="error-container">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <Rss className="w-8 h-8 text-destructive" />
          </div>
          <p className="text-muted-foreground">Failed to load activity feed</p>
        </div>
      </Card>
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
          {variant === 'alert' ? (
            <Card className="divide-y divide-border">
              {activities.map((activity, idx) => (
                <AlertCard key={activity.id} activity={activity} index={idx} />
              ))}
            </Card>
          ) : (
            activities.map((activity, idx) => (
              <ActivityCard key={activity.id} activity={activity} index={idx} currentUserName={currentUserName} currentPlayerId={currentPlayerId} isActive={activity.playerId ? activePlayerIds?.has(activity.playerId) : false} />
            ))
          )}
          {/* Auto-load sentinel — IntersectionObserver triggers fetch when visible */}
          <div ref={loadMoreRef} className="py-2 flex justify-center" aria-hidden>
            {isFetchingNextPage && (
              <div className="w-5 h-5 border-2 border-muted-foreground/20 border-t-muted-foreground/60 rounded-full animate-spin" data-testid="spinner-load-more" />
            )}
          </div>
          {!hasNextPage && activities.length > 5 && (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground" data-testid="text-caught-up">You're all caught up!</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <Card className="p-10 text-center" data-testid={`empty-state-feed`}>
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-blue-500/20 rounded-2xl blur-xl animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-border flex items-center justify-center">
            <EmptyIcon className="w-8 h-8 text-accent/60" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-foreground font-display font-bold text-lg">{emptyMessage}</p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {emptyDescription}
          </p>
        </div>
        <Button
          size="sm"
          className="h-8 px-4 text-xs bg-amber-500 hover:bg-amber-400 text-black font-bold"
          onClick={() => setLocation("/analyze")}
          data-testid="button-empty-log-game"
        >
          Log a Game
        </Button>
      </div>
    </Card>
  );
}

function useActivityHeartbeat(playerId: number | null | undefined) {
  const heartbeatMutation = useMutation({
    mutationFn: async () => {
      if (!playerId) return;
      await apiRequest("POST", `/api/players/${playerId}/heartbeat`);
    },
  });

  useEffect(() => {
    if (!playerId) return;
    heartbeatMutation.mutate();
    const interval = setInterval(() => {
      heartbeatMutation.mutate();
    }, 60000);
    return () => clearInterval(interval);
  }, [playerId]);
}

const TAB_ICONS = {
  all: Rss,
  following: UserCheck,
  team: UsersRound,
  alerts: Bell,
};

const TAB_LABELS = {
  all: "All",
  following: "Following",
  team: "Team",
  alerts: "Alerts",
};

const CONTENT_FILTERS = [
  { id: "all", label: "All" },
  { id: "game", label: "Games" },
  { id: "badge", label: "Badges" },
  { id: "workout", label: "Workouts" },
  { id: "streak", label: "Streaks" },
] as const;

type ContentFilter = typeof CONTENT_FILTERS[number]["id"];

export default function FeedContent() {
  const [activeTab, setActiveTab] = useState("all");
  const [contentFilter, setContentFilter] = useState<ContentFilter>("all");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currentUserName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous' : 'Anonymous';
  const { shouldShow: shouldShowGettingStarted } = useGuidedOnboarding();

  useActivityHeartbeat(user?.playerId);

  const { 
    data: allData,
    isLoading: allLoading, 
    error: allError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<{ items: FeedActivity[]; nextCursor?: number; hasMore: boolean }>({
    queryKey: ["/api/feed/following"],
    queryFn: async ({ pageParam }) => {
      const url = pageParam ? `/api/feed/following?cursor=${pageParam}&limit=20` : `/api/feed/following?limit=20`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch feed");
      return res.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as number | undefined,
  });

  const allActivities = allData?.pages.flatMap(page => page.items);

  const playerIds = Array.from(new Set(
    (allActivities || []).map(a => a.playerId).filter((id): id is number => id != null)
  ));

  const { data: activityStatusData } = useQuery<{ playerId: number; lastActiveAt: string | null }[]>({
    queryKey: ['/api/players/activity-status', playerIds.join(',')],
    queryFn: async () => {
      if (playerIds.length === 0) return [];
      const res = await fetch(`/api/players/activity-status?ids=${playerIds.join(',')}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: playerIds.length > 0,
    refetchInterval: 60000,
  });

  const activePlayerIds = new Set(
    (activityStatusData || [])
      .filter(s => s.lastActiveAt && (Date.now() - new Date(s.lastActiveAt).getTime()) < 5 * 60 * 1000)
      .map(s => s.playerId)
  );

  const latestId = allData?.pages[0]?.items[0]?.id;

  const { data: newCountData } = useQuery<{ count: number }>({
    queryKey: ["/api/feed/new-count", latestId, "social"],
    queryFn: async () => {
      if (!latestId) return { count: 0 };
      const res = await fetch(`/api/feed/new-count?since=${latestId}&type=social`);
      if (!res.ok) return { count: 0 };
      return res.json();
    },
    refetchInterval: 30000,
    enabled: !!latestId,
  });

  const newPostsCount = newCountData?.count || 0;

  const handleLoadNewPosts = () => {
    queryClient.resetQueries({ queryKey: ["/api/feed", "social"] });
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

  const {
    data: alertsData,
    isLoading: alertsLoading,
    error: alertsError,
    fetchNextPage: fetchNextAlerts,
    hasNextPage: hasNextAlerts,
    isFetchingNextPage: isFetchingNextAlerts,
  } = useInfiniteQuery<{ items: FeedActivity[]; nextCursor?: number; hasMore: boolean }>({
    queryKey: ["/api/feed", "alerts"],
    queryFn: async ({ pageParam }) => {
      const url = pageParam ? `/api/feed?cursor=${pageParam}&limit=30&type=alerts` : `/api/feed?limit=30&type=alerts`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch alerts");
      return res.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as number | undefined,
    enabled: activeTab === "alerts",
  });

  const alertActivities = alertsData?.pages.flatMap(page => page.items);

  const handleRefresh = async () => {
    await globalQueryClient.invalidateQueries({ queryKey: ['/api/feed'] });
    await globalQueryClient.invalidateQueries({ queryKey: ['/api/stories/active'] });
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-5" data-testid="feed-content">
      <StoriesRow currentPlayerId={user?.playerId} currentUserName={currentUserName} />
      {user?.playerId && <FeedStreakBanner currentPlayerId={user.playerId} />}
      {user?.playerId && <ProfileViewsCard currentPlayerId={user.playerId} />}
      <GettingStartedCard />
      {user?.playerId && !shouldShowGettingStarted && <DiscoveryCards currentPlayerId={user.playerId} />}
      {user?.playerId && (
        <div className="flex items-center flex-wrap gap-3">
          <StreakDisplay playerId={user.playerId} />
          <ChallengeButton />
        </div>
      )}
      {user?.playerId && <WeeklyRecapCard playerId={user.playerId} />}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList
          className="w-full justify-start bg-transparent p-0 gap-1.5 overflow-x-auto flex-nowrap no-scrollbar h-auto"
          data-testid="tabs-feed"
        >
          {(["all", "following", "team", "alerts"] as const).map((tab) => {
            const Icon = TAB_ICONS[tab];
            return (
              <TabsTrigger
                key={tab}
                value={tab}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium border border-transparent transition-all duration-200
                  text-muted-foreground/70 hover:text-foreground hover:bg-muted/50
                  data-[state=active]:bg-amber-500 data-[state=active]:text-black data-[state=active]:border-amber-500/0 data-[state=active]:font-semibold
                  data-[state=active]:shadow-[0_0_12px_rgba(198,208,216,0.25)]"
                data-testid={`tab-${tab}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{TAB_LABELS[tab]}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="space-y-3" data-testid="container-activities-all">
            {/* Content-type filter chips */}
            <div className="flex gap-1.5 overflow-x-auto flex-nowrap no-scrollbar pb-0.5">
              {CONTENT_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setContentFilter(f.id)}
                  className={cn(
                    "whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium border transition-all duration-150 shrink-0",
                    contentFilter === f.id
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                      : "border-white/8 text-muted-foreground/60 hover:text-muted-foreground hover:border-white/15"
                  )}
                  data-testid={`filter-${f.id}`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {newPostsCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-50"
              >
                <Button
                  onClick={handleLoadNewPosts}
                  className="w-full rounded-full bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                  data-testid="button-new-posts"
                >
                  <ArrowUp className="w-4 h-4 mr-2" />
                  {newPostsCount} new {newPostsCount === 1 ? 'post' : 'posts'}
                </Button>
              </motion.div>
            )}
            <FeedList
              activities={contentFilter === "all" ? allActivities : allActivities?.filter(a => a.activityType === contentFilter)}
              isLoading={allLoading}
              error={allError}
              emptyMessage="Your feed is quiet"
              emptyDescription="Follow players or log a game to see activity here!"
              emptyIcon={Rss}
              currentUserName={currentUserName}
              currentPlayerId={user?.playerId}
              hasNextPage={contentFilter === "all" ? hasNextPage : false}
              isFetchingNextPage={isFetchingNextPage}
              onLoadMore={() => fetchNextPage()}
              activePlayerIds={activePlayerIds}
            />
          </div>
        </TabsContent>

        <TabsContent value="following" className="mt-4">
          <div className="space-y-3" data-testid="container-activities-following">
            <FeedList
              activities={followingActivities}
              isLoading={followingLoading}
              error={followingError}
              emptyMessage="No updates yet"
              emptyDescription="Follow players to see their game recaps, badges, and highlights here!"
              emptyIcon={UserCheck}
              currentUserName={currentUserName}
              currentPlayerId={user?.playerId}
              activePlayerIds={activePlayerIds}
            />
          </div>
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          <div className="space-y-3" data-testid="container-activities-team">
            <FeedList
              activities={teamActivities}
              isLoading={teamLoading}
              error={teamError}
              emptyMessage="No team activity yet"
              emptyDescription="When teammates log games or earn badges, their updates will show up here!"
              emptyIcon={UsersRound}
              currentUserName={currentUserName}
              currentPlayerId={user?.playerId}
              activePlayerIds={activePlayerIds}
            />
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          <div className="space-y-3" data-testid="container-activities-alerts">
            <FeedList
              activities={alertActivities}
              isLoading={alertsLoading}
              error={alertsError}
              emptyMessage="No alerts yet"
              emptyDescription="Earn badges and hit streaks to see updates here!"
              emptyIcon={Bell}
              currentUserName={currentUserName}
              currentPlayerId={user?.playerId}
              hasNextPage={hasNextAlerts}
              isFetchingNextPage={isFetchingNextAlerts}
              onLoadMore={() => fetchNextAlerts()}
              variant="alert"
            />
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </PullToRefresh>
  );
}

