import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateGame, usePlayers, usePlayer } from "@/hooks/use-basketball";
import { insertGameSchema } from "@shared/schema";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, Trophy, Share2, Target, TrendingUp, ChevronDown, Video, AlertCircle } from "lucide-react";
import { calcDefenseRating, calcBasketballHustle } from "@/lib/gameAnalytics";
import { cn } from "@/lib/utils";
import {
  SectionEyebrow,
  StatNumber,
  GradeBadge,
  AchievementToastHost,
  pushAchievementToast,
} from "@/components/signal";
import { runBootTimeline, setInitial } from "@/lib/motion";
import { Link } from "wouter";
import { ShareModal } from "@/components/ShareModal";
import { ShareableGameCard } from "@/components/ShareableCard";
import { ShareableBadgeCard } from "@/components/ShareableBadgeCard";
import { BADGE_DEFINITIONS } from "@shared/schema";
import { HighlightUploader } from "@/components/HighlightUploader";
import { useSport } from "@/components/SportToggle";
import { BASKETBALL_POSITIONS } from "@shared/sports-config";
import { motion } from "framer-motion";
import { useXPNotification, XP_ACTIONS } from "@/components/XPToast";
import { useCelebrationContext } from "@/components/CelebrationOverlay";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

/* ------------------------------------------------------------------ */
/* SIGNAL token helpers — grade ramp + semantic split colors           */
/* ------------------------------------------------------------------ */

// Semantic stat colors from the grade ramp (DESIGN-LANGUAGE §3): success and
// danger reuse --grade-a / --grade-f; crimson stays the earned accent.
const STAT_GOOD = "hsl(var(--grade-a))";
const STAT_BAD = "hsl(var(--grade-f))";
const STAT_MID = "hsl(var(--crimson))";

/** Color for a shooting-split percentage readout. */
function splitColor(pct: string, hi: number, lo: number): string {
  if (pct === "—") return "hsl(var(--silver-lo))";
  const v = parseFloat(pct);
  if (v >= hi) return STAT_GOOD;
  if (v < lo) return STAT_BAD;
  return STAT_MID;
}

/** Color for a 0–100 intangible rating (defense / hustle). */
function ratingColor(v: number): string {
  if (v >= 75) return STAT_GOOD;
  if (v >= 60) return STAT_MID;
  if (v < 40) return STAT_BAD;
  return "hsl(var(--silver-lo))";
}

// NOTE(dedup): mirrors the private ramp lookup inside signal/GradeBadge —
// used here for the tier-color reveal flash. Consolidate when GradeBadge
// exports its ramp helper.
function gradeVar(grade: string): string {
  const g = grade.trim().toUpperCase();
  if (g === "A+") return "--grade-a-plus";
  if (g.startsWith("A")) return "--grade-a";
  if (g.startsWith("B")) return "--grade-b";
  if (g.startsWith("C")) return "--grade-c";
  if (g.startsWith("D")) return "--grade-d";
  return "--grade-f";
}

