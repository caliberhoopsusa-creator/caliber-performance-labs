import { useLayoutEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
} from "framer-motion";
import { Link } from "wouter";
import { CaliberLogo } from "@/components/CaliberLogo";
import { WaitlistForm } from "@/components/WaitlistForm";
import { ScrollyStory } from "@/components/scrolly";
import {
  TelemetryStrip,
  PlayerCard,
  PlasmaField,
  type TelemetryItem,
} from "@/components/signal";
import { runBootTimeline, setInitial, stagger } from "@/lib/motion";

/**
 * Landing — SIGNAL: Career Mode.
 * Obsidian-first (crimson is earned). One hero moment: the leaned CALIBER
 * wordmark + a labeled DEMO PlayerCard over the plasma attract screen.
 * All color/type through tokens — no raw hex, no arbitrary font values.
 *
 * Hero boot: one anime.js timeline choreographs the attract-screen power-on
 * (SYSTEM ONLINE flicker → wordmark clip-path wipe → staggered rise → card
 * lands + OVR count-up → telemetry). Below the fold, the page is ONE
 * scroll-driven story — five scenes scrubbed by anime.js onScroll over a
 * continuous gradient atmosphere (components/scrolly, DESIGN-LANGUAGE §4.5).
 * framer-motion keeps only the scroll progress bar — the two engines never
 * share an element (§1.5). Reduced motion / timeline failure → the final
 * static frame everywhere.
 */

/* Boot choreography — timeline positions (ms). Ends ≈1.44s (≤1.6s budget). */
const BOOT = {
  chipAt: 0, // SYSTEM ONLINE flicker-on
  wordmarkAt: 100, // CALIBER wipe + lean settle
  riseAt: 300, // chip / headline / subhead / form stagger
  riseStaggerMs: 90,
  cardAt: 520, // PlayerCard slides in; count-up restarts here
  telemetryAt: 1080, // TelemetryStrip, last
} as const;

/* Wordmark wipe — negative outer insets keep the skew overhang + text glow
   unclipped; the right inset sweeps 106% → 0% (left→right reveal). */
const WORDMARK_CLIP_HIDDEN = "inset(-10% 106% -12% -6%)";
const WORDMARK_CLIP_SHOWN = "inset(-10% 0% -12% -6%)";

/* ------------------------------------------------------------------ */
/* primitives                                                          */
/* ------------------------------------------------------------------ */

