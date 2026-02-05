import { pgTable, text, serial, integer, boolean, timestamp, decimal, date, index, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  userId: text("user_id"), // Links to auth user - null for coach-created players
  name: text("name").notNull(),
  sport: text("sport").notNull().default("basketball"), // 'basketball' or 'football'
  position: text("position").notNull(), // Basketball: 'Guard', 'Wing', 'Big' | Football: 'QB', 'RB', 'WR', etc.
  height: text("height"), // e.g., "6'5"
  team: text("team"),
  jerseyNumber: integer("jersey_number"),
  photoUrl: text("photo_url"), // Player profile photo
  bannerUrl: text("banner_url"), // Player profile banner
  bio: text("bio"), // Player biography/description
  totalXp: integer("total_xp").notNull().default(0), // Total XP earned
  currentTier: text("current_tier").notNull().default("Rookie"), // Rookie, Starter, All-Star, MVP, Hall of Fame
  // Recruiting/Discovery fields
  openToOpportunities: boolean("open_to_opportunities").default(false), // Show in player directory
  city: text("city"), // Player's city
  state: text("state"), // Player's state/region
  school: text("school"), // School or organization
  graduationYear: integer("graduation_year"), // Class year (e.g., 2025)
  level: text("level"), // 'middle_school', 'high_school', 'college'
  gpa: decimal("gpa", { precision: 3, scale: 2 }), // Academic GPA (0.00 - 4.00) for high school players
  // Coach contact info
  coachName: text("coach_name"),
  coachPhone: text("coach_phone"),
  // Admin-awarded ranking badges
  stateRank: integer("state_rank"), // State rank number (e.g., 1 for "#1 IN MT")
  countryRank: integer("country_rank"), // Country rank number (e.g., 5 for "#5 IN USA")
  // Widget preferences (JSON array of widget IDs to show)
  widgetPreferences: text("widget_preferences"), // JSON: ["trends", "grades", "radar", "averages"]
  // Coach-assigned roster role
  rosterRole: text("roster_role").default("rotation"), // 'starter', 'rotation', 'bench', 'development'
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("players_user_id_idx").on(table.userId),
  sportIdx: index("players_sport_idx").on(table.sport),
}));

// === ACTIVITY STREAKS (for daily login/activity tracking) ===
export const activityStreaks = pgTable("activity_streaks", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  streakType: text("streak_type").notNull(), // 'daily_login', 'daily_game', 'weekly_challenge'
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastActivityDate: date("last_activity_date"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  playerIdIdx: index("activity_streaks_player_id_idx").on(table.playerId),
}));

export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  badgeType: text("badge_type").notNull(),
  gameId: integer("game_id"),
  earnedAt: timestamp("earned_at").defaultNow(),
}, (table) => ({
  playerIdIdx: index("badges_player_id_idx").on(table.playerId),
  gameIdIdx: index("badges_game_id_idx").on(table.gameId),
}));

// === SKILL BADGES (Progressive career-based badges that upgrade) ===
export const skillBadges = pgTable("skill_badges", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  skillType: text("skill_type").notNull(), // 'sharpshooter', 'pure_passer', 'bucket_getter', etc.
  currentLevel: text("current_level").notNull().default("none"), // 'none', 'bronze', 'silver', 'gold', 'hall_of_fame'
  careerValue: integer("career_value").notNull().default(0), // Cumulative stat value
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  playerIdIdx: index("skill_badges_player_id_idx").on(table.playerId),
}));

// === CALIBER BADGE (Special owner-awarded badge) ===
export const caliberBadges = pgTable("caliber_badges", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  awardedBy: text("awarded_by").notNull(), // userId of the owner who awarded it
  reason: text("reason"), // Optional reason/note for the award
  category: text("category").notNull().default("excellence"), // 'excellence', 'dedication', 'leadership', 'potential'
  awardedAt: timestamp("awarded_at").defaultNow(),
}, (table) => ({
  playerIdIdx: index("caliber_badges_player_id_idx").on(table.playerId),
}));

export const insertCaliberBadgeSchema = createInsertSchema(caliberBadges).omit({ id: true, awardedAt: true });
export type InsertCaliberBadge = z.infer<typeof insertCaliberBadgeSchema>;
export type CaliberBadge = typeof caliberBadges.$inferSelect;

// === FOOTBALL ADVANCED METRICS & SCOUTING DATA ===
export const footballMetrics = pgTable("football_metrics", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  
  // === ADVANCED ANALYTICS (position-specific) ===
  // All positions - Overall contribution metric
  totalPointsSIS: decimal("total_points_sis", { precision: 5, scale: 1 }), // Sports Info Solutions Total Points
  
  // Defensive positions (DL, LB, DB)
  handOnBallPct: decimal("hand_on_ball_pct", { precision: 5, scale: 2 }), // % of plays with hand on ball
  adjustedTackleDepth: decimal("adjusted_tackle_depth", { precision: 4, scale: 2 }), // Average tackle depth in yards
  missedTackleRate: decimal("missed_tackle_rate", { precision: 5, scale: 2 }), // % missed tackles
  
  // Pass catchers & QB (QB, WR, TE, RB)
  yacPerCompletion: decimal("yac_per_completion", { precision: 5, scale: 2 }), // Yards after catch per completion
  separationRating: decimal("separation_rating", { precision: 4, scale: 2 }), // Route running separation (1-10)
  contestedCatchRate: decimal("contested_catch_rate", { precision: 5, scale: 2 }), // % contested catches made
  
  // QB specific
  pressureRate: decimal("pressure_rate", { precision: 5, scale: 2 }), // % of dropbacks under pressure
  timeToThrow: decimal("time_to_throw", { precision: 4, scale: 2 }), // Average seconds to throw
  accuracyRating: decimal("accuracy_rating", { precision: 4, scale: 2 }), // On-target throw % adjusted
  
  // OL specific
  passBlockWinRate: decimal("pass_block_win_rate", { precision: 5, scale: 2 }), // % pass block wins
  runBlockGrade: decimal("run_block_grade", { precision: 4, scale: 2 }), // Run blocking grade (1-100)
  
  // === COMBINE / ATHLETIC TESTING SCORES ===
  fortyYardDash: decimal("forty_yard_dash", { precision: 4, scale: 2 }), // 40-yard time in seconds (e.g., 4.45)
  verticalJump: decimal("vertical_jump", { precision: 4, scale: 1 }), // Vertical jump in inches (e.g., 38.5)
  broadJump: integer("broad_jump"), // Broad jump in inches (e.g., 124)
  threeConeDrill: decimal("three_cone_drill", { precision: 4, scale: 2 }), // 3-cone time in seconds (e.g., 6.85)
  shuttleTime: decimal("shuttle_time", { precision: 4, scale: 2 }), // 20-yard shuttle in seconds (e.g., 4.12)
  benchPressReps: integer("bench_press_reps"), // 225 lb reps (e.g., 25)
  wingspan: decimal("wingspan", { precision: 4, scale: 2 }), // Wingspan in inches (e.g., 78.5)
  handSize: decimal("hand_size", { precision: 4, scale: 2 }), // Hand size in inches (e.g., 9.75)
  
  // === QUALITATIVE TRAIT RATINGS (1-10 scale) ===
  physicality: integer("physicality"), // Physical play, pad level, finishing
  footballIQ: integer("football_iq"), // Understanding of schemes, reads, adjustments
  mentalToughness: integer("mental_toughness"), // Composure under pressure, resilience
  coachability: integer("coachability"), // Receptiveness to coaching, improvement rate
  leadership: integer("leadership"), // Vocal leader, team chemistry impact
  workEthic: integer("work_ethic"), // Practice habits, film study, training
  competitiveness: integer("competitiveness"), // Intensity, will to win
  clutchPerformance: integer("clutch_performance"), // Performance in big moments
  
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  playerIdIdx: index("football_metrics_player_id_idx").on(table.playerId),
}));

export const insertFootballMetricsSchema = createInsertSchema(footballMetrics).omit({ id: true, updatedAt: true });
export type InsertFootballMetrics = z.infer<typeof insertFootballMetricsSchema>;
export type FootballMetrics = typeof footballMetrics.$inferSelect;

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
}, (table) => ({
  playerIdIdx: index("goals_player_id_idx").on(table.playerId),
}));

export const streaks = pgTable("streaks", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  streakType: text("streak_type").notNull(), // 'grade_above_b', 'double_digit_points', 'no_turnovers', 'a_defense'
  currentCount: integer("current_count").notNull().default(0),
  bestCount: integer("best_count").notNull().default(0),
  lastGameId: integer("last_game_id"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  playerIdIdx: index("streaks_player_id_idx").on(table.playerId),
  lastGameIdIdx: index("streaks_last_game_id_idx").on(table.lastGameId),
}));

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  sport: text("sport").notNull().default("basketball"), // 'basketball' or 'football'
  date: date("date").notNull(),
  opponent: text("opponent").notNull(),
  result: text("result"), // "W 105-98" or "W 24-17"
  
  // === BASKETBALL STATS ===
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
  
  // === FOOTBALL STATS ===
  // Passing (QB)
  completions: integer("completions").default(0),
  passAttempts: integer("pass_attempts").default(0),
  passingYards: integer("passing_yards").default(0),
  passingTouchdowns: integer("passing_touchdowns").default(0),
  interceptions: integer("interceptions").default(0),
  sacksTaken: integer("sacks_taken").default(0),
  
  // Rushing (RB, QB)
  carries: integer("carries").default(0),
  rushingYards: integer("rushing_yards").default(0),
  rushingTouchdowns: integer("rushing_touchdowns").default(0),
  fumbles: integer("fumbles").default(0),
  
  // Receiving (WR, TE, RB)
  receptions: integer("receptions").default(0),
  targets: integer("targets").default(0),
  receivingYards: integer("receiving_yards").default(0),
  receivingTouchdowns: integer("receiving_touchdowns").default(0),
  drops: integer("drops").default(0),
  
  // Defense (DL, LB, DB)
  tackles: integer("tackles").default(0),
  soloTackles: integer("solo_tackles").default(0),
  sacks: integer("sacks").default(0),
  defensiveInterceptions: integer("defensive_interceptions").default(0),
  passDeflections: integer("pass_deflections").default(0),
  forcedFumbles: integer("forced_fumbles").default(0),
  fumbleRecoveries: integer("fumble_recoveries").default(0),
  
  // Special Teams (K, P)
  fieldGoalsMade: integer("field_goals_made").default(0),
  fieldGoalsAttempted: integer("field_goals_attempted").default(0),
  extraPointsMade: integer("extra_points_made").default(0),
  extraPointsAttempted: integer("extra_points_attempted").default(0),
  punts: integer("punts").default(0),
  puntYards: integer("punt_yards").default(0),
  
  // Offensive Line (OL)
  pancakeBlocks: integer("pancake_blocks").default(0),
  sacksAllowed: integer("sacks_allowed").default(0),
  penalties: integer("penalties").default(0),
  
  // Football Category Grades
  efficiencyGrade: text("efficiency_grade"), // QB: Comp%, RB: YPC, WR: Catch rate
  playmakingGrade: text("playmaking_grade"), // TDs, big plays
  ballSecurityGrade: text("ball_security_grade"), // INTs thrown, fumbles
  impactGrade: text("impact_grade"), // Tackles, sacks, INTs for defense
  
  // === SHARED FIELDS ===
  // Calculated / Generated Fields (Stored for easy querying)
  grade: text("grade"), // A+, B, C-, etc. (overall)
  feedback: text("feedback"), // Generated coaching feedback
  
  // Category Grades (position-weighted) - Basketball
  defensiveGrade: text("defensive_grade"), // A+, B, C-, etc.
  shootingGrade: text("shooting_grade"), // A+, B, C-, etc.
  reboundingGrade: text("rebounding_grade"), // A+, B, C-, etc.
  passingGrade: text("passing_grade"), // A+, B, C-, etc. (assist-to-turnover ratio)
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  playerIdIdx: index("games_player_id_idx").on(table.playerId),
  sportIdx: index("games_sport_idx").on(table.sport),
}));

// === SOCIAL ENGAGEMENT TABLES ===
export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  sessionId: text("session_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  gameIdIdx: index("likes_game_id_idx").on(table.gameId),
}));

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  sessionId: text("session_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  gameIdIdx: index("comments_game_id_idx").on(table.gameId),
}));

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
}, (table) => ({
  conversationIdIdx: index("messages_conversation_id_idx").on(table.conversationId),
}));

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

// Football-specific goal presets
export const FOOTBALL_GOAL_PRESETS = [
  { title: "Average B+ Defense", targetType: "grade_avg", targetCategory: "defense", targetValue: 85 },
  { title: "Throw 200+ passing yards", targetType: "stat_min", targetCategory: "passingYards", targetValue: 200 },
  { title: "Rush for 100+ yards", targetType: "stat_min", targetCategory: "rushingYards", targetValue: 100 },
  { title: "Catch 80+ receiving yards", targetType: "stat_min", targetCategory: "receivingYards", targetValue: 80 },
  { title: "Get 5+ tackles per game", targetType: "stat_min", targetCategory: "tackles", targetValue: 5 },
  { title: "Zero interceptions thrown", targetType: "stat_max", targetCategory: "interceptions", targetValue: 0 },
] as const;

