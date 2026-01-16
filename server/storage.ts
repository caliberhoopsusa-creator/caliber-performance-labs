import { db } from "./db";
import {
  players, games, badges, goals, streaks, likes, comments, challenges, challengeProgress,
  teams, teamMembers, teamPosts,
  feedActivities, reposts, polls, pollVotes, predictions, predictionVotes, storyTemplates, playerStories,
  type Player, type InsertPlayer,
  type Game, type InsertGame,
  type UpdateGameRequest,
  type Badge, type InsertBadge,
  type Goal, type InsertGoal,
  type Streak, type InsertStreak,
  type Like, type InsertLike,
  type Comment, type InsertComment,
  type Challenge, type InsertChallenge,
  type ChallengeProgress, type InsertChallengeProgress,
  type Team, type InsertTeam,
  type TeamMember, type InsertTeamMember,
  type TeamPost, type InsertTeamPost,
  type FeedActivity, type InsertFeedActivity,
  type Repost, type InsertRepost,
  type Poll, type InsertPoll,
  type PollVote, type InsertPollVote,
  type Prediction, type InsertPrediction,
  type PredictionVote, type InsertPredictionVote,
  type StoryTemplate, type InsertStoryTemplate,
  type PlayerStory, type InsertPlayerStory
} from "@shared/schema";
import { eq, desc, and, count, gte, lte, sql, or } from "drizzle-orm";

export interface IStorage {
  // Players
  getPlayers(): Promise<Player[]>;
  getPlayer(id: number): Promise<(Player & { games: Game[] }) | undefined>;
  getPlayersWithStats(): Promise<(Player & { games: Game[] })[]>;
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

  // Likes
  createLike(like: InsertLike): Promise<Like>;
  deleteLike(gameId: number, sessionId: string): Promise<void>;
  getGameLikes(gameId: number): Promise<number>;
  hasUserLiked(gameId: number, sessionId: string): Promise<boolean>;

  // Comments
  createComment(comment: InsertComment): Promise<Comment>;
  getGameComments(gameId: number): Promise<Comment[]>;
  deleteComment(id: number): Promise<void>;
  getComment(id: number): Promise<Comment | undefined>;

  // Challenges
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  getChallenges(): Promise<Challenge[]>;
  getChallenge(id: number): Promise<Challenge | undefined>;
  getActiveChallenges(): Promise<Challenge[]>;
  getPlayerChallengeProgress(playerId: number): Promise<(ChallengeProgress & { challenge: Challenge })[]>;
  getChallengeProgressForPlayer(challengeId: number, playerId: number): Promise<ChallengeProgress | undefined>;
  getOrCreateChallengeProgress(challengeId: number, playerId: number): Promise<ChallengeProgress>;
  updateChallengeProgress(id: number, updates: Partial<ChallengeProgress>): Promise<ChallengeProgress | undefined>;
  getChallengeLeaderboard(challengeId: number): Promise<{ playerId: number; playerName: string; currentValue: number; completed: boolean }[]>;

  // Teams
  createTeam(team: InsertTeam): Promise<Team>;
  getTeam(id: number): Promise<Team | undefined>;
  getTeamByCode(code: string): Promise<Team | undefined>;
  getTeamsBySessionId(sessionId: string): Promise<(Team & { memberCount: number })[]>;

  // Team Members
  addTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  getTeamMembers(teamId: number): Promise<TeamMember[]>;
  getTeamMember(teamId: number, sessionId: string): Promise<TeamMember | undefined>;
  removeTeamMember(id: number): Promise<void>;

  // Team Posts
  createTeamPost(post: InsertTeamPost): Promise<TeamPost>;
  getTeamPosts(teamId: number): Promise<(TeamPost & { authorName: string })[]>;

  // Feed Activities
  createFeedActivity(activity: InsertFeedActivity): Promise<FeedActivity>;
  getFeedActivities(limit?: number): Promise<(FeedActivity & { playerName?: string })[]>;
  getPlayerFeedActivities(playerId: number): Promise<FeedActivity[]>;

