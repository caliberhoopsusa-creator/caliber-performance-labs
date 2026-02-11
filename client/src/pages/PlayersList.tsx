import { useState, useEffect, useMemo } from "react";
import { usePlayers, useCreatePlayer, useDeletePlayer } from "@/hooks/use-basketball";
import { Link } from "wouter";
import { Search, Plus, UserPlus, Trash2, ChevronRight, MoreVertical, Pencil, Eye, Users, Copy, Check, Send, Filter, Star, Zap, Crown, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertPlayerSchema } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SkeletonPlayerCard } from "@/components/ui/skeleton-premium";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: number;
  teamId: number;
  playerId: number | null;
  displayName: string;
  sessionId: string;
  role: string;
  joinedAt: string;
}

interface Team {
  id: number;
  name: string;
  code: string;
  createdBy: string;
  memberCount?: number;
}

const POSITIONS = ["All", "Guard", "Forward", "Center"] as const;

function getSessionId(): string {
  let sessionId = localStorage.getItem("caliber_session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("caliber_session_id", sessionId);
  }
  return sessionId;
}

function getPlayerTier(player: any): "elite" | "pro" | "rising" | "rookie" {
  const gamesPlayed = player.gamesPlayed || 0;
  if (gamesPlayed >= 50) return "elite";
  if (gamesPlayed >= 20) return "pro";
  if (gamesPlayed >= 5) return "rising";
  return "rookie";
}

const TIER_STYLES = {
  elite: {
    border: "border-yellow-500/40 hover:border-yellow-400/60",
    glow: "0 0 30px rgba(234, 179, 8, 0.3)",
    badge: "bg-gradient-to-r from-yellow-600 to-yellow-500 text-black",
    icon: Crown,
    label: "Elite",
  },
  pro: {
    border: "border-purple-500/40 hover:border-purple-400/60",
    glow: "0 0 25px rgba(168, 85, 247, 0.25)",
    badge: "bg-gradient-to-r from-purple-600 to-purple-500 text-white",
    icon: Star,
    label: "Pro",
  },
  rising: {
    border: "border-accent/40 hover:border-accent/60",
    glow: "0 0 20px rgba(234, 88, 12, 0.2)",
    badge: "bg-accent text-white",
    icon: Zap,
    label: "Rising",
  },
  rookie: {
    border: "border-white/10 hover:border-accent/30",
    glow: "none",
    badge: "bg-white/10 text-white/70",
    icon: UserPlus,
    label: "Rookie",
  },
};

