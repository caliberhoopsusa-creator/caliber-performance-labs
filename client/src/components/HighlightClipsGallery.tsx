import { useState } from "react";
import { Film, Video } from "lucide-react";
import { motion } from "framer-motion";
import { HighlightClipCard } from "./HighlightClipCard";
import { VideoPlayerModal } from "./VideoPlayerModal";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { HighlightClip, Game } from "@shared/schema";

interface HighlightClipsGalleryProps {
  clips: HighlightClip[];
  games?: Game[];
  isLoading?: boolean;
  isOwner?: boolean;
  onDelete?: (clipId: number) => void;
  viewMode?: "grid" | "large";
}

export function HighlightClipsGallery({
  clips,
  games = [],
  isLoading = false,
  isOwner = false,
  onDelete,
  viewMode = "grid",
}: HighlightClipsGalleryProps) {
  const [selectedClip, setSelectedClip] = useState<HighlightClip | null>(null);

  if (isLoading) {
    return (
      <div className={cn(
        "grid gap-4",
        viewMode === "grid" 
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
          : "grid-cols-1 sm:grid-cols-2"
      )}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i} className="animate-pulse bg-gradient-to-br from-black/60 to-black/30 border-white/5">
            <CardContent className="p-0">
              <div className="aspect-video bg-white/5" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-white/5 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (clips.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-black/60 to-black/30 border-white/10">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-accent/10 blur-2xl rounded-full" />
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/20 to-purple-500/10 border border-accent/20 flex items-center justify-center relative z-10">
              <Film className="w-10 h-10 text-accent" />
            </div>
          </div>
          <h3 className="font-bold text-lg mb-1">No Highlight Clips Yet</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Upload your first highlight clip to showcase your best moments on the court!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <motion.div 
        className={cn(
          "grid gap-4",
          viewMode === "grid" 
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
            : "grid-cols-1 sm:grid-cols-2"
        )}
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
      >
        {clips.map((clip, index) => (
          <motion.div
            key={clip.id}
            variants={{
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
            }}
          >
            <HighlightClipCard
              clip={clip}
              isOwner={isOwner}
              onPlay={() => setSelectedClip(clip)}
              onDelete={onDelete ? () => onDelete(clip.id) : undefined}
              viewMode={viewMode}
            />
          </motion.div>
        ))}
      </motion.div>

      <VideoPlayerModal
        clip={selectedClip}
        isOpen={!!selectedClip}
        onClose={() => setSelectedClip(null)}
      />
    </>
  );
}
