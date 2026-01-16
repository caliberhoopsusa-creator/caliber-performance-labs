import { pgTable, text, serial, integer, boolean, timestamp, decimal, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  position: text("position").notNull(), // 'Guard', 'Wing', 'Big'
  height: text("height"), // e.g., "6'5"
  team: text("team"),
  jerseyNumber: integer("jersey_number"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  badgeType: text("badge_type").notNull(),
  gameId: integer("game_id"),
  earnedAt: timestamp("earned_at").defaultNow(),
});

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  title: text("title").notNull(),
  targetType: text("target_type").notNull(), // 'grade_avg', 'stat_min', 'stat_max', 'streak'
  targetCategory: text("target_category").notNull(), // 'overall', 'defense', 'hustle', 'points', 'rebounds', etc.
  targetValue: integer("target_value").notNull(),
  deadline: date("deadline"),
  completed: boolean("completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const streaks = pgTable("streaks", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  streakType: text("streak_type").notNull(), // 'grade_above_b', 'double_digit_points', 'no_turnovers', 'a_defense'
  currentCount: integer("current_count").notNull().default(0),
  bestCount: integer("best_count").notNull().default(0),
  lastGameId: integer("last_game_id"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  date: date("date").notNull(),
  opponent: text("opponent").notNull(),
  result: text("result"), // "W 105-98"
  
  // Traditional Stats
  minutes: integer("minutes").notNull().default(0),
  points: integer("points").notNull().default(0),
  rebounds: integer("rebounds").notNull().default(0),
  assists: integer("assists").notNull().default(0),
  steals: integer("steals").notNull().default(0),
  blocks: integer("blocks").notNull().default(0),
  turnovers: integer("turnovers").notNull().default(0),
  fouls: integer("fouls").notNull().default(0),
  
  // Shooting
  fgMade: integer("fg_made").notNull().default(0),
  fgAttempted: integer("fg_attempted").notNull().default(0),
  threeMade: integer("three_made").notNull().default(0),
  threeAttempted: integer("three_attempted").notNull().default(0),
  ftMade: integer("ft_made").notNull().default(0),
  ftAttempted: integer("ft_attempted").notNull().default(0),
  
  // Advanced / Manual Inputs
  offensiveRebounds: integer("offensive_rebounds").default(0),
  defensiveRebounds: integer("defensive_rebounds").default(0),
  hustleScore: integer("hustle_score").default(50), // 0-100 AI-calculated score
  defenseRating: integer("defense_rating").default(50), // 0-100 AI-calculated defensive efficiency
  plusMinus: integer("plus_minus").default(0), // Point differential while player on court
  per: decimal("per", { precision: 5, scale: 2 }).default("0"), // Player Efficiency Rating
  notes: text("notes"), // Video notes or observations
  
  // Calculated / Generated Fields (Stored for easy querying)
  grade: text("grade"), // A+, B, C-, etc.
  feedback: text("feedback"), // Generated coaching feedback
  
  createdAt: timestamp("created_at").defaultNow(),
});

// === SOCIAL ENGAGEMENT TABLES ===
export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  sessionId: text("session_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  sessionId: text("session_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===
export const playersRelations = relations(players, ({ many }) => ({
  games: many(games),
}));

export const gamesRelations = relations(games, ({ one }) => ({
  player: one(players, {
    fields: [games.playerId],
    references: [players.id],
  }),
}));

// === BASE SCHEMAS ===
export const insertPlayerSchema = createInsertSchema(players).omit({ id: true, createdAt: true });
export const insertGameSchema = createInsertSchema(games).omit({ 
  id: true, 
  createdAt: true, 
  grade: true, 
  feedback: true 
});

// === CHAT TABLES (for Gemini integration) ===
import { sql } from "drizzle-orm";

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// === EXPLICIT API CONTRACT TYPES ===

export type Player = typeof players.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;

export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;

// Request types
export type CreatePlayerRequest = InsertPlayer;
export type CreateGameRequest = InsertGame;
export type UpdateGameRequest = Partial<InsertGame>;

// Response types
export type PlayerResponse = Player;
export type GameResponse = Game;
export type PlayerWithGames = Player & { games: Game[] };

export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = {
  playerId: number;
  badgeType: string;
  gameId?: number | null;
};

export type Goal = typeof goals.$inferSelect;
export const insertGoalSchema = createInsertSchema(goals).omit({ id: true, createdAt: true, completed: true });
export type InsertGoal = z.infer<typeof insertGoalSchema>;

export type Streak = typeof streaks.$inferSelect;
export type InsertStreak = {
  playerId: number;
  streakType: string;
  currentCount?: number;
  bestCount?: number;
  lastGameId?: number | null;
};

export type Like = typeof likes.$inferSelect;
export type InsertLike = {
  gameId: number;
  sessionId: string;
};

export type Comment = typeof comments.$inferSelect;
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true });
export type InsertComment = z.infer<typeof insertCommentSchema>;

