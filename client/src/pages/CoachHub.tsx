import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LayoutDashboard,
  ClipboardCheck,
  Medal,
  CalendarCheck,
  Users,
  Eye,
  Bell,
  Briefcase
} from "lucide-react";

import DashboardContent from "./DashboardContent";
import VerifyContent from "./VerifyContent";
import EndorseContent from "./EndorseContent";
import PracticesContent from "./PracticesContent";
import LineupsContent from "./LineupsContent";
import ScoutingContent from "./ScoutingContent";
import AlertsContent from "./AlertsContent";

type TabValue = "dashboard" | "verify" | "endorse" | "practices" | "lineups" | "scouting" | "alerts";
const VALID_TABS: TabValue[] = ["dashboard", "verify", "endorse", "practices", "lineups", "scouting", "alerts"];

function isValidTab(tab: string | null): tab is TabValue {
  return tab !== null && VALID_TABS.includes(tab as TabValue);
}

export default function CoachHub() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  
  const searchParams = new URLSearchParams(search);
  const tabFromUrl = searchParams.get("tab");
  const validatedTab = isValidTab(tabFromUrl) ? tabFromUrl : "dashboard";
  const [activeTab, setActiveTab] = useState<TabValue>(validatedTab);

  useEffect(() => {
    if (isValidTab(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    } else if (tabFromUrl !== null) {
      setLocation("/coach?tab=dashboard", { replace: true });
    }
  }, [tabFromUrl, setLocation]);

  const handleTabChange = (value: string) => {
    if (!isValidTab(value)) return;
    setActiveTab(value);
    setLocation(`/coach?tab=${value}`, { replace: true });
  };

  return (
    <div className="space-y-6 pb-8" data-testid="page-coach-hub">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/20 flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
              Coach Hub
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your team, verify stats, and develop players
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList 
          className="w-full justify-start bg-card border border-white/10 p-1 rounded-xl overflow-x-auto flex-nowrap"
          data-testid="tabs-coach"
        >
          <TabsTrigger 
            value="dashboard" 
            className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-testid="tab-dashboard"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
            <span className="sm:hidden">Dash</span>
          </TabsTrigger>
          <TabsTrigger 
            value="verify" 
            className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-testid="tab-verify"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Verify</span>
          </TabsTrigger>
          <TabsTrigger 
            value="endorse" 
            className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-testid="tab-endorse"
          >
            <Medal className="w-4 h-4" />
            <span>Endorse</span>
          </TabsTrigger>
          <TabsTrigger 
            value="practices" 
            className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-testid="tab-practices"
          >
            <CalendarCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Practices</span>
            <span className="sm:hidden">Practice</span>
          </TabsTrigger>
          <TabsTrigger 
            value="lineups" 
            className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-testid="tab-lineups"
          >
            <Users className="w-4 h-4" />
            <span>Lineups</span>
          </TabsTrigger>
          <TabsTrigger 
            value="scouting" 
            className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-testid="tab-scouting"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Scouting</span>
            <span className="sm:hidden">Scout</span>
          </TabsTrigger>
          <TabsTrigger 
            value="alerts" 
            className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-testid="tab-alerts"
          >
            <Bell className="w-4 h-4" />
            <span>Alerts</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <DashboardContent />
        </TabsContent>

        <TabsContent value="verify" className="mt-6">
          <VerifyContent />
        </TabsContent>

        <TabsContent value="endorse" className="mt-6">
          <EndorseContent />
        </TabsContent>

        <TabsContent value="practices" className="mt-6">
          <PracticesContent />
        </TabsContent>

        <TabsContent value="lineups" className="mt-6">
          <LineupsContent />
        </TabsContent>

        <TabsContent value="scouting" className="mt-6">
          <ScoutingContent />
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <AlertsContent />
        </TabsContent>
      </Tabs>
    </div>
  );
}
