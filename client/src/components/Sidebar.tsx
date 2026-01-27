import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, PlusCircle, Activity, Trophy, Calculator, Video, Binoculars, Target, MessageSquare, BarChart3, Rss, Camera, ClipboardList, UsersRound, CalendarCheck, Eye, Bell, UserCircle, LogOut, CreditCard, Lock, Dumbbell, CalendarDays, Film, FileText, ArrowLeftRight, UserPlus } from "lucide-react";
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
        { href: "/scout", label: "Scout Hub", icon: Eye },
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
        { href: "/scout", label: "Scout Hub", icon: Eye },
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
        <img src={caliberLogo} alt="Caliber Logo" className="h-9 w-9 rounded-lg shadow-lg shadow-black/20 object-contain" width={36} height={36} />
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

      <div className="px-3 py-2 border-b border-cyan-500/[0.08]">
        <SportToggle size="sm" showLabels={true} className="w-full justify-center" />
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
      {/* Premium glassmorphic navbar with enhanced depth and glow */}
      <div className="absolute inset-0 mobile-nav-glass" />
      
      {/* Subtle top border glow line */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
      
      {/* Navigation container with proper spacing and touch targets */}
      <div className="relative flex justify-around items-center min-h-[72px] px-3 gap-1">
        {navItems.map((item, index) => {
          // Enhanced active state detection - profile link should match any /players/:id path
          const isActive = location === item.href || 
            (item.href.includes('/players/') && location.startsWith('/players/'));
          const Icon = item.icon;
          
          if (item.featured) {
            return (
              <motion.div 
                key={item.href}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 400,
                  damping: 25
                }}
              >
                <Link 
                  href={item.href} 
                  className="flex flex-col items-center justify-center touch-target -mt-6 transition-all duration-300 group min-h-16" 
                  data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                >
                  {/* Featured button with animated ring */}
                  <motion.div 
                    className="relative"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    {/* Animated outer ring */}
                    <motion.div 
                      className={cn(
                        "absolute inset-[-4px] rounded-full transition-all duration-500",
                        isActive 
                          ? "bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-400 opacity-100" 
                          : "bg-gradient-to-r from-cyan-500/50 via-cyan-400/50 to-cyan-500/50 opacity-0 group-hover:opacity-100"
                      )}
                      animate={isActive ? { rotate: 360 } : {}}
                      transition={{ duration: 3, repeat: Infinity, linear: true }}
                    />
                    
                    {/* Inner glow */}
                    <div className={cn(
                      "absolute inset-[-2px] rounded-full bg-background transition-all duration-300",
                    )} />
                    
                    {/* Main button */}
                    <motion.div 
                      className={cn(
                        "relative rounded-full p-3 border-2 transition-all duration-300",
                        isActive 
                          ? "bg-gradient-to-br from-cyan-400 to-cyan-500 text-white border-cyan-300 shadow-[0_0_30px_rgba(0,212,255,0.5),0_0_60px_rgba(0,212,255,0.3)]" 
                          : "bg-gradient-to-br from-cyan-500 to-cyan-600 text-white border-cyan-400/60 shadow-[0_4px_20px_rgba(0,212,255,0.4)] group-hover:shadow-[0_0_30px_rgba(0,212,255,0.5)]"
                      )}
                      animate={isActive ? { scale: [1, 1.08, 1] } : {}}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                    >
                      <Icon className="w-6 h-6 drop-shadow-lg" />
                    </motion.div>
                  </motion.div>
                  
                  <motion.span 
                    className={cn(
                      "text-[9px] font-semibold uppercase tracking-widest mt-2 transition-all duration-300",
                      isActive 
                        ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(0,212,255,0.8)]" 
                        : "text-muted-foreground group-hover:text-cyan-300"
                    )}
                    animate={isActive ? { y: [-2, 0] } : {}}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    {item.label}
                  </motion.span>
                </Link>
              </motion.div>
            );
          }
          
          return (
            <motion.div
              key={item.href}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                delay: index * 0.05,
                type: "spring",
                stiffness: 400,
                damping: 25
              }}
            >
              <Link 
                href={item.href} 
                className={cn(
                  "relative flex flex-col items-center justify-center touch-target p-2 rounded-xl transition-all duration-300 group min-h-14",
                  isActive && "mobile-nav-active-bg"
                )} 
                data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                data-active={isActive ? "true" : undefined}
                aria-current={isActive ? "page" : undefined}
              >
                <AnimatePresence>
                  {isActive && (
                    <motion.div 
                      layoutId="mobile-nav-indicator"
                      className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(0,212,255,0.9)]"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </AnimatePresence>
                
                <motion.div 
                  className={cn(
                    "relative p-2 rounded-xl transition-colors duration-300 flex-shrink-0",
                    isActive 
                      ? "text-cyan-300 drop-shadow-[0_0_12px_rgba(0,212,255,0.8)]" 
                      : "text-muted-foreground group-hover:text-cyan-300 group-hover:drop-shadow-[0_0_8px_rgba(0,212,255,0.5)]"
                  )}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.85 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                >
                  <Icon className="w-5 h-5" />
                </motion.div>
                
                <motion.span 
                  className={cn(
                    "text-[9px] font-medium uppercase tracking-wider transition-colors duration-300",
                    isActive 
                      ? "text-cyan-400 font-semibold" 
                      : "text-muted-foreground/80 group-hover:text-cyan-300/80"
                  )}
                  initial={false}
                  animate={{ y: isActive ? -1 : 0, color: isActive ? 'rgb(34, 211, 238)' : 'inherit' }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  {item.label}
                </motion.span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
