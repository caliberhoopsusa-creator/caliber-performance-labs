import type { Game } from "./schema";

export type FootballArchetypeId =
  | "pocket_passer"
  | "dual_threat_qb"
  | "game_manager"
  | "power_back"
  | "speed_back"
  | "receiving_back"
  | "deep_threat"
  | "possession_receiver"
  | "playmaker_wr"
  | "blocking_te"
  | "receiving_te"
  | "run_stuffer"
  | "pass_rusher"
  | "run_stopper_lb"
  | "coverage_lb"
  | "blitzer"
  | "shutdown_corner"
  | "ballhawk"
  | "hard_hitter"
  | "accurate_kicker"
  | "power_leg"
  | "precision_punter";

export interface FootballArchetype {
  id: FootballArchetypeId;
  name: string;
  description: string;
  shortDescription: string;
  positions: string[];
}

export const FOOTBALL_ARCHETYPES: Record<FootballArchetypeId, FootballArchetype> = {
  pocket_passer: {
    id: "pocket_passer",
    name: "Pocket Passer",
    description: "You command the offense from the pocket. With elite accuracy and field vision, you pick apart defenses with surgical precision.",
    shortDescription: "Elite accuracy, reads defenses",
    positions: ["QB"],
  },
  dual_threat_qb: {
    id: "dual_threat_qb",
    name: "Dual-Threat QB",
    description: "You're a nightmare for defenses - equally dangerous with your arm and your legs. When plays break down, you make magic happen.",
    shortDescription: "Dangerous passer and runner",
    positions: ["QB"],
  },
  game_manager: {
    id: "game_manager",
    name: "Game Manager",
    description: "You don't make mistakes. Smart decisions, efficient throws, and protecting the football - you keep the offense on schedule.",
    shortDescription: "Smart, efficient, mistake-free",
    positions: ["QB"],
  },
  power_back: {
    id: "power_back",
    name: "Power Back",
    description: "You run through tackles, not around them. Short yardage? Goal line? They're giving you the ball.",
    shortDescription: "Punishing runner, hard to bring down",
    positions: ["RB"],
  },
  speed_back: {
    id: "speed_back",
    name: "Speed Back",
    description: "One cut and you're gone. Your explosive speed turns routine runs into touchdowns.",
    shortDescription: "Explosive speed, big-play threat",
    positions: ["RB"],
  },
  receiving_back: {
    id: "receiving_back",
    name: "Receiving Back",
    description: "You're a mismatch nightmare out of the backfield. Route running and soft hands make you a quarterback's best friend.",
    shortDescription: "Elite pass-catcher, mismatch creator",
    positions: ["RB"],
  },
  deep_threat: {
    id: "deep_threat",
    name: "Deep Threat",
    description: "You take the top off defenses. Safeties stay deep because one slip and you're gone for six.",
    shortDescription: "Burner, stretches the field",
    positions: ["WR"],
  },
  possession_receiver: {
    id: "possession_receiver",
    name: "Possession Receiver",
    description: "Third and long? You're the target. Reliable hands, crisp routes, and you always move the chains.",
    shortDescription: "Sure hands, chain mover",
    positions: ["WR", "TE"],
  },
  playmaker_wr: {
    id: "playmaker_wr",
    name: "Playmaker",
    description: "You turn short catches into long gains. After the catch, defenders just can't bring you down.",
    shortDescription: "YAC monster, game-changer",
    positions: ["WR", "TE"],
  },
  blocking_te: {
    id: "blocking_te",
    name: "Blocking TE",
    description: "You're an extra lineman who can catch. Your blocks spring big runs and protect your QB.",
    shortDescription: "Physical, opens running lanes",
    positions: ["TE", "OL"],
  },
  receiving_te: {
    id: "receiving_te",
    name: "Receiving TE",
    description: "Too big for corners, too fast for linebackers. You're a matchup nightmare in the red zone.",
    shortDescription: "Mismatch in the passing game",
    positions: ["TE"],
  },
  run_stuffer: {
    id: "run_stuffer",
    name: "Run Stuffer",
    description: "You eat double teams for breakfast. Nothing gets through your gap - you're an anchor in the trenches.",
    shortDescription: "Gap control, space eater",
    positions: ["DL"],
  },
  pass_rusher: {
    id: "pass_rusher",
    name: "Pass Rusher",
    description: "QBs hear your footsteps in their nightmares. Your first step and moves make you unblockable.",
    shortDescription: "Sack artist, disrupts passing game",
    positions: ["DL", "LB"],
  },
  run_stopper_lb: {
    id: "run_stopper_lb",
    name: "Downhill Linebacker",
    description: "You fill gaps and deliver hits. RBs know they're in for a long day when they see you.",
    shortDescription: "Physical tackler, stops the run",
    positions: ["LB"],
  },
  coverage_lb: {
    id: "coverage_lb",
    name: "Coverage Linebacker",
    description: "You can run with tight ends and cover backs out of the backfield. A modern, athletic defender.",
    shortDescription: "Athletic, locks down the middle",
    positions: ["LB", "DB"],
  },
  blitzer: {
    id: "blitzer",
    name: "Blitzer",
    description: "Offensive lines never know where you're coming from. You're a heat-seeking missile to the QB.",
    shortDescription: "Pressure packages, QB hunter",
    positions: ["LB", "DB"],
  },
  shutdown_corner: {
    id: "shutdown_corner",
    name: "Shutdown Corner",
    description: "Your side of the field is an island. QBs don't even look your way anymore.",
    shortDescription: "Lockdown coverage, erases receivers",
    positions: ["DB"],
  },
  ballhawk: {
    id: "ballhawk",
    name: "Ballhawk",
    description: "You're always around the football. Interceptions, deflections, forced fumbles - you create turnovers.",
    shortDescription: "Turnover machine, game-changer",
    positions: ["DB", "LB"],
  },
  hard_hitter: {
    id: "hard_hitter",
    name: "Hard Hitter",
    description: "Receivers hear footsteps over the middle. You make them pay for catching the ball.",
    shortDescription: "Physical enforcer, tone-setter",
    positions: ["DB", "LB"],
  },
  accurate_kicker: {
    id: "accurate_kicker",
    name: "Accurate Kicker",
    description: "From 50? No problem. Your precision puts points on the board when the team needs them most.",
    shortDescription: "Reliable, clutch performer",
    positions: ["K"],
  },
  power_leg: {
    id: "power_leg",
    name: "Power Leg",
    description: "Your kickoffs sail out of the end zone. When field position matters, you flip the field.",
    shortDescription: "Strong leg, booming kicks",
    positions: ["K", "P"],
  },
  precision_punter: {
    id: "precision_punter",
    name: "Precision Punter",
    description: "You pin teams inside the 10. Your punts are works of art that win the field position battle.",
    shortDescription: "Pin-point accuracy, field flipper",
    positions: ["P"],
  },
};

