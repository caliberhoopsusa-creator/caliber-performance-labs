import { usePlayers } from "@/hooks/use-basketball";
import { Link } from "wouter";
import { Plus, ChevronRight, Activity, TrendingUp, Users, Trophy, Video, Calculator, Binoculars, Target, BarChart3, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const avgTeamGrade = "B+";

  const playerFeatures = [
    { href: "/players", label: "View Players", description: "Manage your roster", icon: Users, color: "text-blue-400" },
    { href: "/analyze", label: "New Analysis", description: "Grade a game", icon: Plus, color: "text-green-400" },
    { href: "/leaderboard", label: "Leaderboard", description: "Top performers", icon: Trophy, color: "text-amber-400" },
    { href: "/compare", label: "Head-to-Head", description: "Compare players", icon: Activity, color: "text-purple-400" },
    { href: "/video", label: "Video Analysis", description: "AI-powered stats", icon: Video, color: "text-pink-400" },
    { href: "/grading", label: "Grading System", description: "How grades work", icon: Calculator, color: "text-cyan-400" },
  ];

  const quickActions = [
    { href: "/scout", label: "Scout Mode", description: "Discover players", icon: Binoculars, color: "from-amber-500/20 to-orange-500/20", featured: true },
    { href: "/challenges", label: "Challenges", description: "Weekly competitions", icon: Target, color: "from-green-500/20 to-emerald-500/20" },
    { href: "/community", label: "Community", description: "Player highlights", icon: BarChart3, color: "from-blue-500/20 to-indigo-500/20" },
    { href: "/coach/dashboard", label: "Coach Tools", description: "Team analytics", icon: ClipboardList, color: "from-purple-500/20 to-pink-500/20" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white uppercase tracking-tight" data-testid="text-dashboard-title">Caliber Dashboard</h2>
          <p className="text-muted-foreground font-medium">Your basketball performance hub</p>
        </div>
        <Link href="/analyze" className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0" data-testid="button-new-analysis">
          <Plus className="w-5 h-5" />
          New Analysis
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-card to-card/50 border-white/5" data-testid="card-roster-size">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-white">{players?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Players</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-white/5" data-testid="card-team-grade">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-white">{avgTeamGrade}</p>
                <p className="text-xs text-muted-foreground">Team Grade</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-white/5" data-testid="card-active">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Activity className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-white">{recentPlayers.length}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-white/5" data-testid="card-trending">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Trophy className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-white">--</p>
                <p className="text-xs text-muted-foreground">Top Rank</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Player Features Grid */}
      <div>
        <h3 className="text-lg font-bold font-display text-white mb-4">Player Features</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {playerFeatures.map((feature) => (
            <Link key={feature.href} href={feature.href} data-testid={`link-feature-${feature.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <Card className="bg-card/50 border-white/5 hover:bg-white/5 transition-all hover:-translate-y-0.5 cursor-pointer h-full">
                <CardContent className="pt-5 pb-4 text-center">
                  <div className={cn("mx-auto w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-white/5", feature.color)}>
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <p className="font-semibold text-white text-sm">{feature.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-bold font-display text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} data-testid={`link-action-${action.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <Card className={cn(
                "border-white/10 hover:-translate-y-0.5 transition-all cursor-pointer",
                `bg-gradient-to-br ${action.color}`,
                action.featured && "border-amber-500/30"
              )}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-3">
                    <action.icon className={cn("w-6 h-6", action.featured ? "text-amber-400" : "text-white")} />
                    <div>
                      <p className={cn("font-bold text-sm", action.featured ? "text-amber-400" : "text-white")}>
                        {action.label}
                        {action.featured && <span className="ml-2 text-[10px] bg-amber-500/30 px-1.5 py-0.5 rounded">PRO</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Roster Preview */}
      <div className="bg-card/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-xl font-bold font-display text-white">Your Roster</h3>
          <Link href="/players" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1" data-testid="link-view-all-players">
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
              <Link key={player.id} href={`/players/${player.id}`} className="block hover:bg-white/5 transition-colors" data-testid={`link-player-${player.id}`}>
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
