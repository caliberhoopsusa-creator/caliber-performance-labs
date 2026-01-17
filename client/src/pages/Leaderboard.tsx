import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { GradeBadge } from "@/components/GradeBadge";
import { Trophy, Medal, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: [api.analytics.leaderboard.path],
    queryFn: async () => {
      const res = await fetch(api.analytics.leaderboard.path);
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-24 md:pb-8">
      <div>
        <h2 className="text-2xl md:text-4xl font-display font-bold text-white uppercase tracking-tight" data-testid="text-leaderboard-title">Player Leaderboard</h2>
        <p className="text-sm md:text-base text-muted-foreground font-medium">Top performers based on average game grade</p>
      </div>

      <div className="bg-card border border-white/5 rounded-xl md:rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <div className="min-w-[600px] md:min-w-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground">Rank</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground">Player</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground">Grade</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground">PPG</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground">Games</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leaderboard?.map((entry: any, index: number) => (
                  <tr key={entry.playerId} className="hover:bg-white/5 transition-colors group active:bg-white/10" data-testid={`row-leaderboard-${index}`}>
                    <td className="px-3 md:px-6 py-4 md:py-6">
                      <div className="flex items-center gap-2 md:gap-3">
                        {index === 0 && <Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />}
                        {index === 1 && <Medal className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />}
                        {index === 2 && <Medal className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />}
                        <span className={cn(
                          "font-display font-bold text-base md:text-lg",
                          index < 3 ? "text-white" : "text-muted-foreground"
                        )}>
                          #{index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4 md:py-6">
                      <div className="flex items-center gap-2 md:gap-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-xs md:text-sm shrink-0">
                          {entry.jerseyNumber || "#"}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm md:text-base text-white group-hover:text-primary transition-colors truncate">{entry.name}</div>
                          <div className="text-[10px] md:text-xs text-muted-foreground truncate">{entry.team || "No Team"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4 md:py-6">
                      <GradeBadge grade={entry.avgGrade} size="sm" />
                    </td>
                    <td className="px-3 md:px-6 py-4 md:py-6 font-mono font-bold text-sm md:text-base text-white">
                      {entry.avgPoints}
                    </td>
                    <td className="px-3 md:px-6 py-4 md:py-6 text-sm md:text-base text-muted-foreground">
                      {entry.gamesPlayed}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
