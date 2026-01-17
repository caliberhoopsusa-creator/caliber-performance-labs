import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateShot } from "@/hooks/use-basketball";
import { getShotZone, getZoneLabel, determineShotType, type ShotZone } from "./ShotChart";
import { Target, Check, X, MapPin } from "lucide-react";

interface LogShotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameId: number;
  onShotLogged?: () => void;
}

export function LogShotModal({ open, onOpenChange, gameId, onShotLogged }: LogShotModalProps) {
  const [shotPosition, setShotPosition] = useState<{ x: number; y: number } | null>(null);
  const [shotResult, setShotResult] = useState<"made" | "missed">("made");
  const [quarter, setQuarter] = useState<string>("1");
  const [zone, setZone] = useState<ShotZone | null>(null);
  
  const createShot = useCreateShot();

  const handleCourtClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (y < 50) return;

    const detectedZone = getShotZone(x, y);
    setShotPosition({ x, y });
    setZone(detectedZone);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!shotPosition) return;

    const shotType = determineShotType(shotPosition.x, shotPosition.y);

    createShot.mutate({
      gameId,
      shot: {
        x: Math.round(shotPosition.x),
        y: Math.round(shotPosition.y),
        shotType,
        result: shotResult,
        quarter: parseInt(quarter),
      },
    }, {
      onSuccess: () => {
        setShotPosition(null);
        setZone(null);
        onShotLogged?.();
        onOpenChange(false);
      },
    });
  }, [shotPosition, gameId, shotResult, quarter, createShot, onShotLogged, onOpenChange]);

  const handleCancel = useCallback(() => {
    setShotPosition(null);
    setZone(null);
    onOpenChange(false);
  }, [onOpenChange]);

  const resetShot = useCallback(() => {
    setShotPosition(null);
    setZone(null);
  }, []);

  const courtColor = "#1a1a2e";
  const lineColor = "#f97316";
  const paintColor = "rgba(249, 115, 22, 0.1)";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="log-shot-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Log Shot
          </DialogTitle>
          <DialogDescription>
            Click on the court to mark the shot location
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative w-full aspect-square bg-background rounded-md overflow-hidden border border-border">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full cursor-crosshair"
              onClick={handleCourtClick}
              data-testid="shot-modal-court"
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
              
              {shotPosition && (
                <g>
                  <circle
                    cx={shotPosition.x}
                    cy={shotPosition.y}
                    r="4"
                    fill={shotResult === "made" ? "#22c55e" : "#ef4444"}
                    stroke="#fff"
                    strokeWidth="0.6"
                    data-testid="shot-position-marker"
                  />
                  <circle
                    cx={shotPosition.x}
                    cy={shotPosition.y}
                    r="6"
                    fill="none"
                    stroke={shotResult === "made" ? "#22c55e" : "#ef4444"}
                    strokeWidth="0.3"
                    opacity="0.5"
                    className="animate-ping"
                  />
                </g>
              )}
            </svg>
            
            <div className="absolute top-2 left-2 bg-background/90 px-2 py-1 rounded text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {shotPosition ? "Shot placed" : "Tap to place shot"}
            </div>
          </div>

          {shotPosition && zone && (
            <div className="p-3 bg-muted/30 rounded-md flex items-center justify-between" data-testid="shot-zone-display">
              <div>
                <div className="text-sm font-medium">{getZoneLabel(zone)}</div>
                <div className="text-xs text-muted-foreground">
                  {zone.includes("3") ? "3-Point Shot" : "2-Point Shot"}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={resetShot}>
                <X className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Result</label>
              <div className="flex gap-2">
                <Button
                  variant={shotResult === "made" ? "default" : "outline"}
                  size="sm"
                  className={`flex-1 ${shotResult === "made" ? "bg-green-600 hover:bg-green-700" : ""}`}
                  onClick={() => setShotResult("made")}
                  data-testid="button-result-made"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Made
                </Button>
                <Button
                  variant={shotResult === "missed" ? "default" : "outline"}
                  size="sm"
                  className={`flex-1 ${shotResult === "missed" ? "bg-red-600 hover:bg-red-700" : ""}`}
                  onClick={() => setShotResult("missed")}
                  data-testid="button-result-missed"
                >
                  <X className="h-4 w-4 mr-1" />
                  Missed
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Quarter</label>
              <Select value={quarter} onValueChange={setQuarter}>
                <SelectTrigger data-testid="select-quarter">
                  <SelectValue placeholder="Quarter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Q1</SelectItem>
                  <SelectItem value="2">Q2</SelectItem>
                  <SelectItem value="3">Q3</SelectItem>
                  <SelectItem value="4">Q4</SelectItem>
                  <SelectItem value="5">OT1</SelectItem>
                  <SelectItem value="6">OT2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={handleCancel} data-testid="button-cancel">
              Cancel
            </Button>
            <Button 
              className="flex-1" 
              onClick={handleSubmit} 
              disabled={!shotPosition || createShot.isPending}
              data-testid="button-log-shot"
            >
              {createShot.isPending ? "Logging..." : "Log Shot"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
