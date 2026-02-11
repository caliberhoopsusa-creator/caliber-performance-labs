import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  progress: number;
  threshold?: number;
}

export function PullToRefreshIndicator({ 
  pullDistance, 
  isRefreshing, 
  progress,
  threshold = 80 
}: PullToRefreshIndicatorProps) {
  if (pullDistance === 0 && !isRefreshing) return null;
  
  const shouldTrigger = pullDistance >= threshold;
  
  return (
    <motion.div
      className="absolute top-0 left-0 right-0 flex justify-center z-50 pointer-events-none"
      style={{ 
        height: pullDistance,
        opacity: Math.min(progress * 1.5, 1)
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: Math.min(progress * 1.5, 1) }}
    >
      <div className={cn(
        "flex items-center justify-center w-10 h-10 rounded-full mt-2",
        "bg-slate-800/90 backdrop-blur-sm border border-accent/30",
        shouldTrigger && "border-accent/60"
      )}>
        <motion.div
          animate={{ 
            rotate: isRefreshing ? 360 : progress * 180,
            scale: shouldTrigger ? 1.1 : 1
          }}
          transition={isRefreshing ? { 
            rotate: { duration: 1, repeat: Infinity, ease: "linear" }
          } : { 
            type: "spring", stiffness: 300, damping: 20 
          }}
        >
          <RefreshCw className={cn(
            "w-5 h-5 transition-colors",
            shouldTrigger || isRefreshing ? "text-accent" : "text-muted-foreground"
          )} />
        </motion.div>
      </div>
    </motion.div>
  );
}
