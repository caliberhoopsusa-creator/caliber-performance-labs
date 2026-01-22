import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateGame, usePlayers, usePlayer } from "@/hooks/use-basketball";
import { insertGameSchema } from "@shared/schema";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, Trophy, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { GradeBadge } from "@/components/GradeBadge";
import { Link } from "wouter";
import { ShareModal } from "@/components/ShareModal";
import { ShareableGameCard } from "@/components/ShareableCard";
import { HighlightUploader } from "@/components/HighlightUploader";
import { useSport } from "@/components/SportToggle";
import { FOOTBALL_POSITION_STATS, FOOTBALL_POSITIONS, FOOTBALL_POSITION_LABELS, FootballPosition, BASKETBALL_POSITIONS } from "@shared/sports-config";

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
};

export default function AnalyzeGame() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const preselectedPlayerId = searchParams.get('playerId');
  
  const { data: players } = usePlayers();
  const { mutate, isPending, data: resultGame } = useCreateGame();
  
  // If resultGame exists, show the "Report Card" view instead of the form
  if (resultGame) {
    return <ReportCardView game={resultGame} onReset={() => window.location.reload()} />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-24 md:pb-8">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/players" className="text-muted-foreground hover:text-white transition-colors p-2 -ml-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-display font-bold text-white uppercase tracking-tight">Caliber Analysis</h1>
          <p className="text-muted-foreground text-sm font-medium">Input stats to generate a performance report card.</p>
        </div>
      </div>

      <GameForm 
        players={players || []} 
        preselectedPlayerId={preselectedPlayerId} 
        onSubmit={mutate} 
        isPending={isPending} 
      />
    </div>
  );
}

