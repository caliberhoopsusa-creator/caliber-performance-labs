import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Minus, Trophy, User } from "lucide-react";

interface TickerItem {
  type: "personal" | "leaderboard";
  label: string;
  value: string;
  change: string | null;
  direction: "up" | "down" | null;
}

export function StatsTicker() {
  const { data: items = [], isLoading } = useQuery<TickerItem[]>({
    queryKey: ["/api/ticker"],
    refetchInterval: 60000,
  });

  if (isLoading || items.length === 0) return null;

  const doubled = [...items, ...items];

  return (
    <div className="w-full overflow-hidden bg-card/50 border-b border-border" data-testid="stats-ticker">
      <div
        className="flex whitespace-nowrap py-1.5"
        style={{
          animation: `tickerScroll ${items.length * 4}s linear infinite`,
          width: "max-content",
        }}
      >
        {doubled.map((item, i) => (
          <div
            key={`${item.label}-${i}`}
            className="inline-flex items-center gap-2 px-4 border-r border-border/50"
            data-testid={`ticker-item-${i}`}
          >
            {item.type === "personal" ? (
              <User className="w-3 h-3 text-accent shrink-0" />
            ) : (
              <Trophy className="w-3 h-3 text-accent shrink-0" />
            )}
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {item.label}
            </span>
            <span className="text-sm font-bold text-foreground font-display">
              {item.value}
            </span>
            {item.change && (
              <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                item.direction === "up" ? "text-emerald-500" : item.direction === "down" ? "text-red-500" : "text-muted-foreground"
              }`}>
                {item.direction === "up" ? (
                  <TrendingUp className="w-3 h-3" />
                ) : item.direction === "down" ? (
                  <TrendingDown className="w-3 h-3" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
                {item.change}
              </span>
            )}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