export default function PlayersList() {
  const { data: players, isLoading: playersLoading } = usePlayers();
  const { mutate: deletePlayer, isPending: isDeleting } = useDeletePlayer();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState<string>("All");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<{ id: number; name: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const sessionId = getSessionId();

  const { data: myTeams = [], isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/my-teams", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/my-teams?sessionId=${sessionId}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const primaryTeam = myTeams[0];

  const { data: teamMembers = [], isLoading: membersLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/teams", primaryTeam?.id, "members"],
    queryFn: async () => {
      if (!primaryTeam?.id) return [];
      const res = await fetch(`/api/teams/${primaryTeam.id}/members`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!primaryTeam?.id,
  });

  const rosterPlayerIds = teamMembers.filter(m => m.playerId).map(m => m.playerId);
  const rosterPlayers = players?.filter(p => rosterPlayerIds.includes(p.id)) || [];

  const handleDeletePlayer = (playerId: number, playerName: string) => {
    deletePlayer(playerId, {
      onSuccess: () => {
        toast({
          title: "Player Removed",
          description: `${playerName} has been removed from your roster.`,
        });
        setPlayerToDelete(null);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to delete player. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  const copyTeamCode = () => {
    if (primaryTeam?.code) {
      navigator.clipboard.writeText(primaryTeam.code);
      setCopiedCode(true);
      toast({
        title: "Code Copied",
        description: "Share this code with your players to invite them.",
      });
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const filterPlayers = (playerList: any[]) => {
    return playerList.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.team?.toLowerCase().includes(search.toLowerCase());
      const matchesPosition = positionFilter === "All" || p.position === positionFilter;
      return matchesSearch && matchesPosition;
    });
  };

  const filteredRosterPlayers = filterPlayers(rosterPlayers);
  const filteredAllPlayers = filterPlayers(players || []);

  const isLoading = playersLoading || teamsLoading || membersLoading;
  const hasTeam = myTeams.length > 0;
  const hasActiveFilters = positionFilter !== "All" || search.length > 0;

  const clearFilters = () => {
    setSearch("");
    setPositionFilter("All");
  };

  return (
    <div className="pb-24 md:pb-6 space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-black/60 via-card to-black/60 border border-accent/20">
        <div className="absolute inset-0 opacity-30" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full" />
        
        <div className="relative z-10 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-accent" style={{ filter: "drop-shadow(0 0 8px hsl(24, 95%, 53%))" }} />
                <span className="text-xs uppercase tracking-wider text-accent font-semibold">
                  {hasTeam ? primaryTeam?.name : "Team Management"}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">
                <span className="bg-gradient-to-r from-white via-accent to-accent bg-clip-text text-transparent">
                  Player Roster
                </span>
              </h1>
              <p className="text-muted-foreground max-w-md">
                {hasTeam ? "Manage your team roster and track player performance" : "Search and manage players across all teams"}
              </p>
            </div>
            
            <div className="flex flex-col items-start md:items-end gap-3">
              <div className="flex items-center gap-3">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="gap-2 bg-gradient-to-r from-accent to-blue-600 text-white shadow-lg"
                      style={{ boxShadow: "0 4px 20px rgba(234, 88, 12, 0.3)" }}
                      data-testid="button-add-player"
                    >
                      <Plus className="w-4 h-4" />
                      Add Player
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-white/10 text-white max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-display">Add New Player</DialogTitle>
                      <DialogDescription className="text-muted-foreground">
                        Create a player profile to start tracking stats and performance.
                      </DialogDescription>
                    </DialogHeader>
                    <CreatePlayerForm onSuccess={() => setIsDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
                
                {hasTeam && (
                  <Button 
                    variant="outline" 
                    onClick={copyTeamCode} 
                    className="gap-2 border-accent/30 text-accent hover:bg-accent/10 hover:border-accent/50" 
                    data-testid="button-copy-code"
                  >
                    {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedCode ? "Copied!" : `Code: ${primaryTeam?.code}`}
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20">
                  <Users className="w-4 h-4 text-accent" />
                  <span className="text-accent font-medium">
                    {hasTeam ? rosterPlayers.length : players?.length || 0}
                  </span>
                  <span>players</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
              <Filter className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Search & Filter</h2>
              <p className="text-xs text-muted-foreground">Find players quickly</p>
            </div>
          </div>
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="gap-1.5 text-muted-foreground hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
              Clear Filters
            </Button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search players by name or team..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-black/20 border-white/10 focus:border-accent/50"
              data-testid="input-search-players"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {POSITIONS.map((position) => (
              <Button
                key={position}
                size="sm"
                variant={positionFilter === position ? "default" : "outline"}
                onClick={() => setPositionFilter(position)}
                className={cn(
                  "capitalize transition-all",
                  positionFilter === position 
                    ? "bg-accent text-white border-transparent"
                    : "border-white/10 hover:border-accent/30"
                )}
                data-testid={`filter-position-${position.toLowerCase()}`}
              >
                {position}
              </Button>
            ))}
          </div>
        </div>

        {hasActiveFilters && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 flex-wrap"
          >
            <span className="text-xs text-muted-foreground">Active filters:</span>
            {search && (
              <Badge variant="outline" className="gap-1.5 border-accent/30 text-accent">
                Search: "{search}"
                <button onClick={() => setSearch("")} className="ml-1 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {positionFilter !== "All" && (
              <Badge variant="outline" className="gap-1.5 border-accent/30 text-accent">
                Position: {positionFilter}
                <button onClick={() => setPositionFilter("All")} className="ml-1 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
          </motion.div>
        )}
      </div>

      {hasTeam ? (
        <Tabs defaultValue="roster" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-6 bg-black/40 border border-white/10 p-1 rounded-xl" data-testid="tabs-roster">
            <TabsTrigger 
              value="roster" 
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent/20 data-[state=active]:to-accent/10 data-[state=active]:border-accent/30 data-[state=active]:text-accent rounded-lg transition-all" 
              data-testid="tab-roster"
            >
              <Users className="w-4 h-4" />
              My Roster ({rosterPlayers.length})
            </TabsTrigger>
            <TabsTrigger 
              value="find" 
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent/20 data-[state=active]:to-accent/10 data-[state=active]:border-accent/30 data-[state=active]:text-accent rounded-lg transition-all" 
              data-testid="tab-find"
            >
              <Search className="w-4 h-4" />
              Find Players
            </TabsTrigger>
          </TabsList>

          <TabsContent value="roster">
            <div className="space-y-6">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <SkeletonPlayerCard key={i} />
                  ))}
                </div>
              ) : filteredRosterPlayers.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No players on your roster"
                  description={
                    search || positionFilter !== "All"
                      ? "Try adjusting your search or filter criteria."
                      : `Share your team code ${primaryTeam?.code} with players to invite them, or search for players to add.`
                  }
                  action={
                    search || positionFilter !== "All" ? (
                      <Button onClick={clearFilters} variant="default" className="gap-2">
                        <X className="w-4 h-4" />
                        Clear Filters
                      </Button>
                    ) : (
                      <Button onClick={copyTeamCode} variant="default" className="gap-2 bg-accent">
                        <Copy className="w-4 h-4" />
                        Copy Invite Code
                      </Button>
                    )
                  }
                />
              ) : (
                <PlayerGrid 
                  players={filteredRosterPlayers}
                  navigate={navigate}
                  setPlayerToDelete={setPlayerToDelete}
                  showInvite={false}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="find">
            <div className="space-y-6">
              <Card className="p-4 bg-gradient-to-r from-accent/10 to-accent/5 border-accent/20 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/20 border border-accent/30">
                    <Send className="w-5 h-5 text-accent" style={{ filter: "drop-shadow(0 0 6px hsl(24, 95%, 53%))" }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">Invite players to your team</p>
                    <p className="text-xs text-muted-foreground">Share your team code: <span className="text-accent font-bold">{primaryTeam?.code}</span></p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={copyTeamCode} 
                    className="gap-1.5 border-accent/30 text-accent hover:bg-accent/10"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy
                  </Button>
                </div>
              </Card>

              {playersLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <SkeletonPlayerCard key={i} />
                  ))}
                </div>
              ) : filteredAllPlayers.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title="No players found"
                  description="Try adjusting your search or filter criteria."
                  action={
                    hasActiveFilters ? (
                      <Button onClick={clearFilters} variant="default" className="gap-2">
                        <X className="w-4 h-4" />
                        Clear Filters
                      </Button>
                    ) : null
                  }
                />
              ) : (
                <PlayerGrid 
                  players={filteredAllPlayers}
                  navigate={navigate}
                  setPlayerToDelete={setPlayerToDelete}
                  showInvite={true}
                  rosterPlayerIds={rosterPlayerIds}
                  teamCode={primaryTeam?.code}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <>
          {playersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <SkeletonPlayerCard key={i} />
              ))}
            </div>
          ) : filteredAllPlayers.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="No players found"
              description={
                hasActiveFilters 
                  ? "Try adjusting your search or filter criteria."
                  : "Create a team first to manage your roster."
              }
              action={
                hasActiveFilters ? (
                  <Button onClick={clearFilters} variant="default" className="gap-2">
                    <X className="w-4 h-4" />
                    Clear Filters
                  </Button>
                ) : null
              }
            />
          ) : (
            <PlayerGrid 
              players={filteredAllPlayers}
              navigate={navigate}
              setPlayerToDelete={setPlayerToDelete}
              showInvite={false}
            />
          )}
        </>
      )}

      <AlertDialog open={!!playerToDelete} onOpenChange={(open) => !open && setPlayerToDelete(null)}>
        <AlertDialogContent className="bg-card border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-display">Remove Player</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to remove <span className="text-white font-semibold">{playerToDelete?.name}</span> from your roster? 
              This will also delete all of their game history and stats. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary/30 border-white/10 text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => playerToDelete && handleDeletePlayer(playerToDelete.id, playerToDelete.name)}
              disabled={isDeleting}
              className="bg-red-500 text-white"
              data-testid="button-confirm-delete"
            >
              {isDeleting ? "Removing..." : "Remove Player"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface EmptyStateProps {
  icon: typeof Users;
  title: string;
  description: string;
  action?: React.ReactNode;
}

function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden text-center py-20 border border-border rounded-2xl bg-gradient-to-br from-black/40 to-black/20"
    >
      <div className="absolute inset-0 opacity-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/5 blur-[80px] rounded-full" />
      
      <div className="relative z-10">
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full animate-pulse" />
          <div className="relative p-4 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30">
            <Icon 
              className="w-10 h-10 text-accent" 
              style={{ filter: "drop-shadow(0 0 10px hsl(24, 95%, 53%))" }}
            />
          </div>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-muted-foreground max-w-sm mx-auto mb-6">{description}</p>
        {action}
      </div>
    </motion.div>
  );
}

