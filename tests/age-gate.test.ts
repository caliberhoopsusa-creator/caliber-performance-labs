/**
 * COPPA age gate tests (docs/PIVOT_AUDIT.md section 7c).
 *
 * Before this, Login.tsx disabled its submit button for an under 13 date of
 * birth and POST /api/register never read the field, so the gate was bypassed
 * by leaving it blank or by calling the API directly, and users.date_of_birth
 * was null for every account on the platform.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import { getTestApp, cleanupTestUsers, yearsAgo, toLocalDateString } from "./helpers/setup.js";
import { db } from "../server/db";
import { users } from "@shared/models/auth";
import { pendingGuardianConsents } from "@shared/schema";
import { eq } from "drizzle-orm";

let request: ReturnType<typeof supertest>;
const TS = Date.now();
const EMAIL_PATTERN = `%_agegate_${TS}@caliber-test.dev`;

const emailFor = (label: string) => `${label}_agegate_${TS}@caliber-test.dev`;

beforeAll(async () => {
  request = supertest(await getTestApp());
});

afterAll(async () => {
  await cleanupTestUsers(EMAIL_PATTERN);
});

describe("POST /api/register requires a date of birth", () => {
  it("rejects a registration with no dateOfBirth", async () => {
    const res = await request.post("/api/register").send({
      email: emailFor("missing"),
      password: "TestPass123!",
      firstName: "Test",
      lastName: "NoDob",
    });

    expect(res.status).toBe(400);
    expect(res.body.type).toBe("date_of_birth_required");
  });

  it("rejects an unparseable dateOfBirth", async () => {
    const res = await request.post("/api/register").send({
      email: emailFor("garbage"),
      password: "TestPass123!",
      dateOfBirth: "not-a-date",
    });

    expect(res.status).toBe(400);
    expect(res.body.type).toBe("date_of_birth_required");
  });

  it("rejects a dateOfBirth in the future", async () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);

    const res = await request.post("/api/register").send({
      email: emailFor("future"),
      password: "TestPass123!",
      dateOfBirth: toLocalDateString(future),
    });

    expect(res.status).toBe(400);
    expect(res.body.type).toBe("date_of_birth_required");
  });
});

describe("under 13 registration is routed to guardian consent", () => {
  const email = emailFor("under13");

  it("does not create an account and reports guardian consent required", async () => {
    const res = await request.post("/api/register").send({
      email,
      password: "TestPass123!",
      firstName: "Test",
      lastName: "Minor",
      dateOfBirth: yearsAgo(11),
    });

    expect(res.status).toBe(403);
    expect(res.body.type).toBe("guardian_consent_required");
  });

  it("creates no users row for the under 13 registrant", async () => {
    const rows = await db.select().from(users).where(eq(users.email, email));
    expect(rows).toHaveLength(0);
  });

  it("stores a pending consent record instead", async () => {
    const rows = await db
      .select()
      .from(pendingGuardianConsents)
      .where(eq(pendingGuardianConsents.email, email));

    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("pending");
  });

  it("does not issue a session", async () => {
    const res = await request.post("/api/register").send({
      email: emailFor("under13b"),
      password: "TestPass123!",
      dateOfBirth: yearsAgo(9),
    });
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("treats a registrant one day short of 13 as under 13", async () => {
    const almost = new Date();
    almost.setFullYear(almost.getFullYear() - 13);
    almost.setDate(almost.getDate() + 1);

    const res = await request.post("/api/register").send({
      email: emailFor("almost13"),
      password: "TestPass123!",
      dateOfBirth: toLocalDateString(almost),
    });

    expect(res.status).toBe(403);
    expect(res.body.type).toBe("guardian_consent_required");
  });
});

describe("the guardian consent stub", () => {
  it("accepts a guardian email for a pending request and grants nothing", async () => {
    const res = await request.post("/api/guardian-consent").send({
      email: emailFor("under13"),
      guardianEmail: `guardian_agegate_${TS}@caliber-test.dev`,
    });

    expect(res.status).toBe(202);
    expect(res.body.type).toBe("guardian_consent_required");
    expect(res.body.implemented).toBe(false);
  });

  it("404s for an email with no pending request", async () => {
    const res = await request.post("/api/guardian-consent").send({
      email: emailFor("nobody"),
    });
    expect(res.status).toBe(404);
  });
});

describe("dateOfBirth is persisted for every new user", () => {
  it("writes date_of_birth on the users row", async () => {
    const email = emailFor("persist");
    const dob = yearsAgo(16);

    const res = await request.post("/api/register").send({
      email,
      password: "TestPass123!",
      firstName: "Test",
      lastName: "Persist",
      dateOfBirth: dob,
    });
    expect(res.status).toBe(201);

    const [row] = await db.select().from(users).where(eq(users.email, email));
    expect(row).toBeDefined();
    expect(row.dateOfBirth).not.toBeNull();

    // Stored as a timestamp; compare on the calendar date only.
    const stored = toLocalDateString(new Date(row.dateOfBirth as unknown as string));
    expect(stored).toBe(dob);
  });
});
