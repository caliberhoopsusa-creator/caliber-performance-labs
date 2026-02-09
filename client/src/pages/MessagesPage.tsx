import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send, Plus, MessageCircle, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface DmMessage {
  id: number;
  threadId: number;
  senderPlayerId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface DmParticipant {
  id: number;
  threadId: number;
  playerId: number;
  lastReadAt: string | null;
  joinedAt: string;
}

interface DmThread {
  id: number;
  createdAt: string;
}

interface ThreadSummary {
  thread: DmThread;
  participants: DmParticipant[];
  lastMessage: DmMessage | null;
  unreadCount: number;
}

interface Player {
  id: number;
  name: string;
  [key: string]: unknown;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function truncate(str: string, len: number): string {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "..." : str;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const playerId = user?.playerId;

  const [view, setView] = useState<"inbox" | "chat">("inbox");
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [activeOtherPlayerId, setActiveOtherPlayerId] = useState<number | null>(null);
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
    enabled: !!playerId,
  });

  const playerMap = useMemo(() => {
    const map = new Map<number, string>();
    players.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [players]);

  const {
    data: threads = [],
    isLoading: threadsLoading,
  } = useQuery<ThreadSummary[]>({
    queryKey: ["/api/dm/threads", `playerId=${playerId}`],
    queryFn: async () => {
      const res = await fetch(`/api/dm/threads?playerId=${playerId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch threads");
      return res.json();
    },
    enabled: !!playerId,
    refetchInterval: 5000,
  });

  const {
    data: messages = [],
    isLoading: messagesLoading,
  } = useQuery<DmMessage[]>({
    queryKey: ["/api/dm/threads", activeThreadId, "messages"],
    queryFn: async () => {
      const res = await fetch(`/api/dm/threads/${activeThreadId}/messages?limit=50`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!activeThreadId && view === "chat",
    refetchInterval: 3000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ threadId, content }: { threadId: number; content: string }) => {
      return apiRequest("POST", `/api/dm/threads/${threadId}/messages`, {
        senderPlayerId: playerId,
        content,
      });
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/dm/threads", activeThreadId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dm/threads", `playerId=${playerId}`] });
    },
  });

  const createThreadMutation = useMutation({
    mutationFn: async (otherPlayerId: number) => {
      const res = await apiRequest("POST", "/api/dm/threads", {
        participantIds: [playerId, otherPlayerId],
      });
      return res.json();
    },
    onSuccess: (data: { thread: DmThread; participants: DmParticipant[]; isExisting: boolean }) => {
      setNewMessageOpen(false);
      setSearchQuery("");
      const otherParticipant = data.participants.find((p) => p.playerId !== playerId);
      setActiveThreadId(data.thread.id);
      setActiveOtherPlayerId(otherParticipant?.playerId ?? null);
      setView("chat");
      queryClient.invalidateQueries({ queryKey: ["/api/dm/threads", `playerId=${playerId}`] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (threadId: number) => {
      return apiRequest("POST", `/api/dm/threads/${threadId}/read`, { playerId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dm/threads", `playerId=${playerId}`] });
    },
  });

  useEffect(() => {
    if (view === "chat" && activeThreadId && playerId) {
      markReadMutation.mutate(activeThreadId);
    }
  }, [view, activeThreadId]);

  useEffect(() => {
    if (messages.length > 0 && messages.length !== prevMessageCountRef.current) {
      prevMessageCountRef.current = messages.length;
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const openThread = (threadSummary: ThreadSummary) => {
    const other = threadSummary.participants.find((p) => p.playerId !== playerId);
    setActiveThreadId(threadSummary.thread.id);
    setActiveOtherPlayerId(other?.playerId ?? null);
    setView("chat");
  };

  const goBackToInbox = () => {
    setView("inbox");
    setActiveThreadId(null);
    setActiveOtherPlayerId(null);
    setMessageText("");
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !activeThreadId) return;
    sendMessageMutation.mutate({ threadId: activeThreadId, content: messageText.trim() });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredPlayers = useMemo(() => {
    return players.filter(
      (p) =>
        p.id !== playerId &&
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [players, playerId, searchQuery]);

  const otherPlayerName = activeOtherPlayerId ? playerMap.get(activeOtherPlayerId) ?? "Unknown" : "Unknown";

  if (!playerId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8" data-testid="messages-no-auth">
        <MessageCircle className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground text-center">Please log in and set up your player profile to use messages.</p>
      </div>
    );
  }

  if (view === "chat") {
    return (
      <div className="flex flex-col h-full" data-testid="messages-chat-view">
        <div className="flex items-center gap-3 p-4 border-b border-white/10">
          <Button
            variant="ghost"
            size="icon"
            onClick={goBackToInbox}
            data-testid="button-back-to-inbox"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Avatar className="w-9 h-9">
            <AvatarFallback className="bg-gradient-to-br from-cyan-600/30 to-blue-600/30 text-white text-sm">
              {getInitials(otherPlayerName)}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold text-white" data-testid="text-chat-player-name">
            {otherPlayerName}
          </span>
        </div>

        <ScrollArea className="flex-1 p-4" data-testid="messages-scroll-area">
          {messagesLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                  <Skeleton className="h-12 w-48 rounded-2xl" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
              <MessageCircle className="w-10 h-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground" data-testid="text-no-messages">
                No messages yet. Say hello!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isMine = msg.senderPlayerId === playerId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                    data-testid={`message-bubble-${msg.id}`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                        isMine
                          ? "bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-br-md"
                          : "bg-card border border-white/10 text-white rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm break-words" data-testid={`text-message-content-${msg.id}`}>
                        {msg.content}
                      </p>
                      <p
                        className={`text-[10px] mt-1 ${
                          isMine ? "text-white/60" : "text-muted-foreground"
                        }`}
                        data-testid={`text-message-time-${msg.id}`}
                      >
                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        <div className="flex items-center gap-2 p-4 border-t border-white/10">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-white/5 border-white/10"
            data-testid="input-message"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sendMessageMutation.isPending}
            data-testid="button-send-message"
          >
            <Send className="w-4 h-4 mr-2" />
            Send
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" data-testid="messages-inbox-view">
      <div className="flex items-center justify-between gap-4 p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/20 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-cyan-400" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
            Messages
          </h1>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setNewMessageOpen(true)}
          data-testid="button-new-message"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1" data-testid="threads-scroll-area">
        {threadsLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="w-11 h-11 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        ) : threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 px-8">
            <MessageCircle className="w-12 h-12 text-muted-foreground" />
            <p className="text-muted-foreground text-center" data-testid="text-no-threads">
              No conversations yet. Tap the + button to start a new message.
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {threads.map((ts) => {
              const other = ts.participants.find((p) => p.playerId !== playerId);
              const otherName = other ? playerMap.get(other.playerId) ?? "Player" : "Unknown";
              const preview = ts.lastMessage ? truncate(ts.lastMessage.content, 50) : "No messages yet";
              const timeAgo = ts.lastMessage
                ? formatDistanceToNow(new Date(ts.lastMessage.createdAt), { addSuffix: true })
                : "";

              return (
                <div
                  key={ts.thread.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover-elevate cursor-pointer"
                  onClick={() => openThread(ts)}
                  data-testid={`thread-item-${ts.thread.id}`}
                >
                  <Avatar className="w-11 h-11">
                    <AvatarFallback className="bg-gradient-to-br from-cyan-600/30 to-blue-600/30 text-white text-sm">
                      {getInitials(otherName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-white" data-testid={`text-thread-name-${ts.thread.id}`}>
                        {otherName}
                      </span>
                      {ts.unreadCount > 0 && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0 min-h-0 h-5" data-testid={`badge-unread-${ts.thread.id}`}>
                          {ts.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate" data-testid={`text-thread-preview-${ts.thread.id}`}>
                      {preview}
                    </p>
                  </div>
                  {timeAgo && (
                    <span className="text-[10px] text-muted-foreground shrink-0" data-testid={`text-thread-time-${ts.thread.id}`}>
                      {timeAgo}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <Dialog open={newMessageOpen} onOpenChange={setNewMessageOpen}>
        <DialogContent className="bg-gradient-to-br from-black/95 to-black/80 border-white/10" data-testid="dialog-new-message">
          <DialogHeader>
            <DialogTitle className="text-white">New Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white/5 border-white/10"
                data-testid="input-search-players"
              />
            </div>
            <ScrollArea className="h-64">
              {filteredPlayers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8" data-testid="text-no-players-found">
                  No players found
                </p>
              ) : (
                <div className="space-y-1">
                  {filteredPlayers.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover-elevate cursor-pointer"
                      onClick={() => createThreadMutation.mutate(p.id)}
                      data-testid={`player-select-${p.id}`}
                    >
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className="bg-gradient-to-br from-cyan-600/30 to-blue-600/30 text-white text-sm">
                          {getInitials(p.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-white" data-testid={`text-player-name-${p.id}`}>
                        {p.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
