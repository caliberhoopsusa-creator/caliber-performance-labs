import { useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Activity, UserCircle, ClipboardList, ChevronRight, Loader2, Users, Plus, ArrowLeft, GraduationCap, Heart } from "lucide-react";
import { GuardianOnboarding } from "@/components/GuardianOnboarding";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BASKETBALL_POSITIONS } from "@shared/sports-config";

type RoleType = 'player' | 'coach' | 'recruiter' | 'guardian' | null;
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

export default function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState<RoleType>(null);
  const [coachStep, setCoachStep] = useState<CoachStep>(null);
  const [playerForm, setPlayerForm] = useState({
    name: '',
    sport: 'basketball' as const,
    positions: [] as string[],
    height: '',
    team: '',
    jerseyNumber: '',
    teamCode: '',
  });
  const [recruiterForm, setRecruiterForm] = useState({
    schoolName: '',
    division: '',
    title: '',
    schoolEmail: '',
    phone: '',
    state: '',
    conference: '',
    bio: '',
  });
  const [teamForm, setTeamForm] = useState({
    name: '',
    code: '',
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const togglePosition = (position: string) => {
    setPlayerForm(prev => ({
      ...prev,
      positions: prev.positions.includes(position)
        ? prev.positions.filter(p => p !== position)
        : [...prev.positions, position]
    }));
  };

  const getPositionsForSport = () => {
    return BASKETBALL_POSITIONS;
  };

  const getPositionLabel = (position: string) => {
    return position;
  };

  const handleGuardianSelect = async () => {
    await setRoleMutation.mutateAsync('guardian' as any);
    setSelectedRole('guardian');
  };

  const setRoleMutation = useMutation({
    mutationFn: async (role: 'player' | 'coach' | 'recruiter') => {
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
    mutationFn: async (data: { name: string; position: string; height: string; team: string; jerseyNumber: string; teamCode: string }) => {
      const result = await apiRequest('POST', '/api/users/create-player-profile', {
        name: data.name,
        sport: 'basketball',
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

  const createRecruiterProfileMutation = useMutation({
    mutationFn: async (data: { schoolName: string; division: string; title: string; schoolEmail: string; phone?: string; state?: string; conference?: string; bio?: string }) => {
      return await apiRequest('POST', '/api/recruiter/profile', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recruiter/profile'] });
      toast({
        title: "Profile Created",
        description: "Your recruiter profile has been created!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create recruiter profile",
        variant: "destructive",
      });
    },
  });

  const handleCoachSelect = async () => {
    setSelectedRole('coach');
    setCoachStep('select-team-action');
  };

  const handleRecruiterSelect = async () => {
    await setRoleMutation.mutateAsync('recruiter');
    setSelectedRole('recruiter');
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

  const handleRecruiterProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recruiterForm.schoolName || !recruiterForm.division || !recruiterForm.title || !recruiterForm.schoolEmail) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    if (!recruiterForm.schoolEmail.endsWith('.edu')) {
      toast({
        title: "Invalid Email",
        description: "School email must end in .edu",
        variant: "destructive",
      });
      return;
    }
    await createRecruiterProfileMutation.mutateAsync({
      schoolName: recruiterForm.schoolName,
      division: recruiterForm.division,
      title: recruiterForm.title,
      schoolEmail: recruiterForm.schoolEmail,
      phone: recruiterForm.phone || undefined,
      state: recruiterForm.state || undefined,
      conference: recruiterForm.conference || undefined,
      bio: recruiterForm.bio || undefined,
    });
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

  const isLoading = setRoleMutation.isPending || createPlayerMutation.isPending || createTeamMutation.isPending || joinTeamMutation.isPending || createRecruiterProfileMutation.isPending;

  const getSubtitle = () => {
    if (selectedRole === 'player') return "Let's set up your player profile";
    if (selectedRole === 'recruiter') return "Let's set up your recruiter profile";
    if (selectedRole === 'guardian') return "Welcome to the family experience";
    if (coachStep === 'select-team-action') return "Do you have an existing team or want to create one?";
    if (coachStep === 'create-team') return "Create your team and start building your roster";
    if (coachStep === 'join-team') return "Enter the team code to join an existing team";
    return "How will you be using Caliber?";
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-accent flex items-center justify-center text-primary-foreground shadow-lg shadow-accent/20 mb-4">
            <Activity className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold font-display text-foreground tracking-wider uppercase">Choose Your Path</h1>
          <p className="text-muted-foreground mt-2">{getSubtitle()}</p>
        </div>

        {selectedRole === 'guardian' ? (
          <GuardianOnboarding
            onComplete={() => {
              queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
              queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
            }}
            onBack={() => {
              setSelectedRole(null);
            }}
          />
        ) : selectedRole === 'recruiter' ? (
          <Card className="p-6 bg-card border-border">
            <form onSubmit={handleRecruiterProfileSubmit} className="space-y-4">
              <div>
                <Label htmlFor="schoolName">School Name *</Label>
                <Input
                  id="schoolName"
                  placeholder="e.g., University of Alabama"
                  value={recruiterForm.schoolName}
                  onChange={(e) => setRecruiterForm(prev => ({ ...prev, schoolName: e.target.value }))}
                  className="mt-1"
                  data-testid="input-school-name"
                />
              </div>

              <div>
                <Label htmlFor="division">Division *</Label>
                <Select
                  value={recruiterForm.division}
                  onValueChange={(value) => setRecruiterForm(prev => ({ ...prev, division: value }))}
                >
                  <SelectTrigger className="mt-1" data-testid="select-division">
                    <SelectValue placeholder="Select division" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="D1">D1</SelectItem>
                    <SelectItem value="D2">D2</SelectItem>
                    <SelectItem value="D3">D3</SelectItem>
                    <SelectItem value="NAIA">NAIA</SelectItem>
                    <SelectItem value="JUCO">JUCO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="recruiterTitle">Title *</Label>
                <Input
                  id="recruiterTitle"
                  placeholder="e.g., Head Coach, Recruiting Coordinator"
                  value={recruiterForm.title}
                  onChange={(e) => setRecruiterForm(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1"
                  data-testid="input-recruiter-title"
                />
              </div>

              <div>
                <Label htmlFor="schoolEmail">School Email * <span className="text-xs text-muted-foreground font-normal">(must end in .edu)</span></Label>
                <Input
                  id="schoolEmail"
                  type="email"
                  placeholder="you@school.edu"
                  value={recruiterForm.schoolEmail}
                  onChange={(e) => setRecruiterForm(prev => ({ ...prev, schoolEmail: e.target.value }))}
                  className="mt-1"
                  data-testid="input-school-email"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recruiterPhone">Phone</Label>
                  <Input
                    id="recruiterPhone"
                    placeholder="(optional)"
                    value={recruiterForm.phone}
                    onChange={(e) => setRecruiterForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1"
                    data-testid="input-recruiter-phone"
                  />
                </div>
                <div>
                  <Label htmlFor="recruiterState">State</Label>
                  <Input
                    id="recruiterState"
                    placeholder="(optional)"
                    value={recruiterForm.state}
                    onChange={(e) => setRecruiterForm(prev => ({ ...prev, state: e.target.value }))}
                    className="mt-1"
                    data-testid="input-recruiter-state"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="conference">Conference</Label>
                <Input
                  id="conference"
                  placeholder="e.g., SEC, Big 10 (optional)"
                  value={recruiterForm.conference}
                  onChange={(e) => setRecruiterForm(prev => ({ ...prev, conference: e.target.value }))}
                  className="mt-1"
                  data-testid="input-conference"
                />
              </div>

              <div>
                <Label htmlFor="recruiterBio">Bio</Label>
                <Textarea
                  id="recruiterBio"
                  placeholder="Tell us about yourself (optional)"
                  value={recruiterForm.bio}
                  onChange={(e) => setRecruiterForm(prev => ({ ...prev, bio: e.target.value }))}
                  className="mt-1"
                  data-testid="input-recruiter-bio"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
                data-testid="button-create-recruiter-profile"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ChevronRight className="w-4 h-4 mr-2" />
                )}
                Create Recruiter Profile
              </Button>
            </form>
          </Card>
        ) : selectedRole === 'player' ? (
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
                <Label>Position(s) * <span className="text-xs text-muted-foreground font-normal">(Select all that apply)</span></Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {getPositionsForSport().map((pos) => (
                    <div
                      key={pos}
                      onClick={() => togglePosition(pos)}
                      className={`
                        cursor-pointer rounded-lg border p-2 text-center text-sm font-medium transition-all
                        ${playerForm.positions.includes(pos)
                          ? 'border-accent bg-accent/10 text-foreground'
                          : 'border-border bg-secondary/30 text-muted-foreground hover:border-border hover:bg-secondary/50'
                        }
                      `}
                      data-testid={`position-${pos.toLowerCase()}`}
                    >
                      {getPositionLabel(pos)}
                    </div>
                  ))}
                </div>
                {playerForm.positions.length > 0 && (
                  <p className="text-xs text-accent mt-2">
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
                  <Users className="w-4 h-4 text-accent" />
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
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <Plus className="w-8 h-8 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-display text-foreground tracking-wide uppercase">Create a Team</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Start fresh and invite your players
                    </p>
                  </div>
                  <Button variant="outline" className="w-full" disabled={isLoading} data-testid="button-create-team-card">
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
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <Users className="w-8 h-8 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-display text-foreground tracking-wide uppercase">Join Existing Team</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Have a team code? Join your team
                    </p>
                  </div>
                  <Button variant="outline" className="w-full" disabled={isLoading} data-testid="button-join-team-card">
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card 
              className="p-6 bg-card border-border hover-elevate cursor-pointer group"
              onClick={handlePlayerSelect}
              data-testid="card-select-player"
            >
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <UserCircle className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-display text-foreground tracking-wide uppercase">I'm a Player</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Track my own stats, earn badges, and level up my game
                  </p>
                </div>
                <Button variant="outline" className="w-full" disabled={isLoading} data-testid="button-select-player">
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
                <div className="mx-auto w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <ClipboardList className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-display text-foreground tracking-wide uppercase">I'm a Coach</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage my roster, analyze players, and scout talent
                  </p>
                </div>
                <Button variant="outline" className="w-full" disabled={isLoading} data-testid="button-select-coach">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Select Coach"}
                </Button>
              </div>
            </Card>

            <Card 
              className="p-6 bg-card border-border hover-elevate cursor-pointer group"
              onClick={handleRecruiterSelect}
              data-testid="card-select-recruiter"
            >
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <GraduationCap className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-display text-foreground tracking-wide uppercase">I'm a Recruiter</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Discover talented players, track prospects, and connect with recruits
                  </p>
                </div>
                <Button variant="outline" className="w-full" disabled={isLoading} data-testid="button-select-recruiter">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Select Recruiter"}
                </Button>
              </div>
            </Card>

            <Card 
              className="p-6 bg-card border-border hover-elevate cursor-pointer group"
              onClick={handleGuardianSelect}
              data-testid="card-select-guardian"
            >
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <Heart className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-display text-foreground tracking-wide uppercase">I'm a Parent</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Follow my child's progress, milestones, and achievements
                  </p>
                </div>
                <Button variant="outline" className="w-full" disabled={isLoading} data-testid="button-select-guardian">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Select Guardian"}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
