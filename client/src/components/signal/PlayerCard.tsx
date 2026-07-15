import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { OvrPlate } from "./OvrPlate";
import { AttributeBars, type Attribute } from "./AttributeBars";
import { GradeBadge } from "./GradeBadge";

/**
 * PlayerCard — the gamertag-style identity block: name, position/#, school,
 * OVR plate, and a grade row or attribute bars. One component reused on the
 * profile hero, share card, leaderboard rows, and scout views
 * (DESIGN-LANGUAGE §5). Plastic-glass finish (.gloss), obsidian-1 surface,
 * --line border.
 *
 * Honesty rule: all values are passed in — the card renders REAL data, or an
 * explicitly-labeled demo (set `demo` to show the DEMO chip). It never
 * fabricates a stat.
 */

export interface PlayerCardProps {
  name: string;
  /** e.g. "PG" */
  position: string;
  /** e.g. "00" — rendered as #00 in the telemetry voice. */
  jerseyNumber?: string;
  /** School / program line, e.g. "Your School · MT". */
  school: string;
  /** The real 0–99 Caliber Score (or a demo value inside a labeled demo). */
  score: number;
  /** 2K-style category ratings; rendered as AttributeBars when present. */
  attributes?: Attribute[];
  /** Recent letter grades; rendered as a GradeBadge row when present. */
  grades?: string[];
  /** Marks the card as a product demo — renders the DEMO chip. */
  demo?: boolean;
  /** Optional avatar slot rendered beside the name block (e.g. a photo). */
  avatar?: ReactNode;
  /** Optional footer slot (e.g. a telemetry line or CTA). */
  footer?: ReactNode;
  className?: string;
  "data-testid"?: string;
}

const CONDENSED_CAPS: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 500,
  fontStretch: "70%",
  fontSize: "var(--text-label)",
  letterSpacing: "0.18em",
};

export function PlayerCard({
  name,
  position,
  jerseyNumber,
  school,
  score,
  attributes,
  grades,
  demo = false,
  avatar,
  footer,
  className,
  "data-testid": testId,
}: PlayerCardProps) {
  return (
    <article
      className={cn("gloss relative rounded-card border p-5 sm:p-6", className)}
      style={{
        backgroundColor: "hsl(var(--obsidian-1))",
        borderColor: "hsl(var(--line))",
        boxShadow: "0 24px 64px hsl(var(--obsidian-0) / 0.6)",
      }}
      data-testid={testId}
    >
      {/* header — card kind + demo flag */}
      <header className="mb-5 flex items-center justify-between gap-3">
        <span className="uppercase" style={{ ...CONDENSED_CAPS, color: "hsl(var(--silver-lo))" }}>
          Caliber ID
        </span>
        {demo && (
          <span
            className="angle-cut inline-flex items-center border px-2 py-1 uppercase"
            style={{
              ...CONDENSED_CAPS,
              color: "hsl(var(--crimson-hot))",
              borderColor: "hsl(var(--crimson) / 0.45)",
              backgroundColor: "hsl(var(--crimson) / 0.08)",
            }}
            data-testid={testId ? `${testId}-demo-chip` : undefined}
          >
            Demo
          </span>
        )}
      </header>

      {/* identity row — leaned name block + OVR plate. Wraps on narrow
          viewports (long names + the plate exceed ~320px otherwise). */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        {avatar && <div className="shrink-0">{avatar}</div>}
        <div className="lean min-w-[9rem] flex-1 pl-1">
          <div className="lean-reset">
            <h3
              className="uppercase leading-none"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 900,
                fontStretch: "125%",
                fontSize: "var(--text-title)",
                letterSpacing: "-0.01em",
                color: "hsl(var(--silver-hi))",
              }}
            >
              {name}
            </h3>
            <p
              className="mt-2 tabular-nums"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-data)",
                color: "hsl(var(--silver-lo))",
              }}
            >
              {position}
              {jerseyNumber ? ` · #${jerseyNumber}` : ""}
            </p>
            <p
              className="mt-1"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-body)",
                color: "hsl(var(--silver-lo))",
              }}
            >
              {school}
            </p>
          </div>
        </div>
        <OvrPlate
          score={score}
          className="shrink-0"
          data-testid={testId ? `${testId}-ovr` : undefined}
        />
      </div>

      {/* attribute bars / grade row */}
      {attributes && attributes.length > 0 && (
        <AttributeBars
          attributes={attributes}
          className="mt-6 border-t pt-5"
          data-testid={testId ? `${testId}-attributes` : undefined}
        />
      )}
      {grades && grades.length > 0 && (
        <div
          className="mt-6 flex items-center gap-2 border-t pt-5"
          style={{ borderColor: "hsl(var(--line))" }}
        >
          {grades.map((g, i) => (
            <GradeBadge key={`${g}-${i}`} grade={g} size="sm" />
          ))}
        </div>
      )}

      {footer && <div className="mt-5">{footer}</div>}
    </article>
  );
}
