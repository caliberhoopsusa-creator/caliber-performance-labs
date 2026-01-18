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
        { href: "/teams", label: "Teams", icon: Users },
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
        { href: "/teams", label: "Teams", icon: MessageSquare },
      ],
    },
    {
      title: "Coach Tools",
      items: [
        { href: "/coach/hub", label: "Team Hub", icon: ClipboardList, premium: "coach_pro" },
        { href: "/coach/practices", label: "Practices", icon: CalendarCheck, premium: "coach_pro" },
        { href: "/report-card", label: "Report Cards", icon: FileText },
      ],
    },
  ];

  const navSections = isPlayer ? playerSections : coachSections;

  return (
    <div className="hidden md:flex flex-col w-64 bg-card border-r border-border h-screen sticky top-0 overflow-y-auto">
      <div className="p-6 flex items-center gap-3 border-b border-border/50">
        <img src={caliberLogo} alt="Caliber Logo" className="h-10 w-10 rounded-xl shadow-lg shadow-primary/20 object-contain" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold font-display text-white tracking-wider uppercase">CALIBER</h1>
          <button 
            onClick={handleRoleSwitch}
            disabled={isSwitchingRole}
            className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-widest font-medium hover:text-primary transition-colors cursor-pointer"
            data-testid="button-switch-role"
          >
            {isPlayer ? "Player" : "Coach"} Mode
            <ArrowLeftRight className="w-3 h-3" />
          </button>
        </div>
        {isCoach && (
          <Link href="/coach/alerts" className="text-muted-foreground hover:text-white transition-colors" data-testid="header-alerts-badge">
            <AlertsBadge />
          </Link>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-6">
        {navSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-4">{section.title}</h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = location === item.href || (item.href.includes('/players/') && location.includes('/players/') && location === item.href);
                const needsUpgrade = item.premium && !hasAccess(item.premium);
                const isCoachPro = item.premium === "coach_pro";
                const isFeatured = item.featured && !isActive;
                return (
                  <Link key={item.href} href={item.href} className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group font-medium text-sm",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                      : isFeatured
                      ? "text-primary bg-primary/10 border border-primary/30 hover:bg-primary/20"
                      : needsUpgrade
                      ? "text-amber-400 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:from-amber-500/20 hover:to-orange-500/20"
                      : "text-muted-foreground hover:bg-white/5 hover:text-white"
                  )} data-testid={`nav-${item.href.replace(/\//g, '-').replace(/^-/, '') || 'home'}`}>
                    <item.icon className={cn("w-4 h-4", isActive ? "stroke-[2.5px]" : "stroke-2", isFeatured && "text-primary")} />
                    {item.label}
                    {isFeatured && (
                      <span className="ml-auto text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                        LIVE
                      </span>
                    )}
                    {needsUpgrade && !isActive && (
                      <span className="ml-auto inline-flex items-center gap-1 text-[10px] bg-gradient-to-r from-primary to-orange-500 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                        <Lock className="w-2.5 h-2.5" />
                        {isCoachPro ? "PRO" : "PRO"}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-border/50">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-white"
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
    { href: "/", icon: LayoutDashboard, label: "Home" },
    { href: "/analyze", icon: PlusCircle, label: "Log", featured: true },
    { href: "/schedule", icon: CalendarDays, label: "Schedule" },
    { href: "/leaderboard", icon: Trophy, label: "Rank" },
    { href: playerId ? `/players/${playerId}` : "/", icon: UserCircle, label: "Me" },
  ] : [
    { href: "/", icon: LayoutDashboard, label: "Home" },
    { href: "/players", icon: Users, label: "Roster" },
    { href: "/analyze", icon: PlusCircle, label: "Log", featured: true },
    { href: "/schedule", icon: CalendarDays, label: "Schedule" },
    { href: "/leaderboard", icon: Trophy, label: "Rank" },
  ];
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16 px-1">
        {navItems.map((item) => {
          const isActive = location === item.href || 
            (item.href.includes('/players/') && location.includes('/players/') && location === item.href);
          const Icon = item.icon;
          
          if (item.featured) {
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className="flex flex-col items-center gap-0.5 min-w-[48px] min-h-[44px] justify-center" 
                data-testid={`mobile-nav-${item.label.toLowerCase()}`}
              >
                <div className="rounded-full p-2 -mt-5 shadow-lg border-2 border-background transition-all bg-primary text-primary-foreground">
                  <Icon className="w-5 h-5" />
                </div>
                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-wide",
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
                "flex flex-col items-center gap-0.5 min-w-[48px] min-h-[44px] justify-center p-1.5 rounded-lg transition-colors",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground active:bg-white/5"
              )} 
              data-testid={`mobile-nav-${item.label.toLowerCase()}`}
            >
              <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-wide",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
