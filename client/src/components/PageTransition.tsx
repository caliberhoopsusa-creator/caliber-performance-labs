import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useLocation } from "wouter";

interface PageTransitionProps {
  children: React.ReactNode;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
    scale: 0.99,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: {
      duration: 0.15,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};


export function PageTransition({ children }: PageTransitionProps) {
  const [location] = useLocation();
  const prefersReducedMotion = useReducedMotion();

  // Use simplified variants when user prefers reduced motion
  const variants = prefersReducedMotion ? {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
    exit: { opacity: 1 },
  } : pageVariants;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        className="w-full relative"
      >
        {/* Scan line overlay effect - only show when motion is preferred */}
        {!prefersReducedMotion && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{
              duration: 0.25,
              times: [0, 0.5, 1],
              ease: "easeInOut",
            }}
          >

          </motion.div>
        )}

        {/* Cyan glow pulse effect - only show when motion is preferred */}
        {!prefersReducedMotion && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 0] }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
            }}
          >
            <div className="absolute inset-0 bg-accent/5 opacity-0" />
          </motion.div>
        )}

        {children}
      </motion.div>
    </AnimatePresence>
  );
}

const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    }
  },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.46, 0.45, 0.94],
    }
  },
};

const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    }
  },
};

const slideInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    }
  },
};

// Page transition effect variant
const scanLineEffect = {
  initial: { opacity: 0 },
  animate: {
    opacity: [0, 1, 0],
    transition: {
      duration: 0.25,
      times: [0, 0.5, 1],
      ease: "easeInOut",
    },
  },
};

// Cyan glow pulse variant
const glowPulseEffect = {
  initial: { opacity: 0 },
  animate: {
    opacity: [0.4, 0],
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

// Page enter (fast variant under 300ms total)
const pageEnter = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.28,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

// Page exit with fade
const pageExit = {
  initial: { opacity: 1 },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.12,
      ease: "easeIn",
    },
  },
};

// Stagger container
const staggerContainerFast = {
  animate: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.08,
    },
  },
};

// Fast scale with glow
const glowScaleIn = {
  initial: { opacity: 0, scale: 0.92 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.22,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

export const animations = {
  fadeInUp,
  staggerContainer,
  scaleIn,
  slideInLeft,
  slideInRight,
  scanLineEffect,
  glowPulseEffect,
  pageEnter,
  pageExit,
  staggerContainerFast,
  glowScaleIn,
};

export { motion, AnimatePresence, useReducedMotion };