// Goal categories by sport
export const BASKETBALL_GOAL_CATEGORIES = [
  { value: "points", label: "Points" },
  { value: "rebounds", label: "Rebounds" },
  { value: "assists", label: "Assists" },
  { value: "steals", label: "Steals" },
  { value: "blocks", label: "Blocks" },
  { value: "turnovers", label: "Turnovers" },
  { value: "defense", label: "Defense Rating" },
  { value: "overall", label: "Overall Grade" },
] as const;

export const FOOTBALL_GOAL_CATEGORIES = [
  { value: "passingYards", label: "Passing Yards" },
  { value: "passingTouchdowns", label: "Passing TDs" },
  { value: "rushingYards", label: "Rushing Yards" },
  { value: "rushingTouchdowns", label: "Rushing TDs" },
  { value: "receivingYards", label: "Receiving Yards" },
  { value: "receivingTouchdowns", label: "Receiving TDs" },
  { value: "receptions", label: "Receptions" },
  { value: "tackles", label: "Tackles" },
  { value: "sacks", label: "Sacks" },
  { value: "defensiveInterceptions", label: "Interceptions (DEF)" },
  { value: "interceptions", label: "INTs Thrown" },
  { value: "fumbles", label: "Fumbles" },
  { value: "defense", label: "Defense Rating" },
  { value: "overall", label: "Overall Grade" },
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
  most_improved: { name: "Most Improved", description: "Showed 2+ letter grade improvement over 5+ games" },
  hustle_champion: { name: "Hustle Champion", description: "Won the weekly hustle challenge" },
  scoring_machine: { name: "Scoring Machine", description: "Won the scorer's sprint challenge" },
  consistency_king: { name: "Consistency King", description: "Won the consistency challenge" },
  // Tier promotion badges
  tier_starter: { name: "Starter", description: "Reached Starter tier (500 XP)" },
  tier_allstar: { name: "All-Star", description: "Reached All-Star tier (2,000 XP)" },
  tier_mvp: { name: "MVP", description: "Reached MVP tier (5,000 XP)" },
  tier_hof: { name: "Hall of Fame", description: "Reached Hall of Fame tier (10,000 XP)" },
  // Streak milestone badges
  streak_3: { name: "3-Day Streak", description: "Active 3 days in a row" },
  streak_7: { name: "Week Warrior", description: "Active 7 days in a row" },
  streak_14: { name: "Two-Week Terror", description: "Active 14 days in a row" },
  streak_30: { name: "Monthly Monster", description: "Active 30 days in a row" },
  // XP milestone badges
  xp_100: { name: "First Hundred", description: "Earned 100 XP" },
  xp_500: { name: "Rising Star", description: "Earned 500 XP" },
  xp_1000: { name: "Grinder", description: "Earned 1,000 XP" },
  xp_5000: { name: "Elite", description: "Earned 5,000 XP" },
} as const;

// === SKILL BADGES SYSTEM (Progressive career badges) ===
export const SKILL_BADGE_LEVELS = ["none", "brick", "bronze", "silver", "gold", "platinum", "hall_of_fame", "legend", "goat"] as const;
export type SkillBadgeLevel = typeof SKILL_BADGE_LEVELS[number];

export const SKILL_BADGE_TYPES = {
  sharpshooter: {
    name: "Sharpshooter",
    description: "Career 3-pointers made",
    stat: "threeMade",
    thresholds: { brick: 5, bronze: 15, silver: 40, gold: 100, platinum: 200, hall_of_fame: 350, legend: 500, goat: 750 },
  },
  pure_passer: {
    name: "Pure Passer",
    description: "Career assists",
    stat: "assists",
    thresholds: { brick: 10, bronze: 35, silver: 80, gold: 175, platinum: 350, hall_of_fame: 600, legend: 900, goat: 1500 },
  },
  bucket_getter: {
    name: "Bucket Getter",
    description: "Career points scored",
    stat: "points",
    thresholds: { brick: 50, bronze: 150, silver: 400, gold: 1000, platinum: 2000, hall_of_fame: 4000, legend: 7000, goat: 12000 },
  },
  glass_cleaner: {
    name: "Glass Cleaner",
    description: "Career rebounds",
    stat: "rebounds",
    thresholds: { brick: 25, bronze: 75, silver: 175, gold: 400, platinum: 750, hall_of_fame: 1250, legend: 2000, goat: 3500 },
  },
  rim_protector: {
    name: "Rim Protector",
    description: "Career blocks",
    stat: "blocks",
    thresholds: { brick: 5, bronze: 15, silver: 40, gold: 90, platinum: 175, hall_of_fame: 300, legend: 500, goat: 800 },
  },
  pickpocket: {
    name: "Pickpocket",
    description: "Career steals",
    stat: "steals",
    thresholds: { brick: 8, bronze: 25, silver: 60, gold: 130, platinum: 250, hall_of_fame: 425, legend: 650, goat: 1000 },
  },
} as const;

export type SkillBadgeType = keyof typeof SKILL_BADGE_TYPES;

export const FOOTBALL_SKILL_BADGE_TYPES = {
  gunslinger: {
    name: "Gunslinger",
    description: "Career passing touchdowns",
    stat: "passingTouchdowns",
    thresholds: { brick: 2, bronze: 5, silver: 10, gold: 20, platinum: 35, hall_of_fame: 55, legend: 80, goat: 120 },
  },
  workhorse: {
    name: "Workhorse",
    description: "Career rushing yards",
    stat: "rushingYards",
    thresholds: { brick: 50, bronze: 150, silver: 400, gold: 800, platinum: 1500, hall_of_fame: 2500, legend: 4000, goat: 6000 },
  },
  deep_threat: {
    name: "Deep Threat",
    description: "Career receiving touchdowns",
    stat: "receivingTouchdowns",
    thresholds: { brick: 1, bronze: 3, silver: 7, gold: 15, platinum: 25, hall_of_fame: 40, legend: 60, goat: 90 },
  },
  ball_hawk: {
    name: "Ball Hawk",
    description: "Career interceptions",
    stat: "defensiveInterceptions",
    thresholds: { brick: 1, bronze: 2, silver: 4, gold: 8, platinum: 15, hall_of_fame: 25, legend: 40, goat: 60 },
  },
  sack_artist: {
    name: "Sack Artist",
    description: "Career sacks",
    stat: "sacks",
    thresholds: { brick: 1, bronze: 3, silver: 6, gold: 12, platinum: 22, hall_of_fame: 35, legend: 55, goat: 80 },
  },
  iron_wall: {
    name: "Iron Wall",
    description: "Career pancake blocks",
    stat: "pancakeBlocks",
    thresholds: { brick: 3, bronze: 8, silver: 18, gold: 35, platinum: 65, hall_of_fame: 100, legend: 150, goat: 220 },
  },
} as const;

export type FootballSkillBadgeType = keyof typeof FOOTBALL_SKILL_BADGE_TYPES;

// Position-specific badge mappings for basketball
export const BASKETBALL_POSITION_BADGES: Record<string, SkillBadgeType[]> = {
  Guard: ['sharpshooter', 'pure_passer', 'bucket_getter', 'pickpocket'],
  Wing: ['sharpshooter', 'bucket_getter', 'pickpocket', 'glass_cleaner'],
  Big: ['glass_cleaner', 'rim_protector', 'bucket_getter'],
};

// Position-specific badge mappings for football
export const FOOTBALL_POSITION_BADGES: Record<string, FootballSkillBadgeType[]> = {
  QB: ['gunslinger'],
  RB: ['workhorse'],
  WR: ['deep_threat'],
  TE: ['deep_threat'],
  OL: ['iron_wall'],
  DL: ['sack_artist'],
  LB: ['sack_artist', 'ball_hawk'],
  DB: ['ball_hawk'],
  K: [],  // Kickers don't have skill badges currently
  P: [],  // Punters don't have skill badges currently
};

// Get relevant badges for a position (for multi-position support, returns union of badges)
export function getBadgesForPosition(sport: 'basketball' | 'football', positions: string | string[]): string[] {
  const positionList = Array.isArray(positions) 
    ? positions 
    : positions.split(',').map(p => p.trim());
  
  const badgeMapping = sport === 'football' ? FOOTBALL_POSITION_BADGES : BASKETBALL_POSITION_BADGES;
  const relevantBadges = new Set<string>();
  
  for (const pos of positionList) {
    const badges = badgeMapping[pos] || [];
    badges.forEach(b => relevantBadges.add(b));
  }
  
  return Array.from(relevantBadges);
}

export type SkillBadge = typeof skillBadges.$inferSelect;
export type InsertSkillBadge = {
  playerId: number;
  skillType: string;
  currentLevel?: string;
  careerValue?: number;
};

// === XP & TIER SYSTEM ===
export const TIER_THRESHOLDS = {
  Rookie: 0,
  Starter: 500,
  "All-Star": 2000,
  MVP: 5000,
  "Hall of Fame": 10000,
} as const;

export const XP_REWARDS = {
  game_logged: 50,        // Log a game
  badge_earned: 25,       // Earn any badge
  goal_completed: 100,    // Complete a goal
  challenge_completed: 150, // Complete a challenge
  daily_login: 10,        // Daily activity bonus
  streak_bonus_3: 25,     // 3-day streak bonus
  streak_bonus_7: 75,     // 7-day streak bonus
  streak_bonus_14: 150,   // 14-day streak bonus
  streak_bonus_30: 300,   // 30-day streak bonus
  a_grade: 30,            // Get an A grade in a game
  a_plus_grade: 50,       // Get an A+ grade in a game
} as const;

export const TIER_ORDER = ["Rookie", "Starter", "All-Star", "MVP", "Hall of Fame"] as const;
export type PlayerTier = typeof TIER_ORDER[number];

// Activity streak types
export type ActivityStreak = typeof activityStreaks.$inferSelect;
export type InsertActivityStreak = {
  playerId: number;
  streakType: string;
  currentStreak?: number;
  longestStreak?: number;
  lastActivityDate?: string | null;
};

export const ACTIVITY_STREAK_TYPES = {
  daily_login: { name: "Daily Activity", description: "Consecutive days of activity" },
  daily_game: { name: "Game Logger", description: "Consecutive days logging games" },
  weekly_challenge: { name: "Challenge Streak", description: "Consecutive weeks completing challenges" },
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
}, (table) => ({
  challengeIdIdx: index("challenge_progress_challenge_id_idx").on(table.challengeId),
  playerIdIdx: index("challenge_progress_player_id_idx").on(table.playerId),
}));

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
  profilePicture: text("profile_picture"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  playerId: integer("player_id"),
  displayName: text("display_name").notNull(),
  sessionId: text("session_id").notNull(),
  role: text("role").notNull().default("member"),
  rosterRole: text("roster_role").default("rotation"), // 'starter', 'rotation', 'bench', 'development'
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => ({
  teamIdIdx: index("team_members_team_id_idx").on(table.teamId),
  playerIdIdx: index("team_members_player_id_idx").on(table.playerId),
}));

export const teamPosts = pgTable("team_posts", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  authorId: integer("author_id").notNull().references(() => teamMembers.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  postType: text("post_type").notNull().default("general"), // 'announcement', 'practice', 'chat', 'general'
  practiceTime: timestamp("practice_time"), // For practice notifications
  practiceLocation: text("practice_location"), // Location for practice
  isPinned: boolean("is_pinned").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  teamIdIdx: index("team_posts_team_id_idx").on(table.teamId),
  authorIdIdx: index("team_posts_author_id_idx").on(table.authorId),
}));

export const teamPostComments = pgTable("team_post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => teamPosts.id, { onDelete: "cascade" }),
  authorId: integer("author_id").notNull().references(() => teamMembers.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  postIdIdx: index("team_post_comments_post_id_idx").on(table.postId),
  authorIdIdx: index("team_post_comments_author_id_idx").on(table.authorId),
}));

export type Team = typeof teams.$inferSelect;
export const insertTeamSchema = createInsertSchema(teams).omit({ id: true, createdAt: true });
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type TeamMember = typeof teamMembers.$inferSelect;
export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({ id: true, joinedAt: true });
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;

export type TeamPost = typeof teamPosts.$inferSelect;
export const insertTeamPostSchema = createInsertSchema(teamPosts).omit({ id: true, createdAt: true });
export type InsertTeamPost = z.infer<typeof insertTeamPostSchema>;

export type TeamPostComment = typeof teamPostComments.$inferSelect;
export const insertTeamPostCommentSchema = createInsertSchema(teamPostComments).omit({ id: true, createdAt: true });
export type InsertTeamPostComment = z.infer<typeof insertTeamPostCommentSchema>;

export const TEAM_POST_TYPES = {
  announcement: { name: "Announcement", description: "Important team announcement", icon: "megaphone" },
  practice: { name: "Practice", description: "Practice schedule notification", icon: "calendar" },
  chat: { name: "Chat", description: "General team discussion", icon: "message-circle" },
  general: { name: "General", description: "General post", icon: "file-text" },
} as const;

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
}, (table) => ({
  playerIdIdx: index("feed_activities_player_id_idx").on(table.playerId),
  gameIdIdx: index("feed_activities_game_id_idx").on(table.gameId),
  badgeIdIdx: index("feed_activities_badge_id_idx").on(table.badgeId),
}));

