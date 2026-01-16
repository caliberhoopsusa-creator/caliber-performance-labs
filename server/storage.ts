import { db } from "./db";
import {
  players, games, badges, goals, streaks,
  type Player, type InsertPlayer,
  type Game, type InsertGame,
  type UpdateGameRequest,
  type Badge, type InsertBadge,
  type Goal, type InsertGoal,
  type Streak, type InsertStreak
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Players
  getPlayers(): Promise<Player[]>;
  getPlayer(id: number): Promise<(Player & { games: Game[] }) | undefined>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  deletePlayer(id: number): Promise<void>;

  // Games
  createGame(game: InsertGame): Promise<Game>;
  getGame(id: number): Promise<Game | undefined>;
  deleteGame(id: number): Promise<void>;
  getGamesByPlayerId(playerId: number): Promise<Game[]>;

  // Badges
  createBadge(badge: InsertBadge): Promise<Badge>;
  getPlayerBadges(playerId: number): Promise<Badge[]>;
  getBadgesByGame(gameId: number): Promise<Badge[]>;

  // Goals
  createGoal(goal: InsertGoal): Promise<Goal>;
  getPlayerGoals(playerId: number): Promise<Goal[]>;
  updateGoal(id: number, updates: Partial<Goal>): Promise<Goal | undefined>;
  deleteGoal(id: number): Promise<void>;

  // Streaks
  getPlayerStreaks(playerId: number): Promise<Streak[]>;
  getOrCreateStreak(playerId: number, streakType: string): Promise<Streak>;
  updateStreak(id: number, updates: Partial<Streak>): Promise<Streak | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getPlayers(): Promise<Player[]> {
    return await db.select().from(players).orderBy(desc(players.createdAt));
  }

  async getPlayer(id: number): Promise<(Player & { games: Game[] }) | undefined> {
    const [player] = await db.select().from(players).where(eq(players.id, id));
    if (!player) return undefined;

    const playerGames = await db
      .select()
      .from(games)
      .where(eq(games.playerId, id))
      .orderBy(desc(games.date));

    return { ...player, games: playerGames };
  }

  async createPlayer(player: InsertPlayer): Promise<Player> {
    const [newPlayer] = await db.insert(players).values(player).returning();
    return newPlayer;
  }

  async deletePlayer(id: number): Promise<void> {
    await db.delete(games).where(eq(games.playerId, id)); // Cascade delete games manually if needed, or rely on DB cascade
    await db.delete(players).where(eq(players.id, id));
  }

  async createGame(game: InsertGame): Promise<Game> {
    const [newGame] = await db.insert(games).values(game).returning();
    return newGame;
  }

  async getGame(id: number): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game;
  }

  async deleteGame(id: number): Promise<void> {
    await db.delete(games).where(eq(games.id, id));
  }

  async getGamesByPlayerId(playerId: number): Promise<Game[]> {
    return await db
      .select()
      .from(games)
      .where(eq(games.playerId, playerId))
      .orderBy(desc(games.date));
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    const [newBadge] = await db.insert(badges).values(badge).returning();
    return newBadge;
  }

  async getPlayerBadges(playerId: number): Promise<Badge[]> {
    return await db
      .select()
      .from(badges)
      .where(eq(badges.playerId, playerId))
      .orderBy(desc(badges.earnedAt));
  }

  async getBadgesByGame(gameId: number): Promise<Badge[]> {
    return await db
      .select()
      .from(badges)
      .where(eq(badges.gameId, gameId))
      .orderBy(desc(badges.earnedAt));
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [newGoal] = await db.insert(goals).values(goal).returning();
    return newGoal;
  }

  async getPlayerGoals(playerId: number): Promise<Goal[]> {
    return await db
      .select()
      .from(goals)
      .where(eq(goals.playerId, playerId))
      .orderBy(desc(goals.createdAt));
  }

  async updateGoal(id: number, updates: Partial<Goal>): Promise<Goal | undefined> {
    const [updatedGoal] = await db
      .update(goals)
      .set(updates)
      .where(eq(goals.id, id))
      .returning();
    return updatedGoal;
  }

  async deleteGoal(id: number): Promise<void> {
    await db.delete(goals).where(eq(goals.id, id));
  }

  async getPlayerStreaks(playerId: number): Promise<Streak[]> {
    return await db
      .select()
      .from(streaks)
      .where(eq(streaks.playerId, playerId))
      .orderBy(desc(streaks.currentCount));
  }

  async getOrCreateStreak(playerId: number, streakType: string): Promise<Streak> {
    const [existing] = await db
      .select()
      .from(streaks)
      .where(and(eq(streaks.playerId, playerId), eq(streaks.streakType, streakType)));
    
    if (existing) return existing;

    const [newStreak] = await db
      .insert(streaks)
      .values({ playerId, streakType, currentCount: 0, bestCount: 0 })
      .returning();
    return newStreak;
  }

  async updateStreak(id: number, updates: Partial<Streak>): Promise<Streak | undefined> {
    const [updatedStreak] = await db
      .update(streaks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(streaks.id, id))
      .returning();
    return updatedStreak;
  }
}

export const storage = new DatabaseStorage();
