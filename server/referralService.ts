/**
 * The referral loop: roster placeholders and claiming (pivot Section 7).
 *
 * A player finishes their profile, names the teammates they actually play
 * with, and each one becomes a claimable placeholder. The teammate follows a
 * link, sees the card of the person who invited them, and takes the profile
 * over.
 *
 * Two rules run through everything here, and both exist because a placeholder
 * describes a real teenager who has not signed up:
 *
 *   1. A placeholder is invisible until it is claimed. It is kept out of every
 *      public listing, not only the leaderboard. Until someone claims it there
 *      is nobody who can exercise the rights the privacy policy promises, so
 *      the safe state is that the outside world cannot see it at all.
 *   2. The claim token is random and stored. The older family invite code is a
 *      six character hash of a salt committed to this repo, which can be
 *      enumerated offline. Taking over a row that holds a minor's name needs
 *      better than that.
 *
 * Structured as a service module rather than methods on IStorage, matching
 * rarityService and progressionService from Sections 3 and 5.
 */
import crypto from "crypto";
import { db } from "./db";
import { players, referrals, games } from "@shared/schema";
import { users } from "@shared/models/auth";
import { eq, and, isNull, inArray, sql } from "drizzle-orm";
import { normalizePosition } from "@shared/sports-config";
import { caliberGrade } from "@shared/progression";

/**
 * How many teammates one player may add.
 *
 * A basketball roster is about twelve to fifteen. This is not a growth lever
 * to be maxed out; it is a cap that stops one account minting hundreds of
 * profiles for people who never agreed to be here.
 */
export const MAX_ROSTER_SIZE = 15;

/** 48 hex characters. Long enough that guessing is not a strategy. */
export function newClaimToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

export interface RosterEntry {
  name: string;
  position: string;
  jerseyNumber?: number | null;
}

export interface PlaceholderResult {
  playerId: number;
  name: string;
  claimToken: string;
}

/**
 * Every placeholder that nobody has claimed yet.
 *
 * Callers use this to subtract placeholders from a public list. It is a single
 * query returning a Set, so filtering a listing stays O(n) with no extra round
 * trips per row.
 */
export async function unclaimedPlaceholderIds(): Promise<Set<number>> {
  const rows = await db
    .select({ id: referrals.placeholderPlayerId })
    .from(referrals)
    .where(isNull(referrals.claimedAt));
  return new Set(rows.map((r) => r.id));
}

/**
 * Add teammates to a player's roster, creating one placeholder each.
 *
 * Duplicate names on the same roster are skipped rather than erroring, because
 * the caller is a person typing a list and retrying a partially failed submit
 * should not create twins.
 */
export async function addRosterTeammates(
  referrerPlayerId: number,
  entries: RosterEntry[],
): Promise<{ created: PlaceholderResult[]; skipped: string[] }> {
  const referrer = await db.query.players.findFirst({
    where: eq(players.id, referrerPlayerId),
  });
  if (!referrer) throw new Error("Referrer player not found");

  const existing = await db
    .select({ placeholderPlayerId: referrals.placeholderPlayerId })
    .from(referrals)
    .where(eq(referrals.referrerPlayerId, referrerPlayerId));

  if (existing.length >= MAX_ROSTER_SIZE) {
    throw new Error(`Roster is full at ${MAX_ROSTER_SIZE} teammates`);
  }

  const existingNames = new Set(
    (existing.length
      ? await db
          .select({ name: players.name })
          .from(players)
          .where(inArray(players.id, existing.map((e) => e.placeholderPlayerId)))
      : []
    ).map((p) => p.name.trim().toLowerCase()),
  );

  const created: PlaceholderResult[] = [];
  const skipped: string[] = [];
  let budget = MAX_ROSTER_SIZE - existing.length;

  for (const entry of entries) {
    const name = entry.name.trim();
    const key = name.toLowerCase();

    if (!name || existingNames.has(key) || budget <= 0) {
      skipped.push(entry.name);
      continue;
    }

    const position = normalizePosition(entry.position);
    if (!position) {
      skipped.push(entry.name);
      continue;
    }

    /* The placeholder inherits the referrer's team, sport and level, because
       that is the only thing we actually know about this person: they play
       with the person who added them. Nothing else is invented. */
    const [placeholder] = await db
      .insert(players)
      .values({
        userId: null,
        name,
        sport: referrer.sport,
        position,
        team: referrer.team,
        jerseyNumber: entry.jerseyNumber ?? null,
        level: referrer.level,
        /* Hidden until claimed. Belt as well as the braces of the referrals
           join, so a listing that forgets to subtract placeholders still does
           not expose one. */
        profileVisibility: "hidden",
      })
      .returning();

    const claimToken = newClaimToken();
    await db.insert(referrals).values({
      referrerPlayerId,
      placeholderPlayerId: placeholder!.id,
      claimToken,
    });

    created.push({ playerId: placeholder!.id, name, claimToken });
    existingNames.add(key);
    budget -= 1;
  }

  return { created, skipped };
}

export interface RosterRow {
  playerId: number;
  name: string;
  position: string;
  jerseyNumber: number | null;
  claimToken: string;
  claimed: boolean;
  createdAt: Date | null;
}

/** The roster one player has built, with claim state. */
export async function rosterForPlayer(referrerPlayerId: number): Promise<RosterRow[]> {
  const rows = await db
    .select({
      playerId: players.id,
      name: players.name,
      position: players.position,
      jerseyNumber: players.jerseyNumber,
      claimToken: referrals.claimToken,
      claimedAt: referrals.claimedAt,
      createdAt: referrals.createdAt,
    })
    .from(referrals)
    .innerJoin(players, eq(players.id, referrals.placeholderPlayerId))
    .where(eq(referrals.referrerPlayerId, referrerPlayerId));

  return rows.map((r) => ({
    playerId: r.playerId,
    name: r.name,
    position: r.position,
    jerseyNumber: r.jerseyNumber,
    claimToken: r.claimToken,
    claimed: r.claimedAt !== null,
    createdAt: r.createdAt,
  }));
}

