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
import { SportProvider } from "@/components/SportToggle";
import { PageTransition } from "@/components/PageTransition";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { EquippedItemsProvider } from "@/contexts/EquippedItemsContext";
import { CelebrationProvider } from "@/components/CelebrationOverlay";
import { XPNotificationProvider } from "@/components/XPToast";
import { useAuth } from "@/hooks/use-auth";
import { useOffline } from "@/hooks/use-offline";
import { useToast } from "@/hooks/use-toast";
import { CaliberLogo } from "@/components/CaliberLogo";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { StatsTicker } from "@/components/StatsTicker";
import { Loader2, ChevronLeft, Coins, Package, Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Pages
import ModernLandingPage from "./pages/ModernLandingPage";
import PricingPage from "./pages/PricingPage";
import BlogPage from "./pages/BlogPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import Login from "./pages/Login";
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
import ReelGenerator from "./pages/ReelGenerator";
import TeamComparison from "./pages/TeamComparison";
import ReportCardPage from "./pages/ReportCardPage";
import AnalyticsHub from "./pages/AnalyticsHub";
import LeagueHub from "./pages/LeagueHub";
import LeagueDetail from "./pages/LeagueDetail";
import RecruitingHub from "./pages/RecruitingHub";
import PublicPlayerProfile from "./pages/PublicPlayerProfile";
import PublicRecruitProfile from "./pages/PublicRecruitProfile";
import PlayerDirectory from "./pages/PlayerDirectory";
import DiscoverHighlights from "./pages/DiscoverHighlights";
import ChallengePage from "./pages/ChallengePage";
import JoinPage from "./pages/JoinPage";
import RecruiterDashboard from "@/pages/RecruiterDashboard";
import RecruiterDirectory from "@/pages/RecruiterDirectory";
import WhosWatching from "@/pages/WhosWatching";
import CollegeDetail from "@/pages/CollegeDetail";
import GuardianDashboard from "./pages/GuardianDashboard";
import DebugPage from "./pages/DebugPage";
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
      <div className="flex items-center gap-2 text-yellow-400 px-2 py-1" data-testid="header-coin-display">
        <Coins className="w-4 h-4" />
        <span className="font-medium">{coinBalance.toLocaleString()}</span>
      </div>
      {playerId && (
        <Link href={`/players/${playerId}?tab=inventory`}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-accent"
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

function EmailVerificationBanner({ user }: { user: any }) {
  const [dismissed, setDismissed] = useState(false);
  const { toast } = useToast();

  const verifyMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/auth/verify-email', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({ title: "Email verified", description: "Your account is now verified." });
      setDismissed(true);
    },
  });

  if (dismissed || user?.emailVerified !== false) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2 text-amber-400">
        <Mail className="w-4 h-4 shrink-0" />
        <span>Please verify your email address to unlock all features.</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
          onClick={() => verifyMutation.mutate()}
          disabled={verifyMutation.isPending}
        >
          Verify now
        </Button>
        <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-white text-xs">✕</button>
      </div>
    </div>
  );
}

function AuthenticatedLogo() {
  const { accentColor } = useTheme();

  return (
    <Link href="/">
      <div className="flex items-center gap-2">
        <CaliberLogo size={38} color={accentColor} />
        <span className="hidden md:block text-xl font-bold font-display tracking-wider uppercase" style={{ color: accentColor }}>CALIBER</span>
      </div>
    </Link>
  );
}

