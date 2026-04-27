/**
 * Recruiting Pipeline Tests
 *
 * Covers: discover feed, college list, college match generation,
 *         recruit posts (coach → player interest flow), scout view
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import { db } from "../server/db.js";
import { players, games, badges, personalRecords, feedActivities } from "../shared/schema.js";
import { eq } from "drizzle-orm";
import { users } from "../shared/models/auth.js";
import { getTestApp, registerAndLogin } from "./helpers/setup.js";

const TS = Date.now();
let request: ReturnType<typeof supertest>;

let playerCookie: string;
let playerUserId: string;
let playerId: number;

let coachCookie: string;
let coachUserId: string;

beforeAll(async () => {
  const app = await getTestApp();
  request = supertest(app);

  // Player user
  const pAuth = await registerAndLogin(request, {
    email: `recruit_player_${TS}@caliber-test.dev`,
    firstName: "Test",
    lastName: "Recruit",
  });
  playerCookie = pAuth.cookie;
  playerUserId = pAuth.userId;
  await request.patch("/api/auth/role").set("Cookie", playerCookie).send({ role: "player" });

  const profRes = await request
    .post("/api/users/create-player-profile")
    .set("Cookie", playerCookie)
    .send({
      name: "Test Recruit",
      sport: "basketball",
      position: "Guard",
      level: "high_school",
      openToRecruiting: true,
    });
  if (profRes.status !== 201) {
    throw new Error(`Player creation failed: ${JSON.stringify(profRes.body)}`);
  }
  playerId = profRes.body.id;

  // Coach user
  const cAuth = await registerAndLogin(request, {
    email: `recruit_coach_${TS}@caliber-test.dev`,
    firstName: "Test",
    lastName: "Recruiter",
  });
  coachCookie = cAuth.cookie;
  coachUserId = cAuth.userId;
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

// ─── Discover feed ────────────────────────────────────────────────────────────

describe("GET /api/discover", () => {
  it("returns player discovery list (public)", async () => {
    const res = await request.get("/api/discover").query({ sport: "basketball" });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("filters by sport", async () => {
    const res = await request.get("/api/discover").query({ sport: "football" });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // All returned players should be football
    for (const p of res.body) {
      expect(p.sport).toBe("football");
    }
  });

  it("returns player with correct stat fields", async () => {
    const res = await request.get("/api/discover").query({ sport: "basketball" });
    expect(res.status).toBe(200);
    if (res.body.length > 0) {
      const p = res.body[0];
      expect(p).toHaveProperty("ppg");
      expect(p).toHaveProperty("rpg");
      expect(p).toHaveProperty("apg");
    }
  });
});

// ─── Scout view ───────────────────────────────────────────────────────────────

describe("GET /api/scout/players", () => {
  it("returns scoutable players list (public)", async () => {
    const res = await request.get("/api/scout/players").query({ sport: "basketball" });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ─── Colleges ────────────────────────────────────────────────────────────────

describe("GET /api/colleges", () => {
  it("returns college list (public)", async () => {
    const res = await request.get("/api/colleges");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("filters colleges by sport", async () => {
    const res = await request.get("/api/colleges").query({ sport: "basketball" });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("returns 400 for invalid college ID", async () => {
    const res = await request.get("/api/colleges/not-a-number");
    expect(res.status).toBe(400);
  });

  it("returns 404 for non-existent college", async () => {
    const res = await request.get("/api/colleges/9999999");
    expect(res.status).toBe(404);
  });
});

// ─── College matches ──────────────────────────────────────────────────────────

describe("GET /api/players/:id/college-matches", () => {
  it("returns college match list for a player (public)", async () => {
    const res = await request.get(`/api/players/${playerId}/college-matches`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ─── Recruit posts ────────────────────────────────────────────────────────────

describe("Recruit post flow", () => {
  let postId: number;

  it("POST /api/recruit-posts – coach creates a recruit post", async () => {
    const res = await request
      .post("/api/recruit-posts")
      .set("Cookie", coachCookie)
      .send({
        title: "Looking for PG – Test School",
        description: "Seeking a point guard for our program.",
        positionNeeds: ["Guard"],
        level: "high_school",
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toMatch(/test school/i);
    postId = res.body.id;
  });

  it("GET /api/recruit-posts – public can view recruit posts", async () => {
    const res = await request.get("/api/recruit-posts");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const found = res.body.find((p: any) => p.id === postId);
    expect(found).toBeDefined();
  });

  it("POST /api/recruit-posts – non-coach returns 403", async () => {
    const res = await request
      .post("/api/recruit-posts")
      .set("Cookie", playerCookie)
      .send({
        title: "Fake post",
        description: "Should not work.",
        positionNeeds: ["Guard"],
      });

    expect(res.status).toBe(403);
  });

  it("POST /api/recruit-posts/:id/interest – player expresses interest", async () => {
    const res = await request
      .post(`/api/recruit-posts/${postId}/interest`)
      .set("Cookie", playerCookie)
      .send({ message: "I am interested in your program." });

    expect([200, 201]).toContain(res.status);
  });

  it("GET /api/recruit-posts/:id/interests – coach views interested players", async () => {
    const res = await request
      .get(`/api/recruit-posts/${postId}/interests`)
      .set("Cookie", coachCookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/my-recruit-interests – player sees their interests", async () => {
    const res = await request
      .get("/api/my-recruit-interests")
      .set("Cookie", playerCookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("DELETE /api/recruit-posts/:id – coach can delete their post", async () => {
    const res = await request
      .delete(`/api/recruit-posts/${postId}`)
      .set("Cookie", coachCookie);

    expect([200, 204]).toContain(res.status);
  });
});

// ─── Player public profile ────────────────────────────────────────────────────

describe("GET /api/players/:id/public", () => {
  it("returns public profile data", async () => {
    const res = await request.get(`/api/players/${playerId}/public`);
    expect(res.status).toBe(200);
    expect(res.body.player.id).toBe(playerId);
    // Should not expose private data (no passwordHash ever)
    expect(res.body.player.passwordHash).toBeUndefined();
  });
});
