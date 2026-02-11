import { motion, AnimatePresence } from "framer-motion";
import { Zap, Flame, Trophy, Star, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";

interface XPNotification {
  id: number;
  amount: number;
  reason: string;
  bonus?: {
    type: "streak" | "grade" | "first";
    multiplier?: number;
  };
}

interface XPToastProps {
  notification: XPNotification;
  onComplete: (id: number) => void;
}

function XPToast({ notification, onComplete }: XPToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete(notification.id);
    }, 2500);
    return () => clearTimeout(timer);
  }, [notification.id, onComplete]);

  const getBonusIcon = () => {
    switch (notification.bonus?.type) {
      case "streak":
        return <Flame className="w-3 h-3 text-orange-400" />;
      case "grade":
        return <Star className="w-3 h-3 text-yellow-400" />;
      case "first":
        return <Award className="w-3 h-3 text-purple-400" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ x: 100, opacity: 0, scale: 0.8 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: 100, opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl",
        "bg-gradient-to-r from-primary/20 to-accent/10",
        "border border-primary/30 backdrop-blur-md",
        "shadow-lg shadow-primary/20"
      )}
      data-testid="xp-toast"
    >
      <motion.div
        animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 0.5, repeat: 2 }}
        className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"
      >
        <Zap className="w-5 h-5 text-primary" />
      </motion.div>
      
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <motion.span
            initial={{ scale: 0.5 }}
            animate={{ scale: [0.5, 1.3, 1] }}
            transition={{ duration: 0.4 }}
            className="text-xl font-display font-bold text-primary"
          >
            +{notification.amount} XP
          </motion.span>
          {notification.bonus && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-xs"
            >
              {getBonusIcon()}
              <span className="text-white/70">
                {notification.bonus.multiplier 
                  ? `${notification.bonus.multiplier}x Bonus!`
                  : "Bonus!"}
              </span>
            </motion.div>
          )}
        </div>
        <span className="text-xs text-white/60">{notification.reason}</span>
      </div>
    </motion.div>
  );
}

// XP Notification Manager
interface XPContextType {
  showXPGain: (amount: number, reason: string, bonus?: XPNotification["bonus"]) => void;
}

const XPContext = createContext<XPContextType | null>(null);

export function XPNotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<XPNotification[]>([]);
  const [nextId, setNextId] = useState(1);

  const showXPGain = useCallback((
    amount: number, 
    reason: string, 
    bonus?: XPNotification["bonus"]
  ) => {
    const id = nextId;
    setNextId(prev => prev + 1);
    setNotifications(prev => [...prev, { id, amount, reason, bonus }]);
  }, [nextId]);

  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <XPContext.Provider value={{ showXPGain }}>
      {children}
      
      {/* Notification container */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {notifications.map((notification) => (
            <XPToast
              key={notification.id}
              notification={notification}
              onComplete={removeNotification}
            />
          ))}
        </AnimatePresence>
      </div>
    </XPContext.Provider>
  );
}

export function useXPNotification() {
  const context = useContext(XPContext);
  if (!context) {
    throw new Error("useXPNotification must be used within XPNotificationProvider");
  }
  return context;
}

// Preset XP gains based on action types
export const XP_ACTIONS = {
  GAME_LOGGED: { amount: 50, reason: "Game Logged" },
  BADGE_EARNED: { amount: 25, reason: "Badge Earned" },
  GOAL_COMPLETED: { amount: 100, reason: "Goal Completed" },
  CHALLENGE_COMPLETED: { amount: 150, reason: "Challenge Completed" },
  DAILY_LOGIN: { amount: 10, reason: "Daily Login Bonus" },
  STREAK_3: { amount: 25, reason: "3-Day Streak" },
  STREAK_7: { amount: 75, reason: "7-Day Streak" },
  STREAK_14: { amount: 150, reason: "14-Day Streak" },
  STREAK_30: { amount: 300, reason: "30-Day Streak" },
  A_GRADE: { amount: 30, reason: "A Grade Performance" },
  A_PLUS_GRADE: { amount: 50, reason: "A+ Grade Performance" },
} as const;
