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
