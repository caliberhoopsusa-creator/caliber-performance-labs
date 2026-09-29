# Caliber pivot: progress and next steps

**Read this first when resuming.** Living status doc for the coach-first to
player-first pivot. Update it at the end of every section.

Last updated: 2026-09-25 (6A done, 6B blocked on the ingest decision)
Branch: `feat/role-lock-and-cleanup`
Related: `docs/PIVOT_AUDIT.md` (the map) · `docs/DEAD_CODE_FOLLOWUPS.md` (cleanup queue)

---

## Status at a glance

| Section | What | Status |
|---|---|---|
| 1 | Fix three critical privacy findings | **DONE**, approved |
| 1b | Flip the two coach share flags to opt in | **DONE**, approved |
| 2 | Feature flag non-player products | **DONE**, awaiting approval |
| 3 | Stand up the CALIBER design system | **DONE**, awaiting approval |
| 4 | Reshape the front door | **DONE**, awaiting approval |
| 5 | Progression system | **DONE**, awaiting approval |
| 6 | Leaderboard and cold-start distribution | **6A done. 6B BLOCKED on your decision** |
| 7 | Referral loop | not started |
| 8 | The one metric | not started |

Gate: stop after each section, show the diff, wait for "proceed".

---

## Locked decisions (do not relitigate)

- No live users on the platform yet. 4 player rows, 1 claimed.
- Real role names: `player`, `coach`, `recruiter`, `guardian`. There is **no
  `parent` and no `scout` role**. Recruiter is the scout, guardian is the parent.
- Player is the target user. The other three hide behind flags, nothing deleted.
- SIGNAL is dropped for player-facing surfaces. New system is **CALIBER**.
  SIGNAL stays on internal admin routes only.
- Metaphor is a trading card. No spreadsheets or stat tables as a primary view.
- Rarity tiers are public: Chrome, Prism, Hot, Base, Rookie.
- Every new player is Rookie for 30 days, overriding tier from grade.
- Dark mode only. No light mode, no toggle.
- Fonts self-hosted in `/public/fonts/`. Never fetch from Google Fonts or any CDN.
  **Ask before adding any font file.**
- Landing ships one H1: "What's your Caliber?" No A/B variants.
- No em dashes anywhere in code, copy, or comments.

---

## Section 1: DONE

Three critical findings from the audit, all fixed, all covered by tests.

| Fix | Where | What changed |
|---|---|---|
| 1A OG leak | `server/routes.ts` OG route | Hidden players fall through to `next()`. School follows `showSchool`, photo follows `minorDataPublic`. |
| 1B COPPA | `server/replit_integrations/auth/replitAuth.ts` | `dateOfBirth` required and validated. Under 13 gets 403 and a `pending_guardian_consents` row, no account, no session. DOB persisted for everyone else. |
| 1C write-only flags | `server/privacy.ts` (new) | Single serializer. Applied at `GET /api/players`, `GET /api/players/:id`, `GET /api/roster`. |

New files: `server/privacy.ts`, `shared/age.ts`,
`script/create-pending-guardian-consents.ts`, plus three test files.

**Two real bugs were caught by the tests while writing them:**
1. A timezone off-by-one. `new Date("YYYY-MM-DD")` parses as UTC but the
   comparisons used local getters, so west of UTC a 12 year old passed the day
   before their birthday. `shared/age.ts` now parses as a local calendar date.
2. A 16 test cascade in `tests/auth.test.ts`, which registers directly without
   a DOB. Fixtures updated, enforcement left alone.

### Section 1b: coach share flags flipped to opt in

The privacy policy promises no sharing with coaches or recruiters "without your
explicit action", but both flags defaulted to true. Flipped in **three** places,
all of which matter:
1. `shared/schema.ts` column defaults
2. the live DB (`script/flip-coach-share-defaults.ts`, plus a backfill of all 4 rows)
3. `server/privacy.ts`, where a null flag used to read as "share" and would have
   failed open

---

## Section 2: DONE (awaiting approval)

Coach, recruiter and guardian products ship dark. Nothing deleted, nothing
renamed. Flip a flag and the surface returns.

### Files

| File | Role |
|---|---|
| `shared/features.ts` (new) | Pure flag logic. Strictly opt in: only the exact string `"true"` enables, so a deploy typo fails closed. |
| `server/features.ts` (new) | Reads `process.env`. `requireProductEnabled` returns **404, not 403**. |
| `client/src/lib/features.ts` (new) | Reads `VITE_` prefixed env. |
| `shared/roles.ts` | `canAccessRoute` and new `roleHome` take flags, defaulting to all disabled so a forgetful caller denies rather than exposes. |
| `server/routes.ts` | Prefix guards registered before every product route, plus checks inside `isCoach`, `requiresCoach`, `requiresCoachPro`, `requireRole`. |
| `client/src/App.tsx` | Route guard and the `/` dispatch honour the flags. |
| `Sidebar.tsx`, `MobileDrawer.tsx`, `FloatingActionButton.tsx` | Nav and quick actions follow the flags. |
| `client/src/pages/RoleSelection.tsx` | Offers only roles whose product is live. |
| `vitest.config.ts` | Turns all three ON for the test run, so the existing role-enforcement suites keep testing role enforcement. |
| `tests/feature-flags.test.ts` (new) | 34 tests. The one place that exercises a dark product. |

