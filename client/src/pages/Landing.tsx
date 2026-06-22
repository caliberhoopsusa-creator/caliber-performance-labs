import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight, BarChart3, Video, Award, Trophy, Users, Target,
  Shield, Zap, Quote, ChevronRight, Star, ClipboardList, TrendingUp
} from "lucide-react";
import { Link } from "wouter";
import { CaliberLogo } from "@/components/CaliberLogo";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { GradeBadge } from "@/components/GradeBadge";
import {
  GlobalCursor,
  MagneticButton,
  TiltCard,
  Reveal,
  LiveFeed,
} from "./landing-animations";

const features = [
  { icon: BarChart3, title: "Performance Grades", description: "Instant A-F grades based on position-weighted stats after every game." },
  { icon: Video, title: "AI Video Analysis", description: "Upload game footage and let AI extract your stats automatically." },
  { icon: Award, title: "Skill Badges", description: "Earn 50+ progressive badges like Sharpshooter and Glass Cleaner." },
  { icon: Trophy, title: "Leaderboards", description: "Compete on global and local leaderboards. Track your rank." },
  { icon: Users, title: "Coach Tools", description: "Team management, lineups, practice tracking, and player development." },
  { icon: Target, title: "Get Scouted", description: "Toggle 'Open to Opportunities' and get discovered by coaches." },
];

const testimonials = [
  {
    quote: "After logging 47 games this season, my shooting grade went from C+ to A-. The improvement tips after each game actually work.",
    name: "Marcus J.",
    title: "High School Point Guard",
    initials: "MJ",
  },
  {
    quote: "I manage 3 AAU teams on Caliber. The game verification system and lineup analytics save me 5+ hours every week.",
    name: "Coach Rivera",
    title: "AAU Program Director",
    initials: "CR",
  },
  {
    quote: "Two D1 coaches found my Caliber profile and reached out directly. The AI scouting report is what got their attention.",
    name: "Destiny W.",
    title: "College Prospect",
    initials: "DW",
  },
];

const showcaseTabs = [
  {
    id: "analytics",
    title: "Player Analytics",
    description: "Track every game with performance grades, trend lines, and position-specific breakdowns.",
    icon: BarChart3,
  },
  {
    id: "social",
    title: "Community & Social",
    description: "Connect with players, share highlights, compete on leaderboards, and build your reputation.",
    icon: Users,
  },
  {
    id: "recruiting",
    title: "Recruiting Tools",
    description: "Build your recruiting profile, match with college programs, and get discovered by coaches.",
    icon: Target,
  },
];

const marqueeItems = [
  "Basketball", "Analytics", "AI-Powered", "Badges",
  "Leaderboards", "Recruiting", "Performance", "Scouting", "Training",
  "Video Analysis", "Player Grades",
];

const howItWorks = [
  {
    step: 1,
    icon: ClipboardList,
    title: "Log Your Game",
    description: "Enter your stats after each game. Takes less than 2 minutes.",
  },
  {
    step: 2,
    icon: BarChart3,
    title: "Get Your Grade",
    description: "Your stats are analyzed and turned into an A-F grade with detailed feedback.",
  },
  {
    step: 3,
    icon: TrendingUp,
    title: "Level Up",
    description: "Track improvement over time, earn badges, climb leaderboards, and get scouted.",
  },
];

function formatStatNumber(value: number): string {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (value >= 1000) {
    return value.toLocaleString();
  }
  return String(value);
}

