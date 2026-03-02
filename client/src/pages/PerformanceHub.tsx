import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HelpTooltip } from "@/components/HelpTooltip";
import { 
  Zap, 
  Dumbbell,
  Calendar
} from "lucide-react";
import { CareerTimeline } from "@/components/CareerTimeline";
import { TeamHistorySection } from "@/components/TeamHistory";

import WorkoutsContent from "./WorkoutsContent";

type TabValue = "workouts" | "career";
const VALID_TABS: TabValue[] = ["workouts", "career"];

function isValidTab(tab: string | null): tab is TabValue {
  return tab !== null && VALID_TABS.includes(tab as TabValue);
}

export default function PerformanceHub() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  
  const searchParams = new URLSearchParams(search);
  const tabFromUrl = searchParams.get("tab");
  const validatedTab = isValidTab(tabFromUrl) ? tabFromUrl : "workouts";
  const [activeTab, setActiveTab] = useState<TabValue>(validatedTab);

  const { data: userMe } = useQuery<{ playerId: number | null }>({
    queryKey: ["/api/users/me"],
    staleTime: 30000,
  });

  const playerId = userMe?.playerId;

  useEffect(() => {
    if (isValidTab(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    } else if (tabFromUrl !== null) {
      setLocation("/performance?tab=workouts", { replace: true });
    }
  }, [tabFromUrl, setLocation]);

  const handleTabChange = (value: string) => {
    if (!isValidTab(value)) return;
    setActiveTab(value);
    setLocation(`/performance?tab=${value}`, { replace: true });
  };

  return (
    <div className="space-y-6 pb-8" data-testid="page-performance-hub">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 flex items-center justify-center">
            <Zap className="w-6 h-6 text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-display font-bold bg-gradient-to-r from-white via-accent/20 to-accent bg-clip-text text-transparent">
                Performance Hub
              </h1>
              <HelpTooltip
                content="Log your workouts, track training progress, and view your career arc across seasons."
                side="right"
                iconSize="md"
                testId="button-help-performance-hub"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Track your training, workouts, and career progression
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList 
          className="w-full justify-start bg-card border border-white/10 p-1 rounded-xl overflow-x-auto flex-nowrap"
          data-testid="tabs-performance"
        >
          <TabsTrigger 
            value="workouts" 
            className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            data-testid="tab-workouts"
          >
            <Dumbbell className="w-4 h-4" />
            <span>Workouts</span>
          </TabsTrigger>
          <TabsTrigger 
            value="career" 
            className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            data-testid="tab-career-timeline"
          >
            <Calendar className="w-4 h-4" />
            <span>Career Timeline</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workouts" className="mt-6">
          <WorkoutsContent />
        </TabsContent>

        <TabsContent value="career" className="mt-6">
          {playerId ? (
            <div className="space-y-8">
              <CareerTimeline playerId={playerId} />
              <TeamHistorySection playerId={playerId} />
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground" data-testid="career-no-player">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Create a player profile to view your career timeline.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
