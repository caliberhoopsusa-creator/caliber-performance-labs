import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, Cell, CartesianGrid } from 'recharts';
import { Settings2, TrendingUp, Target, Activity, BarChart3, Award } from "lucide-react";
import type { Game } from "@shared/schema";
import { format } from "date-fns";

// Premium tooltip component with glassmorphic styling
const PremiumTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/80 backdrop-blur-md border border-primary/20 rounded-lg p-3 shadow-xl shadow-primary/10">
        <p className="text-xs text-muted-foreground">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export interface WidgetConfig {
  id: string;
  label: string;
  description: string;
  icon: any;
}

export const AVAILABLE_WIDGETS: WidgetConfig[] = [
  { id: "trends", label: "Performance Trends", description: "Points, rebounds, assists over time", icon: TrendingUp },
  { id: "grades", label: "Grade History", description: "Your game grades over time", icon: Award },
  { id: "radar", label: "Skill Breakdown", description: "Radar chart of your abilities", icon: Target },
  { id: "averages", label: "Season Averages", description: "Key stats at a glance", icon: BarChart3 },
  { id: "shooting", label: "Shooting Splits", description: "FG%, 3PT%, FT% breakdown", icon: Activity },
];

const DEFAULT_WIDGETS = ["trends", "averages", "radar"];

interface ProfileWidgetsProps {
  games: Game[];
  selectedWidgets: string[] | null;
  onWidgetsChange: (widgets: string[]) => void;
  isOwnProfile: boolean;
}

export function ProfileWidgets({ games, selectedWidgets, onWidgetsChange, isOwnProfile }: ProfileWidgetsProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempWidgets, setTempWidgets] = useState<string[]>([]);

  const sortedGames = useMemo(() => {
    return [...games].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [games]);

  const widgets = selectedWidgets === null ? DEFAULT_WIDGETS : selectedWidgets;

  const handleToggleWidget = (widgetId: string) => {
    setTempWidgets(prev => 
      prev.includes(widgetId) 
        ? prev.filter(w => w !== widgetId)
        : [...prev, widgetId]
    );
  };

  const handleSave = () => {
    onWidgetsChange(tempWidgets);
    setIsSettingsOpen(false);
  };

  const openSettings = () => {
    setTempWidgets([...widgets]);
    setIsSettingsOpen(true);
  };

  if (sortedGames.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">Log some games to see your performance widgets</p>
      </Card>
    );
  }

  const settingsDialog = (
    <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Customize Your Widgets</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {AVAILABLE_WIDGETS.map((widget) => (
            <div key={widget.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30" data-testid={`widget-toggle-${widget.id}`}>
              <div className="flex items-center gap-3">
                <widget.icon className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-white">{widget.label}</p>
                  <p className="text-xs text-muted-foreground">{widget.description}</p>
                </div>
              </div>
              <Switch
                checked={tempWidgets.includes(widget.id)}
                onCheckedChange={() => handleToggleWidget(widget.id)}
                data-testid={`switch-widget-${widget.id}`}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} data-testid="button-save-widgets">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (widgets.length === 0) {
    return isOwnProfile ? (
      <>
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={openSettings} className="gap-2" data-testid="button-customize-widgets">
            <Settings2 className="w-4 h-4" /> Add Widgets
          </Button>
        </div>
        {settingsDialog}
      </>
    ) : null;
  }

  return (
    <div className="space-y-4">
      {isOwnProfile && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={openSettings} className="gap-2" data-testid="button-customize-widgets">
            <Settings2 className="w-4 h-4" /> Customize Widgets
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {widgets.includes("trends") && <TrendsWidget games={sortedGames} />}
        {widgets.includes("grades") && <GradesWidget games={sortedGames} />}
        {widgets.includes("radar") && <RadarWidget games={sortedGames} />}
        {widgets.includes("averages") && <AveragesWidget games={sortedGames} />}
        {widgets.includes("shooting") && <ShootingWidget games={sortedGames} />}
      </div>

      {settingsDialog}
    </div>
  );
}

function TrendsWidget({ games }: { games: Game[] }) {
  const chartData = useMemo(() => {
    return games
      .slice(-10)
      .map(g => ({
        date: format(new Date(g.date), "M/d"),
        points: g.points,
        rebounds: g.rebounds,
        assists: g.assists,
      }));
  }, [games]);

  return (
    <Card className="p-4 animate-fade-up" data-testid="widget-trends">
      <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" /> Performance Trends
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <defs>
              <linearGradient id="pointsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} width={30} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
            <Tooltip content={<PremiumTooltip />} cursor={{ stroke: 'rgba(0,212,255,0.3)' }} />
            <Line type="monotone" dataKey="points" stroke="#00D4FF" strokeWidth={2.5} dot={{ r: 4, fill: '#00D4FF', filter: 'drop-shadow(0 0 8px rgba(0,212,255,0.6))' }} activeDot={{ r: 6, filter: 'drop-shadow(0 0 12px rgba(0,212,255,0.8))' }} isAnimationActive name="PTS" />
            <Line type="monotone" dataKey="rebounds" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981', filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.6))' }} activeDot={{ r: 6, filter: 'drop-shadow(0 0 12px rgba(16,185,129,0.8))' }} isAnimationActive name="REB" />
            <Line type="monotone" dataKey="assists" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: '#f59e0b', filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.6))' }} activeDot={{ r: 6, filter: 'drop-shadow(0 0 12px rgba(245,158,11,0.8))' }} isAnimationActive name="AST" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-4 mt-2 text-xs">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400" /> PTS</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> REB</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> AST</span>
      </div>
    </Card>
  );
}

