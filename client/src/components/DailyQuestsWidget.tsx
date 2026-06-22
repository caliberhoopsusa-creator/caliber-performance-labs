import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Circle, Zap, Target, Award, Heart, BookOpen, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyQuest {
  id: number;
  questType: string;
  label: string;
  questDate: string;
  targetValue: number;
  currentValue: number;
  completed: boolean;
  xpReward: number;
  coinReward: number;
}

const QUEST_ICONS: Record<string, any> = {
  log_game: Target,
  earn_badge: Award,
  react_to_feed: Heart,
  log_practice: BookOpen,
  update_goal: Flag,
};

interface Props {
  playerId: number;
}

export function DailyQuestsWidget({ playerId }: Props) {
  const { data: quests, isLoading } = useQuery<DailyQuest[]>({
    queryKey: [`/api/players/${playerId}/daily-quests`],
    enabled: !!playerId,
  });

  if (isLoading) {
    return (
      <Card>
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="p-2 rounded-md bg-accent/10">
            <Zap className="w-4 h-4 text-accent" />
          </div>
          <h3 className="font-bold text-foreground">Daily Quests</h3>
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-muted/50 animate-pulse rounded-lg" />
          ))}
        </div>
      </Card>
    );
  }

  if (!quests || quests.length === 0) return null;

  const completedCount = quests.filter(q => q.completed).length;

  return (
    <Card>
      <div className="p-4 border-b border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-accent/10">
            <Zap className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Daily Quests</h3>
            <p className="text-xs text-muted-foreground">{completedCount}/{quests.length} completed</p>
          </div>
        </div>
        {completedCount === quests.length && (
          <span className="text-xs font-semibold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">All Done!</span>
        )}
      </div>
      <div className="p-4 space-y-2">
        {quests.map(quest => {
          const Icon = QUEST_ICONS[quest.questType] || Target;
          const progress = Math.min(1, quest.currentValue / quest.targetValue);
          return (
            <div
              key={quest.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                quest.completed
                  ? "bg-green-500/5 border-green-500/20"
                  : "bg-muted/30 border-border"
              )}
            >
              {quest.completed ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium",
                  quest.completed ? "text-muted-foreground line-through" : "text-foreground"
                )}>
                  {quest.label}
                </p>
                {!quest.completed && quest.targetValue > 1 && (
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-1.5">
                      <div
                        className="bg-accent h-1.5 rounded-full transition-all"
                        style={{ width: `${progress * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {quest.currentValue}/{quest.targetValue}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Zap className="w-3 h-3 text-accent" />
                <span className="text-xs font-semibold text-accent">+{quest.xpReward}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
