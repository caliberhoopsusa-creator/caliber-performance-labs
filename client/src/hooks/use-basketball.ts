import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type PlayerInput, type GameInput } from "@shared/routes";
import type { Accolade } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// ============================================
// PLAYERS HOOKS
// ============================================

export function usePlayers() {
  return useQuery({
    queryKey: [api.players.list.path],
    queryFn: async () => {
      const res = await fetch(api.players.list.path);
      if (!res.ok) throw new Error("Failed to fetch players");
      return api.players.list.responses[200].parse(await res.json());
    },
  });
}

export function usePlayer(id: number) {
  return useQuery({
    queryKey: [api.players.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.players.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch player");
      return api.players.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreatePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PlayerInput) => {
      const validated = api.players.create.input.parse(data);
      const res = await fetch(api.players.create.path, {
        method: api.players.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.players.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create player");
      }
      return api.players.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.players.list.path] }),
  });
}

export function useDeletePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.players.delete.path, { id });
      const res = await fetch(url, { method: api.players.delete.method });
      if (!res.ok) throw new Error("Failed to delete player");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.players.list.path] }),
  });
}

export type RosterRole = "starter" | "rotation" | "bench" | "development";

export function useUpdateRosterRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, rosterRole }: { id: number; rosterRole: RosterRole }) => {
      const res = await fetch(`/api/players/${id}/roster-role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rosterRole }),
      });
      if (!res.ok) throw new Error("Failed to update roster role");
      return res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [api.players.get.path, id] });
      queryClient.invalidateQueries({ queryKey: [api.players.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/team-dashboard"] });
    },
  });
}

export type PlayerUpdate = {
  name?: string;
  position?: string; // Comma-separated positions for multi-position support
  height?: string;
  team?: string;
  jerseyNumber?: number;
  photoUrl?: string;
  bannerUrl?: string;
  bio?: string;
  openToOpportunities?: boolean;
  city?: string;
  state?: string;
  school?: string;
  graduationYear?: number;
  gpa?: number;
  widgetPreferences?: string;
};

export function useUpdatePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: PlayerUpdate }) => {
      const validated = api.players.update.input.parse(updates);
      const url = buildUrl(api.players.update.path, { id });
      const res = await fetch(url, {
        method: api.players.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Validation failed");
        }
        throw new Error("Failed to update player");
      }
      return api.players.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [api.players.get.path, id] });
      queryClient.invalidateQueries({ queryKey: [api.players.list.path] });
    },
  });
}

// ============================================
// GAMES HOOKS
// ============================================

export function useCreateGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: GameInput) => {
      // Ensure numeric fields are numbers (Zod coerce handles this in schema usually, 
      // but explicit conversion is safer for form inputs)
      const payload = {
        ...data,
        playerId: Number(data.playerId),
        minutes: Number(data.minutes),
        points: Number(data.points),
        rebounds: Number(data.rebounds),
        assists: Number(data.assists),
        steals: Number(data.steals),
        blocks: Number(data.blocks),
        turnovers: Number(data.turnovers),
        fouls: Number(data.fouls),
        fgMade: Number(data.fgMade),
        fgAttempted: Number(data.fgAttempted),
        threeMade: Number(data.threeMade),
        threeAttempted: Number(data.threeAttempted),
        ftMade: Number(data.ftMade),
        ftAttempted: Number(data.ftAttempted),
        offensiveRebounds: Number(data.offensiveRebounds || 0),
        defensiveRebounds: Number(data.defensiveRebounds || 0),
        hustleScore: Number(data.hustleScore || 50),
        defenseRating: Number(data.defenseRating || 50),
      };

      const validated = api.games.create.input.parse(payload);
      
      const res = await fetch(api.games.create.path, {
        method: api.games.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.games.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to analyze game");
      }
      return api.games.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.players.get.path, variables.playerId] });
      queryClient.invalidateQueries({ queryKey: [api.players.list.path] });
    },
  });
}

export function useGame(id: number) {
  return useQuery({
    queryKey: [api.games.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.games.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch game");
      return api.games.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useDeleteGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.games.delete.path, { id });
      const res = await fetch(url, { method: api.games.delete.method });
      if (!res.ok) throw new Error("Failed to delete game");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.players.get.path] });
      // We don't know the exact player ID easily here without extra fetch, 
      // so we might over-invalidate or rely on the specific page to refetch.
      // A pragmatic approach is to invalidate all players queries.
      queryClient.invalidateQueries({ queryKey: [api.players.list.path] });
    },
  });
}

// ============================================
// BADGES HOOKS
// ============================================

export function usePlayerBadges(playerId: number) {
  return useQuery({
    queryKey: ['/api/players', playerId, 'badges'],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}/badges`);
      if (!res.ok) throw new Error("Failed to fetch badges");
      return res.json();
    },
    enabled: !!playerId,
  });
}

