import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
  highlight?: boolean;
}

export function StatCard({ label, value, subValue, trend, className, highlight }: StatCardProps) {
  return (
    <div className={cn(
      "glass-card rounded-xl p-5 flex flex-col justify-between relative overflow-hidden group hover:border-primary/30 transition-colors duration-300",
      highlight && "border-primary/50 bg-primary/5",
      className
    )}>
      {highlight && (
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500" />
      )}
      
      <div className="flex justify-between items-start mb-2">
        <span className="stat-label text-muted-foreground/80">{label}</span>
        {trend && (
          <span className={cn(
            "text-xs font-bold px-1.5 py-0.5 rounded",
            trend === "up" ? "bg-green-500/20 text-green-400" : 
            trend === "down" ? "bg-red-500/20 text-red-400" : 
            "bg-yellow-500/20 text-yellow-400"
          )}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "—"}
          </span>
        )}
      </div>
      
      <div className="flex items-end gap-2 z-10">
        <span className={cn(
          "stat-value", 
          highlight ? "text-primary" : "text-white"
        )}>
          {value}
        </span>
        {subValue && (
          <span className="text-xs text-muted-foreground mb-1.5 font-medium">{subValue}</span>
        )}
      </div>
    </div>
  );
}