// === FEED REACTIONS ===
export const feedReactions = pgTable("feed_reactions", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id").references(() => feedActivities.id, { onDelete: "cascade" }).notNull(),
  sessionId: text("session_id").notNull(),
  reactionType: text("reaction_type").notNull(),
  playerName: text("player_name"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  activityIdIdx: index("feed_reactions_activity_id_idx").on(table.activityId),
  sessionIdIdx: index("feed_reactions_session_id_idx").on(table.sessionId),
  uniqueReaction: unique("unique_user_reaction_per_activity").on(table.activityId, table.sessionId, table.reactionType),
}));

// === REPOSTS ===
export const reposts = pgTable("reposts", {
  id: serial("id").primaryKey(),
  originalActivityId: integer("original_activity_id").references(() => feedActivities.id, { onDelete: "cascade" }),
  gameId: integer("game_id").references(() => games.id, { onDelete: "cascade" }),
  sessionId: text("session_id").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  originalActivityIdIdx: index("reposts_original_activity_id_idx").on(table.originalActivityId),
  gameIdIdx: index("reposts_game_id_idx").on(table.gameId),
}));

// === POLLS ===
export const polls = pgTable("polls", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  options: text("options").array().notNull(), // Array of options
  createdBy: text("created_by").notNull(), // session or player name
  playerId: integer("player_id").references(() => players.id, { onDelete: "set null" }),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  playerIdIdx: index("polls_player_id_idx").on(table.playerId),
}));

export const pollVotes = pgTable("poll_votes", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").notNull().references(() => polls.id, { onDelete: "cascade" }),
  optionIndex: integer("option_index").notNull(),
  sessionId: text("session_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  pollIdIdx: index("poll_votes_poll_id_idx").on(table.pollId),
}));

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
}, (table) => ({
  player1IdIdx: index("predictions_player1_id_idx").on(table.player1Id),
  player2IdIdx: index("predictions_player2_id_idx").on(table.player2Id),
}));

export const predictionVotes = pgTable("prediction_votes", {
  id: serial("id").primaryKey(),
  predictionId: integer("prediction_id").notNull().references(() => predictions.id, { onDelete: "cascade" }),
  votedFor: integer("voted_for").notNull(), // player1_id or player2_id
  sessionId: text("session_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  predictionIdIdx: index("prediction_votes_prediction_id_idx").on(table.predictionId),
}));

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
  videoUrl: text("video_url"), // For video content
  mediaType: text("media_type"), // 'image', 'video', 'text'
  caption: text("caption"), // Optional caption for media
  sessionId: text("session_id"),
  isPublic: boolean("is_public").default(true).notNull(),
  expiresAt: timestamp("expires_at"), // 24-hour story expiry
  viewCount: integer("view_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  playerIdIdx: index("player_stories_player_id_idx").on(table.playerId),
  templateIdIdx: index("player_stories_template_id_idx").on(table.templateId),
}));

// Story views tracking
export const storyViews = pgTable("story_views", {
  id: serial("id").primaryKey(),
  storyId: integer("story_id").notNull().references(() => playerStories.id, { onDelete: "cascade" }),
  viewerId: integer("viewer_id").references(() => players.id, { onDelete: "set null" }),
  sessionId: text("session_id"),
  viewedAt: timestamp("viewed_at").defaultNow(),
}, (table) => ({
  storyIdIdx: index("story_views_story_id_idx").on(table.storyId),
  viewerIdIdx: index("story_views_viewer_id_idx").on(table.viewerId),
}));

// Story reactions (emoji reactions like Instagram)
export const storyReactions = pgTable("story_reactions", {
  id: serial("id").primaryKey(),
  storyId: integer("story_id").notNull().references(() => playerStories.id, { onDelete: "cascade" }),
  reactorId: integer("reactor_id").references(() => players.id, { onDelete: "set null" }),
  sessionId: text("session_id"),
  reaction: text("reaction").notNull(), // emoji code: 'fire', 'heart', 'clap', '100', 'goat', 'muscle'
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  storyIdIdx: index("story_reactions_story_id_idx").on(table.storyId),
  reactorIdIdx: index("story_reactions_reactor_id_idx").on(table.reactorId),
}));

// Story highlights - saved stories that don't expire
export const storyHighlights = pgTable("story_highlights", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  coverImageUrl: text("cover_image_url"),
  storyIds: text("story_ids").notNull(), // JSON array of story IDs
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  playerIdIdx: index("story_highlights_player_id_idx").on(table.playerId),
}));

// === COACH ANALYSIS TABLES ===

export const shots = pgTable("shots", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  x: integer("x").notNull(), // 0-100, court position horizontal
  y: integer("y").notNull(), // 0-100, court position vertical
  shotType: text("shot_type").notNull(), // '2pt', '3pt', 'ft', 'layup', 'dunk', 'midrange'
  result: text("result").notNull(), // 'made', 'missed'
  quarter: integer("quarter").notNull(), // 1-4 or OT (5+)
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  gameIdIdx: index("shots_game_id_idx").on(table.gameId),
  playerIdIdx: index("shots_player_id_idx").on(table.playerId),
}));

export const gameNotes = pgTable("game_notes", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  authorName: text("author_name").notNull(), // coach name
  createdBy: text("created_by"), // userId of the coach who created this note
  content: text("content").notNull(),
  noteType: text("note_type").notNull(), // 'observation', 'improvement', 'praise', 'strategy'
  isPrivate: boolean("is_private").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  gameIdIdx: index("game_notes_game_id_idx").on(table.gameId),
  playerIdIdx: index("game_notes_player_id_idx").on(table.playerId),
}));

export const practices = pgTable("practices", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id, { onDelete: "set null" }),
  date: date("date").notNull(),
  title: text("title").notNull(),
  duration: integer("duration").notNull(), // planned duration in minutes
  actualDuration: integer("actual_duration"), // actual duration when completed
  status: text("status").notNull().default("completed"), // 'planned', 'active', 'completed'
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  currentDrillId: integer("current_drill_id").references(() => drills.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  teamIdIdx: index("practices_team_id_idx").on(table.teamId),
}));

export const practiceAttendance = pgTable("practice_attendance", {
  id: serial("id").primaryKey(),
  practiceId: integer("practice_id").notNull().references(() => practices.id, { onDelete: "cascade" }),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  attended: boolean("attended").default(true).notNull(),
  checkedInAt: timestamp("checked_in_at"), // live check-in timestamp
  effortRating: integer("effort_rating"), // 1-10 scale
  notes: text("notes"),
}, (table) => ({
  practiceIdIdx: index("practice_attendance_practice_id_idx").on(table.practiceId),
  playerIdIdx: index("practice_attendance_player_id_idx").on(table.playerId),
}));

export const drills = pgTable("drills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // 'shooting', 'dribbling', 'defense', 'conditioning', 'passing', 'rebounding'
  description: text("description"),
  targetStat: text("target_stat"), // which stat this improves
});

export const drillScores = pgTable("drill_scores", {
  id: serial("id").primaryKey(),
  practiceId: integer("practice_id").notNull().references(() => practices.id, { onDelete: "cascade" }),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  drillId: integer("drill_id").notNull().references(() => drills.id, { onDelete: "cascade" }),
  score: integer("score").notNull(), // 1-100
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  practiceIdIdx: index("drill_scores_practice_id_idx").on(table.practiceId),
  playerIdIdx: index("drill_scores_player_id_idx").on(table.playerId),
  drillIdIdx: index("drill_scores_drill_id_idx").on(table.drillId),
}));

export const lineups = pgTable("lineups", {
  id: serial("id").primaryKey(),
  name: text("name"), // optional lineup name like "Starting 5"
  playerIds: text("player_ids").notNull(), // comma-separated player IDs or JSON array as text
  createdAt: timestamp("created_at").defaultNow(),
});

export const lineupStats = pgTable("lineup_stats", {
  id: serial("id").primaryKey(),
  lineupId: integer("lineup_id").notNull().references(() => lineups.id, { onDelete: "cascade" }),
  gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  minutes: integer("minutes").notNull(),
  plusMinus: integer("plus_minus").notNull(),
  points: integer("points").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  lineupIdIdx: index("lineup_stats_lineup_id_idx").on(table.lineupId),
  gameIdIdx: index("lineup_stats_game_id_idx").on(table.gameId),
}));

export const opponents = pgTable("opponents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // team or player name
  opponentType: text("opponent_type").notNull(), // 'team', 'player'
  position: text("position"), // if player
  tendencies: text("tendencies"),
  strengths: text("strengths"),
  weaknesses: text("weaknesses"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  alertType: text("alert_type").notNull(), // 'performance_drop', 'streak_ended', 'goal_missed', 'improvement'
  title: text("title").notNull(),
  message: text("message").notNull(),
  severity: text("severity").notNull(), // 'info', 'warning', 'critical'
  isRead: boolean("is_read").default(false).notNull(),
  relatedGameId: integer("related_game_id").references(() => games.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  playerIdIdx: index("alerts_player_id_idx").on(table.playerId),
  relatedGameIdIdx: index("alerts_related_game_id_idx").on(table.relatedGameId),
}));

export const coachGoals = pgTable("coach_goals", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  coachName: text("coach_name").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  targetType: text("target_type").notNull(), // 'stat_min', 'stat_max', 'grade_avg', 'attendance'
  targetCategory: text("target_category").notNull(),
  targetValue: integer("target_value").notNull(),
  deadline: date("deadline"),
  status: text("status").notNull().default("active"), // 'active', 'completed', 'missed'
  coachFeedback: text("coach_feedback"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  playerIdIdx: index("coach_goals_player_id_idx").on(table.playerId),
}));

export const drillRecommendations = pgTable("drill_recommendations", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  drillId: integer("drill_id").references(() => drills.id, { onDelete: "set null" }),
  reason: text("reason").notNull(), // why this drill is recommended
  priority: integer("priority").notNull(), // 1-5, higher = more important
  weakStat: text("weak_stat"), // which stat needs improvement
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  playerIdIdx: index("drill_recommendations_player_id_idx").on(table.playerId),
}));

// === COACH ANALYSIS INSERT SCHEMAS ===
export const insertShotSchema = createInsertSchema(shots).omit({ id: true, createdAt: true });
export const insertGameNoteSchema = createInsertSchema(gameNotes).omit({ id: true, createdAt: true });
export const insertPracticeSchema = createInsertSchema(practices).omit({ id: true, createdAt: true });
export const insertPracticeAttendanceSchema = createInsertSchema(practiceAttendance).omit({ id: true });
export const insertDrillSchema = createInsertSchema(drills).omit({ id: true });
export const insertDrillScoreSchema = createInsertSchema(drillScores).omit({ id: true, createdAt: true });
export const insertLineupSchema = createInsertSchema(lineups).omit({ id: true, createdAt: true });
export const insertLineupStatSchema = createInsertSchema(lineupStats).omit({ id: true, createdAt: true });
export const insertOpponentSchema = createInsertSchema(opponents).omit({ id: true, createdAt: true });
export const insertAlertSchema = createInsertSchema(alerts).omit({ id: true, createdAt: true });
export const insertCoachGoalSchema = createInsertSchema(coachGoals).omit({ id: true, createdAt: true });
export const insertDrillRecommendationSchema = createInsertSchema(drillRecommendations).omit({ id: true, createdAt: true });

// === COACH ANALYSIS TYPES ===
export type Shot = typeof shots.$inferSelect;
export type InsertShot = z.infer<typeof insertShotSchema>;

export type GameNote = typeof gameNotes.$inferSelect;
export type InsertGameNote = z.infer<typeof insertGameNoteSchema>;

export type Practice = typeof practices.$inferSelect;
export type InsertPractice = z.infer<typeof insertPracticeSchema>;

export type PracticeAttendance = typeof practiceAttendance.$inferSelect;
export type InsertPracticeAttendance = z.infer<typeof insertPracticeAttendanceSchema>;

export type Drill = typeof drills.$inferSelect;
export type InsertDrill = z.infer<typeof insertDrillSchema>;

export type DrillScore = typeof drillScores.$inferSelect;
export type InsertDrillScore = z.infer<typeof insertDrillScoreSchema>;

export type Lineup = typeof lineups.$inferSelect;
export type InsertLineup = z.infer<typeof insertLineupSchema>;

export type LineupStat = typeof lineupStats.$inferSelect;
export type InsertLineupStat = z.infer<typeof insertLineupStatSchema>;

export type Opponent = typeof opponents.$inferSelect;
export type InsertOpponent = z.infer<typeof insertOpponentSchema>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

export type CoachGoal = typeof coachGoals.$inferSelect;
export type InsertCoachGoal = z.infer<typeof insertCoachGoalSchema>;

export type DrillRecommendation = typeof drillRecommendations.$inferSelect;
export type InsertDrillRecommendation = z.infer<typeof insertDrillRecommendationSchema>;