// ============================================
// GOALS HOOKS
// ============================================

export function usePlayerGoals(playerId: number) {
  return useQuery({
    queryKey: ['/api/players', playerId, 'goals'],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}/goals`);
      if (!res.ok) throw new Error("Failed to fetch goals");
      return res.json();
    },
    enabled: !!playerId,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { playerId: number; title: string; targetType: string; targetCategory: string; targetValue: number; deadline?: string | null }) => {
      const res = await fetch(`/api/players/${data.playerId}/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create goal");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/players', variables.playerId, 'goals'] });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: number; playerId: number; updates: { completed?: boolean } }) => {
      const res = await fetch(`/api/goals/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.updates),
      });
      if (!res.ok) throw new Error("Failed to update goal");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/players', variables.playerId, 'goals'] });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: number; playerId: number }) => {
      const res = await fetch(`/api/goals/${data.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete goal");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/players', variables.playerId, 'goals'] });
    },
  });
}

// ============================================
// STREAKS HOOKS
// ============================================

export function usePlayerStreaks(playerId: number) {
  return useQuery({
    queryKey: ['/api/players', playerId, 'streaks'],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}/streaks`);
      if (!res.ok) throw new Error("Failed to fetch streaks");
      return res.json();
    },
    enabled: !!playerId,
  });
}

// ============================================
// PLAYER PROGRESSION HOOKS (XP, Tier, Activity Streaks)
// ============================================

export type PlayerProgression = {
  playerId: number;
  playerName: string;
  totalXp: number;
  currentTier: string;
  nextTier: string | null;
  xpToNextTier: number;
  progressPercent: number;
  currentStreak: number;
  longestStreak: number;
  tierThresholds: Record<string, number>;
};

export function usePlayerProgression(playerId: number) {
  return useQuery<PlayerProgression>({
    queryKey: ['/api/players', playerId, 'progression'],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}/progression`);
      if (!res.ok) throw new Error("Failed to fetch progression");
      return res.json();
    },
    enabled: !!playerId,
  });
}

export function useRecordActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { playerId: number; streakType?: string }) => {
      const res = await fetch(`/api/players/${data.playerId}/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streakType: data.streakType || 'daily_login' }),
      });
      if (!res.ok) throw new Error("Failed to record activity");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/players', variables.playerId, 'progression'] });
      queryClient.invalidateQueries({ queryKey: ['/api/players', variables.playerId, 'streaks'] });
      queryClient.invalidateQueries({ queryKey: [api.players.get.path, variables.playerId] });
    },
  });
}

// ============================================
// SKILL BADGES HOOKS (Progressive career badges)
// ============================================

export type SkillBadge = {
  id: number;
  playerId: number;
  skillType: string;
  currentLevel: 'none' | 'brick' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'hall_of_fame' | 'legend' | 'goat';
  careerValue: number;
  name: string;
  description: string;
  thresholds: { brick: number; bronze: number; silver: number; gold: number; platinum: number; hall_of_fame: number; legend: number; goat: number };
};

export function usePlayerSkillBadges(playerId: number) {
  return useQuery<SkillBadge[]>({
    queryKey: ['/api/players', playerId, 'skill-badges'],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}/skill-badges`);
      if (!res.ok) throw new Error("Failed to fetch skill badges");
      return res.json();
    },
    enabled: !!playerId,
  });
}

// ============================================
// SHOTS HOOKS (Shot Charts)
// ============================================

export type Shot = {
  id: number;
  gameId: number;
  playerId: number;
  x: number;
  y: number;
  shotType: string;
  result: string;
  quarter: number;
  createdAt: string;
};

export type CreateShotInput = {
  x: number;
  y: number;
  shotType: string;
  result: string;
  quarter: number;
};

