import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { usePlayers } from "@/hooks/use-basketball";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Upload, Video, FileText, Loader2, CheckCircle, AlertCircle, Target, Shield, Zap, X, Clock, HardDrive, FileType, History, Trash2, ChevronDown, ChevronUp, Edit3, Check, ArrowRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Paywall } from "@/components/Paywall";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_DURATION_SECONDS = 300;
const ACCEPTED_FORMATS = ["video/mp4", "video/webm", "video/quicktime"];

interface VideoValidation {
  isValid: boolean;
  errors: string[];
  duration: number | null;
  thumbnailUrl: string | null;
}

interface AnalysisStats {
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fgMade: number;
  fgAttempted: number;
  threeMade: number;
  threeAttempted: number;
  ftMade: number;
  ftAttempted: number;
  hustleScore: number;
  defenseRating: number;
  plusMinus?: number;
  per?: number;
}

interface AnalysisResult {
  playerName: string;
  stats: AnalysisStats;
  observations: string;
  confidence?: string;
  videoQuality?: string;
  limitations?: string[];
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFormatLabel(type: string): string {
  switch (type) {
    case "video/mp4": return "MP4";
    case "video/webm": return "WebM";
    case "video/quicktime": return "MOV";
    default: return type.split("/")[1]?.toUpperCase() || "Unknown";
  }
}

export default function VideoAnalysis() {
  const { data: players } = usePlayers();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [customPlayerName, setCustomPlayerName] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [playByPlay, setPlayByPlay] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [editedStats, setEditedStats] = useState<AnalysisStats | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showLimitations, setShowLimitations] = useState(false);
  const [activeTab, setActiveTab] = useState("analyze");
  const [analysisSource, setAnalysisSource] = useState<string>("video");
  const [validation, setValidation] = useState<VideoValidation>({
    isValid: true,
    errors: [],
    duration: null,
    thumbnailUrl: null,
  });
  const videoRef = useRef<HTMLVideoElement>(null);