// Export types
export type FeedActivity = typeof feedActivities.$inferSelect;
export const insertFeedActivitySchema = createInsertSchema(feedActivities).omit({ id: true, createdAt: true });
export type InsertFeedActivity = z.infer<typeof insertFeedActivitySchema>;

export type FeedReaction = typeof feedReactions.$inferSelect;
export const insertFeedReactionSchema = createInsertSchema(feedReactions).omit({ id: true, createdAt: true });
export type InsertFeedReaction = z.infer<typeof insertFeedReactionSchema>;

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

export const insertPlayerStorySchema = createInsertSchema(playerStories).omit({ id: true, createdAt: true, viewCount: true });
export type InsertPlayerStory = z.infer<typeof insertPlayerStorySchema>;
export type PlayerStory = typeof playerStories.$inferSelect;

export const insertStoryViewSchema = createInsertSchema(storyViews).omit({ id: true, viewedAt: true });
export type InsertStoryView = z.infer<typeof insertStoryViewSchema>;
export type StoryView = typeof storyViews.$inferSelect;

export const insertStoryReactionSchema = createInsertSchema(storyReactions).omit({ id: true, createdAt: true });
export type InsertStoryReaction = z.infer<typeof insertStoryReactionSchema>;
export type StoryReaction = typeof storyReactions.$inferSelect;

export const insertStoryHighlightSchema = createInsertSchema(storyHighlights).omit({ id: true, createdAt: true });
export type InsertStoryHighlight = z.infer<typeof insertStoryHighlightSchema>;
export type StoryHighlight = typeof storyHighlights.$inferSelect;

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

// === PLAYER FOLLOWING SYSTEM ===
export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerPlayerId: integer("follower_player_id").references(() => players.id, { onDelete: "cascade" }),
  followerUserId: text("follower_user_id"),
  followeePlayerId: integer("followee_player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  followerPlayerIdIdx: index("follows_follower_player_id_idx").on(table.followerPlayerId),
  followeePlayerIdIdx: index("follows_followee_player_id_idx").on(table.followeePlayerId),
}));

// === IN-APP NOTIFICATIONS ===
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => players.id, { onDelete: "cascade" }),
  userId: text("user_id"),
  notificationType: text("notification_type").notNull(), // 'streak_reminder', 'badge_earned', 'goal_progress', 'new_follower', 'game_logged', 'challenge_update', 'story_reaction', 'story_view'
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedId: integer("related_id"), // ID of related entity (game, badge, goal, etc.)
  relatedType: text("related_type"), // 'game', 'badge', 'goal', 'challenge', 'player', 'story'
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  playerIdIdx: index("notifications_player_id_idx").on(table.playerId),
}));

// === HIGHLIGHT CLIPS ===
export const highlightClips = pgTable("highlight_clips", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  gameId: integer("game_id").references(() => games.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration"), // seconds
  viewCount: integer("view_count").default(0).notNull(),
  likeCount: integer("like_count").default(0).notNull(), // TikTok-style likes
  linkedGameId: integer("linked_game_id").references(() => games.id, { onDelete: "set null" }), // Links to verified game stats
  linkedTimestamp: text("linked_timestamp"), // Timestamp format: "MM:SS"
  overlayStyle: text("overlay_style").default("minimal"), // 'minimal', 'full', 'animated'
  statsToFeature: text("stats_to_feature"), // JSON array: ["points", "rebounds", "assists"]
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  playerIdIdx: index("highlight_clips_player_id_idx").on(table.playerId),
  gameIdIdx: index("highlight_clips_game_id_idx").on(table.gameId),
  linkedGameIdIdx: index("highlight_clips_linked_game_id_idx").on(table.linkedGameId),
}));

// === WORKOUT TRACKER ===
export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  workoutType: text("workout_type").notNull(), // 'shooting', 'conditioning', 'weights', 'skills', 'recovery'
  title: text("title").notNull(),
  duration: integer("duration").notNull(), // minutes
  intensity: integer("intensity"), // 1-10 scale
  notes: text("notes"),
  videoUrl: text("video_url"),
  metrics: text("metrics"), // JSON string for type-specific metrics
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  playerIdIdx: index("workouts_player_id_idx").on(table.playerId),
}));

// === PLAYER ACCOLADES ===
export const accolades = pgTable("accolades", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'championship', 'career_high', 'award', 'record'
  title: text("title").notNull(), // e.g., "State Championship", "Career High: 45 Points"
  description: text("description"),
  season: text("season"), // e.g., "2024-25"
  dateEarned: date("date_earned"),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  playerIdIdx: index("accolades_player_id_idx").on(table.playerId),
}));

// === GOAL SHARING ===
export const goalShares = pgTable("goal_shares", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").notNull().references(() => goals.id, { onDelete: "cascade" }),
  sharedWithPlayerId: integer("shared_with_player_id").references(() => players.id, { onDelete: "cascade" }),
  sharedWithTeamId: integer("shared_with_team_id").references(() => teams.id, { onDelete: "cascade" }),
  visibility: text("visibility").notNull().default("private"), // 'private', 'teammates', 'public'
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  goalIdIdx: index("goal_shares_goal_id_idx").on(table.goalId),
  sharedWithPlayerIdIdx: index("goal_shares_shared_with_player_id_idx").on(table.sharedWithPlayerId),
  sharedWithTeamIdIdx: index("goal_shares_shared_with_team_id_idx").on(table.sharedWithTeamId),
}));

// === SCHEDULE EVENTS (Practices, Games, Workouts) ===
export const scheduleEvents = pgTable("schedule_events", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => players.id, { onDelete: "cascade" }),
  teamId: integer("team_id").references(() => teams.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // 'practice', 'game', 'workout', 'meeting'
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  isRecurring: boolean("is_recurring").default(false).notNull(),
  recurrenceRule: text("recurrence_rule"), // iCal RRULE format
  sport: text("sport").default("basketball").notNull(), // 'basketball' or 'football'
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  playerIdIdx: index("schedule_events_player_id_idx").on(table.playerId),
  teamIdIdx: index("schedule_events_team_id_idx").on(table.teamId),
}));

// === LIVE GAME SESSIONS (Team-based real-time stat tracking) ===
export const liveGameSessions = pgTable("live_game_sessions", {
  id: serial("id").primaryKey(),
  coachUserId: text("coach_user_id").notNull(), // Coach running the session
  sport: text("sport").notNull().default("basketball"), // 'basketball' or 'football'
  opponent: text("opponent"), // Optional opponent name
  selectedPlayerIds: text("selected_player_ids").notNull(), // JSON array of player IDs
  status: text("status").notNull().default("active"), // 'active', 'paused', 'completed'
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
}, (table) => ({
  coachUserIdIdx: index("live_game_sessions_coach_user_id_idx").on(table.coachUserId),
  statusIdx: index("live_game_sessions_status_idx").on(table.status),
}));

// === LIVE GAME EVENTS (Real-time stat entry for team games) ===
export const liveGameEvents = pgTable("live_game_events", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => liveGameSessions.id, { onDelete: "cascade" }),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }), // Which player this stat belongs to
  eventType: text("event_type").notNull(), // 'points_1', 'points_2', 'points_3', 'rebound', 'assist', 'steal', 'block', 'turnover', 'foul'
  value: integer("value").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  sessionIdIdx: index("live_game_events_session_id_idx").on(table.sessionId),
  playerIdIdx: index("live_game_events_player_id_idx").on(table.playerId),
}));

// === SHARE ASSETS (Social media graphics) ===
export const shareAssets = pgTable("share_assets", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  gameId: integer("game_id").references(() => games.id, { onDelete: "set null" }),
  badgeId: integer("badge_id").references(() => badges.id, { onDelete: "set null" }),
  assetType: text("asset_type").notNull(), // 'game_card', 'badge_card', 'milestone', 'weekly_recap', 'season_stats'
  imageUrl: text("image_url").notNull(),
  sharedCount: integer("shared_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  playerIdIdx: index("share_assets_player_id_idx").on(table.playerId),
  gameIdIdx: index("share_assets_game_id_idx").on(table.gameId),
  badgeIdIdx: index("share_assets_badge_id_idx").on(table.badgeId),
}));

// === PLAYER ENDORSEMENTS (Coach endorses players) ===
export const endorsements = pgTable("endorsements", {
  id: serial("id").primaryKey(),
  coachUserId: text("coach_user_id").notNull(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  skills: text("skills"), // JSON array of skills endorsed
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  playerIdIdx: index("endorsements_player_id_idx").on(table.playerId),
}));

// === STORY TAGS (Tag players in stories) ===
export const storyTags = pgTable("story_tags", {
  id: serial("id").primaryKey(),
  storyId: integer("story_id").notNull().references(() => playerStories.id, { onDelete: "cascade" }),
  taggedPlayerId: integer("tagged_player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  storyIdIdx: index("story_tags_story_id_idx").on(table.storyId),
  taggedPlayerIdIdx: index("story_tags_tagged_player_id_idx").on(table.taggedPlayerId),
}));

// === HEAD-TO-HEAD CHALLENGES ===
export const headToHeadChallenges = pgTable("head_to_head_challenges", {
  id: serial("id").primaryKey(),
  challengerPlayerId: integer("challenger_player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  opponentPlayerId: integer("opponent_player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  metric: text("metric").notNull(), // 'points', 'assists', 'rebounds', 'steals', 'blocks', '3pm'
  targetValue: integer("target_value"), // Optional target to beat
  challengerGameId: integer("challenger_game_id").references(() => games.id, { onDelete: "set null" }),
  opponentGameId: integer("opponent_game_id").references(() => games.id, { onDelete: "set null" }),
  status: text("status").notNull().default("pending"), // 'pending', 'accepted', 'completed', 'declined', 'expired'
  winnerId: integer("winner_id").references(() => players.id, { onDelete: "set null" }),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
}, (table) => ({
  challengerPlayerIdIdx: index("head_to_head_challenges_challenger_player_id_idx").on(table.challengerPlayerId),
  opponentPlayerIdIdx: index("head_to_head_challenges_opponent_player_id_idx").on(table.opponentPlayerId),
  challengerGameIdIdx: index("head_to_head_challenges_challenger_game_id_idx").on(table.challengerGameId),
  opponentGameIdIdx: index("head_to_head_challenges_opponent_game_id_idx").on(table.opponentGameId),
  winnerIdIdx: index("head_to_head_challenges_winner_id_idx").on(table.winnerId),
}));

// === TRAINING GROUPS ===
export const trainingGroups = pgTable("training_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ownerPlayerId: integer("owner_player_id").references(() => players.id, { onDelete: "cascade" }),
  ownerUserId: text("owner_user_id"),
  isPublic: boolean("is_public").default(false).notNull(),
  maxMembers: integer("max_members").default(20),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  ownerPlayerIdIdx: index("training_groups_owner_player_id_idx").on(table.ownerPlayerId),
}));

export const trainingGroupMembers = pgTable("training_group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => trainingGroups.id, { onDelete: "cascade" }),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"), // 'owner', 'admin', 'member'
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => ({
  groupIdIdx: index("training_group_members_group_id_idx").on(table.groupId),
  playerIdIdx: index("training_group_members_player_id_idx").on(table.playerId),
}));

// === DIRECT MESSAGES ===
export const dmThreads = pgTable("dm_threads", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dmParticipants = pgTable("dm_participants", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull().references(() => dmThreads.id, { onDelete: "cascade" }),
  userId: text("user_id"),
  playerId: integer("player_id").references(() => players.id, { onDelete: "cascade" }),
  lastReadAt: timestamp("last_read_at"),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => ({
  threadIdIdx: index("dm_participants_thread_id_idx").on(table.threadId),
  playerIdIdx: index("dm_participants_player_id_idx").on(table.playerId),
}));

export const dmMessages = pgTable("dm_messages", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull().references(() => dmThreads.id, { onDelete: "cascade" }),
  senderUserId: text("sender_user_id"),
  senderPlayerId: integer("sender_player_id").references(() => players.id, { onDelete: "set null" }),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  threadIdIdx: index("dm_messages_thread_id_idx").on(table.threadId),
  senderPlayerIdIdx: index("dm_messages_sender_player_id_idx").on(table.senderPlayerId),
}));

// === MENTORSHIP ===
export const mentorshipProfiles = pgTable("mentorship_profiles", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'mentor', 'mentee', 'both'
  bio: text("bio"),
  focusAreas: text("focus_areas"), // JSON array: 'shooting', 'defense', 'leadership', etc.
  yearsExperience: integer("years_experience"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  playerIdIdx: index("mentorship_profiles_player_id_idx").on(table.playerId),
}));

