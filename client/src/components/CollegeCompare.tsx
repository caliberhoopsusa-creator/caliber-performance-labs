import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useSport } from "@/components/SportToggle";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Trophy,
  GraduationCap,
  DollarSign,
  Users,
  Target,
  X,
  Plus,
  Medal,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface College {
  id: number;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
  city: string;
  state: string;
  division: string;
  conference: string | null;
  sport: string;
  winsLastSeason: number | null;
  lossesLastSeason: number | null;
  nationalChampionships: number | null;
  nbaPlayersProduced: number | null;
  nflPlayersProduced: number | null;
  draftPicksLast5Years: number | null;
  niLOpportunities: string | null;
  athleteGraduationRate: number | null;
}

interface CollegeMatch {
  id: number;
  collegeId: number;
  overallMatchScore: number;
  college: College;
}

interface CollegeCompareProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DIVISION_COLORS: Record<string, string> = {
  'D1': 'bg-gradient-to-r from-accent to-accent/90 text-accent-foreground',
  'D2': 'bg-accent text-white',
  'D3': 'bg-gradient-to-r from-emerald-500 to-green-500 text-white',
  'NAIA': 'bg-gradient-to-r from-purple-500 to-violet-500 text-white',
  'JUCO': 'bg-gradient-to-r from-rose-500 to-pink-500 text-white',
};

const LOGO_COLORS = [
  'bg-gradient-to-br from-accent to-blue-600',
  'bg-gradient-to-br from-accent to-accent/80',
  'bg-gradient-to-br from-emerald-500 to-teal-600',
  'bg-gradient-to-br from-purple-500 to-indigo-600',
  'bg-gradient-to-br from-rose-500 to-pink-600',
  'bg-gradient-to-br from-sky-500 to-accent',
];

const NIL_LEVELS: Record<string, { label: string; color: string }> = {
  'elite': { label: 'Elite', color: 'text-amber-400' },
  'high': { label: 'High', color: 'text-emerald-400' },
  'moderate': { label: 'Moderate', color: 'text-accent' },
  'low': { label: 'Low', color: 'text-muted-foreground' },
  'developing': { label: 'Developing', color: 'text-muted-foreground' },
};

function ComparisonStat({ 
  label, 
  values, 
  icon: Icon,
  format = 'number',
}: { 
  label: string; 
  values: (string | number | null | undefined)[];
  icon: React.ComponentType<{ className?: string }>;
  format?: 'number' | 'percentage' | 'record' | 'nil';
}) {
  const formatValue = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return '—';
    if (format === 'percentage') return `${value}%`;
    if (format === 'nil') {
      const nilInfo = NIL_LEVELS[String(value).toLowerCase()];
      return nilInfo ? (
        <span className={nilInfo.color}>{nilInfo.label}</span>
      ) : (
        String(value)
      );
    }
    return String(value);
  };

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `1fr repeat(${values.length}, 1fr)` }}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="w-4 h-4 text-accent" />
        <span className="text-sm">{label}</span>
      </div>
      {values.map((value, i) => (
        <div key={i} className="text-center font-semibold text-white">
          {formatValue(value)}
        </div>
      ))}
    </div>
  );
}

