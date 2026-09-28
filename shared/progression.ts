/**
 * Grade progression: triggers, events and the trend (pivot Section 5).
 *
 * Pure module. The server records history and emits; the client renders the
 * arrow. Both import the rules from here so a trend shown on a card matches the
 * trend that fired the event.
 */
import type { RarityTier } from "./rarity";

/* ----------------------------------------------------------- the grade */

/**
 * The letter ladder. One definition, imported everywhere.
 *
 * It was previously duplicated in four places (the OG route, rarityService,
 * PlayerHome and CaliberCardPage), which is how they drifted apart.
 */
export const GRADE_LADDER: ReadonlyArray<readonly [string, number]> = [
  ["A+", 100], ["A", 95], ["A-", 90],
  ["B+", 88], ["B", 85], ["B-", 80],
  ["C+", 78], ["C", 75], ["C-", 70],
  ["D+", 68], ["D", 65], ["D-", 60],
  ["F", 50],
];

const GRADE_VALUES: Record<string, number> = Object.fromEntries(GRADE_LADDER);

export function gradeToValue(grade: string | null | undefined): number | null {
  if (!grade) return null;
  return GRADE_VALUES[grade.trim().toUpperCase()] ?? null;
}

/** Nearest letter to a numeric value, for a recomputed average. */
export function valueToGrade(value: number): string {
  let best = GRADE_LADDER[GRADE_LADDER.length - 1]!;
  let bestDistance = Infinity;
  for (const entry of GRADE_LADDER) {
    const distance = Math.abs(entry[1] - value);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = entry;
    }
  }
  return best[0];
}

/**
 * THE Caliber Grade: the mean of every graded game.
 *
 * Not the most recent game's grade. The product calls this "the credit score
 * for basketball players", and a credit score is an aggregate, not your last
 * transaction. It is also what the rarity percentile already ranks on, and a
 * 30 day trend against a single most recent game would swing on one bad night.
 *
 * Returns null with no graded games. There is no grade to show yet, and a zero
 * would put a number on the card the player never earned.
 */
export function caliberGrade(
  grades: Array<string | null | undefined>,
): { grade: string; value: number } | null {
  const values = grades
    .map(gradeToValue)
    .filter((v): v is number => v !== null);

  if (values.length === 0) return null;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return { grade: valueToGrade(mean), value: Math.round(mean) };
}

/* ------------------------------------------------------------- triggers */

/**
 * What caused a recomputation.
 *
 * Recorded on every history row, because a player asking "why did my grade
 * move" deserves an answer, and so does whoever debugs it.
 */
export const GRADE_TRIGGERS = [
  "game_logged",
  "film_uploaded",
  "coach_cosign",
  "nightly",
] as const;

export type GradeTrigger = (typeof GRADE_TRIGGERS)[number];

/* ---------------------------------------------------------------- events */

export const PROGRESSION_EVENTS = [
  "grade_up",
  "grade_down",
  "tier_promoted",
  "tier_demoted",
] as const;

export type ProgressionEventName = (typeof PROGRESSION_EVENTS)[number];

export interface ProgressionEvent {
  name: ProgressionEventName;
  playerId: number;
  /** What caused the recomputation that produced this event. */
  trigger: GradeTrigger;
  at: Date;
  grade: { from: string | null; to: string };
  gradeValue: { from: number | null; to: number };
  tier: { from: RarityTier | null; to: RarityTier | null };
}

/* ----------------------------------------------------------------- trend */

export type TrendDirection = "up" | "down" | "flat";

export interface Trend {
  direction: TrendDirection;
  /** Change in grade value over the window. 0 when flat or unknowable. */
  delta: number;
  /** How many history points the window actually contained. */
  samples: number;
}

/** The window the card's arrow covers. */
export const TREND_WINDOW_DAYS = 30;

/**
 * A movement smaller than this is treated as flat.
 *
 * Grade values are spaced ~2 to 5 apart on the letter ladder, so a sub 2 drift
 * is noise from averaging rather than a real move. Showing an arrow for it
 * would tell a player something changed when nothing did.
 */
export const TREND_EPSILON = 2;

