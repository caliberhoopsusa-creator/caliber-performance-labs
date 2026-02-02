import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ChevronDown, 
  ChevronUp, 
  Bookmark, 
  BookmarkCheck, 
  MapPin, 
  GraduationCap,
  Trophy,
  Mail,
  ExternalLink,
  Target,
  BookOpen,
  Zap,
  Navigation,
  TrendingUp,
  Users,
  DollarSign,
  Medal,
  Clock,
  BarChart3,
  Star,
  Award,
  Heart,
  Copy,
  Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface PlayerInfo {
  id: number;
  name: string;
  position: string;
  school: string | null;
  graduationYear: number | null;
  gpa: string | null;
}

interface PlayerCollegeInterest {
  id: number;
  playerId: number;
  collegeId: number;
  interestLevel: string | null;
  notes: string | null;
  contacted: boolean | null;
  contactedAt: string | null;
  createdAt: string;
}

interface College {
  id: number;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
  city: string;
  state: string;
  region: string | null;
  division: string;
  conference: string | null;
  academicRating: number | null;
  avgGpaRequired: string | null;
  sport: string;
  programStrength: number | null;
  recruitingContactEmail: string | null;
  recruitingUrl: string | null;
  winsLastSeason: number | null;
  lossesLastSeason: number | null;
  conferenceRecord: string | null;
  nationalChampionships: number | null;
  conferenceChampionships: number | null;
  tournamentAppearances: number | null;
  finalFourAppearances: number | null;
  nbaPlayersProduced: number | null;
  nflPlayersProduced: number | null;
  draftPicksLast5Years: number | null;
  averageMinutesForFreshmen: number | null;
  athleteGraduationRate: number | null;
  academicAllAmericans: number | null;
  athleticBudget: string | null;
  averageAttendance: number | null;
  niLOpportunities: string | null;
  currentRosterSize: number | null;
  incomingRecruitingClass: number | null;
  headCoachName: string | null;
  headCoachYears: number | null;
  headCoachRecord: string | null;
  statsLastUpdated: string | null;
  statsSource: string | null;
}

interface CollegeMatch {
  id: number;
  playerId: number;
  collegeId: number;
  overallMatchScore: number;
  skillMatchScore: number | null;
  academicMatchScore: number | null;
  styleMatchScore: number | null;
  locationMatchScore: number | null;
  matchReasoning: string | null;
  strengthsForProgram: string | null;
  developmentAreas: string | null;
  isRecommended: boolean;
  isSaved: boolean;
  college: College;
}

interface CollegeMatchesProps {
  playerId: number;
  divisionFilter?: string;
  sportFilter?: string;
}

const DIVISION_COLORS: Record<string, string> = {
  'D1': 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
  'D2': 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white',
  'D3': 'bg-gradient-to-r from-emerald-500 to-green-500 text-white',
  'NAIA': 'bg-gradient-to-r from-purple-500 to-violet-500 text-white',
  'JUCO': 'bg-gradient-to-r from-rose-500 to-pink-500 text-white',
};

const LOGO_COLORS = [
  'bg-gradient-to-br from-cyan-500 to-blue-600',
  'bg-gradient-to-br from-amber-500 to-orange-600',
  'bg-gradient-to-br from-emerald-500 to-teal-600',
  'bg-gradient-to-br from-purple-500 to-indigo-600',
  'bg-gradient-to-br from-rose-500 to-pink-600',
  'bg-gradient-to-br from-sky-500 to-cyan-600',
];

function CircularProgress({ value, size = 64, strokeWidth = 6 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  
  const getColor = (score: number) => {
    if (score >= 80) return 'stroke-emerald-400';
    if (score >= 60) return 'stroke-cyan-400';
    if (score >= 40) return 'stroke-amber-400';
    return 'stroke-rose-400';
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="stroke-white/10"
          strokeWidth={strokeWidth}
          fill="none"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={cn("transition-all duration-500", getColor(value))}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-white">{value}%</span>
      </div>
    </div>
  );
}

function ScoreBar({ label, value, icon: Icon }: { label: string; value: number | null; icon: React.ComponentType<{ className?: string }> }) {
  const score = value ?? 0;
  
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="text-xs font-medium text-white">{score}%</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-500",
              score >= 80 ? "bg-emerald-400" : score >= 60 ? "bg-cyan-400" : score >= 40 ? "bg-amber-400" : "bg-rose-400"
            )}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  );
}