export const STREAK_DEFINITIONS = {
  grade_above_b: { name: "B+ or Better", description: "Consecutive games with B+ grade or higher" },
  double_digit_points: { name: "10+ Points", description: "Consecutive games with 10+ points" },
  no_turnovers: { name: "Clean Ball", description: "Consecutive games with 0 turnovers" },
  a_defense: { name: "Lockdown", description: "Consecutive games with A defense rating (85+)" },
} as const;

export const GOAL_PRESETS = [
  { title: "Average B+ Defense", targetType: "grade_avg", targetCategory: "defense", targetValue: 85 },
  { title: "Reduce turnovers below 2", targetType: "stat_max", targetCategory: "turnovers", targetValue: 2 },
  { title: "Score 15+ PPG", targetType: "stat_min", targetCategory: "points", targetValue: 15 },
  { title: "Get 5+ rebounds per game", targetType: "stat_min", targetCategory: "rebounds", targetValue: 5 },
  { title: "Dish 4+ assists per game", targetType: "stat_min", targetCategory: "assists", targetValue: 4 },
] as const;

export const BADGE_DEFINITIONS = {
  twenty_piece: { name: "20-Piece", description: "Scored 20+ points in a game" },
  thirty_bomb: { name: "30-Bomb", description: "Scored 30+ points in a game" },
  double_double: { name: "Double-Double", description: "10+ in two stat categories (pts/reb/ast)" },
  triple_double: { name: "Triple-Double", description: "10+ in three stat categories" },
  ironman: { name: "Ironman", description: "Played 32+ minutes in a game" },
  efficiency_master: { name: "Efficiency Master", description: "Got an A+ grade" },
  lockdown: { name: "Lockdown Defender", description: "Defense rating 90+" },
  hustle_king: { name: "Hustle King", description: "Hustle score 90+" },
  clean_sheet: { name: "Clean Sheet", description: "Zero turnovers with 20+ minutes" },
  hot_streak_3: { name: "Hot Streak 3", description: "3 games in a row with B+ or better" },
  hot_streak_5: { name: "Hot Streak 5", description: "5 games in a row with B+ or better" },
  sharpshooter: { name: "Sharpshooter", description: "50%+ from 3 on 5+ attempts" },
  hustle_champion: { name: "Hustle Champion", description: "Won the weekly hustle challenge" },
  scoring_machine: { name: "Scoring Machine", description: "Won the scorer's sprint challenge" },
  consistency_king: { name: "Consistency King", description: "Won the consistency challenge" },
} as const;

// === CHALLENGES TABLES ===
export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  challengeType: text("challenge_type").notNull(), // 'weekly', 'monthly', 'seasonal'
  targetType: text("target_type").notNull(), // 'hustle_avg', 'points_total', 'games_played', 'grade_count'
  targetValue: integer("target_value").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  badgeReward: text("badge_reward"), // badge type to award
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const challengeProgress = pgTable("challenge_progress", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  currentValue: integer("current_value").notNull().default(0),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
});

export type Challenge = typeof challenges.$inferSelect;
export const insertChallengeSchema = createInsertSchema(challenges).omit({ id: true, createdAt: true });
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;

export type ChallengeProgress = typeof challengeProgress.$inferSelect;
export const insertChallengeProgressSchema = createInsertSchema(challengeProgress).omit({ id: true });
export type InsertChallengeProgress = z.infer<typeof insertChallengeProgressSchema>;

export const CHALLENGE_TARGET_TYPES = {
  hustle_avg: { name: "Hustle Average", description: "Average hustle score across games" },
  points_total: { name: "Total Points", description: "Total points scored" },
  games_played: { name: "Games Played", description: "Number of games played" },
  grade_count: { name: "Grade Count", description: "Games with B+ or better" },
} as const;

