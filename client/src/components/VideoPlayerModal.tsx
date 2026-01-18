import { X, Share2, Eye, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { HighlightClip } from "@shared/schema";

interface VideoPlayerModalProps {
  clip: HighlightClip | null;
  isOpen: boolean;
  onClose: () => void;
}

export function VideoPlayerModal({ clip, isOpen, onClose }: VideoPlayerModalProps) {
  const { toast } = useToast();

  if (!clip) return null;

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/highlights?clipId=${clip.id}`;
    const shareData = {
      title: clip.title,
      text: clip.description || `Check out this highlight: ${clip.title}`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          copyToClipboard(shareUrl);
        }
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied!",
      description: "Share link copied to clipboard",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-full p-0 gap-0 bg-black/95 border-white/10">
        <div className="relative">
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
            onClick={onClose}
            data-testid="button-close-video-modal"
          >
            <X className="w-5 h-5" />
          </Button>

          <div className="aspect-video bg-black">
            <video
              src={clip.videoUrl}
              controls
              autoPlay
              className="w-full h-full"
              data-testid={`highlight-video-${clip.id}`}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>

        <div className="p-6 bg-card border-t border-white/10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="font-display text-2xl font-bold text-white uppercase tracking-wide mb-2">
                {clip.title}
              </h2>
              
              {clip.description && (
                <p className="text-muted-foreground text-sm mb-4">
                  {clip.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span data-testid="text-modal-view-count">
                    {clip.viewCount.toLocaleString()} views
                  </span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleShare}
              variant="outline"
              className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
              data-testid="button-share-clip"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
