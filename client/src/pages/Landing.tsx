import { Button } from "@/components/ui/button";
import { 
  ArrowRight, Zap, Trophy, Video, BarChart3, Users, Target, Award, Star, TrendingUp, Shield
} from "lucide-react";
import { Link } from "wouter";
import caliberLogo from "@assets/Gemini_Generated_Image_3ld7js3ld7js3ld7_(1)_1768700977754.png";

// Animated floating particles component
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-cyan-400/30 rounded-full animate-float-particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${8 + Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  );
}

// Animated stat counter component
function AnimatedStat({ value, label, icon: Icon, color }: { value: string; label: string; icon: React.ElementType; color: string }) {
  return (
    <div className="relative group">
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 rounded-2xl blur-xl transition-opacity duration-500`} />
      <div className="relative bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 text-center hover:border-cyan-500/20 transition-all duration-300">
        <div className={`w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="text-3xl md:text-4xl font-display font-bold text-white mb-1 tracking-tight">{value}</div>
        <div className="text-sm text-muted-foreground uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}

// Feature card component
function FeatureCard({ icon: Icon, title, description, gradient }: { icon: React.ElementType; title: string; description: string; gradient: string }) {
  return (
    <div className="group relative">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 rounded-2xl blur-2xl transition-opacity duration-500`} />
      <div className="relative h-full bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 hover:border-cyan-500/20 transition-all duration-300 overflow-hidden">
        {/* Scan line effect */}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,212,255,0.02)_50%)] bg-[length:100%_4px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/10 group-hover:shadow-cyan-500/20 transition-shadow`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-xl font-display font-semibold text-white mb-2 tracking-wide">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Premium animated background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,212,255,0.15),transparent)]" />
        
        {/* Animated orbs */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        
        {/* Cyber grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,212,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_70%,transparent_110%)]" />
        
        {/* Floating particles */}
        <FloatingParticles />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-background/60 border-b border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/30 rounded-xl blur-lg" />
              <img src={caliberLogo} alt="Caliber Logo" className="relative h-10 w-10 rounded-xl shadow-lg object-contain" />
            </div>
            <h1 className="text-xl font-bold font-display text-white tracking-wider uppercase">CALIBER</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/pricing">
              <Button variant="ghost" className="text-white/70 hover:text-white hidden sm:flex" data-testid="button-pricing">
                Pricing
              </Button>
            </Link>
            <Button asChild className="shadow-lg shadow-cyan-500/20 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 border-0" data-testid="button-login">
              <a href="/api/login">Sign In</a>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-12">
        <div className="text-center max-w-5xl mx-auto space-y-8 relative z-10">
          {/* Badge */}
          <a 
            href="/api/login" 
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 text-sm text-white/90 hover:border-cyan-400/40 transition-all group backdrop-blur-xl"
          >
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>AI-Powered Basketball Analytics</span>
            <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
          </a>
          
          {/* Main headline */}
          <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight leading-[0.95]">
            <span className="text-white">Unlock Your</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">
              Full Potential
            </span>
          </h2>
          
          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Track your basketball performance with AI-powered analytics. Earn badges, climb leaderboards, and get discovered by coaches and scouts worldwide.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Button 
              size="lg" 
              asChild 
              className="min-w-[180px] h-14 text-base shadow-xl shadow-cyan-500/25 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 border-0"
              data-testid="button-get-started"
            >
              <a href="/api/login" className="flex items-center gap-2">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </a>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="min-w-[180px] h-14 text-base border-white/20 text-white bg-white/5 hover:bg-white/10 backdrop-blur-xl"
              data-testid="button-discover"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              See Features
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="pt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Free to Start</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-cyan-400" />
              <span>5,000+ Players</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>AI-Powered</span>
            </div>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground/60 animate-bounce">
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 px-4 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <AnimatedStat value="10K+" label="Active Players" icon={Users} color="from-cyan-500 to-blue-600" />
            <AnimatedStat value="1.2M" label="Games Logged" icon={BarChart3} color="from-blue-500 to-purple-600" />
            <AnimatedStat value="50+" label="Skill Badges" icon={Award} color="from-amber-500 to-orange-600" />
            <AnimatedStat value="500+" label="Coaches" icon={Trophy} color="from-emerald-500 to-teal-600" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-widest mb-4">Features</h3>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Everything You Need to
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"> Dominate</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Professional-grade analytics tools designed for players, coaches, and scouts at every level.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={BarChart3}
              title="Performance Grades"
              description="Get instant A-F grades based on position-weighted stats and efficiency metrics after every game."
              gradient="from-cyan-500 to-blue-600"
            />
            <FeatureCard 
              icon={Video}
              title="AI Video Analysis"
              description="Upload game footage and let our AI automatically extract and calculate your stats."
              gradient="from-blue-500 to-purple-600"
            />
            <FeatureCard 
              icon={Award}
              title="Skill Badges"
              description="Earn 50+ badges like Sharpshooter, Pure Passer, and Glass Cleaner with progressive ranks."
              gradient="from-amber-500 to-orange-600"
            />
            <FeatureCard 
              icon={Trophy}
              title="Leaderboards"
              description="Compete on global and local leaderboards. Track your rank and climb to the top."
              gradient="from-emerald-500 to-teal-600"
            />
            <FeatureCard 
              icon={Users}
              title="Coach Dashboard"
              description="Full team management with lineups, practice tracking, and player development tools."
              gradient="from-pink-500 to-rose-600"
            />
            <FeatureCard 
              icon={Target}
              title="Get Scouted"
              description="Toggle 'Open to Opportunities' and let coaches and scouts discover your talent."
              gradient="from-indigo-500 to-violet-600"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-3xl p-12 md:p-16 overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,212,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
                Ready to Level Up?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                Join thousands of players already tracking their performance and climbing the ranks.
              </p>
              <Button 
                size="lg" 
                asChild 
                className="h-14 px-8 text-base shadow-xl shadow-cyan-500/25 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 border-0"
              >
                <a href="/api/login" className="flex items-center gap-2">
                  Start Free Today
                  <ArrowRight className="w-5 h-5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-4 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <img src={caliberLogo} alt="Caliber Logo" className="h-8 w-8 rounded-lg object-contain opacity-70" />
            <span>&copy; 2026 Caliber Performance Labs</span>
          </div>
          <div className="flex items-center gap-8">
            <Link href="/discover" className="hover:text-cyan-400 transition-colors">Find Players</Link>
            <Link href="/pricing" className="hover:text-cyan-400 transition-colors">Pricing</Link>
            <a href="/api/login" className="hover:text-cyan-400 transition-colors">Sign In</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
