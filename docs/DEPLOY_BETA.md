# Deploying the beta

Written 2026-09-28 for the Nike application beta. Verified against the real
production bundle, not against the dev server.

## What the deploy actually runs

`.replit` is the config. Replit autoscale, and two lines matter:

```
build = ["npm", "run", "build"]
run   = ["node", "./dist/index.cjs"]
```

So the thing that ships is `dist/index.cjs`, the esbuild CJS bundle, plus
`dist/public` for the client and `dist/fonts` for the card renderer.

**That bundle did not boot at all until 2026-09-28.** Four separate defects,
all invisible to `npm run check` and to the test suite because both run
against source as ESM. Fixed in `cf50849`. The lesson is in
`docs/PIVOT_PROGRESS.md`: a green suite is evidence about the source tree, not
about the artifact that deploys.

## Before every deploy

Run this locally. It takes about a minute and it is the only thing that
exercises what actually ships.

```bash
npm run check                 # typecheck plus the banned phrase gate
npx vitest run                # the suite
npm run build                 # produces dist/
PORT=3011 node --env-file=.env dist/index.cjs
```

Then, against that running bundle:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3011/
curl -s http://127.0.0.1:3011/api/health
curl -s -o /tmp/card.png -w "%{http_code} %{size_download}\n" \
  "http://127.0.0.1:3011/api/players/3/card.png?size=story"
file /tmp/card.png     # must say PNG, not JSON
```

Expected: `200`, `{"status":"ok","db":"ok",...}`, and a PNG. Roughly 40 to
90 kB without a photo; a player with a photo renders larger (player 3 was
360 kB on 2026-09-29). A JSON body from the card endpoint means the renderer is broken again.

The card check matters more than it looks. It is the one endpoint that touches
the filesystem, an ESM only dependency, and an image decoder, so it is where
build level breakage shows up first.

## Environment

Set on the Replit deployment, not in the repo.

**Required.** The app does not work without these.

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Neon. The same database as dev today, which is worth changing before real traffic. |
| `SESSION_SECRET` | Sessions are stored in Postgres. |
| `PORT` | Replit sets this. Do not hardcode. |
| `NODE_ENV` | `production`. |

**Feature flags.** All three products stay off for the beta, which is what
makes it a player-first demo rather than a half-built four-role app.

| Variable | Beta value |
|---|---|
| `ENABLE_COACH_PRODUCT` | `false` |
| `ENABLE_RECRUITER_PRODUCT` | `false` |
| `ENABLE_GUARDIAN_PRODUCT` | `false` |
| `VITE_ENABLE_COACH_PRODUCT` | `false` |
| `VITE_ENABLE_RECRUITER_PRODUCT` | `false` |
| `VITE_ENABLE_GUARDIAN_PRODUCT` | `false` |

Only the exact string `true` enables a product. Anything else, including
unset, fails closed. So a missing variable cannot accidentally expose a coach
surface, which is the right way round.

**The `VITE_` half is baked in at build time**, not read at runtime. If you
ever flip one, you must rebuild. Flipping it on the running deployment does
nothing to the client.

**Optional.** Absent, each degrades rather than crashes.

`GEMINI_API_KEY` or `AI_INTEGRATIONS_GEMINI_API_KEY` (film analysis),
`ADMIN_PASSWORD` (the ops console on `ADMIN_PORT`, localhost only),
`SENTRY_DSN`, `CFB_API_KEY`, `FITBIT_CLIENT_ID` and `FITBIT_CLIENT_SECRET`.

`SKIP_STARTUP_SEEDS=true` skips the college and recruiting contact seeds. They
run after the port opens (since 2026-09-29; before that they held the port
closed for minutes against Neon), so leaving this unset on the deployment is
safe. Set it in local `.env` so dev restarts stop rewriting the live tables.

Stripe initialises through the Replit connector and logs a failure locally
because `X_REPLIT_TOKEN` is absent off platform. That is expected and does not
stop the server.

## What a visitor sees

Verified on the production bundle, flags off:

| Path | Result |
|---|---|
| `/` | The landing. Single H1, hero card, four example cards. |
| `/signup` | Sign up. |
| `/leaderboard` | Cards, not a table. Honest when thin. |
| `/claim/:token` | A teammate's claim link. |
| `/api/players/:id/card.png` | The shareable PNG. |
| `/api/practices` and other coach routes | `404`, as though the product does not exist. |

## Known gaps, so nobody is surprised

- **`/shop` 404s.** `Shop.tsx` is built and the coin balance is in the header,
  but no route renders it. See `docs/APP_AUDIT.md` item 2.
- **The SIGNAL app shell is gone from the player demo path** (`/`,
  `/grade-pending`, `/leaderboard`, `/players/:id/caliber`, `/roster`), which
  render with `CaliberNav` only (`aa0a0ad`). Every other signed in page still
  wears the SIGNAL shell.
- **Film does not affect the grade.** `/api/analyze-video` returns Gemini
  commentary and persists nothing. Do not say film raises your grade until
  that is true. `docs/APP_AUDIT.md` section 1.
- **The leaderboard is thin**, by choice. No scraped data. See
  `docs/INGEST_TOS_REVIEW.md`.
- **The family invite code needs a real secret** before real guardians exist.
  `docs/DEAD_CODE_FOLLOWUPS.md`.

## The database

`DATABASE_URL` currently points at the live Neon database, and local
development writes to it. Before the beta takes real signups, point the
deployment at its own database, or accept that local runs and real users share
one.

**Never run `drizzle-kit push` against it.** The schema is out of sync with the
live database and push offers to drop tables. Additive DDL scripts in
`script/` are the pattern.
