import { useEffect, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, UserPlus, Activity, Award, ChevronRight, Check, FileText, Users, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  targetPath?: string;
  completed: boolean;
}

const GUIDED_ONBOARDING_KEY = "caliber_guided_onboarding";

interface GuidedOnboardingState {
  hasPlayer: boolean;
  hasGame: boolean;
  viewedGrade: boolean;
  setBio: boolean;
  followedPlayer: boolean;
  viewedAnalytics: boolean;
  dismissed: boolean;
}

const DEFAULT_STATE: GuidedOnboardingState = {
  hasPlayer: false,
  hasGame: false,
  viewedGrade: false,
  setBio: false,
  followedPlayer: false,
  viewedAnalytics: false,
  dismissed: false,
};

function getStoredState(): GuidedOnboardingState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const stored = localStorage.getItem(GUIDED_ONBOARDING_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_STATE, ...parsed };
    }
  } catch {
  }
  return DEFAULT_STATE;
}

function saveState(state: GuidedOnboardingState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GUIDED_ONBOARDING_KEY, JSON.stringify(state));
  } catch {
  }
}

export function useGuidedOnboarding() {
  const [state, setState] = useState<GuidedOnboardingState>(DEFAULT_STATE);
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    const stored = getStoredState();
    setState(stored);
    setIsInitialized(true);
  }, []);

  const markPlayerAdded = useCallback(() => {
    setState(prev => {
      const newState = { ...prev, hasPlayer: true };
      saveState(newState);
      return newState;
    });
  }, []);

  const markGameLogged = useCallback(() => {
    setState(prev => {
      const newState = { ...prev, hasGame: true };
      saveState(newState);
      return newState;
    });
  }, []);

  const markGradeViewed = useCallback(() => {
    setState(prev => {
      const newState = { ...prev, viewedGrade: true };
      saveState(newState);
      return newState;
    });
  }, []);

  const markBioSet = useCallback(() => {
    setState(prev => {
      const newState = { ...prev, setBio: true };
      saveState(newState);
      return newState;
    });
  }, []);

  const markFollowedPlayer = useCallback(() => {
    setState(prev => {
      const newState = { ...prev, followedPlayer: true };
      saveState(newState);
      return newState;
    });
  }, []);

  const markAnalyticsViewed = useCallback(() => {
    setState(prev => {
      const newState = { ...prev, viewedAnalytics: true };
      saveState(newState);
      return newState;
    });
  }, []);

  const dismiss = useCallback(() => {
    setState(prev => {
      const newState = { ...prev, dismissed: true };
      saveState(newState);
      return newState;
    });
  }, []);

  const reset = useCallback(() => {
    const newState = { ...DEFAULT_STATE };
    setState(newState);
    saveState(newState);
  }, []);

  const isComplete = state.hasPlayer && state.hasGame && state.viewedGrade && state.setBio && state.followedPlayer && state.viewedAnalytics;

  return {
    state,
    isInitialized,
    markPlayerAdded,
    markGameLogged,
    markGradeViewed,
    markBioSet,
    markFollowedPlayer,
    markAnalyticsViewed,
    dismiss,
    reset,
    isComplete,
    shouldShow: !state.dismissed && !isComplete,
  };
}

