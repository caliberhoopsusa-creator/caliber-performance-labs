import { useState, useMemo } from "react";
import { usePlayers, useCreatePlayer, useDeletePlayer } from "@/hooks/use-basketball";
import { Link } from "wouter";
import { Search, Plus, UserPlus, Trash2, MoreVertical, Pencil, Eye, Users, Copy, Check, Send, Star, Zap, Crown, X } from "lucide-react";
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SkeletonPlayerCard } from "@/components/ui/skeleton-premium";
import { cn } from "@/lib/utils";
import { SectionEyebrow } from "@/components/signal";

/**
 * PlayersList — SIGNAL: Career Mode, Phase 2a. Dense browsing done right:
 * token surfaces, condensed-caps labels, angle-cut jersey plates, and the
 * tier ramp for activity tiers. Console energy stays quiet — the only
 * crimson is the earned Legend tier and interactive accents.
 */

const CONDENSED = { fontWeight: 500, fontStretch: "70%" } as const;
const DISPLAY_BLACK = {
  fontFamily: "var(--font-display)",
  fontWeight: 900,
  fontStretch: "125%",
  letterSpacing: "-0.01em",
} as const;

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

/** Activity tiers on the tier ramp — Legend is the earned crimson moment. */
const TIER_STYLES = {
  elite: {
    cssVar: "--tier-elite",
    glow: "0 0 24px hsl(var(--crimson-glow))" as string | undefined,
    icon: Crown,
    label: "Legend",
  },
  pro: {
    cssVar: "--tier-strong",
    glow: undefined,
    icon: Star,
    label: "Veteran",
  },
  rising: {
    cssVar: "--tier-solid",
    glow: undefined,
    icon: Zap,
    label: "Active",
  },
  rookie: {
    cssVar: "--tier-raw",
    glow: undefined,
    icon: UserPlus,
    label: "Newcomer",
  },
} as const;

