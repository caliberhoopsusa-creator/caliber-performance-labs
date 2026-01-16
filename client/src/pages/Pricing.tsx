import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Check, Zap, Video, FileText, Crown, Settings, Loader2 } from "lucide-react";

interface Price {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: { interval: string; interval_count: number } | null;
}

interface Product {
  id: string;
  name: string;
  description: string;
  metadata: Record<string, string>;
  prices: Price[];
}

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

type BillingPeriod = "monthly" | "yearly";

export default function Pricing() {
  const { toast } = useToast();
  const { user } = useAuth();
  const search = useSearch();
  const [, setLocation] = useLocation();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");

  const { data: productsData, isLoading: productsLoading } = useQuery<{ products: Product[] }>({
    queryKey: ["/api/stripe/products"],
  });

  const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery<{ subscription: Subscription | null }>({
    queryKey: ["/api/stripe/subscription"],
    enabled: !!user,
  });

  const checkoutMutation = useMutation({
    mutationFn: async ({ priceId, mode }: { priceId: string; mode: "subscription" | "payment" }) => {
      const res = await apiRequest("POST", "/api/stripe/checkout", { priceId, mode });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Checkout Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe/portal", {});
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Billing Portal Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get("success") === "true") {
      toast({
        title: "Payment Successful",
        description: "Thank you for your purchase! Your account has been upgraded.",
      });
      setLocation("/pricing", { replace: true });
    } else if (params.get("canceled") === "true") {
      toast({
        title: "Payment Canceled",
        description: "Your payment was canceled. No charges were made.",
        variant: "destructive",
      });
      setLocation("/pricing", { replace: true });
    }
  }, [search, toast, setLocation]);

  const products = productsData?.products || [];
  const subscription = subscriptionData?.subscription;

  const subscriptionPlans = products.filter((p) => 
    p.name.toLowerCase().includes("pro") || 
    p.metadata?.type === "subscription"
  );

  const oneTimePurchases = products.filter((p) => 
    p.name.toLowerCase().includes("credit") || 
    p.name.toLowerCase().includes("bundle") ||
    p.metadata?.type === "one_time"
  );

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const getRelevantPrice = (prices: Price[], period: BillingPeriod): Price | undefined => {
    if (period === "yearly") {
      return prices.find((p) => p.recurring?.interval === "year") || 
             prices.find((p) => p.recurring?.interval === "month");
    }
    return prices.find((p) => p.recurring?.interval === "month") ||
           prices.find((p) => !p.recurring);
  };

  const hasYearlyOption = (prices: Price[]) => {
    return prices.some((p) => p.recurring?.interval === "year");
  };

  const getFeatures = (productName: string): string[] => {
    const name = productName.toLowerCase();
    if (name.includes("caliber pro") || name.includes("player")) {
      return [
        "Unlimited game analysis",
        "Advanced player statistics",
        "Video breakdown reports",
        "Custom skill badges",
        "Priority support",
      ];
    }
    if (name.includes("coach pro") || name.includes("coach")) {
      return [
        "Everything in Caliber Pro",
        "Team management dashboard",
        "Lineup analysis tools",
        "Opponent scouting reports",
        "Practice planning",
        "Player alerts & insights",
      ];
    }
    if (name.includes("video")) {
      return ["AI-powered video analysis", "Shot chart generation", "Performance breakdown"];
    }
    if (name.includes("report") || name.includes("bundle")) {
      return ["Detailed player report cards", "Season statistics summary", "Improvement tracking"];
    }
    return ["Access to premium features"];
  };

  const isSubscribed = subscription && subscription.status === "active";

  if (productsLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <Skeleton className="h-10 w-64 mx-auto" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-8 w-32 mb-4" />
              <Skeleton className="h-12 w-24 mb-4" />
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold font-display tracking-tight" data-testid="text-pricing-title">
          Upgrade Your Game
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Choose the plan that fits your goals. Level up with premium analytics and insights.
        </p>

        {isSubscribed && (
          <div className="flex items-center justify-center gap-4">
            <Badge variant="secondary" className="text-sm px-4 py-1" data-testid="badge-subscription-status">
              <Crown className="w-4 h-4 mr-2" />
              Active Subscription
            </Badge>
            <Button 
              variant="outline" 
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
              data-testid="button-manage-billing"
            >
              {portalMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Settings className="w-4 h-4 mr-2" />
              )}
              Manage Billing
            </Button>
          </div>
        )}
      </div>

      {subscriptionPlans.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-2xl font-bold" data-testid="text-subscription-plans-title">
              Subscription Plans
            </h2>
            {subscriptionPlans.some((p) => hasYearlyOption(p.prices)) && (
              <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                <Button
                  size="sm"
                  variant={billingPeriod === "monthly" ? "default" : "ghost"}
                  onClick={() => setBillingPeriod("monthly")}
                  data-testid="button-billing-monthly"
                >
                  Monthly
                </Button>
                <Button
                  size="sm"
                  variant={billingPeriod === "yearly" ? "default" : "ghost"}
                  onClick={() => setBillingPeriod("yearly")}
                  data-testid="button-billing-yearly"
                >
                  Yearly
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Save 20%
                  </Badge>
                </Button>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {subscriptionPlans.map((product) => {
              const price = getRelevantPrice(product.prices, billingPeriod);
              const features = getFeatures(product.name);
              const isPopular = product.name.toLowerCase().includes("coach");

              return (
                <Card 
                  key={product.id} 
                  className={`relative ${isPopular ? "border-primary shadow-lg shadow-primary/10" : ""}`}
                  data-testid={`card-plan-${product.id}`}
                >
                  {isPopular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-primary" />
                      {product.name}
                    </CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {price ? (
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold">
                            {formatPrice(price.unit_amount, price.currency)}
                          </span>
                          {price.recurring && (
                            <span className="text-muted-foreground">
                              /{price.recurring.interval}
                            </span>
                          )}
                        </div>
                        {billingPeriod === "yearly" && price.recurring?.interval === "year" && (
                          <p className="text-sm text-muted-foreground">
                            Billed annually ({formatPrice(price.unit_amount / 12, price.currency)}/mo)
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Contact for pricing</p>
                    )}

                    <ul className="space-y-3">
                      {features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      size="lg"
                      variant={isPopular ? "default" : "outline"}
                      disabled={!price || !user || checkoutMutation.isPending || !!isSubscribed}
                      onClick={() => price && checkoutMutation.mutate({ priceId: price.id, mode: "subscription" })}
                      data-testid={`button-subscribe-${product.id}`}
                    >
                      {checkoutMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isSubscribed ? (
                        "Already Subscribed"
                      ) : !user ? (
                        "Sign in to Subscribe"
                      ) : (
                        "Subscribe"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {oneTimePurchases.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-bold" data-testid="text-one-time-purchases-title">
            One-Time Purchases
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {oneTimePurchases.map((product) => {
              const price = product.prices.find((p) => !p.recurring) || product.prices[0];
              const features = getFeatures(product.name);
              const icon = product.name.toLowerCase().includes("video") ? Video : FileText;
              const IconComponent = icon;

              return (
                <Card key={product.id} data-testid={`card-purchase-${product.id}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconComponent className="w-5 h-5 text-primary" />
                      {product.name}
                    </CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {price ? (
                      <div className="text-3xl font-bold">
                        {formatPrice(price.unit_amount, price.currency)}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Contact for pricing</p>
                    )}

                    <ul className="space-y-2">
                      {features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      variant="outline"
                      disabled={!price || !user || checkoutMutation.isPending}
                      onClick={() => price && checkoutMutation.mutate({ priceId: price.id, mode: "payment" })}
                      data-testid={`button-buy-${product.id}`}
                    >
                      {checkoutMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : !user ? (
                        "Sign in to Buy"
                      ) : (
                        "Buy Now"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {products.length === 0 && !productsLoading && (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground">
              No products available at the moment. Check back soon!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
