/**
 * CALIBER rarity tiers.
 *
 * Public and named: Chrome, Prism, Hot, Base, Rookie. A player's tier is
 * computed from their percentile within their own class year and position, not
 * from a raw grade threshold, so "top 1%" means top 1% of comparable players
 * rather than top 1% of a number line.
 *
 * Rookie overrides everything for the first 30 days. A brand new account has
 * not played enough tracked basketball for a percentile to mean anything, and
 * a fresh player landing on "Base" reads as a judgement rather than a start.
 *
 * Pure module. The server persists the result and recomputes nightly and on any
 * grade change; the client renders it. Both import from here so the two cannot
 * disagree about what Chrome means.
 *
 * Not to be confused with client/src/lib/caliberTier.ts, which is the SIGNAL
 * era elite/strong/solid/developing/raw scale keyed off the raw 0 to 99 score.
 * That one stays for internal admin surfaces.
 */

export const RARITY_TIERS = ["chrome", "prism", "hot", "base", "rookie"] as const;

export type RarityTier = (typeof RARITY_TIERS)[number];

/** Days a new account stays Rookie regardless of percentile. */
export const ROOKIE_WINDOW_DAYS = 30;

export interface RarityDefinition {
  key: RarityTier;
  label: string;
  /** Inclusive percentile floor, where 99 is the best player in the cohort. */
  minPercentile: number | null;
  /** Token name from the CALIBER palette. */
  colorToken: "gold" | "violet" | "red" | "bone" | "chalk";
  /** One line, player facing. */
  blurb: string;
}

/**
 * Ordered best to worst. Rookie is last and is never reached by percentile,
 * only by the age override, so its floor is null.
 */
export const RARITY: Readonly<Record<RarityTier, RarityDefinition>> = {
  chrome: {
    key: "chrome",
    label: "CHROME",
    minPercentile: 99,
    colorToken: "gold",
    blurb: "Top 1% of your class and position",
  },
  prism: {
    key: "prism",
    label: "PRISM",
    minPercentile: 90,
    colorToken: "violet",
    blurb: "Top 10% of your class and position",
  },
  hot: {
    key: "hot",
    label: "HOT",
    minPercentile: 70,
    colorToken: "red",
    blurb: "Top 30% of your class and position",
  },
  base: {
    key: "base",
    label: "BASE",
    minPercentile: 0,
    colorToken: "bone",
    blurb: "Logging games, building the record",
  },
  rookie: {
    key: "rookie",
    label: "ROOKIE",
    minPercentile: null,
    colorToken: "chalk",
    blurb: "First 30 days on Caliber",
  },
};

/** Percentile ordered, best first. Rookie excluded, it is never earned. */
const BY_PERCENTILE: readonly RarityDefinition[] = [
  RARITY.chrome,
  RARITY.prism,
  RARITY.hot,
  RARITY.base,
];

/**
 * Whether this account is still inside its Rookie window.
 *
 * A missing creation date counts as Rookie: an unknown age must not promote
 * someone into Chrome by accident.
 */
export function isWithinRookieWindow(
  createdAt: Date | string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!createdAt) return true;

  const created = createdAt instanceof Date ? createdAt : new Date(createdAt);
  if (Number.isNaN(created.getTime())) return true;

  const elapsedMs = now.getTime() - created.getTime();
  if (elapsedMs < 0) return true;

  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
  return elapsedDays < ROOKIE_WINDOW_DAYS;
}

/** Days left in the Rookie window, 0 once it has closed. */
export function rookieDaysRemaining(
  createdAt: Date | string | null | undefined,
  now: Date = new Date(),
): number {
  if (!createdAt) return ROOKIE_WINDOW_DAYS;

  const created = createdAt instanceof Date ? createdAt : new Date(createdAt);
  if (Number.isNaN(created.getTime())) return ROOKIE_WINDOW_DAYS;

  const elapsedDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(ROOKIE_WINDOW_DAYS - elapsedDays));
}

export interface RarityInput {
  /** 0 to 99, where 99 is the best in the class year and position cohort. */
  percentile: number | null | undefined;
  /** Account creation, for the Rookie override. */
  createdAt: Date | string | null | undefined;
}

/**
 * The tier to show and to persist.
 *
 * Order matters: the Rookie window wins over any percentile, and a missing
 * percentile falls to Base rather than throwing, so a player with no cohort
 * yet still renders a card.
 */
export function computeRarity(input: RarityInput, now: Date = new Date()): RarityTier {
  if (isWithinRookieWindow(input.createdAt, now)) return "rookie";

  const p = input.percentile;
  if (p === null || p === undefined || Number.isNaN(p)) return "base";

  const clamped = Math.max(0, Math.min(99, p));
  const match = BY_PERCENTILE.find((tier) => clamped >= (tier.minPercentile ?? 0));
  return (match ?? RARITY.base).key;
}

export function rarityDefinition(tier: RarityTier): RarityDefinition {
  return RARITY[tier] ?? RARITY.base;
}

/**
 * What a player with no percentile is told.
 *
 * A null percentile is not the same as a low one. It means the cohort is under
 * MIN_COHORT, so nobody in it has been ranked at all, and saying "logging
 * games, building the record" to that player implies a measurement that never
 * happened.
 *
 * The operator chose to ship the thin distribution honestly rather than seed
 * one from a third party (docs/INGEST_TOS_REVIEW.md, option 4). This sentence
 * is what that decision looks like on the card.
 */
export const UNRANKED_BLURB = "Not enough players in your class and position yet";

/**
 * The line under the tier label on the card back.
 *
 * Rookie keeps its own blurb: it is a window, not a ranking, so it is honest
 * whether or not the cohort is big enough to rank.
 */
export function rarityBlurb(
  tier: RarityTier,
  percentile: number | null | undefined,
): string {
  if (tier === "rookie") return RARITY.rookie.blurb;
  if (percentile === null || percentile === undefined) return UNRANKED_BLURB;
  return rarityDefinition(tier).blurb;
}

/** True when the tier change is a promotion, for the takeover moment. */
export function isPromotion(from: RarityTier, to: RarityTier): boolean {
  return rarityRank(to) < rarityRank(from);
}

/** Lower is better. Rookie sits outside the ladder and ranks last. */
export function rarityRank(tier: RarityTier): number {
  const order: RarityTier[] = ["chrome", "prism", "hot", "base", "rookie"];
  const index = order.indexOf(tier);
  return index === -1 ? order.length : index;
}
