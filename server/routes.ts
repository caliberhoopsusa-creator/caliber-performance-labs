import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { players, games, headToHeadChallenges, type Game, type ScheduleEvent, insertGoalSchema, insertCommentSchema, insertChallengeSchema, insertTeamSchema, insertTeamMemberSchema, insertTeamPostSchema, XP_REWARDS, TIER_THRESHOLDS, BADGE_DEFINITIONS, SKILL_BADGE_TYPES, type SkillBadgeLevel, insertShotSchema, insertGameNoteSchema, insertPracticeSchema, insertPracticeAttendanceSchema, insertDrillSchema, insertDrillScoreSchema, insertLineupSchema, insertLineupStatSchema, insertOpponentSchema, insertAlertSchema, insertCoachGoalSchema, insertDrillRecommendationSchema, insertNotificationSchema, insertHighlightClipSchema, insertWorkoutSchema, insertAccoladeSchema, insertGoalShareSchema, insertScheduleEventSchema, insertLiveGameSessionSchema, insertLiveGameEventSchema, insertShareAssetSchema, insertMentorshipProfileSchema, insertMentorshipRequestSchema, insertRecruitPostSchema, insertRecruitInterestSchema } from "@shared/schema";
import { getPlayerArchetype, ARCHETYPES } from "@shared/archetypes";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";
import fs from "fs";
import path from "path";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { setupAuth, registerAuthRoutes, isAuthenticated, authStorage } from "./replit_integrations/auth";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { users } from "@shared/models/auth";
import { eq, sql } from "drizzle-orm";
import { db } from "./db";
import type { RequestHandler } from "express";

// Admin password middleware
const isAdmin: RequestHandler = (req: any, res, next) => {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const providedPassword = req.headers['x-admin-password'] || req.body?.adminPassword;
  
  if (!adminPassword) {
    return res.status(500).json({ message: "Admin password not configured" });
  }
  
  if (providedPassword !== adminPassword) {
    return res.status(401).json({ message: "Invalid admin password" });
  }
  
  next();
};

