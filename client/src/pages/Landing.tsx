import { Button } from "@/components/ui/button";
import { 
  ArrowRight, Search, Trophy, Video, BarChart3, Users, Target, Award
} from "lucide-react";
import { Link } from "wouter";
import caliberLogo from "@assets/Gemini_Generated_Image_3ld7js3ld7js3ld7_(1)_1768700977754.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="currentColor" className="text-white/20" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <line x1="15%" y1="25%" x2="35%" y2="45%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1="35%" y1="45%" x2="50%" y2="50%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1="50%" y1="50%" x2="65%" y2="35%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1="65%" y1="35%" x2="85%" y2="30%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1="50%" y1="50%" x2="20%" y2="70%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1="50%" y1="50%" x2="80%" y2="75%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        </svg>
      </div>

      <div className="absolute top-[20%] left-[12%] hidden lg:flex items-center gap-2 animate-pulse">
        <div className="w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/50" />
        <div className="text-left">
          <div className="text-sm font-medium text-white/90">Players</div>
          <div className="text-xs text-primary">10,245</div>
        </div>
      </div>
      
      <div className="absolute top-[30%] right-[15%] hidden lg:flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-white shadow-lg shadow-white/50" />
        <div className="text-left">
          <div className="text-sm font-medium text-white/90">Coaches</div>
          <div className="text-xs text-white">524</div>
        </div>
      </div>
      
      <div className="absolute top-[65%] left-[8%] hidden lg:flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-blue-400/80 shadow-lg shadow-blue-400/50 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
        </div>
        <div className="text-left">
          <div className="text-sm font-medium text-white/90">Games</div>
          <div className="text-xs text-blue-400">1.2M</div>
        </div>
      </div>
      
      <div className="absolute top-[60%] right-[10%] hidden lg:flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400 shadow-lg shadow-green-400/50" />
        <div className="text-left">
          <div className="text-sm font-medium text-white/90">Badges Earned</div>
          <div className="text-xs text-green-400">847K</div>
        </div>
      </div>
      
      <div className="absolute bottom-[25%] right-[25%] hidden lg:block text-right">
        <div className="text-xs text-muted-foreground/60">Analytics Hub</div>
        <div className="w-8 h-px bg-gradient-to-r from-transparent to-white/20 mt-1 ml-auto" />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={caliberLogo} alt="Caliber Logo" className="h-9 w-9 rounded-xl shadow-lg shadow-primary/30 object-contain" />
            <h1 className="text-xl font-bold font-display text-white tracking-wider uppercase">CALIBER</h1>
          </div>
          <Button asChild className="shadow-lg shadow-primary/20" data-testid="button-login">
            <a href="/api/login">Sign In</a>
          </Button>
        </div>
      </nav>

      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20">
        <div className="text-center max-w-4xl mx-auto space-y-8 relative z-10">
          <a 
            href="/api/login" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/80 hover:bg-white/10 hover:border-white/20 transition-all group"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            AI-Powered Basketball Analytics
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </a>
          
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight text-white leading-[1.1]">
            Pro Features,{" "}
            <span className="text-gradient-primary">For All Players</span>
          </h2>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Track your basketball performance with AI-powered analytics. Earn badges, climb leaderboards, and get discovered by coaches and scouts.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button 
              size="lg" 
              asChild 
              className="min-w-[160px] shadow-xl shadow-primary/20"
              data-testid="button-get-started"
            >
              <a href="/api/login" className="flex items-center gap-2">
                Open App
                <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              asChild 
              className="min-w-[160px] border-white/20 text-white bg-white/5 hover:bg-white/10"
              data-testid="button-discover"
            >
              <Link href="/discover">
                Discover More
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="absolute bottom-8 left-8 hidden md:flex items-center gap-3 text-sm text-muted-foreground/60">
          <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
          <span>Scroll down</span>
        </div>
      </section>

      <section className="py-16 px-4 border-t border-white/5 bg-card/20 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-60">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Trophy className="w-5 h-5" />
              <span className="text-sm font-medium">Performance Grades</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Video className="w-5 h-5" />
              <span className="text-sm font-medium">AI Video Analysis</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Award className="w-5 h-5" />
              <span className="text-sm font-medium">50+ Badges</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <BarChart3 className="w-5 h-5" />
              <span className="text-sm font-medium">Advanced Stats</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium">Coach Tools</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="w-5 h-5" />
              <span className="text-sm font-medium">Get Scouted</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-8 px-4 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <img src={caliberLogo} alt="Caliber Logo" className="h-7 w-7 rounded-lg object-contain opacity-70" />
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
