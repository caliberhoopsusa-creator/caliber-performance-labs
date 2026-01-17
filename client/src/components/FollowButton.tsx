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
    mutationFn: async () => {
      if (isFollowing) {
        await apiRequest("DELETE", `/api/players/${playerId}/follow`);
      } else {
        await apiRequest("POST", `/api/players/${playerId}/follow`);
      }
    },
    onSuccess: () => {
      const newState = !isFollowing;
      setIsFollowing(newState);
      onFollowChange?.(newState);
      queryClient.invalidateQueries({ queryKey: ["/api/players", playerId, "followers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players", playerId, "following"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players", playerId, "follow-stats"] });
    },
  });

  const handleClick = () => {
    followMutation.mutate();
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