function GradesWidget({ games }: { games: Game[] }) {
  const GRADE_VALUES: Record<string, number> = {
    'A+': 100, 'A': 95, 'A-': 90,
    'B+': 88, 'B': 85, 'B-': 80,
    'C+': 78, 'C': 75, 'C-': 70,
    'D+': 68, 'D': 65, 'D-': 60,
    'F': 50,
  };

  const chartData = useMemo(() => {
    return games
      .slice(-10)
      .map(g => ({
        date: format(new Date(g.date), "M/d"),
        grade: g.grade || 'C',
        value: GRADE_VALUES[g.grade?.trim().toUpperCase() || 'C'] || 75,
      }));
  }, [games]);

  const getGradeColor = (value: number) => {
    if (value >= 90) return '#22c55e';
    if (value >= 80) return '#3b82f6';
    if (value >= 70) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <Card className="p-4 animate-fade-up" data-testid="widget-grades">
      <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
        <Award className="w-4 h-4 text-primary" /> Grade History
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
            <YAxis domain={[50, 100]} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} width={30} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
            <Tooltip content={({ active, payload }: any) => {
              if (active && payload && payload[0]) {
                return (
                  <div className="bg-card/80 backdrop-blur-md border border-primary/20 rounded-lg p-3 shadow-xl shadow-primary/10">
                    <p className="text-xs text-muted-foreground">{payload[0].payload.date}</p>
                    <p style={{ color: getGradeColor(payload[0].payload.value) }} className="text-sm font-medium">
                      Grade: {payload[0].payload.grade}
                    </p>
                  </div>
                );
              }
              return null;
            }} cursor={{ fill: 'rgba(0,212,255,0.1)' }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getGradeColor(entry.value)}
                  filter={`drop-shadow(0 0 4px ${getGradeColor(entry.value)}40)`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function RadarWidget({ games }: { games: Game[] }) {
  const radarData = useMemo(() => {
    if (games.length === 0) return [];
    
    const avgPoints = games.reduce((acc, g) => acc + g.points, 0) / games.length;
    const avgReb = games.reduce((acc, g) => acc + g.rebounds, 0) / games.length;
    const avgAst = games.reduce((acc, g) => acc + g.assists, 0) / games.length;
    const avgHustle = games.reduce((acc, g) => acc + (g.hustleScore || 50), 0) / games.length;
    const avgDefense = games.reduce((acc, g) => acc + (g.defenseRating || 50), 0) / games.length;

    return [
      { stat: 'Scoring', value: Math.min(100, (avgPoints / 25) * 100) },
      { stat: 'Rebounding', value: Math.min(100, (avgReb / 10) * 100) },
      { stat: 'Playmaking', value: Math.min(100, (avgAst / 8) * 100) },
      { stat: 'Defense', value: avgDefense },
      { stat: 'Hustle', value: avgHustle },
    ];
  }, [games]);

  return (
    <Card className="p-4 animate-fade-up" data-testid="widget-radar">
      <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
        <Target className="w-4 h-4 text-primary" /> Skill Breakdown
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <defs>
              <linearGradient id="radarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <PolarGrid stroke="rgba(255,255,255,0.08)" />
            <PolarAngleAxis dataKey="stat" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.6)' }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              dataKey="value"
              stroke="#00D4FF"
              fill="url(#radarGradient)"
              strokeWidth={2.5}
              isAnimationActive
              filter="drop-shadow(0 0 8px rgba(0,212,255,0.3))"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function AveragesWidget({ games }: { games: Game[] }) {
  const stats = useMemo(() => {
    if (games.length === 0) return { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0 };
    return {
      pts: (games.reduce((acc, g) => acc + g.points, 0) / games.length).toFixed(1),
      reb: (games.reduce((acc, g) => acc + g.rebounds, 0) / games.length).toFixed(1),
      ast: (games.reduce((acc, g) => acc + g.assists, 0) / games.length).toFixed(1),
      stl: (games.reduce((acc, g) => acc + g.steals, 0) / games.length).toFixed(1),
      blk: (games.reduce((acc, g) => acc + g.blocks, 0) / games.length).toFixed(1),
    };
  }, [games]);

  return (
    <Card className="p-4 animate-fade-up" data-testid="widget-averages">
      <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-primary" /> Season Averages
      </h3>
      <div className="grid grid-cols-5 gap-2 text-center">
        <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 hover-elevate transition-all">
          <p className="text-xl font-bold text-cyan-400">{stats.pts}</p>
          <p className="text-xs text-muted-foreground">PTS</p>
        </div>
        <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 hover-elevate transition-all">
          <p className="text-xl font-bold text-cyan-400">{stats.reb}</p>
          <p className="text-xs text-muted-foreground">REB</p>
        </div>
        <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 hover-elevate transition-all">
          <p className="text-xl font-bold text-cyan-400">{stats.ast}</p>
          <p className="text-xs text-muted-foreground">AST</p>
        </div>
        <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 hover-elevate transition-all">
          <p className="text-xl font-bold text-cyan-400">{stats.stl}</p>
          <p className="text-xs text-muted-foreground">STL</p>
        </div>
        <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 hover-elevate transition-all">
          <p className="text-xl font-bold text-cyan-400">{stats.blk}</p>
          <p className="text-xs text-muted-foreground">BLK</p>
        </div>
      </div>
    </Card>
  );
}

function ShootingWidget({ games }: { games: Game[] }) {
  const shooting = useMemo(() => {
    if (games.length === 0) return { fg: '0', three: '0', ft: '0' };
    
    const totalFgMade = games.reduce((acc, g) => acc + g.fgMade, 0);
    const totalFgAtt = games.reduce((acc, g) => acc + g.fgAttempted, 0);
    const total3Made = games.reduce((acc, g) => acc + g.threeMade, 0);
    const total3Att = games.reduce((acc, g) => acc + g.threeAttempted, 0);
    const totalFtMade = games.reduce((acc, g) => acc + g.ftMade, 0);
    const totalFtAtt = games.reduce((acc, g) => acc + g.ftAttempted, 0);

    return {
      fg: totalFgAtt > 0 ? ((totalFgMade / totalFgAtt) * 100).toFixed(1) : '0',
      three: total3Att > 0 ? ((total3Made / total3Att) * 100).toFixed(1) : '0',
      ft: totalFtAtt > 0 ? ((totalFtMade / totalFtAtt) * 100).toFixed(1) : '0',
    };
  }, [games]);

  return (
    <Card className="p-4 animate-fade-up" data-testid="widget-shooting">
      <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
        <Activity className="w-4 h-4 text-primary" /> Shooting Splits
      </h3>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/15 to-cyan-500/5 border border-blue-500/20 hover-elevate transition-all">
          <p className="text-2xl font-bold text-cyan-400">{shooting.fg}%</p>
          <p className="text-xs text-muted-foreground">FG%</p>
        </div>
        <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/15 to-cyan-500/5 border border-green-500/20 hover-elevate transition-all">
          <p className="text-2xl font-bold text-green-400">{shooting.three}%</p>
          <p className="text-xs text-muted-foreground">3PT%</p>
        </div>
        <div className="p-4 rounded-lg bg-gradient-to-br from-amber-500/15 to-cyan-500/5 border border-amber-500/20 hover-elevate transition-all">
          <p className="text-2xl font-bold text-amber-400">{shooting.ft}%</p>
          <p className="text-xs text-muted-foreground">FT%</p>
        </div>
      </div>
    </Card>
  );
}
