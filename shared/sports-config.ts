// Sports configuration - positions, grading weights, and display settings

export type Sport = 'basketball' | 'football';

// === BASKETBALL CONFIGURATION ===
export const BASKETBALL_POSITIONS = ['Guard', 'Wing', 'Big'] as const;
export type BasketballPosition = typeof BASKETBALL_POSITIONS[number];

// === FOOTBALL CONFIGURATION ===
export const FOOTBALL_POSITIONS = [
  'QB',   // Quarterback
  'RB',   // Running Back
  'WR',   // Wide Receiver
  'TE',   // Tight End
  'OL',   // Offensive Line (Center, Guard, Tackle)
  'DL',   // Defensive Line (DE, DT)
  'LB',   // Linebacker (ILB, OLB)
  'DB',   // Defensive Back (CB, Safety)
  'K',    // Kicker
  'P',    // Punter
] as const;
export type FootballPosition = typeof FOOTBALL_POSITIONS[number];

export const FOOTBALL_POSITION_LABELS: Record<FootballPosition, string> = {
  QB: 'Quarterback',
  RB: 'Running Back',
  WR: 'Wide Receiver',
  TE: 'Tight End',
  OL: 'Offensive Line',
  DL: 'Defensive Line',
  LB: 'Linebacker',
  DB: 'Defensive Back',
  K: 'Kicker',
  P: 'Punter',
};

// Position groups for stat display
export const FOOTBALL_POSITION_GROUPS = {
  offense: ['QB', 'RB', 'WR', 'TE', 'OL'] as FootballPosition[],
  defense: ['DL', 'LB', 'DB'] as FootballPosition[],
  specialTeams: ['K', 'P'] as FootballPosition[],
};

// Which stats are relevant for each position
export const FOOTBALL_POSITION_STATS: Record<FootballPosition, string[]> = {
  QB: ['completions', 'passAttempts', 'passingYards', 'passingTouchdowns', 'interceptions', 'sacksTaken', 'carries', 'rushingYards', 'rushingTouchdowns'],
  RB: ['carries', 'rushingYards', 'rushingTouchdowns', 'fumbles', 'receptions', 'receivingYards', 'receivingTouchdowns'],
  WR: ['receptions', 'targets', 'receivingYards', 'receivingTouchdowns', 'drops'],
  TE: ['receptions', 'targets', 'receivingYards', 'receivingTouchdowns', 'drops'],
  OL: ['pancakeBlocks', 'sacksAllowed', 'penalties'], // OL-specific blocking stats
  DL: ['tackles', 'soloTackles', 'sacks', 'forcedFumbles', 'fumbleRecoveries'],
  LB: ['tackles', 'soloTackles', 'sacks', 'defensiveInterceptions', 'passDeflections', 'forcedFumbles'],
  DB: ['tackles', 'defensiveInterceptions', 'passDeflections', 'forcedFumbles'],
  K: ['fieldGoalsMade', 'fieldGoalsAttempted', 'extraPointsMade', 'extraPointsAttempted'],
  P: ['punts', 'puntYards'],
};

// === SPORT DISPLAY CONFIGURATION ===
export const SPORT_CONFIG = {
  basketball: {
    icon: 'basketball',
    label: 'Basketball',
    color: '#FF6B35', // Orange
    positions: BASKETBALL_POSITIONS,
    statColumns: ['PPG', 'RPG', 'APG', 'SPG', 'BPG'],
    statKeys: ['points', 'rebounds', 'assists', 'steals', 'blocks'],
  },
  football: {
    icon: 'football',
    label: 'Football',
    color: '#8B4513', // Brown
    positions: FOOTBALL_POSITIONS,
    statColumns: ['YDS', 'TD', 'INT', 'TCK', 'SCK'],
    statKeys: ['totalYards', 'totalTouchdowns', 'turnovers', 'tackles', 'sacks'],
  },
} as const;

// === FOOTBALL GRADING WEIGHTS ===
// Position-weighted scoring for football grades

export interface FootballGradeWeights {
  // Positive impact stats
  passingYards?: number;
  passingTouchdowns?: number;
  completionPct?: number;
  rushingYards?: number;
  rushingTouchdowns?: number;
  yardsPerCarry?: number;
  receivingYards?: number;
  receivingTouchdowns?: number;
  catchRate?: number;
  tackles?: number;
  soloTackles?: number;
  sacks?: number;
  defensiveInterceptions?: number;
  passDeflections?: number;
  forcedFumbles?: number;
  fumbleRecoveries?: number;
  fieldGoalPct?: number;
  extraPointPct?: number;
  puntAvg?: number;
  // Negative impact stats
  interceptions?: number;
  fumbles?: number;
  sacksTaken?: number;
  drops?: number;
}

