import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, PlusCircle, Activity, Trophy, Calculator, Video, Binoculars, Target, MessageSquare, BarChart3, Rss, Camera, ClipboardList, UsersRound, CalendarCheck, Eye, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { AlertsBadge } from "@/components/AlertsCenter";

type NavSection = {
  title: string;
  items: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    featured?: boolean;
  }[];
};

export function Sidebar() {
  const [location] = useLocation();

  const navSections: NavSection[] = [
    {
      title: "Main",
      items: [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/players", label: "Players", icon: Users },
        { href: "/analyze", label: "New Analysis", icon: PlusCircle },
      ],
    },
    {
      title: "Player Tools",
      items: [
        { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
        { href: "/compare", label: "Head-to-Head", icon: Activity },
        { href: "/video", label: "Video Analysis", icon: Video },
        { href: "/grading", label: "Grading System", icon: Calculator },
        { href: "/scout", label: "Scout Mode", icon: Binoculars, featured: true },
      ],
    },
    {
      title: "Community",
      items: [
        { href: "/feed", label: "Newsfeed", icon: Rss },
        { href: "/stories", label: "Stories", icon: Camera },
        { href: "/teams", label: "Teams", icon: MessageSquare },
        { href: "/community", label: "Highlights", icon: BarChart3 },
        { href: "/challenges", label: "Challenges", icon: Target },
      ],
    },
    {
      title: "Coach Tools",
      items: [
        { href: "/coach/dashboard", label: "Team Overview", icon: ClipboardList },
        { href: "/coach/lineups", label: "Lineups", icon: UsersRound },
        { href: "/coach/practices", label: "Practices", icon: CalendarCheck },
        { href: "/coach/scouting", label: "Scouting", icon: Eye },
        { href: "/coach/alerts", label: "Alerts", icon: Bell },
      ],
    },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 bg-card border-r border-border h-screen sticky top-0 overflow-y-auto">
      <div className="p-6 flex items-center gap-3 border-b border-border/50">
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
          <Activity className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold font-display text-white tracking-wider uppercase">CALIBER</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Performance Labs</p>
        </div>
        <Link href="/coach/alerts" className="text-muted-foreground hover:text-white transition-colors" data-testid="header-alerts-badge">
          <AlertsBadge />
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-6">
        {navSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-4">{section.title}</h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = location === item.href;
                const isFeatured = item.featured;
                return (
                  <Link key={item.href} href={item.href} className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group font-medium text-sm",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                      : isFeatured
                      ? "text-amber-400 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:from-amber-500/20 hover:to-orange-500/20"
                      : "text-muted-foreground hover:bg-white/5 hover:text-white"
                  )} data-testid={`nav-${item.href.replace(/\//g, '-').replace(/^-/, '') || 'home'}`}>
                    <item.icon className={cn("w-4 h-4", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                    {item.label}
                    {isFeatured && !isActive && (
                      <span className="ml-auto text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Pro</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}

export function MobileNav() {
  const [location] = useLocation();
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 pb-safe">
      <div className="flex justify-around items-center h-16">
        <Link href="/" className={cn("flex flex-col items-center gap-1 p-2", location === "/" ? "text-primary" : "text-muted-foreground")} data-testid="mobile-nav-home">
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase">Home</span>
        </Link>
        <Link href="/players" className={cn("flex flex-col items-center gap-1 p-2", location === "/players" ? "text-primary" : "text-muted-foreground")} data-testid="mobile-nav-players">
          <Users className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase">Roster</span>
        </Link>
        <Link href="/analyze" className={cn("flex flex-col items-center gap-1 p-2", location === "/analyze" ? "text-primary" : "text-muted-foreground")} data-testid="mobile-nav-analyze">
          <div className="bg-primary text-primary-foreground rounded-full p-2 -mt-6 shadow-lg border-4 border-background">
            <PlusCircle className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-medium uppercase mt-1">Add</span>
        </Link>
        <Link href="/coach/dashboard" className={cn("flex flex-col items-center gap-1 p-2", location.startsWith("/coach") ? "text-primary" : "text-muted-foreground")} data-testid="mobile-nav-coach">
          <ClipboardList className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase">Coach</span>
        </Link>
      </div>
    </div>
  );
}
