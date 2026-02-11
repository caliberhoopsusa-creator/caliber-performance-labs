import { useState, useMemo } from "react";
import { Film, Plus, Search, Sparkles, Video, Filter, Grid3X3, LayoutGrid, Play, TrendingUp } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { HighlightClipsGallery } from "@/components/HighlightClipsGallery";
import { UploadClipModal } from "@/components/UploadClipModal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { HighlightClip, Game, Player } from "@shared/schema";

interface ExtendedUser {
  id: string;
  playerId: number | null;
  role: string | null;
}

export default function HighlightClipsPage() {
  const { toast } = useToast();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGameId, setFilterGameId] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "large">("grid");

  const { data: user } = useQuery<ExtendedUser | null>({
    queryKey: ["/api/users/me"],
  });

  const playerId = user?.playerId;

  const { data: clips = [], isLoading: clipsLoading } = useQuery<HighlightClip[]>({
    queryKey: ["/api/players", playerId, "highlight-clips"],
    enabled: !!playerId,
  });

  const { data: player } = useQuery<Player & { games: Game[] }>({
    queryKey: ["/api/players", playerId],
    enabled: !!playerId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (clipId: number) => {
      await apiRequest("DELETE", `/api/highlight-clips/${clipId}`);
    },
    onSuccess: () => {
      toast({
        title: "Clip Deleted",
        description: "Your highlight clip has been removed",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/players", playerId, "highlight-clips"],
      });
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
    if (window.confirm("Are you sure you want to delete this clip?")) {
      deleteMutation.mutate(clipId);
    }
  };

  const filteredClips = useMemo(() => {
    let result = clips;
    
    if (filterGameId !== "all") {
      result = result.filter((clip) => clip.gameId?.toString() === filterGameId);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((clip) =>
        clip.title.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [clips, filterGameId, searchQuery]);

  const totalViews = useMemo(() => 
    clips.reduce((sum, clip) => sum + (clip.viewCount || 0), 0),
    [clips]
  );

  if (!playerId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="relative">
          <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full" />
          <Film className="w-20 h-20 text-accent relative z-10 mb-6" />
        </div>
        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
          Highlights Unavailable
        </h2>
        <p className="text-muted-foreground text-center max-w-md">
          Please complete your player profile setup to access highlight clips.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-6 space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-black/60 via-card to-black/60 border border-accent/20">
        <div className="absolute inset-0 opacity-30" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full" />
        
        <div className="relative z-10 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Film className="w-6 h-6 text-accent" />
                <span className="text-xs uppercase tracking-wider text-accent font-semibold">Video Gallery</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">
                <span className="bg-gradient-to-r from-white via-accent to-accent bg-clip-text text-transparent">
                  Highlights Gallery
                </span>
              </h1>
              <p className="text-muted-foreground max-w-md">
                Showcase your best moments on the court with stunning highlight clips
              </p>
            </div>
            
            <div className="flex flex-col items-start md:items-end gap-3">
              <Button
                onClick={() => setIsUploadModalOpen(true)}
                className="gap-2 bg-accent  text-white"
                data-testid="button-upload-clip"
              >
                <Plus className="w-4 h-4" />
                Upload Clip
              </Button>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-accent" />
                  <span>{clips.length} clips</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span>{totalViews.toLocaleString()} views</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {clips.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Clips", value: clips.length, icon: Film, color: "accent" },
            { label: "Total Views", value: totalViews.toLocaleString(), icon: TrendingUp, color: "purple" },
            { label: "This Month", value: clips.filter(c => {
              const date = new Date(c.createdAt || 0);
              const now = new Date();
              return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            }).length, icon: Sparkles, color: "yellow" },
            { label: "Recent Activity", value: clips.length > 0 ? "Active" : "None", icon: Play, color: "green" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-gradient-to-br from-black/60 to-black/30 border-white/10 hover:border-white/20 transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      stat.color === "accent" && "bg-accent/10 border border-accent/20",
                      stat.color === "purple" && "bg-purple-500/10 border border-purple-500/20",
                      stat.color === "yellow" && "bg-yellow-500/10 border border-yellow-500/20",
                      stat.color === "green" && "bg-green-500/10 border border-green-500/20"
                    )}>
                      <stat.icon className={cn(
                        "w-5 h-5",
                        stat.color === "accent" && "text-accent",
                        stat.color === "purple" && "text-purple-400",
                        stat.color === "yellow" && "text-yellow-400",
                        stat.color === "green" && "text-green-400"
                      )} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-lg font-bold">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
              <Video className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-bold">My Highlights</h2>
              <p className="text-xs text-muted-foreground">{filteredClips.length} clips available</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant={viewMode === "grid" ? "default" : "outline"}
              className={cn("h-8 w-8", viewMode === "grid" && "bg-accent ")}
              onClick={() => setViewMode("grid")}
              data-testid="btn-view-grid"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant={viewMode === "large" ? "default" : "outline"}
              className={cn("h-8 w-8", viewMode === "large" && "bg-accent ")}
              onClick={() => setViewMode("large")}
              data-testid="btn-view-large"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search highlights..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-black/20 border-white/10 focus:border-accent/50"
              data-testid="input-search-clips"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant={filterGameId === "all" ? "default" : "outline"}
              onClick={() => setFilterGameId("all")}
              className={cn(filterGameId === "all" && "bg-accent ")}
              data-testid="filter-all-clips"
            >
              <Filter className="w-3 h-3 mr-1" />
              All Clips
            </Button>
            {(player?.games || []).slice(0, 3).map((game) => (
              <Button
                key={game.id}
                size="sm"
                variant={filterGameId === game.id.toString() ? "default" : "outline"}
                onClick={() => setFilterGameId(game.id.toString())}
                className={cn(
                  "border-white/10",
                  filterGameId === game.id.toString() && "bg-accent "
                )}
                data-testid={`filter-game-${game.id}`}
              >
                vs {game.opponent}
              </Button>
            ))}
            {(player?.games || []).length > 3 && (
              <Badge variant="outline" className="border-white/20 text-muted-foreground">
                +{(player?.games || []).length - 3} more
              </Badge>
            )}
          </div>
        </div>

        <HighlightClipsGallery
          clips={filteredClips}
          games={player?.games || []}
          isLoading={clipsLoading}
          isOwner={true}
          onDelete={handleDelete}
          viewMode={viewMode}
        />
      </div>

      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-card via-purple-950/20 to-card border border-accent/20 p-6">
        <div className="absolute inset-0 opacity-20" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-accent/20 to-purple-500/20 border border-white/10">
              <Sparkles className="w-8 h-8 text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Pro Tip</h3>
              <p className="text-sm text-muted-foreground">Upload your best plays to attract college scouts and showcase your skills</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="border-accent/30 text-accent hover:bg-accent/10"
            onClick={() => setIsUploadModalOpen(true)}
            data-testid="btn-upload-tip"
          >
            <Plus className="w-4 h-4 mr-2" />
            Upload Now
          </Button>
        </div>
      </div>

      <UploadClipModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        playerId={playerId}
        games={player?.games || []}
      />
    </div>
  );
}
