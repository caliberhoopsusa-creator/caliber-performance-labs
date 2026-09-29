/**
 * League authorization tests
 *
 * League sub-resources (teams, games, rivalries, rosters) are owner-scoped:
 * only the league creator may change league-wide structure, and only a team's
 * captain (or the league creator) may change that team's roster. These routes
 * previously fetched the league but never checked who was asking.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import { getTestApp, registerAndLogin, cleanupTestUsers } from "./helpers/setup.js";
import { db } from "../server/db";
import { leagues, leagueTeams, leagueGames, leagueRivalries, leagueTeamRosters } from "@shared/schema";
import { eq } from "drizzle-orm";

let request: ReturnType<typeof supertest>;
const TS = Date.now();

let ownerCookie: string;
let strangerCookie: string;
let leagueId: number;
let teamId: number;

beforeAll(async () => {
  request = supertest(await getTestApp());

  const owner = await registerAndLogin(request, { email: `league_owner_${TS}@caliber-test.dev` });
  ownerCookie = owner.cookie;
  const stranger = await registerAndLogin(request, { email: `league_stranger_${TS}@caliber-test.dev` });
  strangerCookie = stranger.cookie;

  const leagueRes = await request
    .post("/api/leagues")
    .set("Cookie", ownerCookie)
    .send({ name: `Test League ${TS}`, sport: "basketball", seasonName: "Test Season" });
  if (leagueRes.status !== 201 && leagueRes.status !== 200) {
    throw new Error(`League creation failed: ${leagueRes.status} ${JSON.stringify(leagueRes.body)}`);
  }
  leagueId = leagueRes.body.id;

  const teamRes = await request
    .post(`/api/leagues/${leagueId}/teams`)
    .set("Cookie", ownerCookie)
    .send({ name: `Test Team ${TS}` });
  teamId = teamRes.body?.id;
});

afterAll(async () => {
  if (leagueId) {
    // Children first — createdByUserId is plain text, so nothing cascades.
    await db.delete(leagueRivalries).where(eq(leagueRivalries.leagueId, leagueId));
    await db.delete(leagueGames).where(eq(leagueGames.leagueId, leagueId));
    if (teamId) await db.delete(leagueTeamRosters).where(eq(leagueTeamRosters.leagueTeamId, teamId));
    await db.delete(leagueTeams).where(eq(leagueTeams.leagueId, leagueId));
    await db.delete(leagues).where(eq(leagues.id, leagueId));
  }
  await cleanupTestUsers(`league_owner_${TS}@caliber-test.dev`);
  await cleanupTestUsers(`league_stranger_${TS}@caliber-test.dev`);
});

describe("League structure is creator-only", () => {
  it("a stranger cannot schedule games", async () => {
    const res = await request
      .post(`/api/leagues/${leagueId}/games`)
      .set("Cookie", strangerCookie)
      .send({ homeTeamId: teamId, awayTeamId: teamId, scheduledAt: new Date().toISOString() });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/league creator/i);
  });

  it("a stranger cannot create rivalries", async () => {
    const res = await request
      .post(`/api/leagues/${leagueId}/rivalries`)
      .set("Cookie", strangerCookie)
      .send({ team1Id: teamId, team2Id: teamId, rivalryName: "Nope" });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/league creator/i);
  });

  it("the creator is still allowed through the same check", async () => {
    const res = await request
      .post(`/api/leagues/${leagueId}/rivalries`)
      .set("Cookie", ownerCookie)
      .send({ team1Id: teamId, team2Id: teamId, rivalryName: `Rivalry ${TS}` });

    // Whatever the outcome, it must not be an authorization failure.
    expect(res.status).not.toBe(403);
  });
});

describe("Team rosters are captain-or-creator", () => {
  it("a stranger cannot add players to a roster", async () => {
    const res = await request
      .post(`/api/leagues/${leagueId}/teams/${teamId}/roster`)
      .set("Cookie", strangerCookie)
      .send({ playerId: 1 });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/captain or league creator/i);
  });

  it("a stranger cannot remove players from a roster", async () => {
    const res = await request
      .delete(`/api/leagues/${leagueId}/teams/${teamId}/roster/1`)
      .set("Cookie", strangerCookie);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/captain or league creator/i);
  });
});
