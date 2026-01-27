import { z } from 'zod';
import { insertPlayerSchema, insertGameSchema, players, games } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  players: {
    list: {
      method: 'GET' as const,
      path: '/api/players',
      responses: {
        200: z.array(z.custom<typeof players.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/players/:id',
      responses: {
        200: z.custom<typeof players.$inferSelect & { games: typeof games.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/players',
      input: insertPlayerSchema,
      responses: {
        201: z.custom<typeof players.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/players/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/players/:id',
      input: z.object({
        name: z.string().min(1).optional(),
        position: z.string().optional(), // Comma-separated positions for multi-position support
        height: z.string().optional(),
        team: z.string().optional(),
        jerseyNumber: z.number().optional(),
        photoUrl: z.string().optional(),
        bannerUrl: z.string().optional(),
        bio: z.string().optional(),
        openToOpportunities: z.boolean().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        school: z.string().optional(),
        graduationYear: z.number().optional(),
        widgetPreferences: z.string().optional(),
        gpa: z.number().min(0).max(4).optional(),
      }),
      responses: {
        200: z.custom<typeof players.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
  },
  games: {
    create: {
      method: 'POST' as const,
      path: '/api/games',
      input: insertGameSchema,
      responses: {
        201: z.custom<typeof games.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/games/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/games/:id',
      responses: {
        200: z.custom<typeof games.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    }
  },
  analytics: {
    leaderboard: {
      method: 'GET' as const,
      path: '/api/analytics/leaderboard',
      input: z.object({
        state: z.string().optional(),
        position: z.string().optional(),
        level: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.object({
          playerId: z.number(),
          name: z.string(),
          team: z.string().nullable(),
          jerseyNumber: z.number().nullable(),
          position: z.string().nullable(),
          state: z.string().nullable(),
          level: z.string().nullable(),
          avgPoints: z.number(),
          avgGrade: z.string(),
          gamesPlayed: z.number(),
        })),
      },
    },
    compare: {
      method: 'GET' as const,
      path: '/api/analytics/compare',
      input: z.object({
        player1Id: z.coerce.number(),
        player2Id: z.coerce.number(),
      }),
      responses: {
        200: z.object({
          player1: z.any(),
          player2: z.any(),
        }),
      },
    },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// ============================================
// TYPE HELPERS
// ============================================
export type PlayerInput = z.infer<typeof api.players.create.input>;
export type GameInput = z.infer<typeof api.games.create.input>;
