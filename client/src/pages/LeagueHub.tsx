import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
  Key,
  Calendar,
  Zap,
} from "lucide-react";
import { GiAmericanFootballBall } from "react-icons/gi";

interface League {
  id: number;
  name: string;
  sport: string;
  description: string | null;
  logoUrl: string | null;
  seasonName: string | null;
  maxTeams: number | null;
  gameFormat: string | null;
  isPublic: boolean;
  joinCode: string | null;
  createdByUserId: string;
  isActive: boolean;
  createdAt: string;
  teamCount?: number;
}

const GAME_FORMAT_LABELS: Record<string, string> = {
  round_robin: "Round Robin",
  single_elimination: "Single Elimination",
  double_elimination: "Double Elimination",
};

function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function LeagueCardSkeleton() {
  return (
    <Card className="border-accent/[0.08] bg-gradient-to-br from-black/60 to-black/30 relative overflow-hidden">
      <div className="absolute inset-x-[10%] top-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Skeleton className="w-14 h-14 rounded-xl skeleton-premium" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-5 w-3/4 skeleton-premium" />
            <Skeleton className="h-4 w-1/2 skeleton-premium" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-5 w-16 rounded-full skeleton-premium" />
              <Skeleton className="h-5 w-20 rounded-full skeleton-premium" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface LeagueCardProps {
  league: League;
  index: number;
}

function LeagueCard({ league, index }: LeagueCardProps) {
  const isBasketball = league.sport === "basketball";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link href={`/leagues/${league.id}`}>
        <Card
          className={cn(
            "group cursor-pointer transition-all duration-300 h-full overflow-hidden relative",
            "bg-gradient-to-br from-black/60 to-black/30 backdrop-blur-sm",
            "hover:scale-[1.02] hover:-translate-y-1 border-white/10",
            "hover:border-accent/30"
          )}
          style={{
            boxShadow: "0 0 30px rgba(234,88,12,0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
          data-testid={`card-league-${league.id}`}
        >
          <div className="absolute inset-x-[10%] top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-xl blur-md opacity-50 group-hover:opacity-80 transition-opacity"
                  style={{ background: isBasketball ? "rgba(249,115,22,0.3)" : "rgba(34,197,94,0.3)" }}
                />
                <div
                  className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center relative z-10 border-2",
                    isBasketball
                      ? "bg-orange-500/20 border-orange-500/30"
                      : "bg-green-500/20 border-green-500/30"
                  )}
                >
                  {isBasketball ? (
                    <Dribbble className="w-7 h-7 text-orange-400" />
                  ) : (
                    <GiAmericanFootballBall className="w-7 h-7 text-green-400" />
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white truncate group-hover:text-accent transition-colors">
                  {league.name}
                </h3>
                {league.seasonName && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                    <Calendar className="w-3.5 h-3.5 text-accent/80" />
                    <span>{league.seasonName}</span>
                  </div>
                )}
                {league.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {league.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border">
              <Badge
                variant="outline"
                className={cn(
                  "text-xs gap-1 py-0.5",
                  isBasketball
                    ? "border-orange-500/30 text-orange-400 bg-orange-500/10"
                    : "border-green-500/30 text-green-400 bg-green-500/10"
                )}
              >
                {isBasketball ? (
                  <Dribbble className="w-3 h-3" />
                ) : (
                  <GiAmericanFootballBall className="w-3 h-3" />
                )}
                {isBasketball ? "Basketball" : "Football"}
              </Badge>

              <Badge variant="outline" className="text-xs gap-1 py-0.5 border-white/10 bg-white/5">
                <Users className="w-3 h-3 text-accent" />
                {league.teamCount ?? 0} / {league.maxTeams ?? 12} Teams
              </Badge>

              {league.gameFormat && (
                <Badge variant="outline" className="text-xs gap-1 py-0.5 border-white/10 bg-white/5">
                  <Trophy className="w-3 h-3 text-accent" />
                  {GAME_FORMAT_LABELS[league.gameFormat] || league.gameFormat}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

export default function LeagueHub() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [sportFilter, setSportFilter] = useState<"all" | "basketball" | "football">("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);

  const [formName, setFormName] = useState("");
  const [formSport, setFormSport] = useState<"basketball" | "football">("basketball");
  const [formDescription, setFormDescription] = useState("");
  const [formSeasonName, setFormSeasonName] = useState("");
  const [formMaxTeams, setFormMaxTeams] = useState(12);
  const [formGameFormat, setFormGameFormat] = useState<"round_robin" | "single_elimination" | "double_elimination">("round_robin");
  const [formIsPublic, setFormIsPublic] = useState(true);

  const [joinCode, setJoinCode] = useState("");

  const { data: leagues = [], isLoading } = useQuery<League[]>({
    queryKey: ["/api/leagues", sportFilter === "all" ? undefined : sportFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (sportFilter !== "all") {
        params.append("sport", sportFilter);
      }
      const url = `/api/leagues${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch leagues");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      sport: string;
      description?: string;
      seasonName?: string;
      maxTeams: number;
      gameFormat: string;
      isPublic: boolean;
      joinCode?: string;
    }) => {
      const res = await apiRequest("POST", "/api/leagues", data);
      return res.json();
    },
    onSuccess: (league) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leagues"] });
      toast({ title: "League created!", description: `${league.name} is ready to go.` });
      setCreateDialogOpen(false);
      resetForm();
      navigate(`/leagues/${league.id}`);
    },
    onError: (err: any) => {
      toast({
        title: "Failed to create league",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const joinMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", "/api/leagues/join", { joinCode: code });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leagues"] });
      toast({ title: "Joined league!", description: "You've successfully joined the league." });
      setJoinDialogOpen(false);
      setJoinCode("");
      if (data.leagueId) {
        navigate(`/leagues/${data.leagueId}`);
      }
    },
    onError: (err: any) => {
      toast({
        title: "Failed to join league",
        description: err.message || "Invalid join code",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormName("");
    setFormSport("basketball");
    setFormDescription("");
    setFormSeasonName("");
    setFormMaxTeams(12);
    setFormGameFormat("round_robin");
    setFormIsPublic(true);
  };

  const handleCreateLeague = () => {
    if (!formName.trim()) {
      toast({ title: "Name required", description: "Please enter a league name", variant: "destructive" });
      return;
    }

    const data: {
      name: string;
      sport: string;
      description?: string;
      seasonName?: string;
      maxTeams: number;
      gameFormat: string;
      isPublic: boolean;
      joinCode?: string;
    } = {
      name: formName.trim(),
      sport: formSport,
      maxTeams: formMaxTeams,
      gameFormat: formGameFormat,
      isPublic: formIsPublic,
    };

    if (formDescription.trim()) {
      data.description = formDescription.trim();
    }
    if (formSeasonName.trim()) {
      data.seasonName = formSeasonName.trim();
    }
    if (!formIsPublic) {
      data.joinCode = generateJoinCode();
    }

    createMutation.mutate(data);
  };

  const handleJoinLeague = () => {
    if (!joinCode.trim()) {
      toast({ title: "Code required", description: "Please enter a join code", variant: "destructive" });
      return;
    }
    joinMutation.mutate(joinCode.trim().toUpperCase());
  };

  const filteredLeagues = leagues;

  return (
    <div className="space-y-6" data-testid="league-hub-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display uppercase tracking-wide bg-gradient-to-b from-white to-accent/20 bg-clip-text text-transparent">
            League Hub
          </h1>
          <p className="text-accent/50 mt-1">Create, join, and manage competitive leagues</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2" data-testid="button-join-league">
                <Key className="w-4 h-4" />
                Join League
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="dialog-join-league">
              <DialogHeader>
                <DialogTitle className="font-display uppercase tracking-wide">Join a League</DialogTitle>
                <DialogDescription>Enter the join code to join a private league.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="join-code">Join Code</Label>
                  <Input
                    id="join-code"
                    placeholder="e.g., ABC123"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={8}
                    data-testid="input-join-code"
                  />
                </div>
                <Button
                  className="w-full gap-2"
                  onClick={handleJoinLeague}
                  disabled={joinMutation.isPending}
                  data-testid="button-submit-join"
                >
                  {joinMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  Join League
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-create-league">
                <Plus className="w-4 h-4" />
                Create League
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg" data-testid="dialog-create-league">
              <DialogHeader>
                <DialogTitle className="font-display uppercase tracking-wide">Create a New League</DialogTitle>
                <DialogDescription>Set up your league and invite teams to compete.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="space-y-2">
                  <Label htmlFor="league-name">League Name *</Label>
                  <Input
                    id="league-name"
                    placeholder="e.g., City Recreation League"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    data-testid="input-league-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="league-sport">Sport</Label>
                  <Select value={formSport} onValueChange={(v) => setFormSport(v as "basketball" | "football")}>
                    <SelectTrigger id="league-sport" data-testid="select-sport">
                      <SelectValue placeholder="Select sport" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basketball">Basketball</SelectItem>
                      <SelectItem value="football">Football</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="league-description">Description</Label>
                  <Textarea
                    id="league-description"
                    placeholder="Describe your league..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={3}
                    data-testid="input-league-description"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="league-season">Season Name</Label>
                  <Input
                    id="league-season"
                    placeholder="e.g., Spring 2025"
                    value={formSeasonName}
                    onChange={(e) => setFormSeasonName(e.target.value)}
                    data-testid="input-season-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="league-max-teams">Max Teams</Label>
                  <Input
                    id="league-max-teams"
                    type="number"
                    min={2}
                    max={64}
                    value={formMaxTeams}
                    onChange={(e) => setFormMaxTeams(Number(e.target.value))}
                    data-testid="input-max-teams"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="league-format">Game Format</Label>
                  <Select
                    value={formGameFormat}
                    onValueChange={(v) =>
                      setFormGameFormat(v as "round_robin" | "single_elimination" | "double_elimination")
                    }
                  >
                    <SelectTrigger id="league-format" data-testid="select-game-format">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="round_robin">Round Robin</SelectItem>
                      <SelectItem value="single_elimination">Single Elimination</SelectItem>
                      <SelectItem value="double_elimination">Double Elimination</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                  <div>
                    <Label htmlFor="league-public" className="text-sm font-medium">
                      Public League
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {formIsPublic
                        ? "Anyone can find and view this league"
                        : "Only players with the join code can access"}
                    </p>
                  </div>
                  <Switch
                    id="league-public"
                    checked={formIsPublic}
                    onCheckedChange={setFormIsPublic}
                    data-testid="switch-is-public"
                  />
                </div>

                <Button
                  className="w-full gap-2"
                  onClick={handleCreateLeague}
                  disabled={createMutation.isPending}
                  data-testid="button-submit-create"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Create League
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-white/10 pb-1">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "relative",
            sportFilter === "all" && "text-accent"
          )}
          onClick={() => setSportFilter("all")}
          data-testid="filter-all"
        >
          All
          {sportFilter === "all" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "relative gap-1.5",
            sportFilter === "basketball" && "text-orange-400"
          )}
          onClick={() => setSportFilter("basketball")}
          data-testid="filter-basketball"
        >
          <Dribbble className="w-4 h-4" />
          Basketball
          {sportFilter === "basketball" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-400 rounded-full" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "relative gap-1.5",
            sportFilter === "football" && "text-green-400"
          )}
          onClick={() => setSportFilter("football")}
          data-testid="filter-football"
        >
          <GiAmericanFootballBall className="w-4 h-4" />
          Football
          {sportFilter === "football" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400 rounded-full" />
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <LeagueCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredLeagues.length === 0 ? (
        <Card className="border-white/10 bg-gradient-to-br from-black/60 to-black/30">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-lg font-display uppercase tracking-wide text-white mb-2">
              No Leagues Yet
            </h3>
            <p className="text-muted-foreground text-sm text-center max-w-md mb-6">
              Be the first to create a league and start building your competitive community!
            </p>
            <Button className="gap-2" onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-league">
              <Plus className="w-4 h-4" />
              Create First League
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeagues.map((league, index) => (
            <LeagueCard key={league.id} league={league} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
