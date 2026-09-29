/**
 * CALIBER rarity tier tests (pivot Section 3D).
 *
 * Pure, no database, no app boot.
 *
 * The rules worth pinning: the 30 day Rookie window beats any percentile, the
 * bands are the ones published to players, and an unknown input never promotes
 * someone by accident. Rarity is public and persisted, so a silent change here
 * would show up on a card somebody already shared.
 */
import { describe, it, expect } from "vitest";
import {
  computeRarity,
  isWithinRookieWindow,
  rookieDaysRemaining,
  rarityDefinition,
  rarityBlurb,
  UNRANKED_BLURB,
  isPromotion,
  rarityRank,
  ROOKIE_WINDOW_DAYS,
  RARITY_TIERS,
} from "@shared/rarity";

const NOW = new Date("2026-09-23T12:00:00Z");

/** A date `days` before NOW. */
function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
}

/** Old enough that the Rookie override never applies. */
const VETERAN = daysAgo(400);

describe("the Rookie window", () => {
  it("holds for a brand new account", () => {
    expect(isWithinRookieWindow(daysAgo(0), NOW)).toBe(true);
  });

  it("holds on day 29", () => {
    expect(isWithinRookieWindow(daysAgo(29), NOW)).toBe(true);
  });

  it("has closed by day 31", () => {
    expect(isWithinRookieWindow(daysAgo(31), NOW)).toBe(false);
  });

  it("closes exactly at the boundary, not a day late", () => {
    expect(isWithinRookieWindow(daysAgo(ROOKIE_WINDOW_DAYS), NOW)).toBe(false);
  });

  it("treats a missing creation date as Rookie rather than promoting", () => {
    expect(isWithinRookieWindow(null, NOW)).toBe(true);
    expect(isWithinRookieWindow(undefined, NOW)).toBe(true);
    expect(isWithinRookieWindow("not-a-date", NOW)).toBe(true);
  });

  it("treats a future creation date as Rookie", () => {
    const future = new Date(NOW.getTime() + 86400000);
    expect(isWithinRookieWindow(future, NOW)).toBe(true);
  });

  it("accepts an ISO string as well as a Date", () => {
    expect(isWithinRookieWindow(daysAgo(5).toISOString(), NOW)).toBe(true);
  });

  it("counts down the days remaining", () => {
    expect(rookieDaysRemaining(daysAgo(10), NOW)).toBe(20);
    expect(rookieDaysRemaining(daysAgo(29), NOW)).toBe(1);
    expect(rookieDaysRemaining(daysAgo(60), NOW)).toBe(0);
  });
});

describe("the Rookie override beats percentile", () => {
  it.each([[99], [95], [80], [50], [0]])(
    "a %i percentile player inside the window is still Rookie",
    (percentile) => {
      expect(computeRarity({ percentile, createdAt: daysAgo(3) }, NOW)).toBe("rookie");
    },
  );

  it("releases to the real tier once the window closes", () => {
    expect(computeRarity({ percentile: 99, createdAt: VETERAN }, NOW)).toBe("chrome");
  });
});

describe("percentile bands", () => {
  it.each([
    [99, "chrome"],
    [98, "prism"],
    [90, "prism"],
    [89, "hot"],
    [70, "hot"],
    [69, "base"],
    [1, "base"],
    [0, "base"],
  ] as const)("percentile %i is %s", (percentile, expected) => {
    expect(computeRarity({ percentile, createdAt: VETERAN }, NOW)).toBe(expected);
  });

  it("clamps an out of range percentile instead of throwing", () => {
    expect(computeRarity({ percentile: 150, createdAt: VETERAN }, NOW)).toBe("chrome");
    expect(computeRarity({ percentile: -5, createdAt: VETERAN }, NOW)).toBe("base");
  });

  it("falls to Base when there is no percentile yet, so a card still renders", () => {
    expect(computeRarity({ percentile: null, createdAt: VETERAN }, NOW)).toBe("base");
    expect(computeRarity({ percentile: undefined, createdAt: VETERAN }, NOW)).toBe("base");
    expect(computeRarity({ percentile: NaN, createdAt: VETERAN }, NOW)).toBe("base");
  });
});

describe("tier metadata", () => {
  it.each(RARITY_TIERS)("%s has a definition with a label and a blurb", (tier) => {
    const def = rarityDefinition(tier);
    expect(def.key).toBe(tier);
    expect(def.label.length).toBeGreaterThan(0);
    expect(def.blurb.length).toBeGreaterThan(0);
  });

  it("gives Rookie no percentile floor, since it is never earned by rank", () => {
    expect(rarityDefinition("rookie").minPercentile).toBeNull();
  });

  it("maps each tier to its CALIBER colour token", () => {
    expect(rarityDefinition("chrome").colorToken).toBe("gold");
    expect(rarityDefinition("prism").colorToken).toBe("violet");
    expect(rarityDefinition("hot").colorToken).toBe("red");
  });
});

describe("promotion detection drives the takeover moment", () => {
  it("ranks better tiers lower", () => {
    expect(rarityRank("chrome")).toBeLessThan(rarityRank("prism"));
    expect(rarityRank("prism")).toBeLessThan(rarityRank("hot"));
    expect(rarityRank("hot")).toBeLessThan(rarityRank("base"));
  });

  it("detects a climb", () => {
    expect(isPromotion("hot", "prism")).toBe(true);
    expect(isPromotion("base", "chrome")).toBe(true);
  });

  it("does not fire on a drop or on no change", () => {
    expect(isPromotion("prism", "hot")).toBe(false);
    expect(isPromotion("prism", "prism")).toBe(false);
  });

  it("treats leaving Rookie for any real tier as a promotion", () => {
    expect(isPromotion("rookie", "base")).toBe(true);
    expect(isPromotion("rookie", "chrome")).toBe(true);
  });
});

/* ------------------------------------------------- the unranked sentence */

describe("rarityBlurb", () => {
  it("says the cohort is too small when there is no percentile", () => {
    // Arrange: a Base player who was never ranked, not one ranked low.
    const tier = "base" as const;

    // Act
    const blurb = rarityBlurb(tier, null);

    // Assert
    expect(blurb).toBe(UNRANKED_BLURB);
    expect(blurb).not.toBe(rarityDefinition("base").blurb);
  });

  it("treats a missing percentile the same as an explicit null", () => {
    expect(rarityBlurb("base", undefined)).toBe(UNRANKED_BLURB);
  });

  it("uses the tier blurb once the player has a real percentile", () => {
    expect(rarityBlurb("base", 40)).toBe(rarityDefinition("base").blurb);
    expect(rarityBlurb("hot", 75)).toBe(rarityDefinition("hot").blurb);
    expect(rarityBlurb("chrome", 99)).toBe(rarityDefinition("chrome").blurb);
  });

  it("does not claim a percentile of zero is unranked", () => {
    // Bottom of a real cohort is a measurement. Only null means unmeasured.
    expect(rarityBlurb("base", 0)).toBe(rarityDefinition("base").blurb);
  });

  it("keeps the Rookie window blurb regardless of percentile", () => {
    // Rookie is a window, not a ranking, so it is honest either way.
    expect(rarityBlurb("rookie", null)).toBe(rarityDefinition("rookie").blurb);
    expect(rarityBlurb("rookie", 95)).toBe(rarityDefinition("rookie").blurb);
  });
});