interface CollegeMatchCardProps {
  match: CollegeMatch;
  onToggleSave: (matchId: number) => void;
  isInterested: boolean;
  onToggleInterest: (collegeId: number, isInterested: boolean) => void;
  isInterestPending: boolean;
  playerInfo?: PlayerInfo;
}

function generateMailtoLink(college: College, playerInfo?: PlayerInfo): string {
  if (!college.recruitingContactEmail) return '';
  
  const playerName = playerInfo?.name || 'Prospective Student-Athlete';
  const position = playerInfo?.position || 'Athlete';
  const year = playerInfo?.graduationYear || new Date().getFullYear() + 1;
  const school = playerInfo?.school || 'My School';
  const gpa = playerInfo?.gpa ? `${playerInfo.gpa}` : 'N/A';
  
  const subject = encodeURIComponent(`Recruiting Interest - ${playerName} - ${position} - Class of ${year}`);
  
  const body = encodeURIComponent(
`Dear ${college.name} Coaching Staff,

My name is ${playerName}, and I am a ${position} in the Class of ${year} from ${school}.

I am very interested in your ${college.sport} program and would love the opportunity to learn more about ${college.shortName || college.name} and how I can contribute to your team.

Here are some quick facts about me:
- Position: ${position}
- School: ${school}
- Graduation Year: ${year}
- GPA: ${gpa}

I would greatly appreciate the opportunity to discuss my potential fit with your program. Please let me know if there are upcoming camps, visits, or other ways I can get on your radar.

Thank you for your time and consideration.

Sincerely,
${playerName}`
  );
  
  return `mailto:${college.recruitingContactEmail}?subject=${subject}&body=${body}`;
}

