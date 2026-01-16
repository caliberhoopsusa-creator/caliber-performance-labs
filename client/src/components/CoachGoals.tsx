import { useState } from "react";
import { useCoachGoals, useCreateCoachGoal, useUpdateCoachGoal, useDeleteCoachGoal, usePlayer, type CoachGoal, type UpdateCoachGoalInput } from "@/hooks/use-basketball";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import { Target, Plus, Pencil, Trash2, CheckCircle, XCircle, Clock, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Game } from "@shared/schema";

interface CoachGoalsProps {
  playerId: number;
}

const GRADE_VALUES: Record<string, number> = {
  'A+': 100, 'A': 95, 'A-': 90,
  'B+': 88, 'B': 85, 'B-': 80,
  'C+': 78, 'C': 75, 'C-': 70,
  'D+': 68, 'D': 65, 'D-': 60,
  'F': 50,
};

const TARGET_TYPES = [
  { value: "stat_min", label: "At Least (Min)" },
  { value: "stat_max", label: "At Most (Max)" },
  { value: "grade_avg", label: "Grade Average" },
  { value: "attendance", label: "Attendance %" },
];

const TARGET_CATEGORIES = [
  { value: "points", label: "Points" },
  { value: "rebounds", label: "Rebounds" },
  { value: "assists", label: "Assists" },
  { value: "steals", label: "Steals" },
  { value: "blocks", label: "Blocks" },
  { value: "turnovers", label: "Turnovers" },
  { value: "defense", label: "Defense Rating" },
  { value: "hustle", label: "Hustle Score" },
  { value: "overall", label: "Overall Grade" },
];

