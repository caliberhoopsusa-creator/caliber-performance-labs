import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AddEventModal } from "@/components/AddEventModal";
import { Paywall } from "@/components/Paywall";
import { 
  Calendar, 
  Users, 
  Trophy, 
  Clock, 
  MapPin,
  Plus,
  CalendarPlus,
  Dumbbell,
  Target,
  ChevronRight,
  Loader2,
  Play,
  Radio,
  Timer,
  UserCheck
} from "lucide-react";
import { useActivePractices, useStartPractice } from "@/hooks/use-basketball";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LivePractice } from "@/components/LivePractice";
import type { Practice } from "@/hooks/use-basketball";
import { format, isToday, isTomorrow, addDays, startOfDay, isSameDay } from "date-fns";
import { Link, useLocation } from "wouter";
import { useSport } from "@/components/SportToggle";
import type { ScheduleEvent } from "@shared/schema";

type TeamWithCount = {
  id: number;
  name: string;
  code: string;
  memberCount: number;
};

function getSessionId(): string {
  let sessionId = localStorage.getItem("caliber_session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("caliber_session_id", sessionId);
  }
  return sessionId;
}

function EventTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'game':
      return <Trophy className="w-4 h-4" />;
    case 'practice':
      return <Target className="w-4 h-4" />;
    case 'workout':
      return <Dumbbell className="w-4 h-4" />;
    default:
      return <Calendar className="w-4 h-4" />;
  }
}

function EventTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    game: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    practice: 'bg-green-500/20 text-green-400 border-green-500/30',
    workout: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    meeting: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  return (
    <Badge 
      variant="outline" 
      className={`text-xs capitalize ${colors[type] || 'bg-muted/50'}`}
    >
      {type}
    </Badge>
  );
}

function formatEventDate(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEE, MMM d');
}

