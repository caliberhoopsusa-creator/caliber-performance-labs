import { useState } from "react";
import { Film, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { HighlightClipCard } from "./HighlightClipCard";
import { VideoPlayerModal } from "./VideoPlayerModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { HighlightClip, Game } from "@shared/schema";

interface HighlightClipsGalleryProps {
  clips: HighlightClip[];
  games?: Game[];
  isLoading?: boolean;
  isOwner?: boolean;
  onDelete?: (clipId: number) => void;
}

export function HighlightClipsGallery({
  clips,
  games = [],
  isLoading = false,
  isOwner = false,
  onDelete,
}: HighlightClipsGalleryProps) {
  const [selectedClip, setSelectedClip] = useState<HighlightClip | null>(null);
  const [filterGameId, setFilterGameId] = useState<string>("all");

  const filteredClips = filterGameId === "all"
    ? clips
    : clips.filter((clip) => clip.gameId?.toString() === filterGameId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-video rounded-xl" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {games.length > 0 && (
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filterGameId} onValueChange={setFilterGameId}>
            <SelectTrigger className="w-[200px]" data-testid="select-filter-game">
              <SelectValue placeholder="Filter by game" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clips</SelectItem>
              {games.map((game) => (
                <SelectItem key={game.id} value={game.id.toString()}>
                  vs {game.opponent} - {game.date}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {filteredClips.length === 0 ? (
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Film className="w-8 h-8 text-primary/60" />
          </div>
          <p className="text-white font-semibold mb-1">No Highlight Clips Yet</p>
          <p className="text-sm text-muted-foreground">
            {filterGameId !== "all"
              ? "No clips found for this game. Try a different filter or upload a new clip."
              : "Upload your first highlight clip to showcase your best moments!"}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredClips.map((clip) => (
            <HighlightClipCard
              key={clip.id}
              clip={clip}
              isOwner={isOwner}
              onPlay={() => setSelectedClip(clip)}
              onDelete={onDelete ? () => onDelete(clip.id) : undefined}
            />
          ))}
        </div>
      )}

      <VideoPlayerModal
        clip={selectedClip}
        isOpen={!!selectedClip}
        onClose={() => setSelectedClip(null)}
      />
    </div>
  );
}
