import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface ReportSummarySectionProps {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  breakBefore?: boolean;
}

export function ReportSummarySection({ 
  title, 
  icon: Icon,
  children, 
  className,
  breakBefore = false
}: ReportSummarySectionProps) {
  return (
    <div 
      className={cn(
        "report-card-section bg-card rounded-lg border border-border p-4 print:bg-white print:border-gray-300 print:break-inside-avoid",
        breakBefore && "print:break-before-page",
        className
      )}
      data-testid={`report-section-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50 print:border-gray-200">
        {Icon && (
          <Icon className="w-5 h-5 text-accent print:text-orange-600" />
        )}
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground print:text-gray-700">
          {title}
        </h3>
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

interface StatBoxProps {
  label: string;
  value: string | number;
  sublabel?: string;
  highlight?: boolean;
}

export function StatBox({ label, value, sublabel, highlight = false }: StatBoxProps) {
  return (
    <div 
      className={cn(
        "text-center p-3 rounded-lg print:bg-gray-50 print:border print:border-gray-200",
        highlight ? "bg-accent/10" : "bg-secondary/30"
      )}
      data-testid={`stat-box-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className={cn(
        "text-2xl font-bold font-display",
        highlight ? "text-accent print:text-orange-600" : "text-foreground print:text-black"
      )}>
        {value}
      </div>
      <div className="text-xs text-muted-foreground print:text-gray-600 uppercase tracking-wide">
        {label}
      </div>
      {sublabel && (
        <div className="text-xs text-muted-foreground/70 print:text-gray-500 mt-1">
          {sublabel}
        </div>
      )}
    </div>
  );
}

interface ProgressRowProps {
  label: string;
  value: number;
  max: number;
  showPercentage?: boolean;
}

export function ProgressRow({ label, value, max, showPercentage = true }: ProgressRowProps) {
  const percentage = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  
  return (
    <div className="space-y-1" data-testid={`progress-row-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground print:text-gray-700">{label}</span>
        <span className="font-medium print:text-black">
          {value}{showPercentage && max > 0 ? `/${max}` : ''}
        </span>
      </div>
      <div className="progress-bar h-2 bg-secondary/50 rounded-full overflow-hidden print:bg-gray-200">
        <div 
          className="progress-bar-fill h-full bg-accent rounded-full transition-all print:bg-orange-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
