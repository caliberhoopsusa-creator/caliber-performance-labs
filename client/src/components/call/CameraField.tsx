import { useLayoutEffect, useRef } from "react";
import { runScrollScrub, stagger } from "@/lib/motion";
import { CourtGeometry } from "./CourtGeometry";

/**
 * CameraField — ONE continuous camera move under all four beats of THE CALL.
 *
 * A sticky full-viewport canvas (pulled out of flow with a negative bottom
 * margin, exactly as the old Atmosphere did) holds four depth planes. A single
 * scroll-scrubbed timeline drives them at DIFFERENT parallax rates, so they
 * pass the viewer at different speeds — that speed difference is what reads as
 * forward travel through one space. Nothing ever cuts; light and geometry
 * change around a camera that only ever pushes forward.
 *
 *   void    the far dark + back-wall bloom      slowest  (deep space)
 *   court   the gym floor, in perspective       slow
 *   light   the lamps and floods                fast
 *   haze    foreground atmosphere + ember       fastest  (right at the lens)
 *
 * Light script (fractions of the full story traversal). Crimson stays earned
 * (§1.4): a whisper at THE GAME, the single peak at THE CALL.
 *   00 DAWN   one cold work light, deep obsidian      (0    → 0.32)
 *   01 GAME   the house lights come up, silver floods (0.20 → 0.58)
 *   02 FILM   the court recedes behind a screen       (0.50 → 0.80)
 *   03 CALL   near-black, one crimson ember           (0.74 → 1)
 *
 * Gradients are static paint; only opacity and transform animate (compositor
 * rule). Every tween is a [from, to] tuple so the JSX renders the final state —
 * reduced motion and timeline failure both resolve to a complete, lit frame.
 */

/** Story-progress scale — positions below read as fractions of 1000. */
const T = 1000;

const PAINT = {
  /* 00 — a single cold work light over the far rim. The gym at 6am. */
  dawn: "radial-gradient(30% 34% at 50% 22%, hsl(var(--silver-hi) / 0.16), hsl(var(--silver) / 0.05) 46%, transparent 72%), radial-gradient(70% 50% at 50% 100%, hsl(var(--obsidian-3) / 0.9), transparent 70%)",
  /* 01 — the house lights: floods from both upper corners, a crowd band, and
     the first whisper of crimson at the rim. */
  game: "radial-gradient(42% 38% at 14% 10%, hsl(var(--silver) / 0.16), transparent 68%), radial-gradient(42% 38% at 86% 10%, hsl(var(--silver) / 0.16), transparent 68%), radial-gradient(50% 16% at 50% 30%, hsl(var(--silver-mute) / 0.14), transparent 74%), radial-gradient(20% 14% at 50% 30%, hsl(var(--crimson-deep) / 0.10), transparent 78%)",
  /* 02 — the film room: a cool screen wash, grade-ramp bloom at center. */
  film: "radial-gradient(44% 40% at 50% 44%, hsl(var(--grade-b) / 0.14), transparent 70%), linear-gradient(180deg, hsl(var(--obsidian-3) / 0.55), transparent 40%, hsl(var(--obsidian-3) / 0.7))",
  /* 03 — the peak. Crimson lifts, low and warm, everything else falls away. */
  call: "radial-gradient(48% 40% at 50% 76%, hsl(var(--crimson-deep) / 0.26), transparent 68%), radial-gradient(22% 18% at 50% 80%, hsl(var(--crimson) / 0.18), transparent 74%), radial-gradient(70% 60% at 50% 0%, hsl(var(--obsidian-3) / 0.85), transparent 62%)",
} as const;

/** Scanline veil for the film-room beat — paint only, never animated. */
const SCANLINES =
  "repeating-linear-gradient(180deg, hsl(var(--silver) / 0.05) 0px, hsl(var(--silver) / 0.05) 1px, transparent 1px, transparent 4px)";

/* Court draw-on. `data-draw` on each stroke names its band; bands draw in
   ascending order (floorboards → sidelines → half-court → key → rim). */
const DRAW_START_MS = 0.01 * T;
const BAND_DRAW_MS = 0.1 * T;
const BAND_STEP_MS = 0.02 * T;
const BAND_STAGGER_MS = 0.004 * T;

/**
 * Group the court's strokes by their `data-draw` band, lowest band first.
 * Returns one array of strokes per band.
 */
function groupByBand(svg: SVGSVGElement): SVGGeometryElement[][] {
  const byBand = new Map<number, SVGGeometryElement[]>();
  for (const el of svg.querySelectorAll<SVGGeometryElement>("[data-draw]")) {
    const band = Number(el.dataset.draw);
    if (!Number.isFinite(band)) continue;
    byBand.set(band, [...(byBand.get(band) ?? []), el]);
  }
  return [...byBand.entries()].sort(([a], [b]) => a - b).map(([, strokes]) => strokes);
}

/** hold-then-release opacity ride: in → hold → out (all fractions of T). */
function fadeThrough(inDur: number, holdDur: number, outDur: number) {
  return [
    { to: 1, duration: inDur * T },
    { to: 1, duration: holdDur * T },
    { to: 0, duration: outDur * T },
  ];
}

