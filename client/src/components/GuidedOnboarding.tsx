import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, UserPlus, Activity, Award, ChevronRight, CheckCircle2, FileText, Users, BarChart3 } from "lucide-react";
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

export function GettingStartedCard() {
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const {
    state, markPlayerAdded, markGameLogged, markGradeViewed,
    markBioSet, markAnalyticsViewed, dismiss, isComplete
  } = useGuidedOnboarding();
  const [isExpanded, setIsExpanded] = useState(true);

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
    if (hasPlayer && !state.hasPlayer) {
      markPlayerAdded();
    }
  }, [hasPlayer, state.hasPlayer, markPlayerAdded]);

  useEffect(() => {
    if (hasGame && !state.hasGame) {
      markGameLogged();
    }
  }, [hasGame, state.hasGame, markGameLogged]);

  useEffect(() => {
    if ((location === "/leaderboard" || location.startsWith("/players/") || location.startsWith("/analytics?tab=leaderboard")) && !state.viewedGrade && hasGame) {
      markGradeViewed();
    }
  }, [location, state.viewedGrade, hasGame, markGradeViewed]);

  useEffect(() => {
    if (hasBio && !state.setBio) {
      markBioSet();
    }
  }, [hasBio, state.setBio, markBioSet]);

  useEffect(() => {
    if (location.startsWith("/analytics") && !state.viewedAnalytics) {
      markAnalyticsViewed();
    }
  }, [location, state.viewedAnalytics, markAnalyticsViewed]);

  if (state.dismissed || isComplete) return null;

  const steps: OnboardingStep[] = [
    {
      id: "create-profile",
      title: "Create Your Profile",
      description: "Set up your player profile to start tracking stats",
      icon: <UserPlus className="w-5 h-5" />,
      action: "Go to Players",
      targetPath: "/players",
      completed: state.hasPlayer || hasPlayer,
    },
    {
      id: "log-game",
      title: "Log Your First Game",
      description: "Enter stats from a game to get your performance grade",
      icon: <Activity className="w-5 h-5" />,
      action: "Log Game",
      targetPath: "/analyze",
      completed: state.hasGame || hasGame,
    },
    {
      id: "view-grade",
      title: "View Your Grade",
      description: "See your letter grade and detailed performance breakdown",
      icon: <Award className="w-5 h-5" />,
      action: "View Grades",
      targetPath: "/analytics?tab=leaderboard",
      completed: state.viewedGrade,
    },
    {
      id: "set-bio",
      title: "Set Your Bio",
      description: "Tell others about yourself on your player profile",
      icon: <FileText className="w-5 h-5" />,
      action: "Edit Profile",
      targetPath: userMe?.playerId ? `/players/${userMe.playerId}` : "/players",
      completed: state.setBio || hasBio,
    },
    {
      id: "follow-teammate",
      title: "Follow a Teammate",
      description: "Connect with other players to see their updates",
      icon: <Users className="w-5 h-5" />,
      action: "Find Players",
      targetPath: "/community?tab=connect",
      completed: state.followedPlayer,
    },
    {
      id: "check-leaderboard",
      title: "Check the Leaderboard",
      description: "See how you stack up against other players",
      icon: <BarChart3 className="w-5 h-5" />,
      action: "View Analytics",
      targetPath: "/analytics?tab=leaderboard",
      completed: state.viewedAnalytics,
    },
  ];

  const currentStepIndex = steps.findIndex(s => !s.completed);
  const currentStep = steps[currentStepIndex] || steps[steps.length - 1];
  const completedCount = steps.filter(s => s.completed).length;

  const handleAction = (targetPath?: string) => {
    if (targetPath) {
      navigate(targetPath);
    }
  };

  return (
    <Card className="border-accent/20 overflow-visible" data-testid="card-getting-started">
      <div className="p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-1.5 rounded-md bg-accent/10 border border-accent/20">
              <Activity className="w-4 h-4 text-accent" />
            </div>
            <div>
              <span className="text-sm font-semibold text-foreground">Getting Started</span>
              <span className="text-xs text-muted-foreground ml-2" data-testid="text-onboarding-progress">
                {completedCount}/{steps.length} completed
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              data-testid="button-toggle-onboarding"
            >
              <motion.div
                animate={{ rotate: isExpanded ? 90 : -90 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-4 h-4" />
              </motion.div>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={dismiss}
              data-testid="button-dismiss-getting-started"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-1 mb-3">
          {steps.map((step, i) => (
            <div
              key={step.id}
              className={cn(
                "flex-1 h-1.5 rounded-full transition-all",
                step.completed
                  ? "bg-accent"
                  : i === currentStepIndex
                  ? "bg-accent/40"
                  : "bg-muted"
              )}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-2">
                {steps.map((step, i) => (
                  <div
                    key={step.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-md transition-all",
                      step.completed
                        ? "bg-accent/10 border border-accent/20"
                        : i === currentStepIndex
                        ? "bg-muted/50 border border-border"
                        : "opacity-50"
                    )}
                    data-testid={`onboarding-step-${step.id}`}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-md shrink-0",
                        step.completed
                          ? "bg-accent/20 text-accent"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {step.completed ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        step.icon
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4
                        className={cn(
                          "text-sm font-medium",
                          step.completed ? "text-accent" : "text-foreground"
                        )}
                      >
                        {step.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {step.description}
                      </p>
                      {!step.completed && i === currentStepIndex && (
                        <Button
                          size="sm"
                          onClick={() => handleAction(step.targetPath)}
                          className="mt-2 text-xs gap-1"
                          data-testid={`button-action-${step.id}`}
                        >
                          {step.action}
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  {completedCount}/{steps.length} steps completed
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}

export function GuidedOnboarding() {
  return null;
}

export function resetGuidedOnboarding() {
  localStorage.removeItem(GUIDED_ONBOARDING_KEY);
}
