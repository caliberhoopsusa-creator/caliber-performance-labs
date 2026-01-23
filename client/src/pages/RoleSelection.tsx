import { useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, UserCircle, ClipboardList, ChevronRight, Loader2, Users, Plus, ArrowLeft } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSport, useSportContext } from "@/components/SportToggle";
import { BASKETBALL_POSITIONS, FOOTBALL_POSITIONS, FOOTBALL_POSITION_LABELS, type Sport } from "@shared/sports-config";

type RoleType = 'player' | 'coach' | null;
type CoachStep = 'select-team-action' | 'create-team' | 'join-team' | null;

function BasketballIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M12 2C12 12 12 12 12 22" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2 12C12 12 12 12 22 12" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4.5 4.5C8 8 8 16 4.5 19.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M19.5 4.5C16 8 16 16 19.5 19.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </svg>
  );
}

function FootballIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <ellipse cx="12" cy="12" rx="10" ry="6" stroke="currentColor" strokeWidth="2" fill="none" transform="rotate(-30 12 12)"/>
      <path d="M7 12L17 12" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M9 10L9 14" stroke="currentColor" strokeWidth="1"/>
      <path d="M11 9L11 15" stroke="currentColor" strokeWidth="1"/>
      <path d="M13 9L13 15" stroke="currentColor" strokeWidth="1"/>
      <path d="M15 10L15 14" stroke="currentColor" strokeWidth="1"/>
    </svg>
  );
}

