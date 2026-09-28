/**
 * Server side CALIBER card renderer.
 *
 * satori turns a plain element tree into SVG, resvg rasterises it to PNG. No
 * headless browser: a Chromium would add hundreds of megabytes to the image and
 * a process pool per render, for a job that is a fixed size layout with no
 * scripting. Measured on this repo: ~51ms warm per card, ~215ms cold, and
 * deterministic, which is what makes the cache key below honest.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS DOES NOT IMPORT Card.tsx
 *
 * satori supports a subset of CSS and its own opentype fork cannot parse the
 * variable fonts the browser uses (it crashes on their fvar table). So the
 * server draws from the same tokens and the same slot order, but through its
 * own tree. The guard against the two drifting is
 * tests/card-renderer.test.ts, which asserts the slot contract on the output.
 *
 * FONTS: static WOFF only, in server/fonts/. satori cannot read woff2 and
 * cannot read the variable files, so the card's display face is Archivo 800
 * without the width axis. The browser card matches deliberately, so the shared
 * artifact is identical to what the player saw.
 */
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync } from "fs";
import { createHash } from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import { rarityDefinition, type RarityTier } from "@shared/rarity";
import { trendGlyph, type Trend } from "@shared/progression";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FONT_DIR = path.join(HERE, "fonts");

/** CALIBER palette. Kept in sync with client/src/design/caliber/tokens.ts. */
const C = {
  court: "#0B0B0D",
  bone: "#F5F1E8",
  red: "#FF2D2D",
  gold: "#E8B84A",
  violet: "#7C4DFF",
  ink: "#0B0B0D",
  fog: "rgba(245,241,232,0.62)",
  chalkStrong: "rgba(245,241,232,0.28)",
} as const;

export const CARD_SIZES = {
  story: { width: 1080, height: 1920 },
  feed: { width: 1080, height: 1080 },
} as const;

export type CardSize = keyof typeof CARD_SIZES;

export interface CardRenderInput {
  name: string;
  position: string;
  classYear: string;
  school: string;
  grade: string;
  tier: RarityTier;
  stats: Array<{ label: string; value: string }>;
  profileUrl: string;
  /** Data URI or absolute URL. satori cannot read a relative path. */
  photoUrl?: string | null;
  /** 30 day grade trend. Rendered beside the grade, never as its own slot. */
  trend?: Trend | null;
}

/** Loaded once. A cold read per render would dominate the render time. */
let fontCache: Array<{ name: string; data: Buffer; weight: 400 | 500 | 700 | 800; style: "normal" }> | null = null;

function fonts() {
  if (fontCache) return fontCache;
  const read = (f: string) => readFileSync(path.join(FONT_DIR, f));
  fontCache = [
    { name: "Archivo", data: read("archivo-latin-800-normal.woff"), weight: 800, style: "normal" },
    { name: "Geist", data: read("geist-sans-latin-400-normal.woff"), weight: 400, style: "normal" },
    { name: "Geist", data: read("geist-sans-latin-500-normal.woff"), weight: 500, style: "normal" },
    { name: "JetBrains Mono", data: read("jetbrains-mono-latin-700-normal.woff"), weight: 700, style: "normal" },
  ];
  return fontCache;
}

/** Rarity frame. Visual only; the tier is never named on a card front. */
function frame(tier: RarityTier, border: number) {
  const stock = tier === "rookie" ? C.court : C.bone;
  switch (tier) {
    case "chrome":
      return { background: stock, border: `${Math.round(border * 1.5)}px solid ${C.gold}` };
    case "prism":
      // satori has no border-image, so the gradient frame is drawn as an outer
      // layer with the stock inset over it. Same result, one more node.
      return { background: `linear-gradient(135deg, ${C.violet}, ${C.red})`, border: "0px solid transparent" };
    case "hot":
      return { background: stock, border: `${border}px solid ${C.red}` };
    case "rookie":
      return { background: stock, border: `${Math.max(1, Math.round(border / 2))}px dashed ${C.chalkStrong}` };
    default:
      return { background: stock, border: `${Math.max(1, Math.round(border / 2))}px solid rgba(11,11,13,0.28)` };
  }
}

/**
 * display-l is a ceiling, not a promise. Mirrors fitNameSize in the client
 * tokens so the two layouts agree on where a long name lands.
 */
function fitNameSize(name: string, availablePx: number, maxPx: number): number {
  const AVG_CHAR_EM = 0.78;
  if (!name) return maxPx;
  return Math.max(Math.min(maxPx, Math.floor(availablePx / (AVG_CHAR_EM * name.length))), Math.round(maxPx * 0.5));
}

