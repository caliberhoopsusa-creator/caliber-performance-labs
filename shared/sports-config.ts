// Sports configuration - positions, grading weights, and display settings

export type Sport = 'basketball';

// === BASKETBALL CONFIGURATION ===
export const BASKETBALL_POSITIONS = ['Guard', 'Wing', 'Big'] as const;
export type BasketballPosition = typeof BASKETBALL_POSITIONS[number];

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
} as const;

// Helper to get positions for a sport
export function getPositionsForSport(sport: string): readonly string[] {
  return BASKETBALL_POSITIONS;
}

// Helper to check if a position is valid for a sport
export function isValidPosition(sport: string, position: string): boolean {
  return BASKETBALL_POSITIONS.includes(position as BasketballPosition);
}
