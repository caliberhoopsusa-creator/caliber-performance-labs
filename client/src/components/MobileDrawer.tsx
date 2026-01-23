import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Menu, LayoutDashboard, Users, PlusCircle, Activity, Trophy, Calculator, Video, 
  Binoculars, Target, MessageSquare, BarChart3, Rss, Camera, ClipboardList, 
  UsersRound, CalendarCheck, Eye, UserCircle, LogOut, CreditCard, Lock, Dumbbell, 
  CalendarDays, Film, FileText, ArrowLeftRight, UserPlus, Bell
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

  const sections = isPlayer ? playerSections : coachSections;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden"
          data-testid="button-mobile-menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0 bg-[hsl(var(--sidebar-background))] border-r border-white/5">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SheetDescription className="sr-only">Access all app features from this menu</SheetDescription>
        
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <img src={caliberLogo} alt="Caliber" className="w-9 h-9 rounded-lg shadow-lg shadow-black/20" />
              <div>
                <h2 className="font-display font-bold text-white text-lg uppercase tracking-wide">Caliber</h2>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{userRole} Mode</p>
              </div>
            </div>
          </div>

          <div className="p-3 border-b border-white/5 space-y-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRoleSwitch}
              disabled={isSwitchingRole}
              className="w-full text-xs border-white/10 bg-white/5"
              data-testid="button-mobile-role-switch"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 mr-2" />
              Switch to {isPlayer ? 'Coach' : 'Player'} Mode
            </Button>
            
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground/70 tracking-widest px-1">
                Sport Mode
              </span>
              <SportToggle size="sm" showLabels={true} className="w-full justify-center" />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <nav className="p-3 space-y-5">
              {sections.map((section) => (
                <div key={section.title}>
                  <h3 className="text-[10px] uppercase font-semibold text-muted-foreground/70 tracking-widest px-3 mb-1.5">
                    {section.title}
                  </h3>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const isActive = location === item.href;
                      const needsUpgrade = item.premium && !hasAccess(item.premium);
                      const isFeatured = item.featured && !isActive;
                      
                      return (
                        <Link 
                          key={item.href} 
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md transition-all text-sm font-medium",
                            isActive 
                              ? "bg-primary/15 text-primary" 
                              : isFeatured
                              ? "text-primary bg-primary/5"
                              : needsUpgrade
                              ? "text-muted-foreground"
                              : "text-muted-foreground"
                          )}
                          data-testid={`mobile-drawer-${item.href.replace(/\//g, '-').replace(/^-/, '') || 'home'}`}
                        >
                          <item.icon className={cn("w-4 h-4", isActive && "text-primary")} />
                          <span className="flex-1">{item.label}</span>
                          {isFeatured && (
                            <span className="text-[9px] bg-primary text-white px-1.5 py-0.5 rounded font-bold uppercase">
                              LIVE
                            </span>
                          )}
                          {needsUpgrade && (
                            <Lock className="w-3 h-3 text-muted-foreground/70" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </ScrollArea>

          <div className="p-3 border-t border-white/5">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground"
              asChild
            >
              <a href="/api/logout">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </a>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
