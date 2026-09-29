/**
 * Additive DDL for grade_history (pivot Section 5).
 *
 * Append only record of every grade computation, so the card can show a real
 * 30 day trend instead of guessing one.
 *
 * Never run drizzle-kit push against this database. See CLAUDE.md.
 *
 * Run once:  npx tsx --env-file=.env script/create-grade-history.ts
 */
import { pool } from "../server/db";

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS grade_history (
      id           serial PRIMARY KEY,
      player_id    integer NOT NULL,
      grade        text NOT NULL,
      grade_value  integer NOT NULL,
      tier         text,
      computed_at  timestamp DEFAULT now(),
      trigger      text NOT NULL
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS grade_history_player_idx
      ON grade_history (player_id, computed_at);
  `);

  const { rows } = await pool.query(`
    SELECT column_name, data_type FROM information_schema.columns
     WHERE table_name='grade_history' ORDER BY ordinal_position;
  `);
  console.table(rows);
  await pool.end();
}

main().catch(async (err) => {
  console.error("DDL failed:", err);
  await pool.end();
  process.exit(1);
});
