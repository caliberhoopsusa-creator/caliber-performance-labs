import { usePlayerReportCard, usePlayer, type ReportCardSkillBadge, type ReportCardCoachGoal, type ReportCardCoachNote, type ReportCardTrends } from "@/hooks/use-basketball";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
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
  Check
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { BADGE_DEFINITIONS, SKILL_BADGE_TYPES } from "@shared/schema";

interface PlayerReportCardProps {
  playerId: number;
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
    <div className="flex items-center gap-1.5" data-testid={`trend-${label}`}>
      <span className="text-xs text-muted-foreground">{label}</span>
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
            <span className="w-8 text-xs font-bold text-right">{grade}</span>
            <div className="flex-1 h-5 bg-secondary/50 rounded overflow-hidden">
              <div 
                className={cn("h-full transition-all", GRADE_COLORS[grade])}
                style={{ width: `${barPercent}%` }}
              />
            </div>
            <span className="w-12 text-xs text-muted-foreground text-right">
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
      className={cn("flex items-center gap-2 px-3 py-2 rounded-lg", levelColor)}
      data-testid={`skill-badge-item-${badge.skillType}`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{config?.name || badge.skillType}</span>
      <Badge variant="outline" className="ml-auto text-xs">
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
        "p-3 rounded-lg border",
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
            <span className="font-medium text-sm">{goal.title}</span>
          </div>
          {goal.coachFeedback && (
            <p className="text-xs text-muted-foreground mt-1 pl-6">{goal.coachFeedback}</p>
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
      className="p-3 rounded-lg bg-card/50 border border-border"
      data-testid={`coach-note-item`}
    >
      <div className="flex items-start gap-2">
        <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm">{note.content}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className={cn("text-xs", noteTypeColors[note.noteType])}>
              {note.noteType}
            </Badge>
            <span className="text-xs text-muted-foreground">- {note.authorName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PlayerReportCard({ playerId }: PlayerReportCardProps) {
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

  return (
    <div className="space-y-6 print:space-y-4" data-testid="player-report-card">
      <div className="flex items-center justify-between gap-4 print:hidden">
        <h2 className="text-xl font-bold">Player Report Card</h2>
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
            variant="outline" 
            size="sm" 
            onClick={handlePrint}
            data-testid="button-download-pdf"
          >
            <Printer className="w-4 h-4 mr-1" />
            Download PDF
          </Button>
        </div>
      </div>

      <Card className="print:shadow-none print:border-none">
        <CardContent className="p-6">
          <div className="flex items-start gap-4 pb-6 border-b border-border print:pb-4">
            <Avatar className="w-20 h-20 border-2 border-primary/20">
              <AvatarImage src={player.photoUrl || undefined} alt={player.name} />
              <AvatarFallback className="text-2xl font-bold bg-primary/10">
                {player.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-2xl font-bold" data-testid="text-player-name">{player.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" data-testid="badge-position">{player.position}</Badge>
                {player.team && <span className="text-sm text-muted-foreground">{player.team}</span>}
                {player.jerseyNumber && <span className="text-sm text-muted-foreground">#{player.jerseyNumber}</span>}
              </div>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="outline" className="gap-1">
                  <Star className="w-3 h-3" />
                  {reportCard.player.currentTier}
                </Badge>
                <span className="text-sm text-muted-foreground">{reportCard.player.totalXp.toLocaleString()} XP</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-b border-border print:py-4">
            <div className="text-center" data-testid="stat-games-played">
              <div className="text-3xl font-bold text-primary">{seasonStats.gamesPlayed}</div>
              <div className="text-xs text-muted-foreground">Games Played</div>
            </div>
            <div className="text-center" data-testid="stat-avg-points">
              <div className="text-3xl font-bold">{seasonStats.avgPoints}</div>
              <div className="text-xs text-muted-foreground">PPG</div>
            </div>
            <div className="text-center" data-testid="stat-avg-rebounds">
              <div className="text-3xl font-bold">{seasonStats.avgRebounds}</div>
              <div className="text-xs text-muted-foreground">RPG</div>
            </div>
            <div className="text-center" data-testid="stat-avg-assists">
              <div className="text-3xl font-bold">{seasonStats.avgAssists}</div>
              <div className="text-xs text-muted-foreground">APG</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 py-4 border-b border-border print:py-3">
            <div className="text-center">
              <div className="text-xl font-bold">{seasonStats.totalPoints}</div>
              <div className="text-xs text-muted-foreground">Total PTS</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{seasonStats.totalRebounds}</div>
              <div className="text-xs text-muted-foreground">Total REB</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{seasonStats.totalAssists}</div>
              <div className="text-xs text-muted-foreground">Total AST</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{seasonStats.avgHustle}</div>
              <div className="text-xs text-muted-foreground">Avg Hustle</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{seasonStats.avgDefense}</div>
              <div className="text-xs text-muted-foreground">Avg Defense</div>
            </div>
          </div>

          {trends && (
            <div className="py-4 border-b border-border print:py-3" data-testid="trends-section">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Trend Indicators
              </h4>
              <div className="flex flex-wrap gap-4">
                <TrendIndicator value={trends.pointsTrend} label="Points" />
                <TrendIndicator value={trends.reboundsTrend} label="Rebounds" />
                <TrendIndicator value={trends.assistsTrend} label="Assists" />
                <TrendIndicator value={trends.hustleTrend} label="Hustle" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6 print:gap-4 print:grid-cols-2">
        <Card className="print:shadow-none print:border-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              Grade Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(gradeDistribution).length > 0 ? (
              <GradeDistributionChart distribution={gradeDistribution} />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No games graded yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="print:shadow-none print:border-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              Achievement Badges ({badges.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {badges.length > 0 ? (
              <div className="flex flex-wrap gap-2" data-testid="achievement-badges">
                {badges.slice(0, 12).map((badge, idx) => {
                  const badgeInfo = BADGE_DEFINITIONS[badge.badgeType as keyof typeof BADGE_DEFINITIONS];
                  return (
                    <Badge 
                      key={`${badge.badgeType}-${idx}`}
                      variant="secondary"
                      className="gap-1"
                      title={badgeInfo?.description}
                      data-testid={`badge-${badge.badgeType}`}
                    >
                      <Trophy className="w-3 h-3" />
                      {badgeInfo?.name || badge.badgeType}
                    </Badge>
                  );
                })}
                {badges.length > 12 && (
                  <Badge variant="outline">+{badges.length - 12} more</Badge>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No badges earned yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {unlockedSkillBadges.length > 0 && (
        <Card className="print:shadow-none print:border-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Skill Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3" data-testid="skill-badges-section">
              {unlockedSkillBadges.map(badge => (
                <SkillBadgeItem key={badge.skillType} badge={badge} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {coachGoals.length > 0 && (
        <Card className="print:shadow-none print:border-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Coach-Assigned Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3" data-testid="coach-goals-section">
              {coachGoals.map((goal, idx) => (
                <CoachGoalItem key={idx} goal={goal} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {publicCoachNotes.length > 0 && (
        <Card className="print:shadow-none print:border-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Recent Coach Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3" data-testid="coach-notes-section">
              {publicCoachNotes.map((note, idx) => (
                <CoachNoteItem key={idx} note={note} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          [data-testid="player-report-card"], 
          [data-testid="player-report-card"] * {
            visibility: visible;
          }
          [data-testid="player-report-card"] {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
