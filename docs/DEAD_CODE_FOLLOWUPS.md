# Dead code followups

Identified during the Section 1 pivot audit (`docs/PIVOT_AUDIT.md` section 9).
**Nothing here has been deleted.** This is the queue for a later cleanup pass.

Verified against every import form (`@/pages/X`, `./X`, `../pages/X`). An earlier
pass that matched only `pages/X` produced false positives; these are the
corrected lists.

## 1. Page components with no importer at all (24 files, ~12,900 lines)

| Page | Lines | Note |
|---|---|---|
| `client/src/pages/Stories.tsx` | 1066 | superseded by `StoriesContent.tsx` |
| `client/src/pages/CampShowcaseFinder.tsx` | 1063 | superseded by `CampShowcaseContent.tsx` |
| `client/src/pages/Shop.tsx` | 968 | see the broken `/shop` link below |
| `client/src/pages/FitnessDashboard.tsx` | 907 | superseded by `WorkoutsContent.tsx` |
| `client/src/pages/PracticeTracker.tsx` | 906 | coach surface, superseded by `PracticesContent.tsx` |
| `client/src/pages/FitnessContent.tsx` | 874 | superseded by `WorkoutsContent.tsx` |
| `client/src/pages/LiveGameMode.tsx` | 696 | unclear: `/api/live-game/*` is still live server side |
| `client/src/pages/OpponentScouting.tsx` | 680 | coach surface, superseded by `ScoutingContent.tsx` |
| `client/src/pages/MyRecruiting.tsx` | 656 | superseded by `MyRecruitingContent.tsx` |
| `client/src/pages/CommunityContent.tsx` | 615 | unclear: `CommunityHub.tsx` does not import it |
| `client/src/pages/TeamHub.tsx` | 596 | unclear what superseded it |
| `client/src/pages/TeamDashboard.tsx` | 548 | coach surface, superseded by `DashboardContent.tsx` |
| `client/src/pages/LineupAnalysis.tsx` | 538 | coach surface, superseded by `LineupsContent.tsx` |
| `client/src/pages/Newsfeed.tsx` | 475 | superseded by `FeedContent.tsx` |
| `client/src/pages/SocialHub.tsx` | 416 | superseded by `ConnectContent.tsx` |
| `client/src/pages/CoachEndorsements.tsx` | 389 | coach surface, superseded by `EndorseContent.tsx` |
| `client/src/pages/ScoutMode.tsx` | 321 | superseded by `ScoutHub.tsx` |
| `client/src/pages/CollegeRecruiting.tsx` | 293 | superseded by `CollegeRecruitingContent.tsx` |
| `client/src/pages/ShotChartPage.tsx` | 285 | unclear: shot chart APIs exist server side |
| `client/src/pages/landing-animations.tsx` | 245 | name suggests a helper module, not a page |
| `client/src/pages/WorkoutTracker.tsx` | 223 | superseded by `WorkoutsContent.tsx` |
| `client/src/pages/CoachVerify.tsx` | 61 | coach surface, superseded by `VerifyContent.tsx` |
| `client/src/pages/HomePage.tsx` | 46 | root of the orphan island below |
| `client/src/pages/CoachAlertsPage.tsx` | 30 | coach surface, superseded by `AlertsContent.tsx` |

Nine of these are coach or scout surfaces that are already dead by neglect.

## 2. Imported in `App.tsx` but never routed (6 files)

Reachable by nothing, still bundled.

`Leaderboard.tsx` (546), `Challenges.tsx` (601), `HighlightClipsPage.tsx` (328),
`TeamComparison.tsx` (255), `GradingSystem.tsx` (228), `ComparePlayers.tsx` (171).

## 3. Component orphans

- `client/src/components/sections/`: `FeatureGrid.tsx`, `GradientDivider.tsx`,
  `HeroLanding.tsx`, `TestimonialSlider.tsx` (478 lines). **Keep `CtaSection.tsx`**,
  it is live in `PricingPage` and `BlogPage`.
- `client/src/components/SignalBackground.tsx` to `ShaderField.tsx` to
  `@shadergradient/react`. Nothing imports `SignalBackground`.
- `client/src/components/gradients/ShaderGradientConfigs.ts` (281)
- `client/src/components/signal/PlasmaField.tsx` (185), exported but never rendered
- The orphan island: `pages/HomePage.tsx` to `components/Card.tsx`,
  `Section.tsx`, `Button.tsx`, `HeroGradient.tsx`, to `utils/createStyledComponent.ts`
- `client/src/hooks/useTokens.ts`
- `client/src/assets/` (entire directory, about 3 MB, nothing imports it)
- 24 of 58 components in `client/src/components/ui/`
- `client/src/styles/globals.css` is an empty stub still imported at `main.tsx:5`

## 4. Dependency orphans

Nothing imports `three` or `@react-three/*` anywhere. `next-themes` has zero
usages. `@tailwindcss/vite` is installed but never registered in `vite.config.ts`.
`@paper-design/shaders-react` is used only by two unused `ui/` components.

**Keep `metal-fx`**: unused by `ui/metal-button.tsx` but live in `pages/Dashboard.tsx`.

## 5. Server orphans

- `PATCH /api/auth/role` (`auth/routes.ts:51`) duplicates `POST /api/users/role`;
  the client only calls the latter.
- A second `GET /api/logout` is registered (`replitAuth.ts` and `auth/routes.ts`);
  last registration wins.
- `/challenge/:code`: `ChallengePage.tsx` never reads the route param, it uses
  `?p=`. Nothing generates such a link.

## 6. Not dead, do not delete

> `client/src/config/tokens.ts` looks dead but is load bearing.
> `tailwind.config.ts:2` imports it and maps its values onto the `amber-*` scale,
> used **147 times across 35 files**. Deleting it silently reverts all 147 usages
> to real Tailwind orange, and `tsc` catches none of it.

`server/replit_integrations/` is load bearing despite the name: it is the real
passport-local auth and the GCS object storage.

## 7. Bugs found alongside, not dead code

- `client/src/pages/PlayerDetail.tsx:326` links to `/shop`, but no `/shop` route
  exists in `App.tsx`. It 404s today. Player facing.
- `client/src/components/FloatingActionButton.tsx:46` reads
  `isPlayer ? playerActions : coachActions`, so recruiters and guardians are
  shown coach shortcuts.
- `client/src/components/Sidebar.tsx:360-387`: the coach branch is the `else`
  fallback, so any unrecognized role gets the coach mobile nav.
- `client/src/components/CaliberScore.tsx:112-123` renders an up/down delta arrow
  from a `delta` field no server route returns.
- `client/src/public/` holds five byte identical 664 KB icon files, plus a 664 KB
  `favicon.png` fetched on every page load and an 841 KB `og-image.png`.

## Family invite code needs a real secret (found during Section 7, 2026-09-25)

**Needs an operator decision. Details deliberately not written down here,
because this repository is public.**

The family invite code pair around `server/routes.ts:19339` derives its code
deterministically from values that are not secret, rather than from stored
randomness. It is short, and it is not rate limited. The code gates a guardian
link request against a minor's profile, so the bar should be higher than it is.

Section 7's claim tokens are the pattern to move to: 24 random bytes generated
at creation and stored on the row, so a code cannot be derived from anything a
third party can see or guess.

Not changed as part of Section 7 for two reasons. It is outside that section,
and rotating the scheme invalidates any code already issued, which is a product
decision rather than an engineering one. Raise it before the platform has real
guardians on it.
