import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useShotsByGame, useShotsByPlayer, useCreateShot, type Shot } from "@/hooks/use-basketball";
import { Target, Circle, Edit2, X, Check } from "lucide-react";

export type ShotZone = "paint" | "midrange" | "corner_3_left" | "corner_3_right" | "wing_3_left" | "wing_3_right" | "top_key_3";

export interface ShotChartProps {
  gameId?: number;
  playerId?: number;
  editMode?: boolean;
  onEditModeChange?: (editMode: boolean) => void;
  shots?: Shot[];
  onShotClick?: (x: number, y: number, zone: ShotZone) => void;
  editable?: boolean;
  compact?: boolean;
  showStats?: boolean;
}

export function getShotZone(x: number, y: number): ShotZone {
  const centerX = 50;
  const paintWidth = 24;
  const cornerY = 78;
  const cornerWidth = 12;
  const threePointRadius = 38;

  const inPaint = 
    x >= centerX - paintWidth / 2 && 
    x <= centerX + paintWidth / 2 && 
    y >= 75;

  if (inPaint) return "paint";

  if (y >= cornerY) {
    if (x <= cornerWidth) return "corner_3_left";
    if (x >= 100 - cornerWidth) return "corner_3_right";
  }

  const dx = x - centerX;
  const dy = y - 95;
  const distanceFromBasket = Math.sqrt(dx * dx + dy * dy);

  if (distanceFromBasket <= threePointRadius) return "midrange";

  if (y >= 70) {
    if (x < centerX - 15) return "wing_3_left";
    if (x > centerX + 15) return "wing_3_right";
  }

  return "top_key_3";
}

export function determineShotType(x: number, y: number): string {
  const zone = getShotZone(x, y);
  if (zone === "paint") return "layup";
  if (zone.includes("3")) return "3pt";
  return "midrange";
}

export function getZoneLabel(zone: ShotZone): string {
  const labels: Record<ShotZone, string> = {
    paint: "Paint",
    midrange: "Mid-Range",
    corner_3_left: "Left Corner 3",
    corner_3_right: "Right Corner 3",
    wing_3_left: "Left Wing 3",
    wing_3_right: "Right Wing 3",
    top_key_3: "Top of Key 3"
  };
  return labels[zone];
}

export type ZoneStatsData = {
  [key in ShotZone]: { made: number; total: number };
};

export function calculateZoneStats(shots: Shot[]): ZoneStatsData {
  const stats: ZoneStatsData = {
    paint: { made: 0, total: 0 },
    midrange: { made: 0, total: 0 },
    corner_3_left: { made: 0, total: 0 },
    corner_3_right: { made: 0, total: 0 },
    wing_3_left: { made: 0, total: 0 },
    wing_3_right: { made: 0, total: 0 },
    top_key_3: { made: 0, total: 0 },
  };

  shots.forEach(shot => {
    const zone = getShotZone(shot.x, shot.y);
    stats[zone].total++;
    if (shot.result === "made") stats[zone].made++;
  });

  return stats;
}