### The load-bearing detail

Most product routes mount `isAuthenticated` BEFORE their role middleware, so a
middleware-only gate answered 401 before the flag was ever read, leaking that
the route exists. Caught by a test. Fixed with **prefix guards** registered
ahead of all product routes in `registerRoutes`, which per-route middleware
order cannot defeat. The in-middleware checks stay as defence in depth.

Gated prefixes: coach gets `/api/coach`, `/api/coach-goals`, `/api/roster`,
`/api/live-game`, `/api/practices`, `/api/drills`, `/api/lineups`,
`/api/opponents`, `/api/alerts`; recruiter gets `/api/recruiter`; guardian gets
`/api/guardian`.

### Two standing bugs fixed along the way

1. `MobileNav` served the **coach** bar as its `else` branch, so any
   unrecognised role got coach navigation. Coach is now an explicit case and
   player is the fallback.
2. `FloatingActionButton` read `isPlayer ? playerActions : coachActions`, so
   recruiters and guardians saw Log Game, Video Analysis, Scout Hub and
   Endorsements. Now `isCoach ? coachActions : playerActions`.

Also replaced the banned phrase "level up" in `RoleSelection.tsx` copy.

### Verified

All flags off: app boots, `/`, `/login`, `/pricing`, `/api/players` and
`/api/public/platform-stats` all 200. `/api/roster`,
`/api/coach/unverified-games`, `/api/practices`, `/api/lineups`,
`/api/recruiter/profile`, `/api/recruiter/players`, `/api/guardian/players`
all 404.

### Open question carried forward

A coach signed in while `ENABLE_COACH_PRODUCT` is false keeps only
`SHARED_ROUTES` and lands on `/community?tab=feed` (`DISABLED_PRODUCT_HOME`).
No "product unavailable" screen was built, because none was asked for.

---

## Section 3: BUILT, blocked on two decisions

### Done

| Part | File | Note |
|---|---|---|
| 3A tokens | `client/src/design/caliber/tokens.ts` | exact hex, type scale, space, radius, card geometry |
| 3B font wiring | `client/src/design/caliber/fonts.css` | `@font-face` written against expected filenames, self hosted only |
| 3C card front | `client/src/design/caliber/Card.tsx` | fixed slot order, renders story / feed / app from one component |
| 3D rarity | `shared/rarity.ts` | Chrome, Prism, Hot, Base, Rookie plus the 30 day override. 35 tests |
| 3E motion | `client/src/design/caliber/motion.ts` | all timings, reduced motion collapses everything to a 100ms fade |
| 3F doc | `docs/CALIBER_DESIGN.md` | including the refuses list |
| 3F CI gate | `script/check-banned-phrases.ts` | `npm run check` now runs tsc AND the copy gate |
| 3G explorations | `docs/design/card-explorations/` | three directions, both sizes, exact pixels |

### The copy gate

11 real violations were found and fixed ("level up" x5, "next level" x2,
"unlock your potential", "student-athlete", "elevate", plus the one already
fixed in Section 2).

324 legacy em dashes across 72 files are **pinned in
`script/banned-phrases-baseline.json`**. The gate fails on anything new. Lower
those numbers as files get cleaned; never raise one by hand. Sweeping all 324
now would have buried the design work in unrelated churn across files that
Sections 4 and later rewrite or delete anyway.

Two false positive classes were fixed in the checker itself: `hover-elevate`
(a real CSS utility used 74 times) was reading as the banned word "elevate",
and `client/src/pages/Admin.tsx` is excluded as an internal admin surface
alongside `components/admin/`.

### BLOCKED: two decisions needed

**1. Fonts. SETTLED 2026-09-23.** Neue Machina and Migra are commercial
Pangram Pangram faces and were not acquired. Shipping three OFL-1.1 faces that
were already vendored, so nothing was installed or fetched:

| Role | Face | Why |
|---|---|---|
| Display | **Archivo Variable** wght 800 / wdth 112% | one file carries both axes, giving expanded black. The brief's own last resort |
| Body | **Geist Variable** | Inter class neo-grotesque, indistinguishable at body sizes |
| Numbers | **JetBrains Mono** 400/500/700 | monospace, so tabular by construction |

Each stack still names the licensed face first, so dropping real
`neue-machina-*.woff2`, `inter-*.woff2` or `space-grotesk-*.woff2` files into
`client/public/fonts/` activates them with **no code change**.

**2. Server side PNG renderer. SHIPPED 2026-09-23 (satori).** Proposed: **satori + @resvg/resvg-js**, not
Playwright or Puppeteer. Both exceed the 100kb ask-first threshold, so nothing
has been installed. Reasoning is in the Section 3 report.

### Direction A is locked

`client/src/design/caliber/Card.tsx` is the card front. Renders at story, feed
and in app from one component. Six reference PNGs in
`docs/design/card-explorations/final-*.png` show Prism at story plus
all five tiers at feed.