export const mentorshipRequests = pgTable("mentorship_requests", {
  id: serial("id").primaryKey(),
  requesterPlayerId: integer("requester_player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  mentorPlayerId: integer("mentor_player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  message: text("message"),
  status: text("status").notNull().default("pending"), // 'pending', 'accepted', 'declined'
  createdAt: timestamp("created_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
}, (table) => ({
  requesterPlayerIdIdx: index("mentorship_requests_requester_player_id_idx").on(table.requesterPlayerId),
  mentorPlayerIdIdx: index("mentorship_requests_mentor_player_id_idx").on(table.mentorPlayerId),
}));

// === LIVE GAME SPECTATORS ===
export const liveGameSpectators = pgTable("live_game_spectators", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => liveGameSessions.id, { onDelete: "cascade" }),
  viewerUserId: text("viewer_user_id"),
  viewerPlayerId: integer("viewer_player_id").references(() => players.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
}, (table) => ({
  sessionIdIdx: index("live_game_spectators_session_id_idx").on(table.sessionId),
  viewerPlayerIdIdx: index("live_game_spectators_viewer_player_id_idx").on(table.viewerPlayerId),
}));

// === RECRUIT BOARD (Coach scouting) ===
export const recruitPosts = pgTable("recruit_posts", {
  id: serial("id").primaryKey(),
  coachUserId: text("coach_user_id").notNull(),
  playerId: integer("player_id").references(() => players.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  positionNeeds: text("position_needs"), // JSON array: 'Guard', 'Wing', 'Big'
  level: text("level"), // 'high_school', 'college', 'pro'
  location: text("location"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  playerIdIdx: index("recruit_posts_player_id_idx").on(table.playerId),
}));

export const recruitInterests = pgTable("recruit_interests", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => recruitPosts.id, { onDelete: "cascade" }),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  message: text("message"),
  status: text("status").notNull().default("pending"), // 'pending', 'viewed', 'contacted'
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  postIdIdx: index("recruit_interests_post_id_idx").on(table.postId),
  playerIdIdx: index("recruit_interests_player_id_idx").on(table.playerId),
}));

// === INSERT SCHEMAS FOR NEW TABLES ===
export const insertFollowSchema = createInsertSchema(follows).omit({ id: true, createdAt: true });
export const insertEndorsementSchema = createInsertSchema(endorsements).omit({ id: true, createdAt: true });
export const insertStoryTagSchema = createInsertSchema(storyTags).omit({ id: true, createdAt: true });
export const insertHeadToHeadChallengeSchema = createInsertSchema(headToHeadChallenges).omit({ id: true, createdAt: true });
export const insertTrainingGroupSchema = createInsertSchema(trainingGroups).omit({ id: true, createdAt: true });
export const insertTrainingGroupMemberSchema = createInsertSchema(trainingGroupMembers).omit({ id: true, joinedAt: true });
export const insertDmThreadSchema = createInsertSchema(dmThreads).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDmParticipantSchema = createInsertSchema(dmParticipants).omit({ id: true, joinedAt: true });
export const insertDmMessageSchema = createInsertSchema(dmMessages).omit({ id: true, createdAt: true });
export const insertMentorshipProfileSchema = createInsertSchema(mentorshipProfiles).omit({ id: true, createdAt: true });
export const insertMentorshipRequestSchema = createInsertSchema(mentorshipRequests).omit({ id: true, createdAt: true });
export const insertLiveGameSpectatorSchema = createInsertSchema(liveGameSpectators).omit({ id: true, joinedAt: true });
export const insertRecruitPostSchema = createInsertSchema(recruitPosts).omit({ id: true, createdAt: true });
export const insertRecruitInterestSchema = createInsertSchema(recruitInterests).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertHighlightClipSchema = createInsertSchema(highlightClips).omit({ id: true, createdAt: true, viewCount: true });
export const linkHighlightToGameSchema = z.object({
  gameId: z.number().int().positive("Game ID must be a positive integer"),
  timestamp: z.string().regex(/^\d{1,2}:\d{2}$/, "Timestamp must be in MM:SS format"),
});
export const insertWorkoutSchema = createInsertSchema(workouts).omit({ id: true, createdAt: true });
export const insertAccoladeSchema = createInsertSchema(accolades).omit({ id: true, createdAt: true });
export const insertGoalShareSchema = createInsertSchema(goalShares).omit({ id: true, createdAt: true });
export const insertScheduleEventSchema = createInsertSchema(scheduleEvents).omit({ id: true, createdAt: true });
export const insertLiveGameSessionSchema = createInsertSchema(liveGameSessions).omit({ id: true, startedAt: true });
export const insertLiveGameEventSchema = createInsertSchema(liveGameEvents).omit({ id: true, createdAt: true });
export const insertShareAssetSchema = createInsertSchema(shareAssets).omit({ id: true, createdAt: true, sharedCount: true });

// === TYPES FOR NEW TABLES ===
export type Follow = typeof follows.$inferSelect;
export type InsertFollow = z.infer<typeof insertFollowSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type HighlightClip = typeof highlightClips.$inferSelect;
export type InsertHighlightClip = z.infer<typeof insertHighlightClipSchema>;

export type Workout = typeof workouts.$inferSelect;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;

export type Accolade = typeof accolades.$inferSelect;
export type InsertAccolade = z.infer<typeof insertAccoladeSchema>;

export type GoalShare = typeof goalShares.$inferSelect;
export type InsertGoalShare = z.infer<typeof insertGoalShareSchema>;

export type ScheduleEvent = typeof scheduleEvents.$inferSelect;
export type InsertScheduleEvent = z.infer<typeof insertScheduleEventSchema>;

export type LiveGameSession = typeof liveGameSessions.$inferSelect;
export type InsertLiveGameSession = z.infer<typeof insertLiveGameSessionSchema>;

export type LiveGameEvent = typeof liveGameEvents.$inferSelect;
export type InsertLiveGameEvent = z.infer<typeof insertLiveGameEventSchema>;

export type ShareAsset = typeof shareAssets.$inferSelect;
export type InsertShareAsset = z.infer<typeof insertShareAssetSchema>;

export type Endorsement = typeof endorsements.$inferSelect;
export type InsertEndorsement = z.infer<typeof insertEndorsementSchema>;

export type StoryTag = typeof storyTags.$inferSelect;
export type InsertStoryTag = z.infer<typeof insertStoryTagSchema>;

export type HeadToHeadChallenge = typeof headToHeadChallenges.$inferSelect;
export type InsertHeadToHeadChallenge = z.infer<typeof insertHeadToHeadChallengeSchema>;

export type TrainingGroup = typeof trainingGroups.$inferSelect;
export type InsertTrainingGroup = z.infer<typeof insertTrainingGroupSchema>;

export type TrainingGroupMember = typeof trainingGroupMembers.$inferSelect;
export type InsertTrainingGroupMember = z.infer<typeof insertTrainingGroupMemberSchema>;

export type DmThread = typeof dmThreads.$inferSelect;
export type InsertDmThread = z.infer<typeof insertDmThreadSchema>;

export type DmParticipant = typeof dmParticipants.$inferSelect;
export type InsertDmParticipant = z.infer<typeof insertDmParticipantSchema>;

export type DmMessage = typeof dmMessages.$inferSelect;
export type InsertDmMessage = z.infer<typeof insertDmMessageSchema>;

export type MentorshipProfile = typeof mentorshipProfiles.$inferSelect;
export type InsertMentorshipProfile = z.infer<typeof insertMentorshipProfileSchema>;

export type MentorshipRequest = typeof mentorshipRequests.$inferSelect;
export type InsertMentorshipRequest = z.infer<typeof insertMentorshipRequestSchema>;

export type LiveGameSpectator = typeof liveGameSpectators.$inferSelect;
export type InsertLiveGameSpectator = z.infer<typeof insertLiveGameSpectatorSchema>;

export type RecruitPost = typeof recruitPosts.$inferSelect;
export type InsertRecruitPost = z.infer<typeof insertRecruitPostSchema>;

export type RecruitInterest = typeof recruitInterests.$inferSelect;
export type InsertRecruitInterest = z.infer<typeof insertRecruitInterestSchema>;

// === CONSTANTS FOR NEW FEATURES ===
export const NOTIFICATION_TYPES = {
  streak_reminder: { name: "Streak Reminder", description: "Reminder to maintain your streak" },
  badge_earned: { name: "Badge Earned", description: "You earned a new badge" },
  goal_progress: { name: "Goal Progress", description: "Update on your goal" },
  new_follower: { name: "New Follower", description: "Someone started following you" },
  game_logged: { name: "Game Logged", description: "A new game was logged" },
  challenge_update: { name: "Challenge Update", description: "Challenge progress update" },
  endorsement_received: { name: "Endorsement", description: "You received a new endorsement from a coach" },
  story_tag: { name: "Story Tag", description: "You were tagged in a story" },
  mentorship_request: { name: "Mentorship Request", description: "You received a mentorship request" },
  mentorship_accepted: { name: "Mentorship Accepted", description: "Your mentorship request was accepted" },
  mentorship_declined: { name: "Mentorship Declined", description: "Your mentorship request was declined" },
  game_spectating: { name: "Game Spectating", description: "Someone is watching your live game" },
} as const;

export const WORKOUT_TYPES = {
  shooting: { name: "Shooting", description: "Shooting drills and practice" },
  conditioning: { name: "Conditioning", description: "Cardio and endurance training" },
  weights: { name: "Weight Training", description: "Strength and resistance training" },
  skills: { name: "Skills Training", description: "Ball handling and court skills" },
  recovery: { name: "Recovery", description: "Stretching, massage, rest" },
} as const;

export const EVENT_TYPES = {
  practice: { name: "Practice", description: "Team or individual practice" },
  game: { name: "Game", description: "Scheduled game or scrimmage" },
  workout: { name: "Workout", description: "Training session" },
  meeting: { name: "Meeting", description: "Team meeting or film session" },
} as const;

export const LIVE_EVENT_TYPES = {
  point: { name: "Points", values: [1, 2, 3] },
  rebound: { name: "Rebound", values: [1] },
  assist: { name: "Assist", values: [1] },
  steal: { name: "Steal", values: [1] },
  block: { name: "Block", values: [1] },
  turnover: { name: "Turnover", values: [1] },
  foul: { name: "Foul", values: [1] },
} as const;

// === SHOP & CUSTOMIZATION SYSTEM ===

export const shopItems = pgTable("shop_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'theme', 'profile_skin', 'badge_style', 'effect', 'team_look'
  type: text("type").notNull(), // Specific type within category: 'accent_color', 'card_background', etc.
  value: text("value").notNull(), // The actual value (hex color, class name, etc.)
  previewUrl: text("preview_url"), // Preview image URL
  coinPrice: integer("coin_price").notNull().default(0), // Price in coins (0 = free)
  premiumPrice: integer("premium_price"), // Price in cents for real money (null = not available for purchase)
  rarity: text("rarity").notNull().default("common"), // 'common', 'rare', 'epic', 'legendary'
  isActive: boolean("is_active").notNull().default(true), // Available for purchase
  sortOrder: integer("sort_order").default(0), // Display order
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  categoryIdx: index("shop_items_category_idx").on(table.category),
  isActiveIdx: index("shop_items_is_active_idx").on(table.isActive),
}));

export const userInventory = pgTable("user_inventory", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Links to users.id
  itemId: integer("item_id").notNull().references(() => shopItems.id, { onDelete: "cascade" }),
  purchasedAt: timestamp("purchased_at").defaultNow(),
  isEquipped: boolean("is_equipped").notNull().default(false), // Currently active/equipped
}, (table) => ({
  userIdIdx: index("user_inventory_user_id_idx").on(table.userId),
  itemIdIdx: index("user_inventory_item_id_idx").on(table.itemId),
}));

export const coinTransactions = pgTable("coin_transactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  amount: integer("amount").notNull(), // Positive for earned, negative for spent
  type: text("type").notNull(), // 'earned_xp', 'earned_achievement', 'spent_shop', 'purchased', 'bonus'
  description: text("description"),
  relatedItemId: integer("related_item_id"), // Shop item if spent
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("coin_transactions_user_id_idx").on(table.userId),
}));

// === PLAYER RATINGS (Scout/Coach evaluations) ===
export const playerRatings = pgTable("player_ratings", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  ratedByUserId: text("rated_by_user_id").notNull(), // Coach or scout who rated
  raterRole: text("rater_role").notNull(), // 'coach', 'scout', 'system'
  
  // Core ratings (1-100 scale)
  overallRating: integer("overall_rating").notNull(), // Overall player rating
  potentialRating: integer("potential_rating"), // Future potential ceiling
  
  // Position-specific skill ratings (1-100)
  athleticism: integer("athleticism"),
  basketball_iq: integer("basketball_iq"),
  shooting: integer("shooting"),
  passing: integer("passing"),
  defense: integer("defense"),
  rebounding: integer("rebounding"),
  leadership: integer("leadership"),
  
  // Football-specific ratings
  armStrength: integer("arm_strength"),
  accuracy: integer("accuracy"),
  speed: integer("speed"),
  agility: integer("agility"),
  strength: integer("strength"),
  footballIQ: integer("football_iq"),
  
  notes: text("notes"),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  playerIdIdx: index("player_ratings_player_id_idx").on(table.playerId),
  ratedByUserIdIdx: index("player_ratings_rated_by_user_id_idx").on(table.ratedByUserId),
}));

