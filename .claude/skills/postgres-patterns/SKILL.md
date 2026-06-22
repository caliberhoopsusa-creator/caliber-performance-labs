---
name: postgres-patterns
description: Drizzle/Postgres conventions actually used in shared/schema.ts — indexing, the db:push vs migrate split, and how to add to a 116-table schema safely. Use when writing or editing anything in shared/schema.ts or migrations.
metadata:
  origin: adapted from Parcel's postgres-patterns skill, rewritten against Caliber's real schema.ts conventions
---

# Postgres Patterns (Caliber)

## The schema is one file, 116 tables, and growing
`shared/schema.ts` (~3,100 lines) is the single source of truth for the data model. Tables
are loosely grouped by feature with `// === SECTION ===` comments (not perfectly consistent).
Before adding a table, search for whether something close already exists — with this many
tables, duplication is a real risk (e.g. there are separate `badges`, `skillBadges`, and
`caliberBadges` tables — each serves a distinct, deliberate purpose, not redundant naming).

## Indexing convention
Tables that need lookups define indexes in the second argument to `pgTable`:
```ts
export const players = pgTable("players", {
  // ...columns...
}, (table) => ({
  userIdIdx: index("players_user_id_idx").on(table.userId),
  sportIdx: index("players_sport_idx").on(table.sport),
  usernameIdx: uniqueIndex("players_username_idx").on(table.username),
}));
```
Naming convention: `{table}_{column}_idx`, camelCase key matching that string. Use
`uniqueIndex` for anything that needs uniqueness (usernames, etc.), `index` otherwise.
Add an index for any new foreign-key-style column you expect to filter or join on —
several existing tables already do this for `playerId`/`userId`-shaped columns.

## Migrations: db:push is the dev workflow, not db:generate
There are only 4 files in `migrations/` despite 116 tables. That tells you `drizzle-kit push`
(`pnpm db:push`) — direct schema sync against the dev DB, no migration file generated — is
the dominant day-to-day workflow, not `db:generate` + `db:migrate`. Match whatever the most
recent real change in this repo did rather than assuming a clean migration-per-change
history exists to build on.

If you're told to ship something that needs an actual reviewable migration file (production
deploy, not local dev), use `pnpm db:generate` explicitly and say so — don't assume `db:push`
is fine for anything beyond local iteration.

## Sensitive/compliance columns — read before adding fields near them
`players` includes `dateOfBirth`, `minorDataPublic`, and `verifiedAthlete` /
`verificationMethod` for COPPA-style age handling, plus 9 separate visibility booleans
(`showEmail`, `showGpa`, etc. — see `privacy-and-roles` skill for what enforces them, which
is less than you'd hope). If you're adding a new player-data column that could be
sensitive for minors, ask whether it needs its own visibility flag rather than assuming an
existing flag covers it.

## Blast-radius check before any schema edit
Before changing or removing a column on an existing table:
```
grep -n "tableName\." server/storage.ts server/routes.ts shared/*.ts | grep "columnName"
```
With 116 tables and a single 19.8K-line route file, "just rename this column" can have
dependents in places you wouldn't guess from the table's apparent purpose alone.
