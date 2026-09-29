import { useLayoutEffect, useRef } from "react";
import { CaliberLogo } from "@/components/CaliberLogo";
import { runBootTimeline, setInitial } from "@/lib/motion";
import { ScrollScene, SceneHead } from "./shared";

/**
 * Beat 00 — 6:00 AM. The opening frame: an empty gym, one work light, and the
 * chrome nameplate igniting. This is the only beat with a BOOT timeline (it
 * runs on mount, not on scroll) because it is the page's first impression —
 * everything after it is scrubbed by the camera.
 *
 * Boot order (≤1.1s): nameplate wipes left→right → the mark arrives and glows
 * → the line rises → the scroll cue last. Reduced motion skips the whole
 * thing and the JSX's final state stands.
 */

/* Nameplate wipe — negative outer insets keep glyph edges unclipped while the
   right inset sweeps 104% → 0%. */
const CLIP_HIDDEN = "inset(-8% 104% -10% -4%)";
const CLIP_SHOWN = "inset(-8% -4% -10% -4%)";

const BOOT = {
  nameplateAt: 60,
  markAt: 200,
  glowAt: 250,
  lineAt: 520,
  cueAt: 820,
} as const;

export function BeatDawn({ reduced }: { reduced: boolean }) {
  const nameplateRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const nameplate = nameplateRef.current;
    const mark = markRef.current;
    const glow = glowRef.current;
    const line = lineRef.current;
    const cue = cueRef.current;

    return runBootTimeline({
      targets: [nameplate, mark, glow, line, cue],
      build: (tl) => {
        if (!nameplate || !mark || !glow || !line || !cue) return;

        setInitial(nameplate, { clipPath: CLIP_HIDDEN });
        setInitial(mark, { opacity: 0, scale: 0.95 });
        setInitial(glow, { opacity: 0 });
        setInitial(line, { opacity: 0, y: 18 });
        setInitial(cue, { opacity: 0 });

        tl.add(nameplate, { clipPath: CLIP_SHOWN, duration: 460 }, BOOT.nameplateAt);
        tl.add(mark, { opacity: 1, scale: 1, duration: 600 }, BOOT.markAt);
        tl.add(glow, { opacity: 1, duration: 640 }, BOOT.glowAt);
        tl.add(line, { opacity: 1, y: 0, duration: 520 }, BOOT.lineAt);
        tl.add(cue, { opacity: 1, duration: 320 }, BOOT.cueAt);
      },
    });
  }, []);

  return (
    <ScrollScene
      eyebrow="00 · 6:00 AM"
      heightVh={190}
      reduced={reduced}
      maxWidth="48rem"
      data-testid="beat-dawn"
    >
      {/* The cue's breathing line. Colocated with its only consumer — it used to
          live in Landing's <style> block, where deleting the hero silently
          broke it from three files away. */}
      <style>{`
        .scroll-cue-line {
          display: block;
          width: 1px; height: 28px;
          margin-top: 0.6rem;
          background: hsl(var(--silver) / 0.35);
          transform-origin: top;
          animation: dawnScrollLine 2s ease-in-out infinite;
        }
        @keyframes dawnScrollLine {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .scroll-cue-line { animation: none; }
        }
      `}</style>
      <div className="flex flex-col items-center text-center">
        {/* the mark, lit by the one work light */}
        <div className="relative">
          <div ref={glowRef} aria-hidden className="absolute inset-[-40%]">
            <div
              className="h-full w-full"
              style={{
                opacity: 0.8,
                background:
                  "radial-gradient(50% 50% at 50% 50%, hsl(var(--silver-hi) / 0.42), hsl(var(--silver) / 0.16) 36%, transparent 72%)",
                filter: "blur(20px)",
              }}
            />
          </div>
          <div ref={markRef} className="relative" data-testid="dawn-mark">
            <CaliberLogo size={132} chrome />
          </div>
        </div>

        <div ref={nameplateRef} className="mt-7">
          <h1
            className="wordmark-metal select-none uppercase leading-none"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 900,
              fontStretch: "125%",
              letterSpacing: "0.05em",
              fontSize: "clamp(1.4rem, 0.9rem + 2.2vw, 2.4rem)",
            }}
            data-testid="dawn-masthead"
          >
            Caliber
          </h1>
        </div>

        <div ref={lineRef} className="mt-10">
          <SceneHead data-testid="dawn-headline">Nobody is watching yet.</SceneHead>
          <p className="mx-auto mt-5 max-w-lg font-body text-base leading-relaxed text-muted-foreground">
            Empty gym. No crowd, no cameras, nobody keeping score. The work
            still counts — this is where it starts getting counted.
          </p>
        </div>
      </div>

      {/* the only instruction on the opening screen */}
      <div
        ref={cueRef}
        className="mt-16 flex flex-col items-center"
        data-testid="dawn-scroll-cue"
      >
        <span
          className="font-mono uppercase"
          style={{
            fontSize: "var(--text-data)",
            letterSpacing: "0.3em",
            color: "hsl(var(--silver-mute))",
          }}
        >
          Scroll
        </span>
        <span aria-hidden className="scroll-cue-line" />
      </div>
    </ScrollScene>
  );
}