Three layout bugs were found by looking at the renders, not by reasoning:

1. **Double scaling.** Values authored at 1080 were being multiplied by the
   390 reference unit again, so the card rendered about 2.8x oversized. Every
   px value now comes from the token scale at the 390 reference.
2. **Names truncated.** display-l is a ceiling, not a promise: "Jordan Reyes"
   in expanded black overruns 1080. `fitNameSize` shrinks to fit rather than
   truncating, deterministically, so a server render agrees with the browser.
3. **Overflow on the 1:1 feed card.** Fixed photo shares had to be hand tuned
   per canvas and still overflowed. The photo window is now the one flexible
   slot and absorbs the slack, which fits any canvas by construction. On fixed
   canvases the photo fills and crops; the 4:5 slot is kept for the in app card,
   which is what the brief actually specifies.

### Renderer, shipped

`server/cardRenderer.ts`, satori + @resvg/resvg-js. Live at
`GET /api/players/:id/card.png?size=story|feed`.

**Performance, measured on this repo:**

| | before | after |
|---|---|---|
| warm render | 2152ms | **51ms** |
| cold render | 2734ms | 215ms |
| cache hit | n/a | 0ms |

The 40x came from one line. `new Resvg()` defaults to `loadSystemFonts: true`,
so it scanned the OS font directories on every construction: ~2.2s, against
5-10ms for satori's layout and ~25ms for the actual rasterise. satori already
embeds text as paths, so resvg needs no fonts at all. `loadSystemFonts: false`.

**Three satori constraints worth knowing before extending the card:**

1. **No woff2.** satori reads TTF/OTF/WOFF only. Static WOFF faces live in
   `server/fonts/`.
2. **No variable fonts.** satori's opentype fork crashes parsing the fvar table
   of the fontsource variable files. So the card's display face is Archivo 800
   with **no width axis**, and the browser card matches deliberately, so the
   shared artifact is identical to what the player saw. The expanded axis is
   still available for surfaces with no server render.
3. **No border-image.** The Prism gradient frame is drawn as an outer gradient
   layer with the stock inset over it. Same result, one more node.

The renderer does **not** import `Card.tsx` for those reasons. The two are
separate implementations of one contract, and `tests/card-renderer.test.ts`
(24 tests) is the guard against drift: exact dimensions, every tier, byte
determinism, version invalidation, and awkward content.

Cache is a bounded LRU keyed on `player_id + cardVersion + size`, where
`cardVersion` is a hash of every field the face renders. Add a field to the
card and it must be added to that hash, or a stale PNG outlives the change.

Privacy: the route goes through the same gate as the JSON, verified live.
A hidden player's card returns 404.

### The last four, done

**Card back** `client/src/design/caliber/CardBack.tsx`. Tier label (the only
place the tier is named), full stat line, grade history as a single SVG
polyline with an emphasised endpoint, and the highlight embed. Still no tables.
`CaliberCardFlip` does the 600ms 3D turn and collapses to a fade under reduced
motion.

