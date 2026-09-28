import { describe, it, expect } from "vitest";
import {
  canAccessRoute,
  isKnownRoute,
  ROLE_HOME,
  USER_ROLES,
  type UserRole,
} from "@shared/roles";
import type { FeatureFlags } from "@shared/features";

/* This suite is about role separation, not about the product flags, so every
 * product is on. canAccessRoute defaults to all-disabled on purpose (a caller
 * that forgets denies rather than exposes), which would otherwise make every
 * non-player assertion here pass for the wrong reason.
 * tests/feature-flags.test.ts covers the switched off behaviour. */
const ALL_ON: FeatureFlags = {
  ENABLE_COACH_PRODUCT: true,
  ENABLE_RECRUITER_PRODUCT: true,
  ENABLE_GUARDIAN_PRODUCT: true,
};

describe("canAccessRoute", () => {
  it("lets every role reach shared account and legal pages", () => {
    for (const role of USER_ROLES) {
      expect(canAccessRoute(role, "/pricing", ALL_ON)).toBe(true);
      expect(canAccessRoute(role, "/privacy", ALL_ON)).toBe(true);
      expect(canAccessRoute(role, "/terms", ALL_ON)).toBe(true);
    }
  });

  it("keeps each role out of the other roles' home pages", () => {
    expect(canAccessRoute("player", "/coach", ALL_ON)).toBe(false);
    expect(canAccessRoute("player", "/recruiter", ALL_ON)).toBe(false);
    expect(canAccessRoute("player", "/family", ALL_ON)).toBe(false);

    expect(canAccessRoute("coach", "/recruiter", ALL_ON)).toBe(false);
    expect(canAccessRoute("coach", "/family", ALL_ON)).toBe(false);

    expect(canAccessRoute("recruiter", "/coach", ALL_ON)).toBe(false);
    expect(canAccessRoute("recruiter", "/family", ALL_ON)).toBe(false);

    expect(canAccessRoute("guardian", "/coach", ALL_ON)).toBe(false);
    expect(canAccessRoute("guardian", "/recruiter", ALL_ON)).toBe(false);
    expect(canAccessRoute("guardian", "/analyze", ALL_ON)).toBe(false);
  });

  it("lets each role reach its own home page", () => {
    for (const role of USER_ROLES) {
      expect(canAccessRoute(role, ROLE_HOME[role], ALL_ON)).toBe(true);
    }
  });

  it("blocks the coach sub-routes for non-coaches via the wildcard", () => {
    expect(canAccessRoute("coach", "/coach/lineups", ALL_ON)).toBe(true);
    expect(canAccessRoute("coach", "/coach/verify", ALL_ON)).toBe(true);
    expect(canAccessRoute("player", "/coach/lineups", ALL_ON)).toBe(false);
    expect(canAccessRoute("guardian", "/coach/verify", ALL_ON)).toBe(false);
  });

  it("ignores query strings and hashes when deciding access", () => {
    expect(canAccessRoute("coach", "/coach?tab=dashboard", ALL_ON)).toBe(true);
    expect(canAccessRoute("player", "/coach?tab=dashboard", ALL_ON)).toBe(false);
    expect(canAccessRoute("player", "/analytics?tab=grading", ALL_ON)).toBe(true);
    expect(canAccessRoute("player", "/community?tab=feed#top", ALL_ON)).toBe(true);
  });

  it("matches :param segments without matching extra segments", () => {
    expect(canAccessRoute("recruiter", "/players/42", ALL_ON)).toBe(true);
    expect(canAccessRoute("recruiter", "/players/42/card", ALL_ON)).toBe(true);
    expect(canAccessRoute("guardian", "/players/42", ALL_ON)).toBe(true);
    expect(canAccessRoute("guardian", "/players", ALL_ON)).toBe(false);
  });

  it("denies routes that appear in no role's table", () => {
    for (const role of USER_ROLES) {
      expect(canAccessRoute(role, "/definitely-not-a-page", ALL_ON)).toBe(false);
    }
  });
});

describe("isKnownRoute", () => {
  it("recognises a page owned by any role", () => {
    expect(isKnownRoute("/coach")).toBe(true);
    expect(isKnownRoute("/family")).toBe(true);
    expect(isKnownRoute("/recruiter")).toBe(true);
    expect(isKnownRoute("/pricing")).toBe(true);
  });

  it("does not recognise a typo, so it can still render a 404", () => {
    expect(isKnownRoute("/coच")).toBe(false);
    expect(isKnownRoute("/definitely-not-a-page")).toBe(false);
  });
});

describe("ROLE_HOME", () => {
  it("gives every role a landing route", () => {
    for (const role of USER_ROLES) {
      expect(ROLE_HOME[role as UserRole]).toBeTruthy();
    }
  });
});