function calculateProgress(goal: CoachGoal, games: Game[]): { current: number; percent: number } {
  if (games.length === 0) return { current: 0, percent: 0 };
  
  const recentGames = games.slice(0, 10);
  let current = 0;
  
  switch (goal.targetType) {
    case 'stat_min':
    case 'stat_max': {
      const category = goal.targetCategory as keyof Game;
      const total = recentGames.reduce((acc, g) => {
        const val = g[category];
        return acc + (typeof val === 'number' ? val : 0);
      }, 0);
      current = total / recentGames.length;
      
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
        const total = recentGames.reduce((acc, g) => acc + (g.defenseRating || 50), 0);
        current = total / recentGames.length;
      } else if (goal.targetCategory === 'hustle') {
        const total = recentGames.reduce((acc, g) => acc + (g.hustleScore || 50), 0);
        current = total / recentGames.length;
      } else {
        const total = recentGames.reduce((acc, g) => acc + (GRADE_VALUES[g.grade || 'C'] || 75), 0);
        current = total / recentGames.length;
      }
      const percent = Math.min(100, (current / goal.targetValue) * 100);
      return { current: Math.round(current), percent };
    }
    case 'attendance': {
      return { current: 0, percent: 0 };
    }
    default:
      return { current: 0, percent: 0 };
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return (
        <Badge variant="secondary" className="bg-green-500/20 text-green-400" data-testid="badge-status-completed">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    case 'missed':
      return (
        <Badge variant="secondary" className="bg-red-500/20 text-red-400" data-testid="badge-status-missed">
          <XCircle className="w-3 h-3 mr-1" />
          Missed
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="bg-blue-500/20 text-blue-400" data-testid="badge-status-active">
          <Clock className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
  }
}

export function CoachGoals({ playerId }: CoachGoalsProps) {
  const { data: goals = [], isLoading } = useCoachGoals(playerId);
  const { data: player } = usePlayer(playerId);
  const createGoal = useCreateCoachGoal();
  const updateGoal = useUpdateCoachGoal();
  const deleteGoal = useDeleteCoachGoal();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<CoachGoal | null>(null);
  const [feedbackGoal, setFeedbackGoal] = useState<CoachGoal | null>(null);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coachName, setCoachName] = useState("");
  const [targetType, setTargetType] = useState("stat_min");
  const [targetCategory, setTargetCategory] = useState("points");
  const [targetValue, setTargetValue] = useState("");
  const [deadline, setDeadline] = useState("");
  const [feedback, setFeedback] = useState("");

  const games = player?.games || [];

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCoachName("");
    setTargetType("stat_min");
    setTargetCategory("points");
    setTargetValue("");
    setDeadline("");
    setFeedback("");
  };

  const handleCreate = async () => {
    if (!title || !coachName || !targetValue) return;
    
    await createGoal.mutateAsync({
      playerId,
      coachName,
      title,
      description: description || null,
      targetType,
      targetCategory,
      targetValue: parseInt(targetValue),
      deadline: deadline || null,
    });
    
    resetForm();
    setIsAddOpen(false);
  };

  const handleEdit = async () => {
    if (!editingGoal || !title || !targetValue) return;
    
    await updateGoal.mutateAsync({
      id: editingGoal.id,
      playerId,
      updates: {
        title,
        description: description || null,
        targetType,
        targetCategory,
        targetValue: parseInt(targetValue),
        deadline: deadline || null,
      },
    });
    
    resetForm();
    setEditingGoal(null);
  };

  const handleStatusChange = async (goal: CoachGoal, newStatus: string) => {
    await updateGoal.mutateAsync({
      id: goal.id,
      playerId,
      updates: { status: newStatus },
    });
  };

  const handleFeedbackSave = async () => {
    if (!feedbackGoal) return;
    
    await updateGoal.mutateAsync({
      id: feedbackGoal.id,
      playerId,
      updates: { coachFeedback: feedback },
    });
    
    setFeedback("");
    setFeedbackGoal(null);
  };

  const handleDelete = async (goalId: number) => {
    await deleteGoal.mutateAsync({ id: goalId, playerId });
  };

  const openEditDialog = (goal: CoachGoal) => {
    setTitle(goal.title);
    setDescription(goal.description || "");
    setCoachName(goal.coachName);
    setTargetType(goal.targetType);
    setTargetCategory(goal.targetCategory);
    setTargetValue(goal.targetValue.toString());
    setDeadline(goal.deadline || "");
    setEditingGoal(goal);
  };

  const openFeedbackDialog = (goal: CoachGoal) => {
    setFeedback(goal.coachFeedback || "");
    setFeedbackGoal(goal);
  };

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const missedGoals = goals.filter(g => g.status === 'missed');

  if (isLoading) {
    return (
      <Card className="p-4" data-testid="coach-goals-loading">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-muted rounded w-40"></div>
          <div className="h-16 bg-muted rounded"></div>
          <div className="h-16 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  const GoalForm = ({ onSubmit, submitLabel, isPending }: { onSubmit: () => void; submitLabel: string; isPending: boolean }) => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="coach-name">Coach Name</Label>
        <Input
          id="coach-name"
          value={coachName}
          onChange={(e) => setCoachName(e.target.value)}
          placeholder="Coach Johnson"
          data-testid="input-coach-name"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="goal-title">Goal Title</Label>
        <Input
          id="goal-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Improve free throw percentage"
          data-testid="input-goal-title"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="goal-description">Description</Label>
        <Textarea
          id="goal-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the goal in detail..."
          className="resize-none"
          data-testid="textarea-goal-description"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Target Type</Label>
          <Select value={targetType} onValueChange={setTargetType}>
            <SelectTrigger data-testid="select-target-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TARGET_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Target Category</Label>
          <Select value={targetCategory} onValueChange={setTargetCategory}>
            <SelectTrigger data-testid="select-target-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TARGET_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="target-value">Target Value</Label>
          <Input
            id="target-value"
            type="number"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            placeholder="15"
            data-testid="input-target-value"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="goal-deadline">Deadline</Label>
          <Input
            id="goal-deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            data-testid="input-deadline"
          />
        </div>
      </div>
      
      <DialogFooter>
        <Button 
          onClick={onSubmit} 
          disabled={!title || !coachName || !targetValue || isPending}
          data-testid="button-save-goal"
        >
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </DialogFooter>
    </div>
  );

  const GoalCard = ({ goal }: { goal: CoachGoal }) => {
    const { current, percent } = calculateProgress(goal, games);
    const isOnTrack = percent >= 75;
    
    return (
      <div
        className={cn(
          "p-4 rounded-md border",
          goal.status === 'completed' ? "border-green-500/30 bg-green-500/5" :
          goal.status === 'missed' ? "border-red-500/30 bg-red-500/5" :
          "border-border bg-card/50"
        )}
        data-testid={`coach-goal-${goal.id}`}
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm" data-testid={`goal-title-${goal.id}`}>{goal.title}</span>
              {getStatusBadge(goal.status)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Assigned by: {goal.coachName}
              {goal.deadline && ` | Due: ${goal.deadline}`}
            </p>
            {goal.description && (
              <p className="text-sm text-muted-foreground mt-2">{goal.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {goal.status === 'active' && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleStatusChange(goal, 'completed')}
                  title="Mark as completed"
                  data-testid={`button-complete-${goal.id}`}
                >
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleStatusChange(goal, 'missed')}
                  title="Mark as missed"
                  data-testid={`button-miss-${goal.id}`}
                >
                  <XCircle className="w-4 h-4 text-red-500" />
                </Button>
              </>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => openEditDialog(goal)}
              data-testid={`button-edit-${goal.id}`}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => openFeedbackDialog(goal)}
              title="Add feedback"
              data-testid={`button-feedback-${goal.id}`}
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-destructive"
              onClick={() => handleDelete(goal.id)}
              data-testid={`button-delete-${goal.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {goal.status === 'active' && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Current: {current}</span>
              <span>Target: {goal.targetValue}</span>
            </div>
            <Progress 
              value={percent} 
              className={cn("h-2", isOnTrack ? "" : "bg-muted")} 
              data-testid={`progress-${goal.id}`}
            />
          </div>
        )}
        
        {goal.coachFeedback && (
          <div className="mt-3 p-2 rounded bg-muted/50 border-l-2 border-primary" data-testid={`feedback-${goal.id}`}>
            <p className="text-xs text-muted-foreground mb-1">Coach Feedback:</p>
            <p className="text-sm">{goal.coachFeedback}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="p-5" data-testid="coach-goals-panel">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="text-lg font-bold font-display flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" /> Coach Goals
        </h3>
        <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1" data-testid="button-add-coach-goal">
              <Plus className="w-4 h-4" /> Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Assign New Goal</DialogTitle>
              <DialogDescription>
                Create a goal for this player to work towards
              </DialogDescription>
            </DialogHeader>
            <GoalForm onSubmit={handleCreate} submitLabel="Create Goal" isPending={createGoal.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground" data-testid="no-goals-message">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No coach goals assigned yet</p>
          <p className="text-xs">Click "Add Goal" to assign a goal to this player</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeGoals.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Goals</p>
              {activeGoals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          )}
          
          {completedGoals.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Completed</p>
              {completedGoals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          )}
          
          {missedGoals.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Missed</p>
              {missedGoals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={!!editingGoal} onOpenChange={(open) => { if (!open) { setEditingGoal(null); resetForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
            <DialogDescription>
              Update the goal details
            </DialogDescription>
          </DialogHeader>
          <GoalForm onSubmit={handleEdit} submitLabel="Save Changes" isPending={updateGoal.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!feedbackGoal} onOpenChange={(open) => { if (!open) { setFeedbackGoal(null); setFeedback(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Coach Feedback</DialogTitle>
            <DialogDescription>
              Add feedback for "{feedbackGoal?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="coach-feedback">Feedback</Label>
              <Textarea
                id="coach-feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Great progress! Keep working on..."
                className="resize-none min-h-[100px]"
                data-testid="textarea-coach-feedback"
              />
            </div>
            <DialogFooter>
              <Button 
                onClick={handleFeedbackSave} 
                disabled={updateGoal.isPending}
                data-testid="button-save-feedback"
              >
                {updateGoal.isPending ? "Saving..." : "Save Feedback"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
