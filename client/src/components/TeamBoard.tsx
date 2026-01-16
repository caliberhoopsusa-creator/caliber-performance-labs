import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, Send, ChevronDown, Crown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Team, TeamMember, TeamPost } from "@shared/schema";

type TeamWithCount = Team & { memberCount: number };
type PostWithAuthor = TeamPost & { authorName: string };

interface TeamBoardProps {
  team: TeamWithCount;
  sessionId: string;
  onBack: () => void;
}

export function TeamBoard({ team, sessionId, onBack }: TeamBoardProps) {
  const { toast } = useToast();
  const [postContent, setPostContent] = useState("");
  const [membersOpen, setMembersOpen] = useState(false);

  const { data: posts = [], isLoading: postsLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/teams", team.id, "posts"],
    queryFn: async () => {
      const res = await fetch(`/api/teams/${team.id}/posts`);
      if (!res.ok) throw new Error("Failed to fetch posts");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const { data: members = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/teams", team.id, "members"],
    queryFn: async () => {
      const res = await fetch(`/api/teams/${team.id}/members`);
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json();
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/teams/${team.id}/posts`, {
        sessionId,
        content,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", team.id, "posts"] });
      setPostContent("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post message",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (postContent.trim()) {
      createPostMutation.mutate(postContent.trim());
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold font-display text-white tracking-wide">{team.name}</h1>
          <p className="text-muted-foreground mt-1">Team Code: {team.code}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,300px]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Message Board</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                {postsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading messages...</div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[...posts].reverse().map((post) => (
                      <div key={post.id} className="flex gap-3" data-testid={`post-${post.id}`}>
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="text-xs">
                            {getInitials(post.authorName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{post.authorName}</span>
                            <span className="text-xs text-muted-foreground">
                              {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : ""}
                            </span>
                          </div>
                          <p className="text-sm mt-1 break-words">{post.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
                <Textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Write a message..."
                  className="resize-none min-h-[60px]"
                  data-testid="input-post-content"
                />
                <Button 
                  type="submit" 
                  size="icon"
                  disabled={!postContent.trim() || createPostMutation.isPending}
                  data-testid="button-send-post"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:block">
          <Card>
            <Collapsible open={membersOpen} onOpenChange={setMembersOpen}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover-elevate rounded-t-lg">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Members ({members.length})
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${membersOpen ? "rotate-180" : ""}`} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center gap-3" data-testid={`member-${member.id}`}>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(member.displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate block">{member.displayName}</span>
                        </div>
                        {member.role === "admin" && (
                          <Crown className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        </div>
      </div>
    </div>
  );
}
