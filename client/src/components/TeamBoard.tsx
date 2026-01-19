import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, Send, ChevronDown, Crown, Megaphone, Calendar, MessageCircle, FileText, Pin, MapPin, Clock, MessageSquare, ChevronUp, Trash2, Target } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import type { Team, TeamMember, TeamPost, TeamPostComment } from "@shared/schema";

type TeamWithCount = Team & { memberCount: number };
type PostWithAuthor = TeamPost & { authorName: string };
type CommentWithAuthor = TeamPostComment & { authorName: string };

interface TeamBoardProps {
  team: TeamWithCount;
  sessionId: string;
  onBack: () => void;
}

const POST_TYPE_CONFIG = {
  announcement: { icon: Megaphone, label: "Announcement", color: "text-red-400 bg-red-500/10" },
  practice: { icon: Calendar, label: "Practice", color: "text-blue-400 bg-blue-500/10" },
  chat: { icon: MessageCircle, label: "Chat", color: "text-green-400 bg-green-500/10" },
  general: { icon: FileText, label: "General", color: "text-muted-foreground bg-muted/50" },
  workout: { icon: Target, label: "Workout", color: "text-purple-400 bg-purple-500/10" },
};

function PostComments({ postId, teamId, sessionId, currentMember }: { 
  postId: number; 
  teamId: number; 
  sessionId: string;
  currentMember: TeamMember | undefined;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [comment, setComment] = useState("");
  const { toast } = useToast();

  const { data: comments = [] } = useQuery<CommentWithAuthor[]>({
    queryKey: ["/api/teams", teamId, "posts", postId, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/teams/${teamId}/posts/${postId}/comments`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json();
    },
    enabled: isOpen,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/teams/${teamId}/posts/${postId}/comments`, {
        sessionId,
        content,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", teamId, "posts", postId, "comments"] });
      setComment("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim() && currentMember) {
      addCommentMutation.mutate(comment.trim());
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="mt-2 pt-2 border-t border-white/5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors"
        data-testid={`button-toggle-comments-${postId}`}
      >
        <MessageSquare className="w-3 h-3" />
        {comments.length > 0 ? `${comments.length} replies` : "Reply"}
        {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {isOpen && (
        <div className="mt-2 space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2 pl-2 border-l-2 border-primary/20">
              <Avatar className="h-6 w-6 flex-shrink-0">
                <AvatarFallback className="text-[10px]">{getInitials(c.authorName)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-xs">{c.authorName}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {c.createdAt ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }) : ""}
                  </span>
                </div>
                <p className="text-xs mt-0.5 break-words text-muted-foreground">{c.content}</p>
              </div>
            </div>
          ))}

          {currentMember && (
            <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a reply..."
                className="h-8 text-xs"
                data-testid={`input-comment-${postId}`}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!comment.trim() || addCommentMutation.isPending}
                className="h-8 px-2"
                data-testid={`button-submit-comment-${postId}`}
              >
                <Send className="w-3 h-3" />
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export function TeamBoard({ team, sessionId, onBack }: TeamBoardProps) {
  const { toast } = useToast();
  const [postContent, setPostContent] = useState("");
  const [postType, setPostType] = useState<"announcement" | "practice" | "chat" | "general" | "workout">("chat");
  const [practiceTime, setPracticeTime] = useState("");
  const [practiceLocation, setPracticeLocation] = useState("");
  const [isPinned, setIsPinned] = useState(false);
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

  const currentMember = members.find((m) => m.sessionId === sessionId);
  const isCoach = currentMember?.role === "coach" || currentMember?.role === "admin";

  const createPostMutation = useMutation({
    mutationFn: async (data: { content: string; postType: string; practiceTime?: string; practiceLocation?: string; isPinned: boolean }) => {
      const res = await apiRequest("POST", `/api/teams/${team.id}/posts`, {
        sessionId,
        ...data,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", team.id, "posts"] });
      setPostContent("");
      setPracticeTime("");
      setPracticeLocation("");
      setIsPinned(false);
      setPostType("chat");
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message || "Failed to post message",
        variant: "destructive",
      });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      await apiRequest("DELETE", `/api/teams/${team.id}/posts/${postId}?sessionId=${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", team.id, "posts"] });
      toast({ title: "Post deleted" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (postContent.trim()) {
      const hasTimeFields = postType === "practice" || postType === "workout";
      createPostMutation.mutate({
        content: postContent.trim(),
        postType,
        practiceTime: hasTimeFields && practiceTime ? practiceTime : undefined,
        practiceLocation: hasTimeFields && practiceLocation ? practiceLocation : undefined,
        isPinned,
      });
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const sortedPosts = [...posts].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border border-primary/20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        <div className="flex items-center gap-4 relative">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back" className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-white tracking-wide truncate">{team.name}</h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <code className="text-sm bg-black/30 backdrop-blur px-2 py-0.5 rounded font-mono tracking-widest text-primary">{team.code}</code>
              <span className="text-sm text-muted-foreground">{members.length} members</span>
              {isCoach && (
                <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-400 border-amber-500/30">
                  <Crown className="w-3 h-3 mr-1" /> Coach
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,300px]">
        <div className="space-y-4">
          <Card className="border-primary/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-primary" />
                </div>
                Team Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-3 mb-6 p-4 rounded-xl bg-gradient-to-br from-secondary/40 to-secondary/20 border border-white/5">
                <div className="flex gap-2 items-center">
                  <Select value={postType} onValueChange={(v: any) => setPostType(v)}>
                    <SelectTrigger className="w-[140px]" data-testid="select-post-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chat">Chat</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      {isCoach && <SelectItem value="announcement">Announcement</SelectItem>}
                      {isCoach && <SelectItem value="practice">Practice</SelectItem>}
                      {isCoach && <SelectItem value="workout">Workout</SelectItem>}
                    </SelectContent>
                  </Select>
                  
                  {isCoach && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant={isPinned ? "default" : "outline"}
                          size="icon"
                          onClick={() => setIsPinned(!isPinned)}
                          data-testid="button-toggle-pin"
                        >
                          <Pin className={`w-4 h-4 ${isPinned ? "fill-current" : ""}`} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Pin this post</TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {(postType === "practice" || postType === "workout") && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <Input
                        type="datetime-local"
                        value={practiceTime}
                        onChange={(e) => setPracticeTime(e.target.value)}
                        className="flex-1"
                        data-testid="input-practice-time"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <Input
                        value={practiceLocation}
                        onChange={(e) => setPracticeLocation(e.target.value)}
                        placeholder="Location"
                        className="flex-1"
                        data-testid="input-practice-location"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder={postType === "practice" ? "Practice details..." : postType === "announcement" ? "Important announcement..." : "Write a message..."}
                    className="resize-none min-h-[60px] flex-1"
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
                </div>
              </form>

              <ScrollArea className="h-[500px] pr-4">
                {postsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-pulse flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/20" />
                      <div className="h-3 w-24 bg-muted rounded" />
                    </div>
                  </div>
                ) : sortedPosts.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-muted rounded-xl">
                    <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium mb-1">No messages yet</h3>
                    <p className="text-sm text-muted-foreground">Start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortedPosts.map((post) => {
                      const config = POST_TYPE_CONFIG[post.postType as keyof typeof POST_TYPE_CONFIG] || POST_TYPE_CONFIG.general;
                      const Icon = config.icon;
                      const canDelete = currentMember && (post.authorId === currentMember.id || isCoach);

                      return (
                        <Card
                          key={post.id}
                          className={`p-4 transition-all shadow-sm ${post.isPinned ? "border-primary/40 bg-primary/5 shadow-md" : "hover:border-primary/30 hover:shadow-md"}`}
                          data-testid={`post-${post.id}`}
                        >
                          <div className="flex gap-3">
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarFallback className="text-xs">
                                {getInitials(post.authorName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm">{post.authorName}</span>
                                <Badge variant="secondary" className={`text-[10px] ${config.color}`}>
                                  <Icon className="w-3 h-3 mr-1" />
                                  {config.label}
                                </Badge>
                                {post.isPinned && (
                                  <Badge variant="outline" className="text-[10px] text-primary bg-primary/5 border-primary/30">
                                    <Pin className="w-3 h-3 mr-1 fill-current" /> Pinned
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : ""}
                                </span>
                                {canDelete && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 ml-auto opacity-50 hover:opacity-100"
                                    onClick={() => deletePostMutation.mutate(post.id)}
                                    data-testid={`button-delete-post-${post.id}`}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>

                              {(post.postType === "practice" || post.postType === "workout") && post.practiceTime && (
                                <div className={`mt-3 p-3 rounded-lg ${post.postType === "workout" ? "bg-gradient-to-r from-purple-500/15 to-purple-500/5 border border-purple-500/20" : "bg-gradient-to-r from-blue-500/15 to-blue-500/5 border border-blue-500/20"}`}>
                                  <div className="flex flex-wrap items-center gap-4 text-sm">
                                    <div className={`flex items-center gap-2 ${post.postType === "workout" ? "text-purple-400" : "text-blue-400"}`}>
                                      <div className={`w-7 h-7 rounded flex items-center justify-center ${post.postType === "workout" ? "bg-purple-500/20" : "bg-blue-500/20"}`}>
                                        <Calendar className="w-4 h-4" />
                                      </div>
                                      <span className="font-medium">{format(new Date(post.practiceTime), "EEE, MMM d 'at' h:mm a")}</span>
                                    </div>
                                    {post.practiceLocation && (
                                      <div className={`flex items-center gap-2 ${post.postType === "workout" ? "text-purple-300/80" : "text-blue-300/80"}`}>
                                        <MapPin className="w-4 h-4" />
                                        <span>{post.practiceLocation}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              <p className="text-sm mt-2 break-words">{post.content}</p>

                              <PostComments
                                postId={post.id}
                                teamId={team.id}
                                sessionId={sessionId}
                                currentMember={currentMember}
                              />
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="lg:block space-y-4">
          <Card className="border-primary/10">
            <Collapsible open={membersOpen} onOpenChange={setMembersOpen}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover-elevate rounded-t-lg pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      Team ({members.length})
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${membersOpen ? "rotate-180" : ""}`} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div 
                        key={member.id} 
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors" 
                        data-testid={`member-${member.id}`}
                      >
                        <Avatar className="h-9 w-9 border-2 border-background">
                          <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/5">
                            {getInitials(member.displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate block">{member.displayName}</span>
                          <span className="text-xs text-muted-foreground">
                            {member.role === "admin" ? "Admin" : member.role === "coach" ? "Coach" : "Player"}
                          </span>
                        </div>
                        {(member.role === "admin" || member.role === "coach") && (
                          <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <Crown className="w-3 h-3 text-amber-500" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-400" />
                </div>
                Upcoming Practices
              </CardTitle>
            </CardHeader>
            <CardContent>
              {posts.filter(p => p.postType === "practice" && p.practiceTime && new Date(p.practiceTime) > new Date()).length === 0 ? (
                <div className="text-center py-4">
                  <Calendar className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-xs text-muted-foreground">No upcoming practices</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {posts
                    .filter(p => p.postType === "practice" && p.practiceTime && new Date(p.practiceTime) > new Date())
                    .sort((a, b) => new Date(a.practiceTime!).getTime() - new Date(b.practiceTime!).getTime())
                    .slice(0, 3)
                    .map((practice) => (
                      <div key={practice.id} className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <div className="font-medium text-sm text-blue-400">
                          {format(new Date(practice.practiceTime!), "EEE, MMM d")}
                        </div>
                        <div className="text-xs text-blue-300/80 mt-0.5">
                          {format(new Date(practice.practiceTime!), "h:mm a")}
                        </div>
                        {practice.practiceLocation && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-2 pt-2 border-t border-blue-500/10">
                            <MapPin className="w-3 h-3" />
                            {practice.practiceLocation}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
