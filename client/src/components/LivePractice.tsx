import { useState, useEffect, useMemo } from "react";
import {
  usePlayers,
  useDrills,
  usePracticeAttendance,
  useCheckInPlayer,
  useSetCurrentDrill,
  useEndPractice,
  useCreateDrillScore,
  type Practice,
  type Drill,
  type PracticeAttendance,
} from "@/hooks/use-basketball";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Timer,
  Users,
  Target,
  Play,
  Square,
  Check,
  X,
  Clock,
  ClipboardList,
  Trophy,
  Zap,
  ArrowLeft,
} from "lucide-react";

interface LivePracticeProps {
  practice: Practice;
  onEnd: () => void;
  onBack: () => void;
}

type Player = {
  id: number;
  name: string;
  position: string;
  photoUrl?: string | null;
};

export function LivePractice({ practice, onEnd, onBack }: LivePracticeProps) {
  const { toast } = useToast();
  const { data: players = [], isLoading: playersLoading } = usePlayers();
  const { data: drills = [] } = useDrills();
  const { data: attendance = [], refetch: refetchAttendance } = usePracticeAttendance(practice.id);
  
  const checkInPlayer = useCheckInPlayer();
  const setCurrentDrill = useSetCurrentDrill();
  const endPractice = useEndPractice();
  const createDrillScore = useCreateDrillScore();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedDrill, setSelectedDrill] = useState<string>("");
  const [drillScores, setDrillScores] = useState<Map<number, { score: number; notes: string }>>(new Map());
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [endNotes, setEndNotes] = useState(practice.notes || "");
  const [activeTab, setActiveTab] = useState("attendance");

  useEffect(() => {
    const startTime = practice.startedAt ? new Date(practice.startedAt).getTime() : Date.now();
    
    const updateElapsed = () => {
      const now = Date.now();
      setElapsedSeconds(Math.floor((now - startTime) / 1000));
    };
    
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [practice.startedAt]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const attendanceMap = useMemo(() => {
    const map = new Map<number, PracticeAttendance>();
    attendance.forEach((a) => map.set(a.playerId, a));
    return map;
  }, [attendance]);

  const presentCount = useMemo(() => {
    return attendance.filter((a) => a.attended).length;
  }, [attendance]);

  const handleCheckIn = async (playerId: number, attended: boolean) => {
    try {
      await checkInPlayer.mutateAsync({
        practiceId: practice.id,
        playerId,
        attended,
      });
      await refetchAttendance();
      toast({
        title: attended ? "Player checked in" : "Player marked absent",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update attendance",
        variant: "destructive",
      });
    }
  };

  const handleSelectDrill = async (drillId: string) => {
    setSelectedDrill(drillId);
    setDrillScores(new Map());
    
    if (drillId) {
      try {
        await setCurrentDrill.mutateAsync({
          practiceId: practice.id,
          drillId: Number(drillId),
        });
      } catch (error) {
        console.error("Failed to set current drill:", error);
      }
    }
  };

  const handleScoreDrill = async () => {
    if (!selectedDrill) return;
    
    try {
      const entries = Array.from(drillScores.entries());
      for (const [playerId, data] of entries) {
        if (data.score > 0) {
          await createDrillScore.mutateAsync({
            practiceId: practice.id,
            score: {
              playerId,
              drillId: Number(selectedDrill),
              score: data.score,
              notes: data.notes || undefined,
            },
          });
        }
      }
      toast({
        title: "Drill scores saved",
        description: `Saved scores for ${entries.length} players`,
      });
      setSelectedDrill("");
      setDrillScores(new Map());
      await setCurrentDrill.mutateAsync({ practiceId: practice.id, drillId: null });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save drill scores",
        variant: "destructive",
      });
    }
  };

  const handleEndPractice = async () => {
    try {
      await endPractice.mutateAsync({
        practiceId: practice.id,
        notes: endNotes,
      });
      toast({
        title: "Practice ended",
        description: `Practice completed after ${formatTime(elapsedSeconds)}`,
      });
      setEndDialogOpen(false);
      onEnd();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to end practice",
        variant: "destructive",
      });
    }
  };

  const drillCategories = useMemo(() => {
    const cats = new Set(drills.map((d) => d.category));
    return Array.from(cats);
  }, [drills]);

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const presentPlayers = useMemo(() => {
    return players.filter((p) => attendanceMap.get(p.id)?.attended);
  }, [players, attendanceMap]);

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 border-b border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-from-practice">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-display font-bold text-white" data-testid="text-practice-title">
                  {practice.title}
                </h1>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 animate-pulse">
                  <Play className="w-3 h-3 mr-1 fill-current" /> LIVE
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {presentCount} / {players.length} present
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="glass-card px-6 py-3 rounded-xl" data-testid="timer-display">
              <div className="flex items-center gap-3">
                <Timer className="w-6 h-6 text-primary" />
                <span className="text-3xl font-mono font-bold text-white tabular-nums">
                  {formatTime(elapsedSeconds)}
                </span>
              </div>
            </div>
            
            <Button
              variant="destructive"
              onClick={() => setEndDialogOpen(true)}
              data-testid="button-end-practice"
            >
              <Square className="w-4 h-4 mr-2" />
              End Practice
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2" data-testid="tabs-practice-mode">
          <TabsTrigger value="attendance" className="gap-2" data-testid="tab-attendance">
            <Users className="w-4 h-4" /> Attendance
          </TabsTrigger>
          <TabsTrigger value="drills" className="gap-2" data-testid="tab-drills">
            <Target className="w-4 h-4" /> Drills
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-4">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  Player Check-In
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    players.forEach((p) => {
                      if (!attendanceMap.get(p.id)?.attended) {
                        handleCheckIn(p.id, true);
                      }
                    });
                  }}
                  data-testid="button-mark-all-present"
                >
                  <Check className="w-4 h-4 mr-1" /> Mark All Present
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {playersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-pulse flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-primary/20" />
                    <div className="h-3 w-20 bg-muted rounded" />
                  </div>
                </div>
              ) : players.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No players found. Add players first.
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {players.map((player) => {
                      const isPresent = attendanceMap.get(player.id)?.attended || false;
                      const checkInTime = attendanceMap.get(player.id)?.checkedInAt;
                      
                      return (
                        <div
                          key={player.id}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                            isPresent
                              ? "bg-green-500/10 border-green-500/30"
                              : "bg-muted/30 border-border/50"
                          }`}
                          data-testid={`player-row-${player.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={player.photoUrl || undefined} />
                              <AvatarFallback>{getInitials(player.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{player.name}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {player.position}
                                </Badge>
                                {checkInTime && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant={isPresent ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleCheckIn(player.id, true)}
                              disabled={checkInPlayer.isPending}
                              data-testid={`button-checkin-${player.id}`}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant={!isPresent && attendanceMap.has(player.id) ? "destructive" : "outline"}
                              size="sm"
                              onClick={() => handleCheckIn(player.id, false)}
                              disabled={checkInPlayer.isPending}
                              data-testid={`button-absent-${player.id}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drills" className="space-y-4">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Run Drill
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={selectedDrill} onValueChange={handleSelectDrill}>
                  <SelectTrigger className="w-full sm:w-[300px]" data-testid="select-drill">
                    <SelectValue placeholder="Select a drill to run..." />
                  </SelectTrigger>
                  <SelectContent>
                    {drillCategories.map((category) => (
                      <div key={category}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                          {category}
                        </div>
                        {drills
                          .filter((d) => d.category === category)
                          .map((drill) => (
                            <SelectItem key={drill.id} value={drill.id.toString()}>
                              {drill.name}
                            </SelectItem>
                          ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>

                {selectedDrill && (
                  <Button onClick={handleScoreDrill} disabled={createDrillScore.isPending} data-testid="button-save-drill-scores">
                    <Trophy className="w-4 h-4 mr-2" />
                    Save Drill Scores
                  </Button>
                )}
              </div>

              {selectedDrill && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      Score Players ({presentPlayers.length} present)
                    </h3>
                    <Badge variant="outline">
                      {drills.find((d) => d.id.toString() === selectedDrill)?.name}
                    </Badge>
                  </div>

                  <ScrollArea className="h-[350px] pr-4">
                    <div className="space-y-4">
                      {presentPlayers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No players checked in yet. Check in players first.
                        </div>
                      ) : (
                        presentPlayers.map((player) => {
                          const scoreData = drillScores.get(player.id) || { score: 50, notes: "" };
                          
                          return (
                            <div
                              key={player.id}
                              className="p-4 rounded-lg border bg-muted/20"
                              data-testid={`drill-score-row-${player.id}`}
                            >
                              <div className="flex items-center gap-3 mb-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={player.photoUrl || undefined} />
                                  <AvatarFallback>{getInitials(player.name)}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{player.name}</span>
                                <Badge
                                  className={`ml-auto ${
                                    scoreData.score >= 80
                                      ? "bg-green-500/20 text-green-400"
                                      : scoreData.score >= 60
                                      ? "bg-blue-500/20 text-blue-400"
                                      : scoreData.score >= 40
                                      ? "bg-yellow-500/20 text-yellow-400"
                                      : "bg-red-500/20 text-red-400"
                                  }`}
                                >
                                  {scoreData.score}
                                </Badge>
                              </div>
                              <div className="space-y-2">
                                <Slider
                                  value={[scoreData.score]}
                                  onValueChange={(value) => {
                                    const newScores = new Map(drillScores);
                                    newScores.set(player.id, { ...scoreData, score: value[0] });
                                    setDrillScores(newScores);
                                  }}
                                  max={100}
                                  step={5}
                                  className="w-full"
                                  data-testid={`slider-score-${player.id}`}
                                />
                                <Input
                                  placeholder="Notes (optional)"
                                  value={scoreData.notes}
                                  onChange={(e) => {
                                    const newScores = new Map(drillScores);
                                    newScores.set(player.id, { ...scoreData, notes: e.target.value });
                                    setDrillScores(newScores);
                                  }}
                                  className="text-sm"
                                  data-testid={`input-notes-${player.id}`}
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {!selectedDrill && (
                <div className="text-center py-12 border-2 border-dashed border-muted rounded-xl">
                  <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <Target className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-1">No drill selected</h3>
                  <p className="text-sm text-muted-foreground">Select a drill above to start scoring players</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
        <DialogContent data-testid="dialog-end-practice">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Square className="w-5 h-5" />
              End Practice?
            </DialogTitle>
            <DialogDescription>
              This will finalize the practice session. Duration: {formatTime(elapsedSeconds)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="glass-card p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-400">{presentCount}</div>
                <div className="text-muted-foreground">Players Present</div>
              </div>
              <div className="glass-card p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-primary">{formatTime(elapsedSeconds)}</div>
                <div className="text-muted-foreground">Duration</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Practice Notes</label>
              <Textarea
                value={endNotes}
                onChange={(e) => setEndNotes(e.target.value)}
                placeholder="Add any notes about this practice..."
                className="min-h-[80px]"
                data-testid="textarea-end-notes"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEndDialogOpen(false)}>
              Continue Practice
            </Button>
            <Button onClick={handleEndPractice} disabled={endPractice.isPending} data-testid="button-confirm-end">
              End Practice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
