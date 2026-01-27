import { useState } from "react";
import { Heart, MessageCircle, Trash2, Send, ChevronDown, ChevronUp, Repeat2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import type { Comment } from "@shared/schema";

function getSessionId(): string {
  const key = "caliber_session_id";
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface SocialEngagementProps {
  gameId: number;
  compact?: boolean;
}

export function SocialEngagement({ gameId, compact = false }: SocialEngagementProps) {
  const sessionId = getSessionId();
  const [showComments, setShowComments] = useState(false);
  const [authorName, setAuthorName] = useState(() => {
    return localStorage.getItem("caliber_author_name") || "";
  });
  const [commentText, setCommentText] = useState("");
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [isRepostAnimating, setIsRepostAnimating] = useState(false);

  const { data: likesData } = useQuery<{ likeCount: number; hasLiked: boolean }>({
    queryKey: ["/api/games", gameId, "likes", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/games/${gameId}/likes?sessionId=${sessionId}`);
      if (!res.ok) throw new Error("Failed to fetch likes");
      return res.json();
    },
  });

  const { data: repostsData } = useQuery<{ repostCount: number }>({
    queryKey: ["/api/games", gameId, "reposts"],
    queryFn: async () => {
      const res = await fetch(`/api/games/${gameId}/reposts`);
      if (!res.ok) throw new Error("Failed to fetch reposts");
      return res.json();
    },
  });

  const { data: hasRepostedData } = useQuery<{ hasReposted: boolean }>({
    queryKey: ["/api/games", gameId, "has-reposted", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/games/${gameId}/has-reposted?sessionId=${sessionId}`);
      if (!res.ok) throw new Error("Failed to check repost status");
      return res.json();
    },
  });

  const { data: commentsData = [] } = useQuery<Comment[]>({
    queryKey: ["/api/games", gameId, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/games/${gameId}/comments`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json();
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/games/${gameId}/likes`, { sessionId });
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/games", gameId, "likes", sessionId] });
      
      // Get current data
      const previousData = queryClient.getQueryData<{ likeCount: number; hasLiked: boolean }>(["/api/games", gameId, "likes", sessionId]);
      
      // Optimistically update
      queryClient.setQueryData(["/api/games", gameId, "likes", sessionId], (old: { likeCount: number; hasLiked: boolean } | undefined) => ({
        likeCount: (old?.likeCount || 0) + (old?.hasLiked ? -1 : 1),
        hasLiked: !old?.hasLiked
      }));
      
      setIsLikeAnimating(true);
      setTimeout(() => setIsLikeAnimating(false), 300);
      
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(["/api/games", gameId, "likes", sessionId], context.previousData);
      }
    },
    onSettled: () => {
      // Sync with server
      queryClient.invalidateQueries({ queryKey: ["/api/games", gameId, "likes", sessionId] });
    },
  });

  const repostMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/games/${gameId}/repost`, { sessionId });
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/games", gameId, "reposts"] });
      await queryClient.cancelQueries({ queryKey: ["/api/games", gameId, "has-reposted", sessionId] });
      
      // Get current data
      const previousReposts = queryClient.getQueryData<{ repostCount: number }>(["/api/games", gameId, "reposts"]);
      const previousHasReposted = queryClient.getQueryData<{ hasReposted: boolean }>(["/api/games", gameId, "has-reposted", sessionId]);
      
      // Optimistically update
      queryClient.setQueryData(["/api/games", gameId, "reposts"], (old: { repostCount: number } | undefined) => ({
        repostCount: (old?.repostCount || 0) + 1
      }));
      queryClient.setQueryData(["/api/games", gameId, "has-reposted", sessionId], { hasReposted: true });
      
      setIsRepostAnimating(true);
      setTimeout(() => setIsRepostAnimating(false), 300);
      
      return { previousReposts, previousHasReposted };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousReposts) {
        queryClient.setQueryData(["/api/games", gameId, "reposts"], context.previousReposts);
      }
      if (context?.previousHasReposted) {
        queryClient.setQueryData(["/api/games", gameId, "has-reposted", sessionId], context.previousHasReposted);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games", gameId, "reposts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games", gameId, "has-reposted", sessionId] });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async () => {
      localStorage.setItem("caliber_author_name", authorName);
      return apiRequest("POST", `/api/games/${gameId}/comments`, {
        authorName,
        content: commentText,
        sessionId,
      });
    },
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["/api/games", gameId, "comments"] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const res = await fetch(`/api/comments/${commentId}?sessionId=${sessionId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete comment");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games", gameId, "comments"] });
    },
  });

  const likeCount = likesData?.likeCount || 0;
  const hasLiked = likesData?.hasLiked || false;
  const repostCount = repostsData?.repostCount || 0;
  const hasReposted = hasRepostedData?.hasReposted || false;
  const commentCount = commentsData.length;

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !commentText.trim()) return;
    addCommentMutation.mutate();
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          data-testid={`like-button-compact-${gameId}`}
          onClick={() => toggleLikeMutation.mutate()}
          className={cn(
            "flex items-center gap-1 h-auto py-1 px-2",
            hasLiked && "text-red-500"
          )}
        >
          <Heart
            className={cn(
              "w-4 h-4 transition-transform",
              hasLiked && "fill-current",
              isLikeAnimating && "scale-125"
            )}
          />
          <span>{likeCount}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          data-testid={`repost-button-compact-${gameId}`}
          onClick={() => !hasReposted && repostMutation.mutate()}
          disabled={hasReposted || repostMutation.isPending}
          className={cn(
            "flex items-center gap-1 h-auto py-1 px-2",
            hasReposted && "text-green-500"
          )}
        >
          <Repeat2
            className={cn(
              "w-4 h-4 transition-transform",
              isRepostAnimating && "scale-125"
            )}
          />
          <span>{repostCount}</span>
        </Button>
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <MessageCircle className="w-4 h-4" />
          <span>{commentCount}</span>
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <Button
          data-testid={`like-button-${gameId}`}
          variant="ghost"
          size="sm"
          onClick={() => toggleLikeMutation.mutate()}
          disabled={toggleLikeMutation.isPending}
          className={cn(
            "gap-2",
            hasLiked && "text-red-500"
          )}
        >
          <Heart
            className={cn(
              "w-5 h-5 transition-transform",
              hasLiked && "fill-current",
              isLikeAnimating && "scale-125"
            )}
          />
          <span>{likeCount}</span>
        </Button>

        <Button
          data-testid={`repost-button-${gameId}`}
          variant="ghost"
          size="sm"
          onClick={() => !hasReposted && repostMutation.mutate()}
          disabled={hasReposted || repostMutation.isPending}
          className={cn(
            "gap-2",
            hasReposted && "text-green-500"
          )}
        >
          <Repeat2
            className={cn(
              "w-5 h-5 transition-transform",
              isRepostAnimating && "scale-125"
            )}
          />
          <span>{repostCount}</span>
        </Button>

        <Button
          data-testid={`comments-toggle-${gameId}`}
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
          className="gap-2"
        >
          <MessageCircle className="w-5 h-5" />
          <span>{commentCount}</span>
          {showComments ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </div>

      {showComments && (
        <div className="space-y-4 pl-2 border-l-2 border-muted">
          <form onSubmit={handleSubmitComment} className="space-y-2">
            <div className="flex gap-2">
              <Input
                data-testid={`comment-author-input-${gameId}`}
                placeholder="Your name"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="max-w-[150px]"
              />
              <div className="flex-1 flex gap-2">
                <Textarea
                  data-testid={`comment-text-input-${gameId}`}
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[38px] h-[38px] resize-none"
                  rows={1}
                />
                <Button
                  data-testid={`comment-submit-${gameId}`}
                  type="submit"
                  size="icon"
                  disabled={!authorName.trim() || !commentText.trim() || addCommentMutation.isPending}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </form>

          {commentsData.length > 0 ? (
            <div className="space-y-3">
              {commentsData.map((comment) => (
                <div
                  key={comment.id}
                  data-testid={`comment-${comment.id}`}
                  className="flex gap-3 group"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getInitials(comment.authorName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{comment.authorName}</span>
                      <span className="text-xs text-muted-foreground">
                        {comment.createdAt ? format(new Date(comment.createdAt), "MMM d, h:mm a") : "Just now"}
                      </span>
                      {comment.sessionId === sessionId && (
                        <Button
                          data-testid={`delete-comment-${comment.id}`}
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteCommentMutation.mutate(comment.id)}
                          disabled={deleteCommentMutation.isPending}
                        >
                          <Trash2 className="w-3 h-3 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              No comments yet. Be the first to comment!
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function LikeCount({ gameId }: { gameId: number }) {
  const { data: likesData } = useQuery<{ likeCount: number; hasLiked: boolean }>({
    queryKey: ["/api/games", gameId, "likes", "anonymous"],
    queryFn: async () => {
      const res = await fetch(`/api/games/${gameId}/likes`);
      if (!res.ok) throw new Error("Failed to fetch likes");
      return res.json();
    },
  });

  const likeCount = likesData?.likeCount || 0;

  if (likeCount === 0) return null;

  return (
    <div className="flex items-center gap-1 text-red-400" data-testid={`like-count-${gameId}`}>
      <Heart className="w-4 h-4 fill-current" />
      <span className="text-sm font-medium">{likeCount}</span>
    </div>
  );
}
