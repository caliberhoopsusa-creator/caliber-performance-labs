import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, Trophy, Activity, Video, Target, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const tourSteps: TourStep[] = [
  {
    title: "Welcome to Caliber!",
    description: "Your personal basketball performance lab. Let's show you around and get you started on your journey to greatness.",
    icon: <Sparkles className="w-8 h-8 text-primary" />,
  },
  {
    title: "Log Your Games",
    description: "After each game, log your stats to receive instant performance grades. Our AI calculates position-weighted metrics to give you an accurate rating.",
    icon: <Activity className="w-8 h-8 text-primary" />,
  },
  {
    title: "Earn Badges & Level Up",
    description: "Complete challenges, maintain streaks, and unlock badges as you progress from Rookie to Hall of Fame. Every game brings you closer to the top!",
    icon: <Trophy className="w-8 h-8 text-primary" />,
  },
  {
    title: "AI Video Analysis",
    description: "Upload game footage and let our AI extract stats automatically. No more manual tracking - just play and let us handle the rest.",
    icon: <Video className="w-8 h-8 text-primary" />,
  },
  {
    title: "Track Your Progress",
    description: "View detailed analytics, compare yourself to others on the leaderboard, and watch your skills improve over time.",
    icon: <Target className="w-8 h-8 text-primary" />,
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

  const handleComplete = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    setIsVisible(false);
    onComplete?.();
  };

  const handleSkip = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    setIsVisible(false);
    onComplete?.();
  };

  if (!isVisible) return null;

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" data-testid="onboarding-tour-modal">
      <Card className="relative max-w-md w-full glass-card border-primary/20 p-6 space-y-6">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3"
          onClick={handleSkip}
          data-testid="button-tour-skip"
        >
          <X className="w-4 h-4" />
        </Button>

        <div className="text-center space-y-4 pt-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
            {step.icon}
          </div>
          <h2 className="text-2xl font-bold text-white" data-testid="text-tour-title">{step.title}</h2>
          <p className="text-muted-foreground leading-relaxed" data-testid="text-tour-description">{step.description}</p>
        </div>

        <div className="flex items-center justify-center gap-1.5">
          {tourSteps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? "w-6 bg-primary"
                  : index < currentStep
                  ? "bg-primary/50"
                  : "bg-white/20"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
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

          <Button
            onClick={handleNext}
            className="gap-1 min-w-[100px]"
            data-testid="button-tour-next"
          >
            {isLastStep ? "Get Started" : "Next"}
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </Card>
    </div>
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