// === TEAM MESSAGE BOARDS ===
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  playerId: integer("player_id"),
  displayName: text("display_name").notNull(),
  sessionId: text("session_id").notNull(),
  role: text("role").notNull().default("member"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const teamPosts = pgTable("team_posts", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  authorId: integer("author_id").notNull().references(() => teamMembers.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Team = typeof teams.$inferSelect;
export const insertTeamSchema = createInsertSchema(teams).omit({ id: true, createdAt: true });
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type TeamMember = typeof teamMembers.$inferSelect;
export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({ id: true, joinedAt: true });
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;

export type TeamPost = typeof teamPosts.$inferSelect;
export const insertTeamPostSchema = createInsertSchema(teamPosts).omit({ id: true, createdAt: true });
export type InsertTeamPost = z.infer<typeof insertTeamPostSchema>;

// === NEWSFEED / ACTIVITY STREAM ===
export const feedActivities = pgTable("feed_activities", {
  id: serial("id").primaryKey(),
  activityType: text("activity_type").notNull(), // 'game', 'badge', 'streak', 'goal', 'challenge', 'repost', 'poll', 'prediction'
  playerId: integer("player_id").references(() => players.id, { onDelete: "cascade" }),
  gameId: integer("game_id").references(() => games.id, { onDelete: "cascade" }),
  badgeId: integer("badge_id").references(() => badges.id, { onDelete: "cascade" }),
  relatedId: integer("related_id"), // For polls, predictions, stories, etc.
  headline: text("headline").notNull(),
  subtext: text("subtext"),
  sessionId: text("session_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === REPOSTS ===
export const reposts = pgTable("reposts", {
  id: serial("id").primaryKey(),
  originalActivityId: integer("original_activity_id").references(() => feedActivities.id, { onDelete: "cascade" }),
  gameId: integer("game_id").references(() => games.id, { onDelete: "cascade" }),
  sessionId: text("session_id").notNull(),
  comment: text("comment"), // Optional comment when reposting
  createdAt: timestamp("created_at").defaultNow(),
});

// === POLLS ===
export const polls = pgTable("polls", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  options: text("options").array().notNull(), // Array of options
  createdBy: text("created_by").notNull(), // session or player name
  playerId: integer("player_id").references(() => players.id, { onDelete: "set null" }),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pollVotes = pgTable("poll_votes", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").notNull().references(() => polls.id, { onDelete: "cascade" }),
  optionIndex: integer("option_index").notNull(),
  sessionId: text("session_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === MATCHUP PREDICTIONS ===
export const predictions = pgTable("predictions", {
  id: serial("id").primaryKey(),
  player1Id: integer("player1_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  player2Id: integer("player2_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // 'overall', 'scoring', 'defense', 'hustle', 'passing'
  createdBy: text("created_by").notNull(),
  sessionId: text("session_id"),
  gameDate: date("game_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const predictionVotes = pgTable("prediction_votes", {
  id: serial("id").primaryKey(),
  predictionId: integer("prediction_id").notNull().references(() => predictions.id, { onDelete: "cascade" }),
  votedFor: integer("voted_for").notNull(), // player1_id or player2_id
  sessionId: text("session_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === WEEKLY STORY TEMPLATES ===
export const storyTemplates = pgTable("story_templates", {
  id: serial("id").primaryKey(),
  templateName: text("template_name").notNull(), // 'weekly_recap', 'game_highlight', 'badge_earned', 'milestone'
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  isActive: boolean("is_active").default(true).notNull(),
  weekStart: date("week_start"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const playerStories = pgTable("player_stories", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  templateId: integer("template_id").references(() => storyTemplates.id, { onDelete: "set null" }),
  headline: text("headline").notNull(),
  stats: text("stats"), // JSON string of relevant stats
  imageUrl: text("image_url"),
  sessionId: text("session_id"),
  isPublic: boolean("is_public").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Export types
export type FeedActivity = typeof feedActivities.$inferSelect;
export const insertFeedActivitySchema = createInsertSchema(feedActivities).omit({ id: true, createdAt: true });
export type InsertFeedActivity = z.infer<typeof insertFeedActivitySchema>;

export type Repost = typeof reposts.$inferSelect;
export const insertRepostSchema = createInsertSchema(reposts).omit({ id: true, createdAt: true });
export type InsertRepost = z.infer<typeof insertRepostSchema>;

export type Poll = typeof polls.$inferSelect;
export const insertPollSchema = createInsertSchema(polls).omit({ id: true, createdAt: true });
export type InsertPoll = z.infer<typeof insertPollSchema>;

export type PollVote = typeof pollVotes.$inferSelect;
export const insertPollVoteSchema = createInsertSchema(pollVotes).omit({ id: true, createdAt: true });
export type InsertPollVote = z.infer<typeof insertPollVoteSchema>;

export type Prediction = typeof predictions.$inferSelect;
export const insertPredictionSchema = createInsertSchema(predictions).omit({ id: true, createdAt: true });
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;

export type PredictionVote = typeof predictionVotes.$inferSelect;
export const insertPredictionVoteSchema = createInsertSchema(predictionVotes).omit({ id: true, createdAt: true });
export type InsertPredictionVote = z.infer<typeof insertPredictionVoteSchema>;

export type StoryTemplate = typeof storyTemplates.$inferSelect;
export const insertStoryTemplateSchema = createInsertSchema(storyTemplates).omit({ id: true, createdAt: true });
export type InsertStoryTemplate = z.infer<typeof insertStoryTemplateSchema>;

export type PlayerStory = typeof playerStories.$inferSelect;
export const insertPlayerStorySchema = createInsertSchema(playerStories).omit({ id: true, createdAt: true });
export type InsertPlayerStory = z.infer<typeof insertPlayerStorySchema>;

// Story template presets
export const STORY_TEMPLATE_PRESETS = {
  weekly_recap: { name: "Weekly Recap", description: "Your week in review" },
  game_highlight: { name: "Game Highlight", description: "Best moments from a game" },
  badge_earned: { name: "Badge Earned", description: "Celebrate your achievement" },
  milestone: { name: "Milestone", description: "Career milestone reached" },
  streak_fire: { name: "Streak Fire", description: "Show off your streak" },
} as const;

export const PREDICTION_CATEGORIES = {
  overall: { name: "Overall Performance", description: "Who will have the better game?" },
  scoring: { name: "Scoring Battle", description: "Who will score more points?" },
  defense: { name: "Defensive Showdown", description: "Who will defend better?" },
  hustle: { name: "Hustle War", description: "Who will hustle harder?" },
  passing: { name: "Dime Contest", description: "Who will dish more assists?" },
} as const;
