# CALIBER Design Language — "SIGNAL: Career Mode"

> The single source of truth for front-end design across all ~99 pages.
> Direction: **console sports-game UI** (PS2 grit → Xbox 360 gloss → Xbox One
> tiles — NBA Street / 2K MyCareer / EA menu-screen energy) built on
> broadcast-grade telemetry discipline. Basketball as a video game; getting
> scouted as career mode. Obsidian · Silver · Crimson. Dark-first. Honest.
>
> The fantasy: *you are the player in the game.* Your profile is your player
> card, your Caliber Score is your OVR, badges unlock like achievements, and
> recruiter interest fills like a career-mode scout meter. The discipline:
> every number is real — the video-game feel NEVER fabricates video-game data.

## 0. Who it must win

| Audience | What the design must say |
|---|---|
| Players (15–18) | "This makes me look pro." Share-worthy, cinematic, big numerals. |
| Coaches | "I can read this in 10 seconds." Density, scanability, zero toy-feel. |
| Recruiters | "This data is credible." Verified badges, tabular rigor, provenance. |
| Guardians | "This is trustworthy." Calm hierarchy, readable type, no dark patterns. |

The **coach-conversion path** (cold email → landing → public player profile →
share card) is the storefront. It gets flagship polish before anything else.

## 1. Principles

1. **Scoreboard hierarchy.** Every screen has ONE hero number or verdict.
   Everything else is supporting cast. If two things shout, both lose.
2. **Data is the decoration.** Sparklines, tier rings, stat strips, and grade
   ramps carry the visual interest. No gradient blobs, no stock illustrations.
3. **Depth by light, not shadow.** Elevation = a step up in surface lightness
   + a 1px silver-alpha border + (rarely) crimson glow. Film grain overlay on
   marketing surfaces only.
4. **Crimson is earned.** The accent marks: live states, personal records,
   CTAs, and the Caliber Score. Never decorative. If a screen is 10% crimson,
   it's 8% too much.
5. **Broadcast motion.** Numbers count up. Panels reveal with clip-path wipes.
   150ms/300ms, `--ease-out-expo`, compositor-only properties.
   `prefers-reduced-motion` → single static frame (HeroCanvas already models this).
   Engine roles: **anime.js** owns choreographed timelines (hero boot sequences,
   unlock/toast moments, staggered reveals); **framer-motion** owns
   scroll-triggered reveals. Never both on the same element. Both respect
   reduced-motion and animate transform/opacity/clip-path only.
6. **Honest surfaces.** Empty states guide ("Log your first game →"), never
   fake. No invented stats, ever, anywhere — including mockups.

## 2. Typography (the system)

**Three voices, three families — everything else gets deleted.**

| Voice | Family | Usage | Weights/axes |
|---|---|---|---|
| **Display** | **Archivo** (variable) | Page titles, hero numerals, scoreboard stats, section eyebrows | Width 62–125 + weight 100–900 from ONE variable file. Expanded Black (`wdth 125 / wght 900`, tight tracking, uppercase) for hero numerals & titles; Condensed Medium (`wdth 70 / wght 500`, `+0.18em` tracking, uppercase) for eyebrows/labels — the "jersey & ticker" voice. |
| **UI / Body** | **Geist** (keep) | All interface text, forms, paragraphs, tables | 400 / 500 / 600 only. `font-variant-numeric: tabular-nums` on every stat table. |
| **Data / Telemetry** | **JetBrains Mono** (keep) | Timestamps, stat readouts, jersey #s, "verified" hashes, HeroCanvas | 400 / 500 only. The "machine truth" voice — used sparingly, it *means* telemetry. |

**Delete:** Sora, Outfit, Inter, Barlow Condensed, Instrument Serif.
Archivo replaces Barlow Condensed (condensed labels) *and* Outfit/Sora
(display) with one file. Geist replaces Inter (they overlap ~entirely).

**Loading rules** (perf budget: ≤ ~130KB fonts total, from ~7 families today):
- Self-host via `@fontsource-variable/archivo`, `geist`, `@fontsource/jetbrains-mono`
  (kill the Google Fonts render-blocking link + third-party request).
- Preload exactly two files: Archivo variable + Geist regular. `font-display: swap`.
- Latin subset only.

