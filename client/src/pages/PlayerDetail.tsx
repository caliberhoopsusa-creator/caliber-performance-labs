import { usePlayer, useDeleteGame, usePlayerBadges, useUpdatePlayer, usePlayerProgression, usePlayerSkillBadges, usePlayerAccolades, useCreateAccolade, useUpdateAccolade, useDeleteAccolade, type PlayerUpdate } from "@/hooks/use-basketball";
import { motion } from "framer-motion";
import { GoalsPanel } from "@/components/GoalsPanel";
import { SocialEngagement } from "@/components/SocialEngagement";
import { PlayerProgression } from "@/components/PlayerProgression";
import { ProfileWidgets } from "@/components/ProfileWidgets";
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
import { PlayerRatingsSection } from "@/components/PlayerRatingsSection";
import { useAuth } from "@/hooks/use-auth";
import { useEquippedItems } from "@/contexts/EquippedItemsContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useRoute, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/StatCard";
import { GradeBadge } from "@/components/GradeBadge";
import { PlayerArchetype } from "@/components/PlayerArchetype";
import { EliteAchievements } from "@/components/EliteAchievements";
import { CaliberBadge } from "@/components/CaliberBadge";
import { ArrowLeft, Plus, Trash2, Award, ClipboardList, Activity, Target, Clock, Star, Shield, Zap, CheckCircle, Flame, Trophy, Share2, BarChart3, Medal, User, Users, ChevronRight, ChevronDown, TrendingUp, Pencil, Camera, Upload, X, FileText, Dumbbell, Film, MapPin, GraduationCap, Eye, BookOpen, Phone, Save, Crosshair, ShieldCheck, PlayCircle, AlertTriangle, Package, Sparkles, Palette, Crown, Gem, CircleDot, Rss, MessageCircle, Sun, Cloud, Moon } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { FOOTBALL_POSITIONS, FOOTBALL_POSITION_LABELS, FOOTBALL_POSITION_STATS, type FootballPosition } from "@shared/sports-config";
import { useSport } from "@/components/SportToggle";
import { AnimatedRankBadge } from "@/components/AnimatedRankBadge";
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
import { BADGE_DEFINITIONS, type Badge, type Game, type Player } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Label } from "@/components/ui/label";
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
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FootballMetrics } from "@/components/FootballMetrics";
import { MilestonesSection } from "@/components/MilestoneCard";
import { MemorySection } from "@/components/MemoryCard";
import EndorsementSection from "@/components/EndorsementSection";
import { Skeleton } from "@/components/ui/skeleton";

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
  most_improved: TrendingUp,
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

