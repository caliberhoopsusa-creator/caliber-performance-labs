import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Camera, Plus, User, Trophy, Flame, Target, Star, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { Player, PlayerStory, STORY_TEMPLATE_PRESETS } from "@shared/schema";

function generateSessionId(): string {
  let sessionId = localStorage.getItem("caliber_session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("caliber_session_id", sessionId);
  }
  return sessionId;
}

type StoryWithPlayer = PlayerStory & { playerName: string };

const TEMPLATE_CONFIG = {
  weekly_recap: {
    name: "Weekly Recap",
    description: "Your week in review",
    icon: Camera,
    gradient: "from-blue-500/30 to-indigo-600/20",
    borderColor: "border-blue-500/40",
    iconColor: "text-blue-400",
  },
  game_highlight: {
    name: "Game Highlight",
    description: "Best moments from a game",
    icon: Star,
    gradient: "from-amber-500/30 to-orange-600/20",
    borderColor: "border-amber-500/40",
    iconColor: "text-amber-400",
  },
  badge_earned: {
    name: "Badge Earned",
    description: "Celebrate your achievement",
    icon: Trophy,
    gradient: "from-emerald-500/30 to-green-600/20",
    borderColor: "border-emerald-500/40",
    iconColor: "text-emerald-400",
  },
  milestone: {
    name: "Milestone",
    description: "Career milestone reached",
    icon: Target,
    gradient: "from-purple-500/30 to-violet-600/20",
    borderColor: "border-purple-500/40",
    iconColor: "text-purple-400",
  },
  streak_fire: {
    name: "Streak Fire",
    description: "Show off your streak",
    icon: Flame,
    gradient: "from-red-500/30 to-orange-600/20",
    borderColor: "border-red-500/40",
    iconColor: "text-red-400",
  },
};

type TemplateType = keyof typeof TEMPLATE_CONFIG;

function StorySkeleton() {
  return (
    <Card className="min-w-[280px] animate-pulse" data-testid="skeleton-story">
      <CardContent className="p-4">
        <Skeleton className="h-8 w-8 rounded-full mb-3" />
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-3" />
        <Skeleton className="h-3 w-1/3" />
      </CardContent>
    </Card>
  );
}

