import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Eye,
  Heart,
  Film,
  Binoculars,
  ShieldCheck,
  ShieldOff,
  Users,
  Bell,
  Activity,
  Lock,
  Globe,
  Link as LinkIcon,
  EyeOff,
  School,
  BookOpen,
  Mail,
  Phone,
  Loader2,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ViewEntry {
  id: number;
  viewedAt: string;
  recruiterName: string;
  recruiterTitle: string;
  recruiterDivision: string;
  recruiterState: string;
  recruiterId: number;
  isVerified: boolean;
}

interface SignalEntry {
  id: number;
  signalType: string;
  message: string | null;
  isRead: boolean;
  createdAt: string;
  recruiterName: string;
  recruiterTitle: string;
  recruiterDivision: string;
  recruiterId: number;
  isVerified: boolean;
}

interface BlockedRecruiter {
  id: number;
  playerId: number;
  recruiterId: number;
  reason: string | null;
  createdAt: string;
}

interface WhosWatchingData {
  views: ViewEntry[];
  signals: SignalEntry[];
  totalViews: number;
  unreadSignals: number;
  blockedRecruiters: BlockedRecruiter[];
}

interface PlayerVisibility {
  profileVisibility?: string;
  showEmail?: boolean;
  showPhone?: boolean;
  showSchool?: boolean;
  showGpa?: boolean;
  openToRecruiting?: boolean;
}

type TimeGroup = "Today" | "This Week" | "Earlier";

function getTimeGroup(dateStr: string): TimeGroup {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 1 && date.getDate() === now.getDate()) return "Today";
  if (diffDays < 7) return "This Week";
  return "Earlier";
}

