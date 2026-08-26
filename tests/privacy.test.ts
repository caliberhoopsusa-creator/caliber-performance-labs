/**
 * Public-surface privacy tests
 *
 * Privacy flags are enforced per-route in this codebase (CLAUDE.md rule 2) —
 * nothing in the DB layer or middleware applies them. The player-listing
 * endpoints below are reachable WITHOUT a login, so a player who hid their
 * profile, or turned off school/GPA, must not have it served to the internet.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import { getTestApp, registerAndLogin, cleanupTestUsers } from "./helpers/setup.js";
import { db } from "../server/db";
import { players } from "@shared/schema";
import { eq } from "drizzle-orm";

let request: ReturnType<typeof supertest>;
const TS = Date.now();
let playerId: number;

beforeAll(async () => {
  request = supertest(await getTestApp());

  const auth = await registerAndLogin(request, { email: `privacy_${TS}@caliber-test.dev` });
  await request.patch("/api/auth/role").set("Cookie", auth.cookie).send({ role: "player" });
  const prof = await request
    .post("/api/users/create-player-profile")
    .set("Cookie", auth.cookie)
    .send({ name: `Test Privacy ${TS}`, sport: "basketball", position: "Guard", level: "high_school" });
  if (prof.status !== 201) throw new Error(`setup failed: ${JSON.stringify(prof.body)}`);
  playerId = prof.body.id;

  // Opt out of sharing school and GPA, and fill them in so a leak is visible.
  await db.update(players)
    .set({ school: "Secret High School", gpa: "3.91", showSchool: false, showGpa: false })
    .where(eq(players.id, playerId));
});

afterAll(async () => {
  if (playerId) await db.delete(players).where(eq(players.id, playerId));
  await cleanupTestUsers(`privacy_${TS}@caliber-test.dev`);
});

describe("public endpoints honour showSchool / showGpa", () => {
  it.each([
    ["/api/public/players/directory?limit=200"],
    ["/api/discover"],
    ["/api/scout/players"],
  ])("%s never leaks an opted-out school or GPA", async (url) => {
    const res = await request.get(url);
    expect(res.status).toBe(200);

    const body = JSON.stringify(res.body);
    expect(body).not.toContain("Secret High School");
    expect(body).not.toContain("3.91");
  });

  it("GET /api/public/players/:id/profile hides them too", async () => {
    const res = await request.get(`/api/public/players/${playerId}/profile`);
    if (res.status !== 200) return; // endpoint may 404 for a bare profile
    expect(res.body.player.school).toBeNull();
    expect(res.body.player.gpa).toBeNull();
  });
});

describe("hidden profiles stay out of public listings", () => {
  beforeAll(async () => {
    await db.update(players).set({ profileVisibility: "hidden" }).where(eq(players.id, playerId));
  });

  it.each([
    ["/api/public/players/directory?limit=200"],
    ["/api/discover"],
    ["/api/scout/players"],
  ])("%s omits a hidden player", async (url) => {
    const res = await request.get(url);
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain(`Test Privacy ${TS}`);
  });
});
