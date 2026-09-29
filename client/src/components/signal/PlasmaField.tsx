import { useEffect, useRef } from "react";

/**
 * PlasmaField — a dithered, palette-quantized plasma gradient in motion.
 * The "old console attract screen" background: chunky pixels (nearest-
 * neighbor upscale via image-rendering: pixelated), 4×4 Bayer-dithered
 * bands flowing through obsidian → crimson/ember → chrome silver →
 * phosphor green.
 *
 * Perf + a11y (HeroCanvas patterns):
 * - Tiny internal buffer (css size / pixelSize, capped), ~24fps rAF loop.
 * - Pauses off-screen (IntersectionObserver) and when the tab is hidden.
 * - prefers-reduced-motion → renders one static frame, no loop.
 */

// 4×4 ordered-dither threshold matrix (values 0–15).
const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const;

// Looping gradient stops: obsidian → ember/crimson → chrome → phosphor green.
// Kept in sync with the SIGNAL scales by eye; raw rgb here because this is a
// canvas LUT, not styled DOM.
const STOPS: ReadonlyArray<readonly [number, number, number]> = [
  [11, 11, 14], // obsidian
  [38, 9, 13], // dried maroon
  [143, 22, 32], // deep crimson
  [225, 29, 42], // crimson (matches --crimson)
  [255, 106, 42], // ember orange
  [201, 204, 212], // silver (matches --silver)
  [238, 240, 244], // chrome highlight
  [105, 217, 140], // phosphor green
  [18, 51, 36], // dark green
  [11, 11, 14], // back to obsidian (seamless loop)
];

const PALETTE_SIZE = 32;
const FRAME_MS = 1000 / 24; // retro frame rate is a feature
const MAX_INTERNAL_WIDTH = 240;

function buildPalette(): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(PALETTE_SIZE * 3);
  const segs = STOPS.length - 1;
  for (let i = 0; i < PALETTE_SIZE; i++) {
    const f = (i / PALETTE_SIZE) * segs;
    const s = Math.min(Math.floor(f), segs - 1);
    const t = f - s;
    for (let c = 0; c < 3; c++) {
      lut[i * 3 + c] = STOPS[s][c] + (STOPS[s + 1][c] - STOPS[s][c]) * t;
    }
  }
  return lut;
}

export interface PlasmaFieldProps {
  className?: string;
  /** CSS pixels per plasma pixel — bigger = chunkier. */
  pixelSize?: number;
  /** Flow speed multiplier. */
  speed?: number;
}

export function PlasmaField({ className, pixelSize = 8, speed = 1 }: PlasmaFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const palette = buildPalette();
    let w = 0;
    let h = 0;
    let img: ImageData | null = null;
    let raf = 0;
    let running = true;
    let visible = true;
    let last = performance.now();
    let acc = 0;
    let t = 34; // seeded mid-flow so the first frame already looks alive

    const resize = () => {
      const cssW = canvas.clientWidth || 1;
      const cssH = canvas.clientHeight || 1;
      const scale = Math.max(1, Math.min(pixelSize, Math.ceil(cssW / MAX_INTERNAL_WIDTH) * pixelSize));
      w = Math.max(8, Math.min(MAX_INTERNAL_WIDTH, Math.round(cssW / scale)));
      h = Math.max(8, Math.round(cssH / scale));
      canvas.width = w;
      canvas.height = h;
      img = ctx.createImageData(w, h);
      draw();
    };

    const draw = () => {
      if (!img) return;
      const data = img.data;
      const cx = w * 0.62;
      const cy = h * 0.4;
      for (let y = 0; y < h; y++) {
        const row = BAYER4[y & 3];
        for (let x = 0; x < w; x++) {
          const dx = x - cx;
          const dy = y - cy;
          const v =
            Math.sin(x * 0.31 + t) +
            Math.sin(y * 0.26 - t * 0.71) +
            Math.sin((x + y) * 0.17 + t * 0.53) +
            Math.sin(Math.sqrt(dx * dx + dy * dy) * 0.21 - t * 0.87);
          // normalize [-4,4] → palette space, rotate over time, Bayer-dither
          const dither = (row[x & 3] - 7.5) / 16;
          let idx = Math.floor(((v + 4) / 8) * PALETTE_SIZE + t * 2.4 + dither * 3);
          idx = ((idx % PALETTE_SIZE) + PALETTE_SIZE) % PALETTE_SIZE;
          const o = (y * w + x) * 4;
          const p = idx * 3;
          data[o] = palette[p];
          data[o + 1] = palette[p + 1];
          data[o + 2] = palette[p + 2];
          data[o + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!running || !visible) {
        last = now;
        return;
      }
      acc += now - last;
      last = now;
      if (acc < FRAME_MS) return;
      t += (Math.min(acc, 100) / 1000) * 0.6 * speed;
      acc = 0;
      draw();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    if (reduced) {
      // One static frame; no loop, no observers needed beyond resize.
      return () => ro.disconnect();
    }

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0 },
    );
    io.observe(canvas);
    const onVis = () => {
      running = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
      io.disconnect();
      ro.disconnect();
    };
  }, [pixelSize, speed]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className}
      style={{ imageRendering: "pixelated", width: "100%", height: "100%" }}
    />
  );
}
