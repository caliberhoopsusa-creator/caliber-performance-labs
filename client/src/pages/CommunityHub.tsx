import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HelpTooltip } from "@/components/HelpTooltip";
import { 
  Users, 
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
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20 flex items-center justify-center">
            <Users className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-purple-100 to-purple-400 bg-clip-text text-transparent">
                Community
              </h1>
              <HelpTooltip
                content="Share updates, post stories, vote in polls, and connect with other players and coaches in the Caliber community."
                side="right"
                iconSize="md"
                testId="button-help-community-hub"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Stay connected with the Caliber community
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList 
          className="w-full justify-start bg-card border border-white/10 p-1 rounded-xl overflow-x-auto flex-nowrap"
          data-testid="tabs-community"
        >
          <TabsTrigger 
            value="feed" 
            className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-testid="tab-feed"
          >
            <Rss className="w-4 h-4" />
            <span className="hidden sm:inline">Activity Feed</span>
            <span className="sm:hidden">Feed</span>
          </TabsTrigger>
          <TabsTrigger 
            value="stories" 
            className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-testid="tab-stories"
          >
            <Camera className="w-4 h-4" />
            <span>Stories</span>
          </TabsTrigger>
          <TabsTrigger 
            value="polls" 
            className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-testid="tab-polls"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Polls & Predictions</span>
            <span className="sm:hidden">Polls</span>
          </TabsTrigger>
          <TabsTrigger 
            value="messages" 
            className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-testid="tab-messages"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Messages</span>
          </TabsTrigger>
          <TabsTrigger 
            value="discover" 
            className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-testid="tab-discover"
          >
            <Compass className="w-4 h-4" />
            <span>Discover</span>
          </TabsTrigger>
          <TabsTrigger 
            value="connect" 
            className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-testid="tab-connect"
          >
            <UserPlus className="w-4 h-4" />
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
