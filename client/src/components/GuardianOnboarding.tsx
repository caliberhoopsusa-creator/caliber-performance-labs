import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Heart,
  TrendingUp,
  Trophy,
  Share2,
  ChevronRight,
  Loader2,
  Link2,
  UserPlus,
  BarChart3,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GuardianOnboardingProps {
  onComplete: () => void;
  onBack?: () => void;
}

type OnboardingStep = "welcome" | "link-player" | "done";

const FEATURES = [
  {
    icon: BarChart3,
    title: "Track Progress",
    description: "See your player's grades, stats, and game results in real-time",
  },
  {
    icon: Trophy,
    title: "Celebrate Milestones",
    description: "Get notified when they earn badges, hit career highs, or level up",
  },
  {
    icon: TrendingUp,
    title: "Growth Trends",
    description: "Watch their improvement over time with season-by-season analytics",
  },
  {
    icon: Share2,
    title: "Share Achievements",
    description: "Create shareable cards of their best moments for family and friends",
  },
];

export function GuardianOnboarding({ onComplete, onBack }: GuardianOnboardingProps) {
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [inviteCode, setInviteCode] = useState("");
  const [relationship, setRelationship] = useState("parent");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const requestLinkMutation = useMutation({
    mutationFn: async (data: { inviteCode: string; relationship: string }) => {
      return await apiRequest("POST", "/api/guardian/request", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guardian/players"] });
      setStep("done");
      toast({
        title: "Link Request Sent",
        description: "Your player will need to approve the link request.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Invalid Code",
        description: error.message || "Could not find a player with that invite code. Please check and try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitCode = () => {
    if (!inviteCode.trim()) {
      toast({
        title: "Missing Code",
        description: "Please enter the invite code from your player.",
        variant: "destructive",
      });
      return;
    }
    requestLinkMutation.mutate({
      inviteCode: inviteCode.trim().toUpperCase(),
      relationship,
    });
  };

  if (step === "done") {
    return (
      <div className="space-y-6">
        <Card className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold font-display tracking-wide uppercase mb-2" data-testid="text-onboarding-complete">
            You're All Set!
          </h2>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Once your player approves the link, you'll see their progress on your Family Dashboard.
          </p>
          <Button onClick={onComplete} className="w-full" data-testid="button-go-to-dashboard">
            Go to Family Dashboard
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Card>
      </div>
    );
  }

  if (step === "link-player") {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Link2 className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-bold font-display tracking-wide uppercase" data-testid="text-link-player-title">
              Link to Your Player
            </h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Ask your player for their family invite code. They can find it in their profile under "Invite Family Member".
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Relationship</label>
              <div className="flex gap-2 flex-wrap">
                {["parent", "guardian", "family"].map((rel) => (
                  <Badge
                    key={rel}
                    variant={relationship === rel ? "default" : "outline"}
                    className={cn("cursor-pointer capitalize", relationship === rel && "toggle-elevate toggle-elevated")}
                    onClick={() => setRelationship(rel)}
                    data-testid={`badge-relationship-${rel}`}
                  >
                    {rel}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Invite Code</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter invite code (e.g., FAM-A1B2C3)"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="uppercase flex-1 font-mono"
                  data-testid="input-onboarding-invite-code"
                />
              </div>
            </div>

            <Button
              onClick={handleSubmitCode}
              disabled={requestLinkMutation.isPending}
              className="w-full"
              data-testid="button-submit-invite-code"
            >
              {requestLinkMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              Link to Player
            </Button>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1 text-muted-foreground"
                onClick={() => setStep("welcome")}
                data-testid="button-back-to-welcome"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button
                variant="ghost"
                className="flex-1 text-muted-foreground"
                onClick={onComplete}
                data-testid="button-skip-linking"
              >
                Skip for Now
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-accent" />
        </div>
        <h2 className="text-2xl font-bold font-display tracking-wide uppercase mb-2" data-testid="text-welcome-title">
          Welcome to Your Family Dashboard
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Stay connected to your player's journey. Track their progress, celebrate milestones, and share their achievements.
        </p>
      </Card>

      <div className="grid sm:grid-cols-2 gap-3">
        {FEATURES.map((feature) => (
          <Card key={feature.title} className="p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
              <feature.icon className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h4 className="text-sm font-semibold">{feature.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="space-y-2">
        <Button
          onClick={() => setStep("link-player")}
          className="w-full"
          data-testid="button-start-linking"
        >
          <Link2 className="w-4 h-4 mr-2" />
          Link to My Player
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={onComplete}
          data-testid="button-skip-onboarding"
        >
          Skip for Now
        </Button>
        {onBack && (
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={onBack}
            data-testid="button-back-role-selection"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to role selection
          </Button>
        )}
      </div>
    </div>
  );
}
