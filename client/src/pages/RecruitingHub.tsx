import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function RecruitingHub() {
  const { user } = useAuth();
  const search = useSearch();
  const [, setLocation] = useLocation();
  
  const searchParams = new URLSearchParams(search);
  const tabFromUrl = searchParams.get("tab") as TabValue | null;
  const [activeTab, setActiveTab] = useState<TabValue>(tabFromUrl || "journey");

  useEffect(() => {
    if (tabFromUrl && ["journey", "schools", "events"].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (value: string) => {
    const tab = value as TabValue;
    setActiveTab(tab);
    setLocation(`/recruiting?tab=${tab}`, { replace: true });
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/20 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
              Recruiting Hub
            </h1>
            <p className="text-sm text-muted-foreground">
              Your complete recruiting journey in one place
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full justify-start bg-white/5 border border-cyan-500/10 p-1 rounded-xl overflow-x-auto flex-nowrap">
          <TabsTrigger 
            value="journey" 
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all whitespace-nowrap",
              "data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-cyan-500/10",
              "data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-500/30"
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
              "data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-cyan-500/10",
              "data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-500/30"
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
              "data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-cyan-500/10",
              "data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-500/30"
            )}
            data-testid="tab-events"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Camps & Events</span>
            <span className="sm:hidden">Events</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="journey" className="mt-6">
          <MyRecruitingContent />
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
