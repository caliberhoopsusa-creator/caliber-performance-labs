import { usePlayers } from "@/hooks/use-basketball";
import { Link } from "wouter";
import { Plus, ChevronRight, Activity, TrendingUp, Users } from "lucide-react";
import { GradeBadge } from "@/components/GradeBadge";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { data: players, isLoading } = usePlayers();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const recentPlayers = players?.slice(0, 5) || [];
  const totalGames = 0; // In a real app we'd aggregate this or get it from API
  const avgTeamGrade = "B+"; // Placeholder aggregation

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white uppercase tracking-tight">Caliber Dashboard</h2>
          <p className="text-muted-foreground font-medium">Season 2024-25 Overview</p>
        </div>
        <Link href="/analyze" className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0">
          <Plus className="w-5 h-5" />
          New Analysis
        </Link>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-card to-card/50 p-6 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-24 h-24" />
          </div>
          <h3 className="text-muted-foreground text-sm uppercase font-bold tracking-wider mb-2">Roster Size</h3>
          <p className="text-5xl font-display font-bold text-white">{players?.length || 0}</p>
          <div className="mt-4 text-sm text-green-400 font-medium flex items-center gap-1">
            <TrendingUp className="w-4 h-4" /> Active players
          </div>
        </div>

        <div className="bg-gradient-to-br from-card to-card/50 p-6 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-24 h-24" />
          </div>
          <h3 className="text-muted-foreground text-sm uppercase font-bold tracking-wider mb-2">Team Avg Grade</h3>
          <p className="text-5xl font-display font-bold text-white">{avgTeamGrade}</p>
          <div className="mt-4 text-sm text-muted-foreground font-medium">
            Based on recent performance
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-6 rounded-2xl border border-primary/20 shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-primary-foreground/80 text-sm uppercase font-bold tracking-wider mb-2">Next Step</h3>
            <p className="text-xl font-bold text-white mb-4">Ready to grade the last game?</p>
            <Link href="/analyze" className="inline-block text-sm font-bold bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
              Start Grading &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Roster Preview */}
      <div className="bg-card/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-xl font-bold font-display text-white">Active Roster</h3>
          <Link href="/players" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="divide-y divide-white/5">
          {recentPlayers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No players added yet. <Link href="/players" className="text-primary hover:underline">Add your first player</Link>.
            </div>
          ) : (
            recentPlayers.map((player) => (
              <Link key={player.id} href={`/players/${player.id}`} className="block hover:bg-white/5 transition-colors">
                <div className="p-4 md:p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-lg font-bold font-display text-secondary-foreground border border-white/10">
                      {player.jerseyNumber || "#"}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white leading-none mb-1">{player.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        <span>{player.position}</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span>{player.team || "Team"}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
