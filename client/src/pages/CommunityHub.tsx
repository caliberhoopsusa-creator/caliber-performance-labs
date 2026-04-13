import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HelpTooltip } from "@/components/HelpTooltip";
import { HeroHeader } from "@/components/HeroHeader";
import { useAuth } from "@/hooks/use-auth";
import {
  Rss,
  Camera,
  BarChart3,
  UserPlus,
  MessageCircle,
  Compass
} from "lucide-react";

import FeedContent from "./FeedContent";
import StoriesContent from "./StoriesContent";
import PollsContent from "./PollsContent";
import ConnectContent from "./ConnectContent";
import MessagesPage from "./MessagesPage";
import DiscoverContent from "./DiscoverContent";

type TabValue = "feed" | "stories" | "polls" | "connect" | "messages" | "discover";
const VALID_TABS: TabValue[] = ["feed", "stories", "polls", "connect", "messages", "discover"];

function isValidTab(tab: string | null): tab is TabValue {
  return tab !== null && VALID_TABS.includes(tab as TabValue);
}

export default function CommunityHub() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  const searchParams = new URLSearchParams(search);
  const tabFromUrl = searchParams.get("tab");
  const validatedTab = isValidTab(tabFromUrl) ? tabFromUrl : "feed";
  const [activeTab, setActiveTab] = useState<TabValue>(validatedTab);

  useEffect(() => {
    if (isValidTab(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    } else if (tabFromUrl !== null) {
      setLocation("/community?tab=feed", { replace: true });
    }
  }, [tabFromUrl, setLocation]);

  const handleTabChange = (value: string) => {
    if (!isValidTab(value)) return;
    setActiveTab(value);
    setLocation(`/community?tab=${value}`, { replace: true });
  };

  return (
    <div className="space-y-6 pb-8" data-testid="page-community-hub">
      <div className="flex flex-col gap-3">
        <HeroHeader user={user} />
        <div className="flex items-center gap-2 pl-1">
          <HelpTooltip
            content="Share updates, post stories, vote in polls, and connect with other players and coaches in the Caliber community."
            side="right"
            iconSize="md"
            testId="button-help-community-hub"
          />
          <p className="text-xs text-muted-foreground">
            Stay connected with the Caliber community
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList
          className="w-full justify-start bg-transparent p-0 gap-1.5 overflow-x-auto flex-nowrap no-scrollbar h-auto"
          data-testid="tabs-community"
        >
          <TabsTrigger
            value="feed"
            className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium border border-transparent transition-all duration-200
              text-muted-foreground/70 hover:text-foreground hover:bg-muted/50
              data-[state=active]:bg-amber-500 data-[state=active]:text-black data-[state=active]:border-amber-500/0 data-[state=active]:font-semibold
              data-[state=active]:shadow-[0_0_12px_rgba(198,208,216,0.25)]"
            data-testid="tab-feed"
          >
            <Rss className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Activity Feed</span>
            <span className="sm:hidden">Feed</span>
          </TabsTrigger>
          <TabsTrigger
            value="stories"
            className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium border border-transparent transition-all duration-200
              text-muted-foreground/70 hover:text-foreground hover:bg-muted/50
              data-[state=active]:bg-amber-500 data-[state=active]:text-black data-[state=active]:border-amber-500/0 data-[state=active]:font-semibold
              data-[state=active]:shadow-[0_0_12px_rgba(198,208,216,0.25)]"
            data-testid="tab-stories"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Stories</span>
          </TabsTrigger>
          <TabsTrigger
            value="polls"
            className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium border border-transparent transition-all duration-200
              text-muted-foreground/70 hover:text-foreground hover:bg-muted/50
              data-[state=active]:bg-amber-500 data-[state=active]:text-black data-[state=active]:border-amber-500/0 data-[state=active]:font-semibold
              data-[state=active]:shadow-[0_0_12px_rgba(198,208,216,0.25)]"
            data-testid="tab-polls"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Polls & Predictions</span>
            <span className="sm:hidden">Polls</span>
          </TabsTrigger>
          <TabsTrigger
            value="messages"
            className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium border border-transparent transition-all duration-200
              text-muted-foreground/70 hover:text-foreground hover:bg-muted/50
              data-[state=active]:bg-amber-500 data-[state=active]:text-black data-[state=active]:border-amber-500/0 data-[state=active]:font-semibold
              data-[state=active]:shadow-[0_0_12px_rgba(198,208,216,0.25)]"
            data-testid="tab-messages"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Messages</span>
          </TabsTrigger>
          <TabsTrigger
            value="discover"
            className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium border border-transparent transition-all duration-200
              text-muted-foreground/70 hover:text-foreground hover:bg-muted/50
              data-[state=active]:bg-amber-500 data-[state=active]:text-black data-[state=active]:border-amber-500/0 data-[state=active]:font-semibold
              data-[state=active]:shadow-[0_0_12px_rgba(198,208,216,0.25)]"
            data-testid="tab-discover"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Discover</span>
          </TabsTrigger>
          <TabsTrigger
            value="connect"
            className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium border border-transparent transition-all duration-200
              text-muted-foreground/70 hover:text-foreground hover:bg-muted/50
              data-[state=active]:bg-amber-500 data-[state=active]:text-black data-[state=active]:border-amber-500/0 data-[state=active]:font-semibold
              data-[state=active]:shadow-[0_0_12px_rgba(198,208,216,0.25)]"
            data-testid="tab-connect"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Connect</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="mt-6">
          <FeedContent />
        </TabsContent>

        <TabsContent value="stories" className="mt-6">
          <StoriesContent />
        </TabsContent>

        <TabsContent value="polls" className="mt-6">
          <PollsContent />
        </TabsContent>

        <TabsContent value="messages" className="mt-6">
          <MessagesPage />
        </TabsContent>

        <TabsContent value="discover" className="mt-6">
          <DiscoverContent />
        </TabsContent>

        <TabsContent value="connect" className="mt-6">
          <ConnectContent />
        </TabsContent>
      </Tabs>
    </div>
  );
}