export function useShotsByGame(gameId: number) {
  return useQuery<Shot[]>({
    queryKey: ['/api/games', gameId, 'shots'],
    queryFn: async () => {
      const res = await fetch(`/api/games/${gameId}/shots`);
      if (!res.ok) throw new Error("Failed to fetch shots");
      return res.json();
    },
    enabled: !!gameId,
  });
}

export function useShotsByPlayer(playerId: number) {
  return useQuery<Shot[]>({
    queryKey: ['/api/players', playerId, 'shots'],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}/shots`);
      if (!res.ok) throw new Error("Failed to fetch shots");
      return res.json();
    },
    enabled: !!playerId,
  });
}

export function useCreateShot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { gameId: number; shot: CreateShotInput }) => {
      const res = await fetch(`/api/games/${data.gameId}/shots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.shot),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create shot");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/games', variables.gameId, 'shots'] });
    },
  });
}

// ============================================
// GAME NOTES HOOKS
// ============================================

export type GameNote = {
  id: number;
  gameId: number;
  playerId: number;
  authorName: string;
  content: string;
  noteType: 'observation' | 'improvement' | 'praise' | 'strategy';
  isPrivate: boolean;
  createdAt: string;
};

export type CreateGameNoteInput = {
  playerId: number;
  authorName: string;
  content: string;
  noteType: 'observation' | 'improvement' | 'praise' | 'strategy';
  isPrivate: boolean;
};

export type UpdateGameNoteInput = Partial<{
  content: string;
  noteType: 'observation' | 'improvement' | 'praise' | 'strategy';
  isPrivate: boolean;
}>;

export function useGameNotes(gameId: number) {
  return useQuery<GameNote[]>({
    queryKey: ['/api/games', gameId, 'notes'],
    queryFn: async () => {
      const res = await fetch(`/api/games/${gameId}/notes`);
      if (!res.ok) throw new Error("Failed to fetch game notes");
      return res.json();
    },
    enabled: !!gameId,
  });
}

export function usePlayerGameNotes(playerId: number) {
  return useQuery<GameNote[]>({
    queryKey: ['/api/players', playerId, 'notes'],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}/notes`);
      if (!res.ok) throw new Error("Failed to fetch player notes");
      return res.json();
    },
    enabled: !!playerId,
  });
}

export function useCreateGameNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { gameId: number; note: CreateGameNoteInput }) => {
      const res = await fetch(`/api/games/${data.gameId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.note),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create note");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/games', variables.gameId, 'notes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/players', variables.note.playerId, 'notes'] });
    },
  });
}

export function useUpdateGameNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: number; gameId: number; playerId: number; updates: UpdateGameNoteInput }) => {
      const res = await fetch(`/api/notes/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.updates),
      });
      if (!res.ok) throw new Error("Failed to update note");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/games', variables.gameId, 'notes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/players', variables.playerId, 'notes'] });
    },
  });
}

export function useDeleteGameNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: number; gameId: number; playerId: number }) => {
      const res = await fetch(`/api/notes/${data.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete note");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/games', variables.gameId, 'notes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/players', variables.playerId, 'notes'] });
    },
  });
}

// ============================================
// TEAM DASHBOARD HOOKS
// ============================================

export type TeamDashboardPlayer = {
  id: number;
  name: string;
  position: string;
  team: string | null;
  jerseyNumber: number | null;
  photoUrl: string | null;
  rosterRole: RosterRole | null;
  sport: string;
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  passYpg: number;
  rushYpg: number;
  recYpg: number;
  tdsPerGame: number;
  compPct: number;
  ypc: number;
  tackles: number;
  sacks: number;
  avgGrade: string | null;
  avgGradeScore: number;
  gamesPlayed: number;
};

export type TeamDashboardData = {
  players: TeamDashboardPlayer[];
  teamStats: {
    totalPlayers: number;
    totalGamesPlayed: number;
    teamPpg: number;
    teamRpg: number;
    teamApg: number;
  };
  bestPerformers: {
    topScorer: { id: number; name: string; value: number } | null;
    topRebounder: { id: number; name: string; value: number } | null;
    topAssister: { id: number; name: string; value: number } | null;
  };
  recentGames: {
    playerId: number;
    playerName: string;
    sport: string;
    id: number;
    date: string;
    opponent: string;
    points: number;
    rebounds: number;
    assists: number;
    passingYards: number;
    rushingYards: number;
    receivingYards: number;
    touchdowns: number;
    grade: string | null;
  }[];
  positionDistribution: {
    Guard: number;
    Wing: number;
    Big: number;
  };
};