export const FOOTBALL_GRADE_WEIGHTS: Record<FootballPosition, FootballGradeWeights> = {
  QB: {
    passingYards: 0.02,
    passingTouchdowns: 8,
    completionPct: 0.5,
    rushingYards: 0.03,
    rushingTouchdowns: 6,
    interceptions: -10,
    sacksTaken: -2,
    fumbles: -8,
  },
  RB: {
    rushingYards: 0.05,
    rushingTouchdowns: 8,
    yardsPerCarry: 5,
    receivingYards: 0.03,
    receivingTouchdowns: 6,
    fumbles: -12,
  },
  WR: {
    receivingYards: 0.05,
    receivingTouchdowns: 8,
    catchRate: 0.4,
    drops: -6,
  },
  TE: {
    receivingYards: 0.04,
    receivingTouchdowns: 8,
    catchRate: 0.3,
    drops: -5,
  },
  OL: {
    // OL graded mainly on hustle and subjective rating
  },
  DL: {
    tackles: 2,
    soloTackles: 1,
    sacks: 10,
    forcedFumbles: 8,
    fumbleRecoveries: 6,
  },
  LB: {
    tackles: 1.5,
    soloTackles: 1,
    sacks: 8,
    defensiveInterceptions: 12,
    passDeflections: 4,
    forcedFumbles: 6,
  },
  DB: {
    tackles: 1,
    defensiveInterceptions: 15,
    passDeflections: 5,
    forcedFumbles: 6,
  },
  K: {
    fieldGoalPct: 1,
    extraPointPct: 0.5,
  },
  P: {
    puntAvg: 2,
  },
};

// === FOOTBALL SKILL BADGES ===
export const FOOTBALL_SKILL_BADGES = {
  // Offensive badges
  gunslinger: { name: 'Gunslinger', stat: 'passingTouchdowns', thresholds: { bronze: 10, silver: 25, gold: 50, hall_of_fame: 100 } },
  workhorse: { name: 'Workhorse', stat: 'rushingYards', thresholds: { bronze: 500, silver: 1500, gold: 3000, hall_of_fame: 6000 } },
  speedster: { name: 'Speedster', stat: 'receivingYards', thresholds: { bronze: 300, silver: 1000, gold: 2500, hall_of_fame: 5000 } },
  redZoneThreat: { name: 'Red Zone Threat', stat: 'totalTouchdowns', thresholds: { bronze: 5, silver: 15, gold: 30, hall_of_fame: 60 } },
  ironGrip: { name: 'Iron Grip', stat: 'receptions', thresholds: { bronze: 20, silver: 60, gold: 150, hall_of_fame: 300 } },
  // Defensive badges
  ballHawk: { name: 'Ball Hawk', stat: 'defensiveInterceptions', thresholds: { bronze: 2, silver: 5, gold: 12, hall_of_fame: 25 } },
  tacklingMachine: { name: 'Tackling Machine', stat: 'tackles', thresholds: { bronze: 30, silver: 100, gold: 250, hall_of_fame: 500 } },
  sacksLeader: { name: 'Sack Artist', stat: 'sacks', thresholds: { bronze: 3, silver: 10, gold: 25, hall_of_fame: 50 } },
  lockdown: { name: 'Lockdown', stat: 'passDeflections', thresholds: { bronze: 5, silver: 15, gold: 35, hall_of_fame: 70 } },
  turnoverForcer: { name: 'Turnover Forcer', stat: 'forcedFumbles', thresholds: { bronze: 2, silver: 6, gold: 15, hall_of_fame: 30 } },
  // Special teams badges
  clutchKicker: { name: 'Clutch Kicker', stat: 'fieldGoalsMade', thresholds: { bronze: 5, silver: 15, gold: 40, hall_of_fame: 80 } },
  pinPointPunter: { name: 'Pin Point Punter', stat: 'punts', thresholds: { bronze: 20, silver: 60, gold: 150, hall_of_fame: 300 } },
} as const;

// Helper to get positions for a sport
export function getPositionsForSport(sport: Sport): readonly string[] {
  return sport === 'basketball' ? BASKETBALL_POSITIONS : FOOTBALL_POSITIONS;
}

// Helper to check if a position is valid for a sport
export function isValidPosition(sport: Sport, position: string): boolean {
  const positions = getPositionsForSport(sport);
  return positions.includes(position as any);
}
