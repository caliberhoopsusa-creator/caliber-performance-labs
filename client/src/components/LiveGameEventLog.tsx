import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Undo2,
  CircleDot,
  Target,
  Check,
  X,
  ArrowDownToLine,
  Handshake,
  Zap,
  Shield,
  RotateCcw,
  Flag,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveGameEvent {
  id: number;
  eventType: string;
  quarter: number;
  gameTime: string | null;
  createdAt: string | null;
}

interface LiveGameEventLogProps {
  events: LiveGameEvent[];
  onUndo?: (eventId: number) => void;
  isUndoing?: boolean;
}

/**
 * Disciplined, icon-driven event vocabulary — no emoji, no rainbow.
 * Tone: emerald = made/positive, platinum (accent) = effort/defense,
 * red = negative (turnover/foul), muted = misses.
 */
const EVENT_LABELS: Record<
  string,
  { label: string; icon: LucideIcon; color: string }
> = {
  made_2pt: { label: "+2 Made", icon: CircleDot, color: "text-emerald-400" },
  missed_2pt: { label: "2PT Miss", icon: X, color: "text-muted-foreground" },
  made_3pt: { label: "+3 Made", icon: Target, color: "text-emerald-400" },
  missed_3pt: { label: "3PT Miss", icon: X, color: "text-muted-foreground" },
  made_ft: { label: "+1 FT", icon: Check, color: "text-emerald-400" },
  missed_ft: { label: "FT Miss", icon: X, color: "text-muted-foreground" },
  rebound: { label: "Rebound", icon: ArrowDownToLine, color: "text-accent" },
  assist: { label: "Assist", icon: Handshake, color: "text-accent" },
  steal: { label: "Steal", icon: Zap, color: "text-accent" },
  block: { label: "Block", icon: Shield, color: "text-accent" },
  turnover: { label: "Turnover", icon: RotateCcw, color: "text-red-400" },
  foul: { label: "Foul", icon: Flag, color: "text-red-400" },
};

export function LiveGameEventLog({ events, onUndo, isUndoing }: LiveGameEventLogProps) {
  const sortedEvents = [...events].sort((a, b) => 
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
  
  const lastEventId = sortedEvents.length > 0 ? sortedEvents[0].id : null;

  if (events.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm" data-testid="event-log-empty">
        No events logged yet
      </div>
    );
  }

  return (
    <ScrollArea className="h-[200px]" data-testid="event-log">
      <div className="space-y-2 p-1">
        {sortedEvents.map((event) => {
          const config = EVENT_LABELS[event.eventType] || { label: event.eventType, icon: CircleDot, color: "text-foreground" };
          const Icon = config.icon;
          const isLast = event.id === lastEventId;
          
          return (
            <div 
              key={event.id}
              className={cn(
                "flex items-center justify-between p-2 rounded-md bg-card/50 border border-border/50 transition-all",
                isLast && "ring-1 ring-accent/30"
              )}
              data-testid={`event-${event.id}`}
            >
              <div className="flex items-center gap-2.5">
                <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04]", config.color)}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div>
                  <span className={cn("font-medium text-sm", config.color)}>
                    {config.label}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    Q{event.quarter}
                    {event.gameTime && ` • ${event.gameTime}`}
                  </span>
                </div>
              </div>
              {isLast && onUndo && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => onUndo(event.id)}
                  disabled={isUndoing}
                  data-testid="button-undo"
                >
                  <Undo2 className="w-3 h-3 mr-1" />
                  Undo
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
