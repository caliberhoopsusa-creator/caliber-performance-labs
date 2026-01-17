import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Users } from "lucide-react";

interface FollowStatsData {
  followerCount: number;
  followingCount: number;
}

interface FollowStatsProps {
  playerId: number;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
}

export function FollowStats({ playerId, onFollowersClick, onFollowingClick }: FollowStatsProps) {
  const { data: stats, isLoading } = useQuery<FollowStatsData>({
    queryKey: ["/api/players", playerId, "follow-stats"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-4">
        <div className="animate-pulse bg-secondary/30 rounded h-10 w-20"></div>
        <div className="animate-pulse bg-secondary/30 rounded h-10 w-20"></div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="flex items-center gap-6" data-testid="follow-stats">
      <button
        onClick={onFollowersClick}
        className="flex flex-col items-center hover-elevate rounded-lg p-2 transition-all cursor-pointer"
        data-testid="button-view-followers"
      >
        <span className="stat-value text-2xl text-white">{stats.followerCount}</span>
        <span className="stat-label flex items-center gap-1">
          <Users className="w-3 h-3" /> Followers
        </span>
      </button>
      <div className="w-px h-8 bg-border/50"></div>
      <button
        onClick={onFollowingClick}
        className="flex flex-col items-center hover-elevate rounded-lg p-2 transition-all cursor-pointer"
        data-testid="button-view-following"
      >
        <span className="stat-value text-2xl text-white">{stats.followingCount}</span>
        <span className="stat-label flex items-center gap-1">
          <Users className="w-3 h-3" /> Following
        </span>
      </button>
    </div>
  );
}