export function useTeamDashboard() {
  return useQuery<TeamDashboardData>({
    queryKey: ['/api/team-dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/team-dashboard');
      if (!res.ok) throw new Error("Failed to fetch team dashboard");
      return res.json();
    },
  });
}

// ============================================
// LINEUPS HOOKS
// ============================================

export type Lineup = {
  id: number;
  name: string | null;
  playerIds: string;
  createdAt: string;
};

export type LineupWithStats = Lineup & {
  stats?: LineupStat[];
};

export type LineupStat = {
  id: number;
  lineupId: number;
  gameId: number;
  minutes: number;
  plusMinus: number;
  points: number;
  createdAt: string;
};

export function useLineups() {
  return useQuery<Lineup[]>({
    queryKey: ['/api/lineups'],
    queryFn: async () => {
      const res = await fetch('/api/lineups');
      if (!res.ok) throw new Error("Failed to fetch lineups");
      return res.json();
    },
  });
}

export function useLineup(id: number) {
  return useQuery<LineupWithStats>({
    queryKey: ['/api/lineups', id],
    queryFn: async () => {
      const res = await fetch(`/api/lineups/${id}`);
      if (!res.ok) throw new Error("Failed to fetch lineup");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateLineup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name?: string; playerIds: string }) => {
      const res = await fetch('/api/lineups', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create lineup");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lineups'] });
    },
  });
}

export function useDeleteLineup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/lineups/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete lineup");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lineups'] });
    },
  });
}

// ============================================
// PRACTICES HOOKS
// ============================================

export type Practice = {
  id: number;
  teamId: number | null;
  date: string;
  title: string;
  duration: number;
  actualDuration: number | null;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  currentDrillId: number | null;
  notes: string | null;
  createdAt: string;
  attendance?: PracticeAttendance[];
};

export type PracticeAttendance = {
  id: number;
  practiceId: number;
  playerId: number;
  attended: boolean;
  checkedInAt: string | null;
  effortRating: number | null;
  notes: string | null;
};

export type CreatePracticeInput = {
  date: string;
  title: string;
  duration: number;
  notes?: string | null;
};

export type CreatePracticeAttendanceInput = {
  playerId: number;
  attended: boolean;
  effortRating?: number | null;
  notes?: string | null;
};

export function usePractices() {
  return useQuery<Practice[]>({
    queryKey: ['/api/practices'],
    queryFn: async () => {
      const res = await fetch('/api/practices');
      if (!res.ok) throw new Error("Failed to fetch practices");
      return res.json();
    },
  });
}

export function usePractice(id: number) {
  return useQuery<Practice>({
    queryKey: ['/api/practices', id],
    queryFn: async () => {
      const res = await fetch(`/api/practices/${id}`);
      if (!res.ok) throw new Error("Failed to fetch practice");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreatePractice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePracticeInput) => {
      const res = await fetch('/api/practices', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create practice");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/practices'] });
    },
  });
}

export function useUpdatePractice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: number; updates: Partial<CreatePracticeInput> }) => {
      const res = await fetch(`/api/practices/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.updates),
      });
      if (!res.ok) throw new Error("Failed to update practice");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/practices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/practices', variables.id] });
    },
  });
}

export function useDeletePractice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/practices/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete practice");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/practices'] });
    },
  });
}

export function usePracticeAttendance(practiceId: number) {
  return useQuery<PracticeAttendance[]>({
    queryKey: ['/api/practices', practiceId, 'attendance'],
    queryFn: async () => {
      const res = await fetch(`/api/practices/${practiceId}/attendance`);
      if (!res.ok) throw new Error("Failed to fetch attendance");
      return res.json();
    },
    enabled: !!practiceId,
  });
}

export function useCreatePracticeAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { practiceId: number; attendance: CreatePracticeAttendanceInput }) => {
      const res = await fetch(`/api/practices/${data.practiceId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.attendance),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create attendance");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/practices', variables.practiceId, 'attendance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/practices', variables.practiceId] });
    },
  });
}

