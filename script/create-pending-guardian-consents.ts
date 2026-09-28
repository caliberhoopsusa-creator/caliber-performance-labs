/**
 * Additive DDL for the pending_guardian_consents table.
 *
 * shared/schema.ts is out of sync with the live database (it holds tables the
 * schema file does not declare), so `drizzle-kit push` offers to DROP them.
 * Never run push against this database. CREATE TABLE IF NOT EXISTS touches
 * nothing else, which is how waitlist_signups was added.
 *
 * Run once:  npx tsx --env-file=.env script/create-pending-guardian-consents.ts
 */
import { pool } from "../server/db";

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pending_guardian_consents (
      id             serial PRIMARY KEY,
      email          text NOT NULL,
      date_of_birth  date NOT NULL,
      guardian_email text,
      status         text NOT NULL DEFAULT 'pending',
      requested_at   timestamp DEFAULT now(),
      resolved_at    timestamp
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS pending_guardian_consents_email_idx
      ON pending_guardian_consents (email);
  `);

  const { rows } = await pool.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'pending_guardian_consents'
    ORDER BY ordinal_position;
  `);
  console.table(rows);
  console.log("pending_guardian_consents is ready.");
  await pool.end();
}

main().catch(async (err) => {
  console.error("DDL failed:", err);
  await pool.end();
  process.exit(1);
});
