import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { players, games, type Game, insertGoalSchema, insertCommentSchema, insertChallengeSchema, insertTeamSchema, insertTeamMemberSchema, insertTeamPostSchema, XP_REWARDS, TIER_THRESHOLDS, BADGE_DEFINITIONS, SKILL_BADGE_TYPES, type SkillBadgeLevel, insertShotSchema, insertGameNoteSchema, insertPracticeSchema, insertPracticeAttendanceSchema, insertDrillSchema, insertDrillScoreSchema, insertLineupSchema, insertLineupStatSchema, insertOpponentSchema, insertAlertSchema, insertCoachGoalSchema, insertDrillRecommendationSchema } from "@shared/schema";
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
      
      res.json({ ...user, playerProfile });
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
    res.json(player);
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

      const { grade, feedback } = calculateGrade(input, player.position);
      
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
        hustleScore: input.hustleScore,
        defenseRating: input.defenseRating,
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
      
      res.status(201).json({ ...game, xpEarned, newTier, totalXp: updatedPlayer.totalXp, currentTier: updatedPlayer.currentTier });
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

  app.get(api.analytics.compare.path, async (req, res) => {
    const { player1Id, player2Id } = api.analytics.compare.input.parse(req.query);
    const p1 = await storage.getPlayer(player1Id);
    const p2 = await storage.getPlayer(player2Id);
    
    if (!p1 || !p2) {
      return res.status(404).json({ message: "One or both players not found" });
    }

    res.json({ player1: p1, player2: p2 });
  });

  // Video Analysis Endpoint
  app.post('/api/analyze-video', upload.single('video'), async (req, res) => {
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

  // Text-based play analysis (for manual play-by-play input)
  app.post('/api/analyze-plays', async (req, res) => {
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

  app.post('/api/challenges', async (req, res) => {
    try {
      const input = insertChallengeSchema.parse(req.body);
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

  // --- Teams ---

  function generateTeamCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  app.post('/api/teams', async (req, res) => {
    try {
      const { name, sessionId, displayName } = req.body;
      if (!name || !sessionId || !displayName) {
        return res.status(400).json({ message: 'Name, sessionId, and displayName are required' });
      }

      let code = generateTeamCode();
      let existingTeam = await storage.getTeamByCode(code);
      while (existingTeam) {
        code = generateTeamCode();
        existingTeam = await storage.getTeamByCode(code);
      }

      const team = await storage.createTeam({ name, code, createdBy: sessionId });
      await storage.addTeamMember({
        teamId: team.id,
        displayName,
        sessionId,
        role: 'admin',
        playerId: null,
      });

      res.status(201).json(team);
    } catch (err) {
      console.error('Create team error:', err);
      res.status(500).json({ message: 'Error creating team' });
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

  app.post('/api/teams/:id/join', async (req, res) => {
    try {
      const teamId = Number(req.params.id);
      const { sessionId, displayName } = req.body;
      
      if (!sessionId || !displayName) {
        return res.status(400).json({ message: 'SessionId and displayName are required' });
      }

      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }

      const existingMember = await storage.getTeamMember(teamId, sessionId);
      if (existingMember) {
        return res.status(400).json({ message: 'Already a member of this team' });
      }

      const member = await storage.addTeamMember({
        teamId,
        displayName,
        sessionId,
        role: 'member',
        playerId: null,
      });

      res.status(201).json(member);
    } catch (err) {
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

  app.post('/api/teams/:id/posts', async (req, res) => {
    try {
      const teamId = Number(req.params.id);
      const { sessionId, content } = req.body;

      if (!sessionId || !content) {
        return res.status(400).json({ message: 'SessionId and content are required' });
      }

      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }

      const member = await storage.getTeamMember(teamId, sessionId);
      if (!member) {
        return res.status(403).json({ message: 'You must be a member to post' });
      }

      const post = await storage.createTeamPost({
        teamId,
        authorId: member.id,
        content,
      });

      res.status(201).json({ ...post, authorName: member.displayName });
    } catch (err) {
      console.error('Create team post error:', err);
      res.status(500).json({ message: 'Error creating post' });
    }
  });

  app.get('/api/my-teams', async (req, res) => {
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

  app.post('/api/stories', async (req, res) => {
    try {
      const { playerId, templateId, headline, stats, sessionId, isPublic } = req.body;

      if (!playerId || !headline) {
        return res.status(400).json({ message: 'PlayerId and headline are required' });
      }

      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: 'Player not found' });
      }

      const story = await storage.createPlayerStory({
        playerId,
        templateId: templateId || null,
        headline,
        stats: stats ? JSON.stringify(stats) : null,
        sessionId: sessionId || null,
        isPublic: isPublic !== false,
      });

      // Create feed activity for public stories
      if (isPublic !== false) {
        await storage.createFeedActivity({
          activityType: 'story',
          playerId,
          relatedId: story.id,
          headline: `${player.name} posted a story: ${headline}`,
          subtext: stats ? `Check out their stats!` : undefined,
          sessionId,
        });
      }

      res.status(201).json(story);
    } catch (err) {
      console.error('Create story error:', err);
      res.status(500).json({ message: 'Error creating story' });
    }
  });

  // === COACH ANALYSIS ROUTES ===

  // --- Shots (Shot Charts) ---
  app.post('/api/games/:gameId/shots', async (req, res) => {
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

  app.get('/api/games/:gameId/shots', async (req, res) => {
    try {
      const gameId = Number(req.params.gameId);
      const shots = await storage.getShotsByGame(gameId);
      res.json(shots);
    } catch (err) {
      console.error('Get shots error:', err);
      res.status(500).json({ error: 'Error fetching shots' });
    }
  });

  app.get('/api/players/:playerId/shots', async (req, res) => {
    try {
      const playerId = Number(req.params.playerId);
      const shots = await storage.getShotsByPlayer(playerId);
      res.json(shots);
    } catch (err) {
      console.error('Get player shots error:', err);
      res.status(500).json({ error: 'Error fetching shots' });
    }
  });

  app.delete('/api/shots/:id', async (req, res) => {
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
  app.post('/api/practices', isCoach, async (req, res) => {
    try {
      const input = insertPracticeSchema.parse(req.body);
      const practice = await storage.createPractice(input);
      res.status(201).json(practice);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors[0].message });
      }
      console.error('Create practice error:', err);
      res.status(500).json({ error: 'Error creating practice' });
    }
  });

  app.get('/api/practices', isCoach, async (req, res) => {
    try {
      const practices = await storage.getPractices();
      res.json(practices);
    } catch (err) {
      console.error('Get practices error:', err);
      res.status(500).json({ error: 'Error fetching practices' });
    }
  });

  app.get('/api/practices/:id', async (req, res) => {
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

  app.patch('/api/practices/:id', isCoach, async (req, res) => {
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

  app.delete('/api/practices/:id', isCoach, async (req, res) => {
    try {
      await storage.deletePractice(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      console.error('Delete practice error:', err);
      res.status(500).json({ error: 'Error deleting practice' });
    }
  });

  // --- Practice Attendance ---
  app.post('/api/practices/:practiceId/attendance', isCoach, async (req, res) => {
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

  app.get('/api/practices/:practiceId/attendance', isCoach, async (req, res) => {
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

  app.patch('/api/attendance/:id', isCoach, async (req, res) => {
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
  app.post('/api/drills', isCoach, async (req, res) => {
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

  app.get('/api/drills', isCoach, async (req, res) => {
    try {
      const drills = await storage.getDrills();
      res.json(drills);
    } catch (err) {
      console.error('Get drills error:', err);
      res.status(500).json({ error: 'Error fetching drills' });
    }
  });

  app.get('/api/drills/category/:category', async (req, res) => {
    try {
      const drills = await storage.getDrillsByCategory(req.params.category);
      res.json(drills);
    } catch (err) {
      console.error('Get drills by category error:', err);
      res.status(500).json({ error: 'Error fetching drills' });
    }
  });

  app.get('/api/drills/:id', async (req, res) => {
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
  app.post('/api/practices/:practiceId/drill-scores', isCoach, async (req, res) => {
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

  app.get('/api/practices/:practiceId/drill-scores', isCoach, async (req, res) => {
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
  app.post('/api/lineups', isCoach, async (req, res) => {
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

  app.get('/api/lineups', isCoach, async (req, res) => {
    try {
      const lineups = await storage.getLineups();
      res.json(lineups);
    } catch (err) {
      console.error('Get lineups error:', err);
      res.status(500).json({ error: 'Error fetching lineups' });
    }
  });

  app.get('/api/lineups/:id', async (req, res) => {
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

  app.delete('/api/lineups/:id', isCoach, async (req, res) => {
    try {
      await storage.deleteLineup(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      console.error('Delete lineup error:', err);
      res.status(500).json({ error: 'Error deleting lineup' });
    }
  });

  // --- Lineup Stats ---
  app.post('/api/lineups/:lineupId/stats', isCoach, async (req, res) => {
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

  app.get('/api/lineups/:lineupId/stats', isCoach, async (req, res) => {
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
  app.post('/api/opponents', isCoach, async (req, res) => {
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

  app.get('/api/opponents', isCoach, async (req, res) => {
    try {
      const opponents = await storage.getOpponents();
      res.json(opponents);
    } catch (err) {
      console.error('Get opponents error:', err);
      res.status(500).json({ error: 'Error fetching opponents' });
    }
  });

  app.get('/api/opponents/:id', async (req, res) => {
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

  app.patch('/api/opponents/:id', isCoach, async (req, res) => {
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

  app.delete('/api/opponents/:id', isCoach, async (req, res) => {
    try {
      await storage.deleteOpponent(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      console.error('Delete opponent error:', err);
      res.status(500).json({ error: 'Error deleting opponent' });
    }
  });

  // --- Alerts ---
  app.get('/api/alerts', isCoach, async (req, res) => {
    try {
      const playerId = req.query.playerId ? Number(req.query.playerId) : undefined;
      const alerts = await storage.getAlerts(playerId);
      res.json(alerts);
    } catch (err) {
      console.error('Get alerts error:', err);
      res.status(500).json({ error: 'Error fetching alerts' });
    }
  });

  app.get('/api/alerts/unread', isCoach, async (req, res) => {
    try {
      const alerts = await storage.getUnreadAlerts();
      res.json(alerts);
    } catch (err) {
      console.error('Get unread alerts error:', err);
      res.status(500).json({ error: 'Error fetching alerts' });
    }
  });

  app.patch('/api/alerts/:id/read', isCoach, async (req, res) => {
    try {
      await storage.markAlertRead(Number(req.params.id));
      res.json({ success: true });
    } catch (err) {
      console.error('Mark alert read error:', err);
      res.status(500).json({ error: 'Error marking alert as read' });
    }
  });

  app.delete('/api/alerts/:id', isCoach, async (req, res) => {
    try {
      await storage.deleteAlert(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      console.error('Delete alert error:', err);
      res.status(500).json({ error: 'Error deleting alert' });
    }
  });

  app.post('/api/alerts/mark-all-read', isCoach, async (req, res) => {
    try {
      await storage.markAllAlertsRead();
      res.json({ success: true });
    } catch (err) {
      console.error('Mark all alerts read error:', err);
      res.status(500).json({ error: 'Error marking all alerts as read' });
    }
  });

  // --- Coach Goals (Coach Only) ---
  app.post('/api/coach-goals', isCoach, async (req, res) => {
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

  app.get('/api/coach-goals', isCoach, async (req, res) => {
    try {
      const goals = await storage.getAllCoachGoals();
      res.json(goals);
    } catch (err) {
      console.error('Get coach goals error:', err);
      res.status(500).json({ error: 'Error fetching coach goals' });
    }
  });

  app.get('/api/players/:playerId/coach-goals', isCoach, async (req, res) => {
    try {
      const playerId = Number(req.params.playerId);
      const goals = await storage.getCoachGoals(playerId);
      res.json(goals);
    } catch (err) {
      console.error('Get player coach goals error:', err);
      res.status(500).json({ error: 'Error fetching coach goals' });
    }
  });

  app.patch('/api/coach-goals/:id', isCoach, async (req, res) => {
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

  app.delete('/api/coach-goals/:id', isCoach, async (req, res) => {
    try {
      await storage.deleteCoachGoal(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      console.error('Delete coach goal error:', err);
      res.status(500).json({ error: 'Error deleting coach goal' });
    }
  });

  // --- Drill Recommendations ---
  app.post('/api/players/:playerId/drill-recommendations/generate', isCoach, async (req, res) => {
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

  app.get('/api/players/:playerId/drill-recommendations', async (req, res) => {
    try {
      const playerId = Number(req.params.playerId);
      const recommendations = await storage.getDrillRecommendations(playerId);
      res.json(recommendations);
    } catch (err) {
      console.error('Get recommendations error:', err);
      res.status(500).json({ error: 'Error fetching recommendations' });
    }
  });

  app.delete('/api/drill-recommendations/:id', async (req, res) => {
    try {
      await storage.deleteDrillRecommendation(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      console.error('Delete recommendation error:', err);
      res.status(500).json({ error: 'Error deleting recommendation' });
    }
  });


  // --- Pre-Game Report ---
  app.get('/api/players/:playerId/pregame-report', async (req, res) => {
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

  // --- Report Card ---
  app.get('/api/players/:playerId/report-card', async (req, res) => {
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
      const result = await db.execute(sql`
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.active as product_active,
          p.metadata as product_metadata,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.recurring,
          pr.active as price_active
        FROM stripe.products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        WHERE p.active = true
        ORDER BY p.name, pr.unit_amount
      `);

      const productsMap = new Map<string, any>();
      for (const row of result.rows as any[]) {
        if (!productsMap.has(row.product_id)) {
          productsMap.set(row.product_id, {
            id: row.product_id,
            name: row.product_name,
            description: row.product_description,
            metadata: row.product_metadata,
            prices: []
          });
        }
        if (row.price_id) {
          productsMap.get(row.product_id)!.prices.push({
            id: row.price_id,
            unit_amount: row.unit_amount,
            currency: row.currency,
            recurring: row.recurring,
          });
        }
      }

      res.json({ products: Array.from(productsMap.values()) });
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
      if (!user?.stripeSubscriptionId) {
        return res.json({ subscription: null });
      }

      const result = await db.execute(sql`
        SELECT * FROM stripe.subscriptions WHERE id = ${user.stripeSubscriptionId}
      `);
      
      res.json({ subscription: result.rows[0] || null });
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
