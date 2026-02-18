import { db } from "../db";
import { colleges, collegeRosterPlayers, collegeCoachingStaff } from "@shared/schema";
import { eq, isNotNull } from "drizzle-orm";

interface CollegeFootballTeam {
  id: number;
  school: string;
  mascot: string;
  abbreviation: string;
  conference: string;
  division: string;
  color: string;
  alt_color: string;
  logos: string[];
}

interface CollegeFootballRecord {
  year: number;
  teamId: number;
  team: string;
  conference: string;
  division: string;
  total: {
    games: number;
    wins: number;
    losses: number;
    ties: number;
  };
  conferenceGames: {
    games: number;
    wins: number;
    losses: number;
    ties: number;
  };
}

interface CollegeFootballCoach {
  first_name: string;
  last_name: string;
  hire_date: string;
  seasons: {
    school: string;
    year: number;
    games: number;
    wins: number;
    losses: number;
    ties: number;
  }[];
}

interface CollegeFootballRecruitingRank {
  year: number;
  rank: number;
  team: string;
  points: number;
}

interface NFLDraftPick {
  year: number;
  round: number;
  pick: number;
  team: string;
  name: string;
  position: string;
  collegeTeam: string;
}

const CFB_API_BASE = "https://api.collegefootballdata.com";

class CollegeFootballDataAPI {
  private apiKey: string | null;

  constructor() {
    this.apiKey = process.env.CFB_API_KEY || null;
  }

  private async fetch<T>(endpoint: string): Promise<T | null> {
    if (!this.apiKey) {
      console.log("CFB API key not set, skipping API call");
      return null;
    }

    try {
      const response = await fetch(`${CFB_API_BASE}${endpoint}`, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        console.error(`CFB API error: ${response.status} ${response.statusText}`);
        return null;
      }

      return await response.json() as T;
    } catch (error) {
      console.error("CFB API fetch error:", error);
      return null;
    }
  }

  async getTeams(): Promise<CollegeFootballTeam[] | null> {
    return this.fetch<CollegeFootballTeam[]>("/teams?division=fbs");
  }

  async getTeamRecord(team: string, year?: number): Promise<CollegeFootballRecord[] | null> {
    // Use previous year since current season may not have started/finished
    const seasonYear = year || new Date().getFullYear() - 1;
    return this.fetch<CollegeFootballRecord[]>(`/records?year=${seasonYear}&team=${encodeURIComponent(team)}`);
  }

  async getCoaches(team: string, year?: number): Promise<CollegeFootballCoach[] | null> {
    const currentYear = year || new Date().getFullYear();
    return this.fetch<CollegeFootballCoach[]>(`/coaches?team=${encodeURIComponent(team)}&year=${currentYear}`);
  }

  async getRecruitingRankings(year?: number): Promise<CollegeFootballRecruitingRank[] | null> {
    const currentYear = year || new Date().getFullYear();
    return this.fetch<CollegeFootballRecruitingRank[]>(`/recruiting/teams?year=${currentYear}`);
  }

  async getDraftPicks(team: string): Promise<NFLDraftPick[] | null> {
    return this.fetch<NFLDraftPick[]>(`/draft/picks?college=${encodeURIComponent(team)}`);
  }
}

interface NCAATeamStats {
  wins: number;
  losses: number;
  conferenceWins: number;
  conferenceLosses: number;
}

interface NCAABasketballTeam {
  name: string;
  conference: string;
  record: string;
  conferenceRecord: string;
}