/** Angle-cut condensed-caps chip — the console status pill. */
function AngleChip({
  children,
  tone = "silver",
  className = "",
  chipRef,
  "data-testid": testId,
}: {
  children: React.ReactNode;
  tone?: "crimson" | "silver";
  className?: string;
  /** For boot-timeline targeting (e.g. the SYSTEM ONLINE flicker). */
  chipRef?: React.Ref<HTMLSpanElement>;
  "data-testid"?: string;
}) {
  const isCrimson = tone === "crimson";
  return (
    <span
      ref={chipRef}
      className={`angle-cut inline-flex items-center gap-2 border px-3 py-1.5 font-display text-label uppercase ${className}`}
      style={{
        fontWeight: 500,
        fontStretch: "70%",
        color: isCrimson ? "hsl(var(--crimson-hot))" : "hsl(var(--silver))",
        borderColor: isCrimson ? "hsl(var(--crimson) / 0.45)" : "hsl(var(--line))",
        backgroundColor: isCrimson ? "hsl(var(--crimson) / 0.08)" : "hsl(var(--obsidian-2) / 0.7)",
      }}
      data-testid={testId}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* content                                                             */
/* ------------------------------------------------------------------ */

/* Labeled product demo — sample data only, never presented as a real player. */
const DEMO_PLAYER = {
  name: "Your Name Here",
  position: "PG",
  jerseyNumber: "00",
  school: "Your School · Montana",
  score: 91,
  attributes: [
    { label: "Scoring", value: 88 },
    { label: "Playmaking", value: 84 },
    { label: "Defense", value: 79 },
    { label: "Rebounding", value: 74 },
  ],
};

/* ------------------------------------------------------------------ */
/* page                                                                */
/* ------------------------------------------------------------------ */

export default function Landing() {
  const reduced = useReducedMotion();
  const { data: platformStats } = useQuery<{
    playerCount: number;
    gameCount: number;
    badgeCount: number;
    coachCount: number;
  }>({
    queryKey: ["/api/public/platform-stats"],
  });

  const { scrollYProgress } = useScroll();
  const progressX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

  /* --- hero boot (anime.js) — see docblock. Refs mark the timeline slots. */
  const systemChipRef = useRef<HTMLSpanElement>(null);
  const wordmarkWrapRef = useRef<HTMLDivElement>(null);
  const heroLeftRef = useRef<HTMLDivElement>(null); // owns [data-boot-rise] items
  const cardShellRef = useRef<HTMLDivElement>(null);
  const telemetryRef = useRef<HTMLDivElement>(null);
  /* Bumping this key remounts the PlayerCard, restarting its OVR count-up
     exactly when the card lands — the signal components stay untouched. */
  const [cardBootKey, setCardBootKey] = useState(0);

  useLayoutEffect(() => {
    const chip = systemChipRef.current;
    const wordmark = wordmarkWrapRef.current;
    const card = cardShellRef.current;
    const strip = telemetryRef.current;
    const risers = Array.from(
      heroLeftRef.current?.querySelectorAll<HTMLElement>("[data-boot-rise]") ??
        [],
    );

    return runBootTimeline({
      targets: [chip, wordmark, card, strip, ...risers],
      build: (tl) => {
        if (!chip || !wordmark || !card || !strip || risers.length === 0) {
          return; // nothing hidden, nothing animated — final state stands
        }

        /* initial hidden states — inline styles, motion-allowed path only */
        setInitial(chip, { opacity: 0 });
        setInitial(wordmark, { clipPath: WORDMARK_CLIP_HIDDEN, x: -18, skewX: -3 });
        setInitial(risers, { opacity: 0, y: 14 });
        setInitial(card, { opacity: 0, y: 32 });
        setInitial(strip, { opacity: 0 });

        /* 1 — SYSTEM ONLINE: CRT flicker-on (dot keeps its CSS ping after) */
        tl.add(
          chip,
          {
            opacity: [
              { to: 1, duration: 45 },
              { to: 0.35, duration: 55 },
              { to: 1, duration: 60 },
              { to: 0.55, duration: 45 },
              { to: 1, duration: 75 },
            ],
            ease: "linear",
          },
          BOOT.chipAt,
        );
        /* 2 — CALIBER: left→right wipe + lean settle. The wrapper animates so
           the h1's own .lean skew is never fought (transform composition). */
        tl.add(
          wordmark,
          { clipPath: WORDMARK_CLIP_SHOWN, x: 0, skewX: 0, duration: 620 },
          BOOT.wordmarkAt,
        );
        /* 3 — founding chip / headline / subhead / form: staggered rise */
        tl.add(
          risers,
          { opacity: 1, y: 0, duration: 520, delay: stagger(BOOT.riseStaggerMs) },
          BOOT.riseAt,
        );
        /* 4 — PlayerCard slides up + settles; OVR count-up starts as it lands */
        tl.add(card, { opacity: 1, y: 0, duration: 600 }, BOOT.cardAt);
        tl.call(() => setCardBootKey((k) => k + 1), BOOT.cardAt);
        /* 5 — telemetry strip, last */
        tl.add(strip, { opacity: 1, duration: 360 }, BOOT.telemetryAt);
      },
    });
  }, []);

  // Hero telemetry — product truths + live platform numbers (real, never inflated).
  const telemetry: TelemetryItem[] = [
    { label: "Grade scale", value: "A–F" },
    { label: "Categories", value: 6 },
    { label: "Time to log", value: "<2 min" },
    ...(platformStats
      ? [
          { label: "Athletes", value: platformStats.playerCount },
          { label: "Games graded", value: platformStats.gameCount },
        ]
      : []),
  ];

  /* overflow-x-clip (not -hidden) on the root: clips horizontal overhang
     WITHOUT creating a scroll container — position:sticky scenes need this. */
  return (
    <div className="relative min-h-screen overflow-x-clip bg-background text-foreground">
      <style>{`
        /* Metal CTA (MetalFx) — the ONE liquid-metal primary per screen. */
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

        /* Obsidian-first hero — concentrated crimson atmosphere above/behind
           the wordmark; the rest of the field stays obsidian. */
        .hero-atmosphere {
          background:
            radial-gradient(56% 42% at 50% 8%, hsl(var(--crimson-deep) / 0.34), transparent 70%),
            radial-gradient(30% 24% at 50% 2%, hsl(var(--crimson) / 0.22), transparent 75%),
            radial-gradient(44% 40% at 82% 52%, hsl(var(--crimson-deep) / 0.14), transparent 72%);
        }

        /* Silver metal sheen for the wordmark — token-only. */
        .wordmark-metal {
          background-image: linear-gradient(100deg, hsl(var(--silver-mute)) 0%, hsl(var(--silver)) 25%, hsl(var(--silver-hi)) 50%, hsl(var(--silver)) 75%, hsl(var(--silver-mute)) 100%);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
      `}</style>

      {/* scroll progress — silver into crimson */}
      <motion.div
        aria-hidden
        className="fixed left-0 right-0 top-0 z-[200] h-[2px] origin-left"
        style={{
          scaleX: progressX,
          background:
            "linear-gradient(90deg, hsl(var(--silver-mute)), hsl(var(--silver)) 55%, hsl(var(--crimson)))",
        }}
      />

      {/* NAV — telemetry pill with angle-cut chips */}
      <header className="fixed inset-x-0 top-5 z-[150] flex justify-center px-4">
        <nav
          aria-label="Main"
          className="flex items-center gap-1.5 rounded-md border px-2 py-1.5 backdrop-blur-xl"
          style={{
            borderColor: "hsl(var(--line))",
            backgroundColor: "hsl(var(--obsidian-0) / 0.65)",
          }}
        >
          <AngleChip tone="crimson" chipRef={systemChipRef}>
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            System online
          </AngleChip>
          <Link
            href="/pricing"
            className="hidden px-3 py-1.5 font-display text-label uppercase text-muted-foreground transition-colors hover:text-foreground sm:block"
            style={{ fontWeight: 500, fontStretch: "70%" }}
            data-testid="button-pricing"
          >
            Pricing
          </Link>
          <Link
            href="/scout"
            className="hidden px-3 py-1.5 font-display text-label uppercase text-muted-foreground transition-colors hover:text-foreground sm:block"
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
        {/* HERO — the wordmark + player-card moment on an obsidian field */}
        <section className="relative isolate overflow-hidden px-5 pb-16 pt-32 sm:px-8 md:pb-24 md:pt-40">
          {/* dithered chrome plasma — the attract-screen backdrop; a veil
              keeps text contrast and melts it into obsidian below the fold */}
          <div aria-hidden className="absolute inset-0 -z-10">
            <PlasmaField className="absolute inset-0 opacity-60" pixelSize={9} />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, hsl(var(--obsidian-0) / 0.92) 0%, hsl(var(--obsidian-0) / 0.72) 42%, hsl(var(--obsidian-0) / 0.35) 100%), linear-gradient(180deg, hsl(var(--obsidian-0) / 0.55) 0%, hsl(var(--obsidian-0) / 0.25) 45%, hsl(var(--obsidian-0)) 100%)",
              }}
            />
          </div>
          <div aria-hidden className="grain-overlay -z-10" />

          <div className="mx-auto grid w-full max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
            {/* left — identity + pitch + waitlist. Boot-timeline territory:
                anime.js only here — framer-motion never touches these. */}
            <div ref={heroLeftRef} className="flex flex-col items-start">
              <div data-boot-rise>
                <AngleChip tone="crimson" data-testid="chip-founding-class">
                  Founding class open
                </AngleChip>
              </div>

              {/* wipe/settle animates this wrapper — never the skewed h1 */}
              <div ref={wordmarkWrapRef}>
                <h1
                  className="lean wordmark-metal mt-8 select-none uppercase leading-none text-hero"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 900,
                    fontStretch: "125%",
                    letterSpacing: "-0.03em",
                  }}
                  data-testid="hero-masthead"
                >
                  Caliber
                </h1>
              </div>

              <p
                data-boot-rise
                className="mt-6 uppercase leading-none text-title"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 900,
                  fontStretch: "125%",
                  letterSpacing: "-0.01em",
                }}
              >
                Every game,{" "}
                <span
                  style={{
                    color: "hsl(var(--crimson))",
                    textShadow: "0 0 40px hsl(var(--crimson-glow))",
                  }}
                >
                  graded.
                </span>
              </p>

              <p
                data-boot-rise
                className="mt-5 max-w-md font-body text-base leading-relaxed text-muted-foreground"
              >
                Your season, played like career mode. Log the game, watch your
                Caliber Score move, and build the graded record that gets you
                scouted — every number earned on the floor.
              </p>

              <div data-boot-rise className="mt-8 w-full">
                <div id="join">
                  <WaitlistForm source="landing-hero" variant="console" />
                  <p
                    className="mt-3 font-display text-label uppercase text-muted-foreground"
                    style={{ fontWeight: 500, fontStretch: "70%" }}
                  >
                    Free to start · No credit card · Be one of the first
                  </p>
                </div>
              </div>
            </div>

            {/* right — the Career Mode proof moment (labeled DEMO). Slides in
                on the boot timeline; the key-remount restarts the OVR count-up
                the moment the card lands (no signal-component edits). */}
            <div ref={cardShellRef} className="mx-auto w-full max-w-sm lg:max-w-md">
              <div style={{ transform: reduced ? undefined : "perspective(1200px) rotateY(-4deg)" }}>
                <PlayerCard
                  key={`boot-${cardBootKey}`}
                  name={DEMO_PLAYER.name}
                  position={DEMO_PLAYER.position}
                  jerseyNumber={DEMO_PLAYER.jerseyNumber}
                  school={DEMO_PLAYER.school}
                  score={DEMO_PLAYER.score}
                  attributes={DEMO_PLAYER.attributes}
                  demo
                  data-testid="hero-player-card"
                  footer={
                    <p
                      className="font-mono text-muted-foreground"
                      style={{ fontSize: "var(--text-data)" }}
                    >
                      PRODUCT DEMO · sample data — your real games go here
                    </p>
                  }
                />
              </div>
            </div>
          </div>

          {/* hero telemetry — product truths + live platform numbers */}
          <div ref={telemetryRef} className="mx-auto mt-14 max-w-6xl">
            <TelemetryStrip items={telemetry} data-testid="hero-telemetry" />
          </div>
        </section>

        {/* BELOW THE FOLD — one scroll-driven story (five scrubbed scenes
            over a continuous gradient atmosphere). See components/scrolly. */}
        <ScrollyStory reduced={!!reduced} />
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
                <CaliberLogo size={34} color="hsl(var(--crimson))" />
                <span
                  className="lean uppercase text-section"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 900,
                    fontStretch: "125%",
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
