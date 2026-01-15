import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar, MobileNav } from "@/components/Sidebar";

// Pages
import Dashboard from "./pages/Dashboard";
import PlayersList from "./pages/PlayersList";
import PlayerDetail from "./pages/PlayerDetail";
import AnalyzeGame from "./pages/AnalyzeGame";
import Leaderboard from "./pages/Leaderboard";
import ComparePlayers from "./pages/ComparePlayers";
import NotFound from "./pages/not-found";

function Router() {
  return (
    <div className="flex min-h-screen bg-background text-foreground font-body selection:bg-primary/30">
      <Sidebar />
      <main className="flex-1 p-4 pb-20 md:p-8 md:pb-8 w-full max-w-[1600px] mx-auto overflow-x-hidden">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/players" component={PlayersList} />
          <Route path="/players/:id" component={PlayerDetail} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/compare" component={ComparePlayers} />
          <Route path="/analyze" component={AnalyzeGame} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <MobileNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
