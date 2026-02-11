import { useQuery } from "@tanstack/react-query";
import { MapPin, Crown, Star, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface StateRankingData {
  rank: number | null;
  totalInState: number;
  state: string | null;
  isTop100: boolean;
}

interface StateRankingBadgeProps {
  playerId: number;
}

export function StateRankingBadge({ playerId }: StateRankingBadgeProps) {
  const { data: ranking, isLoading } = useQuery<StateRankingData>({
    queryKey: ['/api/players', playerId, 'state-ranking'],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}/state-ranking`);
      if (!res.ok) throw new Error('Failed to fetch state ranking');
      return res.json();
    },
    staleTime: 60000,
  });

  if (isLoading || !ranking || !ranking.state || !ranking.rank || !ranking.isTop100) {
    return null;
  }

  const isTop10 = ranking.rank <= 10;
  const isTop25 = ranking.rank <= 25;
  const isTop50 = ranking.rank <= 50;

  return (
    <div
      className={cn(
        "relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full border",
        "text-xs font-bold uppercase tracking-wider",
        "transition-all duration-500",
        "overflow-hidden",
        isTop10 
          ? "bg-gradient-to-r from-yellow-500/40 via-amber-400/30 to-yellow-500/40 border-yellow-400/60 text-yellow-600 dark:text-yellow-300 shadow-lg shadow-yellow-500/30"
          : isTop25
          ? "bg-gradient-to-r from-purple-500/30 to-pink-500/20 border-purple-400/50 text-purple-600 dark:text-purple-300 shadow-lg shadow-purple-500/20"
          : isTop50
          ? "bg-gradient-to-r from-blue-500/30 to-accent/20 border-blue-400/50 text-blue-600 dark:text-blue-300 shadow-md shadow-blue-500/20"
          : "bg-gradient-to-r from-green-500/20 to-emerald-500/15 border-green-400/40 text-green-600 dark:text-green-300"
      )}
      data-testid="state-ranking-badge"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
          style={{
            animation: "3s infinite",
          }}
        />
      </div>
      
      {isTop10 && (
        <>
          <Sparkles 
            className="w-3.5 h-3.5 absolute -left-0.5 -top-0.5 text-yellow-400 animate-pulse" 
          />
          <Sparkles 
            className="w-3 h-3 absolute -right-0.5 -bottom-0.5 text-yellow-400 animate-pulse" 
            style={{ animationDelay: "0.5s" }}
          />
        </>
      )}
      
      <div className="relative z-10 flex items-center gap-2">
        {isTop10 ? (
          <Crown className={cn("w-4 h-4 animate-bounce", isTop10 && "text-yellow-600 dark:text-yellow-400")} />
        ) : isTop25 ? (
          <Star className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        ) : (
          <MapPin className="w-4 h-4" />
        )}
        
        <span className="flex items-center gap-1">
          <span className="font-black text-sm">#{ranking.rank}</span>
          <span className="text-[10px] opacity-80">in {ranking.state}</span>
        </span>
      </div>

      {isTop10 && (
        <div 
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle at 50% 50%, rgba(250, 204, 21, 0.15) 0%, transparent 70%)",
            animation: "pulse 2s infinite",
          }}
        />
      )}
    </div>
  );
}
