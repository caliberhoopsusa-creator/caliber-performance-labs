// Sports configuration - positions, grading weights, and display settings

export type Sport = 'basketball';

// === BASKETBALL CONFIGURATION ===
/**
 * The five real positions (migrated 2026-09-25).
 *
 * Previously Guard / Wing / Big. Players do not describe themselves in three
 * broad buckets, and the card says "SG", so the stored value is now the one a
 * player would actually claim.
 */
export const BASKETBALL_POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
export type BasketballPosition = typeof BASKETBALL_POSITIONS[number];

export const POSITION_LABELS: Record<BasketballPosition, string> = {
  PG: 'Point guard',
  SG: 'Shooting guard',
  SF: 'Small forward',
  PF: 'Power forward',
  C: 'Center',
};

/**
 * The three broad groups the five collapse into.
 *
 * Kept deliberately, for ONE job: cohorting. Rarity ranks a player against
 * their class year and position, and splitting three buckets into five makes
 * every cohort smaller. On a platform this size that would push tiers further
 * out of reach for no gain in fairness, since a PG and an SG are genuinely
 * comparable. So we STORE and DISPLAY the five, and RANK on the three.
 *
 * It is not a fallback taxonomy and nothing should be persisted in these terms.
 */
export const POSITION_GROUPS = ['Guard', 'Wing', 'Big'] as const;
export type PositionGroup = typeof POSITION_GROUPS[number];

const GROUP_OF: Record<BasketballPosition, PositionGroup> = {
  PG: 'Guard',
  SG: 'Guard',
  SF: 'Wing',
  PF: 'Big',
  C: 'Big',
};

/**
 * Legacy Guard / Wing / Big values, for reading rows written before the
 * migration. Widening a broad value to a specific one is a guess, so each maps
 * to the middle of its old bucket and is recorded as such in the migration
 * script. Do not use this to write new data.
 */
const LEGACY_TO_POSITION: Record<string, BasketballPosition> = {
  guard: 'SG',
  wing: 'SF',
  big: 'PF',
};

/** Normalises any stored value, legacy or current, to a real position. */
export function normalizePosition(value: string | null | undefined): BasketballPosition | null {
  if (!value) return null;
  const raw = value.split(',')[0]!.trim();
  const upper = raw.toUpperCase();
  if ((BASKETBALL_POSITIONS as readonly string[]).includes(upper)) {
    return upper as BasketballPosition;
  }
  return LEGACY_TO_POSITION[raw.toLowerCase()] ?? null;
}

/**
 * Validate and normalise a comma separated position string.
 *
 * Accepts the five real positions and the three legacy group names, so a
 * client that has not caught up still works, and returns the normalised form
 * so the column only ever gains the five going forward.
 *
 * Both write paths for a position share this. They previously each carried
 * their own hardcoded ['Guard', 'Wing', 'Big'] list, which is why the move to
 * five positions left the API rejecting every real position while the rest of
 * the codebase had already moved on.
 */
export function normalizePositionList(
  value: string,
): { positions: BasketballPosition[]; invalid: string[] } {
  const parts = value.split(',').map((p) => p.trim()).filter(Boolean);
  const positions: BasketballPosition[] = [];
  const invalid: string[] = [];

  for (const part of parts) {
    const normalized = normalizePosition(part);
    if (normalized) positions.push(normalized);
    else invalid.push(part);
  }

  return { positions, invalid };
}

/** The cohort group for a stored position. Ranking only. */
export function positionGroup(value: string | null | undefined): PositionGroup | null {
  const position = normalizePosition(value);
  return position ? GROUP_OF[position] : null;
}

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
