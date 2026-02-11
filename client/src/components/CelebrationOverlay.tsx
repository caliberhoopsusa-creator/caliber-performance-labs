import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Flame, Crown, Sparkles, Zap, Award, Target, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

type CelebrationType = 
  | "tier_promotion" 
  | "badge_unlock" 
  | "streak_milestone" 
  | "xp_gain" 
  | "grade_a" 
  | "challenge_complete"
  | "goal_complete";

interface CelebrationConfig {
  title: string;
  subtitle?: string;
  icon: typeof Trophy;
  color: string;
  bgColor: string;
  particleCount: number;
  duration: number;
}

const CELEBRATION_CONFIGS: Record<CelebrationType, CelebrationConfig> = {
  tier_promotion: {
    title: "TIER UP!",
    icon: Crown,
    color: "text-yellow-400",
    bgColor: "from-yellow-500/30 to-accent/20",
    particleCount: 50,
    duration: 4000,
  },
  badge_unlock: {
    title: "BADGE UNLOCKED!",
    icon: Award,
    color: "text-accent",
    bgColor: "from-accent/30 to-blue-500/20",
    particleCount: 40,
    duration: 3500,
  },
  streak_milestone: {
    title: "STREAK BONUS!",
    icon: Flame,
    color: "text-accent",
    bgColor: "from-accent/30 to-red-500/20",
    particleCount: 35,
    duration: 3000,
  },
  xp_gain: {
    title: "XP EARNED!",
    icon: Zap,
    color: "text-accent",
    bgColor: "from-accent/30 to-accent/20",
    particleCount: 20,
    duration: 2000,
  },
  grade_a: {
    title: "ELITE PERFORMANCE!",
    icon: Star,
    color: "text-green-400",
    bgColor: "from-green-500/30 to-emerald-500/20",
    particleCount: 45,
    duration: 3500,
  },
  challenge_complete: {
    title: "CHALLENGE COMPLETE!",
    icon: Target,
    color: "text-purple-400",
    bgColor: "from-purple-500/30 to-pink-500/20",
    particleCount: 40,
    duration: 3500,
  },
  goal_complete: {
    title: "GOAL ACHIEVED!",
    icon: Medal,
    color: "text-emerald-400",
    bgColor: "from-emerald-500/30 to-green-500/20",
    particleCount: 35,
    duration: 3000,
  },
};

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  rotation: number;
  type: "circle" | "star" | "square";
}

const PARTICLE_COLORS = [
  "hsl(24, 95%, 53%)", // accent (orange)
  "#FFD700", // gold
  "#FF6B6B", // coral
  "#4ECDC4", // teal
  "#A855F7", // purple
  "#F59E0B", // amber
  "#10B981", // emerald
  "#EC4899", // pink
];

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10 - Math.random() * 20,
    size: 4 + Math.random() * 8,
    color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    rotation: Math.random() * 360,
    type: ["circle", "star", "square"][Math.floor(Math.random() * 3)] as "circle" | "star" | "square",
  }));
}

interface CelebrationOverlayProps {
  type: CelebrationType;
  isVisible: boolean;
  onComplete?: () => void;
  subtitle?: string;
  value?: string | number;
}

