# Caliber Landing — Design Spec

Reference for the editorial magazine-cover landing page.
Primary file: `client/src/pages/Landing.tsx`
Animation primitives: `client/src/pages/landing-animations.tsx`
Utilities: `client/src/index.css` (search `Editorial landing page system`)

---

## 1. Aesthetic Direction

**Editorial / article magazine.** Think Bloomberg Businessweek, Monocle, Esquire, The Athletic.
Dark-mode-first, platinum foreground on near-black, Caliber Red for accent emphasis and cover-line italics.

Signature moves:
- Giant display masthead (`CALIBER`) sitting directly under the nav.
- Mono eyebrows with horizontal rule prefix.
- Instrument Serif italic for one-word emphasis in display headings.
- Hairline borders and edge-to-edge rules over shadowed cards.
- Figure captions, page numbers, drop caps, barcodes — actual print-magazine trappings, not generic SaaS glass cards.

Do NOT replace these with gradient cards, glass morphism, generic emoji icons, or purple-gradient-on-white.

---

## 2. Typography

### Families (loaded in `client/index.html`)
| Role | Family | Use |
|---|---|---|
| Display | `Outfit` 400–900 | Masthead, headings, CTAs |
| Body | `Inter` 300–700 | Body copy, UI text |
| Serif / editorial | `Instrument Serif` 400 (italic 400) | Cover-line emphasis, drop caps, pull-quotes, stat numerals |
| Mono label | `JetBrains Mono` 500 | Eyebrows, page numbers, captions, barcodes |

### Utility classes (index.css ~line 1390)
- `.font-editorial` — Instrument Serif, -0.015em tracking, normal weight.
- `.font-editorial-italic` — Instrument Serif italic, -0.02em tracking.
- `.font-label` — JetBrains Mono 500, uppercase, 0.12em tracking, 0.68rem. Use for eyebrows, page numbers, "LIVE", "FIG. 01".

### Heading scale
- Masthead: `clamp(4.5rem, 17vw, 15rem)`, `font-weight: 900`, `letter-spacing: -0.055em`, `line-height: 0.82`.
- Cover line (h2): `clamp(3rem, 7.5vw, 6rem)`, `font-weight: bold`, `line-height: 0.95`, tracking-tight.
- Section heading: `text-4xl md:text-6xl`, `leading-[1.05]`, one word wrapped in `.font-editorial-italic italic` for emphasis.
- Body editorial intro: `text-xl`, `font-editorial`, relaxed leading.

### Patterns
- Every section heading gets a mono eyebrow with `.editorial-rule` prefix: `<span className="editorial-rule font-label text-accent">Features</span>`.
- Dropcap: float a 4.5rem italic serif first-letter into the paragraph (see `landing.tsx` hero intro).
- Figure captions: two columns, mono label, `text-muted-foreground` (e.g. `Fig. 01 — Player Report, live view · Photo: Caliber Labs`).

---

## 3. Color tokens (index.css `:root` / `.dark`)

