import { usePlayer, useDeleteGame, usePlayerBadges, useUpdatePlayer, usePlayerProgression, usePlayerSkillBadges, usePlayerAccolades, useCreateAccolade, useUpdateAccolade, useDeleteAccolade, type PlayerUpdate } from "@/hooks/use-basketball";
import { GoalsPanel } from "@/components/GoalsPanel";
import { SocialEngagement } from "@/components/SocialEngagement";
import { PlayerProgression } from "@/components/PlayerProgression";
import { SkillBadges } from "@/components/SkillBadges";
import { GameNotes } from "@/components/GameNotes";
import { DrillRecommendations } from "@/components/DrillRecommendations";
import { CoachGoals } from "@/components/CoachGoals";
import { ImprovementReport } from "@/components/ImprovementReport";
import { PreGameReport } from "@/components/PreGameReport";
import { PlayerReportCard } from "@/components/PlayerReportCard";
import { FollowButton } from "@/components/FollowButton";
import { FollowStats } from "@/components/FollowStats";
import { FollowersList } from "@/components/FollowersList";
import { FollowingList } from "@/components/FollowingList";
import { ShareModal } from "@/components/ShareModal";
import { ShareablePlayerCard } from "@/components/ShareablePlayerCard";
import { ShareableGameCard } from "@/components/ShareableGameCard";
import { ShareableBadgeCard } from "@/components/ShareableBadgeCard";
import { HighlightsGallery } from "@/components/HighlightsGallery";
import { useAuth } from "@/hooks/use-auth";
import { useRoute, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/StatCard";
import { GradeBadge } from "@/components/GradeBadge";
import { PlayerArchetype } from "@/components/PlayerArchetype";
import { ArrowLeft, Plus, Trash2, Award, ClipboardList, Activity, Target, Clock, Star, Shield, Zap, CheckCircle, Flame, Trophy, Share2, BarChart3, Medal, User, ChevronRight, ChevronDown, TrendingUp, Pencil, Camera, Upload, X, FileText, Dumbbell, Film, MapPin, GraduationCap, Eye } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ObjectUploader } from "@/components/ObjectUploader";
import { BADGE_DEFINITIONS, type Badge, type Game } from "@shared/schema";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const BADGE_ICONS: Record<string, any> = {
  twenty_piece: Target,
  thirty_bomb: Target,
  double_double: Award,
  triple_double: Award,
  ironman: Clock,
  efficiency_master: Star,
  lockdown: Shield,
  hustle_king: Zap,
  clean_sheet: CheckCircle,
  hot_streak_3: Flame,
  hot_streak_5: Flame,
  sharpshooter: Target,
};

const GRADE_VALUES: Record<string, number> = {
  'A+': 100, 'A': 95, 'A-': 90,
  'B+': 88, 'B': 85, 'B-': 80,
  'C+': 78, 'C': 75, 'C-': 70,
  'D+': 68, 'D': 65, 'D-': 60,
  'F': 50,
};

function getGradeValue(grade: string | null): number {
  if (!grade) return 0;
  return GRADE_VALUES[grade.trim().toUpperCase()] || 0;
}

