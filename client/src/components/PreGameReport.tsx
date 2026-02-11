import { useState } from "react";
import { usePreGameReport } from "@/hooks/use-basketball";
import { useSport } from "@/components/SportToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Search, 
  Printer, 
  User,
  Swords,
  ClipboardList,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PreGameReportProps {
  playerId: number;
  defaultOpponent?: string;
}

function GradeBadge({ grade }: { grade: string | null }) {
  if (!grade) return null;
  
  const gradeColors: Record<string, string> = {
    'A+': 'bg-green-500/20 text-green-400 border-green-500/30',
    'A': 'bg-green-500/20 text-green-400 border-green-500/30',
    'A-': 'bg-green-500/20 text-green-400 border-green-500/30',
    'B+': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'B': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'B-': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'C+': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'C': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'C-': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'D': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'F': 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  
  return (
    <Badge 
      variant="outline" 
      className={cn("text-xs", gradeColors[grade] || 'bg-muted text-muted-foreground')}
      data-testid={`badge-grade-${grade}`}
    >
      {grade}
    </Badge>
  );
}

function StatIndicator({ value, benchmark, label }: { value: number; benchmark: number; label: string }) {
  const diff = value - benchmark;
  const isPositive = diff > 0;
  const isNeutral = Math.abs(diff) < 0.5;
  
  return (
    <div className="flex items-center justify-between p-3 rounded-md bg-card/50 border border-border" data-testid={`stat-indicator-${label.toLowerCase()}`}>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold font-display">{value.toFixed(1)}</p>
      </div>
      <div className={cn(
        "flex items-center gap-1 text-sm",
        isNeutral ? "text-muted-foreground" : isPositive ? "text-green-400" : "text-red-400"
      )}>
        {isNeutral ? (
          <Minus className="w-4 h-4" />
        ) : isPositive ? (
          <TrendingUp className="w-4 h-4" />
        ) : (
          <TrendingDown className="w-4 h-4" />
        )}
        <span>{isNeutral ? "—" : `${isPositive ? '+' : ''}${diff.toFixed(1)}`}</span>
      </div>
    </div>
  );
}

export function PreGameReport({ playerId, defaultOpponent = "" }: PreGameReportProps) {
  const [opponentInput, setOpponentInput] = useState(defaultOpponent);
  const [activeOpponent, setActiveOpponent] = useState(defaultOpponent);
  const sport = useSport();
  const isFootball = sport === 'football';
  
  const { data, isLoading, error } = usePreGameReport(playerId, activeOpponent, sport);

  const handleSearch = () => {
    setActiveOpponent(opponentInput);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4" data-testid="pregame-report-loading">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-6" data-testid="pregame-report-error">
        <p className="text-destructive">Failed to load pregame report. Please try again.</p>
      </Card>
    );
  }

  const { player, recentPerformance, opponentHistory, scoutingReport, activeCoachGoals } = data;
  
  // Basketball stats
  const avgPoints = parseFloat(recentPerformance.avgPoints || '0');
  const avgRebounds = parseFloat(recentPerformance.avgRebounds || '0');
  const avgAssists = parseFloat(recentPerformance.avgAssists || '0');
  
  // Football stats
  const avgPassingYards = parseFloat(recentPerformance.avgPassingYards || '0');
  const avgRushingYards = parseFloat(recentPerformance.avgRushingYards || '0');
  const avgReceivingYards = parseFloat(recentPerformance.avgReceivingYards || '0');
  const avgTouchdowns = parseFloat(recentPerformance.avgTouchdowns || '0');
  const avgTackles = parseFloat(recentPerformance.avgTackles || '0');

  return (
    <div className="space-y-6 print:space-y-4" data-testid="pregame-report">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          [data-testid="pregame-report"],
          [data-testid="pregame-report"] * {
            visibility: visible;
          }
          [data-testid="pregame-report"] {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
          .print\\:break-inside-avoid {
            break-inside: avoid;
          }
          .print\\:text-black {
            color: black !important;
          }
          .print\\:bg-white {
            background: white !important;
          }
          .print\\:border-gray-300 {
            border-color: #d1d5db !important;
          }
        }
      `}</style>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:flex-row">
        <div>
          <h2 className="text-2xl font-bold font-display print:text-black" data-testid="text-report-title">
            Pre-Game Report
          </h2>
          <p className="text-muted-foreground print:text-gray-600" data-testid="text-player-name">
            {player.name} • {player.position} {player.team ? `• ${player.team}` : ''}
          </p>
        </div>
        
        <div className="flex items-center gap-2 no-print">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Enter opponent name..."
              value={opponentInput}
              onChange={(e) => setOpponentInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9"
              data-testid="input-opponent"
            />
          </div>
          <Button onClick={handleSearch} size="default" data-testid="button-search-opponent">
            Search
          </Button>
          <Button onClick={handlePrint} variant="outline" size="icon" data-testid="button-print">
            <Printer className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 print:grid-cols-2 print:gap-4">
        <Card className="print:break-inside-avoid print:bg-white print:border-gray-300" data-testid="card-recent-performance">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base print:text-black">
              <BarChart3 className="w-5 h-5 text-accent print:text-gray-700" />
              Recent Performance (Last 5 Games)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentPerformance.gamesPlayed === 0 ? (
              <p className="text-muted-foreground text-sm" data-testid="text-no-recent-games">No recent games found</p>
            ) : (
              <>
                {isFootball ? (
                  <div className="grid grid-cols-3 gap-3">
                    <StatIndicator value={avgPassingYards} benchmark={150} label="Pass YDS" />
                    <StatIndicator value={avgRushingYards} benchmark={50} label="Rush YDS" />
                    <StatIndicator value={avgReceivingYards} benchmark={40} label="Rec YDS" />
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    <StatIndicator value={avgPoints} benchmark={10} label="PPG" />
                    <StatIndicator value={avgRebounds} benchmark={5} label="RPG" />
                    <StatIndicator value={avgAssists} benchmark={3} label="APG" />
                  </div>
                )}
                
                <div>
                  <p className="text-xs text-muted-foreground mb-2 print:text-gray-600">Recent Grades</p>
                  <div className="flex flex-wrap gap-1" data-testid="recent-grades-list">
                    {recentPerformance.recentGrades.map((grade, idx) => (
                      <GradeBadge key={idx} grade={grade} />
                    ))}
                    {recentPerformance.recentGrades.length === 0 && (
                      <span className="text-sm text-muted-foreground">No grades available</span>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="print:break-inside-avoid print:bg-white print:border-gray-300" data-testid="card-opponent-history">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base print:text-black">
              <Swords className="w-5 h-5 text-accent print:text-gray-700" />
              Matchup History {activeOpponent && `vs ${activeOpponent}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!activeOpponent ? (
              <p className="text-muted-foreground text-sm" data-testid="text-enter-opponent">
                Enter an opponent name to see matchup history
              </p>
            ) : opponentHistory.totalGamesVs === 0 ? (
              <p className="text-muted-foreground text-sm" data-testid="text-no-matchups">
                No previous games against "{activeOpponent}"
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground print:text-gray-600">
                  {opponentHistory.totalGamesVs} game{opponentHistory.totalGamesVs !== 1 ? 's' : ''} played
                </p>
                <div className="space-y-2" data-testid="matchup-history-list">
                  {opponentHistory.matchups.map((matchup, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm print:bg-gray-100"
                      data-testid={`matchup-item-${idx}`}
                    >
                      <div>
                        <span className="font-medium">{matchup.date}</span>
                        {matchup.result && (
                          <span className="text-muted-foreground ml-2 print:text-gray-600">{matchup.result}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {isFootball ? (
                          <span>{matchup.passingYards + matchup.rushingYards + matchup.receivingYards}yds {matchup.touchdowns}td</span>
                        ) : (
                          <span>{matchup.points}pts {matchup.rebounds}reb {matchup.assists}ast</span>
                        )}
                        <GradeBadge grade={matchup.grade} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="print:break-inside-avoid print:bg-white print:border-gray-300" data-testid="card-scouting-report">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base print:text-black">
              <User className="w-5 h-5 text-accent print:text-gray-700" />
              Opponent Scouting Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!scoutingReport ? (
              <p className="text-muted-foreground text-sm" data-testid="text-no-scouting">
                {activeOpponent ? `No scouting report available for "${activeOpponent}"` : 'Enter an opponent to see scouting report'}
              </p>
            ) : (
              <div className="space-y-3" data-testid="scouting-report-content">
                <div>
                  <h4 className="font-medium text-sm print:text-black">{scoutingReport.name}</h4>
                </div>
                
                {scoutingReport.tendencies && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide print:text-gray-600">Tendencies</p>
                    <p className="text-sm mt-1 print:text-black" data-testid="text-tendencies">{scoutingReport.tendencies}</p>
                  </div>
                )}
                
                {scoutingReport.strengths && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide print:text-gray-600">Strengths</p>
                    <p className="text-sm mt-1 text-green-400 print:text-green-700" data-testid="text-strengths">{scoutingReport.strengths}</p>
                  </div>
                )}
                
                {scoutingReport.weaknesses && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide print:text-gray-600">Weaknesses</p>
                    <p className="text-sm mt-1 text-red-400 print:text-red-700" data-testid="text-weaknesses">{scoutingReport.weaknesses}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="print:break-inside-avoid print:bg-white print:border-gray-300" data-testid="card-coach-goals">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base print:text-black">
              <Target className="w-5 h-5 text-accent print:text-gray-700" />
              Active Coach Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeCoachGoals.length === 0 ? (
              <p className="text-muted-foreground text-sm" data-testid="text-no-goals">
                No active goals assigned
              </p>
            ) : (
              <div className="space-y-2" data-testid="coach-goals-list">
                {activeCoachGoals.map((goal, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-start gap-3 p-3 rounded-md bg-muted/50 print:bg-gray-100"
                    data-testid={`goal-item-${idx}`}
                  >
                    <ClipboardList className="w-4 h-4 mt-0.5 text-accent print:text-gray-700 shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-sm print:text-black">{goal.title}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs" data-testid={`badge-goal-type-${idx}`}>
                          {goal.targetType}
                        </Badge>
                        <span className="text-xs text-muted-foreground print:text-gray-600">
                          Target: {goal.targetValue}
                        </span>
                        {goal.deadline && (
                          <span className="text-xs text-muted-foreground print:text-gray-600">
                            Due: {goal.deadline}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border print:text-gray-500 print:border-gray-300">
        <p>Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
}