function BasketballCourt({ 
  shots, 
  pendingShot, 
  pendingShotResult, 
  editMode, 
  onCourtClick,
  compact = false
}: { 
  shots: Shot[]; 
  pendingShot: { x: number; y: number } | null; 
  pendingShotResult: "made" | "missed";
  editMode: boolean;
  onCourtClick: (e: React.MouseEvent<SVGSVGElement>) => void;
  compact?: boolean;
}) {
  const courtColor = "#1a1a2e";
  const lineColor = "#4f6878";
  const paintColor = "rgba(249, 115, 22, 0.1)";
  const markerSize = compact ? 2.5 : 2;

  return (
    <svg
      viewBox="0 0 100 100"
      className={`w-full h-full ${editMode ? 'cursor-crosshair' : 'cursor-default'}`}
      onClick={onCourtClick}
      data-testid="shot-chart-court"
    >
      <rect x="0" y="0" width="100" height="100" fill={courtColor} />
      
      <rect x="0" y="50" width="100" height="50" fill="none" stroke={lineColor} strokeWidth="0.5" />
      
      <rect x="38" y="75" width="24" height="25" fill={paintColor} stroke={lineColor} strokeWidth="0.5" />
      
      <circle cx="50" cy="81" r="9" fill="none" stroke={lineColor} strokeWidth="0.5" />
      
      <rect x="47" y="96" width="6" height="4" fill={paintColor} stroke={lineColor} strokeWidth="0.5" />
      <circle cx="50" cy="94" r="3" fill="none" stroke={lineColor} strokeWidth="0.5" />
      
      <path
        d="M 12 100 L 12 78 A 38 38 0 0 1 88 78 L 88 100"
        fill="none"
        stroke={lineColor}
        strokeWidth="0.5"
      />
      
      <line x1="0" y1="78" x2="12" y2="78" stroke={lineColor} strokeWidth="0.3" strokeDasharray="2,2" opacity="0.5" />
      <line x1="88" y1="78" x2="100" y2="78" stroke={lineColor} strokeWidth="0.3" strokeDasharray="2,2" opacity="0.5" />
      
      <line x1="38" y1="75" x2="38" y2="100" stroke={lineColor} strokeWidth="0.3" strokeDasharray="2,2" opacity="0.3" />
      <line x1="62" y1="75" x2="62" y2="100" stroke={lineColor} strokeWidth="0.3" strokeDasharray="2,2" opacity="0.3" />
      
      {shots.map((shot) => (
        <g key={shot.id}>
          <circle
            cx={shot.x}
            cy={shot.y}
            r={markerSize}
            fill={shot.result === "made" ? "#22c55e" : "#ef4444"}
            stroke={shot.result === "made" ? "#16a34a" : "#dc2626"}
            strokeWidth="0.4"
            opacity="0.9"
            data-testid={`shot-marker-${shot.id}`}
          />
        </g>
      ))}
      
      {pendingShot && (
        <g>
          <circle
            cx={pendingShot.x}
            cy={pendingShot.y}
            r={markerSize + 1}
            fill={pendingShotResult === "made" ? "#22c55e" : "#ef4444"}
            stroke="#fff"
            strokeWidth="0.6"
            className="animate-pulse"
            data-testid="pending-shot-marker"
          />
          <circle
            cx={pendingShot.x}
            cy={pendingShot.y}
            r={markerSize + 3}
            fill="none"
            stroke={pendingShotResult === "made" ? "#22c55e" : "#ef4444"}
            strokeWidth="0.3"
            opacity="0.5"
            className="animate-ping"
          />
        </g>
      )}
    </svg>
  );
}

