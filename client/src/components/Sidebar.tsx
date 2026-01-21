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
    <div className="hidden md:flex flex-col w-64 bg-gradient-to-b from-[hsl(var(--sidebar-background))] to-[hsl(220,20%,6%)] border-r border-white/[0.06] h-screen sticky top-0 overflow-y-auto backdrop-blur-xl">
      <div className="p-5 flex items-center gap-3 border-b border-white/[0.06] bg-white/[0.01]">
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
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group font-medium text-sm",
                    isActive 
                      ? "bg-white/[0.08] text-white shadow-[0_0_20px_rgba(255,255,255,0.05)_inset]" 
                      : isFeatured
                      ? "text-primary bg-primary/5"
                      : needsUpgrade
                      ? "text-muted-foreground/60 hover:text-muted-foreground hover:bg-white/[0.03]"
                      : "text-muted-foreground hover:text-white hover:bg-white/[0.04]"
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
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[hsl(var(--sidebar-background))] to-[hsl(var(--sidebar-background))]/90 backdrop-blur-2xl border-t border-white/[0.08] z-50 safe-area-bottom shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
      <div className="flex justify-around items-center h-14 px-1">
        {navItems.map((item) => {
          const isActive = location === item.href || 
            (item.href.includes('/players/') && location.includes('/players/') && location === item.href);
          const Icon = item.icon;
          
          if (item.featured) {
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className="flex flex-col items-center gap-0.5 min-w-[48px] min-h-[44px] justify-center transition-colors duration-200" 
                data-testid={`mobile-nav-${item.label.toLowerCase()}`}
              >
                <div className="rounded-full p-2.5 -mt-6 shadow-xl shadow-primary/30 border border-primary/20 transition-all duration-200 bg-primary text-white">
                  <Icon className="w-5 h-5" />
                </div>
                <span className={cn(
                  "text-[9px] font-medium uppercase tracking-wide mt-0.5 transition-colors duration-200",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>{item.label}</span>
              </Link>
            );
          }
          
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={cn(
                "flex flex-col items-center gap-0.5 min-w-[48px] min-h-[44px] justify-center p-1.5 transition-colors duration-200",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-white"
              )} 
              data-testid={`mobile-nav-${item.label.toLowerCase()}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-medium uppercase tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
