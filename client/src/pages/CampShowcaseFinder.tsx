import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useSport } from "@/components/SportToggle";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Heart,
  Clock,
  Trophy,
  Dribbble,
  Building,
  GraduationCap,
  Target,
  Filter,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, isAfter } from "date-fns";

interface College {
  id: number;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
}

interface RecruitingEvent {
  id: number;
  name: string;
  sport: string;
  eventType: string;
  description: string | null;
  hostOrganization: string | null;
  collegeId: number | null;
  location: string;
  city: string | null;
  state: string | null;
  startDate: string;
  endDate: string | null;
  registrationDeadline: string | null;
  cost: number | null;
  isFree: boolean | null;
  registrationUrl: string | null;
  contactEmail: string | null;
  ageGroups: string | null;
  positions: string | null;
  maxParticipants: number | null;
  spotsRemaining: number | null;
  isVerified: boolean | null;
}

interface EventWithCollege {
  event: RecruitingEvent;
  college: College | null;
}

interface PlayerEventRegistration {
  id: number;
  playerId: number;
  eventId: number;
  status: string;
}

const US_STATES = [
  { value: "all", label: "All States" },
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

const EVENT_TYPES = [
  { value: "all", label: "All Types" },
  { value: "camp", label: "Camp" },
  { value: "showcase", label: "Showcase" },
  { value: "combine", label: "Combine" },
  { value: "tournament", label: "Tournament" },
  { value: "prospect_day", label: "Prospect Day" },
];

const EVENT_TYPE_COLORS: Record<string, string> = {
  camp: "bg-gradient-to-r from-emerald-500 to-green-500 text-white",
  showcase: "bg-gradient-to-r from-cyan-500 to-blue-500 text-white",
  combine: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
  tournament: "bg-gradient-to-r from-purple-500 to-violet-500 text-white",
  prospect_day: "bg-gradient-to-r from-rose-500 to-pink-500 text-white",
};

function formatEventType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatCost(cost: number | null, isFree: boolean | null): string {
  if (isFree) return "Free";
  if (cost === null) return "TBD";
  return `$${(cost / 100).toFixed(0)}`;
}

function formatDateRange(startDate: string, endDate: string | null): string {
  const start = parseISO(startDate);
  if (!endDate) return format(start, "MMM d, yyyy");
  const end = parseISO(endDate);
  if (format(start, "yyyy-MM") === format(end, "yyyy-MM")) {
    return `${format(start, "MMM d")} - ${format(end, "d, yyyy")}`;
  }
  return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
}

interface EventCardProps {
  eventData: EventWithCollege;
  isSaved: boolean;
  onToggleSave: (eventId: number, isSaved: boolean) => void;
  isPending: boolean;
}

function EventCard({ eventData, isSaved, onToggleSave, isPending }: EventCardProps) {
  const { event, college } = eventData;
  const typeColor = EVENT_TYPE_COLORS[event.eventType] || "bg-muted text-foreground";
  const hasDeadlinePassed = event.registrationDeadline && isAfter(new Date(), parseISO(event.registrationDeadline));

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover-elevate",
        "bg-gradient-to-br from-[hsl(220,25%,10%)] via-[hsl(220,20%,8%)] to-[hsl(220,25%,6%)]",
        "border-cyan-500/10"
      )}
      data-testid={`event-card-${event.id}`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

      <div className="p-4 md:p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge className={cn("text-xs font-semibold", typeColor)}>
                {formatEventType(event.eventType)}
              </Badge>
              {event.isFree && (
                <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10 text-xs">
                  Free
                </Badge>
              )}
              {event.isVerified && (
                <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 bg-cyan-500/10 text-xs">
                  Verified
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-white text-lg leading-tight line-clamp-2">
              {event.name}
            </h3>
          </div>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => onToggleSave(event.id, isSaved)}
            disabled={isPending}
            className={cn(
              "flex-shrink-0 transition-colors",
              isSaved
                ? "text-rose-400 hover:text-rose-300"
                : "text-muted-foreground hover:text-rose-400"
            )}
            data-testid={`button-save-event-${event.id}`}
          >
            <Heart className={cn("w-5 h-5", isSaved && "fill-current")} />
          </Button>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span className="text-white">{formatDateRange(event.startDate, event.endDate)}</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span className="truncate">
              {[event.city, event.state].filter(Boolean).join(", ") || event.location}
            </span>
          </div>

          {(college || event.hostOrganization) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              {college ? (
                <GraduationCap className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              ) : (
                <Building className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              )}
              <span className="truncate">
                {college?.name || event.hostOrganization}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 pt-2 flex-wrap">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-cyan-400" />
              <span className={cn(
                "font-medium",
                event.isFree ? "text-emerald-400" : "text-white"
              )}>
                {formatCost(event.cost, event.isFree)}
              </span>
            </div>

            {event.spotsRemaining !== null && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span className={cn(
                  "text-sm",
                  event.spotsRemaining <= 10 ? "text-amber-400" : "text-muted-foreground"
                )}>
                  {event.spotsRemaining} spots left
                </span>
              </div>
            )}
          </div>

          {event.registrationDeadline && (
            <div className="flex items-center gap-2 pt-1">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className={cn(
                "text-sm",
                hasDeadlinePassed ? "text-rose-400" : "text-muted-foreground"
              )}>
                {hasDeadlinePassed ? "Deadline passed" : `Register by ${format(parseISO(event.registrationDeadline), "MMM d, yyyy")}`}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function EventCardSkeleton() {
  return (
    <Card className="p-4 md:p-5 bg-gradient-to-br from-[hsl(220,25%,10%)] to-[hsl(220,25%,6%)] border-cyan-500/10">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-12" />
            </div>
            <Skeleton className="h-6 w-3/4" />
          </div>
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </Card>
  );
}

export default function CampShowcaseFinder() {
  const { user } = useAuth();
  const { toast } = useToast();
  const playerId = (user as any)?.playerId;
  const currentSport = useSport();

  const [stateFilter, setStateFilter] = useState("all");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");

  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  const { data: eventsData, isLoading: eventsLoading } = useQuery<EventWithCollege[]>({
    queryKey: [
      "/api/recruiting-events",
      { sport: currentSport, state: stateFilter, eventType: eventTypeFilter, startDate: today },
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("sport", currentSport);
      if (stateFilter !== "all") params.set("state", stateFilter);
      if (eventTypeFilter !== "all") params.set("eventType", eventTypeFilter);
      params.set("startDate", today);

      const res = await fetch(`/api/recruiting-events?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
  });

  const { data: savedEvents } = useQuery<PlayerEventRegistration[]>({
    queryKey: ["/api/players", playerId, "event-registrations"],
    enabled: !!playerId,
  });

  const savedEventIds = useMemo(() => {
    return new Set(savedEvents?.map((r) => r.eventId) ?? []);
  }, [savedEvents]);

  const saveEventMutation = useMutation({
    mutationFn: async ({ eventId, isSaved }: { eventId: number; isSaved: boolean }) => {
      if (isSaved) {
        return apiRequest("DELETE", `/api/players/${playerId}/event-registrations/${eventId}`);
      } else {
        return apiRequest("POST", `/api/players/${playerId}/event-registrations`, {
          eventId,
          status: "interested",
        });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/players", playerId, "event-registrations"] });
      toast({
        title: variables.isSaved ? "Event removed" : "Event saved",
        description: variables.isSaved
          ? "Removed from your saved events"
          : "Added to your saved events",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update saved events",
        variant: "destructive",
      });
    },
  });

  const handleToggleSave = (eventId: number, isSaved: boolean) => {
    if (!playerId) {
      toast({
        title: "Sign in required",
        description: "Please create a player profile to save events",
        variant: "destructive",
      });
      return;
    }
    saveEventMutation.mutate({ eventId, isSaved });
  };

  const clearFilters = () => {
    setStateFilter("all");
    setEventTypeFilter("all");
  };

  const hasActiveFilters = stateFilter !== "all" || eventTypeFilter !== "all";

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight flex items-center gap-3">
              <Target className="w-8 h-8 text-cyan-400" />
              Camps & Showcases
            </h1>
            <Badge
              variant="outline"
              className={cn(
                "text-xs uppercase font-semibold",
                currentSport === "basketball"
                  ? "border-orange-500/50 text-orange-400 bg-orange-500/10"
                  : "border-amber-700/50 text-amber-500 bg-amber-700/10"
              )}
            >
              {currentSport === "basketball" ? (
                <>
                  <Dribbble className="w-3 h-3 mr-1" /> Basketball
                </>
              ) : (
                <>
                  <Trophy className="w-3 h-3 mr-1" /> Football
                </>
              )}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Find {currentSport} camps, showcases, and combines to get recruited
          </p>
        </div>
      </div>

      <Card
        className={cn(
          "p-4 relative overflow-hidden",
          "bg-gradient-to-br from-[hsl(220,25%,10%)] via-[hsl(220,20%,8%)] to-[hsl(220,25%,6%)]",
          "border-cyan-500/10"
        )}
        data-testid="filter-controls"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger
              className="w-[160px] bg-white/5 border-cyan-500/20 text-white"
              data-testid="select-state-filter"
            >
              <SelectValue placeholder="Select State" />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map((state) => (
                <SelectItem key={state.value} value={state.value}>
                  {state.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
            <SelectTrigger
              className="w-[160px] bg-white/5 border-cyan-500/20 text-white"
              data-testid="select-event-type-filter"
            >
              <SelectValue placeholder="Event Type" />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-cyan-400 hover:text-cyan-300"
              data-testid="button-clear-filters"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </Card>

      {eventsLoading ? (
        <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : eventsData && eventsData.length > 0 ? (
        <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {eventsData.map((eventData) => (
            <EventCard
              key={eventData.event.id}
              eventData={eventData}
              isSaved={savedEventIds.has(eventData.event.id)}
              onToggleSave={handleToggleSave}
              isPending={saveEventMutation.isPending}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/20 flex items-center justify-center mb-6">
            <Target className="w-12 h-12 text-cyan-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Events Found</h3>
          <p className="text-muted-foreground max-w-md">
            {hasActiveFilters
              ? "No upcoming events match your filters. Try adjusting your search criteria."
              : `No upcoming ${currentSport} events found. Check back later for new camps and showcases.`}
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="mt-4 border-cyan-500/20 hover:border-cyan-400/40 hover:bg-cyan-500/10"
              data-testid="button-clear-filters-empty"
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
