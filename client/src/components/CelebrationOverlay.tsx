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
    bgColor: "from-yellow-500/30 to-orange-500/20",
    particleCount: 50,
    duration: 4000,
  },
  badge_unlock: {
    title: "BADGE UNLOCKED!",
    icon: Award,
    color: "text-cyan-400",
    bgColor: "from-cyan-500/30 to-blue-500/20",
    particleCount: 40,
    duration: 3500,
  },
  streak_milestone: {
    title: "STREAK BONUS!",
    icon: Flame,
    color: "text-orange-400",
    bgColor: "from-orange-500/30 to-red-500/20",
    particleCount: 35,
    duration: 3000,
  },
  xp_gain: {
    title: "XP EARNED!",
    icon: Zap,
    color: "text-primary",
    bgColor: "from-primary/30 to-cyan-500/20",
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
  "#00D4FF", // cyan
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] pointer-events-none overflow-hidden"
          data-testid="celebration-overlay"
        >
          {/* Particles */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                x: `${particle.x}vw`,
                y: `${particle.y}vh`,
                rotate: 0,
                scale: 0,
              }}
              animate={{
                y: "120vh",
                rotate: particle.rotation + 720,
                scale: [0, 1, 1, 0.5],
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                ease: "easeOut",
              }}
              className="absolute"
              style={{
                width: particle.size,
                height: particle.size,
              }}
            >
              {particle.type === "circle" && (
                <div
                  className="w-full h-full rounded-full"
                  style={{ backgroundColor: particle.color }}
                />
              )}
              {particle.type === "star" && (
                <Sparkles
                  className="w-full h-full"
                  style={{ color: particle.color }}
                />
              )}
              {particle.type === "square" && (
                <div
                  className="w-full h-full"
                  style={{ backgroundColor: particle.color }}
                />
              )}
            </motion.div>
          ))}

          {/* Central celebration card */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
              }}
              className={cn(
                "relative p-8 rounded-2xl backdrop-blur-xl border border-white/20",
                "bg-gradient-to-br",
                config.bgColor,
                "shadow-2xl"
              )}
            >
              {/* Glow effect */}
              <motion.div
                className={cn(
                  "absolute inset-0 rounded-2xl opacity-50 blur-xl -z-10",
                  "bg-gradient-to-br",
                  config.bgColor
                )}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              <div className="flex flex-col items-center gap-4 text-center">
                {/* Icon with animation */}
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: 3,
                    ease: "easeInOut",
                  }}
                  className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center",
                    "bg-gradient-to-br from-white/10 to-white/5 border-2",
                    config.color.replace("text-", "border-")
                  )}
                >
                  <Icon className={cn("w-10 h-10", config.color)} />
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className={cn(
                    "text-3xl font-display font-bold tracking-wider",
                    config.color
                  )}
                >
                  {config.title}
                </motion.h2>

                {/* Value (XP amount, tier name, etc) */}
                {value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="text-5xl font-display font-bold text-white"
                  >
                    {value}
                  </motion.div>
                )}

                {/* Subtitle */}
                {(subtitle || config.subtitle) && (
                  <motion.p
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm text-white/70 max-w-[200px]"
                  >
                    {subtitle || config.subtitle}
                  </motion.p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Edge glow effects */}
          <motion.div
            className={cn(
              "absolute top-0 left-0 right-0 h-32",
              "bg-gradient-to-b from-primary/20 to-transparent"
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5 }}
          />
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