Use HSL tokens via Tailwind; never raw hex in components.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--background` | 100% white | 3% black | Page bg |
| `--foreground` | slate-950 | 95% white | Primary text |
| `--muted-foreground` | slate-500 | warm-gray 45% | Captions, eyebrows |
| `--border` | slate-200 | warm-gray ~15% | Hairlines, dividers |
| `--card` | slate-50 | 6% black | Panels, preview card |
| `--accent` | steel blue (210 21% 39%) | — | Links, CTA button bg, emphasized eyebrows |
| `--cta` | crimson (0 76% 45%) | — | Marquee bg gradient, "Exclusive" stamp |
| `--grade-a/b/c/d/f` | grade semantic | — | `GradeBadge` component |

Rule: semantic tokens only. If a color doesn't exist as a token and you'd use it twice, add a token.

Crimson is reserved for magazine-cover print accents (stamps, marquee bg, barcode price tag). Accent steel blue is the interactive color.

---

## 4. Layout System

- Nav: `max-w-7xl`, sticky, 4px vertical padding, hairline bottom border, logo + "Est. MMXXVI" only (no duplicate brand text — masthead handles that).
- Hero: `max-w-7xl`, `pt-6 pb-16`.
- Content sections: `max-w-6xl` (Features, Product, Numbers, Testimonials), `py-20 px-4`.
- Section headers: `mb-12 max-w-3xl`.
- Grids:
  - Hero: `grid lg:grid-cols-12 gap-10 lg:gap-16` → cover text 7 / cover art 5.
  - Features: `md:grid-cols-2 lg:grid-cols-3 gap-6`.
  - Showcase: `lg:grid-cols-2 gap-8 items-start`.
  - Stats: edge-to-edge `grid grid-cols-2 md:grid-cols-4 border-y border-border` with `.hairline-col`.

Spacing system: 4pt/8pt base via Tailwind. Section vertical rhythm is `py-20` (5rem) — do not restore `py-28` without reason, it creates dead space.

---

## 5. Editorial Conventions (magazine-cover elements in the hero)

The hero is a real magazine cover and every element should continue to earn that read.

1. **Issue info strip (top)** — `Vol. I · No. 01 · Spring MMXXVI · caliber.app · $0.00 · Free Forever`. Hairline rule below.
2. **Masthead** — `CALIBER`, display 900, fluid clamp, `-0.055em` tracking, leading 0.82.
3. **Dateline strip** — under masthead: `The Athletes' Quarterly · Basketball · Analytics · Recruiting · Issue 01 / Spring '26`. Border y.
4. **Vertical spine rails** — rotated mono label text at `left-2` and `right-2` using `writing-mode: vertical-rl`.
5. **Cover Story label + cover line** — `Cover Story · P. 01` eyebrow, then the 3-line headline with italic serif emphasis on the last word.
6. **Drop cap intro** — first letter 4.5rem italic serif, floated left.
7. **CTA row** — `MagneticButton` + trust line (`Star` icon + "Trusted by 10,000+ athletes nationwide").
8. **Exclusive stamp** — crimson `.bg-accent` label floating over the Player Report card (`absolute -top-4 left-6`).
9. **Cover art** — Player Report card inside `TiltCard`, 2×2 `GradeBadge` grid + hairline bottom metrics row.
10. **Figure caption** — mono line below the card.
11. **Also in this issue** — 3 teaser stories with `P. 12 / P. 24 / P. 31` mono page numbers, serif titles, italic subheads.
12. **Barcode strip (bottom)** — generated hairline bars + UPC number + `caliber.app / join` + `#CALIBER26`.

---

## 6. Components & Animation Primitives (`landing-animations.tsx`)

All use `framer-motion` ^11.18.2.

| Export | Purpose |
|---|---|
| `ease = [0.16, 1, 0.3, 1]` | Shared ease-out-quartic curve |
| `fadeUp`, `stagger` | Variants for `motion` |
| `GlobalCursor` | 900px platinum radial glow tracking mouse, spring lag (stiffness 80, damping 20). Mounted at root of landing. |
| `SplitReveal` | Per-character in-view reveal with blur clear |
| `MagneticButton` | Elastic 35% follow on hover; always wrap primary CTAs |
| `TiltCard` | ±8° rotateX/Y on mouse move, perspective 900. Used on hero cover card + showcase preview |
| `Reveal` | In-view fade+rise wrapper for feature cards, paragraphs |
| `LiveFeed` | Bottom-right "LIVE" ticker cycling 5 events every 2.8s. Mounted at root of landing. |

**CSS animations (index.css ~line 1432):**
- `editorialRise` @keyframes → `.editorial-rise` + delay variants `-1` through `-5` (0.05s → 0.8s step).
  Use on hero masthead, cover lines, CTA, card, barcode for staggered page load.
- `@keyframes marquee` → used in marquee section only.