// ESPN team IDs for D1 basketball programs
const espnTeamIds: Record<string, string> = {
  "Duke University": "150",
  "University of Kentucky": "96",
  "University of Kansas": "2305",
  "University of North Carolina": "153",
  "UCLA": "26",
  "Michigan State University": "127",
  "University of Connecticut": "41",
  "Gonzaga University": "2250",
  "Villanova University": "222",
  "Syracuse University": "183",
  "Arizona State University": "9",
  "University of Houston": "248",
  "San Diego State University": "21",
  "University of Alabama": "333",
  "Ohio State University": "194",
  "University of Georgia": "61",
  "University of Texas": "251",
  "University of Michigan": "130",
  "Clemson University": "228",
  "University of Southern California": "30",
  "University of Oregon": "2483",
  "Boise State University": "68",
  "Penn State University": "213",
  "University of Notre Dame": "87",
  "LSU": "99",
  "University of Florida": "57",
  "University of Tennessee": "2633",
  "University of Arkansas": "8",
  "Auburn University": "2",
  "University of Wisconsin": "275",
  "University of Iowa": "2294",
  "Indiana University": "84",
  "University of Louisville": "97",
  "University of Maryland": "120",
  "University of Arizona": "12",
  "University of Colorado": "38",
  "University of Virginia": "258",
  "Virginia Tech": "259",
  "Wake Forest University": "154",
  "North Carolina State University": "152",
  "University of Miami": "2390",
  "Florida State University": "52",
  "Georgia Tech": "59",
  "University of Oklahoma": "201",
  "Oklahoma State University": "197",
  "Texas A&M University": "245",
  "Texas Tech University": "2641",
  "TCU": "2628",
  "Baylor University": "239",
  "West Virginia University": "277",
  "Iowa State University": "66",
  "University of Cincinnati": "2132",
  "University of Memphis": "235",
  "Creighton University": "156",
  "Marquette University": "269",
  "Xavier University": "2752",
  "Seton Hall University": "2550",
  "Providence College": "2507",
  "Butler University": "2169",
  "St. John's University": "2599",
  "DePaul University": "305",
  "Georgetown University": "46",
  "Purdue University": "2509",
  "University of Illinois": "356",
  "Northwestern University": "77",
  "University of Minnesota": "135",
  "University of Nebraska": "158",
  "Rutgers University": "164",
  "University of Washington": "264",
  "Oregon State University": "204",
  "Washington State University": "265",
  "Stanford University": "24",
  "California (Berkeley)": "25",
  "Colorado State University": "36",
  "Nevada (Las Vegas)": "2439",
  "Fresno State University": "278",
  "Utah State University": "328",
  "New Mexico University": "167",
  "Air Force": "2005",
  "Wyoming": "2704",
  "Saint Mary's College": "2608",
  "BYU": "252",
  "Dayton University": "2248",
  "Wichita State University": "2724",
  "Davidson College": "2166",
  "VCU": "2670",
  "George Mason University": "2244",
  "Murray State University": "93",
  "Loyola Chicago": "2341",
  "UNC Greensboro": "2430",
  "Belmont University": "2057",
  "Liberty University": "2335",
  "UAB": "5",
  "Southern Methodist University": "2567",
  "Tulane University": "2655",
  "East Carolina University": "151",
  "Temple University": "218",
  "USF": "58",
  "Tulsa University": "2653",
};

class NCAABasketballAPI {
  private baseUrl = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball";

