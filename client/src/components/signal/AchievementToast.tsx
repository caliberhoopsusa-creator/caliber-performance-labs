import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate, createTimeline } from "animejs";
import { usePrefersReducedMotion } from "./useCountUp";

/**
 * AchievementToast — the console "BADGE UNLOCKED" sweep toast
 * (DESIGN-LANGUAGE §4.5 Console Layer / §5 signature components).
 *
 * An angle-cut obsidian-2 plate with a crimson edge: condensed-caps eyebrow
 * ("BADGE UNLOCKED"), Archivo title ("Sharpshooter II"), optional telemetry
 * detail line. Slides in on an anime.js timeline (translateX + opacity,
 * ~500ms outExpo) with a single gloss sweep, holds ~4s, slides out.
 *
 * REAL EVENTS ONLY — this component renders exactly what it is given and has
 * no demo mode. Callers must NEVER fabricate unlocks: every push must come
 * from a real, server-confirmed event (badge award, career high, completed
 * goal, tier promotion). The video-game feel never invents video-game data.
 *
 * Queue-safe API: `pushAchievementToast()` enqueues from anywhere; the host
 * rate-limits to exactly ONE visible toast at a time and drains the queue in
 * order. Mount a single <AchievementToastHost /> on any surface that fires
 * unlocks. Reduced motion → static appear/disappear (no sweep, no slide).
 *
 * NOTE(dedup): the enter/exit choreography is inlined here rather than added
 * to lib/motion.ts (that file is owned by the landing work in flight) —
 * fold into a shared toast-timeline helper later.
 */

export interface AchievementToastEvent {
  /** Condensed-caps category, e.g. "BADGE UNLOCKED", "CAREER HIGH". */
  eyebrow: string;
  /** The unlock name, e.g. "Sharpshooter II". */
  title: string;
  /** Optional supporting detail line (telemetry voice). */
  detail?: string;
}

const VISIBLE_MS = 4000;
const ENTER_MS = 500;
const EXIT_MS = 300;
/** Hard cap so a pathological caller can't stack minutes of toasts. */
const MAX_QUEUE = 12;

let queue: readonly AchievementToastEvent[] = [];
let hostNotify: (() => void) | null = null;

/**
 * Enqueue a REAL unlock event. Shows immediately if nothing is visible;
 * otherwise waits its turn (one toast on screen at a time).
 */
export function pushAchievementToast(event: AchievementToastEvent): void {
  if (queue.length >= MAX_QUEUE) return;
  queue = [...queue, event];
  hostNotify?.();
}

/**
 * The singleton viewport that renders the queue. Mount exactly one per
 * surface that fires unlocks (it is a persistent polite live region, so
 * screen readers announce each unlock as it lands).
 */
export function AchievementToastHost() {
  const reduced = usePrefersReducedMotion();
  const [current, setCurrent] = useState<AchievementToastEvent | null>(null);
  const [queueTick, setQueueTick] = useState(0);
  const plateRef = useRef<HTMLDivElement>(null);
  const sheenRef = useRef<HTMLDivElement>(null);

  // Wire the module-level queue to this host.
  useEffect(() => {
    hostNotify = () => setQueueTick((t) => t + 1);
    // Catch anything queued before mount.
    if (queue.length > 0) setQueueTick((t) => t + 1);
    return () => {
      hostNotify = null;
    };
  }, []);

  // Pull the next event whenever idle and the queue has work.
  useEffect(() => {
    if (current !== null || queue.length === 0) return;
    const [next, ...rest] = queue;
    queue = rest;
    setCurrent(next);
  }, [current, queueTick]);

  // Per-toast lifecycle: enter sweep → hold → exit → release the slot.
  useLayoutEffect(() => {
    if (!current) return;
    const plate = plateRef.current;
    const sheen = sheenRef.current;
    let dismissTimer = 0;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      setCurrent(null);
    };

    if (!reduced && plate) {
      try {
        const tl = createTimeline({ defaults: { ease: "outExpo" } });
        tl.add(plate, { x: [-32, 0], opacity: [0, 1], duration: ENTER_MS }, 0);
        if (sheen) {
          tl.add(
            sheen,
            {
              x: ["-130%", "130%"],
              opacity: [
                { to: 0.6, duration: 80, ease: "linear" },
                { to: 0, duration: 520, ease: "linear" },
              ],
              duration: 600,
              ease: "linear",
            },
            120,
          );
        }
      } catch {
        // Static appear — the plate is already at its final state in JSX.
      }
    }

    dismissTimer = window.setTimeout(() => {
      if (reduced || !plate) {
        finish();
        return;
      }
      try {
        animate(plate, {
          x: 24,
          opacity: 0,
          duration: EXIT_MS,
          ease: "outExpo",
          onComplete: finish,
        });
      } catch {
        finish();
      }
    }, VISIBLE_MS);

    return () => window.clearTimeout(dismissTimer);
  }, [current, reduced]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed left-1/2 top-4 z-[100] w-[min(92vw,30rem)] -translate-x-1/2"
      data-testid="achievement-toast-viewport"
    >
      {current && (
        <div
          ref={plateRef}
          className="angle-cut gloss relative overflow-hidden border border-line bg-obsidian-2 py-3 pl-5 pr-4"
          style={{ boxShadow: "0 0 24px hsl(var(--crimson-glow))" }}
          data-testid="achievement-toast"
        >
          {/* Crimson edge */}
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 w-1 bg-crimson"
          />
          {/* Gloss sweep — decorative, motion path only */}
          <div
            ref={sheenRef}
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-1/3 opacity-0"
            style={{
              background:
                "linear-gradient(105deg, transparent, hsl(0 0% 100% / 0.16), transparent)",
            }}
          />
          <p className="font-display text-label uppercase text-crimson" style={{ fontWeight: 500, fontStretch: "70%" }}>
            {current.eyebrow}
          </p>
          <p
            className="mt-0.5 truncate text-lg uppercase leading-tight text-silver-hi"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontStretch: "115%",
              letterSpacing: "-0.01em",
            }}
          >
            {current.title}
          </p>
          {current.detail && (
            <p className="mt-0.5 truncate font-mono text-data text-silver-lo">
              {current.detail}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
