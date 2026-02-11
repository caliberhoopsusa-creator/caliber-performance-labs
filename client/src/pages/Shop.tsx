import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Palette, 
  User, 
  Award, 
  Sparkles, 
  Users, 
  Coins, 
  Check,
  ShoppingBag,
  Lock,
  Search,
  Star,
  Zap,
  Crown,
  TrendingUp,
  Gift,
  ChevronLeft,
  ChevronRight,
  Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShopItem, UserInventory, CoinPackage } from "@shared/schema";
import { SHOP_CATEGORIES, RARITY_COLORS } from "@shared/schema";

const CATEGORY_ICONS: Record<string, typeof Palette> = {
  theme: Palette,
  profile_skin: User,
  badge_style: Award,
  effect: Sparkles,
  team_look: Users,
};

const CATEGORY_LABELS: Record<string, string> = {
  theme: "Themes",
  profile_skin: "Profile Skins",
  badge_style: "Badge Styles",
  effect: "Effects",
  team_look: "Team Looks",
};

type ShopItemWithOwnership = ShopItem & { owned: boolean; equipped: boolean };

export default function Shop() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { refreshTheme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>("theme");
  const [searchQuery, setSearchQuery] = useState("");
  const [rarityFilter, setRarityFilter] = useState<string>("all");
  const [featuredIndex, setFeaturedIndex] = useState(0);

  const { data: shopItems = [], isLoading: itemsLoading } = useQuery<ShopItem[]>({
    queryKey: ["/api/shop/items"],
  });

  const { data: inventory = [] } = useQuery<(UserInventory & { item: ShopItem })[]>({
    queryKey: ["/api/shop/inventory"],
    enabled: !!user,
  });

  const { data: coinsData } = useQuery<{ balance: number; transactions: any[] }>({
    queryKey: ["/api/shop/coins"],
    enabled: !!user,
  });

  const { data: coinPackages = [] } = useQuery<CoinPackage[]>({
    queryKey: ["/api/shop/coin-packages"],
  });

  const purchaseCoinsMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const res = await apiRequest("POST", "/api/stripe/checkout-coins", { packageId });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Purchase failed",
        description: error.message || "Could not start checkout.",
        variant: "destructive",
      });
    },
  });

  const purchaseMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const res = await apiRequest("POST", "/api/shop/purchase", { itemId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/coins"] });
      toast({
        title: "Purchase successful!",
        description: "The item has been added to your inventory.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Purchase failed",
        description: error.message || "Could not complete purchase.",
        variant: "destructive",
      });
    },
  });

  const equipMutation = useMutation({
    mutationFn: async ({ itemId, equipped, category }: { itemId: number; equipped: boolean; category: string }) => {
      const res = await apiRequest("POST", "/api/shop/equip", { itemId, equipped });
      return { json: await res.json(), category };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      if (data.category === 'theme') {
        refreshTheme();
      }
      
      toast({
        title: "Item equipped!",
        description: "Your customization has been applied.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to equip",
        description: error.message || "Could not equip item.",
        variant: "destructive",
      });
    },
  });

  const ownedItemIds = new Set(inventory.map((inv) => inv.itemId));
  const equippedItemIds = new Set(inventory.filter((inv) => inv.isEquipped).map((inv) => inv.itemId));

  const itemsWithOwnership: ShopItemWithOwnership[] = shopItems.map((item) => ({
    ...item,
    owned: ownedItemIds.has(item.id),
    equipped: equippedItemIds.has(item.id),
  }));

  const featuredItems = useMemo(() => 
    itemsWithOwnership.filter(item => item.rarity === "legendary" || item.rarity === "epic").slice(0, 4),
    [itemsWithOwnership]
  );

  const filteredItems = useMemo(() => {
    return itemsWithOwnership.filter((item) => {
      const matchesCategory = item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRarity = rarityFilter === "all" || item.rarity === rarityFilter;
      return matchesCategory && matchesSearch && matchesRarity;
    });
  }, [itemsWithOwnership, selectedCategory, searchQuery, rarityFilter]);

  const categoryItemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(SHOP_CATEGORIES).forEach(cat => {
      counts[cat] = itemsWithOwnership.filter(item => item.category === cat).length;
    });
    return counts;
  }, [itemsWithOwnership]);

  const coinBalance = coinsData?.balance ?? 0;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('coins_success') === 'true') {
      toast({
        title: "Coins Purchased!",
        description: "Your coins have been added to your balance.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/coins"] });
      window.history.replaceState({}, '', '/shop');
    }
    if (params.get('coins_canceled') === 'true') {
      toast({
        title: "Purchase Canceled",
        description: "Your coin purchase was canceled.",
        variant: "destructive",
      });
      window.history.replaceState({}, '', '/shop');
    }
  }, []);

  useEffect(() => {
    if (featuredItems.length > 1) {
      const interval = setInterval(() => {
        setFeaturedIndex((prev) => (prev + 1) % featuredItems.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [featuredItems.length]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="relative">
          <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full" />
          <Lock className="w-20 h-20 text-accent relative z-10 mb-6" />
        </div>
        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
          Sign in to access the Shop
        </h2>
        <p className="text-muted-foreground text-center max-w-md">
          Create an account to unlock exclusive themes, skins, and customizations for your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-6 space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-black/60 via-card to-black/60 border border-accent/20">
        <div className="absolute inset-0 opacity-30" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-500/10 blur-[80px] rounded-full" />
        
        <div className="relative z-10 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-accent" />
                <span className="text-xs uppercase tracking-wider text-accent font-semibold">Premium Store</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">
                <span className="bg-gradient-to-r from-white via-accent to-accent bg-clip-text text-transparent">
                  Caliber Shop
                </span>
              </h1>
              <p className="text-muted-foreground max-w-md">
                Unlock exclusive themes, profile skins, badges, and effects to customize your experience
              </p>
            </div>
            
            <div className="flex flex-col items-start md:items-end gap-3">
              <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-gradient-to-r from-yellow-500/15 to-yellow-600/5 border border-yellow-500/30 backdrop-blur-sm">
                <div className="relative">
                  <Coins className="w-8 h-8 text-yellow-500" style={{ filter: "drop-shadow(0 0 8px #FFD700)" }} />
                  <div className="absolute inset-0 animate-ping">
                    <Coins className="w-8 h-8 text-yellow-500/30" />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-yellow-500/80 uppercase tracking-wide">Your Balance</p>
                  <p className="text-2xl font-bold text-yellow-400" style={{ textShadow: "0 0 20px rgba(255,215,0,0.5)" }}>
                    {coinBalance.toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Earn coins by logging games or purchase below
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <Coins className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Buy Coins</h2>
              <p className="text-xs text-muted-foreground">Secure payment via Stripe</p>
            </div>
          </div>
          <Badge variant="outline" className="border-yellow-500/30 text-yellow-500">
            <Zap className="w-3 h-3 mr-1" />
            Instant Delivery
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {coinPackages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={cn(
                  "relative overflow-hidden transition-all duration-300 hover:scale-[1.03] cursor-pointer group",
                  "bg-gradient-to-br from-black/60 to-black/30",
                  pkg.popular 
                    ? "border-yellow-500/50 ring-1 ring-yellow-500/30" 
                    : "border-white/10 hover:border-yellow-500/30"
                )}
                style={pkg.popular ? { boxShadow: "0 0 30px rgba(234, 179, 8, 0.2)" } : {}}
                data-testid={`coin-package-${pkg.id}`}
                onClick={() => purchaseCoinsMutation.mutate(pkg.id)}
              >
                {pkg.popular && (
                  <div className="absolute top-0 left-0 right-0 flex justify-center">
                    <Badge 
                      className="rounded-t-none rounded-b-lg bg-gradient-to-r from-yellow-600 to-yellow-500 text-black text-[10px] font-bold px-3 py-1 shadow-lg"
                      style={{ boxShadow: "0 4px 20px rgba(234, 179, 8, 0.4)" }}
                    >
                      <Star className="w-3 h-3 mr-1" />
                      BEST VALUE
                    </Badge>
                  </div>
                )}
                
                <CardContent className={cn("p-5 space-y-4", pkg.popular && "pt-8")}>
                  <div className="flex justify-center">
                    <motion.div 
                      className={cn(
                        "w-16 h-16 rounded-xl flex items-center justify-center relative",
                        "bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/40"
                      )}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-xl group-hover:bg-yellow-500/30 transition-colors" />
                      <Coins 
                        className={cn(
                          "text-yellow-500 relative z-10",
                          pkg.id === "coins_100" && "w-7 h-7",
                          pkg.id === "coins_500" && "w-8 h-8",
                          pkg.id === "coins_1200" && "w-9 h-9",
                          pkg.id === "coins_3000" && "w-10 h-10"
                        )} 
                        style={{ filter: "drop-shadow(0 0 10px #FFD700)" }}
                      />
                    </motion.div>
                  </div>
                  
                  <div className="text-center space-y-1">
                    <h3 className="font-bold text-base">{pkg.name}</h3>
                    <div className="flex items-center justify-center gap-1.5">
                      <Coins className="w-5 h-5 text-yellow-500" style={{ filter: "drop-shadow(0 0 4px #FFD700)" }} />
                      <span className="text-2xl font-bold text-yellow-400" style={{ textShadow: "0 0 15px rgba(255,215,0,0.4)" }}>
                        {pkg.coins.toLocaleString()}
                      </span>
                    </div>
                    {pkg.id === "coins_1200" && (
                      <p className="text-[10px] text-green-400">+20% bonus coins</p>
                    )}
                    {pkg.id === "coins_3000" && (
                      <p className="text-[10px] text-green-400">+50% bonus coins</p>
                    )}
                  </div>
                  
                  <Button
                    className={cn(
                      "w-full font-bold transition-all",
                      pkg.popular
                        ? "bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-black shadow-lg shadow-yellow-500/25"
                        : "bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black"
                    )}
                    disabled={purchaseCoinsMutation.isPending}
                    data-testid={`btn-buy-coins-${pkg.id}`}
                  >
                    ${(pkg.priceInCents / 100).toFixed(2)}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {featuredItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <Crown className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Featured Items</h2>
                <p className="text-xs text-muted-foreground">Rare and legendary customizations</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 border-white/10"
                onClick={() => setFeaturedIndex((prev) => (prev - 1 + featuredItems.length) % featuredItems.length)}
                data-testid="btn-featured-prev"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 border-white/10"
                onClick={() => setFeaturedIndex((prev) => (prev + 1) % featuredItems.length)}
                data-testid="btn-featured-next"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-950/30 to-black/40 border border-purple-500/20 p-6">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full" />
            <AnimatePresence mode="wait">
              {featuredItems[featuredIndex] && (
                <motion.div
                  key={featuredItems[featuredIndex].id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                  className="relative z-10"
                >
                  <FeaturedItemCard
                    item={featuredItems[featuredIndex]}
                    coinBalance={coinBalance}
                    onPurchase={() => purchaseMutation.mutate(featuredItems[featuredIndex].id)}
                    onEquip={(equipped) => equipMutation.mutate({ 
                      itemId: featuredItems[featuredIndex].id, 
                      equipped, 
                      category: featuredItems[featuredIndex].category 
                    })}
                    isPurchasing={purchaseMutation.isPending}
                    isEquipping={equipMutation.isPending}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {featuredItems.map((_, idx) => (
                <button
                  key={idx}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    idx === featuredIndex ? "bg-purple-400 w-4" : "bg-white/20 hover:bg-white/40"
                  )}
                  onClick={() => setFeaturedIndex(idx)}
                  data-testid={`featured-dot-${idx}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
              <Package className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-bold">All Items</h2>
              <p className="text-xs text-muted-foreground">{itemsWithOwnership.length} items available</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-black/20 border-white/10 focus:border-accent/50"
              data-testid="input-shop-search"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", "common", "rare", "epic", "legendary"].map((rarity) => (
              <Button
                key={rarity}
                size="sm"
                variant={rarityFilter === rarity ? "default" : "outline"}
                onClick={() => setRarityFilter(rarity)}
                className={cn(
                  "capitalize",
                  rarityFilter === rarity && rarity !== "all" && getRarityButtonStyle(rarity)
                )}
                data-testid={`filter-rarity-${rarity}`}
              >
                {rarity === "all" ? "All Rarities" : rarity}
              </Button>
            ))}
          </div>
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="w-full h-auto p-1.5 bg-black/40 border border-white/10 rounded-xl grid grid-cols-5 gap-1">
            {Object.keys(SHOP_CATEGORIES).map((key) => {
              const Icon = CATEGORY_ICONS[key] || Palette;
              const count = categoryItemCounts[key] || 0;
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  className={cn(
                    "flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg transition-all",
                    "data-[state=active]:bg-gradient-to-br data-[state=active]:from-accent data-[state=active]:to-accent",
                    "data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-accent/20"
                  )}
                  data-testid={`tab-shop-${key}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[11px] font-medium hidden sm:block">{CATEGORY_LABELS[key]}</span>
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-white/10 hidden md:flex">
                    {count}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {SHOP_CATEGORIES[selectedCategory as keyof typeof SHOP_CATEGORIES]?.description}
              </p>
              <p className="text-xs text-muted-foreground">
                {filteredItems.length} items
              </p>
            </div>

            {itemsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Card key={i} className="animate-pulse bg-black/20 border-white/5">
                    <CardContent className="p-4">
                      <div className="aspect-square rounded-lg bg-white/5 mb-3" />
                      <div className="h-4 bg-white/5 rounded mb-2" />
                      <div className="h-3 bg-white/5 rounded w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <Card className="bg-black/20 border-white/5">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-muted-foreground/10 blur-2xl rounded-full" />
                    <ShoppingBag className="w-16 h-16 text-muted-foreground relative z-10" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">No items found</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-sm">
                    {searchQuery || rarityFilter !== "all" 
                      ? "Try adjusting your search or filters"
                      : `Check back soon for new ${CATEGORY_LABELS[selectedCategory]?.toLowerCase()}!`
                    }
                  </p>
                  {(searchQuery || rarityFilter !== "all") && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => { setSearchQuery(""); setRarityFilter("all"); }}
                      data-testid="btn-clear-filters"
                    >
                      Clear Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <motion.div 
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                initial="initial"
                animate="animate"
                variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
              >
                {filteredItems.map((item) => (
                  <ShopItemCard
                    key={item.id}
                    item={item}
                    coinBalance={coinBalance}
                    onPurchase={() => purchaseMutation.mutate(item.id)}
                    onEquip={(equipped) => equipMutation.mutate({ itemId: item.id, equipped, category: item.category })}
                    isPurchasing={purchaseMutation.isPending}
                    isEquipping={equipMutation.isPending}
                  />
                ))}
              </motion.div>
            )}
          </div>
        </Tabs>
      </div>

      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-card via-purple-950/20 to-card border border-accent/20 p-6">
        <div className="absolute inset-0 opacity-20" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-accent/20 to-purple-500/20 border border-white/10">
              <Gift className="w-8 h-8 text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Earn Free Coins</h3>
              <p className="text-sm text-muted-foreground">Log games and complete challenges to earn coins</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Bonus per game</p>
              <div className="flex items-center gap-1 justify-end">
                <Coins className="w-4 h-4 text-yellow-500" />
                <span className="font-bold text-yellow-400">+10</span>
              </div>
            </div>
            <Button variant="outline" className="border-accent/30 text-accent" data-testid="btn-start-earning">
              <TrendingUp className="w-4 h-4 mr-2" />
              Start Earning
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getRarityButtonStyle(rarity: string): string {
  switch (rarity) {
    case "common": return "bg-gray-600 hover:bg-gray-500";
    case "rare": return "bg-blue-600 hover:bg-blue-500";
    case "epic": return "bg-purple-600 hover:bg-purple-500";
    case "legendary": return "bg-yellow-600 hover:bg-yellow-500 text-black";
    default: return "";
  }
}

function FeaturedItemCard({
  item,
  coinBalance,
  onPurchase,
  onEquip,
  isPurchasing,
  isEquipping,
}: {
  item: ShopItemWithOwnership;
  coinBalance: number;
  onPurchase: () => void;
  onEquip: (equipped: boolean) => void;
  isPurchasing: boolean;
  isEquipping: boolean;
}) {
  const rarity = RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;
  const canAfford = coinBalance >= (item.coinPrice || 0);

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <div 
        className="w-32 h-32 md:w-40 md:h-40 rounded-2xl border-2 flex items-center justify-center shrink-0"
        style={{ 
          borderColor: rarity.color,
          boxShadow: `0 0 40px ${rarity.color}40`,
          background: `linear-gradient(135deg, ${rarity.color}20 0%, transparent 100%)`
        }}
      >
        <PreviewContent item={item} size="large" />
      </div>
      <div className="flex-1 text-center md:text-left space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <h3 className="text-2xl font-bold">{item.name}</h3>
          <Badge 
            className="w-fit mx-auto md:mx-0"
            style={{ backgroundColor: rarity.color, color: item.rarity === "legendary" ? "#000" : "#fff" }}
          >
            {rarity.name}
          </Badge>
        </div>
        <p className="text-muted-foreground">{item.description}</p>
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-center md:justify-start">
          {item.owned ? (
            <Button
              size="lg"
              variant={item.equipped ? "default" : "outline"}
              className={cn(item.equipped && "bg-accent ")}
              onClick={() => onEquip(!item.equipped)}
              disabled={isEquipping}
              data-testid={`btn-featured-equip-${item.id}`}
            >
              {item.equipped ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Equipped
                </>
              ) : (
                "Equip Now"
              )}
            </Button>
          ) : (
            <Button
              size="lg"
              className={cn(
                canAfford 
                  ? "bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black shadow-lg shadow-yellow-500/25"
                  : "bg-muted text-muted-foreground"
              )}
              onClick={onPurchase}
              disabled={!canAfford || isPurchasing}
              data-testid={`btn-featured-purchase-${item.id}`}
            >
              <Coins className="w-4 h-4 mr-2" style={{ filter: canAfford ? "drop-shadow(0 0 4px #FFD700)" : "none" }} />
              {item.coinPrice?.toLocaleString()} Coins
            </Button>
          )}
          {!item.owned && !canAfford && (
            <p className="text-sm text-red-400">Need {((item.coinPrice || 0) - coinBalance).toLocaleString()} more coins</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ShopItemCard({
  item,
  coinBalance,
  onPurchase,
  onEquip,
  isPurchasing,
  isEquipping,
}: {
  item: ShopItemWithOwnership;
  coinBalance: number;
  onPurchase: () => void;
  onEquip: (equipped: boolean) => void;
  isPurchasing: boolean;
  isEquipping: boolean;
}) {
  const rarity = RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;
  const canAfford = coinBalance >= (item.coinPrice || 0);

  return (
    <motion.div
      variants={{
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
      }}
    >
      <Card 
        className={cn(
          "relative overflow-hidden transition-all duration-300 hover:scale-[1.02] group",
          "bg-gradient-to-br from-black/60 to-black/30 border-white/10 hover:border-white/20",
          item.equipped && "ring-2 ring-accent ring-offset-2 ring-offset-background"
        )}
        style={{ boxShadow: rarity.glow }}
        data-testid={`shop-item-${item.id}`}
      >
        <div 
          className="absolute top-0 left-0 right-0 h-1 transition-all group-hover:h-1.5"
          style={{ backgroundColor: rarity.color }}
        />
        
        {item.owned && (
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-green-600/90 text-white text-[10px]">
              <Check className="w-3 h-3 mr-0.5" />
              Owned
            </Badge>
          </div>
        )}
        
        <CardContent className="p-4 space-y-3">
          <div 
            className="aspect-square rounded-xl border flex items-center justify-center overflow-hidden transition-transform group-hover:scale-[1.02]"
            style={getPreviewStyle(item)}
          >
            <PreviewContent item={item} size="normal" />
          </div>

          <div className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-sm leading-tight line-clamp-1">{item.name}</h3>
              <Badge 
                variant="outline" 
                className="text-[9px] shrink-0 px-1.5"
                style={{ borderColor: rarity.color, color: rarity.color }}
              >
                {rarity.name}
              </Badge>
            </div>
            {item.description && (
              <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-white/5">
            {item.owned ? (
              <Button
                size="sm"
                variant={item.equipped ? "default" : "outline"}
                className={cn(
                  "w-full",
                  item.equipped && "bg-accent "
                )}
                onClick={() => onEquip(!item.equipped)}
                disabled={isEquipping}
                data-testid={`btn-equip-${item.id}`}
              >
                {item.equipped ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Equipped
                  </>
                ) : (
                  "Equip"
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                className={cn(
                  "w-full transition-all",
                  canAfford 
                    ? "bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black shadow-md shadow-yellow-500/20"
                    : "bg-muted text-muted-foreground"
                )}
                onClick={onPurchase}
                disabled={!canAfford || isPurchasing}
                data-testid={`btn-purchase-${item.id}`}
              >
                <span 
                  className="relative mr-1.5"
                  style={{ filter: canAfford ? "drop-shadow(0 0 6px #FFD700) drop-shadow(0 0 12px #FFA500)" : "none" }}
                >
                  <Coins className="w-3.5 h-3.5" />
                </span>
                {item.coinPrice?.toLocaleString() ?? "Free"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

const PROFILE_SKIN_STYLES: Record<string, { background: string; borderColor: string }> = {
  "grid-pattern": {
    background: "linear-gradient(135deg, hsl(24, 95%, 53%)15 0%, hsl(24, 95%, 53%)08 50%, transparent 50%), repeating-linear-gradient(0deg, transparent, transparent 8px, hsl(24, 95%, 53%)20 8px, hsl(24, 95%, 53%)20 9px), repeating-linear-gradient(90deg, transparent, transparent 8px, hsl(24, 95%, 53%)20 8px, hsl(24, 95%, 53%)20 9px)",
    borderColor: "hsl(24, 95%, 53%)60",
  },
  "flame-burst": {
    background: "linear-gradient(135deg, #ff6b3530 0%, #ff220030 25%, #ff6b3520 50%, #ff9a0015 100%)",
    borderColor: "#ff6b3570",
  },
  "aurora-glow": {
    background: "linear-gradient(135deg, #00ff8840 0%, hsl(24, 95%, 53%)35 33%, #9b59b630 66%, #00ff8820 100%)",
    borderColor: "#00ff8860",
  },
  "galaxy-swirl": {
    background: "radial-gradient(ellipse at 30% 20%, #9b59b640 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, #3498db35 0%, transparent 50%), linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)",
    borderColor: "#9b59b670",
  },
};

const BADGE_STYLE_PREVIEW: Record<string, { ringColor: string; glowColor: string }> = {
  "gold-frame": { ringColor: "#FFD700", glowColor: "0 0 20px #FFD70090" },
  "diamond-sparkle": { ringColor: "#E0E7FF", glowColor: "0 0 25px #E0E7FF90, 0 0 50px #A5B4FC50" },
};

const EFFECT_PREVIEW: Record<string, { gradient: string }> = {
  "glow-trail": { gradient: "radial-gradient(circle at 50% 50%, hsl(24, 95%, 53%)50 0%, transparent 70%)" },
  "particle-burst": { gradient: "radial-gradient(circle at 30% 30%, #FFD70050 0%, transparent 30%), radial-gradient(circle at 70% 60%, #FF6B3550 0%, transparent 25%), radial-gradient(circle at 50% 80%, hsl(24, 95%, 53%)50 0%, transparent 35%)" },
};

function getPreviewStyle(item: ShopItem) {
  if (item.category === "theme" && item.type === "accent_color") {
    return {
      background: `linear-gradient(135deg, ${item.value}50 0%, ${item.value}15 100%)`,
      borderColor: `${item.value}60`,
      boxShadow: `0 0 30px ${item.value}40`,
    };
  }
  if (item.category === "profile_skin" && item.value && PROFILE_SKIN_STYLES[item.value]) {
    const style = PROFILE_SKIN_STYLES[item.value];
    return {
      background: style.background,
      borderColor: style.borderColor,
      boxShadow: `0 0 20px ${style.borderColor}`,
    };
  }
  if (item.category === "effect" && item.value && EFFECT_PREVIEW[item.value]) {
    return {
      background: EFFECT_PREVIEW[item.value].gradient,
      borderColor: "rgba(255,255,255,0.15)",
    };
  }
  return { borderColor: "rgba(255,255,255,0.1)" };
}

function PreviewContent({ item, size = "normal" }: { item: ShopItem; size?: "normal" | "large" }) {
  const iconSize = size === "large" ? "w-10 h-10" : "w-8 h-8";
  const circleSize = size === "large" ? "w-16 h-16" : "w-12 h-12";
  const cardSize = size === "large" ? "w-24 h-28" : "w-16 h-20";

  if (item.category === "theme" && item.type === "accent_color") {
    return (
      <div 
        className={cn(circleSize, "rounded-full shadow-lg")}
        style={{ 
          backgroundColor: item.value,
          boxShadow: `0 0 40px ${item.value}90`,
        }}
      />
    );
  }
  
  if (item.category === "profile_skin" && item.value && PROFILE_SKIN_STYLES[item.value]) {
    return (
      <div className={cn(cardSize, "rounded-lg border-2 border-white/20 flex items-center justify-center")} style={getPreviewStyle(item)}>
        <User className={cn(iconSize, "text-white/70")} />
      </div>
    );
  }
  
  if (item.category === "badge_style" && item.value && BADGE_STYLE_PREVIEW[item.value]) {
    const style = BADGE_STYLE_PREVIEW[item.value];
    return (
      <div 
        className={cn(size === "large" ? "w-20 h-20" : "w-14 h-14", "rounded-full flex items-center justify-center")}
        style={{ 
          border: `3px solid ${style.ringColor}`,
          boxShadow: style.glowColor,
          background: "linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 100%)",
        }}
      >
        <Award className={iconSize} style={{ color: style.ringColor, filter: `drop-shadow(0 0 8px ${style.ringColor})` }} />
      </div>
    );
  }
  
  if (item.category === "effect" && item.value && EFFECT_PREVIEW[item.value]) {
    return (
      <div className={cn("relative flex items-center justify-center", size === "large" ? "w-20 h-20" : "w-16 h-16")}>
        <div 
          className="absolute inset-0 rounded-full animate-pulse"
          style={{ background: EFFECT_PREVIEW[item.value].gradient }}
        />
        <Sparkles className={cn(iconSize, "text-accent relative z-10")} style={{ filter: "drop-shadow(0 0 8px hsl(24, 95%, 53%))" }} />
      </div>
    );
  }
  
  if (item.previewUrl) {
    return <img src={item.previewUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" />;
  }
  
  return <Sparkles className={cn(iconSize, "text-muted-foreground")} />;
}
