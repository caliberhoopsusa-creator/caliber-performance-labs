import { db } from "./db";
import {
  players, games, badges, goals, streaks, likes, comments, challenges, challengeProgress,
  teams, teamMembers, teamPosts, teamPostComments,
  feedActivities, reposts, polls, pollVotes, predictions, predictionVotes, storyTemplates, playerStories, storyViews, storyReactions, storyHighlights, storyTags,
  activityStreaks,
  shots, gameNotes, practices, practiceAttendance, drills, drillScores, lineups, lineupStats,
  opponents, alerts, coachGoals, drillRecommendations,
  follows, notifications, highlightClips, workouts, accolades, goalShares, scheduleEvents, liveGameSessions, liveGameEvents, liveGameSpectators, shareAssets, endorsements, headToHeadChallenges, trainingGroups, trainingGroupMembers,
  dmThreads, dmParticipants, dmMessages,
  mentorshipProfiles, mentorshipRequests,
  recruitPosts, recruitInterests,
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
  type TeamPostComment, type InsertTeamPostComment,
  type FeedActivity, type InsertFeedActivity,
  type Repost, type InsertRepost,
  type Poll, type InsertPoll,
  type PollVote, type InsertPollVote,
  type Prediction, type InsertPrediction,
  type PredictionVote, type InsertPredictionVote,
  type StoryTemplate, type InsertStoryTemplate,
  type PlayerStory, type InsertPlayerStory,
  type StoryView, type InsertStoryView,
  type StoryReaction, type InsertStoryReaction,
  type StoryHighlight, type InsertStoryHighlight,
  type StoryTag, type InsertStoryTag,
  type ActivityStreak, type InsertActivityStreak,
  type SkillBadge, type InsertSkillBadge, skillBadges,
  type Shot, type InsertShot,
  type GameNote, type InsertGameNote,
  type Practice, type InsertPractice,
  type PracticeAttendance, type InsertPracticeAttendance,
  type Drill, type InsertDrill,
  type DrillScore, type InsertDrillScore,
  type Lineup, type InsertLineup,
  type LineupStat, type InsertLineupStat,
  type Opponent, type InsertOpponent,
  type Alert, type InsertAlert,
  type CoachGoal, type InsertCoachGoal,
  type DrillRecommendation, type InsertDrillRecommendation,
  type Follow, type InsertFollow,
  type Notification, type InsertNotification,
  type HighlightClip, type InsertHighlightClip,
  type Workout, type InsertWorkout,
  type Accolade, type InsertAccolade,
  type GoalShare, type InsertGoalShare,
  type ScheduleEvent, type InsertScheduleEvent,
  type LiveGameSession, type InsertLiveGameSession,
  type LiveGameEvent, type InsertLiveGameEvent,
  type LiveGameSpectator, type InsertLiveGameSpectator,
  type ShareAsset, type InsertShareAsset,
  type Endorsement, type InsertEndorsement,
  type HeadToHeadChallenge, type InsertHeadToHeadChallenge,
  type TrainingGroup, type InsertTrainingGroup,
  type TrainingGroupMember, type InsertTrainingGroupMember,
  type DmThread, type InsertDmThread,
  type DmParticipant, type InsertDmParticipant,
  type DmMessage, type InsertDmMessage,
  type MentorshipProfile, type InsertMentorshipProfile,
  type MentorshipRequest, type InsertMentorshipRequest,
  type RecruitPost, type InsertRecruitPost,
  type RecruitInterest, type InsertRecruitInterest,
  type CaliberBadge, type InsertCaliberBadge, caliberBadges
} from "@shared/schema";
import { eq, desc, and, count, gte, lte, sql, or, isNull } from "drizzle-orm";

