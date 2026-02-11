import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Shield, TrendingUp, CheckCircle, Award, Target, Sparkles, Clock, ChevronRight, AlertCircle, Lock, Zap, Crosshair, Activity, Heart, Brain, Gauge, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface PlayerRating {
  id: number;
  playerId: number;
  ratedByUserId: string;
  raterType: string;
  overallRating: number;
  potentialRating: number | null;
  skillRatings: Record<string, number> | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SubScores {
  production: number;
  efficiency: number;
  impact: number;
  defense: number;
  athletic: number;
  intangibles: number;
}

interface AIRatingResult {
  overallRating: number | null;
  subScores: SubScores | null;
  contextMultipliers?: {
    opponentStrength: number;
    gameImportance: number;
    roleMultiplier: number;
    recencyWeight: number;
  };
  percentileRank?: number;
  consistencyIndex?: number;
  explanation?: string[];
  ratingBand?: string;
  confidence?: number;
  message?: string;
}

interface ProjectionResult {
  currentRating: number;
  projection: {
    trajectoryScore: number;
    translationScore: number;
    upsideScore: number;
    riskScore: number;
    likelyRating: number;
    ceilingRating: number;
    floorRating: number;
    levelMapping: string;
    confidencePercent: number;
    explanations: string[];
  } | null;
  message?: string;
}

interface PerformanceMilestone {
  id: number;
  playerId: number;
  milestoneType: string;
  statCategory: string;
  threshold: number;
  currentValue: number;
  achievedAt: string;
}

interface AiProjection {
  id: number;
  playerId: number;
  projectionType: string;
  projectedStats: Record<string, any>;
  confidenceScore: number;
  analysis: string;
  createdAt: string;
}

interface Props {
  playerId: number;
  isOwnProfile: boolean;
  sport?: 'basketball' | 'football';
  position?: string;
}

type SubScoreKey = 'production' | 'efficiency' | 'impact' | 'defense' | 'athletic' | 'intangibles';

interface SubScoreConfigItem {
  label: string;
  icon: typeof Target;
  color: string;
  description: string;
}

const BASKETBALL_SUB_SCORE_CONFIG: Record<SubScoreKey, SubScoreConfigItem> = {
  production: { label: "Production", icon: Target, color: "text-accent", description: "PPG, APG, RPG" },
  efficiency: { label: "Efficiency", icon: Gauge, color: "text-emerald-400", description: "TS%, eFG%, AST/TO" },
  impact: { label: "Impact", icon: Zap, color: "text-amber-400", description: "Plus-minus, PER, wins" },
  defense: { label: "Two-Way", icon: Shield, color: "text-purple-400", description: "Steals, blocks, contests" },
  athletic: { label: "Athletic", icon: Activity, color: "text-red-400", description: "Speed, vertical, endurance" },
  intangibles: { label: "Intangibles", icon: Brain, color: "text-blue-400", description: "Consistency, clutch, IQ" },
};

const FOOTBALL_SUB_SCORE_CONFIG: Record<SubScoreKey, SubScoreConfigItem> = {
  production: { label: "Production", icon: Target, color: "text-accent", description: "Yards, TDs, receptions" },
  efficiency: { label: "Efficiency", icon: Gauge, color: "text-emerald-400", description: "Comp%, YPC, catch rate" },
  impact: { label: "Impact", icon: Zap, color: "text-amber-400", description: "Big plays, turnovers forced" },
  defense: { label: "Two-Way", icon: Shield, color: "text-purple-400", description: "Tackles, sacks, INTs" },
  athletic: { label: "Athletic", icon: Activity, color: "text-red-400", description: "40-time, vertical, bench" },
  intangibles: { label: "Intangibles", icon: Brain, color: "text-blue-400", description: "Consistency, clutch, IQ" },
};

const FOOTBALL_POSITION_SUB_SCORES: Record<string, Record<SubScoreKey, SubScoreConfigItem>> = {
  QB: {
    production: { label: "Production", icon: Target, color: "text-accent", description: "Pass yards, TDs, rush yards" },
    efficiency: { label: "Efficiency", icon: Gauge, color: "text-emerald-400", description: "Comp%, passer rating" },
    impact: { label: "Impact", icon: Zap, color: "text-amber-400", description: "Big plays, game-winning drives" },
    defense: { label: "Ball Security", icon: Shield, color: "text-purple-400", description: "INTs avoided, fumbles" },
    athletic: { label: "Athletic", icon: Activity, color: "text-red-400", description: "40-time, arm strength" },
    intangibles: { label: "Intangibles", icon: Brain, color: "text-blue-400", description: "Pocket presence, reads" },
  },
  RB: {
    production: { label: "Production", icon: Target, color: "text-accent", description: "Rush yards, TDs, rec yards" },
    efficiency: { label: "Efficiency", icon: Gauge, color: "text-emerald-400", description: "YPC, yards after contact" },
    impact: { label: "Impact", icon: Zap, color: "text-amber-400", description: "100+ yard games, TDs" },
    defense: { label: "Ball Security", icon: Shield, color: "text-purple-400", description: "Fumbles, pass blocking" },
    athletic: { label: "Athletic", icon: Activity, color: "text-red-400", description: "Speed, agility, power" },
    intangibles: { label: "Intangibles", icon: Brain, color: "text-blue-400", description: "Vision, consistency" },
  },
  WR: {
    production: { label: "Production", icon: Target, color: "text-accent", description: "Rec yards, TDs, receptions" },
    efficiency: { label: "Efficiency", icon: Gauge, color: "text-emerald-400", description: "Catch rate, YPR" },
    impact: { label: "Impact", icon: Zap, color: "text-amber-400", description: "Big plays, contested catches" },
    defense: { label: "Hands", icon: Shield, color: "text-purple-400", description: "Drops, separation" },
    athletic: { label: "Athletic", icon: Activity, color: "text-red-400", description: "Speed, vertical, agility" },
    intangibles: { label: "Intangibles", icon: Brain, color: "text-blue-400", description: "Route running, IQ" },
  },
  TE: {
    production: { label: "Production", icon: Target, color: "text-accent", description: "Rec yards, TDs, receptions" },
    efficiency: { label: "Efficiency", icon: Gauge, color: "text-emerald-400", description: "Catch rate, blocking grade" },
    impact: { label: "Impact", icon: Zap, color: "text-amber-400", description: "Red zone TDs, big plays" },
    defense: { label: "Blocking", icon: Shield, color: "text-purple-400", description: "Run blocking, pass pro" },
    athletic: { label: "Athletic", icon: Activity, color: "text-red-400", description: "Speed, size, strength" },
    intangibles: { label: "Intangibles", icon: Brain, color: "text-blue-400", description: "Route running, hands" },
  },
  DL: {
    production: { label: "Production", icon: Target, color: "text-accent", description: "Tackles, sacks, TFLs" },
    efficiency: { label: "Efficiency", icon: Gauge, color: "text-emerald-400", description: "Pass rush win rate" },
    impact: { label: "Impact", icon: Zap, color: "text-amber-400", description: "Sacks, forced fumbles" },
    defense: { label: "Run Defense", icon: Shield, color: "text-purple-400", description: "Run stops, gap control" },
    athletic: { label: "Athletic", icon: Activity, color: "text-red-400", description: "Speed, power, bend" },
    intangibles: { label: "Intangibles", icon: Brain, color: "text-blue-400", description: "Motor, technique" },
  },
  LB: {
    production: { label: "Production", icon: Target, color: "text-accent", description: "Tackles, sacks, INTs" },
    efficiency: { label: "Efficiency", icon: Gauge, color: "text-emerald-400", description: "Tackle rate, coverage" },
    impact: { label: "Impact", icon: Zap, color: "text-amber-400", description: "Turnovers, big plays" },
    defense: { label: "Coverage", icon: Shield, color: "text-purple-400", description: "Pass deflections, INTs" },
    athletic: { label: "Athletic", icon: Activity, color: "text-red-400", description: "Speed, range, closing" },
    intangibles: { label: "Intangibles", icon: Brain, color: "text-blue-400", description: "Instincts, leadership" },
  },
  DB: {
    production: { label: "Production", icon: Target, color: "text-accent", description: "INTs, PDs, tackles" },
    efficiency: { label: "Efficiency", icon: Gauge, color: "text-emerald-400", description: "Completion % allowed" },
    impact: { label: "Impact", icon: Zap, color: "text-amber-400", description: "Turnovers, big plays" },
    defense: { label: "Coverage", icon: Shield, color: "text-purple-400", description: "Man/zone, lockdown" },
    athletic: { label: "Athletic", icon: Activity, color: "text-red-400", description: "Speed, agility, hips" },
    intangibles: { label: "Intangibles", icon: Brain, color: "text-blue-400", description: "Ball skills, instincts" },
  },
  K: {
    production: { label: "Production", icon: Target, color: "text-accent", description: "FG made, XP made" },
    efficiency: { label: "Efficiency", icon: Gauge, color: "text-emerald-400", description: "FG%, XP%" },
    impact: { label: "Impact", icon: Zap, color: "text-amber-400", description: "Clutch kicks, 50+ yarders" },
    defense: { label: "Range", icon: Shield, color: "text-purple-400", description: "Max distance, accuracy" },
    athletic: { label: "Athletic", icon: Activity, color: "text-red-400", description: "Leg strength" },
    intangibles: { label: "Intangibles", icon: Brain, color: "text-blue-400", description: "Clutch, consistency" },
  },
  P: {
    production: { label: "Production", icon: Target, color: "text-accent", description: "Punts, net yards" },
    efficiency: { label: "Efficiency", icon: Gauge, color: "text-emerald-400", description: "Avg yards, hang time" },
    impact: { label: "Impact", icon: Zap, color: "text-amber-400", description: "Inside 20, pins" },
    defense: { label: "Placement", icon: Shield, color: "text-purple-400", description: "Directional, coffin corner" },
    athletic: { label: "Athletic", icon: Activity, color: "text-red-400", description: "Leg strength" },
    intangibles: { label: "Intangibles", icon: Brain, color: "text-blue-400", description: "Consistency, pressure" },
  },
  OL: {
    production: { label: "Production", icon: Target, color: "text-accent", description: "Pancakes, blocks" },
    efficiency: { label: "Efficiency", icon: Gauge, color: "text-emerald-400", description: "Block win rate, penalties" },
    impact: { label: "Impact", icon: Zap, color: "text-amber-400", description: "Clean pockets, rushing lanes" },
    defense: { label: "Pass Pro", icon: Shield, color: "text-purple-400", description: "Sacks allowed, pressures" },
    athletic: { label: "Athletic", icon: Activity, color: "text-red-400", description: "Strength, footwork, reach" },
    intangibles: { label: "Intangibles", icon: Brain, color: "text-blue-400", description: "Communication, technique" },
  },
};

function getSubScoreConfig(sport: 'basketball' | 'football', position?: string): Record<SubScoreKey, SubScoreConfigItem> {
  if (sport === 'basketball') {
    return BASKETBALL_SUB_SCORE_CONFIG;
  }
  
  if (position) {
    const primaryPosition = position.split(',')[0].trim().toUpperCase();
    if (FOOTBALL_POSITION_SUB_SCORES[primaryPosition]) {
      return FOOTBALL_POSITION_SUB_SCORES[primaryPosition];
    }
  }
  
  return FOOTBALL_SUB_SCORE_CONFIG;
}

const MILESTONE_LABELS: Record<string, { label: string; icon: typeof Award }> = {
  points_100: { label: "Century Scorer", icon: Target },
  points_500: { label: "500 Club", icon: Star },
  points_1000: { label: "1K Legend", icon: Award },
  assists_50: { label: "Dime Dropper", icon: Sparkles },
  assists_200: { label: "Court General", icon: Shield },
  rebounds_50: { label: "Glass Cleaner", icon: Target },
  rebounds_200: { label: "Board King", icon: Award },
  passing_yards_1000: { label: "1K Passer", icon: Target },
  passing_yards_5000: { label: "5K Legend", icon: Award },
  rushing_yards_500: { label: "Ground Gainer", icon: Target },
  rushing_yards_2000: { label: "2K Rusher", icon: Award },
  tackles_50: { label: "Tackle Machine", icon: Shield },
};

function getRatingColor(rating: number): string {
  if (rating >= 90) return "text-amber-400";
  if (rating >= 80) return "text-purple-400";
  if (rating >= 70) return "text-accent";
  if (rating >= 60) return "text-blue-400";
  return "text-zinc-400";
}

function getRatingBgColor(rating: number): string {
  if (rating >= 90) return "from-amber-500/20 to-yellow-600/20 border-amber-500/30";
  if (rating >= 80) return "from-purple-500/20 to-purple-600/20 border-purple-500/30";
  if (rating >= 70) return "from-accent/20 to-accent/20 border-accent/30";
  if (rating >= 60) return "from-blue-500/20 to-blue-600/20 border-blue-500/30";
  return "from-zinc-500/20 to-zinc-600/20 border-zinc-500/30";
}

function getScoreTrend(score: number): { icon: typeof ArrowUpRight; color: string; label: string } {
  if (score >= 70) return { icon: ArrowUpRight, color: "text-emerald-400", label: "Elite" };
  if (score >= 55) return { icon: ArrowUpRight, color: "text-accent", label: "Above Avg" };
  if (score >= 45) return { icon: Minus, color: "text-zinc-400", label: "Average" };
  return { icon: ArrowDownRight, color: "text-red-400", label: "Developing" };
}

export function PlayerRatingsSection({ playerId, isOwnProfile, sport = 'basketball', position }: Props) {
  const { user } = useAuth();
  const { hasAccess } = useSubscription();
  const { toast } = useToast();
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [ratingForm, setRatingForm] = useState({
    overallRating: 75,
    potentialRating: 80,
    notes: "",
  });

  const { data: ratings, isLoading: ratingsLoading } = useQuery<PlayerRating[]>({
    queryKey: ['/api/players', playerId, 'ratings'],
  });

  const { data: averageRating, isLoading: avgLoading } = useQuery<{ overall: number; potential: number }>({
    queryKey: ['/api/players', playerId, 'average-rating'],
  });

  const { data: aiRating, isLoading: aiRatingLoading } = useQuery<AIRatingResult>({
    queryKey: ['/api/players', playerId, 'ai-rating'],
  });

  const { data: aiProjection, isLoading: aiProjectionLoading } = useQuery<ProjectionResult>({
    queryKey: ['/api/players', playerId, 'ai-projection'],
  });

  const { data: milestones, isLoading: milestonesLoading } = useQuery<PerformanceMilestone[]>({
    queryKey: ['/api/players', playerId, 'milestones'],
  });

  const { data: projections, isLoading: projectionsLoading } = useQuery<AiProjection[]>({
    queryKey: ['/api/players', playerId, 'projections'],
    enabled: hasAccess('pro'),
  });

  const { data: verifiedGames, isLoading: verifiedLoading } = useQuery<any[]>({
    queryKey: ['/api/players', playerId, 'verified-games'],
  });

  const createRating = useMutation({
    mutationFn: async (data: { overallRating: number; potentialRating: number; notes: string }) => {
      return await apiRequest('POST', `/api/players/${playerId}/ratings`, {
        overallRating: data.overallRating,
        potentialRating: data.potentialRating,
        notes: data.notes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/players', playerId, 'ratings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/players', playerId, 'average-rating'] });
      setShowRatingDialog(false);
      toast({ title: "Rating submitted", description: "Your rating has been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit rating.", variant: "destructive" });
    },
  });

  const generateProjection = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', `/api/players/${playerId}/projections/generate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/players', playerId, 'projections'] });
      toast({ title: "Projection Generated", description: "AI projection has been created." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate projection.", variant: "destructive" });
    },
  });

  const isCoach = user?.role === 'coach';
  const canRate = isCoach && !isOwnProfile;
  const isPremium = hasAccess('pro');

  const latestProjection = projections?.[0];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Card className={cn(
          "p-6 bg-gradient-to-br border backdrop-blur-sm",
          aiRating?.overallRating ? getRatingBgColor(aiRating.overallRating) : 
          averageRating ? getRatingBgColor(averageRating.overall) : "from-zinc-500/20 to-zinc-600/20 border-zinc-500/30"
        )}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">AI Rating</p>
              {aiRatingLoading || avgLoading ? (
                <Skeleton className="h-12 w-20" />
              ) : (
                <div className={cn(
                  "text-5xl font-bold font-display", 
                  aiRating?.overallRating ? getRatingColor(aiRating.overallRating) : 
                  averageRating ? getRatingColor(averageRating.overall) : "text-zinc-400"
                )}>
                  {aiRating?.overallRating ?? averageRating?.overall ?? "—"}
                </div>
              )}
            </div>
            <div className="p-2 rounded-lg bg-white/5">
              <Star className="w-6 h-6 text-amber-400" style={{ filter: "drop-shadow(0 0 8px #FCD34D)" }} />
            </div>
          </div>
          {aiRating?.ratingBand && (
            <Badge variant="outline" className="mt-2 text-xs border-white/20">
              {aiRating.ratingBand}
            </Badge>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            {aiRating?.confidence ? `${aiRating.confidence}% confidence` : `${ratings?.length ?? 0} coach ratings`}
          </p>
        </Card>

        <Card className={cn(
          "p-6 bg-gradient-to-br border backdrop-blur-sm",
          aiProjection?.projection ? getRatingBgColor(aiProjection.projection.ceilingRating) :
          averageRating ? getRatingBgColor(averageRating.potential) : "from-zinc-500/20 to-zinc-600/20 border-zinc-500/30"
        )}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Ceiling</p>
              {aiProjectionLoading || avgLoading ? (
                <Skeleton className="h-12 w-20" />
              ) : (
                <div className={cn(
                  "text-5xl font-bold font-display",
                  aiProjection?.projection ? getRatingColor(aiProjection.projection.ceilingRating) :
                  averageRating ? getRatingColor(averageRating.potential) : "text-zinc-400"
                )}>
                  {aiProjection?.projection?.ceilingRating ?? averageRating?.potential ?? "—"}
                </div>
              )}
            </div>
            <div className="p-2 rounded-lg bg-white/5">
              <TrendingUp className="w-6 h-6 text-purple-400" style={{ filter: "drop-shadow(0 0 8px #A855F7)" }} />
            </div>
          </div>
          {aiProjection?.projection && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs border-accent/30 text-accent">
                Floor: {aiProjection.projection.floorRating}
              </Badge>
              <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400">
                Likely: {aiProjection.projection.likelyRating}
              </Badge>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            {aiProjection?.projection?.levelMapping || "Projected ceiling"}
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-emerald-500/20 to-green-600/20 border border-emerald-500/30 backdrop-blur-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Verified Games</p>
              {verifiedLoading ? (
                <Skeleton className="h-12 w-16" />
              ) : (
                <div className="text-5xl font-bold font-display text-emerald-400">
                  {verifiedGames?.length ?? 0}
                </div>
              )}
            </div>
            <div className="p-2 rounded-lg bg-white/5">
              <CheckCircle className="w-6 h-6 text-emerald-400" style={{ filter: "drop-shadow(0 0 8px #34D399)" }} />
            </div>
          </div>
          {aiRating?.consistencyIndex !== undefined && (
            <Badge variant="outline" className="mt-2 text-xs border-emerald-500/30 text-emerald-400">
              {Math.round(aiRating.consistencyIndex)}% Consistency
            </Badge>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Coach-verified statistics
          </p>
        </Card>
      </motion.div>

      {aiRating?.subScores && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <Card className="p-6 bg-gradient-to-br from-black/60 to-black/30 border-white/10">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Crosshair className="w-5 h-5 text-accent" style={{ filter: "drop-shadow(0 0 8px hsl(24, 95%, 53%))" }} />
              Sub-Score Breakdown
              <Badge variant="outline" className="ml-2 text-xs border-white/20 capitalize">
                {sport}
              </Badge>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(getSubScoreConfig(sport, position)).map(([key, config], index) => {
                const score = aiRating.subScores![key as SubScoreKey];
                const trend = getScoreTrend(score);
                const IconComponent = config.icon;
                const TrendIcon = trend.icon;
                
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                    data-testid={`sub-score-${key}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <IconComponent className={cn("w-4 h-4", config.color)} />
                      <span className="text-xs font-medium text-muted-foreground">{config.label}</span>
                    </div>
                    <div className="flex items-end gap-1">
                      <span className={cn("text-2xl font-bold", config.color)}>
                        {Math.round(score)}
                      </span>
                      <TrendIcon className={cn("w-4 h-4 mb-1", trend.color)} />
                    </div>
                    <Progress 
                      value={score} 
                      className="h-1.5 mt-2"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1.5 line-clamp-1">
                      {config.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      )}

      {aiRating?.explanation && aiRating.explanation.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <Card className="p-6 bg-gradient-to-br from-black/60 to-black/30 border-white/10">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-blue-400" style={{ filter: "drop-shadow(0 0 8px #3B82F6)" }} />
              AI Analysis
            </h3>
            <ul className="space-y-2">
              {aiRating.explanation.map((exp, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <ChevronRight className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  {exp}
                </motion.li>
              ))}
            </ul>
          </Card>
        </motion.div>
      )}

      {canRate && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            onClick={() => setShowRatingDialog(true)}
            className="bg-accent "
            data-testid="button-rate-player"
          >
            <Star className="w-4 h-4 mr-2" /> Rate This Player
          </Button>
        </motion.div>
      )}

      {milestonesLoading ? (
        <Card className="p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </Card>
      ) : milestones && milestones.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <Card className="p-6 bg-gradient-to-br from-black/60 to-black/30 border-white/10">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-amber-400" style={{ filter: "drop-shadow(0 0 8px #FCD34D)" }} />
              Performance Milestones
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <AnimatePresence>
                {milestones.map((milestone, index) => {
                  const config = MILESTONE_LABELS[milestone.milestoneType] || { label: milestone.milestoneType, icon: Award };
                  const IconComponent = config.icon;
                  return (
                    <motion.div
                      key={milestone.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20"
                      data-testid={`milestone-${milestone.id}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <IconComponent className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-medium text-amber-400">{config.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {milestone.currentValue.toLocaleString()} {milestone.statCategory}
                      </p>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </Card>
        </motion.div>
      )}

      {aiProjection?.projection && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Card className="p-6 bg-gradient-to-br from-black/60 to-black/30 border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" style={{ filter: "drop-shadow(0 0 8px #A855F7)" }} />
                Projection Factors
              </h3>
              <Badge variant="outline" className={cn(
                "text-xs",
                aiProjection.projection.confidencePercent >= 70 ? "border-emerald-500/50 text-emerald-400" :
                aiProjection.projection.confidencePercent >= 50 ? "border-amber-500/50 text-amber-400" :
                "border-zinc-500/50 text-zinc-400"
              )}>
                {aiProjection.projection.confidencePercent}% Confidence
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-muted-foreground mb-1">Trajectory</p>
                <p className={cn(
                  "text-xl font-bold",
                  aiProjection.projection.trajectoryScore >= 60 ? "text-emerald-400" :
                  aiProjection.projection.trajectoryScore >= 45 ? "text-amber-400" : "text-red-400"
                )}>
                  {aiProjection.projection.trajectoryScore}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-muted-foreground mb-1">Translation</p>
                <p className={cn(
                  "text-xl font-bold",
                  aiProjection.projection.translationScore >= 60 ? "text-emerald-400" :
                  aiProjection.projection.translationScore >= 45 ? "text-amber-400" : "text-red-400"
                )}>
                  {aiProjection.projection.translationScore}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-muted-foreground mb-1">Upside</p>
                <p className={cn(
                  "text-xl font-bold",
                  aiProjection.projection.upsideScore >= 60 ? "text-emerald-400" :
                  aiProjection.projection.upsideScore >= 45 ? "text-amber-400" : "text-zinc-400"
                )}>
                  {aiProjection.projection.upsideScore}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-muted-foreground mb-1">Risk</p>
                <p className={cn(
                  "text-xl font-bold",
                  aiProjection.projection.riskScore <= 40 ? "text-emerald-400" :
                  aiProjection.projection.riskScore <= 60 ? "text-amber-400" : "text-red-400"
                )}>
                  {aiProjection.projection.riskScore}
                </p>
              </div>
            </div>

            {aiProjection.projection.explanations.length > 0 && (
              <ul className="space-y-1.5">
                {aiProjection.projection.explanations.map((exp, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <ChevronRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    {exp}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        <Card className="p-6 bg-gradient-to-br from-black/60 to-black/30 border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" style={{ filter: "drop-shadow(0 0 8px #A855F7)" }} />
              Gemini AI Analysis
              {!isPremium && (
                <Badge variant="outline" className="ml-2 text-xs border-amber-500/50 text-amber-400">
                  <Lock className="w-3 h-3 mr-1" /> Pro
                </Badge>
              )}
            </h3>
            {isPremium && !isOwnProfile && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => generateProjection.mutate()}
                disabled={generateProjection.isPending}
                className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                data-testid="button-generate-projection"
              >
                {generateProjection.isPending ? (
                  <>Generating...</>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" /> Generate Analysis
                  </>
                )}
              </Button>
            )}
          </div>

          {!isPremium ? (
            <div className="text-center py-8">
              <Lock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground mb-2">Gemini AI analysis requires a Pro subscription</p>
              <Button variant="outline" size="sm" className="mt-2 border-accent/50 text-accent">
                Upgrade to Pro <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          ) : projectionsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24" />
            </div>
          ) : latestProjection ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={cn(
                  "text-xs",
                  latestProjection.confidenceScore >= 0.8 ? "border-emerald-500/50 text-emerald-400" :
                  latestProjection.confidenceScore >= 0.6 ? "border-amber-500/50 text-amber-400" :
                  "border-zinc-500/50 text-zinc-400"
                )}>
                  {Math.round(latestProjection.confidenceScore * 100)}% Confidence
                </Badge>
                <span className="text-xs text-muted-foreground">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {new Date(latestProjection.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {latestProjection.analysis}
              </p>
              {latestProjection.projectedStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  {Object.entries(latestProjection.projectedStats).slice(0, 4).map(([key, value]) => (
                    <div key={key} className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-xs text-muted-foreground uppercase">{key.replace(/_/g, ' ')}</p>
                      <p className="text-lg font-bold text-white">{String(value)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No Gemini analysis generated yet</p>
            </div>
          )}
        </Card>
      </motion.div>

      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="bg-card border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Rate Player</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="overallRating">Overall Rating (1-100)</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="overallRating"
                  type="number"
                  min={1}
                  max={100}
                  value={ratingForm.overallRating}
                  onChange={(e) => setRatingForm(prev => ({ ...prev, overallRating: parseInt(e.target.value) || 0 }))}
                  className="w-24 bg-black/40 border-white/10"
                  data-testid="input-overall-rating"
                />
                <Progress value={ratingForm.overallRating} className="flex-1" />
                <span className={cn("font-bold text-xl", getRatingColor(ratingForm.overallRating))}>
                  {ratingForm.overallRating}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="potentialRating">Potential Rating (1-100)</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="potentialRating"
                  type="number"
                  min={1}
                  max={100}
                  value={ratingForm.potentialRating}
                  onChange={(e) => setRatingForm(prev => ({ ...prev, potentialRating: parseInt(e.target.value) || 0 }))}
                  className="w-24 bg-black/40 border-white/10"
                  data-testid="input-potential-rating"
                />
                <Progress value={ratingForm.potentialRating} className="flex-1" />
                <span className={cn("font-bold text-xl", getRatingColor(ratingForm.potentialRating))}>
                  {ratingForm.potentialRating}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={ratingForm.notes}
                onChange={(e) => setRatingForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add notes about this player's strengths, weaknesses, or potential..."
                className="bg-black/40 border-white/10 min-h-[100px]"
                data-testid="input-rating-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRatingDialog(false)}
              className="border-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={() => createRating.mutate(ratingForm)}
              disabled={createRating.isPending || ratingForm.overallRating < 1 || ratingForm.overallRating > 100}
              className="bg-accent"
              data-testid="button-submit-rating"
            >
              {createRating.isPending ? "Submitting..." : "Submit Rating"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
