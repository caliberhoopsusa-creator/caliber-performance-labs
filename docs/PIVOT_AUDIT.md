# PIVOT AUDIT — Caliber, coach-first → player-first

Read-only audit, 2026-09-22. Branch `feat/role-lock-and-cleanup`, clean tree,
`npx tsc --noEmit` passes. **No code was changed to produce this document.**

## Headline findings

1. **Four privacy flags are write-only.** `showEmail`, `showPhone`, `showStatsToCoaches`,
   `showContactToCoaches` are saved by the settings route and **read by nothing, anywhere.**
   The public flags *were* fixed (commit `e89ae4d`); the coach-facing ones never were.
2. **The OG route leaks hidden players.** `server/routes.ts:1507` emits any player's school
   and photo to anyone, including `profileVisibility: 'hidden'` players.
3. **The COPPA age gate is client-side theater.** `POST /api/register` never reads
   `dateOfBirth`. `users.dateOfBirth` is never written for any user.
4. **There is no `parent` or `scout` role.** The four are `player`, `coach`, `recruiter`,
   `guardian`.
5. **The pivot has one clean seam:** `shared/roles.ts` is a default-deny route allowlist read
   by *both* client and server.
6. **~30 page components are unreachable** (~12,900 lines with no importer, plus 6 more
   imported but never routed). About 9 are already-dead coach/scout surfaces.

---

## 1. Roles

**Account role** is `users.role` — `shared/models/auth.ts:27`. Canonical list,
`shared/roles.ts:10`:

```
USER_ROLES = ["player", "coach", "recruiter", "guardian"]
```

No `parent`, no `scout`. `recruiter` is the scout; `guardian` is the parent. The `'admin'` in
the column comment is stale — admin is an `ADMIN_PASSWORD` header check (`isAdmin`,
`routes.ts:20-45`) against a separate admin port, not an account role.

**Role is locked at signup.** `users.roleSelectedAt` is the real "has the user chosen?"
signal — `role` itself defaults to `'player'` in the live DB, so a new account reads as a
player before choosing anything. Only `PATCH /api/admin/users/:id/role` can change it.

### The coach-first bias, in one table — `shared/roles.ts:26-134`

| Role | Home | Routes | Character |
|---|---|---|---|
| `player` | `/community?tab=feed` | 29 | a social feed |
| `coach` | **`/`** | 24 (incl. `/coach/*`) | **owns the app root** |
| `recruiter` | `/recruiter` | 9 | narrow console |
| `guardian` | `/family` | 5 | narrowest |

Plus 13 `SHARED_ROUTES` all roles reach (`:37-50`).

The coach owns bare `/` and lands on `Dashboard.tsx`; every other role is redirected away as
a special case (`App.tsx:369-379`). **The player is the only role whose home is someone
else's content rather than their own data** — they never land on their score.

The bias is structural, not just routing:

- `components/Sidebar.tsx:360-387` — the **coach branch is the `else` fallback**, so any
  unrecognized role gets the coach mobile nav.
- `components/FloatingActionButton.tsx:46` — `isPlayer ? playerActions : coachActions`, so
  **recruiters and guardians currently see coach shortcuts** (Log Game, Endorsements).
  This is a live bug, independent of the pivot.

### Not the account role (do not confuse)

`messages.role` (`schema.ts:391`, Gemini chat) · `teamMembers.role` (:689) ·
`trainingGroupMembers.role` (:1462) · `mentorshipProfiles.role` (:1518) ·
`playerRatings.raterRole` (:1779) · `statVerifications.verifierRole` (:1818) ·
`leagueTeamRosters.role` (:2097) · `teamHistory.role` (:3005) · `players.rosterRole` (:51) ·
`waitlistSignups.role` (:3082 — marketing capture; its comment still says `'parent'`).

---

## 2. Onboarding and login

