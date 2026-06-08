import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Video,
  Award,
  Trophy,
  Users,
  Target,
  Shield,
  Zap,
  ChevronRight,
  Sparkles,
  Eye,
  PlayCircle,
  CheckCircle2,
  Star,
  Flame,
  LineChart,
} from "lucide-react";
import { Link } from "wouter";
import { CaliberLogo } from "@/components/CaliberLogo";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { GradeBadge } from "@/components/GradeBadge";
import { AnimatedLink } from "@/components/ui/animated-link";
import {
  GlobalCursor,
  MagneticButton,
  TiltCard,
  Reveal,
  fadeUp,
  ease,
} from "./landing-animations";

/* ───────────────────────── Data ───────────────────────── */

const dualAudience = [
  {
    tag: "For Athletes",
    icon: Flame,
    title: "Turn every game into proof.",
    copy: "Log a game and get an instant, position-weighted A–F grade, a verified stat line, and a recruiting profile that updates itself. Stop hoping you get noticed — build the receipts.",
    points: [
      "Instant performance grades after every game",
      "Auto-built highlight reels from your footage",
      "A profile coaches actually trust — verified, not self-reported",
    ],
    cta: { label: "Build your profile", href: "/login" },
  },
  {
    tag: "For Scouts & Coaches",
    icon: Eye,
    title: "Find the real ones, faster.",
    copy: "Search verified players by grade, position, region, and trajectory. See who's trending up, who's open to opportunities, and watch the film — without sorting through a thousand mixtapes.",
    points: [
      "Filter a verified pool by grade, position & region",
      "Trajectory signals — who's actually improving",
      "Direct line to athletes who are open to be recruited",
    ],
    cta: { label: "Enter the Scout Hub", href: "/scout" },
  },
];

const bento = [
  {
    icon: BarChart3,
    title: "AI Performance Grades",
    description:
      "Every stat line becomes a position-weighted A–F grade with feedback that tells you exactly what to fix next.",
    span: "lg:col-span-3 lg:row-span-2",
    accent: true,
  },
  {
    icon: Video,
    title: "AI Video Analysis",
    description:
      "Upload film. Caliber pulls your stats and cuts the highlights automatically.",
    span: "lg:col-span-3",
  },
  {
    icon: Target,
    title: "Get Discovered",
    description:
      'Flip on "Open to Opportunities" and surface to the coaches searching your profile.',
    span: "lg:col-span-3",
  },
  {
    icon: Award,
    title: "50+ Skill Badges",
    description: "Sharpshooter, Glass Cleaner, Lockdown — progressive proof of your game.",
    span: "lg:col-span-2",
  },
  {
    icon: Trophy,
    title: "Live Leaderboards",
    description: "City, state, and national. Know exactly where you stand.",
    span: "lg:col-span-2",
  },
  {
    icon: Users,
    title: "Coach Tools",
    description: "Rosters, lineups, practice tracking, and verification in one place.",
    span: "lg:col-span-2",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Log your game",
    description: "Drop your stats or upload film. Under two minutes, every time.",
  },
  {
    step: "02",
    title: "Get graded",
    description:
      "Caliber turns the line into a verified A–F grade with feedback that actually moves the needle.",
  },
  {
    step: "03",
    title: "Get scouted",
    description:
      "Your profile climbs the boards, earns badges, and lands in front of the coaches who matter.",
  },
];

const showcaseTabs = [
  {
    id: "analytics",
    title: "Player Analytics",
    description:
      "Grades, trend lines, and position-specific breakdowns for every game you log.",
    icon: BarChart3,
  },
  {
    id: "social",
    title: "Community & Reputation",
    description:
      "Connect, share highlights, climb leaderboards, and build a name that travels.",
    icon: Users,
  },
  {
    id: "recruiting",
    title: "Recruiting Engine",
    description:
      "Match with programs, manage film, and get discovered by the right coaches.",
    icon: Target,
  },
];

