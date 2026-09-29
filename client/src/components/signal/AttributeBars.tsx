import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getTier } from "@/lib/caliberTier";
import { usePrefersReducedMotion } from "./useCountUp";

/**
 * AttributeBars — 2K-style category ratings (scoring / playmaking / defense …)
 * computed from REAL stat splits. Tier-ramp fills with angled caps; fills
 * sweep in via compositor-only scaleX. Reduced motion renders the final frame.
 * (DESIGN-LANGUAGE §5.)
 */

export interface Attribute {
  label: string;
  /** Real 0–99 category rating — never a fabricated placeholder. */
  value: number;
}

export interface AttributeBarsProps {
  attributes: Attribute[];
  className?: string;
  "data-testid"?: string;
}

/** Angled right-hand cap on the fill — the console "blade" edge. */
const BAR_CAP_CLIP = "polygon(0 0, 100% 0, calc(100% - 5px) 100%, 0 100%)";
const STAGGER_MS = 90;

export function AttributeBars({
  attributes,
  className,
  "data-testid": testId,
}: AttributeBarsProps) {
  const reduced = usePrefersReducedMotion();
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setArmed(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  if (attributes.length === 0) return null;
  const on = reduced || armed;

  return (
    <div className={cn("flex flex-col gap-2.5", className)} data-testid={testId}>
      {attributes.map((attr, i) => {
        const tier = getTier(attr.value);
        return (
          <div key={attr.label}>
            <div className="mb-1 flex items-baseline justify-between">
              <span
                className="uppercase"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 500,
                  fontStretch: "70%",
                  fontSize: "var(--text-label)",
                  letterSpacing: "0.18em",
                  color: "hsl(var(--silver-lo))",
                }}
              >
                {attr.label}
              </span>
              <span
                className="tabular-nums"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-data)",
                  fontWeight: 500,
                  color: `hsl(var(${tier.cssVar}))`,
                }}
              >
                {attr.value}
              </span>
            </div>
            <div
              className="h-1.5 overflow-hidden"
              style={{
                backgroundColor: "hsl(var(--silver) / 0.08)",
                clipPath: BAR_CAP_CLIP,
              }}
            >
              <div
                className="h-full origin-left"
                style={{
                  width: `${Math.max(0, Math.min(99, attr.value))}%`,
                  backgroundColor: `hsl(var(${tier.cssVar}))`,
                  clipPath: BAR_CAP_CLIP,
                  transform: on ? "scaleX(1)" : "scaleX(0)",
                  transition: reduced
                    ? "none"
                    : `transform 600ms var(--ease-out-expo) ${150 + i * STAGGER_MS}ms`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
