import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Shield, Zap, Activity, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const gradeScale = [
  { grade: "A+", range: "90+", color: "bg-green-500", description: "Elite Performance" },
  { grade: "A", range: "80-89", color: "bg-green-500", description: "Excellent" },
  { grade: "A-", range: "70-79", color: "bg-green-400", description: "Very Good" },
  { grade: "B+", range: "65-69", color: "bg-blue-500", description: "Above Average" },
  { grade: "B", range: "60-64", color: "bg-blue-500", description: "Good" },
  { grade: "B-", range: "55-59", color: "bg-blue-400", description: "Solid" },
  { grade: "C+", range: "50-54", color: "bg-yellow-500", description: "Average" },
  { grade: "C", range: "45-49", color: "bg-yellow-500", description: "Fair" },
  { grade: "C-", range: "40-44", color: "bg-yellow-600", description: "Below Average" },
  { grade: "D", range: "35-39", color: "bg-orange-500", description: "Poor" },
  { grade: "F", range: "<35", color: "bg-red-500", description: "Failing" },
];

const baseWeights = [
  { stat: "Points", weight: "+1.0", icon: Target, description: "Each point scored" },
  { stat: "Rebounds", weight: "+1.5", icon: Shield, description: "Each rebound grabbed" },
  { stat: "Assists", weight: "+1.5", icon: Zap, description: "Each assist dished" },
  { stat: "Steals", weight: "+2.5", icon: Activity, description: "Each steal made" },
  { stat: "Blocks", weight: "+2.5", icon: Shield, description: "Each shot blocked" },
  { stat: "Turnovers", weight: "-2.5", icon: AlertTriangle, description: "Each turnover committed" },
  { stat: "Fouls", weight: "-1.0", icon: AlertTriangle, description: "Each personal foul" },
];

const positionAdjustments = [
  {
    position: "Guard",
    color: "bg-accent",
    icon: Zap,
    adjustments: [
      { stat: "Assists", change: "+2.0", note: "Playmaking is key" },
      { stat: "Turnovers", change: "-3.0", note: "Ball handling matters more" },
    ],
    description: "Guards are evaluated more heavily on assists and ball security. Turnovers hurt their grade more than other positions."
  },
  {
    position: "Wing",
    color: "bg-accent",
    icon: Activity,
    adjustments: [
      { stat: "Steals", change: "+3.0", note: "Perimeter defense priority" },
      { stat: "Points", change: "+1.2", note: "Scoring versatility valued" },
    ],
    description: "Wings are graded on two-way impact. Steals and scoring efficiency are weighted higher for this position."
  },
  {
    position: "Big",
    color: "bg-secondary",
    icon: Shield,
    adjustments: [
      { stat: "Rebounds", change: "+2.0", note: "Dominate the glass" },
      { stat: "Blocks", change: "+3.0", note: "Rim protection is critical" },
      { stat: "Assists", change: "+1.0", note: "Passing less emphasized" },
    ],
    description: "Bigs are expected to control the paint. Rebounding and shot-blocking carry more weight than playmaking."
  },
];

const bonuses = [
  { condition: "FG% > 50%", effect: "+5 points", type: "bonus" },
  { condition: "FG% < 35%", effect: "-5 points", type: "penalty" },
  { condition: "Hustle Score > 50", effect: "Up to +10 points", type: "bonus" },
  { condition: "Defense Rating > 50", effect: "Up to +15 points", type: "bonus" },
];