export default function RoleSelection() {
  const defaultSport = useSport();
  const sportContext = useSportContext();
  const [selectedRole, setSelectedRole] = useState<RoleType>(null);
  const [coachStep, setCoachStep] = useState<CoachStep>(null);
  const [playerForm, setPlayerForm] = useState({
    name: '',
    sport: defaultSport as Sport,
    positions: [] as string[],
    height: '',
    team: '',
    jerseyNumber: '',
    teamCode: '',
  });
  const [teamForm, setTeamForm] = useState({
    name: '',
    code: '',
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSportChange = (sport: Sport) => {
    setPlayerForm(prev => ({ ...prev, sport, positions: [] }));
    // Update the sport context (which also persists to localStorage)
    sportContext.setSport(sport);
  };
  
  const togglePosition = (position: string) => {
    setPlayerForm(prev => ({
      ...prev,
      positions: prev.positions.includes(position)
        ? prev.positions.filter(p => p !== position)
        : [...prev.positions, position]
    }));
  };

  const getPositionsForSport = () => {
    if (playerForm.sport === 'football') {
      return FOOTBALL_POSITIONS;
    }
    return BASKETBALL_POSITIONS;
  };

  const getPositionLabel = (position: string) => {
    if (playerForm.sport === 'football' && position in FOOTBALL_POSITION_LABELS) {
      return FOOTBALL_POSITION_LABELS[position as keyof typeof FOOTBALL_POSITION_LABELS];
    }
    return position;
  };

  const setRoleMutation = useMutation({
    mutationFn: async (role: 'player' | 'coach') => {
      return await apiRequest('POST', '/api/users/role', { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to set role",
        variant: "destructive",
      });
    },
  });

  const createPlayerMutation = useMutation({
    mutationFn: async (data: { name: string; sport: Sport; position: string; height: string; team: string; jerseyNumber: string; teamCode: string }) => {
      const result = await apiRequest('POST', '/api/users/create-player-profile', {
        name: data.name,
        sport: data.sport,
        position: data.position,
        height: data.height || undefined,
        team: data.team || undefined,
        jerseyNumber: data.jerseyNumber ? parseInt(data.jerseyNumber) : undefined,
      });
      
      let teamJoined = false;
      let teamJoinError = '';
      
      if (data.teamCode) {
        try {
          await apiRequest('POST', '/api/teams/join', { 
            code: data.teamCode, 
            displayName: data.name 
          });
          teamJoined = true;
        } catch (error: any) {
          teamJoinError = error.message || 'Invalid team code';
        }
      }
      
      return { ...result, teamJoined, teamJoinError, hadTeamCode: !!data.teamCode };
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/players'] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-teams'] });
      
      if (data.hadTeamCode) {
        if (data.teamJoined) {
          toast({
            title: "Profile Created",
            description: "Your player profile has been created and you've joined the team!",
          });
        } else {
          toast({
            title: "Profile Created",
            description: "Your profile was created, but couldn't join team: " + data.teamJoinError + ". You can try again from the Teams page.",
          });
        }
      } else {
        toast({
          title: "Profile Created",
          description: "Your player profile has been created!",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create player profile",
        variant: "destructive",
      });
    },
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      await setRoleMutation.mutateAsync('coach');
      // Get or create a session ID for team membership
      let sessionId = localStorage.getItem("caliber_session_id");
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem("caliber_session_id", sessionId);
      }
      return await apiRequest('POST', '/api/teams', { 
        name: data.name,
        sessionId,
        displayName: 'Coach'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-teams'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      toast({
        title: "Team Created",
        description: "Your team has been created! You can now invite players.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create team",
        variant: "destructive",
      });
    },
  });

  const joinTeamMutation = useMutation({
    mutationFn: async (data: { code: string }) => {
      await setRoleMutation.mutateAsync('coach');
      return await apiRequest('POST', '/api/teams/join', { code: data.code, displayName: 'Coach' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-teams'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      toast({
        title: "Joined Team",
        description: "You have joined the team successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join team. Check the team code.",
        variant: "destructive",
      });
    },
  });

  const handleCoachSelect = async () => {
    setSelectedRole('coach');
    setCoachStep('select-team-action');
  };

  const handlePlayerSelect = async () => {
    await setRoleMutation.mutateAsync('player');
    setSelectedRole('player');
  };

  const handlePlayerProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerForm.name || playerForm.positions.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please enter your name and select at least one position",
        variant: "destructive",
      });
      return;
    }
    // Convert positions array to comma-separated string for storage
    const formData = {
      ...playerForm,
      position: playerForm.positions.join(','),
    };
    await createPlayerMutation.mutateAsync(formData);
  };

  const handleCreateTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.name) {
      toast({
        title: "Missing Information",
        description: "Please enter a team name",
        variant: "destructive",
      });
      return;
    }
    await createTeamMutation.mutateAsync({ name: teamForm.name });
  };

  const handleJoinTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.code) {
      toast({
        title: "Missing Information",
        description: "Please enter a team code",
        variant: "destructive",
      });
      return;
    }
    await joinTeamMutation.mutateAsync({ code: teamForm.code });
  };

  const isLoading = setRoleMutation.isPending || createPlayerMutation.isPending || createTeamMutation.isPending || joinTeamMutation.isPending;

  const getSubtitle = () => {
    if (selectedRole === 'player') return "Let's set up your player profile";
    if (coachStep === 'select-team-action') return "Do you have an existing team or want to create one?";
    if (coachStep === 'create-team') return "Create your team and start building your roster";
    if (coachStep === 'join-team') return "Enter the team code to join an existing team";
    return "How will you be using Caliber?";
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 mb-4">
            <Activity className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold font-display text-white tracking-wider uppercase">Welcome to Caliber</h1>
          <p className="text-muted-foreground mt-2">{getSubtitle()}</p>
        </div>

        {selectedRole === 'player' ? (
          <Card className="p-6 bg-card border-border">
            <form onSubmit={handlePlayerProfileSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Your Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={playerForm.name}
                  onChange={(e) => setPlayerForm(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1"
                  data-testid="input-player-name"
                />
              </div>

              <div>
                <Label>Sport *</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      playerForm.sport === 'basketball'
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-border hover:border-muted-foreground/50'
                    }`}
                    onClick={() => handleSportChange('basketball')}
                    data-testid="card-sport-basketball"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <BasketballIcon className={`w-8 h-8 ${playerForm.sport === 'basketball' ? 'text-orange-500' : 'text-muted-foreground'}`} />
                      <span className={`text-sm font-medium ${playerForm.sport === 'basketball' ? 'text-white' : 'text-muted-foreground'}`}>
                        Basketball
                      </span>
                    </div>
                  </div>
                  <div
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      playerForm.sport === 'football'
                        ? 'border-amber-700 bg-amber-700/10'
                        : 'border-border hover:border-muted-foreground/50'
                    }`}
                    onClick={() => handleSportChange('football')}
                    data-testid="card-sport-football"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FootballIcon className={`w-8 h-8 ${playerForm.sport === 'football' ? 'text-amber-600' : 'text-muted-foreground'}`} />
                      <span className={`text-sm font-medium ${playerForm.sport === 'football' ? 'text-white' : 'text-muted-foreground'}`}>
                        Football
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label>Position(s) * <span className="text-xs text-muted-foreground font-normal">(Select all that apply)</span></Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {getPositionsForSport().map((pos) => (
                    <div
                      key={pos}
                      onClick={() => togglePosition(pos)}
                      className={`
                        cursor-pointer rounded-lg border p-2 text-center text-sm font-medium transition-all
                        ${playerForm.positions.includes(pos)
                          ? 'border-primary bg-primary/10 text-white'
                          : 'border-white/10 bg-secondary/30 text-muted-foreground hover:border-white/30 hover:bg-secondary/50'
                        }
                      `}
                      data-testid={`position-${pos.toLowerCase()}`}
                    >
                      {getPositionLabel(pos)}
                    </div>
                  ))}
                </div>
                {playerForm.positions.length > 0 && (
                  <p className="text-xs text-primary mt-2">
                    Selected: {playerForm.positions.map(p => getPositionLabel(p)).join(', ')}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    placeholder="e.g., 6'2"
                    value={playerForm.height}
                    onChange={(e) => setPlayerForm(prev => ({ ...prev, height: e.target.value }))}
                    className="mt-1"
                    data-testid="input-height"
                  />
                </div>
                <div>
                  <Label htmlFor="jerseyNumber">Jersey #</Label>
                  <Input
                    id="jerseyNumber"
                    type="number"
                    placeholder="e.g., 23"
                    value={playerForm.jerseyNumber}
                    onChange={(e) => setPlayerForm(prev => ({ ...prev, jerseyNumber: e.target.value }))}
                    className="mt-1"
                    data-testid="input-jersey"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="team">Team Name</Label>
                <Input
                  id="team"
                  placeholder="Your team name (optional)"
                  value={playerForm.team}
                  onChange={(e) => setPlayerForm(prev => ({ ...prev, team: e.target.value }))}
                  className="mt-1"
                  data-testid="input-team"
                />
              </div>

              <div className="border-t border-border pt-4 mt-4">
                <Label htmlFor="teamCode" className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-500" />
                  Have a Team Invite Code?
                </Label>
                <Input
                  id="teamCode"
                  placeholder="Enter your team code (optional)"
                  value={playerForm.teamCode}
                  onChange={(e) => setPlayerForm(prev => ({ ...prev, teamCode: e.target.value.toUpperCase() }))}
                  className="mt-1 uppercase"
                  data-testid="input-team-code"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  If your coach sent you a team code, enter it here to join your team
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
                data-testid="button-create-profile"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ChevronRight className="w-4 h-4 mr-2" />
                )}
                Create My Profile
              </Button>
            </form>
          </Card>
        ) : coachStep === 'select-team-action' ? (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Card 
                className="p-6 bg-card border-border hover-elevate cursor-pointer group"
                onClick={() => setCoachStep('create-team')}
                data-testid="card-create-team"
              >
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Plus className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Create a Team</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Start fresh and invite your players
                    </p>
                  </div>
                  <Button variant="outline" className="w-full" disabled={isLoading}>
                    Create Team
                  </Button>
                </div>
              </Card>

              <Card 
                className="p-6 bg-card border-border hover-elevate cursor-pointer group"
                onClick={() => setCoachStep('join-team')}
                data-testid="card-join-team"
              >
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                    <Users className="w-8 h-8 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Join Existing Team</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Have a team code? Join your team
                    </p>
                  </div>
                  <Button variant="outline" className="w-full" disabled={isLoading}>
                    Join Team
                  </Button>
                </div>
              </Card>
            </div>
            <Button 
              variant="ghost" 
              className="w-full text-muted-foreground"
              onClick={() => {
                setSelectedRole(null);
                setCoachStep(null);
              }}
              data-testid="button-back-role"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to role selection
            </Button>
          </div>
        ) : coachStep === 'create-team' ? (
          <Card className="p-6 bg-card border-border">
            <form onSubmit={handleCreateTeamSubmit} className="space-y-4">
              <div>
                <Label htmlFor="teamName">Team Name *</Label>
                <Input
                  id="teamName"
                  placeholder="e.g., Eagles Basketball"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1"
                  data-testid="input-team-name"
                />
              </div>

              <p className="text-sm text-muted-foreground">
                After creating your team, you'll get a unique team code to share with your players.
              </p>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
                data-testid="button-create-team"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create Team
              </Button>

              <Button 
                type="button"
                variant="ghost" 
                className="w-full text-muted-foreground"
                onClick={() => setCoachStep('select-team-action')}
                data-testid="button-back-team-action"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </form>
          </Card>
        ) : coachStep === 'join-team' ? (
          <Card className="p-6 bg-card border-border">
            <form onSubmit={handleJoinTeamSubmit} className="space-y-4">
              <div>
                <Label htmlFor="teamCode">Team Code *</Label>
                <Input
                  id="teamCode"
                  placeholder="Enter team code"
                  value={teamForm.code}
                  onChange={(e) => setTeamForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="mt-1 uppercase"
                  data-testid="input-team-code"
                />
              </div>

              <p className="text-sm text-muted-foreground">
                Ask your team admin for the team code to join.
              </p>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
                data-testid="button-join-team"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Users className="w-4 h-4 mr-2" />
                )}
                Join Team
              </Button>

              <Button 
                type="button"
                variant="ghost" 
                className="w-full text-muted-foreground"
                onClick={() => setCoachStep('select-team-action')}
                data-testid="button-back-team-action-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </form>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            <Card 
              className="p-6 bg-card border-border hover-elevate cursor-pointer group"
              onClick={handlePlayerSelect}
              data-testid="card-select-player"
            >
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <UserCircle className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">I'm a Player</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Track my own stats, earn badges, and level up my game
                  </p>
                </div>
                <Button variant="outline" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Select Player"}
                </Button>
              </div>
            </Card>

            <Card 
              className="p-6 bg-card border-border hover-elevate cursor-pointer group"
              onClick={handleCoachSelect}
              data-testid="card-select-coach"
            >
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                  <ClipboardList className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">I'm a Coach</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage my roster, analyze players, and scout talent
                  </p>
                </div>
                <Button variant="outline" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Select Coach"}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