export interface ClaimPreview {
  placeholderName: string;
  placeholderPlayerId: number;
  /** The card of whoever invited them. This is the reason the link works. */
  referrer: {
    playerId: number;
    name: string;
    position: string;
    school: string | null;
    graduationYear: number | null;
    photoUrl: string | null;
    rarityTier: string | null;
    rarityPercentile: number | null;
    createdAt: Date | null;
    /** Null when they have no graded game. Never a fabricated letter. */
    grade: string | null;
    avgPoints: number | null;
    gamesPlayed: number;
  };
  alreadyClaimed: boolean;
}

/**
 * What a claim link shows before anyone signs in.
 *
 * Deliberately returns the referrer's public card fields and nothing about the
 * placeholder beyond the name the referrer typed. The visitor has not proven
 * who they are yet.
 */
export async function previewClaim(token: string): Promise<ClaimPreview | null> {
  const [row] = await db
    .select({
      placeholderPlayerId: referrals.placeholderPlayerId,
      referrerPlayerId: referrals.referrerPlayerId,
      claimedAt: referrals.claimedAt,
    })
    .from(referrals)
    .where(eq(referrals.claimToken, token))
    .limit(1);

  if (!row) return null;

  const placeholder = await db.query.players.findFirst({
    where: eq(players.id, row.placeholderPlayerId),
  });
  const referrer = await db.query.players.findFirst({
    where: eq(players.id, row.referrerPlayerId),
  });
  if (!placeholder || !referrer) return null;

  /* The referrer's real card, because the card is the whole pitch. If they
     have no graded game there is no grade, and the page says so rather than
     showing a number nobody earned. */
  const referrerGames = await db
    .select({ grade: games.grade, points: games.points })
    .from(games)
    .where(eq(games.playerId, referrer.id));

  const overall = caliberGrade(referrerGames.map((g) => g.grade));
  const avgPoints = referrerGames.length
    ? Number(
        (referrerGames.reduce((acc, g) => acc + (g.points ?? 0), 0) / referrerGames.length)
          .toFixed(1),
      )
    : null;

  return {
    placeholderName: placeholder.name,
    placeholderPlayerId: placeholder.id,
    referrer: {
      playerId: referrer.id,
      name: referrer.name,
      position: referrer.position,
      /* The referrer's own privacy flag still applies on a page that is
         reachable by anyone holding the link. */
      school: referrer.showSchool !== false ? referrer.school : null,
      graduationYear: referrer.graduationYear,
      photoUrl: referrer.photoUrl,
      rarityTier: referrer.rarityTier,
      rarityPercentile: referrer.rarityPercentile,
      createdAt: referrer.createdAt,
      grade: overall?.grade ?? null,
      avgPoints,
      gamesPlayed: referrerGames.length,
    },
    alreadyClaimed: row.claimedAt !== null,
  };
}

export type ClaimFailure =
  | "not_found"
  | "already_claimed"
  | "user_has_player";

export interface ClaimSuccess {
  playerId: number;
  name: string;
}

/**
 * Hand a placeholder over to the user claiming it.
 *
 * Refuses when the claimer already has a player profile. Merging two profiles
 * is a real feature with real edge cases (whose games, whose grade history,
 * whose rarity) and guessing at it would silently destroy somebody's record.
 */
export async function claimPlaceholder(
  token: string,
  userId: string,
): Promise<{ ok: true; player: ClaimSuccess } | { ok: false; reason: ClaimFailure }> {
  const [row] = await db
    .select()
    .from(referrals)
    .where(eq(referrals.claimToken, token))
    .limit(1);

  if (!row) return { ok: false, reason: "not_found" };
  if (row.claimedAt !== null) return { ok: false, reason: "already_claimed" };

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (user?.playerId) return { ok: false, reason: "user_has_player" };

  const existingPlayer = await db.query.players.findFirst({
    where: eq(players.userId, userId),
  });
  if (existingPlayer) return { ok: false, reason: "user_has_player" };

  /* Guarded update: claimedAt must still be null at write time, so two people
     racing the same link cannot both win. */
  const claimed = await db
    .update(referrals)
    .set({ claimedAt: new Date(), claimedByUserId: userId })
    .where(and(eq(referrals.id, row.id), isNull(referrals.claimedAt)))
    .returning();

  if (claimed.length === 0) return { ok: false, reason: "already_claimed" };

  const [player] = await db
    .update(players)
    .set({
      userId,
      /* It stops being a placeholder the moment someone owns it, so the
         default visibility from creation is lifted. */
      profileVisibility: "public",
    })
    .where(eq(players.id, row.placeholderPlayerId))
    .returning();

  await db.update(users).set({ playerId: row.placeholderPlayerId }).where(eq(users.id, userId));

  /* Credit the referrer, using the counter the existing referral system
     already keeps rather than adding a second one. */
  const referrerPlayer = await db.query.players.findFirst({
    where: eq(players.id, row.referrerPlayerId),
  });
  if (referrerPlayer?.userId) {
    await db
      .update(users)
      .set({ referralConversions: sql`COALESCE(${users.referralConversions}, 0) + 1` })
      .where(eq(users.id, referrerPlayer.userId));
  }

  return { ok: true, player: { playerId: player!.id, name: player!.name } };
}
