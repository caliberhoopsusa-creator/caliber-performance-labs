/**
 * Player privacy enforcement (docs/PIVOT_AUDIT.md sections 7a and 7b).
 *
 * Two holes are covered here:
 *
 *  7b  GET /profile/:id/public server renders Open Graph tags. It had no
 *      visibility check at all, so a hidden player's school and photo went to
 *      anyone who asked. Commit e89ae4d fixed the JSON endpoints and missed
 *      this one because it emits HTML.
 *
 *  7a  showEmail, showPhone, showStatsToCoaches and showContactToCoaches were
 *      written by PATCH /api/players/:playerId/visibility and read by nothing,
 *      anywhere. GET /api/players/:id is also unauthenticated and returned the
 *      entire row, date of birth and all.
 *
 * The pure serializer is unit tested separately in privacy-serializer.test.ts;
 * these are the route level guarantees.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import { getTestApp, registerAndLogin, cleanupTestUsers } from "./helpers/setup.js";
import { db } from "../server/db";
import { players } from "@shared/schema";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";

let request: ReturnType<typeof supertest>;
const TS = Date.now();
const EMAIL_PATTERN = `%_pp_${TS}@caliber-test.dev`;

let playerId: number;
let ownerCookie: string;
let coachCookie: string;

const SECRET_SCHOOL = `Secret School ${TS}`;
const SECRET_PHOTO = `https://example.test/photo-${TS}.jpg`;
const SECRET_COACH_PHONE = `555-0100-${TS % 10000}`;

beforeAll(async () => {
  request = supertest(await getTestApp());

  // The athlete whose privacy is under test.
  const owner = await registerAndLogin(request, { email: `owner_pp_${TS}@caliber-test.dev` });
  ownerCookie = owner.cookie;
  await request.patch("/api/auth/role").set("Cookie", ownerCookie).send({ role: "player" });
  const prof = await request
    .post("/api/users/create-player-profile")
    .set("Cookie", ownerCookie)
    .send({ name: `Test PP ${TS}`, sport: "basketball", position: "Guard", level: "high_school" });
  if (prof.status !== 201) throw new Error(`setup failed: ${JSON.stringify(prof.body)}`);
  playerId = prof.body.id;

  await db.update(players).set({
    school: SECRET_SCHOOL,
    photoUrl: SECRET_PHOTO,
    coachName: "Coach Secret",
    coachPhone: SECRET_COACH_PHONE,
    gpa: "3.91",
    dateOfBirth: "2009-04-02",
  }).where(eq(players.id, playerId));

  // A coach, for the two coach facing flags.
  const coach = await registerAndLogin(request, { email: `coach_pp_${TS}@caliber-test.dev` });
  coachCookie = coach.cookie;
  await request.patch("/api/auth/role").set("Cookie", coachCookie).send({ role: "coach" });
});

afterAll(async () => {
  if (playerId) await db.delete(players).where(eq(players.id, playerId));
  await cleanupTestUsers(EMAIL_PATTERN);
});

/** Restores the flags this suite flips, so each block starts from defaults. */
async function setFlags(flags: Record<string, unknown>) {
  await db.update(players).set(flags as any).where(eq(players.id, playerId));
}

// ---------------------------------------------------------------- 7b OG route

describe("the OG route honours profileVisibility (audit 7b)", () => {
  it("emits the school for a public player", async () => {
    await setFlags({ profileVisibility: "public", showSchool: true, minorDataPublic: true });
    const res = await request.get(`/profile/${playerId}/public`);
    expect(res.status).toBe(200);
    expect(res.text).toContain(SECRET_SCHOOL);
  });

  it("never emits a hidden player's school", async () => {
    await setFlags({ profileVisibility: "hidden", showSchool: true });
    const res = await request.get(`/profile/${playerId}/public`);
    expect(res.text).not.toContain(SECRET_SCHOOL);
  });

  it("never emits a hidden player's photo", async () => {
    await setFlags({ profileVisibility: "hidden" });
    const res = await request.get(`/profile/${playerId}/public`);
    expect(res.text).not.toContain(SECRET_PHOTO);
  });

  it("never emits a hidden player's name in the title", async () => {
    await setFlags({ profileVisibility: "hidden" });
    const res = await request.get(`/profile/${playerId}/public`);
    expect(res.text).not.toContain(`Test PP ${TS}`);
  });

  it("honours showSchool even when the profile is public", async () => {
    await setFlags({ profileVisibility: "public", showSchool: false });
    const res = await request.get(`/profile/${playerId}/public`);
    expect(res.text).not.toContain(SECRET_SCHOOL);
  });

  it("honours minorDataPublic for the photo", async () => {
    await setFlags({ profileVisibility: "public", minorDataPublic: false });
    const res = await request.get(`/profile/${playerId}/public`);
    expect(res.text).not.toContain(SECRET_PHOTO);
  });
});

