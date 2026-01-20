import { usePlayerReportCard, usePlayer, type ReportCardSkillBadge, type ReportCardCoachGoal, type ReportCardCoachNote, type ReportCardTrends, type PlayerReportCardData } from "@/hooks/use-basketball";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportSummarySection, StatBox, ProgressRow } from "@/components/ReportSummarySection";
import { PrintStyles } from "@/components/PrintStyles";
import { 
  Printer, 
  Share2, 
  Trophy, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Star, 
  MessageSquare, 
  Award,
  Crosshair,
  Zap,
  Shield,
  Hand,
  Grab,
  Copy,
  Check,
  BarChart3,
  Activity,
  Calendar,
  Percent
} from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { BADGE_DEFINITIONS, SKILL_BADGE_TYPES } from "@shared/schema";
import { format } from "date-fns";

interface PlayerReportCardProps {
  playerId: number;
  dateRange?: { start: Date; end: Date } | null;
  showActions?: boolean;
}

const GRADE_ORDER = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'];
const GRADE_COLORS: Record<string, string> = {
  'A+': 'bg-emerald-500',
  'A': 'bg-emerald-400',
  'A-': 'bg-emerald-300',
  'B+': 'bg-blue-500',
  'B': 'bg-blue-400',
  'B-': 'bg-blue-300',
  'C+': 'bg-yellow-500',
  'C': 'bg-yellow-400',
  'C-': 'bg-yellow-300',
  'D': 'bg-orange-500',
  'F': 'bg-red-500',
};

const GRADE_TEXT_COLORS: Record<string, string> = {
  'A+': 'text-emerald-500',
  'A': 'text-emerald-400',
  'A-': 'text-emerald-300',
  'B+': 'text-blue-500',
  'B': 'text-blue-400',
  'B-': 'text-blue-300',
  'C+': 'text-yellow-500',
  'C': 'text-yellow-400',
  'C-': 'text-yellow-300',
  'D': 'text-orange-500',
  'F': 'text-red-500',
};

const SKILL_ICONS: Record<string, typeof Target> = {
  sharpshooter: Crosshair,
  pure_passer: Zap,
  bucket_getter: Target,
  glass_cleaner: Shield,
  rim_protector: Hand,
  pickpocket: Grab,
};

const LEVEL_COLORS: Record<string, string> = {
  none: "bg-muted text-muted-foreground",
  brick: "bg-red-900/50 text-red-400",
  bronze: "bg-amber-700/50 text-amber-500",
  silver: "bg-slate-400/30 text-slate-300",
  gold: "bg-yellow-500/30 text-yellow-400",
  platinum: "bg-cyan-500/30 text-cyan-300",
  hall_of_fame: "bg-purple-500/30 text-purple-400",
  legend: "bg-orange-500/30 text-orange-400",
  goat: "bg-gradient-to-r from-yellow-500/30 to-purple-500/30 text-yellow-300",
};

const LEVEL_NAMES: Record<string, string> = {
  none: "Locked",
  brick: "Brick",
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  hall_of_fame: "HOF",
  legend: "Legend",
  goat: "GOAT",
};

function TrendIndicator({ value, label }: { value: number; label: string }) {
  const isPositive = value > 0.5;
  const isNegative = value < -0.5;
  
  return (
    <div className="flex items-center gap-1.5 print:text-black" data-testid={`trend-${label}`}>
      <span className="text-xs text-muted-foreground print:text-gray-600">{label}</span>
      {isPositive && <TrendingUp className="w-4 h-4 text-emerald-500" />}
      {isNegative && <TrendingDown className="w-4 h-4 text-red-500" />}
      {!isPositive && !isNegative && <Minus className="w-4 h-4 text-muted-foreground" />}
      <span className={cn(
        "text-xs font-medium",
        isPositive && "text-emerald-500",
        isNegative && "text-red-500",
        !isPositive && !isNegative && "text-muted-foreground"
      )}>
        {value > 0 ? '+' : ''}{value.toFixed(1)}
      </span>
    </div>
  );
}

