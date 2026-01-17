import { useRef, useState, type ReactNode } from "react";
import html2canvas from "html2canvas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Copy, Share2, X } from "lucide-react";
import { SiX, SiFacebook } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  shareUrl?: string;
  shareText?: string;
  assetId?: string;
  children: ReactNode;
}

export function ShareModal({
  open,
  onOpenChange,
  title = "Share",
  shareUrl,
  shareText = "Check out my stats on Caliber!",
  assetId,
  children,
}: ShareModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const link = document.createElement('a');
      link.download = `caliber-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      if (assetId) {
        fetch(`/api/share-assets/${assetId}/shared`, { method: 'POST' }).catch(() => {});
      }
      
      toast({
        title: "Image Downloaded",
        description: "Your shareable card has been saved!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    const url = shareUrl || window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      
      if (assetId) {
        fetch(`/api/share-assets/${assetId}/shared`, { method: 'POST' }).catch(() => {});
      }
      
      toast({
        title: "Link Copied",
        description: "Share link copied to clipboard!",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const handleNativeShare = async () => {
    const url = shareUrl || window.location.href;
    const shareData = {
      title: title,
      text: shareText,
      url: url,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        
        if (assetId) {
          fetch(`/api/share-assets/${assetId}/shared`, { method: 'POST' }).catch(() => {});
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleTwitterShare = () => {
    const url = shareUrl || window.location.href;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
    
    if (assetId) {
      fetch(`/api/share-assets/${assetId}/shared`, { method: 'POST' }).catch(() => {});
    }
  };

  const handleFacebookShare = () => {
    const url = shareUrl || window.location.href;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank', 'width=550,height=420');
    
    if (assetId) {
      fetch(`/api/share-assets/${assetId}/shared`, { method: 'POST' }).catch(() => {});
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-fit p-0 gap-0 bg-card border-white/10 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-lg font-display uppercase tracking-wider">{title}</DialogTitle>
        </DialogHeader>
        
        <div className="p-4 pt-2">
          <div 
            ref={cardRef}
            className="rounded-lg overflow-hidden border border-white/10 shadow-2xl"
          >
            {children}
          </div>
        </div>
        
        <div className="p-4 pt-2 border-t border-white/10 bg-secondary/20">
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              onClick={handleDownload}
              disabled={isGenerating}
              className="gap-2"
              data-testid="button-download-image"
            >
              <Download className="w-4 h-4" />
              {isGenerating ? "Generating..." : "Download Image"}
            </Button>
            
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="gap-2"
              data-testid="button-copy-link"
            >
              <Copy className="w-4 h-4" />
              Copy Link
            </Button>
            
            <Button
              onClick={handleNativeShare}
              variant="outline"
              className="gap-2"
              data-testid="button-native-share"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
          
          <div className="flex justify-center gap-2 mt-3">
            <Button
              onClick={handleTwitterShare}
              variant="ghost"
              size="icon"
              className="hover:bg-white/10"
              data-testid="button-share-twitter"
            >
              <SiX className="w-5 h-5" />
            </Button>
            <Button
              onClick={handleFacebookShare}
              variant="ghost"
              size="icon"
              className="hover:bg-blue-600/20"
              data-testid="button-share-facebook"
            >
              <SiFacebook className="w-5 h-5 text-blue-400" />
            </Button>
          </div>
          
          <p className="text-[10px] text-center text-muted-foreground mt-3">
            Download the image and share it on Instagram or any platform!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