function CollegeCard({ 
  college, 
  matchScore,
  onRemove,
  slot,
}: { 
  college: College | null;
  matchScore?: number;
  onRemove: () => void;
  slot: number;
}) {
  if (!college) {
    return (
      <Card className={cn(
        "relative overflow-hidden flex flex-col items-center justify-center min-h-[200px]",
        "bg-gradient-to-br from-[hsl(220,25%,10%)] via-[hsl(220,20%,8%)] to-[hsl(220,25%,6%)]",
        "border-dashed border-accent/20"
      )}>
        <Plus className="w-8 h-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Select a school</p>
      </Card>
    );
  }

  const colorIndex = college.id % LOGO_COLORS.length;

  return (
    <Card className={cn(
      "relative overflow-hidden",
      "bg-gradient-to-br from-[hsl(220,25%,10%)] via-[hsl(220,20%,8%)] to-[hsl(220,25%,6%)]",
      "border-border",
      "shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
    )}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white/10 hover:bg-white/20"
        onClick={onRemove}
        data-testid={`button-remove-college-${slot}`}
      >
        <X className="w-3 h-3" />
      </Button>

      <div className="p-4 flex flex-col items-center text-center">
        <div className={cn(
          "w-16 h-16 rounded-xl flex items-center justify-center mb-3",
          "shadow-lg shadow-black/30",
          LOGO_COLORS[colorIndex]
        )}>
          <span className="text-2xl font-bold text-white font-display">
            {(college.shortName || college.name)[0]}
          </span>
        </div>

        <h3 className="font-display text-lg font-bold text-white">
          {college.shortName || college.name}
        </h3>
        <p className="text-xs text-muted-foreground mb-2">{college.city}, {college.state}</p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Badge className={cn("text-[10px] font-bold", DIVISION_COLORS[college.division] || 'bg-gray-500')}>
            {college.division}
          </Badge>
          {college.conference && (
            <Badge variant="outline" className="text-[10px] border-accent/30 text-accent">
              {college.conference}
            </Badge>
          )}
        </div>

        {matchScore !== undefined && (
          <div className="mt-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-accent" />
            <span className="text-sm font-semibold text-white">{matchScore}% Match</span>
          </div>
        )}
      </div>
    </Card>
  );
}