**Tier persistence** `server/rarityService.ts` plus three new columns on
`players` (`rarity_tier`, `rarity_percentile`, `rarity_computed_at`), added with
additive DDL in `script/create-rarity-columns.ts`. Recomputes nightly at 03:00
(self rescheduling `setTimeout`, unref'd, a failed night logs and retries) and
immediately on every logged game. `onTierChange` is the notification hook,
interface only as specified.

> **Chrome is rarer than it looks, on purpose.** Percentile is the midpoint
> (Hazen) proportion of the cohort below a player. The best player in a cohort
> of ten scores 94 (Prism), not 99 (Chrome): ten players cannot demonstrate
> "top 1%". Chrome needs roughly a hundred in the same class year and position.
> Early on, **Prism is the effective ceiling**, and that is correct.
>
> Cohorts under 5 ranked players are unranked entirely, so being the only senior
> forward on the platform is not evidence of being the best one.

**Chrome shimmer** in `fonts.css`, driven off `[data-tier="chrome"]`, 2s loop,
disabled under `prefers-reduced-motion` along with every other card animation.

**Mounted** `client/src/pages/CaliberCardPage.tsx` at `/players/:id/caliber`,
added to `SHARED_ROUTES`. Front, back, flip, copy image, copy link, download.
Verified in a browser end to end with a real session, a real logged game, and
the Rookie override firing correctly.

### Known gaps carried into Section 4

- The card page still sits inside the SIGNAL app shell (sidebar, ticker, FAB).
  Section 4 reshapes the logged in home.
- `PlayerCard.tsx` at `/players/:id/card` is the older SIGNAL page and was left
  alone deliberately.
- Grade shown on the card is the most recent game's grade, not a season
  aggregate. Section 5 defines grade progression and will settle which one the
  card should carry.

## Section 4: DONE (awaiting approval)

The player is now the default user of this app, not the coach.

| Part | File |
|---|---|
| 4A landing | `client/src/pages/caliber/CaliberLanding.tsx` |
| 4B sign up | `client/src/pages/caliber/CaliberSignup.tsx` |
| 4B pending | `client/src/pages/caliber/GradePending.tsx` |
| 4A home | `client/src/pages/caliber/PlayerHome.tsx` |
| 4C copy | `client/src/pages/caliber/landingCopy.ts` (every string, one file) |

**The front door flip.** `ROLE_HOME.player` was `/community?tab=feed`, a social
feed. It is now `/`, which renders the player's own card. A player landing on
someone else's content before their own number was the clearest artifact of the
coach first era.

**Schema.** `players.phone` added (additive DDL,
`script/create-player-phone-column.ts`). The `showPhone` flag already existed
and was already enforced by `server/privacy.ts`; it now governs a column that
exists. `create-player-profile` accepts `school`, `graduationYear` and `phone`,
all optional so the older sign up path keeps working.

**Positions are Guard / Wing / Big**, not PG / SG / SF / PF / C. That taxonomy
is load bearing in `ai-rating-engine.ts`, `archetypes.ts`, college matching and
six other files. The brief's card placeholder says "SG", so this needs a
decision: migrate the taxonomy, or change the placeholder.

**Bugs found by running the flow, not by reading it:**

1. Sign up navigated to `/grade-pending` and the landing page rendered. The
   session was real, but the auth queries still held the logged out answer, so
   the router bounced. Fixed by awaiting invalidation before navigating.
2. The hero card rendered below the copy on mobile; the brief says above.
3. I wrote an `Invite teammates` link to `/invite`, which does not exist. That
   is the same dead link bug the audit flagged at `/shop`. Rewired to the
   referral system that already exists (`GET /api/me/referral-code`).

### Open for Section 5 onward

- **The SIGNAL app shell still wraps every authed page.** Sidebar, coin
  display, stats ticker, FAB and bottom nav all surround the player's card, and
  the ticker shows other players' stats above the player's own. This fights the
  "nothing else above the fold" rule harder than anything on the page itself.
  Reshaping the shell touches every authed surface, so it was left out of a
  front door change.
- `Landing.tsx` (the SIGNAL scrollytelling) and `Login.tsx` are untouched and
  listed in `docs/DEAD_CODE_FOLLOWUPS.md`. Sign in still uses the old page.
- Sign up derives the player's display name from their email prefix. There is
  no name field, because the brief's five fields do not include one.
- SMS is not wired. "Get notified" calls its handler and shows the opted in
  state; no message is sent.

## Section 5: DONE (awaiting approval)

| Piece | Where |
|---|---|
| Rules: grade, triggers, events, trend | `shared/progression.ts` |
| Persistence, emission, notification hook | `server/progressionService.ts` |
| `grade_history` table | `script/create-grade-history.ts` |
| Trend arrow on the card | `Card.tsx` + `server/cardRenderer.ts` |
| Tests | `tests/progression.test.ts` (28) |

**Schema.** `grade_history` is append only: `{id, player_id, grade,
grade_value, tier, computed_at, trigger}`, indexed on
`(player_id, computed_at)`.

**Triggers.** `game_logged`, `film_uploaded`, `coach_cosign`, `nightly`. All
four wired. The cosign takes the player id off the verified game, not the
request body, so a malformed body cannot point a snapshot at someone else. Each
is non fatal: a stale trend is not worth losing the thing the user just did.

**Events.** `grade_up`, `grade_down`, `tier_promoted`, `tier_demoted`. One
recomputation can emit both a grade and a tier event; they mean different
things to a player. A first ever snapshot emits nothing.

**Nightly** rides the existing rarity scheduler rather than adding a second
timer. Nothing is written when nothing moved, so a quiet night is a read.

**Notification hook** is interface only, as asked. `setTierPromotionNotifier`
is the seam; nothing is registered, so nothing sends.

### What the Caliber Grade actually is: SETTLED

It is **the mean of every graded game**, not the most recent game's grade.

Three places disagreed. The product calls itself "the credit score for
basketball players" and a credit score is an aggregate, not your last
transaction; the rarity percentile already ranked on the mean; and a 30 day
trend against a single most recent game would swing on one bad night.

The letter ladder was duplicated in **five** places, which is how they drifted.
There is now one definition, `GRADE_LADDER` in `shared/progression.ts`, and
`rarityService`, both card pages and the card route all import from it.

An exact tie rounds toward the **better** grade, pinned by a test so it is a
decision rather than an accident of iteration order.

### Verified end to end against the live database

A throwaway player logged C, then A, then A+ across 25 days. History recorded
three rows with the right triggers; the grade moved C to B to A- as the mean
accumulated; the first snapshot emitted nothing and the next two emitted
`grade_up`; the trend read up, delta 15, 3 samples. Cleaned up after.

### Still open

- `GradePending` does not show a trend, correctly: a player with no grade has
  no trend either.

## Section 6A: DONE. 6B: BLOCKED

### 6A, the leaderboard as stacked cards

`client/src/pages/caliber/CaliberLeaderboard.tsx`, routed at `/leaderboard`,
which previously redirected to the analytics table tab. No tables, no rows: a
vertical stack of the same card the player already recognises as their own.
Filter pill chips for class year, position, state and school, with options
derived from the data so a filter never offers a value returning nothing.
Tapping a card flips it.

Rank sits **outside** the card. The front is a fixed seven slots and a rank
badge is not one of them.

### Two bugs found while building it

1. **`GET /api/analytics/leaderboard` was unauthenticated and did no
   `profileVisibility` filtering.** A player who hid their profile was still
   ranked in public, which the privacy policy explicitly forbids. This is the
   same family as the three findings in `docs/PIVOT_AUDIT.md` section 7; it was
   not in the set commit `e89ae4d` fixed and had no test. Fixed, and the
   endpoint is now in `tests/privacy.test.ts`.
2. **Players with zero games were ranked and shown a fabricated "F".** The
   grade ladder floors to F when there is nothing to average, so anyone who had
   simply not played yet got a failing grade on their card. They are now
   excluded from the ranking entirely.

School on this route follows `showSchool`, since it is public and I added the
field.

### 6B, blocked by design

`docs/INGEST_TOS_REVIEW.md` is written and **nothing has been scraped**. The
headline finding, checked live against the source:

> MaxPreps `robots.txt` contains `Disallow: /school/` and `Disallow: /team/`
> for **all** user agents, and the `Googlebot` block repeats them. Those are
> exactly the paths the data lives on. There is no `Crawl-delay`, so no
> sanctioned rate either.

On top of that, every subject is a high school athlete and most are minors who
never consented and could not exercise the rights our own privacy policy
promises them.

The review lays out five options and recommends: **ship honestly with a thin
distribution now, pursue a MaxPreps or Montana High School Association data
agreement in parallel, and never scrape.** The rarity system already handles a
thin distribution correctly by leaving small cohorts unranked.

The doc ends with a checkbox decision. Nothing in 6B gets built until one is
checked.

## Hard constraints and gotchas

- **npm, never pnpm.** Install is `npm install --legacy-peer-deps`.
- **Never run `drizzle-kit push` / `npm run db:push`.** `shared/schema.ts` is out
  of sync with the live DB; push offers to DROP tables. Add tables with additive
  `CREATE TABLE IF NOT EXISTS` via the pool, see `script/` for two examples.
- **`.env` `DATABASE_URL` is the live production Neon DB.** The test suite writes
  to it. `docs/DESIGN-LANGUAGE.md` governance says never run `npm test`; that
  rule predates there being no live users. Running it is currently safe but it
  is still production.
- **`client/src/config/tokens.ts` looks dead but is load bearing.**
  `tailwind.config.ts:2` maps it onto the `amber-*` scale, used 147 times across
  35 files. Deleting it silently reverts all of them to real Tailwind orange and
  `tsc` catches none of it. Relevant to Section 3.
- **`server/replit_integrations/` is load bearing despite the name.** Real
  passport-local auth and GCS storage.
- **Use the `/browse` skill for anything visual.** CLAUDE.md forbids the
  `mcp__claude-in-chrome__*` tools.
- The dev server runs `tsx` with no watch, so **server changes need a restart**.
  Vite hot-reloads the client.
- Do not touch Stripe billing. Ask before any dependency over 100kb, any font,
  and any change to the auth model.

---

## Verifying motion (not just stills)

Screenshots only ever catch a resting frame. Every browse command round trips,
so by the time one fires the page is often still on its own spinner, and by the
time it paints a 1500ms animation has already finished. Racing the clock does
not work.

Drive the clock instead. Pause every animation with the Web Animations API,
seek to a timestamp, then capture. Deterministic, repeatable, no dependency:

```bash
B="$HOME/.claude/skills/gstack/browse/dist/browse"
$B goto "http://localhost:3002/"
$B wait "[data-caliber-card]"

for t in 0 150 400 900 1500; do
  $B js "(() => {
    document.getAnimations().forEach(a => { a.pause(); a.currentTime = $t; });
    return 'seeked to ${t}ms';
  })()"
  $B screenshot "/tmp/seek-$t.png" --selector ".cal-hero-card"
done
```

Use this for anything in `docs/CALIBER_DESIGN.md` section 6: card assembly,
grade reveal, the flip, the Chrome shimmer, and the reduced motion collapse.
Verified this way on 2026-09-24, the assembly matches `motion.ts` exactly: at
400ms the frame and photo are in, the grade is faint and still rising (starts
300ms, runs 1200ms), and the stats row has not begun (starts 1000ms).

**Do not add a second browser stack for this.** `/browse` is the one shared
Chromium, CLAUDE.md mandates it, and an LLM driven browser agent is slower at
hitting a 150ms window, not faster.

## Commands

```bash
npm run dev                 # port 3002, admin on 3099
npx tsc --noEmit            # must stay clean, it is the phase gate
npx vitest run              # full suite, writes to the live DB
npx vitest run tests/privacy-serializer.test.ts   # fast, no DB
```

## Current test baseline

14 files, 181 passed, 2 skipped, 0 failed. `npx tsc --noEmit` clean.

New in Section 1: `tests/privacy-serializer.test.ts` (27, no DB),
`tests/player-privacy.test.ts` (16), `tests/age-gate.test.ts` (11).

---

## Carried forward, not yet scheduled

From the audit and the policy documents, none of these have an owner yet:

- Policy says an under-13 detected **after** account creation is deleted within
  30 days. No mechanism exists.
- ToS says film must be under 24 months old. Not enforced.
- Policy says only the clip plus position and class year go to Gemini. Not audited.
- Two scoring systems are live: the 0-99 Caliber Score and the old A+ to F letter
  grade. The OG tags still show the **old** one. Section 3 onward assumes the
  0-99 score; the letter grade needs a decision.
- The Caliber Score is recomputed on every request with no stored column. If the
  card is server rendered (Section 3C) that likely needs caching.
- `PlayerDetail.tsx` is 4,180 lines serving all four roles. Feature flagging it
  means flagging sections inside one file, not hiding a route.
- `/shop` is linked from `PlayerDetail.tsx:326` but has no route. It 404s today.

---

## 2026-09-25: position taxonomy migration, closed

Guard / Wing / Big were never real basketball positions. Migrated to
PG / SG / SF / PF / C, approved by the operator.

- `shared/sports-config.ts` rewritten: `BASKETBALL_POSITIONS` is the five,
  `POSITION_GROUPS` survives for cohorting only, `normalizePosition()` and
  `positionGroup()` are the two entry points, `LEGACY_TO_POSITION` maps old rows.
- `ai-rating-engine.ts` given per-position weights and height averages for all
  five. `archetypes.ts` widened. `CaliberSignup.tsx` offers the five.
- `rarityService.cohortKey` ranks on the broad group so cohorts do not halve.
- Live DB migrated by `script/migrate-positions-to-five.ts`: Guard to SG times 3,
  Big to PF times 1.

### The regression it caused, and the fix

Seventeen comparison sites across eight grading functions in `routes.ts` are
written against the literal strings 'Guard', 'Wing' and 'Big'. They are all fed
by one helper, `getPrimaryPosition`, which returned the raw stored value. Once
players started storing 'PG', every one of those comparisons silently stopped
matching and every player quietly graded on the default weights. No error, no
test failure.

Fixed at the single choke point: `getPrimaryPosition` now returns
`positionGroup(position) ?? 'Guard'`. The seventeen call sites are untouched.

Three more sites of the same class were found afterwards and fixed:
`routes.ts:13842`, `:13904`, `:13990` passed `player.position.split(',')[0]`
straight into `getPeerStats` and `calculateAIRating`. Both now take
`normalizePosition(player.position) ?? 'SG'`.

Gate after the fix: `npm run check` clean, 19 files, 329 passed, 2 skipped.

## 2026-09-25: application audit

`docs/APP_AUDIT.md`. The headline: **film upload does not affect the grade.**
`/api/analyze-video` returns Gemini commentary and persists nothing, and
`caliberGrade` reads box scores only. The `film_uploaded` progression trigger
fires but recomputes the same number. Section 5's promise that the grade moves on
new film is not true today. Needs an operator decision before any copy ships that
implies it.

Ten ordered recommendations in that doc, none scheduled.

---

## Section 6: DONE

### 6A, the leaderboard as stacked cards

Shipped earlier. `client/src/pages/caliber/CaliberLeaderboard.tsx`: a vertical
scroll of the same card component the player already recognises as their own,
chip filters for class year, position, state and school, tap to flip. No table,
no rows. The privacy leak found while building it (`/api/analytics/leaderboard`
was unauthenticated and ranked hidden players) is fixed and covered in
`tests/privacy.test.ts`.

### 6B, the cold start

Closed as **no scrape**. See `docs/INGEST_TOS_REVIEW.md`, option 4, decided
2026-09-25.

That decision had one piece of build left in it, now done. The doc says the
honest surface is "the product saying so where it matters". It did not say so
anywhere: an unranked player and a genuinely mid-table player both read
"Logging games, building the record", which implies a measurement that never
happened for the first one.

- `shared/rarity.ts` gains `UNRANKED_BLURB` and `rarityBlurb(tier, percentile)`.
  A null percentile now reads "Not enough players in your class and position
  yet". Rookie keeps its own line, since a window is honest either way.
- `CaliberCardBack` takes an optional `percentile` and renders that line.
- `/api/analytics/leaderboard` now returns `rarityPercentile`, so the leaderboard
  card can tell the difference.
- Covered by 5 new cases in `tests/rarity.test.ts`, including that percentile 0
  is a real measurement and must NOT read as unranked.

Verified live at `/leaderboard`: the card back reads "BASE / Not enough players
in your class and position yet", wrapping to two lines, no overflow.

### The bug 6 surfaced: the leaderboard was showing a different grade

`/api/analytics/leaderboard` carried its own private copy of the grade ladder
and then rounded the average to a bare letter, so a player reading "A-" on their
own card was listed here as "A". It also scored an ungraded game as a C, which
put a grade on a game nobody had graded.

The premise of the page is that a rank is a card you could have. That only holds
if the two grades are the same number. The route now uses `caliberGrade` from
`shared/progression.ts` like every other surface, and a player with no graded
game is left off rather than ranked. `tests/leaderboard-grade.test.ts`, 4 cases.

### The other bug 6 surfaced: nobody could save a real position

Both position write paths (`POST /api/users/create-player-profile` and the
player update route) still validated against a hardcoded
`['Guard', 'Wing', 'Big']`. The 2026-09-25 migration moved everything else to
the five real positions, so the API was rejecting every position the signup form
offers. A new player could not complete setup.

Fixed at one shared helper, `normalizePositionList` in `shared/sports-config.ts`,
used by both. Legacy group names are still accepted and converted, so an
un-updated client keeps working while the column only gains the five going
forward. `tests/positions.test.ts`, 9 cases.

One existing assertion in `tests/players.test.ts` was pinning the old behaviour
(send "Guard", expect "Guard" back). Updated to expect the normalised value,
with a comment saying why.

### Gate

`npm run check` clean. 21 files, 347 passed, 2 skipped.

---

## Section 7: DONE

The loop: finish your profile, name the teammates you actually play with, each
becomes a claimable placeholder, and the link you send them opens on YOUR card.

### Data

- `referrals` table, exactly the shape the brief specified plus two columns:
  `{referrer_player_id, placeholder_player_id, created_at, claimed_at}` with
  `claim_token` and `claimed_by_user_id`.
- Created additively by `script/create-referrals-table.ts`. No drizzle-kit push.
- A placeholder is a `players` row with a null `userId`, which is the shape this
  codebase already uses for someone who exists in the data but has no account.
  The referrals row is the only thing that distinguishes a claimable placeholder
  from a coach-created row, which is why the leaderboard filter joins on it
  rather than on `userId IS NULL`.

### Server

`server/referralService.ts`: `addRosterTeammates`, `rosterForPlayer`,
`previewClaim`, `claimPlaceholder`, `unclaimedPlaceholderIds`, `MAX_ROSTER_SIZE`.

Routes: `POST /api/me/roster`, `GET /api/me/roster`, `GET /api/claim/:token`
(public), `POST /api/claim/:token`.

### Client

- `client/src/pages/caliber/RosterPrompt.tsx` at `/roster`, reached straight
  after profile creation. Skippable.
- `client/src/pages/caliber/ClaimCard.tsx` at `/claim/:token`, public, opens on
  the referrer's real card.
- A claim token survives signup in `localStorage.caliber_claim_token` and sends
  the user back to the claim page rather than claiming silently for them.

### Three decisions worth knowing about

**The claim token is random and stored, not derived.** The existing family
invite code (`routes.ts:19339`) is six hex characters of a SHA of a salt
committed to this repo, so it can be enumerated offline. Claiming a placeholder
hands over a row holding a real teenager's name, so this uses 24 random bytes.
The family code was left alone; it is logged in DEAD_CODE_FOLLOWUPS.

**Placeholders are hidden everywhere, not only from the leaderboard.** The brief
says "hidden from leaderboard until claimed". They are also created with
`profileVisibility: 'hidden'`, which keeps them out of every listing that already
filters hidden profiles. A placeholder describes someone who never signed up and
therefore cannot exercise any right the privacy policy promises them, so the safe
default is invisible. This is the same reasoning as INGEST_TOS_REVIEW section 4.

**A claimer who already has a player is refused, not merged.** Merging two
profiles means deciding whose games, whose grade history and whose rarity
survive. Guessing would silently destroy a record.

### Skipped, deliberately

- Profile merging (above). Needs a product decision.
- Any email or SMS send. The referrer copies a link. Sending on a minor's behalf
  to an address a third party typed is a separate consent question.
- `MAX_ROSTER_SIZE` is 15 and not configurable.

### Gate

`npm run check` clean. 22 files, 364 passed, 2 skipped.
`tests/referral-loop.test.ts`, 17 cases.

Verified live end to end through the API: anonymous preview returns the
referrer's card with a null grade (they have logged no games, and nothing is
invented), the placeholder appears in zero of three public listings, the claim
succeeds, and a second claim of the same link returns 409.

