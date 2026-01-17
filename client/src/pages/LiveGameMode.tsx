import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { LiveGameStats } from "@/components/LiveGameStats";
import { LiveGameEventLog } from "@/components/LiveGameEventLog";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  Play, 
  Square, 
  Circle, 
  Target,
  CircleDot,
  Grab,
  HandHelping,
  Zap,
  Shield,
  RotateCcw,
  AlertTriangle,
  Timer,
  Minus,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

type StatEventType = 
  | "made_2pt" | "missed_2pt" 
  | "made_3pt" | "missed_3pt"
  | "made_ft" | "missed_ft"
  | "rebound" | "assist" | "steal" | "block" | "turnover" | "foul";

interface StatButton {
  eventType: StatEventType;
  label: string;
  icon: React.ReactNode;
  variant: "made" | "missed" | "neutral" | "negative";
  statKey?: string;
}

const STAT_BUTTONS: StatButton[] = [
  { eventType: "made_2pt", label: "Made 2PT", icon: <Circle className="w-5 h-5 fill-current" />, variant: "made", statKey: "points" },
  { eventType: "missed_2pt", label: "Missed 2PT", icon: <Circle className="w-5 h-5" />, variant: "missed" },
  { eventType: "made_3pt", label: "Made 3PT", icon: <Target className="w-5 h-5" />, variant: "made", statKey: "points" },
  { eventType: "missed_3pt", label: "Missed 3PT", icon: <CircleDot className="w-5 h-5" />, variant: "missed" },
  { eventType: "made_ft", label: "Made FT", icon: <Plus className="w-5 h-5" />, variant: "made", statKey: "points" },
  { eventType: "missed_ft", label: "Missed FT", icon: <Minus className="w-5 h-5" />, variant: "missed" },
  { eventType: "rebound", label: "Rebound", icon: <Grab className="w-5 h-5" />, variant: "neutral", statKey: "rebounds" },
  { eventType: "assist", label: "Assist", icon: <HandHelping className="w-5 h-5" />, variant: "neutral", statKey: "assists" },
  { eventType: "steal", label: "Steal", icon: <Zap className="w-5 h-5" />, variant: "neutral", statKey: "steals" },
  { eventType: "block", label: "Block", icon: <Shield className="w-5 h-5" />, variant: "neutral", statKey: "blocks" },
  { eventType: "turnover", label: "Turnover", icon: <RotateCcw className="w-5 h-5" />, variant: "negative", statKey: "turnovers" },
  { eventType: "foul", label: "Foul", icon: <AlertTriangle className="w-5 h-5" />, variant: "negative", statKey: "fouls" },
];

