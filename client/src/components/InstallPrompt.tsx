import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Smartphone } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = window.matchMedia("(display-mode: standalone)").matches || 
                               (window.navigator as any).standalone === true;
    
    setIsIOS(isIOSDevice);
    setIsStandalone(isInStandaloneMode);

    const dismissed = localStorage.getItem("pwa-install-dismissed");
    const dismissedAt = dismissed ? parseInt(dismissed, 10) : 0;
    const daysSinceDismissed = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);

    if (isInStandaloneMode || (dismissed && daysSinceDismissed < 7)) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    if (isIOSDevice && !isInStandaloneMode && (!dismissed || daysSinceDismissed >= 7)) {
      setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (!showPrompt || isStandalone) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50"
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.4, ease: "easeOut" }}
        >
          <div className="elite-card p-5 backdrop-blur-2xl">
            <div className="flex items-start gap-3">
              <motion.div 
                className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/40 to-primary/20 flex items-center justify-center shrink-0"
                initial={prefersReducedMotion ? { scale: 1 } : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.1, duration: 0.3, type: "spring", stiffness: 200 }}
              >
                <Smartphone className="w-5 h-5 text-primary" />
              </motion.div>
              <motion.div 
                className="flex-1 min-w-0"
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.15, duration: 0.3 }}
              >
                <h3 className="font-bold text-foreground text-sm">Install Caliber</h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {isIOS 
                    ? "Tap the share button and 'Add to Home Screen' for the best experience"
                    : "Add to your home screen for quick access and offline features"
                  }
                </p>
              </motion.div>
              <motion.div
                initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.2, duration: 0.3 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 -mt-1 -mr-1"
                  onClick={handleDismiss}
                  data-testid="button-dismiss-install"
                >
                  <X className="w-4 h-4" />
                </Button>
              </motion.div>
            </div>
            
            {!isIOS && deferredPrompt && (
              <motion.div 
                className="mt-4 flex gap-2"
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.25, duration: 0.3 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={handleDismiss}
                  data-testid="button-install-not-now"
                >
                  Not now
                </Button>
                <motion.div
                  className="flex-1"
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                  animate={prefersReducedMotion ? undefined : { 
                    boxShadow: [
                      "0 0 20px rgba(255,255,255,0.2)",
                      "0 0 40px rgba(255,255,255,0.4)",
                      "0 0 20px rgba(255,255,255,0.2)"
                    ]
                  }}
                  transition={prefersReducedMotion ? undefined : {
                    boxShadow: {
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  }}
                >
                  <Button
                    size="sm"
                    className={`w-full ${prefersReducedMotion ? '' : 'pulse-glow'}`}
                    onClick={handleInstall}
                    data-testid="button-install-app"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Install
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
