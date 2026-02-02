import { db } from "../db";
import { colleges } from "@shared/schema";
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

class NCAABasketballAPI {
  private baseUrl = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball";

  async getTeamStats(teamId: string): Promise<NCAATeamStats | null> {
    try {
      const response = await fetch(`${this.baseUrl}/teams/${teamId}/statistics`);
      if (!response.ok) return null;
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("NCAA Basketball API error:", error);
      return null;
    }
  }

  async getTeamRecord(teamName: string): Promise<{ wins: number; losses: number } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/scoreboard`);
      if (!response.ok) return null;
      return null;
    } catch (error) {
      console.error("NCAA Basketball API error:", error);
      return null;
    }
  }

  async searchTeam(schoolName: string): Promise<any | null> {
    try {
      const searchUrl = `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams?limit=100`;
      const response = await fetch(searchUrl);
      if (!response.ok) return null;
      
      const data = await response.json();
      const teams = data.sports?.[0]?.leagues?.[0]?.teams || [];
      
      const normalizedSearch = schoolName.toLowerCase().replace(/university|college|of|the/gi, '').trim();
      
      for (const teamWrapper of teams) {
        const team = teamWrapper.team;
        const teamName = team.displayName?.toLowerCase() || '';
        const shortName = team.shortDisplayName?.toLowerCase() || '';
        
        if (teamName.includes(normalizedSearch) || shortName.includes(normalizedSearch) || 
            normalizedSearch.includes(teamName) || normalizedSearch.includes(shortName)) {
          return team;
        }
      }
      
      return null;
    } catch (error) {
      console.error("NCAA Basketball search error:", error);
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
  
  for (const college of basketballColleges) {
    if (college.division !== "D1") {
      continue;
    }
    
    try {
      const team = await ncaaBasketballApi.searchTeam(college.name);
      
      if (team && team.record) {
        const recordParts = team.record.items?.[0]?.summary?.split('-') || [];
        if (recordParts.length === 2) {
          const wins = parseInt(recordParts[0]) || 0;
          const losses = parseInt(recordParts[1]) || 0;
          
          await db.update(colleges)
            .set({
              winsLastSeason: wins,
              lossesLastSeason: losses,
              statsLastUpdated: new Date(),
              statsSource: "espn_api",
            })
            .where(eq(colleges.id, college.id));
          
          console.log(`Updated ${college.name}: ${wins}-${losses}`);
          updated++;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
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

export { cfbApi, ncaaBasketballApi };
