import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

interface Subscription {
  id: string;
  status: string;
  current_period_end: number;
  items?: {
    data: Array<{
      price: {
        product: string;
      };
    }>;
  };
}

interface SubscriptionData {
  subscription: Subscription | null;
  isOwner?: boolean;
}

export type SubscriptionTier = "free" | "pro" | "coach_pro";

export function useSubscription() {
  const { user, isAuthenticated } = useAuth();

  const { data, isLoading } = useQuery<SubscriptionData>({
    queryKey: ["/api/stripe/subscription"],
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const subscription = data?.subscription;
  const isOwner = data?.isOwner ?? false;
  const isActive = subscription?.status === "active" || subscription?.status === "trialing" || isOwner;
  
  // Determine the subscription tier based on user role and subscription status
  const getTier = (): SubscriptionTier => {
    // App owner gets full access to all features
    if (isOwner) return "coach_pro";
    
    // No subscription = free tier
    if (!isActive) return "free";
    
    // If user is a coach with active subscription, they have coach_pro tier
    // which gives them access to both pro and coach pro features
    if (user?.role === 'coach') {
      return "coach_pro";
    }
    
    // Non-coach users with active subscription get pro tier
    // which gives them access to pro features only
    if (subscription) {
      return "pro";
    }
    
    return "free";
  };

  const tier = getTier();

  return {
    subscription,
    isLoading,
    isActive,
    tier,
    isPro: tier === "pro" || tier === "coach_pro",
    isCoachPro: tier === "coach_pro",
    isFree: tier === "free",
    // Helper to check if a feature is accessible
    hasAccess: (requiredTier: SubscriptionTier) => {
      if (requiredTier === "free") return true;
      if (requiredTier === "pro") return tier === "pro" || tier === "coach_pro";
      if (requiredTier === "coach_pro") return tier === "coach_pro";
      return false;
    },
  };
}
