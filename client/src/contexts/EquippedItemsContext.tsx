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

// ═══════════════════════════════════════════════════════════════════════════════
// LEGENDARY PROFILE SKINS - Absolutely jaw-dropping animated backgrounds
// ═══════════════════════════════════════════════════════════════════════════════
const PROFILE_SKIN_STYLES: Record<string, ProfileSkinStyle> = {
  "neon-grid": {
    // CYBERPUNK HACKER AESTHETIC - Scanning lasers, pulsing nodes, digital rain
    background: `
      linear-gradient(90deg, transparent 0%, rgba(0, 212, 255, 0.03) 50%, transparent 100%),
      linear-gradient(135deg, rgba(0, 212, 255, 0.2) 0%, rgba(0, 50, 100, 0.1) 50%, rgba(0, 212, 255, 0.15) 100%),
      repeating-linear-gradient(0deg, transparent, transparent 30px, rgba(0, 212, 255, 0.4) 30px, rgba(0, 212, 255, 0.4) 31px),
      repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(0, 212, 255, 0.4) 30px, rgba(0, 212, 255, 0.4) 31px),
      radial-gradient(circle at 10% 20%, rgba(0, 255, 255, 0.3) 0%, transparent 25%),
      radial-gradient(circle at 90% 80%, rgba(0, 150, 255, 0.25) 0%, transparent 30%),
      radial-gradient(circle at 50% 50%, rgba(0, 100, 150, 0.2) 0%, transparent 50%),
      linear-gradient(180deg, rgba(0, 5, 15, 0.98) 0%, rgba(0, 20, 40, 0.95) 50%, rgba(0, 10, 25, 0.98) 100%)
    `,
    borderColor: "#00D4FF",
    boxShadow: `
      0 0 60px rgba(0, 212, 255, 0.7),
      0 0 120px rgba(0, 212, 255, 0.4),
      0 0 180px rgba(0, 212, 255, 0.2),
      inset 0 0 100px rgba(0, 212, 255, 0.15),
      inset 0 1px 0 rgba(0, 212, 255, 0.5)
    `,
    animation: "neonPulse 2s ease-in-out infinite, scanLine 4s linear infinite",
  },
  "flame-burst": {
    // INFERNO MODE - Layered flames, ember particles, heat shimmer
    background: `
      radial-gradient(ellipse at 50% 120%, rgba(255, 200, 0, 0.9) 0%, rgba(255, 100, 0, 0.6) 30%, transparent 60%),
      radial-gradient(ellipse at 20% 100%, rgba(255, 50, 0, 0.8) 0%, transparent 45%),
      radial-gradient(ellipse at 80% 100%, rgba(255, 80, 0, 0.7) 0%, transparent 40%),
      radial-gradient(ellipse at 35% 90%, rgba(255, 150, 0, 0.6) 0%, transparent 35%),
      radial-gradient(ellipse at 65% 95%, rgba(255, 120, 0, 0.5) 0%, transparent 30%),
      radial-gradient(circle at 15% 50%, rgba(255, 50, 0, 0.4) 0%, transparent 25%),
      radial-gradient(circle at 85% 40%, rgba(255, 80, 0, 0.35) 0%, transparent 20%),
      radial-gradient(circle at 50% 30%, rgba(255, 200, 100, 0.2) 0%, transparent 40%),
      linear-gradient(180deg, rgba(10, 0, 0, 0.98) 0%, rgba(40, 10, 0, 0.95) 40%, rgba(80, 20, 0, 0.9) 100%)
    `,
    borderColor: "#FF6B00",
    boxShadow: `
      0 0 80px rgba(255, 100, 0, 0.8),
      0 0 150px rgba(255, 50, 0, 0.5),
      0 0 220px rgba(255, 150, 0, 0.3),
      0 10px 60px rgba(255, 100, 0, 0.6),
      inset 0 -50px 80px rgba(255, 100, 0, 0.3),
      inset 0 0 60px rgba(255, 50, 0, 0.2)
    `,
    animation: "flamePulse 1.5s ease-in-out infinite alternate, flameFlicker 0.15s ease-in-out infinite",
  },
  "aurora-glow": {
    // NORTHERN LIGHTS - Flowing color ribbons, ethereal waves
    background: `
      linear-gradient(135deg, 
        rgba(0, 255, 136, 0.4) 0%, 
        rgba(0, 212, 255, 0.35) 20%, 
        rgba(138, 43, 226, 0.4) 40%,
        rgba(0, 255, 200, 0.35) 60%,
        rgba(75, 0, 130, 0.3) 80%,
        rgba(0, 255, 136, 0.4) 100%
      ),
      linear-gradient(45deg,
        transparent 0%,
        rgba(0, 255, 180, 0.2) 25%,
        transparent 50%,
        rgba(138, 43, 226, 0.15) 75%,
        transparent 100%
      ),
      radial-gradient(ellipse at 30% 20%, rgba(0, 255, 200, 0.5) 0%, transparent 40%),
      radial-gradient(ellipse at 70% 80%, rgba(138, 43, 226, 0.4) 0%, transparent 45%),
      radial-gradient(ellipse at 50% 50%, rgba(0, 180, 255, 0.3) 0%, transparent 50%),
      linear-gradient(180deg, rgba(0, 10, 20, 0.97) 0%, rgba(0, 30, 50, 0.95) 50%, rgba(10, 0, 30, 0.97) 100%)
    `,
    borderColor: "#00FF88",
    boxShadow: `
      0 0 80px rgba(0, 255, 136, 0.6),
      0 0 150px rgba(0, 212, 255, 0.4),
      0 0 220px rgba(138, 43, 226, 0.3),
      0 0 300px rgba(0, 255, 200, 0.2),
      inset 0 0 100px rgba(0, 255, 136, 0.15),
      inset 0 0 60px rgba(138, 43, 226, 0.1)
    `,
    animation: "auroraShift 6s ease-in-out infinite, auroraWave 8s ease-in-out infinite",
  },
  "galaxy-swirl": {
    // COSMIC VOID - Rotating spiral arms, twinkling stars, nebula clouds
    background: `
      radial-gradient(circle at 50% 50%, transparent 0%, rgba(0, 0, 0, 0.3) 100%),
      radial-gradient(ellipse at 30% 30%, rgba(138, 43, 226, 0.8) 0%, transparent 30%),
      radial-gradient(ellipse at 70% 70%, rgba(52, 152, 219, 0.7) 0%, transparent 35%),
      radial-gradient(ellipse at 20% 70%, rgba(255, 100, 200, 0.6) 0%, transparent 25%),
      radial-gradient(ellipse at 80% 30%, rgba(100, 200, 255, 0.5) 0%, transparent 28%),
      radial-gradient(ellipse at 50% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 15%),
      radial-gradient(ellipse at 40% 60%, rgba(200, 100, 255, 0.4) 0%, transparent 20%),
      radial-gradient(circle at 10% 10%, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 2%),
      radial-gradient(circle at 25% 45%, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0) 1.5%),
      radial-gradient(circle at 60% 15%, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0) 1%),
      radial-gradient(circle at 85% 55%, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 1.2%),
      radial-gradient(circle at 45% 85%, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0) 0.8%),
      radial-gradient(circle at 75% 90%, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 1%),
      radial-gradient(circle at 50% 50%, rgba(20, 0, 40, 0.9) 0%, rgba(5, 5, 20, 1) 100%)
    `,
    borderColor: "#9B59B6",
    boxShadow: `
      0 0 100px rgba(138, 43, 226, 0.7),
      0 0 200px rgba(52, 152, 219, 0.5),
      0 0 300px rgba(255, 100, 200, 0.3),
      inset 0 0 150px rgba(138, 43, 226, 0.25),
      inset 0 0 80px rgba(52, 152, 219, 0.15)
    `,
    animation: "galaxyRotate 30s linear infinite, starTwinkle 3s ease-in-out infinite, nebulaBreath 8s ease-in-out infinite",
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// LEGENDARY BADGE STYLES - Make that tier badge SHINE
// ═══════════════════════════════════════════════════════════════════════════════
const BADGE_STYLES: Record<string, BadgeStyleConfig> = {
  "gold-frame": { 
    // MOLTEN GOLD - Liquid metal shine, pulsing warmth
    ringColor: "#FFD700",
    glowColor: `
      0 0 20px rgba(255, 215, 0, 1),
      0 0 40px rgba(255, 180, 0, 0.8),
      0 0 60px rgba(255, 150, 0, 0.6),
      0 0 80px rgba(255, 120, 0, 0.4),
      0 0 100px rgba(255, 100, 0, 0.2),
      inset 0 0 20px rgba(255, 215, 0, 0.5)
    `,
    animation: "goldShimmer 2s ease-in-out infinite, goldPulse 3s ease-in-out infinite",
    gradient: `linear-gradient(
      135deg, 
      #FFD700 0%, 
      #FFF8DC 15%,
      #FFD700 30%, 
      #DAA520 50%, 
      #FFD700 70%,
      #FFF8DC 85%,
      #FFD700 100%
    )`,
  },
  "diamond-sparkle": { 
    // PRISMATIC BRILLIANCE - Rainbow refractions, crystalline flashes
    ringColor: "#FFFFFF",
    glowColor: `
      0 0 25px rgba(255, 255, 255, 1),
      0 0 50px rgba(200, 200, 255, 0.9),
      0 0 75px rgba(150, 150, 255, 0.7),
      0 0 100px rgba(139, 92, 246, 0.5),
      0 0 125px rgba(100, 100, 255, 0.3),
      inset 0 0 25px rgba(255, 255, 255, 0.6)
    `,
    animation: "diamondSparkle 1s ease-in-out infinite, prismShift 4s linear infinite, crystalFlash 2s ease-in-out infinite",
    gradient: `linear-gradient(
      135deg, 
      #FFFFFF 0%,
      #E0E7FF 10%,
      #FF9BE0 20%,
      #A5B4FC 30%,
      #FFFFFF 40%,
      #9BFFFF 50%,
      #C4B5FD 60%,
      #FFFF9B 70%,
      #E0E7FF 80%,
      #FF9BFF 90%,
      #FFFFFF 100%
    )`,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// LEGENDARY EFFECTS - Particle systems that demand attention
// ═══════════════════════════════════════════════════════════════════════════════
const EFFECTS: Record<string, EffectConfig> = {
  "glow-trail": { 
    // ENERGY VORTEX - Orbiting light orbs, plasma trails, power core
    layers: [
      // Central power core - intense pulsing
      {
        gradient: "radial-gradient(circle at 50% 50%, rgba(0, 255, 255, 1) 0%, rgba(0, 212, 255, 0.8) 20%, rgba(0, 150, 255, 0.4) 40%, transparent 60%)",
        animation: "corePulse 1.5s ease-in-out infinite",
        size: "300px",
        opacity: 1,
      },
      // Inner energy ring
      {
        gradient: "conic-gradient(from 0deg at 50% 50%, rgba(0, 255, 255, 0.8) 0%, transparent 10%, rgba(0, 212, 255, 0.6) 20%, transparent 30%, rgba(0, 255, 200, 0.7) 40%, transparent 50%, rgba(0, 212, 255, 0.5) 60%, transparent 70%, rgba(0, 255, 255, 0.6) 80%, transparent 90%, rgba(0, 212, 255, 0.8) 100%)",
        animation: "spinMedium 3s linear infinite",
        size: "450px",
        opacity: 0.9,
      },
      // Orbiting energy orb 1
      {
        gradient: "radial-gradient(circle at 50% 0%, rgba(0, 255, 255, 0.9) 0%, rgba(0, 212, 255, 0.5) 30%, transparent 60%)",
        animation: "orbitFast 2s linear infinite",
        size: "400px",
        opacity: 0.8,
      },
      // Orbiting energy orb 2
      {
        gradient: "radial-gradient(circle at 50% 0%, rgba(100, 255, 255, 0.8) 0%, rgba(0, 200, 255, 0.4) 30%, transparent 60%)",
        animation: "orbitFast 2s linear infinite 0.66s",
        size: "400px",
        opacity: 0.7,
      },
      // Orbiting energy orb 3
      {
        gradient: "radial-gradient(circle at 50% 0%, rgba(0, 255, 200, 0.85) 0%, rgba(0, 180, 255, 0.45) 30%, transparent 60%)",
        animation: "orbitFast 2s linear infinite 1.33s",
        size: "400px",
        opacity: 0.75,
      },
      // Outer plasma field
      {
        gradient: "conic-gradient(from 180deg at 50% 50%, transparent 0%, rgba(0, 212, 255, 0.3) 15%, transparent 30%, rgba(0, 255, 200, 0.25) 45%, transparent 60%, rgba(0, 212, 255, 0.35) 75%, transparent 90%)",
        animation: "spinSlow 8s linear infinite reverse",
        size: "600px",
        opacity: 0.6,
        blur: "15px",
      },
      // Energy waves emanating outward
      {
        gradient: "radial-gradient(circle at 50% 50%, transparent 30%, rgba(0, 212, 255, 0.3) 50%, transparent 70%)",
        animation: "waveExpand 2s ease-out infinite",
        size: "700px",
        opacity: 0.5,
        blur: "10px",
      },
      // Ambient glow field
      {
        gradient: "radial-gradient(ellipse at 50% 50%, rgba(0, 212, 255, 0.4) 0%, rgba(0, 100, 150, 0.2) 40%, transparent 70%)",
        animation: "glowPulse 3s ease-in-out infinite",
        size: "800px",
        opacity: 0.4,
        blur: "40px",
      },
    ],
  },
  "particle-burst": { 
    // SUPERNOVA EXPLOSION - Particle shower, fire ring, energy burst
    layers: [
      // Explosive core
      {
        gradient: "radial-gradient(circle at 50% 50%, rgba(255, 255, 200, 1) 0%, rgba(255, 200, 0, 0.9) 15%, rgba(255, 100, 0, 0.6) 35%, transparent 55%)",
        animation: "supernovaPulse 1s ease-in-out infinite",
        size: "350px",
        opacity: 1,
      },
      // Inner fire ring
      {
        gradient: "conic-gradient(from 0deg at 50% 50%, rgba(255, 100, 0, 0.9) 0%, rgba(255, 200, 0, 0.7) 10%, rgba(255, 50, 0, 0.8) 20%, rgba(255, 150, 0, 0.6) 30%, rgba(255, 80, 0, 0.9) 40%, rgba(255, 200, 0, 0.5) 50%, rgba(255, 100, 0, 0.8) 60%, rgba(255, 180, 0, 0.7) 70%, rgba(255, 50, 0, 0.6) 80%, rgba(255, 150, 0, 0.8) 90%, rgba(255, 100, 0, 0.9) 100%)",
        animation: "spinFast 2s linear infinite",
        size: "500px",
        opacity: 0.9,
      },
      // Particle spray 1 - gold
      {
        gradient: "radial-gradient(circle at 50% 10%, rgba(255, 215, 0, 1) 0%, rgba(255, 180, 0, 0.6) 20%, transparent 40%)",
        animation: "particleSpray1 1.5s ease-out infinite",
        size: "150px",
        opacity: 0.95,
      },
      // Particle spray 2 - orange
      {
        gradient: "radial-gradient(circle at 50% 10%, rgba(255, 100, 0, 0.95) 0%, rgba(255, 50, 0, 0.5) 25%, transparent 45%)",
        animation: "particleSpray2 1.5s ease-out infinite 0.2s",
        size: "130px",
        opacity: 0.9,
      },
      // Particle spray 3 - red
      {
        gradient: "radial-gradient(circle at 50% 10%, rgba(255, 50, 50, 0.9) 0%, rgba(200, 0, 0, 0.4) 25%, transparent 45%)",
        animation: "particleSpray3 1.5s ease-out infinite 0.4s",
        size: "120px",
        opacity: 0.85,
      },
      // Particle spray 4 - cyan accent
      {
        gradient: "radial-gradient(circle at 50% 10%, rgba(0, 212, 255, 0.85) 0%, rgba(0, 150, 255, 0.4) 20%, transparent 40%)",
        animation: "particleSpray4 1.5s ease-out infinite 0.6s",
        size: "110px",
        opacity: 0.8,
      },
      // Particle spray 5 - white hot
      {
        gradient: "radial-gradient(circle at 50% 10%, rgba(255, 255, 255, 0.9) 0%, rgba(255, 200, 150, 0.5) 15%, transparent 35%)",
        animation: "particleSpray5 1.5s ease-out infinite 0.8s",
        size: "100px",
        opacity: 0.85,
      },
      // Outer fire wheel
      {
        gradient: "conic-gradient(from 90deg at 50% 50%, transparent 0%, rgba(255, 100, 0, 0.5) 8%, transparent 16%, rgba(255, 50, 0, 0.4) 24%, transparent 32%, rgba(255, 150, 0, 0.45) 40%, transparent 48%, rgba(255, 80, 0, 0.5) 56%, transparent 64%, rgba(255, 200, 0, 0.4) 72%, transparent 80%, rgba(255, 100, 0, 0.5) 88%, transparent 96%)",
        animation: "spinMedium 5s linear infinite reverse",
        size: "700px",
        opacity: 0.7,
        blur: "20px",
      },
      // Shockwave rings
      {
        gradient: "radial-gradient(circle at 50% 50%, transparent 40%, rgba(255, 150, 0, 0.4) 50%, transparent 60%)",
        animation: "shockwave 1.5s ease-out infinite",
        size: "800px",
        opacity: 0.6,
        blur: "5px",
      },
      // Ambient heat glow
      {
        gradient: "radial-gradient(ellipse at 50% 50%, rgba(255, 100, 0, 0.5) 0%, rgba(255, 50, 0, 0.3) 30%, transparent 60%)",
        animation: "heatGlow 2s ease-in-out infinite",
        size: "900px",
        opacity: 0.5,
        blur: "50px",
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
