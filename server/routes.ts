import type { Express } from "express";
import type { Server } from "http";
import crypto from "crypto";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { players, games, badges, headToHeadChallenges, statVerifications, playerCollegeMatches, playerCollegeInterests, type Game, type ScheduleEvent, insertGoalSchema, insertCommentSchema, insertChallengeSchema, insertTeamSchema, insertTeamMemberSchema, insertTeamPostSchema, XP_REWARDS, TIER_THRESHOLDS, BADGE_DEFINITIONS, SKILL_BADGE_TYPES, FOOTBALL_SKILL_BADGE_TYPES, type SkillBadgeLevel, insertShotSchema, insertGameNoteSchema, insertPracticeSchema, insertPracticeAttendanceSchema, insertDrillSchema, insertDrillScoreSchema, insertLineupSchema, insertLineupStatSchema, insertOpponentSchema, insertAlertSchema, insertCoachGoalSchema, insertDrillRecommendationSchema, insertNotificationSchema, insertHighlightClipSchema, linkHighlightToGameSchema, insertWorkoutSchema, insertAccoladeSchema, insertGoalShareSchema, insertScheduleEventSchema, insertLiveGameSessionSchema, insertLiveGameEventSchema, insertShareAssetSchema, insertMentorshipProfileSchema, insertMentorshipRequestSchema, insertRecruitPostSchema, insertRecruitInterestSchema, type InsertTrainingGroup, shopItems, userInventory, coinTransactions, COIN_REWARDS, insertPlayerRatingSchema, insertStatVerificationSchema, insertChallengeResultSchema, insertAiProjectionSchema, insertHighlightVerificationSchema, insertLeagueSchema, insertLeagueTeamSchema, insertLeagueTeamRosterSchema, insertLeagueGameSchema, insertLeagueRivalrySchema, insertCollegeSchema, insertPlayerCollegeMatchSchema, type College, type FitnessData, type InsertFitnessData, insertFitnessDataSchema, insertWearableConnectionSchema, recruitingEvents, insertRecruitingEventSchema, type RecruitingEvent, playerEventRegistrations, insertPlayerEventRegistrationSchema, colleges, collegeRosterPlayers, collegeCoachingStaff, ncaaEligibilityProgress, insertNcaaEligibilityProgressSchema, coachRecommendations, insertCoachRecommendationSchema, teams, teamMembers, skillBadges, activityStreaks, feedActivities, feedReactions, feedComments, feedCommentLikes, type InsertFeedComment, type FeedComment, highlightClips, personalRecords, recruiterBlocks, recruiterProfiles, playerGoals, recruitingTargets, recruitingContacts, insertRecruitingTargetSchema, insertRecruitingContactSchema, DIVISION_BENCHMARKS, BENCHMARK_STAT_LABELS, seasons, teamHistory, insertSeasonSchema, insertTeamHistorySchema, guardianLinks, insertGuardianLinkSchema } from "@shared/schema";
import { getPlayerArchetype, ARCHETYPES } from "@shared/archetypes";
import { calculateAIRating, calculateProjection, type GameStats, type PlayerMetrics, type PeerStats, type AIRatingResult, type ProjectionResult } from "@shared/ai-rating-engine";
import type { Sport } from "@shared/sports-config";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";
import fs from "fs";
import path from "path";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { setupAuth, registerAuthRoutes, isAuthenticated, authStorage } from "./replit_integrations/auth";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { users } from "@shared/models/auth";
import { eq, sql, and, desc, or, inArray, gte, lte, count, max, ne, ilike, type SQL } from "drizzle-orm";
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

// Grade score to letter mapping
function scoreToGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'A-';
  if (score >= 65) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 55) return 'B-';
  if (score >= 50) return 'C+';
  if (score >= 45) return 'C';
  if (score >= 40) return 'C-';
  if (score >= 35) return 'D';
  return 'F';
}

// Extract primary position from comma-separated positions for stat calculation
// For multi-position players like "QB, RB", returns "QB"
// For single position players, returns the position as-is
function getPrimaryPosition(position: string): string {
  if (!position) return 'Guard';
  const positions = position.split(',').map(p => p.trim());
  return positions[0] || 'Guard';
}

// Category Grade: Defensive (steals, blocks, defensive rebounds)
function calculateDefensiveGrade(stats: any, position: string): string {
  let score = 50; // Base score
  
  // Handle multi-position players by using primary position
  const primaryPos = getPrimaryPosition(position);
  
  const steals = stats.steals || 0;
  const blocks = stats.blocks || 0;
  const defensiveRebounds = stats.defensiveRebounds || 0;
  const minutes = stats.minutes || 1;
  
  // Per-36 minute scaling
  const stealsPerMin = (steals / minutes) * 36;
  const blocksPerMin = (blocks / minutes) * 36;
  const drebPerMin = (defensiveRebounds / minutes) * 36;
  
  // Position-weighted scoring
  if (primaryPos === 'Guard') {
    // Guards: prioritize steals, less emphasis on blocks
    score += stealsPerMin * 12;
    score += blocksPerMin * 4;
    score += drebPerMin * 2;
  } else if (primaryPos === 'Big') {
    // Bigs: prioritize blocks and defensive rebounds
    score += stealsPerMin * 6;
    score += blocksPerMin * 10;
    score += drebPerMin * 4;
  } else { // Wing
    // Wings: balanced defensive contribution
    score += stealsPerMin * 10;
    score += blocksPerMin * 6;
    score += drebPerMin * 3;
  }
  
  return scoreToGrade(score);
}

// Category Grade: Shooting (FG%, 3PT%, FT%)
function calculateShootingGrade(stats: any, position: string): string {
  let score = 50; // Base score
  
  // Handle multi-position players by using primary position
  const primaryPos = getPrimaryPosition(position);
  
  const fgMade = stats.fgMade || 0;
  const fgAttempted = stats.fgAttempted || 0;
  const threeMade = stats.threeMade || 0;
  const threeAttempted = stats.threeAttempted || 0;
  const ftMade = stats.ftMade || 0;
  const ftAttempted = stats.ftAttempted || 0;
  
  // Calculate percentages (handle division by zero)
  const fgPct = fgAttempted > 0 ? (fgMade / fgAttempted) * 100 : 0;
  const threePct = threeAttempted > 0 ? (threeMade / threeAttempted) * 100 : 0;
  const ftPct = ftAttempted > 0 ? (ftMade / ftAttempted) * 100 : 0;
  
  // Position-weighted scoring
  if (primaryPos === 'Guard') {
    // Guards: emphasis on 3PT and FT shooting
    score += (fgPct - 40) * 0.5;  // Baseline 40% FG
    score += (threePct - 33) * 0.8;  // Baseline 33% 3PT (important for guards)
    score += (ftPct - 70) * 0.3;  // Baseline 70% FT
    // Volume bonus for guards
    if (threeAttempted >= 5) score += 5;
  } else if (primaryPos === 'Big') {
    // Bigs: emphasis on FG% (inside scoring), less 3PT
    score += (fgPct - 45) * 0.8;  // Higher FG% baseline for bigs
    score += (threePct - 30) * 0.3;  // Less 3PT emphasis
    score += (ftPct - 60) * 0.4;  // FT matters for bigs (and-1s, fouls)
  } else { // Wing
    // Wings: balanced shooting
    score += (fgPct - 42) * 0.6;
    score += (threePct - 35) * 0.6;
    score += (ftPct - 75) * 0.3;
  }
  
  // Penalty for no shot attempts (didn't contribute offensively)
  if (fgAttempted === 0) score -= 10;
  
  return scoreToGrade(score);
}

// Category Grade: Rebounding (total rebounds, offensive/defensive)
function calculateReboundingGrade(stats: any, position: string): string {
  let score = 50; // Base score
  
  // Handle multi-position players by using primary position
  const primaryPos = getPrimaryPosition(position);
  
  const rebounds = stats.rebounds || 0;
  const offensiveRebounds = stats.offensiveRebounds || 0;
  const defensiveRebounds = stats.defensiveRebounds || 0;
  const minutes = stats.minutes || 1;
  
  // Per-36 minute scaling
  const rebPerMin = (rebounds / minutes) * 36;
  const orebPerMin = (offensiveRebounds / minutes) * 36;
  const drebPerMin = (defensiveRebounds / minutes) * 36;
  
  // Position-weighted scoring
  if (primaryPos === 'Guard') {
    // Guards: any rebounding is a bonus (baseline expectation is low)
    score += rebPerMin * 4;
    score += orebPerMin * 6; // Offensive rebounds are extra hustle for guards
  } else if (primaryPos === 'Big') {
    // Bigs: expected to dominate boards
    // Baseline: 10 rebounds per 36 min for average
    score += (rebPerMin - 8) * 3;
    score += orebPerMin * 4;
    score += drebPerMin * 2;
    // Bonus for double-digit rebounding
    if (rebounds >= 10) score += 10;
  } else { // Wing
    // Wings: moderate rebounding expectations
    score += (rebPerMin - 4) * 3;
    score += orebPerMin * 5;
  }
  
  return scoreToGrade(score);
}

// Category Grade: Passing (assist-to-turnover ratio)
function calculatePassingGrade(stats: any, position: string): string {
  let score = 50; // Base score
  
  // Handle multi-position players by using primary position
  const primaryPos = getPrimaryPosition(position);
  
  const assists = stats.assists || 0;
  const turnovers = stats.turnovers || 0;
  const minutes = stats.minutes || 1;
  
  // Assist to turnover ratio (avoid division by zero)
  const astToRatio = turnovers > 0 ? assists / turnovers : (assists > 0 ? assists * 2 : 1);
  
  // Per-36 minute assists
  const astPerMin = (assists / minutes) * 36;
  
  // Position-weighted scoring
  if (primaryPos === 'Guard') {
    // Guards: primary ball handlers, highest expectations
    // Baseline: 2:1 A/TO ratio is average, 3:1 is good, 4:1 is elite
    score += (astToRatio - 1.5) * 12;
    // Volume matters for guards
    score += (astPerMin - 4) * 3;
    // Turnover penalty is higher for guards
    if (turnovers >= 5) score -= 10;
  } else if (primaryPos === 'Big') {
    // Bigs: less playmaking expectations
    // Any assists are bonus, turnovers less penalized
    score += (astToRatio - 1) * 8;
    score += astPerMin * 4;
    // Turnovers hurt less for bigs
    if (turnovers >= 4) score -= 5;
  } else { // Wing
    // Wings: moderate playmaking
    score += (astToRatio - 1.2) * 10;
    score += (astPerMin - 2) * 3;
    if (turnovers >= 4) score -= 8;
  }
  
  // Bonus for clean games (0 turnovers with decent playtime)
  if (turnovers === 0 && minutes >= 15) score += 10;
  
  return scoreToGrade(score);
}

// Calculate all category grades at once
function calculateCategoryGrades(stats: any, position: string): {
  defensiveGrade: string;
  shootingGrade: string;
  reboundingGrade: string;
  passingGrade: string;
} {
  return {
    defensiveGrade: calculateDefensiveGrade(stats, position),
    shootingGrade: calculateShootingGrade(stats, position),
    reboundingGrade: calculateReboundingGrade(stats, position),
    passingGrade: calculatePassingGrade(stats, position),
  };
}

function calculateGrade(stats: any, position: string): { grade: string; feedback: string } {
  let score = 50; // Base score
  
  // Handle multi-position players by using primary position
  const primaryPos = getPrimaryPosition(position);
  
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
  if (primaryPos === 'Guard') {
    weights.ast = 2.0;
    weights.to = -3.0; // Punish TOs more
  } else if (primaryPos === 'Big') {
    weights.reb = 2.0;
    weights.blk = 3.0;
    weights.ast = 1.0;
  } else if (primaryPos === 'Wing') {
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

// Football grading function - position-weighted scoring
function calculateFootballGrade(stats: any, position: string): { grade: string; feedback: string } {
  let score = 50; // Base score
  
  // Handle multi-position players by using primary position
  const primaryPos = getPrimaryPosition(position);
  
  // Helper to cap adjustments and apply minimum attempts for efficiency stats
  const clampBonus = (bonus: number, min: number, max: number) => Math.max(min, Math.min(max, bonus));
  
  // Position-specific grading with normalization for small samples
  if (primaryPos === 'QB') {
    // QB grading: Passing efficiency, TDs, turnovers
    const passAttempts = stats.passAttempts || 0;
    const compPct = passAttempts > 0 
      ? ((stats.completions || 0) / passAttempts) * 100 
      : 0;
    // Only apply comp% bonus/penalty if enough attempts (min 10)
    if (passAttempts >= 10) {
      score += clampBonus((compPct - 55) * 0.5, -15, 15);
    }
    score += clampBonus((stats.passingYards || 0) * 0.02, 0, 12); // Max 600 yards contribution
    score += (stats.passingTouchdowns || 0) * 8;
    score += clampBonus((stats.rushingYards || 0) * 0.03, 0, 5);
    score += (stats.rushingTouchdowns || 0) * 6;
    score -= (stats.interceptions || 0) * 10;
    score -= (stats.sacksTaken || 0) * 2;
    score -= (stats.fumbles || 0) * 8;
  } else if (primaryPos === 'RB') {
    // RB grading: Rushing efficiency, TDs, ball security
    const carries = stats.carries || 0;
    const ypc = carries > 0 
      ? (stats.rushingYards || 0) / carries 
      : 0;
    // Only apply YPC bonus/penalty if enough carries (min 5)
    if (carries >= 5) {
      score += clampBonus((ypc - 4) * 5, -15, 15);
    }
    score += clampBonus((stats.rushingYards || 0) * 0.05, 0, 10); // Max 200 yards contribution
    score += (stats.rushingTouchdowns || 0) * 8;
    score += clampBonus((stats.receivingYards || 0) * 0.03, 0, 5);
    score += (stats.receivingTouchdowns || 0) * 6;
    score -= (stats.fumbles || 0) * 12;
  } else if (primaryPos === 'WR' || primaryPos === 'TE') {
    // WR/TE grading: Catch rate, yards, TDs
    const targets = stats.targets || 0;
    const catchRate = targets > 0 
      ? ((stats.receptions || 0) / targets) * 100 
      : 0;
    // Only apply catch rate bonus/penalty if enough targets (min 3)
    if (targets >= 3) {
      score += clampBonus((catchRate - 60) * 0.4, -12, 12);
    }
    score += clampBonus((stats.receivingYards || 0) * 0.05, 0, 10); // Max 200 yards contribution
    score += (stats.receivingTouchdowns || 0) * 8;
    score -= (stats.drops || 0) * 6;
  } else if (primaryPos === 'OL') {
    // OL grading: Based on hustle and subjective rating
    score += clampBonus((stats.hustleScore || 50) * 0.5, 0, 50);
  } else if (primaryPos === 'DL') {
    // DL grading: Tackles, sacks, disruption
    score += clampBonus((stats.tackles || 0) * 2, 0, 16); // Max 8 tackles contribution
    score += (stats.soloTackles || 0) * 1;
    score += (stats.sacks || 0) * 10;
    score += (stats.forcedFumbles || 0) * 8;
    score += (stats.fumbleRecoveries || 0) * 6;
  } else if (primaryPos === 'LB') {
    // LB grading: All-around defense
    score += clampBonus((stats.tackles || 0) * 1.5, 0, 18); // Max 12 tackles contribution
    score += (stats.soloTackles || 0) * 1;
    score += (stats.sacks || 0) * 8;
    score += (stats.defensiveInterceptions || 0) * 12;
    score += (stats.passDeflections || 0) * 4;
    score += (stats.forcedFumbles || 0) * 6;
  } else if (primaryPos === 'DB') {
    // DB grading: Coverage and turnovers
    score += (stats.tackles || 0) * 1;
    score += (stats.defensiveInterceptions || 0) * 15;
    score += clampBonus((stats.passDeflections || 0) * 5, 0, 20); // Max 4 PDs contribution
    score += (stats.forcedFumbles || 0) * 6;
  } else if (primaryPos === 'K') {
    // Kicker grading: Accuracy (only apply if attempts exist)
    const fgAttempted = stats.fieldGoalsAttempted || 0;
    const xpAttempted = stats.extraPointsAttempted || 0;
    if (fgAttempted > 0) {
      const fgPct = (stats.fieldGoalsMade || 0) / fgAttempted * 100;
      score += clampBonus((fgPct - 75) * 1, -20, 25);
    }
    if (xpAttempted > 0) {
      const xpPct = (stats.extraPointsMade || 0) / xpAttempted * 100;
      score += clampBonus((xpPct - 90) * 0.5, -10, 5);
    }
  } else if (primaryPos === 'P') {
    // Punter grading: Average distance
    const puntAvg = (stats.punts || 0) > 0 
      ? (stats.puntYards || 0) / (stats.punts || 1) 
      : 0;
    score += (puntAvg - 40) * 2;
  }
  
  // Hustle bonus
  if (stats.hustleScore) score += (stats.hustleScore - 50) * 0.2;

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

  if (primaryPos === 'QB') {
    if ((stats.passingTouchdowns || 0) >= 3) positives.push("Outstanding passing day with multiple TDs.");
    if ((stats.passingYards || 0) >= 300) positives.push("Big yardage game through the air.");
    if ((stats.interceptions || 0) === 0 && (stats.passAttempts || 0) > 15) positives.push("Took care of the football - no INTs.");
    if ((stats.interceptions || 0) >= 2) improvements.push("Turnover issues hurt the team.");
    if ((stats.sacksTaken || 0) >= 4) improvements.push("Pocket presence needs work.");
  } else if (primaryPos === 'RB') {
    if ((stats.rushingYards || 0) >= 100) positives.push("Explosive rushing performance.");
    if ((stats.rushingTouchdowns || 0) >= 2) positives.push("Found the end zone multiple times.");
    if ((stats.fumbles || 0) >= 1) improvements.push("Ball security is a concern.");
  } else if (primaryPos === 'WR' || primaryPos === 'TE') {
    if ((stats.receivingYards || 0) >= 100) positives.push("Big receiving day.");
    if ((stats.receivingTouchdowns || 0) >= 1) positives.push("Clutch TD reception.");
    if ((stats.drops || 0) >= 2) improvements.push("Too many drops - work on concentration.");
  } else if (primaryPos === 'DL' || primaryPos === 'LB' || primaryPos === 'DB') {
    if ((stats.tackles || 0) >= 10) positives.push("Dominant tackle production.");
    if ((stats.sacks || 0) >= 2) positives.push("Great pass rush pressure.");
    if ((stats.defensiveInterceptions || 0) >= 1) positives.push("Ball hawk - created a turnover.");
    if ((stats.passDeflections || 0) >= 2) positives.push("Excellent coverage disruption.");
  }
  
  let feedback = "";
  if (positives.length > 0) feedback += "Strengths: " + positives.join(" ") + "\n";
  if (improvements.length > 0) feedback += "Areas to Improve: " + improvements.join(" ") + "\n";
  if (!feedback) feedback = "Solid effort. Focus on consistency in the next game.";

  return { grade, feedback };
}

// Football category grades
function calculateFootballCategoryGrades(stats: any, position: string): {
  efficiencyGrade: string;
  playmakingGrade: string;
  ballSecurityGrade: string;
  impactGrade: string;
} {
  // Handle multi-position players by using primary position
  const primaryPos = getPrimaryPosition(position);
  
  const gradeFromScore = (score: number): string => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'A-';
    if (score >= 65) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 55) return 'B-';
    if (score >= 50) return 'C+';
    if (score >= 45) return 'C';
    if (score >= 40) return 'C-';
    if (score >= 35) return 'D';
    return 'F';
  };

  let efficiencyScore = 50;
  let playmakingScore = 50;
  let ballSecurityScore = 80; // Start high, deduct for mistakes
  let impactScore = 50;

  if (primaryPos === 'QB') {
    const compPct = (stats.passAttempts || 0) > 0 ? ((stats.completions || 0) / stats.passAttempts) * 100 : 0;
    efficiencyScore = 30 + compPct * 0.7;
    playmakingScore = 50 + (stats.passingTouchdowns || 0) * 10 + (stats.rushingTouchdowns || 0) * 8;
    ballSecurityScore = 95 - (stats.interceptions || 0) * 15 - (stats.fumbles || 0) * 10;
    impactScore = 50 + (stats.passingYards || 0) * 0.1;
  } else if (primaryPos === 'RB') {
    const ypc = (stats.carries || 0) > 0 ? (stats.rushingYards || 0) / stats.carries : 0;
    efficiencyScore = 40 + ypc * 8;
    playmakingScore = 50 + (stats.rushingTouchdowns || 0) * 12 + (stats.receivingTouchdowns || 0) * 10;
    ballSecurityScore = 100 - (stats.fumbles || 0) * 25;
    impactScore = 50 + (stats.rushingYards || 0) * 0.2 + (stats.receivingYards || 0) * 0.1;
  } else if (primaryPos === 'WR' || primaryPos === 'TE') {
    const catchRate = (stats.targets || 0) > 0 ? ((stats.receptions || 0) / stats.targets) * 100 : 0;
    efficiencyScore = 30 + catchRate * 0.6;
    playmakingScore = 50 + (stats.receivingTouchdowns || 0) * 15;
    ballSecurityScore = 100 - (stats.drops || 0) * 15 - (stats.fumbles || 0) * 25;
    impactScore = 50 + (stats.receivingYards || 0) * 0.2;
  } else if (primaryPos === 'DL' || primaryPos === 'LB' || primaryPos === 'DB') {
    efficiencyScore = 50 + (stats.soloTackles || 0) * 3;
    playmakingScore = 50 + (stats.sacks || 0) * 10 + (stats.defensiveInterceptions || 0) * 15 + (stats.forcedFumbles || 0) * 12;
    ballSecurityScore = 75; // N/A for defense
    impactScore = 50 + (stats.tackles || 0) * 2 + (stats.passDeflections || 0) * 4;
  } else {
    // K, P, OL - simplified
    efficiencyScore = 50 + (stats.hustleScore || 50) * 0.5;
  }

  return {
    efficiencyGrade: gradeFromScore(Math.min(100, Math.max(0, efficiencyScore))),
    playmakingGrade: gradeFromScore(Math.min(100, Math.max(0, playmakingScore))),
    ballSecurityGrade: gradeFromScore(Math.min(100, Math.max(0, ballSecurityScore))),
    impactGrade: gradeFromScore(Math.min(100, Math.max(0, impactScore))),
  };
}

// --- Defense & Hustle Calculations ---

function calculateDefenseRating(stats: any, position: string): number {
  let rating = 50; // Base rating
  
  // Handle multi-position players by using primary position
  const primaryPos = getPrimaryPosition(position);
  
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
  if (primaryPos === 'Big') {
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
  if (primaryPos === 'Guard') {
    rating += steals * 2; // Guards get extra credit for steals
  } else if (primaryPos === 'Big') {
    rating += blocks * 2; // Bigs get extra credit for blocks
  }
  
  // Clamp to 0-100 range
  return Math.max(0, Math.min(100, Math.round(rating)));
}

function calculateHustleScore(stats: any, position: string): number {
  let score = 50; // Base score
  
  // Handle multi-position players by using primary position
  const primaryPos = getPrimaryPosition(position);
  
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
  if (primaryPos === 'Guard') {
    score += steals * 3; // Guards hustling for steals
  } else if (primaryPos === 'Big') {
    score += offensiveRebounds * 4; // Bigs hustling for offensive boards
  } else if (primaryPos === 'Wing') {
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

// Helper to convert grade to numeric value for comparison
function getGradeValue(grade: string | null): number {
  const GRADE_VALUES: Record<string, number> = {
    'A+': 100, 'A': 95, 'A-': 90,
    'B+': 88, 'B': 85, 'B-': 80,
    'C+': 78, 'C': 75, 'C-': 70,
    'D+': 68, 'D': 65, 'D-': 60,
    'F': 50,
  };
  if (!grade) return 0;
  return GRADE_VALUES[grade.trim().toUpperCase()] || 0;
}

// Helper to calculate average grade value from a set of games
function getAverageGradeValue(games: Game[]): number {
  if (games.length === 0) return 0;
  const totalValue = games.reduce((acc, g) => acc + getGradeValue(g.grade), 0);
  return totalValue / games.length;
}

// Check for "Most Improved" badge - 2+ letter grade improvement over 5+ games
async function checkGradeImprovement(playerId: number): Promise<boolean> {
  const playerGames = await storage.getGamesByPlayerId(playerId);
  const existingBadges = await storage.getPlayerBadges(playerId);
  
  // Check if player already has the badge
  if (existingBadges.some(b => b.badgeType === "most_improved")) {
    return false;
  }
  
  // Need at least 5 games to qualify
  if (playerGames.length < 5) {
    return false;
  }
  
  // Sort games by date ascending (oldest first)
  const sortedGames = [...playerGames].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Get first 2-3 games and last 2-3 games
  const numEarlyGames = Math.min(3, Math.floor(sortedGames.length / 2));
  const numRecentGames = Math.min(3, Math.floor(sortedGames.length / 2));
  
  const earlyGames = sortedGames.slice(0, numEarlyGames);
  const recentGames = sortedGames.slice(-numRecentGames);
  
  // Calculate average grades
  const earlyAvg = getAverageGradeValue(earlyGames);
  const recentAvg = getAverageGradeValue(recentGames);
  
  // Check if improvement is at least 2 letter grades (16+ point difference)
  // Letter grade difference: A+=100, A=95, A-=90, B+=88, B=85, B-=80, C+=78, C=75, C-=70...
  // So 2 letter grades is approximately 10-16 points of improvement
  // We'll use 10 as the threshold (roughly C+ to B+ or B to A-)
  const improvement = recentAvg - earlyAvg;
  return improvement >= 10;
}

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
  
  // Check for grade improvement badge (2+ letter grades over 5+ games)
  const hasImproved = await checkGradeImprovement(playerId);
  if (hasImproved) {
    await storage.createBadge({ playerId, badgeType: "most_improved", gameId });
    awardedBadges.push("most_improved");
  }
  
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
  
  // Get player to determine sport
  const player = await storage.getPlayer(playerId);
  const isFootball = player?.sport === 'football';
  
  // Map stat names from game to skill badge types based on sport
  const basketballStatMapping: Record<string, string> = {
    sharpshooter: 'threeMade',
    pure_passer: 'assists',
    bucket_getter: 'points',
    glass_cleaner: 'rebounds',
    rim_protector: 'blocks',
    pickpocket: 'steals',
  };
  
  const footballStatMapping: Record<string, string> = {
    gunslinger: 'passingTouchdowns',
    workhorse: 'rushingYards',
    deep_threat: 'receivingTouchdowns',
    ball_hawk: 'defensiveInterceptions',
    sack_artist: 'sacks',
    iron_wall: 'pancakeBlocks',
  };
  
  const statMapping = isFootball ? footballStatMapping : basketballStatMapping;
  const badgeTypes = isFootball ? FOOTBALL_SKILL_BADGE_TYPES : SKILL_BADGE_TYPES;
  
  for (const [skillType, config] of Object.entries(badgeTypes)) {
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
async function checkPerformanceAlerts(playerId: number, gameId: number, currentGame: any, grade: string, sport: string = 'basketball') {
  const playerGames = await storage.getGamesByPlayerId(playerId);
  const player = await storage.getPlayer(playerId);
  
  if (!player || playerGames.length < 3) return; // Need at least 3 games to detect trends
  
  // Get recent games excluding current one - filter by sport
  const recentGames = playerGames.filter(g => g.id !== gameId && g.sport === sport).slice(0, 5);
  if (recentGames.length < 2) return;
  
  const dropThreshold = 0.4;
  
  if (sport === 'football') {
    // Football-specific alerts
    const primaryPosition = player.position?.split(',')[0]?.trim() || '';
    
    // QB alerts
    if (primaryPosition === 'QB') {
      const avgPassYds = recentGames.reduce((acc, g) => acc + (g.passingYards || 0), 0) / recentGames.length;
      const avgPassTDs = recentGames.reduce((acc, g) => acc + (g.passingTouchdowns || 0), 0) / recentGames.length;
      
      if (avgPassYds > 100 && (currentGame.passingYards || 0) < avgPassYds * (1 - dropThreshold)) {
        await storage.createAlert({
          playerId,
          alertType: 'performance_drop',
          title: 'Passing Yard Drop Detected',
          message: `${player.name} threw for only ${currentGame.passingYards || 0} yards, well below their ${avgPassYds.toFixed(0)} YPG average.`,
          severity: 'warning',
          relatedGameId: gameId,
          isRead: false,
        });
      }
      
      if ((currentGame.interceptions || 0) >= 3) {
        await storage.createAlert({
          playerId,
          alertType: 'performance_drop',
          title: 'High Interception Game',
          message: `${player.name} threw ${currentGame.interceptions} interceptions vs ${currentGame.opponent}. Ball security needs attention.`,
          severity: 'warning',
          relatedGameId: gameId,
          isRead: false,
        });
      }
      
      if (avgPassTDs > 0 && (currentGame.passingTouchdowns || 0) > avgPassTDs * 1.5) {
        await storage.createAlert({
          playerId,
          alertType: 'improvement',
          title: 'Passing Breakout!',
          message: `${player.name} threw for ${currentGame.passingTouchdowns} TDs, significantly above their ${avgPassTDs.toFixed(1)} TD/G average!`,
          severity: 'info',
          relatedGameId: gameId,
          isRead: false,
        });
      }
    }
    
    // RB alerts
    if (primaryPosition === 'RB') {
      const avgRushYds = recentGames.reduce((acc, g) => acc + (g.rushingYards || 0), 0) / recentGames.length;
      
      if (avgRushYds > 40 && (currentGame.rushingYards || 0) < avgRushYds * (1 - dropThreshold)) {
        await storage.createAlert({
          playerId,
          alertType: 'performance_drop',
          title: 'Rushing Yard Drop Detected',
          message: `${player.name} rushed for only ${currentGame.rushingYards || 0} yards, well below their ${avgRushYds.toFixed(0)} YPG average.`,
          severity: 'warning',
          relatedGameId: gameId,
          isRead: false,
        });
      }
      
      if (avgRushYds > 0 && (currentGame.rushingYards || 0) > avgRushYds * 1.5) {
        await storage.createAlert({
          playerId,
          alertType: 'improvement',
          title: 'Rushing Breakout!',
          message: `${player.name} exploded for ${currentGame.rushingYards} rushing yards!`,
          severity: 'info',
          relatedGameId: gameId,
          isRead: false,
        });
      }
    }
    
    // WR/TE alerts
    if (['WR', 'TE'].includes(primaryPosition)) {
      const avgRecYds = recentGames.reduce((acc, g) => acc + (g.receivingYards || 0), 0) / recentGames.length;
      
      if (avgRecYds > 30 && (currentGame.receivingYards || 0) < avgRecYds * (1 - dropThreshold)) {
        await storage.createAlert({
          playerId,
          alertType: 'performance_drop',
          title: 'Receiving Yard Drop Detected',
          message: `${player.name} had only ${currentGame.receivingYards || 0} receiving yards, well below their ${avgRecYds.toFixed(0)} YPG average.`,
          severity: 'warning',
          relatedGameId: gameId,
          isRead: false,
        });
      }
      
      if (avgRecYds > 0 && (currentGame.receivingYards || 0) > avgRecYds * 1.5) {
        await storage.createAlert({
          playerId,
          alertType: 'improvement',
          title: 'Receiving Breakout!',
          message: `${player.name} exploded for ${currentGame.receivingYards} receiving yards!`,
          severity: 'info',
          relatedGameId: gameId,
          isRead: false,
        });
      }
    }
    
    // Defensive alerts (DL, LB, DB)
    if (['DL', 'LB', 'DB'].includes(primaryPosition)) {
      const avgTackles = recentGames.reduce((acc, g) => acc + (g.tackles || 0), 0) / recentGames.length;
      
      if (avgTackles > 3 && (currentGame.tackles || 0) < avgTackles * (1 - dropThreshold)) {
        await storage.createAlert({
          playerId,
          alertType: 'performance_drop',
          title: 'Tackle Production Drop',
          message: `${player.name} had only ${currentGame.tackles || 0} tackles, well below their ${avgTackles.toFixed(1)} average.`,
          severity: 'warning',
          relatedGameId: gameId,
          isRead: false,
        });
      }
      
      if ((currentGame.sacks || 0) >= 2) {
        await storage.createAlert({
          playerId,
          alertType: 'improvement',
          title: 'Dominant Pass Rush!',
          message: `${player.name} recorded ${currentGame.sacks} sacks vs ${currentGame.opponent}!`,
          severity: 'info',
          relatedGameId: gameId,
          isRead: false,
        });
      }
      
      if ((currentGame.defensiveInterceptions || 0) >= 2) {
        await storage.createAlert({
          playerId,
          alertType: 'improvement',
          title: 'Ballhawk Performance!',
          message: `${player.name} grabbed ${currentGame.defensiveInterceptions} interceptions vs ${currentGame.opponent}!`,
          severity: 'info',
          relatedGameId: gameId,
          isRead: false,
        });
      }
    }
    
    // Fumble alert for skill players
    if (['QB', 'RB', 'WR', 'TE'].includes(primaryPosition) && (currentGame.fumbles || 0) >= 2) {
      await storage.createAlert({
        playerId,
        alertType: 'performance_drop',
        title: 'Ball Security Issue',
        message: `${player.name} had ${currentGame.fumbles} fumbles vs ${currentGame.opponent}. Ball security needs attention.`,
        severity: 'warning',
        relatedGameId: gameId,
        isRead: false,
      });
    }
    
  } else {
    // Basketball-specific alerts
    const avgPoints = recentGames.reduce((acc, g) => acc + g.points, 0) / recentGames.length;
    const avgRebounds = recentGames.reduce((acc, g) => acc + g.rebounds, 0) / recentGames.length;
    const avgHustle = recentGames.reduce((acc, g) => acc + (g.hustleScore || 50), 0) / recentGames.length;
    
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
    // Support multi-position players - check if 'Big' is any of their positions
    const playerPositions = (player.position || '').split(',').map(p => p.trim());
    if (playerPositions.includes('Big') && avgRebounds > 4 && currentGame.rebounds < avgRebounds * (1 - dropThreshold)) {
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
  
  // Poor grade alert (both sports)
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
}

// Award coins to a user and record the transaction
async function awardCoins(
  userId: string, 
  amount: number, 
  type: string, 
  description: string,
  relatedItemId?: number
): Promise<number> {
  // Update user's coin balance
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) return 0;
  
  const newBalance = (user.coinBalance || 0) + amount;
  await db.update(users)
    .set({ coinBalance: newBalance })
    .where(eq(users.id, userId));
  
  // Record transaction
  await db.insert(coinTransactions).values({
    userId,
    amount,
    type,
    description,
    relatedItemId,
  });
  
  return newBalance;
}

// Get coins to award based on reward type
function getCoinsForAction(actionType: keyof typeof COIN_REWARDS): number {
  return COIN_REWARDS[actionType] || 0;
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

async function seedShopItems() {
  try {
    const existingItems = await db.select().from(shopItems).limit(1);
    if (existingItems.length > 0) {
      console.log('Shop items already seeded');
      return;
    }

    console.log('Seeding shop items...');
    const items = [
      { name: "Cyan Pulse", description: "The classic Caliber cyan accent", category: "theme", type: "accent_color", value: "#00D4FF", coinPrice: 0, rarity: "common", sortOrder: 1 },
      { name: "Purple Reign", description: "Royal purple accent for a regal look", category: "theme", type: "accent_color", value: "#A855F7", coinPrice: 100, rarity: "common", sortOrder: 2 },
      { name: "Golden Hour", description: "Warm gold accent for champions", category: "theme", type: "accent_color", value: "#F59E0B", coinPrice: 150, rarity: "rare", sortOrder: 3 },
      { name: "Emerald City", description: "Fresh green accent for growth mindset", category: "theme", type: "accent_color", value: "#10B981", coinPrice: 100, rarity: "common", sortOrder: 4 },
      { name: "Ruby Fire", description: "Intense red accent for competitive spirit", category: "theme", type: "accent_color", value: "#EF4444", coinPrice: 100, rarity: "common", sortOrder: 5 },
      { name: "Electric Blue", description: "Bright blue accent for high energy", category: "theme", type: "accent_color", value: "#3B82F6", coinPrice: 100, rarity: "common", sortOrder: 6 },
      { name: "Sunset Orange", description: "Warm orange accent for vibrant personality", category: "theme", type: "accent_color", value: "#F97316", coinPrice: 150, rarity: "rare", sortOrder: 7 },
      { name: "Midnight Purple", description: "Deep purple accent with mystique", category: "theme", type: "accent_color", value: "#7C3AED", coinPrice: 200, rarity: "rare", sortOrder: 8 },
      { name: "Rose Gold", description: "Elegant rose gold accent", category: "theme", type: "accent_color", value: "#F472B6", coinPrice: 250, rarity: "epic", sortOrder: 9 },
      { name: "Diamond Ice", description: "Premium icy white accent", category: "theme", type: "accent_color", value: "#E0F2FE", coinPrice: 500, rarity: "legendary", sortOrder: 10 },
      { name: "Grid Pattern", description: "Grid background for your profile", category: "profile_skin", type: "card_background", value: "grid-pattern", coinPrice: 200, rarity: "rare", sortOrder: 1 },
      { name: "Flame Burst", description: "Fiery gradient background", category: "profile_skin", type: "card_background", value: "flame-burst", coinPrice: 250, rarity: "rare", sortOrder: 2 },
      { name: "Aurora Glow", description: "Northern lights inspired background", category: "profile_skin", type: "card_background", value: "aurora-glow", coinPrice: 400, rarity: "epic", sortOrder: 3 },
      { name: "Galaxy Swirl", description: "Cosmic space background", category: "profile_skin", type: "card_background", value: "galaxy-swirl", coinPrice: 600, rarity: "legendary", sortOrder: 4 },
      { name: "Gold Frame", description: "Golden frame around your badges", category: "badge_style", type: "frame", value: "gold-frame", coinPrice: 300, rarity: "epic", sortOrder: 1 },
      { name: "Diamond Sparkle", description: "Sparkling diamond effect on badges", category: "badge_style", type: "frame", value: "diamond-sparkle", coinPrice: 750, rarity: "legendary", sortOrder: 2 },
      { name: "Glow Trail", description: "Subtle glow effect on interactions", category: "effect", type: "interaction", value: "glow-trail", coinPrice: 150, rarity: "rare", sortOrder: 1 },
      { name: "Particle Burst", description: "Particle explosion on achievements", category: "effect", type: "achievement", value: "particle-burst", coinPrice: 350, rarity: "epic", sortOrder: 2 },
    ];

    for (const item of items) {
      await db.insert(shopItems).values(item);
    }
    console.log('Shop items seeded successfully');
  } catch (error) {
    console.error('Error seeding shop items:', error);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Seed shop items on startup
  await seedShopItems();
  
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

  // GET /api/ticker - Stock-market-style stats ticker data
  app.get('/api/ticker', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await authStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const tickerItems: Array<{
        type: "personal" | "leaderboard";
        label: string;
        value: string;
        change: string | null;
        direction: "up" | "down" | null;
      }> = [];

      const playerId = user.playerId;

      if (playerId) {
        const playerGames = await db
          .select()
          .from(games)
          .where(eq(games.playerId, playerId))
          .orderBy(desc(games.createdAt));

        if (playerGames.length > 0) {
          const totalPoints = playerGames.reduce((sum, g) => sum + (g.points || 0), 0);
          const ppg = totalPoints / playerGames.length;

          let ppgChange: string | null = null;
          let ppgDirection: "up" | "down" | null = null;
          if (playerGames.length >= 6) {
            const recentHalf = playerGames.slice(0, Math.floor(playerGames.length / 2));
            const olderHalf = playerGames.slice(Math.floor(playerGames.length / 2));
            const recentAvg = recentHalf.reduce((s, g) => s + (g.points || 0), 0) / recentHalf.length;
            const olderAvg = olderHalf.reduce((s, g) => s + (g.points || 0), 0) / olderHalf.length;
            const diff = recentAvg - olderAvg;
            if (Math.abs(diff) >= 0.1) {
              ppgChange = (diff > 0 ? "+" : "") + diff.toFixed(1);
              ppgDirection = diff > 0 ? "up" : "down";
            }
          }

          tickerItems.push({
            type: "personal",
            label: "YOUR PPG",
            value: ppg.toFixed(1),
            change: ppgChange,
            direction: ppgDirection,
          });

          const latestGrade = playerGames[0].grade || "N/A";
          tickerItems.push({
            type: "personal",
            label: "YOUR GRADE",
            value: latestGrade,
            change: null,
            direction: null,
          });

          const playersWithHigherAvg = await db
            .select({ cnt: count() })
            .from(games)
            .where(ne(games.playerId, playerId))
            .groupBy(games.playerId)
            .having(sql`AVG(${games.points}) > ${ppg}`);

          const rank = playersWithHigherAvg.length + 1;
          tickerItems.push({
            type: "personal",
            label: "YOUR RANK",
            value: `#${rank}`,
            change: null,
            direction: null,
          });

          const streakCount = playerGames.length;
          tickerItems.push({
            type: "personal",
            label: "GAMES PLAYED",
            value: `${streakCount} Games`,
            change: null,
            direction: null,
          });
        } else {
          tickerItems.push(
            { type: "personal", label: "YOUR PPG", value: "0.0", change: null, direction: null },
            { type: "personal", label: "YOUR GRADE", value: "N/A", change: null, direction: null },
            { type: "personal", label: "YOUR RANK", value: "N/A", change: null, direction: null },
            { type: "personal", label: "GAMES PLAYED", value: "0 Games", change: null, direction: null },
          );
        }
      }

      const topScorerResult = await db
        .select({
          playerId: games.playerId,
          avgPoints: sql<number>`AVG(${games.points})`.as("avg_points"),
        })
        .from(games)
        .groupBy(games.playerId)
        .orderBy(sql`AVG(${games.points}) DESC`)
        .limit(1);

      if (topScorerResult.length > 0) {
        const topPlayer = await db
          .select({ name: players.name })
          .from(players)
          .where(eq(players.id, topScorerResult[0].playerId))
          .limit(1);

        if (topPlayer.length > 0) {
          const name = topPlayer[0].name;
          const shortName = name.split(" ").length > 1
            ? `${name.split(" ")[0]} ${name.split(" ")[1][0]}.`
            : name;
          tickerItems.push({
            type: "leaderboard",
            label: "TOP SCORER",
            value: `${shortName} - ${Number(topScorerResult[0].avgPoints).toFixed(1)} PPG`,
            change: null,
            direction: null,
          });
        }
      }

      const gradeOrder = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'];
      const latestGames = await db
        .select({
          playerId: games.playerId,
          grade: games.grade,
        })
        .from(games)
        .where(sql`${games.grade} IS NOT NULL`)
        .orderBy(desc(games.createdAt));

      const playerLatestGrade: Record<number, string> = {};
      for (const g of latestGames) {
        if (!playerLatestGrade[g.playerId]) {
          playerLatestGrade[g.playerId] = g.grade!;
        }
      }

      let bestGradePlayerId: number | null = null;
      let bestGradeValue = "N/A";
      let bestGradeIdx = gradeOrder.length;
      for (const [pid, grade] of Object.entries(playerLatestGrade)) {
        const idx = gradeOrder.indexOf(grade);
        if (idx !== -1 && idx < bestGradeIdx) {
          bestGradeIdx = idx;
          bestGradePlayerId = Number(pid);
          bestGradeValue = grade;
        }
      }

      if (bestGradePlayerId !== null) {
        const topRatedPlayer = await db
          .select({ name: players.name })
          .from(players)
          .where(eq(players.id, bestGradePlayerId))
          .limit(1);

        if (topRatedPlayer.length > 0) {
          const name = topRatedPlayer[0].name;
          const shortName = name.split(" ").length > 1
            ? `${name.split(" ")[0]} ${name.split(" ")[1][0]}.`
            : name;
          tickerItems.push({
            type: "leaderboard",
            label: "TOP RATED",
            value: `${shortName} - ${bestGradeValue}`,
            change: null,
            direction: null,
          });
        }
      }

      const allPlayerGameCounts = await db
        .select({
          playerId: games.playerId,
          gameCount: count(),
        })
        .from(games)
        .groupBy(games.playerId)
        .orderBy(sql`COUNT(*) DESC`)
        .limit(1);

      if (allPlayerGameCounts.length > 0) {
        const streakPlayer = await db
          .select({ name: players.name })
          .from(players)
          .where(eq(players.id, allPlayerGameCounts[0].playerId))
          .limit(1);

        if (streakPlayer.length > 0) {
          const name = streakPlayer[0].name;
          const shortName = name.split(" ").length > 1
            ? `${name.split(" ")[0]} ${name.split(" ")[1][0]}.`
            : name;
          tickerItems.push({
            type: "leaderboard",
            label: "MOST ACTIVE",
            value: `${shortName} - ${allPlayerGameCounts[0].gameCount} Games`,
            change: null,
            direction: null,
          });
        }
      }

      res.json(tickerItems);
    } catch (error) {
      console.error('Error fetching ticker data:', error);
      res.status(500).json({ message: 'Failed to fetch ticker data' });
    }
  });

  // Set user role (player, coach, recruiter, or guardian)
  app.post('/api/users/role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role } = z.object({
        role: z.enum(['player', 'coach', 'recruiter', 'guardian'])
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

  // Update user preferred sport (for multi-sport toggle)
  app.patch('/api/user/sport', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { sport } = z.object({
        sport: z.enum(['basketball', 'football'])
      }).parse(req.body);
      
      const updatedUser = await authStorage.updateUserSport(userId, sport);
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Also update the player's sport field if they have a player profile
      const player = await storage.getPlayerByUserId(userId);
      if (player) {
        await storage.updatePlayer(player.id, { sport });
      }
      
      res.json(updatedUser);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Get user's coin balance
  app.get('/api/user/coins', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await authStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ coinBalance: user.coinBalance || 0 });
    } catch (err) {
      console.error('Error fetching coin balance:', err);
      res.status(500).json({ message: 'Failed to fetch coin balance' });
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
        sport: z.enum(['basketball', 'football']).default('basketball'),
        position: z.string().min(1),
        height: z.string().optional(),
        team: z.string().optional(),
        jerseyNumber: z.number().optional(),
      }).parse(req.body);
      
      // Validate position based on sport (supports multi-position with comma-separated values)
      const validBasketballPositions = ['Guard', 'Wing', 'Big'];
      const validFootballPositions = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB', 'K', 'P'];
      const validPositions = input.sport === 'football' ? validFootballPositions : validBasketballPositions;
      
      // Split comma-separated positions and validate each one
      const positionsList = input.position.split(',').map((p: string) => p.trim()).filter((p: string) => p);
      const invalidPositions = positionsList.filter((p: string) => !validPositions.includes(p));
      
      if (invalidPositions.length > 0) {
        return res.status(400).json({ 
          message: `Invalid position(s) for ${input.sport}: ${invalidPositions.join(', ')}. Expected one of: ${validPositions.join(', ')}` 
        });
      }
      
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
    const playerId = Number(req.params.id);
    if (isNaN(playerId)) {
      return res.status(400).json({ message: 'Invalid player ID' });
    }
    const player = await storage.getPlayer(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    
    // Get player's games and calculate aggregated advanced metrics
    const playerGames = await storage.getGamesByPlayerId(player.id);
    const aggregatedAdvancedMetrics = calculateAggregatedAdvancedMetrics(playerGames);
    
    res.json({
      ...player,
      games: playerGames,
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

  app.get('/api/players/check-username/:username', async (req, res) => {
    try {
      const username = req.params.username.toLowerCase();
      if (username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.json({ available: false, reason: 'Username must be 3-20 characters, letters, numbers, and underscores only' });
      }
      const existing = await db.select({ id: players.id }).from(players).where(eq(players.username, username)).limit(1);
      res.json({ available: existing.length === 0 });
    } catch (err) {
      res.status(500).json({ message: 'Error checking username' });
    }
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
        sport: z.enum(['basketball', 'football']).optional(),
        position: z.string().optional(),
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
        level: z.enum(['middle_school', 'high_school', 'college']).optional(),
        gpa: z.number().min(0).max(4).optional(),
        widgetPreferences: z.string().optional(),
        username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores").optional(),
      });
      
      const input = updateSchema.parse(req.body);
      
      // Validate position if provided (supports multi-position with comma-separated values)
      if (input.position) {
        const playerSport = input.sport || player.sport || 'basketball';
        const validBasketballPositions = ['Guard', 'Wing', 'Big'];
        const validFootballPositions = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB', 'K', 'P'];
        const validPositions = playerSport === 'football' ? validFootballPositions : validBasketballPositions;
        
        // Split comma-separated positions and validate each one
        const positionsList = input.position.split(',').map((p: string) => p.trim()).filter((p: string) => p);
        const invalidPositions = positionsList.filter((p: string) => !validPositions.includes(p));
        
        if (invalidPositions.length > 0) {
          return res.status(400).json({ 
            message: `Invalid position(s) for ${playerSport}: ${invalidPositions.join(', ')}. Expected one of: ${validPositions.join(', ')}` 
          });
        }
      }
      // Convert GPA to string for database storage (decimal type)
      const updateData: any = { ...input };
      if (input.gpa !== undefined) {
        updateData.gpa = input.gpa.toFixed(2);
      }
      if (input.username) {
        const existing = await db.select().from(players).where(and(eq(players.username, input.username.toLowerCase()), ne(players.id, playerId))).limit(1);
        if (existing.length > 0) {
          return res.status(400).json({ message: 'This username is already taken' });
        }
        updateData.username = input.username.toLowerCase();
      }
      const updated = await storage.updatePlayer(playerId, updateData);
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

  // Update player coach contact info
  app.patch('/api/players/:id/coach-contact', isAuthenticated, async (req: any, res) => {
    try {
      const playerId = Number(req.params.id);
      
      // Only the player themselves can update their coach contact
      if (!await canModifyPlayer(req, playerId)) {
        return res.status(403).json({ message: 'You can only edit your own profile' });
      }
      
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: 'Player not found' });
      }
      
      const updateSchema = z.object({
        coachName: z.string().optional(),
        coachPhone: z.string().optional(),
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

  // Update player roster role - coaches only
  app.patch('/api/players/:id/roster-role', isCoach, async (req: any, res) => {
    try {
      const playerId = Number(req.params.id);
      
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: 'Player not found' });
      }
      
      const updateSchema = z.object({
        rosterRole: z.enum(['starter', 'rotation', 'bench', 'development']),
      });
      
      const input = updateSchema.parse(req.body);
      const updated = await storage.updatePlayer(playerId, { rosterRole: input.rosterRole });
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

  app.get('/api/players/activity-status', async (req, res) => {
    try {
      const idsParam = req.query.ids as string;
      if (!idsParam) return res.status(400).json({ message: "Missing ids query parameter" });
      const playerIds = idsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (playerIds.length === 0) return res.status(400).json({ message: "No valid player IDs provided" });
      const results = await db.select({ playerId: players.id, lastActiveAt: players.lastActiveAt }).from(players).where(inArray(players.id, playerIds));
      res.json(results);
    } catch (error) {
      console.error('Error fetching activity status:', error);
      res.status(500).json({ message: "Failed to fetch activity status" });
    }
  });

  // --- Sharing Endpoints ---

  // GET /api/players/:id/public - Public player profile for coaches/recruiters (no auth required)
  app.get('/api/players/:id/public', async (req, res) => {
    try {
      const playerId = Number(req.params.id);
      const player = await storage.getPlayer(playerId);
      
      if (!player) {
        return res.status(404).json({ message: 'Player not found' });
      }

      // Record the profile view (async, don't wait for it)
      const viewerIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress;
      const viewerUserId = (req as any).user?.id;
      const referrer = req.headers.referer || req.headers.referrer;
      const userAgent = req.headers['user-agent'];
      
      // Don't count the player viewing their own profile
      if (!viewerUserId || viewerUserId !== player.userId) {
        storage.recordProfileView(playerId, viewerIp, viewerUserId, referrer as string, userAgent)
          .catch(err => console.error('Failed to record profile view:', err));
      }
      
      const games = await storage.getGamesByPlayerId(playerId);
      const badges = await storage.getPlayerBadges(playerId);
      const skillBadges = await storage.getPlayerSkillBadges(playerId);
      const accolades = await storage.getPlayerAccolades(playerId);
      
      // Calculate averages
      const gamesPlayed = games.length;
      const avgPoints = gamesPlayed ? games.reduce((acc, g) => acc + g.points, 0) / gamesPlayed : 0;
      const avgRebounds = gamesPlayed ? games.reduce((acc, g) => acc + g.rebounds, 0) / gamesPlayed : 0;
      const avgAssists = gamesPlayed ? games.reduce((acc, g) => acc + g.assists, 0) / gamesPlayed : 0;
      
      // Football stats
      const avgPassingYards = gamesPlayed ? games.reduce((acc, g) => acc + (g.passingYards || 0), 0) / gamesPlayed : 0;
      const avgRushingYards = gamesPlayed ? games.reduce((acc, g) => acc + (g.rushingYards || 0), 0) / gamesPlayed : 0;
      const avgReceivingYards = gamesPlayed ? games.reduce((acc, g) => acc + (g.receivingYards || 0), 0) / gamesPlayed : 0;
      const totalTDs = games.reduce((acc, g) => acc + (g.passingTouchdowns || 0) + (g.rushingTouchdowns || 0) + (g.receivingTouchdowns || 0), 0);
      const avgTackles = gamesPlayed ? games.reduce((acc, g) => acc + (g.tackles || 0), 0) / gamesPlayed : 0;
      
      // Calculate average grade
      const GRADE_VALUES: Record<string, number> = {
        'A+': 100, 'A': 95, 'A-': 90,
        'B+': 88, 'B': 85, 'B-': 80,
        'C+': 78, 'C': 75, 'C-': 70,
        'D+': 68, 'D': 65, 'D-': 60,
        'F': 50,
      };
      
      let averageGrade = '—';
      if (gamesPlayed > 0) {
        const totalValue = games.reduce((acc, g) => {
          const grade = g.grade?.trim().toUpperCase() || '';
          return acc + (GRADE_VALUES[grade] || 0);
        }, 0);
        const avgValue = totalValue / gamesPlayed;
        
        if (avgValue >= 97) averageGrade = 'A+';
        else if (avgValue >= 92) averageGrade = 'A';
        else if (avgValue >= 87) averageGrade = 'A-';
        else if (avgValue >= 84) averageGrade = 'B+';
        else if (avgValue >= 81) averageGrade = 'B';
        else if (avgValue >= 77) averageGrade = 'B-';
        else if (avgValue >= 74) averageGrade = 'C+';
        else if (avgValue >= 71) averageGrade = 'C';
        else if (avgValue >= 67) averageGrade = 'C-';
        else if (avgValue >= 64) averageGrade = 'D+';
        else if (avgValue >= 61) averageGrade = 'D';
        else if (avgValue >= 55) averageGrade = 'D-';
        else averageGrade = 'F';
      }
      
      // Calculate performance trend (comparing recent 3 games vs previous 3)
      let performanceTrend = 'stable';
      const sortedGames = [...games].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      if (sortedGames.length >= 6) {
        const recentAvg = sortedGames.slice(0, 3).reduce((acc, g) => acc + (GRADE_VALUES[g.grade?.trim().toUpperCase() || ''] || 0), 0) / 3;
        const previousAvg = sortedGames.slice(3, 6).reduce((acc, g) => acc + (GRADE_VALUES[g.grade?.trim().toUpperCase() || ''] || 0), 0) / 3;
        if (recentAvg > previousAvg + 3) performanceTrend = 'improving';
        else if (recentAvg < previousAvg - 3) performanceTrend = 'declining';
      }
      
      // Recent games (last 3 for highlights)
      const recentGames = sortedGames.slice(0, 3).map(g => ({
        id: g.id,
        date: g.date,
        opponent: g.opponent,
        grade: g.grade,
        points: g.points,
        rebounds: g.rebounds,
        assists: g.assists,
        passingYards: g.passingYards,
        rushingYards: g.rushingYards,
        receivingYards: g.receivingYards,
        passingTouchdowns: g.passingTouchdowns,
        rushingTouchdowns: g.rushingTouchdowns,
        receivingTouchdowns: g.receivingTouchdowns,
        tackles: g.tackles,
      }));
      
      // Get unlocked skill badges
      const unlockedSkillBadges = skillBadges
        .filter(b => b.currentLevel !== 'none')
        .map(b => ({
          skillType: b.skillType,
          level: b.currentLevel,
        }));
      
      // Earned badges (recent 6)
      const earnedBadges = badges.slice(0, 6).map(b => ({
        type: b.badgeType,
        earnedAt: b.earnedAt,
      }));
      
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      // Filter to only public-safe fields (no exact location, GPA only shows if player opted in)
      res.json({
        player: {
          id: player.id,
          name: player.name,
          position: player.position,
          jerseyNumber: player.jerseyNumber,
          photoUrl: player.photoUrl,
          bannerUrl: player.bannerUrl,
          sport: player.sport,
          currentTier: player.currentTier,
          totalXp: player.totalXp,
          school: player.school,
          graduationYear: player.graduationYear,
          state: player.state, // Only state, not city for privacy
          gpa: player.isPublic ? player.gpa : null, // Only show GPA if profile is public
          height: player.height,
          level: player.level,
          bio: player.isPublic ? player.bio : null, // Only show bio if profile is public
        },
        stats: {
          gamesPlayed,
          averageGrade,
          performanceTrend,
          basketball: {
            ppg: Number(avgPoints.toFixed(1)),
            rpg: Number(avgRebounds.toFixed(1)),
            apg: Number(avgAssists.toFixed(1)),
          },
          football: {
            passingYpg: Number(avgPassingYards.toFixed(1)),
            rushingYpg: Number(avgRushingYards.toFixed(1)),
            receivingYpg: Number(avgReceivingYards.toFixed(1)),
            totalTDs,
            tacklesPerGame: Number(avgTackles.toFixed(1)),
          },
        },
        recentGames,
        badges: earnedBadges,
        skillBadges: unlockedSkillBadges,
        accolades: accolades.slice(0, 5).map(a => ({
          id: a.id,
          type: a.type,
          title: a.title,
          season: a.season,
        })),
        shareUrl: `${baseUrl}/profile/${playerId}/public`,
        ogImage: player.photoUrl || `${baseUrl}/og-image.png`,
      });
    } catch (err) {
      console.error('Error fetching public player profile:', err);
      res.status(500).json({ message: 'Failed to fetch player profile' });
    }
  });

  // GET /api/players/:id/profile-views - Get profile view count (requires auth, player must own profile)
  app.get('/api/players/:id/profile-views', isAuthenticated, async (req: any, res) => {
    try {
      const playerId = Number(req.params.id);
      const userId = req.user?.claims?.sub;
      
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: 'Player not found' });
      }
      
      // Only the player or a coach can see view counts
      if (player.userId !== userId) {
        // Check if user is a coach
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user || user.role !== 'coach') {
          return res.status(403).json({ message: 'Not authorized' });
        }
      }
      
      const totalViews = await storage.getProfileViewCount(playerId);
      const viewsLast30Days = await storage.getProfileViewCountLast30Days(playerId);
      
      res.json({
        playerId,
        totalViews,
        viewsLast30Days,
      });
    } catch (err) {
      console.error('Error fetching profile views:', err);
      res.status(500).json({ message: 'Failed to fetch profile views' });
    }
  });

  // GET /api/players/:id/share-card - Generate shareable stat card data
  app.get('/api/players/:id/share-card', async (req, res) => {
    try {
      const playerId = Number(req.params.id);
      const player = await storage.getPlayer(playerId);
      
      if (!player) {
        return res.status(404).json({ message: 'Player not found' });
      }
      
      const games = await storage.getGamesByPlayerId(playerId);
      const badges = await storage.getPlayerBadges(playerId);
      const skillBadges = await storage.getPlayerSkillBadges(playerId);
      
      // Calculate averages
      const gamesPlayed = games.length;
      const avgPoints = gamesPlayed ? games.reduce((acc, g) => acc + g.points, 0) / gamesPlayed : 0;
      const avgRebounds = gamesPlayed ? games.reduce((acc, g) => acc + g.rebounds, 0) / gamesPlayed : 0;
      const avgAssists = gamesPlayed ? games.reduce((acc, g) => acc + g.assists, 0) / gamesPlayed : 0;
      
      // Football stats
      const avgPassingYards = gamesPlayed ? games.reduce((acc, g) => acc + (g.passingYards || 0), 0) / gamesPlayed : 0;
      const avgRushingYards = gamesPlayed ? games.reduce((acc, g) => acc + (g.rushingYards || 0), 0) / gamesPlayed : 0;
      const totalTDs = games.reduce((acc, g) => acc + (g.passingTouchdowns || 0) + (g.rushingTouchdowns || 0) + (g.receivingTouchdowns || 0), 0);
      const avgTackles = gamesPlayed ? games.reduce((acc, g) => acc + (g.tackles || 0), 0) / gamesPlayed : 0;
      
      // Calculate average grade
      const GRADE_VALUES: Record<string, number> = {
        'A+': 100, 'A': 95, 'A-': 90,
        'B+': 88, 'B': 85, 'B-': 80,
        'C+': 78, 'C': 75, 'C-': 70,
        'D+': 68, 'D': 65, 'D-': 60,
        'F': 50,
      };
      
      let averageGrade = '—';
      if (gamesPlayed > 0) {
        const totalValue = games.reduce((acc, g) => {
          const grade = g.grade?.trim().toUpperCase() || '';
          return acc + (GRADE_VALUES[grade] || 0);
        }, 0);
        const avgValue = totalValue / gamesPlayed;
        
        if (avgValue >= 97) averageGrade = 'A+';
        else if (avgValue >= 92) averageGrade = 'A';
        else if (avgValue >= 87) averageGrade = 'A-';
        else if (avgValue >= 84) averageGrade = 'B+';
        else if (avgValue >= 81) averageGrade = 'B';
        else if (avgValue >= 77) averageGrade = 'B-';
        else if (avgValue >= 74) averageGrade = 'C+';
        else if (avgValue >= 71) averageGrade = 'C';
        else if (avgValue >= 67) averageGrade = 'C-';
        else if (avgValue >= 64) averageGrade = 'D+';
        else if (avgValue >= 61) averageGrade = 'D';
        else if (avgValue >= 55) averageGrade = 'D-';
        else averageGrade = 'F';
      }
      
      // Recent games (last 5)
      const recentGames = [...games]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)
        .map(g => ({
          id: g.id,
          date: g.date,
          opponent: g.opponent,
          grade: g.grade,
          points: g.points,
          rebounds: g.rebounds,
          assists: g.assists,
        }));
      
      // Get unlocked skill badges
      const unlockedSkillBadges = skillBadges
        .filter(b => b.currentLevel !== 'none')
        .map(b => ({
          skillType: b.skillType,
          level: b.currentLevel,
        }));
      
      // Earned badges (recent 10)
      const earnedBadges = badges.slice(0, 10).map(b => ({
        type: b.badgeType,
        earnedAt: b.earnedAt,
      }));
      
      res.json({
        player: {
          id: player.id,
          name: player.name,
          position: player.position,
          team: player.team,
          jerseyNumber: player.jerseyNumber,
          photoUrl: player.photoUrl,
          sport: player.sport,
          currentTier: player.currentTier,
          totalXp: player.totalXp,
        },
        stats: {
          gamesPlayed,
          averageGrade,
          basketball: {
            ppg: Number(avgPoints.toFixed(1)),
            rpg: Number(avgRebounds.toFixed(1)),
            apg: Number(avgAssists.toFixed(1)),
          },
          football: {
            passingYpg: Number(avgPassingYards.toFixed(1)),
            rushingYpg: Number(avgRushingYards.toFixed(1)),
            totalTDs,
            tacklesPerGame: Number(avgTackles.toFixed(1)),
          },
        },
        recentGames,
        badges: earnedBadges,
        skillBadges: unlockedSkillBadges,
        shareUrl: `${req.protocol}://${req.get('host')}/players/${playerId}`,
      });
    } catch (err) {
      console.error('Error generating share card data:', err);
      res.status(500).json({ message: 'Failed to generate share card data' });
    }
  });

  // GET /api/players/:id/achievement-share - Get shareable achievement data
  app.get('/api/players/:id/achievement-share', async (req, res) => {
    try {
      const playerId = Number(req.params.id);
      const { type, achievementId } = req.query;
      
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: 'Player not found' });
      }
      
      let achievementData: any = null;
      
      switch (type) {
        case 'badge': {
          const badges = await storage.getPlayerBadges(playerId);
          const badge = badges.find(b => b.id === Number(achievementId) || b.badgeType === achievementId);
          if (badge) {
            const badgeDef = BADGE_DEFINITIONS[badge.badgeType];
            achievementData = {
              type: 'badge',
              badge: {
                type: badge.badgeType,
                name: badgeDef?.name || badge.badgeType,
                description: badgeDef?.description || '',
                tier: badgeDef?.tier || 'bronze',
                earnedAt: badge.earnedAt,
              },
            };
          }
          break;
        }
        
        case 'milestone': {
          const games = await storage.getGamesByPlayerId(playerId);
          const gamesCount = games.length;
          
          // Define milestones
          const milestones = [
            { count: 10, name: '10 Games Played', emoji: '🏀' },
            { count: 25, name: '25 Games Played', emoji: '🔥' },
            { count: 50, name: '50 Games Played', emoji: '⭐' },
            { count: 100, name: '100 Games Played', emoji: '🏆' },
          ];
          
          const milestone = milestones.find(m => m.count === Number(achievementId));
          if (milestone && gamesCount >= milestone.count) {
            achievementData = {
              type: 'milestone',
              milestone: {
                name: milestone.name,
                count: milestone.count,
                achieved: true,
                totalGames: gamesCount,
              },
            };
          }
          break;
        }
        
        case 'grade': {
          const games = await storage.getGamesByPlayerId(playerId);
          const game = games.find(g => g.id === Number(achievementId));
          if (game && game.grade) {
            achievementData = {
              type: 'grade',
              game: {
                id: game.id,
                date: game.date,
                opponent: game.opponent,
                grade: game.grade,
                points: game.points,
                rebounds: game.rebounds,
                assists: game.assists,
              },
            };
          }
          break;
        }
        
        case 'tier_up': {
          achievementData = {
            type: 'tier_up',
            tier: {
              name: player.currentTier,
              totalXp: player.totalXp,
            },
          };
          break;
        }
        
        default:
          return res.status(400).json({ message: 'Invalid achievement type. Use: badge, milestone, grade, or tier_up' });
      }
      
      if (!achievementData) {
        return res.status(404).json({ message: 'Achievement not found' });
      }
      
      res.json({
        player: {
          id: player.id,
          name: player.name,
          position: player.position,
          team: player.team,
          photoUrl: player.photoUrl,
        },
        achievement: achievementData,
        shareUrl: `${req.protocol}://${req.get('host')}/players/${playerId}`,
      });
    } catch (err) {
      console.error('Error generating achievement share data:', err);
      res.status(500).json({ message: 'Failed to generate achievement share data' });
    }
  });

  // --- Games ---

  // Get all games for current user's players (or all games for coaches)
  app.get('/api/games', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await authStorage.getUser(userId);
      
      // For coaches, return all games
      if (user?.role === 'coach') {
        const allPlayers = await storage.getPlayersWithStats();
        const allGames: any[] = [];
        for (const player of allPlayers) {
          allGames.push(...(player.games || []));
        }
        allGames.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return res.json(allGames);
      }
      
      // For players, get games for their player profile
      const userPlayer = await storage.getPlayerByUserId(userId);
      if (!userPlayer) {
        return res.json([]);
      }
      const games = await storage.getGamesByPlayerId(userPlayer.id);
      games.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      res.json(games);
    } catch (err) {
      console.error("Error fetching games:", err);
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  function generateImprovementTips(game: any, position: string): Array<{area: string, stat: string, tip: string}> {
    const tips: Array<{area: string, stat: string, tip: string, priority: number}> = [];

    const fgPct = game.fgAttempted > 0 ? (game.fgMade / game.fgAttempted) * 100 : null;
    const threePct = game.threeAttempted > 0 ? (game.threeMade / game.threeAttempted) * 100 : null;
    const ftPct = game.ftAttempted > 0 ? (game.ftMade / game.ftAttempted) * 100 : null;

    if (fgPct !== null && fgPct < 40) {
      tips.push({
        area: "Shooting",
        stat: `FG ${Math.round(fgPct)}%`,
        tip: "Focus on shot selection — try getting closer to the basket or using screens to create open looks.",
        priority: 40 - fgPct
      });
    }

    if (threePct !== null && game.threeAttempted >= 3 && threePct < 30 && position !== "Big") {
      tips.push({
        area: "3-Point Shooting",
        stat: `3PT ${Math.round(threePct)}%`,
        tip: "Work on catch-and-shoot drills — practice 50 three-pointers from your favorite spots before next game.",
        priority: 30 - threePct
      });
    }

    if (ftPct !== null && game.ftAttempted >= 3 && ftPct < 65) {
      tips.push({
        area: "Free Throws",
        stat: `FT ${Math.round(ftPct)}%`,
        tip: "Shoot 30 free throws at the end of every practice — consistency comes from routine.",
        priority: 65 - ftPct
      });
    }

    const turnoverThreshold = position === "Guard" ? 4 : 3;
    if (game.turnovers >= turnoverThreshold) {
      tips.push({
        area: "Ball Security",
        stat: `${game.turnovers} TO`,
        tip: "Protect the ball — keep your dribble low in traffic and look for the simple pass.",
        priority: game.turnovers * 5
      });
    }

    if (position === "Guard" && game.assists < 3) {
      tips.push({
        area: "Playmaking",
        stat: `${game.assists} AST`,
        tip: "Look to create for teammates — try making one extra pass per possession to find the open man.",
        priority: (3 - game.assists) * 8
      });
    }

    if (position === "Big" && game.rebounds < 5) {
      tips.push({
        area: "Rebounding",
        stat: `${game.rebounds} REB`,
        tip: "Box out on every shot — focus on positioning and anticipating where the ball will bounce.",
        priority: (5 - game.rebounds) * 6
      });
    }

    if ((position === "Wing" || position === "Guard") && game.rebounds < 3) {
      tips.push({
        area: "Rebounding",
        stat: `${game.rebounds} REB`,
        tip: "Crash the boards on missed shots — guards who rebound create fast break opportunities.",
        priority: (3 - game.rebounds) * 4
      });
    }

    if ((game.steals || 0) === 0 && (game.blocks || 0) === 0) {
      tips.push({
        area: "Defense",
        stat: "0 STL, 0 BLK",
        tip: "Stay active on defense — focus on staying in a low stance and anticipating passes in the lane.",
        priority: 10
      });
    }

    tips.sort((a, b) => b.priority - a.priority);
    return tips.slice(0, 2).map(({ area, stat, tip }) => ({ area, stat, tip }));
  }

  // Create game - requires auth, players can only log for themselves
  app.post(api.games.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.games.create.input.parse(req.body);

      const shootingValidationErrors: string[] = [];
      if ((input.fgMade || 0) > (input.fgAttempted || 0)) {
        shootingValidationErrors.push('Field goals made cannot exceed attempted');
      }
      if ((input.threeMade || 0) > (input.threeAttempted || 0)) {
        shootingValidationErrors.push('Three-pointers made cannot exceed attempted');
      }
      if ((input.ftMade || 0) > (input.ftAttempted || 0)) {
        shootingValidationErrors.push('Free throws made cannot exceed attempted');
      }
      if ((input.completions || 0) > (input.passAttempts || 0)) {
        shootingValidationErrors.push('Completions cannot exceed pass attempts');
      }
      if ((input.fieldGoalsMade || 0) > (input.fieldGoalsAttempted || 0)) {
        shootingValidationErrors.push('Field goals made cannot exceed attempted');
      }
      if ((input.extraPointsMade || 0) > (input.extraPointsAttempted || 0)) {
        shootingValidationErrors.push('Extra points made cannot exceed attempted');
      }
      if (shootingValidationErrors.length > 0) {
        return res.status(400).json({ message: shootingValidationErrors.join('. ') });
      }

      // Check authorization - players can only log games for their own profile
      if (!await canModifyPlayer(req, input.playerId)) {
        return res.status(403).json({ message: 'You can only log games for your own profile' });
      }
      
      // Calculate Grade & Feedback
      const player = await storage.getPlayer(input.playerId);
      if (!player) return res.status(404).json({ message: "Player not found" });

      // Determine sport from input or player
      const sport = input.sport || player.sport || 'basketball';
      
      let grade: string;
      let feedback: string;
      let categoryGrades: any;
      let defenseRating = 50;
      let hustleScore = 50;
      let per = "0";

      if (sport === 'football') {
        // Football grading
        hustleScore = input.hustleScore || 50;
        const footballResult = calculateFootballGrade(input, player.position);
        grade = footballResult.grade;
        feedback = footballResult.feedback;
        categoryGrades = calculateFootballCategoryGrades(input, player.position);
      } else {
        // Basketball grading
        defenseRating = calculateDefenseRating(input, player.position);
        hustleScore = calculateHustleScore(input, player.position);
        const statsWithRatings = { ...input, defenseRating, hustleScore };
        const basketballResult = calculateGrade(statsWithRatings, player.position);
        grade = basketballResult.grade;
        feedback = basketballResult.feedback;
        categoryGrades = calculateCategoryGrades(input, player.position);
        per = ((input.points || 0) + (input.rebounds || 0) + (input.assists || 0)).toString();
      }
      
      // Inject calculated fields - include both basketball and football stats
      const gameData: any = {
        playerId: input.playerId,
        sport,
        date: input.date,
        opponent: input.opponent,
        result: input.result,
        // Basketball stats
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
        // Football stats
        completions: input.completions,
        passAttempts: input.passAttempts,
        passingYards: input.passingYards,
        passingTouchdowns: input.passingTouchdowns,
        interceptions: input.interceptions,
        sacksTaken: input.sacksTaken,
        carries: input.carries,
        rushingYards: input.rushingYards,
        rushingTouchdowns: input.rushingTouchdowns,
        fumbles: input.fumbles,
        receptions: input.receptions,
        targets: input.targets,
        receivingYards: input.receivingYards,
        receivingTouchdowns: input.receivingTouchdowns,
        drops: input.drops,
        tackles: input.tackles,
        soloTackles: input.soloTackles,
        sacks: input.sacks,
        defensiveInterceptions: input.defensiveInterceptions,
        passDeflections: input.passDeflections,
        forcedFumbles: input.forcedFumbles,
        fumbleRecoveries: input.fumbleRecoveries,
        fieldGoalsMade: input.fieldGoalsMade,
        fieldGoalsAttempted: input.fieldGoalsAttempted,
        extraPointsMade: input.extraPointsMade,
        extraPointsAttempted: input.extraPointsAttempted,
        punts: input.punts,
        puntYards: input.puntYards,
        // Calculated fields
        hustleScore,
        defenseRating,
        notes: input.notes,
        grade,
        feedback,
        per,
        // Basketball category grades
        defensiveGrade: sport === 'basketball' ? categoryGrades.defensiveGrade : null,
        shootingGrade: sport === 'basketball' ? categoryGrades.shootingGrade : null,
        reboundingGrade: sport === 'basketball' ? categoryGrades.reboundingGrade : null,
        passingGrade: sport === 'basketball' ? categoryGrades.passingGrade : null,
        // Football category grades
        efficiencyGrade: sport === 'football' ? categoryGrades.efficiencyGrade : null,
        playmakingGrade: sport === 'football' ? categoryGrades.playmakingGrade : null,
        ballSecurityGrade: sport === 'football' ? categoryGrades.ballSecurityGrade : null,
        impactGrade: sport === 'football' ? categoryGrades.impactGrade : null,
      };

      if (!gameData.season) {
        const currentSeason = await storage.getCurrentSeason();
        if (currentSeason) {
          const gameDate = new Date(gameData.date);
          const start = new Date(currentSeason.startDate);
          const end = new Date(currentSeason.endDate);
          if (gameDate >= start && gameDate <= end) {
            gameData.season = currentSeason.name;
          } else {
            const allSeasons = await storage.getSeasons();
            for (const s of allSeasons) {
              const sStart = new Date(s.startDate);
              const sEnd = new Date(s.endDate);
              if (gameDate >= sStart && gameDate <= sEnd) {
                gameData.season = s.name;
                break;
              }
            }
          }
        }
      }

      const game = await storage.createGame(gameData);
      
      // Check for personal records (career highs)
      const newRecords: Array<{statName: string, value: number, previousValue: number | null}> = [];
      const TRACKED_STATS = [
        { name: 'points', field: 'points' },
        { name: 'rebounds', field: 'rebounds' },
        { name: 'assists', field: 'assists' },
        { name: 'steals', field: 'steals' },
        { name: 'blocks', field: 'blocks' },
        { name: 'threeMade', field: 'threeMade' },
      ];

      for (const stat of TRACKED_STATS) {
        const statValue = (input as any)[stat.field] || 0;
        if (statValue <= 0) continue;
        
        const existingRecord = await db.select().from(personalRecords)
          .where(and(
            eq(personalRecords.playerId, input.playerId),
            eq(personalRecords.statName, stat.name)
          ))
          .limit(1);
        
        if (existingRecord.length === 0) {
          await db.insert(personalRecords).values({
            playerId: input.playerId,
            statName: stat.name,
            value: statValue,
            gameId: game.id,
            previousValue: null,
          });
          if (statValue >= 10 || (stat.name === 'threeMade' && statValue >= 3) || (stat.name === 'steals' && statValue >= 3) || (stat.name === 'blocks' && statValue >= 3)) {
            newRecords.push({ statName: stat.name, value: statValue, previousValue: null });
          }
        } else if (statValue > existingRecord[0].value) {
          const prev = existingRecord[0].value;
          await db.update(personalRecords).set({
            value: statValue,
            gameId: game.id,
            previousValue: prev,
            achievedAt: new Date(),
          }).where(eq(personalRecords.id, existingRecord[0].id));
          newRecords.push({ statName: stat.name, value: statValue, previousValue: prev });
        }
      }

      const STAT_LABELS: Record<string, string> = {
        points: 'Points', rebounds: 'Rebounds', assists: 'Assists',
        steals: 'Steals', blocks: 'Blocks', threeMade: '3-Pointers Made',
      };
      for (const record of newRecords) {
        await storage.createFeedActivity({
          activityType: 'badge',
          playerId: input.playerId,
          gameId: game.id,
          headline: `${player?.name || 'Player'} set a new career high: ${record.value} ${STAT_LABELS[record.statName] || record.statName}!`,
          subtext: record.previousValue ? `Previous best: ${record.previousValue}` : `First milestone recorded`,
        });
      }

      // Update goal progress
      const completedGoals: Array<{statName: string, targetValue: string}> = [];
      const activeGoals = await db.select().from(playerGoals)
        .where(and(eq(playerGoals.playerId, input.playerId), eq(playerGoals.status, 'active')));

      const allPlayerGames = await storage.getGamesByPlayerId(input.playerId);
      for (const goal of activeGoals) {
        const now = new Date();
        let filteredGames = allPlayerGames;
        if (goal.timeframe === 'weekly') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filteredGames = allPlayerGames.filter(g => new Date(g.date) >= weekAgo);
        } else if (goal.timeframe === 'monthly') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filteredGames = allPlayerGames.filter(g => new Date(g.date) >= monthAgo);
        }
        
        let currentValue = 0;
        if (filteredGames.length > 0) {
          switch (goal.statName) {
            case 'ppg': currentValue = filteredGames.reduce((a, g) => a + g.points, 0) / filteredGames.length; break;
            case 'rpg': currentValue = filteredGames.reduce((a, g) => a + g.rebounds, 0) / filteredGames.length; break;
            case 'apg': currentValue = filteredGames.reduce((a, g) => a + g.assists, 0) / filteredGames.length; break;
            case 'spg': currentValue = filteredGames.reduce((a, g) => a + (g.steals || 0), 0) / filteredGames.length; break;
            case 'fg_pct': {
              const m = filteredGames.reduce((a, g) => a + g.fgMade, 0);
              const att = filteredGames.reduce((a, g) => a + g.fgAttempted, 0);
              currentValue = att > 0 ? (m / att) * 100 : 0;
              break;
            }
            case 'three_pct': {
              const m = filteredGames.reduce((a, g) => a + g.threeMade, 0);
              const att = filteredGames.reduce((a, g) => a + g.threeAttempted, 0);
              currentValue = att > 0 ? (m / att) * 100 : 0;
              break;
            }
            case 'games_played': currentValue = filteredGames.length; break;
          }
        }
        
        const wasActive = goal.status === 'active';
        const isNowComplete = currentValue >= parseFloat(goal.targetValue as string);
        
        await db.update(playerGoals).set({
          currentValue: currentValue.toFixed(2),
          status: isNowComplete ? 'completed' : 'active',
          completedAt: isNowComplete && wasActive ? new Date() : goal.completedAt,
        }).where(eq(playerGoals.id, goal.id));
        
        if (isNowComplete && wasActive) {
          completedGoals.push({ statName: goal.statName, targetValue: goal.targetValue as string });
          await storage.createFeedActivity({
            activityType: 'goal',
            playerId: input.playerId,
            gameId: game.id,
            headline: `${player?.name || 'Player'} completed a goal!`,
            subtext: `Target: ${goal.targetValue} ${goal.statName.toUpperCase().replace('_', ' ')}`,
          });
        }
      }

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
        const skillDef = sport === 'football'
          ? FOOTBALL_SKILL_BADGE_TYPES[upgrade.skill as keyof typeof FOOTBALL_SKILL_BADGE_TYPES]
          : SKILL_BADGE_TYPES[upgrade.skill as keyof typeof SKILL_BADGE_TYPES];
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
        most_improved: "Most Improved",
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
      
      // --- Coin Rewards ---
      let coinsEarned = 0;
      if (player.userId) {
        // Base coins for logging a game
        coinsEarned += getCoinsForAction('game_logged');
        
        // Grade bonuses
        if (grade === 'A+') coinsEarned += getCoinsForAction('a_plus_grade');
        else if (grade.startsWith('A')) coinsEarned += getCoinsForAction('a_grade');
        
        // Badge bonuses
        coinsEarned += awardedBadges.length * getCoinsForAction('badge_earned');
        
        if (coinsEarned > 0) {
          await awardCoins(player.userId, coinsEarned, 'earned_game', `Earned ${coinsEarned} coins from game vs ${input.opponent}`);
        }
      }
      
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
          
          // Award tier promotion coins
          if (player.userId) {
            const tierCoins = getCoinsForAction('tier_up');
            await awardCoins(player.userId, tierCoins, 'earned_tier_up', `Earned ${tierCoins} coins for reaching ${newTier} tier!`);
            coinsEarned += tierCoins;
          }
        }
      }
      
      // Update activity streak
      await updateActivityStreak(input.playerId, 'daily_game');
      
      // Check for performance alerts (drop detection)
      await checkPerformanceAlerts(input.playerId, game.id, input, grade, sport);
      
      // Calculate advanced metrics for the game
      const advancedMetrics = calculateAdvancedMetrics(input);
      
      const improvementTips = sport === 'basketball' ? generateImprovementTips(game, player?.position || '') : [];

      res.status(201).json({ 
        ...game, 
        xpEarned, 
        coinsEarned,
        newTier, 
        totalXp: updatedPlayer.totalXp, 
        currentTier: updatedPlayer.currentTier,
        advancedMetrics,
        newRecords,
        completedGoals,
        improvementTips
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
    
    // Choose badge types based on player's sport
    const isFootball = player.sport === 'football';
    const badgeTypes = isFootball ? FOOTBALL_SKILL_BADGE_TYPES : SKILL_BADGE_TYPES;
    
    // Enrich with badge definitions
    const enrichedBadges = skillBadges.map(badge => {
      const def = isFootball 
        ? FOOTBALL_SKILL_BADGE_TYPES[badge.skillType as keyof typeof FOOTBALL_SKILL_BADGE_TYPES]
        : SKILL_BADGE_TYPES[badge.skillType as keyof typeof SKILL_BADGE_TYPES];
      return {
        ...badge,
        name: def?.name || badge.skillType,
        description: def?.description || '',
        thresholds: def?.thresholds || {},
      };
    });
    
    // Also return badges that don't exist yet (show all possible skill badges for this sport)
    const allBadges = Object.entries(badgeTypes).map(([type, def]) => {
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

  // --- Personal Records ---

  app.get('/api/players/:id/personal-records', async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const records = await db.select().from(personalRecords).where(eq(personalRecords.playerId, playerId));
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch personal records" });
    }
  });

  // --- Player Goals (stat-based with timeframes) ---

  app.get('/api/players/:id/player-goals', async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const goals = await db.select().from(playerGoals)
        .where(eq(playerGoals.playerId, playerId))
        .orderBy(desc(playerGoals.createdAt));
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  app.post('/api/players/:id/player-goals', isAuthenticated, async (req: any, res) => {
    try {
      const playerId = parseInt(req.params.id);
      if (!await canModifyPlayer(req, playerId)) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const { statName, targetValue, timeframe } = req.body;
      if (!statName || !targetValue) {
        return res.status(400).json({ message: "statName and targetValue are required" });
      }
      
      const playerGames = await storage.getGamesByPlayerId(playerId);
      let currentValue = 0;
      
      const now = new Date();
      let filteredGames = playerGames;
      if (timeframe === 'weekly') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredGames = playerGames.filter(g => new Date(g.date) >= weekAgo);
      } else if (timeframe === 'monthly') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredGames = playerGames.filter(g => new Date(g.date) >= monthAgo);
      }
      
      if (filteredGames.length > 0) {
        switch (statName) {
          case 'ppg': currentValue = filteredGames.reduce((a, g) => a + g.points, 0) / filteredGames.length; break;
          case 'rpg': currentValue = filteredGames.reduce((a, g) => a + g.rebounds, 0) / filteredGames.length; break;
          case 'apg': currentValue = filteredGames.reduce((a, g) => a + g.assists, 0) / filteredGames.length; break;
          case 'spg': currentValue = filteredGames.reduce((a, g) => a + (g.steals || 0), 0) / filteredGames.length; break;
          case 'fg_pct': {
            const totalMade = filteredGames.reduce((a, g) => a + g.fgMade, 0);
            const totalAttempted = filteredGames.reduce((a, g) => a + g.fgAttempted, 0);
            currentValue = totalAttempted > 0 ? (totalMade / totalAttempted) * 100 : 0;
            break;
          }
          case 'three_pct': {
            const totalMade = filteredGames.reduce((a, g) => a + g.threeMade, 0);
            const totalAttempted = filteredGames.reduce((a, g) => a + g.threeAttempted, 0);
            currentValue = totalAttempted > 0 ? (totalMade / totalAttempted) * 100 : 0;
            break;
          }
          case 'games_played': currentValue = filteredGames.length; break;
        }
      }
      
      const status = currentValue >= parseFloat(targetValue) ? 'completed' : 'active';
      
      const [goal] = await db.insert(playerGoals).values({
        playerId,
        statName,
        targetValue,
        currentValue: currentValue.toFixed(2),
        timeframe: timeframe || 'season',
        status,
        completedAt: status === 'completed' ? new Date() : null,
      }).returning();
      
      res.status(201).json(goal);
    } catch (error) {
      console.error('Error creating goal:', error);
      res.status(500).json({ message: "Failed to create goal" });
    }
  });

  app.delete('/api/players/:id/player-goals/:goalId', isAuthenticated, async (req: any, res) => {
    try {
      const playerId = parseInt(req.params.id);
      if (!await canModifyPlayer(req, playerId)) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      await db.delete(playerGoals).where(
        and(eq(playerGoals.id, parseInt(req.params.goalId)), eq(playerGoals.playerId, playerId))
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete goal" });
    }
  });

  // --- Weekly Recap ---

  app.get('/api/players/:id/weekly-recap', async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const player = await storage.getPlayer(playerId);
      if (!player) return res.status(404).json({ message: "Player not found" });
      
      const allGames = await storage.getGamesByPlayerId(playerId);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisWeekGames = allGames.filter(g => new Date(g.date) >= weekAgo);
      const prevWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const lastWeekGames = allGames.filter(g => {
        const d = new Date(g.date);
        return d >= prevWeekStart && d < weekAgo;
      });
      
      if (thisWeekGames.length === 0) {
        return res.json({ hasData: false });
      }
      
      const gamesPlayed = thisWeekGames.length;
      const ppg = thisWeekGames.reduce((a, g) => a + g.points, 0) / gamesPlayed;
      const rpg = thisWeekGames.reduce((a, g) => a + g.rebounds, 0) / gamesPlayed;
      const apg = thisWeekGames.reduce((a, g) => a + g.assists, 0) / gamesPlayed;
      
      const GRADE_VALUES: Record<string, number> = {
        'A+': 100, 'A': 95, 'A-': 90, 'B+': 88, 'B': 85, 'B-': 80,
        'C+': 78, 'C': 75, 'C-': 70, 'D+': 68, 'D': 65, 'D-': 60, 'F': 50,
      };
      const avgGradeValue = thisWeekGames.reduce((acc, g) => acc + (GRADE_VALUES[g.grade?.trim().toUpperCase() || ''] || 0), 0) / gamesPlayed;
      let avgGrade = 'N/A';
      if (avgGradeValue >= 97) avgGrade = 'A+';
      else if (avgGradeValue >= 92) avgGrade = 'A';
      else if (avgGradeValue >= 87) avgGrade = 'A-';
      else if (avgGradeValue >= 84) avgGrade = 'B+';
      else if (avgGradeValue >= 81) avgGrade = 'B';
      else if (avgGradeValue >= 77) avgGrade = 'B-';
      else if (avgGradeValue >= 74) avgGrade = 'C+';
      else if (avgGradeValue >= 71) avgGrade = 'C';
      else if (avgGradeValue >= 67) avgGrade = 'C-';
      else if (avgGradeValue >= 64) avgGrade = 'D+';
      else if (avgGradeValue >= 61) avgGrade = 'D';
      else if (avgGradeValue >= 55) avgGrade = 'D-';
      else avgGrade = 'F';
      
      let ppgChange = 0;
      if (lastWeekGames.length > 0) {
        const lastPpg = lastWeekGames.reduce((a, g) => a + g.points, 0) / lastWeekGames.length;
        ppgChange = ppg - lastPpg;
      }
      
      const playerBadges = await storage.getPlayerBadges(playerId);
      const weeklyBadges = playerBadges.filter(b => b.earnedAt && new Date(b.earnedAt) >= weekAgo);
      
      const bestGame = thisWeekGames.reduce((best, g) => {
        const score = g.points + g.rebounds * 1.2 + g.assists * 1.5;
        const bestScore = best.points + best.rebounds * 1.2 + best.assists * 1.5;
        return score > bestScore ? g : best;
      }, thisWeekGames[0]);
      
      res.json({
        hasData: true,
        playerName: player.name,
        weekStart: weekAgo.toISOString(),
        weekEnd: now.toISOString(),
        gamesPlayed,
        avgGrade,
        ppg: parseFloat(ppg.toFixed(1)),
        rpg: parseFloat(rpg.toFixed(1)),
        apg: parseFloat(apg.toFixed(1)),
        ppgChange: parseFloat(ppgChange.toFixed(1)),
        badgesEarned: weeklyBadges.length,
        bestGame: bestGame ? {
          id: bestGame.id,
          opponent: bestGame.opponent,
          points: bestGame.points,
          rebounds: bestGame.rebounds,
          assists: bestGame.assists,
          grade: bestGame.grade,
        } : null,
      });
    } catch (error) {
      console.error('Error getting weekly recap:', error);
      res.status(500).json({ message: "Failed to get weekly recap" });
    }
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

  app.post('/api/players/:id/goals', isAuthenticated, async (req: any, res) => {
    try {
      const playerId = Number(req.params.id);
      if (!await canModifyPlayer(req, playerId)) {
        return res.status(403).json({ message: "Not authorized to modify this profile" });
      }
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

  app.patch('/api/goals/:id', isAuthenticated, async (req: any, res) => {
    const goalId = Number(req.params.id);
    const updates = req.body;
    
    // Get the existing goal to check if it's being completed
    const existingGoal = await storage.getGoal(goalId);
    if (!existingGoal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    if (!await canModifyPlayer(req, existingGoal.playerId)) {
      return res.status(403).json({ message: "Not authorized to modify this profile" });
    }
    
    const updatedGoal = await storage.updateGoal(goalId, updates);
    if (!updatedGoal) {
      return res.status(500).json({ message: 'Failed to update goal' });
    }
    
    // Award coins if goal is being marked as completed for the first time
    let coinsAwarded = 0;
    if (updates.completed === true && !existingGoal.completed) {
      const player = await storage.getPlayer(existingGoal.playerId);
      if (player?.userId) {
        coinsAwarded = getCoinsForAction('goal_completed');
        await awardCoins(player.userId, coinsAwarded, 'earned_goal', `Completed goal: ${existingGoal.title}`);
      }
    }
    
    res.json({ ...updatedGoal, coinsAwarded });
  });

  app.delete('/api/goals/:id', isAuthenticated, async (req: any, res) => {
    const goalId = Number(req.params.id);
    const existingGoal = await storage.getGoal(goalId);
    if (!existingGoal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    if (!await canModifyPlayer(req, existingGoal.playerId)) {
      return res.status(403).json({ message: "Not authorized to modify this profile" });
    }
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

  app.post('/api/players/:id/check-in', isAuthenticated, async (req: any, res) => {
    try {
      const playerId = parseInt(req.params.id);
      if (isNaN(playerId)) return res.status(400).json({ message: "Invalid player ID" });

      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user?.playerId || user.playerId !== playerId) {
        return res.status(403).json({ message: "You can only check in for your own player" });
      }

      const result = await updateActivityStreak(playerId, 'daily_login');

      if (result.isNewMilestone && result.milestoneReached) {
        const xpRewards: Record<number, number> = { 3: 25, 7: 75, 14: 150, 30: 300 };
        const xpAmount = xpRewards[result.milestoneReached] || 0;
        if (xpAmount > 0) {
          const player = await storage.getPlayer(playerId);
          if (player) {
            await storage.updatePlayer(playerId, {
              totalXp: (player.totalXp || 0) + xpAmount
            });
          }
        }
      }

      const streaks = await storage.getPlayerActivityStreaks(playerId);
      res.json({
        checkedIn: true,
        streakCount: result.streakCount,
        isNewMilestone: result.isNewMilestone,
        milestoneReached: result.milestoneReached,
        streaks
      });
    } catch (error) {
      console.error('Error checking in:', error);
      res.status(500).json({ message: "Failed to check in" });
    }
  });

  app.post('/api/players/:id/heartbeat', isAuthenticated, async (req: any, res) => {
    try {
      const playerId = parseInt(req.params.id);
      if (isNaN(playerId)) return res.status(400).json({ message: "Invalid player ID" });
      const canModify = await canModifyPlayer(req, playerId);
      if (!canModify) {
        return res.status(403).json({ message: "Not authorized" });
      }
      await db.update(players).set({ lastActiveAt: new Date() }).where(eq(players.id, playerId));
      res.json({ ok: true });
    } catch (error) {
      console.error('Error updating heartbeat:', error);
      res.status(500).json({ message: "Failed to update heartbeat" });
    }
  });

  app.get('/api/players/:id/weekly-recap', async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      if (isNaN(playerId)) return res.status(400).json({ message: "Invalid player ID" });
      
      const player = await storage.getPlayer(playerId);
      if (!player) return res.status(404).json({ message: "Player not found" });
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const allGames = await storage.getGamesByPlayerId(playerId);
      const weekGames = allGames.filter(g => new Date(g.createdAt!) >= oneWeekAgo);
      
      if (weekGames.length === 0) {
        return res.json({ 
          hasRecap: false, 
          playerName: player.name,
          sport: player.sport,
          message: "No games logged this week" 
        });
      }
      
      const sport = player.sport || 'basketball';
      let totalPoints = 0;
      let totalRebounds = 0;
      let totalAssists = 0;
      let totalTouchdowns = 0;
      let totalYards = 0;
      let totalGrades: number[] = [];
      let bestGrade = '';
      let bestGradeValue = 0;
      
      const gradeValues: Record<string, number> = { 'A+': 12, 'A': 11, 'A-': 10, 'B+': 9, 'B': 8, 'B-': 7, 'C+': 6, 'C': 5, 'C-': 4, 'D+': 3, 'D': 2, 'D-': 1, 'F': 0 };
      
      for (const game of weekGames) {
        if (sport === 'basketball') {
          totalPoints += (game.fgMade || 0) * 2 + (game.threeMade || 0) * 3 + (game.ftMade || 0);
          totalRebounds += (game.rebounds || 0);
          totalAssists += (game.assists || 0);
        } else {
          totalTouchdowns += (game.passingTouchdowns || 0) + (game.rushingTouchdowns || 0) + (game.receivingTouchdowns || 0);
          totalYards += (game.passingYards || 0) + (game.rushingYards || 0) + (game.receivingYards || 0);
        }
        
        const grade = game.grade || 'C';
        const gv = gradeValues[grade] || 5;
        totalGrades.push(gv);
        if (gv > bestGradeValue) {
          bestGradeValue = gv;
          bestGrade = grade;
        }
      }
      
      const avgGradeValue = totalGrades.reduce((a, b) => a + b, 0) / totalGrades.length;
      const gradeEntries = Object.entries(gradeValues);
      const avgGrade = gradeEntries.reduce((closest, [grade, val]) => 
        Math.abs(val - avgGradeValue) < Math.abs(gradeValues[closest] - avgGradeValue) ? grade : closest
      , 'C');
      
      const streaks = await storage.getPlayerActivityStreaks(playerId);
      const dailyStreak = streaks.find(s => s.streakType === 'daily_login' || s.streakType === 'daily_game');
      
      const allBadges = await storage.getPlayerBadges(playerId);
      const weekBadges = allBadges.filter(b => new Date(b.earnedAt!) >= oneWeekAgo);
      
      res.json({
        hasRecap: true,
        playerName: player.name,
        playerPhoto: player.photoUrl,
        sport,
        position: player.position,
        weekStartDate: oneWeekAgo.toISOString(),
        weekEndDate: new Date().toISOString(),
        gamesPlayed: weekGames.length,
        avgGrade,
        bestGrade,
        totalPoints,
        avgPoints: sport === 'basketball' ? Math.round(totalPoints / weekGames.length * 10) / 10 : 0,
        totalRebounds,
        totalAssists,
        totalTouchdowns,
        totalYards,
        currentStreak: dailyStreak?.currentStreak || 0,
        badgesEarned: weekBadges.length,
        gradeTrend: totalGrades.length >= 2 
          ? totalGrades[totalGrades.length - 1] > totalGrades[0] ? 'up' : totalGrades[totalGrades.length - 1] < totalGrades[0] ? 'down' : 'stable'
          : 'stable',
      });
    } catch (error) {
      console.error('Error generating weekly recap:', error);
      res.status(500).json({ message: "Failed to generate weekly recap" });
    }
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
    
    // Award daily login XP and coins only if this is first activity today
    let coinsAwarded = 0;
    if (!alreadyActiveToday) {
      await storage.addPlayerXp(playerId, XP_REWARDS.daily_login);
      
      // Award daily login coins
      if (player.userId) {
        coinsAwarded = getCoinsForAction('daily_login');
        
        // Add streak bonus coins if milestone reached
        if (result.isNewMilestone && result.milestoneReached) {
          const streakKey = `streak_bonus_${result.milestoneReached}` as keyof typeof COIN_REWARDS;
          if (COIN_REWARDS[streakKey]) {
            coinsAwarded += COIN_REWARDS[streakKey];
          }
        }
        
        if (coinsAwarded > 0) {
          await awardCoins(player.userId, coinsAwarded, 'earned_activity', 
            result.isNewMilestone 
              ? `Earned ${coinsAwarded} coins for ${result.milestoneReached}-day streak!`
              : `Daily login bonus: ${coinsAwarded} coins`
          );
        }
      }
    }
    
    const updatedPlayer = await storage.getPlayer(playerId);
    
    res.json({
      streakCount: result.streakCount,
      isNewMilestone: result.isNewMilestone,
      milestoneReached: result.milestoneReached,
      totalXp: updatedPlayer?.totalXp || 0,
      currentTier: updatedPlayer?.currentTier || 'Rookie',
      xpAwarded: alreadyActiveToday ? 0 : XP_REWARDS.daily_login,
      coinsAwarded,
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
                        { currentStreak: 0, longestStreak: 0, lastActivityDate: null };
    
    // Calculate grace period status
    // Grace period: if player missed 1 day (activity was yesterday), they can still maintain streak
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    let streakInGracePeriod = false;
    let hoursUntilStreakLost = 0;
    
    if (dailyStreak.lastActivityDate) {
      const lastDate = new Date(dailyStreak.lastActivityDate);
      const lastDateOnly = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
      
      // If last activity was yesterday, we're in grace period
      if (lastDateOnly.getTime() === yesterday.getTime() && dailyStreak.currentStreak > 0) {
        streakInGracePeriod = true;
        // Calculate hours until end of day (when streak will be lost if not active)
        const endOfDay = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        hoursUntilStreakLost = Math.floor((endOfDay.getTime() - now.getTime()) / (60 * 60 * 1000));
      }
    }
    
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
      streakInGracePeriod,
      hoursUntilStreakLost: streakInGracePeriod ? hoursUntilStreakLost : 0,
    });
  });

  // --- Share Game to Feed ---

  app.get('/api/games/shared-ids', isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user || !user.playerId) {
        return res.json([]);
      }
      const results = await db.select({ gameId: feedActivities.gameId })
        .from(feedActivities)
        .where(and(eq(feedActivities.activityType, 'game'), eq(feedActivities.playerId, user.playerId)));
      const ids = results.map(r => r.gameId).filter(Boolean);
      res.json(ids);
    } catch (error) {
      console.error('Error fetching shared game IDs:', error);
      res.status(500).json({ message: 'Failed to fetch shared game IDs' });
    }
  });

  app.post('/api/games/:id/share', isAuthenticated, async (req: any, res) => {
    try {
      const gameId = Number(req.params.id);
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user || !user.playerId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: 'Game not found' });
      }

      if (game.playerId !== user.playerId) {
        return res.status(403).json({ message: 'You can only share your own games' });
      }

      const existing = await db.select().from(feedActivities)
        .where(and(eq(feedActivities.activityType, 'game'), eq(feedActivities.gameId, gameId)))
        .limit(1);

      if (existing.length > 0) {
        return res.status(409).json({ message: 'Game already shared to feed' });
      }

      const player = await storage.getPlayer(game.playerId);
      const fgAttempted = game.fgAttempted ?? 0;
      const fgMade = game.fgMade ?? 0;
      const stl = game.steals ?? 0;
      const blk = game.blocks ?? 0;
      const fgPct = fgAttempted > 0 ? Math.round((fgMade / fgAttempted) * 100) : null;
      const statParts = [`${game.rebounds} REB`, `${game.assists} AST`];
      if (stl > 0) statParts.push(`${stl} STL`);
      if (blk > 0) statParts.push(`${blk} BLK`);
      const fgLine = fgPct !== null ? ` | FG: ${fgMade}/${fgAttempted} (${fgPct}%)` : '';

      const activity = await storage.createFeedActivity({
        activityType: 'game',
        playerId: game.playerId,
        gameId: game.id,
        headline: `${player?.name || 'Player'} dropped ${game.points} PTS vs ${game.opponent}`,
        subtext: `Grade: ${game.grade} | ${statParts.join(', ')}${fgLine}`,
      });

      res.json(activity);
    } catch (error) {
      console.error('Error sharing game to feed:', error);
      res.status(500).json({ message: 'Failed to share game to feed' });
    }
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
        // Support comma-separated positions - match if player has ANY of the specified positions
        results = results.filter(p => {
          const playerPositions = p.position?.split(',').map(pos => pos.trim()) || [];
          return playerPositions.includes(position as string);
        });
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
      const { 
        sport, position, state, school, graduationYear, search, openOnly, 
        minGpa, minThreePct, minPpg, minRpg, minApg, minSpg, minBpg, 
        minPassYds, minRushYds, minRecYds, minTackles, minSacks, minDefInt,
        caliberOnly 
      } = req.query;
      
      // Default to basketball if no sport specified
      const selectedSport = (sport as string) || 'basketball';
      
      const playersWithStats = await storage.getPlayersWithStats();
      
      // Fetch all caliber badges once for efficiency
      const allCaliberBadges = await storage.getAllCaliberBadges();
      
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
        
        // Fetch highlight, badge counts, and football metrics in parallel
        const [highlightCount, badgeCount, fbMetrics] = await Promise.all([
          storage.getPlayerHighlightCount(player.id),
          storage.getPlayerBadgeCount(player.id),
          player.sport === 'football' ? storage.getFootballMetrics(player.id) : Promise.resolve(null),
        ]);
        
        // Check if player has caliber badge
        const hasCaliberBadge = allCaliberBadges.some(cb => cb.playerId === player.id);
        
        if (gamesPlayed === 0) {
          return {
            id: player.id,
            name: player.name,
            sport: player.sport || 'basketball',
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
            spg: 0,
            bpg: 0,
            passingYards: 0,
            passingTouchdowns: 0,
            rushingYards: 0,
            rushingTouchdowns: 0,
            receivingYards: 0,
            receivingTouchdowns: 0,
            tackles: 0,
            sacks: 0,
            defensiveInterceptions: 0,
            avgGrade: null,
            avgGradeScore: 0,
            gamesPlayed: 0,
            openToOpportunities: player.openToOpportunities || false,
            highlightCount,
            badgeCount,
            gpa: player.gpa ? parseFloat(player.gpa) : null,
            threePtPct: null,
            completionPct: null,
            hasCaliberBadge,
            // Football metrics
            fortyYardDash: fbMetrics?.fortyYardDash ?? null,
            verticalJump: fbMetrics?.verticalJump ?? null,
            totalPointsSIS: fbMetrics?.totalPointsSIS ?? null,
            physicality: fbMetrics?.physicality ?? null,
            footballIQ: fbMetrics?.footballIQ ?? null,
            leadership: fbMetrics?.leadership ?? null,
          };
        }

        // Basketball stats
        const ppg = games.reduce((acc, g) => acc + g.points, 0) / gamesPlayed;
        const rpg = games.reduce((acc, g) => acc + g.rebounds, 0) / gamesPlayed;
        const apg = games.reduce((acc, g) => acc + g.assists, 0) / gamesPlayed;
        const spg = games.reduce((acc, g) => acc + (g.steals || 0), 0) / gamesPlayed;
        const bpg = games.reduce((acc, g) => acc + (g.blocks || 0), 0) / gamesPlayed;
        
        // Calculate 3PT%
        const totalThreeMade = games.reduce((acc, g) => acc + (g.threeMade || 0), 0);
        const totalThreeAttempted = games.reduce((acc, g) => acc + (g.threeAttempted || 0), 0);
        const threePtPct = totalThreeAttempted > 0 ? (totalThreeMade / totalThreeAttempted) * 100 : null;
        
        // Football stats (totals for the season)
        const passingYards = games.reduce((acc, g) => acc + (g.passingYards || 0), 0);
        const passingTouchdowns = games.reduce((acc, g) => acc + (g.passingTouchdowns || 0), 0);
        const rushingYards = games.reduce((acc, g) => acc + (g.rushingYards || 0), 0);
        const rushingTouchdowns = games.reduce((acc, g) => acc + (g.rushingTouchdowns || 0), 0);
        const receivingYards = games.reduce((acc, g) => acc + (g.receivingYards || 0), 0);
        const receivingTouchdowns = games.reduce((acc, g) => acc + (g.receivingTouchdowns || 0), 0);
        const tackles = games.reduce((acc, g) => acc + (g.tackles || 0), 0);
        const sacks = games.reduce((acc, g) => acc + (g.sacks || 0), 0);
        const defensiveInterceptions = games.reduce((acc, g) => acc + (g.defensiveInterceptions || 0), 0);
        
        // Calculate completion percentage for QBs
        const totalCompletions = games.reduce((acc, g) => acc + (g.completions || 0), 0);
        const totalPassAttempts = games.reduce((acc, g) => acc + (g.passAttempts || 0), 0);
        const completionPct = totalPassAttempts > 0 ? (totalCompletions / totalPassAttempts) * 100 : null;
        
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
          sport: player.sport || 'basketball',
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
          spg: Number(spg.toFixed(1)),
          bpg: Number(bpg.toFixed(1)),
          passingYards,
          passingTouchdowns,
          rushingYards,
          rushingTouchdowns,
          receivingYards,
          receivingTouchdowns,
          tackles,
          sacks,
          defensiveInterceptions,
          avgGrade,
          avgGradeScore,
          gamesPlayed,
          openToOpportunities: player.openToOpportunities || false,
          highlightCount,
          badgeCount,
          gpa: player.gpa ? parseFloat(player.gpa) : null,
          threePtPct: threePtPct !== null ? Number(threePtPct.toFixed(1)) : null,
          completionPct: completionPct !== null ? Number(completionPct.toFixed(1)) : null,
          hasCaliberBadge,
          // Football metrics
          fortyYardDash: fbMetrics?.fortyYardDash ?? null,
          verticalJump: fbMetrics?.verticalJump ?? null,
          totalPointsSIS: fbMetrics?.totalPointsSIS ?? null,
          physicality: fbMetrics?.physicality ?? null,
          footballIQ: fbMetrics?.footballIQ ?? null,
          leadership: fbMetrics?.leadership ?? null,
        };
      }));

      // Filter by sport first
      results = results.filter(p => p.sport === selectedSport);

      // Apply filters
      if (position && position !== 'All') {
        // Support comma-separated positions - match if player has ANY of the specified positions
        results = results.filter(p => {
          const playerPositions = p.position?.split(',').map(pos => pos.trim()) || [];
          return playerPositions.includes(position as string);
        });
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

      // Filter by minimum GPA - players without GPA are NOT filtered out
      if (minGpa && typeof minGpa === 'string') {
        const gpaThreshold = parseFloat(minGpa);
        if (!isNaN(gpaThreshold)) {
          results = results.filter(p => p.gpa === null || p.gpa >= gpaThreshold);
        }
      }

      // Filter by minimum 3PT%
      if (minThreePct && typeof minThreePct === 'string') {
        const threePctThreshold = parseFloat(minThreePct);
        if (!isNaN(threePctThreshold)) {
          results = results.filter(p => p.threePtPct !== null && p.threePtPct >= threePctThreshold);
        }
      }

      // Filter by minimum PPG
      if (minPpg && typeof minPpg === 'string') {
        const ppgThreshold = parseFloat(minPpg);
        if (!isNaN(ppgThreshold)) {
          results = results.filter(p => p.ppg >= ppgThreshold);
        }
      }

      // Filter by minimum RPG
      if (minRpg && typeof minRpg === 'string') {
        const rpgThreshold = parseFloat(minRpg);
        if (!isNaN(rpgThreshold)) {
          results = results.filter(p => p.rpg >= rpgThreshold);
        }
      }

      // Filter by minimum APG
      if (minApg && typeof minApg === 'string') {
        const apgThreshold = parseFloat(minApg);
        if (!isNaN(apgThreshold)) {
          results = results.filter(p => p.apg >= apgThreshold);
        }
      }

      // Filter by minimum SPG
      if (minSpg && typeof minSpg === 'string') {
        const spgThreshold = parseFloat(minSpg);
        if (!isNaN(spgThreshold)) {
          results = results.filter(p => p.spg >= spgThreshold);
        }
      }

      // Filter by minimum BPG
      if (minBpg && typeof minBpg === 'string') {
        const bpgThreshold = parseFloat(minBpg);
        if (!isNaN(bpgThreshold)) {
          results = results.filter(p => p.bpg >= bpgThreshold);
        }
      }

      // Football-specific filters
      if (minPassYds && typeof minPassYds === 'string') {
        const passYdsThreshold = parseFloat(minPassYds);
        if (!isNaN(passYdsThreshold)) {
          results = results.filter(p => p.passingYards >= passYdsThreshold);
        }
      }

      if (minRushYds && typeof minRushYds === 'string') {
        const rushYdsThreshold = parseFloat(minRushYds);
        if (!isNaN(rushYdsThreshold)) {
          results = results.filter(p => p.rushingYards >= rushYdsThreshold);
        }
      }

      if (minRecYds && typeof minRecYds === 'string') {
        const recYdsThreshold = parseFloat(minRecYds);
        if (!isNaN(recYdsThreshold)) {
          results = results.filter(p => p.receivingYards >= recYdsThreshold);
        }
      }

      if (minTackles && typeof minTackles === 'string') {
        const tacklesThreshold = parseFloat(minTackles);
        if (!isNaN(tacklesThreshold)) {
          results = results.filter(p => p.tackles >= tacklesThreshold);
        }
      }

      if (minSacks && typeof minSacks === 'string') {
        const sacksThreshold = parseFloat(minSacks);
        if (!isNaN(sacksThreshold)) {
          results = results.filter(p => p.sacks >= sacksThreshold);
        }
      }

      if (minDefInt && typeof minDefInt === 'string') {
        const defIntThreshold = parseFloat(minDefInt);
        if (!isNaN(defIntThreshold)) {
          results = results.filter(p => p.defensiveInterceptions >= defIntThreshold);
        }
      }

      // Filter by Caliber Badge only
      if (caliberOnly === 'true') {
        results = results.filter(p => p.hasCaliberBadge);
      }

      // Sort based on sortBy parameter
      const sortByParam = (req.query.sortBy as string) || 'grade';
      switch (sortByParam) {
        case 'games':
          results.sort((a, b) => b.gamesPlayed - a.gamesPlayed);
          break;
        case 'ppg':
          results.sort((a, b) => b.ppg - a.ppg);
          break;
        case 'rpg':
          results.sort((a, b) => b.rpg - a.rpg);
          break;
        case 'apg':
          results.sort((a, b) => b.apg - a.apg);
          break;
        case 'passYds':
          results.sort((a, b) => b.passingYards - a.passingYards);
          break;
        case 'rushYds':
          results.sort((a, b) => b.rushingYards - a.rushingYards);
          break;
        case 'recYds':
          results.sort((a, b) => b.receivingYards - a.receivingYards);
          break;
        case 'tackles':
          results.sort((a, b) => b.tackles - a.tackles);
          break;
        case 'grade':
        default:
          results.sort((a, b) => b.avgGradeScore - a.avgGradeScore);
          break;
      }

      // Remove internal fields before sending
      const response = results.map(({ avgGradeScore, ...rest }) => rest);
      res.json(response);
    } catch (err) {
      console.error('Discover players error:', err);
      res.status(500).json({ message: 'Error fetching discover data' });
    }
  });

  app.get(api.analytics.leaderboard.path, async (req, res) => {
    const { state, position, level, sport, city } = req.query as { state?: string; position?: string; level?: string; sport?: string; city?: string };
    
    let playersList = await storage.getPlayers();
    
    // Apply filters
    if (sport) {
      playersList = playersList.filter(p => p.sport === sport);
    }
    if (state) {
      playersList = playersList.filter(p => p.state === state);
    }
    if (city) {
      playersList = playersList.filter(p => p.city?.toLowerCase() === city.toLowerCase());
    }
    if (position) {
      // Support comma-separated positions - match if player has ANY of the specified positions
      playersList = playersList.filter(p => {
        const playerPositions = p.position?.split(',').map(pos => pos.trim()) || [];
        return playerPositions.includes(position as string);
      });
    }
    if (level) {
      playersList = playersList.filter(p => p.level === level);
    }
    
    const leaderboard = await Promise.all(playersList.map(async (p) => {
      const fullPlayer = await storage.getPlayer(p.id);
      const playerGames = fullPlayer?.games || [];
      
      // Filter games by sport if specified
      const sportGames = sport ? playerGames.filter(g => g.sport === sport) : playerGames;
      
      // Calculate avg grade score for sorting
      const gradeScores: Record<string, number> = {
        'A+': 97, 'A': 94, 'A-': 90,
        'B+': 87, 'B': 84, 'B-': 80,
        'C+': 77, 'C': 74, 'C-': 70,
        'D': 65, 'F': 55
      };
      
      const avgGradeScore = sportGames.length > 0
        ? sportGames.reduce((acc, g) => acc + (gradeScores[g.grade || 'C'] || 70), 0) / sportGames.length
        : 0;

      // Inverse map back to a grade label for the leaderboard
      let avgGrade = 'C';
      if (avgGradeScore >= 90) avgGrade = 'A';
      else if (avgGradeScore >= 80) avgGrade = 'B';
      else if (avgGradeScore >= 70) avgGrade = 'C';
      else if (avgGradeScore >= 60) avgGrade = 'D';
      else avgGrade = 'F';

      // Calculate sport-specific stats
      const playerSport = p.sport || 'basketball';
      
      if (playerSport === 'football') {
        // Football stats based on position
        const position = p.position || '';
        // Support multi-position players by checking if any of their positions match
        const playerPositions = position.split(',').map(pos => pos.trim());
        const isQB = playerPositions.includes('QB');
        const isRB = playerPositions.includes('RB');
        const isWR = playerPositions.some(pos => ['WR', 'TE'].includes(pos));
        const isDefense = playerPositions.some(pos => ['DL', 'LB', 'DB', 'CB', 'S', 'DE', 'DT'].includes(pos));
        
        const avgPassYds = sportGames.length > 0 ? sportGames.reduce((acc, g) => acc + (g.passingYards || 0), 0) / sportGames.length : 0;
        const avgRushYds = sportGames.length > 0 ? sportGames.reduce((acc, g) => acc + (g.rushingYards || 0), 0) / sportGames.length : 0;
        const avgRecYds = sportGames.length > 0 ? sportGames.reduce((acc, g) => acc + (g.receivingYards || 0), 0) / sportGames.length : 0;
        const avgTackles = sportGames.length > 0 ? sportGames.reduce((acc, g) => acc + (g.tackles || 0), 0) / sportGames.length : 0;
        const totalTDs = sportGames.reduce((acc, g) => acc + (g.passingTouchdowns || 0) + (g.rushingTouchdowns || 0) + (g.receivingTouchdowns || 0), 0);
        
        return {
          playerId: p.id,
          name: p.name,
          team: p.team,
          jerseyNumber: p.jerseyNumber,
          position: p.position,
          sport: playerSport,
          state: p.state,
          city: p.city,
          level: p.level,
          photoUrl: p.photoUrl,
          avgGrade,
          avgGradeScore,
          gamesPlayed: sportGames.length,
          avgPassYds: Number(avgPassYds.toFixed(1)),
          avgRushYds: Number(avgRushYds.toFixed(1)),
          avgRecYds: Number(avgRecYds.toFixed(1)),
          avgTackles: Number(avgTackles.toFixed(1)),
          totalTDs,
        };
      } else {
        // Basketball stats
        const avgPoints = sportGames.length > 0 ? sportGames.reduce((acc, g) => acc + g.points, 0) / sportGames.length : 0;
        const avgRebounds = sportGames.length > 0 ? sportGames.reduce((acc, g) => acc + g.rebounds, 0) / sportGames.length : 0;
        const avgAssists = sportGames.length > 0 ? sportGames.reduce((acc, g) => acc + g.assists, 0) / sportGames.length : 0;
        const totalFgMade = sportGames.reduce((acc, g) => acc + g.fgMade, 0);
        const totalFgAtt = sportGames.reduce((acc, g) => acc + g.fgAttempted, 0);
        const total3Made = sportGames.reduce((acc, g) => acc + g.threeMade, 0);
        const total3Att = sportGames.reduce((acc, g) => acc + g.threeAttempted, 0);
        const fgPct = totalFgAtt > 0 ? (totalFgMade / totalFgAtt) * 100 : 0;
        const threePct = total3Att > 0 ? (total3Made / total3Att) * 100 : 0;
        
        return {
          playerId: p.id,
          name: p.name,
          team: p.team,
          jerseyNumber: p.jerseyNumber,
          position: p.position,
          sport: playerSport,
          state: p.state,
          city: p.city,
          level: p.level,
          photoUrl: p.photoUrl,
          avgGrade,
          avgGradeScore,
          gamesPlayed: sportGames.length,
          avgPoints: Number(avgPoints.toFixed(1)),
          avgRebounds: Number(avgRebounds.toFixed(1)),
          avgAssists: Number(avgAssists.toFixed(1)),
          fgPct: Number(fgPct.toFixed(1)),
          threePct: Number(threePct.toFixed(1)),
        };
      }
    }));

    // Sort by avg grade score descending
    leaderboard.sort((a, b) => b.avgGradeScore - a.avgGradeScore);

    res.json(leaderboard.map(({ avgGradeScore, ...rest }) => rest));
  });

  // Get player's state ranking
  // Requirements to qualify:
  // - Minimum 5 games played
  // - Minimum C average (65+ grade score)
  // - Must have state set
  app.get('/api/players/:id/state-ranking', async (req, res) => {
    try {
      const playerId = Number(req.params.id);
      const player = await storage.getPlayer(playerId);
      
      const MIN_GAMES_REQUIRED = 5;
      const MIN_GRADE_SCORE = 65; // C average
      
      if (!player) {
        return res.status(404).json({ message: 'Player not found' });
      }
      
      if (!player.state) {
        return res.json({ rank: null, totalInState: 0, state: null, qualified: false, reason: 'no_state' });
      }
      
      const gradeScores: Record<string, number> = {
        'A+': 100, 'A': 95, 'A-': 90,
        'B+': 85, 'B': 80, 'B-': 75,
        'C+': 70, 'C': 65, 'C-': 60,
        'D+': 55, 'D': 50, 'D-': 45,
        'F': 30
      };
      
      // Get all players in the same state who meet the minimum requirements
      const allPlayers = await storage.getPlayers();
      const statePlayersWithGames = await Promise.all(
        allPlayers
          .filter(p => p.state === player.state)
          .map(async (p) => {
            const games = await storage.getGamesByPlayerId(p.id);
            
            // Must have minimum games
            if (games.length < MIN_GAMES_REQUIRED) return null;
            
            const avgGradeScore = games.reduce((acc, g) => acc + (gradeScores[g.grade || 'C'] || 65), 0) / games.length;
            
            // Must have minimum grade average
            if (avgGradeScore < MIN_GRADE_SCORE) return null;
            
            const avgPoints = games.reduce((acc, g) => acc + g.points, 0) / games.length;
            
            return {
              playerId: p.id,
              avgGradeScore,
              avgPoints,
              gamesPlayed: games.length
            };
          })
      );
      
      // Filter out players who don't qualify and sort by grade score
      const rankedPlayers = statePlayersWithGames
        .filter(Boolean)
        .sort((a, b) => {
          if (b!.avgGradeScore !== a!.avgGradeScore) {
            return b!.avgGradeScore - a!.avgGradeScore;
          }
          return b!.avgPoints - a!.avgPoints;
        });
      
      // Check if this player qualifies
      const playerGames = await storage.getGamesByPlayerId(playerId);
      const playerAvgGrade = playerGames.length > 0 
        ? playerGames.reduce((acc, g) => acc + (gradeScores[g.grade || 'C'] || 65), 0) / playerGames.length
        : 0;
      
      const playerQualifies = playerGames.length >= MIN_GAMES_REQUIRED && playerAvgGrade >= MIN_GRADE_SCORE;
      
      if (!playerQualifies) {
        const reason = playerGames.length < MIN_GAMES_REQUIRED 
          ? `Need ${MIN_GAMES_REQUIRED - playerGames.length} more games`
          : 'Need C average or higher';
        return res.json({ 
          rank: null, 
          totalInState: rankedPlayers.length, 
          state: player.state, 
          qualified: false,
          reason,
          gamesPlayed: playerGames.length,
          gamesRequired: MIN_GAMES_REQUIRED,
          avgGrade: playerAvgGrade
        });
      }
      
      const rank = rankedPlayers.findIndex(p => p!.playerId === playerId) + 1;
      
      res.json({
        rank: rank > 0 ? rank : null,
        totalInState: rankedPlayers.length,
        state: player.state,
        isTop100: rank > 0 && rank <= 100,
        qualified: true,
        gamesPlayed: playerGames.length,
        gamesRequired: MIN_GAMES_REQUIRED
      });
    } catch (err) {
      console.error('Get state ranking error:', err);
      res.status(500).json({ message: 'Error fetching state ranking' });
    }
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

  // GET scouting report (public)
  app.get('/api/players/:id/scouting-report', async (req: any, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const player = await storage.getPlayer(playerId);
      if (!player) return res.status(404).json({ message: "Player not found" });
      res.json({
        report: (player as any).scoutingReport || null,
        generatedAt: (player as any).scoutingReportGeneratedAt?.toISOString() || null,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scouting report" });
    }
  });

  // POST generate scouting report (authenticated, owner-only)
  app.post('/api/players/:id/scouting-report', isAuthenticated, async (req: any, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const player = await storage.getPlayer(playerId);
      if (!player) return res.status(404).json({ message: "Player not found" });
      
      const authorized = await canModifyPlayer(req, playerId);
      if (!authorized) return res.status(403).json({ message: "Not authorized" });

      const playerGames = await storage.getGamesByPlayerId(playerId);
      const playerBadges = await storage.getPlayerBadges(playerId);

      if (playerGames.length < 3) {
        return res.status(400).json({ message: "Need at least 3 games logged to generate a scouting report" });
      }

      const gamesPlayed = playerGames.length;
      const ppg = (playerGames.reduce((a, g) => a + g.points, 0) / gamesPlayed).toFixed(1);
      const rpg = (playerGames.reduce((a, g) => a + g.rebounds, 0) / gamesPlayed).toFixed(1);
      const apg = (playerGames.reduce((a, g) => a + g.assists, 0) / gamesPlayed).toFixed(1);
      const spg = (playerGames.reduce((a, g) => a + (g.steals || 0), 0) / gamesPlayed).toFixed(1);
      const bpg = (playerGames.reduce((a, g) => a + (g.blocks || 0), 0) / gamesPlayed).toFixed(1);

      const GRADE_VALUES: Record<string, number> = {
        'A+': 100, 'A': 95, 'A-': 90, 'B+': 88, 'B': 85, 'B-': 80,
        'C+': 78, 'C': 75, 'C-': 70, 'D+': 68, 'D': 65, 'D-': 60, 'F': 50,
      };
      const totalGradeValue = playerGames.reduce((acc, g) => acc + (GRADE_VALUES[g.grade?.trim().toUpperCase() || ''] || 0), 0);
      const avgGradeValue = totalGradeValue / gamesPlayed;
      let averageGrade = 'N/A';
      if (avgGradeValue >= 97) averageGrade = 'A+';
      else if (avgGradeValue >= 92) averageGrade = 'A';
      else if (avgGradeValue >= 87) averageGrade = 'A-';
      else if (avgGradeValue >= 84) averageGrade = 'B+';
      else if (avgGradeValue >= 81) averageGrade = 'B';
      else if (avgGradeValue >= 77) averageGrade = 'B-';
      else if (avgGradeValue >= 74) averageGrade = 'C+';
      else if (avgGradeValue >= 71) averageGrade = 'C';
      else if (avgGradeValue >= 67) averageGrade = 'C-';
      else if (avgGradeValue >= 64) averageGrade = 'D+';
      else if (avgGradeValue >= 61) averageGrade = 'D';
      else if (avgGradeValue >= 55) averageGrade = 'D-';
      else averageGrade = 'F';

      const sortedGames = [...playerGames].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      let trend = 'stable';
      if (sortedGames.length >= 6) {
        const recentAvg = sortedGames.slice(0, 3).reduce((acc, g) => acc + (GRADE_VALUES[g.grade?.trim().toUpperCase() || ''] || 0), 0) / 3;
        const previousAvg = sortedGames.slice(3, 6).reduce((acc, g) => acc + (GRADE_VALUES[g.grade?.trim().toUpperCase() || ''] || 0), 0) / 3;
        if (recentAvg > previousAvg + 3) trend = 'improving';
        else if (recentAvg < previousAvg - 3) trend = 'declining';
      }

      const badgeNames = playerBadges.map(b => {
        const def = (BADGE_DEFINITIONS as any)[b.badgeType];
        return def ? def.name : b.badgeType;
      });

      const { name, position, height, school, graduationYear, city, state, currentTier } = player;

      const totalFGA = playerGames.reduce((a, g) => a + (g.fgAttempted || 0), 0);
      const totalFGM = playerGames.reduce((a, g) => a + (g.fgMade || 0), 0);
      const totalFTA = playerGames.reduce((a, g) => a + (g.ftAttempted || 0), 0);
      const totalFTM = playerGames.reduce((a, g) => a + (g.ftMade || 0), 0);
      const total3M = playerGames.reduce((a, g) => a + (g.threeMade || 0), 0);
      const total3A = playerGames.reduce((a, g) => a + (g.threeAttempted || 0), 0);
      const totalPts = playerGames.reduce((a, g) => a + g.points, 0);
      const totalTO = playerGames.reduce((a, g) => a + g.turnovers, 0);
      const totalAst = playerGames.reduce((a, g) => a + g.assists, 0);
      const tsaDenom = 2 * (totalFGA + 0.44 * totalFTA);
      const tsPct = tsaDenom > 0 ? ((totalPts / tsaDenom) * 100).toFixed(1) : 'N/A';
      const fgPct = totalFGA > 0 ? ((totalFGM / totalFGA) * 100).toFixed(1) : 'N/A';
      const ftPct = totalFTA > 0 ? ((totalFTM / totalFTA) * 100).toFixed(1) : 'N/A';
      const threePct = total3A > 0 ? ((total3M / total3A) * 100).toFixed(1) : 'N/A';
      const astToRatio = totalTO > 0 ? (totalAst / totalTO).toFixed(1) : (totalAst > 0 ? '99+' : 'N/A');
      const toPct = (totalFGA + 0.44 * totalFTA + totalTO) > 0
        ? ((totalTO / (totalFGA + 0.44 * totalFTA + totalTO)) * 100).toFixed(1)
        : 'N/A';
      const ptsArr = playerGames.map(g => g.points);
      const avgPtsVal = ptsArr.reduce((a, b) => a + b, 0) / ptsArr.length;
      const stdDev = Math.sqrt(ptsArr.reduce((acc, p) => acc + Math.pow(p - avgPtsVal, 2), 0) / ptsArr.length);
      const cvScore = avgPtsVal > 0 ? Math.round(Math.max(0, Math.min(100, 100 - (stdDev / avgPtsVal) * 100))) : 0;
      const bigGameCount = playerGames.filter(g => g.points > avgPtsVal * 1.5).length;

      const prompt = `You are an elite basketball scout writing a professional scouting report for a college recruiting evaluation. Write a detailed, professional 4-5 paragraph scouting report. Use precise basketball terminology that college coaches expect. Be honest and direct - highlight strengths prominently and frame weaknesses as specific areas for development with actionable suggestions. Write in third person.

Player: ${name}
Position: ${position}
Height: ${height || 'Not listed'}
School: ${school || 'Not listed'}
Class: ${graduationYear ? `Class of ${graduationYear}` : 'Not listed'}
Location: ${[city, state].filter(Boolean).join(', ') || 'Not listed'}
Games Played: ${gamesPlayed}
Overall Grade: ${averageGrade}
Performance Trend: ${trend}

Season Averages:
- Points: ${ppg} PPG
- Rebounds: ${rpg} RPG
- Assists: ${apg} APG
- Steals: ${spg} SPG
- Blocks: ${bpg} BPG

Efficiency Metrics:
- True Shooting %: ${tsPct} (D1 avg ~54%, D2 avg ~50%, D3 avg ~48%)
- Field Goal %: ${fgPct}
- 3-Point %: ${threePct}
- Free Throw %: ${ftPct}
- Assist-to-Turnover Ratio: ${astToRatio} (elite >2.5, good >1.5)
- Turnover Rate: ${toPct}%
- Consistency Score: ${cvScore}/100 (measures scoring variance game-to-game)
- Big Games (>1.5x avg scoring): ${bigGameCount} out of ${gamesPlayed}

Badges Earned: ${badgeNames.join(', ') || 'None yet'}
Tier: ${currentTier}

Write a scouting report that a college coach would find genuinely useful for evaluation. Include:
1. Player overview: playing style, motor, basketball IQ indicators from the data
2. Offensive evaluation: scoring efficiency (reference TS% vs division benchmarks), shot selection, playmaking ability (AST/TO ratio)
3. Defensive & intangibles: rebounding, steals, blocks, consistency score interpretation
4. Next-level projection: Based on the data, which college division level (D1, D2, D3, NAIA, JUCO) would this player likely contribute at immediately? What specific skills need development for the next level?
5. Brief summary with a realistic college-level comparison or archetype

Keep it to 4-5 paragraphs of flowing prose. No headers, bullet points, or markdown formatting. Do not use the word "prospect" more than once. Reference specific efficiency numbers when making evaluations - college coaches want data-backed analysis, not generic praise.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const reportText = response.text?.trim() || '';
      if (!reportText) {
        return res.status(500).json({ message: "AI failed to generate report" });
      }

      await db.update(players).set({
        scoutingReport: reportText,
        scoutingReportGeneratedAt: new Date(),
      }).where(eq(players.id, playerId));

      res.json({ report: reportText, generatedAt: new Date().toISOString() });
    } catch (error) {
      console.error('Error generating scouting report:', error);
      res.status(500).json({ message: "Failed to generate scouting report" });
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

  // --- Skill Challenges (must be defined before generic :id route) ---

  // GET /api/challenges/skills - Get all skill challenges (optional sport filter)
  app.get('/api/challenges/skills', async (req, res) => {
    try {
      const sport = req.query.sport as string | undefined;
      const challenges = await storage.getSkillChallenges(sport);
      res.json(challenges);
    } catch (error) {
      console.error('Error fetching skill challenges:', error);
      res.status(500).json({ message: "Failed to fetch skill challenges" });
    }
  });

  // GET /api/challenges/skills/:id - Get a specific skill challenge
  app.get('/api/challenges/skills/:id', async (req, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      if (isNaN(challengeId)) {
        return res.status(400).json({ message: "Invalid challenge ID" });
      }
      const challenge = await storage.getSkillChallenge(challengeId);
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      res.json(challenge);
    } catch (error) {
      console.error('Error fetching skill challenge:', error);
      res.status(500).json({ message: "Failed to fetch skill challenge" });
    }
  });

  // POST /api/challenges/skills/:id/submit - Submit a challenge result
  app.post('/api/challenges/skills/:id/submit', isAuthenticated, async (req: any, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      if (isNaN(challengeId)) {
        return res.status(400).json({ message: "Invalid challenge ID" });
      }

      const challenge = await storage.getSkillChallenge(challengeId);
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }

      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Get player ID from user
      const player = user.playerId ? await storage.getPlayer(user.playerId) : null;
      if (!player) {
        return res.status(400).json({ message: "No player profile linked to this account" });
      }

      const validatedData = insertChallengeResultSchema.parse({
        challengeId,
        playerId: player.id,
        score: req.body.score,
        timeElapsed: req.body.timeElapsed,
        attemptNumber: req.body.attemptNumber || 1,
        videoProofUrl: req.body.videoProofUrl,
        isVerified: false,
      });

      const result = await storage.createChallengeResult(validatedData);
      res.status(201).json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid result data", errors: error.errors });
      }
      console.error('Error submitting challenge result:', error);
      res.status(500).json({ message: "Failed to submit challenge result" });
    }
  });

  // GET /api/challenges/skills/:id/leaderboard - Get challenge leaderboard
  app.get('/api/challenges/skills/:id/leaderboard', async (req, res) => {
    try {
      const challengeId = parseInt(req.params.id);
      if (isNaN(challengeId)) {
        return res.status(400).json({ message: "Invalid challenge ID" });
      }
      const leaderboard = await storage.getChallengeLeaderboardNew(challengeId);
      res.json(leaderboard);
    } catch (error) {
      console.error('Error fetching challenge leaderboard:', error);
      res.status(500).json({ message: "Failed to fetch challenge leaderboard" });
    }
  });

  // GET /api/challenges/compare - Compare two players (must be before /:id)
  app.get('/api/challenges/compare', async (req, res) => {
    try {
      const { player1, player2 } = req.query as { player1?: string; player2?: string };
      
      if (!player1) return res.status(400).json({ message: "Player 1 ID required" });
      
      const p1Id = parseInt(player1);
      if (isNaN(p1Id)) return res.status(400).json({ message: "Invalid player 1 ID" });
      const p1 = await storage.getPlayer(p1Id);
      if (!p1) return res.status(404).json({ message: "Player 1 not found" });
      
      const sport = p1.sport || 'basketball';
      const p1Games = await storage.getGamesByPlayerId(p1Id);
      const p1Recent = p1Games.slice(0, 10);
      const p1Total = p1Recent.length || 1;
      
      let p1Stats: Record<string, number | string> = {};
      let p2Stats: Record<string, number | string> | null = null;
      
      if (sport === 'basketball') {
        p1Stats = {
          gamesPlayed: p1Recent.length,
          ppg: Math.round((p1Recent.reduce((s, g) => s + ((g.fgMade || 0) * 2 + (g.threeMade || 0) * 3 + (g.ftMade || 0)), 0) / p1Total) * 10) / 10,
          rpg: Math.round((p1Recent.reduce((s, g) => s + (g.rebounds || 0), 0) / p1Total) * 10) / 10,
          apg: Math.round((p1Recent.reduce((s, g) => s + (g.assists || 0), 0) / p1Total) * 10) / 10,
          spg: Math.round((p1Recent.reduce((s, g) => s + (g.steals || 0), 0) / p1Total) * 10) / 10,
          bpg: Math.round((p1Recent.reduce((s, g) => s + (g.blocks || 0), 0) / p1Total) * 10) / 10,
        };
      } else {
        p1Stats = {
          gamesPlayed: p1Recent.length,
          tdpg: Math.round((p1Recent.reduce((s, g) => s + (g.passingTouchdowns || 0) + (g.rushingTouchdowns || 0) + (g.receivingTouchdowns || 0), 0) / p1Total) * 10) / 10,
          ypg: Math.round((p1Recent.reduce((s, g) => s + (g.passingYards || 0) + (g.rushingYards || 0) + (g.receivingYards || 0), 0) / p1Total) * 10) / 10,
        };
      }
      
      if (player2) {
        const p2Id = parseInt(player2);
        if (!isNaN(p2Id)) {
          const p2 = await storage.getPlayer(p2Id);
          if (p2) {
            const p2Games = await storage.getGamesByPlayerId(p2Id);
            const p2Recent = p2Games.slice(0, 10);
            const p2Total = p2Recent.length || 1;
            
            if (sport === 'basketball') {
              p2Stats = {
                name: p2.name,
                photo: p2.photoUrl || '',
                position: p2.position,
                team: p2.team || '',
                gamesPlayed: p2Recent.length,
                ppg: Math.round((p2Recent.reduce((s, g) => s + ((g.fgMade || 0) * 2 + (g.threeMade || 0) * 3 + (g.ftMade || 0)), 0) / p2Total) * 10) / 10,
                rpg: Math.round((p2Recent.reduce((s, g) => s + (g.rebounds || 0), 0) / p2Total) * 10) / 10,
                apg: Math.round((p2Recent.reduce((s, g) => s + (g.assists || 0), 0) / p2Total) * 10) / 10,
                spg: Math.round((p2Recent.reduce((s, g) => s + (g.steals || 0), 0) / p2Total) * 10) / 10,
                bpg: Math.round((p2Recent.reduce((s, g) => s + (g.blocks || 0), 0) / p2Total) * 10) / 10,
              };
            } else {
              p2Stats = {
                name: p2.name,
                photo: p2.photoUrl || '',
                position: p2.position,
                team: p2.team || '',
                gamesPlayed: p2Recent.length,
                tdpg: Math.round((p2Recent.reduce((s, g) => s + (g.passingTouchdowns || 0) + (g.rushingTouchdowns || 0) + (g.receivingTouchdowns || 0), 0) / p2Total) * 10) / 10,
                ypg: Math.round((p2Recent.reduce((s, g) => s + (g.passingYards || 0) + (g.rushingYards || 0) + (g.receivingYards || 0), 0) / p2Total) * 10) / 10,
              };
            }
          }
        }
      }
      
      res.json({
        player1: {
          id: p1.id,
          name: p1.name,
          photo: p1.photoUrl,
          position: p1.position,
          team: p1.team,
          sport,
          stats: p1Stats,
        },
        player2: p2Stats ? { stats: p2Stats } : null,
      });
    } catch (error) {
      console.error('Error comparing players:', error);
      res.status(500).json({ message: "Failed to compare players" });
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

  app.post('/api/challenges/head-to-head', requiresSubscription, async (req: any, res) => {
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

  app.get('/api/challenges/head-to-head', requiresSubscription, async (req: any, res) => {
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

  app.get('/api/challenges/head-to-head/pending', requiresSubscription, async (req: any, res) => {
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

  app.post('/api/challenges/head-to-head/:id/accept', requiresSubscription, async (req: any, res) => {
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

  app.post('/api/challenges/head-to-head/:id/decline', requiresSubscription, async (req: any, res) => {
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

  app.post('/api/challenges/head-to-head/:id/submit', requiresSubscription, async (req: any, res) => {
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
        postType: z.enum(['announcement', 'practice', 'chat', 'general', 'workout']).optional().default('general'),
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

      // Only coaches or admins can pin posts or create announcements
      const isCoachOrAdmin = member.role === 'coach' || member.role === 'admin';
      if ((input.isPinned || input.postType === 'announcement') && !isCoachOrAdmin) {
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

      // If it's a practice or workout post with a time, also create a schedule event for team members
      if ((input.postType === 'practice' || input.postType === 'workout') && input.practiceTime) {
        try {
          const eventDate = new Date(input.practiceTime);
          const eventType = input.postType;
          const eventTitle = eventType === 'practice' 
            ? `Team Practice: ${team.name}` 
            : `Team Workout: ${team.name}`;
          const duration = eventType === 'practice' ? 90 : 60; // Practice 90 min, workout 60 min
          
          // Create schedule event for all team members
          const teamMembers = await storage.getTeamMembers(teamId);
          for (const teamMember of teamMembers) {
            if (teamMember.playerId) {
              await storage.createScheduleEvent({
                playerId: teamMember.playerId,
                title: eventTitle,
                description: input.content,
                startTime: eventDate,
                endTime: new Date(eventDate.getTime() + duration * 60 * 1000),
                eventType: eventType,
                location: input.practiceLocation || null,
              });
            }
          }
        } catch (scheduleErr) {
          console.error('Error creating schedule events:', scheduleErr);
          // Don't fail the post creation if schedule event fails
        }
      }

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
      const limit = Number(req.query.limit) || 20;
      const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;
      const typeParam = req.query.type as string | undefined;
      const typeFilter = (typeParam === 'social' || typeParam === 'alerts') ? typeParam : 'all' as const;
      const activities = await storage.getFeedActivities(limit + 1, cursor, typeFilter);
      
      const hasMore = activities.length > limit;
      const items = hasMore ? activities.slice(0, limit) : activities;
      const nextCursor = hasMore ? items[items.length - 1].id : undefined;
      
      res.json({
        items,
        nextCursor,
        hasMore,
      });
    } catch (err) {
      console.error('Get feed error:', err);
      res.status(500).json({ message: 'Error fetching feed' });
    }
  });

  app.get('/api/feed/new-count', async (req, res) => {
    try {
      const sinceId = Number(req.query.since);
      if (!sinceId) return res.json({ count: 0 });

      const socialTypes = ['game', 'workout', 'repost', 'poll', 'story', 'prediction'];
      const alertTypes = ['badge', 'streak', 'goal', 'challenge'];
      const typeParam = req.query.type as string | undefined;

      const countConditions = [sql`${feedActivities.id} > ${sinceId}`];
      if (typeParam === 'social') {
        countConditions.push(inArray(feedActivities.activityType, socialTypes));
      } else if (typeParam === 'alerts') {
        countConditions.push(inArray(feedActivities.activityType, alertTypes));
      }

      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(feedActivities)
        .where(and(...countConditions));
      
      res.json({ count: Number(result[0]?.count || 0) });
    } catch (err) {
      console.error('Get new feed count error:', err);
      res.status(500).json({ message: 'Error fetching new count' });
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
        return res.json({ items: [], hasMore: false });
      }
      
      const limit = Number(req.query.limit) || 20;
      const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;
      const activities = await storage.getFollowingFeedActivities(user.playerId, limit + 1, cursor);
      
      const hasMore = activities.length > limit;
      const items = hasMore ? activities.slice(0, limit) : activities;
      const nextCursor = hasMore ? items[items.length - 1].id : undefined;
      
      res.json({ items, nextCursor, hasMore });
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

  // === FEED REACTIONS ===
  app.post('/api/feed/:activityId/reactions', async (req, res) => {
    try {
      const activityId = Number(req.params.activityId);
      const { sessionId, reactionType, playerName } = req.body;
      
      if (!sessionId || !reactionType) {
        return res.status(400).json({ message: 'SessionId and reactionType are required' });
      }

      const validReactionTypes = ['fire', 'like', 'heart', 'clap'];
      if (!validReactionTypes.includes(reactionType)) {
        return res.status(400).json({ message: 'Invalid reaction type' });
      }

      const existingReaction = await storage.getUserReaction(activityId, sessionId, reactionType);
      
      if (existingReaction) {
        await storage.removeReaction(existingReaction.id);
        res.json({ action: 'removed', reactionType });
      } else {
        await storage.addReaction({ activityId, sessionId, reactionType, playerName });
        res.json({ action: 'added', reactionType });
      }
    } catch (err) {
      console.error('Toggle reaction error:', err);
      res.status(500).json({ message: 'Error toggling reaction' });
    }
  });

  app.get('/api/feed/:activityId/reactions', async (req, res) => {
    try {
      const activityId = Number(req.params.activityId);
      const reactions = await storage.getActivityReactions(activityId);
      
      const counts: Record<string, number> = {};
      const users: Record<string, string[]> = {};
      
      for (const reaction of reactions) {
        counts[reaction.reactionType] = (counts[reaction.reactionType] || 0) + 1;
        if (!users[reaction.reactionType]) {
          users[reaction.reactionType] = [];
        }
        if (reaction.playerName) {
          users[reaction.reactionType].push(reaction.playerName);
        }
      }
      
      res.json({ counts, users, reactions });
    } catch (err) {
      console.error('Get reactions error:', err);
      res.status(500).json({ message: 'Error fetching reactions' });
    }
  });

  app.get('/api/feed/:activityId/user-reactions', async (req, res) => {
    try {
      const activityId = Number(req.params.activityId);
      const sessionId = req.query.sessionId as string;
      
      if (!sessionId) {
        return res.json({ userReactions: [] });
      }
      
      const userReactions = await storage.getUserReactionsForActivity(activityId, sessionId);
      res.json({ userReactions: userReactions.map(r => r.reactionType) });
    } catch (err) {
      console.error('Get user reactions error:', err);
      res.status(500).json({ message: 'Error fetching user reactions' });
    }
  });

  // === FEED COMMENTS ===
  app.get('/api/feed/:activityId/comments', async (req, res) => {
    try {
      const activityId = Number(req.params.activityId);
      const comments = await storage.getFeedComments(activityId);
      res.json(comments);
    } catch (err) {
      console.error('Get feed comments error:', err);
      res.status(500).json({ message: 'Error fetching comments' });
    }
  });

  app.post('/api/feed/:activityId/comments', async (req, res) => {
    try {
      const activityId = Number(req.params.activityId);
      const { sessionId, authorName, content, parentId } = req.body;

      if (!sessionId || !authorName || !content) {
        return res.status(400).json({ message: 'sessionId, authorName, and content are required' });
      }

      const comment = await storage.createFeedComment({
        activityId,
        sessionId,
        authorName,
        content,
        parentId: parentId || null,
      });
      res.status(201).json(comment);
    } catch (err) {
      console.error('Create feed comment error:', err);
      res.status(500).json({ message: 'Error creating comment' });
    }
  });

  app.delete('/api/feed/comments/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const sessionId = req.query.sessionId as string;

      if (!sessionId) {
        return res.status(400).json({ message: 'sessionId is required' });
      }

      const comment = await storage.getFeedComment(id);
      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }

      if (comment.sessionId !== sessionId) {
        return res.status(403).json({ message: 'Not authorized to delete this comment' });
      }

      await storage.deleteFeedComment(id);
      res.json({ message: 'Comment deleted' });
    } catch (err) {
      console.error('Delete feed comment error:', err);
      res.status(500).json({ message: 'Error deleting comment' });
    }
  });

  app.get('/api/feed/:activityId/comments/count', async (req, res) => {
    try {
      const activityId = Number(req.params.activityId);
      const count = await storage.getFeedCommentCount(activityId);
      res.json({ count });
    } catch (err) {
      console.error('Get feed comment count error:', err);
      res.status(500).json({ message: 'Error fetching comment count' });
    }
  });

  app.post('/api/feed/comments/:id/like', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ message: 'sessionId is required' });
      }

      const result = await storage.toggleFeedCommentLike(id, sessionId);
      res.json(result);
    } catch (err) {
      console.error('Toggle feed comment like error:', err);
      res.status(500).json({ message: 'Error toggling comment like' });
    }
  });

  app.get('/api/feed/comments/:id/liked', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const sessionId = req.query.sessionId as string;

      if (!sessionId) {
        return res.json({ liked: false });
      }

      const liked = await storage.hasLikedFeedComment(id, sessionId);
      res.json({ liked });
    } catch (err) {
      console.error('Check feed comment liked error:', err);
      res.status(500).json({ message: 'Error checking comment like status' });
    }
  });

  // === FEED ACTIVITY REPOST ===
  app.post('/api/feed/:activityId/repost', async (req, res) => {
    try {
      const activityId = Number(req.params.activityId);
      const { sessionId, playerName, caption } = req.body;

      if (!sessionId || !playerName) {
        return res.status(400).json({ message: 'sessionId and playerName are required' });
      }

      const originalActivity = await storage.getFeedActivities(1, undefined);
      const activity = originalActivity.find(a => a.id === activityId);

      const repost = await storage.createRepost({
        sessionId,
        originalActivityId: activityId,
        gameId: activity?.gameId || null,
        comment: caption || null,
      });

      const newActivity = await storage.createFeedActivity({
        activityType: 'repost',
        playerId: activity?.playerId || null,
        gameId: activity?.gameId || null,
        headline: `${playerName} shared a post`,
        subtext: caption || activity?.headline || '',
        sessionId,
      });

      res.status(201).json(newActivity);
    } catch (err) {
      console.error('Feed repost error:', err);
      res.status(500).json({ message: 'Error creating repost' });
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

  // === DIRECT MESSAGES ===
  
  // Get all DM threads for the current player
  app.get('/api/dm/threads', async (req, res) => {
    try {
      const sessionId = req.query.sessionId as string;
      const playerId = Number(req.query.playerId);
      if (!playerId) {
        return res.status(400).json({ message: 'playerId required' });
      }
      const threads = await storage.getPlayerDmThreads(playerId);
      res.json(threads);
    } catch (err) {
      console.error('Get DM threads error:', err);
      res.status(500).json({ message: 'Error fetching threads' });
    }
  });

  // Get unread DM count for a player
  app.get('/api/dm/unread-count', async (req, res) => {
    try {
      const playerId = Number(req.query.playerId);
      if (!playerId) {
        return res.status(400).json({ message: 'playerId required' });
      }
      const count = await storage.getUnreadDmCount(playerId);
      res.json({ count });
    } catch (err) {
      console.error('Get unread DM count error:', err);
      res.status(500).json({ message: 'Error fetching unread count' });
    }
  });

  // Start or find a DM thread with another player
  app.post('/api/dm/threads', async (req, res) => {
    try {
      const { participantIds } = req.body; // array of player IDs
      if (!participantIds || !Array.isArray(participantIds) || participantIds.length < 2) {
        return res.status(400).json({ message: 'At least 2 participantIds required' });
      }
      
      // Check if thread already exists between these players
      const existingThread = await storage.findExistingDmThread(participantIds);
      if (existingThread) {
        const participants = await storage.getDmParticipants(existingThread.id);
        return res.json({ thread: existingThread, participants, isExisting: true });
      }
      
      // Create new thread
      const thread = await storage.createDmThread();
      
      // Add all participants
      for (const pid of participantIds) {
        await storage.addDmParticipant({ threadId: thread.id, playerId: pid });
      }
      
      const participants = await storage.getDmParticipants(thread.id);
      res.status(201).json({ thread, participants, isExisting: false });
    } catch (err) {
      console.error('Create DM thread error:', err);
      res.status(500).json({ message: 'Error creating thread' });
    }
  });

  // Get messages in a thread
  app.get('/api/dm/threads/:threadId/messages', async (req, res) => {
    try {
      const threadId = Number(req.params.threadId);
      const limit = Number(req.query.limit) || 50;
      const before = req.query.before ? Number(req.query.before) : undefined;
      const messages = await storage.getDmMessages(threadId, limit, before);
      res.json(messages);
    } catch (err) {
      console.error('Get DM messages error:', err);
      res.status(500).json({ message: 'Error fetching messages' });
    }
  });

  // Send a message in a thread
  app.post('/api/dm/threads/:threadId/messages', async (req, res) => {
    try {
      const threadId = Number(req.params.threadId);
      const { senderPlayerId, content } = req.body;
      if (!content || !senderPlayerId) {
        return res.status(400).json({ message: 'content and senderPlayerId required' });
      }
      const message = await storage.sendDmMessage({
        threadId,
        senderPlayerId,
        content,
      });
      res.status(201).json(message);
    } catch (err) {
      console.error('Send DM message error:', err);
      res.status(500).json({ message: 'Error sending message' });
    }
  });

  // Mark thread as read
  app.post('/api/dm/threads/:threadId/read', async (req, res) => {
    try {
      const threadId = Number(req.params.threadId);
      const { playerId } = req.body;
      if (!playerId) {
        return res.status(400).json({ message: 'playerId required' });
      }
      await storage.markDmThreadRead(threadId, playerId);
      res.json({ success: true });
    } catch (err) {
      console.error('Mark thread read error:', err);
      res.status(500).json({ message: 'Error marking thread read' });
    }
  });

  // === SAVED POSTS ===
  
  // Get saved posts for a player
  app.get('/api/saved-posts', async (req, res) => {
    try {
      const playerId = Number(req.query.playerId);
      if (!playerId) {
        return res.status(400).json({ message: 'playerId required' });
      }
      const savedPosts = await storage.getSavedPosts(playerId);
      res.json(savedPosts);
    } catch (err) {
      console.error('Get saved posts error:', err);
      res.status(500).json({ message: 'Error fetching saved posts' });
    }
  });

  // Save/bookmark a post
  app.post('/api/saved-posts', async (req, res) => {
    try {
      const { activityId, playerId, sessionId } = req.body;
      if (!activityId || !playerId) {
        return res.status(400).json({ message: 'activityId and playerId required' });
      }
      const saved = await storage.savePost(activityId, playerId, sessionId);
      res.status(201).json(saved);
    } catch (err: any) {
      if (err.message?.includes('duplicate') || err.code === '23505') {
        return res.status(409).json({ message: 'Post already saved' });
      }
      console.error('Save post error:', err);
      res.status(500).json({ message: 'Error saving post' });
    }
  });

  // Unsave/unbookmark a post
  app.delete('/api/saved-posts', async (req, res) => {
    try {
      const activityId = Number(req.query.activityId);
      const playerId = Number(req.query.playerId);
      if (!activityId || !playerId) {
        return res.status(400).json({ message: 'activityId and playerId required' });
      }
      await storage.unsavePost(activityId, playerId);
      res.json({ success: true });
    } catch (err) {
      console.error('Unsave post error:', err);
      res.status(500).json({ message: 'Error unsaving post' });
    }
  });

  // Check if a post is saved
  app.get('/api/saved-posts/check', async (req, res) => {
    try {
      const activityId = Number(req.query.activityId);
      const playerId = Number(req.query.playerId);
      if (!activityId || !playerId) {
        return res.json({ saved: false });
      }
      const saved = await storage.hasPlayerSavedPost(activityId, playerId);
      res.json({ saved });
    } catch (err) {
      console.error('Check saved post error:', err);
      res.status(500).json({ message: 'Error checking saved post' });
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
  
  app.post('/api/stories', isAuthenticated, async (req: any, res) => {
    try {
      const { playerId, templateId, headline, stats, sessionId, isPublic, imageUrl, videoUrl, mediaType, caption, expiresIn24h } = req.body;

      if (!playerId || !headline) {
        return res.status(400).json({ message: 'PlayerId and headline are required' });
      }

      if (!await canModifyPlayer(req, playerId)) {
        return res.status(403).json({ message: 'You can only post stories for yourself' });
      }

      const validatedMediaType = mediaType && VALID_MEDIA_TYPES.includes(mediaType) ? mediaType : 'text';

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
  // Notes are only visible to the player and the coach who created them
  app.post('/api/games/:gameId/notes', isAuthenticated, async (req: any, res) => {
    try {
      const gameId = Number(req.params.gameId);
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }
      // Include the createdBy field with the current user's ID
      const input = insertGameNoteSchema.parse({ 
        ...req.body, 
        gameId, 
        playerId: game.playerId,
        createdBy: req.user.claims.sub 
      });
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

  app.get('/api/games/:gameId/notes', isAuthenticated, async (req: any, res) => {
    try {
      const gameId = Number(req.params.gameId);
      const userId = req.user.claims.sub;
      const notes = await storage.getGameNotes(gameId);
      
      // Get the game to find the player
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }
      
      // Get the player to check ownership
      const player = await storage.getPlayer(game.playerId);
      const isPlayerOwner = player?.userId === userId;
      
      // Filter notes: show only notes created by the current user OR if they own the player
      const filteredNotes = notes.filter(note => 
        note.createdBy === userId || isPlayerOwner
      );
      
      res.json(filteredNotes);
    } catch (err) {
      console.error('Get game notes error:', err);
      res.status(500).json({ error: 'Error fetching notes' });
    }
  });

  app.get('/api/players/:playerId/notes', isAuthenticated, async (req: any, res) => {
    try {
      const playerId = Number(req.params.playerId);
      const userId = req.user.claims.sub;
      const notes = await storage.getPlayerGameNotes(playerId);
      
      // Get the player to check ownership
      const player = await storage.getPlayer(playerId);
      const isPlayerOwner = player?.userId === userId;
      
      // Filter notes: show only notes created by the current user OR if they own the player
      const filteredNotes = notes.filter(note => 
        note.createdBy === userId || isPlayerOwner
      );
      
      res.json(filteredNotes);
    } catch (err) {
      console.error('Get player notes error:', err);
      res.status(500).json({ error: 'Error fetching notes' });
    }
  });

  app.patch('/api/notes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const noteId = Number(req.params.id);
      const userId = req.user.claims.sub;
      
      // Get existing note to check ownership
      const existingNote = await storage.getGameNote(noteId);
      if (!existingNote) {
        return res.status(404).json({ error: 'Note not found' });
      }
      
      // Only the note creator can edit
      if (existingNote.createdBy !== userId) {
        return res.status(403).json({ error: 'You can only edit your own notes' });
      }
      
      const updateSchema = insertGameNoteSchema.partial();
      const input = updateSchema.parse(req.body);
      const note = await storage.updateGameNote(noteId, input);
      res.json(note);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors[0].message });
      }
      console.error('Update note error:', err);
      res.status(500).json({ error: 'Error updating note' });
    }
  });

  app.delete('/api/notes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const noteId = Number(req.params.id);
      const userId = req.user.claims.sub;
      
      // Get existing note to check ownership
      const existingNote = await storage.getGameNote(noteId);
      if (!existingNote) {
        return res.status(404).json({ error: 'Note not found' });
      }
      
      // Only the note creator can delete
      if (existingNote.createdBy !== userId) {
        return res.status(403).json({ error: 'You can only delete your own notes' });
      }
      
      await storage.deleteGameNote(noteId);
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

  // --- Active Practice (Live Mode) ---
  
  // Start a new active practice session
  app.post('/api/practices/start', requiresCoachPro, async (req, res) => {
    try {
      const startPracticeSchema = z.object({
        teamId: z.number().optional(),
        title: z.string().min(1),
        duration: z.number().min(1).default(60),
        notes: z.string().optional(),
      });
      const input = startPracticeSchema.parse(req.body);
      
      const now = new Date();
      const practice = await storage.createPractice({
        teamId: input.teamId || null,
        date: now.toISOString().split('T')[0],
        title: input.title,
        duration: input.duration,
        status: 'active',
        startedAt: now,
        notes: input.notes || null,
      });
      
      res.status(201).json(practice);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors[0].message });
      }
      console.error('Start practice error:', err);
      res.status(500).json({ error: 'Error starting practice' });
    }
  });

  // Get active practices
  app.get('/api/practices/active', requiresCoachPro, async (req, res) => {
    try {
      const allPractices = await storage.getPractices();
      const activePractices = allPractices.filter(p => p.status === 'active');
      res.json(activePractices);
    } catch (err) {
      console.error('Get active practices error:', err);
      res.status(500).json({ error: 'Error fetching active practices' });
    }
  });

  // Check in a player to active practice
  app.post('/api/practices/:practiceId/checkin', requiresCoachPro, async (req, res) => {
    try {
      const practiceId = Number(req.params.practiceId);
      const practice = await storage.getPractice(practiceId);
      if (!practice) {
        return res.status(404).json({ error: 'Practice not found' });
      }
      if (practice.status !== 'active') {
        return res.status(400).json({ error: 'Practice is not active' });
      }
      
      const checkinSchema = z.object({
        playerId: z.number(),
        attended: z.boolean().default(true),
      });
      const input = checkinSchema.parse(req.body);
      
      // Check if attendance record exists
      const existingAttendance = await storage.getPracticeAttendance(practiceId);
      const existing = existingAttendance.find(a => a.playerId === input.playerId);
      
      if (existing) {
        const updated = await storage.updatePracticeAttendance(existing.id, {
          attended: input.attended,
          checkedInAt: input.attended ? new Date() : null,
        });
        return res.json(updated);
      }
      
      const attendance = await storage.createPracticeAttendance({
        practiceId,
        playerId: input.playerId,
        attended: input.attended,
        checkedInAt: input.attended ? new Date() : null,
      });
      res.status(201).json(attendance);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors[0].message });
      }
      console.error('Check-in error:', err);
      res.status(500).json({ error: 'Error checking in player' });
    }
  });

  // Set current drill for active practice
  app.patch('/api/practices/:practiceId/current-drill', requiresCoachPro, async (req, res) => {
    try {
      const practiceId = Number(req.params.practiceId);
      const practice = await storage.getPractice(practiceId);
      if (!practice) {
        return res.status(404).json({ error: 'Practice not found' });
      }
      if (practice.status !== 'active') {
        return res.status(400).json({ error: 'Practice is not active' });
      }
      
      const drillSchema = z.object({
        drillId: z.number().nullable(),
      });
      const input = drillSchema.parse(req.body);
      
      const updated = await storage.updatePractice(practiceId, {
        currentDrillId: input.drillId,
      });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors[0].message });
      }
      console.error('Set current drill error:', err);
      res.status(500).json({ error: 'Error setting current drill' });
    }
  });

  // End active practice
  app.post('/api/practices/:practiceId/end', requiresCoachPro, async (req, res) => {
    try {
      const practiceId = Number(req.params.practiceId);
      const practice = await storage.getPractice(practiceId);
      if (!practice) {
        return res.status(404).json({ error: 'Practice not found' });
      }
      if (practice.status !== 'active') {
        return res.status(400).json({ error: 'Practice is not active' });
      }
      
      const now = new Date();
      const startedAt = practice.startedAt ? new Date(practice.startedAt) : now;
      const actualDuration = Math.round((now.getTime() - startedAt.getTime()) / 60000); // minutes
      
      const endSchema = z.object({
        notes: z.string().optional(),
      });
      const input = endSchema.parse(req.body || {});
      
      const updated = await storage.updatePractice(practiceId, {
        status: 'completed',
        endedAt: now,
        actualDuration,
        currentDrillId: null,
        notes: input.notes || practice.notes,
      });
      
      // Get final attendance and drill scores for summary
      const attendance = await storage.getPracticeAttendance(practiceId);
      const drillScores = await storage.getDrillScoresByPractice(practiceId);
      
      res.json({ 
        ...updated, 
        attendance,
        drillScores,
        summary: {
          playersAttended: attendance.filter(a => a.attended).length,
          totalPlayers: attendance.length,
          drillsCompleted: new Set(drillScores.map(s => s.drillId)).size,
          actualDuration,
        }
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors[0].message });
      }
      console.error('End practice error:', err);
      res.status(500).json({ error: 'Error ending practice' });
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
      const sport = req.query.sport as string | undefined;
      const alerts = await storage.getAlerts(playerId, sport);
      res.json(alerts);
    } catch (err) {
      console.error('Get alerts error:', err);
      res.status(500).json({ error: 'Error fetching alerts' });
    }
  });

  app.get('/api/alerts/unread', requiresCoachPro, async (req, res) => {
    try {
      const sport = req.query.sport as string | undefined;
      const alerts = await storage.getUnreadAlerts(sport);
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
  app.post('/api/players/:playerId/drill-recommendations/generate', requiresSubscription, async (req, res) => {
    try {
      const playerId = Number(req.params.playerId);
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }

      const recentGames = player.games.slice(0, 10);

      if (recentGames.length === 0) {
        return res.json({ message: 'Log some games first to get personalized drill recommendations', recommendations: [] });
      }

      const avgPoints = recentGames.reduce((acc, g) => acc + g.points, 0) / recentGames.length;
      const avgRebounds = recentGames.reduce((acc, g) => acc + g.rebounds, 0) / recentGames.length;
      const avgAssists = recentGames.reduce((acc, g) => acc + g.assists, 0) / recentGames.length;
      const avgTurnovers = recentGames.reduce((acc, g) => acc + g.turnovers, 0) / recentGames.length;
      const avgSteals = recentGames.reduce((acc, g) => acc + g.steals, 0) / recentGames.length;
      const avgBlocks = recentGames.reduce((acc, g) => acc + g.blocks, 0) / recentGames.length;
      const avgFgPct = recentGames.reduce((acc, g) => {
        const fga = g.fgAttempted || 1;
        return acc + (g.fgMade / fga);
      }, 0) / recentGames.length;
      const avgThreePct = recentGames.reduce((acc, g) => {
        const attempts = g.threeAttempted || 1;
        return acc + (g.threeMade / attempts);
      }, 0) / recentGames.length;
      const avgFtPct = recentGames.reduce((acc, g) => {
        return acc + (g.ftMade / (g.ftAttempted || 1));
      }, 0) / recentGames.length;

      const weaknesses: { stat: string; priority: number; reason: string }[] = [];

      if (avgFgPct < 0.4) {
        weaknesses.push({ stat: 'shooting', priority: 5, reason: `Low FG% (${(avgFgPct * 100).toFixed(1)}%)` });
      }
      if (avgThreePct < 0.3) {
        weaknesses.push({ stat: 'shooting', priority: 4, reason: `Low 3PT% (${(avgThreePct * 100).toFixed(1)}%)` });
      }
      if (avgFtPct < 0.65) {
        weaknesses.push({ stat: 'shooting', priority: 4, reason: `Low FT% (${(avgFtPct * 100).toFixed(1)}%)` });
      }
      if (avgTurnovers > 3) {
        weaknesses.push({ stat: 'dribbling', priority: 5, reason: `High turnovers (${avgTurnovers.toFixed(1)} per game)` });
      }

      const positionsList = (player.position || '').split(',').map(p => p.trim());
      if (positionsList.includes('Guard') && avgAssists < 3) {
        weaknesses.push({ stat: 'passing', priority: 4, reason: `Low assists for Guard (${avgAssists.toFixed(1)} per game)` });
      }
      if (positionsList.includes('Big') && avgRebounds < 5) {
        weaknesses.push({ stat: 'rebounding', priority: 4, reason: `Low rebounds for Big (${avgRebounds.toFixed(1)} per game)` });
      }
      if (positionsList.includes('Guard') && avgSteals < 1) {
        weaknesses.push({ stat: 'defense', priority: 3, reason: `Low steals for Guard (${avgSteals.toFixed(1)} per game)` });
      }
      if (positionsList.includes('Big') && avgBlocks < 1) {
        weaknesses.push({ stat: 'defense', priority: 3, reason: `Low blocks for Big (${avgBlocks.toFixed(1)} per game)` });
      }
      if (avgTurnovers > 2 && (avgAssists / (avgTurnovers || 1)) < 1.5) {
        weaknesses.push({ stat: 'passing', priority: 4, reason: `Poor assist/TO ratio (${(avgAssists / (avgTurnovers || 1)).toFixed(1)}:1)` });
      }

      if (weaknesses.length === 0) {
        weaknesses.push({ stat: 'conditioning', priority: 2, reason: 'Well-rounded player - focus on conditioning and mental game' });
      }

      const weaknessDescriptions = weaknesses.map(w => `${w.stat}: ${w.reason}`).join('\n');
      const prompt = `You are a basketball training expert. Based on this player's weaknesses, generate exactly ${Math.min(weaknesses.length * 2, 8)} specific drill recommendations.

Player: ${player.name}, Position: ${player.position || 'Guard'}
Recent game averages: ${avgPoints.toFixed(1)} PPG, ${avgRebounds.toFixed(1)} RPG, ${avgAssists.toFixed(1)} APG, ${avgTurnovers.toFixed(1)} TOPG, ${(avgFgPct * 100).toFixed(1)}% FG, ${(avgThreePct * 100).toFixed(1)}% 3PT

Weaknesses identified:
${weaknessDescriptions}

For each drill, respond in this exact JSON format (array of objects):
[
  {
    "drillName": "Name of specific drill",
    "drillCategory": "one of: shooting, dribbling, passing, defense, conditioning, footwork, rebounding, finishing",
    "reason": "Why this drill helps this specific weakness",
    "weakStat": "the weakness category this addresses",
    "priority": number between 1-5
  }
]

Only respond with the JSON array, no other text.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      let aiDrills: any[] = [];
      try {
        const text = response.text || '';
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          aiDrills = JSON.parse(jsonMatch[0]);
        }
      } catch (parseErr) {
        console.error('Failed to parse AI drill response:', parseErr);
      }

      if (aiDrills.length === 0) {
        for (const weakness of weaknesses.slice(0, 4)) {
          aiDrills.push({
            drillName: `${weakness.stat.charAt(0).toUpperCase() + weakness.stat.slice(1)} Development Drill`,
            drillCategory: weakness.stat,
            reason: weakness.reason,
            weakStat: weakness.stat,
            priority: weakness.priority,
          });
        }
      }

      const recommendations: any[] = [];
      for (const drill of aiDrills.slice(0, 8)) {
        const recommendation = await storage.createDrillRecommendation({
          playerId,
          drillId: null,
          drillName: drill.drillName || 'Training Drill',
          drillCategory: drill.drillCategory || 'conditioning',
          reason: drill.reason || 'AI-recommended drill',
          priority: Math.min(5, Math.max(1, drill.priority || 3)),
          weakStat: drill.weakStat || drill.drillCategory || 'general',
          isActive: true,
        });
        recommendations.push({
          ...recommendation,
          drillName: recommendation.drillName || drill.drillName,
          drillCategory: recommendation.drillCategory || drill.drillCategory,
        });
      }

      res.status(201).json({ recommendations });
    } catch (err) {
      console.error('Generate recommendations error:', err);
      res.status(500).json({ error: 'Error generating recommendations' });
    }
  });

  app.get('/api/players/:playerId/drill-recommendations', requiresSubscription, async (req, res) => {
    try {
      const playerId = Number(req.params.playerId);
      const recommendations = await storage.getDrillRecommendations(playerId);
      res.json(recommendations);
    } catch (err) {
      console.error('Get recommendations error:', err);
      res.status(500).json({ error: 'Error fetching recommendations' });
    }
  });

  app.delete('/api/drill-recommendations/:id', requiresSubscription, async (req, res) => {
    try {
      await storage.deleteDrillRecommendation(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      console.error('Delete recommendation error:', err);
      res.status(500).json({ error: 'Error deleting recommendation' });
    }
  });

  app.patch('/api/players/:playerId/drill-recommendations/:id/complete', requiresSubscription, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getDrillRecommendations(Number(req.params.playerId));
      const rec = existing.find(r => r.id === id);
      if (!rec) {
        return res.status(404).json({ error: 'Recommendation not found' });
      }
      const newCompletedAt = rec.completedAt ? null : new Date();
      const updated = await storage.completeDrillRecommendation(id, newCompletedAt);
      res.json(updated);
    } catch (err) {
      console.error('Complete recommendation error:', err);
      res.status(500).json({ error: 'Error completing recommendation' });
    }
  });


  // --- Pre-Game Report --- Premium Feature
  app.get('/api/players/:playerId/pregame-report', requiresSubscription, async (req: any, res) => {
    try {
      const playerId = Number(req.params.playerId);
      const opponentName = req.query.opponent as string;
      const sport = (req.query.sport as string) || 'basketball';

      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }

      // Filter games by sport first
      const sportGames = (player.games || []).filter(g => g.sport === sport);

      // Recent performance (last 5 games for current sport)
      const recentGames = sportGames.slice(0, 5);
      
      // Sport-specific stats
      const isFootball = sport === 'football';
      let recentStats: any = {
        gamesPlayed: recentGames.length,
        recentGrades: recentGames.map(g => g.grade).filter(Boolean),
      };

      if (isFootball) {
        // Football stats
        recentStats = {
          ...recentStats,
          avgPassingYards: recentGames.length > 0 ? (recentGames.reduce((acc, g) => acc + (g.passingYards || 0), 0) / recentGames.length).toFixed(1) : '0.0',
          avgRushingYards: recentGames.length > 0 ? (recentGames.reduce((acc, g) => acc + (g.rushingYards || 0), 0) / recentGames.length).toFixed(1) : '0.0',
          avgReceivingYards: recentGames.length > 0 ? (recentGames.reduce((acc, g) => acc + (g.receivingYards || 0), 0) / recentGames.length).toFixed(1) : '0.0',
          avgTouchdowns: recentGames.length > 0 ? (recentGames.reduce((acc, g) => acc + (g.passingTouchdowns || 0) + (g.rushingTouchdowns || 0) + (g.receivingTouchdowns || 0), 0) / recentGames.length).toFixed(1) : '0.0',
          avgTackles: recentGames.length > 0 ? (recentGames.reduce((acc, g) => acc + (g.tackles || 0), 0) / recentGames.length).toFixed(1) : '0.0',
        };
      } else {
        // Basketball stats
        recentStats = {
          ...recentStats,
          avgPoints: recentGames.length > 0 ? (recentGames.reduce((acc, g) => acc + g.points, 0) / recentGames.length).toFixed(1) : '0.0',
          avgRebounds: recentGames.length > 0 ? (recentGames.reduce((acc, g) => acc + g.rebounds, 0) / recentGames.length).toFixed(1) : '0.0',
          avgAssists: recentGames.length > 0 ? (recentGames.reduce((acc, g) => acc + g.assists, 0) / recentGames.length).toFixed(1) : '0.0',
        };
      }

      // Games against this opponent (filtered by sport)
      let opponentMatchups: any[] = [];
      let opponentScoutInfo = null;

      if (opponentName) {
        opponentMatchups = sportGames.filter(g =>
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
            grade: g.grade,
            // Basketball stats
            points: g.points,
            rebounds: g.rebounds,
            assists: g.assists,
            // Football stats
            passingYards: g.passingYards || 0,
            rushingYards: g.rushingYards || 0,
            receivingYards: g.receivingYards || 0,
            touchdowns: (g.passingTouchdowns || 0) + (g.rushingTouchdowns || 0) + (g.receivingTouchdowns || 0),
            tackles: g.tackles || 0,
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
        const isFootball = player.sport === 'football';

        if (gamesPlayed === 0) {
          return {
            id: player.id,
            name: player.name,
            position: player.position,
            team: player.team,
            jerseyNumber: player.jerseyNumber,
            photoUrl: player.photoUrl,
            rosterRole: player.rosterRole || 'rotation',
            sport: player.sport || 'basketball',
            ppg: 0,
            rpg: 0,
            apg: 0,
            spg: 0,
            bpg: 0,
            passYpg: 0,
            rushYpg: 0,
            recYpg: 0,
            tdsPerGame: 0,
            compPct: 0,
            ypc: 0,
            tackles: 0,
            sacks: 0,
            avgGrade: null,
            avgGradeScore: 0,
            gamesPlayed: 0,
          };
        }

        // Basketball stats
        const ppg = games.reduce((acc, g) => acc + g.points, 0) / gamesPlayed;
        const rpg = games.reduce((acc, g) => acc + g.rebounds, 0) / gamesPlayed;
        const apg = games.reduce((acc, g) => acc + g.assists, 0) / gamesPlayed;
        const spg = games.reduce((acc, g) => acc + g.steals, 0) / gamesPlayed;
        const bpg = games.reduce((acc, g) => acc + g.blocks, 0) / gamesPlayed;

        // Football stats
        const totalPassYards = games.reduce((acc, g) => acc + (g.passingYards || 0), 0);
        const totalRushYards = games.reduce((acc, g) => acc + (g.rushingYards || 0), 0);
        const totalRecYards = games.reduce((acc, g) => acc + (g.receivingYards || 0), 0);
        const totalPassTDs = games.reduce((acc, g) => acc + (g.passingTouchdowns || 0), 0);
        const totalRushTDs = games.reduce((acc, g) => acc + (g.rushingTouchdowns || 0), 0);
        const totalRecTDs = games.reduce((acc, g) => acc + (g.receivingTouchdowns || 0), 0);
        const totalCompletions = games.reduce((acc, g) => acc + (g.completions || 0), 0);
        const totalPassAttempts = games.reduce((acc, g) => acc + (g.passAttempts || 0), 0);
        const totalCarries = games.reduce((acc, g) => acc + (g.carries || 0), 0);
        const totalTackles = games.reduce((acc, g) => acc + (g.tackles || 0), 0);
        const totalSacks = games.reduce((acc, g) => acc + (g.sacks || 0), 0);

        const passYpg = totalPassYards / gamesPlayed;
        const rushYpg = totalRushYards / gamesPlayed;
        const recYpg = totalRecYards / gamesPlayed;
        const tdsPerGame = (totalPassTDs + totalRushTDs + totalRecTDs) / gamesPlayed;
        const compPct = totalPassAttempts > 0 ? (totalCompletions / totalPassAttempts) * 100 : 0;
        const ypc = totalCarries > 0 ? totalRushYards / totalCarries : 0;

        const avgGradeScore = games.reduce((acc, g) => acc + (gradeScores[g.grade || 'C'] || 65), 0) / gamesPlayed;
        const avgGrade = gradeFromScore(avgGradeScore);

        return {
          id: player.id,
          name: player.name,
          position: player.position,
          team: player.team,
          jerseyNumber: player.jerseyNumber,
          photoUrl: player.photoUrl,
          rosterRole: player.rosterRole || 'rotation',
          sport: player.sport || 'basketball',
          ppg: Number(ppg.toFixed(1)),
          rpg: Number(rpg.toFixed(1)),
          apg: Number(apg.toFixed(1)),
          spg: Number(spg.toFixed(1)),
          bpg: Number(bpg.toFixed(1)),
          passYpg: Number(passYpg.toFixed(1)),
          rushYpg: Number(rushYpg.toFixed(1)),
          recYpg: Number(recYpg.toFixed(1)),
          tdsPerGame: Number(tdsPerGame.toFixed(1)),
          compPct: Number(compPct.toFixed(1)),
          ypc: Number(ypc.toFixed(1)),
          tackles: Number((totalTackles / gamesPlayed).toFixed(1)),
          sacks: Number((totalSacks / gamesPlayed).toFixed(1)),
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
      const allGames: { playerId: number; playerName: string; sport: string; game: any }[] = [];
      playersWithStats.forEach(player => {
        (player.games || []).forEach(game => {
          allGames.push({ playerId: player.id, playerName: player.name, sport: player.sport || 'basketball', game });
        });
      });
      const recentGames = allGames
        .sort((a, b) => new Date(b.game.date).getTime() - new Date(a.game.date).getTime())
        .slice(0, 5)
        .map(item => ({
          playerId: item.playerId,
          playerName: item.playerName,
          sport: item.sport,
          id: item.game.id,
          date: item.game.date,
          opponent: item.game.opponent,
          points: item.game.points,
          rebounds: item.game.rebounds,
          assists: item.game.assists,
          passingYards: item.game.passingYards || 0,
          rushingYards: item.game.rushingYards || 0,
          receivingYards: item.game.receivingYards || 0,
          touchdowns: (item.game.passingTouchdowns || 0) + (item.game.rushingTouchdowns || 0) + (item.game.receivingTouchdowns || 0),
          grade: item.game.grade,
        }));

      // Position distribution (multi-position players count for each of their positions)
      const positionDistribution = {
        Guard: playerStats.filter(p => (p.position || '').split(',').map(pos => pos.trim()).includes('Guard')).length,
        Wing: playerStats.filter(p => (p.position || '').split(',').map(pos => pos.trim()).includes('Wing')).length,
        Big: playerStats.filter(p => (p.position || '').split(',').map(pos => pos.trim()).includes('Big')).length,
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

  // POST /api/stripe/checkout-coins - Create checkout session for coin purchase
  app.post('/api/stripe/checkout-coins', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { packageId } = req.body;
      if (!packageId) {
        return res.status(400).json({ error: 'Package ID required' });
      }

      // Import COIN_PACKAGES from schema
      const { COIN_PACKAGES } = await import('../shared/schema');
      const coinPackage = COIN_PACKAGES.find(p => p.id === packageId);
      if (!coinPackage) {
        return res.status(400).json({ error: 'Invalid package' });
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
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${coinPackage.name} - ${coinPackage.coins} Coins`,
              description: `Purchase ${coinPackage.coins} coins for Caliber`,
            },
            unit_amount: coinPackage.priceInCents,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${baseUrl}/shop?coins_success=true`,
        cancel_url: `${baseUrl}/shop?coins_canceled=true`,
        metadata: {
          type: 'coin_purchase',
          packageId: coinPackage.id,
          coins: coinPackage.coins.toString(),
          userId,
        },
      });

      res.json({ url: session.url });
    } catch (err: any) {
      console.error('Coin checkout error:', err);
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

  // Admin analytics dashboard
  app.get('/api/admin/analytics', isAdmin, async (req, res) => {
    try {
      const [userStats] = await db.select({
        totalUsers: count(),
      }).from(users);

      const roleResult = await db.execute(sql`
        SELECT 
          COUNT(*) FILTER (WHERE role = 'player') as player_count,
          COUNT(*) FILTER (WHERE role = 'coach') as coach_count,
          COUNT(*) FILTER (WHERE role = 'recruiter') as recruiter_count,
          COUNT(*) FILTER (WHERE role = 'guardian') as guardian_count,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_7d,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_30d
        FROM users
      `);
      const roleBreakdown = roleResult.rows[0] as any;

      const playerResult = await db.execute(sql`
        SELECT 
          COUNT(*) as total_players,
          COUNT(*) FILTER (WHERE sport = 'basketball') as basketball_players,
          COUNT(*) FILTER (WHERE sport = 'football') as football_players
        FROM players
      `);
      const playerStats = playerResult.rows[0] as any;

      const gameResult = await db.execute(sql`
        SELECT 
          COUNT(*) as total_games,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as games_7d,
          COUNT(*) FILTER (WHERE sport = 'basketball') as basketball_games,
          COUNT(*) FILTER (WHERE sport = 'football') as football_games,
          ROUND(AVG(points)::numeric, 1) as avg_points
        FROM games
      `);
      const gameStats = gameResult.rows[0] as any;

      const engagementResult = await db.execute(sql`
        SELECT 
          COUNT(DISTINCT player_id) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as active_7d
        FROM games
      `);
      const engagementStats = engagementResult.rows[0] as any;

      const fiveGamesResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM (
          SELECT player_id FROM games GROUP BY player_id HAVING COUNT(*) >= 5
        ) sub
      `);
      const fiveGamesPlayers = fiveGamesResult.rows[0] as any;

      const recruitingResult = await db.execute(sql`
        SELECT 
          COUNT(*) as total_inquiries,
          COUNT(*) FILTER (WHERE is_read = false) as unread_inquiries
        FROM recruiting_inquiries
      `);
      const recruitingStats = recruitingResult.rows[0] as any;

      const feedResult = await db.execute(sql`
        SELECT COUNT(*) as total_posts FROM feed_activities
      `);
      const feedStats = feedResult.rows[0] as any;

      const recruiterResult = await db.execute(sql`
        SELECT 
          COUNT(*) as total_recruiters,
          COUNT(*) FILTER (WHERE is_verified = true) as verified_recruiters,
          COUNT(*) FILTER (WHERE is_verified = false) as pending_recruiters
        FROM recruiter_profiles
      `);
      const recruiterStats = recruiterResult.rows[0] as any;

      const guardianResult = await db.execute(sql`
        SELECT
          COUNT(*) as total_links,
          COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_count
        FROM guardian_links
      `);
      const guardianStats = guardianResult.rows[0] as any;

      const seasonResult = await db.execute(sql`
        SELECT s.id, s.name, s.sport, s.start_date, s.end_date, s.is_current,
          COALESCE(g.game_count, 0) as game_count
        FROM seasons s
        LEFT JOIN (
          SELECT season, COUNT(*) as game_count FROM games WHERE season IS NOT NULL GROUP BY season
        ) g ON g.season = s.name
        ORDER BY s.start_date DESC
      `);
      const seasonStats = seasonResult.rows;

      const topPerformersResult = await db.execute(sql`
        SELECT g.player_id, p.name as player_name, COUNT(*) as total_games
        FROM games g
        JOIN players p ON p.id = g.player_id
        GROUP BY g.player_id, p.name
        ORDER BY total_games DESC
        LIMIT 5
      `);
      const topPerformers = topPerformersResult.rows.map((r: any) => ({
        playerId: Number(r.player_id),
        playerName: r.player_name,
        totalGames: Number(r.total_games),
      }));

      const weeklyGrowthResult = await db.execute(sql`
        SELECT
          date_trunc('week', w.week_start) as week,
          COALESCE(u.user_count, 0) as new_users,
          COALESCE(g.game_count, 0) as new_games
        FROM (
          SELECT generate_series(
            date_trunc('week', NOW() - INTERVAL '7 weeks'),
            date_trunc('week', NOW()),
            '1 week'::interval
          ) as week_start
        ) w
        LEFT JOIN (
          SELECT date_trunc('week', created_at) as week, COUNT(*) as user_count
          FROM users
          WHERE created_at >= NOW() - INTERVAL '8 weeks'
          GROUP BY date_trunc('week', created_at)
        ) u ON u.week = w.week_start
        LEFT JOIN (
          SELECT date_trunc('week', created_at) as week, COUNT(*) as game_count
          FROM games
          WHERE created_at >= NOW() - INTERVAL '8 weeks'
          GROUP BY date_trunc('week', created_at)
        ) g ON g.week = w.week_start
        ORDER BY w.week_start ASC
      `);
      const weeklyGrowth = weeklyGrowthResult.rows.map((r: any) => ({
        week: r.week,
        newUsers: Number(r.new_users),
        newGames: Number(r.new_games),
      }));

      res.json({
        users: {
          total: Number(userStats.totalUsers),
          players: Number(playerStats?.total_players || 0),
          byRole: {
            player: Number(roleBreakdown?.player_count || 0),
            coach: Number(roleBreakdown?.coach_count || 0),
            recruiter: Number(roleBreakdown?.recruiter_count || 0),
            guardian: Number(roleBreakdown?.guardian_count || 0),
          },
          new7d: Number(roleBreakdown?.new_7d || 0),
          new30d: Number(roleBreakdown?.new_30d || 0),
        },
        games: {
          total: Number(gameStats?.total_games || 0),
          thisWeek: Number(gameStats?.games_7d || 0),
          basketball: Number(gameStats?.basketball_games || 0),
          football: Number(gameStats?.football_games || 0),
          avgPoints: Number(gameStats?.avg_points || 0),
        },
        engagement: {
          active7d: Number(engagementStats?.active_7d || 0),
          fivePlusGames: Number(fiveGamesPlayers?.count || 0),
        },
        recruiting: {
          totalInquiries: Number(recruitingStats?.total_inquiries || 0),
          unreadInquiries: Number(recruitingStats?.unread_inquiries || 0),
          totalRecruiters: Number(recruiterStats?.total_recruiters || 0),
          verifiedRecruiters: Number(recruiterStats?.verified_recruiters || 0),
          pendingRecruiters: Number(recruiterStats?.pending_recruiters || 0),
        },
        feed: {
          totalPosts: Number(feedStats?.total_posts || 0),
        },
        guardians: {
          totalLinks: Number(guardianStats?.total_links || 0),
          approved: Number(guardianStats?.approved_count || 0),
          pending: Number(guardianStats?.pending_count || 0),
        },
        seasons: seasonStats,
        topPerformers,
        weeklyGrowth,
      });
    } catch (err) {
      console.error('Admin analytics error:', err);
      res.status(500).json({ error: 'Could not fetch analytics' });
    }
  });

  // Admin feed moderation - get recent posts
  app.get('/api/admin/feed', isAdmin, async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;
      const posts = await db.select({
        id: feedActivities.id,
        activityType: feedActivities.activityType,
        playerId: feedActivities.playerId,
        headline: feedActivities.headline,
        subtext: feedActivities.subtext,
        createdAt: feedActivities.createdAt,
      }).from(feedActivities)
        .orderBy(desc(feedActivities.createdAt))
        .limit(limit)
        .offset(offset);

      const postsWithPlayer = await Promise.all(posts.map(async (post) => {
        let playerName = 'Unknown';
        if (post.playerId) {
          const p = await db.select({ name: players.name }).from(players).where(eq(players.id, post.playerId)).limit(1);
          if (p.length > 0) playerName = p[0].name;
        }
        const [reactionCount] = await db.select({ count: count() }).from(feedReactions).where(eq(feedReactions.activityId, post.id));
        const [commentCount] = await db.select({ count: count() }).from(feedComments).where(eq(feedComments.activityId, post.id));
        return { ...post, playerName, reactionCount: Number(reactionCount.count), commentCount: Number(commentCount.count) };
      }));

      res.json({ posts: postsWithPlayer });
    } catch (err) {
      console.error('Admin feed error:', err);
      res.status(500).json({ error: 'Could not fetch feed' });
    }
  });

  // Admin delete feed post
  app.delete('/api/admin/feed/:id', isAdmin, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      await db.delete(feedActivities).where(eq(feedActivities.id, postId));
      res.json({ success: true });
    } catch (err) {
      console.error('Admin delete feed error:', err);
      res.status(500).json({ error: 'Could not delete post' });
    }
  });

  // Admin get recent comments
  app.get('/api/admin/comments', isAdmin, async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;
      const comments = await db.select().from(feedComments)
        .orderBy(desc(feedComments.createdAt))
        .limit(limit)
        .offset(offset);
      res.json({ comments });
    } catch (err) {
      console.error('Admin comments error:', err);
      res.status(500).json({ error: 'Could not fetch comments' });
    }
  });

  // Admin delete comment
  app.delete('/api/admin/comments/:id', isAdmin, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      await db.delete(feedComments).where(eq(feedComments.id, commentId));
      res.json({ success: true });
    } catch (err) {
      console.error('Admin delete comment error:', err);
      res.status(500).json({ error: 'Could not delete comment' });
    }
  });

  // Admin get all recruiters
  app.get('/api/admin/recruiters', isAdmin, async (req, res) => {
    try {
      const allRecruiters = await db.select().from(recruiterProfiles)
        .orderBy(desc(recruiterProfiles.createdAt));
      res.json({ recruiters: allRecruiters });
    } catch (err) {
      console.error('Admin recruiters error:', err);
      res.status(500).json({ error: 'Could not fetch recruiters' });
    }
  });

  // Admin verify/reject recruiter
  app.patch('/api/admin/recruiters/:id/verify', isAdmin, async (req, res) => {
    try {
      const recruiterId = parseInt(req.params.id);
      const { verified } = req.body;
      const updated = await storage.updateRecruiterProfile(recruiterId, {
        isVerified: verified !== false,
        updatedAt: new Date(),
      });
      if (!updated) return res.status(404).json({ error: 'Recruiter not found' });
      res.json({ recruiter: updated });
    } catch (err) {
      console.error('Admin verify recruiter error:', err);
      res.status(500).json({ error: 'Could not update recruiter' });
    }
  });

  // Admin colleges status
  app.get('/api/admin/colleges/status', isAdmin, async (req, res) => {
    try {
      const collegeList = await db.select({
        id: colleges.id,
        name: colleges.name,
        division: colleges.division,
        conference: colleges.conference,
        espnTeamId: colleges.espnTeamId,
      }).from(colleges)
        .orderBy(colleges.name)
        .limit(200);

      const collegesWithCounts = await Promise.all(collegeList.map(async (col) => {
        const [rosterCount] = await db.select({ count: count() })
          .from(collegeRosterPlayers)
          .where(eq(collegeRosterPlayers.collegeId, col.id));
        return {
          ...col,
          rosterCount: Number(rosterCount.count),
          hasEspnSync: !!col.espnTeamId,
        };
      }));

      res.json({ colleges: collegesWithCounts });
    } catch (err) {
      console.error('Admin colleges status error:', err);
      res.status(500).json({ error: 'Could not fetch colleges' });
    }
  });

  app.patch('/api/admin/colleges/:id/espn-link', isAdmin, async (req, res) => {
    try {
      const collegeId = parseInt(req.params.id);
      if (isNaN(collegeId)) return res.status(400).json({ error: "Invalid college ID" });

      const { espnTeamId } = req.body;

      if (espnTeamId !== null && espnTeamId !== undefined) {
        const teamIdStr = String(espnTeamId);
        const college = await db.select({ sport: colleges.sport }).from(colleges).where(eq(colleges.id, collegeId)).limit(1);
        if (!college.length) return res.status(404).json({ error: "College not found" });

        const sport = college[0].sport || "basketball";
        const sportPath = sport === "football"
          ? "football/college-football"
          : "basketball/mens-college-basketball";
        const checkUrl = `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/teams/${teamIdStr}`;

        try {
          const checkRes = await fetch(checkUrl);
          if (!checkRes.ok) {
            return res.status(400).json({ error: `ESPN team ID ${teamIdStr} not found for ${sport}. Make sure you have the correct ID.` });
          }
        } catch {
          return res.status(400).json({ error: "Could not verify ESPN team ID. Please try again." });
        }

        await db.update(colleges).set({ espnTeamId: teamIdStr }).where(eq(colleges.id, collegeId));
      } else {
        await db.update(colleges).set({ espnTeamId: null }).where(eq(colleges.id, collegeId));
      }

      const [updated] = await db.select().from(colleges).where(eq(colleges.id, collegeId));
      res.json(updated);
    } catch (err) {
      console.error('Admin ESPN link error:', err);
      res.status(500).json({ error: 'Could not update ESPN link' });
    }
  });

  app.get('/api/admin/espn/search', isAdmin, async (req, res) => {
    try {
      const query = (req.query.q as string || "").toLowerCase().trim();
      const sport = (req.query.sport as string || "").toLowerCase();

      if (!query || query.length < 2) {
        return res.json({ teams: [] });
      }

      const results: Array<{ espnId: string; displayName: string; shortName: string; abbreviation: string; conference: string; logoUrl: string; sport: string }> = [];

      const fetchTeams = async (sportPath: string, sportName: string) => {
        try {
          const url = `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/teams?limit=400`;
          const response = await fetch(url);
          if (!response.ok) return;
          const data = await response.json();
          const teams = data.sports?.[0]?.leagues?.[0]?.teams || [];
          for (const t of teams) {
            const team = t.team || t;
            const dn = (team.displayName || "").toLowerCase();
            const sdn = (team.shortDisplayName || "").toLowerCase();
            const abbr = (team.abbreviation || "").toLowerCase();
            const nick = (team.nickname || "").toLowerCase();

            if (dn.includes(query) || sdn.includes(query) || abbr.includes(query) || nick.includes(query)) {
              const conf = team.groups?.parent?.shortName || team.groups?.shortName || "";
              const logo = team.logos?.[0]?.href || "";
              results.push({
                espnId: team.id?.toString() || "",
                displayName: team.displayName || "",
                shortName: team.shortDisplayName || "",
                abbreviation: team.abbreviation || "",
                conference: conf,
                logoUrl: logo,
                sport: sportName,
              });
            }
          }
        } catch (err) {
          console.error(`ESPN search error for ${sportName}:`, err);
        }
      };

      if (!sport || sport === "basketball") {
        await fetchTeams("basketball/mens-college-basketball", "basketball");
      }
      if (!sport || sport === "football") {
        await fetchTeams("football/college-football", "football");
      }

      res.json({ teams: results.slice(0, 20) });
    } catch (err) {
      console.error('ESPN search error:', err);
      res.status(500).json({ error: 'Could not search ESPN teams' });
    }
  });

  // Admin update user role
  app.patch('/api/admin/users/:id/role', isAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      const { role } = req.body;
      if (!['player', 'coach', 'recruiter'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      await db.update(users).set({ role }).where(eq(users.id, userId));
      res.json({ success: true });
    } catch (err) {
      console.error('Admin update role error:', err);
      res.status(500).json({ error: 'Could not update role' });
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

  // ========== CALIBER BADGES (Owner-awarded special recognition) ==========
  
  // Get a player's Caliber badge
  app.get('/api/players/:id/caliber-badge', async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const badge = await storage.getCaliberBadge(playerId);
      res.json({ badge: badge || null });
    } catch (err) {
      console.error('Get caliber badge error:', err);
      res.status(500).json({ error: 'Could not fetch caliber badge' });
    }
  });

  // Award a Caliber badge (owner only)
  app.post('/api/players/:id/caliber-badge', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!isAppOwner(userId)) {
        return res.status(403).json({ error: 'Only the app owner can award Caliber badges' });
      }
      
      const playerId = parseInt(req.params.id);
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }
      
      const { reason, category } = req.body;
      const badge = await storage.awardCaliberBadge({
        playerId,
        awardedBy: userId,
        reason: reason || null,
        category: category || 'excellence',
      });
      
      res.status(201).json({ badge });
    } catch (err) {
      console.error('Award caliber badge error:', err);
      res.status(500).json({ error: 'Could not award caliber badge' });
    }
  });

  // Revoke a Caliber badge (owner only)
  app.delete('/api/players/:id/caliber-badge', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!isAppOwner(userId)) {
        return res.status(403).json({ error: 'Only the app owner can revoke Caliber badges' });
      }
      
      const playerId = parseInt(req.params.id);
      await storage.revokeCaliberBadge(playerId);
      res.json({ success: true });
    } catch (err) {
      console.error('Revoke caliber badge error:', err);
      res.status(500).json({ error: 'Could not revoke caliber badge' });
    }
  });

  // Get all Caliber badge holders
  app.get('/api/caliber-badges', async (req, res) => {
    try {
      const badges = await storage.getAllCaliberBadges();
      res.json({ badges });
    } catch (err) {
      console.error('Get all caliber badges error:', err);
      res.status(500).json({ error: 'Could not fetch caliber badges' });
    }
  });

  // Set state ranking for a player (owner only)
  app.post('/api/players/:id/state-rank', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!isAppOwner(userId)) {
        return res.status(403).json({ error: 'Only the app owner can set state rankings' });
      }
      
      const playerId = parseInt(req.params.id);
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }
      
      const { rank } = req.body;
      if (!rank || typeof rank !== 'number' || rank < 1 || rank > 100) {
        return res.status(400).json({ error: 'Invalid rank. Must be a number between 1 and 100.' });
      }
      
      await storage.updatePlayer(playerId, { stateRank: rank });
      res.json({ success: true, stateRank: rank });
    } catch (err) {
      console.error('Set state rank error:', err);
      res.status(500).json({ error: 'Could not set state ranking' });
    }
  });

  // Remove state ranking from a player (owner only)
  app.delete('/api/players/:id/state-rank', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!isAppOwner(userId)) {
        return res.status(403).json({ error: 'Only the app owner can remove state rankings' });
      }
      
      const playerId = parseInt(req.params.id);
      await storage.updatePlayer(playerId, { stateRank: null });
      res.json({ success: true });
    } catch (err) {
      console.error('Remove state rank error:', err);
      res.status(500).json({ error: 'Could not remove state ranking' });
    }
  });

  // Set country ranking for a player (owner only)
  app.post('/api/players/:id/country-rank', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!isAppOwner(userId)) {
        return res.status(403).json({ error: 'Only the app owner can set country rankings' });
      }
      
      const playerId = parseInt(req.params.id);
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }
      
      const { rank } = req.body;
      if (!rank || typeof rank !== 'number' || rank < 1 || rank > 500) {
        return res.status(400).json({ error: 'Invalid rank. Must be a number between 1 and 500.' });
      }
      
      await storage.updatePlayer(playerId, { countryRank: rank });
      res.json({ success: true, countryRank: rank });
    } catch (err) {
      console.error('Set country rank error:', err);
      res.status(500).json({ error: 'Could not set country ranking' });
    }
  });

  // Remove country ranking from a player (owner only)
  app.delete('/api/players/:id/country-rank', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!isAppOwner(userId)) {
        return res.status(403).json({ error: 'Only the app owner can remove country rankings' });
      }
      
      const playerId = parseInt(req.params.id);
      await storage.updatePlayer(playerId, { countryRank: null });
      res.json({ success: true });
    } catch (err) {
      console.error('Remove country rank error:', err);
      res.status(500).json({ error: 'Could not remove country ranking' });
    }
  });

  // === FOOTBALL METRICS ROUTES ===
  
  // Get football metrics for a player
  app.get('/api/players/:id/football-metrics', async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const metrics = await storage.getFootballMetrics(playerId);
      res.json(metrics || null);
    } catch (err) {
      console.error('Get football metrics error:', err);
      res.status(500).json({ error: 'Could not fetch football metrics' });
    }
  });
  
  // Create or update football metrics for a player
  app.put('/api/players/:id/football-metrics', isAuthenticated, async (req: any, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const userId = req.user?.claims?.sub;
      
      // Check if user owns this player or is a coach
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }
      
      const user = await authStorage.getUser(userId);
      if (player.userId !== userId && user?.role !== 'coach' && !isAppOwner(userId)) {
        return res.status(403).json({ error: 'Not authorized to update this player' });
      }
      
      // Upsert the football metrics
      const existing = await storage.getFootballMetrics(playerId);
      if (existing) {
        const updated = await storage.updateFootballMetrics(playerId, req.body);
        res.json(updated);
      } else {
        const created = await storage.createFootballMetrics({ playerId, ...req.body });
        res.json(created);
      }
    } catch (err) {
      console.error('Update football metrics error:', err);
      res.status(500).json({ error: 'Could not update football metrics' });
    }
  });

  // Get all players with rankings (state or country)
  app.get('/api/state-rankings', async (req, res) => {
    try {
      const players = await storage.getPlayers();
      const rankedPlayers = players
        .filter((p: any) => p.stateRank !== null || p.countryRank !== null)
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          position: p.position,
          state: p.state,
          team: p.team,
          stateRank: p.stateRank,
          countryRank: p.countryRank,
        }));
      res.json({ players: rankedPlayers });
    } catch (err) {
      console.error('Get state rankings error:', err);
      res.status(500).json({ error: 'Could not fetch state rankings' });
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
        SELECT id, email, first_name as "firstName", last_name as "lastName", role, sport, "stripeCustomerId", "stripeSubscriptionId", "subscriptionStatus", "coinBalance", "createdAt"
        FROM users
        ORDER BY "createdAt" DESC
      `);
      res.json({ users: result.rows });
    } catch (err) {
      console.error('Admin get users error:', err);
      res.status(500).json({ error: 'Could not fetch users' });
    }
  });

  // Admin give coins to a user
  app.post('/api/admin/give-coins', isAdmin, async (req, res) => {
    try {
      const { userId, amount, reason } = req.body;
      
      if (!userId || !amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'Valid userId and positive amount are required' });
      }

      // Update user's coin balance
      await db.update(users)
        .set({ 
          coinBalance: sql`COALESCE(${users.coinBalance}, 0) + ${amount}` 
        })
        .where(eq(users.id, userId));

      // Record the transaction
      await db.insert(coinTransactions).values({
        userId,
        amount,
        type: 'awarded',
        description: reason || `Admin granted ${amount} coins`,
      });

      // Get updated balance
      const [updatedUser] = await db.select({ coinBalance: users.coinBalance })
        .from(users)
        .where(eq(users.id, userId));

      res.json({ 
        success: true, 
        message: `Granted ${amount} coins to user`,
        newBalance: updatedUser?.coinBalance || amount
      });
    } catch (err: any) {
      console.error('Admin give coins error:', err);
      res.status(500).json({ error: err.message || 'Could not give coins' });
    }
  });

  // Migrate existing games to add category grades (one-time admin endpoint)
  app.post('/api/admin/migrate-category-grades', isAdmin, async (req, res) => {
    try {
      // Get all games that don't have category grades
      const gamesResult = await db.execute(sql`
        SELECT g.id, g.points, g.rebounds, g.assists, g.steals, g.blocks, g.turnovers, 
               g.fouls, g.fg_made, g.fg_attempted, g.three_made, g.three_attempted,
               g.ft_made, g.ft_attempted, g.offensive_rebounds, g.defensive_rebounds,
               g.minutes, g.hustle_score, g.defense_rating, p.position
        FROM games g
        JOIN players p ON g.player_id = p.id
        WHERE g.defensive_grade IS NULL OR g.shooting_grade IS NULL
      `);
      
      let updatedCount = 0;
      for (const game of gamesResult.rows as any[]) {
        const stats = {
          points: game.points || 0,
          rebounds: game.rebounds || 0,
          assists: game.assists || 0,
          steals: game.steals || 0,
          blocks: game.blocks || 0,
          turnovers: game.turnovers || 0,
          fouls: game.fouls || 0,
          fgMade: game.fg_made || 0,
          fgAttempted: game.fg_attempted || 0,
          threePtMade: game.three_made || 0,
          threePtAttempted: game.three_attempted || 0,
          ftMade: game.ft_made || 0,
          ftAttempted: game.ft_attempted || 0,
          offensiveRebounds: game.offensive_rebounds || 0,
          defensiveRebounds: game.defensive_rebounds || 0,
          minutes: game.minutes || 0,
          hustleScore: game.hustle_score || 0,
          defenseRating: game.defense_rating || 0,
        };
        
        const categoryGrades = calculateCategoryGrades(stats, game.position || 'Guard');
        
        await db.execute(sql`
          UPDATE games 
          SET defensive_grade = ${categoryGrades.defensiveGrade},
              shooting_grade = ${categoryGrades.shootingGrade},
              rebounding_grade = ${categoryGrades.reboundingGrade},
              passing_grade = ${categoryGrades.passingGrade}
          WHERE id = ${game.id}
        `);
        updatedCount++;
      }
      
      res.json({ success: true, updatedCount, message: `Updated ${updatedCount} games with category grades` });
    } catch (err: any) {
      console.error('Admin migrate category grades error:', err);
      res.status(500).json({ error: err.message || 'Could not migrate category grades' });
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

  // Get player's games (for linking highlights to games)
  app.get('/api/players/:playerId/games', async (req, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }
      const games = await storage.getGamesByPlayerId(playerId);
      games.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      res.json(games);
    } catch (error) {
      console.error('Error getting player games:', error);
      res.status(500).json({ message: "Failed to get player games" });
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

  // GET /api/discover/highlights - Public feed of all highlight clips
  app.get('/api/discover/highlights', async (req, res) => {
    try {
      const { sport, sort, limit: limitStr, offset: offsetStr } = req.query as { 
        sport?: string; sort?: string; limit?: string; offset?: string 
      };
      const limit = Math.min(parseInt(limitStr || '20'), 50);
      const offset = parseInt(offsetStr || '0');
      
      let query = db.select({
        clip: highlightClips,
        playerName: players.name,
        playerPhoto: players.photoUrl,
        playerPosition: players.position,
        playerTeam: players.team,
        playerCity: players.city,
        playerState: players.state,
        playerSport: players.sport,
      })
      .from(highlightClips)
      .innerJoin(players, eq(highlightClips.playerId, players.id));

      if (sport) {
        query = query.where(eq(players.sport, sport)) as typeof query;
      }

      const orderCol = sort === 'popular' ? highlightClips.viewCount : sort === 'liked' ? highlightClips.likeCount : highlightClips.createdAt;
      const allClips = await query.orderBy(desc(orderCol)).limit(limit).offset(offset);
      
      const result = allClips.map(c => ({
        ...c.clip,
        playerName: c.playerName,
        playerPhoto: c.playerPhoto,
        playerPosition: c.playerPosition,
        playerTeam: c.playerTeam,
        playerCity: c.playerCity,
        playerState: c.playerState,
      }));
      
      res.json({ items: result, hasMore: result.length === limit });
    } catch (error) {
      console.error('Error fetching discover highlights:', error);
      res.status(500).json({ message: "Failed to fetch highlights" });
    }
  });

  // POST /api/highlight-clips/:id/like - Like a clip (toggle)
  app.post('/api/highlight-clips/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const clipId = parseInt(req.params.id);
      const clip = await storage.getHighlightClip(clipId);
      if (!clip) {
        return res.status(404).json({ message: "Clip not found" });
      }
      await storage.incrementClipLikeCount(clipId);
      res.json({ success: true, likeCount: (clip.likeCount || 0) + 1 });
    } catch (error) {
      console.error('Error liking clip:', error);
      res.status(500).json({ message: "Failed to like clip" });
    }
  });

  // Link a highlight clip to a verified game
  app.post('/api/highlights/:id/link-game', isAuthenticated, async (req: any, res) => {
    try {
      const highlightId = parseInt(req.params.id);
      const user = await authStorage.getUser(req.user.claims.sub);
      
      // Get the highlight clip
      const clip = await storage.getHighlightClip(highlightId);
      if (!clip) {
        return res.status(404).json({ message: "Highlight clip not found" });
      }
      
      // Authorization: owner or coach
      if (!user || (user.role !== 'coach' && user.playerId !== clip.playerId)) {
        return res.status(403).json({ message: "Not authorized to link this clip" });
      }
      
      // Validate request body
      const validatedData = linkHighlightToGameSchema.parse(req.body);
      
      // Check if the game exists
      const game = await storage.getGame(validatedData.gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      // Check if the game has verified stats (check statVerifications table)
      const verification = await db.select().from(statVerifications).where(
        and(
          eq(statVerifications.gameId, validatedData.gameId),
          eq(statVerifications.status, 'verified')
        )
      ).limit(1);
      
      if (!verification || verification.length === 0) {
        return res.status(400).json({ message: "Game must have verified stats before linking highlights" });
      }
      
      // Link the highlight to the game
      const updated = await storage.linkHighlightToGame(highlightId, validatedData.gameId, validatedData.timestamp);
      res.json(updated);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error('Error linking highlight to game:', error);
      res.status(500).json({ message: "Failed to link highlight to game" });
    }
  });

  // Unlink a highlight clip from a game
  app.post('/api/highlights/:id/unlink-game', isAuthenticated, async (req: any, res) => {
    try {
      const highlightId = parseInt(req.params.id);
      const user = await authStorage.getUser(req.user.claims.sub);
      
      // Get the highlight clip
      const clip = await storage.getHighlightClip(highlightId);
      if (!clip) {
        return res.status(404).json({ message: "Highlight clip not found" });
      }
      
      // Authorization: owner or coach
      if (!user || (user.role !== 'coach' && user.playerId !== clip.playerId)) {
        return res.status(403).json({ message: "Not authorized to unlink this clip" });
      }
      
      // Unlink the highlight from the game
      const updated = await storage.unlinkHighlightFromGame(highlightId);
      res.json(updated);
    } catch (error) {
      console.error('Error unlinking highlight from game:', error);
      res.status(500).json({ message: "Failed to unlink highlight from game" });
    }
  });

  // === HIGHLIGHT REEL DATA ===

  // GET /api/players/:id/reel-data - Get data for generating a highlight reel
  app.get('/api/players/:id/reel-data', async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      if (isNaN(playerId)) return res.status(400).json({ message: "Invalid player ID" });
      
      const player = await storage.getPlayer(playerId);
      if (!player) return res.status(404).json({ message: "Player not found" });
      
      const clips = await storage.getPlayerHighlightClips(playerId);
      
      const topClips = [...clips]
        .sort((a, b) => ((b.viewCount || 0) + (b.likeCount || 0) * 2) - ((a.viewCount || 0) + (a.likeCount || 0) * 2))
        .slice(0, 10);
      
      const allGames = await storage.getGamesByPlayerId(playerId);
      const totalGames = allGames.length;
      const sport = player.sport || 'basketball';
      
      let statOverlay: Record<string, string | number> = {};
      if (sport === 'basketball' && totalGames > 0) {
        statOverlay = {
          ppg: Math.round((allGames.reduce((s, g) => s + ((g.fgMade || 0) * 2 + (g.threeMade || 0) * 3 + (g.ftMade || 0)), 0) / totalGames) * 10) / 10,
          rpg: Math.round((allGames.reduce((s, g) => s + (g.rebounds || 0), 0) / totalGames) * 10) / 10,
          apg: Math.round((allGames.reduce((s, g) => s + (g.assists || 0), 0) / totalGames) * 10) / 10,
          gamesPlayed: totalGames,
        };
      } else if (totalGames > 0) {
        statOverlay = {
          tdpg: Math.round((allGames.reduce((s, g) => s + (g.passingTouchdowns || 0) + (g.rushingTouchdowns || 0) + (g.receivingTouchdowns || 0), 0) / totalGames) * 10) / 10,
          ypg: Math.round((allGames.reduce((s, g) => s + (g.passingYards || 0) + (g.rushingYards || 0) + (g.receivingYards || 0), 0) / totalGames) * 10) / 10,
          gamesPlayed: totalGames,
        };
      }
      
      res.json({
        player: {
          id: player.id,
          name: player.name,
          position: player.position,
          team: player.team,
          photoUrl: player.photoUrl,
          sport,
          school: player.school,
          graduationYear: player.graduationYear,
        },
        clips: topClips,
        totalClips: clips.length,
        statOverlay,
      });
    } catch (error) {
      console.error('Error getting reel data:', error);
      res.status(500).json({ message: "Failed to get reel data" });
    }
  });

  // === HIGHLIGHT CLIPS API - TikTok Style ===
  
  // GET /api/players/:id/highlights - Get a player's highlight clips
  app.get('/api/players/:id/highlights', async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const clips = await storage.getPlayerHighlightClips(playerId);
      res.json(clips);
    } catch (error) {
      console.error('Error fetching player highlights:', error);
      res.status(500).json({ message: "Failed to fetch highlights" });
    }
  });

  // POST /api/highlights - Create a new highlight clip
  app.post('/api/highlights', isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const validatedData = insertHighlightClipSchema.parse(req.body);
      
      // Authorization: owner or coach
      if (user.role !== 'coach' && user.playerId !== validatedData.playerId) {
        return res.status(403).json({ message: "Not authorized to create clips for this player" });
      }
      
      const newClip = await storage.createHighlightClip(validatedData);
      res.status(201).json(newClip);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error('Error creating highlight clip:', error);
      res.status(500).json({ message: "Failed to create highlight clip" });
    }
  });

  // POST /api/highlights/generate-overlay - Generate/update overlay settings for a clip
  app.post('/api/highlights/generate-overlay', isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { highlightId, overlayStyle, statsToFeature } = req.body;
      
      if (!highlightId || typeof highlightId !== 'number') {
        return res.status(400).json({ message: "highlightId is required" });
      }
      
      if (!overlayStyle || !['minimal', 'full', 'animated'].includes(overlayStyle)) {
        return res.status(400).json({ message: "overlayStyle must be 'minimal', 'full', or 'animated'" });
      }
      
      // Get the clip
      const clip = await storage.getHighlightClip(highlightId);
      if (!clip) {
        return res.status(404).json({ message: "Highlight clip not found" });
      }
      
      // Authorization: owner or coach
      if (user.role !== 'coach' && user.playerId !== clip.playerId) {
        return res.status(403).json({ message: "Not authorized to modify this clip" });
      }
      
      // Update the clip with overlay settings
      const statsToFeatureJson = Array.isArray(statsToFeature) ? JSON.stringify(statsToFeature) : null;
      const updated = await storage.updateHighlightClip(highlightId, {
        overlayStyle,
        statsToFeature: statsToFeatureJson,
      });
      
      res.json(updated);
    } catch (error) {
      console.error('Error generating overlay:', error);
      res.status(500).json({ message: "Failed to generate overlay" });
    }
  });

  // POST /api/highlights/:id/like - Increment like count
  app.post('/api/highlights/:id/like', async (req, res) => {
    try {
      const highlightId = parseInt(req.params.id);
      await storage.incrementClipLikeCount(highlightId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error liking highlight:', error);
      res.status(500).json({ message: "Failed to like highlight" });
    }
  });

  // Get all highlights linked to a specific game
  app.get('/api/games/:id/highlights', async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      
      // Check if the game exists
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      // Get all linked highlights
      const highlights = await storage.getGameHighlights(gameId);
      res.json(highlights);
    } catch (error) {
      console.error('Error getting game highlights:', error);
      res.status(500).json({ message: "Failed to get game highlights" });
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

  app.post('/api/workouts/:id/share', isAuthenticated, async (req: any, res) => {
    try {
      const workoutId = parseInt(req.params.id);
      const workout = await storage.getWorkout(workoutId);
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }

      const userId = req.user?.claims?.sub;
      const [player] = await db.select().from(players).where(eq(players.userId, userId));
      if (!player || workout.playerId !== player.id) {
        return res.status(403).json({ message: 'Not authorized to share this workout' });
      }

      const alreadyShared = await storage.isWorkoutShared(workoutId);
      if (alreadyShared) {
        return res.status(400).json({ message: "Workout already shared" });
      }

      const sessionId = req.headers['x-session-id'] as string || '';

      const activity = await storage.createFeedActivity({
        activityType: 'workout',
        playerId: workout.playerId,
        headline: `${player?.name || 'Player'} completed a ${workout.duration}-min ${workout.workoutType} workout: ${workout.title}`,
        subtext: workout.notes || `Intensity: ${workout.intensity}/10`,
        sessionId,
        relatedId: workout.id,
      });

      res.json(activity);
    } catch (error) {
      console.error('Error sharing workout:', error);
      res.status(500).json({ message: "Failed to share workout" });
    }
  });

  app.get('/api/workouts/:id/shared', isAuthenticated, async (req: any, res) => {
    try {
      const workoutId = parseInt(req.params.id);
      const workout = await storage.getWorkout(workoutId);
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }

      const userId = req.user?.claims?.sub;
      const [player] = await db.select().from(players).where(eq(players.userId, userId));
      if (!player || workout.playerId !== player.id) {
        return res.status(403).json({ message: 'Not authorized to share this workout' });
      }

      const shared = await storage.isWorkoutShared(workoutId);
      res.json(shared);
    } catch (error) {
      console.error('Error checking shared status:', error);
      res.status(500).json({ message: "Failed to check shared status" });
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
      
      const createSchema = z.object({
        type: z.enum(['championship', 'career_high', 'award', 'record', 'state_award']),
        title: z.string().min(1),
        description: z.string().optional(),
        season: z.string().optional(),
        dateEarned: z.string().optional(),
      });
      
      const input = createSchema.parse(req.body);
      
      // State awards can only be given by the app owner
      if (input.type === 'state_award') {
        const userId = req.user?.claims?.sub;
        if (!isAppOwner(userId)) {
          return res.status(403).json({ message: "Only the app owner can award state recognitions" });
        }
      } else {
        // For other accolade types, check if user can modify the player
        if (!await canModifyPlayer(req, playerId)) {
          return res.status(403).json({ message: "Not authorized to add accolades to this profile" });
        }
      }
      
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
  // COACH ROSTER API (Players in coach's teams)
  // ========================================

  // Get roster of players from coach's teams
  app.get('/api/roster', isCoach, async (req: any, res) => {
    try {
      const coachUserId = req.user.claims.sub;
      
      // Get teams created by this coach
      const coachTeams = await db.select().from(teams).where(eq(teams.createdBy, coachUserId));
      if (coachTeams.length === 0) {
        return res.json([]);
      }
      
      const teamIds = coachTeams.map(t => t.id);
      
      // Get all team members in coach's teams
      const members = await db.select().from(teamMembers)
        .where(inArray(teamMembers.teamId, teamIds));
      
      // Get unique player IDs (filtering out nulls)
      const playerIds = Array.from(new Set(members.map(m => m.playerId).filter((id): id is number => id !== null)));
      
      if (playerIds.length === 0) {
        return res.json([]);
      }
      
      // Get player data
      const rosterPlayers = await db.select().from(players).where(inArray(players.id, playerIds));
      
      res.json(rosterPlayers);
    } catch (error) {
      console.error('Error fetching roster:', error);
      res.status(500).json({ message: "Failed to fetch roster" });
    }
  });

  // ========================================
  // LIVE GAME MODE ROUTES (Team-based stat tracking)
  // ========================================

  // Start a live game session - Coach only
  app.post('/api/live-game/start', isCoach, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check for existing active session
      const existingSession = await storage.getActiveCoachSession(userId);
      if (existingSession) {
        return res.status(400).json({ message: "You already have an active game session" });
      }
      
      // Validate request
      const startSessionSchema = z.object({
        selectedPlayerIds: z.array(z.number()).min(1, "Select at least one player"),
        opponent: z.string().optional(),
        sport: z.enum(["basketball", "football"]).default("basketball"),
      });
      const validated = startSessionSchema.parse(req.body);
      
      const session = await storage.createLiveGameSession({
        coachUserId: userId,
        selectedPlayerIds: JSON.stringify(validated.selectedPlayerIds),
        opponent: validated.opponent || null,
        sport: validated.sport,
        status: 'active'
      });
      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error('Error starting live game session:', error);
      res.status(500).json({ message: "Failed to start live game session" });
    }
  });

  // Get current active session - Coach only
  app.get('/api/live-game/active', isCoach, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const session = await storage.getActiveCoachSession(userId);
      res.json(session || null);
    } catch (error) {
      console.error('Error getting active session:', error);
      res.status(500).json({ message: "Failed to get active session" });
    }
  });

  // Log a live game event (stat) - Coach only
  app.post('/api/live-game/:sessionId/event', isCoach, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const session = await storage.getLiveGameSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Verify coach owns this session
      const userId = req.user.claims.sub;
      if (session.coachUserId !== userId) {
        return res.status(403).json({ message: "Not authorized to add events to this session" });
      }
      
      // Validate event - must include playerId now
      const eventSchema = z.object({
        playerId: z.number().int().positive(),
        eventType: z.string(),
        value: z.number().int().default(1),
      });
      const validated = eventSchema.parse(req.body);
      
      // Verify player is in the session
      const playerIds = JSON.parse(session.selectedPlayerIds) as number[];
      if (!playerIds.includes(validated.playerId)) {
        return res.status(400).json({ message: "Player not in this session" });
      }
      
      const event = await storage.createLiveGameEvent({
        sessionId,
        playerId: validated.playerId,
        eventType: validated.eventType,
        value: validated.value,
      });
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error('Error logging live game event:', error);
      res.status(500).json({ message: "Failed to log live game event" });
    }
  });

  // Get session events
  app.get('/api/live-game/:sessionId/events', isAuthenticated, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const events = await storage.getSessionEvents(sessionId);
      res.json(events);
    } catch (error) {
      console.error('Error getting session events:', error);
      res.status(500).json({ message: "Failed to get session events" });
    }
  });

  // Delete a live game event (undo) - Coach only
  app.delete('/api/live-game/:sessionId/events/:eventId', isCoach, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const eventId = parseInt(req.params.eventId);
      const session = await storage.getLiveGameSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Verify coach owns this session
      const userId = req.user.claims.sub;
      if (session.coachUserId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete events from this session" });
      }
      
      await storage.deleteLiveGameEvent(eventId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting live game event:', error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Complete session and create games for all players - Coach only
  app.post('/api/live-game/:sessionId/complete', isCoach, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const session = await storage.getLiveGameSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Verify coach owns this session
      const userId = req.user.claims.sub;
      if (session.coachUserId !== userId) {
        return res.status(403).json({ message: "Not authorized to complete this session" });
      }
      
      // Validate request body
      const completeSessionSchema = z.object({
        result: z.string().optional().nullable(),
      });
      const validatedData = completeSessionSchema.parse(req.body);
      
      // Get all events for this session
      const events = await storage.getSessionEvents(sessionId);
      const playerIds = JSON.parse(session.selectedPlayerIds) as number[];
      
      // Aggregate stats per player
      const playerStats: Record<number, {
        points: number;
        rebounds: number;
        assists: number;
        steals: number;
        blocks: number;
        turnovers: number;
        fouls: number;
        fgMade: number;
        fgAttempted: number;
        threeMade: number;
        threeAttempted: number;
        ftMade: number;
        ftAttempted: number;
      }> = {};
      
      // Initialize stats for all players
      for (const playerId of playerIds) {
        playerStats[playerId] = {
          points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0,
          turnovers: 0, fouls: 0, fgMade: 0, fgAttempted: 0,
          threeMade: 0, threeAttempted: 0, ftMade: 0, ftAttempted: 0,
        };
      }
      
      // Process events
      for (const event of events) {
        const stats = playerStats[event.playerId];
        if (!stats) continue;
        
        switch (event.eventType) {
          case 'points_1': stats.points += 1; stats.ftMade++; stats.ftAttempted++; break;
          case 'points_2': stats.points += 2; stats.fgMade++; stats.fgAttempted++; break;
          case 'points_3': stats.points += 3; stats.threeMade++; stats.threeAttempted++; stats.fgMade++; stats.fgAttempted++; break;
          case 'rebound': stats.rebounds++; break;
          case 'assist': stats.assists++; break;
          case 'steal': stats.steals++; break;
          case 'block': stats.blocks++; break;
          case 'turnover': stats.turnovers++; break;
          case 'foul': stats.fouls++; break;
        }
      }
      
      // Create game records for each player
      const createdGames = [];
      const gameDate = new Date().toISOString().split('T')[0];
      
      for (const playerId of playerIds) {
        const stats = playerStats[playerId];
        const game = await storage.createGame({
          playerId,
          sport: session.sport,
          date: gameDate,
          opponent: session.opponent || "Unknown",
          result: validatedData.result || null,
          minutes: 0,
          ...stats
        });
        createdGames.push(game);
      }
      
      // Mark session as completed
      await storage.updateLiveGameSession(sessionId, {
        status: 'completed',
        endedAt: new Date(),
      });
      
      res.json({ 
        session: await storage.getLiveGameSession(sessionId), 
        games: createdGames,
        playerCount: playerIds.length
      });
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
        viewerUserId: user.id,
        viewerPlayerId: user.playerId || null,
        leftAt: null,
      });

      // Session is now team-based, no single player to notify
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

      await storage.removeLiveGameSpectator(sessionId, user.id, user.playerId || null);
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

      const spectatorSessions = await storage.getActiveSpectatorSessions(user.id, user.playerId || null);
      
      // Get the full session details for each spectating session
      const sessionsWithDetails = await Promise.all(
        spectatorSessions.map(async (spectator) => {
          const session = await storage.getLiveGameSession(spectator.sessionId);
          // For team-based sessions, get the player IDs from selectedPlayerIds
          const playerIds = session ? JSON.parse(session.selectedPlayerIds) as number[] : [];
          return {
            spectator,
            session,
            playerIds,
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
          notificationType: 'mentorship_request',
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
          notificationType: 'mentorship_accepted',
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
          notificationType: 'mentorship_declined',
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
          notificationType: 'recruit_interest',
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
            notificationType: 'recruit_contacted',
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

  // === SHOP API ROUTES ===

  // GET /api/shop/items - Get all active shop items (public, no auth required)
  app.get('/api/shop/items', async (req, res) => {
    try {
      const items = await db.select()
        .from(shopItems)
        .where(eq(shopItems.isActive, true))
        .orderBy(shopItems.sortOrder, shopItems.category, shopItems.name);
      res.json(items);
    } catch (error) {
      console.error('Error fetching shop items:', error);
      res.status(500).json({ message: "Failed to fetch shop items" });
    }
  });

  // GET /api/shop/inventory - Get user's owned items (requires auth)
  app.get('/api/shop/inventory', isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const inventory = await db.select({
        id: userInventory.id,
        userId: userInventory.userId,
        itemId: userInventory.itemId,
        purchasedAt: userInventory.purchasedAt,
        isEquipped: userInventory.isEquipped,
        item: shopItems,
      })
        .from(userInventory)
        .innerJoin(shopItems, eq(userInventory.itemId, shopItems.id))
        .where(eq(userInventory.userId, user.id));

      res.json(inventory);
    } catch (error) {
      console.error('Error fetching user inventory:', error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  // POST /api/shop/purchase - Purchase an item with coins (requires auth)
  app.post('/api/shop/purchase', isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const { itemId } = req.body;
      if (!itemId || typeof itemId !== 'number') {
        return res.status(400).json({ message: "Invalid itemId" });
      }

      // Get the item
      const [item] = await db.select().from(shopItems).where(eq(shopItems.id, itemId));
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      if (!item.isActive) {
        return res.status(400).json({ message: "Item is no longer available" });
      }

      // Check if user already owns this item
      const [existingItem] = await db.select()
        .from(userInventory)
        .where(and(eq(userInventory.userId, user.id), eq(userInventory.itemId, itemId)));
      if (existingItem) {
        return res.status(400).json({ message: "You already own this item" });
      }

      // Check if user has enough coins
      const userCoinBalance = user.coinBalance || 0;
      if (userCoinBalance < item.coinPrice) {
        return res.status(400).json({ 
          message: "Not enough coins",
          required: item.coinPrice,
          current: userCoinBalance
        });
      }

      // Perform purchase atomically
      await db.transaction(async (tx) => {
        // Deduct coins from user
        await tx.update(users)
          .set({ coinBalance: userCoinBalance - item.coinPrice })
          .where(eq(users.id, user.id));

        // Create inventory entry
        await tx.insert(userInventory).values({
          userId: user.id,
          itemId: itemId,
          isEquipped: false,
        });

        // Create coin transaction record
        await tx.insert(coinTransactions).values({
          userId: user.id,
          amount: -item.coinPrice,
          type: 'spent_shop',
          description: `Purchased ${item.name}`,
          relatedItemId: itemId,
        });
      });

      res.json({ 
        success: true, 
        message: `Successfully purchased ${item.name}`,
        newBalance: userCoinBalance - item.coinPrice
      });
    } catch (error) {
      console.error('Error purchasing item:', error);
      res.status(500).json({ message: "Failed to purchase item" });
    }
  });

  // POST /api/shop/equip - Equip/unequip an item (requires auth)
  app.post('/api/shop/equip', isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const { itemId, equipped } = req.body;
      if (!itemId || typeof itemId !== 'number' || typeof equipped !== 'boolean') {
        return res.status(400).json({ message: "Invalid request body. Required: { itemId: number, equipped: boolean }" });
      }

      // Check if user owns the item
      const [inventoryEntry] = await db.select({
        inventory: userInventory,
        item: shopItems,
      })
        .from(userInventory)
        .innerJoin(shopItems, eq(userInventory.itemId, shopItems.id))
        .where(and(eq(userInventory.userId, user.id), eq(userInventory.itemId, itemId)));

      if (!inventoryEntry) {
        return res.status(404).json({ message: "You don't own this item" });
      }

      await db.transaction(async (tx) => {
        // For themes, unequip any other theme first
        if (equipped && inventoryEntry.item.category === 'theme') {
          // Get all user's theme items
          const themeItems = await tx.select({
            inventoryId: userInventory.id,
            itemId: userInventory.itemId,
          })
            .from(userInventory)
            .innerJoin(shopItems, eq(userInventory.itemId, shopItems.id))
            .where(and(
              eq(userInventory.userId, user.id),
              eq(shopItems.category, 'theme'),
              eq(userInventory.isEquipped, true)
            ));

          // Unequip all currently equipped themes
          for (const themeItem of themeItems) {
            await tx.update(userInventory)
              .set({ isEquipped: false })
              .where(eq(userInventory.id, themeItem.inventoryId));
          }

          // Update active theme on user
          await tx.update(users)
            .set({ activeThemeId: itemId })
            .where(eq(users.id, user.id));
        }

        // If unequipping a theme, clear the active theme
        if (!equipped && inventoryEntry.item.category === 'theme') {
          await tx.update(users)
            .set({ activeThemeId: null })
            .where(eq(users.id, user.id));
        }

        // Update the equipped status
        await tx.update(userInventory)
          .set({ isEquipped: equipped })
          .where(and(eq(userInventory.userId, user.id), eq(userInventory.itemId, itemId)));
      });

      res.json({ 
        success: true, 
        message: equipped ? `Equipped ${inventoryEntry.item.name}` : `Unequipped ${inventoryEntry.item.name}`
      });
    } catch (error) {
      console.error('Error equipping/unequipping item:', error);
      res.status(500).json({ message: "Failed to update item equipment status" });
    }
  });

  // GET /api/shop/coins - Get user's coin balance and recent transactions (requires auth)
  app.get('/api/shop/coins', isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Get recent transactions (last 20)
      const transactions = await db.select()
        .from(coinTransactions)
        .where(eq(coinTransactions.userId, user.id))
        .orderBy(desc(coinTransactions.createdAt))
        .limit(20);

      res.json({
        balance: user.coinBalance || 0,
        transactions,
      });
    } catch (error) {
      console.error('Error fetching coin data:', error);
      res.status(500).json({ message: "Failed to fetch coin data" });
    }
  });

  // GET /api/shop/coin-packages - Get available coin packages for purchase
  app.get('/api/shop/coin-packages', async (req, res) => {
    try {
      const { COIN_PACKAGES } = await import('../shared/schema');
      res.json(COIN_PACKAGES);
    } catch (err: any) {
      console.error('Failed to get coin packages:', err);
      res.status(500).json({ error: 'Failed to get coin packages' });
    }
  });

  // GET /api/shop/active-theme - Get user's currently active theme
  app.get('/api/shop/active-theme', isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (!user.activeThemeId) {
        // Return default cyan theme
        return res.json({ 
          active: false,
          theme: null,
          accentColor: '#00D4FF' // Default Caliber cyan
        });
      }

      // Get the active theme details
      const [theme] = await db.select()
        .from(shopItems)
        .where(eq(shopItems.id, user.activeThemeId));

      if (!theme) {
        return res.json({ 
          active: false,
          theme: null,
          accentColor: '#00D4FF'
        });
      }

      res.json({
        active: true,
        theme: {
          id: theme.id,
          name: theme.name,
          type: theme.type,
          value: theme.value,
          category: theme.category,
        },
        accentColor: theme.value
      });
    } catch (error) {
      console.error('Error fetching active theme:', error);
      res.status(500).json({ message: "Failed to fetch active theme" });
    }
  });

  // POST /api/shop/coins/convert-xp - Convert XP to coins (stub for future use)
  app.post('/api/shop/coins/convert-xp', isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Stub: This feature is not yet implemented
      res.status(501).json({ 
        message: "XP to coins conversion is not yet available",
        hint: "This feature is coming soon!"
      });
    } catch (error) {
      console.error('Error converting XP to coins:', error);
      res.status(500).json({ message: "Failed to convert XP to coins" });
    }
  });

  // =============================================
  // PLAYER RATINGS ROUTES
  // =============================================

  // GET /api/players/:id/ratings - Get all ratings for a player
  app.get('/api/players/:id/ratings', async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }
      const ratings = await storage.getPlayerRatings(playerId);
      res.json(ratings);
    } catch (error) {
      console.error('Error fetching player ratings:', error);
      res.status(500).json({ message: "Failed to fetch player ratings" });
    }
  });

  // GET /api/players/:id/average-rating - Get average overall and potential rating
  app.get('/api/players/:id/average-rating', async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }
      const averageRating = await storage.getPlayerAverageRating(playerId);
      if (!averageRating) {
        return res.json({ overall: null, potential: null });
      }
      res.json(averageRating);
    } catch (error) {
      console.error('Error fetching average rating:', error);
      res.status(500).json({ message: "Failed to fetch average rating" });
    }
  });

  // POST /api/players/:id/ratings - Create a new rating (requires coach or admin role)
  app.post('/api/players/:id/ratings', isAuthenticated, requiresCoach, async (req: any, res) => {
    try {
      const playerId = parseInt(req.params.id);
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }

      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const validatedData = insertPlayerRatingSchema.parse({
        ...req.body,
        playerId,
        ratedByUserId: user.id,
        raterRole: user.role || 'coach',
      });

      const rating = await storage.createPlayerRating(validatedData);
      res.status(201).json(rating);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid rating data", errors: error.errors });
      }
      console.error('Error creating player rating:', error);
      res.status(500).json({ message: "Failed to create player rating" });
    }
  });

  // PATCH /api/ratings/:id - Update a rating
  app.patch('/api/ratings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const ratingId = parseInt(req.params.id);
      if (isNaN(ratingId)) {
        return res.status(400).json({ message: "Invalid rating ID" });
      }

      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const updated = await storage.updatePlayerRating(ratingId, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Rating not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error('Error updating player rating:', error);
      res.status(500).json({ message: "Failed to update player rating" });
    }
  });

  // DELETE /api/ratings/:id - Delete a rating
  app.delete('/api/ratings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const ratingId = parseInt(req.params.id);
      if (isNaN(ratingId)) {
        return res.status(400).json({ message: "Invalid rating ID" });
      }

      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      await storage.deletePlayerRating(ratingId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting player rating:', error);
      res.status(500).json({ message: "Failed to delete player rating" });
    }
  });

  // =============================================
  // AI RATING CALCULATION ROUTES
  // =============================================

  // GET /api/players/:id/ai-rating - Calculate AI-powered rating with sub-scores
  app.get('/api/players/:id/ai-rating', async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }

      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      const playerGames = await storage.getGamesByPlayerId(playerId);
      if (playerGames.length === 0) {
        return res.json({
          overallRating: null,
          subScores: null,
          message: "No games found - play some games to get an AI rating"
        });
      }

      const sortedGames = playerGames.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      const gameStats: GameStats[] = sortedGames.map(g => ({
        id: g.id,
        date: g.date,
        opponent: g.opponent,
        result: g.result || undefined,
        minutes: g.minutes || undefined,
        points: g.points || undefined,
        rebounds: g.rebounds || undefined,
        assists: g.assists || undefined,
        steals: g.steals || undefined,
        blocks: g.blocks || undefined,
        turnovers: g.turnovers || undefined,
        fouls: g.fouls || undefined,
        fgMade: g.fgMade || undefined,
        fgAttempted: g.fgAttempted || undefined,
        threeMade: g.threeMade || undefined,
        threeAttempted: g.threeAttempted || undefined,
        ftMade: g.ftMade || undefined,
        ftAttempted: g.ftAttempted || undefined,
        offensiveRebounds: g.offensiveRebounds || undefined,
        defensiveRebounds: g.defensiveRebounds || undefined,
        hustleScore: g.hustleScore || undefined,
        defenseRating: g.defenseRating || undefined,
        plusMinus: g.plusMinus || undefined,
        per: g.per || undefined,
        completions: g.completions || undefined,
        passAttempts: g.passAttempts || undefined,
        passingYards: g.passingYards || undefined,
        passingTouchdowns: g.passingTouchdowns || undefined,
        interceptions: g.interceptions || undefined,
        sacksTaken: g.sacksTaken || undefined,
        carries: g.carries || undefined,
        rushingYards: g.rushingYards || undefined,
        rushingTouchdowns: g.rushingTouchdowns || undefined,
        fumbles: g.fumbles || undefined,
        receptions: g.receptions || undefined,
        targets: g.targets || undefined,
        receivingYards: g.receivingYards || undefined,
        receivingTouchdowns: g.receivingTouchdowns || undefined,
        drops: g.drops || undefined,
        tackles: g.tackles || undefined,
        soloTackles: g.soloTackles || undefined,
        sacks: g.sacks || undefined,
        defensiveInterceptions: g.defensiveInterceptions || undefined,
        passDeflections: g.passDeflections || undefined,
        forcedFumbles: g.forcedFumbles || undefined,
        fumbleRecoveries: g.fumbleRecoveries || undefined,
        fieldGoalsMade: g.fieldGoalsMade || undefined,
        fieldGoalsAttempted: g.fieldGoalsAttempted || undefined,
        extraPointsMade: g.extraPointsMade || undefined,
        extraPointsAttempted: g.extraPointsAttempted || undefined,
        punts: g.punts || undefined,
        puntYards: g.puntYards || undefined,
        pancakeBlocks: g.pancakeBlocks || undefined,
        sacksAllowed: g.sacksAllowed || undefined,
        penalties: g.penalties || undefined,
        grade: g.grade || undefined,
      }));

      let metrics: PlayerMetrics | undefined;
      if (player.sport === 'football') {
        const footballMetrics = await storage.getFootballMetrics(playerId);
        if (footballMetrics) {
          metrics = {
            height: player.height || undefined,
            fortyYardDash: footballMetrics.fortyYardDash ? parseFloat(footballMetrics.fortyYardDash) : undefined,
            verticalJump: footballMetrics.verticalJump ? parseFloat(footballMetrics.verticalJump) : undefined,
            broadJump: footballMetrics.broadJump || undefined,
            threeConeDrill: footballMetrics.threeConeDrill ? parseFloat(footballMetrics.threeConeDrill) : undefined,
            benchPressReps: footballMetrics.benchPressReps || undefined,
            wingspan: footballMetrics.wingspan ? parseFloat(footballMetrics.wingspan) : undefined,
            physicality: footballMetrics.physicality || undefined,
            footballIQ: footballMetrics.footballIQ || undefined,
            mentalToughness: footballMetrics.mentalToughness || undefined,
            coachability: footballMetrics.coachability || undefined,
            leadership: footballMetrics.leadership || undefined,
            workEthic: footballMetrics.workEthic || undefined,
            competitiveness: footballMetrics.competitiveness || undefined,
            clutchPerformance: footballMetrics.clutchPerformance || undefined,
          };
        }
      } else {
        metrics = {
          height: player.height || undefined,
        };
      }

      const peerStats = await storage.getPeerStats(player.sport as Sport, player.position.split(',')[0].trim());

      const primaryPosition = player.position.split(',')[0].trim();
      const aiRating = calculateAIRating(
        gameStats,
        player.sport as Sport,
        primaryPosition,
        player.rosterRole || 'rotation',
        metrics,
        peerStats
      );

      res.json(aiRating);
    } catch (error) {
      console.error('Error calculating AI rating:', error);
      res.status(500).json({ message: "Failed to calculate AI rating" });
    }
  });

  // GET /api/players/:id/ai-projection - Calculate AI-powered future projection
  app.get('/api/players/:id/ai-projection', async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }

      const horizonMonths = parseInt(req.query.horizon as string) || 12;

      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      const playerGames = await storage.getGamesByPlayerId(playerId);
      if (playerGames.length < 3) {
        return res.json({
          projection: null,
          message: "Need at least 3 games to generate projections"
        });
      }

      const sortedGames = playerGames.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      const gameStats: GameStats[] = sortedGames.map(g => ({
        id: g.id,
        date: g.date,
        opponent: g.opponent,
        result: g.result || undefined,
        grade: g.grade || undefined,
        points: g.points || undefined,
        rebounds: g.rebounds || undefined,
        assists: g.assists || undefined,
      }));

      let metrics: PlayerMetrics | undefined;
      if (player.sport === 'football') {
        const footballMetrics = await storage.getFootballMetrics(playerId);
        if (footballMetrics) {
          metrics = {
            coachability: footballMetrics.coachability || undefined,
            workEthic: footballMetrics.workEthic || undefined,
            clutchPerformance: footballMetrics.clutchPerformance || undefined,
          };
        }
      }

      const peerStats = await storage.getPeerStats(player.sport as Sport, player.position.split(',')[0].trim());
      const primaryPosition = player.position.split(',')[0].trim();
      
      const aiRating = calculateAIRating(
        gameStats,
        player.sport as Sport,
        primaryPosition,
        player.rosterRole || 'rotation',
        metrics,
        peerStats
      );

      let playerAge: number | undefined;
      if (player.graduationYear) {
        const currentYear = new Date().getFullYear();
        playerAge = 18 - (player.graduationYear - currentYear);
      }

      const projection = calculateProjection(
        aiRating.overallRating,
        gameStats,
        metrics,
        playerAge,
        horizonMonths
      );

      res.json({
        currentRating: aiRating.overallRating,
        projection,
      });
    } catch (error) {
      console.error('Error calculating AI projection:', error);
      res.status(500).json({ message: "Failed to calculate AI projection" });
    }
  });

  // GET /api/players/:id/rating-breakdown - Get detailed sub-score breakdown with explanations
  app.get('/api/players/:id/rating-breakdown', async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }

      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      const playerGames = await storage.getGamesByPlayerId(playerId);
      
      const gameStats: GameStats[] = playerGames.map(g => ({
        id: g.id,
        date: g.date,
        opponent: g.opponent,
        result: g.result || undefined,
        grade: g.grade || undefined,
        points: g.points || undefined,
        rebounds: g.rebounds || undefined,
        assists: g.assists || undefined,
        steals: g.steals || undefined,
        blocks: g.blocks || undefined,
        turnovers: g.turnovers || undefined,
        fgMade: g.fgMade || undefined,
        fgAttempted: g.fgAttempted || undefined,
        threeMade: g.threeMade || undefined,
        threeAttempted: g.threeAttempted || undefined,
        ftMade: g.ftMade || undefined,
        ftAttempted: g.ftAttempted || undefined,
        plusMinus: g.plusMinus || undefined,
        defenseRating: g.defenseRating || undefined,
        per: g.per || undefined,
        passingYards: g.passingYards || undefined,
        passingTouchdowns: g.passingTouchdowns || undefined,
        rushingYards: g.rushingYards || undefined,
        rushingTouchdowns: g.rushingTouchdowns || undefined,
        receivingYards: g.receivingYards || undefined,
        receivingTouchdowns: g.receivingTouchdowns || undefined,
        tackles: g.tackles || undefined,
        sacks: g.sacks || undefined,
        defensiveInterceptions: g.defensiveInterceptions || undefined,
      }));

      const peerStats = await storage.getPeerStats(player.sport as Sport, player.position.split(',')[0].trim());
      const primaryPosition = player.position.split(',')[0].trim();
      
      const aiRating = calculateAIRating(
        gameStats,
        player.sport as Sport,
        primaryPosition,
        player.rosterRole || 'rotation',
        undefined,
        peerStats
      );

      const coachRatings = await storage.getPlayerRatings(playerId);
      const avgCoachRating = coachRatings.length > 0
        ? Math.round(coachRatings.reduce((sum, r) => sum + r.overallRating, 0) / coachRatings.length)
        : null;

      res.json({
        aiRating,
        coachRating: avgCoachRating,
        gamesAnalyzed: playerGames.length,
        sport: player.sport,
        position: player.position,
        rosterRole: player.rosterRole || 'rotation',
      });
    } catch (error) {
      console.error('Error getting rating breakdown:', error);
      res.status(500).json({ message: "Failed to get rating breakdown" });
    }
  });

  // =============================================
  // STAT VERIFICATIONS ROUTES
  // =============================================

  // GET /api/coach/unverified-games - Get all unverified games for coach's team members
  app.get('/api/coach/unverified-games', isAuthenticated, requiresCoach, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const unverifiedGames = await storage.getUnverifiedGamesForCoach(userId);
      res.json(unverifiedGames);
    } catch (error) {
      console.error('Error fetching unverified games:', error);
      res.status(500).json({ message: "Failed to fetch unverified games" });
    }
  });

  // POST /api/games/:id/quick-verify - Quick verify a game with minimal input
  app.post('/api/games/:id/quick-verify', isAuthenticated, requiresCoach, async (req: any, res) => {
    try {
      const gameId = parseInt(req.params.id);
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }

      // Get the game to find the player
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      const userId = req.user?.id;
      
      // Security check: Verify the game's player is on one of this coach's teams
      const isAuthorized = await storage.isPlayerOnCoachTeam(game.playerId, userId);
      if (!isAuthorized) {
        return res.status(403).json({ message: "You can only verify games for players on your team" });
      }

      const userName = req.user?.firstName && req.user?.lastName 
        ? `${req.user.firstName} ${req.user.lastName}` 
        : req.user?.email || 'Coach';

      // Create verification with default values for quick verify
      const verification = await storage.createStatVerification({
        gameId,
        playerId: game.playerId,
        verifiedByUserId: userId,
        verifierName: userName,
        verifierRole: req.body.verifierRole || 'head_coach',
        verificationMethod: req.body.verificationMethod || 'in_person',
        status: 'verified',
        verifiedAt: new Date(),
        notes: req.body.notes || 'Quick verified by coach',
      });

      res.status(201).json(verification);
    } catch (error) {
      console.error('Error quick verifying game:', error);
      res.status(500).json({ message: "Failed to verify game" });
    }
  });

  // GET /api/games/:id/verification - Get verification status for a game
  app.get('/api/games/:id/verification', async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }

      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      const verification = await storage.getStatVerification(gameId, game.playerId);
      res.json(verification || { status: 'unverified' });
    } catch (error) {
      console.error('Error fetching game verification:', error);
      res.status(500).json({ message: "Failed to fetch game verification" });
    }
  });

  // GET /api/players/:id/verified-games - Get all verified games for a player
  app.get('/api/players/:id/verified-games', async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }
      const verifiedGames = await storage.getPlayerVerifiedGames(playerId);
      res.json(verifiedGames);
    } catch (error) {
      console.error('Error fetching verified games:', error);
      res.status(500).json({ message: "Failed to fetch verified games" });
    }
  });

  // POST /api/games/:id/verify - Verify a game's stats (requires coach role)
  app.post('/api/games/:id/verify', isAuthenticated, requiresCoach, async (req: any, res) => {
    try {
      const gameId = parseInt(req.params.id);
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }

      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const verifierName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Coach';
      const validatedData = insertStatVerificationSchema.parse({
        gameId,
        playerId: game.playerId,
        verifiedByUserId: user.id,
        verifierName,
        verifierRole: req.body.verifierRole || 'head_coach',
        verificationMethod: req.body.verificationMethod || 'in_person',
        status: 'verified',
        verifiedAt: new Date(),
        proofUrl: req.body.proofUrl,
        notes: req.body.notes,
      });

      const verification = await storage.createStatVerification(validatedData);
      res.status(201).json(verification);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid verification data", errors: error.errors });
      }
      console.error('Error verifying game stats:', error);
      res.status(500).json({ message: "Failed to verify game stats" });
    }
  });

  // PATCH /api/verifications/:id - Update verification status
  app.patch('/api/verifications/:id', isAuthenticated, requiresCoach, async (req: any, res) => {
    try {
      const verificationId = parseInt(req.params.id);
      if (isNaN(verificationId)) {
        return res.status(400).json({ message: "Invalid verification ID" });
      }

      const updated = await storage.updateStatVerification(verificationId, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Verification not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error('Error updating verification:', error);
      res.status(500).json({ message: "Failed to update verification" });
    }
  });

  // =============================================
  // PERFORMANCE MILESTONES ROUTES (Dynamic)
  // =============================================

  // GET /api/players/:id/milestones - Dynamically compute recent milestones for a player
  app.get('/api/players/:id/milestones', async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }

      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      const milestones: any[] = [];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

      const allGames = await db.select().from(games)
        .where(eq(games.playerId, playerId))
        .orderBy(desc(games.date));

      if (allGames.length > 0) {
        const mostRecentGame = allGames[0];
        const sport = player.sport || 'basketball';

        // a) Season Highs - check if most recent game has any stat that's the highest
        const bbStats = ['points', 'rebounds', 'assists', 'steals', 'blocks'] as const;
        const fbStats = ['passingYards', 'rushingYards', 'receivingYards', 'passingTouchdowns', 'rushingTouchdowns', 'receivingTouchdowns', 'tackles', 'sacks'] as const;
        const statsToCheck = sport === 'football' ? fbStats : bbStats;

        const statLabels: Record<string, string> = {
          points: 'Points', rebounds: 'Rebounds', assists: 'Assists', steals: 'Steals', blocks: 'Blocks',
          passingYards: 'Passing Yards', rushingYards: 'Rushing Yards', receivingYards: 'Receiving Yards',
          passingTouchdowns: 'Passing TDs', rushingTouchdowns: 'Rushing TDs', receivingTouchdowns: 'Receiving TDs',
          tackles: 'Tackles', sacks: 'Sacks',
        };

        for (const stat of statsToCheck) {
          const currentVal = (mostRecentGame as any)[stat] ?? 0;
          if (currentVal <= 0) continue;
          const otherGames = allGames.slice(1);
          const maxOther = otherGames.reduce((mx, g) => Math.max(mx, (g as any)[stat] ?? 0), 0);
          if (currentVal > maxOther && allGames.length > 1) {
            milestones.push({
              type: 'season_high',
              title: 'New Season High!',
              subtitle: `${currentVal} ${statLabels[stat] || stat}`,
              detail: `vs ${mostRecentGame.opponent} on ${mostRecentGame.date}`,
              stat,
              value: currentVal,
              gameId: mostRecentGame.id,
              createdAt: mostRecentGame.createdAt || new Date().toISOString(),
            });
          }
        }

        // b) Grade A Games in last 30 days
        const gradeAGames = allGames.filter(g => {
          const gDate = new Date(g.date);
          return gDate >= thirtyDaysAgo && (g.grade === 'A' || g.grade === 'A+');
        });
        for (const g of gradeAGames) {
          milestones.push({
            type: 'grade_a',
            title: g.grade === 'A+' ? 'Elite A+ Performance!' : 'A Grade Game!',
            subtitle: `Grade: ${g.grade}`,
            detail: `vs ${g.opponent} on ${g.date}`,
            stat: 'grade',
            value: g.grade,
            gameId: g.id,
            createdAt: g.createdAt || new Date().toISOString(),
          });
        }

        // c) Games Milestones
        const totalGames = allGames.length;
        const gameMilestones = [10, 25, 50, 100, 250, 500];
        for (const m of gameMilestones) {
          if (totalGames >= m && totalGames < m + 5) {
            milestones.push({
              type: 'games_milestone',
              title: `${m} Games Logged!`,
              subtitle: `${totalGames} total games played`,
              detail: `Milestone: ${m} games`,
              stat: 'games',
              value: totalGames,
              gameId: null,
              createdAt: new Date().toISOString(),
            });
            break;
          }
        }
      }

      // d) Tier Info
      if (player.currentTier && player.currentTier !== 'Rookie') {
        milestones.push({
          type: 'tier_promotion',
          title: `${player.currentTier} Tier`,
          subtitle: `Current Rank: ${player.currentTier}`,
          detail: `${player.totalXp || 0} Total XP`,
          stat: 'tier',
          value: player.currentTier,
          gameId: null,
          createdAt: player.createdAt || new Date().toISOString(),
        });
      }

      // e) Badge Unlocks - recently upgraded skill badges
      try {
        const recentBadges = await db.select().from(skillBadges)
          .where(and(
            eq(skillBadges.playerId, playerId),
            gte(skillBadges.updatedAt, thirtyDaysAgo)
          ))
          .orderBy(desc(skillBadges.updatedAt));

        for (const badge of recentBadges) {
          if (badge.currentLevel !== 'none') {
            milestones.push({
              type: 'badge_unlock',
              title: 'Badge Unlocked!',
              subtitle: `${badge.skillType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - ${badge.currentLevel.charAt(0).toUpperCase() + badge.currentLevel.slice(1)}`,
              detail: `Career value: ${badge.careerValue}`,
              stat: badge.skillType,
              value: badge.currentLevel,
              gameId: null,
              createdAt: badge.updatedAt?.toISOString() || new Date().toISOString(),
            });
          }
        }
      } catch (e) {
        // Skill badges table might not have data
      }

      // f) Streak milestones
      try {
        const streaks = await db.select().from(activityStreaks)
          .where(eq(activityStreaks.playerId, playerId));

        const streakMilestones = [5, 10, 25, 50];
        for (const streak of streaks) {
          for (const m of streakMilestones) {
            if (streak.currentStreak >= m && streak.currentStreak < m + 3) {
              milestones.push({
                type: 'streak_milestone',
                title: `${m}-Game Streak!`,
                subtitle: `${streak.currentStreak} ${streak.streakType.replace(/_/g, ' ')} streak`,
                detail: `Longest: ${streak.longestStreak}`,
                stat: streak.streakType,
                value: streak.currentStreak,
                gameId: null,
                createdAt: streak.updatedAt?.toISOString() || new Date().toISOString(),
              });
              break;
            }
          }
        }
      } catch (e) {
        // Streaks table might not have data
      }

      res.json({ milestones });
    } catch (error) {
      console.error('Error computing player milestones:', error);
      res.status(500).json({ message: "Failed to compute player milestones" });
    }
  });

  // =============================================
  // THIS DAY LAST YEAR MEMORIES ROUTE
  // =============================================

  app.get('/api/players/:id/memories', async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }

      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      const sport = player.sport || 'basketball';
      const now = new Date();

      const currentStart = new Date(now);
      currentStart.setDate(currentStart.getDate() - 7);
      const currentEnd = new Date(now);
      currentEnd.setDate(currentEnd.getDate() + 7);

      const lastYearCenter = new Date(now);
      lastYearCenter.setFullYear(lastYearCenter.getFullYear() - 1);
      const lastYearStart = new Date(lastYearCenter);
      lastYearStart.setDate(lastYearStart.getDate() - 7);
      const lastYearEnd = new Date(lastYearCenter);
      lastYearEnd.setDate(lastYearEnd.getDate() + 7);

      const fmt = (d: Date) => d.toISOString().split('T')[0];
      const fmtLabel = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      const currentGames = await db.select().from(games)
        .where(and(
          eq(games.playerId, playerId),
          gte(games.date, fmt(currentStart)),
          lte(games.date, fmt(currentEnd))
        ));

      const lastYearGames = await db.select().from(games)
        .where(and(
          eq(games.playerId, playerId),
          gte(games.date, fmt(lastYearStart)),
          lte(games.date, fmt(lastYearEnd))
        ));

      if (lastYearGames.length === 0) {
        return res.json({ hasMemories: false });
      }

      const avgStat = (gamesList: any[], key: string) => {
        const vals = gamesList.map(g => (g as any)[key] ?? 0);
        return vals.length > 0 ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : 0;
      };

      const bbStats = [
        { key: 'points', label: 'Points' },
        { key: 'rebounds', label: 'Rebounds' },
        { key: 'assists', label: 'Assists' },
        { key: 'steals', label: 'Steals' },
        { key: 'blocks', label: 'Blocks' },
      ];

      const fbStats = [
        { key: 'passingYards', label: 'Passing Yards' },
        { key: 'rushingYards', label: 'Rushing Yards' },
        { key: 'receivingYards', label: 'Receiving Yards' },
        { key: 'tackles', label: 'Tackles' },
        { key: 'sacks', label: 'Sacks' },
      ];

      const statsToCompare = sport === 'football' ? fbStats : bbStats;

      const comparisons = statsToCompare.map(({ key, label }) => {
        const current = Math.round(avgStat(currentGames, key) * 10) / 10;
        const lastYear = Math.round(avgStat(lastYearGames, key) * 10) / 10;
        const change = lastYear !== 0 ? Math.round(((current - lastYear) / lastYear) * 100) : (current > 0 ? 100 : 0);
        return { stat: label, current, lastYear, change, improved: change > 0 };
      }).filter(c => c.current > 0 || c.lastYear > 0);

      const gradeValues: Record<string, number> = {
        'A+': 100, 'A': 95, 'A-': 90, 'B+': 88, 'B': 85, 'B-': 80,
        'C+': 78, 'C': 75, 'C-': 70, 'D+': 68, 'D': 65, 'D-': 60, 'F': 50,
      };
      const valueToGrade = (v: number): string => {
        if (v >= 97) return 'A+'; if (v >= 92) return 'A'; if (v >= 87) return 'A-';
        if (v >= 84) return 'B+'; if (v >= 81) return 'B'; if (v >= 77) return 'B-';
        if (v >= 74) return 'C+'; if (v >= 71) return 'C'; if (v >= 67) return 'C-';
        if (v >= 64) return 'D+'; if (v >= 61) return 'D'; if (v >= 57) return 'D-';
        return 'F';
      };

      let overallGrade: { current: string; lastYear: string } | undefined;
      const currentGraded = currentGames.filter(g => g.grade && gradeValues[g.grade.trim().toUpperCase()]);
      const lastYearGraded = lastYearGames.filter(g => g.grade && gradeValues[g.grade.trim().toUpperCase()]);
      if (currentGraded.length > 0 && lastYearGraded.length > 0) {
        const avgCurrent = currentGraded.reduce((a, g) => a + (gradeValues[g.grade!.trim().toUpperCase()] || 0), 0) / currentGraded.length;
        const avgLastYear = lastYearGraded.reduce((a, g) => a + (gradeValues[g.grade!.trim().toUpperCase()] || 0), 0) / lastYearGraded.length;
        overallGrade = { current: valueToGrade(avgCurrent), lastYear: valueToGrade(avgLastYear) };
      }

      const improved = comparisons.filter(c => c.improved).sort((a, b) => b.change - a.change);
      let motivationalMessage = "Keep working hard and tracking your progress!";
      if (improved.length > 0) {
        const best = improved[0];
        motivationalMessage = `You've improved your ${best.stat.toLowerCase()} by ${best.change}%! Keep pushing!`;
      } else if (comparisons.length > 0) {
        motivationalMessage = "Every game is a chance to grow. Stay focused and keep grinding!";
      }

      res.json({
        hasMemories: true,
        periodLabel: "This time last year",
        currentPeriod: {
          games: currentGames.length,
          dateRange: `${fmtLabel(currentStart)} - ${fmtLabel(currentEnd)}`,
        },
        lastYearPeriod: {
          games: lastYearGames.length,
          dateRange: `${fmtLabel(lastYearStart)} - ${fmtLabel(lastYearEnd)}`,
        },
        comparisons,
        overallGrade,
        motivationalMessage,
      });
    } catch (error) {
      console.error('Error computing player memories:', error);
      res.status(500).json({ message: "Failed to compute player memories" });
    }
  });

  // =============================================
  // AI PROJECTIONS ROUTES
  // =============================================

  // GET /api/players/:id/projections - Get all projections for a player
  app.get('/api/players/:id/projections', async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }
      const projections = await storage.getPlayerProjections(playerId);
      res.json(projections);
    } catch (error) {
      console.error('Error fetching player projections:', error);
      res.status(500).json({ message: "Failed to fetch player projections" });
    }
  });

  // POST /api/players/:id/projections/generate - Generate a new AI projection (premium feature)
  app.post('/api/players/:id/projections/generate', isAuthenticated, requiresSubscription, async (req: any, res) => {
    try {
      const playerId = parseInt(req.params.id);
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }

      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      const projectionType = req.body.projectionType || 'season_end';

      // Check if there's already an active projection of this type
      const existingProjection = await storage.getActiveProjection(playerId, projectionType);
      if (existingProjection) {
        return res.json({ 
          message: "Active projection already exists",
          projection: existingProjection 
        });
      }

      // Generate AI projection using Gemini
      const gamesData = player.games || [];
      if (gamesData.length < 3) {
        return res.status(400).json({ 
          message: "Not enough game data for projection. At least 3 games required." 
        });
      }

      // Calculate averages from recent games
      const recentGames = gamesData.slice(0, 10);
      const avgPoints = recentGames.reduce((sum, g) => sum + (g.points || 0), 0) / recentGames.length;
      const avgRebounds = recentGames.reduce((sum, g) => sum + (g.rebounds || 0), 0) / recentGames.length;
      const avgAssists = recentGames.reduce((sum, g) => sum + (g.assists || 0), 0) / recentGames.length;
      const totalFGMade = recentGames.reduce((sum, g) => sum + (g.fgMade || 0), 0);
      const totalFGAttempted = recentGames.reduce((sum, g) => sum + (g.fgAttempted || 0), 0);
      const avgFgPct = totalFGAttempted > 0 ? (totalFGMade / totalFGAttempted) * 100 : 0;

      // Use AI to generate analysis
      let strengthsAnalysis = "Strong performer based on recent game data.";
      let areasToImprove = "Continue developing consistency.";
      let comparisonPlayer = null;
      let collegeFit = null;
      let confidenceScore = 70;

      try {
        const prompt = `Analyze this basketball player's performance and provide a brief projection:
        Player: ${player.name}, Position: ${player.position}
        Recent averages: ${avgPoints.toFixed(1)} PPG, ${avgRebounds.toFixed(1)} RPG, ${avgAssists.toFixed(1)} APG, ${avgFgPct.toFixed(1)}% FG
        Games analyzed: ${recentGames.length}
        
        Respond in JSON format with these fields:
        - strengths: Brief analysis of player strengths (1-2 sentences)
        - improvements: Areas to improve (1-2 sentences)
        - comparison: Name of a current or former player they play like (just the name)
        - collegeFit: Type of college program that would fit them (e.g., "Mid-major program with fast-paced offense")
        - confidence: A number 1-100 representing confidence in this projection`;

        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt,
        });

        const text = response.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          strengthsAnalysis = parsed.strengths || strengthsAnalysis;
          areasToImprove = parsed.improvements || areasToImprove;
          comparisonPlayer = parsed.comparison || null;
          collegeFit = parsed.collegeFit || null;
          confidenceScore = parsed.confidence || 70;
        }
      } catch (aiError) {
        console.error('AI projection generation error:', aiError);
        // Continue with default values if AI fails
      }

      // Calculate projected overall rating based on performance
      const projectedOverall = Math.min(99, Math.max(50, Math.round(
        50 + (avgPoints * 1.5) + (avgRebounds * 1.2) + (avgAssists * 1.3) + (avgFgPct * 0.3)
      )));
      const projectedPotential = Math.min(99, projectedOverall + 10 + Math.floor(Math.random() * 5));

      const validatedData = insertAiProjectionSchema.parse({
        playerId,
        projectionType,
        projectedOverall,
        projectedPotential,
        projectedPpg: avgPoints.toFixed(1),
        projectedRpg: avgRebounds.toFixed(1),
        projectedApg: avgAssists.toFixed(1),
        projectedFgPct: avgFgPct.toFixed(1),
        strengthsAnalysis,
        areasToImprove,
        comparisonPlayer,
        collegeFit,
        confidenceScore,
        dataPointsUsed: recentGames.length,
        modelVersion: 'gemini-2.0-flash',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive: true,
      });

      const projection = await storage.createAiProjection(validatedData);
      res.status(201).json(projection);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid projection data", errors: error.errors });
      }
      console.error('Error generating AI projection:', error);
      res.status(500).json({ message: "Failed to generate AI projection" });
    }
  });

  // =============================================
  // HIGHLIGHT VERIFICATIONS ROUTES
  // =============================================

  // GET /api/highlights/:id/verification - Get verification status
  app.get('/api/highlights/:id/verification', async (req, res) => {
    try {
      const highlightId = parseInt(req.params.id);
      if (isNaN(highlightId)) {
        return res.status(400).json({ message: "Invalid highlight ID" });
      }

      const verification = await storage.getHighlightVerification(highlightId);
      res.json(verification || { verificationStatus: 'pending' });
    } catch (error) {
      console.error('Error fetching highlight verification:', error);
      res.status(500).json({ message: "Failed to fetch highlight verification" });
    }
  });

  // POST /api/highlights/:id/verify - Run verification check
  app.post('/api/highlights/:id/verify', isAuthenticated, async (req: any, res) => {
    try {
      const highlightId = parseInt(req.params.id);
      if (isNaN(highlightId)) {
        return res.status(400).json({ message: "Invalid highlight ID" });
      }

      const highlight = await storage.getHighlightClip(highlightId);
      if (!highlight) {
        return res.status(404).json({ message: "Highlight not found" });
      }

      // Check if verification already exists
      const existingVerification = await storage.getHighlightVerification(highlightId);
      if (existingVerification && existingVerification.verificationStatus === 'verified') {
        return res.json({ 
          message: "Highlight already verified",
          verification: existingVerification 
        });
      }

      // Run verification checks (simplified version - real implementation would use AI)
      const duplicateCheckPassed = true; // Would check for duplicate clips
      const metadataConsistent = true; // Would verify metadata matches
      const aiConfidenceScore = 85; // Would use AI to analyze authenticity

      const verificationStatus = duplicateCheckPassed && metadataConsistent && aiConfidenceScore >= 70 
        ? 'verified' 
        : aiConfidenceScore >= 50 
          ? 'suspicious' 
          : 'pending';

      const validatedData = insertHighlightVerificationSchema.parse({
        highlightId,
        verificationStatus,
        duplicateCheckPassed,
        metadataConsistent,
        aiConfidenceScore,
      });

      let verification;
      if (existingVerification) {
        verification = await storage.updateHighlightVerification(existingVerification.id, validatedData);
      } else {
        verification = await storage.createHighlightVerification(validatedData);
      }

      res.json(verification);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid verification data", errors: error.errors });
      }
      console.error('Error verifying highlight:', error);
      res.status(500).json({ message: "Failed to verify highlight" });
    }
  });

  // =====================
  // LEAGUE ROUTES
  // =====================

  // GET /api/leagues - Get all public leagues (with optional sport filter)
  app.get("/api/leagues", async (req, res) => {
    try {
      const sport = req.query.sport as string | undefined;
      const leagues = await storage.getPublicLeagues(sport);
      res.json(leagues);
    } catch (error) {
      console.error('Error fetching leagues:', error);
      res.status(500).json({ message: "Failed to fetch leagues" });
    }
  });

  // POST /api/leagues/join - Join a league by join code
  app.post("/api/leagues/join", isAuthenticated, async (req: any, res) => {
    try {
      const { joinCode } = req.body;
      if (!joinCode || typeof joinCode !== 'string') {
        return res.status(400).json({ message: "Join code is required" });
      }

      const league = await storage.getLeagueByJoinCode(joinCode.trim());
      if (!league) {
        return res.status(404).json({ message: "League not found with that join code" });
      }

      res.json(league);
    } catch (error) {
      console.error('Error joining league:', error);
      res.status(500).json({ message: "Failed to join league" });
    }
  });

  // GET /api/leagues/:id - Get single league with teams
  app.get("/api/leagues/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid league ID" });
      }

      const league = await storage.getLeagueWithTeams(id);
      if (!league) {
        return res.status(404).json({ message: "League not found" });
      }

      res.json(league);
    } catch (error) {
      console.error('Error fetching league:', error);
      res.status(500).json({ message: "Failed to fetch league" });
    }
  });

  // POST /api/leagues - Create new league
  app.post("/api/leagues", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const validatedData = insertLeagueSchema.parse({
        ...req.body,
        createdByUserId: userId,
      });

      const league = await storage.createLeague(validatedData);
      res.status(201).json(league);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid league data", errors: error.errors });
      }
      console.error('Error creating league:', error);
      res.status(500).json({ message: "Failed to create league" });
    }
  });

  // PUT /api/leagues/:id - Update league (only if user is creator)
  app.put("/api/leagues/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid league ID" });
      }

      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const league = await storage.getLeague(id);
      if (!league) {
        return res.status(404).json({ message: "League not found" });
      }

      if (league.createdByUserId !== userId) {
        return res.status(403).json({ message: "Only the league creator can update this league" });
      }

      const updates = req.body;
      delete updates.id;
      delete updates.createdByUserId;
      delete updates.createdAt;

      const updated = await storage.updateLeague(id, updates);
      res.json(updated);
    } catch (error) {
      console.error('Error updating league:', error);
      res.status(500).json({ message: "Failed to update league" });
    }
  });

  // DELETE /api/leagues/:id - Delete league (only if user is creator)
  app.delete("/api/leagues/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid league ID" });
      }

      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const league = await storage.getLeague(id);
      if (!league) {
        return res.status(404).json({ message: "League not found" });
      }

      if (league.createdByUserId !== userId) {
        return res.status(403).json({ message: "Only the league creator can delete this league" });
      }

      await storage.deleteLeague(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting league:', error);
      res.status(500).json({ message: "Failed to delete league" });
    }
  });

  // POST /api/leagues/:id/teams - Create team in league
  app.post("/api/leagues/:id/teams", isAuthenticated, async (req: any, res) => {
    try {
      const leagueId = parseInt(req.params.id);
      if (isNaN(leagueId)) {
        return res.status(400).json({ message: "Invalid league ID" });
      }

      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const league = await storage.getLeague(leagueId);
      if (!league) {
        return res.status(404).json({ message: "League not found" });
      }

      const validatedData = insertLeagueTeamSchema.parse({
        ...req.body,
        leagueId,
        captainUserId: req.body.captainUserId || userId,
      });

      const team = await storage.createLeagueTeam(validatedData);
      res.status(201).json(team);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid team data", errors: error.errors });
      }
      console.error('Error creating team:', error);
      res.status(500).json({ message: "Failed to create team" });
    }
  });

  // PUT /api/leagues/:id/teams/:teamId - Update team (only if user is captain)
  app.put("/api/leagues/:id/teams/:teamId", isAuthenticated, async (req: any, res) => {
    try {
      const leagueId = parseInt(req.params.id);
      const teamId = parseInt(req.params.teamId);
      if (isNaN(leagueId) || isNaN(teamId)) {
        return res.status(400).json({ message: "Invalid league or team ID" });
      }

      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const team = await storage.getLeagueTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      if (team.leagueId !== leagueId) {
        return res.status(400).json({ message: "Team does not belong to this league" });
      }

      if (team.captainUserId !== userId) {
        return res.status(403).json({ message: "Only the team captain can update this team" });
      }

      const updates = req.body;
      delete updates.id;
      delete updates.leagueId;
      delete updates.createdAt;

      const updated = await storage.updateLeagueTeam(teamId, updates);
      res.json(updated);
    } catch (error) {
      console.error('Error updating team:', error);
      res.status(500).json({ message: "Failed to update team" });
    }
  });

  // DELETE /api/leagues/:id/teams/:teamId - Delete team
  app.delete("/api/leagues/:id/teams/:teamId", isAuthenticated, async (req: any, res) => {
    try {
      const leagueId = parseInt(req.params.id);
      const teamId = parseInt(req.params.teamId);
      if (isNaN(leagueId) || isNaN(teamId)) {
        return res.status(400).json({ message: "Invalid league or team ID" });
      }

      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const team = await storage.getLeagueTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      if (team.leagueId !== leagueId) {
        return res.status(400).json({ message: "Team does not belong to this league" });
      }

      const league = await storage.getLeague(leagueId);
      if (team.captainUserId !== userId && league?.createdByUserId !== userId) {
        return res.status(403).json({ message: "Only the team captain or league creator can delete this team" });
      }

      await storage.deleteLeagueTeam(teamId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting team:', error);
      res.status(500).json({ message: "Failed to delete team" });
    }
  });

  // GET /api/leagues/:id/teams/:teamId/roster - Get team roster with player details
  app.get("/api/leagues/:id/teams/:teamId/roster", async (req, res) => {
    try {
      const leagueId = parseInt(req.params.id);
      const teamId = parseInt(req.params.teamId);
      if (isNaN(leagueId) || isNaN(teamId)) {
        return res.status(400).json({ message: "Invalid league or team ID" });
      }

      const team = await storage.getLeagueTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      if (team.leagueId !== leagueId) {
        return res.status(400).json({ message: "Team does not belong to this league" });
      }

      const roster = await storage.getLeagueTeamRoster(teamId);
      
      // Fetch player details for each roster member
      const rosterWithPlayers = await Promise.all(
        roster.map(async (member) => {
          const player = await storage.getPlayer(member.playerId);
          return {
            ...member,
            player: player ? {
              id: player.id,
              name: player.name,
              position: player.position,
              photoUrl: player.photoUrl,
            } : null,
          };
        })
      );

      res.json(rosterWithPlayers);
    } catch (error) {
      console.error('Error fetching roster:', error);
      res.status(500).json({ message: "Failed to fetch roster" });
    }
  });

  // POST /api/leagues/:id/teams/:teamId/roster - Add player to team roster
  app.post("/api/leagues/:id/teams/:teamId/roster", isAuthenticated, async (req: any, res) => {
    try {
      const leagueId = parseInt(req.params.id);
      const teamId = parseInt(req.params.teamId);
      if (isNaN(leagueId) || isNaN(teamId)) {
        return res.status(400).json({ message: "Invalid league or team ID" });
      }

      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const team = await storage.getLeagueTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      if (team.leagueId !== leagueId) {
        return res.status(400).json({ message: "Team does not belong to this league" });
      }

      const validatedData = insertLeagueTeamRosterSchema.parse({
        ...req.body,
        leagueTeamId: teamId,
      });

      const roster = await storage.addPlayerToLeagueTeam(validatedData);
      res.status(201).json(roster);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid roster data", errors: error.errors });
      }
      console.error('Error adding player to roster:', error);
      res.status(500).json({ message: "Failed to add player to roster" });
    }
  });

  // DELETE /api/leagues/:id/teams/:teamId/roster/:playerId - Remove player from roster
  app.delete("/api/leagues/:id/teams/:teamId/roster/:playerId", isAuthenticated, async (req: any, res) => {
    try {
      const leagueId = parseInt(req.params.id);
      const teamId = parseInt(req.params.teamId);
      const playerId = parseInt(req.params.playerId);
      if (isNaN(leagueId) || isNaN(teamId) || isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid league, team, or player ID" });
      }

      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const team = await storage.getLeagueTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      if (team.leagueId !== leagueId) {
        return res.status(400).json({ message: "Team does not belong to this league" });
      }

      await storage.removePlayerFromLeagueTeam(teamId, playerId);
      res.status(204).send();
    } catch (error) {
      console.error('Error removing player from roster:', error);
      res.status(500).json({ message: "Failed to remove player from roster" });
    }
  });

  // GET /api/leagues/:id/games - Get league games
  app.get("/api/leagues/:id/games", async (req, res) => {
    try {
      const leagueId = parseInt(req.params.id);
      if (isNaN(leagueId)) {
        return res.status(400).json({ message: "Invalid league ID" });
      }

      const league = await storage.getLeague(leagueId);
      if (!league) {
        return res.status(404).json({ message: "League not found" });
      }

      const games = await storage.getLeagueGames(leagueId);
      res.json(games);
    } catch (error) {
      console.error('Error fetching league games:', error);
      res.status(500).json({ message: "Failed to fetch league games" });
    }
  });

  // POST /api/leagues/:id/games - Create/schedule a game
  app.post("/api/leagues/:id/games", isAuthenticated, async (req: any, res) => {
    try {
      const leagueId = parseInt(req.params.id);
      if (isNaN(leagueId)) {
        return res.status(400).json({ message: "Invalid league ID" });
      }

      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const league = await storage.getLeague(leagueId);
      if (!league) {
        return res.status(404).json({ message: "League not found" });
      }

      const validatedData = insertLeagueGameSchema.parse({
        ...req.body,
        leagueId,
      });

      const game = await storage.createLeagueGame(validatedData);
      res.status(201).json(game);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid game data", errors: error.errors });
      }
      console.error('Error creating league game:', error);
      res.status(500).json({ message: "Failed to create league game" });
    }
  });

  // PUT /api/leagues/:id/games/:gameId - Update game (score, status, etc.)
  app.put("/api/leagues/:id/games/:gameId", isAuthenticated, async (req: any, res) => {
    try {
      const leagueId = parseInt(req.params.id);
      const gameId = parseInt(req.params.gameId);
      if (isNaN(leagueId) || isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid league or game ID" });
      }

      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const game = await storage.getLeagueGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      if (game.leagueId !== leagueId) {
        return res.status(400).json({ message: "Game does not belong to this league" });
      }

      const updates = req.body;
      delete updates.id;
      delete updates.leagueId;
      delete updates.createdAt;

      const updated = await storage.updateLeagueGame(gameId, updates);
      res.json(updated);
    } catch (error) {
      console.error('Error updating league game:', error);
      res.status(500).json({ message: "Failed to update league game" });
    }
  });

  // PUT /api/leagues/:id/games/:gameId/finalize - Finalize game and update standings
  app.put("/api/leagues/:id/games/:gameId/finalize", isAuthenticated, async (req: any, res) => {
    try {
      const leagueId = parseInt(req.params.id);
      const gameId = parseInt(req.params.gameId);
      if (isNaN(leagueId) || isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid league or game ID" });
      }

      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const game = await storage.getLeagueGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      if (game.leagueId !== leagueId) {
        return res.status(400).json({ message: "Game does not belong to this league" });
      }

      if (game.status === "final") {
        return res.status(400).json({ message: "Game is already finalized" });
      }

      const { homeScore, awayScore } = req.body;
      if (typeof homeScore !== "number" || typeof awayScore !== "number") {
        return res.status(400).json({ message: "Valid scores are required to finalize" });
      }

      if (homeScore < 0 || awayScore < 0) {
        return res.status(400).json({ message: "Scores cannot be negative" });
      }

      const homeTeam = await storage.getLeagueTeam(game.homeTeamId);
      const awayTeam = await storage.getLeagueTeam(game.awayTeamId);

      if (!homeTeam || !awayTeam) {
        return res.status(404).json({ message: "Teams not found" });
      }

      const homeWins = homeScore > awayScore;
      const awayWins = awayScore > homeScore;
      const isTie = homeScore === awayScore;

      await storage.updateLeagueTeam(homeTeam.id, {
        wins: homeTeam.wins + (homeWins ? 1 : 0),
        losses: homeTeam.losses + (awayWins ? 1 : 0),
        ties: homeTeam.ties + (isTie ? 1 : 0),
        pointsFor: homeTeam.pointsFor + homeScore,
        pointsAgainst: homeTeam.pointsAgainst + awayScore,
      });

      await storage.updateLeagueTeam(awayTeam.id, {
        wins: awayTeam.wins + (awayWins ? 1 : 0),
        losses: awayTeam.losses + (homeWins ? 1 : 0),
        ties: awayTeam.ties + (isTie ? 1 : 0),
        pointsFor: awayTeam.pointsFor + awayScore,
        pointsAgainst: awayTeam.pointsAgainst + homeScore,
      });

      const updatedGame = await storage.updateLeagueGame(gameId, {
        homeScore,
        awayScore,
        status: "final",
        quarter: null,
        gameTime: null,
      });

      res.json(updatedGame);
    } catch (error) {
      console.error('Error finalizing league game:', error);
      res.status(500).json({ message: "Failed to finalize league game" });
    }
  });

  // === LEAGUE PLAYOFFS API ===

  // POST /api/leagues/:id/start-playoffs - Start playoffs and create bracket games
  app.post("/api/leagues/:id/start-playoffs", isAuthenticated, async (req: any, res) => {
    try {
      const leagueId = parseInt(req.params.id);
      if (isNaN(leagueId)) {
        return res.status(400).json({ message: "Invalid league ID" });
      }

      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const league = await storage.getLeague(leagueId);
      if (!league) {
        return res.status(404).json({ message: "League not found" });
      }

      if (league.createdByUserId !== userId) {
        return res.status(403).json({ message: "Only the league creator can start playoffs" });
      }

      const teams = await storage.getLeagueTeams(leagueId);
      if (teams.length < 4) {
        return res.status(400).json({ message: "Need at least 4 teams to start playoffs" });
      }

      // Check if playoffs already started
      const existingGames = await storage.getLeagueGames(leagueId);
      const playoffGames = existingGames.filter(g => g.isPlayoff);
      if (playoffGames.length > 0) {
        return res.status(400).json({ message: "Playoffs have already been started" });
      }

      // Sort teams by standings (wins, then point differential)
      const sortedTeams = [...teams].sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (a.losses !== b.losses) return a.losses - b.losses;
        return (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst);
      });

      // Determine bracket size based on team count (4, 8)
      let bracketSize = 4;
      if (sortedTeams.length >= 8) bracketSize = 8;
      
      // Take top teams for playoff bracket
      const playoffTeams = sortedTeams.slice(0, bracketSize);

      // Assign playoff seeds and update teams
      for (let i = 0; i < playoffTeams.length; i++) {
        await storage.updateLeagueTeam(playoffTeams[i].id, { playoffSeed: i + 1 });
      }

      const createdGames: any[] = [];

      if (bracketSize === 8) {
        // Quarterfinals: 1v8, 4v5, 3v6, 2v7
        const qfMatchups = [
          { home: 0, away: 7 }, // 1 vs 8
          { home: 3, away: 4 }, // 4 vs 5
          { home: 2, away: 5 }, // 3 vs 6
          { home: 1, away: 6 }, // 2 vs 7
        ];

        for (const matchup of qfMatchups) {
          const game = await storage.createLeagueGame({
            leagueId,
            homeTeamId: playoffTeams[matchup.home].id,
            awayTeamId: playoffTeams[matchup.away].id,
            isPlayoff: true,
            playoffRound: "quarterfinals",
            status: "scheduled",
          });
          createdGames.push(game);
        }

        // Create placeholder semifinal games
        const sf1 = await storage.createLeagueGame({
          leagueId,
          homeTeamId: playoffTeams[0].id, // Placeholder - will be updated
          awayTeamId: playoffTeams[0].id, // Placeholder - will be updated
          isPlayoff: true,
          playoffRound: "semifinals",
          status: "scheduled",
        });
        const sf2 = await storage.createLeagueGame({
          leagueId,
          homeTeamId: playoffTeams[0].id, // Placeholder
          awayTeamId: playoffTeams[0].id, // Placeholder
          isPlayoff: true,
          playoffRound: "semifinals",
          status: "scheduled",
        });
        createdGames.push(sf1, sf2);

        // Create placeholder championship game
        const championship = await storage.createLeagueGame({
          leagueId,
          homeTeamId: playoffTeams[0].id, // Placeholder
          awayTeamId: playoffTeams[0].id, // Placeholder
          isPlayoff: true,
          playoffRound: "championship",
          status: "scheduled",
        });
        createdGames.push(championship);
      } else {
        // 4-team bracket: Semifinals only
        // Semifinal 1: 1 vs 4
        const sf1 = await storage.createLeagueGame({
          leagueId,
          homeTeamId: playoffTeams[0].id,
          awayTeamId: playoffTeams[3].id,
          isPlayoff: true,
          playoffRound: "semifinals",
          status: "scheduled",
        });
        // Semifinal 2: 2 vs 3
        const sf2 = await storage.createLeagueGame({
          leagueId,
          homeTeamId: playoffTeams[1].id,
          awayTeamId: playoffTeams[2].id,
          isPlayoff: true,
          playoffRound: "semifinals",
          status: "scheduled",
        });
        createdGames.push(sf1, sf2);

        // Championship placeholder
        const championship = await storage.createLeagueGame({
          leagueId,
          homeTeamId: playoffTeams[0].id, // Placeholder
          awayTeamId: playoffTeams[0].id, // Placeholder
          isPlayoff: true,
          playoffRound: "championship",
          status: "scheduled",
        });
        createdGames.push(championship);
      }

      res.status(201).json({ 
        message: "Playoffs started successfully",
        bracketSize,
        games: createdGames 
      });
    } catch (error) {
      console.error('Error starting playoffs:', error);
      res.status(500).json({ message: "Failed to start playoffs" });
    }
  });

  // === LEAGUE RIVALRIES API ===

  // GET /api/leagues/:id/rivalries - Get all rivalries in a league
  app.get("/api/leagues/:id/rivalries", async (req, res) => {
    try {
      const leagueId = parseInt(req.params.id);
      if (isNaN(leagueId)) {
        return res.status(400).json({ message: "Invalid league ID" });
      }

      const league = await storage.getLeague(leagueId);
      if (!league) {
        return res.status(404).json({ message: "League not found" });
      }

      const rivalries = await storage.getLeagueRivalries(leagueId);
      res.json(rivalries);
    } catch (error) {
      console.error('Error fetching league rivalries:', error);
      res.status(500).json({ message: "Failed to fetch league rivalries" });
    }
  });

  // POST /api/leagues/:id/rivalries - Create a rivalry between two teams
  app.post("/api/leagues/:id/rivalries", isAuthenticated, async (req: any, res) => {
    try {
      const leagueId = parseInt(req.params.id);
      if (isNaN(leagueId)) {
        return res.status(400).json({ message: "Invalid league ID" });
      }

      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const league = await storage.getLeague(leagueId);
      if (!league) {
        return res.status(404).json({ message: "League not found" });
      }

      const { team1Id, team2Id, rivalryName } = req.body;

      if (!team1Id || !team2Id) {
        return res.status(400).json({ message: "Both team1Id and team2Id are required" });
      }

      if (team1Id === team2Id) {
        return res.status(400).json({ message: "A team cannot be rivals with itself" });
      }

      // Check if rivalry already exists between these teams
      const existingRivalry = await storage.getRivalryBetweenTeams(team1Id, team2Id);
      if (existingRivalry) {
        return res.status(400).json({ message: "A rivalry already exists between these teams" });
      }

      // Verify both teams belong to this league
      const team1 = await storage.getLeagueTeam(team1Id);
      const team2 = await storage.getLeagueTeam(team2Id);

      if (!team1 || team1.leagueId !== leagueId) {
        return res.status(400).json({ message: "Team 1 not found in this league" });
      }
      if (!team2 || team2.leagueId !== leagueId) {
        return res.status(400).json({ message: "Team 2 not found in this league" });
      }

      const validatedData = insertLeagueRivalrySchema.parse({
        leagueId,
        team1Id,
        team2Id,
        rivalryName: rivalryName || null,
      });

      const rivalry = await storage.createLeagueRivalry(validatedData);
      res.status(201).json(rivalry);
    } catch (error) {
      console.error('Error creating league rivalry:', error);
      res.status(500).json({ message: "Failed to create league rivalry" });
    }
  });

  // PUT /api/leagues/:id/rivalries/:rivalryId - Update rivalry (name, record)
  app.put("/api/leagues/:id/rivalries/:rivalryId", isAuthenticated, async (req: any, res) => {
    try {
      const leagueId = parseInt(req.params.id);
      const rivalryId = parseInt(req.params.rivalryId);
      if (isNaN(leagueId) || isNaN(rivalryId)) {
        return res.status(400).json({ message: "Invalid league or rivalry ID" });
      }

      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const rivalry = await storage.getLeagueRivalry(rivalryId);
      if (!rivalry) {
        return res.status(404).json({ message: "Rivalry not found" });
      }

      if (rivalry.leagueId !== leagueId) {
        return res.status(400).json({ message: "Rivalry does not belong to this league" });
      }

      const { rivalryName, team1Wins, team2Wins, ties, currentStreakTeamId, currentStreakCount } = req.body;

      const updates: Record<string, any> = {};
      if (rivalryName !== undefined) updates.rivalryName = rivalryName;
      if (team1Wins !== undefined) updates.team1Wins = team1Wins;
      if (team2Wins !== undefined) updates.team2Wins = team2Wins;
      if (ties !== undefined) updates.ties = ties;
      if (currentStreakTeamId !== undefined) updates.currentStreakTeamId = currentStreakTeamId;
      if (currentStreakCount !== undefined) updates.currentStreakCount = currentStreakCount;

      const updatedRivalry = await storage.updateLeagueRivalry(rivalryId, updates);
      res.json(updatedRivalry);
    } catch (error) {
      console.error('Error updating league rivalry:', error);
      res.status(500).json({ message: "Failed to update league rivalry" });
    }
  });

  // DELETE /api/leagues/:id/rivalries/:rivalryId - Delete a rivalry
  app.delete("/api/leagues/:id/rivalries/:rivalryId", isAuthenticated, async (req: any, res) => {
    try {
      const leagueId = parseInt(req.params.id);
      const rivalryId = parseInt(req.params.rivalryId);
      if (isNaN(leagueId) || isNaN(rivalryId)) {
        return res.status(400).json({ message: "Invalid league or rivalry ID" });
      }

      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const rivalry = await storage.getLeagueRivalry(rivalryId);
      if (!rivalry) {
        return res.status(404).json({ message: "Rivalry not found" });
      }

      if (rivalry.leagueId !== leagueId) {
        return res.status(400).json({ message: "Rivalry does not belong to this league" });
      }

      await storage.deleteLeagueRivalry(rivalryId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting league rivalry:', error);
      res.status(500).json({ message: "Failed to delete league rivalry" });
    }
  });

  // POST /api/leagues/:id/rivalries/:rivalryId/update-record - Update rivalry record after a game
  app.post("/api/leagues/:id/rivalries/:rivalryId/update-record", isAuthenticated, async (req: any, res) => {
    try {
      const leagueId = parseInt(req.params.id);
      const rivalryId = parseInt(req.params.rivalryId);
      if (isNaN(leagueId) || isNaN(rivalryId)) {
        return res.status(400).json({ message: "Invalid league or rivalry ID" });
      }

      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const rivalry = await storage.getLeagueRivalry(rivalryId);
      if (!rivalry) {
        return res.status(404).json({ message: "Rivalry not found" });
      }

      if (rivalry.leagueId !== leagueId) {
        return res.status(400).json({ message: "Rivalry does not belong to this league" });
      }

      const { winningTeamId, isTie } = req.body;

      if (!isTie && !winningTeamId) {
        return res.status(400).json({ message: "winningTeamId is required unless isTie is true" });
      }

      // Validate winning team is part of this rivalry
      if (winningTeamId && winningTeamId !== rivalry.team1Id && winningTeamId !== rivalry.team2Id) {
        return res.status(400).json({ message: "Winning team must be part of this rivalry" });
      }

      const updates: Record<string, any> = {};

      if (isTie) {
        updates.ties = rivalry.ties + 1;
        updates.currentStreakTeamId = null;
        updates.currentStreakCount = 0;
      } else if (winningTeamId === rivalry.team1Id) {
        updates.team1Wins = rivalry.team1Wins + 1;
        // Update streak
        if (rivalry.currentStreakTeamId === rivalry.team1Id) {
          updates.currentStreakCount = (rivalry.currentStreakCount || 0) + 1;
        } else {
          updates.currentStreakTeamId = rivalry.team1Id;
          updates.currentStreakCount = 1;
        }
      } else if (winningTeamId === rivalry.team2Id) {
        updates.team2Wins = rivalry.team2Wins + 1;
        // Update streak
        if (rivalry.currentStreakTeamId === rivalry.team2Id) {
          updates.currentStreakCount = (rivalry.currentStreakCount || 0) + 1;
        } else {
          updates.currentStreakTeamId = rivalry.team2Id;
          updates.currentStreakCount = 1;
        }
      }

      const updatedRivalry = await storage.updateLeagueRivalry(rivalryId, updates);
      res.json(updatedRivalry);
    } catch (error) {
      console.error('Error updating rivalry record:', error);
      res.status(500).json({ message: "Failed to update rivalry record" });
    }
  });

  // === COLLEGES API ===
  
  // GET /api/colleges - Get all colleges with optional filters
  app.get("/api/colleges", async (req, res) => {
    try {
      const { sport, division, state } = req.query;
      const filters: { sport?: string; division?: string; state?: string } = {};
      
      if (typeof sport === 'string') filters.sport = sport;
      if (typeof division === 'string') filters.division = division;
      if (typeof state === 'string') filters.state = state;
      
      const colleges = await storage.getColleges(Object.keys(filters).length > 0 ? filters : undefined);
      res.json(colleges);
    } catch (error) {
      console.error('Error getting colleges:', error);
      res.status(500).json({ message: "Failed to get colleges" });
    }
  });

  // GET /api/colleges/:id - Get single college
  app.get("/api/colleges/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid college ID" });
      }
      
      const college = await storage.getCollege(id);
      if (!college) {
        return res.status(404).json({ message: "College not found" });
      }
      
      res.json(college);
    } catch (error) {
      console.error('Error getting college:', error);
      res.status(500).json({ message: "Failed to get college" });
    }
  });

  // GET /api/colleges/:id/roster - Get college roster
  app.get("/api/colleges/:id/roster", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid college ID" });

      const roster = await db.select().from(collegeRosterPlayers)
        .where(eq(collegeRosterPlayers.collegeId, id))
        .orderBy(collegeRosterPlayers.position, collegeRosterPlayers.name);
      res.json(roster);
    } catch (error) {
      console.error('Error getting college roster:', error);
      res.status(500).json({ message: "Failed to get roster" });
    }
  });

  // GET /api/colleges/:id/staff - Get college coaching staff
  app.get("/api/colleges/:id/staff", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid college ID" });

      const staff = await db.select().from(collegeCoachingStaff)
        .where(eq(collegeCoachingStaff.collegeId, id));
      res.json(staff);
    } catch (error) {
      console.error('Error getting coaching staff:', error);
      res.status(500).json({ message: "Failed to get coaching staff" });
    }
  });

  // POST /api/colleges/sync-rosters - Sync rosters from ESPN (admin only)
  app.post("/api/colleges/sync-rosters", isAdmin, async (req, res) => {
    try {
      const { syncRosterData } = await import('./services/sportsDataApi');
      const result = await syncRosterData();
      res.json({
        message: "Roster sync completed",
        ...result,
        syncedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error syncing rosters:', error);
      res.status(500).json({ message: "Failed to sync rosters" });
    }
  });

  // PATCH /api/colleges/:id/recruiting-needs - Update recruiting needs for a college (Coach/Admin only)
  app.patch("/api/colleges/:id/recruiting-needs", isAuthenticated as any, async (req: any, res) => {
    try {
      const userRole = req.user?.role;
      if (userRole !== "coach" && userRole !== "admin") {
        return res.status(403).json({ message: "Only coaches and admins can update recruiting needs" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid college ID" });

      const { positionNeeds, scholarshipsAvailable } = req.body;

      if (positionNeeds !== undefined && positionNeeds !== null) {
        if (!Array.isArray(positionNeeds) || !positionNeeds.every((p: unknown) => typeof p === "string")) {
          return res.status(400).json({ message: "positionNeeds must be an array of strings" });
        }
      }
      if (scholarshipsAvailable !== undefined && scholarshipsAvailable !== null) {
        if (typeof scholarshipsAvailable !== "number" || scholarshipsAvailable < 0) {
          return res.status(400).json({ message: "scholarshipsAvailable must be a non-negative number" });
        }
      }

      await db.update(colleges).set({
        positionNeeds: positionNeeds ? JSON.stringify(positionNeeds) : null,
        scholarshipsAvailable: scholarshipsAvailable ?? null,
        updatedAt: new Date(),
      }).where(eq(colleges.id, id));

      const updated = await db.select().from(colleges).where(eq(colleges.id, id));
      res.json(updated[0]);
    } catch (error) {
      console.error('Error updating recruiting needs:', error);
      res.status(500).json({ message: "Failed to update recruiting needs" });
    }
  });

  // POST /api/colleges/sync-stats - Sync college stats from external APIs
  app.post("/api/colleges/sync-stats", async (req, res) => {
    try {
      const { syncAllCollegeStats } = await import('./services/sportsDataApi');
      
      const result = await syncAllCollegeStats();
      
      res.json({
        message: "Stats sync completed",
        football: result.football,
        basketball: result.basketball,
        syncedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error syncing college stats:', error);
      res.status(500).json({ message: "Failed to sync college stats" });
    }
  });

  // POST /api/colleges/sync-espn - Sync live stats from ESPN public API (admin only)
  app.post("/api/colleges/sync-espn", isAdmin, async (req, res) => {
    try {
      const { autoMapEspnTeamIds, syncAllCollegeStatsFromESPN } = await import('./services/sportsDataApi');
      
      const mapResult = await autoMapEspnTeamIds();
      const syncResult = await syncAllCollegeStatsFromESPN();
      
      res.json({
        message: "ESPN live sync completed",
        mapping: mapResult,
        sync: syncResult,
        syncedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error syncing ESPN stats:', error);
      res.status(500).json({ message: "Failed to sync ESPN stats" });
    }
  });

  // GET /api/players/:id/college-matches - Get player's college matches with college details
  app.get("/api/players/:id/college-matches", async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }
      
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      const matches = await storage.getPlayerCollegeMatches(playerId);
      res.json(matches);
    } catch (error) {
      console.error('Error getting player college matches:', error);
      res.status(500).json({ message: "Failed to get college matches" });
    }
  });

  // POST /api/players/:id/college-matches/generate - Generate AI college matches for player
  app.post("/api/players/:id/college-matches/generate", async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }
      
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      // Delete existing matches for fresh generation
      await storage.deletePlayerCollegeMatches(playerId);

      // Get all colleges for the player's sport
      const colleges = await storage.getColleges({ sport: player.sport });
      if (colleges.length === 0) {
        return res.json({ matches: [], message: "No colleges found for this sport" });
      }

      // Calculate match scores based on player profile
      const generatedMatches: Array<{ match: any; college: College }> = [];

      for (const college of colleges) {
        // Calculate different match components
        const academicMatch = calculateAcademicMatch(player, college);
        const skillMatch = calculateSkillMatch(player, college);
        const styleMatch = calculateStyleMatch(player, college);
        const locationMatch = calculateLocationMatch(player, college);
        
        // Overall weighted score
        const overallScore = Math.round(
          (skillMatch * 0.4) + (academicMatch * 0.25) + (styleMatch * 0.2) + (locationMatch * 0.15)
        );

        // Only include matches with score >= 50
        if (overallScore >= 50) {
          const matchData = {
            playerId,
            collegeId: college.id,
            overallMatchScore: overallScore,
            skillMatchScore: skillMatch,
            academicMatchScore: academicMatch,
            styleMatchScore: styleMatch,
            locationMatchScore: locationMatch,
            matchReasoning: generateMatchReasoning(player, college, overallScore),
            strengthsForProgram: generateStrengths(player, college),
            developmentAreas: generateDevelopmentAreas(player),
            isRecommended: overallScore >= 75,
            isSaved: false,
          };

          const match = await storage.createPlayerCollegeMatch(matchData);
          generatedMatches.push({ match, college });
        }
      }

      // Sort by overall score and return top matches
      generatedMatches.sort((a, b) => b.match.overallMatchScore - a.match.overallMatchScore);
      
      res.json({
        matches: generatedMatches.slice(0, 20).map(m => ({ ...m.match, college: m.college })),
        totalGenerated: generatedMatches.length,
      });
    } catch (error) {
      console.error('Error generating college matches:', error);
      res.status(500).json({ message: "Failed to generate college matches" });
    }
  });

  // PATCH /api/college-matches/:id/toggle-save - Toggle save status on a college match
  app.patch("/api/college-matches/:id/toggle-save", async (req, res) => {
    try {
      const matchId = parseInt(req.params.id);
      if (isNaN(matchId)) {
        return res.status(400).json({ message: "Invalid match ID" });
      }

      // Get current match to toggle the saved status
      const allMatches = await db.select().from(playerCollegeMatches).where(eq(playerCollegeMatches.id, matchId));
      const match = allMatches[0];
      
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }

      const updated = await storage.updatePlayerCollegeMatch(matchId, { 
        isSaved: !match.isSaved 
      });

      res.json(updated);
    } catch (error) {
      console.error('Error toggling save status:', error);
      res.status(500).json({ message: "Failed to toggle save status" });
    }
  });

  // ============ PLAYER COLLEGE INTERESTS ROUTES ============

  // GET /api/players/:id/interests - Get player's college interests
  app.get("/api/players/:id/interests", async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }

      const interests = await db.select()
        .from(playerCollegeInterests)
        .where(eq(playerCollegeInterests.playerId, playerId))
        .orderBy(playerCollegeInterests.createdAt);

      // Get college details for each interest
      const interestsWithColleges = await Promise.all(
        interests.map(async (interest) => {
          const college = await storage.getCollege(interest.collegeId);
          return { ...interest, college };
        })
      );

      res.json(interestsWithColleges);
    } catch (error) {
      console.error('Error getting player interests:', error);
      res.status(500).json({ message: "Failed to get player interests" });
    }
  });

  // POST /api/players/:id/interests - Express interest in a college
  app.post("/api/players/:id/interests", async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }

      const { collegeId, interestLevel, notes } = req.body;
      if (!collegeId) {
        return res.status(400).json({ message: "College ID is required" });
      }

      // Check if interest already exists
      const existing = await db.select()
        .from(playerCollegeInterests)
        .where(and(
          eq(playerCollegeInterests.playerId, playerId),
          eq(playerCollegeInterests.collegeId, collegeId)
        ));

      if (existing.length > 0) {
        return res.status(400).json({ message: "Interest already exists for this college" });
      }

      const [interest] = await db.insert(playerCollegeInterests)
        .values({
          playerId,
          collegeId,
          interestLevel: interestLevel || 'interested',
          notes: notes || null,
        })
        .returning();

      const college = await storage.getCollege(collegeId);
      res.status(201).json({ ...interest, college });
    } catch (error) {
      console.error('Error creating interest:', error);
      res.status(500).json({ message: "Failed to express interest" });
    }
  });

  // DELETE /api/players/:id/interests/:collegeId - Remove interest in a college
  app.delete("/api/players/:id/interests/:collegeId", async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const collegeId = parseInt(req.params.collegeId);
      
      if (isNaN(playerId) || isNaN(collegeId)) {
        return res.status(400).json({ message: "Invalid IDs" });
      }

      await db.delete(playerCollegeInterests)
        .where(and(
          eq(playerCollegeInterests.playerId, playerId),
          eq(playerCollegeInterests.collegeId, collegeId)
        ));

      res.json({ message: "Interest removed" });
    } catch (error) {
      console.error('Error removing interest:', error);
      res.status(500).json({ message: "Failed to remove interest" });
    }
  });

  // PATCH /api/players/:id/interests/:collegeId - Update interest (mark as contacted, etc.)
  app.patch("/api/players/:id/interests/:collegeId", async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const collegeId = parseInt(req.params.collegeId);
      
      if (isNaN(playerId) || isNaN(collegeId)) {
        return res.status(400).json({ message: "Invalid IDs" });
      }

      const { interestLevel, notes, contacted } = req.body;
      const updates: any = {};
      
      if (interestLevel) updates.interestLevel = interestLevel;
      if (notes !== undefined) updates.notes = notes;
      if (contacted !== undefined) {
        updates.contacted = contacted;
        if (contacted) updates.contactedAt = new Date();
      }

      const [updated] = await db.update(playerCollegeInterests)
        .set(updates)
        .where(and(
          eq(playerCollegeInterests.playerId, playerId),
          eq(playerCollegeInterests.collegeId, collegeId)
        ))
        .returning();

      if (!updated) {
        return res.status(404).json({ message: "Interest not found" });
      }

      const college = await storage.getCollege(collegeId);
      res.json({ ...updated, college });
    } catch (error) {
      console.error('Error updating interest:', error);
      res.status(500).json({ message: "Failed to update interest" });
    }
  });

  // ============ FITNESS DATA ROUTES (Wearable Integrations) ============

  // GET /api/players/:id/fitness - Get player's fitness data
  app.get("/api/players/:id/fitness", isAuthenticated, async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }

      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      const { startDate, endDate, source } = req.query;
      const options: { startDate?: string; endDate?: string; source?: string } = {};
      
      if (typeof startDate === 'string') options.startDate = startDate;
      if (typeof endDate === 'string') options.endDate = endDate;
      if (typeof source === 'string') options.source = source;

      const fitnessData = await storage.getFitnessData(playerId, options);
      res.json(fitnessData);
    } catch (error) {
      console.error('Error getting fitness data:', error);
      res.status(500).json({ message: "Failed to get fitness data" });
    }
  });

  // GET /api/players/:id/fitness/latest - Get most recent fitness entry
  app.get("/api/players/:id/fitness/latest", isAuthenticated, async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }

      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      const latestData = await storage.getLatestFitnessData(playerId);
      if (!latestData) {
        return res.status(404).json({ message: "No fitness data found" });
      }

      res.json(latestData);
    } catch (error) {
      console.error('Error getting latest fitness data:', error);
      res.status(500).json({ message: "Failed to get latest fitness data" });
    }
  });

  // GET /api/players/:id/fitness/summary - Get fitness summary for last N days
  app.get("/api/players/:id/fitness/summary", isAuthenticated, async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }

      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      const days = parseInt(req.query.days as string) || 7;
      const summary = await storage.getFitnessDataSummary(playerId, days);
      res.json(summary);
    } catch (error) {
      console.error('Error getting fitness summary:', error);
      res.status(500).json({ message: "Failed to get fitness summary" });
    }
  });

  // POST /api/players/:id/fitness - Create new fitness data entry (manual entry)
  app.post("/api/players/:id/fitness", isAuthenticated, async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }

      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      const validatedData = insertFitnessDataSchema.parse({
        ...req.body,
        playerId
      });

      const createdData = await storage.createFitnessData(validatedData);
      res.status(201).json(createdData);
    } catch (error) {
      console.error('Error creating fitness data:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid fitness data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create fitness data" });
    }
  });

  // PUT /api/players/:id/fitness/:dataId - Update fitness data entry
  app.put("/api/players/:id/fitness/:dataId", isAuthenticated, async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const dataId = parseInt(req.params.dataId);
      
      if (isNaN(playerId) || isNaN(dataId)) {
        return res.status(400).json({ message: "Invalid player ID or data ID" });
      }

      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      const updatedData = await storage.updateFitnessData(dataId, req.body);
      if (!updatedData) {
        return res.status(404).json({ message: "Fitness data not found" });
      }

      res.json(updatedData);
    } catch (error) {
      console.error('Error updating fitness data:', error);
      res.status(500).json({ message: "Failed to update fitness data" });
    }
  });

  // DELETE /api/players/:id/fitness/:dataId - Delete fitness data entry
  app.delete("/api/players/:id/fitness/:dataId", isAuthenticated, async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const dataId = parseInt(req.params.dataId);
      
      if (isNaN(playerId) || isNaN(dataId)) {
        return res.status(400).json({ message: "Invalid player ID or data ID" });
      }

      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      await storage.deleteFitnessData(dataId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting fitness data:', error);
      res.status(500).json({ message: "Failed to delete fitness data" });
    }
  });

  // POST /api/players/:id/fitness/sync - Endpoint for syncing wearable data (bulk)
  app.post("/api/players/:id/fitness/sync", isAuthenticated, async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }

      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      const { entries } = req.body;
      if (!Array.isArray(entries)) {
        return res.status(400).json({ message: "Expected 'entries' array in request body" });
      }

      const results: { created: FitnessData[]; updated: FitnessData[]; errors: string[] } = {
        created: [],
        updated: [],
        errors: []
      };

      for (const entry of entries) {
        try {
          const validatedData = insertFitnessDataSchema.parse({
            ...entry,
            playerId,
            syncedAt: new Date()
          });

          // Check if data exists for this date and source
          const existingData = await storage.getFitnessDataByDate(playerId, validatedData.date);
          
          if (existingData && existingData.source === validatedData.source) {
            // Update existing entry
            const updated = await storage.updateFitnessData(existingData.id, validatedData);
            if (updated) results.updated.push(updated);
          } else {
            // Create new entry
            const created = await storage.createFitnessData(validatedData);
            results.created.push(created);
          }
        } catch (entryError) {
          results.errors.push(`Error processing entry for date ${entry.date}: ${entryError}`);
        }
      }

      res.json({
        message: "Sync completed",
        created: results.created.length,
        updated: results.updated.length,
        errors: results.errors.length,
        details: results
      });
    } catch (error) {
      console.error('Error syncing fitness data:', error);
      res.status(500).json({ message: "Failed to sync fitness data" });
    }
  });

  // === FITBIT WEARABLE INTEGRATION ROUTES ===

  // Helper function to generate PKCE code verifier
  function generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  // Helper function to generate PKCE code challenge from verifier
  function generateCodeChallenge(verifier: string): string {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
  }

  // Check if Fitbit is configured
  function isFitbitConfigured(): boolean {
    return !!(process.env.FITBIT_CLIENT_ID && process.env.FITBIT_CLIENT_SECRET);
  }

  // GET /api/wearables/fitbit/connect - Initiate Fitbit OAuth flow
  app.get("/api/wearables/fitbit/connect", isAuthenticated, async (req: any, res) => {
    try {
      if (!isFitbitConfigured()) {
        return res.status(503).json({ 
          message: "Fitbit integration is not configured. Please set FITBIT_CLIENT_ID and FITBIT_CLIENT_SECRET environment variables." 
        });
      }

      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get the player ID for the user
      const user = await authStorage.getUser(userId);
      if (!user || !user.playerId) {
        return res.status(400).json({ message: "No player profile linked to this account" });
      }

      // Generate PKCE code verifier and challenge
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = generateCodeChallenge(codeVerifier);

      // Store code verifier in session
      req.session.fitbitCodeVerifier = codeVerifier;
      req.session.fitbitPlayerId = user.playerId;

      // Build Fitbit authorization URL
      const clientId = process.env.FITBIT_CLIENT_ID;
      const redirectUri = `${req.protocol}://${req.get('host')}/api/wearables/fitbit/callback`;
      const scope = 'activity heartrate sleep profile';
      
      const authUrl = new URL('https://www.fitbit.com/oauth2/authorize');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', clientId!);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', scope);
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');

      res.redirect(authUrl.toString());
    } catch (error) {
      console.error('Error initiating Fitbit OAuth:', error);
      res.status(500).json({ message: "Failed to initiate Fitbit connection" });
    }
  });

  // GET /api/wearables/fitbit/callback - Handle Fitbit OAuth callback
  app.get("/api/wearables/fitbit/callback", async (req: any, res) => {
    try {
      if (!isFitbitConfigured()) {
        return res.status(503).json({ 
          message: "Fitbit integration is not configured" 
        });
      }

      const { code, error } = req.query;

      if (error) {
        console.error('Fitbit OAuth error:', error);
        return res.redirect('/?fitbit_error=' + encodeURIComponent(String(error)));
      }

      if (!code) {
        return res.status(400).json({ message: "No authorization code received" });
      }

      const codeVerifier = req.session.fitbitCodeVerifier;
      const playerId = req.session.fitbitPlayerId;

      if (!codeVerifier || !playerId) {
        return res.status(400).json({ message: "Invalid session state - please try connecting again" });
      }

      // Exchange code for tokens
      const clientId = process.env.FITBIT_CLIENT_ID!;
      const clientSecret = process.env.FITBIT_CLIENT_SECRET!;
      const redirectUri = `${req.protocol}://${req.get('host')}/api/wearables/fitbit/callback`;

      const tokenResponse = await fetch('https://api.fitbit.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: String(code),
          redirect_uri: redirectUri,
          code_verifier: codeVerifier
        }).toString()
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error('Fitbit token exchange failed:', errorData);
        return res.redirect('/?fitbit_error=token_exchange_failed');
      }

      const tokenData = await tokenResponse.json() as {
        access_token: string;
        refresh_token: string;
        expires_in: number;
        token_type: string;
        user_id: string;
      };

      // Calculate token expiration time
      const tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

      // Check if connection already exists
      const existingConnection = await storage.getWearableConnectionByPlayerAndProvider(playerId, 'fitbit');

      if (existingConnection) {
        // Update existing connection
        await storage.updateWearableConnection(existingConnection.id, {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiresAt,
          isActive: true
        });
      } else {
        // Create new connection
        await storage.createWearableConnection({
          playerId,
          provider: 'fitbit',
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiresAt,
          isActive: true
        });
      }

      // Clear session data
      delete req.session.fitbitCodeVerifier;
      delete req.session.fitbitPlayerId;

      // Redirect to success page
      res.redirect('/fitness?connected=fitbit');
    } catch (error) {
      console.error('Error in Fitbit callback:', error);
      res.redirect('/?fitbit_error=callback_failed');
    }
  });

  // POST /api/wearables/fitbit/sync - Sync data from Fitbit
  app.post("/api/wearables/fitbit/sync", isAuthenticated, async (req: any, res) => {
    try {
      if (!isFitbitConfigured()) {
        return res.status(503).json({ 
          message: "Fitbit integration is not configured" 
        });
      }

      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await authStorage.getUser(userId);
      if (!user || !user.playerId) {
        return res.status(400).json({ message: "No player profile linked to this account" });
      }

      // Get the Fitbit connection
      const connection = await storage.getWearableConnectionByPlayerAndProvider(user.playerId, 'fitbit');
      if (!connection || !connection.isActive) {
        return res.status(400).json({ message: "Fitbit is not connected. Please connect first." });
      }

      // Check if token needs refresh
      let accessToken = connection.accessToken;
      if (connection.tokenExpiresAt && new Date(connection.tokenExpiresAt) < new Date()) {
        // Token expired, try to refresh
        if (!connection.refreshToken) {
          return res.status(400).json({ message: "Token expired. Please reconnect Fitbit." });
        }

        const clientId = process.env.FITBIT_CLIENT_ID!;
        const clientSecret = process.env.FITBIT_CLIENT_SECRET!;

        const refreshResponse = await fetch('https://api.fitbit.com/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: connection.refreshToken
          }).toString()
        });

        if (!refreshResponse.ok) {
          await storage.updateWearableConnection(connection.id, { isActive: false });
          return res.status(400).json({ message: "Failed to refresh token. Please reconnect Fitbit." });
        }

        const refreshData = await refreshResponse.json() as {
          access_token: string;
          refresh_token: string;
          expires_in: number;
        };

        accessToken = refreshData.access_token;
        const tokenExpiresAt = new Date(Date.now() + refreshData.expires_in * 1000);

        await storage.updateWearableConnection(connection.id, {
          accessToken: refreshData.access_token,
          refreshToken: refreshData.refresh_token,
          tokenExpiresAt
        });
      }

      // Get today's date for fetching data
      const today = new Date().toISOString().split('T')[0];

      // Fetch activity data from Fitbit
      const activityResponse = await fetch(`https://api.fitbit.com/1/user/-/activities/date/${today}.json`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      // Fetch sleep data from Fitbit
      const sleepResponse = await fetch(`https://api.fitbit.com/1.2/user/-/sleep/date/${today}.json`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      // Fetch heart rate data from Fitbit
      const heartResponse = await fetch(`https://api.fitbit.com/1/user/-/activities/heart/date/${today}/1d.json`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const syncedData: any = {
        playerId: user.playerId,
        source: 'fitbit',
        date: today,
        syncedAt: new Date()
      };

      // Process activity data
      if (activityResponse.ok) {
        const activityData = await activityResponse.json() as any;
        if (activityData.summary) {
          syncedData.stepCount = activityData.summary.steps || 0;
          syncedData.caloriesBurned = activityData.summary.caloriesOut || 0;
          syncedData.activeMinutes = (activityData.summary.veryActiveMinutes || 0) + 
                                     (activityData.summary.fairlyActiveMinutes || 0);
          syncedData.distanceMeters = (activityData.summary.distances?.find((d: any) => d.activity === 'total')?.distance || 0) * 1609.34;
        }
      }

      // Process sleep data
      if (sleepResponse.ok) {
        const sleepData = await sleepResponse.json() as any;
        if (sleepData.summary) {
          syncedData.sleepHours = (sleepData.summary.totalMinutesAsleep || 0) / 60;
          syncedData.deepSleepMinutes = sleepData.summary.stages?.deep || 0;
          syncedData.remSleepMinutes = sleepData.summary.stages?.rem || 0;
          
          // Calculate simple sleep quality score
          const sleepEfficiency = sleepData.summary.totalMinutesAsleep / 
                                   (sleepData.summary.totalTimeInBed || 1) * 100;
          syncedData.sleepQualityScore = Math.min(100, Math.round(sleepEfficiency));
        }
      }

      // Process heart rate data
      if (heartResponse.ok) {
        const heartData = await heartResponse.json() as any;
        if (heartData['activities-heart']?.[0]?.value) {
          syncedData.restingHeartRate = heartData['activities-heart'][0].value.restingHeartRate || null;
        }
      }

      // Check if data exists for today
      const existingData = await storage.getFitnessDataByDate(user.playerId, today);

      let result;
      if (existingData && existingData.source === 'fitbit') {
        result = await storage.updateFitnessData(existingData.id, syncedData);
      } else {
        result = await storage.createFitnessData(syncedData);
      }

      // Update last sync time
      await storage.updateWearableConnection(connection.id, { lastSyncAt: new Date() });

      res.json({
        message: "Fitbit data synced successfully",
        data: result
      });
    } catch (error) {
      console.error('Error syncing Fitbit data:', error);
      res.status(500).json({ message: "Failed to sync Fitbit data" });
    }
  });

  // DELETE /api/wearables/fitbit/disconnect - Disconnect Fitbit
  app.delete("/api/wearables/fitbit/disconnect", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await authStorage.getUser(userId);
      if (!user || !user.playerId) {
        return res.status(400).json({ message: "No player profile linked to this account" });
      }

      const connection = await storage.getWearableConnectionByPlayerAndProvider(user.playerId, 'fitbit');
      if (!connection) {
        return res.status(404).json({ message: "Fitbit is not connected" });
      }

      // Revoke the token with Fitbit (best effort)
      if (isFitbitConfigured() && connection.accessToken) {
        try {
          await fetch('https://api.fitbit.com/oauth2/revoke', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': 'Basic ' + Buffer.from(`${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`).toString('base64')
            },
            body: new URLSearchParams({
              token: connection.accessToken
            }).toString()
          });
        } catch (revokeError) {
          console.error('Error revoking Fitbit token (continuing):', revokeError);
        }
      }

      // Delete the connection
      await storage.deleteWearableConnection(connection.id);

      res.json({ message: "Fitbit disconnected successfully" });
    } catch (error) {
      console.error('Error disconnecting Fitbit:', error);
      res.status(500).json({ message: "Failed to disconnect Fitbit" });
    }
  });

  // GET /api/wearables/connections - Get all wearable connections for current user
  app.get("/api/wearables/connections", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await authStorage.getUser(userId);
      if (!user || !user.playerId) {
        return res.status(400).json({ message: "No player profile linked to this account" });
      }

      const connections = await storage.getPlayerWearableConnections(user.playerId);

      // Return connections without sensitive tokens
      const safeConnections = connections.map(c => ({
        id: c.id,
        provider: c.provider,
        isActive: c.isActive,
        lastSyncAt: c.lastSyncAt,
        createdAt: c.createdAt
      }));

      res.json({
        connections: safeConnections,
        availableProviders: {
          fitbit: { configured: isFitbitConfigured() },
          google_fit: { configured: false },
          whoop: { configured: false },
          apple_health: { configured: false }
        }
      });
    } catch (error) {
      console.error('Error getting wearable connections:', error);
      res.status(500).json({ message: "Failed to get wearable connections" });
    }
  });

  // === RECRUITING EVENTS API ===

  // GET /api/recruiting-events - List recruiting events with visibility filtering
  // Public events are visible to everyone
  // Team events are only visible to team members
  app.get("/api/recruiting-events", async (req, res) => {
    try {
      const { sport, state, eventType, startDate, endDate } = req.query;
      
      // Build base conditions
      const conditions: any[] = [];
      
      if (typeof sport === 'string' && sport) {
        conditions.push(eq(recruitingEvents.sport, sport));
      }
      if (typeof state === 'string' && state) {
        conditions.push(eq(recruitingEvents.state, state));
      }
      if (typeof eventType === 'string' && eventType) {
        conditions.push(eq(recruitingEvents.eventType, eventType));
      }
      if (typeof startDate === 'string' && startDate) {
        conditions.push(sql`${recruitingEvents.startDate} >= ${startDate}`);
      }
      if (typeof endDate === 'string' && endDate) {
        conditions.push(sql`${recruitingEvents.startDate} <= ${endDate}`);
      }

      // Get user's team IDs if authenticated
      let userTeamIds: number[] = [];
      if ((req as any).isAuthenticated?.() && (req as any).user?.claims?.sub) {
        const userId = (req as any).user.claims.sub;
        const user = await authStorage.getUser(userId);
        if (user?.playerId) {
          const memberships = await db.select({ teamId: teamMembers.teamId })
            .from(teamMembers)
            .where(eq(teamMembers.playerId, user.playerId));
          userTeamIds = memberships.map(m => m.teamId);
        }
      }

      // Visibility filter: public events OR team events for user's teams
      let visibilityCondition;
      if (userTeamIds.length > 0) {
        visibilityCondition = or(
          eq(recruitingEvents.visibility, 'public'),
          and(
            eq(recruitingEvents.visibility, 'team'),
            inArray(recruitingEvents.teamId, userTeamIds)
          )
        );
      } else {
        visibilityCondition = eq(recruitingEvents.visibility, 'public');
      }
      conditions.push(visibilityCondition);

      const results = await db.select({
        event: recruitingEvents,
        college: colleges,
      })
        .from(recruitingEvents)
        .leftJoin(colleges, eq(recruitingEvents.collegeId, colleges.id))
        .where(and(...conditions))
        .orderBy(recruitingEvents.startDate);

      const eventsWithCollege = results.map(r => ({
        event: r.event,
        college: r.college,
      }));

      res.json(eventsWithCollege);
    } catch (error) {
      console.error('Error getting recruiting events:', error);
      res.status(500).json({ message: "Failed to get recruiting events" });
    }
  });

  // GET /api/recruiting-events/:id - Get a single event by ID
  app.get("/api/recruiting-events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const results = await db.select({
        event: recruitingEvents,
        college: colleges,
      })
        .from(recruitingEvents)
        .leftJoin(colleges, eq(recruitingEvents.collegeId, colleges.id))
        .where(eq(recruitingEvents.id, id))
        .limit(1);

      if (results.length === 0) {
        return res.status(404).json({ message: "Recruiting event not found" });
      }

      const result = results[0];
      res.json({
        ...result.event,
        college: result.college,
      });
    } catch (error) {
      console.error('Error getting recruiting event:', error);
      res.status(500).json({ message: "Failed to get recruiting event" });
    }
  });

  // POST /api/recruiting-events - Create a new public event (admin only)
  app.post("/api/recruiting-events", isAdmin, async (req, res) => {
    try {
      const validatedData = insertRecruitingEventSchema.parse(req.body);
      
      const [newEvent] = await db.insert(recruitingEvents)
        .values({
          ...validatedData,
          visibility: 'public', // Admin events are always public
        })
        .returning();
      
      res.status(201).json(newEvent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request body", errors: error.errors });
      }
      console.error('Error creating recruiting event:', error);
      res.status(500).json({ message: "Failed to create recruiting event" });
    }
  });

  // POST /api/teams/:teamId/recruiting-events - Coach creates team-only event
  app.post("/api/teams/:teamId/recruiting-events", isCoach, async (req: any, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      if (isNaN(teamId)) {
        return res.status(400).json({ message: "Invalid team ID" });
      }

      // Verify coach owns this team
      const userId = req.user.claims.sub;
      const team = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
      if (team.length === 0) {
        return res.status(404).json({ message: "Team not found" });
      }
      if (team[0].createdBy !== userId) {
        return res.status(403).json({ message: "You can only create events for your own team" });
      }

      const validatedData = insertRecruitingEventSchema.parse(req.body);
      
      const [newEvent] = await db.insert(recruitingEvents)
        .values({
          ...validatedData,
          visibility: 'team',
          teamId: teamId,
          createdBy: userId,
        })
        .returning();
      
      res.status(201).json(newEvent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request body", errors: error.errors });
      }
      console.error('Error creating team recruiting event:', error);
      res.status(500).json({ message: "Failed to create recruiting event" });
    }
  });

  // GET /api/players/:playerId/event-registrations - Get player's event registrations
  app.get("/api/players/:playerId/event-registrations", isAuthenticated, async (req, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }

      // Verify user owns this player data
      const userPlayerId = Number((req.user as any)?.playerId);
      if (!userPlayerId || userPlayerId !== playerId) {
        return res.status(403).json({ error: 'Forbidden: Not authorized to access this player data' });
      }

      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      const registrations = await db.select({
        registration: playerEventRegistrations,
        event: recruitingEvents,
        college: colleges,
      })
        .from(playerEventRegistrations)
        .innerJoin(recruitingEvents, eq(playerEventRegistrations.eventId, recruitingEvents.id))
        .leftJoin(colleges, eq(recruitingEvents.collegeId, colleges.id))
        .where(eq(playerEventRegistrations.playerId, playerId))
        .orderBy(recruitingEvents.startDate);

      const result = registrations.map(r => ({
        ...r.registration,
        event: {
          ...r.event,
          college: r.college,
        },
      }));

      res.json(result);
    } catch (error) {
      console.error('Error getting player event registrations:', error);
      res.status(500).json({ message: "Failed to get event registrations" });
    }
  });

  // POST /api/players/:playerId/event-registrations - Register interest in an event
  app.post("/api/players/:playerId/event-registrations", isAuthenticated, async (req, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }

      // Verify user owns this player data
      const userPlayerId = Number((req.user as any)?.playerId);
      if (!userPlayerId || userPlayerId !== playerId) {
        return res.status(403).json({ error: 'Forbidden: Not authorized to access this player data' });
      }

      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      const { eventId, status, notes } = req.body;
      
      if (!eventId || typeof eventId !== 'number') {
        return res.status(400).json({ message: "eventId is required and must be a number" });
      }

      const [event] = await db.select()
        .from(recruitingEvents)
        .where(eq(recruitingEvents.id, eventId))
        .limit(1);
      
      if (!event) {
        return res.status(404).json({ message: "Recruiting event not found" });
      }

      const existing = await db.select()
        .from(playerEventRegistrations)
        .where(and(
          eq(playerEventRegistrations.playerId, playerId),
          eq(playerEventRegistrations.eventId, eventId)
        ))
        .limit(1);

      if (existing.length > 0) {
        return res.status(409).json({ message: "Already registered for this event" });
      }

      const registrationData = {
        playerId,
        eventId,
        status: status || 'interested',
        notes: notes || null,
      };

      const validatedData = insertPlayerEventRegistrationSchema.parse(registrationData);

      const [newRegistration] = await db.insert(playerEventRegistrations)
        .values(validatedData)
        .returning();

      res.status(201).json(newRegistration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request body", errors: error.errors });
      }
      console.error('Error creating event registration:', error);
      res.status(500).json({ message: "Failed to register for event" });
    }
  });

  // DELETE /api/players/:playerId/event-registrations/:eventId - Remove registration
  app.delete("/api/players/:playerId/event-registrations/:eventId", isAuthenticated, async (req, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      const eventId = parseInt(req.params.eventId);
      
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      // Verify user owns this player data
      const userPlayerId = Number((req.user as any)?.playerId);
      if (!userPlayerId || userPlayerId !== playerId) {
        return res.status(403).json({ error: 'Forbidden: Not authorized to access this player data' });
      }

      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      const existing = await db.select()
        .from(playerEventRegistrations)
        .where(and(
          eq(playerEventRegistrations.playerId, playerId),
          eq(playerEventRegistrations.eventId, eventId)
        ))
        .limit(1);

      if (existing.length === 0) {
        return res.status(404).json({ message: "Registration not found" });
      }

      await db.delete(playerEventRegistrations)
        .where(and(
          eq(playerEventRegistrations.playerId, playerId),
          eq(playerEventRegistrations.eventId, eventId)
        ));

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting event registration:', error);
      res.status(500).json({ message: "Failed to delete registration" });
    }
  });

  // GET /api/players/:playerId/ncaa-eligibility - Get player's NCAA eligibility progress
  app.get("/api/players/:playerId/ncaa-eligibility", isAuthenticated, async (req, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }

      // Verify user owns this player data
      const userPlayerId = Number((req.user as any)?.playerId);
      if (!userPlayerId || userPlayerId !== playerId) {
        return res.status(403).json({ error: 'Forbidden: Not authorized to access this player data' });
      }

      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      const [eligibilityProgress] = await db.select()
        .from(ncaaEligibilityProgress)
        .where(eq(ncaaEligibilityProgress.playerId, playerId))
        .limit(1);

      res.json(eligibilityProgress || null);
    } catch (error) {
      console.error('Error getting NCAA eligibility progress:', error);
      res.status(500).json({ message: "Failed to get NCAA eligibility progress" });
    }
  });

  // POST /api/players/:playerId/ncaa-eligibility - Create/Update player's NCAA eligibility progress
  app.post("/api/players/:playerId/ncaa-eligibility", isAuthenticated, async (req, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }

      // Verify user owns this player data
      const userPlayerId = Number((req.user as any)?.playerId);
      if (!userPlayerId || userPlayerId !== playerId) {
        return res.status(403).json({ error: 'Forbidden: Not authorized to access this player data' });
      }

      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      // Validate request body with schema
      const validatedData = insertNcaaEligibilityProgressSchema.parse({
        playerId,
        ...req.body,
      });

      // Check if record already exists
      const [existing] = await db.select()
        .from(ncaaEligibilityProgress)
        .where(eq(ncaaEligibilityProgress.playerId, playerId))
        .limit(1);

      let result;
      if (existing) {
        // Update existing record
        const [updated] = await db.update(ncaaEligibilityProgress)
          .set({
            ...validatedData,
            updatedAt: new Date(),
          })
          .where(eq(ncaaEligibilityProgress.playerId, playerId))
          .returning();
        result = updated;
      } else {
        // Create new record
        const [created] = await db.insert(ncaaEligibilityProgress)
          .values(validatedData)
          .returning();
        result = created;
      }

      res.status(existing ? 200 : 201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request body", errors: error.errors });
      }
      console.error('Error creating/updating NCAA eligibility progress:', error);
      res.status(500).json({ message: "Failed to create/update NCAA eligibility progress" });
    }
  });

  // === COACH RECOMMENDATIONS API ===
  
  // GET public recommendations for a player
  app.get('/api/players/:playerId/recommendations', async (req, res) => {
    try {
      const playerId = parseInt(req.params.playerId, 10);
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }
      
      const recommendations = await db
        .select()
        .from(coachRecommendations)
        .where(and(
          eq(coachRecommendations.playerId, playerId),
          eq(coachRecommendations.isPublic, true)
        ))
        .orderBy(desc(coachRecommendations.createdAt));
      
      res.json(recommendations);
    } catch (error) {
      console.error('Error fetching public recommendations:', error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });
  
  // GET all recommendations (including private) for player - only accessible to the player themselves
  app.get('/api/players/:playerId/recommendations/all', isAuthenticated, async (req: any, res) => {
    try {
      const playerId = parseInt(req.params.playerId, 10);
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }
      
      const user = await authStorage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Only allow the player themselves to view all recommendations
      if (user.role !== 'player' || user.playerId !== playerId) {
        return res.status(403).json({ message: "Only the player can view all their recommendations" });
      }
      
      const recommendations = await db
        .select()
        .from(coachRecommendations)
        .where(eq(coachRecommendations.playerId, playerId))
        .orderBy(desc(coachRecommendations.createdAt));
      
      res.json(recommendations);
    } catch (error) {
      console.error('Error fetching all recommendations:', error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });
  
  // POST create a new recommendation (coaches only)
  app.post('/api/players/:playerId/recommendations', isCoach, async (req: any, res) => {
    try {
      const playerId = parseInt(req.params.playerId, 10);
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }
      
      // Verify player exists
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      const user = (req as any).caliberUser;
      
      // Build recommendation data with coach info from session
      const recommendationData = {
        ...req.body,
        playerId,
        coachUserId: req.user.claims.sub,
        coachName: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.firstName || user.lastName || 'Coach',
      };
      
      // Validate request body
      const validatedData = insertCoachRecommendationSchema.parse(recommendationData);
      
      const [created] = await db
        .insert(coachRecommendations)
        .values(validatedData)
        .returning();
      
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request body", errors: error.errors });
      }
      console.error('Error creating recommendation:', error);
      res.status(500).json({ message: "Failed to create recommendation" });
    }
  });
  
  // DELETE a recommendation (only the coach who wrote it can delete)
  app.delete('/api/players/:playerId/recommendations/:recommendationId', isAuthenticated, async (req: any, res) => {
    try {
      const playerId = parseInt(req.params.playerId, 10);
      const recommendationId = parseInt(req.params.recommendationId, 10);
      
      if (isNaN(playerId) || isNaN(recommendationId)) {
        return res.status(400).json({ message: "Invalid player ID or recommendation ID" });
      }
      
      // Get the recommendation
      const [recommendation] = await db
        .select()
        .from(coachRecommendations)
        .where(and(
          eq(coachRecommendations.id, recommendationId),
          eq(coachRecommendations.playerId, playerId)
        ));
      
      if (!recommendation) {
        return res.status(404).json({ message: "Recommendation not found" });
      }
      
      // Only allow the coach who wrote it to delete
      if (recommendation.coachUserId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Only the coach who wrote this recommendation can delete it" });
      }
      
      await db
        .delete(coachRecommendations)
        .where(eq(coachRecommendations.id, recommendationId));
      
      res.status(200).json({ message: "Recommendation deleted successfully" });
    } catch (error) {
      console.error('Error deleting recommendation:', error);
      res.status(500).json({ message: "Failed to delete recommendation" });
    }
  });

  // === PUBLIC PLATFORM STATS (No auth required) ===
  app.get('/api/public/platform-stats', async (req, res) => {
    try {
      const [playerResult, gameResult, coachResult] = await Promise.all([
        db.select({ count: count() }).from(players),
        db.select({ count: count() }).from(games),
        db.select({ count: count() }).from(users).where(eq(users.role, 'coach')),
      ]);

      res.json({
        playerCount: playerResult[0]?.count ?? 0,
        gameCount: gameResult[0]?.count ?? 0,
        badgeCount: 50,
        coachCount: coachResult[0]?.count ?? 0,
      });
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      res.status(500).json({ message: "Failed to fetch platform stats" });
    }
  });

  // === PUBLIC PLAYER DIRECTORY (No auth required) ===
  app.get('/api/public/players/directory', async (req, res) => {
    try {
      const { position, state, graduationYear, minGrade, search, sort = 'grade', page = '1', limit = '20' } = req.query as Record<string, string>;

      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20));
      const offset = (pageNum - 1) * limitNum;

      const GRADE_VALUES: Record<string, number> = {
        'A+': 100, 'A': 95, 'A-': 90,
        'B+': 88, 'B': 85, 'B-': 80,
        'C+': 78, 'C': 75, 'C-': 70,
        'D+': 68, 'D': 65, 'D-': 60,
        'F': 50,
      };

      const conditions: any[] = [
        eq(players.openToOpportunities, true),
        eq(players.sport, 'basketball'),
      ];

      if (position) conditions.push(eq(players.position, position));
      if (state) conditions.push(eq(players.state, state));
      if (graduationYear) conditions.push(eq(players.graduationYear, parseInt(graduationYear)));
      if (search) conditions.push(ilike(players.name, `%${search}%`));

      const matchingPlayers = await db.select()
        .from(players)
        .where(and(...conditions));

      const enrichedPlayers = await Promise.all(matchingPlayers.map(async (player) => {
        const playerGames = await storage.getGamesByPlayerId(player.id);
        const playerBadges = await storage.getPlayerBadges(player.id);

        const gamesPlayed = playerGames.length;
        const ppg = gamesPlayed ? playerGames.reduce((acc, g) => acc + g.points, 0) / gamesPlayed : 0;
        const rpg = gamesPlayed ? playerGames.reduce((acc, g) => acc + g.rebounds, 0) / gamesPlayed : 0;
        const apg = gamesPlayed ? playerGames.reduce((acc, g) => acc + g.assists, 0) / gamesPlayed : 0;

        let averageGrade: string | null = null;
        let gradeValue = 0;
        if (gamesPlayed > 0) {
          const totalValue = playerGames.reduce((acc, g) => {
            const grade = g.grade?.trim().toUpperCase() || '';
            return acc + (GRADE_VALUES[grade] || 0);
          }, 0);
          gradeValue = totalValue / gamesPlayed;

          if (gradeValue >= 97) averageGrade = 'A+';
          else if (gradeValue >= 92) averageGrade = 'A';
          else if (gradeValue >= 87) averageGrade = 'A-';
          else if (gradeValue >= 84) averageGrade = 'B+';
          else if (gradeValue >= 81) averageGrade = 'B';
          else if (gradeValue >= 77) averageGrade = 'B-';
          else if (gradeValue >= 74) averageGrade = 'C+';
          else if (gradeValue >= 71) averageGrade = 'C';
          else if (gradeValue >= 67) averageGrade = 'C-';
          else if (gradeValue >= 64) averageGrade = 'D+';
          else if (gradeValue >= 61) averageGrade = 'D';
          else if (gradeValue >= 55) averageGrade = 'D-';
          else averageGrade = 'F';
        }

        const lastGame = playerGames.length > 0 ?
          [...playerGames].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] : null;

        return {
          id: player.id,
          name: player.name,
          username: player.username,
          photoUrl: player.photoUrl,
          position: player.position,
          city: player.city,
          state: player.state,
          school: player.school,
          graduationYear: player.graduationYear,
          height: player.height,
          gpa: player.gpa ? parseFloat(player.gpa as any) : null,
          currentTier: player.currentTier,
          totalXp: player.totalXp,
          openToOpportunities: player.openToOpportunities,
          highlightVideoUrl: player.highlightVideoUrl,
          gamesPlayed,
          averageGrade,
          gradeValue,
          ppg: Math.round(ppg * 10) / 10,
          rpg: Math.round(rpg * 10) / 10,
          apg: Math.round(apg * 10) / 10,
          badgeCount: playerBadges.length,
          lastGameDate: lastGame ? lastGame.date : null,
        };
      }));

      let filtered = enrichedPlayers;
      if (minGrade) {
        const minGradeValue = GRADE_VALUES[minGrade.toUpperCase()] || 0;
        filtered = enrichedPlayers.filter(p => p.gradeValue >= minGradeValue);
      }

      if (sort === 'recent') {
        filtered.sort((a, b) => {
          if (!a.lastGameDate && !b.lastGameDate) return 0;
          if (!a.lastGameDate) return 1;
          if (!b.lastGameDate) return -1;
          return new Date(b.lastGameDate).getTime() - new Date(a.lastGameDate).getTime();
        });
      } else if (sort === 'xp') {
        filtered.sort((a, b) => b.totalXp - a.totalXp);
      } else {
        filtered.sort((a, b) => b.gradeValue - a.gradeValue);
      }

      const total = filtered.length;
      const totalPages = Math.ceil(total / limitNum);
      const paged = filtered.slice(offset, offset + limitNum);

      const responseData = paged.map(({ gradeValue, ...rest }) => rest);

      res.json({
        players: responseData,
        total,
        page: pageNum,
        totalPages,
      });
    } catch (error) {
      console.error('Error fetching player directory:', error);
      res.status(500).json({ message: "Failed to fetch player directory" });
    }
  });

  // === PUBLIC RECRUITING PROFILE (No auth required) ===
  app.get('/api/public/players/:id/profile', async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }

      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      const allGames = await storage.getGamesByPlayerId(playerId);
      const recentGames = allGames
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      const playerBadges = await db.select().from(badges).where(eq(badges.playerId, playerId));
      const badgeCount = playerBadges.length;

      // Get activity streaks for the player
      const playerStreaks = await db.select().from(activityStreaks).where(eq(activityStreaks.playerId, playerId));
      
      // Find the best streak (highest currentStreak)
      let streak = null;
      if (playerStreaks.length > 0) {
        const bestStreak = playerStreaks.reduce((best, current) => 
          (current.currentStreak || 0) > (best.currentStreak || 0) ? current : best
        );
        streak = {
          type: bestStreak.streakType,
          current: bestStreak.currentStreak || 0,
          longest: bestStreak.longestStreak || 0,
        };
      }

      // Find the best game (highest grade value)
      const GRADE_VALUES: Record<string, number> = {
        'A+': 100, 'A': 95, 'A-': 90, 'B+': 88, 'B': 85, 'B-': 80,
        'C+': 78, 'C': 75, 'C-': 70, 'D+': 68, 'D': 65, 'D-': 60, 'F': 50,
      };
      let bestGame = null;
      if (allGames.length > 0) {
        const gamesWithGradeValues = allGames
          .filter(g => g.grade)
          .map(g => ({
            ...g,
            gradeValue: GRADE_VALUES[g.grade!.trim().toUpperCase()] || 0,
          }));
        if (gamesWithGradeValues.length > 0) {
          bestGame = gamesWithGradeValues.reduce((best, current) => 
            current.gradeValue > best.gradeValue ? current : best
          );
        }
      }

      // Calculate trend from last 5 games
      let trend: "improving" | "declining" | "stable" | null = null;
      const sortedGames = allGames
        .filter(g => g.grade)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      if (sortedGames.length >= 3) {
        const last3 = sortedGames.slice(0, 3);
        const last3Avg = last3.reduce((s, g) => s + (GRADE_VALUES[g.grade!.trim().toUpperCase()] || 0), 0) / 3;
        
        if (sortedGames.length >= 6) {
          const prev3 = sortedGames.slice(3, 6);
          const prev3Avg = prev3.reduce((s, g) => s + (GRADE_VALUES[g.grade!.trim().toUpperCase()] || 0), 0) / 3;
          
          if (last3Avg > prev3Avg + 2) {
            trend = "improving";
          } else if (last3Avg < prev3Avg - 2) {
            trend = "declining";
          } else {
            trend = "stable";
          }
        } else {
          // Less than 6 games, determine based on recent games trend
          trend = "stable";
        }
      }

      // Map badge details with names from BADGE_DEFINITIONS
      const badgesWithDetails = playerBadges.map(badge => ({
        type: badge.badgeType,
        name: BADGE_DEFINITIONS[badge.badgeType as keyof typeof BADGE_DEFINITIONS]?.name || badge.badgeType,
        earnedAt: badge.earnedAt,
      }));

      const totalGames = allGames.length || 1;
      const sport = player.sport || 'basketball';

      let averages: Record<string, number> = {};
      if (sport === 'basketball') {
        averages = {
          ppg: Math.round((allGames.reduce((s, g) => s + (g.points || 0), 0) / totalGames) * 10) / 10,
          rpg: Math.round((allGames.reduce((s, g) => s + (g.rebounds || 0), 0) / totalGames) * 10) / 10,
          apg: Math.round((allGames.reduce((s, g) => s + (g.assists || 0), 0) / totalGames) * 10) / 10,
          spg: Math.round((allGames.reduce((s, g) => s + (g.steals || 0), 0) / totalGames) * 10) / 10,
          bpg: Math.round((allGames.reduce((s, g) => s + (g.blocks || 0), 0) / totalGames) * 10) / 10,
        };
      } else {
        averages = {
          passingYPG: Math.round((allGames.reduce((s, g) => s + (g.passingYards || 0), 0) / totalGames) * 10) / 10,
          rushingYPG: Math.round((allGames.reduce((s, g) => s + (g.rushingYards || 0), 0) / totalGames) * 10) / 10,
          receivingYPG: Math.round((allGames.reduce((s, g) => s + (g.receivingYards || 0), 0) / totalGames) * 10) / 10,
          totalTDs: allGames.reduce((s, g) => s + (g.passingTouchdowns || 0) + (g.rushingTouchdowns || 0) + (g.receivingTouchdowns || 0), 0),
          tackles: allGames.reduce((s, g) => s + (g.tackles || 0), 0),
        };
      }

      const overallGrade = allGames.length > 0
        ? (() => {
            const graded = allGames.filter(g => g.grade);
            if (graded.length === 0) return null;
            const avg = graded.reduce((s, g) => s + (GRADE_VALUES[g.grade!.trim().toUpperCase()] || 0), 0) / graded.length;
            if (avg >= 97) return 'A+';
            if (avg >= 92) return 'A';
            if (avg >= 87) return 'A-';
            if (avg >= 84) return 'B+';
            if (avg >= 81) return 'B';
            if (avg >= 77) return 'B-';
            if (avg >= 74) return 'C+';
            if (avg >= 71) return 'C';
            if (avg >= 67) return 'C-';
            if (avg >= 64) return 'D+';
            if (avg >= 61) return 'D';
            if (avg >= 55) return 'D-';
            return 'F';
          })()
        : null;

      res.json({
        player: {
          id: player.id,
          name: player.name,
          username: player.username,
          photoUrl: player.photoUrl,
          bannerUrl: player.bannerUrl,
          bio: player.bio,
          sport: player.sport,
          position: player.position,
          team: player.team,
          city: player.city,
          state: player.state,
          height: player.height,
          school: player.school,
          graduationYear: player.graduationYear,
          level: player.level,
          gpa: player.gpa ? parseFloat(player.gpa.toString()) : null,
          currentTier: player.currentTier,
          totalXp: player.totalXp,
          jerseyNumber: player.jerseyNumber,
          stateRank: player.stateRank,
          countryRank: player.countryRank,
          openToOpportunities: player.openToOpportunities,
          highlightVideoUrl: player.highlightVideoUrl,
        },
        overallGrade,
        gamesPlayed: allGames.length,
        averages,
        recentGames: recentGames.map(g => ({
          id: g.id,
          date: g.date,
          opponent: g.opponent,
          result: g.result,
          grade: g.grade,
          points: g.points,
          rebounds: g.rebounds,
          assists: g.assists,
          steals: g.steals,
          blocks: g.blocks,
          passingYards: g.passingYards,
          rushingYards: g.rushingYards,
          receivingYards: g.receivingYards,
          passingTouchdowns: g.passingTouchdowns,
          rushingTouchdowns: g.rushingTouchdowns,
          receivingTouchdowns: g.receivingTouchdowns,
          tackles: g.tackles,
        })),
        badges: badgesWithDetails,
        badgeCount,
        streak,
        bestGame: bestGame ? {
          id: bestGame.id,
          date: bestGame.date,
          opponent: bestGame.opponent,
          result: bestGame.result,
          grade: bestGame.grade,
          points: bestGame.points,
          rebounds: bestGame.rebounds,
          assists: bestGame.assists,
          steals: bestGame.steals,
          blocks: bestGame.blocks,
          passingYards: bestGame.passingYards,
          rushingYards: bestGame.rushingYards,
          receivingYards: bestGame.receivingYards,
          passingTouchdowns: bestGame.passingTouchdowns,
          rushingTouchdowns: bestGame.rushingTouchdowns,
          receivingTouchdowns: bestGame.receivingTouchdowns,
          tackles: bestGame.tackles,
        } : null,
        trend,
        shareUrl: `/recruit/${playerId}`,
      });
    } catch (error) {
      console.error('Error fetching public player profile:', error);
      res.status(500).json({ message: "Failed to fetch public profile" });
    }
  });

  // POST /api/public/players/:id/inquiries - Submit recruiting inquiry (public, no auth required)
  app.post("/api/public/players/:id/inquiries", async (req: any, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const schema = z.object({
        senderName: z.string().min(1, "Name is required").max(200),
        senderEmail: z.string().email("Valid email required"),
        senderRole: z.enum(["coach", "recruiter", "parent", "other"]),
        senderSchool: z.string().max(200).optional().nullable(),
        message: z.string().min(1, "Message is required").max(2000),
      });
      const input = schema.parse(req.body);
      
      const player = await storage.getPlayer(playerId);
      if (!player) return res.status(404).json({ message: "Player not found" });
      
      const inquiry = await storage.createRecruitingInquiry({
        playerId,
        senderName: input.senderName,
        senderEmail: input.senderEmail,
        senderRole: input.senderRole,
        senderSchool: input.senderSchool || null,
        message: input.message,
        isRead: false,
      });
      
      if (player.userId) {
        await storage.createNotification({
          playerId: player.id,
          userId: player.userId,
          notificationType: "recruiting_inquiry",
          title: "New Recruiting Inquiry",
          message: `${input.senderName}${input.senderSchool ? ` from ${input.senderSchool}` : ''} is interested in recruiting you!`,
          relatedId: inquiry.id,
          relatedType: "recruiting_inquiry",
          isRead: false,
        });
      }
      
      res.json({ success: true, message: "Inquiry sent successfully" });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      console.error("Error creating recruiting inquiry:", error);
      res.status(500).json({ message: "Failed to send inquiry" });
    }
  });

  // GET /api/players/:id/inquiries - Get recruiting inquiries for a player (auth required)
  app.get("/api/players/:id/inquiries", isAuthenticated, async (req: any, res) => {
    try {
      const playerId = parseInt(req.params.id);
      if (!await canModifyPlayer(req, playerId)) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const inquiries = await storage.getRecruitingInquiries(playerId);
      res.json(inquiries);
    } catch (error) {
      console.error("Error fetching recruiting inquiries:", error);
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  // PATCH /api/players/:id/inquiries/:inquiryId/read - Mark inquiry as read
  app.patch("/api/players/:id/inquiries/:inquiryId/read", isAuthenticated, async (req: any, res) => {
    try {
      const playerId = parseInt(req.params.id);
      if (!await canModifyPlayer(req, playerId)) {
        return res.status(403).json({ message: "Not authorized" });
      }
      await storage.markInquiryRead(parseInt(req.params.inquiryId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking inquiry read:", error);
      res.status(500).json({ message: "Failed to mark inquiry read" });
    }
  });

  app.post('/api/challenges/create', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await authStorage.getUser(userId);
      if (!user?.playerId) return res.status(400).json({ message: "Player profile required" });
      
      const player = await storage.getPlayer(user.playerId);
      if (!player) return res.status(404).json({ message: "Player not found" });
      
      const allGames = await storage.getGamesByPlayerId(user.playerId);
      const recentGames = allGames.slice(0, 10);
      
      const sport = player.sport || 'basketball';
      let stats: Record<string, number> = {};
      
      if (sport === 'basketball') {
        const totalGames = recentGames.length || 1;
        stats = {
          gamesPlayed: recentGames.length,
          ppg: Math.round((recentGames.reduce((s, g) => s + ((g.fgMade || 0) * 2 + (g.threeMade || 0) * 3 + (g.ftMade || 0)), 0) / totalGames) * 10) / 10,
          rpg: Math.round((recentGames.reduce((s, g) => s + (g.rebounds || 0), 0) / totalGames) * 10) / 10,
          apg: Math.round((recentGames.reduce((s, g) => s + (g.assists || 0), 0) / totalGames) * 10) / 10,
        };
      } else {
        const totalGames = recentGames.length || 1;
        stats = {
          gamesPlayed: recentGames.length,
          tdpg: Math.round((recentGames.reduce((s, g) => s + (g.passingTouchdowns || 0) + (g.rushingTouchdowns || 0) + (g.receivingTouchdowns || 0), 0) / totalGames) * 10) / 10,
          ypg: Math.round((recentGames.reduce((s, g) => s + (g.passingYards || 0) + (g.rushingYards || 0) + (g.receivingYards || 0), 0) / totalGames) * 10) / 10,
        };
      }
      
      const challengeCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      res.json({
        challengeCode,
        challengerId: player.id,
        challengerName: player.name,
        challengerPhoto: player.photoUrl,
        challengerPosition: player.position,
        challengerTeam: player.team,
        challengerSport: sport,
        challengerStats: stats,
        shareUrl: `/challenge/${challengeCode}?p=${player.id}`,
        shareText: `Think you can beat my stats? Challenge me on Caliber!`,
      });
    } catch (error) {
      console.error('Error creating challenge:', error);
      res.status(500).json({ message: "Failed to create challenge" });
    }
  });

  app.get("/api/players/:playerId/athletic-measurements", async (req, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      const measurements = await storage.getPlayerAthleticMeasurements(playerId);
      res.json(measurements);
    } catch (error) {
      res.status(500).json({ message: "Failed to get athletic measurements" });
    }
  });

  app.post("/api/players/:playerId/athletic-measurements", isAuthenticated, async (req: any, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      if (!await canModifyPlayer(req, playerId)) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const data = { ...req.body, playerId };
      const measurement = await storage.createAthleticMeasurement(data);
      res.status(201).json(measurement);
    } catch (error) {
      res.status(500).json({ message: "Failed to create athletic measurement" });
    }
  });

  app.delete("/api/players/:playerId/athletic-measurements/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAthleticMeasurement(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete athletic measurement" });
    }
  });

  // === RECRUITING GAME PLAN ===

  app.get("/api/players/:playerId/recruiting-targets", async (req, res) => {
    const playerId = parseInt(req.params.playerId);
    const targets = await storage.getRecruitingTargets(playerId);
    res.json(targets);
  });

  app.post("/api/players/:playerId/recruiting-targets", async (req, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      const existing = await storage.getRecruitingTargets(playerId);
      if (existing.length >= 15) {
        return res.status(400).json({ message: "Maximum of 15 target schools allowed" });
      }
      const body = { ...req.body, playerId };
      if (body.followUpDate && typeof body.followUpDate === 'string') {
        body.followUpDate = new Date(body.followUpDate);
      }
      if (body.lastContactDate && typeof body.lastContactDate === 'string') {
        body.lastContactDate = new Date(body.lastContactDate);
      }
      const input = insertRecruitingTargetSchema.parse(body);
      const target = await storage.createRecruitingTarget(input);
      res.status(201).json(target);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch("/api/recruiting-targets/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const body = { ...req.body };
    if (body.followUpDate && typeof body.followUpDate === 'string') {
      body.followUpDate = new Date(body.followUpDate);
    }
    if (body.lastContactDate && typeof body.lastContactDate === 'string') {
      body.lastContactDate = new Date(body.lastContactDate);
    }
    const target = await storage.updateRecruitingTarget(id, body);
    if (!target) return res.status(404).json({ message: "Target not found" });
    res.json(target);
  });

  app.delete("/api/recruiting-targets/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteRecruitingTarget(id);
    res.json({ success: true });
  });

  app.get("/api/recruiting-targets/:targetId/contacts", async (req, res) => {
    const targetId = parseInt(req.params.targetId);
    const contacts = await storage.getRecruitingContacts(targetId);
    res.json(contacts);
  });

  app.post("/api/recruiting-targets/:targetId/contacts", async (req, res) => {
    try {
      const targetId = parseInt(req.params.targetId);
      const target = await storage.getRecruitingTarget(targetId);
      if (!target) return res.status(404).json({ message: "Target not found" });
      
      const input = insertRecruitingContactSchema.parse({ ...req.body, targetId, playerId: target.playerId });
      const contact = await storage.createRecruitingContact(input);
      
      await storage.updateRecruitingTarget(targetId, {
        lastContactDate: new Date(),
        status: target.status === 'researching' ? 'contacted' : target.status
      });
      
      res.status(201).json(contact);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.post("/api/recruiting-targets/:id/generate-email", async (req, res) => {
    const id = parseInt(req.params.id);
    const target = await storage.getRecruitingTarget(id);
    if (!target) return res.status(404).json({ message: "Target not found" });
    
    const player = await storage.getPlayer(target.playerId);
    if (!player) return res.status(404).json({ message: "Player not found" });
    
    const playerGames = player.games.filter(g => g.sport === 'basketball');
    const gamesCount = playerGames.length;
    
    let avgStats = { ppg: 0, rpg: 0, apg: 0, fgPct: 0 };
    if (gamesCount > 0) {
      const totals = playerGames.reduce((acc, g) => ({
        pts: acc.pts + (g.points || 0),
        reb: acc.reb + (g.rebounds || 0),
        ast: acc.ast + (g.assists || 0),
        fgm: acc.fgm + (g.fgMade || 0),
        fga: acc.fga + (g.fgAttempted || 0),
      }), { pts: 0, reb: 0, ast: 0, fgm: 0, fga: 0 });
      
      avgStats = {
        ppg: Math.round((totals.pts / gamesCount) * 10) / 10,
        rpg: Math.round((totals.reb / gamesCount) * 10) / 10,
        apg: Math.round((totals.ast / gamesCount) * 10) / 10,
        fgPct: totals.fga > 0 ? Math.round((totals.fgm / totals.fga) * 1000) / 10 : 0,
      };
    }

    try {
      const prompt = `Write a brief, professional recruiting intro email from a high school basketball player to a college coach. Keep it under 150 words, friendly but respectful. Do NOT include subject line or email headers - just the body text.

Player Info:
- Name: ${player.name}
- Position: ${player.position}
- Height: ${player.height || 'Not specified'}
- School: ${player.school || 'Not specified'}
- Graduation Year: ${player.graduationYear || 'Not specified'}
- GPA: ${player.gpa || 'Not specified'}
- Stats (${gamesCount} games): ${avgStats.ppg} PPG, ${avgStats.rpg} RPG, ${avgStats.apg} APG, ${avgStats.fgPct}% FG
- Grade: ${playerGames.length > 0 ? playerGames[playerGames.length - 1].grade : 'N/A'}
- Tier: ${player.currentTier}

Target School: ${target.collegeName} (${target.division})
${target.contactName ? `Coach: ${target.contactName}` : ''}

The email should:
1. Express genuine interest in the program
2. Briefly highlight key stats and achievements
3. Mention academic readiness
4. Ask about opportunities to be evaluated
5. Keep a humble, eager tone`;

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      const emailText = result.text || '';
      
      await storage.updateRecruitingTarget(id, { generatedEmail: emailText });
      
      res.json({ email: emailText });
    } catch (error) {
      console.error('Error generating email:', error);
      res.status(500).json({ message: "Failed to generate email" });
    }
  });

  // === DEVELOPMENT ROADMAP ===

  const DRILL_SUGGESTIONS: Record<string, Array<{name: string, description: string, duration: string}>> = {
    ppg: [
      { name: "Spot Shooting Circuit", description: "5 spots, 10 shots each. Track makes.", duration: "15 min" },
      { name: "Mikan Drill", description: "Alternating layups for finishing around the rim.", duration: "10 min" },
    ],
    rpg: [
      { name: "Box Out & Rebound", description: "Practice boxing out and grabbing boards with a partner.", duration: "10 min" },
      { name: "Tip Drill", description: "Tip the ball off the backboard 10 times each hand.", duration: "5 min" },
    ],
    apg: [
      { name: "2-on-1 Passing", description: "Fast break passing drill with decision making.", duration: "10 min" },
      { name: "Vision Training", description: "Full court passing with head-up dribbling.", duration: "15 min" },
    ],
    spg: [
      { name: "Closeout Drill", description: "Practice defensive closeouts and active hands.", duration: "10 min" },
      { name: "Lane Denial", description: "Deny passing lanes with quick feet and anticipation.", duration: "10 min" },
    ],
    fgPct: [
      { name: "Form Shooting", description: "Close-range shots focusing on perfect form and release.", duration: "10 min" },
      { name: "Game-Speed Shooting", description: "Catch and shoot off screens at game tempo.", duration: "15 min" },
    ],
    threePct: [
      { name: "Ray Allen Drill", description: "Catch-and-shoot 3s from 5 spots, moving around the arc.", duration: "15 min" },
      { name: "Off-Dribble 3s", description: "Pull-up 3-pointers off 1-2 dribbles.", duration: "10 min" },
    ],
    ftPct: [
      { name: "Free Throw 10x10", description: "10 sets of 10 free throws. Track percentage each set.", duration: "20 min" },
      { name: "Pressure Free Throws", description: "Shoot FTs after sprints to simulate game fatigue.", duration: "15 min" },
    ],
  };

  app.get("/api/players/:playerId/development-roadmap", async (req, res) => {
    const playerId = parseInt(req.params.playerId);
    const player = await storage.getPlayer(playerId);
    if (!player) return res.status(404).json({ message: "Player not found" });
    
    const playerGames = player.games.filter(g => g.sport === 'basketball');
    if (playerGames.length < 3) {
      return res.json({ 
        ready: false, 
        message: "Log at least 3 games to unlock your Development Roadmap",
        gamesNeeded: 3 - playerGames.length
      });
    }
    
    const position = player.position as 'Guard' | 'Wing' | 'Big';
    const benchmarks = DIVISION_BENCHMARKS[position] || DIVISION_BENCHMARKS.Guard;
    
    const gamesCount = playerGames.length;
    const computeStats = (gamesList: typeof playerGames) => {
      const cnt = gamesList.length;
      if (cnt === 0) return { ppg: 0, rpg: 0, apg: 0, spg: 0, fgPct: 0, threePct: 0, ftPct: 0 };
      const t = gamesList.reduce((acc, g) => ({
        pts: acc.pts + (g.points || 0),
        reb: acc.reb + (g.rebounds || 0),
        ast: acc.ast + (g.assists || 0),
        stl: acc.stl + (g.steals || 0),
        fgm: acc.fgm + (g.fgMade || 0),
        fga: acc.fga + (g.fgAttempted || 0),
        thrm: acc.thrm + (g.threeMade || 0),
        thra: acc.thra + (g.threeAttempted || 0),
        ftm: acc.ftm + (g.ftMade || 0),
        fta: acc.fta + (g.ftAttempted || 0),
      }), { pts: 0, reb: 0, ast: 0, stl: 0, fgm: 0, fga: 0, thrm: 0, thra: 0, ftm: 0, fta: 0 });
      return {
        ppg: Math.round((t.pts / cnt) * 10) / 10,
        rpg: Math.round((t.reb / cnt) * 10) / 10,
        apg: Math.round((t.ast / cnt) * 10) / 10,
        spg: Math.round((t.stl / cnt) * 10) / 10,
        fgPct: t.fga > 0 ? Math.round((t.fgm / t.fga) * 1000) / 10 : 0,
        threePct: t.thra > 0 ? Math.round((t.thrm / t.thra) * 1000) / 10 : 0,
        ftPct: t.fta > 0 ? Math.round((t.ftm / t.fta) * 1000) / 10 : 0,
      };
    };

    const playerStats = computeStats(playerGames);

    const recentGames = playerGames.slice(-5);
    const recentStats = computeStats(recentGames);
    
    const divisions = ['D1', 'D2', 'D3', 'NAIA'] as const;
    let currentLevel = 'Below NAIA';
    let nextLevel = 'NAIA';
    
    for (const div of divisions) {
      const bench = benchmarks[div];
      const sKeys = Object.keys(bench) as (keyof typeof bench)[];
      const metCount = sKeys.filter(key => playerStats[key] >= bench[key]).length;
      const pct = metCount / sKeys.length;
      if (pct >= 0.6) {
        currentLevel = div;
        const nextIdx = divisions.indexOf(div) - 1;
        nextLevel = nextIdx >= 0 ? divisions[nextIdx] : 'Above D1';
        break;
      }
    }

    const targetLevelParam = req.query.targetLevel as string | undefined;
    const validTargetLevels = ['D1', 'D2', 'D3', 'NAIA'];
    if (targetLevelParam && validTargetLevels.includes(targetLevelParam)) {
      nextLevel = targetLevelParam;
    }
    
    const nextBenchmark = currentLevel === 'Above D1' && nextLevel === 'Above D1'
      ? benchmarks.D1
      : benchmarks[nextLevel as keyof typeof benchmarks] || benchmarks.NAIA;

    const pctStats = new Set(['fgPct', 'threePct', 'ftPct']);

    const gaps: Array<{
      stat: string, label: string, current: number, target: number, gap: number, percentOfTarget: number,
      trends: { recent: number, overall: number, direction: 'up' | 'down' | 'stable' },
      drills: Array<{name: string, description: string, duration: string}>,
      contextLabel: string,
    }> = [];
    const statKeys = Object.keys(nextBenchmark) as (keyof typeof nextBenchmark)[];
    
    for (const key of statKeys) {
      const current = playerStats[key];
      const target = nextBenchmark[key];
      const gap = target - current;
      const percentOfTarget = Math.min(Math.round((current / target) * 100), 100);

      const recentVal = recentStats[key];
      const overallVal = playerStats[key];
      const threshold = pctStats.has(key) ? 1.0 : 0.5;
      let direction: 'up' | 'down' | 'stable' = 'stable';
      if (recentVal > overallVal + threshold) direction = 'up';
      else if (recentVal < overallVal - threshold) direction = 'down';

      let contextLabel = '';
      if (current >= target) {
        const d1Val = benchmarks.D1[key as keyof typeof benchmarks.D1];
        const d2Val = benchmarks.D2[key as keyof typeof benchmarks.D2];
        const d3Val = benchmarks.D3[key as keyof typeof benchmarks.D3];
        if (current >= d1Val) contextLabel = 'Elite (D1+)';
        else if (current >= d2Val) contextLabel = 'Strong (D2)';
        else if (current >= d3Val) contextLabel = 'Solid (D3)';
      }
      
      gaps.push({
        stat: key,
        label: BENCHMARK_STAT_LABELS[key] || key,
        current,
        target,
        gap: Math.round(gap * 10) / 10,
        percentOfTarget,
        trends: { recent: recentVal, overall: overallVal, direction },
        drills: gap > 0 ? (DRILL_SUGGESTIONS[key] || []) : [],
        contextLabel,
      });
    }
    
    const sortedGaps = [...gaps].sort((a, b) => a.percentOfTarget - b.percentOfTarget);
    
    const weeklyFocus = sortedGaps.filter(g => g.gap > 0).slice(0, 3).map(g => ({
      stat: g.stat,
      label: g.label,
      current: g.current,
      target: g.target,
      improvement: `+${g.gap > 1 ? Math.ceil(g.gap) : g.gap}`,
    }));
    
    const totalPct = gaps.reduce((sum, g) => sum + g.percentOfTarget, 0);
    const overallPercentile = Math.round(totalPct / gaps.length);

    let bestGame: {
      date: string, opponent: string, points: number, rebounds: number,
      assists: number, steals: number, fgPct: number,
    } | null = null;
    if (playerGames.length > 0) {
      let bestScore = -Infinity;
      let bestG: typeof playerGames[0] | null = null;
      for (const g of playerGames) {
        const score = (g.points || 0) + (g.rebounds || 0) * 1.2 + (g.assists || 0) * 1.5 + (g.steals || 0) * 2;
        if (score > bestScore) {
          bestScore = score;
          bestG = g;
        }
      }
      if (bestG) {
        bestGame = {
          date: bestG.date,
          opponent: bestG.opponent,
          points: bestG.points || 0,
          rebounds: bestG.rebounds || 0,
          assists: bestG.assists || 0,
          steals: bestG.steals || 0,
          fgPct: (bestG.fgAttempted || 0) > 0 ? Math.round(((bestG.fgMade || 0) / (bestG.fgAttempted || 0)) * 1000) / 10 : 0,
        };
      }
    }

    const whatIf: Array<{stat: string, label: string, current: number, needed: number, unlocksLevel: string}> = [];
    for (const key of statKeys) {
      const current = playerStats[key];
      const target = nextBenchmark[key];
      if (current < target) {
        const percentOfT = target > 0 ? (current / target) * 100 : 0;
        whatIf.push({
          stat: key,
          label: BENCHMARK_STAT_LABELS[key] || key,
          current,
          needed: target,
          unlocksLevel: nextLevel,
        });
      }
    }
    whatIf.sort((a, b) => {
      const pctA = a.needed > 0 ? (a.current / a.needed) * 100 : 0;
      const pctB = b.needed > 0 ? (b.current / b.needed) * 100 : 0;
      return pctB - pctA;
    });
    const topWhatIf = whatIf.slice(0, 3);

    let peerRanking: {
      totalPeers: number,
      rankings: Array<{ stat: string, label: string, rank: number, totalAtPosition: number }>
    } = { totalPeers: 0, rankings: [] };

    try {
      const allPlayers = await storage.getPlayersWithStats();
      const basketballPlayers = allPlayers.filter(p => {
        const bbGames = p.games.filter(g => g.sport === 'basketball');
        return bbGames.length >= 3;
      });

      if (basketballPlayers.length >= 2) {
        const samePositionPlayers = basketballPlayers.filter(p => p.position === position);

        if (samePositionPlayers.length >= 1) {
          const peerStatsMap: Array<{ playerId: number, stats: Record<string, number> }> = [];
          for (const p of samePositionPlayers) {
            const bbGames = p.games.filter(g => g.sport === 'basketball');
            const pStats = computeStats(bbGames);
            peerStatsMap.push({ playerId: p.id, stats: pStats as unknown as Record<string, number> });
          }

          const rankings: Array<{ stat: string, label: string, rank: number, totalAtPosition: number }> = [];
          for (const key of statKeys) {
            const sorted = [...peerStatsMap].sort((a, b) => (b.stats[key] || 0) - (a.stats[key] || 0));
            const rank = sorted.findIndex(p => p.playerId === playerId) + 1;
            if (rank > 0) {
              rankings.push({
                stat: key,
                label: BENCHMARK_STAT_LABELS[key] || key,
                rank,
                totalAtPosition: samePositionPlayers.length,
              });
            }
          }

          peerRanking = {
            totalPeers: basketballPlayers.length,
            rankings,
          };
        }
      }
    } catch (err) {
      console.error('Error computing peer rankings:', err);
    }
    
    res.json({
      ready: true,
      position,
      gamesAnalyzed: gamesCount,
      playerStats,
      recentStats,
      currentLevel,
      nextLevel,
      overallPercentile,
      gaps,
      weeklyFocus,
      benchmarks: nextBenchmark,
      bestGame,
      peerRanking,
      whatIf: topWhatIf,
    });
  });

  // === RECRUITER FEATURES ===

  app.post("/api/recruiter/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      const existing = await storage.getRecruiterProfileByUserId(userId);
      if (existing) return res.status(400).json({ message: "Recruiter profile already exists" });

      const { schoolName, division, title, schoolEmail, phone, bio, state, conference } = req.body;

      if (!schoolName || !division || !title || !schoolEmail) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (!schoolEmail.toLowerCase().endsWith('.edu')) {
        return res.status(400).json({ message: "School email must be a .edu address" });
      }

      const profile = await storage.createRecruiterProfile({
        userId,
        schoolName,
        division,
        title,
        schoolEmail: schoolEmail.toLowerCase(),
        phone: phone || null,
        bio: bio || null,
        state: state || null,
        conference: conference || null,
        sport: "basketball",
        isVerified: false,
      });

      res.status(201).json(profile);
    } catch (error) {
      console.error("Error creating recruiter profile:", error);
      res.status(500).json({ message: "Failed to create recruiter profile" });
    }
  });

  app.get("/api/recruiter/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      const profile = await storage.getRecruiterProfileByUserId(userId);
      if (!profile) return res.status(404).json({ message: "Recruiter profile not found" });

      res.json(profile);
    } catch (error) {
      console.error("Error getting recruiter profile:", error);
      res.status(500).json({ message: "Failed to get recruiter profile" });
    }
  });

  app.patch("/api/recruiter/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      const profile = await storage.getRecruiterProfileByUserId(userId);
      if (!profile) return res.status(404).json({ message: "Recruiter profile not found" });

      const updates = req.body;
      if (updates.schoolEmail && !updates.schoolEmail.toLowerCase().endsWith('.edu')) {
        return res.status(400).json({ message: "School email must be a .edu address" });
      }

      const updated = await storage.updateRecruiterProfile(profile.id, { ...updates, updatedAt: new Date() });
      res.json(updated);
    } catch (error) {
      console.error("Error updating recruiter profile:", error);
      res.status(500).json({ message: "Failed to update recruiter profile" });
    }
  });

  app.get("/api/recruiter/profile/:id", async (req, res) => {
    try {
      const profile = await storage.getRecruiterProfile(parseInt(req.params.id));
      if (!profile) return res.status(404).json({ message: "Recruiter not found" });
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to get recruiter profile" });
    }
  });

  app.post("/api/admin/recruiter/:id/verify", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      if (!isAppOwner(userId)) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const updated = await storage.updateRecruiterProfile(parseInt(req.params.id), { isVerified: true, updatedAt: new Date() });
      if (!updated) return res.status(404).json({ message: "Recruiter not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to verify recruiter" });
    }
  });

  app.get("/api/recruiter/players", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      const recruiterProfile = await storage.getRecruiterProfileByUserId(userId);
      if (!recruiterProfile) return res.status(403).json({ message: "Recruiter profile required" });

      const allPlayers = await storage.getPlayers();

      const blockedByPlayers = await db.select({ playerId: recruiterBlocks.playerId })
        .from(recruiterBlocks)
        .where(eq(recruiterBlocks.recruiterId, recruiterProfile.id));
      const blockedPlayerIds = new Set(blockedByPlayers.map(b => b.playerId));

      let filteredPlayers = allPlayers.filter(p => {
        if (p.sport !== 'basketball') return false;
        if (p.profileVisibility === 'hidden') return false;
        if (blockedPlayerIds.has(p.id)) return false;
        return true;
      });

      const { position, state, graduationYear, minGrade, openToRecruiting } = req.query;
      if (position) filteredPlayers = filteredPlayers.filter(p => p.position === position);
      if (state) filteredPlayers = filteredPlayers.filter(p => p.state === state);
      if (graduationYear) filteredPlayers = filteredPlayers.filter(p => p.graduationYear === parseInt(graduationYear as string));
      if (openToRecruiting === 'true') filteredPlayers = filteredPlayers.filter(p => p.openToRecruiting);

      filteredPlayers.sort((a, b) => {
        if (a.openToRecruiting && !b.openToRecruiting) return -1;
        if (!a.openToRecruiting && b.openToRecruiting) return 1;
        return (a.name || '').localeCompare(b.name || '');
      });

      const result = filteredPlayers.map(p => ({
        id: p.id,
        name: p.name,
        position: p.position,
        height: p.height,
        team: p.team,
        school: p.showSchool ? p.school : null,
        state: p.state,
        city: p.city,
        graduationYear: p.graduationYear,
        gpa: p.showGpa ? p.gpa : null,
        level: p.level,
        photoUrl: p.photoUrl,
        currentTier: p.currentTier,
        totalXp: p.totalXp,
        openToRecruiting: p.openToRecruiting,
        highlightVideoUrl: p.highlightVideoUrl,
        username: p.username,
      }));

      res.json(result);
    } catch (error) {
      console.error("Error searching players:", error);
      res.status(500).json({ message: "Failed to search players" });
    }
  });

  app.get("/api/recruiter/bookmarks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      const profile = await storage.getRecruiterProfileByUserId(userId);
      if (!profile) return res.status(403).json({ message: "Recruiter profile required" });

      const bookmarks = await storage.getRecruiterBookmarks(profile.id);
      res.json(bookmarks);
    } catch (error) {
      res.status(500).json({ message: "Failed to get bookmarks" });
    }
  });

  app.post("/api/recruiter/bookmarks/:playerId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      const profile = await storage.getRecruiterProfileByUserId(userId);
      if (!profile) return res.status(403).json({ message: "Recruiter profile required" });

      const playerId = parseInt(req.params.playerId);
      const existing = await storage.getRecruiterBookmarkForPlayer(profile.id, playerId);
      if (existing) return res.status(400).json({ message: "Already bookmarked" });

      const bookmark = await storage.createRecruiterBookmark({
        recruiterId: profile.id,
        playerId,
        notes: req.body.notes || null,
      });
      res.status(201).json(bookmark);
    } catch (error) {
      res.status(500).json({ message: "Failed to bookmark player" });
    }
  });

  app.delete("/api/recruiter/bookmarks/:playerId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      const profile = await storage.getRecruiterProfileByUserId(userId);
      if (!profile) return res.status(403).json({ message: "Recruiter profile required" });

      await storage.deleteRecruiterBookmark(profile.id, parseInt(req.params.playerId));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove bookmark" });
    }
  });

  app.post("/api/recruiter/signals/:playerId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      const profile = await storage.getRecruiterProfileByUserId(userId);
      if (!profile) return res.status(403).json({ message: "Recruiter profile required" });

      const playerId = parseInt(req.params.playerId);
      const { signalType, message } = req.body;

      if (!['watching', 'interested', 'requesting_film'].includes(signalType)) {
        return res.status(400).json({ message: "Invalid signal type" });
      }

      const blocked = await storage.isRecruiterBlocked(playerId, profile.id);
      if (blocked) return res.status(403).json({ message: "Cannot send signal to this player" });

      const signal = await storage.createInterestSignal({
        recruiterId: profile.id,
        playerId,
        signalType,
        message: message || null,
        isRead: false,
      });
      res.status(201).json(signal);
    } catch (error) {
      res.status(500).json({ message: "Failed to send signal" });
    }
  });

  app.post("/api/recruiter/views/:playerId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      const profile = await storage.getRecruiterProfileByUserId(userId);
      if (!profile) return res.status(403).json({ message: "Recruiter profile required" });

      await storage.logProfileView(profile.id, parseInt(req.params.playerId));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to log view" });
    }
  });

  // === PUBLIC RECRUITER DIRECTORY ===

  app.get("/api/recruiters/directory", async (req, res) => {
    try {
      const { sport, division, conference, state, search } = req.query;

      // Build the WHERE conditions
      const conditions = [eq(recruiterProfiles.isVerified, true)];

      if (sport && typeof sport === "string") {
        conditions.push(eq(recruiterProfiles.sport, sport));
      }

      if (division && typeof division === "string") {
        conditions.push(eq(recruiterProfiles.division, division));
      }

      if (conference && typeof conference === "string") {
        conditions.push(eq(recruiterProfiles.conference, conference));
      }

      if (state && typeof state === "string") {
        conditions.push(eq(recruiterProfiles.state, state));
      }

      if (search && typeof search === "string") {
        const searchCondition = or(
          ilike(recruiterProfiles.schoolName, `%${search}%`),
          ilike(recruiterProfiles.title, `%${search}%`)
        );
        if (searchCondition) conditions.push(searchCondition);
      }

      const recruiters = await db
        .select({
          id: recruiterProfiles.id,
          schoolName: recruiterProfiles.schoolName,
          division: recruiterProfiles.division,
          title: recruiterProfiles.title,
          schoolEmail: recruiterProfiles.schoolEmail,
          phone: recruiterProfiles.phone,
          bio: recruiterProfiles.bio,
          state: recruiterProfiles.state,
          conference: recruiterProfiles.conference,
          sport: recruiterProfiles.sport,
          isVerified: recruiterProfiles.isVerified,
          schoolLogoUrl: recruiterProfiles.schoolLogoUrl,
          createdAt: recruiterProfiles.createdAt,
        })
        .from(recruiterProfiles)
        .where(and(...conditions))
        .orderBy(recruiterProfiles.schoolName);

      res.json(recruiters);
    } catch (error) {
      console.error("Error fetching recruiter directory:", error);
      res.status(500).json({ message: "Failed to fetch recruiter directory" });
    }
  });

  app.get("/api/colleges/:id/recruiters", async (req, res) => {
    try {
      const collegeId = parseInt(req.params.id);

      // Get the college to find its name and shortName
      const college = await db
        .select()
        .from(colleges)
        .where(eq(colleges.id, collegeId))
        .limit(1);

      if (!college || college.length === 0) {
        return res.status(404).json({ message: "College not found" });
      }

      const collegeData = college[0];
      const collegeName = collegeData.name;
      const shortName = collegeData.shortName;

      const nameConditions = shortName
        ? or(eq(recruiterProfiles.schoolName, collegeName), eq(recruiterProfiles.schoolName, shortName))
        : eq(recruiterProfiles.schoolName, collegeName);
      const conditions: SQL<unknown>[] = [eq(recruiterProfiles.isVerified, true)];
      if (nameConditions) conditions.push(nameConditions);

      const recruiters = await db
        .select({
          id: recruiterProfiles.id,
          schoolName: recruiterProfiles.schoolName,
          division: recruiterProfiles.division,
          title: recruiterProfiles.title,
          schoolEmail: recruiterProfiles.schoolEmail,
          phone: recruiterProfiles.phone,
          bio: recruiterProfiles.bio,
          state: recruiterProfiles.state,
          conference: recruiterProfiles.conference,
          sport: recruiterProfiles.sport,
          isVerified: recruiterProfiles.isVerified,
          schoolLogoUrl: recruiterProfiles.schoolLogoUrl,
          createdAt: recruiterProfiles.createdAt,
        })
        .from(recruiterProfiles)
        .where(and(...conditions))
        .orderBy(recruiterProfiles.schoolName);

      res.json(recruiters);
    } catch (error) {
      console.error("Error fetching college recruiters:", error);
      res.status(500).json({ message: "Failed to fetch college recruiters" });
    }
  });

  app.get("/api/players/:playerId/whos-watching", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      const playerId = parseInt(req.params.playerId);
      const player = await storage.getPlayer(playerId);
      if (!player || player.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const [views, signals, viewCount, blockedRecruiters] = await Promise.all([
        storage.getProfileViewsForPlayer(playerId),
        storage.getSignalsForPlayer(playerId),
        storage.getRecruiterProfileViewCount(playerId),
        storage.getBlockedRecruiters(playerId),
      ]);

      await storage.markSignalsRead(playerId);

      const unreadSignals = signals.filter((s: any) => !s.isRead).length;

      res.json({
        views,
        signals,
        totalViews: viewCount,
        unreadSignals,
        blockedRecruiters,
      });
    } catch (error) {
      console.error("Error getting who's watching:", error);
      res.status(500).json({ message: "Failed to get recruiter activity" });
    }
  });

  app.patch("/api/players/:playerId/visibility", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      const playerId = parseInt(req.params.playerId);
      const player = await storage.getPlayer(playerId);
      if (!player || player.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { profileVisibility, showEmail, showPhone, showSchool, showGpa, openToRecruiting, showStatsToCoaches, showContactToCoaches, showDetailedStatsToGuardians, showGradesToGuardians } = req.body;

      const updates: any = {};
      if (profileVisibility !== undefined) updates.profileVisibility = profileVisibility;
      if (showEmail !== undefined) updates.showEmail = showEmail;
      if (showPhone !== undefined) updates.showPhone = showPhone;
      if (showSchool !== undefined) updates.showSchool = showSchool;
      if (showGpa !== undefined) updates.showGpa = showGpa;
      if (openToRecruiting !== undefined) updates.openToRecruiting = openToRecruiting;
      if (showStatsToCoaches !== undefined) updates.showStatsToCoaches = showStatsToCoaches;
      if (showContactToCoaches !== undefined) updates.showContactToCoaches = showContactToCoaches;
      if (showDetailedStatsToGuardians !== undefined) updates.showDetailedStatsToGuardians = showDetailedStatsToGuardians;
      if (showGradesToGuardians !== undefined) updates.showGradesToGuardians = showGradesToGuardians;

      const updated = await storage.updatePlayer(playerId, updates);
      res.json(updated);
    } catch (error) {
      console.error("Error updating visibility:", error);
      res.status(500).json({ message: "Failed to update visibility" });
    }
  });

  app.post("/api/players/:playerId/block-recruiter/:recruiterId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      const playerId = parseInt(req.params.playerId);
      const player = await storage.getPlayer(playerId);
      if (!player || player.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const block = await storage.blockRecruiter(playerId, parseInt(req.params.recruiterId), req.body.reason);
      res.status(201).json(block);
    } catch (error) {
      res.status(500).json({ message: "Failed to block recruiter" });
    }
  });

  app.delete("/api/players/:playerId/block-recruiter/:recruiterId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      const playerId = parseInt(req.params.playerId);
      const player = await storage.getPlayer(playerId);
      if (!player || player.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.unblockRecruiter(playerId, parseInt(req.params.recruiterId));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to unblock recruiter" });
    }
  });

  app.get("/api/players/:playerId/signal-count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      const playerId = parseInt(req.params.playerId);
      const player = await storage.getPlayer(playerId);
      if (!player || player.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const signals = await storage.getSignalsForPlayer(playerId);
      const unread = signals.filter((s: any) => !s.isRead).length;
      const total = signals.length;

      res.json({ unread, total });
    } catch (error) {
      res.status(500).json({ message: "Failed to get signal count" });
    }
  });

  // === SEASONS API ===

  app.get('/api/seasons', async (req, res) => {
    try {
      const allSeasons = await storage.getSeasons();
      res.json(allSeasons);
    } catch (error) {
      console.error('Error fetching seasons:', error);
      res.status(500).json({ message: "Failed to fetch seasons" });
    }
  });

  // === CAREER TIMELINE API ===

  app.get('/api/players/:id/career-timeline', async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      const allGames = player.games || [];
      const allSeasons = await storage.getSeasons();
      const history = await storage.getTeamHistory(playerId);
      const sportSeasons = allSeasons.filter(s => s.sport === player.sport);

      const seasonMap: Record<string, { season: any; games: Game[]; teamName: string | null }> = {};

      for (const s of sportSeasons) {
        seasonMap[s.name] = { season: s, games: [], teamName: null };
      }
      seasonMap["Unassigned"] = { season: null, games: [], teamName: null };

      for (const game of allGames) {
        const key = game.season || "Unassigned";
        if (!seasonMap[key]) {
          seasonMap[key] = { season: null, games: [], teamName: null };
        }
        seasonMap[key].games.push(game);
      }

      for (const entry of history) {
        if (entry.season && seasonMap[entry.season]) {
          seasonMap[entry.season].teamName = entry.teamName;
        }
      }

      const gradeToNum = (g: string | null): number => {
        if (!g) return 0;
        const map: Record<string, number> = { 'A+': 97, 'A': 93, 'A-': 90, 'B+': 87, 'B': 83, 'B-': 80, 'C+': 77, 'C': 73, 'C-': 70, 'D': 65, 'F': 50 };
        return map[g] || 0;
      };

      const timelineEntries = Object.entries(seasonMap)
        .filter(([, data]) => data.games.length > 0)
        .map(([seasonName, data]) => {
          const g = data.games;
          const gamesPlayed = g.length;
          const totalPts = g.reduce((s, gm) => s + (gm.points || 0), 0);
          const totalReb = g.reduce((s, gm) => s + (gm.rebounds || 0), 0);
          const totalAst = g.reduce((s, gm) => s + (gm.assists || 0), 0);
          const totalStl = g.reduce((s, gm) => s + (gm.steals || 0), 0);
          const totalBlk = g.reduce((s, gm) => s + (gm.blocks || 0), 0);
          const gradeNums = g.map(gm => gradeToNum(gm.grade)).filter(n => n > 0);
          const avgGradeNum = gradeNums.length > 0 ? gradeNums.reduce((a, b) => a + b, 0) / gradeNums.length : 0;

          return {
            season: seasonName,
            seasonData: data.season,
            teamName: data.teamName || player.team,
            gamesPlayed,
            averages: {
              points: gamesPlayed > 0 ? +(totalPts / gamesPlayed).toFixed(1) : 0,
              rebounds: gamesPlayed > 0 ? +(totalReb / gamesPlayed).toFixed(1) : 0,
              assists: gamesPlayed > 0 ? +(totalAst / gamesPlayed).toFixed(1) : 0,
              steals: gamesPlayed > 0 ? +(totalStl / gamesPlayed).toFixed(1) : 0,
              blocks: gamesPlayed > 0 ? +(totalBlk / gamesPlayed).toFixed(1) : 0,
            },
            avgGradeNum: +avgGradeNum.toFixed(1),
            overallGrade: avgGradeNum >= 90 ? 'A' : avgGradeNum >= 80 ? 'B' : avgGradeNum >= 70 ? 'C' : avgGradeNum >= 65 ? 'D' : 'F',
          };
        })
        .sort((a, b) => {
          if (a.seasonData && b.seasonData) {
            return new Date(a.seasonData.startDate).getTime() - new Date(b.seasonData.startDate).getTime();
          }
          if (!a.seasonData) return 1;
          if (!b.seasonData) return -1;
          return 0;
        });

      const withGrowth = timelineEntries.map((entry, idx) => {
        const prev = idx > 0 ? timelineEntries[idx - 1] : null;
        return {
          ...entry,
          growth: prev ? {
            points: +(entry.averages.points - prev.averages.points).toFixed(1),
            rebounds: +(entry.averages.rebounds - prev.averages.rebounds).toFixed(1),
            assists: +(entry.averages.assists - prev.averages.assists).toFixed(1),
            gradeChange: +(entry.avgGradeNum - prev.avgGradeNum).toFixed(1),
          } : null,
        };
      });

      const careerTotals = {
        gamesPlayed: allGames.length,
        totalPoints: allGames.reduce((s, g) => s + (g.points || 0), 0),
        totalRebounds: allGames.reduce((s, g) => s + (g.rebounds || 0), 0),
        totalAssists: allGames.reduce((s, g) => s + (g.assists || 0), 0),
        totalSteals: allGames.reduce((s, g) => s + (g.steals || 0), 0),
        totalBlocks: allGames.reduce((s, g) => s + (g.blocks || 0), 0),
        seasonsPlayed: timelineEntries.length,
      };

      res.json({ careerTotals, timeline: withGrowth });
    } catch (error) {
      console.error('Error fetching career timeline:', error);
      res.status(500).json({ message: "Failed to fetch career timeline" });
    }
  });

  // === TEAM HISTORY API ===

  app.get('/api/players/:id/team-history', async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const history = await storage.getTeamHistory(playerId);
      res.json(history);
    } catch (error) {
      console.error('Error fetching team history:', error);
      res.status(500).json({ message: "Failed to fetch team history" });
    }
  });

  app.post('/api/players/:id/team-history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const playerId = parseInt(req.params.id);
      const player = await storage.getPlayer(playerId);
      if (!player) return res.status(404).json({ message: "Player not found" });
      const user = await authStorage.getUser(userId);
      if (player.userId !== userId && (!user || (user.role !== 'coach' && user.role !== 'admin'))) {
        return res.status(403).json({ message: "Not authorized to modify this player's team history" });
      }
      await db.update(teamHistory).set({ isCurrent: false }).where(and(eq(teamHistory.playerId, playerId), eq(teamHistory.isCurrent, true)));
      const parsed = insertTeamHistorySchema.parse({ ...req.body, playerId });
      const entry = await storage.addTeamHistoryEntry(parsed);
      res.json(entry);
    } catch (error: any) {
      console.error('Error adding team history entry:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add team history entry" });
    }
  });

  app.patch('/api/players/:id/team-history/:entryId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const playerId = parseInt(req.params.id);
      const player = await storage.getPlayer(playerId);
      if (!player) return res.status(404).json({ message: "Player not found" });
      const user = await authStorage.getUser(userId);
      if (player.userId !== userId && (!user || (user.role !== 'coach' && user.role !== 'admin'))) {
        return res.status(403).json({ message: "Not authorized to modify this player's team history" });
      }
      const entryId = parseInt(req.params.entryId);
      const updated = await storage.updateTeamHistoryEntry(entryId, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Team history entry not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error('Error updating team history entry:', error);
      res.status(500).json({ message: "Failed to update team history entry" });
    }
  });

  // === GUARDIAN / FAMILY SYSTEM ROUTES ===

  app.post("/api/guardian/request", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await authStorage.getUser(userId);
      if (!user || user.role !== 'guardian') {
        return res.status(403).json({ message: "Guardian role required" });
      }

      const { playerId, relationship, inviteCode } = req.body;

      let targetPlayerId = playerId;

      if (inviteCode && !playerId) {
        const code = inviteCode.toUpperCase();
        if (code.startsWith("FAM-")) {
          const allPlayers = await storage.getPlayers();
          let matchedPlayer = null;
          for (const p of allPlayers) {
            const hash = crypto.createHash('sha256').update(`caliber-family-${p.id}-invite-salt`).digest('hex').slice(0, 6).toUpperCase();
            if (`FAM-${hash}` === code) {
              matchedPlayer = p;
              break;
            }
          }
          if (!matchedPlayer) {
            return res.status(404).json({ message: "Invalid invite code" });
          }
          targetPlayerId = matchedPlayer.id;
        } else {
          const existingLink = await storage.getGuardianLinkByCode(inviteCode);
          if (!existingLink) {
            return res.status(404).json({ message: "Invalid invite code" });
          }
          targetPlayerId = existingLink.playerId;
        }
      }

      if (!targetPlayerId) {
        return res.status(400).json({ message: "Player ID or invite code required" });
      }

      const player = await storage.getPlayer(targetPlayerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      const link = await storage.createGuardianLink({
        guardianUserId: userId,
        playerId: targetPlayerId,
        relationship: relationship || "parent",
        status: "pending",
        inviteCode: inviteCode || null,
      });

      if (player.userId) {
        await storage.createNotification({
          userId: player.userId,
          playerId: targetPlayerId,
          notificationType: "guardian_request",
          title: "Family Link Request",
          message: `${user.firstName || "A guardian"} wants to link as your ${relationship || "parent"}`,
          relatedId: link.id,
          relatedType: "guardian_link",
          isRead: false,
        });
      }

      res.status(201).json(link);
    } catch (error) {
      console.error("Error creating guardian link request:", error);
      res.status(500).json({ message: "Failed to create guardian link request" });
    }
  });

  app.patch("/api/guardian/links/:id/approve", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const linkId = parseInt(req.params.id);

      const link = await storage.getGuardianLink(linkId);
      if (!link) {
        return res.status(404).json({ message: "Guardian link not found" });
      }

      const player = await storage.getPlayer(link.playerId);
      if (!player || player.userId !== userId) {
        return res.status(403).json({ message: "Only the player can approve guardian links" });
      }

      if (link.status !== "pending") {
        return res.status(400).json({ message: "Link is not in pending status" });
      }

      const updated = await storage.approveGuardianLink(linkId);

      await storage.createNotification({
        userId: link.guardianUserId,
        notificationType: "guardian_approved",
        title: "Family Link Approved",
        message: `${player.name} approved your family link request`,
        relatedId: link.id,
        relatedType: "guardian_link",
        isRead: false,
      });

      res.json(updated);
    } catch (error) {
      console.error("Error approving guardian link:", error);
      res.status(500).json({ message: "Failed to approve guardian link" });
    }
  });

  app.patch("/api/guardian/links/:id/revoke", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const linkId = parseInt(req.params.id);

      const link = await storage.getGuardianLink(linkId);
      if (!link) {
        return res.status(404).json({ message: "Guardian link not found" });
      }

      const player = await storage.getPlayer(link.playerId);
      const isGuardian = link.guardianUserId === userId;
      const isPlayerOwner = player && player.userId === userId;

      if (!isGuardian && !isPlayerOwner) {
        return res.status(403).json({ message: "Only the guardian or player can revoke this link" });
      }

      const updated = await storage.revokeGuardianLink(linkId);
      res.json(updated);
    } catch (error) {
      console.error("Error revoking guardian link:", error);
      res.status(500).json({ message: "Failed to revoke guardian link" });
    }
  });

  app.get("/api/guardian/players", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const links = await storage.getLinkedPlayersByGuardian(userId);

      const playersData = await Promise.all(
        links.map(async (link) => {
          const player = await storage.getPlayer(link.playerId);
          return { link, player };
        })
      );

      res.json(playersData.filter((p) => p.player));
    } catch (error) {
      console.error("Error getting guardian players:", error);
      res.status(500).json({ message: "Failed to get linked players" });
    }
  });

  app.get("/api/players/:id/guardians", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const playerId = parseInt(req.params.id);
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      if (player.userId !== userId) {
        const user = await authStorage.getUser(userId);
        if (!user || user.role !== 'admin') {
          return res.status(403).json({ message: "Only the player or admin can view guardians" });
        }
      }
      const guardiansList = await storage.getGuardiansByPlayer(playerId);
      res.json(guardiansList);
    } catch (error) {
      console.error("Error getting player guardians:", error);
      res.status(500).json({ message: "Failed to get guardians" });
    }
  });

  app.get("/api/guardian/players/:playerId/dashboard", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const playerId = parseInt(req.params.playerId);

      const links = await storage.getLinkedPlayersByGuardian(userId);
      const hasAccess = links.some((l) => l.playerId === playerId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Not linked to this player" });
      }

      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      const recentGames = player.games.slice(0, 5);
      const playerBadges = await storage.getPlayerBadges(playerId);
      const playerStreaksList = await storage.getPlayerStreaks(playerId);
      const milestones = await storage.getPlayerMilestones(playerId);
      const playerGoalsList = await storage.getPlayerGoals(playerId);

      const gamesThisSeason = player.games.length;
      let gradeTrend = "stable";
      if (recentGames.length >= 2) {
        const gradeToNum = (g: string | null) => {
          const map: Record<string, number> = { "A+": 95, "A": 87, "A-": 83, "B+": 78, "B": 73, "B-": 68, "C+": 63, "C": 58, "C-": 53, "D": 45, "F": 30 };
          return map[g || "C"] || 58;
        };
        const latestGrade = gradeToNum(recentGames[0]?.grade);
        const prevGrade = gradeToNum(recentGames[1]?.grade);
        if (latestGrade > prevGrade) gradeTrend = "up";
        else if (latestGrade < prevGrade) gradeTrend = "down";
      }

      const showDetailed = player.showDetailedStatsToGuardians !== false;
      const showGrades = player.showGradesToGuardians !== false;

      const filteredGames = showDetailed ? recentGames : recentGames.map((g: any) => ({
        id: g.id,
        date: g.date,
        sport: g.sport,
        grade: showGrades ? g.grade : null,
      }));

      res.json({
        player: {
          id: player.id,
          name: player.name,
          sport: player.sport,
          position: player.position,
          team: player.team,
          photoUrl: player.photoUrl,
          totalXp: player.totalXp,
          currentTier: player.currentTier,
        },
        recentGames: filteredGames,
        badges: playerBadges,
        streaks: playerStreaksList,
        milestones: milestones.slice(0, 10),
        goals: playerGoalsList,
        gamesThisSeason,
        gradeTrend: showGrades ? gradeTrend : "hidden",
        currentGrade: showGrades ? (recentGames[0]?.grade || null) : null,
        privacyRestrictions: {
          detailedStatsHidden: !showDetailed,
          gradesHidden: !showGrades,
        },
      });
    } catch (error) {
      console.error("Error getting guardian dashboard:", error);
      res.status(500).json({ message: "Failed to get dashboard data" });
    }
  });

  app.get("/api/players/:id/family-invite-code", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const playerId = parseInt(req.params.id);

      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      if (player.userId !== userId) {
        return res.status(403).json({ message: "Only the player can generate their invite code" });
      }

      const hash = crypto.createHash('sha256').update(`caliber-family-${playerId}-invite-salt`).digest('hex').slice(0, 6).toUpperCase();
      const code = `FAM-${hash}`;

      res.json({ code, playerId });
    } catch (error) {
      console.error("Error generating family invite code:", error);
      res.status(500).json({ message: "Failed to generate invite code" });
    }
  });

  app.get("/api/players/by-family-code/:code", isAuthenticated, async (req: any, res) => {
    try {
      const code = req.params.code.toUpperCase();

      const allPlayers = await storage.getPlayers();
      let matchedPlayer = null;

      for (const player of allPlayers) {
        const hash = crypto.createHash('sha256').update(`caliber-family-${player.id}-invite-salt`).digest('hex').slice(0, 6).toUpperCase();
        const expectedCode = `FAM-${hash}`;
        if (expectedCode === code) {
          matchedPlayer = player;
          break;
        }
      }

      if (!matchedPlayer) {
        return res.status(404).json({ message: "Invalid invite code" });
      }

      res.json({ playerId: matchedPlayer.id, playerName: matchedPlayer.name });
    } catch (error) {
      console.error("Error resolving family invite code:", error);
      res.status(500).json({ message: "Failed to resolve invite code" });
    }
  });

  app.get("/api/guardian/pending", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await authStorage.getUser(userId);
      if (!user || !user.playerId) {
        return res.status(400).json({ message: "Player profile required" });
      }

      const pending = await storage.getPendingGuardianRequests(user.playerId);
      res.json(pending);
    } catch (error) {
      console.error("Error getting pending guardian requests:", error);
      res.status(500).json({ message: "Failed to get pending requests" });
    }
  });

  app.get('/api/admin/guardian-links', isAdmin, async (req, res) => {
    try {
      const statusFilter = req.query.status as string | undefined;
      let result;
      if (statusFilter && ['pending', 'approved', 'revoked'].includes(statusFilter)) {
        result = await db.execute(sql`
          SELECT gl.id, gl.guardian_user_id, gl.player_id, gl.relationship, gl.status, gl.linked_at, gl.approved_at,
            u.first_name as guardian_first_name, u.last_name as guardian_last_name, u.email as guardian_email,
            p.name as player_name
          FROM guardian_links gl
          LEFT JOIN users u ON u.id = gl.guardian_user_id
          LEFT JOIN players p ON p.id = gl.player_id
          WHERE gl.status = ${statusFilter}
          ORDER BY gl.linked_at DESC
        `);
      } else {
        result = await db.execute(sql`
          SELECT gl.id, gl.guardian_user_id, gl.player_id, gl.relationship, gl.status, gl.linked_at, gl.approved_at,
            u.first_name as guardian_first_name, u.last_name as guardian_last_name, u.email as guardian_email,
            p.name as player_name
          FROM guardian_links gl
          LEFT JOIN users u ON u.id = gl.guardian_user_id
          LEFT JOIN players p ON p.id = gl.player_id
          ORDER BY gl.linked_at DESC
        `);
      }
      const links = result.rows.map((r: any) => ({
        id: r.id,
        guardianUserId: r.guardian_user_id,
        guardianName: [r.guardian_first_name, r.guardian_last_name].filter(Boolean).join(' ') || 'Unknown',
        guardianEmail: r.guardian_email || '',
        playerId: r.player_id,
        playerName: r.player_name || 'Unknown',
        relationship: r.relationship,
        status: r.status,
        linkedAt: r.linked_at,
        approvedAt: r.approved_at,
      }));
      res.json(links);
    } catch (err) {
      console.error('Admin guardian links error:', err);
      res.status(500).json({ error: 'Could not fetch guardian links' });
    }
  });

  app.patch('/api/admin/guardian-links/:id', isAdmin, async (req, res) => {
    try {
      const linkId = parseInt(req.params.id);
      const { status } = req.body;
      if (!status || !['approved', 'revoked'].includes(status)) {
        return res.status(400).json({ error: 'Status must be approved or revoked' });
      }
      const updateData: any = { status };
      if (status === 'approved') {
        updateData.approvedAt = new Date();
      }
      const [updated] = await db.update(guardianLinks)
        .set(updateData)
        .where(eq(guardianLinks.id, linkId))
        .returning();
      if (!updated) {
        return res.status(404).json({ error: 'Guardian link not found' });
      }
      res.json(updated);
    } catch (err) {
      console.error('Admin update guardian link error:', err);
      res.status(500).json({ error: 'Could not update guardian link' });
    }
  });

  app.post('/api/admin/seasons', isAdmin, async (req, res) => {
    try {
      const { name, sport, startDate, endDate, isCurrent } = req.body;
      if (!name || !sport || !startDate || !endDate) {
        return res.status(400).json({ error: 'name, sport, startDate, and endDate are required' });
      }
      if (isCurrent) {
        await db.update(seasons)
          .set({ isCurrent: false })
          .where(and(eq(seasons.sport, sport), eq(seasons.isCurrent, true)));
      }
      const [created] = await db.insert(seasons).values({
        name,
        sport,
        startDate,
        endDate,
        isCurrent: isCurrent || false,
      }).returning();
      res.json(created);
    } catch (err) {
      console.error('Admin create season error:', err);
      res.status(500).json({ error: 'Could not create season' });
    }
  });

  app.patch('/api/admin/seasons/:id', isAdmin, async (req, res) => {
    try {
      const seasonId = parseInt(req.params.id);
      const { name, startDate, endDate, isCurrent } = req.body;
      if (isCurrent === true) {
        const [existing] = await db.select().from(seasons).where(eq(seasons.id, seasonId));
        if (existing) {
          await db.update(seasons)
            .set({ isCurrent: false })
            .where(and(eq(seasons.sport, existing.sport), eq(seasons.isCurrent, true), ne(seasons.id, seasonId)));
        }
      }
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (startDate !== undefined) updateData.startDate = startDate;
      if (endDate !== undefined) updateData.endDate = endDate;
      if (isCurrent !== undefined) updateData.isCurrent = isCurrent;
      const [updated] = await db.update(seasons)
        .set(updateData)
        .where(eq(seasons.id, seasonId))
        .returning();
      if (!updated) {
        return res.status(404).json({ error: 'Season not found' });
      }
      res.json(updated);
    } catch (err) {
      console.error('Admin update season error:', err);
      res.status(500).json({ error: 'Could not update season' });
    }
  });

  app.get('/api/admin/activity', isAdmin, async (req, res) => {
    try {
      const recentGamesResult = await db.execute(sql`
        SELECT g.id, g.player_id, g.sport, g.date, g.grade, g.created_at, p.name as player_name
        FROM games g
        LEFT JOIN players p ON p.id = g.player_id
        ORDER BY g.created_at DESC
        LIMIT 15
      `);

      const recentUsersResult = await db.execute(sql`
        SELECT id, first_name, last_name, email, role, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 15
      `);

      const recentGuardianLinksResult = await db.execute(sql`
        SELECT gl.*, u.first_name as guardian_first_name, u.last_name as guardian_last_name, p.name as player_name
        FROM guardian_links gl
        LEFT JOIN users u ON u.id = gl.guardian_user_id
        LEFT JOIN players p ON p.id = gl.player_id
        ORDER BY gl.linked_at DESC
        LIMIT 10
      `);

      const recentFeedPostsResult = await db.execute(sql`
        SELECT id, player_id, activity_type, headline, created_at
        FROM feed_activities
        ORDER BY created_at DESC
        LIMIT 10
      `);

      res.json({
        recentGames: recentGamesResult.rows,
        recentUsers: recentUsersResult.rows,
        recentGuardianLinks: recentGuardianLinksResult.rows,
        recentFeedPosts: recentFeedPostsResult.rows,
      });
    } catch (err) {
      console.error('Admin activity feed error:', err);
      res.status(500).json({ error: 'Could not fetch activity feed' });
    }
  });

  await seedDatabase();
  await seedSeasons();

  return httpServer;
}

// Helper functions for college match scoring
function calculateAcademicMatch(player: any, college: College): number {
  let score = 70; // Base score
  
  if (player.gpa && college.avgGpaRequired) {
    const playerGpa = parseFloat(player.gpa);
    const requiredGpa = parseFloat(college.avgGpaRequired);
    if (playerGpa >= requiredGpa) {
      score += 20;
    } else if (playerGpa >= requiredGpa - 0.3) {
      score += 10;
    } else {
      score -= 20;
    }
  }
  
  // Academic rating bonus
  if (college.academicRating) {
    if (college.academicRating >= 80) score += 5;
    if (college.academicRating <= 60) score += 10; // Easier to get into
  }
  
  return Math.max(0, Math.min(100, score));
}

function calculateSkillMatch(player: any, college: College): number {
  let score = 60; // Base score
  
  // Check position needs
  if (college.positionNeeds) {
    try {
      const needs = JSON.parse(college.positionNeeds);
      if (Array.isArray(needs) && needs.includes(player.position)) {
        score += 25;
      }
    } catch {
      // Invalid JSON, ignore
    }
  }
  
  // Program strength consideration - stronger programs for top players
  if (college.programStrength) {
    if (player.currentTier === 'MVP' || player.currentTier === 'Hall of Fame') {
      if (college.programStrength >= 80) score += 15;
    } else if (player.currentTier === 'All-Star') {
      if (college.programStrength >= 60 && college.programStrength <= 85) score += 10;
    } else {
      if (college.programStrength <= 70) score += 10;
    }
  }
  
  // Scholarships available bonus
  if (college.scholarshipsAvailable && college.scholarshipsAvailable > 0) {
    score += 10;
  }
  
  return Math.max(0, Math.min(100, score));
}

function calculateStyleMatch(player: any, college: College): number {
  let score = 70; // Base score - most players can adapt
  
  // Position-based style preferences
  if (player.position === 'Guard') {
    if (college.tempoRating && college.tempoRating >= 70) score += 15;
    if (college.offensiveStyle === 'motion' || college.offensiveStyle === 'spread') score += 10;
  } else if (player.position === 'Big') {
    if (college.offensiveStyle === 'pick_and_roll' || college.offensiveStyle === 'iso') score += 10;
    if (college.defensiveStyle === 'zone') score += 5;
  } else if (player.position === 'Wing') {
    if (college.offensiveStyle === 'motion' || college.offensiveStyle === 'spread') score += 10;
    if (college.defensiveStyle === 'switching') score += 10;
  }
  
  return Math.max(0, Math.min(100, score));
}

function calculateLocationMatch(player: any, college: College): number {
  let score = 70; // Base score
  
  // Same state bonus
  if (player.state && college.state && player.state === college.state) {
    score += 20;
  }
  
  // Same region bonus
  const playerRegion = getRegionForState(player.state);
  if (playerRegion && college.region && playerRegion === college.region) {
    score += 10;
  }
  
  return Math.max(0, Math.min(100, score));
}

function getRegionForState(state: string | null | undefined): string | null {
  if (!state) return null;
  
  const regions: Record<string, string[]> = {
    'West': ['CA', 'WA', 'OR', 'NV', 'AZ', 'UT', 'CO', 'NM', 'MT', 'WY', 'ID'],
    'Midwest': ['IL', 'OH', 'MI', 'IN', 'WI', 'MN', 'IA', 'MO', 'KS', 'NE', 'SD', 'ND'],
    'South': ['TX', 'FL', 'GA', 'NC', 'SC', 'VA', 'TN', 'AL', 'MS', 'LA', 'AR', 'KY', 'WV', 'MD', 'DE', 'OK'],
    'East': ['NY', 'PA', 'NJ', 'MA', 'CT', 'RI', 'NH', 'VT', 'ME', 'DC'],
  };
  
  for (const [region, states] of Object.entries(regions)) {
    if (states.includes(state.toUpperCase())) {
      return region;
    }
  }
  
  return null;
}

function generateMatchReasoning(player: any, college: College, score: number): string {
  const reasons: string[] = [];
  
  if (score >= 85) {
    reasons.push(`${college.name} is an excellent fit for ${player.name}'s skill set and profile.`);
  } else if (score >= 70) {
    reasons.push(`${college.name} offers a strong opportunity for ${player.name}.`);
  } else {
    reasons.push(`${college.name} could be a viable option for ${player.name}.`);
  }
  
  if (college.division === 'D1') {
    reasons.push('Division I program with high-level competition.');
  } else if (college.division === 'D2') {
    reasons.push('Division II program with competitive athletics and academic focus.');
  } else if (college.division === 'D3') {
    reasons.push('Division III program emphasizing student-athlete experience.');
  }
  
  if (college.conference) {
    reasons.push(`Competes in the ${college.conference}.`);
  }
  
  return reasons.join(' ');
}

function generateStrengths(player: any, college: College): string {
  const strengths: string[] = [];
  
  if (player.position) {
    strengths.push(`Strong ${player.position} skills`);
  }
  
  if (player.currentTier === 'MVP' || player.currentTier === 'Hall of Fame') {
    strengths.push('Elite performance metrics');
  } else if (player.currentTier === 'All-Star') {
    strengths.push('Above-average performance consistency');
  }
  
  if (player.height) {
    strengths.push(`Height: ${player.height}`);
  }
  
  return strengths.join(', ') || 'Solid fundamentals and work ethic';
}

function generateDevelopmentAreas(player: any): string {
  const areas: string[] = [];
  
  if (player.currentTier === 'Rookie' || player.currentTier === 'Starter') {
    areas.push('Continue developing game experience');
  }
  
  areas.push('Strength and conditioning');
  areas.push('Mental game and leadership');
  
  return areas.join(', ');
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

async function seedSeasons() {
  const existingSeasons = await storage.getSeasons();
  if (existingSeasons.length > 0) return;

  const seedData = [
    { name: "2023-24", sport: "basketball", startDate: "2023-09-01", endDate: "2024-06-30", isCurrent: false },
    { name: "2024-25", sport: "basketball", startDate: "2024-09-01", endDate: "2025-06-30", isCurrent: false },
    { name: "2025-26", sport: "basketball", startDate: "2025-09-01", endDate: "2026-06-30", isCurrent: true },
  ];

  for (const s of seedData) {
    await storage.createSeason(s);
  }

  const allSeasons = await storage.getSeasons();

  const allGames = await db.select().from(games).where(isNull(games.season));
  for (const game of allGames) {
    const gameDate = new Date(game.date);
    let matchedSeason: string | null = null;
    for (const s of allSeasons) {
      const start = new Date(s.startDate);
      const end = new Date(s.endDate);
      if (gameDate >= start && gameDate <= end) {
        matchedSeason = s.name;
        break;
      }
    }
    if (matchedSeason) {
      await db.update(games).set({ season: matchedSeason }).where(eq(games.id, game.id));
    }
  }

  console.log(`Seeded ${seedData.length} seasons and backfilled ${allGames.length} games`);
}
