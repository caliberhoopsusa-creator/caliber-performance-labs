import { createTimeline, onScroll, stagger, utils } from "animejs";
import type { ScrollObserver, Timeline } from "animejs";

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

/** Timeline targets — HTML or SVG (score rings scrub stroke-dashoffset). */
export type BootTarget = HTMLElement | SVGElement | null | undefined;

type AnimeParams = Parameters<typeof animeSet>[1];

function toElements(
  target: BootTarget | readonly BootTarget[],
): (HTMLElement | SVGElement)[] {
  const list = Array.isArray(target) ? target : [target];
  return list.filter(
    (el): el is HTMLElement | SVGElement =>
      el instanceof HTMLElement || el instanceof SVGElement,
  );
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
function restoreFinalState(els: ReadonlyArray<HTMLElement | SVGElement>): void {
  for (const el of els) {
    el.style.removeProperty("opacity");
    el.style.removeProperty("transform");
    el.style.removeProperty("clip-path");
    el.style.removeProperty("stroke-dashoffset");
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

/* ------------------------------------------------------------------ */
/* scroll scrub — anime.js onScroll (scrollytelling scenes)            */
/* ------------------------------------------------------------------ */

/**
 * Scroll-scrub discipline (DESIGN-LANGUAGE §4.5 — marketing scrollytelling):
 * - The timeline is LINKED to scroll (`sync`), never time — scrolling back
 *   scrubs it back. Pinning is CSS `position: sticky` only; no scroll-jacking.
 * - Every tween uses `[from, to]` tuples so the JSX renders the FINAL state:
 *   reduced motion, an observer failure, or no-JS all resolve to the finished
 *   editorial layout — content is never stranded hidden.
 * - Same compositor-only vocabulary as boots (+ `strokeDashoffset` for SVG
 *   line drawing, which is paint-only on the SVG layer).
 */

export interface ScrollScrubOptions {
  /**
   * The tall scene wrapper whose traversal through the viewport drives
   * progress (the element the sticky stage lives inside).
   */
  driver: BootTarget;
  /** Every element the scrub styles — restored to final state on cleanup/failure. */
  targets: ReadonlyArray<BootTarget>;
  /** Choreograph the timeline. Runs only when motion is allowed. */
  build: (tl: Timeline) => void;
  /** anime.js threshold "container target" — default: sticky engages. */
  enter?: string;
  /** anime.js threshold "container target" — default: sticky releases. */
  leave?: string;
  /** true = hard-linked scrub · number = smoothed follow (see anime docs). */
  sync?: boolean | number;
  /** Runs when the scrub is skipped (reduced motion) or fails. */
  onSkip?: () => void;
}

/**
 * Link a timeline to an element's scroll traversal. Returns a cleanup
 * function suited to `useLayoutEffect`. Under `prefers-reduced-motion` the
 * build never runs — the static final state (already in the JSX) stands.
 */
export function runScrollScrub({
  driver,
  targets,
  build,
  enter = "top top",
  leave = "bottom bottom",
  sync = true,
  onSkip,
}: ScrollScrubOptions): () => void {
  const els = toElements(targets);

  if (!driver || prefersReducedMotion()) {
    onSkip?.();
    return () => {};
  }

  let observer: ScrollObserver | undefined;
  let tl: Timeline | undefined;
  try {
    observer = onScroll({ target: driver, enter, leave, sync });
    tl = createTimeline({
      autoplay: observer,
      defaults: { ease: "linear", duration: DEFAULT_DURATION_MS },
    });
    build(tl);
  } catch (error) {
    observer?.revert();
    tl?.cancel();
    restoreFinalState(els);
    onSkip?.();
    console.error("[motion] scroll scrub failed — rendered final state", error);
    return () => {};
  }

  return () => {
    observer?.revert();
    tl?.cancel();
    restoreFinalState(els);
  };
}

/**
 * Scrub a numeric text readout (e.g. a rank counter). The element's JSX
 * should render the FINAL value; the tween rewrites `textContent` frame by
 * frame while scrubbing. Rounded — pair with `tabular-nums`.
 */
export function addTextCounter(
  tl: Timeline,
  el: BootTarget,
  {
    from,
    to,
    duration,
    at,
    format = (n) => String(n),
  }: {
    from: number;
    to: number;
    duration: number;
    at: number;
    format?: (n: number) => string;
  },
): void {
  if (!el) return;
  const state = { value: from };
  el.textContent = format(from);
  tl.add(
    state,
    {
      value: to,
      duration,
      ease: "linear",
      modifier: utils.round(0),
      onUpdate: () => {
        el.textContent = format(state.value);
      },
    },
    at,
  );
}