function MainRouter() {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const { data: extendedUser, isLoading: userLoading, isError: userError, refetch: refetchUser } = useExtendedUser();
  const [location] = useLocation();
  
  // Show loading state during initial auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Not authenticated - public routes
  if (!authUser) {
    if (location === "/pricing") {
      return <PricingPage />;
    }
    if (location === "/blog" || location.startsWith("/blog/")) {
      return <BlogPage />;
    }
    if (location === "/privacy") {
      return <PrivacyPage />;
    }
    if (location === "/terms") {
      return <TermsPage />;
    }
    if (location === "/login" || location === "/register") {
      return <Login />;
    }
    return <ModernLandingPage />;
  }
  
  // New user with no role - show role selection immediately (don't wait for extended user)
  if (!authUser.role) {
    return <RoleSelection />;
  }
  
  // User has a role but extended user is still loading - show loading
  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }
  
  // If extended user failed to load but we have auth data, fall back to auth user
  const resolvedUser: ExtendedUser = extendedUser ?? {
    id: authUser.id,
    email: authUser.email ?? null,
    firstName: authUser.firstName ?? null,
    lastName: authUser.lastName ?? null,
    profileImageUrl: authUser.profileImageUrl ?? null,
    role: authUser.role ?? null,
    playerId: (authUser as any).playerId ?? null,
    playerProfile: null,
  };

  if (!resolvedUser.role) {
    return <RoleSelection />;
  }
  
  // Player without player profile - show role selection to create profile
  if (resolvedUser.role === 'player' && !resolvedUser.playerId) {
    return <RoleSelection />;
  }
  
  // Fully authenticated with role - show main app
  return (
    <>
      <OnboardingTour />
      <SyncHandler />
      <SessionExpiryHandler />
      <OfflineBanner />
      <div className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-background text-foreground font-body selection:bg-primary/30">
        <Sidebar userRole={resolvedUser.role!} playerId={resolvedUser.playerId} />
        <div className="flex-1 flex flex-col min-w-0 relative bg-background">
          <header className="mobile-header-blur md:static md:backdrop-blur-none md:bg-transparent relative z-10 flex items-center justify-between gap-2 px-3 py-2 md:p-4 md:px-8 border-b border-border overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-accent/8 via-transparent to-transparent pointer-events-none" />
            <div className="relative z-[1] flex items-center gap-2 overflow-visible">
              <MobileDrawer userRole={resolvedUser.role!} playerId={resolvedUser.playerId} />
              <AuthenticatedLogo />
              <HeaderCoinDisplay />
            </div>
            <div className="flex items-center gap-2 overflow-visible">
              <OfflineIndicator />
              <DarkModeToggle />
              <NotificationBell />
            </div>
          </header>
          <StatsTicker />
          <EmailVerificationBanner user={authUser} />
          <main className="relative z-10 flex-1 p-4 pb-24 md:px-8 md:pb-8 w-full max-w-[1600px] mx-auto overflow-x-hidden overflow-y-auto">
            <PageTransition>
              <Switch>
                <Route path="/">
                  {resolvedUser.role === 'player' && resolvedUser.playerId ? (
                    <Redirect to="/community?tab=feed" />
                  ) : resolvedUser.role === 'recruiter' ? (
                    <Redirect to="/recruiter" />
                  ) : resolvedUser.role === 'guardian' ? (
                    <Redirect to="/family" />
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
                <Route path="/privacy" component={PrivacyPage} />
                <Route path="/terms" component={TermsPage} />
                <Route path="/performance" component={PerformanceHub} />
                <Route path="/workouts">
                  <Redirect to="/performance?tab=workouts" />
                </Route>
                <Route path="/schedule" component={ScheduleCalendar} />
                <Route path="/highlights" component={Highlights} />
                <Route path="/discover/highlights" component={DiscoverHighlights} />
                <Route path="/reel-builder" component={ReelGenerator} />
                <Route path="/reels/:playerId" component={ReelPage} />
                <Route path="/team-comparison">
                  <Redirect to="/analytics?tab=teams" />
                </Route>
                <Route path="/report-card" component={ReportCardPage} />
                <Route path="/social-hub">
                  <Redirect to="/community?tab=connect" />
                </Route>
                <Route path="/leagues" component={LeagueHub} />
                <Route path="/leagues/:id" component={LeagueDetail} />
                <Route path="/recruiter" component={RecruiterDashboard} />
                <Route path="/recruiter-directory" component={RecruiterDirectory} />
                <Route path="/whos-watching" component={WhosWatching} />
                <Route path="/recruiting" component={RecruitingHub} />
                <Route path="/college-recruiting">
                  <Redirect to="/recruiting?tab=schools" />
                </Route>
                <Route path="/camps-showcases">
                  <Redirect to="/recruiting?tab=events" />
                </Route>
                <Route path="/colleges/:id" component={CollegeDetail} />
                <Route path="/family" component={GuardianDashboard} />
                <Route path="/debug" component={DebugPage} />
                <Route component={NotFound} />
              </Switch>
            </PageTransition>
          </main>
        </div>
        <MobileNav userRole={resolvedUser.role!} playerId={resolvedUser.playerId} />
        <FloatingActionButton userRole={resolvedUser.role!} playerId={resolvedUser.playerId} />
      </div>
    </>
  );
}

function App() {
  useEffect(() => {
    const stored = localStorage.getItem("caliber-theme");
    if (stored === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ThemeProvider>
            <EquippedItemsProvider>
              <SportProvider>
                <CelebrationProvider>
                  <XPNotificationProvider>
                    <Toaster />
                    <InstallPrompt />
                    <Switch>
                    <Route path="/admin" component={Admin} />
                    <Route path="/profile/:id/public" component={PublicPlayerProfile} />
                    <Route path="/recruit/:id" component={PublicRecruitProfile} />
                    <Route path="/discover/players" component={PlayerDirectory} />
                    <Route path="/challenge/:code" component={ChallengePage} />
                    <Route path="/join/:code" component={JoinPage} />
                    <Route>
                      <MainRouter />
                    </Route>
                  </Switch>
                  </XPNotificationProvider>
                </CelebrationProvider>
              </SportProvider>
            </EquippedItemsProvider>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
