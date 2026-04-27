/**
 * Tests for badge award logic.
 * Badges are checked and awarded server-side after each game.
 * Tests verify that known stat thresholds trigger the correct badges.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import { getTestApp, registerAndLogin, cleanupTestUsers } from "./helpers/setup";

let request: ReturnType<typeof supertest>;

const BASE_GAME = {
  date: "2025-03-01",
  opponent: "Badge Test Opponent",
  result: "W",
  sport: "basketball",
  minutes: 35,
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
async function setupPlayerSession(position = "Guard") {
  // Use counter suffix to guarantee unique emails even within the same millisecond
  const suffix = `_${++_sessionCounter}_${Math.random().toString(36).slice(2, 7)}`;
  const { cookie } = await registerAndLogin(request, { email: `badge${suffix}@caliber-test.dev` });
  const roleRes = await request.patch("/api/auth/role").set("Cookie", cookie).send({ role: "player" });
  expect(roleRes.status).toBe(200);
  const res = await request
    .post("/api/users/create-player-profile")
    .set("Cookie", cookie)
    .send({ name: "Test Badge Player", sport: "basketball", position });
  if (res.status !== 201) {
    throw new Error(`create-player-profile returned ${res.status}: ${JSON.stringify(res.body)}`);
  }
  return { cookie, playerId: res.body.id as number };
}

async function getPlayerBadges(cookie: string, playerId: number) {
  const res = await request
    .get(`/api/players/${playerId}/badges`)
    .set("Cookie", cookie);
  return res.body as Array<{ badgeType: string }>;
}

describe("Single-game badges", () => {
  it("awards twenty_piece badge for scoring 20+ points", async () => {
    const { cookie, playerId } = await setupPlayerSession();
    await request.post("/api/games").set("Cookie", cookie)
      .send({ ...BASE_GAME, playerId, points: 20, fgMade: 8, fgAttempted: 15 });

    const badges = await getPlayerBadges(cookie, playerId);
    const types = badges.map(b => b.badgeType);
    expect(types).toContain("twenty_piece");
  });

  it("awards thirty_bomb badge for scoring 30+ points", async () => {
    const { cookie, playerId } = await setupPlayerSession();
    await request.post("/api/games").set("Cookie", cookie)
      .send({ ...BASE_GAME, playerId, points: 30, fgMade: 11, fgAttempted: 20 });

    const badges = await getPlayerBadges(cookie, playerId);
    const types = badges.map(b => b.badgeType);
    expect(types).toContain("thirty_bomb");
  });

  it("awards double_double for 10+ pts AND 10+ reb", async () => {
    const { cookie, playerId } = await setupPlayerSession("Big");
    await request.post("/api/games").set("Cookie", cookie)
      .send({ ...BASE_GAME, playerId, points: 12, rebounds: 10, fgMade: 5, fgAttempted: 10 });

    const badges = await getPlayerBadges(cookie, playerId);
    const types = badges.map(b => b.badgeType);
    expect(types).toContain("double_double");
  });

  it("awards double_double for 10+ pts AND 10+ ast", async () => {
    const { cookie, playerId } = await setupPlayerSession("Guard");
    await request.post("/api/games").set("Cookie", cookie)
      .send({ ...BASE_GAME, playerId, points: 10, assists: 10, fgMade: 4, fgAttempted: 10 });

    const badges = await getPlayerBadges(cookie, playerId);
    const types = badges.map(b => b.badgeType);
    expect(types).toContain("double_double");
  });

  it("awards triple_double for 10+ in three categories", async () => {
    const { cookie, playerId } = await setupPlayerSession("Guard");
    await request.post("/api/games").set("Cookie", cookie)
      .send({ ...BASE_GAME, playerId, points: 10, rebounds: 10, assists: 10, fgMade: 4, fgAttempted: 12 });

    const badges = await getPlayerBadges(cookie, playerId);
    const types = badges.map(b => b.badgeType);
    expect(types).toContain("triple_double");
  });

  it("does NOT award twenty_piece for exactly 19 points", async () => {
    const { cookie, playerId } = await setupPlayerSession();
    await request.post("/api/games").set("Cookie", cookie)
      .send({ ...BASE_GAME, playerId, points: 19, fgMade: 7, fgAttempted: 14 });

    const badges = await getPlayerBadges(cookie, playerId);
    const types = badges.map(b => b.badgeType);
    expect(types).not.toContain("twenty_piece");
  });
});

describe("Personal records", () => {
  it("creates a personal record on first game with meaningful stats", async () => {
    const { cookie, playerId } = await setupPlayerSession();
    const res = await request.post("/api/games").set("Cookie", cookie)
      .send({ ...BASE_GAME, playerId, points: 15, rebounds: 5, assists: 4 });

    expect(res.status).toBe(201);
    expect(res.body.newRecords).toBeDefined();
    expect(Array.isArray(res.body.newRecords)).toBe(true);
  });

  it("updates personal record when exceeding previous best", async () => {
    const { cookie, playerId } = await setupPlayerSession();

    // First game: 15 points
    const g1 = await request.post("/api/games").set("Cookie", cookie)
      .send({ ...BASE_GAME, playerId, points: 15 });
    expect(g1.status).toBe(201);

    // Second game: 25 points — should set a new record
    const g2 = await request.post("/api/games").set("Cookie", cookie)
      .send({ ...BASE_GAME, date: "2025-03-02", playerId, points: 25, fgMade: 10, fgAttempted: 18 });
    expect(g2.status).toBe(201);

    const pointsRecord = g2.body.newRecords?.find((r: any) => r.statName === "points");
    expect(pointsRecord).toBeDefined();
    expect(pointsRecord?.value).toBe(25);
    expect(pointsRecord?.previousValue).toBe(15);
  });

  it("does NOT update personal record when below previous best", async () => {
    const { cookie, playerId } = await setupPlayerSession();

    // First game: 25 points
    await request.post("/api/games").set("Cookie", cookie)
      .send({ ...BASE_GAME, playerId, points: 25, fgMade: 10, fgAttempted: 18 });

    // Second game: 15 points — no new record
    const g2 = await request.post("/api/games").set("Cookie", cookie)
      .send({ ...BASE_GAME, date: "2025-03-02", playerId, points: 15 });
    expect(g2.status).toBe(201);

    const pointsRecord = g2.body.newRecords?.find((r: any) => r.statName === "points");
    expect(pointsRecord).toBeUndefined();
  });
});
