import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
  highlight?: boolean;
}

function AnimatedValue({ value }: { value: string | number }) {
  const [displayValue, setDisplayValue] = useState<string | number>(value);
  const prevValueRef = useRef<string | number>(value);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    // Skip animation for special cases
    if (value === "—" || value === "N/A") {
      setDisplayValue(value);
      prevValueRef.current = value;
      return;
    }

    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // If not a valid number, just set it directly
    if (isNaN(numericValue) || (typeof value === 'string' && value.includes('%'))) {
      // For percentage strings like "52.3%", animate the number part
      const match = typeof value === 'string' ? value.match(/^([\d.]+)(.*)$/) : null;
      if (match) {
        const targetNum = parseFloat(match[1]);
        const suffix = match[2];
        const startNum = 0;
        const startTime = performance.now();
        const duration = 800;
        
        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
          
          const current = startNum + (targetNum - startNum) * eased;
          // Preserve decimal places from original
          const decimals = match[1].includes('.') ? match[1].split('.')[1].length : 0;
          setDisplayValue(current.toFixed(decimals) + suffix);
          
          if (progress < 1) {
            frameRef.current = requestAnimationFrame(animate);
          }
        };
        
        frameRef.current = requestAnimationFrame(animate);
        prevValueRef.current = value;
        return () => cancelAnimationFrame(frameRef.current);
      }
      
      setDisplayValue(value);
      prevValueRef.current = value;
      return;
    }
    
    // Animate numeric values
    const startTime = performance.now();
    const duration = 800;
    const startVal = 0;
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      
      const current = startVal + (numericValue - startVal) * eased;
      // If the original is an integer, show integer; otherwise match decimals
      if (Number.isInteger(numericValue)) {
        setDisplayValue(Math.round(current));
      } else {
        const originalStr = String(value);
        const decimals = originalStr.includes('.') ? originalStr.split('.')[1].length : 1;
        setDisplayValue(parseFloat(current.toFixed(decimals)));
      }
      
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    
    frameRef.current = requestAnimationFrame(animate);
    prevValueRef.current = value;
    
    return () => cancelAnimationFrame(frameRef.current);
  }, [value]);

  return <>{displayValue}</>;
}

export function StatCard({ label, value, subValue, trend, className, highlight }: StatCardProps) {
  return (
    <div className={cn(
      "relative rounded-xl p-4 md:p-5 flex flex-col justify-between group overflow-hidden touch-press",
      "bg-gradient-to-br from-[hsl(220,25%,8%)] via-[hsl(220,20%,6%)] to-[hsl(220,25%,5%)]",
      "border border-cyan-500/[0.08] backdrop-blur-xl",
      "shadow-[0_4px_24px_rgba(0,0,0,0.4),0_0_50px_rgba(0,212,255,0.02)]",
      "transition-all duration-300",
      "hover:border-cyan-400/[0.15] hover:shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_60px_rgba(0,212,255,0.04)]",
      "active:shadow-[0_2px_12px_rgba(0,0,0,0.5)]",
      highlight && "border-cyan-400/20 shadow-[0_0_40px_rgba(0,212,255,0.08)]",
      className
    )}>
      <div className="absolute inset-x-[20%] top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
      
      {highlight && (
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-radial from-cyan-400/10 to-transparent rounded-full blur-2xl group-hover:from-cyan-400/15 transition-all duration-500" />
      )}
      
      <div className="flex justify-between items-start mb-3 relative z-10">
        <span className="stat-label text-cyan-200/60 tracking-widest uppercase text-[10px] font-medium">{label}</span>
        {trend && (
          <span className={cn(
            "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md backdrop-blur-sm",
            trend === "up" ? "bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : 
            trend === "down" ? "bg-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]" : 
            "bg-yellow-500/20 text-yellow-400"
          )}>
            {trend === "up" ? <TrendingUp className="w-3 h-3" /> : trend === "down" ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          </span>
        )}
      </div>
      
      <div className="flex items-end gap-2 relative z-10">
        <span className={cn(
          "font-display text-4xl font-bold tracking-tight",
          "bg-gradient-to-b from-white to-cyan-100/80 bg-clip-text text-transparent",
          "drop-shadow-[0_2px_10px_rgba(100,200,255,0.15)]"
        )}>
          <AnimatedValue value={value} />
        </span>
        {subValue && (
          <span className="text-xs text-cyan-200/50 mb-2 font-medium">{subValue}</span>
        )}
      </div>
    </div>
  );
}