export function useUpdatePracticeAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: number; practiceId: number; updates: Partial<CreatePracticeAttendanceInput> }) => {
      const res = await fetch(`/api/attendance/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.updates),
      });
      if (!res.ok) throw new Error("Failed to update attendance");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/practices', variables.practiceId, 'attendance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/practices', variables.practiceId] });
    },
  });
}

// ============================================
// DRILLS HOOKS
// ============================================

export type Drill = {
  id: number;
  name: string;
  category: string;
  description: string | null;
  targetStat: string | null;
};

export type DrillScore = {
  id: number;
  practiceId: number;
  playerId: number;
  drillId: number;
  score: number;
  notes: string | null;
  createdAt: string;
};

export function useDrills() {
  return useQuery<Drill[]>({
    queryKey: ['/api/drills'],
    queryFn: async () => {
      const res = await fetch('/api/drills');
      if (!res.ok) throw new Error("Failed to fetch drills");
      return res.json();
    },
  });
}

export function useCreateDrillScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { practiceId: number; score: { playerId: number; drillId: number; score: number; notes?: string } }) => {
      const res = await fetch(`/api/practices/${data.practiceId}/drill-scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.score),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create drill score");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/practices', variables.practiceId, 'drill-scores'] });
    },
  });
}

export type CreateDrillInput = {
  name: string;
  category: string;
  description?: string;
  targetStat?: string;
};

export function useCreateDrill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateDrillInput) => {
      const res = await apiRequest("POST", '/api/drills', data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create drill");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/drills'] });
    },
  });
}

// ============================================
// ACTIVE PRACTICE (LIVE MODE) HOOKS
// ============================================

export function useActivePractices() {
  return useQuery<Practice[]>({
    queryKey: ['/api/practices/active'],
    refetchInterval: 5000, // Poll every 5 seconds for live updates
  });
}

export function useStartPractice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { teamId?: number; title: string; duration: number; notes?: string }) => {
      const res = await apiRequest("POST", '/api/practices/start', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/practices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/practices/active'] });
    },
  });
}

export function useCheckInPlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { practiceId: number; playerId: number; attended: boolean }) => {
      const res = await apiRequest("POST", `/api/practices/${data.practiceId}/checkin`, { 
        playerId: data.playerId, 
        attended: data.attended 
      });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/practices', variables.practiceId, 'attendance'] });
    },
  });
}

export function useSetCurrentDrill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { practiceId: number; drillId: number | null }) => {
      const res = await apiRequest("PATCH", `/api/practices/${data.practiceId}/current-drill`, { 
        drillId: data.drillId 
      });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/practices', variables.practiceId] });
    },
  });
}

export function useEndPractice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { practiceId: number; notes?: string }) => {
      const res = await apiRequest("POST", `/api/practices/${data.practiceId}/end`, { 
        notes: data.notes 
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/practices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/practices/active'] });
    },
  });
}

// ============================================
// PLAYER ATTENDANCE SUMMARY HOOK
// ============================================

export function usePlayerAttendance(playerId: number) {
  return useQuery<PracticeAttendance[]>({
    queryKey: ['/api/players', playerId, 'attendance'],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}/attendance`);
      if (!res.ok) throw new Error("Failed to fetch player attendance");
      return res.json();
    },
    enabled: !!playerId,
  });
}

// ============================================
// OPPONENTS HOOKS (Scouting)
// ============================================

export type Opponent = {
  id: number;
  name: string;
  opponentType: string;
  position: string | null;
  tendencies: string | null;
  strengths: string | null;
  weaknesses: string | null;
  notes: string | null;
  createdAt: string;
};

export type CreateOpponentInput = {
  name: string;
  opponentType: string;
  position?: string | null;
  tendencies?: string | null;
  strengths?: string | null;
  weaknesses?: string | null;
  notes?: string | null;
};

export type UpdateOpponentInput = Partial<CreateOpponentInput>;

export function useOpponents() {
  return useQuery<Opponent[]>({
    queryKey: ['/api/opponents'],
    queryFn: async () => {
      const res = await fetch('/api/opponents');
      if (!res.ok) throw new Error("Failed to fetch opponents");
      return res.json();
    },
  });
}

export function useOpponent(id: number) {
  return useQuery<Opponent>({
    queryKey: ['/api/opponents', id],
    queryFn: async () => {
      const res = await fetch(`/api/opponents/${id}`);
      if (!res.ok) throw new Error("Failed to fetch opponent");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateOpponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateOpponentInput) => {
      const res = await fetch('/api/opponents', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create opponent");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/opponents'] });
    },
  });
}

export function useUpdateOpponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: number; updates: UpdateOpponentInput }) => {
      const res = await fetch(`/api/opponents/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.updates),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update opponent");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/opponents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/opponents', variables.id] });
    },
  });
}

