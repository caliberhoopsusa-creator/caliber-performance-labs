import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HelpTooltip } from "@/components/HelpTooltip";
import { 
  GraduationCap, 
  School, 
  Calendar,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";

import MyRecruitingContent from "./MyRecruitingContent";
import CollegeRecruitingContent from "./CollegeRecruitingContent";
import CampShowcaseContent from "./CampShowcaseContent";

type TabValue = "journey" | "schools" | "events";
const VALID_TABS: TabValue[] = ["journey", "schools", "events"];

function isValidTab(tab: string | null): tab is TabValue {
  return tab !== null && VALID_TABS.includes(tab as TabValue);
}

export default function RecruitingHub() {
  const { user } = useAuth();
  const search = useSearch();
  const [, setLocation] = useLocation();
  
  const searchParams = new URLSearchParams(search);
  const tabFromUrl = searchParams.get("tab");
  const validatedTab = isValidTab(tabFromUrl) ? tabFromUrl : "journey";
  const [activeTab, setActiveTab] = useState<TabValue>(validatedTab);

  useEffect(() => {
    if (isValidTab(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    } else if (tabFromUrl !== null) {
      setLocation("/recruiting?tab=journey", { replace: true });
    }
  }, [tabFromUrl, setLocation]);

  const handleTabChange = (value: string) => {
    if (!isValidTab(value)) return;
    setActiveTab(value);
    setLocation(`/recruiting?tab=${value}`, { replace: true });
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-accent/20 to-accent bg-clip-text text-transparent">
                Recruiting Hub
              </h1>
              <HelpTooltip
                content="Track your recruiting timeline, find matching colleges with real program stats, and discover camps and showcases near you."
                side="right"
                iconSize="md"
                testId="button-help-recruiting-hub"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Your complete recruiting journey in one place
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full justify-start bg-white/5 border border-border p-1 rounded-xl overflow-x-auto flex-nowrap">
          <TabsTrigger 
            value="journey" 
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all whitespace-nowrap",
              "data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent/20 data-[state=active]:to-accent/10",
              "data-[state=active]:text-accent data-[state=active]:border-accent/30"
            )}
            data-testid="tab-journey"
          >
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">My Journey</span>
            <span className="sm:hidden">Journey</span>
          </TabsTrigger>
          <TabsTrigger 
            value="schools" 
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all whitespace-nowrap",
              "data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent/20 data-[state=active]:to-accent/10",
              "data-[state=active]:text-accent data-[state=active]:border-accent/30"
            )}
            data-testid="tab-schools"
          >
            <School className="w-4 h-4" />
            <span className="hidden sm:inline">Find Schools</span>
            <span className="sm:hidden">Schools</span>
          </TabsTrigger>
          <TabsTrigger 
            value="events" 
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all whitespace-nowrap",
              "data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent/20 data-[state=active]:to-accent/10",
              "data-[state=active]:text-accent data-[state=active]:border-accent/30"
            )}
            data-testid="tab-events"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Camps & Events</span>
            <span className="sm:hidden">Events</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="journey" className="mt-6">
          <MyRecruitingContent onTabChange={handleTabChange} />
        </TabsContent>

        <TabsContent value="schools" className="mt-6">
          <CollegeRecruitingContent />
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <CampShowcaseContent />
        </TabsContent>
      </Tabs>
    </div>
  );
}
