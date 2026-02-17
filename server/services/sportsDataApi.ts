import { db } from "../db";
import { colleges, collegeRosterPlayers, collegeCoachingStaff } from "@shared/schema";
import { eq } from "drizzle-orm";

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

export { cfbApi, ncaaBasketballApi };
