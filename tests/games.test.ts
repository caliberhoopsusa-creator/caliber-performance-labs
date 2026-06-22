/**
 * Game Creation & Downstream Effects Tests
 *
 * Covers: POST /api/games → XP award, badge award, personal records, feed activities
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import { db } from "../server/db.js";
import { players, games, badges, personalRecords, feedActivities } from "../shared/schema.js";
import { eq, and } from "drizzle-orm";
import { users } from "../shared/models/auth.js";
import { getTestApp, extractCookies, registerAndLogin } from "./helpers/setup.js";

const TS = Date.now();
let request: ReturnType<typeof supertest>;
let cookie: string;
let userId: string;
let playerId: number;

// Minimal basketball game payload
function basketballGame(overrides: Record<string, unknown> = {}) {
  return {
    playerId,
    sport: "basketball",
    date: new Date().toISOString().split("T")[0],
    opponent: "Test Opponent",
    result: "W",
    minutes: 32,
    points: 18,
    rebounds: 7,
    assists: 4,
    steals: 2,
    blocks: 1,
    turnovers: 2,
    fouls: 2,
    fgMade: 7,
    fgAttempted: 14,
    threeMade: 2,
    threeAttempted: 5,
    ftMade: 2,
    ftAttempted: 2,
    offensiveRebounds: 2,
    defensiveRebounds: 5,
    ...overrides,
  };
}

beforeAll(async () => {
  const app = await getTestApp();
  request = supertest(app);

  // Register + login as a player
  const auth = await registerAndLogin(request, {
    email: `games_test_${TS}@caliber-test.dev`,
    firstName: "Test",
    lastName: "GamePlayer",
  });
  cookie = auth.cookie;
  userId = auth.userId;

  // Set role to player
  await request.patch("/api/auth/role").set("Cookie", cookie).send({ role: "player" });

  // Create a player profile linked to this user
  const playerRes = await request
    .post("/api/users/create-player-profile")
    .set("Cookie", cookie)
    .send({
      name: "Test GamePlayer",
      sport: "basketball",
      position: "Guard",
      level: "high_school",
    });

  if (playerRes.status !== 200 && playerRes.status !== 201) {
    throw new Error(`Failed to create player profile: ${playerRes.status} ${JSON.stringify(playerRes.body)}`);
  }
  playerId = playerRes.body.id;
});

afterAll(async () => {
  // Delete all test data in dependency order
  if (playerId) {
    await db.delete(feedActivities).where(eq(feedActivities.playerId, playerId));
    await db.delete(personalRecords).where(eq(personalRecords.playerId, playerId));
    await db.delete(badges).where(eq(badges.playerId, playerId));
    await db.delete(games).where(eq(games.playerId, playerId));
    await db.delete(players).where(eq(players.id, playerId));
  }
  if (userId) {
    await db.delete(users).where(eq(users.id, userId));
  }
});

describe("POST /api/games – authentication", () => {
  it("returns 401 without a session", async () => {
    const res = await request.post("/api/games").send(basketballGame());
    expect(res.status).toBe(401);
  });
});

describe("POST /api/games – validation", () => {
  it("rejects fgMade > fgAttempted", async () => {
    const res = await request
      .post("/api/games")
      .set("Cookie", cookie)
      .send(basketballGame({ fgMade: 10, fgAttempted: 5 }));

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot exceed/i);
  });

  it("rejects threeMade > threeAttempted", async () => {
    const res = await request
      .post("/api/games")
      .set("Cookie", cookie)
      .send(basketballGame({ threeMade: 8, threeAttempted: 3 }));

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot exceed/i);
  });

  it("rejects ftMade > ftAttempted", async () => {
    const res = await request
      .post("/api/games")
      .set("Cookie", cookie)
      .send(basketballGame({ ftMade: 5, ftAttempted: 2 }));

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot exceed/i);
  });
});

describe("POST /api/games – successful creation", () => {
  let gameId: number;
  let initialXp: number;

  beforeAll(async () => {
    // Capture XP before game
    const [p] = await db.select().from(players).where(eq(players.id, playerId));
    initialXp = p?.totalXp ?? 0;
  });

  it("creates a game and returns the game object", async () => {
    const res = await request
      .post("/api/games")
      .set("Cookie", cookie)
      .send(basketballGame());

    expect(res.status).toBe(201);
    // Game fields are spread at top level (not nested under .game)
    expect(res.body.playerId).toBe(playerId);
    expect(res.body.points).toBe(18);
    expect(res.body.opponent).toBe("Test Opponent");
    expect(res.body.id).toBeDefined();
    gameId = res.body.id;
  });

  it("awards XP to the player after game creation", async () => {
    // XP_REWARDS.game_logged = 50; grade bonus may also apply
    const [p] = await db.select().from(players).where(eq(players.id, playerId));
    expect(p.totalXp).toBeGreaterThan(initialXp);
    expect(p.totalXp - initialXp).toBeGreaterThanOrEqual(50); // at least game_logged XP
  });

  it("sets a player tier (Rookie by default)", async () => {
    const [p] = await db.select().from(players).where(eq(players.id, playerId));
    expect(p.currentTier).toBeTruthy();
    // Should be Rookie since XP < 500
    expect(p.currentTier).toBe("Rookie");
  });

  it("creates personal records for the first game", async () => {
    const records = await db
      .select()
      .from(personalRecords)
      .where(eq(personalRecords.playerId, playerId));

    // Should record at least points, rebounds, assists
    const recordedStats = records.map((r) => r.statName);
    expect(recordedStats).toContain("points");
    expect(recordedStats).toContain("rebounds");
    expect(recordedStats).toContain("assists");
  });

  it("creates at least one feed activity for the game", async () => {
    const activities = await db
      .select()
      .from(feedActivities)
      .where(eq(feedActivities.playerId, playerId));

    expect(activities.length).toBeGreaterThan(0);
  });

  it("returns XP info and advanced metrics in the response", async () => {
    const res = await request
      .post("/api/games")
      .set("Cookie", cookie)
      .send(basketballGame({ opponent: "Second Opponent" }));

    expect(res.status).toBe(201);
    expect(res.body.xpEarned).toBeGreaterThanOrEqual(50);
    expect(res.body.totalXp).toBeGreaterThan(0);
    expect(res.body.advancedMetrics).toBeDefined();
    expect(res.body.improvementTips).toBeDefined();
    expect(res.body.newRecords).toBeDefined();
  });
});

describe("POST /api/games – badge awarding", () => {
  it("awards double-double badge when pts>=10 and reb>=10", async () => {
    const res = await request
      .post("/api/games")
      .set("Cookie", cookie)
      .send(basketballGame({
        points: 20,
        rebounds: 10,
        assists: 3,
        fgMade: 8, fgAttempted: 15,
      }));

    expect(res.status).toBe(201);

    // Badges are saved to the DB - check there
    const playerBadges = await db
      .select()
      .from(badges)
      .where(eq(badges.playerId, playerId));

    const badgeTypes = playerBadges.map((b) => b.badgeType);
    expect(badgeTypes).toContain("double_double");
  });

  it("awards twenty_piece badge when pts>=20", async () => {
    const res = await request
      .post("/api/games")
      .set("Cookie", cookie)
      .send(basketballGame({ points: 22, fgMade: 9, fgAttempted: 18 }));

    expect(res.status).toBe(201);

    const playerBadges = await db
      .select()
      .from(badges)
      .where(eq(badges.playerId, playerId));

    const badgeTypes = playerBadges.map((b) => b.badgeType);
    expect(badgeTypes).toContain("twenty_piece");
  });
});

describe("Personal record progression", () => {
  it("updates personal record when new high is set", async () => {
    // First, get current record for points
    const before = await db
      .select()
      .from(personalRecords)
      .where(and(eq(personalRecords.playerId, playerId), eq(personalRecords.statName, "points")));

    const prevBest = before[0]?.value ?? 0;
    const newHigh = prevBest + 10;

    const res = await request
      .post("/api/games")
      .set("Cookie", cookie)
      .send(basketballGame({
        points: newHigh,
        fgMade: Math.ceil(newHigh / 2),
        fgAttempted: newHigh,
      }));

    expect(res.status).toBe(201);

    const after = await db
      .select()
      .from(personalRecords)
      .where(and(eq(personalRecords.playerId, playerId), eq(personalRecords.statName, "points")));

    expect(after[0].value).toBe(newHigh);
    expect(after[0].previousValue).toBe(prevBest);
  });
});

describe("GET /api/games – list games", () => {
  it("returns games for authenticated user", async () => {
    const res = await request
      .get("/api/games")
      .query({ playerId })
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].playerId).toBe(playerId);
  });

  it("returns 401 without session", async () => {
    const res = await request.get("/api/games").query({ playerId });
    expect(res.status).toBe(401);
  });
});
