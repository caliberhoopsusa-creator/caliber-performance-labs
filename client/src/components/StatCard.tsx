import { useState, useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
  highlight?: boolean;
  sparklineData?: number[];
}

function Sparkline({ data, color, width = 64, height = 24 }: { data: number[]; color?: string; width?: number; height?: number }) {
  const gradientId = useMemo(() => `spark-grad-${Math.random().toString(36).slice(2, 8)}`, []);

  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;

  const points = data.map((v, i) => ({
    x: padding + (i / (data.length - 1)) * chartW,
    y: padding + chartH - ((v - min) / range) * chartH,
  }));

  const trendUp = data[data.length - 1] > data[0];
  const trendDown = data[data.length - 1] < data[0];
  const strokeColor = color || (trendUp ? "#10b981" : trendDown ? "#ef4444" : "#6b7280");

  const lineD = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");
  const areaD = lineD + ` L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="hidden sm:block flex-shrink-0">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradientId})`} />
      <path d={lineD} fill="none" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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

export function StatCard({ label, value, subValue, trend, className, highlight, sparklineData }: StatCardProps) {
  const statTestId = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return (
    <div className={cn(
      "relative rounded-xl p-4 md:p-5 flex flex-col justify-between group overflow-hidden touch-press bg-card",
      "border border-accent/[0.08] backdrop-blur-xl",
      "shadow-[0_4px_24px_rgba(0,0,0,0.4),0_0_50px_rgba(224,36,36,0.06)]",
      "transition-all duration-300",
      "hover:border-accent/[0.15] hover:shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_60px_rgba(224,36,36,0.10)]",
      "active:shadow-[0_2px_12px_rgba(0,0,0,0.5)]",
      highlight && "border-accent/20 shadow-[0_0_40px_rgba(224,36,36,0.12)]",
      className
    )}>
      <div className="absolute inset-x-[20%] top-0 h-px from-transparent via-accent/40 to-transparent" />
      
      {highlight && (
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-radial from-accent/10 to-transparent rounded-full blur-2xl group-hover:from-accent/15 transition-all duration-500" />
      )}
      
      <div className="flex justify-between items-start mb-3 relative z-10">
        <span className="stat-label text-accent/60 tracking-widest uppercase text-[10px] font-medium">{label}</span>
        {trend && (
          <span className={cn(
            "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md backdrop-blur-sm",
            trend === "up" ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : 
            trend === "down" ? "bg-red-500/20 text-red-600 dark:text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]" : 
            "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
          )}>
            {trend === "up" ? <TrendingUp className="w-3 h-3" /> : trend === "down" ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          </span>
        )}
      </div>
      
      <div className="flex items-end gap-2 relative z-10">
        <span className="font-display text-5xl font-bold tracking-tight text-foreground">
          <AnimatedValue value={value} />
        </span>
        {subValue && (
          <span className="text-xs text-accent/50 mb-2 font-medium">{subValue}</span>
        )}
        {sparklineData && sparklineData.length >= 2 && (
          <div className="mb-1 ml-auto" data-testid={`sparkline-${statTestId}`}>
            <Sparkline data={sparklineData} />
          </div>
        )}
      </div>
    </div>
  );
}
