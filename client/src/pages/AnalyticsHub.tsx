import { useLocation, useSearch } from "wouter";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HelpTooltip } from "@/components/HelpTooltip";
import { BarChart3 } from "lucide-react";
import LeaderboardContent from "./LeaderboardContent";
import CompareContent from "./CompareContent";
import TeamsContent from "./TeamsContent";
import ChallengesContent from "./ChallengesContent";
import GradingContent from "./GradingContent";

const VALID_TABS = ["leaderboard", "compare", "teams", "challenges", "grading"];

export default function AnalyticsHub() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const tabParam = params.get("tab");
  const activeTab = VALID_TABS.includes(tabParam || "") ? tabParam! : "leaderboard";

  const handleTabChange = (value: string) => {
    setLocation(`/analytics?tab=${value}`, { replace: true });
  };

  return (
    <div className="space-y-6 pb-20" data-testid="page-analytics-hub">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-accent" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-accent/20 to-accent bg-clip-text text-transparent">
              Analytics Hub
            </h1>
            <HelpTooltip
              content="View leaderboards, compare players head-to-head, see how your stats are graded, and take on skill challenges."
              side="right"
              iconSize="md"
              testId="button-help-analytics-hub"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Rankings, comparisons, and competitive insights
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList
          className="w-full justify-start bg-card border border-white/10 p-1 rounded-xl overflow-x-auto flex-nowrap"
          data-testid="analytics-tabs"
        >
          <TabsTrigger
            value="leaderboard"
            className="whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-testid="tab-leaderboard"
          >
            Leaderboard
          </TabsTrigger>
          <TabsTrigger
            value="compare"
            className="whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-testid="tab-compare"
          >
            Compare
          </TabsTrigger>
          <TabsTrigger
            value="teams"
            className="whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-testid="tab-teams"
          >
            Teams
          </TabsTrigger>
          <TabsTrigger
            value="challenges"
            className="whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-testid="tab-challenges"
          >
            Challenges
          </TabsTrigger>
          <TabsTrigger
            value="grading"
            className="whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-testid="tab-grading"
          >
            Grading
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="mt-6">
          <LeaderboardContent />
        </TabsContent>
        <TabsContent value="compare" className="mt-6">
          <CompareContent />
        </TabsContent>
        <TabsContent value="teams" className="mt-6">
          <TeamsContent />
        </TabsContent>
        <TabsContent value="challenges" className="mt-6">
          <ChallengesContent />
        </TabsContent>
        <TabsContent value="grading" className="mt-6">
          <GradingContent />
        </TabsContent>
      </Tabs>
    </div>
  );
}
