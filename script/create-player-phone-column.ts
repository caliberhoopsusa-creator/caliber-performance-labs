/**
 * Additive DDL for players.phone (pivot Section 4B).
 *
 * Sign up collects a phone number for SMS grade delivery. The showPhone flag
 * already existed and was already enforced by server/privacy.ts, but it governed
 * a column that did not exist yet. Now it does.
 *
 * Never run drizzle-kit push against this database. See CLAUDE.md.
 *
 * Run once:  npx tsx --env-file=.env script/create-player-phone-column.ts
 */
import { pool } from "../server/db";

async function main() {
  await pool.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS phone text;`);
  const { rows } = await pool.query(`
    SELECT column_name, data_type FROM information_schema.columns
     WHERE table_name='players' AND column_name IN ('phone','show_phone');
  `);
  console.table(rows);
  await pool.end();
}

main().catch(async (err) => {
  console.error("DDL failed:", err);
  await pool.end();
  process.exit(1);
});