**Type scale** (fluid, tokenized):
```css
--text-hero:    clamp(3rem, 1.2rem + 6vw, 6.5rem);   /* Archivo Expanded Black */
--text-title:   clamp(1.9rem, 1.2rem + 2vw, 3rem);    /* Archivo Expanded Bold */
--text-stat:    clamp(2.2rem, 1.4rem + 2.6vw, 4rem);  /* Archivo, tabular */
--text-section: 1.25rem;                               /* Geist 600 */
--text-body:    0.9375rem;                             /* Geist 400 */
--text-label:   0.6875rem;                             /* Archivo Condensed 500, caps, +0.18em */
--text-data:    0.8125rem;                             /* JetBrains Mono */
```

## 3. Color

Formalized three-scale system (all as HSL tokens; **no raw hex in components**):

```css
/* Obsidian — surfaces (elevation = lightness step, not shadow) */
--obsidian-0: 240 4% 3%;    /* page base (#070708 heritage) */
--obsidian-1: 240 4% 5.5%;  /* card */
--obsidian-2: 240 4% 8%;    /* raised card / popover */
--obsidian-3: 240 5% 11%;   /* highest (menus, sheets) */

/* Silver — text & lines */
--silver-hi:  220 14% 93%;  /* headlines */
--silver:     220 14% 82%;  /* body (heritage rim color) */
--silver-lo:  220 10% 58%;  /* secondary */
--silver-mute:220 8% 38%;   /* disabled/tertiary */
--line:       220 14% 82% / 0.14;  /* the 1px border everywhere */

/* Crimson — the signal */
--crimson:      356 85% 55%;  /* #E11D2A heritage accent */
--crimson-hot:  356 90% 65%;  /* hover/live */
--crimson-deep: 356 70% 40%;  /* pressed/atmosphere */
--crimson-glow: 356 85% 55% / 0.25;  /* the only permitted glow */
```

**Grade ramp** (fix: A and B are currently identical green):
A = `152 68% 48%` · B = `170 60% 45%` · C = `48 96% 53%` · D = `26 90% 55%` ·
F = `0 84% 60%` — plus **A+ = crimson-hot with glow** (a personal-record moment,
on-brand instead of generic green). Tier tokens (`--tier-*`) align to this ramp.

**Semantic:** success/warn/danger reuse the grade ramp values. Charts draw from
silver + crimson + grade ramp ONLY — data-viz is part of the system.

**Theme policy:** **Dark is the product.** One theme, tuned perfectly, instead
of two at 70%. The existing light `:root` block and DarkModeToggle are retired
from the app shell. Exception — **"Paper mode"**: print/PDF/export surfaces
(scouting reports, deal one-pagers) render light-on-white for coaches who print.

## 4. Space, shape, depth

- 4px base grid; section rhythm via `--space-section: clamp(3rem, 2rem + 4vw, 6rem)`.
- Radius: `6px` (inputs/chips) · `10px` (cards) · `14px` (modals/hero panels).
  Sharp-ish on purpose — instrument, not bubble.
- Borders over shadows: `1px solid hsl(var(--line))` on every surface step.
  Shadows only under floating layers (menus, dialogs), and they're black, soft, low.
- Grain: the film-grain overlay (HeroCanvas heritage) is a marketing-surface
  signature (landing, share cards, public profile hero). Never on dense app UI.
- MetalFx (liquid-metal buttons) = **primary CTAs only** — one per screen max.

## 4.5 The Console Layer (what makes it a game)

Era vocabulary — used structurally, never as pastiche (no pixel fonts, no
console logos/trade dress, no fake trophies):

- **The Lean.** Display type and hero panels get `skewX(-6deg)` (`.lean`
  utility) — the forward-speed italic every sports game used. Counter-skew
  inner text where readability demands.
- **Angled geometry.** Section headers, chips, tabs, and hero panels cut on
  4–8° diagonals via `clip-path` (the 360 "blade" sweep). Straight edges are
  for tables; angles are for identity moments.
- **Plastic-glass finish.** Cards in identity contexts get a 1px top-edge
  white gradient at low alpha (the PS2/360 gloss). Dense app tables stay matte.
- **OVR language.** The Caliber Score renders as an overall rating plate —
  big two-digit Archivo Expanded Black numeral in an angled shield — with
  attribute bars (2K-style category ratings from real stat splits) beneath.
- **Career Mode framing.** Recruiting surfaces speak the fantasy: Who's
  Watching = scout interest meter; Transfer Portal = free agency; season log
  = career timeline. Copy follows ("Season 3 · Game 12"), data stays real.
