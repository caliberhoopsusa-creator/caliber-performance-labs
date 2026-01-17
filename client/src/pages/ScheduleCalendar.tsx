import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AddEventModal } from "@/components/AddEventModal";
import { DayEventsPanel } from "@/components/DayEventsPanel";
import { EventCard } from "@/components/EventCard";
import { type ScheduleEvent } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays,
  Calendar as CalendarIcon
} from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isSameMonth, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday
} from "date-fns";

export default function ScheduleCalendar() {
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDayPanelOpen, setIsDayPanelOpen] = useState(false);
  const [addEventDefaultDate, setAddEventDefaultDate] = useState<Date | undefined>(undefined);

  const { data: events = [], isLoading } = useQuery<ScheduleEvent[]>({
    queryKey: ['/api/schedule-events'],
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      await apiRequest('DELETE', `/api/schedule-events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedule-events'] });
      toast({
        title: "Event deleted",
        description: "The event has been removed from your schedule.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete event",
        variant: "destructive",
      });
    },
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const eventsByDay = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    events.forEach(event => {
      const dateKey = format(new Date(event.startTime), 'yyyy-MM-dd');
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, event]);
    });
    return map;
  }, [events]);

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    return events
      .filter(e => new Date(e.startTime) >= today)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 5);
  }, [events]);

  function handleDayClick(day: Date) {
    setSelectedDate(day);
    setIsDayPanelOpen(true);
  }

  function handleAddEvent() {
    setAddEventDefaultDate(undefined);
    setIsAddModalOpen(true);
  }

  function handleAddEventForDay() {
    if (selectedDate) {
      setAddEventDefaultDate(selectedDate);
    }
    setIsDayPanelOpen(false);
    setIsAddModalOpen(true);
  }

  function handleDeleteEvent(event: ScheduleEvent) {
    if (confirm(`Delete "${event.title}"?`)) {
      deleteEventMutation.mutate(event.id);
    }
  }

  function goToPreviousMonth() {
    setCurrentMonth(subMonths(currentMonth, 1));
  }

  function goToNextMonth() {
    setCurrentMonth(addMonths(currentMonth, 1));
  }

  function goToToday() {
    setCurrentMonth(new Date());
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6" data-testid="schedule-calendar-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-wide uppercase text-white flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-primary" />
            Schedule
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage practices, games, and workouts
          </p>
        </div>
        <Button onClick={handleAddEvent} data-testid="button-add-event">
          <Plus className="w-4 h-4 mr-2" />
          Add Event
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="glass-card border-white/10">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-display uppercase tracking-wide flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  {format(currentMonth, 'MMMM yyyy')}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={goToToday}
                    data-testid="button-today"
                  >
                    Today
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={goToPreviousMonth}
                    data-testid="button-prev-month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={goToNextMonth}
                    data-testid="button-next-month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 35 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 rounded-lg" />
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekDays.map(day => (
                      <div 
                        key={day} 
                        className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider py-2"
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, idx) => {
                      const dateKey = format(day, 'yyyy-MM-dd');
                      const dayEvents = eventsByDay.get(dateKey) || [];
                      const hasEvents = dayEvents.length > 0;
                      const isCurrentMonth = isSameMonth(day, currentMonth);
                      const isSelected = selectedDate && isSameDay(day, selectedDate);
                      const isCurrentDay = isToday(day);

                      return (
                        <button
                          key={idx}
                          onClick={() => handleDayClick(day)}
                          className={`
                            relative h-20 p-2 rounded-lg transition-all duration-200 text-left
                            ${isCurrentMonth 
                              ? 'bg-white/5 hover:bg-white/10' 
                              : 'bg-transparent text-muted-foreground/50 hover:bg-white/5'
                            }
                            ${isSelected ? 'ring-2 ring-primary bg-primary/10' : ''}
                            ${isCurrentDay ? 'border border-primary/50' : ''}
                          `}
                          data-testid={`calendar-day-${dateKey}`}
                        >
                          <span className={`
                            text-sm font-medium
                            ${isCurrentDay ? 'text-primary font-bold' : ''}
                            ${!isCurrentMonth ? 'text-muted-foreground/50' : ''}
                          `}>
                            {format(day, 'd')}
                          </span>
                          
                          {hasEvents && (
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                              {dayEvents.slice(0, 3).map((event, i) => (
                                <span 
                                  key={i}
                                  className={`
                                    w-1.5 h-1.5 rounded-full
                                    ${event.eventType === 'game' ? 'bg-orange-400' : ''}
                                    ${event.eventType === 'practice' ? 'bg-green-400' : ''}
                                    ${event.eventType === 'workout' ? 'bg-blue-400' : ''}
                                    ${event.eventType === 'meeting' ? 'bg-purple-400' : ''}
                                    ${!['game', 'practice', 'workout', 'meeting'].includes(event.eventType) ? 'bg-primary' : ''}
                                  `}
                                />
                              ))}
                              {dayEvents.length > 3 && (
                                <span className="text-[10px] text-muted-foreground">
                                  +{dayEvents.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-lg font-display uppercase tracking-wide">
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-lg" />
                  ))}
                </div>
              ) : upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map(event => (
                    <EventCard 
                      key={event.id} 
                      event={event} 
                      onDelete={handleDeleteEvent}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarDays className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground text-sm">
                    No upcoming events
                  </p>
                  <Button 
                    variant="ghost" 
                    onClick={handleAddEvent}
                    className="text-primary mt-2"
                  >
                    Schedule something
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-white/10 mt-6">
            <CardHeader>
              <CardTitle className="text-lg font-display uppercase tracking-wide">
                Event Types
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full bg-orange-400" />
                <span className="text-muted-foreground">Games</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full bg-green-400" />
                <span className="text-muted-foreground">Practices</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full bg-blue-400" />
                <span className="text-muted-foreground">Workouts</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full bg-purple-400" />
                <span className="text-muted-foreground">Meetings</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AddEventModal 
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        defaultDate={addEventDefaultDate}
      />

      <DayEventsPanel
        open={isDayPanelOpen}
        onOpenChange={setIsDayPanelOpen}
        selectedDate={selectedDate}
        events={events}
        onAddEvent={handleAddEventForDay}
        onDeleteEvent={handleDeleteEvent}
      />
    </div>
  );
}
