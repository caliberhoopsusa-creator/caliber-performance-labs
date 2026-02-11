import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type ShotZone, type ZoneStatsData, getZoneLabel } from "./ShotChart";
import { Target, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ZoneStatsProps {
  stats: ZoneStatsData;
  showTrends?: boolean;
  compact?: boolean;
}

function getPercentage(made: number, total: number): string {
  if (total === 0) return "0.0";
  return ((made / total) * 100).toFixed(1);
}

function getPercentageColor(percentage: number): string {
  if (percentage >= 50) return "text-green-500";
  if (percentage >= 40) return "text-yellow-500";
  if (percentage >= 30) return "text-orange-500";
  return "text-red-500";
}

function getTrend(percentage: number, zone: ShotZone): "up" | "down" | "neutral" {
  const benchmarks: Record<ShotZone, number> = {
    paint: 55,
    midrange: 40,
    corner_3_left: 38,
    corner_3_right: 38,
    wing_3_left: 36,
    wing_3_right: 36,
    top_key_3: 35
  };
  
  const diff = percentage - benchmarks[zone];
  if (diff >= 5) return "up";
  if (diff <= -5) return "down";
  return "neutral";
}

function ZoneStatRow({ 
  zone, 
  made, 
  total, 
  showTrend = false 
}: { 
  zone: ShotZone; 
  made: number; 
  total: number; 
  showTrend?: boolean;
}) {
  const percentage = total > 0 ? (made / total) * 100 : 0;
  const percentageStr = getPercentage(made, total);
  const colorClass = getPercentageColor(percentage);
  const trend = getTrend(percentage, zone);

  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-b-0" data-testid={`zone-stat-${zone}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{getZoneLabel(zone)}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {made}/{total}
        </span>
        <Badge variant="secondary" className={`min-w-[60px] justify-center ${colorClass}`}>
          {percentageStr}%
        </Badge>
        {showTrend && total > 0 && (
          <div className="w-5">
            {trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
            {trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
            {trend === "neutral" && <Minus className="h-4 w-4 text-muted-foreground" />}
          </div>
        )}
      </div>
    </div>
  );
}

export function ZoneStats({ stats, showTrends = false, compact = false }: ZoneStatsProps) {
  const totalMade = Object.values(stats).reduce((sum, s) => sum + s.made, 0);
  const totalAttempts = Object.values(stats).reduce((sum, s) => sum + s.total, 0);
  const overallPercentage = getPercentage(totalMade, totalAttempts);
  const overallColor = getPercentageColor(totalAttempts > 0 ? (totalMade / totalAttempts) * 100 : 0);

  const twoPointZones: ShotZone[] = ["paint", "midrange"];
  const threePointZones: ShotZone[] = ["corner_3_left", "corner_3_right", "wing_3_left", "wing_3_right", "top_key_3"];

  const twoPointMade = twoPointZones.reduce((sum, z) => sum + stats[z].made, 0);
  const twoPointTotal = twoPointZones.reduce((sum, z) => sum + stats[z].total, 0);
  const threePointMade = threePointZones.reduce((sum, z) => sum + stats[z].made, 0);
  const threePointTotal = threePointZones.reduce((sum, z) => sum + stats[z].total, 0);

  if (compact) {
    return (
      <div className="space-y-2" data-testid="zone-stats-compact">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-muted/50 rounded-md">
            <div className="text-xs text-muted-foreground">Overall</div>
            <div className={`font-bold ${overallColor}`}>{overallPercentage}%</div>
          </div>
          <div className="p-2 bg-muted/50 rounded-md">
            <div className="text-xs text-muted-foreground">2PT</div>
            <div className={`font-bold ${getPercentageColor(twoPointTotal > 0 ? (twoPointMade / twoPointTotal) * 100 : 0)}`}>
              {getPercentage(twoPointMade, twoPointTotal)}%
            </div>
          </div>
          <div className="p-2 bg-muted/50 rounded-md">
            <div className="text-xs text-muted-foreground">3PT</div>
            <div className={`font-bold ${getPercentageColor(threePointTotal > 0 ? (threePointMade / threePointTotal) * 100 : 0)}`}>
              {getPercentage(threePointMade, threePointTotal)}%
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card data-testid="zone-stats">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-accent" />
          Zone Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-accent/10 rounded-md border border-accent/20">
          <div>
            <div className="text-sm font-medium">Overall</div>
            <div className="text-xs text-muted-foreground">{totalMade}/{totalAttempts} attempts</div>
          </div>
          <Badge className={`text-lg px-3 py-1 ${overallColor}`}>
            {overallPercentage}%
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted/30 rounded-md text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">2-Point</div>
            <div className="text-xl font-bold">{twoPointMade}/{twoPointTotal}</div>
            <Badge variant="secondary" className={`mt-1 ${getPercentageColor(twoPointTotal > 0 ? (twoPointMade / twoPointTotal) * 100 : 0)}`}>
              {getPercentage(twoPointMade, twoPointTotal)}%
            </Badge>
          </div>
          <div className="p-3 bg-muted/30 rounded-md text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">3-Point</div>
            <div className="text-xl font-bold">{threePointMade}/{threePointTotal}</div>
            <Badge variant="secondary" className={`mt-1 ${getPercentageColor(threePointTotal > 0 ? (threePointMade / threePointTotal) * 100 : 0)}`}>
              {getPercentage(threePointMade, threePointTotal)}%
            </Badge>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            2-Point Zones
          </div>
          {twoPointZones.map(zone => (
            <ZoneStatRow 
              key={zone} 
              zone={zone} 
              made={stats[zone].made} 
              total={stats[zone].total}
              showTrend={showTrends}
            />
          ))}
        </div>

        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            3-Point Zones
          </div>
          {threePointZones.map(zone => (
            <ZoneStatRow 
              key={zone} 
              zone={zone} 
              made={stats[zone].made} 
              total={stats[zone].total}
              showTrend={showTrends}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