- **Achievement toasts.** Badge/XP unlocks pop as a full-width sweep toast
  ("BADGE UNLOCKED — Sharpshooter II") with the crimson glow. Real unlocks
  only; queue and rate-limit them.
- **Console focus states.** Controller-first UI made focus obvious — so do we:
  `:focus-visible` = 2px crimson ring + 2px offset on every interactive
  element. The retro move is also the accessibility win.
- **Loading screens, not spinners.** Skeletons carry rotating real tips
  ("TIP — verify your stat line within 24h so coaches see a ✓").

## 5. Signature components (the identity carriers)

| Component | Rule |
|---|---|
| `StatNumber` | Archivo Expanded Black, tabular, count-up on mount, label in Condensed caps under it. THE signature. |
| `OvrPlate` | The Caliber Score as a 2K-style overall: angled shield plate, leaned two-digit numeral, tier color. Hero of profile + share card. |
| `PlayerCard` | Gamertag-card identity block: name, position/#, school, OVR, badge row. One component reused on profile hero, share card, leaderboard rows, scout views. |
| `AttributeBars` | 2K-style category ratings (scoring/playmaking/defense/…) computed from REAL stat splits; angled bar caps; tier-ramp fills. |
| `AchievementToast` | "BADGE UNLOCKED" sweep for real badge/XP events; queued, rate-limited, reduced-motion = static banner. |
| `CaliberScore` ring | Existing tier ring — the crown jewel; identical rendering in-app and on share cards. |
| `SectionEyebrow` | Archivo Condensed caps + 24px crimson rule to the left. Replaces every ad-hoc section header. |
| `TelemetryStrip` | JetBrains Mono ticker row (last game, streak, rank delta) for hero areas. |
| `GradeBadge` | Grade ramp above; A+ gets the crimson-glow treatment. |
| `GuideCard` empty states | Existing pattern — every list/table empty state uses it. |
| Share card | Already ships the language (obsidian gradient, tier ring, wordmark) — it is the reference artifact for "how CALIBER looks." |

## 6. Rollout (phases = PR-sized, each ends with /design-review + screenshots at 320/768/1024/1440)

**Phase 0 — Foundation (everything depends on this)**
Self-hosted fonts, the token overhaul in `index.css` + `tailwind.config.ts`
(type scale, three color scales, grade-ramp fix, radius/space), the five
signature components, kill the 7-family Google Fonts link. *No page redesigns yet.*

**Phase 1 — The coach-conversion path (design as sales)**
Landing (align to tokens, keep HeroCanvas) → **PublicPlayerProfile** becomes
the **player card / career screen** (what a cold-emailed coach actually opens:
PlayerCard hero, OvrPlate, AttributeBars, verified provenance) → Dashboard
(the career-mode home; hero StatNumber, first-game CTA) → AnalyzeGame (the
"wow" moment — grade reveal as an unlock: count-up, tier flash, toast).

**Phase 2 — Competition surfaces:** Leaderboard, PlayersList, game log,
badges/XP — ranking drama, dense tables done right (tabular nums, sticky headers).

**Phase 3 — Social:** Feed, Stories, Polls, Messages, CommunityHub — calmer
obsidian, type-led; crimson only for live/unread.

**Phase 4 — Recruiting & long tail:** TransferPortal, Who's Watching, colleges,
settings/admin/guardian views — Paper-mode exports live here.

**Governance:** tokens only (no hex/arbitrary values in components) ·
one hero element per screen · every PR checks the component table above ·
`npx tsc --noEmit` + `npm run build` green (never `npm test` — live DB).

## 7. What we deliberately do NOT do

- No light app theme (Paper mode = print/export only)
- No new component library — shadcn primitives re-skinned by tokens
- No fabricated numbers in any design artifact, demo, or screenshot —
  the video-game *feel* never invents video-game *data*
- No animation of layout properties; compositor-only motion
- No per-page fonts, colors, or one-off "special" styles — the system is the style
- No pastiche: no pixel/8-bit fonts (wrong era), no PlayStation/Xbox/2K/EA
  logos, trade dress, or asset lifts — we evoke the era, we don't copy IP
- No juvenile skin on coach/recruiter/guardian surfaces: the console energy
  concentrates on player-facing screens; adult surfaces keep the telemetry
  discipline (angles and OVR language stay, gloss and toasts go quiet)
