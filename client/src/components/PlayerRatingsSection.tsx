import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Star, Shield, TrendingUp, CheckCircle, Award, Target, Sparkles, Clock, ChevronRight, AlertCircle, Lock } from "lucide-react";
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
}

const SKILL_LABELS: Record<string, string> = {
  shooting: "Shooting",
  passing: "Passing",
  dribbling: "Ball Handling",
  defense: "Defense",
  athleticism: "Athleticism",
  basketball_iq: "Basketball IQ",
  rebounding: "Rebounding",
  arm_strength: "Arm Strength",
  accuracy: "Accuracy",
  speed: "Speed",
  agility: "Agility",
  catching: "Catching",
  route_running: "Route Running",
  blocking: "Blocking",
  tackling: "Tackling",
  coverage: "Coverage",
};

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
  if (rating >= 70) return "text-cyan-400";
  if (rating >= 60) return "text-blue-400";
  return "text-zinc-400";
}

function getRatingBgColor(rating: number): string {
  if (rating >= 90) return "from-amber-500/20 to-yellow-600/20 border-amber-500/30";
  if (rating >= 80) return "from-purple-500/20 to-purple-600/20 border-purple-500/30";
  if (rating >= 70) return "from-cyan-500/20 to-cyan-600/20 border-cyan-500/30";
  if (rating >= 60) return "from-blue-500/20 to-blue-600/20 border-blue-500/30";
  return "from-zinc-500/20 to-zinc-600/20 border-zinc-500/30";
}

export function PlayerRatingsSection({ playerId, isOwnProfile }: Props) {
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
          averageRating ? getRatingBgColor(averageRating.overall) : "from-zinc-500/20 to-zinc-600/20 border-zinc-500/30"
        )}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Overall Rating</p>
              {avgLoading ? (
                <Skeleton className="h-12 w-20" />
              ) : (
                <div className={cn("text-5xl font-bold font-display", averageRating ? getRatingColor(averageRating.overall) : "text-zinc-400")}>
                  {averageRating?.overall ?? "—"}
                </div>
              )}
            </div>
            <div className="p-2 rounded-lg bg-white/5">
              <Star className="w-6 h-6 text-amber-400" style={{ filter: "drop-shadow(0 0 8px #FCD34D)" }} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Based on {ratings?.length ?? 0} scout/coach {(ratings?.length ?? 0) === 1 ? 'rating' : 'ratings'}
          </p>
        </Card>

        <Card className={cn(
          "p-6 bg-gradient-to-br border backdrop-blur-sm",
          averageRating ? getRatingBgColor(averageRating.potential) : "from-zinc-500/20 to-zinc-600/20 border-zinc-500/30"
        )}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Potential Rating</p>
              {avgLoading ? (
                <Skeleton className="h-12 w-20" />
              ) : (
                <div className={cn("text-5xl font-bold font-display", averageRating ? getRatingColor(averageRating.potential) : "text-zinc-400")}>
                  {averageRating?.potential ?? "—"}
                </div>
              )}
            </div>
            <div className="p-2 rounded-lg bg-white/5">
              <TrendingUp className="w-6 h-6 text-purple-400" style={{ filter: "drop-shadow(0 0 8px #A855F7)" }} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Projected future ceiling
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
          <p className="text-xs text-muted-foreground mt-3">
            Coach-verified statistics
          </p>
        </Card>
      </motion.div>

      {canRate && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Button
            onClick={() => setShowRatingDialog(true)}
            className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400"
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
          transition={{ delay: 0.2, duration: 0.4 }}
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <Card className="p-6 bg-gradient-to-br from-black/60 to-black/30 border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" style={{ filter: "drop-shadow(0 0 8px #A855F7)" }} />
              AI Projections
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
                    <Sparkles className="w-4 h-4 mr-2" /> Generate Projection
                  </>
                )}
              </Button>
            )}
          </div>

          {!isPremium ? (
            <div className="text-center py-8">
              <Lock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground mb-2">AI projections require a Pro subscription</p>
              <Button variant="outline" size="sm" className="mt-2 border-cyan-500/50 text-cyan-400">
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
              <p className="text-muted-foreground">No projections generated yet</p>
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
              className="bg-gradient-to-r from-cyan-600 to-cyan-500"
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