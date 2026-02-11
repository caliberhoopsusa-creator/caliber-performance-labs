import { useState, useEffect, useCallback } from "react";
import { X, ChevronRight, ChevronLeft, Trophy, Activity, Video, Target, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
}

const tourSteps: TourStep[] = [
  {
    title: "Welcome to Caliber!",
    description: "Your personal basketball performance lab. Let's show you around and get you started on your journey to greatness.",
    icon: <Sparkles className="w-8 h-8" />,
    gradient: "from-accent to-blue-600",
  },
  {
    title: "Log Your Games",
    description: "After each game, log your stats to receive instant performance grades. Our AI calculates position-weighted metrics to give you an accurate rating.",
    icon: <Activity className="w-8 h-8" />,
    gradient: "from-blue-500 to-purple-600",
  },
  {
    title: "Earn Badges & Level Up",
    description: "Complete challenges, maintain streaks, and unlock badges as you progress from Rookie to Hall of Fame. Every game brings you closer to the top!",
    icon: <Trophy className="w-8 h-8" />,
    gradient: "from-accent to-accent/80",
  },
  {
    title: "AI Video Analysis",
    description: "Upload game footage and let our AI extract stats automatically. No more manual tracking - just play and let us handle the rest.",
    icon: <Video className="w-8 h-8" />,
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    title: "Track Your Progress",
    description: "View detailed analytics, compare yourself to others on the leaderboard, and watch your skills improve over time.",
    icon: <Target className="w-8 h-8" />,
    gradient: "from-pink-500 to-rose-600",
  },
];

const TOUR_STORAGE_KEY = "caliber_onboarding_completed";

interface OnboardingTourProps {
  forceShow?: boolean;
  onComplete?: () => void;
}

export function OnboardingTour({ forceShow = false, onComplete }: OnboardingTourProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [location] = useLocation();
  const [initialLocation] = useState(location);

  const handleComplete = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    setIsVisible(false);
    onComplete?.();
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    setIsVisible(false);
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    if (forceShow) {
      setIsVisible(true);
      return;
    }

    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  // Auto-dismiss when user navigates away
  useEffect(() => {
    if (isVisible && location !== initialLocation) {
      handleSkip();
    }
  }, [location, initialLocation, isVisible, handleSkip]);

  // Handle Escape key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isVisible) {
        handleSkip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, handleSkip]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md cursor-pointer"
          onClick={handleSkip}
          data-testid="onboarding-tour-modal"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative max-w-md w-full rounded-2xl overflow-hidden cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-10 blur-3xl`}
              animate={{ opacity: [0.1, 0.15, 0.1] }}
              transition={{ repeat: Infinity, duration: 3 }}
            />
            
            <div className="relative bg-card border border-accent/20 rounded-2xl p-8 space-y-6">
              <motion.div
                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${step.gradient}`}
                layoutId="progress-bar"
              />
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4"
                onClick={handleSkip}
                data-testid="button-tour-skip"
              >
                <X className="w-4 h-4" />
              </Button>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="text-center space-y-5 pt-4"
                >
                  <motion.div
                    className="relative w-20 h-20 mx-auto"
                    initial={{ scale: 0.8, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 15, stiffness: 300 }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-20 rounded-2xl blur-xl animate-pulse`} />
                    <div className={`relative w-full h-full rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white shadow-lg`}>
                      {step.icon}
                    </div>
                  </motion.div>
                  
                  <h2 className="text-2xl font-display font-bold text-foreground tracking-wide" data-testid="text-tour-title">
                    {step.title}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed" data-testid="text-tour-description">
                    {step.description}
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center justify-center gap-2">
                {tourSteps.map((s, index) => (
                  <motion.div
                    key={index}
                    layout
                    className={`h-2 rounded-full ${
                      index === currentStep
                        ? `bg-gradient-to-r ${s.gradient}`
                        : index < currentStep
                        ? "bg-accent/50"
                        : "bg-muted"
                    }`}
                    animate={{ width: index === currentStep ? 32 : 8 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between gap-4 pt-2">
                <Button
                  variant="ghost"
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="gap-1"
                  data-testid="button-tour-prev"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>

                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={handleNext}
                    className={`gap-1 min-w-[120px] bg-gradient-to-r ${step.gradient} border-0 shadow-lg`}
                    data-testid="button-tour-next"
                  >
                    {isLastStep ? "Get Started" : "Next"}
                    {!isLastStep && <ChevronRight className="w-4 h-4" />}
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useOnboardingTour() {
  const [showTour, setShowTour] = useState(false);

  const resetTour = () => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    setShowTour(true);
  };

  const isTourCompleted = () => {
    return localStorage.getItem(TOUR_STORAGE_KEY) === "true";
  };

  return { showTour, setShowTour, resetTour, isTourCompleted };
}
