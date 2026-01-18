import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Menu, LayoutDashboard, Users, PlusCircle, Activity, Trophy, Calculator, Video, 
  Binoculars, Target, MessageSquare, BarChart3, Rss, Camera, ClipboardList, 
  UsersRound, CalendarCheck, Eye, UserCircle, LogOut, CreditCard, Lock, Dumbbell, 
  Gamepad2, CalendarDays, Crosshair, Film, FileText, ArrowLeftRight, UserPlus
} from "lucide-react";
import caliberLogo from "@assets/Gemini_Generated_Image_3ld7js3ld7js3ld7_(1)_1768700977754.png";
import { cn } from "@/lib/utils";
import { useSubscription, type SubscriptionTier } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

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
      title: "My Profile",
      items: [
        { href: playerId ? `/players/${playerId}` : "/", label: "My Stats", icon: UserCircle },
        { href: "/live-game", label: "Live Game", icon: Gamepad2, featured: true },
        { href: "/analyze", label: "Log Game", icon: PlusCircle },
        { href: "/workouts", label: "Workouts", icon: Dumbbell },
        { href: "/schedule", label: "Schedule", icon: CalendarDays },
        { href: "/video", label: "Video Analysis", icon: Video },
        { href: "/highlights", label: "Highlights", icon: Film },
      ],
    },
    {
      title: "Discover",
      items: [
        { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
        { href: "/compare", label: "Head-to-Head", icon: Activity },
        { href: "/grading", label: "Grading System", icon: Calculator },
        { href: "/pricing", label: "Pricing", icon: CreditCard },
      ],
    },
    {
      title: "Community",
      items: [
        { href: "/feed", label: "Newsfeed", icon: Rss },
        { href: "/social", label: "Social Hub", icon: UserPlus },
        { href: "/stories", label: "Stories", icon: Camera },
        { href: "/teams", label: "Teams", icon: MessageSquare },
        { href: "/community", label: "Highlights", icon: BarChart3 },
        { href: "/challenges", label: "Challenges", icon: Target, premium: "pro" },
      ],
    },
  ];

  const coachSections: NavSection[] = [
    {
      title: "Main",
      items: [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/players", label: "Players", icon: Users },
        { href: "/live-game", label: "Live Game", icon: Gamepad2, featured: true },
        { href: "/analyze", label: "New Analysis", icon: PlusCircle },
        { href: "/workouts", label: "Workouts", icon: Dumbbell },
        { href: "/schedule", label: "Schedule", icon: CalendarDays },
        { href: "/pricing", label: "Pricing", icon: CreditCard },
      ],
    },
    {
      title: "Player Tools",
      items: [
        { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
        { href: "/compare", label: "Head-to-Head", icon: Activity },
        { href: "/video", label: "Video Analysis", icon: Video },
        { href: "/highlights", label: "Highlights", icon: Film },
        { href: "/grading", label: "Grading System", icon: Calculator },
      ],
    },
    {
      title: "Community",
      items: [
        { href: "/feed", label: "Newsfeed", icon: Rss },
        { href: "/social", label: "Social Hub", icon: UserPlus },
        { href: "/stories", label: "Stories", icon: Camera },
        { href: "/teams", label: "Teams", icon: MessageSquare },
        { href: "/community", label: "Highlights", icon: BarChart3 },
        { href: "/challenges", label: "Challenges", icon: Target, premium: "pro" },
      ],
    },
    {
      title: "Coach Tools",
      items: [
        { href: "/coach/dashboard", label: "Team Dashboard", icon: ClipboardList, premium: "coach_pro" },
        { href: "/coach/lineups", label: "Lineup Analysis", icon: UsersRound, premium: "coach_pro" },
        { href: "/coach/practices", label: "Practice Tracker", icon: CalendarCheck, premium: "coach_pro" },
        { href: "/coach/scouting", label: "Opponent Scouting", icon: Eye, premium: "coach_pro" },
        { href: "/coach/alerts", label: "Trend Alerts", icon: Activity, premium: "coach_pro" },
        { href: "/report-card", label: "Report Cards", icon: FileText, premium: "pro" },
        { href: "/team-comparison", label: "Team Comparison", icon: ArrowLeftRight, premium: "coach_pro" },
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
      <SheetContent side="left" className="w-[280px] p-0 bg-card border-r border-white/10">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SheetDescription className="sr-only">Access all app features from this menu</SheetDescription>
        
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <img src={caliberLogo} alt="Caliber" className="w-10 h-10 rounded-lg" />
              <div>
                <h2 className="font-display font-bold text-white text-lg">Caliber</h2>
                <p className="text-xs text-muted-foreground capitalize">{userRole} Mode</p>
              </div>
            </div>
          </div>

          <div className="p-3 border-b border-white/10">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRoleSwitch}
              disabled={isSwitchingRole}
              className="w-full text-xs border-white/20 bg-white/5"
              data-testid="button-mobile-role-switch"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 mr-2" />
              Switch to {isPlayer ? 'Coach' : 'Player'} Mode
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <nav className="p-3 space-y-4">
              {sections.map((section) => (
                <div key={section.title}>
                  <h3 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider px-2 mb-2">
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
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium",
                            isActive 
                              ? "bg-primary text-primary-foreground" 
                              : isFeatured
                              ? "text-primary bg-primary/10 border border-primary/30"
                              : needsUpgrade
                              ? "text-amber-400 bg-gradient-to-r from-amber-500/10 to-orange-500/10"
                              : "text-muted-foreground active:bg-white/10"
                          )}
                          data-testid={`mobile-drawer-${item.href.replace(/\//g, '-').replace(/^-/, '') || 'home'}`}
                        >
                          <item.icon className={cn("w-4 h-4", isActive && "stroke-[2.5px]")} />
                          <span className="flex-1">{item.label}</span>
                          {isFeatured && (
                            <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-bold uppercase">
                              LIVE
                            </span>
                          )}
                          {needsUpgrade && (
                            <Lock className="w-3 h-3 text-amber-400" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </ScrollArea>

          <div className="p-3 border-t border-white/10">
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
