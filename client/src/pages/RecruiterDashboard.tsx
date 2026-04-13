import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bookmark,
  BookmarkCheck,
  Eye,
  Search,
  GraduationCap,
  MapPin,
  User,
  Shield,
  ShieldCheck,
  X,
  Send,
  ExternalLink,
  Loader2,
  Users,
  Pencil,
  Save,
  Phone,
  Mail,
  Building,
  Ruler,
} from "lucide-react";
import { Link } from "wouter";

interface RecruiterProfile {
  id: number;
  userId: string;
  schoolName: string;
  division: string;
  title: string;
  email: string;
  phone: string;
  state: string;
  conference: string;
  isVerified: boolean;
}

interface PlayerResult {
  id: number;
  name: string;
  position: string;
  height: string;
  school: string;
  state: string;
  graduationYear: number | null;
  tier: string | null;
  openToRecruiting: boolean;
  photoUrl: string | null;
}

interface BookmarkedPlayer extends PlayerResult {
  bookmarkedAt: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getTierColor(tier: string | null): string {
  switch (tier?.toLowerCase()) {
    case "elite":
      return "bg-amber-500/15 text-amber-400";
    case "advanced":
      return "bg-purple-500/15 text-purple-400";
    case "intermediate":
      return "bg-blue-500/15 text-blue-400";
    case "developing":
      return "bg-emerald-500/15 text-emerald-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function PlayerCardSkeleton() {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="space-y-1">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>
    </Card>
  );
}

function PlayerCard({
  player,
  bookmarkedIds,
  onBookmark,
  onRemoveBookmark,
  onSendSignal,
  onLogView,
  bookmarkPending,
  signalPending,
}: {
  player: PlayerResult;
  bookmarkedIds: Set<number>;
  onBookmark: (id: number) => void;
  onRemoveBookmark: (id: number) => void;
  onSendSignal: (id: number, type: string) => void;
  onLogView: (id: number) => void;
  bookmarkPending: boolean;
  signalPending: boolean;
}) {
  const isBookmarked = bookmarkedIds.has(player.id);

  return (
    <Card
      className="p-6 hover-elevate cursor-pointer"
      data-testid={`card-player-${player.id}`}
      onClick={() => onLogView(player.id)}
    >
      <div className="flex items-center gap-4 mb-4">
        <Avatar className="h-14 w-14">
          {player.photoUrl && <AvatarImage src={player.photoUrl} alt={player.name} />}
          <AvatarFallback className="bg-accent/15 text-accent font-display text-lg">
            {getInitials(player.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-bold truncate" data-testid={`text-player-name-${player.id}`}>
            {player.name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            {player.position && <span>{player.position}</span>}
            {player.height && (
              <>
                <span className="text-border">|</span>
                <span className="flex items-center gap-1">
                  <Ruler className="w-3 h-3" />
                  {player.height}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {player.tier && (
          <Badge variant="secondary" className={getTierColor(player.tier)} data-testid={`badge-tier-${player.id}`}>
            {player.tier}
          </Badge>
        )}
        {player.openToRecruiting && (
          <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-400" data-testid={`badge-open-${player.id}`}>
            Open to Recruiting
          </Badge>
        )}
      </div>

      <div className="space-y-1 mb-4 text-sm text-muted-foreground">
        {player.school && (
          <div className="flex items-center gap-2" data-testid={`text-school-${player.id}`}>
            <GraduationCap className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{player.school}</span>
          </div>
        )}
        <div className="flex items-center gap-4 flex-wrap">
          {player.state && (
            <span className="flex items-center gap-1" data-testid={`text-state-${player.id}`}>
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {player.state}
            </span>
          )}
          {player.graduationYear && (
            <span data-testid={`text-grad-year-${player.id}`}>
              Class of {player.graduationYear}
            </span>
          )}
        </div>
      </div>

      <div
        className="flex items-center gap-2 flex-wrap"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          size="icon"
          variant={isBookmarked ? "default" : "outline"}
          onClick={() => (isBookmarked ? onRemoveBookmark(player.id) : onBookmark(player.id))}
          disabled={bookmarkPending}
          data-testid={`button-bookmark-${player.id}`}
        >
          {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
        </Button>

        <Select
          onValueChange={(value) => onSendSignal(player.id, value)}
          disabled={signalPending}
        >
          <SelectTrigger className="w-[160px]" data-testid={`select-signal-${player.id}`}>
            <div className="flex items-center gap-2">
              <Send className="w-3.5 h-3.5" />
              <SelectValue placeholder="Send Signal" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="watching">Watching</SelectItem>
            <SelectItem value="interested">Interested</SelectItem>
            <SelectItem value="requesting_film">Requesting Film</SelectItem>
          </SelectContent>
        </Select>

        <Link href={`/players/${player.id}`}>
          <Button size="icon" variant="outline" data-testid={`button-view-profile-${player.id}`}>
            <ExternalLink className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}

function SearchPlayersTab({
  bookmarkedIds,
  onBookmark,
  onRemoveBookmark,
  onSendSignal,
  onLogView,
  bookmarkPending,
  signalPending,
}: {
  bookmarkedIds: Set<number>;
  onBookmark: (id: number) => void;
  onRemoveBookmark: (id: number) => void;
  onSendSignal: (id: number, type: string) => void;
  onLogView: (id: number) => void;
  bookmarkPending: boolean;
  signalPending: boolean;
}) {
  const [positionFilter, setPositionFilter] = useState<string>("");
  const [stateFilter, setStateFilter] = useState("");
  const [gradYearFilter, setGradYearFilter] = useState("");
  const [openOnlyFilter, setOpenOnlyFilter] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const queryParams = new URLSearchParams();
  if (positionFilter) queryParams.set("position", positionFilter);
  if (stateFilter) queryParams.set("state", stateFilter);
  if (gradYearFilter) queryParams.set("graduationYear", gradYearFilter);
  if (openOnlyFilter) queryParams.set("openToRecruiting", "true");

  const queryString = queryParams.toString();

  const { data: players, isLoading } = useQuery<PlayerResult[]>({
    queryKey: ["/api/recruiter/players", queryString],
    queryFn: async () => {
      const url = queryString
        ? `/api/recruiter/players?${queryString}`
        : "/api/recruiter/players";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch players");
      return res.json();
    },
  });

  const hasFilters = positionFilter || stateFilter || gradYearFilter || openOnlyFilter || verifiedOnly;

  const displayedPlayers = verifiedOnly
    ? (players || []).filter((p: any) => p.verifiedAthlete)
    : players;

  const clearFilters = () => {
    setPositionFilter("");
    setStateFilter("");
    setGradYearFilter("");
    setOpenOnlyFilter(false);
    setVerifiedOnly(false);
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Position</Label>
            <Select
              value={positionFilter}
              onValueChange={setPositionFilter}
            >
              <SelectTrigger className="w-[140px]" data-testid="select-filter-position">
                <SelectValue placeholder="All Positions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                <SelectItem value="Guard">Guard</SelectItem>
                <SelectItem value="Wing">Wing</SelectItem>
                <SelectItem value="Big">Big</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">State</Label>
            <Input
              placeholder="e.g. TX"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-[120px]"
              data-testid="input-filter-state"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Graduation Year</Label>
            <Input
              placeholder="e.g. 2026"
              value={gradYearFilter}
              onChange={(e) => setGradYearFilter(e.target.value)}
              className="w-[120px]"
              data-testid="input-filter-grad-year"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={openOnlyFilter}
              onCheckedChange={setOpenOnlyFilter}
              data-testid="switch-filter-open"
            />
            <Label className="text-sm cursor-pointer">Open to Recruiting</Label>
          </div>

          <button
            onClick={() => setVerifiedOnly(!verifiedOnly)}
            data-testid="button-filter-verified"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              verifiedOnly
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:text-gray-200'
            }`}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Verified Only
          </button>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              data-testid="button-clear-filters"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <PlayerCardSkeleton key={i} />
          ))}
        </div>
      ) : displayedPlayers && displayedPlayers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="grid-players">
          {displayedPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              bookmarkedIds={bookmarkedIds}
              onBookmark={onBookmark}
              onRemoveBookmark={onRemoveBookmark}
              onSendSignal={onSendSignal}
              onLogView={onLogView}
              bookmarkPending={bookmarkPending}
              signalPending={signalPending}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="empty-search">
          <Search className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-display text-lg font-bold mb-1">No Players Found</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {hasFilters
              ? "Try adjusting your filters to find more players."
              : "No players are currently available. Check back later."}
          </p>
        </div>
      )}
    </div>
  );
}

function BookmarksTab({
  bookmarkedIds,
  onRemoveBookmark,
  onSendSignal,
  onLogView,
  bookmarkPending,
  signalPending,
}: {
  bookmarkedIds: Set<number>;
  onRemoveBookmark: (id: number) => void;
  onSendSignal: (id: number, type: string) => void;
  onLogView: (id: number) => void;
  bookmarkPending: boolean;
  signalPending: boolean;
}) {
  const { data: bookmarks, isLoading } = useQuery<BookmarkedPlayer[]>({
    queryKey: ["/api/recruiter/bookmarks"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <PlayerCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!bookmarks || bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="empty-bookmarks">
        <Bookmark className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <h3 className="font-display text-lg font-bold mb-1">No Bookmarks Yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Bookmark players from the Search tab to keep track of prospects you are interested in.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="grid-bookmarks">
      {bookmarks.map((player) => (
        <PlayerCard
          key={player.id}
          player={player}
          bookmarkedIds={bookmarkedIds}
          onBookmark={() => {}}
          onRemoveBookmark={onRemoveBookmark}
          onSendSignal={onSendSignal}
          onLogView={onLogView}
          bookmarkPending={bookmarkPending}
          signalPending={signalPending}
        />
      ))}
    </div>
  );
}

function ProfileTab() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<RecruiterProfile>>({});

  const { data: profile, isLoading } = useQuery<RecruiterProfile>({
    queryKey: ["/api/recruiter/profile"],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<RecruiterProfile>) => {
      await apiRequest("PATCH", "/api/recruiter/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruiter/profile"] });
      setIsEditing(false);
      toast({ title: "Profile updated", description: "Your recruiter profile has been saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to update profile.", variant: "destructive" });
    },
  });

  const startEditing = () => {
    if (profile) {
      setFormData({
        schoolName: profile.schoolName,
        division: profile.division,
        title: profile.title,
        email: profile.email,
        phone: profile.phone,
        state: profile.state,
        conference: profile.conference,
      });
    }
    setIsEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-40" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="empty-profile">
        <User className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <h3 className="font-display text-lg font-bold mb-1">No Profile Found</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Your recruiter profile has not been set up yet.
        </p>
      </div>
    );
  }

  const profileFields = [
    { label: "School", value: profile.schoolName, icon: Building, key: "schoolName" },
    { label: "Division", value: profile.division, icon: Shield, key: "division" },
    { label: "Title", value: profile.title, icon: User, key: "title" },
    { label: "Email", value: profile.email, icon: Mail, key: "email" },
    { label: "Phone", value: profile.phone, icon: Phone, key: "phone" },
    { label: "State", value: profile.state, icon: MapPin, key: "state" },
    { label: "Conference", value: profile.conference, icon: GraduationCap, key: "conference" },
  ];

  return (
    <Card className="p-6" data-testid="card-recruiter-profile">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-accent/15 text-accent font-display text-xl">
              {getInitials(profile.schoolName || "RC")}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-2xl font-bold" data-testid="text-profile-school">
                {profile.schoolName || "Recruiter"}
              </h2>
              {profile.isVerified && (
                <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-400" data-testid="badge-verified">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground" data-testid="text-profile-title">
              {profile.title || "College Recruiter"}
            </p>
          </div>
        </div>

        {isEditing ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateMutation.isPending}
              data-testid="button-save-profile"
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              Save
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={startEditing}
            data-testid="button-edit-profile"
          >
            <Pencil className="w-4 h-4 mr-1" />
            Edit
          </Button>
        )}
      </div>

      {profile.division && !isEditing && (
        <div className="mb-6">
          <Badge variant="secondary" data-testid="badge-division">
            {profile.division}
          </Badge>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {profileFields.map((field) => {
          const Icon = field.icon;
          return (
            <div key={field.key} data-testid={`field-${field.key}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  {field.label}
                </span>
              </div>
              {isEditing ? (
                <Input
                  value={(formData as any)[field.key] || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  data-testid={`input-${field.key}`}
                />
              ) : (
                <p className="text-sm font-medium" data-testid={`text-${field.key}`}>
                  {field.value || "---"}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default function RecruiterDashboard() {
  const [activeTab, setActiveTab] = useState("search");
  const { toast } = useToast();

  const { data: bookmarks } = useQuery<BookmarkedPlayer[]>({
    queryKey: ["/api/recruiter/bookmarks"],
  });

  const bookmarkedIds = new Set((bookmarks || []).map((b) => b.id));

  const bookmarkMutation = useMutation({
    mutationFn: async (playerId: number) => {
      await apiRequest("POST", `/api/recruiter/bookmarks/${playerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruiter/bookmarks"] });
      toast({ title: "Player bookmarked" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const removeBookmarkMutation = useMutation({
    mutationFn: async (playerId: number) => {
      await apiRequest("DELETE", `/api/recruiter/bookmarks/${playerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruiter/bookmarks"] });
      toast({ title: "Bookmark removed" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const signalMutation = useMutation({
    mutationFn: async ({ playerId, signalType }: { playerId: number; signalType: string }) => {
      await apiRequest("POST", `/api/recruiter/signals/${playerId}`, { signalType });
    },
    onSuccess: () => {
      toast({ title: "Signal sent", description: "The player has been notified of your interest." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const viewMutation = useMutation({
    mutationFn: async (playerId: number) => {
      await apiRequest("POST", `/api/recruiter/views/${playerId}`);
    },
  });

  const handleBookmark = (playerId: number) => bookmarkMutation.mutate(playerId);
  const handleRemoveBookmark = (playerId: number) => removeBookmarkMutation.mutate(playerId);
  const handleSendSignal = (playerId: number, signalType: string) =>
    signalMutation.mutate({ playerId, signalType });
  const handleLogView = (playerId: number) => viewMutation.mutate(playerId);

  return (
    <div className="space-y-6 pb-20" data-testid="page-recruiter-dashboard">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Users className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold uppercase tracking-tight text-foreground">
              Recruiter Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Browse and evaluate basketball prospects
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList
          className="w-full justify-start bg-card border border-border p-1 rounded-xl overflow-x-auto flex-nowrap"
          data-testid="recruiter-tabs"
        >
          <TabsTrigger
            value="search"
            className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            data-testid="tab-search"
          >
            <Search className="w-4 h-4" />
            Search Players
          </TabsTrigger>
          <TabsTrigger
            value="bookmarks"
            className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            data-testid="tab-bookmarks"
          >
            <Bookmark className="w-4 h-4" />
            My Bookmarks
            {bookmarkedIds.size > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {bookmarkedIds.size}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="profile"
            className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            data-testid="tab-profile"
          >
            <User className="w-4 h-4" />
            My Profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-6">
          <SearchPlayersTab
            bookmarkedIds={bookmarkedIds}
            onBookmark={handleBookmark}
            onRemoveBookmark={handleRemoveBookmark}
            onSendSignal={handleSendSignal}
            onLogView={handleLogView}
            bookmarkPending={bookmarkMutation.isPending || removeBookmarkMutation.isPending}
            signalPending={signalMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="bookmarks" className="mt-6">
          <BookmarksTab
            bookmarkedIds={bookmarkedIds}
            onRemoveBookmark={handleRemoveBookmark}
            onSendSignal={handleSendSignal}
            onLogView={handleLogView}
            bookmarkPending={removeBookmarkMutation.isPending}
            signalPending={signalMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <ProfileTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
