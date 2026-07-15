import { usePlayers, useTeamDashboard } from "@/hooks/use-basketball";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Plus, ChevronRight, Users, TrendingUp, UserPlus, Eye,
  Target, Calendar, Trophy, BarChart3, Star,
  Flame, Award, Shield, Crosshair, Clock, Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkeletonStatCard, SkeletonPlayerCard } from "@/components/ui/skeleton-premium";
import { EmptyState } from "@/components/ui/empty-state";
import { CelebrationOverlay } from "@/components/CelebrationOverlay";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BADGE_DEFINITIONS } from "@shared/schema";
import { useState, useEffect, type ReactNode } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { Lock, Sparkles, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DailyQuestsWidget } from "@/components/DailyQuestsWidget";
import { ShareCaliberScoreButton } from "@/components/ShareCaliberScoreButton";
import { MetalFx } from "metal-fx";
import {
  OvrPlate,
  StatNumber,
  SectionEyebrow,
  TelemetryStrip,
  GradeBadge,
  usePrefersReducedMotion,
  type TelemetryItem,
} from "@/components/signal";

/**
 * Dashboard — SIGNAL: Career Mode, Phase 1c. The career-mode home.
 * The authenticated player's daily screen: ONE hero (the real Caliber Score
 * as an OvrPlate with a season telemetry line — or, before the first game,
 * the first-game CTA), then supporting cast on quiet obsidian surfaces.
 * Every number is real; identity moments concentrate in the hero.
 */

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

/** Archivo Condensed Medium — the "jersey & ticker" label voice. */
const CONDENSED = { fontWeight: 500, fontStretch: "70%" } as const;
/** Archivo Expanded Black — the display voice. */
const DISPLAY_BLACK = {
  fontFamily: "var(--font-display)",
  fontWeight: 900,
  fontStretch: "125%",
  letterSpacing: "-0.01em",
} as const;

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
      <div className="rounded-card border border-line bg-obsidian-1 p-6">
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

/** Real sub-set of /api/players/:id/public — shares the react-query cache
 *  with ShareCaliberScoreButton, so the hero season line costs no extra request. */
interface PublicSeasonData {
  stats: {
    gamesPlayed: number;
    averageGrade: string;
    basketball: { ppg: number; rpg: number; apg: number };
  };
}

/** Same key as ShareCaliberScoreButton / CaliberScore — shares the cache. */
interface AiRatingData {
  overallRating: number | null;
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

