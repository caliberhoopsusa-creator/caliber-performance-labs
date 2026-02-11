import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  Star, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  Shield, 
  Brain, 
  Target, 
  AlertCircle,
  Sparkles,
  Award,
  Zap,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  playerName: string;
  position: string;
}

function getRatingColor(rating: number): string {
  if (rating >= 90) return "text-accent";
  if (rating >= 80) return "text-purple-400";
  if (rating >= 70) return "text-accent/80";
  if (rating >= 60) return "text-blue-400";
  return "text-zinc-400";
}

function getRatingBgColor(rating: number): string {
  if (rating >= 90) return "from-accent/20 to-accent/10 border-accent/30";
  if (rating >= 80) return "from-purple-500/20 to-purple-600/20 border-purple-500/30";
  if (rating >= 70) return "from-accent/15 to-accent/10 border-accent/20";
  if (rating >= 60) return "from-blue-500/20 to-blue-600/20 border-blue-500/30";
  return "from-zinc-500/20 to-zinc-600/20 border-zinc-500/30";
}

function getRatingBadgeStyle(rating: number): string {
  if (rating >= 90) return "bg-gradient-to-r from-accent to-accent/90 text-accent-foreground";
  if (rating >= 80) return "bg-gradient-to-r from-purple-500 to-purple-600 text-white";
  if (rating >= 70) return "bg-accent text-white";
  if (rating >= 60) return "bg-gradient-to-r from-blue-500 to-blue-600 text-white";
  return "bg-gradient-to-r from-zinc-500 to-zinc-600 text-white";
}

function calculateTrustScore(verificationCount: number, ratingCount: number): number {
  const verificationWeight = 0.6;
  const ratingWeight = 0.4;
  const maxVerifications = 20;
  const maxRatings = 10;
  
  const verificationScore = Math.min(verificationCount / maxVerifications, 1) * 100;
  const ratingScore = Math.min(ratingCount / maxRatings, 1) * 100;
  
  return Math.round(verificationScore * verificationWeight + ratingScore * ratingWeight);
}

function getTrustLevel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Highly Trusted", color: "text-emerald-400" };
  if (score >= 60) return { label: "Trusted", color: "text-accent" };
  if (score >= 40) return { label: "Building Trust", color: "text-accent" };
  return { label: "New Profile", color: "text-zinc-400" };
}

function extractStrengthsWeaknesses(projections: AiProjection[] | undefined): { strengths: string[]; weaknesses: string[] } {
  if (!projections || projections.length === 0) {
    return { strengths: [], weaknesses: [] };
  }

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  projections.forEach(projection => {
    const stats = projection.projectedStats;
    if (stats) {
      if (stats.strengths && Array.isArray(stats.strengths)) {
        strengths.push(...stats.strengths.slice(0, 3));
      }
      if (stats.weaknesses && Array.isArray(stats.weaknesses)) {
        weaknesses.push(...stats.weaknesses.slice(0, 3));
      }
      if (stats.key_strengths && Array.isArray(stats.key_strengths)) {
        strengths.push(...stats.key_strengths.slice(0, 3));
      }
      if (stats.areas_to_improve && Array.isArray(stats.areas_to_improve)) {
        weaknesses.push(...stats.areas_to_improve.slice(0, 3));
      }
    }
  });

  return {
    strengths: Array.from(new Set(strengths)).slice(0, 3),
    weaknesses: Array.from(new Set(weaknesses)).slice(0, 3)
  };
}

