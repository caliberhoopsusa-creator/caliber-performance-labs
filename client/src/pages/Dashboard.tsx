import { usePlayers } from "@/hooks/use-basketball";
import { Link } from "wouter";
import { Plus, ChevronRight, Users, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: players, isLoading } = usePlayers();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  const recentPlayers = players?.slice(0, 6) || [];
  const avgTeamGrade = "B+";

  return (
    <div className="py-6 space-y-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white" data-testid="text-dashboard-title">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Track and analyze performance</p>
        </div>
        <Link href="/analyze">
          <Button data-testid="button-new-analysis" className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" />
            Log Game
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-5" data-testid="card-roster-size">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{players?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Players</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5" data-testid="card-team-grade">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-green-500/10 border border-green-500/20">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{avgTeamGrade}</p>
              <p className="text-xs text-muted-foreground">Team Grade</p>
            </div>
          </div>
        </div>
      </div>

      {/* Roster */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between gap-2">
          <h2 className="font-display font-bold text-white">Your Roster</h2>
          <Link href="/players" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors" data-testid="link-view-all-players">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="divide-y divide-white/5">
          {recentPlayers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground text-sm mb-3">No players added yet</p>
              <Link href="/players">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white">Add Player</Button>
              </Link>
            </div>
          ) : (
            recentPlayers.map((player) => (
              <Link key={player.id} href={`/players/${player.id}`} className="block hover:bg-white/5 transition-colors" data-testid={`link-player-${player.id}`}>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sm font-bold text-white/80">
                      {player.jerseyNumber || "#"}
                    </div>
                    <div>
                      <p className="font-medium text-white">{player.name}</p>
                      <p className="text-xs text-muted-foreground">{player.position} • {player.team || "Team"}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