export function CelebrationOverlay({ 
  type, 
  isVisible, 
  onComplete,
  subtitle,
  value 
}: CelebrationOverlayProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const config = CELEBRATION_CONFIGS[type];
  const Icon = config.icon;

  useEffect(() => {
    if (isVisible) {
      setParticles(generateParticles(config.particleCount));
      
      const timer = setTimeout(() => {
        onComplete?.();
      }, config.duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, config.particleCount, config.duration, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 80, y: -20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 80 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="fixed top-4 right-4 z-[100] pointer-events-none"
          data-testid="celebration-overlay"
        >
          <div
            className={cn(
              "relative px-4 py-3 rounded-xl backdrop-blur-xl border border-border",
              "bg-gradient-to-br",
              config.bgColor,
              "shadow-lg max-w-[280px]"
            )}
          >
            <motion.div
              className={cn(
                "absolute inset-0 rounded-xl opacity-40 blur-lg -z-10",
                "bg-gradient-to-br",
                config.bgColor
              )}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.4, 0.6, 0.4],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <div className="flex items-center gap-3">
              <motion.div
                animate={{
                  scale: [1, 1.15, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 0.6,
                  repeat: 2,
                  ease: "easeInOut",
                }}
                className={cn(
                  "w-10 h-10 shrink-0 rounded-full flex items-center justify-center",
                  "bg-gradient-to-br from-muted to-muted/50 border",
                  config.color.replace("text-", "border-")
                )}
              >
                <Icon className={cn("w-5 h-5", config.color)} />
              </motion.div>

              <div className="flex flex-col min-w-0">
                <motion.span
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className={cn(
                    "text-sm font-display font-bold tracking-wider leading-tight",
                    config.color
                  )}
                >
                  {config.title}
                </motion.span>

                {value && (
                  <motion.span
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="text-2xl font-display font-bold text-foreground leading-tight"
                  >
                    {value}
                  </motion.span>
                )}

                {(subtitle || config.subtitle) && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-xs text-muted-foreground truncate"
                  >
                    {subtitle || config.subtitle}
                  </motion.span>
                )}
              </div>
            </div>
          </div>

          {particles.slice(0, 12).map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                x: 0,
                y: 0,
                scale: 0,
                opacity: 1,
              }}
              animate={{
                x: (Math.random() - 0.5) * 120,
                y: (Math.random() - 0.5) * 80,
                scale: [0, 1, 0],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 1.2,
                delay: particle.delay * 0.5,
                ease: "easeOut",
              }}
              className="absolute top-1/2 left-1/2"
              style={{
                width: particle.size * 0.6,
                height: particle.size * 0.6,
              }}
            >
              {particle.type === "circle" ? (
                <div
                  className="w-full h-full rounded-full"
                  style={{ backgroundColor: particle.color }}
                />
              ) : particle.type === "star" ? (
                <Sparkles
                  className="w-full h-full"
                  style={{ color: particle.color }}
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{ backgroundColor: particle.color }}
                />
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for managing celebrations
interface CelebrationState {
  isVisible: boolean;
  type: CelebrationType;
  subtitle?: string;
  value?: string | number;
}

export function useCelebration() {
  const [celebration, setCelebration] = useState<CelebrationState | null>(null);

  const triggerCelebration = useCallback((
    type: CelebrationType,
    options?: { subtitle?: string; value?: string | number }
  ) => {
    setCelebration({
      isVisible: true,
      type,
      subtitle: options?.subtitle,
      value: options?.value,
    });
  }, []);

  const dismissCelebration = useCallback(() => {
    setCelebration(null);
  }, []);

  return {
    celebration,
    triggerCelebration,
    dismissCelebration,
    CelebrationComponent: celebration ? (
      <CelebrationOverlay
        type={celebration.type}
        isVisible={celebration.isVisible}
        subtitle={celebration.subtitle}
        value={celebration.value}
        onComplete={dismissCelebration}
      />
    ) : null,
  };
}

// Provider for global celebrations
import { createContext, useContext, type ReactNode } from "react";

interface CelebrationContextType {
  triggerCelebration: (type: CelebrationType, options?: { subtitle?: string; value?: string | number }) => void;
}

const CelebrationContext = createContext<CelebrationContextType | null>(null);

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const { triggerCelebration, CelebrationComponent } = useCelebration();

  return (
    <CelebrationContext.Provider value={{ triggerCelebration }}>
      {children}
      {CelebrationComponent}
    </CelebrationContext.Provider>
  );
}

export function useCelebrationContext() {
  const context = useContext(CelebrationContext);
  if (!context) {
    throw new Error("useCelebrationContext must be used within a CelebrationProvider");
  }
  return context;
}
