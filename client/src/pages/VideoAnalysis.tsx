import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { usePlayers } from "@/hooks/use-basketball";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Video, FileText, Loader2, CheckCircle, AlertCircle, Target, Shield, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface AnalysisResult {
  playerName: string;
  stats: {
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
  };
  observations: string;
  confidence?: string;
}

export default function VideoAnalysis() {
  const { data: players } = usePlayers();
  const { toast } = useToast();
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [customPlayerName, setCustomPlayerName] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [playByPlay, setPlayByPlay] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);

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
      setResult(data);
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
      setResult(data);
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

  const isLoading = videoMutation.isPending || textMutation.isPending;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h2 className="text-3xl md:text-4xl font-display font-bold text-white uppercase tracking-tight">Video Analysis</h2>
        <p className="text-muted-foreground font-medium">Upload game footage or enter play-by-play to extract stats with AI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          {/* Player Selection */}
          <Card className="bg-card border-white/5">
            <CardHeader>
              <CardTitle className="text-lg font-display uppercase tracking-wider">Select Player</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                <SelectTrigger className="bg-background border-white/10" data-testid="select-player">
                  <SelectValue placeholder="Choose a player or enter custom..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10">
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
                  className="bg-background border-white/10"
                  data-testid="input-custom-player"
                />
              )}
            </CardContent>
          </Card>

          {/* Analysis Input Tabs */}
          <Tabs defaultValue="video" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/5">
              <TabsTrigger value="video" className="gap-2" data-testid="tab-video">
                <Video className="w-4 h-4" /> Video Upload
              </TabsTrigger>
              <TabsTrigger value="text" className="gap-2" data-testid="tab-text">
                <FileText className="w-4 h-4" /> Play-by-Play
              </TabsTrigger>
            </TabsList>

            <TabsContent value="video">
              <Card className="bg-card border-white/5">
                <CardContent className="pt-6 space-y-4">
                  <div 
                    className={cn(
                      "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
                      videoFile ? "border-primary/50 bg-primary/5" : "border-white/10 hover:border-white/20"
                    )}
                  >
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="video-upload"
                      data-testid="input-video-upload"
                    />
                    <label htmlFor="video-upload" className="cursor-pointer block">
                      {videoFile ? (
                        <div className="space-y-2">
                          <CheckCircle className="w-12 h-12 mx-auto text-primary" />
                          <p className="font-medium text-white">{videoFile.name}</p>
                          <p className="text-sm text-muted-foreground">{(videoFile.size / 1024 / 1024).toFixed(1)} MB</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                          <p className="font-medium text-white">Drop video or click to upload</p>
                          <p className="text-sm text-muted-foreground">MP4, WebM, MOV (max 50MB)</p>
                        </div>
                      )}
                    </label>
                  </div>

                  <Button 
                    onClick={handleVideoSubmit} 
                    className="w-full" 
                    disabled={isLoading || !videoFile}
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="text">
              <Card className="bg-card border-white/5">
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
                    className="min-h-[200px] bg-background border-white/10"
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

        {/* Results Section */}
        <div className="space-y-6">
          {result ? (
            <Card className="bg-card border-white/5 animate-in zoom-in-95 duration-300">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="font-display uppercase tracking-wider">Extracted Stats</span>
                  {result.confidence && (
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full font-mono uppercase",
                      result.confidence === 'high' ? "bg-green-500/20 text-green-500" :
                      result.confidence === 'medium' ? "bg-yellow-500/20 text-yellow-500" :
                      "bg-red-500/20 text-red-500"
                    )}>
                      {result.confidence} confidence
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-4 bg-primary/10 rounded-xl border border-primary/20">
                  <h3 className="text-xl font-display font-bold text-white">{result.playerName}</h3>
                </div>

                {/* Main Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <StatBox label="PTS" value={result.stats.points} icon={Target} color="text-primary" />
                  <StatBox label="REB" value={result.stats.rebounds} icon={Shield} color="text-blue-500" />
                  <StatBox label="AST" value={result.stats.assists} icon={Zap} color="text-yellow-500" />
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <StatBox label="STL" value={result.stats.steals} size="sm" />
                  <StatBox label="BLK" value={result.stats.blocks} size="sm" />
                  <StatBox label="TO" value={result.stats.turnovers} size="sm" negative />
                  <StatBox label="FG" value={`${result.stats.fgMade}/${result.stats.fgAttempted}`} size="sm" />
                </div>

                {/* AI-Calculated Advanced Metrics */}
                <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    AI-Calculated Advanced Metrics
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white/5 rounded-lg">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Hustle Score</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 transition-all duration-500"
                            style={{ width: `${result.stats.hustleScore}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-white">{result.stats.hustleScore}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Defense Rating</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${result.stats.defenseRating}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-white">{result.stats.defenseRating}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Plus/Minus</div>
                      <div className={cn(
                        "font-mono font-bold text-xl",
                        (result.stats.plusMinus ?? 0) > 0 ? "text-green-500" : 
                        (result.stats.plusMinus ?? 0) < 0 ? "text-red-500" : "text-white"
                      )}>
                        {(result.stats.plusMinus ?? 0) > 0 ? "+" : ""}{result.stats.plusMinus ?? 0}
                      </div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">PER</div>
                      <div className="font-mono font-bold text-xl text-purple-400">
                        {(result.stats.per ?? 15).toFixed(1)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(result.stats.per ?? 15) >= 25 ? "Elite" : 
                         (result.stats.per ?? 15) >= 20 ? "All-Star" : 
                         (result.stats.per ?? 15) >= 15 ? "Above Avg" : 
                         (result.stats.per ?? 15) >= 10 ? "Average" : "Developing"}
                      </div>
                    </div>
                  </div>
                </div>

                {result.observations && (
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Scout Notes</div>
                    <p className="text-white/80 text-sm leading-relaxed">{result.observations}</p>
                  </div>
                )}

                <Button 
                  onClick={() => {
                    // TODO: Navigate to game entry with pre-filled stats
                    toast({ title: "Coming Soon", description: "Auto-fill game entry with these stats" });
                  }}
                  className="w-full"
                  variant="outline"
                  data-testid="button-use-stats"
                >
                  Use Stats in Game Entry
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-white/5">
              <CardContent className="py-16 text-center">
                <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">No Analysis Yet</h3>
                <p className="text-sm text-muted-foreground/70 mt-1">Upload a video or enter play-by-play notes to extract stats</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, icon: Icon, color, size = "md", negative = false }: any) {
  return (
    <div className={cn(
      "p-3 bg-white/5 rounded-lg text-center",
      size === "sm" && "p-2"
    )}>
      {Icon && <Icon className={cn("w-5 h-5 mx-auto mb-1", color)} />}
      <div className={cn(
        "font-mono font-bold",
        size === "sm" ? "text-lg" : "text-2xl",
        negative ? "text-red-400" : "text-white"
      )}>
        {value}
      </div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  );
}