export function ProgressChecklist() {
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const {
    state, markPlayerAdded, markGameLogged, markGradeViewed,
    markBioSet, markAnalyticsViewed, dismiss, isComplete,
  } = useGuidedOnboarding();

  const { data: players } = useQuery<{ id: number }[]>({
    queryKey: ["/api/players"],
    staleTime: 1000 * 30,
  });

  const { data: games } = useQuery<{ id: number }[]>({
    queryKey: ["/api/games"],
    staleTime: 1000 * 30,
    refetchOnMount: true,
  });

  const { data: userMe } = useQuery<{ bio?: string; playerId?: number | null }>({
    queryKey: ["/api/users/me"],
    staleTime: 1000 * 30,
  });

  const hasPlayer = (players?.length || 0) > 0;
  const hasGame = (games?.length || 0) > 0;
  const hasBio = !!(userMe?.bio && userMe.bio.trim().length > 0);

  useEffect(() => {
    if (hasPlayer && !state.hasPlayer) markPlayerAdded();
  }, [hasPlayer, state.hasPlayer, markPlayerAdded]);

  useEffect(() => {
    if (hasGame && !state.hasGame) markGameLogged();
  }, [hasGame, state.hasGame, markGameLogged]);

  useEffect(() => {
    if (
      (location === "/leaderboard" ||
        location.startsWith("/players/") ||
        location.startsWith("/analytics?tab=leaderboard")) &&
      !state.viewedGrade &&
      hasGame
    ) {
      markGradeViewed();
    }
  }, [location, state.viewedGrade, hasGame, markGradeViewed]);

  useEffect(() => {
    if (hasBio && !state.setBio) markBioSet();
  }, [hasBio, state.setBio, markBioSet]);

  useEffect(() => {
    if (location.startsWith("/analytics") && !state.viewedAnalytics) markAnalyticsViewed();
  }, [location, state.viewedAnalytics, markAnalyticsViewed]);

  if (state.dismissed || isComplete) return null;

  const steps: OnboardingStep[] = [
    {
      id: "create-profile",
      title: "Create Your Profile",
      description: "",
      icon: <UserPlus className="w-3.5 h-3.5" />,
      action: "Set Up Profile",
      targetPath: "/players",
      completed: state.hasPlayer || hasPlayer,
    },
    {
      id: "log-game",
      title: "Log Your First Game",
      description: "",
      icon: <Activity className="w-3.5 h-3.5" />,
      action: "Log Game",
      targetPath: "/analyze",
      completed: state.hasGame || hasGame,
    },
    {
      id: "view-grade",
      title: "View Your Grade",
      description: "",
      icon: <Award className="w-3.5 h-3.5" />,
      action: "View Grades",
      targetPath: "/analytics?tab=leaderboard",
      completed: state.viewedGrade,
    },
    {
      id: "set-bio",
      title: "Complete Your Bio",
      description: "",
      icon: <FileText className="w-3.5 h-3.5" />,
      action: "Edit Profile",
      targetPath: userMe?.playerId ? `/players/${userMe.playerId}` : "/players",
      completed: state.setBio || hasBio,
    },
    {
      id: "follow-teammate",
      title: "Follow a Teammate",
      description: "",
      icon: <Users className="w-3.5 h-3.5" />,
      action: "Find Players",
      targetPath: "/community?tab=connect",
      completed: state.followedPlayer,
    },
    {
      id: "check-leaderboard",
      title: "Check the Leaderboard",
      description: "",
      icon: <BarChart3 className="w-3.5 h-3.5" />,
      action: "View Rankings",
      targetPath: "/analytics?tab=leaderboard",
      completed: state.viewedAnalytics,
    },
  ];

  const currentStepIndex = steps.findIndex((s) => !s.completed);
  const completedCount = steps.filter((s) => s.completed).length;
  const pct = Math.round((completedCount / steps.length) * 100);

  return (
    <Card
      className="border-amber-500/20 overflow-hidden"
      data-testid="card-getting-started"
    >
      {/* Amber top accent line */}
      <div className="h-[3px] w-full bg-gradient-to-r from-amber-500/80 via-amber-400 to-amber-600/30" />

      <div className="p-4 pb-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-display font-bold text-base text-foreground leading-tight">
              Getting Started
            </h3>
            <p
              className="text-xs text-muted-foreground mt-0.5"
              data-testid="text-onboarding-progress"
            >
              {completedCount} of {steps.length} steps complete
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 -mt-1 -mr-1 h-7 w-7 text-muted-foreground/50 hover:text-muted-foreground"
            onClick={dismiss}
            data-testid="button-dismiss-getting-started"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-4">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Step rows */}
        <div className="space-y-1">
          {steps.map((step, i) => {
            const isDone = step.completed;
            const isNext = i === currentStepIndex;
            const isFuture = !isDone && !isNext;

            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  isNext && "bg-amber-500/10 border border-amber-500/20",
                  isDone && "opacity-55",
                  isFuture && "opacity-35"
                )}
                data-testid={`onboarding-step-${step.id}`}
              >
                {/* Icon bubble */}
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                    isDone && "bg-amber-500/15 text-amber-400",
                    isNext && "bg-amber-500 text-black",
                    isFuture && "bg-muted/80 text-muted-foreground"
                  )}
                >
                  {isDone ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    step.icon
                  )}
                </div>

                {/* Title */}
                <span
                  className={cn(
                    "flex-1 text-sm leading-none truncate",
                    isDone && "line-through text-muted-foreground",
                    isNext && "font-semibold text-foreground",
                    isFuture && "font-medium text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>

                {/* CTA — next step only */}
                {isNext && (
                  <Button
                    size="sm"
                    className="shrink-0 h-7 px-3 text-xs bg-amber-500 hover:bg-amber-400 text-black font-bold gap-1 leading-none"
                    onClick={() => step.targetPath && navigate(step.targetPath)}
                    data-testid={`button-action-${step.id}`}
                  >
                    {step.action}
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

/** Alias — FeedContent.tsx imports this name; no change needed there. */
export function GettingStartedCard() {
  return <ProgressChecklist />;
}

export function GuidedOnboarding() {
  return null;
}

export function resetGuidedOnboarding() {
  localStorage.removeItem(GUIDED_ONBOARDING_KEY);
}