interface PlayerGridProps {
  players: any[];
  navigate: (path: string) => void;
  setPlayerToDelete: (player: { id: number; name: string } | null) => void;
  showInvite?: boolean;
  rosterPlayerIds?: (number | null)[];
  teamCode?: string;
}

function PlayerGrid({ players, navigate, setPlayerToDelete, showInvite, rosterPlayerIds = [], teamCode }: PlayerGridProps) {
  const { toast } = useToast();

  const copyInviteMessage = (playerName: string) => {
    const message = `Hey ${playerName}! Join my team on Caliber using code: ${teamCode}`;
    navigator.clipboard.writeText(message);
    toast({
      title: "Invite Copied",
      description: "Share this message with the player to invite them.",
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence mode="popLayout">
        {players.map((player, index) => {
          const isOnRoster = rosterPlayerIds.includes(player.id);
          const tier = getPlayerTier(player);
          const tierStyle = TIER_STYLES[tier];
          const TierIcon = tierStyle.icon;
          
          return (
            <motion.div 
              key={player.id} 
              className="group relative h-full"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ 
                duration: 0.3,
                delay: index * 0.05,
                ease: "easeOut"
              }}
              layout
            >
              <Card
                className={cn(
                  "h-full relative overflow-hidden transition-all duration-300",
                  "bg-gradient-to-br from-black/60 to-black/30 backdrop-blur-xl",
                  tierStyle.border,
                  "hover:scale-[1.02]"
                )}
                style={{ 
                  boxShadow: tier !== "rookie" ? tierStyle.glow : "0 4px 30px rgba(0,0,0,0.3)"
                }}
              >
                <div className="absolute inset-x-[20%] top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
                
                {isOnRoster && showInvite && (
                  <Badge className="absolute top-3 left-3 z-10 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-400/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    On Roster
                  </Badge>
                )}
                
                <Badge 
                  className={cn(
                    "absolute top-3 right-12 z-10 gap-1",
                    tierStyle.badge
                  )}
                >
                  <TierIcon className="w-3 h-3" />
                  {tierStyle.label}
                </Badge>
                
                <div className="absolute top-3 right-3 z-20">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 text-muted-foreground hover:text-white hover:bg-white/10"
                        data-testid={`button-player-menu-${player.id}`}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-white/10 text-white">
                      <DropdownMenuItem
                        onClick={() => navigate(`/players/${player.id}`)}
                        className="gap-2 cursor-pointer"
                        data-testid={`menu-view-player-${player.id}`}
                      >
                        <Eye className="w-4 h-4" /> View Profile
                      </DropdownMenuItem>
                      {showInvite && !isOnRoster && teamCode && (
                        <DropdownMenuItem
                          onClick={() => copyInviteMessage(player.name)}
                          className="gap-2 cursor-pointer"
                          data-testid={`menu-invite-player-${player.id}`}
                        >
                          <Send className="w-4 h-4" /> Copy Invite
                        </DropdownMenuItem>
                      )}
                      {!showInvite && (
                        <>
                          <DropdownMenuItem
                            onClick={() => navigate(`/players/${player.id}?edit=true`)}
                            className="gap-2 cursor-pointer"
                            data-testid={`menu-edit-player-${player.id}`}
                          >
                            <Pencil className="w-4 h-4" /> Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem
                            onClick={() => setPlayerToDelete({ id: player.id, name: player.name })}
                            className="gap-2 cursor-pointer text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 focus:bg-red-500/10"
                            data-testid={`menu-delete-player-${player.id}`}
                          >
                            <Trash2 className="w-4 h-4" /> Delete Player
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <CardContent className="p-6">
                  <Link href={`/players/${player.id}`} className="block">
                    <div className="flex items-start justify-between mb-6 pr-16">
                      <motion.div 
                        className={cn(
                          "w-16 h-16 rounded-full flex items-center justify-center text-2xl font-display font-bold",
                          "bg-gradient-to-br from-accent/20 to-accent/10 border-2",
                          tier === "elite" ? "border-yellow-400/40 text-yellow-700 dark:text-yellow-300" :
                          tier === "pro" ? "border-purple-400/40 text-purple-700 dark:text-purple-300" :
                          tier === "rising" ? "border-accent/40 text-accent" :
                          "border-white/20 text-white/70"
                        )}
                        style={tier !== "rookie" ? { 
                          boxShadow: tier === "elite" ? "0 0 25px rgba(234, 179, 8, 0.3)" :
                                    tier === "pro" ? "0 0 20px rgba(168, 85, 247, 0.25)" :
                                    "0 0 15px rgba(234, 88, 12, 0.2)"
                        } : {}}
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {player.jerseyNumber || "#"}
                      </motion.div>
                    </div>
                    
                    <h3 className="text-xl font-bold font-display text-white mb-1 group-hover:text-accent transition-colors truncate">
                      {player.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 font-medium">
                      {player.team || "No Team"} • {player.height || "N/A"}
                    </p>
                    
                    <div className="flex items-center gap-3 mb-4">
                      <div className="px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20">
                        <span className="text-xs font-bold uppercase tracking-wider text-accent">
                          {player.position}
                        </span>
                      </div>
                      {player.gamesPlayed > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <span className="text-white font-medium">{player.gamesPlayed}</span> games
                        </div>
                      )}
                    </div>
                  </Link>
                  
                  <div className="pt-4 border-t border-white/5 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/players/${player.id}`)}
                      className="flex-1 gap-1.5 border-white/10 hover:border-accent/30 hover:bg-accent/10"
                      data-testid={`button-view-player-${player.id}`}
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </Button>
                    {showInvite && !isOnRoster && teamCode ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyInviteMessage(player.name)}
                        className="flex-1 gap-1.5 border-accent/30 text-accent hover:bg-accent/10"
                        data-testid={`button-invite-player-${player.id}`}
                      >
                        <Send className="w-3.5 h-3.5" /> Invite
                      </Button>
                    ) : !showInvite ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/players/${player.id}?edit=true`)}
                          className="flex-1 gap-1.5 border-white/10 hover:border-accent/30 hover:bg-accent/10"
                          data-testid={`button-edit-player-${player.id}`}
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setPlayerToDelete({ id: player.id, name: player.name })}
                          className="text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40"
                          data-testid={`button-delete-player-${player.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function CreatePlayerForm({ onSuccess }: { onSuccess: () => void }) {
  const { mutate, isPending } = useCreatePlayer();
  
  const form = useForm<z.infer<typeof insertPlayerSchema>>({
    resolver: zodResolver(insertPlayerSchema),
    defaultValues: {
      name: "",
      position: "Guard",
      height: "",
      team: "",
      jerseyNumber: undefined,
    }
  });

  const onSubmit = (data: z.infer<typeof insertPlayerSchema>) => {
    mutate(data, {
      onSuccess: () => {
        form.reset();
        onSuccess();
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
      <div className="space-y-2">
        <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Full Name</label>
        <Input
          {...form.register("name")}
          placeholder="Enter player name"
          className="bg-black/20 border-white/10 focus:border-accent/50"
          data-testid="input-player-name"
        />
        {form.formState.errors.name && (
          <p className="text-xs text-red-600 dark:text-red-400">{form.formState.errors.name.message}</p>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Position</label>
          <Select
            value={form.watch("position")}
            onValueChange={(val) => form.setValue("position", val)}
          >
            <SelectTrigger className="bg-black/20 border-white/10 focus:border-accent/50" data-testid="select-position">
              <SelectValue placeholder="Select position" />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10">
              <SelectItem value="Guard">Guard</SelectItem>
              <SelectItem value="Forward">Forward</SelectItem>
              <SelectItem value="Center">Center</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Jersey #</label>
          <Input
            {...form.register("jerseyNumber", { valueAsNumber: true })}
            type="number"
            placeholder="#"
            className="bg-black/20 border-white/10 focus:border-accent/50"
            data-testid="input-jersey-number"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Height</label>
          <Input
            {...form.register("height")}
            placeholder="e.g. 6'2"
            className="bg-black/20 border-white/10 focus:border-accent/50"
            data-testid="input-height"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Team</label>
          <Input
            {...form.register("team")}
            placeholder="Team name"
            className="bg-black/20 border-white/10 focus:border-accent/50"
            data-testid="input-team"
          />
        </div>
      </div>
      
      <DialogFooter className="pt-4">
        <Button 
          type="submit" 
          disabled={isPending}
          className="w-full gap-2 bg-accent"
          style={{ boxShadow: "0 4px 20px rgba(234, 88, 12, 0.3)" }}
          data-testid="button-submit-player"
        >
          {isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Create Player
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
