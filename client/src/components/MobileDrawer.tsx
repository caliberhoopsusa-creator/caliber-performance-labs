import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { 
  Menu, LayoutDashboard, Users, PlusCircle, Activity, Trophy, Calculator, Video, 
  Target, MessageSquare, BarChart3, Rss, Camera, ClipboardList, 
  UsersRound, CalendarCheck, Eye, UserCircle, LogOut, CreditCard, Lock, Dumbbell, 
  CalendarDays, Film, FileText, ArrowLeftRight, UserPlus, Bell, ShoppingBag, GraduationCap,
  ChevronDown, ChevronRight, BookOpen, Wand2, Medal, Binoculars, Search, Bookmark
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CaliberLogo } from "@/components/CaliberLogo";
import { useEquippedItems } from "@/contexts/EquippedItemsContext";
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
  sport?: 'basketball' | 'football';
};

type NavSection = {
  title: string;
  items: NavItem[];
};

type MobileDrawerProps = {
  userRole: string;
  playerId?: number | null;
};

export function MobileDrawer({ userRole, playerId }: MobileDrawerProps) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { hasAccess } = useSubscription();
  const { switchRole, isSwitchingRole } = useAuth();
  const { toast } = useToast();
  const prefersReducedMotion = useReducedMotion();
  
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
  const drawerThemeColor = equippedTheme?.item?.value || '#E8192C';
  const currentSport = useSport();
  const isPlayer = userRole === 'player';
  const isCoach = userRole === 'coach';
  const isRecruiter = userRole === 'recruiter';

  const handleRoleSwitch = () => {
    if (isRecruiter) return;
    const newRole: 'player' | 'coach' = isPlayer ? 'coach' : 'player';
    switchRole(newRole, {
      onSuccess: () => {
        toast({ 
          title: `Switched to ${newRole === 'coach' ? 'Coach' : 'Player'} Mode`,
          description: `You're now viewing the app as a ${newRole}.`
        });
        setOpen(false);
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
        { href: "/discover/highlights", label: "Highlights", icon: Film },
        { href: "/recruiting", label: "Recruiting", icon: GraduationCap },
        { href: "/analyze", label: "Log Game", icon: PlusCircle },
      ],
    },
  ];

  const playerMoreItems: NavItem[] = [
    { href: "/performance", label: "Performance", icon: Activity },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/whos-watching", label: "Who's Watching", icon: Binoculars },
    { href: "/community", label: "Community", icon: UsersRound },
    { href: "/community?tab=stories", label: "Stories", icon: BookOpen },
    { href: "/video", label: "Video Analysis", icon: Video, premium: "pro" },
    { href: "/highlights", label: "My Highlights", icon: Camera },
    { href: "/reel-builder", label: "Reel Builder", icon: Wand2 },
    { href: "/scout", label: "Scout Hub", icon: Eye },
    { href: "/schedule", label: "Schedule", icon: CalendarDays },
    { href: "/leagues", label: "League Hub", icon: Medal },
    { href: "/teams", label: "Teams", icon: Users },
  ];

  const playerAccountSection: NavSection = {
    title: "Account",
    items: [
      { href: "/shop", label: "Shop", icon: ShoppingBag },
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
        { href: "/coach", label: "Coach Hub", icon: ClipboardList },
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
      { href: "/shop", label: "Shop", icon: ShoppingBag },
      { href: "/pricing", label: "Pricing", icon: CreditCard },
    ],
  };

  const recruiterSections: NavSection[] = [
    {
      title: "Recruiting",
      items: [
        { href: "/recruiter", label: "Search Players", icon: Search },
        { href: "/recruiter?tab=bookmarks", label: "Bookmarks", icon: Bookmark },
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

  const rawSections = isRecruiter ? recruiterSections : isPlayer ? playerSections : coachSections;
  const moreItems = (isRecruiter ? recruiterMoreItems : isPlayer ? playerMoreItems : coachMoreItems).filter(item => !item.sport || item.sport === currentSport);
  const accountSection = isRecruiter ? recruiterAccountSection : isPlayer ? playerAccountSection : coachAccountSection;
  const sections = rawSections.map(section => ({
    ...section,
    items: section.items.filter(item => !item.sport || item.sport === currentSport),
  }));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <motion.div whileTap={prefersReducedMotion ? undefined : { scale: 0.85 }} transition={prefersReducedMotion ? undefined : { type: "spring", stiffness: 400, damping: 25 }}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden relative group min-h-11 min-w-11"
            data-testid="button-mobile-menu"
          >
            <div className="absolute inset-0 rounded-lg bg-accent/0 group-hover:bg-accent/10 transition-all duration-300" />
            <Menu className="w-5 h-5 relative z-10 transition-transform duration-300 group-active:scale-90" />
          </Button>
        </motion.div>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] p-0 border-r border-accent/10 overflow-hidden">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SheetDescription className="sr-only">Access all app features from this menu</SheetDescription>
        
        {/* Ambient glow effect */}
        <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-accent/[0.06] to-transparent pointer-events-none" />
        <div className="absolute top-20 -left-20 w-40 h-40 bg-accent/[0.08] rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col h-full relative z-10">
          {/* Premium header with gradient */}
          <div className="p-5 border-b border-accent/10 bg-gradient-to-r from-accent/[0.04] to-transparent">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-[-3px] rounded-xl bg-gradient-to-br from-accent/40 to-accent/20 blur-sm" />
                <CaliberLogo size={50} color={drawerThemeColor} className="relative" />
              </div>
              <div>
                <h2 className="font-display font-bold text-foreground text-xl uppercase tracking-wider">Caliber</h2>
                <p className="text-[10px] text-accent/80 uppercase tracking-[0.2em] font-medium">{isRecruiter ? "Recruiter" : isPlayer ? "Player" : "Coach"} Mode</p>
              </div>
            </div>
          </div>

          {/* Mode switching and sport toggle */}
          <div className="p-4 border-b border-accent/10 space-y-4 bg-gradient-to-b from-white/[0.01] to-transparent">
            <motion.div whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }} transition={prefersReducedMotion ? undefined : { type: "spring", stiffness: 400, damping: 25 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRoleSwitch}
                disabled={isSwitchingRole || isRecruiter}
                className="w-full text-xs border-accent/20 bg-accent/5 min-h-11 touch-target"
                data-testid="button-mobile-role-switch"
              >
                {!isRecruiter && <ArrowLeftRight className="w-3.5 h-3.5 mr-2 text-accent" />}
                Switch to {isRecruiter ? "Recruiter" : isPlayer ? 'Coach' : 'Player'} Mode
              </Button>
            </motion.div>
            
          </div>

          {/* Navigation with enhanced styling */}
          <ScrollArea className="flex-1">
            <nav className="p-4 space-y-6">
              <AnimatePresence>
                {sections.map((section, sectionIndex) => (
                  <motion.div 
                    key={section.title}
                    initial={prefersReducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
                    transition={prefersReducedMotion ? { duration: 0 } : { 
                      duration: 0.4,
                      delay: sectionIndex * 0.1,
                      ease: "easeOut"
                    }}
                  >
                    <h3 className="text-[10px] uppercase font-semibold text-accent/50 tracking-[0.2em] px-3 mb-2 flex items-center gap-2">
                      <span className="w-2 h-px bg-gradient-to-r from-accent/40 to-transparent" />
                      {section.title}
                    </h3>
                    <div className="space-y-1">
                      {section.items.map((item, itemIndex) => {
                        const isActive = location === item.href;
                        const needsUpgrade = item.premium && !hasAccess(item.premium);
                        const isFeatured = item.featured && !isActive;
                        
                        return (
                          <motion.div
                            key={item.href}
                            initial={prefersReducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
                            transition={prefersReducedMotion ? { duration: 0 } : {
                              duration: 0.3,
                              delay: sectionIndex * 0.1 + itemIndex * 0.05,
                              ease: "easeOut"
                            }}
                            whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                            whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                          >
                            <Link 
                              href={item.href}
                              onClick={() => setOpen(false)}
                              className={cn(
                                "mobile-menu-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium min-h-11 touch-target",
                                "transition-all duration-200",
                                isActive && "mobile-menu-item-active",
                                isActive 
                                  ? "text-accent bg-accent/15" 
                                  : isFeatured
                                  ? "text-accent bg-accent/5 hover:bg-accent/10"
                                  : needsUpgrade
                                  ? "text-muted-foreground/60"
                                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                              )}
                              data-testid={`mobile-drawer-${item.href.replace(/\//g, '-').replace(/^-/, '') || 'home'}`}
                            >
                              <motion.div 
                                className={cn(
                                  "p-1.5 rounded-lg transition-all duration-300 flex-shrink-0",
                                  isActive 
                                    ? "bg-accent/30" 
                                    : "bg-white/[0.04]"
                                )}
                                animate={isActive && !prefersReducedMotion ? { scale: [1, 1.1, 1] } : {}}
                                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, delay: 0.2 }}
                              >
                                <item.icon className={cn(
                                  "w-4 h-4 transition-all duration-300",
                                  isActive && "text-accent"
                                )} />
                              </motion.div>
                              <span className="flex-1 truncate">{item.label}</span>
                              {isFeatured && (
                                <motion.span 
                                  className="text-[9px] bg-accent text-accent-foreground px-2 py-0.5 rounded-full font-bold uppercase tracking-wide whitespace-nowrap"
                                  initial={prefersReducedMotion ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3, delay: 0.2 }}
                                >
                                  LIVE
                                </motion.span>
                              )}
                              {needsUpgrade && (
                                <div className="p-1 rounded bg-white/5 flex-shrink-0">
                                  <Lock className="w-3 h-3 text-muted-foreground/50" />
                                </div>
                              )}
                            </Link>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {moreItems.length > 0 && (
                <motion.div
                  initial={prefersReducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4, delay: sections.length * 0.1, ease: "easeOut" }}
                >
                  <button
                    onClick={() => setMoreExpanded(!moreExpanded)}
                    className="flex items-center gap-2 w-full text-[10px] uppercase font-semibold text-accent/50 tracking-[0.2em] px-3 mb-2 cursor-pointer transition-colors"
                    data-testid="button-mobile-more-toggle"
                  >
                    <span className="w-2 h-px bg-gradient-to-r from-accent/40 to-transparent" />
                    {moreExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    More
                  </button>
                  {moreExpanded && (
                    <div className="space-y-1">
                      {moreItems.map((item, itemIndex) => {
                        const isActive = location === item.href;
                        const needsUpgrade = item.premium && !hasAccess(item.premium);
                        const isFeatured = item.featured && !isActive;
                        
                        return (
                          <motion.div
                            key={item.href}
                            initial={prefersReducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={prefersReducedMotion ? { duration: 0 } : {
                              duration: 0.3,
                              delay: itemIndex * 0.05,
                              ease: "easeOut"
                            }}
                            whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                            whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                          >
                            <Link 
                              href={item.href}
                              onClick={() => setOpen(false)}
                              className={cn(
                                "mobile-menu-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium min-h-11 touch-target",
                                "transition-all duration-200",
                                isActive && "mobile-menu-item-active",
                                isActive 
                                  ? "text-accent bg-accent/15" 
                                  : isFeatured
                                  ? "text-accent bg-accent/5 hover:bg-accent/10"
                                  : needsUpgrade
                                  ? "text-muted-foreground/60"
                                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                              )}
                              data-testid={`mobile-drawer-${item.href.replace(/\//g, '-').replace(/^-/, '') || 'home'}`}
                            >
                              <motion.div 
                                className={cn(
                                  "p-1.5 rounded-lg transition-all duration-300 flex-shrink-0",
                                  isActive 
                                    ? "bg-accent/30" 
                                    : "bg-white/[0.04]"
                                )}
                              >
                                <item.icon className={cn(
                                  "w-4 h-4 transition-all duration-300",
                                  isActive && "text-accent"
                                )} />
                              </motion.div>
                              <span className="flex-1 truncate">{item.label}</span>
                              {needsUpgrade && (
                                <div className="p-1 rounded bg-white/5 flex-shrink-0">
                                  <Lock className="w-3 h-3 text-muted-foreground/50" />
                                </div>
                              )}
                            </Link>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              <motion.div
                initial={prefersReducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4, delay: (sections.length + 1) * 0.1, ease: "easeOut" }}
              >
                <h3 className="text-[10px] uppercase font-semibold text-accent/50 tracking-[0.2em] px-3 mb-2 flex items-center gap-2">
                  <span className="w-2 h-px bg-gradient-to-r from-accent/40 to-transparent" />
                  {accountSection.title}
                </h3>
                <div className="space-y-1">
                  {accountSection.items.map((item, itemIndex) => {
                    const isActive = location === item.href;
                    return (
                      <motion.div
                        key={item.href}
                        whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                        whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                      >
                        <Link 
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "mobile-menu-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium min-h-11 touch-target",
                            "transition-all duration-200",
                            isActive && "mobile-menu-item-active",
                            isActive 
                              ? "text-accent bg-accent/15" 
                              : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                          )}
                          data-testid={`mobile-drawer-${item.href.replace(/\//g, '-').replace(/^-/, '') || 'home'}`}
                        >
                          <motion.div 
                            className={cn(
                              "p-1.5 rounded-lg transition-all duration-300 flex-shrink-0",
                              isActive ? "bg-accent/30" : "bg-white/[0.04]"
                            )}
                          >
                            <item.icon className={cn(
                              "w-4 h-4 transition-all duration-300",
                              isActive && "text-accent"
                            )} />
                          </motion.div>
                          <span className="flex-1 truncate">{item.label}</span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </nav>
          </ScrollArea>

          {/* Footer with sign out */}
          <motion.div 
            className="p-4 border-t border-accent/10 bg-gradient-to-t from-muted/30 dark:from-black/20 to-transparent"
            initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4, delay: 0.3 }}
          >
            <motion.div whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }} transition={prefersReducedMotion ? undefined : { type: "spring", stiffness: 400, damping: 25 }}>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-muted-foreground min-h-11"
                asChild
              >
                <a href="/api/logout" className="touch-target">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </a>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
