/**
 * Referral & Coins Tests
 *
 * Covers: referral code generation, referral lookup, referral tracking,
 *         coin balance endpoint, email verification
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import { db } from "../server/db.js";
import { users } from "../shared/models/auth.js";
import { eq } from "drizzle-orm";
import { getTestApp, extractCookies, registerAndLogin } from "./helpers/setup.js";

const TS = Date.now();
let request: ReturnType<typeof supertest>;

let cookie: string;
let userId: string;

beforeAll(async () => {
  const app = await getTestApp();
  request = supertest(app);

  const auth = await registerAndLogin(request, {
    email: `referral_test_${TS}@caliber-test.dev`,
    firstName: "Ref",
    lastName: "Tester",
  });
  cookie = auth.cookie;
  userId = auth.userId;
});

afterAll(async () => {
  await db.delete(users).where(eq(users.id, userId));
});

describe("GET /api/me/referral-code", () => {
  it("returns a referral code and URL for authenticated user", async () => {
    const res = await request
      .get("/api/me/referral-code")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("code");
    expect(typeof res.body.code).toBe("string");
    expect(res.body.code.length).toBeGreaterThan(0);
    expect(res.body).toHaveProperty("url");
    expect(res.body).toHaveProperty("conversions");
  });

  it("returns the same code on subsequent calls (idempotent)", async () => {
    const first = await request.get("/api/me/referral-code").set("Cookie", cookie);
    const second = await request.get("/api/me/referral-code").set("Cookie", cookie);
    expect(first.body.code).toBe(second.body.code);
  });

  it("returns 401 without a session", async () => {
    const res = await request.get("/api/me/referral-code");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/referral/lookup/:code", () => {
  it("returns referrer info for a valid code", async () => {
    const codeRes = await request.get("/api/me/referral-code").set("Cookie", cookie);
    const code = codeRes.body.code;

    const res = await request.get(`/api/referral/lookup/${code}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("referrer");
  });

  it("returns 404 for a non-existent code", async () => {
    const res = await request.get("/api/referral/lookup/INVALID_CODE_XYZ");
    expect(res.status).toBe(404);
  });
});

describe("POST /api/referral/track", () => {
  it("returns tracked: false when user has no referrer", async () => {
    // The test user was not referred by anyone, so tracking should be a no-op
    const res = await request
      .post("/api/referral/track")
      .set("Cookie", cookie)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.tracked).toBe(false);
  });

  it("returns 401 without a session", async () => {
    const res = await request.post("/api/referral/track").send({});
    expect(res.status).toBe(401);
  });
});

describe("GET /api/user/coins", () => {
  it("returns coinBalance for authenticated user", async () => {
    const res = await request
      .get("/api/user/coins")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("coinBalance");
    expect(typeof res.body.coinBalance).toBe("number");
  });

  it("returns 401 without a session", async () => {
    const res = await request.get("/api/user/coins");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/verify-email", () => {
  it("marks email as verified for authenticated user", async () => {
    const res = await request
      .post("/api/auth/verify-email")
      .set("Cookie", cookie)
      .send({});

    expect(res.status).toBe(200);
  });

  it("returns 401 without a session", async () => {
    const res = await request.post("/api/auth/verify-email").send({});
    expect(res.status).toBe(401);
  });
});