// === STAT VERIFICATIONS (Coach-verified game stats) ===
export const statVerifications = pgTable("stat_verifications", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  verifiedByUserId: text("verified_by_user_id").notNull(), // Coach who verified
  verifierName: text("verifier_name").notNull(), // Coach name for display
  verifierRole: text("verifier_role").notNull(), // 'head_coach', 'assistant_coach', 'athletic_director'
  verificationMethod: text("verification_method").notNull(), // 'in_person', 'game_film', 'official_scoresheet'
  
  // Verification status
  status: text("status").notNull().default("pending"), // 'pending', 'verified', 'disputed', 'rejected'
  verifiedAt: timestamp("verified_at"),
  
  // Optional proof/evidence
  proofUrl: text("proof_url"), // Link to official scoresheet, game film, etc.
  notes: text("notes"),
  
  // Digital signature (hash of stats at time of verification)
  statHash: text("stat_hash"), // SHA256 of game stats for integrity
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  gameIdIdx: index("stat_verifications_game_id_idx").on(table.gameId),
  playerIdIdx: index("stat_verifications_player_id_idx").on(table.playerId),
  statusIdx: index("stat_verifications_status_idx").on(table.status),
}));

// === SKILL CHALLENGES (Timed drills and competitions) ===
export const skillChallenges = pgTable("skill_challenges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // "3-Point Challenge", "Free Throw Streak", etc.
  description: text("description").notNull(),
  sport: text("sport").notNull().default("basketball"), // 'basketball' or 'football'
  category: text("category").notNull(), // 'shooting', 'passing', 'speed', 'agility'
  
  // Challenge parameters
  duration: integer("duration"), // Time limit in seconds (null = no limit)
  targetScore: integer("target_score"), // Target to beat for completion
  maxAttempts: integer("max_attempts"), // Max attempts allowed
  
  // Scoring
  scoringType: text("scoring_type").notNull(), // 'count', 'time', 'accuracy', 'distance'
  higherIsBetter: boolean("higher_is_better").default(true).notNull(),
  
  // Requirements
  requiredTier: text("required_tier"), // Minimum tier to attempt
  isActive: boolean("is_active").default(true).notNull(),
  
  // Rewards
  xpReward: integer("xp_reward").default(50).notNull(),
  coinReward: integer("coin_reward").default(10).notNull(),
  badgeReward: text("badge_reward"), // Badge type earned on completion
  
  createdAt: timestamp("created_at").defaultNow(),
});

// === CHALLENGE RESULTS (Player attempts at skill challenges) ===
export const challengeResults = pgTable("challenge_results", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => skillChallenges.id, { onDelete: "cascade" }),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  
  // Result data
  score: integer("score").notNull(),
  timeElapsed: integer("time_elapsed"), // Time taken in seconds
  attemptNumber: integer("attempt_number").notNull().default(1),
  
  // Verification
  videoProofUrl: text("video_proof_url"), // Video of challenge attempt
  isVerified: boolean("is_verified").default(false).notNull(),
  verifiedByUserId: text("verified_by_user_id"),
  
  // Rank/position at time of completion
  leaderboardRank: integer("leaderboard_rank"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  challengeIdIdx: index("challenge_results_challenge_id_idx").on(table.challengeId),
  playerIdIdx: index("challenge_results_player_id_idx").on(table.playerId),
  scoreIdx: index("challenge_results_score_idx").on(table.score),
}));

// === PERFORMANCE MILESTONES (Career achievements) ===
export const performanceMilestones = pgTable("performance_milestones", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  
  // Milestone details
  milestoneType: text("milestone_type").notNull(), // 'points', 'assists', 'rebounds', 'games', etc.
  milestoneValue: integer("milestone_value").notNull(), // e.g., 500, 1000, 100
  milestoneTitle: text("milestone_title").notNull(), // "500 Career Points"
  
  // When achieved
  achievedAt: timestamp("achieved_at").defaultNow(),
  achievedInGameId: integer("achieved_in_game_id").references(() => games.id, { onDelete: "set null" }),
  
  // Celebration
  isAnnounced: boolean("is_announced").default(false).notNull(),
  xpAwarded: integer("xp_awarded").default(100).notNull(),
  coinAwarded: integer("coin_awarded").default(25).notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  playerIdIdx: index("performance_milestones_player_id_idx").on(table.playerId),
  milestoneTypeIdx: index("performance_milestones_type_idx").on(table.milestoneType),
}));

// === AI PROJECTIONS (Gemini-powered future predictions) ===
export const aiProjections = pgTable("ai_projections", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  
  // Projection type
  projectionType: text("projection_type").notNull(), // 'season_end', 'college_potential', 'nba_draft', 'career'
  
  // Predicted ratings (1-100)
  projectedOverall: integer("projected_overall"),
  projectedPotential: integer("projected_potential"),
  
  // Predicted stats (per-game averages)
  projectedPpg: decimal("projected_ppg", { precision: 4, scale: 1 }),
  projectedRpg: decimal("projected_rpg", { precision: 4, scale: 1 }),
  projectedApg: decimal("projected_apg", { precision: 4, scale: 1 }),
  projectedFgPct: decimal("projected_fg_pct", { precision: 4, scale: 1 }),
  
  // AI analysis
  strengthsAnalysis: text("strengths_analysis"), // What player does well
  areasToImprove: text("areas_to_improve"), // Development areas
  comparisonPlayer: text("comparison_player"), // "Plays like a young X"
  collegeFit: text("college_fit"), // Type of program that fits
  
  // Confidence and metadata
  confidenceScore: integer("confidence_score"), // 1-100 how confident the AI is
  dataPointsUsed: integer("data_points_used"), // Number of games analyzed
  modelVersion: text("model_version"), // AI model version used
  
  // Validity
  validUntil: timestamp("valid_until"), // When projection expires
  isActive: boolean("is_active").default(true).notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  playerIdIdx: index("ai_projections_player_id_idx").on(table.playerId),
  projectionTypeIdx: index("ai_projections_type_idx").on(table.projectionType),
}));

// === HIGHLIGHT VERIFICATIONS (Anti-fake detection) ===
export const highlightVerifications = pgTable("highlight_verifications", {
  id: serial("id").primaryKey(),
  highlightId: integer("highlight_id").notNull().references(() => highlightClips.id, { onDelete: "cascade" }),
  
  // Verification status
  verificationStatus: text("verification_status").notNull().default("pending"), // 'pending', 'verified', 'suspicious', 'fake'
  
  // AI analysis results
  duplicateCheckPassed: boolean("duplicate_check_passed"),
  duplicateOfHighlightId: integer("duplicate_of_highlight_id"),
  metadataConsistent: boolean("metadata_consistent"),
  aiConfidenceScore: integer("ai_confidence_score"), // 1-100
  
  // Manual review
  manuallyReviewedBy: text("manually_reviewed_by"),
  manualReviewNotes: text("manual_review_notes"),
  reviewedAt: timestamp("reviewed_at"),
  
  // Flags
  flaggedReasons: text("flagged_reasons"), // JSON array of reasons
  appealStatus: text("appeal_status"), // 'none', 'pending', 'approved', 'denied'
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  highlightIdIdx: index("highlight_verifications_highlight_id_idx").on(table.highlightId),
  statusIdx: index("highlight_verifications_status_idx").on(table.verificationStatus),
}));

// === EVENT INTEGRATIONS (Official tournament/league connections) ===
export const eventIntegrations = pgTable("event_integrations", {
  id: serial("id").primaryKey(),
  eventName: text("event_name").notNull(), // "State Championship 2025"
  eventType: text("event_type").notNull(), // 'tournament', 'league', 'showcase', 'camp'
  organizationName: text("organization_name").notNull(),
  
  // External integration
  externalEventId: text("external_event_id"), // ID from external system
  externalApiSource: text("external_api_source"), // 'maxpreps', 'hudl', 'scorebook_live', etc.
  
  // Event details
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  location: text("location"),
  sport: text("sport").notNull().default("basketball"),
  
  // Verification
  isOfficial: boolean("is_official").default(false).notNull(),
  verificationCode: text("verification_code"), // Code for participants to verify
  
  createdAt: timestamp("created_at").defaultNow(),
});

// === EVENT GAME LINKS (Connect games to official events) ===
export const eventGameLinks = pgTable("event_game_links", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => eventIntegrations.id, { onDelete: "cascade" }),
  gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  
  // External data
  externalGameId: text("external_game_id"), // ID from external system
  externalStatsUrl: text("external_stats_url"), // Link to official stats
  
  // Sync status
  syncStatus: text("sync_status").default("pending"), // 'pending', 'synced', 'error'
  lastSyncAt: timestamp("last_sync_at"),
  syncError: text("sync_error"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  eventIdIdx: index("event_game_links_event_id_idx").on(table.eventId),
  gameIdIdx: index("event_game_links_game_id_idx").on(table.gameId),
}));

// === LEAGUES & RIVALRIES ===
export const leagues = pgTable("leagues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sport: text("sport").notNull().default("basketball"), // 'basketball' or 'football'
  description: text("description"),
  logoUrl: text("logo_url"),
  
  // League settings
  seasonName: text("season_name"), // "Spring 2025"
  startDate: date("start_date"),
  endDate: date("end_date"),
  maxTeams: integer("max_teams").default(12),
  gameFormat: text("game_format").default("round_robin"), // 'round_robin', 'single_elimination', 'double_elimination'
  
  // Privacy
  isPublic: boolean("is_public").default(true).notNull(),
  joinCode: text("join_code"), // For private leagues
  
  // Admin
  createdByUserId: text("created_by_user_id").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  sportIdx: index("leagues_sport_idx").on(table.sport),
  createdByIdx: index("leagues_created_by_idx").on(table.createdByUserId),
}));

export const leagueTeams = pgTable("league_teams", {
  id: serial("id").primaryKey(),
  leagueId: integer("league_id").notNull().references(() => leagues.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default("#00D4FF"),
  
  // Captain/Manager
  captainUserId: text("captain_user_id"), // User who manages this team
  
  // Stats (computed/cached)
  wins: integer("wins").default(0).notNull(),
  losses: integer("losses").default(0).notNull(),
  ties: integer("ties").default(0).notNull(),
  pointsFor: integer("points_for").default(0).notNull(),
  pointsAgainst: integer("points_against").default(0).notNull(),
  
  // Playoff status
  playoffSeed: integer("playoff_seed"),
  isEliminated: boolean("is_eliminated").default(false).notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  leagueIdIdx: index("league_teams_league_id_idx").on(table.leagueId),
  captainIdx: index("league_teams_captain_idx").on(table.captainUserId),
}));