/** "threeMade" / "three_made" → "Three Made" (for record/goal labels). */
function prettyStat(statName: string): string {
  return statName
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const PANEL = "relative overflow-hidden rounded-card border border-line bg-obsidian-1";
const FIELD_LABEL = "font-display text-label uppercase text-muted-foreground";

export default function AnalyzeGame() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const preselectedPlayerId = searchParams.get('playerId');
  const { user } = useAuth();

  const isCoach = user?.role === 'coach';
  const userPlayerId = user?.playerId;

  const effectivePlayerId = isCoach ? preselectedPlayerId : (userPlayerId ? String(userPlayerId) : preselectedPlayerId);

  const isFromVideoAnalysis = searchParams.get('source') === 'video_analysis';
  const [quickLogMode, setQuickLogMode] = useState(false);
  const { data: players, isLoading: playersLoading, isError: playersError } = usePlayers();
  const { mutate, isPending, data: resultGame } = useCreateGame();

  if (resultGame) {
    return <ReportCardView game={resultGame} onReset={() => window.location.reload()} />;
  }

  // Coach benefit: clear feedback instead of a silently empty player dropdown
  if (playersLoading) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading players...</span>
      </div>
    );
  }

  if (playersError) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-destructive">
        <AlertCircle className="w-5 h-5" />
        <span>Failed to load players. Please refresh and try again.</span>
      </div>
    );
  }

  // Athlete benefit: catch missing profile early rather than showing "Loading your profile..." forever
  if (!isCoach && !effectivePlayerId) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-muted-foreground">
        <AlertCircle className="w-5 h-5" />
        <span>No player profile found. Please complete your profile setup first.</span>
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-8 space-y-8">
      <div className={cn(PANEL, "gloss")}>
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Link href="/players" className="-ml-2 p-2 text-muted-foreground transition-colors hover:text-foreground" data-testid="link-back">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <SectionEyebrow as="span">Performance Analysis</SectionEyebrow>
              </div>
              <h1
                className="text-title uppercase leading-none text-silver-hi"
                style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontStretch: "125%", letterSpacing: "-0.01em" }}
              >
                Game Analysis
              </h1>
              {effectivePlayerId && (() => {
                const prePlayer = (players || []).find((p: any) => String(p.id) === String(effectivePlayerId));
                return prePlayer ? (
                  <p className="font-mono text-data text-crimson">
                    Logging game for {prePlayer.name}{prePlayer.jerseyNumber ? ` #${prePlayer.jerseyNumber}` : ''}
                  </p>
                ) : null;
              })()}
              <p className="max-w-md font-body text-body text-muted-foreground">
                Input your game stats to generate an AI-powered performance report card with personalized feedback.
              </p>
            </div>

            {/* Coach/athlete benefit: Full Stats lets you add notes; Quick Log is for fast entry */}
            <div className="flex items-center gap-1 rounded-input border border-line bg-obsidian-2 p-1">
              <button
                type="button"
                onClick={() => setQuickLogMode(false)}
                className={cn(
                  "rounded-md px-3 py-1.5 font-display text-label uppercase transition-colors",
                  !quickLogMode ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                data-testid="button-full-mode"
              >
                Full Stats
              </button>
              <button
                type="button"
                onClick={() => setQuickLogMode(true)}
                className={cn(
                  "rounded-md px-3 py-1.5 font-display text-label uppercase transition-colors",
                  quickLogMode ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                data-testid="button-quick-mode"
              >
                Quick Log
              </button>
            </div>
          </div>
        </div>
      </div>

      {isFromVideoAnalysis && (
        <div className="flex items-center gap-2 rounded-input border border-crimson/25 bg-crimson/10 p-3 text-sm" data-testid="alert-video-prefill">
          <Video className="w-4 h-4 shrink-0 text-crimson" />
          <span className="text-foreground">Stats pre-filled from AI video analysis. Review and fill in remaining fields before saving.</span>
        </div>
      )}

      <GameForm
        players={players || []}
        preselectedPlayerId={effectivePlayerId}
        onSubmit={mutate}
        isPending={isPending}
        isCoach={isCoach}
        quickLogMode={quickLogMode}
        prefillStats={isFromVideoAnalysis ? Object.fromEntries(searchParams.entries()) : undefined}
      />
    </div>
  );
}

function GameForm({ players, preselectedPlayerId, onSubmit, isPending, isCoach, quickLogMode, prefillStats }: any) {
  const [autoCalcPoints, setAutoCalcPoints] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  // Coach/athlete benefit: structured result prevents malformed data downstream
  const [resultType, setResultType] = useState<'W' | 'L' | 'T'>('W');
  const [resultScore, setResultScore] = useState('');
  const sport = useSport();

  const pf = (key: string, fallback: number) => prefillStats && prefillStats[key] !== undefined ? Number(prefillStats[key]) : fallback;

  const form = useForm<z.infer<typeof insertGameSchema>>({
    resolver: zodResolver(insertGameSchema),
    defaultValues: {
      playerId: preselectedPlayerId ? Number(preselectedPlayerId) : undefined,
      sport: sport,
      date: new Date().toISOString().split('T')[0],
      opponent: "",
      result: "W",
      minutes: 0,
      points: pf('points', 0),
      rebounds: pf('rebounds', 0),
      assists: pf('assists', 0),
      steals: pf('steals', 0),
      blocks: pf('blocks', 0),
      turnovers: pf('turnovers', 0),
      fouls: 0,
      fgMade: pf('fgMade', 0),
      fgAttempted: pf('fgAttempted', 0),
      threeMade: pf('threeMade', 0),
      threeAttempted: pf('threeAttempted', 0),
      ftMade: pf('ftMade', 0),
      ftAttempted: pf('ftAttempted', 0),
      offensiveRebounds: 0,
      defensiveRebounds: 0,
      hustleScore: pf('hustleScore', 50),
      defenseRating: pf('defenseRating', 50),
      notes: prefillStats ? "Stats from AI video analysis" : "",
      completions: 0,
      passAttempts: 0,
      passingYards: 0,
      passingTouchdowns: 0,
      interceptions: 0,
      sacksTaken: 0,
      carries: 0,
      rushingYards: 0,
      rushingTouchdowns: 0,
      fumbles: 0,
      receptions: 0,
      targets: 0,
      receivingYards: 0,
      receivingTouchdowns: 0,
      drops: 0,
      tackles: 0,
      soloTackles: 0,
      sacks: 0,
      defensiveInterceptions: 0,
      passDeflections: 0,
      forcedFumbles: 0,
      fumbleRecoveries: 0,
      fieldGoalsMade: 0,
      fieldGoalsAttempted: 0,
      extraPointsMade: 0,
      extraPointsAttempted: 0,
      punts: 0,
      puntYards: 0,
      pancakeBlocks: 0,
      sacksAllowed: 0,
      penalties: 0,
    }
  });

  useEffect(() => {
    form.setValue('sport', sport);
  }, [sport, form]);

  useEffect(() => {
    form.setValue('result', resultScore.trim() ? `${resultType} ${resultScore.trim()}` : resultType);
  }, [resultType, resultScore, form]);

  const fgMade = form.watch('fgMade') || 0;
  const fgAttempted = form.watch('fgAttempted') || 0;
  const threeMade = form.watch('threeMade') || 0;
  const threeAttempted = form.watch('threeAttempted') || 0;
  const ftMade = form.watch('ftMade') || 0;
  const ftAttempted = form.watch('ftAttempted') || 0;

  const steals = form.watch('steals') || 0;
  const blocks = form.watch('blocks') || 0;
  const defensiveRebounds = form.watch('defensiveRebounds') || 0;
  const offensiveRebounds = form.watch('offensiveRebounds') || 0;
  const assists = form.watch('assists') || 0;
  const minutes = form.watch('minutes') || 1;
  const playerId = form.watch('playerId');

  const selectedPlayer = players.find((p: any) => p.id === playerId);
  const storedPosition = selectedPlayer?.position || 'Wing';

  const position = storedPosition;

  useEffect(() => {
    if (fgMade > fgAttempted) {
      form.setValue('fgMade', fgAttempted);
    }
    if (threeMade > threeAttempted) {
      form.setValue('threeMade', threeAttempted);
    }
    if (ftMade > ftAttempted) {
      form.setValue('ftMade', ftAttempted);
    }
  }, [fgMade, fgAttempted, threeMade, threeAttempted, ftMade, ftAttempted]);

  const fgPercent = fgAttempted > 0 ? ((fgMade / fgAttempted) * 100).toFixed(1) : '—';
  const threePercent = threeAttempted > 0 ? ((threeMade / threeAttempted) * 100).toFixed(1) : '—';
  const ftPercent = ftAttempted > 0 ? ((ftMade / ftAttempted) * 100).toFixed(1) : '—';

  const calculatedPoints = (fgMade * 2) + (threeMade * 3) + (ftMade * 1);
  const tsa = fgAttempted + (0.44 * ftAttempted);
  const tsPercent = tsa > 0 ? ((calculatedPoints / (2 * tsa)) * 100).toFixed(1) : '—';

  const calculatedDefenseRating = calcDefenseRating({
    steals, blocks, defensiveRebounds, minutes, position: position as string,
  });

  const calculatedHustleScore = calcBasketballHustle({
    steals, offensiveRebounds, defensiveRebounds, assists, blocks,
    minutes, position: position as string,
  });

  useEffect(() => {
    if (autoCalcPoints) {
      form.setValue('points', calculatedPoints);
    }
  }, [fgMade, threeMade, ftMade, autoCalcPoints]);

  useEffect(() => {
    form.setValue('defenseRating', calculatedDefenseRating);
    form.setValue('hustleScore', calculatedHustleScore);
  }, [steals, blocks, defensiveRebounds, offensiveRebounds, assists, minutes, position]);

  return (
    <motion.form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6 max-w-4xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.section variants={sectionVariants} className={PANEL}>
        <div className="p-6">
          <SectionEyebrow as="h3" className="mb-6">01 · Matchup Details</SectionEyebrow>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className={FIELD_LABEL}>Player</label>
              {isCoach ? (
                <Select
                  onValueChange={(val) => form.setValue("playerId", Number(val))}
                  defaultValue={preselectedPlayerId}
                >
                  <SelectTrigger className="h-11 border-line bg-obsidian-2 text-foreground transition-colors focus:border-crimson/50" data-testid="select-player">
                    <SelectValue placeholder="Select a player..." />
                  </SelectTrigger>
                  <SelectContent className="border-line bg-obsidian-2 text-foreground">
                    {players
                      .filter((p: any) => p.sport === sport || String(p.id) === preselectedPlayerId)
                      .map((p: any) => (
                          <SelectItem key={p.id} value={String(p.id)}>{p.name} (#{p.jerseyNumber}) - {p.position}</SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex h-11 items-center rounded-input border border-line bg-obsidian-2 px-3 text-foreground" data-testid="text-player-name">
                  {selectedPlayer ? (
                    <span>{selectedPlayer.name} (#{selectedPlayer.jerseyNumber}) - {selectedPlayer.position}</span>
                  ) : (
                    <span className="text-muted-foreground">Loading your profile...</span>
                  )}
                </div>
              )}
              {form.formState.errors.playerId && <p className="text-xs text-destructive">Player is required</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="input-opponent" className={FIELD_LABEL}>Opponent</label>
              <Input id="input-opponent" {...form.register("opponent")} placeholder="vs. Team Name" className="h-11 border-line bg-obsidian-2 text-foreground transition-colors focus:border-crimson/50"
                aria-invalid={!!form.formState.errors.opponent}
                aria-describedby={form.formState.errors.opponent ? "error-opponent" : undefined}
              />
              {form.formState.errors.opponent && <p id="error-opponent" className="text-xs text-destructive" role="alert">Opponent required</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="input-date" className={FIELD_LABEL}>Date</label>
              <Input id="input-date" type="date" {...form.register("date")} className="h-11 border-line bg-obsidian-2 text-foreground transition-colors focus:border-crimson/50" />
            </div>

            <div className="space-y-2">
              <label className={FIELD_LABEL}>Result</label>
              {/* Coach benefit: structured input prevents "win" / "105-98" typos that break display */}
              <div className="flex gap-2">
                <div className="flex overflow-hidden rounded-input border border-line">
                  {(['W', 'L', 'T'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setResultType(r)}
                      className={cn(
                        "h-11 px-4 font-display text-sm font-bold transition-colors",
                        resultType === r
                          ? "bg-accent text-accent-foreground"
                          : "bg-obsidian-2 text-muted-foreground hover:text-foreground"
                      )}
                      data-testid={`button-result-${r.toLowerCase()}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <Input
                  value={resultScore}
                  onChange={(e) => setResultScore(e.target.value)}
                  placeholder="105-98 (optional)"
                  className="h-11 flex-1 border-line bg-obsidian-2 tabular-nums text-foreground transition-colors focus:border-crimson/50"
                  data-testid="input-result-score"
                />
              </div>
              <input type="hidden" {...form.register("result")} />
            </div>
          </div>
        </div>
      </motion.section>

      {sport === 'basketball' && (
        <>
          {quickLogMode ? (
            <motion.section variants={sectionVariants} className={PANEL}>
              <div className="p-6">
                <SectionEyebrow as="h3" className="mb-6">02 · Quick Stats</SectionEyebrow>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StepperInput label="Points" name="points" register={form.register} setValue={form.setValue} watch={form.watch} />
                  <StepperInput label="Rebounds" name="rebounds" register={form.register} setValue={form.setValue} watch={form.watch} />
                  <StepperInput label="Assists" name="assists" register={form.register} setValue={form.setValue} watch={form.watch} />
                  <StepperInput label="Steals" name="steals" register={form.register} setValue={form.setValue} watch={form.watch} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className={FIELD_LABEL}>Field Goals</p>
                    <div className="grid grid-cols-2 gap-2">
                      <StepperInput label="Made" name="fgMade" register={form.register} setValue={form.setValue} watch={form.watch} />
                      <StepperInput label="Att" name="fgAttempted" register={form.register} setValue={form.setValue} watch={form.watch} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className={FIELD_LABEL}>3-Pointers</p>
                    <div className="grid grid-cols-2 gap-2">
                      <StepperInput label="Made" name="threeMade" register={form.register} setValue={form.setValue} watch={form.watch} />
                      <StepperInput label="Att" name="threeAttempted" register={form.register} setValue={form.setValue} watch={form.watch} />
                    </div>
                  </div>
                </div>
                {/* Coach benefit: make it clear notes are available in Full Stats mode */}
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  Switch to <span className="font-medium text-foreground">Full Stats</span> to add coach notes and shooting splits.
                </p>
              </div>
            </motion.section>
          ) : (
          <>
          <motion.section variants={sectionVariants} className={PANEL}>
            <div className="p-6">
              <SectionEyebrow as="h3" className="mb-6">02 · Box Score</SectionEyebrow>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StepperInput label="Minutes" name="minutes" register={form.register} setValue={form.setValue} watch={form.watch} />
                <StepperInput label="Points" name="points" register={form.register} setValue={form.setValue} watch={form.watch} />
                <StepperInput label="Rebounds" name="rebounds" register={form.register} setValue={form.setValue} watch={form.watch} />
                <StepperInput label="Assists" name="assists" register={form.register} setValue={form.setValue} watch={form.watch} />
                <StepperInput label="Steals" name="steals" register={form.register} setValue={form.setValue} watch={form.watch} />
                <StepperInput label="Blocks" name="blocks" register={form.register} setValue={form.setValue} watch={form.watch} />
                <StepperInput label="Turnovers" name="turnovers" register={form.register} setValue={form.setValue} watch={form.watch} />
                <StepperInput label="Fouls" name="fouls" register={form.register} setValue={form.setValue} watch={form.watch} />
              </div>

              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="mt-4 flex w-full items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                data-testid="button-toggle-advanced"
              >
                <ChevronDown className={cn("w-4 h-4 transition-transform", showAdvanced && "rotate-180")} />
                Advanced Stats
              </button>
              {showAdvanced && (
                <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4">
                  <StepperInput label="Off. Rebounds" name="offensiveRebounds" register={form.register} setValue={form.setValue} watch={form.watch} />
                  <StepperInput label="Def. Rebounds" name="defensiveRebounds" register={form.register} setValue={form.setValue} watch={form.watch} />
                </div>
              )}
            </div>
          </motion.section>

          <motion.section variants={sectionVariants} className={PANEL}>
            <div className="p-6">
              <SectionEyebrow as="h3" className="mb-6">03 · Shooting Splits</SectionEyebrow>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {([
                  { title: "Field Goals", pct: fgPercent, hi: 50, lo: 40, made: "fgMade", att: "fgAttempted" },
                  { title: "3-Pointers", pct: threePercent, hi: 40, lo: 30, made: "threeMade", att: "threeAttempted" },
                  { title: "Free Throws", pct: ftPercent, hi: 80, lo: 70, made: "ftMade", att: "ftAttempted" },
                ] as const).map((split) => (
                  <div key={split.title} className="space-y-4 rounded-card border border-line bg-obsidian-2 p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-foreground">{split.title}</h4>
                      <span
                        className="font-mono text-lg font-bold tabular-nums"
                        style={{ color: splitColor(split.pct, split.hi, split.lo) }}
                      >
                        {split.pct !== '—' ? `${split.pct}%` : '—'}
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <NumberInput label="Made" name={split.made} register={form.register} setValue={form.setValue} watch={form.watch} />
                      <NumberInput label="Attempted" name={split.att} register={form.register} setValue={form.setValue} watch={form.watch} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-card border border-line bg-obsidian-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className={FIELD_LABEL}>True Shooting</p>
                      <p
                        className="font-mono text-2xl font-bold tabular-nums"
                        style={{ color: splitColor(tsPercent, 60, 50) }}
                      >
                        {tsPercent !== '—' ? `${tsPercent}%` : '—'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className={FIELD_LABEL}>Calc. Points</p>
                      <p className="font-mono text-2xl font-bold tabular-nums text-foreground">{calculatedPoints}</p>
                    </div>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={autoCalcPoints}
                      onChange={(e) => setAutoCalcPoints(e.target.checked)}
                      className="h-4 w-4 rounded border-line bg-obsidian-3 text-crimson focus:ring-crimson"
                      data-testid="checkbox-auto-calc-points"
                    />
                    <span className="text-sm text-muted-foreground">Auto-fill points from shooting</span>
                  </label>
                </div>
              </div>
            </div>
          </motion.section>
          </>
          )}
        </>
      )}

      {!(quickLogMode && sport === 'basketball') && (
      <motion.section variants={sectionVariants} className={PANEL}>
        <div className="p-6">
          <SectionEyebrow as="h3" className="mb-6">04 · Intangibles &amp; Notes</SectionEyebrow>

          {sport === 'basketball' && (
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-card border border-line bg-obsidian-2 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <label className={FIELD_LABEL}>Defense Rating</label>
                  <span
                    className="font-mono text-2xl font-bold tabular-nums"
                    style={{ color: ratingColor(calculatedDefenseRating) }}
                    data-testid="text-defense-rating"
                  >
                    {calculatedDefenseRating}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-obsidian-3">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${calculatedDefenseRating}%`,
                      backgroundColor: ratingColor(calculatedDefenseRating),
                    }}
                  />
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Based on steals, blocks, def. rebounds &amp; position
                </p>
              </div>

              <div className="rounded-card border border-line bg-obsidian-2 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <label className={FIELD_LABEL}>Hustle Score</label>
                  <span
                    className="font-mono text-2xl font-bold tabular-nums"
                    style={{ color: ratingColor(calculatedHustleScore) }}
                    data-testid="text-hustle-score"
                  >
                    {calculatedHustleScore}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-obsidian-3">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${calculatedHustleScore}%`,
                      backgroundColor: ratingColor(calculatedHustleScore),
                    }}
                  />
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Based on steals, off. rebounds, assists &amp; effort
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="textarea-notes" className={FIELD_LABEL}>Coach's Notes</label>
            <Textarea
              id="textarea-notes"
              {...form.register("notes")}
              placeholder="Add specific observations, areas for improvement, or key moments..."
              className="min-h-[100px] border-line bg-obsidian-2 text-foreground transition-colors focus:border-crimson/50"
            />
          </div>
        </div>
      </motion.section>
      )}

      <motion.div variants={sectionVariants}>
        <Button
          type="submit"
          disabled={isPending}
          size="lg"
          className="h-14 w-full bg-accent text-lg font-bold text-accent-foreground transition-colors hover:bg-crimson-hot"
          data-testid="button-submit-game"
        >
          {isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analyzing Performance...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" /> Generate Report Card
            </>
          )}
        </Button>
      </motion.div>
    </motion.form>
  );
}

function StepperInput({ label, name, setValue, watch }: { label: string; name: string; register?: any; setValue?: any; watch?: any }) {
  const raw = watch?.(name);
  const displayValue = raw === undefined || raw === null || (typeof raw === 'number' && isNaN(raw)) ? 0 : raw;
  const inputId = `stepper-input-${name}`;
  return (
    <div className="w-full space-y-1" data-testid={`stepper-${name}`}>
      <label htmlFor={inputId} className={cn(FIELD_LABEL, "block text-center")}>{label}</label>
      <Input
        id={inputId}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        name={name}
        value={String(displayValue)}
        onChange={(e) => {
          const cleaned = e.target.value.replace(/[^0-9]/g, '');
          const num = cleaned === '' ? 0 : parseInt(cleaned, 10);
          if (setValue) setValue(name, num, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        }}
        onFocus={(e) => e.target.select()}
        className="h-12 border-line bg-obsidian-2 text-center font-display text-xl font-bold tabular-nums text-foreground transition-colors focus:border-crimson/50 md:h-10"
        data-testid={`input-${name}`}
      />
    </div>
  );
}

function NumberInput({ label, name, setValue, watch }: any) {
  const raw = watch?.(name);
  const displayValue = raw === undefined || raw === null || (typeof raw === 'number' && isNaN(raw)) ? 0 : raw;
  const inputId = `number-input-${name}`;
  return (
    <div className="w-full space-y-1">
      <label htmlFor={inputId} className={cn(FIELD_LABEL, "block text-center")}>{label}</label>
      <Input
        id={inputId}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        name={name}
        value={String(displayValue)}
        onChange={(e) => {
          const cleaned = e.target.value.replace(/[^0-9]/g, '');
          const num = cleaned === '' ? 0 : parseInt(cleaned, 10);
          if (setValue) setValue(name, num, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        }}
        onFocus={(e) => e.target.select()}
        className="h-12 border-line bg-obsidian-2 text-center font-mono text-base tabular-nums text-foreground transition-colors focus:border-crimson/50 md:h-10"
        data-testid={`input-${name}`}
      />
    </div>
  );
}

/**
 * ReportCardView — the unlock moment (DESIGN-LANGUAGE §6 Phase 1d).
 *
 * The grade arrives like unlocking something in a video game: an anime.js
 * boot timeline reveals the header, the stat trio counts up (StatNumber),
 * then the letter grade STAMPS in (scale 1.15 → 1) behind a tier-color
 * flash, and the scouting report follows. Real unlock events returned by
 * the server (career highs, completed goals, tier promotions, badges) fire
 * AchievementToast — nothing is ever fabricated client-side.
 *
 * Reduced motion: the timeline is skipped entirely (runBootTimeline) and
 * the report renders at its final state in a single static frame.
 */
function ReportCardView({ game, onReset }: { game: any, onReset: () => void }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [badgeShareOpen, setBadgeShareOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const { data: player } = usePlayer(game.playerId);
  const { showXPGain } = useXPNotification();
  const { triggerCelebration } = useCelebrationContext();
  const playerName = player?.name || "Player";
  const playerPhoto = player?.photoUrl || undefined;

  const headRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const gradeWrapRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const announcedRef = useRef(false);

  const gradeColorVar = gradeVar(game.grade || "C");

  // The unlock choreography — one boot timeline, compositor-only properties.
  useEffect(() => {
    const head = headRef.current;
    const stats = statsRef.current;
    const gradeWrap = gradeWrapRef.current;
    const flash = flashRef.current;
    const body = bodyRef.current;
    return runBootTimeline({
      targets: [head, stats, gradeWrap, body],
      build: (tl) => {
        if (!head || !stats || !gradeWrap || !body) return;
        setInitial([head, stats, body], { opacity: 0 });
        setInitial(gradeWrap, { opacity: 0 });
        tl.add(head, { opacity: [0, 1], y: [10, 0], duration: 400 }, 0)
          .add(stats, { opacity: [0, 1], y: [14, 0], duration: 450 }, 150)
          // The stamp: tier flash + scale 1.15 → 1 after the count-up lands.
          .add(gradeWrap, { opacity: [0, 1], scale: [1.15, 1], duration: 500 }, 700);
        if (flash) {
          tl.add(
            flash,
            {
              opacity: [
                { to: 0.85, duration: 90, ease: "linear" },
                { to: 0, duration: 600 },
              ],
            },
            700,
          );
        }
        tl.add(body, { opacity: [0, 1], y: [16, 0], duration: 500 }, 950);
      },
    });
  }, []);

  // XP + celebrations + REAL unlock toasts, exactly once per report.
  useEffect(() => {
    if (announcedRef.current) return;
    announcedRef.current = true;

    // Base XP for logging a game
    showXPGain(XP_ACTIONS.GAME_LOGGED.amount, XP_ACTIONS.GAME_LOGGED.reason);

    // Grade-based bonuses
    const gradeChar = game.grade?.charAt(0);
    if (gradeChar === 'A') {
      setTimeout(() => {
        if (game.grade === 'A+') {
          showXPGain(XP_ACTIONS.A_PLUS_GRADE.amount, XP_ACTIONS.A_PLUS_GRADE.reason, { type: "grade" });
          triggerCelebration("grade_a", {
            subtitle: "Outstanding performance!",
            value: "A+"
          });
        } else {
          showXPGain(XP_ACTIONS.A_GRADE.amount, XP_ACTIONS.A_GRADE.reason, { type: "grade" });
        }
      }, 1500);
    }

    // Real, server-confirmed unlock events from the /api/games response —
    // NEVER fabricated. Today the response carries newRecords, completedGoals
    // and newTier; awardedBadges is read defensively so real badge events
    // surface the moment the API starts returning them.
    for (const badgeType of (game.awardedBadges ?? []) as string[]) {
      const def = BADGE_DEFINITIONS[badgeType as keyof typeof BADGE_DEFINITIONS];
      pushAchievementToast({
        eyebrow: "BADGE UNLOCKED",
        title: def?.name || prettyStat(badgeType),
        detail: def?.description,
      });
    }
    for (const rec of (game.newRecords ?? []) as Array<{ statName: string; value: number; previousValue?: number }>) {
      pushAchievementToast({
        eyebrow: "CAREER HIGH",
        title: `${rec.value} ${prettyStat(rec.statName)}`,
        detail: rec.previousValue !== undefined ? `Previous best ${rec.previousValue}` : undefined,
      });
    }
    for (const goal of (game.completedGoals ?? []) as Array<{ statName: string; targetValue: string }>) {
      pushAchievementToast({
        eyebrow: "GOAL COMPLETE",
        title: prettyStat(goal.statName),
        detail: `Target ${goal.targetValue} hit`,
      });
    }
    if (game.newTier) {
      pushAchievementToast({
        eyebrow: "TIER UP",
        title: String(game.newTier),
        detail: "New career tier reached",
      });
    }
  }, [game, showXPGain, triggerCelebration]);

  return (
    <div className="mx-auto max-w-2xl py-8">
      <AchievementToastHost />

      <div className={cn(PANEL, "gloss")}>
        {/* Report header */}
        <div ref={headRef} className="border-b border-line p-6 text-center md:p-8">
          <SectionEyebrow as="div" className="justify-center">Game Report</SectionEyebrow>
          <h2
            className="mt-3 text-title uppercase leading-none text-silver-hi"
            style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontStretch: "125%", letterSpacing: "-0.01em" }}
          >
            {playerName}
          </h2>
          <p className="mt-2 font-mono text-data text-silver-lo">
            vs. {game.opponent} · {new Date(game.date).toLocaleDateString()}
          </p>
        </div>

        {/* THE UNLOCK — grade stamp + counting stat trio */}
        <div className="px-6 py-8 text-center md:px-8">
          <div className="relative inline-flex items-center justify-center">
            <div
              ref={flashRef}
              aria-hidden
              className="pointer-events-none absolute -inset-10 opacity-0"
              style={{
                background: `radial-gradient(closest-side, hsl(var(${gradeColorVar}) / 0.5), transparent 70%)`,
              }}
            />
            <div ref={gradeWrapRef} className="relative" data-testid="grade-reveal">
              <GradeBadge
                grade={game.grade || "—"}
                size="lg"
                className="h-24 min-w-24 px-5 text-6xl"
                data-testid="badge-game-grade"
              />
            </div>
          </div>

          <div ref={statsRef} className="mt-8 flex items-start justify-center gap-8 sm:gap-12">
            <StatNumber value={game.points ?? 0} label="Points" size="sm" data-testid="stat-points" />
            <StatNumber value={game.rebounds ?? 0} label="Rebounds" size="sm" data-testid="stat-rebounds" />
            <StatNumber value={game.assists ?? 0} label="Assists" size="sm" data-testid="stat-assists" />
          </div>
        </div>

        <div ref={bodyRef} className="space-y-6 border-t border-line p-6 md:p-8">
          <div className="space-y-3">
            <SectionEyebrow as="h3">Scouting Report</SectionEyebrow>
            <div className="rounded-card border border-line bg-obsidian-2 p-5">
              <p className="text-sm leading-relaxed text-silver">
                {game.feedback}
              </p>
            </div>
          </div>

          {game.improvementTips && game.improvementTips.length > 0 && (
            <div className="space-y-3">
              <SectionEyebrow as="h3">What to Work On</SectionEyebrow>
              <div className="space-y-3">
                {game.improvementTips.map((tip: {area: string, stat: string, tip: string}, index: number) => (
                  <div key={index} className="flex gap-3 rounded-card border border-line bg-obsidian-2 p-4" data-testid={`improvement-tip-${index}`}>
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-input border border-crimson/25 bg-crimson/10">
                      <TrendingUp className="h-5 w-5 text-crimson" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-foreground">{tip.area}</span>
                        <span className="angle-cut inline-flex items-center border border-crimson/30 bg-crimson/15 px-2 py-0.5 font-display text-label uppercase text-crimson">{tip.stat}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">{tip.tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-card border border-line bg-obsidian-2 p-4">
              <span className={FIELD_LABEL}>Shooting</span>
              <p className="mt-1 font-display text-xl font-bold tabular-nums text-silver-hi">
                {game.fgMade}/{game.fgAttempted} <span className="text-sm text-muted-foreground">FG</span>
              </p>
            </div>
            <div className="rounded-card border border-line bg-obsidian-2 p-4">
              <span className={FIELD_LABEL}>Turnovers</span>
              <p className="mt-1 font-display text-xl font-bold tabular-nums text-silver-hi">
                {game.turnovers} <span className="text-sm text-muted-foreground">TO</span>
              </p>
            </div>
          </div>

          {/* Badges earned this game (real server-awarded badges only) */}
          {game.awardedBadges && game.awardedBadges.length > 0 && (
            <div className="space-y-3">
              <SectionEyebrow as="h3">Badges Earned</SectionEyebrow>
              <div className="space-y-2">
                {game.awardedBadges.map((badgeType: string) => {
                  const badgeDef = BADGE_DEFINITIONS[badgeType as keyof typeof BADGE_DEFINITIONS];
                  return (
                    <div key={badgeType} className="flex items-center justify-between gap-3 rounded-card border border-crimson/25 bg-crimson/10 p-3">
                      <div>
                        <p className="text-sm font-bold text-crimson">{badgeDef?.name || badgeType}</p>
                        <p className="text-xs text-muted-foreground">{badgeDef?.description}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="shrink-0 gap-1.5 text-xs text-crimson hover:bg-crimson/20"
                        onClick={() => { setSelectedBadge(badgeType); setBadgeShareOpen(true); }}
                      >
                        <Share2 className="w-3 h-3" />
                        Share
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* New personal records */}
          {game.newRecords && game.newRecords.length > 0 && (
            <div className="space-y-3">
              <SectionEyebrow as="h3">New Career Highs</SectionEyebrow>
              <div className="grid grid-cols-2 gap-2">
                {game.newRecords.map((rec: { statName: string; value: number; previousValue?: number }) => (
                  <div key={rec.statName} className="rounded-card border border-grade-a/25 bg-grade-a/10 p-3">
                    <p className="text-xs capitalize text-muted-foreground">{prettyStat(rec.statName)}</p>
                    <p className="font-display text-xl font-bold tabular-nums text-grade-a">{rec.value}</p>
                    {rec.previousValue !== undefined && (
                      <p className="text-xs tabular-nums text-muted-foreground">prev: {rec.previousValue}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grade-based share nudge for A/A+ performances */}
          {game.grade && ['A+', 'A', 'A-'].includes(game.grade) && (
            <div className="space-y-2 rounded-card border border-crimson/30 bg-crimson/10 p-4 text-center">
              <p className="text-sm font-bold text-crimson">
                {game.grade === 'A+' ? 'Elite performance!' : 'Standout game!'} Share it with your teammates.
              </p>
              <p className="text-xs text-muted-foreground">
                Let your network see your {game.grade} grade vs {game.opponent}.
              </p>
            </div>
          )}

          <Button
            onClick={() => setShareOpen(true)}
            className="w-full gap-2 bg-accent font-bold text-accent-foreground transition-colors hover:bg-crimson-hot"
            data-testid="button-share-achievement"
          >
            <Share2 className="w-4 h-4" />
            Share Your Achievement
          </Button>

          <HighlightUploader gameId={game.id} playerId={game.playerId} />

          <div className="flex gap-4 pt-2">
            <Button onClick={onReset} variant="outline" className="flex-1 border-line text-foreground hover:bg-obsidian-2">
              Close Report
            </Button>
            <Link href={`/players/${game.playerId}`} className="flex-1">
              <Button className="w-full bg-accent font-bold text-accent-foreground transition-colors hover:bg-crimson-hot">
                View Player Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <ShareModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        title="Share Game Performance"
        shareUrl={`${window.location.origin}/profile/${game.playerId}/public`}
        shareText={`Check out my ${game.points} PTS, ${game.rebounds} REB, ${game.assists} AST game vs ${game.opponent}! Grade: ${game.grade} on @CaliberApp`}
      >
        <ShareableGameCard
          game={game}
          playerName={playerName}
          playerPhoto={playerPhoto}
        />
      </ShareModal>

      {selectedBadge && (
        <ShareModal
          open={badgeShareOpen}
          onOpenChange={setBadgeShareOpen}
          title="Share Badge"
          shareUrl={`${window.location.origin}/players/${game.playerId}`}
          shareText={`I just earned the "${BADGE_DEFINITIONS[selectedBadge as keyof typeof BADGE_DEFINITIONS]?.name || selectedBadge}" badge on @CaliberApp!`}
        >
          <ShareableBadgeCard
            badgeType={selectedBadge}
            playerName={playerName}
            earnedDate={new Date()}
          />
        </ShareModal>
      )}
    </div>
  );
}
