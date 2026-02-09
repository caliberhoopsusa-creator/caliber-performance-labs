import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { SportSpinner } from "@/components/SportSpinner";

interface Follower {
  id: number;
  playerId: number;
  name: string;
  photoUrl?: string | null;
  position?: string;
}

interface FollowersListProps {
  playerId: number;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function FollowersList({ playerId }: FollowersListProps) {
  const { data: followers = [], isLoading } = useQuery<Follower[]>({
    queryKey: ["/api/players", playerId, "followers"],
  });

  if (isLoading) {
    return (
      <Card className="glass-card p-6">
        <div className="flex items-center justify-center py-8">
          <SportSpinner size="sm" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-card p-6">
      <h3 className="text-lg font-bold font-display text-white mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" /> Followers
      </h3>

      {followers.length === 0 ? (
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary/60" />
          </div>
          <p className="text-white font-semibold mb-1">No followers yet</p>
          <p className="text-sm text-muted-foreground">Share your profile to build your following and connect with other players</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {followers.map((follower) => (
            <Link
              key={follower.id}
              href={`/players/${follower.playerId}`}
              className="flex items-center gap-3 p-2 rounded-lg hover-elevate transition-all"
              data-testid={`link-follower-${follower.playerId}`}
            >
              <Avatar className="w-10 h-10 border-2 border-primary/20">
                {follower.photoUrl && <AvatarImage src={follower.photoUrl} alt={follower.name} width={40} height={40} />}
                <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-sm font-display font-bold text-white">
                  {getInitials(follower.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{follower.name}</p>
                {follower.position && (
                  <p className="text-xs text-muted-foreground">{follower.position}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