  const { data: historyData, isLoading: historyLoading } = useQuery<any[]>({
    queryKey: ['/api/video-analyses'],
    enabled: activeTab === "history",
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/video-analyses', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-analyses'] });
      toast({ title: "Saved", description: "Analysis saved to history" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/video-analyses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-analyses'] });
      toast({ title: "Deleted", description: "Analysis removed from history" });
    }
  });

  const cleanupThumbnail = useCallback(() => {
    if (validation.thumbnailUrl) {
      URL.revokeObjectURL(validation.thumbnailUrl);
    }
  }, [validation.thumbnailUrl]);

  useEffect(() => {
    return () => {
      cleanupThumbnail();
    };
  }, [cleanupThumbnail]);

  const validateVideo = useCallback((file: File) => {
    const errors: string[] = [];

    if (!ACCEPTED_FORMATS.includes(file.type)) {
      errors.push(`Unsupported format "${getFormatLabel(file.type)}". Use MP4, WebM, or MOV.`);
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      errors.push(`File is ${formatFileSize(file.size)} — exceeds the ${MAX_FILE_SIZE_MB}MB limit.`);
    }

    const videoEl = document.createElement("video");
    videoEl.preload = "metadata";
    const objectUrl = URL.createObjectURL(file);
    videoEl.src = objectUrl;

    videoEl.onloadedmetadata = () => {
      const duration = videoEl.duration;
      if (duration > MAX_DURATION_SECONDS) {
        errors.push(`Video is ${formatDuration(duration)} — exceeds the 5 minute limit.`);
      }

      videoEl.currentTime = Math.min(1, duration / 4);
    };

    videoEl.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          const thumbUrl = blob ? URL.createObjectURL(blob) : null;
          setValidation({
            isValid: errors.length === 0,
            errors,
            duration: videoEl.duration,
            thumbnailUrl: thumbUrl,
          });
          URL.revokeObjectURL(objectUrl);
        });
      } else {
        setValidation({
          isValid: errors.length === 0,
          errors,
          duration: videoEl.duration,
          thumbnailUrl: null,
        });
        URL.revokeObjectURL(objectUrl);
      }
    };

    videoEl.onerror = () => {
      errors.push("Could not read video file. It may be corrupted or in an unsupported codec.");
      setValidation({
        isValid: false,
        errors,
        duration: null,
        thumbnailUrl: null,
      });
      URL.revokeObjectURL(objectUrl);
    };

    if (errors.length > 0 && !ACCEPTED_FORMATS.includes(file.type)) {
      setValidation({
        isValid: false,
        errors,
        duration: null,
        thumbnailUrl: null,
      });
    }
  }, []);

  const handleFileSelect = (file: File | null) => {
    cleanupThumbnail();
    if (!file) {
      setVideoFile(null);
      setValidation({ isValid: true, errors: [], duration: null, thumbnailUrl: null });
      return;
    }
    setVideoFile(file);
    validateVideo(file);
  };

  const clearFile = () => {
    cleanupThumbnail();
    setVideoFile(null);
    setValidation({ isValid: true, errors: [], duration: null, thumbnailUrl: null });
    const input = document.getElementById("video-upload") as HTMLInputElement;
    if (input) input.value = "";
  };

  const handleAnalysisResult = (data: AnalysisResult, source: string) => {
    setResult(data);
    setEditedStats({ ...data.stats });
    setAnalysisSource(source);
    const needsReview = data.confidence === 'medium' || data.confidence === 'low';
    setIsReviewMode(needsReview);
    if (needsReview) {
      setShowLimitations(true);
    }
    saveMutation.mutate({
      playerName: data.playerName,
      playerId: getPlayerId(),
      stats: data.stats,
      observations: data.observations,
      confidence: data.confidence,
      videoQuality: data.videoQuality,
      limitations: data.limitations,
      source,
    });
  };

  const videoMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/analyze-video', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Analysis failed');
      }
      return res.json();
    },
    onSuccess: (data) => {
      handleAnalysisResult(data, 'video');
      toast({ title: "Analysis Complete", description: "Stats extracted from video" });
    },
    onError: (error: Error) => {
      toast({ title: "Analysis Failed", description: error.message, variant: "destructive" });
    }
  });

  const textMutation = useMutation({
    mutationFn: async (data: { playerName: string; playByPlay: string }) => {
      const res = await fetch('/api/analyze-plays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Analysis failed');
      }
      return res.json();
    },
    onSuccess: (data) => {
      handleAnalysisResult(data, 'text');
      toast({ title: "Analysis Complete", description: "Stats extracted from play-by-play" });
    },
    onError: (error: Error) => {
      toast({ title: "Analysis Failed", description: error.message, variant: "destructive" });
    }
  });

  const getPlayerName = () => {
    if (selectedPlayer && selectedPlayer !== "custom") {
      return players?.find(p => String(p.id) === selectedPlayer)?.name || "";
    }
    return customPlayerName;
  };

  const getPlayerId = () => {
    if (selectedPlayer && selectedPlayer !== "custom") {
      return parseInt(selectedPlayer);
    }
    return null;
  };

  const handleVideoSubmit = () => {
    if (!videoFile) {
      toast({ title: "No Video", description: "Please select a video file", variant: "destructive" });
      return;
    }
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('playerName', getPlayerName());
    videoMutation.mutate(formData);
  };

  const handleTextSubmit = () => {
    if (!playByPlay.trim()) {
      toast({ title: "No Input", description: "Please enter play-by-play notes", variant: "destructive" });
      return;
    }
    textMutation.mutate({ playerName: getPlayerName(), playByPlay });
  };

  const handleConfirmStats = () => {
    if (!result || !editedStats) return;
    setIsReviewMode(false);
    const confirmedResult = { ...result, stats: editedStats };
    setResult(confirmedResult);
    if (hasEdits) {
      saveMutation.mutate({
        playerName: confirmedResult.playerName,
        playerId: getPlayerId(),
        stats: confirmedResult.stats,
        observations: confirmedResult.observations,
        confidence: confirmedResult.confidence,
        videoQuality: confirmedResult.videoQuality,
        limitations: confirmedResult.limitations,
        source: analysisSource,
      });
    }
    toast({ title: "Stats Confirmed", description: hasEdits ? "Updated stats saved" : "Stats confirmed" });
  };

  const handleUseInGameEntry = () => {
    if (!result || !editedStats) return;
    const stats = editedStats;
    const playerId = getPlayerId();
    const params = new URLSearchParams();
    if (playerId) params.set('playerId', String(playerId));
    params.set('points', String(stats.points));
    params.set('rebounds', String(stats.rebounds));
    params.set('assists', String(stats.assists));
    params.set('steals', String(stats.steals));
    params.set('blocks', String(stats.blocks));
    params.set('turnovers', String(stats.turnovers));
    params.set('fgMade', String(stats.fgMade));
    params.set('fgAttempted', String(stats.fgAttempted));
    params.set('threeMade', String(stats.threeMade));
    params.set('threeAttempted', String(stats.threeAttempted));
    params.set('ftMade', String(stats.ftMade));
    params.set('ftAttempted', String(stats.ftAttempted));
    params.set('hustleScore', String(stats.hustleScore));
    params.set('defenseRating', String(stats.defenseRating));
    params.set('source', 'video_analysis');
    setLocation(`/analyze?${params.toString()}`);
  };

  const handleLoadFromHistory = (entry: any) => {
    const stats = typeof entry.stats === 'string' ? JSON.parse(entry.stats) : entry.stats;
    const limitations = entry.limitations ? (typeof entry.limitations === 'string' ? JSON.parse(entry.limitations) : entry.limitations) : [];
    setResult({
      playerName: entry.playerName,
      stats,
      observations: entry.observations || '',
      confidence: entry.confidence,
      videoQuality: entry.videoQuality,
      limitations,
    });
    setEditedStats({ ...stats });
    setIsReviewMode(false);
    setActiveTab("analyze");
    toast({ title: "Loaded", description: "Analysis loaded from history" });
  };

  const updateStat = (key: keyof AnalysisStats, value: number) => {
    if (!editedStats) return;
    setEditedStats({ ...editedStats, [key]: value });
  };

  const isLoading = videoMutation.isPending || textMutation.isPending;
  const canAnalyze = videoFile && validation.isValid && !isLoading;
  const analyzeDisabledReason = !videoFile
    ? "Select a video file first"
    : !validation.isValid
    ? validation.errors[0] || "Video validation failed"
    : null;

  const currentStats = editedStats || result?.stats;
  const hasEdits = editedStats && result && JSON.stringify(editedStats) !== JSON.stringify(result.stats);

  return (
    <Paywall requiredTier="pro" featureName="AI Video Analysis">
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground uppercase tracking-tight" data-testid="text-page-title">Video Analysis</h2>
        <p className="text-muted-foreground font-medium">Upload game footage or enter play-by-play to extract stats with AI</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-card border border-border">
          <TabsTrigger value="analyze" className="gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground" data-testid="tab-analyze">
            <Video className="w-4 h-4" /> Analyze
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground" data-testid="tab-history">
            <History className="w-4 h-4" /> History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analyze">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card className="bg-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg font-display uppercase tracking-wider">Select Player</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                    <SelectTrigger className="bg-background border-border" data-testid="select-player">
                      <SelectValue placeholder="Choose a player or enter custom..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {players?.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.name} ({p.position})</SelectItem>
                      ))}
                      <SelectItem value="custom">Enter Custom Name</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {selectedPlayer === "custom" && (
                    <Input 
                      placeholder="Player name..."
                      value={customPlayerName}
                      onChange={(e) => setCustomPlayerName(e.target.value)}
                      className="bg-background border-border"
                      data-testid="input-custom-player"
                    />
                  )}
                </CardContent>
              </Card>

              <Tabs defaultValue="video" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-card border border-border">
                  <TabsTrigger value="video" className="gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground" data-testid="tab-video">
                    <Video className="w-4 h-4" /> Video Upload
                  </TabsTrigger>
                  <TabsTrigger value="text" className="gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground" data-testid="tab-text">
                    <FileText className="w-4 h-4" /> Play-by-Play
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="video">
                  <Card className="bg-card border-border/50">
                    <CardContent className="pt-6 space-y-4">
                      <div 
                        className={cn(
                          "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
                          videoFile && validation.isValid ? "border-accent/50 bg-accent/5" :
                          videoFile && !validation.isValid ? "border-destructive/50 bg-destructive/5" :
                          "border-border hover:border-border"
                        )}
                      >
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime"
                          onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                          className="hidden"
                          id="video-upload"
                          data-testid="input-video-upload"
                        />
                        <label htmlFor="video-upload" className="cursor-pointer block">
                          {videoFile ? (
                            <div className="space-y-3">
                              {validation.isValid ? (
                                <CheckCircle className="w-10 h-10 mx-auto text-accent" />
                              ) : (
                                <AlertCircle className="w-10 h-10 mx-auto text-destructive" />
                              )}
                              <p className="font-medium text-foreground truncate max-w-[280px] mx-auto" data-testid="text-video-filename">{videoFile.name}</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                              <p className="font-medium text-foreground">Drop video or click to upload</p>
                              <p className="text-sm text-muted-foreground">MP4, WebM, MOV (max {MAX_FILE_SIZE_MB}MB, max 5 min)</p>
                            </div>
                          )}
                        </label>
                      </div>

                      {videoFile && (
                        <div className="space-y-3" data-testid="video-file-details">
                          {validation.thumbnailUrl && (
                            <div className="relative rounded-lg overflow-hidden border border-border" data-testid="video-thumbnail">
                              <img
                                src={validation.thumbnailUrl}
                                alt="Video preview thumbnail"
                                className="w-full h-40 object-cover"
                              />
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <Video className="w-10 h-10 text-white/80" />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" data-testid="badge-file-size">
                              <HardDrive className="w-3 h-3 mr-1" />
                              {formatFileSize(videoFile.size)}
                            </Badge>
                            <Badge variant="secondary" data-testid="badge-file-format">
                              <FileType className="w-3 h-3 mr-1" />
                              {getFormatLabel(videoFile.type)}
                            </Badge>
                            {validation.duration !== null && (
                              <Badge variant="secondary" data-testid="badge-video-duration">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDuration(validation.duration)}
                              </Badge>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.preventDefault();
                                clearFile();
                              }}
                              data-testid="button-clear-video"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>

                          {validation.errors.length > 0 && (
                            <div className="space-y-1" data-testid="video-validation-errors">
                              {validation.errors.map((err, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm text-destructive">
                                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                  <span>{err}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {analyzeDisabledReason ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="w-full inline-block" tabIndex={0}>
                              <Button 
                                className="w-full pointer-events-none" 
                                disabled
                                data-testid="button-analyze-video"
                              >
                                <Video className="w-4 h-4 mr-2" />
                                Analyze Video
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent data-testid="tooltip-analyze-disabled">
                            <p>{analyzeDisabledReason}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Button 
                          onClick={handleVideoSubmit} 
                          className="w-full" 
                          disabled={!canAnalyze}
                          data-testid="button-analyze-video"
                        >
                          {videoMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Analyzing Video...
                            </>
                          ) : (
                            <>
                              <Video className="w-4 h-4 mr-2" />
                              Analyze Video
                            </>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="text">
                  <Card className="bg-card border-border/50">
                    <CardContent className="pt-6 space-y-4">
                      <Textarea
                        placeholder="Enter play-by-play notes...

Example:
- Q1: Player hits a 3-pointer from the corner
- Q1: Grabs defensive rebound, pushes in transition
- Q2: Assists on a layup
- Q2: Commits turnover on careless pass
- Q3: Blocks opponent's shot at the rim"
                        value={playByPlay}
                        onChange={(e) => setPlayByPlay(e.target.value)}
                        className="min-h-[200px] bg-background border-border"
                        data-testid="textarea-play-by-play"
                      />

                      <Button 
                        onClick={handleTextSubmit} 
                        className="w-full" 
                        disabled={isLoading || !playByPlay.trim()}
                        data-testid="button-analyze-text"
                      >
                        {textMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Analyzing Plays...
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 mr-2" />
                            Extract Stats
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-6">
              {result && currentStats ? (
                <Card className="bg-card border-border/50 animate-in zoom-in-95 duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-display uppercase tracking-wider">
                        {isReviewMode ? "Review Stats" : "Extracted Stats"}
                      </span>
                      <div className="flex items-center gap-2">
                        {isReviewMode && (
                          <Badge variant="outline" className="border-yellow-500/50 text-yellow-500" data-testid="badge-review-mode">
                            <Edit3 className="w-3 h-3 mr-1" />
                            Review Mode
                          </Badge>
                        )}
                        {result.confidence && (
                          <span className={cn(
                            "text-xs px-2 py-1 rounded-full font-mono uppercase",
                            result.confidence === 'high' ? "bg-green-500/20 text-green-500" :
                            result.confidence === 'medium' ? "bg-yellow-500/20 text-yellow-500" :
                            "bg-red-500/20 text-red-500"
                          )} data-testid="badge-confidence">
                            {result.confidence} confidence
                          </span>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {result.videoQuality && result.videoQuality !== 'good' && (
                      <div className={cn(
                        "flex items-start gap-2 p-3 rounded-lg border text-sm",
                        result.videoQuality === 'poor' ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                      )} data-testid="alert-video-quality">
                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>Video quality: <strong>{result.videoQuality}</strong> — some stats may be estimated</span>
                      </div>
                    )}

                    {result.limitations && result.limitations.length > 0 && (
                      <div className="border border-yellow-500/30 rounded-lg overflow-hidden" data-testid="section-limitations">
                        <button
                          onClick={() => setShowLimitations(!showLimitations)}
                          className="w-full flex items-center justify-between p-3 text-sm text-yellow-400 hover:bg-yellow-500/5 transition-colors"
                          data-testid="button-toggle-limitations"
                        >
                          <span className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            {result.limitations.length} limitation{result.limitations.length > 1 ? 's' : ''} noted
                          </span>
                          {showLimitations ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {showLimitations && (
                          <div className="px-3 pb-3 space-y-1">
                            {result.limitations.map((lim, i) => (
                              <div key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                                <span className="text-yellow-500 mt-0.5">•</span>
                                <span>{lim}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="text-center p-4 bg-accent/10 rounded-xl border border-accent/20">
                      <h3 className="text-xl font-display font-bold text-foreground" data-testid="text-player-name">{result.playerName}</h3>
                      {isReviewMode && (
                        <p className="text-xs text-muted-foreground mt-1">Click any stat value to edit it</p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <EditableStatBox label="PTS" statKey="points" value={currentStats.points} icon={Target} color="text-accent" editable={isReviewMode} editingField={editingField} setEditingField={setEditingField} onUpdate={updateStat} />
                      <EditableStatBox label="REB" statKey="rebounds" value={currentStats.rebounds} icon={Shield} color="text-blue-500" editable={isReviewMode} editingField={editingField} setEditingField={setEditingField} onUpdate={updateStat} />
                      <EditableStatBox label="AST" statKey="assists" value={currentStats.assists} icon={Zap} color="text-yellow-500" editable={isReviewMode} editingField={editingField} setEditingField={setEditingField} onUpdate={updateStat} />
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      <EditableStatBox label="STL" statKey="steals" value={currentStats.steals} size="sm" editable={isReviewMode} editingField={editingField} setEditingField={setEditingField} onUpdate={updateStat} />
                      <EditableStatBox label="BLK" statKey="blocks" value={currentStats.blocks} size="sm" editable={isReviewMode} editingField={editingField} setEditingField={setEditingField} onUpdate={updateStat} />
                      <EditableStatBox label="TO" statKey="turnovers" value={currentStats.turnovers} size="sm" negative editable={isReviewMode} editingField={editingField} setEditingField={setEditingField} onUpdate={updateStat} />
                      <StatBox label="FG" value={`${currentStats.fgMade}/${currentStats.fgAttempted}`} size="sm" />
                    </div>

                    <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                        AI-Calculated Advanced Metrics
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Hustle Score</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 transition-all duration-500"
                                style={{ width: `${currentStats.hustleScore}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-foreground">{currentStats.hustleScore}</span>
                          </div>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Defense Rating</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 transition-all duration-500"
                                style={{ width: `${currentStats.defenseRating}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-foreground">{currentStats.defenseRating}</span>
                          </div>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Plus/Minus</div>
                          <div className={cn(
                            "font-mono font-bold text-xl",
                            (currentStats.plusMinus ?? 0) > 0 ? "text-green-500" : 
                            (currentStats.plusMinus ?? 0) < 0 ? "text-red-500" : "text-foreground"
                          )}>
                            {(currentStats.plusMinus ?? 0) > 0 ? "+" : ""}{currentStats.plusMinus ?? 0}
                          </div>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">PER</div>
                          <div className="font-mono font-bold text-xl text-purple-400">
                            {(currentStats.per ?? 15).toFixed(1)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {(currentStats.per ?? 15) >= 25 ? "Elite" : 
                             (currentStats.per ?? 15) >= 20 ? "All-Star" : 
                             (currentStats.per ?? 15) >= 15 ? "Above Avg" : 
                             (currentStats.per ?? 15) >= 10 ? "Average" : "Developing"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {result.observations && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Scout Notes</div>
                        <p className="text-muted-foreground text-sm leading-relaxed" data-testid="text-observations">{result.observations}</p>
                      </div>
                    )}

                    {isReviewMode ? (
                      <div className="space-y-3">
                        {hasEdits && (
                          <p className="text-xs text-center text-yellow-400">You've made edits — confirm to save your changes</p>
                        )}
                        <Button 
                          onClick={handleConfirmStats}
                          className="w-full"
                          data-testid="button-confirm-stats"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Confirm Stats
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Button 
                          onClick={handleUseInGameEntry}
                          className="w-full"
                          variant="default"
                          data-testid="button-use-stats"
                        >
                          <ArrowRight className="w-4 h-4 mr-2" />
                          Use Stats in Game Entry
                        </Button>
                        {!isReviewMode && result.confidence !== 'high' && (
                          <Button
                            onClick={() => setIsReviewMode(true)}
                            variant="outline"
                            className="w-full"
                            data-testid="button-edit-stats"
                          >
                            <Edit3 className="w-4 h-4 mr-2" />
                            Edit Stats
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-card border-border/50">
                  <CardContent className="py-16 text-center">
                    <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground">No Analysis Yet</h3>
                    <p className="text-sm text-muted-foreground/70 mt-1">Upload a video or enter play-by-play notes to extract stats</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="font-display uppercase tracking-wider">Analysis History</CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : !historyData || historyData.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No past analyses yet</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Analyses will appear here after you run them</p>
                </div>
              ) : (
                <div className="space-y-3" data-testid="history-list">
                  {historyData.map((entry: any) => {
                    const stats = typeof entry.stats === 'string' ? JSON.parse(entry.stats) : entry.stats;
                    return (
                      <div
                        key={entry.id}
                        className="p-4 bg-muted/30 rounded-lg border border-border/50 hover:border-border transition-colors"
                        data-testid={`history-entry-${entry.id}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-medium text-foreground truncate" data-testid={`text-history-player-${entry.id}`}>{entry.playerName}</h4>
                              <Badge variant="secondary" className="text-xs shrink-0">
                                {entry.source === 'video' ? 'Video' : 'Text'}
                              </Badge>
                              {entry.confidence && (
                                <span className={cn(
                                  "text-xs px-1.5 py-0.5 rounded-full font-mono",
                                  entry.confidence === 'high' ? "bg-green-500/20 text-green-500" :
                                  entry.confidence === 'medium' ? "bg-yellow-500/20 text-yellow-500" :
                                  "bg-red-500/20 text-red-500"
                                )}>
                                  {entry.confidence}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                              <span>PTS: {stats.points} | REB: {stats.rebounds} | AST: {stats.assists}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleLoadFromHistory(entry)}
                              data-testid={`button-load-history-${entry.id}`}
                            >
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => deleteMutation.mutate(entry.id)}
                              data-testid={`button-delete-history-${entry.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </Paywall>
  );
}

function EditableStatBox({ label, statKey, value, icon, color, size = "md", negative = false, editable, editingField, setEditingField, onUpdate }: {
  label: string;
  statKey: string;
  value: number;
  icon?: any;
  color?: string;
  size?: string;
  negative?: boolean;
  editable: boolean;
  editingField: string | null;
  setEditingField: (f: string | null) => void;
  onUpdate: (key: any, value: number) => void;
}) {
  const [inputValue, setInputValue] = useState(String(value));
  const isEditing = editingField === statKey;

  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  const commit = () => {
    const num = parseInt(inputValue);
    if (!isNaN(num) && num >= 0) {
      onUpdate(statKey, num);
    }
    setEditingField(null);
  };

  if (isEditing) {
    return (
      <div className={cn("p-3 bg-accent/10 rounded-lg text-center border-2 border-accent/50", size === "sm" && "p-2")}>
        <Input
          type="number"
          min={0}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditingField(null); }}
          className="h-8 text-center font-mono font-bold text-lg bg-background"
          autoFocus
          data-testid={`input-edit-${statKey}`}
        />
        <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{label}</div>
      </div>
    );
  }

  const Icon = icon;
  return (
    <div
      className={cn(
        "p-3 bg-muted/50 rounded-lg text-center transition-colors",
        size === "sm" && "p-2",
        editable && "cursor-pointer hover:bg-accent/10 hover:border-accent/30 border border-transparent"
      )}
      onClick={() => editable && setEditingField(statKey)}
      data-testid={`stat-${statKey}`}
    >
      {Icon && <Icon className={cn("w-5 h-5 mx-auto mb-1", color)} />}
      <div className={cn(
        "font-mono font-bold",
        size === "sm" ? "text-lg" : "text-2xl",
        negative ? "text-red-400" : "text-foreground"
      )}>
        {value}
      </div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      {editable && <Edit3 className="w-3 h-3 mx-auto mt-1 text-muted-foreground/50" />}
    </div>
  );
}

function StatBox({ label, value, icon: Icon, color, size = "md", negative = false }: any) {
  return (
    <div className={cn(
      "p-3 bg-muted/50 rounded-lg text-center",
      size === "sm" && "p-2"
    )}>
      {Icon && <Icon className={cn("w-5 h-5 mx-auto mb-1", color)} />}
      <div className={cn(
        "font-mono font-bold",
        size === "sm" ? "text-lg" : "text-2xl",
        negative ? "text-red-400" : "text-foreground"
      )}>
        {value}
      </div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  );
}
