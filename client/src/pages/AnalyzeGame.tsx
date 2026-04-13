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
import { ArrowLeft, Save, Loader2, Trophy, Share2, Target, ClipboardList, TrendingUp, ChevronDown, Video, AlertCircle } from "lucide-react";
import { calcDefenseRating, calcBasketballHustle } from "@/lib/gameAnalytics";
import { cn } from "@/lib/utils";
import { GradeBadge } from "@/components/GradeBadge";
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
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  useEffect(() => {
    if (resultGame && (resultGame as any).newRecords && (resultGame as any).newRecords.length > 0) {
      const newRecords = (resultGame as any).newRecords;
      toast({
        title: "New Career High!",
        description: `You set ${newRecords.length} new personal record${newRecords.length > 1 ? 's' : ''}!`,
      });
    }
    
    if ((resultGame as any)?.completedGoals && (resultGame as any).completedGoals.length > 0) {
      const completed = (resultGame as any).completedGoals;
      toast({
        title: "Goal Completed!",
        description: `You hit ${completed.length} goal${completed.length > 1 ? 's' : ''}! Keep pushing!`,
      });
    }
  }, [resultGame, toast]);

  if (resultGame) {
    return <ReportCardView game={resultGame} onReset={() => window.location.reload()} />;
  }

  // Coach benefit: clear feedback instead of a silently empty player dropdown
  if (playersLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground gap-3">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading players...</span>
      </div>
    );
  }

  if (playersError) {
    return (
      <div className="flex items-center justify-center py-24 text-destructive gap-3">
        <AlertCircle className="w-5 h-5" />
        <span>Failed to load players. Please refresh and try again.</span>
      </div>
    );
  }

  // Athlete benefit: catch missing profile early rather than showing "Loading your profile..." forever
  if (!isCoach && !effectivePlayerId) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground gap-3">
        <AlertCircle className="w-5 h-5" />
        <span>No player profile found. Please complete your profile setup first.</span>
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-8 space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-card/80 border border-accent/20">
        <div className="absolute inset-0 opacity-30" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 blur-[80px] rounded-full" />
        
        <div className="relative z-10 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Link href="/players" className="text-muted-foreground hover:text-foreground transition-colors p-2 -ml-2" data-testid="link-back">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-6 h-6 text-accent" />
                  <span className="text-xs uppercase tracking-wider text-accent font-semibold">Performance Analysis</span>
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">
                <span className="from-white via-accent to-accent">
                  Game Analysis
                </span>
              </h1>
              <p className="text-muted-foreground max-w-md">
                Input your game stats to generate an AI-powered performance report card with personalized feedback.
              </p>
            </div>

            {/* Coach/athlete benefit: Full Stats lets you add notes; Quick Log is for fast entry */}
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1 border border-border">
              <button
                type="button"
                onClick={() => setQuickLogMode(false)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
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
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
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
        <div className="flex items-center gap-2 p-3 bg-accent/10 rounded-lg border border-accent/20 text-sm" data-testid="alert-video-prefill">
          <Video className="w-4 h-4 text-accent shrink-0" />
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
      <motion.section 
        variants={sectionVariants}
        className="relative overflow-hidden rounded-2xl bg-card/80 border border-accent/20"
      >
        <div className="absolute top-0 left-0 right-0 h-px from-transparent via-accent/50 to-transparent" />
        <div className="p-6">
          <h3 className="text-lg font-bold font-display mb-6 uppercase tracking-wider flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
              <span className="text-sm text-accent font-bold">1</span>
            </div>
            <span className="from-white to-accent">Matchup Details</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Player</label>
              {isCoach ? (
                <Select 
                  onValueChange={(val) => form.setValue("playerId", Number(val))} 
                  defaultValue={preselectedPlayerId}
                >
                  <SelectTrigger className="bg-muted/50 border-border text-foreground h-11 focus:border-accent/50 transition-colors" data-testid="select-player">
                    <SelectValue placeholder="Select a player..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    {players
                      .filter((p: any) => p.sport === sport || String(p.id) === preselectedPlayerId)
                      .map((p: any) => (
                          <SelectItem key={p.id} value={String(p.id)}>{p.name} (#{p.jerseyNumber}) - {p.position}</SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center h-11 px-3 rounded-md bg-muted/50 border border-border text-foreground" data-testid="text-player-name">
                  {selectedPlayer ? (
                    <span>{selectedPlayer.name} (#{selectedPlayer.jerseyNumber}) - {selectedPlayer.position}</span>
                  ) : (
                    <span className="text-muted-foreground">Loading your profile...</span>
                  )}
                </div>
              )}
              {form.formState.errors.playerId && <p className="text-red-400 text-xs">Player is required</p>}
            </div>
            
            <div className="space-y-2">
              <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Opponent</label>
              <Input {...form.register("opponent")} placeholder="vs. Team Name" className="bg-muted/50 border-border text-foreground h-11 focus:border-accent/50 transition-colors" />
              {form.formState.errors.opponent && <p className="text-red-400 text-xs">Opponent required</p>}
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Date</label>
              <Input type="date" {...form.register("date")} className="bg-muted/50 border-border text-foreground h-11 focus:border-accent/50 transition-colors" />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Result</label>
              {/* Coach benefit: structured input prevents "win" / "105-98" typos that break display */}
              <div className="flex gap-2">
                <div className="flex rounded-md overflow-hidden border border-border">
                  {(['W', 'L', 'T'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setResultType(r)}
                      className={cn(
                        "px-4 h-11 text-sm font-bold transition-all",
                        resultType === r
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted/50 text-muted-foreground hover:text-foreground"
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
                  className="bg-muted/50 border-border text-foreground h-11 focus:border-accent/50 transition-colors flex-1"
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
            <motion.section variants={sectionVariants} className="relative overflow-hidden rounded-2xl bg-card/80 border border-accent/20">
              <div className="absolute top-0 left-0 right-0 h-px from-transparent via-accent/50 to-transparent" />
              <div className="p-6">
                <h3 className="text-lg font-bold font-display mb-6 uppercase tracking-wider flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
                    <span className="text-sm text-accent font-bold">2</span>
                  </div>
                  <span className="from-white to-accent">Quick Stats</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StepperInput label="Points" name="points" register={form.register} setValue={form.setValue} watch={form.watch} />
                  <StepperInput label="Rebounds" name="rebounds" register={form.register} setValue={form.setValue} watch={form.watch} />
                  <StepperInput label="Assists" name="assists" register={form.register} setValue={form.setValue} watch={form.watch} />
                  <StepperInput label="Steals" name="steals" register={form.register} setValue={form.setValue} watch={form.watch} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Field Goals</p>
                    <div className="grid grid-cols-2 gap-2">
                      <StepperInput label="Made" name="fgMade" register={form.register} setValue={form.setValue} watch={form.watch} />
                      <StepperInput label="Att" name="fgAttempted" register={form.register} setValue={form.setValue} watch={form.watch} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider">3-Pointers</p>
                    <div className="grid grid-cols-2 gap-2">
                      <StepperInput label="Made" name="threeMade" register={form.register} setValue={form.setValue} watch={form.watch} />
                      <StepperInput label="Att" name="threeAttempted" register={form.register} setValue={form.setValue} watch={form.watch} />
                    </div>
                  </div>
                </div>
                {/* Coach benefit: make it clear notes are available in Full Stats mode */}
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Switch to <span className="text-foreground font-medium">Full Stats</span> to add coach notes and shooting splits.
                </p>
              </div>
            </motion.section>
          ) : (
          <>
          <motion.section 
            variants={sectionVariants}
            className="relative overflow-hidden rounded-2xl bg-card/80 border border-accent/20"
          >
            <div className="absolute top-0 left-0 right-0 h-px from-transparent via-accent/50 to-transparent" />
            <div className="p-6">
              <h3 className="text-lg font-bold font-display mb-6 uppercase tracking-wider flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
                  <span className="text-sm text-accent font-bold">2</span>
                </div>
                <span className="from-white to-accent">Box Score</span>
              </h3>

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
                className="flex items-center gap-2 text-sm text-muted-foreground mt-4 w-full justify-center"
                data-testid="button-toggle-advanced"
              >
                <ChevronDown className={cn("w-4 h-4 transition-transform", showAdvanced && "rotate-180")} />
                Advanced Stats
              </button>
              {showAdvanced && (
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
                  <StepperInput label="Off. Rebounds" name="offensiveRebounds" register={form.register} setValue={form.setValue} watch={form.watch} />
                  <StepperInput label="Def. Rebounds" name="defensiveRebounds" register={form.register} setValue={form.setValue} watch={form.watch} />
                </div>
              )}
            </div>
          </motion.section>

          <motion.section 
            variants={sectionVariants}
            className="relative overflow-hidden rounded-2xl bg-card/80 border border-accent/20"
          >
            <div className="absolute top-0 left-0 right-0 h-px from-transparent via-accent/50 to-transparent" />
            <div className="p-6">
              <h3 className="text-lg font-bold font-display mb-6 uppercase tracking-wider flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
                  <span className="text-sm text-accent font-bold">3</span>
                </div>
                <span className="from-white to-accent">Shooting Splits</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-muted/80 p-4 rounded-xl border border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-foreground">Field Goals</h4>
                    <span className={cn(
                      "text-lg font-mono font-bold",
                      fgPercent !== '—' && parseFloat(fgPercent) >= 50 ? "text-green-400" : 
                      fgPercent !== '—' && parseFloat(fgPercent) < 40 ? "text-red-400" : "text-accent"
                    )}>
                      {fgPercent !== '—' ? `${fgPercent}%` : '—'}
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <NumberInput label="Made" name="fgMade" register={form.register} setValue={form.setValue} watch={form.watch} />
                    <NumberInput label="Attempted" name="fgAttempted" register={form.register} setValue={form.setValue} watch={form.watch} />
                  </div>
                </div>
                <div className="bg-muted/80 p-4 rounded-xl border border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-foreground">3-Pointers</h4>
                    <span className={cn(
                      "text-lg font-mono font-bold",
                      threePercent !== '—' && parseFloat(threePercent) >= 40 ? "text-green-400" : 
                      threePercent !== '—' && parseFloat(threePercent) < 30 ? "text-red-400" : "text-accent"
                    )}>
                      {threePercent !== '—' ? `${threePercent}%` : '—'}
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <NumberInput label="Made" name="threeMade" register={form.register} setValue={form.setValue} watch={form.watch} />
                    <NumberInput label="Attempted" name="threeAttempted" register={form.register} setValue={form.setValue} watch={form.watch} />
                  </div>
                </div>
                <div className="bg-muted/80 p-4 rounded-xl border border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-foreground">Free Throws</h4>
                    <span className={cn(
                      "text-lg font-mono font-bold",
                      ftPercent !== '—' && parseFloat(ftPercent) >= 80 ? "text-green-400" : 
                      ftPercent !== '—' && parseFloat(ftPercent) < 70 ? "text-red-400" : "text-accent"
                    )}>
                      {ftPercent !== '—' ? `${ftPercent}%` : '—'}
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <NumberInput label="Made" name="ftMade" register={form.register} setValue={form.setValue} watch={form.watch} />
                    <NumberInput label="Attempted" name="ftAttempted" register={form.register} setValue={form.setValue} watch={form.watch} />
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 from-accent/10 to-accent/5 rounded-xl border border-accent/20">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground uppercase font-bold">True Shooting</p>
                      <p className={cn(
                        "text-2xl font-mono font-bold",
                        tsPercent !== '—' && parseFloat(tsPercent) >= 60 ? "text-green-400" : 
                        tsPercent !== '—' && parseFloat(tsPercent) < 50 ? "text-red-400" : "text-accent"
                      )}>
                        {tsPercent !== '—' ? `${tsPercent}%` : '—'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground uppercase font-bold">Calc. Points</p>
                      <p className="text-2xl font-mono font-bold text-foreground">{calculatedPoints}</p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={autoCalcPoints}
                      onChange={(e) => setAutoCalcPoints(e.target.checked)}
                      className="w-4 h-4 rounded border-border bg-muted/80 text-accent focus:ring-accent"
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
      <motion.section 
        variants={sectionVariants}
        className="relative overflow-hidden rounded-2xl bg-card/80 border border-accent/20"
      >
        <div className="absolute top-0 left-0 right-0 h-px from-transparent via-accent/50 to-transparent" />
        <div className="p-6">
          <h3 className="text-lg font-bold font-display mb-6 uppercase tracking-wider flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
              <span className="text-sm text-accent font-bold">4</span>
            </div>
            <span className="from-white to-accent">Intangibles & Notes</span>
          </h3>

          {sport === 'basketball' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-muted/80 p-4 rounded-xl border border-border">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Defense Rating</label>
                  <span className={cn(
                    "text-2xl font-mono font-bold",
                    calculatedDefenseRating >= 75 ? "text-green-400" :
                    calculatedDefenseRating >= 60 ? "text-accent" :
                    calculatedDefenseRating < 40 ? "text-red-400" : "text-muted-foreground"
                  )} data-testid="text-defense-rating">
                    {calculatedDefenseRating}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      calculatedDefenseRating >= 75 ? "bg-green-500" :
                      calculatedDefenseRating >= 60 ? "bg-accent" :
                      calculatedDefenseRating < 40 ? "bg-red-500" : "bg-muted-foreground"
                    )}
                    style={{ width: `${calculatedDefenseRating}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Based on steals, blocks, def. rebounds & position
                </p>
              </div>
              
              <div className="bg-muted/80 p-4 rounded-xl border border-border">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Hustle Score</label>
                  <span className={cn(
                    "text-2xl font-mono font-bold",
                    calculatedHustleScore >= 75 ? "text-green-400" :
                    calculatedHustleScore >= 60 ? "text-accent" :
                    calculatedHustleScore < 40 ? "text-red-400" : "text-muted-foreground"
                  )} data-testid="text-hustle-score">
                    {calculatedHustleScore}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      calculatedHustleScore >= 75 ? "bg-green-500" :
                      calculatedHustleScore >= 60 ? "bg-accent" :
                      calculatedHustleScore < 40 ? "bg-red-500" : "bg-muted-foreground"
                    )}
                    style={{ width: `${calculatedHustleScore}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Based on steals, off. rebounds, assists & effort
                </p>
              </div>
            </div>
          )}

          {false && (
            <div className="mb-6">
              <div className="bg-muted/80 p-4 rounded-xl border border-border">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Hustle Score</label>
                  <span className={cn(
                    "text-2xl font-mono font-bold",
                    calculatedHustleScore >= 75 ? "text-green-400" :
                    calculatedHustleScore >= 60 ? "text-accent" :
                    calculatedHustleScore < 40 ? "text-red-400" : "text-muted-foreground"
                  )} data-testid="text-hustle-score">
                    {calculatedHustleScore}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      calculatedHustleScore >= 75 ? "bg-green-500" :
                      calculatedHustleScore >= 60 ? "bg-accent" :
                      calculatedHustleScore < 40 ? "bg-red-500" : "bg-muted-foreground"
                    )}
                    style={{ width: `${calculatedHustleScore}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Auto-calculated from tackles, sacks, forced fumbles, pancakes & effort plays
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Coach's Notes</label>
            <Textarea 
              {...form.register("notes")} 
              placeholder="Add specific observations, areas for improvement, or key moments..."
              className="bg-muted/50 border-border text-foreground min-h-[100px] focus:border-accent/50 transition-colors"
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
          className="w-full h-14 text-lg font-bold bg-accent  text-black transition-all"
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

function StepperInput({ label, name, register, setValue, watch }: { label: string; name: string; register: any; setValue?: any; watch?: any }) {
  const { onChange: _onChange, ...rest } = register(name, { valueAsNumber: true });
  const currentValue = watch ? (watch(name) ?? 0) : undefined;
  return (
    <div className="space-y-1 w-full" data-testid={`stepper-${name}`}>
      <label className="text-[10px] md:text-xs uppercase font-bold text-muted-foreground tracking-wider block text-center">{label}</label>
      <Input
        type="number"
        inputMode="numeric"
        min={0}
        {...rest}
        value={currentValue !== undefined ? currentValue : undefined}
        onChange={(e) => {
          const raw = e.target.value;
          const num = raw === '' ? 0 : parseInt(raw, 10);
          if (setValue) setValue(name, isNaN(num) || num < 0 ? 0 : num, { shouldValidate: false });
        }}
        className="bg-muted/50 border-border text-foreground text-center font-display font-bold focus:border-accent/50 h-12 md:h-10 text-xl transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        data-testid={`input-${name}`}
      />
    </div>
  );
}

function NumberInput({ label, name, register, setValue, watch }: any) {
  const { onChange: _onChange, ...rest } = register(name, { valueAsNumber: true });
  const currentValue = watch ? (watch(name) ?? 0) : undefined;
  return (
    <div className="space-y-1 w-full">
      <label className="text-[10px] md:text-xs uppercase font-bold text-muted-foreground tracking-wider block text-center">{label}</label>
      <Input
        type="number"
        inputMode="numeric"
        min={0}
        {...rest}
        value={currentValue !== undefined ? currentValue : undefined}
        onChange={(e) => {
          const raw = e.target.value;
          const num = raw === '' ? 0 : parseInt(raw, 10);
          if (setValue) setValue(name, isNaN(num) || num < 0 ? 0 : num, { shouldValidate: false });
        }}
        className="bg-muted/50 border-border text-foreground text-center font-mono focus:border-accent/50 h-12 md:h-10 text-base transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        data-testid={`input-${name}`}
      />
    </div>
  );
}

function ReportCardView({ game, onReset }: { game: any, onReset: () => void }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [badgeShareOpen, setBadgeShareOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const { data: player } = usePlayer(game.playerId);
  const { showXPGain } = useXPNotification();
  const { triggerCelebration } = useCelebrationContext();
  const playerName = player?.name || "Player";
  const playerPhoto = player?.photoUrl || undefined;
  // Show XP notification and celebration on mount (game successfully logged)
  useEffect(() => {
    // Base XP for logging a game
    showXPGain(XP_ACTIONS.GAME_LOGGED.amount, XP_ACTIONS.GAME_LOGGED.reason);
    
    // Check for grade-based bonuses
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
  }, [game.grade, showXPGain, triggerCelebration]);

  return (
    <motion.div 
      className="max-w-2xl mx-auto py-8"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative overflow-hidden rounded-3xl bg-card/80 border border-accent/20 shadow-2xl"
      >
        <div className="absolute top-0 left-0 right-0 h-px from-transparent via-accent/50 to-transparent" />
        <div className="from-accent/10 to-transparent p-8 text-center relative">
          <div className="absolute top-0 left-0 w-full h-1 from-transparent via-accent to-transparent opacity-50" />
          
          <p className="text-xs uppercase tracking-wider text-accent font-semibold mb-1">Game Report</p>
          <h2 className="text-2xl font-bold font-display mb-1 from-white to-accent">
            {playerName}
          </h2>
          <p className="text-muted-foreground text-sm mb-4">vs. {game.opponent} · {new Date(game.date).toLocaleDateString()}</p>
          
          <div className="flex justify-center mb-6">
            <GradeBadge grade={game.grade} size="xl" className="shadow-2xl scale-125" />
          </div>
          
          <div className="flex justify-center gap-8 mb-2">
            <>
              <div className="text-center">
                <p className="text-3xl font-display font-bold text-white">{game.points}</p>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Points</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-display font-bold text-white">{game.rebounds}</p>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Rebounds</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-display font-bold text-white">{game.assists}</p>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Assists</p>
              </div>
            </>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent" /> Scouting Report
            </h3>
            <div className="bg-muted/80 p-5 rounded-xl border border-border">
              <p className="text-muted-foreground leading-relaxed text-sm">
                {game.feedback}
              </p>
            </div>
          </div>

          {game.improvementTips && game.improvementTips.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-accent" /> What to Work On
              </h3>
              <div className="space-y-3">
                {game.improvementTips.map((tip: {area: string, stat: string, tip: string}, index: number) => (
                  <div key={index} className="flex gap-3 p-4 bg-muted/80 rounded-xl border border-border" data-testid={`improvement-tip-${index}`}>
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-bold text-foreground">{tip.area}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-semibold">{tip.stat}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{tip.tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/80 rounded-xl border border-border">
              <span className="text-xs text-muted-foreground uppercase font-bold">Shooting</span>
              <p className="text-xl font-display font-bold text-white mt-1">
                {game.fgMade}/{game.fgAttempted} <span className="text-sm text-muted-foreground">FG</span>
              </p>
            </div>
            <div className="p-4 bg-muted/80 rounded-xl border border-border">
              <span className="text-xs text-muted-foreground uppercase font-bold">Turnovers</span>
              <p className="text-xl font-display font-bold text-white mt-1">
                {game.turnovers} <span className="text-sm text-muted-foreground">TO</span>
              </p>
            </div>
          </div>

          {/* Badges earned this game */}
          {game.awardedBadges && game.awardedBadges.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-accent" /> Badges Earned
              </h3>
              <div className="space-y-2">
                {game.awardedBadges.map((badgeType: string) => {
                  const badgeDef = BADGE_DEFINITIONS[badgeType as keyof typeof BADGE_DEFINITIONS];
                  return (
                    <div key={badgeType} className="flex items-center justify-between gap-3 p-3 bg-accent/10 rounded-xl border border-accent/20">
                      <div>
                        <p className="text-sm font-bold text-accent">{badgeDef?.name || badgeType}</p>
                        <p className="text-xs text-muted-foreground">{badgeDef?.description}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5 text-xs text-accent hover:bg-accent/20 shrink-0"
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
              <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent" /> New Career Highs
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {game.newRecords.map((rec: { statName: string; value: number; previousValue?: number }) => (
                  <div key={rec.statName} className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                    <p className="text-xs text-muted-foreground capitalize">{rec.statName.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <p className="text-xl font-bold text-green-400">{rec.value}</p>
                    {rec.previousValue !== undefined && (
                      <p className="text-xs text-muted-foreground">prev: {rec.previousValue}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grade-based share nudge for A/A+ performances */}
          {game.grade && ['A+', 'A', 'A-'].includes(game.grade) && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-accent/20 to-accent/5 border border-accent/30 text-center space-y-2">
              <p className="text-sm font-bold text-accent">
                {game.grade === 'A+' ? '🔥 Elite performance!' : '⭐ Standout game!'} Share it with your teammates.
              </p>
              <p className="text-xs text-muted-foreground">
                Let your network see your {game.grade} grade vs {game.opponent}.
              </p>
            </div>
          )}

          <Button
            onClick={() => setShareOpen(true)}
            className="w-full gap-2 bg-accent  text-black font-bold"
            data-testid="button-share-achievement"
          >
            <Share2 className="w-4 h-4" />
            Share Your Achievement
          </Button>

          <HighlightUploader gameId={game.id} playerId={game.playerId} />

          <div className="flex gap-4 pt-2">
            <Button onClick={onReset} variant="outline" className="flex-1 border-border hover:bg-muted/50 text-foreground">
              Close Report
            </Button>
            <Link href={`/players/${game.playerId}`} className="flex-1">
              <Button className="w-full bg-accent  text-black font-bold">
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
          shareText={`I just earned the "${BADGE_DEFINITIONS[selectedBadge as keyof typeof BADGE_DEFINITIONS]?.name || selectedBadge}" badge on @CaliberApp! 🏆`}
        >
          <ShareableBadgeCard
            badgeType={selectedBadge}
            playerName={playerName}
            earnedDate={new Date()}
          />
        </ShareModal>
      )}
    </motion.div>
  );
}
