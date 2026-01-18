import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Play, Eye, Calendar, Film } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { VideoPlayerModal } from "@/components/VideoPlayerModal";
import type { HighlightClip, Game } from "@shared/schema";
import { format } from "date-fns";

interface HighlightsGalleryProps {
  playerId: number;
}

export function HighlightsGallery({ playerId }: HighlightsGalleryProps) {
  const [selectedClip, setSelectedClip] = useState<HighlightClip | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: highlights = [], isLoading } = useQuery<HighlightClip[]>({
    queryKey: ["/api/players", playerId, "highlight-clips"],
  });

  const { data: games = [] } = useQuery<Game[]>({
    queryKey: ["/api/players", playerId, "games"],
    enabled: highlights.some((h) => h.gameId !== null),
  });

  const getGameInfo = (gameId: number | null) => {
    if (!gameId) return null;
    const game = games.find((g) => g.id === gameId);
    if (!game) return null;
    return {
      opponent: game.opponent,
      date: game.date,
    };
  };

  const handleClipClick = (clip: HighlightClip) => {
    setSelectedClip(clip);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClip(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (highlights.length === 0) {
    return (
      <div data-testid="highlights-gallery">
        <EmptyState
          icon={Film}
          title="No highlights yet"
          description="Upload your best plays and moments to showcase your skills."
        />
      </div>
    );
  }

  return (
    <div data-testid="highlights-gallery">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {highlights.map((clip) => {
          const gameInfo = getGameInfo(clip.gameId);

          return (
            <Card
              key={clip.id}
              className="overflow-hidden cursor-pointer group hover-elevate"
              onClick={() => handleClipClick(clip)}
              data-testid={`highlight-card-${clip.id}`}
            >
              <div className="relative aspect-video bg-black/80">
                {clip.thumbnailUrl ? (
                  <img
                    src={clip.thumbnailUrl}
                    alt={clip.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary/40 to-secondary/20">
                    <Film className="w-12 h-12 text-muted-foreground/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center">
                    <Play className="w-7 h-7 text-white ml-1" />
                  </div>
                </div>
                {clip.duration && (
                  <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded text-xs text-white font-medium">
                    {Math.floor(clip.duration / 60)}:{(clip.duration % 60).toString().padStart(2, "0")}
                  </div>
                )}
              </div>

              <div className="p-4 bg-card/50 backdrop-blur-sm border-t border-white/5">
                <h4 className="font-bold text-white text-sm mb-1 line-clamp-1">
                  {clip.title}
                </h4>

                {clip.description && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {clip.description}
                  </p>
                )}

                {gameInfo && (
                  <div className="text-xs text-primary/80 mb-2 flex items-center gap-1">
                    <span>vs {gameInfo.opponent}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">
                      {format(new Date(gameInfo.date), "MMM d, yyyy")}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{clip.viewCount.toLocaleString()} views</span>
                  </div>
                  {clip.createdAt && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{format(new Date(clip.createdAt), "MMM d")}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <VideoPlayerModal
        clip={selectedClip}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