function getDivisionColor(division: string): string {
  switch (division?.toUpperCase()) {
    case "D1":
      return "bg-amber-500/15 text-amber-400";
    case "D2":
      return "bg-blue-500/15 text-blue-400";
    case "D3":
      return "bg-emerald-500/15 text-emerald-400";
    case "NAIA":
      return "bg-purple-500/15 text-purple-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getSignalIcon(type: string) {
  switch (type) {
    case "interested":
      return Heart;
    case "requesting_film":
      return Film;
    case "watching":
      return Binoculars;
    default:
      return Eye;
  }
}

function getSignalBadgeStyle(type: string): string {
  switch (type) {
    case "watching":
      return "bg-blue-500/15 text-blue-400";
    case "interested":
      return "bg-emerald-500/15 text-emerald-400";
    case "requesting_film":
      return "bg-amber-500/15 text-amber-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getSignalLabel(type: string): string {
  switch (type) {
    case "watching":
      return "Watching";
    case "interested":
      return "Interested";
    case "requesting_film":
      return "Requesting Film";
    default:
      return type;
  }
}

type ActivityItem = {
  id: string;
  type: "view" | "signal";
  recruiterName: string;
  recruiterTitle: string;
  recruiterDivision: string;
  recruiterId: number;
  isVerified: boolean;
  timestamp: string;
  signalType?: string;
  message?: string | null;
};

function HeaderSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-5 w-80" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-20 rounded-md" />
        <Skeleton className="h-20 rounded-md" />
        <Skeleton className="h-20 rounded-md" />
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i} className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function ActivityEntry({
  item,
  onBlock,
  blockPending,
}: {
  item: ActivityItem;
  onBlock: (recruiterId: number) => void;
  blockPending: boolean;
}) {
  const Icon = item.type === "signal" && item.signalType
    ? getSignalIcon(item.signalType)
    : Eye;

  return (
    <Card
      className="p-4 group"
      data-testid={`activity-entry-${item.id}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-accent/10 shrink-0">
          <Icon className="w-5 h-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display text-base font-bold truncate" data-testid={`text-recruiter-name-${item.id}`}>
              {item.recruiterName}
            </span>
            {item.isVerified && (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            {item.recruiterDivision && (
              <Badge
                variant="secondary"
                className={getDivisionColor(item.recruiterDivision)}
                data-testid={`badge-division-${item.id}`}
              >
                {item.recruiterDivision}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate" data-testid={`text-recruiter-title-${item.id}`}>
            {item.recruiterTitle}
          </p>
          {item.message && (
            <p className="text-sm mt-2 text-foreground/80 italic" data-testid={`text-message-${item.id}`}>
              "{item.message}"
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground whitespace-nowrap" data-testid={`text-time-${item.id}`}>
            {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="invisible group-hover:visible"
            onClick={() => onBlock(item.recruiterId)}
            disabled={blockPending}
            data-testid={`button-block-${item.id}`}
          >
            <ShieldOff className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function RecruiterActivityTab({
  data,
  onBlock,
  blockPending,
}: {
  data: WhosWatchingData;
  onBlock: (recruiterId: number) => void;
  blockPending: boolean;
}) {
  const allItems: ActivityItem[] = [
    ...data.views.map((v) => ({
      id: `view-${v.id}`,
      type: "view" as const,
      recruiterName: v.recruiterName,
      recruiterTitle: v.recruiterTitle,
      recruiterDivision: v.recruiterDivision,
      recruiterId: v.recruiterId,
      isVerified: v.isVerified,
      timestamp: v.viewedAt,
    })),
    ...data.signals.map((s) => ({
      id: `signal-${s.id}`,
      type: "signal" as const,
      recruiterName: s.recruiterName,
      recruiterTitle: s.recruiterTitle,
      recruiterDivision: s.recruiterDivision,
      recruiterId: s.recruiterId,
      isVerified: s.isVerified,
      timestamp: s.createdAt,
      signalType: s.signalType,
      message: s.message,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (allItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="empty-activity">
        <Eye className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <h3 className="font-display text-lg font-bold mb-1">No Recruiter Activity Yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Make sure your profile is public and you are opted in to recruiting.
        </p>
      </div>
    );
  }

  const grouped: Record<TimeGroup, ActivityItem[]> = {
    Today: [],
    "This Week": [],
    Earlier: [],
  };

  allItems.forEach((item) => {
    const group = getTimeGroup(item.timestamp);
    grouped[group].push(item);
  });

  const groups: TimeGroup[] = ["Today", "This Week", "Earlier"];

  return (
    <div className="space-y-6" data-testid="activity-feed">
      {groups.map((group) => {
        const items = grouped[group];
        if (items.length === 0) return null;
        return (
          <div key={group}>
            <h3 className="font-display text-sm uppercase tracking-wider text-muted-foreground mb-3" data-testid={`group-${group.toLowerCase().replace(/\s+/g, "-")}`}>
              {group}
            </h3>
            <div className="space-y-3">
              {items.map((item) => (
                <ActivityEntry
                  key={item.id}
                  item={item}
                  onBlock={onBlock}
                  blockPending={blockPending}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InterestSignalsTab({
  signals,
  onBlock,
  blockPending,
}: {
  signals: SignalEntry[];
  onBlock: (recruiterId: number) => void;
  blockPending: boolean;
}) {
  if (signals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="empty-signals">
        <Bell className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <h3 className="font-display text-lg font-bold mb-1">No Interest Signals Yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          When recruiters express interest in your profile, their signals will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="signals-grid">
      {signals.map((signal) => {
        const Icon = getSignalIcon(signal.signalType);
        return (
          <Card key={signal.id} className="p-4 group" data-testid={`signal-card-${signal.id}`}>
            <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
              <Badge
                variant="secondary"
                className={getSignalBadgeStyle(signal.signalType)}
                data-testid={`badge-signal-type-${signal.id}`}
              >
                <Icon className="w-3 h-3 mr-1" />
                {getSignalLabel(signal.signalType)}
              </Badge>
              <span className="text-xs text-muted-foreground" data-testid={`text-signal-time-${signal.id}`}>
                {formatDistanceToNow(new Date(signal.createdAt), { addSuffix: true })}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-display text-base font-bold" data-testid={`text-signal-school-${signal.id}`}>
                {signal.recruiterName}
              </span>
              {signal.isVerified && (
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              {signal.recruiterDivision && (
                <Badge variant="secondary" className={getDivisionColor(signal.recruiterDivision)}>
                  {signal.recruiterDivision}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2" data-testid={`text-signal-title-${signal.id}`}>
              {signal.recruiterTitle}
            </p>
            {signal.message && (
              <p className="text-sm text-foreground/80 italic" data-testid={`text-signal-message-${signal.id}`}>
                "{signal.message}"
              </p>
            )}
            <div className="flex justify-end mt-2">
              <Button
                size="icon"
                variant="ghost"
                className="invisible group-hover:visible"
                onClick={() => onBlock(signal.recruiterId)}
                disabled={blockPending}
                data-testid={`button-block-signal-${signal.id}`}
              >
                <ShieldOff className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function PrivacySettingsTab({
  playerId,
  blockedRecruiters,
  onUnblock,
  unblockPending,
}: {
  playerId: number;
  blockedRecruiters: BlockedRecruiter[];
  onUnblock: (recruiterId: number) => void;
  unblockPending: boolean;
}) {
  const { toast } = useToast();

  const { data: player, isLoading } = useQuery<any>({
    queryKey: ["/api/players", playerId],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch player");
      return res.json();
    },
    enabled: !!playerId,
  });

  const visibilityMutation = useMutation({
    mutationFn: async (data: PlayerVisibility) => {
      await apiRequest("PATCH", `/api/players/${playerId}/visibility`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players", playerId] });
      queryClient.invalidateQueries({ queryKey: ["/api/players", playerId, "whos-watching"] });
      toast({ title: "Settings updated", description: "Your visibility preferences have been saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to update settings.", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24 rounded-md" />
            <Skeleton className="h-24 rounded-md" />
            <Skeleton className="h-24 rounded-md" />
          </div>
        </Card>
        <Card className="p-6 space-y-4">
          <Skeleton className="h-6 w-40" />
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </Card>
      </div>
    );
  }

  const currentVisibility = player?.profileVisibility || "public";
  const showEmail = player?.showEmail ?? true;
  const showPhone = player?.showPhone ?? true;
  const showSchool = player?.showSchool ?? true;
  const showGpa = player?.showGpa ?? true;
  const openToRecruiting = player?.openToRecruiting ?? false;

  const visibilityOptions = [
    {
      value: "public",
      label: "Public",
      description: "Your profile appears in the recruiter directory",
      icon: Globe,
    },
    {
      value: "link_only",
      label: "Link Only",
      description: "Only people with your profile link can view it",
      icon: LinkIcon,
    },
    {
      value: "hidden",
      label: "Hidden",
      description: "Your profile is not visible to recruiters",
      icon: EyeOff,
    },
  ];

  const contactToggles = [
    { key: "showSchool", label: "Show School", value: showSchool, icon: School },
    { key: "showGpa", label: "Show GPA", value: showGpa, icon: BookOpen },
    { key: "showEmail", label: "Show Email", value: showEmail, icon: Mail },
    { key: "showPhone", label: "Show Phone", value: showPhone, icon: Phone },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6" data-testid="card-profile-visibility">
        <h3 className="font-display text-lg font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-accent" />
          Profile Visibility
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {visibilityOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = currentVisibility === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => visibilityMutation.mutate({ profileVisibility: opt.value })}
                disabled={visibilityMutation.isPending}
                className={`p-4 rounded-md border-2 text-left transition-colors ${
                  isSelected
                    ? "border-accent bg-accent/10"
                    : "border-border hover-elevate"
                }`}
                data-testid={`button-visibility-${opt.value}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-5 h-5 ${isSelected ? "text-accent" : "text-muted-foreground"}`} />
                  <span className={`font-display text-base font-bold ${isSelected ? "text-accent" : ""}`}>
                    {opt.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{opt.description}</p>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="p-6" data-testid="card-open-to-recruiting">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg font-bold uppercase tracking-wider mb-1">
              Open to Recruiting
            </h3>
            <p className="text-sm text-muted-foreground">
              Flag yourself as actively looking for recruitment opportunities. This boosts your visibility in recruiter searches.
            </p>
          </div>
          <Switch
            checked={openToRecruiting}
            onCheckedChange={(val) => visibilityMutation.mutate({ openToRecruiting: val })}
            disabled={visibilityMutation.isPending}
            data-testid="switch-open-to-recruiting"
          />
        </div>
      </Card>

      <Card className="p-6" data-testid="card-contact-visibility">
        <h3 className="font-display text-lg font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-accent" />
          Contact Info Visibility
        </h3>
        <div className="space-y-4">
          {contactToggles.map((toggle) => {
            const Icon = toggle.icon;
            return (
              <div
                key={toggle.key}
                className="flex items-center justify-between gap-4"
                data-testid={`toggle-row-${toggle.key}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm cursor-pointer">{toggle.label}</Label>
                </div>
                <Switch
                  checked={toggle.value}
                  onCheckedChange={(val) =>
                    visibilityMutation.mutate({ [toggle.key]: val })
                  }
                  disabled={visibilityMutation.isPending}
                  data-testid={`switch-${toggle.key}`}
                />
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6" data-testid="card-blocked-recruiters">
        <h3 className="font-display text-lg font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
          <ShieldOff className="w-5 h-5 text-accent" />
          Blocked Recruiters
        </h3>
        {blockedRecruiters.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="empty-blocked">
            No blocked recruiters. You can block recruiters from the activity feed.
          </p>
        ) : (
          <div className="space-y-3">
            {blockedRecruiters.map((blocked) => (
              <div
                key={blocked.id}
                className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/50"
                data-testid={`blocked-recruiter-${blocked.id}`}
              >
                <div>
                  <span className="text-sm font-medium">Recruiter #{blocked.recruiterId}</span>
                  {blocked.reason && (
                    <p className="text-xs text-muted-foreground">{blocked.reason}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUnblock(blocked.recruiterId)}
                  disabled={unblockPending}
                  data-testid={`button-unblock-${blocked.id}`}
                >
                  {unblockPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4 mr-1" />
                  )}
                  Unblock
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default function WhosWatching() {
  const [activeTab, setActiveTab] = useState("activity");
  const { toast } = useToast();

  const { data: user } = useQuery<any>({ queryKey: ["/api/users/me"] });
  const playerId = user?.playerId;

  const { data, isLoading } = useQuery<WhosWatchingData>({
    queryKey: ["/api/players", playerId, "whos-watching"],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}/whos-watching`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch data");
      return res.json();
    },
    enabled: !!playerId,
  });

  const blockMutation = useMutation({
    mutationFn: async (recruiterId: number) => {
      await apiRequest("POST", `/api/players/${playerId}/block-recruiter/${recruiterId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players", playerId, "whos-watching"] });
      toast({ title: "Recruiter blocked", description: "This recruiter can no longer view your profile." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to block recruiter.", variant: "destructive" });
    },
  });

  const unblockMutation = useMutation({
    mutationFn: async (recruiterId: number) => {
      await apiRequest("DELETE", `/api/players/${playerId}/block-recruiter/${recruiterId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players", playerId, "whos-watching"] });
      toast({ title: "Recruiter unblocked", description: "This recruiter can view your profile again." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to unblock recruiter.", variant: "destructive" });
    },
  });

  if (!playerId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="no-player">
        <Eye className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <h3 className="font-display text-lg font-bold mb-1">No Player Profile</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          You need a player profile to see recruiter activity.
        </p>
      </div>
    );
  }

  const totalViews = data?.totalViews ?? 0;
  const unreadSignals = data?.unreadSignals ?? 0;
  const uniquePrograms = data
    ? new Set(data.views.map((v) => v.recruiterName)).size
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {isLoading ? (
        <HeaderSkeleton />
      ) : (
        <>
          <div>
            <h1 className="font-display text-4xl font-bold uppercase tracking-wider" data-testid="text-page-title">
              WHO'S WATCHING
            </h1>
            <p className="text-muted-foreground mt-1" data-testid="text-page-subtitle">
              See which college programs are looking at your profile
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 text-center" data-testid="stat-total-views">
              <Eye className="w-6 h-6 text-accent mx-auto mb-2" />
              <p className="font-display text-2xl font-bold">{totalViews}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Views</p>
            </Card>
            <Card className="p-4 text-center" data-testid="stat-interest-signals">
              <Bell className="w-6 h-6 text-accent mx-auto mb-2" />
              <p className="font-display text-2xl font-bold">{unreadSignals}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Interest Signals</p>
            </Card>
            <Card className="p-4 text-center" data-testid="stat-unique-programs">
              <Users className="w-6 h-6 text-accent mx-auto mb-2" />
              <p className="font-display text-2xl font-bold">{uniquePrograms}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Unique Programs</p>
            </Card>
          </div>
        </>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3" data-testid="tabs-whos-watching">
          <TabsTrigger value="activity" data-testid="tab-activity">
            <Activity className="w-4 h-4 mr-2" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="signals" data-testid="tab-signals">
            <Bell className="w-4 h-4 mr-2" />
            Signals
          </TabsTrigger>
          <TabsTrigger value="privacy" data-testid="tab-privacy">
            <Lock className="w-4 h-4 mr-2" />
            Privacy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="mt-6">
          {isLoading ? (
            <ActivitySkeleton />
          ) : data ? (
            <RecruiterActivityTab
              data={data}
              onBlock={(id) => blockMutation.mutate(id)}
              blockPending={blockMutation.isPending}
            />
          ) : null}
        </TabsContent>

        <TabsContent value="signals" className="mt-6">
          {isLoading ? (
            <ActivitySkeleton />
          ) : data ? (
            <InterestSignalsTab
              signals={data.signals}
              onBlock={(id) => blockMutation.mutate(id)}
              blockPending={blockMutation.isPending}
            />
          ) : null}
        </TabsContent>

        <TabsContent value="privacy" className="mt-6">
          <PrivacySettingsTab
            playerId={playerId}
            blockedRecruiters={data?.blockedRecruiters ?? []}
            onUnblock={(id) => unblockMutation.mutate(id)}
            unblockPending={unblockMutation.isPending}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
