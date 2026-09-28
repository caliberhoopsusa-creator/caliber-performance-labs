/**
 * Rarity persistence (pivot Section 3D).
 *
 * `shared/rarity.ts` decides what a percentile MEANS. This file decides what a
 * player's percentile IS, and writes the answer down.
 *
 * Rarity is persisted rather than derived per request for three reasons: it is
 * public, it is printed onto a card somebody shares, and computing it needs the
 * whole cohort, not one player. A card render must never trigger a cohort scan.
 *
 * Recomputed nightly and on any grade change. See `startRarityScheduler`.
 */
import { db } from "./db";
import { players, games } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";
import { computeRarity, type RarityTier } from "@shared/rarity";
import { gradeToValue } from "@shared/progression";
import { positionGroup } from "@shared/sports-config";

/**
 * Letter grade to a number.
 *
 * Re-exported from shared/progression.ts, which owns the one ladder. It was
 * duplicated here and in three other places, which is how they drifted.
 */
export { gradeToValue as gradeToNumber } from "@shared/progression";

/**
 * A player's cohort key: class year and position.
 *
 * "Top 1%" has to mean top 1% of comparable players or it means nothing. A
 * sophomore guard and a senior centre are not the same competition.
 *
 * Missing values get their own bucket rather than being dropped, so a player
 * with no graduation year still lands somewhere instead of silently losing a
 * tier.
 */
export function cohortKey(
  graduationYear: number | null | undefined,
  position: string | null | undefined,
): string {
  const year = graduationYear ?? 0;
  /* Cohort on the BROAD group, not the specific position.
     Positions migrated from three buckets to five on 2026-09-25. Ranking on
     the five would halve every cohort, pushing tiers further out of reach on a
     small platform for no gain in fairness: a PG and an SG are genuinely
     comparable. So the card DISPLAYS the five and the ranking uses the three.
     See POSITION_GROUPS in shared/sports-config.ts. */
  const group = positionGroup(position) ?? "unknown";
  return `${year}:${group.toLowerCase()}`;
}

export interface PlayerScore {
  playerId: number;
  score: number | null;
  createdAt: Date | null;
  cohort: string;
}

/**
 * Percentile of each score within its own cohort, 0 to 99.
 *
 * A player with no score gets null: they have not played enough tracked
 * basketball for a ranking to be honest, and `computeRarity` drops them to Base
 * rather than inventing a position for them.
 *
 * A cohort of one is a degenerate ranking, so anything under MIN_COHORT is
 * treated as unranked. Being the only senior forward on the platform is not
 * evidence of being the best one.
 *
 * NOTE ON CHROME. The best player in a cohort of ten scores 94 (Prism), not 99
 * (Chrome): a cohort of ten cannot demonstrate "top 1%". Chrome needs roughly a
 * hundred players in the same class year and position. That is deliberate,
 * since handing the rarest tier to whoever wins a room of six would make it
 * meaningless on the first card anyone shares. Early on, with small cohorts,
 * expect Prism to be the effective ceiling.
 */
export const MIN_COHORT = 5;

export function percentilesByCohort(rows: PlayerScore[]): Map<number, number | null> {
  const byCohort = new Map<string, PlayerScore[]>();
  for (const row of rows) {
    const list = byCohort.get(row.cohort) ?? [];
    list.push(row);
    byCohort.set(row.cohort, list);
  }

  const out = new Map<number, number | null>();

  for (const list of byCohort.values()) {
    const ranked = list.filter((r) => r.score !== null);

    if (ranked.length < MIN_COHORT) {
      for (const r of list) out.set(r.playerId, null);
      continue;
    }

    // Ascending, so index position is how many peers you are at or above.
    const sorted = [...ranked].sort((a, b) => (a.score! - b.score!));

    for (const r of list) {
      if (r.score === null) {
        out.set(r.playerId, null);
        continue;
      }
      /* Midpoint (Hazen) percentile: (below + 0.5) / n.
         Plain below/n asymptotes to 99 without reaching it, so Chrome would
         have needed a cohort of about 200 before anyone could hold it. The
         midpoint makes the top of a hundred exactly 99 (Chrome) and the top of
         ten 94 (Prism), which is what "top 1%" should mean. */
      const below = sorted.filter((p) => p.score! < r.score!).length;
      const pct = Math.round(((below + 0.5) / sorted.length) * 99);
      out.set(r.playerId, Math.max(0, Math.min(99, pct)));
    }
  }

  return out;
}

/** Mean graded game score for each player, null when they have no graded games. */
async function scoresForPlayers(playerIds: number[]): Promise<Map<number, number | null>> {
  const out = new Map<number, number | null>();
  if (playerIds.length === 0) return out;

  const rows = await db
    .select({ playerId: games.playerId, grade: games.grade })
    .from(games)
    .where(inArray(games.playerId, playerIds));

  const totals = new Map<number, { sum: number; n: number }>();
  for (const row of rows) {
    const value = gradeToValue(row.grade);
    if (value === null || row.playerId === null) continue;
    const acc = totals.get(row.playerId) ?? { sum: 0, n: 0 };
    acc.sum += value;
    acc.n += 1;
    totals.set(row.playerId, acc);
  }

  for (const id of playerIds) {
    const acc = totals.get(id);
    out.set(id, acc && acc.n > 0 ? acc.sum / acc.n : null);
  }
  return out;
}

export interface RarityResult {
  playerId: number;
  tier: RarityTier;
  percentile: number | null;
}

/**
 * Recomputes rarity for every player and writes the changes.
 *
 * Only rows whose tier or percentile actually moved are written, so a nightly
 * run on a quiet day is a read and nothing else.
 */