export default function GradingSystem() {
  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div>
        <h2 className="text-3xl md:text-4xl font-display font-bold text-white uppercase tracking-tight">Grading System</h2>
        <p className="text-muted-foreground font-medium">How Caliber calculates performance grades</p>
      </div>

      {/* Grade Scale */}
      <Card className="bg-card border-white/5">
        <CardHeader>
          <CardTitle className="font-display uppercase tracking-wider flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-accent" />
            Grade Scale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {gradeScale.map((g) => (
              <div key={g.grade} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center font-display font-bold text-white", g.color)}>
                  {g.grade}
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-mono">{g.range}</div>
                  <div className="text-xs text-white/70">{g.description}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Base Formula */}
      <Card className="bg-card border-white/5">
        <CardHeader>
          <CardTitle className="font-display uppercase tracking-wider flex items-center gap-3">
            <Target className="w-5 h-5 text-accent" />
            Base Formula
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
            <code className="text-sm text-accent font-mono">
              Score = 50 + (PTS × 1.0) + (REB × 1.5) + (AST × 1.5) + (STL × 2.5) + (BLK × 2.5) - (TO × 2.5) - (FOULS × 1.0)
            </code>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {baseWeights.map((w) => (
              <div key={w.stat} className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/5">
                <w.icon className={cn("w-8 h-8", w.weight.startsWith("+") ? "text-green-500" : "text-red-500")} />
                <div>
                  <div className="font-bold text-white">{w.stat}</div>
                  <div className={cn("font-mono text-sm font-bold", w.weight.startsWith("+") ? "text-green-500" : "text-red-500")}>
                    {w.weight}
                  </div>
                  <div className="text-xs text-muted-foreground">{w.description}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Position Adjustments */}
      <Card className="bg-card border-white/5">
        <CardHeader>
          <CardTitle className="font-display uppercase tracking-wider flex items-center gap-3">
            <Activity className="w-5 h-5 text-accent" />
            Position-Based Weighting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {positionAdjustments.map((pos) => (
              <div key={pos.position} className="rounded-xl overflow-hidden border border-white/10">
                <div className={cn("p-4 flex items-center gap-3", pos.color)}>
                  <pos.icon className="w-6 h-6 text-white" />
                  <h3 className="font-display font-bold text-white uppercase tracking-wider">{pos.position}</h3>
                </div>
                <div className="p-5 space-y-4 bg-white/5">
                  <p className="text-sm text-muted-foreground">{pos.description}</p>
                  <div className="space-y-2">
                    {pos.adjustments.map((adj) => (
                      <div key={adj.stat} className="flex items-center justify-between p-2 rounded bg-background/50">
                        <span className="text-white font-medium">{adj.stat}</span>
                        <div className="text-right">
                          <span className={cn("font-mono font-bold", adj.change.startsWith("+") ? "text-green-500" : adj.change.startsWith("-") ? "text-red-500" : "text-yellow-500")}>
                            {adj.change}
                          </span>
                          <div className="text-xs text-muted-foreground">{adj.note}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Efficiency & Manual Bonuses */}
      <Card className="bg-card border-white/5">
        <CardHeader>
          <CardTitle className="font-display uppercase tracking-wider flex items-center gap-3">
            <Zap className="w-5 h-5 text-accent" />
            Efficiency & Hustle Bonuses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bonuses.map((b, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  {b.type === "bonus" ? (
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="text-white">{b.condition}</span>
                </div>
                <Badge variant={b.type === "bonus" ? "default" : "destructive"} className={b.type === "bonus" ? "bg-green-500/20 text-green-500 border-green-500/30" : ""}>
                  {b.effect}
                </Badge>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            Hustle Score and Defense Rating are subjective inputs (0-100) that reward intangibles like effort plays and defensive positioning that don't show up in the box score.
          </p>
        </CardContent>
      </Card>

      {/* Example Calculation */}
      <Card className="bg-card border-white/5">
        <CardHeader>
          <CardTitle className="font-display uppercase tracking-wider">Example: Guard with 18 PTS, 4 REB, 8 AST, 2 STL, 0 BLK, 3 TO, 2 FOULS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-accent/10 border border-accent/20 font-mono text-sm space-y-1">
            <div className="text-muted-foreground">Base: 50</div>
            <div className="text-green-500">+ Points: 18 × 1.0 = +18</div>
            <div className="text-green-500">+ Rebounds: 4 × 1.5 = +6</div>
            <div className="text-green-500">+ Assists (Guard): 8 × 2.0 = +16</div>
            <div className="text-green-500">+ Steals: 2 × 2.5 = +5</div>
            <div className="text-red-500">- Turnovers (Guard): 3 × 3.0 = -9</div>
            <div className="text-red-500">- Fouls: 2 × 1.0 = -2</div>
            <div className="border-t border-white/10 pt-2 mt-2 text-white font-bold">
              Total Score: 84 → Grade: A
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
