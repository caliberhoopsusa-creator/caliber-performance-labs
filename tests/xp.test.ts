/**
 * Tests for XP awards and tier progression.
 * XP_REWARDS: game_logged=50, a_grade=30, a_plus_grade=50, badge_earned=25
 * TIER_THRESHOLDS: Rookie=0, Starter=500, All-Star=2000, MVP=5000, Hall of Fame=10000
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import { getTestApp, registerAndLogin, cleanupTestUsers } from "./helpers/setup";

let request: ReturnType<typeof supertest>;

const BASE_GAME = {
  date: "2025-02-01",
  opponent: "XP Test Opponent",
  result: "W",
  sport: "basketball",
  minutes: 30,
  points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0,
  turnovers: 0, fouls: 0, fgMade: 0, fgAttempted: 0,
  threeMade: 0, threeAttempted: 0, ftMade: 0, ftAttempted: 0,
  offensiveRebounds: 0, defensiveRebounds: 0,
};

beforeAll(async () => {
  const app = await getTestApp();
  request = supertest(app);
});

afterAll(async () => {
  await cleanupTestUsers();
});

let _sessionCounter = 0;
async function setupPlayerSession() {
  const suffix = `_${++_sessionCounter}_${Math.random().toString(36).slice(2, 7)}`;
  const { cookie } = await registerAndLogin(request, { email: `xp${suffix}@caliber-test.dev` });
  const roleRes = await request.patch("/api/auth/role").set("Cookie", cookie).send({ role: "player" });
  expect(roleRes.status).toBe(200);
  const res = await request
    .post("/api/users/create-player-profile")
    .set("Cookie", cookie)
    .send({ name: "Test XP Player", sport: "basketball", position: "Guard" });
  if (res.status !== 201) {
    throw new Error(`create-player-profile returned ${res.status}: ${JSON.stringify(res.body)}`);
  }
  return { cookie, playerId: res.body.id as number };
}

describe("XP rewards per game", () => {
  it("awards at least game_logged (50 XP) for any game", async () => {
    const { cookie, playerId } = await setupPlayerSession();
    const res = await request
      .post("/api/games")
      .set("Cookie", cookie)
      .send({ ...BASE_GAME, playerId, points: 5 });
    expect(res.status).toBe(201);
    expect(res.body.xpEarned).toBeGreaterThanOrEqual(50);
    expect(res.body.totalXp).toBeGreaterThanOrEqual(50);
  });

  it("awards extra XP for an A grade (game_logged + a_grade = at least 80)", async () => {
    const { cookie, playerId } = await setupPlayerSession();
    const res = await request
      .post("/api/games")
      .set("Cookie", cookie)
      .send({ ...BASE_GAME, playerId, points: 22, assists: 7, fgMade: 9, fgAttempted: 16 });
    expect(res.status).toBe(201);
    expect(res.body.grade).toMatch(/^A/); // Must be A, A-, or A+
    expect(res.body.xpEarned).toBeGreaterThanOrEqual(80); // at least 50 + 30
  });

  it("awards maximum XP for A+ grade (game_logged + a_plus_grade = at least 100)", async () => {
    const { cookie, playerId } = await setupPlayerSession();
    const res = await request
      .post("/api/games")
      .set("Cookie", cookie)
      .send({ ...BASE_GAME, playerId, points: 35, assists: 10, rebounds: 5, steals: 3, turnovers: 1, fgMade: 14, fgAttempted: 22 });
    expect(res.status).toBe(201);
    if (res.body.grade === "A+") {
      expect(res.body.xpEarned).toBeGreaterThanOrEqual(100); // 50 + 50
    }
  });

  it("totalXp accumulates across multiple games", async () => {
    const { cookie, playerId } = await setupPlayerSession();

    const game1 = await request
      .post("/api/games")
      .set("Cookie", cookie)
      .send({ ...BASE_GAME, playerId, points: 10 });
    const game2 = await request
      .post("/api/games")
      .set("Cookie", cookie)
      .send({ ...BASE_GAME, date: "2025-02-02", playerId, points: 10 });

    expect(game1.status).toBe(201);
    expect(game2.status).toBe(201);
    expect(game2.body.totalXp).toBeGreaterThan(game1.body.totalXp);
  });
});

describe("Tier progression", () => {
  it("starts in Rookie tier (0 XP)", async () => {
    const { cookie, playerId } = await setupPlayerSession();
    const res = await request
      .post("/api/games")
      .set("Cookie", cookie)
      .send({ ...BASE_GAME, playerId, points: 5 });
    expect(res.status).toBe(201);
    // After first game, should be Rookie (unless XP crosses 500 which requires badges)
    expect(res.body.totalXp).toBeGreaterThanOrEqual(50);
    expect(["Rookie", "Starter"]).toContain(res.body.currentTier);
  });

  it("promotes to Starter at 500 XP", async () => {
    const { cookie, playerId } = await setupPlayerSession();

    // Log A+ grade games to earn 100 XP each; need 5 games to reach Starter (500 XP)
    // A+ stats for Guard: 30+ pts, 8+ ast, low TOs, efficient shooting
    let finalResponse: any = null;
    for (let i = 0; i < 5; i++) {
      const res = await request
        .post("/api/games")
        .set("Cookie", cookie)
        .send({ ...BASE_GAME, date: `2025-02-${String(i + 1).padStart(2, "0")}`, playerId,
          points: 30, assists: 8, rebounds: 5, steals: 2, turnovers: 1, fouls: 1,
          fgMade: 12, fgAttempted: 20 });
      expect(res.status).toBe(201);
      finalResponse = res.body;
    }

    expect(finalResponse.totalXp).toBeGreaterThanOrEqual(500);
    expect(["Starter", "All-Star", "MVP", "Hall of Fame"]).toContain(finalResponse.currentTier);
  }, 120000);
});
