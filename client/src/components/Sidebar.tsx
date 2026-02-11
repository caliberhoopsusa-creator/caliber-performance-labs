import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, PlusCircle, Activity, Trophy, Calculator, Video, Target, MessageSquare, BarChart3, Rss, Camera, ClipboardList, UsersRound, CalendarCheck, Eye, Bell, UserCircle, LogOut, CreditCard, Lock, Dumbbell, CalendarDays, Film, FileText, ArrowLeftRight, UserPlus, ShoppingBag, ClipboardCheck, Medal, GraduationCap, Heart, Radio, Wand2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import caliberLogo from "@assets/caliber-logo-monogram.png";
import { cn } from "@/lib/utils";
import { AlertsBadge } from "@/components/AlertsCenter";
import { Button } from "@/components/ui/button";
import { useSubscription, type SubscriptionTier } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { SportToggle } from "@/components/SportToggle";

type NavSection = {
  title: string;
  items: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    featured?: boolean;
    premium?: SubscriptionTier;
    badgeCount?: number;
  }[];
};

type SidebarProps = {
  userRole: string;
  playerId?: number | null;
};

export function Sidebar({ userRole, playerId }: SidebarProps) {
  const [location] = useLocation();
  const { hasAccess, isPro } = useSubscription();
  const { switchRole, isSwitchingRole, switchRoleError } = useAuth();
  const { toast } = useToast();

  // For players: show their profile and limited options
  // For coaches: show full navigation with all coach tools
  const isPlayer = userRole === 'player';
  const isCoach = userRole === 'coach';

  // Fetch pending verification count for coaches
  const { data: pendingGames } = useQuery<{ id: number }[]>({
    queryKey: ['/api/coach/unverified-games'],
    enabled: isCoach,
  });
  const pendingCount = pendingGames?.length ?? 0;

  const handleRoleSwitch = () => {
    const newRole = isPlayer ? 'coach' : 'player';
    switchRole(newRole, {
      onSuccess: () => {
        toast({ 
          title: `Switched to ${newRole === 'coach' ? 'Coach' : 'Player'} Mode`,
          description: `You're now viewing the app as a ${newRole}.`
        });
      },
      onError: (error) => {
        const errorMessage = error?.message || 'Failed to switch mode';
        const errorType = error?.type;
        
        // Show session expiry message
        if (errorType === 'session_expired') {
          toast({ 
            title: 'Session Expired', 
            description: 'Your session has expired. Please log in again.',
            variant: 'destructive'
          });
          return;
        }
        
        // Show network error
        if (errorType === 'network_error') {
          toast({ 
            title: 'Network Error', 
            description: 'Unable to connect. Please check your internet connection.',
            variant: 'destructive'
          });
          return;
        }

        toast({ 
          title: 'Error', 
          description: errorMessage,
          variant: 'destructive'
        });
      }
    });
  };

  const playerSections: NavSection[] = [
    {
      title: "My Game",
      items: [
        { href: "/community?tab=feed", label: "Feed", icon: Rss },
        { href: playerId ? `/players/${playerId}` : "/", label: "Player Profile", icon: UserCircle },
        { href: "/analyze", label: "Log Game", icon: PlusCircle },
        { href: "/schedule", label: "Schedule", icon: CalendarDays },
        { href: "/highlights", label: "Highlights", icon: Film },
        { href: "/reel-builder", label: "Reel Builder", icon: Wand2 },
        { href: "/discover/highlights", label: "Discover", icon: Film },
        { href: "/performance", label: "Performance", icon: Activity },
        { href: "/recruiting", label: "Recruiting", icon: GraduationCap },
      ],
    },
    {
      title: "Explore",
      items: [
        { href: "/community", label: "Community", icon: UsersRound },
        { href: "/scout", label: "Scout Hub", icon: Eye },
        { href: "/analytics", label: "Analytics", icon: BarChart3 },
        { href: "/leagues", label: "League Hub", icon: Medal },
        { href: "/teams", label: "Teams", icon: Users },
      ],
    },
    {
      title: "Account",
      items: [
        { href: "/shop", label: "Shop", icon: ShoppingBag },
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
        { href: "/discover/highlights", label: "Discover", icon: Film },
        { href: "/scout", label: "Scout Hub", icon: Eye },
        { href: "/analytics", label: "Analytics", icon: BarChart3 },
        { href: "/leagues", label: "League Hub", icon: Medal },
        { href: "/community", label: "Community", icon: UsersRound },
        { href: "/teams", label: "Teams", icon: MessageSquare },
      ],
    },
    {
      title: "Coach Tools",
      items: [
        { href: "/coach", label: "Coach Hub", icon: ClipboardList, featured: pendingCount > 0, badgeCount: pendingCount },
        { href: "/live-game", label: "Live Game", icon: Radio },
        { href: "/report-card", label: "Report Cards", icon: FileText },
        { href: "/video", label: "Video Analysis", icon: Video, premium: "pro" },
      ],
    },
    {
      title: "Account",
      items: [
        { href: "/shop", label: "Shop", icon: ShoppingBag },
        { href: "/pricing", label: "Pricing", icon: CreditCard },
      ],
    },
  ];

  const navSections = isPlayer ? playerSections : coachSections;

  return (
    <div className="hidden md:flex flex-col w-64 bg-sidebar border-r border-border h-screen sticky top-0 overflow-y-auto">
      <div className="p-5 flex items-center gap-3 border-b border-border">
        <img src={caliberLogo} alt="Caliber Logo" className="h-9 w-9 rounded-lg shadow-lg shadow-black/20 object-contain" width={36} height={36} />
        <div className="flex-1">
          <h1 className="text-xl font-bold font-display text-white tracking-wider uppercase">CALIBER</h1>
          <button 
            onClick={handleRoleSwitch}
            disabled={isSwitchingRole}
            className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-widest font-medium transition-colors cursor-pointer"
            data-testid="button-switch-role"
            aria-label={`Switch to ${isPlayer ? 'Coach' : 'Player'} Mode`}
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

      <div className="px-3 py-2 border-b border-border">
        <SportToggle size="sm" showLabels={true} className="w-full justify-center" />
      </div>

      <nav className="flex-1 p-3 space-y-5">
        {navSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest mb-1.5 px-3">{section.title}</h3>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const baseHref = item.href.split('?')[0];
                const isActive = location === item.href || 
                  location === baseHref ||
                  (item.href.includes('/players/') && location.includes('/players/') && location === item.href);
                const needsUpgrade = item.premium && !hasAccess(item.premium);
                const isCoachPro = item.premium === "coach_pro";
                const isFeatured = item.featured && !isActive;
                return (
                  <Link key={item.href} href={item.href} className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 group font-medium text-base relative overflow-hidden",
                    isActive 
                      ? "bg-accent/10 text-white" 
                      : isFeatured
                      ? "text-accent bg-accent/5"
                      : needsUpgrade
                      ? "text-muted-foreground/50"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )} data-testid={`nav-${item.href.replace(/\//g, '-').replace(/^-/, '') || 'home'}`}>
                    <item.icon className={cn("w-4 h-4", isActive && "text-primary", isFeatured && "text-accent")} />
                    {item.label}
                    {item.badgeCount !== undefined && item.badgeCount > 0 && (
                      <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] bg-accent text-white rounded-full font-bold">
                        {item.badgeCount > 99 ? '99+' : item.badgeCount}
                      </span>
                    )}
                    {isFeatured && !item.badgeCount && (
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

      <div className="p-3 border-t border-border">
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
    { href: "/community", icon: Rss, label: "Feed" },
    { href: "/analyze", icon: PlusCircle, label: "Log", featured: true },
    { href: playerId ? `/players/${playerId}` : "/players", icon: UserCircle, label: "Profile" },
    { href: "/analytics", icon: BarChart3, label: "Analytics" },
    { href: "/discover/highlights", icon: Film, label: "Discover" },
  ] : [
    { href: "/", icon: LayoutDashboard, label: "Home" },
    { href: "/analyze", icon: PlusCircle, label: "Log", featured: true },
    { href: "/scout", icon: Eye, label: "Scout" },
    { href: "/coach", icon: ClipboardList, label: "Coach" },
    { href: "/players", icon: Users, label: "Roster" },
  ];
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-safe pl-safe pr-safe">
      <div className="flex justify-around items-end min-h-[64px] px-1">
        {navItems.map((item) => {
          const isActive = location === item.href || 
            (item.href.includes('/players/') && location.startsWith('/players/'));
          const Icon = item.icon;
          
          if (item.featured) {
            return (
              <Link 
                key={item.href}
                href={item.href} 
                className="flex flex-col items-center justify-center -mt-4 px-2 pb-1"
                data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                aria-label={item.label}
              >
                <div className={cn(
                  "rounded-full p-3 bg-accent text-white",
                  isActive && "ring-2 ring-accent/30 ring-offset-2 ring-offset-background"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={cn(
                  "text-[10px] font-medium mt-1",
                  isActive ? "text-accent" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          }
          
          return (
            <Link 
              key={item.href}
              href={item.href} 
              className="relative flex flex-col items-center justify-center px-3 py-2 min-w-[48px]"
              data-testid={`mobile-nav-${item.label.toLowerCase()}`}
              data-active={isActive ? "true" : undefined}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
            >
              <AnimatePresence>
                {isActive && (
                  <motion.div 
                    layoutId="mobile-nav-indicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </AnimatePresence>
              
              <Icon className={cn(
                "w-5 h-5",
                isActive ? "text-accent" : "text-muted-foreground"
              )} />
              
              <span className={cn(
                "text-[10px] font-medium mt-1",
                isActive ? "text-accent" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
