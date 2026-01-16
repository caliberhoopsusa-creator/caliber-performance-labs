import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Activity, Trophy, Video, BarChart3, Users, Target } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display text-white tracking-wider uppercase">CALIBER</h1>
            </div>
          </div>
          <Button asChild data-testid="button-login">
            <a href="/api/login">Sign In</a>
          </Button>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold tracking-tight text-white leading-tight">
                  Every Player<br />
                  <span className="text-primary">Deserves Fame</span>
                </h2>
                <p className="text-xl text-muted-foreground max-w-xl">
                  Track your basketball performance, earn badges, and get professional-grade analytics that make you feel like a pro.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild className="text-lg px-8" data-testid="button-get-started">
                  <a href="/api/login">Get Started Free</a>
                </Button>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Free forever
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  No credit card required
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 flex items-center justify-center">
                <div className="text-center space-y-6 p-8">
                  <div className="mx-auto w-24 h-24 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <Trophy className="w-12 h-12 text-primary" />
                  </div>
                  <div>
                    <div className="text-6xl font-bold text-white font-display">A+</div>
                    <div className="text-muted-foreground mt-2">Your potential grade awaits</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl font-display font-bold text-white text-center mb-12">
            Everything You Need to Level Up
          </h3>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6 bg-background/50 border-border/50 hover-elevate">
              <Trophy className="w-10 h-10 text-primary mb-4" />
              <h4 className="text-xl font-bold text-white mb-2">Performance Grades</h4>
              <p className="text-muted-foreground">Get letter grades for every game based on your position and stats.</p>
            </Card>
            
            <Card className="p-6 bg-background/50 border-border/50 hover-elevate">
              <Video className="w-10 h-10 text-primary mb-4" />
              <h4 className="text-xl font-bold text-white mb-2">AI Video Analysis</h4>
              <p className="text-muted-foreground">Upload game footage and let AI extract your stats automatically.</p>
            </Card>
            
            <Card className="p-6 bg-background/50 border-border/50 hover-elevate">
              <Target className="w-10 h-10 text-primary mb-4" />
              <h4 className="text-xl font-bold text-white mb-2">Badges & Streaks</h4>
              <p className="text-muted-foreground">Earn virtual badges and track your performance streaks.</p>
            </Card>
            
            <Card className="p-6 bg-background/50 border-border/50 hover-elevate">
              <BarChart3 className="w-10 h-10 text-primary mb-4" />
              <h4 className="text-xl font-bold text-white mb-2">Trend Analytics</h4>
              <p className="text-muted-foreground">Visualize your progress with beautiful charts and insights.</p>
            </Card>
            
            <Card className="p-6 bg-background/50 border-border/50 hover-elevate">
              <Users className="w-10 h-10 text-primary mb-4" />
              <h4 className="text-xl font-bold text-white mb-2">Head-to-Head</h4>
              <p className="text-muted-foreground">Compare your stats with other players side by side.</p>
            </Card>
            
            <Card className="p-6 bg-background/50 border-border/50 hover-elevate">
              <Activity className="w-10 h-10 text-primary mb-4" />
              <h4 className="text-xl font-bold text-white mb-2">Coach Tools</h4>
              <p className="text-muted-foreground">Professional analysis tools for coaches and recruiters.</p>
            </Card>
          </div>
        </div>
      </section>

      <footer className="py-8 px-4 border-t border-border/50">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; 2026 Caliber Performance Labs. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
