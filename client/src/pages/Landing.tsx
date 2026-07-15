import { useLayoutEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
} from "framer-motion";
import {
  BarChart3,
  Video,
  Award,
  Trophy,
  Target,
  ClipboardList,
  TrendingUp,
  Check,
} from "lucide-react";
import { Link } from "wouter";
import { CaliberLogo } from "@/components/CaliberLogo";
import { WaitlistForm } from "@/components/WaitlistForm";
import {
  SectionEyebrow,
  TelemetryStrip,
  PlayerCard,
  type TelemetryItem,
} from "@/components/signal";
import { runBootTimeline, setInitial, stagger } from "@/lib/motion";

/**
 * Landing — SIGNAL: Career Mode, Phase 1a.
 * Obsidian-first (crimson is earned): CSS atmosphere + film grain replace the
 * old full-screen ShaderGradient (−~1.1MB of JS on this path). One hero
 * moment: the leaned CALIBER wordmark + a labeled DEMO PlayerCard.
 * All color/type through tokens — no raw hex, no arbitrary font values.
 *
 * Hero boot: one anime.js timeline choreographs the attract-screen power-on
 * (SYSTEM ONLINE flicker → wordmark clip-path wipe → staggered rise → card
 * lands + OVR count-up → telemetry). framer-motion keeps the below-the-fold
 * scroll reveals — the two engines never share an element (DESIGN-LANGUAGE
 * §1.5). Reduced motion / timeline failure → the final static frame.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

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

function Rise({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 22 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

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

/** Leaned display header — Archivo Expanded Black, the identity voice. */
function DisplayHead({
  children,
  className = "",
  lean = true,
  "data-testid": testId,
}: {
  children: React.ReactNode;
  className?: string;
  lean?: boolean;
  "data-testid"?: string;
}) {
  return (
    <h2
      className={`${lean ? "lean " : ""}uppercase leading-none text-title text-foreground ${className}`}
      style={{
        fontFamily: "var(--font-display)",
        fontWeight: 900,
        fontStretch: "125%",
        letterSpacing: "-0.01em",
      }}
      data-testid={testId}
    >
      {children}
    </h2>
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

const CAREER_STEPS = [
  {
    step: "01",
    icon: ClipboardList,
    title: "Log the game",
    body: "Enter your stat line in under two minutes — or let the AI pull it from film.",
  },
  {
    step: "02",
    icon: BarChart3,
    title: "Get your grade",
    body: "The engine returns a position-weighted A–F with specific feedback. Your Caliber Score moves like an overall rating.",
  },
  {
    step: "03",
    icon: TrendingUp,
    title: "Get seen",
    body: "Every grade builds a verified, season-long record — the profile a college program can actually trust.",
  },
];

const FEATURES = [
  {
    icon: BarChart3,
    title: "Performance Grades",
    body: "Position-weighted A–F grade after every game, with the why behind each mark.",
    span: "sm:col-span-2",
    hero: true,
  },
  {
    icon: Video,
    title: "AI Video Analysis",
    body: "Upload footage — the engine pulls your stat line from film.",
    span: "",
    hero: false,
  },
  {
    icon: Award,
    title: "50+ Skill Badges",
    body: "Progressive badges unlock like achievements — earned from real games only.",
    span: "",
    hero: false,
  },
  {
    icon: Trophy,
    title: "Leaderboards",
    body: "Local and global boards update as games post. Climb them.",
    span: "",
    hero: false,
  },
  {
    icon: Target,
    title: "Get Scouted",
    body: "Flip 'Open to Opportunities' and surface to college programs.",
    span: "",
    hero: false,
  },
];

const COACH_POINTS = [
  "A team dashboard with every player's grades and trends",
  "Game verification, lineup analytics, and practice tracking",
  "AI scouting reports you can share with college recruiters",
];

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

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
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
        .cta-atmosphere {
          background: radial-gradient(60% 80% at 50% 110%, hsl(var(--crimson-deep) / 0.28), transparent 65%);
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
          <div aria-hidden className="hero-atmosphere absolute inset-0 -z-10" />
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
                  <WaitlistForm source="landing-hero" />
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

        {/* CAREER MODE — the narrative */}
        <section
          className="border-t px-5 py-section sm:px-8"
          style={{ borderColor: "hsl(var(--line))" }}
          data-testid="section-how-it-works"
        >
          <div className="mx-auto max-w-6xl">
            <Rise className="mb-12 max-w-2xl">
              <SectionEyebrow>Career Mode</SectionEyebrow>
              <DisplayHead className="mt-6">
                Get scouted like a{" "}
                <span style={{ color: "hsl(var(--crimson))" }}>video game</span>.
              </DisplayHead>
              <p className="mt-5 max-w-xl font-body text-base leading-relaxed text-muted-foreground">
                Log the game → get your grade → get seen. The video-game feel,
                built on real numbers — nothing on your record is invented.
              </p>
            </Rise>
            <div className="grid gap-4 md:grid-cols-3">
              {CAREER_STEPS.map((s, i) => (
                <Rise key={s.step} delay={i * 0.08}>
                  <div
                    className="angle-cut gloss relative h-full border p-6"
                    style={{
                      backgroundColor: "hsl(var(--obsidian-1))",
                      borderColor: "hsl(var(--line))",
                    }}
                  >
                    <span
                      aria-hidden
                      className="lean absolute -top-2 right-3 select-none leading-none text-stat"
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 900,
                        fontStretch: "125%",
                        color: "hsl(var(--silver) / 0.07)",
                      }}
                    >
                      {s.step}
                    </span>
                    <span className="mb-5 grid h-10 w-10 place-items-center rounded-input bg-accent/10 text-accent">
                      <s.icon className="h-5 w-5" />
                    </span>
                    <h3
                      className="uppercase text-section text-foreground"
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 800,
                        fontStretch: "110%",
                      }}
                      data-testid={`step-title-${i + 1}`}
                    >
                      {s.title}
                    </h3>
                    <p className="mt-2.5 font-body text-sm leading-relaxed text-muted-foreground">
                      {s.body}
                    </p>
                  </div>
                </Rise>
              ))}
            </div>
          </div>
        </section>

        {/* THE PLATFORM — what the engine does */}
        <section
          id="features"
          className="border-t px-5 py-section sm:px-8"
          style={{ borderColor: "hsl(var(--line))" }}
        >
          <div className="mx-auto max-w-6xl">
            <Rise className="mb-12 max-w-2xl">
              <SectionEyebrow>The Platform</SectionEyebrow>
              <DisplayHead className="mt-6">Built to measure everything.</DisplayHead>
            </Rise>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f, i) => (
                <Rise key={f.title} delay={i * 0.05} className={f.span}>
                  <div
                    className="group relative h-full rounded-card border p-6 transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transition-none"
                    style={{
                      backgroundColor: "hsl(var(--obsidian-1))",
                      borderColor: "hsl(var(--line))",
                    }}
                    data-testid={`feature-${f.title.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="grid h-10 w-10 place-items-center rounded-input bg-accent/10 text-accent">
                        <f.icon className="h-5 w-5" />
                      </span>
                      <span
                        className="font-mono text-muted-foreground"
                        style={{ fontSize: "var(--text-data)" }}
                      >
                        0{i + 1}
                      </span>
                    </div>
                    <h3
                      className={`mt-5 uppercase text-foreground ${f.hero ? "text-title" : "text-section"}`}
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: f.hero ? 900 : 800,
                        fontStretch: f.hero ? "125%" : "110%",
                      }}
                    >
                      {f.title}
                    </h3>
                    <p className="mt-2 max-w-sm font-body text-sm leading-relaxed text-muted-foreground">
                      {f.body}
                    </p>
                  </div>
                </Rise>
              ))}
            </div>
          </div>
        </section>

        {/* FOR COACHES — the honest demo-first offer */}
        <section
          className="border-t px-5 py-section sm:px-8"
          style={{ borderColor: "hsl(var(--line))" }}
          data-testid="section-coaches"
        >
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <Rise>
                <SectionEyebrow>For Coaches</SectionEyebrow>
                <DisplayHead className="mt-6">
                  Send a stat sheet.{" "}
                  <span style={{ color: "hsl(var(--crimson))" }}>
                    Get back report cards.
                  </span>
                </DisplayHead>
              </Rise>
              <Rise delay={0.08}>
                <p className="mt-5 max-w-xl font-body text-base leading-relaxed text-muted-foreground">
                  Want proof before you commit ten minutes? Send the stat sheet
                  from your last game and we'll return a graded report card for
                  every player within a day — free, no signup. We're early, and
                  that's the opportunity: founding Montana programs get free
                  access, set up personally by the founder, and a direct line to
                  shape what gets built next.
                </p>
              </Rise>
              <Rise delay={0.14}>
                <ul className="mt-6 space-y-3">
                  {COACH_POINTS.map((point) => (
                    <li key={point} className="flex items-start gap-3 font-body text-sm text-foreground/85">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent/12 text-accent">
                        <Check className="h-3 w-3" />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </Rise>
            </div>
            <Rise delay={0.1}>
              <div
                className="gloss rounded-card border p-6 sm:p-7"
                style={{
                  backgroundColor: "hsl(var(--obsidian-1))",
                  borderColor: "hsl(var(--line))",
                }}
              >
                <p
                  className="font-display text-label uppercase text-muted-foreground"
                  style={{ fontWeight: 500, fontStretch: "70%" }}
                >
                  Founding team access · Free
                </p>
                <p className="mt-3 font-body text-sm leading-relaxed text-muted-foreground">
                  Drop your email and we'll reach out to set your program up —
                  or just reply to our email with a stat sheet.
                </p>
                <WaitlistForm
                  source="landing-coaches"
                  variant="quiet"
                  defaultCoach
                  className="mt-5"
                />
              </div>
            </Rise>
          </div>
        </section>

        {/* FINAL CTA */}
        <section
          className="relative isolate overflow-hidden border-t px-5 py-section text-center sm:px-8"
          style={{ borderColor: "hsl(var(--line))" }}
          id="cta"
        >
          <div aria-hidden className="cta-atmosphere absolute inset-0 -z-10" />
          <div aria-hidden className="grain-overlay -z-10" />
          <div className="mx-auto max-w-3xl">
            <Rise>
              <SectionEyebrow as="div" className="justify-center">
                Founding Class
              </SectionEyebrow>
              <h2
                className="lean mt-7 uppercase leading-none text-hero"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 900,
                  fontStretch: "125%",
                  letterSpacing: "-0.02em",
                  color: "hsl(var(--silver-hi))",
                }}
              >
                Know your{" "}
                <span
                  style={{
                    color: "hsl(var(--crimson))",
                    textShadow: "0 0 40px hsl(var(--crimson-glow))",
                  }}
                >
                  caliber
                </span>
                .
              </h2>
              <p className="mx-auto mt-6 max-w-xl font-body text-base leading-relaxed text-muted-foreground">
                Be one of the first athletes on the platform. Log a game, get
                graded, and start climbing — free.
              </p>
              <div className="mt-9 flex flex-col items-center gap-4">
                <a
                  href="#join"
                  className="angle-cut inline-flex h-12 items-center justify-center border px-7 font-display uppercase transition-colors hover:border-accent/60"
                  style={{
                    fontWeight: 800,
                    fontStretch: "110%",
                    fontSize: "var(--text-body)",
                    letterSpacing: "0.06em",
                    color: "hsl(var(--silver-hi))",
                    borderColor: "hsl(var(--silver) / 0.3)",
                    backgroundColor: "hsl(var(--obsidian-2))",
                  }}
                  data-testid="button-cta-join"
                >
                  Join the founding class
                </a>
                <Link
                  href="/pricing"
                  className="font-display text-label uppercase text-muted-foreground transition-colors hover:text-foreground"
                  style={{ fontWeight: 500, fontStretch: "70%" }}
                  data-testid="button-cta-pricing"
                >
                  View pricing →
                </Link>
              </div>
            </Rise>
          </div>
        </section>
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
