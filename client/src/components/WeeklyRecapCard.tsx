import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, TrendingDown, Minus, Flame,
  Award, Share2, Download
} from "lucide-react";
import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import { cn } from "@/lib/utils";
import { PlatformExportModal } from "./PlatformExportModal";
import { format } from "date-fns";
import caliberLogo from "@assets/caliber-logo-orange.png";

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
  if (grade.startsWith('A')) return { text: "text-emerald-400", bg: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/30", raw: "#34d399" };
  if (grade.startsWith('B')) return { text: "text-accent", bg: "from-accent/20 to-accent/5", border: "border-accent/30", raw: "#ea580c" };
  if (grade.startsWith('C')) return { text: "text-yellow-400", bg: "from-yellow-500/20 to-yellow-500/5", border: "border-yellow-500/30", raw: "#facc15" };
  return { text: "text-red-400", bg: "from-red-500/20 to-red-500/5", border: "border-red-500/30", raw: "#f87171" };
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'up') return <TrendingUp className="w-4 h-4 text-emerald-400" />;
  if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
}

function StatBox({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-3 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent" />
      <div className="relative">
        <p className={cn("text-3xl font-black tracking-tight", color)}>{value}</p>
        <p className="text-[10px] text-white/40 uppercase tracking-[0.15em] mt-0.5 font-semibold">{label}</p>
      </div>
    </div>
  );
}

