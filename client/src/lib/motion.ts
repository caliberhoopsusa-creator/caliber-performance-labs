import { createTimeline, stagger, utils } from "animejs";
import type { Timeline } from "animejs";

const animeSet = utils.set;

/**
 * motion — the anime.js wrapper for choreographed timelines.
 *
 * Engine roles (DESIGN-LANGUAGE §1.5): anime.js owns choreographed timelines —
 * hero boot sequences, unlock/toast moments, staggered set-piece reveals.
 * framer-motion owns scroll-triggered reveals. Never both on the same element.
 *
 * Discipline this module enforces:
 * - Compositor-only properties: transform / opacity / clip-path
 *   (`CompositorProps` is the whole vocabulary — no layout properties exist).
 * - `prefers-reduced-motion` → the timeline is SKIPPED entirely and content
 *   stays at its final, fully-visible state.
 * - Content is never stranded hidden: initial states are inline styles applied
 *   only on the motion-allowed path (never CSS classes), and they are cleared
 *   if the timeline fails or the owning component unmounts.
 */

export { stagger };
export type { Timeline };

/** anime's outExpo — the JS-side voice of --ease-out-expo. */
export const EASE_OUT_EXPO = "outExpo";

/** Default tween length for boot steps — broadcast-snappy (DESIGN-LANGUAGE §1.5). */
const DEFAULT_DURATION_MS = 500;

/** One property keyframe, e.g. a flicker step: `{ to: 0.35, duration: 55 }`. */
export interface MotionKeyframe {
  to: number | string;
  duration?: number;
  ease?: string;
}

type MotionValue =
  | number
  | string
  | readonly [number | string, number | string]
  | readonly MotionKeyframe[];

/** The compositor-safe subset — transform, opacity, clip-path. Nothing else. */
export interface CompositorProps {
  opacity?: MotionValue;
  /** translateX (px unless a unit string is given) */
  x?: MotionValue;
  /** translateY (px unless a unit string is given) */
  y?: MotionValue;
  scale?: MotionValue;
  rotate?: MotionValue;
  skewX?: MotionValue;
  clipPath?: MotionValue;
}

/** Tween options that ride along with the props in a timeline step. */
export interface CompositorTween extends CompositorProps {
  duration?: number;
  delay?: number | ReturnType<typeof stagger>;
  ease?: string;
}

export type BootTarget = HTMLElement | null | undefined;

type AnimeParams = Parameters<typeof animeSet>[1];

function toElements(
  target: BootTarget | readonly BootTarget[],
): HTMLElement[] {
  const list = Array.isArray(target) ? target : [target];
  return list.filter((el): el is HTMLElement => el instanceof HTMLElement);
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return true; // no runtime signal → don't animate; final state renders
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Apply an initial (pre-boot) state as inline styles. Call ONLY inside a
 * `runBootTimeline` build callback — i.e. only when motion is allowed — so
 * content is never hidden for reduced-motion users or when JS can't animate.
 */
export function setInitial(
  target: BootTarget | readonly BootTarget[],
  props: CompositorProps,
): void {
  const els = toElements(target);
  if (els.length > 0) animeSet(els, props as AnimeParams);
}

/** Clear every inline style a boot may have set — the final, visible state. */
function restoreFinalState(els: readonly HTMLElement[]): void {
  for (const el of els) {
    el.style.removeProperty("opacity");
    el.style.removeProperty("transform");
    el.style.removeProperty("clip-path");
  }
}

export interface BootTimelineOptions {
  /**
   * Every element the boot hides — restored to the final state if the
   * timeline is skipped, fails, or is cleaned up mid-flight.
   */
  targets: ReadonlyArray<BootTarget>;
  /** Choreograph the timeline. Runs only when motion is allowed. */
  build: (tl: Timeline) => void;
  /**
   * Runs when the boot is skipped (reduced motion / no matchMedia) or fails —
   * reveal any UI gated on timeline progress here.
   */
  onSkip?: () => void;
}

/**
 * Run a one-shot boot timeline (autoplays immediately). Returns a cleanup
 * function suited to `useEffect`/`useLayoutEffect`: it cancels the timeline
 * and clears the inline motion styles.
 *
 * Under `prefers-reduced-motion` the build never runs — nothing is hidden and
 * the page renders its final state (a single static frame).
 */
export function runBootTimeline({
  targets,
  build,
  onSkip,
}: BootTimelineOptions): () => void {
  const els = toElements(targets);

  if (prefersReducedMotion()) {
    onSkip?.();
    return () => {};
  }

  let tl: Timeline | undefined;
  try {
    tl = createTimeline({
      defaults: { ease: EASE_OUT_EXPO, duration: DEFAULT_DURATION_MS },
    });
    build(tl);
  } catch (error) {
    // Never strand the page hidden — resolve straight to the final state.
    restoreFinalState(els);
    onSkip?.();
    console.error("[motion] boot timeline failed — rendered final state", error);
    return () => {};
  }

  return () => {
    tl?.cancel();
    restoreFinalState(els);
  };
}