export default function Landing() {
  const [activeTab, setActiveTab] = useState("analytics");

  const { data: platformStats, isLoading: statsLoading } = useQuery<{
    playerCount: number;
    gameCount: number;
    badgeCount: number;
    coachCount: number;
  }>({
    queryKey: ['/api/public/platform-stats'],
  });

  const stats = platformStats
    ? [
        { value: formatStatNumber(platformStats.playerCount), label: "Active Players" },
        { value: formatStatNumber(platformStats.gameCount), label: "Games Logged" },
        { value: formatStatNumber(platformStats.badgeCount) + "+", label: "Skill Badges" },
        { value: formatStatNumber(platformStats.coachCount), label: "Coaches" },
      ]
    : [
        { value: "---", label: "Active Players" },
        { value: "---", label: "Games Logged" },
        { value: "50+", label: "Skill Badges" },
        { value: "---", label: "Coaches" },
      ];

  return (
    <div className="min-h-screen bg-background relative">
      <GlobalCursor />
      <LiveFeed />
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes pulse-placeholder {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>

      <nav className="sticky top-0 z-[100] bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CaliberLogo size={32} color="#4f6878" />
            <span className="font-label text-muted-foreground hidden sm:inline">Est. MMXXVI</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/pricing">
              <Button variant="ghost" className="hidden sm:flex" data-testid="button-pricing">
                Pricing
              </Button>
            </Link>
            <Link href="/scout">
              <Button variant="ghost" className="hidden sm:flex" data-testid="button-scout-hub">
                Scout Hub
              </Button>
            </Link>
            <DarkModeToggle />
            <Button asChild className="bg-accent text-white border-accent-border" data-testid="button-login">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </nav>

      <section className="relative pt-6 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 hero-gradient-bg opacity-40 pointer-events-none" />
        <div className="grain-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background pointer-events-none" />

        <div
          aria-hidden
          className="hidden lg:block absolute left-2 top-32 font-label text-muted-foreground"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", letterSpacing: "0.28em" }}
        >
          Caliber · Spring 2026 · Volume I
        </div>
        <div
          aria-hidden
          className="hidden lg:block absolute right-2 top-32 font-label text-muted-foreground"
          style={{ writingMode: "vertical-rl", letterSpacing: "0.28em" }}
        >
          The Athletes' Quarterly · No. 01
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="editorial-rise editorial-rise-1 flex items-center justify-between py-3 border-b border-border flex-wrap gap-x-6 gap-y-2">
            <span className="font-label text-muted-foreground">Vol. I · No. 01</span>
            <span className="font-label text-muted-foreground hidden sm:inline">Spring MMXXVI</span>
            <span className="font-label text-muted-foreground hidden md:inline">caliber.app</span>
            <span className="font-label text-muted-foreground">$0.00 · Free Forever</span>
          </div>

          <div className="editorial-rise editorial-rise-2 pt-4 pb-2">
            <h1
              className="font-display font-black text-foreground text-center md:text-left"
              style={{
                fontSize: "clamp(4.5rem, 17vw, 15rem)",
                lineHeight: 0.82,
                letterSpacing: "-0.055em",
              }}
              data-testid="hero-masthead"
            >
              CALIBER
            </h1>
          </div>

          <div className="editorial-rise editorial-rise-2 flex items-center justify-between py-3 border-y border-border flex-wrap gap-x-6 gap-y-2">
            <span className="font-label text-accent">The Athletes' Quarterly</span>
            <span className="font-label text-muted-foreground hidden sm:inline">Basketball · Analytics · Recruiting</span>
            <span className="font-label text-muted-foreground">Issue 01 / Spring '26</span>
          </div>

          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 pt-16 pb-10">
            <div className="lg:col-span-7 space-y-8 relative">
              <span className="editorial-rise editorial-rise-3 editorial-rule font-label text-accent">
                Cover Story · P. 01
              </span>

              <h2
                className="editorial-rise editorial-rise-3 font-display font-bold tracking-tight leading-[0.95]"
                style={{ fontSize: "clamp(3rem, 7.5vw, 6rem)" }}
              >
                <span className="block text-foreground">Your game.</span>
                <span className="block text-foreground/90">No longer</span>
                <span className="block font-editorial-italic font-normal text-accent italic text-[1.05em] -mt-1">
                  a mystery.
                </span>
              </h2>

              <p
                className="editorial-rise editorial-rise-4 font-editorial text-xl leading-relaxed text-muted-foreground max-w-xl"
                style={{ fontStyle: "normal" }}
              >
                <span
                  className="float-left font-editorial-italic italic text-foreground mr-3"
                  style={{
                    fontSize: "4.5rem",
                    lineHeight: 0.85,
                    marginTop: "0.15rem",
                  }}
                  aria-hidden
                >
                  P
                </span>
                erformance grades, skill badges, leaderboards, and recruiting tools — the measured platform serious athletes use to level up.
              </p>

              <div className="editorial-rise editorial-rise-4 flex flex-col sm:flex-row items-start gap-4 pt-2">
                <MagneticButton>
                  <Button
                    size="lg"
                    asChild
                    className="min-w-[200px] bg-accent text-white border-accent-border"
                    data-testid="button-get-started"
                  >
                    <Link href="/login" className="flex items-center gap-2">
                      Get Started Free
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </Button>
                </MagneticButton>
                <div className="flex items-center gap-2 text-sm text-muted-foreground px-2">
                  <Star className="w-4 h-4 text-accent fill-accent" />
                  <span>Trusted by 10,000+ athletes nationwide</span>
                </div>
              </div>

              <div className="editorial-rise editorial-rise-5 pt-6 border-t border-border">
                <div className="flex items-baseline justify-between mb-4">
                  <span className="font-label text-accent">Also in this issue</span>
                  <span className="font-label text-muted-foreground">5 features</span>
                </div>
                <ul className="space-y-3">
                  {[
                    { page: "P. 12", lead: "The 50-badge system", tail: "every serious player chases" },
                    { page: "P. 24", lead: "How the AI sees", tail: "what coaches can't" },
                    { page: "P. 31", lead: "Tryout to D1", tail: "a scouted profile, step by step" },
                  ].map((item) => (
                    <li key={item.page} className="flex items-baseline gap-5 group cursor-default">
                      <span className="font-label text-muted-foreground shrink-0">{item.page}</span>
                      <span className="font-editorial text-lg md:text-xl text-foreground/90 leading-snug">
                        {item.lead}{" "}
                        <span className="font-editorial-italic italic text-muted-foreground">{item.tail}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="lg:col-span-5 editorial-rise editorial-rise-3 relative">
              <span
                className="absolute -top-4 left-6 z-10 bg-accent text-white font-label px-3 py-1.5 rounded-sm"
                style={{ boxShadow: "0 6px 24px rgba(0,0,0,0.35)" }}
              >
                Exclusive · This Issue
              </span>
              <TiltCard className="relative">
                <div
                  className="absolute -inset-8 pointer-events-none"
                  style={{
                    background: "radial-gradient(ellipse at 50% 50%, hsl(var(--accent) / 0.15) 0%, transparent 70%)",
                    filter: "blur(40px)",
                  }}
                />
                <div className="relative bg-card/60 backdrop-blur-sm border border-border rounded-md p-6 md:p-7">
                  <div className="flex items-baseline justify-between mb-5 pb-4 border-b border-border">
                    <span className="font-label text-muted-foreground">Player Report</span>
                    <span className="font-label text-accent">Live</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-5" data-testid="hero-stat-preview">
                    {[
                      { grade: "A+", label: "Scoring" },
                      { grade: "B+", label: "Defense" },
                      { grade: "A-", label: "Playmaking" },
                      { grade: "B", label: "Rebounding" },
                    ].map((stat) => (
                      <div key={stat.label} className="border border-border rounded-md p-4 flex items-center gap-3 bg-background/30">
                        <GradeBadge grade={stat.grade} size="lg" />
                        <div className="min-w-0">
                          <p className="font-label text-muted-foreground">{stat.label}</p>
                          <p className="text-xs text-foreground/70 mt-1">This season</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-0 border-t border-border pt-4">
                    {[
                      { icon: Trophy, value: "#12", label: "City Rank" },
                      { icon: Award, value: "8", label: "Badges" },
                      { icon: Zap, value: "14d", label: "Streak" },
                    ].map((item, i) => (
                      <div key={item.label} className={`hairline-col px-3 ${i === 0 ? '' : 'pl-4'}`}>
                        <item.icon className="w-4 h-4 text-accent mb-2" />
                        <p className="font-editorial text-2xl text-foreground leading-none">{item.value}</p>
                        <p className="font-label text-muted-foreground mt-1.5">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </TiltCard>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="font-label text-muted-foreground">Fig. 01 — Player Report, live view</span>
                <span className="font-label text-muted-foreground">Photo: Caliber Labs</span>
              </div>
            </div>
          </div>

          <div className="editorial-rise editorial-rise-5 pt-5 border-t border-border flex items-end justify-between gap-6 flex-wrap">
            <div className="flex items-end gap-[3px] h-10" aria-hidden>
              {[3,1,2,1,4,1,2,3,1,2,1,4,2,1,3,1,2,1,3,2,1,4,1,2,1,3,1,2].map((w, i) => (
                <span
                  key={i}
                  className="bg-foreground block"
                  style={{ width: `${w}px`, height: "100%" }}
                />
              ))}
              <span className="font-label text-muted-foreground ml-3 self-end pb-0.5">9 771234 567890</span>
            </div>
            <span className="font-label text-muted-foreground">caliber.app / join</span>
            <span className="font-label text-accent">#CALIBER26</span>
          </div>
        </div>
      </section>

      <section className="relative py-12 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, hsl(0 68% 14%) 0%, hsl(0 76% 28%) 50%, hsl(0 68% 14%) 100%)",
          }}
        />
        <div className="grain-overlay" />
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
          }}
        />
        <div className="relative">
          <p className="text-center font-label text-white/60 mb-8">
            Built for every level of competition
          </p>
          <div className="relative overflow-hidden">
            <div
              className="flex gap-12 whitespace-nowrap"
              style={{
                animation: "marquee 20s linear infinite",
                width: "max-content",
              }}
            >
              {[...marqueeItems, ...marqueeItems].map((item, i) => (
                <span
                  key={`${item}-${i}`}
                  className="text-lg font-display tracking-wide text-white/70 flex items-center gap-3"
                >
                  <Shield className="w-4 h-4 text-white/50" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <span className="editorial-rule font-label text-accent">Features</span>
            <h2 className="text-4xl md:text-6xl font-display font-bold text-foreground mt-5 leading-[1.05]">
              Everything you need to <span className="font-editorial-italic italic text-accent">dominate</span>.
            </h2>
            <p className="text-muted-foreground mt-5 text-lg leading-relaxed">
              From game grading to recruiting, Caliber gives athletes the tools to track, improve, and get discovered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Reveal key={feature.title} delay={i * 0.5}>
                <Card className="hover-elevate group h-full">
                  <CardContent className="p-6 space-y-4">
                    <div className="w-10 h-10 rounded-md bg-accent/10 flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-accent" />
                    </div>
                    <h3 className="font-display text-xl text-foreground" data-testid={`feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                    <button
                      className="flex items-center gap-1 text-accent text-sm font-medium group/link"
                      data-testid={`link-learn-more-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      Learn more
                      <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                    </button>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4" data-testid="section-how-it-works">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <span className="editorial-rule font-label text-accent">How It Works</span>
            <h2 className="text-4xl md:text-6xl font-display font-bold text-foreground mt-5 leading-[1.05]">
              Three steps to your <span className="font-editorial-italic italic">best season</span>.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-16 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-border" />

            {howItWorks.map((item) => (
              <Card key={item.step} className="relative">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="relative z-10 mx-auto w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center text-lg font-display font-bold" data-testid={`step-number-${item.step}`}>
                    {item.step}
                  </div>
                  <div className="w-10 h-10 rounded-md bg-accent/10 flex items-center justify-center mx-auto">
                    <item.icon className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="font-display text-xl text-foreground" data-testid={`step-title-${item.step}`}>
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <span className="editorial-rule font-label text-accent">Product</span>
            <h2 className="text-4xl md:text-6xl font-display font-bold text-foreground mt-5 leading-[1.05]">
              One platform. <span className="font-editorial-italic italic">Total</span> control.
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-3">
              {showcaseTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left p-5 rounded-md border transition-colors ${
                    activeTab === tab.id
                      ? "border-accent/30 bg-accent/5"
                      : "border-border bg-card/50"
                  }`}
                  data-testid={`tab-${tab.id}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? "text-accent" : "text-muted-foreground"}`} />
                    <h3 className={`font-display text-lg ${activeTab === tab.id ? "text-foreground" : "text-muted-foreground"}`}>
                      {tab.title}
                    </h3>
                    <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${activeTab === tab.id ? "rotate-90 text-accent" : "text-muted-foreground"}`} />
                  </div>
                  {activeTab === tab.id && (
                    <p className="text-sm text-muted-foreground pl-8 leading-relaxed">
                      {tab.description}
                    </p>
                  )}
                </button>
              ))}
            </div>

            <TiltCard className="relative bg-card border border-border rounded-md overflow-hidden" style={{ minHeight: 420 }}>
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-label text-muted-foreground">
                    {activeTab === "analytics" && "Player Dashboard"}
                    {activeTab === "social" && "Community Feed"}
                    {activeTab === "recruiting" && "Recruiting Board"}
                  </span>
                </div>
                <span className="font-label text-muted-foreground/60">Live</span>
              </div>

              <div className="p-6 md:p-8 space-y-7" data-testid="showcase-preview">
                {activeTab === "analytics" && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center space-y-2">
                        <BarChart3 className="w-7 h-7 text-accent mx-auto" />
                        <p className="text-3xl font-display font-bold text-foreground">A+</p>
                        <p className="font-label text-muted-foreground">Overall</p>
                      </div>
                      <div className="text-center space-y-2">
                        <Trophy className="w-7 h-7 text-accent mx-auto" />
                        <p className="text-3xl font-display font-bold text-foreground">24.5</p>
                        <p className="font-label text-muted-foreground">PPG</p>
                      </div>
                      <div className="text-center space-y-2">
                        <Zap className="w-7 h-7 text-accent mx-auto" />
                        <p className="text-3xl font-display font-bold text-foreground">87%</p>
                        <p className="font-label text-muted-foreground">Consistency</p>
                      </div>
                    </div>

                    <div className="border-t border-border pt-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-label text-muted-foreground">Last 6 games</span>
                        <span className="text-xs text-emerald-400">+12% trend</span>
                      </div>
                      <div className="flex items-end gap-1.5 h-16">
                        {[40, 62, 48, 78, 70, 92].map((h, i) => (
                          <div key={i} className="flex-1 rounded-sm bg-accent/80" style={{ height: `${h}%`, opacity: 0.35 + (i * 0.11) }} />
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-t border-border pt-6">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">FG%</span>
                        <span className="font-medium text-foreground">52.4</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">3PT%</span>
                        <span className="font-medium text-foreground">41.8</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">AST</span>
                        <span className="font-medium text-foreground">6.1</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">REB</span>
                        <span className="font-medium text-foreground">4.7</span>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "social" && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center space-y-2">
                        <Users className="w-7 h-7 text-accent mx-auto" />
                        <p className="text-3xl font-display font-bold text-foreground">342</p>
                        <p className="font-label text-muted-foreground">Connections</p>
                      </div>
                      <div className="text-center space-y-2">
                        <Award className="w-7 h-7 text-accent mx-auto" />
                        <p className="text-3xl font-display font-bold text-foreground">15</p>
                        <p className="font-label text-muted-foreground">Badges</p>
                      </div>
                      <div className="text-center space-y-2">
                        <Star className="w-7 h-7 text-accent mx-auto" />
                        <p className="text-3xl font-display font-bold text-foreground">28</p>
                        <p className="font-label text-muted-foreground">Highlights</p>
                      </div>
                    </div>

                    <div className="border-t border-border pt-6 space-y-3">
                      <span className="font-label text-muted-foreground">Recent badges</span>
                      <div className="flex flex-wrap gap-2">
                        {["Sharpshooter", "Glass Cleaner", "Floor General", "Lockdown", "40-Point Club"].map((b) => (
                          <span key={b} className="px-2.5 py-1 rounded-full border border-border text-xs text-foreground/80 bg-accent/5">
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-border pt-6 space-y-3">
                      <span className="font-label text-muted-foreground">Leaderboard · State</span>
                      {[
                        { rank: "01", name: "Jaylen M.", pts: "28.4" },
                        { rank: "02", name: "You", pts: "24.5", me: true },
                        { rank: "03", name: "Aria T.", pts: "22.1" },
                      ].map((r) => (
                        <div key={r.rank} className={`flex items-center justify-between text-sm ${r.me ? "text-accent font-medium" : "text-foreground/80"}`}>
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
                      <div className="text-center space-y-2">
                        <Target className="w-7 h-7 text-accent mx-auto" />
                        <p className="text-3xl font-display font-bold text-foreground">12</p>
                        <p className="font-label text-muted-foreground">Matches</p>
                      </div>
                      <div className="text-center space-y-2">
                        <Video className="w-7 h-7 text-accent mx-auto" />
                        <p className="text-3xl font-display font-bold text-foreground">5</p>
                        <p className="font-label text-muted-foreground">Film Reels</p>
                      </div>
                      <div className="text-center space-y-2">
                        <Shield className="w-7 h-7 text-accent mx-auto" />
                        <p className="text-3xl font-display font-bold text-foreground">3</p>
                        <p className="font-label text-muted-foreground">Endorsements</p>
                      </div>
                    </div>

                    <div className="border-t border-border pt-6 space-y-3">
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

                    <div className="border-t border-border pt-6 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm text-foreground/80">Open to opportunities</span>
                      </div>
                      <span className="font-label text-muted-foreground">On</span>
                    </div>
                  </>
                )}
              </div>
            </TiltCard>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <span className="editorial-rule font-label text-accent">By the Numbers</span>
            <h2 className="text-4xl md:text-6xl font-display font-bold text-foreground mt-5 leading-[1.05]">
              The numbers <span className="font-editorial-italic italic">don't</span> lie.
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 border-y border-border">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={`hairline-col py-10 px-6 ${i === 0 ? '' : 'md:pl-8'}`}
              >
                <div className="font-label text-muted-foreground mb-3">{`0${i + 1}`}</div>
                <div
                  className="font-editorial text-5xl md:text-6xl lg:text-7xl text-foreground leading-none"
                  style={statsLoading ? { animation: 'pulse-placeholder 1.5s ease-in-out infinite' } : undefined}
                  data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {stat.value}
                </div>
                <div className="font-label text-muted-foreground mt-4">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <span className="editorial-rule font-label text-accent">Testimonials</span>
            <h2 className="text-4xl md:text-6xl font-display font-bold text-foreground mt-5 leading-[1.05]">
              In their <span className="font-editorial-italic italic">own</span> words.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <figure key={testimonial.name} className="relative pt-8 border-t border-border">
                <span className="absolute -top-1 left-0 font-editorial-italic italic text-6xl text-accent leading-none select-none">&ldquo;</span>
                <blockquote
                  className="font-editorial text-xl md:text-2xl text-foreground/90 leading-snug pt-4"
                  data-testid={`testimonial-quote-${index}`}
                >
                  {testimonial.quote}
                </blockquote>
                <figcaption className="flex items-center gap-3 pt-6 mt-6 border-t border-border/60">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-display text-sm font-bold">
                    {testimonial.initials}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground" data-testid={`testimonial-name-${index}`}>{testimonial.name}</div>
                    <div className="font-label text-muted-foreground mt-0.5">{testimonial.title}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: "Bank-Level Security", description: "Your data is encrypted and protected with enterprise-grade security." },
            { icon: Zap, title: "Real-Time Updates", description: "See your grades and stats update instantly after every game." },
            { icon: Star, title: "Free Forever Plan", description: "Core features are always free. Upgrade for advanced analytics." },
          ].map((item) => (
            <Card key={item.title} className="hover-elevate">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-md bg-accent/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-display text-lg text-foreground" data-testid={`highlight-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="cta" className="py-32 px-4 relative">
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 50% 50%, hsl(38 94% 44% / 0.06) 0%, transparent 60%)",
          }}
        />
        <div className="relative max-w-3xl mx-auto text-center space-y-8">
          <span className="editorial-rule font-label text-accent justify-center flex">Join The Platform</span>
          <h2 className="text-5xl md:text-7xl font-display font-bold text-foreground leading-[1.02]">
            Ready to find your <span className="font-editorial-italic italic text-accent">caliber</span>?
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Join thousands of players, coaches, and scouts already on the platform. Start tracking your game today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <MagneticButton>
              <Button
                size="lg"
                asChild
                className="min-w-[200px] bg-accent text-white border-accent-border"
                data-testid="button-cta-start"
              >
                <Link href="/login" className="flex items-center gap-2">
                  Start Free Today
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </MagneticButton>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="min-w-[200px]" data-testid="button-cta-pricing">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-16 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <CaliberLogo size={40} color="#4f6878" />
                <span className="text-xl font-bold font-display text-foreground tracking-wide">Caliber</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                The performance platform for serious athletes. Track your game, earn your rank, and get discovered.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-display text-sm text-foreground tracking-wide">Platform</h4>
              <div className="space-y-2">
                <Link href="/pricing" className="block text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-pricing">Pricing</Link>
                <Link href="/scout" className="block text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-scout-hub">Scout Hub</Link>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-display text-sm text-foreground tracking-wide">Get Started</h4>
              <div className="space-y-2">
                <Link href="/login" className="block text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-sign-in">Sign In</Link>
                <Link href="/login" className="block text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-create-account">Create Account</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Caliber. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
