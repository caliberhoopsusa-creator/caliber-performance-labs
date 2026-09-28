/**
 * Flip show_stats_to_coaches and show_contact_to_coaches to opt IN.
 *
 * The privacy policy states Caliber does not share player data with coaches or
 * recruiters "without your explicit action". Both columns defaulted to true,
 * which is opt out, so the stated promise and the schema disagreed.
 *
 * ALTER COLUMN SET DEFAULT rewrites no rows and drops nothing. The UPDATE
 * backfills existing rows so the promise is true for every player, not only
 * for ones created from now on. Safe here because there are no live users yet.
 *
 * Never run drizzle-kit push against this database. See CLAUDE.md.
 *
 * Run once:  npx tsx --env-file=.env script/flip-coach-share-defaults.ts
 */
import { pool } from "../server/db";

async function main() {
  await pool.query(`
    ALTER TABLE players
      ALTER COLUMN show_stats_to_coaches   SET DEFAULT false,
      ALTER COLUMN show_contact_to_coaches SET DEFAULT false;
  `);

  const updated = await pool.query(`
    UPDATE players
       SET show_stats_to_coaches   = false,
           show_contact_to_coaches = false
     WHERE show_stats_to_coaches IS DISTINCT FROM false
        OR show_contact_to_coaches IS DISTINCT FROM false;
  `);
  console.log(`backfilled ${updated.rowCount} player row(s) to opt in`);

  const { rows } = await pool.query(`
    SELECT column_name, column_default
      FROM information_schema.columns
     WHERE table_name='players'
       AND column_name IN ('show_stats_to_coaches','show_contact_to_coaches');
  `);
  console.table(rows);

  const check = await pool.query(`
    SELECT count(*) FILTER (WHERE show_stats_to_coaches)   AS stats_true,
           count(*) FILTER (WHERE show_contact_to_coaches) AS contact_true
      FROM players;
  `);
  console.table(check.rows);
  await pool.end();
}

main().catch(async (err) => {
  console.error("DDL failed:", err);
  await pool.end();
  process.exit(1);
});
