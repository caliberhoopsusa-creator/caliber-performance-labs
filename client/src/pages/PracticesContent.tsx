import { useState, useMemo } from "react";
import { 
  usePractices, 
  usePractice, 
  useCreatePractice, 
  useDeletePractice,
  useCreatePracticeAttendance,
  useUpdatePracticeAttendance,
  useDrills,
  useCreateDrillScore,
  usePlayers,
  useActivePractices,
  useStartPractice,
  type Practice,
  type PracticeAttendance,
  type Drill
} from "@/hooks/use-basketball";
import { useSport } from "@/components/SportToggle";
import { LivePractice } from "@/components/LivePractice";
import { 
  Calendar, Clock, Plus, ChevronDown, ChevronUp, 
  Users, CheckCircle2, XCircle, ClipboardList, Target,
  Trash2, Play, Zap, Dumbbell
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Paywall } from "@/components/Paywall";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type AttendanceRecord = {
  playerId: number;
  attended: boolean;
  effortRating: number;
  notes: string;
};

const BASKETBALL_DRILL_CATEGORIES = [
  { value: "shooting", label: "Shooting" },
  { value: "dribbling", label: "Dribbling" },
  { value: "passing", label: "Passing" },
  { value: "defense", label: "Defense" },
  { value: "rebounding", label: "Rebounding" },
  { value: "conditioning", label: "Conditioning" },
  { value: "footwork", label: "Footwork" },
  { value: "team", label: "Team Play" },
];

const FOOTBALL_DRILL_CATEGORIES = [
  { value: "passing", label: "Passing/Throwing" },
  { value: "route_running", label: "Route Running" },
  { value: "rushing", label: "Rushing/Running" },
  { value: "blocking", label: "Blocking" },
  { value: "tackling", label: "Tackling" },
  { value: "coverage", label: "Coverage" },
  { value: "special_teams", label: "Special Teams" },
  { value: "conditioning", label: "Conditioning" },
  { value: "team", label: "Team Play" },
];

