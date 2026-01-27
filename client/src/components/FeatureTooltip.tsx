import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FeatureTooltipProps {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  showOnce?: boolean;
  delay?: number;
  className?: string;
}

const TOOLTIP_STORAGE_PREFIX = "caliber_tooltip_seen_";

export function FeatureTooltip({
  id,
  title,
  description,
  children,
  position = "top",
  showOnce = true,
  delay = 1000,
  className,
}: FeatureTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const storageKey = `${TOOLTIP_STORAGE_PREFIX}${id}`;

  useEffect(() => {
    if (showOnce) {
      const seen = localStorage.getItem(storageKey);
      if (seen) return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [storageKey, showOnce, delay]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (showOnce) {
      localStorage.setItem(storageKey, "true");
    }
  };

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-cyan-500/30 border-x-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-cyan-500/30 border-x-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-cyan-500/30 border-y-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-cyan-500/30 border-y-transparent border-l-transparent",
  };

  const motionProps = {
    top: { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } },
    bottom: { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 } },
    left: { initial: { opacity: 0, x: 10 }, animate: { opacity: 1, x: 0 } },
    right: { initial: { opacity: 0, x: -10 }, animate: { opacity: 1, x: 0 } },
  };

  return (
    <div className={cn("relative inline-block", className)}>
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className={cn(
              "absolute z-50 w-64 p-3 rounded-lg",
              "bg-gradient-to-br from-[hsl(220,25%,12%)] to-[hsl(220,25%,8%)]",
              "border border-cyan-500/30 shadow-lg shadow-cyan-500/10",
              positionClasses[position]
            )}
            initial={motionProps[position].initial}
            animate={motionProps[position].animate}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            data-testid={`tooltip-${id}`}
          >
            <div className={cn("absolute w-0 h-0 border-8", arrowClasses[position])} />
            
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 p-1.5 rounded-md bg-cyan-500/20">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-white truncate">
                    {title}
                  </h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDismiss}
                    className="flex-shrink-0 h-6 w-6"
                    data-testid={`button-dismiss-tooltip-${id}`}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface InfoTooltipProps {
  content: string;
  className?: string;
}

export function InfoTooltip({ content, className }: InfoTooltipProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Info className="w-4 h-4 text-muted-foreground cursor-help" />
      
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-48 p-2 rounded-md bg-[hsl(220,25%,10%)] border border-cyan-500/20 shadow-lg"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
          >
            <p className="text-xs text-muted-foreground leading-relaxed">
              {content}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function resetAllTooltips() {
  Object.keys(localStorage)
    .filter(key => key.startsWith(TOOLTIP_STORAGE_PREFIX))
    .forEach(key => localStorage.removeItem(key));
}
