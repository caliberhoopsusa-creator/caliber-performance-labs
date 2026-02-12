import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import {
  useDrillRecommendations,
  useGenerateDrillRecommendations,
  useDeleteDrillRecommendation,
  useCompleteDrillRecommendation,
  type DrillRecommendation,
} from "@/hooks/use-basketball";
import { Sparkles, X, Star, Target, Dumbbell, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface DrillRecommendationsProps {
  playerId: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  shooting: "bg-accent/20 text-accent border-accent/30",
  dribbling: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  passing: "bg-green-500/20 text-green-400 border-green-500/30",
  defense: "bg-red-500/20 text-red-400 border-red-500/30",
  conditioning: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  footwork: "bg-accent/20 text-accent border-accent/30",
  rebounding: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  finishing: "bg-pink-500/20 text-pink-400 border-pink-500/30",
};

function PriorityStars({ priority }: { priority: number }) {
  const clampedPriority = Math.min(5, Math.max(1, priority));
  return (
    <div className="flex items-center gap-0.5" data-testid="priority-stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "w-3 h-3",
            star <= clampedPriority
              ? "text-yellow-400 fill-yellow-400"
              : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
}

function RecommendationCard({
  recommendation,
  onDelete,
  onComplete,
  isDeleting,
  isCompleting,
}: {
  recommendation: DrillRecommendation;
  onDelete: () => void;
  onComplete: () => void;
  isDeleting: boolean;
  isCompleting: boolean;
}) {
  const categoryClass = CATEGORY_COLORS[recommendation.drillCategory?.toLowerCase() || ""] || 
    "bg-muted text-muted-foreground border-border";
  const isCompleted = !!recommendation.completedAt;

  return (
    <div
      className={cn(
        "p-4 rounded-md border border-border bg-card/50 space-y-3",
        isCompleted && "opacity-60"
      )}
      data-testid={`drill-recommendation-${recommendation.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "font-semibold text-sm",
                isCompleted && "line-through"
              )}
              data-testid={`drill-name-${recommendation.id}`}
            >
              {recommendation.drillName}
            </span>
            <Badge 
              variant="outline" 
              className={cn("text-xs", categoryClass)}
              data-testid={`drill-category-${recommendation.id}`}
            >
              {recommendation.drillCategory}
            </Badge>
            {isCompleted && (
              <span className="text-xs text-green-500 font-medium" data-testid={`drill-completed-label-${recommendation.id}`}>
                Completed
              </span>
            )}
          </div>
          <p 
            className="text-sm text-muted-foreground mt-1" 
            data-testid={`drill-reason-${recommendation.id}`}
          >
            {recommendation.reason}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              isCompleted
                ? "text-green-500"
                : "text-muted-foreground"
            )}
            onClick={onComplete}
            disabled={isCompleting}
            data-testid={`button-complete-recommendation-${recommendation.id}`}
          >
            <CheckCircle2
              className={cn(
                "w-4 h-4",
                isCompleted && "fill-green-500"
              )}
            />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-muted-foreground"
            onClick={onDelete}
            disabled={isDeleting}
            data-testid={`button-delete-recommendation-${recommendation.id}`}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <AlertTriangle className="w-3 h-3 text-accent" />
          <span data-testid={`weak-stat-${recommendation.id}`}>
            Addresses: <span className="text-foreground font-medium">{recommendation.weakStat}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Priority:</span>
          <PriorityStars priority={recommendation.priority} />
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <Card className="p-4" data-testid="drill-recommendations-loading">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-32" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-md border border-border space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <div className="flex justify-between pt-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function EmptyState({ onGenerate, isGenerating }: { onGenerate: () => void; isGenerating: boolean }) {
  return (
    <motion.div 
      className="text-center py-12"
      data-testid="drill-recommendations-empty"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
        <Dumbbell className="w-8 h-8 text-accent/60" />
      </div>
      <p className="text-foreground font-semibold mb-1">No Drill Recommendations</p>
      <p className="text-sm text-muted-foreground mb-6">
        Get personalized training drills based on your game stats. Our AI analyzes your recent performances to find areas for improvement.
      </p>
      <Button
        onClick={onGenerate}
        disabled={isGenerating}
        className="gap-2"
        data-testid="button-generate-recommendations-empty"
      >
        <Sparkles className="w-4 h-4" />
        {isGenerating ? "Generating..." : "Get My Training Plan"}
      </Button>
    </motion.div>
  );
}

export function DrillRecommendations({ playerId }: DrillRecommendationsProps) {
  const { data: recommendations = [], isLoading } = useDrillRecommendations(playerId);
  const generateMutation = useGenerateDrillRecommendations();
  const deleteMutation = useDeleteDrillRecommendation();
  const completeMutation = useCompleteDrillRecommendation();

  const handleGenerate = () => {
    generateMutation.mutate(playerId);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id, playerId });
  };

  const handleComplete = (id: number) => {
    completeMutation.mutate({ id, playerId });
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const aCompleted = a.completedAt ? 1 : 0;
    const bCompleted = b.completedAt ? 1 : 0;
    if (aCompleted !== bCompleted) return aCompleted - bCompleted;
    return b.priority - a.priority;
  });

  const completedCount = recommendations.filter(r => !!r.completedAt).length;
  const totalCount = recommendations.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Card className="p-4" data-testid="drill-recommendations">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4 text-accent" />
            Drill Recommendations
          </h4>
          {totalCount > 0 && (
            <span className="text-xs text-muted-foreground" data-testid="drill-completion-count">
              {completedCount} of {totalCount} completed
            </span>
          )}
        </div>
        {sortedRecommendations.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="gap-1.5"
            data-testid="button-generate-recommendations"
          >
            <Sparkles className="w-4 h-4" />
            {generateMutation.isPending ? "Generating..." : "Refresh"}
          </Button>
        )}
      </div>

      {totalCount > 0 && (
        <div className="mb-4" data-testid="drill-completion-progress">
          <Progress value={progressPercent} className="h-1.5" />
        </div>
      )}

      {sortedRecommendations.length === 0 ? (
        <EmptyState onGenerate={handleGenerate} isGenerating={generateMutation.isPending} />
      ) : (
        <div className="space-y-3">
          {sortedRecommendations.map((rec) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              onDelete={() => handleDelete(rec.id)}
              onComplete={() => handleComplete(rec.id)}
              isDeleting={deleteMutation.isPending && deleteMutation.variables?.id === rec.id}
              isCompleting={completeMutation.isPending && completeMutation.variables?.id === rec.id}
            />
          ))}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-border/50">
        <Link href="/performance?tab=workouts">
          <Button
            variant="ghost"
            className="w-full gap-2 text-sm text-muted-foreground"
            data-testid="link-go-to-workouts"
          >
            <Dumbbell className="w-4 h-4" />
            Go to Workouts
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
