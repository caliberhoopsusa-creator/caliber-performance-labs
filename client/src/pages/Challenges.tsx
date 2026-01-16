import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Clock, Crown, Flame, Target, Calendar, CheckCircle2 } from "lucide-react";
import type { Challenge, Player } from "@shared/schema";
import { ChallengeCard } from "@/components/ChallengesPanel";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
      return <Flame className="w-6 h-6 text-orange-400" />;
    case 'points_total':
      return <Target className="w-6 h-6 text-green-400" />;
    case 'grade_count':
      return <Crown className="w-6 h-6 text-yellow-400" />;
    default:
      return <Trophy className="w-6 h-6 text-primary" />;
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

interface ChallengeWithLeaderboard {
  challenge: Challenge;
  leaderboard: { playerId: number; playerName: string; currentValue: number; completed: boolean }[];
}

export default function Challenges() {
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("active");

  const { data: activeChallenges, isLoading: loadingActive } = useQuery<Challenge[]>({
    queryKey: ['/api/challenges'],
  });

  const { data: allChallenges, isLoading: loadingAll } = useQuery<Challenge[]>({
    queryKey: ['/api/challenges/all'],
  });

  const { data: players } = useQuery<Player[]>({
    queryKey: ['/api/players'],
  });

  const { data: playerProgress } = useQuery<any[]>({
    queryKey: ['/api/players', selectedPlayerId, 'challenges'],
    enabled: !!selectedPlayerId,
  });

  const isLoading = loadingActive || loadingAll;

  const getPlayerProgressForChallenge = (challengeId: number) => {
    if (!playerProgress) return null;
    return playerProgress.find((p: any) => p.challengeId === challengeId);
  };

  const now = new Date();
  const pastChallenges = allChallenges?.filter(c => new Date(c.endDate) < now) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display flex items-center gap-3">
            <Trophy className="w-8 h-8 text-primary" />
            Challenges
          </h1>
          <p className="text-muted-foreground mt-1">
            Compete in weekly and monthly challenges to earn exclusive badges
          </p>
        </div>
        
        <Select
          value={selectedPlayerId?.toString() || ""}
          onValueChange={(val) => setSelectedPlayerId(val ? Number(val) : null)}
        >
          <SelectTrigger className="w-[200px]" data-testid="select-player-challenges">
            <SelectValue placeholder="Track your progress" />
          </SelectTrigger>
          <SelectContent>
            {players?.map((player) => (
              <SelectItem key={player.id} value={player.id.toString()}>
                {player.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" data-testid="tab-active-challenges">
            <Flame className="w-4 h-4 mr-2" />
            Active ({activeChallenges?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="past" data-testid="tab-past-challenges">
            <Calendar className="w-4 h-4 mr-2" />
            Past ({pastChallenges.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-6 bg-muted rounded w-1/2 mb-4" />
                    <div className="h-4 bg-muted rounded w-3/4 mb-4" />
                    <div className="h-2 bg-muted rounded w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !activeChallenges || activeChallenges.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-12 text-center">
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Challenges</h3>
                <p className="text-muted-foreground">Check back soon for new challenges!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnimatePresence>
                {activeChallenges.map((challenge, index) => {
                  const progress = getPlayerProgressForChallenge(challenge.id);
                  const progressPercent = progress
                    ? Math.min(100, (progress.currentValue / challenge.targetValue) * 100)
                    : 0;
                  const isCompleted = progress?.completed;

                  return (
                    <motion.div
                      key={challenge.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card
                        className={`bg-card border-border overflow-hidden transition-all ${
                          isCompleted ? 'ring-2 ring-primary' : ''
                        }`}
                        data-testid={`challenge-detail-${challenge.id}`}
                      >
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
                        <CardContent className="pt-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Target: </span>
                              <span className="font-semibold">{challenge.targetValue}</span>
                            </div>
                            <div className="text-sm flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              {getTimeRemaining(challenge.endDate)}
                            </div>
                          </div>

                          {selectedPlayerId && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Your Progress</span>
                                {isCompleted ? (
                                  <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="text-primary font-bold flex items-center gap-1"
                                  >
                                    <CheckCircle2 className="w-4 h-4" /> Completed!
                                  </motion.span>
                                ) : (
                                  <span className="font-semibold">
                                    {progress?.currentValue || 0} / {challenge.targetValue}
                                  </span>
                                )}
                              </div>
                              <Progress value={progressPercent} className="h-3" />
                              {isCompleted && challenge.badgeReward && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="bg-primary/10 border border-primary/30 rounded-lg p-3 flex items-center gap-2"
                                >
                                  <Trophy className="w-5 h-5 text-primary" />
                                  <span className="text-sm">
                                    Badge earned: <strong>{challenge.badgeReward.replace(/_/g, ' ')}</strong>
                                  </span>
                                </motion.div>
                              )}
                            </div>
                          )}

                          <ChallengeLeaderboard challengeId={challenge.id} />
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-6">
          {pastChallenges.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-12 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Past Challenges</h3>
                <p className="text-muted-foreground">Completed challenges will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pastChallenges.map((challenge) => (
                <Card key={challenge.id} className="bg-card border-border opacity-75">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        {getChallengeIcon(challenge.targetType)}
                        <div>
                          <CardTitle className="text-lg">{challenge.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">{challenge.description}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">Ended</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ChallengeLeaderboard challengeId={challenge.id} showAll />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ChallengeLeaderboard({ challengeId, showAll = false }: { challengeId: number; showAll?: boolean }) {
  const { data, isLoading } = useQuery<ChallengeWithLeaderboard>({
    queryKey: ['/api/challenges', challengeId],
  });

  if (isLoading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 bg-muted rounded" />
        ))}
      </div>
    );
  }

  const leaderboard = data?.leaderboard || [];
  const displayLeaderboard = showAll ? leaderboard : leaderboard.slice(0, 3);

  if (leaderboard.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-2">No participants yet</p>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold flex items-center gap-2">
        <Crown className="w-4 h-4 text-yellow-500" />
        Top Players
      </h4>
      <div className="space-y-2">
        {displayLeaderboard.map((entry, index) => (
          <div
            key={entry.playerId}
            className={`flex items-center justify-between p-2 rounded-lg ${
              index === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' :
              index === 1 ? 'bg-gray-400/10' :
              index === 2 ? 'bg-amber-600/10' : 'bg-muted/30'
            }`}
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
    </div>
  );
}
