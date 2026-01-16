import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar, MobileNav } from "@/components/Sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

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
import ScoutMode from "./pages/ScoutMode";
import Challenges from "./pages/Challenges";
import Teams from "./pages/Teams";
import Newsfeed from "./pages/Newsfeed";
import CommunityContent from "./pages/CommunityContent";
import Stories from "./pages/Stories";
import TeamDashboard from "./pages/TeamDashboard";
import LineupAnalysis from "./pages/LineupAnalysis";
import PracticeTracker from "./pages/PracticeTracker";
import OpponentScouting from "./pages/OpponentScouting";
import CoachAlertsPage from "./pages/CoachAlertsPage";
import Pricing from "./pages/Pricing";
import Admin from "./pages/Admin";
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

function MainRouter() {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const { data: extendedUser, isLoading: userLoading } = useExtendedUser();
  
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
  
  // Not authenticated - show landing page
  if (!authUser) {
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
    <div className="flex min-h-screen bg-background text-foreground font-body selection:bg-primary/30">
      <Sidebar userRole={extendedUser.role} playerId={extendedUser.playerId} />
      <main className="flex-1 p-4 pb-20 md:p-8 md:pb-8 w-full max-w-[1600px] mx-auto overflow-x-hidden">
        <Switch>
          <Route path="/" component={Dashboard} />
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
          <Route path="/scout" component={ScoutMode} />
          <Route path="/analyze" component={AnalyzeGame} />
          <Route path="/coach/dashboard" component={TeamDashboard} />
          <Route path="/coach/lineups" component={LineupAnalysis} />
          <Route path="/coach/practices" component={PracticeTracker} />
          <Route path="/coach/scouting" component={OpponentScouting} />
          <Route path="/coach/alerts" component={CoachAlertsPage} />
          <Route path="/pricing" component={Pricing} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <MobileNav userRole={extendedUser.role} />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Switch>
          <Route path="/admin" component={Admin} />
          <Route>
            <MainRouter />
          </Route>
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
