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
  Navigation
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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

function CollegeMatchCard({ match, onToggleSave }: { match: CollegeMatch; onToggleSave: (matchId: number) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const college = match.college;
  const colorIndex = college.id % LOGO_COLORS.length;

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300",
      "bg-gradient-to-br from-[hsl(220,25%,10%)] via-[hsl(220,20%,8%)] to-[hsl(220,25%,6%)]",
      "border-cyan-500/10 hover:border-cyan-400/20",
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
                className="w-full border-cyan-500/20 hover:border-cyan-400/40 hover:bg-cyan-500/10"
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
                </div>
              </div>
              
              {(college.recruitingContactEmail || college.recruitingUrl) && (
                <div className="flex flex-wrap gap-2">
                  {college.recruitingContactEmail && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-cyan-500/30 hover:bg-cyan-500/10"
                      asChild
                    >
                      <a href={`mailto:${college.recruitingContactEmail}`} data-testid={`link-contact-${match.id}`}>
                        <Mail className="w-4 h-4 mr-2" />
                        Contact
                      </a>
                    </Button>
                  )}
                  {college.recruitingUrl && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-cyan-500/30 hover:bg-cyan-500/10"
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
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleSave(match.id)}
            className={cn(
              "flex-shrink-0",
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

export function CollegeMatches({ playerId, divisionFilter = 'all' }: CollegeMatchesProps) {
  const { data: matches, isLoading, error } = useQuery<CollegeMatch[]>({
    queryKey: ['/api/players', playerId, 'college-matches'],
    enabled: !!playerId,
  });

  const saveMutation = useMutation({
    mutationFn: async (matchId: number) => {
      return apiRequest('PATCH', `/api/college-matches/${matchId}/toggle-save`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/players', playerId, 'college-matches'] });
    },
  });

  const handleToggleSave = (matchId: number) => {
    saveMutation.mutate(matchId);
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

  const filteredMatches = matches?.filter(m => 
    divisionFilter === 'all' || m.college.division === divisionFilter
  ).slice(0, 10) ?? [];

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
        />
      ))}
    </div>
  );
}
