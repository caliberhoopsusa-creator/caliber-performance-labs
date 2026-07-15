import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * StatNumber — THE signature SIGNAL component.
 * Archivo Expanded Black numeral (tabular), broadcast-style count-up on mount,
 * Condensed-caps label underneath. Respects prefers-reduced-motion by
 * rendering the final value statically.
 */

const COUNT_UP_MS = 900;

/** ease-out-expo — matches --ease-out-expo for JS-driven motion */
function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

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
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_UP_MS);
      setDisplay(value * easeOutExpo(t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduced]);

  return (
    <div className={cn("flex flex-col", className)} data-testid={testId}>
      <span
        className="leading-none tracking-tight tabular-nums"
        style={{
          fontFamily: "var(--font-display)",
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
