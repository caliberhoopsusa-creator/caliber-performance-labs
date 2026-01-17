import { useState } from "react";
import { Film, Plus, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { HighlightClipsGallery } from "@/components/HighlightClipsGallery";
import { UploadClipModal } from "@/components/UploadClipModal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { HighlightClip, Game, Player } from "@shared/schema";

interface ExtendedUser {
  id: string;
  playerId: number | null;
  role: string | null;
}

export default function HighlightClipsPage() {
  const { toast } = useToast();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const { data: user } = useQuery<ExtendedUser | null>({
    queryKey: ["/api/users/me"],
  });

  const playerId = user?.playerId;

  const { data: clips = [], isLoading: clipsLoading } = useQuery<HighlightClip[]>({
    queryKey: ["/api/players", playerId, "highlight-clips"],
    enabled: !!playerId,
  });

  const { data: player } = useQuery<Player & { games: Game[] }>({
    queryKey: ["/api/players", playerId],
    enabled: !!playerId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (clipId: number) => {
      await apiRequest("DELETE", `/api/highlight-clips/${clipId}`);
    },
    onSuccess: () => {
      toast({
        title: "Clip Deleted",
        description: "Your highlight clip has been removed",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/players", playerId, "highlight-clips"],
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete clip",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (clipId: number) => {
    if (window.confirm("Are you sure you want to delete this clip?")) {
      deleteMutation.mutate(clipId);
    }
  };

  if (!playerId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <Film className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="font-display text-2xl font-bold text-white uppercase tracking-wide mb-2">
          Highlights Unavailable
        </h2>
        <p className="text-muted-foreground max-w-md">
          Please complete your player profile setup to access highlight clips.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white uppercase tracking-wide flex items-center gap-3">
            <Film className="w-8 h-8 text-primary" />
            My Highlights
          </h1>
          <p className="text-muted-foreground mt-1">
            Showcase your best moments on the court
          </p>
        </div>

        <Button
          onClick={() => setIsUploadModalOpen(true)}
          className="gap-2"
          data-testid="button-upload-clip"
        >
          <Plus className="w-4 h-4" />
          Upload Clip
        </Button>
      </div>

      <HighlightClipsGallery
        clips={clips}
        games={player?.games || []}
        isLoading={clipsLoading}
        isOwner={true}
        onDelete={handleDelete}
      />

      <UploadClipModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        playerId={playerId}
        games={player?.games || []}
      />
    </div>
  );
}
