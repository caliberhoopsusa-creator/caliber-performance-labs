/**
 * Additive DDL for the CALIBER rarity columns on `players`.
 *
 * shared/schema.ts is out of sync with the live database, so `drizzle-kit push`
 * offers to DROP tables. Never run push here. ADD COLUMN IF NOT EXISTS rewrites
 * no rows and drops nothing.
 *
 * Run once:  npx tsx --env-file=.env script/create-rarity-columns.ts
 */
import { pool } from "../server/db";

async function main() {
  await pool.query(`
    ALTER TABLE players
      ADD COLUMN IF NOT EXISTS rarity_tier        text,
      ADD COLUMN IF NOT EXISTS rarity_percentile  integer,
      ADD COLUMN IF NOT EXISTS rarity_computed_at timestamp;
  `);
  // The nightly job and the leaderboard both read by cohort.
  await pool.query(`
    CREATE INDEX IF NOT EXISTS players_rarity_cohort_idx
      ON players (graduation_year, position);
  `);

  const { rows } = await pool.query(`
    SELECT column_name, data_type FROM information_schema.columns
     WHERE table_name='players' AND column_name LIKE 'rarity%'
     ORDER BY ordinal_position;
  `);
  console.table(rows);
  await pool.end();
}

main().catch(async (err) => {
  console.error("DDL failed:", err);
  await pool.end();
  process.exit(1);
});