/** Builds the satori element tree for one card. */
function cardTree(input: CardRenderInput, size: CardSize) {
  const { width, height } = CARD_SIZES[size];
  const u = width / 390;
  const px = (n: number) => Math.round(n * u);
  const dark = input.tier === "rookie";
  const onStock = dark ? C.bone : C.ink;
  const muted = dark ? C.fog : "rgba(11,11,13,0.62)";
  const rule = dark ? C.chalkStrong : "rgba(11,11,13,0.18)";
  const border = Math.max(2, px(2));

  const inner = width - 2 * px(24);
  const nameSize = fitNameSize(input.name, inner, px(48));

  const el = (type: string, style: Record<string, unknown>, children?: unknown) => ({
    type,
    props: { style: { display: "flex", ...style }, children },
  });

  const stats = input.stats.slice(0, 2);

  const body = [
    // Slot 2: photo in a ruled window. Flexible, so it absorbs the slack and
    // the card fits any canvas without per canvas tuning.
    el("div", {
      border: `1px solid ${rule}`, padding: px(4), flexGrow: 1, minHeight: 0,
    }, el("div", {
      width: "100%", height: "100%",
      backgroundColor: dark ? "rgba(245,241,232,0.06)" : "rgba(11,11,13,0.07)",
      ...(input.photoUrl ? { backgroundImage: `url(${input.photoUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}),
    })),

    // Slots 3 and 4: identity.
    el("div", { flexDirection: "column" }, [
      el("div", {
        fontFamily: "Archivo", fontWeight: 800, fontSize: nameSize,
        lineHeight: 1.05, letterSpacing: "-0.02em", color: onStock,
      }, input.name),
      el("div", {
        marginTop: px(6), fontFamily: "Geist", fontSize: px(11),
        letterSpacing: "0.08em", textTransform: "uppercase", color: muted,
      }, [input.position, input.classYear, input.school].filter(Boolean).join(", ")),
    ]),

    // Slot 5: the grade, on its plate.
    el("div", {
      borderTop: `1px solid ${rule}`, borderBottom: `1px solid ${rule}`,
      paddingTop: px(size === "story" ? 20 : 12), paddingBottom: px(size === "story" ? 20 : 12),
      alignItems: "center", justifyContent: "center",
    }, [
      el("div", {
        fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: px(72),
        lineHeight: 1, letterSpacing: "-0.03em", color: onStock,
      }, input.grade),
      // Flat renders nothing; its absence already says "no change".
      ...(input.trend && input.trend.direction !== "flat"
        ? [el("div", {
            marginLeft: px(8), alignSelf: "flex-start", marginTop: px(12),
            fontFamily: "Geist", fontSize: px(22), lineHeight: 1,
            color: input.trend.direction === "up" ? C.red : muted,
          }, trendGlyph(input.trend.direction))]
        : []),
    ]),

    // Slot 6: exactly two stats.
    el("div", { gap: px(20) }, stats.map((s) =>
      el("div", { flexDirection: "column" }, [
        el("div", {
          fontFamily: "Geist", fontSize: px(11), letterSpacing: "0.08em",
          textTransform: "uppercase", color: muted,
        }, s.label),
        el("div", {
          fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: px(22),
          letterSpacing: "-0.01em", color: onStock,
        }, s.value),
      ]),
    )),

    // Slot 7: the watermark, on every render.
    el("div", { justifyContent: "flex-end", alignItems: "baseline", gap: px(8), opacity: 0.62 }, [
      el("div", {
        fontFamily: "Archivo", fontWeight: 800, fontSize: px(11),
        letterSpacing: "0.08em", textTransform: "uppercase", color: onStock,
      }, "Caliber"),
      el("div", { fontFamily: "Geist", fontSize: px(11), color: onStock }, input.profileUrl),
    ]),
  ];

  const card = el("div", {
    flexDirection: "column", width: "100%", height: "100%",
    padding: px(24), gap: px(16),
    borderRadius: px(14),
    ...frame(input.tier, border),
  }, body);

  // Prism draws its gradient as an outer layer, since satori has no border-image.
  if (input.tier === "prism") {
    return el("div", {
      width, height, padding: border, borderRadius: px(14),
      background: `linear-gradient(135deg, ${C.violet}, ${C.red})`,
    }, el("div", {
      flexDirection: "column", width: "100%", height: "100%",
      padding: px(24), gap: px(16), borderRadius: px(14) - border,
      background: C.bone,
    }, body));
  }

  return el("div", { width, height }, card);
}

/** Renders one card to PNG bytes. */
export async function renderCardPng(input: CardRenderInput, size: CardSize): Promise<Buffer> {
  const { width, height } = CARD_SIZES[size];
  const svg = await satori(cardTree(input, size) as any, {
    width,
    height,
    fonts: fonts() as any,
  });
  /* loadSystemFonts defaults to true, which makes resvg scan the OS font
     directories on every construction: measured at ~2.2s per card, against
     5-10ms for satori's layout and ~25ms for the actual rasterise. satori
     already embeds text as paths, so resvg needs no fonts at all. */
  const png = new Resvg(svg, { font: { loadSystemFonts: false } }).render().asPng();
  return Buffer.from(png);
}

/* --------------------------------------------------------------- caching */

/**
 * Cache key. `gradeVersion` must change whenever anything on the face changes,
 * which is what lets a shared card be regenerated without serving a stale one.
 */
export function cardVersion(input: CardRenderInput): string {
  /* Everything the face renders, in order. If a field is added to the card it
     must be added here too, or a stale PNG outlives the change it should have
     invalidated. */
  const parts = [
    input.name, input.position, input.classYear, input.school,
    input.grade, input.tier, input.photoUrl ?? "",
    input.trend?.direction ?? "none",
    ...input.stats.flatMap((s) => [s.label, s.value]),
  ];
  return createHash("sha1").update(parts.join("\u0000")).digest("hex").slice(0, 12);
}

export function cardCacheKey(playerId: number, gradeVersion: string, size: CardSize): string {
  return `${playerId}:${gradeVersion}:${size}`;
}

const MAX_CACHED = 200;
const cache = new Map<string, Buffer>();

export async function renderCardCached(
  playerId: number,
  gradeVersion: string,
  size: CardSize,
  input: CardRenderInput,
): Promise<Buffer> {
  const key = cardCacheKey(playerId, gradeVersion, size);
  const hit = cache.get(key);
  if (hit) {
    // Refresh recency so the hot cards survive eviction.
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }

  const png = await renderCardPng(input, size);
  cache.set(key, png);

  // Bounded LRU. A card is ~60-120kb, so 200 is roughly 20MB worst case.
  while (cache.size > MAX_CACHED) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }

  return png;
}

export function clearCardCache(): void {
  cache.clear();
}

/** Tier metadata, for the card back where the tier IS named. */
export { rarityDefinition };