  // Recruiter attention is EARNED crimson — the one signal moment below the hero.
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <Link href={`/players/${playerId}/recruiting`}>
        <div className="group relative cursor-pointer overflow-hidden rounded-card border border-crimson/25 bg-crimson/[0.06] p-4 transition-colors hover:border-crimson/50">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
            style={{ background: "radial-gradient(ellipse at 0% 50%, hsl(var(--crimson) / 0.08) 0%, transparent 60%)" }}
          />
          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-crimson/30 bg-crimson/15">
                <Eye aria-hidden className="h-4 w-4 text-crimson" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-body text-sm font-semibold text-foreground">
                    {newToday > 0 ? (
                      <><span className="tabular-nums text-crimson">{newToday} new</span> recruiter view{newToday !== 1 ? 's' : ''} today</>
                    ) : (
                      <><span className="tabular-nums text-crimson">{data.totalViews}</span> total recruiter view{data.totalViews !== 1 ? 's' : ''}</>
                    )}
                  </span>
                  {data.unreadSignals > 0 && (
                    <span
                      className="angle-cut inline-flex items-center border border-crimson/30 bg-crimson/15 px-2 py-0.5 font-display uppercase text-label text-crimson"
                      style={CONDENSED}
                    >
                      {data.unreadSignals} signal{data.unreadSignals !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 truncate font-body text-xs text-muted-foreground">
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
            <ChevronRight className="h-4 w-4 shrink-0 text-crimson/60 transition-colors group-hover:text-crimson" />
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
  const prefersReducedMotion = usePrefersReducedMotion();
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

  // The hero score — real AI rating; same cache key as ShareCaliberScoreButton.
  const { data: rating } = useQuery<AiRatingData>({
    queryKey: ["/api/players", String(playerId), "ai-rating"],
    enabled: !!playerId,
  });

  // Season line for the hero telemetry — same cache key as ShareCaliberScoreButton.
  const { data: publicData } = useQuery<PublicSeasonData>({
    queryKey: [`/api/players/${playerId}/public`],
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

  // Real score or nothing — the plate never invents a numeral.
  const score =
    typeof rating?.overallRating === "number" && rating.overallRating > 0
      ? Math.round(rating.overallRating)
      : null;

  const season = publicData?.stats;
  const seasonTelemetry: TelemetryItem[] = [
    ...(season
      ? [
          { label: "GP", value: season.gamesPlayed },
          { label: "PPG", value: season.basketball.ppg },
          { label: "RPG", value: season.basketball.rpg },
          { label: "APG", value: season.basketball.apg },
          ...(season.averageGrade && season.averageGrade !== "—"
            ? [{ label: "Avg grade", value: season.averageGrade }]
            : []),
        ]
      : []),
    ...(currentStreak > 0 ? [{ label: "Streak", value: `${currentStreak}D` }] : []),
  ];

  const streakMultiplier =
    currentStreak >= 30 ? "2×" : currentStreak >= 14 ? "1.75×" : currentStreak >= 7 ? "1.5×" : "1.25×";

  return (
    <div className="pb-24 md:pb-6 space-y-6">
      <CelebrationOverlay
        type="grade_a"
        isVisible={showFirstGameCelebration}
        onComplete={() => setShowFirstGameCelebration(false)}
        subtitle="You logged your first game! Keep it up to earn badges and climb the tiers."
      />

      {/* Pro upsell banner for free-tier users — quiet obsidian, CTA carries the color */}
      {isFree && !bannerDismissed && (
        <div className="relative flex items-center justify-between gap-3 rounded-card border border-line bg-obsidian-1 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Sparkles aria-hidden className="h-4 w-4 shrink-0 text-silver-lo" />
            <div className="min-w-0">
              <p className="font-body text-sm font-semibold text-foreground">Unlock Pro Features</p>
              <p className="truncate font-body text-xs text-muted-foreground">Video analysis, head-to-head challenges, college recruiting tools, and more.</p>
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
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded cursor-pointer"
              aria-label="Dismiss Pro banner"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* HERO — scoreboard hierarchy: ONE hero. The Caliber Score when it exists;
          the first-game CTA when it doesn't. Identity moments live here only. */}
      <section
        aria-labelledby="dashboard-title"
        className="relative isolate overflow-hidden rounded-card border border-line bg-obsidian-1"
      >
        {/* crimson precision top line */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-crimson/70 to-transparent" />
        {/* quiet atmosphere — depth by light, not shadow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: "radial-gradient(56% 80% at 88% 0%, hsl(var(--crimson-deep) / 0.14), transparent 70%)" }}
        />

        <div className="relative p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <SectionEyebrow as="div">Career Mode</SectionEyebrow>
              <h1
                id="dashboard-title"
                className="lean mt-3 uppercase text-title text-silver-hi"
                style={DISPLAY_BLACK}
                data-testid="text-dashboard-title"
              >
                Welcome Back{user?.firstName ? `, ${user.firstName}` : ''}
              </h1>
              {totalGames > 0 && seasonTelemetry.length > 0 ? (
                <TelemetryStrip items={seasonTelemetry} className="mt-3" data-testid="hero-season-telemetry" />
              ) : (
                <p className="mt-3 max-w-md font-body text-body text-muted-foreground">
                  Track performance, analyze games, and unlock your potential
                </p>
              )}
            </div>

            {/* the hero number — real score plate, or real games count while ungraded */}
            {totalGames > 0 && (
              score !== null ? (
                <OvrPlate score={score} className="shrink-0" data-testid="hero-ovr-plate" />
              ) : (
                <StatNumber
                  value={totalGames}
                  label="Games logged"
                  className="shrink-0"
                  data-testid="hero-games-logged"
                />
              )
            )}
          </div>

          {/* first-game CTA — IS the hero before the first logged game */}
          {totalGames === 0 && (
            <div className="mt-6 border-t border-line pt-6">
              <p className="font-body text-body font-semibold text-foreground">
                Log your first game to get a graded performance report card
              </p>
              <p className="mt-1 font-body text-xs text-muted-foreground">
                Enter your stats and receive an AI-powered grade with personalized feedback.
              </p>
              <div className="mt-4">
                {/* the one MetalFx allowed on this screen */}
                <Link href="/analyze">
                  <MetalFx
                    variant="button"
                    preset="silver"
                    theme="dark"
                    paused={prefersReducedMotion}
                    className="inline-flex w-fit"
                  >
                    <Button className="gap-2" data-testid="button-first-game-cta">
                      <Plus className="w-4 h-4" />
                      Log First Game
                    </Button>
                  </MetalFx>
                </Link>
              </div>
            </div>
          )}

          {/* supporting actions */}
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
            {currentStreak > 0 && (
              <div className="angle-cut flex items-center gap-2 border border-line bg-obsidian-2 px-3 py-2">
                <Flame aria-hidden className="h-4 w-4 text-crimson" />
                <span className="font-mono text-data tabular-nums text-foreground">
                  {currentStreak}-day streak
                </span>
                {currentStreak >= 3 && (
                  <span className="font-mono text-data tabular-nums text-crimson">
                    {streakMultiplier} XP
                  </span>
                )}
              </div>
            )}
            {playerId && <ShareCaliberScoreButton playerId={playerId} />}
            <Link href="/analyze">
              <Button
                variant={totalGames === 0 ? "outline" : "default"}
                data-testid="button-new-analysis"
              >
                <Plus className="w-4 h-4 mr-2" />
                Log Game
              </Button>
            </Link>
          </div>
        </div>
      </section>

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
            value={<StatValue>{totalPlayers}</StatValue>}
            href="/players"
            testId="card-roster-size"
          />
        </motion.div>

        <motion.div variants={fadeUpVariants}>
          <StatCard
            icon={TrendingUp}
            label="Team Grade"
            value={
              avgTeamGrade !== "—" ? (
                <GradeBadge grade={avgTeamGrade} size="md" />
              ) : (
                <StatValue muted>—</StatValue>
              )
            }
            testId="card-team-grade"
          />
        </motion.div>

        <motion.div variants={fadeUpVariants}>
          <StatCard
            icon={Target}
            label="Games Logged"
            value={<StatValue>{totalGames}</StatValue>}
            href="/analyze"
            testId="card-games-logged"
          />
        </motion.div>

        <motion.div variants={fadeUpVariants}>
          <StatCard
            icon={Trophy}
            label="Rankings"
            value={<StatValue size="sm">Leaderboard</StatValue>}
            href="/leaderboard"
            testId="card-leaderboard"
          />
        </motion.div>
      </motion.div>

      {/* Team Activity Nudge */}
      {teamActivity && teamActivity.teammateCount > 0 && !teamActivity.playerLoggedToday && (
        <div className="flex items-center gap-3 rounded-card border border-line bg-obsidian-1 px-4 py-3 font-body text-sm">
          <Flame aria-hidden className="h-4 w-4 shrink-0 text-crimson" />
          <span className="text-foreground">
            <span className="font-semibold tabular-nums text-crimson">{teamActivity.teammateCount}</span>{" "}
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
          <div className="rounded-card border border-line bg-obsidian-1">
            <div className="flex items-center justify-between gap-2 border-b border-line p-4">
              <div className="min-w-0">
                <SectionEyebrow as="h2">Your Roster</SectionEyebrow>
                <p className="mt-1.5 pl-9 font-mono text-data tabular-nums text-muted-foreground">
                  {totalPlayers} players tracked
                </p>
              </div>
              <Link
                href="/players"
                className="flex shrink-0 items-center gap-1 font-display uppercase text-label text-silver-lo transition-colors hover:text-foreground"
                style={CONDENSED}
                data-testid="link-view-all-players"
              >
                View All <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-line">
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
                      className="group block transition-colors hover:bg-obsidian-2/60"
                      data-testid={`link-player-${player.id}`}
                    >
                      <div className="flex items-center justify-between gap-2 p-4">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div
                            className="angle-cut flex h-10 w-10 items-center justify-center border border-line bg-obsidian-2 font-display text-sm tabular-nums text-silver"
                            style={{ fontWeight: 800 }}
                          >
                            {player.jerseyNumber || "#"}
                          </div>
                          <div>
                            <p className="font-body font-medium text-foreground transition-colors group-hover:text-silver-hi">{player.name}</p>
                            <p className="font-mono text-data text-muted-foreground">
                              {player.position} · {player.team || "No Team"}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-silver-mute transition-colors group-hover:text-silver-lo" />
                      </div>
                    </Link>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="rounded-card border border-line bg-obsidian-1">
            <div className="border-b border-line p-4">
              <SectionEyebrow as="h3">Quick Actions</SectionEyebrow>
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
          </div>

          {/* XP & Tier Progress */}
          <div className="rounded-card border border-line bg-obsidian-1">
            <div className="border-b border-line p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3
                    className="uppercase text-section text-silver-hi"
                    style={DISPLAY_BLACK}
                  >
                    {currentTier}
                  </h3>
                  <p className="mt-0.5 font-mono text-data tabular-nums text-muted-foreground">{totalXp.toLocaleString()} XP</p>
                </div>
                {nextTier && (
                  <span className="font-display uppercase text-label text-silver-mute" style={CONDENSED}>
                    → {nextTier}
                  </span>
                )}
              </div>
            </div>
            <div className="p-4">
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-obsidian-3"
                role="progressbar"
                aria-valuenow={Math.round(tierProgress)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progress to ${nextTier ?? 'max tier'}: ${Math.round(tierProgress)}%`}
              >
                <div
                  className="h-full rounded-full bg-crimson transition-all duration-500"
                  style={{ width: `${tierProgress}%` }}
                />
              </div>
              {nextTier && nextThreshold && (
                <p className="mt-2 font-mono text-data tabular-nums text-muted-foreground">
                  {(nextThreshold - totalXp).toLocaleString()} XP to {nextTier}
                </p>
              )}
            </div>
          </div>

          {/* Recent Achievements */}
          <div className="rounded-card border border-line bg-obsidian-1">
            <div className="border-b border-line p-4">
              <SectionEyebrow as="h3">Recent Achievements</SectionEyebrow>
            </div>

            <div className="p-4">
              {recentBadges.length === 0 ? (
                <div className="text-center py-6">
                  <Trophy aria-hidden className="mx-auto mb-3 h-10 w-10 text-silver-mute" />
                  <p className="font-body text-sm text-muted-foreground">
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
                        className="angle-cut flex items-center gap-3 border border-line bg-obsidian-2 p-2.5"
                      >
                        <BadgeIcon aria-hidden className="h-3.5 w-3.5 shrink-0 text-crimson" />
                        <div className="min-w-0">
                          <p className="truncate font-display uppercase text-label text-foreground" style={CONDENSED}>
                            {badgeDef?.name || badge.badgeType}
                          </p>
                          <p className="truncate font-body text-xs text-muted-foreground">
                            {badgeDef?.description || ""}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {playerId && (
                    <Link href={`/players/${playerId}`}>
                      <Button variant="ghost" size="sm" className="mt-1 w-full text-xs text-silver-lo hover:text-foreground">
                        View All Badges
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Invite Your Team */}
          <div className="rounded-card border border-line bg-obsidian-1">
            <div className="border-b border-line p-4">
              <SectionEyebrow as="h3">Invite Your Team</SectionEyebrow>
            </div>
            <div className="p-4 space-y-3">
              <p className="font-body text-xs text-muted-foreground">
                Share your link — earn <span className="font-semibold tabular-nums text-crimson">+500 XP</span> for every teammate who joins and logs their first game.
              </p>
              {referralData ? (
                <>
                  <div className="flex items-center gap-2 rounded-input border border-line bg-obsidian-2 p-2.5">
                    <span className="flex-1 truncate font-mono text-data text-muted-foreground">
                      {referralData.url.replace(/^https?:\/\//, '')}
                    </span>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(referralData.url);
                        toast({ title: "Copied!", description: "Invite link copied to clipboard" });
                      }}
                      className="shrink-0 rounded p-1 transition-colors hover:bg-obsidian-3"
                      aria-label="Copy invite link"
                    >
                      <Copy className="h-3.5 w-3.5 text-silver-lo" />
                    </button>
                  </div>
                  {referralData.conversions > 0 && (
                    <p className="font-mono text-data tabular-nums text-crimson">
                      {referralData.conversions} teammate{referralData.conversions !== 1 ? 's' : ''} joined with your link → +{referralData.conversions * 500} XP earned
                    </p>
                  )}
                </>
              ) : (
                <div className="h-9 animate-pulse rounded-input bg-obsidian-2" />
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/** Display-voice numeral/text for the stat tiles — static on purpose;
 *  the count-up identity moment stays concentrated in the hero. */
function StatValue({
  children,
  size = "md",
  muted = false,
}: {
  children: ReactNode;
  size?: "md" | "sm";
  muted?: boolean;
}) {
  return (
    <span
      className={cn(
        "uppercase leading-none tabular-nums",
        size === "sm" && "whitespace-nowrap",
        muted ? "text-silver-mute" : "text-silver-hi",
      )}
      style={{
        fontVariantNumeric: "tabular-nums lining-nums",
        ...(size === "md"
          ? { ...DISPLAY_BLACK, fontSize: "var(--text-title)" }
          : {
              fontFamily: "var(--font-display)",
              // condensed "jersey ticker" voice — fluid so words like
              // LEADERBOARD fit a half-width card at 320px
              fontWeight: 800,
              fontStretch: "70%",
              letterSpacing: "0.04em",
              fontSize: "clamp(0.875rem, 0.55rem + 1.6vw, 1.25rem)",
            }),
      }}
    >
      {children}
    </span>
  );
}

interface StatCardProps {
  icon: typeof Users;
  label: string;
  value: ReactNode;
  href?: string;
  testId?: string;
}

function StatCard({ icon: Icon, label, value, href, testId }: StatCardProps) {
  const content = (
    <div
      className={cn(
        "spring-lift group h-full rounded-card border border-line bg-obsidian-1 p-4 transition-colors sm:p-5",
        href && "cursor-pointer hover:border-silver/30",
      )}
      data-testid={testId}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-h-8 items-center">{value}</div>
          <p className="mt-1.5 font-display uppercase text-label text-muted-foreground" style={CONDENSED}>
            {label}
          </p>
        </div>
        <Icon aria-hidden className="h-4 w-4 shrink-0 text-silver-mute transition-colors group-hover:text-silver-lo" />
      </div>
    </div>
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
        className="group w-full justify-start gap-3 border border-line hover:border-silver/25"
      >
        <Icon className="h-4 w-4 text-silver-lo" />
        <span className="font-body">{label}</span>
        <ChevronRight className="ml-auto h-4 w-4 text-silver-mute transition-transform group-hover:translate-x-0.5" />
      </Button>
    </Link>
  );
}
