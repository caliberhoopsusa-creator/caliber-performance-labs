import { Switch, Route, Redirect, useLocation, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { InstallPrompt } from "@/components/InstallPrompt";
import { Sidebar, MobileNav } from "@/components/Sidebar";
import { MobileDrawer } from "@/components/MobileDrawer";
import { NotificationBell } from "@/components/NotificationBell";
import { OfflineBanner, OfflineIndicator } from "@/components/OfflineBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OnboardingTour } from "@/components/OnboardingTour";
import { GuidedOnboarding } from "@/components/GuidedOnboarding";
import { SportProvider } from "@/components/SportToggle";
import { PageTransition } from "@/components/PageTransition";
import { useAuth } from "@/hooks/use-auth";
import { useOffline } from "@/hooks/use-offline";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronLeft } from "lucide-react";
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
import Discover from "./pages/Discover";
import ScoutHub from "./pages/ScoutHub";
import Challenges from "./pages/Challenges";
import Teams from "./pages/Teams";
import Newsfeed from "./pages/Newsfeed";
import CommunityContent from "./pages/CommunityContent";
import Stories from "./pages/Stories";
import TeamDashboard from "./pages/TeamDashboard";
import TeamHub from "./pages/TeamHub";
import LineupAnalysis from "./pages/LineupAnalysis";
import PracticeTracker from "./pages/PracticeTracker";
import OpponentScouting from "./pages/OpponentScouting";
import CoachAlertsPage from "./pages/CoachAlertsPage";
import Pricing from "./pages/Pricing";
import Admin from "./pages/Admin";
import WorkoutTracker from "./pages/WorkoutTracker";
import ScheduleCalendar from "./pages/ScheduleCalendar";
import HighlightClipsPage from "./pages/HighlightClipsPage";
import ReelPage from "./pages/ReelPage";
import TeamComparison from "./pages/TeamComparison";
import ReportCardPage from "./pages/ReportCardPage";
import SocialHub from "./pages/SocialHub";
import Shop from "./pages/Shop";
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
            <MobileDrawer userRole={extendedUser.role} playerId={extendedUser.playerId} />
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
                <Route path="/challenges" component={Challenges} />
                <Route path="/teams" component={Teams} />
                <Route path="/feed" component={Newsfeed} />
                <Route path="/community" component={CommunityContent} />
                <Route path="/stories" component={Stories} />
                <Route path="/leaderboard" component={Leaderboard} />
                <Route path="/compare" component={ComparePlayers} />
                <Route path="/video" component={VideoAnalysis} />
                <Route path="/grading" component={GradingSystem} />
                <Route path="/discover" component={Discover} />
                <Route path="/scout" component={ScoutHub} />
                <Route path="/analyze" component={AnalyzeGame} />
                <Route path="/coach/dashboard" component={TeamDashboard} />
                <Route path="/coach/hub" component={TeamHub} />
                <Route path="/coach/lineups" component={LineupAnalysis} />
                <Route path="/coach/practices" component={PracticeTracker} />
                <Route path="/coach/scouting" component={OpponentScouting} />
                <Route path="/coach/alerts" component={CoachAlertsPage} />
                <Route path="/pricing" component={Pricing} />
                <Route path="/workouts" component={WorkoutTracker} />
                <Route path="/schedule" component={ScheduleCalendar} />
                <Route path="/highlights" component={HighlightClipsPage} />
                <Route path="/reels/:playerId" component={ReelPage} />
                <Route path="/team-comparison" component={TeamComparison} />
                <Route path="/report-card" component={ReportCardPage} />
                <Route path="/social-hub" component={SocialHub} />
                <Route path="/shop" component={Shop} />
                <Route component={NotFound} />
              </Switch>
            </PageTransition>
          </main>
        </div>
        <MobileNav userRole={extendedUser.role} playerId={extendedUser.playerId} />
      </div>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SportProvider>
            <Toaster />
            <InstallPrompt />
            <Switch>
              <Route path="/admin" component={Admin} />
              <Route>
                <MainRouter />
              </Route>
            </Switch>
          </SportProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