  async getRoster(teamId: string): Promise<any | null> {
    try {
      const response = await fetch(`${this.baseUrl}/teams/${teamId}/roster`);
      if (!response.ok) {
        console.log(`ESPN Roster API returned ${response.status} for team ${teamId}`);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error("ESPN Basketball Roster API error:", error);
      return null;
    }
  }

  async getCoach(teamId: string): Promise<any[] | null> {
    try {
      const response = await fetch(`${this.baseUrl}/teams/${teamId}/roster`);
      if (!response.ok) {
        console.log(`ESPN Coach API returned ${response.status} for team ${teamId}`);
        return null;
      }
      const data = await response.json();
      return data.coach || null;
    } catch (error) {
      console.error("ESPN Basketball Coach API error:", error);
      return null;
    }
  }

  async getTeamById(teamId: string): Promise<{ wins: number; losses: number; confWins: number; confLosses: number } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/teams/${teamId}`);
      if (!response.ok) {
        console.log(`ESPN API returned ${response.status} for team ${teamId}`);
        return null;
      }
      
      const data = await response.json();
      const team = data.team;
      
      if (!team?.record?.items) {
        console.log(`No record data found for team ${teamId}`);
        return null;
      }
      
      // Parse overall record
      const overallRecord = team.record.items.find((r: any) => r.type === "total" || r.name === "overall");
      const confRecord = team.record.items.find((r: any) => r.type === "vsconf" || r.name === "vsconf");
      
      let wins = 0, losses = 0, confWins = 0, confLosses = 0;
      
      if (overallRecord?.summary) {
        const parts = overallRecord.summary.split('-');
        if (parts.length >= 2) {
          wins = parseInt(parts[0]) || 0;
          losses = parseInt(parts[1]) || 0;
        }
      }
      
      if (confRecord?.summary) {
        const parts = confRecord.summary.split('-');
        if (parts.length >= 2) {
          confWins = parseInt(parts[0]) || 0;
          confLosses = parseInt(parts[1]) || 0;
        }
      }
      
      return { wins, losses, confWins, confLosses };
    } catch (error) {
      console.error("ESPN Basketball API error:", error);
      return null;
    }
  }
}

const cfbApi = new CollegeFootballDataAPI();
const ncaaBasketballApi = new NCAABasketballAPI();

const schoolNameMappings: Record<string, string> = {
  "University of Alabama": "Alabama",
  "Ohio State University": "Ohio State",
  "University of Georgia": "Georgia",
  "University of Texas": "Texas",
  "University of Michigan": "Michigan",
  "Clemson University": "Clemson",
  "University of Southern California": "USC",
  "University of Oregon": "Oregon",
  "Penn State University": "Penn State",
  "University of Notre Dame": "Notre Dame",
  "LSU": "LSU",
  "Boise State University": "Boise State",
  "Duke University": "Duke",
  "University of Kentucky": "Kentucky",
  "University of Kansas": "Kansas",
  "University of North Carolina": "North Carolina",
  "UCLA": "UCLA",
  "University of Connecticut": "Connecticut",
  "Gonzaga University": "Gonzaga",
  "Villanova University": "Villanova",
  "Michigan State University": "Michigan State",
  "Syracuse University": "Syracuse",
  "San Diego State University": "San Diego State",
  "Arizona State University": "Arizona State",
  "University of Houston": "Houston",
};

function getApiTeamName(collegeName: string): string {
  return schoolNameMappings[collegeName] || collegeName;
}

export async function syncFootballStats(): Promise<{ updated: number; errors: number }> {
  console.log("Starting football stats sync from CollegeFootballData.com...");
  console.log("CFB API key present:", !!process.env.CFB_API_KEY);
  
  let updated = 0;
  let errors = 0;
  
  const footballColleges = await db.select().from(colleges).where(eq(colleges.sport, "football"));
  console.log(`Found ${footballColleges.length} football colleges, filtering for D1...`);
  
  const d1Colleges = footballColleges.filter(c => c.division === "D1");
  console.log(`Processing ${d1Colleges.length} D1 football colleges`);
  
  for (const college of d1Colleges) {
    try {
      const apiTeamName = getApiTeamName(college.name);
      console.log(`Fetching stats for ${college.name} (API name: ${apiTeamName})...`);
      
      const records = await cfbApi.getTeamRecord(apiTeamName);
      console.log(`API response for ${apiTeamName}:`, records ? `${records.length} records` : 'null');
      
      if (records && records.length > 0) {
        const record = records[0];
        
        await db.update(colleges)
          .set({
            winsLastSeason: record.total.wins,
            lossesLastSeason: record.total.losses,
            conferenceRecord: `${record.conferenceGames.wins}-${record.conferenceGames.losses}`,
            statsLastUpdated: new Date(),
            statsSource: "cfb_api",
          })
          .where(eq(colleges.id, college.id));
        
        console.log(`Updated ${college.name}: ${record.total.wins}-${record.total.losses}`);
        updated++;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`Error syncing ${college.name}:`, error);
      errors++;
    }
  }
  
  console.log(`Football sync complete: ${updated} updated, ${errors} errors`);
  return { updated, errors };
}

export async function syncBasketballStats(): Promise<{ updated: number; errors: number }> {
  console.log("Starting basketball stats sync from ESPN API...");
  
  let updated = 0;
  let errors = 0;
  
  const basketballColleges = await db.select().from(colleges).where(eq(colleges.sport, "basketball"));
  const d1Colleges = basketballColleges.filter(c => c.division === "D1");
  console.log(`Processing ${d1Colleges.length} D1 basketball colleges`);
  
  for (const college of d1Colleges) {
    const espnId = espnTeamIds[college.name];
    
    if (!espnId) {
      console.log(`No ESPN ID mapping for ${college.name}, skipping`);
      continue;
    }
    
    try {
      console.log(`Fetching ESPN stats for ${college.name} (ID: ${espnId})...`);
      const record = await ncaaBasketballApi.getTeamById(espnId);
      
      if (record && (record.wins > 0 || record.losses > 0)) {
        await db.update(colleges)
          .set({
            winsLastSeason: record.wins,
            lossesLastSeason: record.losses,
            conferenceRecord: record.confWins > 0 || record.confLosses > 0 
              ? `${record.confWins}-${record.confLosses}` 
              : null,
            espnTeamId: espnId,
            statsLastUpdated: new Date(),
            statsSource: "espn_api",
          })
          .where(eq(colleges.id, college.id));
        
        console.log(`Updated ${college.name}: ${record.wins}-${record.losses} (conf: ${record.confWins}-${record.confLosses})`);
        updated++;
      } else {
        console.log(`No record data for ${college.name}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
    } catch (error) {
      console.error(`Error syncing ${college.name}:`, error);
      errors++;
    }
  }
  
  console.log(`Basketball sync complete: ${updated} updated, ${errors} errors`);
  return { updated, errors };
}

