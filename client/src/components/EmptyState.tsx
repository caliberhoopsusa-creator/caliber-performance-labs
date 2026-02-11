import { LucideIcon, Trophy, Users, Calendar, Video, BarChart3, Target, Dumbbell, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({ 
  icon: Icon = Trophy, 
  title, 
  description, 
  actionLabel, 
  actionHref,
  onAction 
}: EmptyStateProps) {
  const testIdBase = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center" data-testid={`empty-state-${testIdBase}`}>
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/10 flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-accent/60" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2" data-testid={`text-empty-title-${testIdBase}`}>{title}</h3>
      <p className="text-muted-foreground max-w-md mb-6" data-testid={`text-empty-description-${testIdBase}`}>{description}</p>
      {actionLabel && (actionHref || onAction) && (
        actionHref ? (
          <Button asChild data-testid={`button-empty-action-${testIdBase}`}>
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        ) : (
          <Button onClick={onAction} data-testid={`button-empty-action-${testIdBase}`}>{actionLabel}</Button>
        )
      )}
    </div>
  );
}

export function NoPlayersEmpty() {
  return (
    <EmptyState
      icon={Users}
      title="No Players Yet"
      description="Add your first player to start tracking performance and earning grades."
      actionLabel="Add Player"
      actionHref="/players"
    />
  );
}

export function NoGamesEmpty() {
  return (
    <EmptyState
      icon={Activity}
      title="No Games Logged"
      description="Log your first game to see performance grades and start tracking your progress."
      actionLabel="Log a Game"
      actionHref="/analyze"
    />
  );
}

export function NoScheduleEmpty() {
  return (
    <EmptyState
      icon={Calendar}
      title="No Events Scheduled"
      description="Add practices, games, or workouts to your calendar to stay organized."
      actionLabel="Add Event"
      actionHref="/schedule"
    />
  );
}

export function NoHighlightsEmpty() {
  return (
    <EmptyState
      icon={Video}
      title="No Highlights Yet"
      description="Upload your best plays and moments to showcase your skills."
      actionLabel="Upload Highlight"
      actionHref="/highlights"
    />
  );
}

export function NoStatsEmpty() {
  return (
    <EmptyState
      icon={BarChart3}
      title="No Stats Available"
      description="Log games to see detailed statistics and performance trends."
      actionLabel="Log a Game"
      actionHref="/analyze"
    />
  );
}

export function NoChallengesEmpty() {
  return (
    <EmptyState
      icon={Target}
      title="No Active Challenges"
      description="Join or create challenges to compete with other players and push your limits."
      actionLabel="Browse Challenges"
      actionHref="/challenges"
    />
  );
}

export function NoWorkoutsEmpty() {
  return (
    <EmptyState
      icon={Dumbbell}
      title="No Workouts Logged"
      description="Track your off-court training to see how it impacts your game performance."
      actionLabel="Log Workout"
      actionHref="/workouts"
    />
  );
}

export function NoFollowersEmpty() {
  return (
    <EmptyState
      icon={Users}
      title="No Followers Yet"
      description="Share your profile to build your following and connect with other players."
    />
  );
}

export function NoFollowingEmpty() {
  return (
    <EmptyState
      icon={Users}
      title="Not Following Anyone"
      description="Follow other players to see their updates and compare your progress."
      actionLabel="Find Players"
      actionHref="/leaderboard"
    />
  );
}
