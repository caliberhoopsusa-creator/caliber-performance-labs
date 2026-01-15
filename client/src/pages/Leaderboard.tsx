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
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h2 className="text-3xl md:text-4xl font-display font-bold text-white uppercase tracking-tight">Player Leaderboard</h2>
        <p className="text-muted-foreground font-medium">Top performers based on average game grade</p>
      </div>

      <div className="bg-card border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Rank</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Player</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Avg Grade</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">PPG</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Games</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {leaderboard?.map((entry: any, index: number) => (
                <tr key={entry.playerId} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                      {index === 0 && <Trophy className="w-5 h-5 text-yellow-500" />}
                      {index === 1 && <Medal className="w-5 h-5 text-gray-400" />}
                      {index === 2 && <Medal className="w-5 h-5 text-amber-600" />}
                      <span className={cn(
                        "font-display font-bold text-lg",
                        index < 3 ? "text-white" : "text-muted-foreground"
                      )}>
                        #{index + 1}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-sm">
                        {entry.jerseyNumber || "#"}
                      </div>
                      <div>
                        <div className="font-bold text-white group-hover:text-primary transition-colors">{entry.name}</div>
                        <div className="text-xs text-muted-foreground">{entry.team || "No Team"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <GradeBadge grade={entry.avgGrade} size="sm" />
                  </td>
                  <td className="px-6 py-6 font-mono font-bold text-white">
                    {entry.avgPoints}
                  </td>
                  <td className="px-6 py-6 text-muted-foreground">
                    {entry.gamesPlayed}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