export async function syncAllCollegeStats(): Promise<{
  football: { updated: number; errors: number };
  basketball: { updated: number; errors: number };
}> {
  const football = await syncFootballStats();
  const basketball = await syncBasketballStats();
  
  return { football, basketball };
}

const espnFootballTeamIds: Record<string, string> = {
  "Clemson University": "228",
  "University of Alabama": "333",
  "Ohio State University": "194",
  "University of Georgia": "61",
  "University of Texas": "251",
  "University of Michigan": "130",
  "University of Southern California": "30",
  "University of Oregon": "2483",
  "Penn State University": "213",
  "University of Notre Dame": "87",
  "LSU": "99",
  "Boise State University": "68",
};

async function getFootballRoster(teamId: string): Promise<any | null> {
  try {
    const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${teamId}/roster`);
    if (!response.ok) {
      console.log(`ESPN Football Roster API returned ${response.status} for team ${teamId}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("ESPN Football Roster API error:", error);
    return null;
  }
}

function parseBasketballRoster(data: any): { players: any[]; coaches: any[] } {
  const players: any[] = [];
  const coaches: any[] = [];

  if (data.athletes && Array.isArray(data.athletes)) {
    for (const athlete of data.athletes) {
      players.push({
        espnId: athlete.id?.toString() || null,
        name: athlete.displayName || `${athlete.firstName || ''} ${athlete.lastName || ''}`.trim(),
        firstName: athlete.firstName || null,
        lastName: athlete.lastName || null,
        jersey: athlete.jersey?.toString() || null,
        position: athlete.position?.abbreviation || null,
        height: athlete.displayHeight || null,
        weight: athlete.displayWeight?.toString() || null,
        classYear: athlete.experience?.displayValue || null,
        hometown: athlete.birthPlace?.displayText || null,
        headshotUrl: athlete.headshot?.href || null,
      });
    }
  }

  if (data.coach && Array.isArray(data.coach)) {
    for (const coach of data.coach) {
      coaches.push({
        espnId: coach.id?.toString() || null,
        name: `${coach.firstName || ''} ${coach.lastName || ''}`.trim(),
        firstName: coach.firstName || null,
        lastName: coach.lastName || null,
        title: coach.title || "Head Coach",
        experience: typeof coach.experience === 'number' ? coach.experience : null,
        headshotUrl: coach.headshot?.href || null,
      });
    }
  }

  return { players, coaches };
}

