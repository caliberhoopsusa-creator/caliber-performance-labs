import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { 
  Menu, LayoutDashboard, Users, PlusCircle, Activity, Trophy, Calculator, Video, 
  Binoculars, Target, MessageSquare, BarChart3, Rss, Camera, ClipboardList, 
  UsersRound, CalendarCheck, Eye, UserCircle, LogOut, CreditCard, Lock, Dumbbell, 
  CalendarDays, Film, FileText, ArrowLeftRight, UserPlus, Bell, ShoppingBag, GraduationCap
} from "lucide-react";
import caliberLogo from "@assets/caliber-logo-cyan.png";
import { cn } from "@/lib/utils";
import { useSubscription, type SubscriptionTier } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { SportToggle } from "@/components/SportToggle";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  featured?: boolean;
  premium?: SubscriptionTier;
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
  
  const isPlayer = userRole === 'player';

  const handleRoleSwitch = () => {
    const newRole = isPlayer ? 'coach' : 'player';
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
        { href: playerId ? `/players/${playerId}` : "/", label: "Player Profile", icon: UserCircle },
        { href: "/analyze", label: "Log Game", icon: PlusCircle },
        { href: "/schedule", label: "Schedule", icon: CalendarDays },
        { href: "/workouts", label: "Workouts", icon: Dumbbell },
        { href: "/recruiting", label: "Recruiting", icon: GraduationCap },
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
        { href: "/shop", label: "Shop", icon: ShoppingBag },
        { href: "/pricing", label: "Pricing", icon: CreditCard },
      ],
    },
  ];

  const sections = isPlayer ? playerSections : coachSections;

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
            <div className="absolute inset-0 rounded-lg bg-cyan-500/0 group-hover:bg-cyan-500/10 transition-all duration-300" />
            <Menu className="w-5 h-5 relative z-10 transition-transform duration-300 group-active:scale-90" />
          </Button>
        </motion.div>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] p-0 mobile-drawer-glass border-r border-cyan-500/10 overflow-hidden">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SheetDescription className="sr-only">Access all app features from this menu</SheetDescription>
        
        {/* Ambient glow effect */}
        <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-cyan-500/[0.06] to-transparent pointer-events-none" />
        <div className="absolute top-20 -left-20 w-40 h-40 bg-cyan-500/[0.08] rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col h-full relative z-10">
          {/* Premium header with gradient */}
          <div className="p-5 border-b border-cyan-500/10 bg-gradient-to-r from-cyan-500/[0.04] to-transparent">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-[-3px] rounded-xl bg-gradient-to-br from-cyan-400/40 to-cyan-600/20 blur-sm" />
                <img src={caliberLogo} alt="Caliber" className="relative w-11 h-11 rounded-xl shadow-lg shadow-cyan-500/20 object-contain" width={44} height={44} />
              </div>
              <div>
                <h2 className="font-display font-bold text-white text-xl uppercase tracking-wider">Caliber</h2>
                <p className="text-[10px] text-cyan-400/80 uppercase tracking-[0.2em] font-medium">{userRole} Mode</p>
              </div>
            </div>
          </div>

          {/* Mode switching and sport toggle */}
          <div className="p-4 border-b border-cyan-500/10 space-y-4 bg-gradient-to-b from-white/[0.01] to-transparent">
            <motion.div whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }} transition={prefersReducedMotion ? undefined : { type: "spring", stiffness: 400, damping: 25 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRoleSwitch}
                disabled={isSwitchingRole}
                className="w-full text-xs border-cyan-500/20 bg-cyan-500/5 min-h-11 touch-target"
                data-testid="button-mobile-role-switch"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 mr-2 text-cyan-400" />
                Switch to {isPlayer ? 'Coach' : 'Player'} Mode
              </Button>
            </motion.div>
            
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase font-semibold text-cyan-400/60 tracking-[0.2em] px-1">
                Sport Mode
              </span>
              <SportToggle size="sm" showLabels={true} className="w-full justify-center" />
            </div>
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
                    <h3 className="text-[10px] uppercase font-semibold text-cyan-400/50 tracking-[0.2em] px-3 mb-2 flex items-center gap-2">
                      <span className="w-2 h-px bg-gradient-to-r from-cyan-500/40 to-transparent" />
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
                                  ? "text-cyan-400 bg-cyan-500/15 shadow-[0_0_16px_rgba(0,212,255,0.4)]" 
                                  : isFeatured
                                  ? "text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10"
                                  : needsUpgrade
                                  ? "text-muted-foreground/60"
                                  : "text-muted-foreground hover:text-white hover:bg-white/5"
                              )}
                              data-testid={`mobile-drawer-${item.href.replace(/\//g, '-').replace(/^-/, '') || 'home'}`}
                            >
                              <motion.div 
                                className={cn(
                                  "p-1.5 rounded-lg transition-all duration-300 flex-shrink-0",
                                  isActive 
                                    ? "bg-cyan-500/30 shadow-[0_0_16px_rgba(0,212,255,0.4)]" 
                                    : "bg-white/[0.04]"
                                )}
                                animate={isActive && !prefersReducedMotion ? { scale: [1, 1.1, 1] } : {}}
                                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, delay: 0.2 }}
                              >
                                <item.icon className={cn(
                                  "w-4 h-4 transition-all duration-300",
                                  isActive && "text-cyan-300 drop-shadow-[0_0_8px_rgba(0,212,255,0.7)]"
                                )} />
                              </motion.div>
                              <span className="flex-1 truncate">{item.label}</span>
                              {isFeatured && (
                                <motion.span 
                                  className="text-[9px] bg-gradient-to-r from-cyan-500 to-cyan-400 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wide shadow-lg shadow-cyan-500/30 whitespace-nowrap"
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
            </nav>
          </ScrollArea>

          {/* Footer with sign out */}
          <motion.div 
            className="p-4 border-t border-cyan-500/10 bg-gradient-to-t from-black/20 to-transparent"
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
