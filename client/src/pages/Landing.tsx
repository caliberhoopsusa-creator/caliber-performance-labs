import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight, BarChart3, Video, Award, Trophy, Users, Target,
  Shield, Zap, Quote, ChevronRight, Star
} from "lucide-react";
import { Link } from "wouter";
import caliberLogo from "@assets/caliber-logo-orange.png";

const features = [
  { icon: BarChart3, title: "Performance Grades", description: "Instant A-F grades based on position-weighted stats after every game." },
  { icon: Video, title: "AI Video Analysis", description: "Upload game footage and let AI extract your stats automatically." },
  { icon: Award, title: "Skill Badges", description: "Earn 50+ progressive badges like Sharpshooter and Glass Cleaner." },
  { icon: Trophy, title: "Leaderboards", description: "Compete on global and local leaderboards. Track your rank." },
  { icon: Users, title: "Coach Tools", description: "Team management, lineups, practice tracking, and player development." },
  { icon: Target, title: "Get Scouted", description: "Toggle 'Open to Opportunities' and get discovered by coaches." },
];

const stats = [
  { value: "10K+", label: "Active Players" },
  { value: "1.2M", label: "Games Logged" },
  { value: "50+", label: "Skill Badges" },
  { value: "500+", label: "Coaches" },
];

const testimonials = [
  {
    quote: "Caliber changed the way I train. Seeing my grades after every game keeps me locked in.",
    name: "Marcus J.",
    title: "High School Point Guard",
    initials: "MJ",
  },
  {
    quote: "The coach dashboard saves me hours. Game verification and lineup analysis in one place.",
    name: "Coach Rivera",
    title: "AAU Program Director",
    initials: "CR",
  },
  {
    quote: "My recruiting profile on Caliber helped me get noticed by 3 D1 programs.",
    name: "Destiny W.",
    title: "College Prospect",
    initials: "DW",
  },
];

