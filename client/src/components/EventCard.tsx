import { Calendar, Dumbbell, Users, Clock, MapPin, Pencil, Trash2, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type ScheduleEvent } from "@shared/schema";
import { format } from "date-fns";

type EventCardProps = {
  event: ScheduleEvent;
  onEdit?: (event: ScheduleEvent) => void;
  onDelete?: (event: ScheduleEvent) => void;
};

const eventTypeConfig: Record<string, { icon: React.ComponentType<{ className?: string }>, color: string }> = {
  game: { icon: Calendar, color: "text-orange-400" },
  practice: { icon: Dumbbell, color: "text-green-400" },
  workout: { icon: Dumbbell, color: "text-blue-400" },
  meeting: { icon: Users, color: "text-purple-400" },
  other: { icon: ClipboardList, color: "text-muted-foreground" },
};

export function EventCard({ event, onEdit, onDelete }: EventCardProps) {
  const config = eventTypeConfig[event.eventType] || eventTypeConfig.other;
  const Icon = config.icon;
  const startTime = new Date(event.startTime);
  const endTime = event.endTime ? new Date(event.endTime) : null;

  return (
    <div className="rounded-lg p-4 space-y-3" data-testid={`event-card-${event.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`p-2 rounded-lg bg-white/5 ${config.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white truncate" data-testid={`event-title-${event.id}`}>
              {event.title}
            </h4>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {event.eventType}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onEdit && (
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 text-muted-foreground hover:text-white"
              onClick={() => onEdit(event)}
              data-testid={`button-edit-event-${event.id}`}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 text-muted-foreground hover:text-red-400"
              onClick={() => onDelete(event)}
              data-testid={`button-delete-event-${event.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>
            {format(startTime, "MMM d, yyyy 'at' h:mm a")}
            {endTime && ` - ${format(endTime, "h:mm a")}`}
          </span>
        </div>
        {event.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span data-testid={`event-location-${event.id}`}>{event.location}</span>
          </div>
        )}
      </div>

      {event.description && (
        <p className="text-sm text-muted-foreground border-t border-white/10 pt-3">
          {event.description}
        </p>
      )}
    </div>
  );
}