function GameForm({ players, preselectedPlayerId, onSubmit, isPending }: any) {
  const [autoCalcPoints, setAutoCalcPoints] = useState(true);
  const [footballPosition, setFootballPosition] = useState<FootballPosition | ''>('');
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
    }
  });

  // Update sport field when sport context changes
  useEffect(() => {
    form.setValue('sport', sport);
  }, [sport, form]);

  // Watch shooting stats for live calculations
  const fgMade = form.watch('fgMade') || 0;
  const fgAttempted = form.watch('fgAttempted') || 0;
  const threeMade = form.watch('threeMade') || 0;
  const threeAttempted = form.watch('threeAttempted') || 0;
  const ftMade = form.watch('ftMade') || 0;
  const ftAttempted = form.watch('ftAttempted') || 0;

  // Watch defensive stats for auto-calculation
  const steals = form.watch('steals') || 0;
  const blocks = form.watch('blocks') || 0;
  const defensiveRebounds = form.watch('defensiveRebounds') || 0;
  const offensiveRebounds = form.watch('offensiveRebounds') || 0;
  const assists = form.watch('assists') || 0;
  const minutes = form.watch('minutes') || 1;
  const playerId = form.watch('playerId');
  
  // Get selected player's position for position-based calculations
  const selectedPlayer = players.find((p: any) => p.id === playerId);
  const storedPosition = selectedPlayer?.position || 'Wing';
  
  // Check if the stored position is a valid football position
  const isValidFootballPosition = FOOTBALL_POSITIONS.includes(storedPosition as FootballPosition);
  const isValidBasketballPosition = BASKETBALL_POSITIONS.includes(storedPosition as any);
  
  // For football mode, use the footballPosition state if the stored position is not a football position
  const effectiveFootballPosition = sport === 'football' 
    ? (isValidFootballPosition ? storedPosition as FootballPosition : footballPosition)
    : null;
  
  // Position used for calculations and display
  const position = sport === 'football' ? effectiveFootballPosition : storedPosition;

  // Calculate percentages
  const fgPercent = fgAttempted > 0 ? ((fgMade / fgAttempted) * 100).toFixed(1) : '—';
  const threePercent = threeAttempted > 0 ? ((threeMade / threeAttempted) * 100).toFixed(1) : '—';
  const ftPercent = ftAttempted > 0 ? ((ftMade / ftAttempted) * 100).toFixed(1) : '—';
  
  // Calculate True Shooting % = PTS / (2 * (FGA + 0.44 * FTA))
  const calculatedPoints = ((fgMade - threeMade) * 2) + (threeMade * 3) + ftMade;
  const tsa = fgAttempted + (0.44 * ftAttempted); // True Shooting Attempts
  const tsPercent = tsa > 0 ? ((calculatedPoints / (2 * tsa)) * 100).toFixed(1) : '—';

  // Calculate Defense Rating (same formula as backend)
  const calcDefenseRating = () => {
    let rating = 50;
    const mins = minutes || 1;
    
    // Steals per 36 minutes
    const stealsPerMin = (steals / mins) * 36;
    rating += stealsPerMin * 8;
    
    // Blocks per 36 minutes (position weighted)
    const blocksPerMin = (blocks / mins) * 36;
    if (position === 'Big') {
      rating += blocksPerMin * 6;
    } else {
      rating += blocksPerMin * 4;
    }
    
    // Defensive rebounds per 36 minutes
    const drebPerMin = (defensiveRebounds / mins) * 36;
    rating += drebPerMin * 1.5;
    
    // Position-based bonuses
    if (position === 'Guard') {
      rating += steals * 2;
    } else if (position === 'Big') {
      rating += blocks * 2;
    }
    
    return Math.max(0, Math.min(100, Math.round(rating)));
  };

  // Calculate Hustle Score (same formula as backend)
  const calcHustleScore = () => {
    let score = 50;
    const mins = minutes || 1;
    
    // Steals per 36 minutes
    const stealsPerMin = (steals / mins) * 36;
    score += stealsPerMin * 10;
    
    // Offensive rebounds per 36 minutes
    const orebPerMin = (offensiveRebounds / mins) * 36;
    score += orebPerMin * 6;
    
    // Defensive rebounds per 36 minutes
    const drebPerMin = (defensiveRebounds / mins) * 36;
    score += drebPerMin * 1.5;
    
    // Assists per 36 minutes
    const astPerMin = (assists / mins) * 36;
    score += astPerMin * 2;
    
    // Blocks per 36 minutes
    const blkPerMin = (blocks / mins) * 36;
    score += blkPerMin * 3;
    
    // Minutes bonus
    if (minutes >= 30) score += 5;
    else if (minutes >= 20) score += 3;
    
    // Position bonuses
    if (position === 'Guard') {
      score += steals * 3;
    } else if (position === 'Big') {
      score += offensiveRebounds * 4;
    } else if (position === 'Wing') {
      score += (steals + offensiveRebounds) * 2;
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const calculatedDefenseRating = calcDefenseRating();
  const calculatedHustleScore = calcHustleScore();

  // Auto-update points when shooting stats change (if enabled)
  useEffect(() => {
    if (autoCalcPoints) {
      form.setValue('points', calculatedPoints);
    }
  }, [fgMade, threeMade, ftMade, autoCalcPoints]);

  // Auto-update defense rating and hustle score
  useEffect(() => {
    form.setValue('defenseRating', calculatedDefenseRating);
    form.setValue('hustleScore', calculatedHustleScore);
  }, [steals, blocks, defensiveRebounds, offensiveRebounds, assists, minutes, position]);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {/* 1. Game Info Section */}
      <section className="bg-card border border-white/5 p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-bold font-display text-primary mb-6 uppercase tracking-wider flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">1</span>
          Matchup Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Player</label>
            <Select 
              onValueChange={(val) => form.setValue("playerId", Number(val))} 
              defaultValue={preselectedPlayerId}
            >
              <SelectTrigger className="bg-secondary/30 border-white/10 text-white h-11">
                <SelectValue placeholder="Select a player..." />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/10 text-white">
                {players.filter((p: any) => p.sport === sport || String(p.id) === preselectedPlayerId).map((p: any) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name} (#{p.jerseyNumber}) - {p.position}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.playerId && <p className="text-red-400 text-xs">Player is required</p>}
          </div>
          
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Opponent</label>
            <Input {...form.register("opponent")} placeholder="vs. Team Name" className="bg-secondary/30 border-white/10 text-white h-11" />
            {form.formState.errors.opponent && <p className="text-red-400 text-xs">Opponent required</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Date</label>
            <Input type="date" {...form.register("date")} className="bg-secondary/30 border-white/10 text-white h-11" />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Result</label>
            <Input {...form.register("result")} placeholder="W 105-98" className="bg-secondary/30 border-white/10 text-white h-11" />
          </div>
        </div>
      </section>

      {/* 2. Core Stats - Sport Specific */}
      {sport === 'basketball' ? (
        <>
          <section className="bg-card border border-white/5 p-6 rounded-2xl shadow-lg">
            <h3 className="text-lg font-bold font-display text-primary mb-6 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">2</span>
              Box Score
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <NumberInput label="Minutes" name="minutes" register={form.register} />
              <NumberInput label="Points" name="points" register={form.register} />
              <NumberInput label="Rebounds" name="rebounds" register={form.register} />
              <NumberInput label="Assists" name="assists" register={form.register} />
              <NumberInput label="Steals" name="steals" register={form.register} />
              <NumberInput label="Blocks" name="blocks" register={form.register} />
              <NumberInput label="Turnovers" name="turnovers" register={form.register} />
              <NumberInput label="Fouls" name="fouls" register={form.register} />
            </div>
          </section>

          {/* 3. Shooting Efficiency */}
          <section className="bg-card border border-white/5 p-6 rounded-2xl shadow-lg">
            <h3 className="text-lg font-bold font-display text-primary mb-6 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">3</span>
              Shooting Splits
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-secondary/10 p-4 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">Field Goals</h4>
                  <span className={cn(
                    "text-lg font-mono font-bold",
                    fgPercent !== '—' && parseFloat(fgPercent) >= 50 ? "text-green-400" : 
                    fgPercent !== '—' && parseFloat(fgPercent) < 40 ? "text-red-400" : "text-primary"
                  )}>
                    {fgPercent !== '—' ? `${fgPercent}%` : '—'}
                  </span>
                </div>
                <div className="flex gap-4">
                  <NumberInput label="Made" name="fgMade" register={form.register} />
                  <NumberInput label="Attempted" name="fgAttempted" register={form.register} />
                </div>
              </div>
              <div className="bg-secondary/10 p-4 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">3-Pointers</h4>
                  <span className={cn(
                    "text-lg font-mono font-bold",
                    threePercent !== '—' && parseFloat(threePercent) >= 40 ? "text-green-400" : 
                    threePercent !== '—' && parseFloat(threePercent) < 30 ? "text-red-400" : "text-primary"
                  )}>
                    {threePercent !== '—' ? `${threePercent}%` : '—'}
                  </span>
                </div>
                <div className="flex gap-4">
                  <NumberInput label="Made" name="threeMade" register={form.register} />
                  <NumberInput label="Attempted" name="threeAttempted" register={form.register} />
                </div>
              </div>
              <div className="bg-secondary/10 p-4 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">Free Throws</h4>
                  <span className={cn(
                    "text-lg font-mono font-bold",
                    ftPercent !== '—' && parseFloat(ftPercent) >= 80 ? "text-green-400" : 
                    ftPercent !== '—' && parseFloat(ftPercent) < 70 ? "text-red-400" : "text-primary"
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

            {/* Auto-calculated metrics */}
            <div className="mt-6 p-4 bg-primary/10 rounded-xl border border-primary/20">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase font-bold">True Shooting</p>
                    <p className={cn(
                      "text-2xl font-mono font-bold",
                      tsPercent !== '—' && parseFloat(tsPercent) >= 60 ? "text-green-400" : 
                      tsPercent !== '—' && parseFloat(tsPercent) < 50 ? "text-red-400" : "text-primary"
                    )}>
                      {tsPercent !== '—' ? `${tsPercent}%` : '—'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Calc. Points</p>
                    <p className="text-2xl font-mono font-bold text-white">{calculatedPoints}</p>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={autoCalcPoints}
                    onChange={(e) => setAutoCalcPoints(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-secondary/30 text-primary focus:ring-primary"
                    data-testid="checkbox-auto-calc-points"
                  />
                  <span className="text-sm text-muted-foreground">Auto-fill points from shooting</span>
                </label>
              </div>
            </div>
          </section>
        </>
      ) : (
        <>
          {/* Football Position-Based Stats */}
          <section className="bg-card border border-white/5 p-6 rounded-2xl shadow-lg">
            <h3 className="text-lg font-bold font-display text-primary mb-6 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">2</span>
              {effectiveFootballPosition ? `${FOOTBALL_POSITION_LABELS[effectiveFootballPosition] || effectiveFootballPosition} Stats` : 'Position Stats'}
            </h3>

            {!playerId && (
              <div className="text-center text-muted-foreground py-8 border border-dashed border-white/10 rounded-xl">
                Select a player to see position-specific stat fields
              </div>
            )}

            {playerId && !isValidFootballPosition && (
              <div className="mb-6">
                <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider block mb-2">Football Position (for this game)</label>
                <Select 
                  onValueChange={(val) => setFootballPosition(val as FootballPosition)} 
                  value={footballPosition}
                >
                  <SelectTrigger className="bg-secondary/30 border-white/10 text-white h-11 max-w-xs">
                    <SelectValue placeholder="Select football position..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10 text-white">
                    {FOOTBALL_POSITIONS.map((pos) => (
                      <SelectItem key={pos} value={pos}>
                        {FOOTBALL_POSITION_LABELS[pos]} ({pos})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Your profile uses a basketball position. Select a football position for this game.
                </p>
              </div>
            )}

            {playerId && effectiveFootballPosition && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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

            {playerId && !effectiveFootballPosition && !isValidFootballPosition && (
              <div className="text-center text-muted-foreground py-4 border border-dashed border-white/10 rounded-xl">
                Select a football position above to see relevant stat fields
              </div>
            )}
          </section>

          {/* Football Efficiency Metrics */}
          {playerId && effectiveFootballPosition && (
            <section className="bg-card border border-white/5 p-6 rounded-2xl shadow-lg">
              <h3 className="text-lg font-bold font-display text-primary mb-6 uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">3</span>
                Efficiency Metrics
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Passing Efficiency for QB */}
                {effectiveFootballPosition === 'QB' && (
                  <>
                    <div className="bg-secondary/10 p-4 rounded-xl border border-white/5">
                      <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Completion %</p>
                      <p className="text-2xl font-mono font-bold text-primary">
                        {(form.watch('passAttempts') || 0) > 0 
                          ? ((((form.watch('completions') || 0) / (form.watch('passAttempts') || 1)) * 100).toFixed(1)) + '%'
                          : '—'}
                      </p>
                    </div>
                    <div className="bg-secondary/10 p-4 rounded-xl border border-white/5">
                      <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Yards Per Attempt</p>
                      <p className="text-2xl font-mono font-bold text-primary">
                        {(form.watch('passAttempts') || 0) > 0 
                          ? (((form.watch('passingYards') || 0) / (form.watch('passAttempts') || 1)).toFixed(1))
                          : '—'}
                      </p>
                    </div>
                    <div className="bg-secondary/10 p-4 rounded-xl border border-white/5">
                      <p className="text-xs text-muted-foreground uppercase font-bold mb-2">TD:INT Ratio</p>
                      <p className="text-2xl font-mono font-bold text-primary">
                        {form.watch('passingTouchdowns') || 0}:{form.watch('interceptions') || 0}
                      </p>
                    </div>
                  </>
                )}

                {/* Rushing Efficiency for RB */}
                {effectiveFootballPosition === 'RB' && (
                  <>
                    <div className="bg-secondary/10 p-4 rounded-xl border border-white/5">
                      <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Yards Per Carry</p>
                      <p className="text-2xl font-mono font-bold text-primary">
                        {(form.watch('carries') || 0) > 0 
                          ? (((form.watch('rushingYards') || 0) / (form.watch('carries') || 1)).toFixed(1))
                          : '—'}
                      </p>
                    </div>
                    <div className="bg-secondary/10 p-4 rounded-xl border border-white/5">
                      <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Total Yards</p>
                      <p className="text-2xl font-mono font-bold text-primary">
                        {(form.watch('rushingYards') || 0) + (form.watch('receivingYards') || 0)}
                      </p>
                    </div>
                    <div className="bg-secondary/10 p-4 rounded-xl border border-white/5">
                      <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Total TDs</p>
                      <p className="text-2xl font-mono font-bold text-primary">
                        {(form.watch('rushingTouchdowns') || 0) + (form.watch('receivingTouchdowns') || 0)}
                      </p>
                    </div>
                  </>
                )}

                {/* Receiving Efficiency for WR/TE */}
                {(effectiveFootballPosition === 'WR' || effectiveFootballPosition === 'TE') && (
                  <>
                    <div className="bg-secondary/10 p-4 rounded-xl border border-white/5">
                      <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Catch Rate</p>
                      <p className="text-2xl font-mono font-bold text-primary">
                        {(form.watch('targets') || 0) > 0 
                          ? ((((form.watch('receptions') || 0) / (form.watch('targets') || 1)) * 100).toFixed(1)) + '%'
                          : '—'}
                      </p>
                    </div>
                    <div className="bg-secondary/10 p-4 rounded-xl border border-white/5">
                      <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Yards Per Catch</p>
                      <p className="text-2xl font-mono font-bold text-primary">
                        {(form.watch('receptions') || 0) > 0 
                          ? (((form.watch('receivingYards') || 0) / (form.watch('receptions') || 1)).toFixed(1))
                          : '—'}
                      </p>
                    </div>
                    <div className="bg-secondary/10 p-4 rounded-xl border border-white/5">
                      <p className="text-xs text-muted-foreground uppercase font-bold mb-2">TDs</p>
                      <p className="text-2xl font-mono font-bold text-primary">
                        {form.watch('receivingTouchdowns') || 0}
                      </p>
                    </div>
                  </>
                )}

                {/* Defensive Stats for DL/LB/DB */}
                {(effectiveFootballPosition === 'DL' || effectiveFootballPosition === 'LB' || effectiveFootballPosition === 'DB') && (
                  <>
                    <div className="bg-secondary/10 p-4 rounded-xl border border-white/5">
                      <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Total Tackles</p>
                      <p className="text-2xl font-mono font-bold text-primary">
                        {form.watch('tackles') || 0}
                      </p>
                    </div>
                    <div className="bg-secondary/10 p-4 rounded-xl border border-white/5">
                      <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Playmaker Stats</p>
                      <p className="text-2xl font-mono font-bold text-primary">
                        {(form.watch('sacks') || 0) + (form.watch('defensiveInterceptions') || 0) + (form.watch('forcedFumbles') || 0)}
                      </p>
                    </div>
                    <div className="bg-secondary/10 p-4 rounded-xl border border-white/5">
                      <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Pass Deflections</p>
                      <p className="text-2xl font-mono font-bold text-primary">
                        {form.watch('passDeflections') || 0}
                      </p>
                    </div>
                  </>
                )}

                {/* Kicker Stats */}
                {position === 'K' && (
                  <>
                    <div className="bg-secondary/10 p-4 rounded-xl border border-white/5">
                      <p className="text-xs text-muted-foreground uppercase font-bold mb-2">FG %</p>
                      <p className="text-2xl font-mono font-bold text-primary">
                        {(form.watch('fieldGoalsAttempted') || 0) > 0 
                          ? ((((form.watch('fieldGoalsMade') || 0) / (form.watch('fieldGoalsAttempted') || 1)) * 100).toFixed(1)) + '%'
                          : '—'}
                      </p>
                    </div>
                    <div className="bg-secondary/10 p-4 rounded-xl border border-white/5">
                      <p className="text-xs text-muted-foreground uppercase font-bold mb-2">XP %</p>
                      <p className="text-2xl font-mono font-bold text-primary">
                        {(form.watch('extraPointsAttempted') || 0) > 0 
                          ? ((((form.watch('extraPointsMade') || 0) / (form.watch('extraPointsAttempted') || 1)) * 100).toFixed(1)) + '%'
                          : '—'}
                      </p>
                    </div>
                    <div className="bg-secondary/10 p-4 rounded-xl border border-white/5">
                      <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Total Points</p>
                      <p className="text-2xl font-mono font-bold text-primary">
                        {((form.watch('fieldGoalsMade') || 0) * 3) + (form.watch('extraPointsMade') || 0)}
                      </p>
                    </div>
                  </>
                )}

                {/* Punter Stats */}
                {position === 'P' && (
                  <>
                    <div className="bg-secondary/10 p-4 rounded-xl border border-white/5">
                      <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Punt Average</p>
                      <p className="text-2xl font-mono font-bold text-primary">
                        {(form.watch('punts') || 0) > 0 
                          ? (((form.watch('puntYards') || 0) / (form.watch('punts') || 1)).toFixed(1))
                          : '—'}
                      </p>
                    </div>
                    <div className="bg-secondary/10 p-4 rounded-xl border border-white/5">
                      <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Total Punts</p>
                      <p className="text-2xl font-mono font-bold text-primary">
                        {form.watch('punts') || 0}
                      </p>
                    </div>
                    <div className="bg-secondary/10 p-4 rounded-xl border border-white/5">
                      <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Total Yards</p>
                      <p className="text-2xl font-mono font-bold text-primary">
                        {form.watch('puntYards') || 0}
                      </p>
                    </div>
                  </>
                )}

                {/* OL - minimal stats */}
                {position === 'OL' && (
                  <div className="bg-secondary/10 p-4 rounded-xl border border-white/5 col-span-full">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Offensive Line Rating</p>
                    <p className="text-sm text-muted-foreground">Graded primarily on team performance and hustle.</p>
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      )}

      {/* 4. Intangibles */}
      <section className="bg-card border border-white/5 p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-bold font-display text-primary mb-6 uppercase tracking-wider flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">{sport === 'basketball' ? '4' : playerId ? '4' : '3'}</span>
          Intangibles & Notes
        </h3>

        {/* Auto-calculated Defense & Hustle - Basketball Only */}
        {sport === 'basketball' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-secondary/10 p-4 rounded-xl border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Defense Rating</label>
                <span className={cn(
                  "text-2xl font-mono font-bold",
                  calculatedDefenseRating >= 75 ? "text-green-400" :
                  calculatedDefenseRating >= 60 ? "text-primary" :
                  calculatedDefenseRating < 40 ? "text-red-400" : "text-muted-foreground"
                )} data-testid="text-defense-rating">
                  {calculatedDefenseRating}
                </span>
              </div>
              <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    calculatedDefenseRating >= 75 ? "bg-green-500" :
                    calculatedDefenseRating >= 60 ? "bg-primary" :
                    calculatedDefenseRating < 40 ? "bg-red-500" : "bg-muted-foreground"
                  )}
                  style={{ width: `${calculatedDefenseRating}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                Based on steals, blocks, def. rebounds & position
              </p>
            </div>
            
            <div className="bg-secondary/10 p-4 rounded-xl border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Hustle Score</label>
                <span className={cn(
                  "text-2xl font-mono font-bold",
                  calculatedHustleScore >= 75 ? "text-green-400" :
                  calculatedHustleScore >= 60 ? "text-primary" :
                  calculatedHustleScore < 40 ? "text-red-400" : "text-muted-foreground"
                )} data-testid="text-hustle-score">
                  {calculatedHustleScore}
                </span>
              </div>
              <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    calculatedHustleScore >= 75 ? "bg-green-500" :
                    calculatedHustleScore >= 60 ? "bg-primary" :
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

        {/* Football Hustle Score - Manual input */}
        {sport === 'football' && (
          <div className="mb-6">
            <div className="bg-secondary/10 p-4 rounded-xl border border-white/5">
              <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider block mb-3">Hustle Score (0-100)</label>
              <Input 
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                {...form.register("hustleScore", { valueAsNumber: true })}
                className="bg-secondary/30 border-white/10 text-white text-center font-mono h-11"
                data-testid="input-hustleScore"
              />
              <p className="text-[10px] text-muted-foreground mt-2">
                Rate effort, motor, and intangibles (0 = Poor, 100 = Elite)
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Coach's Notes</label>
          <Textarea 
            {...form.register("notes")} 
            placeholder="Add specific observations, areas for improvement, or key moments..."
            className="bg-secondary/30 border-white/10 text-white min-h-[100px]"
          />
        </div>
      </section>

      <Button 
        type="submit" 
        disabled={isPending} 
        size="lg" 
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-14 text-lg shadow-xl shadow-primary/20"
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
    </form>
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
        className="bg-secondary/30 border-white/10 text-white text-center font-mono focus:border-primary/50 h-12 md:h-10 text-base" 
        data-testid={`input-${name}`}
      />
    </div>
  );
}

function ReportCardView({ game, onReset }: { game: any, onReset: () => void }) {
  const [shareOpen, setShareOpen] = useState(false);
  const { data: player } = usePlayer(game.playerId);
  const playerName = player?.name || "Player";
  const playerPhoto = player?.photoUrl || undefined;

  return (
    <div className="max-w-2xl mx-auto py-8 animate-in zoom-in-95 duration-500">
      <div className="bg-card border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-b from-primary/20 to-card p-8 text-center relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
          
          <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Performance Report</h2>
          
          <div className="flex justify-center mb-6">
            <GradeBadge grade={game.grade} size="xl" className="shadow-2xl scale-125" />
          </div>
          
          <div className="flex justify-center gap-8 mb-2">
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
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" /> Scouting Report
            </h3>
            <div className="bg-secondary/20 p-5 rounded-xl border border-white/5">
              <p className="text-muted-foreground leading-relaxed text-sm">
                {game.feedback}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-secondary/10 rounded-xl border border-white/5">
              <span className="text-xs text-muted-foreground uppercase font-bold">Shooting</span>
              <p className="text-xl font-display font-bold text-white mt-1">
                {game.fgMade}/{game.fgAttempted} <span className="text-sm text-muted-foreground">FG</span>
              </p>
            </div>
            <div className="p-4 bg-secondary/10 rounded-xl border border-white/5">
              <span className="text-xs text-muted-foreground uppercase font-bold">Turnovers</span>
              <p className="text-xl font-display font-bold text-white mt-1">
                {game.turnovers} <span className="text-sm text-muted-foreground">TO</span>
              </p>
            </div>
          </div>

          <Button 
            onClick={() => setShareOpen(true)} 
            className="w-full gap-2 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90"
            data-testid="button-share-achievement"
          >
            <Share2 className="w-4 h-4" />
            Share Your Achievement
          </Button>

          <HighlightUploader gameId={game.id} playerId={game.playerId} />

          <div className="flex gap-4 pt-2">
            <Button onClick={onReset} variant="outline" className="flex-1 border-white/10 hover:bg-white/5 text-white">
              Close Report
            </Button>
            <Link href={`/players/${game.playerId}`} className="flex-1">
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
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
        shareText={`Check out my ${game.points} PTS, ${game.rebounds} REB, ${game.assists} AST game vs ${game.opponent}! Grade: ${game.grade} on @CaliberApp`}
      >
        <ShareableGameCard 
          game={game} 
          playerName={playerName} 
          playerPhoto={playerPhoto}
        />
      </ShareModal>
    </div>
  );
}
