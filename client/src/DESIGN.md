# Caliber — Design Language

The platform should read as **one product** — spotless, modern, and confident.
Reference altitude: Apple / Nike / Linear. Restraint over decoration. Every
screen uses the same vocabulary so a recruit and a scout feel the same quality
on every page.

## Non-negotiables

1. **Dark-first.** Background is near-black (`--background`, `0 0% 3%`). Surfaces
   step up in tiny increments (`white/[0.02]` → `white/[0.04]` → `white/[0.06]`).
2. **Platinum is the accent.** `--accent` (`#c6d0d8`). Use it for emphasis,
   active state, eyebrows, and focus. Never amber, never rainbow.
3. **Red is for action only.** `--cta` (`#e02424`) — primary buttons and live/
   urgent signals. Never as a decorative fill.
4. **No emoji.** Ever. Use [lucide-react](https://lucide.dev) icons.
5. **No off-palette colors** (`amber-*`, `purple-*`, `blue-400`, etc.) for brand
   UI. Semantic state colors are allowed and limited to:
   - success/positive → `emerald-400`
   - danger/negative → `red-400`
   - everything else → `accent` (platinum) or `muted-foreground`.
6. **Hairlines, not heavy borders.** `border-white/[0.06–0.10]`.
7. **One radius family.** Cards `rounded-2xl`/`rounded-[1.4rem]`; pills/buttons
   `rounded-full`; inputs `rounded-xl`.

## Typography

- Display / headings: **Outfit** (`font-display`), tight tracking (`-0.02em`).
- Body: **Inter** (`font-body`).
- Eyebrows / labels / stats meta: **JetBrains Mono** via `font-label`
  (uppercase, tracked).
- Elegant emphasis word: **Instrument Serif** italic via `font-editorial-italic`
  — used sparingly, in the accent color.

## Shared building blocks (use these — don't reinvent)

- **`<PageHeader />`** (`@/components/PageHeader`) — every in-app page opens with
  it: `eyebrow` · `title` · `description` · optional `icon`, `actions`, `stats`.
  This is the primary continuity device.
- **`<AnimatedLink />`** (`@/components/ui/animated-link`) — text links / inline
  CTAs with CSS-only hover choreography.
- **`<GradeBadge />`** — the canonical A–F grade chip.
- Cards: prefer a single convention —
  `rounded-2xl border border-white/[0.07] bg-white/[0.02]`, hover
  `hover:border-white/[0.16]`. Avoid cards nested directly inside cards.

## Motion

- Reuse the tokens in `pages/landing-animations.tsx` (`Reveal`, `fadeUp`,
  `ease`) and the `ease-expo` Tailwind timing token.
- Motion must guide attention or communicate state — never decorative.
- Respect `prefers-reduced-motion`.

## Spacing & layout

- Page content max width ~`max-w-7xl`, generous vertical rhythm.
- 4 / 8 / 16 / 24 spacing scale. Don't invent arbitrary gaps.
- Stat strips and grids use `gap-px` over a faint surface to render as hairline-
  separated cells.

## Anti-patterns (do not ship)

- Emoji, decorative blobs, glow-on-everything, purple→blue gradients.
- Mixed accent colors on one screen.
- Re-implemented page headers / bespoke card styles per page.
- Oversized hero copy on dense, daily-use tools (that's for marketing pages).