/** Angle-cut condensed-caps chip on a tier/grade token. */
function TierChip({
  cssVar,
  icon: Icon,
  children,
  className,
  ...rest
}: {
  cssVar: string;
  icon?: typeof Users;
  children: React.ReactNode;
  className?: string;
  "data-testid"?: string;
}) {
  return (
    <span
      className={cn(
        "angle-cut inline-flex items-center gap-1 border px-2 py-1 font-display text-label uppercase",
        className,
      )}
      style={{
        ...CONDENSED,
        color: `hsl(var(${cssVar}))`,
        backgroundColor: `hsl(var(${cssVar}) / 0.12)`,
        borderColor: `hsl(var(${cssVar}) / 0.35)`,
      }}
      {...rest}
    >
      {Icon && <Icon aria-hidden className="h-3 w-3" />}
      {children}
    </span>
  );
}

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

  const searchLower = search.toLowerCase();

  const filteredRosterPlayers = useMemo(
    () => rosterPlayers.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchLower) ||
        p.team?.toLowerCase().includes(searchLower);
      const matchesPosition = positionFilter === "All" || p.position === positionFilter;
      return matchesSearch && matchesPosition;
    }),
    [rosterPlayers, searchLower, positionFilter]
  );

  const filteredAllPlayers = useMemo(
    () => (players || []).filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchLower) ||
        p.team?.toLowerCase().includes(searchLower);
      const matchesPosition = positionFilter === "All" || p.position === positionFilter;
      return matchesSearch && matchesPosition;
    }),
    [players, searchLower, positionFilter]
  );

  const isLoading = playersLoading || teamsLoading || membersLoading;
  const hasTeam = myTeams.length > 0;
  const hasActiveFilters = positionFilter !== "All" || search.length > 0;

  const clearFilters = () => {
    setSearch("");
    setPositionFilter("All");
  };

  return (
    <div className="pb-24 md:pb-6 space-y-8">
      {/* page header — quiet roster framing */}
      <header
        className="flex flex-col gap-6 border-b pb-6 md:flex-row md:items-end md:justify-between"
        style={{ borderColor: "hsl(var(--line))" }}
      >
        <div className="min-w-0">
          <SectionEyebrow as="div">
            {hasTeam ? primaryTeam?.name : "Team Management"}
          </SectionEyebrow>
          <h1
            className="lean mt-3 uppercase leading-none text-title"
            style={{ ...DISPLAY_BLACK, color: "hsl(var(--silver-hi))" }}
          >
            Player Roster
          </h1>
          <p className="mt-2 max-w-md font-body text-body text-muted-foreground">
            {hasTeam ? "Manage your team roster and track player performance" : "Search and manage players across all teams"}
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 md:items-end">
          <div className="flex items-center gap-3">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" data-testid="button-add-player">
                  <Plus className="w-4 h-4" />
                  Add Player
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border text-foreground max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-display uppercase tracking-wide">Add New Player</DialogTitle>
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
                className="gap-2"
                data-testid="button-copy-code"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedCode ? "Copied!" : `Code: ${primaryTeam?.code}`}
              </Button>
            )}
          </div>

          <span
            className="angle-cut inline-flex items-center gap-1.5 border px-3 py-1.5 font-mono tabular-nums"
            style={{
              fontSize: "var(--text-data)",
              color: "hsl(var(--silver))",
              borderColor: "hsl(var(--line))",
              backgroundColor: "hsl(var(--obsidian-2))",
            }}
          >
            <Users aria-hidden className="h-3.5 w-3.5" style={{ color: "hsl(var(--crimson))" }} />
            <span className="font-medium text-foreground">
              {hasTeam ? rosterPlayers.length : players?.length || 0}
            </span>
            <span
              className="font-display text-label uppercase"
              style={{ ...CONDENSED, color: "hsl(var(--silver-lo))" }}
            >
              players
            </span>
          </span>
        </div>
      </header>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div />
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
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
              className="pl-9"
              style={{ backgroundColor: "hsl(var(--obsidian-2))", borderColor: "hsl(var(--line))" }}
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
                className="capitalize"
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
            <span
              className="font-display text-label uppercase"
              style={{ ...CONDENSED, color: "hsl(var(--silver-lo))" }}
            >
              Active filters:
            </span>
            {search && (
              <span
                className="angle-cut inline-flex items-center gap-1.5 border px-2 py-1 font-display text-label uppercase text-accent"
                style={{
                  ...CONDENSED,
                  borderColor: "hsl(var(--crimson) / 0.3)",
                  backgroundColor: "hsl(var(--crimson) / 0.08)",
                }}
              >
                Search: "{search}"
                <button onClick={() => setSearch("")} className="ml-1 hover:text-foreground" aria-label="Clear search filter">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {positionFilter !== "All" && (
              <span
                className="angle-cut inline-flex items-center gap-1.5 border px-2 py-1 font-display text-label uppercase text-accent"
                style={{
                  ...CONDENSED,
                  borderColor: "hsl(var(--crimson) / 0.3)",
                  backgroundColor: "hsl(var(--crimson) / 0.08)",
                }}
              >
                Position: {positionFilter}
                <button onClick={() => setPositionFilter("All")} className="ml-1 hover:text-foreground" aria-label="Clear position filter">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </motion.div>
        )}
      </div>

      {hasTeam ? (
        <Tabs defaultValue="roster" className="w-full">
          <TabsList
            className="mb-6 grid w-full grid-cols-2 border p-1"
            style={{ backgroundColor: "hsl(var(--obsidian-1))", borderColor: "hsl(var(--line))" }}
            data-testid="tabs-roster"
          >
            <TabsTrigger value="roster" className="gap-2" data-testid="tab-roster">
              <Users className="w-4 h-4" />
              My Roster ({rosterPlayers.length})
            </TabsTrigger>
            <TabsTrigger value="find" className="gap-2" data-testid="tab-find">
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
                      <Button onClick={copyTeamCode} variant="default" className="gap-2">
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
              <div
                className="rounded-card border p-4"
                style={{ backgroundColor: "hsl(var(--obsidian-1))", borderColor: "hsl(var(--line))" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="angle-cut border p-2"
                    style={{ backgroundColor: "hsl(var(--obsidian-2))", borderColor: "hsl(var(--line))" }}
                  >
                    <Send aria-hidden className="w-5 h-5" style={{ color: "hsl(var(--crimson))" }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-body text-sm font-medium text-foreground">Invite players to your team</p>
                    <p className="font-mono text-muted-foreground" style={{ fontSize: "var(--text-data)" }}>
                      Share your team code:{" "}
                      <span className="font-medium" style={{ color: "hsl(var(--crimson))" }}>{primaryTeam?.code}</span>
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyTeamCode}
                    className="gap-1.5"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy
                  </Button>
                </div>
              </div>

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
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-display uppercase tracking-wide">Remove Player</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to remove <span className="text-foreground font-semibold">{playerToDelete?.name}</span> from your roster?
              This will also delete all of their game history and stats. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary/30 border-border text-foreground">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => playerToDelete && handleDeletePlayer(playerToDelete.id, playerToDelete.name)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground"
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
      className="rounded-card border py-20 text-center"
      style={{ backgroundColor: "hsl(var(--obsidian-1))", borderColor: "hsl(var(--line))" }}
    >
      <div
        className="angle-cut mx-auto mb-6 inline-flex border p-4"
        style={{ backgroundColor: "hsl(var(--obsidian-2))", borderColor: "hsl(var(--line))" }}
      >
        <Icon aria-hidden className="h-10 w-10" style={{ color: "hsl(var(--silver-mute))" }} />
      </div>
      <h3
        className="mb-2 uppercase text-foreground"
        style={{ ...DISPLAY_BLACK, fontSize: "clamp(1rem, 0.8rem + 1vw, 1.25rem)" }}
      >
        {title}
      </h3>
      <p className="mx-auto mb-6 max-w-sm font-body text-body text-muted-foreground">{description}</p>
      {action}
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
              <article
                className="gloss relative h-full overflow-hidden rounded-card border transition-transform duration-300 hover:scale-[1.02]"
                style={{
                  backgroundColor: "hsl(var(--obsidian-1))",
                  borderColor: tier === "elite" ? "hsl(var(--crimson) / 0.35)" : "hsl(var(--line))",
                  boxShadow: tierStyle.glow,
                }}
              >
                {isOnRoster && showInvite && (
                  <TierChip cssVar="--grade-a" className="absolute top-3 left-3 z-10">
                    On Roster
                  </TierChip>
                )}

                <TierChip
                  cssVar={tierStyle.cssVar}
                  icon={TierIcon}
                  className="absolute top-3 right-12 z-10"
                >
                  {tierStyle.label}
                </TierChip>

                <div className="absolute top-3 right-3 z-20">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 text-muted-foreground hover:text-foreground"
                        data-testid={`button-player-menu-${player.id}`}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border text-foreground">
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
                          <DropdownMenuSeparator className="bg-border" />
                          <DropdownMenuItem
                            onClick={() => setPlayerToDelete({ id: player.id, name: player.name })}
                            className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                            data-testid={`menu-delete-player-${player.id}`}
                          >
                            <Trash2 className="w-4 h-4" /> Delete Player
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="p-6">
                  <Link href={`/players/${player.id}`} className="block">
                    <div className="mb-6 flex items-start justify-between pr-16">
                      {/* angle-cut jersey plate — the quiet identity carrier */}
                      <div
                        className="angle-cut flex h-16 w-16 items-center justify-center border font-display text-2xl tabular-nums"
                        style={{
                          fontWeight: 800,
                          backgroundColor: "hsl(var(--obsidian-2))",
                          borderColor: tier === "elite" ? "hsl(var(--crimson) / 0.4)" : "hsl(var(--line))",
                          color: tier === "elite" ? "hsl(var(--crimson))" : "hsl(var(--silver))",
                        }}
                      >
                        {player.jerseyNumber || "#"}
                      </div>
                    </div>

                    <h3
                      className="mb-1 truncate uppercase text-foreground transition-colors group-hover:text-accent"
                      style={{ ...DISPLAY_BLACK, fontSize: "clamp(1rem, 0.8rem + 1vw, 1.25rem)" }}
                    >
                      {player.name}
                    </h3>
                    <p
                      className="mb-4 truncate font-mono text-muted-foreground"
                      style={{ fontSize: "var(--text-data)" }}
                    >
                      {player.team || "No Team"} · {player.height || "N/A"}
                    </p>

                    <div className="mb-4 flex items-center gap-3">
                      <span
                        className="angle-cut inline-flex items-center border px-2.5 py-1 font-display text-label uppercase"
                        style={{
                          ...CONDENSED,
                          color: "hsl(var(--silver))",
                          borderColor: "hsl(var(--line))",
                          backgroundColor: "hsl(var(--obsidian-2))",
                        }}
                      >
                        {player.position}
                      </span>
                      {player.gamesPlayed > 0 && (
                        <span className="font-mono text-muted-foreground" style={{ fontSize: "var(--text-data)" }}>
                          <span className="font-medium tabular-nums text-foreground">{player.gamesPlayed}</span> games
                        </span>
                      )}
                    </div>
                  </Link>

                  <div
                    className="flex items-center gap-2 border-t pt-4"
                    style={{ borderColor: "hsl(var(--line))" }}
                  >
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
                          className="text-destructive hover:bg-destructive/10"
                          style={{ borderColor: "hsl(var(--destructive) / 0.3)" }}
                          data-testid={`button-delete-player-${player.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              </article>
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

  const labelStyle = { ...CONDENSED, color: "hsl(var(--silver-lo))" } as const;
  const inputStyle = { backgroundColor: "hsl(var(--obsidian-2))", borderColor: "hsl(var(--line))" } as const;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
      <div className="space-y-2">
        <label className="font-display text-label uppercase" style={labelStyle}>Full Name</label>
        <Input
          {...form.register("name")}
          placeholder="Enter player name"
          style={inputStyle}
          data-testid="input-player-name"
        />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="font-display text-label uppercase" style={labelStyle}>Position</label>
          <Select
            value={form.watch("position")}
            onValueChange={(val) => form.setValue("position", val)}
          >
            <SelectTrigger style={inputStyle} data-testid="select-position">
              <SelectValue placeholder="Select position" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="Guard">Guard</SelectItem>
              <SelectItem value="Forward">Forward</SelectItem>
              <SelectItem value="Center">Center</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="font-display text-label uppercase" style={labelStyle}>Jersey #</label>
          <Input
            {...form.register("jerseyNumber", { valueAsNumber: true })}
            type="number"
            placeholder="#"
            style={inputStyle}
            data-testid="input-jersey-number"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="font-display text-label uppercase" style={labelStyle}>Height</label>
          <Input
            {...form.register("height")}
            placeholder="e.g. 6'2"
            style={inputStyle}
            data-testid="input-height"
          />
        </div>

        <div className="space-y-2">
          <label className="font-display text-label uppercase" style={labelStyle}>Team</label>
          <Input
            {...form.register("team")}
            placeholder="Team name"
            style={inputStyle}
            data-testid="input-team"
          />
        </div>
      </div>

      <DialogFooter className="pt-4">
        <Button
          type="submit"
          disabled={isPending}
          className="w-full gap-2"
          data-testid="button-submit-player"
        >
          {isPending ? (
            <>
              <div
                className="h-4 w-4 animate-spin rounded-full border-2"
                style={{
                  borderColor: "hsl(var(--silver) / 0.3)",
                  borderTopColor: "hsl(var(--silver-hi))",
                }}
              />
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
