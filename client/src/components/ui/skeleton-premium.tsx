import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "default" | "cyan" | "circular" | "text";
  style?: React.CSSProperties;
}

export function Skeleton({ className, variant = "default", style }: SkeletonProps) {
  return (
    <div
      className={cn(
        variant === "cyan" ? "skeleton-cyan" : "skeleton-premium",
        variant === "circular" && "rounded-full",
        variant === "text" && "h-4 rounded",
        className
      )}
      style={style}
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("relative rounded-xl border border-cyan-500/[0.08] bg-gradient-to-br from-[hsl(220,25%,8%)] via-[hsl(220,20%,6%)] to-[hsl(220,25%,5%)] p-6 overflow-hidden elite-card", className)}>
      <div className="absolute inset-x-[10%] top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-2/3" variant="cyan" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-8 w-20 rounded-lg" variant="cyan" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent opacity-0 animate-pulse pointer-events-none" />
    </div>
  );
}

export function SkeletonPlayerCard({ className }: { className?: string }) {
  return (
    <div className={cn("relative rounded-xl border border-cyan-500/[0.08] bg-gradient-to-br from-[hsl(220,25%,8%)] via-[hsl(220,20%,6%)] to-[hsl(220,25%,5%)] p-4 overflow-hidden elite-card", className)}>
      <div className="absolute inset-x-[10%] top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-full" variant="cyan" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" variant="cyan" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" variant="cyan" />
      </div>
      <div className="grid grid-cols-4 gap-3 mt-4">
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent opacity-0 animate-pulse pointer-events-none" />
    </div>
  );
}

export function SkeletonLeaderboardRow({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex items-center gap-4 p-4 rounded-xl border border-cyan-500/[0.08] bg-gradient-to-br from-[hsl(220,25%,8%)] via-[hsl(220,20%,6%)] to-[hsl(220,25%,5%)] overflow-hidden elite-card", className)}>
      <div className="absolute inset-x-[10%] top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
      <Skeleton className="h-8 w-8 rounded-lg" variant="cyan" />
      <Skeleton className="h-10 w-10 rounded-full" variant="cyan" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-28" variant="cyan" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-6 w-12 rounded" />
        <Skeleton className="h-6 w-12 rounded" />
        <Skeleton className="h-6 w-12 rounded" />
      </div>
      <Skeleton className="h-10 w-10 rounded-lg" variant="cyan" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent opacity-0 animate-pulse pointer-events-none" />
    </div>
  );
}

export function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div className={cn("relative rounded-xl border border-cyan-500/[0.08] bg-gradient-to-br from-[hsl(220,25%,8%)] via-[hsl(220,20%,6%)] to-[hsl(220,25%,5%)] p-4 text-center overflow-hidden elite-card", className)}>
      <div className="absolute inset-x-[20%] top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-16 mx-auto" variant="cyan" />
        <Skeleton className="h-3 w-12 mx-auto" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent opacity-0 animate-pulse pointer-events-none" />
    </div>
  );
}

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn("relative rounded-xl border border-cyan-500/[0.08] bg-gradient-to-br from-[hsl(220,25%,8%)] via-[hsl(220,20%,6%)] to-[hsl(220,25%,5%)] p-6 overflow-hidden elite-card", className)}>
      <div className="absolute inset-x-[10%] top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
      <Skeleton className="h-5 w-32 mb-4" variant="cyan" />
      <div className="flex items-end gap-2 h-40">
        {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
          <Skeleton 
            key={i} 
            className="flex-1 rounded-t"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent opacity-0 animate-pulse pointer-events-none" />
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" variant="cyan" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <div className="grid md:grid-cols-4 gap-4">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <SkeletonChart />
        <SkeletonChart />
      </div>
      <div className="space-y-3">
        <SkeletonPlayerCard />
        <SkeletonPlayerCard />
        <SkeletonPlayerCard />
      </div>
    </div>
  );
}