function parseFootballRoster(data: any): { players: any[]; coaches: any[] } {
  const players: any[] = [];
  const coaches: any[] = [];

  if (data.athletes && Array.isArray(data.athletes)) {
    for (const group of data.athletes) {
      const items = group.items || [];
      for (const athlete of items) {
        players.push({
          espnId: athlete.id?.toString() || null,
          name: athlete.displayName || `${athlete.firstName || ''} ${athlete.lastName || ''}`.trim(),
          firstName: athlete.firstName || null,
          lastName: athlete.lastName || null,
          jersey: athlete.jersey?.toString() || null,
          position: athlete.position?.abbreviation || null,
          height: athlete.displayHeight || null,
          weight: athlete.displayWeight?.toString() || null,
          classYear: athlete.experience?.displayValue || null,
          hometown: athlete.birthPlace?.displayText || null,
          headshotUrl: athlete.headshot?.href || null,
        });
      }
    }
  }

  if (data.coach && Array.isArray(data.coach)) {
    for (const coach of data.coach) {
      coaches.push({
        espnId: coach.id?.toString() || null,
        name: `${coach.firstName || ''} ${coach.lastName || ''}`.trim(),
        firstName: coach.firstName || null,
        lastName: coach.lastName || null,
        title: coach.title || "Head Coach",
        experience: typeof coach.experience === 'number' ? coach.experience : null,
        headshotUrl: coach.headshot?.href || null,
      });
    }
  }

  return { players, coaches };
}

export async function syncRosterData(): Promise<{ updated: number; errors: number }> {
  console.log("Starting roster data sync from ESPN API...");

  let updated = 0;
  let errors = 0;

  const allColleges = await db.select().from(colleges);
  const d1Colleges = allColleges.filter(c => c.division === "D1");
  console.log(`Processing ${d1Colleges.length} D1 colleges for roster sync`);

  for (const college of d1Colleges) {
    try {
      let espnId: string | undefined;
      let rosterData: any = null;
      let isFootball = college.sport === "football";

      if (isFootball) {
        espnId = espnFootballTeamIds[college.name];
      } else {
        espnId = espnTeamIds[college.name];
      }

      if (!espnId) {
        continue;
      }

      console.log(`Fetching roster for ${college.name} (ESPN ID: ${espnId}, sport: ${college.sport})...`);

      if (isFootball) {
        rosterData = await getFootballRoster(espnId);
      } else {
        rosterData = await ncaaBasketballApi.getRoster(espnId);
      }

      if (!rosterData) {
        console.log(`No roster data returned for ${college.name}`);
        continue;
      }

      const { players, coaches } = isFootball
        ? parseFootballRoster(rosterData)
        : parseBasketballRoster(rosterData);

      console.log(`Parsed ${players.length} players and ${coaches.length} coaches for ${college.name}`);

      await db.delete(collegeRosterPlayers).where(eq(collegeRosterPlayers.collegeId, college.id));
      await db.delete(collegeCoachingStaff).where(eq(collegeCoachingStaff.collegeId, college.id));

      if (players.length > 0) {
        const playerRows = players.map(p => ({
          collegeId: college.id,
          ...p,
        }));
        await db.insert(collegeRosterPlayers).values(playerRows);
      }

      if (coaches.length > 0) {
        const coachRows = coaches.map(c => ({
          collegeId: college.id,
          ...c,
        }));
        await db.insert(collegeCoachingStaff).values(coachRows);
      }

      await db.update(colleges)
        .set({ currentRosterSize: players.length })
        .where(eq(colleges.id, college.id));

      console.log(`Updated roster for ${college.name}: ${players.length} players, ${coaches.length} coaches`);
      updated++;

      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      console.error(`Error syncing roster for ${college.name}:`, error);
      errors++;
    }
  }

  console.log(`Roster sync complete: ${updated} updated, ${errors} errors`);
  return { updated, errors };
}

