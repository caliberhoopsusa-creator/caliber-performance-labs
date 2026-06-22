import { motion } from "framer-motion";
import { Calendar, ArrowUp, ArrowDown, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export interface MemoryData {
  hasMemories: boolean;
  periodLabel: string;
  currentPeriod: { games: number; dateRange: string };
  lastYearPeriod: { games: number; dateRange: string };
  comparisons: Array<{
    stat: string;
    current: number;
    lastYear: number;
    change: number;
    improved: boolean;
  }>;
  overallGrade?: { current: string; lastYear: string };
  motivationalMessage: string;
}

interface MemoryCardProps {
  data: MemoryData;
}

export function MemoryCard({ data }: MemoryCardProps) {
  return (
    <motion.div
      data-testid="memory-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card
        className="relative overflow-visible border-accent/20"
        style={{
          background: "linear-gradient(135deg, rgba(198, 208, 216, 0.08) 0%, rgba(249, 115, 22, 0.04) 50%, rgba(0,0,0,0.3) 100%)",
        }}
      >
        <div className="p-5">
          <div className="flex items-center gap-2.5 mb-4 flex-wrap">
            <div className="p-2 rounded-lg bg-accent/15 border border-accent/25">
              <Calendar className="w-4 h-4 text-accent" style={{ filter: "drop-shadow(0 0 6px hsl(24 95% 53%))" }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold uppercase tracking-wider text-accent/90">
                This Day Last Year
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {data.periodLabel}
              </p>
            </div>
            <Badge variant="outline" className="border-amber-500/30 text-amber-400/80 text-[10px]">
              Memories
            </Badge>
          </div>

          <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-amber-400/70 font-medium">Now:</span>
              <span data-testid="text-current-period">{data.currentPeriod.games} games</span>
              <span className="text-muted-foreground/50">({data.currentPeriod.dateRange})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-amber-400/70 font-medium">Then:</span>
              <span data-testid="text-last-year-period">{data.lastYearPeriod.games} games</span>
              <span className="text-muted-foreground/50">({data.lastYearPeriod.dateRange})</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {data.comparisons.map((comp, idx) => (
              <motion.div
                key={comp.stat}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + idx * 0.05, duration: 0.3 }}
                className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-background/30"
                data-testid={`stat-comparison-${comp.stat.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <span className="text-sm font-medium text-foreground/80 min-w-[100px]">
                  {comp.stat}
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {comp.lastYear}
                  </span>
                  <span className="text-muted-foreground/40 text-xs">&rarr;</span>
                  <span className="text-sm font-semibold text-foreground tabular-nums">
                    {comp.current}
                  </span>
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-xs font-semibold min-w-[60px] justify-end",
                  comp.improved ? "text-emerald-400" : "text-red-400"
                )}>
                  {comp.improved ? (
                    <ArrowUp className="w-3 h-3" />
                  ) : (
                    <ArrowDown className="w-3 h-3" />
                  )}
                  <span>{comp.change > 0 ? "+" : ""}{comp.change}%</span>
                </div>
              </motion.div>
            ))}
          </div>

          {data.overallGrade && (
            <div className="flex items-center justify-between mt-4 py-2.5 px-3 rounded-lg bg-accent/5 border border-accent/10">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Overall Grade</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{data.overallGrade.lastYear}</span>
                <span className="text-muted-foreground/40 text-xs">&rarr;</span>
                <span className="text-lg font-bold text-accent" data-testid="text-current-grade">
                  {data.overallGrade.current}
                </span>
              </div>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-4 flex items-start gap-2 py-3 px-3 rounded-lg"
            style={{
              background: "linear-gradient(135deg, rgba(198, 208, 216, 0.06) 0%, transparent 100%)",
            }}
          >
            <Sparkles className="w-4 h-4 text-accent/60 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-accent/70 italic" data-testid="text-motivational-message">
              {data.motivationalMessage}
            </p>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}

interface MemorySectionProps {
  playerId: number;
}

export function MemorySection({ playerId }: MemorySectionProps) {
  const { data, isLoading } = useQuery<MemoryData>({
    queryKey: ["/api/players", playerId, "memories"],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}/memories`);
      if (!res.ok) throw new Error("Failed to fetch memories");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="mb-6">
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!data || !data.hasMemories) {
    return null;
  }

  return (
    <div className="mb-6" data-testid="memory-section">
      <MemoryCard data={data} />
    </div>
  );
}
