import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Zap, Award, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface ActivityStreak {
  id: number;
  playerId: number;
  streakType: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  updatedAt: string | null;
}

interface CheckInResponse {
  checkedIn: boolean;
  streakCount: number;
  isNewMilestone: boolean;
  milestoneReached?: number;
  streaks: ActivityStreak[];
}

const STREAK_MILESTONES = [
  { days: 3, label: "3-Day Streak", icon: Flame, color: "text-accent", xp: 25 },
  { days: 7, label: "Week Warrior", icon: Zap, color: "text-yellow-600 dark:text-yellow-400", xp: 75 },
  { days: 14, label: "Two-Week Terror", icon: Award, color: "text-purple-600 dark:text-purple-400", xp: 150 },
  { days: 30, label: "Monthly Monster", icon: Target, color: "text-emerald-600 dark:text-emerald-400", xp: 300 },
];

function getStreakLevel(streak: number): { label: string; color: string; glowColor: string } {
  if (streak >= 30) return { label: "Legendary", color: "text-emerald-600 dark:text-emerald-400", glowColor: "shadow-emerald-500/30" };
  if (streak >= 14) return { label: "On Fire", color: "text-purple-600 dark:text-purple-400", glowColor: "shadow-purple-500/30" };
  if (streak >= 7) return { label: "Hot Streak", color: "text-yellow-600 dark:text-yellow-400", glowColor: "shadow-yellow-500/30" };
  if (streak >= 3) return { label: "Warming Up", color: "text-accent", glowColor: "shadow-accent/30" };
  return { label: "Getting Started", color: "text-muted-foreground", glowColor: "" };
}

export default function StreakDisplay({ playerId }: { playerId: number }) {
  const { toast } = useToast();

  const { data: streaks } = useQuery<ActivityStreak[]>({
    queryKey: ['/api/players', playerId, 'activity-streaks'],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}/activity-streaks`);
      if (!res.ok) throw new Error("Failed to fetch streaks");
      return res.json();
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/players/${playerId}/check-in`);
      return res.json() as Promise<CheckInResponse>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/players', playerId, 'activity-streaks'] });
      if (data.isNewMilestone && data.milestoneReached) {
        const milestone = STREAK_MILESTONES.find(m => m.days === data.milestoneReached);
        if (milestone) {
          toast({
            title: `${milestone.label} Unlocked!`,
            description: `+${milestone.xp} XP for maintaining a ${data.milestoneReached}-day streak!`,
          });
        }
      }
    },
    onError: () => {},
  });

  useEffect(() => {
    checkInMutation.mutate();
  }, [playerId]);

  const dailyStreak = streaks?.find(s => s.streakType === 'daily_login' || s.streakType === 'daily_game');
  const currentStreak = dailyStreak?.currentStreak || 0;
  const longestStreak = dailyStreak?.longestStreak || 0;
  const streakInfo = getStreakLevel(currentStreak);

  const nextMilestone = STREAK_MILESTONES.find(m => m.days > currentStreak);
  const prevMilestone = [...STREAK_MILESTONES].reverse().find(m => m.days <= currentStreak);
  const progressToNext = nextMilestone
    ? ((currentStreak - (prevMilestone?.days || 0)) / (nextMilestone.days - (prevMilestone?.days || 0))) * 100
    : 100;

  if (currentStreak === 0 && longestStreak === 0) return null;

  return (
    <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20 overflow-hidden" data-testid="card-streak-display">
      <div className="p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <motion.div
              animate={currentStreak >= 3 ? { scale: [1, 1.2, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Flame className={cn("w-5 h-5", currentStreak >= 3 ? "text-accent" : "text-muted-foreground")} />
            </motion.div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-accent">Activity Streak</h3>
          </div>
          <Badge className={cn("text-[10px]", streakInfo.color, "bg-muted/50 border-border")}>
            {streakInfo.label}
          </Badge>
        </div>

        <div className="flex items-center gap-4 mb-3">
          <div className="text-center">
            <motion.p
              className={cn("text-4xl font-black", streakInfo.color)}
              key={currentStreak}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {currentStreak}
            </motion.p>
            <p className="text-[10px] text-muted-foreground uppercase">Current</p>
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {nextMilestone ? `Next: ${nextMilestone.label}` : 'Max streak reached!'}
              </span>
              {nextMilestone && (
                <span className="text-xs text-muted-foreground">
                  {nextMilestone.days - currentStreak} days
                </span>
              )}
            </div>
            <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-accent to-accent/80 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progressToNext, 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <TrendingUp className="w-3 h-3" />
            <span>Best: {longestStreak} days</span>
          </div>
          {nextMilestone && (
            <span className="text-xs text-accent/70">
              +{nextMilestone.xp} XP at {nextMilestone.days} days
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3 justify-center">
          {STREAK_MILESTONES.map(milestone => {
            const achieved = currentStreak >= milestone.days;
            const Icon = milestone.icon;
            return (
              <div
                key={milestone.days}
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center border transition-all",
                  achieved
                    ? `bg-muted border-border ${milestone.color}`
                    : "bg-muted/50 border-border/50 text-muted-foreground/40"
                )}
                title={`${milestone.label}: ${achieved ? 'Achieved!' : `${milestone.days - currentStreak} days to go`}`}
                data-testid={`badge-streak-${milestone.days}`}
              >
                <Icon className="w-4 h-4" />
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
