import { motion } from "framer-motion";
import { Trophy, Crown, Award, Star, Target, Flame, Share2, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export interface Milestone {
  type: "season_high" | "tier_promotion" | "badge_unlock" | "grade_a" | "games_milestone" | "streak_milestone";
  title: string;
  subtitle: string;
  detail: string;
  stat: string;
  value: string | number;
  gameId: number | null;
  createdAt: string;
}

const MILESTONE_CONFIG: Record<string, {
  icon: typeof Trophy;
  color: string;
  glowColor: string;
  gradientFrom: string;
  gradientTo: string;
}> = {
  season_high: {
    icon: Trophy,
    color: "text-yellow-400",
    glowColor: "rgba(250, 204, 21, 0.4)",
    gradientFrom: "from-yellow-400",
    gradientTo: "to-accent",
  },
  tier_promotion: {
    icon: Crown,
    color: "text-purple-400",
    glowColor: "rgba(168, 85, 247, 0.4)",
    gradientFrom: "from-purple-400",
    gradientTo: "to-pink-500",
  },
  badge_unlock: {
    icon: Award,
    color: "text-accent",
    glowColor: "rgba(234, 88, 12, 0.4)",
    gradientFrom: "from-accent",
    gradientTo: "to-blue-500",
  },
  grade_a: {
    icon: Star,
    color: "text-green-400",
    glowColor: "rgba(74, 222, 128, 0.4)",
    gradientFrom: "from-green-400",
    gradientTo: "to-emerald-500",
  },
  games_milestone: {
    icon: Target,
    color: "text-accent",
    glowColor: "rgba(251, 146, 60, 0.4)",
    gradientFrom: "from-accent",
    gradientTo: "to-red-500",
  },
  streak_milestone: {
    icon: Flame,
    color: "text-red-400",
    glowColor: "rgba(248, 113, 113, 0.4)",
    gradientFrom: "from-red-400",
    gradientTo: "to-accent",
  },
};

interface MilestoneCardProps {
  milestone: Milestone;
  playerName: string;
  playerId: number;
}

export function MilestoneCard({ milestone, playerName, playerId }: MilestoneCardProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const config = MILESTONE_CONFIG[milestone.type] || MILESTONE_CONFIG.season_high;
  const Icon = config.icon;

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/profile/${playerId}/public`;
    const shareText = `${playerName} just achieved: ${milestone.title} - ${milestone.subtitle}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${playerName} - ${milestone.title}`,
          text: shareText,
          url: shareUrl,
        });
      } catch (e) {
        // User cancelled share
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast({
          title: "Link copied!",
          description: "Profile link copied to clipboard",
        });
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast({
          title: "Copy failed",
          description: "Could not copy link to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <motion.div
        data-testid={`milestone-card-${milestone.type}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-[320px] aspect-[4/3] rounded-xl overflow-hidden flex-shrink-0"
        style={{
          background: "linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(17,17,27,0.95) 50%, rgba(0,0,0,0.9) 100%)",
        }}
      >
        <div className="absolute inset-0 border border-border rounded-xl pointer-events-none z-10" />

        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full blur-[80px] pointer-events-none"
          style={{ backgroundColor: config.glowColor }}
        />

        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 py-5 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <Icon
              className={cn("w-12 h-12 mb-3", config.color)}
              style={{ filter: `drop-shadow(0 0 20px ${config.glowColor})` }}
            />
          </motion.div>

          <h3
            className={cn(
              "font-display text-2xl font-bold uppercase tracking-wider bg-clip-text text-transparent bg-gradient-to-r",
              config.gradientFrom,
              config.gradientTo
            )}
          >
            {milestone.title}
          </h3>

          <p className="text-white/90 text-lg font-semibold mt-1">
            {milestone.subtitle}
          </p>

          <p className="text-white/50 text-sm mt-1.5">
            {playerName}
          </p>

          <p className="text-white/30 text-xs mt-1">
            {milestone.detail}
          </p>

          <div className="absolute bottom-3 left-0 right-0 text-center">
            <span className="text-[10px] uppercase tracking-[0.3em] text-white/15 font-bold">
              Caliber
            </span>
          </div>
        </div>
      </motion.div>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleShare}
        className="w-fit mx-auto gap-1.5 text-muted-foreground"
        data-testid="button-share-milestone"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
        {copied ? "Copied" : "Share"}
      </Button>
    </div>
  );
}

interface MilestonesSectionProps {
  playerId: number;
  playerName: string;
}

export function MilestonesSection({ playerId, playerName }: MilestonesSectionProps) {
  const { data, isLoading } = useQuery<{ milestones: Milestone[] }>({
    queryKey: ["/api/players", playerId, "milestones"],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}/milestones`);
      if (!res.ok) throw new Error("Failed to fetch milestones");
      return res.json();
    },
  });

  const milestones = data?.milestones || [];

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-5 w-32 rounded" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="w-[320px] aspect-[4/3] rounded-xl flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (milestones.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-6"
      data-testid="milestones-section"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
          <Sparkles className="w-5 h-5 text-accent" style={{ filter: "drop-shadow(0 0 6px hsl(var(--accent) / 0.6))" }} />
        </div>
        <h3 className="text-lg font-bold font-display bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent">
          Recent Milestones
        </h3>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {milestones.map((milestone, index) => (
          <MilestoneCard
            key={`${milestone.type}-${milestone.stat}-${index}`}
            milestone={milestone}
            playerName={playerName}
            playerId={playerId}
          />
        ))}
      </div>
    </motion.div>
  );
}
