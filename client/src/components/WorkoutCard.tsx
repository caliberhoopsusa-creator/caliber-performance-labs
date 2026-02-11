import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dumbbell, Target, Zap, Heart, Footprints, Clock, Trash2, ChevronDown, ChevronUp, Play, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
import { apiRequest } from "@/lib/queryClient";
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

function ShareWorkoutButton({ workoutId }: { workoutId: number }) {
  const qc = useQueryClient();

  const { data: isShared } = useQuery<boolean>({
    queryKey: ['/api/workouts', workoutId, 'shared'],
  });

  const shareMutation = useMutation({
    mutationFn: () => apiRequest('POST', `/api/workouts/${workoutId}/share`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/feed'] });
      qc.invalidateQueries({ queryKey: ['/api/workouts', workoutId, 'shared'] });
    },
  });

  if (isShared) {
    return (
      <Badge variant="secondary" data-testid={`badge-shared-workout-${workoutId}`}>
        <Share2 className="w-3 h-3 mr-1" /> Shared
      </Badge>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={(e) => { e.stopPropagation(); shareMutation.mutate(); }}
      disabled={shareMutation.isPending}
      data-testid={`button-share-workout-${workoutId}`}
    >
      <Share2 className="w-3.5 h-3.5 mr-1" />
      {shareMutation.isPending ? "Sharing..." : "Share to Feed"}
    </Button>
  );
}

export function WorkoutCard({ workout, onDelete, isDeleting }: WorkoutCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  
  const Icon = workoutIcons[workout.workoutType] || Dumbbell;
  const iconColor = workoutColors[workout.workoutType] || "text-primary";
  
  return (
    <div 
      className="rounded-xl p-4 transition-all duration-200"
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
            
            {workout.videoUrl && (
              <Button
                size="sm"
                variant="outline"
                className="mt-3 gap-2 border-primary/30 text-primary"
                onClick={() => setShowVideoModal(true)}
                data-testid={`workout-video-${workout.id}`}
              >
                <Play className="w-3 h-3" />
                Watch Video
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <ShareWorkoutButton workoutId={workout.id} />
          {workout.notes && workout.notes.length > 80 && (
            <Button
              size="icon"
              variant="ghost"
              className="text-muted-foreground"
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
                className="text-muted-foreground"
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
                  className="bg-destructive text-destructive-foreground"
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
      
      {workout.videoUrl && (
        <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
          <DialogContent className="max-w-4xl w-full p-0 gap-0 bg-black/95 border-white/10" data-testid={`dialog-workout-video-${workout.id}`}>
            <div className="aspect-video bg-black">
              <video
                src={workout.videoUrl}
                controls
                autoPlay
                className="w-full h-full"
                data-testid={`video-player-${workout.id}`}
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="p-4 bg-card border-t border-white/10">
              <h3 className="font-display text-lg font-bold text-white">{workout.title}</h3>
              <p className="text-sm text-muted-foreground capitalize">{workout.workoutType} • {workout.duration} min</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
