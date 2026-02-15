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
import { ArrowLeft, Save, Loader2, Trophy, Share2, Target, ClipboardList, TrendingUp, Zap, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { GradeBadge } from "@/components/GradeBadge";
import { Link } from "wouter";
import { ShareModal } from "@/components/ShareModal";
import { ShareableGameCard } from "@/components/ShareableCard";
import { HighlightUploader } from "@/components/HighlightUploader";
import { useSport } from "@/components/SportToggle";
import { FOOTBALL_POSITION_STATS, FOOTBALL_POSITIONS, FOOTBALL_POSITION_LABELS, FootballPosition, BASKETBALL_POSITIONS } from "@shared/sports-config";
import { motion } from "framer-motion";
import { useXPNotification, XP_ACTIONS } from "@/components/XPToast";
import { useCelebrationContext } from "@/components/CelebrationOverlay";
import { useToast } from "@/hooks/use-toast";

const FOOTBALL_STAT_LABELS: Record<string, string> = {
  completions: "Completions",
  passAttempts: "Pass Attempts",
  passingYards: "Pass Yards",
  passingTouchdowns: "Pass TDs",
  interceptions: "Interceptions",
  sacksTaken: "Sacks Taken",
  carries: "Carries",
  rushingYards: "Rush Yards",
  rushingTouchdowns: "Rush TDs",
  fumbles: "Fumbles",
  receptions: "Receptions",
  targets: "Targets",
  receivingYards: "Rec Yards",
  receivingTouchdowns: "Rec TDs",
  drops: "Drops",
  tackles: "Tackles",
  soloTackles: "Solo Tackles",
  sacks: "Sacks",
  defensiveInterceptions: "INTs",
  passDeflections: "Pass Deflections",
  forcedFumbles: "Forced Fumbles",
  fumbleRecoveries: "Fumble Rec",
  fieldGoalsMade: "FG Made",
  fieldGoalsAttempted: "FG Attempted",
  extraPointsMade: "XP Made",
  extraPointsAttempted: "XP Attempted",
  punts: "Punts",
  puntYards: "Punt Yards",
  hustleScore: "Hustle Score",
  pancakeBlocks: "Pancake Blocks",
  sacksAllowed: "Sacks Allowed",
  penalties: "Penalties",
};

const STEPS = [
  { id: 1, label: "Matchup", icon: Target },
  { id: 2, label: "Stats", icon: Activity },
  { id: 3, label: "Shooting", icon: TrendingUp },
  { id: 4, label: "Intangibles", icon: Zap },
];

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
  
  const { data: players } = usePlayers();
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
                <span className="bg-gradient-to-r from-white via-accent to-accent bg-clip-text text-transparent">
                  Game Analysis
                </span>
              </h1>
              <p className="text-muted-foreground max-w-md">
                Input your game stats to generate an AI-powered performance report card with personalized feedback.
              </p>
            </div>
            
            <div className="hidden md:flex items-center gap-2">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                    "bg-muted/80 border border-border"
                  )}>
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      "bg-accent/20 text-accent border border-accent/30"
                    )}>
                      {step.id}
                    </div>
                    <span className="text-xs text-muted-foreground hidden lg:inline">{step.label}</span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className="w-4 h-px bg-border mx-1" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <GameForm 
        players={players || []} 
        preselectedPlayerId={effectivePlayerId} 
        onSubmit={mutate} 
        isPending={isPending}
        isCoach={isCoach}
      />
    </div>
  );
}