function StoryCard({ story, onClick }: { story: StoryWithPlayer; onClick: () => void }) {
  let parsedStats: { points?: number; rebounds?: number; assists?: number } | null = null;
  try {
    if (story.stats) {
      parsedStats = JSON.parse(story.stats);
    }
  } catch {}

  const relativeTime = formatDistanceToNow(new Date(story.createdAt!), { addSuffix: true });

  return (
    <Card
      className="min-w-[280px] max-w-[320px] cursor-pointer transition-all duration-300 hover-elevate relative overflow-hidden"
      onClick={onClick}
      data-testid={`card-story-${story.id}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 opacity-60" />
      <CardContent className="p-4 relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-white" data-testid={`text-player-${story.id}`}>
            {story.playerName}
          </span>
        </div>

        <h3 className="text-base font-bold text-white mb-2 line-clamp-2" data-testid={`text-headline-${story.id}`}>
          {story.headline}
        </h3>

        {parsedStats && (
          <div className="flex gap-3 mb-3">
            {parsedStats.points !== undefined && (
              <div className="text-xs">
                <span className="text-primary font-bold">{parsedStats.points}</span>
                <span className="text-muted-foreground ml-1">PTS</span>
              </div>
            )}
            {parsedStats.rebounds !== undefined && (
              <div className="text-xs">
                <span className="text-primary font-bold">{parsedStats.rebounds}</span>
                <span className="text-muted-foreground ml-1">REB</span>
              </div>
            )}
            {parsedStats.assists !== undefined && (
              <div className="text-xs">
                <span className="text-primary font-bold">{parsedStats.assists}</span>
                <span className="text-muted-foreground ml-1">AST</span>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground" data-testid={`text-time-${story.id}`}>
          {relativeTime}
        </p>
      </CardContent>
    </Card>
  );
}

function TemplateCard({
  templateKey,
  selected,
  onClick,
}: {
  templateKey: TemplateType;
  selected: boolean;
  onClick: () => void;
}) {
  const config = TEMPLATE_CONFIG[templateKey];
  const Icon = config.icon;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-300 hover-elevate relative overflow-hidden",
        selected && "ring-2 ring-primary",
        config.borderColor
      )}
      onClick={onClick}
      data-testid={`card-template-${templateKey}`}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-80", config.gradient)} />
      <CardContent className="p-4 relative z-10">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-2", "bg-white/10")}>
          <Icon className={cn("w-5 h-5", config.iconColor)} />
        </div>
        <h4 className="text-sm font-bold text-white uppercase tracking-wide">{config.name}</h4>
        <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
      </CardContent>
    </Card>
  );
}

export default function Stories() {
  const { toast } = useToast();
  const sessionId = generateSessionId();

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | "">("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [headline, setHeadline] = useState("");
  const [points, setPoints] = useState("");
  const [rebounds, setRebounds] = useState("");
  const [assists, setAssists] = useState("");
  const [detailStory, setDetailStory] = useState<StoryWithPlayer | null>(null);

  const { data: stories = [], isLoading: storiesLoading } = useQuery<StoryWithPlayer[]>({
    queryKey: ["/api/stories"],
  });

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const createStoryMutation = useMutation({
    mutationFn: async (data: {
      playerId: number;
      templateId?: string;
      headline: string;
      stats?: string;
      sessionId: string;
      isPublic: boolean;
    }) => {
      const res = await apiRequest("POST", "/api/stories", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      resetForm();
      toast({ title: "Story Created", description: "Your story is now live!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create story", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setSelectedTemplate("");
    setSelectedPlayerId("");
    setHeadline("");
    setPoints("");
    setRebounds("");
    setAssists("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId || !headline.trim()) {
      toast({ title: "Missing Fields", description: "Please select a player and enter a headline", variant: "destructive" });
      return;
    }

    const stats: { points?: number; rebounds?: number; assists?: number } = {};
    if (points) stats.points = Number(points);
    if (rebounds) stats.rebounds = Number(rebounds);
    if (assists) stats.assists = Number(assists);

    createStoryMutation.mutate({
      playerId: Number(selectedPlayerId),
      templateId: selectedTemplate || undefined,
      headline: headline.trim(),
      stats: Object.keys(stats).length > 0 ? JSON.stringify(stats) : undefined,
      sessionId,
      isPublic: true,
    });
  };

  const canSubmit = selectedPlayerId && headline.trim();

  return (
    <div className="space-y-8 animate-in fade-in duration-500" data-testid="page-stories">
      <div>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-white uppercase tracking-tight flex items-center gap-3">
          <Camera className="w-8 h-8 text-primary" />
          Stories
        </h1>
        <p className="text-muted-foreground font-medium mt-1">
          Create and share weekly story templates
        </p>
      </div>

      <section data-testid="section-public-stories">
        <h2 className="text-xl font-bold text-white uppercase tracking-wide mb-4">
          Public Stories
        </h2>
        {storiesLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary/20">
            <StorySkeleton />
            <StorySkeleton />
            <StorySkeleton />
          </div>
        ) : stories.length === 0 ? (
          <Card className="p-8 text-center" data-testid="empty-stories">
            <div className="flex flex-col items-center gap-3">
              <Camera className="w-12 h-12 text-muted-foreground/50" />
              <div>
                <p className="text-white font-medium mb-1">No stories yet</p>
                <p className="text-sm text-muted-foreground">
                  Be the first to create a story!
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary/20" data-testid="stories-scroll">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} onClick={() => setDetailStory(story)} />
            ))}
          </div>
        )}
      </section>

      <section data-testid="section-create-story">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white uppercase tracking-wide">
              <Plus className="w-5 h-5 text-primary" />
              Create Story
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-white uppercase tracking-wide">
                  Select Template
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {(Object.keys(TEMPLATE_CONFIG) as TemplateType[]).map((key) => (
                    <TemplateCard
                      key={key}
                      templateKey={key}
                      selected={selectedTemplate === key}
                      onClick={() => setSelectedTemplate(selectedTemplate === key ? "" : key)}
                    />
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="player" className="text-sm font-semibold text-white uppercase tracking-wide">
                    Player *
                  </Label>
                  <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                    <SelectTrigger id="player" data-testid="select-player">
                      <SelectValue placeholder="Select a player" />
                    </SelectTrigger>
                    <SelectContent>
                      {players.map((player) => (
                        <SelectItem key={player.id} value={player.id.toString()}>
                          {player.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="headline" className="text-sm font-semibold text-white uppercase tracking-wide">
                    Headline *
                  </Label>
                  <Input
                    id="headline"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="What's the story?"
                    data-testid="input-headline"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-white uppercase tracking-wide">
                  Stats (Optional)
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="points" className="text-xs text-muted-foreground">
                      Points
                    </Label>
                    <Input
                      id="points"
                      type="number"
                      value={points}
                      onChange={(e) => setPoints(e.target.value)}
                      placeholder="0"
                      min="0"
                      data-testid="input-points"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rebounds" className="text-xs text-muted-foreground">
                      Rebounds
                    </Label>
                    <Input
                      id="rebounds"
                      type="number"
                      value={rebounds}
                      onChange={(e) => setRebounds(e.target.value)}
                      placeholder="0"
                      min="0"
                      data-testid="input-rebounds"
                    />
                  </div>
                  <div>
                    <Label htmlFor="assists" className="text-xs text-muted-foreground">
                      Assists
                    </Label>
                    <Input
                      id="assists"
                      type="number"
                      value={assists}
                      onChange={(e) => setAssists(e.target.value)}
                      placeholder="0"
                      min="0"
                      data-testid="input-assists"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!canSubmit || createStoryMutation.isPending}
                data-testid="button-submit-story"
              >
                {createStoryMutation.isPending ? (
                  "Creating..."
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Publish Story
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <Dialog open={!!detailStory} onOpenChange={() => setDetailStory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Story Details
            </DialogTitle>
          </DialogHeader>
          {detailStory && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-white">{detailStory.playerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(detailStory.createdAt!), { addSuffix: true })}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg border border-primary/20">
                <h3 className="text-lg font-bold text-white">{detailStory.headline}</h3>
              </div>

              {detailStory.stats && (
                <div className="grid grid-cols-3 gap-4">
                  {(() => {
                    try {
                      const s = JSON.parse(detailStory.stats);
                      return (
                        <>
                          {s.points !== undefined && (
                            <div className="text-center p-3 bg-white/5 rounded-lg">
                              <p className="text-2xl font-bold text-primary">{s.points}</p>
                              <p className="text-xs text-muted-foreground uppercase">Points</p>
                            </div>
                          )}
                          {s.rebounds !== undefined && (
                            <div className="text-center p-3 bg-white/5 rounded-lg">
                              <p className="text-2xl font-bold text-primary">{s.rebounds}</p>
                              <p className="text-xs text-muted-foreground uppercase">Rebounds</p>
                            </div>
                          )}
                          {s.assists !== undefined && (
                            <div className="text-center p-3 bg-white/5 rounded-lg">
                              <p className="text-2xl font-bold text-primary">{s.assists}</p>
                              <p className="text-xs text-muted-foreground uppercase">Assists</p>
                            </div>
                          )}
                        </>
                      );
                    } catch {
                      return null;
                    }
                  })()}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
