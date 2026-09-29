/**
 * Additive DDL for referrals (pivot Section 7).
 *
 * One row per teammate a player added to their roster. The teammate is a
 * players row with a null user_id; this table is what makes it a claimable
 * placeholder rather than just an unlinked row.
 *
 * Never run drizzle-kit push against this database. See CLAUDE.md.
 *
 * Run once:  npx tsx --env-file=.env script/create-referrals-table.ts
 */
import { pool } from "../server/db";

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS referrals (
      id                     serial PRIMARY KEY,
      referrer_player_id     integer NOT NULL,
      placeholder_player_id  integer NOT NULL,
      claim_token            text NOT NULL,
      created_at             timestamp DEFAULT now(),
      claimed_at             timestamp,
      claimed_by_user_id     text
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS referrals_referrer_player_id_idx
      ON referrals (referrer_player_id);
  `);

  /* One placeholder belongs to exactly one referral, and a token must resolve
     to exactly one row, so both are unique rather than plain indexes. */
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS referrals_placeholder_player_id_idx
      ON referrals (placeholder_player_id);
  `);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS referrals_claim_token_idx
      ON referrals (claim_token);
  `);

  const { rows } = await pool.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'referrals'
    ORDER BY ordinal_position;
  `);
  console.log("referrals columns:");
  for (const r of rows) console.log(`  ${r.column_name}  ${r.data_type}`);

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
