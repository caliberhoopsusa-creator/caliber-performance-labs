import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, Swords, Plus, Vote, Trash2, Users } from "lucide-react";
import type { Poll, Prediction, Player } from "@shared/schema";
import { PREDICTION_CATEGORIES } from "@shared/schema";

function generateSessionId(): string {
  let sessionId = localStorage.getItem("caliber_session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("caliber_session_id", sessionId);
  }
  return sessionId;
}

function getDisplayName(): string {
  return localStorage.getItem("caliber_display_name") || "Anonymous";
}

type PollWithVotes = Poll & { 
  voteCounts: number[]; 
  totalVotes: number;
  hasVoted?: boolean;
  userVote?: number;
};

type PredictionWithVotes = Prediction & {
  player1Name: string;
  player2Name: string;
  player1Votes: number;
  player2Votes: number;
  totalVotes: number;
  hasVoted?: boolean;
  userVote?: number;
};

export default function CommunityContent() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("polls");
  const sessionId = generateSessionId();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display text-white tracking-wide flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          Community
        </h1>
        <p className="text-muted-foreground mt-1">
          Create polls and predict matchup outcomes with the community
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="polls" data-testid="tab-polls">
            <BarChart3 className="w-4 h-4 mr-2" />
            Polls
          </TabsTrigger>
          <TabsTrigger value="predictions" data-testid="tab-predictions">
            <Swords className="w-4 h-4 mr-2" />
            Matchup Predictions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="polls">
          <PollsTab sessionId={sessionId} />
        </TabsContent>

        <TabsContent value="predictions">
          <PredictionsTab sessionId={sessionId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PollsTab({ sessionId }: { sessionId: string }) {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const { data: polls = [], isLoading } = useQuery<PollWithVotes[]>({
    queryKey: ["/api/polls", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/polls?sessionId=${sessionId}`);
      if (!res.ok) throw new Error("Failed to fetch polls");
      return res.json();
    },
  });

  const createPollMutation = useMutation({
    mutationFn: async (data: { question: string; options: string[] }) => {
      const res = await apiRequest("POST", "/api/polls", {
        question: data.question,
        options: data.options.filter(o => o.trim()),
        createdBy: getDisplayName(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/polls"] });
      setCreateDialogOpen(false);
      setQuestion("");
      setOptions(["", ""]);
      toast({ title: "Poll Created", description: "Your poll is now live!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create poll", variant: "destructive" });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ pollId, optionIndex }: { pollId: number; optionIndex: number }) => {
      const res = await apiRequest("POST", `/api/polls/${pollId}/vote`, {
        sessionId,
        optionIndex,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/polls"] });
      toast({ title: "Vote Recorded", description: "Thanks for voting!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to vote", variant: "destructive" });
    },
  });

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const validOptions = options.filter(o => o.trim()).length >= 2;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-poll">
              <Plus className="w-4 h-4 mr-2" />
              Create Poll
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Poll</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (question.trim() && validOptions) {
                  createPollMutation.mutate({ question, options });
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="question">Question</Label>
                <Input
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What's your question?"
                  data-testid="input-poll-question"
                />
              </div>
              <div className="space-y-2">
                <Label>Options</Label>
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      data-testid={`input-poll-option-${index}`}
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeOption(index)}
                        data-testid={`button-remove-option-${index}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {options.length < 6 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    data-testid="button-add-option"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Option
                  </Button>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={!question.trim() || !validOptions || createPollMutation.isPending}
                data-testid="button-submit-poll"
              >
                {createPollMutation.isPending ? "Creating..." : "Create Poll"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded w-3/4 mb-4" />
                <div className="space-y-2">
                  <div className="h-8 bg-muted rounded" />
                  <div className="h-8 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : polls.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Polls Yet</h3>
            <p className="text-muted-foreground">Create the first poll and get the community voting!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              sessionId={sessionId}
              onVote={(optionIndex) => voteMutation.mutate({ pollId: poll.id, optionIndex })}
              isVoting={voteMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PollCard({
  poll,
  sessionId,
  onVote,
  isVoting,
}: {
  poll: PollWithVotes;
  sessionId: string;
  onVote: (optionIndex: number) => void;
  isVoting: boolean;
}) {
  const showResults = poll.hasVoted || poll.totalVotes > 0;

  return (
    <Card data-testid={`poll-card-${poll.id}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          {poll.question}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          by {poll.createdBy} · {poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""}
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {poll.options.map((option, index) => {
          const voteCount = poll.voteCounts?.[index] || 0;
          const percentage = poll.totalVotes > 0 ? (voteCount / poll.totalVotes) * 100 : 0;
          const isUserVote = poll.userVote === index;

          return (
            <div key={index} className="space-y-1">
              {poll.hasVoted ? (
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm ${isUserVote ? "font-semibold text-primary" : ""}`}>
                      {option} {isUserVote && <Vote className="w-3 h-3 inline ml-1" />}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {voteCount} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => onVote(index)}
                  disabled={isVoting}
                  data-testid={`button-vote-option-${poll.id}-${index}`}
                >
                  {option}
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function PredictionsTab({ sessionId }: { sessionId: string }) {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [player1Id, setPlayer1Id] = useState<string>("");
  const [player2Id, setPlayer2Id] = useState<string>("");
  const [category, setCategory] = useState<string>("");

  const { data: predictions = [], isLoading } = useQuery<PredictionWithVotes[]>({
    queryKey: ["/api/predictions", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/predictions?sessionId=${sessionId}`);
      if (!res.ok) throw new Error("Failed to fetch predictions");
      return res.json();
    },
  });

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const createPredictionMutation = useMutation({
    mutationFn: async (data: { player1Id: number; player2Id: number; category: string }) => {
      const res = await apiRequest("POST", "/api/predictions", {
        player1Id: data.player1Id,
        player2Id: data.player2Id,
        category: data.category,
        createdBy: getDisplayName(),
        sessionId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/predictions"] });
      setCreateDialogOpen(false);
      setPlayer1Id("");
      setPlayer2Id("");
      setCategory("");
      toast({ title: "Prediction Created", description: "Your matchup prediction is live!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create prediction", variant: "destructive" });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ predictionId, votedFor }: { predictionId: number; votedFor: number }) => {
      const res = await apiRequest("POST", `/api/predictions/${predictionId}/vote`, {
        sessionId,
        votedFor,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/predictions"] });
      toast({ title: "Vote Recorded", description: "Your prediction is in!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to vote", variant: "destructive" });
    },
  });

  const canSubmit = player1Id && player2Id && category && player1Id !== player2Id;

  const categoryOptions = Object.entries(PREDICTION_CATEGORIES).map(([key, val]) => ({
    value: key,
    label: val.name,
  }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-prediction">
              <Plus className="w-4 h-4 mr-2" />
              Create Matchup
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Matchup Prediction</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (canSubmit) {
                  createPredictionMutation.mutate({
                    player1Id: Number(player1Id),
                    player2Id: Number(player2Id),
                    category,
                  });
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Player 1</Label>
                <Select value={player1Id} onValueChange={setPlayer1Id}>
                  <SelectTrigger data-testid="select-player1">
                    <SelectValue placeholder="Select player" />
                  </SelectTrigger>
                  <SelectContent>
                    {players.map((player) => (
                      <SelectItem key={player.id} value={player.id.toString()}>
                        {player.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Player 2</Label>
                <Select value={player2Id} onValueChange={setPlayer2Id}>
                  <SelectTrigger data-testid="select-player2">
                    <SelectValue placeholder="Select player" />
                  </SelectTrigger>
                  <SelectContent>
                    {players
                      .filter((p) => p.id.toString() !== player1Id)
                      .map((player) => (
                        <SelectItem key={player.id} value={player.id.toString()}>
                          {player.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={!canSubmit || createPredictionMutation.isPending}
                data-testid="button-submit-prediction"
              >
                {createPredictionMutation.isPending ? "Creating..." : "Create Matchup"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded w-1/2 mx-auto mb-4" />
                <div className="flex justify-between">
                  <div className="h-16 w-24 bg-muted rounded" />
                  <div className="h-16 w-24 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : predictions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Swords className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Predictions Yet</h3>
            <p className="text-muted-foreground">Create a matchup prediction and see who the community thinks will win!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {predictions.map((prediction) => (
            <PredictionCard
              key={prediction.id}
              prediction={prediction}
              onVote={(votedFor) => voteMutation.mutate({ predictionId: prediction.id, votedFor })}
              isVoting={voteMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PredictionCard({
  prediction,
  onVote,
  isVoting,
}: {
  prediction: PredictionWithVotes;
  onVote: (votedFor: number) => void;
  isVoting: boolean;
}) {
  const categoryInfo = PREDICTION_CATEGORIES[prediction.category as keyof typeof PREDICTION_CATEGORIES];
  const p1Percentage = prediction.totalVotes > 0 ? (prediction.player1Votes / prediction.totalVotes) * 100 : 50;
  const p2Percentage = prediction.totalVotes > 0 ? (prediction.player2Votes / prediction.totalVotes) * 100 : 50;

  return (
    <Card data-testid={`prediction-card-${prediction.id}`}>
      <CardHeader className="pb-2 text-center">
        <Badge variant="secondary" className="w-fit mx-auto mb-2">
          {categoryInfo?.name || prediction.category}
        </Badge>
        <p className="text-xs text-muted-foreground">
          by {prediction.createdBy} · {prediction.totalVotes} vote{prediction.totalVotes !== 1 ? "s" : ""}
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 text-center">
            <Button
              variant={prediction.userVote === prediction.player1Id ? "default" : "outline"}
              className="w-full h-auto py-4 flex-col"
              onClick={() => onVote(prediction.player1Id)}
              disabled={isVoting || prediction.hasVoted}
              data-testid={`button-vote-player1-${prediction.id}`}
            >
              <span className="font-semibold">{prediction.player1Name}</span>
              {prediction.hasVoted && (
                <span className="text-xs mt-1">
                  {prediction.player1Votes} ({p1Percentage.toFixed(0)}%)
                </span>
              )}
            </Button>
          </div>
          <div className="text-2xl font-bold text-muted-foreground">VS</div>
          <div className="flex-1 text-center">
            <Button
              variant={prediction.userVote === prediction.player2Id ? "default" : "outline"}
              className="w-full h-auto py-4 flex-col"
              onClick={() => onVote(prediction.player2Id)}
              disabled={isVoting || prediction.hasVoted}
              data-testid={`button-vote-player2-${prediction.id}`}
            >
              <span className="font-semibold">{prediction.player2Name}</span>
              {prediction.hasVoted && (
                <span className="text-xs mt-1">
                  {prediction.player2Votes} ({p2Percentage.toFixed(0)}%)
                </span>
              )}
            </Button>
          </div>
        </div>
        {prediction.hasVoted && prediction.totalVotes > 0 && (
          <div className="mt-4">
            <div className="flex h-2 rounded-full overflow-hidden bg-muted">
              <div
                className="bg-primary transition-all"
                style={{ width: `${p1Percentage}%` }}
              />
              <div
                className="bg-secondary transition-all"
                style={{ width: `${p2Percentage}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
