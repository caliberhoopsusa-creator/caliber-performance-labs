import { useLayoutEffect, useRef } from "react";
import { runScrollScrub } from "@/lib/motion";

/**
 * Atmosphere — ONE continuous background under all five scenes.
 * A sticky full-viewport canvas (first child of the story, negative bottom
 * margin) holds layered radial-gradient plates whose OPACITY and TRANSFORM
 * crossfade as the whole story scrolls — hue and light shift like a single
 * camera move, never a room change. Gradients themselves are static paint;
 * only opacity/transform animate (compositor rule). Grain stays throughout.
 *
 * Scene → light script (fractions of the full story traversal). Operator
 * 2026-07-17 (metal-led / "not just all red"): graphite and silver carry the
 * atmosphere throughout — crimson only lifts at THE SCOUT, the one narrative
 * peak, and stays a whisper everywhere else.
 *   THE GAME   cold obsidian, one faint silver wash     (0 → 0.26)
 *   THE GRADE  a teal grade-light blooms center         (0.14 → 0.44)
 *   THE CLIMB  graphite pools rise from below            (0.36 → 0.68)
 *   THE SCOUT  the narrative peak — crimson lifts, high (0.60 → 0.86)
 *   THE ASK    calm graphite — one faint ember at rest   (0.80 → 1)
 */

/** Story-progress scale — positions below read as fractions of 1000. */
const T = 1000;

const LAYER_PAINT = {
  game: "radial-gradient(52% 40% at 22% 18%, hsl(var(--silver-mute) / 0.12), transparent 70%), radial-gradient(24% 18% at 74% 62%, hsl(var(--crimson-deep) / 0.07), transparent 75%)",
  grade:
    "radial-gradient(46% 40% at 50% 42%, hsl(var(--grade-b) / 0.13), transparent 70%), radial-gradient(60% 50% at 50% 90%, hsl(var(--obsidian-3) / 0.8), transparent 75%)",
  climb:
    "radial-gradient(54% 46% at 18% 86%, hsl(var(--silver-mute) / 0.18), transparent 70%), radial-gradient(44% 40% at 86% 72%, hsl(var(--crimson-deep) / 0.10), transparent 72%)",
  /* the one narrative peak — crimson is allowed to lift here, still capped */
  scout:
    "radial-gradient(56% 42% at 50% 12%, hsl(var(--crimson-deep) / 0.22), transparent 70%), radial-gradient(28% 22% at 50% 6%, hsl(var(--crimson) / 0.14), transparent 75%)",
  ask: "radial-gradient(60% 70% at 50% 108%, hsl(var(--silver-mute) / 0.15), transparent 65%), radial-gradient(30% 24% at 50% 100%, hsl(var(--crimson-deep) / 0.09), transparent 70%)",
} as const;

/** hold-then-release opacity ride: in → hold → out (all fractions of T). */
function fadeThrough(inDur: number, holdDur: number, outDur: number) {
  return [
    { to: 1, duration: inDur * T },
    { to: 1, duration: holdDur * T },
    { to: 0, duration: outDur * T },
  ];
}

export function Atmosphere({
  reduced,
  storyRef,
}: {
  reduced: boolean;
  storyRef: React.RefObject<HTMLElement | null>;
}) {
  const gameRef = useRef<HTMLDivElement>(null);
  const gradeRef = useRef<HTMLDivElement>(null);
  const climbRef = useRef<HTMLDivElement>(null);
  const scoutRef = useRef<HTMLDivElement>(null);
  const askRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (reduced) return;
    const game = gameRef.current;
    const grade = gradeRef.current;
    const climb = climbRef.current;
    const scout = scoutRef.current;
    const ask = askRef.current;

    return runScrollScrub({
      driver: storyRef.current,
      // full traversal: story enters the viewport → story leaves it
      enter: "bottom top",
      leave: "top bottom",
      targets: [game, grade, climb, scout, ask],
      build: (tl) => {
        if (!game || !grade || !climb || !scout || !ask) return;
        /* opacity rides (keyframes) and slow drifts (separate adds) — one
           camera move. All layers start at their JSX opacity: 0. */
        tl.add(game, { opacity: fadeThrough(0.05, 0.09, 0.12) }, 0);
        tl.add(game, { y: ["0%", "-6%"], scale: [1.06, 1], duration: 0.26 * T }, 0);

        tl.add(grade, { opacity: fadeThrough(0.12, 0.08, 0.1) }, 0.14 * T);
        tl.add(grade, { scale: [1.12, 1], duration: 0.3 * T }, 0.14 * T);

        tl.add(climb, { opacity: fadeThrough(0.14, 0.08, 0.1) }, 0.36 * T);
        tl.add(climb, { y: ["8%", "-4%"], duration: 0.32 * T }, 0.36 * T);

        tl.add(scout, { opacity: fadeThrough(0.12, 0.06, 0.08) }, 0.6 * T);
        tl.add(scout, { y: ["6%", "0%"], scale: [1.08, 1], duration: 0.26 * T }, 0.6 * T);

        tl.add(ask, { opacity: [0, 1], duration: 0.14 * T }, 0.8 * T);
        tl.add(ask, { y: ["5%", "0%"], duration: 0.2 * T }, 0.8 * T);
      },
    });
  }, [reduced, storyRef]);

  if (reduced) {
    /* Static editorial: one quiet composite frame — same palette, no motion. */
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(50% 30% at 20% 8%, hsl(var(--silver-mute) / 0.09), transparent 70%), radial-gradient(50% 34% at 80% 46%, hsl(var(--silver-mute) / 0.13), transparent 72%), radial-gradient(60% 40% at 50% 100%, hsl(var(--crimson-deep) / 0.12), transparent 68%)",
          }}
        />
        <div className="grain-overlay" />
      </div>
    );
  }

  /* Sticky canvas: occupies one viewport, pinned for the story's whole
     traversal, pulled out of flow with the negative bottom margin. */
  return (
    <div
      aria-hidden
      className="pointer-events-none sticky top-0 z-0 h-screen overflow-hidden"
      style={{ marginBottom: "-100vh" }}
    >
      <div ref={gameRef} className="absolute inset-0" style={{ background: LAYER_PAINT.game, opacity: 0 }} />
      <div ref={gradeRef} className="absolute inset-0" style={{ background: LAYER_PAINT.grade, opacity: 0 }} />
      <div ref={climbRef} className="absolute inset-0" style={{ background: LAYER_PAINT.climb, opacity: 0 }} />
      <div ref={scoutRef} className="absolute inset-0" style={{ background: LAYER_PAINT.scout, opacity: 0 }} />
      <div ref={askRef} className="absolute inset-0" style={{ background: LAYER_PAINT.ask, opacity: 0 }} />
      <div className="grain-overlay" />
    </div>
  );
}
