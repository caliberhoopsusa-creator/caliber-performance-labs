import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Calendar, Shield, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { TeamHistory as TeamHistoryType } from "@shared/schema";

interface TeamHistoryProps {
  playerId: number;
}

const roleLabels: Record<string, string> = {
  starter: "Starter",
  rotation: "Rotation",
  bench: "Bench",
  development: "Development",
};

const roleColors: Record<string, string> = {
  starter: "bg-green-500/20 text-green-400 border-green-500/30",
  rotation: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  bench: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  development: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export function TeamHistorySection({ playerId }: TeamHistoryProps) {
  const { data: history, isLoading } = useQuery<TeamHistoryType[]>({
    queryKey: ['/api/players', playerId, 'team-history'],
  });

  if (isLoading) {
    return (
      <div className="space-y-3" data-testid="team-history-loading">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card className="p-6 text-center" data-testid="team-history-empty">
        <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">No team history recorded yet.</p>
      </Card>
    );
  }

  const sorted = [...history].sort((a, b) => {
    if (a.isCurrent && !b.isCurrent) return -1;
    if (!a.isCurrent && b.isCurrent) return 1;
    const dateA = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
    const dateB = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
    return dateB - dateA;
  });

  return (
    <div className="space-y-4" data-testid="team-history">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-5 h-5 text-accent" />
        <h3 className="font-display font-bold text-lg uppercase tracking-wide">Team History</h3>
        <Badge variant="secondary" className="ml-auto" data-testid="text-teams-count">
          {history.length} Team{history.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      <div className="space-y-3">
        {sorted.map((entry) => {
          const joinDate = entry.joinedAt ? format(new Date(entry.joinedAt), "MMM yyyy") : null;
          const leftDate = entry.leftAt ? format(new Date(entry.leftAt), "MMM yyyy") : null;
          const role = entry.role || "rotation";

          return (
            <Card
              key={entry.id}
              className={cn("p-4", entry.isCurrent && "border-accent/30")}
              data-testid={`team-history-entry-${entry.id}`}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    entry.isCurrent ? "bg-accent/20" : "bg-muted"
                  )}>
                    <Users className={cn("w-5 h-5", entry.isCurrent ? "text-accent" : "text-muted-foreground")} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm" data-testid={`text-team-name-${entry.id}`}>{entry.teamName}</span>
                      {entry.isCurrent && (
                        <Badge variant="default" className="text-[10px]" data-testid={`badge-current-team-${entry.id}`}>Current</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      {entry.season && (
                        <span data-testid={`text-season-${entry.id}`}>{entry.season}</span>
                      )}
                      {joinDate && (
                        <span className="flex items-center gap-1" data-testid={`text-dates-${entry.id}`}>
                          <Calendar className="w-3 h-3" />
                          {joinDate}
                          {leftDate ? (
                            <>
                              <ArrowRight className="w-3 h-3" />
                              {leftDate}
                            </>
                          ) : (
                            <span> — Present</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn("text-[10px] capitalize", roleColors[role])}
                  data-testid={`badge-role-${entry.id}`}
                >
                  {roleLabels[role] || role}
                </Badge>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
