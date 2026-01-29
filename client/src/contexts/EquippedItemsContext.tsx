import { createContext, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

interface EquippedItem {
  id: number;
  itemId: number;
  isEquipped: boolean;
  item: {
    id: number;
    name: string;
    category: string;
    type: string;
    value: string;
    rarity: string;
  };
}

interface ProfileSkinStyle {
  background: string;
  borderColor: string;
  boxShadow?: string;
}

interface BadgeStyleConfig {
  ringColor: string;
  glowColor: string;
}

interface EffectConfig {
  gradient: string;
  animation?: string;
}

const PROFILE_SKIN_STYLES: Record<string, ProfileSkinStyle> = {
  "neon-grid": {
    background: "linear-gradient(135deg, #00D4FF15 0%, #00D4FF08 50%, transparent 50%), repeating-linear-gradient(0deg, transparent, transparent 8px, #00D4FF20 8px, #00D4FF20 9px), repeating-linear-gradient(90deg, transparent, transparent 8px, #00D4FF20 8px, #00D4FF20 9px)",
    borderColor: "#00D4FF60",
    boxShadow: "0 0 30px #00D4FF30",
  },
  "flame-burst": {
    background: "linear-gradient(135deg, #ff6b3530 0%, #ff220030 25%, #ff6b3520 50%, #ff9a0015 100%)",
    borderColor: "#ff6b3570",
    boxShadow: "0 0 30px #ff6b3540",
  },
  "aurora-glow": {
    background: "linear-gradient(135deg, #00ff8840 0%, #00D4FF35 33%, #9b59b630 66%, #00ff8820 100%)",
    borderColor: "#00ff8860",
    boxShadow: "0 0 30px #00ff8840",
  },
  "galaxy-swirl": {
    background: "radial-gradient(ellipse at 30% 20%, #9b59b640 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, #3498db35 0%, transparent 50%), linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)",
    borderColor: "#9b59b670",
    boxShadow: "0 0 30px #9b59b650",
  },
};

const BADGE_STYLES: Record<string, BadgeStyleConfig> = {
  "gold-frame": { 
    ringColor: "#FFD700", 
    glowColor: "0 0 20px #FFD70090" 
  },
  "diamond-sparkle": { 
    ringColor: "#E0E7FF", 
    glowColor: "0 0 25px #E0E7FF90, 0 0 50px #A5B4FC50" 
  },
};

const EFFECTS: Record<string, EffectConfig> = {
  "glow-trail": { 
    gradient: "radial-gradient(circle at 50% 50%, #00D4FF50 0%, transparent 70%)",
    animation: "pulse 2s ease-in-out infinite",
  },
  "particle-burst": { 
    gradient: "radial-gradient(circle at 30% 30%, #FFD70050 0%, transparent 30%), radial-gradient(circle at 70% 60%, #FF6B3550 0%, transparent 25%), radial-gradient(circle at 50% 80%, #00D4FF50 0%, transparent 35%)",
    animation: "pulse 3s ease-in-out infinite",
  },
};

interface EquippedItemsContextValue {
  equippedTheme: EquippedItem | null;
  equippedProfileSkin: EquippedItem | null;
  equippedBadgeStyle: EquippedItem | null;
  equippedEffect: EquippedItem | null;
  isLoading: boolean;
  getProfileSkinStyle: () => ProfileSkinStyle | null;
  getBadgeStyle: () => BadgeStyleConfig | null;
  getEffectConfig: () => EffectConfig | null;
}

const EquippedItemsContext = createContext<EquippedItemsContextValue>({
  equippedTheme: null,
  equippedProfileSkin: null,
  equippedBadgeStyle: null,
  equippedEffect: null,
  isLoading: false,
  getProfileSkinStyle: () => null,
  getBadgeStyle: () => null,
  getEffectConfig: () => null,
});

export function EquippedItemsProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();

  const { data: inventory = [], isLoading } = useQuery<EquippedItem[]>({
    queryKey: ["/api/shop/inventory"],
    enabled: !!user && !authLoading,
    staleTime: 1000 * 60 * 5,
  });

  const equippedItems = useMemo(() => {
    const equipped = inventory.filter(inv => inv.isEquipped);
    return {
      theme: equipped.find(e => e.item.category === 'theme') || null,
      profileSkin: equipped.find(e => e.item.category === 'profile_skin') || null,
      badgeStyle: equipped.find(e => e.item.category === 'badge_style') || null,
      effect: equipped.find(e => e.item.category === 'effect') || null,
    };
  }, [inventory]);

  const getProfileSkinStyle = (): ProfileSkinStyle | null => {
    if (!equippedItems.profileSkin) return null;
    const value = equippedItems.profileSkin.item.value;
    return PROFILE_SKIN_STYLES[value] || null;
  };

  const getBadgeStyle = (): BadgeStyleConfig | null => {
    if (!equippedItems.badgeStyle) return null;
    const value = equippedItems.badgeStyle.item.value;
    return BADGE_STYLES[value] || null;
  };

  const getEffectConfig = (): EffectConfig | null => {
    if (!equippedItems.effect) return null;
    const value = equippedItems.effect.item.value;
    return EFFECTS[value] || null;
  };

  return (
    <EquippedItemsContext.Provider
      value={{
        equippedTheme: equippedItems.theme,
        equippedProfileSkin: equippedItems.profileSkin,
        equippedBadgeStyle: equippedItems.badgeStyle,
        equippedEffect: equippedItems.effect,
        isLoading: isLoading || authLoading,
        getProfileSkinStyle,
        getBadgeStyle,
        getEffectConfig,
      }}
    >
      {children}
    </EquippedItemsContext.Provider>
  );
}

export function useEquippedItems() {
  return useContext(EquippedItemsContext);
}