- **`POST /api/register`** — `server/replit_integrations/auth/replitAuth.ts:75-122`. Accepts
  `email`, `password` (min 8), `firstName`, `lastName`, `referralCode`. Does **not** set
  `role`/`roleSelectedAt`. Auto-logs-in; no email-verification gate.
- **`POST /api/login`** — `:125-134`, passport-local, `usernameField: "email"`. Both
  rate-limited at `server/index.ts:140-141`.
- **Role selection** — `pages/RoleSelection.tsx` (859 lines), gated on `!roleSelectedAt`
  (`App.tsx:288`). player → profile form; coach → org name + create/join team; recruiter →
  school + **`.edu` email required**; guardian → `GuardianOnboarding`.
- **Duplicates:** `POST /api/users/role` (`routes.ts:1925`, the one the client calls) and
  `PATCH /api/auth/role` (`auth/routes.ts:51`, unused). Also **two `GET /api/logout`
  handlers** (`replitAuth.ts:141`, `auth/routes.ts:131`) — last registered wins.

---

## 3. Surface inventory

98 page files. Classified by `ROLE_ROUTE_ACCESS` membership.

### Player-only
`ReelGenerator` (467) `/reel-builder` · `CanvasPage` (1290) `/canvas` · `RecruitingHub` (164)
`/recruiting` and its tabs `MyRecruitingContent` (782), `CollegeRecruitingContent` (313),
`CampShowcaseContent` (1065), `RecruitingGamePlan` (917), `DevelopmentRoadmap` (808) ·
`WhosWatching` (824) `/whos-watching`.

### Coach-only
`Dashboard` (908) `/` · `CoachHub` (176) `/coach/*` and its tabs `DashboardContent` (563),
`VerifyContent` (42), `EndorseContent` (366), `PracticesContent` (971), `LineupsContent`
(537), `ScoutingContent` (679), `AlertsContent` (10).

### Recruiter-only
`RecruiterDashboard` (1015) `/recruiter` · `PlayerDirectory` (377) `/discover/players` ·
`PublicRecruitProfile` (797) `/recruit/:id`.

### Guardian-only
`GuardianDashboard` (399) `/family`. **That is the entire guardian product.**

### Multi-role — do not force into one bucket
~35 pages, led by **`PlayerDetail.tsx` (4,180 lines), reachable by all four roles**, swapping
sections internally: `CoachGoals`, `ScoutView`, `RecruitingCard`, `GuardianLinkManager`,
`PreGameReport`, `DrillRecommendations`.

Also `CommunityHub` + tabs (`FeedContent` 2173, `StoriesContent` 1082, `PollsContent` 605,
`ConnectContent` 438, `DiscoverContent` 431, `MessagesPage` 454) · `PlayersList` (994, not
guardian) · `AnalyzeGame` (1086, player+coach) · `ScoutHub` (607, player+coach+recruiter) ·
`LeagueDetail` (1494) · `Highlights` (649) · `ReportCardPage` (233) · `TransferPortal` (404) ·
`CollegeDetail` (773).

### Public / unauthenticated
`Landing` (254) · `Login` (430) · `BlogPage` (292) · `PrivacyPage` (77) · `TermsPage` (84) ·
`PublicPlayerProfile` (1117) · `ChallengePage` (318) · `JoinPage` (94) · `not-found` (21) ·
`Admin` (1168 — password-gated ops console, outside the four roles).

### Role-specific components

| Audience | Components |
|---|---|
| Coach | `VerificationQueue` (178), `CoachGoals` (575), `CoachRecommendations` (773), `TeamRosterList` (159), `TeamBoard` (554, coach-only admin controls), `LivePractice` (721), `PreGameReport` (366), `DrillRecommendations` |
| Recruiter | `ScoutView` (565), `RecruitingCard` (358), `CollegeMatches`, `CollegeCompare`, `RecruitingTimeline` (202, borderline — player-authored) |
| Guardian | `GuardianLinkManager` (314), `GuardianOnboarding` (263) |
| Write-gated, read-open | `EndorsementSection` (`isCoach` gates the write, :69,125), `PlayerRatingsSection` (:244) |

