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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Target, Award, Repeat2, BarChart3, Users, Camera, Flame, Trophy, Zap, Rss, UserCheck, UsersRound, Heart, ArrowUp, MessageCircle, Send, Trash2, Reply, Bookmark, Dumbbell, Clock, Swords, Quote, Bell, MoreHorizontal, Share2, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient as globalQueryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import WeeklyRecapCard from "@/components/WeeklyRecapCard";
import StreakDisplay from "@/components/StreakDisplay";
import ChallengeButton from "@/components/ChallengeButton";
import type { PlayerStory } from "@shared/schema";

type StoryWithPlayer = PlayerStory & { playerName: string };

interface StoryPlayer {
  playerId: number;
  playerName: string;
  hasActiveStory: boolean;
}

function StoriesRow({ currentPlayerId, currentUserName }: { currentPlayerId?: number | null; currentUserName: string }) {
  const [, setLocation] = useLocation();

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
        hasActiveStory: true,
      });
    }
  }

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
    <div className="flex gap-4 pb-2 overflow-x-auto scrollbar-hide" data-testid="stories-row">
      {currentPlayerId && (
        <button
          onClick={() => setLocation("/community?tab=stories")}
          className="flex flex-col items-center gap-1.5 shrink-0"
          data-testid="story-avatar-your"
        >
          <div className="relative">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="text-sm font-semibold bg-muted text-muted-foreground">
                {getInitials(currentUserName)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-accent flex items-center justify-center border-2 border-background">
              <Plus className="w-3 h-3 text-accent-foreground" />
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground truncate max-w-[64px]">Your Story</span>
        </button>
      )}
      {storyPlayers.map((sp) => (
        <button
          key={sp.playerId}
          onClick={() => setLocation(`/players/${sp.playerId}`)}
          className="flex flex-col items-center gap-1.5 shrink-0"
          data-testid={`story-avatar-${sp.playerId}`}
        >
          <Avatar className={cn("w-16 h-16", sp.hasActiveStory && "ring-2 ring-accent ring-offset-2 ring-offset-background")}>
            <AvatarFallback className="text-sm font-semibold bg-muted text-muted-foreground">
              {getInitials(sp.playerName)}
            </AvatarFallback>
          </Avatar>
          <span className="text-[11px] text-muted-foreground truncate max-w-[64px]">
            {sp.playerName.split(" ")[0]}
          </span>
        </button>
      ))}
    </div>
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
  game: "text-orange-400",
  badge: "text-yellow-400",
  streak: "text-red-400",
  goal: "text-emerald-400",
  challenge: "text-purple-400",
  repost: "text-blue-400",
  poll: "text-indigo-400",
  prediction: "text-pink-400",
  story: "text-accent",
  workout: "text-emerald-400",
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
              <motion.div
                animate={likeAnimating ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Heart className={cn("w-5 h-5", hasLiked ? "text-red-500 fill-red-500" : "")} />
              </motion.div>
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={onToggleComments}
              aria-label="Comments"
              data-testid={`button-comments-${activityId}`}
            >
              <MessageCircle className={cn("w-5 h-5", showComments ? "text-primary" : "")} />
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
  return {
    grade: gradeMatch?.[1] || null,
    reb: rebMatch ? parseInt(rebMatch[1]) : null,
    ast: astMatch ? parseInt(astMatch[1]) : null,
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
  "A+": "text-emerald-400", "A": "text-emerald-400", "A-": "text-emerald-400",
  "B+": "text-blue-400", "B": "text-blue-400", "B-": "text-blue-400",
  "C+": "text-yellow-400", "C": "text-yellow-400", "C-": "text-yellow-400",
  "D+": "text-orange-400", "D": "text-orange-400", "D-": "text-orange-400",
  "F": "text-red-400",
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
          <Swords className="w-4 h-4 text-orange-400" />
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
      <div className="relative rounded-md bg-amber-500/10 p-4">
        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-md bg-amber-500/20 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-amber-400">{parsed?.badgeName || "Achievement"}</p>
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
            <Dumbbell className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-foreground">{parsed?.workoutName || "Workout"}</span>
          </div>
          {parsed?.duration && (
            <div className="flex items-center gap-1.5 text-emerald-400">
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
              <span className="text-xs font-semibold text-emerald-400">{intensity.intensity}/{intensity.max}</span>
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
      <div className="rounded-md bg-orange-500/10 p-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Flame className="w-7 h-7 text-orange-400" />
            {streakCount && (
              <span className="text-3xl font-bold text-orange-400">{streakCount}</span>
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
          <BarChart3 className="w-5 h-5 text-indigo-400" />
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
          <Quote className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
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

function ActivityCard({ activity, index, currentUserName, currentPlayerId }: { activity: FeedActivity; index: number; currentUserName: string; currentPlayerId?: number | null }) {
  const [, setLocation] = useLocation();
  const [showComments, setShowComments] = useState(false);

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
        className="overflow-hidden"
        data-testid={`card-activity-${activity.id}`}
      >
        <div className="flex items-center gap-3 p-4 pb-3 flex-wrap">
          <div
            className={cn("relative shrink-0", activity.playerId && "cursor-pointer")}
            onClick={handleProfileClick}
          >
            <Avatar className="w-9 h-9">
              <AvatarFallback className="text-xs font-semibold bg-muted text-muted-foreground">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
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

        {renderContent()}

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
        activity.activityType === 'badge' && "bg-amber-500/10",
        activity.activityType === 'streak' && "bg-orange-500/10",
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
                <Flame className="w-3 h-3 text-orange-400" />
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
}

function FeedList({ activities, isLoading, error, emptyMessage, emptyDescription, emptyIcon: EmptyIcon, currentUserName, currentPlayerId, hasNextPage, isFetchingNextPage, onLoadMore, variant = 'post' }: FeedListProps) {
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
              <ActivityCard key={activity.id} activity={activity} index={idx} currentUserName={currentUserName} currentPlayerId={currentPlayerId} />
            ))
          )}
          {onLoadMore && hasNextPage && (
            <div ref={loadMoreRef} className="py-4 flex justify-center">
              <Button
                variant="outline"
                onClick={onLoadMore}
                disabled={isFetchingNextPage}
                data-testid="button-load-more"
              >
                {isFetchingNextPage ? (
                  <>
                    <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin mr-2" />
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
    <Card className="p-10 text-center" data-testid={`empty-state-feed`}>
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-blue-500/20 rounded-2xl blur-xl animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-border flex items-center justify-center">
            <EmptyIcon className="w-8 h-8 text-accent/60" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-foreground font-bold text-lg">{emptyMessage}</p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {emptyDescription}
          </p>
        </div>
      </div>
    </Card>
  );
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
    queryKey: ["/api/feed", "social"],
    queryFn: async ({ pageParam }) => {
      const url = pageParam ? `/api/feed?cursor=${pageParam}&limit=20&type=social` : `/api/feed?limit=20&type=social`;
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

  return (
    <div className="space-y-5" data-testid="feed-content">
      <StoriesRow currentPlayerId={user?.playerId} currentUserName={currentUserName} />
      {user?.playerId && (
        <div className="flex items-center flex-wrap gap-3">
          <StreakDisplay playerId={user.playerId} />
          <ChallengeButton />
        </div>
      )}
      {user?.playerId && <WeeklyRecapCard playerId={user.playerId} />}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList 
          className="w-full h-auto p-1 bg-muted/50 border border-border rounded-md grid grid-cols-4 gap-1" 
          data-testid="tabs-feed"
        >
          {(["all", "following", "team", "alerts"] as const).map((tab) => {
            const Icon = TAB_ICONS[tab];
            return (
              <TabsTrigger
                key={tab}
                value={tab}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-md transition-all text-sm",
                  "data-[state=active]:bg-background data-[state=active]:shadow-sm",
                )}
                data-testid={`tab-${tab}`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium hidden sm:inline">{TAB_LABELS[tab]}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="space-y-3" data-testid="container-activities-all">
            {newPostsCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-50"
              >
                <Button
                  onClick={handleLoadNewPosts}
                  className="w-full rounded-md"
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
              emptyMessage="Your feed is quiet"
              emptyDescription="Follow players or log a game to see activity here!"
              emptyIcon={Rss}
              currentUserName={currentUserName}
              currentPlayerId={user?.playerId}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onLoadMore={() => fetchNextPage()}
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
  );
}
