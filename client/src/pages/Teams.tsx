import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, LogIn, Copy, Check, Crown, Camera } from "lucide-react";
import { TeamBoard } from "@/components/TeamBoard";
import type { Team } from "@shared/schema";
import { useUpload } from "@/hooks/use-upload";

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
  const [joinRole, setJoinRole] = useState<"member" | "coach">("member");
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
    mutationFn: async ({ code, displayName, role }: { code: string; displayName: string; role: "member" | "coach" }) => {
      setDisplayName(displayName);
      const teamRes = await fetch(`/api/teams/${code}`);
      if (!teamRes.ok) throw new Error("Team not found");
      const team = await teamRes.json();
      
      const res = await apiRequest("POST", `/api/teams/${team.id}/join`, {
        sessionId,
        displayName,
        role,
      });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-teams"] });
      setJoinDialogOpen(false);
      setJoinCode("");
      setJoinRole("member");
      toast({
        title: "Joined Team",
        description: variables.role === "coach" ? "You joined as a coach!" : "You are now a team member!",
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

  const { uploadFile, isUploading } = useUpload({
    onSuccess: async (response) => {
      if (uploadingTeamId && response.objectPath) {
        try {
          await apiRequest("PATCH", `/api/teams/${uploadingTeamId}/profile-picture`, {
            sessionId,
            profilePicture: response.objectPath,
          });
          queryClient.invalidateQueries({ queryKey: ["/api/my-teams"] });
          toast({
            title: "Profile Picture Updated",
            description: "Team profile picture has been changed",
          });
        } catch (err) {
          toast({
            title: "Error",
            description: "Failed to save profile picture",
            variant: "destructive",
          });
        }
        setUploadingTeamId(null);
      }
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload image",
        variant: "destructive",
      });
      setUploadingTeamId(null);
    },
  });

  const [uploadingTeamId, setUploadingTeamId] = useState<number | null>(null);

  const handleTeamPictureUpload = (teamId: number, file: File) => {
    setUploadingTeamId(teamId);
    uploadFile(file);
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
          <h1 className="text-3xl font-bold font-display bg-gradient-to-b from-white to-accent/20 bg-clip-text text-transparent tracking-wide">Teams</h1>
          <p className="text-accent/50 mt-1">Join or create teams to discuss with teammates</p>
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
                  joinTeamMutation.mutate({ code: joinCode.toUpperCase(), displayName, role: joinRole });
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
                <div className="space-y-2">
                  <Label htmlFor="joinRole">Your Role</Label>
                  <Select value={joinRole} onValueChange={(v: "member" | "coach") => setJoinRole(v)}>
                    <SelectTrigger data-testid="select-join-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">
                        <span className="flex items-center gap-2">
                          <Users className="w-4 h-4" /> Player
                        </span>
                      </SelectItem>
                      <SelectItem value="coach">
                        <span className="flex items-center gap-2">
                          <Crown className="w-4 h-4 text-amber-500" /> Coach
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Coaches can post announcements and practice schedules
                  </p>
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
        <div className="flex items-center justify-center py-16">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20" />
            <div className="h-4 w-32 bg-muted rounded" />
          </div>
        </div>
      ) : myTeams.length === 0 ? (
        <Card className="border-dashed border-2 bg-gradient-to-br from-card to-card/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
              <Users className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">No Teams Yet</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              Create your own team or join an existing one with a team code to start collaborating
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setJoinDialogOpen(true)}>
                <LogIn className="w-4 h-4 mr-2" />
                Join Team
              </Button>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Team
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {myTeams.map((team) => {
            const isTeamLeader = team.createdBy === sessionId;
            return (
              <Card 
                key={team.id} 
                className="cursor-pointer hover-elevate transition-all group relative overflow-visible border-primary/10 hover:border-primary/30"
                onClick={() => setSelectedTeam(team)}
                data-testid={`card-team-${team.id}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="pb-2 relative">
                  <CardTitle className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10 rounded-lg border border-primary/20">
                        {team.profilePicture ? (
                          <AvatarImage 
                            src={team.profilePicture.startsWith('http') 
                              ? team.profilePicture 
                              : team.profilePicture.startsWith('/objects') 
                                ? team.profilePicture 
                                : `/objects${team.profilePicture.startsWith('/') ? '' : '/'}${team.profilePicture}`} 
                            alt={team.name}
                            width={40}
                            height={40}
                          />
                        ) : null}
                        <AvatarFallback className="rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
                          <Users className="w-5 h-5 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      {isTeamLeader && (
                        <label 
                          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center cursor-pointer hover-elevate"
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`label-upload-team-picture-${team.id}`}
                        >
                          <Camera className="w-3 h-3 text-white" />
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/gif,image/webp"
                            className="hidden"
                            data-testid={`input-upload-team-picture-${team.id}`}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 5 * 1024 * 1024) {
                                  toast({
                                    title: "File Too Large",
                                    description: "Please choose an image under 5MB",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                handleTeamPictureUpload(team.id, file);
                              }
                            }}
                            disabled={isUploading && uploadingTeamId === team.id}
                          />
                        </label>
                      )}
                    </div>
                    <span className="group-hover:text-primary transition-colors">{team.name}</span>
                    {isTeamLeader && (
                      <Crown className="w-4 h-4 text-amber-500" />
                    )}
                  </CardTitle>
                </CardHeader>
              <CardContent className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[...Array(Math.min(team.memberCount, 3))].map((_, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-muted border-2 border-card flex items-center justify-center">
                          <span className="text-[10px] text-muted-foreground">{i + 1}</span>
                        </div>
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {team.memberCount} {team.memberCount === 1 ? "member" : "members"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-secondary/50 px-2 py-1 rounded font-mono tracking-wider">{team.code}</code>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyCode(team.code);
                      }}
                      data-testid={`button-copy-code-${team.id}`}
                    >
                      {copiedCode === team.code ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