export default function LiveGameMode() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [currentQuarter, setCurrentQuarter] = useState(1);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [opponent, setOpponent] = useState("");
  const [result, setResult] = useState("");
  const [minutes, setMinutes] = useState("");
  const [animatingStats, setAnimatingStats] = useState<Set<string>>(new Set());

  const { data: activeSession, isLoading: sessionLoading } = useQuery<{
    id: number;
    playerId: number;
    status: string;
    startedAt: string;
  } | null>({
    queryKey: ["/api/live-game/active"],
  });

  const sessionId = activeSession?.id;

  const { data: events = [], refetch: refetchEvents } = useQuery<{
    id: number;
    eventType: string;
    quarter: number;
    gameTime: string | null;
    createdAt: string | null;
  }[]>({
    queryKey: ["/api/live-game", sessionId, "events"],
    enabled: !!sessionId,
  });

  const stats = useCallback(() => {
    const result = {
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
    };

    for (const event of events) {
      switch (event.eventType) {
        case "made_2pt": result.points += 2; result.fgMade++; result.fgAttempted++; break;
        case "missed_2pt": result.fgAttempted++; break;
        case "made_3pt": result.points += 3; result.threeMade++; result.threeAttempted++; result.fgMade++; result.fgAttempted++; break;
        case "missed_3pt": result.threeAttempted++; result.fgAttempted++; break;
        case "made_ft": result.points += 1; result.ftMade++; result.ftAttempted++; break;
        case "missed_ft": result.ftAttempted++; break;
        case "rebound": result.rebounds++; break;
        case "assist": result.assists++; break;
        case "steal": result.steals++; break;
        case "block": result.blocks++; break;
        case "turnover": result.turnovers++; break;
        case "foul": result.fouls++; break;
      }
    }

    return result;
  }, [events]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && activeSession) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, activeSession]);

  useEffect(() => {
    if (activeSession && activeSession.status === "active") {
      const startTime = new Date(activeSession.startedAt).getTime();
      const now = Date.now();
      setElapsedTime(Math.floor((now - startTime) / 1000));
      setIsTimerRunning(true);
    }
  }, [activeSession]);

  const startGameMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/live-game/start", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/live-game/active"] });
      setElapsedTime(0);
      setIsTimerRunning(true);
      toast({ title: "Game Started", description: "Start logging your stats!" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to start game", variant: "destructive" });
    },
  });

  const logEventMutation = useMutation({
    mutationFn: (eventType: StatEventType) => 
      apiRequest("POST", `/api/live-game/${sessionId}/event`, {
        eventType,
        quarter: currentQuarter,
        gameTime: formatTime(elapsedTime),
      }),
    onSuccess: (_, eventType) => {
      queryClient.invalidateQueries({ queryKey: ["/api/live-game", sessionId, "events"] });
      const button = STAT_BUTTONS.find(b => b.eventType === eventType);
      if (button?.statKey) {
        setAnimatingStats(prev => new Set(prev).add(button.statKey!));
        setTimeout(() => {
          setAnimatingStats(prev => {
            const next = new Set(prev);
            next.delete(button.statKey!);
            return next;
          });
        }, 300);
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to log event", variant: "destructive" });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: (eventId: number) => 
      apiRequest("DELETE", `/api/live-game/${sessionId}/events/${eventId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/live-game", sessionId, "events"] });
      toast({ title: "Event Undone" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to undo event", variant: "destructive" });
    },
  });

  const completeGameMutation = useMutation({
    mutationFn: () => 
      apiRequest("POST", `/api/live-game/${sessionId}/complete`, {
        opponent: opponent || "Unknown",
        result: result || null,
        minutes: parseInt(minutes) || Math.floor(elapsedTime / 60),
      }),
    onSuccess: (data: any) => {
      setShowEndDialog(false);
      setIsTimerRunning(false);
      queryClient.invalidateQueries({ queryKey: ["/api/live-game/active"] });
      toast({ title: "Game Complete!", description: "Your stats have been saved." });
      if (data.game?.id) {
        navigate(`/players/${data.game.playerId}`);
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to complete game", variant: "destructive" });
    },
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!activeSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold font-display text-primary">LIVE GAME MODE</h1>
          <p className="text-muted-foreground">Track your stats in real-time during a game</p>
        </div>
        <Button
          size="lg"
          className="h-16 px-12 text-xl font-bold pulse-glow"
          onClick={() => startGameMutation.mutate()}
          disabled={startGameMutation.isPending}
          data-testid="button-start-game"
        >
          <Play className="w-6 h-6 mr-3" />
          {startGameMutation.isPending ? "Starting..." : "Start Game"}
        </Button>
      </div>
    );
  }

  const currentStats = stats();

  return (
    <div className="space-y-4 pb-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-primary/20 px-4 py-2 rounded-lg border border-primary/30">
            <Timer className="w-5 h-5 text-primary" />
            <span className="text-2xl font-mono font-bold text-primary" data-testid="game-timer">
              {formatTime(elapsedTime)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">Quarter:</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4].map((q) => (
                <Button
                  key={q}
                  size="sm"
                  variant={currentQuarter === q ? "default" : "outline"}
                  className="w-8 h-8"
                  onClick={() => setCurrentQuarter(q)}
                  data-testid={`button-quarter-${q}`}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <Button
          variant="destructive"
          onClick={() => setShowEndDialog(true)}
          data-testid="button-end-game"
        >
          <Square className="w-4 h-4 mr-2" />
          End Game
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Live Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <LiveGameStats stats={currentStats} animatingStats={animatingStats} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3">
        {STAT_BUTTONS.map((button) => (
          <Button
            key={button.eventType}
            className={cn(
              "h-20 md:h-24 flex flex-col gap-1 text-sm font-medium transition-all active:scale-95",
              button.variant === "made" && "bg-green-600/80 hover:bg-green-600 text-white border-green-500",
              button.variant === "missed" && "bg-slate-600/50 hover:bg-slate-600/70 text-slate-300 border-slate-500",
              button.variant === "neutral" && "bg-blue-600/50 hover:bg-blue-600/70 text-blue-100 border-blue-500",
              button.variant === "negative" && "bg-red-600/50 hover:bg-red-600/70 text-red-100 border-red-500",
            )}
            onClick={() => logEventMutation.mutate(button.eventType)}
            disabled={logEventMutation.isPending}
            data-testid={`button-${button.eventType}`}
          >
            {button.icon}
            <span className="text-xs md:text-sm">{button.label}</span>
          </Button>
        ))}
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Event Log</CardTitle>
          <span className="text-sm text-muted-foreground">{events.length} events</span>
        </CardHeader>
        <CardContent>
          <LiveGameEventLog 
            events={events} 
            onUndo={(eventId) => deleteEventMutation.mutate(eventId)}
            isUndoing={deleteEventMutation.isPending}
          />
        </CardContent>
      </Card>

      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Game</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="opponent">Opponent</Label>
              <Input
                id="opponent"
                placeholder="e.g., Lakers, Team B"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                data-testid="input-opponent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="result">Result (optional)</Label>
              <Input
                id="result"
                placeholder="e.g., W 85-72"
                value={result}
                onChange={(e) => setResult(e.target.value)}
                data-testid="input-result"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minutes">Minutes Played</Label>
              <Input
                id="minutes"
                type="number"
                placeholder={Math.floor(elapsedTime / 60).toString()}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                data-testid="input-minutes"
              />
            </div>
            <div className="bg-card/50 p-3 rounded-lg border border-border/50">
              <p className="text-sm text-muted-foreground mb-2">Game Summary:</p>
              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                <div><span className="font-bold text-primary">{currentStats.points}</span> PTS</div>
                <div><span className="font-bold">{currentStats.rebounds}</span> REB</div>
                <div><span className="font-bold">{currentStats.assists}</span> AST</div>
                <div><span className="font-bold">{currentStats.steals}</span> STL</div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndDialog(false)} data-testid="button-cancel-end">
              Cancel
            </Button>
            <Button 
              onClick={() => completeGameMutation.mutate()} 
              disabled={completeGameMutation.isPending}
              data-testid="button-confirm-end"
            >
              {completeGameMutation.isPending ? "Saving..." : "Save Game"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
