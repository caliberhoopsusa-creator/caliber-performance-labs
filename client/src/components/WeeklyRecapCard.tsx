import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, TrendingUp, TrendingDown, Minus, Flame,
  Award, Share2, Download, Activity
} from "lucide-react";
import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import { cn } from "@/lib/utils";
import { PlatformExportModal } from "./PlatformExportModal";
import { format } from "date-fns";

interface WeeklyRecapData {
  hasRecap: boolean;
  playerName: string;
  playerPhoto?: string;
  sport: string;
  position: string;
  weekStartDate: string;
  weekEndDate: string;
  gamesPlayed: number;
  avgGrade: string;
  bestGrade: string;
  totalPoints: number;
  avgPoints: number;
  totalRebounds: number;
  totalAssists: number;
  totalTouchdowns: number;
  totalYards: number;
  currentStreak: number;
  badgesEarned: number;
  gradeTrend: 'up' | 'down' | 'stable';
  message?: string;
}

function getGradeColor(grade: string) {
  if (grade.startsWith('A')) return { text: "text-emerald-400", bg: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/30" };
  if (grade.startsWith('B')) return { text: "text-blue-400", bg: "from-blue-500/20 to-blue-500/5", border: "border-blue-500/30" };
  if (grade.startsWith('C')) return { text: "text-yellow-400", bg: "from-yellow-500/20 to-yellow-500/5", border: "border-yellow-500/30" };
  return { text: "text-red-400", bg: "from-red-500/20 to-red-500/5", border: "border-red-500/30" };
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'up') return <TrendingUp className="w-4 h-4 text-emerald-400" />;
  if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
}

function WeeklyRecapShareCard({ data }: { data: WeeklyRecapData }) {
  const gradeColor = getGradeColor(data.avgGrade);
  const weekRange = `${format(new Date(data.weekStartDate), 'MMM d')} - ${format(new Date(data.weekEndDate), 'MMM d, yyyy')}`;
  
  return (
    <div 
      className="w-[400px] h-[500px] rounded-3xl overflow-hidden relative"
      style={{ background: "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f172a 100%)" }}
      data-testid="shareable-weekly-recap"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-purple-500/15 blur-3xl" />
      </div>

      <div className="relative z-10 h-full flex flex-col p-6">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-primary">Caliber</span>
          </div>
          <Badge className="bg-white/10 text-white/70 border-white/10 text-[10px] no-default-hover-elevate no-default-active-elevate">
            <Calendar className="w-3 h-3 mr-1" />
            Weekly Recap
          </Badge>
        </div>
        
        <div className="text-center mb-4">
          <h2 className="text-xl font-black text-white uppercase">{data.playerName}</h2>
          <p className="text-xs text-white/50">{weekRange}</p>
        </div>

        <div className="flex-1 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
              <p className="text-3xl font-black text-white">{data.gamesPlayed}</p>
              <p className="text-[10px] text-white/50 uppercase tracking-wider">Games</p>
            </div>
            <div className={cn("rounded-xl bg-gradient-to-br border p-3 text-center", gradeColor.bg, gradeColor.border)}>
              <p className={cn("text-3xl font-black", gradeColor.text)}>{data.avgGrade}</p>
              <p className="text-[10px] text-white/50 uppercase tracking-wider flex items-center justify-center gap-1">
                Avg Grade <TrendIcon trend={data.gradeTrend} />
              </p>
            </div>
          </div>
          
          {data.sport === 'basketball' ? (
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 text-center">
                <p className="text-2xl font-black text-orange-400">{data.avgPoints}</p>
                <p className="text-[10px] text-white/50 uppercase">PPG</p>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 text-center">
                <p className="text-2xl font-black text-blue-400">{data.totalRebounds}</p>
                <p className="text-[10px] text-white/50 uppercase">REB</p>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 text-center">
                <p className="text-2xl font-black text-purple-400">{data.totalAssists}</p>
                <p className="text-[10px] text-white/50 uppercase">AST</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 text-center">
                <p className="text-2xl font-black text-orange-400">{data.totalTouchdowns}</p>
                <p className="text-[10px] text-white/50 uppercase">TDs</p>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 text-center">
                <p className="text-2xl font-black text-blue-400">{data.totalYards}</p>
                <p className="text-[10px] text-white/50 uppercase">YDS</p>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-center gap-4 mt-auto flex-wrap">
            {data.currentStreak > 0 && (
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-bold text-white">{data.currentStreak}-day streak</span>
              </div>
            )}
            {data.badgesEarned > 0 && (
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-bold text-white">{data.badgesEarned} badges</span>
              </div>
            )}
          </div>
          
          <div className="text-center">
            <p className={cn("text-sm font-bold", 
              data.gradeTrend === 'up' ? 'text-emerald-400' : 
              data.gradeTrend === 'down' ? 'text-red-400' : 'text-white/50'
            )}>
              {data.gradeTrend === 'up' ? 'Grade Trending Up' : 
               data.gradeTrend === 'down' ? 'Grade Trending Down' : 'Grade Holding Steady'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WeeklyRecapCard({ playerId }: { playerId: number }) {
  const [showExport, setShowExport] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const { data, isLoading } = useQuery<WeeklyRecapData>({
    queryKey: ['/api/players', playerId, 'weekly-recap'],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}/weekly-recap`);
      if (!res.ok) throw new Error("Failed to fetch recap");
      return res.json();
    },
    staleTime: 1000 * 60 * 30,
  });

  if (isLoading || !data || !data.hasRecap) return null;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 2, useCORS: true });
      const link = document.createElement("a");
      link.download = `caliber-weekly-recap-${data.playerName.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error("Error generating recap image:", e);
    }
  };

  const gradeColor = getGradeColor(data.avgGrade);

  return (
    <>
      <Card className="bg-gradient-to-br from-blue-950/40 via-purple-950/20 to-blue-950/40 border-blue-500/20 overflow-hidden" data-testid="card-weekly-recap">
        <div className="p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400">Your Week in Review</h3>
            </div>
            <div className="flex items-center gap-1">
              <TrendIcon trend={data.gradeTrend} />
              <span className="text-xs text-muted-foreground">
                {data.gradeTrend === 'up' ? 'Improving' : data.gradeTrend === 'down' ? 'Declining' : 'Steady'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center">
              <p className="text-2xl font-black text-white">{data.gamesPlayed}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Games</p>
            </div>
            <div className="text-center">
              <p className={cn("text-2xl font-black", gradeColor.text)}>{data.avgGrade}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Avg Grade</p>
            </div>
            <div className="text-center">
              {data.sport === 'basketball' ? (
                <>
                  <p className="text-2xl font-black text-orange-400">{data.avgPoints}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">PPG</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-black text-orange-400">{data.totalTouchdowns}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">TDs</p>
                </>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5" data-testid="button-download-recap">
              <Download className="w-3 h-3" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowExport(true)} className="gap-1.5 border-primary/30 text-primary" data-testid="button-export-recap">
              <Share2 className="w-3 h-3" />
              Share
            </Button>
          </div>
        </div>
        
        <div className="absolute -left-[9999px]" aria-hidden="true">
          <div ref={cardRef}>
            <WeeklyRecapShareCard data={data} />
          </div>
        </div>
      </Card>
      
      <PlatformExportModal
        open={showExport}
        onOpenChange={setShowExport}
        playerName={data.playerName}
      >
        <WeeklyRecapShareCard data={data} />
      </PlatformExportModal>
    </>
  );
}
