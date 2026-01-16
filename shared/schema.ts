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
  hustleScore: integer("hustle_score").default(50), // 0-100 subjective score
  defenseRating: integer("defense_rating").default(50), // 0-100 subjective score
  notes: text("notes"), // Video notes or observations
  
  // Calculated / Generated Fields (Stored for easy querying)
  grade: text("grade"), // A+, B, C-, etc.
  feedback: text("feedback"), // Generated coaching feedback
  
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
} as const;