export const leagueTeamRosters = pgTable("league_team_rosters", {
  id: serial("id").primaryKey(),
  leagueTeamId: integer("league_team_id").notNull().references(() => leagueTeams.id, { onDelete: "cascade" }),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  jerseyNumber: integer("jersey_number"),
  position: text("position"),
  role: text("role").default("player"), // 'captain', 'co-captain', 'player'
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => ({
  teamIdIdx: index("league_team_rosters_team_id_idx").on(table.leagueTeamId),
  playerIdIdx: index("league_team_rosters_player_id_idx").on(table.playerId),
}));

export const leagueGames = pgTable("league_games", {
  id: serial("id").primaryKey(),
  leagueId: integer("league_id").notNull().references(() => leagues.id, { onDelete: "cascade" }),
  homeTeamId: integer("home_team_id").notNull().references(() => leagueTeams.id, { onDelete: "cascade" }),
  awayTeamId: integer("away_team_id").notNull().references(() => leagueTeams.id, { onDelete: "cascade" }),
  
  // Schedule
  scheduledDate: timestamp("scheduled_date"),
  location: text("location"),
  
  // Scores
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  
  // Status
  status: text("status").default("scheduled").notNull(), // 'scheduled', 'live', 'final', 'postponed', 'cancelled'
  quarter: integer("quarter"), // Current quarter/period for live games
  gameTime: text("game_time"), // "5:32" remaining in quarter
  
  // Playoff info
  isPlayoff: boolean("is_playoff").default(false).notNull(),
  playoffRound: text("playoff_round"), // 'quarterfinal', 'semifinal', 'championship'
  
  // Link to player stats (optional)
  linkedGameId: integer("linked_game_id").references(() => games.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  leagueIdIdx: index("league_games_league_id_idx").on(table.leagueId),
  homeTeamIdx: index("league_games_home_team_idx").on(table.homeTeamId),
  awayTeamIdx: index("league_games_away_team_idx").on(table.awayTeamId),
  statusIdx: index("league_games_status_idx").on(table.status),
}));

export const leagueRivalries = pgTable("league_rivalries", {
  id: serial("id").primaryKey(),
  leagueId: integer("league_id").notNull().references(() => leagues.id, { onDelete: "cascade" }),
  team1Id: integer("team_1_id").notNull().references(() => leagueTeams.id, { onDelete: "cascade" }),
  team2Id: integer("team_2_id").notNull().references(() => leagueTeams.id, { onDelete: "cascade" }),
  
  // Rivalry name (e.g., "The Crosstown Classic")
  rivalryName: text("rivalry_name"),
  
  // Historical record
  team1Wins: integer("team_1_wins").default(0).notNull(),
  team2Wins: integer("team_2_wins").default(0).notNull(),
  ties: integer("ties").default(0).notNull(),
  
  // Streak tracking
  currentStreakTeamId: integer("current_streak_team_id"),
  currentStreakCount: integer("current_streak_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  leagueIdIdx: index("league_rivalries_league_id_idx").on(table.leagueId),
}));

// === COLLEGE DATABASE (for AI Recruiting Match) ===
export const colleges = pgTable("colleges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  shortName: text("short_name"), // "UCLA", "Duke"
  logoUrl: text("logo_url"),
  
  // Location
  city: text("city").notNull(),
  state: text("state").notNull(),
  region: text("region"), // 'West', 'East', 'Midwest', 'South'
  
  // Academic
  division: text("division").notNull(), // 'D1', 'D2', 'D3', 'NAIA', 'JUCO'
  conference: text("conference"), // "Pac-12", "Big Ten", etc.
  academicRating: integer("academic_rating"), // 1-100
  avgGpaRequired: decimal("avg_gpa_required", { precision: 3, scale: 2 }),
  satRange: text("sat_range"), // "1200-1400"
  
  // Sports program
  sport: text("sport").notNull().default("basketball"),
  programStrength: integer("program_strength"), // 1-100 overall program rating
  coachingRating: integer("coaching_rating"), // 1-100
  facilitiesRating: integer("facilities_rating"), // 1-100
  
  // === REAL PROGRAM STATISTICS ===
  // Overall record
  winsLastSeason: integer("wins_last_season"), // Total wins last season
  lossesLastSeason: integer("losses_last_season"), // Total losses last season
  conferenceRecord: text("conference_record"), // e.g., "14-4" or "8-1"
  
  // Historical success
  nationalChampionships: integer("national_championships").default(0), // Total program championships
  conferenceChampionships: integer("conference_championships").default(0), // Total conference titles
  tournamentAppearances: integer("tournament_appearances").default(0), // March Madness or Bowl games
  finalFourAppearances: integer("final_four_appearances").default(0), // Basketball: Final Four / Football: CFP
  
  // Player development metrics
  nbaPlayersProduced: integer("nba_players_produced").default(0), // Basketball: NBA draft picks all-time
  nflPlayersProduced: integer("nfl_players_produced").default(0), // Football: NFL draft picks all-time
  draftPicksLast5Years: integer("draft_picks_last_5_years").default(0), // Recent pro success
  averageMinutesForFreshmen: integer("avg_minutes_freshmen"), // Playing time opportunity
  
  // Academic success for athletes
  athleteGraduationRate: integer("athlete_graduation_rate"), // % of athletes who graduate
  academicAllAmericans: integer("academic_all_americans").default(0), // Academic honors
  
  // Program resources & support
  athleticBudget: text("athletic_budget"), // e.g., "$150M" annual budget
  averageAttendance: integer("average_attendance"), // Home game attendance
  niLOpportunities: text("nil_opportunities"), // NIL market size: "High", "Medium", "Low"
  
  // Current roster info
  currentRosterSize: integer("current_roster_size"),
  incomingRecruitingClass: integer("incoming_recruiting_class"), // Size of next year's class
  headCoachName: text("head_coach_name"),
  headCoachYears: integer("head_coach_years"), // Years at this program
  headCoachRecord: text("head_coach_record"), // e.g., "234-87"
  
  // Play style (for matching algorithm)
  tempoRating: integer("tempo_rating"), // 1-100 (100 = fast pace)
  defensiveStyle: text("defensive_style"), // 'man', 'zone', 'switching', 'pressure'
  offensiveStyle: text("offensive_style"), // 'motion', 'iso', 'pick_and_roll', 'spread'
  
  // Roster needs (what positions they're recruiting)
  positionNeeds: text("position_needs"), // JSON array of positions
  scholarshipsAvailable: integer("scholarships_available"),
  
  // Contact
  recruitingContactEmail: text("recruiting_contact_email"),
  recruitingUrl: text("recruiting_url"),
  
  // Data freshness tracking
  statsLastUpdated: timestamp("stats_last_updated"), // When stats were last synced from API
  statsSource: text("stats_source"), // 'manual', 'cfb_api', 'espn_api'
  
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  divisionIdx: index("colleges_division_idx").on(table.division),
  sportIdx: index("colleges_sport_idx").on(table.sport),
  stateIdx: index("colleges_state_idx").on(table.state),
}));

export const playerCollegeMatches = pgTable("player_college_matches", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  collegeId: integer("college_id").notNull().references(() => colleges.id, { onDelete: "cascade" }),
  
  // Match scores (0-100)
  overallMatchScore: integer("overall_match_score").notNull(),
  skillMatchScore: integer("skill_match_score"),
  academicMatchScore: integer("academic_match_score"),
  styleMatchScore: integer("style_match_score"), // Play style fit
  locationMatchScore: integer("location_match_score"),
  
  // AI analysis
  matchReasoning: text("match_reasoning"), // Why this is a good fit
  strengthsForProgram: text("strengths_for_program"),
  developmentAreas: text("development_areas"),
  
  // Status
  isRecommended: boolean("is_recommended").default(false).notNull(), // Top 10 match
  isSaved: boolean("is_saved").default(false).notNull(), // Player saved this match
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  playerIdIdx: index("player_college_matches_player_id_idx").on(table.playerId),
  collegeIdIdx: index("player_college_matches_college_id_idx").on(table.collegeId),
  matchScoreIdx: index("player_college_matches_score_idx").on(table.overallMatchScore),
}));

// === FITNESS / WEARABLE DATA ===
export const fitnessData = pgTable("fitness_data", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  
  // Source
  source: text("source").notNull(), // 'apple_health', 'google_fit', 'whoop', 'manual'
  syncedAt: timestamp("synced_at"),
  
  // Date range this data covers
  date: date("date").notNull(),
  
  // Activity metrics
  stepCount: integer("step_count"),
  activeMinutes: integer("active_minutes"),
  caloriesBurned: integer("calories_burned"),
  distanceMeters: decimal("distance_meters", { precision: 10, scale: 2 }),
  
  // Heart rate
  restingHeartRate: integer("resting_heart_rate"),
  avgHeartRate: integer("avg_heart_rate"),
  maxHeartRate: integer("max_heart_rate"),
  hrvScore: integer("hrv_score"), // Heart rate variability (higher = better recovery)
  
  // Sleep
  sleepHours: decimal("sleep_hours", { precision: 4, scale: 2 }),
  sleepQualityScore: integer("sleep_quality_score"), // 1-100
  deepSleepMinutes: integer("deep_sleep_minutes"),
  remSleepMinutes: integer("rem_sleep_minutes"),
  
  // Recovery / Readiness
  recoveryScore: integer("recovery_score"), // 1-100 (Whoop-style)
  strainScore: decimal("strain_score", { precision: 4, scale: 2 }), // 0-21 (Whoop-style)
  readinessScore: integer("readiness_score"), // 1-100
  
  // Training load
  workoutCount: integer("workout_count"),
  trainingLoadScore: integer("training_load_score"), // Cumulative training stress
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  playerIdIdx: index("fitness_data_player_id_idx").on(table.playerId),
  dateIdx: index("fitness_data_date_idx").on(table.date),
  sourceIdx: index("fitness_data_source_idx").on(table.source),
}));

// === WEARABLE CONNECTIONS (OAuth connections for fitness wearables) ===
export const wearableConnections = pgTable("wearable_connections", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // 'fitbit', 'google_fit', 'whoop', 'apple_health'
  accessToken: text("access_token").notNull(), // Encrypted in production
  refreshToken: text("refresh_token"), // Nullable
  tokenExpiresAt: timestamp("token_expires_at"),
  lastSyncAt: timestamp("last_sync_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  playerIdIdx: index("wearable_connections_player_id_idx").on(table.playerId),
  providerIdx: index("wearable_connections_provider_idx").on(table.provider),
}));

// === SCHEMAS FOR NEW TABLES ===
export const insertPlayerRatingSchema = createInsertSchema(playerRatings).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPlayerRating = z.infer<typeof insertPlayerRatingSchema>;
export type PlayerRating = typeof playerRatings.$inferSelect;

export const insertStatVerificationSchema = createInsertSchema(statVerifications).omit({ id: true, createdAt: true });
export type InsertStatVerification = z.infer<typeof insertStatVerificationSchema>;
export type StatVerification = typeof statVerifications.$inferSelect;

export const insertSkillChallengeSchema = createInsertSchema(skillChallenges).omit({ id: true, createdAt: true });
export type InsertSkillChallenge = z.infer<typeof insertSkillChallengeSchema>;
export type SkillChallenge = typeof skillChallenges.$inferSelect;

export const insertChallengeResultSchema = createInsertSchema(challengeResults).omit({ id: true, createdAt: true });
export type InsertChallengeResult = z.infer<typeof insertChallengeResultSchema>;
export type ChallengeResult = typeof challengeResults.$inferSelect;

export const insertPerformanceMilestoneSchema = createInsertSchema(performanceMilestones).omit({ id: true, createdAt: true });
export type InsertPerformanceMilestone = z.infer<typeof insertPerformanceMilestoneSchema>;
export type PerformanceMilestone = typeof performanceMilestones.$inferSelect;

export const insertAiProjectionSchema = createInsertSchema(aiProjections).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAiProjection = z.infer<typeof insertAiProjectionSchema>;
export type AiProjection = typeof aiProjections.$inferSelect;

export const insertHighlightVerificationSchema = createInsertSchema(highlightVerifications).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertHighlightVerification = z.infer<typeof insertHighlightVerificationSchema>;
export type HighlightVerification = typeof highlightVerifications.$inferSelect;

export const insertEventIntegrationSchema = createInsertSchema(eventIntegrations).omit({ id: true, createdAt: true });
export type InsertEventIntegration = z.infer<typeof insertEventIntegrationSchema>;
export type EventIntegration = typeof eventIntegrations.$inferSelect;

export const insertEventGameLinkSchema = createInsertSchema(eventGameLinks).omit({ id: true, createdAt: true });
export type InsertEventGameLink = z.infer<typeof insertEventGameLinkSchema>;
export type EventGameLink = typeof eventGameLinks.$inferSelect;

// === LEAGUE SCHEMAS & TYPES ===
export const insertLeagueSchema = createInsertSchema(leagues).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLeague = z.infer<typeof insertLeagueSchema>;
export type League = typeof leagues.$inferSelect;

export const insertLeagueTeamSchema = createInsertSchema(leagueTeams).omit({ id: true, createdAt: true });
export type InsertLeagueTeam = z.infer<typeof insertLeagueTeamSchema>;
export type LeagueTeam = typeof leagueTeams.$inferSelect;

export const insertLeagueTeamRosterSchema = createInsertSchema(leagueTeamRosters).omit({ id: true, joinedAt: true });
export type InsertLeagueTeamRoster = z.infer<typeof insertLeagueTeamRosterSchema>;
export type LeagueTeamRoster = typeof leagueTeamRosters.$inferSelect;

export const insertLeagueGameSchema = createInsertSchema(leagueGames).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLeagueGame = z.infer<typeof insertLeagueGameSchema>;
export type LeagueGame = typeof leagueGames.$inferSelect;

export const insertLeagueRivalrySchema = createInsertSchema(leagueRivalries).omit({ id: true, createdAt: true });
export type InsertLeagueRivalry = z.infer<typeof insertLeagueRivalrySchema>;
export type LeagueRivalry = typeof leagueRivalries.$inferSelect;

// === COLLEGE SCHEMAS & TYPES ===
export const insertCollegeSchema = createInsertSchema(colleges).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCollege = z.infer<typeof insertCollegeSchema>;
export type College = typeof colleges.$inferSelect;

export const insertPlayerCollegeMatchSchema = createInsertSchema(playerCollegeMatches).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPlayerCollegeMatch = z.infer<typeof insertPlayerCollegeMatchSchema>;
export type PlayerCollegeMatch = typeof playerCollegeMatches.$inferSelect;

// === PLAYER COLLEGE INTERESTS ===
export const playerCollegeInterests = pgTable("player_college_interests", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  collegeId: integer("college_id").notNull(),
  interestLevel: text("interest_level").default("interested"), // 'interested', 'very_interested', 'committed'
  notes: text("notes"),
  contacted: boolean("contacted").default(false),
  contactedAt: timestamp("contacted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  playerIdIdx: index("player_college_interests_player_idx").on(table.playerId),
  collegeIdIdx: index("player_college_interests_college_idx").on(table.collegeId),
  uniqueInterest: index("player_college_interests_unique").on(table.playerId, table.collegeId),
}));

export const insertPlayerCollegeInterestSchema = createInsertSchema(playerCollegeInterests).omit({ id: true, createdAt: true });
export type InsertPlayerCollegeInterest = z.infer<typeof insertPlayerCollegeInterestSchema>;
export type PlayerCollegeInterest = typeof playerCollegeInterests.$inferSelect;

