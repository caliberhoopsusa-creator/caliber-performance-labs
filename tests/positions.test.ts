/**
 * The five real basketball positions (pivot, 2026-09-25 migration).
 *
 * Guard / Wing / Big were never positions a player calls themselves. The
 * platform now stores PG / SG / SF / PF / C and keeps the three old names only
 * as cohort groups for ranking.
 *
 * Pure, no database. The two API write paths both validate through
 * normalizePositionList, which is what these pin: a real position is accepted,
 * a legacy name still works and is converted, and nothing else gets in.
 */
import { describe, it, expect } from "vitest";
import {
  BASKETBALL_POSITIONS,
  normalizePosition,
  normalizePositionList,
  positionGroup,
} from "@shared/sports-config";

describe("normalizePositionList", () => {
  it("accepts every position the signup form offers", () => {
    for (const position of BASKETBALL_POSITIONS) {
      const result = normalizePositionList(position);
      expect(result.invalid).toEqual([]);
      expect(result.positions).toEqual([position]);
    }
  });

  it("converts a legacy group name rather than rejecting it", () => {
    // An un-updated client must keep working, but the column must not gain
    // another 'Guard' row.
    const result = normalizePositionList("Guard");
    expect(result.invalid).toEqual([]);
    expect(BASKETBALL_POSITIONS).toContain(result.positions[0]);
    expect(result.positions[0]).not.toBe("Guard");
  });

  it("handles a multi-position string", () => {
    const result = normalizePositionList("PG, SG");
    expect(result.invalid).toEqual([]);
    expect(result.positions).toEqual(["PG", "SG"]);
  });

  it("is case and whitespace insensitive", () => {
    expect(normalizePositionList("  pg  ").positions).toEqual(["PG"]);
  });

  it("reports what it could not read, and reports only that", () => {
    const result = normalizePositionList("PG, Goalkeeper, C");
    expect(result.invalid).toEqual(["Goalkeeper"]);
    expect(result.positions).toEqual(["PG", "C"]);
  });

  it("returns nothing for an empty string, so a caller can reject it", () => {
    const result = normalizePositionList("   ");
    expect(result.positions).toEqual([]);
    expect(result.invalid).toEqual([]);
  });
});

describe("positionGroup", () => {
  it("maps every real position into a cohort group", () => {
    for (const position of BASKETBALL_POSITIONS) {
      expect(positionGroup(position)).not.toBeNull();
    }
  });

  it("keeps the guards together and the bigs together", () => {
    // Cohorts rank on the group, so halving them by splitting PG from SG
    // would push more players under MIN_COHORT and leave them unranked.
    expect(positionGroup("PG")).toBe(positionGroup("SG"));
    expect(positionGroup("PF")).toBe(positionGroup("C"));
  });

  it("returns null for something that is not a position", () => {
    expect(positionGroup("Goalkeeper")).toBeNull();
    expect(normalizePosition(null)).toBeNull();
  });
});
