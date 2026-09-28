/**
 * Migrate players.position from Guard / Wing / Big to PG / SG / SF / PF / C.
 *
 * Widening a broad bucket to a specific position is a GUESS, so each legacy
 * value maps to the middle of its old bucket:
 *
 *   Guard -> SG      Wing -> SF      Big -> PF
 *
 * Those players should be able to correct it, and with no live users on the
 * platform the blast radius is the handful of seed rows listed below.
 *
 * Reading code tolerates both taxonomies via normalizePosition(), so this is
 * about tidying stored data, not about unblocking anything.
 *
 * Never run drizzle-kit push against this database. See CLAUDE.md.
 *
 * Run:  npx tsx --env-file=.env script/migrate-positions-to-five.ts
 */
import { pool } from "../server/db";

const MAP: Record<string, string> = { Guard: "SG", Wing: "SF", Big: "PF" };

async function main() {
  const before = await pool.query(
    `SELECT id, name, position FROM players WHERE position IN ('Guard','Wing','Big') ORDER BY id`,
  );

  if (before.rowCount === 0) {
    console.log("No legacy positions left to migrate.");
    await pool.end();
    return;
  }

  console.log("Before:");
  console.table(before.rows);

  for (const [legacy, next] of Object.entries(MAP)) {
    const res = await pool.query(
      `UPDATE players SET position = $1 WHERE position = $2`,
      [next, legacy],
    );
    if (res.rowCount) console.log(`  ${legacy} -> ${next}: ${res.rowCount} row(s)`);
  }

  const after = await pool.query(
    `SELECT position, count(*) AS n FROM players GROUP BY position ORDER BY n DESC`,
  );
  console.log("After:");
  console.table(after.rows);
  await pool.end();
}

main().catch(async (err) => {
  console.error("Migration failed:", err);
  await pool.end();
  process.exit(1);
});