export interface IStorage {
  // Players
  getPlayers(): Promise<Player[]>;
  getPlayer(id: number): Promise<(Player & { games: Game[] }) | undefined>;
  getPlayerByUserId(userId: string): Promise<(Player & { games: Game[] }) | undefined>;
  getPlayersWithStats(): Promise<(Player & { games: Game[] })[]>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: number, updates: Partial<Player>): Promise<Player | undefined>;
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
  getPlayerBadgeCount(playerId: number): Promise<number>;

  // Skill Badges (Progressive)
  getPlayerSkillBadges(playerId: number): Promise<SkillBadge[]>;
  getOrCreateSkillBadge(playerId: number, skillType: string): Promise<SkillBadge>;
  updateSkillBadge(id: number, updates: Partial<SkillBadge>): Promise<SkillBadge | undefined>;

  // Caliber Badges (Owner-awarded special badge)
  getCaliberBadge(playerId: number): Promise<CaliberBadge | undefined>;
  awardCaliberBadge(data: InsertCaliberBadge): Promise<CaliberBadge>;
  revokeCaliberBadge(playerId: number): Promise<void>;
  getAllCaliberBadges(): Promise<CaliberBadge[]>;

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

  // Endorsements
  createEndorsement(endorsement: InsertEndorsement): Promise<Endorsement>;
  getPlayerEndorsements(playerId: number): Promise<Endorsement[]>;
  getEndorsement(id: number): Promise<Endorsement | undefined>;
  deleteEndorsement(id: number): Promise<void>;

  // Head-to-Head Challenges
  createHeadToHeadChallenge(challenge: InsertHeadToHeadChallenge): Promise<HeadToHeadChallenge>;
  getPlayerChallenges(playerId: number): Promise<HeadToHeadChallenge[]>;
  getPendingChallenges(playerId: number): Promise<HeadToHeadChallenge[]>;
  updateChallengeStatus(id: number, status: string, winnerId?: number): Promise<HeadToHeadChallenge>;
  getHeadToHeadChallenge(id: number): Promise<HeadToHeadChallenge | undefined>;

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
  updateTeam(id: number, updates: Partial<InsertTeam>): Promise<Team | undefined>;

  // Team Members
  addTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  getTeamMembers(teamId: number): Promise<TeamMember[]>;
  getTeamMember(teamId: number, sessionId: string): Promise<TeamMember | undefined>;
  removeTeamMember(id: number): Promise<void>;

  // Team Posts
  createTeamPost(post: InsertTeamPost): Promise<TeamPost>;
  getTeamPosts(teamId: number): Promise<(TeamPost & { authorName: string })[]>;
  updateTeamPost(id: number, updates: Partial<InsertTeamPost>): Promise<TeamPost | undefined>;
  deleteTeamPost(id: number): Promise<void>;

  // Team Post Comments
  createTeamPostComment(comment: InsertTeamPostComment): Promise<TeamPostComment>;
  getTeamPostComments(postId: number): Promise<(TeamPostComment & { authorName: string })[]>;
  deleteTeamPostComment(id: number): Promise<void>;

  // Feed Activities
  createFeedActivity(activity: InsertFeedActivity): Promise<FeedActivity>;
  getFeedActivities(limit?: number): Promise<(FeedActivity & { playerName?: string })[]>;
  getPlayerFeedActivities(playerId: number): Promise<FeedActivity[]>;
  getFollowingFeedActivities(playerId: number, limit?: number): Promise<(FeedActivity & { playerName?: string })[]>;
  getTeamFeedActivities(sessionId: string, limit?: number): Promise<(FeedActivity & { playerName?: string })[]>;

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
  getUserPollVote(pollId: number, sessionId: string): Promise<PollVote | undefined>;

  // Predictions
  createPrediction(prediction: InsertPrediction): Promise<Prediction>;
  getPredictions(): Promise<(Prediction & { player1Name: string; player2Name: string })[]>;
  getPrediction(id: number): Promise<Prediction | undefined>;
  votePrediction(vote: InsertPredictionVote): Promise<PredictionVote>;
  getPredictionVotes(predictionId: number): Promise<{ player1Votes: number; player2Votes: number }>;
  hasUserVotedPrediction(predictionId: number, sessionId: string): Promise<boolean>;
  getUserPredictionVote(predictionId: number, sessionId: string): Promise<PredictionVote | undefined>;

  // Story Templates
  createStoryTemplate(template: InsertStoryTemplate): Promise<StoryTemplate>;
  getActiveStoryTemplates(): Promise<StoryTemplate[]>;

  // Player Stories
  createPlayerStory(story: InsertPlayerStory): Promise<PlayerStory>;
  getPlayerStories(playerId: number): Promise<PlayerStory[]>;
  getPublicStories(limit?: number): Promise<(PlayerStory & { playerName: string })[]>;
  getActiveStories(limit?: number): Promise<(PlayerStory & { playerName: string })[]>;
  getStory(id: number): Promise<PlayerStory | undefined>;
  updateStory(id: number, data: Partial<InsertPlayerStory>): Promise<PlayerStory | undefined>;
  deleteStory(id: number): Promise<void>;
  incrementStoryViewCount(id: number): Promise<void>;

  // Story Views
  createStoryView(view: InsertStoryView): Promise<StoryView>;
  getStoryViews(storyId: number): Promise<StoryView[]>;
  hasViewedStory(storyId: number, sessionId: string): Promise<boolean>;

  // Story Reactions
  createStoryReaction(reaction: InsertStoryReaction): Promise<StoryReaction>;
  getStoryReactions(storyId: number): Promise<StoryReaction[]>;
  removeStoryReaction(storyId: number, sessionId: string): Promise<void>;
  getReactionCounts(storyId: number): Promise<{ reaction: string; count: number }[]>;

  // Story Highlights
  createStoryHighlight(highlight: InsertStoryHighlight): Promise<StoryHighlight>;
  getPlayerHighlights(playerId: number): Promise<StoryHighlight[]>;
  getStoryHighlight(id: number): Promise<StoryHighlight | undefined>;
  updateStoryHighlight(id: number, data: Partial<InsertStoryHighlight>): Promise<StoryHighlight | undefined>;
  deleteStoryHighlight(id: number): Promise<void>;

  // Story Tags
  addStoryTag(tag: InsertStoryTag): Promise<StoryTag>;
  getStoryTags(storyId: number): Promise<StoryTag[]>;
  getTaggedStories(playerId: number): Promise<StoryTag[]>;
  removeStoryTag(storyId: number, taggedPlayerId: number): Promise<void>;

  // Activity Streaks (for XP/gamification)
  getPlayerActivityStreaks(playerId: number): Promise<ActivityStreak[]>;
  getOrCreateActivityStreak(playerId: number, streakType: string): Promise<ActivityStreak>;
  updateActivityStreak(id: number, updates: Partial<ActivityStreak>): Promise<ActivityStreak | undefined>;

  // XP Management
  addPlayerXp(playerId: number, xpAmount: number): Promise<{ player: Player; newTier: string | null; oldTier: string }>;

  // Shots
  createShot(data: InsertShot): Promise<Shot>;
  getShotsByGame(gameId: number): Promise<Shot[]>;
  getShotsByPlayer(playerId: number): Promise<Shot[]>;
  deleteShot(id: number): Promise<void>;

  // Game Notes
  createGameNote(data: InsertGameNote): Promise<GameNote>;
  getGameNote(id: number): Promise<GameNote | undefined>;
  getGameNotes(gameId: number): Promise<GameNote[]>;
  getPlayerGameNotes(playerId: number): Promise<GameNote[]>;
  updateGameNote(id: number, data: Partial<InsertGameNote>): Promise<GameNote>;
  deleteGameNote(id: number): Promise<void>;

  // Practices
  createPractice(data: InsertPractice): Promise<Practice>;
  getPractices(): Promise<Practice[]>;
  getPractice(id: number): Promise<Practice | undefined>;
  updatePractice(id: number, data: Partial<InsertPractice>): Promise<Practice>;
  deletePractice(id: number): Promise<void>;

  // Practice Attendance
  createPracticeAttendance(data: InsertPracticeAttendance): Promise<PracticeAttendance>;
  getPracticeAttendance(practiceId: number): Promise<PracticeAttendance[]>;
  getPlayerAttendance(playerId: number): Promise<PracticeAttendance[]>;
  updatePracticeAttendance(id: number, data: Partial<InsertPracticeAttendance>): Promise<PracticeAttendance>;

  // Drills
  createDrill(data: InsertDrill): Promise<Drill>;
  getDrills(): Promise<Drill[]>;
  getDrill(id: number): Promise<Drill | undefined>;
  getDrillsByCategory(category: string): Promise<Drill[]>;

  // Drill Scores
  createDrillScore(data: InsertDrillScore): Promise<DrillScore>;
  getDrillScoresByPractice(practiceId: number): Promise<DrillScore[]>;
  getDrillScoresByPlayer(playerId: number): Promise<DrillScore[]>;

  // Lineups
  createLineup(data: InsertLineup): Promise<Lineup>;
  getLineups(): Promise<Lineup[]>;
  getLineup(id: number): Promise<Lineup | undefined>;
  deleteLineup(id: number): Promise<void>;

  // Lineup Stats
  createLineupStat(data: InsertLineupStat): Promise<LineupStat>;
  getLineupStats(lineupId: number): Promise<LineupStat[]>;
  getLineupStatsByGame(gameId: number): Promise<LineupStat[]>;

  // Opponents
  createOpponent(data: InsertOpponent): Promise<Opponent>;
  getOpponents(): Promise<Opponent[]>;
  getOpponent(id: number): Promise<Opponent | undefined>;
  updateOpponent(id: number, data: Partial<InsertOpponent>): Promise<Opponent>;
  deleteOpponent(id: number): Promise<void>;

  // Alerts
  createAlert(data: InsertAlert): Promise<Alert>;
  getAlerts(playerId?: number): Promise<Alert[]>;
  getUnreadAlerts(): Promise<Alert[]>;
  markAlertRead(id: number): Promise<void>;
  markAllAlertsRead(): Promise<void>;
  deleteAlert(id: number): Promise<void>;

  // Coach Goals
  createCoachGoal(data: InsertCoachGoal): Promise<CoachGoal>;
  getCoachGoals(playerId: number): Promise<CoachGoal[]>;
  getAllCoachGoals(): Promise<CoachGoal[]>;
  updateCoachGoal(id: number, data: Partial<InsertCoachGoal>): Promise<CoachGoal>;
  deleteCoachGoal(id: number): Promise<void>;

  // Drill Recommendations
  createDrillRecommendation(data: InsertDrillRecommendation): Promise<DrillRecommendation>;
  getDrillRecommendations(playerId: number): Promise<DrillRecommendation[]>;
  updateDrillRecommendation(id: number, data: Partial<InsertDrillRecommendation>): Promise<DrillRecommendation>;
  deleteDrillRecommendation(id: number): Promise<void>;

  // Follows
  createFollow(followerPlayerId: number | null, followerUserId: string | null, followeePlayerId: number): Promise<Follow>;
  deleteFollow(followerPlayerId: number | null, followerUserId: string | null, followeePlayerId: number): Promise<void>;
  getFollowers(playerId: number): Promise<Follow[]>;
  getFollowing(playerId: number): Promise<Follow[]>;
  getFollowingByUserId(userId: string): Promise<Follow[]>;
  isFollowing(followerPlayerId: number | null, followerUserId: string | null, followeePlayerId: number): Promise<boolean>;
  getFollowerCount(playerId: number): Promise<number>;
  getFollowingCount(playerId: number): Promise<number>;
  getFollowingCountByUserId(userId: string): Promise<number>;

  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getPlayerNotifications(playerId: number): Promise<Notification[]>;
  getUnreadNotificationCount(playerId: number): Promise<number>;
  markNotificationRead(id: number): Promise<void>;
  markAllNotificationsRead(playerId: number): Promise<void>;

  // Highlight Clips
  createHighlightClip(clip: InsertHighlightClip): Promise<HighlightClip>;
  getPlayerHighlightClips(playerId: number): Promise<HighlightClip[]>;
  getHighlightClip(id: number): Promise<HighlightClip | undefined>;
  deleteHighlightClip(id: number): Promise<void>;
  incrementClipViewCount(id: number): Promise<void>;
  getPlayerHighlightCount(playerId: number): Promise<number>;

  // Workouts
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  getPlayerWorkouts(playerId: number): Promise<Workout[]>;
  getWorkout(id: number): Promise<Workout | undefined>;
  updateWorkout(id: number, updates: Partial<InsertWorkout>): Promise<Workout>;
  deleteWorkout(id: number): Promise<void>;

  // Accolades
  getPlayerAccolades(playerId: number): Promise<Accolade[]>;
  createAccolade(accolade: InsertAccolade): Promise<Accolade>;
  getAccoladeById(id: number): Promise<Accolade | undefined>;
  updateAccolade(id: number, updates: Partial<InsertAccolade>): Promise<Accolade>;
  deleteAccolade(id: number): Promise<void>;

  // Goal Shares
  createGoalShare(share: InsertGoalShare): Promise<GoalShare>;
  getGoalShares(goalId: number): Promise<GoalShare[]>;
  getSharedGoalsWithPlayer(playerId: number): Promise<GoalShare[]>;
  deleteGoalShare(id: number): Promise<void>;

  // Schedule Events
  createScheduleEvent(event: InsertScheduleEvent): Promise<ScheduleEvent>;
  getPlayerScheduleEvents(playerId: number): Promise<ScheduleEvent[]>;
  getTeamScheduleEvents(teamId: number): Promise<ScheduleEvent[]>;
  getAllScheduleEvents(): Promise<ScheduleEvent[]>;
  getScheduleEvent(id: number): Promise<ScheduleEvent | undefined>;
  updateScheduleEvent(id: number, updates: Partial<InsertScheduleEvent>): Promise<ScheduleEvent>;
  deleteScheduleEvent(id: number): Promise<void>;

  // Live Game Sessions
  createLiveGameSession(session: InsertLiveGameSession): Promise<LiveGameSession>;
  getLiveGameSession(id: number): Promise<LiveGameSession | undefined>;
  getActivePlayerSession(playerId: number): Promise<LiveGameSession | undefined>;
  updateLiveGameSession(id: number, updates: Partial<LiveGameSession>): Promise<LiveGameSession>;

  // Live Game Events
  createLiveGameEvent(event: InsertLiveGameEvent): Promise<LiveGameEvent>;
  getSessionEvents(sessionId: number): Promise<LiveGameEvent[]>;
  deleteLiveGameEvent(eventId: number): Promise<void>;

  // Live Game Spectators
  addLiveGameSpectator(spectator: InsertLiveGameSpectator): Promise<LiveGameSpectator>;
  getLiveGameSpectators(sessionId: number): Promise<LiveGameSpectator[]>;
  removeLiveGameSpectator(sessionId: number, viewerUserId: string | null, viewerPlayerId: number | null): Promise<void>;
  getActiveSpectatorSessions(viewerUserId: string | null, viewerPlayerId: number | null): Promise<LiveGameSpectator[]>;
  getSpectatorCount(sessionId: number): Promise<number>;

  // Share Assets
  createShareAsset(asset: InsertShareAsset): Promise<ShareAsset>;
  getPlayerShareAssets(playerId: number): Promise<ShareAsset[]>;
  incrementShareCount(id: number): Promise<void>;

  // Training Groups
  createTrainingGroup(group: InsertTrainingGroup): Promise<TrainingGroup>;
  getTrainingGroup(id: number): Promise<TrainingGroup | undefined>;
  getUserTrainingGroups(userId: string | null, playerId: number | null): Promise<TrainingGroup[]>;
  addGroupMember(member: InsertTrainingGroupMember): Promise<TrainingGroupMember>;
  getGroupMembers(groupId: number): Promise<TrainingGroupMember[]>;
  removeGroupMember(groupId: number, playerId: number): Promise<void>;
  updateTrainingGroup(id: number, updates: Partial<InsertTrainingGroup>): Promise<TrainingGroup>;
  deleteTrainingGroup(id: number): Promise<void>;
  getPublicTrainingGroups(): Promise<TrainingGroup[]>;

  // Direct Messages
  createDmThread(): Promise<DmThread>;
  addDmParticipant(participant: InsertDmParticipant): Promise<DmParticipant>;
  createDmMessage(message: InsertDmMessage): Promise<DmMessage>;
  getUserDmThreads(userId: string): Promise<DmThread[]>;
  getThreadMessages(threadId: number): Promise<DmMessage[]>;
  getOrCreateThread(userId1: string, playerId1: number | null, userId2: string, playerId2: number | null): Promise<DmThread>;
  markMessagesAsRead(threadId: number, userId: string): Promise<void>;
  getThreadParticipants(threadId: number): Promise<DmParticipant[]>;

  // Mentorship
  createMentorshipProfile(profile: InsertMentorshipProfile): Promise<MentorshipProfile>;
  getMentorshipProfile(playerId: number): Promise<MentorshipProfile | undefined>;
  updateMentorshipProfile(playerId: number, updates: Partial<InsertMentorshipProfile>): Promise<MentorshipProfile>;
  getActiveMentors(): Promise<MentorshipProfile[]>;
  createMentorshipRequest(request: InsertMentorshipRequest): Promise<MentorshipRequest>;
  getMentorshipRequests(playerId: number): Promise<MentorshipRequest[]>;
  getIncomingMentorshipRequests(mentorPlayerId: number): Promise<MentorshipRequest[]>;
  updateMentorshipRequestStatus(id: number, status: string): Promise<MentorshipRequest>;
  getAcceptedMentorships(playerId: number): Promise<MentorshipRequest[]>;

  // Recruit Board
  createRecruitPost(post: InsertRecruitPost): Promise<RecruitPost>;
  getRecruitPosts(filters?: { level?: string; location?: string }): Promise<RecruitPost[]>;
  getRecruitPost(id: number): Promise<RecruitPost | undefined>;
  updateRecruitPost(id: number, updates: Partial<InsertRecruitPost>): Promise<RecruitPost>;
  deleteRecruitPost(id: number): Promise<void>;
  getCoachRecruitPosts(coachUserId: string): Promise<RecruitPost[]>;
  createRecruitInterest(interest: InsertRecruitInterest): Promise<RecruitInterest>;
  getPostInterests(postId: number): Promise<RecruitInterest[]>;
  getPlayerInterests(playerId: number): Promise<RecruitInterest[]>;
  updateInterestStatus(id: number, status: string): Promise<RecruitInterest>;
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

  async getPlayerByUserId(userId: string): Promise<(Player & { games: Game[] }) | undefined> {
    const [player] = await db.select().from(players).where(eq(players.userId, userId));
    if (!player) return undefined;

    const playerGames = await db
      .select()
      .from(games)
      .where(eq(games.playerId, player.id))
      .orderBy(desc(games.date));

    return { ...player, games: playerGames };
  }

  async createPlayer(player: InsertPlayer): Promise<Player> {
    const [newPlayer] = await db.insert(players).values(player).returning();
    return newPlayer;
  }

  async updatePlayer(id: number, updates: Partial<Player>): Promise<Player | undefined> {
    const [updated] = await db.update(players).set(updates).where(eq(players.id, id)).returning();
    return updated;
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

  async getPlayerBadgeCount(playerId: number): Promise<number> {
    const [result] = await db.select({ count: count() }).from(badges).where(eq(badges.playerId, playerId));
    return result?.count || 0;
  }

  async getPlayerSkillBadges(playerId: number): Promise<SkillBadge[]> {
    return await db
      .select()
      .from(skillBadges)
      .where(eq(skillBadges.playerId, playerId));
  }

  async getOrCreateSkillBadge(playerId: number, skillType: string): Promise<SkillBadge> {
    const [existing] = await db
      .select()
      .from(skillBadges)
      .where(and(eq(skillBadges.playerId, playerId), eq(skillBadges.skillType, skillType)));
    
    if (existing) return existing;

    const [newBadge] = await db
      .insert(skillBadges)
      .values({ playerId, skillType, currentLevel: "none", careerValue: 0 })
      .returning();
    return newBadge;
  }

  async updateSkillBadge(id: number, updates: Partial<SkillBadge>): Promise<SkillBadge | undefined> {
    const [updated] = await db
      .update(skillBadges)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(skillBadges.id, id))
      .returning();
    return updated;
  }

  // Caliber Badges (Owner-awarded special badge)
  async getCaliberBadge(playerId: number): Promise<CaliberBadge | undefined> {
    const [badge] = await db
      .select()
      .from(caliberBadges)
      .where(eq(caliberBadges.playerId, playerId));
    return badge;
  }

  async awardCaliberBadge(data: InsertCaliberBadge): Promise<CaliberBadge> {
    // First check if player already has a Caliber badge
    const existing = await this.getCaliberBadge(data.playerId);
    if (existing) {
      // Update the existing badge
      const [updated] = await db
        .update(caliberBadges)
        .set({ ...data, awardedAt: new Date() })
        .where(eq(caliberBadges.playerId, data.playerId))
        .returning();
      return updated;
    }
    const [newBadge] = await db.insert(caliberBadges).values(data).returning();
    return newBadge;
  }

  async revokeCaliberBadge(playerId: number): Promise<void> {
    await db.delete(caliberBadges).where(eq(caliberBadges.playerId, playerId));
  }

  async getAllCaliberBadges(): Promise<CaliberBadge[]> {
    return await db.select().from(caliberBadges).orderBy(desc(caliberBadges.awardedAt));
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

  async createEndorsement(endorsement: InsertEndorsement): Promise<Endorsement> {
    const [newEndorsement] = await db.insert(endorsements).values(endorsement).returning();
    return newEndorsement;
  }

  async getPlayerEndorsements(playerId: number): Promise<Endorsement[]> {
    return await db.select().from(endorsements).where(eq(endorsements.playerId, playerId)).orderBy(desc(endorsements.createdAt));
  }

  async getEndorsement(id: number): Promise<Endorsement | undefined> {
    const [endorsement] = await db.select().from(endorsements).where(eq(endorsements.id, id));
    return endorsement;
  }

  async deleteEndorsement(id: number): Promise<void> {
    await db.delete(endorsements).where(eq(endorsements.id, id));
  }

  async createHeadToHeadChallenge(challenge: InsertHeadToHeadChallenge): Promise<HeadToHeadChallenge> {
    const [newChallenge] = await db.insert(headToHeadChallenges).values(challenge).returning();
    return newChallenge;
  }

  async getPlayerChallenges(playerId: number): Promise<HeadToHeadChallenge[]> {
    return await db
      .select()
      .from(headToHeadChallenges)
      .where(or(
        eq(headToHeadChallenges.challengerPlayerId, playerId),
        eq(headToHeadChallenges.opponentPlayerId, playerId)
      ))
      .orderBy(desc(headToHeadChallenges.createdAt));
  }

  async getPendingChallenges(playerId: number): Promise<HeadToHeadChallenge[]> {
    return await db
      .select()
      .from(headToHeadChallenges)
      .where(and(
        eq(headToHeadChallenges.opponentPlayerId, playerId),
        eq(headToHeadChallenges.status, 'pending')
      ))
      .orderBy(desc(headToHeadChallenges.createdAt));
  }

  async updateChallengeStatus(id: number, status: string, winnerId?: number): Promise<HeadToHeadChallenge> {
    const updateData: any = {
      status,
      resolvedAt: new Date(),
    };
    if (winnerId !== undefined) {
      updateData.winnerId = winnerId;
    }
    const [updated] = await db
      .update(headToHeadChallenges)
      .set(updateData)
      .where(eq(headToHeadChallenges.id, id))
      .returning();
    return updated;
  }

  async getHeadToHeadChallenge(id: number): Promise<HeadToHeadChallenge | undefined> {
    const [challenge] = await db.select().from(headToHeadChallenges).where(eq(headToHeadChallenges.id, id));
    return challenge;
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

  async updateTeam(id: number, updates: Partial<InsertTeam>): Promise<Team | undefined> {
    const [updatedTeam] = await db.update(teams).set(updates).where(eq(teams.id, id)).returning();
    return updatedTeam;
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
        postType: teamPosts.postType,
        practiceTime: teamPosts.practiceTime,
        practiceLocation: teamPosts.practiceLocation,
        isPinned: teamPosts.isPinned,
        createdAt: teamPosts.createdAt,
        authorName: teamMembers.displayName,
      })
      .from(teamPosts)
      .innerJoin(teamMembers, eq(teamPosts.authorId, teamMembers.id))
      .where(eq(teamPosts.teamId, teamId))
      .orderBy(desc(teamPosts.isPinned), desc(teamPosts.createdAt));
    
    return posts;
  }

  async updateTeamPost(id: number, updates: Partial<InsertTeamPost>): Promise<TeamPost | undefined> {
    const [updated] = await db.update(teamPosts).set(updates).where(eq(teamPosts.id, id)).returning();
    return updated;
  }

  async deleteTeamPost(id: number): Promise<void> {
    await db.delete(teamPosts).where(eq(teamPosts.id, id));
  }

  // Team Post Comments
  async createTeamPostComment(comment: InsertTeamPostComment): Promise<TeamPostComment> {
    const [newComment] = await db.insert(teamPostComments).values(comment).returning();
    return newComment;
  }

  async getTeamPostComments(postId: number): Promise<(TeamPostComment & { authorName: string })[]> {
    const commentsList = await db
      .select({
        id: teamPostComments.id,
        postId: teamPostComments.postId,
        authorId: teamPostComments.authorId,
        content: teamPostComments.content,
        createdAt: teamPostComments.createdAt,
        authorName: teamMembers.displayName,
      })
      .from(teamPostComments)
      .innerJoin(teamMembers, eq(teamPostComments.authorId, teamMembers.id))
      .where(eq(teamPostComments.postId, postId))
      .orderBy(teamPostComments.createdAt);
    
    return commentsList;
  }

  async deleteTeamPostComment(id: number): Promise<void> {
    await db.delete(teamPostComments).where(eq(teamPostComments.id, id));
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
    
    return results.map(r => ({
      ...r,
      playerName: r.playerName || undefined,
    }));
  }

  async getPlayerFeedActivities(playerId: number): Promise<FeedActivity[]> {
    return await db
      .select()
      .from(feedActivities)
      .where(eq(feedActivities.playerId, playerId))
      .orderBy(desc(feedActivities.createdAt));
  }

  async getFollowingFeedActivities(playerId: number, limit: number = 50): Promise<(FeedActivity & { playerName?: string })[]> {
    const followedPlayers = await db
      .select({ followeePlayerId: follows.followeePlayerId })
      .from(follows)
      .where(eq(follows.followerPlayerId, playerId));
    
    const followedPlayerIds = followedPlayers.map(f => f.followeePlayerId);
    
    if (followedPlayerIds.length === 0) {
      return [];
    }

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
      .where(sql`${feedActivities.playerId} IN (${sql.join(followedPlayerIds, sql`, `)})`)
      .orderBy(desc(feedActivities.createdAt))
      .limit(limit);
    
    return results.map(r => ({
      ...r,
      playerName: r.playerName || undefined,
    }));
  }

  async getTeamFeedActivities(sessionId: string, limit: number = 50): Promise<(FeedActivity & { playerName?: string })[]> {
    const userTeamMemberships = await db
      .select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.sessionId, sessionId));
    
    const teamIds = userTeamMemberships.map(m => m.teamId);
    
    if (teamIds.length === 0) {
      return [];
    }

    const teammateRecords = await db
      .select({ playerId: teamMembers.playerId })
      .from(teamMembers)
      .where(sql`${teamMembers.teamId} IN (${sql.join(teamIds, sql`, `)}) AND ${teamMembers.playerId} IS NOT NULL`);
    
    const teammatePlayerIds = teammateRecords
      .map(m => m.playerId)
      .filter((id): id is number => id !== null);
    
    if (teammatePlayerIds.length === 0) {
      return [];
    }

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
      .where(sql`${feedActivities.playerId} IN (${sql.join(teammatePlayerIds, sql`, `)})`)
      .orderBy(desc(feedActivities.createdAt))
      .limit(limit);
    
    return results.map(r => ({
      ...r,
      playerName: r.playerName || undefined,
    }));
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

  async getUserPollVote(pollId: number, sessionId: string): Promise<PollVote | undefined> {
    const [vote] = await db.select().from(pollVotes).where(and(eq(pollVotes.pollId, pollId), eq(pollVotes.sessionId, sessionId)));
    return vote;
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

  async getUserPredictionVote(predictionId: number, sessionId: string): Promise<PredictionVote | undefined> {
    const [vote] = await db.select().from(predictionVotes).where(and(eq(predictionVotes.predictionId, predictionId), eq(predictionVotes.sessionId, sessionId)));
    return vote;
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
        videoUrl: playerStories.videoUrl,
        mediaType: playerStories.mediaType,
        caption: playerStories.caption,
        sessionId: playerStories.sessionId,
        isPublic: playerStories.isPublic,
        expiresAt: playerStories.expiresAt,
        viewCount: playerStories.viewCount,
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

  async getActiveStories(limit: number = 20): Promise<(PlayerStory & { playerName: string })[]> {
    const now = new Date();
    const results = await db
      .select({
        id: playerStories.id,
        playerId: playerStories.playerId,
        templateId: playerStories.templateId,
        headline: playerStories.headline,
        stats: playerStories.stats,
        imageUrl: playerStories.imageUrl,
        videoUrl: playerStories.videoUrl,
        mediaType: playerStories.mediaType,
        caption: playerStories.caption,
        sessionId: playerStories.sessionId,
        isPublic: playerStories.isPublic,
        expiresAt: playerStories.expiresAt,
        viewCount: playerStories.viewCount,
        createdAt: playerStories.createdAt,
        playerName: players.name,
      })
      .from(playerStories)
      .innerJoin(players, eq(playerStories.playerId, players.id))
      .where(and(
        eq(playerStories.isPublic, true),
        or(
          sql`${playerStories.expiresAt} IS NULL`,
          gte(playerStories.expiresAt, now)
        )
      ))
      .orderBy(desc(playerStories.createdAt))
      .limit(limit);
    
    return results;
  }

  async getStory(id: number): Promise<PlayerStory | undefined> {
    const [story] = await db.select().from(playerStories).where(eq(playerStories.id, id));
    return story;
  }

  async updateStory(id: number, data: Partial<InsertPlayerStory>): Promise<PlayerStory | undefined> {
    const [updated] = await db.update(playerStories).set(data).where(eq(playerStories.id, id)).returning();
    return updated;
  }

  async deleteStory(id: number): Promise<void> {
    await db.delete(playerStories).where(eq(playerStories.id, id));
  }

  async incrementStoryViewCount(id: number): Promise<void> {
    await db.update(playerStories).set({ viewCount: sql`${playerStories.viewCount} + 1` }).where(eq(playerStories.id, id));
  }

  // Story Views
  async createStoryView(view: InsertStoryView): Promise<StoryView> {
    const [newView] = await db.insert(storyViews).values(view).returning();
    return newView;
  }

  async getStoryViews(storyId: number): Promise<StoryView[]> {
    return await db.select().from(storyViews).where(eq(storyViews.storyId, storyId)).orderBy(desc(storyViews.viewedAt));
  }

  async hasViewedStory(storyId: number, sessionId: string): Promise<boolean> {
    const [existing] = await db.select().from(storyViews).where(and(eq(storyViews.storyId, storyId), eq(storyViews.sessionId, sessionId)));
    return !!existing;
  }

  // Story Reactions
  async createStoryReaction(reaction: InsertStoryReaction): Promise<StoryReaction> {
    const [newReaction] = await db.insert(storyReactions).values(reaction).returning();
    return newReaction;
  }

  async getStoryReactions(storyId: number): Promise<StoryReaction[]> {
    return await db.select().from(storyReactions).where(eq(storyReactions.storyId, storyId)).orderBy(desc(storyReactions.createdAt));
  }

  async removeStoryReaction(storyId: number, sessionId: string): Promise<void> {
    await db.delete(storyReactions).where(and(eq(storyReactions.storyId, storyId), eq(storyReactions.sessionId, sessionId)));
  }

  async getReactionCounts(storyId: number): Promise<{ reaction: string; count: number }[]> {
    const results = await db
      .select({
        reaction: storyReactions.reaction,
        count: count(),
      })
      .from(storyReactions)
      .where(eq(storyReactions.storyId, storyId))
      .groupBy(storyReactions.reaction);
    
    return results.map(r => ({ reaction: r.reaction, count: Number(r.count) }));
  }

  // Story Highlights
  async createStoryHighlight(highlight: InsertStoryHighlight): Promise<StoryHighlight> {
    const [newHighlight] = await db.insert(storyHighlights).values(highlight).returning();
    return newHighlight;
  }

  async getPlayerHighlights(playerId: number): Promise<StoryHighlight[]> {
    return await db.select().from(storyHighlights).where(eq(storyHighlights.playerId, playerId)).orderBy(desc(storyHighlights.createdAt));
  }

  async getStoryHighlight(id: number): Promise<StoryHighlight | undefined> {
    const [highlight] = await db.select().from(storyHighlights).where(eq(storyHighlights.id, id));
    return highlight;
  }

  async updateStoryHighlight(id: number, data: Partial<InsertStoryHighlight>): Promise<StoryHighlight | undefined> {
    const [updated] = await db.update(storyHighlights).set(data).where(eq(storyHighlights.id, id)).returning();
    return updated;
  }

  async deleteStoryHighlight(id: number): Promise<void> {
    await db.delete(storyHighlights).where(eq(storyHighlights.id, id));
  }

  // Story Tags
  async addStoryTag(tag: InsertStoryTag): Promise<StoryTag> {
    const [newTag] = await db.insert(storyTags).values(tag).returning();
    return newTag;
  }

  async getStoryTags(storyId: number): Promise<StoryTag[]> {
    return await db.select().from(storyTags).where(eq(storyTags.storyId, storyId)).orderBy(desc(storyTags.createdAt));
  }

  async getTaggedStories(playerId: number): Promise<StoryTag[]> {
    return await db.select().from(storyTags).where(eq(storyTags.taggedPlayerId, playerId)).orderBy(desc(storyTags.createdAt));
  }

  async removeStoryTag(storyId: number, taggedPlayerId: number): Promise<void> {
    await db.delete(storyTags).where(and(eq(storyTags.storyId, storyId), eq(storyTags.taggedPlayerId, taggedPlayerId)));
  }

  // Activity Streaks
  async getPlayerActivityStreaks(playerId: number): Promise<ActivityStreak[]> {
    return await db
      .select()
      .from(activityStreaks)
      .where(eq(activityStreaks.playerId, playerId))
      .orderBy(desc(activityStreaks.updatedAt));
  }

  async getOrCreateActivityStreak(playerId: number, streakType: string): Promise<ActivityStreak> {
    const [existing] = await db
      .select()
      .from(activityStreaks)
      .where(and(eq(activityStreaks.playerId, playerId), eq(activityStreaks.streakType, streakType)));
    
    if (existing) return existing;

    const [newStreak] = await db
      .insert(activityStreaks)
      .values({ playerId, streakType, currentStreak: 0, longestStreak: 0 })
      .returning();
    
    return newStreak;
  }

  async updateActivityStreak(id: number, updates: Partial<ActivityStreak>): Promise<ActivityStreak | undefined> {
    const [updated] = await db
      .update(activityStreaks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(activityStreaks.id, id))
      .returning();
    return updated;
  }

  // XP Management
  async addPlayerXp(playerId: number, xpAmount: number): Promise<{ player: Player; newTier: string | null; oldTier: string }> {
    const [player] = await db.select().from(players).where(eq(players.id, playerId));
    if (!player) throw new Error("Player not found");

    const oldTier = player.currentTier;
    const newXp = (player.totalXp || 0) + xpAmount;
    
    // Calculate new tier based on XP thresholds
    let newTier = "Rookie";
    if (newXp >= 10000) newTier = "Hall of Fame";
    else if (newXp >= 5000) newTier = "MVP";
    else if (newXp >= 2000) newTier = "All-Star";
    else if (newXp >= 500) newTier = "Starter";

    const [updatedPlayer] = await db
      .update(players)
      .set({ totalXp: newXp, currentTier: newTier })
      .where(eq(players.id, playerId))
      .returning();

    return {
      player: updatedPlayer,
      newTier: newTier !== oldTier ? newTier : null,
      oldTier
    };
  }

  // Shots
  async createShot(data: InsertShot): Promise<Shot> {
    const [newShot] = await db.insert(shots).values(data).returning();
    return newShot;
  }

  async getShotsByGame(gameId: number): Promise<Shot[]> {
    return await db.select().from(shots).where(eq(shots.gameId, gameId)).orderBy(desc(shots.createdAt));
  }

  async getShotsByPlayer(playerId: number): Promise<Shot[]> {
    return await db.select().from(shots).where(eq(shots.playerId, playerId)).orderBy(desc(shots.createdAt));
  }

  async deleteShot(id: number): Promise<void> {
    await db.delete(shots).where(eq(shots.id, id));
  }

  // Game Notes
  async createGameNote(data: InsertGameNote): Promise<GameNote> {
    const [newNote] = await db.insert(gameNotes).values(data).returning();
    return newNote;
  }

  async getGameNote(id: number): Promise<GameNote | undefined> {
    const [note] = await db.select().from(gameNotes).where(eq(gameNotes.id, id));
    return note;
  }

  async getGameNotes(gameId: number): Promise<GameNote[]> {
    return await db.select().from(gameNotes).where(eq(gameNotes.gameId, gameId)).orderBy(desc(gameNotes.createdAt));
  }

  async getPlayerGameNotes(playerId: number): Promise<GameNote[]> {
    return await db.select().from(gameNotes).where(eq(gameNotes.playerId, playerId)).orderBy(desc(gameNotes.createdAt));
  }

  async updateGameNote(id: number, data: Partial<InsertGameNote>): Promise<GameNote> {
    const [updated] = await db.update(gameNotes).set(data).where(eq(gameNotes.id, id)).returning();
    return updated;
  }

  async deleteGameNote(id: number): Promise<void> {
    await db.delete(gameNotes).where(eq(gameNotes.id, id));
  }

  // Practices
  async createPractice(data: InsertPractice): Promise<Practice> {
    const [newPractice] = await db.insert(practices).values(data).returning();
    return newPractice;
  }

  async getPractices(): Promise<Practice[]> {
    return await db.select().from(practices).orderBy(desc(practices.date));
  }

  async getPractice(id: number): Promise<Practice | undefined> {
    const [practice] = await db.select().from(practices).where(eq(practices.id, id));
    return practice;
  }

  async updatePractice(id: number, data: Partial<InsertPractice>): Promise<Practice> {
    const [updated] = await db.update(practices).set(data).where(eq(practices.id, id)).returning();
    return updated;
  }

  async deletePractice(id: number): Promise<void> {
    await db.delete(practices).where(eq(practices.id, id));
  }

  // Practice Attendance
  async createPracticeAttendance(data: InsertPracticeAttendance): Promise<PracticeAttendance> {
    const [newAttendance] = await db.insert(practiceAttendance).values(data).returning();
    return newAttendance;
  }

  async getPracticeAttendance(practiceId: number): Promise<PracticeAttendance[]> {
    return await db.select().from(practiceAttendance).where(eq(practiceAttendance.practiceId, practiceId));
  }

  async getPlayerAttendance(playerId: number): Promise<PracticeAttendance[]> {
    return await db.select().from(practiceAttendance).where(eq(practiceAttendance.playerId, playerId));
  }

  async updatePracticeAttendance(id: number, data: Partial<InsertPracticeAttendance>): Promise<PracticeAttendance> {
    const [updated] = await db.update(practiceAttendance).set(data).where(eq(practiceAttendance.id, id)).returning();
    return updated;
  }

  // Drills
  async createDrill(data: InsertDrill): Promise<Drill> {
    const [newDrill] = await db.insert(drills).values(data).returning();
    return newDrill;
  }

  async getDrills(): Promise<Drill[]> {
    return await db.select().from(drills);
  }

  async getDrill(id: number): Promise<Drill | undefined> {
    const [drill] = await db.select().from(drills).where(eq(drills.id, id));
    return drill;
  }

  async getDrillsByCategory(category: string): Promise<Drill[]> {
    return await db.select().from(drills).where(eq(drills.category, category));
  }

  // Drill Scores
  async createDrillScore(data: InsertDrillScore): Promise<DrillScore> {
    const [newScore] = await db.insert(drillScores).values(data).returning();
    return newScore;
  }

  async getDrillScoresByPractice(practiceId: number): Promise<DrillScore[]> {
    return await db.select().from(drillScores).where(eq(drillScores.practiceId, practiceId)).orderBy(desc(drillScores.createdAt));
  }

  async getDrillScoresByPlayer(playerId: number): Promise<DrillScore[]> {
    return await db.select().from(drillScores).where(eq(drillScores.playerId, playerId)).orderBy(desc(drillScores.createdAt));
  }

  // Lineups
  async createLineup(data: InsertLineup): Promise<Lineup> {
    const [newLineup] = await db.insert(lineups).values(data).returning();
    return newLineup;
  }

  async getLineups(): Promise<Lineup[]> {
    return await db.select().from(lineups).orderBy(desc(lineups.createdAt));
  }

  async getLineup(id: number): Promise<Lineup | undefined> {
    const [lineup] = await db.select().from(lineups).where(eq(lineups.id, id));
    return lineup;
  }

  async deleteLineup(id: number): Promise<void> {
    await db.delete(lineups).where(eq(lineups.id, id));
  }

  // Lineup Stats
  async createLineupStat(data: InsertLineupStat): Promise<LineupStat> {
    const [newStat] = await db.insert(lineupStats).values(data).returning();
    return newStat;
  }

  async getLineupStats(lineupId: number): Promise<LineupStat[]> {
    return await db.select().from(lineupStats).where(eq(lineupStats.lineupId, lineupId)).orderBy(desc(lineupStats.createdAt));
  }

  async getLineupStatsByGame(gameId: number): Promise<LineupStat[]> {
    return await db.select().from(lineupStats).where(eq(lineupStats.gameId, gameId)).orderBy(desc(lineupStats.createdAt));
  }

  // Opponents
  async createOpponent(data: InsertOpponent): Promise<Opponent> {
    const [newOpponent] = await db.insert(opponents).values(data).returning();
    return newOpponent;
  }

  async getOpponents(): Promise<Opponent[]> {
    return await db.select().from(opponents).orderBy(desc(opponents.createdAt));
  }

  async getOpponent(id: number): Promise<Opponent | undefined> {
    const [opponent] = await db.select().from(opponents).where(eq(opponents.id, id));
    return opponent;
  }

  async updateOpponent(id: number, data: Partial<InsertOpponent>): Promise<Opponent> {
    const [updated] = await db.update(opponents).set(data).where(eq(opponents.id, id)).returning();
    return updated;
  }

  async deleteOpponent(id: number): Promise<void> {
    await db.delete(opponents).where(eq(opponents.id, id));
  }

  // Alerts
  async createAlert(data: InsertAlert): Promise<Alert> {
    const [newAlert] = await db.insert(alerts).values(data).returning();
    return newAlert;
  }

  async getAlerts(playerId?: number): Promise<Alert[]> {
    if (playerId) {
      return await db.select().from(alerts).where(eq(alerts.playerId, playerId)).orderBy(desc(alerts.createdAt));
    }
    return await db.select().from(alerts).orderBy(desc(alerts.createdAt));
  }

  async getUnreadAlerts(): Promise<Alert[]> {
    return await db.select().from(alerts).where(eq(alerts.isRead, false)).orderBy(desc(alerts.createdAt));
  }

  async markAlertRead(id: number): Promise<void> {
    await db.update(alerts).set({ isRead: true }).where(eq(alerts.id, id));
  }

  async markAllAlertsRead(): Promise<void> {
    await db.update(alerts).set({ isRead: true }).where(eq(alerts.isRead, false));
  }

  async deleteAlert(id: number): Promise<void> {
    await db.delete(alerts).where(eq(alerts.id, id));
  }

  // Coach Goals
  async createCoachGoal(data: InsertCoachGoal): Promise<CoachGoal> {
    const [newGoal] = await db.insert(coachGoals).values(data).returning();
    return newGoal;
  }

  async getCoachGoals(playerId: number): Promise<CoachGoal[]> {
    return await db.select().from(coachGoals).where(eq(coachGoals.playerId, playerId)).orderBy(desc(coachGoals.createdAt));
  }

  async getAllCoachGoals(): Promise<CoachGoal[]> {
    return await db.select().from(coachGoals).orderBy(desc(coachGoals.createdAt));
  }

  async updateCoachGoal(id: number, data: Partial<InsertCoachGoal>): Promise<CoachGoal> {
    const [updated] = await db.update(coachGoals).set(data).where(eq(coachGoals.id, id)).returning();
    return updated;
  }

  async deleteCoachGoal(id: number): Promise<void> {
    await db.delete(coachGoals).where(eq(coachGoals.id, id));
  }

  // Drill Recommendations
  async createDrillRecommendation(data: InsertDrillRecommendation): Promise<DrillRecommendation> {
    const [newRec] = await db.insert(drillRecommendations).values(data).returning();
    return newRec;
  }

  async getDrillRecommendations(playerId: number): Promise<DrillRecommendation[]> {
    return await db.select().from(drillRecommendations).where(eq(drillRecommendations.playerId, playerId)).orderBy(desc(drillRecommendations.priority));
  }

  async updateDrillRecommendation(id: number, data: Partial<InsertDrillRecommendation>): Promise<DrillRecommendation> {
    const [updated] = await db.update(drillRecommendations).set(data).where(eq(drillRecommendations.id, id)).returning();
    return updated;
  }

  async deleteDrillRecommendation(id: number): Promise<void> {
    await db.delete(drillRecommendations).where(eq(drillRecommendations.id, id));
  }

  // Follows
  async createFollow(followerPlayerId: number | null, followerUserId: string | null, followeePlayerId: number): Promise<Follow> {
    const [newFollow] = await db.insert(follows).values({ 
      followerPlayerId, 
      followerUserId,
      followeePlayerId 
    }).returning();
    return newFollow;
  }

  async deleteFollow(followerPlayerId: number | null, followerUserId: string | null, followeePlayerId: number): Promise<void> {
    if (followerPlayerId) {
      await db.delete(follows).where(
        and(eq(follows.followerPlayerId, followerPlayerId), eq(follows.followeePlayerId, followeePlayerId))
      );
    } else if (followerUserId) {
      await db.delete(follows).where(
        and(eq(follows.followerUserId, followerUserId), eq(follows.followeePlayerId, followeePlayerId))
      );
    }
  }

  async getFollowers(playerId: number): Promise<Follow[]> {
    return await db.select().from(follows).where(eq(follows.followeePlayerId, playerId)).orderBy(desc(follows.createdAt));
  }

  async getFollowing(playerId: number): Promise<Follow[]> {
    return await db.select().from(follows).where(eq(follows.followerPlayerId, playerId)).orderBy(desc(follows.createdAt));
  }

  async getFollowingByUserId(userId: string): Promise<Follow[]> {
    return await db.select().from(follows).where(eq(follows.followerUserId, userId)).orderBy(desc(follows.createdAt));
  }

  async isFollowing(followerPlayerId: number | null, followerUserId: string | null, followeePlayerId: number): Promise<boolean> {
    if (followerPlayerId) {
      const [existing] = await db.select().from(follows).where(
        and(eq(follows.followerPlayerId, followerPlayerId), eq(follows.followeePlayerId, followeePlayerId))
      );
      return !!existing;
    } else if (followerUserId) {
      const [existing] = await db.select().from(follows).where(
        and(eq(follows.followerUserId, followerUserId), eq(follows.followeePlayerId, followeePlayerId))
      );
      return !!existing;
    }
    return false;
  }

  async getFollowerCount(playerId: number): Promise<number> {
    const [result] = await db.select({ count: count() }).from(follows).where(eq(follows.followeePlayerId, playerId));
    return result?.count || 0;
  }

  async getFollowingCount(playerId: number): Promise<number> {
    const [result] = await db.select({ count: count() }).from(follows).where(eq(follows.followerPlayerId, playerId));
    return result?.count || 0;
  }

  async getFollowingCountByUserId(userId: string): Promise<number> {
    const [result] = await db.select({ count: count() }).from(follows).where(eq(follows.followerUserId, userId));
    return result?.count || 0;
  }

  // Notifications
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async getPlayerNotifications(playerId: number): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.playerId, playerId)).orderBy(desc(notifications.createdAt));
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotificationCount(playerId: number): Promise<number> {
    const [result] = await db.select({ count: count() }).from(notifications).where(
      and(eq(notifications.playerId, playerId), eq(notifications.isRead, false))
    );
    return result?.count || 0;
  }

  async getUnreadNotificationCountByUserId(userId: string): Promise<number> {
    const [result] = await db.select({ count: count() }).from(notifications).where(
      and(eq(notifications.userId, userId), eq(notifications.isRead, false))
    );
    return result?.count || 0;
  }

  async markNotificationRead(id: number): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(playerId: number): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(
      and(eq(notifications.playerId, playerId), eq(notifications.isRead, false))
    );
  }

  async markAllNotificationsReadByUserId(userId: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(
      and(eq(notifications.userId, userId), eq(notifications.isRead, false))
    );
  }

  // Highlight Clips
  async createHighlightClip(clip: InsertHighlightClip): Promise<HighlightClip> {
    const [newClip] = await db.insert(highlightClips).values(clip).returning();
    return newClip;
  }

  async getPlayerHighlightClips(playerId: number): Promise<HighlightClip[]> {
    return await db.select().from(highlightClips).where(eq(highlightClips.playerId, playerId)).orderBy(desc(highlightClips.createdAt));
  }

  async getHighlightClip(id: number): Promise<HighlightClip | undefined> {
    const [clip] = await db.select().from(highlightClips).where(eq(highlightClips.id, id));
    return clip;
  }

  async deleteHighlightClip(id: number): Promise<void> {
    await db.delete(highlightClips).where(eq(highlightClips.id, id));
  }

  async incrementClipViewCount(id: number): Promise<void> {
    await db.update(highlightClips).set({ viewCount: sql`${highlightClips.viewCount} + 1` }).where(eq(highlightClips.id, id));
  }

  async getPlayerHighlightCount(playerId: number): Promise<number> {
    const [result] = await db.select({ count: count() }).from(highlightClips).where(eq(highlightClips.playerId, playerId));
    return result?.count || 0;
  }

  // Workouts
  async createWorkout(workout: InsertWorkout): Promise<Workout> {
    const [newWorkout] = await db.insert(workouts).values(workout).returning();
    return newWorkout;
  }

  async getPlayerWorkouts(playerId: number): Promise<Workout[]> {
    return await db.select().from(workouts).where(eq(workouts.playerId, playerId)).orderBy(desc(workouts.date));
  }

  async getWorkout(id: number): Promise<Workout | undefined> {
    const [workout] = await db.select().from(workouts).where(eq(workouts.id, id));
    return workout;
  }

  async updateWorkout(id: number, updates: Partial<InsertWorkout>): Promise<Workout> {
    const [updated] = await db.update(workouts).set(updates).where(eq(workouts.id, id)).returning();
    return updated;
  }

  async deleteWorkout(id: number): Promise<void> {
    await db.delete(workouts).where(eq(workouts.id, id));
  }

  // Accolades
  async getPlayerAccolades(playerId: number): Promise<Accolade[]> {
    return await db.select().from(accolades).where(eq(accolades.playerId, playerId)).orderBy(desc(accolades.createdAt));
  }

  async createAccolade(accolade: InsertAccolade): Promise<Accolade> {
    const [newAccolade] = await db.insert(accolades).values(accolade).returning();
    return newAccolade;
  }

  async getAccoladeById(id: number): Promise<Accolade | undefined> {
    const [accolade] = await db.select().from(accolades).where(eq(accolades.id, id));
    return accolade;
  }

  async updateAccolade(id: number, updates: Partial<InsertAccolade>): Promise<Accolade> {
    const [updated] = await db.update(accolades).set(updates).where(eq(accolades.id, id)).returning();
    return updated;
  }

  async deleteAccolade(id: number): Promise<void> {
    await db.delete(accolades).where(eq(accolades.id, id));
  }

  // Goal Shares
  async createGoalShare(share: InsertGoalShare): Promise<GoalShare> {
    const [newShare] = await db.insert(goalShares).values(share).returning();
    return newShare;
  }

  async getGoalShares(goalId: number): Promise<GoalShare[]> {
    return await db.select().from(goalShares).where(eq(goalShares.goalId, goalId)).orderBy(desc(goalShares.createdAt));
  }

  async getSharedGoalsWithPlayer(playerId: number): Promise<GoalShare[]> {
    return await db.select().from(goalShares).where(eq(goalShares.sharedWithPlayerId, playerId)).orderBy(desc(goalShares.createdAt));
  }

  async deleteGoalShare(id: number): Promise<void> {
    await db.delete(goalShares).where(eq(goalShares.id, id));
  }

  // Schedule Events
  async createScheduleEvent(event: InsertScheduleEvent): Promise<ScheduleEvent> {
    const [newEvent] = await db.insert(scheduleEvents).values(event).returning();
    return newEvent;
  }

  async getPlayerScheduleEvents(playerId: number): Promise<ScheduleEvent[]> {
    return await db.select().from(scheduleEvents).where(eq(scheduleEvents.playerId, playerId)).orderBy(desc(scheduleEvents.startTime));
  }

  async getTeamScheduleEvents(teamId: number): Promise<ScheduleEvent[]> {
    return await db.select().from(scheduleEvents).where(eq(scheduleEvents.teamId, teamId)).orderBy(desc(scheduleEvents.startTime));
  }

  async getAllScheduleEvents(): Promise<ScheduleEvent[]> {
    return await db.select().from(scheduleEvents).orderBy(desc(scheduleEvents.startTime));
  }

  async getScheduleEvent(id: number): Promise<ScheduleEvent | undefined> {
    const [event] = await db.select().from(scheduleEvents).where(eq(scheduleEvents.id, id));
    return event;
  }

  async updateScheduleEvent(id: number, updates: Partial<InsertScheduleEvent>): Promise<ScheduleEvent> {
    const [updated] = await db.update(scheduleEvents).set(updates).where(eq(scheduleEvents.id, id)).returning();
    return updated;
  }

  async deleteScheduleEvent(id: number): Promise<void> {
    await db.delete(scheduleEvents).where(eq(scheduleEvents.id, id));
  }

  // Live Game Sessions
  async createLiveGameSession(session: InsertLiveGameSession): Promise<LiveGameSession> {
    const [newSession] = await db.insert(liveGameSessions).values(session).returning();
    return newSession;
  }

  async getLiveGameSession(id: number): Promise<LiveGameSession | undefined> {
    const [session] = await db.select().from(liveGameSessions).where(eq(liveGameSessions.id, id));
    return session;
  }

  async getActivePlayerSession(playerId: number): Promise<LiveGameSession | undefined> {
    const [session] = await db.select().from(liveGameSessions).where(
      and(eq(liveGameSessions.playerId, playerId), eq(liveGameSessions.status, "active"))
    );
    return session;
  }

  async updateLiveGameSession(id: number, updates: Partial<LiveGameSession>): Promise<LiveGameSession> {
    const [updated] = await db.update(liveGameSessions).set(updates).where(eq(liveGameSessions.id, id)).returning();
    return updated;
  }

  // Live Game Events
  async createLiveGameEvent(event: InsertLiveGameEvent): Promise<LiveGameEvent> {
    const [newEvent] = await db.insert(liveGameEvents).values(event).returning();
    return newEvent;
  }

  async getSessionEvents(sessionId: number): Promise<LiveGameEvent[]> {
    return await db.select().from(liveGameEvents).where(eq(liveGameEvents.sessionId, sessionId)).orderBy(desc(liveGameEvents.createdAt));
  }

  async deleteLiveGameEvent(eventId: number): Promise<void> {
    await db.delete(liveGameEvents).where(eq(liveGameEvents.id, eventId));
  }

  // Live Game Spectators
  async addLiveGameSpectator(spectator: InsertLiveGameSpectator): Promise<LiveGameSpectator> {
    const [newSpectator] = await db.insert(liveGameSpectators).values(spectator).returning();
    return newSpectator;
  }

  async getLiveGameSpectators(sessionId: number): Promise<LiveGameSpectator[]> {
    return await db.select().from(liveGameSpectators).where(
      and(eq(liveGameSpectators.sessionId, sessionId), isNull(liveGameSpectators.leftAt))
    ).orderBy(desc(liveGameSpectators.joinedAt));
  }

  async removeLiveGameSpectator(sessionId: number, viewerUserId: string | null, viewerPlayerId: number | null): Promise<void> {
    const conditions = [eq(liveGameSpectators.sessionId, sessionId)];
    
    if (viewerUserId) {
      conditions.push(eq(liveGameSpectators.viewerUserId, viewerUserId));
    } else if (viewerPlayerId) {
      conditions.push(eq(liveGameSpectators.viewerPlayerId, viewerPlayerId));
    } else {
      return; // Neither userId nor playerId provided
    }

    await db.update(liveGameSpectators).set({ leftAt: new Date() }).where(and(...conditions));
  }

  async getActiveSpectatorSessions(viewerUserId: string | null, viewerPlayerId: number | null): Promise<LiveGameSpectator[]> {
    const conditions = [isNull(liveGameSpectators.leftAt)];
    
    if (viewerUserId) {
      conditions.push(eq(liveGameSpectators.viewerUserId, viewerUserId));
    } else if (viewerPlayerId) {
      conditions.push(eq(liveGameSpectators.viewerPlayerId, viewerPlayerId));
    } else {
      return []; // Neither userId nor playerId provided
    }

    return await db.select().from(liveGameSpectators).where(and(...conditions)).orderBy(desc(liveGameSpectators.joinedAt));
  }

  async getSpectatorCount(sessionId: number): Promise<number> {
    const result = await db.select({ count: count() }).from(liveGameSpectators).where(
      and(eq(liveGameSpectators.sessionId, sessionId), isNull(liveGameSpectators.leftAt))
    );
    return result[0]?.count || 0;
  }

  // Share Assets
  async createShareAsset(asset: InsertShareAsset): Promise<ShareAsset> {
    const [newAsset] = await db.insert(shareAssets).values(asset).returning();
    return newAsset;
  }

  async getPlayerShareAssets(playerId: number): Promise<ShareAsset[]> {
    return await db.select().from(shareAssets).where(eq(shareAssets.playerId, playerId)).orderBy(desc(shareAssets.createdAt));
  }

  async incrementShareCount(id: number): Promise<void> {
    await db.update(shareAssets).set({ sharedCount: sql`${shareAssets.sharedCount} + 1` }).where(eq(shareAssets.id, id));
  }

  // Training Groups
  async createTrainingGroup(group: InsertTrainingGroup): Promise<TrainingGroup> {
    const [newGroup] = await db.insert(trainingGroups).values(group).returning();
    return newGroup;
  }

  async getTrainingGroup(id: number): Promise<TrainingGroup | undefined> {
    const [group] = await db.select().from(trainingGroups).where(eq(trainingGroups.id, id));
    return group;
  }

  async getUserTrainingGroups(userId: string | null, playerId: number | null): Promise<TrainingGroup[]> {
    if (!userId && !playerId) return [];

    // Get groups owned by user or groups where user's player is a member
    const ownedGroups = userId ? await db.select().from(trainingGroups).where(eq(trainingGroups.ownerUserId, userId)) : [];
    
    let memberGroups: TrainingGroup[] = [];
    if (playerId) {
      const memberGroupIds = await db.select({ groupId: trainingGroupMembers.groupId })
        .from(trainingGroupMembers)
        .where(eq(trainingGroupMembers.playerId, playerId));
      
      if (memberGroupIds.length > 0) {
        memberGroups = await db.select().from(trainingGroups)
          .where(or(
            ...memberGroupIds.map(m => eq(trainingGroups.id, m.groupId))
          ));
      }
    }

    // Combine and deduplicate
    const allGroups = [...ownedGroups, ...memberGroups];
    const seen = new Set<number>();
    return allGroups.filter(g => {
      if (seen.has(g.id)) return false;
      seen.add(g.id);
      return true;
    });
  }

  async addGroupMember(member: InsertTrainingGroupMember): Promise<TrainingGroupMember> {
    const [newMember] = await db.insert(trainingGroupMembers).values(member).returning();
    return newMember;
  }

  async getGroupMembers(groupId: number): Promise<TrainingGroupMember[]> {
    return await db.select().from(trainingGroupMembers)
      .where(eq(trainingGroupMembers.groupId, groupId))
      .orderBy(desc(trainingGroupMembers.joinedAt));
  }

  async removeGroupMember(groupId: number, playerId: number): Promise<void> {
    await db.delete(trainingGroupMembers)
      .where(and(
        eq(trainingGroupMembers.groupId, groupId),
        eq(trainingGroupMembers.playerId, playerId)
      ));
  }

  async updateTrainingGroup(id: number, updates: Partial<InsertTrainingGroup>): Promise<TrainingGroup> {
    const [updated] = await db.update(trainingGroups)
      .set(updates)
      .where(eq(trainingGroups.id, id))
      .returning();
    return updated;
  }

  async deleteTrainingGroup(id: number): Promise<void> {
    await db.delete(trainingGroups).where(eq(trainingGroups.id, id));
  }

  async getPublicTrainingGroups(): Promise<TrainingGroup[]> {
    return await db.select().from(trainingGroups)
      .where(eq(trainingGroups.isPublic, true))
      .orderBy(desc(trainingGroups.createdAt));
  }

  // Direct Messages
  async createDmThread(): Promise<DmThread> {
    const [newThread] = await db.insert(dmThreads).values({}).returning();
    return newThread;
  }

  async addDmParticipant(participant: InsertDmParticipant): Promise<DmParticipant> {
    const [newParticipant] = await db.insert(dmParticipants).values(participant).returning();
    return newParticipant;
  }

  async createDmMessage(message: InsertDmMessage): Promise<DmMessage> {
    const [newMessage] = await db.insert(dmMessages).values(message).returning();
    return newMessage;
  }

  async getUserDmThreads(userId: string): Promise<DmThread[]> {
    const threads = await db.select({ thread: dmThreads }).from(dmThreads)
      .innerJoin(dmParticipants, eq(dmParticipants.threadId, dmThreads.id))
      .where(eq(dmParticipants.userId, userId))
      .orderBy(desc(dmThreads.updatedAt));
    
    return threads.map(t => t.thread);
  }

  async getThreadMessages(threadId: number): Promise<DmMessage[]> {
    return await db.select().from(dmMessages)
      .where(eq(dmMessages.threadId, threadId))
      .orderBy(desc(dmMessages.createdAt));
  }

  async getOrCreateThread(userId1: string, playerId1: number | null, userId2: string, playerId2: number | null): Promise<DmThread> {
    // Find existing thread
    const existingThreads = await db.select({ threadId: dmParticipants.threadId }).from(dmParticipants)
      .where(eq(dmParticipants.userId, userId1));
    
    for (const { threadId } of existingThreads) {
      const otherParticipant = await db.select().from(dmParticipants)
        .where(and(eq(dmParticipants.threadId, threadId), eq(dmParticipants.userId, userId2)));
      
      if (otherParticipant.length > 0) {
        const [thread] = await db.select().from(dmThreads).where(eq(dmThreads.id, threadId));
        return thread;
      }
    }

    // Create new thread
    const thread = await this.createDmThread();
    await this.addDmParticipant({ threadId: thread.id, userId: userId1, playerId: playerId1 });
    await this.addDmParticipant({ threadId: thread.id, userId: userId2, playerId: playerId2 });
    
    return thread;
  }

  async markMessagesAsRead(threadId: number, userId: string): Promise<void> {
    await db.update(dmMessages)
      .set({ isRead: true })
      .where(and(eq(dmMessages.threadId, threadId), eq(dmMessages.senderUserId, userId)));
    
    await db.update(dmParticipants)
      .set({ lastReadAt: new Date() })
      .where(and(eq(dmParticipants.threadId, threadId), eq(dmParticipants.userId, userId)));
  }

  async getThreadParticipants(threadId: number): Promise<DmParticipant[]> {
    return await db.select().from(dmParticipants)
      .where(eq(dmParticipants.threadId, threadId));
  }

  // Mentorship
  async createMentorshipProfile(profile: InsertMentorshipProfile): Promise<MentorshipProfile> {
    const [result] = await db.insert(mentorshipProfiles).values(profile).returning();
    return result;
  }

  async getMentorshipProfile(playerId: number): Promise<MentorshipProfile | undefined> {
    const [profile] = await db.select().from(mentorshipProfiles)
      .where(eq(mentorshipProfiles.playerId, playerId));
    return profile;
  }

  async updateMentorshipProfile(playerId: number, updates: Partial<InsertMentorshipProfile>): Promise<MentorshipProfile> {
    const [result] = await db.update(mentorshipProfiles)
      .set(updates)
      .where(eq(mentorshipProfiles.playerId, playerId))
      .returning();
    return result;
  }

  async getActiveMentors(): Promise<MentorshipProfile[]> {
    return await db.select().from(mentorshipProfiles)
      .where(and(
        eq(mentorshipProfiles.isActive, true),
        or(
          eq(mentorshipProfiles.role, 'mentor'),
          eq(mentorshipProfiles.role, 'both')
        )
      ))
      .orderBy(desc(mentorshipProfiles.createdAt));
  }

  async createMentorshipRequest(request: InsertMentorshipRequest): Promise<MentorshipRequest> {
    const [result] = await db.insert(mentorshipRequests).values(request).returning();
    return result;
  }

  async getMentorshipRequests(playerId: number): Promise<MentorshipRequest[]> {
    return await db.select().from(mentorshipRequests)
      .where(eq(mentorshipRequests.requesterPlayerId, playerId))
      .orderBy(desc(mentorshipRequests.createdAt));
  }

  async getIncomingMentorshipRequests(mentorPlayerId: number): Promise<MentorshipRequest[]> {
    return await db.select().from(mentorshipRequests)
      .where(eq(mentorshipRequests.mentorPlayerId, mentorPlayerId))
      .orderBy(desc(mentorshipRequests.createdAt));
  }

  async updateMentorshipRequestStatus(id: number, status: string): Promise<MentorshipRequest> {
    const [result] = await db.update(mentorshipRequests)
      .set({ status, respondedAt: new Date() })
      .where(eq(mentorshipRequests.id, id))
      .returning();
    return result;
  }

  async getAcceptedMentorships(playerId: number): Promise<MentorshipRequest[]> {
    return await db.select().from(mentorshipRequests)
      .where(and(
        or(
          eq(mentorshipRequests.requesterPlayerId, playerId),
          eq(mentorshipRequests.mentorPlayerId, playerId)
        ),
        eq(mentorshipRequests.status, 'accepted')
      ))
      .orderBy(desc(mentorshipRequests.createdAt));
  }

  // Recruit Board Methods
  async createRecruitPost(post: InsertRecruitPost): Promise<RecruitPost> {
    const [result] = await db.insert(recruitPosts).values(post).returning();
    return result;
  }

  async getRecruitPosts(filters?: { level?: string; location?: string }): Promise<RecruitPost[]> {
    let query = db.select().from(recruitPosts).where(eq(recruitPosts.isActive, true));
    
    if (filters?.level) {
      query = query.where(eq(recruitPosts.level, filters.level));
    }
    
    if (filters?.location) {
      query = query.where(eq(recruitPosts.location, filters.location));
    }
    
    return await query.orderBy(desc(recruitPosts.createdAt));
  }

  async getRecruitPost(id: number): Promise<RecruitPost | undefined> {
    const [post] = await db.select().from(recruitPosts).where(eq(recruitPosts.id, id));
    return post;
  }

  async updateRecruitPost(id: number, updates: Partial<InsertRecruitPost>): Promise<RecruitPost> {
    const [result] = await db.update(recruitPosts).set(updates).where(eq(recruitPosts.id, id)).returning();
    return result;
  }

  async deleteRecruitPost(id: number): Promise<void> {
    await db.delete(recruitPosts).where(eq(recruitPosts.id, id));
  }

  async getCoachRecruitPosts(coachUserId: string): Promise<RecruitPost[]> {
    return await db.select().from(recruitPosts)
      .where(eq(recruitPosts.coachUserId, coachUserId))
      .orderBy(desc(recruitPosts.createdAt));
  }

  async createRecruitInterest(interest: InsertRecruitInterest): Promise<RecruitInterest> {
    const [result] = await db.insert(recruitInterests).values(interest).returning();
    return result;
  }

  async getPostInterests(postId: number): Promise<RecruitInterest[]> {
    return await db.select().from(recruitInterests)
      .where(eq(recruitInterests.postId, postId))
      .orderBy(desc(recruitInterests.createdAt));
  }

  async getPlayerInterests(playerId: number): Promise<RecruitInterest[]> {
    return await db.select().from(recruitInterests)
      .where(eq(recruitInterests.playerId, playerId))
      .orderBy(desc(recruitInterests.createdAt));
  }

  async updateInterestStatus(id: number, status: string): Promise<RecruitInterest> {
    const [result] = await db.update(recruitInterests)
      .set({ status })
      .where(eq(recruitInterests.id, id))
      .returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