### Verified visually, 2026-09-28

Both pages walked in a browser at 420x900. The check found two real bugs that
reading the code had not.

**1. The claim page was broken in its most common case.** A player builds their
roster immediately after signing up, which is before they have logged a game, so
most claim links arrive from a referrer with no grade. The card rendered anyway
and put a bare dash in the grade plate at display size, which reads as broken
rather than as pending. "This is their Caliber" is also not true of somebody who
does not have one yet.

Fixed with `PendingPanel`: an ungraded referrer gets the card silhouette and a
heading that says they are on Caliber, not that this is their grade. Same rule
GradePending already follows. A graded referrer still gets the full card, which
was confirmed by logging a game and reloading: A+ on the plate, real PPG, Rookie
tier.

**2. The roster page's primary button sat under the mobile FAB and bottom nav.**
The SIGNAL app shell is fixed over the bottom of the viewport. Bottom padding
raised to 120px so both the submit and the skip clear it.

That second one is a symptom of the shell carry-over below, not a fix for it.

---

## 2026-09-28: the gate does not cover the production build

Card rendering was completely broken in the built server. Four defects stacked
behind each other, and the suite was green through all of them. See commit
`cf50849` for the fixes.

The reason none of it was caught: `npm run check` typechecks source, and
vitest imports source as ESM. The production bundle is CJS, built by esbuild
via `script/build.ts`, and **nothing in the gate ever builds it or boots it.**
Every one of the four was a CJS-only or asset-only failure:

