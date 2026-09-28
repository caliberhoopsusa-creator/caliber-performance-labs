/**
 * Grade progression tests (pivot Section 5).
 *
 * Pure functions only, no database.
 *
 * The trend is printed on a card people share and the events are what a
 * notification would fire on, so the boundaries matter: what counts as a move,
 * what counts as flat, and what a brand new player is allowed to trigger.
 */
import { describe, it, expect } from "vitest";
import {
  caliberGrade,
  gradeToValue,
  valueToGrade,
  computeTrend,
  deriveEvents,
  trendGlyph,
  trendLabel,
  TREND_EPSILON,
  TREND_WINDOW_DAYS,
  type TrendPoint,
  type ProgressionSnapshot,
} from "@shared/progression";

const NOW = new Date("2026-09-25T12:00:00Z");

function daysAgo(n: number): Date {
  return new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);
}

/* ------------------------------------------------------------- the grade */

describe("the Caliber Grade is the mean, not the last game", () => {
  it("averages every graded game", () => {
    // A (95) and B (85) average to 90, which is exactly A-.
    expect(caliberGrade(["A", "B"])!.grade).toBe("A-");
  });

  it("breaks an exact tie toward the better grade", () => {
    /* A+ (100) and B (85) average to 92.5, equidistant from A (95) and
       A- (90). The ladder is walked best first and ties keep the incumbent, so
       the player gets the higher letter. Generous, and pinned here so it is a
       decision rather than an accident of iteration order. */
    expect(caliberGrade(["A+", "B"])!.grade).toBe("A");
  });

  it("does not simply return the most recent grade", () => {
    // One great night does not make the grade an A+.
    const result = caliberGrade(["A+", "C", "C"])!;
    expect(result.grade).not.toBe("A+");
  });

  it("ignores ungraded games rather than counting them as zero", () => {
    expect(caliberGrade(["A", null, undefined, ""])!.grade).toBe("A");
  });

  it("returns null with no graded games, so no number is invented", () => {
    expect(caliberGrade([])).toBeNull();
    expect(caliberGrade([null, undefined])).toBeNull();
  });

  it("round trips a letter through its value", () => {
    for (const g of ["A+", "A", "B-", "C", "D+", "F"]) {
      expect(valueToGrade(gradeToValue(g)!)).toBe(g);
    }
  });

  it("is case and whitespace insensitive", () => {
    expect(gradeToValue(" a- ")).toBe(gradeToValue("A-"));
  });
});

/* ----------------------------------------------------------------- trend */

function points(...spec: Array<[days: number, value: number]>): TrendPoint[] {
  return spec.map(([d, v]) => ({ gradeValue: v, computedAt: daysAgo(d) }));
}

describe("computeTrend", () => {
  it("reads up when the newest point beats the oldest", () => {
    const t = computeTrend(points([20, 80], [2, 90]), NOW);
    expect(t.direction).toBe("up");
    expect(t.delta).toBe(10);
  });

  it("reads down when it is worse", () => {
    expect(computeTrend(points([20, 90], [2, 80]), NOW).direction).toBe("down");
  });

  it("compares oldest to newest regardless of input order", () => {
    const scrambled = computeTrend(points([2, 90], [20, 80]), NOW);
    expect(scrambled.direction).toBe("up");
  });

  it("ignores points outside the window", () => {
    // The 90 day old point would make this look like a climb; it should not count.
    const t = computeTrend(points([90, 50], [20, 85], [2, 85]), NOW);
    expect(t.direction).toBe("flat");
    expect(t.samples).toBe(2);
  });

  it(`uses a ${TREND_WINDOW_DAYS} day window`, () => {
    const justInside = computeTrend(points([TREND_WINDOW_DAYS - 1, 70], [1, 90]), NOW);
    const justOutside = computeTrend(points([TREND_WINDOW_DAYS + 1, 70], [1, 90]), NOW);
    expect(justInside.direction).toBe("up");
    expect(justOutside.direction).toBe("flat");
  });
});