export function useDeleteOpponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/opponents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete opponent");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/opponents'] });
    },
  });
}

// ============================================
// DRILL RECOMMENDATIONS HOOKS
// ============================================

export type DrillRecommendation = {
  id: number;
  playerId: number;
  drillName: string;
  drillCategory: string;
  reason: string;
  weakStat: string;
  priority: number;
  createdAt: string;
};

export function useDrillRecommendations(playerId: number) {
  return useQuery<DrillRecommendation[]>({
    queryKey: ['/api/players', playerId, 'drill-recommendations'],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}/drill-recommendations`);
      if (!res.ok) throw new Error("Failed to fetch drill recommendations");
      return res.json();
    },
    enabled: !!playerId,
  });
}

export function useGenerateDrillRecommendations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (playerId: number) => {
      const res = await fetch(`/api/players/${playerId}/drill-recommendations/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to generate drill recommendations");
      }
      return res.json();
    },
    onSuccess: (_, playerId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/players', playerId, 'drill-recommendations'] });
    },
  });
}

export function useDeleteDrillRecommendation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: number; playerId: number }) => {
      const res = await fetch(`/api/drill-recommendations/${data.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete drill recommendation");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/players', variables.playerId, 'drill-recommendations'] });
    },
  });
}

// ============================================
// ALERTS HOOKS
// ============================================

export type Alert = {
  id: number;
  playerId: number;
  alertType: string;
  title: string;
  message: string;
  severity: string;
  isRead: boolean;
  relatedGameId: number | null;
  createdAt: string;
};

export type AlertWithPlayer = Alert & {
  playerName?: string;
};

export function useAlerts(playerId?: number) {
  return useQuery<Alert[]>({
    queryKey: playerId ? ['/api/alerts', playerId] : ['/api/alerts'],
    queryFn: async () => {
      const url = playerId ? `/api/alerts?playerId=${playerId}` : '/api/alerts';
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch alerts");
      return res.json();
    },
  });
}

export function useUnreadAlerts() {
  return useQuery<Alert[]>({
    queryKey: ['/api/alerts/unread'],
    queryFn: async () => {
      const res = await fetch('/api/alerts/unread');
      if (!res.ok) throw new Error("Failed to fetch unread alerts");
      return res.json();
    },
  });
}

export function useMarkAlertRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/alerts/${id}/read`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to mark alert as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts/unread'] });
    },
  });
}

export function useMarkAllAlertsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/alerts/mark-all-read', { method: "POST" });
      if (!res.ok) throw new Error("Failed to mark all alerts as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts/unread'] });
    },
  });
}

export function useDeleteAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/alerts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete alert");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts/unread'] });
    },
  });
}

// ============================================
// PRE-GAME REPORT HOOKS
// ============================================

export type PreGameReportMatchup = {
  date: string;
  result: string | null;
  grade: string | null;
  // Basketball stats
  points: number;
  rebounds: number;
  assists: number;
  // Football stats
  passingYards: number;
  rushingYards: number;
  receivingYards: number;
  touchdowns: number;
  tackles: number;
};

export type PreGameReportScoutingReport = {
  name: string;
  tendencies: string | null;
  strengths: string | null;
  weaknesses: string | null;
};

export type PreGameReportCoachGoal = {
  title: string;
  targetType: string;
  targetValue: number;
  deadline: string | null;
};

export type PreGameReportData = {
  player: {
    id: number;
    name: string;
    position: string;
    team: string | null;
  };
  recentPerformance: {
    gamesPlayed: number;
    recentGrades: (string | null)[];
    // Basketball stats (optional)
    avgPoints?: string;
    avgRebounds?: string;
    avgAssists?: string;
    // Football stats (optional)
    avgPassingYards?: string;
    avgRushingYards?: string;
    avgReceivingYards?: string;
    avgTouchdowns?: string;
    avgTackles?: string;
  };
  opponentHistory: {
    matchups: PreGameReportMatchup[];
    totalGamesVs: number;
  };
  scoutingReport: PreGameReportScoutingReport | null;
  activeCoachGoals: PreGameReportCoachGoal[];
};

