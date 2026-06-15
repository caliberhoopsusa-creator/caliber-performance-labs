/**
 * Unit tests for the Caliber Score trust engine.
 * Pure function — no DB or server required.
 */
import { describe, it, expect } from "vitest";
import { computeCaliberScore, gradeToPoints } from "@shared/trust-engine";

describe("gradeToPoints", () => {
  it("maps letters to a sane descending scale", () => {
    expect(gradeToPoints("A+")).toBe(100);
    expect(gradeToPoints("A-")!).toBeLessThan(gradeToPoints("A")!);
    expect(gradeToPoints("B")!).toBeLessThan(gradeToPoints("A-")!);
    expect(gradeToPoints("F")).toBe(40);
  });
  it("is case/whitespace tolerant and null-safe", () => {
    expect(gradeToPoints("  a- ")).toBe(gradeToPoints("A-"));
    expect(gradeToPoints(null)).toBeNull();
    expect(gradeToPoints("Z")).toBeNull();
  });
});

describe("computeCaliberScore", () => {
  it("returns a bounded score and a tier/confidence", () => {
    const r = computeCaliberScore({ gamesPlayed: 20, averageGrade: "B+" });
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
    expect(["Low", "Medium", "High"]).toContain(r.confidence);
    expect(r.components).toHaveLength(5);
    const weightSum = r.components.reduce((a, c) => a + c.weight, 0);
    expect(weightSum).toBeCloseTo(1, 5);
  });

  it("rewards verification — the moat outweighs raw grades", () => {
    const unverified = computeCaliberScore({ gamesPlayed: 20, averageGrade: "A" });
    const verified = computeCaliberScore({
      gamesPlayed: 20,
      averageGrade: "A",
      verifiedAthlete: true,
      hasFilm: true,
      coachEndorsements: 2,
    });
    expect(verified.score).toBeGreaterThan(unverified.score);
  });

  it("keeps a flashy tiny sample at Low confidence", () => {
    const r = computeCaliberScore({ gamesPlayed: 2, averageGrade: "A+" });
    expect(r.confidence).toBe("Low");
  });

  it("reaches High confidence only with sample size AND verification", () => {
    const r = computeCaliberScore({
      gamesPlayed: 18,
      averageGrade: "A-",
      verifiedAthlete: true,
      hasFilm: true,
      coachEndorsements: 3,
      recentGrades: ["A", "A-", "B+", "A", "A-"],
    });
    expect(r.confidence).toBe("High");
    expect(r.score).toBeGreaterThan(70);
  });

  it("penalizes inconsistency relative to a steady profile", () => {
    const steady = computeCaliberScore({ gamesPlayed: 10, averageGrade: "B", recentGrades: ["B", "B", "B+", "B-"] });
    const swingy = computeCaliberScore({ gamesPlayed: 10, averageGrade: "B", recentGrades: ["A+", "F", "A", "D-"] });
    expect(steady.score).toBeGreaterThan(swingy.score);
  });

  it("applies the trajectory nudge", () => {
    const base = { gamesPlayed: 12, averageGrade: "B", recentGrades: ["B", "B"] } as const;
    const up = computeCaliberScore({ ...base, performanceTrend: "improving" });
    const down = computeCaliberScore({ ...base, performanceTrend: "declining" });
    expect(up.score).toBeGreaterThan(down.score);
  });

  it("degrades gracefully on empty input", () => {
    const r = computeCaliberScore({});
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.confidence).toBe("Low");
  });
});
