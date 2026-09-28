/**
 * Rarity percentile and cohort tests (pivot Section 3D).
 *
 * Pure functions only, no database.
 *
 * shared/rarity.ts decides what a percentile MEANS; this decides what a
 * player's percentile IS. Getting it wrong prints a wrong tier onto a card
 * somebody shares, so the cohort rules are pinned here.
 */
import { describe, it, expect } from "vitest";
import {
  gradeToNumber,
  cohortKey,
  percentilesByCohort,
  MIN_COHORT,
  type PlayerScore,
} from "../server/rarityService";

describe("gradeToNumber", () => {
  it("ranks the ladder in the right order", () => {
    expect(gradeToNumber("A+")!).toBeGreaterThan(gradeToNumber("A")!);
    expect(gradeToNumber("A")!).toBeGreaterThan(gradeToNumber("B+")!);
    expect(gradeToNumber("C")!).toBeGreaterThan(gradeToNumber("D")!);
    expect(gradeToNumber("D")!).toBeGreaterThan(gradeToNumber("F")!);
  });

  it("is case and whitespace insensitive", () => {
    expect(gradeToNumber(" a- ")).toBe(gradeToNumber("A-"));
  });

  it("returns null for an unknown or missing grade rather than guessing", () => {
    expect(gradeToNumber(null)).toBeNull();
    expect(gradeToNumber(undefined)).toBeNull();
    expect(gradeToNumber("")).toBeNull();
    expect(gradeToNumber("Z")).toBeNull();
  });
});

describe("cohortKey", () => {
  it("separates class years", () => {
    expect(cohortKey(2027, "PG")).not.toBe(cohortKey(2028, "PG"));
  });

  it("separates positions", () => {
    expect(cohortKey(2027, "PG")).not.toBe(cohortKey(2027, "C"));
  });

  it("uses the primary position for a multi position player", () => {
    expect(cohortKey(2027, "PG,SF")).toBe(cohortKey(2027, "PG"));
  });

  it("is case and whitespace insensitive", () => {
    expect(cohortKey(2027, " pg ")).toBe(cohortKey(2027, "PG"));
  });

  it("ranks the five positions inside their three broad groups", () => {
    /* A PG and an SG are comparable, so they share a cohort. Ranking on the
       five would halve every cohort and push tiers out of reach on a small
       platform. The card still displays the specific position. */
    expect(cohortKey(2027, "PG")).toBe(cohortKey(2027, "SG"));
    expect(cohortKey(2027, "PF")).toBe(cohortKey(2027, "C"));
    expect(cohortKey(2027, "PG")).not.toBe(cohortKey(2027, "SF"));
    expect(cohortKey(2027, "SF")).not.toBe(cohortKey(2027, "C"));
  });

  it("still cohorts rows written before the position migration", () => {
    // Legacy Guard / Wing / Big values normalise into the same groups.
    expect(cohortKey(2027, "Guard")).toBe(cohortKey(2027, "SG"));
    expect(cohortKey(2027, "Big")).toBe(cohortKey(2027, "PF"));
  });

  it("gives missing values their own bucket instead of dropping the player", () => {
    expect(cohortKey(null, null)).toBe("0:unknown");
    expect(cohortKey(undefined, undefined)).toBe("0:unknown");
  });
});

/** Builds a cohort of `n` players with ascending scores. */
function cohort(n: number, cohortName = "2027:guard"): PlayerScore[] {
  return Array.from({ length: n }, (_, i) => ({
    playerId: i + 1,
    score: 50 + i,
    createdAt: new Date("2020-01-01"),
    cohort: cohortName,
  }));
}