export function usePreGameReport(playerId: number, opponent?: string, sport: string = 'basketball') {
  return useQuery<PreGameReportData>({
    queryKey: ['/api/players', playerId, 'pregame-report', opponent || '', sport],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (opponent) params.append('opponent', opponent);
      params.append('sport', sport);
      const url = `/api/players/${playerId}/pregame-report?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch pregame report");
      return res.json();
    },
    enabled: !!playerId,
  });
}

// ============================================
// PLAYER REPORT CARD HOOKS
// ============================================

export type ReportCardBadge = {
  badgeType: string;
  earnedAt: string;
};

export type ReportCardSkillBadge = {
  skillType: string;
  currentLevel: string;
  careerValue: number;
};

export type ReportCardCoachGoal = {
  title: string;
  status: string;
  targetType: string;
  targetValue: number;
  coachFeedback: string | null;
};

export type ReportCardCoachNote = {
  content: string;
  noteType: string;
  authorName: string;
  createdAt: string;
};

export type ReportCardTrends = {
  pointsTrend: number;
  reboundsTrend: number;
  assistsTrend: number;
  hustleTrend: number;
} | null;

export type PlayerReportCardData = {
  player: {
    id: number;
    name: string;
    position: string;
    team: string | null;
    totalXp: number;
    currentTier: string;
  };
  seasonStats: {
    gamesPlayed: number;
    totalPoints: number;
    totalRebounds: number;
    totalAssists: number;
    totalSteals: number;
    totalBlocks: number;
    avgPoints: string;
    avgRebounds: string;
    avgAssists: string;
    avgHustle: string;
    avgDefense: string;
  };
  gradeDistribution: Record<string, number>;
  trends: ReportCardTrends;
  badges: ReportCardBadge[];
  skillBadges: ReportCardSkillBadge[];
  coachGoals: ReportCardCoachGoal[];
  recentCoachNotes: ReportCardCoachNote[];
};

export function usePlayerReportCard(playerId: number) {
  return useQuery<PlayerReportCardData>({
    queryKey: ['/api/players', playerId, 'report-card'],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}/report-card`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch report card");
      }
      return res.json();
    },
    enabled: !!playerId,
    retry: 2,
    retryDelay: 500,
  });
}

// ============================================
// COACH GOALS HOOKS
// ============================================

export type CoachGoal = {
  id: number;
  playerId: number;
  coachName: string;
  title: string;
  description: string | null;
  targetType: string;
  targetCategory: string;
  targetValue: number;
  deadline: string | null;
  status: string;
  coachFeedback: string | null;
  createdAt: string;
};

export type CreateCoachGoalInput = {
  playerId: number;
  coachName: string;
  title: string;
  description?: string | null;
  targetType: string;
  targetCategory: string;
  targetValue: number;
  deadline?: string | null;
  status?: string;
};

export type UpdateCoachGoalInput = Partial<{
  title: string;
  description: string | null;
  targetType: string;
  targetCategory: string;
  targetValue: number;
  deadline: string | null;
  status: string;
  coachFeedback: string | null;
}>;

export function useCoachGoals(playerId: number) {
  return useQuery<CoachGoal[]>({
    queryKey: ['/api/players', playerId, 'coach-goals'],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}/coach-goals`);
      if (!res.ok) throw new Error("Failed to fetch coach goals");
      return res.json();
    },
    enabled: !!playerId,
  });
}

export function useAllCoachGoals() {
  return useQuery<CoachGoal[]>({
    queryKey: ['/api/coach-goals'],
    queryFn: async () => {
      const res = await fetch('/api/coach-goals');
      if (!res.ok) throw new Error("Failed to fetch all coach goals");
      return res.json();
    },
  });
}

export function useCreateCoachGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCoachGoalInput) => {
      const res = await fetch('/api/coach-goals', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create coach goal");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/players', variables.playerId, 'coach-goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/coach-goals'] });
    },
  });
}

export function useUpdateCoachGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: number; playerId: number; updates: UpdateCoachGoalInput }) => {
      const res = await fetch(`/api/coach-goals/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.updates),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update coach goal");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/players', variables.playerId, 'coach-goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/coach-goals'] });
    },
  });
}

