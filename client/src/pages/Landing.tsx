import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { CaliberLogo } from "@/components/CaliberLogo";
import { ScrollyStory } from "@/components/scrolly";
import {
  prefersReducedMotion,
  runBootTimeline,
  runPulseLoop,
  runScrollScrub,
  setInitial,
} from "@/lib/motion";

/**
 * Landing — SIGNAL: Career Mode.
 * Hero v2 (Wemby template): vast, quiet, ONE glowing mark on a clean obsidian
 * field (hairline grid + grain — no wallpaper). The chrome CALIBER nameplate
 * sits above the crimson-lit logo mark; thin viewfinder corner brackets frame
 * it, a faint concentric ring rings it, and a small SCROLL cue holds the
 * bottom edge. The mark's radial glow BREATHES (slow anime.js pulse) — the
 * hero's only ambient motion. No HUD, no headline, no form — the information
 * starts at the first scroll beat (scene 00 in components/scrolly).
 *
 * Hero boot (anime.js, ≤1.2s): brackets draw in → nameplate wipes → the mark
 * glows up (opacity + a glow-bloom layer, compositor-only) → SCROLL cue last.
 * Below the fold the page is ONE scroll-driven story — six beats scrubbed by
 * anime.js onScroll over a continuous atmosphere (DESIGN-LANGUAGE §4.5).
 * Reduced motion / timeline failure → the final static frame everywhere.
 */

/* Boot choreography — timeline positions (ms). Ends ≈1.18s (≤1.2s budget). */
const BOOT = {
  bracketsAt: 0, // viewfinder corners draw in
  nameplateAt: 90, // chrome CALIBER wipes in above the mark
  markAt: 240, // the logo mark arrives…
  glowAt: 280, // …and blooms (opacity on the glow layer only)
  ringAt: 320, // the faint concentric ring settles
  cueAt: 860, // SCROLL cue, last
} as const;

/* Nameplate wipe — negative outer insets keep glyph edges unclipped while
   the right inset sweeps 104% → 0% (left→right reveal). */
const NAMEPLATE_CLIP_HIDDEN = "inset(-8% 104% -10% -4%)";
const NAMEPLATE_CLIP_SHOWN = "inset(-8% -4% -10% -4%)";

/* The shield PNG is 1204×650 with the glyph centered at ~47% of the canvas
   width (transparent margins either side). Frame the GLYPH, not the canvas:
   glyph width ≈ 0.88 × glyph height (glyph spans the full image height). */
const MARK_GLYPH_W_RATIO = 0.88;
const MARK_MIN_H = 136;
const MARK_MAX_H = 248;
const MARK_VW_RATIO = 0.4;

/** Reduced-motion preference, sampled once per mount (page-level flag). */
function useReducedMotionPref(): boolean {
  const [reduced] = useState(() => prefersReducedMotion());
  return reduced;
}

