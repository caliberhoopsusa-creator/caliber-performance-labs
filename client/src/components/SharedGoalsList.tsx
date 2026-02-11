import { useSharedGoals, usePlayers } from "@/hooks/use-basketball";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Target, Users, Calendar } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export function SharedGoalsList() {
  const { data: sharedGoals = [], isLoading } = useSharedGoals();
  const { data: players = [] } = usePlayers();

  if (isLoading) {
    return (
      <Card className="p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-muted rounded w-40"></div>
          <div className="h-16 bg-muted rounded"></div>
          <div className="h-16 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  if (sharedGoals.length === 0) {
    return (
      <Card className="p-5">
        <h3 className="text-lg font-bold font-display text-white flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-accent" /> Goals Shared With Me
        </h3>
        <div className="text-center py-6 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No shared goals yet</p>
          <p className="text-xs">When teammates share goals with you, they'll appear here</p>
        </div>
      </Card>
    );
  }

  const getPlayerById = (id: number | null) => {
    if (!id) return null;
    return players.find(p => p.id === id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card className="p-5">
      <h3 className="text-lg font-bold font-display text-white flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-accent" /> Goals Shared With Me
      </h3>

      <div className="space-y-3">
        {sharedGoals.map((sharedGoal) => {
          const goal = sharedGoal.goal;
          const sharedByPlayer = sharedGoal.sharedByPlayer || getPlayerById(sharedGoal.sharedWithPlayerId);
          
          if (!goal) return null;
          
          return (
            <Link 
              key={sharedGoal.id} 
              href={`/players/${sharedByPlayer?.id || ''}`}
              className="block"
            >
              <div
                className={cn(
                  "p-3 rounded-md border hover-elevate cursor-pointer",
                  goal.completed 
                    ? "border-green-500/30 bg-green-500/5" 
                    : "border-accent/20 bg-card/50"
                )}
                data-testid={`shared-goal-${sharedGoal.id}`}
              >
                <div className="flex items-start gap-3">
                  {sharedByPlayer && (
                    <Avatar className="h-9 w-9 border border-accent/20">
                      <AvatarImage src={sharedByPlayer.photoUrl || undefined} width={36} height={36} />
                      <AvatarFallback className="bg-accent/10 text-accent text-xs">
                        {sharedByPlayer.name?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4 text-accent shrink-0" />
                      <span className="font-medium text-sm truncate">{goal.title}</span>
                      {goal.completed && (
                        <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400 shrink-0">
                          Completed
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {sharedByPlayer && (
                        <span className="truncate">
                          Shared by {sharedByPlayer.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1 shrink-0">
                        <Calendar className="w-3 h-3" />
                        {formatDate(sharedGoal.createdAt)}
                      </span>
                    </div>
                    
                    {!goal.completed && (
                      <div className="mt-2">
                        <Progress value={Math.random() * 80} className="h-1.5" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}