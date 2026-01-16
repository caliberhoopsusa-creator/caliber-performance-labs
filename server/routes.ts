import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { players, games, type Game, insertGoalSchema, insertCommentSchema, insertChallengeSchema, insertTeamSchema, insertTeamMemberSchema, insertTeamPostSchema } from "@shared/schema";
import { getPlayerArchetype, ARCHETYPES } from "@shared/archetypes";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";
import fs from "fs";
import path from "path";

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
  await checkStreakBadges(playerId, gameId);
  
  return awardedBadges;
}

async function checkStreakBadges(playerId: number, latestGameId: number) {
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
  }
  if (streakCount >= 3 && !hasHotStreak3) {
    await storage.createBadge({ playerId, badgeType: "hot_streak_3", gameId: latestGameId });
  }
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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
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

  app.post(api.players.create.path, async (req, res) => {
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

  app.delete(api.players.delete.path, async (req, res) => {
    await storage.deletePlayer(Number(req.params.id));
    res.status(204).send();
  });

  // --- Games ---

  app.post(api.games.create.path, async (req, res) => {
    try {
      const input = api.games.create.input.parse(req.body);
      
      // Calculate Grade & Feedback
      const player = await storage.getPlayer(input.playerId);
      if (!player) return res.status(404).json({ message: "Player not found" });

      const { grade, feedback } = calculateGrade(input, player.position);
      
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
        feedback
      };

      const game = await storage.createGame(gameData);
      
      // Check and award badges after game creation
      await checkAndAwardBadges(input.playerId, game.id, input, grade);
      
      // Update player streaks
      await updatePlayerStreaks(input.playerId, game.id, input, grade);
      
      // Update challenge progress
      await updateChallengeProgressForPlayer(input.playerId, input, grade, input.date);
      
      res.status(201).json(game);
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