// === PROFILE VIEWS (Track when public profiles are viewed) ===
export const profileViews = pgTable("profile_views", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  viewerIp: text("viewer_ip"), // Anonymized/hashed IP to prevent duplicate counting
  viewerUserId: text("viewer_user_id"), // If viewer is logged in (optional)
  referrer: text("referrer"), // Where the view came from
  userAgent: text("user_agent"), // Browser/device info
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
}, (table) => ({
  playerIdIdx: index("profile_views_player_idx").on(table.playerId),
  viewedAtIdx: index("profile_views_viewed_at_idx").on(table.viewedAt),
}));

export const insertProfileViewSchema = createInsertSchema(profileViews).omit({ id: true, viewedAt: true });
export type InsertProfileView = z.infer<typeof insertProfileViewSchema>;
export type ProfileView = typeof profileViews.$inferSelect;

// === RECRUITING EVENTS (Camps & Showcases) ===
export const recruitingEvents = pgTable("recruiting_events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sport: text("sport").notNull(), // 'basketball' or 'football'
  eventType: text("event_type").notNull(), // 'camp', 'showcase', 'combine', 'tournament', 'prospect_day'
  description: text("description"),
  hostOrganization: text("host_organization"), // College name or organization
  collegeId: integer("college_id").references(() => colleges.id, { onDelete: "set null" }),
  location: text("location").notNull(),
  city: text("city"),
  state: text("state"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  registrationDeadline: date("registration_deadline"),
  cost: integer("cost"), // Cost in cents
  isFree: boolean("is_free").default(false),
  registrationUrl: text("registration_url"),
  contactEmail: text("contact_email"),
  ageGroups: text("age_groups"), // JSON: ["high_school", "middle_school", "college"]
  positions: text("positions"), // JSON: ["QB", "RB", "WR"] or ["Guard", "Wing", "Big"]
  maxParticipants: integer("max_participants"),
  spotsRemaining: integer("spots_remaining"),
  isVerified: boolean("is_verified").default(false), // Admin verified
  // Visibility and ownership
  visibility: text("visibility").notNull().default("public"), // 'public' or 'team'
  teamId: integer("team_id").references(() => teams.id, { onDelete: "cascade" }), // For team-only events
  createdBy: text("created_by"), // userId of who created this event
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  sportIdx: index("recruiting_events_sport_idx").on(table.sport),
  stateIdx: index("recruiting_events_state_idx").on(table.state),
  startDateIdx: index("recruiting_events_start_date_idx").on(table.startDate),
  collegeIdIdx: index("recruiting_events_college_id_idx").on(table.collegeId),
  teamIdIdx: index("recruiting_events_team_id_idx").on(table.teamId),
  visibilityIdx: index("recruiting_events_visibility_idx").on(table.visibility),
}));

export const insertRecruitingEventSchema = createInsertSchema(recruitingEvents).omit({ id: true, createdAt: true });
export type InsertRecruitingEvent = z.infer<typeof insertRecruitingEventSchema>;
export type RecruitingEvent = typeof recruitingEvents.$inferSelect;

// === PLAYER EVENT REGISTRATIONS ===
export const playerEventRegistrations = pgTable("player_event_registrations", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  eventId: integer("event_id").notNull().references(() => recruitingEvents.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("interested"), // 'interested', 'registered', 'attended', 'cancelled'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  playerIdIdx: index("player_event_registrations_player_idx").on(table.playerId),
  eventIdIdx: index("player_event_registrations_event_idx").on(table.eventId),
}));

export const insertPlayerEventRegistrationSchema = createInsertSchema(playerEventRegistrations).omit({ id: true, createdAt: true });
export type InsertPlayerEventRegistration = z.infer<typeof insertPlayerEventRegistrationSchema>;
export type PlayerEventRegistration = typeof playerEventRegistrations.$inferSelect;

// === NCAA ELIGIBILITY CHECKLIST ===
export const ncaaEligibilityProgress = pgTable("ncaa_eligibility_progress", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  
  // NCAA Eligibility Center Registration
  ncaaIdNumber: text("ncaa_id_number"),
  registeredWithNcaa: boolean("registered_with_ncaa").default(false),
  
  // Academic Requirements
  coreCoursesCompleted: integer("core_courses_completed").default(0), // Out of 16 for D1
  coreGpa: decimal("core_gpa", { precision: 3, scale: 2 }),
  slidingScaleEligible: boolean("sliding_scale_eligible"), // Based on GPA + test score
  
  // Test Scores
  satScore: integer("sat_score"),
  actScore: integer("act_score"),
  testScoresSent: boolean("test_scores_sent").default(false),
  
  // Transcript
  transcriptSent: boolean("transcript_sent").default(false),
  finalTranscriptSent: boolean("final_transcript_sent").default(false),
  
  // Amateurism
  amateurismCertified: boolean("amateurism_certified").default(false),
  amateurismQuestionnaireDone: boolean("amateurism_questionnaire_done").default(false),
  
  // Overall Status
  eligibilityStatus: text("eligibility_status").default("in_progress"), // 'in_progress', 'pending_review', 'certified', 'not_eligible'
  targetDivision: text("target_division").default("D1"), // 'D1', 'D2', 'D3', 'NAIA', 'JUCO'
  
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  playerIdIdx: index("ncaa_eligibility_progress_player_idx").on(table.playerId),
}));

export const insertNcaaEligibilityProgressSchema = createInsertSchema(ncaaEligibilityProgress).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertNcaaEligibilityProgress = z.infer<typeof insertNcaaEligibilityProgressSchema>;
export type NcaaEligibilityProgress = typeof ncaaEligibilityProgress.$inferSelect;

// === COACH RECOMMENDATIONS ===
export const coachRecommendations = pgTable("coach_recommendations", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  coachUserId: text("coach_user_id").notNull(), // The user ID of the coach writing the recommendation
  coachName: text("coach_name").notNull(),
  coachTitle: text("coach_title"), // "Head Coach", "Assistant Coach", "Trainer"
  coachOrganization: text("coach_organization"), // School or team name
  coachEmail: text("coach_email"),
  coachPhone: text("coach_phone"),
  
  // Recommendation Content
  recommendation: text("recommendation").notNull(), // The actual recommendation text
  relationship: text("relationship"), // "Head Coach", "Position Coach", "Trainer", "AAU Coach"
  yearsKnown: integer("years_known"),
  
  // Ratings (1-10 scale)
  athleticAbilityRating: integer("athletic_ability_rating"),
  workEthicRating: integer("work_ethic_rating"),
  coachabilityRating: integer("coachability_rating"),
  leadershipRating: integer("leadership_rating"),
  characterRating: integer("character_rating"),
  
  // Verification
  isVerified: boolean("is_verified").default(false), // Admin/system verified
  isPublic: boolean("is_public").default(true), // Show on public profile
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  playerIdIdx: index("coach_recommendations_player_idx").on(table.playerId),
  coachUserIdIdx: index("coach_recommendations_coach_idx").on(table.coachUserId),
}));

export const insertCoachRecommendationSchema = createInsertSchema(coachRecommendations).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCoachRecommendation = z.infer<typeof insertCoachRecommendationSchema>;
export type CoachRecommendation = typeof coachRecommendations.$inferSelect;

// === NCAA ELIGIBILITY CONSTANTS ===
export const NCAA_CORE_COURSE_REQUIREMENTS = {
  D1: {
    totalCourses: 16,
    english: 4,
    math: 3,
    science: 2,
    socialScience: 2,
    additionalEnglishMathScience: 1,
    additionalFromAbove: 4,
    minCoreGpa: 2.3,
  },
  D2: {
    totalCourses: 16,
    english: 3,
    math: 2,
    science: 2,
    socialScience: 2,
    additionalEnglishMathScience: 3,
    additionalFromAbove: 4,
    minCoreGpa: 2.2,
  },
  D3: {
    note: "D3 schools do not offer athletic scholarships and have their own admission requirements",
  },
  NAIA: {
    requirements: "Graduate from high school, meet 2 of 3: GPA 2.0+, ACT 18+ or SAT 970+, or top 50% of class",
  },
  JUCO: {
    requirements: "High school diploma or GED required",
  },
} as const;

export const RECRUITING_EVENT_TYPES = {
  camp: { name: "Camp", description: "Multi-day skill development camp" },
  showcase: { name: "Showcase", description: "Competitive event for exposure to college coaches" },
  combine: { name: "Combine", description: "Athletic testing and evaluation event" },
  tournament: { name: "Tournament", description: "Competitive tournament with college scouts" },
  prospect_day: { name: "Prospect Day", description: "Campus visit and evaluation day" },
} as const;

// === FITNESS DATA SCHEMAS & TYPES ===
export const insertFitnessDataSchema = createInsertSchema(fitnessData).omit({ id: true, createdAt: true });
export type InsertFitnessData = z.infer<typeof insertFitnessDataSchema>;
export type FitnessData = typeof fitnessData.$inferSelect;

// === WEARABLE CONNECTIONS SCHEMAS & TYPES ===
export const insertWearableConnectionSchema = createInsertSchema(wearableConnections).omit({ id: true, createdAt: true });
export type InsertWearableConnection = z.infer<typeof insertWearableConnectionSchema>;
export type WearableConnection = typeof wearableConnections.$inferSelect;

// === MILESTONE DEFINITIONS ===
export const MILESTONE_DEFINITIONS = {
  basketball: {
    points: [100, 250, 500, 1000, 2000, 5000],
    assists: [50, 100, 250, 500, 1000],
    rebounds: [50, 100, 250, 500, 1000],
    steals: [25, 50, 100, 250],
    blocks: [25, 50, 100, 250],
    games: [10, 25, 50, 100, 200],
    a_grades: [5, 10, 25, 50, 100],
  },
  football: {
    passing_yards: [500, 1000, 2500, 5000, 10000],
    passing_tds: [5, 10, 25, 50, 100],
    rushing_yards: [250, 500, 1000, 2000, 5000],
    rushing_tds: [5, 10, 25, 50],
    receiving_yards: [250, 500, 1000, 2000, 5000],
    receptions: [25, 50, 100, 200],
    tackles: [25, 50, 100, 250, 500],
    sacks: [5, 10, 25, 50],
    interceptions: [2, 5, 10, 25],
    games: [10, 25, 50, 100],
  },
} as const;

// === SHOP SCHEMAS & TYPES ===
export const insertShopItemSchema = createInsertSchema(shopItems).omit({ id: true, createdAt: true });
export type InsertShopItem = z.infer<typeof insertShopItemSchema>;
export type ShopItem = typeof shopItems.$inferSelect;

export const insertUserInventorySchema = createInsertSchema(userInventory).omit({ id: true, purchasedAt: true });
export type InsertUserInventory = z.infer<typeof insertUserInventorySchema>;
export type UserInventory = typeof userInventory.$inferSelect;

export const insertCoinTransactionSchema = createInsertSchema(coinTransactions).omit({ id: true, createdAt: true });
export type InsertCoinTransaction = z.infer<typeof insertCoinTransactionSchema>;
export type CoinTransaction = typeof coinTransactions.$inferSelect;

// === SHOP CONSTANTS ===
export const SHOP_CATEGORIES = {
  theme: { name: "Themes", description: "Change your app's accent color and style", icon: "Palette" },
  profile_skin: { name: "Profile Skins", description: "Custom backgrounds and borders for your profile", icon: "User" },
  badge_style: { name: "Badge Styles", description: "Exclusive badge designs", icon: "Award" },
  effect: { name: "Effects", description: "Special animations and particles", icon: "Sparkles" },
  team_look: { name: "Team Looks", description: "Customize your team's appearance", icon: "Users" },
} as const;

export const RARITY_COLORS = {
  common: { name: "Common", color: "#9CA3AF", glow: "none" },
  rare: { name: "Rare", color: "#3B82F6", glow: "0 0 10px rgba(59, 130, 246, 0.5)" },
  epic: { name: "Epic", color: "#A855F7", glow: "0 0 15px rgba(168, 85, 247, 0.6)" },
  legendary: { name: "Legendary", color: "#F59E0B", glow: "0 0 20px rgba(245, 158, 11, 0.7)" },
} as const;

export const COIN_REWARDS = {
  game_logged: 10,          // Earn coins when logging a game
  badge_earned: 5,          // Earn coins when getting a badge
  goal_completed: 25,       // Complete a personal goal
  streak_bonus_3: 10,       // 3-day streak
  streak_bonus_7: 25,       // 7-day streak
  streak_bonus_14: 50,      // 14-day streak
  streak_bonus_30: 100,     // 30-day streak
  a_grade: 15,              // Get an A grade
  a_plus_grade: 25,         // Get an A+ grade
  tier_up: 50,              // Level up a tier
  daily_login: 5,           // Daily login bonus
} as const;

// Coin packages available for purchase
export const COIN_PACKAGES = [
  { id: "coins_100", name: "Starter Pack", coins: 100, priceInCents: 199, popular: false },
  { id: "coins_500", name: "Value Pack", coins: 500, priceInCents: 499, popular: true },
  { id: "coins_1200", name: "Super Pack", coins: 1200, priceInCents: 999, popular: false },
  { id: "coins_3000", name: "Mega Pack", coins: 3000, priceInCents: 1999, popular: false },
] as const;

export type CoinPackage = typeof COIN_PACKAGES[number];

// Export auth models
export * from "./models/auth";
