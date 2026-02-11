import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import {
  useDrillRecommendations,
  useGenerateDrillRecommendations,
  useDeleteDrillRecommendation,
  type DrillRecommendation,
} from "@/hooks/use-basketball";
import { useSport } from "@/components/SportToggle";
import { Sparkles, X, Star, Target, Dumbbell, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrillRecommendationsProps {
  playerId: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  // Basketball categories
  shooting: "bg-accent/20 text-accent border-accent/30",
  dribbling: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  passing: "bg-green-500/20 text-green-400 border-green-500/30",
  defense: "bg-red-500/20 text-red-400 border-red-500/30",
  conditioning: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  footwork: "bg-accent/20 text-accent border-accent/30",
  rebounding: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  finishing: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  // Football categories
  route_running: "bg-accent/20 text-accent border-accent/30",
  rushing: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  blocking: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  tackling: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  coverage: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  special_teams: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  team: "bg-teal-500/20 text-teal-400 border-teal-500/30",
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
  isDeleting,
}: {
  recommendation: DrillRecommendation;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const categoryClass = CATEGORY_COLORS[recommendation.drillCategory.toLowerCase()] || 
    "bg-muted text-muted-foreground border-border";

  return (
    <div
      className="p-4 rounded-md border border-border bg-card/50 space-y-3"
      data-testid={`drill-recommendation-${recommendation.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm" data-testid={`drill-name-${recommendation.id}`}>
              {recommendation.drillName}
            </span>
            <Badge 
              variant="outline" 
              className={cn("text-xs", categoryClass)}
              data-testid={`drill-category-${recommendation.id}`}
            >
              {recommendation.drillCategory}
            </Badge>
          </div>
          <p 
            className="text-sm text-muted-foreground mt-1" 
            data-testid={`drill-reason-${recommendation.id}`}
          >
            {recommendation.reason}
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
          onClick={onDelete}
          disabled={isDeleting}
          data-testid={`button-delete-recommendation-${recommendation.id}`}
        >
          <X className="w-4 h-4" />
        </Button>
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
      <p className="text-white font-semibold mb-1">No Drill Recommendations</p>
      <p className="text-sm text-muted-foreground mb-6">
        Generate AI-powered drill suggestions based on player weaknesses
      </p>
      <Button
        onClick={onGenerate}
        disabled={isGenerating}
        className="gap-2"
        data-testid="button-generate-recommendations-empty"
      >
        <Sparkles className="w-4 h-4" />
        {isGenerating ? "Generating..." : "Generate Recommendations"}
      </Button>
    </motion.div>
  );
}

export function DrillRecommendations({ playerId }: DrillRecommendationsProps) {
  const sport = useSport();
  const { data: recommendations = [], isLoading } = useDrillRecommendations(playerId);
  const generateMutation = useGenerateDrillRecommendations();
  const deleteMutation = useDeleteDrillRecommendation();
  
  const sportCategories = sport === 'basketball' 
    ? ['shooting', 'dribbling', 'passing', 'defense', 'rebounding', 'conditioning', 'footwork', 'finishing']
    : ['passing', 'route_running', 'rushing', 'blocking', 'tackling', 'coverage', 'special_teams', 'conditioning', 'team'];

  const handleGenerate = () => {
    generateMutation.mutate(playerId);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id, playerId });
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const filteredRecommendations = recommendations.filter(rec => 
    sportCategories.includes(rec.drillCategory.toLowerCase())
  );
  const sortedRecommendations = [...filteredRecommendations].sort((a, b) => b.priority - a.priority);

  return (
    <Card className="p-4" data-testid="drill-recommendations">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Target className="w-4 h-4 text-accent" />
          {sport === 'basketball' ? 'Basketball' : 'Football'} Drill Recommendations
        </h4>
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

      {sortedRecommendations.length === 0 ? (
        <EmptyState onGenerate={handleGenerate} isGenerating={generateMutation.isPending} />
      ) : (
        <div className="space-y-3">
          {sortedRecommendations.map((rec) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              onDelete={() => handleDelete(rec.id)}
              isDeleting={deleteMutation.isPending && deleteMutation.variables?.id === rec.id}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
