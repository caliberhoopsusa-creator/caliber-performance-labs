import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Film, Play, Pause, SkipForward, SkipBack, Download, Share2,
  Wand2, Loader2, Activity, Eye, Heart, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { PlatformExportModal } from "@/components/PlatformExportModal";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";

interface Clip {
  id: number;
  title: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: number | null;
  viewCount: number;
  likeCount: number;
  createdAt: string;
}

interface ReelData {
  player: {
    id: number;
    name: string;
    position: string;
    team: string | null;
    photoUrl: string | null;
    sport: string;
    school: string | null;
    graduationYear: number | null;
  };
  clips: Clip[];
  totalClips: number;
  statOverlay: Record<string, string | number>;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function ReelCoverCard({ data, selectedClips }: { data: ReelData; selectedClips: Clip[] }) {
  const stat = data.statOverlay;
  const sport = data.player.sport;
  
  return (
    <div 
      className="w-[400px] h-[500px] rounded-3xl overflow-hidden relative"
      style={{ background: "linear-gradient(135deg, #0f0f23 0%, #1a0a2e 50%, #0a1628 100%)" }}
      data-testid="reel-cover-card"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-cyan-500/15 blur-3xl" />
      </div>

      <div className="relative z-10 h-full flex flex-col p-6">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-primary">Caliber</span>
          </div>
          <Badge className="bg-white/10 text-white/70 border-white/10 text-[10px] no-default-hover-elevate no-default-active-elevate">
            <Film className="w-3 h-3 mr-1" />
            Highlight Reel
          </Badge>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          {data.player.photoUrl ? (
            <img src={data.player.photoUrl} alt={data.player.name} className="w-24 h-24 rounded-2xl object-cover border-2 border-purple-500/40 mb-4" loading="lazy" width={96} height={96} />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500/30 to-cyan-500/30 flex items-center justify-center border-2 border-purple-500/40 mb-4">
              <span className="text-4xl font-bold text-white">{data.player.name.charAt(0)}</span>
            </div>
          )}
          
          <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">{data.player.name}</h2>
          <p className="text-sm text-white/60 mb-1">{data.player.position} {data.player.team ? `- ${data.player.team}` : ''}</p>
          {data.player.school && (
            <p className="text-xs text-cyan-400/60 mb-4">{data.player.school} {data.player.graduationYear ? `'${String(data.player.graduationYear).slice(2)}` : ''}</p>
          )}
          
          <div className="flex items-center gap-2 mb-4">
            <Film className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-white/70">{selectedClips.length} Highlights</span>
          </div>
          
          <div className="grid grid-cols-3 gap-3 w-full">
            {sport === 'basketball' ? (
              <>
                <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 text-center">
                  <p className="text-xl font-black text-orange-400">{stat.ppg}</p>
                  <p className="text-[9px] text-white/50 uppercase">PPG</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 text-center">
                  <p className="text-xl font-black text-blue-400">{stat.rpg}</p>
                  <p className="text-[9px] text-white/50 uppercase">RPG</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 text-center">
                  <p className="text-xl font-black text-purple-400">{stat.apg}</p>
                  <p className="text-[9px] text-white/50 uppercase">APG</p>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 text-center">
                  <p className="text-xl font-black text-orange-400">{stat.tdpg}</p>
                  <p className="text-[9px] text-white/50 uppercase">TD/G</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 text-center col-span-2">
                  <p className="text-xl font-black text-blue-400">{stat.ypg}</p>
                  <p className="text-[9px] text-white/50 uppercase">YDS/G</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReelGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const playerId = user?.playerId;
  const videoRef = useRef<HTMLVideoElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  
  const [selectedClipIds, setSelectedClipIds] = useState<Set<number>>(new Set());
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showExport, setShowExport] = useState(false);

  const { data, isLoading } = useQuery<ReelData>({
    queryKey: ['/api/players', playerId, 'reel-data'],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}/reel-data`);
      if (!res.ok) throw new Error("Failed to load reel data");
      return res.json();
    },
    enabled: !!playerId,
  });

  useEffect(() => {
    if (data?.clips && selectedClipIds.size === 0) {
      const top5 = data.clips.slice(0, 5).map(c => c.id);
      setSelectedClipIds(new Set(top5));
    }
  }, [data]);

  const selectedClips = data?.clips.filter(c => selectedClipIds.has(c.id)) || [];
  const currentClip = selectedClips[currentClipIndex];

  const toggleClip = (id: number) => {
    const next = new Set(selectedClipIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedClipIds(next);
  };

  const playNext = useCallback(() => {
    if (currentClipIndex < selectedClips.length - 1) {
      setCurrentClipIndex(prev => prev + 1);
    } else {
      setCurrentClipIndex(0);
      setIsPlaying(false);
    }
  }, [currentClipIndex, selectedClips.length]);

  const playPrev = () => {
    setCurrentClipIndex(prev => Math.max(0, prev - 1));
  };

  useEffect(() => {
    if (videoRef.current && currentClip) {
      videoRef.current.src = currentClip.videoUrl;
      if (isPlaying) videoRef.current.play().catch(() => {});
    }
  }, [currentClip, isPlaying]);

  const handleDownloadCover = async () => {
    if (!coverRef.current || !data) return;
    try {
      const canvas = await html2canvas(coverRef.current, { backgroundColor: null, scale: 2, useCORS: true });
      const link = document.createElement("a");
      link.download = `caliber-reel-${data.player.name.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast({ title: "Cover Downloaded", description: "Share your reel cover on social media!" });
    } catch (e) {
      console.error("Error generating cover:", e);
    }
  };

  if (!playerId) {
    return (
      <div className="text-center py-20">
        <Film className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Player Profile Required</h2>
        <p className="text-muted-foreground">Create a player profile to build your highlight reel.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data || data.clips.length === 0) {
    return (
      <div className="text-center py-20">
        <Film className="w-16 h-16 mx-auto text-purple-400/30 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">No Highlights Yet</h2>
        <p className="text-muted-foreground mb-4">Upload highlight clips to build your reel.</p>
        <Button onClick={() => window.location.href = '/highlights'} data-testid="button-go-highlights">
          Upload Highlights
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-8 space-y-6" data-testid="page-reel-generator">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-950/40 via-black/40 to-cyan-950/40 border border-purple-500/20">
        <div className="absolute inset-0 cyber-grid opacity-10" />
        <div className="relative z-10 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-purple-400" style={{ filter: "drop-shadow(0 0 8px #a855f7)" }} />
                <span className="text-xs uppercase tracking-wider text-purple-400 font-semibold">AI Reel Builder</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">
                <span className="bg-gradient-to-r from-white via-purple-200 to-cyan-400 bg-clip-text text-transparent">
                  Highlight Reel Generator
                </span>
              </h2>
              <p className="text-muted-foreground">
                Select your best clips and create a shareable reel with stat overlays
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleDownloadCover} className="gap-1.5" data-testid="button-download-cover">
                <Download className="w-3 h-3" />
                Download Cover
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowExport(true)} className="gap-1.5 border-primary/30 text-primary" data-testid="button-export-cover">
                <Share2 className="w-3 h-3" />
                Export Cover
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card className="bg-black overflow-hidden border-white/10" data-testid="card-reel-preview">
            <div className="relative aspect-video">
              {currentClip ? (
                <>
                  <video
                    ref={videoRef}
                    className="w-full h-full object-contain"
                    playsInline
                    onEnded={playNext}
                    poster={currentClip.thumbnailUrl || undefined}
                    data-testid="video-reel-preview"
                  />
                  
                  {showOverlay && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-white font-bold">{data.player.name}</p>
                          <p className="text-white/60 text-xs">{data.player.position} {data.player.team ? `- ${data.player.team}` : ''}</p>
                        </div>
                        <div className="flex gap-3">
                          {data.player.sport === 'basketball' ? (
                            <>
                              <div className="text-center">
                                <p className="text-lg font-black text-orange-400">{data.statOverlay.ppg}</p>
                                <p className="text-[9px] text-white/50">PPG</p>
                              </div>
                              <div className="text-center">
                                <p className="text-lg font-black text-blue-400">{data.statOverlay.rpg}</p>
                                <p className="text-[9px] text-white/50">RPG</p>
                              </div>
                              <div className="text-center">
                                <p className="text-lg font-black text-purple-400">{data.statOverlay.apg}</p>
                                <p className="text-[9px] text-white/50">APG</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="text-center">
                                <p className="text-lg font-black text-orange-400">{data.statOverlay.tdpg}</p>
                                <p className="text-[9px] text-white/50">TD/G</p>
                              </div>
                              <div className="text-center">
                                <p className="text-lg font-black text-blue-400">{data.statOverlay.ypg}</p>
                                <p className="text-[9px] text-white/50">YDS/G</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Select clips to preview your reel</p>
                </div>
              )}
            </div>
            
            <div className="p-3 flex items-center justify-between gap-2 border-t border-white/10 bg-black/50">
              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" onClick={playPrev} disabled={currentClipIndex === 0} data-testid="button-prev-clip">
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => {
                    if (videoRef.current) {
                      if (isPlaying) videoRef.current.pause();
                      else videoRef.current.play();
                      setIsPlaying(!isPlaying);
                    }
                  }}
                  data-testid="button-play-pause"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button size="icon" variant="ghost" onClick={playNext} disabled={currentClipIndex >= selectedClips.length - 1} data-testid="button-next-clip">
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {selectedClips.length > 0 ? `${currentClipIndex + 1} / ${selectedClips.length}` : '0 / 0'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowOverlay(!showOverlay)}
                  className={cn("text-xs gap-1 toggle-elevate", showOverlay ? "text-primary toggle-elevated" : "text-muted-foreground")}
                  data-testid="button-toggle-overlay"
                >
                  <Activity className="w-3 h-3" />
                  Stats
                </Button>
              </div>
            </div>
          </Card>
          
          <div className="flex gap-2 overflow-x-auto pb-2 flex-wrap">
            {selectedClips.map((clip, index) => (
              <button
                key={clip.id}
                onClick={() => setCurrentClipIndex(index)}
                className={cn(
                  "flex-shrink-0 w-24 h-16 rounded-md overflow-hidden border-2 transition-all cursor-pointer",
                  index === currentClipIndex ? "border-primary" : "border-white/10"
                )}
                data-testid={`button-timeline-clip-${clip.id}`}
              >
                {clip.thumbnailUrl ? (
                  <img src={clip.thumbnailUrl} alt={clip.title} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center">
                    <Film className="w-4 h-4 text-white/30" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Film className="w-4 h-4 text-purple-400" />
            Select Clips ({selectedClipIds.size}/{data.clips.length})
          </h3>
          
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {data.clips.map(clip => (
              <Card 
                key={clip.id} 
                className={cn(
                  "p-3 cursor-pointer transition-all border",
                  selectedClipIds.has(clip.id) 
                    ? "bg-purple-500/10 border-purple-500/30" 
                    : "bg-black/20 border-white/5"
                )}
                onClick={() => toggleClip(clip.id)}
                data-testid={`card-clip-select-${clip.id}`}
              >
                <div className="flex items-center gap-3">
                  <Checkbox 
                    checked={selectedClipIds.has(clip.id)}
                    onCheckedChange={() => toggleClip(clip.id)}
                    data-testid={`checkbox-clip-${clip.id}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{clip.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Eye className="w-3 h-3" />{clip.viewCount}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Heart className="w-3 h-3" />{clip.likeCount}
                      </span>
                      {clip.duration && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />{formatDuration(clip.duration)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute -left-[9999px]" aria-hidden="true">
        <div ref={coverRef}>
          <ReelCoverCard data={data} selectedClips={selectedClips} />
        </div>
      </div>

      <PlatformExportModal
        open={showExport}
        onOpenChange={setShowExport}
        playerName={data.player.name}
      >
        <ReelCoverCard data={data} selectedClips={selectedClips} />
      </PlatformExportModal>
    </div>
  );
}