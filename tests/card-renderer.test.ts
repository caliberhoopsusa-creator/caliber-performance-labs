/**
 * Server side card renderer tests (pivot Section 3C).
 *
 * Pure, no database, no app boot.
 *
 * The renderer does NOT import Card.tsx: satori supports a CSS subset and its
 * opentype fork cannot parse the variable fonts the browser uses. So the two
 * layouts are separate implementations of one contract, and this file is the
 * guard against them drifting. It asserts the slot contract on the SVG, which
 * is the layer where drift would show up first.
 */
import { describe, it, expect, beforeAll } from "vitest";
import {
  renderCardPng,
  renderCardCached,
  clearCardCache,
  cardCacheKey,
  cardVersion,
  CARD_SIZES,
  type CardRenderInput,
} from "../server/cardRenderer";

const INPUT: CardRenderInput = {
  name: "Jordan Reyes",
  position: "SG",
  classYear: "'27",
  school: "Missoula Sentinel",
  grade: "A-",
  tier: "prism",
  stats: [
    { label: "PPG", value: "22.4" },
    { label: "FG%", value: "48%" },
  ],
  profileUrl: "caliber.app/jordanreyes",
};

/** Reads width and height out of a PNG header. */
function pngSize(png: Buffer): { width: number; height: number } {
  expect(png.subarray(1, 4).toString()).toBe("PNG");
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

describe("output dimensions are exact", () => {
  it("renders a story card at 1080x1920", async () => {
    const png = await renderCardPng(INPUT, "story");
    expect(pngSize(png)).toEqual(CARD_SIZES.story);
  }, 30000);

  it("renders a feed card at 1080x1080", async () => {
    const png = await renderCardPng(INPUT, "feed");
    expect(pngSize(png)).toEqual(CARD_SIZES.feed);
  }, 30000);
});

describe("every tier renders", () => {
  it.each(["chrome", "prism", "hot", "base", "rookie"] as const)(
    "%s produces a valid PNG",
    async (tier) => {
      const png = await renderCardPng({ ...INPUT, tier }, "feed");
      expect(png.length).toBeGreaterThan(1000);
      expect(pngSize(png)).toEqual(CARD_SIZES.feed);
    },
    30000,
  );
});

describe("rendering is deterministic", () => {
  it("produces byte identical output for identical input", async () => {
    const a = await renderCardPng(INPUT, "feed");
    const b = await renderCardPng(INPUT, "feed");
    expect(a.equals(b)).toBe(true);
  }, 30000);

  it("produces different output when the grade changes", async () => {
    const a = await renderCardPng(INPUT, "feed");
    const b = await renderCardPng({ ...INPUT, grade: "B+" }, "feed");
    expect(a.equals(b)).toBe(false);
  }, 30000);
});

describe("cardVersion invalidates on anything the face shows", () => {
  const base = cardVersion(INPUT);

  it.each([
    ["name", { name: "Sam Rivera" }],
    ["grade", { grade: "B+" }],
    ["tier", { tier: "chrome" as const }],
    ["school", { school: "Big Sky" }],
    ["position", { position: "PG" }],
    ["class year", { classYear: "'28" }],
    ["photo", { photoUrl: "https://example.test/x.jpg" }],
    ["trend direction", { trend: { direction: "up" as const, delta: 9, samples: 3 } }],
  ])("changes when %s changes", (_label, patch) => {
    expect(cardVersion({ ...INPUT, ...patch })).not.toBe(base);
  });

  it("changes when a stat value changes", () => {
    expect(
      cardVersion({ ...INPUT, stats: [{ label: "PPG", value: "9.9" }, INPUT.stats[1]] }),
    ).not.toBe(base);
  });

  it("is stable for unchanged input", () => {
    expect(cardVersion({ ...INPUT })).toBe(base);
  });

  it("distinguishes up from flat from absent", () => {
    // A cached PNG must never outlive the trend change it should have
    // invalidated, so these three cannot share a hash.
    const up = cardVersion({ ...INPUT, trend: { direction: "up", delta: 9, samples: 3 } });
    const flat = cardVersion({ ...INPUT, trend: { direction: "flat", delta: 0, samples: 3 } });
    expect(new Set([up, flat, base]).size).toBe(3);
  });
});

describe("the cache", () => {
  beforeAll(() => clearCardCache());

  it("keys on player, version and size together", () => {
    expect(cardCacheKey(1, "abc", "feed")).toBe("1:abc:feed");
    expect(cardCacheKey(1, "abc", "story")).not.toBe(cardCacheKey(1, "abc", "feed"));
    expect(cardCacheKey(2, "abc", "feed")).not.toBe(cardCacheKey(1, "abc", "feed"));
  });

  it("returns the same bytes on a hit", async () => {
    const v = cardVersion(INPUT);
    const first = await renderCardCached(7, v, "feed", INPUT);
    const second = await renderCardCached(7, v, "feed", INPUT);
    expect(second.equals(first)).toBe(true);
  }, 30000);

  it("misses when the version changes, so a stale card is never served", async () => {
    const changed = { ...INPUT, grade: "C+" };
    const a = await renderCardCached(7, cardVersion(INPUT), "feed", INPUT);
    const b = await renderCardCached(7, cardVersion(changed), "feed", changed);
    expect(a.equals(b)).toBe(false);
  }, 30000);
});

describe("the slot contract survives awkward content", () => {
  it("renders a very long name without throwing", async () => {
    const png = await renderCardPng(
      { ...INPUT, name: "Bartholomew Vanderveldt-Rodriguez" },
      "feed",
    );
    expect(pngSize(png)).toEqual(CARD_SIZES.feed);
  }, 30000);

  it("renders with no photo", async () => {
    const png = await renderCardPng({ ...INPUT, photoUrl: null }, "feed");
    expect(png.length).toBeGreaterThan(1000);
  }, 30000);

  it("uses only the first two stats, since more stops being a card", async () => {
    const three = {
      ...INPUT,
      stats: [...INPUT.stats, { label: "APG", value: "5.1" }],
    };
    const a = await renderCardPng(three, "feed");
    const b = await renderCardPng(INPUT, "feed");
    expect(a.equals(b)).toBe(true);
  }, 30000);
});
