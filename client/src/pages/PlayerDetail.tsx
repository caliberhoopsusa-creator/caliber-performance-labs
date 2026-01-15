import { usePlayer, useDeleteGame } from "@/hooks/use-basketball";
import { useRoute, Link } from "wouter";
import { StatCard } from "@/components/StatCard";
import { GradeBadge } from "@/components/GradeBadge";
import { ArrowLeft, Plus, Calendar, Trash2, Award, ClipboardList } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function PlayerDetail() {
  const [, params] = useRoute("/players/:id");
  const id = Number(params?.id);
  const { data: player, isLoading } = usePlayer(id);
  const { mutate: deleteGame } = useDeleteGame();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center">
        <h2 className="text-2xl font-display font-bold text-white mb-2">Player Not Found</h2>
        <Link href="/players" className="text-primary hover:underline">Return to Roster</Link>
      </div>
    );
  }

  const games = player.games || [];
  
  // Calculate Averages
  const avgPoints = games.length ? (games.reduce((acc, g) => acc + g.points, 0) / games.length).toFixed(1) : "—";
  const avgReb = games.length ? (games.reduce((acc, g) => acc + g.rebounds, 0) / games.length).toFixed(1) : "—";
  const avgAst = games.length ? (games.reduce((acc, g) => acc + g.assists, 0) / games.length).toFixed(1) : "—";
  
  // Recent Trend Data
  const trendData = [...games]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(g => ({
      date: format(new Date(g.date), 'MM/dd'),
      points: g.points,
      gradeVal: g.grade === 'A+' ? 100 : g.grade === 'A' ? 95 : g.grade === 'A-' ? 90 : 
               g.grade === 'B+' ? 88 : g.grade === 'B' ? 85 : g.grade === 'B-' ? 80 :
               g.grade === 'C+' ? 78 : g.grade === 'C' ? 75 : g.grade === 'C-' ? 70 :
               g.grade === 'D' ? 65 : 50, // Simplistic numeric mapping
      grade: g.grade
    }))
    .slice(-10); // Last 10 games

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <Link href="/players" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-white transition-colors uppercase tracking-wider">
          <ArrowLeft className="w-4 h-4" /> Back to Roster
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card border border-white/5 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />

          <div className="flex items-center gap-6 relative z-10">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-secondary to-background border-4 border-white/10 flex items-center justify-center text-4xl md:text-5xl font-display font-bold text-white shadow-2xl">
              {player.jerseyNumber || "#"}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border border-primary/20">{player.position}</span>
                <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{player.team}</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-display font-bold text-white uppercase tracking-tight leading-none mb-2">{player.name}</h1>
              <p className="text-lg text-muted-foreground font-medium">{player.height} • {games.length} Games Tracked</p>
            </div>
          </div>

          <Link href={`/analyze?playerId=${player.id}`}>
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 gap-2 h-12 px-8">
              <Plus className="w-5 h-5" /> Log Game
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="PPG" value={avgPoints} highlight={true} />
        <StatCard label="RPG" value={avgReb} />
        <StatCard label="APG" value={avgAst} />
        <StatCard label="Games" value={games.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trend Graph */}
        <div className="lg:col-span-2 bg-card border border-white/5 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Performance Trend
            </h3>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-primary" /> Points</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-white/20" /> Grade Score</div>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="rgba(255,255,255,0.3)" 
                    tick={{fill: 'rgba(255,255,255,0.3)', fontSize: 12}} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="rgba(255,255,255,0.3)" 
                    tick={{fill: 'rgba(255,255,255,0.3)', fontSize: 12}} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    domain={[0, 100]} 
                    hide 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="points" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4}}
                    activeDot={{r: 6, fill: '#fff'}}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="gradeVal" 
                    stroke="rgba(255,255,255,0.2)" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No game data available for trends.
              </div>
            )}
          </div>
        </div>

        {/* Recent Games List */}
        <div className="bg-card border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col h-full">
          <h3 className="text-lg font-bold font-display text-white mb-6 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" /> Recent Games
          </h3>
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {games.length === 0 ? (
              <div className="text-muted-foreground text-sm text-center py-10">No games logged yet.</div>
            ) : (
              [...games].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(game => (
                <div key={game.id} className="bg-secondary/20 hover:bg-secondary/40 border border-white/5 p-4 rounded-xl transition-colors group">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-0.5">
                        {format(new Date(game.date), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-sm font-bold text-white truncate max-w-[120px]">
                        vs {game.opponent}
                      </div>
                    </div>
                    <GradeBadge grade={game.grade || "-"} size="sm" />
                  </div>
                  
                  <div className="flex justify-between items-end border-t border-white/5 pt-3 mt-1">
                    <div className="flex gap-3 text-xs font-medium text-white/80">
                      <span><span className="text-muted-foreground">PTS</span> {game.points}</span>
                      <span><span className="text-muted-foreground">REB</span> {game.rebounds}</span>
                      <span><span className="text-muted-foreground">AST</span> {game.assists}</span>
                    </div>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card border-white/10 text-white">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Game Log?</AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground">
                            This will permanently remove this game and affect the player's averages.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-secondary text-white hover:bg-secondary/80 border-transparent">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteGame(game.id)} className="bg-red-500 hover:bg-red-600 text-white font-bold">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
