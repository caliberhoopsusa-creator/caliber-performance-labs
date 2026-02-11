import { useState } from "react";
import { usePlayers, useShareGoal } from "@/hooks/use-basketball";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Share2, Loader2 } from "lucide-react";

interface ShareGoalModalProps {
  goalId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareGoalModal({ goalId, isOpen, onClose }: ShareGoalModalProps) {
  const { data: players = [], isLoading: playersLoading } = usePlayers();
  const shareGoal = useShareGoal();
  const { toast } = useToast();
  
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [message, setMessage] = useState("");

  const handleShare = async () => {
    if (!selectedPlayerId) {
      toast({
        title: "Select a player",
        description: "Please select a teammate to share this goal with",
        variant: "destructive",
      });
      return;
    }

    try {
      await shareGoal.mutateAsync({
        goalId,
        share: {
          sharedWithPlayerId: parseInt(selectedPlayerId),
          visibility: "private",
        },
      });
      
      toast({
        title: "Goal shared!",
        description: "Your goal has been shared with your teammate",
      });
      
      setSelectedPlayerId("");
      setMessage("");
      onClose();
    } catch (error) {
      toast({
        title: "Failed to share",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedPlayerId("");
      setMessage("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Share2 className="w-5 h-5 text-primary" />
            Share Goal
          </DialogTitle>
          <DialogDescription>
            Share this goal with a teammate to keep each other accountable
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="player">Share with Player</Label>
            {playersLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                <SelectTrigger data-testid="select-share-player">
                  <SelectValue placeholder="Select a teammate" />
                </SelectTrigger>
                <SelectContent>
                  {players.map((player) => (
                    <SelectItem 
                      key={player.id} 
                      value={player.id.toString()}
                      data-testid={`player-option-${player.id}`}
                    >
                      {player.name} {player.position && `(${player.position})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a note for your teammate..."
              className="resize-none"
              rows={3}
              data-testid="textarea-share-message"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            data-testid="button-cancel-share"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleShare}
            disabled={!selectedPlayerId || shareGoal.isPending}
            data-testid="button-confirm-share"
          >
            {shareGoal.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 mr-2" />
                Share Goal
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}