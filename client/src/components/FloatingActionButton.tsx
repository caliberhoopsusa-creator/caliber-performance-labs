import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Video, Trophy, GraduationCap, Camera } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface QuickAction {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  bg: string;
}

interface FloatingActionButtonProps {
  userRole: string;
  playerId?: number | null;
}

export function FloatingActionButton({ userRole, playerId }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  
  const isPlayer = userRole === 'player';
  
  const hiddenPaths = ['/analyze', '/video', '/role-selection', '/'];
  const shouldHide = hiddenPaths.some(path => 
    path === '/' ? location === '/' : location.startsWith(path)
  );
  
  if (shouldHide) return null;

  const playerActions: QuickAction[] = [
    { href: "/analyze", icon: Plus, label: "Log Game", bg: "bg-accent" },
    { href: "/highlights", icon: Camera, label: "Highlights", bg: "bg-purple-600" },
    { href: "/recruiting", icon: GraduationCap, label: "Recruiting", bg: "bg-accent" },
    { href: "/leaderboard", icon: Trophy, label: "Leaderboard", bg: "bg-emerald-600" },
  ];

  const coachActions: QuickAction[] = [
    { href: "/analyze", icon: Plus, label: "Log Game", bg: "bg-accent" },
    { href: "/video", icon: Video, label: "Video Analysis", bg: "bg-purple-600" },
    { href: "/scout", icon: Trophy, label: "Scout Hub", bg: "bg-accent" },
    { href: "/coach/endorsements", icon: GraduationCap, label: "Endorsements", bg: "bg-emerald-600" },
  ];

  const actions = isPlayer ? playerActions : coachActions;

  return (
    <div className="md:hidden fixed bottom-20 right-4 z-40 pb-safe" data-testid="fab-container">
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute bottom-16 right-0 flex flex-col-reverse gap-3 z-40">
              {actions.map((action, index) => (
                <motion.div
                  key={action.href}
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: 20 }}
                  transition={{ delay: index * 0.05, type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Link
                    href={action.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3"
                    data-testid={`fab-action-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <span className="bg-card/90 backdrop-blur-sm text-foreground text-sm font-medium px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap border border-border">
                      {action.label}
                    </span>
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center shadow-lg",
                      action.bg
                    )}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center shadow-xl relative z-40",
          "bg-[hsl(var(--cta))]",
          "active:scale-95 transition-transform"
        )}
        style={{ boxShadow: "0 0 20px rgba(224,36,36,0.35), 0 0 50px rgba(224,36,36,0.12)" }}
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        data-testid="fab-main-button"
        aria-label={isOpen ? "Close quick actions" : "Open quick actions"}
        aria-expanded={isOpen}
      >
        <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 hover:opacity-100 transition-opacity" />
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Plus className="w-6 h-6 text-white" />
        )}
      </motion.button>
    </div>
  );
}
