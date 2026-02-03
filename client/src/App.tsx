import { Switch, Route, Redirect, useLocation, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { InstallPrompt } from "@/components/InstallPrompt";
import { Sidebar, MobileNav } from "@/components/Sidebar";
import { MobileDrawer } from "@/components/MobileDrawer";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { NotificationBell } from "@/components/NotificationBell";
import { OfflineBanner, OfflineIndicator } from "@/components/OfflineBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OnboardingTour } from "@/components/OnboardingTour";
import { GuidedOnboarding } from "@/components/GuidedOnboarding";
import { SportProvider } from "@/components/SportToggle";
import { PageTransition } from "@/components/PageTransition";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { EquippedItemsProvider } from "@/contexts/EquippedItemsContext";
import { useAuth } from "@/hooks/use-auth";
import { useOffline } from "@/hooks/use-offline";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronLeft, Coins, Package } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Pages
import Landing from "./pages/Landing";
import RoleSelection from "./pages/RoleSelection";
import Dashboard from "./pages/Dashboard";
import PlayersList from "./pages/PlayersList";
import PlayerDetail from "./pages/PlayerDetail";
import PlayerCard from "./pages/PlayerCard";
import AnalyzeGame from "./pages/AnalyzeGame";
import Leaderboard from "./pages/Leaderboard";
import ComparePlayers from "./pages/ComparePlayers";
import GradingSystem from "./pages/GradingSystem";
import VideoAnalysis from "./pages/VideoAnalysis";
import ScoutHub from "./pages/ScoutHub";
import Challenges from "./pages/Challenges";
import Teams from "./pages/Teams";
import CommunityHub from "./pages/CommunityHub";
import CoachHub from "./pages/CoachHub";
import Pricing from "./pages/Pricing";
import Admin from "./pages/Admin";
import PerformanceHub from "./pages/PerformanceHub";
import ScheduleCalendar from "./pages/ScheduleCalendar";
import HighlightClipsPage from "./pages/HighlightClipsPage";
import Highlights from "./pages/Highlights";
import ReelPage from "./pages/ReelPage";
import TeamComparison from "./pages/TeamComparison";
import ReportCardPage from "./pages/ReportCardPage";
import AnalyticsHub from "./pages/AnalyticsHub";
import Shop from "./pages/Shop";
import LeagueHub from "./pages/LeagueHub";
import LeagueDetail from "./pages/LeagueDetail";
import RecruitingHub from "./pages/RecruitingHub";
import PublicPlayerProfile from "./pages/PublicPlayerProfile";
import NotFound from "./pages/not-found";

interface ExtendedUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: string | null;
  playerId: number | null;
  playerProfile?: {
    id: number;
    name: string;
    position: string;
  } | null;
}

function useExtendedUser() {
  return useQuery<ExtendedUser | null>({
    queryKey: ['/api/users/me'],
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
}

function SyncHandler() {
  const { isSyncing } = useOffline();
  const { toast } = useToast();
  const prevSyncingRef = useRef<boolean>(false);

  useEffect(() => {
    if (prevSyncingRef.current && !isSyncing) {
      toast({
        title: "Synced",
        description: "Your offline changes have been synced.",
      });
    }
    prevSyncingRef.current = isSyncing || false;
  }, [isSyncing, toast]);

  return null;
}

function SessionExpiryHandler() {
  const { isSessionExpired, isNetworkError, errorMessage, errorType } = useAuth();
  const { toast } = useToast();
  const hasNotifiedRef = useRef<boolean>(false);

  useEffect(() => {
    if (isSessionExpired && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true;
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      });
      // Redirect to login after showing the toast
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
  }, [isSessionExpired, toast]);

  useEffect(() => {
    if (isNetworkError && !hasNotifiedRef.current && errorType === 'network_error') {
      toast({
        title: "Network Error",
        description: "Unable to connect to the server. Please check your internet connection.",
        variant: "destructive",
      });
    }
  }, [isNetworkError, errorType, toast]);

  return null;
}

function HeaderCoinDisplay() {
  const { data: userMe } = useQuery<{ playerId: number | null; coinBalance: number }>({
    queryKey: ["/api/users/me"],
    staleTime: 30000,
  });

  const coinBalance = userMe?.coinBalance ?? 0;
  const playerId = userMe?.playerId;

  return (
    <div className="flex items-center gap-2">
      <Link href="/shop">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
          data-testid="header-coin-display"
        >
          <Coins className="w-4 h-4" />
          <span className="font-medium">{coinBalance.toLocaleString()}</span>
        </Button>
      </Link>
      {playerId && (
        <Link href={`/players/${playerId}?tab=inventory`}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-primary"
            data-testid="header-inventory-btn"
            title="My Inventory"
          >
            <Package className="w-4 h-4" />
          </Button>
        </Link>
      )}
    </div>
  );
}

function PublicPricing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(220,25%,6%)] via-[hsl(220,20%,5%)] to-[hsl(220,25%,4%)] text-white">
      <div className="absolute inset-0 cyber-grid pointer-events-none opacity-30" />
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[hsl(220,25%,6%)]/80 border-b border-cyan-500/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white/70" data-testid="button-back-home">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="font-display text-xl font-bold tracking-tight text-gradient-primary">CALIBER</h1>
          <div className="w-20" />
        </div>
      </header>
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <Pricing />
      </main>
    </div>
  );
}

