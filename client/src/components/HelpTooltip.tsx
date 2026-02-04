import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HelpTooltipProps {
  content: string;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
  iconSize?: "sm" | "md" | "lg";
}

export function HelpTooltip({ content, side = "top", className, iconSize = "sm" }: HelpTooltipProps) {
  const sizeClasses = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <button 
          type="button" 
          className={cn(
            "inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-help",
            className
          )}
          aria-label="Help"
          data-testid="button-help-tooltip"
        >
          <HelpCircle className={sizeClasses[iconSize]} />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs text-sm">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

interface FeatureTipProps {
  title: string;
  description: string;
  side?: "top" | "bottom" | "left" | "right";
  children: React.ReactNode;
}

export function FeatureTip({ title, description, side = "top", children }: FeatureTipProps) {
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs">
        <div className="space-y-1">
          <p className="font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
