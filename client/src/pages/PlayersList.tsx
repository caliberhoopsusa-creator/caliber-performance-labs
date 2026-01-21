import { useState, useEffect } from "react";
import { usePlayers, useCreatePlayer, useDeletePlayer } from "@/hooks/use-basketball";
import { Link } from "wouter";
import { Search, Plus, UserPlus, Trash2, ChevronRight, MoreVertical, Pencil, Eye, Users, Copy, Check, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertPlayerSchema } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
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
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
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

function getSessionId(): string {
  let sessionId = localStorage.getItem("caliber_session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("caliber_session_id", sessionId);
  }
  return sessionId;
}

export default function PlayersList() {
  const { data: players, isLoading: playersLoading } = usePlayers();
  const { mutate: deletePlayer, isPending: isDeleting } = useDeletePlayer();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
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

  const filteredRosterPlayers = rosterPlayers.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.team?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAllPlayers = players?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.team?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const isLoading = playersLoading || teamsLoading || membersLoading;

  const hasTeam = myTeams.length > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-display font-bold bg-gradient-to-b from-white to-cyan-100/80 bg-clip-text text-transparent tracking-wide">
            {hasTeam ? primaryTeam?.name || "Roster" : "Roster"}
          </h2>
          <p className="text-cyan-200/50 font-medium">
            {hasTeam ? "Manage your team roster" : "Search and manage players"}
          </p>
        </div>
        
        {hasTeam && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={copyTeamCode} className="gap-2 border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-200" data-testid="button-copy-code">
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedCode ? "Copied!" : `Code: ${primaryTeam?.code}`}
            </Button>
          </div>
        )}
      </div>

      {hasTeam ? (
        <Tabs defaultValue="roster" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-4" data-testid="tabs-roster">
            <TabsTrigger value="roster" data-testid="tab-roster">
              <Users className="w-4 h-4 mr-2" />
              My Roster ({rosterPlayers.length})
            </TabsTrigger>
            <TabsTrigger value="find" data-testid="tab-find">
              <Search className="w-4 h-4 mr-2" />
              Find Players
            </TabsTrigger>
          </TabsList>

          <TabsContent value="roster">
            <div className="space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input 
                  type="text" 
                  placeholder="Search roster..." 
                  className="w-full bg-card border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-muted-foreground"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="input-search-roster"
                />
              </div>

              {isLoading ? (
                <div className="flex justify-center p-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : filteredRosterPlayers.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-2xl bg-card/30">
                  <div className="bg-secondary/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No players on your roster</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                    Share your team code <span className="text-primary font-bold">{primaryTeam?.code}</span> with players to invite them, or search for players to add.
                  </p>
                  <Button onClick={copyTeamCode} variant="default" className="gap-2">
                    <Copy className="w-4 h-4" />
                    Copy Invite Code
                  </Button>
                </div>
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
              <Card className="p-4 bg-primary/10 border-primary/20">
                <div className="flex items-center gap-3">
                  <Send className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">Invite players to your team</p>
                    <p className="text-xs text-muted-foreground">Share your team code: <span className="text-primary font-bold">{primaryTeam?.code}</span></p>
                  </div>
                  <Button size="sm" variant="outline" onClick={copyTeamCode} className="gap-1">
                    {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    Copy
                  </Button>
                </div>
              </Card>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input 
                  type="text" 
                  placeholder="Search all players by name or team..." 
                  className="w-full bg-card border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-muted-foreground"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="input-search-all-players"
                />
              </div>

              {playersLoading ? (
                <div className="flex justify-center p-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : filteredAllPlayers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No players found matching your search.</p>
                </div>
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
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input 
              type="text" 
              placeholder="Search players by name or team..." 
              className="w-full bg-card border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-muted-foreground"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-players"
            />
          </div>

          {playersLoading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredAllPlayers.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-2xl bg-card/30">
              <div className="bg-secondary/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No players found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {search ? "Try adjusting your search terms." : "Create a team first to manage your roster."}
              </p>
            </div>
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
            <AlertDialogCancel className="bg-secondary/30 border-white/10 text-white hover:bg-secondary/50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => playerToDelete && handleDeletePlayer(playerToDelete.id, playerToDelete.name)}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
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
      {players.map((player) => {
        const isOnRoster = rosterPlayerIds.includes(player.id);
        
        return (
          <div key={player.id} className="group relative h-full">
            <div className="h-full relative bg-gradient-to-br from-cyan-500/[0.04] via-white/[0.02] to-transparent border border-cyan-500/[0.08] rounded-2xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.3),0_0_40px_rgba(100,200,255,0.02)] backdrop-blur-xl transition-all duration-400 hover:border-cyan-400/20 hover:shadow-[0_8px_40px_rgba(0,0,0,0.35),0_0_50px_rgba(100,200,255,0.05)] overflow-hidden">
              <div className="absolute inset-x-[20%] top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
              {isOnRoster && showInvite && (
                <Badge className="absolute top-3 left-3 bg-emerald-500/20 text-emerald-400 border-emerald-400/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  On Roster
                </Badge>
              )}
              
              <div className="absolute top-3 right-3 z-20">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-8 h-8 text-muted-foreground hover:text-white"
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
                          className="gap-2 cursor-pointer text-red-400 focus:text-red-300 focus:bg-red-500/10"
                          data-testid={`menu-delete-player-${player.id}`}
                        >
                          <Trash2 className="w-4 h-4" /> Delete Player
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <Link href={`/players/${player.id}`} className="block">
                <div className="flex items-start justify-between mb-6 pr-8">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-transparent border-2 border-cyan-400/20 flex items-center justify-center text-2xl font-display font-bold text-cyan-300 shadow-[0_0_25px_rgba(100,200,255,0.15)]">
                    {player.jerseyNumber || "#"}
                  </div>
                  <div className="bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-400/20">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">{player.position}</span>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold font-display text-white mb-1 group-hover:text-cyan-300 transition-colors truncate">{player.name}</h3>
                <p className="text-sm text-cyan-200/40 mb-4 font-medium">{player.team || "No Team"} • {player.height || "N/A"}</p>
              </Link>
              
              <div className="pt-4 border-t border-cyan-500/[0.08] flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/players/${player.id}`)}
                  className="flex-1 gap-1.5"
                  data-testid={`button-view-player-${player.id}`}
                >
                  <Eye className="w-3.5 h-3.5" /> View
                </Button>
                {showInvite && !isOnRoster && teamCode ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyInviteMessage(player.name)}
                    className="flex-1 gap-1.5"
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
                      className="flex-1 gap-1.5"
                      data-testid={`button-edit-player-${player.id}`}
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPlayerToDelete({ id: player.id, name: player.name })}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/30"
                      data-testid={`button-delete-player-${player.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
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
        <Input {...form.register("name")} placeholder="LeBron James" className="bg-secondary/30 border-white/10 text-white placeholder:text-white/20" />
        {form.formState.errors.name && <p className="text-red-400 text-xs">{form.formState.errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Position</label>
          <Select onValueChange={(val) => form.setValue("position", val)} defaultValue="Guard">
            <SelectTrigger className="bg-secondary/30 border-white/10 text-white">
              <SelectValue placeholder="Position" />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10 text-white">
              <SelectItem value="Guard">Guard</SelectItem>
              <SelectItem value="Wing">Wing</SelectItem>
              <SelectItem value="Big">Big</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Jersey #</label>
          <Input 
            type="number" 
            {...form.register("jerseyNumber", { valueAsNumber: true })} 
            placeholder="23" 
            className="bg-secondary/30 border-white/10 text-white placeholder:text-white/20" 
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Height</label>
          <Input {...form.register("height")} placeholder="6'8" className="bg-secondary/30 border-white/10 text-white placeholder:text-white/20" />
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Team</label>
          <Input {...form.register("team")} placeholder="Lakers" className="bg-secondary/30 border-white/10 text-white placeholder:text-white/20" />
        </div>
      </div>

      <DialogFooter className="pt-4">
        <Button type="submit" disabled={isPending} className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90">
          {isPending ? "Adding..." : "Add to Roster"}
        </Button>
      </DialogFooter>
    </form>
  );
}
