import { Sport, BASKETBALL_POSITIONS, FOOTBALL_POSITIONS, BasketballPosition, FootballPosition } from './sports-config';

export interface SubScores {
  production: number;
  efficiency: number;
  impact: number;
  defense: number;
  athletic: number;
  intangibles: number;
}

export interface ContextMultipliers {
  opponentStrength: number;
  gameImportance: number;
  roleMultiplier: number;
  recencyWeight: number;
}

export interface AIRatingResult {
  overallRating: number;
  subScores: SubScores;
  contextMultipliers: ContextMultipliers;
  percentileRank: number;
  consistencyIndex: number;
  explanation: string[];
  ratingBand: string;
  confidence: number;
}

export interface ProjectionResult {
  trajectoryScore: number;
  translationScore: number;
  upsideScore: number;
  riskScore: number;
  likelyRating: number;
  ceilingRating: number;
  floorRating: number;
  levelMapping: string;
  confidencePercent: number;
  explanations: string[];
}

export interface GameStats {
  id: number;
  date: string;
  opponent: string;
  result?: string;
  minutes?: number;
  points?: number;
  rebounds?: number;
  assists?: number;
  steals?: number;
  blocks?: number;
  turnovers?: number;
  fouls?: number;
  fgMade?: number;
  fgAttempted?: number;
  threeMade?: number;
  threeAttempted?: number;
  ftMade?: number;
  ftAttempted?: number;
  offensiveRebounds?: number;
  defensiveRebounds?: number;
  hustleScore?: number;
  defenseRating?: number;
  plusMinus?: number;
  per?: string;
  completions?: number;
  passAttempts?: number;
  passingYards?: number;
  passingTouchdowns?: number;
  interceptions?: number;
  sacksTaken?: number;
  carries?: number;
  rushingYards?: number;
  rushingTouchdowns?: number;
  fumbles?: number;
  receptions?: number;
  targets?: number;
  receivingYards?: number;
  receivingTouchdowns?: number;
  drops?: number;
  tackles?: number;
  soloTackles?: number;
  sacks?: number;
  defensiveInterceptions?: number;
  passDeflections?: number;
  forcedFumbles?: number;
  fumbleRecoveries?: number;
  fieldGoalsMade?: number;
  fieldGoalsAttempted?: number;
  extraPointsMade?: number;
  extraPointsAttempted?: number;
  punts?: number;
  puntYards?: number;
  pancakeBlocks?: number;
  sacksAllowed?: number;
  penalties?: number;
  grade?: string;
}

export interface PlayerMetrics {
  height?: string;
  fortyYardDash?: number;
  verticalJump?: number;
  broadJump?: number;
  threeConeDrill?: number;
  benchPressReps?: number;
  wingspan?: number;
  physicality?: number;
  footballIQ?: number;
  mentalToughness?: number;
  coachability?: number;
  leadership?: number;
  workEthic?: number;
  competitiveness?: number;
  clutchPerformance?: number;
}

export interface PeerStats {
  avgProduction: number;
  stdProduction: number;
  avgEfficiency: number;
  stdEfficiency: number;
  avgImpact: number;
  stdImpact: number;
  avgDefense: number;
  stdDefense: number;
  avgAthletic: number;
  stdAthletic: number;
  avgIntangibles: number;
  stdIntangibles: number;
  sampleSize: number;
}

