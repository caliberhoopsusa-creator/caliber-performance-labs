---
name: testing
description: Caliber testing conventions — Vitest + Supertest against the real Express app and a real Postgres test DB, cookie-based auth helpers, sequential (not parallel) execution. Use when writing or reviewing tests.
metadata:
  origin: adapted from Parcel's testing skill, but the underlying strategy is different — Caliber tests against the real app/DB rather than mocked providers, because Caliber has no provider-abstraction layer to mock against
---

# Testing (Caliber)

## This is integration testing against a real DB, not mocked-provider testing
Parcel's tests inject fake stores and mock providers because Parcel's architecture is built
around provider interfaces. Caliber doesn't have that shape — `IStorage`/`DatabaseStorage`
is the persistence seam, but there's no parallel mock-provider layer for AI/payments/etc.
Caliber's tests instead spin up the **real Express app** (via `registerRoutes`) against a
**real Postgres test database** and exercise it through `supertest`. This is intentional
and appropriate for this codebase's shape — don't try to introduce mocking as a "best
practice" without understanding why it isn't already there.

## Setup pattern (`tests/helpers/setup.ts`)
- `getTestApp()` — builds one shared Express app instance (routes registered once, memoized)
  for `supertest` to hit without binding to a real port.
- `extractCookies(res)` — pulls the `set-cookie` header into a string usable as a `Cookie`
  header on the next request, since auth here is session-cookie-based.
- `registerAndLogin(request, overrides?)` — registers a fresh test user (timestamped email
  like `test_${Date.now()}@caliber-test.dev` to avoid collisions) and returns whatever the
  test needs to act as that authenticated user.

New test files should reuse these helpers rather than reimplementing registration/login.

## Sequential execution is required, not incidental
`vitest.config.ts` sets `pool: "forks"`, `singleFork: true`, `fileParallelism: false`. This
is because tests share one real database — running them in parallel would let tests step on
each other's rows. If a test you're writing seems slow, the fix is a better test (smaller
setup, targeted assertions), not turning on parallelism.

## Conventions seen in existing test files (e.g. `tests/games.test.ts`)
- Use a per-file timestamp (`const TS = Date.now();`) to namespace test data so reruns don't
  collide with leftover rows from a previous run.
- Build payload fixtures as small helper functions (`basketballGame(overrides)`) rather than
  repeating full literal objects in every test case — easier to see what's actually varying.
- Import schema tables directly (`import { players, games, badges } from "../shared/schema.js"`)
  to assert on DB state after hitting an API route, not just on the HTTP response body. Several
  existing tests check both: the API response *and* the downstream DB effects (XP awarded,
  badge created, personal record updated) — because in this codebase a lot of game-logging
  side effects happen inside the route handler itself, not in a separate worker.
- `.js` extensions on relative imports even though the source is `.ts` — this is required by
  the ESM module resolution setup; don't "fix" these to `.ts`.

## What to test for a new route
Match the existing files' scope: one `describe`/file per resource area (`games.test.ts`,
`badges.test.ts`, `xp.test.ts`, etc.). For a new feature, the bar set by existing tests is:
register/login a real test user, hit the real route, assert both the response shape and any
expected downstream DB writes (badges, XP, feed activity, etc. — whatever your feature is
supposed to trigger).

## Running tests
```
pnpm test            # vitest run — one pass, needs DATABASE_URL pointing at a real test DB
pnpm test:watch       # vitest watch mode
pnpm test:coverage    # with coverage
```
Tests need a `.env` with a real `DATABASE_URL` — `vitest.config.ts` loads it manually via a
small dotenv parser, so it must be present and pointing at a database safe to write
throwaway test rows into (not production).