export function CollegeCompare({ open, onOpenChange }: CollegeCompareProps) {
  const { user } = useAuth();
  const playerId = (user as any)?.playerId;
  const currentSport = useSport();
  const [selectedCollegeIds, setSelectedCollegeIds] = useState<(number | null)[]>([null, null]);

  const { data: colleges } = useQuery<College[]>({
    queryKey: ['/api/colleges', { sport: currentSport }],
    enabled: open,
  });

  const { data: matches } = useQuery<CollegeMatch[]>({
    queryKey: ['/api/players', playerId, 'college-matches'],
    enabled: !!playerId && open,
  });

  const matchScoreMap = new Map<number, number>();
  if (matches) {
    matches.forEach(m => matchScoreMap.set(m.collegeId, m.overallMatchScore));
  }

  const filteredColleges = colleges?.filter(c => c.sport === currentSport) || [];

  const selectedColleges = selectedCollegeIds.map(id => 
    id ? filteredColleges.find(c => c.id === id) || null : null
  );

  const handleSelectCollege = (slot: number, collegeId: string) => {
    const newIds = [...selectedCollegeIds];
    newIds[slot] = parseInt(collegeId);
    setSelectedCollegeIds(newIds);
  };

  const handleRemoveCollege = (slot: number) => {
    const newIds = [...selectedCollegeIds];
    newIds[slot] = null;
    setSelectedCollegeIds(newIds);
  };

  const handleAddSlot = () => {
    if (selectedCollegeIds.length < 3) {
      setSelectedCollegeIds([...selectedCollegeIds, null]);
    }
  };

  const handleRemoveSlot = (slot: number) => {
    if (selectedCollegeIds.length > 2) {
      const newIds = selectedCollegeIds.filter((_, i) => i !== slot);
      setSelectedCollegeIds(newIds);
    } else {
      handleRemoveCollege(slot);
    }
  };

  const availableColleges = (slot: number) => {
    const selectedIds = selectedCollegeIds.filter((id, i) => i !== slot && id !== null);
    return filteredColleges.filter(c => !selectedIds.includes(c.id));
  };

  const hasSelectedColleges = selectedColleges.some(c => c !== null);

  const getProDraftPicks = (college: College) => {
    if (college.draftPicksLast5Years) return college.draftPicksLast5Years;
    if (college.sport === 'basketball' && college.nbaPlayersProduced) return college.nbaPlayersProduced;
    if (college.sport === 'football' && college.nflPlayersProduced) return college.nflPlayersProduced;
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-w-4xl max-h-[90vh] overflow-y-auto",
        "bg-gradient-to-br from-[hsl(220,25%,10%)] via-[hsl(220,20%,8%)] to-[hsl(220,25%,6%)]",
        "border-accent/20"
      )}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
        
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-display text-white">
            <Trophy className="w-5 h-5 text-accent" />
            Compare Schools
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Select 2-3 schools to compare side by side
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className={cn(
            "grid gap-4",
            selectedCollegeIds.length === 2 ? "grid-cols-2" : "grid-cols-3"
          )}>
            {selectedCollegeIds.map((id, slot) => (
              <div key={slot} className="space-y-2">
                <Select
                  value={id?.toString() || ""}
                  onValueChange={(value) => handleSelectCollege(slot, value)}
                >
                  <SelectTrigger 
                    className="bg-white/5 border-accent/20"
                    data-testid={`select-college-${slot}`}
                  >
                    <SelectValue placeholder="Select a school..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[hsl(220,25%,10%)] border-accent/20 max-h-[300px]">
                    {availableColleges(slot).map(college => (
                      <SelectItem 
                        key={college.id} 
                        value={college.id.toString()}
                        className="focus:bg-accent/20"
                      >
                        <div className="flex items-center gap-2">
                          <span>{college.shortName || college.name}</span>
                          <Badge className={cn("text-[8px] ml-1", DIVISION_COLORS[college.division] || 'bg-gray-500')}>
                            {college.division}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <CollegeCard
                  college={selectedColleges[slot] || null}
                  matchScore={id ? matchScoreMap.get(id) : undefined}
                  onRemove={() => handleRemoveSlot(slot)}
                  slot={slot}
                />
              </div>
            ))}

            {selectedCollegeIds.length < 3 && (
              <Button
                variant="outline"
                className="h-full min-h-[200px] border-dashed border-accent/20 hover:border-accent/40 hover:bg-accent/5"
                onClick={handleAddSlot}
                data-testid="button-add-college-slot"
              >
                <Plus className="w-6 h-6 mr-2" />
                Add School
              </Button>
            )}
          </div>

          {hasSelectedColleges && (
            <Card className={cn(
              "p-5 relative overflow-hidden",
              "bg-gradient-to-br from-[hsl(220,25%,10%)] via-[hsl(220,20%,8%)] to-[hsl(220,25%,6%)]",
              "border-border"
            )}>
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
              
              <h4 className="font-display text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                Comparison
              </h4>

              <div className="space-y-4">
                <ComparisonStat
                  label="Division"
                  values={selectedColleges.map(c => c?.division)}
                  icon={Medal}
                />
                
                <div className="h-px bg-accent/10" />
                
                <ComparisonStat
                  label="Win/Loss Record"
                  values={selectedColleges.map(c => 
                    c && c.winsLastSeason !== null && c.lossesLastSeason !== null
                      ? `${c.winsLastSeason}-${c.lossesLastSeason}`
                      : null
                  )}
                  icon={Trophy}
                />
                
                <div className="h-px bg-accent/10" />
                
                <ComparisonStat
                  label="National Championships"
                  values={selectedColleges.map(c => c?.nationalChampionships)}
                  icon={Trophy}
                />
                
                <div className="h-px bg-accent/10" />
                
                <ComparisonStat
                  label="Pro Draft Picks"
                  values={selectedColleges.map(c => c ? getProDraftPicks(c) : null)}
                  icon={Users}
                />
                
                <div className="h-px bg-accent/10" />
                
                <ComparisonStat
                  label="NIL Opportunities"
                  values={selectedColleges.map(c => c?.niLOpportunities)}
                  icon={DollarSign}
                  format="nil"
                />
                
                <div className="h-px bg-accent/10" />
                
                <ComparisonStat
                  label="Graduation Rate"
                  values={selectedColleges.map(c => c?.athleteGraduationRate)}
                  icon={GraduationCap}
                  format="percentage"
                />
                
                <div className="h-px bg-accent/10" />
                
                <ComparisonStat
                  label="Match Score"
                  values={selectedCollegeIds.map(id => id ? matchScoreMap.get(id) : null)}
                  icon={Target}
                  format="percentage"
                />
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