const SUB_SCORE_WEIGHTS = {
  production: 0.22,
  efficiency: 0.18,
  impact: 0.22,
  defense: 0.18,
  athletic: 0.12,
  intangibles: 0.08,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function percentileToScore(value: number, mean: number, std: number): number {
  if (std === 0) return 50;
  const zScore = (value - mean) / std;
  const percentile = (1 + Math.tanh(zScore * 0.7)) * 50;
  return clamp(percentile, 0, 100);
}

function gradeToNumeric(grade: string): number {
  const gradeMap: Record<string, number> = {
    'A+': 97, 'A': 93, 'A-': 90,
    'B+': 87, 'B': 83, 'B-': 80,
    'C+': 77, 'C': 73, 'C-': 70,
    'D+': 67, 'D': 63, 'D-': 60,
    'F': 50
  };
  return gradeMap[grade] || 50;
}

function calculateConsistencyIndex(games: GameStats[]): number {
  if (games.length < 3) return 50;
  
  const gameScores = games.map(g => {
    const grade = g.grade || 'C';
    return gradeToNumeric(grade);
  });
  
  const mean = gameScores.reduce((a, b) => a + b, 0) / gameScores.length;
  const variance = gameScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / gameScores.length;
  const stdDev = Math.sqrt(variance);
  
  const maxStd = 20;
  const consistencyRaw = 100 - (stdDev / maxStd) * 100;
  return clamp(consistencyRaw, 0, 100);
}

function calculateRecencyWeights(games: GameStats[]): number[] {
  const weights: number[] = [];
  const n = games.length;
  
  for (let i = 0; i < n; i++) {
    const recency = (n - i) / n;
    const weight = 0.5 + (recency * 0.5);
    weights.push(weight);
  }
  
  return weights;
}

export function calculateBasketballSubScores(
  games: GameStats[],
  position: BasketballPosition,
  metrics?: PlayerMetrics
): SubScores {
  if (games.length === 0) {
    return { production: 50, efficiency: 50, impact: 50, defense: 50, athletic: 50, intangibles: 50 };
  }

  const recencyWeights = calculateRecencyWeights(games);
  const totalWeight = recencyWeights.reduce((a, b) => a + b, 0);
  
  let production = 0;
  let efficiency = 0;
  let impact = 0;
  let defense = 0;
  
  games.forEach((game, idx) => {
    const w = recencyWeights[idx] / totalWeight;
    const minutes = game.minutes || 1;
    const per36 = 36 / Math.max(minutes, 1);
    
    const pts = (game.points || 0) * per36;
    const reb = (game.rebounds || 0) * per36;
    const ast = (game.assists || 0) * per36;
    const stl = (game.steals || 0) * per36;
    const blk = (game.blocks || 0) * per36;
    const tov = (game.turnovers || 0) * per36;
    
    let positionWeights = { pts: 0.5, reb: 0.15, ast: 0.25, stl: 0.05, blk: 0.05 };
    if (position === 'Wing') {
      positionWeights = { pts: 0.4, reb: 0.2, ast: 0.2, stl: 0.1, blk: 0.1 };
    } else if (position === 'Big') {
      positionWeights = { pts: 0.3, reb: 0.35, ast: 0.1, stl: 0.1, blk: 0.15 };
    }
    
    const prodScore = (
      (pts / 25) * positionWeights.pts +
      (reb / 10) * positionWeights.reb +
      (ast / 8) * positionWeights.ast +
      (stl / 3) * positionWeights.stl +
      (blk / 3) * positionWeights.blk
    ) * 100;
    
    production += prodScore * w;
    
    const fgPct = game.fgAttempted ? (game.fgMade || 0) / game.fgAttempted : 0;
    const threePct = game.threeAttempted ? (game.threeMade || 0) / game.threeAttempted : 0;
    const ftPct = game.ftAttempted ? (game.ftMade || 0) / game.ftAttempted : 0;
    const ts = game.fgAttempted || game.ftAttempted 
      ? (game.points || 0) / (2 * ((game.fgAttempted || 0) + 0.44 * (game.ftAttempted || 0))) 
      : 0;
    const astToTov = tov > 0 ? (ast / tov) : ast;
    
    const effScore = (
      (ts / 0.6) * 0.4 +
      (fgPct / 0.5) * 0.2 +
      (threePct / 0.4) * 0.15 +
      (ftPct / 0.8) * 0.1 +
      Math.min(astToTov / 3, 1) * 0.15
    ) * 100;
    
    efficiency += effScore * w;
    
    const pm = game.plusMinus || 0;
    const perVal = parseFloat(game.per || '0');
    const bigPlays = stl + blk + (ast > 8 ? 1 : 0);
    
    const impScore = (
      ((pm + 20) / 40) * 0.4 +
      (perVal / 25) * 0.3 +
      (bigPlays / 5) * 0.3
    ) * 100;
    
    impact += impScore * w;
    
    const defRating = game.defenseRating || 50;
    const defStats = (stl * 3 + blk * 3 + (game.defensiveRebounds || 0) * 0.5);
    
    const defScore = (
      (defRating / 100) * 0.5 +
      Math.min(defStats / 10, 1) * 0.5
    ) * 100;
    
    defense += defScore * w;
  });

  let athletic = 50;
  if (metrics) {
    let athleticScore = 0;
    let athleticCount = 0;
    
    if (metrics.verticalJump) {
      athleticScore += (metrics.verticalJump / 45) * 100;
      athleticCount++;
    }
    if (metrics.fortyYardDash) {
      athleticScore += ((5.5 - metrics.fortyYardDash) / 1.2) * 100;
      athleticCount++;
    }
    if (metrics.height) {
      const heightInches = parseHeightToInches(metrics.height);
      const positionAvg = position === 'Guard' ? 74 : position === 'Wing' ? 78 : 82;
      athleticScore += 50 + ((heightInches - positionAvg) / 6) * 25;
      athleticCount++;
    }
    
    if (athleticCount > 0) {
      athletic = clamp(athleticScore / athleticCount, 0, 100);
    }
  }

  const consistencyIndex = calculateConsistencyIndex(games);
  let intangibles = consistencyIndex * 0.6;
  
  if (metrics) {
    if (metrics.clutchPerformance) intangibles += metrics.clutchPerformance * 1.5;
    if (metrics.coachability) intangibles += metrics.coachability * 1;
    if (metrics.workEthic) intangibles += metrics.workEthic * 0.5;
  } else {
    intangibles += 20;
  }
  
  intangibles = clamp(intangibles, 0, 100);

  return {
    production: clamp(production, 0, 100),
    efficiency: clamp(efficiency, 0, 100),
    impact: clamp(impact, 0, 100),
    defense: clamp(defense, 0, 100),
    athletic: clamp(athletic, 0, 100),
    intangibles: clamp(intangibles, 0, 100),
  };
}

export function calculateFootballSubScores(
  games: GameStats[],
  position: FootballPosition,
  metrics?: PlayerMetrics
): SubScores {
  if (games.length === 0) {
    return { production: 50, efficiency: 50, impact: 50, defense: 50, athletic: 50, intangibles: 50 };
  }

  const recencyWeights = calculateRecencyWeights(games);
  const totalWeight = recencyWeights.reduce((a, b) => a + b, 0);
  
  let production = 0;
  let efficiency = 0;
  let impact = 0;
  let defense = 0;

  games.forEach((game, idx) => {
    const w = recencyWeights[idx] / totalWeight;
    
    let prodScore = 50;
    let effScore = 50;
    let impScore = 50;
    let defScore = 50;
    
    switch (position) {
      case 'QB': {
        const passYards = game.passingYards || 0;
        const passTDs = game.passingTouchdowns || 0;
        const rushYards = game.rushingYards || 0;
        const rushTDs = game.rushingTouchdowns || 0;
        const ints = game.interceptions || 0;
        const completions = game.completions || 0;
        const attempts = game.passAttempts || 1;
        const sacks = game.sacksTaken || 0;
        
        prodScore = (
          (passYards / 350) * 0.4 +
          (passTDs / 4) * 0.3 +
          (rushYards / 100) * 0.15 +
          (rushTDs / 2) * 0.15
        ) * 100;
        
        const compPct = completions / Math.max(attempts, 1);
        const passerRating = (
          ((compPct - 0.3) * 5) +
          ((passYards / Math.max(attempts, 1) - 3) * 0.25) +
          ((passTDs / Math.max(attempts, 1)) * 20) -
          ((ints / Math.max(attempts, 1)) * 25)
        ) / 6;
        
        effScore = clamp(passerRating * 0.6 + (1 - sacks / 10) * 40, 0, 100);
        
        impScore = (
          (passTDs + rushTDs) / 5 * 50 +
          (passYards > 300 ? 25 : passYards / 12) +
          Math.max(0, 25 - ints * 10)
        );
        
        defScore = 50;
        break;
      }
      
      case 'RB': {
        const rushYards = game.rushingYards || 0;
        const rushTDs = game.rushingTouchdowns || 0;
        const carries = game.carries || 1;
        const recYards = game.receivingYards || 0;
        const recTDs = game.receivingTouchdowns || 0;
        const fumbles = game.fumbles || 0;
        
        prodScore = (
          (rushYards / 150) * 0.5 +
          (rushTDs / 2) * 0.25 +
          (recYards / 50) * 0.15 +
          (recTDs / 1) * 0.1
        ) * 100;
        
        const ypc = rushYards / Math.max(carries, 1);
        effScore = (
          (ypc / 6) * 0.6 +
          (1 - fumbles * 0.25) * 0.4
        ) * 100;
        
        impScore = (rushTDs + recTDs) / 3 * 50 + (rushYards > 100 ? 25 : rushYards / 4) + 25;
        defScore = 50;
        break;
      }
      
      case 'WR':
      case 'TE': {
        const recYards = game.receivingYards || 0;
        const recTDs = game.receivingTouchdowns || 0;
        const receptions = game.receptions || 0;
        const targets = game.targets || 1;
        const drops = game.drops || 0;
        
        const yardsMultiplier = position === 'WR' ? 1 : 0.75;
        prodScore = (
          (recYards / (120 * yardsMultiplier)) * 0.5 +
          (recTDs / 2) * 0.3 +
          (receptions / 8) * 0.2
        ) * 100;
        
        const catchRate = receptions / Math.max(targets, 1);
        effScore = (
          (catchRate / 0.75) * 0.6 +
          (1 - drops * 0.15) * 0.4
        ) * 100;
        
        impScore = (recTDs / 2) * 50 + (recYards > 100 ? 25 : recYards / 4) + 25;
        defScore = 50;
        break;
      }
      
      case 'OL': {
        const pancakes = game.pancakeBlocks || 0;
        const sacksAllowed = game.sacksAllowed || 0;
        const penalties = game.penalties || 0;
        
        prodScore = (pancakes / 5) * 100;
        effScore = Math.max(0, 100 - sacksAllowed * 25 - penalties * 15);
        impScore = (pancakes / 3) * 50 + Math.max(0, 50 - sacksAllowed * 20);
        defScore = 50;
        break;
      }
      
      case 'DL': {
        const tackles = game.tackles || 0;
        const sacks = game.sacks || 0;
        const ff = game.forcedFumbles || 0;
        const fr = game.fumbleRecoveries || 0;
        
        prodScore = (
          (tackles / 8) * 0.3 +
          (sacks / 2) * 0.4 +
          ((ff + fr) / 2) * 0.3
        ) * 100;
        
        const soloTackleRate = (game.soloTackles || 0) / Math.max(tackles, 1);
        effScore = soloTackleRate * 100;
        impScore = (sacks / 2) * 50 + ((ff + fr) / 2) * 30 + tackles / 8 * 20;
        defScore = prodScore;
        break;
      }
      
      case 'LB': {
        const tackles = game.tackles || 0;
        const sacks = game.sacks || 0;
        const ints = game.defensiveInterceptions || 0;
        const pds = game.passDeflections || 0;
        const ff = game.forcedFumbles || 0;
        
        prodScore = (
          (tackles / 12) * 0.4 +
          (sacks / 1.5) * 0.2 +
          (ints / 1) * 0.2 +
          (pds / 2) * 0.1 +
          (ff / 1) * 0.1
        ) * 100;
        
        const soloRate = (game.soloTackles || 0) / Math.max(tackles, 1);
        effScore = (soloRate * 0.5 + 0.5) * 100;
        impScore = tackles / 12 * 30 + sacks * 20 + ints * 30 + ff * 20;
        defScore = prodScore;
        break;
      }
      
      case 'DB': {
        const tackles = game.tackles || 0;
        const ints = game.defensiveInterceptions || 0;
        const pds = game.passDeflections || 0;
        const ff = game.forcedFumbles || 0;
        
        prodScore = (
          (tackles / 8) * 0.2 +
          (ints / 1) * 0.4 +
          (pds / 3) * 0.3 +
          (ff / 1) * 0.1
        ) * 100;
        
        effScore = (ints + pds * 0.3) / 4 * 100;
        impScore = ints * 40 + pds * 15 + tackles / 8 * 20 + ff * 25;
        defScore = prodScore;
        break;
      }
      
      case 'K': {
        const fgMade = game.fieldGoalsMade || 0;
        const fgAtt = game.fieldGoalsAttempted || 1;
        const xpMade = game.extraPointsMade || 0;
        const xpAtt = game.extraPointsAttempted || 0;
        
        const fgPct = fgMade / Math.max(fgAtt, 1);
        const xpPct = xpAtt > 0 ? xpMade / xpAtt : 1;
        
        prodScore = (fgMade * 3 + xpMade) / 15 * 100;
        effScore = (fgPct * 0.7 + xpPct * 0.3) * 100;
        impScore = fgMade * 20 + xpMade * 5;
        defScore = 50;
        break;
      }
      
      case 'P': {
        const punts = game.punts || 0;
        const puntYards = game.puntYards || 0;
        const avgPunt = punts > 0 ? puntYards / punts : 0;
        
        prodScore = (punts / 6) * 50 + (avgPunt / 50) * 50;
        effScore = (avgPunt / 50) * 100;
        impScore = avgPunt > 45 ? 75 : (avgPunt / 45) * 75;
        defScore = 50;
        break;
      }
    }
    
    production += clamp(prodScore, 0, 100) * w;
    efficiency += clamp(effScore, 0, 100) * w;
    impact += clamp(impScore, 0, 100) * w;
    defense += clamp(defScore, 0, 100) * w;
  });

  let athletic = 50;
  if (metrics) {
    let athleticScore = 0;
    let athleticCount = 0;
    
    if (metrics.fortyYardDash) {
      const speedScore = ((5.5 - metrics.fortyYardDash) / 1.2) * 100;
      athleticScore += clamp(speedScore, 0, 100);
      athleticCount++;
    }
    if (metrics.verticalJump) {
      athleticScore += (metrics.verticalJump / 45) * 100;
      athleticCount++;
    }
    if (metrics.broadJump) {
      athleticScore += (metrics.broadJump / 140) * 100;
      athleticCount++;
    }
    if (metrics.threeConeDrill) {
      const agilityScore = ((8.0 - metrics.threeConeDrill) / 1.5) * 100;
      athleticScore += clamp(agilityScore, 0, 100);
      athleticCount++;
    }
    if (metrics.benchPressReps) {
      athleticScore += (metrics.benchPressReps / 35) * 100;
      athleticCount++;
    }
    if (metrics.physicality) {
      athleticScore += metrics.physicality * 10;
      athleticCount++;
    }
    
    if (athleticCount > 0) {
      athletic = clamp(athleticScore / athleticCount, 0, 100);
    }
  }

  const consistencyIndex = calculateConsistencyIndex(games);
  let intangibles = consistencyIndex * 0.5;
  
  if (metrics) {
    if (metrics.clutchPerformance) intangibles += metrics.clutchPerformance * 1.5;
    if (metrics.footballIQ) intangibles += metrics.footballIQ * 1.2;
    if (metrics.coachability) intangibles += metrics.coachability * 0.8;
    if (metrics.mentalToughness) intangibles += metrics.mentalToughness * 0.8;
    if (metrics.leadership) intangibles += metrics.leadership * 0.7;
  } else {
    intangibles += 25;
  }
  
  intangibles = clamp(intangibles, 0, 100);

  return {
    production: clamp(production, 0, 100),
    efficiency: clamp(efficiency, 0, 100),
    impact: clamp(impact, 0, 100),
    defense: clamp(defense, 0, 100),
    athletic: clamp(athletic, 0, 100),
    intangibles: clamp(intangibles, 0, 100),
  };
}

function parseHeightToInches(height: string): number {
  const match = height.match(/(\d+)'(\d+)/);
  if (match) {
    return parseInt(match[1]) * 12 + parseInt(match[2]);
  }
  return 72;
}

export function normalizeToPercentile(
  subScores: SubScores,
  peerStats?: PeerStats
): SubScores {
  if (!peerStats || peerStats.sampleSize < 10) {
    return subScores;
  }
  
  return {
    production: percentileToScore(subScores.production, peerStats.avgProduction, peerStats.stdProduction),
    efficiency: percentileToScore(subScores.efficiency, peerStats.avgEfficiency, peerStats.stdEfficiency),
    impact: percentileToScore(subScores.impact, peerStats.avgImpact, peerStats.stdImpact),
    defense: percentileToScore(subScores.defense, peerStats.avgDefense, peerStats.stdDefense),
    athletic: percentileToScore(subScores.athletic, peerStats.avgAthletic, peerStats.stdAthletic),
    intangibles: percentileToScore(subScores.intangibles, peerStats.avgIntangibles, peerStats.stdIntangibles),
  };
}

export function calculateContextMultipliers(
  games: GameStats[],
  rosterRole: string = 'rotation'
): ContextMultipliers {
  let opponentStrength = 1.0;
  if (games.length > 0) {
    const winCount = games.filter(g => g.result?.startsWith('W')).length;
    const winRate = winCount / games.length;
    opponentStrength = 0.9 + (winRate * 0.2);
  }
  
  const gameImportance = 1.0;
  
  const roleMultipliers: Record<string, number> = {
    starter: 1.05,
    rotation: 1.0,
    bench: 0.95,
    development: 0.90,
  };
  const roleMultiplier = roleMultipliers[rosterRole] || 1.0;
  
  const recencyWeight = 1.0;
  
  return {
    opponentStrength: clamp(opponentStrength, 0.9, 1.1),
    gameImportance: clamp(gameImportance, 0.95, 1.05),
    roleMultiplier: clamp(roleMultiplier, 0.9, 1.1),
    recencyWeight: recencyWeight,
  };
}

export function calculateOverallRating(
  subScores: SubScores,
  contextMultipliers: ContextMultipliers
): number {
  const rawOverall = 
    subScores.production * SUB_SCORE_WEIGHTS.production +
    subScores.efficiency * SUB_SCORE_WEIGHTS.efficiency +
    subScores.impact * SUB_SCORE_WEIGHTS.impact +
    subScores.defense * SUB_SCORE_WEIGHTS.defense +
    subScores.athletic * SUB_SCORE_WEIGHTS.athletic +
    subScores.intangibles * SUB_SCORE_WEIGHTS.intangibles;
  
  const combinedMultiplier = 
    contextMultipliers.opponentStrength *
    contextMultipliers.gameImportance *
    contextMultipliers.roleMultiplier;
  
  return clamp(Math.round(rawOverall * combinedMultiplier), 0, 100);
}

export function getRatingBand(rating: number): string {
  if (rating >= 90) return 'Pro Track / High-Major D1';
  if (rating >= 80) return 'Mid-Major D1';
  if (rating >= 70) return 'D2 / NAIA High Level';
  if (rating >= 60) return 'Strong HS Varsity';
  return 'Developing';
}

export function generateExplanations(
  subScores: SubScores,
  games: GameStats[],
  sport: Sport
): string[] {
  const explanations: string[] = [];
  
  const sortedScores = Object.entries(subScores)
    .sort(([, a], [, b]) => b - a);
  
  const [topCategory, topScore] = sortedScores[0];
  const [secondCategory, secondScore] = sortedScores[1];
  const [worstCategory, worstScore] = sortedScores[sortedScores.length - 1];
  
  if (topScore >= 75) {
    explanations.push(`Elite ${formatCategory(topCategory)} (${Math.round(topScore)}th percentile)`);
  } else if (topScore >= 60) {
    explanations.push(`Strong ${formatCategory(topCategory)} performance`);
  }
  
  if (secondScore >= 70) {
    explanations.push(`Above-average ${formatCategory(secondCategory)}`);
  }
  
  if (worstScore < 50) {
    explanations.push(`Area for growth: ${formatCategory(worstCategory)}`);
  }
  
  const consistencyIndex = calculateConsistencyIndex(games);
  if (consistencyIndex >= 80) {
    explanations.push('Highly consistent performer');
  } else if (consistencyIndex < 50) {
    explanations.push('Performance varies game-to-game');
  }
  
  if (games.length >= 5) {
    const recentGames = games.slice(0, 5);
    const olderGames = games.slice(5, 10);
    if (olderGames.length > 0) {
      const recentAvg = recentGames.reduce((sum, g) => sum + gradeToNumeric(g.grade || 'C'), 0) / recentGames.length;
      const olderAvg = olderGames.reduce((sum, g) => sum + gradeToNumeric(g.grade || 'C'), 0) / olderGames.length;
      const trend = recentAvg - olderAvg;
      
      if (trend > 5) {
        explanations.push('Trending upward in recent games');
      } else if (trend < -5) {
        explanations.push('Recent performance below average');
      }
    }
  }
  
  return explanations;
}

function formatCategory(category: string): string {
  const labels: Record<string, string> = {
    production: 'Production',
    efficiency: 'Efficiency',
    impact: 'Impact',
    defense: 'Two-Way Play',
    athletic: 'Athleticism',
    intangibles: 'Intangibles',
  };
  return labels[category] || category;
}

export function calculateAIRating(
  games: GameStats[],
  sport: Sport,
  position: string,
  rosterRole: string = 'rotation',
  metrics?: PlayerMetrics,
  peerStats?: PeerStats
): AIRatingResult {
  let subScores: SubScores;
  
  if (sport === 'basketball') {
    subScores = calculateBasketballSubScores(games, position as BasketballPosition, metrics);
  } else {
    subScores = calculateFootballSubScores(games, position as FootballPosition, metrics);
  }
  
  const normalizedScores = normalizeToPercentile(subScores, peerStats);
  
  const contextMultipliers = calculateContextMultipliers(games, rosterRole);
  
  const overallRating = calculateOverallRating(normalizedScores, contextMultipliers);
  
  const consistencyIndex = calculateConsistencyIndex(games);
  const ratingBand = getRatingBand(overallRating);
  const explanations = generateExplanations(normalizedScores, games, sport);
  
  let confidence = Math.min(games.length / 10 * 100, 100);
  if (metrics) confidence = Math.min(confidence + 10, 100);
  if (peerStats && peerStats.sampleSize >= 10) confidence = Math.min(confidence + 10, 100);
  
  return {
    overallRating,
    subScores: normalizedScores,
    contextMultipliers,
    percentileRank: overallRating,
    consistencyIndex,
    explanation: explanations,
    ratingBand,
    confidence: Math.round(confidence),
  };
}

export function calculateProjection(
  currentRating: number,
  games: GameStats[],
  metrics?: PlayerMetrics,
  age?: number,
  horizonMonths: number = 12
): ProjectionResult {
  let trajectoryScore = 50;
  if (games.length >= 5) {
    const recentGrades = games.slice(0, 5).map(g => gradeToNumeric(g.grade || 'C'));
    const olderGrades = games.slice(5, 10).map(g => gradeToNumeric(g.grade || 'C'));
    
    if (olderGrades.length > 0) {
      const recentAvg = recentGrades.reduce((a, b) => a + b, 0) / recentGrades.length;
      const olderAvg = olderGrades.reduce((a, b) => a + b, 0) / olderGrades.length;
      const slope = recentAvg - olderAvg;
      trajectoryScore = clamp(50 + slope * 2, 0, 100);
    }
  }
  
  let translationScore = 50;
  if (games.length >= 3) {
    const closerGames = games.filter(g => {
      const result = g.result || '';
      const scores = result.match(/\d+/g);
      if (scores && scores.length >= 2) {
        const diff = Math.abs(parseInt(scores[0]) - parseInt(scores[1]));
        return diff <= 10;
      }
      return false;
    });
    
    if (closerGames.length > 0) {
      const closeGameGrades = closerGames.map(g => gradeToNumeric(g.grade || 'C'));
      const avgClosePerf = closeGameGrades.reduce((a, b) => a + b, 0) / closeGameGrades.length;
      translationScore = clamp(avgClosePerf * 1.1, 0, 100);
    }
  }
  
  let upsideScore = 50;
  if (age) {
    if (age <= 16) upsideScore += 25;
    else if (age <= 18) upsideScore += 15;
    else if (age <= 20) upsideScore += 5;
  }
  
  if (metrics) {
    if (metrics.coachability && metrics.coachability >= 8) upsideScore += 10;
    if (metrics.workEthic && metrics.workEthic >= 8) upsideScore += 10;
  }
  
  const bestGame = games.reduce((best, g) => {
    const grade = gradeToNumeric(g.grade || 'C');
    return grade > best ? grade : best;
  }, 0);
  if (bestGame > currentRating + 10) {
    upsideScore += 10;
  }
  
  upsideScore = clamp(upsideScore, 0, 100);
  
  let riskScore = 50;
  const consistencyIndex = calculateConsistencyIndex(games);
  if (consistencyIndex < 60) {
    riskScore += (60 - consistencyIndex) * 0.5;
  }
  
  if (games.length < 5) {
    riskScore += 15;
  }
  
  riskScore = clamp(riskScore, 0, 100);
  
  const maxChange = horizonMonths === 12 ? 18 : (horizonMonths === 24 ? 30 : 12);
  
  const rawLikely = currentRating +
    (trajectoryScore - 50) * 0.12 +
    (translationScore - 50) * 0.10 +
    (upsideScore - 50) * 0.10 -
    (riskScore - 50) * 0.08;
  
  const likelyChange = clamp(rawLikely - currentRating, -maxChange, maxChange);
  const likelyRating = clamp(Math.round(currentRating + likelyChange), 0, 100);
  
  const ceilingRating = clamp(
    Math.round(likelyRating + (upsideScore * 0.20) - (riskScore * 0.05)),
    likelyRating,
    100
  );
  
  const floorRating = clamp(
    Math.round(likelyRating - (riskScore * 0.20)),
    0,
    likelyRating
  );
  
  const levelMapping = getRatingBand(likelyRating);
  
  let confidencePercent = Math.min(games.length / 10 * 60 + 20, 80);
  if (metrics) confidencePercent += 10;
  if (games.length >= 20) confidencePercent += 10;
  confidencePercent = Math.min(Math.round(confidencePercent), 100);
  
  const explanations: string[] = [];
  
  if (trajectoryScore >= 60) {
    explanations.push(`Strong upward trajectory (+${Math.round(trajectoryScore - 50)} growth slope)`);
  } else if (trajectoryScore < 45) {
    explanations.push('Recent performance showing decline');
  }
  
  if (translationScore >= 65) {
    explanations.push('Performs well in high-pressure games');
  }
  
  if (upsideScore >= 70) {
    explanations.push('High ceiling potential based on age and best performances');
  }
  
  if (riskScore >= 65) {
    explanations.push('Volatility risk: inconsistent game-to-game performance');
  } else if (riskScore < 40) {
    explanations.push('Low risk profile: consistent performer');
  }
  
  explanations.push(`Projected level in ${horizonMonths} months: ${levelMapping}`);
  
  return {
    trajectoryScore: Math.round(trajectoryScore),
    translationScore: Math.round(translationScore),
    upsideScore: Math.round(upsideScore),
    riskScore: Math.round(riskScore),
    likelyRating,
    ceilingRating,
    floorRating,
    levelMapping,
    confidencePercent,
    explanations,
  };
}
