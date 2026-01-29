import { usePlayers } from "@/hooks/use-basketball";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Plus, ChevronRight, Users, TrendingUp, UserPlus, 
  Target, Calendar, Trophy, Zap, BarChart3, Star,
  Activity, Flame, Award
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SkeletonStatCard, SkeletonPlayerCard } from "@/components/ui/skeleton-premium";
import { EmptyState } from "@/components/ui/empty-state";
import { GradeBadge } from "@/components/GradeBadge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const fadeUpVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
  },
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

function DashboardSkeleton() {
  return (
    <div className="pb-24 md:pb-6 space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-black/60 via-cyan-950/20 to-black/60 border border-cyan-500/20 p-6">
        <div className="h-8 w-48 skeleton-cyan rounded mb-2" />
        <div className="h-4 w-64 skeleton-premium rounded" />
      </div>
      
      <motion.div 
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {[1, 2, 3, 4].map((i) => (
          <motion.div key={i} variants={fadeUpVariants}>
            <SkeletonStatCard />
          </motion.div>
        ))}
      </motion.div>
      
      <motion.div 
        className="space-y-3"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {[1, 2, 3].map((i) => (
          <motion.div key={i} variants={fadeUpVariants}>
            <SkeletonPlayerCard />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: players, isLoading } = usePlayers();
  
  const { data: userStats } = useQuery<{
    totalXp: number;
    currentTier: string;
    currentStreak: number;
    totalGamesLogged: number;
  }>({
    queryKey: ["/api/users/me"],
    enabled: !!user,
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const recentPlayers = players?.slice(0, 6) || [];
  const totalPlayers = players?.length || 0;
  const avgTeamGrade = "B+";
  const currentStreak = userStats?.currentStreak || 0;
  const totalGames = userStats?.totalGamesLogged || 0;

  return (
    <div className="pb-24 md:pb-6 space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-black/60 via-cyan-950/20 to-black/60 border border-cyan-500/20">
        <div className="absolute inset-0 cyber-grid opacity-30" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full" />
        
        <div className="relative z-10 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                <span className="text-xs uppercase tracking-wider text-cyan-400 font-semibold">Command Center</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold" data-testid="text-dashboard-title">
                <span className="bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
                  Welcome Back{user?.firstName ? `, ${user.firstName}` : ''}
                </span>
              </h1>
              <p className="text-muted-foreground max-w-md">
                Track performance, analyze games, and unlock your potential
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {currentStreak > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-orange-500/15 to-orange-600/5 border border-orange-500/30">
                  <Flame className="w-5 h-5 text-orange-500" style={{ filter: "drop-shadow(0 0 8px #f97316)" }} />
                  <div>
                    <p className="text-xs text-orange-500/80">Active Streak</p>
                    <p className="font-bold text-orange-400">{currentStreak} days</p>
                  </div>
                </div>
              )}
              <Link href="/analyze">
                <Button 
                  className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white shadow-lg shadow-cyan-500/25"
                  data-testid="button-new-analysis"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Log Game
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <motion.div 
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={fadeUpVariants}>
          <StatCard
            icon={Users}
            label="Players"
            value={totalPlayers}
            color="cyan"
            href="/players"
            testId="card-roster-size"
          />
        </motion.div>
        
        <motion.div variants={fadeUpVariants}>
          <StatCard
            icon={TrendingUp}
            label="Team Grade"
            value={avgTeamGrade}
            color="emerald"
            testId="card-team-grade"
          />
        </motion.div>
        
        <motion.div variants={fadeUpVariants}>
          <StatCard
            icon={Target}
            label="Games Logged"
            value={totalGames}
            color="purple"
            href="/analyze"
            testId="card-games-logged"
          />
        </motion.div>
        
        <motion.div variants={fadeUpVariants}>
          <StatCard
            icon={Trophy}
            label="Leaderboard"
            value="View"
            color="yellow"
            href="/leaderboard"
            testId="card-leaderboard"
          />
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="relative overflow-hidden bg-gradient-to-br from-black/60 to-black/30 border-white/10">
            <div className="absolute inset-x-[15%] top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
            
            <div className="p-4 border-b border-white/5 flex items-center justify-between gap-2 bg-gradient-to-r from-cyan-500/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <Users className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h2 className="font-bold text-white">Your Roster</h2>
                  <p className="text-xs text-muted-foreground">{totalPlayers} players tracked</p>
                </div>
              </div>
              <Link 
                href="/players" 
                className="text-sm text-cyan-400 flex items-center gap-1 transition-all duration-300 hover:text-cyan-300 hover:gap-2" 
                data-testid="link-view-all-players"
              >
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="divide-y divide-white/5">
              {recentPlayers.length === 0 ? (
                <EmptyState
                  icon={UserPlus}
                  title="Build Your Roster"
                  description="Add your first player to start tracking performance, earning grades, and unlocking insights."
                  action={{ label: "Add First Player", href: "/players" }}
                  variant="compact"
                />
              ) : (
                recentPlayers.map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                  >
                    <Link 
                      href={`/players/${player.id}`} 
                      className="block hover:bg-gradient-to-r hover:from-cyan-500/5 hover:to-transparent transition-all duration-300 group" 
                      data-testid={`link-player-${player.id}`}
                    >
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-transparent border border-cyan-400/20 flex items-center justify-center text-sm font-bold text-cyan-300 shadow-[0_0_15px_rgba(100,200,255,0.1)] group-hover:shadow-[0_0_20px_rgba(100,200,255,0.2)] transition-shadow">
                            {player.jerseyNumber || "#"}
                          </div>
                          <div>
                            <p className="font-medium text-white group-hover:text-cyan-300 transition-colors">{player.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {player.position} • {player.team || "No Team"}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-cyan-400/50 group-hover:text-cyan-400 transition-colors" />
                      </div>
                    </Link>
                  </motion.div>
                ))
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="relative overflow-hidden bg-gradient-to-br from-black/60 to-black/30 border-white/10">
            <div className="absolute inset-x-[15%] top-0 h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent" />
            
            <div className="p-4 border-b border-white/5 bg-gradient-to-r from-purple-500/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <Zap className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="font-bold text-white">Quick Actions</h3>
              </div>
            </div>
            
            <div className="p-4 space-y-2">
              <QuickActionButton
                icon={Target}
                label="Analyze Game"
                href="/analyze"
                color="cyan"
              />
              <QuickActionButton
                icon={BarChart3}
                label="View Leaderboard"
                href="/leaderboard"
                color="yellow"
              />
              <QuickActionButton
                icon={Calendar}
                label="Schedule Practice"
                href="/schedule"
                color="green"
              />
              <QuickActionButton
                icon={Star}
                label="Scout Players"
                href="/scout"
                color="purple"
              />
            </div>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-black/60 to-black/30 border-white/10">
            <div className="absolute inset-x-[15%] top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent" />
            
            <div className="p-4 border-b border-white/5 bg-gradient-to-r from-yellow-500/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <Award className="w-4 h-4 text-yellow-400" />
                </div>
                <h3 className="font-bold text-white">Recent Achievements</h3>
              </div>
            </div>
            
            <div className="p-4">
              <div className="text-center py-6">
                <div className="relative inline-block mb-3">
                  <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full" />
                  <Trophy className="w-10 h-10 text-yellow-500/50 relative z-10" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Log games to earn badges and achievements
                </p>
                <Link href="/analyze">
                  <Button variant="outline" size="sm" className="mt-3 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10">
                    Start Earning
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: typeof Users;
  label: string;
  value: string | number;
  color: "cyan" | "emerald" | "purple" | "yellow" | "orange";
  href?: string;
  testId?: string;
}

const colorStyles = {
  cyan: {
    bg: "from-cyan-500/20 to-cyan-600/10",
    border: "border-cyan-400/20",
    shadow: "shadow-[0_0_20px_rgba(100,200,255,0.1)]",
    text: "text-cyan-400",
    gradient: "from-white to-cyan-100/80",
    line: "via-cyan-400/30",
  },
  emerald: {
    bg: "from-emerald-500/20 to-emerald-600/10",
    border: "border-emerald-400/20",
    shadow: "shadow-[0_0_20px_rgba(16,185,129,0.1)]",
    text: "text-emerald-400",
    gradient: "from-white to-emerald-100/80",
    line: "via-emerald-400/30",
  },
  purple: {
    bg: "from-purple-500/20 to-purple-600/10",
    border: "border-purple-400/20",
    shadow: "shadow-[0_0_20px_rgba(168,85,247,0.1)]",
    text: "text-purple-400",
    gradient: "from-white to-purple-100/80",
    line: "via-purple-400/30",
  },
  yellow: {
    bg: "from-yellow-500/20 to-yellow-600/10",
    border: "border-yellow-400/20",
    shadow: "shadow-[0_0_20px_rgba(234,179,8,0.1)]",
    text: "text-yellow-400",
    gradient: "from-white to-yellow-100/80",
    line: "via-yellow-400/30",
  },
  orange: {
    bg: "from-orange-500/20 to-orange-600/10",
    border: "border-orange-400/20",
    shadow: "shadow-[0_0_20px_rgba(249,115,22,0.1)]",
    text: "text-orange-400",
    gradient: "from-white to-orange-100/80",
    line: "via-orange-400/30",
  },
};

function StatCard({ icon: Icon, label, value, color, href, testId }: StatCardProps) {
  const styles = colorStyles[color];
  
  const content = (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-300 group",
        "bg-gradient-to-br from-black/60 to-black/30 border-white/10",
        href && "hover:scale-[1.02] cursor-pointer"
      )}
      data-testid={testId}
    >
      <div className={cn("absolute inset-x-[20%] top-0 h-px bg-gradient-to-r from-transparent to-transparent", styles.line)} />
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-lg bg-gradient-to-br border",
            styles.bg,
            styles.border,
            styles.shadow
          )}>
            <Icon className={cn("w-5 h-5", styles.text)} />
          </div>
          <div>
            <p className={cn("text-2xl font-bold bg-gradient-to-b bg-clip-text text-transparent", styles.gradient)}>
              {value}
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

interface QuickActionButtonProps {
  icon: typeof Target;
  label: string;
  href: string;
  color: "cyan" | "yellow" | "green" | "purple";
}

const quickActionColors = {
  cyan: "hover:bg-cyan-500/10 hover:border-cyan-500/30 text-cyan-400",
  yellow: "hover:bg-yellow-500/10 hover:border-yellow-500/30 text-yellow-400",
  green: "hover:bg-emerald-500/10 hover:border-emerald-500/30 text-emerald-400",
  purple: "hover:bg-purple-500/10 hover:border-purple-500/30 text-purple-400",
};

function QuickActionButton({ icon: Icon, label, href, color }: QuickActionButtonProps) {
  return (
    <Link href={href}>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start gap-3 h-11 border border-white/5 transition-all",
          quickActionColors[color]
        )}
      >
        <Icon className="w-4 h-4" />
        <span className="text-white">{label}</span>
        <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
      </Button>
    </Link>
  );
}
