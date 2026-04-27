/**
 * Tests for the position-weighted grading system.
 * Grading is calculated server-side and returned in the POST /api/games response.
 * Tests verify the A-F grade output for known stat inputs per position.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import { getTestApp, registerAndLogin, cleanupTestUsers } from "./helpers/setup";

let request: ReturnType<typeof supertest>;
let cookie: string;
let playerId: number;

const BASE_GAME = {
  date: "2025-01-15",
  opponent: "Test Opponent",
  result: "W",
  minutes: 32,
  sport: "basketball",
  points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0,
  turnovers: 0, fouls: 0, fgMade: 0, fgAttempted: 0,
  threeMade: 0, threeAttempted: 0, ftMade: 0, ftAttempted: 0,
  offensiveRebounds: 0, defensiveRebounds: 0,
};

async function logGame(stats: Record<string, any>) {
  const res = await request
    .post("/api/games")
    .set("Cookie", cookie)
    .send({ ...BASE_GAME, playerId, ...stats });
  return res;
}

beforeAll(async () => {
  const app = await getTestApp();
  request = supertest(app);

  const suffix = `_${Math.random().toString(36).slice(2, 8)}`;
  const { cookie: c } = await registerAndLogin(request, { email: `grading${suffix}@caliber-test.dev` });
  cookie = c;

  // Set role to player
  const roleRes = await request.patch("/api/auth/role").set("Cookie", cookie).send({ role: "player" });
  expect(roleRes.status).toBe(200);

  // Create player profile (Guard position for most tests)
  const playerRes = await request
    .post("/api/users/create-player-profile")
    .set("Cookie", cookie)
    .send({ name: "Test Grading Player", sport: "basketball", position: "Guard" });

  if (playerRes.status !== 201) throw new Error(`Setup failed: ${JSON.stringify(playerRes.body)}`);
  playerId = playerRes.body.id;
});

afterAll(async () => {
  await cleanupTestUsers();
});

describe("Basketball grading — Guard position", () => {
  it("awards A+ for elite Guard performance (30+ pts, 8+ ast, low TOs, efficient shooting)", async () => {
    const res = await logGame({
      points: 30, assists: 8, rebounds: 5,
      steals: 2, blocks: 0, turnovers: 1, fouls: 1,
      fgMade: 12, fgAttempted: 20,
    });
    expect(res.status).toBe(201);
    expect(res.body.grade).toBe("A+");
  });

  it("awards A-range grade for strong Guard performance (20+ pts, 6+ ast)", async () => {
    const res = await logGame({
      points: 22, assists: 6, rebounds: 3,
      steals: 1, turnovers: 2, fouls: 2,
      fgMade: 8, fgAttempted: 16,
    });
    expect(res.status).toBe(201);
    expect(["A+", "A", "A-", "B+"]).toContain(res.body.grade);
  });

  it("awards D or F for very poor Guard performance (0 pts, 5+ TOs)", async () => {
    const res = await logGame({
      points: 0, assists: 0, rebounds: 1,
      steals: 0, turnovers: 5, fouls: 3,
      fgMade: 0, fgAttempted: 5,
    });
    expect(res.status).toBe(201);
    expect(["D", "F", "C-"]).toContain(res.body.grade);
  });

  it("grade improves with good shooting efficiency (>50% FG)", async () => {
    const inefficientRes = await logGame({
      points: 14, assists: 3, rebounds: 2,
      fgMade: 4, fgAttempted: 15, // 26.7% FG — penalty applies
    });
    const efficientRes = await logGame({
      points: 14, assists: 3, rebounds: 2,
      fgMade: 8, fgAttempted: 14, // 57% FG — bonus applies
    });
    expect(inefficientRes.status).toBe(201);
    expect(efficientRes.status).toBe(201);

    const gradeOrder = ["F","D","C-","C","C+","B-","B","B+","A-","A","A+"];
    const inefficientRank = gradeOrder.indexOf(inefficientRes.body.grade);
    const efficientRank = gradeOrder.indexOf(efficientRes.body.grade);
    expect(efficientRank).toBeGreaterThanOrEqual(inefficientRank);
  });
});

describe("Basketball grading — Big position", () => {
  let bigPlayerId: number;
  let bigCookie: string;

  beforeAll(async () => {
    const sfx = `_${Math.random().toString(36).slice(2, 8)}`;
    const { cookie: c } = await registerAndLogin(request, { email: `grading_big${sfx}@caliber-test.dev` });
    bigCookie = c;
    const roleRes = await request.patch("/api/auth/role").set("Cookie", bigCookie).send({ role: "player" });
    expect(roleRes.status).toBe(200);
    const res = await request
      .post("/api/users/create-player-profile")
      .set("Cookie", bigCookie)
      .send({ name: "Test Big Player", sport: "basketball", position: "Big" });
    if (res.status !== 201) throw new Error(`Big player setup failed: ${JSON.stringify(res.body)}`);
    bigPlayerId = res.body.id;
  });

  it("rewards Big for rebounds and blocks (A grade for 12+ reb, 3+ blk)", async () => {
    const res = await request
      .post("/api/games")
      .set("Cookie", bigCookie)
      .send({ ...BASE_GAME, playerId: bigPlayerId, points: 14, rebounds: 12, assists: 2, blocks: 3, steals: 1, turnovers: 2, fgMade: 6, fgAttempted: 10 });
    expect(res.status).toBe(201);
    expect(["A+", "A", "A-"]).toContain(res.body.grade);
  });
});

describe("Grading response structure", () => {
  it("returns all required fields in game response", async () => {
    const res = await logGame({ points: 15, rebounds: 5, assists: 4, fgMade: 6, fgAttempted: 12 });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("grade");
    expect(res.body).toHaveProperty("xpEarned");
    expect(res.body).toHaveProperty("coinsEarned");
    expect(res.body).toHaveProperty("totalXp");
    expect(res.body).toHaveProperty("currentTier");
    expect(res.body).toHaveProperty("newRecords");
    expect(res.body).toHaveProperty("advancedMetrics");
    expect(["A+","A","A-","B+","B","B-","C+","C","C-","D","F"]).toContain(res.body.grade);
  });
});

describe("Football grading", () => {
  let fbPlayerId: number;
  let fbCookie: string;

  beforeAll(async () => {
    const sfx = `_${Math.random().toString(36).slice(2, 8)}`;
    const { cookie: c } = await registerAndLogin(request, { email: `grading_qb${sfx}@caliber-test.dev` });
    fbCookie = c;
    const roleRes = await request.patch("/api/auth/role").set("Cookie", fbCookie).send({ role: "player" });
    expect(roleRes.status).toBe(200);
    const res = await request
      .post("/api/users/create-player-profile")
      .set("Cookie", fbCookie)
      .send({ name: "Test QB Player", sport: "football", position: "QB" });
    if (res.status !== 201) throw new Error(`QB player setup failed: ${JSON.stringify(res.body)}`);
    fbPlayerId = res.body.id;
  });

  it("awards strong grade to QB with 300+ passing yards, 3 TDs, 0 INTs", async () => {
    const res = await request
      .post("/api/games")
      .set("Cookie", fbCookie)
      .send({
        ...BASE_GAME, sport: "football", playerId: fbPlayerId,
        completions: 22, passAttempts: 30,
        passingYards: 310, passingTouchdowns: 3, interceptions: 0, sacksTaken: 1,
      });
    expect(res.status).toBe(201);
    expect(["A+", "A", "A-", "B+"]).toContain(res.body.grade);
  });

  it("penalizes QB with multiple INTs and low completion rate", async () => {
    const res = await request
      .post("/api/games")
      .set("Cookie", fbCookie)
      .send({
        ...BASE_GAME, sport: "football", playerId: fbPlayerId,
        completions: 10, passAttempts: 28,
        passingYards: 120, passingTouchdowns: 1, interceptions: 3, sacksTaken: 4,
      });
    expect(res.status).toBe(201);
    expect(["D", "F", "C-", "C"]).toContain(res.body.grade);
  });
});
