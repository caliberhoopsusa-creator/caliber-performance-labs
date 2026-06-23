import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  useMotionTemplate,
  animate,
} from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  BarChart3, Video, Award, Trophy, Users, Target,
  Shield, Zap, ClipboardList, TrendingUp, Activity, GraduationCap, HeartHandshake,
} from "lucide-react";
import { Link } from "wouter";
import { CaliberLogo } from "@/components/CaliberLogo";
import { WaitlistForm } from "@/components/WaitlistForm";
import { CaliberScore } from "@/components/CaliberScore";
import { getTier, tierColor } from "@/lib/caliberTier";
import { SignalBackground } from "@/components/SignalBackground";
import { LiquidMetal } from "@paper-design/shaders-react";
import metalC from "@/assets/images/caliber-c-chrome.png";

const EASE = [0.16, 1, 0.3, 1] as const;

/* ------------------------------------------------------------------ */
/* small primitives                                                    */
/* ------------------------------------------------------------------ */

function Rise({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
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

function Counter({ to, decimals = 0, suffix = "", prefix = "" }: { to: number; decimals?: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduced = useReducedMotion();
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (reduced) { setVal(to); return; }
    const controls = animate(0, to, { duration: 1.4, ease: EASE, onUpdate: (v) => setVal(v) });
    return () => controls.stop();
  }, [inView, to, reduced]);
  return <span ref={ref} className="tabular-nums">{prefix}{val.toFixed(decimals)}{suffix}</span>;
}

/* ------------------------------------------------------------------ */
/* the hero "engine" — a grade that computes itself                    */
/* ------------------------------------------------------------------ */

const RING_R = 54;
const RING_C = 2 * Math.PI * RING_R;
const TARGET = 94;

function EngineCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const reduced = useReducedMotion();
  const [score, setScore] = useState(0);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!inView) return;
    if (reduced) { setScore(TARGET); setArmed(true); return; }
    const t = setTimeout(() => setArmed(true), 250);
    const controls = animate(0, TARGET, { duration: 1.6, delay: 0.25, ease: EASE, onUpdate: (v) => setScore(v) });
    return () => { controls.stop(); clearTimeout(t); };
  }, [inView, reduced]);

  const offset = RING_C * (1 - score / 99);
  const subs = [
    { label: "Scoring", v: 96 },
    { label: "Playmaking", v: 91 },
    { label: "Defense", v: 88 },
    { label: "Rebounding", v: 84 },
  ];

  return (
    <div ref={ref} className="relative">
      <div aria-hidden className="absolute -inset-8 -z-10" style={{ background: "radial-gradient(ellipse at 50% 35%, hsl(var(--accent)/0.22), transparent 70%)", filter: "blur(40px)" }} />
      <div className="glass-strong rounded-2xl border border-border p-6 sm:p-7 shadow-2xl">
        <div className="flex items-center justify-between pb-5 mb-6 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center h-10 w-10 rounded-lg bg-accent/12 text-accent"><Activity className="h-5 w-5" /></span>
            <div className="leading-tight">
              <p className="font-display text-lg tracking-wide text-foreground">CALIBER ENGINE</p>
              <p className="font-label text-muted-foreground">{armed ? "Grade locked · 47 games" : "Analyzing 47 games…"}</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 font-label text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" /> LIVE
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative shrink-0 h-32 w-32">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
              <circle cx="60" cy="60" r={RING_R} fill="none" stroke="hsl(var(--foreground)/0.08)" strokeWidth="8" />
              <circle
                cx="60" cy="60" r={RING_R} fill="none" stroke="hsl(var(--tier-elite))" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={RING_C} strokeDashoffset={offset}
                style={{ transition: reduced ? "none" : "stroke-dashoffset 0.1s linear", filter: "drop-shadow(0 0 6px hsl(var(--tier-elite)/0.5))" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-5xl leading-none tabular-nums" style={{ color: "hsl(var(--tier-elite))" }}>{Math.round(score)}</span>
              <span className="font-display tracking-[0.2em] text-muted-foreground text-[10px] mt-0.5">OVR</span>
            </div>
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            {subs.map((s, i) => (
              <div key={s.label}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="font-label text-muted-foreground">{s.label}</span>
                  <span className="font-display text-sm text-foreground tabular-nums">{armed ? s.v : "—"}</span>
                </div>
                <div className="h-1.5 rounded-full bg-foreground/8 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-accent"
                    initial={reduced ? false : { width: 0 }}
                    animate={armed ? { width: `${s.v}%` } : {}}
                    transition={{ duration: 0.9, ease: EASE, delay: 0.4 + i * 0.12 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 mt-6 pt-5 border-t border-border">
          {[{ I: Trophy, v: "#12", l: "City Rank" }, { I: Award, v: "8", l: "Badges" }, { I: Zap, v: "14d", l: "Streak" }].map((s, i) => (
            <div key={s.l} className={`hairline-col px-4 ${i === 0 ? "" : "pl-5"}`}>
              <s.I className="h-4 w-4 text-accent mb-2" />
              <p className="font-display text-2xl text-foreground leading-none">{s.v}</p>
              <p className="font-label text-muted-foreground mt-1.5">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* 3D scroll reveal — the dashboard tilts up to flat as it enters (Container-Scroll pattern,
   framer-motion only, no WebGL). Reuses EngineCard. */
function ProductReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [reduced ? 0 : 26, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [reduced ? 1 : 0.86, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [reduced ? 0 : 70, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.55], [reduced ? 1 : 0.25, 1]);
  return (
    <div ref={ref} style={{ perspective: "1300px" }} className="mx-auto max-w-2xl">
      <motion.div style={{ rotateX, scale, y, opacity, transformStyle: "preserve-3d" }}>
        <EngineCard />
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* data                                                                */
/* ------------------------------------------------------------------ */

function ForgeGrade() {
  const POS = {
    Guard: { s: 0.35, p: 0.4, d: 0.25 },
    Wing: { s: 0.4, p: 0.3, d: 0.3 },
    Big: { s: 0.3, p: 0.2, d: 0.5 },
  } as const;
  const [pos, setPos] = useState<keyof typeof POS>("Guard");
  const [scoring, setScoring] = useState(74);
  const [playmaking, setPlaymaking] = useState(68);
  const [defense, setDefense] = useState(63);
  const w = POS[pos];
  const score = Math.max(1, Math.min(99, Math.round(scoring * w.s + playmaking * w.p + defense * w.d)));
  const tier = getTier(score);
  const rows = [
    { label: "Scoring", value: scoring, set: setScoring },
    { label: "Playmaking", value: playmaking, set: setPlaymaking },
    { label: "Defense", value: defense, set: setDefense },
  ];
  return (
    /* gradient frame → sharp beveled inner panel */
    <div className="cal-bevel bg-gradient-to-br from-accent/60 via-[hsl(var(--silver)/0.25)] to-accent/20 p-px">
      <div className="cal-bevel cal-bracket relative grid items-center gap-10 bg-[#0b0b0d]/92 p-8 backdrop-blur-xl md:grid-cols-[1.1fr_0.9fr] md:p-12">
        <div className="space-y-7">
          <div className="flex items-center justify-between">
            <span className="font-label text-accent">INPUT · YOUR GAME</span>
            <span className="flex items-center gap-1.5 font-label text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" /> RECOMPUTING</span>
          </div>
          <div className="flex gap-2">
            {(Object.keys(POS) as (keyof typeof POS)[]).map((p) => (
              <button
                key={p}
                onClick={() => setPos(p)}
                className={`cal-bevel border px-4 py-1.5 font-label uppercase tracking-wider transition-all duration-150 ${pos === p ? "border-accent bg-accent/15 text-accent shadow-[0_0_18px_hsl(var(--accent)/0.3)]" : "border-border text-muted-foreground hover:border-accent/40 hover:text-foreground"}`}
                data-testid={`forge-pos-${p.toLowerCase()}`}
              >
                {p}
              </button>
            ))}
          </div>
          {rows.map((row) => (
            <div key={row.label}>
              <div className="mb-2 flex items-baseline justify-between">
                <span className="font-label uppercase tracking-wider text-muted-foreground">{row.label}</span>
                <span className="font-display text-lg tabular-nums text-foreground">{row.value}</span>
              </div>
              <input
                type="range" min={0} max={100} value={row.value}
                onChange={(e) => row.set(Number(e.target.value))}
                className="cal-range w-full"
                aria-label={row.label}
              />
            </div>
          ))}
          <p className="font-label text-muted-foreground/70">Weighted for a {pos.toLowerCase()} · drag to recompute the grade →</p>
        </div>
        <div className="flex flex-col items-center justify-center gap-5">
          <div aria-hidden className="absolute right-0 top-1/2 hidden h-3/4 w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-accent/30 to-transparent md:left-[58%] md:block" />
          <CaliberScore score={score} size="lg" />
          <div className="text-center">
            <p className="font-display text-2xl tracking-wide" style={{ color: tierColor(tier.cssVar) }}>{tier.label}</p>
            <p className="font-label uppercase tracking-[0.2em] text-muted-foreground">{tier.blurb}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const features = [
  { icon: BarChart3, title: "Performance Grades", description: "Position-weighted A–F grade after every game, with the why behind each mark.", span: "lg:col-span-3 lg:row-span-2", hero: true },
  { icon: Video, title: "AI Video Analysis", description: "Upload footage — the engine extracts your stats automatically.", span: "lg:col-span-3" },
  { icon: Award, title: "50+ Skill Badges", description: "Progressive badges like Sharpshooter and Glass Cleaner.", span: "lg:col-span-2" },
  { icon: Trophy, title: "Leaderboards", description: "Local and global ranks, updated as games post.", span: "lg:col-span-2" },
  { icon: Target, title: "Get Scouted", description: "Flip 'Open to Opportunities' and surface to college programs.", span: "lg:col-span-2" },
];

const howItWorks = [
  { step: 1, icon: ClipboardList, title: "Log your game", description: "Enter your stats in under two minutes — or let AI pull them from film." },
  { step: 2, icon: BarChart3, title: "Get your grade", description: "The engine returns a position-weighted A–F grade with real feedback." },
  { step: 3, icon: TrendingUp, title: "Level up", description: "Track growth, earn badges, climb the board, and get discovered." },
];

const audience = [
  { icon: Activity, title: "Players", line: "Measure every game. See exactly what to improve. Build a profile that gets you seen." },
  { icon: Users, title: "Coaches", line: "Verified team stats, lineups, and development tracking in one place." },
  { icon: GraduationCap, title: "Recruiters", line: "Filter real, graded prospects by position, level, and fit." },
  { icon: HeartHandshake, title: "Guardians", line: "Follow your athlete's progress, milestones, and grades from anywhere." },
];

const marqueeItems = ["Performance Grades", "AI Video", "Skill Badges", "Leaderboards", "Recruiting", "Scouting", "Film Room", "Live Stats"];

/* ------------------------------------------------------------------ */
/* page                                                                */
/* ------------------------------------------------------------------ */

export default function Landing() {
  const { data: platformStats } = useQuery<{ playerCount: number; gameCount: number; badgeCount: number; coachCount: number }>({
    queryKey: ["/api/public/platform-stats"],
  });
  const gamesLogged = platformStats?.gameCount ?? 0;
  const foundingAthletes = platformStats?.playerCount ?? 0;

  // scroll-driven chrome: top progress bar + hero parallax
  const { scrollYProgress } = useScroll();
  const progressX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });
  const heroLift = useTransform(scrollYProgress, [0, 0.25], [0, -70]);
  const heroSpin = useTransform(scrollYProgress, [0, 0.25], [0, 10]);

  // cursor-reactive hero glow
  const mx = useMotionValue(-1000);
  const my = useMotionValue(-1000);
  const glow = useMotionTemplate`radial-gradient(560px circle at ${mx}px ${my}px, hsl(var(--accent) / 0.20), transparent 65%)`;

  return (
    <div className="min-h-screen text-foreground relative overflow-x-hidden">
      <SignalBackground />
      <motion.div
        aria-hidden
        className="fixed top-0 left-0 right-0 z-[200] h-[3px] origin-left"
        style={{ scaleX: progressX, background: "linear-gradient(90deg, hsl(var(--silver-dim)), hsl(var(--silver)), #ffffff 60%, hsl(var(--accent)))" }}
      />
      <style>{`
        @keyframes cal-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .cal-grid {
          background-image:
            linear-gradient(hsl(var(--foreground)/0.045) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground)/0.045) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 95% 65% at 50% 0%, #000 20%, transparent 75%);
          -webkit-mask-image: radial-gradient(ellipse 95% 65% at 50% 0%, #000 20%, transparent 75%);
        }
        .bg-foreground\\/8 { background-color: hsl(var(--foreground) / 0.08); }
        @keyframes chrome-sheen { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
        .hero-blooms {
          background:
            radial-gradient(42% 52% at 24% 28%, hsl(356 82% 46% / 0.24), transparent 70%),
            radial-gradient(38% 46% at 80% 34%, hsl(210 22% 62% / 0.15), transparent 70%),
            radial-gradient(48% 52% at 62% 82%, hsl(356 70% 34% / 0.20), transparent 72%),
            radial-gradient(40% 42% at 14% 76%, hsl(220 16% 52% / 0.11), transparent 70%);
          filter: blur(22px);
          animation: hero-bloom-drift 20s ease-in-out infinite;
        }
        @keyframes hero-bloom-drift {
          0%, 100% { transform: scale(1) translate(0, 0); }
          33% { transform: scale(1.12) translate(2%, -2%); }
          66% { transform: scale(1.06) translate(-2%, 2%); }
        }
        @media (prefers-reduced-motion: reduce) { .hero-blooms { animation: none; } }
        .btn-chrome {
          position: relative; overflow: hidden;
          background: linear-gradient(180deg, #f6f8fb 0%, #ccd1d9 46%, #b1b7c1 56%, #eaedf1 100%);
          color: #0a0a0b;
          border: 1px solid hsl(var(--accent) / 0.55);
          box-shadow: 0 2px 12px hsl(var(--accent) / 0.28), inset 0 1px 0 rgba(255,255,255,0.75);
          transition: box-shadow .2s ease, transform .15s ease;
        }
        .btn-chrome:hover { box-shadow: 0 6px 24px hsl(var(--accent) / 0.5), inset 0 1px 0 rgba(255,255,255,0.85); transform: translateY(-1px); }
        .btn-chrome:active { transform: translateY(0); }
        .btn-chrome::after {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(115deg, transparent 32%, rgba(255,255,255,0.6) 48%, transparent 64%);
          background-size: 250% 100%; background-position: 210% 0;
          transition: background-position .65s ease;
        }
        .btn-chrome:hover::after { background-position: -60% 0; }
        .btn-chrome:disabled { opacity: 0.6; cursor: not-allowed; }
        .signal-blooms {
          background:
            radial-gradient(42% 48% at 18% 14%, hsl(356 90% 54% / 0.52), transparent 68%),
            radial-gradient(38% 44% at 84% 20%, hsl(214 45% 72% / 0.34), transparent 70%),
            radial-gradient(46% 50% at 76% 66%, hsl(356 82% 48% / 0.44), transparent 72%),
            radial-gradient(40% 46% at 18% 84%, hsl(264 60% 66% / 0.30), transparent 72%),
            radial-gradient(36% 40% at 56% 44%, hsl(196 60% 62% / 0.20), transparent 74%);
          filter: blur(26px);
          animation: signal-flow 26s ease-in-out infinite;
        }
        @keyframes signal-flow {
          0%, 100% { transform: scale(1) translate(0, 0); }
          25% { transform: scale(1.1) translate(2%, -1.5%); }
          50% { transform: scale(1.06) translate(-1.5%, 1.5%); }
          75% { transform: scale(1.12) translate(1.5%, 2%); }
        }
        .signal-cursor { background: radial-gradient(520px circle at var(--mx, 50%) var(--my, 28%), hsl(var(--accent) / 0.16), transparent 70%); }
        @media (prefers-reduced-motion: reduce) { .signal-blooms { animation: none; } }
        .text-chrome {
          background-image: linear-gradient(100deg, hsl(var(--silver-dim)) 0%, hsl(var(--silver)) 22%, #ffffff 50%, hsl(var(--silver)) 78%, hsl(var(--silver-dim)) 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; background-clip: text;
          color: transparent;
          animation: chrome-sheen 9s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) { [style*="cal-marquee"] { animation: none !important; } .text-chrome { animation: none; } }

        /* ── gradient + sharpness system ── */
        .grad-text-crimson {
          background-image: linear-gradient(100deg, #ffffff 0%, hsl(var(--silver)) 22%, hsl(var(--accent)) 58%, #ff5a63 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; background-clip: text; color: transparent;
          animation: chrome-sheen 11s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) { .grad-text-crimson { animation: none; } }
        /* gradient hairline edge on rounded cards (mask trick) */
        .grad-border { position: relative; }
        .grad-border::before {
          content: ""; position: absolute; inset: 0; padding: 1px; border-radius: inherit; pointer-events: none;
          background: linear-gradient(135deg, hsl(var(--accent) / 0.55), hsl(var(--silver) / 0.22) 38%, transparent 64%);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
          transition: background .3s ease;
        }
        .grad-border:hover::before, .group:hover .grad-border::before, .grad-border.is-hot::before {
          background: linear-gradient(135deg, hsl(var(--accent) / 0.9), hsl(var(--silver) / 0.45) 42%, hsl(var(--accent) / 0.3) 80%);
        }
        /* telemetry corner brackets */
        .cal-bracket::before, .cal-bracket::after {
          content: ""; position: absolute; width: 13px; height: 13px; pointer-events: none;
          border: 0 solid hsl(var(--accent) / 0.65);
        }
        .cal-bracket::before { top: 10px; left: 10px; border-top-width: 1.5px; border-left-width: 1.5px; }
        .cal-bracket::after { bottom: 10px; right: 10px; border-bottom-width: 1.5px; border-right-width: 1.5px; }
        /* sharp beveled clip (cut corners) */
        .cal-bevel { clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px)); }
        /* gradient seam divider */
        .cal-seam { height: 1px; border: 0; background: linear-gradient(90deg, transparent, hsl(var(--accent) / 0.55) 28%, hsl(var(--silver) / 0.6) 50%, hsl(var(--accent) / 0.55) 72%, transparent); }
        /* sharp range slider */
        .cal-range { -webkit-appearance: none; appearance: none; height: 4px; background: linear-gradient(90deg, hsl(var(--accent)), hsl(var(--silver) / 0.35)); outline: none; cursor: pointer; }
        .cal-range::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none; width: 16px; height: 20px; cursor: pointer;
          background: linear-gradient(180deg, #f6f8fb, #b1b7c1); border: 1px solid hsl(var(--accent) / 0.8);
          box-shadow: 0 0 12px hsl(var(--accent) / 0.55); clip-path: polygon(0 0, 100% 0, 100% 66%, 50% 100%, 0 66%);
        }
        .cal-range::-moz-range-thumb {
          width: 16px; height: 20px; cursor: pointer; border-radius: 0;
          background: linear-gradient(180deg, #f6f8fb, #b1b7c1); border: 1px solid hsl(var(--accent) / 0.8);
          box-shadow: 0 0 12px hsl(var(--accent) / 0.55);
        }
      `}</style>

      {/* NAV — floating telemetry pill */}
      <header className="fixed inset-x-0 top-5 z-[150] flex justify-center px-4">
        <nav aria-label="Main" className="flex items-center gap-1 rounded-full border border-border/80 bg-background/55 px-2 py-1.5 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
          <span className="flex items-center gap-1.5 rounded-full bg-accent/12 px-3 py-1.5 font-label text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" /> SYSTEM ONLINE
          </span>
          <Link href="/pricing" className="hidden sm:block rounded-full px-3 py-1.5 font-label text-muted-foreground hover:text-foreground transition-colors" data-testid="button-pricing">PRICING</Link>
          <Link href="/scout" className="hidden sm:block rounded-full px-3 py-1.5 font-label text-muted-foreground hover:text-foreground transition-colors" data-testid="button-scout-hub">SCOUT</Link>
          <Link href="/login" className="rounded-full bg-foreground/10 px-3.5 py-1.5 font-label text-foreground hover:bg-foreground/15 transition-colors" data-testid="button-login">SIGN IN</Link>
        </nav>
      </header>

      <main className="relative z-10">
        {/* HERO — Act 00 · SIGNAL (clean, CALIBER-led) — background is global (SignalBackground) */}
        <section className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-32 text-center sm:px-8">
          <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center">
            {/* eyebrow */}
            <Rise>
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/[0.07] px-3.5 py-1.5 backdrop-blur-sm">
                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-accent" /></span>
                <span className="font-label text-foreground/80">The future of sports · Founding class open</span>
              </span>
            </Rise>

            {/* CALIBER — the main placeholder */}
            <Rise delay={0.08}>
              <motion.h1
                style={{ y: heroLift, fontSize: "clamp(4rem, 16vw, 14rem)" }}
                className="text-chrome mt-10 w-full select-none font-display font-extrabold leading-[0.85] tracking-[-0.04em]"
                data-testid="hero-masthead"
              >
                CALIBER
              </motion.h1>
            </Rise>

            {/* value line */}
            <Rise delay={0.16}>
              <p className="mt-8 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Every game, <span className="font-editorial-italic italic text-accent" style={{ textShadow: "0 0 45px hsl(var(--accent)/0.5)" }}>graded.</span>
              </p>
            </Rise>

            {/* subhead */}
            <Rise delay={0.22}>
              <p className="mt-5 max-w-xl font-body text-lg leading-relaxed text-muted-foreground">
                Every game is a signal. Caliber reads it — a position-weighted grade after every game, so you know exactly where you stand.
              </p>
            </Rise>

            {/* signup */}
            <Rise delay={0.28}>
              <div className="mt-12 flex flex-col items-center gap-4">
                <WaitlistForm source="landing-hero" align="center" />
                <p className="font-label text-muted-foreground">Free to start · No credit card · Be one of the first</p>
              </div>
            </Rise>
          </div>
        </section>

        {/* ACT 01 · THE PROBLEM */}
        <section className="relative border-t border-border px-4 py-32">
          <div className="mx-auto max-w-4xl text-center">
            <Rise><span className="font-label text-accent">ACT 01 · THE PROBLEM</span></Rise>
            <Rise delay={0.08}>
              <h2 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
                You can feel a good game. But you're{" "}
                <span className="font-editorial-italic italic text-accent">guessing</span> at how good.
              </h2>
            </Rise>
            <Rise delay={0.16}>
              <p className="mx-auto mt-6 max-w-xl font-body text-lg leading-relaxed text-muted-foreground">
                A stat line doesn't tell you what mattered. Caliber turns every box score into a position-weighted grade — the honest measure of your game.
              </p>
            </Rise>
          </div>
        </section>

        {/* ACT 02 · FORGE YOUR GRADE — interactive */}
        <section className="relative border-t border-border px-4 py-28">
          <div className="mx-auto max-w-6xl">
            <Rise className="mb-12 max-w-2xl">
              <span className="font-label text-accent">ACT 02 · THE ENGINE</span>
              <h2 className="mt-5 font-display text-5xl leading-[0.95] text-chrome md:text-7xl">
                Forge your <span className="font-editorial-italic italic text-accent">grade</span>.
              </h2>
              <p className="mt-5 max-w-xl font-body text-lg text-muted-foreground">
                Move the sliders. Watch the Caliber Score re-cast in real time — position-weighted, exactly like after a real game.
              </p>
            </Rise>
            <Rise delay={0.1}><ForgeGrade /></Rise>
          </div>
        </section>

        {/* ACT 03 · THE READOUT — 3D scroll dashboard reveal */}
        <section className="relative border-t border-border px-4 py-32">
          <div className="mx-auto max-w-5xl">
            <Rise className="mb-14 text-center">
              <span className="font-label text-accent">ACT 03 · THE READOUT</span>
              <h2 className="mx-auto mt-5 max-w-2xl font-display text-5xl leading-[0.95] md:text-7xl">
                Your game, <span className="grad-text-crimson">on the record</span>.
              </h2>
              <p className="mx-auto mt-5 max-w-xl font-body text-lg text-muted-foreground">
                Every grade locks to a live readout — the score, the splits, the rank. This is what your profile looks like.
              </p>
            </Rise>
            <ProductReveal />
          </div>
        </section>

        {/* FEATURES — bento */}
        <section id="features" className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <Rise className="max-w-2xl mb-14">
              <span className="editorial-rule font-label text-accent">The Platform</span>
              <h2 className="mt-7 font-display text-5xl md:text-7xl leading-[0.95] text-chrome">Built to measure <span className="text-accent">everything</span>.</h2>
            </Rise>
            <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-4 lg:auto-rows-[150px]">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <Rise key={f.title} delay={i * 0.05} className={f.span}>
                    <div className={`group grad-border cal-bracket relative h-full rounded-2xl border border-border bg-card/60 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:bg-card ${f.hero ? "flex flex-col justify-between" : ""}`} data-testid={`feature-${f.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <div className="flex items-start justify-between">
                        <span className="grid place-items-center h-11 w-11 rounded-xl bg-accent/12 text-accent transition-transform duration-300 group-hover:scale-110"><Icon className="h-5 w-5" /></span>
                        <span className="font-label text-muted-foreground">{`0${i + 1}`}</span>
                      </div>
                      <div className={f.hero ? "mt-auto pt-6" : "mt-4"}>
                        <h3 className={`font-display tracking-wide text-foreground ${f.hero ? "text-3xl md:text-4xl" : "text-xl"}`}>{f.title}</h3>
                        <p className={`text-muted-foreground leading-relaxed ${f.hero ? "mt-3 text-base max-w-sm" : "mt-2 text-sm"}`}>{f.description}</p>
                      </div>
                    </div>
                  </Rise>
                );
              })}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-24 px-4 border-t border-border" data-testid="section-how-it-works">
          <div className="max-w-5xl mx-auto">
            <Rise className="max-w-2xl mb-14">
              <span className="editorial-rule font-label text-accent">How It Works</span>
              <h2 className="mt-7 font-display text-5xl md:text-7xl leading-[0.95] text-chrome">Three steps to your <span className="text-accent">best season</span>.</h2>
            </Rise>
            <div className="grid md:grid-cols-3 gap-4">
              {howItWorks.map((item, i) => (
                <Rise key={item.step} delay={i * 0.08}>
                  <div className="grad-border relative h-full overflow-hidden rounded-2xl border border-border bg-card/50 p-7 transition-transform duration-200 hover:-translate-y-0.5">
                    <span aria-hidden className="absolute -top-4 -right-2 font-display text-[7rem] leading-none text-foreground/[0.04] select-none">{`0${item.step}`}</span>
                    <span className="grid place-items-center h-11 w-11 rounded-xl bg-accent/12 text-accent mb-6"><item.icon className="h-5 w-5" /></span>
                    <h3 className="font-display text-2xl tracking-wide" data-testid={`step-title-${item.step}`}>{item.title}</h3>
                    <p className="mt-2.5 text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </Rise>
              ))}
            </div>
          </div>
        </section>

        {/* HONEST METRICS — product truths + real live numbers */}
        <section className="py-24 px-4 border-t border-border">
          <div className="max-w-6xl mx-auto">
            <Rise className="max-w-2xl mb-12">
              <span className="editorial-rule font-label text-accent">The System</span>
              <h2 className="mt-7 font-display text-5xl md:text-7xl leading-[0.95] text-chrome">Precision, by <span className="text-accent">design</span>.</h2>
              <p className="mt-5 font-body text-lg text-muted-foreground max-w-xl">What the engine actually does — measured, not marketed.</p>
            </Rise>
            <div className="grid grid-cols-2 md:grid-cols-4 border-y border-border">
              {[
                { node: <Counter to={6} />, label: "Graded categories" },
                { node: <Counter to={50} suffix="+" />, label: "Skill badges" },
                { node: <Counter to={2} prefix="<" suffix="m" />, label: "To log a game" },
                { node: <span className="tabular-nums">A–F</span>, label: "Every game" },
              ].map((s, i) => (
                <div key={s.label} className={`hairline-col py-12 px-6 ${i === 0 ? "" : "md:pl-8"}`}>
                  <div className="font-label text-accent mb-4">{`0${i + 1}`}</div>
                  <div className="grad-text-crimson font-display leading-none" style={{ fontSize: "clamp(3rem, 6vw, 5rem)" }}>{s.node}</div>
                  <div className="font-label text-muted-foreground mt-5">{s.label}</div>
                </div>
              ))}
            </div>
            {/* honest live strip — real platform numbers, no inflation */}
            <Rise delay={0.1}>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 rounded-xl border border-border bg-card/40 px-6 py-4 text-center">
                <span className="flex items-center gap-2 font-label text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" /> Live on the platform</span>
                <span className="font-body text-sm text-foreground/80"><span className="font-display text-foreground">{foundingAthletes}</span> founding {foundingAthletes === 1 ? "athlete" : "athletes"}</span>
                <span className="font-body text-sm text-foreground/80"><span className="font-display text-foreground">{gamesLogged}</span> {gamesLogged === 1 ? "game" : "games"} graded</span>
                <span className="font-body text-sm text-accent">Get in early →</span>
              </div>
            </Rise>
          </div>
        </section>

        {/* WHO IT'S FOR — replaces fabricated testimonials */}
        <section className="py-24 px-4 border-t border-border">
          <div className="max-w-6xl mx-auto">
            <Rise className="max-w-2xl mb-14">
              <span className="editorial-rule font-label text-accent">Who It's For</span>
              <h2 className="mt-7 font-display text-5xl md:text-7xl leading-[0.95] text-chrome">One platform, <span className="text-accent">four</span> vantage points.</h2>
            </Rise>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {audience.map((a, i) => (
                <Rise key={a.title} delay={i * 0.06}>
                  <div className="group grad-border cal-bracket relative h-full rounded-2xl border border-border bg-card/50 p-7 transition-transform duration-200 hover:-translate-y-0.5">
                    <span className="grid place-items-center h-11 w-11 rounded-xl bg-accent/12 text-accent mb-6 transition-transform duration-200 group-hover:scale-110"><a.icon className="h-5 w-5" /></span>
                    <h3 className="font-display text-2xl tracking-wide">{a.title}</h3>
                    <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">{a.line}</p>
                  </div>
                </Rise>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="cta" className="relative py-32 px-4 border-t border-border isolate">
          <div aria-hidden className="absolute inset-0 -z-10" style={{ background: "radial-gradient(ellipse 60% 80% at 50% 100%, hsl(var(--accent)/0.14), transparent 60%)" }} />
          <div className="max-w-3xl mx-auto text-center">
            <Rise>
              <span className="editorial-rule font-label text-accent">Founding Class</span>
              <h2 className="mt-7 font-display text-6xl md:text-8xl leading-[0.9] text-chrome">Know your <span className="text-accent" style={{ textShadow: "0 0 40px hsl(var(--accent)/0.4)" }}>caliber</span>.</h2>
              <p className="mt-6 mx-auto max-w-xl font-body text-lg text-muted-foreground">Be one of the first athletes on the platform. Log a game, get graded, and start climbing — free.</p>
              <div className="mt-9">
                <WaitlistForm source="landing-cta" align="center" />
                <div className="mt-4">
                  <Link href="/pricing" className="font-label text-muted-foreground hover:text-foreground transition-colors" data-testid="button-cta-pricing">View pricing →</Link>
                </div>
              </div>
            </Rise>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 py-16 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5"><CaliberLogo size={34} color="#E11D2A" /><span className="font-display text-2xl tracking-wide">CALIBER</span></div>
              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">The performance platform for serious athletes. Track your game, earn your rank, get discovered.</p>
            </div>
            <div className="space-y-3">
              <h4 className="font-label text-foreground">Platform</h4>
              <Link href="/pricing" className="block text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-pricing">Pricing</Link>
              <Link href="/scout" className="block text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-scout-hub">Scout Hub</Link>
            </div>
            <div className="space-y-3">
              <h4 className="font-label text-foreground">Get Started</h4>
              <Link href="/login" className="block text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-sign-in">Sign In</Link>
              <Link href="/login" className="block text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-create-account">Create Account</Link>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="font-label text-muted-foreground">&copy; {new Date().getFullYear()} Caliber Performance Labs</span>
            <span className="font-label text-accent">caliber.app</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
