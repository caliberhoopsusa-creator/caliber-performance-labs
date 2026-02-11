import { useState } from "react";
import { Play, Eye, Heart, Share2, Sparkles, Film, MoreVertical, Trash2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { HighlightClip, Player } from "@shared/schema";

interface HighlightCardProps {
  clip: HighlightClip;
  player?: Player;
  onPlay?: (clip: HighlightClip) => void;
  onGenerateOverlay?: (clip: HighlightClip) => void;
  onDelete?: (clipId: number) => void;
  showActions?: boolean;
}

export function HighlightCard({
  clip,
  player,
  onPlay,
  onGenerateOverlay,
  onDelete,
  showActions = true,
}: HighlightCardProps) {
  const { toast } = useToast();
  const [isLiking, setIsLiking] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(clip.likeCount || 0);

  const likeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/highlights/${clip.id}/like`);
    },
    onMutate: () => {
      setIsLiking(true);
      setLocalLikeCount((prev) => prev + 1);
    },
    onError: () => {
      setLocalLikeCount((prev) => prev - 1);
      toast({
        title: "Error",
        description: "Failed to like highlight",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsLiking(false);
    },
  });

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/highlights/${clip.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: clip.title,
          text: clip.description || `Check out this highlight!`,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          await navigator.clipboard.writeText(shareUrl);
          toast({ title: "Link copied to clipboard" });
        }
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link copied to clipboard" });
    }
  };

  const overlayStyleLabel = {
    minimal: "Minimal",
    full: "Full Stats",
    animated: "Animated",
  }[clip.overlayStyle || "minimal"];

  const statsToFeature = clip.statsToFeature ? JSON.parse(clip.statsToFeature) : [];

  return (
    <Card className="group overflow-hidden bg-card/50 border-border hover-elevate transition-all duration-300">
      <div className="relative aspect-[9/16] bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
        {clip.thumbnailUrl ? (
          <img
            src={clip.thumbnailUrl}
            alt={clip.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Film className="w-16 h-16 text-accent/30" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        
        <button
          onClick={() => onPlay?.(clip)}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          data-testid={`button-play-highlight-${clip.id}`}
        >
          <div className="w-16 h-16 rounded-full bg-accent/90 flex items-center justify-center">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-3">
          {player && (
            <p className="text-xs text-white/70 mb-1 truncate">
              {player.name}
            </p>
          )}
          <h3 className="font-semibold text-white text-sm line-clamp-2 mb-2">
            {clip.title}
          </h3>

          {statsToFeature.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {statsToFeature.slice(0, 3).map((stat: string) => (
                <Badge
                  key={stat}
                  variant="secondary"
                  className="text-[10px] bg-accent/20 text-accent border-accent/30"
                >
                  {stat}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-white/60">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {(clip.viewCount || 0).toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {localLikeCount.toLocaleString()}
              </span>
            </div>
            {clip.overlayStyle && (
              <Badge variant="outline" className="text-[10px] border-accent/30 text-accent">
                {overlayStyleLabel}
              </Badge>
            )}
          </div>
        </div>

        {clip.duration && (
          <div className="absolute top-2 right-2 bg-black/70 px-1.5 py-0.5 rounded text-[10px] text-white">
            {Math.floor(clip.duration / 60)}:{(clip.duration % 60).toString().padStart(2, "0")}
          </div>
        )}
      </div>

      {showActions && (
        <CardContent className="p-2 flex items-center justify-between gap-1">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                isLiking && "text-red-500"
              )}
              onClick={() => likeMutation.mutate()}
              disabled={isLiking}
              data-testid={`button-like-highlight-${clip.id}`}
            >
              <Heart className={cn("w-4 h-4", isLiking && "fill-current")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleShare}
              data-testid={`button-share-highlight-${clip.id}`}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1 border-accent/30 text-accent hover:bg-accent/10"
              onClick={() => onGenerateOverlay?.(clip)}
              data-testid={`button-generate-overlay-${clip.id}`}
            >
              <Sparkles className="w-3 h-3" />
              Overlay
            </Button>
            
            {onDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    data-testid={`button-more-highlight-${clip.id}`}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete(clip.id)}
                    data-testid={`button-delete-highlight-${clip.id}`}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
