/**
 * Product feature flag tests (pivot Section 2).
 *
 * The coach, recruiter and guardian products ship dark while Caliber pivots to
 * player first. Nothing is deleted: the routes still exist and the code still
 * compiles, but a disabled product answers 404.
 *
 * 404 and not 403 is deliberate. A 403 would confirm the route is real and only
 * role gated, which tells a prober exactly what is parked behind the flag.
 *
 * The flag check runs before the auth check, so these route assertions need no
 * login: an unauthenticated request to a dark product must 404 rather than 401.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import supertest from "supertest";
import { getTestApp } from "./helpers/setup.js";
import {
  readFlags,
  parseFlagValue,
  isRoleEnabled,
  selectableRoles,
  ALL_PRODUCTS_DISABLED,
} from "@shared/features";
import { canAccessRoute, roleHome, DISABLED_PRODUCT_HOME, ROLE_HOME } from "@shared/roles";

let request: ReturnType<typeof supertest>;

const FLAG_KEYS = [
  "ENABLE_COACH_PRODUCT",
  "ENABLE_RECRUITER_PRODUCT",
  "ENABLE_GUARDIAN_PRODUCT",
] as const;

const originalEnv: Record<string, string | undefined> = {};

beforeAll(async () => {
  request = supertest(await getTestApp());
  for (const key of FLAG_KEYS) originalEnv[key] = process.env[key];
});

afterAll(() => {
  for (const key of FLAG_KEYS) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
});

/** Every product dark, which is the shipping default. */
beforeEach(() => {
  for (const key of FLAG_KEYS) process.env[key] = "false";
});

// ------------------------------------------------------------ pure helpers

describe("parseFlagValue is strictly opt in", () => {
  it("enables only on the exact string true", () => {
    expect(parseFlagValue("true")).toBe(true);
  });

  it.each([["TRUE"], ["True"], ["1"], ["yes"], [""], ["false"], ["0"]])(
    "treats %j as off, so a config typo fails closed",
    (value) => {
      expect(parseFlagValue(value)).toBe(false);
    },
  );

  it("treats a missing value as off", () => {
    expect(parseFlagValue(undefined)).toBe(false);
    expect(parseFlagValue(null)).toBe(false);
  });
});

describe("readFlags", () => {
  it("reads the bare names for the server", () => {
    const flags = readFlags({ ENABLE_COACH_PRODUCT: "true" });
    expect(flags.ENABLE_COACH_PRODUCT).toBe(true);
    expect(flags.ENABLE_RECRUITER_PRODUCT).toBe(false);
  });

  it("reads the VITE_ prefixed names for the client", () => {
    const flags = readFlags({ VITE_ENABLE_GUARDIAN_PRODUCT: "true" }, "VITE_");
    expect(flags.ENABLE_GUARDIAN_PRODUCT).toBe(true);
  });

  it("produces all off from an empty environment", () => {
    expect(readFlags({})).toEqual(ALL_PRODUCTS_DISABLED);
  });
});

describe("isRoleEnabled", () => {
  it("never gates player, because player is the platform now", () => {
    expect(isRoleEnabled("player", ALL_PRODUCTS_DISABLED)).toBe(true);
  });

  it.each([["coach"], ["recruiter"], ["guardian"]] as const)(
    "gates %s when every flag is off",
    (role) => {
      expect(isRoleEnabled(role, ALL_PRODUCTS_DISABLED)).toBe(false);
    },
  );

  it("offers only player at sign up when every product is dark", () => {
    expect(selectableRoles(ALL_PRODUCTS_DISABLED)).toEqual(["player"]);
  });

  it("offers coach alongside player once the coach flag is on", () => {
    const flags = { ...ALL_PRODUCTS_DISABLED, ENABLE_COACH_PRODUCT: true };
    expect(selectableRoles(flags)).toEqual(["player", "coach"]);
  });
});

// ------------------------------------------------------- client route guard

describe("canAccessRoute honours the flags", () => {
  it("denies a coach their own routes while the coach product is dark", () => {
    expect(canAccessRoute("coach", "/coach", ALL_PRODUCTS_DISABLED)).toBe(false);
  });

  it("allows those routes once the flag is on", () => {
    const flags = { ...ALL_PRODUCTS_DISABLED, ENABLE_COACH_PRODUCT: true };
    expect(canAccessRoute("coach", "/coach", flags)).toBe(true);
  });

  it("leaves the shared routes reachable by a dark role", () => {
    expect(canAccessRoute("coach", "/community", ALL_PRODUCTS_DISABLED)).toBe(true);
    expect(canAccessRoute("guardian", "/pricing", ALL_PRODUCTS_DISABLED)).toBe(true);
  });

  it("never restricts the player path", () => {
    expect(canAccessRoute("player", "/analyze", ALL_PRODUCTS_DISABLED)).toBe(true);
    expect(canAccessRoute("player", "/recruiting", ALL_PRODUCTS_DISABLED)).toBe(true);
  });

  it("fails closed when a caller forgets to pass flags", () => {
    // The default argument is every product disabled, on purpose.
    expect(canAccessRoute("recruiter", "/recruiter")).toBe(false);
  });
});

describe("roleHome", () => {
  it("sends a dark role to the shared feed, not to its own dashboard", () => {
    expect(roleHome("coach", ALL_PRODUCTS_DISABLED)).toBe(DISABLED_PRODUCT_HOME);
    expect(roleHome("guardian", ALL_PRODUCTS_DISABLED)).toBe(DISABLED_PRODUCT_HOME);
  });

  it("sends a live role to its own home", () => {
    const flags = { ...ALL_PRODUCTS_DISABLED, ENABLE_RECRUITER_PRODUCT: true };
    expect(roleHome("recruiter", flags)).toBe(ROLE_HOME.recruiter);
  });

  it("always sends a player to the player home", () => {
    expect(roleHome("player", ALL_PRODUCTS_DISABLED)).toBe(ROLE_HOME.player);
  });
});

// ----------------------------------------------------------- server routes

describe("a dark product answers 404 on the server", () => {
  it.each([
    ["/api/roster", "coach"],
    ["/api/recruiter/profile", "recruiter"],
    ["/api/guardian/players", "guardian"],
  ])("%s 404s while the %s product is dark", async (url) => {
    const res = await request.get(url);
    expect(res.status).toBe(404);
  });

  it("404s rather than 401s, so the route looks absent and not merely gated", async () => {
    const res = await request.get("/api/roster");
    expect(res.status).toBe(404);
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });

  it("stops 404ing once the flag is on, falling through to the auth check", async () => {
    process.env.ENABLE_COACH_PRODUCT = "true";
    const res = await request.get("/api/roster");
    // Unauthenticated, so the real gate answers now.
    expect(res.status).toBe(401);
  });
});

describe("the player surface is untouched by the flags", () => {
  it("still serves the public player list", async () => {
    const res = await request.get("/api/players");
    expect(res.status).toBe(200);
  });

  it("still serves the public platform stats the landing page reads", async () => {
    const res = await request.get("/api/public/platform-stats");
    expect(res.status).toBe(200);
  });

  it("still answers the health route", async () => {
    const res = await request.get("/api/debug");
    expect([200, 401, 404]).toContain(res.status);
  });
});
