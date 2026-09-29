import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUp, ArrowDown, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTier, tierColor } from "@/lib/caliberTier";

type Size = "sm" | "md" | "lg";

const DIMS: Record<Size, { box: number; num: string; label: string; tier: string }> = {
  sm: { box: 88, num: "text-2xl", label: "text-[9px]", tier: "text-[10px]" },
  md: { box: 120, num: "text-4xl", label: "text-[10px]", tier: "text-xs" },
  lg: { box: 168, num: "text-6xl", label: "text-xs", tier: "text-sm" },
};

// SVG ring geometry (fixed viewBox, scaled by width/height)
const R = 52;
const CIRC = 2 * Math.PI * R;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

interface CaliberScoreProps {
  /** 0–99 overall rating, or null when not yet earned */
  score: number | null;
  delta?: number | null;
  /** real percentile context if available; falls back to the tier blurb */
  percentile?: number | null;
  size?: Size;
  className?: string;
}

/** The signature Caliber Score — an animated, tier-colored ring. */
export function CaliberScore({ score, delta, percentile, size = "md", className }: CaliberScoreProps) {
  const reduced = usePrefersReducedMotion();
  const dims = DIMS[size];
  const hasScore = typeof score === "number" && score > 0;
  const clamped = hasScore ? Math.max(0, Math.min(99, Math.round(score as number))) : 0;
  const tier = getTier(clamped);
  const color = hasScore ? tierColor(tier.cssVar) : "hsl(var(--muted-foreground))";

  // Animate the ring fill from empty → target on mount.
  const [offset, setOffset] = useState(CIRC);
  const mounted = useRef(false);
  useEffect(() => {
    const target = CIRC * (1 - (hasScore ? clamped / 99 : 0));
    if (reduced) {
      setOffset(target);
      return;
    }
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setOffset(target)));
    mounted.current = true;
    return () => cancelAnimationFrame(id);
  }, [clamped, hasScore, reduced]);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: dims.box, height: dims.box }}>
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
          {/* track */}
          <circle cx="60" cy="60" r={R} fill="none" stroke="hsl(var(--foreground) / 0.08)" strokeWidth="9" />
          {/* value */}
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
            style={{
              transition: reduced ? "none" : "stroke-dashoffset 1.1s cubic-bezier(0.16,1,0.3,1)",
              filter: hasScore ? `drop-shadow(0 0 6px ${tierColor(tier.cssVar, 0.5)})` : undefined,
            }}
          />
        </svg>
        {/* center readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn("font-display leading-none tabular-nums", dims.num)}
            style={{ color: hasScore ? color : undefined }}
            data-testid="caliber-score-value"
          >
            {hasScore ? clamped : "—"}
          </span>
          <span className={cn("font-display tracking-[0.2em] text-muted-foreground mt-0.5", dims.label)}>OVR</span>
        </div>
      </div>

      {/* tier + context */}
      <div className="mt-3 text-center">
        {hasScore ? (
          <>
            <div className="flex items-center justify-center gap-2">
              <span
                className={cn("font-display tracking-[0.18em]", dims.tier)}
                style={{ color }}
                data-testid="caliber-score-tier"
              >
                {tier.label}
              </span>
              {typeof delta === "number" && delta !== 0 && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 font-medium",
                    size === "sm" ? "text-[10px]" : "text-xs",
                    delta > 0 ? "text-emerald-400" : "text-red-400",
                  )}
                >
                  {delta > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {Math.abs(delta)}
                </span>
              )}
            </div>
            <p className="mt-1 font-label text-muted-foreground">
              {typeof percentile === "number"
                ? `Top ${Math.max(1, 100 - Math.round(percentile))}% · ${tier.blurb}`
                : tier.blurb}
            </p>
          </>
        ) : (
          <p className="flex items-center justify-center gap-1.5 font-label text-muted-foreground">
            <Lock className="h-3 w-3" /> Log games to unlock
          </p>
        )}
      </div>
    </div>
  );
}

interface PlayerCaliberScoreProps {
  playerId: string | number;
  size?: Size;
  className?: string;
}

interface AiRatingResponse {
  overallRating: number | null;
  percentileRank?: number | null;
  delta?: number | null;
}

/** Connected variant — fetches the player's AI rating and renders the signature score. */
export function PlayerCaliberScore({ playerId, size = "md", className }: PlayerCaliberScoreProps) {
  const { data, isLoading } = useQuery<AiRatingResponse>({
    queryKey: ["/api/players", String(playerId), "ai-rating"],
    enabled: playerId != null && playerId !== "",
  });

  if (isLoading) {
    const box = DIMS[size].box;
    return (
      <div className={cn("flex flex-col items-center", className)}>
        <div
          className="rounded-full animate-pulse bg-foreground/[0.06]"
          style={{ width: box, height: box }}
          aria-label="Loading Caliber Score"
        />
      </div>
    );
  }

  return (
    <CaliberScore
      score={data?.overallRating ?? null}
      percentile={data?.percentileRank ?? null}
      delta={data?.delta ?? null}
      size={size}
      className={className}
    />
  );
}
