import { Link, useLocation } from "wouter";
import { useState } from "react";
import { 
  LayoutDashboard, Users, PlusCircle, Activity, Trophy, Video, 
  Binoculars, ChevronDown, ChevronRight, Clipboard, ClipboardList, 
  UsersRound, CalendarCheck, Eye, Bell, Rss
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AlertsBadge } from "@/components/AlertsCenter";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  featured?: boolean;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  items: NavItem[];
  defaultOpen?: boolean;
}

export function Sidebar() {
  const [location] = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    coach: false,
  });

  const mainNavItems: NavItem[] = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/players", label: "Players", icon: Users },
    { href: "/analyze", label: "Log Game", icon: PlusCircle },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/scout", label: "Scout Mode", icon: Binoculars, featured: true },
  ];

  const coachItems: NavGroup = {
    label: "Coach Tools",
    icon: Clipboard,
    defaultOpen: false,
    items: [
      { href: "/coach/dashboard", label: "Team Overview", icon: ClipboardList },
      { href: "/coach/lineups", label: "Lineups", icon: UsersRound },
      { href: "/coach/practices", label: "Practices", icon: CalendarCheck },
      { href: "/coach/scouting", label: "Scouting", icon: Eye },
      { href: "/coach/alerts", label: "Alerts", icon: Bell },
    ],
  };

  const secondaryNavItems: NavItem[] = [
    { href: "/feed", label: "Feed", icon: Rss },
    { href: "/video", label: "Video Analysis", icon: Video },
  ];

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const isCoachActive = coachItems.items.some(item => location === item.href);

  return (
    <div className="hidden md:flex flex-col w-56 bg-card border-r border-border h-screen sticky top-0">
      <div className="p-4 flex items-center gap-2 border-b border-border/50">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
          <Activity className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold font-display text-white tracking-wider uppercase">CALIBER</h1>
        </div>
        <Link href="/coach/alerts" className="text-muted-foreground hover:text-white transition-colors" data-testid="header-alerts-badge">
          <AlertsBadge />
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {mainNavItems.map((item) => {
          const isActive = location === item.href;
          const isFeatured = item.featured;
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium",
              isActive 
                ? "bg-primary text-primary-foreground" 
                : isFeatured
                ? "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                : "text-muted-foreground hover:bg-white/5 hover:text-white"
            )} data-testid={`nav-${item.href.replace('/', '') || 'home'}`}>
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}

        <div className="pt-2">
          <button
            onClick={() => toggleGroup('coach')}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium",
              isCoachActive 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-white/5 hover:text-white"
            )}
            data-testid="nav-coach-toggle"
          >
            <coachItems.icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left truncate">{coachItems.label}</span>
            {expandedGroups.coach ? (
              <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            )}
          </button>
          
          {expandedGroups.coach && (
            <div className="ml-4 mt-1 space-y-0.5 border-l border-border/50 pl-2">
              {coachItems.items.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href} className={cn(
                    "flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-all duration-200 text-sm",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-white/5 hover:text-white"
                  )} data-testid={`nav-${item.href.replace(/\//g, '-').slice(1)}`}>
                    <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-border/30 mt-2">
          {secondaryNavItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )} data-testid={`nav-${item.href.replace('/', '') || 'home'}`}>
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function MobileNav() {
  const [location] = useLocation();
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 pb-safe">
      <div className="flex justify-around items-center h-14">
        <Link href="/" className={cn("flex flex-col items-center gap-0.5 p-2", location === "/" ? "text-primary" : "text-muted-foreground")}>
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link href="/players" className={cn("flex flex-col items-center gap-0.5 p-2", location === "/players" ? "text-primary" : "text-muted-foreground")}>
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-medium">Players</span>
        </Link>
        <Link href="/analyze" className={cn("flex flex-col items-center gap-0.5 p-2", location === "/analyze" ? "text-primary" : "text-muted-foreground")}>
          <div className="bg-primary text-primary-foreground rounded-full p-2 -mt-4 shadow-lg border-2 border-background">
            <PlusCircle className="w-5 h-5" />
          </div>
        </Link>
        <Link href="/leaderboard" className={cn("flex flex-col items-center gap-0.5 p-2", location === "/leaderboard" ? "text-primary" : "text-muted-foreground")}>
          <Trophy className="w-5 h-5" />
          <span className="text-[10px] font-medium">Ranks</span>
        </Link>
        <Link href="/scout" className={cn("flex flex-col items-center gap-0.5 p-2", location === "/scout" ? "text-amber-400" : "text-amber-400/60")} data-testid="mobile-nav-scout">
          <Binoculars className="w-5 h-5" />
          <span className="text-[10px] font-medium">Scout</span>
        </Link>
      </div>
    </div>
  );
}
