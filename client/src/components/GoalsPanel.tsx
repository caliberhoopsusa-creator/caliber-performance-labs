import { useState, useEffect } from "react";
import { usePlayerGoals, usePlayerStreaks, useCreateGoal, useUpdateGoal, useDeleteGoal } from "@/hooks/use-basketball";
import { useSport } from "@/components/SportToggle";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Flame, Target, Plus, Check, Trash2, Trophy, TrendingUp, Share2 } from "lucide-react";
import { 
  STREAK_DEFINITIONS, 
  GOAL_PRESETS, 
  FOOTBALL_GOAL_PRESETS,
  BASKETBALL_GOAL_CATEGORIES,
  FOOTBALL_GOAL_CATEGORIES,
  type Goal, 
  type Streak, 
  type Game 
} from "@shared/schema";
import { cn } from "@/lib/utils";
import { ShareGoalModal } from "./ShareGoalModal";
import { SportSpinner } from "@/components/SportSpinner";

interface GoalsPanelProps {
  playerId: number;
  games: Game[];
}

const GRADE_VALUES: Record<string, number> = {
  'A+': 100, 'A': 95, 'A-': 90,
  'B+': 88, 'B': 85, 'B-': 80,
  'C+': 78, 'C': 75, 'C-': 70,
  'D+': 68, 'D': 65, 'D-': 60,
  'F': 50,
};

function calculateGoalProgress(goal: Goal, games: Game[]): { current: number; percent: number } {
  if (games.length === 0) return { current: 0, percent: 0 };
  
  let current = 0;
  
  switch (goal.targetType) {
    case 'stat_min':
    case 'stat_max': {
      const category = goal.targetCategory as keyof Game;
      const total = games.reduce((acc, g) => {
        const val = g[category];
        return acc + (typeof val === 'number' ? val : 0);
      }, 0);
      current = total / games.length;
      
      if (goal.targetType === 'stat_min') {
        const percent = Math.min(100, (current / goal.targetValue) * 100);
        return { current: Math.round(current * 10) / 10, percent };
      } else {
        const percent = current <= goal.targetValue ? 100 : Math.max(0, (1 - (current - goal.targetValue) / goal.targetValue) * 100);
        return { current: Math.round(current * 10) / 10, percent };
      }
    }
    case 'grade_avg': {
      if (goal.targetCategory === 'defense') {
        const total = games.reduce((acc, g) => acc + (g.defenseRating || 50), 0);
        current = total / games.length;
      } else {
        const total = games.reduce((acc, g) => acc + (GRADE_VALUES[g.grade || 'C'] || 75), 0);
        current = total / games.length;
      }
      const percent = Math.min(100, (current / goal.targetValue) * 100);
      return { current: Math.round(current), percent };
    }
    default:
      return { current: 0, percent: 0 };
  }
}