// ------------------------------------------------- 7a unauthenticated player

describe("GET /api/players/:id is unauthenticated and must redact (audit 7a)", () => {
  beforeAll(async () => {
    await setFlags({
      profileVisibility: "public",
      showSchool: true,
      showGpa: true,
      showEmail: false,
      showPhone: false,
      minorDataPublic: true,
    });
  });

  it("never returns date of birth to the public", async () => {
    const res = await request.get(`/api/players/${playerId}`);
    expect(res.status).toBe(200);
    expect(res.body.dateOfBirth).toBeUndefined();
  });

  it("never returns the visibility settings themselves", async () => {
    const res = await request.get(`/api/players/${playerId}`);
    for (const key of [
      "showEmail", "showPhone", "showSchool", "showGpa",
      "showStatsToCoaches", "showContactToCoaches", "profileVisibility",
    ]) {
      expect(res.body[key]).toBeUndefined();
    }
  });

  it("withholds the coach phone while showPhone is off", async () => {
    await setFlags({ showPhone: false });
    const res = await request.get(`/api/players/${playerId}`);
    expect(JSON.stringify(res.body)).not.toContain(SECRET_COACH_PHONE);
  });

  it("404s for a hidden player rather than returning a redacted husk", async () => {
    await setFlags({ profileVisibility: "hidden" });
    const res = await request.get(`/api/players/${playerId}`);
    expect(res.status).toBe(404);
  });

  it("omits a hidden player from the public list", async () => {
    await setFlags({ profileVisibility: "hidden" });
    const res = await request.get("/api/players");
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain(`Test PP ${TS}`);
  });

  it("still returns the untouched row to the owner", async () => {
    await setFlags({ profileVisibility: "public", showSchool: false });
    const res = await request.get(`/api/players/${playerId}`).set("Cookie", ownerCookie);
    expect(res.status).toBe(200);
    // The owner sees their own school even with the public flag off.
    expect(res.body.school).toBe(SECRET_SCHOOL);
    expect(res.body.showSchool).toBe(false);
  });
});

// ------------------------------------------------------- 7a the coach flags

describe("showStatsToCoaches and showContactToCoaches are enforced (audit 7a)", () => {
  beforeAll(async () => {
    await setFlags({ profileVisibility: "public" });
  });

  it("gives a coach the contact block when showContactToCoaches is on", async () => {
    await setFlags({ showContactToCoaches: true });
    const res = await request.get(`/api/players/${playerId}`).set("Cookie", coachCookie);
    expect(res.status).toBe(200);
    expect(res.body.coachPhone).toBe(SECRET_COACH_PHONE);
  });

  it("withholds the contact block when showContactToCoaches is off", async () => {
    await setFlags({ showContactToCoaches: false });
    const res = await request.get(`/api/players/${playerId}`).set("Cookie", coachCookie);
    expect(res.status).toBe(200);
    expect(res.body.coachPhone).toBeUndefined();
    expect(res.body.coachName).toBeUndefined();
  });

  it("gives a coach game stats when showStatsToCoaches is on", async () => {
    await setFlags({ showStatsToCoaches: true });
    const res = await request.get(`/api/players/${playerId}`).set("Cookie", coachCookie);
    expect(res.body.games).toBeDefined();
  });

  it("withholds game stats when showStatsToCoaches is off", async () => {
    await setFlags({ showStatsToCoaches: false });
    const res = await request.get(`/api/players/${playerId}`).set("Cookie", coachCookie);
    expect(res.body.games).toBeUndefined();
    expect(res.body.advancedMetrics).toBeUndefined();
  });
});
