import { cn } from "@/lib/utils";
import { useCountUp } from "./useCountUp";

/**
 * StatNumber — THE signature SIGNAL component.
 * Archivo Expanded Black numeral (tabular), broadcast-style count-up on mount,
 * Condensed-caps label underneath. Respects prefers-reduced-motion by
 * rendering the final value statically.
 */

type Size = "sm" | "md" | "lg";

const SIZE_STYLES: Record<Size, { fontSize: string }> = {
  sm: { fontSize: "var(--text-title)" },
  md: { fontSize: "var(--text-stat)" },
  lg: { fontSize: "var(--text-hero)" },
};

export interface StatNumberProps {
  /** The real value to display — never invent one. */
  value: number;
  /** Condensed-caps label rendered under the numeral. */
  label: string;
  /** Decimal places to render (default 0). */
  decimals?: number;
  /** Rendered before the numeral, e.g. "+". */
  prefix?: string;
  /** Rendered after the numeral, e.g. "%". */
  suffix?: string;
  size?: Size;
  className?: string;
  "data-testid"?: string;
}

export function StatNumber({
  value,
  label,
  decimals = 0,
  prefix = "",
  suffix = "",
  size = "md",
  className,
  "data-testid": testId,
}: StatNumberProps) {
  const display = useCountUp(value);

  return (
    <div className={cn("flex flex-col", className)} data-testid={testId}>
      <span
        className="leading-none tracking-tight tabular-nums"
        style={{
          fontFamily: "var(--font-athletic)",
          fontWeight: 900,
          fontStretch: "125%",
          fontSize: SIZE_STYLES[size].fontSize,
          fontVariantNumeric: "tabular-nums lining-nums",
        }}
      >
        {prefix}
        {display.toFixed(decimals)}
        {suffix}
      </span>
      <span
        className="mt-1.5 uppercase text-muted-foreground"
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 500,
          fontStretch: "70%",
          fontSize: "var(--text-label)",
          letterSpacing: "0.18em",
        }}
      >
        {label}
      </span>
    </div>
  );
}
