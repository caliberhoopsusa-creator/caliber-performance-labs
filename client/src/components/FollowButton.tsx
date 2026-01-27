import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  playerId: number;
  initialIsFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  className?: string;
}

export function FollowButton({ playerId, initialIsFollowing, onFollowChange, className }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);

  const followMutation = useMutation({
    mutationFn: async (newFollowState: boolean) => {
      if (!newFollowState) {
        await apiRequest("DELETE", `/api/players/${playerId}/follow`);
      } else {
        await apiRequest("POST", `/api/players/${playerId}/follow`);
      }
    },
    onMutate: async (newFollowState: boolean) => {
      // Capture previous state for rollback
      const previousState = isFollowing;
      
      // Optimistically update UI immediately
      setIsFollowing(newFollowState);
      onFollowChange?.(newFollowState);
      
      return { previousState };
    },
    onSuccess: () => {
      // Invalidate to sync with server
      queryClient.invalidateQueries({ queryKey: ["/api/players", playerId, "followers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players", playerId, "following"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players", playerId, "follow-stats"] });
    },
    onError: (_err, _newState, context) => {
      // Rollback on error using context
      if (context?.previousState !== undefined) {
        setIsFollowing(context.previousState);
        onFollowChange?.(context.previousState);
      }
    },
  });

  const handleClick = () => {
    followMutation.mutate(!isFollowing);
  };

  return (
    <Button
      onClick={handleClick}
      disabled={followMutation.isPending}
      variant={isFollowing ? "secondary" : "default"}
      className={cn(
        "gap-2 transition-all",
        isFollowing && "border-primary/30",
        className
      )}
      data-testid={isFollowing ? "button-unfollow" : "button-follow"}
    >
      {followMutation.isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <UserCheck className="w-4 h-4" />
      ) : (
        <UserPlus className="w-4 h-4" />
      )}
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
}