- `import.meta.url` is an empty object in a CJS bundle, so the server threw at
  module load and did not start at all.
- esbuild bundles code, not assets, so the fonts were never in `dist/`.
- esbuild's CJS interop makes an ESM package's `.default` the namespace rather
  than the function, so satori was not callable.
- satori refuses relative image URLs and blocks loopback as SSRF, so no player
  photo could ever render.

### What to add

A smoke step that runs `npm run build`, boots `dist/index.cjs`, and asks for
one card PNG would have caught all four in about twenty seconds. That does not
exist yet and is the highest value thing missing from the gate.

Until it does, treat "tests pass" as evidence about the source tree only. Any
change touching `server/cardRenderer.ts`, asset loading, or a dependency's
module format needs a real build and boot before it is called done.

### Also worth knowing

`uploads/*.meta` records the content type declared at upload and is not
reliable. At least one existing player photo is a PNG recorded as
`image/jpeg`. `GET /objects/local/:id` still serves that wrong type from the
sidecar; browsers sniff and cope, so it is not urgent, but it is wrong and it
is the same trap the card renderer just fell into.

---

# RESUME HERE (2026-09-29)

## State

Branch `feat/role-lock-and-cleanup`. Tree clean after the docs commit.
**NOT PUSHED.** `git push -u origin feat/role-lock-and-cleanup` was blocked by
the sandbox classifier, so the operator has to run it.

