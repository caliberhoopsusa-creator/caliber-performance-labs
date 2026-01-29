import { useState, useMemo } from "react";
import { Film, Plus, Sparkles, Play, Grid3X3, LayoutGrid, X } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HighlightCard } from "@/components/HighlightCard";
import { VideoPlayerModal } from "@/components/VideoPlayerModal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { HighlightClip, Game, Player } from "@shared/schema";

interface ExtendedUser {
  id: string;
  playerId: number | null;
  role: string | null;
}

const STAT_OPTIONS = [
  { value: "points", label: "Points" },
  { value: "rebounds", label: "Rebounds" },
  { value: "assists", label: "Assists" },
  { value: "steals", label: "Steals" },
  { value: "blocks", label: "Blocks" },
  { value: "threePointers", label: "3-Pointers" },
  { value: "freeThrows", label: "Free Throws" },
];

const OVERLAY_STYLES = [
  { value: "minimal", label: "Minimal", description: "Clean, simple stats" },
  { value: "full", label: "Full Stats", description: "Complete stat line" },
  { value: "animated", label: "Animated", description: "Dynamic stat overlays" },
];

const uploadFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  videoUrl: z.string().url("Must be a valid URL"),
  gameId: z.string().optional(),
  overlayStyle: z.enum(["minimal", "full", "animated"]),
  statsToFeature: z.array(z.string()).default([]),
});

type UploadFormData = z.infer<typeof uploadFormSchema>;

