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
import { Target, Award, Repeat2, BarChart3, Users, Camera, Flame, Trophy, Zap, Rss, UserCheck, UsersRound, Activity, Heart, ThumbsUp, HandMetal, ArrowUp, MessageCircle, Send, Trash2, Reply, Bookmark, Dumbbell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient as globalQueryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import WeeklyRecapCard from "@/components/WeeklyRecapCard";
import StreakDisplay from "@/components/StreakDisplay";
import ChallengeButton from "@/components/ChallengeButton";

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
  workout: Dumbbell,
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
  workout: "from-emerald-500/30 to-emerald-600/10",
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
  workout: "text-emerald-400",
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
  workout: "#10B981",
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
        <AvatarFallback className="text-[10px] bg-white/10 text-white/70">
          {getInitials(comment.authorName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-white" data-testid={`comment-author-${comment.id}`}>{comment.authorName}</span>
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>
        <p className="text-xs text-white/80 mt-0.5" data-testid={`comment-content-${comment.id}`}>{comment.content}</p>
        <div className="flex items-center gap-3 mt-1">
          <button
            onClick={() => likeCommentMutation.mutate(comment.id)}
            className="flex items-center gap-1 text-[10px] text-muted-foreground transition-colors"
            data-testid={`button-like-comment-${comment.id}`}
          >
            <Heart className="w-3 h-3" />
            {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
          </button>
          {!isReply && (
            <button
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="flex items-center gap-1 text-[10px] text-muted-foreground transition-colors"
              data-testid={`button-reply-${comment.id}`}
            >
              <Reply className="w-3 h-3" />
              Reply
            </button>
          )}
          {comment.sessionId === sessionId && (
            <button
              onClick={() => deleteCommentMutation.mutate(comment.id)}
              className="flex items-center gap-1 text-[10px] text-muted-foreground transition-colors invisible group-hover:visible"
              data-testid={`button-delete-comment-${comment.id}`}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
        {replyingTo === comment.id && (
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Your name"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="max-w-[120px] bg-white/5 border-white/10 text-xs"
              data-testid={`reply-author-input-${comment.id}`}
            />
            <Input
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 bg-white/5 border-white/10 text-xs"
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
    <div className="space-y-3 mt-3 pt-3 border-t border-white/5" data-testid={`comments-section-${activityId}`}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="Your name"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          className="max-w-[120px] bg-white/5 border-white/10 text-xs"
          data-testid={`comment-author-input-${activityId}`}
        />
        <Input
          placeholder="Add a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="flex-1 bg-white/5 border-white/10 text-xs"
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
      <DialogContent className="bg-gradient-to-br from-black/95 to-black/80 border-white/10" data-testid={`dialog-repost-${activityId}`}>
        <DialogHeader>
          <DialogTitle className="text-white">Share to Feed</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-sm text-muted-foreground" data-testid={`text-repost-original-${activityId}`}>{headline}</p>
          </div>
          <Textarea
            placeholder="Add a caption (optional)..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="bg-white/5 border-white/10 resize-none text-sm"
            rows={3}
            data-testid={`textarea-repost-caption-${activityId}`}
          />
          <Button
            onClick={() => repostMutation.mutate()}
            disabled={repostMutation.isPending}
            className="w-full bg-gradient-to-r from-cyan-600 to-cyan-700"
            data-testid={`button-submit-repost-${activityId}`}
          >
            {repostMutation.isPending ? "Sharing..." : "Share to Feed"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReactionButtons({ 
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
  const [clickedReaction, setClickedReaction] = useState<string | null>(null);
  const [repostOpen, setRepostOpen] = useState(false);

  const { data: commentCountData } = useQuery<{ count: number }>({
    queryKey: ['/api/feed', activityId, 'comments', 'count'],
    queryFn: async () => {
      const res = await fetch(`/api/feed/${activityId}/comments/count`);
      if (!res.ok) return { count: 0 };
      return res.json();
    },
  });

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

  const commentCount = commentCountData?.count || 0;

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

        <motion.button
          onClick={onToggleComments}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all",
            "bg-white/5 border border-white/10",
            showComments && "bg-cyan-500/20 border-cyan-500/40",
          )}
          data-testid={`button-comments-${activityId}`}
          whileTap={{ scale: 0.92 }}
        >
          <MessageCircle className="w-4 h-4 text-cyan-400" />
          {commentCount > 0 && (
            <span className="text-white/80">{commentCount}</span>
          )}
        </motion.button>

        <motion.button
          onClick={() => setRepostOpen(true)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all",
            "bg-white/5 border border-white/10",
          )}
          data-testid={`button-repost-${activityId}`}
          whileTap={{ scale: 0.92 }}
        >
          <Repeat2 className="w-4 h-4 text-blue-400" />
        </motion.button>

        {currentPlayerId && (
          <motion.button
            onClick={() => toggleSaveMutation.mutate()}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all",
              "bg-white/5 border border-white/10",
              savedData?.saved && "bg-amber-500/20 border-amber-500/40",
            )}
            data-testid={`button-save-${activityId}`}
            whileTap={{ scale: 0.92 }}
            disabled={toggleSaveMutation.isPending}
          >
            <Bookmark className={cn("w-4 h-4", savedData?.saved ? "text-amber-400 fill-amber-400" : "text-amber-400")} />
          </motion.button>
        )}
      </div>

      <RepostDialog
        activityId={activityId}
        headline={headline}
        playerName={playerName}
        open={repostOpen}
        onOpenChange={setRepostOpen}
      />
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

function ActivityCard({ activity, index, currentUserName, currentPlayerId }: { activity: FeedActivity; index: number; currentUserName: string; currentPlayerId?: number | null }) {
  const [, setLocation] = useLocation();
  const [showComments, setShowComments] = useState(false);
  
  const Icon = ACTIVITY_ICONS[activity.activityType] || Rss;
  const gradient = ACTIVITY_GRADIENTS[activity.activityType] || "from-gray-500/30 to-gray-600/10";
  const iconColor = ACTIVITY_COLORS[activity.activityType] || "text-gray-400";
  const glowColor = ACTIVITY_GLOW[activity.activityType] || "#6B7280";

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-testid^="button-reaction"]') ||
        target.closest('[data-testid^="button-comments"]') ||
        target.closest('[data-testid^="button-repost"]') ||
        target.closest('[data-testid^="comments-section"]') ||
        target.closest('[data-testid^="comment-"]') ||
        target.closest('[data-testid^="button-like-comment"]') ||
        target.closest('[data-testid^="button-reply"]') ||
        target.closest('[data-testid^="button-delete-comment"]') ||
        target.closest('[data-testid^="button-submit"]') ||
        target.closest('[data-testid^="reply-"]') ||
        target.closest('input') ||
        target.closest('textarea')) {
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
              headline={activity.headline}
              showComments={showComments}
              onToggleComments={() => setShowComments(!showComments)}
              currentPlayerId={currentPlayerId}
            />

            <AnimatePresence>
              {showComments && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FeedComments activityId={activity.id} />
                </motion.div>
              )}
            </AnimatePresence>
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
  currentPlayerId?: number | null;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
}

function FeedList({ activities, isLoading, error, emptyMessage, emptyDescription, emptyIcon: EmptyIcon, currentUserName, currentPlayerId, hasNextPage, isFetchingNextPage, onLoadMore }: FeedListProps) {
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
            <ActivityCard key={activity.id} activity={activity} index={idx} currentUserName={currentUserName} currentPlayerId={currentPlayerId} />
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

      {user?.playerId && (
        <div className="flex items-center flex-wrap gap-3">
          <StreakDisplay playerId={user.playerId} />
          <ChallengeButton />
        </div>
      )}
      {user?.playerId && <WeeklyRecapCard playerId={user.playerId} />}

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
              currentPlayerId={user?.playerId}
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
              currentPlayerId={user?.playerId}
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
              currentPlayerId={user?.playerId}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
