/**
 * Caliber Score — the trust graph.
 *
 * A single, portable 0–100 signal that answers the only question a recruiter
 * actually cares about: "can I trust what this profile claims?" It is
 * deliberately weighted toward *verification* over raw production, because the
 * moat is trust — a gaudy stat line that nobody verified should not outscore a
 * coach-attested, on-film body of work.
 *
 * Pure and deterministic: no imports, no I/O. Safe to run on the client, the
 * server, in tests, or inside a batch job. Feed it whatever signals you have;
 * every field is optional and the engine degrades honestly (less evidence →
 * lower confidence, not a fake-high score).
 */

export type Confidence = "Low" | "Medium" | "High";

export interface CaliberScoreInput {
  /** Total games in the verified/logged body of work. */
  gamesPlayed?: number;
  /** Average letter grade across the body of work, e.g. "A-", "B+". */
  averageGrade?: string | null;
  /** Recent letter grades, newest-first or oldest-first — order-independent. */
  recentGrades?: Array<string | null | undefined>;
  /** Direction of the trend, if known. */
  performanceTrend?: "improving" | "stable" | "declining" | null;

  // ── Verification signals (the heaviest weight) ──
  /** Identity/eligibility verified on-platform. */
  verifiedAthlete?: boolean;
  /** Has uploaded film / highlight clips backing the numbers. */
  hasFilm?: boolean;
  /** Number of independent coach endorsements (third-party attestation). */
  coachEndorsements?: number;

  // ── Recognition signals ──
  accolades?: number;
  skillBadges?: number;
}

export interface CaliberScoreComponent {
  key: string;
  label: string;
  /** 0–100 sub-score. */
  value: number;
  /** Fraction of the composite (0–1). */
  weight: number;
}

export interface CaliberScore {
  /** Final composite, 0–100. */
  score: number;
  tier: string;
  confidence: Confidence;
  components: CaliberScoreComponent[];
  summary: string;
}

const WEIGHTS = {
  verification: 0.35,
  performance: 0.25,
  consistency: 0.15,
  reliability: 0.1,
  recognition: 0.15,
} as const;

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const round = (n: number) => Math.round(n);

/** Map an A–F letter grade to a 0–100 point value. */
export function gradeToPoints(grade?: string | null): number | null {
  if (!grade) return null;
  const g = grade.trim().toUpperCase();
  const table: Record<string, number> = {
    "A+": 100, A: 96, "A-": 92,
    "B+": 88, B: 84, "B-": 80,
    "C+": 76, C: 72, "C-": 68,
    "D+": 64, D: 60, "D-": 56,
    F: 40,
  };
  return table[g] ?? null;
}

function tierFor(score: number): string {
  if (score >= 90) return "Elite";
  if (score >= 80) return "High-Major";
  if (score >= 70) return "Mid-Major";
  if (score >= 60) return "Developing";
  return "Emerging";
}

/** Population standard deviation of a numeric list. */
function stdev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function computeCaliberScore(input: CaliberScoreInput): CaliberScore {
  const games = Math.max(0, input.gamesPlayed ?? 0);
  const endorsements = Math.max(0, input.coachEndorsements ?? 0);
  const accolades = Math.max(0, input.accolades ?? 0);
  const skillBadges = Math.max(0, input.skillBadges ?? 0);

  // ── Verification: the moat. Identity + film + third-party attestation. ──
  const verification = clamp(
    (input.verifiedAthlete ? 50 : 0) +
      (input.hasFilm ? 25 : 0) +
      Math.min(25, endorsements * 12),
  );

  // ── Performance: average grade. ──
  const gradePts = gradeToPoints(input.averageGrade);
  const performance = gradePts ?? 50; // neutral if ungraded

  // ── Consistency: tighter grade spread scores higher. ──
  const recentPts = (input.recentGrades ?? [])
    .map((g) => gradeToPoints(g))
    .filter((n): n is number => n != null);
  const consistency =
    recentPts.length >= 2 ? clamp(100 - stdev(recentPts) * 3.5) : 65;

  // ── Reliability: bigger sample = more trustworthy. Saturates near 25 games. ──
  const reliability = clamp((games / 25) * 100);

  // ── Recognition: accolades + skill badges (capped, diminishing). ──
  const recognition = clamp(accolades * 14 + skillBadges * 5);

  let composite =
    verification * WEIGHTS.verification +
    performance * WEIGHTS.performance +
    consistency * WEIGHTS.consistency +
    reliability * WEIGHTS.reliability +
    recognition * WEIGHTS.recognition;

  // Trajectory nudge (small, documented): reward improvers, ding sliders.
  if (input.performanceTrend === "improving") composite += 3;
  else if (input.performanceTrend === "declining") composite -= 3;

  const score = round(clamp(composite));

  // Confidence keys off evidence depth, not the score itself — this is what
  // keeps a flashy 2-game profile honest.
  let confidence: Confidence = "Low";
  if (games >= 15 && verification >= 50) confidence = "High";
  else if (games >= 6) confidence = "Medium";

  const components: CaliberScoreComponent[] = [
    { key: "verification", label: "Verification", value: round(verification), weight: WEIGHTS.verification },
    { key: "performance", label: "Performance", value: round(performance), weight: WEIGHTS.performance },
    { key: "consistency", label: "Consistency", value: round(consistency), weight: WEIGHTS.consistency },
    { key: "reliability", label: "Sample Size", value: round(reliability), weight: WEIGHTS.reliability },
    { key: "recognition", label: "Recognition", value: round(recognition), weight: WEIGHTS.recognition },
  ];

  const summary =
    confidence === "High"
      ? `Verified body of work across ${games} games — a trustworthy ${tierFor(score)} profile.`
      : confidence === "Medium"
        ? `Promising profile; more verified games will firm up this score.`
        : `Early profile — log and verify more games to raise confidence.`;

  return { score, tier: tierFor(score), confidence, components, summary };
}