// Role-based middleware
const isCoach: RequestHandler = async (req: any, res, next) => {
  try {
    if (!req.isAuthenticated() || !req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await authStorage.getUser(req.user.claims.sub);
    if (!user || user.role !== 'coach') {
      return res.status(403).json({ message: "Coach access required" });
    }
    (req as any).caliberUser = user;
    next();
  } catch (error) {
    console.error('Error in isCoach middleware:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const isPlayer: RequestHandler = async (req: any, res, next) => {
  try {
    if (!req.isAuthenticated() || !req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await authStorage.getUser(req.user.claims.sub);
    if (!user || user.role !== 'player') {
      return res.status(403).json({ message: "Player access required" });
    }
    (req as any).caliberUser = user;
    next();
  } catch (error) {
    console.error('Error in isPlayer middleware:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Helper to check if user can modify a specific player
const canModifyPlayer = async (req: any, playerId: number): Promise<boolean> => {
  if (!req.isAuthenticated() || !req.user?.claims?.sub) return false;
  const user = await authStorage.getUser(req.user.claims.sub);
  if (!user) return false;
  
  // Coaches can modify any player
  if (user.role === 'coach') return true;
  
  // Players can only modify their own profile
  if (user.role === 'player' && user.playerId === playerId) return true;
  
  return false;
};

// Helper to check if subscription is active (includes trialing)
const isSubscriptionActive = (status: string | null | undefined): boolean => {
  return status === 'active' || status === 'trialing';
};

// Helper to check if user is the app owner (bypasses all restrictions)
// Uses user ID from session claims - set OWNER_USER_ID env var to your Replit user ID
const isAppOwner = (userId: string | null | undefined): boolean => {
  const ownerUserId = process.env.OWNER_USER_ID;
  if (!ownerUserId || !userId) return false;
  return userId === ownerUserId;
};

// Subscription verification middleware
const requiresSubscription: RequestHandler = async (req: any, res, next) => {
  try {
    if (!req.isAuthenticated() || !req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // App owner bypasses all subscription requirements (check claims.sub)
    if (isAppOwner(req.user.claims.sub)) {
      return next();
    }
    
    const user = await authStorage.getUser(req.user.claims.sub);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    // Check if user has an active subscription (includes trialing)
    if (!user.stripeSubscriptionId || !isSubscriptionActive(user.subscriptionStatus)) {
      return res.status(403).json({ 
        message: "Premium subscription required",
        code: "SUBSCRIPTION_REQUIRED"
      });
    }
    
    (req as any).caliberUser = user;
    next();
  } catch (error) {
    console.error('Error in requiresSubscription middleware:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Middleware for coach role only (no subscription required)
const requiresCoach: RequestHandler = async (req: any, res, next) => {
  try {
    if (!req.isAuthenticated() || !req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // App owner bypasses all role requirements
    if (isAppOwner(req.user.claims.sub)) {
      return next();
    }
    
    const user = await authStorage.getUser(req.user.claims.sub);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    // Check if user is a coach
    if (user.role !== 'coach') {
      return res.status(403).json({ message: "Coach access required" });
    }
    
    (req as any).caliberUser = user;
    next();
  } catch (error) {
    console.error('Error in requiresCoach middleware:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Combined middleware for coach + subscription
const requiresCoachPro: RequestHandler = async (req: any, res, next) => {
  try {
    if (!req.isAuthenticated() || !req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // App owner bypasses all subscription/role requirements (check claims.sub)
    if (isAppOwner(req.user.claims.sub)) {
      return next();
    }
    
    const user = await authStorage.getUser(req.user.claims.sub);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    // Check if user is a coach
    if (user.role !== 'coach') {
      return res.status(403).json({ message: "Coach access required" });
    }
    
    // Check if user has an active subscription (includes trialing)
    if (!user.stripeSubscriptionId || !isSubscriptionActive(user.subscriptionStatus)) {
      return res.status(403).json({ 
        message: "Coach Pro subscription required",
        code: "SUBSCRIPTION_REQUIRED"
      });
    }
    
    (req as any).caliberUser = user;
    next();
  } catch (error) {
    console.error('Error in requiresCoachPro middleware:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Gemini AI client for video analysis
const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

// Configure multer for video uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// --- Analysis Logic ---

function calculateGrade(stats: any, position: string): { grade: string; feedback: string } {
  let score = 50; // Base score
  
  // Traditional Stat Weights
  let weights = {
    pts: 1.0,
    reb: 1.5,
    ast: 1.5,
    stl: 2.5,
    blk: 2.5,
    to: -2.5,
    fouls: -1.0,
  };

  // Position Adjustments
  if (position === 'Guard') {
    weights.ast = 2.0;
    weights.to = -3.0; // Punish TOs more
  } else if (position === 'Big') {
    weights.reb = 2.0;
    weights.blk = 3.0;
    weights.ast = 1.0;
  } else if (position === 'Wing') {
    weights.stl = 3.0;
    weights.pts = 1.2;
  }

  // Calculate Raw Score
  score += (stats.points || 0) * weights.pts;
  score += (stats.rebounds || 0) * weights.reb;
  score += (stats.assists || 0) * weights.ast;
  score += (stats.steals || 0) * weights.stl;
  score += (stats.blocks || 0) * weights.blk;
  score += (stats.turnovers || 0) * weights.to;
  score += (stats.fouls || 0) * weights.fouls;

  // Efficiency Bonus
  const fga = stats.fgAttempted || 0;
  if (fga > 0) {
    const fgPct = (stats.fgMade || 0) / fga;
    if (fgPct > 0.5) score += 5;
    if (fgPct < 0.35) score -= 5;
  }
  
  // Manual Ratings Bonus
  if (stats.hustleScore) score += (stats.hustleScore - 50) * 0.2;
  if (stats.defenseRating) score += (stats.defenseRating - 50) * 0.3;

  // Grade Mapping
  let grade = 'C';
  if (score >= 90) grade = 'A+';
  else if (score >= 80) grade = 'A';
  else if (score >= 70) grade = 'A-';
  else if (score >= 65) grade = 'B+';
  else if (score >= 60) grade = 'B';
  else if (score >= 55) grade = 'B-';
  else if (score >= 50) grade = 'C+';
  else if (score >= 45) grade = 'C';
  else if (score >= 40) grade = 'C-';
  else if (score >= 35) grade = 'D';
  else grade = 'F';

  // Feedback Generation
  const positives = [];
  const improvements = [];

  if ((stats.points || 0) >= 20) positives.push("Great scoring output.");
  if ((stats.rebounds || 0) >= 10) positives.push("Excellent work on the glass.");
  if ((stats.assists || 0) >= 7) positives.push("Fantastic playmaking and vision.");
  if ((stats.steals || 0) >= 3 || (stats.blocks || 0) >= 3) positives.push("High defensive impact.");
  if (stats.turnovers <= 1 && (stats.minutes || 0) > 15) positives.push("Took care of the basketball.");

  if ((stats.turnovers || 0) >= 5) improvements.push("Ball security needs work (high TOs).");
  if (fga > 10 && ((stats.fgMade || 0) / fga) < 0.35) improvements.push("Shot selection or finishing was inefficient.");
  if ((stats.fouls || 0) >= 4) improvements.push("Foul trouble limited aggressiveness.");
  
  let feedback = "";
  if (positives.length > 0) feedback += "Strengths: " + positives.join(" ") + "\n";
  if (improvements.length > 0) feedback += "Areas to Improve: " + improvements.join(" ") + "\n";
  if (!feedback) feedback = "Solid effort. Focus on consistency in the next game.";

  return { grade, feedback };
}

// --- Defense & Hustle Calculations ---

function calculateDefenseRating(stats: any, position: string): number {
  let rating = 50; // Base rating
  
  const steals = stats.steals || 0;
  const blocks = stats.blocks || 0;
  const defensiveRebounds = stats.defensiveRebounds || 0;
  const minutes = stats.minutes || 1;
  
  // Parse opponent score from result (e.g., "W 105-98" or "L 95-100")
  let opponentScore = 0;
  if (stats.result) {
    const match = stats.result.match(/[WL]\s*(\d+)-(\d+)/i);
    if (match) {
      const isWin = stats.result.toUpperCase().startsWith('W');
      opponentScore = isWin ? parseInt(match[2]) : parseInt(match[1]);
    }
  }
  
  // Steals per minute (scaled) - major defensive indicator
  const stealsPerMin = (steals / minutes) * 36; // Per-36 minutes
  rating += stealsPerMin * 8; // Each steal per 36 adds 8 points
  
  // Blocks per minute (scaled) - rim protection
  const blocksPerMin = (blocks / minutes) * 36;
  if (position === 'Big') {
    rating += blocksPerMin * 6; // Bigs get more credit for blocks
  } else {
    rating += blocksPerMin * 4;
  }
  
  // Defensive rebounds per minute - controlling the glass
  const drebPerMin = (defensiveRebounds / minutes) * 36;
  rating += drebPerMin * 1.5;
  
  // Points allowed per possession estimate (opponent efficiency)
  if (opponentScore > 0 && minutes > 0) {
    // Estimate possessions based on minutes played (rough estimate: ~100 possessions per 48 min game)
    const playerPossessions = (minutes / 48) * 100;
    // Estimate player's share of opponent's points (based on being 1 of 5 on court)
    const playerShareOfOpponentPts = (opponentScore * (minutes / 48)) / 5;
    const ptsAllowedPerPoss = playerShareOfOpponentPts / playerPossessions;
    
    // Lower is better - baseline is ~1.0 points per possession
    if (ptsAllowedPerPoss < 0.9) rating += 10;
    else if (ptsAllowedPerPoss < 1.0) rating += 5;
    else if (ptsAllowedPerPoss > 1.2) rating -= 10;
    else if (ptsAllowedPerPoss > 1.1) rating -= 5;
  }
  
  // Position-based adjustments
  if (position === 'Guard') {
    rating += steals * 2; // Guards get extra credit for steals
  } else if (position === 'Big') {
    rating += blocks * 2; // Bigs get extra credit for blocks
  }
  
  // Clamp to 0-100 range
  return Math.max(0, Math.min(100, Math.round(rating)));
}

function calculateHustleScore(stats: any, position: string): number {
  let score = 50; // Base score
  
  const steals = stats.steals || 0;
  const offensiveRebounds = stats.offensiveRebounds || 0;
  const defensiveRebounds = stats.defensiveRebounds || 0;
  const assists = stats.assists || 0;
  const blocks = stats.blocks || 0;
  const minutes = stats.minutes || 1;
  
  // Steals are the #1 hustle indicator - shows effort and anticipation
  const stealsPerMin = (steals / minutes) * 36;
  score += stealsPerMin * 10;
  
  // Offensive rebounds show extra effort (going after missed shots)
  const orebPerMin = (offensiveRebounds / minutes) * 36;
  score += orebPerMin * 6;
  
  // Defensive rebounds show positioning and boxing out
  const drebPerMin = (defensiveRebounds / minutes) * 36;
  score += drebPerMin * 1.5;
  
  // Assists show willingness to create for teammates
  const astPerMin = (assists / minutes) * 36;
  score += astPerMin * 2;
  
  // Blocks show effort and timing
  const blkPerMin = (blocks / minutes) * 36;
  score += blkPerMin * 3;
  
  // Minutes bonus - playing more = more opportunity to show hustle
  if (minutes >= 30) score += 5;
  else if (minutes >= 20) score += 3;
  
  // Position adjustments
  if (position === 'Guard') {
    score += steals * 3; // Guards hustling for steals
  } else if (position === 'Big') {
    score += offensiveRebounds * 4; // Bigs hustling for offensive boards
  } else if (position === 'Wing') {
    score += (steals + offensiveRebounds) * 2; // Wings do both
  }
  
  // Clamp to 0-100 range
  return Math.max(0, Math.min(100, Math.round(score)));
}

// --- Advanced Metrics Calculations (NBA-style) ---

interface AdvancedMetrics {
  trueShootingPct: number | null;
  usageRate: number | null;
  playerEfficiencyRating: number | null;
  gameScore: number;
  winShares: number;
}

function calculateAdvancedMetrics(stats: any): AdvancedMetrics {
  const points = stats.points || 0;
  const fgMade = stats.fgMade || 0;
  const fgAttempted = stats.fgAttempted || 0;
  const ftMade = stats.ftMade || 0;
  const ftAttempted = stats.ftAttempted || 0;
  const rebounds = stats.rebounds || 0;
  const offensiveRebounds = stats.offensiveRebounds || 0;
  const defensiveRebounds = stats.defensiveRebounds || 0;
  const assists = stats.assists || 0;
  const steals = stats.steals || 0;
  const blocks = stats.blocks || 0;
  const turnovers = stats.turnovers || 0;
  const fouls = stats.fouls || 0;
  const minutes = stats.minutes || 0;

  // 1. True Shooting Percentage (TS%)
  // TS% = Points / (2 * (FGA + 0.44 * FTA))
  const tsaDenominator = 2 * (fgAttempted + 0.44 * ftAttempted);
  const trueShootingPct = tsaDenominator > 0 ? (points / tsaDenominator) : null;

  // 2. Usage Rate (USG%) - Simplified version
  // USG% = ((FGA + 0.44 * FTA + TOV) / Minutes) normalized to per-36
  // Estimate team possessions as ~100 per 48 minutes (75 per 36 minutes)
  let usageRate: number | null = null;
  if (minutes > 0) {
    const possessionTerminators = fgAttempted + 0.44 * ftAttempted + turnovers;
    const per36PossTerms = (possessionTerminators / minutes) * 36;
    // Normalize against estimated 75 team possessions in 36 minutes (player's 1/5 share = 15)
    usageRate = (per36PossTerms / 15) * 100;
    usageRate = Math.min(usageRate, 100); // Cap at 100%
  }

  // 3. Player Efficiency Rating (PER) - Simplified version
  // PER = (Points + Rebounds + Assists + Steals + Blocks - Turnovers - (FGA - FGM) - 0.5 * (FTA - FTM)) / Minutes * 36
  let playerEfficiencyRating: number | null = null;
  if (minutes > 0) {
    const missedFG = fgAttempted - fgMade;
    const missedFT = ftAttempted - ftMade;
    const rawPER = points + rebounds + assists + steals + blocks - turnovers - missedFG - 0.5 * missedFT;
    playerEfficiencyRating = (rawPER / minutes) * 36;
  }

  // 4. Game Score (John Hollinger's formula)
  // GameScore = Points + 0.4*FGM - 0.7*FGA - 0.4*(FTA-FTM) + 0.7*ORB + 0.3*DRB + Steals + 0.7*Assists + 0.7*Blocks - 0.4*Fouls - Turnovers
  const orb = offensiveRebounds || 0;
  const drb = defensiveRebounds || (rebounds - orb);
  const gameScore = points 
    + 0.4 * fgMade 
    - 0.7 * fgAttempted 
    - 0.4 * (ftAttempted - ftMade) 
    + 0.7 * orb 
    + 0.3 * drb 
    + steals 
    + 0.7 * assists 
    + 0.7 * blocks 
    - 0.4 * fouls 
    - turnovers;

  // 5. Win Shares (simplified per-game estimate)
  // Simplified: ((Points + Assists*2 + Rebounds + Steals*2 + Blocks*2 - Turnovers*2) / 48) * (Minutes / 48)
  const contributionValue = points + assists * 2 + rebounds + steals * 2 + blocks * 2 - turnovers * 2;
  const winShares = (contributionValue / 48) * (minutes / 48);

  return {
    trueShootingPct: trueShootingPct !== null ? Math.round(trueShootingPct * 1000) / 1000 : null,
    usageRate: usageRate !== null ? Math.round(usageRate * 10) / 10 : null,
    playerEfficiencyRating: playerEfficiencyRating !== null ? Math.round(playerEfficiencyRating * 10) / 10 : null,
    gameScore: Math.round(gameScore * 10) / 10,
    winShares: Math.round(winShares * 1000) / 1000,
  };
}

function calculateAggregatedAdvancedMetrics(games: any[]): AdvancedMetrics & { gamesCount: number } {
  if (games.length === 0) {
    return {
      trueShootingPct: null,
      usageRate: null,
      playerEfficiencyRating: null,
      gameScore: 0,
      winShares: 0,
      gamesCount: 0,
    };
  }

  // Aggregate totals for TS% calculation
  let totalPoints = 0;
  let totalFGA = 0;
  let totalFTA = 0;
  let totalMinutes = 0;
  let totalFGM = 0;
  let totalFTM = 0;
  let totalRebounds = 0;
  let totalORB = 0;
  let totalDRB = 0;
  let totalAssists = 0;
  let totalSteals = 0;
  let totalBlocks = 0;
  let totalTurnovers = 0;
  let totalFouls = 0;

  for (const game of games) {
    totalPoints += game.points || 0;
    totalFGA += game.fgAttempted || 0;
    totalFTA += game.ftAttempted || 0;
    totalMinutes += game.minutes || 0;
    totalFGM += game.fgMade || 0;
    totalFTM += game.ftMade || 0;
    totalRebounds += game.rebounds || 0;
    totalORB += game.offensiveRebounds || 0;
    totalDRB += game.defensiveRebounds || 0;
    totalAssists += game.assists || 0;
    totalSteals += game.steals || 0;
    totalBlocks += game.blocks || 0;
    totalTurnovers += game.turnovers || 0;
    totalFouls += game.fouls || 0;
  }

  // Calculate aggregated metrics using totals
  const aggregatedStats = {
    points: totalPoints,
    fgMade: totalFGM,
    fgAttempted: totalFGA,
    ftMade: totalFTM,
    ftAttempted: totalFTA,
    rebounds: totalRebounds,
    offensiveRebounds: totalORB,
    defensiveRebounds: totalDRB,
    assists: totalAssists,
    steals: totalSteals,
    blocks: totalBlocks,
    turnovers: totalTurnovers,
    fouls: totalFouls,
    minutes: totalMinutes,
  };

  const metrics = calculateAdvancedMetrics(aggregatedStats);

  // Win shares should be sum of per-game win shares
  let totalWinShares = 0;
  for (const game of games) {
    const gameMetrics = calculateAdvancedMetrics(game);
    totalWinShares += gameMetrics.winShares;
  }

  return {
    ...metrics,
    winShares: Math.round(totalWinShares * 1000) / 1000,
    gamesCount: games.length,
  };
}

// --- Badge Award Logic ---

async function checkAndAwardBadges(playerId: number, gameId: number, stats: any, grade: string) {
  const awardedBadges: string[] = [];
  
  // Check single-game badges
  
  // twenty_piece - Scored 20+ points
  if ((stats.points || 0) >= 20) {
    await storage.createBadge({ playerId, badgeType: "twenty_piece", gameId });
    awardedBadges.push("twenty_piece");
  }
  
  // thirty_bomb - Scored 30+ points
  if ((stats.points || 0) >= 30) {
    await storage.createBadge({ playerId, badgeType: "thirty_bomb", gameId });
    awardedBadges.push("thirty_bomb");
  }
  
  // Check double/triple double
  const pts = (stats.points || 0) >= 10 ? 1 : 0;
  const reb = (stats.rebounds || 0) >= 10 ? 1 : 0;
  const ast = (stats.assists || 0) >= 10 ? 1 : 0;
  const doubleCount = pts + reb + ast;
  
  if (doubleCount >= 3) {
    await storage.createBadge({ playerId, badgeType: "triple_double", gameId });
    awardedBadges.push("triple_double");
  } else if (doubleCount >= 2) {
    await storage.createBadge({ playerId, badgeType: "double_double", gameId });
    awardedBadges.push("double_double");
  }
  
  // ironman - Played 32+ minutes
  if ((stats.minutes || 0) >= 32) {
    await storage.createBadge({ playerId, badgeType: "ironman", gameId });
    awardedBadges.push("ironman");
  }
  
  // efficiency_master - Got an A+ grade
  if (grade === "A+") {
    await storage.createBadge({ playerId, badgeType: "efficiency_master", gameId });
    awardedBadges.push("efficiency_master");
  }
  
  // lockdown - Defense rating 90+
  if ((stats.defenseRating || 0) >= 90) {
    await storage.createBadge({ playerId, badgeType: "lockdown", gameId });
    awardedBadges.push("lockdown");
  }
  
  // hustle_king - Hustle score 90+
  if ((stats.hustleScore || 0) >= 90) {
    await storage.createBadge({ playerId, badgeType: "hustle_king", gameId });
    awardedBadges.push("hustle_king");
  }
  
  // clean_sheet - Zero turnovers with 20+ minutes
  if ((stats.turnovers || 0) === 0 && (stats.minutes || 0) >= 20) {
    await storage.createBadge({ playerId, badgeType: "clean_sheet", gameId });
    awardedBadges.push("clean_sheet");
  }
  
  // sharpshooter - 50%+ from 3 on 5+ attempts
  const threeAttempts = stats.threeAttempted || 0;
  const threeMade = stats.threeMade || 0;
  if (threeAttempts >= 5 && (threeMade / threeAttempts) >= 0.5) {
    await storage.createBadge({ playerId, badgeType: "sharpshooter", gameId });
    awardedBadges.push("sharpshooter");
  }
  
  // Check streak badges by looking at recent games
  const streakBadges = await checkStreakBadges(playerId, gameId);
  awardedBadges.push(...streakBadges);
  
  return awardedBadges;
}

async function checkStreakBadges(playerId: number, latestGameId: number): Promise<string[]> {
  const awardedBadges: string[] = [];
  const playerGames = await storage.getGamesByPlayerId(playerId);
  const existingBadges = await storage.getPlayerBadges(playerId);
  
  // Sort games by date descending (most recent first)
  const sortedGames = [...playerGames].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Check for B+ or better grades (B+, A-, A, A+)
  const goodGrades = ["B+", "A-", "A", "A+"];
  
  // Count consecutive good games from most recent
  let streakCount = 0;
  for (const game of sortedGames) {
    if (game.grade && goodGrades.includes(game.grade)) {
      streakCount++;
    } else {
      break;
    }
  }
  
  // Check if player already has streak badges
  const hasHotStreak3 = existingBadges.some(b => b.badgeType === "hot_streak_3");
  const hasHotStreak5 = existingBadges.some(b => b.badgeType === "hot_streak_5");
  
  // Award streak badges
  if (streakCount >= 5 && !hasHotStreak5) {
    await storage.createBadge({ playerId, badgeType: "hot_streak_5", gameId: latestGameId });
    awardedBadges.push("hot_streak_5");
  }
  if (streakCount >= 3 && !hasHotStreak3) {
    await storage.createBadge({ playerId, badgeType: "hot_streak_3", gameId: latestGameId });
    awardedBadges.push("hot_streak_3");
  }
  
  return awardedBadges;
}

// Update progressive skill badges based on career stats
async function updateSkillBadges(playerId: number, stats: any): Promise<{ upgraded: string[], newLevels: { skill: string, level: string }[] }> {
  const upgraded: string[] = [];
  const newLevels: { skill: string, level: string }[] = [];
  
  // Map stat names from game to skill badge types
  const statMapping: Record<string, keyof typeof stats> = {
    sharpshooter: 'threeMade',
    pure_passer: 'assists',
    bucket_getter: 'points',
    glass_cleaner: 'rebounds',
    rim_protector: 'blocks',
    pickpocket: 'steals',
  };
  
  for (const [skillType, config] of Object.entries(SKILL_BADGE_TYPES)) {
    const statKey = statMapping[skillType];
    const gameValue = stats[statKey] || 0;
    
    if (gameValue <= 0) continue;
    
    // Get or create the skill badge
    const badge = await storage.getOrCreateSkillBadge(playerId, skillType);
    const newCareerValue = badge.careerValue + gameValue;
    
    // Determine new level based on thresholds
    let newLevel: SkillBadgeLevel = 'none';
    const thresholds = config.thresholds;
    
    if (newCareerValue >= thresholds.goat) {
      newLevel = 'goat';
    } else if (newCareerValue >= thresholds.legend) {
      newLevel = 'legend';
    } else if (newCareerValue >= thresholds.hall_of_fame) {
      newLevel = 'hall_of_fame';
    } else if (newCareerValue >= thresholds.platinum) {
      newLevel = 'platinum';
    } else if (newCareerValue >= thresholds.gold) {
      newLevel = 'gold';
    } else if (newCareerValue >= thresholds.silver) {
      newLevel = 'silver';
    } else if (newCareerValue >= thresholds.bronze) {
      newLevel = 'bronze';
    } else if (newCareerValue >= thresholds.brick) {
      newLevel = 'brick';
    }
    
    // Check if level upgraded
    const levelOrder: SkillBadgeLevel[] = ['none', 'brick', 'bronze', 'silver', 'gold', 'platinum', 'hall_of_fame', 'legend', 'goat'];
    const oldLevelIndex = levelOrder.indexOf(badge.currentLevel as SkillBadgeLevel);
    const newLevelIndex = levelOrder.indexOf(newLevel);
    
    if (newLevelIndex > oldLevelIndex) {
      upgraded.push(skillType);
      newLevels.push({ skill: skillType, level: newLevel });
    }
    
    // Always update career value
    await storage.updateSkillBadge(badge.id, {
      careerValue: newCareerValue,
      currentLevel: newLevel,
    });
  }
  
  return { upgraded, newLevels };
}

async function updateChallengeProgressForPlayer(playerId: number, stats: any, grade: string, gameDate: string) {
  const activeChallenges = await storage.getActiveChallenges();
  const goodGrades = ["B+", "A-", "A", "A+"];
  
  for (const challenge of activeChallenges) {
    const progress = await storage.getOrCreateChallengeProgress(challenge.id, playerId);
    
    if (progress.completed) continue;
    
    let newValue = progress.currentValue;
    
    switch (challenge.targetType) {
      case 'hustle_avg': {
        const playerGames = await storage.getGamesByPlayerId(playerId);
        const gamesInRange = playerGames.filter(g => {
          const gDate = new Date(g.date);
          return gDate >= new Date(challenge.startDate) && gDate <= new Date(challenge.endDate);
        });
        if (gamesInRange.length > 0) {
          newValue = Math.round(gamesInRange.reduce((acc, g) => acc + (g.hustleScore || 50), 0) / gamesInRange.length);
        }
        break;
      }
      case 'points_total': {
        const playerGames = await storage.getGamesByPlayerId(playerId);
        const gamesInRange = playerGames.filter(g => {
          const gDate = new Date(g.date);
          return gDate >= new Date(challenge.startDate) && gDate <= new Date(challenge.endDate);
        });
        newValue = gamesInRange.reduce((acc, g) => acc + g.points, 0);
        break;
      }
      case 'games_played': {
        const playerGames = await storage.getGamesByPlayerId(playerId);
        const gamesInRange = playerGames.filter(g => {
          const gDate = new Date(g.date);
          return gDate >= new Date(challenge.startDate) && gDate <= new Date(challenge.endDate);
        });
        newValue = gamesInRange.length;
        break;
      }
      case 'grade_count': {
        const playerGames = await storage.getGamesByPlayerId(playerId);
        const gamesInRange = playerGames.filter(g => {
          const gDate = new Date(g.date);
          return gDate >= new Date(challenge.startDate) && gDate <= new Date(challenge.endDate);
        });
        newValue = gamesInRange.filter(g => g.grade && goodGrades.includes(g.grade)).length;
        break;
      }
    }
    
    const isCompleted = newValue >= challenge.targetValue;
    
    await storage.updateChallengeProgress(progress.id, {
      currentValue: newValue,
      completed: isCompleted,
      completedAt: isCompleted && !progress.completed ? new Date() : progress.completedAt,
    });
    
    if (isCompleted && !progress.completed && challenge.badgeReward) {
      await storage.createBadge({ playerId, badgeType: challenge.badgeReward });
    }
  }
}

async function updatePlayerStreaks(playerId: number, gameId: number, stats: any, grade: string) {
  const goodGrades = ["B+", "A-", "A", "A+"];
  
  const streakChecks = [
    { 
      type: "grade_above_b", 
      condition: grade && goodGrades.includes(grade) 
    },
    { 
      type: "double_digit_points", 
      condition: (stats.points || 0) >= 10 
    },
    { 
      type: "no_turnovers", 
      condition: (stats.turnovers || 0) === 0 
    },
    { 
      type: "a_defense", 
      condition: (stats.defenseRating || 0) >= 85 
    },
  ];

  for (const check of streakChecks) {
    const streak = await storage.getOrCreateStreak(playerId, check.type);
    
    if (check.condition) {
      const newCount = streak.currentCount + 1;
      const newBest = Math.max(streak.bestCount, newCount);
      await storage.updateStreak(streak.id, {
        currentCount: newCount,
        bestCount: newBest,
        lastGameId: gameId,
      });
    } else {
      await storage.updateStreak(streak.id, {
        currentCount: 0,
        lastGameId: gameId,
      });
    }
  }
}

// Helper function to check for performance drops and generate alerts
async function checkPerformanceAlerts(playerId: number, gameId: number, currentGame: any, grade: string) {
  const playerGames = await storage.getGamesByPlayerId(playerId);
  const player = await storage.getPlayer(playerId);
  
  if (!player || playerGames.length < 3) return; // Need at least 3 games to detect trends
  
  // Get recent games excluding current one
  const recentGames = playerGames.filter(g => g.id !== gameId).slice(0, 5);
  if (recentGames.length < 2) return;
  
  // Calculate recent averages
  const avgPoints = recentGames.reduce((acc, g) => acc + g.points, 0) / recentGames.length;
  const avgRebounds = recentGames.reduce((acc, g) => acc + g.rebounds, 0) / recentGames.length;
  const avgAssists = recentGames.reduce((acc, g) => acc + g.assists, 0) / recentGames.length;
  const avgHustle = recentGames.reduce((acc, g) => acc + (g.hustleScore || 50), 0) / recentGames.length;
  
  // Check for significant performance drops (>40% below average)
  const dropThreshold = 0.4;
  
  // Points drop
  if (avgPoints > 5 && currentGame.points < avgPoints * (1 - dropThreshold)) {
    await storage.createAlert({
      playerId,
      alertType: 'performance_drop',
      title: 'Scoring Drop Detected',
      message: `${player.name} scored only ${currentGame.points} points, well below their ${avgPoints.toFixed(1)} PPG average.`,
      severity: 'warning',
      relatedGameId: gameId,
      isRead: false,
    });
  }
  
  // Rebounds drop for Bigs
  if (player.position === 'Big' && avgRebounds > 4 && currentGame.rebounds < avgRebounds * (1 - dropThreshold)) {
    await storage.createAlert({
      playerId,
      alertType: 'performance_drop',
      title: 'Rebounding Drop Detected',
      message: `${player.name} grabbed only ${currentGame.rebounds} rebounds, below their ${avgRebounds.toFixed(1)} RPG average.`,
      severity: 'warning',
      relatedGameId: gameId,
      isRead: false,
    });
  }
  
  // Hustle drop
  if (avgHustle > 60 && (currentGame.hustleScore || 50) < avgHustle * (1 - dropThreshold)) {
    await storage.createAlert({
      playerId,
      alertType: 'performance_drop',
      title: 'Hustle Drop Detected',
      message: `${player.name}'s hustle score dropped to ${currentGame.hustleScore || 50}, below their ${avgHustle.toFixed(0)} average.`,
      severity: 'warning',
      relatedGameId: gameId,
      isRead: false,
    });
  }
  
  // Poor grade alert
  const poorGrades = ['D', 'F'];
  if (poorGrades.includes(grade)) {
    await storage.createAlert({
      playerId,
      alertType: 'performance_drop',
      title: 'Poor Game Grade',
      message: `${player.name} received a ${grade} grade vs ${currentGame.opponent}. Review film and address issues.`,
      severity: 'critical',
      relatedGameId: gameId,
      isRead: false,
    });
  }
  
  // Turnovers spike
  if (currentGame.turnovers >= 5) {
    await storage.createAlert({
      playerId,
      alertType: 'performance_drop',
      title: 'High Turnover Game',
      message: `${player.name} had ${currentGame.turnovers} turnovers vs ${currentGame.opponent}. Ball security needs attention.`,
      severity: 'warning',
      relatedGameId: gameId,
      isRead: false,
    });
  }
  
  // Positive alert for improvement
  if (avgPoints > 0 && currentGame.points > avgPoints * 1.5) {
    await storage.createAlert({
      playerId,
      alertType: 'improvement',
      title: 'Scoring Breakout!',
      message: `${player.name} exploded for ${currentGame.points} points, significantly above their ${avgPoints.toFixed(1)} PPG average!`,
      severity: 'info',
      relatedGameId: gameId,
      isRead: false,
    });
  }
}

// Update activity streak (for consecutive days of activity)
async function updateActivityStreak(playerId: number, streakType: string): Promise<{ streakCount: number; isNewMilestone: boolean; milestoneReached?: number }> {
  const streak = await storage.getOrCreateActivityStreak(playerId, streakType);
  const today = new Date().toISOString().split('T')[0];
  const lastDate = streak.lastActivityDate;
  
  let newCount = 1;
  let isNewMilestone = false;
  let milestoneReached: number | undefined;
  
  if (lastDate) {
    const lastDateObj = new Date(lastDate);
    const todayObj = new Date(today);
    const diffDays = Math.floor((todayObj.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Same day, keep count the same
      return { streakCount: streak.currentStreak, isNewMilestone: false };
    } else if (diffDays === 1) {
      // Consecutive day
      newCount = streak.currentStreak + 1;
    } else {
      // Streak broken
      newCount = 1;
    }
  }
  
  const newLongest = Math.max(streak.longestStreak, newCount);
  
  // Check for milestone badges
  const milestones = [3, 7, 14, 30];
  for (const milestone of milestones) {
    if (newCount === milestone && streak.currentStreak < milestone) {
      isNewMilestone = true;
      milestoneReached = milestone;
      
      // Award streak badge
      const badgeType = `streak_${milestone}`;
      const existingBadges = await storage.getPlayerBadges(playerId);
      const hasStreakBadge = existingBadges.some(b => b.badgeType === badgeType);
      if (!hasStreakBadge) {
        await storage.createBadge({ playerId, badgeType, gameId: null });
        
        // Award streak bonus XP
        let bonusXp = 0;
        if (milestone === 3) bonusXp = XP_REWARDS.streak_bonus_3;
        else if (milestone === 7) bonusXp = XP_REWARDS.streak_bonus_7;
        else if (milestone === 14) bonusXp = XP_REWARDS.streak_bonus_14;
        else if (milestone === 30) bonusXp = XP_REWARDS.streak_bonus_30;
        
        if (bonusXp > 0) {
          await storage.addPlayerXp(playerId, bonusXp);
        }
      }
      break;
    }
  }
  
  await storage.updateActivityStreak(streak.id, {
    currentStreak: newCount,
    longestStreak: newLongest,
    lastActivityDate: today,
  });
  
  return { streakCount: newCount, isNewMilestone, milestoneReached };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Setup authentication FIRST before other routes
  await setupAuth(app);
  registerAuthRoutes(app);
  
  // Register object storage routes for file uploads
  registerObjectStorageRoutes(app);

  // --- User Role Management ---

  // Get current user with extended info (role, player profile)
  app.get('/api/users/me', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await authStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // If user is a player, fetch their player profile
      let playerProfile = null;
      if (user.role === 'player' && user.playerId) {
        playerProfile = await storage.getPlayer(user.playerId);
      }
      
      // Check if user is app owner (has full access)
      const isOwner = isAppOwner(userId);
      
      res.json({ ...user, playerProfile, userId, isOwner });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  // Set user role (player or coach)
  app.post('/api/users/role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role } = z.object({
        role: z.enum(['player', 'coach'])
      }).parse(req.body);
      
      const updatedUser = await authStorage.updateUserRole(userId, role);
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(updatedUser);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Create player profile for logged-in user (only for players)
  app.post('/api/users/create-player-profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await authStorage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      if (user.role !== 'player') {
        return res.status(400).json({ message: 'Only users with player role can create player profiles' });
      }
      
      // Check if already has a player profile
      if (user.playerId) {
        const existingPlayer = await storage.getPlayer(user.playerId);
        if (existingPlayer) {
          return res.status(400).json({ message: 'Player profile already exists', player: existingPlayer });
        }
      }
      
      const input = z.object({
        name: z.string().min(1),
        position: z.enum(['Guard', 'Wing', 'Big']),
        height: z.string().optional(),
        team: z.string().optional(),
        jerseyNumber: z.number().optional(),
      }).parse(req.body);
      
      // Create player linked to user
      const player = await storage.createPlayer({
        ...input,
        userId: userId,
      });
      
      // Update user with playerId
      await authStorage.updateUserRole(userId, 'player', player.id);
      
      res.status(201).json(player);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });
  
  // --- Players ---

  app.get(api.players.list.path, async (req, res) => {
    const players = await storage.getPlayers();
    res.json(players);
  });

  app.get(api.players.get.path, async (req, res) => {
    const player = await storage.getPlayer(Number(req.params.id));
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    
    // Get player's games and calculate aggregated advanced metrics
    const playerGames = await storage.getGamesByPlayerId(player.id);
    const aggregatedAdvancedMetrics = calculateAggregatedAdvancedMetrics(playerGames);
    
    res.json({
      ...player,
      advancedMetrics: aggregatedAdvancedMetrics,
    });
  });

  // Create player - coaches only
  app.post(api.players.create.path, isCoach, async (req, res) => {
    try {
      const input = api.players.create.input.parse(req.body);
      const player = await storage.createPlayer(input);
      res.status(201).json(player);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Delete player - coaches only
  app.delete(api.players.delete.path, isCoach, async (req, res) => {
    await storage.deletePlayer(Number(req.params.id));
    res.status(204).send();
  });

  // Update player - coaches OR player can update their own profile
  app.patch('/api/players/:id', isAuthenticated, async (req: any, res) => {
    try {
      const playerId = Number(req.params.id);
      
      // Check authorization
      if (!await canModifyPlayer(req, playerId)) {
        return res.status(403).json({ message: 'You can only edit your own profile' });
      }
      
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: 'Player not found' });
      }
      
      const updateSchema = z.object({
        name: z.string().min(1).optional(),
        position: z.enum(['Guard', 'Wing', 'Big']).optional(),
        height: z.string().optional(),
        team: z.string().optional(),
        jerseyNumber: z.number().optional(),
        photoUrl: z.string().optional(),
        bannerUrl: z.string().optional(),
        bio: z.string().optional(),
        openToOpportunities: z.boolean().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        school: z.string().optional(),
        graduationYear: z.number().optional(),
      });
      
      const input = updateSchema.parse(req.body);
      const updated = await storage.updatePlayer(playerId, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // --- Games ---

  // Create game - requires auth, players can only log for themselves
  app.post(api.games.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.games.create.input.parse(req.body);
      
      // Check authorization - players can only log games for their own profile
      if (!await canModifyPlayer(req, input.playerId)) {
        return res.status(403).json({ message: 'You can only log games for your own profile' });
      }
      
      // Calculate Grade & Feedback
      const player = await storage.getPlayer(input.playerId);
      if (!player) return res.status(404).json({ message: "Player not found" });

      // Calculate defense rating and hustle score from stats
      const defenseRating = calculateDefenseRating(input, player.position);
      const hustleScore = calculateHustleScore(input, player.position);
      
      // Calculate grade with the new defense/hustle values included
      const statsWithRatings = { ...input, defenseRating, hustleScore };
      const { grade, feedback } = calculateGrade(statsWithRatings, player.position);
      
      // Calculate PER (Points + Rebounds + Assists)
      const per = (input.points || 0) + (input.rebounds || 0) + (input.assists || 0);
      
      // Inject calculated fields
      const gameData: any = {
        playerId: input.playerId,
        date: input.date,
        opponent: input.opponent,
        result: input.result,
        minutes: input.minutes,
        points: input.points,
        rebounds: input.rebounds,
        assists: input.assists,
        steals: input.steals,
        blocks: input.blocks,
        turnovers: input.turnovers,
        fouls: input.fouls,
        fgMade: input.fgMade,
        fgAttempted: input.fgAttempted,
        threeMade: input.threeMade,
        threeAttempted: input.threeAttempted,
        ftMade: input.ftMade,
        ftAttempted: input.ftAttempted,
        offensiveRebounds: input.offensiveRebounds,
        defensiveRebounds: input.defensiveRebounds,
        hustleScore,
        defenseRating,
        notes: input.notes,
        grade,
        feedback,
        per: per.toString()
      };

      const game = await storage.createGame(gameData);
      
      // Check and award badges after game creation
      const awardedBadges = await checkAndAwardBadges(input.playerId, game.id, input, grade);
      
      // Update player streaks
      await updatePlayerStreaks(input.playerId, game.id, input, grade);
      
      // Update challenge progress
      await updateChallengeProgressForPlayer(input.playerId, input, grade, input.date);
      
      // Update progressive skill badges
      const skillBadgeUpdates = await updateSkillBadges(input.playerId, input);
      
      // Create feed activity for skill badge upgrades
      for (const upgrade of skillBadgeUpdates.newLevels) {
        const skillDef = SKILL_BADGE_TYPES[upgrade.skill as keyof typeof SKILL_BADGE_TYPES];
        const levelNames: Record<string, string> = {
          brick: 'Brick',
          bronze: 'Bronze',
          silver: 'Silver',
          gold: 'Gold',
          platinum: 'Platinum',
          hall_of_fame: 'Hall of Fame',
          legend: 'Legend',
          goat: 'GOAT'
        };
        await storage.createFeedActivity({
          activityType: 'badge',
          playerId: input.playerId,
          gameId: game.id,
          headline: `${player?.name || 'Player'} unlocked ${levelNames[upgrade.level]} ${skillDef?.name || upgrade.skill}!`,
          subtext: `Career milestone reached`,
        });
      }
      
      // Create feed activity for the game (player already fetched above)
      await storage.createFeedActivity({
        activityType: 'game',
        playerId: input.playerId,
        gameId: game.id,
        headline: `${player?.name || 'Player'} dropped ${input.points} PTS vs ${input.opponent}`,
        subtext: `Grade: ${grade} | ${input.rebounds} REB, ${input.assists} AST`,
      });
      
      // Create feed activities for badges earned
      const badgeNames: Record<string, string> = {
        twenty_piece: "20-Piece",
        thirty_bomb: "30-Bomb",
        double_double: "Double-Double",
        triple_double: "Triple-Double",
        ironman: "Ironman",
        efficiency_master: "Efficiency Master",
        lockdown: "Lockdown Defender",
        hustle_king: "Hustle King",
        clean_sheet: "Clean Sheet",
        sharpshooter: "Sharpshooter",
        hot_streak_3: "Hot Streak (3 Games)",
        hot_streak_5: "Hot Streak (5 Games)",
      };
      for (const badge of awardedBadges) {
        await storage.createFeedActivity({
          activityType: 'badge',
          playerId: input.playerId,
          gameId: game.id,
          headline: `${player?.name || 'Player'} earned the ${badgeNames[badge] || badge} badge!`,
          subtext: `Achievement unlocked vs ${input.opponent}`,
        });
      }
      
      // --- XP Rewards ---
      let xpEarned = XP_REWARDS.game_logged;
      
      // Grade bonuses
      if (grade === 'A+') xpEarned += XP_REWARDS.a_plus_grade;
      else if (grade.startsWith('A')) xpEarned += XP_REWARDS.a_grade;
      
      // Badge bonuses
      xpEarned += awardedBadges.length * XP_REWARDS.badge_earned;
      
      // Award XP and check for tier promotion
      const { player: updatedPlayer, newTier } = await storage.addPlayerXp(input.playerId, xpEarned);
      
      // Award tier promotion badge if promoted
      if (newTier) {
        let tierBadge: string | null = null;
        if (newTier === "Starter") tierBadge = "tier_starter";
        else if (newTier === "All-Star") tierBadge = "tier_allstar";
        else if (newTier === "MVP") tierBadge = "tier_mvp";
        else if (newTier === "Hall of Fame") tierBadge = "tier_hof";
        
        if (tierBadge) {
          await storage.createBadge({ playerId: input.playerId, badgeType: tierBadge, gameId: game.id });
          await storage.createFeedActivity({
            activityType: 'badge',
            playerId: input.playerId,
            gameId: game.id,
            headline: `${player?.name || 'Player'} reached ${newTier} tier!`,
            subtext: `Tier promotion earned with ${updatedPlayer.totalXp} XP`,
          });
        }
      }
      
      // Update activity streak
      await updateActivityStreak(input.playerId, 'daily_game');
      
      // Check for performance alerts (drop detection)
      await checkPerformanceAlerts(input.playerId, game.id, input, grade);
      
      // Calculate advanced metrics for the game
      const advancedMetrics = calculateAdvancedMetrics(input);
      
      res.status(201).json({ 
        ...game, 
        xpEarned, 
        newTier, 
        totalXp: updatedPlayer.totalXp, 
        currentTier: updatedPlayer.currentTier,
        advancedMetrics 
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // --- Player Badges ---

  app.get('/api/players/:id/badges', async (req, res) => {
    const playerId = Number(req.params.id);
    const player = await storage.getPlayer(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    const badges = await storage.getPlayerBadges(playerId);
    res.json(badges);
  });

  // --- Skill Badges (Progressive) ---
  
  app.get('/api/players/:id/skill-badges', async (req, res) => {
    const playerId = Number(req.params.id);
    const player = await storage.getPlayer(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    const skillBadges = await storage.getPlayerSkillBadges(playerId);
    
    // Enrich with badge definitions
    const enrichedBadges = skillBadges.map(badge => {
      const def = SKILL_BADGE_TYPES[badge.skillType as keyof typeof SKILL_BADGE_TYPES];
      return {
        ...badge,
        name: def?.name || badge.skillType,
        description: def?.description || '',
        thresholds: def?.thresholds || {},
      };
    });
    
    // Also return badges that don't exist yet (show all possible skill badges)
    const existingTypes = skillBadges.map(b => b.skillType);
    const allBadges = Object.entries(SKILL_BADGE_TYPES).map(([type, def]) => {
      const existing = enrichedBadges.find(b => b.skillType === type);
      if (existing) return existing;
      return {
        id: 0,
        playerId,
        skillType: type,
        currentLevel: 'none',
        careerValue: 0,
        name: def.name,
        description: def.description,
        thresholds: def.thresholds,
      };
    });
    
    res.json(allBadges);
  });

  // --- Goals ---

  app.get('/api/players/:id/goals', async (req, res) => {
    const playerId = Number(req.params.id);
    const player = await storage.getPlayer(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    const goals = await storage.getPlayerGoals(playerId);
    res.json(goals);
  });

  app.post('/api/players/:id/goals', async (req, res) => {
    try {
      const playerId = Number(req.params.id);
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: 'Player not found' });
      }
      
      const input = insertGoalSchema.parse({ ...req.body, playerId });
      const goal = await storage.createGoal(input);
      res.status(201).json(goal);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.patch('/api/goals/:id', async (req, res) => {
    const goalId = Number(req.params.id);
    const updates = req.body;
    const updatedGoal = await storage.updateGoal(goalId, updates);
    if (!updatedGoal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.json(updatedGoal);
  });

  app.delete('/api/goals/:id', async (req, res) => {
    const goalId = Number(req.params.id);
    await storage.deleteGoal(goalId);
    res.status(204).send();
  });

  // --- Streaks ---

  app.get('/api/players/:id/streaks', async (req, res) => {
    const playerId = Number(req.params.id);
    const player = await storage.getPlayer(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    const streaks = await storage.getPlayerStreaks(playerId);
    res.json(streaks);
  });

  // --- Activity Streaks (for daily activity tracking) ---

  app.get('/api/players/:id/activity-streaks', async (req, res) => {
    const playerId = Number(req.params.id);
    const player = await storage.getPlayer(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    const activityStreaks = await storage.getPlayerActivityStreaks(playerId);
    res.json(activityStreaks);
  });

  app.post('/api/players/:id/activity', async (req, res) => {
    const playerId = Number(req.params.id);
    const { streakType = 'daily_login' } = req.body;
    
    const player = await storage.getPlayer(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    
    // Check if already recorded activity today BEFORE updating streak
    const existingStreak = await storage.getOrCreateActivityStreak(playerId, streakType);
    const today = new Date().toISOString().split('T')[0];
    const alreadyActiveToday = existingStreak.lastActivityDate === today;
    
    const result = await updateActivityStreak(playerId, streakType);
    
    // Award daily login XP only if this is first activity today
    if (!alreadyActiveToday) {
      await storage.addPlayerXp(playerId, XP_REWARDS.daily_login);
    }
    
    const updatedPlayer = await storage.getPlayer(playerId);
    
    res.json({
      streakCount: result.streakCount,
      isNewMilestone: result.isNewMilestone,
      milestoneReached: result.milestoneReached,
      totalXp: updatedPlayer?.totalXp || 0,
      currentTier: updatedPlayer?.currentTier || 'Rookie',
      xpAwarded: alreadyActiveToday ? 0 : XP_REWARDS.daily_login,
    });
  });

  // --- Player Progression (XP & Tier) ---

  app.get('/api/players/:id/progression', async (req, res) => {
    const playerId = Number(req.params.id);
    const player = await storage.getPlayer(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    
    const activityStreaks = await storage.getPlayerActivityStreaks(playerId);
    const dailyStreak = activityStreaks.find(s => s.streakType === 'daily_login') || 
                        activityStreaks.find(s => s.streakType === 'daily_game') || 
                        { currentStreak: 0, longestStreak: 0 };
    
    // Use shared tier thresholds from schema
    const tiers = ['Rookie', 'Starter', 'All-Star', 'MVP', 'Hall of Fame'] as const;
    const thresholds = [
      TIER_THRESHOLDS.Rookie,
      TIER_THRESHOLDS.Starter,
      TIER_THRESHOLDS['All-Star'],
      TIER_THRESHOLDS.MVP,
      TIER_THRESHOLDS['Hall of Fame']
    ];
    const currentTierIndex = tiers.indexOf(player.currentTier as typeof tiers[number]);
    const nextTierIndex = Math.min(currentTierIndex + 1, tiers.length - 1);
    const xpToNextTier = currentTierIndex < tiers.length - 1 
      ? thresholds[nextTierIndex] - (player.totalXp || 0)
      : 0;
    const progressPercent = currentTierIndex < tiers.length - 1
      ? Math.min(100, Math.round(((player.totalXp || 0) - thresholds[currentTierIndex]) / 
          (thresholds[nextTierIndex] - thresholds[currentTierIndex]) * 100))
      : 100;
    
    res.json({
      playerId: player.id,
      playerName: player.name,
      totalXp: player.totalXp || 0,
      currentTier: player.currentTier,
      nextTier: currentTierIndex < tiers.length - 1 ? tiers[nextTierIndex] : null,
      xpToNextTier,
      progressPercent,
      currentStreak: dailyStreak.currentStreak,
      longestStreak: dailyStreak.longestStreak,
      tierThresholds: TIER_THRESHOLDS,
    });
  });

  // --- Likes ---

  app.post('/api/games/:id/likes', async (req, res) => {
    const gameId = Number(req.params.id);
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    const game = await storage.getGame(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    const hasLiked = await storage.hasUserLiked(gameId, sessionId);
    if (hasLiked) {
      await storage.deleteLike(gameId, sessionId);
      const likeCount = await storage.getGameLikes(gameId);
      return res.json({ liked: false, likeCount });
    } else {
      await storage.createLike({ gameId, sessionId });
      const likeCount = await storage.getGameLikes(gameId);
      return res.json({ liked: true, likeCount });
    }
  });

  app.get('/api/games/:id/likes', async (req, res) => {
    const gameId = Number(req.params.id);
    const sessionId = req.query.sessionId as string | undefined;

    const game = await storage.getGame(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    const likeCount = await storage.getGameLikes(gameId);
    const hasLiked = sessionId ? await storage.hasUserLiked(gameId, sessionId) : false;

    res.json({ likeCount, hasLiked });
  });

  // --- Comments ---

  app.get('/api/games/:id/comments', async (req, res) => {
    const gameId = Number(req.params.id);
    const game = await storage.getGame(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    const comments = await storage.getGameComments(gameId);
    res.json(comments);
  });

  app.post('/api/games/:id/comments', async (req, res) => {
    try {
      const gameId = Number(req.params.id);
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: 'Game not found' });
      }

      const input = insertCommentSchema.parse({ ...req.body, gameId });
      const comment = await storage.createComment(input);
      res.status(201).json(comment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete('/api/comments/:id', async (req, res) => {
    const commentId = Number(req.params.id);
    const sessionId = req.query.sessionId as string;

    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    const comment = await storage.getComment(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.sessionId !== sessionId) {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }

    await storage.deleteComment(commentId);
    res.status(204).send();
  });

  // --- Endorsements ---

  app.post('/api/endorsements', requiresCoach, async (req: any, res) => {
    try {
      const coachUserId = req.user.claims.sub;
      const { playerId, title, message, skills } = req.body;

      if (!playerId || !title || !message) {
        return res.status(400).json({ message: 'playerId, title, and message are required' });
      }

      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: 'Player not found' });
      }

      const endorsement = await storage.createEndorsement({
        coachUserId,
        playerId,
        title,
        message,
        skills: skills ? JSON.stringify(skills) : null,
      });

      // Create notification for player
      if (player.userId) {
        const coachName = req.caliberUser?.displayName || 'A Coach';
        await storage.createNotification({
          userId: player.userId,
          notificationType: 'endorsement_received',
          title: 'New Endorsement',
          message: `${coachName} endorsed you: ${title}`,
          relatedId: endorsement.id,
          isRead: false,
        });
      }

      res.status(201).json(endorsement);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error('Error creating endorsement:', err);
      res.status(500).json({ message: 'Failed to create endorsement' });
    }
  });

  app.get('/api/players/:playerId/endorsements', async (req, res) => {
    try {
      const playerId = Number(req.params.playerId);

      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: 'Player not found' });
      }

      const endorsements = await storage.getPlayerEndorsements(playerId);
      res.json(endorsements);
    } catch (err) {
      console.error('Error fetching endorsements:', err);
      res.status(500).json({ message: 'Failed to fetch endorsements' });
    }
  });

  app.delete('/api/endorsements/:id', requiresCoach, async (req: any, res) => {
    try {
      const endorsementId = Number(req.params.id);
      const coachUserId = req.user.claims.sub;

      const endorsement = await storage.getEndorsement(endorsementId);

      if (!endorsement) {
        return res.status(404).json({ message: 'Endorsement not found' });
      }

      if (endorsement.coachUserId !== coachUserId) {
        return res.status(403).json({ message: 'You can only delete your own endorsements' });
      }

      await storage.deleteEndorsement(endorsementId);
      res.status(204).send();
    } catch (err) {
      console.error('Error deleting endorsement:', err);
      res.status(500).json({ message: 'Failed to delete endorsement' });
    }
  });

  app.get(api.games.get.path, async (req, res) => {
    const game = await storage.getGame(Number(req.params.id));
    if (!game) return res.status(404).json({ message: "Game not found" });
    res.json(game);
  });

  app.delete(api.games.delete.path, async (req, res) => {
    await storage.deleteGame(Number(req.params.id));
    res.status(204).send();
  });

  // --- Scout Mode ---
  app.get('/api/scout/players', async (req, res) => {
    try {
      const { position, minHeight, minGrade, sortBy } = req.query;
      
      const playersWithStats = await storage.getPlayersWithStats();
      const badges = await Promise.all(
        playersWithStats.map(p => storage.getPlayerBadges(p.id))
      );
      
      // Grade score mapping for filtering and sorting
      const gradeScores: Record<string, number> = {
        'A+': 100, 'A': 95, 'A-': 90,
        'B+': 85, 'B': 80, 'B-': 75,
        'C+': 70, 'C': 65, 'C-': 60,
        'D': 50, 'F': 30
      };

      // Height to inches converter
      const heightToInches = (height: string | null): number => {
        if (!height) return 0;
        const match = height.match(/(\d+)'(\d+)/);
        if (match) {
          return parseInt(match[1]) * 12 + parseInt(match[2]);
        }
        return 0;
      };

      // Calculate stats for each player
      let results = playersWithStats.map((player, idx) => {
        const games = player.games || [];
        const gamesPlayed = games.length;
        
        if (gamesPlayed === 0) {
          return {
            id: player.id,
            name: player.name,
            position: player.position,
            height: player.height,
            team: player.team,
            jerseyNumber: player.jerseyNumber,
            ppg: 0,
            rpg: 0,
            apg: 0,
            avgGrade: null,
            avgGradeScore: 0,
            hustleScore: 50,
            gamesPlayed: 0,
            topBadge: null,
            archetype: null,
            heightInches: heightToInches(player.height),
          };
        }
        
        const archetypeResult = getPlayerArchetype(games, player.position as "Guard" | "Wing" | "Big");
        const archetype = archetypeResult ? ARCHETYPES[archetypeResult.primary].name : null;

        const ppg = games.reduce((acc, g) => acc + g.points, 0) / gamesPlayed;
        const rpg = games.reduce((acc, g) => acc + g.rebounds, 0) / gamesPlayed;
        const apg = games.reduce((acc, g) => acc + g.assists, 0) / gamesPlayed;
        const hustleScore = games.reduce((acc, g) => acc + (g.hustleScore || 50), 0) / gamesPlayed;
        
        const avgGradeScore = games.reduce((acc, g) => acc + (gradeScores[g.grade || 'C'] || 65), 0) / gamesPlayed;
        
        // Map score back to grade label
        let avgGrade = 'C';
        if (avgGradeScore >= 95) avgGrade = 'A';
        else if (avgGradeScore >= 85) avgGrade = 'B+';
        else if (avgGradeScore >= 75) avgGrade = 'B';
        else if (avgGradeScore >= 65) avgGrade = 'C';
        else avgGrade = 'D';

        // Get top badge (most recent notable badge)
        const playerBadges = badges[idx];
        const topBadge = playerBadges.length > 0 ? playerBadges[0].badgeType : null;

        return {
          id: player.id,
          name: player.name,
          position: player.position,
          height: player.height,
          team: player.team,
          jerseyNumber: player.jerseyNumber,
          ppg: Number(ppg.toFixed(1)),
          rpg: Number(rpg.toFixed(1)),
          apg: Number(apg.toFixed(1)),
          avgGrade,
          avgGradeScore,
          hustleScore: Number(hustleScore.toFixed(0)),
          gamesPlayed,
          topBadge,
          archetype,
          heightInches: heightToInches(player.height),
        };
      });

      // Apply filters
      if (position && position !== 'All') {
        results = results.filter(p => p.position === position);
      }

      if (minHeight) {
        const heightRanges: Record<string, { min: number; max: number }> = {
          'under-5-10': { min: 0, max: 69 },
          '5-10-to-6-2': { min: 70, max: 74 },
          '6-2-to-6-6': { min: 74, max: 78 },
          '6-6-plus': { min: 78, max: 999 },
        };
        const range = heightRanges[minHeight as string];
        if (range) {
          results = results.filter(p => p.heightInches >= range.min && p.heightInches <= range.max);
        }
      }

      if (minGrade) {
        if (minGrade === 'A') {
          results = results.filter(p => p.avgGradeScore >= 90);
        } else if (minGrade === 'B+') {
          results = results.filter(p => p.avgGradeScore >= 85);
        }
      }

      // Sort results
      const sortKey = (sortBy as string) || 'avgGradeScore';
      results.sort((a, b) => {
        switch (sortKey) {
          case 'ppg':
            return b.ppg - a.ppg;
          case 'rpg':
            return b.rpg - a.rpg;
          case 'apg':
            return b.apg - a.apg;
          case 'hustleScore':
            return b.hustleScore - a.hustleScore;
          case 'avgGradeScore':
          default:
            return b.avgGradeScore - a.avgGradeScore;
        }
      });

      // Remove internal fields before sending
      const response = results.map(({ avgGradeScore, heightInches, ...rest }) => rest);
      res.json(response);
    } catch (err) {
      console.error('Scout players error:', err);
      res.status(500).json({ message: 'Error fetching scout data' });
    }
  });

  // --- Player Discovery (Public) ---
  app.get('/api/discover', async (req, res) => {
    try {
      const { position, state, school, graduationYear, search, openOnly } = req.query;
      
      const playersWithStats = await storage.getPlayersWithStats();
      
      // Grade score mapping for filtering and sorting
      const gradeScores: Record<string, number> = {
        'A+': 100, 'A': 95, 'A-': 90,
        'B+': 85, 'B': 80, 'B-': 75,
        'C+': 70, 'C': 65, 'C-': 60,
        'D': 50, 'F': 30
      };

      // Calculate stats for each player
      let results = await Promise.all(playersWithStats.map(async (player) => {
        const games = player.games || [];
        const gamesPlayed = games.length;
        
        // Fetch highlight and badge counts in parallel
        const [highlightCount, badgeCount] = await Promise.all([
          storage.getPlayerHighlightCount(player.id),
          storage.getPlayerBadgeCount(player.id),
        ]);
        
        if (gamesPlayed === 0) {
          return {
            id: player.id,
            name: player.name,
            position: player.position,
            height: player.height,
            team: player.team,
            photoUrl: player.photoUrl,
            city: player.city,
            state: player.state,
            school: player.school,
            graduationYear: player.graduationYear,
            currentTier: player.currentTier || 'Rookie',
            ppg: 0,
            rpg: 0,
            apg: 0,
            avgGrade: null,
            avgGradeScore: 0,
            gamesPlayed: 0,
            openToOpportunities: player.openToOpportunities || false,
            highlightCount,
            badgeCount,
          };
        }

        const ppg = games.reduce((acc, g) => acc + g.points, 0) / gamesPlayed;
        const rpg = games.reduce((acc, g) => acc + g.rebounds, 0) / gamesPlayed;
        const apg = games.reduce((acc, g) => acc + g.assists, 0) / gamesPlayed;
        
        const avgGradeScore = games.reduce((acc, g) => acc + (gradeScores[g.grade || 'C'] || 65), 0) / gamesPlayed;
        
        // Map score back to grade label
        let avgGrade = 'C';
        if (avgGradeScore >= 95) avgGrade = 'A';
        else if (avgGradeScore >= 85) avgGrade = 'B+';
        else if (avgGradeScore >= 75) avgGrade = 'B';
        else if (avgGradeScore >= 65) avgGrade = 'C';
        else avgGrade = 'D';

        return {
          id: player.id,
          name: player.name,
          position: player.position,
          height: player.height,
          team: player.team,
          photoUrl: player.photoUrl,
          city: player.city,
          state: player.state,
          school: player.school,
          graduationYear: player.graduationYear,
          currentTier: player.currentTier || 'Rookie',
          ppg: Number(ppg.toFixed(1)),
          rpg: Number(rpg.toFixed(1)),
          apg: Number(apg.toFixed(1)),
          avgGrade,
          avgGradeScore,
          gamesPlayed,
          openToOpportunities: player.openToOpportunities || false,
          highlightCount,
          badgeCount,
        };
      }));

      // Apply filters
      if (position && position !== 'All') {
        results = results.filter(p => p.position === position);
      }

      if (state && state !== 'All') {
        results = results.filter(p => p.state === state);
      }

      if (school && school !== 'All') {
        results = results.filter(p => p.school?.toLowerCase().includes((school as string).toLowerCase()));
      }

      if (graduationYear && graduationYear !== 'All') {
        const year = parseInt(graduationYear as string, 10);
        if (!isNaN(year)) {
          results = results.filter(p => p.graduationYear === year);
        }
      }

      if (search && typeof search === 'string' && search.trim()) {
        const searchLower = search.toLowerCase().trim();
        results = results.filter(p => 
          p.name.toLowerCase().includes(searchLower) ||
          p.school?.toLowerCase().includes(searchLower) ||
          p.team?.toLowerCase().includes(searchLower)
        );
      }

      // Filter for open to opportunities only
      if (openOnly === 'true') {
        results = results.filter(p => p.openToOpportunities);
      }

      // Sort by avgGradeScore by default (descending)
      results.sort((a, b) => b.avgGradeScore - a.avgGradeScore);

      // Remove internal fields before sending
      const response = results.map(({ avgGradeScore, ...rest }) => rest);
      res.json(response);
    } catch (err) {
      console.error('Discover players error:', err);
      res.status(500).json({ message: 'Error fetching discover data' });
    }
  });

  app.get(api.analytics.leaderboard.path, async (req, res) => {
    const playersList = await storage.getPlayers();
    const leaderboard = await Promise.all(playersList.map(async (p) => {
      const fullPlayer = await storage.getPlayer(p.id);
      const playerGames = fullPlayer?.games || [];
      const avgPoints = playerGames.length > 0 
        ? playerGames.reduce((acc, g) => acc + g.points, 0) / playerGames.length 
        : 0;
      
      // Calculate avg grade score for sorting
      const gradeScores: Record<string, number> = {
        'A+': 97, 'A': 94, 'A-': 90,
        'B+': 87, 'B': 84, 'B-': 80,
        'C+': 77, 'C': 74, 'C-': 70,
        'D': 65, 'F': 55
      };
      
      const avgGradeScore = playerGames.length > 0
        ? playerGames.reduce((acc, g) => acc + (gradeScores[g.grade || 'C'] || 70), 0) / playerGames.length
        : 0;

      // Inverse map back to a grade label for the leaderboard
      let avgGrade = 'C';
      if (avgGradeScore >= 90) avgGrade = 'A';
      else if (avgGradeScore >= 80) avgGrade = 'B';
      else if (avgGradeScore >= 70) avgGrade = 'C';
      else if (avgGradeScore >= 60) avgGrade = 'D';
      else avgGrade = 'F';

      return {
        playerId: p.id,
        name: p.name,
        team: p.team,
        jerseyNumber: p.jerseyNumber,
        avgPoints: Number(avgPoints.toFixed(1)),
        avgGrade,
        avgGradeScore,
        gamesPlayed: playerGames.length
      };
    }));

    // Sort by avg grade score descending
    leaderboard.sort((a, b) => b.avgGradeScore - a.avgGradeScore);

    res.json(leaderboard.map(({ avgGradeScore, ...rest }) => rest));
  });

  // Head-to-Head Comparison (Premium Feature)
  app.get(api.analytics.compare.path, requiresSubscription, async (req: any, res) => {
    const { player1Id, player2Id } = api.analytics.compare.input.parse(req.query);
    const p1 = await storage.getPlayer(player1Id);
    const p2 = await storage.getPlayer(player2Id);
    
    if (!p1 || !p2) {
      return res.status(404).json({ message: "One or both players not found" });
    }

    res.json({ player1: p1, player2: p2 });
  });

  // Team Comparison - Get unique teams list
  app.get('/api/teams/list', async (req, res) => {
    try {
      const allPlayers = await storage.getPlayers();
      const uniqueTeams = Array.from(new Set(allPlayers.map(p => p.team).filter(Boolean))) as string[];
      res.json(uniqueTeams.sort());
    } catch (err) {
      console.error('Get teams list error:', err);
      res.status(500).json({ message: 'Error fetching teams' });
    }
  });

  // Team Comparison - Get team stats with players
  app.get('/api/teams/:teamName/stats', async (req, res) => {
    try {
      const teamName = decodeURIComponent(req.params.teamName);
      const allPlayers = await storage.getPlayers();
      const teamPlayers = allPlayers.filter(p => p.team === teamName);
      
      if (teamPlayers.length === 0) {
        return res.status(404).json({ message: 'Team not found' });
      }

      // Get detailed stats for each player
      const playersWithStats = await Promise.all(teamPlayers.map(async (player) => {
        const fullPlayer = await storage.getPlayer(player.id);
        const games = fullPlayer?.games || [];
        
        const totalPoints = games.reduce((acc, g) => acc + g.points, 0);
        const totalRebounds = games.reduce((acc, g) => acc + g.rebounds, 0);
        const totalAssists = games.reduce((acc, g) => acc + g.assists, 0);
        const totalFgMade = games.reduce((acc, g) => acc + g.fgMade, 0);
        const totalFgAttempted = games.reduce((acc, g) => acc + g.fgAttempted, 0);
        const totalThreeMade = games.reduce((acc, g) => acc + g.threeMade, 0);
        const totalThreeAttempted = games.reduce((acc, g) => acc + g.threeAttempted, 0);
        const gamesPlayed = games.length;

        // Calculate average grade
        const gradeScores: Record<string, number> = {
          'A+': 97, 'A': 94, 'A-': 90,
          'B+': 87, 'B': 84, 'B-': 80,
          'C+': 77, 'C': 74, 'C-': 70,
          'D': 65, 'F': 55
        };
        const avgGradeScore = gamesPlayed > 0
          ? games.reduce((acc, g) => acc + (gradeScores[g.grade || 'C'] || 70), 0) / gamesPlayed
          : 0;

        let avgGrade = 'C';
        if (avgGradeScore >= 90) avgGrade = 'A';
        else if (avgGradeScore >= 80) avgGrade = 'B';
        else if (avgGradeScore >= 70) avgGrade = 'C';
        else if (avgGradeScore >= 60) avgGrade = 'D';
        else avgGrade = 'F';

        return {
          id: player.id,
          name: player.name,
          position: player.position,
          jerseyNumber: player.jerseyNumber,
          gamesPlayed,
          ppg: gamesPlayed > 0 ? Number((totalPoints / gamesPlayed).toFixed(1)) : 0,
          rpg: gamesPlayed > 0 ? Number((totalRebounds / gamesPlayed).toFixed(1)) : 0,
          apg: gamesPlayed > 0 ? Number((totalAssists / gamesPlayed).toFixed(1)) : 0,
          totalPoints,
          totalRebounds,
          totalAssists,
          totalFgMade,
          totalFgAttempted,
          totalThreeMade,
          totalThreeAttempted,
          avgGrade,
          avgGradeScore
        };
      }));

      // Calculate team aggregate stats
      const totalGames = playersWithStats.reduce((acc, p) => acc + p.gamesPlayed, 0);
      const teamStats = {
        teamName,
        playerCount: playersWithStats.length,
        totalGames,
        avgPPG: Number((playersWithStats.reduce((acc, p) => acc + p.ppg, 0) / playersWithStats.length).toFixed(1)),
        avgRPG: Number((playersWithStats.reduce((acc, p) => acc + p.rpg, 0) / playersWithStats.length).toFixed(1)),
        avgAPG: Number((playersWithStats.reduce((acc, p) => acc + p.apg, 0) / playersWithStats.length).toFixed(1)),
        totalPoints: playersWithStats.reduce((acc, p) => acc + p.totalPoints, 0),
        totalRebounds: playersWithStats.reduce((acc, p) => acc + p.totalRebounds, 0),
        totalAssists: playersWithStats.reduce((acc, p) => acc + p.totalAssists, 0),
        fgPct: (() => {
          const made = playersWithStats.reduce((acc, p) => acc + p.totalFgMade, 0);
          const attempted = playersWithStats.reduce((acc, p) => acc + p.totalFgAttempted, 0);
          return attempted > 0 ? Number(((made / attempted) * 100).toFixed(1)) : 0;
        })(),
        threePct: (() => {
          const made = playersWithStats.reduce((acc, p) => acc + p.totalThreeMade, 0);
          const attempted = playersWithStats.reduce((acc, p) => acc + p.totalThreeAttempted, 0);
          return attempted > 0 ? Number(((made / attempted) * 100).toFixed(1)) : 0;
        })(),
        avgGradeScore: playersWithStats.length > 0 
          ? playersWithStats.reduce((acc, p) => acc + p.avgGradeScore, 0) / playersWithStats.length 
          : 0,
        players: playersWithStats.sort((a, b) => b.avgGradeScore - a.avgGradeScore)
      };

      // Calculate avg grade from score
      let avgGrade = 'C';
      if (teamStats.avgGradeScore >= 90) avgGrade = 'A';
      else if (teamStats.avgGradeScore >= 80) avgGrade = 'B';
      else if (teamStats.avgGradeScore >= 70) avgGrade = 'C';
      else if (teamStats.avgGradeScore >= 60) avgGrade = 'D';
      else avgGrade = 'F';

      res.json({ ...teamStats, avgGrade });
    } catch (err) {
      console.error('Get team stats error:', err);
      res.status(500).json({ message: 'Error fetching team stats' });
    }
  });

  // Video Analysis Endpoint (Premium Feature)
  app.post('/api/analyze-video', requiresSubscription, upload.single('video'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No video file uploaded' });
      }

      const playerName = req.body.playerName || 'Unknown Player';
      const filePath = req.file.path;

      // Read video file and convert to base64
      const videoBuffer = fs.readFileSync(filePath);
      const base64Video = videoBuffer.toString('base64');
      const mimeType = req.file.mimetype;

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      // Analyze video with Gemini
      const prompt = `You are a professional basketball scout and advanced analytics expert analyzing game footage. 
      
Watch this basketball video clip carefully and track stats for the player: "${playerName}"

Count and report ONLY what you can clearly see in the video:
- Points scored (count each basket: 2 for regular shots, 3 for three-pointers, 1 for free throws)
- Assists (passes that directly lead to made baskets)
- Rebounds (grabbing the ball after a missed shot)
- Steals (taking the ball from opponent)
- Blocks (swatting away opponent's shot)
- Turnovers (losing the ball to opponent)
- Field goals made/attempted
- Three pointers made/attempted
- Free throws made/attempted

Calculate these ADVANCED METRICS (AI-calculated based on what you observe):

1. HUSTLE SCORE (0-100): Based on:
   - Sprint-backs on defense
   - Diving for loose balls
   - Boxing out effort
   - Contesting every shot
   - Running the floor hard
   - Communicating on defense

2. DEFENSIVE EFFICIENCY (0-100): Based on:
   - Staying in defensive stance
   - Help defense rotation
   - Closeout technique
   - Contesting shots without fouling
   - Forcing difficult shots
   - Defensive rebounds secured

3. PLUS/MINUS: Estimate the point differential while this player was on court. If you can see score changes, calculate net points. Otherwise estimate based on impact observed (-20 to +20 range).

4. PLAYER EFFICIENCY RATING (PER): Calculate using the formula:
   PER = (Points + Rebounds + Assists + Steals + Blocks - Turnovers - Missed FG - Missed FT) / Minutes * 15
   If minutes unknown, assume 20 minutes. Return a value typically between 5-35.

Respond in this exact JSON format:
{
  "playerName": "${playerName}",
  "stats": {
    "points": 0,
    "rebounds": 0,
    "assists": 0,
    "steals": 0,
    "blocks": 0,
    "turnovers": 0,
    "fgMade": 0,
    "fgAttempted": 0,
    "threeMade": 0,
    "threeAttempted": 0,
    "ftMade": 0,
    "ftAttempted": 0,
    "hustleScore": 50,
    "defenseRating": 50,
    "plusMinus": 0,
    "per": 15.0
  },
  "observations": "Brief scouting notes about what you observed",
  "confidence": "high/medium/low - how confident you are in the stats"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Video
                }
              }
            ]
          }
        ]
      });

      const responseText = response.text || '';
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return res.status(500).json({ 
          error: 'Could not parse AI response',
          rawResponse: responseText 
        });
      }

      const analysisResult = JSON.parse(jsonMatch[0]);
      res.json(analysisResult);

    } catch (error: any) {
      console.error('Video analysis error:', error);
      res.status(500).json({ 
        error: 'Failed to analyze video',
        message: error.message 
      });
    }
  });

  // Text-based play analysis (for manual play-by-play input) - Premium Feature
  app.post('/api/analyze-plays', requiresSubscription, async (req: any, res) => {
    try {
      const { playerName, playByPlay } = req.body;

      if (!playByPlay) {
        return res.status(400).json({ error: 'Play-by-play text is required' });
      }

      const prompt = `You are a basketball statistician and advanced analytics expert. Analyze these play-by-play notes and extract stats for player "${playerName || 'the player'}".

Play-by-play notes:
${playByPlay}

Count stats mentioned or implied:
- Points, rebounds, assists, steals, blocks, turnovers
- Field goals made/attempted, three pointers made/attempted, free throws made/attempted

Calculate these ADVANCED METRICS based on the play-by-play description:

1. HUSTLE SCORE (0-100): Based on mentions of:
   - Diving for loose balls, hustle plays
   - Defensive effort, closeouts
   - Running the floor, boxing out
   - Extra effort plays

2. DEFENSIVE EFFICIENCY (0-100): Based on:
   - Defensive stops mentioned
   - Forced turnovers, contested shots
   - Help defense plays
   - Overall defensive impact

3. PLUS/MINUS: Estimate from game context. If the game score or period scores are mentioned, calculate net points. Otherwise estimate based on positive/negative plays described (-20 to +20 range).

4. PLAYER EFFICIENCY RATING (PER): Calculate using:
   PER = (Points + Rebounds + Assists + Steals + Blocks - Turnovers - Missed FG - Missed FT) / Minutes * 15
   If minutes not mentioned, assume 20. Return value typically 5-35.

Respond in this exact JSON format:
{
  "playerName": "${playerName || 'Unknown'}",
  "stats": {
    "points": 0,
    "rebounds": 0,
    "assists": 0,
    "steals": 0,
    "blocks": 0,
    "turnovers": 0,
    "fgMade": 0,
    "fgAttempted": 0,
    "threeMade": 0,
    "threeAttempted": 0,
    "ftMade": 0,
    "ftAttempted": 0,
    "hustleScore": 50,
    "defenseRating": 50,
    "plusMinus": 0,
    "per": 15.0
  },
  "observations": "Summary of the player's performance"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });

      const responseText = response.text || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        return res.status(500).json({ error: 'Could not parse AI response' });
      }

      res.json(JSON.parse(jsonMatch[0]));
    } catch (error: any) {
      console.error('Play analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze plays', message: error.message });
    }
  });

  // --- Challenges ---

  app.get('/api/challenges', async (req, res) => {
    try {
      const activeChallenges = await storage.getActiveChallenges();
      res.json(activeChallenges);
    } catch (err) {
      console.error('Get challenges error:', err);
      res.status(500).json({ message: 'Error fetching challenges' });
    }
  });

  app.get('/api/challenges/all', async (req, res) => {
    try {
      const allChallenges = await storage.getChallenges();
      res.json(allChallenges);
    } catch (err) {
      console.error('Get all challenges error:', err);
      res.status(500).json({ message: 'Error fetching all challenges' });
    }
  });

  app.get('/api/challenges/:id', async (req, res) => {
    try {
      const challengeId = Number(req.params.id);
      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) {
        return res.status(404).json({ message: 'Challenge not found' });
      }
      const leaderboard = await storage.getChallengeLeaderboard(challengeId);
      res.json({ challenge, leaderboard });
    } catch (err) {
      console.error('Get challenge error:', err);
      res.status(500).json({ message: 'Error fetching challenge' });
    }
  });

  app.get('/api/players/:id/challenges', async (req, res) => {
    try {
      const playerId = Number(req.params.id);
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: 'Player not found' });
      }
      const progress = await storage.getPlayerChallengeProgress(playerId);
      res.json(progress);
    } catch (err) {
      console.error('Get player challenges error:', err);
      res.status(500).json({ message: 'Error fetching player challenge progress' });
    }
  });

  app.post('/api/challenges', requiresCoach, async (req, res) => {
    try {
      // Convert date strings to Date objects for validation
      const body = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      };
      const input = insertChallengeSchema.parse(body);
      const challenge = await storage.createChallenge(input);
      res.status(201).json(challenge);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error('Create challenge error:', err);
      res.status(500).json({ message: 'Error creating challenge' });
    }
  });

  // --- Head-to-Head Challenges ---

  app.post('/api/challenges/head-to-head', isAuthenticated, async (req: any, res) => {
    try {
      const createH2HSchema = z.object({
        challengerPlayerId: z.number().min(1),
        opponentPlayerId: z.number().min(1),
        metric: z.string().min(1),
        targetValue: z.number().optional(),
      });
      
      const input = createH2HSchema.parse(req.body);
      
      // Validate both players exist
      const challenger = await storage.getPlayer(input.challengerPlayerId);
      const opponent = await storage.getPlayer(input.opponentPlayerId);
      
      if (!challenger || !opponent) {
        return res.status(404).json({ message: 'One or both players not found' });
      }
      
      if (input.challengerPlayerId === input.opponentPlayerId) {
        return res.status(400).json({ message: 'Cannot challenge yourself' });
      }
      
      // Set expiration to 30 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      const challenge = await storage.createHeadToHeadChallenge({
        challengerPlayerId: input.challengerPlayerId,
        opponentPlayerId: input.opponentPlayerId,
        metric: input.metric,
        targetValue: input.targetValue,
        status: 'pending',
        expiresAt,
      });
      
      // Create notification for opponent
      await storage.createNotification({
        playerId: input.opponentPlayerId,
        notificationType: 'challenge_invite',
        title: `${challenger.name} challenged you!`,
        message: `${challenger.name} challenged you to beat their ${input.metric} stat. Accept to compete!`,
        relatedId: challenge.id,
        isRead: false,
      });
      
      res.status(201).json(challenge);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error('Create head-to-head challenge error:', err);
      res.status(500).json({ message: 'Error creating challenge' });
    }
  });

  app.get('/api/challenges/head-to-head', isAuthenticated, async (req: any, res) => {
    try {
      const playerId = Number(req.query.playerId);
      if (!playerId) {
        return res.status(400).json({ message: 'playerId query parameter required' });
      }
      
      const challenges = await storage.getPlayerChallenges(playerId);
      res.json(challenges);
    } catch (err) {
      console.error('Get player head-to-head challenges error:', err);
      res.status(500).json({ message: 'Error fetching challenges' });
    }
  });

  app.get('/api/challenges/head-to-head/pending', isAuthenticated, async (req: any, res) => {
    try {
      const playerId = Number(req.query.playerId);
      if (!playerId) {
        return res.status(400).json({ message: 'playerId query parameter required' });
      }
      
      const challenges = await storage.getPendingChallenges(playerId);
      res.json(challenges);
    } catch (err) {
      console.error('Get pending challenges error:', err);
      res.status(500).json({ message: 'Error fetching pending challenges' });
    }
  });

  app.post('/api/challenges/head-to-head/:id/accept', isAuthenticated, async (req: any, res) => {
    try {
      const challengeId = Number(req.params.id);
      const challenge = await storage.getHeadToHeadChallenge(challengeId);
      
      if (!challenge) {
        return res.status(404).json({ message: 'Challenge not found' });
      }
      
      if (challenge.status !== 'pending') {
        return res.status(400).json({ message: 'Challenge is no longer pending' });
      }
      
      const updated = await storage.updateChallengeStatus(challengeId, 'accepted');
      
      // Notify challenger
      const opponent = await storage.getPlayer(challenge.opponentPlayerId);
      const challenger = await storage.getPlayer(challenge.challengerPlayerId);
      if (opponent && challenger) {
        await storage.createNotification({
          playerId: challenge.challengerPlayerId,
          notificationType: 'challenge_accept',
          title: `${opponent.name} accepted your challenge!`,
          message: `${opponent.name} accepted your ${challenge.metric} challenge. The competition is on!`,
          relatedId: challengeId,
          isRead: false,
        });
      }
      
      res.json(updated);
    } catch (err) {
      console.error('Accept challenge error:', err);
      res.status(500).json({ message: 'Error accepting challenge' });
    }
  });

  app.post('/api/challenges/head-to-head/:id/decline', isAuthenticated, async (req: any, res) => {
    try {
      const challengeId = Number(req.params.id);
      const challenge = await storage.getHeadToHeadChallenge(challengeId);
      
      if (!challenge) {
        return res.status(404).json({ message: 'Challenge not found' });
      }
      
      if (challenge.status !== 'pending') {
        return res.status(400).json({ message: 'Challenge is no longer pending' });
      }
      
      const updated = await storage.updateChallengeStatus(challengeId, 'declined');
      
      // Notify challenger
      const opponent = await storage.getPlayer(challenge.opponentPlayerId);
      if (opponent) {
        await storage.createNotification({
          playerId: challenge.challengerPlayerId,
          notificationType: 'challenge_decline',
          title: `${opponent.name} declined your challenge`,
          message: `${opponent.name} has declined your challenge.`,
          relatedId: challengeId,
          isRead: false,
        });
      }
      
      res.json(updated);
    } catch (err) {
      console.error('Decline challenge error:', err);
      res.status(500).json({ message: 'Error declining challenge' });
    }
  });

  app.post('/api/challenges/head-to-head/:id/submit', isAuthenticated, async (req: any, res) => {
    try {
      const challengeId = Number(req.params.id);
      const submitSchema = z.object({
        playerId: z.number().min(1),
        gameId: z.number().min(1),
      });
      
      const input = submitSchema.parse(req.body);
      const challenge = await storage.getHeadToHeadChallenge(challengeId);
      
      if (!challenge) {
        return res.status(404).json({ message: 'Challenge not found' });
      }
      
      if (challenge.status !== 'accepted') {
        return res.status(400).json({ message: 'Challenge must be accepted to submit results' });
      }
      
      // Get the game to verify it exists
      const game = await storage.getGame(input.gameId);
      if (!game) {
        return res.status(404).json({ message: 'Game not found' });
      }
      
      // Determine which player submitted and where to store the game ID
      let updatedChallenge;
      if (input.playerId === challenge.challengerPlayerId) {
        // Update challenger's game ID
        const [updated] = await db
          .update(headToHeadChallenges)
          .set({ challengerGameId: input.gameId })
          .where(eq(headToHeadChallenges.id, challengeId))
          .returning();
        updatedChallenge = updated;
        
        // If opponent also submitted, determine winner
        if (challenge.opponentGameId) {
          const opponentGame = await storage.getGame(challenge.opponentGameId);
          if (!opponentGame) {
            return res.status(404).json({ message: 'Opponent game not found' });
          }
          
          const metricValue = game[challenge.metric as keyof typeof game] as number | null;
          const opponentMetricValue = opponentGame[challenge.metric as keyof typeof opponentGame] as number | null;
          
          if (metricValue === null || metricValue === undefined || opponentMetricValue === null || opponentMetricValue === undefined) {
            return res.status(400).json({ message: `Metric ${challenge.metric} not found in one or both games` });
          }
          
          let winnerId = undefined;
          if (metricValue > opponentMetricValue) {
            winnerId = challenge.challengerPlayerId;
          } else if (opponentMetricValue > metricValue) {
            winnerId = challenge.opponentPlayerId;
          }
          
          const completed = await storage.updateChallengeStatus(challengeId, 'completed', winnerId);
          
          // Notify both players about result
          const challenger = await storage.getPlayer(challenge.challengerPlayerId);
          const opponent = await storage.getPlayer(challenge.opponentPlayerId);
          
          if (winnerId === challenge.challengerPlayerId && challenger && opponent) {
            await storage.createNotification({
              playerId: challenge.challengerPlayerId,
              notificationType: 'challenge_result',
              title: 'You won the challenge!',
              message: `You defeated ${opponent.name} in the ${challenge.metric} challenge!`,
              relatedId: challengeId,
              isRead: false,
            });
            await storage.createNotification({
              playerId: challenge.opponentPlayerId,
              notificationType: 'challenge_result',
              title: `${challenger.name} won the challenge`,
              message: `${challenger.name} beat you ${metricValue} to ${opponentMetricValue} in ${challenge.metric}`,
              relatedId: challengeId,
              isRead: false,
            });
          } else if (winnerId === challenge.opponentPlayerId && challenger && opponent) {
            await storage.createNotification({
              playerId: challenge.opponentPlayerId,
              notificationType: 'challenge_result',
              title: 'You won the challenge!',
              message: `You defeated ${challenger.name} in the ${challenge.metric} challenge!`,
              relatedId: challengeId,
              isRead: false,
            });
            await storage.createNotification({
              playerId: challenge.challengerPlayerId,
              notificationType: 'challenge_result',
              title: `${opponent.name} won the challenge`,
              message: `${opponent.name} beat you ${opponentMetricValue} to ${metricValue} in ${challenge.metric}`,
              relatedId: challengeId,
              isRead: false,
            });
          } else if (!winnerId && challenger && opponent) {
            // Tie
            await storage.createNotification({
              playerId: challenge.challengerPlayerId,
              notificationType: 'challenge_result',
              title: 'Challenge ended in a tie!',
              message: `You tied with ${opponent.name} at ${metricValue} ${challenge.metric}!`,
              relatedId: challengeId,
              isRead: false,
            });
            await storage.createNotification({
              playerId: challenge.opponentPlayerId,
              notificationType: 'challenge_result',
              title: 'Challenge ended in a tie!',
              message: `You tied with ${challenger.name} at ${metricValue} ${challenge.metric}!`,
              relatedId: challengeId,
              isRead: false,
            });
          }
          
          return res.json(completed);
        }
      } else if (input.playerId === challenge.opponentPlayerId) {
        // Update opponent's game ID
        const [updated] = await db
          .update(headToHeadChallenges)
          .set({ opponentGameId: input.gameId })
          .where(eq(headToHeadChallenges.id, challengeId))
          .returning();
        updatedChallenge = updated;
        
        // If challenger also submitted, determine winner
        if (challenge.challengerGameId) {
          const challengerGame = await storage.getGame(challenge.challengerGameId);
          if (!challengerGame) {
            return res.status(404).json({ message: 'Challenger game not found' });
          }
          
          const metricValue = game[challenge.metric as keyof typeof game] as number | null;
          const challengerMetricValue = challengerGame[challenge.metric as keyof typeof challengerGame] as number | null;
          
          if (metricValue === null || metricValue === undefined || challengerMetricValue === null || challengerMetricValue === undefined) {
            return res.status(400).json({ message: `Metric ${challenge.metric} not found in one or both games` });
          }
          
          let winnerId = undefined;
          if (metricValue > challengerMetricValue) {
            winnerId = challenge.opponentPlayerId;
          } else if (challengerMetricValue > metricValue) {
            winnerId = challenge.challengerPlayerId;
          }
          
          const completed = await storage.updateChallengeStatus(challengeId, 'completed', winnerId);
          
          // Notify both players about result
          const challenger = await storage.getPlayer(challenge.challengerPlayerId);
          const opponent = await storage.getPlayer(challenge.opponentPlayerId);
          
          if (winnerId === challenge.opponentPlayerId && challenger && opponent) {
            await storage.createNotification({
              playerId: challenge.opponentPlayerId,
              notificationType: 'challenge_result',
              title: 'You won the challenge!',
              message: `You defeated ${challenger.name} in the ${challenge.metric} challenge!`,
              relatedId: challengeId,
              isRead: false,
            });
            await storage.createNotification({
              playerId: challenge.challengerPlayerId,
              notificationType: 'challenge_result',
              title: `${opponent.name} won the challenge`,
              message: `${opponent.name} beat you ${metricValue} to ${challengerMetricValue} in ${challenge.metric}`,
              relatedId: challengeId,
              isRead: false,
            });
          } else if (winnerId === challenge.challengerPlayerId && challenger && opponent) {
            await storage.createNotification({
              playerId: challenge.challengerPlayerId,
              notificationType: 'challenge_result',
              title: 'You won the challenge!',
              message: `You defeated ${opponent.name} in the ${challenge.metric} challenge!`,
              relatedId: challengeId,
              isRead: false,
            });
            await storage.createNotification({
              playerId: challenge.opponentPlayerId,
              notificationType: 'challenge_result',
              title: `${challenger.name} won the challenge`,
              message: `${challenger.name} beat you ${challengerMetricValue} to ${metricValue} in ${challenge.metric}`,
              relatedId: challengeId,
              isRead: false,
            });
          } else if (!winnerId && challenger && opponent) {
            // Tie
            await storage.createNotification({
              playerId: challenge.opponentPlayerId,
              notificationType: 'challenge_result',
              title: 'Challenge ended in a tie!',
              message: `You tied with ${challenger.name} at ${metricValue} ${challenge.metric}!`,
              relatedId: challengeId,
              isRead: false,
            });
            await storage.createNotification({
              playerId: challenge.challengerPlayerId,
              notificationType: 'challenge_result',
              title: 'Challenge ended in a tie!',
              message: `You tied with ${opponent.name} at ${metricValue} ${challenge.metric}!`,
              relatedId: challengeId,
              isRead: false,
            });
          }
          
          return res.json(completed);
        }
      } else {
        return res.status(403).json({ message: 'You are not part of this challenge' });
      }
      
      res.json(updatedChallenge);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error('Submit challenge result error:', err);
      res.status(500).json({ message: 'Error submitting challenge result' });
    }
  });

  // --- Teams ---

  function generateTeamCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  app.post('/api/teams', isAuthenticated, async (req, res) => {
    try {
      const createTeamSchema = z.object({
        name: z.string().min(1),
        sessionId: z.string().min(1),
        displayName: z.string().min(1),
      });
      const input = createTeamSchema.parse(req.body);

      let code = generateTeamCode();
      let existingTeam = await storage.getTeamByCode(code);
      while (existingTeam) {
        code = generateTeamCode();
        existingTeam = await storage.getTeamByCode(code);
      }

      const team = await storage.createTeam({ name: input.name, code, createdBy: input.sessionId });
      await storage.addTeamMember({
        teamId: team.id,
        displayName: input.displayName,
        sessionId: input.sessionId,
        role: 'admin',
        playerId: null,
      });

      res.status(201).json(team);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error('Create team error:', err);
      res.status(500).json({ message: 'Error creating team' });
    }
  });

  app.patch('/api/teams/:id/profile-picture', isAuthenticated, async (req, res) => {
    try {
      const teamId = Number(req.params.id);
      const updateSchema = z.object({
        sessionId: z.string().min(1),
        profilePicture: z.string().nullable(),
      });
      const input = updateSchema.parse(req.body);

      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }

      if (team.createdBy !== input.sessionId) {
        return res.status(403).json({ message: 'Only the team leader can update the profile picture' });
      }

      const updatedTeam = await storage.updateTeam(teamId, { profilePicture: input.profilePicture });
      res.json(updatedTeam);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error('Update team profile picture error:', err);
      res.status(500).json({ message: 'Error updating team profile picture' });
    }
  });

  app.get('/api/teams/:code', async (req, res) => {
    try {
      const team = await storage.getTeamByCode(req.params.code);
      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }
      const members = await storage.getTeamMembers(team.id);
      res.json({ ...team, memberCount: members.length });
    } catch (err) {
      console.error('Get team error:', err);
      res.status(500).json({ message: 'Error fetching team' });
    }
  });

  app.post('/api/teams/:id/join', isAuthenticated, async (req, res) => {
    try {
      const joinTeamSchema = z.object({
        sessionId: z.string().min(1),
        displayName: z.string().min(1),
        role: z.enum(['member', 'coach']).optional().default('member'),
      });
      const input = joinTeamSchema.parse(req.body);
      
      const teamId = Number(req.params.id);
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }

      const existingMember = await storage.getTeamMember(teamId, input.sessionId);
      if (existingMember) {
        return res.status(400).json({ message: 'Already a member of this team' });
      }

      const member = await storage.addTeamMember({
        teamId,
        displayName: input.displayName,
        sessionId: input.sessionId,
        role: input.role,
        playerId: null,
      });

      res.status(201).json(member);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error('Join team error:', err);
      res.status(500).json({ message: 'Error joining team' });
    }
  });

  app.get('/api/teams/:id/members', async (req, res) => {
    try {
      const teamId = Number(req.params.id);
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }
      const members = await storage.getTeamMembers(teamId);
      res.json(members);
    } catch (err) {
      console.error('Get team members error:', err);
      res.status(500).json({ message: 'Error fetching team members' });
    }
  });

  app.get('/api/teams/:id/posts', async (req, res) => {
    try {
      const teamId = Number(req.params.id);
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }
      const posts = await storage.getTeamPosts(teamId);
      res.json(posts);
    } catch (err) {
      console.error('Get team posts error:', err);
      res.status(500).json({ message: 'Error fetching team posts' });
    }
  });

  app.post('/api/teams/:id/posts', isAuthenticated, async (req, res) => {
    try {
      const createPostSchema = z.object({
        sessionId: z.string().min(1),
        content: z.string().min(1),
        postType: z.enum(['announcement', 'practice', 'chat', 'general']).optional().default('general'),
        practiceTime: z.string().optional(),
        practiceLocation: z.string().optional(),
        isPinned: z.boolean().optional().default(false),
      });
      const input = createPostSchema.parse(req.body);
      
      const teamId = Number(req.params.id);
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }

      const member = await storage.getTeamMember(teamId, input.sessionId);
      if (!member) {
        return res.status(403).json({ message: 'You must be a member to post' });
      }

      // Only coaches can pin posts or create announcements
      if ((input.isPinned || input.postType === 'announcement') && member.role !== 'coach') {
        return res.status(403).json({ message: 'Only coaches can pin posts or create announcements' });
      }

      const post = await storage.createTeamPost({
        teamId,
        authorId: member.id,
        content: input.content,
        postType: input.postType,
        practiceTime: input.practiceTime ? new Date(input.practiceTime) : null,
        practiceLocation: input.practiceLocation || null,
        isPinned: input.isPinned,
      });

      res.status(201).json({ ...post, authorName: member.displayName });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error('Create team post error:', err);
      res.status(500).json({ message: 'Error creating post' });
    }
  });

  // Team post comments
  app.get('/api/teams/:teamId/posts/:postId/comments', async (req, res) => {
    try {
      const postId = Number(req.params.postId);
      const comments = await storage.getTeamPostComments(postId);
      res.json(comments);
    } catch (err) {
      console.error('Get team post comments error:', err);
      res.status(500).json({ message: 'Error fetching comments' });
    }
  });

  app.post('/api/teams/:teamId/posts/:postId/comments', isAuthenticated, async (req, res) => {
    try {
      const createCommentSchema = z.object({
        sessionId: z.string().min(1),
        content: z.string().min(1),
      });
      const input = createCommentSchema.parse(req.body);
      
      const teamId = Number(req.params.teamId);
      const postId = Number(req.params.postId);

      const member = await storage.getTeamMember(teamId, input.sessionId);
      if (!member) {
        return res.status(403).json({ message: 'You must be a team member to comment' });
      }

      const comment = await storage.createTeamPostComment({
        postId,
        authorId: member.id,
        content: input.content,
      });

      res.status(201).json({ ...comment, authorName: member.displayName });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error('Create team post comment error:', err);
      res.status(500).json({ message: 'Error creating comment' });
    }
  });

  app.delete('/api/teams/:teamId/posts/:postId', isAuthenticated, async (req, res) => {
    try {
      const sessionId = req.query.sessionId as string;
      if (!sessionId) {
        return res.status(400).json({ message: 'SessionId is required' });
      }

      const teamId = Number(req.params.teamId);
      const postId = Number(req.params.postId);

      const member = await storage.getTeamMember(teamId, sessionId);
      if (!member) {
        return res.status(403).json({ message: 'You must be a team member' });
      }

      // Only coaches or post authors can delete posts
      const posts = await storage.getTeamPosts(teamId);
      const post = posts.find(p => p.id === postId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      if (post.authorId !== member.id && member.role !== 'coach') {
        return res.status(403).json({ message: 'You can only delete your own posts' });
      }

      await storage.deleteTeamPost(postId);
      res.status(204).send();
    } catch (err) {
      console.error('Delete team post error:', err);
      res.status(500).json({ message: 'Error deleting post' });
    }
  });

  app.get('/api/my-teams', isAuthenticated, async (req, res) => {
    try {
      const sessionId = req.query.sessionId as string;
      if (!sessionId) {
        return res.status(400).json({ message: 'SessionId is required' });
      }
      const teams = await storage.getTeamsBySessionId(sessionId);
      res.json(teams);
    } catch (err) {
      console.error('Get my teams error:', err);
      res.status(500).json({ message: 'Error fetching teams' });
    }
  });

  // === NEWSFEED / ACTIVITY STREAM ===
  app.get('/api/feed', async (req, res) => {
    try {
      const limit = Number(req.query.limit) || 50;
      const activities = await storage.getFeedActivities(limit);
      res.json(activities);
    } catch (err) {
      console.error('Get feed error:', err);
      res.status(500).json({ message: 'Error fetching feed' });
    }
  });

  app.get('/api/players/:id/feed', async (req, res) => {
    try {
      const playerId = Number(req.params.id);
      const activities = await storage.getPlayerFeedActivities(playerId);
      res.json(activities);
    } catch (err) {
      console.error('Get player feed error:', err);
      res.status(500).json({ message: 'Error fetching player feed' });
    }
  });

  app.get('/api/feed/following', isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      if (!user.playerId) {
        return res.json([]);
      }
      
      const limit = Number(req.query.limit) || 50;
      const activities = await storage.getFollowingFeedActivities(user.playerId, limit);
      res.json(activities);
    } catch (err) {
      console.error('Get following feed error:', err);
      res.status(500).json({ message: 'Error fetching following feed' });
    }
  });

  app.get('/api/feed/team', isAuthenticated, async (req: any, res) => {
    try {
      const sessionId = req.query.sessionId as string;
      if (!sessionId) {
        return res.status(400).json({ message: 'SessionId is required' });
      }
      
      const limit = Number(req.query.limit) || 50;
      const activities = await storage.getTeamFeedActivities(sessionId, limit);
      res.json(activities);
    } catch (err) {
      console.error('Get team feed error:', err);
      res.status(500).json({ message: 'Error fetching team feed' });
    }
  });

  // === REPOSTS ===
  app.post('/api/games/:id/repost', async (req, res) => {
    try {
      const gameId = Number(req.params.id);
      const { sessionId, comment } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ message: 'SessionId is required' });
      }

      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: 'Game not found' });
      }

      const alreadyReposted = await storage.hasUserReposted(gameId, sessionId);
      if (alreadyReposted) {
        return res.status(400).json({ message: 'Already reposted' });
      }

      const repost = await storage.createRepost({ gameId, sessionId, comment });
      
      // Create feed activity for repost
      const player = await storage.getPlayer(game.playerId);
      await storage.createFeedActivity({
        activityType: 'repost',
        playerId: game.playerId,
        gameId,
        headline: `${player?.name || 'Someone'}'s game was reposted!`,
        subtext: comment || `${game.points} PTS, ${game.rebounds} REB vs ${game.opponent}`,
        sessionId,
      });

      res.status(201).json(repost);
    } catch (err) {
      console.error('Repost error:', err);
      res.status(500).json({ message: 'Error creating repost' });
    }
  });

  app.get('/api/games/:id/reposts', async (req, res) => {
    try {
      const gameId = Number(req.params.id);
      const count = await storage.getGameReposts(gameId);
      res.json({ count });
    } catch (err) {
      console.error('Get reposts error:', err);
      res.status(500).json({ message: 'Error fetching reposts' });
    }
  });

  app.get('/api/games/:id/has-reposted', async (req, res) => {
    try {
      const gameId = Number(req.params.id);
      const sessionId = req.query.sessionId as string;
      if (!sessionId) {
        return res.json({ hasReposted: false });
      }
      const hasReposted = await storage.hasUserReposted(gameId, sessionId);
      res.json({ hasReposted });
    } catch (err) {
      console.error('Check repost error:', err);
      res.status(500).json({ message: 'Error checking repost' });
    }
  });

  // === POLLS ===
  app.get('/api/polls', async (req, res) => {
    try {
      const sessionId = req.query.sessionId as string;
      const polls = await storage.getActivePolls();
      
      const enrichedPolls = await Promise.all(polls.map(async (poll) => {
        const votes = await storage.getPollVotes(poll.id);
        const voteCounts = poll.options.map((_, index) => {
          const voteData = votes.find(v => v.optionIndex === index);
          return voteData ? Number(voteData.count) : 0;
        });
        const totalVotes = voteCounts.reduce((a, b) => a + b, 0);
        
        let hasVoted = false;
        let userVote: number | undefined;
        if (sessionId) {
          const userVoteData = await storage.getUserPollVote(poll.id, sessionId);
          if (userVoteData) {
            hasVoted = true;
            userVote = userVoteData.optionIndex;
          }
        }
        
        return {
          ...poll,
          voteCounts,
          totalVotes,
          hasVoted,
          userVote,
        };
      }));
      
      res.json(enrichedPolls);
    } catch (err) {
      console.error('Get polls error:', err);
      res.status(500).json({ message: 'Error fetching polls' });
    }
  });

  app.post('/api/polls', async (req, res) => {
    try {
      const { question, options, createdBy, playerId, expiresAt } = req.body;
      
      if (!question || !options || options.length < 2 || !createdBy) {
        return res.status(400).json({ message: 'Question, at least 2 options, and createdBy are required' });
      }

      const poll = await storage.createPoll({
        question,
        options,
        createdBy,
        playerId: playerId || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      });

      // Create feed activity
      await storage.createFeedActivity({
        activityType: 'poll',
        playerId: playerId || null,
        relatedId: poll.id,
        headline: `New Poll: ${question}`,
        subtext: `${options.length} options to choose from`,
      });

      res.status(201).json(poll);
    } catch (err) {
      console.error('Create poll error:', err);
      res.status(500).json({ message: 'Error creating poll' });
    }
  });

  app.get('/api/polls/:id', async (req, res) => {
    try {
      const pollId = Number(req.params.id);
      const poll = await storage.getPoll(pollId);
      if (!poll) {
        return res.status(404).json({ message: 'Poll not found' });
      }
      const votes = await storage.getPollVotes(pollId);
      res.json({ ...poll, votes });
    } catch (err) {
      console.error('Get poll error:', err);
      res.status(500).json({ message: 'Error fetching poll' });
    }
  });

  app.post('/api/polls/:id/vote', async (req, res) => {
    try {
      const pollId = Number(req.params.id);
      const { sessionId, optionIndex } = req.body;

      if (!sessionId || optionIndex === undefined) {
        return res.status(400).json({ message: 'SessionId and optionIndex are required' });
      }

      const poll = await storage.getPoll(pollId);
      if (!poll) {
        return res.status(404).json({ message: 'Poll not found' });
      }

      if (optionIndex < 0 || optionIndex >= poll.options.length) {
        return res.status(400).json({ message: 'Invalid option index' });
      }

      const hasVoted = await storage.hasUserVoted(pollId, sessionId);
      if (hasVoted) {
        return res.status(400).json({ message: 'Already voted' });
      }

      await storage.votePoll({ pollId, optionIndex, sessionId });
      const votes = await storage.getPollVotes(pollId);
      res.json({ success: true, votes });
    } catch (err) {
      console.error('Vote poll error:', err);
      res.status(500).json({ message: 'Error voting' });
    }
  });

  app.get('/api/polls/:id/has-voted', async (req, res) => {
    try {
      const pollId = Number(req.params.id);
      const sessionId = req.query.sessionId as string;
      if (!sessionId) {
        return res.json({ hasVoted: false });
      }
      const hasVoted = await storage.hasUserVoted(pollId, sessionId);
      res.json({ hasVoted });
    } catch (err) {
      console.error('Check vote error:', err);
      res.status(500).json({ message: 'Error checking vote' });
    }
  });

  // === PREDICTIONS ===
  app.get('/api/predictions', async (req, res) => {
    try {
      const sessionId = req.query.sessionId as string;
      const predictions = await storage.getPredictions();
      
      const enrichedPredictions = await Promise.all(predictions.map(async (prediction) => {
        const votes = await storage.getPredictionVotes(prediction.id);
        const totalVotes = votes.player1Votes + votes.player2Votes;
        
        let hasVoted = false;
        let userVote: number | undefined;
        if (sessionId) {
          const userVoteData = await storage.getUserPredictionVote(prediction.id, sessionId);
          if (userVoteData) {
            hasVoted = true;
            userVote = userVoteData.votedFor;
          }
        }
        
        return {
          ...prediction,
          player1Votes: votes.player1Votes,
          player2Votes: votes.player2Votes,
          totalVotes,
          hasVoted,
          userVote,
        };
      }));
      
      res.json(enrichedPredictions);
    } catch (err) {
      console.error('Get predictions error:', err);
      res.status(500).json({ message: 'Error fetching predictions' });
    }
  });

  app.post('/api/predictions', async (req, res) => {
    try {
      const { player1Id, player2Id, category, createdBy, sessionId, gameDate } = req.body;

      if (!player1Id || !player2Id || !category || !createdBy) {
        return res.status(400).json({ message: 'player1Id, player2Id, category, and createdBy are required' });
      }

      if (player1Id === player2Id) {
        return res.status(400).json({ message: 'Cannot predict against same player' });
      }

      const prediction = await storage.createPrediction({
        player1Id,
        player2Id,
        category,
        createdBy,
        sessionId: sessionId || null,
        gameDate: gameDate || null,
      });

      // Get player names for feed
      const player1 = await storage.getPlayer(player1Id);
      const player2 = await storage.getPlayer(player2Id);

      await storage.createFeedActivity({
        activityType: 'prediction',
        relatedId: prediction.id,
        headline: `Matchup Prediction: ${player1?.name || 'Player 1'} vs ${player2?.name || 'Player 2'}`,
        subtext: `Who will dominate in ${category}? Vote now!`,
        sessionId: sessionId || null,
      });

      res.status(201).json(prediction);
    } catch (err) {
      console.error('Create prediction error:', err);
      res.status(500).json({ message: 'Error creating prediction' });
    }
  });

  app.post('/api/predictions/:id/vote', async (req, res) => {
    try {
      const predictionId = Number(req.params.id);
      const { sessionId, votedFor } = req.body;

      if (!sessionId || !votedFor) {
        return res.status(400).json({ message: 'SessionId and votedFor are required' });
      }

      const prediction = await storage.getPrediction(predictionId);
      if (!prediction) {
        return res.status(404).json({ message: 'Prediction not found' });
      }

      if (votedFor !== prediction.player1Id && votedFor !== prediction.player2Id) {
        return res.status(400).json({ message: 'Invalid vote target' });
      }

      const hasVoted = await storage.hasUserVotedPrediction(predictionId, sessionId);
      if (hasVoted) {
        return res.status(400).json({ message: 'Already voted' });
      }

      await storage.votePrediction({ predictionId, votedFor, sessionId });
      const votes = await storage.getPredictionVotes(predictionId);
      res.json({ success: true, ...votes });
    } catch (err) {
      console.error('Vote prediction error:', err);
      res.status(500).json({ message: 'Error voting' });
    }
  });

  app.get('/api/predictions/:id/votes', async (req, res) => {
    try {
      const predictionId = Number(req.params.id);
      const votes = await storage.getPredictionVotes(predictionId);
      res.json(votes);
    } catch (err) {
      console.error('Get prediction votes error:', err);
      res.status(500).json({ message: 'Error fetching votes' });
    }
  });

  // === STORY TEMPLATES ===
  app.get('/api/story-templates', async (req, res) => {
    try {
      const templates = await storage.getActiveStoryTemplates();
      res.json(templates);
    } catch (err) {
      console.error('Get story templates error:', err);
      res.status(500).json({ message: 'Error fetching templates' });
    }
  });

  // === PLAYER STORIES ===
  app.get('/api/stories', async (req, res) => {
    try {
      const limit = Number(req.query.limit) || 20;
      const stories = await storage.getPublicStories(limit);
      res.json(stories);
    } catch (err) {
      console.error('Get stories error:', err);
      res.status(500).json({ message: 'Error fetching stories' });
    }
  });

  // Get active stories (non-expired)
  app.get('/api/stories/active', async (req, res) => {
    try {
      const limit = Number(req.query.limit) || 20;
      const stories = await storage.getActiveStories(limit);
      res.json(stories);
    } catch (err) {
      console.error('Get active stories error:', err);
      res.status(500).json({ message: 'Error fetching active stories' });
    }
  });

  // Get single story
  app.get('/api/stories/:id', async (req, res) => {
    try {
      const story = await storage.getStory(Number(req.params.id));
      if (!story) {
        return res.status(404).json({ message: 'Story not found' });
      }
      res.json(story);
    } catch (err) {
      console.error('Get story error:', err);
      res.status(500).json({ message: 'Error fetching story' });
    }
  });

  app.get('/api/players/:id/stories', async (req, res) => {
    try {
      const playerId = Number(req.params.id);
      const stories = await storage.getPlayerStories(playerId);
      res.json(stories);
    } catch (err) {
      console.error('Get player stories error:', err);
      res.status(500).json({ message: 'Error fetching stories' });
    }
  });

  const VALID_MEDIA_TYPES = ['text', 'image', 'video'];
  
  app.post('/api/stories', async (req, res) => {
    try {
      const { playerId, templateId, headline, stats, sessionId, isPublic, imageUrl, videoUrl, mediaType, caption, expiresIn24h } = req.body;

      if (!playerId || !headline) {
        return res.status(400).json({ message: 'PlayerId and headline are required' });
      }

      // Validate mediaType
      const validatedMediaType = mediaType && VALID_MEDIA_TYPES.includes(mediaType) ? mediaType : 'text';

      // Validate that media URLs are provided when mediaType requires them
      if (validatedMediaType === 'image' && !imageUrl) {
        return res.status(400).json({ message: 'Image URL is required for image stories' });
      }
      if (validatedMediaType === 'video' && !videoUrl) {
        return res.status(400).json({ message: 'Video URL is required for video stories' });
      }

      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: 'Player not found' });
      }

      // Calculate expiry time (24 hours from now if expiresIn24h is true)
      const expiresAt = expiresIn24h ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;

      const story = await storage.createPlayerStory({
        playerId,
        templateId: templateId || null,
        headline,
        stats: stats ? (typeof stats === 'string' ? stats : JSON.stringify(stats)) : null,
        imageUrl: imageUrl || null,
        videoUrl: videoUrl || null,
        mediaType: validatedMediaType,
        caption: caption || null,
        sessionId: sessionId || null,
        isPublic: isPublic !== false,
        expiresAt,
      });

      // Create feed activity for public stories
      if (isPublic !== false) {
        await storage.createFeedActivity({
          activityType: 'story',
          playerId,
          relatedId: story.id,
          headline: `${player.name} posted a story: ${headline}`,
          subtext: validatedMediaType === 'image' ? 'Check out their photo!' : validatedMediaType === 'video' ? 'Watch the video!' : stats ? `Check out their stats!` : undefined,
          sessionId,
        });
      }

      res.status(201).json(story);
    } catch (err) {
      console.error('Create story error:', err);
      res.status(500).json({ message: 'Error creating story' });
    }
  });

  // Delete story (requires authentication)
  app.delete('/api/stories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const storyId = Number(req.params.id);
      const story = await storage.getStory(storyId);
      if (!story) {
        return res.status(404).json({ message: 'Story not found' });
      }
      
      // Check ownership - get player linked to current user
      const userId = req.user?.claims?.sub;
      const userPlayer = userId ? await storage.getPlayerByUserId(userId) : null;
      
      if (!userPlayer || userPlayer.id !== story.playerId) {
        return res.status(403).json({ message: 'Not authorized to delete this story' });
      }
      
      await storage.deleteStory(storyId);
      res.status(204).send();
    } catch (err) {
      console.error('Delete story error:', err);
      res.status(500).json({ message: 'Error deleting story' });
    }
  });

  // Story Views - record a view
  app.post('/api/stories/:id/view', async (req, res) => {
    try {
      const storyId = Number(req.params.id);
      const { sessionId, viewerId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ message: 'SessionId is required' });
      }

      // Check if already viewed
      const hasViewed = await storage.hasViewedStory(storyId, sessionId);
      if (!hasViewed) {
        await storage.createStoryView({ storyId, sessionId, viewerId: viewerId || null });
        await storage.incrementStoryViewCount(storyId);
      }

      res.json({ success: true, alreadyViewed: hasViewed });
    } catch (err) {
      console.error('Record story view error:', err);
      res.status(500).json({ message: 'Error recording view' });
    }
  });

  // Get story views
  app.get('/api/stories/:id/views', async (req, res) => {
    try {
      const storyId = Number(req.params.id);
      const views = await storage.getStoryViews(storyId);
      res.json(views);
    } catch (err) {
      console.error('Get story views error:', err);
      res.status(500).json({ message: 'Error fetching views' });
    }
  });

  // Story Reactions - add a reaction
  const VALID_REACTIONS = ['fire', 'heart', 'clap', 'trophy', 'star', 'goat', 'muscle', '100'];
  
  app.post('/api/stories/:id/reactions', async (req, res) => {
    try {
      const storyId = Number(req.params.id);
      const { sessionId, reactorId, reaction, reactorName } = req.body;

      if (!sessionId || !reaction) {
        return res.status(400).json({ message: 'SessionId and reaction are required' });
      }

      // Validate reaction type
      if (!VALID_REACTIONS.includes(reaction)) {
        return res.status(400).json({ message: 'Invalid reaction type' });
      }

      // Remove existing reaction from this user first
      await storage.removeStoryReaction(storyId, sessionId);

      // Add new reaction
      const newReaction = await storage.createStoryReaction({ storyId, sessionId, reactorId: reactorId || null, reaction });
      
      // Create notification for story owner
      const story = await storage.getStory(storyId);
      if (story && story.playerId) {
        const name = reactorName || 'Someone';
        await storage.createNotification({
          playerId: story.playerId,
          notificationType: 'story_reaction',
          title: 'Story Reaction',
          message: `${name} reacted to your story`,
          relatedId: storyId,
          relatedType: 'story',
        });
      }
      
      res.status(201).json(newReaction);
    } catch (err) {
      console.error('Add story reaction error:', err);
      res.status(500).json({ message: 'Error adding reaction' });
    }
  });

  // Get story reactions with counts
  app.get('/api/stories/:id/reactions', async (req, res) => {
    try {
      const storyId = Number(req.params.id);
      const reactions = await storage.getStoryReactions(storyId);
      const counts = await storage.getReactionCounts(storyId);
      res.json({ reactions, counts });
    } catch (err) {
      console.error('Get story reactions error:', err);
      res.status(500).json({ message: 'Error fetching reactions' });
    }
  });

  // Remove reaction
  app.delete('/api/stories/:id/reactions', async (req, res) => {
    try {
      const storyId = Number(req.params.id);
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ message: 'SessionId is required' });
      }

      await storage.removeStoryReaction(storyId, sessionId);
      res.status(204).send();
    } catch (err) {
      console.error('Remove story reaction error:', err);
      res.status(500).json({ message: 'Error removing reaction' });
    }
  });

  // Story Tags - add tag to story
  app.post('/api/stories/:id/tags', async (req, res) => {
    try {
      const storyId = Number(req.params.id);
      const { taggedPlayerId, taggedPlayerName } = req.body;

      if (!taggedPlayerId) {
        return res.status(400).json({ message: 'taggedPlayerId is required' });
      }

      // Create the tag
      const tag = await storage.addStoryTag({ storyId, taggedPlayerId });

      // Get the story to notify the tagged player
      const story = await storage.getStory(storyId);
      if (story) {
        const storyAuthor = await storage.getPlayer(story.playerId);
        const storyAuthorName = storyAuthor?.name || 'A player';
        
        // Create notification for the tagged player
        await storage.createNotification({
          playerId: taggedPlayerId,
          notificationType: 'story_tag',
          title: 'Tagged in Story',
          message: `${storyAuthorName} tagged you in their story`,
          relatedId: storyId,
          relatedType: 'story',
        });
      }

      res.status(201).json(tag);
    } catch (err) {
      console.error('Add story tag error:', err);
      res.status(500).json({ message: 'Error adding tag' });
    }
  });

  // Get tags for a story
  app.get('/api/stories/:id/tags', async (req, res) => {
    try {
      const storyId = Number(req.params.id);
      const tags = await storage.getStoryTags(storyId);
      
      // Enrich with player data
      const enrichedTags = await Promise.all(
        tags.map(async (tag) => {
          const player = await storage.getPlayer(tag.taggedPlayerId);
          return {
            ...tag,
            taggedPlayerName: player?.name || 'Unknown Player',
            taggedPlayerPhotoUrl: player?.photoUrl || null,
          };
        })
      );
      
      res.json(enrichedTags);
    } catch (err) {
      console.error('Get story tags error:', err);
      res.status(500).json({ message: 'Error fetching tags' });
    }
  });

  // Get stories a player is tagged in
  app.get('/api/players/:playerId/tagged-stories', async (req, res) => {
    try {
      const playerId = Number(req.params.playerId);
      const tags = await storage.getTaggedStories(playerId);
      
      // Enrich with story and author data
      const enrichedTags = await Promise.all(
        tags.map(async (tag) => {
          const story = await storage.getStory(tag.storyId);
          const author = story ? await storage.getPlayer(story.playerId) : null;
          return {
            ...tag,
            story,
            authorName: author?.name || 'Unknown Player',
            authorPhotoUrl: author?.photoUrl || null,
          };
        })
      );
      
      res.json(enrichedTags);
    } catch (err) {
      console.error('Get tagged stories error:', err);
      res.status(500).json({ message: 'Error fetching tagged stories' });
    }
  });

  // Remove tag from story
  app.delete('/api/stories/:id/tags/:taggedPlayerId', async (req, res) => {
    try {
      const storyId = Number(req.params.id);
      const taggedPlayerId = Number(req.params.taggedPlayerId);

      await storage.removeStoryTag(storyId, taggedPlayerId);
      res.status(204).send();
    } catch (err) {
      console.error('Remove story tag error:', err);
      res.status(500).json({ message: 'Error removing tag' });
    }
  });

  // Story Highlights
  app.get('/api/players/:id/highlights', async (req, res) => {
    try {
      const playerId = Number(req.params.id);
      const highlights = await storage.getPlayerHighlights(playerId);
      res.json(highlights);
    } catch (err) {
      console.error('Get player highlights error:', err);
      res.status(500).json({ message: 'Error fetching highlights' });
    }
  });

  app.post('/api/players/:id/highlights', async (req, res) => {
    try {
      const playerId = Number(req.params.id);
      const { title, coverImageUrl, storyIds } = req.body;

      if (!title || !storyIds || !Array.isArray(storyIds)) {
        return res.status(400).json({ message: 'Title and storyIds array are required' });
      }

      const highlight = await storage.createStoryHighlight({
        playerId,
        title,
        coverImageUrl: coverImageUrl || null,
        storyIds: JSON.stringify(storyIds),
      });

      res.status(201).json(highlight);
    } catch (err) {
      console.error('Create highlight error:', err);
      res.status(500).json({ message: 'Error creating highlight' });
    }
  });

  app.delete('/api/highlights/:id', isAuthenticated, async (req: any, res) => {
    try {
      const highlightId = Number(req.params.id);
      const highlight = await storage.getStoryHighlight(highlightId);
      if (!highlight) {
        return res.status(404).json({ message: 'Highlight not found' });
      }
      
      // Check ownership - get player linked to current user
      const userId = req.user?.claims?.sub;
      const userPlayer = userId ? await storage.getPlayerByUserId(userId) : null;
      
      if (!userPlayer || userPlayer.id !== highlight.playerId) {
        return res.status(403).json({ message: 'Not authorized to delete this highlight' });
      }
      
      await storage.deleteStoryHighlight(highlightId);
      res.status(204).send();
    } catch (err) {
      console.error('Delete highlight error:', err);
      res.status(500).json({ message: 'Error deleting highlight' });
    }
  });

  // === COACH ANALYSIS ROUTES ===

  // --- Shots (Shot Charts) --- Premium Feature
  app.post('/api/games/:gameId/shots', requiresSubscription, async (req: any, res) => {
    try {
      const gameId = Number(req.params.gameId);
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }
      const input = insertShotSchema.parse({ ...req.body, gameId, playerId: game.playerId });
      const shot = await storage.createShot(input);
      res.status(201).json(shot);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors[0].message });
      }
      console.error('Create shot error:', err);
      res.status(500).json({ error: 'Error creating shot' });
    }
  });

  app.get('/api/games/:gameId/shots', requiresSubscription, async (req: any, res) => {
    try {
      const gameId = Number(req.params.gameId);
      const shots = await storage.getShotsByGame(gameId);
      res.json(shots);
    } catch (err) {
      console.error('Get shots error:', err);
      res.status(500).json({ error: 'Error fetching shots' });
    }
  });

  app.get('/api/players/:playerId/shots', requiresSubscription, async (req: any, res) => {
    try {
      const playerId = Number(req.params.playerId);
      const shots = await storage.getShotsByPlayer(playerId);
      res.json(shots);
    } catch (err) {
      console.error('Get player shots error:', err);
      res.status(500).json({ error: 'Error fetching shots' });
    }
  });

  app.delete('/api/shots/:id', requiresSubscription, async (req: any, res) => {
    try {
      await storage.deleteShot(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      console.error('Delete shot error:', err);
      res.status(500).json({ error: 'Error deleting shot' });
    }
  });

  // --- Game Notes ---
  app.post('/api/games/:gameId/notes', async (req, res) => {
    try {
      const gameId = Number(req.params.gameId);
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }
      const input = insertGameNoteSchema.parse({ ...req.body, gameId, playerId: game.playerId });
      const note = await storage.createGameNote(input);
      res.status(201).json(note);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors[0].message });
      }
      console.error('Create game note error:', err);
      res.status(500).json({ error: 'Error creating game note' });
    }
  });

  app.get('/api/games/:gameId/notes', async (req, res) => {
    try {
      const gameId = Number(req.params.gameId);
      const notes = await storage.getGameNotes(gameId);
      res.json(notes);
    } catch (err) {
      console.error('Get game notes error:', err);
      res.status(500).json({ error: 'Error fetching notes' });
    }
  });

  app.get('/api/players/:playerId/notes', async (req, res) => {
    try {
      const playerId = Number(req.params.playerId);
      const notes = await storage.getPlayerGameNotes(playerId);
      res.json(notes);
    } catch (err) {
      console.error('Get player notes error:', err);
      res.status(500).json({ error: 'Error fetching notes' });
    }
  });

  app.patch('/api/notes/:id', async (req, res) => {
    try {
      const updateSchema = insertGameNoteSchema.partial();
      const input = updateSchema.parse(req.body);
      const note = await storage.updateGameNote(Number(req.params.id), input);
      res.json(note);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors[0].message });
      }
      console.error('Update note error:', err);
      res.status(500).json({ error: 'Error updating note' });
    }
  });

  app.delete('/api/notes/:id', async (req, res) => {
    try {
      await storage.deleteGameNote(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      console.error('Delete note error:', err);
      res.status(500).json({ error: 'Error deleting note' });
    }
  });

  // --- Practices ---
  app.post('/api/practices', requiresCoachPro, async (req, res) => {
    try {
      const input = insertPracticeSchema.parse(req.body);
      const practice = await storage.createPractice(input);
      
      // Also create a corresponding schedule event for the calendar
      const startTime = new Date(input.date);
      startTime.setHours(9, 0, 0, 0); // Default to 9 AM
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + (input.duration || 60));
      
      await storage.createScheduleEvent({
        eventType: 'practice',
        title: input.title,
        description: input.notes || undefined,
        startTime,
        endTime,
        isRecurring: false,
      });
      
      res.status(201).json(practice);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors[0].message });
      }
      console.error('Create practice error:', err);
      res.status(500).json({ error: 'Error creating practice' });
    }
  });

  app.get('/api/practices', requiresCoachPro, async (req, res) => {
    try {
      const practices = await storage.getPractices();
      res.json(practices);
    } catch (err) {
      console.error('Get practices error:', err);
      res.status(500).json({ error: 'Error fetching practices' });
    }
  });

  app.get('/api/practices/:id', requiresCoachPro, async (req, res) => {
    try {
      const practice = await storage.getPractice(Number(req.params.id));
      if (!practice) {
        return res.status(404).json({ error: 'Practice not found' });
      }
      const attendance = await storage.getPracticeAttendance(practice.id);
      res.json({ ...practice, attendance });
    } catch (err) {
      console.error('Get practice error:', err);
      res.status(500).json({ error: 'Error fetching practice' });
    }
  });

  app.patch('/api/practices/:id', requiresCoachPro, async (req, res) => {
    try {
      const updateSchema = insertPracticeSchema.partial();
      const input = updateSchema.parse(req.body);
      const practice = await storage.updatePractice(Number(req.params.id), input);
      res.json(practice);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors[0].message });
      }
      console.error('Update practice error:', err);
      res.status(500).json({ error: 'Error updating practice' });
    }
  });

  app.delete('/api/practices/:id', requiresCoachPro, async (req, res) => {
    try {
      const practiceId = Number(req.params.id);
      const practice = await storage.getPractice(practiceId);
      
      if (practice) {
        // Delete associated schedule event by matching title and date
        const allEvents = await storage.getAllScheduleEvents();
        const practiceDate = new Date(practice.date);
        const matchingEvent = allEvents.find((event: ScheduleEvent) => 
          event.eventType === 'practice' &&
          event.title === practice.title &&
          new Date(event.startTime).toDateString() === practiceDate.toDateString()
        );
        
        if (matchingEvent) {
          await storage.deleteScheduleEvent(matchingEvent.id);
        }
      }
      
      await storage.deletePractice(practiceId);
      res.status(204).send();
    } catch (err) {
      console.error('Delete practice error:', err);
      res.status(500).json({ error: 'Error deleting practice' });
    }
  });

  // --- Practice Attendance ---
  app.post('/api/practices/:practiceId/attendance', requiresCoachPro, async (req, res) => {
    try {
      const practiceId = Number(req.params.practiceId);
      const practice = await storage.getPractice(practiceId);
      if (!practice) {
        return res.status(404).json({ error: 'Practice not found' });
      }
      const input = insertPracticeAttendanceSchema.parse({ ...req.body, practiceId });
      const attendance = await storage.createPracticeAttendance(input);
      res.status(201).json(attendance);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors[0].message });
      }
      console.error('Create attendance error:', err);
      res.status(500).json({ error: 'Error creating attendance' });
    }
  });

  app.get('/api/practices/:practiceId/attendance', requiresCoachPro, async (req, res) => {
    try {
      const practiceId = Number(req.params.practiceId);
      const attendance = await storage.getPracticeAttendance(practiceId);
      res.json(attendance);
    } catch (err) {
      console.error('Get attendance error:', err);
      res.status(500).json({ error: 'Error fetching attendance' });
    }
  });

  app.get('/api/players/:playerId/attendance', async (req, res) => {
    try {
      const playerId = Number(req.params.playerId);
      const attendance = await storage.getPlayerAttendance(playerId);
      res.json(attendance);
    } catch (err) {
      console.error('Get player attendance error:', err);
      res.status(500).json({ error: 'Error fetching attendance' });
    }
  });

  app.patch('/api/attendance/:id', requiresCoachPro, async (req, res) => {
    try {
      const updateSchema = insertPracticeAttendanceSchema.partial();
      const input = updateSchema.parse(req.body);
      const attendance = await storage.updatePracticeAttendance(Number(req.params.id), input);
      res.json(attendance);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors[0].message });
      }
      console.error('Update attendance error:', err);
      res.status(500).json({ error: 'Error updating attendance' });
    }
  });

  // --- Drills ---
  app.post('/api/drills', requiresCoachPro, async (req, res) => {
    try {
      const input = insertDrillSchema.parse(req.body);
      const drill = await storage.createDrill(input);
      res.status(201).json(drill);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors[0].message });
      }
      console.error('Create drill error:', err);
      res.status(500).json({ error: 'Error creating drill' });
    }
  });

  app.get('/api/drills', requiresCoachPro, async (req, res) => {
    try {
      const drills = await storage.getDrills();
      res.json(drills);
    } catch (err) {
      console.error('Get drills error:', err);
      res.status(500).json({ error: 'Error fetching drills' });
    }
  });

  app.get('/api/drills/category/:category', requiresCoachPro, async (req, res) => {
    try {
      const drills = await storage.getDrillsByCategory(req.params.category);
      res.json(drills);
    } catch (err) {
      console.error('Get drills by category error:', err);
      res.status(500).json({ error: 'Error fetching drills' });
    }
  });

  app.get('/api/drills/:id', requiresCoachPro, async (req, res) => {
    try {
      const drill = await storage.getDrill(Number(req.params.id));
      if (!drill) {
        return res.status(404).json({ error: 'Drill not found' });
      }
      res.json(drill);
    } catch (err) {
      console.error('Get drill error:', err);
      res.status(500).json({ error: 'Error fetching drill' });
    }
  });

  // --- Drill Scores ---
  app.post('/api/practices/:practiceId/drill-scores', requiresCoachPro, async (req, res) => {
    try {
      const practiceId = Number(req.params.practiceId);
      const practice = await storage.getPractice(practiceId);
      if (!practice) {
        return res.status(404).json({ error: 'Practice not found' });
      }
      const input = insertDrillScoreSchema.parse({ ...req.body, practiceId });
      const score = await storage.createDrillScore(input);
      res.status(201).json(score);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors[0].message });
      }
      console.error('Create drill score error:', err);
      res.status(500).json({ error: 'Error creating drill score' });
    }
  });

  app.get('/api/practices/:practiceId/drill-scores', requiresCoachPro, async (req, res) => {
    try {
      const practiceId = Number(req.params.practiceId);
      const scores = await storage.getDrillScoresByPractice(practiceId);
      res.json(scores);
    } catch (err) {
      console.error('Get drill scores error:', err);
      res.status(500).json({ error: 'Error fetching drill scores' });
    }
  });

  app.get('/api/players/:playerId/drill-scores', async (req, res) => {
    try {
      const playerId = Number(req.params.playerId);
      const scores = await storage.getDrillScoresByPlayer(playerId);
      res.json(scores);
    } catch (err) {
      console.error('Get player drill scores error:', err);
      res.status(500).json({ error: 'Error fetching drill scores' });
    }
  });

  // --- Lineups ---
  app.post('/api/lineups', requiresCoachPro, async (req, res) => {
    try {
      const input = insertLineupSchema.parse(req.body);
      const lineup = await storage.createLineup(input);
      res.status(201).json(lineup);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors[0].message });
      }
      console.error('Create lineup error:', err);
      res.status(500).json({ error: 'Error creating lineup' });
    }
  });

  app.get('/api/lineups', requiresCoachPro, async (req, res) => {
    try {
      const lineups = await storage.getLineups();
      res.json(lineups);
    } catch (err) {
      console.error('Get lineups error:', err);
      res.status(500).json({ error: 'Error fetching lineups' });
    }
  });

  app.get('/api/lineups/:id', requiresCoachPro, async (req, res) => {
    try {
      const lineup = await storage.getLineup(Number(req.params.id));
      if (!lineup) {
        return res.status(404).json({ error: 'Lineup not found' });
      }
      const stats = await storage.getLineupStats(lineup.id);
      res.json({ ...lineup, stats });
    } catch (err) {
      console.error('Get lineup error:', err);
      res.status(500).json({ error: 'Error fetching lineup' });
    }
  });

  app.delete('/api/lineups/:id', requiresCoachPro, async (req, res) => {
    try {
      await storage.deleteLineup(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      console.error('Delete lineup error:', err);
      res.status(500).json({ error: 'Error deleting lineup' });
    }
  });

  // --- Lineup Stats ---
  app.post('/api/lineups/:lineupId/stats', requiresCoachPro, async (req, res) => {
    try {
      const lineupId = Number(req.params.lineupId);
      const lineup = await storage.getLineup(lineupId);
      if (!lineup) {
        return res.status(404).json({ error: 'Lineup not found' });
      }
      const input = insertLineupStatSchema.parse({ ...req.body, lineupId });
      const stat = await storage.createLineupStat(input);
      res.status(201).json(stat);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors[0].message });
      }
      console.error('Create lineup stat error:', err);
      res.status(500).json({ error: 'Error creating lineup stat' });
    }
  });

  app.get('/api/lineups/:lineupId/stats', requiresCoachPro, async (req, res) => {
    try {
      const lineupId = Number(req.params.lineupId);
      const stats = await storage.getLineupStats(lineupId);
      res.json(stats);
    } catch (err) {
      console.error('Get lineup stats error:', err);
      res.status(500).json({ error: 'Error fetching lineup stats' });
    }
  });

  app.get('/api/games/:gameId/lineup-stats', async (req, res) => {
    try {
      const gameId = Number(req.params.gameId);
      const stats = await storage.getLineupStatsByGame(gameId);
      res.json(stats);
    } catch (err) {
      console.error('Get game lineup stats error:', err);
      res.status(500).json({ error: 'Error fetching lineup stats' });
    }
  });

  // --- Opponents (Scouting) ---
  app.post('/api/opponents', requiresCoachPro, async (req, res) => {
    try {
      const input = insertOpponentSchema.parse(req.body);
      const opponent = await storage.createOpponent(input);
      res.status(201).json(opponent);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors[0].message });
      }
      console.error('Create opponent error:', err);
      res.status(500).json({ error: 'Error creating opponent' });
    }
  });

  app.get('/api/opponents', requiresCoachPro, async (req, res) => {
    try {
      const opponents = await storage.getOpponents();
      res.json(opponents);
    } catch (err) {
      console.error('Get opponents error:', err);
      res.status(500).json({ error: 'Error fetching opponents' });
    }
  });

  app.get('/api/opponents/:id', requiresCoachPro, async (req, res) => {
    try {
      const opponent = await storage.getOpponent(Number(req.params.id));
      if (!opponent) {
        return res.status(404).json({ error: 'Opponent not found' });
      }
      res.json(opponent);
    } catch (err) {
      console.error('Get opponent error:', err);
      res.status(500).json({ error: 'Error fetching opponent' });
    }
  });

  app.patch('/api/opponents/:id', requiresCoachPro, async (req, res) => {
    try {
      const updateSchema = insertOpponentSchema.partial();
      const input = updateSchema.parse(req.body);
      const opponent = await storage.updateOpponent(Number(req.params.id), input);
      res.json(opponent);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors[0].message });
      }
      console.error('Update opponent error:', err);
      res.status(500).json({ error: 'Error updating opponent' });
    }
  });

  app.delete('/api/opponents/:id', requiresCoachPro, async (req, res) => {
    try {
      await storage.deleteOpponent(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      console.error('Delete opponent error:', err);
      res.status(500).json({ error: 'Error deleting opponent' });
    }
  });

  // --- Alerts ---
  app.get('/api/alerts', requiresCoachPro, async (req, res) => {
    try {
      const playerId = req.query.playerId ? Number(req.query.playerId) : undefined;
      const alerts = await storage.getAlerts(playerId);
      res.json(alerts);
    } catch (err) {
      console.error('Get alerts error:', err);
      res.status(500).json({ error: 'Error fetching alerts' });
    }
  });

  app.get('/api/alerts/unread', requiresCoachPro, async (req, res) => {
    try {
      const alerts = await storage.getUnreadAlerts();
      res.json(alerts);
    } catch (err) {
      console.error('Get unread alerts error:', err);
      res.status(500).json({ error: 'Error fetching alerts' });
    }
  });

  app.patch('/api/alerts/:id/read', requiresCoachPro, async (req, res) => {
    try {
      await storage.markAlertRead(Number(req.params.id));
      res.json({ success: true });
    } catch (err) {
      console.error('Mark alert read error:', err);
      res.status(500).json({ error: 'Error marking alert as read' });
    }
  });

  app.delete('/api/alerts/:id', requiresCoachPro, async (req, res) => {
    try {
      await storage.deleteAlert(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      console.error('Delete alert error:', err);
      res.status(500).json({ error: 'Error deleting alert' });
    }
  });

  app.post('/api/alerts/mark-all-read', requiresCoachPro, async (req, res) => {
    try {
      await storage.markAllAlertsRead();
      res.json({ success: true });
    } catch (err) {
      console.error('Mark all alerts read error:', err);
      res.status(500).json({ error: 'Error marking all alerts as read' });
    }
  });

  // --- Coach Goals (Coach Only) ---
  app.post('/api/coach-goals', requiresCoachPro, async (req, res) => {
    try {
      const input = insertCoachGoalSchema.parse(req.body);
      const goal = await storage.createCoachGoal(input);
      res.status(201).json(goal);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors[0].message });
      }
      console.error('Create coach goal error:', err);
      res.status(500).json({ error: 'Error creating coach goal' });
    }
  });

  app.get('/api/coach-goals', requiresCoachPro, async (req, res) => {
    try {
      const goals = await storage.getAllCoachGoals();
      res.json(goals);
    } catch (err) {
      console.error('Get coach goals error:', err);
      res.status(500).json({ error: 'Error fetching coach goals' });
    }
  });

  app.get('/api/players/:playerId/coach-goals', requiresCoachPro, async (req, res) => {
    try {
      const playerId = Number(req.params.playerId);
      const goals = await storage.getCoachGoals(playerId);
      res.json(goals);
    } catch (err) {
      console.error('Get player coach goals error:', err);
      res.status(500).json({ error: 'Error fetching coach goals' });
    }
  });

  app.patch('/api/coach-goals/:id', requiresCoachPro, async (req, res) => {
    try {
      const updateSchema = insertCoachGoalSchema.partial();
      const input = updateSchema.parse(req.body);
      const goal = await storage.updateCoachGoal(Number(req.params.id), input);
      res.json(goal);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors[0].message });
      }
      console.error('Update coach goal error:', err);
      res.status(500).json({ error: 'Error updating coach goal' });
    }
  });

  app.delete('/api/coach-goals/:id', requiresCoachPro, async (req, res) => {
    try {
      await storage.deleteCoachGoal(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      console.error('Delete coach goal error:', err);
      res.status(500).json({ error: 'Error deleting coach goal' });
    }
  });

  // --- Drill Recommendations ---
  app.post('/api/players/:playerId/drill-recommendations/generate', requiresCoachPro, async (req, res) => {
    try {
      const playerId = Number(req.params.playerId);
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }

      // Analyze player's recent games to find weaknesses
      const recentGames = player.games.slice(0, 10);
      const drills = await storage.getDrills();
      const recommendations: any[] = [];

      if (recentGames.length === 0) {
        return res.json({ message: 'No games to analyze', recommendations: [] });
      }

      // Calculate averages
      const avgPoints = recentGames.reduce((acc, g) => acc + g.points, 0) / recentGames.length;
      const avgRebounds = recentGames.reduce((acc, g) => acc + g.rebounds, 0) / recentGames.length;
      const avgAssists = recentGames.reduce((acc, g) => acc + g.assists, 0) / recentGames.length;
      const avgTurnovers = recentGames.reduce((acc, g) => acc + g.turnovers, 0) / recentGames.length;
      const avgFgPct = recentGames.reduce((acc, g) => {
        const fga = g.fgAttempted || 1;
        return acc + (g.fgMade / fga);
      }, 0) / recentGames.length;
      const avgThreePct = recentGames.reduce((acc, g) => {
        const attempts = g.threeAttempted || 1;
        return acc + (g.threeMade / attempts);
      }, 0) / recentGames.length;

      // Identify weaknesses and recommend drills
      const weaknesses: { stat: string; priority: number; reason: string }[] = [];

      if (avgFgPct < 0.4) {
        weaknesses.push({ stat: 'shooting', priority: 5, reason: `Low FG% (${(avgFgPct * 100).toFixed(1)}%)` });
      }
      if (avgThreePct < 0.3) {
        weaknesses.push({ stat: 'shooting', priority: 4, reason: `Low 3PT% (${(avgThreePct * 100).toFixed(1)}%)` });
      }
      if (avgTurnovers > 3) {
        weaknesses.push({ stat: 'dribbling', priority: 5, reason: `High turnovers (${avgTurnovers.toFixed(1)} per game)` });
      }
      if (player.position === 'Guard' && avgAssists < 3) {
        weaknesses.push({ stat: 'passing', priority: 4, reason: `Low assists for Guard (${avgAssists.toFixed(1)} per game)` });
      }
      if (player.position === 'Big' && avgRebounds < 5) {
        weaknesses.push({ stat: 'rebounding', priority: 4, reason: `Low rebounds for Big (${avgRebounds.toFixed(1)} per game)` });
      }

      // Match drills to weaknesses
      for (const weakness of weaknesses) {
        const matchingDrills = drills.filter(d => d.category === weakness.stat || d.targetStat === weakness.stat);
        for (const drill of matchingDrills.slice(0, 2)) {
          const recommendation = await storage.createDrillRecommendation({
            playerId,
            drillId: drill.id,
            reason: weakness.reason,
            priority: weakness.priority,
            weakStat: weakness.stat,
            isActive: true,
          });
          recommendations.push({ ...recommendation, drill });
        }
      }

      res.status(201).json({ recommendations });
    } catch (err) {
      console.error('Generate recommendations error:', err);
      res.status(500).json({ error: 'Error generating recommendations' });
    }
  });

  app.get('/api/players/:playerId/drill-recommendations', requiresCoachPro, async (req, res) => {
    try {
      const playerId = Number(req.params.playerId);
      const recommendations = await storage.getDrillRecommendations(playerId);
      res.json(recommendations);
    } catch (err) {
      console.error('Get recommendations error:', err);
      res.status(500).json({ error: 'Error fetching recommendations' });
    }
  });

  app.delete('/api/drill-recommendations/:id', requiresCoachPro, async (req, res) => {
    try {
      await storage.deleteDrillRecommendation(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      console.error('Delete recommendation error:', err);
      res.status(500).json({ error: 'Error deleting recommendation' });
    }
  });


  // --- Pre-Game Report --- Premium Feature
  app.get('/api/players/:playerId/pregame-report', requiresSubscription, async (req: any, res) => {
    try {
      const playerId = Number(req.params.playerId);
      const opponentName = req.query.opponent as string;

      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }

      // Recent performance (last 5 games)
      const recentGames = player.games.slice(0, 5);
      const recentStats = {
        gamesPlayed: recentGames.length,
        avgPoints: recentGames.length > 0 ? (recentGames.reduce((acc, g) => acc + g.points, 0) / recentGames.length).toFixed(1) : '0.0',
        avgRebounds: recentGames.length > 0 ? (recentGames.reduce((acc, g) => acc + g.rebounds, 0) / recentGames.length).toFixed(1) : '0.0',
        avgAssists: recentGames.length > 0 ? (recentGames.reduce((acc, g) => acc + g.assists, 0) / recentGames.length).toFixed(1) : '0.0',
        recentGrades: recentGames.map(g => g.grade).filter(Boolean),
      };

      // Games against this opponent
      let opponentMatchups: any[] = [];
      let opponentScoutInfo = null;

      if (opponentName) {
        opponentMatchups = player.games.filter(g =>
          g.opponent.toLowerCase().includes(opponentName.toLowerCase())
        ).slice(0, 5);

        // Get scouting info if available
        const opponents = await storage.getOpponents();
        opponentScoutInfo = opponents.find(o =>
          o.name.toLowerCase().includes(opponentName.toLowerCase())
        );
      }

      // Get coach goals for this player
      const coachGoals = await storage.getCoachGoals(playerId);
      const activeGoals = coachGoals.filter(g => g.status === 'active');

      res.json({
        player: {
          id: player.id,
          name: player.name,
          position: player.position,
          team: player.team,
        },
        recentPerformance: recentStats,
        opponentHistory: {
          matchups: opponentMatchups.map(g => ({
            date: g.date,
            result: g.result,
            points: g.points,
            rebounds: g.rebounds,
            assists: g.assists,
            grade: g.grade,
          })),
          totalGamesVs: opponentMatchups.length,
        },
        scoutingReport: opponentScoutInfo ? {
          name: opponentScoutInfo.name,
          tendencies: opponentScoutInfo.tendencies,
          strengths: opponentScoutInfo.strengths,
          weaknesses: opponentScoutInfo.weaknesses,
        } : null,
        activeCoachGoals: activeGoals.map(g => ({
          title: g.title,
          targetType: g.targetType,
          targetValue: g.targetValue,
          deadline: g.deadline,
        })),
      });
    } catch (err) {
      console.error('Get pregame report error:', err);
      res.status(500).json({ error: 'Error generating pregame report' });
    }
  });

  // --- Report Card --- Premium Feature
  app.get('/api/players/:playerId/report-card', requiresSubscription, async (req: any, res) => {
    try {
      const playerId = Number(req.params.playerId);
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }

      const allGames = player.games || [];
      const badges = await storage.getPlayerBadges(playerId);
      const skillBadges = await storage.getPlayerSkillBadges(playerId);
      const coachGoals = await storage.getCoachGoals(playerId);
      const coachNotes = await storage.getPlayerGameNotes(playerId);

      // Season stats
      const totalGames = allGames.length;
      const seasonStats = {
        gamesPlayed: totalGames,
        totalPoints: allGames.reduce((acc, g) => acc + g.points, 0),
        totalRebounds: allGames.reduce((acc, g) => acc + g.rebounds, 0),
        totalAssists: allGames.reduce((acc, g) => acc + g.assists, 0),
        totalSteals: allGames.reduce((acc, g) => acc + g.steals, 0),
        totalBlocks: allGames.reduce((acc, g) => acc + g.blocks, 0),
        avgPoints: totalGames > 0 ? (allGames.reduce((acc, g) => acc + g.points, 0) / totalGames).toFixed(1) : '0.0',
        avgRebounds: totalGames > 0 ? (allGames.reduce((acc, g) => acc + g.rebounds, 0) / totalGames).toFixed(1) : '0.0',
        avgAssists: totalGames > 0 ? (allGames.reduce((acc, g) => acc + g.assists, 0) / totalGames).toFixed(1) : '0.0',
        avgHustle: totalGames > 0 ? (allGames.reduce((acc, g) => acc + (g.hustleScore || 50), 0) / totalGames).toFixed(0) : '50',
        avgDefense: totalGames > 0 ? (allGames.reduce((acc, g) => acc + (g.defenseRating || 50), 0) / totalGames).toFixed(0) : '50',
      };

      // Grade distribution
      const gradeDistribution: Record<string, number> = {};
      allGames.forEach(g => {
        if (g.grade) {
          gradeDistribution[g.grade] = (gradeDistribution[g.grade] || 0) + 1;
        }
      });

      // Trends (compare first half vs second half of games)
      let trends: any = null;
      if (totalGames >= 4) {
        const mid = Math.floor(totalGames / 2);
        const firstHalf = allGames.slice(mid);
        const secondHalf = allGames.slice(0, mid);

        const avgFirst = (arr: Game[], key: keyof Game) =>
          arr.length > 0 ? arr.reduce((acc, g) => acc + (Number(g[key]) || 0), 0) / arr.length : 0;

        trends = {
          pointsTrend: avgFirst(secondHalf, 'points') - avgFirst(firstHalf, 'points'),
          reboundsTrend: avgFirst(secondHalf, 'rebounds') - avgFirst(firstHalf, 'rebounds'),
          assistsTrend: avgFirst(secondHalf, 'assists') - avgFirst(firstHalf, 'assists'),
          hustleTrend: avgFirst(secondHalf, 'hustleScore') - avgFirst(firstHalf, 'hustleScore'),
        };
      }

      // Recent coach notes
      const recentNotes = coachNotes.slice(0, 5).map(n => ({
        content: n.content,
        noteType: n.noteType,
        authorName: n.authorName,
        createdAt: n.createdAt,
      }));

      res.json({
        player: {
          id: player.id,
          name: player.name,
          position: player.position,
          team: player.team,
          totalXp: player.totalXp,
          currentTier: player.currentTier,
        },
        seasonStats,
        gradeDistribution,
        trends,
        badges: badges.map(b => ({
          badgeType: b.badgeType,
          earnedAt: b.earnedAt,
        })),
        skillBadges: skillBadges.map(sb => ({
          skillType: sb.skillType,
          currentLevel: sb.currentLevel,
          careerValue: sb.careerValue,
        })),
        coachGoals: coachGoals.map(g => ({
          title: g.title,
          status: g.status,
          targetType: g.targetType,
          targetValue: g.targetValue,
          coachFeedback: g.coachFeedback,
        })),
        recentCoachNotes: recentNotes,
      });
    } catch (err) {
      console.error('Get report card error:', err);
      res.status(500).json({ error: 'Error generating report card' });
    }
  });

  // --- Team Dashboard (Coach Overview) ---
  app.get('/api/team-dashboard', async (req, res) => {
    try {
      const playersWithStats = await storage.getPlayersWithStats();
      
      const gradeScores: Record<string, number> = {
        'A+': 100, 'A': 95, 'A-': 90,
        'B+': 85, 'B': 80, 'B-': 75,
        'C+': 70, 'C': 65, 'C-': 60,
        'D': 50, 'F': 30
      };

      const gradeFromScore = (score: number): string => {
        if (score >= 95) return 'A';
        else if (score >= 85) return 'B+';
        else if (score >= 75) return 'B';
        else if (score >= 65) return 'C';
        else if (score >= 50) return 'D';
        return 'F';
      };

      // Process all players
      const playerStats = playersWithStats.map(player => {
        const games = player.games || [];
        const gamesPlayed = games.length;

        if (gamesPlayed === 0) {
          return {
            id: player.id,
            name: player.name,
            position: player.position,
            team: player.team,
            jerseyNumber: player.jerseyNumber,
            photoUrl: player.photoUrl,
            ppg: 0,
            rpg: 0,
            apg: 0,
            spg: 0,
            bpg: 0,
            avgGrade: null,
            avgGradeScore: 0,
            gamesPlayed: 0,
          };
        }

        const ppg = games.reduce((acc, g) => acc + g.points, 0) / gamesPlayed;
        const rpg = games.reduce((acc, g) => acc + g.rebounds, 0) / gamesPlayed;
        const apg = games.reduce((acc, g) => acc + g.assists, 0) / gamesPlayed;
        const spg = games.reduce((acc, g) => acc + g.steals, 0) / gamesPlayed;
        const bpg = games.reduce((acc, g) => acc + g.blocks, 0) / gamesPlayed;

        const avgGradeScore = games.reduce((acc, g) => acc + (gradeScores[g.grade || 'C'] || 65), 0) / gamesPlayed;
        const avgGrade = gradeFromScore(avgGradeScore);

        return {
          id: player.id,
          name: player.name,
          position: player.position,
          team: player.team,
          jerseyNumber: player.jerseyNumber,
          photoUrl: player.photoUrl,
          ppg: Number(ppg.toFixed(1)),
          rpg: Number(rpg.toFixed(1)),
          apg: Number(apg.toFixed(1)),
          spg: Number(spg.toFixed(1)),
          bpg: Number(bpg.toFixed(1)),
          avgGrade,
          avgGradeScore: Number(avgGradeScore.toFixed(1)),
          gamesPlayed,
        };
      });

      // Calculate team totals
      const totalGamesPlayed = playerStats.reduce((acc, p) => acc + p.gamesPlayed, 0);
      const playersWithGames = playerStats.filter(p => p.gamesPlayed > 0);
      const teamPpg = playersWithGames.length > 0 
        ? playersWithGames.reduce((acc, p) => acc + p.ppg, 0) / playersWithGames.length 
        : 0;
      const teamRpg = playersWithGames.length > 0 
        ? playersWithGames.reduce((acc, p) => acc + p.rpg, 0) / playersWithGames.length 
        : 0;
      const teamApg = playersWithGames.length > 0 
        ? playersWithGames.reduce((acc, p) => acc + p.apg, 0) / playersWithGames.length 
        : 0;

      // Best performers
      const topScorer = [...playerStats].sort((a, b) => b.ppg - a.ppg)[0] || null;
      const topRebounder = [...playerStats].sort((a, b) => b.rpg - a.rpg)[0] || null;
      const topAssister = [...playerStats].sort((a, b) => b.apg - a.apg)[0] || null;

      // Recent activity (last 5 games across all players)
      const allGames: { playerId: number; playerName: string; game: any }[] = [];
      playersWithStats.forEach(player => {
        (player.games || []).forEach(game => {
          allGames.push({ playerId: player.id, playerName: player.name, game });
        });
      });
      const recentGames = allGames
        .sort((a, b) => new Date(b.game.date).getTime() - new Date(a.game.date).getTime())
        .slice(0, 5)
        .map(item => ({
          playerId: item.playerId,
          playerName: item.playerName,
          id: item.game.id,
          date: item.game.date,
          opponent: item.game.opponent,
          points: item.game.points,
          rebounds: item.game.rebounds,
          assists: item.game.assists,
          grade: item.game.grade,
        }));

      // Position distribution
      const positionDistribution = {
        Guard: playerStats.filter(p => p.position === 'Guard').length,
        Wing: playerStats.filter(p => p.position === 'Wing').length,
        Big: playerStats.filter(p => p.position === 'Big').length,
      };

      res.json({
        players: playerStats,
        teamStats: {
          totalPlayers: playerStats.length,
          totalGamesPlayed,
          teamPpg: Number(teamPpg.toFixed(1)),
          teamRpg: Number(teamRpg.toFixed(1)),
          teamApg: Number(teamApg.toFixed(1)),
        },
        bestPerformers: {
          topScorer: topScorer ? { id: topScorer.id, name: topScorer.name, value: topScorer.ppg } : null,
          topRebounder: topRebounder ? { id: topRebounder.id, name: topRebounder.name, value: topRebounder.rpg } : null,
          topAssister: topAssister ? { id: topAssister.id, name: topAssister.name, value: topAssister.apg } : null,
        },
        recentGames,
        positionDistribution,
      });
    } catch (err) {
      console.error('Team dashboard error:', err);
      res.status(500).json({ error: 'Error fetching team dashboard data' });
    }
  });

  // --- Stripe Payment Routes ---
  
  app.get('/api/stripe/publishable-key', async (req, res) => {
    try {
      const key = await getStripePublishableKey();
      res.json({ publishableKey: key });
    } catch (err) {
      console.error('Error getting publishable key:', err);
      res.status(500).json({ error: 'Could not retrieve publishable key' });
    }
  });

  app.get('/api/stripe/products', async (req, res) => {
    try {
      // Fetch directly from Stripe API to ensure products are always available
      const stripe = await getUncachableStripeClient();
      const products = await stripe.products.list({ limit: 100, active: true });
      const prices = await stripe.prices.list({ limit: 100, active: true });
      
      const pricesMap = new Map<string, any[]>();
      for (const price of prices.data) {
        const productId = typeof price.product === 'string' ? price.product : price.product.id;
        if (!pricesMap.has(productId)) {
          pricesMap.set(productId, []);
        }
        pricesMap.get(productId)!.push({
          id: price.id,
          unit_amount: price.unit_amount,
          currency: price.currency,
          recurring: price.recurring,
        });
      }
      
      const result = products.data.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        metadata: p.metadata,
        prices: pricesMap.get(p.id) || [],
      }));

      res.json({ products: result });
    } catch (err) {
      console.error('Error fetching products:', err);
      res.status(500).json({ error: 'Could not fetch products' });
    }
  });

  app.post('/api/stripe/checkout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { priceId, mode } = req.body;
      if (!priceId) {
        return res.status(400).json({ error: 'Price ID required' });
      }

      const stripe = await getUncachableStripeClient();
      const user = await authStorage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          metadata: { userId },
        });
        customerId = customer.id;
        await db.update(users)
          .set({ stripeCustomerId: customerId })
          .where(eq(users.id, userId));
      }

      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}`;
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: mode || 'subscription',
        success_url: `${baseUrl}/pricing?success=true`,
        cancel_url: `${baseUrl}/pricing?canceled=true`,
      });

      res.json({ url: session.url });
    } catch (err: any) {
      console.error('Checkout error:', err);
      res.status(500).json({ error: err.message || 'Checkout failed' });
    }
  });

  app.get('/api/stripe/subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await authStorage.getUser(userId);
      
      // Check if user is app owner (gets full access)
      const ownerStatus = isAppOwner(userId);
      
      if (!user?.stripeSubscriptionId) {
        return res.json({ subscription: null, isOwner: ownerStatus });
      }

      const result = await db.execute(sql`
        SELECT * FROM stripe.subscriptions WHERE id = ${user.stripeSubscriptionId}
      `);
      
      res.json({ subscription: result.rows[0] || null, isOwner: ownerStatus });
    } catch (err) {
      console.error('Error fetching subscription:', err);
      res.status(500).json({ error: 'Could not fetch subscription' });
    }
  });

  app.post('/api/stripe/portal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await authStorage.getUser(userId);
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ error: 'No billing account found' });
      }

      const stripe = await getUncachableStripeClient();
      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}`;
      
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${baseUrl}/pricing`,
      });

      res.json({ url: session.url });
    } catch (err: any) {
      console.error('Portal error:', err);
      res.status(500).json({ error: err.message || 'Portal access failed' });
    }
  });

  // --- Admin Routes (password protected) ---

  // Verify admin password
  app.post('/api/admin/login', (req, res) => {
    const adminPassword = process.env.ADMIN_PASSWORD;
    const { password } = req.body;
    
    if (!adminPassword) {
      return res.status(500).json({ error: 'Admin password not configured' });
    }
    
    if (password === adminPassword) {
      res.json({ success: true });
    } else {
      res.status(401).json({ error: 'Invalid password' });
    }
  });

  // Get all players (roster management)
  app.get('/api/admin/players', isAdmin, async (req, res) => {
    try {
      const allPlayers = await storage.getPlayers();
      res.json({ players: allPlayers });
    } catch (err) {
      console.error('Admin get players error:', err);
      res.status(500).json({ error: 'Could not fetch players' });
    }
  });

  // Update player
  app.patch('/api/admin/players/:id', isAdmin, async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const updates = req.body;
      delete updates.adminPassword; // Remove password from updates
      
      const updated = await storage.updatePlayer(playerId, updates);
      res.json({ player: updated });
    } catch (err) {
      console.error('Admin update player error:', err);
      res.status(500).json({ error: 'Could not update player' });
    }
  });

  // Delete player
  app.delete('/api/admin/players/:id', isAdmin, async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      await storage.deletePlayer(playerId);
      res.json({ success: true });
    } catch (err) {
      console.error('Admin delete player error:', err);
      res.status(500).json({ error: 'Could not delete player' });
    }
  });

  // Get all products with prices (fetch directly from Stripe)
  app.get('/api/admin/products', isAdmin, async (req, res) => {
    try {
      const stripe = await getUncachableStripeClient();
      const products = await stripe.products.list({ limit: 100, active: undefined });
      const prices = await stripe.prices.list({ limit: 100, active: true });
      
      const pricesMap = new Map<string, any[]>();
      for (const price of prices.data) {
        const productId = typeof price.product === 'string' ? price.product : price.product.id;
        if (!pricesMap.has(productId)) {
          pricesMap.set(productId, []);
        }
        pricesMap.get(productId)!.push({
          id: price.id,
          unit_amount: price.unit_amount,
          currency: price.currency,
          recurring: price.recurring,
          active: price.active,
        });
      }
      
      const result = products.data.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        active: p.active,
        metadata: p.metadata,
        prices: pricesMap.get(p.id) || [],
      }));
      
      res.json({ products: result });
    } catch (err: any) {
      console.error('Admin get products error:', err);
      res.status(500).json({ error: err.message || 'Could not fetch products' });
    }
  });

  // Create a new product with price in Stripe
  app.post('/api/admin/products', isAdmin, async (req, res) => {
    try {
      const { name, description, priceInCents, type, interval } = req.body;
      
      if (!name || !priceInCents) {
        return res.status(400).json({ error: 'Name and price are required' });
      }
      
      const stripe = await getUncachableStripeClient();
      
      // Create the product
      const product = await stripe.products.create({
        name,
        description: description || undefined,
        metadata: {
          type: type || 'one_time',
        },
      });
      
      // Create the price
      const priceData: any = {
        product: product.id,
        unit_amount: priceInCents,
        currency: 'usd',
      };
      
      if (type === 'subscription' && interval) {
        priceData.recurring = { interval };
      }
      
      const price = await stripe.prices.create(priceData);
      
      res.json({ product, price });
    } catch (err: any) {
      console.error('Admin create product error:', err);
      res.status(500).json({ error: err.message || 'Could not create product' });
    }
  });

  // Update product active status
  app.patch('/api/admin/products/:id', isAdmin, async (req, res) => {
    try {
      const productId = req.params.id;
      const { active, name, description } = req.body;
      
      const stripe = await getUncachableStripeClient();
      const updateData: any = {};
      if (typeof active === 'boolean') updateData.active = active;
      if (name) updateData.name = name;
      if (description) updateData.description = description;
      
      const product = await stripe.products.update(productId, updateData);
      res.json({ product });
    } catch (err: any) {
      console.error('Admin update product error:', err);
      res.status(500).json({ error: err.message || 'Could not update product' });
    }
  });

  // Create a coupon/promotion
  app.post('/api/admin/coupons', isAdmin, async (req, res) => {
    try {
      const { name, percentOff, duration, durationInMonths } = req.body;
      
      const stripe = await getUncachableStripeClient();
      const coupon = await stripe.coupons.create({
        name,
        percent_off: percentOff,
        duration: duration || 'once',
        duration_in_months: duration === 'repeating' ? durationInMonths : undefined,
      });
      
      res.json({ coupon });
    } catch (err: any) {
      console.error('Admin create coupon error:', err);
      res.status(500).json({ error: err.message || 'Could not create coupon' });
    }
  });

  // Get all coupons
  app.get('/api/admin/coupons', isAdmin, async (req, res) => {
    try {
      const stripe = await getUncachableStripeClient();
      const coupons = await stripe.coupons.list({ limit: 100 });
      res.json({ coupons: coupons.data });
    } catch (err: any) {
      console.error('Admin get coupons error:', err);
      res.status(500).json({ error: err.message || 'Could not fetch coupons' });
    }
  });

  // Delete a coupon
  app.delete('/api/admin/coupons/:id', isAdmin, async (req, res) => {
    try {
      const couponId = req.params.id;
      const stripe = await getUncachableStripeClient();
      await stripe.coupons.del(couponId);
      res.json({ success: true });
    } catch (err: any) {
      console.error('Admin delete coupon error:', err);
      res.status(500).json({ error: err.message || 'Could not delete coupon' });
    }
  });

  // Get all users (subscriber management)
  app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT id, email, role, "stripeCustomerId", "stripeSubscriptionId", "subscriptionStatus", "createdAt"
        FROM users
        ORDER BY "createdAt" DESC
      `);
      res.json({ users: result.rows });
    } catch (err) {
      console.error('Admin get users error:', err);
      res.status(500).json({ error: 'Could not fetch users' });
    }
  });

  // ========================================
  // FOLLOWING SYSTEM ROUTES
  // ========================================

  // Follow a player
  app.post('/api/players/:playerId/follow', isAuthenticated, async (req: any, res) => {
    try {
      const followeePlayerId = parseInt(req.params.playerId);
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const followerPlayerId = user.playerId || null;
      const followerUserId = user.playerId ? null : user.id;
      
      if (user.playerId === followeePlayerId) {
        return res.status(400).json({ message: "You cannot follow yourself" });
      }
      const alreadyFollowing = await storage.isFollowing(followerPlayerId, followerUserId, followeePlayerId);
      if (alreadyFollowing) {
        return res.status(400).json({ message: "Already following this player" });
      }
      const follow = await storage.createFollow(followerPlayerId, followerUserId, followeePlayerId);
      
      const followerName = user.firstName || user.email || 'Someone';
      await storage.createNotification({
        playerId: followeePlayerId,
        notificationType: 'new_follower',
        title: 'New Follower',
        message: `${followerName} started following you`,
        relatedId: user.playerId || null,
        relatedType: 'player',
      });
      res.json(follow);
    } catch (error) {
      console.error('Error following player:', error);
      res.status(500).json({ message: "Failed to follow player" });
    }
  });

  // Unfollow a player
  app.delete('/api/players/:playerId/follow', isAuthenticated, async (req: any, res) => {
    try {
      const followeePlayerId = parseInt(req.params.playerId);
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const followerPlayerId = user.playerId || null;
      const followerUserId = user.playerId ? null : user.id;
      
      await storage.deleteFollow(followerPlayerId, followerUserId, followeePlayerId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error unfollowing player:', error);
      res.status(500).json({ message: "Failed to unfollow player" });
    }
  });

  // Get player's followers
  app.get('/api/players/:playerId/followers', isAuthenticated, async (req, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      const followers = await storage.getFollowers(playerId);
      res.json(followers);
    } catch (error) {
      console.error('Error getting followers:', error);
      res.status(500).json({ message: "Failed to get followers" });
    }
  });

  // Get who player is following
  app.get('/api/players/:playerId/following', isAuthenticated, async (req, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      const following = await storage.getFollowing(playerId);
      res.json(following);
    } catch (error) {
      console.error('Error getting following:', error);
      res.status(500).json({ message: "Failed to get following" });
    }
  });

  // Get follower/following counts
  app.get('/api/players/:playerId/follow-stats', isAuthenticated, async (req: any, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      const user = await authStorage.getUser(req.user.claims.sub);
      
      const [followerCount, followingCount] = await Promise.all([
        storage.getFollowerCount(playerId),
        storage.getFollowingCount(playerId)
      ]);
      
      let isFollowing = false;
      if (user) {
        const followerPlayerId = user.playerId || null;
        const followerUserId = user.playerId ? null : user.id;
        isFollowing = await storage.isFollowing(followerPlayerId, followerUserId, playerId);
      }
      
      res.json({ followerCount, followingCount, followersCount: followerCount, isFollowing });
    } catch (error) {
      console.error('Error getting follow stats:', error);
      res.status(500).json({ message: "Failed to get follow stats" });
    }
  });

  // Check if current user is following a player
  app.get('/api/players/:playerId/is-following', isAuthenticated, async (req: any, res) => {
    try {
      const targetPlayerId = parseInt(req.params.playerId);
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const followerPlayerId = user.playerId || null;
      const followerUserId = user.playerId ? null : user.id;
      
      const isFollowing = await storage.isFollowing(followerPlayerId, followerUserId, targetPlayerId);
      res.json({ isFollowing });
    } catch (error) {
      console.error('Error checking follow status:', error);
      res.status(500).json({ message: "Failed to check follow status" });
    }
  });

  // ========================================
  // NOTIFICATION ROUTES
  // ========================================

  // Get current user's notifications (supports both players and coaches)
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user) {
        return res.json([]);
      }
      
      // Get notifications based on user type (player or coach)
      let allNotifications: any[] = [];
      if (user.playerId) {
        allNotifications = await storage.getPlayerNotifications(user.playerId);
      }
      // Also get user-level notifications (for coaches or shared notifications)
      const userNotifications = await storage.getUserNotifications(user.id);
      
      // Combine and sort by date
      const combined = [...allNotifications, ...userNotifications];
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json(combined);
    } catch (error) {
      console.error('Error getting notifications:', error);
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });

  // Get unread notification count (supports both players and coaches)
  app.get('/api/notifications/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user) {
        return res.json({ count: 0 });
      }
      
      let totalCount = 0;
      if (user.playerId) {
        totalCount += await storage.getUnreadNotificationCount(user.playerId);
      }
      // Also count user-level notifications
      totalCount += await storage.getUnreadNotificationCountByUserId(user.id);
      
      res.json({ count: totalCount });
    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({ message: "Failed to get unread count" });
    }
  });

  // Mark single notification as read
  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking notification read:', error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read (supports both players and coaches)
  app.post('/api/notifications/read-all', isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user) {
        return res.json({ success: true });
      }
      
      if (user.playerId) {
        await storage.markAllNotificationsRead(user.playerId);
      }
      // Also mark user-level notifications as read
      await storage.markAllNotificationsReadByUserId(user.id);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking all notifications read:', error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // ========================================
  // HIGHLIGHT CLIPS ROUTES
  // ========================================

  // Create a highlight clip
  app.post('/api/highlight-clips', isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user || !user.playerId) {
        return res.status(400).json({ message: "You must have a player profile" });
      }
      const validatedData = insertHighlightClipSchema.parse({
        ...req.body,
        playerId: user.playerId
      });
      const clip = await storage.createHighlightClip(validatedData);
      res.json(clip);
    } catch (error) {
      console.error('Error creating highlight clip:', error);
      res.status(500).json({ message: "Failed to create highlight clip" });
    }
  });

  // Get player's highlight clips
  app.get('/api/players/:playerId/highlight-clips', isAuthenticated, async (req, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      const clips = await storage.getPlayerHighlightClips(playerId);
      res.json(clips);
    } catch (error) {
      console.error('Error getting highlight clips:', error);
      res.status(500).json({ message: "Failed to get highlight clips" });
    }
  });

  // Get single clip (increments view count)
  app.get('/api/highlight-clips/:id', isAuthenticated, async (req, res) => {
    try {
      const clipId = parseInt(req.params.id);
      const clip = await storage.getHighlightClip(clipId);
      if (!clip) {
        return res.status(404).json({ message: "Clip not found" });
      }
      await storage.incrementClipViewCount(clipId);
      res.json(clip);
    } catch (error) {
      console.error('Error getting highlight clip:', error);
      res.status(500).json({ message: "Failed to get highlight clip" });
    }
  });

  // Delete a clip (owner only)
  app.delete('/api/highlight-clips/:id', isAuthenticated, async (req: any, res) => {
    try {
      const clipId = parseInt(req.params.id);
      const user = await authStorage.getUser(req.user.claims.sub);
      const clip = await storage.getHighlightClip(clipId);
      if (!clip) {
        return res.status(404).json({ message: "Clip not found" });
      }
      if (!user || (user.role !== 'coach' && user.playerId !== clip.playerId)) {
        return res.status(403).json({ message: "Not authorized to delete this clip" });
      }
      await storage.deleteHighlightClip(clipId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting highlight clip:', error);
      res.status(500).json({ message: "Failed to delete highlight clip" });
    }
  });

  // ========================================
  // WORKOUT ROUTES
  // ========================================

  // Create a workout
  app.post('/api/workouts', isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user || !user.playerId) {
        return res.status(400).json({ message: "You must have a player profile" });
      }
      const validatedData = insertWorkoutSchema.parse({
        ...req.body,
        playerId: user.playerId
      });
      const workout = await storage.createWorkout(validatedData);
      res.json(workout);
    } catch (error) {
      console.error('Error creating workout:', error);
      res.status(500).json({ message: "Failed to create workout" });
    }
  });

  // Get player's workouts
  app.get('/api/players/:playerId/workouts', isAuthenticated, async (req, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      const workouts = await storage.getPlayerWorkouts(playerId);
      res.json(workouts);
    } catch (error) {
      console.error('Error getting workouts:', error);
      res.status(500).json({ message: "Failed to get workouts" });
    }
  });

  // Get single workout
  app.get('/api/workouts/:id', isAuthenticated, async (req, res) => {
    try {
      const workoutId = parseInt(req.params.id);
      const workout = await storage.getWorkout(workoutId);
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      res.json(workout);
    } catch (error) {
      console.error('Error getting workout:', error);
      res.status(500).json({ message: "Failed to get workout" });
    }
  });

  // Update a workout
  app.patch('/api/workouts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const workoutId = parseInt(req.params.id);
      const user = await authStorage.getUser(req.user.claims.sub);
      const workout = await storage.getWorkout(workoutId);
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      if (!user || (user.role !== 'coach' && user.playerId !== workout.playerId)) {
        return res.status(403).json({ message: "Not authorized to update this workout" });
      }
      const updateSchema = insertWorkoutSchema.partial();
      const input = updateSchema.parse(req.body);
      const updatedWorkout = await storage.updateWorkout(workoutId, input);
      res.json(updatedWorkout);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error('Error updating workout:', error);
      res.status(500).json({ message: "Failed to update workout" });
    }
  });

  // Delete a workout
  app.delete('/api/workouts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const workoutId = parseInt(req.params.id);
      const user = await authStorage.getUser(req.user.claims.sub);
      const workout = await storage.getWorkout(workoutId);
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      if (!user || (user.role !== 'coach' && user.playerId !== workout.playerId)) {
        return res.status(403).json({ message: "Not authorized to delete this workout" });
      }
      await storage.deleteWorkout(workoutId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting workout:', error);
      res.status(500).json({ message: "Failed to delete workout" });
    }
  });

  // ========================================
  // ACCOLADE ROUTES
  // ========================================

  // Get all accolades for a player
  app.get('/api/players/:playerId/accolades', async (req, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      const accolades = await storage.getPlayerAccolades(playerId);
      res.json(accolades);
    } catch (error) {
      console.error('Error getting accolades:', error);
      res.status(500).json({ message: "Failed to get accolades" });
    }
  });

  // Create a new accolade (requires authentication, player must own profile)
  app.post('/api/players/:playerId/accolades', isAuthenticated, async (req: any, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      
      if (!await canModifyPlayer(req, playerId)) {
        return res.status(403).json({ message: "Not authorized to add accolades to this profile" });
      }
      
      const createSchema = z.object({
        type: z.enum(['championship', 'career_high', 'award', 'record']),
        title: z.string().min(1),
        description: z.string().optional(),
        season: z.string().optional(),
        dateEarned: z.string().optional(),
      });
      
      const input = createSchema.parse(req.body);
      const accolade = await storage.createAccolade({
        ...input,
        playerId,
      });
      res.json(accolade);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error('Error creating accolade:', error);
      res.status(500).json({ message: "Failed to create accolade" });
    }
  });

  // Update an accolade (requires authentication, player must own the accolade)
  app.patch('/api/accolades/:id', isAuthenticated, async (req: any, res) => {
    try {
      const accoladeId = parseInt(req.params.id);
      const accolade = await storage.getAccoladeById(accoladeId);
      
      if (!accolade) {
        return res.status(404).json({ message: "Accolade not found" });
      }
      
      if (!await canModifyPlayer(req, accolade.playerId)) {
        return res.status(403).json({ message: "Not authorized to update this accolade" });
      }
      
      const updateSchema = insertAccoladeSchema.partial();
      const input = updateSchema.parse(req.body);
      const updatedAccolade = await storage.updateAccolade(accoladeId, input);
      res.json(updatedAccolade);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error('Error updating accolade:', error);
      res.status(500).json({ message: "Failed to update accolade" });
    }
  });

  // Delete an accolade (requires authentication, player must own the accolade)
  app.delete('/api/accolades/:id', isAuthenticated, async (req: any, res) => {
    try {
      const accoladeId = parseInt(req.params.id);
      const accolade = await storage.getAccoladeById(accoladeId);
      
      if (!accolade) {
        return res.status(404).json({ message: "Accolade not found" });
      }
      
      if (!await canModifyPlayer(req, accolade.playerId)) {
        return res.status(403).json({ message: "Not authorized to delete this accolade" });
      }
      
      await storage.deleteAccolade(accoladeId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting accolade:', error);
      res.status(500).json({ message: "Failed to delete accolade" });
    }
  });

  // ========================================
  // GOAL SHARING ROUTES
  // ========================================

  // Share a goal with teammate/team
  app.post('/api/goals/:goalId/share', isAuthenticated, async (req: any, res) => {
    try {
      const goalId = parseInt(req.params.goalId);
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user || !user.playerId) {
        return res.status(400).json({ message: "You must have a player profile" });
      }
      const validatedData = insertGoalShareSchema.parse({
        ...req.body,
        goalId,
        sharedByPlayerId: user.playerId
      });
      const share = await storage.createGoalShare(validatedData);
      if (validatedData.sharedWithPlayerId) {
        await storage.createNotification({
          playerId: validatedData.sharedWithPlayerId,
          notificationType: 'goal_progress',
          title: 'Goal Shared With You',
          message: 'Someone shared a goal with you',
          relatedId: goalId,
          relatedType: 'goal',
        });
      }
      res.json(share);
    } catch (error) {
      console.error('Error sharing goal:', error);
      res.status(500).json({ message: "Failed to share goal" });
    }
  });

  // Get shares for a goal
  app.get('/api/goals/:goalId/shares', isAuthenticated, async (req, res) => {
    try {
      const goalId = parseInt(req.params.goalId);
      const shares = await storage.getGoalShares(goalId);
      res.json(shares);
    } catch (error) {
      console.error('Error getting goal shares:', error);
      res.status(500).json({ message: "Failed to get goal shares" });
    }
  });

  // Get goals shared with current player
  app.get('/api/shared-goals', isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user || !user.playerId) {
        return res.status(400).json({ message: "You must have a player profile" });
      }
      const sharedGoals = await storage.getSharedGoalsWithPlayer(user.playerId);
      res.json(sharedGoals);
    } catch (error) {
      console.error('Error getting shared goals:', error);
      res.status(500).json({ message: "Failed to get shared goals" });
    }
  });

  // Remove a share
  app.delete('/api/goal-shares/:id', isAuthenticated, async (req: any, res) => {
    try {
      const shareId = parseInt(req.params.id);
      await storage.deleteGoalShare(shareId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting goal share:', error);
      res.status(500).json({ message: "Failed to delete goal share" });
    }
  });

  // ========================================
  // SCHEDULE EVENTS ROUTES
  // ========================================

  // Create schedule event
  app.post('/api/schedule-events', isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      const eventData = {
        ...req.body,
        playerId: user.playerId || req.body.playerId || null,
        createdBy: req.user.claims.sub,
        startTime: req.body.startTime ? new Date(req.body.startTime) : undefined,
        endTime: req.body.endTime ? new Date(req.body.endTime) : null
      };
      const validatedData = insertScheduleEventSchema.parse(eventData);
      const event = await storage.createScheduleEvent(validatedData);
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error('Error creating schedule event:', error);
      res.status(500).json({ message: "Failed to create schedule event" });
    }
  });

  // Get events for current user (coaches see all, players see their own)
  app.get('/api/schedule-events', isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      let events: ScheduleEvent[] = [];
      if (user.role === 'coach') {
        events = await storage.getAllScheduleEvents();
      } else if (user.playerId) {
        events = await storage.getPlayerScheduleEvents(user.playerId);
      }
      res.json(events);
    } catch (error) {
      console.error('Error getting schedule events:', error);
      res.status(500).json({ message: "Failed to get schedule events" });
    }
  });

  // Get single event
  app.get('/api/schedule-events/:id', isAuthenticated, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getScheduleEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error('Error getting schedule event:', error);
      res.status(500).json({ message: "Failed to get schedule event" });
    }
  });

  // Update event
  app.patch('/api/schedule-events/:id', isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const user = await authStorage.getUser(req.user.claims.sub);
      const event = await storage.getScheduleEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      if (!user || (user.role !== 'coach' && user.playerId !== event.playerId)) {
        return res.status(403).json({ message: "Not authorized to update this event" });
      }
      const updateSchema = insertScheduleEventSchema.partial();
      const input = updateSchema.parse(req.body);
      const updatedEvent = await storage.updateScheduleEvent(eventId, input);
      res.json(updatedEvent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error('Error updating schedule event:', error);
      res.status(500).json({ message: "Failed to update schedule event" });
    }
  });

  // Delete event
  app.delete('/api/schedule-events/:id', isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const user = await authStorage.getUser(req.user.claims.sub);
      const event = await storage.getScheduleEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      if (!user || (user.role !== 'coach' && user.playerId !== event.playerId)) {
        return res.status(403).json({ message: "Not authorized to delete this event" });
      }
      await storage.deleteScheduleEvent(eventId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting schedule event:', error);
      res.status(500).json({ message: "Failed to delete schedule event" });
    }
  });

  // ========================================
  // LIVE GAME MODE ROUTES
  // ========================================

  // Start a live game session - Premium Feature
  app.post('/api/live-game/start', requiresSubscription, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user || !user.playerId) {
        return res.status(400).json({ message: "You must have a player profile" });
      }
      const existingSession = await storage.getActivePlayerSession(user.playerId);
      if (existingSession) {
        return res.status(400).json({ message: "You already have an active game session" });
      }
      const validatedData = insertLiveGameSessionSchema.parse({
        ...req.body,
        playerId: user.playerId,
        status: 'active'
      });
      const session = await storage.createLiveGameSession(validatedData);
      res.json(session);
    } catch (error) {
      console.error('Error starting live game session:', error);
      res.status(500).json({ message: "Failed to start live game session" });
    }
  });

  // Get current active session - Premium Feature
  app.get('/api/live-game/active', requiresSubscription, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user || !user.playerId) {
        return res.status(400).json({ message: "You must have a player profile" });
      }
      const session = await storage.getActivePlayerSession(user.playerId);
      res.json(session || null);
    } catch (error) {
      console.error('Error getting active session:', error);
      res.status(500).json({ message: "Failed to get active session" });
    }
  });

  // Log a live game event - Premium Feature
  app.post('/api/live-game/:sessionId/event', requiresSubscription, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const session = await storage.getLiveGameSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user || (user.role !== 'coach' && user.playerId !== session.playerId)) {
        return res.status(403).json({ message: "Not authorized to add events to this session" });
      }
      const validatedData = insertLiveGameEventSchema.parse({
        ...req.body,
        sessionId
      });
      const event = await storage.createLiveGameEvent(validatedData);
      res.json(event);
    } catch (error) {
      console.error('Error logging live game event:', error);
      res.status(500).json({ message: "Failed to log live game event" });
    }
  });

  // Get session events - Premium Feature
  app.get('/api/live-game/:sessionId/events', requiresSubscription, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const events = await storage.getSessionEvents(sessionId);
      res.json(events);
    } catch (error) {
      console.error('Error getting session events:', error);
      res.status(500).json({ message: "Failed to get session events" });
    }
  });

  // Delete a live game event (undo) - Premium Feature
  app.delete('/api/live-game/:sessionId/events/:eventId', requiresSubscription, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const eventId = parseInt(req.params.eventId);
      const session = await storage.getLiveGameSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user || (user.role !== 'coach' && user.playerId !== session.playerId)) {
        return res.status(403).json({ message: "Not authorized to delete events from this session" });
      }
      await storage.deleteLiveGameEvent(eventId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting live game event:', error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Complete session and create game - Premium Feature
  app.post('/api/live-game/:sessionId/complete', requiresSubscription, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const session = await storage.getLiveGameSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user || (user.role !== 'coach' && user.playerId !== session.playerId)) {
        return res.status(403).json({ message: "Not authorized to complete this session" });
      }
      
      // Validate request body
      const completeSessionSchema = z.object({
        opponent: z.string().min(1),
        result: z.string().optional().nullable(),
        minutes: z.number().int().nonnegative().optional(),
      });
      const validatedData = completeSessionSchema.parse(req.body);
      
      const events = await storage.getSessionEvents(sessionId);
      const stats = {
        points: 0,
        rebounds: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
        fouls: 0,
        fgMade: 0,
        fgAttempted: 0,
        threeMade: 0,
        threeAttempted: 0,
        ftMade: 0,
        ftAttempted: 0,
      };
      for (const event of events) {
        switch (event.eventType) {
          case 'made_2pt': stats.points += 2; stats.fgMade++; stats.fgAttempted++; break;
          case 'missed_2pt': stats.fgAttempted++; break;
          case 'made_3pt': stats.points += 3; stats.threeMade++; stats.threeAttempted++; stats.fgMade++; stats.fgAttempted++; break;
          case 'missed_3pt': stats.threeAttempted++; stats.fgAttempted++; break;
          case 'made_ft': stats.points += 1; stats.ftMade++; stats.ftAttempted++; break;
          case 'missed_ft': stats.ftAttempted++; break;
          case 'rebound': stats.rebounds++; break;
          case 'assist': stats.assists++; break;
          case 'steal': stats.steals++; break;
          case 'block': stats.blocks++; break;
          case 'turnover': stats.turnovers++; break;
          case 'foul': stats.fouls++; break;
        }
      }
      const game = await storage.createGame({
        playerId: session.playerId,
        date: new Date().toISOString().split('T')[0],
        opponent: validatedData.opponent,
        result: validatedData.result || null,
        minutes: validatedData.minutes || 0,
        ...stats
      });
      await storage.updateLiveGameSession(sessionId, {
        status: 'completed',
        endedAt: new Date(),
        gameId: game.id
      });
      res.json({ session: await storage.getLiveGameSession(sessionId), game });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error('Error completing session:', error);
      res.status(500).json({ message: "Failed to complete session" });
    }
  });

  // ========================================
  // LIVE GAME SPECTATORS ROUTES
  // ========================================

  // Join as spectator - POST /api/live-games/:sessionId/spectate
  app.post('/api/live-games/:sessionId/spectate', isAuthenticated, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const session = await storage.getLiveGameSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Game session not found" });
      }

      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Add spectator
      const spectator = await storage.addLiveGameSpectator({
        sessionId,
        viewerUserId: user.userId,
        viewerPlayerId: user.playerId || null,
        leftAt: null,
      });

      // Create notification for the player being spectated
      const player = await storage.getPlayer(session.playerId);
      if (player && user.playerId !== session.playerId) {
        const spectatorName = user.playerId ? (await storage.getPlayer(user.playerId))?.name || "Someone" : "A visitor";
        await storage.createNotification({
          playerId: session.playerId,
          type: "game_spectating",
          title: `${spectatorName} is watching your game!`,
          message: `${spectatorName} joined to watch your live game`,
          actionUrl: `/live-game/${sessionId}`,
          isRead: false,
        });
      }

      res.json(spectator);
    } catch (error) {
      console.error('Error joining spectator session:', error);
      res.status(500).json({ message: "Failed to join spectator session" });
    }
  });

  // Leave spectating - DELETE /api/live-games/:sessionId/spectate
  app.delete('/api/live-games/:sessionId/spectate', isAuthenticated, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      await storage.removeLiveGameSpectator(sessionId, user.userId, user.playerId || null);
      res.json({ success: true });
    } catch (error) {
      console.error('Error leaving spectator session:', error);
      res.status(500).json({ message: "Failed to leave spectator session" });
    }
  });

  // Get spectators - GET /api/live-games/:sessionId/spectators
  app.get('/api/live-games/:sessionId/spectators', async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const spectators = await storage.getLiveGameSpectators(sessionId);
      res.json(spectators);
    } catch (error) {
      console.error('Error getting spectators:', error);
      res.status(500).json({ message: "Failed to get spectators" });
    }
  });

  // Get spectator count - GET /api/live-games/:sessionId/spectator-count
  app.get('/api/live-games/:sessionId/spectator-count', async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const count = await storage.getSpectatorCount(sessionId);
      res.json({ count });
    } catch (error) {
      console.error('Error getting spectator count:', error);
      res.status(500).json({ message: "Failed to get spectator count" });
    }
  });

  // Get sessions I'm spectating - GET /api/my-spectating
  app.get('/api/my-spectating', isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const spectatorSessions = await storage.getActiveSpectatorSessions(user.userId, user.playerId || null);
      
      // Get the full session and game details for each spectating session
      const sessionsWithDetails = await Promise.all(
        spectatorSessions.map(async (spectator) => {
          const session = await storage.getLiveGameSession(spectator.sessionId);
          const player = session ? await storage.getPlayer(session.playerId) : null;
          return {
            spectator,
            session,
            player,
          };
        })
      );

      res.json(sessionsWithDetails);
    } catch (error) {
      console.error('Error getting spectating sessions:', error);
      res.status(500).json({ message: "Failed to get spectating sessions" });
    }
  });

  // ========================================
  // SHARE ASSETS ROUTES
  // ========================================

  // Create share asset
  app.post('/api/share-assets', isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user || !user.playerId) {
        return res.status(400).json({ message: "You must have a player profile" });
      }
      const validatedData = insertShareAssetSchema.parse({
        ...req.body,
        playerId: user.playerId
      });
      const asset = await storage.createShareAsset(validatedData);
      res.json(asset);
    } catch (error) {
      console.error('Error creating share asset:', error);
      res.status(500).json({ message: "Failed to create share asset" });
    }
  });

  // Get player's share assets
  app.get('/api/players/:playerId/share-assets', isAuthenticated, async (req, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      const assets = await storage.getPlayerShareAssets(playerId);
      res.json(assets);
    } catch (error) {
      console.error('Error getting share assets:', error);
      res.status(500).json({ message: "Failed to get share assets" });
    }
  });

  // Increment share count
  app.post('/api/share-assets/:id/shared', isAuthenticated, async (req, res) => {
    try {
      const assetId = parseInt(req.params.id);
      await storage.incrementShareCount(assetId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error incrementing share count:', error);
      res.status(500).json({ message: "Failed to increment share count" });
    }
  });

  // Direct Messages Routes
  app.post('/api/messages/thread', isAuthenticated, async (req: any, res) => {
    try {
      const user = (req as any).caliberUser;
      const { recipientUserId, recipientPlayerId } = req.body;

      if (!recipientUserId) {
        return res.status(400).json({ message: "Recipient user ID is required" });
      }

      const thread = await storage.getOrCreateThread(
        user.userId,
        user.playerId || null,
        recipientUserId,
        recipientPlayerId || null
      );

      res.json(thread);
    } catch (error) {
      console.error('Error creating/getting thread:', error);
      res.status(500).json({ message: "Failed to create or get thread" });
    }
  });

  app.get('/api/messages/threads', isAuthenticated, async (req: any, res) => {
    try {
      const user = (req as any).caliberUser;
      const threads = await storage.getUserDmThreads(user.userId);
      res.json(threads);
    } catch (error) {
      console.error('Error getting user threads:', error);
      res.status(500).json({ message: "Failed to get message threads" });
    }
  });

  app.get('/api/messages/threads/:id', isAuthenticated, async (req: any, res) => {
    try {
      const threadId = parseInt(req.params.id);
      const messages = await storage.getThreadMessages(threadId);
      res.json(messages);
    } catch (error) {
      console.error('Error getting thread messages:', error);
      res.status(500).json({ message: "Failed to get thread messages" });
    }
  });

  app.post('/api/messages/threads/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = (req as any).caliberUser;
      const threadId = parseInt(req.params.id);
      const { content } = req.body;

      if (!content || content.trim() === '') {
        return res.status(400).json({ message: "Message content is required" });
      }

      const message = await storage.createDmMessage({
        threadId,
        senderUserId: user.userId,
        senderPlayerId: user.playerId || null,
        content: content.trim(),
        isRead: false
      });

      // Create notification for the recipient
      const threadParticipants = await storage.getThreadParticipants(threadId);

      for (const participant of threadParticipants) {
        if (participant.userId !== user.userId && participant.playerId) {
          await storage.createNotification({
            playerId: participant.playerId,
            notificationType: 'message',
            title: 'New Message',
            message: `You have a new message`,
            relatedId: user.playerId || undefined,
            isRead: false
          });
        }
      }

      res.json(message);
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.post('/api/messages/threads/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const user = (req as any).caliberUser;
      const threadId = parseInt(req.params.id);

      await storage.markMessagesAsRead(threadId, user.userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });

  // === Training Groups Routes ===
  
  // POST /api/training-groups - Create a new training group
  app.post('/api/training-groups', isAuthenticated, async (req: any, res) => {
    try {
      const user = (req as any).caliberUser;
      const { name, description, isPublic, maxMembers } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ message: "Group name is required" });
      }

      const group = await storage.createTrainingGroup({
        name: name.trim(),
        description: description || null,
        ownerUserId: user.userId,
        ownerPlayerId: user.playerId || null,
        isPublic: isPublic === true,
        maxMembers: maxMembers || 20
      });

      // Add creator as owner member
      if (user.playerId) {
        await storage.addGroupMember({
          groupId: group.id,
          playerId: user.playerId,
          role: 'owner'
        });
      }

      res.json(group);
    } catch (error) {
      console.error('Error creating training group:', error);
      res.status(500).json({ message: "Failed to create training group" });
    }
  });

  // GET /api/training-groups - Get user's training groups
  app.get('/api/training-groups', isAuthenticated, async (req: any, res) => {
    try {
      const user = (req as any).caliberUser;
      const groups = await storage.getUserTrainingGroups(user.userId, user.playerId || null);
      res.json(groups);
    } catch (error) {
      console.error('Error fetching training groups:', error);
      res.status(500).json({ message: "Failed to fetch training groups" });
    }
  });

  // GET /api/training-groups/public - Get public training groups
  app.get('/api/training-groups/public', async (req, res) => {
    try {
      const groups = await storage.getPublicTrainingGroups();
      res.json(groups);
    } catch (error) {
      console.error('Error fetching public training groups:', error);
      res.status(500).json({ message: "Failed to fetch public training groups" });
    }
  });

  // GET /api/training-groups/:id - Get group details
  app.get('/api/training-groups/:id', async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const group = await storage.getTrainingGroup(groupId);

      if (!group) {
        return res.status(404).json({ message: "Training group not found" });
      }

      res.json(group);
    } catch (error) {
      console.error('Error fetching training group:', error);
      res.status(500).json({ message: "Failed to fetch training group" });
    }
  });

  // PUT /api/training-groups/:id - Update group
  app.put('/api/training-groups/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = (req as any).caliberUser;
      const groupId = parseInt(req.params.id);
      const { name, description, isPublic, maxMembers } = req.body;

      const group = await storage.getTrainingGroup(groupId);
      if (!group) {
        return res.status(404).json({ message: "Training group not found" });
      }

      // Check if user is the owner
      if (group.ownerUserId !== user.userId && group.ownerPlayerId !== user.playerId) {
        return res.status(403).json({ message: "Only the group owner can update this group" });
      }

      const updates: Partial<InsertTrainingGroup> = {};
      if (name !== undefined && typeof name === 'string' && name.trim().length > 0) {
        updates.name = name.trim();
      }
      if (description !== undefined) {
        updates.description = description;
      }
      if (isPublic !== undefined) {
        updates.isPublic = isPublic;
      }
      if (maxMembers !== undefined && typeof maxMembers === 'number') {
        updates.maxMembers = maxMembers;
      }

      const updated = await storage.updateTrainingGroup(groupId, updates);
      res.json(updated);
    } catch (error) {
      console.error('Error updating training group:', error);
      res.status(500).json({ message: "Failed to update training group" });
    }
  });

  // DELETE /api/training-groups/:id - Delete group
  app.delete('/api/training-groups/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = (req as any).caliberUser;
      const groupId = parseInt(req.params.id);

      const group = await storage.getTrainingGroup(groupId);
      if (!group) {
        return res.status(404).json({ message: "Training group not found" });
      }

      // Check if user is the owner
      if (group.ownerUserId !== user.userId && group.ownerPlayerId !== user.playerId) {
        return res.status(403).json({ message: "Only the group owner can delete this group" });
      }

      await storage.deleteTrainingGroup(groupId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting training group:', error);
      res.status(500).json({ message: "Failed to delete training group" });
    }
  });

  // POST /api/training-groups/:id/join - Join a training group
  app.post('/api/training-groups/:id/join', isAuthenticated, async (req: any, res) => {
    try {
      const user = (req as any).caliberUser;
      const groupId = parseInt(req.params.id);

      if (!user.playerId) {
        return res.status(400).json({ message: "Player profile required to join a group" });
      }

      const group = await storage.getTrainingGroup(groupId);
      if (!group) {
        return res.status(404).json({ message: "Training group not found" });
      }

      // Check if user is already a member
      const members = await storage.getGroupMembers(groupId);
      if (members.some(m => m.playerId === user.playerId)) {
        return res.status(400).json({ message: "Already a member of this group" });
      }

      // Check if group is at max capacity
      if (group.maxMembers && members.length >= group.maxMembers) {
        return res.status(400).json({ message: "Group is at max capacity" });
      }

      const member = await storage.addGroupMember({
        groupId,
        playerId: user.playerId,
        role: 'member'
      });

      res.json(member);
    } catch (error) {
      console.error('Error joining training group:', error);
      res.status(500).json({ message: "Failed to join training group" });
    }
  });

  // DELETE /api/training-groups/:id/leave - Leave a training group
  app.delete('/api/training-groups/:id/leave', isAuthenticated, async (req: any, res) => {
    try {
      const user = (req as any).caliberUser;
      const groupId = parseInt(req.params.id);

      if (!user.playerId) {
        return res.status(400).json({ message: "Player profile required to leave a group" });
      }

      const group = await storage.getTrainingGroup(groupId);
      if (!group) {
        return res.status(404).json({ message: "Training group not found" });
      }

      // Check if user is the owner - prevent owner from leaving
      const members = await storage.getGroupMembers(groupId);
      const ownerMember = members.find(m => m.role === 'owner' && m.playerId === user.playerId);
      if (ownerMember) {
        return res.status(400).json({ message: "Group owner cannot leave the group" });
      }

      await storage.removeGroupMember(groupId, user.playerId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error leaving training group:', error);
      res.status(500).json({ message: "Failed to leave training group" });
    }
  });

  // GET /api/training-groups/:id/members - Get group members
  app.get('/api/training-groups/:id/members', async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);

      const group = await storage.getTrainingGroup(groupId);
      if (!group) {
        return res.status(404).json({ message: "Training group not found" });
      }

      const members = await storage.getGroupMembers(groupId);
      res.json(members);
    } catch (error) {
      console.error('Error fetching group members:', error);
      res.status(500).json({ message: "Failed to fetch group members" });
    }
  });

  // ===== MENTORSHIP ROUTES =====
  
  // POST /api/mentorship/profile - Create/update mentorship profile
  app.post('/api/mentorship/profile', isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user || !user.playerId) {
        return res.status(401).json({ message: "Player profile required" });
      }

      const validated = insertMentorshipProfileSchema.parse(req.body);
      
      const existing = await storage.getMentorshipProfile(user.playerId);
      if (existing) {
        const updated = await storage.updateMentorshipProfile(user.playerId, validated);
        return res.json(updated);
      }

      const created = await storage.createMentorshipProfile({
        ...validated,
        playerId: user.playerId,
      });
      res.status(201).json(created);
    } catch (error: any) {
      console.error('Error creating mentorship profile:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create mentorship profile" });
    }
  });

  // GET /api/mentorship/profile - Get my mentorship profile
  app.get('/api/mentorship/profile', isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user || !user.playerId) {
        return res.status(401).json({ message: "Player profile required" });
      }

      const profile = await storage.getMentorshipProfile(user.playerId);
      if (!profile) {
        return res.status(404).json({ message: "Mentorship profile not found" });
      }

      res.json(profile);
    } catch (error) {
      console.error('Error fetching mentorship profile:', error);
      res.status(500).json({ message: "Failed to fetch mentorship profile" });
    }
  });

  // GET /api/mentorship/mentors - Get list of active mentors
  app.get('/api/mentorship/mentors', async (req, res) => {
    try {
      const mentors = await storage.getActiveMentors();
      res.json(mentors);
    } catch (error) {
      console.error('Error fetching mentors:', error);
      res.status(500).json({ message: "Failed to fetch mentors" });
    }
  });

  // POST /api/mentorship/request - Request mentorship
  app.post('/api/mentorship/request', isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user || !user.playerId) {
        return res.status(401).json({ message: "Player profile required" });
      }

      const { mentorPlayerId, message } = req.body;
      if (!mentorPlayerId) {
        return res.status(400).json({ message: "Mentor player ID required" });
      }

      if (mentorPlayerId === user.playerId) {
        return res.status(400).json({ message: "Cannot request mentorship from yourself" });
      }

      const mentorProfile = await storage.getMentorshipProfile(mentorPlayerId);
      if (!mentorProfile) {
        return res.status(404).json({ message: "Mentor profile not found" });
      }

      const request = await storage.createMentorshipRequest({
        requesterPlayerId: user.playerId,
        mentorPlayerId,
        message,
        status: 'pending',
      });

      // Create notification for mentor
      const mentorPlayer = await storage.getPlayer(mentorPlayerId);
      const requesterPlayer = await storage.getPlayer(user.playerId);
      
      if (mentorPlayer && requesterPlayer) {
        await storage.createNotification({
          playerId: mentorPlayerId,
          type: 'mentorship_request',
          title: `Mentorship Request from ${requesterPlayer.name}`,
          message: `${requesterPlayer.name} has requested mentorship from you`,
          relatedId: request.id,
        });
      }

      res.status(201).json(request);
    } catch (error: any) {
      console.error('Error creating mentorship request:', error);
      res.status(500).json({ message: "Failed to create mentorship request" });
    }
  });

  // GET /api/mentorship/requests - Get my outgoing requests
  app.get('/api/mentorship/requests', isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user || !user.playerId) {
        return res.status(401).json({ message: "Player profile required" });
      }

      const requests = await storage.getMentorshipRequests(user.playerId);
      res.json(requests);
    } catch (error) {
      console.error('Error fetching mentorship requests:', error);
      res.status(500).json({ message: "Failed to fetch mentorship requests" });
    }
  });

  // GET /api/mentorship/requests/incoming - Get incoming requests (for mentors)
  app.get('/api/mentorship/requests/incoming', isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user || !user.playerId) {
        return res.status(401).json({ message: "Player profile required" });
      }

      const requests = await storage.getIncomingMentorshipRequests(user.playerId);
      res.json(requests);
    } catch (error) {
      console.error('Error fetching incoming mentorship requests:', error);
      res.status(500).json({ message: "Failed to fetch incoming mentorship requests" });
    }
  });

  // POST /api/mentorship/requests/:id/accept - Accept request
  app.post('/api/mentorship/requests/:id/accept', isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user || !user.playerId) {
        return res.status(401).json({ message: "Player profile required" });
      }

      const requestId = parseInt(req.params.id);
      const mentorshipRequest = await storage.updateMentorshipRequestStatus(requestId, 'accepted');

      // Create notification for requester
      const requesterPlayer = await storage.getPlayer(mentorshipRequest.requesterPlayerId);
      const mentorPlayer = await storage.getPlayer(mentorshipRequest.mentorPlayerId);

      if (requesterPlayer && mentorPlayer) {
        await storage.createNotification({
          playerId: mentorshipRequest.requesterPlayerId,
          type: 'mentorship_accepted',
          title: `Mentorship Request Accepted`,
          message: `${mentorPlayer.name} has accepted your mentorship request`,
          relatedId: requestId,
        });
      }

      res.json(mentorshipRequest);
    } catch (error) {
      console.error('Error accepting mentorship request:', error);
      res.status(500).json({ message: "Failed to accept mentorship request" });
    }
  });

  // POST /api/mentorship/requests/:id/decline - Decline request
  app.post('/api/mentorship/requests/:id/decline', isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user || !user.playerId) {
        return res.status(401).json({ message: "Player profile required" });
      }

      const requestId = parseInt(req.params.id);
      const mentorshipRequest = await storage.updateMentorshipRequestStatus(requestId, 'declined');

      // Create notification for requester
      const requesterPlayer = await storage.getPlayer(mentorshipRequest.requesterPlayerId);
      const mentorPlayer = await storage.getPlayer(mentorshipRequest.mentorPlayerId);

      if (requesterPlayer && mentorPlayer) {
        await storage.createNotification({
          playerId: mentorshipRequest.requesterPlayerId,
          type: 'mentorship_declined',
          title: `Mentorship Request Declined`,
          message: `${mentorPlayer.name} has declined your mentorship request`,
          relatedId: requestId,
        });
      }

      res.json(mentorshipRequest);
    } catch (error) {
      console.error('Error declining mentorship request:', error);
      res.status(500).json({ message: "Failed to decline mentorship request" });
    }
  });

  // GET /api/mentorship/connections - Get accepted mentorship connections
  app.get('/api/mentorship/connections', isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user || !user.playerId) {
        return res.status(401).json({ message: "Player profile required" });
      }

      const connections = await storage.getAcceptedMentorships(user.playerId);
      res.json(connections);
    } catch (error) {
      console.error('Error fetching mentorship connections:', error);
      res.status(500).json({ message: "Failed to fetch mentorship connections" });
    }
  });

  // === RECRUIT BOARD ROUTES ===

  // POST /api/recruit-posts - Create post (coach only)
  app.post('/api/recruit-posts', requiresCoach, async (req: any, res) => {
    try {
      const coachUserId = req.user.claims.sub;
      const body = insertRecruitPostSchema.parse(req.body);
      
      const post = await storage.createRecruitPost({
        ...body,
        coachUserId
      });
      
      res.json(post);
    } catch (error: any) {
      console.error('Error creating recruit post:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create recruit post" });
    }
  });

  // GET /api/recruit-posts - Get all active posts with optional filters
  app.get('/api/recruit-posts', async (req: any, res) => {
    try {
      const { level, location } = req.query;
      const posts = await storage.getRecruitPosts({
        level: level as string | undefined,
        location: location as string | undefined
      });
      
      res.json(posts);
    } catch (error) {
      console.error('Error fetching recruit posts:', error);
      res.status(500).json({ message: "Failed to fetch recruit posts" });
    }
  });

  // GET /api/recruit-posts/:id - Get specific post
  app.get('/api/recruit-posts/:id', async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getRecruitPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      res.json(post);
    } catch (error) {
      console.error('Error fetching recruit post:', error);
      res.status(500).json({ message: "Failed to fetch recruit post" });
    }
  });

  // PUT /api/recruit-posts/:id - Update post (owner only)
  app.put('/api/recruit-posts/:id', requiresCoach, async (req: any, res) => {
    try {
      const coachUserId = req.user.claims.sub;
      const postId = parseInt(req.params.id);
      const post = await storage.getRecruitPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      if (post.coachUserId !== coachUserId) {
        return res.status(403).json({ message: "Can only update your own posts" });
      }
      
      const body = insertRecruitPostSchema.partial().parse(req.body);
      const updated = await storage.updateRecruitPost(postId, body);
      
      res.json(updated);
    } catch (error: any) {
      console.error('Error updating recruit post:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update recruit post" });
    }
  });

  // DELETE /api/recruit-posts/:id - Delete post (owner only)
  app.delete('/api/recruit-posts/:id', requiresCoach, async (req: any, res) => {
    try {
      const coachUserId = req.user.claims.sub;
      const postId = parseInt(req.params.id);
      const post = await storage.getRecruitPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      if (post.coachUserId !== coachUserId) {
        return res.status(403).json({ message: "Can only delete your own posts" });
      }
      
      await storage.deleteRecruitPost(postId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting recruit post:', error);
      res.status(500).json({ message: "Failed to delete recruit post" });
    }
  });

  // GET /api/my-recruit-posts - Get coach's own posts
  app.get('/api/my-recruit-posts', requiresCoach, async (req: any, res) => {
    try {
      const coachUserId = req.user.claims.sub;
      const posts = await storage.getCoachRecruitPosts(coachUserId);
      
      res.json(posts);
    } catch (error) {
      console.error('Error fetching coach recruit posts:', error);
      res.status(500).json({ message: "Failed to fetch your recruit posts" });
    }
  });

  // POST /api/recruit-posts/:id/interest - Express interest (player only)
  app.post('/api/recruit-posts/:id/interest', isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user || !user.playerId) {
        return res.status(401).json({ message: "Player profile required" });
      }
      
      const postId = parseInt(req.params.id);
      const post = await storage.getRecruitPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const body = insertRecruitInterestSchema.parse({
        ...req.body,
        postId,
        playerId: user.playerId
      });
      
      const interest = await storage.createRecruitInterest(body);
      
      // Create notification for the coach
      const coachPlayer = await storage.getPlayerByUserId(post.coachUserId);
      const player = await storage.getPlayer(user.playerId);
      
      if (coachPlayer && player) {
        await storage.createNotification({
          playerId: coachPlayer.id,
          type: 'recruit_interest',
          title: 'New Recruit Interest',
          message: `${player.name} is interested in your ${post.title} recruitment post`,
          relatedId: postId
        });
      }
      
      res.json(interest);
    } catch (error: any) {
      console.error('Error creating recruit interest:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create recruit interest" });
    }
  });

  // GET /api/recruit-posts/:id/interests - Get interests for post (post owner only)
  app.get('/api/recruit-posts/:id/interests', requiresCoach, async (req: any, res) => {
    try {
      const coachUserId = req.user.claims.sub;
      const postId = parseInt(req.params.id);
      const post = await storage.getRecruitPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      if (post.coachUserId !== coachUserId) {
        return res.status(403).json({ message: "Can only view interests for your own posts" });
      }
      
      const interests = await storage.getPostInterests(postId);
      res.json(interests);
    } catch (error) {
      console.error('Error fetching post interests:', error);
      res.status(500).json({ message: "Failed to fetch post interests" });
    }
  });

  // GET /api/my-recruit-interests - Get player's expressed interests
  app.get('/api/my-recruit-interests', isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user || !user.playerId) {
        return res.status(401).json({ message: "Player profile required" });
      }
      
      const interests = await storage.getPlayerInterests(user.playerId);
      res.json(interests);
    } catch (error) {
      console.error('Error fetching player interests:', error);
      res.status(500).json({ message: "Failed to fetch your recruit interests" });
    }
  });

  // PUT /api/recruit-interests/:id/status - Update interest status (coach only)
  app.put('/api/recruit-interests/:id/status', requiresCoach, async (req: any, res) => {
    try {
      const interestId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !['pending', 'viewed', 'contacted'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be 'pending', 'viewed', or 'contacted'" });
      }
      
      const interest = await storage.updateInterestStatus(interestId, status);
      
      // Create notification for the player if status changed to contacted
      if (status === 'contacted') {
        const player = await storage.getPlayer(interest.playerId);
        const post = await storage.getRecruitPost(interest.postId);
        
        if (player && post) {
          await storage.createNotification({
            playerId: interest.playerId,
            type: 'recruit_contacted',
            title: 'Coach Contacted',
            message: `A coach has contacted you about their ${post.title} recruitment post`,
            relatedId: interest.postId
          });
        }
      }
      
      res.json(interest);
    } catch (error) {
      console.error('Error updating interest status:', error);
      res.status(500).json({ message: "Failed to update interest status" });
    }
  });

  await seedDatabase();

  return httpServer;
}

