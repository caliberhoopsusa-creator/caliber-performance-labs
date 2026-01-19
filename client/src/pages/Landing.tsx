import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, Trophy, Video, BarChart3, Users, Target, Sparkles, Star, ArrowRight, 
  Search, Zap, TrendingUp, Award, ClipboardList, PlayCircle, Shield, ChevronRight,
  Flame, Crown, Medal
} from "lucide-react";
import { Link } from "wouter";
import caliberLogo from "@assets/Gemini_Generated_Image_3ld7js3ld7js3ld7_(1)_1768700977754.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={caliberLogo} alt="Caliber Logo" className="h-10 w-10 rounded-xl shadow-lg shadow-primary/30 object-contain" />
            <h1 className="text-2xl font-bold font-display text-white tracking-wider uppercase">CALIBER</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="hidden sm:inline-flex text-white/70 hover:text-white">
              <Link href="/discover">Find Players</Link>
            </Button>
            <Button asChild className="shadow-lg shadow-primary/20" data-testid="button-login">
              <a href="/api/login">Sign In</a>
            </Button>
          </div>
        </div>
      </nav>

      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 gradient-spotlight pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-10 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  <Badge variant="outline" className="px-4 py-2 bg-primary/10 border-primary/30 text-primary">
                    <Sparkles className="w-3.5 h-3.5 mr-2" />
                    AI-Powered
                  </Badge>
                  <Badge variant="outline" className="px-4 py-2 bg-orange-500/10 border-orange-500/30 text-orange-400">
                    <Flame className="w-3.5 h-3.5 mr-2" />
                    #1 Basketball Analytics
                  </Badge>
                </div>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-display font-bold tracking-tight text-white leading-[1.1]">
                  Pro Features,<br />
                  <span className="text-gradient-primary text-glow">For All Players</span>
                </h2>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
                  The ultimate platform for basketball players and coaches. Track stats, earn badges, get AI-powered analysis, and take your game to the next level.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild className="text-lg px-8 shadow-xl shadow-primary/30 pulse-glow group" data-testid="button-get-started">
                  <a href="/api/login" className="flex items-center gap-2">
                    Start Dominating
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-lg px-8 border-white/20 text-white group" data-testid="button-discover-players">
                  <Link href="/discover" className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Scout Players
                  </Link>
                </Button>
              </div>
              
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50 animate-pulse"></div>
                  Free forever
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
                  No credit card
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
                  Setup in 60 seconds
                </div>
              </div>
            </div>
            
            <div className="relative lg:pl-8">
              <div className="relative">
                <div className="relative rounded-3xl bg-gradient-to-br from-card via-card/90 to-card/70 border border-white/10 shadow-2xl shadow-black/50 overflow-hidden p-6 sm:p-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-orange-500/5" />
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                          JW
                        </div>
                        <div>
                          <div className="font-bold text-white">Jordan Williams</div>
                          <div className="text-sm text-muted-foreground">Point Guard • Varsity</div>
                        </div>
                      </div>
                      <Badge className="bg-gradient-to-r from-primary to-orange-500 text-white border-0">
                        <Crown className="w-3 h-3 mr-1" />
                        Elite
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-3xl sm:text-4xl font-bold text-white font-display">A+</div>
                        <div className="text-xs text-muted-foreground mt-1">Overall Grade</div>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-3xl sm:text-4xl font-bold text-primary font-display">23.5</div>
                        <div className="text-xs text-muted-foreground mt-1">PPG</div>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-3xl sm:text-4xl font-bold text-orange-400 font-display">8.2</div>
                        <div className="text-xs text-muted-foreground mt-1">APG</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="bg-yellow-500/10 border-yellow-500/30 text-yellow-400 text-xs">
                        <Flame className="w-3 h-3 mr-1" />
                        12 Game Streak
                      </Badge>
                      <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-400 text-xs">
                        <Medal className="w-3 h-3 mr-1" />
                        Sharpshooter III
                      </Badge>
                      <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-400 text-xs">
                        <Trophy className="w-3 h-3 mr-1" />
                        MVP
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <div className="flex -space-x-2">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-white/20 to-white/5 border-2 border-background flex items-center justify-center text-xs font-medium text-white/70">
                            {String.fromCharCode(64 + i)}
                          </div>
                        ))}
                        <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-medium text-primary">
                          +47
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">followers</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl glass-card-glow flex items-center justify-center shadow-xl float">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-primary font-display">50+</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">Badges</div>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl glass-card-glow flex items-center justify-center shadow-xl float" style={{ animationDelay: "0.5s" }}>
                <div className="text-center">
                  <Video className="w-6 h-6 sm:w-8 sm:h-8 text-primary mx-auto mb-1" />
                  <div className="text-[10px] sm:text-xs text-muted-foreground">AI Analysis</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 border-y border-white/5 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-white font-display">10K+</div>
              <div className="text-sm text-muted-foreground mt-1">Active Players</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-white font-display">500+</div>
              <div className="text-sm text-muted-foreground mt-1">Coaches</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-white font-display">1M+</div>
              <div className="text-sm text-muted-foreground mt-1">Games Analyzed</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-white font-display">4.9</div>
              <div className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                Rating
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28 px-4 relative">
        <div className="absolute inset-0 gradient-radial-glow pointer-events-none opacity-30" />
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 px-4 py-2 bg-primary/10 border-primary/30 text-primary">
              <Zap className="w-3.5 h-3.5 mr-2" />
              For Players
            </Badge>
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4">
              Track Your <span className="text-primary">Rise to Greatness</span>
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every shot, every assist, every win. Build your legacy with professional-grade analytics.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="group p-6 sm:p-8 glass-card card-shine border-white/5 hover:border-primary/30 transition-all duration-500">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Trophy className="w-7 h-7 text-primary" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Performance Grades</h4>
              <p className="text-muted-foreground leading-relaxed">Get A-F grades for every game based on your position. Compare yourself to the best.</p>
            </Card>
            
            <Card className="group p-6 sm:p-8 glass-card card-shine border-white/5 hover:border-primary/30 transition-all duration-500">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Video className="w-7 h-7 text-orange-400" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">AI Video Analysis</h4>
              <p className="text-muted-foreground leading-relaxed">Upload game film and let AI extract your stats instantly. No manual entry needed.</p>
            </Card>
            
            <Card className="group p-6 sm:p-8 glass-card card-shine border-white/5 hover:border-primary/30 transition-all duration-500">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border border-yellow-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Award className="w-7 h-7 text-yellow-400" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Badges & Achievements</h4>
              <p className="text-muted-foreground leading-relaxed">Earn 50+ badges from Sharpshooter to Triple-Double King. Show off your skills.</p>
            </Card>
            
            <Card className="group p-6 sm:p-8 glass-card card-shine border-white/5 hover:border-primary/30 transition-all duration-500">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-7 h-7 text-blue-400" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Progress Tracking</h4>
              <p className="text-muted-foreground leading-relaxed">Beautiful charts showing your improvement over time. Watch yourself level up.</p>
            </Card>
            
            <Card className="group p-6 sm:p-8 glass-card card-shine border-white/5 hover:border-primary/30 transition-all duration-500">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-7 h-7 text-purple-400" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Social & Leaderboards</h4>
              <p className="text-muted-foreground leading-relaxed">Compete with friends, climb leaderboards, share highlights. Build your following.</p>
            </Card>
            
            <Card className="group p-6 sm:p-8 glass-card card-shine border-white/5 hover:border-primary/30 transition-all duration-500">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Target className="w-7 h-7 text-green-400" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Get Discovered</h4>
              <p className="text-muted-foreground leading-relaxed">Public profile for scouts and coaches. Show them what you're made of.</p>
            </Card>
          </div>
        </div>
      </section>

      <div className="divider-glow mx-auto max-w-4xl" />

      <section className="py-20 sm:py-28 px-4 relative">
        <div className="absolute inset-0 gradient-radial-glow pointer-events-none opacity-30" />
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 px-4 py-2 bg-orange-500/10 border-orange-500/30 text-orange-400">
              <ClipboardList className="w-3.5 h-3.5 mr-2" />
              For Coaches
            </Badge>
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4">
              Build a <span className="text-orange-400">Championship Team</span>
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional tools to manage your roster, analyze performance, and develop winning strategies.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="group p-6 sm:p-8 glass-card card-shine border-white/5 hover:border-orange-500/30 transition-all duration-500">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-7 h-7 text-orange-400" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Team Dashboard</h4>
              <p className="text-muted-foreground leading-relaxed">Full roster management with player grades, stats, and performance trends at a glance.</p>
            </Card>
            
            <Card className="group p-6 sm:p-8 glass-card card-shine border-white/5 hover:border-orange-500/30 transition-all duration-500">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-7 h-7 text-primary" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Lineup Analysis</h4>
              <p className="text-muted-foreground leading-relaxed">Build and compare lineups. See which combinations work best for your team.</p>
            </Card>
            
            <Card className="group p-6 sm:p-8 glass-card card-shine border-white/5 hover:border-orange-500/30 transition-all duration-500">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500/20 to-red-500/5 border border-red-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-7 h-7 text-red-400" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Opponent Scouting</h4>
              <p className="text-muted-foreground leading-relaxed">Scout opponents, track their tendencies, and prepare game plans to dominate.</p>
            </Card>
            
            <Card className="group p-6 sm:p-8 glass-card card-shine border-white/5 hover:border-orange-500/30 transition-all duration-500">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <ClipboardList className="w-7 h-7 text-green-400" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Practice Tracker</h4>
              <p className="text-muted-foreground leading-relaxed">Log sessions, track attendance, and monitor player development over time.</p>
            </Card>
            
            <Card className="group p-6 sm:p-8 glass-card card-shine border-white/5 hover:border-orange-500/30 transition-all duration-500">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <PlayCircle className="w-7 h-7 text-purple-400" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Shot Charts</h4>
              <p className="text-muted-foreground leading-relaxed">Visual shot tracking for every player. Identify hot zones and areas to improve.</p>
            </Card>
            
            <Card className="group p-6 sm:p-8 glass-card card-shine border-white/5 hover:border-orange-500/30 transition-all duration-500">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Activity className="w-7 h-7 text-blue-400" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Report Cards</h4>
              <p className="text-muted-foreground leading-relaxed">Generate detailed player reports with grades, feedback, and improvement areas.</p>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative glass-card rounded-3xl p-8 sm:p-12 border-primary/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-orange-500/10" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            
            <div className="relative z-10">
              <div className="flex justify-center mb-6">
                <div className="flex -space-x-3">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary/30 to-orange-500/30 border-2 border-background flex items-center justify-center text-sm font-medium text-white">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
              </div>
              
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white mb-4">
                Ready to Elevate Your Game?
              </h3>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                Join thousands of players and coaches already using Caliber to dominate the competition.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="text-lg px-10 shadow-xl shadow-primary/30 group" data-testid="button-cta-bottom">
                  <a href="/api/login" className="flex items-center gap-2">
                    Get Started Free
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-lg px-8 border-white/20 text-white">
                  <Link href="/discover">
                    Explore Players
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-10 px-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <img src={caliberLogo} alt="Caliber Logo" className="h-8 w-8 rounded-lg object-contain" />
            <span>&copy; 2026 Caliber Performance Labs</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/discover" className="hover:text-white transition-colors">Find Players</Link>
            <a href="/api/login" className="hover:text-white transition-colors">Sign In</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
