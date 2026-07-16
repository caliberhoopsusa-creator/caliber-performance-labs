import { useLayoutEffect, useRef } from "react";
import { runScrollScrub } from "@/lib/motion";
import { ScrollScene } from "./shared";

/**
 * Scene 02 — THE GRADE. The stat line's moment of transformation: the score
 * ring draws itself (stroke-dashoffset scrubbed), the B+ stamps in with a
 * tier-color flash, and two feedback lines slide through. The product's soul.
 *
 * Ring/grade colors come from the grade ramp (--grade-b — a B+ is B-tier,
 * DESIGN-LANGUAGE §3). Only opacity/transform/stroke-dashoffset animate.
 */

/* Ring geometry — r=84 in a 200 viewBox, stroke butt-capped like a gauge. */
const RING_R = 84;
const RING_C = 2 * Math.PI * RING_R; // ≈ 527.8
const GRADE_FILL = 0.88; // B+ — illustrative sample, labeled in scene 01
const RING_OFFSET_FULL = RING_C * (1 - GRADE_FILL);

const FEEDBACK = [
  { marker: "+", tone: "var(--grade-a)", text: "Strong finishing at the rim" },
  { marker: "→", tone: "var(--grade-c)", text: "Get to the line more" },
] as const;

export function SceneGrade({ reduced }: { reduced: boolean }) {
  const driverRef = useRef<HTMLElement>(null);
  const ringWrapRef = useRef<HTMLDivElement>(null);
  const arcRef = useRef<SVGCircleElement>(null);
  const gradeRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLLIElement>(null);
  const line2Ref = useRef<HTMLLIElement>(null);
  const headRef = useRef<HTMLParagraphElement>(null);
  const subRef = useRef<HTMLLIElement>(null);

  useLayoutEffect(() => {
    if (reduced) return;
    const ringWrap = ringWrapRef.current;
    const arc = arcRef.current;
    const grade = gradeRef.current;
    const flash = flashRef.current;
    const line1 = line1Ref.current;
    const line2 = line2Ref.current;
    const head = headRef.current;
    const sub = subRef.current;

    return runScrollScrub({
      driver: driverRef.current,
      targets: [ringWrap, arc, grade, flash, line1, line2, head, sub],
      build: (tl) => {
        if (!ringWrap || !arc || !grade || !flash || !line1 || !line2 || !head || !sub)
          return;
        /* the gauge arrives, then draws — the transformation in real time */
        tl.add(head, { opacity: [0, 1], y: [12, 0], duration: 90 }, 0);
        tl.add(ringWrap, { opacity: [0, 1], scale: [0.92, 1], duration: 110 }, 30);
        tl.add(
          arc,
          {
            strokeDashoffset: [RING_C, RING_OFFSET_FULL],
            duration: 420,
            ease: "inOutQuad",
          },
          120,
        );
        /* THE STAMP — grade slams in with the tier flash (fast beats: the
           whole hit lives inside ~6% of the scene so it feels like impact) */
        tl.add(
          grade,
          { opacity: [0, 1], scale: [1.9, 1], duration: 60, ease: "outExpo" },
          560,
        );
        tl.add(
          flash,
          {
            opacity: [
              { to: 0.9, duration: 25 },
              { to: 0.22, duration: 120 },
            ],
          },
          560,
        );
        /* the why behind the mark */
        tl.add(line1, { opacity: [0, 1], x: [-26, 0], duration: 110 }, 680);
        tl.add(line2, { opacity: [0, 1], x: [26, 0], duration: 110 }, 780);
        tl.add(sub, { opacity: [0, 1], duration: 90 }, 900);
      },
    });
  }, [reduced]);

  return (
    <ScrollScene
      eyebrow="02 · The Grade"
      heightVh={250}
      reduced={reduced}
      driverRef={driverRef}
      data-testid="scene-grade"
    >
      <p
        ref={headRef}
        className="max-w-xl font-body text-base leading-relaxed text-muted-foreground"
      >
        Then the engine answers — a position-weighted grade for every game,
        with the why behind the mark.
      </p>

      <div className="mt-10 flex flex-col items-center gap-10 md:mt-12 md:flex-row md:items-center md:justify-center md:gap-16">
        {/* the score ring — drawn by scroll */}
        <div ref={ringWrapRef} className="relative shrink-0">
          <div
            ref={flashRef}
            aria-hidden
            className="absolute inset-0 rounded-full"
            style={{
              opacity: reduced ? 0.22 : 0,
              background:
                "radial-gradient(50% 50% at 50% 50%, hsl(var(--grade-b) / 0.5), transparent 70%)",
              filter: "blur(6px)",
            }}
          />
          <svg
            viewBox="0 0 200 200"
            className="relative h-[clamp(13rem,40vw,17rem)] w-[clamp(13rem,40vw,17rem)]"
            role="img"
            aria-label="Sample score ring showing a B plus grade"
          >
            {/* chrome bezel — liquid metal as instrument housing (§4).
                Static paint; only the tier arc animates. */}
            <defs>
              <linearGradient id="scrolly-chrome-ring" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="hsl(var(--silver-mute))" />
                <stop offset="0.45" stopColor="hsl(var(--silver-hi))" />
                <stop offset="0.6" stopColor="hsl(var(--silver))" />
                <stop offset="1" stopColor="hsl(var(--silver-mute))" />
              </linearGradient>
            </defs>
            <circle
              cx="100"
              cy="100"
              r={RING_R + 9}
              fill="none"
              stroke="url(#scrolly-chrome-ring)"
              strokeWidth="1.5"
              opacity="0.9"
            />
            <circle
              cx="100"
              cy="100"
              r={RING_R - 9}
              fill="none"
              stroke="url(#scrolly-chrome-ring)"
              strokeWidth="1"
              opacity="0.4"
            />
            <circle
              cx="100"
              cy="100"
              r={RING_R}
              fill="none"
              stroke="hsl(var(--line))"
              strokeWidth="5"
            />
            <circle
              ref={arcRef}
              cx="100"
              cy="100"
              r={RING_R}
              fill="none"
              stroke="hsl(var(--grade-b))"
              strokeWidth="5"
              strokeLinecap="butt"
              strokeDasharray={RING_C}
              strokeDashoffset={RING_OFFSET_FULL}
              transform="rotate(-90 100 100)"
            />
          </svg>
          {/* the grade stamp */}
          <div
            ref={gradeRef}
            className="absolute inset-0 grid place-items-center"
            data-testid="scene-grade-stamp"
          >
            <span
              className="lean select-none uppercase leading-none"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 900,
                fontStretch: "125%",
                fontSize: "clamp(4rem, 12vw, 6rem)",
                color: "hsl(var(--grade-b))",
                textShadow: "0 0 44px hsl(var(--grade-b) / 0.35)",
              }}
            >
              B+
            </span>
          </div>
        </div>

        {/* the why — two feedback lines slide through */}
        <ul className="w-full max-w-sm space-y-4">
          {FEEDBACK.map((f, i) => (
            <li
              key={f.text}
              ref={i === 0 ? line1Ref : line2Ref}
              className="angle-cut gloss flex items-start gap-3 border p-4"
              style={{
                backgroundColor: "hsl(var(--obsidian-1) / 0.85)",
                borderColor: "hsl(var(--line))",
              }}
            >
              <span
                aria-hidden
                className="font-mono"
                style={{ fontSize: "var(--text-data)", color: `hsl(${f.tone})` }}
              >
                {f.marker}
              </span>
              <span className="font-body text-sm leading-relaxed text-foreground/90">
                {f.text}
              </span>
            </li>
          ))}
          <li
            ref={subRef}
            className="list-none pt-2 font-mono uppercase tracking-wider text-muted-foreground"
            style={{ fontSize: "var(--text-data)" }}
          >
            A–F · position-weighted · after every game
          </li>
        </ul>
      </div>
    </ScrollScene>
  );
}