  // Reposts
  createRepost(repost: InsertRepost): Promise<Repost>;
  getReposts(activityId?: number, gameId?: number): Promise<Repost[]>;
  hasUserReposted(gameId: number, sessionId: string): Promise<boolean>;
  getGameReposts(gameId: number): Promise<number>;

  // Polls
  createPoll(poll: InsertPoll): Promise<Poll>;
  getPolls(): Promise<Poll[]>;
  getPoll(id: number): Promise<Poll | undefined>;
  getActivePolls(): Promise<Poll[]>;
  votePoll(vote: InsertPollVote): Promise<PollVote>;
  getPollVotes(pollId: number): Promise<{ optionIndex: number; count: number }[]>;
  hasUserVoted(pollId: number, sessionId: string): Promise<boolean>;

  // Predictions
  createPrediction(prediction: InsertPrediction): Promise<Prediction>;
  getPredictions(): Promise<(Prediction & { player1Name: string; player2Name: string })[]>;
  getPrediction(id: number): Promise<Prediction | undefined>;
  votePrediction(vote: InsertPredictionVote): Promise<PredictionVote>;
  getPredictionVotes(predictionId: number): Promise<{ player1Votes: number; player2Votes: number }>;
  hasUserVotedPrediction(predictionId: number, sessionId: string): Promise<boolean>;

  // Story Templates
  createStoryTemplate(template: InsertStoryTemplate): Promise<StoryTemplate>;
  getActiveStoryTemplates(): Promise<StoryTemplate[]>;

  // Player Stories
  createPlayerStory(story: InsertPlayerStory): Promise<PlayerStory>;
  getPlayerStories(playerId: number): Promise<PlayerStory[]>;
  getPublicStories(limit?: number): Promise<(PlayerStory & { playerName: string })[]>;
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

