/**
 * The leaderboard shows THE Caliber Grade (pivot Section 6A).
 *
 * This endpoint used to carry its own private copy of the grade ladder and
 * then round the average to a bare letter, so a player reading "A-" on their
 * own card was listed here as "A". It also scored an ungraded game as a C,
 * which put a grade on a game nobody had graded.
 *
 * The premise of the page is that a rank is a card you could have, which only
 * holds if the grade on the leaderboard card is the same number as the grade
 * on the player's own card. These pin that.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import { getTestApp, registerAndLogin, cleanupTestUsers } from "./helpers/setup.js";
import { db } from "../server/db";
import { players, games } from "@shared/schema";
import { eq } from "drizzle-orm";
import { GRADE_LADDER } from "@shared/progression";

let request: ReturnType<typeof supertest>;
const TS = Date.now();
const NAME = `Test Ladder ${TS}`;
let playerId: number;
let cookie: string;

const BASE_GAME = {
  date: "2025-03-01",
  opponent: "Ladder Test Opponent",
  result: "W",
  sport: "basketball",
  minutes: 30,
  points: 14, rebounds: 4, assists: 3, steals: 1, blocks: 0,
  turnovers: 2, fouls: 1, fgMade: 6, fgAttempted: 12,
  threeMade: 1, threeAttempted: 3, ftMade: 1, ftAttempted: 2,
  offensiveRebounds: 1, defensiveRebounds: 3,
};

/** The player's own row, or undefined when they are not ranked. */
async function myRow() {
  const res = await request.get("/api/analytics/leaderboard");
  expect(res.status).toBe(200);
  return (res.body as Array<{ name: string; avgGrade: string }>)
    .find((r) => r.name === NAME);
}

beforeAll(async () => {
  request = supertest(await getTestApp());

  const auth = await registerAndLogin(request, { email: `ladder_${TS}@caliber-test.dev` });
  cookie = auth.cookie;
  await request.patch("/api/auth/role").set("Cookie", cookie).send({ role: "player" });

  const prof = await request
    .post("/api/users/create-player-profile")
    .set("Cookie", cookie)
    .send({ name: NAME, sport: "basketball", position: "SG", level: "high_school" });
  if (prof.status !== 201) throw new Error(`setup failed: ${JSON.stringify(prof.body)}`);
  playerId = prof.body.id;

  await request.post("/api/games").set("Cookie", cookie).send({ ...BASE_GAME, playerId });
  await request.post("/api/games").set("Cookie", cookie).send({ ...BASE_GAME, playerId });
});

afterAll(async () => {
  if (playerId) {
    await db.delete(games).where(eq(games.playerId, playerId));
    await db.delete(players).where(eq(players.id, playerId));
  }
  await cleanupTestUsers(`ladder_${TS}@caliber-test.dev`);
});

describe("GET /api/analytics/leaderboard reports the real grade", () => {
  it("keeps a modifier instead of collapsing it to the bare letter", async () => {
    // Arrange: every game graded A-, so the mean is exactly A-.
    await db.update(games).set({ grade: "A-" }).where(eq(games.playerId, playerId));

    // Act
    const row = await myRow();

    // Assert: "A" here would be the old rounding, and would disagree with the
    // player's own card.
    expect(row?.avgGrade).toBe("A-");
  });

  it("only ever returns a letter that exists on the shared ladder", async () => {
    const letters = GRADE_LADDER.map(([letter]) => letter);
    const res = await request.get("/api/analytics/leaderboard");

    for (const row of res.body as Array<{ avgGrade: string }>) {
      expect(letters).toContain(row.avgGrade);
    }
  });

  it("skips an ungraded game rather than scoring it as a C", async () => {
    // Arrange: one A-, one with no grade at all.
    const rows = await db.select({ id: games.id }).from(games)
      .where(eq(games.playerId, playerId));
    await db.update(games).set({ grade: "A-" }).where(eq(games.playerId, playerId));
    await db.update(games).set({ grade: null }).where(eq(games.id, rows[0]!.id));

    // Act
    const row = await myRow();

    // Assert: averaging the ungraded game in as a C would drag this to a B.
    expect(row?.avgGrade).toBe("A-");
  });

  it("leaves a player with no graded game off the board entirely", async () => {
    // A player who has logged games but has no grade yet has no rank. The old
    // code floored them to F and ranked them last, which is a fabricated grade.
    await db.update(games).set({ grade: null }).where(eq(games.playerId, playerId));

    expect(await myRow()).toBeUndefined();
  });
});
