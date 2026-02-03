import { useState, useMemo } from "react";
import { usePlayers, useTeamDashboard, useLineups, useCreateLineup, useDeleteLineup, useLineup, useUpdateRosterRole, type Lineup, type TeamDashboardPlayer, type RosterRole } from "@/hooks/use-basketball";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Plus, Trash2, ArrowLeftRight, TrendingUp, Clock, Target, Settings2 } from "lucide-react";
import { Paywall } from "@/components/Paywall";
import { useToast } from "@/hooks/use-toast";

const ROLE_COLORS: Record<string, string> = {
  "starter": "bg-green-500/20 text-green-400 border-green-500/30",
  "rotation": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "bench": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "development": "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const ROLE_LABELS: Record<string, string> = {
  "starter": "Starter",
  "rotation": "Rotation",
  "bench": "Bench",
  "development": "Development",
};

const POSITION_ICONS: Record<string, string> = {
  "Guard": "PG/SG",
  "Wing": "SF/SG",
  "Big": "PF/C",
};

function gradeToScore(grade: string | null): number {
  if (!grade) return 0;
  const gradeMap: Record<string, number> = {
    "A+": 100, "A": 95, "A-": 90,
    "B+": 85, "B": 80, "B-": 75,
    "C+": 70, "C": 65, "C-": 60,
    "D": 50, "F": 40
  };
  return gradeMap[grade] || 0;
}

