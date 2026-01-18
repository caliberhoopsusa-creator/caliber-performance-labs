import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Share2, 
  Volume2, 
  VolumeX,
  Film,
  ArrowLeft,
  Eye,
  Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { HighlightClip, Player, Game, Badge as BadgeType } from "@shared/schema";
import { format } from "date-fns";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ReelPage() {
  const { playerId } = useParams<{ playerId: string }>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const { data: player, isLoading: playerLoading } = useQuery<Player>({
    queryKey: [`/api/players/${playerId}`],
    enabled: !!playerId,
  });

  const { data: highlights = [], isLoading: highlightsLoading } = useQuery<HighlightClip[]>({
    queryKey: [`/api/players/${playerId}/highlight-clips`],
    enabled: !!playerId,
  });

  const { data: games = [] } = useQuery<Game[]>({
    queryKey: [`/api/players/${playerId}/games`],
    enabled: !!playerId,
  });

  const { data: badges = [] } = useQuery<BadgeType[]>({
    queryKey: [`/api/players/${playerId}/badges`],
    enabled: !!playerId,
  });

  const currentClip = highlights[currentIndex];

  const getGameInfo = (gameId: number | null) => {
    if (!gameId) return null;
    return games.find((g) => g.id === gameId);
  };

  const getClipBadges = (gameId: number | null) => {
    if (!gameId) return [];
    return badges.filter((b) => b.gameId === gameId);
  };

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, currentIndex]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const percent = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(percent);
    }
  };

  const handleVideoEnded = () => {
    if (currentIndex < highlights.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(highlights.length - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < highlights.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = `Check out ${player?.name}'s highlight reel on Caliber!`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Caliber Highlights", text: shareText, url: shareUrl });
      } catch (err) {
        navigator.clipboard.writeText(shareUrl);
        toast({ title: "Link Copied!", description: "Share link copied to clipboard" });
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link Copied!", description: "Share link copied to clipboard" });
    }
  };

  if (playerLoading || highlightsLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <Film className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Player Not Found</h2>
          <Link href="/">
            <Button variant="outline">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (highlights.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <Film className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No Highlights Yet</h2>
          <p className="text-muted-foreground mb-4">This player hasn't uploaded any highlights</p>
          <Link href={`/players/${playerId}`}>
            <Button variant="outline">View Profile</Button>
          </Link>
        </div>
      </div>
    );
  }

  const gameInfo = currentClip ? getGameInfo(currentClip.gameId) : null;
  const clipBadges = currentClip ? getClipBadges(currentClip.gameId) : [];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden" data-testid="reel-page">
      <Link href={`/players/${playerId}`}>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 z-50 text-white/70"
          data-testid="button-back-to-profile"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </Link>

      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-50 text-white/70"
        onClick={handleShare}
        data-testid="button-share-reel"
      >
        <Share2 className="w-5 h-5" />
      </Button>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex gap-1">
        {highlights.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1 rounded-full transition-all ${
              idx === currentIndex
                ? "w-8 bg-white"
                : idx < currentIndex
                ? "w-4 bg-white/50"
                : "w-4 bg-white/30"
            }`}
            data-testid={`progress-indicator-${idx}`}
          />
        ))}
      </div>

      <div className="relative h-screen w-full flex items-center justify-center">
        {currentClip && (
          <video
            ref={videoRef}
            key={currentClip.id}
            src={currentClip.videoUrl}
            className="max-h-full max-w-full object-contain"
            muted={isMuted}
            autoPlay={isPlaying}
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnded}
            onClick={() => setIsPlaying(!isPlaying)}
            data-testid={`reel-video-${currentClip.id}`}
          />
        )}

        <button
          onClick={goToPrevious}
          className="absolute left-0 top-0 h-full w-1/4 z-20"
          data-testid="button-previous-clip"
        />
        <button
          onClick={goToNext}
          className="absolute right-0 top-0 h-full w-1/4 z-20"
          data-testid="button-next-clip"
        />

        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center">
              <Play className="w-10 h-10 text-white ml-1" />
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black via-black/80 to-transparent">
        <div className="h-1 bg-white/20 relative">
          <div
            className="absolute h-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-4 pb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Link href={`/players/${playerId}`}>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-10 h-10 border-2 border-primary/50">
                    {player.photoUrl && <AvatarImage src={player.photoUrl} alt={player.name} />}
                    <AvatarFallback className="bg-primary/20 text-white text-sm font-bold">
                      {getInitials(player.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold text-white">{player.name}</div>
                    <div className="text-xs text-white/60">
                      {player.position} {player.team && `• ${player.team}`}
                    </div>
                  </div>
                </div>
              </Link>

              {currentClip && (
                <div className="mb-3">
                  <h3 className="font-bold text-white text-lg">{currentClip.title}</h3>
                  {currentClip.description && (
                    <p className="text-sm text-white/70 mt-1">{currentClip.description}</p>
                  )}
                </div>
              )}

              {gameInfo && (
                <div className="glass-card rounded-lg px-3 py-2 inline-flex items-center gap-3 mb-3">
                  <div className="text-xs text-white/60">
                    vs {gameInfo.opponent} • {format(new Date(gameInfo.date), "MMM d, yyyy")}
                  </div>
                  <div className="flex items-center gap-4 text-sm font-bold text-white">
                    <span>{gameInfo.points} PTS</span>
                    <span>{gameInfo.rebounds} REB</span>
                    <span>{gameInfo.assists} AST</span>
                  </div>
                  {gameInfo.grade && (
                    <Badge variant="outline" className="border-primary text-primary">
                      {gameInfo.grade}
                    </Badge>
                  )}
                </div>
              )}

              {clipBadges.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {clipBadges.slice(0, 3).map((badge) => (
                    <Badge key={badge.id} className="bg-primary/20 text-primary border-primary/30">
                      <Trophy className="w-3 h-3 mr-1" />
                      {badge.badgeType.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                className="text-white/70"
                data-testid="button-toggle-mute"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
              {currentClip && (
                <div className="text-center">
                  <Eye className="w-4 h-4 text-white/50 mx-auto" />
                  <span className="text-xs text-white/50">{currentClip.viewCount}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevious}
              className="text-white/70"
              data-testid="button-prev"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-white"
              data-testid="button-play-pause"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNext}
              className="text-white/70"
              data-testid="button-next"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>

          <div className="text-center mt-2 text-xs text-white/40">
            {currentIndex + 1} / {highlights.length}
          </div>
        </div>
      </div>
    </div>
  );
}
