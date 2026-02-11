import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function PullToRefresh({
  onRefresh,
  children,
  className,
  disabled = false,
}: PullToRefreshProps) {
  const {
    containerRef,
    isRefreshing,
    pullDistance,
    progress,
    shouldTrigger,
  } = usePullToRefresh({ onRefresh, disabled });

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      data-testid="pull-to-refresh-container"
    >
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-center"
        style={{
          top: Math.max(-40, pullDistance - 50),
          opacity: progress,
        }}
        animate={{
          scale: shouldTrigger ? 1.1 : 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            "bg-gradient-to-br from-[hsl(220,25%,12%)] to-[hsl(220,25%,8%)]",
            "border border-accent/30 shadow-lg",
            shouldTrigger && "border-accent/50"
          )}
        >
          <motion.div
            animate={{
              rotate: isRefreshing ? 360 : progress * 180,
            }}
            transition={
              isRefreshing
                ? { repeat: Infinity, duration: 0.8, ease: "linear" }
                : { type: "spring", stiffness: 200 }
            }
          >
            <RefreshCw
              className={cn(
                "w-5 h-5 transition-colors",
                shouldTrigger ? "text-accent" : "text-muted-foreground"
              )}
            />
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        animate={{
          y: pullDistance > 0 ? pullDistance * 0.5 : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
