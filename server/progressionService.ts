/**
 * Grade progression persistence and event emission (pivot Section 5).
 *
 * `shared/progression.ts` holds the rules. This records the history, fires the
 * events, and owns the notification hook.
 *
 * Recorded on four triggers: a logged game, a film upload, a coach cosign, and
 * the nightly pass. Each writes one append only `grade_history` row, so the
 * card's 30 day arrow reads real history rather than a guess.
 */
import { db } from "./db";
import { gradeHistory, players, games } from "@shared/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import {
  caliberGrade,
  deriveEvents,
  computeTrend,
  TREND_WINDOW_DAYS,
  type GradeTrigger,
  type ProgressionEvent,
  type ProgressionSnapshot,
  type Trend,
} from "@shared/progression";
import { recomputeRarityForPlayer } from "./rarityService";
import type { RarityTier } from "@shared/rarity";

/** The player's current Caliber Grade, from the shared definition. */
async function currentGrade(playerId: number): Promise<{ grade: string; value: number } | null> {
  const rows = await db
    .select({ grade: games.grade })
    .from(games)
    .where(eq(games.playerId, playerId));

  return caliberGrade(rows.map((r) => r.grade));
}

async function latestSnapshot(playerId: number): Promise<ProgressionSnapshot | null> {
  const [row] = await db
    .select()
    .from(gradeHistory)
    .where(eq(gradeHistory.playerId, playerId))
    .orderBy(desc(gradeHistory.computedAt), desc(gradeHistory.id))
    .limit(1);

  if (!row) return null;
  return {
    grade: row.grade,
    gradeValue: row.gradeValue,
    tier: (row.tier as RarityTier | null) ?? null,
  };
}

/**
 * Recomputes a player's grade, records it, and emits whatever moved.
 *
 * Returns the events so a caller can act on them synchronously; they are also
 * dispatched to any registered handler.
 *
 * A player with no graded games records nothing. There is no grade to have a
 * history of, and writing a zero would put a number on the card that the player
 * never earned.
 */
export async function recordGradeSnapshot(
  playerId: number,
  trigger: GradeTrigger,
  now: Date = new Date(),
): Promise<ProgressionEvent[]> {
  const current = await currentGrade(playerId);
  if (!current) return [];

  // Rarity first, so the snapshot stores the tier this grade produced rather
  // than the one it replaced.
  const rarity = await recomputeRarityForPlayer(playerId, now).catch(() => null);
  const tier = rarity?.tier ?? null;

  const previous = await latestSnapshot(playerId);

  // Nothing moved, so nothing to record. Keeps the nightly pass from writing a
  // row per player per day for players who did not play.
  if (
    previous &&
    previous.gradeValue === current.value &&
    previous.tier === tier
  ) {
    return [];
  }

  await db.insert(gradeHistory).values({
    playerId,
    grade: current.grade,
    gradeValue: current.value,
    tier,
    computedAt: now,
    trigger,
  });

  const events = deriveEvents(
    playerId,
    previous,
    { grade: current.grade, gradeValue: current.value, tier },
    trigger,
    now,
  );

  for (const event of events) emit(event);
  return events;
}

/** The trailing window of history a trend is computed from. */
export async function trendForPlayer(
  playerId: number,
  now: Date = new Date(),
  windowDays: number = TREND_WINDOW_DAYS,
): Promise<Trend> {
  const cutoff = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({ gradeValue: gradeHistory.gradeValue, computedAt: gradeHistory.computedAt })
    .from(gradeHistory)
    .where(and(eq(gradeHistory.playerId, playerId), gte(gradeHistory.computedAt, cutoff)))
    .orderBy(gradeHistory.computedAt);

  return computeTrend(
    rows.map((r) => ({ gradeValue: r.gradeValue, computedAt: r.computedAt ?? now })),
    now,
    windowDays,
  );
}

/**
 * Nightly pass over every player.
 *
 * Runs alongside the rarity recompute. Most nights this writes nothing: a
 * snapshot is only recorded when the grade or tier actually moved.
 */
export async function recordNightlySnapshots(now: Date = new Date()): Promise<{
  scanned: number;
  recorded: number;
  events: ProgressionEvent[];
}> {
  const all = await db.select({ id: players.id }).from(players);
  const events: ProgressionEvent[] = [];
  let recorded = 0;

  for (const player of all) {
    try {
      const produced = await recordGradeSnapshot(player.id, "nightly", now);
      if (produced.length > 0) events.push(...produced);
      // deriveEvents can return nothing on a first snapshot that was still
      // written, so count the write separately from the events.
      const latest = await latestSnapshot(player.id);
      if (latest) recorded += 1;
    } catch (err) {
      // One bad player must not stop the pass.
      console.error(`[progression] player ${player.id} failed:`, (err as Error).message);
    }
  }

  return { scanned: all.length, recorded, events };
}

/* ---------------------------------------------------------------- events */

export type ProgressionHandler = (event: ProgressionEvent) => void;

const handlers: ProgressionHandler[] = [];

/** Subscribe to progression events. Returns an unsubscribe function. */
export function onProgression(handler: ProgressionHandler): () => void {
  handlers.push(handler);
  return () => {
    const i = handlers.indexOf(handler);
    if (i >= 0) handlers.splice(i, 1);
  };
}

function emit(event: ProgressionEvent): void {
  for (const handler of handlers) {
    try {
      handler(event);
    } catch (err) {
      // A bad listener must never break a recomputation.
      console.error("[progression] handler threw:", (err as Error).message);
    }
  }
}

/* ---------------------------------------------------- notification hook */

export interface TierPromotionNotification {
  playerId: number;
  from: RarityTier | null;
  to: RarityTier | null;
  at: Date;
}

export type TierPromotionNotifier = (n: TierPromotionNotification) => void | Promise<void>;

let notifier: TierPromotionNotifier | null = null;

/**
 * Notification hook. INTERFACE ONLY, deliberately.
 *
 * Section 5 asks for the hook and explicitly not for push. Registering a
 * notifier here wires the seam; nothing sends anything until something is
 * registered, and nothing is registered yet.
 */
export function setTierPromotionNotifier(fn: TierPromotionNotifier | null): void {
  notifier = fn;
}

/** Fires the notifier on tier_promoted. Registered once at startup. */
export function startProgressionNotifications(): () => void {
  return onProgression((event) => {
    if (event.name !== "tier_promoted" || !notifier) return;
    try {
      void notifier({
        playerId: event.playerId,
        from: event.tier.from,
        to: event.tier.to,
        at: event.at,
      });
    } catch (err) {
      console.error("[progression] notifier threw:", (err as Error).message);
    }
  });
}
