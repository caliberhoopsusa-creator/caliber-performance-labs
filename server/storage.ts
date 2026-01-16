import { db } from "./db";
import {
  players, games, badges,
  type Player, type InsertPlayer,
  type Game, type InsertGame,
  type UpdateGameRequest,
  type Badge, type InsertBadge
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