const testimonials = [
  {
    quote:
      "After 47 logged games my shooting grade went from C+ to A-. The feedback after each game actually works.",
    name: "Marcus J.",
    title: "HS Point Guard",
    initials: "MJ",
  },
  {
    quote:
      "Two D1 coaches found my Caliber profile and reached out directly. The scouting report is what got their attention.",
    name: "Destiny W.",
    title: "College Prospect",
    initials: "DW",
  },
  {
    quote:
      "I run 3 AAU teams on Caliber. Verification and lineup analytics save me 5+ hours a week.",
    name: "Coach Rivera",
    title: "AAU Program Director",
    initials: "CR",
  },
];

const marqueeItems = [
  "Performance Grades",
  "AI Video Analysis",
  "Verified Profiles",
  "Recruiting",
  "Leaderboards",
  "Skill Badges",
  "Scouting",
  "Trajectory Signals",
  "Highlight Reels",
];

function formatStatNumber(value: number): string {
  if (value >= 1000000)
    return (value / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (value >= 1000) return value.toLocaleString();
  return String(value);
}

/* ───────────────────────── Small building blocks ───────────────────────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-label text-accent">
      <span className="h-px w-6 bg-accent/60" />
      {children}
    </span>
  );
}

function PrimaryCta({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <MagneticButton className={className}>
      <Link
        href={href}
        className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-7 py-3.5 text-[0.95rem] font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_50px_-12px_rgba(224,36,36,0.55)] transition-shadow duration-300 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_24px_70px_-10px_rgba(224,36,36,0.7)]"
        style={{ background: "linear-gradient(180deg, hsl(0 80% 56%), hsl(0 76% 47%))" }}
        data-testid="cta-primary"
      >
        <span
          aria-hidden
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
        />
        <span className="relative z-10">{children}</span>
        <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
    </MagneticButton>
  );
}

function GhostCta({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.02] px-7 py-3.5 text-[0.95rem] font-semibold text-foreground/90 backdrop-blur-sm transition-colors duration-300 hover:border-white/25 hover:bg-white/[0.05]"
    >
      {children}
      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5" />
    </Link>
  );
}

/* ───────────────────────── Page ───────────────────────── */

export default function Landing() {
  const [activeTab, setActiveTab] = useState("analytics");

  const { data: platformStats, isLoading: statsLoading } = useQuery<{
    playerCount: number;
    gameCount: number;
    badgeCount: number;
    coachCount: number;
  }>({ queryKey: ["/api/public/platform-stats"] });

  const stats = platformStats
    ? [
        { value: formatStatNumber(platformStats.playerCount), label: "Active Athletes" },
        { value: formatStatNumber(platformStats.gameCount), label: "Games Graded" },
        { value: formatStatNumber(platformStats.badgeCount) + "+", label: "Skill Badges" },
        { value: formatStatNumber(platformStats.coachCount), label: "Coaches & Scouts" },
      ]
    : [
        { value: "—", label: "Active Athletes" },
        { value: "—", label: "Games Graded" },
        { value: "50+", label: "Skill Badges" },
        { value: "—", label: "Coaches & Scouts" },
      ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <GlobalCursor />

      <style>{`
        @keyframes cb-marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes cb-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes cb-pulse-soft { 0%,100% { opacity: .45; } 50% { opacity: 1; } }
        .cb-grid {
          background-image:
            linear-gradient(to right, hsl(var(--border) / 0.55) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border) / 0.55) 1px, transparent 1px);
          background-size: 64px 64px;
          -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, #000 35%, transparent 75%);
          mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, #000 35%, transparent 75%);
        }
      `}</style>

      {/* ───── Nav ───── */}
      <nav className="sticky top-0 z-[100] border-b border-white/[0.06] bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5" data-testid="nav-logo">
            <CaliberLogo size={30} />
            <span className="font-display text-lg font-bold tracking-tight">Caliber</span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <AnimatedLink href="/scout" variant="underline" className="hidden md:inline-flex">
              For Scouts
            </AnimatedLink>
            <AnimatedLink href="/pricing" variant="underline" className="hidden md:inline-flex">
              Pricing
            </AnimatedLink>
            <AnimatedLink href="/login" variant="underline" className="hidden sm:inline-flex">
              Sign in
            </AnimatedLink>
            <DarkModeToggle />
            <Link
              href="/login"
              className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-full border border-white/12 px-4 py-2 text-sm font-semibold text-foreground"
              data-testid="nav-cta"
            >
              <span className="absolute inset-0 translate-y-[101%] bg-accent transition-transform duration-300 ease-expo group-hover:translate-y-0" />
              <span className="relative z-10 transition-colors duration-300 group-hover:text-accent-foreground">
                Get started
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ───── Hero ───── */}
      <section className="relative overflow-hidden px-5 pb-24 pt-16 sm:px-8 lg:pt-24">
        {/* ambient field */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 cb-grid" />
          <div
            className="absolute left-1/2 top-[-10%] h-[620px] w-[620px] -translate-x-1/2 rounded-full opacity-70"
            style={{ background: "radial-gradient(circle, hsl(var(--accent) / 0.16), transparent 60%)", filter: "blur(20px)" }}
          />
          <div
            className="absolute right-[8%] top-[30%] h-[360px] w-[360px] rounded-full opacity-60"
            style={{ background: "radial-gradient(circle, hsl(0 76% 45% / 0.14), transparent 65%)", filter: "blur(20px)" }}
          />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Left — copy */}
          <div>
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
                The recruiting platform for the next generation of hoopers
              </span>
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={1}
              className="mt-7 font-display font-black tracking-[-0.04em] text-foreground"
              style={{ fontSize: "clamp(3.1rem, 7vw, 5.6rem)", lineHeight: 0.95 }}
              data-testid="hero-headline"
            >
              Where the next
              <br />
              level{" "}
              <span className="relative whitespace-nowrap">
                <span className="bg-gradient-to-br from-white via-[#dbe4ea] to-[#9aaab6] bg-clip-text text-transparent">
                  finds you
                </span>
                <span className="font-editorial-italic italic font-normal text-accent">.</span>
              </span>
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={2}
              className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground"
            >
              Caliber turns every game into verified grades, auto-cut highlight reels,
              and a recruiting profile coaches actually trust — so the right scout finds
              the right player. No more hoping you get seen.
            </motion.p>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={3}
              className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <PrimaryCta href="/login">Build your profile</PrimaryCta>
              <GhostCta href="/scout">I&apos;m a recruiter</GhostCta>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={4}
              className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-muted-foreground"
            >
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" /> Free to start
              </span>
              <span className="inline-flex items-center gap-2">
                <Shield className="h-4 w-4 text-accent" /> Verified, not self-reported
              </span>
              <span className="inline-flex items-center gap-2">
                <Star className="h-4 w-4 fill-accent text-accent" /> Trusted by 10,000+ athletes
              </span>
            </motion.div>
          </div>

          {/* Right — product card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease }}
            className="relative mx-auto w-full max-w-md"
          >
            {/* floating chips */}
            <div
              className="absolute -left-4 top-10 z-20 hidden sm:block"
              style={{ animation: "cb-float 6s ease-in-out infinite" }}
            >
              <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-[#0c0c0c]/90 px-3.5 py-2.5 shadow-2xl backdrop-blur-xl">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15">
                  <Eye className="h-4 w-4 text-accent" />
                </span>
                <div className="text-xs leading-tight">
                  <p className="font-semibold text-foreground">Scouted by USC</p>
                  <p className="text-muted-foreground">2 coaches viewing</p>
                </div>
              </div>
            </div>

            <div
              className="absolute -right-3 bottom-12 z-20 hidden sm:block"
              style={{ animation: "cb-float 7s ease-in-out infinite", animationDelay: "1.2s" }}
            >
              <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-[#0c0c0c]/90 px-3.5 py-2.5 shadow-2xl backdrop-blur-xl">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15">
                  <LineChart className="h-4 w-4 text-accent" />
                </span>
                <div className="text-xs leading-tight">
                  <p className="font-semibold text-foreground">+12% this month</p>
                  <p className="text-muted-foreground">Trending up · #12 in state</p>
                </div>
              </div>
            </div>

            <TiltCard className="relative">
              <div
                aria-hidden
                className="absolute -inset-6"
                style={{ background: "radial-gradient(ellipse at 50% 30%, hsl(var(--accent) / 0.18), transparent 70%)", filter: "blur(30px)" }}
              />
              <div className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl">
                <div className="mb-5 flex items-center justify-between border-b border-white/[0.06] pb-4">
                  <div>
                    <p className="font-label text-muted-foreground">Player Report</p>
                    <p className="mt-1 font-display text-lg font-bold">Jordan Blake · PG</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-[0.68rem] font-medium text-accent">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { grade: "A+", label: "Scoring" },
                    { grade: "B+", label: "Defense" },
                    { grade: "A-", label: "Playmaking" },
                    { grade: "B", label: "Rebounding" },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5"
                    >
                      <GradeBadge grade={s.grade} size="md" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{s.label}</p>
                        <p className="font-label text-muted-foreground">Season</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* mini trend */}
                <div className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-label text-muted-foreground">Last 7 games</span>
                    <span className="text-xs font-medium text-emerald-400">+12% trend</span>
                  </div>
                  <div className="flex h-16 items-end gap-1.5">
                    {[42, 58, 50, 74, 66, 88, 96].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-sm bg-gradient-to-t from-accent/30 to-accent"
                        style={{ height: `${h}%`, opacity: 0.45 + i * 0.08 }}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/[0.06] pt-4">
                  {[
                    { icon: Trophy, value: "#12", label: "State Rank" },
                    { icon: Award, value: "8", label: "Badges" },
                    { icon: Zap, value: "14d", label: "Streak" },
                  ].map((m) => (
                    <div key={m.label}>
                      <m.icon className="mb-2 h-4 w-4 text-accent" />
                      <p className="font-display text-xl font-bold leading-none">{m.value}</p>
                      <p className="mt-1 font-label text-muted-foreground">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </TiltCard>
          </motion.div>
        </div>
      </section>

      {/* ───── Trust marquee ───── */}
      <section className="relative border-y border-white/[0.06] py-7">
        <p className="mb-5 text-center font-label text-muted-foreground">
          Built for every level of competition
        </p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
          <div className="flex w-max gap-10" style={{ animation: "cb-marquee 28s linear infinite" }}>
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span
                key={i}
                className="flex items-center gap-2.5 whitespace-nowrap font-display text-base tracking-tight text-muted-foreground/70"
              >
                <Sparkles className="h-3.5 w-3.5 text-accent/60" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Dual audience ───── */}
      <section className="px-5 py-24 sm:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mx-auto mb-14 max-w-2xl text-center">
            <Eyebrow>One platform · two sides</Eyebrow>
            <h2 className="mt-5 font-display text-4xl font-bold tracking-tight md:text-5xl">
              Both sides of the recruit,{" "}
              <span className="font-editorial-italic italic font-normal text-accent">
                finally connected
              </span>
              .
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              The athlete builds the proof. The scout finds the talent. Caliber is the
              handshake in between.
            </p>
          </Reveal>

          <div className="grid gap-6 lg:grid-cols-2">
            {dualAudience.map((col, i) => (
              <Reveal key={col.tag} delay={i * 0.6}>
                <div className="group relative h-full overflow-hidden rounded-[1.5rem] border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent p-8 transition-colors duration-300 hover:border-white/[0.16] md:p-10">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{ background: "radial-gradient(circle, hsl(var(--accent) / 0.12), transparent 70%)", filter: "blur(20px)" }}
                  />
                  <div className="relative">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-accent/10">
                        <col.icon className="h-5 w-5 text-accent" />
                      </span>
                      <span className="font-label text-accent">{col.tag}</span>
                    </div>
                    <h3 className="mt-6 font-display text-2xl font-bold tracking-tight md:text-3xl">
                      {col.title}
                    </h3>
                    <p className="mt-4 leading-relaxed text-muted-foreground">{col.copy}</p>
                    <ul className="mt-7 space-y-3">
                      {col.points.map((p) => (
                        <li key={p} className="flex items-start gap-3 text-sm text-foreground/90">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                          {p}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-8">
                      <AnimatedLink
                        href={col.cta.href}
                        variant="slide"
                        className="text-accent"
                        data-testid={`dual-cta-${i}`}
                      >
                        {col.cta.label}
                      </AnimatedLink>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Bento features ───── */}
      <section className="px-5 py-24 sm:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-14 max-w-2xl">
            <Eyebrow>Everything in one place</Eyebrow>
            <h2 className="mt-5 font-display text-4xl font-bold tracking-tight md:text-5xl">
              The tools that get you{" "}
              <span className="font-editorial-italic italic font-normal text-accent">
                seen
              </span>
              .
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From grading to recruiting — built to be fast, honest, and impossible to fake.
            </p>
          </Reveal>

          <div className="grid auto-rows-[200px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {bento.map((b, i) => (
              <Reveal key={b.title} delay={i * 0.35} className={b.span}>
                <div
                  className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-[1.4rem] border p-6 transition-all duration-300 ${
                    b.accent
                      ? "border-white/[0.1] bg-gradient-to-br from-accent/[0.08] via-white/[0.02] to-transparent"
                      : "border-white/[0.07] bg-white/[0.02]"
                  } hover:-translate-y-1 hover:border-white/[0.18]`}
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{ background: "radial-gradient(circle, hsl(var(--accent) / 0.14), transparent 70%)", filter: "blur(24px)" }}
                  />
                  <div className="relative">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                      <b.icon className="h-5 w-5 text-accent" />
                    </span>
                  </div>
                  <div className="relative">
                    <h3 className="font-display text-xl font-bold tracking-tight">{b.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {b.description}
                    </p>
                    {b.accent && (
                      <div className="mt-5 flex items-center gap-2">
                        {["A+", "A-", "B+"].map((g) => (
                          <GradeBadge key={g} grade={g} size="sm" />
                        ))}
                        <span className="ml-1 text-xs text-muted-foreground">
                          live, position-weighted
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───── How it works ───── */}
      <section className="px-5 py-24 sm:px-8 lg:py-32">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mb-14 max-w-2xl">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-5 font-display text-4xl font-bold tracking-tight md:text-5xl">
              Three steps to your{" "}
              <span className="font-editorial-italic italic font-normal text-accent">
                best season
              </span>
              .
            </h2>
          </Reveal>

          <div className="grid gap-5 md:grid-cols-3">
            {howItWorks.map((s, i) => (
              <Reveal key={s.step} delay={i * 0.5}>
                <div className="relative h-full rounded-[1.4rem] border border-white/[0.07] bg-white/[0.02] p-7">
                  <span className="font-display text-5xl font-black tracking-tighter text-accent/25">
                    {s.step}
                  </span>
                  <h3 className="mt-4 font-display text-xl font-bold tracking-tight">{s.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {s.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Product showcase ───── */}
      <section className="px-5 py-24 sm:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-12 max-w-2xl">
            <Eyebrow>Inside the product</Eyebrow>
            <h2 className="mt-5 font-display text-4xl font-bold tracking-tight md:text-5xl">
              One platform. <span className="font-editorial-italic italic font-normal text-accent">Total</span> control.
            </h2>
          </Reveal>

          <div className="grid items-start gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="space-y-3">
              {showcaseTabs.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full rounded-2xl border p-5 text-left transition-all duration-300 ${
                      active
                        ? "border-accent/30 bg-accent/[0.06]"
                        : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14]"
                    }`}
                    data-testid={`tab-${tab.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <tab.icon className={`h-5 w-5 ${active ? "text-accent" : "text-muted-foreground"}`} />
                      <h3 className={`font-display text-lg font-semibold ${active ? "text-foreground" : "text-muted-foreground"}`}>
                        {tab.title}
                      </h3>
                      <ChevronRight className={`ml-auto h-4 w-4 transition-transform duration-300 ${active ? "rotate-90 text-accent" : "text-muted-foreground"}`} />
                    </div>
                    {active && (
                      <p className="mt-3 pl-8 text-sm leading-relaxed text-muted-foreground">
                        {tab.description}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="relative min-h-[420px] overflow-hidden rounded-[1.5rem] border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
                <span className="inline-flex items-center gap-2 font-label text-muted-foreground">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  {activeTab === "analytics" && "Player Dashboard"}
                  {activeTab === "social" && "Community Feed"}
                  {activeTab === "recruiting" && "Recruiting Board"}
                </span>
                <PlayCircle className="h-4 w-4 text-muted-foreground/50" />
              </div>

              <div className="space-y-7 p-7" data-testid="showcase-preview">
                {activeTab === "analytics" && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { icon: BarChart3, value: "A+", label: "Overall" },
                        { icon: Trophy, value: "24.5", label: "PPG" },
                        { icon: Zap, value: "87%", label: "Consistency" },
                      ].map((s) => (
                        <div key={s.label} className="space-y-2 text-center">
                          <s.icon className="mx-auto h-6 w-6 text-accent" />
                          <p className="font-display text-3xl font-bold">{s.value}</p>
                          <p className="font-label text-muted-foreground">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3 border-t border-white/[0.06] pt-6">
                      <div className="flex items-center justify-between">
                        <span className="font-label text-muted-foreground">Last 6 games</span>
                        <span className="text-xs text-emerald-400">+12% trend</span>
                      </div>
                      <div className="flex h-16 items-end gap-1.5">
                        {[40, 62, 48, 78, 70, 92].map((h, i) => (
                          <div key={i} className="flex-1 rounded-sm bg-accent" style={{ height: `${h}%`, opacity: 0.35 + i * 0.11 }} />
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-6 text-sm">
                      {[["FG%", "52.4"], ["3PT%", "41.8"], ["AST", "6.1"], ["REB", "4.7"]].map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between">
                          <span className="text-muted-foreground">{k}</span>
                          <span className="font-medium">{v}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {activeTab === "social" && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { icon: Users, value: "342", label: "Connections" },
                        { icon: Award, value: "15", label: "Badges" },
                        { icon: Star, value: "28", label: "Highlights" },
                      ].map((s) => (
                        <div key={s.label} className="space-y-2 text-center">
                          <s.icon className="mx-auto h-6 w-6 text-accent" />
                          <p className="font-display text-3xl font-bold">{s.value}</p>
                          <p className="font-label text-muted-foreground">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3 border-t border-white/[0.06] pt-6">
                      <span className="font-label text-muted-foreground">Recent badges</span>
                      <div className="flex flex-wrap gap-2">
                        {["Sharpshooter", "Glass Cleaner", "Floor General", "Lockdown", "40-Pt Club"].map((b) => (
                          <span key={b} className="rounded-full border border-white/10 bg-accent/[0.06] px-2.5 py-1 text-xs text-foreground/80">
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3 border-t border-white/[0.06] pt-6">
                      <span className="font-label text-muted-foreground">Leaderboard · State</span>
                      {[
                        { rank: "01", name: "Jaylen M.", pts: "28.4" },
                        { rank: "02", name: "You", pts: "24.5", me: true },
                        { rank: "03", name: "Aria T.", pts: "22.1" },
                      ].map((r) => (
                        <div key={r.rank} className={`flex items-center justify-between text-sm ${r.me ? "font-medium text-accent" : "text-foreground/80"}`}>
                          <span className="flex items-center gap-3">
                            <span className="font-label text-muted-foreground">{r.rank}</span>
                            {r.name}
                          </span>
                          <span>{r.pts} PPG</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {activeTab === "recruiting" && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { icon: Target, value: "12", label: "Matches" },
                        { icon: Video, value: "5", label: "Film Reels" },
                        { icon: Shield, value: "3", label: "Endorsements" },
                      ].map((s) => (
                        <div key={s.label} className="space-y-2 text-center">
                          <s.icon className="mx-auto h-6 w-6 text-accent" />
                          <p className="font-display text-3xl font-bold">{s.value}</p>
                          <p className="font-label text-muted-foreground">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3 border-t border-white/[0.06] pt-6">
                      <span className="font-label text-muted-foreground">Program matches</span>
                      {[
                        { name: "Michigan", div: "D1", fit: "94%" },
                        { name: "Gonzaga", div: "D1", fit: "89%" },
                        { name: "Saint Mary's", div: "D1", fit: "82%" },
                      ].map((p) => (
                        <div key={p.name} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-3 text-foreground/90">
                            <span className="font-label text-muted-foreground">{p.div}</span>
                            {p.name}
                          </span>
                          <span className="font-medium text-accent">{p.fit}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between border-t border-white/[0.06] pt-6">
                      <span className="inline-flex items-center gap-2 text-sm text-foreground/80">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                        Open to opportunities
                      </span>
                      <span className="font-label text-accent">On</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── By the numbers ───── */}
      <section className="px-5 py-24 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[1.5rem] border border-white/[0.08] bg-white/[0.04] md:grid-cols-4">
            {stats.map((stat, i) => (
              <div key={stat.label} className="bg-background/40 p-8 md:p-10">
                <div className="font-label text-muted-foreground">{`0${i + 1}`}</div>
                <div
                  className="mt-3 font-display text-4xl font-black tracking-tight md:text-5xl lg:text-6xl"
                  style={statsLoading ? { animation: "cb-pulse-soft 1.5s ease-in-out infinite" } : undefined}
                  data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {stat.value}
                </div>
                <div className="mt-3 font-label text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Testimonials ───── */}
      <section className="px-5 py-24 sm:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-14 max-w-2xl">
            <Eyebrow>Receipts</Eyebrow>
            <h2 className="mt-5 font-display text-4xl font-bold tracking-tight md:text-5xl">
              In their <span className="font-editorial-italic italic font-normal text-accent">own</span> words.
            </h2>
          </Reveal>

          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.5}>
                <figure className="flex h-full flex-col rounded-[1.4rem] border border-white/[0.07] bg-white/[0.02] p-7">
                  <span className="font-editorial-italic text-5xl leading-none text-accent/40">&ldquo;</span>
                  <blockquote className="mt-2 flex-1 text-lg leading-snug text-foreground/90" data-testid={`testimonial-${i}`}>
                    {t.quote}
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 border-t border-white/[0.06] pt-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 font-display text-sm font-bold text-accent">
                      {t.initials}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{t.name}</div>
                      <div className="font-label text-muted-foreground">{t.title}</div>
                    </div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Final CTA ───── */}
      <section className="relative px-5 py-28 sm:px-8 lg:py-36">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 55% 60% at 50% 50%, hsl(var(--accent) / 0.1), transparent 70%)" }}
        />
        <Reveal className="relative mx-auto max-w-3xl text-center">
          <div className="mb-6 flex justify-center">
            <CaliberLogo size={52} />
          </div>
          <h2 className="font-display text-4xl font-black tracking-[-0.03em] md:text-6xl">
            Ready to find your{" "}
            <span className="font-editorial-italic italic font-normal text-accent">caliber</span>?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Join thousands of players, coaches, and scouts already on the platform. Build
            your profile today — it&apos;s free to start.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <PrimaryCta href="/login">Start free today</PrimaryCta>
            <GhostCta href="/pricing">View pricing</GhostCta>
          </div>
        </Reveal>
      </section>

      {/* ───── Footer ───── */}
      <footer className="border-t border-white/[0.06] px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5">
                <CaliberLogo size={34} />
                <span className="font-display text-lg font-bold tracking-tight">Caliber</span>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
                The performance platform for serious athletes. Track your game, earn your
                rank, and get discovered.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-label text-foreground">Platform</h4>
              <AnimatedLink href="/pricing" variant="underline" className="block text-sm text-muted-foreground">Pricing</AnimatedLink>
              <AnimatedLink href="/scout" variant="underline" className="block text-sm text-muted-foreground">Scout Hub</AnimatedLink>
            </div>
            <div className="space-y-3">
              <h4 className="font-label text-foreground">Get started</h4>
              <AnimatedLink href="/login" variant="underline" className="block text-sm text-muted-foreground">Sign in</AnimatedLink>
              <AnimatedLink href="/login" variant="underline" className="block text-sm text-muted-foreground">Create account</AnimatedLink>
            </div>
          </div>
          <div className="mt-12 border-t border-white/[0.06] pt-7 text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Caliber Performance Labs. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
