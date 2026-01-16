import type { Game } from "./schema";

export type ArchetypeId = 
  | "scoring_guard"
  | "floor_general"
  | "three_and_d"
  | "two_way_slasher"
  | "stretch_big"
  | "paint_beast"
  | "glue_guy"
  | "sharpshooter"
  | "lockdown_defender"
  | "all_around_star";

export interface Archetype {
  id: ArchetypeId;
  name: string;
  description: string;
  shortDescription: string;
  emoji: string;
  allowedPositions: ("Guard" | "Wing" | "Big")[];
}

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  scoring_guard: {
    id: "scoring_guard",
    name: "Scoring Guard",
    description: "You're the go-to bucket getter. When your team needs points, they look to you.",
    shortDescription: "High volume scorer with a bag of moves",
    emoji: "🎯",
    allowedPositions: ["Guard", "Wing"],
  },
  floor_general: {
    id: "floor_general",
    name: "Floor General",
    description: "You make everyone around you better with elite vision. The offense flows through you.",
    shortDescription: "Elite playmaker with court vision",
    emoji: "🧠",
    allowedPositions: ["Guard", "Wing"],
  },
  three_and_d: {
    id: "three_and_d",
    name: "3&D Wing",
    description: "You're the coach's dream - knock down shots and guard anyone on the floor.",
    shortDescription: "Sniper + lockdown on the perimeter",
    emoji: "🏹",
    allowedPositions: ["Guard", "Wing"],
  },
  two_way_slasher: {
    id: "two_way_slasher",
    name: "Two-Way Slasher",
    description: "You attack the rim relentlessly and make life hard for opponents on both ends.",
    shortDescription: "Attacks the basket, plays both ends",
    emoji: "⚡",
    allowedPositions: ["Guard", "Wing"],
  },
  stretch_big: {
    id: "stretch_big",
    name: "Stretch Big",
    description: "You're a modern big who can space the floor. Defenders don't know whether to sag or close out.",
    shortDescription: "Big with range - opens up the floor",
    emoji: "📏",
    allowedPositions: ["Wing", "Big"],
  },
  paint_beast: {
    id: "paint_beast",
    name: "Paint Beast",
    description: "You own the paint on both ends. Boards, blocks, and bully ball - that's your game.",
    shortDescription: "Dominates the paint, controls the glass",
    emoji: "🦬",
    allowedPositions: ["Big"],
  },
  glue_guy: {
    id: "glue_guy",
    name: "High-Motor Glue Guy",
    description: "You do all the little things that don't show up in the box score. Teams win because of you.",
    shortDescription: "Hustle king - does everything",
    emoji: "🔧",
    allowedPositions: ["Guard", "Wing", "Big"],
  },
  sharpshooter: {
    id: "sharpshooter",
    name: "Sharpshooter",
    description: "You're a pure sniper from deep. Defenders have to pick you up at halfcourt.",
    shortDescription: "Elite 3-point threat, lethal range",
    emoji: "🎯",
    allowedPositions: ["Guard", "Wing", "Big"],
  },
  lockdown_defender: {
    id: "lockdown_defender",
    name: "Lockdown Defender",
    description: "Offense wins games, but defense wins championships. You're the reason opponents struggle.",
    shortDescription: "Shuts down the best players",
    emoji: "🔒",
    allowedPositions: ["Guard", "Wing", "Big"],
  },
  all_around_star: {
    id: "all_around_star",
    name: "All-Around Star",
    description: "You can do it all at an elite level. The complete package - a true difference maker.",
    shortDescription: "Elite in every facet of the game",
    emoji: "⭐",
    allowedPositions: ["Guard", "Wing", "Big"],
  },
};

export interface ArchetypeResult {
  primary: ArchetypeId;
  secondary: ArchetypeId | null;
  scores: Record<ArchetypeId, number>;
}

