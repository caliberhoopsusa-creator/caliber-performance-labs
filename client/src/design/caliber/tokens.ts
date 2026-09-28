/**
 * CALIBER design tokens.
 *
 * The player-facing design system. Replaces SIGNAL on every player surface;
 * SIGNAL stays on internal admin routes only.
 *
 * Metaphor: a trading card. Every player surface is a card, a card back, or
 * cards compared. Emotion target is recognition ("that's me") before
 * comprehension.
 *
 * Hard rules, enforced by lint and review:
 *   - Never pure #FFFFFF or pure #000000.
 *   - Never the SIGNAL crimson #e11d2a on a player surface. CALIBER red is
 *     #FF2D2D and it is a different colour.
 *   - Dark only. There is no light mode and no toggle.
 *   - No drop shadows on cards. Depth comes from rarity treatment and stock.
 *
 * Do not confuse this with client/src/config/tokens.ts, which is the legacy
 * palette wired to the `amber-*` scale in tailwind.config.ts. That file is load
 * bearing (147 usages) and is a separate cleanup.
 */

/* ------------------------------------------------------------------ colour */

export const color = {
  /** Default background. */
  court: "#0B0B0D",
  /** Card stock, a warm off white. Never pure white. */
  bone: "#F5F1E8",
  /** Primary accent: grade reveals, Hot tier. */
  red: "#FF2D2D",
  /** Chrome tier, A+ foil. */
  gold: "#E8B84A",
  /** Prism tier. */
  violet: "#7C4DFF",
  /** Base tier neutral. */
  steel: "#6B7280",
  /** Borders and dividers. */
  chalk: "rgba(245, 241, 232, 0.14)",
  /** Emphasised borders. */
  chalkStrong: "rgba(245, 241, 232, 0.28)",
  /** Text on bone. Never pure black. */
  ink: "#0B0B0D",
  /** Secondary text on court. */
  fog: "rgba(245, 241, 232, 0.62)",
} as const;

export type ColorToken = keyof typeof color;

/* -------------------------------------------------------------------- type */

/**
 * Type scale, mobile first, in px.
 *
 * `size` and `leading` are numbers so a renderer that cannot parse CSS (the
 * server side card renderer) can use them directly.
 */
export interface TypeStep {
  size: number;
  leading: number;
  tracking: string;
}

export const type = {
  /** The grade digit. The single biggest thing on a card. */
  displayXl: { size: 72, leading: 1.0, tracking: "-0.03em" },
  /** Card name, landing H1 on mobile. */
  displayL: { size: 48, leading: 1.05, tracking: "-0.02em" },
  /** Section heads. */
  displayM: { size: 32, leading: 1.1, tracking: "-0.015em" },
  /** Subheads. */
  displayS: { size: 22, leading: 1.15, tracking: "-0.01em" },
  bodyL: { size: 17, leading: 1.5, tracking: "0" },
  bodyM: { size: 15, leading: 1.55, tracking: "0" },
  bodyS: { size: 13, leading: 1.5, tracking: "0.005em" },
  /** Uppercase labels. */
  micro: { size: 11, leading: 1.4, tracking: "0.08em" },
} as const satisfies Record<string, TypeStep>;

export type TypeToken = keyof typeof type;

/* ------------------------------------------------------------------- fonts */

/**
 * Font stacks. All three shipping faces are OFL-1.1 and self hosted from
 * /public/fonts/. Nothing is fetched at runtime. See fonts.css for why these
 * three and not the commercial faces the brief first named.
 */
export const font = {
  /** Archivo Variable, set expanded and heavy. */
  display: "'Neue Machina', 'Archivo Variable', 'Archivo Black', system-ui, sans-serif",
  /** Geist Variable, an Inter class neo-grotesque. */
  body: "'Inter', 'Geist Variable', system-ui, -apple-system, sans-serif",
  /** JetBrains Mono. Monospace, so tabular by construction. */
  number: "'Space Grotesk', 'JetBrains Mono', ui-monospace, monospace",
} as const;

/**
 * Display is a variable face driven on two axes. Expanded and heavy is the
 * CALIBER register; applying these together is what separates it from plain
 * bold Archivo.
 */
export const DISPLAY_AXES = {
  fontWeight: 800,
  fontStretch: "112%",
} as const;

/** Applied anywhere digits sit in a column or a stat line. */
export const NUMERIC_FEATURES = '"tnum" 1';

/* ------------------------------------------------------------ space, shape */

/** The only permitted spacing values, in px. */
export const space = [2, 4, 8, 12, 16, 20, 24, 32, 44, 64, 96] as const;

export type Space = (typeof space)[number];

export const radius = {
  sharp: 0,
  soft: 4,
  /** Every card uses this. */
  card: 14,
  pill: 999,
} as const;

/**
 * No drop shadows on cards, deliberately. Depth is carried by the rarity
 * treatment and the card stock, not by a blur underneath. There is no shadow
 * token here because there is no shadow.
 */

/* ------------------------------------------------------------------ canvas */

/** Fixed output sizes for a rendered card. */
export const CARD_SIZE = {
  /** Instagram or TikTok story. */
  story: { width: 1080, height: 1920 },
  /** Feed post. */
  feed: { width: 1080, height: 1080 },
} as const;

export type CardSizeKey = keyof typeof CARD_SIZE;

/** In app, the card fills the viewport minus a gutter this wide, in px. */
export const CARD_GUTTER = 32;

/** The player photo slot is always this ratio, width over height. */
export const PHOTO_ASPECT = 4 / 5;

/* ----------------------------------------------------------------- helpers */

/** `type` step as a CSS shorthand friendly object. */
export function typeStyle(token: TypeToken) {
  const step = type[token];
  return {
    fontSize: `${step.size}px`,
    lineHeight: step.leading,
    letterSpacing: step.tracking,
  } as const;
}

/**
 * Largest display size at which `name` still fits one line.
 *
 * display-l is a ceiling, not a promise. "Jordan Reyes" in expanded black at
 * the full 48 token overruns a 1080 card and truncates, and most real names
 * are longer than that. Measuring is not available in a server render, so the
 * estimate is deterministic: expanded black Archivo averages about 0.62em per
 * character at wdth 112% and weight 800, which keeps names on one line
 * without a DOM. Erring high costs a little size; erring low truncates.
 */
export function fitNameSize(name: string, availablePx: number, maxPx: number): number {
  const AVG_CHAR_EM = 0.78;
  if (!name) return maxPx;
  const estimated = availablePx / (AVG_CHAR_EM * name.length);
  return Math.max(Math.min(maxPx, Math.floor(estimated)), Math.round(maxPx * 0.5));
}

/** Scales a px value for a fixed size render, relative to the in app width. */
export function scaleForRender(px: number, renderWidth: number, baseWidth = 390): number {
  return Math.round((px * renderWidth) / baseWidth);
}