// Seed function (can be called from index.ts if desired, or just run manually via a route if needed)
export async function seedDatabase() {
  const existingPlayers = await storage.getPlayers();
  if (existingPlayers.length === 0) {
    const p1 = await storage.createPlayer({ name: "Jordan Poole", position: "Guard", team: "Wizards", height: "6'4", jerseyNumber: 13 });
    const p2 = await storage.createPlayer({ name: "Victor Wembanyama", position: "Big", team: "Spurs", height: "7'4", jerseyNumber: 1 });
    
    // Add a sample game for Jordan Poole
    await storage.createGame({
      playerId: p1.id,
      date: "2023-10-25",
      opponent: "Magic",
      result: "L 100-112",
      minutes: 28,
      points: 18,
      rebounds: 2,
      assists: 5,
      steals: 1,
      blocks: 0,
      turnovers: 4,
      fouls: 3,
      fgMade: 6,
      fgAttempted: 15,
      threeMade: 2,
      threeAttempted: 7,
      ftMade: 4,
      ftAttempted: 5,
      hustleScore: 45,
      defenseRating: 40
    });
  }

  // Seed challenges if none exist
  const existingChallenges = await storage.getChallenges();
  if (existingChallenges.length === 0) {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    await storage.createChallenge({
      title: "Weekly Hustle Challenge",
      description: "Maintain the highest hustle average this week. Push on every possession!",
      challengeType: "weekly",
      targetType: "hustle_avg",
      targetValue: 80,
      startDate: weekStart.toISOString().split('T')[0],
      endDate: weekEnd.toISOString().split('T')[0],
      badgeReward: "hustle_champion",
      isActive: true,
    });

    await storage.createChallenge({
      title: "Scorer's Sprint",
      description: "Score the most total points this month. Put the ball in the bucket!",
      challengeType: "monthly",
      targetType: "points_total",
      targetValue: 100,
      startDate: monthStart.toISOString().split('T')[0],
      endDate: monthEnd.toISOString().split('T')[0],
      badgeReward: "scoring_machine",
      isActive: true,
    });

    await storage.createChallenge({
      title: "Consistency King",
      description: "Play the most games with a B+ grade or better. Stay consistent!",
      challengeType: "monthly",
      targetType: "grade_count",
      targetValue: 5,
      startDate: monthStart.toISOString().split('T')[0],
      endDate: monthEnd.toISOString().split('T')[0],
      badgeReward: "consistency_king",
      isActive: true,
    });
  }
}
