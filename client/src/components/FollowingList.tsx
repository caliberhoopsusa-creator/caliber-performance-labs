import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { UserMinus, Users, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";

interface FollowingPlayer {
  id: number;
  playerId: number;
  name: string;
  photoUrl?: string | null;
  position?: string;
}

interface FollowingListProps {
  playerId: number;
  showUnfollowButton?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function FollowingList({ playerId, showUnfollowButton = true }: FollowingListProps) {
  const [unfollowingId, setUnfollowingId] = useState<number | null>(null);

  const { data: following = [], isLoading } = useQuery<FollowingPlayer[]>({
    queryKey: ["/api/players", playerId, "following"],
    retry: false,
    throwOnError: false,
  });

  const unfollowMutation = useMutation({
    mutationFn: async (targetPlayerId: number) => {
      await apiRequest("DELETE", `/api/players/${targetPlayerId}/follow`);
    },
    onMutate: (targetPlayerId) => {
      setUnfollowingId(targetPlayerId);
    },
    onSuccess: (_, targetPlayerId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/players", playerId, "following"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players", playerId, "follow-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players", targetPlayerId, "followers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players", targetPlayerId, "follow-stats"] });
    },
    onSettled: () => {
      setUnfollowingId(null);
    },
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold font-display text-foreground mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-accent" /> Following
      </h3>

      {following.length === 0 ? (
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-accent/60" />
          </div>
          <p className="text-foreground font-semibold mb-1">Not following anyone yet</p>
          <p className="text-sm text-muted-foreground">Follow other players to see their updates and compare your progress</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {following.map((player) => (
            <div
              key={player.id}
              className="flex items-center gap-3 p-2 rounded-lg"
              data-testid={`following-item-${player.playerId}`}
            >
              <Link
                href={`/players/${player.playerId}`}
                className="flex items-center gap-3 flex-1 min-w-0 hover-elevate rounded-lg p-1 -m-1"
              >
                <Avatar className="w-10 h-10 border-2 border-accent/20">
                  {player.photoUrl && <AvatarImage src={player.photoUrl} alt={player.name} width={40} height={40} />}
                  <AvatarFallback className="bg-gradient-to-br from-accent/30 to-accent/10 text-sm font-display font-bold text-white">
                    {getInitials(player.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{player.name}</p>
                  {player.position && (
                    <p className="text-xs text-muted-foreground">{player.position}</p>
                  )}
                </div>
              </Link>
              {showUnfollowButton && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => unfollowMutation.mutate(player.playerId)}
                  disabled={unfollowingId === player.playerId}
                  className="text-muted-foreground hover:text-destructive"
                  data-testid={`button-unfollow-${player.playerId}`}
                >
                  {unfollowingId === player.playerId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserMinus className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