function CollegeMatchCard({ match, onToggleSave, isInterested, onToggleInterest, isInterestPending, playerInfo }: CollegeMatchCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const { toast } = useToast();
  const college = match.college;
  const colorIndex = college.id % LOGO_COLORS.length;

  const handleEmailCoach = () => {
    const mailtoLink = generateMailtoLink(college, playerInfo);
    if (mailtoLink) {
      window.location.href = mailtoLink;
    }
  };

  const handleCopyEmail = async () => {
    if (college.recruitingContactEmail) {
      try {
        await navigator.clipboard.writeText(college.recruitingContactEmail);
        setCopiedEmail(true);
        toast({
          title: "Email Copied",
          description: `${college.recruitingContactEmail} copied to clipboard`,
        });
        setTimeout(() => setCopiedEmail(false), 2000);
      } catch {
        toast({
          title: "Copy Failed",
          description: "Could not copy email to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300",
      "bg-gradient-to-br from-[hsl(220,25%,10%)] via-[hsl(220,20%,8%)] to-[hsl(220,25%,6%)]",
      "border-cyan-500/10",
      "shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
    )}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
      
      <div className="p-4 md:p-5">
        <div className="flex gap-4">
          <div className={cn(
            "w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center flex-shrink-0",
            "shadow-lg shadow-black/30",
            LOGO_COLORS[colorIndex]
          )}>
            <span className="text-2xl md:text-3xl font-bold text-white font-display">
              {(college.shortName || college.name)[0]}
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-display text-lg font-bold text-white truncate">
                  {college.shortName || college.name}
                </h3>
                <p className="text-sm text-muted-foreground truncate">{college.name}</p>
              </div>
              <CircularProgress value={match.overallMatchScore} size={56} strokeWidth={5} />
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge className={cn("text-[10px] font-bold", DIVISION_COLORS[college.division] || 'bg-gray-500')}>
                {college.division}
              </Badge>
              {college.conference && (
                <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-300">
                  {college.conference}
                </Badge>
              )}
              {match.isRecommended && (
                <Badge className="text-[10px] bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  Top Match
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-4">
          <ScoreBar label="Skill Fit" value={match.skillMatchScore} icon={Target} />
          <ScoreBar label="Academic Fit" value={match.academicMatchScore} icon={BookOpen} />
          <ScoreBar label="Style Fit" value={match.styleMatchScore} icon={Zap} />
          <ScoreBar label="Location" value={match.locationMatchScore} icon={Navigation} />
        </div>
        
        {(() => {
          const hasRecord = college.winsLastSeason !== null && college.lossesLastSeason !== null;
          const hasTitles = college.nationalChampionships !== null && college.nationalChampionships > 0;
          const hasDraftPicks = college.draftPicksLast5Years !== null && college.draftPicksLast5Years > 0;
          const hasGradRate = college.athleteGraduationRate !== null;
          
          const visibleStats = [hasRecord, hasTitles, hasDraftPicks, hasGradRate].filter(Boolean).length;
          
          if (visibleStats === 0) return null;
          
          return (
            <div className={cn(
              "grid gap-2 mt-4 p-3 rounded-lg bg-white/5 border border-white/10",
              visibleStats === 1 ? "grid-cols-1" :
              visibleStats === 2 ? "grid-cols-2" :
              visibleStats === 3 ? "grid-cols-3" : "grid-cols-4"
            )}>
              {hasRecord && (
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{college.winsLastSeason}-{college.lossesLastSeason}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Record</div>
                </div>
              )}
              {hasTitles && (
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-400">{college.nationalChampionships}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Titles</div>
                </div>
              )}
              {hasDraftPicks && (
                <div className="text-center">
                  <div className="text-lg font-bold text-cyan-400">{college.draftPicksLast5Years}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Draft Picks (5yr)</div>
                </div>
              )}
              {hasGradRate && (
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-400">{college.athleteGraduationRate}%</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Grad Rate</div>
                </div>
              )}
            </div>
          );
        })()}

        {match.matchReasoning && (
          <p className="text-sm text-muted-foreground mt-4 line-clamp-2">
            {match.matchReasoning}
          </p>
        )}
        
        <div className="flex items-center gap-2 mt-4">
          <Collapsible open={isOpen} onOpenChange={setIsOpen} className="flex-1">
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full border-cyan-500/20"
                data-testid={`button-view-details-${match.id}`}
              >
                {isOpen ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    View Details
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              {(college.headCoachName || college.tournamentAppearances || college.conferenceRecord) && (
                <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20">
                  <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <BarChart3 className="w-3.5 h-3.5" />
                    Program Statistics
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {college.headCoachName && (
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Coach:</span>
                        <span className="text-white/90 truncate">{college.headCoachName}</span>
                      </div>
                    )}
                    {college.headCoachRecord && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Record:</span>
                        <span className="text-white/90">{college.headCoachRecord}</span>
                      </div>
                    )}
                    {college.conferenceRecord && (
                      <div className="flex items-center gap-2">
                        <Medal className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Conf:</span>
                        <span className="text-white/90">{college.conferenceRecord}</span>
                      </div>
                    )}
                    {college.tournamentAppearances !== null && (
                      <div className="flex items-center gap-2">
                        <Trophy className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">{college.sport === 'basketball' ? 'March Madness' : 'Bowl Games'}:</span>
                        <span className="text-white/90">{college.tournamentAppearances}</span>
                      </div>
                    )}
                    {college.finalFourAppearances !== null && college.finalFourAppearances > 0 && (
                      <div className="flex items-center gap-2">
                        <Star className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-muted-foreground">{college.sport === 'basketball' ? 'Final Fours' : 'Playoffs'}:</span>
                        <span className="text-amber-400 font-medium">{college.finalFourAppearances}</span>
                      </div>
                    )}
                    {college.conferenceChampionships !== null && college.conferenceChampionships > 0 && (
                      <div className="flex items-center gap-2">
                        <Award className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Conf Titles:</span>
                        <span className="text-white/90">{college.conferenceChampionships}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {((college.sport === 'basketball' && college.nbaPlayersProduced) || 
                (college.sport === 'football' && college.nflPlayersProduced) ||
                college.averageMinutesForFreshmen) && (
                <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20">
                  <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Player Development
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {college.sport === 'basketball' && college.nbaPlayersProduced !== null && (
                      <div className="flex items-center gap-2">
                        <Star className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">NBA Players:</span>
                        <span className="text-white/90">{college.nbaPlayersProduced}</span>
                      </div>
                    )}
                    {college.sport === 'football' && college.nflPlayersProduced !== null && (
                      <div className="flex items-center gap-2">
                        <Star className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">NFL Players:</span>
                        <span className="text-white/90">{college.nflPlayersProduced}</span>
                      </div>
                    )}
                    {college.averageMinutesForFreshmen !== null && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Freshman Minutes:</span>
                        <span className="text-white/90">{college.averageMinutesForFreshmen} avg</span>
                      </div>
                    )}
                    {college.currentRosterSize !== null && (
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Roster:</span>
                        <span className="text-white/90">{college.currentRosterSize} players</span>
                      </div>
                    )}
                    {college.incomingRecruitingClass !== null && (
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-muted-foreground">Incoming Class:</span>
                        <span className="text-cyan-400 font-medium">{college.incomingRecruitingClass} recruits</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(college.niLOpportunities || college.athleticBudget || college.averageAttendance) && (
                <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-violet-500/5 border border-purple-500/20">
                  <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5" />
                    Resources & Support
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {college.niLOpportunities && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">NIL Market:</span>
                        <Badge variant="outline" className={cn(
                          "text-[10px] ml-1",
                          college.niLOpportunities === 'High' 
                            ? "border-emerald-500/50 text-emerald-400" 
                            : college.niLOpportunities === 'Medium'
                            ? "border-amber-500/50 text-amber-400"
                            : "border-gray-500/50 text-gray-400"
                        )}>
                          {college.niLOpportunities}
                        </Badge>
                      </div>
                    )}
                    {college.athleticBudget && (
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Budget:</span>
                        <span className="text-white/90">{college.athleticBudget}</span>
                      </div>
                    )}
                    {college.averageAttendance !== null && (
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Avg Attendance:</span>
                        <span className="text-white/90">{college.averageAttendance.toLocaleString()}</span>
                      </div>
                    )}
                    {college.academicAllAmericans !== null && college.academicAllAmericans > 0 && (
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Academic All-Americans:</span>
                        <span className="text-white/90">{college.academicAllAmericans}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {match.strengthsForProgram && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Trophy className="w-3.5 h-3.5" />
                    Strengths for Program
                  </h4>
                  <p className="text-sm text-white/80">{match.strengthsForProgram}</p>
                </div>
              )}
              
              {match.developmentAreas && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Target className="w-3.5 h-3.5" />
                    Development Areas
                  </h4>
                  <p className="text-sm text-white/80">{match.developmentAreas}</p>
                </div>
              )}
              
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" />
                  Location & Info
                </h4>
                <div className="space-y-1.5 text-sm">
                  <p className="text-white/80">
                    {college.city}, {college.state}
                    {college.region && <span className="text-muted-foreground"> ({college.region})</span>}
                  </p>
                  {college.conference && (
                    <p className="text-muted-foreground">Conference: {college.conference}</p>
                  )}
                  {college.academicRating && (
                    <p className="text-muted-foreground">Academic Rating: {college.academicRating}/100</p>
                  )}
                  {college.avgGpaRequired && (
                    <p className="text-muted-foreground">Min GPA Required: {college.avgGpaRequired}</p>
                  )}
                </div>
              </div>
              
              {(college.recruitingContactEmail || college.recruitingUrl) && (
                <div className="flex flex-wrap gap-2">
                  {college.recruitingContactEmail && (
                    <>
                      <Button 
                        size="sm" 
                        onClick={handleEmailCoach}
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white"
                        data-testid={`button-contact-coach-${match.id}`}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Email Coach
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-cyan-500/30"
                        onClick={handleCopyEmail}
                        data-testid={`button-copy-email-${match.id}`}
                      >
                        {copiedEmail ? (
                          <Check className="w-4 h-4 mr-2 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 mr-2" />
                        )}
                        {copiedEmail ? 'Copied!' : 'Copy Email'}
                      </Button>
                    </>
                  )}
                  {college.recruitingUrl && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-cyan-500/30"
                      asChild
                    >
                      <a href={college.recruitingUrl} target="_blank" rel="noopener noreferrer" data-testid={`link-recruiting-${match.id}`}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Recruiting Page
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
          
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleInterest(college.id, isInterested)}
              disabled={isInterestPending}
              className={cn(
                "transition-colors",
                isInterested ? "text-rose-500 hover:text-rose-400" : "text-muted-foreground hover:text-rose-400"
              )}
              data-testid={`button-interest-${match.id}`}
            >
              <Heart className={cn("w-5 h-5", isInterested && "fill-current")} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleSave(match.id)}
              className={cn(
                "transition-colors",
                match.isSaved ? "text-amber-400 hover:text-amber-300" : "text-muted-foreground hover:text-white"
              )}
              data-testid={`button-save-${match.id}`}
            >
              {match.isSaved ? (
                <BookmarkCheck className="w-5 h-5" />
              ) : (
                <Bookmark className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function CollegeMatchSkeleton() {
  return (
    <Card className="p-4 md:p-5 bg-gradient-to-br from-[hsl(220,25%,10%)] to-[hsl(220,25%,6%)] border-cyan-500/10">
      <div className="flex gap-4">
        <Skeleton className="w-14 h-14 md:w-16 md:h-16 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
        <Skeleton className="w-14 h-14 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 mt-4">
        <Skeleton className="h-6" />
        <Skeleton className="h-6" />
        <Skeleton className="h-6" />
        <Skeleton className="h-6" />
      </div>
      <Skeleton className="h-12 mt-4" />
      <Skeleton className="h-9 mt-4" />
    </Card>
  );
}

export function CollegeMatches({ playerId, divisionFilter = 'all', sportFilter }: CollegeMatchesProps) {
  const { data: matches, isLoading, error } = useQuery<CollegeMatch[]>({
    queryKey: ['/api/players', playerId, 'college-matches'],
    enabled: !!playerId,
  });

  const { data: playerInfo } = useQuery<PlayerInfo>({
    queryKey: ['/api/players', playerId],
    enabled: !!playerId,
  });

  const { data: interests } = useQuery<PlayerCollegeInterest[]>({
    queryKey: ['/api/players', playerId, 'interests'],
    enabled: !!playerId,
  });

  const interestedCollegeIds = new Set(interests?.map(i => i.collegeId) || []);

  const saveMutation = useMutation({
    mutationFn: async (matchId: number) => {
      return apiRequest('PATCH', `/api/college-matches/${matchId}/toggle-save`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/players', playerId, 'college-matches'] });
    },
  });

  const interestMutation = useMutation({
    mutationFn: async ({ collegeId, isInterested }: { collegeId: number; isInterested: boolean }) => {
      if (isInterested) {
        return apiRequest('DELETE', `/api/players/${playerId}/interests/${collegeId}`);
      } else {
        return apiRequest('POST', `/api/players/${playerId}/interests`, { collegeId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/players', playerId, 'interests'] });
    },
  });

  const handleToggleSave = (matchId: number) => {
    saveMutation.mutate(matchId);
  };

  const handleToggleInterest = (collegeId: number, isInterested: boolean) => {
    interestMutation.mutate({ collegeId, isInterested });
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:gap-6 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <CollegeMatchSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Failed to load college matches</p>
      </div>
    );
  }

  const filteredMatches = matches?.filter(m => {
    const divisionMatch = divisionFilter === 'all' || m.college.division === divisionFilter;
    const sportMatch = !sportFilter || m.college.sport === sportFilter;
    return divisionMatch && sportMatch;
  }).slice(0, 10) ?? [];

  if (filteredMatches.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 md:gap-6 md:grid-cols-2" data-testid="college-matches-grid">
      {filteredMatches.map((match) => (
        <CollegeMatchCard 
          key={match.id} 
          match={match} 
          onToggleSave={handleToggleSave}
          isInterested={interestedCollegeIds.has(match.college.id)}
          onToggleInterest={handleToggleInterest}
          isInterestPending={interestMutation.isPending}
          playerInfo={playerInfo}
        />
      ))}
    </div>
  );
}
