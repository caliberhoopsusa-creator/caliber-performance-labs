import { useLayoutEffect, useRef } from "react";
import { runScrollScrub } from "@/lib/motion";
import { METAL_TEXT_STYLE, MonoChip, ScrollScene, SceneHead } from "./shared";

/**
 * Scene 04 — THE SCOUT. A scout-interest meter fills as you scroll, small
 * mono ping chips land (VIEWED YOUR PROFILE · WATCHED FILM · SAVED TO BOARD),
 * and the scene resolves on the big leaned line. Career-mode framing
 * (DESIGN-LANGUAGE §4.5) — the fantasy in copy, the sample data labeled.
 *
 * Meter fill = scaleX on the inner bar (origin-left) — no width animation.
 */

const PINGS = [
  "Viewed your profile",
  "Watched film",
  "Saved to board",
] as const;

/* Big-line wipe — mirrors the hero wordmark treatment (skew overhang safe). */
const LINE_CLIP_HIDDEN = "inset(-10% 104% -12% -6%)";
const LINE_CLIP_SHOWN = "inset(-10% 0% -12% -6%)";

export function SceneScout({ reduced }: { reduced: boolean }) {
  const driverRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLParagraphElement>(null);
  const meterRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const bigWrapRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    if (reduced) return;
    const head = headRef.current;
    const meter = meterRef.current;
    const fill = fillRef.current;
    const bigWrap = bigWrapRef.current;
    const sub = subRef.current;
    const pings = Array.from(
      stageRef.current?.querySelectorAll<HTMLElement>("[data-ping]") ?? [],
    );

    return runScrollScrub({
      driver: driverRef.current,
      targets: [head, meter, fill, bigWrap, sub, ...pings],
      build: (tl) => {
        if (!head || !meter || !fill || !bigWrap || !sub || pings.length === 0)
          return;
        tl.add(head, { opacity: [0, 1], y: [12, 0], duration: 90 }, 0);
        tl.add(meter, { opacity: [0, 1], duration: 90 }, 60);
        /* the interest meter fills for most of the scene */
        tl.add(fill, { scaleX: [0, 1], duration: 560, ease: "inOutSine" }, 120);
        /* pings land as the meter crosses them */
        pings.forEach((ping, i) => {
          tl.add(
            ping,
            {
              opacity: [0, 1],
              y: [14, 0],
              scale: [0.9, 1],
              duration: 80,
              ease: "outExpo",
            },
            200 + i * 160,
          );
        });
        /* resolution — the big leaned line wipes on */
        tl.add(
          bigWrap,
          {
            clipPath: [LINE_CLIP_HIDDEN, LINE_CLIP_SHOWN],
            x: [-14, 0],
            duration: 200,
          },
          720,
        );
        tl.add(sub, { opacity: [0, 1], duration: 90 }, 910);
      },
    });
  }, [reduced]);

  return (
    <ScrollScene
      eyebrow="04 · The Scout"
      heightVh={220}
      reduced={reduced}
      driverRef={driverRef}
      data-testid="scene-scout"
    >
      <div ref={stageRef}>
        <p
          ref={headRef}
          className="max-w-xl font-body text-base leading-relaxed text-muted-foreground"
        >
          A season of verified grades becomes a record a program can trust —
          and programs start watching.
        </p>

        {/* scout interest meter */}
        <div ref={meterRef} className="mt-10 max-w-md">
          <div className="flex items-center justify-between">
            <span
              className="font-display text-label uppercase text-muted-foreground"
              style={{ fontWeight: 500, fontStretch: "70%" }}
            >
              Scout interest
            </span>
            <span
              className="font-mono uppercase text-muted-foreground"
              style={{ fontSize: "var(--text-data)" }}
            >
              Who's watching
            </span>
          </div>
          <div
            className="angle-cut mt-3 h-2.5 border"
            style={{
              backgroundColor: "hsl(var(--obsidian-2))",
              borderColor: "hsl(var(--line))",
            }}
            role="img"
            aria-label="Sample scout interest meter, filling as the season builds"
          >
            <div
              ref={fillRef}
              className="h-full w-full origin-left"
              style={{
                background:
                  "linear-gradient(90deg, hsl(var(--crimson-deep)), hsl(var(--crimson-hot)))",
              }}
            />
          </div>
        </div>

        {/* ping chips */}
        <div className="mt-6 flex flex-wrap gap-2.5">
          {PINGS.map((ping) => (
            <span key={ping} data-ping className="inline-flex">
              <MonoChip>
                <span
                  aria-hidden
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: "hsl(var(--crimson))" }}
                />
                {ping}
              </MonoChip>
            </span>
          ))}
        </div>

        {/* the resolution */}
        <div ref={bigWrapRef} className="mt-12">
          {/* chrome sheen on the line, crimson on the payoff (§4) */}
          <SceneHead className="max-w-3xl" data-testid="scene-scout-line">
            <span style={METAL_TEXT_STYLE}>Get scouted like a</span>{" "}
            <span style={{ color: "hsl(var(--crimson))" }}>video game</span>
            <span style={METAL_TEXT_STYLE}>.</span>
          </SceneHead>
        </div>
        <p
          ref={subRef}
          className="mt-6 max-w-md font-body text-sm leading-relaxed text-muted-foreground"
        >
          Flip "Open to Opportunities" and surface to college programs — your
          record does the talking.
        </p>
      </div>
    </ScrollScene>
  );
}