export async function autoMapEspnTeamIds(): Promise<{ matched: number; unmatched: number }> {
  console.log("Starting auto-mapping of ESPN team IDs...");

  let matched = 0;
  let unmatched = 0;

  const allColleges = await db.select().from(colleges);
  console.log(`Found ${allColleges.length} colleges in database`);

  const espnTeams: Array<{ id: string; displayName: string; shortDisplayName: string; abbreviation: string; sport: string }> = [];

  try {
    console.log("Fetching basketball teams from ESPN...");
    const bbResponse = await fetch("https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams?limit=400");
    if (bbResponse.ok) {
      const bbData = await bbResponse.json();
      const teams = bbData.sports?.[0]?.leagues?.[0]?.teams || [];
      for (const t of teams) {
        const team = t.team || t;
        espnTeams.push({
          id: team.id?.toString() || "",
          displayName: team.displayName || "",
          shortDisplayName: team.shortDisplayName || "",
          abbreviation: team.abbreviation || "",
          sport: "basketball",
        });
      }
      console.log(`Fetched ${teams.length} basketball teams from ESPN`);
    }
  } catch (error) {
    console.error("Error fetching ESPN basketball teams:", error);
  }

  await new Promise(resolve => setTimeout(resolve, 200));

  try {
    console.log("Fetching football teams from ESPN...");
    const fbResponse = await fetch("https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams?limit=400");
    if (fbResponse.ok) {
      const fbData = await fbResponse.json();
      const teams = fbData.sports?.[0]?.leagues?.[0]?.teams || [];
      for (const t of teams) {
        const team = t.team || t;
        espnTeams.push({
          id: team.id?.toString() || "",
          displayName: team.displayName || "",
          shortDisplayName: team.shortDisplayName || "",
          abbreviation: team.abbreviation || "",
          sport: "football",
        });
      }
      console.log(`Fetched ${teams.length} football teams from ESPN`);
    }
  } catch (error) {
    console.error("Error fetching ESPN football teams:", error);
  }

  console.log(`Total ESPN teams fetched: ${espnTeams.length}`);

  for (const college of allColleges) {
    if (college.espnTeamId) {
      continue;
    }

    const knownId = espnTeamIds[college.name] || espnFootballTeamIds[college.name];
    if (knownId) {
      await db.update(colleges)
        .set({ espnTeamId: knownId })
        .where(eq(colleges.id, college.id));
      matched++;
      continue;
    }

    const div = (college.division || "").toUpperCase();
    if (div === "NAIA" || div === "JUCO" || div === "NJCAA" || div.includes("JUCO") || div.includes("NAIA")) {
      unmatched++;
      continue;
    }

    const collegeName = college.name.toLowerCase();
    const collegeShortName = (college.shortName || "").toLowerCase();

    const match = espnTeams.find(t => {
      const dn = t.displayName.toLowerCase();
      const sdn = t.shortDisplayName.toLowerCase();
      const abbr = t.abbreviation.toLowerCase();

      if (college.sport && t.sport !== college.sport) return false;

      return dn === collegeName ||
        sdn === collegeName ||
        dn === collegeShortName ||
        sdn === collegeShortName ||
        (collegeShortName && abbr === collegeShortName);
    });

    if (match) {
      await db.update(colleges)
        .set({ espnTeamId: match.id })
        .where(eq(colleges.id, college.id));
      console.log(`Matched ${college.name} → ESPN ID ${match.id} (${match.displayName})`);
      matched++;
    } else {
      unmatched++;
    }
  }

  console.log(`Auto-mapping complete: ${matched} matched, ${unmatched} unmatched`);
  return { matched, unmatched };
}

