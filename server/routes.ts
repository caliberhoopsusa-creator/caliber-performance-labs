import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { players, games, type Game } from "@shared/schema";
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

  app.get(api.games.get.path, async (req, res) => {
    const game = await storage.getGame(Number(req.params.id));
    if (!game) return res.status(404).json({ message: "Game not found" });
    res.json(game);
  });

  app.delete(api.games.delete.path, async (req, res) => {
    await storage.deleteGame(Number(req.params.id));
    res.status(204).send();
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
      const prompt = `You are a professional basketball scout analyzing game footage. 
      
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

Also provide:
- A hustle score (0-100) based on effort, running back on defense, diving for balls
- A defense rating (0-100) based on positioning, contesting shots, staying with assignment

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
    "defenseRating": 50
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

      const prompt = `You are a basketball statistician. Analyze these play-by-play notes and extract stats for player "${playerName || 'the player'}".

Play-by-play notes:
${playByPlay}

Count stats mentioned or implied:
- Points, rebounds, assists, steals, blocks, turnovers
- Field goals made/attempted, three pointers made/attempted, free throws made/attempted
- Estimate hustle score (0-100) and defense rating (0-100) based on effort described

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
    "defenseRating": 50
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
      defenseRating: 40,
      grade: "C",
      feedback: "Strengths: Good scoring flashes. Areas to Improve: Ball security needs work (high TOs). Defense needs effort."
    });
  }
}