export function useDeleteCoachGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: number; playerId: number }) => {
      const res = await fetch(`/api/coach-goals/${data.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete coach goal");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/players', variables.playerId, 'coach-goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/coach-goals'] });
    },
  });
}

// ============================================
// WORKOUT HOOKS
// ============================================

export type Workout = {
  id: number;
  playerId: number;
  date: string;
  workoutType: string;
  title: string;
  duration: number;
  intensity: number | null;
  notes: string | null;
  videoUrl: string | null;
  metrics: string | null;
  createdAt: string;
};

export type CreateWorkoutInput = {
  playerId: number;
  date: string;
  workoutType: string;
  title: string;
  duration: number;
  intensity?: number | null;
  notes?: string | null;
  videoUrl?: string | null;
};

export function usePlayerWorkouts(playerId: number) {
  return useQuery<Workout[]>({
    queryKey: ['/api/players', playerId, 'workouts'],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}/workouts`);
      if (!res.ok) throw new Error("Failed to fetch workouts");
      return res.json();
    },
    enabled: !!playerId,
  });
}

export function useCreateWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateWorkoutInput) => {
      const res = await fetch('/api/workouts', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create workout");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/players', variables.playerId, 'workouts'] });
    },
  });
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: number; playerId: number }) => {
      const res = await fetch(`/api/workouts/${data.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete workout");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/players', variables.playerId, 'workouts'] });
    },
  });
}

// ============================================
// GOAL SHARING HOOKS
// ============================================

export type GoalShare = {
  id: number;
  goalId: number;
  sharedWithPlayerId: number | null;
  sharedWithTeamId: number | null;
  visibility: string;
  createdAt: string;
};

export type SharedGoalWithDetails = GoalShare & {
  goal?: {
    id: number;
    title: string;
    targetType: string;
    targetCategory: string;
    targetValue: number;
    completed: boolean;
  };
  sharedByPlayer?: {
    id: number;
    name: string;
    photoUrl: string | null;
  };
};

export type CreateGoalShareInput = {
  sharedWithPlayerId?: number;
  sharedWithTeamId?: number;
  visibility?: string;
  message?: string;
};

export function useShareGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { goalId: number; share: CreateGoalShareInput }) => {
      const res = await fetch(`/api/goals/${data.goalId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.share),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to share goal");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals', variables.goalId, 'shares'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shared-goals'] });
    },
  });
}

export function useGoalShares(goalId: number) {
  return useQuery<GoalShare[]>({
    queryKey: ['/api/goals', goalId, 'shares'],
    queryFn: async () => {
      const res = await fetch(`/api/goals/${goalId}/shares`);
      if (!res.ok) throw new Error("Failed to fetch goal shares");
      return res.json();
    },
    enabled: !!goalId,
  });
}

export function useSharedGoals() {
  return useQuery<SharedGoalWithDetails[]>({
    queryKey: ['/api/shared-goals'],
    queryFn: async () => {
      const res = await fetch('/api/shared-goals');
      if (!res.ok) throw new Error("Failed to fetch shared goals");
      return res.json();
    },
  });
}

export function useDeleteGoalShare() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/goal-shares/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete goal share");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shared-goals'] });
    },
  });
}

// ============================================
// ACCOLADES HOOKS
// ============================================

export function usePlayerAccolades(playerId: number | undefined) {
  return useQuery<Accolade[]>({
    queryKey: ['/api/players', playerId, 'accolades'],
    enabled: !!playerId,
  });
}

export function useCreateAccolade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ playerId, ...data }: { playerId: number; type: string; title: string; description?: string; season?: string; dateEarned?: string }) => {
      const res = await apiRequest("POST", `/api/players/${playerId}/accolades`, data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/players', variables.playerId, 'accolades'] });
    },
  });
}

export function useUpdateAccolade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, playerId, ...data }: { id: number; playerId: number; type?: string; title?: string; description?: string; season?: string; dateEarned?: string }) => {
      const res = await apiRequest("PATCH", `/api/accolades/${id}`, data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/players', variables.playerId, 'accolades'] });
    },
  });
}

export function useDeleteAccolade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, playerId }: { id: number; playerId: number }) => {
      await apiRequest("DELETE", `/api/accolades/${id}`);
      return { playerId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/players', result.playerId, 'accolades'] });
    },
  });
}