export interface TrendPoint {
  gradeValue: number;
  computedAt: Date | string;
}

/**
 * Direction over the trailing window.
 *
 * Compares the oldest point inside the window to the newest. Deliberately not a
 * regression: the question on a card is "am I better than I was a month ago",
 * which is two numbers, not a fitted line.
 *
 * Fewer than two points in the window is flat, not up. A player with one
 * graded game has not trended anywhere yet.
 */
export function computeTrend(
  points: TrendPoint[],
  now: Date = new Date(),
  windowDays: number = TREND_WINDOW_DAYS,
): Trend {
  const cutoff = now.getTime() - windowDays * 24 * 60 * 60 * 1000;

  const inWindow = points
    .map((p) => ({
      gradeValue: p.gradeValue,
      at: p.computedAt instanceof Date ? p.computedAt : new Date(p.computedAt),
    }))
    .filter((p) => !Number.isNaN(p.at.getTime()) && p.at.getTime() >= cutoff)
    .sort((a, b) => a.at.getTime() - b.at.getTime());

  if (inWindow.length < 2) {
    return { direction: "flat", delta: 0, samples: inWindow.length };
  }

  const first = inWindow[0]!.gradeValue;
  const last = inWindow[inWindow.length - 1]!.gradeValue;
  const delta = last - first;

  if (Math.abs(delta) < TREND_EPSILON) {
    return { direction: "flat", delta: 0, samples: inWindow.length };
  }

  return {
    direction: delta > 0 ? "up" : "down",
    delta,
    samples: inWindow.length,
  };
}

/** The arrow glyph for a direction. Kept here so server and client agree. */
export function trendGlyph(direction: TrendDirection): string {
  if (direction === "up") return "↑";
  if (direction === "down") return "↓";
  return "→";
}

/** Screen reader text for the arrow. */
export function trendLabel(trend: Trend, windowDays: number = TREND_WINDOW_DAYS): string {
  if (trend.direction === "flat") return `Grade steady over ${windowDays} days`;
  const word = trend.direction === "up" ? "up" : "down";
  return `Grade ${word} over ${windowDays} days`;
}

/* ------------------------------------------------------ event derivation */

export interface ProgressionSnapshot {
  grade: string;
  gradeValue: number;
  tier: RarityTier | null;
}

/**
 * Which events a recomputation produced.
 *
 * Returns a list because a single recomputation can move both the grade and the
 * tier, and those are different things to a player: one is "I played better",
 * the other is "I moved past people".
 *
 * A first ever snapshot emits nothing. There is no "up" from nowhere, and
 * firing a promotion at sign up would make the rarest moment in the product
 * meaningless.
 */
export function deriveEvents(
  playerId: number,
  previous: ProgressionSnapshot | null,
  next: ProgressionSnapshot,
  trigger: GradeTrigger,
  at: Date = new Date(),
): ProgressionEvent[] {
  if (!previous) return [];

  const events: ProgressionEvent[] = [];

  const base = {
    playerId,
    trigger,
    at,
    grade: { from: previous.grade, to: next.grade },
    gradeValue: { from: previous.gradeValue, to: next.gradeValue },
    tier: { from: previous.tier, to: next.tier },
  };

  const gradeDelta = next.gradeValue - previous.gradeValue;
  if (Math.abs(gradeDelta) >= TREND_EPSILON) {
    events.push({ ...base, name: gradeDelta > 0 ? "grade_up" : "grade_down" });
  }

  if (previous.tier && next.tier && previous.tier !== next.tier) {
    // Rank order is defined in shared/rarity.ts; lower is better.
    events.push({ ...base, name: tierMovedUp(previous.tier, next.tier) ? "tier_promoted" : "tier_demoted" });
  }

  return events;
}

/** Local copy of the ladder so this module stays free of import cycles. */
const TIER_ORDER: RarityTier[] = ["chrome", "prism", "hot", "base", "rookie"];

function tierMovedUp(from: RarityTier, to: RarityTier): boolean {
  const a = TIER_ORDER.indexOf(from);
  const b = TIER_ORDER.indexOf(to);
  if (a === -1 || b === -1) return false;
  return b < a;
}
