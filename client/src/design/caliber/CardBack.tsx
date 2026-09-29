/**
 * The CALIBER card back.
 *
 * The front is the recognition moment and is kept deliberately bare. The back
 * is where the evidence lives, for the player who wants to know why the number
 * says what it says.
 *
 * Holds, in order:
 *   1. rarity tier label, the ONLY place the tier is named
 *   2. the full stat line
 *   3. grade history as a LINE, never a table
 *   4. the highlight clip embed
 *
 * Still no tables. A stat line is a row of labelled numbers, not a grid, and
 * grade history is a shape you read at a glance, not rows you scan.
 */
import { color, font, radius, NUMERIC_FEATURES, DISPLAY_AXES } from "./tokens";
import { rarityDefinition, rarityBlurb, type RarityTier } from "@shared/rarity";
import { CARD_FLIP, prefersReducedMotion, REDUCED_MOTION_MS } from "./motion";

export interface GradePoint {
  /** ISO date or anything Date can parse. */
  at: string | Date;
  /** Numeric grade value, higher is better. */
  value: number;
}

export interface CaliberCardBackProps {
  tier: RarityTier;
  /** Every stat worth showing, already formatted. */
  statLine: Array<{ label: string; value: string }>;
  /** Oldest first. Two points or more draws a line; fewer says so plainly. */
  history: GradePoint[];
  /** Embed URL for the highlight clip, if the player has one. */
  highlightUrl?: string | null;
  /**
   * Percentile within class year and position, or null when the cohort is too
   * small to rank. Null changes the line under the tier, because unranked and
   * ranked-but-average are different things to be told.
   */
  percentile?: number | null;
}

const TIER_COLOR: Record<RarityTier, string> = {
  chrome: color.gold,
  prism: color.violet,
  hot: color.red,
  base: color.steel,
  rookie: color.fog,
};

/**
 * Grade history as a single polyline.
 *
 * Deliberately not a chart: no axes, no gridlines, no tooltips. The question it
 * answers is "is it going up", which is a shape, not a dataset. Drawn in SVG
 * because it is a dozen points, not a visualisation library's worth of work.
 */
function HistoryLine({ history, stroke }: { history: GradePoint[]; stroke: string }) {
  const W = 300;
  const H = 64;

  if (history.length < 2) {
    return (
      <div
        style={{
          height: H,
          display: "flex",
          alignItems: "center",
          fontSize: 13,
          color: color.fog,
        }}
      >
        Log another game to start your grade history.
      </div>
    );
  }

  const values = history.map((h) => h.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  // A flat history would divide by zero, so give it a floor and draw a level line.
  const span = max - min || 1;

  const points = history
    .map((h, i) => {
      const x = (i / (history.length - 1)) * W;
      const y = H - ((h.value - min) / span) * H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const last = history[history.length - 1]!;
  const lastX = W;
  const lastY = H - ((last.value - min) / span) * H;

  return (
    <svg
      viewBox={`0 0 ${W} ${H + 8}`}
      width="100%"
      height={H + 8}
      role="img"
      aria-label={`Grade history, ${history.length} games, currently ${last.value}`}
      style={{ overflow: "visible" }}
    >
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* The endpoint is the only emphasised mark: it is where the player is now. */}
      <circle cx={lastX} cy={lastY} r={4} fill={stroke} />
    </svg>
  );
}

export function CaliberCardBack({
  tier, statLine, history, highlightUrl, percentile,
}: CaliberCardBackProps) {
  const def = rarityDefinition(tier);
  const accent = TIER_COLOR[tier];
  const blurb = rarityBlurb(tier, percentile);

  return (
    <div
      data-caliber-card-back
      data-tier={tier}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        padding: 24,
        borderRadius: radius.card,
        background: color.court,
        color: color.bone,
        border: `1px solid ${color.chalkStrong}`,
        fontFamily: font.body,
      }}
    >
      {/* 1. The tier, named. The front never does this. */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <span
          style={{
            fontFamily: font.display,
            fontWeight: DISPLAY_AXES.fontWeight,
            fontStretch: DISPLAY_AXES.fontStretch,
            fontSize: 22,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: accent,
          }}
        >
          {def.label}
        </span>
        <span style={{ fontSize: 13, color: color.fog }}>{blurb}</span>
      </div>

      {/* 2. The full stat line. A row of labelled numbers, not a grid. */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        {statLine.map((s) => (
          <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span
              style={{
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: color.fog,
              }}
            >
              {s.label}
            </span>
            <span
              style={{
                fontFamily: font.number,
                fontWeight: 500,
                fontSize: 22,
                fontVariantNumeric: "tabular-nums",
                fontFeatureSettings: NUMERIC_FEATURES,
              }}
            >
              {s.value}
            </span>
          </div>
        ))}
      </div>

      {/* 3. Grade history, as a line. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span
          style={{
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: color.fog,
          }}
        >
          Grade history
        </span>
        <HistoryLine history={history} stroke={accent} />
      </div>

      {/* 4. The highlight clip. */}
      {highlightUrl ? (
        <div
          style={{
            aspectRatio: "16 / 9",
            borderRadius: radius.soft,
            overflow: "hidden",
            background: "rgba(245,241,232,0.06)",
          }}
        >
          <iframe
            src={highlightUrl}
            title="Highlight clip"
            allow="accelerometer; encrypted-media; picture-in-picture"
            allowFullScreen
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
          />
        </div>
      ) : null}
    </div>
  );
}

/**
 * Flip container. 3D transform, not a crossfade: the two faces belong to one
 * object and the turn is what says so.
 */
export function CaliberCardFlip({
  front,
  back,
  flipped,
}: {
  front: React.ReactNode;
  back: React.ReactNode;
  flipped: boolean;
}) {
  const reduced = prefersReducedMotion();
  const duration = reduced ? REDUCED_MOTION_MS : CARD_FLIP.durationMs;

  const face: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
  };

  return (
    <div style={{ perspective: 1600 }}>
      <div
        style={{
          position: "relative",
          transformStyle: "preserve-3d",
          transition: `transform ${duration}ms ${CARD_FLIP.easing}`,
          // Reduced motion gets a fade between faces rather than a rotation.
          transform: reduced ? undefined : `rotateY(${flipped ? 180 : 0}deg)`,
        }}
      >
        <div style={{ ...face, position: "relative", opacity: reduced && flipped ? 0 : 1 }}>
          {front}
        </div>
        <div
          style={{
            ...face,
            transform: reduced ? undefined : "rotateY(180deg)",
            opacity: reduced && !flipped ? 0 : 1,
          }}
        >
          {back}
        </div>
      </div>
    </div>
  );
}