export async function syncAllCollegeStatsFromESPN(): Promise<{ updated: number; errors: number; skipped: number }> {
  console.log("Starting live stats sync from ESPN for all colleges with ESPN IDs...");

  let updated = 0;
  let errors = 0;
  let skipped = 0;

  const collegesWithEspnId = await db.select().from(colleges).where(isNotNull(colleges.espnTeamId));
  console.log(`Found ${collegesWithEspnId.length} colleges with ESPN team IDs`);

  for (const college of collegesWithEspnId) {
    if (!college.espnTeamId) {
      skipped++;
      continue;
    }

    try {
      const isFootball = college.sport === "football";
      const baseUrl = isFootball
        ? "https://site.api.espn.com/apis/site/v2/sports/football/college-football"
        : "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball";

      const response = await fetch(`${baseUrl}/teams/${college.espnTeamId}`);
      if (!response.ok) {
        console.log(`ESPN API returned ${response.status} for ${college.name} (ID: ${college.espnTeamId})`);
        skipped++;
        await new Promise(resolve => setTimeout(resolve, 200));
        continue;
      }

      const data = await response.json();
      const team = data.team;

      if (!team) {
        console.log(`No team data in response for ${college.name}`);
        skipped++;
        await new Promise(resolve => setTimeout(resolve, 200));
        continue;
      }

      let wins = 0, losses = 0;
      let conferenceRecord: string | null = null;
      let standingSummary: string | null = null;
      let nationalRanking: number | null = null;

      if (team.record?.items) {
        const overallRecord = team.record.items.find((r: any) => r.type === "total");
        const confRecord = team.record.items.find((r: any) => r.type === "vsconf");

        if (overallRecord?.summary) {
          const parts = overallRecord.summary.split("-");
          if (parts.length >= 2) {
            wins = parseInt(parts[0]) || 0;
            losses = parseInt(parts[1]) || 0;
          }
        }

        if (confRecord?.summary) {
          conferenceRecord = confRecord.summary;
        }
      }

      if (team.standingSummary) {
        standingSummary = team.standingSummary;
      }

      if (team.rank) {
        nationalRanking = typeof team.rank === "number" ? team.rank : parseInt(team.rank) || null;
      }

      if (wins === 0 && losses === 0) {
        console.log(`No record data for ${college.name}, skipping update`);
        skipped++;
        await new Promise(resolve => setTimeout(resolve, 200));
        continue;
      }

      const updateData: Record<string, any> = {
        winsLastSeason: wins,
        lossesLastSeason: losses,
        statsLastUpdated: new Date(),
        statsSource: "espn_live",
      };

      if (conferenceRecord) {
        updateData.conferenceRecord = conferenceRecord;
      }

      if (standingSummary && !conferenceRecord) {
        updateData.conferenceRecord = standingSummary;
      }

      await db.update(colleges)
        .set(updateData)
        .where(eq(colleges.id, college.id));

      console.log(`Updated ${college.name}: ${wins}-${losses}${conferenceRecord ? ` (conf: ${conferenceRecord})` : ""}${nationalRanking ? ` #${nationalRanking}` : ""}`);
      updated++;

      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      console.error(`Error syncing ESPN stats for ${college.name}:`, error);
      errors++;
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  console.log(`ESPN live sync complete: ${updated} updated, ${errors} errors, ${skipped} skipped`);
  return { updated, errors, skipped };
}

export { cfbApi, ncaaBasketballApi };
