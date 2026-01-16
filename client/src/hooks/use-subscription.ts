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
  
  // Determine the subscription tier based on the product
  const getTier = (): SubscriptionTier => {
    // App owner gets full access
    if (isOwner) return "coach_pro";
    
    if (!subscription || !isActive) return "free";
    
    // Check product metadata or name to determine tier
    // For now, any active subscription = pro, coach_pro determined by product name
    const productId = subscription.items?.data?.[0]?.price?.product;
    if (productId) {
      // Check if it's a coach subscription based on product metadata
      // This will be updated when we have actual product IDs
      return "pro";
    }
    
    return isActive ? "pro" : "free";
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
