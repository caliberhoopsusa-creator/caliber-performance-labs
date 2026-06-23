import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  motion,
  useInView,
  useReducedMotion,
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

/* ------------------------------------------------------------------ */
/* data                                                                */
/* ------------------------------------------------------------------ */

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

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
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
        @media (prefers-reduced-motion: reduce) { [style*="cal-marquee"] { animation: none !important; } }
      `}</style>

      {/* NAV */}
      <header className="sticky top-0 z-[100] border-b border-border bg-background/70 backdrop-blur-xl">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between" aria-label="Main">
          <div className="flex items-center gap-2.5">
            <CaliberLogo size={30} color="#E11D2A" />
            <span className="font-display text-2xl tracking-wide leading-none">CALIBER</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/pricing"><Button variant="ghost" className="hidden sm:inline-flex" data-testid="button-pricing">Pricing</Button></Link>
            <Link href="/scout"><Button variant="ghost" className="hidden sm:inline-flex" data-testid="button-scout-hub">Scout Hub</Button></Link>
            <Button asChild className="bg-accent text-accent-foreground border border-accent-border hover:bg-accent-hover" data-testid="button-login">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main>
        {/* HERO */}
        <section className="relative isolate px-4 pt-16 sm:pt-24 pb-24">
          <div aria-hidden className="absolute inset-0 -z-10" style={{ background: "radial-gradient(ellipse 70% 60% at 72% 28%, hsl(var(--accent) / 0.12), transparent 62%)" }} />
          <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-background" />

          <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            <div className="lg:col-span-6 text-center lg:text-left">
              <Rise>
                <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/[0.07] px-3.5 py-1.5">
                  <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-accent" /></span>
                  <span className="font-label text-foreground/80">The future of sports · Early access</span>
                </span>
              </Rise>
              <Rise delay={0.06}>
                <h1 className="mt-6 font-display font-semibold leading-[0.84] tracking-[-0.01em]" style={{ fontSize: "clamp(3.5rem, 9vw, 8rem)" }} data-testid="hero-masthead">
                  <span
                    className="block"
                    style={{
                      backgroundImage: "linear-gradient(180deg, hsl(var(--silver)) 0%, hsl(var(--silver-dim)) 100%)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    EVERY GAME
                  </span>
                  <span className="block text-accent" style={{ textShadow: "0 0 48px hsl(var(--accent)/0.45)" }}>GRADED.</span>
                </h1>
              </Rise>
              <Rise delay={0.12}>
                <p className="mt-6 mx-auto lg:mx-0 max-w-xl font-body text-lg sm:text-xl leading-relaxed text-muted-foreground">
                  Caliber turns your stats into a position-weighted grade after every game — so you know
                  <span className="text-foreground"> exactly where you stand and what to work on next.</span>
                </p>
              </Rise>
              <Rise delay={0.18}>
                <div className="mt-9">
                  <WaitlistForm source="landing-hero" />
                  <div className="mt-4">
                    <Link href="/pricing" className="font-label text-muted-foreground hover:text-foreground transition-colors" data-testid="button-hero-pricing">View pricing →</Link>
                  </div>
                </div>
              </Rise>
              <Rise delay={0.24}>
                <p className="mt-7 font-label text-muted-foreground">
                  Free to start · No credit card · Be one of the first
                </p>
              </Rise>
            </div>

            <div className="lg:col-span-6">
              <Rise delay={0.14}>
                <div
                  className="relative mx-auto aspect-square w-full max-w-[540px]"
                  style={{
                    maskImage: "radial-gradient(circle at 50% 50%, #000 58%, transparent 92%)",
                    WebkitMaskImage: "radial-gradient(circle at 50% 50%, #000 58%, transparent 92%)",
                  }}
                >
                  <div aria-hidden className="absolute inset-0 -z-10" style={{ background: "radial-gradient(circle at 50% 46%, hsl(var(--accent) / 0.16), transparent 64%)", filter: "blur(36px)" }} />
                  <LiquidMetal
                    image={metalC}
                    colorBack="#0A0A0B"
                    colorTint="#D4D9E0"
                    repetition={4}
                    softness={0.85}
                    shiftRed={0}
                    shiftBlue={0}
                    distortion={0.18}
                    contour={0.62}
                    speed={0.5}
                    scale={0.72}
                    fit="contain"
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
              </Rise>
            </div>
          </div>
        </section>

        {/* MARQUEE */}
        <section className="relative border-y border-border overflow-hidden py-5 bg-card/30">
          <div aria-hidden className="absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-background to-transparent" />
          <div aria-hidden className="absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-background to-transparent" />
          <div className="flex gap-10 whitespace-nowrap" style={{ width: "max-content", animation: "cal-marquee 30s linear infinite" }}>
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span key={`${item}-${i}`} className="flex items-center gap-3 font-display text-lg tracking-wide text-muted-foreground"><Shield className="h-4 w-4 text-accent/70" /> {item}</span>
            ))}
          </div>
        </section>

        {/* FEATURES — bento */}
        <section id="features" className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <Rise className="max-w-2xl mb-14">
              <span className="editorial-rule font-label text-accent">The Platform</span>
              <h2 className="mt-7 font-display text-5xl md:text-7xl leading-[0.95]">Built to measure <span className="text-accent">everything</span>.</h2>
            </Rise>
            <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-4 lg:auto-rows-[150px]">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <Rise key={f.title} delay={i * 0.05} className={f.span}>
                    <div className={`group h-full rounded-2xl border border-border bg-card/60 p-6 transition-all duration-300 hover:border-accent/40 hover:bg-card ${f.hero ? "flex flex-col justify-between" : ""}`} data-testid={`feature-${f.title.toLowerCase().replace(/\s+/g, "-")}`}>
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
              <h2 className="mt-7 font-display text-5xl md:text-7xl leading-[0.95]">Three steps to your <span className="text-accent">best season</span>.</h2>
            </Rise>
            <div className="grid md:grid-cols-3 gap-4">
              {howItWorks.map((item, i) => (
                <Rise key={item.step} delay={i * 0.08}>
                  <div className="relative h-full rounded-2xl border border-border bg-card/50 p-7 overflow-hidden">
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
              <h2 className="mt-7 font-display text-5xl md:text-7xl leading-[0.95]">Precision, by <span className="text-accent">design</span>.</h2>
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
                  <div className="font-label text-muted-foreground mb-4">{`0${i + 1}`}</div>
                  <div className="font-display text-foreground leading-none" style={{ fontSize: "clamp(3rem, 6vw, 5rem)" }}>{s.node}</div>
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
              <h2 className="mt-7 font-display text-5xl md:text-7xl leading-[0.95]">One platform, <span className="text-accent">four</span> vantage points.</h2>
            </Rise>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {audience.map((a, i) => (
                <Rise key={a.title} delay={i * 0.06}>
                  <div className="group h-full rounded-2xl border border-border bg-card/50 p-7 transition-all duration-300 hover:border-accent/40">
                    <span className="grid place-items-center h-11 w-11 rounded-xl bg-accent/12 text-accent mb-6 transition-transform duration-300 group-hover:scale-110"><a.icon className="h-5 w-5" /></span>
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
              <h2 className="mt-7 font-display text-6xl md:text-8xl leading-[0.9]">Know your <span className="text-accent" style={{ textShadow: "0 0 40px hsl(var(--accent)/0.4)" }}>caliber</span>.</h2>
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
      <footer className="py-16 px-4 border-t border-border">
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
