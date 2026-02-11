import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dumbbell, Calendar } from "lucide-react";
import { format, parseISO, isToday, isYesterday, isSameWeek, isSameMonth } from "date-fns";
import { usePlayerWorkouts, useDeleteWorkout, type Workout } from "@/hooks/use-basketball";
import { LogWorkoutModal } from "@/components/LogWorkoutModal";
import { WorkoutCard } from "@/components/WorkoutCard";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface ExtendedUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: string | null;
  playerId: number | null;
}

function useCurrentUser() {
  return useQuery<ExtendedUser | null>({
    queryKey: ['/api/users/me'],
  });
}

function groupWorkoutsByDate(workouts: Workout[]): Map<string, Workout[]> {
  const grouped = new Map<string, Workout[]>();
  
  const sortedWorkouts = [...workouts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  for (const workout of sortedWorkouts) {
    const date = workout.date;
    if (!grouped.has(date)) {
      grouped.set(date, []);
    }
    grouped.get(date)!.push(workout);
  }
  
  return grouped;
}

function formatDateGroup(dateStr: string): string {
  const date = parseISO(dateStr);
  
  if (isToday(date)) {
    return "Today";
  }
  if (isYesterday(date)) {
    return "Yesterday";
  }
  if (isSameWeek(date, new Date())) {
    return format(date, "EEEE");
  }
  if (isSameMonth(date, new Date())) {
    return format(date, "EEEE, MMMM d");
  }
  return format(date, "MMMM d, yyyy");
}

export default function WorkoutsContent() {
  const { toast } = useToast();
  const { data: user } = useCurrentUser();
  const playerId = user?.playerId;
  
  const { data: workouts, isLoading } = usePlayerWorkouts(playerId || 0);
  const deleteWorkout = useDeleteWorkout();
  
  const groupedWorkouts = useMemo(() => {
    if (!workouts) return new Map<string, Workout[]>();
    return groupWorkoutsByDate(workouts);
  }, [workouts]);
  
  const stats = useMemo(() => {
    if (!workouts || workouts.length === 0) {
      return { total: 0, thisWeek: 0, avgIntensity: 0, totalMinutes: 0 };
    }
    
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const thisWeek = workouts.filter(w => new Date(w.date) >= weekAgo).length;
    const intensities = workouts.filter(w => w.intensity).map(w => w.intensity!);
    const avgIntensity = intensities.length > 0 
      ? Math.round(intensities.reduce((a, b) => a + b, 0) / intensities.length) 
      : 0;
    const totalMinutes = workouts.reduce((sum, w) => sum + w.duration, 0);
    
    return {
      total: workouts.length,
      thisWeek,
      avgIntensity,
      totalMinutes,
    };
  }, [workouts]);
  
  const handleDelete = async (id: number) => {
    if (!playerId) return;
    
    try {
      await deleteWorkout.mutateAsync({ id, playerId });
      toast({
        title: "Workout Deleted",
        description: "The workout has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete workout",
        variant: "destructive",
      });
    }
  };
  
  if (!playerId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8" data-testid="workouts-no-player">
        <Dumbbell className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-display font-bold text-white mb-2">Player Profile Required</h2>
        <p className="text-muted-foreground max-w-md">
          You need a player profile to track workouts. Please set up your profile first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="content-workouts">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
          <Card className="" data-testid="stat-total-workouts">
            <CardContent className="p-4">
              <div className="text-3xl font-display font-bold text-white">{stats.total}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Workouts</div>
            </CardContent>
          </Card>
          <Card className="" data-testid="stat-this-week">
            <CardContent className="p-4">
              <div className="text-3xl font-display font-bold text-primary">{stats.thisWeek}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">This Week</div>
            </CardContent>
          </Card>
          <Card className="" data-testid="stat-avg-intensity">
            <CardContent className="p-4">
              <div className="text-3xl font-display font-bold text-white">{stats.avgIntensity}/10</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Avg Intensity</div>
            </CardContent>
          </Card>
          <Card className="" data-testid="stat-total-minutes">
            <CardContent className="p-4">
              <div className="text-3xl font-display font-bold text-white">
                {stats.totalMinutes >= 60 ? `${Math.floor(stats.totalMinutes / 60)}h` : `${stats.totalMinutes}m`}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Time</div>
            </CardContent>
          </Card>
        </div>
        
        <LogWorkoutModal playerId={playerId} />
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : groupedWorkouts.size === 0 ? (
        <Card className="" data-testid="empty-workouts">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-secondary/50 mb-4">
              <Dumbbell className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-display font-bold text-white mb-2">No Workouts Yet</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Start logging your training sessions to track your progress and build consistency.
            </p>
            <LogWorkoutModal playerId={playerId} />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8" data-testid="workouts-list">
          {Array.from(groupedWorkouts.entries()).map(([dateStr, dateWorkouts]) => (
            <div key={dateStr} className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <h3 className="text-sm font-semibold uppercase tracking-wider">
                  {formatDateGroup(dateStr)}
                </h3>
                <span className="text-xs">({dateWorkouts.length} workout{dateWorkouts.length !== 1 ? 's' : ''})</span>
              </div>
              <div className="space-y-3">
                {dateWorkouts.map((workout) => (
                  <WorkoutCard
                    key={workout.id}
                    workout={workout}
                    onDelete={handleDelete}
                    isDeleting={deleteWorkout.isPending}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
