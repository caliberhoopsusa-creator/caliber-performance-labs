import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "default" | "accent" | "circular" | "text";
  style?: React.CSSProperties;
}

export function Skeleton({ className, variant = "default", style }: SkeletonProps) {
  return (
    <div
      className={cn(
        variant === "accent" ? "skeleton-premium" : "skeleton-premium",
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
    <div className={cn("relative rounded-xl border border-accent/[0.08] bg-gradient-to-br from-[hsl(220,25%,8%)] via-[hsl(220,20%,6%)] to-[hsl(220,25%,5%)] p-6 overflow-hidden elite-card", className)}>
      <div className="absolute inset-x-[10%] top-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-2/3" variant="accent" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-8 w-20 rounded-lg" variant="accent" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent opacity-0 animate-pulse pointer-events-none" />
    </div>
  );
}

export function SkeletonPlayerCard({ className }: { className?: string }) {
  return (
    <div className={cn("relative rounded-xl border border-accent/[0.08] bg-gradient-to-br from-[hsl(220,25%,8%)] via-[hsl(220,20%,6%)] to-[hsl(220,25%,5%)] p-4 overflow-hidden elite-card", className)}>
      <div className="absolute inset-x-[10%] top-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-full" variant="accent" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" variant="accent" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" variant="accent" />
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
    <div className={cn("relative flex items-center gap-4 p-4 rounded-xl border border-accent/[0.08] bg-gradient-to-br from-[hsl(220,25%,8%)] via-[hsl(220,20%,6%)] to-[hsl(220,25%,5%)] overflow-hidden elite-card", className)}>
      <div className="absolute inset-x-[10%] top-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
      <Skeleton className="h-8 w-8 rounded-lg" variant="accent" />
      <Skeleton className="h-10 w-10 rounded-full" variant="accent" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-28" variant="accent" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-6 w-12 rounded" />
        <Skeleton className="h-6 w-12 rounded" />
        <Skeleton className="h-6 w-12 rounded" />
      </div>
      <Skeleton className="h-10 w-10 rounded-lg" variant="accent" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent opacity-0 animate-pulse pointer-events-none" />
    </div>
  );
}

export function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div className={cn("relative rounded-xl border border-accent/[0.08] bg-gradient-to-br from-[hsl(220,25%,8%)] via-[hsl(220,20%,6%)] to-[hsl(220,25%,5%)] p-4 text-center overflow-hidden elite-card", className)}>
      <div className="absolute inset-x-[20%] top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-16 mx-auto" variant="accent" />
        <Skeleton className="h-3 w-12 mx-auto" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent opacity-0 animate-pulse pointer-events-none" />
    </div>
  );
}

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn("relative rounded-xl border border-accent/[0.08] bg-gradient-to-br from-[hsl(220,25%,8%)] via-[hsl(220,20%,6%)] to-[hsl(220,25%,5%)] p-6 overflow-hidden elite-card", className)}>
      <div className="absolute inset-x-[10%] top-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
      <Skeleton className="h-5 w-32 mb-4" variant="accent" />
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

export function SkeletonQuickStatsGrid({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="relative rounded-xl border border-accent/[0.08] bg-gradient-to-br from-[hsl(220,25%,8%)] via-[hsl(220,20%,6%)] to-[hsl(220,25%,5%)] p-6 overflow-hidden elite-card">
          <div className="absolute inset-x-[10%] top-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" variant="accent" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-16" variant="accent" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent opacity-0 animate-pulse pointer-events-none" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonRecruitingTimeline({ className }: { className?: string }) {
  return (
    <div className={cn("relative rounded-xl border border-accent/[0.08] bg-gradient-to-br from-[hsl(220,25%,8%)] via-[hsl(220,20%,6%)] to-[hsl(220,25%,5%)] overflow-hidden elite-card", className)}>
      <div className="absolute inset-x-[10%] top-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
      <div className="p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" variant="accent" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" variant="accent" />
              <Skeleton className="h-3 w-64" />
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent opacity-0 animate-pulse pointer-events-none" />
    </div>
  );
}

export function SkeletonInterestCard({ className }: { className?: string }) {
  return (
    <div className={cn("relative rounded-xl border border-accent/[0.08] bg-gradient-to-br from-[hsl(220,25%,8%)] via-[hsl(220,20%,6%)] to-[hsl(220,25%,5%)] p-4 overflow-hidden elite-card", className)}>
      <div className="absolute inset-x-[10%] top-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" variant="accent" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" variant="accent" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent opacity-0 animate-pulse pointer-events-none" />
    </div>
  );
}

export function SkeletonChallengeCard({ className }: { className?: string }) {
  return (
    <div className={cn("relative rounded-xl border border-accent/[0.08] bg-gradient-to-br from-[hsl(220,25%,8%)] via-[hsl(220,20%,6%)] to-[hsl(220,25%,5%)] overflow-hidden elite-card", className)}>
      <div className="absolute inset-x-[10%] top-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="h-6 w-6 rounded" variant="accent" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-40" variant="accent" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" variant="accent" />
          <Skeleton className="h-6 w-24 rounded" />
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent opacity-0 animate-pulse pointer-events-none" />
    </div>
  );
}

export function SkeletonLeaderboardHeader({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-gradient-to-br from-black/60 via-yellow-950/10 to-black/60 border border-yellow-500/20 p-6 md:p-8", className)}>
      <div className="absolute inset-0 opacity-20" />
      <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-500/10 blur-[100px] rounded-full" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/10 blur-[60px] rounded-full" />
      <div className="relative z-10 space-y-2">
        <Skeleton className="h-5 w-32" variant="accent" />
        <Skeleton className="h-8 w-64" variant="accent" />
        <Skeleton className="h-4 w-80" />
      </div>
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" variant="accent" />
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
