import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Swords, Copy, Check, Share2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ChallengeData {
  challengeCode: string;
  challengerName: string;
  shareUrl: string;
  shareText: string;
}

export default function ChallengeButton() {
  const [showDialog, setShowDialog] = useState(false);
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/challenges/create");
      return res.json() as Promise<ChallengeData>;
    },
    onSuccess: (data) => {
      setChallengeData(data);
      setShowDialog(true);
    },
    onError: () => {
      toast({ title: "Error", description: "Could not create challenge. Make sure you have games logged.", variant: "destructive" });
    },
  });

  const handleCopy = async () => {
    if (!challengeData) return;
    const fullUrl = `${window.location.origin}${challengeData.shareUrl}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link Copied!", description: "Send this to a friend to challenge them." });
  };

  const handleShare = async () => {
    if (!challengeData) return;
    const fullUrl = `${window.location.origin}${challengeData.shareUrl}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Caliber Challenge",
          text: challengeData.shareText,
          url: fullUrl,
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => createMutation.mutate()}
        disabled={createMutation.isPending}
        className="gap-1.5 border-yellow-500/30 text-yellow-400"
        data-testid="button-create-challenge"
      >
        <Swords className="w-3 h-3" />
        Challenge a Friend
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-card border-white/10 max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Swords className="w-5 h-5 text-yellow-400" />
              Challenge Created!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share this link with a friend and see who has better stats!
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleCopy} className="flex-1 gap-2" data-testid="button-copy-challenge">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy Link"}
              </Button>
              <Button onClick={handleShare} variant="outline" className="gap-2" data-testid="button-share-challenge">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
