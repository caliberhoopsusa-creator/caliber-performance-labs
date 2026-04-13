import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, PlusCircle, Activity, Trophy, Calculator, Video, Target, MessageSquare, BarChart3, Rss, Camera, ClipboardList, UsersRound, CalendarCheck, Eye, Bell, UserCircle, LogOut, CreditCard, Lock, Dumbbell, CalendarDays, Film, FileText, ArrowLeftRight, UserPlus, ShoppingBag, ClipboardCheck, Medal, GraduationCap, Heart, Wand2, ChevronDown, ChevronRight, BookOpen, Binoculars, Search, Bookmark, UserSearch, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { CaliberLogo } from "@/components/CaliberLogo";
import { useEquippedItems } from "@/contexts/EquippedItemsContext";
import { AlertsBadge } from "@/components/AlertsCenter";
import { Button } from "@/components/ui/button";
import { useSubscription, type SubscriptionTier } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { SportToggle, useSport } from "@/components/SportToggle";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  featured?: boolean;
  premium?: SubscriptionTier;
  badgeCount?: number;
  sport?: 'basketball';
};

type NavSection = {
  title: string;
  items: NavItem[];
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

  const [moreExpanded, setMoreExpanded] = useState(() => {
    try {
      return localStorage.getItem("caliber_sidebar_more_expanded") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("caliber_sidebar_more_expanded", String(moreExpanded));
    } catch {}
  }, [moreExpanded]);

  const { equippedTheme } = useEquippedItems();
  const sidebarThemeColor = '#C6D0D8';
  const currentSport = useSport();
  const isPlayer = userRole === 'player';
  const isCoach = userRole === 'coach';
  const isRecruiter = userRole === 'recruiter';
  const isGuardian = userRole === 'guardian';

  const { data: pendingGames } = useQuery<{ id: number }[]>({
    queryKey: ['/api/coach/unverified-games'],
    enabled: isCoach,
  });
  const pendingCount = pendingGames?.length ?? 0;

  const handleRoleSwitch = () => {
    const roleOrder: Array<'player' | 'coach' | 'recruiter' | 'guardian'> = ['player', 'coach', 'recruiter', 'guardian'];
    const currentIndex = roleOrder.indexOf(userRole as any);
    const newRole = roleOrder[(currentIndex + 1) % roleOrder.length];
    switchRole(newRole as any, {
      onSuccess: () => {
        const labels: Record<string, string> = { player: 'Player', coach: 'Coach', recruiter: 'Recruiter', guardian: 'Guardian' };
        toast({ 
          title: `Switched to ${labels[newRole]} Mode`,
          description: `You're now viewing the app as a ${labels[newRole].toLowerCase()}.`
        });
      },
      onError: (error) => {
        const errorMessage = error?.message || 'Failed to switch mode';
        const errorType = error?.type;
        
        if (errorType === 'session_expired') {
          toast({ 
            title: 'Session Expired', 
            description: 'Your session has expired. Please log in again.',
            variant: 'destructive'
          });
          return;
        }
        
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
      title: "Main",
      items: [
        { href: playerId ? `/players/${playerId}` : "/", label: "My Profile", icon: UserCircle },
        { href: "/community?tab=feed", label: "Feed", icon: Rss },
        { href: "/analyze", label: "Log Game", icon: PlusCircle },
      ],
    },
    {
      title: "Exposure",
      items: [
        { href: "/recruiting", label: "Recruiting", icon: GraduationCap },
        { href: "/whos-watching", label: "Who's Watching", icon: Binoculars },
        { href: "/highlights", label: "Highlights", icon: Camera },
        { href: "/reel-builder", label: "Reel Builder", icon: Wand2 },
        { href: "/scout", label: "Scout Hub", icon: Eye },
      ],
    },
  ];

  const playerMoreItems: NavItem[] = [
    { href: "/performance", label: "Performance", icon: Activity },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/community", label: "Community", icon: UsersRound },
    { href: "/community?tab=stories", label: "Stories", icon: BookOpen },
    { href: "/video", label: "Video Analysis", icon: Video, premium: "pro" },
    { href: "/discover/highlights", label: "Discover", icon: Film },
    { href: "/recruiter-directory", label: "Find Recruiters", icon: UserSearch },
    { href: "/schedule", label: "Schedule", icon: CalendarDays },
    { href: "/leagues", label: "League Hub", icon: Medal },
    { href: "/teams", label: "Teams", icon: Users },
  ];

  const playerAccountSection: NavSection = {
    title: "Account",
    items: [
      { href: "/pricing", label: "Pricing", icon: CreditCard },
    ],
  };

  const coachSections: NavSection[] = [
    {
      title: "Essentials",
      items: [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/players", label: "Players", icon: Users },
        { href: "/analyze", label: "Log Game", icon: PlusCircle },
        { href: "/coach", label: "Coach Hub", icon: ClipboardList, featured: pendingCount > 0, badgeCount: pendingCount },
      ],
    },
    {
      title: "Game Day",
      items: [
        { href: "/report-card", label: "Report Cards", icon: FileText },
        { href: "/video", label: "Video Analysis", icon: Video, premium: "pro" },
      ],
    },
  ];

  const coachMoreItems: NavItem[] = [
    { href: "/schedule", label: "Schedule", icon: CalendarDays },
    { href: "/scout", label: "Scout Hub", icon: Eye },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/community", label: "Community", icon: UsersRound },
    { href: "/leagues", label: "League Hub", icon: Medal },
    { href: "/teams", label: "Teams", icon: MessageSquare },
    { href: "/discover/highlights", label: "Discover", icon: Film },
  ];

  const coachAccountSection: NavSection = {
    title: "Account",
    items: [
      { href: "/pricing", label: "Pricing", icon: CreditCard },
    ],
  };

  const recruiterSections: NavSection[] = [
    {
      title: "Recruiting",
      items: [
        { href: "/recruiter", label: "Search Players", icon: Search },
        { href: "/recruiter?tab=bookmarks", label: "Bookmarks", icon: Bookmark },
        { href: "/recruiter-directory", label: "Recruiter Directory", icon: UserSearch },
        { href: "/discover/players", label: "Player Directory", icon: Users },
      ],
    },
  ];

  const recruiterMoreItems: NavItem[] = [
    { href: "/discover/highlights", label: "Discover", icon: Film },
  ];

  const recruiterAccountSection: NavSection = {
    title: "Account",
    items: [
      { href: "/pricing", label: "Pricing", icon: CreditCard },
    ],
  };

  const guardianSections: NavSection[] = [
    {
      title: "Family",
      items: [
        { href: "/family", label: "Family Dashboard", icon: Heart },
        { href: "/discover/highlights", label: "Highlights", icon: Film },
      ],
    },
  ];

  const guardianMoreItems: NavItem[] = [];

  const guardianAccountSection: NavSection = {
    title: "Account",
    items: [
      { href: "/pricing", label: "Pricing", icon: CreditCard },
    ],
  };

  const rawSections = isGuardian ? guardianSections : isRecruiter ? recruiterSections : isPlayer ? playerSections : coachSections;
  const moreItems = (isGuardian ? guardianMoreItems : isRecruiter ? recruiterMoreItems : isPlayer ? playerMoreItems : coachMoreItems).filter(item => !item.sport || item.sport === currentSport);
  const accountSection = isGuardian ? guardianAccountSection : isRecruiter ? recruiterAccountSection : isPlayer ? playerAccountSection : coachAccountSection;
  const navSections = rawSections.map(section => ({
    ...section,
    items: section.items.filter(item => !item.sport || item.sport === currentSport),
  }));

  return (
    <div className="hidden md:flex flex-col w-64 bg-sidebar border-r border-border h-screen sticky top-0 overflow-y-auto">
      <div className="relative p-5 flex items-center gap-3 border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-accent/5 to-transparent pointer-events-none" />
        {/* Red precision top line */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[hsl(var(--cta))]/60 to-transparent" />
        <CaliberLogo size={44} color={sidebarThemeColor} />
        <div className="flex-1">
          <h1 className="text-xl font-bold font-display tracking-wider uppercase text-platinum" style={{ color: sidebarThemeColor }}>CALIBER</h1>
          <button 
            onClick={handleRoleSwitch}
            disabled={isSwitchingRole}
            className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-widest font-medium transition-colors cursor-pointer"
            data-testid="button-switch-role"
            aria-label={`Switch to ${isPlayer ? 'Coach' : isCoach ? 'Recruiter' : isRecruiter ? 'Guardian' : isGuardian ? 'Player' : 'Player'} Mode`}
          >
            {isGuardian ? "Guardian" : isRecruiter ? "Recruiter" : isPlayer ? "Player" : "Coach"} Mode
            <ArrowLeftRight className="w-3 h-3" />
          </button>
        </div>
        {isCoach && (
          <Link href="/coach/alerts" className="text-muted-foreground transition-colors" data-testid="header-alerts-badge">
            <AlertsBadge />
          </Link>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-6">
        {navSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-[11px] font-bold text-muted-foreground/55 uppercase tracking-[0.13em] mb-3 px-3">{section.title}</h3>
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
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 group text-base relative overflow-hidden",
                    isActive
                      ? "border-l-2 border-[hsl(var(--cta))] bg-[hsl(var(--cta))]/[0.08] text-foreground font-semibold pl-[10px]"
                      : isFeatured
                      ? "text-[hsl(var(--cta))] bg-[hsl(var(--cta))]/[0.06] font-medium"
                      : needsUpgrade
                      ? "text-muted-foreground/50 font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5 font-medium"
                  )} data-testid={`nav-${item.href.replace(/\//g, '-').replace(/^-/, '') || 'home'}`}>
                    <item.icon className={cn("w-4 h-4", isActive && "text-[hsl(var(--cta))]", isFeatured && "text-[hsl(var(--cta))]")} />
                    {item.label}
                    {item.badgeCount !== undefined && item.badgeCount > 0 && (
                      <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] bg-[hsl(var(--cta))] text-white rounded-full font-bold">
                        {item.badgeCount > 99 ? '99+' : item.badgeCount}
                      </span>
                    )}
                    {isFeatured && !item.badgeCount && (
                      <span className="ml-auto text-[9px] bg-[hsl(var(--cta))] text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
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

        {moreItems.length > 0 && (
          <div>
            <button
              onClick={() => setMoreExpanded(!moreExpanded)}
              className="flex items-center gap-2 w-full text-[11px] font-bold text-muted-foreground/55 uppercase tracking-[0.13em] mb-3 px-3 cursor-pointer transition-colors hover:text-muted-foreground/80"
              data-testid="button-more-toggle"
            >
              {moreExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              More
            </button>
            {moreExpanded && (
              <div className="space-y-0.5">
                {moreItems.map((item) => {
                  const baseHref = item.href.split('?')[0];
                  const isActive = location === item.href ||
                    location === baseHref ||
                    (item.href.includes('/players/') && location.includes('/players/') && location === item.href);
                  const needsUpgrade = item.premium && !hasAccess(item.premium);
                  const isFeatured = item.featured && !isActive;
                  return (
                    <Link key={item.href} href={item.href} className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 text-sm relative overflow-hidden",
                      isActive
                        ? "border-l-2 border-[hsl(var(--cta))] bg-[hsl(var(--cta))]/[0.08] text-foreground font-semibold pl-[10px]"
                        : isFeatured
                        ? "text-[hsl(var(--cta))] bg-[hsl(var(--cta))]/[0.06] font-medium"
                        : needsUpgrade
                        ? "text-muted-foreground/35"
                        : "text-muted-foreground/60 hover:text-foreground hover:bg-white/5"
                    )} data-testid={`nav-${item.href.replace(/\//g, '-').replace(/^-/, '') || 'home'}`}>
                      <item.icon className={cn("w-3.5 h-3.5 shrink-0", isActive && "text-[hsl(var(--cta))]", isFeatured && "text-[hsl(var(--cta))]")} />
                      {item.label}
                      {item.badgeCount !== undefined && item.badgeCount > 0 && (
                        <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] bg-[hsl(var(--cta))] text-white rounded-full font-bold">
                          {item.badgeCount > 99 ? '99+' : item.badgeCount}
                        </span>
                      )}
                      {needsUpgrade && !isActive && (
                        <span className="ml-auto inline-flex items-center gap-1 text-[9px] text-muted-foreground/50">
                          <Lock className="w-3 h-3" />
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div>
          <h3 className="text-[11px] font-bold text-muted-foreground/55 uppercase tracking-[0.13em] mb-3 px-3">{accountSection.title}</h3>
          <div className="space-y-0.5">
            {accountSection.items.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href} className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 group text-base relative overflow-hidden",
                  isActive
                    ? "border-l-2 border-[hsl(var(--cta))] bg-[hsl(var(--cta))]/[0.08] text-foreground font-semibold pl-[10px]"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5 font-medium"
                )} data-testid={`nav-${item.href.replace(/\//g, '-').replace(/^-/, '') || 'home'}`}>
                  <item.icon className={cn("w-4 h-4", isActive && "text-[hsl(var(--cta))]")} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
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
  const isRecruiter = userRole === 'recruiter';
  
  const isGuardian = userRole === 'guardian';
  
  const navItems = isGuardian ? [
    { href: "/family", icon: Heart, label: "Family" },
    { href: "/discover/highlights", icon: Film, label: "Highlights" },
  ] : isRecruiter ? [
    { href: "/recruiter", icon: Search, label: "Search" },
    { href: "/recruiter?tab=bookmarks", icon: Bookmark, label: "Saved" },
    { href: "/discover/players", icon: Users, label: "Directory" },
    { href: "/discover/highlights", icon: Film, label: "Discover" },
  ] : isPlayer ? [
    { href: playerId ? `/players/${playerId}` : "/", icon: UserCircle, label: "Profile" },
    { href: "/community?tab=feed", icon: Rss, label: "Feed" },
    { href: "/analyze", icon: PlusCircle, label: "Log", featured: true },
    { href: "/recruiting", icon: GraduationCap, label: "Recruiting" },
    { href: "/discover/highlights", icon: Film, label: "Highlights" },
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
                  "rounded-full p-3 text-white cta-glow",
                  "bg-[hsl(var(--cta))]",
                  isActive && "ring-2 ring-[hsl(var(--cta))]/30 ring-offset-2 ring-offset-background"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={cn(
                  "text-[10px] font-medium mt-1",
                  isActive ? "text-[hsl(var(--cta))]" : "text-muted-foreground"
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
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[hsl(var(--cta))]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </AnimatePresence>
              
              <Icon className={cn(
                "w-5 h-5",
                isActive ? "text-[hsl(var(--cta))]" : "text-muted-foreground"
              )} />

              <span className={cn(
                "text-[10px] font-medium mt-1",
                isActive ? "text-[hsl(var(--cta))]" : "text-muted-foreground"
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
