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
  beforePseudo?: string;
  afterPseudo?: string;
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

// LEGENDARY & EPIC Profile Skins - Made to impress
const PROFILE_SKIN_STYLES: Record<string, ProfileSkinStyle> = {
  "neon-grid": {
    background: `
      linear-gradient(135deg, rgba(0, 212, 255, 0.15) 0%, rgba(0, 212, 255, 0.05) 100%),
      repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(0, 212, 255, 0.3) 20px, rgba(0, 212, 255, 0.3) 21px),
      repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(0, 212, 255, 0.3) 20px, rgba(0, 212, 255, 0.3) 21px),
      linear-gradient(180deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 30, 60, 0.9) 100%)
    `,
    borderColor: "#00D4FF",
    boxShadow: "0 0 40px rgba(0, 212, 255, 0.5), inset 0 0 60px rgba(0, 212, 255, 0.1), 0 0 100px rgba(0, 212, 255, 0.3)",
    animation: "neonPulse 3s ease-in-out infinite",
  },
  "flame-burst": {
    background: `
      radial-gradient(ellipse at 20% 80%, rgba(255, 100, 0, 0.6) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 20%, rgba(255, 50, 0, 0.5) 0%, transparent 40%),
      radial-gradient(ellipse at 50% 50%, rgba(255, 150, 0, 0.4) 0%, transparent 60%),
      linear-gradient(180deg, rgba(20, 0, 0, 0.95) 0%, rgba(60, 20, 0, 0.9) 50%, rgba(20, 0, 0, 0.95) 100%)
    `,
    borderColor: "#FF6B35",
    boxShadow: "0 0 50px rgba(255, 100, 0, 0.6), 0 0 100px rgba(255, 50, 0, 0.4), inset 0 0 40px rgba(255, 100, 0, 0.2)",
    animation: "flamePulse 2s ease-in-out infinite alternate",
  },
  "aurora-glow": {
    background: `
      linear-gradient(45deg, 
        rgba(0, 255, 136, 0.3) 0%, 
        rgba(0, 212, 255, 0.3) 25%, 
        rgba(155, 89, 182, 0.3) 50%, 
        rgba(0, 255, 200, 0.3) 75%, 
        rgba(0, 255, 136, 0.3) 100%
      ),
      linear-gradient(180deg, rgba(0, 20, 30, 0.95) 0%, rgba(0, 40, 60, 0.9) 100%)
    `,
    borderColor: "#00FF88",
    boxShadow: "0 0 60px rgba(0, 255, 136, 0.5), 0 0 120px rgba(0, 212, 255, 0.3), 0 0 180px rgba(155, 89, 182, 0.2)",
    animation: "auroraShift 8s ease-in-out infinite",
  },
  "galaxy-swirl": {
    background: `
      radial-gradient(ellipse at 20% 30%, rgba(155, 89, 182, 0.7) 0%, transparent 35%),
      radial-gradient(ellipse at 80% 70%, rgba(52, 152, 219, 0.6) 0%, transparent 40%),
      radial-gradient(ellipse at 60% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 20%),
      radial-gradient(ellipse at 30% 80%, rgba(255, 100, 200, 0.4) 0%, transparent 30%),
      radial-gradient(circle at 50% 50%, rgba(0, 0, 50, 0.8) 0%, rgba(10, 10, 30, 1) 100%)
    `,
    borderColor: "#9B59B6",
    boxShadow: "0 0 80px rgba(155, 89, 182, 0.6), 0 0 150px rgba(52, 152, 219, 0.4), inset 0 0 100px rgba(155, 89, 182, 0.2)",
    animation: "galaxyRotate 20s linear infinite",
  },
};

