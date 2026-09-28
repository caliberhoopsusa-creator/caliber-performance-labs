/**
 * The CALIBER card front. Direction A, "Card Stock" (chosen 2026-09-23).
 *
 * The literal collectible: a generous stock margin, the photo sitting in a
 * ruled window, and the grade landing on a plate beneath it. It should read as
 * something you own, not as a screen.
 *
 * Slot order is fixed, top to bottom, no exceptions:
 *   1. rarity treatment (frame or foil, visual only, no text label on the front)
 *   2. player photo, tight crop face and shoulders, 4:5, in a ruled window
 *   3. player name, display, expanded black, single line, truncates
 *   4. position, class year, school, micro, uppercase, comma separated
 *   5. grade, on a plate ruled above and below, dominant, centred, tabular
 *   6. two standout stats, name in micro, value in the number face
 *   7. Caliber wordmark and profile URL, bottom right, micro, 0.62 opacity
 *
 * Never on the front: school logo, coach name, team record, highlight
 * thumbnail, share count, view count, badges. No charts, bars or meters. No
 * drop shadow; depth is the rarity treatment and the stock.
 *
 * One component serves all three targets. `size` picks the geometry: "story" is
 * 1080x1920, "feed" is 1080x1080, "app" fills its container. The fixed sizes
 * exist so a server render produces exactly what the player saw in the app.
 */
import { useEffect, useRef, useState } from "react";
import {
  color, font, radius, CARD_SIZE, PHOTO_ASPECT, NUMERIC_FEATURES, DISPLAY_AXES,
  fitNameSize, type as typeScale,
} from "./tokens";
import { rarityDefinition, type RarityTier } from "@shared/rarity";
import { CARD_ASSEMBLY, motionStep, prefersReducedMotion } from "./motion";
import { trendGlyph, trendLabel, type Trend } from "@shared/progression";

export interface CardStat {
  /** Short label, rendered uppercase. Example: "PPG". */
  label: string;
  /** Pre formatted. The card never does arithmetic. Example: "22.4". */
  value: string;
}

export interface CaliberCardProps {
  name: string;
  position: string;
  classYear: string;
  school: string;
  /** Letter grade, for example "A-". */
  grade: string;
  tier: RarityTier;
  /** Exactly two. More than two stops being a card and starts being a table. */
  stats: [CardStat, CardStat];
  photoUrl?: string | null;
  /** Shown bottom right beside the wordmark. */
  profileUrl: string;
  size?: "story" | "feed" | "app";
  /**
   * 30 day grade trend (pivot Section 5).
   *
   * Rendered beside the grade as a modifier of it, NOT as an eighth slot. The
   * slot order in docs/CALIBER_DESIGN.md section 5 is fixed at seven; an arrow
   * that means "this number is moving" belongs to the number.
   */
  trend?: Trend | null;
  /** Skips the assembly animation. Required for a server side render. */
  isStatic?: boolean;
}

/**
 * Rarity frame. Visual only; the tier is never named on the front.
 *
 * The stock is set through a CSS variable rather than `background`, because a
 * later rule setting `background` directly would silently replace the whole
 * gradient and the frame would stop drawing.
 */
function frameStyle(tier: RarityTier, borderPx: number): React.CSSProperties {
  const stock = tier === "rookie" ? color.court : color.bone;
  const base: React.CSSProperties = { background: stock };

  switch (tier) {
    case "chrome":
      return { ...base, border: `${borderPx * 1.5}px solid ${color.gold}` };
    case "prism":
      return {
        border: `${borderPx}px solid transparent`,
        background:
          `linear-gradient(${stock}, ${stock}) padding-box,` +
          `linear-gradient(135deg, ${color.violet}, ${color.red}) border-box`,
      };
    case "hot":
      return { ...base, border: `${borderPx}px solid ${color.red}` };
    case "rookie":
      return { ...base, border: `${Math.max(1, borderPx / 2)}px dashed ${color.chalkStrong}` };
    case "base":
    default:
      return { ...base, border: `${Math.max(1, borderPx / 2)}px solid ${color.chalkStrong}` };
  }
}

/** Rookie is the only tier that sits on court rather than bone. */
function isDarkStock(tier: RarityTier): boolean {
  return tier === "rookie";
}

