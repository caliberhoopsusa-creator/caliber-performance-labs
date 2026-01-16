import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription, type SubscriptionTier } from "@/hooks/use-subscription";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles, Crown, Zap } from "lucide-react";

interface PaywallProps {
  requiredTier?: SubscriptionTier;
  featureName?: string;
  children: React.ReactNode;
}

export function Paywall({ requiredTier = "pro", featureName = "This feature", children }: PaywallProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasAccess, isLoading: subLoading, isFree } = useSubscription();

  // Show loading state while checking
  if (authLoading || (isAuthenticated && subLoading)) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full" />
      </div>
    );
  }

  // If not authenticated, prompt to sign in
  if (!isAuthenticated) {
    return (
      <PaywallCard 
        icon={Lock}
        title="Sign In Required"
        description={`${featureName} requires you to sign in to access.`}
        buttonText="Sign In"
        buttonHref="/api/login"
        isExternal
      />
    );
  }

  // If user has access, render children
  if (hasAccess(requiredTier)) {
    return <>{children}</>;
  }

  // Otherwise show upgrade prompt
  const isCoachFeature = requiredTier === "coach_pro";
  
  return (
    <PaywallCard 
      icon={isCoachFeature ? Crown : Sparkles}
      title={isCoachFeature ? "Coach Pro Feature" : "Pro Feature"}
      description={`${featureName} is a premium feature. Upgrade your plan to unlock access.`}
      buttonText={isCoachFeature ? "Upgrade to Coach Pro" : "Upgrade to Pro"}
      buttonHref="/pricing"
      tier={requiredTier}
    />
  );
}

interface PaywallCardProps {
  icon: typeof Lock;
  title: string;
  description: string;
  buttonText: string;
  buttonHref: string;
  isExternal?: boolean;
  tier?: SubscriptionTier;
}

function PaywallCard({ icon: Icon, title, description, buttonText, buttonHref, isExternal, tier }: PaywallCardProps) {
  return (
    <div className="flex items-center justify-center min-h-[300px] p-6">
      <Card className="glass-card-glow max-w-md w-full overflow-hidden" data-testid="paywall-card">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-orange-500 to-primary" />
        <CardContent className="pt-10 pb-8 text-center space-y-6">
          <div className="relative mx-auto">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
              <Icon className="w-10 h-10 text-primary" />
            </div>
            {tier === "coach_pro" && (
              <div className="absolute -top-2 -right-2">
                <Crown className="w-6 h-6 text-amber-400" />
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-bold font-display text-white">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
          </div>

          <div className="pt-2 space-y-3">
            {isExternal ? (
              <a href={buttonHref}>
                <Button size="lg" className="w-full shadow-lg shadow-primary/25" data-testid="button-paywall-action">
                  <Zap className="w-4 h-4 mr-2" />
                  {buttonText}
                </Button>
              </a>
            ) : (
              <Link href={buttonHref}>
                <Button size="lg" className="w-full shadow-lg shadow-primary/25" data-testid="button-paywall-action">
                  <Zap className="w-4 h-4 mr-2" />
                  {buttonText}
                </Button>
              </Link>
            )}
            
            <p className="text-xs text-muted-foreground">
              Unlock all premium features with a subscription
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface FeatureGateProps {
  requiredTier?: SubscriptionTier;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function FeatureGate({ requiredTier = "pro", fallback, children }: FeatureGateProps) {
  const { isAuthenticated } = useAuth();
  const { hasAccess, isLoading } = useSubscription();

  if (isLoading && isAuthenticated) {
    return null;
  }

  if (!isAuthenticated || !hasAccess(requiredTier)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

interface UpgradeBadgeProps {
  requiredTier?: SubscriptionTier;
  className?: string;
}

export function UpgradeBadge({ requiredTier = "pro", className }: UpgradeBadgeProps) {
  const { hasAccess, isLoading } = useSubscription();
  const { isAuthenticated } = useAuth();

  if (isLoading || !isAuthenticated || hasAccess(requiredTier)) {
    return null;
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-primary to-orange-500 text-white ${className}`}>
      <Lock className="w-2.5 h-2.5" />
      PRO
    </span>
  );
}
