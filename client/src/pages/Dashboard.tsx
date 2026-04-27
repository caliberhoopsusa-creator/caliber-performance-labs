import { usePlayers, useTeamDashboard } from "@/hooks/use-basketball";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Plus, ChevronRight, Users, TrendingUp, UserPlus, Eye,
  Target, Calendar, Trophy, Zap, BarChart3, Star,
  Activity, Flame, Award, Shield, Crosshair, Clock, Copy, Share2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SkeletonStatCard, SkeletonPlayerCard } from "@/components/ui/skeleton-premium";
import { EmptyState } from "@/components/ui/empty-state";
import { GradeBadge } from "@/components/GradeBadge";
import { CelebrationOverlay } from "@/components/CelebrationOverlay";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BADGE_DEFINITIONS } from "@shared/schema";
import { useState, useEffect } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { Lock, Sparkles, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DailyQuestsWidget } from "@/components/DailyQuestsWidget";

const BADGE_ICONS: Record<string, any> = {
  twenty_piece: Target,
  thirty_bomb: Target,
  double_double: Award,
  triple_double: Trophy,
  ironman: Clock,
  efficiency_master: Star,
  lockdown: Shield,
  hustle_king: Flame,
  clean_sheet: Star,
  hot_streak_3: Flame,
  hot_streak_5: Flame,
  sharpshooter: Crosshair,
  most_improved: TrendingUp,
};

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

function computeAvgTeamGrade(avgGradeScore: number): string {
  if (avgGradeScore >= 4.15) return "A+";
  if (avgGradeScore >= 3.85) return "A";
  if (avgGradeScore >= 3.5) return "A-";
  if (avgGradeScore >= 3.15) return "B+";
  if (avgGradeScore >= 2.85) return "B";
  if (avgGradeScore >= 2.5) return "B-";
  if (avgGradeScore >= 2.15) return "C+";
  if (avgGradeScore >= 1.85) return "C";
  if (avgGradeScore >= 1.5) return "C-";
  if (avgGradeScore >= 1.15) return "D+";
  if (avgGradeScore >= 0.85) return "D";
  if (avgGradeScore >= 0.5) return "D-";
  return "F";
}