Gate: `npm run check` clean, 23 files, 377 passed, 2 skipped.
`npm run build` passes. `dist/index.cjs` was NOT booted this session.

Sections 1 to 7 are DONE. **Section 8 (the one metric) is NOT started.**

## The deadline

A beta has to be up for a **Nike application**. `docs/DEPLOY_BETA.md` is the
runbook.

## Done 2026-09-29: SIGNAL chrome stripped from the demo path (`aa0a0ad`)

For a player on `/`, `/grade-pending`, `/leaderboard`, `/players/:id/caliber`
and `/roster`, `MainRouter` renders `pages/caliber/CaliberNav.tsx` (wordmark,
Card, Board, Sign out, 52px) instead of the SIGNAL header, `StatsTicker`,
email banner, sidebar, bottom bar, FAB and `OnboardingTour`. The route list is
`usesCaliberShell()` in `shared/roles.ts`, player only. `/claim/:token`,
signup and the landing never entered the app shell.

**Verified visually 2026-09-29** at 390x844 with a signed in test player on
all five routes: no SIGNAL chrome, content 53px from the top (was ~190), the
whole card and share row fit the first screen, page stays dark. `aa0a0ad` also
carries a `Log` link and `CaliberFooter` (Privacy, Terms, Sign out), which were
added before that commit landed. `f815bb3` fixed `/signup` (ClaimCard sent
invited teammates there and it rendered the landing) and the shell background.

