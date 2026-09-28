# Application audit, 2026-09-25

What the main application actually looks like after five pivot sections, and what
still reads as the old coach-first build. Produced by an agent walking every
player-reachable route plus a direct trace of the grading path.

Scope: the player path only. Coach, recruiter and guardian surfaces are behind
flags (Section 2) and are not audited here.

---

## 1. The finding that matters most: film does not affect the grade

`POST /api/analyze-video` (`server/routes.ts:5572`) accepts a clip, base64s it,
sends it to Gemini, returns the analysis as JSON, and **writes nothing**. It does
not create a game, a stat line, or a grade. The uploaded file is deleted from
disk immediately after read.

`caliberGrade` (`shared/progression.ts:58`) is the mean of the per-game letter
grades. Its only input is `games.grade`, which comes from manually entered box
scores.

So the grade is **entirely a function of hand-entered box scores.** Film is a
separate, ephemeral AI commentary feature that never touches the number.

This collides with the Section 5 spec, which says the grade recalculates on
"new film, new games, coach cosign". The trigger is wired
(`routes.ts:11534` fires `recordGradeSnapshot(playerId, 'film_uploaded')` when a
highlight is created), but the recompute it triggers reads box scores, so the
number comes back identical unless a game was also logged. A player who uploads
film and sees their grade not move is seeing the truth; a player who is told film
moves their grade is being misled.

Three honest ways out, in order of cost:

1. **Say what is true.** Film is analysis, not input. Drop `film_uploaded` from
   the trigger list, or keep it recording the event but stop implying causation.
2. **Make film produce a stat line.** The Gemini prompt already asks for
   analytics; parse the response into a provisional box score the player confirms.
   That turns film into a real input and is the version the pivot promises.
3. **Full film-derived grading.** Out of scope for v1.

Recommendation: 1 now, 2 as a scheduled piece of work. Do not ship copy that says
film raises your grade until 2 exists.

## 2. Dead and broken on the player path

- **`/shop` 404s.** `Shop.tsx` exists and is fully built, the coin balance is in
  the header (`App.tsx:188-201`), `PlayerDetail.tsx:326` links to it, and no
  `<Route>` renders it. One line unlocks an entire finished feature.
- **`/debug` is reachable by every signed-in player.** It is in `SHARED_ROUTES`
  (`shared/roles.ts:60`) and dumps DB connectivity and college-match query state.
  Internal diagnostics shipped to end users.
- **Two leaderboards.** `/leaderboard` is the rebuilt `CaliberLeaderboard`;
  `/analytics?tab=leaderboard` still renders the legacy SIGNAL `LeaderboardContent`.
- **Two pricing pages at one URL.** Unauthenticated `/pricing` renders
  `PricingPage.tsx` (225 lines); authenticated `/pricing` renders `Pricing.tsx`
  (463 lines). Independent implementations of the same route.
- **Eleven route aliases for four destinations.** `/team-comparison`, `/compare`,
  `/challenges`, `/grading`, `/workouts`, `/college-recruiting`,
  `/camps-showcases`, `/social-hub`, `/feed`, `/newsfeed`, `/stories` are thin
  redirects into a tab of one of four hub pages.

## 3. SIGNAL residue on player surfaces

`tailwind.config.ts:91-97` maps the `amber-*` scale onto slate-blue hex, so every
`amber-` class on a player page renders the legacy SIGNAL palette.

Worst first:

| File | Player route | Legacy markers |
|---|---|---|
| `PlayerCard.tsx` | `/players/:id/card` | 5 `amber-*`, 3 raw hex, imports `components/signal/*` |
| `CanvasPage.tsx` | `/canvas` | 22 raw hex |
| `TransferPortal.tsx` | `/transfer-portal` | 16 raw hex, 2 `amber-*` |
| `FitnessContent.tsx` / `FitnessDashboard.tsx` | `/performance` | 16 raw hex each |
| `ScoutHub.tsx` | `/scout` | 5 raw hex |
| `ReelGenerator.tsx` | `/reel-builder` | 4 raw hex |

`PlayerDetail`, `PlayersList`, `AnalyzeGame`, `Dashboard`, `Leaderboard` and
`PublicPlayerProfile` also import `components/signal/*` directly.

`PlayerCard.tsx` is the sharpest collision: a fully legacy card view sitting at
`/players/:id/card` right next to its CALIBER replacement at
`/players/:id/caliber`. Redirect it the way `/leaderboard` was redirected.

## 4. The shell still frames the product as the old one

- **`StatsTicker`** takes a permanent full-width strip under the header to show
  four numbers the player's own card already carries, plus one global
  "TOP SCORER" line. A stock-ticker metaphor on a trading-card product.
- **`OnboardingTour.tsx`** steps 3, 4 and 6 sell "Connect with Players",
  "AI Video Analysis" and "Get Recruited". Copy still describes the coach-era
  product, and step 4 makes exactly the film-grades-you implication that §1 says
  is not true.
- **`Sidebar.tsx` and `MobileDrawer.tsx`** are ~400 and ~492 lines holding the
  same nav item lists, the same `NavItem`/`NavSection` shapes and the same
  localStorage key. Every nav change has to be made twice.
- **`/scout` is on the player nav** (`Sidebar.tsx:89`) and is opponent-scouting
  coach tooling. Either reframe it as scouting yourself or drop it.

## 5. What is genuinely good, and should not be touched

- `shared/roles.ts` is a clean, default-deny, well-commented route allowlist read
  by both client and server. It is the reason the pivot has a seam at all.
- `PlayerHome`, `CaliberLeaderboard`, `CaliberCardPage` and `GradePending` hold
  the line on the card metaphor and on honesty. `GradePending.tsx:1-11` explicitly
  refuses to fabricate a grade.
- The ticker, coin and notification data is live-computed from real games. None
  of it is mocked.

## 6. Ordered recommendations

Value over effort. The first four are each roughly a one-line change.

1. Decide what film means (§1) and make the copy match. Everything else here is
   cosmetic next to a product claim that is not true.
2. Route or remove `/shop`.
3. Gate `/debug` behind admin.
4. Redirect `/players/:id/card` to `/players/:id/caliber`, retiring `PlayerCard.tsx`
   to `DEAD_CODE_FOLLOWUPS.md`.
5. Point `/analytics?tab=leaderboard` at `/leaderboard`.
6. Pick one pricing page.
7. Reskin `CanvasPage`, `TransferPortal` and the Fitness pair to CALIBER tokens.
8. Rewrite the onboarding tour around the card and the grade.
9. Extract the nav item lists into one shared config consumed by Sidebar and
   MobileDrawer.
10. Decide whether `StatsTicker` and `/scout` belong on a player-first product.

None of these are scheduled. They are not part of Sections 6 to 8 and need your
call on ordering.
