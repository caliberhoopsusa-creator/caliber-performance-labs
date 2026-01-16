import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock, Crown, Flame, Target } from "lucide-react";
import type { Challenge } from "@shared/schema";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

interface ChallengeWithLeaderboard {
  challenge: Challenge;
  leaderboard: { playerId: number; playerName: string; currentValue: number; completed: boolean }[];
}

function getTimeRemaining(endDate: string): string {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  
  if (diff <= 0) return "Ended";
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days}d ${hours}h left`;
  return `${hours}h left`;
}

function getChallengeIcon(targetType: string) {
  switch (targetType) {
    case 'hustle_avg':
      return <Flame className="w-5 h-5 text-orange-400" />;
    case 'points_total':
      return <Target className="w-5 h-5 text-green-400" />;
    case 'grade_count':
      return <Crown className="w-5 h-5 text-yellow-400" />;
    default:
      return <Trophy className="w-5 h-5 text-primary" />;
  }
}

function getChallengeTypeBadge(type: string) {
  const colors: Record<string, string> = {
    weekly: "bg-blue-500/20 text-blue-400",
    monthly: "bg-purple-500/20 text-purple-400",
    seasonal: "bg-amber-500/20 text-amber-400",
  };
  return colors[type] || "bg-muted text-muted-foreground";
}

export function ChallengesPanel({ playerId }: { playerId?: number }) {
  const { data: challenges, isLoading } = useQuery<Challenge[]>({
    queryKey: ['/api/challenges'],
  });

  const { data: playerProgress } = useQuery<any[]>({
    queryKey: ['/api/players', playerId, 'challenges'],
    enabled: !!playerId,
  });

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Active Challenges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-2 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!challenges || challenges.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Active Challenges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No active challenges right now.</p>
        </CardContent>
      </Card>
    );
  }

  const getPlayerProgressForChallenge = (challengeId: number) => {
    if (!playerProgress) return null;
    return playerProgress.find((p: any) => p.challengeId === challengeId);
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Active Challenges
        </CardTitle>
        <Link href="/challenges" className="text-xs text-primary hover:underline" data-testid="link-view-all-challenges">
          View All
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence>
          {challenges.slice(0, 3).map((challenge) => {
            const progress = getPlayerProgressForChallenge(challenge.id);
            const progressPercent = progress 
              ? Math.min(100, (progress.currentValue / challenge.targetValue) * 100)
              : 0;
            const isCompleted = progress?.completed;

            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-3 rounded-lg border ${isCompleted ? 'bg-primary/10 border-primary/30' : 'bg-muted/30 border-border/50'}`}
                data-testid={`challenge-card-${challenge.id}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {getChallengeIcon(challenge.targetType)}
                    <div>
                      <h4 className="font-semibold text-sm">{challenge.title}</h4>
                      <p className="text-xs text-muted-foreground">{challenge.description}</p>
                    </div>
                  </div>
                  <Badge className={`text-[10px] ${getChallengeTypeBadge(challenge.challengeType)}`}>
                    {challenge.challengeType}
                  </Badge>
                </div>

                {playerId && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">
                        {progress?.currentValue || 0} / {challenge.targetValue}
                      </span>
                      {isCompleted ? (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-primary font-bold flex items-center gap-1"
                        >
                          <Trophy className="w-3 h-3" /> Completed!
                        </motion.span>
                      ) : (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getTimeRemaining(challenge.endDate)}
                        </span>
                      )}
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                  </div>
                )}

                {!playerId && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      Target: {challenge.targetValue}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {getTimeRemaining(challenge.endDate)}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export function ChallengeCard({ challengeId }: { challengeId: number }) {
  const { data, isLoading } = useQuery<ChallengeWithLeaderboard>({
    queryKey: ['/api/challenges', challengeId],
  });

  if (isLoading || !data) {
    return (
      <Card className="bg-card border-border animate-pulse">
        <CardContent className="p-4">
          <div className="h-6 bg-muted rounded w-1/2 mb-2" />
          <div className="h-4 bg-muted rounded w-3/4" />
        </CardContent>
      </Card>
    );
  }

  const { challenge, leaderboard } = data;

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            {getChallengeIcon(challenge.targetType)}
            <div>
              <CardTitle className="text-lg">{challenge.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{challenge.description}</p>
            </div>
          </div>
          <Badge className={getChallengeTypeBadge(challenge.challengeType)}>
            {challenge.challengeType}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Target: </span>
            <span className="font-semibold">{challenge.targetValue}</span>
          </div>
          <div className="text-sm flex items-center gap-1 text-muted-foreground">
            <Clock className="w-4 h-4" />
            {getTimeRemaining(challenge.endDate)}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-500" />
            Leaderboard
          </h4>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-muted-foreground">No participants yet</p>
          ) : (
            <div className="space-y-2">
              {leaderboard.slice(0, 5).map((entry, index) => (
                <div
                  key={entry.playerId}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    index === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' :
                    index === 1 ? 'bg-gray-400/10' :
                    index === 2 ? 'bg-amber-600/10' : 'bg-muted/30'
                  }`}
                  data-testid={`leaderboard-entry-${entry.playerId}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm w-6 ${
                      index === 0 ? 'text-yellow-500' :
                      index === 1 ? 'text-gray-400' :
                      index === 2 ? 'text-amber-600' : 'text-muted-foreground'
                    }`}>
                      #{index + 1}
                    </span>
                    <span className="font-medium text-sm">{entry.playerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{entry.currentValue}</span>
                    {entry.completed && (
                      <Trophy className="w-4 h-4 text-primary" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