export default function TeamHub() {
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [defaultEventType, setDefaultEventType] = useState<'practice' | 'game' | 'workout' | 'meeting'>('practice');
  const [, navigate] = useLocation();
  const sessionId = getSessionId();
  const { toast } = useToast();
  const sport = useSport();
  
  // Live Practice state
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [liveTitle, setLiveTitle] = useState("");
  const [liveDuration, setLiveDuration] = useState(90);
  const [activePractice, setActivePractice] = useState<Practice | null>(null);
  const { data: activePractices = [] } = useActivePractices();
  const startPractice = useStartPractice();
  
  // Check for active practice - only update if we don't have a local practice set
  useEffect(() => {
    if (activePractices.length > 0 && !activePractice) {
      setActivePractice(activePractices[0]);
    } else if (activePractices.length === 0 && activePractice) {
      // Only clear if the practice was actually ended (API confirms no active)
      // Don't clear immediately after starting
    }
  }, [activePractices]);
  
  const handleStartPractice = async () => {
    if (!liveTitle.trim()) {
      toast({ title: "Please enter a practice title", variant: "destructive" });
      return;
    }
    try {
      const newPractice = await startPractice.mutateAsync({
        title: liveTitle,
        duration: liveDuration,
      });
      setActivePractice(newPractice);
      setStartDialogOpen(false);
      setLiveTitle("");
      toast({ title: "Practice started!", description: "Players can now be checked in." });
    } catch (err: any) {
      toast({ title: "Failed to start practice", description: err.message, variant: "destructive" });
    }
  };

  const { data: myTeams = [], isLoading: teamsLoading } = useQuery<TeamWithCount[]>({
    queryKey: ["/api/my-teams", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/my-teams?sessionId=${sessionId}`);
      if (!res.ok) throw new Error("Failed to fetch teams");
      return res.json();
    },
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery<ScheduleEvent[]>({
    queryKey: ['/api/schedule-events', sport],
  });

  const sportFilteredEvents = useMemo(() => {
    return events.filter(e => e.sport === sport);
  }, [events, sport]);

  const upcomingEvents = useMemo(() => {
    const now = startOfDay(new Date());
    return sportFilteredEvents
      .filter(e => new Date(e.startTime) >= now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 10);
  }, [sportFilteredEvents]);

  const todayEvents = useMemo(() => {
    const today = new Date();
    return sportFilteredEvents.filter(e => isToday(new Date(e.startTime)));
  }, [sportFilteredEvents]);

  const thisWeekEvents = useMemo(() => {
    const now = new Date();
    const weekEnd = addDays(now, 7);
    return sportFilteredEvents.filter(e => {
      const eventDate = new Date(e.startTime);
      return eventDate >= now && eventDate <= weekEnd;
    });
  }, [sportFilteredEvents]);

  const eventsByType = useMemo(() => {
    return {
      games: thisWeekEvents.filter(e => e.eventType === 'game').length,
      practices: thisWeekEvents.filter(e => e.eventType === 'practice').length,
      workouts: thisWeekEvents.filter(e => e.eventType === 'workout').length,
      meetings: thisWeekEvents.filter(e => e.eventType === 'meeting').length,
    };
  }, [thisWeekEvents]);

  const openAddEvent = (type: 'practice' | 'game' | 'workout' | 'meeting') => {
    setDefaultEventType(type);
    setAddEventOpen(true);
  };

  if (!teamsLoading && myTeams.length === 0) {
    return (
      <Paywall requiredTier="coach_pro" featureName="Team Hub">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4" data-testid="team-hub-no-team">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Users className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-display uppercase tracking-wide text-white mb-2">
            No Team Yet
          </h2>
          <p className="text-muted-foreground max-w-md mb-6">
            Create or join a team to access the Team Hub. Schedule practices, games, and manage your roster all in one place.
          </p>
          <Button 
            onClick={() => navigate('/teams')} 
            className="gap-2"
            data-testid="button-create-team"
          >
            <Plus className="w-4 h-4" />
            Create or Join a Team
          </Button>
        </div>
      </Paywall>
    );
  }

  return (
    <Paywall requiredTier="coach_pro" featureName="Team Hub">
      <div className="space-y-6" data-testid="team-hub-page">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display uppercase tracking-wide bg-gradient-to-b from-white to-accent/20 bg-clip-text text-transparent">
              Team Hub
            </h1>
            <p className="text-accent/50 mt-1">
              Manage your team schedule and events
            </p>
          </div>
          <Link href="/schedule">
            <Button variant="outline" className="gap-2" data-testid="button-view-calendar">
              <Calendar className="w-4 h-4" />
              View Full Calendar
            </Button>
          </Link>
        </div>

        {/* Quick Actions */}
        <Card className="border-white/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-display uppercase tracking-wide flex items-center gap-2">
              <CalendarPlus className="w-5 h-5 text-primary" />
              Quick Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div 
                role="button"
                tabIndex={0}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border cursor-pointer bg-green-500/10 border-green-500/30 hover-elevate active-elevate-2 transition-colors"
                onClick={() => openAddEvent('practice')}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openAddEvent('practice')}
                data-testid="button-schedule-practice"
              >
                <Target className="w-6 h-6 text-green-400" />
                <span className="text-sm font-medium">Practice</span>
              </div>
              <div 
                role="button"
                tabIndex={0}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border cursor-pointer bg-orange-500/10 border-orange-500/30 hover-elevate active-elevate-2 transition-colors"
                onClick={() => openAddEvent('game')}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openAddEvent('game')}
                data-testid="button-schedule-game"
              >
                <Trophy className="w-6 h-6 text-orange-400" />
                <span className="text-sm font-medium">Game</span>
              </div>
              <div 
                role="button"
                tabIndex={0}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border cursor-pointer bg-blue-500/10 border-blue-500/30 hover-elevate active-elevate-2 transition-colors"
                onClick={() => openAddEvent('workout')}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openAddEvent('workout')}
                data-testid="button-schedule-workout"
              >
                <Dumbbell className="w-6 h-6 text-blue-400" />
                <span className="text-sm font-medium">Workout</span>
              </div>
              <div 
                role="button"
                tabIndex={0}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border cursor-pointer bg-purple-500/10 border-purple-500/30 hover-elevate active-elevate-2 transition-colors"
                onClick={() => openAddEvent('meeting')}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openAddEvent('meeting')}
                data-testid="button-schedule-meeting"
              >
                <Users className="w-6 h-6 text-purple-400" />
                <span className="text-sm font-medium">Meeting</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Practice Section */}
        {activePractice ? (
          <LivePractice 
            practice={activePractice} 
            onBack={() => setActivePractice(null)} 
            onEnd={() => setActivePractice(null)}
          />
        ) : (
          <Card className="border-white/10 border-l-4 border-l-green-500" data-testid="card-live-practice">
            <CardHeader className="pb-4 flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-lg font-display uppercase tracking-wide flex items-center gap-2">
                <Radio className="w-5 h-5 text-green-400" />
                Live Practice
              </CardTitle>
              <Dialog open={startDialogOpen} onOpenChange={setStartDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-green-600" data-testid="button-hub-start-practice">
                    <Play className="w-4 h-4" />
                    Start Practice
                  </Button>
                </DialogTrigger>
                <DialogContent data-testid="dialog-hub-start-practice">
                  <DialogHeader>
                    <DialogTitle className="font-display uppercase tracking-wide">Start Live Practice</DialogTitle>
                    <DialogDescription>
                      Begin a live practice session to track attendance and run drills in real-time.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="hub-practice-title">Practice Title</Label>
                      <Input
                        id="hub-practice-title"
                        placeholder="e.g., Morning Shooting Drills"
                        value={liveTitle}
                        onChange={(e) => setLiveTitle(e.target.value)}
                        data-testid="input-hub-live-title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hub-practice-duration">Planned Duration (minutes)</Label>
                      <Input
                        id="hub-practice-duration"
                        type="number"
                        min={15}
                        max={240}
                        value={liveDuration}
                        onChange={(e) => setLiveDuration(Number(e.target.value))}
                        data-testid="input-hub-live-duration"
                      />
                    </div>
                    <Button 
                      className="w-full gap-2" 
                      onClick={handleStartPractice}
                      disabled={startPractice.isPending}
                      data-testid="button-hub-confirm-start"
                    >
                      {startPractice.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      Start Practice
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5">
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Timer className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">No active practice</p>
                  <p className="text-xs text-muted-foreground/60">Start a practice to check in players and run drills</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Overview */}
          <Card className="border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-display uppercase tracking-wide">
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10">
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-orange-400" />
                  <span className="text-sm">Games</span>
                </div>
                <span className="text-xl font-bold">{eventsByType.games}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-green-400" />
                  <span className="text-sm">Practices</span>
                </div>
                <span className="text-xl font-bold">{eventsByType.practices}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10">
                <div className="flex items-center gap-3">
                  <Dumbbell className="w-5 h-5 text-blue-400" />
                  <span className="text-sm">Workouts</span>
                </div>
                <span className="text-xl font-bold">{eventsByType.workouts}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-400" />
                  <span className="text-sm">Meetings</span>
                </div>
                <span className="text-xl font-bold">{eventsByType.meetings}</span>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card className="border-white/10 lg:col-span-2">
            <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-lg font-display uppercase tracking-wide flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Upcoming Events
              </CardTitle>
              <Button 
                size="sm" 
                variant="ghost" 
                className="gap-1"
                onClick={() => setAddEventOpen(true)}
                data-testid="button-add-event"
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))}
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground text-sm">No upcoming events</p>
                  <Button 
                    size="sm" 
                    className="mt-3"
                    onClick={() => setAddEventOpen(true)}
                    data-testid="button-schedule-first-event"
                  >
                    Schedule Your First Event
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {upcomingEvents.map(event => {
                    const eventDate = new Date(event.startTime);
                    return (
                      <div 
                        key={event.id} 
                        className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        data-testid={`event-item-${event.id}`}
                      >
                        <div className={`
                          w-10 h-10 rounded-lg flex items-center justify-center
                          ${event.eventType === 'game' ? 'bg-orange-500/20' : ''}
                          ${event.eventType === 'practice' ? 'bg-green-500/20' : ''}
                          ${event.eventType === 'workout' ? 'bg-blue-500/20' : ''}
                          ${event.eventType === 'meeting' ? 'bg-purple-500/20' : ''}
                          ${!['game', 'practice', 'workout', 'meeting'].includes(event.eventType) ? 'bg-muted/50' : ''}
                        `}>
                          <EventTypeIcon type={event.eventType} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{event.title}</span>
                            <EventTypeBadge type={event.eventType} />
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span>{formatEventDate(eventDate)} at {format(eventDate, 'h:mm a')}</span>
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {event.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* My Teams */}
        <Card className="border-white/10">
          <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg font-display uppercase tracking-wide flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              My Teams
            </CardTitle>
            <Link href="/teams">
              <Button size="sm" variant="ghost" className="gap-1" data-testid="button-manage-teams">
                Manage Teams
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {teamsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2].map(i => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
              </div>
            ) : myTeams.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground text-sm">No teams yet</p>
                <Link href="/teams">
                  <Button size="sm" className="mt-3" data-testid="button-create-join-team">
                    Create or Join a Team
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myTeams.map(team => (
                  <Link key={team.id} href="/teams">
                    <div 
                      className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                      data-testid={`team-card-${team.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{team.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        {todayEvents.length > 0 && (
          <Card className="border-white/10 border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-display uppercase tracking-wide">
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {todayEvents.map(event => {
                  const eventDate = new Date(event.startTime);
                  return (
                    <div 
                      key={event.id} 
                      className="flex items-center gap-3 p-3 rounded-lg bg-primary/10"
                    >
                      <EventTypeIcon type={event.eventType} />
                      <div className="flex-1">
                        <span className="font-medium">{event.title}</span>
                        <span className="text-muted-foreground text-sm ml-2">
                          {format(eventDate, 'h:mm a')}
                        </span>
                      </div>
                      <EventTypeBadge type={event.eventType} />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <AddEventModal 
          open={addEventOpen} 
          onOpenChange={setAddEventOpen}
          defaultEventType={defaultEventType}
        />
      </div>
    </Paywall>
  );
}