export interface FootballSeasonAverages {
  passYpg: number;
  passTdPg: number;
  compPct: number;
  intPg: number;
  rushYpg: number;
  rushTdPg: number;
  ypc: number;
  carries: number;
  recYpg: number;
  recTdPg: number;
  recPg: number;
  ypr: number;
  targets: number;
  tacklesPg: number;
  soloTacklesPg: number;
  sacksPg: number;
  intsPg: number;
  pdsPg: number;
  ffPg: number;
  fgPct: number;
  fgMadePg: number;
  puntAvg: number;
  gamesPlayed: number;
}

export function calculateFootballSeasonAverages(games: Game[]): FootballSeasonAverages | null {
  if (!games || games.length === 0) return null;
  const n = games.length;

  const totalPassAtt = games.reduce((acc, g) => acc + (g.passAttempts || 0), 0);
  const totalComp = games.reduce((acc, g) => acc + (g.completions || 0), 0);
  const totalCarries = games.reduce((acc, g) => acc + (g.carries || 0), 0);
  const totalRushYds = games.reduce((acc, g) => acc + (g.rushingYards || 0), 0);
  const totalRec = games.reduce((acc, g) => acc + (g.receptions || 0), 0);
  const totalRecYds = games.reduce((acc, g) => acc + (g.receivingYards || 0), 0);
  const totalFgAtt = games.reduce((acc, g) => acc + (g.fieldGoalsAttempted || 0), 0);
  const totalFgMade = games.reduce((acc, g) => acc + (g.fieldGoalsMade || 0), 0);
  const totalPunts = games.reduce((acc, g) => acc + (g.punts || 0), 0);
  const totalPuntYds = games.reduce((acc, g) => acc + (g.puntYards || 0), 0);

  return {
    passYpg: games.reduce((acc, g) => acc + (g.passingYards || 0), 0) / n,
    passTdPg: games.reduce((acc, g) => acc + (g.passingTouchdowns || 0), 0) / n,
    compPct: totalPassAtt > 0 ? (totalComp / totalPassAtt) * 100 : 0,
    intPg: games.reduce((acc, g) => acc + (g.interceptions || 0), 0) / n,
    rushYpg: totalRushYds / n,
    rushTdPg: games.reduce((acc, g) => acc + (g.rushingTouchdowns || 0), 0) / n,
    ypc: totalCarries > 0 ? totalRushYds / totalCarries : 0,
    carries: totalCarries / n,
    recYpg: totalRecYds / n,
    recTdPg: games.reduce((acc, g) => acc + (g.receivingTouchdowns || 0), 0) / n,
    recPg: totalRec / n,
    ypr: totalRec > 0 ? totalRecYds / totalRec : 0,
    targets: games.reduce((acc, g) => acc + (g.targets || 0), 0) / n,
    tacklesPg: games.reduce((acc, g) => acc + (g.tackles || 0), 0) / n,
    soloTacklesPg: games.reduce((acc, g) => acc + (g.soloTackles || 0), 0) / n,
    sacksPg: games.reduce((acc, g) => acc + (g.sacks || 0), 0) / n,
    intsPg: games.reduce((acc, g) => acc + (g.defensiveInterceptions || 0), 0) / n,
    pdsPg: games.reduce((acc, g) => acc + (g.passDeflections || 0), 0) / n,
    ffPg: games.reduce((acc, g) => acc + (g.forcedFumbles || 0), 0) / n,
    fgPct: totalFgAtt > 0 ? (totalFgMade / totalFgAtt) * 100 : 0,
    fgMadePg: totalFgMade / n,
    puntAvg: totalPunts > 0 ? totalPuntYds / totalPunts : 0,
    gamesPlayed: n,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalize(value: number, low: number, high: number): number {
  return clamp((value - low) / (high - low), 0, 1);
}

export interface FootballArchetypeResult {
  primary: FootballArchetypeId;
  secondary: FootballArchetypeId | null;
  scores: Record<FootballArchetypeId, number>;
}

export function calculateFootballArchetypeScores(
  stats: FootballSeasonAverages,
  position: string
): Record<FootballArchetypeId, number> {
  const scores: Record<FootballArchetypeId, number> = {
    pocket_passer: 0,
    dual_threat_qb: 0,
    game_manager: 0,
    power_back: 0,
    speed_back: 0,
    receiving_back: 0,
    deep_threat: 0,
    possession_receiver: 0,
    playmaker_wr: 0,
    blocking_te: 0,
    receiving_te: 0,
    run_stuffer: 0,
    pass_rusher: 0,
    run_stopper_lb: 0,
    coverage_lb: 0,
    blitzer: 0,
    shutdown_corner: 0,
    ballhawk: 0,
    hard_hitter: 0,
    accurate_kicker: 0,
    power_leg: 0,
    precision_punter: 0,
  };

  const primaryPosition = position?.split(',')[0]?.trim() || '';

  if (primaryPosition === 'QB') {
    scores.pocket_passer =
      normalize(stats.passYpg, 150, 350) * 0.35 +
      normalize(stats.compPct, 55, 72) * 0.35 +
      normalize(stats.passTdPg, 1, 3.5) * 0.2 +
      (1 - normalize(stats.intPg, 0, 2)) * 0.1;

    scores.dual_threat_qb =
      normalize(stats.passYpg, 100, 280) * 0.25 +
      normalize(stats.rushYpg, 20, 80) * 0.35 +
      normalize(stats.rushTdPg, 0.2, 1) * 0.2 +
      normalize(stats.passTdPg, 0.5, 2.5) * 0.2;

    scores.game_manager =
      normalize(stats.compPct, 60, 75) * 0.35 +
      (1 - normalize(stats.intPg, 0, 1.5)) * 0.35 +
      normalize(stats.passYpg, 120, 250) * 0.3;
  }

  if (primaryPosition === 'RB') {
    scores.power_back =
      normalize(stats.rushYpg, 50, 120) * 0.35 +
      normalize(stats.carries, 12, 25) * 0.3 +
      normalize(stats.rushTdPg, 0.3, 1.5) * 0.35;

    scores.speed_back =
      normalize(stats.ypc, 4, 6.5) * 0.45 +
      normalize(stats.rushYpg, 40, 100) * 0.3 +
      normalize(stats.rushTdPg, 0.2, 1) * 0.25;

    scores.receiving_back =
      normalize(stats.recYpg, 15, 50) * 0.35 +
      normalize(stats.recPg, 2, 6) * 0.35 +
      normalize(stats.recTdPg, 0.1, 0.5) * 0.3;
  }

  if (['WR', 'TE'].includes(primaryPosition)) {
    scores.deep_threat =
      normalize(stats.ypr, 12, 20) * 0.45 +
      normalize(stats.recTdPg, 0.3, 1) * 0.35 +
      normalize(stats.recYpg, 50, 120) * 0.2;

    scores.possession_receiver =
      normalize(stats.recPg, 4, 9) * 0.4 +
      (stats.targets > 0 ? normalize(stats.recPg / stats.targets, 0.6, 0.85) * 0.35 : 0.3) +
      normalize(stats.recYpg, 40, 90) * 0.25;

    scores.playmaker_wr =
      normalize(stats.recYpg, 60, 130) * 0.35 +
      normalize(stats.ypr, 10, 16) * 0.3 +
      normalize(stats.recTdPg, 0.3, 1) * 0.35;

    if (primaryPosition === 'TE') {
      scores.blocking_te = 0.5 + normalize(stats.rushYpg, 0, 20) * 0.3 + (stats.gamesPlayed > 0 ? 0.2 : 0);
      scores.receiving_te =
        normalize(stats.recYpg, 30, 80) * 0.4 +
        normalize(stats.recTdPg, 0.2, 0.8) * 0.35 +
        normalize(stats.recPg, 2, 5) * 0.25;
    }
  }

  if (primaryPosition === 'DL') {
    scores.run_stuffer =
      normalize(stats.tacklesPg, 3, 8) * 0.5 +
      normalize(stats.soloTacklesPg, 1.5, 5) * 0.5;

    scores.pass_rusher =
      normalize(stats.sacksPg, 0.3, 1.5) * 0.6 +
      normalize(stats.tacklesPg, 2, 6) * 0.4;
  }

  if (primaryPosition === 'LB') {
    scores.run_stopper_lb =
      normalize(stats.tacklesPg, 5, 12) * 0.5 +
      normalize(stats.soloTacklesPg, 3, 8) * 0.5;

    scores.coverage_lb =
      normalize(stats.intsPg, 0.05, 0.3) * 0.35 +
      normalize(stats.pdsPg, 0.2, 1) * 0.35 +
      normalize(stats.tacklesPg, 4, 10) * 0.3;

    scores.blitzer =
      normalize(stats.sacksPg, 0.2, 1) * 0.5 +
      normalize(stats.tacklesPg, 4, 10) * 0.3 +
      normalize(stats.ffPg, 0.05, 0.3) * 0.2;

    scores.pass_rusher =
      normalize(stats.sacksPg, 0.3, 1.2) * 0.6 +
      normalize(stats.tacklesPg, 3, 8) * 0.4;
  }

  if (primaryPosition === 'DB') {
    scores.shutdown_corner =
      normalize(stats.pdsPg, 0.5, 2) * 0.45 +
      normalize(stats.tacklesPg, 3, 7) * 0.35 +
      normalize(stats.intsPg, 0.1, 0.5) * 0.2;

    scores.ballhawk =
      normalize(stats.intsPg, 0.1, 0.5) * 0.45 +
      normalize(stats.pdsPg, 0.3, 1.5) * 0.3 +
      normalize(stats.ffPg, 0.05, 0.2) * 0.25;

    scores.hard_hitter =
      normalize(stats.tacklesPg, 4, 10) * 0.5 +
      normalize(stats.soloTacklesPg, 2, 6) * 0.3 +
      normalize(stats.ffPg, 0.05, 0.25) * 0.2;

    scores.blitzer =
      normalize(stats.sacksPg, 0.1, 0.5) * 0.5 +
      normalize(stats.tacklesPg, 3, 8) * 0.3 +
      normalize(stats.ffPg, 0.05, 0.2) * 0.2;
  }

  if (primaryPosition === 'K') {
    scores.accurate_kicker =
      normalize(stats.fgPct, 70, 95) * 0.6 +
      normalize(stats.fgMadePg, 0.5, 2) * 0.4;

    scores.power_leg =
      normalize(stats.fgMadePg, 0.8, 2.5) * 0.6 +
      normalize(stats.fgPct, 65, 88) * 0.4;
  }

  if (primaryPosition === 'P') {
    scores.precision_punter =
      normalize(stats.puntAvg, 38, 48) * 0.7 +
      (stats.gamesPlayed > 0 ? 0.3 : 0);

    scores.power_leg =
      normalize(stats.puntAvg, 40, 50) * 0.8 +
      (stats.gamesPlayed > 0 ? 0.2 : 0);
  }

  for (const [id, archetype] of Object.entries(FOOTBALL_ARCHETYPES)) {
    if (!archetype.positions.includes(primaryPosition)) {
      scores[id as FootballArchetypeId] *= 0.1;
    }
  }

  return scores;
}

export function getFootballPlayerArchetype(
  games: Game[],
  position: string
): FootballArchetypeResult | null {
  const stats = calculateFootballSeasonAverages(games);
  if (!stats || stats.gamesPlayed < 1) return null;

  const scores = calculateFootballArchetypeScores(stats, position);

  const sorted = Object.entries(scores)
    .filter(([, score]) => score > 0.01)
    .sort(([, a], [, b]) => b - a)
    .map(([id]) => id as FootballArchetypeId);

  if (sorted.length === 0) return null;

  const primary = sorted[0];
  const primaryScore = scores[primary];
  const secondaryScore = sorted[1] ? scores[sorted[1]] : 0;

  const secondary = secondaryScore >= primaryScore * 0.75 ? sorted[1] : null;

  return {
    primary,
    secondary,
    scores,
  };
}