No importer found for `GameVerificationCard` (219) or `ScoutReportCard` (453) — confirm
before treating as live.

### Navigation — what to hide first

`components/Sidebar.tsx:67-193` (desktop), `:360-387` (mobile bottom bar),
`components/MobileDrawer.tsx:36-66` (drawer). All read `userRole` from `App.tsx:342`.

- **player** — My Profile, Feed, Log Game · Recruiting, Who's Watching, Highlights, Reel
  Builder, Canvas Studio, Scout Hub · *More*: Performance, Analytics, Community, Stories,
  Video Analysis (pro), Discover, Find Recruiters, Schedule, League Hub, Teams
- **coach** — Dashboard, Players, Log Game, Coach Hub (pending-verification badge) · Report
  Cards, Video Analysis (pro) · *More*: Schedule, Scout Hub, Analytics, Community, League
  Hub, Teams, Discover. Plus a coach-only alerts bell (`Sidebar.tsx:212-216`).
- **recruiter** — Search Players, Bookmarks, Recruiter Directory, Player Directory · Discover
- **guardian** — Family Dashboard, Highlights

### Server routes (`routes.ts`, 20,039 lines)

- **Coach** — `requiresCoachPro` block at `:8026-10223` (`/api/practices`, `/api/drills`,
  `/api/lineups`, `/api/opponents`, `/api/alerts`, `/api/coach-goals`, ~42 routes);
  `requiresCoach` on `/api/endorsements`, `/api/recruit-posts/*`, `/api/players/:id/ratings`,
  verification routes; `isCoach` on `/api/players` POST/DELETE, `/api/roster`,
  `/api/live-game/*`, `/api/coach/recommendations`.
- **Recruiter** — `isRecruiter` on `/api/recruiter/*` (`:18019-18333`, `:19542+` CRM notes).
  Public but scout-oriented: `/api/recruiters/directory`, `/api/public/players/directory`.
- **Guardian** — `isGuardian` on `/api/guardian/request|players|players/:id/dashboard`
  (`:18765+`). ⚠️ But `/api/guardian/links/:id/approve|revoke`,
  `/api/players/:id/family-invite-code`, `/api/players/by-family-code/:code` are **only
  `isAuthenticated`**, with ownership checked inline — worth a security look in Section 2.
- **Shared / player** — `/api/players/*` (92 routes) is **not classifiable by prefix**: it is
  shared data with per-field visibility checks. Also `/api/games`, `/api/feed`,
  `/api/stories`, `/api/teams`, `/api/highlights`, `/api/workouts`, `/api/polls`, `/api/dm`,
  `/api/shop`, `/api/me`.
- **Needs product confirmation** — Caliber Badges (`:10223`), Athletic Metrics (`:10382`),
  Highlight Clips (`:11204`), League Playoffs/Rivalries (`:14962`), Fitbit (`:15996`),
  Training Groups (`:12295`), Mentorship (`:12522`).

---

## 4. The Caliber Grade

**Two scoring systems are live at once.**

| | Caliber Score (new) | Letter grade (old) |
|---|---|---|
| Source | `shared/ai-rating-engine.ts`, field `overallRating` | `games.grade` column |
| Scale | 0–99 | `A+`…`F` |
| UI | OVR plate / ring, "CALIBER SCORE" | `GradeCircle`, `GradeBadge` |
| Used on | `Dashboard`, `PublicPlayerProfile`, `PlayerDetail` | `PublicRecruitProfile`, `BeatFilm`, **the OG tags** |

**Not stored.** There is no `caliberScore` column on `players`. It is recomputed from raw
game rows on **every request**, in three routes that each call `calculateAIRating`
independently (`routes.ts:13447`, `:13564`, `:13635`). The `overallRating` column that does
exist is on `playerRatings` (:1782) — manual coach/scout evaluations, unrelated.

