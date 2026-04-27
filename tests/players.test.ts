/**
 * Player Profile & Stats Tests
 *
 * Covers: create player, read profile, update profile, username check,
 *         per-game stats computed from games, badges, personal records
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import { db } from "../server/db.js";
import { players, games, badges, personalRecords, feedActivities } from "../shared/schema.js";
import { eq } from "drizzle-orm";
import { users } from "../shared/models/auth.js";
import { getTestApp, extractCookies, registerAndLogin } from "./helpers/setup.js";

const TS = Date.now();
let request: ReturnType<typeof supertest>;

// Player-user context
let playerCookie: string;
let playerUserId: string;
let playerId: number;

// Coach-user context (for tests requiring coach role)
let coachCookie: string;
let coachUserId: string;

beforeAll(async () => {
  const app = await getTestApp();
  request = supertest(app);

  // ---- Player user ----
  const playerAuth = await registerAndLogin(request, {
    email: `players_test_player_${TS}@caliber-test.dev`,
    firstName: "Test",
    lastName: "Profile",
  });
  playerCookie = playerAuth.cookie;
  playerUserId = playerAuth.userId;

  // Set role to player
  await request.patch("/api/auth/role").set("Cookie", playerCookie).send({ role: "player" });

  // Create player profile
  const profRes = await request
    .post("/api/users/create-player-profile")
    .set("Cookie", playerCookie)
    .send({ name: "Test Profile", sport: "basketball", position: "Guard", level: "high_school" });

  if (profRes.status !== 201) {
    throw new Error(`Player profile creation failed: ${JSON.stringify(profRes.body)}`);
  }
  playerId = profRes.body.id;

  // ---- Coach user ----
  const coachAuth = await registerAndLogin(request, {
    email: `players_test_coach_${TS}@caliber-test.dev`,
    firstName: "Test",
    lastName: "Coach",
  });
  coachCookie = coachAuth.cookie;
  coachUserId = coachAuth.userId;
  await request.patch("/api/auth/role").set("Cookie", coachCookie).send({ role: "coach" });
});

afterAll(async () => {
  if (playerId) {
    await db.delete(feedActivities).where(eq(feedActivities.playerId, playerId));
    await db.delete(personalRecords).where(eq(personalRecords.playerId, playerId));
    await db.delete(badges).where(eq(badges.playerId, playerId));
    await db.delete(games).where(eq(games.playerId, playerId));
    await db.delete(players).where(eq(players.id, playerId));
  }
  if (playerUserId) await db.delete(users).where(eq(users.id, playerUserId));
  if (coachUserId) await db.delete(users).where(eq(users.id, coachUserId));
});

// ─── GET /api/players/:id ─────────────────────────────────────────────────────

describe("GET /api/players/:id", () => {
  it("returns player profile (public endpoint)", async () => {
    const res = await request.get(`/api/players/${playerId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(playerId);
    expect(res.body.name).toBe("Test Profile");
    expect(res.body.sport).toBe("basketball");
    expect(res.body.position).toBe("Guard");
  });

  it("includes games array in response", async () => {
    const res = await request.get(`/api/players/${playerId}`);
    expect(Array.isArray(res.body.games)).toBe(true);
  });

  it("includes advancedMetrics in response", async () => {
    const res = await request.get(`/api/players/${playerId}`);
    expect(res.body.advancedMetrics).toBeDefined();
  });

  it("returns 404 for non-existent player", async () => {
    const res = await request.get("/api/players/9999999");
    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid player ID", async () => {
    const res = await request.get("/api/players/not-a-number");
    expect(res.status).toBe(400);
  });
});

// ─── GET /api/players ─────────────────────────────────────────────────────────

describe("GET /api/players", () => {
  it("returns array of players (public)", async () => {
    const res = await request.get("/api/players");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // Our test player should be in the list
    const found = res.body.find((p: any) => p.id === playerId);
    expect(found).toBeDefined();
  });
});

// ─── PATCH /api/players/:id ───────────────────────────────────────────────────

describe("PATCH /api/players/:id", () => {
  it("player can update their own profile", async () => {
    const res = await request
      .patch(`/api/players/${playerId}`)
      .set("Cookie", playerCookie)
      .send({ bio: "Updated test bio", height: "6-2" });

    expect(res.status).toBe(200);
    expect(res.body.bio).toBe("Updated test bio");
    expect(res.body.height).toBe("6-2");
  });

  it("coach can update any player profile", async () => {
    const res = await request
      .patch(`/api/players/${playerId}`)
      .set("Cookie", coachCookie)
      .send({ bio: "Coach updated bio" });

    expect(res.status).toBe(200);
    expect(res.body.bio).toBe("Coach updated bio");
  });

  it("returns 401 for unauthenticated request", async () => {
    const res = await request
      .patch(`/api/players/${playerId}`)
      .send({ bio: "Hacker bio" });

    expect(res.status).toBe(401);
  });
});

// ─── GET /api/players/check-username/:username ────────────────────────────────

describe("GET /api/players/check-username/:username", () => {
  it("reports a new username as available", async () => {
    const res = await request.get("/api/players/check-username/uniqueuser99xyz");
    expect(res.status).toBe(200);
    expect(res.body.available).toBe(true);
  });

  it("reports username too short as unavailable", async () => {
    const res = await request.get("/api/players/check-username/ab");
    expect(res.status).toBe(200);
    expect(res.body.available).toBe(false);
  });

  it("reports username with special chars as unavailable", async () => {
    const res = await request.get("/api/players/check-username/bad-user!");
    expect(res.status).toBe(200);
    expect(res.body.available).toBe(false);
  });
});

// ─── Stats derived from games ─────────────────────────────────────────────────

describe("Stats computed from games", () => {
  beforeAll(async () => {
    // Log 2 games so we have data
    await request
      .post("/api/games")
      .set("Cookie", playerCookie)
      .send({
        playerId,
        sport: "basketball",
        date: "2026-01-10",
        opponent: "Team A",
        result: "W",
        minutes: 30,
        points: 15,
        rebounds: 6,
        assists: 4,
        steals: 1,
        blocks: 0,
        turnovers: 1,
        fouls: 2,
        fgMade: 6, fgAttempted: 12,
        threeMade: 1, threeAttempted: 3,
        ftMade: 2, ftAttempted: 2,
        offensiveRebounds: 1, defensiveRebounds: 5,
      });

    await request
      .post("/api/games")
      .set("Cookie", playerCookie)
      .send({
        playerId,
        sport: "basketball",
        date: "2026-01-15",
        opponent: "Team B",
        result: "L",
        minutes: 28,
        points: 20,
        rebounds: 8,
        assists: 6,
        steals: 2,
        blocks: 1,
        turnovers: 2,
        fouls: 3,
        fgMade: 8, fgAttempted: 16,
        threeMade: 2, threeAttempted: 5,
        ftMade: 2, ftAttempted: 3,
        offensiveRebounds: 2, defensiveRebounds: 6,
      });
  });

  it("GET /api/players/:id includes games in response", async () => {
    const res = await request.get(`/api/players/${playerId}`);
    expect(res.status).toBe(200);
    expect(res.body.games.length).toBeGreaterThanOrEqual(2);
  });

  it("games have grade and feedback fields", async () => {
    const res = await request.get(`/api/players/${playerId}`);
    const playerGames: any[] = res.body.games;
    for (const g of playerGames) {
      expect(g.grade).toBeTruthy();
      expect(g.feedback).toBeTruthy();
    }
  });

  it("GET /api/players/:id/badges returns badge list", async () => {
    const res = await request.get(`/api/players/${playerId}/badges`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/players/:id/personal-records returns records", async () => {
    const res = await request.get(`/api/players/${playerId}/personal-records`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // Should have points record
    const pointsRecord = res.body.find((r: any) => r.statName === "points");
    expect(pointsRecord).toBeDefined();
    expect(pointsRecord.value).toBeGreaterThanOrEqual(15);
  });
});

// ─── XP / Tier system ─────────────────────────────────────────────────────────

describe("XP and tier progression", () => {
  it("player starts at Rookie tier", async () => {
    // Player was just created, should be Rookie
    const [p] = await db.select().from(players).where(eq(players.id, playerId));
    expect(p.currentTier).toBe("Rookie");
  });

  it("totalXp increases after each game", async () => {
    const [before] = await db.select().from(players).where(eq(players.id, playerId));
    const xpBefore = before.totalXp;

    await request
      .post("/api/games")
      .set("Cookie", playerCookie)
      .send({
        playerId,
        sport: "basketball",
        date: "2026-02-01",
        opponent: "XP Test Opp",
        result: "W",
        minutes: 25, points: 10, rebounds: 5, assists: 2,
        steals: 0, blocks: 0, turnovers: 1, fouls: 1,
        fgMade: 4, fgAttempted: 10,
        threeMade: 0, threeAttempted: 2,
        ftMade: 2, ftAttempted: 2,
        offensiveRebounds: 1, defensiveRebounds: 4,
      });

    const [after] = await db.select().from(players).where(eq(players.id, playerId));
    expect(after.totalXp).toBeGreaterThan(xpBefore);
  });
});

// ─── POST /api/players/:id/player-goals ──────────────────────────────────────

describe("Player goals", () => {
  it("player can set a goal", async () => {
    const res = await request
      .post(`/api/players/${playerId}/player-goals`)
      .set("Cookie", playerCookie)
      .send({
        statName: "ppg",
        targetValue: "20",
        timeframe: "season",
      });

    expect(res.status).toBe(201);
    expect(res.body.statName).toBe("ppg");
    expect(res.body.status).toBe("active");
  });

  it("GET /api/players/:id/player-goals returns goals", async () => {
    const res = await request.get(`/api/players/${playerId}/player-goals`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