// Premium Badge Styles with animations
const BADGE_STYLES: Record<string, BadgeStyleConfig> = {
  "gold-frame": { 
    ringColor: "#FFD700",
    glowColor: "0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 180, 0, 0.5), 0 0 90px rgba(255, 150, 0, 0.3)",
    animation: "goldShimmer 2s ease-in-out infinite",
    gradient: "linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)",
  },
  "diamond-sparkle": { 
    ringColor: "#E0E7FF",
    glowColor: "0 0 40px rgba(224, 231, 255, 0.9), 0 0 80px rgba(165, 180, 252, 0.6), 0 0 120px rgba(139, 92, 246, 0.4)",
    animation: "diamondSparkle 1.5s ease-in-out infinite",
    gradient: "linear-gradient(135deg, #E0E7FF 0%, #A5B4FC 25%, #FFFFFF 50%, #C4B5FD 75%, #E0E7FF 100%)",
  },
};

// Spectacular Effects with multiple animated layers
const EFFECTS: Record<string, EffectConfig> = {
  "glow-trail": { 
    layers: [
      {
        gradient: "radial-gradient(circle at 50% 50%, rgba(0, 212, 255, 0.8) 0%, rgba(0, 212, 255, 0.4) 30%, transparent 70%)",
        animation: "glowPulse 2s ease-in-out infinite",
        size: "400px",
        opacity: 0.8,
      },
      {
        gradient: "radial-gradient(circle at 30% 30%, rgba(0, 255, 200, 0.6) 0%, transparent 50%)",
        animation: "glowOrbit 4s linear infinite",
        size: "200px",
        opacity: 0.6,
      },
      {
        gradient: "radial-gradient(circle at 70% 70%, rgba(100, 200, 255, 0.5) 0%, transparent 50%)",
        animation: "glowOrbit 4s linear infinite reverse",
        size: "180px",
        opacity: 0.5,
      },
      {
        gradient: "conic-gradient(from 0deg, transparent 0%, rgba(0, 212, 255, 0.3) 25%, transparent 50%, rgba(0, 212, 255, 0.3) 75%, transparent 100%)",
        animation: "spinSlow 6s linear infinite",
        size: "500px",
        opacity: 0.4,
        blur: "20px",
      },
    ],
  },
  "particle-burst": { 
    layers: [
      {
        gradient: "radial-gradient(circle at 50% 50%, rgba(255, 215, 0, 0.7) 0%, rgba(255, 150, 0, 0.3) 40%, transparent 70%)",
        animation: "burstPulse 1.5s ease-in-out infinite",
        size: "350px",
        opacity: 0.9,
      },
      {
        gradient: "radial-gradient(circle at 25% 25%, rgba(255, 100, 50, 0.8) 0%, transparent 40%)",
        animation: "particleFloat1 3s ease-in-out infinite",
        size: "120px",
        opacity: 0.7,
      },
      {
        gradient: "radial-gradient(circle at 75% 30%, rgba(255, 200, 50, 0.7) 0%, transparent 35%)",
        animation: "particleFloat2 2.5s ease-in-out infinite 0.5s",
        size: "100px",
        opacity: 0.6,
      },
      {
        gradient: "radial-gradient(circle at 60% 80%, rgba(255, 50, 50, 0.6) 0%, transparent 45%)",
        animation: "particleFloat3 3.5s ease-in-out infinite 1s",
        size: "140px",
        opacity: 0.5,
      },
      {
        gradient: "radial-gradient(circle at 20% 70%, rgba(0, 212, 255, 0.5) 0%, transparent 40%)",
        animation: "particleFloat1 2s ease-in-out infinite 0.3s",
        size: "90px",
        opacity: 0.5,
      },
      {
        gradient: "conic-gradient(from 45deg, transparent 0%, rgba(255, 200, 0, 0.4) 10%, transparent 20%, rgba(255, 100, 0, 0.3) 30%, transparent 40%, rgba(255, 50, 0, 0.4) 50%, transparent 60%, rgba(255, 200, 0, 0.3) 70%, transparent 80%, rgba(255, 150, 0, 0.4) 90%, transparent 100%)",
        animation: "spinFast 4s linear infinite",
        size: "600px",
        opacity: 0.3,
        blur: "30px",
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