function GradeDistributionChart({ distribution }: { distribution: Record<string, number> }) {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const sortedGrades = GRADE_ORDER.filter(g => distribution[g] > 0);
  const maxCount = Math.max(...Object.values(distribution));

  return (
    <div className="space-y-2" data-testid="grade-distribution-chart">
      {sortedGrades.map(grade => {
        const count = distribution[grade] || 0;
        const percent = (count / total) * 100;
        const barPercent = (count / maxCount) * 100;
        
        return (
          <div key={grade} className="flex items-center gap-2">
            <span className="w-8 text-xs font-bold text-right print:text-black">{grade}</span>
            <div className="flex-1 h-5 bg-secondary/50 rounded overflow-hidden print:bg-gray-200">
              <div 
                className={cn("h-full transition-all print:opacity-100", GRADE_COLORS[grade])}
                style={{ width: `${barPercent}%` }}
              />
            </div>
            <span className="w-16 text-xs text-muted-foreground text-right print:text-gray-600">
              {count} ({percent.toFixed(0)}%)
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SkillBadgeItem({ badge }: { badge: ReportCardSkillBadge }) {
  const Icon = SKILL_ICONS[badge.skillType] || Target;
  const config = SKILL_BADGE_TYPES[badge.skillType as keyof typeof SKILL_BADGE_TYPES];
  const levelColor = LEVEL_COLORS[badge.currentLevel] || LEVEL_COLORS.none;
  
  if (badge.currentLevel === 'none') return null;

  return (
    <div 
      className={cn("flex items-center gap-2 px-3 py-2 rounded-lg print:bg-gray-100 print:border print:border-gray-200", levelColor)}
      data-testid={`skill-badge-item-${badge.skillType}`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium print:text-black">{config?.name || badge.skillType}</span>
      <Badge variant="outline" className="ml-auto text-xs print:bg-white print:text-black print:border-gray-300">
        {LEVEL_NAMES[badge.currentLevel]}
      </Badge>
    </div>
  );
}

function CoachGoalItem({ goal }: { goal: ReportCardCoachGoal }) {
  const isCompleted = goal.status === 'completed';
  const isActive = goal.status === 'active';

  return (
    <div 
      className={cn(
        "p-3 rounded-lg border print:bg-white print:border-gray-200",
        isCompleted && "bg-emerald-500/10 border-emerald-500/30",
        isActive && "bg-card border-border"
      )}
      data-testid={`coach-goal-item-${goal.title.slice(0, 20)}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Target className={cn(
              "w-4 h-4",
              isCompleted ? "text-emerald-500" : "text-primary"
            )} />
            <span className="font-medium text-sm print:text-black">{goal.title}</span>
          </div>
          {goal.coachFeedback && (
            <p className="text-xs text-muted-foreground mt-1 pl-6 print:text-gray-600">{goal.coachFeedback}</p>
          )}
        </div>
        <Badge variant={isCompleted ? "default" : "secondary"} className="text-xs shrink-0">
          {goal.status}
        </Badge>
      </div>
    </div>
  );
}

function CoachNoteItem({ note }: { note: ReportCardCoachNote }) {
  const noteTypeColors: Record<string, string> = {
    observation: "bg-blue-500/20 text-blue-400",
    improvement: "bg-yellow-500/20 text-yellow-400",
    praise: "bg-emerald-500/20 text-emerald-400",
    strategy: "bg-purple-500/20 text-purple-400",
  };

  return (
    <div 
      className="p-3 rounded-lg bg-card/50 border border-border print:bg-white print:border-gray-200"
      data-testid={`coach-note-item`}
    >
      <div className="flex items-start gap-2">
        <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm print:text-black">{note.content}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className={cn("text-xs print:bg-gray-100 print:text-black", noteTypeColors[note.noteType])}>
              {note.noteType}
            </Badge>
            <span className="text-xs text-muted-foreground print:text-gray-600">- {note.authorName}</span>
            <span className="text-xs text-muted-foreground print:text-gray-500">
              {format(new Date(note.createdAt), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function GradeTrendTable({ gradeDistribution }: { gradeDistribution: Record<string, number> }) {
  const total = Object.values(gradeDistribution).reduce((a, b) => a + b, 0);
  if (total === 0) return <p className="text-sm text-muted-foreground print:text-gray-600">No graded games yet</p>;

  const getAverageGrade = () => {
    let weightedSum = 0;
    const gradeWeights: Record<string, number> = {
      'A+': 4.3, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D': 1.0, 'F': 0.0
    };
    
    Object.entries(gradeDistribution).forEach(([grade, count]) => {
      weightedSum += (gradeWeights[grade] || 0) * count;
    });
    
    const avg = weightedSum / total;
    if (avg >= 4.15) return 'A+';
    if (avg >= 3.85) return 'A';
    if (avg >= 3.5) return 'A-';
    if (avg >= 3.15) return 'B+';
    if (avg >= 2.85) return 'B';
    if (avg >= 2.5) return 'B-';
    if (avg >= 2.15) return 'C+';
    if (avg >= 1.85) return 'C';
    if (avg >= 1.5) return 'C-';
    if (avg >= 0.5) return 'D';
    return 'F';
  };

  const avgGrade = getAverageGrade();

  return (
    <div className="space-y-3" data-testid="grade-trend-table">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground print:text-gray-600">Average Grade:</span>
        <span className={cn("text-2xl font-bold font-display", GRADE_TEXT_COLORS[avgGrade] || "text-foreground")}>
          {avgGrade}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground print:text-gray-600">Total Games Graded:</span>
        <span className="text-lg font-semibold print:text-black">{total}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="text-center p-2 rounded bg-emerald-500/10 print:bg-green-100">
          <div className="text-lg font-bold text-emerald-500 print:text-green-700">
            {(gradeDistribution['A+'] || 0) + (gradeDistribution['A'] || 0) + (gradeDistribution['A-'] || 0)}
          </div>
          <div className="text-xs text-muted-foreground print:text-gray-600">A Grades</div>
        </div>
        <div className="text-center p-2 rounded bg-blue-500/10 print:bg-blue-100">
          <div className="text-lg font-bold text-blue-500 print:text-blue-700">
            {(gradeDistribution['B+'] || 0) + (gradeDistribution['B'] || 0) + (gradeDistribution['B-'] || 0)}
          </div>
          <div className="text-xs text-muted-foreground print:text-gray-600">B Grades</div>
        </div>
        <div className="text-center p-2 rounded bg-yellow-500/10 print:bg-yellow-100">
          <div className="text-lg font-bold text-yellow-500 print:text-yellow-700">
            {(gradeDistribution['C+'] || 0) + (gradeDistribution['C'] || 0) + (gradeDistribution['C-'] || 0) + (gradeDistribution['D'] || 0) + (gradeDistribution['F'] || 0)}
          </div>
          <div className="text-xs text-muted-foreground print:text-gray-600">C or Below</div>
        </div>
      </div>
    </div>
  );
}

export function PlayerReportCard({ playerId, dateRange, showActions = true }: PlayerReportCardProps) {
  const { data: reportCard, isLoading: reportLoading } = usePlayerReportCard(playerId);
  const { data: player, isLoading: playerLoading } = usePlayer(playerId);
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/players/${playerId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${reportCard?.player.name || 'Player'} Report Card`,
          text: `Check out ${reportCard?.player.name}'s basketball report card!`,
          url: url,
        });
      } catch (err) {
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shootingStats = useMemo(() => {
    if (!reportCard) return null;
    return {
      fgPct: "—",
      threePct: "—", 
      ftPct: "—",
      tsPct: "—",
      per: "—",
      gameScore: "—"
    };
  }, [reportCard]);

  if (reportLoading || playerLoading) {
    return (
      <Card className="print:shadow-none" data-testid="report-card-loading">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
        </CardContent>
      </Card>
    );
  }

  if (!reportCard || !player) {
    return (
      <Card data-testid="report-card-error">
        <CardContent className="p-6 text-center text-muted-foreground">
          <p>Unable to load report card.</p>
        </CardContent>
      </Card>
    );
  }

  const { seasonStats, gradeDistribution, trends, badges, skillBadges, coachGoals, recentCoachNotes } = reportCard;
  const unlockedSkillBadges = skillBadges.filter(b => b.currentLevel !== 'none');
  const publicCoachNotes = recentCoachNotes;

  // Calculate best attribute and area needing work
  const playerSummary = useMemo(() => {
    // Only include stats that have trend data available
    const statCategories = [
      { key: "points", label: "Scoring", value: Number(seasonStats.avgPoints) || 0, trend: trends?.pointsTrend || 0 },
      { key: "rebounds", label: "Rebounding", value: Number(seasonStats.avgRebounds) || 0, trend: trends?.reboundsTrend || 0 },
      { key: "assists", label: "Playmaking", value: Number(seasonStats.avgAssists) || 0, trend: trends?.assistsTrend || 0 },
      { key: "hustle", label: "Hustle", value: Number(seasonStats.avgHustle) || 0, trend: trends?.hustleTrend || 0 },
    ];

    // Find best attribute (highest value among stats with actual data)
    const statsWithData = statCategories.filter(s => s.value > 0);
    const bestStat = statsWithData.length > 0 
      ? statsWithData.reduce((a, b) => (a.value > b.value ? a : b))
      : null;
    
    // Find area needing work (worst declining trend)
    const decliningStats = statCategories.filter(s => s.trend < -0.5);
    const worstTrend = decliningStats.length > 0 
      ? decliningStats.reduce((a, b) => (a.trend < b.trend ? a : b))
      : null;
    
    // If no declining trends, find lowest non-zero stat that could improve (excluding best stat)
    const candidatesForImprovement = statsWithData.filter(s => bestStat && s.key !== bestStat.key);
    const lowestStat = candidatesForImprovement.length > 0
      ? candidatesForImprovement.reduce((a, b) => (a.value < b.value ? a : b))
      : null;

    // Calculate average grade
    const total = Object.values(gradeDistribution).reduce((a, b) => a + b, 0);
    let avgGrade = "—";
    if (total > 0) {
      const gradeWeights: Record<string, number> = {
        'A+': 4.3, 'A': 4.0, 'A-': 3.7,
        'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7,
        'D': 1.0, 'F': 0.0
      };
      let weightedSum = 0;
      Object.entries(gradeDistribution).forEach(([grade, count]) => {
        weightedSum += (gradeWeights[grade] || 0) * count;
      });
      const avg = weightedSum / total;
      if (avg >= 4.15) avgGrade = 'A+';
      else if (avg >= 3.85) avgGrade = 'A';
      else if (avg >= 3.5) avgGrade = 'A-';
      else if (avg >= 3.15) avgGrade = 'B+';
      else if (avg >= 2.85) avgGrade = 'B';
      else if (avg >= 2.5) avgGrade = 'B-';
      else if (avg >= 2.15) avgGrade = 'C+';
      else if (avg >= 1.85) avgGrade = 'C';
      else if (avg >= 1.5) avgGrade = 'C-';
      else if (avg >= 0.5) avgGrade = 'D';
      else avgGrade = 'F';
    }

    return {
      bestAttribute: bestStat && bestStat.value > 0 ? bestStat : null,
      needsWork: worstTrend || (lowestStat && lowestStat.value > 0 ? lowestStat : null),
      avgGrade,
      gamesPlayed: seasonStats.gamesPlayed,
    };
  }, [seasonStats, trends, gradeDistribution]);

  return (
    <div className="space-y-6 print:space-y-4 print:bg-white" data-testid="player-report-card" id="report-card-container">
      <PrintStyles />
      
      {showActions && (
        <div className="flex items-center justify-between gap-4 print:hidden">
          <h2 className="text-xl font-bold font-display">Player Report Card</h2>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleShare}
              data-testid="button-share-report"
            >
              {copied ? <Check className="w-4 h-4 mr-1" /> : <Share2 className="w-4 h-4 mr-1" />}
              {copied ? "Copied!" : "Share"}
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={handlePrint}
              data-testid="button-download-pdf"
            >
              <Printer className="w-4 h-4 mr-1" />
              Print / PDF
            </Button>
          </div>
        </div>
      )}

      <div data-testid="report-card-container" className="print:text-black">
        <Card className="print:shadow-none print:border-gray-300 print:bg-white report-card-header">
          <CardContent className="p-6 print:p-4">
            <div className="flex items-start gap-4 pb-6 border-b border-border print:border-gray-300 print:pb-4">
              <Avatar className="w-20 h-20 border-2 border-primary/20 print:border-gray-300">
                <AvatarImage src={player.photoUrl || undefined} alt={player.name} />
                <AvatarFallback className="text-2xl font-bold bg-primary/10 print:bg-gray-200 print:text-black">
                  {player.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-2xl font-bold font-display print:text-black" data-testid="text-player-name">{player.name}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="secondary" className="print:bg-gray-200 print:text-black" data-testid="badge-position">{player.position}</Badge>
                  {player.team && <span className="text-sm text-muted-foreground print:text-gray-600">{player.team}</span>}
                  {player.jerseyNumber && <span className="text-sm text-muted-foreground print:text-gray-600">#{player.jerseyNumber}</span>}
                  {player.height && <span className="text-sm text-muted-foreground print:text-gray-600">{player.height}</span>}
                </div>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <Badge variant="outline" className="gap-1 print:bg-gray-100 print:text-black print:border-gray-300">
                    <Star className="w-3 h-3" />
                    {reportCard.player.currentTier}
                  </Badge>
                  <span className="text-sm text-muted-foreground print:text-gray-600">{reportCard.player.totalXp.toLocaleString()} XP</span>
                </div>
              </div>
              <div className="text-right hidden print:block">
                <div className="text-xs text-gray-500">Generated on</div>
                <div className="text-sm font-medium text-gray-700">{format(new Date(), 'MMMM d, yyyy')}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <ReportSummarySection title="Player Summary" icon={Star}>
          <div className="space-y-3 text-sm" data-testid="player-summary-section">
            <p className="text-muted-foreground">
              <span className="text-foreground font-semibold">{player.name}</span>
              {player.team && (
                <span> plays for <span className="text-foreground font-semibold">{player.team}</span></span>
              )}
              {player.position && (
                <span> as a <span className="text-foreground font-semibold">{player.position}</span></span>
              )}
              .
            </p>
            
            {playerSummary.gamesPlayed > 0 ? (
              <>
                <p className="text-muted-foreground">
                  Over <span className="text-foreground font-semibold">{playerSummary.gamesPlayed} game{playerSummary.gamesPlayed !== 1 ? "s" : ""}</span> this season, 
                  they've averaged{" "}
                  <span className="text-foreground font-semibold">{seasonStats.avgPoints} PPG</span>,{" "}
                  <span className="text-foreground font-semibold">{seasonStats.avgRebounds} RPG</span>, and{" "}
                  <span className="text-foreground font-semibold">{seasonStats.avgAssists} APG</span>{" "}
                  with an average grade of <span className="text-foreground font-semibold">{playerSummary.avgGrade}</span>.
                </p>
                
                {playerSummary.bestAttribute && playerSummary.bestAttribute.value > 0 && (
                  <p>
                    <span className="text-emerald-500 font-semibold">Best attribute:</span>{" "}
                    <span className="text-foreground">{playerSummary.bestAttribute.label}</span>
                    <span className="text-muted-foreground">
                      {" "}— averaging {playerSummary.bestAttribute.value.toFixed(1)} per game
                      {playerSummary.bestAttribute.trend > 0.5 && (
                        <span className="text-emerald-500"> (trending up +{playerSummary.bestAttribute.trend.toFixed(1)})</span>
                      )}
                    </span>
                  </p>
                )}
                
                {playerSummary.needsWork && (
                  <p>
                    <span className="text-amber-500 font-semibold">Needs work:</span>{" "}
                    <span className="text-foreground">{playerSummary.needsWork.label}</span>
                    <span className="text-muted-foreground">
                      {playerSummary.needsWork.trend < -0.5 
                        ? ` — declined by ${Math.abs(playerSummary.needsWork.trend).toFixed(1)} compared to recent games`
                        : ` — currently averaging ${playerSummary.needsWork.value.toFixed(1)} per game`
                      }
                    </span>
                  </p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">No games logged yet this season.</p>
            )}
          </div>
        </ReportSummarySection>

        <ReportSummarySection title="Season Overview" icon={Activity}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox label="Games Played" value={seasonStats.gamesPlayed} highlight />
            <StatBox label="PPG" value={seasonStats.avgPoints} />
            <StatBox label="RPG" value={seasonStats.avgRebounds} />
            <StatBox label="APG" value={seasonStats.avgAssists} />
          </div>
        </ReportSummarySection>

        <ReportSummarySection title="Season Totals" icon={BarChart3}>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            <StatBox label="Total Points" value={seasonStats.totalPoints} />
            <StatBox label="Total Rebounds" value={seasonStats.totalRebounds} />
            <StatBox label="Total Assists" value={seasonStats.totalAssists} />
            <StatBox label="Avg Hustle" value={seasonStats.avgHustle} />
            <StatBox label="Avg Defense" value={seasonStats.avgDefense} />
          </div>
        </ReportSummarySection>

        <div className="grid md:grid-cols-2 gap-6 print:gap-4">
          <ReportSummarySection title="Grade Summary" icon={Award}>
            <GradeTrendTable gradeDistribution={gradeDistribution} />
          </ReportSummarySection>

          <ReportSummarySection title="Grade Distribution" icon={BarChart3}>
            {Object.keys(gradeDistribution).length > 0 ? (
              <GradeDistributionChart distribution={gradeDistribution} />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4 print:text-gray-600">No games graded yet</p>
            )}
          </ReportSummarySection>
        </div>

        {trends && (
          <ReportSummarySection title="Performance Trends" icon={TrendingUp}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <TrendIndicator value={trends.pointsTrend} label="Points" />
              <TrendIndicator value={trends.reboundsTrend} label="Rebounds" />
              <TrendIndicator value={trends.assistsTrend} label="Assists" />
              <TrendIndicator value={trends.hustleTrend} label="Hustle" />
            </div>
          </ReportSummarySection>
        )}

        <div className="grid md:grid-cols-2 gap-6 print:gap-4 print:break-inside-avoid">
          <ReportSummarySection title={`Achievement Badges (${badges.length})`} icon={Trophy}>
            {badges.length > 0 ? (
              <div className="flex flex-wrap gap-2" data-testid="achievement-badges">
                {badges.slice(0, 15).map((badge, idx) => {
                  const badgeInfo = BADGE_DEFINITIONS[badge.badgeType as keyof typeof BADGE_DEFINITIONS];
                  return (
                    <Badge 
                      key={`${badge.badgeType}-${idx}`}
                      variant="secondary"
                      className="gap-1 print:bg-gray-200 print:text-black print:border-gray-300"
                      title={badgeInfo?.description}
                      data-testid={`badge-${badge.badgeType}`}
                    >
                      <Trophy className="w-3 h-3" />
                      {badgeInfo?.name || badge.badgeType}
                    </Badge>
                  );
                })}
                {badges.length > 15 && (
                  <Badge variant="outline" className="print:bg-white print:text-black">+{badges.length - 15} more</Badge>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4 print:text-gray-600">No badges earned yet</p>
            )}
          </ReportSummarySection>

          {unlockedSkillBadges.length > 0 && (
            <ReportSummarySection title="Skill Badges" icon={Target}>
              <div className="space-y-2" data-testid="skill-badges-section">
                {unlockedSkillBadges.slice(0, 6).map(badge => (
                  <SkillBadgeItem key={badge.skillType} badge={badge} />
                ))}
              </div>
            </ReportSummarySection>
          )}
        </div>

        {coachGoals.length > 0 && (
          <ReportSummarySection title="Goals Progress" icon={Target} breakBefore>
            <div className="space-y-3" data-testid="coach-goals-section">
              {coachGoals.map((goal, idx) => (
                <CoachGoalItem key={idx} goal={goal} />
              ))}
            </div>
          </ReportSummarySection>
        )}

        {publicCoachNotes.length > 0 && (
          <ReportSummarySection title="Recent Coach Notes" icon={MessageSquare}>
            <div className="space-y-3" data-testid="coach-notes-section">
              {publicCoachNotes.slice(0, 5).map((note, idx) => (
                <CoachNoteItem key={idx} note={note} />
              ))}
            </div>
          </ReportSummarySection>
        )}

        <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>Report generated by Caliber Basketball Analytics</p>
          <p>{format(new Date(), 'MMMM d, yyyy \'at\' h:mm a')}</p>
        </div>
      </div>
    </div>
  );
}
