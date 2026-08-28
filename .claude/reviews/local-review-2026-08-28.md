# Local Review — uncommitted changes on `feat/role-lock-and-cleanup`

**Reviewed**: 2026-08-28
**Base**: e89ae4d
**Decision**: REQUEST CHANGES (2 HIGH, 0 CRITICAL)

## Summary

The landing rewrite from `scrolly/` to `call/` ("THE CALL") is coherent, well
documented, and typechecks/builds/tests clean. The two blockers are not in the
code — they are two untracked things sitting in the working tree of a **public**
repo that a `git add .` would publish. Below that, the main themes are a 244-line
component with no entry point, an orphaned `#join` anchor with no CTA pointing at
it, and zero test coverage on ~1,900 lines of new frontend code.

## Findings

### CRITICAL
None. No hardcoded secrets, no injection surface, no auth/authz changes.

### HIGH

**H1 — `nike-wemby/` is a nested git repo in the working tree, not ignored**
`nike-wemby/` (34 files, including its own `.git/`) is an unrelated project
sitting untracked at the repo root. `git add .` records it as a **gitlink** with
no `.gitmodules` entry — every subsequent clone gets an empty, permanently broken
directory, and `git status` stays dirty for everyone. Move it out of the tree, or
add `nike-wemby/` to `.gitignore`. (Scanned it for secrets: clean — the Netlify
function reads `ANTHROPIC_API_KEY` from env, and `config.js` still holds
placeholder contact values.)

**H2 — `script/coach-outreach/SOURCING-NOTES.md` is untracked lead research on a public repo**
The file is a sourcing dossier on 23 named, real high-school coaches: full names,
roles, schools, MHSA class, and the source URL for each — compiled for cold email
outreach. `.gitignore` already carries the deliberate rule
`# Coach outreach — never commit lead PII or send state` covering `leads.csv`,
`sent-log.json`, and `outbox/`. This file is the same category of data and is not
covered. The addresses themselves are not in it, but it does point at two
personal accounts ("publishes a yahoo.com address as his contact", "publishes a
gmail.com address"). `gh repo view` confirms **visibility: PUBLIC**. Add
`script/coach-outreach/SOURCING-NOTES.md` to the same `.gitignore` block.

### MEDIUM

**M3 — `CoachTeamReport` is dead on arrival, and it is the outreach fulfillment artifact**
`client/src/components/report/CoachTeamReport.tsx` (244 lines) and its `index.ts`
are referenced from nowhere — no route, no import, no test. The component itself
is good (immutable sort via `[...players].sort`, every value a required prop, no
placeholder data). But touch 1 of the outreach sequence promises "reply with the
stat sheet from your last game and I'll send back a graded report card for every
player within a day", and this is exactly that artifact — built, unreachable. Wire
it to a route (even an internal/authed one), or hold it out of the commit.

**M4 — `#join` is an orphan anchor; nothing on the page links to the waitlist**
`BeatCall.tsx:14` states "This beat owns the `#join` anchor that the footer and
any CTA point at." Nothing in `client/src` links to `#join`. The nav pill is
Pricing / Scout / Sign in; the footer is Pricing / Scout Hub / Sign In / Create
Account. On a page whose stated job is the waitlist, the only route to the form is
scrolling all four beats. Either add the CTA the docblock assumes, or drop the
claim and the id.

**M5 — `addTextCounter` writes DOM text React owns, and cleanup never restores it**
`lib/motion.ts` — `addTextCounter` sets `el.textContent = format(from)` (i.e. `"0"`)
synchronously when the effect runs, and `restoreFinalState` only removes inline
`opacity`/`transform`/`clip-path`/`stroke-dashoffset` — never `textContent`. In
`BeatGame` the effect deps are `[reduced, stats]`, and react-query hands back a new
`stats` object identity on every refetch (window focus, by default) even when the
numbers are identical. Each refetch tears down and rebuilds the timeline, forcing
the live counts to "0"; React will not repair it, because its vdom still holds the
correct value and sees no text change to commit. Recovery depends on anime's
`sync: true` observer re-syncing before paint. I did not reproduce this live — but
"0 Athletes on the platform" is the one failure mode that beat cannot afford, given
it ships a `Live platform numbers · never inflated` chip. Restoring `textContent`
in cleanup, or keying the effect on the scalar values rather than the object, closes
it cheaply.

**M6 — `components/call/*` still imports from `@/components/scrolly/shared`**
The changeset deletes nine of the ten files in `client/src/components/scrolly/`,
leaving `shared.tsx` as a lone survivor in a directory named after a story that no
longer exists. Four of the five new `call/` files import it. Move `shared.tsx`
into `call/` (or a neutral `components/scrollytelling/`) and delete the directory.

**M7 — no tests for ~1,900 lines of new/changed frontend code**
`tests/` is 12 files, all server-side (`npm test`: 129 passed, 2 skipped). There is
no `*.test.tsx` anywhere in the repo. This changeset adds `call/` (7 files),
`report/` (2), and `runHoverNudge` in `motion.ts`, all untested. That is a
pre-existing gap rather than a regression, but the 80% coverage rule applies to the
new code. At minimum: `CoachTeamReport` ranking/sort behavior and the reduced-motion
branch of `ScrollScene` are pure and trivially testable.

**M8 — the sticky beat stage clips on short viewports**
`scrolly/shared.tsx` pins each beat in `sticky top-0 h-screen ... overflow-hidden`.
`BeatDawn` now packs eyebrow + 132px mark + nameplate + headline + paragraph +
scroll cue into that pane (≈620px of content). On a landscape phone, a short
window, or with enlarged text, the overflow is clipped with no way to scroll to it.
Pre-existing mechanism, newly aggravated by how much beat 00 carries.

### LOW

- **L9** — `.scroll-cue-line` is defined in `Landing.tsx`'s `<style>` block but
  consumed only by `BeatDawn.tsx:132`. It works (the tag is global, not scoped),
  but the coupling is invisible: deleting the cue from Landing silently breaks a
  child component. Move the rule next to its user or into `index.css`.
- **L10** — `CourtGeometry` tags every stroke with `data-draw="0".."4"`, and the
  docblock says "the camera stages the draw in bands (floor first, then the key,
  then the rim) via a stagger". `CameraField` never reads the attribute — it
  selects `[data-draw]` and staggers in plain DOM order. It happens to match, so
  the visual is right and the comment is wrong.