export function GoalsPanel({ playerId, games }: GoalsPanelProps) {
  const sport = useSport();
  const { data: goals = [], isLoading: goalsLoading } = usePlayerGoals(playerId);
  const { data: streaks = [], isLoading: streaksLoading } = usePlayerStreaks(playerId);
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  
  // Sport-aware categories and presets
  const goalCategories = sport === 'football' ? FOOTBALL_GOAL_CATEGORIES : BASKETBALL_GOAL_CATEGORIES;
  const goalPresets = sport === 'football' ? FOOTBALL_GOAL_PRESETS : GOAL_PRESETS;
  const defaultCategory = sport === 'football' ? 'passingYards' : 'points';
  
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [targetType, setTargetType] = useState("stat_min");
  const [targetCategory, setTargetCategory] = useState(defaultCategory);
  const [targetValue, setTargetValue] = useState("");
  const [deadline, setDeadline] = useState("");
  const [shareGoalId, setShareGoalId] = useState<number | null>(null);

  // Reset category when sport changes
  useEffect(() => {
    setTargetCategory(defaultCategory);
  }, [sport, defaultCategory]);

  const handlePresetSelect = (preset: { title: string; targetType: string; targetCategory: string; targetValue: number }) => {
    setTitle(preset.title);
    setTargetType(preset.targetType);
    setTargetCategory(preset.targetCategory);
    setTargetValue(preset.targetValue.toString());
  };

  const handleCreateGoal = async () => {
    if (!title || !targetValue) return;
    
    await createGoal.mutateAsync({
      playerId,
      title,
      targetType,
      targetCategory,
      targetValue: parseInt(targetValue),
      deadline: deadline || null,
    });
    
    setTitle("");
    setTargetType("stat_min");
    setTargetCategory("points");
    setTargetValue("");
    setDeadline("");
    setIsOpen(false);
  };

  const handleToggleComplete = async (goal: Goal) => {
    await updateGoal.mutateAsync({
      id: goal.id,
      playerId,
      updates: { completed: !goal.completed },
    });
  };

  const handleDeleteGoal = async (goalId: number) => {
    await deleteGoal.mutateAsync({ id: goalId, playerId });
  };

  const activeGoals = (goals as Goal[]).filter(g => !g.completed);
  const completedGoals = (goals as Goal[]).filter(g => g.completed);

  if (goalsLoading || streaksLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center py-8">
          <SportSpinner size="sm" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-accent" /> Goals
          </h3>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1" data-testid="button-add-goal">
                <Plus className="w-4 h-4" /> Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Set New Goal</DialogTitle>
                <DialogDescription>
                  Choose a preset or create a custom goal
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Quick Presets</Label>
                  <div className="flex flex-wrap gap-2">
                    {goalPresets.map((preset) => (
                      <Badge
                        key={preset.title}
                        variant="outline"
                        className="cursor-pointer hover-elevate"
                        onClick={() => handlePresetSelect(preset)}
                        data-testid={`badge-preset-${preset.targetCategory}`}
                      >
                        {preset.title}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="title">Goal Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Score 15+ PPG"
                      data-testid="input-goal-title"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Type</Label>
                      <Select value={targetType} onValueChange={setTargetType}>
                        <SelectTrigger data-testid="select-target-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stat_min">At Least (Min)</SelectItem>
                          <SelectItem value="stat_max">At Most (Max)</SelectItem>
                          <SelectItem value="grade_avg">Grade Average</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Category</Label>
                      <Select value={targetCategory} onValueChange={setTargetCategory}>
                        <SelectTrigger data-testid="select-target-category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {goalCategories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="targetValue">Target Value</Label>
                      <Input
                        id="targetValue"
                        type="number"
                        value={targetValue}
                        onChange={(e) => setTargetValue(e.target.value)}
                        placeholder="15"
                        data-testid="input-target-value"
                      />
                    </div>
                    <div>
                      <Label htmlFor="deadline">Deadline (Optional)</Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        data-testid="input-deadline"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  onClick={handleCreateGoal} 
                  disabled={!title || !targetValue || createGoal.isPending}
                  data-testid="button-save-goal"
                >
                  {createGoal.isPending ? "Saving..." : "Save Goal"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {activeGoals.length === 0 && completedGoals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-blue-500/20 rounded-2xl blur-xl animate-pulse-slow" />
              <div className="relative w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-border">
                <Target className="w-7 h-7 text-accent/60" />
              </div>
            </div>
            <h3 className="font-display font-semibold text-white mb-1">Set Your First Goal</h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-4">
              Goals help track progress and keep players motivated. Set targets for points, assists, or grades.
            </p>
            <Button size="sm" onClick={() => setIsOpen(true)} className="gap-1 bg-gradient-to-r from-accent to-blue-600 hover:from-accent hover:to-blue-500 border-0 shadow-lg">
              <Plus className="w-4 h-4" /> Create Goal
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {activeGoals.map((goal: Goal) => {
              const { current, percent } = calculateGoalProgress(goal, games);
              const isAchieved = percent >= 100;
              
              return (
                <div
                  key={goal.id}
                  className={cn(
                    "p-3 rounded-md border",
                    isAchieved ? "border-green-500/30 bg-green-500/5" : "border-border bg-card/50"
                  )}
                  data-testid={`goal-item-${goal.id}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{goal.title}</span>
                        {isAchieved && (
                          <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400">
                            <Check className="w-3 h-3 mr-1" /> On Track
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Current: {current} / Target: {goal.targetValue}
                        {goal.deadline && ` | Due: ${goal.deadline}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-accent"
                        onClick={() => setShareGoalId(goal.id)}
                        data-testid={`button-share-goal-${goal.id}`}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleToggleComplete(goal)}
                        data-testid={`button-complete-goal-${goal.id}`}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDeleteGoal(goal.id)}
                        data-testid={`button-delete-goal-${goal.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Progress value={percent} className="h-2" />
                </div>
              );
            })}
            
            {completedGoals.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Trophy className="w-3 h-3" /> Completed Goals
                </p>
                {completedGoals.slice(0, 3).map((goal: Goal) => (
                  <div
                    key={goal.id}
                    className="flex items-center justify-between py-1.5 text-sm text-muted-foreground"
                    data-testid={`completed-goal-${goal.id}`}
                  >
                    <span className="line-through">{goal.title}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => handleDeleteGoal(goal.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="text-lg font-bold font-display text-white flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-accent" /> Current Streaks
        </h3>

        {(streaks as Streak[]).length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Flame className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No streaks yet</p>
            <p className="text-xs">Play more games to build streaks</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {(streaks as Streak[]).map((streak) => {
              const definition = STREAK_DEFINITIONS[streak.streakType as keyof typeof STREAK_DEFINITIONS];
              const isActive = streak.currentCount > 0;
              
              return (
                <div
                  key={streak.id}
                  className={cn(
                    "p-3 rounded-md border text-center",
                    isActive 
                      ? "border-accent/30 bg-gradient-to-b from-accent/10 to-transparent" 
                      : "border-border bg-card/30"
                  )}
                  data-testid={`streak-${streak.streakType}`}
                >
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Flame className={cn(
                      "w-5 h-5",
                      isActive ? "text-accent" : "text-muted-foreground/30"
                    )} />
                    <span className={cn(
                      "text-2xl font-bold font-display",
                      isActive ? "text-accent" : "text-muted-foreground/50"
                    )}>
                      {streak.currentCount}
                    </span>
                  </div>
                  <p className="text-xs font-medium truncate">
                    {definition?.name || streak.streakType}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-1 text-xs text-muted-foreground">
                    <TrendingUp className="w-3 h-3" />
                    Best: {streak.bestCount}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {shareGoalId && (
        <ShareGoalModal
          goalId={shareGoalId}
          isOpen={!!shareGoalId}
          onClose={() => setShareGoalId(null)}
        />
      )}
    </div>
  );
}