export function CameraField({
  reduced,
  storyRef,
}: {
  reduced: boolean;
  storyRef: React.RefObject<HTMLElement | null>;
}) {
  const voidRef = useRef<HTMLDivElement>(null);
  const courtRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const hazeRef = useRef<HTMLDivElement>(null);
  const courtSvgRef = useRef<SVGSVGElement>(null);

  const dawnRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<HTMLDivElement>(null);
  const filmRef = useRef<HTMLDivElement>(null);
  const callRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (reduced) return;

    const planes = [voidRef.current, courtRef.current, lightRef.current, hazeRef.current];
    const plates = [dawnRef.current, gameRef.current, filmRef.current, callRef.current];
    const svg = courtSvgRef.current;
    const bands = svg ? groupByBand(svg) : [];
    const strokes = bands.flat();

    return runScrollScrub({
      driver: storyRef.current,
      // full traversal: the story enters the viewport → the story leaves it
      enter: "bottom top",
      leave: "top bottom",
      targets: [...planes, ...plates, ...strokes],
      build: (tl) => {
        const [deep, court, light, haze] = planes;
        const [dawn, game, film, call] = plates;
        if (!deep || !court || !light || !haze || !dawn || !game || !film || !call) return;

        /* ---- the camera: one forward push, four speeds, never reversed ---- */
        tl.add(deep, { scale: [1, 1.35], duration: T, ease: "linear" }, 0);
        tl.add(court, { scale: [1, 2.6], y: ["0%", "16%"], duration: T, ease: "linear" }, 0);
        tl.add(light, { scale: [1, 3.1], y: ["0%", "22%"], duration: T, ease: "linear" }, 0);
        tl.add(haze, { scale: [1.1, 1.9], y: ["10%", "-8%"], duration: T, ease: "linear" }, 0);

        /* ---- the gym assembles: floor, then the key, then the rim ----
           One tween per `data-draw` band, each starting a beat after the last,
           so the court builds in the order the geometry reads rather than in
           whatever order the elements happen to sit in the DOM. */
        bands.forEach((bandStrokes, i) => {
          tl.add(
            bandStrokes,
            {
              strokeDashoffset: [1, 0],
              duration: BAND_DRAW_MS,
              delay: stagger(BAND_STAGGER_MS),
              ease: "linear",
            },
            DRAW_START_MS + i * BAND_STEP_MS,
          );
        });
        /* the floor falls away as we climb into the film room */
        tl.add(court, { opacity: [1, 0.15], duration: 0.16 * T }, 0.52 * T);

        /* ---- the light script ---- */
        tl.add(dawn, { opacity: fadeThrough(0.06, 0.14, 0.12) }, 0);
        tl.add(game, { opacity: fadeThrough(0.1, 0.16, 0.12) }, 0.2 * T);
        tl.add(film, { opacity: fadeThrough(0.1, 0.12, 0.08) }, 0.5 * T);
        tl.add(call, { opacity: [0, 1], duration: 0.12 * T }, 0.74 * T);
      },
    });
  }, [reduced, storyRef]);

  /* ONE sticky container for BOTH branches. The reduced path differs only in
     what the plates are doing (resting at a static composite instead of being
     scrubbed) — it must NOT get its own layout, or the court ends up positioned
     against the whole story's height instead of the viewport and disappears. */
  const SCRIM =
    "radial-gradient(62% 50% at 50% 50%, hsl(var(--obsidian-0) / 0.86), hsl(var(--obsidian-0) / 0.5) 58%, transparent 84%)";

  return (
    <div
      aria-hidden
      className="pointer-events-none sticky top-0 z-0 h-screen overflow-hidden"
      style={{ marginBottom: "-100vh" }}
      data-testid="camera-field"
    >
      {/* plane 1 — the far dark */}
      <div ref={voidRef} className="absolute inset-0 will-change-transform">
        <div
          ref={dawnRef}
          className="absolute inset-0"
          style={{ background: PAINT.dawn, opacity: reduced ? 1 : 0 }}
        />
        <div
          ref={gameRef}
          className="absolute inset-0"
          style={{ background: PAINT.game, opacity: reduced ? 0.6 : 0 }}
        />
      </div>

      {/* plane 2 — the floor, in perspective */}
      <div
        ref={courtRef}
        className="absolute inset-x-0 bottom-0 h-[68%] origin-bottom will-change-transform"
      >
        <CourtGeometry svgRef={courtSvgRef} />
      </div>

      {/* plane 3 — the lamps: the film wash rides here so the screen feels
          closer than the floor it replaces */}
      <div ref={lightRef} className="absolute inset-0 origin-center will-change-transform">
        <div ref={filmRef} className="absolute inset-0" style={{ opacity: reduced ? 0.35 : 0 }}>
          <div className="absolute inset-0" style={{ background: PAINT.film }} />
          <div className="absolute inset-0" style={{ background: SCANLINES }} />
        </div>
      </div>

      {/* plane 4 — right at the lens */}
      <div ref={hazeRef} className="absolute inset-0 origin-center will-change-transform">
        <div
          ref={callRef}
          className="absolute inset-0"
          style={{ background: PAINT.call, opacity: reduced ? 0.45 : 0 }}
        />
      </div>

      {/* Legibility ground — deliberately NOT parallaxed. The court converges on
          the middle of the frame, which is exactly where the copy sits; without
          this the floorboards run straight through the text. */}
      <div className="absolute inset-0" style={{ background: SCRIM }} />

      <div className="grain-overlay" />
    </div>
  );
}
