import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/50", className)}
      {...props}
    />
  )
}

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-white/5 bg-card/50 p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-white/5">
      <Skeleton className="h-10 w-10 rounded-full" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-20 ml-auto" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-12" />
    </div>
  );
}

function PlayerCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/5 bg-card/50 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-14 w-14 rounded-xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-xl border border-white/5 bg-card/50 p-4 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-12" />
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-white/5 bg-card/50 p-6 space-y-4">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export { Skeleton, CardSkeleton, TableRowSkeleton, PlayerCardSkeleton, StatsSkeleton, ChartSkeleton }
