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
      "elite-card rounded-xl p-5 flex flex-col justify-between relative overflow-hidden group",
      "hover-lift transition-all duration-300",
      highlight && "border-white/20 glow-white-sm",
      className
    )}>
      {highlight && (
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-500" />
      )}
      
      <div className="flex justify-between items-start mb-3 relative z-10">
        <span className="stat-label text-muted-foreground/80 tracking-widest">{label}</span>
        {trend && (
          <span className={cn(
            "text-xs font-bold px-2 py-1 rounded-md backdrop-blur-sm",
            trend === "up" ? "bg-emerald-500/20 text-emerald-400 glow-grade-a" : 
            trend === "down" ? "bg-red-500/20 text-red-400" : 
            "bg-yellow-500/20 text-yellow-400"
          )}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "—"}
          </span>
        )}
      </div>
      
      <div className="flex items-end gap-2 relative z-10">
        <span className={cn(
          "stat-elite", 
          highlight ? "text-white metallic-silver" : "text-white"
        )}>
          {value}
        </span>
        {subValue && (
          <span className="text-xs text-muted-foreground mb-2 font-medium">{subValue}</span>
        )}
      </div>
    </div>
  );
}