export interface SeasonAverages {
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  tpg: number;
  fgPct: number;
  threePct: number;
  threeAttempts: number;
  ftPct: number;
  hustleScore: number;
  defenseRating: number;
  gamesPlayed: number;
}

export function calculateSeasonAverages(games: Game[]): SeasonAverages | null {
  if (!games || games.length === 0) return null;

  const n = games.length;
  
  const totalFgMade = games.reduce((acc, g) => acc + (g.fgMade || 0), 0);
  const totalFgAttempted = games.reduce((acc, g) => acc + (g.fgAttempted || 0), 0);
  const totalThreeMade = games.reduce((acc, g) => acc + (g.threeMade || 0), 0);
  const totalThreeAttempted = games.reduce((acc, g) => acc + (g.threeAttempted || 0), 0);
  const totalFtMade = games.reduce((acc, g) => acc + (g.ftMade || 0), 0);
  const totalFtAttempted = games.reduce((acc, g) => acc + (g.ftAttempted || 0), 0);

  return {
    ppg: games.reduce((acc, g) => acc + g.points, 0) / n,
    rpg: games.reduce((acc, g) => acc + g.rebounds, 0) / n,
    apg: games.reduce((acc, g) => acc + g.assists, 0) / n,
    spg: games.reduce((acc, g) => acc + g.steals, 0) / n,
    bpg: games.reduce((acc, g) => acc + g.blocks, 0) / n,
    tpg: games.reduce((acc, g) => acc + g.turnovers, 0) / n,
    fgPct: totalFgAttempted > 0 ? (totalFgMade / totalFgAttempted) * 100 : 0,
    threePct: totalThreeAttempted > 0 ? (totalThreeMade / totalThreeAttempted) * 100 : 0,
    threeAttempts: totalThreeAttempted / n,
    ftPct: totalFtAttempted > 0 ? (totalFtMade / totalFtAttempted) * 100 : 0,
    hustleScore: games.reduce((acc, g) => acc + (g.hustleScore || 50), 0) / n,
    defenseRating: games.reduce((acc, g) => acc + (g.defenseRating || 50), 0) / n,
    gamesPlayed: n,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalize(value: number, low: number, high: number): number {
  return clamp((value - low) / (high - low), 0, 1);
}

export function calculateArchetypeScores(
  stats: SeasonAverages,
  position: "Guard" | "Wing" | "Big"
): Record<ArchetypeId, number> {
  const scores: Record<ArchetypeId, number> = {
    scoring_guard: 0,
    floor_general: 0,
    three_and_d: 0,
    two_way_slasher: 0,
    stretch_big: 0,
    paint_beast: 0,
    glue_guy: 0,
    sharpshooter: 0,
    lockdown_defender: 0,
    all_around_star: 0,
  };

  // Scoring Guard: High PPG, good shooting %
  scores.scoring_guard =
    normalize(stats.ppg, 8, 25) * 0.5 +
    normalize(stats.fgPct, 35, 55) * 0.3 +
    normalize(stats.apg, 0, 6) * 0.2;

  // Floor General: High APG, low turnovers, decent scoring
  const astToRatio = stats.tpg > 0 ? stats.apg / stats.tpg : stats.apg * 2;
  scores.floor_general =
    normalize(stats.apg, 2, 10) * 0.45 +
    normalize(astToRatio, 1, 4) * 0.35 +
    normalize(stats.ppg, 5, 15) * 0.2;

  // 3&D Wing: Good 3P%, high defense rating
  scores.three_and_d =
    normalize(stats.threePct, 30, 45) * 0.35 +
    normalize(stats.defenseRating, 50, 90) * 0.35 +
    normalize(stats.threeAttempts, 2, 8) * 0.15 +
    normalize(stats.spg, 0.5, 2.5) * 0.15;

  // Two-Way Slasher: Balanced scoring and defense, attacks rim
  const rimScoring = stats.fgPct > stats.threePct ? 1 : 0.7;
  scores.two_way_slasher =
    normalize(stats.ppg, 8, 20) * 0.3 * rimScoring +
    normalize(stats.defenseRating, 50, 85) * 0.3 +
    normalize(stats.spg, 0.5, 2) * 0.2 +
    normalize(stats.fgPct, 40, 55) * 0.2;

  // Stretch Big: Big with good 3P shooting
  const isBigPosition = position === "Big" || position === "Wing";
  scores.stretch_big =
    (normalize(stats.threePct, 30, 42) * 0.4 +
    normalize(stats.threeAttempts, 2, 6) * 0.25 +
    normalize(stats.rpg, 3, 8) * 0.2 +
    normalize(stats.bpg, 0.3, 2) * 0.15) * (isBigPosition ? 1 : 0.5);

  // Paint Beast: High rebounds, blocks
  scores.paint_beast =
    normalize(stats.rpg, 5, 12) * 0.4 +
    normalize(stats.bpg, 0.5, 3) * 0.35 +
    normalize(stats.defenseRating, 50, 85) * 0.25;

  // High-Motor Glue Guy: High hustle, does everything
  const versatility = 
    (stats.ppg > 5 ? 1 : 0) +
    (stats.rpg > 3 ? 1 : 0) +
    (stats.apg > 2 ? 1 : 0) +
    (stats.spg > 0.5 ? 1 : 0) +
    (stats.bpg > 0.3 ? 1 : 0);
  scores.glue_guy =
    normalize(stats.hustleScore, 50, 90) * 0.4 +
    normalize(versatility, 2, 5) * 0.35 +
    normalize(stats.defenseRating, 50, 80) * 0.25;

  // Sharpshooter: Elite 3P%, volume shooter
  scores.sharpshooter =
    normalize(stats.threePct, 32, 48) * 0.5 +
    normalize(stats.threeAttempts, 3, 10) * 0.35 +
    normalize(stats.ftPct, 70, 90) * 0.15;

  // Lockdown Defender: Elite defense rating
  scores.lockdown_defender =
    normalize(stats.defenseRating, 60, 95) * 0.5 +
    normalize(stats.spg, 0.5, 2.5) * 0.25 +
    normalize(stats.bpg, 0.2, 2) * 0.15 +
    normalize(stats.hustleScore, 50, 85) * 0.1;

  // All-Around Star: Balanced excellence in all areas
  const allAroundScore = 
    normalize(stats.ppg, 10, 20) * 0.25 +
    normalize(stats.rpg, 3, 8) * 0.2 +
    normalize(stats.apg, 2, 6) * 0.2 +
    normalize(stats.defenseRating, 50, 80) * 0.2 +
    normalize(stats.fgPct, 40, 52) * 0.15;
  // Require well-rounded stats for all-around star
  const hasMinimums = stats.ppg >= 8 && stats.rpg >= 3 && stats.apg >= 2;
  scores.all_around_star = hasMinimums ? allAroundScore : allAroundScore * 0.5;

  // Apply position restrictions
  for (const [id, archetype] of Object.entries(ARCHETYPES)) {
    if (!archetype.allowedPositions.includes(position)) {
      scores[id as ArchetypeId] *= 0.3;
    }
  }

  return scores;
}

export function getPlayerArchetype(
  games: Game[],
  position: "Guard" | "Wing" | "Big"
): ArchetypeResult | null {
  const stats = calculateSeasonAverages(games);
  if (!stats || stats.gamesPlayed < 1) return null;

  const scores = calculateArchetypeScores(stats, position);
  
  // Sort archetypes by score
  const sorted = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .map(([id]) => id as ArchetypeId);

  const primary = sorted[0];
  const primaryScore = scores[primary];
  const secondaryScore = scores[sorted[1]];
  
  // Only show secondary if it's close (within 20% of primary)
  const secondary = secondaryScore >= primaryScore * 0.8 ? sorted[1] : null;

  return {
    primary,
    secondary,
    scores,
  };
}
