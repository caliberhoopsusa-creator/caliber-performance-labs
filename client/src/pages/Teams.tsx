import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, LogIn, Copy, Check } from "lucide-react";
import { TeamBoard } from "@/components/TeamBoard";
import type { Team } from "@shared/schema";

function getSessionId(): string {
  let sessionId = localStorage.getItem("caliber_session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("caliber_session_id", sessionId);
  }
  return sessionId;
}

function getDisplayName(): string {
  return localStorage.getItem("caliber_display_name") || "";
}

function setDisplayName(name: string) {
  localStorage.setItem("caliber_display_name", name);
}

type TeamWithCount = Team & { memberCount: number };

export default function Teams() {
  const { toast } = useToast();
  const [selectedTeam, setSelectedTeam] = useState<TeamWithCount | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [displayName, setDisplayNameInput] = useState(getDisplayName());
  const [joinCode, setJoinCode] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const sessionId = getSessionId();

  const { data: myTeams = [], isLoading } = useQuery<TeamWithCount[]>({
    queryKey: ["/api/my-teams", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/my-teams?sessionId=${sessionId}`);
      if (!res.ok) throw new Error("Failed to fetch teams");
      return res.json();
    },
  });

  const createTeamMutation = useMutation({
    mutationFn: async ({ name, displayName }: { name: string; displayName: string }) => {
      setDisplayName(displayName);
      const res = await apiRequest("POST", "/api/teams", {
        name,
        sessionId,
        displayName,
      });
      return res.json();
    },
    onSuccess: (team) => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-teams"] });
      setCreateDialogOpen(false);
      setTeamName("");
      toast({
        title: "Team Created",
        description: `Your team code is ${team.code}. Share it with teammates!`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create team",
        variant: "destructive",
      });
    },
  });

  const joinTeamMutation = useMutation({
    mutationFn: async ({ code, displayName }: { code: string; displayName: string }) => {
      setDisplayName(displayName);
      const teamRes = await fetch(`/api/teams/${code}`);
      if (!teamRes.ok) throw new Error("Team not found");
      const team = await teamRes.json();
      
      const res = await apiRequest("POST", `/api/teams/${team.id}/join`, {
        sessionId,
        displayName,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-teams"] });
      setJoinDialogOpen(false);
      setJoinCode("");
      toast({
        title: "Joined Team",
        description: "You are now a team member!",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message || "Failed to join team",
        variant: "destructive",
      });
    },
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (selectedTeam) {
    return (
      <TeamBoard 
        team={selectedTeam} 
        sessionId={sessionId}
        onBack={() => setSelectedTeam(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display text-white tracking-wide">Teams</h1>
          <p className="text-muted-foreground mt-1">Join or create teams to discuss with teammates</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-join-team">
                <LogIn className="w-4 h-4 mr-2" />
                Join Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join a Team</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (joinCode && displayName) {
                  joinTeamMutation.mutate({ code: joinCode.toUpperCase(), displayName });
                }
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Your Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    placeholder="Enter your name"
                    data-testid="input-join-display-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joinCode">Team Code</Label>
                  <Input
                    id="joinCode"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-character code"
                    maxLength={6}
                    data-testid="input-join-code"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={!joinCode || !displayName || joinTeamMutation.isPending}
                  data-testid="button-submit-join"
                >
                  {joinTeamMutation.isPending ? "Joining..." : "Join Team"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-team">
                <Plus className="w-4 h-4 mr-2" />
                Create Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New Team</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (teamName && displayName) {
                  createTeamMutation.mutate({ name: teamName, displayName });
                }
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="createDisplayName">Your Display Name</Label>
                  <Input
                    id="createDisplayName"
                    value={displayName}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    placeholder="Enter your name"
                    data-testid="input-create-display-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teamName">Team Name</Label>
                  <Input
                    id="teamName"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter team name"
                    data-testid="input-team-name"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={!teamName || !displayName || createTeamMutation.isPending}
                  data-testid="button-submit-create"
                >
                  {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading teams...</div>
      ) : myTeams.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Teams Yet</h3>
            <p className="text-muted-foreground mb-4">Create a team or join one with a team code</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {myTeams.map((team) => (
            <Card 
              key={team.id} 
              className="cursor-pointer hover-elevate transition-all"
              onClick={() => setSelectedTeam(team)}
              data-testid={`card-team-${team.id}`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  {team.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {team.memberCount} {team.memberCount === 1 ? "member" : "members"}
                  </span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-secondary px-2 py-1 rounded">{team.code}</code>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyCode(team.code);
                      }}
                      data-testid={`button-copy-code-${team.id}`}
                    >
                      {copiedCode === team.code ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
