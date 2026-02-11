import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CollapsibleStatCardProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  headerContent?: React.ReactNode;
  testId?: string;
}

export function CollapsibleStatCard({ 
  title, 
  icon: Icon,
  defaultOpen = true, 
  children,
  className,
  headerContent,
  testId
}: CollapsibleStatCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  }, [handleToggle]);
  
  return (
    <Card className={cn("overflow-hidden", className)} data-testid={testId}>
      <button
        type="button"
        className="w-full py-3 px-4 md:py-4 md:px-6 text-left cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-t-lg"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-controls={testId ? `${testId}-content` : undefined}
        data-testid={testId ? `${testId}-header` : undefined}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-accent" />}
            <span className="text-sm md:text-base font-semibold text-card-foreground">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            {headerContent}
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </div>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            id={testId ? `${testId}-content` : undefined}
          >
            <CardContent className="pt-0 px-4 pb-4 md:px-6 md:pb-6">
              {children}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

interface MobileStatGridProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileStatGrid({ children, className }: MobileStatGridProps) {
  return (
    <div className={cn(
      "grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4",
      className
    )}>
      {children}
    </div>
  );
}

interface QuickStatProps {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
}

export function QuickStat({ label, value, icon: Icon, trend, trendValue, className }: QuickStatProps) {
  return (
    <div className={cn(
      "flex flex-col p-3 rounded-lg bg-muted/50 border border-border/50",
      "touch-manipulation active:scale-[0.98] transition-transform",
      className
    )}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide truncate">
          {label}
        </span>
        {Icon && <Icon className="w-3 h-3 md:w-4 md:h-4 text-accent/60" />}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg md:text-2xl font-bold text-foreground">{value}</span>
        {trend && trendValue && (
          <span className={cn(
            "text-[10px] font-medium",
            trend === "up" && "text-green-600 dark:text-green-400",
            trend === "down" && "text-red-600 dark:text-red-400",
            trend === "neutral" && "text-muted-foreground"
          )}>
            {trend === "up" && "↑"}{trend === "down" && "↓"}{trendValue}
          </span>
        )}
      </div>
    </div>
  );
}
