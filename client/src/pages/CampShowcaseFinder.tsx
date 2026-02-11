import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useSport } from "@/components/SportToggle";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  Plus,
  Loader2,
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

interface Team {
  id: number;
  name: string;
  code: string;
  createdBy: string;
  profilePicture: string | null;
}

function getSessionId(): string {
  let sessionId = localStorage.getItem("caliber_session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("caliber_session_id", sessionId);
  }
  return sessionId;
}

const addEventFormSchema = z.object({
  teamId: z.string().min(1, "Please select a team"),
  name: z.string().min(1, "Event name is required"),
  eventType: z.enum(["camp", "showcase", "combine", "tournament", "prospect_day"]),
  sport: z.string().min(1, "Sport is required"),
  location: z.string().min(1, "Location is required"),
  city: z.string().optional(),
  state: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  registrationDeadline: z.string().optional(),
  cost: z.string().optional(),
  isFree: z.boolean().default(false),
  registrationUrl: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  description: z.string().optional(),
});

type AddEventFormData = z.infer<typeof addEventFormSchema>;

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
  showcase: "bg-accent text-white",
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
        "border-border"
      )}
      data-testid={`event-card-${event.id}`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

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
                <Badge variant="outline" className="border-accent/50 text-accent bg-accent/10 text-xs">
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
            <Calendar className="w-4 h-4 text-accent flex-shrink-0" />
            <span className="text-white">{formatDateRange(event.startDate, event.endDate)}</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4 text-accent flex-shrink-0" />
            <span className="truncate">
              {[event.city, event.state].filter(Boolean).join(", ") || event.location}
            </span>
          </div>

          {(college || event.hostOrganization) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              {college ? (
                <GraduationCap className="w-4 h-4 text-accent flex-shrink-0" />
              ) : (
                <Building className="w-4 h-4 text-accent flex-shrink-0" />
              )}
              <span className="truncate">
                {college?.name || event.hostOrganization}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 pt-2 flex-wrap">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-accent" />
              <span className={cn(
                "font-medium",
                event.isFree ? "text-emerald-400" : "text-white"
              )}>
                {formatCost(event.cost, event.isFree)}
              </span>
            </div>

            {event.spotsRemaining !== null && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
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
              <Clock className="w-4 h-4 text-accent" />
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
    <Card className="p-4 md:p-5 bg-gradient-to-br from-[hsl(220,25%,10%)] to-[hsl(220,25%,6%)] border-border">
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
  const isCoach = (user as any)?.role === "coach";
  const sessionId = getSessionId();

  const [stateFilter, setStateFilter] = useState("all");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false);

  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  const form = useForm<AddEventFormData>({
    resolver: zodResolver(addEventFormSchema),
    defaultValues: {
      teamId: "",
      name: "",
      eventType: "camp",
      sport: currentSport,
      location: "",
      city: "",
      state: "",
      startDate: "",
      endDate: "",
      registrationDeadline: "",
      cost: "",
      isFree: false,
      registrationUrl: "",
      contactEmail: "",
      description: "",
    },
  });

  useEffect(() => {
    form.setValue("sport", currentSport);
  }, [currentSport, form]);

  const { data: coachTeams = [] } = useQuery<Team[]>({
    queryKey: ["/api/my-teams", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/my-teams?sessionId=${sessionId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isCoach,
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: AddEventFormData) => {
      const payload = {
        name: data.name,
        eventType: data.eventType,
        sport: data.sport,
        location: data.location,
        city: data.city || null,
        state: data.state || null,
        startDate: data.startDate,
        endDate: data.endDate || null,
        registrationDeadline: data.registrationDeadline || null,
        cost: data.isFree ? null : (data.cost ? Math.round(parseFloat(data.cost) * 100) : null),
        isFree: data.isFree,
        registrationUrl: data.registrationUrl || null,
        contactEmail: data.contactEmail || null,
        description: data.description || null,
      };
      return apiRequest("POST", `/api/teams/${data.teamId}/recruiting-events`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruiting-events"] });
      toast({
        title: "Event Created",
        description: "Your recruiting event has been created successfully.",
      });
      setIsAddEventDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddEventSubmit = (data: AddEventFormData) => {
    createEventMutation.mutate(data);
  };

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
              <Target className="w-8 h-8 text-accent" />
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

        {isCoach && (
          <Button
            onClick={() => setIsAddEventDialogOpen(true)}
            className="bg-accent hover:from-accent hover:to-blue-600 text-white"
            data-testid="button-add-event"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        )}
      </div>

      <Card
        className={cn(
          "p-4 relative overflow-hidden",
          "bg-gradient-to-br from-[hsl(220,25%,10%)] via-[hsl(220,20%,8%)] to-[hsl(220,25%,6%)]",
          "border-border"
        )}
        data-testid="filter-controls"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger
              className="w-[160px] bg-white/5 border-accent/20 text-white"
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
              className="w-[160px] bg-white/5 border-accent/20 text-white"
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
              className="text-accent hover:text-accent"
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
          {eventsData
            .filter((eventData) => eventData?.event?.id)
            .map((eventData) => (
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
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 flex items-center justify-center mb-6">
            <Target className="w-12 h-12 text-accent" />
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
              className="mt-4 border-accent/20 hover:border-accent/40 hover:bg-accent/10"
              data-testid="button-clear-filters-empty"
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}

      <Dialog open={isAddEventDialogOpen} onOpenChange={setIsAddEventDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-[hsl(220,25%,12%)] to-[hsl(220,25%,8%)] border-accent/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">Create Recruiting Event</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add a new camp, showcase, or combine for your team.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddEventSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="teamId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">Team *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white/5 border-accent/20 text-white" data-testid="select-team">
                          <SelectValue placeholder="Select a team" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {coachTeams.map((team) => (
                          <SelectItem key={team.id} value={team.id.toString()}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">Event Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Summer Basketball Camp 2026"
                        className="bg-white/5 border-accent/20 text-white placeholder:text-muted-foreground"
                        data-testid="input-event-name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="eventType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">Event Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white/5 border-accent/20 text-white" data-testid="select-event-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="camp">Camp</SelectItem>
                          <SelectItem value="showcase">Showcase</SelectItem>
                          <SelectItem value="combine">Combine</SelectItem>
                          <SelectItem value="tournament">Tournament</SelectItem>
                          <SelectItem value="prospect_day">Prospect Day</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sport"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">Sport *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white/5 border-accent/20 text-white" data-testid="select-sport">
                            <SelectValue placeholder="Select sport" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="basketball">Basketball</SelectItem>
                          <SelectItem value="football">Football</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">Location *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Central High School Gymnasium"
                        className="bg-white/5 border-accent/20 text-white placeholder:text-muted-foreground"
                        data-testid="input-location"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">City</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Los Angeles"
                          className="bg-white/5 border-accent/20 text-white placeholder:text-muted-foreground"
                          data-testid="input-city"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">State</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white/5 border-accent/20 text-white" data-testid="select-state">
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {US_STATES.filter(s => s.value !== "all").map((state) => (
                            <SelectItem key={state.value} value={state.value}>
                              {state.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">Start Date *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="bg-white/5 border-accent/20 text-white"
                          data-testid="input-start-date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">End Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="bg-white/5 border-accent/20 text-white"
                          data-testid="input-end-date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="registrationDeadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">Registration Deadline</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="bg-white/5 border-accent/20 text-white"
                          data-testid="input-registration-deadline"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 items-end">
                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">Cost (USD)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g., 150.00"
                          className="bg-white/5 border-accent/20 text-white placeholder:text-muted-foreground"
                          data-testid="input-cost"
                          disabled={form.watch("isFree")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isFree"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 pb-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-is-free"
                        />
                      </FormControl>
                      <FormLabel className="text-muted-foreground font-normal cursor-pointer">
                        This event is free
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="registrationUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">Registration URL</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://..."
                        className="bg-white/5 border-accent/20 text-white placeholder:text-muted-foreground"
                        data-testid="input-registration-url"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">Contact Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="coach@example.com"
                        className="bg-white/5 border-accent/20 text-white placeholder:text-muted-foreground"
                        data-testid="input-contact-email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your event, what to expect, what to bring, etc."
                        className="bg-white/5 border-accent/20 text-white placeholder:text-muted-foreground resize-none"
                        rows={4}
                        data-testid="textarea-description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddEventDialogOpen(false)}
                  className="border-accent/20 hover:border-accent/40 hover:bg-accent/10"
                  data-testid="button-cancel-add-event"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createEventMutation.isPending}
                  className="bg-accent hover:from-accent hover:to-blue-600 text-white"
                  data-testid="button-submit-add-event"
                >
                  {createEventMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Event
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