export default function PracticesContent() {
  const { toast } = useToast();
  const sport = useSport();
  const { data: practices, isLoading: practicesLoading, refetch: refetchPractices } = usePractices();
  const { data: players, isLoading: playersLoading } = usePlayers();
  const { data: drills } = useDrills();
  const { data: activePractices = [] } = useActivePractices();
  
  const sportDrillCategories = sport === 'basketball' ? BASKETBALL_DRILL_CATEGORIES : FOOTBALL_DRILL_CATEGORIES;
  
  const createPractice = useCreatePractice();
  const deletePractice = useDeletePractice();
  const createAttendance = useCreatePracticeAttendance();
  const updateAttendance = useUpdatePracticeAttendance();
  const createDrillScore = useCreateDrillScore();
  const startPractice = useStartPractice();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [practiceTitle, setPracticeTitle] = useState("");
  const [practiceDuration, setPracticeDuration] = useState("60");
  const [practiceNotes, setPracticeNotes] = useState("");
  const [expandedPracticeId, setExpandedPracticeId] = useState<number | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<Map<number, AttendanceRecord>>(new Map());
  const [drillScoresOpen, setDrillScoresOpen] = useState(false);
  const [selectedDrill, setSelectedDrill] = useState<string>("");
  const [drillPlayerScores, setDrillPlayerScores] = useState<Map<number, { score: number; notes: string }>>(new Map());
  const [activePracticeView, setActivePracticeView] = useState<Practice | null>(null);
  const [liveTitle, setLiveTitle] = useState("");
  const [liveDuration, setLiveDuration] = useState("60");
  const [liveNotes, setLiveNotes] = useState("");

  const handleStartLivePractice = async () => {
    if (!liveTitle.trim()) {
      toast({ title: "Missing Title", description: "Please enter a practice title", variant: "destructive" });
      return;
    }

    try {
      const newPractice = await startPractice.mutateAsync({
        title: liveTitle.trim(),
        duration: parseInt(liveDuration) || 60,
        notes: liveNotes || undefined,
      });
      setStartDialogOpen(false);
      setActivePracticeView(newPractice);
      setLiveTitle("");
      setLiveDuration("60");
      setLiveNotes("");
      toast({ title: "Practice Started", description: "Live practice session has begun" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to start practice", variant: "destructive" });
    }
  };

  const handleEndPractice = () => {
    setActivePracticeView(null);
    refetchPractices();
  };

  const sortedPractices = useMemo(() => {
    if (!practices) return [];
    return [...practices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [practices]);

  const playerAttendanceStats = useMemo(() => {
    if (!practices || !players) return new Map();
    
    const stats = new Map<number, { attended: number; total: number }>();
    
    for (const player of players) {
      stats.set(player.id, { attended: 0, total: 0 });
    }
    
    for (const practice of practices) {
      const attendance = practice.attendance || [];
      for (const record of attendance) {
        const stat = stats.get(record.playerId);
        if (stat) {
          stat.total++;
          if (record.attended) stat.attended++;
        }
      }
    }
    
    return stats;
  }, [practices, players]);

  const handleCreatePractice = async () => {
    if (!selectedDate || !practiceTitle.trim()) {
      toast({ title: "Missing Fields", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    try {
      await createPractice.mutateAsync({
        date: format(selectedDate, 'yyyy-MM-dd'),
        title: practiceTitle.trim(),
        duration: Number(practiceDuration) || 60,
        notes: practiceNotes.trim() || null,
      });
      
      setDialogOpen(false);
      setPracticeTitle("");
      setPracticeDuration("60");
      setPracticeNotes("");
      setSelectedDate(new Date());
      toast({ title: "Practice Created", description: "Practice session has been added" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create practice", variant: "destructive" });
    }
  };

  const handleDeletePractice = async (id: number) => {
    try {
      await deletePractice.mutateAsync(id);
      toast({ title: "Practice Deleted", description: "Practice session has been removed" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete practice", variant: "destructive" });
    }
  };

  const initializeAttendanceRecords = (practiceId: number, existingAttendance?: PracticeAttendance[]) => {
    if (!players) return;
    
    const records = new Map<number, AttendanceRecord>();
    
    for (const player of players) {
      const existing = existingAttendance?.find(a => a.playerId === player.id);
      records.set(player.id, {
        playerId: player.id,
        attended: existing?.attended ?? false,
        effortRating: existing?.effortRating ?? 5,
        notes: existing?.notes ?? "",
      });
    }
    
    setAttendanceRecords(records);
  };

  const handleExpandPractice = (practice: Practice) => {
    if (expandedPracticeId === practice.id) {
      setExpandedPracticeId(null);
      setAttendanceRecords(new Map());
    } else {
      setExpandedPracticeId(practice.id);
      initializeAttendanceRecords(practice.id, practice.attendance);
    }
  };

  const handleMarkAllPresent = () => {
    const updated = new Map(attendanceRecords);
    Array.from(updated.entries()).forEach(([playerId, record]) => {
      updated.set(playerId, { ...record, attended: true });
    });
    setAttendanceRecords(updated);
  };

  const handleSaveAttendance = async (practiceId: number, existingAttendance?: PracticeAttendance[]) => {
    try {
      const entries = Array.from(attendanceRecords.entries());
      for (const [playerId, record] of entries) {
        const existing = existingAttendance?.find(a => a.playerId === playerId);
        
        if (existing) {
          await updateAttendance.mutateAsync({
            id: existing.id,
            practiceId,
            updates: {
              attended: record.attended,
              effortRating: record.effortRating,
              notes: record.notes || null,
            },
          });
        } else {
          await createAttendance.mutateAsync({
            practiceId,
            attendance: {
              playerId,
              attended: record.attended,
              effortRating: record.effortRating,
              notes: record.notes || null,
            },
          });
        }
      }
      toast({ title: "Attendance Saved", description: "Attendance records have been updated" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save attendance", variant: "destructive" });
    }
  };

  const handleSaveDrillScores = async (practiceId: number) => {
    if (!selectedDrill) return;
    
    try {
      const entries = Array.from(drillPlayerScores.entries());
      for (const [playerId, scoreData] of entries) {
        if (scoreData.score > 0) {
          await createDrillScore.mutateAsync({
            practiceId,
            score: {
              playerId,
              drillId: Number(selectedDrill),
              score: scoreData.score,
              notes: scoreData.notes || undefined,
            },
          });
        }
      }
      setDrillScoresOpen(false);
      setSelectedDrill("");
      setDrillPlayerScores(new Map());
      toast({ title: "Drill Scores Saved", description: "Drill scores have been recorded" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save drill scores", variant: "destructive" });
    }
  };

  const drillCategories = useMemo(() => {
    if (!drills) return [];
    const sportCategoryValues = sportDrillCategories.map(c => c.value);
    const categories = new Set(drills.map(d => d.category).filter(cat => sportCategoryValues.includes(cat)));
    return Array.from(categories);
  }, [drills, sportDrillCategories]);

  const getAttendanceColor = (rate: number) => {
    if (rate >= 80) return "text-green-400";
    if (rate >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  if (practicesLoading || playersLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-64 bg-muted/30" />
            <Skeleton className="h-4 w-48 bg-muted/20" />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Skeleton className="h-10 w-32 rounded bg-muted/20" />
            <Skeleton className="h-10 w-32 rounded bg-muted/20" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-card/50 border-white/5">
              <CardHeader>
                <Skeleton className="h-6 w-40 bg-muted/30" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-lg border border-white/10 bg-secondary/20 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-5 w-32 bg-muted/30" />
                        <div className="flex items-center gap-4 mt-2">
                          <Skeleton className="h-4 w-24 bg-muted/20" />
                          <Skeleton className="h-4 w-20 bg-muted/20" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-20 rounded-full bg-muted/20" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="bg-card/50 border-white/5">
              <CardHeader>
                <Skeleton className="h-6 w-48 bg-muted/30" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <Skeleton className="h-8 w-8 rounded-full bg-muted/20" />
                      <Skeleton className="h-4 w-24 bg-muted/20" />
                    </div>
                    <Skeleton className="h-4 w-12 bg-muted/20" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-white/5">
              <CardHeader>
                <Skeleton className="h-6 w-40 bg-muted/30" />
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-8 w-24 rounded-full bg-muted/20" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (activePracticeView) {
    return (
      <Paywall requiredTier="coach_pro" featureName="Practice Tracker">
        <LivePractice 
          practice={activePracticeView} 
          onEnd={handleEndPractice} 
          onBack={() => setActivePracticeView(null)}
        />
      </Paywall>
    );
  }

  return (
    <Paywall requiredTier="coach_pro" featureName="Practice Tracker">
      <div className="space-y-8 animate-in fade-in duration-500">
      
      {activePractices.length > 0 && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-400">
              <Zap className="w-5 h-5" />
              Active Practice Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="font-medium text-lg">{activePractices[0].title}</div>
                <div className="text-sm text-muted-foreground">
                  Started {activePractices[0].startedAt ? new Date(activePractices[0].startedAt).toLocaleTimeString() : 'recently'}
                </div>
              </div>
              <Button onClick={() => setActivePracticeView(activePractices[0])} data-testid="button-continue-practice">
                <Play className="w-4 h-4 mr-2" />
                Continue Practice
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-accent/50 font-medium">
            Log {sport === 'basketball' ? 'basketball drills, shooting sessions' : 'football drills, plays, and conditioning'} and track player attendance
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <Dialog open={startDialogOpen} onOpenChange={setStartDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" className="gap-2 bg-green-600" data-testid="button-start-live-practice">
                <Play className="w-4 h-4" />
                Start Live Practice
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]" data-testid="dialog-start-live-practice">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-green-400" />
                  Start Live Practice
                </DialogTitle>
                <DialogDescription>
                  Begin a live practice session to track attendance, run drills, and score players in real-time.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Practice Title</label>
                  <Input
                    placeholder={sport === 'basketball' 
                      ? "e.g., Shooting Drills, Team Scrimmage" 
                      : "e.g., Passing Practice, Tackling Drills"}
                    value={liveTitle}
                    onChange={(e) => setLiveTitle(e.target.value)}
                    data-testid="input-live-title"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Planned Duration (minutes)</label>
                  <Input
                    type="number"
                    placeholder="60"
                    value={liveDuration}
                    onChange={(e) => setLiveDuration(e.target.value)}
                    data-testid="input-live-duration"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes (optional)</label>
                  <Textarea
                    placeholder="Focus areas, objectives..."
                    value={liveNotes}
                    onChange={(e) => setLiveNotes(e.target.value)}
                    className="min-h-[60px]"
                    data-testid="input-live-notes"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStartDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleStartLivePractice} disabled={startPractice.isPending} data-testid="button-confirm-start">
                  <Play className="w-4 h-4 mr-2" />
                  Start Practice
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-create-practice" className="gap-2">
                <Plus className="w-4 h-4" />
                Log Past Practice
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto" data-testid="dialog-create-practice">
            <DialogHeader>
              <DialogTitle>Create Practice Session</DialogTitle>
              <DialogDescription>
                Add a new practice session to track attendance and performance.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
                      data-testid="input-practice-date"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Title</label>
                <Input
                  placeholder={sport === 'basketball' 
                    ? "e.g., Shooting Drills, Team Scrimmage" 
                    : "e.g., Route Running, 7-on-7 Drills"}
                  value={practiceTitle}
                  onChange={(e) => setPracticeTitle(e.target.value)}
                  data-testid="input-practice-title"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Duration (minutes)</label>
                <Input
                  type="number"
                  placeholder="60"
                  value={practiceDuration}
                  onChange={(e) => setPracticeDuration(e.target.value)}
                  data-testid="input-practice-duration"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Notes</label>
                <Textarea
                  placeholder="Practice notes, focus areas, etc."
                  value={practiceNotes}
                  onChange={(e) => setPracticeNotes(e.target.value)}
                  data-testid="input-practice-notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-practice">
                Cancel
              </Button>
              <Button onClick={handleCreatePractice} disabled={createPractice.isPending} data-testid="button-submit-practice">
                {createPractice.isPending ? "Creating..." : "Create Practice"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-card/50 border-white/5">
            <CardHeader>
              <CardTitle className="text-lg font-display text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                Practice Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sortedPractices.length === 0 ? (
                <EmptyState
                  icon={Dumbbell}
                  title="No Practices Yet"
                  description="Start tracking practice sessions to monitor attendance, run drills, and measure player development."
                  action={{ label: "Start Live Practice", onClick: () => setStartDialogOpen(true) }}
                  variant="compact"
                />
              ) : (
                sortedPractices.map((practice) => (
                  <PracticeCard
                    key={practice.id}
                    practice={practice}
                    isExpanded={expandedPracticeId === practice.id}
                    onToggle={() => handleExpandPractice(practice)}
                    onDelete={() => handleDeletePractice(practice.id)}
                    players={players || []}
                    attendanceRecords={attendanceRecords}
                    setAttendanceRecords={setAttendanceRecords}
                    onMarkAllPresent={handleMarkAllPresent}
                    onSaveAttendance={() => handleSaveAttendance(practice.id, practice.attendance)}
                    drills={drills || []}
                    drillScoresOpen={drillScoresOpen}
                    setDrillScoresOpen={setDrillScoresOpen}
                    selectedDrill={selectedDrill}
                    setSelectedDrill={setSelectedDrill}
                    drillPlayerScores={drillPlayerScores}
                    setDrillPlayerScores={setDrillPlayerScores}
                    onSaveDrillScores={() => handleSaveDrillScores(practice.id)}
                    drillCategories={drillCategories}
                    isSaving={createAttendance.isPending || updateAttendance.isPending}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="bg-card/50 border-white/5" data-testid="card-attendance-summary">
            <CardHeader>
              <CardTitle className="text-lg font-display text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Attendance Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {players && players.length > 0 ? (
                players.map((player) => {
                  const stats = playerAttendanceStats.get(player.id);
                  const rate = stats && stats.total > 0 ? Math.round((stats.attended / stats.total) * 100) : 0;
                  const hasData = stats && stats.total > 0;
                  
                  return (
                    <div key={player.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5" data-testid={`attendance-summary-${player.id}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                          {player.jerseyNumber || "#"}
                        </div>
                        <span className="font-medium text-white text-sm">{player.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasData ? (
                          <>
                            <span className={cn("font-bold text-sm", getAttendanceColor(rate))}>
                              {rate}%
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({stats.attended}/{stats.total})
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">No data</span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground text-center py-4">No players yet</p>
              )}
            </CardContent>
          </Card>

          {drills && drills.length > 0 && (
            <Card className="bg-card/50 border-white/5" data-testid="card-drill-categories">
              <CardHeader>
                <CardTitle className="text-lg font-display text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Available Drills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {drillCategories.map((category) => (
                    <Badge key={category} variant="outline" className="text-xs capitalize">
                      {category}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  {drills.length} drills available for scoring
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </div>
    </Paywall>
  );
}

type PracticeCardProps = {
  practice: Practice;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  players: { id: number; name: string; jerseyNumber: number | null }[];
  attendanceRecords: Map<number, AttendanceRecord>;
  setAttendanceRecords: (records: Map<number, AttendanceRecord>) => void;
  onMarkAllPresent: () => void;
  onSaveAttendance: () => void;
  drills: Drill[];
  drillScoresOpen: boolean;
  setDrillScoresOpen: (open: boolean) => void;
  selectedDrill: string;
  setSelectedDrill: (drill: string) => void;
  drillPlayerScores: Map<number, { score: number; notes: string }>;
  setDrillPlayerScores: (scores: Map<number, { score: number; notes: string }>) => void;
  onSaveDrillScores: () => void;
  drillCategories: string[];
  isSaving: boolean;
};

function PracticeCard({
  practice,
  isExpanded,
  onToggle,
  onDelete,
  players,
  attendanceRecords,
  setAttendanceRecords,
  onMarkAllPresent,
  onSaveAttendance,
  drills,
  drillScoresOpen,
  setDrillScoresOpen,
  selectedDrill,
  setSelectedDrill,
  drillPlayerScores,
  setDrillPlayerScores,
  onSaveDrillScores,
  drillCategories,
  isSaving,
}: PracticeCardProps) {
  const attendanceCount = practice.attendance?.filter(a => a.attended).length || 0;
  const totalPlayers = practice.attendance?.length || 0;

  const updatePlayerAttendance = (playerId: number, field: keyof AttendanceRecord, value: any) => {
    const updated = new Map(attendanceRecords);
    const current = updated.get(playerId);
    if (current) {
      updated.set(playerId, { ...current, [field]: value });
      setAttendanceRecords(updated);
    }
  };

  const updateDrillScore = (playerId: number, field: 'score' | 'notes', value: any) => {
    const updated = new Map(drillPlayerScores);
    const current = updated.get(playerId) || { score: 0, notes: "" };
    updated.set(playerId, { ...current, [field]: value });
    setDrillPlayerScores(updated);
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className="rounded-lg border border-white/10 bg-secondary/20" data-testid={`practice-card-${practice.id}`}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors" data-testid={`practice-toggle-${practice.id}`}>
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="font-semibold text-white">{practice.title}</span>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(practice.date), "MMM d, yyyy")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {practice.duration} min
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {totalPlayers > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {attendanceCount}/{totalPlayers} present
                </Badge>
              )}
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                data-testid={`button-delete-practice-${practice.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="border-t border-white/10 p-4 space-y-4">
            {practice.notes && (
              <div className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-lg">
                {practice.notes}
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-white text-sm">Attendance</h4>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={onMarkAllPresent} data-testid="button-mark-all-present">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Mark All Present
                </Button>
                <Button size="sm" onClick={onSaveAttendance} disabled={isSaving} data-testid="button-save-attendance">
                  {isSaving ? "Saving..." : "Save Attendance"}
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              {players.map((player) => {
                const record = attendanceRecords.get(player.id);
                if (!record) return null;
                
                return (
                  <div key={player.id} className="p-3 rounded-lg bg-secondary/20 border border-white/5" data-testid={`attendance-row-${player.id}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={record.attended}
                          onCheckedChange={(checked) => updatePlayerAttendance(player.id, 'attended', !!checked)}
                          data-testid={`checkbox-attendance-${player.id}`}
                        />
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                          {player.jerseyNumber || "#"}
                        </div>
                        <span className="font-medium text-white">{player.name}</span>
                      </div>
                      {record.attended ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    
                    {record.attended && (
                      <div className="space-y-3 pl-8">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs text-muted-foreground">Effort Rating</label>
                            <span className="text-sm font-bold text-primary">{record.effortRating}/10</span>
                          </div>
                          <Slider
                            value={[record.effortRating]}
                            onValueChange={(value) => updatePlayerAttendance(player.id, 'effortRating', value[0])}
                            min={1}
                            max={10}
                            step={1}
                            className="w-full"
                            data-testid={`slider-effort-${player.id}`}
                          />
                        </div>
                        <Input
                          placeholder="Player notes..."
                          value={record.notes}
                          onChange={(e) => updatePlayerAttendance(player.id, 'notes', e.target.value)}
                          className="text-sm h-8"
                          data-testid={`input-player-notes-${player.id}`}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {drills.length > 0 && (
              <div className="border-t border-white/10 pt-4">
                <Collapsible open={drillScoresOpen} onOpenChange={setDrillScoresOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between" data-testid="button-toggle-drill-scores">
                      <span className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Log Drill Scores
                      </span>
                      {drillScoresOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-4 space-y-4">
                      <Select value={selectedDrill} onValueChange={setSelectedDrill}>
                        <SelectTrigger data-testid="select-drill">
                          <SelectValue placeholder="Select a drill" />
                        </SelectTrigger>
                        <SelectContent>
                          {drillCategories.map((category) => (
                            <div key={category}>
                              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">{category}</div>
                              {drills.filter(d => d.category === category).map((drill) => (
                                <SelectItem key={drill.id} value={String(drill.id)} data-testid={`select-drill-${drill.id}`}>
                                  {drill.name}
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {selectedDrill && (
                        <div className="space-y-3">
                          {players.map((player) => {
                            const scoreData = drillPlayerScores.get(player.id) || { score: 0, notes: "" };
                            return (
                              <div key={player.id} className="flex items-center gap-4 p-2 rounded-lg bg-secondary/20" data-testid={`drill-score-row-${player.id}`}>
                                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                                  {player.jerseyNumber || "#"}
                                </div>
                                <span className="font-medium text-white flex-1">{player.name}</span>
                                <Input
                                  type="number"
                                  placeholder="Score"
                                  value={scoreData.score || ""}
                                  onChange={(e) => updateDrillScore(player.id, 'score', Number(e.target.value))}
                                  className="w-20 h-8"
                                  min={0}
                                  max={100}
                                  data-testid={`input-drill-score-${player.id}`}
                                />
                              </div>
                            );
                          })}
                          <Button onClick={onSaveDrillScores} className="w-full" data-testid="button-save-drill-scores">
                            Save Drill Scores
                          </Button>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
