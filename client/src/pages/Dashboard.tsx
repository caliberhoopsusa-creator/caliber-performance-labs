import { usePlayers } from "@/hooks/use-basketball";
import { Link } from "wouter";
import { Plus, ChevronRight, Activity, TrendingUp, Users, Trophy, Video, Calculator, Binoculars, Target, BarChart3, ClipboardList, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { data: players, isLoading } = usePlayers();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="w-6 h-6 text-primary" />
          </div>
        </div>
      </div>
    );
  }

  const recentPlayers = players?.slice(0, 5) || [];
  const avgTeamGrade = "B+";

  const playerFeatures = [
    { href: "/players", label: "View Players", description: "Manage your roster", icon: Users, gradient: "from-blue-500/20 to-blue-600/10" },
    { href: "/analyze", label: "New Analysis", description: "Grade a game", icon: Plus, gradient: "from-green-500/20 to-green-600/10" },
    { href: "/leaderboard", label: "Leaderboard", description: "Top performers", icon: Trophy, gradient: "from-amber-500/20 to-amber-600/10" },
    { href: "/compare", label: "Head-to-Head", description: "Compare players", icon: Activity, gradient: "from-purple-500/20 to-purple-600/10" },
    { href: "/video", label: "Video Analysis", description: "AI-powered stats", icon: Video, gradient: "from-pink-500/20 to-pink-600/10" },
    { href: "/grading", label: "Grading System", description: "How grades work", icon: Calculator, gradient: "from-cyan-500/20 to-cyan-600/10" },
  ];

  const quickActions = [
    { href: "/scout", label: "Scout Mode", description: "Discover players", icon: Binoculars, gradient: "from-amber-500/20 to-orange-500/10", featured: true, iconColor: "text-amber-400" },
    { href: "/challenges", label: "Challenges", description: "Weekly competitions", icon: Target, gradient: "from-green-500/20 to-emerald-500/10", iconColor: "text-green-400" },
    { href: "/community", label: "Community", description: "Player highlights", icon: BarChart3, gradient: "from-blue-500/20 to-indigo-500/10", iconColor: "text-blue-400" },
    { href: "/coach/dashboard", label: "Coach Tools", description: "Team analytics", icon: ClipboardList, gradient: "from-purple-500/20 to-pink-500/10", iconColor: "text-purple-400" },
  ];

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-24 md:pb-0">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card/80 to-card/50 border border-white/5 p-6 md:p-8">
        <div className="absolute inset-0 gradient-spotlight pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
              <Sparkles className="w-3 h-3" />
              Performance Hub
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white uppercase tracking-tight" data-testid="text-dashboard-title">Caliber Dashboard</h2>
            <p className="text-muted-foreground font-medium mt-1">Track, analyze, and elevate your game</p>
          </div>
          <Link href="/analyze" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-600/90 text-primary-foreground px-6 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0" data-testid="button-new-analysis">
            <Plus className="w-5 h-5" />
            New Analysis
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card border-white/5 overflow-hidden" data-testid="card-roster-size">
          <CardContent className="pt-6 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-center gap-4 relative">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/10">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="stat-value text-white">{players?.length || 0}</p>
                <p className="stat-label">Players</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5 overflow-hidden" data-testid="card-team-grade">
          <CardContent className="pt-6 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-center gap-4 relative">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/5 border border-green-500/10">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="stat-value text-white">{avgTeamGrade}</p>
                <p className="stat-label">Team Grade</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5 overflow-hidden" data-testid="card-active">
          <CardContent className="pt-6 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-center gap-4 relative">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/10">
                <Activity className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="stat-value text-white">{recentPlayers.length}</p>
                <p className="stat-label">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5 overflow-hidden" data-testid="card-trending">
          <CardContent className="pt-6 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-center gap-4 relative">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/5 border border-purple-500/10">
                <Trophy className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="stat-value text-white">--</p>
                <p className="stat-label">Top Rank</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-5">
          <h3 className="text-xl font-bold font-display text-white">Player Features</h3>
          <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {playerFeatures.map((feature) => (
            <Link key={feature.href} href={feature.href} data-testid={`link-feature-${feature.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <Card className={cn(
                "glass-card border-white/5 hover:border-primary/20 transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full card-shine",
                `bg-gradient-to-br ${feature.gradient}`
              )}>
                <CardContent className="pt-5 pb-4 text-center">
                  <div className="mx-auto w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-semibold text-white text-sm">{feature.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-5">
          <h3 className="text-xl font-bold font-display text-white">Quick Actions</h3>
          <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} data-testid={`link-action-${action.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <Card className={cn(
                "glass-card border-white/5 hover:border-primary/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer card-shine overflow-hidden",
                `bg-gradient-to-br ${action.gradient}`,
                action.featured && "border-amber-500/20"
              )}>
                <CardContent className="pt-5 pb-4 relative">
                  {action.featured && (
                    <div className="absolute top-2 right-2">
                      <span className="text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full">PRO</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center", action.iconColor)}>
                      <action.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">{action.label}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border-white/5">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-white/[0.02] to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-xl font-bold font-display text-white">Your Roster</h3>
          </div>
          <Link href="/players" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors" data-testid="link-view-all-players">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="divide-y divide-white/5">
          {recentPlayers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-card border border-white/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-2">No players added yet</p>
              <Link href="/players" className="text-primary hover:underline font-medium">Add your first player</Link>
            </div>
          ) : (
            recentPlayers.map((player) => (
              <Link key={player.id} href={`/players/${player.id}`} className="block hover:bg-white/[0.02] transition-colors" data-testid={`link-player-${player.id}`}>
                <div className="p-5 md:p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center text-xl font-bold font-display text-secondary-foreground border border-white/10 shadow-lg">
                      {player.jerseyNumber || "#"}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white leading-none mb-1.5">{player.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">{player.position}</span>
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
