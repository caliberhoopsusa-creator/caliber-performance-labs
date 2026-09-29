# CALIBER Design Language

> The player-facing design system. Replaces SIGNAL on every player surface.
> SIGNAL remains on internal admin routes only.
>
> Metaphor: **a trading card**. Every player surface is a card, a card back, or
> cards compared.
>
> Emotion target: **recognition before comprehension**. "That's me" lands before
> "what does this number mean" does.

## 0. The one rule

If a surface makes a 16 year old want to screenshot it, it is working. If it
makes a coach want to export it, it is the wrong surface.

## 1. Colour

Exact hex. No substitutions.

| Token | Hex | Use |
|---|---|---|
| `--caliber-court` | `#0B0B0D` | default background |
| `--caliber-bone` | `#F5F1E8` | card stock, warm off white |
| `--caliber-red` | `#FF2D2D` | primary accent, grade reveals, Hot tier |
| `--caliber-gold` | `#E8B84A` | Chrome tier, A+ foil |
| `--caliber-violet` | `#7C4DFF` | Prism tier |
| `--caliber-steel` | `#6B7280` | Base tier neutral |
| `--caliber-chalk` | `rgba(245,241,232,0.14)` | borders, dividers |
| `--caliber-chalk-strong` | `rgba(245,241,232,0.28)` | emphasised borders |
| `--caliber-ink` | `#0B0B0D` | text on bone |
| `--caliber-fog` | `rgba(245,241,232,0.62)` | secondary text on court |

**Never** pure `#FFFFFF` or pure `#000000`.
**Never** the SIGNAL crimson `#e11d2a` on a player surface. CALIBER red is
`#FF2D2D` and it is a different colour.

## 2. Type

Mobile first, px.

| Step | Size | Leading | Tracking | Use |
|---|---|---|---|---|
| display-xl | 72 | 1.0 | -0.03em | the grade digit |
| display-l | 48 | 1.05 | -0.02em | card name, landing H1 mobile |
| display-m | 32 | 1.1 | -0.015em | section heads |
| display-s | 22 | 1.15 | -0.01em | subheads |
| body-l | 17 | 1.5 | 0 | |
| body-m | 15 | 1.55 | 0 | |
| body-s | 13 | 1.5 | 0.005em | |
| micro | 11 | 1.4 | 0.08em | uppercase labels |

Families: **Neue Machina** display, **Inter** body, **Space Grotesk** numbers
with `font-feature-settings: "tnum"`.

**Fonts are self hosted only**, from `/public/fonts/`. No `@import` from
`fonts.googleapis.com`, no Fontsource CDN, no external host of any kind. See
`client/src/design/caliber/fonts.css` for the exact filenames required.

## 3. Space and shape

Spacing scale, px: `2, 4, 8, 12, 16, 20, 24, 32, 44, 64, 96`. Nothing between.

Radius: `sharp 0`, `soft 4`, `card 14`, `pill 999`. **Cards use 14.**

**No drop shadows on cards.** Depth comes from the rarity treatment and the
card stock. There is deliberately no shadow token.

## 4. Rarity tiers

Public and named. Computed from percentile within **class year and position**,
not from a raw grade threshold.

| Tier | Cohort | Treatment |
|---|---|---|
| **Chrome** | top 1% | gold `#E8B84A` foil frame, 3px, animated shimmer sweep 2s loop |
| **Prism** | top 10% excluding Chrome | border gradient violet to red, 2px, static |
| **Hot** | top 30% excluding above | solid red `#FF2D2D` border, 2px |
| **Base** | middle band | bone card stock, chalk-strong border 1px |
| **Rookie** | first 30 days | chalk outline 1px dashed, ROOKIE tag micro top left |

**Rookie overrides tier from grade** for 30 days from account creation. After
that the tier recalculates from percentile. A brand new account has not played
enough tracked basketball for a percentile to mean anything, and landing a new
player on "Base" reads as a judgement rather than a start.

Tier is persisted server side, recomputed nightly and on any grade change.
Logic lives in `shared/rarity.ts` so client and server cannot disagree.

