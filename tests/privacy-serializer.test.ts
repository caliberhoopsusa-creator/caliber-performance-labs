/**
 * Unit tests for server/privacy.ts. Pure functions, no database, no app boot.
 *
 * This is where showEmail and showPhone get a real guarantee. The players table
 * has no email or phone column today (the audit found the flags govern data
 * that does not exist yet), so a route level test cannot prove they work. The
 * serializer is the single funnel every player payload passes through, so
 * asserting it strips those keys when the flags are off means the flags are
 * already enforced for the moment a contact field does arrive.
 */
import { describe, it, expect } from "vitest";
import {
  applyPlayerPrivacy,
  applyPlayerPrivacyToList,
  canViewPlayer,
  ANONYMOUS_VIEWER,
  type ViewerIdentity,
} from "../server/privacy";

const OWNER_ID = "user-owner";

/** A player row plus the contact keys a route may join on. */
const basePlayer = {
  id: 1,
  userId: OWNER_ID,
  name: "Jordan Reyes",
  school: "Missoula Sentinel",
  gpa: "3.91",
  dateOfBirth: "2009-04-02",
  minorDataPublic: true,
  profileVisibility: "public",
  coachName: "Coach Vega",
  coachPhone: "555-0100",
  email: "jordan@example.test",
  phone: "555-0199",
  games: [{ id: 9, points: 22 }],
  advancedMetrics: { per: 21.4 },
  showEmail: false,
  showPhone: false,
  showSchool: true,
  showGpa: true,
  showStatsToCoaches: true,
  showContactToCoaches: true,
  showDetailedStatsToGuardians: true,
  showGradesToGuardians: true,
};

const owner: ViewerIdentity = { userId: OWNER_ID, role: "player", isAdmin: false };
const coach: ViewerIdentity = { userId: "user-coach", role: "coach", isAdmin: false };
const recruiter: ViewerIdentity = { userId: "user-rec", role: "recruiter", isAdmin: false };
const admin: ViewerIdentity = { userId: "user-admin", role: "player", isAdmin: true };

describe("the owner and the admin are never redacted", () => {
  it("returns the untouched row to the owner", () => {
    expect(applyPlayerPrivacy(basePlayer, owner)).toBe(basePlayer);
  });

  it("returns the untouched row to the admin", () => {
    expect(applyPlayerPrivacy(basePlayer, admin)).toBe(basePlayer);
  });
});

describe("compliance columns never reach a non owner", () => {
  it("strips date of birth and minorDataPublic", () => {
    const safe = applyPlayerPrivacy(basePlayer, ANONYMOUS_VIEWER);
    expect(safe.dateOfBirth).toBeUndefined();
    expect(safe.minorDataPublic).toBeUndefined();
  });

  it("strips every visibility setting", () => {
    const safe = applyPlayerPrivacy(basePlayer, recruiter);
    for (const key of [
      "profileVisibility", "showEmail", "showPhone", "showSchool", "showGpa",
      "showStatsToCoaches", "showContactToCoaches",
      "showDetailedStatsToGuardians", "showGradesToGuardians",
    ]) {
      expect(safe[key]).toBeUndefined();
    }
  });

  it("does not mutate the input row", () => {
    applyPlayerPrivacy(basePlayer, ANONYMOUS_VIEWER);
    expect(basePlayer.dateOfBirth).toBe("2009-04-02");
    expect(basePlayer.showSchool).toBe(true);
  });
});

describe("showEmail and showPhone (audit 7a, previously read by nothing)", () => {
  it("strips email when showEmail is off", () => {
    const safe = applyPlayerPrivacy(basePlayer, ANONYMOUS_VIEWER);
    expect(safe.email).toBeUndefined();
  });

  it("keeps email when showEmail is on", () => {
    const safe = applyPlayerPrivacy({ ...basePlayer, showEmail: true }, ANONYMOUS_VIEWER);
    expect(safe.email).toBe("jordan@example.test");
  });

  it("strips phone and coachPhone when showPhone is off", () => {
    const safe = applyPlayerPrivacy(basePlayer, ANONYMOUS_VIEWER);
    expect(safe.phone).toBeUndefined();
    expect(safe.coachPhone).toBeUndefined();
  });

  it("keeps phone when showPhone is on", () => {
    const safe = applyPlayerPrivacy({ ...basePlayer, showPhone: true }, ANONYMOUS_VIEWER);
    expect(safe.phone).toBe("555-0199");
  });

  it("defaults to withholding, since both columns default to false", () => {
    const { showEmail, showPhone, ...noFlags } = basePlayer;
    const safe = applyPlayerPrivacy(noFlags, ANONYMOUS_VIEWER);
    expect(safe.email).toBeUndefined();
    expect(safe.phone).toBeUndefined();
  });

  it("never gives a coach's name to the public", () => {
    const safe = applyPlayerPrivacy({ ...basePlayer, showPhone: true }, ANONYMOUS_VIEWER);
    expect(safe.coachName).toBeUndefined();
  });
});

