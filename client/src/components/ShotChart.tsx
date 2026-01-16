import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useShotsByGame, useShotsByPlayer, useCreateShot, type Shot } from "@/hooks/use-basketball";
import { Target, Circle, Edit2, X, Check } from "lucide-react";

interface ShotChartProps {
  gameId?: number;
  playerId?: number;
  editMode?: boolean;
  onEditModeChange?: (editMode: boolean) => void;
}

type ShotZone = "paint" | "midrange" | "three";

function getShotZone(x: number, y: number): ShotZone {
  const centerX = 50;
  const paintWidth = 24;
  const paintHeight = 25;
  const threePointRadius = 38;

  const inPaint = 
    x >= centerX - paintWidth / 2 && 
    x <= centerX + paintWidth / 2 && 
    y >= 75;

  if (inPaint) return "paint";

  const dx = x - centerX;
  const dy = y - 95;
  const distanceFromBasket = Math.sqrt(dx * dx + dy * dy);

  if (distanceFromBasket <= threePointRadius) return "midrange";
  return "three";
}

function determineShotType(x: number, y: number): string {
  const zone = getShotZone(x, y);
  if (zone === "paint") return "layup";
  if (zone === "three") return "3pt";
  return "midrange";
}

export function ShotChart({ gameId, playerId, editMode = false, onEditModeChange }: ShotChartProps) {
  const [selectedQuarter, setSelectedQuarter] = useState<string>("all");
  const [pendingShot, setPendingShot] = useState<{ x: number; y: number } | null>(null);
  const [pendingShotResult, setPendingShotResult] = useState<"made" | "missed">("made");
  
  const gameShots = useShotsByGame(gameId || 0);
  const playerShots = useShotsByPlayer(playerId || 0);
  const createShot = useCreateShot();

  const shots = useMemo(() => {
    if (gameId) return gameShots.data || [];
    if (playerId) return playerShots.data || [];
    return [];
  }, [gameId, playerId, gameShots.data, playerShots.data]);

  const isLoading = gameId ? gameShots.isLoading : playerShots.isLoading;

  const filteredShots = useMemo(() => {
    if (selectedQuarter === "all") return shots;
    return shots.filter(shot => shot.quarter === parseInt(selectedQuarter));
  }, [shots, selectedQuarter]);

  const zoneStats = useMemo(() => {
    const stats = {
      paint: { made: 0, total: 0 },
      midrange: { made: 0, total: 0 },
      three: { made: 0, total: 0 },
    };

    filteredShots.forEach(shot => {
      const zone = getShotZone(shot.x, shot.y);
      stats[zone].total++;
      if (shot.result === "made") stats[zone].made++;
    });

    return stats;
  }, [filteredShots]);

  const totalStats = useMemo(() => {
    const total = filteredShots.length;
    const made = filteredShots.filter(s => s.result === "made").length;
    return { made, total, percentage: total > 0 ? ((made / total) * 100).toFixed(1) : "0.0" };
  }, [filteredShots]);

  const handleCourtClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!editMode || !gameId) return;

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (y < 50) return;

    setPendingShot({ x, y });
  }, [editMode, gameId]);

  const confirmShot = useCallback(() => {
    if (!pendingShot || !gameId) return;

    const shotType = determineShotType(pendingShot.x, pendingShot.y);
    
    createShot.mutate({
      gameId,
      shot: {
        x: Math.round(pendingShot.x),
        y: Math.round(pendingShot.y),
        shotType,
        result: pendingShotResult,
        quarter: 1,
      },
    }, {
      onSuccess: () => {
        setPendingShot(null);
      },
    });
  }, [pendingShot, gameId, pendingShotResult, createShot]);

  const cancelShot = useCallback(() => {
    setPendingShot(null);
  }, []);

  const quarters = useMemo(() => {
    const uniqueQuarters = Array.from(new Set(shots.map(s => s.quarter))).sort((a, b) => a - b);
    return uniqueQuarters;
  }, [shots]);

  if (isLoading) {
    return (
      <Card data-testid="shot-chart-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Shot Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full aspect-[4/3]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="shot-chart">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Shot Chart
        </CardTitle>
        <div className="flex items-center gap-2">
          {quarters.length > 0 && (
            <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
              <SelectTrigger className="w-[120px]" data-testid="select-quarter">
                <SelectValue placeholder="Quarter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Quarters</SelectItem>
                {quarters.map(q => (
                  <SelectItem key={q} value={q.toString()}>
                    {q <= 4 ? `Q${q}` : `OT${q - 4}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {gameId && onEditModeChange && (
            <Button
              variant={editMode ? "default" : "outline"}
              size="sm"
              onClick={() => onEditModeChange(!editMode)}
              data-testid="button-toggle-edit"
            >
              <Edit2 className="h-4 w-4 mr-1" />
              {editMode ? "Done" : "Edit"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative w-full aspect-[4/3] bg-amber-100 dark:bg-amber-900/30 rounded-md overflow-hidden">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full cursor-crosshair"
            onClick={handleCourtClick}
            data-testid="shot-chart-court"
          >
            <rect x="0" y="50" width="100" height="50" fill="none" stroke="#8B4513" strokeWidth="0.5" />
            
            <rect x="38" y="75" width="24" height="25" fill="none" stroke="#8B4513" strokeWidth="0.5" />
            
            <circle cx="50" cy="81" r="9" fill="none" stroke="#8B4513" strokeWidth="0.5" />
            
            <ellipse cx="50" cy="95" rx="3" ry="1" fill="none" stroke="#8B4513" strokeWidth="0.5" />
            <rect x="48" y="96" width="4" height="4" fill="none" stroke="#8B4513" strokeWidth="0.5" />
            
            <path
              d="M 12 100 L 12 78 A 38 38 0 0 1 88 78 L 88 100"
              fill="none"
              stroke="#8B4513"
              strokeWidth="0.5"
            />
            
            <line x1="0" y1="75" x2="38" y2="75" stroke="#8B4513" strokeWidth="0.3" strokeDasharray="1,1" />
            <line x1="62" y1="75" x2="100" y2="75" stroke="#8B4513" strokeWidth="0.3" strokeDasharray="1,1" />
            
            {filteredShots.map((shot) => (
              <circle
                key={shot.id}
                cx={shot.x}
                cy={shot.y}
                r="2"
                fill={shot.result === "made" ? "#22c55e" : "#ef4444"}
                stroke={shot.result === "made" ? "#16a34a" : "#dc2626"}
                strokeWidth="0.3"
                opacity="0.8"
                data-testid={`shot-marker-${shot.id}`}
              />
            ))}
            
            {pendingShot && (
              <circle
                cx={pendingShot.x}
                cy={pendingShot.y}
                r="3"
                fill={pendingShotResult === "made" ? "#22c55e" : "#ef4444"}
                stroke="#fff"
                strokeWidth="0.5"
                className="animate-pulse"
                data-testid="pending-shot-marker"
              />
            )}
          </svg>
          
          {editMode && (
            <div className="absolute top-2 left-2 bg-background/90 px-2 py-1 rounded text-xs text-muted-foreground">
              Click on court to add shot
            </div>
          )}
        </div>

        {pendingShot && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md" data-testid="pending-shot-controls">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Shot result:</span>
              <Button
                variant={pendingShotResult === "made" ? "default" : "outline"}
                size="sm"
                onClick={() => setPendingShotResult("made")}
                className={pendingShotResult === "made" ? "bg-green-600 hover:bg-green-700" : ""}
                data-testid="button-shot-made"
              >
                Made
              </Button>
              <Button
                variant={pendingShotResult === "missed" ? "default" : "outline"}
                size="sm"
                onClick={() => setPendingShotResult("missed")}
                className={pendingShotResult === "missed" ? "bg-red-600 hover:bg-red-700" : ""}
                data-testid="button-shot-missed"
              >
                Missed
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelShot}
                data-testid="button-cancel-shot"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={confirmShot}
                disabled={createShot.isPending}
                data-testid="button-confirm-shot"
              >
                <Check className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-4 text-sm" data-testid="shot-chart-legend">
          <div className="flex items-center gap-1.5">
            <Circle className="h-3 w-3 fill-green-500 text-green-600" />
            <span>Made</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Circle className="h-3 w-3 fill-red-500 text-red-600" />
            <span>Missed</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" data-testid="shot-chart-stats">
          <div className="p-3 bg-muted/50 rounded-md text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Overall</div>
            <div className="text-lg font-bold">{totalStats.made}/{totalStats.total}</div>
            <Badge variant="secondary" className="mt-1">{totalStats.percentage}%</Badge>
          </div>
          <div className="p-3 bg-muted/50 rounded-md text-center" data-testid="stat-paint">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Paint</div>
            <div className="text-lg font-bold">{zoneStats.paint.made}/{zoneStats.paint.total}</div>
            <Badge variant="secondary" className="mt-1">
              {zoneStats.paint.total > 0 ? ((zoneStats.paint.made / zoneStats.paint.total) * 100).toFixed(1) : "0.0"}%
            </Badge>
          </div>
          <div className="p-3 bg-muted/50 rounded-md text-center" data-testid="stat-midrange">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Mid-Range</div>
            <div className="text-lg font-bold">{zoneStats.midrange.made}/{zoneStats.midrange.total}</div>
            <Badge variant="secondary" className="mt-1">
              {zoneStats.midrange.total > 0 ? ((zoneStats.midrange.made / zoneStats.midrange.total) * 100).toFixed(1) : "0.0"}%
            </Badge>
          </div>
          <div className="p-3 bg-muted/50 rounded-md text-center" data-testid="stat-three">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">3-Point</div>
            <div className="text-lg font-bold">{zoneStats.three.made}/{zoneStats.three.total}</div>
            <Badge variant="secondary" className="mt-1">
              {zoneStats.three.total > 0 ? ((zoneStats.three.made / zoneStats.three.total) * 100).toFixed(1) : "0.0"}%
            </Badge>
          </div>
        </div>

        {shots.length === 0 && !editMode && (
          <div className="text-center py-6 text-muted-foreground" data-testid="shot-chart-empty">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No shots recorded yet</p>
            {gameId && (
              <p className="text-xs mt-1">Enable edit mode to start adding shots</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}