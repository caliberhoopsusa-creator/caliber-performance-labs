import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Plus,
  Users,
  Trophy,
  Dribbble,
  Loader2,
  Calendar,
  MapPin,
  Settings,
  ChevronDown,
  ChevronRight,
  User,
  Medal,
} from "lucide-react";
import { format } from "date-fns";

interface LeagueTeamRoster {
  id: number;
  leagueTeamId: number;
  playerId: number;
  jerseyNumber: number | null;
  position: string | null;
  role: string;
  joinedAt: string;
  player?: {
    id: number;
    name: string;
    position: string;
    photoUrl: string | null;
  };
}

interface LeagueTeam {
  id: number;
  leagueId: number;
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  captainUserId: string | null;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  playoffSeed: number | null;
  isEliminated: boolean;
  createdAt: string;
  roster?: LeagueTeamRoster[];
  captain?: { firstName: string | null; lastName: string | null } | null;
}

interface League {
  id: number;
  name: string;
  sport: string;
  description: string | null;
  logoUrl: string | null;
  seasonName: string | null;
  startDate: string | null;
  endDate: string | null;
  maxTeams: number | null;
  gameFormat: string | null;
  isPublic: boolean;
  joinCode: string | null;
  createdByUserId: string;
  isActive: boolean;
  createdAt: string;
  teams: LeagueTeam[];
}

interface LeagueGame {
  id: number;
  leagueId: number;
  homeTeamId: number;
  awayTeamId: number;
  scheduledDate: string | null;
  location: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  quarter: number | null;
  gameTime: string | null;
  isPlayoff: boolean;
  playoffRound: string | null;
  createdAt: string;
  homeTeam?: LeagueTeam;
  awayTeam?: LeagueTeam;
}

interface CurrentUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  playerId: number | null;
}

const COLOR_PRESETS = [
  "hsl(24, 95%, 53%)", "#FF6B35", "#10B981", "#8B5CF6", "#EF4444", 
  "#C6D0D8", "#EC4899", "#4f6878", "#84CC16", "#6366F1"
];