export function ScoutReportCard({ playerId, playerName, position }: Props) {
  const { data: averageRating, isLoading: avgLoading } = useQuery<{ overall: number; potential: number }>({
    queryKey: ['/api/players', playerId, 'average-rating'],
  });

  const { data: verifiedGames, isLoading: verifiedLoading } = useQuery<any[]>({
    queryKey: ['/api/players', playerId, 'verified-games'],
  });

  const { data: projections, isLoading: projectionsLoading } = useQuery<AiProjection[]>({
    queryKey: ['/api/players', playerId, 'projections'],
  });

  const { data: ratings, isLoading: ratingsLoading } = useQuery<PlayerRating[]>({
    queryKey: ['/api/players', playerId, 'ratings'],
  });

  const isLoading = avgLoading || verifiedLoading || projectionsLoading || ratingsLoading;

  const verificationCount = verifiedGames?.length ?? 0;
  const ratingCount = ratings?.length ?? 0;
  const trustScore = calculateTrustScore(verificationCount, ratingCount);
  const trustLevel = getTrustLevel(trustScore);
  const latestProjection = projections?.[0];
  const { strengths, weaknesses } = extractStrengthsWeaknesses(projections);

  const potentialTrend = averageRating 
    ? averageRating.potential > averageRating.overall 
      ? 'up' 
      : averageRating.potential < averageRating.overall 
        ? 'down' 
        : 'stable'
    : 'stable';

  if (isLoading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-black/60 to-black/30 border-white/10 backdrop-blur-sm">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      data-testid="scout-report-card"
    >
      <Card className="overflow-hidden bg-gradient-to-br from-black/60 to-black/30 border-white/10 backdrop-blur-sm">
        <div className="absolute inset-x-[10%] top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
        
        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring" }}
                className={cn(
                  "relative flex items-center justify-center w-20 h-20 rounded-xl",
                  "bg-gradient-to-br border backdrop-blur-sm",
                  averageRating ? getRatingBgColor(averageRating.overall) : "from-zinc-500/20 to-zinc-600/20 border-zinc-500/30"
                )}
                data-testid="scout-report-overall-rating"
              >
                <span className={cn(
                  "text-4xl font-bold font-display",
                  averageRating ? getRatingColor(averageRating.overall) : "text-zinc-400"
                )}>
                  {averageRating?.overall ?? "—"}
                </span>
                <div className="absolute -top-2 -right-2">
                  <Badge 
                    className={cn(
                      "text-xs font-bold px-2 py-0.5 border-0",
                      averageRating ? getRatingBadgeStyle(averageRating.overall) : "bg-zinc-600"
                    )}
                    data-testid="scout-report-rating-badge"
                  >
                    OVR
                  </Badge>
                </div>
              </motion.div>
              
              <div>
                <h3 className="text-xl font-bold text-white" data-testid="scout-report-player-name">
                  {playerName}
                </h3>
                <p className="text-sm text-accent/80" data-testid="scout-report-position">
                  {position}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant="outline" 
                    className="text-xs border-white/10 bg-white/5"
                    data-testid="scout-report-rating-count"
                  >
                    {ratingCount} {ratingCount === 1 ? 'Rating' : 'Ratings'}
                  </Badge>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-right"
              data-testid="scout-report-potential-section"
            >
              <p className="text-xs text-muted-foreground mb-1">Potential</p>
              <div className="flex items-center gap-2 justify-end">
                <span className={cn(
                  "text-2xl font-bold",
                  averageRating ? getRatingColor(averageRating.potential) : "text-zinc-400"
                )} data-testid="scout-report-potential-rating">
                  {averageRating?.potential ?? "—"}
                </span>
                {potentialTrend === 'up' && (
                  <TrendingUp className="w-5 h-5 text-emerald-400" style={{ filter: "drop-shadow(0 0 6px #34D399)" }} />
                )}
                {potentialTrend === 'down' && (
                  <TrendingDown className="w-5 h-5 text-red-400" style={{ filter: "drop-shadow(0 0 6px #F87171)" }} />
                )}
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card 
                className="p-4 bg-gradient-to-br from-emerald-500/20 to-green-600/20 border-emerald-500/30 backdrop-blur-sm"
                data-testid="scout-report-verified-games"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Verified Games</p>
                    <p className="text-2xl font-bold text-emerald-400">{verificationCount}</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white/5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" style={{ filter: "drop-shadow(0 0 6px #34D399)" }} />
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card 
                className="p-4 bg-gradient-to-br from-accent/20 to-accent/20 border-accent/30 backdrop-blur-sm"
                data-testid="scout-report-trust-score"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Trust Score</p>
                    <p className="text-2xl font-bold text-accent">{trustScore}%</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white/5">
                    <Shield className="w-4 h-4 text-accent" style={{ filter: "drop-shadow(0 0 6px hsl(24, 95%, 53%))" }} />
                  </div>
                </div>
                <p className={cn("text-xs mt-1", trustLevel.color)}>{trustLevel.label}</p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card 
                className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30 backdrop-blur-sm"
                data-testid="scout-report-ai-confidence"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">AI Confidence</p>
                    <p className="text-2xl font-bold text-purple-400">
                      {latestProjection ? `${Math.round(latestProjection.confidenceScore * 100)}%` : "—"}
                    </p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white/5">
                    <Brain className="w-4 h-4 text-purple-400" style={{ filter: "drop-shadow(0 0 6px #A855F7)" }} />
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card 
                className="p-4 bg-gradient-to-br from-accent/20 to-accent/10 border-accent/30 backdrop-blur-sm"
                data-testid="scout-report-scout-ratings"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Scout Ratings</p>
                    <p className="text-2xl font-bold text-accent">{ratingCount}</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white/5">
                    <Star className="w-4 h-4 text-accent" style={{ filter: "drop-shadow(0 0 6px hsl(24 95% 53%))" }} />
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {latestProjection && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              data-testid="scout-report-ai-summary"
            >
              <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-accent/10 border-purple-500/20 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-purple-400" style={{ filter: "drop-shadow(0 0 6px #A855F7)" }} />
                  <h4 className="text-sm font-semibold text-white">AI Projection Summary</h4>
                  <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400">
                    {latestProjection.projectionType}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed" data-testid="scout-report-ai-analysis">
                  {latestProjection.analysis}
                </p>
              </Card>
            </motion.div>
          )}

          {(strengths.length > 0 || weaknesses.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {strengths.length > 0 && (
                <Card 
                  className="p-4 bg-gradient-to-br from-emerald-500/10 to-green-600/10 border-emerald-500/20 backdrop-blur-sm"
                  data-testid="scout-report-strengths"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-emerald-400" style={{ filter: "drop-shadow(0 0 6px #34D399)" }} />
                    <h4 className="text-sm font-semibold text-white">Key Strengths</h4>
                  </div>
                  <ul className="space-y-2">
                    {strengths.map((strength, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Zap className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {weaknesses.length > 0 && (
                <Card 
                  className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20 backdrop-blur-sm"
                  data-testid="scout-report-weaknesses"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-accent" style={{ filter: "drop-shadow(0 0 6px hsl(24 95% 53%))" }} />
                    <h4 className="text-sm font-semibold text-white">Areas to Improve</h4>
                  </div>
                  <ul className="space-y-2">
                    {weaknesses.map((weakness, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ChevronRight className="w-3 h-3 text-accent flex-shrink-0" />
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="pt-4 border-t border-white/5"
            data-testid="scout-report-trust-meter"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Trust Meter</span>
              <span className={cn("text-xs font-medium", trustLevel.color)}>{trustLevel.label}</span>
            </div>
            <Progress 
              value={trustScore} 
              className="h-2 bg-white/10"
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{verificationCount} verified games</span>
              <span>{ratingCount} scout ratings</span>
            </div>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}
