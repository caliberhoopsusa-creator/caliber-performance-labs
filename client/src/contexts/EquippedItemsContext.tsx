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
  boxShadow: string;
  animation?: string;
}

interface BadgeStyleConfig {
  ringColor: string;
  glowColor: string;
  animation?: string;
  gradient?: string;
}

interface EffectConfig {
  layers: EffectLayer[];
}

interface EffectLayer {
  gradient: string;
  animation: string;
  size?: string;
  position?: string;
  opacity?: number;
  blur?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PREMIUM PROFILE SKINS - Elegant, subtle animations
// ═══════════════════════════════════════════════════════════════════════════════
const PROFILE_SKIN_STYLES: Record<string, ProfileSkinStyle> = {
  "grid-pattern": {
    background: `
      linear-gradient(135deg, rgba(234, 88, 12, 0.08) 0%, rgba(0, 100, 150, 0.05) 100%),
      repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(234, 88, 12, 0.15) 40px, rgba(234, 88, 12, 0.15) 41px),
      repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(234, 88, 12, 0.15) 40px, rgba(234, 88, 12, 0.15) 41px),
      linear-gradient(180deg, rgba(0, 10, 20, 0.95) 0%, rgba(0, 20, 35, 0.9) 100%)
    `,
    borderColor: "rgba(234, 88, 12, 0.5)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    animation: "subtleGlow 4s ease-in-out infinite",
  },
  "flame-burst": {
    background: `
      radial-gradient(ellipse at 50% 100%, rgba(255, 120, 0, 0.25) 0%, transparent 50%),
      radial-gradient(ellipse at 30% 90%, rgba(255, 80, 0, 0.15) 0%, transparent 40%),
      radial-gradient(ellipse at 70% 95%, rgba(255, 100, 0, 0.2) 0%, transparent 35%),
      linear-gradient(180deg, rgba(15, 5, 0, 0.95) 0%, rgba(30, 10, 0, 0.9) 100%)
    `,
    borderColor: "rgba(255, 120, 0, 0.4)",
    boxShadow: "0 0 25px rgba(255, 100, 0, 0.2), 0 5px 30px rgba(255, 80, 0, 0.15)",
    animation: "gentleWarmth 3s ease-in-out infinite",
  },
  "aurora-glow": {
    background: `
      linear-gradient(135deg, 
        rgba(234, 88, 12, 0.08) 0%, 
        rgba(168, 85, 247, 0.06) 50%,
        rgba(234, 179, 8, 0.08) 100%
      ),
      linear-gradient(180deg, rgba(10, 12, 16, 0.95) 0%, rgba(15, 17, 22, 0.9) 100%)
    `,
    borderColor: "rgba(234, 88, 12, 0.3)",
    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.3)",
    animation: "auroraShiftSubtle 10s ease-in-out infinite",
  },
  "galaxy-swirl": {
    background: `
      radial-gradient(ellipse at 30% 30%, rgba(138, 43, 226, 0.2) 0%, transparent 40%),
      radial-gradient(ellipse at 70% 70%, rgba(52, 152, 219, 0.15) 0%, transparent 45%),
      radial-gradient(ellipse at 50% 50%, rgba(100, 50, 150, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, rgba(10, 5, 25, 0.95) 0%, rgba(5, 5, 15, 1) 100%)
    `,
    borderColor: "rgba(138, 43, 226, 0.4)",
    boxShadow: "0 0 40px rgba(138, 43, 226, 0.2), 0 0 70px rgba(52, 152, 219, 0.1)",
    animation: "galaxyBreath 8s ease-in-out infinite",
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PREMIUM BADGE STYLES - Subtle glow effects
// ═══════════════════════════════════════════════════════════════════════════════
const BADGE_STYLES: Record<string, BadgeStyleConfig> = {
  "gold-frame": { 
    ringColor: "rgba(255, 200, 0, 0.7)",
    glowColor: "0 0 15px rgba(255, 200, 0, 0.4), 0 0 30px rgba(255, 180, 0, 0.2)",
    animation: "goldGlowSubtle 3s ease-in-out infinite",
    gradient: "linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 180, 0, 0.1) 100%)",
  },
  "diamond-sparkle": { 
    ringColor: "rgba(200, 210, 255, 0.8)",
    glowColor: "0 0 20px rgba(200, 210, 255, 0.4), 0 0 40px rgba(150, 160, 255, 0.2)",
    animation: "diamondGlowSubtle 4s ease-in-out infinite",
    gradient: "linear-gradient(135deg, rgba(220, 230, 255, 0.15) 0%, rgba(180, 190, 255, 0.1) 100%)",
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PREMIUM EFFECTS - Elegant ambient layers
// ═══════════════════════════════════════════════════════════════════════════════
const EFFECTS: Record<string, EffectConfig> = {
  "glow-trail": { 
    layers: [
      // Soft ambient glow
      {
        gradient: "radial-gradient(circle at 50% 50%, rgba(234, 88, 12, 0.25) 0%, rgba(200, 100, 20, 0.1) 40%, transparent 70%)",
        animation: "ambientPulse 4s ease-in-out infinite",
        size: "350px",
        opacity: 0.6,
      },
      // Gentle outer halo
      {
        gradient: "radial-gradient(circle at 50% 50%, transparent 30%, rgba(0, 180, 255, 0.08) 50%, transparent 70%)",
        animation: "haloBreath 5s ease-in-out infinite",
        size: "450px",
        opacity: 0.5,
        blur: "20px",
      },
      // Subtle rotating accent
      {
        gradient: "conic-gradient(from 0deg at 50% 50%, transparent 0%, rgba(234, 88, 12, 0.1) 25%, transparent 50%, rgba(234, 88, 12, 0.06) 75%, transparent 100%)",
        animation: "gentleSpin 20s linear infinite",
        size: "400px",
        opacity: 0.4,
        blur: "15px",
      },
    ],
  },
  "particle-burst": { 
    layers: [
      // Warm center glow
      {
        gradient: "radial-gradient(circle at 50% 50%, rgba(255, 180, 50, 0.3) 0%, rgba(255, 120, 0, 0.15) 35%, transparent 60%)",
        animation: "warmPulse 3s ease-in-out infinite",
        size: "300px",
        opacity: 0.7,
      },
      // Soft outer warmth
      {
        gradient: "radial-gradient(circle at 50% 50%, transparent 25%, rgba(255, 150, 50, 0.1) 45%, transparent 65%)",
        animation: "warmthExpand 4s ease-in-out infinite",
        size: "400px",
        opacity: 0.5,
        blur: "25px",
      },
      // Gentle accent ring
      {
        gradient: "conic-gradient(from 45deg at 50% 50%, transparent 0%, rgba(255, 180, 80, 0.08) 20%, transparent 40%, rgba(255, 140, 50, 0.06) 60%, transparent 80%)",
        animation: "gentleSpin 25s linear infinite reverse",
        size: "450px",
        opacity: 0.4,
        blur: "20px",
      },
    ],
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
