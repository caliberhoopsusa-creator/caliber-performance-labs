/**
 * Auth Flow Tests
 *
 * Covers: register → login → session persistence → role selection → logout
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import { getTestApp, extractCookies, cleanupTestUsers } from "./helpers/setup.js";

let request: ReturnType<typeof supertest>;
const TS = Date.now();
const TEST_EMAIL = `auth_test_${TS}@caliber-test.dev`;
const TEST_PASSWORD = "SecurePass999!";

beforeAll(async () => {
  const app = await getTestApp();
  request = supertest(app);
});

afterAll(async () => {
  await cleanupTestUsers(`auth_test_${TS}@caliber-test.dev`);
});

describe("POST /api/register", () => {
  it("creates a new user and returns 201", async () => {
    const res = await request
      .post("/api/register")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD, firstName: "Auth", lastName: "Tester" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      email: TEST_EMAIL,
      firstName: "Auth",
      lastName: "Tester",
    });
    // password hash must never be returned
    expect(res.body.passwordHash).toBeUndefined();
    // session cookie should be set
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects duplicate email registration", async () => {
    const res = await request
      .post("/api/register")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it("rejects registration without email", async () => {
    const res = await request
      .post("/api/register")
      .send({ password: TEST_PASSWORD });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email|required/i);
  });

  it("rejects registration without password", async () => {
    const res = await request
      .post("/api/register")
      .send({ email: `no_pw_${TS}@caliber-test.dev` });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/password|required/i);
  });
});

describe("POST /api/login", () => {
  it("logs in with correct credentials and returns session cookie", async () => {
    const res = await request
      .post("/api/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/logged in/i);
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects wrong password", async () => {
    const res = await request
      .post("/api/login")
      .send({ email: TEST_EMAIL, password: "wrongPassword!" });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid/i);
  });

  it("rejects non-existent email", async () => {
    const res = await request
      .post("/api/login")
      .send({ email: `nobody_${TS}@caliber-test.dev`, password: TEST_PASSWORD });

    expect(res.status).toBe(401);
  });
});

describe("Session persistence", () => {
  it("GET /api/users/me returns user when authenticated", async () => {
    // Login to get cookie
    const loginRes = await request
      .post("/api/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
    const cookie = extractCookies(loginRes);

    const meRes = await request
      .get("/api/users/me")
      .set("Cookie", cookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body.email).toBe(TEST_EMAIL);
    expect(meRes.body.passwordHash).toBeUndefined();
  });

  it("GET /api/users/me returns 401 without a session", async () => {
    const res = await request.get("/api/users/me");
    expect(res.status).toBe(401);
  });
});

describe("Role selection", () => {
  let cookie: string;

  beforeAll(async () => {
    const loginRes = await request
      .post("/api/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
    cookie = extractCookies(loginRes);
  });

  it("PATCH /api/auth/role sets role to player", async () => {
    const res = await request
      .patch("/api/auth/role")
      .set("Cookie", cookie)
      .send({ role: "player" });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe("player");
  });

  it("PATCH /api/auth/role sets role to coach", async () => {
    const res = await request
      .patch("/api/auth/role")
      .set("Cookie", cookie)
      .send({ role: "coach" });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe("coach");
  });

  it("PATCH /api/auth/role rejects invalid role", async () => {
    const res = await request
      .patch("/api/auth/role")
      .set("Cookie", cookie)
      .send({ role: "superadmin" });

    expect(res.status).toBe(400);
    expect(res.body.type).toBe("invalid_role");
  });

  it("PATCH /api/auth/role returns 401 without session", async () => {
    const res = await request
      .patch("/api/auth/role")
      .send({ role: "player" });

    expect(res.status).toBe(401);
  });
});

describe("Logout", () => {
  it("GET /api/auth/user returns 401 after logout", async () => {
    // Login
    const loginRes = await request
      .post("/api/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
    const cookie = extractCookies(loginRes);

    // Verify logged in
    const beforeLogout = await request.get("/api/users/me").set("Cookie", cookie);
    expect(beforeLogout.status).toBe(200);

    // Logout
    const logoutRes = await request
      .get("/api/logout")
      .set("Cookie", cookie);
    // Logout redirects or returns 200
    expect([200, 302]).toContain(logoutRes.status);

    // Session should be invalid — try accessing protected endpoint with old cookie
    const afterLogout = await request.get("/api/users/me").set("Cookie", cookie);
    // The old session cookie should no longer grant access
    expect(afterLogout.status).toBe(401);
  });
});
