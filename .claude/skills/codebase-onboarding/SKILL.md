---
name: codebase-onboarding
description: Come up to speed on Caliber fast — read order, layout, how to navigate a 19.8K-line route file and a 116-table schema, verify commands. Use at the start of a session or when unfamiliar with an area.
metadata:
  origin: adapted from Parcel's codebase-onboarding skill, rewritten for Caliber's actual (monolithic) shape
---

# Codebase Onboarding (Caliber)

## Read order (do this first)
1. `CLAUDE.md` — the hard rules, written for how this specific codebase actually works.
2. `replit.md` — product scope: what features exist, what they do, external dependencies.
3. `shared/schema.ts` (skim, don't read fully) — table names tell you what data model exists.

Do not try to read `server/routes.ts` top-to-bottom. At ~19,800 lines it's organized by
feature in rough order but the section comments (`// === NEWSFEED ===`, `// === FEED
REACTIONS ===`, etc.) are inconsistent in format. The fast way in is always:
`grep -n "your-route-path-or-keyword" server/routes.ts`.

## Layout
- `shared/schema.ts` — 116 Drizzle tables + Zod insert/select schemas. This is the data model.
- `shared/ai-rating-engine.ts` — the Caliber Grade scoring logic (peer-stat comparison).
- `shared/archetypes.ts` / `football-archetypes.ts` / `sports-config.ts` — per-sport config,
  position weighting, multi-sport switching.
- `server/storage.ts` — `IStorage` interface (the full list of every persistence operation
  the app supports) + `DatabaseStorage` (the only implementation). If you want to know
  "does the app already have a function for X," check the interface here first.
- `server/routes.ts` — every Express route. Find by grep, not by scrolling.
- `server/replit_integrations/` — vendored auth, Gemini chat, image, batch helpers. Treat as
  semi-stable glue; don't restructure casually.
- `server/services/sportsDataApi.ts` — ESPN / CollegeFootballData.com integration.
- `client/src/` — React app. `pages/` for routes, `components/` for shared UI,
  `components/ui/` for shadcn primitives, `hooks/`, `contexts/`, `lib/`.
- `tests/` — Vitest + Supertest, one real Postgres test DB, sequential (not parallel) runs.

## Where things plug in
- New persistence operation → add the method to `IStorage` in `server/storage.ts`, then
  implement it on `DatabaseStorage` in the same file. Don't call `db.*` directly from a route.
- New API route → find the nearest existing route serving the same resource/role and copy its
  auth-check + error-handling shape exactly (see `backend-patterns` skill).
- New table → `shared/schema.ts`, then check `backend-patterns` and `postgres-patterns` before
  writing the migration — 116 existing tables means cross-references are likely.
- Anything visible to Coach/Recruiter/Guardian roles → read `privacy-and-roles` first.
- Anything calling Gemini → read `ai-integration` first.

## Verify the whole thing
```
pnpm install
pnpm run check     # tsc, full typecheck
pnpm test          # vitest run — needs a real Postgres test DB, DATABASE_URL in .env
```
Tests run single-fork/sequential on purpose (see `vitest.config.ts`) because they share one
real database and would corrupt each other's state in parallel. Don't "fix" this to be
parallel without understanding why it's not.

## End of session
If there's a session log or changelog doc in this repo, append to it. If not, and the
session involved a non-obvious decision, consider adding one (ask the user first) — this is
exactly the kind of project where "why did we do it this way" gets lost in a 19.8K-line file.
