import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import { 
  Palette, 
  User, 
  Award, 
  Sparkles, 
  Users, 
  Coins, 
  Check,
  ShoppingBag,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShopItem, UserInventory } from "@shared/schema";
import { SHOP_CATEGORIES, RARITY_COLORS } from "@shared/schema";

const CATEGORY_ICONS: Record<string, typeof Palette> = {
  theme: Palette,
  profile_skin: User,
  badge_style: Award,
  effect: Sparkles,
  team_look: Users,
};

type ShopItemWithOwnership = ShopItem & { owned: boolean; equipped: boolean };

export default function Shop() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { refreshTheme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>("theme");

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

  const filteredItems = itemsWithOwnership.filter(
    (item) => item.category === selectedCategory
  );

  const coinBalance = coinsData?.balance ?? 0;

  const categories = Object.entries(SHOP_CATEGORIES);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  };

  const staggerContainer = {
    animate: { transition: { staggerChildren: 0.05 } },
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <Lock className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Sign in to access the Shop</h2>
        <p className="text-muted-foreground text-center">
          Create an account to purchase themes and customize your experience.
        </p>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6 pb-24 md:pb-6">
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        variants={fadeIn}
        initial="initial"
        animate="animate"
      >
        <div className="space-y-1">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent">
            Shop
          </h1>
          <p className="text-sm text-muted-foreground">
            Customize your Caliber experience
          </p>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20">
          <Coins className="w-5 h-5 text-yellow-500" />
          <span className="font-bold text-yellow-400">{coinBalance.toLocaleString()}</span>
          <span className="text-xs text-muted-foreground">coins</span>
        </div>
      </motion.div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="w-full grid grid-cols-5 gap-1 h-auto p-1 bg-black/30 border border-cyan-500/10">
          {categories.map(([key, cat]) => {
            const Icon = CATEGORY_ICONS[key] || Palette;
            return (
              <TabsTrigger
                key={key}
                value={key}
                className="flex flex-col items-center gap-1 py-2 px-1 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
                data-testid={`tab-shop-${key}`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] hidden sm:block">{cat.name}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="mt-4">
          <p className="text-sm text-muted-foreground mb-4">
            {SHOP_CATEGORIES[selectedCategory as keyof typeof SHOP_CATEGORIES]?.description}
          </p>

          {itemsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse bg-black/20">
                  <CardContent className="p-4 h-48" />
                </Card>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <Card className="bg-black/20 border-cyan-500/10">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ShoppingBag className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-1">No items yet</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Check back soon for new {SHOP_CATEGORIES[selectedCategory as keyof typeof SHOP_CATEGORIES]?.name.toLowerCase()}!
                </p>
              </CardContent>
            </Card>
          ) : (
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
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

  const getPreviewStyle = () => {
    if (item.category === "theme" && item.type === "accent_color") {
      return {
        background: `linear-gradient(135deg, ${item.value}40 0%, ${item.value}10 100%)`,
        borderColor: `${item.value}50`,
        boxShadow: `0 0 20px ${item.value}30`,
      };
    }
    return {};
  };

  return (
    <motion.div
      variants={{
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
      }}
    >
      <Card 
        className={cn(
          "relative overflow-hidden transition-all duration-300 hover:scale-[1.02]",
          "bg-gradient-to-br from-black/40 to-black/20 border-white/10",
          item.equipped && "ring-2 ring-cyan-500 ring-offset-2 ring-offset-background"
        )}
        style={{ boxShadow: rarity.glow }}
        data-testid={`shop-item-${item.id}`}
      >
        <div 
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: rarity.color }}
        />
        
        <CardContent className="p-4 space-y-3">
          <div 
            className="aspect-square rounded-lg border flex items-center justify-center"
            style={getPreviewStyle()}
          >
            {item.category === "theme" && item.type === "accent_color" ? (
              <div 
                className="w-12 h-12 rounded-full shadow-lg"
                style={{ 
                  backgroundColor: item.value,
                  boxShadow: `0 0 30px ${item.value}80`,
                }}
              />
            ) : item.previewUrl ? (
              <img src={item.previewUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <Sparkles className="w-8 h-8 text-muted-foreground" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm leading-tight">{item.name}</h3>
              <Badge 
                variant="outline" 
                className="text-[10px] shrink-0"
                style={{ borderColor: rarity.color, color: rarity.color }}
              >
                {rarity.name}
              </Badge>
            </div>
            {item.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
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
                  item.equipped && "bg-cyan-600 hover:bg-cyan-700"
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
                  "w-full",
                  canAfford 
                    ? "bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black"
                    : "bg-muted text-muted-foreground"
                )}
                onClick={onPurchase}
                disabled={!canAfford || isPurchasing}
                data-testid={`btn-purchase-${item.id}`}
              >
                <Coins className="w-3 h-3 mr-1" />
                {item.coinPrice?.toLocaleString() ?? "Free"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
