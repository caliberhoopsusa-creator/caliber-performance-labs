import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Play, Eye, Calendar, Film, Plus, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VideoPlayerModal } from "@/components/VideoPlayerModal";
import { UploadClipModal } from "@/components/UploadClipModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { motion } from "framer-motion";
import type { HighlightClip, Game } from "@shared/schema";
import { format } from "date-fns";
import { SportSpinner } from "@/components/SportSpinner";

interface HighlightsGalleryProps {
  playerId: number;
  isOwner?: boolean;
}

export function HighlightsGallery({ playerId, isOwner = false }: HighlightsGalleryProps) {
  const [selectedClip, setSelectedClip] = useState<HighlightClip | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const { data: highlights = [], isLoading, error } = useQuery<HighlightClip[]>({
    queryKey: [`/api/players/${playerId}/highlight-clips`],
  });

  const { data: games = [] } = useQuery<Game[]>({
    queryKey: [`/api/players/${playerId}/games`],
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
      <div data-testid="highlights-gallery-loading">
        <div className="flex justify-center py-4">
          <SportSpinner size="md" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-video" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="highlights-gallery-error">
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Film className="w-8 h-8 text-accent/60" />
          </div>
          <p className="text-foreground font-semibold mb-1">Failed to load highlights</p>
          <p className="text-sm text-muted-foreground">There was an error loading the highlights. Please try again later.</p>
        </motion.div>
      </div>
    );
  }

  if (highlights.length === 0) {
    return (
      <div data-testid="highlights-gallery">
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Film className="w-8 h-8 text-accent/60" />
          </div>
          <p className="text-foreground font-semibold mb-1">No highlights yet</p>
          <p className="text-sm text-muted-foreground mb-6">Upload your best plays and moments to showcase your skills.</p>
          {isOwner && (
            <Button onClick={() => setIsUploadModalOpen(true)} className="gap-2" data-testid="button-add-highlight-empty">
              <Plus className="w-4 h-4" />
              Add Highlight
            </Button>
          )}
        </motion.div>
        {isOwner && (
          <UploadClipModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            playerId={playerId}
            games={games}
          />
        )}
      </div>
    );
  }

  return (
    <div data-testid="highlights-gallery">
      <div className="flex justify-between items-center mb-4">
        <Link href={`/reels/${playerId}`}>
          <Button variant="outline" className="gap-2" data-testid="button-view-reel">
            <ExternalLink className="w-4 h-4" />
            View Reel
          </Button>
        </Link>
        {isOwner && (
          <Button onClick={() => setIsUploadModalOpen(true)} className="gap-2" data-testid="button-add-highlight">
            <Plus className="w-4 h-4" />
            Add Highlight
          </Button>
        )}
      </div>
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
              <div className="relative aspect-video bg-card/80">
                {clip.thumbnailUrl ? (
                  <>
                    <img
                      src={clip.thumbnailUrl}
                      alt={clip.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary/40 to-secondary/20 hidden">
                      <Film className="w-12 h-12 text-muted-foreground/50" />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary/40 to-secondary/20">
                    <Film className="w-12 h-12 text-muted-foreground/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-card/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-14 h-14 rounded-full bg-accent/90 flex items-center justify-center">
                    <Play className="w-7 h-7 text-white ml-1" />
                  </div>
                </div>
                {clip.duration && (
                  <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded text-xs text-white font-medium">
                    {Math.floor(clip.duration / 60)}:{(clip.duration % 60).toString().padStart(2, "0")}
                  </div>
                )}
              </div>

              <div className="p-4 bg-card/50 backdrop-blur-sm border-t border-border/50">
                <h4 className="font-bold text-foreground text-sm mb-1 line-clamp-1">
                  {clip.title}
                </h4>

                {clip.description && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {clip.description}
                  </p>
                )}

                {gameInfo && (
                  <div className="text-xs text-accent/80 mb-2 flex items-center gap-1">
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

      <UploadClipModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        playerId={playerId}
        games={games}
      />
    </div>
  );
}
