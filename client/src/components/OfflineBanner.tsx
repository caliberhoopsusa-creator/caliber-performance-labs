import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { WifiOff, X } from "lucide-react";
import { useOffline } from "@/hooks/use-offline";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export function OfflineBanner() {
  const { isOffline } = useOffline();
  const [dismissed, setDismissed] = useState(false);
  const [location] = useLocation();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setDismissed(false);
  }, [location]);

  useEffect(() => {
    if (!isOffline) {
      setDismissed(false);
    }
  }, [isOffline]);

  if (!isOffline || dismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOffline && !dismissed && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-50"
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -40 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: "easeOut" }}
        >
          <div 
            className="relative overflow-hidden bg-gradient-to-r from-amber-950/80 to-orange-950/80 backdrop-blur-sm border-b border-amber-600/30 px-4 py-3 flex items-center justify-between gap-3"
            data-testid="banner-offline"
          >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
            
            {/* Content */}
            <div className="relative flex items-center gap-3 flex-1">
              <motion.div
                animate={prefersReducedMotion ? undefined : { opacity: [0.6, 1, 0.6] }}
                transition={prefersReducedMotion ? undefined : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <WifiOff className="w-4 h-4 shrink-0 text-amber-300" />
              </motion.div>
              <span className="text-xs sm:text-sm font-medium text-amber-100">
                You're offline — some features may be limited
              </span>
            </div>
            <motion.button
              onClick={() => setDismissed(true)}
              whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
              className="relative shrink-0 p-1 rounded-md hover:bg-white/10 transition-colors"
              data-testid="button-dismiss-offline"
            >
              <X className="w-4 h-4 text-amber-200" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function OfflineIndicator() {
  const { isOffline } = useOffline();

  if (!isOffline) {
    return null;
  }

  return (
    <div 
      className="flex items-center gap-1.5 text-orange-500"
      title="Offline mode - using cached data"
      data-testid="indicator-offline"
    >
      <WifiOff className="w-4 h-4" />
      <span className="text-xs hidden sm:inline">Offline</span>
    </div>
  );
}