describe("percentilesByCohort", () => {
  it("puts the best player at the top of their cohort without inventing a 99", () => {
    // 9 of 10 peers below them lands at 94, which is Prism. NOT 99: a cohort
    // of ten cannot demonstrate "top 1%", and Chrome is not handed out for
    // winning a small room. See the cohort size test below.
    const out = percentilesByCohort(cohort(10));
    expect(out.get(10)).toBe(94);
    for (let i = 1; i < 10; i++) expect(out.get(10)!).toBeGreaterThan(out.get(i)!);
  });

  it("ranks the worst player at the bottom of their cohort", () => {
    const out = percentilesByCohort(cohort(10));
    expect(out.get(1)!).toBeLessThan(10);
    for (let i = 2; i <= 10; i++) expect(out.get(1)!).toBeLessThan(out.get(i)!);
  });

  it("orders the middle monotonically", () => {
    const out = percentilesByCohort(cohort(10));
    for (let i = 1; i < 10; i++) {
      expect(out.get(i + 1)!).toBeGreaterThanOrEqual(out.get(i)!);
    }
  });

  it("gives tied scores the same percentile", () => {
    const tied: PlayerScore[] = [
      { playerId: 1, score: 80, createdAt: null, cohort: "c" },
      { playerId: 2, score: 80, createdAt: null, cohort: "c" },
      { playerId: 3, score: 90, createdAt: null, cohort: "c" },
      { playerId: 4, score: 70, createdAt: null, cohort: "c" },
      { playerId: 5, score: 60, createdAt: null, cohort: "c" },
    ];
    const out = percentilesByCohort(tied);
    expect(out.get(1)).toBe(out.get(2));
  });

  it("never lets a percentile leave the 0 to 99 range", () => {
    for (const p of percentilesByCohort(cohort(40)).values()) {
      if (p === null) continue;
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(99);
    }
  });
});

describe("a cohort too small to rank", () => {
  it(`returns null below ${MIN_COHORT} ranked players`, () => {
    const out = percentilesByCohort(cohort(MIN_COHORT - 1));
    for (const p of out.values()) expect(p).toBeNull();
  });

  it(`starts ranking at exactly ${MIN_COHORT}`, () => {
    const out = percentilesByCohort(cohort(MIN_COHORT));
    expect([...out.values()].every((p) => p === null)).toBe(false);
  });

  it("does not treat being the only player in a cohort as being the best", () => {
    const solo = percentilesByCohort(cohort(1));
    expect(solo.get(1)).toBeNull();
  });
});

describe("players with no graded games", () => {
  it("get a null percentile rather than a fabricated ranking", () => {
    const mixed: PlayerScore[] = [
      ...cohort(6),
      { playerId: 99, score: null, createdAt: null, cohort: "2027:guard" },
    ];
    expect(percentilesByCohort(mixed).get(99)).toBeNull();
  });

  it("do not drag down the ranking of players who have played", () => {
    const withUnscored: PlayerScore[] = [
      ...cohort(6),
      { playerId: 99, score: null, createdAt: null, cohort: "2027:guard" },
    ];
    expect(percentilesByCohort(withUnscored).get(6)).toBe(
      percentilesByCohort(cohort(6)).get(6),
    );
  });
});

describe("cohorts are independent", () => {
  it("ranks each cohort against itself, not the whole platform", () => {
    const guards = cohort(6, "2027:guard");
    // A weaker cohort, every score below every guard's.
    const bigs: PlayerScore[] = Array.from({ length: 6 }, (_, i) => ({
      playerId: 100 + i,
      score: 10 + i,
      createdAt: null,
      cohort: "2027:big",
    }));

    const out = percentilesByCohort([...guards, ...bigs]);

    // The best big scores the same percentile as the best guard despite a far
    // lower raw score. That is the point of ranking within class year and
    // position rather than across the whole platform.
    expect(out.get(105)).toBe(out.get(6));
    // And the weakest big sits at the bottom of their own cohort.
    expect(out.get(100)).toBe(out.get(1));
  });

  it("keeps Chrome genuinely rare: top 1% needs a real cohort", () => {
    // Chrome is percentile 99. A small cohort mathematically cannot produce it,
    // which is correct: being the best of ten is not evidence of being top 1%.
    const small = percentilesByCohort(cohort(10));
    expect(Math.max(...[...small.values()].map((p) => p ?? -1))).toBeLessThan(99);

    // With a hundred peers, the top player does reach it.
    const large = percentilesByCohort(cohort(100));
    expect(large.get(100)).toBe(99);
  });
});