/** Responsive pixel height for the hero mark (CaliberLogo needs a number). */
function useMarkHeight(): number {
  const [h, setH] = useState(200);
  useEffect(() => {
    const compute = () =>
      setH(
        Math.round(
          Math.min(MARK_MAX_H, Math.max(MARK_MIN_H, window.innerWidth * MARK_VW_RATIO)),
        ),
      );
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);
  return h;
}

export default function Landing() {
  const reduced = useReducedMotionPref();
  const markH = useMarkHeight();
  const markW = Math.round(markH * MARK_GLYPH_W_RATIO);

  /* --- hero boot (anime.js) — see docblock. Refs mark the timeline slots. */
  const rootRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const bracketsRef = useRef<HTMLDivElement>(null);
  const nameplateWrapRef = useRef<HTMLDivElement>(null);
  const markWrapRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const glowPulseRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const brackets = bracketsRef.current;
    const nameplate = nameplateWrapRef.current;
    const mark = markWrapRef.current;
    const glow = glowRef.current;
    const ring = ringRef.current;
    const cue = cueRef.current;

    return runBootTimeline({
      targets: [brackets, nameplate, mark, glow, ring, cue],
      build: (tl) => {
        if (!brackets || !nameplate || !mark || !glow || !ring || !cue) {
          return; // nothing hidden, nothing animated — final state stands
        }

        /* initial hidden states — inline styles, motion-allowed path only */
        setInitial(brackets, { opacity: 0, scale: 1.08 });
        setInitial(nameplate, { clipPath: NAMEPLATE_CLIP_HIDDEN });
        setInitial(mark, { opacity: 0, scale: 0.95 });
        setInitial(glow, { opacity: 0 });
        setInitial(ring, { opacity: 0 });
        setInitial(cue, { opacity: 0 });

        /* 1 — viewfinder brackets draw in around the empty frame */
        tl.add(brackets, { opacity: 1, scale: 1, duration: 520 }, BOOT.bracketsAt);
        /* 2 — the chrome nameplate wipes in, left→right */
        tl.add(
          nameplate,
          { clipPath: NAMEPLATE_CLIP_SHOWN, duration: 460 },
          BOOT.nameplateAt,
        );
        /* 3 — the mark arrives and blooms (glow layer is opacity-only) */
        tl.add(mark, { opacity: 1, scale: 1, duration: 600 }, BOOT.markAt);
        tl.add(glow, { opacity: 1, duration: 640 }, BOOT.glowAt);
        tl.add(ring, { opacity: 1, duration: 480 }, BOOT.ringAt);
        /* 4 — the quiet exit sign */
        tl.add(cue, { opacity: 1, duration: 320 }, BOOT.cueAt);
      },
    });
  }, []);

  /* The glow BREATHES — a slow heartbeat behind the mark (~5.6s full cycle),
     starting once the boot has bloomed it in. Reduced motion → the static
     mid-intensity frame in the JSX stands. */
  useEffect(() => {
    return runPulseLoop({
      target: glowPulseRef.current,
      props: { opacity: [0.65, 1], scale: [0.98, 1.05] },
      duration: 2800,
      delay: 1200, // wait out the boot bloom
    });
  }, []);

  /* Scroll progress bar — anime.js scrub over the full page (no framer). */
  useLayoutEffect(() => {
    if (reduced) return;
    const bar = progressRef.current;
    return runScrollScrub({
      driver: rootRef.current,
      targets: [bar],
      build: (tl) => {
        if (!bar) return;
        tl.add(bar, { scaleX: [0, 1], duration: 1000, ease: "linear" }, 0);
      },
    });
  }, [reduced]);

  /* overflow-x-clip (not -hidden) on the root: clips horizontal overhang
     WITHOUT creating a scroll container — position:sticky scenes need this. */
  return (
    <div
      ref={rootRef}
      className="relative min-h-screen overflow-x-clip bg-background text-foreground"
    >
      <style>{`
        /* Metal CTA (MetalFx) — the ONE liquid-metal primary per screen.
           (WaitlistForm's "metal" variant depends on this.) */
        .btn-chrome {
          position: relative; overflow: hidden;
          background: linear-gradient(180deg, hsl(var(--silver-hi)) 0%, hsl(var(--silver)) 46%, hsl(var(--silver-lo)) 58%, hsl(var(--silver-hi)) 100%);
          color: hsl(var(--obsidian-0));
          border: 1px solid hsl(var(--crimson) / 0.55);
          box-shadow: 0 2px 12px hsl(var(--crimson-glow)), inset 0 1px 0 hsl(var(--silver-hi) / 0.85);
          transition: box-shadow .2s ease, transform .15s ease;
        }
        .btn-chrome:hover {
          box-shadow: 0 6px 24px hsl(var(--crimson) / 0.5), inset 0 1px 0 hsl(var(--silver-hi) / 0.95);
          transform: translateY(-1px);
        }
        .btn-chrome:active { transform: translateY(0); }
        .btn-chrome::after {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(115deg, transparent 32%, hsl(var(--silver-hi) / 0.65) 48%, transparent 64%);
          background-size: 250% 100%; background-position: 210% 0;
          transition: background-position .65s ease;
        }
        .btn-chrome:hover::after { background-position: -60% 0; }
        .btn-chrome:disabled { opacity: 0.6; cursor: not-allowed; }
        @media (prefers-reduced-motion: reduce) {
          .btn-chrome, .btn-chrome::after { transition: none; }
        }

        /* Silver metal sheen for the nameplate — token-only. */
        .wordmark-metal {
          background-image: linear-gradient(100deg, hsl(var(--silver-mute)) 0%, hsl(var(--silver)) 25%, hsl(var(--silver-hi)) 50%, hsl(var(--silver)) 75%, hsl(var(--silver-mute)) 100%);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }

        /* Subtle background grid — hairlines, faded out radially (Wemby's
           near-black field given the telemetry treatment). */
        .hero-grid {
          background-image:
            linear-gradient(hsl(var(--silver) / 0.05) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--silver) / 0.05) 1px, transparent 1px);
          background-size: 52px 52px;
          -webkit-mask-image: radial-gradient(70% 62% at 50% 46%, black, transparent 88%);
          mask-image: radial-gradient(70% 62% at 50% 46%, black, transparent 88%);
        }

        /* Viewfinder corner brackets — thin, silver, framing the mark. */
        .vf span {
          position: absolute;
          width: clamp(1.1rem, 3.5vw, 1.9rem);
          height: clamp(1.1rem, 3.5vw, 1.9rem);
          border: 0 solid hsl(var(--silver) / 0.55);
        }
        .vf .vf-tl { top: 0; left: 0; border-top-width: 1px; border-left-width: 1px; }
        .vf .vf-tr { top: 0; right: 0; border-top-width: 1px; border-right-width: 1px; }
        .vf .vf-bl { bottom: 0; left: 0; border-bottom-width: 1px; border-left-width: 1px; }
        .vf .vf-br { bottom: 0; right: 0; border-bottom-width: 1px; border-right-width: 1px; }

        /* SCROLL cue — mono whisper + breathing line (Wemby's scroll-hint). */
        .scroll-cue-line {
          display: block;
          width: 1px; height: 28px;
          margin-top: 0.6rem;
          background: hsl(var(--silver) / 0.35);
          transform-origin: top;
          animation: heroScrollLine 2s ease-in-out infinite;
        }
        @keyframes heroScrollLine {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .scroll-cue-line { animation: none; }
        }
      `}</style>

      {/* scroll progress — silver into crimson (anime scrub; hidden when
          reduced — a bar that never moves is noise, not signal) */}
      {!reduced && (
        <div
          ref={progressRef}
          aria-hidden
          className="fixed left-0 right-0 top-0 z-[200] h-[2px] origin-left"
          style={{
            transform: "scaleX(1)",
            background:
              "linear-gradient(90deg, hsl(var(--silver-mute)), hsl(var(--silver)) 55%, hsl(var(--crimson)))",
          }}
        />
      )}

      {/* NAV — quiet telemetry pill: links only, no status chips */}
      <header className="fixed inset-x-0 top-5 z-[150] flex justify-center px-4">
        <nav
          aria-label="Main"
          className="flex items-center gap-1.5 rounded-md border px-2 py-1.5 backdrop-blur-xl"
          style={{
            borderColor: "hsl(var(--line))",
            backgroundColor: "hsl(var(--obsidian-0) / 0.65)",
          }}
        >
          <Link
            href="/pricing"
            className="px-3 py-1.5 font-display text-label uppercase text-muted-foreground transition-colors hover:text-foreground"
            style={{ fontWeight: 500, fontStretch: "70%" }}
            data-testid="button-pricing"
          >
            Pricing
          </Link>
          <Link
            href="/scout"
            className="px-3 py-1.5 font-display text-label uppercase text-muted-foreground transition-colors hover:text-foreground"
            style={{ fontWeight: 500, fontStretch: "70%" }}
            data-testid="button-scout-hub"
          >
            Scout
          </Link>
          <Link
            href="/login"
            className="angle-cut bg-foreground/10 px-3.5 py-1.5 font-display text-label uppercase text-foreground transition-colors hover:bg-foreground/15"
            style={{ fontWeight: 500, fontStretch: "70%" }}
            data-testid="button-login"
          >
            Sign in
          </Link>
        </nav>
      </header>

      <main className="relative z-10">
        {/* HERO — vast and quiet: one glowing mark in a viewfinder frame */}
        <section className="relative isolate flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5 py-24 sm:px-8">
          {/* the field — clean obsidian vastness (the Wemby near-black):
              just the hairline grid and grain. All the life lives in the
              mark's breathing glow. */}
          <div aria-hidden className="hero-grid absolute inset-0 -z-10" />
          <div aria-hidden className="grain-overlay -z-10" />

          {/* the framed mark */}
          <div className="relative">
            {/* glow bloom — the dedicated radial behind the mark. The boot
                animates the OUTER wrapper's opacity (0→1); the breathing
                pulse owns the INNER layer (opacity/scale) — two elements, so
                the tweens never fight. Static state = mid-intensity breath
                (the reduced-motion frame). */}
            <div ref={glowRef} aria-hidden className="absolute inset-[-34%]">
              <div
                ref={glowPulseRef}
                className="h-full w-full"
                style={{
                  opacity: 0.85,
                  /* chrome-first (operator 2026-07-17): a silver-white core
                     carries the bloom; crimson only ghosts the outer rim —
                     a faint warm edge, never the dominant hue. */
                  background:
                    "radial-gradient(50% 50% at 50% 50%, hsl(var(--silver-hi) / 0.55), hsl(var(--silver) / 0.22) 32%, hsl(var(--crimson-deep) / 0.16) 58%, transparent 76%)",
                  filter: "blur(18px)",
                }}
              />
            </div>
            {/* faint concentric ring — anchored on the MARK's center (the
                stage also holds the nameplate above). The wrapper owns the
                centering transform (class, never inline) so the boot's
                opacity tween and its cleanup can't displace it. */}
            <div
              aria-hidden
              className="absolute left-1/2 -translate-x-1/2 translate-y-1/2"
              style={{ bottom: markH / 2 }}
            >
              <div
                ref={ringRef}
                className="aspect-square w-[clamp(19rem,64vw,30rem)] rounded-full border"
                style={{ borderColor: "hsl(var(--silver) / 0.16)" }}
              />
            </div>
            {/* viewfinder corner brackets */}
            <div
              ref={bracketsRef}
              aria-hidden
              className="vf absolute -inset-x-7 -inset-y-8 sm:-inset-x-12 sm:-inset-y-10"
            >
              <span className="vf-tl" />
              <span className="vf-tr" />
              <span className="vf-bl" />
              <span className="vf-br" />
            </div>

            <div className="relative flex flex-col items-center">
              {/* the chrome nameplate — a nameplate, not a billboard */}
              <div ref={nameplateWrapRef}>
                <h1
                  className="wordmark-metal select-none uppercase leading-none"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 900,
                    fontStretch: "125%",
                    letterSpacing: "0.05em",
                    fontSize: "clamp(1.5rem, 0.9rem + 2.4vw, 2.6rem)",
                  }}
                  data-testid="hero-masthead"
                >
                  Caliber
                </h1>
              </div>

              {/* the mark — chrome-lit shield glyph (operator 2026-07-17:
                  metal leads; the glow's faint warm rim is the only red
                  near the mark now). Canvas keys the dark glyph out of its
                  light field, then composites the liquid-metal gradient in. */}
              {/* overflow-hidden clips the PNG's edge-artifact columns
                  (dark strips at the canvas edges recolor otherwise) */}
              <div
                ref={markWrapRef}
                className="relative mt-6 overflow-hidden sm:mt-8"
                style={{ width: markW, height: markH }}
                data-testid="hero-mark"
              >
                <div
                  className="absolute left-1/2 top-1/2"
                  style={{ transform: "translate(-50%, -50%)" }}
                >
                  <CaliberLogo size={markH} chrome />
                </div>
              </div>
            </div>
          </div>

          {/* SCROLL — the only instruction on the screen */}
          <div
            ref={cueRef}
            className="absolute inset-x-0 bottom-6 flex flex-col items-center"
            data-testid="hero-scroll-cue"
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
        </section>

        {/* BELOW THE FOLD — one scroll-driven story (scene 00 carries the
            pitch, waitlist, and telemetry the hero withholds). */}
        <ScrollyStory reduced={reduced} />
      </main>

      {/* FOOTER — the honest line stays */}
      <footer
        className="relative z-10 border-t px-5 py-16 sm:px-8"
        style={{ borderColor: "hsl(var(--line))" }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 grid gap-10 md:grid-cols-4">
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center gap-2.5">
                <CaliberLogo size={34} chrome />
                <span
                  className="wordmark-metal uppercase text-section"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                  }}
                >
                  Caliber
                </span>
              </div>
              <p className="max-w-xs font-body text-sm leading-relaxed text-muted-foreground">
                The performance platform for serious athletes. Track your game,
                earn your rank, get discovered.
              </p>
            </div>
            <div className="space-y-3">
              <h4
                className="font-display text-label uppercase text-foreground"
                style={{ fontWeight: 500, fontStretch: "70%" }}
              >
                Platform
              </h4>
              <Link href="/pricing" className="block font-body text-sm text-muted-foreground transition-colors hover:text-foreground" data-testid="footer-link-pricing">
                Pricing
              </Link>
              <Link href="/scout" className="block font-body text-sm text-muted-foreground transition-colors hover:text-foreground" data-testid="footer-link-scout-hub">
                Scout Hub
              </Link>
            </div>
            <div className="space-y-3">
              <h4
                className="font-display text-label uppercase text-foreground"
                style={{ fontWeight: 500, fontStretch: "70%" }}
              >
                Get Started
              </h4>
              <Link href="/login" className="block font-body text-sm text-muted-foreground transition-colors hover:text-foreground" data-testid="footer-link-sign-in">
                Sign In
              </Link>
              <Link href="/register" className="block font-body text-sm text-muted-foreground transition-colors hover:text-foreground" data-testid="footer-link-create-account">
                Create Account
              </Link>
            </div>
          </div>
          <div
            className="flex flex-col items-center justify-between gap-3 border-t pt-8 sm:flex-row"
            style={{ borderColor: "hsl(var(--line))" }}
          >
            <span
              className="font-display text-label uppercase text-muted-foreground"
              style={{ fontWeight: 500, fontStretch: "70%" }}
            >
              &copy; {new Date().getFullYear()} Caliber Performance Labs
            </span>
            <span
              className="font-display text-label uppercase text-accent"
              style={{ fontWeight: 500, fontStretch: "70%" }}
            >
              caliber.app
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
