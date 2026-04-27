/**
 * Test helper: creates a configured Express app with all routes registered
 * so supertest can make requests without binding to a port.
 */
import express from "express";
import { createServer } from "http";
import { registerRoutes } from "../../server/routes.js";

let _app: express.Express | null = null;
let _ready: Promise<express.Express> | null = null;

export async function getTestApp(): Promise<express.Express> {
  if (_app) return _app;
  if (_ready) return _ready;

  _ready = (async () => {
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    const httpServer = createServer(app);
    await registerRoutes(httpServer, app);
    _app = app;
    return app;
  })();

  return _ready;
}

/**
 * Extract cookies from a supertest response and format them for the next request.
 */
export function extractCookies(res: { headers: Record<string, any> }): string {
  const raw = res.headers["set-cookie"];
  if (!raw) return "";
  const cookies = Array.isArray(raw) ? raw : [raw];
  return cookies.map((c: string) => c.split(";")[0]).join("; ");
}

/**
 * Register a fresh test user and return their session cookie + id.
 */
export async function registerAndLogin(
  request: ReturnType<typeof import("supertest").default>,
  overrides: { email?: string; password?: string; firstName?: string; lastName?: string } = {}
) {
  const ts = Date.now();
  const email = overrides.email ?? `test_${ts}@caliber-test.dev`;
  const password = overrides.password ?? "TestPass123!";
  const firstName = overrides.firstName ?? "Test";
  const lastName = overrides.lastName ?? "User";

  const regRes = await request
    .post("/api/register")
    .send({ email, password, firstName, lastName });

  if (regRes.status !== 201) {
    throw new Error(
      `Registration failed: ${regRes.status} – ${JSON.stringify(regRes.body)}`
    );
  }

  const cookie = extractCookies(regRes);
  return { email, password, cookie, userId: regRes.body.id as string };
}

/**
 * Clean up test users by email pattern. Runs raw SQL to delete all related rows.
 */
export async function cleanupTestUsers(emailPattern = "%@caliber-test.dev") {
  const { db } = await import("../../server/db.js");
  const { sql } = await import("drizzle-orm");

  // Order matters: child rows first, then parent
  await db.execute(sql`
    DELETE FROM badges WHERE player_id IN (
      SELECT id FROM players WHERE name LIKE 'Test%'
    )
  `);
  await db.execute(sql`
    DELETE FROM personal_records WHERE player_id IN (
      SELECT id FROM players WHERE name LIKE 'Test%'
    )
  `);
  await db.execute(sql`
    DELETE FROM games WHERE player_id IN (
      SELECT id FROM players WHERE name LIKE 'Test%'
    )
  `);
  await db.execute(sql`
    DELETE FROM skill_badges WHERE player_id IN (
      SELECT id FROM players WHERE name LIKE 'Test%'
    )
  `);
  await db.execute(sql`
    DELETE FROM feed_activities WHERE player_id IN (
      SELECT id FROM players WHERE name LIKE 'Test%'
    )
  `);
  await db.execute(sql`
    DELETE FROM activity_streaks WHERE player_id IN (
      SELECT id FROM players WHERE name LIKE 'Test%'
    )
  `);
  await db.execute(sql`
    DELETE FROM player_goals WHERE player_id IN (
      SELECT id FROM players WHERE name LIKE 'Test%'
    )
  `);
  await db.execute(sql`DELETE FROM players WHERE name LIKE 'Test%'`);
  await db.execute(sql`DELETE FROM users WHERE email LIKE ${emailPattern}`);
}
