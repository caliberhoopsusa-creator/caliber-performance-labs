import { useEffect, useState } from "react";

/**
 * Shared motion hooks for SIGNAL components — broadcast count-up numerals
 * (`--ease-out-expo` in JS form) that collapse to a static final frame under
 * prefers-reduced-motion.
 */

const COUNT_UP_MS = 900;

/** ease-out-expo — matches --ease-out-expo for JS-driven motion */
function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/**
 * Animates 0 → value on mount (and on value change). Returns the current
 * frame value; returns the final value immediately under reduced motion.
 */
export function useCountUp(value: number, durationMs = COUNT_UP_MS): number {
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setDisplay(value * easeOutExpo(t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs, reduced]);

  return display;
}