- **L11** — `preflightSiteUrl` fetches the full page body with `GET`. `HEAD` with a
  `GET` fallback would do the same job without pulling the document.
- **L12** — `STATE_NAMES` covers 5 states and falls back to the raw postal code, so
  expanding `leads.csv` past those states silently reintroduces the exact
  "MT basketball programs" mail-merge tell the map exists to prevent. A warning on
  the fallback path would make the list expansion self-announcing.

## What is good

- `server/db.ts` — the `pool.on("error")` handler is correct and the comment
  explains the actual failure (unhandled `'error'` on an idle client kills the
  process). This fixes a real crash.
- `preflightSiteUrl` — blocking in live mode, advisory on dry runs, https-only,
  timeout-bounded. The right shape, and the README explains why.
- `{{siteUrl}}` / `{{stateName}}` tokens remove a hardcoded URL from three
  templates and fix the "MT basketball programs" mail-merge tell.
- `runHoverNudge` binds `focus`/`blur` alongside pointer events — the keyboard
  path is handled deliberately, and both listeners are bound directly on the
  trigger (these events don't bubble, so that placement matters).
- The `x`-on-`<svg>` gotcha is documented in `motion.ts` **and** at the call site
  in `Landing.tsx`. That is the kind of note that saves the next debugging session.
- `CoachTeamReport` sorts a copy, requires every value as a prop, and ships no
  placeholder data — consistent with the §7 no-fabricated-numbers rule.

## Validation

| Check | Result |
|---|---|
| Type check (`npm run check`) | Pass — clean |
| Lint | Skipped — no lint script in package.json |
| Tests (`npm test`) | Pass — 11 files, 129 passed, 2 skipped, 347s |
| Build (`npm run build`) | Pass — client 3m07s, server 1.3s (pre-existing >500kB chunk warning) |

## Files reviewed

Modified: `.gitignore`, `client/src/components/WaitlistForm.tsx`,
`client/src/lib/motion.ts`, `client/src/pages/Landing.tsx`,
`docs/DESIGN-LANGUAGE.md`, `script/coach-outreach/{README.md,send.ts,templates.ts}`,
`server/db.ts`
Deleted: `client/src/components/scrolly/` (9 files; `shared.tsx` retained)
Added (untracked): `client/src/components/call/` (8 files),
`client/src/components/report/` (2 files),
`script/coach-outreach/SOURCING-NOTES.md`, `nike-wemby/` (34 files)