export function ShotChart({ 
  gameId, 
  playerId, 
  editMode: externalEditMode, 
  onEditModeChange, 
  shots: externalShots,
  onShotClick,
  editable = false,
  compact = false,
  showStats = true
}: ShotChartProps) {
  const [internalEditMode, setInternalEditMode] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState<string>("all");
  const [pendingShot, setPendingShot] = useState<{ x: number; y: number } | null>(null);
  const [pendingShotResult, setPendingShotResult] = useState<"made" | "missed">("made");
  
  const editMode = externalEditMode ?? internalEditMode;
  const setEditMode = onEditModeChange ?? setInternalEditMode;
  
  const gameShots = useShotsByGame(gameId || 0);
  const playerShots = useShotsByPlayer(playerId || 0);
  const createShot = useCreateShot();

  const shots = useMemo(() => {
    if (externalShots) return externalShots;
    if (gameId) return gameShots.data || [];
    if (playerId) return playerShots.data || [];
    return [];
  }, [externalShots, gameId, playerId, gameShots.data, playerShots.data]);

  const isLoading = !externalShots && (gameId ? gameShots.isLoading : playerShots.isLoading);

  const filteredShots = useMemo(() => {
    if (selectedQuarter === "all") return shots;
    return shots.filter(shot => shot.quarter === parseInt(selectedQuarter));
  }, [shots, selectedQuarter]);

  const zoneStats = useMemo(() => calculateZoneStats(filteredShots), [filteredShots]);

  const totalStats = useMemo(() => {
    const total = filteredShots.length;
    const made = filteredShots.filter(s => s.result === "made").length;
    return { made, total, percentage: total > 0 ? ((made / total) * 100).toFixed(1) : "0.0" };
  }, [filteredShots]);

  const threePointStats = useMemo(() => {
    const threeShots = filteredShots.filter(s => {
      const zone = getShotZone(s.x, s.y);
      return zone.includes("3");
    });
    const made = threeShots.filter(s => s.result === "made").length;
    return { made, total: threeShots.length, percentage: threeShots.length > 0 ? ((made / threeShots.length) * 100).toFixed(1) : "0.0" };
  }, [filteredShots]);

  const twoPointStats = useMemo(() => {
    const twoShots = filteredShots.filter(s => {
      const zone = getShotZone(s.x, s.y);
      return !zone.includes("3");
    });
    const made = twoShots.filter(s => s.result === "made").length;
    return { made, total: twoShots.length, percentage: twoShots.length > 0 ? ((made / twoShots.length) * 100).toFixed(1) : "0.0" };
  }, [filteredShots]);

  const handleCourtClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!editMode && !editable) return;

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (y < 50) return;

    const zone = getShotZone(x, y);

    if (onShotClick) {
      onShotClick(x, y, zone);
      return;
    }

    setPendingShot({ x, y });
  }, [editMode, editable, onShotClick]);

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
          <Skeleton className="w-full aspect-square" />
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="relative w-full aspect-square bg-background rounded-md overflow-hidden" data-testid="shot-chart-compact">
        <BasketballCourt
          shots={filteredShots}
          pendingShot={pendingShot}
          pendingShotResult={pendingShotResult}
          editMode={editMode || editable}
          onCourtClick={handleCourtClick}
          compact={true}
        />
        {(editMode || editable) && (
          <div className="absolute top-2 left-2 bg-background/90 px-2 py-1 rounded text-xs text-muted-foreground">
            Tap to place shot
          </div>
        )}
      </div>
    );
  }

  return (
    <Card data-testid="shot-chart">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-accent" />
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
          {gameId && (
            <Button
              variant={editMode ? "default" : "outline"}
              size="sm"
              onClick={() => setEditMode(!editMode)}
              data-testid="button-toggle-edit"
            >
              <Edit2 className="h-4 w-4 mr-1" />
              {editMode ? "Done" : "Edit"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative w-full aspect-square rounded-md overflow-hidden">
          <BasketballCourt
            shots={filteredShots}
            pendingShot={pendingShot}
            pendingShotResult={pendingShotResult}
            editMode={editMode}
            onCourtClick={handleCourtClick}
          />
          
          {editMode && (
            <div className="absolute top-2 left-2 bg-background/90 px-2 py-1 rounded text-xs text-muted-foreground">
              Click on court to add shot
            </div>
          )}
        </div>

        {pendingShot && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md" data-testid="pending-shot-controls">
            <div className="flex items-center gap-2 flex-wrap">
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

        {showStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" data-testid="shot-chart-stats">
            <div className="p-3 bg-muted/50 rounded-md text-center">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Overall</div>
              <div className="text-lg font-bold">{totalStats.made}/{totalStats.total}</div>
              <Badge variant="secondary" className="mt-1">{totalStats.percentage}%</Badge>
            </div>
            <div className="p-3 bg-muted/50 rounded-md text-center">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">2PT</div>
              <div className="text-lg font-bold">{twoPointStats.made}/{twoPointStats.total}</div>
              <Badge variant="secondary" className="mt-1">{twoPointStats.percentage}%</Badge>
            </div>
            <div className="p-3 bg-muted/50 rounded-md text-center">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">3PT</div>
              <div className="text-lg font-bold">{threePointStats.made}/{threePointStats.total}</div>
              <Badge variant="secondary" className="mt-1">{threePointStats.percentage}%</Badge>
            </div>
            <div className="p-3 bg-muted/50 rounded-md text-center" data-testid="stat-paint">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Paint</div>
              <div className="text-lg font-bold">{zoneStats.paint.made}/{zoneStats.paint.total}</div>
              <Badge variant="secondary" className="mt-1">
                {zoneStats.paint.total > 0 ? ((zoneStats.paint.made / zoneStats.paint.total) * 100).toFixed(1) : "0.0"}%
              </Badge>
            </div>
          </div>
        )}

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

export { type Shot };
