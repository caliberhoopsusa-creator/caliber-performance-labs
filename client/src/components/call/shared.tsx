import type { CSSProperties, ReactNode, Ref } from "react";
import { SectionEyebrow } from "@/components/signal";

/**
 * Chrome text sheen — liquid metal is a core identity material
 * (DESIGN-LANGUAGE §4): the same silver band as the hero wordmark, applied
 * to scene identity moments. Static paint (never animated) — token-only.
 */
export const METAL_TEXT_STYLE: CSSProperties = {
  /* ends on silver-lo (not -mute) so trailing glyphs stay legible on obsidian */
  backgroundImage:
    "linear-gradient(100deg, hsl(var(--silver-lo)) 0%, hsl(var(--silver)) 22%, hsl(var(--silver-hi)) 48%, hsl(var(--silver)) 72%, hsl(var(--silver-lo)) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

/**
 * call/shared — scaffolding for the landing's scroll-driven beats
 * (DESIGN-LANGUAGE §4.5). One tall wrapper per beat drives scroll progress;
 * a CSS `position: sticky` stage pins the visual (no JS pinning — the wheel
 * is never hijacked). Reduced motion: the SAME content renders as a normal
 * editorial section — no pinning, no scrubbing, final state visible.
 */

export interface ScrollSceneProps {
  /** Scene label — "01 · The Game". The numbered eyebrow IS the navigation. */
  eyebrow: string;
  /** Wrapper height in vh (motion path only) — 150–250 feels roomy. */
  heightVh: number;
  /** Static editorial branch (prefers-reduced-motion). */
  reduced: boolean;
  /** Ref to the tall wrapper — the scroll-scrub driver. */
  driverRef?: Ref<HTMLElement>;
  /** Widest content column. */
  maxWidth?: string;
  children: ReactNode;
  "data-testid"?: string;
}

export function ScrollScene({
  eyebrow,
  heightVh,
  reduced,
  driverRef,
  maxWidth = "56rem",
  children,
  "data-testid": testId,
}: ScrollSceneProps) {
  if (reduced) {
    return (
      <section className="relative px-5 py-section sm:px-8" data-testid={testId}>
        <div className="mx-auto w-full" style={{ maxWidth }}>
          <SectionEyebrow className="mb-6 sm:mb-10">{eyebrow}</SectionEyebrow>
          {children}
        </div>
      </section>
    );
  }
  return (
    <section
      ref={driverRef}
      className="relative"
      style={{ height: `${heightVh}vh` }}
      data-testid={testId}
    >
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden px-5 sm:px-8">
        <div className="mx-auto w-full" style={{ maxWidth }}>
          <SectionEyebrow className="mb-6 sm:mb-10">{eyebrow}</SectionEyebrow>
          {children}
        </div>
      </div>
    </section>
  );
}

/**
 * Scene-resolution headline — Geist, sentence case, metal-led (operator
 * 2026-07-17: Apple-marketing-clean direction). Defaults to the chrome sheen
 * (`METAL_TEXT_STYLE`) so plain text-node children read as liquid metal;
 * a child span can still override with an explicit crimson color for the
 * one payoff word a scene earns. `lean` (the console skew) now defaults OFF
 * — reserved for genuine hero/climax moments, not every scene headline.
 */
export function SceneHead({
  children,
  className = "",
  lean = false,
  metal = true,
  headRef,
  "data-testid": testId,
}: {
  children: ReactNode;
  className?: string;
  lean?: boolean;
  metal?: boolean;
  headRef?: Ref<HTMLHeadingElement>;
  "data-testid"?: string;
}) {
  return (
    <h3
      ref={headRef}
      className={`${lean ? "lean " : ""}leading-none text-title ${className}`}
      style={{
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        letterSpacing: "-0.02em",
        ...(metal ? METAL_TEXT_STYLE : { color: "hsl(var(--foreground))" }),
      }}
      data-testid={testId}
    >
      {children}
    </h3>
  );
}

/** Small mono telemetry chip — timestamps, demo labels, scout pings. */
export function MonoChip({
  children,
  tone = "silver",
  className = "",
  chipRef,
  "data-testid": testId,
}: {
  children: ReactNode;
  tone?: "silver" | "crimson";
  className?: string;
  chipRef?: Ref<HTMLSpanElement>;
  "data-testid"?: string;
}) {
  const crimson = tone === "crimson";
  return (
    <span
      ref={chipRef}
      className={`angle-cut inline-flex items-center gap-2 border px-3 py-1.5 font-mono uppercase tracking-wider ${className}`}
      style={{
        fontSize: "var(--text-data)",
        color: crimson ? "hsl(var(--crimson-hot))" : "hsl(var(--silver-lo))",
        borderColor: crimson ? "hsl(var(--crimson) / 0.4)" : "hsl(var(--line))",
        backgroundColor: crimson
          ? "hsl(var(--crimson) / 0.08)"
          : "hsl(var(--obsidian-2) / 0.7)",
      }}
      data-testid={testId}
    >
      {children}
    </span>
  );
}
