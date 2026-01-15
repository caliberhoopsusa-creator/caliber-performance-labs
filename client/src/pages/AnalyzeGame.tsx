import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateGame, usePlayers } from "@/hooks/use-basketball";
import { insertGameSchema } from "@shared/schema";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Save, Loader2, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { GradeBadge } from "@/components/GradeBadge";
import { Link } from "wouter";

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
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
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
  const form = useForm<z.infer<typeof insertGameSchema>>({
    resolver: zodResolver(insertGameSchema),
    defaultValues: {
      playerId: preselectedPlayerId ? Number(preselectedPlayerId) : undefined,
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
      notes: ""
    }
  });

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
                {players.map((p: any) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name} (#{p.jerseyNumber})</SelectItem>
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

      {/* 2. Core Stats */}
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
            <h4 className="text-sm font-bold text-white text-center">Field Goals</h4>
            <div className="flex gap-4">
              <NumberInput label="Made" name="fgMade" register={form.register} />
              <NumberInput label="Attempted" name="fgAttempted" register={form.register} />
            </div>
          </div>
          <div className="bg-secondary/10 p-4 rounded-xl space-y-4">
            <h4 className="text-sm font-bold text-white text-center">3-Pointers</h4>
            <div className="flex gap-4">
              <NumberInput label="Made" name="threeMade" register={form.register} />
              <NumberInput label="Attempted" name="threeAttempted" register={form.register} />
            </div>
          </div>
          <div className="bg-secondary/10 p-4 rounded-xl space-y-4">
            <h4 className="text-sm font-bold text-white text-center">Free Throws</h4>
            <div className="flex gap-4">
              <NumberInput label="Made" name="ftMade" register={form.register} />
              <NumberInput label="Attempted" name="ftAttempted" register={form.register} />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Intangibles */}
      <section className="bg-card border border-white/5 p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-bold font-display text-primary mb-6 uppercase tracking-wider flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">4</span>
          Intangibles & Notes
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          <div className="space-y-4">
            <div className="flex justify-between">
              <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Defensive Rating (0-100)</label>
              <span className="text-xs font-mono text-primary font-bold">{form.watch('defenseRating')}</span>
            </div>
            <Slider 
              defaultValue={[50]} 
              max={100} 
              step={1} 
              onValueChange={(vals) => form.setValue('defenseRating', vals[0])}
              className="py-2"
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between">
              <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Hustle Score (0-100)</label>
              <span className="text-xs font-mono text-primary font-bold">{form.watch('hustleScore')}</span>
            </div>
            <Slider 
              defaultValue={[50]} 
              max={100} 
              step={1} 
              onValueChange={(vals) => form.setValue('hustleScore', vals[0])}
              className="py-2"
            />
          </div>
        </div>

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
      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block text-center">{label}</label>
      <Input 
        type="number" 
        {...register(name, { valueAsNumber: true })} 
        className="bg-secondary/30 border-white/10 text-white text-center font-mono focus:border-primary/50" 
      />
    </div>
  );
}

function ReportCardView({ game, onReset }: { game: any, onReset: () => void }) {
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

          <div className="flex gap-4 pt-4">
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
    </div>
  );
}
