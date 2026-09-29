import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000, // Neon serverless can take up to ~10s on cold start
});

// An idle pooled connection can drop at any time — Neon recycling it, or a
// local network blip (this has crashed the server with EADDRNOTAVAIL). pg-pool
// re-emits that on the pool, and with no listener Node treats the unhandled
// 'error' event as fatal and kills the process. Log it and carry on: pg has
// already discarded the bad client, and the next checkout opens a fresh one.
pool.on("error", (err) => {
  console.error("Postgres pool error on idle client:", err);
});

export const db = drizzle(pool, { schema });
