import { Play, Eye, Trash2, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import type { HighlightClip } from "@shared/schema";

interface HighlightClipCardProps {
  clip: HighlightClip;
  isOwner?: boolean;
  onPlay: () => void;
  onDelete?: () => void;
  className?: string;
  viewMode?: "grid" | "large";
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
  viewMode = "grid",
}: HighlightClipCardProps) {
  return (
    <div
      data-testid={`highlight-clip-card-${clip.id}`}
      className={cn(
        "relative overflow-hidden rounded-xl group cursor-pointer",
        "bg-gradient-to-br from-black/60 to-black/30",
        "border border-white/10 hover:border-accent/40",
        "transition-all duration-300 hover:scale-[1.02]",
        "shadow-lg hover:shadow-accent/20",
        className
      )}
      style={{ boxShadow: "0 0 0 1px rgba(234,88,12,0)" }}
      onClick={onPlay}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 0 30px rgba(234,88,12,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 0 0 1px rgba(234,88,12,0)";
      }}
    >
      <div className={cn(
        "relative overflow-hidden",
        viewMode === "large" ? "aspect-video" : "aspect-video"
      )}>
        {clip.thumbnailUrl ? (
          <img
            src={clip.thumbnailUrl}
            alt={clip.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/10 to-purple-500/5">
            <div className="relative">
              <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full" />
              <Play className="w-16 h-16 text-accent/50 relative z-10" />
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/10 transition-colors duration-300 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-accent flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300 shadow-lg">
            <Play className="w-7 h-7 text-white fill-current ml-1" />
          </div>
        </div>

        {clip.duration && (
          <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md flex items-center gap-1 border border-white/10">
            <Clock className="w-3 h-3 text-accent" />
            {formatDuration(clip.duration)}
          </div>
        )}

        {(clip.viewCount || 0) > 100 && (
          <Badge className="absolute top-3 left-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-[10px] font-bold px-2 py-0.5 border-0">
            <Sparkles className="w-3 h-3 mr-1" />
            Popular
          </Badge>
        )}

        {isOwner && onDelete && (
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/60 backdrop-blur-sm hover:bg-red-500/80 text-white border border-white/10 hover:border-red-500/50"
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

      <div className="p-4 space-y-2">
        <h3 className="font-bold text-white line-clamp-1 group-hover:text-accent transition-colors duration-300">
          {clip.title}
        </h3>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5">
            <Eye className="w-3 h-3 text-accent" />
            <span data-testid={`text-view-count-${clip.id}`}>
              {clip.viewCount.toLocaleString()} views
            </span>
          </div>
          
          <span className="text-muted-foreground/70">
            {clip.createdAt
              ? formatDistanceToNow(new Date(clip.createdAt), { addSuffix: true })
              : "Just now"}
          </span>
        </div>
      </div>
    </div>
  );
}
