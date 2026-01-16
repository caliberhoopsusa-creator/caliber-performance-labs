import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type PlayerInput, type GameInput } from "@shared/routes";

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

export type PlayerUpdate = {
  name?: string;
  position?: "Guard" | "Wing" | "Big";
  height?: string;
  team?: string;
  jerseyNumber?: number;
  photoUrl?: string;
  bannerUrl?: string;
  bio?: string;
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
