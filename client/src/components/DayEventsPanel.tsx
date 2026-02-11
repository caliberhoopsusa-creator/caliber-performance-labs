import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/EventCard";
import { type ScheduleEvent } from "@shared/schema";
import { Plus, CalendarDays } from "lucide-react";
import { format, isSameDay } from "date-fns";

type DayEventsPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  events: ScheduleEvent[];
  onAddEvent: () => void;
  onEditEvent?: (event: ScheduleEvent) => void;
  onDeleteEvent?: (event: ScheduleEvent) => void;
};

export function DayEventsPanel({ 
  open, 
  onOpenChange, 
  selectedDate, 
  events, 
  onAddEvent,
  onEditEvent,
  onDeleteEvent 
}: DayEventsPanelProps) {
  const dayEvents = events.filter(event => 
    selectedDate && isSameDay(new Date(event.startTime), selectedDate)
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md border-white/10 overflow-y-auto" data-testid="day-events-panel">
        <SheetHeader className="space-y-1">
          <SheetTitle className="text-xl font-display uppercase tracking-wide flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            {selectedDate ? format(selectedDate, "EEEE, MMMM d") : "Events"}
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
            {dayEvents.length === 0 
              ? "No events scheduled for this day" 
              : `${dayEvents.length} event${dayEvents.length !== 1 ? 's' : ''} scheduled`
            }
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <Button 
            onClick={onAddEvent}
            className="w-full"
            data-testid="button-add-event-panel"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Event for {selectedDate ? format(selectedDate, "MMM d") : "this day"}
          </Button>

          {dayEvents.length > 0 ? (
            <div className="space-y-3">
              {dayEvents.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onEdit={onEditEvent}
                  onDelete={onDeleteEvent}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                No events on this day yet.
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Click the button above to schedule something.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