function WeeklyRecapShareCard({ data }: { data: WeeklyRecapData }) {
  const gradeColor = getGradeColor(data.avgGrade);
  const weekRange = `${format(new Date(data.weekStartDate), 'MMM d')} - ${format(new Date(data.weekEndDate), 'MMM d, yyyy')}`;
  
  return (
    <div 
      className="w-[400px] h-[540px] rounded-3xl overflow-hidden relative"
      style={{ background: "linear-gradient(165deg, #0a1628 0%, #111b33 35%, #0d1a2d 65%, #1a0f30 100%)" }}
      data-testid="shareable-weekly-recap"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-accent/8 blur-[80px]" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-purple-600/12 blur-[80px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-indigo-500/10 blur-[60px]" />
      </div>

      <div className="relative z-10 h-full flex flex-col p-6">
        <div className="flex items-center justify-between gap-2 mb-5">
          <div className="flex items-center gap-2.5">
            <img src={caliberLogo} alt="Caliber" className="w-8 h-8 rounded-lg object-cover" />
            <span className="text-sm font-black uppercase tracking-[0.2em] text-white">Caliber</span>
          </div>
          <Badge className="bg-emerald-500/90 text-white text-[10px] font-bold uppercase tracking-wider">
            Weekly Recap
          </Badge>
        </div>
        
        <div className="text-center mb-5">
          <h2 className="text-2xl font-black text-white uppercase tracking-wide">{data.playerName}</h2>
          <p className="text-xs text-accent/60 mt-1 font-medium tracking-wide">{weekRange}</p>
        </div>

        <div className="flex-1 flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <StatBox value={data.gamesPlayed} label="Games" color="text-accent" />
            <div className={cn("rounded-xl bg-gradient-to-br border p-3 text-center relative overflow-hidden", gradeColor.bg, gradeColor.border)}>
              <div className="relative">
                <div className="flex items-center justify-center gap-1">
                  <p className={cn("text-3xl font-black tracking-tight", gradeColor.text)}>{data.avgGrade}</p>
                  <TrendIcon trend={data.gradeTrend} />
                </div>
                <p className="text-[10px] text-white/40 uppercase tracking-[0.15em] mt-0.5 font-semibold">Avg Grade</p>
              </div>
            </div>
          </div>
          
          {data.sport === 'basketball' ? (
            <div className="grid grid-cols-3 gap-2.5">
              <StatBox value={data.avgPoints} label="PPG" color="text-amber-400" />
              <StatBox value={data.totalRebounds} label="REB" color="text-accent" />
              <StatBox value={data.totalAssists} label="AST" color="text-violet-400" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              <StatBox value={data.totalTouchdowns} label="TDs" color="text-amber-400" />
              <StatBox value={data.totalYards} label="YDS" color="text-accent" />
            </div>
          )}
          
          <div className="flex items-center justify-center gap-5 mt-auto pt-2 flex-wrap">
            {data.currentStreak > 0 && (
              <div className="flex items-center gap-1.5">
                <Flame className="w-5 h-5 text-orange-400" style={{ filter: "drop-shadow(0 0 4px #f97316)" }} />
                <span className="text-sm font-bold text-white">{data.currentStreak}-day streak</span>
              </div>
            )}
            {data.badgesEarned > 0 && (
              <div className="flex items-center gap-1.5">
                <Award className="w-5 h-5 text-yellow-400" style={{ filter: "drop-shadow(0 0 4px #facc15)" }} />
                <span className="text-sm font-bold text-white">{data.badgesEarned} badges</span>
              </div>
            )}
          </div>
          
          <div className="text-center pt-1 pb-1">
            <p className={cn("text-sm font-bold tracking-wide", 
              data.gradeTrend === 'up' ? 'text-emerald-400' : 
              data.gradeTrend === 'down' ? 'text-red-400' : 'text-white/40'
            )}>
              {data.gradeTrend === 'up' ? 'Grade Trending Up' : 
               data.gradeTrend === 'down' ? 'Grade Trending Down' : 'Grade Holding Steady'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-1.5 pt-1">
            <div className="w-8 h-[1px] bg-white/10" />
            <span className="text-[9px] text-white/20 uppercase tracking-[0.2em] font-semibold">Caliber Performance Labs</span>
            <div className="w-8 h-[1px] bg-white/10" />
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
  const weekRange = `${format(new Date(data.weekStartDate), 'MMM d')} - ${format(new Date(data.weekEndDate), 'MMM d, yyyy')}`;

  return (
    <>
      <Card 
        className="overflow-hidden border-0 relative" 
        style={{ background: "linear-gradient(165deg, #0a1628 0%, #111b33 35%, #0d1a2d 65%, #1a0f30 100%)" }}
        data-testid="card-weekly-recap"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-accent/8 blur-[60px]" />
          <div className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full bg-purple-600/10 blur-[60px]" />
        </div>

        <div className="relative z-10 p-5">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2.5">
              <img src={caliberLogo} alt="Caliber" className="w-7 h-7 rounded-md object-cover" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-white/90">Caliber</span>
            </div>
            <Badge className="bg-emerald-500/90 text-white text-[9px] font-bold uppercase tracking-wider">
              Weekly Recap
            </Badge>
          </div>

          <div className="text-center mb-4">
            <h3 className="text-lg font-black text-white uppercase tracking-wide" data-testid="text-recap-player-name">{data.playerName}</h3>
            <p className="text-[11px] text-accent/50 mt-0.5 font-medium tracking-wide">{weekRange}</p>
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-white/[0.04] border border-white/[0.08] p-2.5 text-center">
                <p className="text-2xl font-black text-accent">{data.gamesPlayed}</p>
                <p className="text-[9px] text-white/40 uppercase tracking-[0.15em] font-semibold">Games</p>
              </div>
              <div className={cn("rounded-lg bg-gradient-to-br border p-2.5 text-center", gradeColor.bg, gradeColor.border)}>
                <div className="flex items-center justify-center gap-1">
                  <p className={cn("text-2xl font-black", gradeColor.text)}>{data.avgGrade}</p>
                  <TrendIcon trend={data.gradeTrend} />
                </div>
                <p className="text-[9px] text-white/40 uppercase tracking-[0.15em] font-semibold">Avg Grade</p>
              </div>
            </div>
            
            {data.sport === 'basketball' ? (
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-white/[0.04] border border-white/[0.08] p-2 text-center">
                  <p className="text-xl font-black text-amber-400">{data.avgPoints}</p>
                  <p className="text-[9px] text-white/40 uppercase tracking-[0.15em] font-semibold">PPG</p>
                </div>
                <div className="rounded-lg bg-white/[0.04] border border-white/[0.08] p-2 text-center">
                  <p className="text-xl font-black text-accent">{data.totalRebounds}</p>
                  <p className="text-[9px] text-white/40 uppercase tracking-[0.15em] font-semibold">REB</p>
                </div>
                <div className="rounded-lg bg-white/[0.04] border border-white/[0.08] p-2 text-center">
                  <p className="text-xl font-black text-violet-400">{data.totalAssists}</p>
                  <p className="text-[9px] text-white/40 uppercase tracking-[0.15em] font-semibold">AST</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-white/[0.04] border border-white/[0.08] p-2 text-center">
                  <p className="text-xl font-black text-amber-400">{data.totalTouchdowns}</p>
                  <p className="text-[9px] text-white/40 uppercase tracking-[0.15em] font-semibold">TDs</p>
                </div>
                <div className="rounded-lg bg-white/[0.04] border border-white/[0.08] p-2 text-center">
                  <p className="text-xl font-black text-accent">{data.totalYards}</p>
                  <p className="text-[9px] text-white/40 uppercase tracking-[0.15em] font-semibold">YDS</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-center gap-4 mb-3 flex-wrap">
            {data.currentStreak > 0 && (
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400" style={{ filter: "drop-shadow(0 0 4px #f97316)" }} />
                <span className="text-xs font-bold text-white">{data.currentStreak}-day streak</span>
              </div>
            )}
            {data.badgesEarned > 0 && (
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-yellow-400" style={{ filter: "drop-shadow(0 0 4px #facc15)" }} />
                <span className="text-xs font-bold text-white">{data.badgesEarned} badges</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5 border-white/10 text-white/70 bg-white/5" data-testid="button-download-recap">
              <Download className="w-3.5 h-3.5" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowExport(true)} className="gap-1.5 border-accent/30 text-accent bg-accent/10" data-testid="button-export-recap">
              <Share2 className="w-3.5 h-3.5" />
              Share
            </Button>
          </div>
        </div>
      </Card>
      
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <div ref={cardRef}>
          <WeeklyRecapShareCard data={data} />
        </div>
      </div>
      
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
