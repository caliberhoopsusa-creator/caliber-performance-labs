import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Camera, Plus, User, X, ChevronLeft, ChevronRight, Eye, Heart, Flame, Trophy, Star, Zap, ThumbsUp, Upload, Image, Video, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { Player, PlayerStory } from "@shared/schema";

function generateSessionId(): string {
  let sessionId = localStorage.getItem("caliber_session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("caliber_session_id", sessionId);
  }
  return sessionId;
}

type StoryWithPlayer = PlayerStory & { playerName: string };

const REACTIONS = [
  { key: 'fire', icon: Flame, label: 'Fire', color: 'text-accent' },
  { key: 'heart', icon: Heart, label: 'Love', color: 'text-red-400' },
  { key: 'clap', icon: ThumbsUp, label: 'Nice', color: 'text-blue-400' },
  { key: 'trophy', icon: Trophy, label: 'Winner', color: 'text-yellow-400' },
  { key: 'star', icon: Star, label: 'Star', color: 'text-purple-400' },
  { key: 'goat', icon: Zap, label: 'GOAT', color: 'text-emerald-400' },
];

function StorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-2" data-testid="skeleton-story-ring">
      <Skeleton className="h-16 w-16 rounded-full" />
      <Skeleton className="h-3 w-12" />
    </div>
  );
}