describe("the flat band stops the arrow lying about noise", () => {
  it(`treats a move smaller than ${TREND_EPSILON} as flat`, () => {
    const t = computeTrend(points([20, 85], [2, 86]), NOW);
    expect(t.direction).toBe("flat");
    expect(t.delta).toBe(0);
  });

  it(`treats a move of exactly ${TREND_EPSILON} as real`, () => {
    expect(computeTrend(points([20, 85], [2, 87]), NOW).direction).toBe("up");
  });

  it("is flat with a single point, because one game has not trended", () => {
    const t = computeTrend(points([2, 95]), NOW);
    expect(t.direction).toBe("flat");
    expect(t.samples).toBe(1);
  });

  it("is flat with no history at all", () => {
    expect(computeTrend([], NOW).direction).toBe("flat");
  });
});

describe("trend presentation", () => {
  it("gives each direction a distinct glyph", () => {
    const glyphs = new Set(["up", "down", "flat"].map((d) => trendGlyph(d as any)));
    expect(glyphs.size).toBe(3);
  });

  it("labels the arrow for a screen reader", () => {
    expect(trendLabel({ direction: "up", delta: 5, samples: 3 })).toMatch(/up/i);
    expect(trendLabel({ direction: "down", delta: -5, samples: 3 })).toMatch(/down/i);
    expect(trendLabel({ direction: "flat", delta: 0, samples: 3 })).toMatch(/steady/i);
  });
});

/* ---------------------------------------------------------------- events */

const snap = (gradeValue: number, tier: any = "base"): ProgressionSnapshot => ({
  grade: valueToGrade(gradeValue),
  gradeValue,
  tier,
});

describe("deriveEvents", () => {
  it("emits nothing on a first ever snapshot", () => {
    // There is no "up" from nowhere, and a promotion at sign up would cheapen
    // the rarest moment in the product.
    expect(deriveEvents(1, null, snap(90), "game_logged", NOW)).toEqual([]);
  });

  it("emits grade_up on a real climb", () => {
    const events = deriveEvents(1, snap(80), snap(90), "game_logged", NOW);
    expect(events.map((e) => e.name)).toContain("grade_up");
  });

  it("emits grade_down on a real drop", () => {
    const events = deriveEvents(1, snap(90), snap(80), "nightly", NOW);
    expect(events.map((e) => e.name)).toContain("grade_down");
  });

  it("emits nothing for a move inside the flat band", () => {
    expect(deriveEvents(1, snap(85), snap(86), "nightly", NOW)).toEqual([]);
  });

  it("emits tier_promoted when the tier improves", () => {
    const events = deriveEvents(1, snap(85, "hot"), snap(85, "prism"), "nightly", NOW);
    expect(events.map((e) => e.name)).toEqual(["tier_promoted"]);
  });

  it("emits tier_demoted when it worsens", () => {
    const events = deriveEvents(1, snap(85, "prism"), snap(85, "hot"), "nightly", NOW);
    expect(events.map((e) => e.name)).toEqual(["tier_demoted"]);
  });

  it("treats leaving Rookie as a promotion", () => {
    const events = deriveEvents(1, snap(85, "rookie"), snap(85, "base"), "nightly", NOW);
    expect(events.map((e) => e.name)).toEqual(["tier_promoted"]);
  });

  it("emits both when the grade and the tier move together", () => {
    // Different things to a player: one is "I played better", the other is
    // "I moved past people".
    const events = deriveEvents(1, snap(80, "hot"), snap(92, "prism"), "game_logged", NOW);
    expect(events.map((e) => e.name).sort()).toEqual(["grade_up", "tier_promoted"]);
  });

  it("emits no tier event when the tier is unknown on either side", () => {
    const events = deriveEvents(1, snap(85, null), snap(85, "prism"), "nightly", NOW);
    expect(events).toEqual([]);
  });

  it("carries the trigger and the from/to values through", () => {
    const [event] = deriveEvents(1, snap(80), snap(90), "coach_cosign", NOW);
    expect(event.trigger).toBe("coach_cosign");
    expect(event.playerId).toBe(1);
    expect(event.gradeValue).toEqual({ from: 80, to: 90 });
    expect(event.at).toBe(NOW);
  });
});