  async getPlayersWithStats(): Promise<(Player & { games: Game[] })[]> {
    const allPlayers = await db.select().from(players).orderBy(desc(players.createdAt));
    const allGames = await db.select().from(games);
    
    return allPlayers.map(player => ({
      ...player,
      games: allGames.filter(g => g.playerId === player.id)
    }));
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

  async createLike(like: InsertLike): Promise<Like> {
    const [newLike] = await db.insert(likes).values(like).returning();
    return newLike;
  }

  async deleteLike(gameId: number, sessionId: string): Promise<void> {
    await db.delete(likes).where(and(eq(likes.gameId, gameId), eq(likes.sessionId, sessionId)));
  }

  async getGameLikes(gameId: number): Promise<number> {
    const [result] = await db.select({ count: count() }).from(likes).where(eq(likes.gameId, gameId));
    return result?.count || 0;
  }

  async hasUserLiked(gameId: number, sessionId: string): Promise<boolean> {
    const [existing] = await db.select().from(likes).where(and(eq(likes.gameId, gameId), eq(likes.sessionId, sessionId)));
    return !!existing;
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  async getGameComments(gameId: number): Promise<Comment[]> {
    return await db.select().from(comments).where(eq(comments.gameId, gameId)).orderBy(desc(comments.createdAt));
  }

  async deleteComment(id: number): Promise<void> {
    await db.delete(comments).where(eq(comments.id, id));
  }

  async getComment(id: number): Promise<Comment | undefined> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
    return comment;
  }

  async createChallenge(challenge: InsertChallenge): Promise<Challenge> {
    const [newChallenge] = await db.insert(challenges).values(challenge).returning();
    return newChallenge;
  }

  async getChallenges(): Promise<Challenge[]> {
    return await db.select().from(challenges).orderBy(desc(challenges.createdAt));
  }

  async getChallenge(id: number): Promise<Challenge | undefined> {
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id));
    return challenge;
  }

  async getActiveChallenges(): Promise<Challenge[]> {
    const today = new Date().toISOString().split('T')[0];
    return await db
      .select()
      .from(challenges)
      .where(and(
        eq(challenges.isActive, true),
        lte(challenges.startDate, today),
        gte(challenges.endDate, today)
      ))
      .orderBy(desc(challenges.createdAt));
  }

  async getPlayerChallengeProgress(playerId: number): Promise<(ChallengeProgress & { challenge: Challenge })[]> {
    const results = await db
      .select({
        id: challengeProgress.id,
        challengeId: challengeProgress.challengeId,
        playerId: challengeProgress.playerId,
        currentValue: challengeProgress.currentValue,
        completed: challengeProgress.completed,
        completedAt: challengeProgress.completedAt,
        challenge: challenges,
      })
      .from(challengeProgress)
      .innerJoin(challenges, eq(challengeProgress.challengeId, challenges.id))
      .where(eq(challengeProgress.playerId, playerId))
      .orderBy(desc(challenges.endDate));

    return results.map(r => ({
      id: r.id,
      challengeId: r.challengeId,
      playerId: r.playerId,
      currentValue: r.currentValue,
      completed: r.completed,
      completedAt: r.completedAt,
      challenge: r.challenge,
    }));
  }

  async getChallengeProgressForPlayer(challengeId: number, playerId: number): Promise<ChallengeProgress | undefined> {
    const [progress] = await db
      .select()
      .from(challengeProgress)
      .where(and(
        eq(challengeProgress.challengeId, challengeId),
        eq(challengeProgress.playerId, playerId)
      ));
    return progress;
  }

  async getOrCreateChallengeProgress(challengeId: number, playerId: number): Promise<ChallengeProgress> {
    const existing = await this.getChallengeProgressForPlayer(challengeId, playerId);
    if (existing) return existing;

    const [newProgress] = await db
      .insert(challengeProgress)
      .values({ challengeId, playerId, currentValue: 0, completed: false })
      .returning();
    return newProgress;
  }

  async updateChallengeProgress(id: number, updates: Partial<ChallengeProgress>): Promise<ChallengeProgress | undefined> {
    const [updated] = await db
      .update(challengeProgress)
      .set(updates)
      .where(eq(challengeProgress.id, id))
      .returning();
    return updated;
  }

  async getChallengeLeaderboard(challengeId: number): Promise<{ playerId: number; playerName: string; currentValue: number; completed: boolean }[]> {
    const results = await db
      .select({
        playerId: challengeProgress.playerId,
        playerName: players.name,
        currentValue: challengeProgress.currentValue,
        completed: challengeProgress.completed,
      })
      .from(challengeProgress)
      .innerJoin(players, eq(challengeProgress.playerId, players.id))
      .where(eq(challengeProgress.challengeId, challengeId))
      .orderBy(desc(challengeProgress.currentValue));

    return results;
  }

  // Teams
  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db.insert(teams).values(team).returning();
    return newTeam;
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async getTeamByCode(code: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.code, code));
    return team;
  }

  async getTeamsBySessionId(sessionId: string): Promise<(Team & { memberCount: number })[]> {
    const memberRecords = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.sessionId, sessionId));
    
    const teamIds = memberRecords.map(m => m.teamId);
    if (teamIds.length === 0) return [];

    const results: (Team & { memberCount: number })[] = [];
    for (const teamId of teamIds) {
      const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
      if (team) {
        const [countResult] = await db.select({ count: count() }).from(teamMembers).where(eq(teamMembers.teamId, teamId));
        results.push({ ...team, memberCount: countResult?.count || 0 });
      }
    }
    return results;
  }

  // Team Members
  async addTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const [newMember] = await db.insert(teamMembers).values(member).returning();
    return newMember;
  }

  async getTeamMembers(teamId: number): Promise<TeamMember[]> {
    return await db.select().from(teamMembers).where(eq(teamMembers.teamId, teamId)).orderBy(desc(teamMembers.joinedAt));
  }

  async getTeamMember(teamId: number, sessionId: string): Promise<TeamMember | undefined> {
    const [member] = await db.select().from(teamMembers).where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.sessionId, sessionId)));
    return member;
  }

  async removeTeamMember(id: number): Promise<void> {
    await db.delete(teamMembers).where(eq(teamMembers.id, id));
  }

  // Team Posts
  async createTeamPost(post: InsertTeamPost): Promise<TeamPost> {
    const [newPost] = await db.insert(teamPosts).values(post).returning();
    return newPost;
  }

  async getTeamPosts(teamId: number): Promise<(TeamPost & { authorName: string })[]> {
    const posts = await db
      .select({
        id: teamPosts.id,
        teamId: teamPosts.teamId,
        authorId: teamPosts.authorId,
        content: teamPosts.content,
        createdAt: teamPosts.createdAt,
        authorName: teamMembers.displayName,
      })
      .from(teamPosts)
      .innerJoin(teamMembers, eq(teamPosts.authorId, teamMembers.id))
      .where(eq(teamPosts.teamId, teamId))
      .orderBy(desc(teamPosts.createdAt));
    
    return posts;
  }

  // Feed Activities
  async createFeedActivity(activity: InsertFeedActivity): Promise<FeedActivity> {
    const [newActivity] = await db.insert(feedActivities).values(activity).returning();
    return newActivity;
  }

  async getFeedActivities(limit: number = 50): Promise<(FeedActivity & { playerName?: string })[]> {
    const results = await db
      .select({
        id: feedActivities.id,
        activityType: feedActivities.activityType,
        playerId: feedActivities.playerId,
        gameId: feedActivities.gameId,
        badgeId: feedActivities.badgeId,
        relatedId: feedActivities.relatedId,
        headline: feedActivities.headline,
        subtext: feedActivities.subtext,
        sessionId: feedActivities.sessionId,
        createdAt: feedActivities.createdAt,
        playerName: players.name,
      })
      .from(feedActivities)
      .leftJoin(players, eq(feedActivities.playerId, players.id))
      .orderBy(desc(feedActivities.createdAt))
      .limit(limit);
    
    return results;
  }

  async getPlayerFeedActivities(playerId: number): Promise<FeedActivity[]> {
    return await db
      .select()
      .from(feedActivities)
      .where(eq(feedActivities.playerId, playerId))
      .orderBy(desc(feedActivities.createdAt));
  }

  // Reposts
  async createRepost(repost: InsertRepost): Promise<Repost> {
    const [newRepost] = await db.insert(reposts).values(repost).returning();
    return newRepost;
  }

  async getReposts(activityId?: number, gameId?: number): Promise<Repost[]> {
    if (activityId) {
      return await db.select().from(reposts).where(eq(reposts.originalActivityId, activityId)).orderBy(desc(reposts.createdAt));
    }
    if (gameId) {
      return await db.select().from(reposts).where(eq(reposts.gameId, gameId)).orderBy(desc(reposts.createdAt));
    }
    return await db.select().from(reposts).orderBy(desc(reposts.createdAt));
  }

  async hasUserReposted(gameId: number, sessionId: string): Promise<boolean> {
    const [existing] = await db.select().from(reposts).where(and(eq(reposts.gameId, gameId), eq(reposts.sessionId, sessionId)));
    return !!existing;
  }

  async getGameReposts(gameId: number): Promise<number> {
    const [result] = await db.select({ count: count() }).from(reposts).where(eq(reposts.gameId, gameId));
    return result?.count || 0;
  }

  // Polls
  async createPoll(poll: InsertPoll): Promise<Poll> {
    const [newPoll] = await db.insert(polls).values(poll).returning();
    return newPoll;
  }

  async getPolls(): Promise<Poll[]> {
    return await db.select().from(polls).orderBy(desc(polls.createdAt));
  }

  async getPoll(id: number): Promise<Poll | undefined> {
    const [poll] = await db.select().from(polls).where(eq(polls.id, id));
    return poll;
  }

  async getActivePolls(): Promise<Poll[]> {
    const now = new Date();
    return await db
      .select()
      .from(polls)
      .where(or(sql`${polls.expiresAt} IS NULL`, gte(polls.expiresAt, now)))
      .orderBy(desc(polls.createdAt));
  }

  async votePoll(vote: InsertPollVote): Promise<PollVote> {
    const [newVote] = await db.insert(pollVotes).values(vote).returning();
    return newVote;
  }

  async getPollVotes(pollId: number): Promise<{ optionIndex: number; count: number }[]> {
    const results = await db
      .select({
        optionIndex: pollVotes.optionIndex,
        count: count(),
      })
      .from(pollVotes)
      .where(eq(pollVotes.pollId, pollId))
      .groupBy(pollVotes.optionIndex);
    return results;
  }

  async hasUserVoted(pollId: number, sessionId: string): Promise<boolean> {
    const [existing] = await db.select().from(pollVotes).where(and(eq(pollVotes.pollId, pollId), eq(pollVotes.sessionId, sessionId)));
    return !!existing;
  }

  // Predictions
  async createPrediction(prediction: InsertPrediction): Promise<Prediction> {
    const [newPrediction] = await db.insert(predictions).values(prediction).returning();
    return newPrediction;
  }

  async getPredictions(): Promise<(Prediction & { player1Name: string; player2Name: string })[]> {
    const allPredictions = await db.select().from(predictions).orderBy(desc(predictions.createdAt));
    const allPlayers = await db.select().from(players);
    
    return allPredictions.map(p => {
      const player1 = allPlayers.find(pl => pl.id === p.player1Id);
      const player2 = allPlayers.find(pl => pl.id === p.player2Id);
      return {
        ...p,
        player1Name: player1?.name || "Unknown",
        player2Name: player2?.name || "Unknown",
      };
    });
  }

  async getPrediction(id: number): Promise<Prediction | undefined> {
    const [prediction] = await db.select().from(predictions).where(eq(predictions.id, id));
    return prediction;
  }

  async votePrediction(vote: InsertPredictionVote): Promise<PredictionVote> {
    const [newVote] = await db.insert(predictionVotes).values(vote).returning();
    return newVote;
  }

  async getPredictionVotes(predictionId: number): Promise<{ player1Votes: number; player2Votes: number }> {
    const prediction = await this.getPrediction(predictionId);
    if (!prediction) return { player1Votes: 0, player2Votes: 0 };
    
    const votes = await db.select().from(predictionVotes).where(eq(predictionVotes.predictionId, predictionId));
    
    return {
      player1Votes: votes.filter(v => v.votedFor === prediction.player1Id).length,
      player2Votes: votes.filter(v => v.votedFor === prediction.player2Id).length,
    };
  }

  async hasUserVotedPrediction(predictionId: number, sessionId: string): Promise<boolean> {
    const [existing] = await db.select().from(predictionVotes).where(and(eq(predictionVotes.predictionId, predictionId), eq(predictionVotes.sessionId, sessionId)));
    return !!existing;
  }

  // Story Templates
  async createStoryTemplate(template: InsertStoryTemplate): Promise<StoryTemplate> {
    const [newTemplate] = await db.insert(storyTemplates).values(template).returning();
    return newTemplate;
  }

  async getActiveStoryTemplates(): Promise<StoryTemplate[]> {
    return await db.select().from(storyTemplates).where(eq(storyTemplates.isActive, true)).orderBy(desc(storyTemplates.createdAt));
  }

  // Player Stories
  async createPlayerStory(story: InsertPlayerStory): Promise<PlayerStory> {
    const [newStory] = await db.insert(playerStories).values(story).returning();
    return newStory;
  }

  async getPlayerStories(playerId: number): Promise<PlayerStory[]> {
    return await db.select().from(playerStories).where(eq(playerStories.playerId, playerId)).orderBy(desc(playerStories.createdAt));
  }

  async getPublicStories(limit: number = 20): Promise<(PlayerStory & { playerName: string })[]> {
    const results = await db
      .select({
        id: playerStories.id,
        playerId: playerStories.playerId,
        templateId: playerStories.templateId,
        headline: playerStories.headline,
        stats: playerStories.stats,
        imageUrl: playerStories.imageUrl,
        sessionId: playerStories.sessionId,
        isPublic: playerStories.isPublic,
        createdAt: playerStories.createdAt,
        playerName: players.name,
      })
      .from(playerStories)
      .innerJoin(players, eq(playerStories.playerId, players.id))
      .where(eq(playerStories.isPublic, true))
      .orderBy(desc(playerStories.createdAt))
      .limit(limit);
    
    return results;
  }
}

export const storage = new DatabaseStorage();