function MainRouter() {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const { data: extendedUser, isLoading: userLoading } = useExtendedUser();
  const [location] = useLocation();
  
  const isLoading = authLoading || (authUser && userLoading);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Not authenticated - allow access to pricing, otherwise show landing page
  if (!authUser) {
    if (location === "/pricing") {
      return <PublicPricing />;
    }
    return <Landing />;
  }
  
  // Authenticated but no role selected - show role selection
  if (!extendedUser?.role) {
    return <RoleSelection />;
  }
  
  // Player without profile - show role selection to create profile
  if (extendedUser.role === 'player' && !extendedUser.playerId) {
    return <RoleSelection />;
  }
  
  // Fully authenticated with role - show main app
  return (
    <>
      <OnboardingTour />
      <GuidedOnboarding />
      <SyncHandler />
      <SessionExpiryHandler />
      <OfflineBanner />
      <div className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-background text-foreground font-body selection:bg-primary/30">
        <Sidebar userRole={extendedUser.role} playerId={extendedUser.playerId} />
        <div className="flex-1 flex flex-col min-w-0 relative bg-gradient-to-b from-[hsl(220,25%,6%)] via-[hsl(220,20%,5%)] to-[hsl(220,25%,4%)]">
          <div className="absolute inset-0 cyber-grid pointer-events-none opacity-50" />
          <div className="absolute inset-0 scan-lines pointer-events-none opacity-20" />
          <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-gradient-radial from-cyan-500/[0.04] to-transparent rounded-full blur-[180px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-gradient-radial from-blue-500/[0.03] to-transparent rounded-full blur-[150px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-radial from-cyan-500/[0.02] to-transparent rounded-full pointer-events-none" />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent pointer-events-none" />
          <header className="mobile-header-blur md:static md:backdrop-blur-none md:bg-transparent relative z-10 flex items-center justify-between gap-4 p-4 md:px-8 border-b border-cyan-500/[0.08] md:backdrop-blur-2xl md:bg-gradient-to-r from-[hsl(220,25%,8%)]/80 via-[hsl(220,20%,6%)]/60 to-[hsl(220,25%,8%)]/80">
            <div className="flex items-center gap-3">
              <MobileDrawer userRole={extendedUser.role} playerId={extendedUser.playerId} />
              <HeaderCoinDisplay />
            </div>
            <div className="flex items-center gap-3">
              <OfflineIndicator />
              <NotificationBell />
            </div>
          </header>
          <main className="relative z-10 flex-1 p-4 pb-20 md:px-8 md:pb-8 w-full max-w-[1600px] mx-auto overflow-x-hidden">
            <PageTransition>
              <Switch>
                <Route path="/">
                  {extendedUser.role === 'player' && extendedUser.playerId ? (
                    <Redirect to={`/players/${extendedUser.playerId}`} />
                  ) : (
                    <Dashboard />
                  )}
                </Route>
                <Route path="/players" component={PlayersList} />
                <Route path="/players/:id/card" component={PlayerCard} />
                <Route path="/players/:id" component={PlayerDetail} />
                <Route path="/analytics" component={AnalyticsHub} />
                <Route path="/challenges">
                  <Redirect to="/analytics?tab=challenges" />
                </Route>
                <Route path="/teams" component={Teams} />
                <Route path="/community" component={CommunityHub} />
                <Route path="/feed">
                  <Redirect to="/community?tab=feed" />
                </Route>
                <Route path="/newsfeed">
                  <Redirect to="/community?tab=feed" />
                </Route>
                <Route path="/stories">
                  <Redirect to="/community?tab=stories" />
                </Route>
                <Route path="/leaderboard">
                  <Redirect to="/analytics?tab=leaderboard" />
                </Route>
                <Route path="/compare">
                  <Redirect to="/analytics?tab=compare" />
                </Route>
                <Route path="/video" component={VideoAnalysis} />
                <Route path="/grading">
                  <Redirect to="/analytics?tab=grading" />
                </Route>
                                <Route path="/scout" component={ScoutHub} />
                <Route path="/analyze" component={AnalyzeGame} />
                <Route path="/coach" component={CoachHub} />
                <Route path="/coach/dashboard">
                  <Redirect to="/coach?tab=dashboard" />
                </Route>
                <Route path="/coach/hub">
                  <Redirect to="/coach?tab=dashboard" />
                </Route>
                <Route path="/coach/verify">
                  <Redirect to="/coach?tab=verify" />
                </Route>
                <Route path="/coach/endorsements">
                  <Redirect to="/coach?tab=endorse" />
                </Route>
                <Route path="/coach/practices">
                  <Redirect to="/coach?tab=practices" />
                </Route>
                <Route path="/coach/lineups">
                  <Redirect to="/coach?tab=lineups" />
                </Route>
                <Route path="/coach/scouting">
                  <Redirect to="/coach?tab=scouting" />
                </Route>
                <Route path="/coach/alerts">
                  <Redirect to="/coach?tab=alerts" />
                </Route>
                <Route path="/pricing" component={Pricing} />
                <Route path="/performance" component={PerformanceHub} />
                <Route path="/workouts">
                  <Redirect to="/performance?tab=workouts" />
                </Route>
                <Route path="/schedule" component={ScheduleCalendar} />
                <Route path="/highlights" component={Highlights} />
                <Route path="/reels/:playerId" component={ReelPage} />
                <Route path="/team-comparison">
                  <Redirect to="/analytics?tab=teams" />
                </Route>
                <Route path="/report-card" component={ReportCardPage} />
                <Route path="/social-hub">
                  <Redirect to="/community?tab=connect" />
                </Route>
                <Route path="/shop" component={Shop} />
                <Route path="/leagues" component={LeagueHub} />
                <Route path="/leagues/:id" component={LeagueDetail} />
                <Route path="/recruiting" component={RecruitingHub} />
                <Route path="/college-recruiting">
                  <Redirect to="/recruiting?tab=schools" />
                </Route>
                <Route path="/camps-showcases">
                  <Redirect to="/recruiting?tab=events" />
                </Route>
                <Route path="/fitness">
                  <Redirect to="/performance?tab=fitness" />
                </Route>
                <Route component={NotFound} />
              </Switch>
            </PageTransition>
          </main>
        </div>
        <MobileNav userRole={extendedUser.role} playerId={extendedUser.playerId} />
        <FloatingActionButton userRole={extendedUser.role} playerId={extendedUser.playerId} />
      </div>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ThemeProvider>
            <EquippedItemsProvider>
              <SportProvider>
                <Toaster />
                <InstallPrompt />
                <Switch>
                <Route path="/admin" component={Admin} />
                <Route path="/profile/:id/public" component={PublicPlayerProfile} />
                <Route>
                  <MainRouter />
                </Route>
              </Switch>
              </SportProvider>
            </EquippedItemsProvider>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
