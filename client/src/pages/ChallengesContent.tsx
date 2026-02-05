import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { SkeletonChallengeCard } from "@/components/ui/skeleton-premium";
import { Trophy, Clock, Crown, Flame, Target, Calendar, CheckCircle2, Plus } from "lucide-react";
import type { Challenge, Player } from "@shared/schema";
import { ChallengeCard } from "@/components/ChallengesPanel";
import { Paywall } from "@/components/Paywall";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, addMonths } from "date-fns";

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

const TARGET_TYPES = [
  { value: 'hustle_avg', label: 'Hustle Average', description: 'Average hustle score across games' },
  { value: 'points_total', label: 'Total Points', description: 'Total points scored' },
  { value: 'games_played', label: 'Games Played', description: 'Number of games played' },
  { value: 'grade_count', label: 'Grade Count', description: 'Games with B+ or better' },
];

const CHALLENGE_TYPES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'seasonal', label: 'Seasonal' },
];

export default function ChallengesContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    challengeType: 'weekly',
    targetType: 'points_total',
    targetValue: 100,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    badgeReward: '',
  });

  const isCoach = user?.role === 'coach';

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

  const createChallengeMutation = useMutation({
    mutationFn: (data: typeof newChallenge) => 
      apiRequest('POST', '/api/challenges', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/challenges'] });
      queryClient.invalidateQueries({ queryKey: ['/api/challenges/all'] });
      toast({ title: 'Challenge Created!', description: 'Your new challenge is now active.' });
      setIsCreateDialogOpen(false);
      setNewChallenge({
        title: '',
        description: '',
        challengeType: 'weekly',
        targetType: 'points_total',
        targetValue: 100,
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
        badgeReward: '',
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to create challenge', 
        variant: 'destructive' 
      });
    },
  });

  const handleCreateChallenge = () => {
    if (!newChallenge.title.trim()) {
      toast({ title: 'Error', description: 'Please enter a challenge title', variant: 'destructive' });
      return;
    }
    if (!newChallenge.description.trim()) {
      toast({ title: 'Error', description: 'Please enter a description', variant: 'destructive' });
      return;
    }
    if (newChallenge.targetValue < 1) {
      toast({ title: 'Error', description: 'Target value must be at least 1', variant: 'destructive' });
      return;
    }
    const start = new Date(newChallenge.startDate);
    const end = new Date(newChallenge.endDate);
    if (end <= start) {
      toast({ title: 'Error', description: 'End date must be after start date', variant: 'destructive' });
      return;
    }
    createChallengeMutation.mutate(newChallenge);
  };

  const handleChallengeTypeChange = (type: string) => {
    let endDate = new Date();
    if (type === 'weekly') {
      endDate = addDays(new Date(), 7);
    } else if (type === 'monthly') {
      endDate = addMonths(new Date(), 1);
    } else if (type === 'seasonal') {
      endDate = addMonths(new Date(), 3);
    }
    setNewChallenge(prev => ({
      ...prev,
      challengeType: type,
      endDate: format(endDate, 'yyyy-MM-dd'),
    }));
  };

  const isLoading = loadingActive || loadingAll;

  const getPlayerProgressForChallenge = (challengeId: number) => {
    if (!playerProgress) return null;
    return playerProgress.find((p: any) => p.challengeId === challengeId);
  };

  const now = new Date();
  const pastChallenges = allChallenges?.filter(c => new Date(c.endDate) < now) || [];

  return (
    <Paywall requiredTier="pro" featureName="Challenges">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-display flex items-center gap-3">
              <Trophy className="w-7 h-7 text-primary" />
              Challenges
            </h2>
            <p className="text-muted-foreground mt-1">
              Compete in weekly and monthly challenges to earn exclusive badges
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {isCoach && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-challenge">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Challenge
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-primary" />
                      Create New Challenge
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Challenge Title</Label>
                      <Input 
                        id="title"
                        placeholder="e.g., Weekly Scoring Champion"
                        value={newChallenge.title}
                        onChange={(e) => setNewChallenge(prev => ({ ...prev, title: e.target.value }))}
                        data-testid="input-challenge-title"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea 
                        id="description"
                        placeholder="Describe the challenge..."
                        value={newChallenge.description}
                        onChange={(e) => setNewChallenge(prev => ({ ...prev, description: e.target.value }))}
                        data-testid="input-challenge-description"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Challenge Type</Label>
                        <Select
                          value={newChallenge.challengeType}
                          onValueChange={handleChallengeTypeChange}
                        >
                          <SelectTrigger data-testid="select-challenge-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CHALLENGE_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Target Type</Label>
                        <Select
                          value={newChallenge.targetType}
                          onValueChange={(val) => setNewChallenge(prev => ({ ...prev, targetType: val }))}
                        >
                          <SelectTrigger data-testid="select-target-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TARGET_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="targetValue">Target Value</Label>
                      <Input 
                        id="targetValue"
                        type="number"
                        min={1}
                        value={newChallenge.targetValue}
                        onChange={(e) => setNewChallenge(prev => ({ ...prev, targetValue: parseInt(e.target.value) || 0 }))}
                        data-testid="input-target-value"
                      />
                      <p className="text-xs text-muted-foreground">
                        {TARGET_TYPES.find(t => t.value === newChallenge.targetType)?.description}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input 
                          id="startDate"
                          type="date"
                          value={newChallenge.startDate}
                          onChange={(e) => setNewChallenge(prev => ({ ...prev, startDate: e.target.value }))}
                          data-testid="input-start-date"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input 
                          id="endDate"
                          type="date"
                          value={newChallenge.endDate}
                          onChange={(e) => setNewChallenge(prev => ({ ...prev, endDate: e.target.value }))}
                          data-testid="input-end-date"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="badgeReward">Badge Reward (Optional)</Label>
                      <Input 
                        id="badgeReward"
                        placeholder="e.g., scoring_champion"
                        value={newChallenge.badgeReward}
                        onChange={(e) => setNewChallenge(prev => ({ ...prev, badgeReward: e.target.value }))}
                        data-testid="input-badge-reward"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                      data-testid="button-cancel-challenge"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateChallenge}
                      disabled={createChallengeMutation.isPending}
                      data-testid="button-save-challenge"
                    >
                      {createChallengeMutation.isPending ? 'Creating...' : 'Create Challenge'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            
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
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-card border border-white/10">
            <TabsTrigger value="active" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-active-challenges">
              <Flame className="w-4 h-4" />
              Active ({activeChallenges?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="past" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-past-challenges">
              <Calendar className="w-4 h-4" />
              Past ({pastChallenges.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2, 3].map((i) => (
                  <SkeletonChallengeCard key={i} />
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
    </Paywall>
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
