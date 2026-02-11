import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, UserPlus, Activity, Award, ChevronRight, CheckCircle2 } from "lucide-react";
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
  highlight?: string;
  completed: boolean;
}

const GUIDED_ONBOARDING_KEY = "caliber_guided_onboarding";

interface GuidedOnboardingState {
  hasPlayer: boolean;
  hasGame: boolean;
  viewedGrade: boolean;
  dismissed: boolean;
}

const DEFAULT_STATE: GuidedOnboardingState = { hasPlayer: false, hasGame: false, viewedGrade: false, dismissed: false };

function getStoredState(): GuidedOnboardingState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const stored = localStorage.getItem(GUIDED_ONBOARDING_KEY);
    if (stored) {
      return JSON.parse(stored);
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

  const dismiss = useCallback(() => {
    setState(prev => {
      const newState = { ...prev, dismissed: true };
      saveState(newState);
      return newState;
    });
  }, []);

  const reset = useCallback(() => {
    const newState = { hasPlayer: false, hasGame: false, viewedGrade: false, dismissed: false };
    setState(newState);
    saveState(newState);
  }, []);

  return {
    state,
    markPlayerAdded,
    markGameLogged,
    markGradeViewed,
    dismiss,
    reset,
    isComplete: state.hasPlayer && state.hasGame && state.viewedGrade,
    shouldShow: !state.dismissed && !(state.hasPlayer && state.hasGame && state.viewedGrade),
  };
}

export function GuidedOnboarding() {
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const { state, markPlayerAdded, markGameLogged, markGradeViewed, dismiss, isComplete } = useGuidedOnboarding();
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

  const hasPlayer = (players?.length || 0) > 0;
  const hasGame = (games?.length || 0) > 0;

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
    if ((location === "/leaderboard" || location.startsWith("/players/")) && !state.viewedGrade && hasGame) {
      markGradeViewed();
    }
  }, [location, state.viewedGrade, hasGame, markGradeViewed]);

  if (state.dismissed || isComplete) return null;

  const steps: OnboardingStep[] = [
    {
      id: "add-player",
      title: "Add Your First Player",
      description: "Create your first player profile to start tracking stats",
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
      targetPath: "/leaderboard",
      completed: state.viewedGrade,
    },
  ];

  const currentStepIndex = steps.findIndex(s => !s.completed);
  const currentStep = steps[currentStepIndex] || steps[steps.length - 1];
  const completedCount = steps.filter(s => s.completed).length;

  const handleAction = () => {
    if (currentStep.targetPath) {
      navigate(currentStep.targetPath);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-80 z-50"
        data-testid="guided-onboarding-widget"
      >
        <div className="relative rounded-xl border border-accent/20 bg-gradient-to-br from-[hsl(220,25%,10%)] via-[hsl(220,20%,8%)] to-[hsl(220,25%,6%)] shadow-xl shadow-black/40 overflow-hidden">
          <div className="absolute inset-x-[10%] top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
          
          <div className="p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-accent/20 to-blue-500/10 border border-accent/20">
                  <Activity className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-white">Quick Start</span>
                  <span className="text-xs text-accent/70 ml-2" data-testid="text-onboarding-progress">
                    {completedCount}/{steps.length} completed
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
                  data-testid="button-dismiss-onboarding"
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
                      : "bg-white/10"
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
                  <div className="space-y-3">
                    {steps.map((step, i) => (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg transition-all",
                          step.completed
                            ? "bg-accent/10 border border-accent/20"
                            : i === currentStepIndex
                            ? "bg-white/5 border border-white/10"
                            : "opacity-50"
                        )}
                        data-testid={`onboarding-step-${step.id}`}
                      >
                        <div
                          className={cn(
                            "p-2 rounded-lg shrink-0",
                            step.completed
                              ? "bg-accent/20 text-accent"
                              : "bg-white/10 text-muted-foreground"
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
                              step.completed ? "text-accent" : "text-white"
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
                              onClick={handleAction}
                              className="mt-2 text-xs gap-1"
                              data-testid={`button-action-${step.id}`}
                            >
                              {step.action}
                              <ChevronRight className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-xs text-muted-foreground text-center">
                      {completedCount}/{steps.length} steps completed
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function resetGuidedOnboarding() {
  localStorage.removeItem(GUIDED_ONBOARDING_KEY);
}
