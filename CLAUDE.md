# Caliber — global rules

Basketball (primary) / football player-analytics platform: roster + stat tracking →
position-weighted grading → gamification (XP/badges/streaks) → social feed → recruiting
(player ↔ college ↔ recruiter) → AI scouting (Gemini). Player/Coach/Recruiter/Guardian roles,
each with different visibility into the same player data.

**`replit.md` is the source of truth for product scope — re-read it if unsure what exists.**
**This file is the source of truth for HOW to work in the codebase — read it first, every session.**

## Reality check before you touch anything
This is **one Express monolith**, not a set of services. `server/routes.ts` is ~19,800 lines.
`shared/schema.ts` defines **116 tables** in one file. There is no `apps/` or `services/`
split like a fresh-scaffolded project might lead you to expect. Don't propose splitting it
into microservices unless explicitly asked — that's a multi-week migration, not a refactor.
Navigate routes.ts by its `// === SECTION ===` comment dividers (inconsistent formatting,
but present) and by searching for the route path string, not by reading top-to-bottom.

## Non-negotiables (hard rules)
1. **All data access through `IStorage`.** `server/storage.ts` defines the `IStorage` interface;
   `DatabaseStorage` is the only implementation. New persistence logic is a method on that
   interface + class, not a raw `db.query` call inlined in a route handler. (Caliber already
   has the same injected-store shape Parcel uses — it's just centralized in one file instead
   of a `packages/db` package. Don't "fix" that by extracting packages mid-task.)
2. **Privacy flags are opt-in per-route, not enforced globally.** `players` has 9 boolean
   visibility flags (`showEmail`, `showPhone`, `showSchool`, `showGpa`, `openToRecruiting`,
   `showStatsToCoaches`, `showContactToCoaches`, `showDetailedStatsToGuardians`,
   `showGradesToGuardians`). Nothing in the DB layer or middleware enforces them — each
   endpoint that returns player data to a non-owner role must check the relevant flag itself.
   See the `privacy-and-roles` skill before adding or editing any endpoint a Coach, Recruiter,
   or Guardian can hit.
3. **Auth check is per-route, not global middleware.** Routes call `isAuthenticated` and then
   manually re-check `req.user.claims.sub` against `authStorage.getUser(...)` inline. Copy the
   exact pattern from a neighboring route of the same role-requirement — don't invent a new
   auth-check shape.
4. **Schema changes are blast-radius events.** 116 tables, many cross-referenced (e.g. `players`
   is joined by games, badges, feed, recruiting, guardian links, college matches...). Before
   editing `shared/schema.ts`, grep `server/storage.ts` and `server/routes.ts` for every
   existing usage of the table/column you're touching.
5. **No secrets in source.** Real keys: `GEMINI_API_KEY` / `AI_INTEGRATIONS_GEMINI_API_KEY`,
   `STRIPE_WEBHOOK_SECRET`, `FITBIT_CLIENT_ID/SECRET`, `CFB_API_KEY`, `DATABASE_URL`,
   `SESSION_SECRET`. All via env, never hardcoded.
6. **Retry/backoff for Gemini calls is inline per-route, not a shared helper.**
   `/api/analyze-video` has real retry logic (3 attempts, exponential backoff, `AbortController`
   timeout) — but it's written inline in that one route, copy-pasted style, not a reusable
   function. Every other `ai.models.generateContent(...)` call site (scouting reports, etc.)
   has no retry at all — direct call, try/catch, 500 on failure. Don't assume retry exists
   elsewhere just because it exists in `/api/analyze-video`, and don't assume you need to
   build it from scratch if extending that specific route — check first.

## Stack
Node.js + Express (ESM). TypeScript. PostgreSQL + Drizzle ORM (`drizzle-zod` for validation).
React 18 + Wouter + TanStack Query on the client. Tailwind + shadcn/ui (New York style).
Replit Auth (session-based). Gemini AI (`@google/genai`) for video analysis + scouting reports.
Stripe for subscriptions. ESPN API / CollegeFootballData.com for live college data. Vitest +
Supertest for integration tests against a real Postgres test DB.
Verify: `pnpm run check && pnpm test`.

## Layout
```
shared/schema.ts      KEYSTONE: all 116 Drizzle tables + Zod schemas (read-mostly, blast-radius)
shared/ai-rating-engine.ts   Caliber Grade scoring logic
shared/archetypes.ts, sports-config.ts   sport-specific config (basketball/football)
server/storage.ts     KEYSTONE: IStorage interface + DatabaseStorage impl — the only DB seam
server/routes.ts      KEYSTONE: ~19.8K lines, every API route, grouped by // === SECTION ===
server/replit_integrations/   auth, chat (Gemini), image, batch — vendored Replit glue code
server/services/      sportsDataApi.ts (ESPN/CFB)
client/src/           React app — pages, components, hooks, contexts
tests/                 Vitest + Supertest integration tests, one real test DB, sequential runs
```

## Working in this codebase
- Before changing a route: find the existing route for the same resource/role and match its
  shape exactly (auth check, error handling, response shape). Consistency beats cleverness here.
- Before changing the schema: read the `postgres-patterns` skill.
- Before touching anything a Coach/Recruiter/Guardian can see: read `privacy-and-roles`.
- Before touching Gemini calls: read `ai-integration`.
- New session, unfamiliar area: read `codebase-onboarding` first.

## gstack (installed — use it)
gstack (Garry Tan's AI-eng-team skill pack) is installed at `~/.claude/skills/gstack`.
Prefer these skills over re-solving the same problems by hand.

- **Web browsing / QA / screenshots:** ALWAYS use the **`/browse`** skill (and `/qa`, `/qa-only`)
  for opening pages, testing URLs, and visual verification. **Never** use
  `mcp__claude-in-chrome__*` tools. `/browse` handles the WebGL/animation-canvas
  pages (like the landing) that make raw Playwright `networkidle`/stability waits hang.
- **Design quality:** `/design-review` (find slop, spacing, hierarchy, slow interactions),
  `/design-consultation`, `/design-shotgun`, `/design-html` — use for landing/UI work.
- **Code review & security:** `/review` (production bugs), `/cso` (OWASP + STRIDE — relevant
  given the per-route privacy flags).
- **Planning:** `/office-hours`, `/autoplan`, `/plan-ceo-review`, `/plan-eng-review`,
  `/plan-design-review`, `/plan-devex-review`, `/spec`.
- **Debug / ship / learn:** `/investigate` (root cause), `/ship`, `/land-and-deploy`,
  `/canary`, `/retro`, `/learn`, `/document-release`, `/document-generate`.
- Stay current with `/gstack-upgrade`. Full list: `office-hours, autoplan, plan-ceo-review,
  plan-eng-review, plan-design-review, plan-devex-review, devex-review, design-consultation,
  design-shotgun, design-html, design-review, review, ship, land-and-deploy, canary, benchmark,
  browse, connect-chrome, qa, qa-only, setup-browser-cookies, setup-deploy, setup-gbrain, retro,
  investigate, document-release, document-generate, codex, cso, careful, freeze, guard, unfreeze,
  spec, scrape, diagram, make-pdf, health, learn, gstack-upgrade`.
