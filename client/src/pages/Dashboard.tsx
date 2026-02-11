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
      <div className="bg-card border border-border rounded-md p-6">
        <div className="h-8 w-48 skeleton-premium rounded mb-2" />
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
      <Card>
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Activity className="w-5 h-5 text-accent" />
                <span className="text-xs uppercase tracking-wider text-accent font-semibold">Command Center</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground" data-testid="text-dashboard-title">
                Welcome Back{user?.firstName ? `, ${user.firstName}` : ''}
              </h1>
              <p className="text-muted-foreground max-w-md">
                Track performance, analyze games, and unlock your potential
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
              {currentStreak > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-orange-500/15 to-orange-600/5 border border-orange-500/30">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-xs text-orange-500/80">Active Streak</p>
                    <p className="font-bold text-orange-400">{currentStreak} days</p>
                  </div>
                </div>
              )}
              <Link href="/analyze">
                <Button 
                  className="bg-accent text-white"
                  data-testid="button-new-analysis"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Log Game
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

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
            href="/players"
            testId="card-roster-size"
          />
        </motion.div>
        
        <motion.div variants={fadeUpVariants}>
          <StatCard
            icon={TrendingUp}
            label="Team Grade"
            value={avgTeamGrade}
            testId="card-team-grade"
          />
        </motion.div>
        
        <motion.div variants={fadeUpVariants}>
          <StatCard
            icon={Target}
            label="Games Logged"
            value={totalGames}
            href="/analyze"
            testId="card-games-logged"
          />
        </motion.div>
        
        <motion.div variants={fadeUpVariants}>
          <StatCard
            icon={Trophy}
            label="Leaderboard"
            value="View"
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
          <Card>
            <div className="p-4 border-b border-border flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="p-2 rounded-md bg-accent/10">
                  <Users className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Your Roster</h2>
                  <p className="text-xs text-muted-foreground">{totalPlayers} players tracked</p>
                </div>
              </div>
              <Link 
                href="/players" 
                className="text-sm text-accent flex items-center gap-1" 
                data-testid="link-view-all-players"
              >
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="divide-y divide-border">
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
                      className="block hover:bg-muted/50 transition-colors group" 
                      data-testid={`link-player-${player.id}`}
                    >
                      <div className="p-4 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="w-10 h-10 rounded-md bg-accent/10 text-accent border border-accent/20 flex items-center justify-center text-sm font-bold">
                            {player.jerseyNumber || "#"}
                          </div>
                          <div>
                            <p className="font-medium text-foreground group-hover:text-accent transition-colors">{player.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {player.position} • {player.team || "No Team"}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
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
          <Card>
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="p-2 rounded-md bg-accent/10">
                  <Zap className="w-4 h-4 text-accent" />
                </div>
                <h3 className="font-bold text-foreground">Quick Actions</h3>
              </div>
            </div>
            
            <div className="p-4 space-y-2">
              <QuickActionButton
                icon={Target}
                label="Analyze Game"
                href="/analyze"
              />
              <QuickActionButton
                icon={BarChart3}
                label="View Leaderboard"
                href="/leaderboard"
              />
              <QuickActionButton
                icon={Calendar}
                label="Schedule Practice"
                href="/schedule"
              />
              <QuickActionButton
                icon={Star}
                label="Scout Players"
                href="/scout"
              />
            </div>
          </Card>

          <Card>
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="p-2 rounded-md bg-accent/10">
                  <Award className="w-4 h-4 text-accent" />
                </div>
                <h3 className="font-bold text-foreground">Recent Achievements</h3>
              </div>
            </div>
            
            <div className="p-4">
              <div className="text-center py-6">
                <Trophy className="w-10 h-10 text-accent/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Log games to earn badges and achievements
                </p>
                <Link href="/analyze">
                  <Button variant="outline" size="sm" className="mt-3">
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
  href?: string;
  testId?: string;
}

function StatCard({ icon: Icon, label, value, href, testId }: StatCardProps) {
  const content = (
    <Card 
      className={cn(
        "transition-all duration-300",
        href && "hover:scale-[1.02] cursor-pointer"
      )}
      data-testid={testId}
    >
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="p-2 rounded-md bg-accent/10">
            <Icon className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-foreground text-2xl font-bold font-display">
              {value}
            </p>
            <p className="text-muted-foreground text-xs uppercase tracking-wider">{label}</p>
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
}

function QuickActionButton({ icon: Icon, label, href }: QuickActionButtonProps) {
  return (
    <Link href={href}>
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 border border-border"
      >
        <Icon className="w-4 h-4 text-accent" />
        <span>{label}</span>
        <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
      </Button>
    </Link>
  );
}
