import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useSidelineFeedback, useOfflineGameStorage } from "@/hooks/use-sideline-feedback";
import { useOffline } from "@/hooks/use-offline";
import { 
  Play, Square, Undo2, ChevronLeft, Users, 
  Trophy, AlertCircle, Loader2, X, Volume2, VolumeX, Wifi, WifiOff, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HelpTooltip } from "@/components/HelpTooltip";

interface Player {
  id: number;
  name: string;
  position: string;
  jerseyNumber: number | null;
  sport: string;
}

interface LiveGameSession {
  id: number;
  coachUserId: string;
  selectedPlayerIds: string;
  opponent: string | null;
  sport: string;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
}

interface LiveGameEvent {
  id: number;
  sessionId: number;
  playerId: number;
  eventType: string;
  value: number;
  createdAt: string;
}

interface PlayerStats {
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
}

type StatType = 'points_1' | 'points_2' | 'points_3' | 'rebound' | 'assist' | 'steal' | 'block' | 'turnover' | 'foul';

const STAT_CONFIG: Record<StatType, { label: string; shortLabel: string; color: string; bgColor: string }> = {
  points_1: { label: '1 PT', shortLabel: '1', color: 'text-green-400', bgColor: 'bg-green-600' },
  points_2: { label: '2 PT', shortLabel: '2', color: 'text-cyan-400', bgColor: 'bg-cyan-600' },
  points_3: { label: '3 PT', shortLabel: '3', color: 'text-blue-400', bgColor: 'bg-blue-600' },
  rebound: { label: 'REB', shortLabel: 'R', color: 'text-orange-400', bgColor: 'bg-orange-600/20 border-orange-500/50' },
  assist: { label: 'AST', shortLabel: 'A', color: 'text-purple-400', bgColor: 'bg-purple-600/20 border-purple-500/50' },
  steal: { label: 'STL', shortLabel: 'S', color: 'text-yellow-400', bgColor: 'bg-yellow-600/20 border-yellow-500/50' },
  block: { label: 'BLK', shortLabel: 'B', color: 'text-red-400', bgColor: 'bg-red-600/20 border-red-500/50' },
  turnover: { label: 'TO', shortLabel: 'TO', color: 'text-rose-400', bgColor: 'bg-rose-600/20 border-rose-500/50' },
  foul: { label: 'FOUL', shortLabel: 'F', color: 'text-amber-400', bgColor: 'bg-amber-600/20 border-amber-500/50' },
};

