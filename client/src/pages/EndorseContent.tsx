import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { CoachRecommendations } from "@/components/CoachRecommendations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  User,
  Star,
  ChevronRight,
  PenLine,
  GraduationCap,
  Filter,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Player {
  id: number;
  name: string;
  position: string | null;
  sport: string;
  team: string | null;
  avatarUrl: string | null;
  graduationYear: number | null;
}

interface RecommendationSummary {
  playerId: number;
  count: number;
  avgRating: number;
  hasMyRecommendation: boolean;
}

export default function EndorseContent() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);

  const { data: players, isLoading: playersLoading } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const { data: myRecommendations, isLoading: recsLoading } = useQuery<any[]>({
    queryKey: ["/api/coach/recommendations"],
    enabled: !!user,
  });

  const recommendationsByPlayer = new Map<number, RecommendationSummary>();
  if (myRecommendations) {
    myRecommendations.forEach((rec) => {
      const existing = recommendationsByPlayer.get(rec.playerId);
      if (existing) {
        existing.count++;
        existing.avgRating = (existing.avgRating + rec.overallRating) / 2;
        if (rec.coachId === (user as any)?.id) {
          existing.hasMyRecommendation = true;
        }
      } else {
        recommendationsByPlayer.set(rec.playerId, {
          playerId: rec.playerId,
          count: 1,
          avgRating: rec.overallRating,
          hasMyRecommendation: rec.coachId === (user as any)?.id,
        });
      }
    });
  }

  const filteredPlayers = players?.filter((player) => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSport = sportFilter === "all" || player.sport === sportFilter;
    return matchesSearch && matchesSport;
  }) || [];

  const playersWithMyRecs = filteredPlayers.filter(
    (p) => recommendationsByPlayer.get(p.id)?.hasMyRecommendation
  );
  const playersWithoutMyRecs = filteredPlayers.filter(
    (p) => !recommendationsByPlayer.get(p.id)?.hasMyRecommendation
  );

  if (selectedPlayerId) {
    const selectedPlayer = players?.find((p) => p.id === selectedPlayerId);
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setSelectedPlayerId(null)}
          className="text-muted-foreground hover:text-white"
          data-testid="button-back-to-list"
        >
          <X className="w-4 h-4 mr-2" />
          Back to Players
        </Button>

        <Card className="bg-gradient-to-br from-[hsl(220,25%,10%)] via-[hsl(220,20%,8%)] to-[hsl(220,25%,6%)] border-cyan-500/10">
          <CardHeader className="border-b border-cyan-500/10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-cyan-500/30">
                {selectedPlayer?.avatarUrl ? (
                  <img
                    src={selectedPlayer.avatarUrl}
                    alt={selectedPlayer.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-cyan-400" />
                )}
              </div>
              <div>
                <CardTitle className="text-2xl text-white font-display">
                  {selectedPlayer?.name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                    {selectedPlayer?.sport}
                  </Badge>
                  {selectedPlayer?.position && (
                    <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                      {selectedPlayer.position}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <CoachRecommendations
              playerId={selectedPlayerId}
              isCoachViewing={true}
              showWriteForm={true}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <PenLine className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-white font-medium mb-1">Help players stand out to recruiters</p>
              <p className="text-muted-foreground">
                Your endorsements appear on players' public profiles. Rate their athletic ability, 
                work ethic, coachability, leadership, and character to give recruiters a complete picture.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search players by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[hsl(220,20%,8%)] border-cyan-500/20 focus:border-cyan-500/50"
            data-testid="input-search-players"
          />
        </div>
        <Select value={sportFilter} onValueChange={setSportFilter}>
          <SelectTrigger className="w-full sm:w-40 bg-[hsl(220,20%,8%)] border-cyan-500/20" data-testid="select-sport-filter">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Sport" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sports</SelectItem>
            <SelectItem value="basketball">Basketball</SelectItem>
            <SelectItem value="football">Football</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {playersLoading || recsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="bg-[hsl(220,20%,8%)] border-cyan-500/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {playersWithMyRecs.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                Players You've Endorsed ({playersWithMyRecs.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {playersWithMyRecs.map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    summary={recommendationsByPlayer.get(player.id)}
                    onSelect={() => setSelectedPlayerId(player.id)}
                    hasEndorsement={true}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              Available Players ({playersWithoutMyRecs.length})
            </h2>
            {playersWithoutMyRecs.length === 0 ? (
              <Card className="bg-[hsl(220,20%,8%)] border-cyan-500/10">
                <CardContent className="py-12 text-center">
                  <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery || sportFilter !== "all"
                      ? "No players match your search criteria"
                      : "No players available to endorse"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {playersWithoutMyRecs.map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    summary={recommendationsByPlayer.get(player.id)}
                    onSelect={() => setSelectedPlayerId(player.id)}
                    hasEndorsement={false}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

interface PlayerCardProps {
  player: Player;
  summary?: RecommendationSummary;
  onSelect: () => void;
  hasEndorsement: boolean;
}

function PlayerCard({ player, summary, onSelect, hasEndorsement }: PlayerCardProps) {
  return (
    <Card
      className={cn(
        "transition-all duration-300 cursor-pointer hover-elevate group",
        "bg-gradient-to-br from-[hsl(220,25%,10%)] via-[hsl(220,20%,8%)] to-[hsl(220,25%,6%)]",
        hasEndorsement ? "border-amber-500/30" : "border-cyan-500/10"
      )}
      onClick={onSelect}
      data-testid={`player-card-${player.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center border",
              hasEndorsement
                ? "bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/30"
                : "bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-cyan-500/30"
            )}
          >
            {player.avatarUrl ? (
              <img
                src={player.avatarUrl}
                alt={player.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className={cn("w-6 h-6", hasEndorsement ? "text-amber-400" : "text-cyan-400")} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">{player.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="capitalize">{player.sport}</span>
              {player.position && (
                <>
                  <span className="text-cyan-500/50">•</span>
                  <span className="truncate">{player.position}</span>
                </>
              )}
            </div>
            {player.graduationYear && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <GraduationCap className="w-3 h-3" />
                Class of {player.graduationYear}
              </div>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-cyan-400 transition-colors" />
        </div>

        {hasEndorsement && (
          <div className="mt-3 pt-3 border-t border-amber-500/20 flex items-center gap-2">
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
              <Star className="w-3 h-3 mr-1 fill-current" />
              Endorsed
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto text-xs text-muted-foreground hover:text-amber-400"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              data-testid={`button-edit-endorsement-${player.id}`}
            >
              Edit
            </Button>
          </div>
        )}

        {!hasEndorsement && (
          <div className="mt-3 pt-3 border-t border-cyan-500/10">
            <Button
              size="sm"
              variant="outline"
              className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              data-testid={`button-write-endorsement-${player.id}`}
            >
              <PenLine className="w-4 h-4 mr-2" />
              Write Endorsement
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
