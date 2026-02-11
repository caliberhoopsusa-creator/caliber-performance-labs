import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Video, Trash2, Loader2, Film } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { HighlightClip } from "@shared/schema";

interface HighlightUploaderProps {
  gameId: number;
  playerId: number;
}

export function HighlightUploader({ gameId, playerId }: HighlightUploaderProps) {
  const { toast } = useToast();
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { data: highlights = [], isLoading: isLoadingHighlights } = useQuery<HighlightClip[]>({
    queryKey: [`/api/players/${playerId}/highlight-clips`],
  });

  const gameHighlights = highlights.filter(clip => clip.gameId === gameId);

  const deleteClipMutation = useMutation({
    mutationFn: async (clipId: number) => {
      await apiRequest("DELETE", `/api/highlight-clips/${clipId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/players/${playerId}/highlight-clips`] });
      toast({
        title: "Highlight deleted",
        description: "The highlight clip has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete highlight clip.",
        variant: "destructive",
      });
    },
  });

  const handleSaveHighlight = async () => {
    if (!uploadedVideoUrl || !title.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a title for your highlight.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await apiRequest("POST", "/api/highlight-clips", {
        gameId,
        playerId,
        title: title.trim(),
        description: description.trim() || undefined,
        videoUrl: uploadedVideoUrl,
      });

      queryClient.invalidateQueries({ queryKey: [`/api/players/${playerId}/highlight-clips`] });
      setUploadedVideoUrl(null);
      setTitle("");
      setDescription("");
      toast({
        title: "Highlight saved!",
        description: "Your highlight clip has been added.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save highlight clip.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold font-display text-foreground flex items-center gap-2">
        <Film className="w-5 h-5 text-accent" /> Game Highlights
      </h3>

      <div className="bg-secondary/20 backdrop-blur-sm p-5 rounded-xl border border-border space-y-4">
        {uploadedVideoUrl ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-green-400">
              <Video className="w-4 h-4" />
              Video uploaded successfully!
            </div>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                  Highlight Title *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Game-winning three pointer"
                  className="bg-secondary/30 border-border text-foreground"
                  data-testid="input-highlight-title"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                  Description (optional)
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details about this highlight..."
                  className="bg-secondary/30 border-border text-foreground min-h-[80px]"
                  data-testid="input-highlight-description"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSaveHighlight}
                  disabled={isSaving || !title.trim()}
                  className="flex-1"
                  data-testid="button-save-highlight"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Highlight"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setUploadedVideoUrl(null);
                    setTitle("");
                    setDescription("");
                  }}
                  className="border-border text-foreground"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div data-testid="button-upload-highlight">
            <ObjectUploader
              maxNumberOfFiles={1}
              maxFileSize={104857600}
              onGetUploadParameters={async (file) => {
                const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
                if (!allowedTypes.includes(file.type)) {
                  throw new Error('Only MP4, MOV, and WebM videos are allowed');
                }

                const res = await fetch("/api/uploads/request-url", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: file.name,
                    size: file.size,
                    contentType: file.type,
                  }),
                });

                if (!res.ok) {
                  throw new Error('Failed to get upload URL');
                }

                const { uploadURL, objectPath } = await res.json();
                (file as any).__objectPath = objectPath;

                return {
                  method: "PUT" as const,
                  url: uploadURL,
                  headers: { "Content-Type": file.type },
                };
              }}
              onComplete={(result) => {
                if (result.successful && result.successful.length > 0) {
                  const file = result.successful[0];
                  let objectPath = (file as any).__objectPath || file.uploadURL;
                  if (objectPath && !objectPath.startsWith('/objects/')) {
                    objectPath = `/objects/${objectPath.replace(/^\/+/, '')}`;
                  }
                  setUploadedVideoUrl(objectPath);
                }
              }}
              buttonClassName="w-full bg-secondary/50 border border-dashed border-border hover:bg-secondary/70 hover:border-accent/50 text-foreground h-16"
            >
              <span className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                Upload Highlight Video
              </span>
            </ObjectUploader>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Supported formats: MP4, MOV, WebM • Max size: 100MB
        </p>
      </div>

      {isLoadingHighlights ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : gameHighlights.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            Uploaded Highlights ({gameHighlights.length})
          </h4>
          <div className="space-y-2">
            {gameHighlights.map((clip) => (
              <div
                key={clip.id}
                className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg border border-border/50"
                data-testid={`highlight-clip-${clip.id}`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Video className="w-4 h-4 text-accent shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{clip.title}</p>
                    {clip.description && (
                      <p className="text-xs text-muted-foreground truncate">{clip.description}</p>
                    )}
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteClipMutation.mutate(clip.id)}
                  disabled={deleteClipMutation.isPending}
                  className="text-muted-foreground shrink-0"
                  data-testid={`button-delete-highlight-${clip.id}`}
                >
                  {deleteClipMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
