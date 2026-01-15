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