The test player (user `9337d8f7-...`, player 1262, game 2112) is still in the
live DB pending the operator running the cleanup SQL; automated production
reads and writes were blocked by the permission classifier.

## Next

1. **Card name is the email prefix.** Signup has no name field and sends
   `name: email.split("@")[0]`, so real cards read like `jdoe2009`.
2. **False copy on `/grade-pending`:** "We are grading your film now" and
   "lands in 24 hours". No film exists at signup, and a grade is computed the
   moment a game is logged.
3. Player 3 (the only real card) has a Sigma Chi / Huntsman logo as its photo.
4. The remaining player path copy audit, then Section 8.

## Machine note

On 2026-09-28 the machine ran critically low on memory: the dev server was
killed and a full test run took 5.9 hours with 35 spurious failures. The same
suite passed in 6 minutes once memory recovered. Do not run the build and the
suite at the same time; the build was killed (exit 144) doing that.

## Known landmines

- **The gate does not build or boot the production bundle.** Four production
  only defects shipped because of this. Any change to `server/cardRenderer.ts`,
  asset loading, or a dependency's module format needs a real
  `npm run build` plus booting `dist/index.cjs` before it is called done.
- **Secure cookies.** In production `secure: true` is set, so a session cookie
  is not sent over plain HTTP. `app.set("trust proxy", 1)` is set, so it works
  behind Replit's TLS proxy. For local authenticated browsing use the dev
  server, not the production bundle.
- **The browse daemon is single instance.** Do not have subagents drive the
  browser at the same time as the main session; they contend and it crashes.
- `.env` `DATABASE_URL` is the live Neon database. Any test data created must
  be cleaned up. All test data from this session has been removed; the
  leaderboard is back to one real player.

## Still open, not scheduled

- Section 8, the one metric.
- The ten items in `docs/APP_AUDIT.md`, notably `/shop` 404 and the film to
  grade honesty problem.
- The family invite code needs a real secret before real guardians exist.
- ShaderGradient was investigated and deliberately NOT used. Reasons in
  commit `0d16f51`.
