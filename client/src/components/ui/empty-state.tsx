import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: "default" | "compact";
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  className,
  variant = "default"
}: EmptyStateProps) {
  const isCompact = variant === "compact";
  
  return (
    <div 
      className={cn(
        "relative flex flex-col items-center justify-center text-center",
        isCompact ? "py-8 px-4" : "py-16 px-6",
        className
      )}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>
      
      {/* Icon container with animated border */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl blur-xl animate-pulse-slow" />
        <div 
          className={cn(
            "relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-cyan-500/10",
            isCompact ? "w-16 h-16" : "w-20 h-20"
          )}
        >
          <Icon className={cn("text-cyan-400/60", isCompact ? "w-7 h-7" : "w-9 h-9")} />
        </div>
      </div>
      
      {/* Text content */}
      <h3 className={cn(
        "font-display font-semibold text-white mb-2",
        isCompact ? "text-lg" : "text-xl"
      )}>
        {title}
      </h3>
      <p className={cn(
        "text-muted-foreground max-w-sm",
        isCompact ? "text-sm" : "text-base"
      )}>
        {description}
      </p>
      
      {/* Action button */}
      {action && (
        <Button 
          onClick={action.onClick}
          className="mt-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 border-0 shadow-lg shadow-cyan-500/20"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

interface EmptyStateCardProps extends EmptyStateProps {
  cardClassName?: string;
}

export function EmptyStateCard({ cardClassName, ...props }: EmptyStateCardProps) {
  return (
    <div 
      className={cn(
        "relative rounded-xl border border-cyan-500/[0.08] bg-gradient-to-br from-[hsl(220,25%,8%)] via-[hsl(220,20%,6%)] to-[hsl(220,25%,5%)] overflow-hidden",
        cardClassName
      )}
    >
      {/* Top accent line */}
      <div className="absolute inset-x-[10%] top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
      
      {/* Cyber grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,212,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px] opacity-30 pointer-events-none" />
      
      <EmptyState {...props} />
    </div>
  );
}