**Timing rules:**
- Enter: 0.55–0.9s, ease-out curve above.
- Hover micro-interactions: 150–250ms.
- Staggers: 0.15s between hero-level elements, 0.5s between feature cards.
- Reduced-motion: the animation primitives use framer-motion — respect `prefers-reduced-motion` if added (not yet wired; todo).

---

## 7. Custom Utilities

| Class | Defined | Use |
|---|---|---|
| `.editorial-rule` | index.css 1410 | Mono eyebrow prefix (2rem hairline rule) |
| `.grain-overlay` | index.css 1423 | SVG fractal noise, opacity 0.08, `mix-blend-mode: overlay` — applies to hero + marquee bg |
| `.hairline-col` | index.css 1446 | Sibling-only 1px vertical divider for stats / hero metrics rows |
| `.hero-gradient-bg` | index.css (search) | Subtle radial on hero |
| `.grade-display-a/b/c/d/f` | grade classes | Used by `GradeBadge` — solid color + box-shadow glow |

---

## 8. Section Map

| Section | Purpose | Key pattern |
|---|---|---|
| Nav | Sticky, functional | Logo + "Est. MMXXVI" mono |
| **Hero (magazine cover)** | Brand + value prop + cover card | Masthead, cover lines, Also-in-this-issue, barcode strip |
| Marquee | Tagline reel | Crimson gradient bg, white/70 text, hairline top/bottom |
| Features | 6-card grid | Each card wrapped in `Reveal` with staggered delay |
| How It Works | 3-step numbered flow | Dashed rule connecting step circles |
| Product / Showcase | Tabbed preview panel | `TiltCard`, 3 primary stats + secondary data per tab |
| By the Numbers | Platform stats | Edge-to-edge hairline cols, 01/02/03/04 numbering, serif display numerals |
| Testimonials | Editorial pull-quotes | Floating italic `Quote` mark, no shadcn Cards |
| Final CTA | Sign-up push | `MagneticButton` |

---

## 9. Do / Don't

**Do:**
- Use mono eyebrows with `.editorial-rule` prefix over every section heading.
- Wrap primary CTAs in `MagneticButton`.
- Use `GradeBadge` (not italic serif letters) for grade rendering — must match the real app.
- Use `Reveal` on feature cards and paragraph reveals.
- Keep section padding at `py-20` and header margin at `mb-12`.
- Add page numbers (`P. 12`), figure captions (`Fig. 01`), and italic serif subheads when enriching content.

**Don't:**
- Duplicate the brand wordmark in the nav when the masthead appears on the same page.
- Add shadowed `Card` stacks for testimonials or numbers — use edge-to-edge hairline layouts.
- Use emoji for icons — always Lucide.
- Use `py-28` on content sections — creates dead space.
- Introduce gradient-card glassmorphism that reads as generic SaaS.

---

## 10. Pending / Known Gaps

- `prefers-reduced-motion` not yet wired into the custom CSS animations (framer-motion respects it by default, but `editorial-rise` classes do not).
- Hero masthead is bitmap-sized text — verify intrinsic CLS impact on mobile; reserved via `min-height` on the parent if issues arise.
- Mobile: vertical spine rails are hidden below `lg:`; consider a compact mobile alternative if the cover feels too sparse on narrow viewports.
- Showcase preview `minHeight: 420` is hard-coded to match the tabs column — if a 4th tab is added, rework with CSS grid `min-content` instead.

---

## 11. Where things live

```
client/
  index.html                          ← Google Fonts preconnect (Outfit, Inter, Instrument Serif, JetBrains Mono)
  src/
    index.css                         ← Design tokens + editorial utilities (search "Editorial landing page system")
    App.tsx                           ← Root route → <Landing /> (unauthenticated)
    pages/
      Landing.tsx                     ← The page itself
      landing-animations.tsx          ← framer-motion primitives
    components/
      GradeBadge.tsx                  ← Used in hero + showcase
      CaliberLogo.tsx                 ← SVG mark in nav
      DarkModeToggle.tsx
docs/
  landing-design.md                   ← This file
```