export default function LiveGameMode() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [opponent, setOpponent] = useState("");
  const [activePlayerId, setActivePlayerId] = useState<number | null>(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Sideline feedback and offline support
  const { triggerFeedback, setSoundEnabled: setFeedbackSound } = useSidelineFeedback();
  const { isOffline } = useOffline();
  const { storeEvent, getUnsyncedEvents, markEventSynced, clearSyncedEvents } = useOfflineGameStorage();

  // Sync sound setting
  useEffect(() => {
    setFeedbackSound(soundEnabled);
  }, [soundEnabled, setFeedbackSound]);

  // Sync offline events state
  const [isSyncing, setIsSyncing] = useState(false);
  const prevOfflineRef = useRef(isOffline);

  const { data: user } = useQuery<{ role: string | null }>({
    queryKey: ['/api/users/me'],
  });

  const { data: rosterPlayers, isLoading: rosterLoading } = useQuery<Player[]>({
    queryKey: ['/api/roster'],
    enabled: user?.role === 'coach',
  });

  const { data: activeSession, isLoading: sessionLoading, refetch: refetchSession } = useQuery<LiveGameSession | null>({
    queryKey: ['/api/live-game/active'],
    enabled: user?.role === 'coach',
  });

  const { data: sessionEvents = [], refetch: refetchEvents } = useQuery<LiveGameEvent[]>({
    queryKey: ['/api/live-game', activeSession?.id, 'events'],
    enabled: !!activeSession?.id,
  });

  // Sync offline events when coming back online
  useEffect(() => {
    const syncOfflineEvents = async () => {
      if (prevOfflineRef.current && !isOffline && activeSession?.id) {
        const unsyncedEvents = getUnsyncedEvents();
        if (unsyncedEvents.length > 0) {
          setIsSyncing(true);
          let syncedCount = 0;
          
          for (const event of unsyncedEvents) {
            try {
              await apiRequest('POST', `/api/live-game/${activeSession.id}/event`, {
                playerId: event.playerId,
                eventType: event.eventType,
              });
              markEventSynced(event.id);
              syncedCount++;
            } catch (error) {
              console.error('Failed to sync offline event:', error);
            }
          }
          
          if (syncedCount > 0) {
            triggerFeedback("success");
            toast({ 
              title: "Stats synced!", 
              description: `${syncedCount} offline stat${syncedCount > 1 ? 's' : ''} uploaded successfully.` 
            });
            refetchEvents();
            clearSyncedEvents();
          }
          setIsSyncing(false);
        }
      }
      prevOfflineRef.current = isOffline;
    };
    
    syncOfflineEvents();
  }, [isOffline, activeSession?.id, getUnsyncedEvents, markEventSynced, clearSyncedEvents, triggerFeedback, toast, refetchEvents]);

  const startSessionMutation = useMutation({
    mutationFn: async (data: { selectedPlayerIds: number[]; opponent?: string; sport: string }) => {
      const res = await apiRequest('POST', '/api/live-game/start', data);
      return res.json();
    },
    onSuccess: () => {
      refetchSession();
      toast({ title: "Game started!", description: "Tracking stats for your team." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to start game", description: error.message, variant: "destructive" });
    },
  });

  const logEventMutation = useMutation({
    mutationFn: async (data: { playerId: number; eventType: string }) => {
      // If offline, store locally
      if (isOffline) {
        storeEvent({ playerId: data.playerId, eventType: data.eventType });
        return { offline: true };
      }
      const res = await apiRequest('POST', `/api/live-game/${activeSession?.id}/event`, data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      // Trigger haptic/audio feedback
      const isPoints = variables.eventType.startsWith('points');
      triggerFeedback(isPoints ? "points" : "stat");
      refetchEvents();
    },
    onError: (error: Error) => {
      triggerFeedback("error");
      toast({ title: "Failed to log stat", description: error.message, variant: "destructive" });
    },
  });

  const undoEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      await apiRequest('DELETE', `/api/live-game/${activeSession?.id}/events/${eventId}`);
    },
    onSuccess: () => {
      triggerFeedback("undo");
      refetchEvents();
      toast({ title: "Undone", description: "Last stat removed" });
    },
    onError: (error: Error) => {
      triggerFeedback("error");
      toast({ title: "Failed to undo", description: error.message, variant: "destructive" });
    },
  });

  const completeSessionMutation = useMutation({
    mutationFn: async (data: { result?: string }) => {
      const res = await apiRequest('POST', `/api/live-game/${activeSession?.id}/complete`, data);
      return res.json();
    },
    onSuccess: (data: any) => {
      triggerFeedback("success");
      queryClient.invalidateQueries({ queryKey: ['/api/live-game/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/roster'] });
      clearSyncedEvents(); // Clean up any synced offline events
      toast({ 
        title: "Game completed!", 
        description: `Stats saved for ${data.playerCount} players.` 
      });
      navigate('/coach?tab=dashboard');
    },
    onError: (error: Error) => {
      toast({ title: "Failed to end game", description: error.message, variant: "destructive" });
    },
  });

  const calculatePlayerStats = useCallback((playerId: number): PlayerStats => {
    const playerEvents = sessionEvents.filter(e => e.playerId === playerId);
    const offlinePlayerEvents = getUnsyncedEvents().filter(e => e.playerId === playerId);
    const stats: PlayerStats = { points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, fouls: 0 };
    
    // Process server events
    for (const event of playerEvents) {
      switch (event.eventType) {
        case 'points_1': stats.points += 1; break;
        case 'points_2': stats.points += 2; break;
        case 'points_3': stats.points += 3; break;
        case 'rebound': stats.rebounds++; break;
        case 'assist': stats.assists++; break;
        case 'steal': stats.steals++; break;
        case 'block': stats.blocks++; break;
        case 'turnover': stats.turnovers++; break;
        case 'foul': stats.fouls++; break;
      }
    }
    
    // Also count offline pending events
    for (const event of offlinePlayerEvents) {
      switch (event.eventType) {
        case 'points_1': stats.points += 1; break;
        case 'points_2': stats.points += 2; break;
        case 'points_3': stats.points += 3; break;
        case 'rebound': stats.rebounds++; break;
        case 'assist': stats.assists++; break;
        case 'steal': stats.steals++; break;
        case 'block': stats.blocks++; break;
        case 'turnover': stats.turnovers++; break;
        case 'foul': stats.fouls++; break;
      }
    }
    return stats;
  }, [sessionEvents, getUnsyncedEvents]);

  const handleStartGame = () => {
    if (selectedPlayers.length === 0) {
      toast({ title: "Select players", description: "Choose at least one player to track", variant: "destructive" });
      return;
    }
    startSessionMutation.mutate({
      selectedPlayerIds: selectedPlayers,
      opponent: opponent || undefined,
      sport: "basketball",
    });
  };

  const handleLogStat = (playerId: number, statType: StatType) => {
    logEventMutation.mutate({ playerId, eventType: statType });
  };

  const handleUndo = () => {
    if (sessionEvents.length > 0) {
      const lastEvent = sessionEvents[sessionEvents.length - 1];
      undoEventMutation.mutate(lastEvent.id);
    }
  };

  const handleEndGame = (result?: string) => {
    completeSessionMutation.mutate({ result });
    setShowEndConfirm(false);
  };

  const togglePlayerSelection = (playerId: number) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  if (user?.role !== 'coach') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Coach Access Only</h2>
        <p className="text-muted-foreground text-center">
          Live Game Mode is available for coaches to track team stats during games.
        </p>
        <Button variant="outline" onClick={() => navigate('/')}>
          Go Back
        </Button>
      </div>
    );
  }

  if (sessionLoading || rosterLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const sessionPlayerIds = activeSession ? JSON.parse(activeSession.selectedPlayerIds) as number[] : [];
  const sessionPlayers = rosterPlayers?.filter(p => sessionPlayerIds.includes(p.id)) || [];

  if (!activeSession) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/coach')}
            data-testid="button-back"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-cyan-400 font-display">LIVE GAME MODE</h1>
            <p className="text-muted-foreground">Track stats in real-time during a game</p>
          </div>
        </div>

        <Card className="border-cyan-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              Select Players
              <HelpTooltip
                content="Tap players to select them for tracking. Only selected players will have their stats recorded."
                side="right"
                iconSize="md"
                testId="button-help-live-game-select"
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Opponent (optional)</Label>
              <Input 
                placeholder="Enter opponent name"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                className="mt-1"
                data-testid="input-opponent"
              />
            </div>

            {!rosterPlayers || rosterPlayers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No players in your roster yet.</p>
                <p className="text-sm">Add players to your team first.</p>
              </div>
            ) : (
              <div className="grid gap-2">
                {rosterPlayers.map(player => (
                  <div
                    key={player.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      selectedPlayers.includes(player.id)
                        ? "border-cyan-500/50 bg-cyan-500/10"
                        : "border-border hover-elevate"
                    )}
                    onClick={() => togglePlayerSelection(player.id)}
                    data-testid={`player-select-${player.id}`}
                  >
                    <Checkbox 
                      checked={selectedPlayers.includes(player.id)}
                      onCheckedChange={() => togglePlayerSelection(player.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{player.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {player.position} {player.jerseyNumber && `#${player.jerseyNumber}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button 
              className="w-full"
              onClick={handleStartGame}
              disabled={selectedPlayers.length === 0 || startSessionMutation.isPending}
              data-testid="button-start-game"
            >
              {startSessionMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Start Game ({selectedPlayers.length} players)
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 sticky top-0 z-20 bg-background/80 backdrop-blur-sm py-2 -mx-4 px-4 border-b border-cyan-500/10">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-bold text-cyan-400 font-display">
              {activeSession.opponent ? `VS ${activeSession.opponent.toUpperCase()}` : 'LIVE GAME'}
            </h1>
            <p className="text-xs text-muted-foreground">{sessionPlayers.length} players tracked</p>
          </div>
          
          {/* Status indicators */}
          <div className="flex items-center gap-2">
            {isSyncing && (
              <Badge variant="outline" className="gap-1 text-cyan-400 border-cyan-500/30">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span className="text-xs">Syncing...</span>
              </Badge>
            )}
            {isOffline && (
              <Badge variant="outline" className="gap-1 text-amber-400 border-amber-500/30">
                <WifiOff className="w-3 h-3" />
                <span className="text-xs">Offline</span>
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Sound toggle */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setSoundEnabled(!soundEnabled)}
            data-testid="button-sound-toggle"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleUndo}
            disabled={sessionEvents.length === 0 || undoEventMutation.isPending}
            data-testid="button-undo"
          >
            <Undo2 className="w-4 h-4 mr-1" />
            Undo
          </Button>
          <Button 
            variant="destructive"
            onClick={() => setShowEndConfirm(true)}
            data-testid="button-end-game"
          >
            <Square className="w-4 h-4 mr-1" />
            End
          </Button>
        </div>
      </div>

      {showEndConfirm && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4 space-y-3">
            <p className="font-medium">End this game?</p>
            <p className="text-sm text-muted-foreground">Stats will be saved for all {sessionPlayers.length} players.</p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => handleEndGame('W')}
                className="flex-1"
                disabled={completeSessionMutation.isPending}
                data-testid="button-end-win"
              >
                <Trophy className="w-5 h-5 mr-2" /> Win
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => handleEndGame('L')}
                className="flex-1"
                disabled={completeSessionMutation.isPending}
                data-testid="button-end-loss"
              >
                <X className="w-5 h-5 mr-2" /> Loss
              </Button>
              <Button 
                variant="ghost" 
                size="lg"
                onClick={() => setShowEndConfirm(false)}
                data-testid="button-cancel-end"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {sessionPlayers.map(player => {
          const stats = calculatePlayerStats(player.id);
          const isActive = activePlayerId === player.id;
          
          return (
            <Card 
              key={player.id}
              className={cn(
                "transition-all border-cyan-500/20",
                isActive && "ring-2 ring-cyan-500/50"
              )}
              data-testid={`player-card-${player.id}`}
            >
              <CardContent className="p-3">
                <button
                  className="w-full flex items-center justify-between flex-wrap gap-2 py-2 min-h-[56px]"
                  onClick={() => setActivePlayerId(isActive ? null : player.id)}
                  data-testid={`button-toggle-player-${player.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center text-base font-bold shrink-0">
                      {player.jerseyNumber || player.name[0]}
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{player.name}</div>
                      <div className="text-sm text-muted-foreground">{player.position}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-base">
                    <span className="font-bold text-cyan-400">{stats.points} PTS</span>
                    <span className="text-muted-foreground">
                      {stats.rebounds}R {stats.assists}A
                    </span>
                  </div>
                </button>

                {isActive && (
                  <div className="space-y-3 mt-3 pt-3 border-t border-border/30">
                    <div className="grid grid-cols-3 gap-3">
                      {(['points_1', 'points_2', 'points_3'] as StatType[]).map(stat => (
                        <Button
                          key={stat}
                          size="xl"
                          className={cn("font-bold", STAT_CONFIG[stat].bgColor)}
                          onClick={() => handleLogStat(player.id, stat)}
                          disabled={logEventMutation.isPending}
                          data-testid={`button-stat-${stat}-${player.id}`}
                        >
                          {STAT_CONFIG[stat].label}
                        </Button>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {(['rebound', 'assist', 'steal'] as StatType[]).map(stat => (
                        <Button
                          key={stat}
                          size="xl"
                          variant="outline"
                          className={cn("font-medium", STAT_CONFIG[stat].color, STAT_CONFIG[stat].bgColor)}
                          onClick={() => handleLogStat(player.id, stat)}
                          disabled={logEventMutation.isPending}
                          data-testid={`button-stat-${stat}-${player.id}`}
                        >
                          {STAT_CONFIG[stat].label}
                        </Button>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {(['block', 'turnover', 'foul'] as StatType[]).map(stat => (
                        <Button
                          key={stat}
                          size="xl"
                          variant="outline"
                          className={cn("font-medium", STAT_CONFIG[stat].color, STAT_CONFIG[stat].bgColor)}
                          onClick={() => handleLogStat(player.id, stat)}
                          disabled={logEventMutation.isPending}
                          data-testid={`button-stat-${stat}-${player.id}`}
                        >
                          {STAT_CONFIG[stat].label}
                        </Button>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-border/50 grid grid-cols-7 gap-1 text-center text-xs">
                      <div>
                        <div className="font-bold text-cyan-400">{stats.points}</div>
                        <div className="text-muted-foreground">PTS</div>
                      </div>
                      <div>
                        <div className="font-bold">{stats.rebounds}</div>
                        <div className="text-muted-foreground">REB</div>
                      </div>
                      <div>
                        <div className="font-bold">{stats.assists}</div>
                        <div className="text-muted-foreground">AST</div>
                      </div>
                      <div>
                        <div className="font-bold">{stats.steals}</div>
                        <div className="text-muted-foreground">STL</div>
                      </div>
                      <div>
                        <div className="font-bold">{stats.blocks}</div>
                        <div className="text-muted-foreground">BLK</div>
                      </div>
                      <div>
                        <div className="font-bold text-rose-400">{stats.turnovers}</div>
                        <div className="text-muted-foreground">TO</div>
                      </div>
                      <div>
                        <div className="font-bold text-amber-400">{stats.fouls}</div>
                        <div className="text-muted-foreground">FLS</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(sessionEvents.length > 0 || getUnsyncedEvents().length > 0) && (
        <Card className="border-cyan-500/20">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              Recent ({sessionEvents.length} events)
              {getUnsyncedEvents().length > 0 && (
                <Badge variant="outline" className="text-xs text-amber-400 border-amber-500/30">
                  +{getUnsyncedEvents().length} pending
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
              {/* Show pending offline events first */}
              {getUnsyncedEvents().map(event => {
                const player = sessionPlayers.find(p => p.id === event.playerId);
                const config = STAT_CONFIG[event.eventType as StatType];
                return (
                  <Badge 
                    key={`offline-${event.id}`} 
                    variant="outline" 
                    className={cn("text-xs opacity-70 border-dashed", config?.color)}
                  >
                    {player?.name?.split(' ')[0] || '?'} {config?.shortLabel || event.eventType}
                    <WifiOff className="w-2 h-2 ml-1" />
                  </Badge>
                );
              })}
              {sessionEvents.slice(-15).reverse().map(event => {
                const player = sessionPlayers.find(p => p.id === event.playerId);
                const config = STAT_CONFIG[event.eventType as StatType];
                return (
                  <Badge 
                    key={event.id} 
                    variant="outline" 
                    className={cn("text-xs", config?.color)}
                  >
                    {player?.name?.split(' ')[0] || '?'} {config?.shortLabel || event.eventType}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