function GameForm({ players, preselectedPlayerId, onSubmit, isPending, isCoach }: any) {
  const [autoCalcPoints, setAutoCalcPoints] = useState(true);
  const [selectedFootballPositions, setSelectedFootballPositions] = useState<FootballPosition[]>([]);
  const sport = useSport();
  
  const form = useForm<z.infer<typeof insertGameSchema>>({
    resolver: zodResolver(insertGameSchema),
    defaultValues: {
      playerId: preselectedPlayerId ? Number(preselectedPlayerId) : undefined,
      sport: sport,
      date: new Date().toISOString().split('T')[0],
      opponent: "",
      result: "W",
      minutes: 0,
      points: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      fouls: 0,
      fgMade: 0,
      fgAttempted: 0,
      threeMade: 0,
      threeAttempted: 0,
      ftMade: 0,
      ftAttempted: 0,
      offensiveRebounds: 0,
      defensiveRebounds: 0,
      hustleScore: 50,
      defenseRating: 50,
      notes: "",
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
  
  const tackles = form.watch('tackles') || 0;
  const soloTackles = form.watch('soloTackles') || 0;
  const sacks = form.watch('sacks') || 0;
  const forcedFumbles = form.watch('forcedFumbles') || 0;
  const fumbleRecoveries = form.watch('fumbleRecoveries') || 0;
  const passDeflections = form.watch('passDeflections') || 0;
  const pancakeBlocks = form.watch('pancakeBlocks') || 0;
  const rushingYards = form.watch('rushingYards') || 0;
  const carries = form.watch('carries') || 0;
  
  const selectedPlayer = players.find((p: any) => p.id === playerId);
  const storedPosition = selectedPlayer?.position || 'Wing';
  
  const storedPositions: string[] = storedPosition?.split(',').map((p: string) => p.trim()) || [];
  const hasValidFootballPosition = storedPositions.some((pos: string) => FOOTBALL_POSITIONS.includes(pos as FootballPosition));
  const isValidBasketballPosition = BASKETBALL_POSITIONS.includes(storedPosition as any);
  
  const effectiveFootballPositions: FootballPosition[] = sport === 'football' 
    ? (hasValidFootballPosition 
        ? storedPositions.filter((pos: string) => FOOTBALL_POSITIONS.includes(pos as FootballPosition)) as FootballPosition[]
        : selectedFootballPositions)
    : [];
  
  const effectiveFootballPosition = effectiveFootballPositions[0] || null;
  
  const position = sport === 'football' ? effectiveFootballPosition : storedPosition;
  
  const hasPosition = (positions: FootballPosition[]) => {
    return effectiveFootballPositions.some(pos => positions.includes(pos));
  };

  const fgPercent = fgAttempted > 0 ? ((fgMade / fgAttempted) * 100).toFixed(1) : '—';
  const threePercent = threeAttempted > 0 ? ((threeMade / threeAttempted) * 100).toFixed(1) : '—';
  const ftPercent = ftAttempted > 0 ? ((ftMade / ftAttempted) * 100).toFixed(1) : '—';
  
  const calculatedPoints = (fgMade * 2) + (threeMade * 3) + (ftMade * 1);
  const tsa = fgAttempted + (0.44 * ftAttempted);
  const tsPercent = tsa > 0 ? ((calculatedPoints / (2 * tsa)) * 100).toFixed(1) : '—';

  const calcDefenseRating = () => {
    let rating = 50;
    const mins = minutes || 1;
    
    const stealsPerMin = (steals / mins) * 36;
    rating += stealsPerMin * 8;
    
    const blocksPerMin = (blocks / mins) * 36;
    if (position === 'Big') {
      rating += blocksPerMin * 6;
    } else {
      rating += blocksPerMin * 4;
    }
    
    const drebPerMin = (defensiveRebounds / mins) * 36;
    rating += drebPerMin * 1.5;
    
    if (position === 'Guard') {
      rating += steals * 2;
    } else if (position === 'Big') {
      rating += blocks * 2;
    }
    
    return Math.max(0, Math.min(100, Math.round(rating)));
  };

  const calcHustleScore = () => {
    let score = 50;
    
    if (sport === 'football') {
      score += soloTackles * 3;
      score += (tackles - soloTackles) * 1.5;
      
      score += sacks * 5;
      score += forcedFumbles * 6;
      score += fumbleRecoveries * 4;
      score += passDeflections * 3;
      
      score += pancakeBlocks * 4;
      
      if (carries > 0) {
        const ypc = rushingYards / carries;
        if (ypc >= 5) score += 8;
        else if (ypc >= 4) score += 5;
        else if (ypc >= 3) score += 2;
      }
      
      if (effectiveFootballPositions.includes('LB') || effectiveFootballPositions.includes('DB')) {
        score += tackles * 1;
      }
      if (effectiveFootballPositions.includes('DL')) {
        score += sacks * 2;
      }
      if (effectiveFootballPositions.includes('OL')) {
        score += pancakeBlocks * 2;
      }
      if (effectiveFootballPositions.includes('RB')) {
        if (carries >= 15) score += 5;
      }
      
    } else {
      const mins = minutes || 1;
      
      const stealsPerMin = (steals / mins) * 36;
      score += stealsPerMin * 10;
      
      const orebPerMin = (offensiveRebounds / mins) * 36;
      score += orebPerMin * 6;
      
      const drebPerMin = (defensiveRebounds / mins) * 36;
      score += drebPerMin * 1.5;
      
      const astPerMin = (assists / mins) * 36;
      score += astPerMin * 2;
      
      const blkPerMin = (blocks / mins) * 36;
      score += blkPerMin * 3;
      
      if (minutes >= 30) score += 5;
      else if (minutes >= 20) score += 3;
      
      if (position === 'Guard') {
        score += steals * 3;
      } else if (position === 'Big') {
        score += offensiveRebounds * 4;
      } else if (position === 'Wing') {
        score += (steals + offensiveRebounds) * 2;
      }
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const calculatedDefenseRating = calcDefenseRating();
  const calculatedHustleScore = calcHustleScore();

  useEffect(() => {
    if (autoCalcPoints) {
      form.setValue('points', calculatedPoints);
    }
  }, [fgMade, threeMade, ftMade, autoCalcPoints]);

  useEffect(() => {
    form.setValue('defenseRating', calculatedDefenseRating);
    form.setValue('hustleScore', calculatedHustleScore);
  }, [steals, blocks, defensiveRebounds, offensiveRebounds, assists, minutes, position, 
      tackles, soloTackles, sacks, forcedFumbles, fumbleRecoveries, passDeflections, 
      pancakeBlocks, rushingYards, carries, effectiveFootballPosition, effectiveFootballPositions, sport]);

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
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
        <div className="p-6">
          <h3 className="text-lg font-bold font-display mb-6 uppercase tracking-wider flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
              <span className="text-sm text-accent font-bold">1</span>
            </div>
            <span className="bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">Matchup Details</span>
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
                      .map((p: any) => {
                        const positionLabel = p.sport === 'football' && FOOTBALL_POSITION_LABELS[p.position as FootballPosition]
                          ? FOOTBALL_POSITION_LABELS[p.position as FootballPosition]
                          : p.position;
                        return (
                          <SelectItem key={p.id} value={String(p.id)}>{p.name} (#{p.jerseyNumber}) - {positionLabel}</SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center h-11 px-3 rounded-md bg-muted/50 border border-border text-foreground" data-testid="text-player-name">
                  {selectedPlayer ? (
                    <span>{selectedPlayer.name} (#{selectedPlayer.jerseyNumber}) - {selectedPlayer.sport === 'football' && FOOTBALL_POSITION_LABELS[selectedPlayer.position as FootballPosition] ? FOOTBALL_POSITION_LABELS[selectedPlayer.position as FootballPosition] : selectedPlayer.position}</span>
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
              <Input {...form.register("result")} placeholder="W 105-98" className="bg-muted/50 border-border text-foreground h-11 focus:border-accent/50 transition-colors" />
            </div>
          </div>
        </div>
      </motion.section>

      {sport === 'basketball' ? (
        <>
          <motion.section 
            variants={sectionVariants}
            className="relative overflow-hidden rounded-2xl bg-card/80 border border-accent/20"
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
            <div className="p-6">
              <h3 className="text-lg font-bold font-display mb-6 uppercase tracking-wider flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
                  <span className="text-sm text-accent font-bold">2</span>
                </div>
                <span className="bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">Box Score</span>
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <NumberInput label="Minutes" name="minutes" register={form.register} />
                <NumberInput label="Points" name="points" register={form.register} />
                <NumberInput label="Rebounds" name="rebounds" register={form.register} />
                <NumberInput label="Assists" name="assists" register={form.register} />
                <NumberInput label="Steals" name="steals" register={form.register} />
                <NumberInput label="Blocks" name="blocks" register={form.register} />
                <NumberInput label="Turnovers" name="turnovers" register={form.register} />
                <NumberInput label="Fouls" name="fouls" register={form.register} />
              </div>
            </div>
          </motion.section>

          <motion.section 
            variants={sectionVariants}
            className="relative overflow-hidden rounded-2xl bg-card/80 border border-accent/20"
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
            <div className="p-6">
              <h3 className="text-lg font-bold font-display mb-6 uppercase tracking-wider flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
                  <span className="text-sm text-accent font-bold">3</span>
                </div>
                <span className="bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">Shooting Splits</span>
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
                    <NumberInput label="Made" name="fgMade" register={form.register} />
                    <NumberInput label="Attempted" name="fgAttempted" register={form.register} />
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
                    <NumberInput label="Made" name="threeMade" register={form.register} />
                    <NumberInput label="Attempted" name="threeAttempted" register={form.register} />
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
                    <NumberInput label="Made" name="ftMade" register={form.register} />
                    <NumberInput label="Attempted" name="ftAttempted" register={form.register} />
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-accent/10 to-accent/5 rounded-xl border border-accent/20">
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
      ) : (
        <>
          <motion.section 
            variants={sectionVariants}
            className="relative overflow-hidden rounded-2xl bg-card/80 border border-accent/20"
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
            <div className="p-6">
              <h3 className="text-lg font-bold font-display mb-6 uppercase tracking-wider flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
                  <span className="text-sm text-accent font-bold">2</span>
                </div>
                <span className="bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
                  {effectiveFootballPosition ? `${FOOTBALL_POSITION_LABELS[effectiveFootballPosition] || effectiveFootballPosition} Stats` : 'Position Stats'}
                </span>
              </h3>

              {!playerId && (
                <div className="text-center text-muted-foreground py-8 border border-dashed border-border rounded-xl bg-muted/50">
                  Select a player to see position-specific stat fields
                </div>
              )}

              {playerId && !hasValidFootballPosition && (
                <div className="mb-6">
                  <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider block mb-2">Football Position(s) for this game</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {FOOTBALL_POSITIONS.map((pos) => (
                      <label
                        key={pos}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all",
                          selectedFootballPositions.includes(pos)
                            ? "border-accent bg-accent/20 text-foreground"
                            : "border-border bg-muted/50 text-muted-foreground hover:border-accent/50"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selectedFootballPositions.includes(pos)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFootballPositions([...selectedFootballPositions, pos]);
                            } else {
                              setSelectedFootballPositions(selectedFootballPositions.filter(p => p !== pos));
                            }
                          }}
                          className="sr-only"
                          data-testid={`checkbox-position-${pos}`}
                        />
                        <span className="text-xs font-medium">{FOOTBALL_POSITION_LABELS[pos]}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Your profile uses a basketball position. Select one or more football positions for this game.
                  </p>
                </div>
              )}

              {playerId && effectiveFootballPosition && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(FOOTBALL_POSITION_STATS[effectiveFootballPosition] || []).map((stat: string) => (
                    <NumberInput 
                      key={stat}
                      label={FOOTBALL_STAT_LABELS[stat] || stat} 
                      name={stat} 
                      register={form.register} 
                    />
                  ))}
                </div>
              )}

              {playerId && !effectiveFootballPosition && !hasValidFootballPosition && selectedFootballPositions.length === 0 && (
                <div className="text-center text-muted-foreground py-4 border border-dashed border-border rounded-xl bg-muted/50">
                  Select a football position above to see relevant stat fields
                </div>
              )}
            </div>
          </motion.section>

          {playerId && effectiveFootballPosition && (
            <motion.section 
              variants={sectionVariants}
              className="relative overflow-hidden rounded-2xl bg-card/80 border border-accent/20"
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
              <div className="p-6">
                <h3 className="text-lg font-bold font-display mb-6 uppercase tracking-wider flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
                    <span className="text-sm text-accent font-bold">3</span>
                  </div>
                  <span className="bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">Efficiency Metrics</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hasPosition(['QB']) && (
                    <>
                      <div className="bg-muted/80 p-4 rounded-xl border border-border">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Completion %</p>
                        <p className="text-2xl font-mono font-bold text-accent">
                          {(form.watch('passAttempts') || 0) > 0 
                            ? ((((form.watch('completions') || 0) / (form.watch('passAttempts') || 1)) * 100).toFixed(1)) + '%'
                            : '—'}
                        </p>
                      </div>
                      <div className="bg-muted/80 p-4 rounded-xl border border-border">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Yards Per Attempt</p>
                        <p className="text-2xl font-mono font-bold text-accent">
                          {(form.watch('passAttempts') || 0) > 0 
                            ? (((form.watch('passingYards') || 0) / (form.watch('passAttempts') || 1)).toFixed(1))
                            : '—'}
                        </p>
                      </div>
                      <div className="bg-muted/80 p-4 rounded-xl border border-border">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-2">TD:INT Ratio</p>
                        <p className="text-2xl font-mono font-bold text-accent">
                          {form.watch('passingTouchdowns') || 0}:{form.watch('interceptions') || 0}
                        </p>
                      </div>
                    </>
                  )}

                  {hasPosition(['RB']) && (
                    <>
                      <div className="bg-muted/80 p-4 rounded-xl border border-border">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Yards Per Carry</p>
                        <p className="text-2xl font-mono font-bold text-accent">
                          {(form.watch('carries') || 0) > 0 
                            ? (((form.watch('rushingYards') || 0) / (form.watch('carries') || 1)).toFixed(1))
                            : '—'}
                        </p>
                      </div>
                      <div className="bg-muted/80 p-4 rounded-xl border border-border">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Total Yards</p>
                        <p className="text-2xl font-mono font-bold text-accent">
                          {(form.watch('rushingYards') || 0) + (form.watch('receivingYards') || 0)}
                        </p>
                      </div>
                      <div className="bg-muted/80 p-4 rounded-xl border border-border">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Total TDs</p>
                        <p className="text-2xl font-mono font-bold text-accent">
                          {(form.watch('rushingTouchdowns') || 0) + (form.watch('receivingTouchdowns') || 0)}
                        </p>
                      </div>
                    </>
                  )}

                  {hasPosition(['WR', 'TE']) && (
                    <>
                      <div className="bg-muted/80 p-4 rounded-xl border border-border">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Catch Rate</p>
                        <p className="text-2xl font-mono font-bold text-accent">
                          {(form.watch('targets') || 0) > 0 
                            ? ((((form.watch('receptions') || 0) / (form.watch('targets') || 1)) * 100).toFixed(1)) + '%'
                            : '—'}
                        </p>
                      </div>
                      <div className="bg-muted/80 p-4 rounded-xl border border-border">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Yards Per Catch</p>
                        <p className="text-2xl font-mono font-bold text-accent">
                          {(form.watch('receptions') || 0) > 0 
                            ? (((form.watch('receivingYards') || 0) / (form.watch('receptions') || 1)).toFixed(1))
                            : '—'}
                        </p>
                      </div>
                      <div className="bg-muted/80 p-4 rounded-xl border border-border">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-2">TDs</p>
                        <p className="text-2xl font-mono font-bold text-accent">
                          {form.watch('receivingTouchdowns') || 0}
                        </p>
                      </div>
                    </>
                  )}

                  {hasPosition(['DL', 'LB', 'DB']) && (
                    <>
                      <div className="bg-muted/80 p-4 rounded-xl border border-border">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Total Tackles</p>
                        <p className="text-2xl font-mono font-bold text-accent">
                          {form.watch('tackles') || 0}
                        </p>
                      </div>
                      <div className="bg-muted/80 p-4 rounded-xl border border-border">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Playmaker Stats</p>
                        <p className="text-2xl font-mono font-bold text-accent">
                          {(form.watch('sacks') || 0) + (form.watch('defensiveInterceptions') || 0) + (form.watch('forcedFumbles') || 0)}
                        </p>
                      </div>
                      <div className="bg-muted/80 p-4 rounded-xl border border-border">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Pass Deflections</p>
                        <p className="text-2xl font-mono font-bold text-accent">
                          {form.watch('passDeflections') || 0}
                        </p>
                      </div>
                    </>
                  )}

                  {position === 'K' && (
                    <>
                      <div className="bg-muted/80 p-4 rounded-xl border border-border">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-2">FG %</p>
                        <p className="text-2xl font-mono font-bold text-accent">
                          {(form.watch('fieldGoalsAttempted') || 0) > 0 
                            ? ((((form.watch('fieldGoalsMade') || 0) / (form.watch('fieldGoalsAttempted') || 1)) * 100).toFixed(1)) + '%'
                            : '—'}
                        </p>
                      </div>
                      <div className="bg-muted/80 p-4 rounded-xl border border-border">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-2">XP %</p>
                        <p className="text-2xl font-mono font-bold text-accent">
                          {(form.watch('extraPointsAttempted') || 0) > 0 
                            ? ((((form.watch('extraPointsMade') || 0) / (form.watch('extraPointsAttempted') || 1)) * 100).toFixed(1)) + '%'
                            : '—'}
                        </p>
                      </div>
                      <div className="bg-muted/80 p-4 rounded-xl border border-border">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Total Points</p>
                        <p className="text-2xl font-mono font-bold text-accent">
                          {((form.watch('fieldGoalsMade') || 0) * 3) + (form.watch('extraPointsMade') || 0)}
                        </p>
                      </div>
                    </>
                  )}

                  {position === 'P' && (
                    <>
                      <div className="bg-muted/80 p-4 rounded-xl border border-border">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Punt Average</p>
                        <p className="text-2xl font-mono font-bold text-accent">
                          {(form.watch('punts') || 0) > 0 
                            ? (((form.watch('puntYards') || 0) / (form.watch('punts') || 1)).toFixed(1))
                            : '—'}
                        </p>
                      </div>
                      <div className="bg-muted/80 p-4 rounded-xl border border-border">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Total Punts</p>
                        <p className="text-2xl font-mono font-bold text-accent">
                          {form.watch('punts') || 0}
                        </p>
                      </div>
                      <div className="bg-muted/80 p-4 rounded-xl border border-border">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Total Yards</p>
                        <p className="text-2xl font-mono font-bold text-accent">
                          {form.watch('puntYards') || 0}
                        </p>
                      </div>
                    </>
                  )}

                  {position === 'OL' && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Pancake Blocks</Label>
                        <Input
                          {...form.register('pancakeBlocks', { valueAsNumber: true })}
                          type="number"
                          min="0"
                          className="bg-muted/50 border-border focus:border-accent/50 transition-colors"
                          data-testid="input-pancake-blocks"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Sacks Allowed</Label>
                        <Input
                          {...form.register('sacksAllowed', { valueAsNumber: true })}
                          type="number"
                          min="0"
                          className="bg-muted/50 border-border focus:border-accent/50 transition-colors"
                          data-testid="input-sacks-allowed"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Penalties</Label>
                        <Input
                          {...form.register('penalties', { valueAsNumber: true })}
                          type="number"
                          min="0"
                          className="bg-muted/50 border-border focus:border-accent/50 transition-colors"
                          data-testid="input-penalties"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.section>
          )}
        </>
      )}

      <motion.section 
        variants={sectionVariants}
        className="relative overflow-hidden rounded-2xl bg-card/80 border border-accent/20"
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
        <div className="p-6">
          <h3 className="text-lg font-bold font-display mb-6 uppercase tracking-wider flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
              <span className="text-sm text-accent font-bold">{sport === 'basketball' ? '4' : playerId ? '4' : '3'}</span>
            </div>
            <span className="bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">Intangibles & Notes</span>
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

          {sport === 'football' && (
            <div className="mb-6">
              <div className="bg-muted/80 p-4 rounded-xl border border-border">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Hustle Score</label>
                  <span className={cn(
                    "text-2xl font-mono font-bold",
                    calculatedHustleScore >= 75 ? "text-green-400" :
                    calculatedHustleScore >= 60 ? "text-accent" :
                    calculatedHustleScore < 40 ? "text-red-400" : "text-muted-foreground"
                  )} data-testid="text-football-hustle-score">
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

function NumberInput({ label, name, register }: any) {
  return (
    <div className="space-y-1 w-full">
      <label className="text-[10px] md:text-xs uppercase font-bold text-muted-foreground tracking-wider block text-center">{label}</label>
      <Input 
        type="number" 
        inputMode="numeric"
        {...register(name, { valueAsNumber: true })} 
        className="bg-muted/50 border-border text-foreground text-center font-mono focus:border-accent/50 h-12 md:h-10 text-base transition-colors" 
        data-testid={`input-${name}`}
      />
    </div>
  );
}

function ReportCardView({ game, onReset }: { game: any, onReset: () => void }) {
  const [shareOpen, setShareOpen] = useState(false);
  const { data: player } = usePlayer(game.playerId);
  const { showXPGain } = useXPNotification();
  const { triggerCelebration } = useCelebrationContext();
  const playerName = player?.name || "Player";
  const playerPhoto = player?.photoUrl || undefined;
  const isFootball = game.sport === 'football';

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

  const footballStats = isFootball ? {
    passingYards: game.passingYards || 0,
    rushingYards: game.rushingYards || 0,
    receivingYards: game.receivingYards || 0,
    totalTDs: (game.passingTouchdowns || 0) + (game.rushingTouchdowns || 0) + (game.receivingTouchdowns || 0),
    tackles: game.tackles || 0,
    sacks: game.sacks || 0,
    interceptions: game.defensiveInterceptions || 0,
  } : null;

  const getFootballHeadlineStats = () => {
    if (!footballStats) return [];
    const stats = [
      { value: footballStats.passingYards, label: 'Pass Yds' },
      { value: footballStats.rushingYards, label: 'Rush Yds' },
      { value: footballStats.receivingYards, label: 'Rec Yds' },
      { value: footballStats.totalTDs, label: 'TDs' },
      { value: footballStats.tackles, label: 'Tackles' },
      { value: footballStats.sacks, label: 'Sacks' },
      { value: footballStats.interceptions, label: 'INTs' },
    ].filter(s => s.value > 0);
    return stats.slice(0, 3).length > 0 ? stats.slice(0, 3) : [
      { value: 0, label: 'TDs' },
      { value: 0, label: 'Yards' },
      { value: 0, label: 'Tackles' },
    ];
  };

  return (
    <motion.div 
      className="max-w-2xl mx-auto py-8"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative overflow-hidden rounded-3xl bg-card/80 border border-accent/20 shadow-2xl"
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
        <div className="bg-gradient-to-b from-accent/10 to-transparent p-8 text-center relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50" />
          
          <p className="text-xs uppercase tracking-wider text-accent font-semibold mb-1">Game Report</p>
          <h2 className="text-2xl font-bold font-display mb-1 bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
            {playerName}
          </h2>
          <p className="text-muted-foreground text-sm mb-4">vs. {game.opponent} · {new Date(game.date).toLocaleDateString()}</p>
          
          <div className="flex justify-center mb-6">
            <GradeBadge grade={game.grade} size="xl" className="shadow-2xl scale-125" />
          </div>
          
          <div className="flex justify-center gap-8 mb-2">
            {isFootball ? (
              getFootballHeadlineStats().map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-3xl font-display font-bold text-white">{stat.value}</p>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{stat.label}</p>
                </div>
              ))
            ) : (
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
            )}
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

          <div className="grid grid-cols-2 gap-4">
            {isFootball ? (
              <>
                <div className="p-4 bg-muted/80 rounded-xl border border-border">
                  <span className="text-xs text-muted-foreground uppercase font-bold">Total Yards</span>
                  <p className="text-xl font-display font-bold text-white mt-1">
                    {(game.passingYards || 0) + (game.rushingYards || 0) + (game.receivingYards || 0)} <span className="text-sm text-muted-foreground">YDS</span>
                  </p>
                </div>
                <div className="p-4 bg-muted/80 rounded-xl border border-border">
                  <span className="text-xs text-muted-foreground uppercase font-bold">Turnovers</span>
                  <p className="text-xl font-display font-bold text-white mt-1">
                    {(game.interceptions || 0) + (game.fumbles || 0)} <span className="text-sm text-muted-foreground">TO</span>
                  </p>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

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
        shareUrl={`${window.location.origin}/players/${game.playerId}/card?gameId=${game.id}`}
        shareText={isFootball 
          ? `Check out my ${(game.passingYards || 0) + (game.rushingYards || 0) + (game.receivingYards || 0)} total yards, ${footballStats?.totalTDs || 0} TD game vs ${game.opponent}! Grade: ${game.grade} on @CaliberApp`
          : `Check out my ${game.points} PTS, ${game.rebounds} REB, ${game.assists} AST game vs ${game.opponent}! Grade: ${game.grade} on @CaliberApp`}
      >
        <ShareableGameCard 
          game={game} 
          playerName={playerName} 
          playerPhoto={playerPhoto}
        />
      </ShareModal>
    </motion.div>
  );
}
