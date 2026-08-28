import { useLayoutEffect, useRef } from "react";
import { GradeBadge } from "@/components/signal";
import { runScrollScrub, stagger } from "@/lib/motion";
import { ScrollScene, SceneHead, MonoChip } from "./shared";

/**
 * Beat 02 — THE FILM ROOM. The court has fallen away behind a screen; the
 * grade lands. The ring draws to its value, the stat line writes itself out
 * token by token in the telemetry mono voice.
 *
 * HONESTY: the line below is a DEMO and is labelled as one on screen. Per
 * DESIGN-LANGUAGE §1.6 / §7 the video-game feel never invents video-game data —
 * no invented athlete, no invented season, no plausible-looking fake totals
 * presented as real. Live platform numbers live one beat up, in THE GAME.
 */

/** The demo line, as tokens so it can type itself out. Labelled on screen. */
const DEMO_LINE = [
  "28 PTS",
  "9 REB",
  "6 AST",
  "2 STL",
  "11/18 FG",
  "3/6 3PT",
] as const;

/** Demo grade — drives both the badge and how far the ring draws. */
const DEMO_GRADE = "B+";
const RING_FRACTION = 0.86;

export function BeatFilm({ reduced }: { reduced: boolean }) {
  const driverRef = useRef<HTMLElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);

  useLayoutEffect(() => {
    if (reduced) return;
    const root = driverRef.current;
    const ring = ringRef.current;
    if (!root) return;

    const risers = Array.from(root.querySelectorAll<HTMLElement>("[data-rise]"));
    const tokens = Array.from(root.querySelectorAll<HTMLElement>("[data-token]"));

    return runScrollScrub({
      driver: root,
      enter: "bottom top",
      leave: "center center",
      targets: [...risers, ...tokens, ring],
      build: (tl) => {
        if (risers.length > 0) {
          tl.add(risers, { opacity: [0, 1], y: [24, 0], duration: 400, delay: stagger(80) }, 0);
        }
        /* the line writes itself */
        if (tokens.length > 0) {
          tl.add(
            tokens,
            { opacity: [0, 1], x: [-8, 0], duration: 260, delay: stagger(70) },
            220,
          );
        }
        /* the ring draws to the grade — final state is already in the JSX */
        if (ring) {
          tl.add(ring, { strokeDashoffset: [1, 1 - RING_FRACTION], duration: 620 }, 320);
        }
      },
    });
  }, [reduced]);

  return (
    <ScrollScene
      eyebrow="02 · The film room"
      heightVh={210}
      reduced={reduced}
      driverRef={driverRef}
      maxWidth="56rem"
      data-testid="beat-film"
    >
      <div data-rise>
        <SceneHead data-testid="film-headline">
          The tape doesn&rsquo;t{" "}
          <span
            style={{
              color: "hsl(var(--crimson))",
              textShadow: "0 0 40px hsl(var(--crimson-glow))",
            }}
          >
            flatter
          </span>{" "}
          you.
        </SceneHead>
      </div>

      <p
        data-rise
        className="mt-5 max-w-xl font-body text-base leading-relaxed text-muted-foreground"
      >
        Caliber grades every game A&ndash;F across six categories, weighted for
        the position you actually play. Not vibes. Not your best clip. The whole
        line, every night.
      </p>

      <div className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-center sm:gap-12">
        {/* the ring + grade */}
        <div data-rise className="relative shrink-0" data-testid="film-ring">
          <svg
            aria-hidden
            width={168}
            height={168}
            viewBox="0 0 120 120"
            fill="none"
            className="-rotate-90"
          >
            <circle cx={60} cy={60} r={54} stroke="hsl(var(--line))" strokeWidth={6} />
            <circle
              ref={ringRef}
              cx={60}
              cy={60}
              r={54}
              stroke="hsl(var(--grade-b))"
              strokeWidth={6}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - RING_FRACTION}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <GradeBadge grade={DEMO_GRADE} size="lg" data-testid="film-grade" />
          </div>
        </div>

        {/* the line, in the machine-truth voice */}
        <div className="min-w-0">
          <div
            data-rise
            className="flex flex-wrap gap-x-5 gap-y-2 font-mono"
            style={{ fontSize: "var(--text-data)", color: "hsl(var(--silver))" }}
            data-testid="film-statline"
          >
            {DEMO_LINE.map((token) => (
              <span key={token} data-token className="tabular-nums">
                {token}
              </span>
            ))}
          </div>
          <div data-rise className="mt-5">
            <MonoChip tone="crimson">Demo line · not a real athlete</MonoChip>
          </div>
        </div>
      </div>
    </ScrollScene>
  );
}
