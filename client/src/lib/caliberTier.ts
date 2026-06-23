// Caliber Score tier system — turns a 0–99 overall rating into a meaningful tier.
// Color tokens live in index.css (--tier-*). Keep thresholds in one place.

export type TierKey = "elite" | "strong" | "solid" | "developing" | "raw";

export interface Tier {
  key: TierKey;
  label: string;
  /** CSS custom property holding the tier's HSL triplet, e.g. "--tier-elite" */
  cssVar: string;
  /** Short, meaningful context line shown under the score */
  blurb: string;
}

const TIERS: ReadonlyArray<{ min: number } & Tier> = [
  { min: 90, key: "elite", label: "ELITE", cssVar: "--tier-elite", blurb: "Top-tier — D1 caliber" },
  { min: 80, key: "strong", label: "STRONG", cssVar: "--tier-strong", blurb: "Varsity caliber" },
  { min: 70, key: "solid", label: "SOLID", cssVar: "--tier-solid", blurb: "Rising prospect" },
  { min: 60, key: "developing", label: "DEVELOPING", cssVar: "--tier-developing", blurb: "On the climb" },
  { min: 0, key: "raw", label: "RAW", cssVar: "--tier-raw", blurb: "Building the base" },
];

export function getTier(score: number): Tier {
  const t = TIERS.find((tier) => score >= tier.min) ?? TIERS[TIERS.length - 1];
  return { key: t.key, label: t.label, cssVar: t.cssVar, blurb: t.blurb };
}

/** Convenience: full hsl() color string for a tier, optional alpha. */
export function tierColor(cssVar: string, alpha = 1): string {
  return alpha === 1 ? `hsl(var(${cssVar}))` : `hsl(var(${cssVar}) / ${alpha})`;
}