**Two competing score UIs:** `components/CaliberScore.tsx` (ring, on `PlayerDetail`) and
`components/signal/OvrPlate.tsx` (plate, on `Dashboard` and `PublicPlayerProfile`).
`OvrPlate`, `PlayerCard`, `AttributeBars` are **real and mounted**, not vaporware.

**Where a player sees their own score:** `Dashboard.tsx:426-436` (hero, above the fold) and
`PlayerDetail.tsx:2399` (profile header). But a player's home is `/community?tab=feed` —
**so they never land on it.**

**Dead UI:** `CaliberScore.tsx:112-123` renders a delta arrow from a field no route returns.

---

## 5. Shareability — real infrastructure, not yet a loop

### Works today
- `ShareCaliberScoreModal.tsx` renders at **1080×1920, 1080×1080, 1200×675**, rasterized
  **client-side** via dynamically imported `html2canvas` at `scale: 2`. Output is a PNG blob →
  download, or `navigator.share({files})` via the OS share sheet. Mounted at
  `Dashboard.tsx:485` and `PublicPlayerProfile.tsx:525`. Correctly renders nothing when the
  score is null/0 — the honesty rule holds.
- **Per-player OG tags are server-rendered.** `routes.ts:1504-1579` intercepts
  `GET /profile/:id/public` before the SPA catch-all, reads `index.html`, and string-replaces
  `<title>` and the `og:*`/`twitter:*` tags per player. Working link previews.

### Does not exist
- No Instagram Story intent anywhere. Other "Instagram" mentions are icon labels beside
  "download and share it manually" copy.
- No clipboard-image copy.
- **No server-side image rendering.**
- `og:image` is the player's raw photo or the generic site image — **never the score card**.
  A shared link preview does not show the grade.
- The OG description uses the **old letter grade**, not the Caliber Score, and duplicates the
  grade math inline (`GRADE_VALUES`, `:1518`) instead of calling the shared engine.
- `/recruit/:id` and `/discover/players` have **no per-page meta at all**.

---

## 6. Referral and roster — what to reuse

**Referral already exists on `users`** (`shared/models/auth.ts:42-44`): `referralCode`
(unique, 10 chars), `referredBy`, `referralConversions`. **There is no referrals table.**