function StoryRing({ 
  story, 
  onClick, 
  isViewed 
}: { 
  story: StoryWithPlayer; 
  onClick: () => void; 
  isViewed: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      className="flex flex-col items-center gap-1 group"
      data-testid={`story-ring-${story.id}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <motion.div 
        className={cn(
          "relative p-[3px] rounded-full transition-all duration-300",
          isViewed 
            ? "bg-gradient-to-tr from-gray-500 to-gray-600" 
            : "bg-gradient-to-tr from-accent via-accent to-accent"
        )}
        animate={!isViewed ? { boxShadow: [
          "0 0 0 0 rgba(234, 88, 12, 0.4)",
          "0 0 0 8px rgba(234, 88, 12, 0.2)",
          "0 0 0 12px rgba(234, 88, 12, 0)"
        ]} : {}}
        transition={!isViewed ? { duration: 2, repeat: Infinity } : {}}
      >
        <div className="bg-background p-[2px] rounded-full">
          <motion.div 
            className="w-14 h-14 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center overflow-hidden"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            {story.imageUrl ? (
              <img src={story.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" width={56} height={56} />
            ) : (
              <User className="w-6 h-6 text-accent" />
            )}
          </motion.div>
        </div>
        {story.mediaType === 'video' && (
          <motion.div 
            className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-background"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <Video className="w-3 h-3 text-white" />
          </motion.div>
        )}
      </motion.div>
      <motion.span 
        className={cn(
          "text-xs font-medium truncate max-w-[70px]",
          isViewed ? "text-muted-foreground" : "text-white"
        )}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {story.playerName.split(' ')[0]}
      </motion.span>
    </motion.button>
  );
}

function StoryViewer({
  stories,
  initialIndex,
  onClose,
  sessionId,
}: {
  stories: StoryWithPlayer[];
  initialIndex: number;
  onClose: () => void;
  sessionId: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [showReactions, setShowReactions] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [mediaError, setMediaError] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const currentStory = stories[currentIndex];

  useEffect(() => {
    setMediaLoading(true);
    setMediaError(false);
  }, [currentIndex]);

  const viewMutation = useMutation({
    mutationFn: async (storyId: number) => {
      await apiRequest("POST", `/api/stories/${storyId}/view`, { sessionId });
    },
  });

  const reactionMutation = useMutation({
    mutationFn: async ({ storyId, reaction }: { storyId: number; reaction: string }) => {
      const res = await apiRequest("POST", `/api/stories/${storyId}/reactions`, { sessionId, reaction });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Reaction sent!" });
      setShowReactions(false);
    },
    onError: () => {
      toast({ title: "Couldn't send reaction", description: "Please try again", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (currentStory) {
      viewMutation.mutate(currentStory.id);
    }
  }, [currentStory?.id]);

  useEffect(() => {
    setProgress(0);
    const duration = currentStory?.mediaType === 'video' ? 15000 : 5000;
    const interval = 50;
    const increment = (interval / duration) * 100;

    timerRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          goNext();
          return 0;
        }
        return prev + increment;
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex]);

  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const handleReaction = (reaction: string) => {
    if (currentStory) {
      reactionMutation.mutate({ storyId: currentStory.id, reaction });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goPrev, goNext]);

  if (!stories || stories.length === 0 || !currentStory) return null;

  const parsedStats: { points?: number; rebounds?: number; assists?: number } | null = (() => {
    try {
      return currentStory.stats ? JSON.parse(currentStory.stats) : null;
    } catch {
      return null;
    }
  })();

  return (
    <div 
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
      onClick={(e) => {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x < rect.width / 3) {
          goPrev();
        } else if (x > (rect.width * 2) / 3) {
          goNext();
        }
      }}
      data-testid="story-viewer"
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        data-testid="button-close-story"
        aria-label="Close story viewer"
      >
        <X className="w-6 h-6" />
      </Button>

      <div className="absolute top-4 left-4 right-16 flex gap-1 z-10">
        {stories.map((_, idx) => (
          <div key={idx} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
            <motion.div 
              className="h-full bg-accent rounded-full shadow-[0_0_10px_rgba(234,88,12,0.6)]"
              style={{ 
                width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%' 
              }}
              transition={{ duration: 0.05, ease: "linear" }}
            />
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={currentStory.id}
          className="absolute top-12 left-4 flex items-center gap-3 z-10"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div 
            className="w-10 h-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center overflow-hidden"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
          >
            <User className="w-5 h-5 text-accent" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <p className="text-white font-semibold text-sm">{currentStory.playerName}</p>
            <p className="text-white/60 text-xs">
              {formatDistanceToNow(new Date(currentStory.createdAt!), { addSuffix: true })}
            </p>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div 
          key={currentStory.id}
          className="absolute inset-x-0 bottom-0 top-24 flex flex-col items-center justify-center p-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {mediaError ? (
            <motion.div
              className="flex flex-col items-center justify-center gap-4 p-8 bg-white/5 rounded-lg"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              data-testid="story-media-error"
            >
              <Image className="w-16 h-16 text-muted-foreground/50" />
              <p className="text-white/60 text-sm">Media failed to load</p>
            </motion.div>
          ) : (
            <>
              {currentStory.mediaType === 'image' && currentStory.imageUrl && (
                <div className="relative">
                  {mediaLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Skeleton className="max-h-[60vh] w-64 h-96 rounded-lg" />
                    </div>
                  )}
                  <motion.img 
                    src={currentStory.imageUrl} 
                    alt={currentStory.headline}
                    className={cn(
                      "max-h-[60vh] max-w-full object-contain rounded-lg",
                      mediaLoading && "opacity-0"
                    )}
                    data-testid="story-image"
                    loading="lazy"
                    onLoad={() => setMediaLoading(false)}
                    onError={() => { setMediaLoading(false); setMediaError(true); }}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: mediaLoading ? 0.9 : 1, opacity: mediaLoading ? 0 : 1 }}
                    transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
                  />
                </div>
              )}

              {currentStory.mediaType === 'video' && currentStory.videoUrl && (
                <div className="relative">
                  {mediaLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Skeleton className="max-h-[60vh] w-64 h-96 rounded-lg" />
                    </div>
                  )}
                  <motion.video
                    src={currentStory.videoUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className={cn(
                      "max-h-[60vh] max-w-full object-contain rounded-lg",
                      mediaLoading && "opacity-0"
                    )}
                    data-testid="story-video"
                    onLoadedData={() => setMediaLoading(false)}
                    onError={() => { setMediaLoading(false); setMediaError(true); }}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: mediaLoading ? 0.9 : 1, opacity: mediaLoading ? 0 : 1 }}
                    transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
                  />
                </div>
              )}

              {currentStory.mediaType === 'text' && (
                <motion.div
                  className="flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Star className="w-24 h-24 text-accent/40" />
                </motion.div>
              )}
            </>
          )}

          <motion.div 
            className="mt-4 text-center max-w-md"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-white mb-2">{currentStory.headline}</h2>
            {currentStory.caption && (
              <p className="text-white/80 text-sm mb-4">{currentStory.caption}</p>
            )}

            {parsedStats && (
              <motion.div 
                className="flex justify-center gap-6 mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                {parsedStats.points !== undefined && (
                  <motion.div 
                    className="text-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.35, type: "spring", stiffness: 300 }}
                  >
                    <p className="text-3xl font-bold text-accent">{parsedStats.points}</p>
                    <p className="text-xs text-white/60 uppercase">Points</p>
                  </motion.div>
                )}
                {parsedStats.rebounds !== undefined && (
                  <motion.div 
                    className="text-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
                  >
                    <p className="text-3xl font-bold text-accent">{parsedStats.rebounds}</p>
                    <p className="text-xs text-white/60 uppercase">Rebounds</p>
                  </motion.div>
                )}
                {parsedStats.assists !== undefined && (
                  <motion.div 
                    className="text-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.45, type: "spring", stiffness: 300 }}
                  >
                    <p className="text-3xl font-bold text-accent">{parsedStats.assists}</p>
                    <p className="text-xs text-white/60 uppercase">Assists</p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </motion.div>

          <motion.div 
            className="flex items-center gap-2 text-white/60 text-sm mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.3 }}
          >
            <Eye className="w-4 h-4" />
            <span>{currentStory.viewCount || 0} views</span>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <motion.div 
        className="absolute bottom-8 left-0 right-0 px-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <AnimatePresence mode="wait">
          {showReactions ? (
            <motion.div 
              key="reactions"
              className="flex justify-center gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-full mx-auto max-w-md" 
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {REACTIONS.map(({ key, icon: Icon, label, color }, idx) => (
                <motion.button
                  key={key}
                  onClick={() => handleReaction(key)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  title={label}
                  aria-label={label}
                  data-testid={`reaction-${key}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: idx * 0.05, type: "spring", stiffness: 400 }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Icon className={cn("w-6 h-6", color)} />
                </motion.button>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="react-button"
              className="flex justify-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); setShowReactions(true); }}
                data-testid="button-show-reactions"
              >
                <Heart className="w-5 h-5 mr-2" />
                React
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.button
        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-white/60 hover:text-white"
        onClick={(e) => { e.stopPropagation(); goPrev(); }}
        data-testid="button-prev-story"
        aria-label="Previous story"
        whileHover={{ scale: 1.1, color: "rgba(255, 255, 255, 1)" }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        <ChevronLeft className="w-8 h-8" />
      </motion.button>

      <motion.button
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/60 hover:text-white"
        onClick={(e) => { e.stopPropagation(); goNext(); }}
        data-testid="button-next-story"
        aria-label="Next story"
        whileHover={{ scale: 1.1, color: "rgba(255, 255, 255, 1)" }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        <ChevronRight className="w-8 h-8" />
      </motion.button>
    </div>
  );
}

function CreateStoryDialog({
  open,
  onOpenChange,
  players,
  sessionId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  players: Player[];
  sessionId: string;
}) {
  const { toast } = useToast();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [headline, setHeadline] = useState("");
  const [caption, setCaption] = useState("");
  const [mediaType, setMediaType] = useState<"text" | "image" | "video">("text");
  const [mediaUrl, setMediaUrl] = useState("");
  const [expiresIn24h, setExpiresIn24h] = useState(true);
  const [points, setPoints] = useState("");
  const [rebounds, setRebounds] = useState("");
  const [assists, setAssists] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createStoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/stories", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories/active"] });
      resetForm();
      onOpenChange(false);
      toast({ title: "Story Created", description: "Your story is now live!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create story", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setSelectedPlayerId("");
    setHeadline("");
    setCaption("");
    setMediaType("text");
    setMediaUrl("");
    setExpiresIn24h(true);
    setPoints("");
    setRebounds("");
    setAssists("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const urlRes = await fetch('/api/uploads/request-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type || 'application/octet-stream',
        }),
      });

      if (!urlRes.ok) throw new Error('Failed to get upload URL');

      const { uploadURL, objectPath } = await urlRes.json();

      const uploadRes = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });

      if (!uploadRes.ok) throw new Error('Upload failed');

      setMediaUrl(objectPath);
      setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
      toast({ title: "Uploaded!", description: "Media uploaded successfully" });
    } catch (err) {
      toast({ title: "Upload Failed", description: "Could not upload media", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId || !headline.trim()) {
      toast({ title: "Missing Fields", description: "Please select a player and enter a headline", variant: "destructive" });
      return;
    }

    const stats: { points?: number; rebounds?: number; assists?: number } = {};
    if (points) stats.points = Number(points);
    if (rebounds) stats.rebounds = Number(rebounds);
    if (assists) stats.assists = Number(assists);

    createStoryMutation.mutate({
      playerId: Number(selectedPlayerId),
      headline: headline.trim(),
      caption: caption.trim() || null,
      mediaType,
      imageUrl: mediaType === 'image' ? mediaUrl : null,
      videoUrl: mediaType === 'video' ? mediaUrl : null,
      stats: Object.keys(stats).length > 0 ? stats : undefined,
      sessionId,
      isPublic: true,
      expiresIn24h,
    });
  };

  const canSubmit = selectedPlayerId && headline.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white uppercase tracking-wide">
            <Plus className="w-5 h-5 text-accent" />
            Create Story
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="player" className="text-sm font-semibold text-white uppercase tracking-wide">
              Player *
            </Label>
            <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
              <SelectTrigger id="player" data-testid="select-player">
                <SelectValue placeholder="Select a player" />
              </SelectTrigger>
              <SelectContent>
                {players.map((player) => (
                  <SelectItem key={player.id} value={player.id.toString()}>
                    {player.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-white uppercase tracking-wide">
              Media Type
            </Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mediaType === 'text' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setMediaType('text'); setMediaUrl(''); }}
                data-testid="button-media-text"
              >
                <Star className="w-4 h-4 mr-1" /> Text Only
              </Button>
              <Button
                type="button"
                variant={mediaType === 'image' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMediaType('image')}
                data-testid="button-media-image"
              >
                <Image className="w-4 h-4 mr-1" /> Photo
              </Button>
              <Button
                type="button"
                variant={mediaType === 'video' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMediaType('video')}
                data-testid="button-media-video"
              >
                <Video className="w-4 h-4 mr-1" /> Video
              </Button>
            </div>
          </div>

          {(mediaType === 'image' || mediaType === 'video') && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-white uppercase tracking-wide">
                Upload {mediaType === 'image' ? 'Photo' : 'Video'}
              </Label>
              
              <input
                ref={fileInputRef}
                type="file"
                accept={mediaType === 'image' ? 'image/*' : 'video/*'}
                className="hidden"
                onChange={handleFileUpload}
              />

              {mediaUrl ? (
                <div className="relative">
                  {mediaType === 'image' ? (
                    <img src={mediaUrl} alt="Preview" className="w-full h-48 object-cover rounded-lg" loading="lazy" />
                  ) : (
                    <video src={mediaUrl} className="w-full h-48 object-cover rounded-lg" controls />
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => setMediaUrl('')}
                    data-testid="button-remove-media"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-32 border-dashed"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  data-testid="button-upload-media"
                >
                  {isUploading ? (
                    <span className="animate-pulse">Uploading...</span>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <span className="text-muted-foreground">Click to upload</span>
                    </div>
                  )}
                </Button>
              )}

              <div className="text-center text-xs text-muted-foreground">
                or paste URL:
              </div>
              <Input
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder={`Paste ${mediaType} URL...`}
                data-testid="input-media-url"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="headline" className="text-sm font-semibold text-white uppercase tracking-wide">
              Headline *
            </Label>
            <Input
              id="headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="What's the story?"
              data-testid="input-headline"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="caption" className="text-sm font-semibold text-white uppercase tracking-wide">
              Caption
            </Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              rows={2}
              data-testid="input-caption"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-white uppercase tracking-wide">
              Stats (Optional)
            </Label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="points" className="text-xs text-muted-foreground">Points</Label>
                <Input
                  id="points"
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  placeholder="0"
                  min="0"
                  data-testid="input-points"
                />
              </div>
              <div>
                <Label htmlFor="rebounds" className="text-xs text-muted-foreground">Rebounds</Label>
                <Input
                  id="rebounds"
                  type="number"
                  value={rebounds}
                  onChange={(e) => setRebounds(e.target.value)}
                  placeholder="0"
                  min="0"
                  data-testid="input-rebounds"
                />
              </div>
              <div>
                <Label htmlFor="assists" className="text-xs text-muted-foreground">Assists</Label>
                <Input
                  id="assists"
                  type="number"
                  value={assists}
                  onChange={(e) => setAssists(e.target.value)}
                  placeholder="0"
                  min="0"
                  data-testid="input-assists"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-white">Expires in 24 hours</span>
            </div>
            <Switch
              checked={expiresIn24h}
              onCheckedChange={setExpiresIn24h}
              data-testid="switch-expires"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!canSubmit || createStoryMutation.isPending}
            data-testid="button-submit-story"
          >
            {createStoryMutation.isPending ? (
              "Creating..."
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Publish Story
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function StoriesContent() {
  const { toast } = useToast();
  const sessionId = generateSessionId();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewedStories, setViewedStories] = useState<Set<number>>(() => {
    const stored = localStorage.getItem("caliber_viewed_stories");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  const { data: stories = [], isLoading: storiesLoading } = useQuery<StoryWithPlayer[]>({
    queryKey: ["/api/stories/active"],
  });

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const markAsViewed = (storyId: number) => {
    setViewedStories(prev => {
      const next = new Set(prev);
      next.add(storyId);
      localStorage.setItem("caliber_viewed_stories", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const openViewerById = (storyId: number) => {
    const index = stories.findIndex(s => s.id === storyId);
    if (index >= 0) {
      setViewerStartIndex(index);
      setViewerOpen(true);
      markAsViewed(storyId);
    }
  };

  const openViewer = (index: number) => {
    setViewerStartIndex(index);
    setViewerOpen(true);
    if (stories[index]) {
      markAsViewed(stories[index].id);
    }
  };

  const groupedStories = stories.reduce((acc, story) => {
    const existing = acc.find(s => s.playerId === story.playerId);
    if (!existing) {
      acc.push(story);
    }
    return acc;
  }, [] as StoryWithPlayer[]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="page-stories">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold bg-gradient-to-b from-white to-accent/20 bg-clip-text text-transparent tracking-wide flex items-center gap-3">
            <Camera className="w-8 h-8 text-accent" />
            Stories
          </h1>
          <p className="text-accent/50 font-medium mt-1">
            Share your highlights with photos and videos
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} data-testid="button-create-story">
          <Plus className="w-4 h-4 mr-2" />
          Create Story
        </Button>
      </div>

      <section data-testid="section-story-rings">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          Active Stories
        </h2>
        {storiesLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            <StorySkeleton />
            <StorySkeleton />
            <StorySkeleton />
            <StorySkeleton />
          </div>
        ) : stories.length === 0 ? (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            data-testid="empty-stories"
          >
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-accent/60" />
            </div>
            <p className="text-white font-display font-semibold mb-1">No stories yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Be the first to share a story!
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Story
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-accent/20 scroll-snap-x-mandatory touch-pan-x" 
            data-testid="stories-scroll"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {groupedStories.map((story, idx) => (
              <motion.div
                key={story.id}
                className="snap-start"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.3 }}
              >
                <StoryRing
                  story={story}
                  onClick={() => openViewerById(story.id)}
                  isViewed={viewedStories.has(story.id)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      <section data-testid="section-recent-stories">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          Recent Stories
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {stories.map((story, idx) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
            >
              <Card
                className="cursor-pointer hover-elevate overflow-hidden"
                onClick={() => openViewer(idx)}
                data-testid={`card-story-${story.id}`}
              >
                <motion.div 
                  className="aspect-[3/4] relative"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {story.mediaType === 'image' && story.imageUrl ? (
                    <img src={story.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : story.mediaType === 'video' && story.videoUrl ? (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                      <Video className="w-12 h-12 text-blue-400" />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                      <Star className="w-12 h-12 text-accent/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <motion.div 
                    className="absolute bottom-0 left-0 right-0 p-3"
                    initial={{ y: 10, opacity: 0 }}
                    whileHover={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="text-white font-semibold text-sm truncate">{story.playerName}</p>
                    <p className="text-white/80 text-xs truncate">{story.headline}</p>
                    <div className="flex items-center gap-2 mt-1 text-white/60 text-xs">
                      <Eye className="w-3 h-3" />
                      <span>{story.viewCount || 0}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(story.createdAt!), { addSuffix: true })}</span>
                    </div>
                  </motion.div>
                </motion.div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {viewerOpen && stories.length > 0 && (
        <StoryViewer
          stories={stories}
          initialIndex={viewerStartIndex}
          onClose={() => setViewerOpen(false)}
          sessionId={sessionId}
        />
      )}

      <CreateStoryDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        players={players}
        sessionId={sessionId}
      />
    </div>
  );
}