export async function recomputeAllRarity(now: Date = new Date()): Promise<{
  scanned: number;
  updated: number;
  promoted: RarityResult[];
}> {
  const all = await db
    .select({
      id: players.id,
      graduationYear: players.graduationYear,
      position: players.position,
      createdAt: players.createdAt,
      rarityTier: players.rarityTier,
      rarityPercentile: players.rarityPercentile,
    })
    .from(players);

  const scores = await scoresForPlayers(all.map((p) => p.id));

  const scored: PlayerScore[] = all.map((p) => ({
    playerId: p.id,
    score: scores.get(p.id) ?? null,
    createdAt: p.createdAt,
    cohort: cohortKey(p.graduationYear, p.position),
  }));

  const percentiles = percentilesByCohort(scored);

  let updated = 0;
  const promoted: RarityResult[] = [];

  for (const p of all) {
    const percentile = percentiles.get(p.id) ?? null;
    const tier = computeRarity({ percentile, createdAt: p.createdAt }, now);

    if (p.rarityTier === tier && p.rarityPercentile === percentile) continue;

    await db
      .update(players)
      .set({ rarityTier: tier, rarityPercentile: percentile, rarityComputedAt: now })
      .where(eq(players.id, p.id));
    updated += 1;

    if (p.rarityTier && p.rarityTier !== tier) {
      promoted.push({ playerId: p.id, tier, percentile });
    }
  }

  return { scanned: all.length, updated, promoted };
}

/**
 * Recomputes one player, for the on grade change path.
 *
 * Their own tier can move without the cohort moving, and a full scan on every
 * logged game would not scale. The cohort's percentiles settle on the next
 * nightly run.
 */
export async function recomputeRarityForPlayer(
  playerId: number,
  now: Date = new Date(),
): Promise<RarityResult | null> {
  const [player] = await db
    .select({
      id: players.id,
      graduationYear: players.graduationYear,
      position: players.position,
      createdAt: players.createdAt,
    })
    .from(players)
    .where(eq(players.id, playerId));

  if (!player) return null;

  const cohort = cohortKey(player.graduationYear, player.position);

  // Only the player's own cohort is needed to place them.
  const peers = await db
    .select({
      id: players.id,
      graduationYear: players.graduationYear,
      position: players.position,
      createdAt: players.createdAt,
    })
    .from(players);

  const inCohort = peers.filter((p) => cohortKey(p.graduationYear, p.position) === cohort);
  const scores = await scoresForPlayers(inCohort.map((p) => p.id));

  const percentiles = percentilesByCohort(
    inCohort.map((p) => ({
      playerId: p.id,
      score: scores.get(p.id) ?? null,
      createdAt: p.createdAt,
      cohort,
    })),
  );

  const percentile = percentiles.get(playerId) ?? null;
  const tier = computeRarity({ percentile, createdAt: player.createdAt }, now);

  await db
    .update(players)
    .set({ rarityTier: tier, rarityPercentile: percentile, rarityComputedAt: now })
    .where(eq(players.id, playerId));

  return { playerId, tier, percentile };
}

/* ------------------------------------------------------------- scheduler */

let timer: NodeJS.Timeout | null = null;

/** ms until the next 03:00 local, which is the quietest hour for this audience. */
function msUntilNextRun(now: Date = new Date()): number {
  const next = new Date(now);
  next.setHours(3, 0, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

/**
 * Nightly recompute.
 *
 * setTimeout rather than setInterval so a slow run cannot overlap the next one,
 * and so the schedule does not drift. A failure logs and reschedules: a missed
 * night is a stale tier, not an outage.
 */
export function startRarityScheduler(): void {
  if (timer) return;

  const schedule = () => {
    timer = setTimeout(async () => {
      try {
        const result = await recomputeAllRarity();
        console.log(
          `[rarity] nightly recompute: ${result.scanned} scanned, ${result.updated} updated, ${result.promoted.length} tier changes`,
        );
        for (const change of result.promoted) {
          onTierChanged(change);
        }
      } catch (err) {
        console.error("[rarity] nightly recompute failed:", (err as Error).message);
      }

      /* Grade history snapshots ride the same nightly pass (pivot Section 5).
         A second timer would mean two schedules to reason about and two chances
         to drift. Imported lazily to keep the module cycle one directional:
         progressionService imports from here, not the other way round. */
      try {
        const { recordNightlySnapshots } = await import("./progressionService");
        const snap = await recordNightlySnapshots();
        console.log(
          `[progression] nightly snapshots: ${snap.scanned} scanned, ${snap.events.length} events`,
        );
      } catch (err) {
        console.error("[progression] nightly snapshots failed:", (err as Error).message);
      }
      schedule();
    }, msUntilNextRun());

    // Never hold the process open for this.
    timer.unref?.();
  };

  schedule();
}

export function stopRarityScheduler(): void {
  if (timer) clearTimeout(timer);
  timer = null;
}

/* ---------------------------------------------------------------- events */

export type TierChangeHandler = (change: RarityResult) => void;

const handlers: TierChangeHandler[] = [];

/**
 * Notification hook. INTERFACE ONLY, deliberately.
 *
 * Section 5 defines the event set and Section 8 the metrics. Push itself is
 * explicitly out of scope, so this registers listeners and calls them; it does
 * not send anything anywhere.
 */
export function onTierChange(handler: TierChangeHandler): () => void {
  handlers.push(handler);
  return () => {
    const i = handlers.indexOf(handler);
    if (i >= 0) handlers.splice(i, 1);
  };
}

export function onTierChanged(change: RarityResult): void {
  for (const handler of handlers) {
    try {
      handler(change);
    } catch (err) {
      // A bad listener must never break the recompute.
      console.error("[rarity] tier change handler threw:", (err as Error).message);
    }
  }
}
