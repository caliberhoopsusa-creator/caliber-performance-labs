// client/src/lib/gameAnalytics.ts
// Pure analytics functions. No React, no form dependencies.
// Benefit: coach-facing scores can be corrected or tuned here without touching form UI.
import { positionGroup } from "@shared/sports-config";

export interface BasketballDefenseParams {
  steals: number;
  blocks: number;
  defensiveRebounds: number;
  minutes: number;
  position: string;
}

export interface BasketballHustleParams {
  steals: number;
  offensiveRebounds: number;
  defensiveRebounds: number;
  assists: number;
  blocks: number;
  minutes: number;
  position: string;
}

export function calcDefenseRating(p: BasketballDefenseParams): number {
  const mins = p.minutes || 1;
  let rating = 50;
  rating += (p.steals / mins) * 36 * 8;
  /* Compared on the broad group, not the exact position. These bonuses were
     written against Guard / Wing / Big; after the migration to five positions
     a literal comparison silently stops matching and the bonus vanishes. */
  const group = positionGroup(p.position);
  rating += (p.blocks / mins) * 36 * (group === 'Big' ? 6 : 4);
  rating += (p.defensiveRebounds / mins) * 36 * 1.5;
  if (group === 'Guard') rating += p.steals * 2;
  else if (group === 'Big') rating += p.blocks * 2;
  return Math.max(0, Math.min(100, Math.round(rating)));
}

export function calcBasketballHustle(p: BasketballHustleParams): number {
  const mins = p.minutes || 1;
  let score = 50;
  score += (p.steals / mins) * 36 * 10;
  score += (p.offensiveRebounds / mins) * 36 * 6;
  score += (p.defensiveRebounds / mins) * 36 * 1.5;
  score += (p.assists / mins) * 36 * 2;
  score += (p.blocks / mins) * 36 * 3;
  if (p.minutes >= 30) score += 5;
  else if (p.minutes >= 20) score += 3;
  const group = positionGroup(p.position);
  if (group === 'Guard') score += p.steals * 3;
  else if (group === 'Big') score += p.offensiveRebounds * 4;
  else if (group === 'Wing') score += (p.steals + p.offensiveRebounds) * 2;
  return Math.max(0, Math.min(100, Math.round(score)));
}
