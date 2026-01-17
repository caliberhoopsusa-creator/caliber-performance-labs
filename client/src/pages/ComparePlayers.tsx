import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { usePlayers } from "@/hooks/use-basketball";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GradeBadge } from "@/components/GradeBadge";
import { Activity, Target, Zap, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Paywall } from "@/components/Paywall";

export default function ComparePlayers() {
  const { data: players } = usePlayers();
  const [p1Id, setP1Id] = useState<string>("");
  const [p2Id, setP2Id] = useState<string>("");

  const { data: comparison, isLoading } = useQuery({
    queryKey: ['/api/analytics/compare', p1Id, p2Id],
    queryFn: async () => {
      if (!p1Id || !p2Id) return null;
      const url = new URL(window.location.origin + api.analytics.compare.path);
      url.searchParams.append('player1Id', p1Id);
      url.searchParams.append('player2Id', p2Id);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch comparison");
      return res.json();
    },
    enabled: !!p1Id && !!p2Id
  });

  const getAvg = (games: any[], field: string) => {
    if (!games?.length) return 0;
    return (games.reduce((acc, g) => acc + (g[field] || 0), 0) / games.length).toFixed(1);
  };

  return (
    <Paywall requiredTier="pro" featureName="Head-to-Head Comparison">
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h2 className="text-3xl md:text-4xl font-display font-bold text-white uppercase tracking-tight">Head-to-Head</h2>
        <p className="text-muted-foreground font-medium">Compare performance metrics between two players</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Player 1</label>
          <Select onValueChange={setP1Id} value={p1Id}>
            <SelectTrigger className="bg-card border-white/10 text-white h-14">
              <SelectValue placeholder="Select first player..." />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10 text-white">
              {players?.map((p: any) => (
                <SelectItem key={p.id} value={String(p.id)} disabled={String(p.id) === p2Id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Player 2</label>
          <Select onValueChange={setP2Id} value={p2Id}>
            <SelectTrigger className="bg-card border-white/10 text-white h-14">
              <SelectValue placeholder="Select second player..." />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10 text-white">
              {players?.map((p: any) => (
                <SelectItem key={p.id} value={String(p.id)} disabled={String(p.id) === p1Id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {comparison && (
        <div className="space-y-6 animate-in zoom-in-95 duration-500">
          <div className="grid grid-cols-2 gap-px bg-white/5 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            <ComparisonCard player={comparison.player1} side="left" />
            <ComparisonCard player={comparison.player2} side="right" />
          </div>

          <div className="bg-card border border-white/5 rounded-2xl p-8 shadow-xl">
            <h3 className="text-xl font-bold font-display text-white mb-8 text-center uppercase tracking-widest">Statistical Comparison</h3>
            <div className="space-y-8">
              <StatRow 
                label="Points Per Game" 
                v1={getAvg(comparison.player1.games, 'points')} 
                v2={getAvg(comparison.player2.games, 'points')} 
              />
              <StatRow 
                label="Rebounds Per Game" 
                v1={getAvg(comparison.player1.games, 'rebounds')} 
                v2={getAvg(comparison.player2.games, 'rebounds')} 
              />
              <StatRow 
                label="Assists Per Game" 
                v1={getAvg(comparison.player1.games, 'assists')} 
                v2={getAvg(comparison.player2.games, 'assists')} 
              />
              <StatRow 
                label="FG Percentage" 
                v1={((comparison.player1.games?.reduce((acc:any, g:any) => acc + g.fgMade, 0) / comparison.player1.games?.reduce((acc:any, g:any) => acc + g.fgAttempted, 1)) * 100).toFixed(1)} 
                v2={((comparison.player2.games?.reduce((acc:any, g:any) => acc + g.fgMade, 0) / comparison.player2.games?.reduce((acc:any, g:any) => acc + g.fgAttempted, 1)) * 100).toFixed(1)} 
                suffix="%"
              />
            </div>
          </div>
        </div>
      )}
    </div>
    </Paywall>
  );
}

function ComparisonCard({ player, side }: any) {
  return (
    <div className={cn(
      "p-8 flex flex-col items-center gap-6",
      side === "left" ? "bg-primary/5" : "bg-secondary/5"
    )}>
      <div className="w-24 h-24 rounded-full bg-background border-4 border-white/10 flex items-center justify-center text-4xl font-display font-bold text-white shadow-xl">
        {player.jerseyNumber || "#"}
      </div>
      <div className="text-center">
        <h3 className="text-2xl font-bold font-display text-white uppercase tracking-tight">{player.name}</h3>
        <p className="text-sm text-muted-foreground font-medium">{player.position} • {player.team}</p>
      </div>
    </div>
  );
}

function StatRow({ label, v1, v2, suffix = "" }: any) {
  const n1 = parseFloat(v1);
  const n2 = parseFloat(v2);
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
        <span className={cn(n1 > n2 && "text-primary")}>{v1}{suffix}</span>
        <span>{label}</span>
        <span className={cn(n2 > n1 && "text-primary")}>{v2}{suffix}</span>
      </div>
      <div className="flex h-2 w-full bg-white/5 rounded-full overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-500", n1 > n2 ? "bg-primary" : "bg-white/20")} 
          style={{ width: `${(n1 / (n1 + n2)) * 100}%` }} 
        />
        <div 
          className={cn("h-full transition-all duration-500", n2 > n1 ? "bg-primary" : "bg-white/20")} 
          style={{ width: `${(n2 / (n1 + n2)) * 100}%` }} 
        />
      </div>
    </div>
  );
}