Routes (`:1596+`): `GET /api/me/referral-code` (lazily generates),
`GET /api/referral/lookup/:code` (public), `POST /api/referral/track` (awards 500 XP, fired
after a referred user's first game, `:3276`). Covered by `tests/referral.test.ts`.

`/join/:code` → `JoinPage.tsx` (94 lines) stores the code in `localStorage.caliber_ref`;
`Login.tsx:22,96` reads and clears it on register. **`JoinPage` is generic marketing copy —
no referrer score, no player card.**

**The claim flow does not exist.** `players.userId` is nullable (`schema.ts:10`, "null for
coach-created players"), so coach-created players are already de-facto placeholders — but
there are zero matches for profile claiming across `routes.ts`/`schema.ts`.
`POST /api/users/create-player-profile` (`:2021`) *always* creates a new row and never links
an existing unclaimed one. Team-join-by-code is a **disjoint system**:
`POST /api/teams/:id/join` (`:6527`) always inserts `teamMembers.playerId: null`.

The nullable `players.userId` is the right hook; the linking logic is what is missing.

**Dead:** `/challenge/:code` — `ChallengePage.tsx` never reads the param (it uses `?p=`), and
nothing in the client generates such a link.

---

## 7. Privacy and minors

### 7a. Four flags are write-only
`showEmail`, `showPhone`, `showStatsToCoaches`, `showContactToCoaches` appear in exactly two
places: the column definitions (`schema.ts:32-38`) and the settings-save block
(`routes.ts:18506-18516`). **Nothing reads them.**

Enforced today (27 sites): `showSchool`, `showGpa`, `profileVisibility`,
`showDetailedStatsToGuardians` (:18978), `showGradesToGuardians` (:18979).
`openToRecruiting` is a search-ranking filter, not a privacy flag.

### 7b. The OG route leaks hidden players
`routes.ts:1507-1595` has **no `profileVisibility` check and no `showSchool` check**. It emits
`player.school` into `og:description` and `player.photoUrl` into `og:image` for any player id,
including hidden ones. Commit `e89ae4d` fixed the JSON endpoints and missed this one because
it renders HTML rather than JSON.

### 7c. The COPPA gate is client-side theater
`Login.tsx:81-86` computes `isUnder13` and disables submit (`:380`). But `POST /api/register`
destructures only `{ email, password, firstName, lastName, referralCode }` — **`dateOfBirth`
is silently discarded**, and `grep dateOfBirth server/` returns **nothing**. Therefore:

- `users.dateOfBirth` is never written for any user.
- The gate is bypassed by leaving the field blank (it is optional) or by calling the API
  directly.
- `users.consentVerifiedAt` and `guardianLinks.minorConsented` (`schema.ts:2970`) exist but
  nothing writes them at registration.

### 7d. Coverage
`tests/privacy.test.ts` (79 lines) covers only `showSchool`/`showGpa` and hidden-profile
exclusion. The four write-only flags, the OG route, the age gate, and the auth-only guardian
routes have **no coverage**.

---

## 8. Role enforcement — three generations, no choke point

Per `CLAUDE.md` non-negotiable #3, auth is per-route. Counts in `routes.ts`:

| Pattern | Count |
|---|---|
| `isAuthenticated` | 230 |
| `isAdmin` (password, not role) | 36 |
| `canModifyPlayer` | 20 |
| `isPlayerOrCoach` | 17 |
| `isCoach` | 16 |
| `isRecruiter` | 14 |
| inline `.role !== …` | 19 |
| `isGuardian` | 6 |
| `isPlayerOnly` | 4 |
| `isPlayer` | 2 |

Three coexisting styles: hand-rolled `isCoach`/`isPlayer` (`:60-88`), the `requireRole(...)`
factory (`:97-127`, with an `OWNER_USER_ID` bypass), and ~19 inline
`user.role !== 'coach' && user.playerId !== x` ownership checks.

**Implication for feature-flagging:** 404-on-flag-off is cleanest at the **middleware**
layer — `isCoach`, `isRecruiter`, `isGuardian`, `requireRole` covers 36+ routes centrally.
The ~19 inline checks need individual attention. `shared/roles.ts` covers the client in one
place.

**Flag precedent:** none exists, but `DISABLE_SUBSCRIPTION_GATE` /
`VITE_DISABLE_SUBSCRIPTION_GATE` is an established server+client env-var pair to copy.

---

## 9. Dead code (flagged, not deleted)

**24 of 98 pages have no importer at all — ~12,900 lines.** Verified against every import
form (`@/pages/X`, `./X`, `../pages/X`); a first pass missed relative imports and produced
false positives, so this is the corrected list:

`Stories` (1066) · `CampShowcaseFinder` (1063) · `Shop` (968) · `FitnessDashboard` (907) ·
`PracticeTracker` (906) · `FitnessContent` (874) · `LiveGameMode` (696) · `OpponentScouting`
(680) · `MyRecruiting` (656) · `CommunityContent` (615) · `TeamHub` (596) · `TeamDashboard`
(548) · `LineupAnalysis` (538) · `Newsfeed` (475) · `SocialHub` (416) · `CoachEndorsements`
(389) · `ScoutMode` (321) · `CollegeRecruiting` (293) · `ShotChartPage` (285) ·
`landing-animations` (245) · `WorkoutTracker` (223) · `CoachVerify` (61) · `HomePage` (46) ·
`CoachAlertsPage` (30).

**Second bucket — imported in `App.tsx` but never routed:** `Leaderboard` (546),
`ComparePlayers` (171), `GradingSystem` (228), `Challenges` (601), `TeamComparison` (255),
`HighlightClipsPage` (328). Reachable by nothing, but still bundled.

> **About 9 of these are already-dead coach/scout surfaces** — `CoachEndorsements`,
> `CoachVerify`, `CoachAlertsPage`, `OpponentScouting`, `ScoutMode`, `LineupAnalysis`,
> `PracticeTracker`, `TeamDashboard`, `TeamHub`. Part of the coach product is already off by
> neglect.

**Broken link, not dead code:** `PlayerDetail.tsx:326` links to `/shop`, but no `/shop` route
exists — it 404s today. Player-facing, worth fixing regardless of the pivot.

**Other orphans:** `components/sections/{FeatureGrid,GradientDivider,HeroLanding,TestimonialSlider}`
(478 lines; `CtaSection` **is** live) · `SignalBackground` → `ShaderField` →
`@shadergradient/react` · `gradients/ShaderGradientConfigs.ts` (281) · `signal/PlasmaField.tsx`
(185) · the island `pages/HomePage` → `components/{Card,Section,Button,HeroGradient}` →
`utils/createStyledComponent.ts` · `hooks/useTokens.ts` · `client/src/assets/` (entire
directory, ~3 MB) · 24 of 58 `components/ui/*` · `styles/globals.css` (empty stub, still
imported at `main.tsx:5`) · nothing imports `three` or `@react-three/*` · `next-themes` has 0
usages · `@tailwindcss/vite` is installed but never registered · duplicate
`PATCH /api/auth/role` and a second `GET /api/logout` · dead `/challenge/:code` param.

> ⚠️ **`client/src/config/tokens.ts` looks dead but is load-bearing.** `tailwind.config.ts:2`
> imports it and maps its values onto the **`amber-*`** scale, which is used **147 times
> across 35 files**. Deleting it silently reverts all 147 usages to real Tailwind orange, and
> `tsc` catches none of it.

**Asset weight:** `client/public/` holds **five byte-identical 664 KB icon files** plus a
664 KB `favicon.png` fetched on every page load, and an 841 KB `og-image.png`.

---

## 10. Where the pivot's seams are

| Goal | Seam | Why |
|---|---|---|
| Flip the front door | `shared/roles.ts:26-31` + `App.tsx:369-379` | Both sides read one table |
| Hide non-player UI | `ROLE_ROUTE_ACCESS` + `Sidebar`/`MobileDrawer`/`FAB` | Already default-deny |
| 404 non-player APIs | `isCoach`/`isRecruiter`/`isGuardian`/`requireRole` | 36+ central; ~19 inline stragglers |
| Player lands on their score | `App.tsx:369-379` + `Dashboard.tsx:426` | `OvrPlate` hero already built |
| Share card | `ShareCaliberScoreModal.tsx` | Both target sizes exist; server render is new |
| Referral loop | `users.referralCode/referredBy/referralConversions` | Working and tested; `JoinPage` is the gap |
| Claimable teammates | nullable `players.userId` | Column exists; linking logic does not |

---

## 11. Open questions

1. **Flag names** — match the code (`ENABLE_RECRUITER_PRODUCT` / `ENABLE_GUARDIAN_PRODUCT`)
   or keep the product names (`SCOUT` / `PARENT`)?
2. **Ordering** — the COPPA gap (7c) looks more urgent than the flag work. Pull it into
   Section 2?
3. **Two scoring systems** (§4) — does the pivot standardise on the 0–99 Caliber Score and
   retire the letter grade, or do both stay? The OG tags currently show the *old* one.
4. **Caching the score** — it is recomputed on every request with no stored column. If the
   card becomes the front door and is server-rendered, that likely needs a cached column.
5. **`PlayerDetail.tsx` is 4,180 lines serving all four roles.** Feature-flagging it means
   flagging *sections inside one file*, not hiding a route.
