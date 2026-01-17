import { useState } from "react";
import { Dumbbell, Target, Zap, Heart, Footprints, Clock, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Workout } from "@/hooks/use-basketball";

type WorkoutCardProps = {
  workout: Workout;
  onDelete: (id: number) => void;
  isDeleting?: boolean;
};

const workoutIcons: Record<string, typeof Dumbbell> = {
  weights: Dumbbell,
  conditioning: Footprints,
  shooting: Target,
  skills: Zap,
  recovery: Heart,
};

const workoutColors: Record<string, string> = {
  weights: "text-blue-400",
  conditioning: "text-green-400",
  shooting: "text-orange-400",
  skills: "text-purple-400",
  recovery: "text-pink-400",
};

export function WorkoutCard({ workout, onDelete, isDeleting }: WorkoutCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const Icon = workoutIcons[workout.workoutType] || Dumbbell;
  const iconColor = workoutColors[workout.workoutType] || "text-primary";
  
  return (
    <div 
      className="glass-card rounded-xl p-4 transition-all duration-200 hover:border-white/20"
      data-testid={`workout-card-${workout.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={cn("p-2 rounded-lg bg-secondary/50", iconColor)}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white truncate">{workout.title}</h4>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {workout.duration} min
              </span>
              <span className="capitalize">{workout.workoutType}</span>
            </div>
            
            {workout.intensity && (
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Intensity</span>
                  <span className="text-white font-medium">{workout.intensity}/10</span>
                </div>
                <Progress 
                  value={workout.intensity * 10} 
                  className="h-1.5"
                  data-testid={`workout-intensity-${workout.id}`}
                />
              </div>
            )}
            
            {workout.notes && (
              <div className="mt-2">
                {!isExpanded && workout.notes.length > 80 ? (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {workout.notes.slice(0, 80)}...
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">{workout.notes}</p>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {workout.notes && workout.notes.length > 80 && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-white"
              onClick={() => setIsExpanded(!isExpanded)}
              data-testid={`workout-expand-${workout.id}`}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          )}
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                data-testid={`workout-delete-${workout.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent data-testid="dialog-delete-workout">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Workout</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{workout.title}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => onDelete(workout.id)}
                  className="bg-red-500 hover:bg-red-600"
                  disabled={isDeleting}
                  data-testid="button-confirm-delete"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
