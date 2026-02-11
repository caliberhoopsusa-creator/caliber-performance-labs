import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TeamStatsCard } from "@/components/TeamStatsCard";
import { TeamRosterList } from "@/components/TeamRosterList";
import { ComparisonBarChart } from "@/components/ComparisonBarChart";
import { Users, Trophy } from "lucide-react";

interface TeamStats {
  teamName: string;
  playerCount: number;
  totalGames: number;
  avgPPG: number;
  avgRPG: number;
  avgAPG: number;
  totalPoints: number;
  totalRebounds: number;
  totalAssists: number;
  fgPct: number;
  threePct: number;
  avgGrade: string;
  avgGradeScore: number;
  players: Array<{
    id: number;
    name: string;
    position: string;
    jerseyNumber: number | null;
    gamesPlayed: number;
    ppg: number;
    rpg: number;
    apg: number;
    avgGrade: string;
  }>;
}

export default function TeamComparison() {
  const [team1, setTeam1] = useState<string>("");
  const [team2, setTeam2] = useState<string>("");

  const { data: teams, isLoading: teamsLoading } = useQuery<string[]>({
    queryKey: ['/api/teams/list'],
  });

  const { data: team1Stats, isLoading: team1Loading } = useQuery<TeamStats>({
    queryKey: ['/api/teams', encodeURIComponent(team1), 'stats'],
    enabled: !!team1
  });

  const { data: team2Stats, isLoading: team2Loading } = useQuery<TeamStats>({
    queryKey: ['/api/teams', encodeURIComponent(team2), 'stats'],
    enabled: !!team2
  });

  const isLoading = team1Loading || team2Loading;
  const hasComparison = team1Stats && team2Stats;

  const getBestPerformer = (stats: TeamStats | undefined, category: "ppg" | "rpg" | "apg") => {
    if (!stats?.players?.length) return null;
    return stats.players.reduce((best, player) => 
      player[category] > best[category] ? player : best
    , stats.players[0]);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h2 className="text-3xl md:text-4xl font-display font-bold text-white uppercase tracking-tight" data-testid="text-page-title">
          Team Comparison
        </h2>
        <p className="text-muted-foreground font-medium">Compare aggregate stats between two teams</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Team 1</label>
          <Select onValueChange={setTeam1} value={team1}>
            <SelectTrigger className="bg-card border-white/10 text-white h-14" data-testid="select-team-1">
              <SelectValue placeholder="Select first team..." />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10 text-white">
              {teamsLoading ? (
                <SelectItem value="loading" disabled>Loading teams...</SelectItem>
              ) : teams?.length ? (
                teams.map((t) => (
                  <SelectItem key={t} value={t} disabled={t === team2}>{t}</SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>No teams found</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Team 2</label>
          <Select onValueChange={setTeam2} value={team2}>
            <SelectTrigger className="bg-card border-white/10 text-white h-14" data-testid="select-team-2">
              <SelectValue placeholder="Select second team..." />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10 text-white">
              {teamsLoading ? (
                <SelectItem value="loading" disabled>Loading teams...</SelectItem>
              ) : teams?.length ? (
                teams.map((t) => (
                  <SelectItem key={t} value={t} disabled={t === team1}>{t}</SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>No teams found</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      )}

      {hasComparison && (
        <div className="space-y-8 animate-in zoom-in-95 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TeamStatsCard
              teamName={team1Stats.teamName}
              playerCount={team1Stats.playerCount}
              avgGrade={team1Stats.avgGrade}
              avgPPG={team1Stats.avgPPG}
              avgRPG={team1Stats.avgRPG}
              avgAPG={team1Stats.avgAPG}
              fgPct={team1Stats.fgPct}
              threePct={team1Stats.threePct}
              side="left"
            />
            <TeamStatsCard
              teamName={team2Stats.teamName}
              playerCount={team2Stats.playerCount}
              avgGrade={team2Stats.avgGrade}
              avgPPG={team2Stats.avgPPG}
              avgRPG={team2Stats.avgRPG}
              avgAPG={team2Stats.avgAPG}
              fgPct={team2Stats.fgPct}
              threePct={team2Stats.threePct}
              side="right"
            />
          </div>

          <ComparisonBarChart
            team1Name={team1Stats.teamName}
            team2Name={team2Stats.teamName}
            stats={[
              { label: "Avg PPG", team1Value: team1Stats.avgPPG, team2Value: team2Stats.avgPPG },
              { label: "Avg RPG", team1Value: team1Stats.avgRPG, team2Value: team2Stats.avgRPG },
              { label: "Avg APG", team1Value: team1Stats.avgAPG, team2Value: team2Stats.avgAPG },
              { label: "FG%", team1Value: team1Stats.fgPct, team2Value: team2Stats.fgPct, suffix: "%" },
              { label: "3PT%", team1Value: team1Stats.threePct, team2Value: team2Stats.threePct, suffix: "%" },
              { label: "Total Points", team1Value: team1Stats.totalPoints, team2Value: team2Stats.totalPoints },
            ]}
          />

          <div className="bg-card border border-white/5 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-bold font-display text-white mb-6 text-center uppercase tracking-widest flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5 text-accent" />
              Best Performers
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider text-center">
                  {team1Stats.teamName}
                </h4>
                <div className="space-y-3">
                  {["ppg", "rpg", "apg"].map((stat) => {
                    const best = getBestPerformer(team1Stats, stat as "ppg" | "rpg" | "apg");
                    if (!best) return null;
                    return (
                      <div key={stat} className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3" data-testid={`best-performer-team1-${stat}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold">
                            {best.jerseyNumber || "#"}
                          </div>
                          <span className="font-medium text-white">{best.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-display font-bold text-accent">
                            {best[stat as "ppg" | "rpg" | "apg"]}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1 uppercase">{stat}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider text-center">
                  {team2Stats.teamName}
                </h4>
                <div className="space-y-3">
                  {["ppg", "rpg", "apg"].map((stat) => {
                    const best = getBestPerformer(team2Stats, stat as "ppg" | "rpg" | "apg");
                    if (!best) return null;
                    return (
                      <div key={stat} className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3" data-testid={`best-performer-team2-${stat}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                            {best.jerseyNumber || "#"}
                          </div>
                          <span className="font-medium text-white">{best.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-display font-bold text-white">
                            {best[stat as "ppg" | "rpg" | "apg"]}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1 uppercase">{stat}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TeamRosterList 
              players={team1Stats.players} 
              teamName={team1Stats.teamName}
              compact={false}
            />
            <TeamRosterList 
              players={team2Stats.players} 
              teamName={team2Stats.teamName}
              compact={false}
            />
          </div>
        </div>
      )}

      {!team1 && !team2 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-16 h-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-display font-bold text-muted-foreground uppercase tracking-wider">
            Select Two Teams to Compare
          </h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            Choose teams from the dropdowns above to see head-to-head statistics, 
            player comparisons, and performance metrics.
          </p>
        </div>
      )}
    </div>
  );
}
