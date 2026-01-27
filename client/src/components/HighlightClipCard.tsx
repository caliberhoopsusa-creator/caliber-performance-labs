import { Play, Eye, Trash2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import type { HighlightClip } from "@shared/schema";

interface HighlightClipCardProps {
  clip: HighlightClip;
  isOwner?: boolean;
  onPlay: () => void;
  onDelete?: () => void;
  className?: string;
}

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function HighlightClipCard({
  clip,
  isOwner = false,
  onPlay,
  onDelete,
  className,
}: HighlightClipCardProps) {
  return (
    <div
      data-testid={`highlight-clip-card-${clip.id}`}
      className={cn(
        "glass-card rounded-xl overflow-hidden group cursor-pointer",
        "transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10",
        className
      )}
      onClick={onPlay}
    >
      <div className="relative aspect-video bg-black/50">
        {clip.thumbnailUrl ? (
          <img
            src={clip.thumbnailUrl}
            alt={clip.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-orange-500/5">
            <Play className="w-12 h-12 text-muted-foreground" />
          </div>
        )}

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-8 h-8 text-primary-foreground fill-current ml-1" />
          </div>
        </div>

        {clip.duration && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(clip.duration)}
          </div>
        )}

        {isOwner && onDelete && (
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-red-500/80 text-white"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            data-testid={`button-delete-clip-${clip.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-display text-lg font-semibold text-white uppercase tracking-wide line-clamp-1 mb-2">
          {clip.title}
        </h3>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span data-testid={`text-view-count-${clip.id}`}>
              {clip.viewCount.toLocaleString()} views
            </span>
          </div>
          
          <span>
            {clip.createdAt
              ? formatDistanceToNow(new Date(clip.createdAt), { addSuffix: true })
              : "Just now"}
          </span>
        </div>
      </div>
    </div>
  );
}
