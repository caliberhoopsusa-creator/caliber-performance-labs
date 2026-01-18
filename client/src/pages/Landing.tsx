import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Activity, Trophy, Video, BarChart3, Users, Target, Sparkles, Star, ArrowRight } from "lucide-react";
import caliberLogo from "@assets/Gemini_Generated_Image_3ld7js3ld7js3ld7_(1)_1768700977754.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/70 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={caliberLogo} alt="Caliber Logo" className="h-10 w-10 rounded-xl shadow-lg shadow-primary/30 object-contain" />
            <div>
              <h1 className="text-2xl font-bold font-display text-white tracking-wider uppercase">CALIBER</h1>
            </div>
          </div>
          <Button asChild className="shadow-lg shadow-primary/20" data-testid="button-login">
            <a href="/api/login">Sign In</a>
          </Button>
        </div>
      </nav>

      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 gradient-spotlight pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                  <Sparkles className="w-4 h-4" />
                  AI-Powered Analytics
                </div>
                <h2 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold tracking-tight text-white leading-[1.1]">
                  Every Player<br />
                  <span className="text-gradient-primary text-glow">Deserves Fame</span>
                </h2>
                <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
                  Track your basketball performance, earn badges, and get professional-grade analytics that make you feel like a pro.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild className="text-lg px-8 shadow-xl shadow-primary/30 pulse-glow" data-testid="button-get-started">
                  <a href="/api/login" className="flex items-center gap-2">
                    Get Started Free
                    <ArrowRight className="w-5 h-5" />
                  </a>
                </Button>
              </div>
              
              <div className="flex items-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
                  Free forever
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
                  No credit card
                </div>
              </div>
            </div>
            
            <div className="relative lg:pl-8">
              <div className="float">
                <div className="relative aspect-square rounded-3xl bg-gradient-to-br from-card via-card/80 to-card/50 border border-white/10 shadow-2xl shadow-black/50 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5" />
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  
                  <div className="text-center space-y-8 p-8 relative z-10">
                    <div className="mx-auto w-28 h-28 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/20">
                      <Trophy className="w-14 h-14 text-primary" />
                    </div>
                    <div>
                      <div className="text-7xl font-bold text-white font-display text-glow">A+</div>
                      <div className="text-muted-foreground mt-3 text-lg">Your potential grade awaits</div>
                    </div>
                    
                    <div className="flex justify-center gap-1">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className="w-5 h-5 text-primary fill-primary" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-2xl glass-card-glow flex items-center justify-center shadow-xl">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary font-display">50+</div>
                  <div className="text-xs text-muted-foreground">Badges</div>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 w-28 h-28 rounded-2xl glass-card-glow flex items-center justify-center shadow-xl">
                <div className="text-center">
                  <Video className="w-8 h-8 text-primary mx-auto mb-1" />
                  <div className="text-xs text-muted-foreground">AI Analysis</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider-glow mx-auto max-w-4xl" />

      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 gradient-radial-glow pointer-events-none opacity-50" />
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <h3 className="text-4xl sm:text-5xl font-display font-bold text-white mb-4">
              Everything You Need to <span className="text-primary">Level Up</span>
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional-grade tools designed to help you track, analyze, and improve your game.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="group p-8 glass-card card-shine border-white/5 hover:border-primary/20 transition-all duration-500">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Trophy className="w-7 h-7 text-primary" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Performance Grades</h4>
              <p className="text-muted-foreground leading-relaxed">Get letter grades for every game based on your position and stats. Know exactly where you stand.</p>
            </Card>
            
            <Card className="group p-8 glass-card card-shine border-white/5 hover:border-primary/20 transition-all duration-500">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Video className="w-7 h-7 text-primary" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">AI Video Analysis</h4>
              <p className="text-muted-foreground leading-relaxed">Upload game footage and let AI extract your stats automatically. No more manual tracking.</p>
            </Card>
            
            <Card className="group p-8 glass-card card-shine border-white/5 hover:border-primary/20 transition-all duration-500">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Target className="w-7 h-7 text-primary" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Badges & Streaks</h4>
              <p className="text-muted-foreground leading-relaxed">Earn virtual badges and track your performance streaks. Celebrate every milestone.</p>
            </Card>
            
            <Card className="group p-8 glass-card card-shine border-white/5 hover:border-primary/20 transition-all duration-500">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-7 h-7 text-primary" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Trend Analytics</h4>
              <p className="text-muted-foreground leading-relaxed">Visualize your progress with beautiful charts and insights. See your growth over time.</p>
            </Card>
            
            <Card className="group p-8 glass-card card-shine border-white/5 hover:border-primary/20 transition-all duration-500">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Head-to-Head</h4>
              <p className="text-muted-foreground leading-relaxed">Compare your stats with other players side by side. Know your competition.</p>
            </Card>
            
            <Card className="group p-8 glass-card card-shine border-white/5 hover:border-primary/20 transition-all duration-500">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Activity className="w-7 h-7 text-primary" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Coach Tools</h4>
              <p className="text-muted-foreground leading-relaxed">Professional analysis tools for coaches and recruiters. Manage your entire team.</p>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card rounded-3xl p-12 border-primary/10">
            <h3 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
              Ready to Elevate Your Game?
            </h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Join thousands of players already tracking their performance and leveling up.
            </p>
            <Button size="lg" asChild className="text-lg px-10 shadow-xl shadow-primary/30" data-testid="button-cta-bottom">
              <a href="/api/login" className="flex items-center gap-2">
                Start for Free
                <ArrowRight className="w-5 h-5" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      <footer className="py-10 px-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; 2026 Caliber Performance Labs. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