function getGradeColor(grade: string) {
  const normalizedGrade = grade?.trim().toUpperCase() || "";
  if (["A+", "A", "A-"].includes(normalizedGrade)) {
    return {
      bg: "from-amber-500/20 to-yellow-600/20",
      border: "border-amber-500/50",
      text: "text-amber-400",
      glow: "shadow-amber-500/30",
    };
  }
  if (["B+", "B", "B-"].includes(normalizedGrade)) {
    return {
      bg: "from-slate-400/20 to-gray-500/20",
      border: "border-slate-400/50",
      text: "text-slate-300",
      glow: "shadow-slate-400/30",
    };
  }
  if (["C+", "C", "C-"].includes(normalizedGrade)) {
    return {
      bg: "from-orange-500/20 to-amber-600/20",
      border: "border-orange-500/50",
      text: "text-orange-400",
      glow: "shadow-orange-500/30",
    };
  }
  return {
    bg: "from-red-500/20 to-rose-600/20",
    border: "border-red-500/50",
    text: "text-red-400",
    glow: "shadow-red-500/30",
  };
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Helper to check if player has any of the given positions (supports comma-separated positions)
function hasPosition(position: string | null | undefined, positionsToCheck: string[]): boolean {
  if (!position) return false;
  const playerPositions = position.split(',').map(p => p.trim());
  return playerPositions.some(p => positionsToCheck.includes(p));
}

// Rarity colors for inventory items
const RARITY_COLORS: Record<string, string> = {
  common: "border-gray-500/50 bg-gray-500/10",
  rare: "border-blue-500/50 bg-blue-500/10",
  epic: "border-purple-500/50 bg-purple-500/10",
  legendary: "border-yellow-500/50 bg-yellow-500/10",
};

const RARITY_TEXT_COLORS: Record<string, string> = {
  common: "text-gray-400",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-yellow-400",
};

const CATEGORY_ICONS: Record<string, any> = {
  theme: Palette,
  profile_skin: User,
  badge_style: Award,
  effect: Sparkles,
  team_look: Crown,
};

interface InventoryItem {
  id: number;
  userId: string;
  itemId: number;
  purchasedAt: string | null;
  isEquipped: boolean;
  item: {
    id: number;
    name: string;
    description: string | null;
    category: string;
    type: string;
    value: string;
    previewUrl: string | null;
    coinPrice: number;
    rarity: string;
  };
}

function InventorySection() {
  const { data: inventory, isLoading, error } = useQuery<InventoryItem[]>({
    queryKey: ["/api/shop/inventory"],
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-primary" />
          <h3 className="font-display text-xl uppercase tracking-wide">My Inventory</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-square rounded-lg skeleton-premium" />
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load inventory"
          description="Could not load your items. Try refreshing the page."
        />
      </Card>
    );
  }

  const items = inventory || [];

  // Group by category
  const groupedItems = items.reduce((acc, item) => {
    const category = item.item.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  const categories = Object.keys(groupedItems);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Package className="w-5 h-5 text-primary" />
        <h3 className="font-display text-xl uppercase tracking-wide">My Inventory</h3>
        <span className="text-sm text-muted-foreground ml-2">({items.length} items)</span>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No items yet"
          description="Visit the shop to purchase themes, skins, and more with your coins!"
          action={{
            label: "Go to Shop",
            href: "/shop",
          }}
        />
      ) : (
        <div className="space-y-8">
          {categories.map((category) => {
            const CategoryIcon = CATEGORY_ICONS[category] || Package;
            const categoryItems = groupedItems[category];
            
            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-4">
                  <CategoryIcon className="w-4 h-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    {category.replace(/_/g, ' ')}
                  </h4>
                  <span className="text-xs text-muted-foreground">({categoryItems.length})</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {categoryItems.map((inventoryItem) => {
                    const { item, isEquipped } = inventoryItem;
                    const rarityColor = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
                    const rarityTextColor = RARITY_TEXT_COLORS[item.rarity] || RARITY_TEXT_COLORS.common;
                    
                    return (
                      <div
                        key={inventoryItem.id}
                        className={cn(
                          "relative rounded-lg border-2 p-4 transition-all",
                          rarityColor,
                          isEquipped && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                        )}
                        data-testid={`inventory-item-${inventoryItem.id}`}
                      >
                        {isEquipped && (
                          <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Equipped
                          </div>
                        )}
                        
                        <div className="flex flex-col items-center text-center gap-2">
                          {item.previewUrl ? (
                            <img 
                              src={item.previewUrl} 
                              alt={item.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : item.category === 'theme' ? (
                            <div 
                              className="w-12 h-12 rounded-lg border border-white/20"
                              style={{ backgroundColor: item.value }}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center">
                              <Gem className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                          
                          <div>
                            <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                            <p className={cn("text-xs capitalize", rarityTextColor)}>
                              {item.rarity}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function PlayerDetailSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in pb-20 w-full">
      <div className="h-4 w-24 skeleton-premium rounded" />
      
      <Card className="p-4 md:p-8 relative overflow-hidden">
        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-4 md:gap-6">
            <Skeleton className="w-16 h-16 md:w-24 md:h-24 rounded-full skeleton-premium" />
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-12 skeleton-premium rounded" />
                <Skeleton className="h-6 w-16 rounded" />
              </div>
              <Skeleton className="h-8 w-48 skeleton-premium rounded" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-12 rounded" />
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
              <div className="flex gap-3 mt-3">
                <Skeleton className="h-8 w-20 rounded-lg skeleton-premium" />
                <Skeleton className="h-8 w-20 rounded-lg" />
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            </div>
            <div className="hidden md:flex flex-col items-center gap-2">
              <Skeleton className="h-3 w-12 rounded" />
              <Skeleton className="h-16 w-16 rounded-full skeleton-premium" />
            </div>
          </div>
          
          <div className="flex justify-center md:hidden">
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-accent/[0.08]">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-12 w-12 rounded-full skeleton-premium" />
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <Skeleton className="h-10 w-full max-w-md rounded-lg" />
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-3 w-16 mb-2 rounded" />
              <Skeleton className="h-8 w-12 skeleton-premium rounded" />
            </Card>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <Skeleton className="h-5 w-32 mb-4 skeleton-premium rounded" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </Card>
          <Card className="p-6">
            <Skeleton className="h-5 w-32 mb-4 skeleton-premium rounded" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </Card>
        </div>
        
        <Card className="p-6">
          <Skeleton className="h-5 w-40 mb-4 skeleton-premium rounded" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-white/5">
                <Skeleton className="h-10 w-10 rounded-lg skeleton-premium" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
                <Skeleton className="h-8 w-12 rounded skeleton-premium" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
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
  state_award: { name: "State Award", icon: Award, color: "text-emerald-500", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20" },
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
      state_award: [],
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

interface CoachContactSectionProps {
  player: Player;
  isOwnProfile: boolean;
}

function CoachContactSection({ player, isOwnProfile }: CoachContactSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [coachName, setCoachName] = useState(player.coachName || "");
  const [coachPhone, setCoachPhone] = useState(player.coachPhone || "");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/players/${player.id}/coach-contact`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachName, coachPhone }),
      });
      
      if (!response.ok) throw new Error("Failed to save");
      
      queryClient.invalidateQueries({ queryKey: ["/api/players/:id", player.id] });
      toast({ title: "Coach contact saved!" });
      setIsEditing(false);
    } catch (error) {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Phone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Coach Contact</h3>
            <p className="text-sm text-muted-foreground">Contact information for your coach</p>
          </div>
        </div>
        {isOwnProfile && !isEditing && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsEditing(true)}
            data-testid="button-edit-coach"
          >
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="coachName">Coach Name</Label>
            <Input
              id="coachName"
              placeholder="Enter coach's name"
              value={coachName}
              onChange={(e) => setCoachName(e.target.value)}
              data-testid="input-coach-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coachPhone">Phone Number</Label>
            <Input
              id="coachPhone"
              placeholder="Enter phone number"
              value={coachPhone}
              onChange={(e) => setCoachPhone(e.target.value)}
              data-testid="input-coach-phone"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              data-testid="button-save-coach"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditing(false);
                setCoachName(player.coachName || "");
                setCoachPhone(player.coachPhone || "");
              }}
              data-testid="button-cancel-coach"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {player.coachName || player.coachPhone ? (
            <>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
                <User className="w-10 h-10 p-2 rounded-full bg-primary/10 text-primary" />
                <div>
                  <p className="font-medium">{player.coachName || "No name provided"}</p>
                  {player.coachPhone && (
                    <a 
                      href={`tel:${player.coachPhone}`}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      {player.coachPhone}
                    </a>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Phone className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No coach contact information added yet.</p>
              {isOwnProfile && (
                <p className="text-sm mt-1">Click "Edit" to add your coach's details.</p>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

interface FollowingPlayer {
  id: number;
  playerId: number;
  name: string;
}

function PlayerActivityTab({ playerId, playerName, isOwnProfile }: { playerId: number; playerName: string; isOwnProfile: boolean }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: feedActivities = [], isLoading: feedLoading } = useQuery<any[]>({
    queryKey: ['/api/players', playerId, 'feed'],
  });

  const { data: followStats } = useQuery<{ followerCount: number; followingCount: number; isFollowing: boolean }>({
    queryKey: ['/api/players', playerId, 'follow-stats'],
  });

  const { data: workouts = [], isLoading: workoutsLoading } = useQuery<any[]>({
    queryKey: ['/api/players', playerId, 'workouts'],
    enabled: isOwnProfile,
  });

  const recentActivities = feedActivities.slice(0, 10);
  const recentWorkouts = workouts.slice(0, 5);

  const ACTIVITY_TYPE_ICONS: Record<string, any> = {
    game: Target,
    badge: Award,
    streak: Flame,
    workout: Dumbbell,
    goal: Trophy,
    challenge: Zap,
    repost: Share2,
    poll: BarChart3,
    prediction: Eye,
  };

  const ACTIVITY_TYPE_COLORS: Record<string, string> = {
    game: 'text-accent',
    badge: 'text-purple-400',
    streak: 'text-orange-400',
    workout: 'text-emerald-400',
    goal: 'text-blue-400',
    challenge: 'text-amber-400',
    repost: 'text-accent',
    poll: 'text-pink-400',
    prediction: 'text-indigo-400',
  };

  return (
    <div className="space-y-6">
      {!isOwnProfile && user && (
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setLocation('/community?tab=messages')}
            variant="outline"
            size="sm"
            className="gap-2 border-white/10"
            data-testid="button-message-player"
          >
            <MessageCircle className="w-4 h-4" /> Message
          </Button>
          <FollowButton playerId={playerId} initialIsFollowing={followStats?.isFollowing ?? false} />
        </div>
      )}

      <Card className="p-5 bg-gradient-to-br from-black/60 to-black/30 border-white/10" data-testid="section-social-overview">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30">
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">
            Social Overview
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center" data-testid="stat-followers-activity">
            <div className="text-2xl font-bold text-white">{followStats?.followerCount ?? 0}</div>
            <div className="text-xs text-muted-foreground">Followers</div>
          </div>
          <div className="text-center" data-testid="stat-following-activity">
            <div className="text-2xl font-bold text-white">{followStats?.followingCount ?? 0}</div>
            <div className="text-xs text-muted-foreground">Following</div>
          </div>
          <div className="text-center" data-testid="stat-posts-activity">
            <div className="text-2xl font-bold text-white">{feedActivities.length}</div>
            <div className="text-xs text-muted-foreground">Posts</div>
          </div>
        </div>
      </Card>

      <div data-testid="section-recent-activity">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-1.5 rounded-lg bg-accent/20 border border-accent/30">
            <Rss className="w-4 h-4 text-accent" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
            Recent Activity
          </h3>
        </div>
        
        {feedLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-4 animate-pulse border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-3/4 mb-1" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : recentActivities.length === 0 ? (
          <Card className="p-8 text-center border-white/10">
            <Rss className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No activity yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Activities will appear here as {isOwnProfile ? 'you log' : `${playerName} logs`} games and earns badges
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentActivities.map((activity: any) => {
              const Icon = ACTIVITY_TYPE_ICONS[activity.activityType] || Rss;
              const colorClass = ACTIVITY_TYPE_COLORS[activity.activityType] || 'text-accent';
              return (
                <Card 
                  key={activity.id} 
                  className="p-3 border-white/10 hover-elevate"
                  data-testid={`activity-item-${activity.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-lg bg-white/5 border border-white/10 flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${colorClass}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{activity.headline}</p>
                      {activity.subtext && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{activity.subtext}</p>
                      )}
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {activity.createdAt ? formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true }) : ''}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {isOwnProfile && (
        <div data-testid="section-recent-workouts">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
              <Dumbbell className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-white to-emerald-300 bg-clip-text text-transparent">
              Recent Workouts
            </h3>
          </div>

          {workoutsLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <Card key={i} className="p-4 animate-pulse border-white/10">
                  <div className="h-4 bg-muted rounded w-3/4 mb-1" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </Card>
              ))}
            </div>
          ) : recentWorkouts.length === 0 ? (
            <Card className="p-6 text-center border-white/10">
              <Dumbbell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No workouts logged yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Log workouts to track your training</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentWorkouts.map((workout: any) => (
                <Card 
                  key={workout.id} 
                  className="p-3 border-white/10 hover-elevate"
                  data-testid={`workout-item-${workout.id}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex-shrink-0">
                        <Dumbbell className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{workout.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{workout.duration} min</span>
                          {workout.intensity && (
                            <>
                              <span className="text-xs text-muted-foreground">&middot;</span>
                              <span className="text-xs text-muted-foreground">Intensity {workout.intensity}/10</span>
                            </>
                          )}
                          <span className="text-xs text-muted-foreground">&middot;</span>
                          <span className="text-xs text-muted-foreground/60">
                            {workout.date ? format(new Date(workout.date), 'MMM d') : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="flex-shrink-0"
                      onClick={async () => {
                        try {
                          await apiRequest('POST', `/api/workouts/${workout.id}/share`);
                          queryClient.invalidateQueries({ queryKey: ['/api/players', playerId, 'feed'] });
                          toast({ title: "Shared!", description: "Workout shared to your feed" });
                        } catch (err: any) {
                          const msg = err?.message || 'Failed to share';
                          if (msg.includes('already shared')) {
                            toast({ title: "Already shared", description: "This workout is already on your feed", variant: "destructive" });
                          } else {
                            toast({ title: "Error", description: msg, variant: "destructive" });
                          }
                        }
                      }}
                      data-testid={`button-share-workout-${workout.id}`}
                    >
                      <Share2 className="w-4 h-4 text-emerald-400" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getGreeting(): { text: string; icon: typeof Sun } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: "Good morning", icon: Sun };
  if (hour >= 12 && hour < 17) return { text: "Good afternoon", icon: Sun };
  if (hour >= 17 && hour < 21) return { text: "Good evening", icon: Sparkles };
  return { text: "Late night grind", icon: Moon };
}

export default function PlayerDetail() {
  const [, params] = useRoute("/players/:id");
  const id = Number(params?.id);
  const { data: player, isLoading, error } = usePlayer(id);
  const { data: badges = [], isLoading: badgesLoading } = usePlayerBadges(id);
  const { mutate: deleteGame } = useDeleteGame();
  const { mutate: updatePlayer, isPending: isUpdating } = useUpdatePlayer();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { getProfileSkinStyle, getBadgeStyle, getEffectConfig, equippedProfileSkin, equippedEffect, equippedBadgeStyle, equippedTheme } = useEquippedItems();
  const { themeName } = useTheme();
  const [location, navigate] = useLocation();
  const [showAllGames, setShowAllGames] = useState(false);
  const [expandedGameId, setExpandedGameId] = useState<number | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<PlayerUpdate>({});
  const [editPositions, setEditPositions] = useState<string[]>([]);
  const [showFollowersSheet, setShowFollowersSheet] = useState(false);
  const [showFollowingSheet, setShowFollowingSheet] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showPlayerShareModal, setShowPlayerShareModal] = useState(false);
  const [showGameShareModal, setShowGameShareModal] = useState(false);
  const [showBadgeShareModal, setShowBadgeShareModal] = useState(false);
  const [selectedShareGame, setSelectedShareGame] = useState<Game | null>(null);
  const [selectedShareBadge, setSelectedShareBadge] = useState<string | null>(null);

  const { data: progression } = usePlayerProgression(id);
  const { data: skillBadges = [] } = usePlayerSkillBadges(id);
  const currentSport = useSport();

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
    const tabParam = params.get('tab');
    if (tabParam && ['overview', 'highlights', 'accolades', 'coach', 'scouting', 'inventory'].includes(tabParam)) {
      setActiveTab(tabParam);
      window.history.replaceState({}, '', `/players/${id}`);
    }
  }, [player, id]);

  useEffect(() => {
    if (player && isEditDialogOpen) {
      // Parse positions from comma-separated string
      const positionsList = player.position ? player.position.split(',').map(p => p.trim()) : [];
      setEditPositions(positionsList);
      setEditForm({
        name: player.name,
        username: player.username || "",
        position: player.position,
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
        gpa: player.gpa ? parseFloat(player.gpa) : undefined,
      });
    }
  }, [player, isEditDialogOpen]);

  const toggleEditPosition = (pos: string) => {
    setEditPositions(prev => {
      const newPositions = prev.includes(pos)
        ? prev.filter(p => p !== pos)
        : [...prev, pos];
      // Also update editForm.position
      setEditForm(form => ({ ...form, position: newPositions.join(',') }));
      return newPositions;
    });
  };

  const handleSaveProfile = () => {
    const updatedForm = { ...editForm, position: editPositions.join(',') };
    if (updatedForm.username === '') {
      delete updatedForm.username;
    }
    updatePlayer(
      { id, updates: updatedForm },
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

  const handleWidgetsChange = (widgets: string[]) => {
    updatePlayer(
      { id, updates: { widgetPreferences: JSON.stringify(widgets) } },
      {
        onSuccess: () => {
          toast({ title: "Widgets saved", description: "Your widget preferences have been updated." });
        },
      }
    );
  };

  const widgetPreferences = useMemo(() => {
    if (!player?.widgetPreferences) return null;
    try {
      return JSON.parse(player.widgetPreferences);
    } catch {
      return null;
    }
  }, [player?.widgetPreferences]);

  // Refs to track uploaded object paths
  const lastPhotoObjectPath = useRef<string | null>(null);
  const lastBannerObjectPath = useRef<string | null>(null);

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
    // Store the objectPath for use in completion handler
    lastPhotoObjectPath.current = data.objectPath;
    return {
      method: "PUT" as const,
      url: data.url,
      headers: { "Content-Type": file.type },
    };
  };

  const handleBannerUpload = async (file: { name: string; type: string }) => {
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
    // Store the objectPath for use in completion handler
    lastBannerObjectPath.current = data.objectPath;
    return {
      method: "PUT" as const,
      url: data.url,
      headers: { "Content-Type": file.type },
    };
  };

  const handlePhotoComplete = async (result: any) => {
    if (result.successful?.[0] && lastPhotoObjectPath.current) {
      setEditForm((prev) => ({ ...prev, photoUrl: lastPhotoObjectPath.current! }));
      toast({ title: "Photo Uploaded", description: "Profile photo uploaded successfully." });
      lastPhotoObjectPath.current = null;
    }
  };

  const handleBannerComplete = async (result: any) => {
    if (result.successful?.[0] && lastBannerObjectPath.current) {
      setEditForm((prev) => ({ ...prev, bannerUrl: lastBannerObjectPath.current! }));
      toast({ title: "Banner Uploaded", description: "Banner image uploaded successfully." });
      lastBannerObjectPath.current = null;
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
    return <PlayerDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6 pb-20">
        <Link href="/players">
          <Button variant="ghost" className="gap-2 text-muted-foreground" data-testid="button-back-error">
            <ArrowLeft className="w-4 h-4" /> Back to Players
          </Button>
        </Link>
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Failed to load player</h2>
              <p className="text-muted-foreground mb-4">
                There was an error loading this player's profile.
              </p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="space-y-6 pb-20">
        <Link href="/players">
          <Button variant="ghost" className="gap-2 text-muted-foreground" data-testid="button-back-not-found">
            <ArrowLeft className="w-4 h-4" /> Back to Players
          </Button>
        </Link>
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary/60" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Player not found</h2>
              <p className="text-muted-foreground mb-4">
                This player profile doesn't exist or has been removed.
              </p>
              <Link href="/players">
                <Button>View All Players</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const allGames = player.games || [];
  const isFootball = currentSport === 'football';
  
  // Filter games by current sport to ensure stats are accurate per sport
  const games = allGames.filter(g => g.sport === currentSport);
  
  // === BASKETBALL STATS ===
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
  
  // === FOOTBALL STATS ===
  const totalPassingYards = games.reduce((acc, g) => acc + (g.passingYards || 0), 0);
  const totalRushingYards = games.reduce((acc, g) => acc + (g.rushingYards || 0), 0);
  const totalReceivingYards = games.reduce((acc, g) => acc + (g.receivingYards || 0), 0);
  const totalPassingTDs = games.reduce((acc, g) => acc + (g.passingTouchdowns || 0), 0);
  const totalRushingTDs = games.reduce((acc, g) => acc + (g.rushingTouchdowns || 0), 0);
  const totalReceivingTDs = games.reduce((acc, g) => acc + (g.receivingTouchdowns || 0), 0);
  const totalTDs = totalPassingTDs + totalRushingTDs + totalReceivingTDs;
  const totalYards = totalPassingYards + totalRushingYards + totalReceivingYards;
  
  const avgPassingYards = games.length ? (totalPassingYards / games.length).toFixed(1) : "—";
  const avgRushingYards = games.length ? (totalRushingYards / games.length).toFixed(1) : "—";
  const avgReceivingYards = games.length ? (totalReceivingYards / games.length).toFixed(1) : "—";
  const avgTDs = games.length ? (totalTDs / games.length).toFixed(1) : "—";
  
  const totalCompletions = games.reduce((acc, g) => acc + (g.completions || 0), 0);
  const totalPassAttempts = games.reduce((acc, g) => acc + (g.passAttempts || 0), 0);
  const compPercent = totalPassAttempts > 0 ? ((totalCompletions / totalPassAttempts) * 100).toFixed(1) : "—";
  
  const totalReceptions = games.reduce((acc, g) => acc + (g.receptions || 0), 0);
  const totalTargets = games.reduce((acc, g) => acc + (g.targets || 0), 0);
  const catchRate = totalTargets > 0 ? ((totalReceptions / totalTargets) * 100).toFixed(1) : "—";
  
  const totalCarries = games.reduce((acc, g) => acc + (g.carries || 0), 0);
  const yardsPerCarry = totalCarries > 0 ? (totalRushingYards / totalCarries).toFixed(1) : "—";
  
  const totalInterceptions = games.reduce((acc, g) => acc + (g.interceptions || 0), 0);
  const totalFumbles = games.reduce((acc, g) => acc + (g.fumbles || 0), 0);
  const totalTurnovers = totalInterceptions + totalFumbles;
  
  // Defense stats
  const totalTackles = games.reduce((acc, g) => acc + (g.tackles || 0), 0);
  const totalSoloTackles = games.reduce((acc, g) => acc + (g.soloTackles || 0), 0);
  const totalSacks = games.reduce((acc, g) => acc + (g.sacks || 0), 0);
  const totalDefensiveINTs = games.reduce((acc, g) => acc + (g.defensiveInterceptions || 0), 0);
  const totalPassDeflections = games.reduce((acc, g) => acc + (g.passDeflections || 0), 0);
  const totalForcedFumbles = games.reduce((acc, g) => acc + (g.forcedFumbles || 0), 0);
  const avgTackles = games.length ? (totalTackles / games.length).toFixed(1) : "—";
  
  // Receiving efficiency
  const yardsPerReception = totalReceptions > 0 ? (totalReceivingYards / totalReceptions).toFixed(1) : "—";
  
  // Kicking stats
  const totalFGMade = games.reduce((acc, g) => acc + (g.fieldGoalsMade || 0), 0);
  const totalFGAttempted = games.reduce((acc, g) => acc + (g.fieldGoalsAttempted || 0), 0);
  const fgKickPercent = totalFGAttempted > 0 ? ((totalFGMade / totalFGAttempted) * 100).toFixed(1) : "—";
  const totalXPMade = games.reduce((acc, g) => acc + (g.extraPointsMade || 0), 0);
  const totalXPAttempted = games.reduce((acc, g) => acc + (g.extraPointsAttempted || 0), 0);
  
  // Punting stats
  const totalPunts = games.reduce((acc, g) => acc + (g.punts || 0), 0);
  const totalPuntYards = games.reduce((acc, g) => acc + (g.puntYards || 0), 0);
  const avgPuntYards = totalPunts > 0 ? (totalPuntYards / totalPunts).toFixed(1) : "—";
  
  // OL stats
  const totalPancakeBlocks = games.reduce((acc, g) => acc + (g.pancakeBlocks || 0), 0);
  const totalSacksAllowed = games.reduce((acc, g) => acc + (g.sacksAllowed || 0), 0);
  const totalPenalties = games.reduce((acc, g) => acc + (g.penalties || 0), 0);
  
  const averageGrade = getAverageGrade(games);

  const recentGames = [...games]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-8);

  const getSparkline = (extractor: (g: Game) => number) =>
    recentGames.length >= 2 ? recentGames.map(extractor) : undefined;

  const sparklines = {
    points: getSparkline(g => g.points),
    rebounds: getSparkline(g => g.rebounds),
    assists: getSparkline(g => g.assists),
    steals: getSparkline(g => g.steals),
    blocks: getSparkline(g => g.blocks),
    per: getSparkline(g => g.points + g.rebounds + g.assists),
    fgPct: getSparkline(g => (g.fgAttempted || 0) > 0 ? ((g.fgMade || 0) / (g.fgAttempted || 1)) * 100 : 0),
    threePct: getSparkline(g => (g.threeAttempted || 0) > 0 ? ((g.threeMade || 0) / (g.threeAttempted || 1)) * 100 : 0),
    ftPct: getSparkline(g => (g.ftAttempted || 0) > 0 ? ((g.ftMade || 0) / (g.ftAttempted || 1)) * 100 : 0),
    passingYards: getSparkline(g => g.passingYards || 0),
    passingTDs: getSparkline(g => g.passingTouchdowns || 0),
    rushingYards: getSparkline(g => g.rushingYards || 0),
    rushingTDs: getSparkline(g => g.rushingTouchdowns || 0),
    receivingYards: getSparkline(g => g.receivingYards || 0),
    receivingTDs: getSparkline(g => g.receivingTouchdowns || 0),
    receptions: getSparkline(g => g.receptions || 0),
    targets: getSparkline(g => g.targets || 0),
    carries: getSparkline(g => g.carries || 0),
    tackles: getSparkline(g => g.tackles || 0),
    soloTackles: getSparkline(g => g.soloTackles || 0),
    sacks: getSparkline(g => g.sacks || 0),
    defensiveINTs: getSparkline(g => g.defensiveInterceptions || 0),
    passDeflections: getSparkline(g => g.passDeflections || 0),
    forcedFumbles: getSparkline(g => g.forcedFumbles || 0),
    fgMade: getSparkline(g => g.fieldGoalsMade || 0),
    fgAttempted: getSparkline(g => g.fieldGoalsAttempted || 0),
    xpMade: getSparkline(g => g.extraPointsMade || 0),
    xpAttempted: getSparkline(g => g.extraPointsAttempted || 0),
    punts: getSparkline(g => g.punts || 0),
    puntYards: getSparkline(g => g.puntYards || 0),
    pancakeBlocks: getSparkline(g => g.pancakeBlocks || 0),
    sacksAllowed: getSparkline(g => g.sacksAllowed || 0),
    penalties: getSparkline(g => g.penalties || 0),
    completions: getSparkline(g => g.completions || 0),
  };

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

  // Basketball radar data
  const basketballRadarData = [
    { category: 'Scoring', value: Math.round(scoringRating), fullMark: 100 },
    { category: 'Rebounding', value: Math.round(reboundingRating), fullMark: 100 },
    { category: 'Playmaking', value: Math.round(playmakingRating), fullMark: 100 },
    { category: 'Defense', value: Math.round(defenseRating), fullMark: 100 },
    { category: 'Hustle', value: Math.round(hustleRating), fullMark: 100 },
    { category: 'Efficiency', value: Math.round(efficiencyRating), fullMark: 100 },
  ];

  // Football radar data - based on average grades from games
  const avgEfficiencyGrade = games.length ? games.reduce((acc, g) => {
    const grade = g.efficiencyGrade || 'C';
    return acc + getGradeValue(grade);
  }, 0) / games.length : 0;
  const avgPlaymakingGrade = games.length ? games.reduce((acc, g) => {
    const grade = g.playmakingGrade || 'C';
    return acc + getGradeValue(grade);
  }, 0) / games.length : 0;
  const avgBallSecurityGrade = games.length ? games.reduce((acc, g) => {
    const grade = g.ballSecurityGrade || 'C';
    return acc + getGradeValue(grade);
  }, 0) / games.length : 0;
  const avgImpactGrade = games.length ? games.reduce((acc, g) => {
    const grade = g.impactGrade || 'C';
    return acc + getGradeValue(grade);
  }, 0) / games.length : 0;

  const footballRadarData = [
    { category: 'Efficiency', value: Math.round(avgEfficiencyGrade), fullMark: 100 },
    { category: 'Playmaking', value: Math.round(avgPlaymakingGrade), fullMark: 100 },
    { category: 'Ball Security', value: Math.round(avgBallSecurityGrade), fullMark: 100 },
    { category: 'Impact', value: Math.round(avgImpactGrade), fullMark: 100 },
    { category: 'Consistency', value: Math.round(hustleRating), fullMark: 100 },
    { category: 'Big Plays', value: Math.round(Math.min(100, (totalTDs / Math.max(games.length, 1)) * 20)), fullMark: 100 },
  ];

  const radarData = isFootball ? footballRadarData : basketballRadarData;

  const strengths = [...radarData].sort((a, b) => b.value - a.value).slice(0, 2);
  const weaknesses = [...radarData].sort((a, b) => a.value - b.value).slice(0, 2);

  return (
    <div className="space-y-6 animate-fade-in pb-20 w-full">
      <Link href="/players" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-white transition-colors duration-200 uppercase tracking-wider animate-fade-up delay-100">
        <ArrowLeft className="w-4 h-4" /> Back to Roster
      </Link>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card
          className="relative overflow-hidden"
          style={isOwnProfile && getProfileSkinStyle()?.background ? {
            background: getProfileSkinStyle()?.background,
            borderColor: getProfileSkinStyle()?.borderColor || undefined,
          } : undefined}
        >
          {isOwnProfile && getEffectConfig() && (
            <>
              {getEffectConfig()?.layers.map((layer, index) => (
                <div 
                  key={index}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
                  style={{ 
                    background: layer.gradient,
                    animation: layer.animation,
                    width: layer.size || '400px',
                    height: layer.size || '400px',
                    opacity: layer.opacity || 1,
                    filter: layer.blur ? `blur(${layer.blur})` : undefined,
                  }}
                />
              ))}
            </>
          )}

          <div className="relative h-32 md:h-40 overflow-hidden">
            {player.bannerUrl ? (
              <img src={player.bannerUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-accent/30 via-accent/10 to-accent/5" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>

          <div className="relative z-10 px-6 md:px-8 pb-6 md:pb-8">
            <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-8">
              <div className="relative group/avatar shrink-0 mx-auto md:mx-0 -mt-12 md:-mt-16">
                <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-background">
                  {player.photoUrl && <AvatarImage src={player.photoUrl} alt={player.name} width={128} height={128} loading="eager" />}
                  <AvatarFallback className="bg-muted text-3xl md:text-4xl font-display font-bold text-foreground">
                    {getInitials(player.name)}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <Button
                    size="icon"
                    onClick={() => setIsEditDialogOpen(true)}
                    className="absolute -bottom-1 -right-1 rounded-full opacity-0 group-hover/avatar:opacity-100 md:opacity-100 transition-opacity duration-300"
                    data-testid="button-edit-profile-avatar"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              <div className="flex-1 min-w-0 text-center md:text-left pt-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-3 mb-2">
                  {player.jerseyNumber && (
                    <span className="text-2xl md:text-4xl font-display font-black text-accent">
                      #{player.jerseyNumber}
                    </span>
                  )}
                  {player.position && (
                    <span className="px-3 py-1 rounded-full text-xs md:text-sm font-bold uppercase tracking-wider bg-accent/10 border border-accent/20 text-accent">
                      {player.position.split(',').map(p => p.trim()).map(pos => 
                        isFootball && FOOTBALL_POSITIONS.includes(pos as FootballPosition)
                          ? FOOTBALL_POSITION_LABELS[pos as FootballPosition]
                          : pos
                      ).join(' / ')}
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-3 mb-3">
                  <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-foreground">
                    {player.name}
                  </h1>
                  {player.username && (
                    <p className="text-sm text-muted-foreground" data-testid="text-player-username">@{player.username}</p>
                  )}
                  <CaliberBadge 
                    playerId={id} 
                    isOwner={(user as any)?.isOwner} 
                    showControls={isAuthenticated}
                    size="md" 
                  />
                  {!isFootball && player.stateRank && player.state && (
                    <AnimatedRankBadge 
                      type="state" 
                      rank={player.stateRank} 
                      state={player.state} 
                    />
                  )}
                  {!isFootball && player.countryRank && (
                    <AnimatedRankBadge 
                      type="country" 
                      rank={player.countryRank} 
                    />
                  )}
                  {isOwnProfile && themeName && (
                    <div className="theme-badge" data-testid="active-theme-indicator" title={`Theme: ${themeName}`}>
                      <Palette className="w-3 h-3" />
                      <span>{themeName}</span>
                    </div>
                  )}
                  {isOwnProfile && (equippedProfileSkin || equippedEffect || equippedBadgeStyle) && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50 border border-border" data-testid="equipped-cosmetics-indicator">
                      {equippedProfileSkin && (
                        <div className="flex items-center gap-1" title={`Skin: ${equippedProfileSkin.item.name}`}>
                          <User className="w-3 h-3 text-purple-400" />
                        </div>
                      )}
                      {equippedEffect && (
                        <div className="flex items-center gap-1" title={`Effect: ${equippedEffect.item.name}`}>
                          <Sparkles className="w-3 h-3 text-pink-400" />
                        </div>
                      )}
                      {equippedBadgeStyle && (
                        <div className="flex items-center gap-1" title={`Badge: ${equippedBadgeStyle.item.name}`}>
                          <Gem className="w-3 h-3 text-accent" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs md:text-sm text-muted-foreground mb-4">
                  {player.height && (
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/50 border border-border">
                      <User className="w-3.5 h-3.5 text-muted-foreground" /> {player.height}
                    </span>
                  )}
                  {player.team && (
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/50 border border-border font-medium">
                      <Shield className="w-3.5 h-3.5 text-muted-foreground" /> {player.team}
                    </span>
                  )}
                  {player.gpa && (
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/50 border border-border">
                      <BookOpen className="w-3.5 h-3.5 text-muted-foreground" /> {parseFloat(player.gpa).toFixed(2)} GPA
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/50 border border-border">
                    <Activity className="w-3.5 h-3.5 text-muted-foreground" /> {games.length} Games
                  </span>
                </div>

                {player.bio && (
                  <p 
                    className="text-sm text-muted-foreground max-w-lg mb-4 text-center md:text-left leading-relaxed"
                    data-testid="text-player-bio"
                  >
                    {player.bio}
                  </p>
                )}

                {isOwnProfile && !player.username && (
                  <button 
                    onClick={() => setIsEditDialogOpen(true)}
                    className="text-sm text-muted-foreground/60 mb-2 text-center md:text-left italic flex items-center gap-1.5 hover-elevate rounded-lg px-2 py-1"
                    data-testid="button-add-username"
                  >
                    <Pencil className="w-3 h-3" /> Set a username so others can find you
                  </button>
                )}

                {isOwnProfile && !player.bio && (
                  <button 
                    onClick={() => setIsEditDialogOpen(true)}
                    className="text-sm text-muted-foreground/60 mb-4 text-center md:text-left italic flex items-center gap-1.5 hover-elevate rounded-lg px-2 py-1"
                    data-testid="button-add-bio"
                  >
                    <Pencil className="w-3 h-3" /> Add a bio to tell people about yourself
                  </button>
                )}

                {isOwnProfile && (() => {
                  const fields = [
                    { done: !!player.name, label: "Name" },
                    { done: !!player.username, label: "Username" },
                    { done: !!player.photoUrl, label: "Photo" },
                    { done: !!player.bio, label: "Bio" },
                    { done: !!player.team, label: "Team" },
                    { done: !!player.height, label: "Height" },
                    { done: !!player.school, label: "School" },
                    { done: !!player.city && !!player.state, label: "Location" },
                    { done: games.length > 0, label: "First Game" },
                  ];
                  const completed = fields.filter(f => f.done).length;
                  const pct = Math.round((completed / fields.length) * 100);
                  if (pct >= 100) return null;
                  const missing = fields.filter(f => !f.done).map(f => f.label);
                  return (
                    <div className="mb-4 max-w-md" data-testid="profile-completion">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-muted-foreground">Profile {pct}% complete</span>
                        <span className="text-xs text-muted-foreground/60">
                          {missing.length > 0 && `Add: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '...' : ''}`}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-accent"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                    </div>
                  );
                })()}

                {games.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-3 mb-4" 
                    data-testid="player-averages-header"
                  >
                    {isFootball ? (
                      <>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
                          <Zap className="w-4 h-4 text-accent" />
                          <span className="text-xs text-muted-foreground uppercase font-medium">YDS/G</span>
                          <span className="text-sm font-bold text-foreground">{games.length ? (totalYards / games.length).toFixed(0) : "—"}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
                          <Target className="w-4 h-4 text-green-500" />
                          <span className="text-xs text-muted-foreground uppercase font-medium">TD/G</span>
                          <span className="text-sm font-bold text-foreground">{avgTDs}</span>
                        </div>
                        {hasPosition(player.position, ['QB']) && (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
                            <Crosshair className="w-4 h-4 text-amber-500" />
                            <span className="text-xs text-muted-foreground uppercase font-medium">COMP%</span>
                            <span className="text-sm font-bold text-foreground">{compPercent}%</span>
                          </div>
                        )}
                        {hasPosition(player.position, ['RB']) && (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
                            <Zap className="w-4 h-4 text-amber-500" />
                            <span className="text-xs text-muted-foreground uppercase font-medium">YPC</span>
                            <span className="text-sm font-bold text-foreground">{yardsPerCarry}</span>
                          </div>
                        )}
                        {hasPosition(player.position, ['WR', 'TE']) && (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
                            <Target className="w-4 h-4 text-amber-500" />
                            <span className="text-xs text-muted-foreground uppercase font-medium">REC</span>
                            <span className="text-sm font-bold text-foreground">{totalReceptions}</span>
                          </div>
                        )}
                        {hasPosition(player.position, ['DL', 'LB', 'DB']) && (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
                            <Shield className="w-4 h-4 text-amber-500" />
                            <span className="text-xs text-muted-foreground uppercase font-medium">TCK/G</span>
                            <span className="text-sm font-bold text-foreground">{avgTackles}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
                          <Target className="w-4 h-4 text-accent" />
                          <span className="text-xs text-muted-foreground uppercase font-medium">PPG</span>
                          <span className="text-sm font-bold text-foreground">{avgPoints}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span className="text-xs text-muted-foreground uppercase font-medium">RPG</span>
                          <span className="text-sm font-bold text-foreground">{avgReb}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
                          <Zap className="w-4 h-4 text-amber-500" />
                          <span className="text-xs text-muted-foreground uppercase font-medium">APG</span>
                          <span className="text-sm font-bold text-foreground">{avgAst}</span>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
                
                {games.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4">
                    <EliteAchievements 
                      ppg={parseFloat(avgPoints) || 0}
                      rpg={parseFloat(avgReb) || 0}
                      apg={parseFloat(avgAst) || 0}
                      ydsPerGame={parseFloat(String(totalYards / games.length)) || 0}
                      tdsPerGame={parseFloat(String(totalTDs / games.length)) || 0}
                      tacklesPerGame={parseFloat(avgTackles) || 0}
                    />
                  </div>
                )}
                
                {isAuthenticated && (
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
                    <FollowStats 
                      playerId={id} 
                      onFollowersClick={() => setShowFollowersSheet(true)}
                      onFollowingClick={() => setShowFollowingSheet(true)}
                    />
                    <div className="w-px h-8 bg-border/50 hidden md:block" />
                    <div className="flex items-center gap-4">
                      {badges.length > 0 && (
                        <div className="flex flex-col items-center" data-testid="stat-badges-count">
                          <span className="stat-value text-2xl text-foreground">{badges.length}</span>
                          <span className="stat-label flex items-center gap-1">
                            <Award className="w-3 h-3" /> Badges
                          </span>
                        </div>
                      )}
                      {(() => {
                        const now = new Date();
                        const thisMonth = games.filter(g => {
                          const d = new Date(g.date);
                          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                        });
                        return thisMonth.length > 0 ? (
                          <div className="flex flex-col items-center" data-testid="stat-games-this-month">
                            <span className="stat-value text-2xl text-foreground">{thisMonth.length}</span>
                            <span className="stat-label flex items-center gap-1">
                              <Target className="w-3 h-3" /> This Month
                            </span>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>
                )}

                {isOwnProfile && progression && (
                  <div className="max-w-sm mb-4" data-testid="hero-xp-progress">
                    <div className="flex items-center gap-2 mb-1">
                      {(() => {
                        const tierIcons: Record<string, any> = {
                          Rookie: Star,
                          Starter: Zap,
                          "All-Star": Sparkles,
                          MVP: Trophy,
                          "Hall of Fame": Crown,
                        };
                        const TierIconComponent = tierIcons[progression.currentTier] || Star;
                        return <TierIconComponent className="w-4 h-4 text-accent" />;
                      })()}
                      <span className="text-sm font-bold text-foreground">{progression.currentTier}</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-1">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-500"
                        style={{ width: `${progression.progressPercent ?? 0}%` }}
                      />
                    </div>
                    {progression.nextTier ? (
                      <span className="text-xs text-muted-foreground">
                        {progression.totalXp.toLocaleString()} / {(progression.totalXp + progression.xpToNextTier).toLocaleString()} XP to {progression.nextTier}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {progression.totalXp.toLocaleString()} XP — Max tier reached
                      </span>
                    )}
                  </div>
                )}

                {progression && progression.currentStreak > 0 && (
                  <div className="flex items-center gap-2 text-sm" data-testid="streak-indicator">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-foreground font-semibold">{progression.currentStreak}-day streak</span>
                    {progression.longestStreak > 0 && (
                      <span className="text-muted-foreground">Best: {progression.longestStreak} days</span>
                    )}
                  </div>
                )}

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-3"
                >
                  {isAuthenticated && !isOwnProfile && (
                    <FollowButton 
                      playerId={id} 
                      initialIsFollowing={isFollowingPlayer}
                    />
                  )}
                  {isOwnProfile && (
                    <Button 
                      onClick={() => setIsEditDialogOpen(true)} 
                      size="sm"
                      className="gap-1.5"
                      data-testid="button-edit-profile"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit Profile
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
                  <Link href={`/profile/${player.id}/public`}>
                    <Button variant="outline" size="sm" className="gap-1.5" data-testid="button-view-scout-profile">
                      <Target className="w-3 h-3" />
                      Scout Me Profile
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1.5"
                    data-testid="button-share-recruit-profile"
                    onClick={() => {
                      const url = `${window.location.origin}/recruit/${player.id}`;
                      navigator.clipboard.writeText(url).then(() => {
                        toast({
                          title: "Link Copied",
                          description: "Recruiting profile link copied to clipboard",
                        });
                      }).catch(() => {
                        toast({
                          title: "Share URL",
                          description: url,
                        });
                      });
                    }}
                  >
                    <Rss className="w-3.5 h-3.5" /> Share Recruiting Profile
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
                </motion.div>
              </div>

              <div className="hidden md:flex flex-col items-center gap-3 shrink-0 pt-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em]">Overall Grade</span>
                <GradeBadge grade={averageGrade} size="xl" />
              </div>
            </div>

            <div className="flex md:hidden justify-center mt-4">
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 border border-border">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Overall Grade</span>
                <GradeBadge grade={averageGrade} size="lg" />
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {isOwnProfile && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4"
          data-testid="greeting-banner"
        >
          <div className="flex items-center gap-3 px-1">
            {(() => {
              const greeting = getGreeting();
              const GreetingIcon = greeting.icon;
              return (
                <>
                  <GreetingIcon className="w-5 h-5 text-amber-400" style={{ filter: "drop-shadow(0 0 6px rgba(251, 191, 36, 0.5))" }} />
                  <span className="text-lg font-display text-white/90">
                    {greeting.text}, <span className="bg-gradient-to-r from-white to-accent bg-clip-text text-transparent font-bold">{player.name.split(' ')[0]}</span>
                  </span>
                </>
              );
            })()}
          </div>
        </motion.div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0"
        >
          <TabsList className="w-max md:w-auto inline-flex bg-black/40 backdrop-blur-sm border border-white/10 p-1 rounded-xl">
            <TabsTrigger 
              value="overview" 
              className="gap-2 rounded-lg transition-all duration-300 data-[state=active]:bg-accent data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-accent/25 text-muted-foreground hover:text-white" 
              data-testid="tab-overview"
            >
              <BarChart3 className="w-4 h-4" /> Overview
            </TabsTrigger>
            <TabsTrigger 
              value="highlights" 
              className="gap-2 rounded-lg transition-all duration-300 data-[state=active]:bg-accent data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-accent/25 text-muted-foreground hover:text-white" 
              data-testid="tab-highlights"
            >
              <Film className="w-4 h-4" /> Highlights
            </TabsTrigger>
            <TabsTrigger 
              value="accolades" 
              className="gap-2 rounded-lg transition-all duration-300 data-[state=active]:bg-accent data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-accent/25 text-muted-foreground hover:text-white" 
              data-testid="tab-accolades"
            >
              <Trophy className="w-4 h-4" /> Accolades
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="gap-2 rounded-lg transition-all duration-300 data-[state=active]:bg-accent data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-accent/25 text-muted-foreground hover:text-white" 
              data-testid="tab-activity"
            >
              <Rss className="w-4 h-4" /> Activity
            </TabsTrigger>
            <TabsTrigger 
              value="coach" 
              className="gap-2 rounded-lg transition-all duration-300 data-[state=active]:bg-accent data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-accent/25 text-muted-foreground hover:text-white" 
              data-testid="tab-coach"
            >
              <Phone className="w-4 h-4" /> Coach
            </TabsTrigger>
            {isFootball && (
              <TabsTrigger 
                value="scouting" 
                className="gap-2 rounded-lg transition-all duration-300 data-[state=active]:bg-accent data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-accent/25 text-muted-foreground hover:text-white" 
                data-testid="tab-scouting"
              >
                <Crosshair className="w-4 h-4" /> Scouting
              </TabsTrigger>
            )}
            {isOwnProfile && (
              <TabsTrigger 
                value="inventory" 
                className="gap-2 rounded-lg transition-all duration-300 data-[state=active]:bg-accent data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-accent/25 text-muted-foreground hover:text-white" 
                data-testid="tab-inventory"
              >
                <Package className="w-4 h-4" /> Inventory
              </TabsTrigger>
            )}
          </TabsList>
        </motion.div>

        <TabsContent value="overview" className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <ProfileWidgets
              games={games}
              selectedWidgets={widgetPreferences}
              onWidgetsChange={handleWidgetsChange}
              isOwnProfile={isOwnProfile}
              position={player.position}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.4 }}
          >
            <Card className="p-6 bg-gradient-to-br from-black/60 to-black/30 border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30">
                  <Star className="w-4 h-4 text-amber-400" style={{ filter: "drop-shadow(0 0 6px rgba(251, 191, 36, 0.6))" }} />
                </div>
                <span className="bg-gradient-to-r from-white to-amber-300 bg-clip-text text-transparent">
                  Ratings & Trust Score
                </span>
              </h3>
              <PlayerRatingsSection 
                playerId={player.id} 
                isOwnProfile={isOwnProfile}
                sport={player.sport as 'basketball' | 'football'}
                position={player.position}
              />
            </Card>
          </motion.div>

          {games.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              <PlayerArchetype 
                games={games} 
                position={player.position as "Guard" | "Wing" | "Big"}
              />
            </motion.div>
          )}

          <MilestonesSection playerId={player.id} playerName={player.name} />

          <MemorySection playerId={player.id} />

          <EndorsementSection playerId={player.id} playerName={player.name} />

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <PlayerProgression playerId={player.id} />
            
            <div 
              className="relative overflow-hidden rounded-xl border border-accent/20 p-5"
              style={{ 
                background: `linear-gradient(135deg, hsl(var(--accent) / 0.05) 0%, rgba(0, 0, 0, 0.4) 100%)`,
                boxShadow: "0 0 30px hsl(var(--accent) / 0.08)"
              }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-[60px] rounded-full pointer-events-none" />
              <h4 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-accent/20 border border-accent/30">
                  <Zap className="w-4 h-4 text-accent" style={{ filter: "drop-shadow(0 0 6px hsl(var(--accent) / 0.6))" }} />
                </div>
                <span className="bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">XP Rewards</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm relative z-10">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5 hover:border-accent/20 transition-colors">
                  <span className="text-muted-foreground">Log a Game</span>
                  <span className="font-bold text-accent">+50 XP</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5 hover:border-accent/20 transition-colors">
                  <span className="text-muted-foreground">Earn Badge</span>
                  <span className="font-bold text-accent">+25 XP</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5 hover:border-accent/20 transition-colors">
                  <span className="text-muted-foreground">A Grade</span>
                  <span className="font-bold text-accent">+30 XP</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5 hover:border-accent/20 transition-colors">
                  <span className="text-muted-foreground">A+ Grade</span>
                  <span className="font-bold text-accent">+50 XP</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-gradient-to-r from-orange-500/10 to-amber-500/5 border border-orange-500/20 hover:border-orange-500/40 transition-colors">
                  <span className="text-orange-400">3-Day Streak</span>
                  <span className="font-bold text-orange-400">+25 XP</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-gradient-to-r from-orange-500/10 to-amber-500/5 border border-orange-500/20 hover:border-orange-500/40 transition-colors">
                  <span className="text-orange-400">7-Day Streak</span>
                  <span className="font-bold text-orange-400">+75 XP</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.4 }}
          >
            <Card className="p-6" data-testid="badge-showcase">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-accent" />
                <h3 className="text-lg font-bold font-display">Badges</h3>
              </div>
              {badges.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No badges earned yet. Log games to start earning!
                </p>
              )}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {Object.entries(BADGE_DEFINITIONS).map(([badgeKey, def]) => {
                  const earned = badges.find((b: Badge) => b.badgeType === badgeKey);
                  const IconComponent = BADGE_ICONS[badgeKey] || Award;
                  return (
                    <div
                      key={badgeKey}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-2",
                        !earned && "opacity-30"
                      )}
                      data-testid={`badge-item-${badgeKey}`}
                    >
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          earned ? "bg-accent/10" : "bg-muted"
                        )}
                      >
                        <IconComponent
                          className={cn(
                            "w-5 h-5",
                            earned ? "text-accent" : "text-muted-foreground"
                          )}
                        />
                      </div>
                      <span className="text-xs text-center font-medium leading-tight">
                        {def.name}
                      </span>
                      {earned && earned.earnedAt && (
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(earned.earnedAt), "MMM d")}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                <Medal className="w-5 h-5 text-accent" style={{ filter: "drop-shadow(0 0 6px hsl(var(--accent) / 0.6))" }} />
              </div>
              <h3 className="text-lg font-bold font-display bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
                Skill Badges
              </h3>
            </div>
            <SkillBadges playerId={player.id} position={player.position} />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                  <BarChart3 className="w-5 h-5 text-accent" style={{ filter: "drop-shadow(0 0 6px hsl(var(--accent) / 0.6))" }} />
                </div>
                <h3 className="text-lg font-bold font-display bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
                  Season Statistics
                </h3>
              </div>
          {isFootball ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <StatCard label="Games" value={games.length} />
              {/* QB Stats */}
              {hasPosition(player.position, ['QB']) && (
                <>
                  <StatCard label="Pass YDS" value={totalPassingYards} highlight={true} sparklineData={sparklines.passingYards} />
                  <StatCard label="Pass TDs" value={totalPassingTDs} highlight={true} sparklineData={sparklines.passingTDs} />
                  <StatCard label="COMP%" value={compPercent !== "—" ? `${compPercent}%` : "—"} sparklineData={sparklines.completions} />
                  <StatCard label="INTs" value={totalDefensiveINTs} sparklineData={sparklines.defensiveINTs} />
                  <StatCard label="Rush YDS" value={totalRushingYards} sparklineData={sparklines.rushingYards} />
                  <StatCard label="Rush TDs" value={totalRushingTDs} sparklineData={sparklines.rushingTDs} />
                </>
              )}
              {/* RB Stats */}
              {hasPosition(player.position, ['RB']) && (
                <>
                  <StatCard label="Rush YDS" value={totalRushingYards} highlight={true} sparklineData={sparklines.rushingYards} />
                  <StatCard label="Rush TDs" value={totalRushingTDs} highlight={true} sparklineData={sparklines.rushingTDs} />
                  <StatCard label="YPC" value={yardsPerCarry} sparklineData={sparklines.carries} />
                  <StatCard label="Carries" value={totalCarries} sparklineData={sparklines.carries} />
                  <StatCard label="Rec YDS" value={totalReceivingYards} sparklineData={sparklines.receivingYards} />
                  <StatCard label="Rec TDs" value={totalReceivingTDs} sparklineData={sparklines.receivingTDs} />
                  <StatCard label="Receptions" value={totalReceptions} sparklineData={sparklines.receptions} />
                </>
              )}
              {/* WR/TE Stats */}
              {hasPosition(player.position, ['WR', 'TE']) && (
                <>
                  <StatCard label="Rec YDS" value={totalReceivingYards} highlight={true} sparklineData={sparklines.receivingYards} />
                  <StatCard label="Rec TDs" value={totalReceivingTDs} highlight={true} sparklineData={sparklines.receivingTDs} />
                  <StatCard label="Receptions" value={totalReceptions} sparklineData={sparklines.receptions} />
                  <StatCard label="Targets" value={totalTargets} sparklineData={sparklines.targets} />
                  <StatCard label="YPR" value={yardsPerReception} sparklineData={sparklines.receptions} />
                </>
              )}
              {/* Defensive Stats (DL, LB, DB) */}
              {hasPosition(player.position, ['DL', 'LB', 'DB']) && (
                <>
                  <StatCard label="Tackles" value={totalTackles} highlight={true} sparklineData={sparklines.tackles} />
                  <StatCard label="Solo Tackles" value={totalSoloTackles} sparklineData={sparklines.soloTackles} />
                  <StatCard label="Sacks" value={totalSacks} highlight={hasPosition(player.position, ['DL'])} sparklineData={sparklines.sacks} />
                  <StatCard label="INTs" value={totalDefensiveINTs} highlight={hasPosition(player.position, ['DB'])} sparklineData={sparklines.defensiveINTs} />
                  <StatCard label="Pass Def" value={totalPassDeflections} sparklineData={sparklines.passDeflections} />
                  <StatCard label="FF" value={totalForcedFumbles} sparklineData={sparklines.forcedFumbles} />
                </>
              )}
              {/* Kicker Stats */}
              {hasPosition(player.position, ['K']) && (
                <>
                  <StatCard label="FG Made" value={totalFGMade} highlight={true} sparklineData={sparklines.fgMade} />
                  <StatCard label="FG Att" value={totalFGAttempted} sparklineData={sparklines.fgAttempted} />
                  <StatCard label="FG%" value={fgKickPercent !== "—" ? `${fgKickPercent}%` : "—"} sparklineData={sparklines.fgMade} />
                  <StatCard label="XP Made" value={totalXPMade} sparklineData={sparklines.xpMade} />
                  <StatCard label="XP Att" value={totalXPAttempted} sparklineData={sparklines.xpAttempted} />
                </>
              )}
              {/* Punter Stats */}
              {hasPosition(player.position, ['P']) && (
                <>
                  <StatCard label="Punts" value={totalPunts} highlight={true} sparklineData={sparklines.punts} />
                  <StatCard label="Punt YDS" value={totalPuntYards} sparklineData={sparklines.puntYards} />
                  <StatCard label="Avg Punt" value={avgPuntYards} sparklineData={sparklines.puntYards} />
                </>
              )}
              {/* OL - blocking stats */}
              {hasPosition(player.position, ['OL']) && (
                <>
                  <StatCard label="Pancakes" value={totalPancakeBlocks} highlight={true} sparklineData={sparklines.pancakeBlocks} />
                  <StatCard label="Sacks Allowed" value={totalSacksAllowed} sparklineData={sparklines.sacksAllowed} />
                  <StatCard label="Penalties" value={totalPenalties} sparklineData={sparklines.penalties} />
                </>
              )}
              <div className="rounded-xl p-5 flex flex-col justify-between relative overflow-hidden group hover:border-primary/30 transition-colors duration-300">
                <span className="stat-label text-muted-foreground/80">Avg Grade</span>
                <div className="flex items-center justify-center mt-2">
                  <GradeBadge grade={averageGrade} size="md" />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <StatCard label="Games" value={games.length} />
              <StatCard label="PPG" value={avgPoints} highlight={true} sparklineData={sparklines.points} />
              <StatCard label="RPG" value={avgReb} sparklineData={sparklines.rebounds} />
              <StatCard label="APG" value={avgAst} sparklineData={sparklines.assists} />
              <StatCard label="PER" value={avgPER} highlight={true} sparklineData={sparklines.per} />
              <StatCard label="SPG" value={avgSteals} sparklineData={sparklines.steals} />
              <StatCard label="BPG" value={avgBlocks} sparklineData={sparklines.blocks} />
              <StatCard label="FG%" value={fgPercent !== "—" ? `${fgPercent}%` : "—"} sparklineData={sparklines.fgPct} />
              <StatCard label="3P%" value={threePercent !== "—" ? `${threePercent}%` : "—"} sparklineData={sparklines.threePct} />
              <StatCard label="FT%" value={ftPercent !== "—" ? `${ftPercent}%` : "—"} sparklineData={sparklines.ftPct} />
              <div className="rounded-xl p-5 flex flex-col justify-between relative overflow-hidden group hover:border-primary/30 transition-colors duration-300">
                <span className="stat-label text-muted-foreground/80">Avg Grade</span>
                <div className="flex items-center justify-center mt-2">
                  <GradeBadge grade={averageGrade} size="md" />
                </div>
              </div>
            </div>
          )}
        </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <TrendingUp className="w-5 h-5 text-purple-400" style={{ filter: "drop-shadow(0 0 6px rgba(168, 85, 247, 0.6))" }} />
                </div>
                <h3 className="text-lg font-bold font-display bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">
                  Player Profile
                </h3>
              </div>
              <div 
                className="relative overflow-hidden rounded-xl border border-purple-500/20 p-4"
                style={{ 
                  background: "linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(0, 0, 0, 0.4) 100%)",
                  boxShadow: "0 0 30px rgba(168, 85, 247, 0.08)"
                }}
              >
                <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/5 blur-[60px] rounded-full pointer-events-none" />
            <div className="h-[220px] w-full">
              {games.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <defs>
                      <linearGradient id="playerRadarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
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
                      stroke="hsl(var(--accent))"
                      fill="url(#playerRadarGradient)"
                      strokeWidth={2.5}
                      isAnimationActive
                      filter="drop-shadow(0 0 8px hsl(var(--accent) / 0.3))"
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
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Medal className="w-5 h-5 text-amber-400" style={{ filter: "drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))" }} />
              </div>
              <h3 className="text-lg font-bold font-display bg-gradient-to-r from-white to-amber-300 bg-clip-text text-transparent">
                Top 5 Games
              </h3>
            </div>
        
        {topGames.length === 0 ? (
          <Card className="relative overflow-hidden border-accent/[0.08]" data-testid="empty-state-top-games">
            <div className="absolute inset-x-[10%] top-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
            <EmptyState
              icon={PlayCircle}
              title="No Games Logged Yet"
              description="Log your first game to track performance, earn grades, and see your top plays."
              action={{ label: "Log First Game", href: "/analyze" }}
              variant="compact"
            />
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
                        {isFootball ? (
                          <div className="hidden sm:flex gap-4 text-sm font-medium text-white/80">
                            <span><span className="text-muted-foreground text-xs">YDS</span> {(game.passingYards || 0) + (game.rushingYards || 0) + (game.receivingYards || 0)}</span>
                            <span><span className="text-muted-foreground text-xs">TDs</span> {(game.passingTouchdowns || 0) + (game.rushingTouchdowns || 0) + (game.receivingTouchdowns || 0)}</span>
                            <span className="text-primary"><span className="text-primary/60 text-xs">RTG</span> {game.grade || "—"}</span>
                          </div>
                        ) : (
                          <div className="hidden sm:flex gap-4 text-sm font-medium text-white/80">
                            <span><span className="text-muted-foreground text-xs">PTS</span> {game.points}</span>
                            <span><span className="text-muted-foreground text-xs">REB</span> {game.rebounds}</span>
                            <span><span className="text-muted-foreground text-xs">AST</span> {game.assists}</span>
                            <span className="text-primary"><span className="text-primary/60 text-xs">PER</span> {game.points + game.rebounds + game.assists}</span>
                          </div>
                        )}
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
                      {isFootball ? (
                        <>
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground mb-1">Pass YDS</div>
                              <div className="text-lg font-bold text-white">{game.passingYards || 0}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground mb-1">Rush YDS</div>
                              <div className="text-lg font-bold text-white">{game.rushingYards || 0}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground mb-1">Rec YDS</div>
                              <div className="text-lg font-bold text-white">{game.receivingYards || 0}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-primary/60 mb-1">Total TDs</div>
                              <div className="text-lg font-bold text-primary">{(game.passingTouchdowns || 0) + (game.rushingTouchdowns || 0) + (game.receivingTouchdowns || 0)}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground mb-1">Tackles</div>
                              <div className="text-lg font-bold text-white">{game.tackles || 0}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground mb-1">Sacks</div>
                              <div className="text-lg font-bold text-white">{game.sacks || 0}</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/5">
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground mb-1">COMP</div>
                              <div className="text-sm font-medium text-white">
                                {game.completions || 0}/{game.passAttempts || 0}
                                <span className="text-muted-foreground ml-1">
                                  ({game.passAttempts ? ((game.completions || 0) / game.passAttempts * 100).toFixed(0) : 0}%)
                                </span>
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground mb-1">Carries</div>
                              <div className="text-sm font-medium text-white">{game.carries || 0}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground mb-1">Receptions</div>
                              <div className="text-sm font-medium text-white">{game.receptions || 0}/{game.targets || 0}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground mb-1">Turnovers</div>
                              <div className="text-sm font-medium text-red-400">{(game.interceptions || 0) + (game.fumbles || 0)}</div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
                      
                      {isFootball ? (
                        (game.efficiencyGrade || game.playmakingGrade || game.ballSecurityGrade || game.impactGrade) && (
                          <div className="mt-4 pt-4 border-t border-white/5">
                            <div className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-medium">Category Grades</div>
                            <div className="grid grid-cols-4 gap-2">
                              {[
                                { label: "EFF", value: game.efficiencyGrade, icon: Target, color: "from-blue-500/10 to-sky-600/5 border-blue-500/20", testId: "grade-efficiency" },
                                { label: "PLAY", value: game.playmakingGrade, icon: Zap, color: "from-purple-500/10 to-violet-600/5 border-purple-500/20", testId: "grade-playmaking" },
                                { label: "SEC", value: game.ballSecurityGrade, icon: ShieldCheck, color: "from-green-500/10 to-emerald-600/5 border-green-500/20", testId: "grade-security" },
                                { label: "IMP", value: game.impactGrade, icon: Flame, color: "from-orange-500/10 to-red-600/5 border-orange-500/20", testId: "grade-impact" },
                              ].map((cat) => (
                                <div 
                                  key={cat.label} 
                                  data-testid={`${cat.testId}-${game.id}`}
                                  className={cn(
                                    "text-center p-2 rounded-lg bg-gradient-to-br border transition-colors duration-300",
                                    cat.color
                                  )}
                                >
                                  <cat.icon className="w-3 h-3 mx-auto mb-1 text-muted-foreground" />
                                  <div className={cn("text-lg font-bold", getGradeColor(cat.value || "").text)}>
                                    {cat.value || "—"}
                                  </div>
                                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">{cat.label}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      ) : (
                        (game.defensiveGrade || game.shootingGrade || game.reboundingGrade || game.passingGrade) && (
                          <div className="mt-4 pt-4 border-t border-white/5">
                            <div className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-medium">Category Grades</div>
                            <div className="grid grid-cols-4 gap-2">
                              {[
                                { label: "DEF", value: game.defensiveGrade, icon: Shield, color: "from-green-500/10 to-emerald-600/5 border-green-500/20", testId: "grade-defense" },
                                { label: "SHOT", value: game.shootingGrade, icon: Target, color: "from-red-500/10 to-rose-600/5 border-red-500/20", testId: "grade-shooting" },
                                { label: "REB", value: game.reboundingGrade, icon: Zap, color: "from-blue-500/10 to-sky-600/5 border-blue-500/20", testId: "grade-rebounding" },
                                { label: "PASS", value: game.passingGrade, icon: Activity, color: "from-purple-500/10 to-violet-600/5 border-purple-500/20", testId: "grade-passing" },
                              ].map((cat) => (
                                <div 
                                  key={cat.label} 
                                  data-testid={`${cat.testId}-${game.id}`}
                                  className={cn(
                                    "text-center p-2 rounded-lg bg-gradient-to-br border transition-colors duration-300",
                                    cat.color
                                  )}
                                >
                                  <cat.icon className="w-3 h-3 mx-auto mb-1 text-muted-foreground" />
                                  <div className={cn("text-lg font-bold", getGradeColor(cat.value || "").text)}>
                                    {cat.value || "—"}
                                  </div>
                                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">{cat.label}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      )}
                      
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <GoalsPanel playerId={player.id} games={games} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.4 }}
          >
            <Tabs defaultValue="history" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-black/40 backdrop-blur-sm border border-white/10 p-1 rounded-xl">
                <TabsTrigger 
                  value="history" 
                  className="gap-2 rounded-lg transition-all duration-300 data-[state=active]:bg-accent data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-accent/25 text-muted-foreground hover:text-white" 
                  data-testid="tab-game-history"
                >
                  <ClipboardList className="w-4 h-4" /> Game History
                </TabsTrigger>
                <TabsTrigger 
                  value="highlights" 
                  className="gap-2 rounded-lg transition-all duration-300 data-[state=active]:bg-accent data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-accent/25 text-muted-foreground hover:text-white" 
                  data-testid="tab-highlights"
                >
                  <Film className="w-4 h-4" /> Highlights
                </TabsTrigger>
              </TabsList>
        
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
                <div data-testid="empty-state-game-history">
                  <EmptyState
                    icon={ClipboardList}
                    title="No Game History"
                    description="Log games to build a complete performance record and track your progress over time."
                    action={{ label: "Log a Game", href: "/analyze" }}
                    variant="compact"
                  />
                </div>
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
                    
                    {isFootball ? (
                      (game.efficiencyGrade || game.playmakingGrade || game.ballSecurityGrade || game.impactGrade) && (
                        <div className="flex gap-1.5 mb-2">
                          {[
                            { label: "EFF", value: game.efficiencyGrade, icon: Target, testId: "grade-efficiency" },
                            { label: "PLAY", value: game.playmakingGrade, icon: Zap, testId: "grade-playmaking" },
                            { label: "SEC", value: game.ballSecurityGrade, icon: ShieldCheck, testId: "grade-security" },
                            { label: "IMP", value: game.impactGrade, icon: Flame, testId: "grade-impact" },
                          ].map((cat) => (
                            <div 
                              key={cat.label}
                              data-testid={`${cat.testId}-history-${game.id}`}
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/10"
                            >
                              <cat.icon className="w-2.5 h-2.5 text-muted-foreground" />
                              <span className={cn("text-[10px] font-bold", getGradeColor(cat.value || "").text)}>
                                {cat.value || "—"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )
                    ) : (
                      (game.defensiveGrade || game.shootingGrade || game.reboundingGrade || game.passingGrade) && (
                        <div className="flex gap-1.5 mb-2">
                          {[
                            { label: "DEF", value: game.defensiveGrade, icon: Shield, testId: "grade-defense" },
                            { label: "SHOT", value: game.shootingGrade, icon: Target, testId: "grade-shooting" },
                            { label: "REB", value: game.reboundingGrade, icon: Zap, testId: "grade-rebounding" },
                            { label: "PASS", value: game.passingGrade, icon: Activity, testId: "grade-passing" },
                          ].map((cat) => (
                            <div 
                              key={cat.label}
                              data-testid={`${cat.testId}-history-${game.id}`}
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/10"
                            >
                              <cat.icon className="w-2.5 h-2.5 text-muted-foreground" />
                              <span className={cn("text-[10px] font-bold", getGradeColor(cat.value || "").text)}>
                                {cat.value || "—"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )
                    )}
                    
                    <div className="flex justify-between items-end border-t border-white/5 pt-3 mt-1">
                      <div className="flex items-center gap-4">
                        {isFootball ? (
                          <div className="flex gap-3 text-xs font-medium text-white/80">
                            <span><span className="text-muted-foreground">YDS</span> {(game.passingYards || 0) + (game.rushingYards || 0) + (game.receivingYards || 0)}</span>
                            <span><span className="text-muted-foreground">TDs</span> {(game.passingTouchdowns || 0) + (game.rushingTouchdowns || 0) + (game.receivingTouchdowns || 0)}</span>
                            <span className="text-primary"><span className="text-primary/60">RTG</span> {game.grade || "—"}</span>
                          </div>
                        ) : (
                          <div className="flex gap-3 text-xs font-medium text-white/80">
                            <span><span className="text-muted-foreground">PTS</span> {game.points}</span>
                            <span><span className="text-muted-foreground">REB</span> {game.rebounds}</span>
                            <span><span className="text-muted-foreground">AST</span> {game.assists}</span>
                            <span className="text-primary"><span className="text-primary/60">PER</span> {game.points + game.rebounds + game.assists}</span>
                          </div>
                        )}
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <CoachToolsSection playerId={player.id} games={games} />
          </motion.div>
        </TabsContent>

        <TabsContent value="highlights">
          <HighlightsGallery playerId={player.id} isOwner={isOwnProfile} />
        </TabsContent>

        <TabsContent value="accolades">
          <AccoladesSection playerId={player.id} isOwnProfile={isOwnProfile} />
        </TabsContent>

        <TabsContent value="activity">
          <PlayerActivityTab playerId={id} playerName={player.name} isOwnProfile={isOwnProfile} />
        </TabsContent>

        <TabsContent value="coach">
          <CoachContactSection 
            player={player} 
            isOwnProfile={isOwnProfile} 
          />
        </TabsContent>

        {isFootball && (
          <TabsContent value="scouting" className="space-y-6 animate-fade-in">
            <FootballMetrics 
              playerId={player.id} 
              canEdit={isOwnProfile} 
            />
          </TabsContent>
        )}

        {isOwnProfile && (
          <TabsContent value="inventory" className="space-y-6 animate-fade-in">
            <InventorySection />
          </TabsContent>
        )}
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
                  {editForm.photoUrl && <AvatarImage src={editForm.photoUrl} alt="Profile" width={96} height={96} />}
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

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                  <Input
                    value={editForm.username || ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
                      setEditForm((prev) => ({ ...prev, username: val }));
                    }}
                    placeholder="hoopstar23"
                    maxLength={20}
                    className="bg-secondary/30 border-white/10 text-white placeholder:text-white/20 pl-8"
                    data-testid="input-edit-username"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">3-20 characters. Letters, numbers, and underscores only.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                  Position(s) <span className="font-normal text-muted-foreground/60">(Select all that apply)</span>
                </label>
                <div className={`grid gap-2 ${isFootball ? 'grid-cols-5' : 'grid-cols-3'}`}>
                  {(isFootball ? FOOTBALL_POSITIONS : ['Guard', 'Wing', 'Big']).map((pos) => (
                    <div
                      key={pos}
                      onClick={() => toggleEditPosition(pos)}
                      className={`
                        cursor-pointer rounded-lg border p-2 text-center text-sm font-medium transition-all
                        ${editPositions.includes(pos)
                          ? 'border-primary bg-primary/10 text-white'
                          : 'border-white/10 bg-secondary/30 text-muted-foreground hover:border-white/30 hover:bg-secondary/50'
                        }
                      `}
                      data-testid={`position-edit-${pos.toLowerCase()}`}
                    >
                      {isFootball && FOOTBALL_POSITIONS.includes(pos as FootballPosition) 
                        ? FOOTBALL_POSITION_LABELS[pos as FootballPosition] 
                        : pos}
                    </div>
                  ))}
                </div>
                {editPositions.length > 0 && (
                  <p className="text-xs text-primary">
                    Selected: {editPositions.map(p => 
                      isFootball && FOOTBALL_POSITIONS.includes(p as FootballPosition) 
                        ? FOOTBALL_POSITION_LABELS[p as FootballPosition] 
                        : p
                    ).join(', ')}
                  </p>
                )}
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
                
                <div className="grid grid-cols-3 gap-4">
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
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">GPA</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="4"
                      value={editForm.gpa?.toString() || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          setEditForm((prev) => ({ ...prev, gpa: undefined }));
                        } else {
                          const num = parseFloat(val);
                          if (!isNaN(num) && num >= 0 && num <= 4) {
                            setEditForm((prev) => ({ ...prev, gpa: num }));
                          }
                        }
                      }}
                      placeholder="3.50"
                      className="bg-secondary/30 border-white/10 text-white placeholder:text-white/20"
                      data-testid="input-edit-gpa"
                    />
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
                    onGetUploadParameters={handleBannerUpload}
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
                    <img src={editForm.bannerUrl} alt="Banner preview" className="w-full h-24 object-cover" loading="lazy" />
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
