import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { CollegeMatches } from "@/components/CollegeMatches";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  GraduationCap, 
  Sparkles, 
  Loader2, 
  MapPin, 
  User, 
  BookOpen,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Player {
  id: number;
  name: string;
  position: string;
  gpa: string | null;
  city: string | null;
  state: string | null;
  graduationYear: number | null;
  school: string | null;
}

interface CollegeMatch {
  id: number;
  college: { division: string };
}

const DIVISIONS = [
  { value: 'all', label: 'All Divisions' },
  { value: 'D1', label: 'Division I' },
  { value: 'D2', label: 'Division II' },
  { value: 'D3', label: 'Division III' },
  { value: 'NAIA', label: 'NAIA' },
  { value: 'JUCO', label: 'JUCO' },
];

export default function CollegeRecruiting() {
  const { user } = useAuth();
  const playerId = (user as any)?.playerId;
  const [divisionFilter, setDivisionFilter] = useState('all');

  const { data: player, isLoading: playerLoading } = useQuery<Player>({
    queryKey: ['/api/players', playerId],
    enabled: !!playerId,
  });

  const { data: matches, isLoading: matchesLoading } = useQuery<CollegeMatch[]>({
    queryKey: ['/api/players', playerId, 'college-matches'],
    enabled: !!playerId,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/players/${playerId}/college-matches/generate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/players', playerId, 'college-matches'] });
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate();
  };

  if (!playerId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <EmptyState
          icon={GraduationCap}
          title="No Player Profile"
          description="Create a player profile to access college recruiting features."
        />
      </div>
    );
  }

  const hasMatches = matches && matches.length > 0;
  const isGenerating = generateMutation.isPending;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-cyan-400" />
            College Recruiting
          </h1>
          <p className="text-muted-foreground mt-1">
            Find your perfect college fit based on your skills and preferences
          </p>
        </div>
        
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/25"
          data-testid="button-generate-matches"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : hasMatches ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Matches
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Matches
            </>
          )}
        </Button>
      </div>

      {playerLoading ? (
        <Card className="p-4 md:p-6 bg-gradient-to-br from-[hsl(220,25%,10%)] to-[hsl(220,25%,6%)] border-cyan-500/10">
          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-6 w-36" />
          </div>
        </Card>
      ) : player ? (
        <Card className={cn(
          "p-4 md:p-6 relative overflow-hidden",
          "bg-gradient-to-br from-[hsl(220,25%,10%)] via-[hsl(220,20%,8%)] to-[hsl(220,25%,6%)]",
          "border-cyan-500/10"
        )}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
          
          <div className="flex flex-wrap items-center gap-3 md:gap-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold text-white">{player.name}</span>
              <Badge variant="outline" className="border-cyan-500/30 text-cyan-300">
                {player.position}
              </Badge>
            </div>
            
            {player.gpa && (
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">GPA: <span className="text-white font-medium">{player.gpa}</span></span>
              </div>
            )}
            
            {(player.city || player.state) && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {[player.city, player.state].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
            
            {player.graduationYear && (
              <Badge variant="secondary" className="bg-white/10 text-white">
                Class of {player.graduationYear}
              </Badge>
            )}
            
            {player.school && (
              <span className="text-sm text-muted-foreground">{player.school}</span>
            )}
          </div>
        </Card>
      ) : null}

      {hasMatches && (
        <div className="flex flex-wrap items-center gap-2" data-testid="division-filters">
          {DIVISIONS.map((div) => (
            <Button
              key={div.value}
              variant={divisionFilter === div.value ? "default" : "outline"}
              size="sm"
              onClick={() => setDivisionFilter(div.value)}
              className={cn(
                divisionFilter === div.value 
                  ? "bg-cyan-500 hover:bg-cyan-400 text-white" 
                  : "border-cyan-500/20 hover:border-cyan-400/40 hover:bg-cyan-500/10"
              )}
              data-testid={`filter-division-${div.value}`}
            >
              {div.label}
            </Button>
          ))}
        </div>
      )}

      {matchesLoading ? (
        <div className="grid gap-4 md:gap-6 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4 md:p-5 bg-gradient-to-br from-[hsl(220,25%,10%)] to-[hsl(220,25%,6%)] border-cyan-500/10">
              <div className="flex gap-4">
                <Skeleton className="w-16 h-16 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="w-14 h-14 rounded-full" />
              </div>
              <Skeleton className="h-24 mt-4" />
            </Card>
          ))}
        </div>
      ) : hasMatches ? (
        <CollegeMatches playerId={playerId} divisionFilter={divisionFilter} />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/20 flex items-center justify-center mb-6">
            <GraduationCap className="w-12 h-12 text-cyan-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2" data-testid="text-empty-title">
            No College Matches Yet
          </h3>
          <p className="text-muted-foreground max-w-md mb-6" data-testid="text-empty-description">
            Click "Generate Matches" to discover colleges that fit your skills, academics, and playing style.
          </p>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/25"
            data-testid="button-generate-empty"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Matches...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Matches
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