describe("showStatsToCoaches and showContactToCoaches (audit 7a)", () => {
  it("withholds stats from a coach when the flag is off", () => {
    const safe = applyPlayerPrivacy({ ...basePlayer, showStatsToCoaches: false }, coach);
    expect(safe.games).toBeUndefined();
    expect(safe.advancedMetrics).toBeUndefined();
  });

  it("keeps stats for a coach when the flag is on", () => {
    const safe = applyPlayerPrivacy(basePlayer, coach);
    expect(safe.games).toHaveLength(1);
  });

  it("withholds the contact block from a coach when the flag is off", () => {
    const safe = applyPlayerPrivacy({ ...basePlayer, showContactToCoaches: false }, coach);
    expect(safe.coachName).toBeUndefined();
    expect(safe.coachPhone).toBeUndefined();
    expect(safe.email).toBeUndefined();
    expect(safe.phone).toBeUndefined();
  });

  it("gives a coach the contact block when the flag is on", () => {
    const safe = applyPlayerPrivacy(basePlayer, coach);
    expect(safe.coachPhone).toBe("555-0100");
  });

  it("does not let a coach inherit the public showPhone rule", () => {
    // showPhone is false here, but the coach switch is what governs a coach.
    const safe = applyPlayerPrivacy(basePlayer, coach);
    expect(safe.coachPhone).toBe("555-0100");
  });

  it("applies the public rules to a recruiter, not the coach rules", () => {
    const safe = applyPlayerPrivacy({ ...basePlayer, showContactToCoaches: true }, recruiter);
    expect(safe.coachPhone).toBeUndefined();
  });

  it("withholds from a coach when either flag is missing, since both are opt in", () => {
    const { showStatsToCoaches, showContactToCoaches, ...noFlags } = basePlayer;
    const safe = applyPlayerPrivacy(noFlags, coach);
    expect(safe.games).toBeUndefined();
    expect(safe.coachPhone).toBeUndefined();
  });

  it("withholds from a coach when either flag is null", () => {
    const safe = applyPlayerPrivacy(
      { ...basePlayer, showStatsToCoaches: null, showContactToCoaches: null },
      coach,
    );
    expect(safe.games).toBeUndefined();
    expect(safe.coachPhone).toBeUndefined();
  });
});

describe("school and GPA still follow their own flags", () => {
  it("nulls school when showSchool is off", () => {
    const safe = applyPlayerPrivacy({ ...basePlayer, showSchool: false }, ANONYMOUS_VIEWER);
    expect(safe.school).toBeNull();
  });

  it("nulls gpa when showGpa is off", () => {
    const safe = applyPlayerPrivacy({ ...basePlayer, showGpa: false }, ANONYMOUS_VIEWER);
    expect(safe.gpa).toBeNull();
  });

  it("treats an undefined flag as the column default of true", () => {
    const { showSchool, ...noFlag } = basePlayer;
    const safe = applyPlayerPrivacy(noFlag, ANONYMOUS_VIEWER);
    expect(safe.school).toBe("Missoula Sentinel");
  });
});

describe("canViewPlayer", () => {
  it("hides a hidden player from the public", () => {
    expect(canViewPlayer({ ...basePlayer, profileVisibility: "hidden" }, ANONYMOUS_VIEWER)).toBe(false);
  });

  it("still shows a hidden player to its owner", () => {
    expect(canViewPlayer({ ...basePlayer, profileVisibility: "hidden" }, owner)).toBe(true);
  });

  it("still shows a hidden player to an admin", () => {
    expect(canViewPlayer({ ...basePlayer, profileVisibility: "hidden" }, admin)).toBe(true);
  });

  it("keeps link_only readable, since a shared link must resolve", () => {
    expect(canViewPlayer({ ...basePlayer, profileVisibility: "link_only" }, ANONYMOUS_VIEWER)).toBe(true);
  });
});

describe("applyPlayerPrivacyToList", () => {
  it("drops hidden rows and redacts the rest", () => {
    const list = [
      basePlayer,
      { ...basePlayer, id: 2, userId: "other", profileVisibility: "hidden" },
    ];
    const safe = applyPlayerPrivacyToList(list, ANONYMOUS_VIEWER);
    expect(safe).toHaveLength(1);
    expect(safe[0].dateOfBirth).toBeUndefined();
  });
});
