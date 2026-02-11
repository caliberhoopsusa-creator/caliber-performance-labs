import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight, Zap, Trophy, Video, BarChart3, Users, Target, Award, Shield
} from "lucide-react";
import { Link } from "wouter";
import caliberLogo from "@assets/caliber-logo-orange.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <img src={caliberLogo} alt="Caliber Logo" className="h-10 w-10 rounded-md object-contain" width={40} height={40} />
            <h1 className="text-xl font-bold font-display text-white tracking-wider uppercase">CALIBER</h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/pricing">
              <Button variant="ghost" className="hidden sm:flex" data-testid="button-pricing">
                Pricing
              </Button>
            </Link>
            <Button asChild className="bg-accent text-white border-accent-border" data-testid="button-login">
              <a href="/api/login">Sign In</a>
            </Button>
          </div>
        </div>
      </nav>

      <section className="relative min-h-[85vh] flex flex-col items-center justify-center px-4 pt-24 pb-16">
        <div className="text-center max-w-5xl mx-auto space-y-8">
          <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight leading-[0.95]">
            <span className="text-white">YOUR GAME.</span>
            <br />
            <span className="text-accent">MEASURED.</span>
          </h2>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Track performance. Earn your rank. Get discovered.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Button
              size="lg"
              asChild
              className="min-w-[180px] bg-accent text-white border-accent-border"
              data-testid="button-get-started"
            >
              <a href="/api/login" className="flex items-center gap-2">
                Start Free
                <ArrowRight className="w-5 h-5" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="min-w-[180px]"
              data-testid="button-discover"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              See Features
            </Button>
          </div>

          <div className="pt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2" data-testid="trust-free">
              <Shield className="w-4 h-4 text-accent" />
              <span>Free Forever</span>
            </div>
            <div className="flex items-center gap-2" data-testid="trust-multisport">
              <Trophy className="w-4 h-4 text-accent" />
              <span>Multi-Sport</span>
            </div>
            <div className="flex items-center gap-2" data-testid="trust-ai">
              <Zap className="w-4 h-4 text-accent" />
              <span>AI-Powered</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "10K+", label: "Active Players", icon: Users },
              { value: "1.2M", label: "Games Logged", icon: BarChart3 },
              { value: "50+", label: "Skill Badges", icon: Award },
              { value: "500+", label: "Coaches", icon: Trophy },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-6 text-center">
                  <stat.icon className="w-6 h-6 text-accent mx-auto mb-3" />
                  <div className="text-3xl md:text-4xl font-display font-bold text-white mb-1" data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-accent text-xs uppercase tracking-widest font-semibold">FEATURES</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mt-4">
              Everything You Need
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: BarChart3, title: "Performance Grades", description: "Instant A-F grades based on position-weighted stats after every game." },
              { icon: Video, title: "AI Video Analysis", description: "Upload game footage and let AI extract your stats automatically." },
              { icon: Award, title: "Skill Badges", description: "Earn 50+ progressive badges like Sharpshooter and Glass Cleaner." },
              { icon: Trophy, title: "Leaderboards", description: "Compete on global and local leaderboards. Track your rank." },
              { icon: Users, title: "Coach Tools", description: "Team management, lineups, practice tracking, and player development." },
              { icon: Target, title: "Get Scouted", description: "Toggle 'Open to Opportunities' and get discovered by coaches." },
            ].map((feature) => (
              <Card key={feature.title} className="hover-elevate">
                <CardContent className="p-6 space-y-4">
                  <div className="w-10 h-10 rounded-md bg-accent/10 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="font-display text-lg text-white" data-testid={`feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-12 md:p-16 text-center space-y-6">
              <h2 className="text-4xl md:text-5xl font-display font-bold text-white">
                Ready to Level Up?
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Join thousands of players already tracking their performance and climbing the ranks.
              </p>
              <Button
                size="lg"
                asChild
                className="bg-accent text-white border-accent-border"
                data-testid="button-cta-start"
              >
                <a href="/api/login" className="flex items-center gap-2">
                  Start Free Today
                  <ArrowRight className="w-5 h-5" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-3 flex-wrap">
            <img src={caliberLogo} alt="Caliber Logo" className="h-8 w-8 rounded-md object-contain opacity-70" width={32} height={32} />
            <span>&copy; 2026 Caliber Performance Labs</span>
          </div>
          <div className="flex items-center gap-8 flex-wrap">
            <Link href="/scout" className="hover:text-accent transition-colors" data-testid="link-scout-hub">Scout Hub</Link>
            <Link href="/pricing" className="hover:text-accent transition-colors" data-testid="link-pricing">Pricing</Link>
            <a href="/api/login" className="hover:text-accent transition-colors" data-testid="link-sign-in">Sign In</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
