import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, PlusCircle, Activity, Trophy, Calculator, Video, Binoculars, Target, MessageSquare, BarChart3, Rss, Camera, ClipboardList, UsersRound, CalendarCheck, Eye, Bell, UserCircle, LogOut, CreditCard, Lock, Dumbbell, CalendarDays, Film, FileText, ArrowLeftRight, UserPlus } from "lucide-react";
import caliberLogo from "@assets/Gemini_Generated_Image_3ld7js3ld7js3ld7_(1)_1768700977754.png";
import { cn } from "@/lib/utils";
import { AlertsBadge } from "@/components/AlertsCenter";
import { Button } from "@/components/ui/button";
import { useSubscription, type SubscriptionTier } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

type NavSection = {
  title: string;
  items: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    featured?: boolean;
    premium?: SubscriptionTier;
  }[];
};

type SidebarProps = {
  userRole: string;
  playerId?: number | null;
};

export function Sidebar({ userRole, playerId }: SidebarProps) {
  const [location] = useLocation();
  const { hasAccess, isPro } = useSubscription();
  const { switchRole, isSwitchingRole } = useAuth();
  const { toast } = useToast();

  // For players: show their profile and limited options
  // For coaches: show full navigation with all coach tools
  const isPlayer = userRole === 'player';
  const isCoach = userRole === 'coach';

  const handleRoleSwitch = () => {
    const newRole = isPlayer ? 'coach' : 'player';
    switchRole(newRole, {
      onSuccess: () => {
        toast({ 
          title: `Switched to ${newRole === 'coach' ? 'Coach' : 'Player'} Mode`,
          description: `You're now viewing the app as a ${newRole}.`
        });
      },
      onError: (error: Error) => {
        toast({ 
          title: 'Error', 
          description: error.message || 'Failed to switch mode',
          variant: 'destructive'
        });
      }
    });
  };

  const playerSections: NavSection[] = [
    {
      title: "My Game",
      items: [
        { href: playerId ? `/players/${playerId}` : "/", label: "My Stats", icon: UserCircle },
        { href: "/analyze", label: "Log Game", icon: PlusCircle },
        { href: "/schedule", label: "Schedule", icon: CalendarDays },
        { href: "/workouts", label: "Workouts", icon: Dumbbell },
      ],
    },
    {
      title: "Explore",
      items: [
        { href: "/discover", label: "Find Players", icon: Binoculars },
        { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
        { href: "/stories", label: "Stories", icon: Camera },
        { href: "/social-hub", label: "Social Hub", icon: UsersRound },
        { href: "/teams", label: "Teams", icon: Users },
      ],
    },
    {
      title: "Account",
      items: [
        { href: "/pricing", label: "Pricing", icon: CreditCard },
      ],
    },
  ];

  const coachSections: NavSection[] = [
    {
      title: "Main",
      items: [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/players", label: "Players", icon: Users },
        { href: "/analyze", label: "Log Game", icon: PlusCircle },
        { href: "/schedule", label: "Schedule", icon: CalendarDays },
      ],
    },
    {
      title: "Explore",
      items: [
        { href: "/discover", label: "Find Players", icon: Binoculars },
        { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
        { href: "/stories", label: "Stories", icon: Camera },
        { href: "/social-hub", label: "Social Hub", icon: UsersRound },
        { href: "/teams", label: "Teams", icon: MessageSquare },
      ],
    },
    {
      title: "Coach Tools",
      items: [
        { href: "/coach/hub", label: "Team Hub", icon: ClipboardList, premium: "coach_pro" },
        { href: "/coach/practices", label: "Practices", icon: CalendarCheck, premium: "coach_pro" },
        { href: "/coach/lineups", label: "Lineups", icon: UsersRound, premium: "coach_pro" },
        { href: "/coach/scouting", label: "Scouting", icon: Eye, premium: "coach_pro" },
        { href: "/coach/alerts", label: "Alerts", icon: Bell, premium: "coach_pro" },
        { href: "/report-card", label: "Report Cards", icon: FileText },
        { href: "/video", label: "Video Analysis", icon: Video, premium: "pro" },
        { href: "/team-comparison", label: "Team Compare", icon: BarChart3, premium: "coach_pro" },
      ],
    },
    {
      title: "Account",
      items: [
        { href: "/pricing", label: "Pricing", icon: CreditCard },
      ],
    },
  ];

  const navSections = isPlayer ? playerSections : coachSections;

  return (
    <div className="hidden md:flex flex-col w-64 bg-gradient-to-b from-[hsl(220,25%,8%)] via-[hsl(220,20%,6%)] to-[hsl(220,25%,4%)] border-r border-cyan-500/[0.08] h-screen sticky top-0 overflow-y-auto backdrop-blur-2xl">
      <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" />
      <div className="p-5 flex items-center gap-3 border-b border-cyan-500/[0.08] bg-gradient-to-r from-cyan-500/[0.02] to-transparent relative z-10">
        <img src={caliberLogo} alt="Caliber Logo" className="h-9 w-9 rounded-lg shadow-lg shadow-black/20 object-contain" />
        <div className="flex-1">
          <h1 className="text-xl font-bold font-display text-white tracking-wider uppercase">CALIBER</h1>
          <button 
            onClick={handleRoleSwitch}
            disabled={isSwitchingRole}
            className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-widest font-medium transition-colors cursor-pointer"
            data-testid="button-switch-role"
          >
            {isPlayer ? "Player" : "Coach"} Mode
            <ArrowLeftRight className="w-3 h-3" />
          </button>
        </div>
        {isCoach && (
          <Link href="/coach/alerts" className="text-muted-foreground transition-colors" data-testid="header-alerts-badge">
            <AlertsBadge />
          </Link>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-5">
        {navSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest mb-1.5 px-3">{section.title}</h3>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = location === item.href || (item.href.includes('/players/') && location.includes('/players/') && location === item.href);
                const needsUpgrade = item.premium && !hasAccess(item.premium);
                const isCoachPro = item.premium === "coach_pro";
                const isFeatured = item.featured && !isActive;
                return (
                  <Link key={item.href} href={item.href} className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 group font-medium text-sm relative overflow-hidden",
                    isActive 
                      ? "bg-gradient-to-r from-cyan-500/[0.12] to-transparent text-white border-l-2 border-cyan-400 shadow-[0_0_20px_rgba(100,200,255,0.1)_inset]" 
                      : isFeatured
                      ? "text-cyan-400 bg-cyan-500/5"
                      : needsUpgrade
                      ? "text-muted-foreground/50 hover:text-muted-foreground hover:bg-white/[0.02]"
                      : "text-muted-foreground hover:text-cyan-300 hover:bg-cyan-500/[0.05] hover:border-l-2 hover:border-cyan-500/30"
                  )} data-testid={`nav-${item.href.replace(/\//g, '-').replace(/^-/, '') || 'home'}`}>
                    <item.icon className={cn("w-4 h-4", isActive && "text-primary")} />
                    {item.label}
                    {isFeatured && (
                      <span className="ml-auto text-[9px] bg-primary text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                        LIVE
                      </span>
                    )}
                    {needsUpgrade && !isActive && (
                      <span className="ml-auto inline-flex items-center gap-1 text-[9px] text-muted-foreground/70">
                        <Lock className="w-3 h-3" />
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/5">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground"
          asChild
          data-testid="button-logout"
        >
          <a href="/api/logout">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </a>
        </Button>
      </div>
    </div>
  );
}

type MobileNavProps = {
  userRole: string;
  playerId?: number | null;
};

export function MobileNav({ userRole, playerId }: MobileNavProps) {
  const [location] = useLocation();
  const isPlayer = userRole === 'player';
  
  const navItems = isPlayer ? [
    { href: playerId ? `/players/${playerId}` : "/", icon: UserCircle, label: "Profile" },
    { href: "/analyze", icon: PlusCircle, label: "Log", featured: true },
    { href: "/social-hub", icon: UsersRound, label: "Social" },
    { href: "/teams", icon: MessageSquare, label: "Teams" },
    { href: "/leaderboard", icon: Trophy, label: "Rank" },
  ] : [
    { href: "/", icon: LayoutDashboard, label: "Home" },
    { href: "/analyze", icon: PlusCircle, label: "Log", featured: true },
    { href: "/coach/hub", icon: ClipboardList, label: "Hub" },
    { href: "/social-hub", icon: UsersRound, label: "Social" },
    { href: "/players", icon: Users, label: "Roster" },
  ];
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      {/* Enhanced glassmorphic background with better blur and depth */}
      <div className="absolute inset-0 navbar-glass shadow-[0_-8px_40px_rgba(0,0,0,0.5),0_0_30px_rgba(100,200,255,0.06),inset_0_1px_0_rgba(100,200,255,0.1)]" />
      
      {/* Navigation container with proper spacing and touch targets */}
      <div className="relative flex justify-around items-center min-h-16 px-2 gap-1">
        {navItems.map((item) => {
          const isActive = location === item.href || 
            (item.href.includes('/players/') && location.includes('/players/') && location === item.href);
          const Icon = item.icon;
          
          if (item.featured) {
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className="flex flex-col items-center justify-center touch-target -mt-8 transition-all duration-300 active:scale-95" 
                data-testid={`mobile-nav-${item.label.toLowerCase()}`}
              >
                <div className={cn(
                  "rounded-full p-2.5 border transition-all duration-300 nav-item-transition",
                  isActive 
                    ? "bg-primary text-white border-primary shadow-xl glow-cyan" 
                    : "bg-primary text-white border-primary/80 shadow-lg shadow-primary/40 hover:shadow-xl hover:glow-cyan-sm"
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className={cn(
                  "text-[9px] font-medium uppercase tracking-widest mt-1.5 transition-all duration-300 nav-item-transition",
                  isActive 
                    ? "text-primary font-bold nav-active-indicator" 
                    : "text-muted-foreground hover:text-cyan-300"
                )}>{item.label}</span>
              </Link>
            );
          }
          
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={cn(
                "flex flex-col items-center justify-center touch-target p-2 transition-all duration-300 nav-item-transition active:scale-95",
                isActive 
                  ? "text-primary nav-item-active nav-active-indicator" 
                  : "text-muted-foreground hover:text-cyan-300 hover:glow-cyan-sm"
              )} 
              data-testid={`mobile-nav-${item.label.toLowerCase()}`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[9px] font-medium uppercase tracking-widest mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