function LeagueDetailSkeleton() {
  return (
    <div className="space-y-6" data-testid="league-detail-skeleton">
      <div className="space-y-4">
        <Skeleton className="h-10 w-2/3 skeleton-premium" />
        <Skeleton className="h-5 w-1/3 skeleton-premium" />
        <Skeleton className="h-4 w-full skeleton-premium" />
      </div>
      <Skeleton className="h-12 w-full skeleton-premium" />
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 w-full skeleton-premium" />
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status, quarter, gameTime }: { status: string; quarter?: number | null; gameTime?: string | null }) {
  if (status === "live") {
    return (
      <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30 animate-pulse gap-1" data-testid="badge-status-live">
        <span className="w-2 h-2 rounded-full bg-green-400 dark:bg-green-400 animate-pulse" />
        {quarter && gameTime ? `Q${quarter} - ${gameTime}` : "LIVE"}
      </Badge>
    );
  }
  if (status === "final") {
    return (
      <Badge className="bg-accent/20 text-accent border-accent/30" data-testid="badge-status-final">
        Final
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground" data-testid="badge-status-scheduled">
      Scheduled
    </Badge>
  );
}

function StandingsTable({ teams }: { teams: LeagueTeam[] }) {
  const sortedTeams = [...teams].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (a.losses !== b.losses) return a.losses - b.losses;
    return (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst);
  });

  return (
    <div className="rounded-xl border border-accent/[0.08] from-muted/80 to-muted/40 dark:from-black/60 dark:to-black/30 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-accent/80 w-12">#</TableHead>
            <TableHead className="text-accent/80">Team</TableHead>
            <TableHead className="text-accent/80 text-center">W</TableHead>
            <TableHead className="text-accent/80 text-center">L</TableHead>
            <TableHead className="text-accent/80 text-center">T</TableHead>
            <TableHead className="text-accent/80 text-center hidden sm:table-cell">PF</TableHead>
            <TableHead className="text-accent/80 text-center hidden sm:table-cell">PA</TableHead>
            <TableHead className="text-accent/80 text-center hidden md:table-cell">+/-</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTeams.map((team, index) => {
            const isPlayoffTeam = team.playoffSeed !== null && !team.isEliminated;
            const diff = team.pointsFor - team.pointsAgainst;
            return (
              <TableRow
                key={team.id}
                className={cn(
                  "border-accent/[0.05] transition-all",
                  isPlayoffTeam && "bg-accent/[0.03]",
                  isPlayoffTeam && "shadow-[0_0_15px_rgba(234,88,12,0.08)]"
                )}
                data-testid={`row-team-${team.id}`}
              >
                <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: `${team.primaryColor}20`, color: team.primaryColor }}
                    >
                      {team.name.charAt(0)}
                    </div>
                    <div>
                      <span className="font-medium text-white">{team.name}</span>
                      {isPlayoffTeam && (
                        <Badge variant="outline" className="ml-2 text-[10px] py-0 px-1 border-accent/30 text-accent">
                          #{team.playoffSeed}
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center font-medium text-green-600 dark:text-green-400">{team.wins}</TableCell>
                <TableCell className="text-center font-medium text-red-600 dark:text-red-400">{team.losses}</TableCell>
                <TableCell className="text-center text-muted-foreground">{team.ties}</TableCell>
                <TableCell className="text-center hidden sm:table-cell">{team.pointsFor}</TableCell>
                <TableCell className="text-center hidden sm:table-cell">{team.pointsAgainst}</TableCell>
                <TableCell className={cn(
                  "text-center hidden md:table-cell font-medium",
                  diff > 0 ? "text-green-600 dark:text-green-400" : diff < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                )}>
                  {diff > 0 ? `+${diff}` : diff}
                </TableCell>
              </TableRow>
            );
          })}
          {sortedTeams.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No teams in this league yet
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function GameCard({ game, teams, onClick }: { game: LeagueGame; teams: LeagueTeam[]; onClick?: () => void }) {
  const homeTeam = teams.find(t => t.id === game.homeTeamId);
  const awayTeam = teams.find(t => t.id === game.awayTeamId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          "border-accent/[0.08] from-muted/80 to-muted/40 dark:from-black/60 dark:to-black/30 overflow-hidden transition-all",
          game.status === "live" && "border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.15)]",
          onClick && "cursor-pointer hover:border-accent/20 hover:shadow-[0_0_15px_rgba(234,88,12,0.1)]"
        )}
        onClick={onClick}
        data-testid={`card-game-${game.id}`}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 text-accent/70" />
              {game.scheduledDate ? format(new Date(game.scheduledDate), "MMM d, yyyy • h:mm a") : "TBD"}
            </div>
            <StatusBadge status={game.status} quarter={game.quarter} gameTime={game.gameTime} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                style={{ 
                  backgroundColor: homeTeam ? `${homeTeam.primaryColor}20` : '#ffffff10',
                  color: homeTeam?.primaryColor || '#ffffff'
                }}
              >
                {homeTeam?.name.charAt(0) || "?"}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-white truncate">{homeTeam?.name || "TBD"}</p>
                <p className="text-xs text-muted-foreground">Home</p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3">
              {game.status === "final" || game.status === "live" ? (
                <>
                  <span className={cn(
                    "text-xl font-bold",
                    (game.homeScore ?? 0) > (game.awayScore ?? 0) ? "text-accent" : "text-muted-foreground"
                  )}>
                    {game.homeScore ?? 0}
                  </span>
                  <span className="text-muted-foreground">-</span>
                  <span className={cn(
                    "text-xl font-bold",
                    (game.awayScore ?? 0) > (game.homeScore ?? 0) ? "text-accent" : "text-muted-foreground"
                  )}>
                    {game.awayScore ?? 0}
                  </span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground font-medium">VS</span>
              )}
            </div>

            <div className="flex-1 flex items-center gap-3 justify-end">
              <div className="min-w-0 text-right">
                <p className="font-medium text-white truncate">{awayTeam?.name || "TBD"}</p>
                <p className="text-xs text-muted-foreground">Away</p>
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                style={{ 
                  backgroundColor: awayTeam ? `${awayTeam.primaryColor}20` : '#ffffff10',
                  color: awayTeam?.primaryColor || '#ffffff'
                }}
              >
                {awayTeam?.name.charAt(0) || "?"}
              </div>
            </div>
          </div>

          {game.location && (
            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-accent/[0.06] text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 text-accent/70" />
              {game.location}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function TeamCard({ team, isCreator }: { team: LeagueTeam; isCreator: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: roster = [], isLoading: rosterLoading } = useQuery<LeagueTeamRoster[]>({
    queryKey: ["/api/leagues", team.leagueId, "teams", team.id, "roster"],
    queryFn: async () => {
      const res = await fetch(`/api/leagues/${team.leagueId}/teams/${team.id}/roster`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isOpen,
  });

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card
        className={cn(
          "border-accent/[0.08] from-muted/80 to-muted/40 dark:from-black/60 dark:to-black/30 overflow-hidden transition-all",
          isOpen && "border-accent/20"
        )}
        data-testid={`card-team-${team.id}`}
      >
        <CollapsibleTrigger asChild>
          <CardContent className="p-4 cursor-pointer hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg"
                  style={{ backgroundColor: `${team.primaryColor}20`, color: team.primaryColor }}
                >
                  {team.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{team.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{team.wins}-{team.losses}{team.ties > 0 ? `-${team.ties}` : ""}</span>
                    {team.captain && (
                      <>
                        <span className="text-accent/30">•</span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {team.captain.firstName || "Captain"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {team.playoffSeed && !team.isEliminated && (
                  <Badge className="bg-accent/20 text-accent border-accent/30">
                    #{team.playoffSeed} Seed
                  </Badge>
                )}
                {isOpen ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 border-t border-accent/[0.06] pt-4">
            <h4 className="text-sm font-medium text-accent/80 mb-3">Roster</h4>
            {rosterLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-10 w-full skeleton-premium" />
                ))}
              </div>
            ) : roster.length === 0 ? (
              <p className="text-sm text-muted-foreground">No players on this roster yet</p>
            ) : (
              <div className="space-y-2">
                {roster.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-accent/[0.05]"
                    data-testid={`roster-member-${member.id}`}
                  >
                    <div className="flex items-center gap-3">
                      {member.jerseyNumber && (
                        <span className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center text-sm font-bold text-accent">
                          #{member.jerseyNumber}
                        </span>
                      )}
                      <div>
                        <Link href={`/players/${member.playerId}`}>
                          <span className="font-medium text-white hover:text-accent transition-colors cursor-pointer">
                            {member.player?.name || `Player #${member.playerId}`}
                          </span>
                        </Link>
                        {member.role === "captain" && (
                          <Badge variant="outline" className="ml-2 text-[10px] py-0 px-1 border-yellow-500/30 text-yellow-600 dark:text-yellow-400">
                            Captain
                          </Badge>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {member.position || member.player?.position || "-"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function CreateTeamDialog({ 
  leagueId, 
  open, 
  onOpenChange 
}: { 
  leagueId: number; 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("hsl(24, 95%, 53%)");

  const createTeamMutation = useMutation({
    mutationFn: async (data: { name: string; primaryColor: string }) => {
      const res = await apiRequest("POST", `/api/leagues/${leagueId}/teams`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leagues", leagueId] });
      toast({ title: "Team created!", description: "Your team has been added to the league." });
      onOpenChange(false);
      setName("");
      setPrimaryColor("hsl(24, 95%, 53%)");
    },
    onError: (err: any) => {
      toast({
        title: "Failed to create team",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({ title: "Name required", description: "Please enter a team name", variant: "destructive" });
      return;
    }
    createTeamMutation.mutate({ name: name.trim(), primaryColor });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-create-team">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wide">Create a Team</DialogTitle>
          <DialogDescription>
            Create your team and become the captain. You can add players later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="team-name">Team Name *</Label>
            <Input
              id="team-name"
              placeholder="e.g., The Warriors"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="input-team-name"
            />
          </div>
          <div className="space-y-2">
            <Label>Team Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    "w-8 h-8 rounded-lg border-2 transition-all",
                    primaryColor === color ? "border-white scale-110" : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => setPrimaryColor(color)}
                  data-testid={`color-${color.replace("#", "")}`}
                />
              ))}
            </div>
            <Input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-10 w-full cursor-pointer"
              data-testid="input-color-picker"
            />
          </div>
          <Button
            className="w-full gap-2"
            onClick={handleSubmit}
            disabled={createTeamMutation.isPending}
            data-testid="button-submit-team"
          >
            {createTeamMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Create Team
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UpdateGameModal({
  leagueId,
  game,
  teams,
  sport,
  open,
  onOpenChange,
}: {
  leagueId: number;
  game: LeagueGame;
  teams: LeagueTeam[];
  sport: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [homeScore, setHomeScore] = useState<string>(game.homeScore?.toString() ?? "");
  const [awayScore, setAwayScore] = useState<string>(game.awayScore?.toString() ?? "");
  const [status, setStatus] = useState<string>(game.status);
  const [quarter, setQuarter] = useState<string>(game.quarter?.toString() ?? "1");
  const [gameTime, setGameTime] = useState<string>(game.gameTime ?? "12:00");

  const homeTeam = teams.find(t => t.id === game.homeTeamId);
  const awayTeam = teams.find(t => t.id === game.awayTeamId);

  const updateGameMutation = useMutation({
    mutationFn: async (data: { homeScore?: number; awayScore?: number; status: string; quarter?: number; gameTime?: string }) => {
      const res = await apiRequest("PUT", `/api/leagues/${leagueId}/games/${game.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leagues", leagueId, "games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leagues", leagueId] });
      toast({ title: "Game updated!", description: "The game has been updated successfully." });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({
        title: "Failed to update game",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const finalizeGameMutation = useMutation({
    mutationFn: async (data: { homeScore: number; awayScore: number }) => {
      const res = await apiRequest("PUT", `/api/leagues/${leagueId}/games/${game.id}/finalize`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leagues", leagueId, "games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leagues", leagueId] });
      toast({ title: "Game finalized!", description: "Team standings have been updated." });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({
        title: "Failed to finalize game",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    const parsedHomeScore = homeScore !== "" ? parseInt(homeScore) : undefined;
    const parsedAwayScore = awayScore !== "" ? parseInt(awayScore) : undefined;

    if (status === "live" || status === "final") {
      if (parsedHomeScore === undefined || parsedAwayScore === undefined || isNaN(parsedHomeScore) || isNaN(parsedAwayScore)) {
        toast({
          title: "Scores required",
          description: "Please enter valid scores for live or final games",
          variant: "destructive",
        });
        return;
      }
      if (parsedHomeScore < 0 || parsedAwayScore < 0) {
        toast({
          title: "Invalid scores",
          description: "Scores cannot be negative",
          variant: "destructive",
        });
        return;
      }
    }

    if (status === "final") {
      finalizeGameMutation.mutate({
        homeScore: parsedHomeScore!,
        awayScore: parsedAwayScore!,
      });
    } else {
      updateGameMutation.mutate({
        homeScore: parsedHomeScore,
        awayScore: parsedAwayScore,
        status,
        quarter: status === "live" ? parseInt(quarter) : undefined,
        gameTime: status === "live" ? gameTime : undefined,
      });
    }
  };

  const isPending = updateGameMutation.isPending || finalizeGameMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-update-game">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wide">Update Game</DialogTitle>
          <DialogDescription>
            Update scores, status, and game details
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.02] border border-border">
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
                style={{
                  backgroundColor: homeTeam ? `${homeTeam.primaryColor}20` : '#ffffff10',
                  color: homeTeam?.primaryColor || '#ffffff'
                }}
              >
                {homeTeam?.name.charAt(0) || "?"}
              </div>
              <span className="font-medium text-white">{homeTeam?.name || "Home"}</span>
            </div>
            <span className="text-muted-foreground">vs</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">{awayTeam?.name || "Away"}</span>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
                style={{
                  backgroundColor: awayTeam ? `${awayTeam.primaryColor}20` : '#ffffff10',
                  color: awayTeam?.primaryColor || '#ffffff'
                }}
              >
                {awayTeam?.name.charAt(0) || "?"}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Game Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger data-testid="select-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="final">Final</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(status === "live" || status === "final") && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="home-score">{homeTeam?.name || "Home"} Score *</Label>
                <Input
                  id="home-score"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={homeScore}
                  onChange={(e) => setHomeScore(e.target.value)}
                  data-testid="input-home-score"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="away-score">{awayTeam?.name || "Away"} Score *</Label>
                <Input
                  id="away-score"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={awayScore}
                  onChange={(e) => setAwayScore(e.target.value)}
                  data-testid="input-away-score"
                />
              </div>
            </div>
          )}

          {status === "live" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quarter">{sport === "basketball" ? "Quarter" : "Quarter"}</Label>
                <Select value={quarter} onValueChange={setQuarter}>
                  <SelectTrigger id="quarter" data-testid="select-quarter">
                    <SelectValue placeholder="Select quarter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1st Quarter</SelectItem>
                    <SelectItem value="2">2nd Quarter</SelectItem>
                    <SelectItem value="3">3rd Quarter</SelectItem>
                    <SelectItem value="4">4th Quarter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="game-time">Time Remaining</Label>
                <Input
                  id="game-time"
                  type="text"
                  placeholder="12:00"
                  value={gameTime}
                  onChange={(e) => setGameTime(e.target.value)}
                  data-testid="input-game-time"
                />
              </div>
            </div>
          )}

          {status === "final" && (
            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
              <p className="text-sm text-accent">
                Setting to "Final" will update team standings (wins, losses, points for/against).
              </p>
            </div>
          )}

          <Button
            className="w-full gap-2"
            onClick={handleSubmit}
            disabled={isPending}
            data-testid="button-submit-update"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : status === "final" ? (
              <Trophy className="w-4 h-4" />
            ) : (
              <Calendar className="w-4 h-4" />
            )}
            {status === "final" ? "Finalize Game" : "Update Game"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PlayoffBracket({ 
  leagueId,
  teams, 
  games, 
  isCreator, 
  gamesLoading 
}: { 
  leagueId: number;
  teams: LeagueTeam[]; 
  games: LeagueGame[]; 
  isCreator: boolean;
  gamesLoading: boolean;
}) {
  const { toast } = useToast();
  const playoffGames = games.filter(g => g.isPlayoff);
  const hasPlayoffs = playoffGames.length > 0;

  const startPlayoffsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/leagues/${leagueId}/start-playoffs`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leagues", leagueId, "games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leagues", leagueId] });
      toast({ title: "Playoffs started!", description: "The playoff bracket has been created." });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to start playoffs",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  if (gamesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full skeleton-premium" />
      </div>
    );
  }

  if (teams.length < 4) {
    return (
      <Card className="border-border from-muted/80 to-muted/40 dark:from-black/60 dark:to-black/30">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="w-12 h-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground text-center">Need at least 4 teams for playoffs</p>
          <p className="text-sm text-muted-foreground/60 mt-2">Currently {teams.length} team{teams.length !== 1 ? 's' : ''} in the league</p>
        </CardContent>
      </Card>
    );
  }

  if (!hasPlayoffs) {
    return (
      <Card className="border-border from-muted/80 to-muted/40 dark:from-black/60 dark:to-black/30">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Trophy className="w-12 h-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">Playoffs not started yet</p>
          {isCreator && (
            <Button 
              className="mt-4 gap-2" 
              onClick={() => startPlayoffsMutation.mutate()}
              disabled={startPlayoffsMutation.isPending}
              data-testid="button-start-playoffs"
            >
              {startPlayoffsMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Medal className="w-4 h-4" />
              )}
              Start Playoffs
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Organize games by round
  const quarterfinals = playoffGames.filter(g => g.playoffRound === "quarterfinals");
  const semifinals = playoffGames.filter(g => g.playoffRound === "semifinals");
  const championship = playoffGames.filter(g => g.playoffRound === "championship");
  const hasQuarterfinals = quarterfinals.length > 0;

  const getTeam = (teamId: number) => teams.find(t => t.id === teamId);

  const BracketMatchup = ({ game, roundIndex }: { game: LeagueGame; roundIndex: number }) => {
    const homeTeam = getTeam(game.homeTeamId);
    const awayTeam = getTeam(game.awayTeamId);
    const isPlaceholder = game.homeTeamId === game.awayTeamId;
    const isFinal = game.status === "final";
    const homeWon = isFinal && (game.homeScore ?? 0) > (game.awayScore ?? 0);
    const awayWon = isFinal && (game.awayScore ?? 0) > (game.homeScore ?? 0);

    return (
      <div 
        className="relative"
        data-testid={`bracket-game-${game.id}`}
      >
        <Card className={cn(
          "border-accent/[0.08] from-muted/80 to-muted/40 dark:from-black/60 dark:to-black/30 overflow-hidden w-48",
          isFinal && "border-accent/20"
        )}>
          <CardContent className="p-0">
            <div className={cn(
              "flex items-center justify-between p-2 border-b border-accent/[0.06] transition-all",
              homeWon && "bg-accent/10 shadow-[0_0_15px_rgba(234,88,12,0.15)]"
            )}>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {!isPlaceholder && homeTeam?.playoffSeed && (
                  <span className="text-xs font-bold text-accent/70 w-4 flex-shrink-0">
                    {homeTeam.playoffSeed}
                  </span>
                )}
                <div
                  className="w-6 h-6 rounded flex items-center justify-center font-bold text-[10px] flex-shrink-0"
                  style={{ 
                    backgroundColor: homeTeam && !isPlaceholder ? `${homeTeam.primaryColor}20` : '#ffffff10',
                    color: homeTeam?.primaryColor || '#ffffff40'
                  }}
                >
                  {isPlaceholder ? "?" : homeTeam?.name.charAt(0) || "?"}
                </div>
                <span className={cn(
                  "text-sm truncate",
                  isPlaceholder ? "text-muted-foreground/50" : "text-white",
                  homeWon && "font-semibold text-accent"
                )}>
                  {isPlaceholder ? "TBD" : homeTeam?.name || "TBD"}
                </span>
              </div>
              {isFinal && (
                <span className={cn(
                  "text-sm font-bold ml-2",
                  homeWon ? "text-accent" : "text-muted-foreground"
                )}>
                  {game.homeScore}
                </span>
              )}
            </div>
            <div className={cn(
              "flex items-center justify-between p-2 transition-all",
              awayWon && "bg-accent/10 shadow-[0_0_15px_rgba(234,88,12,0.15)]"
            )}>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {!isPlaceholder && awayTeam?.playoffSeed && (
                  <span className="text-xs font-bold text-accent/70 w-4 flex-shrink-0">
                    {awayTeam.playoffSeed}
                  </span>
                )}
                <div
                  className="w-6 h-6 rounded flex items-center justify-center font-bold text-[10px] flex-shrink-0"
                  style={{ 
                    backgroundColor: awayTeam && !isPlaceholder ? `${awayTeam.primaryColor}20` : '#ffffff10',
                    color: awayTeam?.primaryColor || '#ffffff40'
                  }}
                >
                  {isPlaceholder ? "?" : awayTeam?.name.charAt(0) || "?"}
                </div>
                <span className={cn(
                  "text-sm truncate",
                  isPlaceholder ? "text-muted-foreground/50" : "text-white",
                  awayWon && "font-semibold text-accent"
                )}>
                  {isPlaceholder ? "TBD" : awayTeam?.name || "TBD"}
                </span>
              </div>
              {isFinal && (
                <span className={cn(
                  "text-sm font-bold ml-2",
                  awayWon ? "text-accent" : "text-muted-foreground"
                )}>
                  {game.awayScore}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-accent" />
        <h3 className="font-display text-lg uppercase tracking-wide text-white">Playoff Bracket</h3>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex items-start gap-8 min-w-max">
          {hasQuarterfinals && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-accent/80 uppercase tracking-wider mb-3">Quarterfinals</h4>
              <div className="flex flex-col gap-6">
                {quarterfinals.map((game, idx) => (
                  <div key={game.id} className="relative">
                    <BracketMatchup game={game} roundIndex={0} />
                    <div className="absolute top-1/2 -right-8 w-8 h-px bg-accent/20" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-xs font-medium text-accent/80 uppercase tracking-wider mb-3">Semifinals</h4>
            <div className="flex flex-col gap-6" style={{ marginTop: hasQuarterfinals ? '2.5rem' : 0 }}>
              {semifinals.map((game, idx) => (
                <div key={game.id} className="relative" style={{ marginTop: idx > 0 && hasQuarterfinals ? '5rem' : 0 }}>
                  {hasQuarterfinals && (
                    <div className="absolute top-1/2 -left-8 w-8 h-px bg-accent/20" />
                  )}
                  <BracketMatchup game={game} roundIndex={1} />
                  <div className="absolute top-1/2 -right-8 w-8 h-px bg-accent/20" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-medium text-accent/80 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              Championship
            </h4>
            <div className="flex flex-col gap-6" style={{ marginTop: hasQuarterfinals ? '5rem' : '2.5rem' }}>
              {championship.map((game) => (
                <div key={game.id} className="relative">
                  <div className="absolute top-1/2 -left-8 w-8 h-px bg-accent/20" />
                  <BracketMatchup game={game} roundIndex={2} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {championship.length > 0 && championship[0].status === "final" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 p-6 rounded-xl from-accent/10 border border-accent/20 text-center"
        >
          <Trophy className="w-12 h-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-3" />
          <h3 className="font-display text-xl uppercase tracking-wide text-white mb-2">Champion</h3>
          {(() => {
            const game = championship[0];
            const winnerId = (game.homeScore ?? 0) > (game.awayScore ?? 0) ? game.homeTeamId : game.awayTeamId;
            const winner = getTeam(winnerId);
            return (
              <div className="flex items-center justify-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg"
                  style={{ backgroundColor: `${winner?.primaryColor}30`, color: winner?.primaryColor }}
                >
                  {winner?.name.charAt(0)}
                </div>
                <span className="text-2xl font-bold text-accent">{winner?.name}</span>
              </div>
            );
          })()}
        </motion.div>
      )}
    </div>
  );
}

function AddGameDialog({ 
  leagueId, 
  teams,
  open, 
  onOpenChange 
}: { 
  leagueId: number;
  teams: LeagueTeam[];
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
}) {
  const { toast } = useToast();
  const [homeTeamId, setHomeTeamId] = useState<string>("");
  const [awayTeamId, setAwayTeamId] = useState<string>("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [location, setLocation] = useState("");

  const createGameMutation = useMutation({
    mutationFn: async (data: { homeTeamId: number; awayTeamId: number; scheduledDate?: string; location?: string }) => {
      const res = await apiRequest("POST", `/api/leagues/${leagueId}/games`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leagues", leagueId, "games"] });
      toast({ title: "Game scheduled!", description: "The game has been added to the schedule." });
      onOpenChange(false);
      setHomeTeamId("");
      setAwayTeamId("");
      setScheduledDate("");
      setLocation("");
    },
    onError: (err: any) => {
      toast({
        title: "Failed to schedule game",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!homeTeamId || !awayTeamId) {
      toast({ title: "Teams required", description: "Please select both home and away teams", variant: "destructive" });
      return;
    }
    if (homeTeamId === awayTeamId) {
      toast({ title: "Invalid selection", description: "Home and away teams must be different", variant: "destructive" });
      return;
    }
    createGameMutation.mutate({
      homeTeamId: parseInt(homeTeamId),
      awayTeamId: parseInt(awayTeamId),
      scheduledDate: scheduledDate || undefined,
      location: location.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-add-game">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wide">Schedule a Game</DialogTitle>
          <DialogDescription>
            Add a new game to the league schedule.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="home-team">Home Team *</Label>
            <Select value={homeTeamId} onValueChange={setHomeTeamId}>
              <SelectTrigger id="home-team" data-testid="select-home-team">
                <SelectValue placeholder="Select home team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id.toString()}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="away-team">Away Team *</Label>
            <Select value={awayTeamId} onValueChange={setAwayTeamId}>
              <SelectTrigger id="away-team" data-testid="select-away-team">
                <SelectValue placeholder="Select away team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id.toString()}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="scheduled-date">Date & Time</Label>
            <Input
              id="scheduled-date"
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              data-testid="input-scheduled-date"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., City Gymnasium"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              data-testid="input-location"
            />
          </div>
          <Button
            className="w-full gap-2"
            onClick={handleSubmit}
            disabled={createGameMutation.isPending}
            data-testid="button-submit-game"
          >
            {createGameMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Schedule Game
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function LeagueDetail() {
  const [, params] = useRoute("/leagues/:id");
  const leagueId = params?.id ? parseInt(params.id) : null;

  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [addGameOpen, setAddGameOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("standings");
  const [selectedGame, setSelectedGame] = useState<LeagueGame | null>(null);
  const [updateGameOpen, setUpdateGameOpen] = useState(false);

  const { data: currentUser } = useQuery<CurrentUser | null>({
    queryKey: ["/api/users/me"],
    retry: false,
  });

  const { data: league, isLoading: leagueLoading } = useQuery<League>({
    queryKey: ["/api/leagues", leagueId],
    queryFn: async () => {
      const res = await fetch(`/api/leagues/${leagueId}`);
      if (!res.ok) throw new Error("Failed to fetch league");
      return res.json();
    },
    enabled: !!leagueId,
  });

  const { data: games = [], isLoading: gamesLoading } = useQuery<LeagueGame[]>({
    queryKey: ["/api/leagues", leagueId, "games"],
    queryFn: async () => {
      const res = await fetch(`/api/leagues/${leagueId}/games`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!leagueId,
  });

  if (!leagueId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Invalid league ID</p>
      </div>
    );
  }

  if (leagueLoading) {
    return <LeagueDetailSkeleton />;
  }

  if (!league) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Trophy className="w-16 h-16 text-muted-foreground/50" />
        <p className="text-muted-foreground">League not found</p>
        <Link href="/leagues">
          <Button variant="outline">Back to Leagues</Button>
        </Link>
      </div>
    );
  }

  const isCreator = currentUser?.id === league.createdByUserId;
  const isAuthenticated = !!currentUser;
  const isBasketball = league.sport === "basketball";

  const sortedGames = [...games].sort((a, b) => {
    if (!a.scheduledDate && !b.scheduledDate) return 0;
    if (!a.scheduledDate) return 1;
    if (!b.scheduledDate) return -1;
    return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
  });

  return (
    <div className="space-y-6" data-testid="league-detail-page">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center border-2",
                "bg-accent/20 border-accent/30"
              )}
            >
              <Dribbble className="w-8 h-8 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-display uppercase tracking-wide from-white to-accent/20">
                {league.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs gap-1",
                    isBasketball
                      ? "border-accent/30 text-accent bg-accent/10"
                      : "border-green-500/30 text-green-600 dark:text-green-400 bg-green-500/10"
                  )}
                >
                  <Dribbble className="w-3 h-3" />
                  Basketball
                </Badge>
                {league.seasonName && (
                  <Badge variant="outline" className="text-xs gap-1 border-accent/20 text-accent/80 bg-accent/10">
                    <Calendar className="w-3 h-3" />
                    {league.seasonName}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs gap-1 border-border bg-white/5">
                  <Users className="w-3 h-3 text-accent" />
                  {league.teams.length} / {league.maxTeams ?? 12}
                </Badge>
              </div>
              {league.description && (
                <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{league.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isCreator && (
              <Link href={`/leagues/${leagueId}/manage`}>
                <Button variant="outline" className="gap-2" data-testid="button-manage-league">
                  <Settings className="w-4 h-4" />
                  Manage
                </Button>
              </Link>
            )}
            {isAuthenticated && (
              <Button className="gap-2" onClick={() => setCreateTeamOpen(true)} data-testid="button-create-team">
                <Plus className="w-4 h-4" />
                Create Team
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="standings" className="gap-2" data-testid="tab-standings">
            <Trophy className="w-4 h-4" />
            Standings
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-2" data-testid="tab-schedule">
            <Calendar className="w-4 h-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="teams" className="gap-2" data-testid="tab-teams">
            <Users className="w-4 h-4" />
            Teams
          </TabsTrigger>
          <TabsTrigger value="bracket" className="gap-2" data-testid="tab-bracket">
            <Medal className="w-4 h-4" />
            Bracket
          </TabsTrigger>
        </TabsList>

        <TabsContent value="standings" className="mt-4">
          <StandingsTable teams={league.teams} />
        </TabsContent>

        <TabsContent value="schedule" className="mt-4 space-y-4">
          {isCreator && (
            <div className="flex justify-end">
              <Button variant="outline" className="gap-2" onClick={() => setAddGameOpen(true)} data-testid="button-add-game">
                <Plus className="w-4 h-4" />
                Add Game
              </Button>
            </div>
          )}
          {gamesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32 w-full skeleton-premium" />
              ))}
            </div>
          ) : sortedGames.length === 0 ? (
            <Card className="border-border from-muted/80 to-muted/40 dark:from-black/60 dark:to-black/30">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No games scheduled yet</p>
                {isCreator && (
                  <Button variant="outline" className="mt-4 gap-2" onClick={() => setAddGameOpen(true)}>
                    <Plus className="w-4 h-4" />
                    Schedule First Game
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sortedGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  teams={league.teams}
                  onClick={isCreator ? () => {
                    setSelectedGame(game);
                    setUpdateGameOpen(true);
                  } : undefined}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="teams" className="mt-4">
          {league.teams.length === 0 ? (
            <Card className="border-border from-muted/80 to-muted/40 dark:from-black/60 dark:to-black/30">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-12 h-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No teams in this league yet</p>
                {isAuthenticated && (
                  <Button className="mt-4 gap-2" onClick={() => setCreateTeamOpen(true)}>
                    <Plus className="w-4 h-4" />
                    Create First Team
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {league.teams.map((team) => (
                <TeamCard key={team.id} team={team} isCreator={isCreator} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bracket" className="mt-4">
          <PlayoffBracket 
            leagueId={leagueId}
            teams={league.teams}
            games={games}
            isCreator={isCreator}
            gamesLoading={gamesLoading}
          />
        </TabsContent>
      </Tabs>

      <CreateTeamDialog leagueId={leagueId} open={createTeamOpen} onOpenChange={setCreateTeamOpen} />
      <AddGameDialog leagueId={leagueId} teams={league.teams} open={addGameOpen} onOpenChange={setAddGameOpen} />
      {selectedGame && (
        <UpdateGameModal
          leagueId={leagueId}
          game={selectedGame}
          teams={league.teams}
          sport={league.sport}
          open={updateGameOpen}
          onOpenChange={(open) => {
            setUpdateGameOpen(open);
            if (!open) setSelectedGame(null);
          }}
        />
      )}
    </div>
  );
}
