import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, UserCircle, ClipboardList, ChevronRight, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type RoleType = 'player' | 'coach' | null;

export default function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState<RoleType>(null);
  const [playerForm, setPlayerForm] = useState({
    name: '',
    position: '' as '' | 'Guard' | 'Wing' | 'Big',
    height: '',
    team: '',
    jerseyNumber: '',
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    mutationFn: async (data: typeof playerForm) => {
      return await apiRequest('POST', '/api/users/create-player-profile', {
        name: data.name,
        position: data.position,
        height: data.height || undefined,
        team: data.team || undefined,
        jerseyNumber: data.jerseyNumber ? parseInt(data.jerseyNumber) : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/players'] });
      toast({
        title: "Profile Created",
        description: "Your player profile has been created!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create player profile",
        variant: "destructive",
      });
    },
  });

  const handleCoachSelect = async () => {
    await setRoleMutation.mutateAsync('coach');
  };

  const handlePlayerSelect = async () => {
    await setRoleMutation.mutateAsync('player');
    setSelectedRole('player');
  };

  const handlePlayerProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerForm.name || !playerForm.position) {
      toast({
        title: "Missing Information",
        description: "Please enter your name and position",
        variant: "destructive",
      });
      return;
    }
    await createPlayerMutation.mutateAsync(playerForm);
  };

  const isLoading = setRoleMutation.isPending || createPlayerMutation.isPending;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 mb-4">
            <Activity className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold font-display text-white tracking-wider uppercase">Welcome to Caliber</h1>
          <p className="text-muted-foreground mt-2">
            {selectedRole === 'player' 
              ? "Let's set up your player profile" 
              : "How will you be using Caliber?"}
          </p>
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
                <Label htmlFor="position">Position *</Label>
                <Select
                  value={playerForm.position}
                  onValueChange={(value) => setPlayerForm(prev => ({ ...prev, position: value as 'Guard' | 'Wing' | 'Big' }))}
                >
                  <SelectTrigger className="mt-1" data-testid="select-position">
                    <SelectValue placeholder="Select your position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Guard">Guard</SelectItem>
                    <SelectItem value="Wing">Wing</SelectItem>
                    <SelectItem value="Big">Big</SelectItem>
                  </SelectContent>
                </Select>
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
                <Label htmlFor="team">Team</Label>
                <Input
                  id="team"
                  placeholder="Your team name"
                  value={playerForm.team}
                  onChange={(e) => setPlayerForm(prev => ({ ...prev, team: e.target.value }))}
                  className="mt-1"
                  data-testid="input-team"
                />
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