The shimmer respects `prefers-reduced-motion`.

## 5. Card anatomy

Slot order is fixed, top to bottom, **no exceptions**:

1. Rarity treatment (frame or foil, visual only, no text label on the front)
2. Player photo, tight crop face and shoulders, 4:5
3. Player name, display-l, 700, single line, truncate with ellipsis
4. Position, class year, school, micro, uppercase, comma separated
5. Grade digit, display-xl, dominant, centred, tabular
6. Two standout stats. Name in micro, value in Space Grotesk display-s
7. Caliber wordmark and profile URL, bottom right, micro, opacity 0.62

**Never on the front:** school logo, coach name, team record, highlight
thumbnail, share count, view count, badges.

**No charts, no bars, no meters.** Two numbers, plainly stated.

**The trend arrow** (added Section 5) sits beside the grade as a *modifier of
it*, not as an eighth slot. Up is `--caliber-red`, down is muted, and flat
renders **nothing**: an arrow saying "no change" is noise, and its absence
already says it. It is computed over 30 days from `grade_history`.

> Anything added to the card front must also be added to `cardVersion()` in
> `server/cardRenderer.ts`, or a cached PNG will outlive the change it should
> have invalidated.

Dimensions: story `1080x1920`, feed `1080x1080`, in app viewport width minus a
32px gutter with the photo slot holding 4:5.

The **card back** holds the full stat line, the highlight clip embed, grade
history rendered as a line (not a table), and the rarity tier label. The back is
the only place the tier is named.

Every rendered PNG is watermarked with the Caliber wordmark and the full profile
URL, bottom right.

## 6. Motion

| Moment | Timing |
|---|---|
| Grade reveal | counts up over 1.2s, ease-out cubic, **first render only** |
| Card assembly | rarity 150ms, photo 200ms at 100ms, grade 1200ms at 300ms, stats 200ms at 1000ms. Total 1500ms |
| Card flip | 3D transform, 600ms, ease-in-out |
| Tier promotion | full viewport takeover 2.5s, frame draws around the card, `navigator.vibrate` 10ms twice where supported |

`prefers-reduced-motion` replaces **every** one of these with a 100ms opacity
fade. This is a hard rule. The audience is teenagers on phones, and a vestibular
trigger on the one screen they came to look at is not a fair trade for polish.

Compositor safe properties only: `transform`, `opacity`, `clip-path`. Never
`width`, `height`, `top`, `left`, `margin` or `font-size`.

**Verifying motion.** A screenshot only catches a resting frame. Pause every
animation with `document.getAnimations()`, set `currentTime` to the moment you
want, then capture. See "Verifying motion" in `docs/PIVOT_PROGRESS.md` for the
exact commands. Check the reduced motion collapse the same way.

## 7. CALIBER refuses

- Tables of stats as primary views
- Coach facing language on player surfaces
- Adult stock photography
- Logos of schools or teams until licensed
- Light mode or a theme toggle
- These phrases: "level up", "unlock your potential", "student-athlete",
  "take your game to the next level", "game-changer", "elevate", "next level"
- Testimonial quotes with headshots
- Trust badges, "as seen in" logos, fake press mentions
- Fake user counts, fake leaderboards, fake activity feeds
- Drop shadows on cards
- Rounded avatars (photos are rectangular 4:5, card cropped)
- Em dashes anywhere

The banned phrase list is enforced in CI by `script/check-banned-phrases.ts`,
which fails the build on a match in `client/src/pages/` or
`client/src/components/` outside `components/admin/`.

## 8. Where the code lives

```
client/src/design/caliber/
  tokens.ts     colour, type, space, radius, card geometry
  fonts.css     @font-face, self hosted only
  motion.ts     durations, easings, reduced motion collapse
  Card.tsx      the card front primitive
shared/
  rarity.ts     tier computation, shared by client and server
```

`client/src/config/tokens.ts` is the **legacy** palette and is load bearing: it
is wired to the `amber-*` scale in `tailwind.config.ts` and used 147 times
across 35 files. It is not part of CALIBER and must not be deleted without
migrating those usages first.