function getAverageGrade(games: Game[]): string {
  if (games.length === 0) return "—";
  const totalValue = games.reduce((acc, g) => acc + getGradeValue(g.grade), 0);
  const avgValue = totalValue / games.length;
  
  if (avgValue >= 97) return "A+";
  if (avgValue >= 92) return "A";
  if (avgValue >= 87) return "A-";
  if (avgValue >= 84) return "B+";
  if (avgValue >= 81) return "B";
  if (avgValue >= 77) return "B-";
  if (avgValue >= 74) return "C+";
  if (avgValue >= 71) return "C";
  if (avgValue >= 67) return "C-";
  if (avgValue >= 64) return "D+";
  if (avgValue >= 61) return "D";
  if (avgValue >= 55) return "D-";
  return "F";
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface CoachToolsSectionProps {
  playerId: number;
  games: Game[];
}

function CoachToolsSection({ playerId, games }: CoachToolsSectionProps) {
  const [showReportCard, setShowReportCard] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(games[0]?.id || null);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold font-display text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" /> Coach Goals
          </h3>
          <CoachGoals playerId={playerId} />
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold font-display text-white mb-4 flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary" /> Drill Recommendations
          </h3>
          <DrillRecommendations playerId={playerId} />
        </Card>
      </div>

      {games.length > 0 && selectedGameId && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" /> Game Notes
            </h3>
            <Select
              value={selectedGameId?.toString() || ""}
              onValueChange={(val) => setSelectedGameId(parseInt(val))}
            >
              <SelectTrigger className="w-auto bg-secondary/30 border-white/10" data-testid="select-game-for-notes">
                <SelectValue placeholder="Select a game" />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/10">
                {games.map(game => (
                  <SelectItem key={game.id} value={game.id.toString()}>
                    vs {game.opponent} - {format(new Date(game.date), 'MMM dd, yyyy')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <GameNotes gameId={selectedGameId} playerId={playerId} />
        </Card>
      )}

      <ImprovementReport playerId={playerId} />

      <PreGameReport playerId={playerId} />

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> Player Report Card
          </h3>
          <Button 
            onClick={() => setShowReportCard(!showReportCard)}
            variant={showReportCard ? "secondary" : "default"}
            className="gap-2"
            data-testid="button-toggle-report-card"
          >
            <FileText className="w-4 h-4" />
            {showReportCard ? "Hide Report Card" : "Generate Report Card"}
          </Button>
        </div>
        {showReportCard && <PlayerReportCard playerId={playerId} />}
      </Card>
    </div>
  );
}

const ACCOLADE_TYPES = {
  championship: { name: "Championship", icon: Trophy, color: "text-amber-500", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/20" },
  career_high: { name: "Career High", icon: TrendingUp, color: "text-primary", bgColor: "bg-primary/10", borderColor: "border-primary/20" },
  award: { name: "Award", icon: Medal, color: "text-purple-500", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/20" },
  record: { name: "Record", icon: Star, color: "text-orange-500", bgColor: "bg-orange-500/10", borderColor: "border-orange-500/20" },
} as const;

type AccoladeType = keyof typeof ACCOLADE_TYPES;

const accoladeFormSchema = z.object({
  type: z.enum(["championship", "career_high", "award", "record"]),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(500).optional(),
  season: z.string().max(20).optional(),
  dateEarned: z.string().optional(),
});
type AccoladeFormValues = z.infer<typeof accoladeFormSchema>;

interface AccoladesSectionProps {
  playerId: number;
  isOwnProfile: boolean;
}

function AccoladesSection({ playerId, isOwnProfile }: AccoladesSectionProps) {
  const { data: accolades = [], isLoading } = usePlayerAccolades(playerId);
  const createAccolade = useCreateAccolade();
  const updateAccolade = useUpdateAccolade();
  const deleteAccolade = useDeleteAccolade();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const accoladeForm = useForm<AccoladeFormValues>({
    resolver: zodResolver(accoladeFormSchema),
    defaultValues: {
      type: "championship",
      title: "",
      description: "",
      season: "",
      dateEarned: "",
    },
  });

  const openAddDialog = () => {
    accoladeForm.reset({
      type: "championship",
      title: "",
      description: "",
      season: "",
      dateEarned: "",
    });
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (accolade: any) => {
    accoladeForm.reset({
      type: accolade.type,
      title: accolade.title,
      description: accolade.description || "",
      season: accolade.season || "",
      dateEarned: accolade.dateEarned || "",
    });
    setEditingId(accolade.id);
    setIsDialogOpen(true);
  };

  const onSubmit = (values: AccoladeFormValues) => {
    const data = {
      type: values.type,
      title: values.title,
      description: values.description || undefined,
      season: values.season || undefined,
      dateEarned: values.dateEarned || undefined,
    };

    if (editingId) {
      updateAccolade.mutate(
        { id: editingId, playerId, ...data },
        {
          onSuccess: () => {
            toast({ title: "Accolade Updated", description: "Your accolade has been updated." });
            setIsDialogOpen(false);
          },
          onError: () => {
            toast({ title: "Error", description: "Failed to update accolade.", variant: "destructive" });
          },
        }
      );
    } else {
      createAccolade.mutate(
        { playerId, ...data },
        {
          onSuccess: () => {
            toast({ title: "Accolade Added", description: "Your accolade has been added." });
            setIsDialogOpen(false);
          },
          onError: () => {
            toast({ title: "Error", description: "Failed to add accolade.", variant: "destructive" });
          },
        }
      );
    }
  };

  const handleDelete = (accoladeId: number) => {
    deleteAccolade.mutate(
      { id: accoladeId, playerId },
      {
        onSuccess: () => {
          toast({ title: "Accolade Deleted", description: "Your accolade has been removed." });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to delete accolade.", variant: "destructive" });
        },
      }
    );
  };

  const groupedAccolades = useMemo(() => {
    const groups: Record<string, typeof accolades> = {
      championship: [],
      career_high: [],
      award: [],
      record: [],
    };
    accolades.forEach((a) => {
      if (groups[a.type]) {
        groups[a.type].push(a);
      }
    });
    return groups;
  }, [accolades]);

  if (isLoading) {
    return (
      <Card className="p-6" data-testid="accolades-section">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6" data-testid="accolades-section">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" /> Achievements & Accolades
        </h3>
        {isOwnProfile && (
          <Button onClick={openAddDialog} className="gap-2" data-testid="button-add-accolade">
            <Plus className="w-4 h-4" /> Add Accolade
          </Button>
        )}
      </div>

      {accolades.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground mb-2">No accolades yet.</p>
          {isOwnProfile && (
            <p className="text-sm text-muted-foreground">
              Add your championships, career highs, awards, and records to showcase your achievements.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(ACCOLADE_TYPES).map(([type, config]) => {
            const typeAccolades = groupedAccolades[type] || [];
            if (typeAccolades.length === 0) return null;

            const IconComponent = config.icon;
            return (
              <div key={type}>
                <h4 className={cn("text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2", config.color)}>
                  <IconComponent className="w-4 h-4" /> {config.name}s
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {typeAccolades.map((accolade) => (
                    <div
                      key={accolade.id}
                      className={cn(
                        "p-4 rounded-xl border transition-colors group",
                        config.bgColor,
                        config.borderColor
                      )}
                      data-testid={`accolade-card-${accolade.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-white truncate">{accolade.title}</h5>
                          {(accolade.season || accolade.dateEarned) && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {accolade.season && <span>{accolade.season}</span>}
                              {accolade.season && accolade.dateEarned && <span className="mx-1">•</span>}
                              {accolade.dateEarned && (
                                <span>{format(new Date(accolade.dateEarned), 'MMM d, yyyy')}</span>
                              )}
                            </p>
                          )}
                          {accolade.description && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {accolade.description}
                            </p>
                          )}
                        </div>
                        {isOwnProfile && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEditDialog(accolade)}
                              data-testid={`button-edit-accolade-${accolade.id}`}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-destructive"
                                  data-testid={`button-delete-accolade-${accolade.id}`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-card border-white/10 text-white">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Accolade?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-muted-foreground">
                                    This will permanently remove this accolade from your profile.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-secondary text-white border-transparent">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(accolade.id)}
                                    className="bg-destructive text-destructive-foreground"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-display uppercase tracking-wide">
              {editingId ? "Edit Accolade" : "Add Accolade"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingId
                ? "Update your achievement details."
                : "Add a new achievement to your profile."}
            </DialogDescription>
          </DialogHeader>

          <Form {...accoladeForm}>
            <form onSubmit={accoladeForm.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <FormField
                control={accoladeForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-secondary/30 border-white/10 text-white" data-testid="select-accolade-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card border-white/10 text-white">
                        <SelectItem value="championship">Championship</SelectItem>
                        <SelectItem value="career_high">Career High</SelectItem>
                        <SelectItem value="award">Award</SelectItem>
                        <SelectItem value="record">Record</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={accoladeForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                      Title <span className="text-red-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., State Championship, Career High: 45 Points"
                        className="bg-secondary/30 border-white/10 text-white placeholder:text-white/20"
                        data-testid="input-accolade-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={accoladeForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Add details about this achievement..."
                        rows={3}
                        className="bg-secondary/30 border-white/10 text-white placeholder:text-white/20 resize-none"
                        data-testid="textarea-accolade-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={accoladeForm.control}
                  name="season"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Season</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., 2024-25"
                          className="bg-secondary/30 border-white/10 text-white placeholder:text-white/20"
                          data-testid="input-accolade-season"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={accoladeForm.control}
                  name="dateEarned"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Date Earned</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          className="bg-secondary/30 border-white/10 text-white"
                          data-testid="input-accolade-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel-accolade">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createAccolade.isPending || updateAccolade.isPending}
                  data-testid="button-save-accolade"
                >
                  {createAccolade.isPending || updateAccolade.isPending
                    ? "Saving..."
                    : editingId
                    ? "Save Changes"
                    : "Add Accolade"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

interface FollowingPlayer {
  id: number;
  playerId: number;
  name: string;
}

export default function PlayerDetail() {
  const [, params] = useRoute("/players/:id");
  const id = Number(params?.id);
  const { data: player, isLoading } = usePlayer(id);
  const { data: badges = [], isLoading: badgesLoading } = usePlayerBadges(id);
  const { mutate: deleteGame } = useDeleteGame();
  const { mutate: updatePlayer, isPending: isUpdating } = useUpdatePlayer();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [location, navigate] = useLocation();
  const [showAllGames, setShowAllGames] = useState(false);
  const [expandedGameId, setExpandedGameId] = useState<number | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<PlayerUpdate>({});
  const [showFollowersSheet, setShowFollowersSheet] = useState(false);
  const [showFollowingSheet, setShowFollowingSheet] = useState(false);
  const [showPlayerShareModal, setShowPlayerShareModal] = useState(false);
  const [showGameShareModal, setShowGameShareModal] = useState(false);
  const [showBadgeShareModal, setShowBadgeShareModal] = useState(false);
  const [selectedShareGame, setSelectedShareGame] = useState<Game | null>(null);
  const [selectedShareBadge, setSelectedShareBadge] = useState<string | null>(null);

  const { data: progression } = usePlayerProgression(id);
  const { data: skillBadges = [] } = usePlayerSkillBadges(id);

  const { data: currentUserFollowing = [] } = useQuery<FollowingPlayer[]>({
    queryKey: ["/api/players", user?.playerId, "following"],
    enabled: isAuthenticated && !!user?.playerId,
  });

  const isOwnProfile = useMemo(() => {
    return user?.playerId === id;
  }, [user?.playerId, id]);

  const isFollowingPlayer = useMemo(() => {
    return currentUserFollowing.some(f => f.playerId === id);
  }, [currentUserFollowing, id]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('edit') === 'true' && player) {
      setIsEditDialogOpen(true);
      window.history.replaceState({}, '', `/players/${id}`);
    }
  }, [player, id]);

  useEffect(() => {
    if (player && isEditDialogOpen) {
      setEditForm({
        name: player.name,
        position: player.position as "Guard" | "Wing" | "Big",
        height: player.height || "",
        team: player.team || "",
        jerseyNumber: player.jerseyNumber || undefined,
        photoUrl: player.photoUrl || "",
        bannerUrl: player.bannerUrl || "",
        bio: player.bio || "",
        openToOpportunities: player.openToOpportunities || false,
        city: player.city || "",
        state: player.state || "",
        school: player.school || "",
        graduationYear: player.graduationYear || undefined,
      });
    }
  }, [player, isEditDialogOpen]);

  const handleSaveProfile = () => {
    updatePlayer(
      { id, updates: editForm },
      {
        onSuccess: () => {
          toast({
            title: "Profile Updated",
            description: "Your profile changes have been saved.",
          });
          setIsEditDialogOpen(false);
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to update profile. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handlePhotoUpload = async (file: { name: string; type: string }) => {
    const res = await fetch("/api/object-storage/put-presigned-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        objectDir: "public",
      }),
    });
    const data = await res.json();
    return {
      method: "PUT" as const,
      url: data.url,
      headers: { "Content-Type": file.type },
    };
  };

  const handlePhotoComplete = async (result: any) => {
    if (result.successful?.[0]) {
      const file = result.successful[0];
      const publicUrl = `/api/object-storage/public/${file.meta.name}`;
      setEditForm((prev) => ({ ...prev, photoUrl: publicUrl }));
      toast({ title: "Photo Uploaded", description: "Profile photo uploaded successfully." });
    }
  };

  const handleBannerComplete = async (result: any) => {
    if (result.successful?.[0]) {
      const file = result.successful[0];
      const publicUrl = `/api/object-storage/public/${file.meta.name}`;
      setEditForm((prev) => ({ ...prev, bannerUrl: publicUrl }));
      toast({ title: "Banner Uploaded", description: "Banner image uploaded successfully." });
    }
  };

  const handleShareProfile = () => {
    setShowPlayerShareModal(true);
  };

  const handleShareGame = (game: Game) => {
    setSelectedShareGame(game);
    setShowGameShareModal(true);
  };

  const handleShareBadge = (badgeType: string) => {
    setSelectedShareBadge(badgeType);
    setShowBadgeShareModal(true);
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied!",
      description: "Share link copied to clipboard",
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center">
        <h2 className="text-2xl font-display font-bold text-white mb-2">Player Not Found</h2>
        <Link href="/players" className="text-primary hover:underline">Return to Roster</Link>
      </div>
    );
  }

  const games = player.games || [];
  
  const avgPoints = games.length ? (games.reduce((acc, g) => acc + g.points, 0) / games.length).toFixed(1) : "—";
  const avgReb = games.length ? (games.reduce((acc, g) => acc + g.rebounds, 0) / games.length).toFixed(1) : "—";
  const avgAst = games.length ? (games.reduce((acc, g) => acc + g.assists, 0) / games.length).toFixed(1) : "—";
  const avgSteals = games.length ? (games.reduce((acc, g) => acc + g.steals, 0) / games.length).toFixed(1) : "—";
  const avgBlocks = games.length ? (games.reduce((acc, g) => acc + g.blocks, 0) / games.length).toFixed(1) : "—";
  const avgPER = games.length ? (games.reduce((acc, g) => acc + g.points + g.rebounds + g.assists, 0) / games.length).toFixed(1) : "—";
  
  const totalFgMade = games.reduce((acc, g) => acc + (g.fgMade || 0), 0);
  const totalFgAttempted = games.reduce((acc, g) => acc + (g.fgAttempted || 0), 0);
  const fgPercent = totalFgAttempted > 0 ? ((totalFgMade / totalFgAttempted) * 100).toFixed(1) : "—";
  
  const totalThreeMade = games.reduce((acc, g) => acc + (g.threeMade || 0), 0);
  const totalThreeAttempted = games.reduce((acc, g) => acc + (g.threeAttempted || 0), 0);
  const threePercent = totalThreeAttempted > 0 ? ((totalThreeMade / totalThreeAttempted) * 100).toFixed(1) : "—";
  
  const totalFtMade = games.reduce((acc, g) => acc + (g.ftMade || 0), 0);
  const totalFtAttempted = games.reduce((acc, g) => acc + (g.ftAttempted || 0), 0);
  const ftPercent = totalFtAttempted > 0 ? ((totalFtMade / totalFtAttempted) * 100).toFixed(1) : "—";
  
  const averageGrade = getAverageGrade(games);
  
  const topGames = [...games]
    .sort((a, b) => getGradeValue(b.grade) - getGradeValue(a.grade))
    .slice(0, 5);
  
  const trendData = [...games]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(g => ({
      date: format(new Date(g.date), 'MM/dd'),
      points: g.points,
      gradeVal: getGradeValue(g.grade),
      grade: g.grade
    }))
    .slice(-10);

  const sortedGames = [...games].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const displayedGames = showAllGames ? sortedGames : sortedGames.slice(0, 5);

  const avgHustle = games.length ? games.reduce((acc, g) => acc + (g.hustleScore || 50), 0) / games.length : 50;
  const avgDefense = games.length ? games.reduce((acc, g) => acc + (g.defenseRating || 50), 0) / games.length : 50;
  
  const scoringRating = games.length 
    ? Math.min(100, (parseFloat(avgPoints) / 25) * 100) 
    : 0;
  const reboundingRating = games.length 
    ? Math.min(100, (parseFloat(avgReb) / 10) * 100) 
    : 0;
  const playmakingRating = games.length 
    ? Math.min(100, (parseFloat(avgAst) / 8) * 100) 
    : 0;
  const defenseRating = avgDefense;
  const hustleRating = avgHustle;
  const efficiencyRating = fgPercent !== "—" 
    ? Math.min(100, (parseFloat(fgPercent) / 60) * 100) 
    : 50;

  const radarData = [
    { category: 'Scoring', value: Math.round(scoringRating), fullMark: 100 },
    { category: 'Rebounding', value: Math.round(reboundingRating), fullMark: 100 },
    { category: 'Playmaking', value: Math.round(playmakingRating), fullMark: 100 },
    { category: 'Defense', value: Math.round(defenseRating), fullMark: 100 },
    { category: 'Hustle', value: Math.round(hustleRating), fullMark: 100 },
    { category: 'Efficiency', value: Math.round(efficiencyRating), fullMark: 100 },
  ];

  const strengths = [...radarData].sort((a, b) => b.value - a.value).slice(0, 2);
  const weaknesses = [...radarData].sort((a, b) => a.value - b.value).slice(0, 2);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 w-full">
      <Link href="/players" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-white transition-colors uppercase tracking-wider">
        <ArrowLeft className="w-4 h-4" /> Back to Roster
      </Link>
      
      <Card className="p-4 md:p-8 relative overflow-hidden">
        <div className="flex flex-col gap-6 relative z-10">
          {/* Player Info Row */}
          <div className="flex items-start gap-4">
            <div className="relative group/avatar shrink-0">
              <Avatar className="w-16 h-16 md:w-24 md:h-24 border-2 border-primary/20">
                {player.photoUrl && <AvatarImage src={player.photoUrl} alt={player.name} />}
                <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-xl md:text-3xl font-display font-bold text-white">
                  {getInitials(player.name)}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                onClick={() => setIsEditDialogOpen(true)}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity"
                data-testid="button-edit-profile-avatar"
              >
                <Pencil className="w-3 h-3" />
              </Button>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {player.jerseyNumber && (
                  <span className="text-xl md:text-3xl font-display font-bold text-primary/80">#{player.jerseyNumber}</span>
                )}
                <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border border-primary/20">
                  {player.position}
                </span>
              </div>
              <h1 className="text-xl md:text-4xl font-display font-bold text-white uppercase tracking-tight leading-tight mb-2 break-words">
                {player.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground">
                {player.height && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 md:w-4 md:h-4" /> {player.height}
                  </span>
                )}
                {player.team && (
                  <span className="font-medium">{player.team}</span>
                )}
                <span>{games.length} Games</span>
              </div>
            </div>

            {/* Grade Badge - Desktop */}
            <div className="hidden md:flex flex-col items-center gap-1 shrink-0">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Grade</span>
              <GradeBadge grade={averageGrade} size="xl" />
            </div>
          </div>

          {/* Grade Badge - Mobile */}
          <div className="flex md:hidden justify-center">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Overall Grade</span>
              <GradeBadge grade={averageGrade} size="lg" />
            </div>
          </div>

          {/* Follow Stats */}
          {isAuthenticated && (
            <div className="flex justify-center md:justify-start">
              <FollowStats 
                playerId={id} 
                onFollowersClick={() => setShowFollowersSheet(true)}
                onFollowingClick={() => setShowFollowingSheet(true)}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            {isAuthenticated && !isOwnProfile && (
              <FollowButton 
                playerId={id} 
                initialIsFollowing={isFollowingPlayer}
              />
            )}
            {isOwnProfile && (
              <Button 
                onClick={() => setIsEditDialogOpen(true)} 
                variant="outline" 
                size="sm"
                className="gap-1.5"
                data-testid="button-edit-profile"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Button>
            )}
            <Button 
              onClick={handleShareProfile} 
              variant="outline" 
              size="sm"
              className="gap-1.5"
              data-testid="button-share-profile"
            >
              <Share2 className="w-3.5 h-3.5" /> Share
            </Button>
            <Link href={`/report-card?player=${player.id}`}>
              <Button variant="outline" size="sm" className="gap-1.5" data-testid="button-generate-report">
                <FileText className="w-3.5 h-3.5" /> Report
              </Button>
            </Link>
            {isOwnProfile && (
              <Link href={`/analyze?playerId=${player.id}`}>
                <Button size="sm" className="gap-1.5" data-testid="button-log-game">
                  <Plus className="w-3.5 h-3.5" /> Log Game
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="highlights" data-testid="tab-highlights">
            <Film className="w-4 h-4 mr-2" /> Highlights
          </TabsTrigger>
          <TabsTrigger value="accolades" data-testid="tab-accolades">
            <Trophy className="w-4 h-4 mr-2" /> Accolades
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {games.length > 0 && (
            <PlayerArchetype 
              games={games} 
              position={player.position as "Guard" | "Wing" | "Big"}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PlayerProgression playerId={player.id} />
        
        <Card className="p-4">
          <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> XP Rewards
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center justify-between p-2 rounded bg-secondary/30">
              <span className="text-muted-foreground">Log a Game</span>
              <span className="font-bold text-primary">+50 XP</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-secondary/30">
              <span className="text-muted-foreground">Earn Badge</span>
              <span className="font-bold text-primary">+25 XP</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-secondary/30">
              <span className="text-muted-foreground">A Grade</span>
              <span className="font-bold text-primary">+30 XP</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-secondary/30">
              <span className="text-muted-foreground">A+ Grade</span>
              <span className="font-bold text-primary">+50 XP</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-orange-500/10 border border-orange-500/20">
              <span className="text-orange-400">3-Day Streak</span>
              <span className="font-bold text-orange-400">+25 XP</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-orange-500/10 border border-orange-500/20">
              <span className="text-orange-400">7-Day Streak</span>
              <span className="font-bold text-orange-400">+75 XP</span>
            </div>
          </div>
        </Card>
      </div>

          <Collapsible defaultOpen={false}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                <span className="flex items-center gap-2 font-bold">
                  <Medal className="w-5 h-5 text-primary" /> Skill Badges
                </span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SkillBadges playerId={player.id} />
            </CollapsibleContent>
          </Collapsible>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h3 className="text-lg font-bold font-display text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" /> Season Statistics
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <StatCard label="Games" value={games.length} />
            <StatCard label="PPG" value={avgPoints} highlight={true} />
            <StatCard label="RPG" value={avgReb} />
            <StatCard label="APG" value={avgAst} />
            <StatCard label="PER" value={avgPER} highlight={true} />
            <StatCard label="SPG" value={avgSteals} />
            <StatCard label="BPG" value={avgBlocks} />
            <StatCard label="FG%" value={fgPercent !== "—" ? `${fgPercent}%` : "—"} />
            <StatCard label="3P%" value={threePercent !== "—" ? `${threePercent}%` : "—"} />
            <StatCard label="FT%" value={ftPercent !== "—" ? `${ftPercent}%` : "—"} />
            <div className="glass-card rounded-xl p-5 flex flex-col justify-between relative overflow-hidden group hover:border-primary/30 transition-colors duration-300">
              <span className="stat-label text-muted-foreground/80">Avg Grade</span>
              <div className="flex items-center justify-center mt-2">
                <GradeBadge grade={averageGrade} size="md" />
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold font-display text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Player Profile
          </h3>
          <Card className="p-4">
            <div className="h-[220px] w-full">
              {games.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis 
                      dataKey="category" 
                      tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                    />
                    <PolarRadiusAxis 
                      angle={30} 
                      domain={[0, 100]} 
                      tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                      tickCount={4}
                    />
                    <Radar
                      name="Rating"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  No data yet
                </div>
              )}
            </div>
            {games.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mt-2 pt-3 border-t border-white/5">
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Strengths</span>
                  {strengths.map((s, i) => (
                    <div key={i} className="text-xs font-medium text-green-400 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      {s.category} ({s.value})
                    </div>
                  ))}
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Areas to Improve</span>
                  {weaknesses.map((w, i) => (
                    <div key={i} className="text-xs font-medium text-amber-400 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      {w.category} ({w.value})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
            <Medal className="w-5 h-5 text-primary" /> Top 5 Games
          </h3>
        </div>
        
        {topGames.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground text-sm">No games logged yet. Log your first game to see your top performances!</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {topGames.map((game, index) => (
              <Collapsible 
                key={game.id}
                open={expandedGameId === game.id}
                onOpenChange={(open) => setExpandedGameId(open ? game.id : null)}
              >
                <Card 
                  className="relative overflow-hidden"
                  data-testid={`card-top-game-${game.id}`}
                >
                  {index === 0 && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                  )}
                  <CollapsibleTrigger asChild>
                    <div className="p-4 cursor-pointer hover-elevate flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary/50 text-muted-foreground font-bold text-sm">
                        #{index + 1}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-white">vs {game.opponent}</span>
                          {index === 0 && (
                            <span className="text-xs font-bold text-primary bg-primary/20 px-2 py-0.5 rounded">Best Game</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(game.date), 'MMMM dd, yyyy')}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 sm:gap-6">
                        <div className="hidden sm:flex gap-4 text-sm font-medium text-white/80">
                          <span><span className="text-muted-foreground text-xs">PTS</span> {game.points}</span>
                          <span><span className="text-muted-foreground text-xs">REB</span> {game.rebounds}</span>
                          <span><span className="text-muted-foreground text-xs">AST</span> {game.assists}</span>
                          <span className="text-primary"><span className="text-primary/60 text-xs">PER</span> {game.points + game.rebounds + game.assists}</span>
                        </div>
                        <GradeBadge grade={game.grade || "-"} size="sm" />
                        <ChevronDown className={cn(
                          "w-4 h-4 text-muted-foreground transition-transform",
                          expandedGameId === game.id && "rotate-180"
                        )} />
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="px-4 pb-4 pt-2 border-t border-white/5">
                      <div className="grid grid-cols-3 sm:grid-cols-7 gap-4">
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">Points</div>
                          <div className="text-lg font-bold text-white">{game.points}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">Rebounds</div>
                          <div className="text-lg font-bold text-white">{game.rebounds}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">Assists</div>
                          <div className="text-lg font-bold text-white">{game.assists}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-primary/60 mb-1">PER</div>
                          <div className="text-lg font-bold text-primary">{game.points + game.rebounds + game.assists}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">Steals</div>
                          <div className="text-lg font-bold text-white">{game.steals}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">Blocks</div>
                          <div className="text-lg font-bold text-white">{game.blocks}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">Minutes</div>
                          <div className="text-lg font-bold text-white">{game.minutes}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/5">
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">FG</div>
                          <div className="text-sm font-medium text-white">
                            {game.fgMade}/{game.fgAttempted}
                            <span className="text-muted-foreground ml-1">
                              ({game.fgAttempted ? ((game.fgMade / game.fgAttempted) * 100).toFixed(0) : 0}%)
                            </span>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">3PT</div>
                          <div className="text-sm font-medium text-white">
                            {game.threeMade}/{game.threeAttempted}
                            <span className="text-muted-foreground ml-1">
                              ({game.threeAttempted ? ((game.threeMade / game.threeAttempted) * 100).toFixed(0) : 0}%)
                            </span>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">FT</div>
                          <div className="text-sm font-medium text-white">
                            {game.ftMade}/{game.ftAttempted}
                            <span className="text-muted-foreground ml-1">
                              ({game.ftAttempted ? ((game.ftMade / game.ftAttempted) * 100).toFixed(0) : 0}%)
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {game.feedback && (
                        <div className="mt-4 pt-4 border-t border-white/5">
                          <div className="text-xs text-muted-foreground mb-2">Coach Notes</div>
                          <p className="text-sm text-white/80">{game.feedback}</p>
                        </div>
                      )}
                      
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <SocialEngagement gameId={game.id} />
                      </div>
                      
                      <div className="flex justify-end gap-2 mt-4">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleShareGame(game)}
                          className="gap-1"
                          data-testid={`button-share-top-game-${game.id}`}
                        >
                          <Share2 className="w-3.5 h-3.5" /> Share
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        )}
      </div>

      <GoalsPanel playerId={player.id} games={games} />

      <Tabs defaultValue="trend" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="trend" className="gap-2" data-testid="tab-performance-trend">
            <Activity className="w-4 h-4" /> Performance Trend
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2" data-testid="tab-game-history">
            <ClipboardList className="w-4 h-4" /> Game History
          </TabsTrigger>
          <TabsTrigger value="highlights" className="gap-2" data-testid="tab-highlights">
            <Film className="w-4 h-4" /> Highlights
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="trend">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> Performance Trend
              </h3>
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-primary" /> Points</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-white/20" /> Grade Score</div>
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="rgba(255,255,255,0.3)" 
                      tick={{fill: 'rgba(255,255,255,0.3)', fontSize: 12}} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      yAxisId="left"
                      stroke="rgba(255,255,255,0.3)" 
                      tick={{fill: 'rgba(255,255,255,0.3)', fontSize: 12}} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      domain={[0, 100]} 
                      hide 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="points" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4}}
                      activeDot={{r: 6, fill: '#fff'}}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="gradeVal" 
                      stroke="rgba(255,255,255,0.2)" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  No game data available for trends.
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" /> Game History
              </h3>
              {games.length > 5 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowAllGames(!showAllGames)}
                  className="text-xs gap-1"
                  data-testid="button-view-all-games"
                >
                  {showAllGames ? "Show Less" : `View All (${games.length})`}
                  <ChevronRight className={cn("w-3 h-3 transition-transform", showAllGames && "rotate-90")} />
                </Button>
              )}
            </div>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {games.length === 0 ? (
                <div className="text-muted-foreground text-sm text-center py-10">No games logged yet.</div>
              ) : (
                displayedGames.map(game => (
                  <div key={game.id} className="bg-secondary/20 hover:bg-secondary/40 border border-white/5 p-4 rounded-xl transition-colors group">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-0.5">
                          {format(new Date(game.date), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-sm font-bold text-white truncate max-w-[120px]">
                          vs {game.opponent}
                        </div>
                      </div>
                      <GradeBadge grade={game.grade || "-"} size="sm" />
                    </div>
                    
                    <div className="flex justify-between items-end border-t border-white/5 pt-3 mt-1">
                      <div className="flex items-center gap-4">
                        <div className="flex gap-3 text-xs font-medium text-white/80">
                          <span><span className="text-muted-foreground">PTS</span> {game.points}</span>
                          <span><span className="text-muted-foreground">REB</span> {game.rebounds}</span>
                          <span><span className="text-muted-foreground">AST</span> {game.assists}</span>
                          <span className="text-primary"><span className="text-primary/60">PER</span> {game.points + game.rebounds + game.assists}</span>
                        </div>
                        <SocialEngagement gameId={game.id} compact />
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleShareGame(game)}
                          className="text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100 p-1"
                          data-testid={`button-share-game-${game.id}`}
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1" data-testid={`button-delete-game-${game.id}`}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-card border-white/10 text-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Game Log?</AlertDialogTitle>
                              <AlertDialogDescription className="text-muted-foreground">
                                This will permanently remove this game and affect the player's averages.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-secondary text-white border-transparent">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteGame(game.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="highlights">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <Film className="w-5 h-5 text-primary" /> Highlights
              </h3>
            </div>
            <HighlightsGallery playerId={player.id} isOwner={isOwnProfile} />
          </Card>
        </TabsContent>
        
      </Tabs>

      <CoachToolsSection playerId={player.id} games={games} />
        </TabsContent>

        <TabsContent value="highlights">
          <HighlightsGallery playerId={player.id} isOwner={isOwnProfile} />
        </TabsContent>

        <TabsContent value="accolades">
          <AccoladesSection playerId={player.id} isOwnProfile={isOwnProfile} />
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-white/10 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display uppercase tracking-wide">Edit Profile</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update your player profile and upload photos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-primary/20">
                  {editForm.photoUrl && <AvatarImage src={editForm.photoUrl} alt="Profile" />}
                  <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-2xl font-display font-bold text-white">
                    {editForm.name ? getInitials(editForm.name) : "?"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex gap-2">
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={5242880}
                  onGetUploadParameters={handlePhotoUpload}
                  onComplete={handlePhotoComplete}
                  buttonClassName="gap-2"
                >
                  <Camera className="w-4 h-4" /> Upload Photo
                </ObjectUploader>
                {editForm.photoUrl && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setEditForm((prev) => ({ ...prev, photoUrl: "" }))}
                    data-testid="button-remove-photo"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Full Name</label>
                <Input
                  value={editForm.name || ""}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="LeBron James"
                  className="bg-secondary/30 border-white/10 text-white placeholder:text-white/20"
                  data-testid="input-edit-name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Position</label>
                  <Select
                    value={editForm.position}
                    onValueChange={(val) => setEditForm((prev) => ({ ...prev, position: val as "Guard" | "Wing" | "Big" }))}
                  >
                    <SelectTrigger className="bg-secondary/30 border-white/10 text-white" data-testid="select-edit-position">
                      <SelectValue placeholder="Position" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/10 text-white">
                      <SelectItem value="Guard">Guard</SelectItem>
                      <SelectItem value="Wing">Wing</SelectItem>
                      <SelectItem value="Big">Big</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Jersey #</label>
                  <Input
                    type="number"
                    value={editForm.jerseyNumber || ""}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, jerseyNumber: e.target.value ? Number(e.target.value) : undefined }))}
                    placeholder="23"
                    className="bg-secondary/30 border-white/10 text-white placeholder:text-white/20"
                    data-testid="input-edit-jersey"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Height</label>
                  <Input
                    value={editForm.height || ""}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, height: e.target.value }))}
                    placeholder="6'8"
                    className="bg-secondary/30 border-white/10 text-white placeholder:text-white/20"
                    data-testid="input-edit-height"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Team</label>
                  <Input
                    value={editForm.team || ""}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, team: e.target.value }))}
                    placeholder="Lakers"
                    className="bg-secondary/30 border-white/10 text-white placeholder:text-white/20"
                    data-testid="input-edit-team"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Bio</label>
                <Textarea
                  value={editForm.bio || ""}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself as a player..."
                  rows={3}
                  className="bg-secondary/30 border-white/10 text-white placeholder:text-white/20 resize-none"
                  data-testid="textarea-edit-bio"
                />
              </div>

              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-white">Recruiting Visibility</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Open to Opportunities</span>
                    <Switch
                      checked={editForm.openToOpportunities || false}
                      onCheckedChange={(checked) => setEditForm((prev) => ({ ...prev, openToOpportunities: checked }))}
                      data-testid="switch-open-to-opportunities"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  When enabled, your profile will appear in the Discover directory where coaches and scouts can find you.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" /> School
                    </label>
                    <Input
                      value={editForm.school || ""}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, school: e.target.value }))}
                      placeholder="Lincoln High"
                      className="bg-secondary/30 border-white/10 text-white placeholder:text-white/20"
                      data-testid="input-edit-school"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Class Year</label>
                    <Select
                      value={editForm.graduationYear?.toString() || ""}
                      onValueChange={(val) => setEditForm((prev) => ({ ...prev, graduationYear: val ? Number(val) : undefined }))}
                    >
                      <SelectTrigger className="bg-secondary/30 border-white/10 text-white" data-testid="select-edit-graduation-year">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-white/10 text-white">
                        {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((year) => (
                          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> City
                    </label>
                    <Input
                      value={editForm.city || ""}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, city: e.target.value }))}
                      placeholder="Los Angeles"
                      className="bg-secondary/30 border-white/10 text-white placeholder:text-white/20"
                      data-testid="input-edit-city"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">State</label>
                    <Select
                      value={editForm.state || ""}
                      onValueChange={(val) => setEditForm((prev) => ({ ...prev, state: val }))}
                    >
                      <SelectTrigger className="bg-secondary/30 border-white/10 text-white" data-testid="select-edit-state">
                        <SelectValue placeholder="State" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-white/10 text-white max-h-60">
                        {["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"].map((st) => (
                          <SelectItem key={st} value={st}>{st}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Banner Image</label>
                <div className="flex gap-2">
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={10485760}
                    onGetUploadParameters={handlePhotoUpload}
                    onComplete={handleBannerComplete}
                    buttonClassName="gap-2 flex-1"
                  >
                    <Upload className="w-4 h-4" /> Upload Banner
                  </ObjectUploader>
                  {editForm.bannerUrl && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setEditForm((prev) => ({ ...prev, bannerUrl: "" }))}
                      data-testid="button-remove-banner"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {editForm.bannerUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-white/10">
                    <img src={editForm.bannerUrl} alt="Banner preview" className="w-full h-24 object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={isUpdating} data-testid="button-save-profile">
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={showFollowersSheet} onOpenChange={setShowFollowersSheet}>
        <SheetContent className="bg-background border-l border-white/10">
          <SheetHeader>
            <SheetTitle className="font-display text-xl text-white uppercase tracking-wider">
              Followers
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <FollowersList playerId={id} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showFollowingSheet} onOpenChange={setShowFollowingSheet}>
        <SheetContent className="bg-background border-l border-white/10">
          <SheetHeader>
            <SheetTitle className="font-display text-xl text-white uppercase tracking-wider">
              Following
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <FollowingList playerId={id} showUnfollowButton={isOwnProfile} />
          </div>
        </SheetContent>
      </Sheet>

      <ShareModal
        open={showPlayerShareModal}
        onOpenChange={setShowPlayerShareModal}
        title="Share Player Card"
        shareUrl={`${window.location.origin}/players/${id}`}
        shareText={`Check out ${player.name}'s player card on Caliber!`}
        assetId={`player-${id}`}
      >
        <ShareablePlayerCard
          player={player}
          badges={badges}
          skillBadges={skillBadges}
          progression={progression ? {
            totalXp: progression.totalXp,
            currentTier: progression.currentTier,
            progressPercent: progression.progressPercent,
            nextTier: progression.nextTier,
          } : undefined}
          aspectRatio="1:1"
        />
      </ShareModal>

      {selectedShareGame && (
        <ShareModal
          open={showGameShareModal}
          onOpenChange={(open) => {
            setShowGameShareModal(open);
            if (!open) setSelectedShareGame(null);
          }}
          title="Share Game Card"
          shareUrl={`${window.location.origin}/players/${id}?gameId=${selectedShareGame.id}`}
          shareText={`Check out my game vs ${selectedShareGame.opponent} on Caliber!`}
          assetId={`game-${selectedShareGame.id}`}
        >
          <ShareableGameCard
            game={selectedShareGame}
            playerName={player.name}
            badges={badges.filter((b: Badge) => b.gameId === selectedShareGame.id)}
            aspectRatio="16:9"
          />
        </ShareModal>
      )}

      {selectedShareBadge && (
        <ShareModal
          open={showBadgeShareModal}
          onOpenChange={(open) => {
            setShowBadgeShareModal(open);
            if (!open) setSelectedShareBadge(null);
          }}
          title="Share Badge"
          shareUrl={`${window.location.origin}/players/${id}`}
          shareText={`I just earned a new badge on Caliber!`}
          assetId={`badge-${selectedShareBadge}`}
        >
          <ShareableBadgeCard
            badgeType={selectedShareBadge}
            playerName={player.name}
            aspectRatio="1:1"
          />
        </ShareModal>
      )}
    </div>
  );
}
