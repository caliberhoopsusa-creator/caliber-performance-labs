import { describe, it, expect } from "vitest";
import {
  canAccessRoute,
  isKnownRoute,
  ROLE_HOME,
  USER_ROLES,
  type UserRole,
} from "@shared/roles";

describe("canAccessRoute", () => {
  it("lets every role reach shared account and legal pages", () => {
    for (const role of USER_ROLES) {
      expect(canAccessRoute(role, "/pricing")).toBe(true);
      expect(canAccessRoute(role, "/privacy")).toBe(true);
      expect(canAccessRoute(role, "/terms")).toBe(true);
    }
  });

  it("keeps each role out of the other roles' home pages", () => {
    expect(canAccessRoute("player", "/coach")).toBe(false);
    expect(canAccessRoute("player", "/recruiter")).toBe(false);
    expect(canAccessRoute("player", "/family")).toBe(false);

    expect(canAccessRoute("coach", "/recruiter")).toBe(false);
    expect(canAccessRoute("coach", "/family")).toBe(false);

    expect(canAccessRoute("recruiter", "/coach")).toBe(false);
    expect(canAccessRoute("recruiter", "/family")).toBe(false);

    expect(canAccessRoute("guardian", "/coach")).toBe(false);
    expect(canAccessRoute("guardian", "/recruiter")).toBe(false);
    expect(canAccessRoute("guardian", "/analyze")).toBe(false);
  });

  it("lets each role reach its own home page", () => {
    for (const role of USER_ROLES) {
      expect(canAccessRoute(role, ROLE_HOME[role])).toBe(true);
    }
  });

  it("blocks the coach sub-routes for non-coaches via the wildcard", () => {
    expect(canAccessRoute("coach", "/coach/lineups")).toBe(true);
    expect(canAccessRoute("coach", "/coach/verify")).toBe(true);
    expect(canAccessRoute("player", "/coach/lineups")).toBe(false);
    expect(canAccessRoute("guardian", "/coach/verify")).toBe(false);
  });

  it("ignores query strings and hashes when deciding access", () => {
    expect(canAccessRoute("coach", "/coach?tab=dashboard")).toBe(true);
    expect(canAccessRoute("player", "/coach?tab=dashboard")).toBe(false);
    expect(canAccessRoute("player", "/analytics?tab=grading")).toBe(true);
    expect(canAccessRoute("player", "/community?tab=feed#top")).toBe(true);
  });

  it("matches :param segments without matching extra segments", () => {
    expect(canAccessRoute("recruiter", "/players/42")).toBe(true);
    expect(canAccessRoute("recruiter", "/players/42/card")).toBe(true);
    expect(canAccessRoute("guardian", "/players/42")).toBe(true);
    expect(canAccessRoute("guardian", "/players")).toBe(false);
  });

  it("denies routes that appear in no role's table", () => {
    for (const role of USER_ROLES) {
      expect(canAccessRoute(role, "/definitely-not-a-page")).toBe(false);
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