export function CaliberCard(props: CaliberCardProps) {
  const {
    name, position, classYear, school, grade, tier, stats,
    photoUrl, profileUrl, size = "app", trend = null, isStatic = false,
  } = props;

  const [reduced] = useState(() => isStatic || prefersReducedMotion());
  const rootRef = useRef<HTMLDivElement>(null);

  const fixed = size === "app" ? null : CARD_SIZE[size];
  const dark = isDarkStock(tier);
  const onStock = dark ? color.bone : color.ink;
  const onStockMuted = dark ? color.fog : "rgba(11, 11, 13, 0.62)";
  const ruleColor = dark ? color.chalkStrong : "rgba(11, 11, 13, 0.18)";

  /* Geometry scales off the card width so story, feed and app share one layout
     instead of three. 390 is the reference phone width, and every px() value
     below is a token authored at that reference. Mixing in numbers authored at
     1080 scales them twice and blows the card apart. */
  const width = fixed?.width ?? 390;
  const height = fixed?.height ?? 0;
  const u = width / 390;
  const px = (n: number) => `${Math.round(n * u)}px`;

  /* The photo absorbs whatever vertical space the other slots leave, holding
     4:5 by deriving its width from its height.
     It is deliberately NOT a fixed share of the canvas. Every fixed share had
     to be hand tuned per canvas and still overflowed the 1:1 feed card, where
     the same slots have 840 fewer pixels to live in. Letting the one flexible
     slot take the slack makes the layout fit any canvas by construction. */
  const tall = fixed ? height / width > 1.2 : false;

  /* The name is the second most important thing on the card, so it shrinks to
     fit rather than truncating. display-l is the ceiling. */
  const innerWidth = (fixed ? width : 390) - 2 * 24 * u;
  const nameSize = fitNameSize(name, innerWidth, Math.round(typeScale.displayL.size * u));

  const anim = (key: keyof typeof CARD_ASSEMBLY): React.CSSProperties => {
    if (isStatic) return {};
    const s = motionStep(CARD_ASSEMBLY[key], reduced);
    return { animation: `caliber-rise ${s.durationMs}ms ${s.delayMs}ms both` };
  };

  const displayFace: React.CSSProperties = {
    fontFamily: font.display,
    fontWeight: DISPLAY_AXES.fontWeight,
    fontStretch: DISPLAY_AXES.fontStretch,
  };

  return (
    <div
      ref={rootRef}
      data-caliber-card={size}
      data-tier={tier}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        width: fixed ? `${width}px` : "100%",
        height: fixed ? `${height}px` : "auto",
        borderRadius: `${Math.round(radius.card * u)}px`,
        padding: px(24),
        gap: px(16),
        overflow: "hidden",
        fontFamily: font.body,
        color: onStock,
        ...frameStyle(tier, Math.max(2, Math.round(2 * u))),
        ...anim("rarity"),
      }}
    >
      {/* Rookie carries the one piece of tier text permitted on a front. */}
      {tier === "rookie" && (
        <span
          style={{
            position: "absolute",
            top: px(16),
            left: px(16),
            ...displayFace,
            fontSize: px(11),
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: color.fog,
            border: `1px solid ${color.chalkStrong}`,
            borderRadius: `${radius.soft}px`,
            padding: `${px(3)} ${px(8)}`,
          }}
        >
          Rookie
        </span>
      )}

      {/* Slot 2: photo in a ruled window. */}
      <div
        style={{
          border: `1px solid ${ruleColor}`,
          padding: px(4),
          flex: fixed ? 1 : undefined,
          minHeight: 0,
          display: "flex",
          ...anim("photo"),
        }}
      >
        <div
          style={{
            /* In app the slot holds 4:5, which is what the brief specifies.
               On a fixed canvas it fills the window and crops instead: forcing
               4:5 against the short window a 1:1 feed card leaves collapses the
               photo to a stamp. The crop stays face and shoulders either way. */
            height: "100%",
            width: "100%",
            aspectRatio: fixed ? undefined : String(PHOTO_ASPECT),
            margin: "auto",
            background: dark ? "rgba(245,241,232,0.06)" : "rgba(11,11,13,0.07)",
            overflow: "hidden",
          }}
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : null}
        </div>
      </div>

      {/* Slots 3 and 4: identity. */}
      <div>
        <div
          style={{
            ...displayFace,
            fontSize: `${nameSize}px`,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {name}
        </div>
        <div
          style={{
            marginTop: px(6),
            fontSize: px(11),
            lineHeight: 1.4,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: onStockMuted,
          }}
        >
          {[position, classYear, school].filter(Boolean).join(", ")}
        </div>
      </div>

      {/* Slot 5: the grade, on its plate. The reason the card exists. */}
      <div
        style={{
          borderTop: `1px solid ${ruleColor}`,
          borderBottom: `1px solid ${ruleColor}`,
          padding: `${px(tall ? 20 : 12)} 0`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...anim("grade"),
        }}
      >
        <span
          style={{
            fontFamily: font.number,
            fontWeight: 700,
            fontSize: px(72),
            lineHeight: 1,
            letterSpacing: "-0.03em",
            fontVariantNumeric: "tabular-nums",
            fontFeatureSettings: NUMERIC_FEATURES,
          }}
        >
          {grade}
        </span>

        {/* The trend arrow. Flat renders nothing: an arrow that says "no
            change" is noise on a card, and the absence already says it. */}
        {trend && trend.direction !== "flat" && (
          <span
            role="img"
            aria-label={trendLabel(trend)}
            title={trendLabel(trend)}
            style={{
              marginLeft: px(8),
              alignSelf: "flex-start",
              marginTop: px(12),
              fontFamily: font.body,
              fontSize: px(22),
              lineHeight: 1,
              color: trend.direction === "up" ? color.red : onStockMuted,
            }}
          >
            {trendGlyph(trend.direction)}
          </span>
        )}
      </div>

      {/* Slot 6: exactly two stats. No bars, no meters. */}
      <div style={{ display: "flex", gap: px(20), ...anim("stats") }}>
        {stats.map((stat) => (
          <div key={stat.label}>
            <span
              style={{
                display: "block",
                fontSize: px(11),
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: onStockMuted,
              }}
            >
              {stat.label}
            </span>
            <span
              style={{
                fontFamily: font.number,
                fontWeight: 700,
                fontSize: px(22),
                letterSpacing: "-0.01em",
                fontVariantNumeric: "tabular-nums",
                fontFeatureSettings: NUMERIC_FEATURES,
              }}
            >
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* Slot 7: the watermark, on every render. */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "baseline",
          gap: px(8),
          opacity: 0.62,
          fontSize: px(11),
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        <span style={displayFace}>Caliber</span>
        <span style={{ textTransform: "none", letterSpacing: "0.02em" }}>{profileUrl}</span>
      </div>
    </div>
  );
}

/** Tier metadata for the card back, the only place the tier is named. */
export function cardBackTier(tier: RarityTier) {
  return rarityDefinition(tier);
}
