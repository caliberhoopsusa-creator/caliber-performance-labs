# Plan: Caliber Landing Overhaul — "SIGNAL" (dark futuristic scrollytelling)

**Complexity:** Large (from-scratch rebuild of `client/src/pages/Landing.tsx`)
**Approach:** Ground-up scrollytelling experience, not incremental edits.

## Concept
A dark, premium, **broadcast/telemetry** experience — Caliber as a transmission that *measures and reveals* an athlete's caliber. Obsidian + crimson glow + silver, telemetry typography, editorial headlines, scroll-driven acts. Built on the **Project Wemby** aesthetic (the user's own taste), with the **openness/cleanliness of Parker** and the **pill nav + huge wordmark of Daniel Sun**. Liquid metal = subtle red-tinted background accent only.

Voice: confident, future-forward, honest. Tagline energy: "Every game is a signal. Caliber reads it."

## Patterns to mirror (already in repo)
| Category | Source | Pattern |
|---|---|---|
| Page/section structure | `client/src/pages/Landing.tsx` | section + `Rise` reveal wrappers, page-scoped `<style>` |
| Tokens | `client/src/index.css` | `--accent` crimson, `--silver`, `--tier-*`, dark `.dark` block |
| Score element | `client/src/components/CaliberScore.tsx` + `lib/caliberTier.ts` | the 0–99 ring (reuse for the interactive act) |
| Signup | `client/src/components/WaitlistForm.tsx` → `POST /api/waitlist` | KEEP as the primary CTA (works, honest) |
| Shader | `components/ui/hero-liquid-metal.tsx` + `@paper-design/shaders-react` | `LiquidMetal` (accent only) |
| Fonts | `client/index.html` | Barlow Condensed (display), Inter (body), Instrument Serif (italic accent), JetBrains Mono (telemetry) |

## Act-by-act structure (scrollytelling)
- **Act 00 — HERO (grandiose, signup-first):** obsidian + animated crimson radial glow + subtle red-tinted liquid-metal ambient; floating centered **pill nav** with `SYSTEM ONLINE` indicator; telemetry header (version/coords); oversized **CALIBER** wordmark + editorial headline (bold condensed + red italic serif word); eyebrow; **inline waitlist signup**; cursor-reactive glow; scroll cue.
- **Act 01 — THE PROBLEM (editorial reveal):** big mixed-type headline ("You're training on a *guess*.") with scroll reveal + telemetry label `ACT 01 / 06`.
- **Act 02 — FORGE YOUR GRADE (interactive, sticky-pinned):** the centerpiece — drag stat sliders / pick a position → the **Caliber Score ring re-casts live** (reuse `CaliberScore`). Replaces the static "engine card."
- **Act 03 — THE SYSTEM (clean capability cards, Parker-style):** 3–4 airy cards (Grades, AI Video, Badges, Recruiting) with mono labels.
- **Act 04 — THE PRODUCT (sticky device reveal):** real dashboard **screenshots** in a mouse-tilt/parallax frame (NEEDS owner login; placeholder frame until provided).
- **Act 05 — WHO IT'S FOR:** Players / Coaches / Recruiters / Guardians (honest audience value).
- **Act 06 — THE NUMBERS + CTA:** honest product-truth metrics + real live founding count; closing "Know your caliber" + waitlist; footer with telemetry colophon.

## Scroll mechanics
framer-motion `useScroll` (per-section targets) + `useTransform` for opacity/scale/translate; **sticky-pin** (position: sticky) for Acts 02 & 04; keep the top **scroll-progress chrome bar**; staggered directional reveals. `prefers-reduced-motion` → disable transforms, render static, no pinning.

## Background + telemetry system
Fixed obsidian base + animated crimson radial bloom (the "little gradient"); a **low-opacity `LiquidMetal` ambient layer, crimson-tinted, masked** behind content (accent texture, 1 instance, paused offscreen). Telemetry chrome: `SYSTEM ONLINE` pill, `SYS · CALIBER_OS / vX`, `LAT/LON/ALT`-style readouts, `ACT n / 6` section markers — all JetBrains Mono.

## Typography system
Display/wordmark: Barlow Condensed. Editorial accent word: Instrument Serif *italic* in crimson. Body: Inter. Telemetry/labels: JetBrains Mono. Chrome headline treatment via existing `text-chrome`.

## Liquid metal placement (accents only)
1) Subtle red-tinted ambient shader layer in the background. 2) Optional thin metal seam between acts. 3) metal-fx buttons on a secondary CTA (PENDING live verification — render blank headless).

## Honest social proof
No fake testimonials/logos/counts. Use: founding-class framing, **real** live waitlist + founding-athlete counts (`/api/public/waitlist-count`, platform-stats), and product-truth metrics (6 categories, 50+ badges, A–F, <2 min).

## Build order
1. **Foundation:** background system (glow + red-tinted metal ambient), pill nav, scroll-progress + reduced-motion scaffold, telemetry primitives.
2. **Hero (Act 00):** wordmark, headline, inline signup, cursor-reactive.
3. **Scroll engine:** reusable `<Act>`/pin wrapper (useScroll + transforms).
4. **Forge-your-grade (Act 02):** interactive live Caliber Score.
5. **System cards + Who-it's-for (Acts 03, 05).**
6. **Product reveal (Act 04):** real screenshots (owner login) or placeholder.
7. **Numbers + CTA + footer (Act 06);** honest proof.
8. **Polish:** metal-fx verification (live w/ user), motion tuning, responsive, a11y, perf.

## Risks
| Risk | Likelihood | Mitigation |
|---|---|---|
| GPU/perf (shaders + scroll) | Med | ≤1–2 shader instances, pause offscreen, transform/opacity only |
| metal-fx blank | Med | verify live; fall back to CSS-chrome button |
| Sticky scrollytelling on mobile | Med | simplify to stacked reveals < lg |
| I can't see motion/interactivity headless | High | user verifies live each phase |
| Big diff replaces current lower sections | Med | commit per phase; current state already committed (b2c7906) |

## Open items needing the user
- **Owner login** for real dashboard screenshots (Act 04).
- **Live verification** of metal-fx buttons + overall scroll feel.
- Confirm concept name/voice ("SIGNAL" / tagline).

## Acceptance
- [ ] Reads as dark futuristic broadcast (Wemby) with Parker openness + Daniel Sun nav/wordmark
- [ ] Scroll-driven acts with real interactivity (forge-your-grade)
- [ ] Liquid metal as accent only; waitlist intact; fully honest
- [ ] Reduced-motion + responsive + performant