export default function LineupsContent() {
  const { toast } = useToast();
  const { data: players, isLoading: playersLoading } = usePlayers();
  const { data: teamDashboard, isLoading: dashboardLoading } = useTeamDashboard();
  const { data: lineups, isLoading: lineupsLoading } = useLineups();
  const createLineup = useCreateLineup();
  const deleteLineup = useDeleteLineup();
  const updateRosterRole = useUpdateRosterRole();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [lineupName, setLineupName] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [compareLineup1, setCompareLineup1] = useState<number | null>(null);
  const [compareLineup2, setCompareLineup2] = useState<number | null>(null);

  const depthChart = useMemo(() => {
    if (!teamDashboard?.players) return { Guard: [], Wing: [], Big: [] };
    
    const positions: Record<string, TeamDashboardPlayer[]> = {
      Guard: [],
      Wing: [],
      Big: [],
    };

    teamDashboard.players.forEach(p => {
      if (positions[p.position]) {
        positions[p.position].push(p);
      }
    });

    Object.keys(positions).forEach(pos => {
      positions[pos].sort((a, b) => b.avgGradeScore - a.avgGradeScore);
    });

    return positions;
  }, [teamDashboard]);

  const handleCreateLineup = async () => {
    if (selectedPlayers.length !== 5) {
      toast({ title: "Error", description: "Please select exactly 5 players", variant: "destructive" });
      return;
    }

    try {
      await createLineup.mutateAsync({
        name: lineupName || undefined,
        playerIds: selectedPlayers.join(","),
      });
      toast({ title: "Success", description: "Lineup created successfully" });
      setIsDialogOpen(false);
      setLineupName("");
      setSelectedPlayers([]);
    } catch (error) {
      toast({ title: "Error", description: "Failed to create lineup", variant: "destructive" });
    }
  };

  const handleDeleteLineup = async (id: number) => {
    try {
      await deleteLineup.mutateAsync(id);
      toast({ title: "Success", description: "Lineup deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete lineup", variant: "destructive" });
    }
  };

  const togglePlayerSelection = (playerId: number) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : prev.length < 5 ? [...prev, playerId] : prev
    );
  };

  const getLineupPlayers = (lineup: Lineup) => {
    if (!players) return [];
    const ids = lineup.playerIds.split(",").map(Number);
    return ids.map(id => players.find(p => p.id === id)).filter(Boolean);
  };

  const isLoading = playersLoading || dashboardLoading || lineupsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  return (
    <Paywall requiredTier="coach_pro" featureName="Lineup Analysis">
      <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-cyan-200/50">Manage lineups and analyze position depth</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-lineup">
              <Plus className="mr-2 h-4 w-4" />
              Create Lineup
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Lineup</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="lineup-name">Lineup Name (Optional)</Label>
                <Input
                  id="lineup-name"
                  placeholder="e.g., Starting 5"
                  value={lineupName}
                  onChange={(e) => setLineupName(e.target.value)}
                  data-testid="input-lineup-name"
                />
              </div>
              <div>
                <Label>Select 5 Players ({selectedPlayers.length}/5)</Label>
                <div className="mt-2 max-h-64 overflow-y-auto space-y-1 border rounded-md p-2">
                  {players?.map(player => (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                        selectedPlayers.includes(player.id) 
                          ? "bg-primary/20 border border-primary/50" 
                          : "hover-elevate"
                      }`}
                      onClick={() => togglePlayerSelection(player.id)}
                      data-testid={`player-select-${player.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{player.name}</span>
                        <Badge variant="outline" className="text-xs">{player.position}</Badge>
                      </div>
                      {selectedPlayers.includes(player.id) && (
                        <Badge variant="default" className="text-xs">Selected</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <Button
                onClick={handleCreateLineup}
                disabled={selectedPlayers.length !== 5 || createLineup.isPending}
                className="w-full"
                data-testid="button-submit-lineup"
              >
                {createLineup.isPending ? "Creating..." : "Create Lineup"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Saved Lineups
        </h2>
        {lineups?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No lineups created yet. Create your first lineup to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lineups?.map(lineup => (
              <LineupCard
                key={lineup.id}
                lineup={lineup}
                lineupPlayers={getLineupPlayers(lineup)}
                onDelete={() => handleDeleteLineup(lineup.id)}
                isDeleting={deleteLineup.isPending}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5" />
          Position Depth Chart
          <Settings2 className="h-4 w-4 text-muted-foreground ml-1" />
        </h2>
        <p className="text-sm text-cyan-200/50 mb-4">Assign roles to players by selecting from the dropdown</p>
        <div className="grid gap-4 md:grid-cols-3">
          {(["Guard", "Wing", "Big"] as const).map(position => (
            <Card key={position} data-testid={`card-depth-${position.toLowerCase()}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  {position}
                  <span className="text-xs text-muted-foreground font-normal">
                    {POSITION_ICONS[position]}
                  </span>
                </CardTitle>
                <CardDescription>{depthChart[position].length} players</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {depthChart[position].length === 0 ? (
                  <p className="text-sm text-muted-foreground">No players at this position</p>
                ) : (
                  depthChart[position].map((player, index) => {
                    const currentRole = player.rosterRole || "rotation";
                    return (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-2 rounded border bg-card gap-2"
                        data-testid={`depth-player-${player.id}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium text-muted-foreground w-4 shrink-0">
                            {index + 1}.
                          </span>
                          <span className="font-medium truncate">{player.name}</span>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {player.avgGrade || "N/A"}
                          </Badge>
                        </div>
                        <Select
                          value={currentRole}
                          onValueChange={(value: RosterRole) => {
                            updateRosterRole.mutate(
                              { id: player.id, rosterRole: value },
                              {
                                onSuccess: () => {
                                  toast({ title: "Role Updated", description: `${player.name} is now ${ROLE_LABELS[value]}` });
                                },
                                onError: () => {
                                  toast({ title: "Error", description: "Failed to update role", variant: "destructive" });
                                }
                              }
                            );
                          }}
                        >
                          <SelectTrigger 
                            className={`w-[110px] text-xs border ${ROLE_COLORS[currentRole]}`}
                            data-testid={`select-role-${player.id}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="starter">Starter</SelectItem>
                            <SelectItem value="rotation">Rotation</SelectItem>
                            <SelectItem value="bench">Bench</SelectItem>
                            <SelectItem value="development">Development</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5" />
          Lineup Comparison
        </h2>
        <Card>
          <CardContent className="pt-6">
            {(!lineups || lineups.length < 2) ? (
              <p className="text-center text-muted-foreground py-8">
                Create at least 2 lineups to compare them
              </p>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>First Lineup</Label>
                    <Select
                      value={compareLineup1?.toString() || ""}
                      onValueChange={(v) => setCompareLineup1(v ? Number(v) : null)}
                    >
                      <SelectTrigger data-testid="select-compare-lineup-1">
                        <SelectValue placeholder="Select lineup" />
                      </SelectTrigger>
                      <SelectContent>
                        {lineups?.map(l => (
                          <SelectItem key={l.id} value={l.id.toString()}>
                            {l.name || `Lineup #${l.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Second Lineup</Label>
                    <Select
                      value={compareLineup2?.toString() || ""}
                      onValueChange={(v) => setCompareLineup2(v ? Number(v) : null)}
                    >
                      <SelectTrigger data-testid="select-compare-lineup-2">
                        <SelectValue placeholder="Select lineup" />
                      </SelectTrigger>
                      <SelectContent>
                        {lineups?.map(l => (
                          <SelectItem key={l.id} value={l.id.toString()}>
                            {l.name || `Lineup #${l.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {compareLineup1 && compareLineup2 && (
                  <LineupComparisonView
                    lineup1Id={compareLineup1}
                    lineup2Id={compareLineup2}
                    players={players || []}
                    teamDashboard={teamDashboard}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
      </div>
    </Paywall>
  );
}

function LineupCard({ 
  lineup, 
  lineupPlayers, 
  onDelete, 
  isDeleting 
}: { 
  lineup: Lineup; 
  lineupPlayers: any[]; 
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const { data: lineupWithStats } = useLineup(lineup.id);
  
  const stats = useMemo(() => {
    if (!lineupWithStats?.stats || lineupWithStats.stats.length === 0) {
      return { avgPlusMinus: 0, totalMinutes: 0, totalPoints: 0, gamesPlayed: 0 };
    }
    
    const s = lineupWithStats.stats;
    return {
      avgPlusMinus: s.reduce((acc, stat) => acc + stat.plusMinus, 0) / s.length,
      totalMinutes: s.reduce((acc, stat) => acc + stat.minutes, 0),
      totalPoints: s.reduce((acc, stat) => acc + stat.points, 0),
      gamesPlayed: s.length,
    };
  }, [lineupWithStats]);

  return (
    <Card data-testid={`card-lineup-${lineup.id}`}>
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="text-lg">{lineup.name || `Lineup #${lineup.id}`}</CardTitle>
          <CardDescription>5 Players</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          disabled={isDeleting}
          data-testid={`button-delete-lineup-${lineup.id}`}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1">
          {lineupPlayers.map((player: any) => (
            <Badge key={player.id} variant="secondary" className="text-xs">
              {player.name}
            </Badge>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
          <div className="flex items-center gap-1 text-sm">
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Avg +/-:</span>
            <span className={stats.avgPlusMinus >= 0 ? "text-green-400" : "text-red-400"}>
              {stats.avgPlusMinus >= 0 ? "+" : ""}{stats.avgPlusMinus.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Mins:</span>
            <span>{stats.totalMinutes}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LineupComparisonView({
  lineup1Id,
  lineup2Id,
  players,
  teamDashboard,
}: {
  lineup1Id: number;
  lineup2Id: number;
  players: any[];
  teamDashboard: any;
}) {
  const { data: lineup1 } = useLineup(lineup1Id);
  const { data: lineup2 } = useLineup(lineup2Id);

  if (!lineup1 || !lineup2) {
    return <Skeleton className="h-32" />;
  }

  const getLineupStats = (lineup: any) => {
    const playerIds = lineup.playerIds.split(",").map(Number);
    const lineupPlayers = playerIds
      .map((id: number) => teamDashboard?.players?.find((p: any) => p.id === id))
      .filter(Boolean);

    if (lineupPlayers.length === 0) {
      return { ppg: 0, rpg: 0, apg: 0, avgGrade: "N/A" };
    }

    const ppg = lineupPlayers.reduce((acc: number, p: any) => acc + (p.ppg || 0), 0);
    const rpg = lineupPlayers.reduce((acc: number, p: any) => acc + (p.rpg || 0), 0);
    const apg = lineupPlayers.reduce((acc: number, p: any) => acc + (p.apg || 0), 0);
    const avgGradeScore = lineupPlayers.reduce((acc: number, p: any) => acc + gradeToScore(p.avgGrade), 0) / lineupPlayers.length;

    let avgGrade = "C";
    if (avgGradeScore >= 95) avgGrade = "A+";
    else if (avgGradeScore >= 90) avgGrade = "A";
    else if (avgGradeScore >= 85) avgGrade = "A-";
    else if (avgGradeScore >= 80) avgGrade = "B+";
    else if (avgGradeScore >= 75) avgGrade = "B";
    else if (avgGradeScore >= 70) avgGrade = "B-";
    else if (avgGradeScore >= 65) avgGrade = "C+";

    return { ppg: ppg.toFixed(1), rpg: rpg.toFixed(1), apg: apg.toFixed(1), avgGrade };
  };

  const stats1 = getLineupStats(lineup1);
  const stats2 = getLineupStats(lineup2);

  const getPlayersNames = (lineup: any) => {
    const ids = lineup.playerIds.split(",").map(Number);
    return ids.map((id: number) => players.find(p => p.id === id)?.name || "Unknown").join(", ");
  };

  return (
    <div className="grid md:grid-cols-2 gap-4 mt-4" data-testid="lineup-comparison-view">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{lineup1.name || `Lineup #${lineup1.id}`}</CardTitle>
          <CardDescription className="text-xs truncate">{getPlayersNames(lineup1)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-muted-foreground">Combined PPG:</span> <span className="font-medium">{stats1.ppg}</span></div>
            <div><span className="text-muted-foreground">Combined RPG:</span> <span className="font-medium">{stats1.rpg}</span></div>
            <div><span className="text-muted-foreground">Combined APG:</span> <span className="font-medium">{stats1.apg}</span></div>
            <div><span className="text-muted-foreground">Avg Grade:</span> <Badge variant="outline">{stats1.avgGrade}</Badge></div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{lineup2.name || `Lineup #${lineup2.id}`}</CardTitle>
          <CardDescription className="text-xs truncate">{getPlayersNames(lineup2)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-muted-foreground">Combined PPG:</span> <span className="font-medium">{stats2.ppg}</span></div>
            <div><span className="text-muted-foreground">Combined RPG:</span> <span className="font-medium">{stats2.rpg}</span></div>
            <div><span className="text-muted-foreground">Combined APG:</span> <span className="font-medium">{stats2.apg}</span></div>
            <div><span className="text-muted-foreground">Avg Grade:</span> <Badge variant="outline">{stats2.avgGrade}</Badge></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