const showcaseTabs = [
  {
    id: "analytics",
    title: "Player Analytics",
    description: "Track every game with AI-powered performance grades, trend lines, and position-specific breakdowns.",
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
  "Basketball", "Football", "Analytics", "AI-Powered", "Badges",
  "Leaderboards", "Recruiting", "Performance", "Scouting", "Training",
  "Video Analysis", "Player Grades",
];

export default function Landing() {
  const [activeTab, setActiveTab] = useState("analytics");

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      <nav className="sticky top-0 z-[100] bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <img src={caliberLogo} alt="Caliber Logo" className="h-10 w-10 rounded-md object-contain" width={40} height={40} />
            <span className="text-xl font-bold font-display text-white tracking-wider uppercase">CALIBER</span>
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
            <Button asChild className="bg-accent text-white border-accent-border" data-testid="button-login">
              <a href="/api/login">Sign In</a>
            </Button>
          </div>
        </div>
      </nav>

      <section className="relative pt-24 pb-16 px-4">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/50 text-sm text-muted-foreground mb-4">
            <Star className="w-4 h-4 text-accent" />
            <span>Trusted by 10,000+ athletes nationwide</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight leading-[0.95]">
            <span className="text-white">YOUR GAME.</span>
            <br />
            <span className="text-accent">MEASURED.</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            AI-powered performance grades, skill badges, leaderboards, and recruiting tools. The platform serious athletes use to level up.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              asChild
              className="min-w-[200px] bg-accent text-white border-accent-border"
              data-testid="button-get-started"
            >
              <a href="/api/login" className="flex items-center gap-2">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </a>
            </Button>
          </div>
        </div>

        <div className="relative max-w-5xl mx-auto mt-16">
          <div
            className="absolute inset-0 -inset-x-12 -inset-y-12 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at 50% 50%, hsl(24 95% 53% / 0.12) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4" data-testid="hero-stat-preview">
            {[
              { grade: "A+", label: "Scoring", color: "text-green-400" },
              { grade: "B+", label: "Defense", color: "text-blue-400" },
              { grade: "A-", label: "Playmaking", color: "text-green-400" },
              { grade: "B", label: "Rebounding", color: "text-accent" },
            ].map((stat) => (
              <div key={stat.label} className="bg-card border border-border rounded-md p-4 md:p-6 text-center space-y-1">
                <span className={`text-3xl md:text-5xl font-display font-bold ${stat.color}`}>{stat.grade}</span>
                <p className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="relative grid grid-cols-3 gap-3 md:gap-4 mt-3 md:mt-4">
            <div className="bg-card border border-border rounded-md p-4 md:p-6 flex items-center gap-3">
              <div className="p-2 rounded-md bg-accent/10">
                <Trophy className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm md:text-base font-semibold text-white">Rank #12</p>
                <p className="text-xs text-muted-foreground">City Leaderboard</p>
              </div>
            </div>
            <div className="bg-card border border-border rounded-md p-4 md:p-6 flex items-center gap-3">
              <div className="p-2 rounded-md bg-accent/10">
                <Award className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm md:text-base font-semibold text-white">8 Badges</p>
                <p className="text-xs text-muted-foreground">Earned This Season</p>
              </div>
            </div>
            <div className="bg-card border border-border rounded-md p-4 md:p-6 flex items-center gap-3">
              <div className="p-2 rounded-md bg-accent/10">
                <Zap className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm md:text-base font-semibold text-white">14 Day</p>
                <p className="text-xs text-muted-foreground">Training Streak</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 border-y border-border overflow-hidden">
        <p className="text-center text-sm text-muted-foreground uppercase tracking-widest mb-8">
          Built for every level of competition
        </p>
        <div className="relative overflow-hidden">
          <div
            className="flex gap-12 whitespace-nowrap"
            style={{
              animation: "marquee 30s linear infinite",
              width: "max-content",
            }}
          >
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span
                key={`${item}-${i}`}
                className="text-lg font-display uppercase tracking-wider text-muted-foreground/50 flex items-center gap-3"
              >
                <Shield className="w-4 h-4 text-accent/40" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-accent text-xs uppercase tracking-widest font-semibold">FEATURES</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mt-4">
              Everything You Need to Dominate
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
              From game grading to recruiting, Caliber gives athletes the tools to track, improve, and get discovered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="hover-elevate group">
                <CardContent className="p-6 space-y-4">
                  <div className="w-10 h-10 rounded-md bg-accent/10 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="font-display text-xl text-white" data-testid={`feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}>
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
            ))}
          </div>
        </div>
      </section>

      <section className="py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-accent text-xs uppercase tracking-widest font-semibold">PRODUCT</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mt-4">
              One Platform. Total Control.
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
                    <h3 className={`font-display text-lg ${activeTab === tab.id ? "text-white" : "text-muted-foreground"}`}>
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

            <div className="relative bg-card border border-border rounded-md p-6 md:p-8" data-testid="showcase-preview">
              {activeTab === "analytics" && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center space-y-2">
                    <BarChart3 className="w-8 h-8 text-accent mx-auto" />
                    <p className="text-2xl md:text-3xl font-display font-bold text-white">A+</p>
                    <p className="text-xs text-muted-foreground">Overall Grade</p>
                  </div>
                  <div className="text-center space-y-2">
                    <Trophy className="w-8 h-8 text-accent mx-auto" />
                    <p className="text-2xl md:text-3xl font-display font-bold text-white">24.5</p>
                    <p className="text-xs text-muted-foreground">PPG Average</p>
                  </div>
                  <div className="text-center space-y-2">
                    <Zap className="w-8 h-8 text-accent mx-auto" />
                    <p className="text-2xl md:text-3xl font-display font-bold text-white">87%</p>
                    <p className="text-xs text-muted-foreground">Consistency</p>
                  </div>
                </div>
              )}
              {activeTab === "social" && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center space-y-2">
                    <Users className="w-8 h-8 text-accent mx-auto" />
                    <p className="text-2xl md:text-3xl font-display font-bold text-white">342</p>
                    <p className="text-xs text-muted-foreground">Connections</p>
                  </div>
                  <div className="text-center space-y-2">
                    <Award className="w-8 h-8 text-accent mx-auto" />
                    <p className="text-2xl md:text-3xl font-display font-bold text-white">15</p>
                    <p className="text-xs text-muted-foreground">Badges Shared</p>
                  </div>
                  <div className="text-center space-y-2">
                    <Star className="w-8 h-8 text-accent mx-auto" />
                    <p className="text-2xl md:text-3xl font-display font-bold text-white">28</p>
                    <p className="text-xs text-muted-foreground">Highlights</p>
                  </div>
                </div>
              )}
              {activeTab === "recruiting" && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center space-y-2">
                    <Target className="w-8 h-8 text-accent mx-auto" />
                    <p className="text-2xl md:text-3xl font-display font-bold text-white">12</p>
                    <p className="text-xs text-muted-foreground">Schools Matched</p>
                  </div>
                  <div className="text-center space-y-2">
                    <Video className="w-8 h-8 text-accent mx-auto" />
                    <p className="text-2xl md:text-3xl font-display font-bold text-white">5</p>
                    <p className="text-xs text-muted-foreground">Film Reels</p>
                  </div>
                  <div className="text-center space-y-2">
                    <Shield className="w-8 h-8 text-accent mx-auto" />
                    <p className="text-2xl md:text-3xl font-display font-bold text-white">3</p>
                    <p className="text-xs text-muted-foreground">Coach Endorsements</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-accent text-xs uppercase tracking-widest font-semibold">BY THE NUMBERS</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mt-4">
              The Numbers Don't Lie
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center space-y-2">
                <div className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-accent" data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-accent text-xs uppercase tracking-widest font-semibold">TESTIMONIALS</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mt-4">
              Hear From Our Athletes
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={testimonial.name} className="hover-elevate">
                <CardContent className="p-6 space-y-4">
                  <Quote className="w-8 h-8 text-accent/30" />
                  <p className="text-foreground/90 leading-relaxed italic" data-testid={`testimonial-quote-${index}`}>
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-display text-sm font-bold">
                      {testimonial.initials}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white" data-testid={`testimonial-name-${index}`}>{testimonial.name}</div>
                      <div className="text-xs text-muted-foreground">{testimonial.title}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                  <h3 className="font-display text-lg text-white" data-testid={`highlight-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
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
            background: "radial-gradient(ellipse at 50% 50%, hsl(24 95% 53% / 0.06) 0%, transparent 60%)",
          }}
        />
        <div className="relative max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-6xl font-display font-bold text-white">
            Ready to Find Your Caliber?
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Join thousands of players, coaches, and scouts already on the platform. Start tracking your game today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              asChild
              className="min-w-[200px] bg-accent text-white border-accent-border"
              data-testid="button-cta-start"
            >
              <a href="/api/login" className="flex items-center gap-2">
                Start Free Today
                <ArrowRight className="w-5 h-5" />
              </a>
            </Button>
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
                <img src={caliberLogo} alt="Caliber Logo" className="h-10 w-10 rounded-md object-contain" width={40} height={40} />
                <span className="text-xl font-bold font-display text-white tracking-wider uppercase">CALIBER</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                The performance platform for serious athletes. Track your game, earn your rank, and get discovered.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-display text-sm text-white uppercase tracking-wider">Platform</h4>
              <div className="space-y-2">
                <Link href="/pricing" className="block text-sm text-muted-foreground transition-colors" data-testid="footer-link-pricing">
                  Pricing
                </Link>
                <Link href="/scout" className="block text-sm text-muted-foreground transition-colors" data-testid="footer-link-scout-hub">
                  Scout Hub
                </Link>
                <a href="/api/login" className="block text-sm text-muted-foreground transition-colors" data-testid="footer-link-sign-in">
                  Sign In
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-display text-sm text-white uppercase tracking-wider">Features</h4>
              <div className="space-y-2">
                <span className="block text-sm text-muted-foreground">Performance Grades</span>
                <span className="block text-sm text-muted-foreground">Skill Badges</span>
                <span className="block text-sm text-muted-foreground">Leaderboards</span>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <span>&copy; 2026 Caliber Performance Labs. All rights reserved.</span>
            <div className="flex items-center gap-6 flex-wrap">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