export default function Highlights() {
  const { toast } = useToast();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [selectedClip, setSelectedClip] = useState<HighlightClip | null>(null);
  const [playingClip, setPlayingClip] = useState<HighlightClip | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "large">("grid");

  const { data: user } = useQuery<ExtendedUser | null>({
    queryKey: ["/api/users/me"],
  });

  const playerId = user?.playerId;

  const { data: clips = [], isLoading } = useQuery<HighlightClip[]>({
    queryKey: ["/api/players", playerId, "highlights"],
    enabled: !!playerId,
  });

  const { data: player } = useQuery<Player & { games: Game[] }>({
    queryKey: ["/api/players", playerId],
    enabled: !!playerId,
  });

  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      title: "",
      description: "",
      videoUrl: "",
      gameId: "",
      overlayStyle: "minimal",
      statsToFeature: [],
    },
  });

  const overlayForm = useForm({
    defaultValues: {
      overlayStyle: "minimal" as const,
      statsToFeature: [] as string[],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: UploadFormData) => {
      const payload = {
        playerId,
        title: data.title,
        description: data.description || null,
        videoUrl: data.videoUrl,
        gameId: data.gameId ? parseInt(data.gameId) : null,
        overlayStyle: data.overlayStyle,
        statsToFeature: JSON.stringify(data.statsToFeature),
      };
      return await apiRequest("POST", "/api/highlights", payload);
    },
    onSuccess: () => {
      toast({ title: "Highlight Created", description: "Your highlight has been added" });
      queryClient.invalidateQueries({ queryKey: ["/api/players", playerId, "highlights"] });
      setIsUploadOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create highlight",
        variant: "destructive",
      });
    },
  });

  const overlayMutation = useMutation({
    mutationFn: async (data: { highlightId: number; overlayStyle: string; statsToFeature: string[] }) => {
      return await apiRequest("POST", "/api/highlights/generate-overlay", data);
    },
    onSuccess: () => {
      toast({ title: "Overlay Updated", description: "Your highlight overlay has been generated" });
      queryClient.invalidateQueries({ queryKey: ["/api/players", playerId, "highlights"] });
      setIsOverlayOpen(false);
      setSelectedClip(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate overlay",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (clipId: number) => {
      await apiRequest("DELETE", `/api/highlight-clips/${clipId}`);
    },
    onSuccess: () => {
      toast({ title: "Clip Deleted", description: "Your highlight clip has been removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/players", playerId, "highlights"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete clip",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (clipId: number) => {
    if (window.confirm("Are you sure you want to delete this highlight?")) {
      deleteMutation.mutate(clipId);
    }
  };

  const handleGenerateOverlay = (clip: HighlightClip) => {
    setSelectedClip(clip);
    overlayForm.reset({
      overlayStyle: (clip.overlayStyle as "minimal" | "full" | "animated") || "minimal",
      statsToFeature: clip.statsToFeature ? JSON.parse(clip.statsToFeature) : [],
    });
    setIsOverlayOpen(true);
  };

  const onSubmitUpload = (data: UploadFormData) => {
    createMutation.mutate(data);
  };

  const onSubmitOverlay = (data: { overlayStyle: string; statsToFeature: string[] }) => {
    if (!selectedClip) return;
    overlayMutation.mutate({
      highlightId: selectedClip.id,
      ...data,
    });
  };

  const totalViews = useMemo(
    () => clips.reduce((sum, clip) => sum + (clip.viewCount || 0), 0),
    [clips]
  );

  const totalLikes = useMemo(
    () => clips.reduce((sum, clip) => sum + (clip.likeCount || 0), 0),
    [clips]
  );

  if (!playerId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full" />
          <Film className="w-20 h-20 text-cyan-400 relative z-10 mb-6" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">No Player Profile</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Create a player profile to start uploading and managing your highlight clips.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/30 blur-xl rounded-full" />
              <Film className="w-8 h-8 text-cyan-400 relative z-10" />
            </div>
            My Highlights
          </h1>
          <p className="text-muted-foreground mt-1">
            TikTok-style clips with stat overlays
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border border-border rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("grid")}
              data-testid="button-view-grid"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "large" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("large")}
              data-testid="button-view-large"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>

          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-cyan-600 hover:bg-cyan-700" data-testid="button-upload-highlight">
                <Plus className="w-4 h-4" />
                Upload Highlight
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Film className="w-5 h-5 text-cyan-400" />
                  Upload Highlight
                </DialogTitle>
                <DialogDescription>
                  Add a new highlight clip with stats overlay
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitUpload)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Game-winning three pointer" {...field} data-testid="input-highlight-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the play..."
                            className="resize-none"
                            {...field}
                            data-testid="input-highlight-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="videoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Video URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} data-testid="input-highlight-video-url" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gameId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link to Game (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-highlight-game">
                              <SelectValue placeholder="Select a game" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">No game</SelectItem>
                            {player?.games?.map((game) => (
                              <SelectItem key={game.id} value={game.id.toString()}>
                                {game.date} vs {game.opponent}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="overlayStyle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Overlay Style</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-overlay-style">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {OVERLAY_STYLES.map((style) => (
                              <SelectItem key={style.value} value={style.value}>
                                <div className="flex flex-col">
                                  <span>{style.label}</span>
                                  <span className="text-xs text-muted-foreground">{style.description}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="statsToFeature"
                    render={() => (
                      <FormItem>
                        <FormLabel>Stats to Feature</FormLabel>
                        <div className="grid grid-cols-2 gap-2">
                          {STAT_OPTIONS.map((stat) => (
                            <FormField
                              key={stat.value}
                              control={form.control}
                              name="statsToFeature"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(stat.value)}
                                      onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        if (checked) {
                                          field.onChange([...current, stat.value]);
                                        } else {
                                          field.onChange(current.filter((v) => v !== stat.value));
                                        }
                                      }}
                                      data-testid={`checkbox-stat-${stat.value}`}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal cursor-pointer">
                                    {stat.label}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsUploadOpen(false)}
                      data-testid="button-cancel-upload"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-cyan-600 hover:bg-cyan-700"
                      disabled={createMutation.isPending}
                      data-testid="button-submit-highlight"
                    >
                      {createMutation.isPending ? "Creating..." : "Create Highlight"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-cyan-500/10">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-cyan-400">{clips.length}</p>
            <p className="text-sm text-muted-foreground">Total Clips</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-cyan-500/10">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-cyan-400">{totalViews.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total Views</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-cyan-500/10">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-pink-400">{totalLikes.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total Likes</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-cyan-500/10">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-400">
              {clips.filter((c) => c.overlayStyle).length}
            </p>
            <p className="text-sm text-muted-foreground">With Overlays</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[9/16] bg-card/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : clips.length === 0 ? (
        <Card className="bg-card/50 border-cyan-500/10">
          <CardContent className="p-12 text-center">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full" />
              <Film className="w-16 h-16 text-cyan-400 relative z-10" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Highlights Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Upload your best plays and add TikTok-style stat overlays to share with scouts and fans.
            </p>
            <Button
              className="gap-2 bg-cyan-600 hover:bg-cyan-700"
              onClick={() => setIsUploadOpen(true)}
              data-testid="button-first-upload"
            >
              <Plus className="w-4 h-4" />
              Upload Your First Highlight
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          className={cn(
            "grid gap-4",
            viewMode === "grid"
              ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
              : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {clips.map((clip) => (
            <motion.div
              key={clip.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              layout
            >
              <HighlightCard
                clip={clip}
                player={player}
                onPlay={setPlayingClip}
                onGenerateOverlay={handleGenerateOverlay}
                onDelete={handleDelete}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      <Dialog open={isOverlayOpen} onOpenChange={setIsOverlayOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Generate Overlay
            </DialogTitle>
            <DialogDescription>
              Customize the stat overlay for "{selectedClip?.title}"
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={overlayForm.handleSubmit(onSubmitOverlay)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">Overlay Style</label>
              <div className="grid grid-cols-3 gap-2">
                {OVERLAY_STYLES.map((style) => (
                  <button
                    key={style.value}
                    type="button"
                    onClick={() => overlayForm.setValue("overlayStyle", style.value as any)}
                    className={cn(
                      "p-3 rounded-lg border text-center transition-all",
                      overlayForm.watch("overlayStyle") === style.value
                        ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
                        : "border-border hover:border-cyan-500/50"
                    )}
                    data-testid={`button-overlay-style-${style.value}`}
                  >
                    <p className="font-medium text-sm">{style.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Stats to Feature</label>
              <div className="grid grid-cols-2 gap-2">
                {STAT_OPTIONS.map((stat) => {
                  const currentStats = overlayForm.watch("statsToFeature");
                  const isChecked = currentStats.includes(stat.value);
                  return (
                    <label
                      key={stat.value}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            overlayForm.setValue("statsToFeature", [...currentStats, stat.value]);
                          } else {
                            overlayForm.setValue(
                              "statsToFeature",
                              currentStats.filter((v) => v !== stat.value)
                            );
                          }
                        }}
                        data-testid={`checkbox-overlay-stat-${stat.value}`}
                      />
                      <span className="text-sm">{stat.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOverlayOpen(false)}
                data-testid="button-cancel-overlay"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="gap-2 bg-cyan-600 hover:bg-cyan-700"
                disabled={overlayMutation.isPending}
                data-testid="button-submit-overlay"
              >
                <Sparkles className="w-4 h-4" />
                {overlayMutation.isPending ? "Generating..." : "Generate Overlay"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {playingClip && (
        <VideoPlayerModal
          isOpen={!!playingClip}
          onClose={() => setPlayingClip(null)}
          videoUrl={playingClip.videoUrl}
          title={playingClip.title}
        />
      )}
    </div>
  );
}
