import { useMemo } from "react";
import { format } from "date-fns";
import { Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Game } from "@shared/schema";

interface PersonalBestsProps {
  games: Game[];
}

interface CareerHigh {
  label: string;
  key: string;
  value: number;
  opponent: string;
  date: string;
}

const STAT_CONFIGS = [
  { label: "Points", key: "points", field: "points" as const },
  { label: "Rebounds", key: "rebounds", field: "rebounds" as const },
  { label: "Assists", key: "assists", field: "assists" as const },
  { label: "Steals", key: "steals", field: "steals" as const },
  { label: "Blocks", key: "blocks", field: "blocks" as const },
  { label: "3-Pointers Made", key: "three-pointers", field: "threeMade" as const },
] as const;

export function PersonalBests({ games }: PersonalBestsProps) {
  const careerHighs = useMemo(() => {
    if (games.length === 0) return [];

    return STAT_CONFIGS.map(({ label, key, field }) => {
      let maxValue = -1;
      let bestGame: Game | null = null;

      for (const game of games) {
        const val = game[field] ?? 0;
        if (val > maxValue) {
          maxValue = val;
          bestGame = game;
        }
      }

      return {
        label,
        key,
        value: maxValue,
        opponent: bestGame?.opponent ?? "",
        date: bestGame?.date ?? "",
      } as CareerHigh;
    });
  }, [games]);

  if (games.length === 0) return null;

  return (
    <div data-testid="personal-bests">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
          <Trophy className="w-5 h-5 text-accent" style={{ filter: "drop-shadow(0 0 6px hsl(var(--accent) / 0.6))" }} />
        </div>
        <h3 className="text-lg font-bold font-display bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent">
          Personal Bests
        </h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {careerHighs.map((stat) => (
          <Card
            key={stat.key}
            className="bg-card/50 border border-border rounded-md p-4"
            data-testid={`personal-best-${stat.key}`}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              {stat.label}
            </p>
            <p className="text-2xl font-bold font-display text-foreground">
              {stat.value}
            </p>
            {stat.opponent && stat.date && (
              <p className="text-xs text-muted-foreground mt-1">
                vs {stat.opponent} - {format(new Date(stat.date), "MMM d, yyyy")}
              </p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
