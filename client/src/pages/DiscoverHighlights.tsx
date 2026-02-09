import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Play, Heart, Eye,
  Film, TrendingUp, Clock, Flame, ChevronUp, ChevronDown,
  Volume2, VolumeX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSport } from "@/components/SportToggle";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface DiscoverClip {
  id: number;
  playerId: number;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: number | null;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  playerName: string;
  playerPhoto: string | null;
  playerPosition: string;
  playerTeam: string | null;
  playerCity: string | null;
  playerState: string | null;
}

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function ClipCard({ clip, isActive, onPlay }: { clip: DiscoverClip; isActive: boolean; onPlay: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(clip.likeCount);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/highlight-clips/${clip.id}/like`);
      return res.json();
    },
    onSuccess: (data) => {
      setLiked(true);
      setLocalLikeCount(data.likeCount);
    },
    onError: () => {
      toast({ title: "Sign in to like clips", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        setIsPlaying(false);
      }
    }
  }, [isActive]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  const location = [clip.playerCity, clip.playerState].filter(Boolean).join(', ');

  return (
    <div 
      className="relative w-full bg-black rounded-2xl overflow-hidden snap-start"
      style={{ height: "calc(100vh - 200px)", maxHeight: "700px", minHeight: "400px" }}
      data-testid={`clip-card-${clip.id}`}
    >
      <video
        ref={videoRef}
        src={clip.videoUrl}
        className="absolute inset-0 w-full h-full object-cover"
        loop
        muted={isMuted}
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
        poster={clip.thumbnailUrl || undefined}
        data-testid={`video-${clip.id}`}
      />

      <AnimatePresence>
        {!isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/30 z-10"
            onClick={togglePlay}
          >
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-20">
        <div 
          className="h-full bg-primary transition-all duration-100" 
          style={{ width: `${progress}%` }} 
        />
      </div>

      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-20">
        <div className="flex flex-col items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => !liked && !likeMutation.isPending && likeMutation.mutate()}
            disabled={liked || likeMutation.isPending}
            className={cn(
              "w-11 h-11 rounded-full",
              liked ? "bg-red-500/30" : "bg-black/40 backdrop-blur-sm"
            )}
            data-testid={`button-like-${clip.id}`}
          >
            <Heart className={cn("w-6 h-6", liked ? "text-red-500 fill-red-500" : "text-white")} />
          </Button>
          <span className="text-xs text-white font-bold">{formatCount(localLikeCount)}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Eye className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs text-white font-bold">{formatCount(clip.viewCount)}</span>
        </div>

        <Button
          size="icon"
          variant="ghost"
          onClick={() => setIsMuted(!isMuted)}
          className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm"
          data-testid={`button-mute-${clip.id}`}
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
        </Button>
      </div>

      <div className="absolute bottom-0 left-0 right-16 p-4 z-20">
        <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent absolute inset-0 -top-20" />
        <div className="relative z-10">
          <Link href={`/players/${clip.playerId}`} data-testid={`link-player-${clip.playerId}`}>
            <div className="flex items-center gap-3 mb-2">
              <Avatar className="w-10 h-10 border-2 border-white/30">
                <AvatarImage src={clip.playerPhoto || undefined} />
                <AvatarFallback className="bg-primary/30 text-white text-sm font-bold">
                  {getInitials(clip.playerName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white font-bold text-sm">{clip.playerName}</p>
                <p className="text-white/60 text-xs">
                  {clip.playerPosition}{clip.playerTeam ? ` - ${clip.playerTeam}` : ''}
                  {location ? ` - ${location}` : ''}
                </p>
              </div>
            </div>
          </Link>
          <h3 className="text-white font-bold text-base mb-1">{clip.title}</h3>
          {clip.description && (
            <p className="text-white/70 text-sm line-clamp-2">{clip.description}</p>
          )}
          <p className="text-white/40 text-xs mt-1">
            {clip.createdAt ? formatDistanceToNow(new Date(clip.createdAt), { addSuffix: true }) : ''}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DiscoverHighlights() {
  const sport = useSport();
  const [sort, setSort] = useState<string>("recent");
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery<{ items: DiscoverClip[]; hasMore: boolean }>({
    queryKey: ['/api/discover/highlights', sport, sort],
    queryFn: async () => {
      const params = new URLSearchParams({ sport, sort, limit: '20' });
      const res = await fetch(`/api/discover/highlights?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const clips = data?.items || [];

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const children = container.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const rect = child.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      if (rect.top >= containerRect.top && rect.top < containerRect.top + containerRect.height / 2) {
        setActiveIndex(i);
        break;
      }
    }
  }, []);

  const goToClip = (direction: 'up' | 'down') => {
    if (!scrollRef.current) return;
    const newIndex = direction === 'up' 
      ? Math.max(0, activeIndex - 1) 
      : Math.min(clips.length - 1, activeIndex + 1);
    setActiveIndex(newIndex);
    const children = scrollRef.current.children;
    if (children[newIndex]) {
      (children[newIndex] as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="pb-24 md:pb-8 space-y-4">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-black/60 via-purple-950/20 to-black/60 border border-purple-500/20">
        <div className="absolute inset-0 cyber-grid opacity-20" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 blur-[100px] rounded-full" />
        
        <div className="relative z-10 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-purple-400" style={{ filter: "drop-shadow(0 0 8px #a855f7)" }} />
                <span className="text-xs uppercase tracking-wider text-purple-400 font-semibold">Discover</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold" data-testid="text-discover-title">
                <span className="bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                  Highlight Reels
                </span>
              </h2>
              <p className="text-muted-foreground">
                Browse the best plays from athletes across the platform
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[140px] bg-black/20 border-white/10" data-testid="select-sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      Recent
                    </div>
                  </SelectItem>
                  <SelectItem value="popular">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3 h-3" />
                      Most Viewed
                    </div>
                  </SelectItem>
                  <SelectItem value="liked">
                    <div className="flex items-center gap-2">
                      <Flame className="w-3 h-3" />
                      Most Liked
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          <p className="text-muted-foreground">Loading highlights...</p>
        </div>
      ) : clips.length === 0 ? (
        <Card className="p-12 text-center bg-gradient-to-br from-black/60 to-black/30 border-white/10">
          <Film className="w-16 h-16 mx-auto text-purple-400/30 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Highlights Yet</h3>
          <p className="text-muted-foreground mb-4">
            Be the first to upload a highlight clip and showcase your skills!
          </p>
          <Link href="/highlights">
            <Button data-testid="button-upload-first">Upload Your First Clip</Button>
          </Link>
        </Card>
      ) : (
        <div className="relative">
          <div className="hidden md:flex absolute right-4 top-4 z-30 flex-col gap-2">
            <Button 
              size="icon" 
              variant="ghost"
              onClick={() => goToClip('up')} 
              disabled={activeIndex === 0}
              className="bg-black/40 backdrop-blur-sm border border-white/10"
              data-testid="button-prev-clip"
            >
              <ChevronUp className="w-5 h-5" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost"
              onClick={() => goToClip('down')} 
              disabled={activeIndex === clips.length - 1}
              className="bg-black/40 backdrop-blur-sm border border-white/10"
              data-testid="button-next-clip"
            >
              <ChevronDown className="w-5 h-5" />
            </Button>
          </div>

          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="snap-y snap-mandatory overflow-y-auto space-y-4 rounded-2xl"
            style={{ maxHeight: "calc(100vh - 200px)" }}
          >
            {clips.map((clip, index) => (
              <ClipCard
                key={clip.id}
                clip={clip}
                isActive={index === activeIndex}
                onPlay={() => setActiveIndex(index)}
              />
            ))}
          </div>

          <div className="absolute left-4 top-4 z-30">
            <Badge className="bg-black/60 backdrop-blur-sm border-white/10 text-white text-xs">
              {activeIndex + 1} / {clips.length}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}
