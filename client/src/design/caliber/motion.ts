/**
 * CALIBER motion.
 *
 * One choreographed moment per surface. The card assembles, the grade counts
 * up, the card flips, a promotion takes over the viewport. Nothing else moves.
 *
 * prefers-reduced-motion replaces every one of these with a 100ms opacity fade.
 * That is a hard rule, not a nicety: this product is aimed at teenagers on
 * phones, and a vestibular trigger on the one screen they came to look at is
 * not an acceptable trade for polish.
 *
 * Only compositor safe properties. Transform, opacity, clip-path. Never width,
 * height, top, left, margin or font-size.
 */

/** The single duration every animation collapses to under reduced motion. */
export const REDUCED_MOTION_MS = 100;

export const easing = {
  /** Grade count up. Fast start, long settle. */
  outCubic: "cubic-bezier(0.22, 1, 0.36, 1)",
  /** Card flip. Symmetrical, so the turn reads as one object. */
  inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
  /** Default for small state changes. */
  standard: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

/** Grade reveal. First render only, never on a re-render or a tab return. */
export const GRADE_REVEAL = {
  durationMs: 1200,
  easing: easing.outCubic,
  from: 0,
} as const;

/**
 * Card assembly, 1500ms end to end.
 *
 * Read as a sequence: the frame arrives, the player appears inside it, the
 * grade lands, and the supporting numbers follow it in. The grade is the only
 * slow step because it is the thing the player is waiting for.
 */
export interface AssemblyStep {
  /** ms after the sequence starts. */
  delayMs: number;
  durationMs: number;
}

export const CARD_ASSEMBLY = {
  rarity: { delayMs: 0, durationMs: 150 },
  photo: { delayMs: 100, durationMs: 200 },
  grade: { delayMs: 300, durationMs: 1200 },
  stats: { delayMs: 1000, durationMs: 200 },
} as const satisfies Record<string, AssemblyStep>;

/** Total wall clock for the assembly, derived so it cannot drift. */
export const CARD_ASSEMBLY_TOTAL_MS = Math.max(
  ...Object.values(CARD_ASSEMBLY).map((step) => step.delayMs + step.durationMs),
);

/** Card flip to the back. 3D transform, not a crossfade. */
export const CARD_FLIP = {
  durationMs: 600,
  easing: easing.inOut,
} as const;

/** Tier promotion. Full viewport, the frame draws itself around the card. */
export const TIER_PROMOTION = {
  durationMs: 2500,
  easing: easing.outCubic,
  /** Two short pulses, per the spec. Ignored where unsupported. */
  vibratePattern: [10, 60, 10] as const,
} as const;

/** Reads the user's preference. Safe to call during render. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Collapses any step to the reduced motion fade when the user asked for it.
 * Every CALIBER animation should read its timing through this.
 */
export function motionStep(step: AssemblyStep, reduced: boolean): AssemblyStep {
  return reduced ? { delayMs: 0, durationMs: REDUCED_MOTION_MS } : step;
}

/**
 * Fires the promotion haptic. No op where the API is missing, which is every
 * iOS browser, so the visual takeover must carry the moment on its own.
 */
export function promotionHaptic(reduced: boolean): void {
  if (reduced) return;
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate([...TIER_PROMOTION.vibratePattern]);
  } catch {
    // A blocked or throwing vibrate must never break the reveal.
  }
}
