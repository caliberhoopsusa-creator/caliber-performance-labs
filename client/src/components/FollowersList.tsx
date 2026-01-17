import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";

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
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
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
        <div className="text-center py-8 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No followers yet</p>
        </div>
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
                {follower.photoUrl && <AvatarImage src={follower.photoUrl} alt={follower.name} />}
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
