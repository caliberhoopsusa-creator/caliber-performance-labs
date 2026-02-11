import { useState } from "react";
import { Upload, Film, X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@/hooks/use-upload";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Game } from "@shared/schema";

interface UploadClipModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: number;
  games?: Game[];
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export function UploadClipModal({
  isOpen,
  onClose,
  playerId,
  games = [],
}: UploadClipModalProps) {
  const { toast } = useToast();
  const { uploadFile, isUploading, progress } = useUpload();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      setError("Please select a valid video file (MP4, WebM, or MOV)");
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File size must be less than 50MB");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedFile) {
      setError("Please select a video file");
      return;
    }

    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadResponse = await uploadFile(selectedFile);
      
      if (!uploadResponse) {
        throw new Error("Failed to upload video");
      }

      await apiRequest("POST", "/api/highlight-clips", {
        playerId,
        title: title.trim(),
        description: description.trim() || undefined,
        videoUrl: uploadResponse.objectPath,
        gameId: selectedGameId ? parseInt(selectedGameId) : undefined,
      });

      toast({
        title: "Clip Uploaded!",
        description: "Your highlight clip has been uploaded successfully",
      });

      queryClient.invalidateQueries({ queryKey: [`/api/players/${playerId}/highlight-clips`] });

      handleClose();
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload clip");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setSelectedGameId("");
    setSelectedFile(null);
    setError(null);
    onClose();
  };

  const isLoading = isUploading || isSubmitting;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl uppercase tracking-wide">
            <Film className="w-5 h-5 text-accent" />
            Upload Highlight Clip
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="video-file">Video File</Label>
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                selectedFile
                  ? "border-accent/50 bg-accent/5"
                  : "border-border hover:border-accent/30"
              }`}
            >
              <input
                type="file"
                id="video-file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleFileChange}
                disabled={isLoading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                data-testid="input-video-file"
              />

              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <Film className="w-8 h-8 text-accent" />
                  <div className="text-left">
                    <p className="font-medium text-white">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="ml-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click or drag to upload video
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    MP4, WebM, MOV (max 50MB)
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter clip title"
              disabled={isLoading}
              data-testid="input-clip-title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your highlight..."
              rows={3}
              disabled={isLoading}
              data-testid="input-clip-description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="game">Link to Game (Optional)</Label>
            <Select
              value={selectedGameId}
              onValueChange={setSelectedGameId}
              disabled={isLoading || games.length === 0}
            >
              <SelectTrigger data-testid="select-game">
                <SelectValue placeholder={games.length === 0 ? "No games available" : "Select a game"} />
              </SelectTrigger>
              <SelectContent>
                {games.length === 0 ? (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No games logged yet. Log a game first to link highlights.
                  </div>
                ) : (
                  games.map((game) => (
                    <SelectItem key={game.id} value={game.id.toString()}>
                      vs {game.opponent} - {game.date}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {isLoading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Uploading...</span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={isLoading}
              data-testid="button-cancel-upload"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 gap-2"
              disabled={isLoading || !selectedFile || !title.trim()}
              data-testid="button-submit-upload"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Clip
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