function RecruiterActivityBanner({ playerId }: { playerId: number }) {
  const { data, isLoading } = useQuery<{
    views: Array<{ id: number; viewedAt: string; recruiterName: string; recruiterDivision: string; isVerified: boolean }>;
    totalViews: number;
    unreadSignals: number;
  }>({
    queryKey: [`/api/players/${playerId}/whos-watching`],
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading || !data || data.totalViews === 0) return null;

  const recentViews = data.views.slice(0, 3);
  const newToday = data.views.filter(v => {
    const d = new Date(v.viewedAt);
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
  }).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Link href={`/players/${playerId}/recruiting`}>
        <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 cursor-pointer group hover:border-amber-500/40 transition-colors">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 0% 50%, rgba(245,158,11,0.06) 0%, transparent 60%)" }} />
          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                <Eye className="w-4 h-4 text-amber-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-foreground">
                    {newToday > 0 ? (
                      <><span className="text-amber-400">{newToday} new</span> recruiter view{newToday !== 1 ? 's' : ''} today</>
                    ) : (
                      <><span className="text-amber-400">{data.totalViews}</span> total recruiter view{data.totalViews !== 1 ? 's' : ''}</>
                    )}
                  </span>
                  {data.unreadSignals > 0 && (
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                      {data.unreadSignals} signal{data.unreadSignals !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">
                  {recentViews.map((v, i) => (
                    <span key={v.id}>
                      {i > 0 && ", "}
                      <span className="text-foreground/70">{v.recruiterName}</span>
                      {v.recruiterDivision && <span className="text-muted-foreground/60"> ({v.recruiterDivision})</span>}
                    </span>
                  ))}
                  {data.views.length > 3 && ` +${data.views.length - 3} more`}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400/60 group-hover:text-amber-400 transition-colors flex-shrink-0" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: players, isLoading } = usePlayers();
  const { data: teamDashboard } = useTeamDashboard();
  const { isFree } = useSubscription();
  const [showFirstGameCelebration, setShowFirstGameCelebration] = useState(false);
  const [celebrationShown, setCelebrationShown] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(
    () => sessionStorage.getItem("proBannerDismissed") === "1"
  );

  const { data: userStats } = useQuery<{
    totalXp: number;
    currentTier: string;
    currentStreak: number;
    totalGamesLogged: number;
    playerId: number | null;
  }>({
    queryKey: ["/api/users/me"],
    enabled: !!user,
  });

  const playerId = userStats?.playerId;

  const { data: playerBadges } = useQuery<Array<{ id: number; badgeType: string; earnedAt: string }>>({
    queryKey: [`/api/players/${playerId}/badges`],
    enabled: !!playerId,
  });

  const { data: referralData } = useQuery<{ code: string; url: string; conversions: number }>({
    queryKey: ["/api/me/referral-code"],
    enabled: !!user,
  });

  const { data: teamActivity } = useQuery<{ teammateCount: number; playerLoggedToday: boolean; teamName: string | null }>({
    queryKey: [`/api/players/${playerId}/team-activity-today`],
    enabled: !!playerId,
  });

  const { toast } = useToast();

  const totalGames = userStats?.totalGamesLogged || 0;

  // Show first-game celebration once
  useEffect(() => {
    if (totalGames === 1 && !celebrationShown) {
      const shown = sessionStorage.getItem("firstGameCelebrationShown");
      if (!shown) {
        setShowFirstGameCelebration(true);
        setCelebrationShown(true);
        sessionStorage.setItem("firstGameCelebrationShown", "1");
      }
    }
  }, [totalGames, celebrationShown]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const recentPlayers = players?.slice(0, 6) || [];
  const totalPlayers = players?.length || 0;
  const gradedPlayers = teamDashboard?.players.filter((p) => p.avgGradeScore > 0) ?? [];
  const avgTeamGrade = gradedPlayers.length > 0
    ? computeAvgTeamGrade(gradedPlayers.reduce((sum, p) => sum + p.avgGradeScore, 0) / gradedPlayers.length)
    : "—";
  const currentStreak = userStats?.currentStreak || 0;
  const totalXp = userStats?.totalXp || 0;
  const currentTier = userStats?.currentTier || "Rookie";
  const recentBadges = playerBadges?.slice(-3).reverse() || [];

  const TIER_THRESHOLDS: Record<string, number> = {
    Rookie: 0, Starter: 500, "All-Star": 2000, MVP: 5000, "Hall of Fame": 10000,
  };
  const TIER_ORDER = ["Rookie", "Starter", "All-Star", "MVP", "Hall of Fame"];
  const nextTierIndex = TIER_ORDER.indexOf(currentTier) + 1;
  const nextTier = TIER_ORDER[nextTierIndex];
  const nextThreshold = nextTier ? TIER_THRESHOLDS[nextTier] : null;
  const currentThreshold = TIER_THRESHOLDS[currentTier] || 0;
  const tierProgress = nextThreshold
    ? Math.min(100, ((totalXp - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
    : 100;

  return (
    <div className="pb-24 md:pb-6 space-y-6">
      <CelebrationOverlay
        type="grade_a"
        isVisible={showFirstGameCelebration}
        onComplete={() => setShowFirstGameCelebration(false)}
        subtitle="You logged your first game! Keep it up to earn badges and climb the tiers."
      />

      {/* Pro upsell banner for free-tier users */}
      {isFree && !bannerDismissed && (
        <div className="relative flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-accent/20 to-accent/5 border border-accent/30">
          <div className="flex items-center gap-3 min-w-0">
            <Sparkles className="w-5 h-5 text-accent shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Unlock Pro Features</p>
              <p className="text-xs text-muted-foreground truncate">Video analysis, head-to-head challenges, college recruiting tools, and more.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/pricing">
              <Button size="sm" className="gap-1">
                <Lock className="w-3 h-3" />
                Try Pro
              </Button>
            </Link>
            <button
              onClick={() => {
                setBannerDismissed(true);
                sessionStorage.setItem("proBannerDismissed", "1");
              }}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Hero welcome card with animated CSS gradient */}
      <div className="relative overflow-hidden rounded-xl border border-accent/[0.15]">
        {/* Red precision top line */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[hsl(var(--cta))]/70 to-transparent" />
        {/* Animated gradient background */}
        <div className="absolute inset-0 z-0 hero-gradient-bg" />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-r from-background/85 via-background/60 to-background/30" />
        {/* Content */}
        <CardContent className="relative z-[2] p-6 md:p-8">
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
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/20 border border-accent/30">
                  <Flame className="w-5 h-5 text-accent" />
                  <div>
                    <p className="text-xs text-accent/80">Active Streak</p>
                    <p className="font-bold text-accent">{currentStreak} days</p>
                  </div>
                  {currentStreak >= 3 && (
                    <span className="text-xs font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded ml-1">
                      {currentStreak >= 30 ? '2×' : currentStreak >= 14 ? '1.75×' : currentStreak >= 7 ? '1.5×' : '1.25×'} XP
                    </span>
                  )}
                </div>
              )}
              <Link href="/analyze">
                <Button
                  data-testid="button-new-analysis"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Log Game
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
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

      {/* Team Activity Nudge */}
      {teamActivity && teamActivity.teammateCount > 0 && !teamActivity.playerLoggedToday && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-sm">
          <Flame className="w-4 h-4 text-orange-500 shrink-0" />
          <span className="text-foreground">
            <span className="font-semibold text-orange-500">{teamActivity.teammateCount}</span>{" "}
            teammate{teamActivity.teammateCount !== 1 ? 's' : ''} logged{" "}
            {teamActivity.teammateCount !== 1 ? 'games' : 'a game'} today — don't fall behind!
          </span>
        </div>
      )}

      {/* Daily Quests */}
      {playerId && <DailyQuestsWidget playerId={playerId} />}

      {/* Recruiter Activity Banner */}
      {playerId && <RecruiterActivityBanner playerId={playerId} />}

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

          {/* XP & Tier Progress */}
          <Card>
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-accent/10">
                    <Zap className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm">{currentTier}</h3>
                    <p className="text-xs text-muted-foreground">{totalXp.toLocaleString()} XP</p>
                  </div>
                </div>
                {nextTier && (
                  <span className="text-xs text-muted-foreground">→ {nextTier}</span>
                )}
              </div>
            </div>
            <div className="p-4">
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-accent h-2 rounded-full transition-all duration-500"
                  style={{ width: `${tierProgress}%` }}
                />
              </div>
              {nextTier && nextThreshold && (
                <p className="text-xs text-muted-foreground mt-2">
                  {(nextThreshold - totalXp).toLocaleString()} XP to {nextTier}
                </p>
              )}
            </div>
          </Card>

          {/* Recent Achievements */}
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
              {recentBadges.length === 0 ? (
                <div className="text-center py-6">
                  <Trophy className="w-10 h-10 text-accent/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {totalGames === 0
                      ? "Log your first game to start earning badges"
                      : "Keep logging games to earn badges!"}
                  </p>
                  <Link href="/analyze">
                    <Button variant="outline" size="sm" className="mt-3">
                      {totalGames === 0 ? "Log First Game" : "Log Another Game"}
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentBadges.map((badge) => {
                    const BadgeIcon = BADGE_ICONS[badge.badgeType] || Award;
                    const badgeDef = BADGE_DEFINITIONS[badge.badgeType as keyof typeof BADGE_DEFINITIONS];
                    return (
                      <div
                        key={badge.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-accent/5 border border-accent/10"
                      >
                        <div className="p-1.5 rounded-md bg-accent/20">
                          <BadgeIcon className="w-3.5 h-3.5 text-accent" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {badgeDef?.name || badge.badgeType}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {badgeDef?.description || ""}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {playerId && (
                    <Link href={`/players/${playerId}`}>
                      <Button variant="ghost" size="sm" className="w-full mt-1 text-xs text-accent">
                        View All Badges
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Invite Your Team */}
          <Card>
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-accent/10">
                  <Share2 className="w-4 h-4 text-accent" />
                </div>
                <h3 className="font-bold text-foreground">Invite Your Team</h3>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                Share your link — earn <span className="text-accent font-semibold">+500 XP</span> for every teammate who joins and logs their first game.
              </p>
              {referralData ? (
                <>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border border-border">
                    <span className="text-xs text-muted-foreground flex-1 truncate font-mono">
                      {referralData.url.replace(/^https?:\/\//, '')}
                    </span>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(referralData.url);
                        toast({ title: "Copied!", description: "Invite link copied to clipboard" });
                      }}
                      className="p-1 rounded hover:bg-accent/10 transition-colors shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5 text-accent" />
                    </button>
                  </div>
                  {referralData.conversions > 0 && (
                    <p className="text-xs text-accent font-semibold">
                      {referralData.conversions} teammate{referralData.conversions !== 1 ? 's' : ''} joined with your link → +{referralData.conversions * 500} XP earned
                    </p>
                  )}
                </>
              ) : (
                <div className="h-9 bg-muted/50 animate-pulse rounded-lg" />
              )}
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
