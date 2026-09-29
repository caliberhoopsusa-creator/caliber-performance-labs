import { cn } from "@/lib/utils";
import { getTier } from "@/lib/caliberTier";
import { useCountUp } from "./useCountUp";

/**
 * OvrPlate — the Caliber Score as a 2K-style overall rating: an angled shield
 * plate (.angle-cut) carrying a leaned two-digit Archivo Expanded Black
 * numeral in the tier's color, with a condensed-caps label beneath.
 * Hero of the profile + share card (DESIGN-LANGUAGE §5).
 *
 * The score must be REAL (or rendered inside an explicitly-labeled demo
 * context) — this component never invents a number.
 */

type Size = "md" | "lg";

const SIZE_STYLES: Record<
  Size,
  { plate: string; numeral: string; label: string }
> = {
  md: { plate: "px-4 py-2.5", numeral: "var(--text-stat)", label: "0.5625rem" },
  lg: { plate: "px-5 py-3", numeral: "var(--text-hero)", label: "var(--text-label)" },
};

export interface OvrPlateProps {
  /** The real 0–99 Caliber Score. */
  score: number;
  /** Condensed-caps label under the numeral (default "CALIBER SCORE"). */
  label?: string;
  size?: Size;
  /** Count up from 0 on mount (reduced-motion renders the final frame). */
  animate?: boolean;
  className?: string;
  "data-testid"?: string;
}

export function OvrPlate({
  score,
  label = "CALIBER SCORE",
  size = "md",
  animate = true,
  className,
  "data-testid": testId,
}: OvrPlateProps) {
  const counted = useCountUp(animate ? score : 0);
  const display = animate ? Math.round(counted) : score;
  const tier = getTier(score);
  const s = SIZE_STYLES[size];

  return (
    <div
      className={cn(
        "angle-cut lean inline-flex flex-col items-center border",
        s.plate,
        className,
      )}
      style={{
        backgroundColor: "hsl(var(--obsidian-2))",
        borderColor: "hsl(var(--line))",
        boxShadow: `inset 0 1px 0 hsl(var(--silver) / 0.08), 0 0 24px hsl(var(${tier.cssVar}) / 0.12)`,
      }}
      data-testid={testId}
    >
      <span
        className="leading-none tabular-nums"
        style={{
          fontFamily: "var(--font-athletic)",
          fontWeight: 900,
          fontStretch: "125%",
          fontSize: s.numeral,
          letterSpacing: "-0.02em",
          color: `hsl(var(${tier.cssVar}))`,
          fontVariantNumeric: "tabular-nums lining-nums",
        }}
      >
        {display}
      </span>
      <span
        className="mt-1 uppercase"
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 500,
          fontStretch: "70%",
          fontSize: s.label,
          letterSpacing: "0.18em",
          color: "hsl(var(--silver-lo))",
        }}
      >
        {label}
      </span>
    </div>
  );
}
