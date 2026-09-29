/**
 * The referral loop: roster placeholders and claiming (pivot Section 7).
 *
 * The rules worth pinning are the ones that protect somebody who has not
 * signed up. A placeholder is a real teenager's name sitting in our database
 * because a teammate typed it, so: it must not appear on any public surface
 * until claimed, the token that hands it over must not be guessable, and two
 * people racing the same link must not both win it.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import { getTestApp, registerAndLogin, cleanupTestUsers } from "./helpers/setup.js";
import { db } from "../server/db";
import { players, referrals } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";
import { newClaimToken, MAX_ROSTER_SIZE } from "../server/referralService";

let request: ReturnType<typeof supertest>;
const TS = Date.now();
const REFERRER_EMAIL = `ref_a_${TS}@caliber-test.dev`;
const CLAIMER_EMAIL = `ref_b_${TS}@caliber-test.dev`;

let referrerCookie: string;
let referrerPlayerId: number;
let claimerCookie: string;
const createdPlayerIds: number[] = [];

async function makePlayer(email: string, name: string) {
  const auth = await registerAndLogin(request, { email });
  await request.patch("/api/auth/role").set("Cookie", auth.cookie).send({ role: "player" });
  return auth.cookie;
}

beforeAll(async () => {
  request = supertest(await getTestApp());

  referrerCookie = await makePlayer(REFERRER_EMAIL, "Ref Referrer");
  const prof = await request
    .post("/api/users/create-player-profile")
    .set("Cookie", referrerCookie)
    .send({ name: `Ref Referrer ${TS}`, sport: "basketball", position: "PG", level: "high_school" });
  if (prof.status !== 201) throw new Error(`setup failed: ${JSON.stringify(prof.body)}`);
  referrerPlayerId = prof.body.id;
  createdPlayerIds.push(referrerPlayerId);

  // A second account with no player profile, so it is eligible to claim.
  claimerCookie = await makePlayer(CLAIMER_EMAIL, "Ref Claimer");
});

afterAll(async () => {
  const placeholders = await db
    .select({ id: referrals.placeholderPlayerId })
    .from(referrals)
    .where(eq(referrals.referrerPlayerId, referrerPlayerId));

  const ids = [...createdPlayerIds, ...placeholders.map((p) => p.id)];
  await db.delete(referrals).where(eq(referrals.referrerPlayerId, referrerPlayerId));
  if (ids.length) await db.delete(players).where(inArray(players.id, ids));
  await cleanupTestUsers(REFERRER_EMAIL);
  await cleanupTestUsers(CLAIMER_EMAIL);
});

describe("claim tokens", () => {
  it("are long and random, not derived from the player id", () => {
    // Arrange / Act
    const a = newClaimToken();
    const b = newClaimToken();

    // Assert: 24 random bytes as hex. The older family invite code is six
    // characters of a hash over a salt that lives in this repo.
    expect(a).toMatch(/^[0-9a-f]{48}$/);
    expect(a).not.toBe(b);
  });
});

describe("POST /api/me/roster", () => {
  it("creates a claimable placeholder for each teammate", async () => {
    const res = await request
      .post("/api/me/roster")
      .set("Cookie", referrerCookie)
      .send({ teammates: [
        { name: `Teammate One ${TS}`, position: "SG" },
        { name: `Teammate Two ${TS}`, position: "C" },
      ] });

    expect(res.status).toBe(201);
    expect(res.body.created).toHaveLength(2);
    for (const c of res.body.created) {
      expect(c.claimToken).toMatch(/^[0-9a-f]{48}$/);
    }
  });

  it("creates the placeholder with no owner and hidden", async () => {
    const roster = await request.get("/api/me/roster").set("Cookie", referrerCookie);
    const first = roster.body[0];

    const [row] = await db.select().from(players).where(eq(players.id, first.playerId));
    expect(row!.userId).toBeNull();
    expect(row!.profileVisibility).toBe("hidden");
  });

  it("skips a duplicate name rather than creating twins", async () => {
    const res = await request
      .post("/api/me/roster")
      .set("Cookie", referrerCookie)
      .send({ teammates: [{ name: `Teammate One ${TS}`, position: "SG" }] });

    expect(res.status).toBe(201);
    expect(res.body.created).toHaveLength(0);
    expect(res.body.skipped).toHaveLength(1);
  });

  it("rejects a position that is not a position", async () => {
    const res = await request
      .post("/api/me/roster")
      .set("Cookie", referrerCookie)
      .send({ teammates: [{ name: `Goalie ${TS}`, position: "Goalkeeper" }] });

    expect(res.status).toBe(201);
    expect(res.body.created).toHaveLength(0);
    expect(res.body.skipped).toEqual([`Goalie ${TS}`]);
  });

  it("caps the roster", async () => {
    const tooMany = Array.from({ length: MAX_ROSTER_SIZE + 1 }, (_, i) => ({
      name: `Overflow ${i} ${TS}`, position: "SF",
    }));
    const res = await request
      .post("/api/me/roster")
      .set("Cookie", referrerCookie)
      .send({ teammates: tooMany });

    // Zod caps the request itself, so this never reaches the service.
    expect(res.status).toBe(400);
  });

  it("requires a profile of your own first", async () => {
    const res = await request
      .post("/api/me/roster")
      .set("Cookie", claimerCookie)
      .send({ teammates: [{ name: `Nope ${TS}`, position: "PG" }] });

    expect(res.status).toBe(400);
  });
});

describe("unclaimed placeholders stay out of public listings", () => {
  it.each([
    ["/api/analytics/leaderboard"],
    ["/api/public/players/directory?limit=200"],
    ["/api/discover"],
  ])("%s never lists one", async (url) => {
    const res = await request.get(url);
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain(`Teammate One ${TS}`);
  });
});

describe("GET /api/claim/:token", () => {
  it("shows the referrer's card to someone with no account", async () => {
    const roster = await request.get("/api/me/roster").set("Cookie", referrerCookie);
    const token = roster.body[0].claimToken;

    // No cookie at all: this is a teammate who has never been here.
    const res = await request.get(`/api/claim/${token}`);

    expect(res.status).toBe(200);
    expect(res.body.referrer.name).toBe(`Ref Referrer ${TS}`);
    expect(res.body.placeholderName).toContain("Teammate");
    expect(res.body.alreadyClaimed).toBe(false);
  });

  it("never invents a grade for a referrer who has none", async () => {
    const roster = await request.get("/api/me/roster").set("Cookie", referrerCookie);
    const res = await request.get(`/api/claim/${roster.body[0].claimToken}`);

    // The referrer has logged no games, so there is no grade to show.
    expect(res.body.referrer.grade).toBeNull();
    expect(res.body.referrer.gamesPlayed).toBe(0);
  });

  it("404s an unknown token", async () => {
    const res = await request.get(`/api/claim/${newClaimToken()}`);
    expect(res.status).toBe(404);
  });
});

describe("POST /api/claim/:token", () => {
  it("requires a signed-in user", async () => {
    const roster = await request.get("/api/me/roster").set("Cookie", referrerCookie);
    const res = await request.post(`/api/claim/${roster.body[0].claimToken}`);
    expect(res.status).toBe(401);
  });

  it("hands the placeholder over and makes it visible", async () => {
    const roster = await request.get("/api/me/roster").set("Cookie", referrerCookie);
    const target = roster.body.find((r: any) => !r.claimed);
    const token = target.claimToken;

    const res = await request.post(`/api/claim/${token}`).set("Cookie", claimerCookie);
    expect(res.status).toBe(200);
    expect(res.body.claimed).toBe(true);

    const [row] = await db.select().from(players).where(eq(players.id, target.playerId));
    expect(row!.userId).not.toBeNull();
    expect(row!.profileVisibility).toBe("public");
  });

  it("refuses a second claim of the same link", async () => {
    const roster = await request.get("/api/me/roster").set("Cookie", referrerCookie);
    const claimed = roster.body.find((r: any) => r.claimed);

    const res = await request.post(`/api/claim/${claimed.claimToken}`).set("Cookie", claimerCookie);
    expect(res.status).toBe(409);
    expect(res.body.reason).toBe("already_claimed");
  });

  it("refuses a claimer who already has a player, rather than merging blind", async () => {
    const roster = await request.get("/api/me/roster").set("Cookie", referrerCookie);
    const spare = roster.body.find((r: any) => !r.claimed);

    // The referrer has their own profile already.
    const res = await request.post(`/api/claim/${spare.claimToken}`).set("Cookie", referrerCookie);
    expect(res.status).toBe(409);
    expect(res.body.reason).toBe("user_has_player");
  });
});
