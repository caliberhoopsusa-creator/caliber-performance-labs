import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Paywall } from "@/components/Paywall";
import {
  useOpponents,
  useOpponent,
  useCreateOpponent,
  useUpdateOpponent,
  useDeleteOpponent,
  useTeamDashboard,
  type Opponent,
  type CreateOpponentInput,
} from "@/hooks/use-basketball";
import {
  Plus,
  Search,
  Users,
  User,
  Filter,
  Edit,
  Trash2,
  ChevronLeft,
  Target,
  TrendingUp,
  AlertTriangle,
  FileText,
  Gamepad2,
} from "lucide-react";

type FilterType = "all" | "team" | "player";

export default function OpponentScouting() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [selectedOpponentId, setSelectedOpponentId] = useState<number | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: opponents, isLoading } = useOpponents();

  const filteredOpponents = opponents?.filter((opp) => {
    const matchesSearch = opp.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || opp.opponentType === filterType;
    return matchesSearch && matchesFilter;
  }) || [];

  if (selectedOpponentId) {
    return (
      <OpponentDetailView
        opponentId={selectedOpponentId}
        onBack={() => setSelectedOpponentId(null)}
        onEdit={() => setIsEditDialogOpen(true)}
      />
    );
  }

  return (
    <Paywall requiredTier="coach_pro" featureName="Opponent Scouting">
      <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-wide from-white to-accent/20" data-testid="page-title">
            Opponent Scouting
          </h1>
          <p className="text-accent/50 mt-1">
            Track and analyze opposing teams and players
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-opponent">
              <Plus className="w-4 h-4 mr-2" />
              Add Opponent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Opponent</DialogTitle>
            </DialogHeader>
            <OpponentForm onSuccess={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search opponents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-opponents"
          />
        </div>
        <Select value={filterType} onValueChange={(val) => setFilterType(val as FilterType)}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-filter-type">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" data-testid="filter-all">All Types</SelectItem>
            <SelectItem value="team" data-testid="filter-team">Teams Only</SelectItem>
            <SelectItem value="player" data-testid="filter-player">Players Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredOpponents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Opponents Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterType !== "all"
                ? "No opponents match your search criteria"
                : "Start scouting by adding your first opponent"}
            </p>
            {!searchQuery && filterType === "all" && (
              <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-first-opponent">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Opponent
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOpponents.map((opponent) => (
            <OpponentCard
              key={opponent.id}
              opponent={opponent}
              onClick={() => setSelectedOpponentId(opponent.id)}
            />
          ))}
        </div>
      )}

      {selectedOpponentId && (
        <EditOpponentDialog
          opponentId={selectedOpponentId}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
        />
      )}
      </div>
    </Paywall>
  );
}

function OpponentCard({ opponent, onClick }: { opponent: Opponent; onClick: () => void }) {
  const isTeam = opponent.opponentType === "team";

  return (
    <Card 
      className="hover-elevate cursor-pointer transition-all"
      onClick={onClick}
      data-testid={`card-opponent-${opponent.id}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isTeam ? "bg-blue-500/10 text-blue-500" : "bg-accent/10 text-accent"}`}>
              {isTeam ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-semibold" data-testid={`opponent-name-${opponent.id}`}>
                {opponent.name}
              </h3>
              {opponent.position && (
                <p className="text-sm text-muted-foreground">{opponent.position}</p>
              )}
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {isTeam ? "Team" : "Player"}
          </Badge>
        </div>

        <QuickNotes opponent={opponent} compact />
      </CardContent>
    </Card>
  );
}

function QuickNotes({ opponent, compact = false }: { opponent: Opponent; compact?: boolean }) {
  const strengthPoints = opponent.strengths?.split("\n").filter(Boolean) || [];
  const weaknessPoints = opponent.weaknesses?.split("\n").filter(Boolean) || [];

  if (!opponent.strengths && !opponent.weaknesses && compact) {
    return (
      <p className="text-sm text-muted-foreground italic">No scouting notes yet</p>
    );
  }

  const maxPoints = compact ? 2 : 10;

  return (
    <div className={`space-y-3 ${compact ? "" : "mt-4"}`} data-testid="quick-notes-section">
      {strengthPoints.length > 0 && (
        <div>
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Strengths</span>
          </div>
          <div className="space-y-1">
            {strengthPoints.slice(0, maxPoints).map((point, i) => (
              <div 
                key={i} 
                className="text-sm pl-3 border-l-2 border-green-500/50 text-green-700 dark:text-green-300"
                data-testid={`strength-point-${i}`}
              >
                {point}
              </div>
            ))}
            {compact && strengthPoints.length > maxPoints && (
              <p className="text-xs text-muted-foreground">+{strengthPoints.length - maxPoints} more</p>
            )}
          </div>
        </div>
      )}

      {weaknessPoints.length > 0 && (
        <div>
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Weaknesses</span>
          </div>
          <div className="space-y-1">
            {weaknessPoints.slice(0, maxPoints).map((point, i) => (
              <div 
                key={i} 
                className="text-sm pl-3 border-l-2 border-red-500/50 text-red-700 dark:text-red-300"
                data-testid={`weakness-point-${i}`}
              >
                {point}
              </div>
            ))}
            {compact && weaknessPoints.length > maxPoints && (
              <p className="text-xs text-muted-foreground">+{weaknessPoints.length - maxPoints} more</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function OpponentDetailView({ 
  opponentId, 
  onBack,
  onEdit 
}: { 
  opponentId: number; 
  onBack: () => void;
  onEdit: () => void;
}) {
  const { data: opponent, isLoading } = useOpponent(opponentId);
  const { data: teamDashboard } = useTeamDashboard();
  const deleteOpponent = useDeleteOpponent();
  const { toast } = useToast();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const gamesAgainst = teamDashboard?.recentGames?.filter(game => 
    game.opponent.toLowerCase().includes(opponent?.name.toLowerCase() || "")
  ) || [];

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${opponent?.name}?`)) return;
    
    try {
      await deleteOpponent.mutateAsync(opponentId);
      toast({
        title: "Opponent Deleted",
        description: `${opponent?.name} has been removed from your scouting list.`,
      });
      onBack();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete opponent",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!opponent) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Opponent not found</p>
        <Button variant="ghost" onClick={onBack} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const isTeam = opponent.opponentType === "team";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${isTeam ? "bg-blue-500/10 text-blue-500" : "bg-accent/10 text-accent"}`}>
              {isTeam ? <Users className="w-6 h-6" /> : <User className="w-6 h-6" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display" data-testid="detail-opponent-name">
                {opponent.name}
              </h1>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{isTeam ? "Team" : "Player"}</Badge>
                {opponent.position && (
                  <span className="text-sm text-muted-foreground">{opponent.position}</span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-edit-opponent">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit Opponent</DialogTitle>
              </DialogHeader>
              <OpponentForm 
                opponent={opponent} 
                onSuccess={() => setIsEditOpen(false)} 
              />
            </DialogContent>
          </Dialog>
          <Button 
            variant="destructive" 
            size="icon" 
            onClick={handleDelete}
            disabled={deleteOpponent.isPending}
            data-testid="button-delete-opponent"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Scouting Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {opponent.tendencies && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Tendencies
                </h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid="opponent-tendencies">
                  {opponent.tendencies}
                </p>
              </div>
            )}

            <QuickNotes opponent={opponent} />

            {opponent.notes && (
              <div>
                <h4 className="font-semibold mb-2">Additional Notes</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid="opponent-notes">
                  {opponent.notes}
                </p>
              </div>
            )}

            {!opponent.tendencies && !opponent.strengths && !opponent.weaknesses && !opponent.notes && (
              <p className="text-muted-foreground italic text-center py-4">
                No scouting information added yet. Click Edit to add details.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5" />
              Games Against
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gamesAgainst.length === 0 ? (
              <p className="text-muted-foreground italic text-center py-4">
                No games found against {opponent.name}
              </p>
            ) : (
              <div className="space-y-3" data-testid="games-against-list">
                {gamesAgainst.slice(0, 10).map((game, i) => (
                  <div 
                    key={`${game.id}-${i}`}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    data-testid={`game-against-${game.id}`}
                  >
                    <div>
                      <p className="font-medium text-sm">{game.playerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(game.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {game.points} PTS, {game.rebounds} REB, {game.assists} AST
                      </p>
                      {game.grade && (
                        <Badge variant="outline" className="text-xs">
                          Grade: {game.grade}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {gamesAgainst.length > 10 && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{gamesAgainst.length - 10} more games
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OpponentForm({ 
  opponent, 
  onSuccess 
}: { 
  opponent?: Opponent; 
  onSuccess: () => void;
}) {
  const [name, setName] = useState(opponent?.name || "");
  const [opponentType, setOpponentType] = useState(opponent?.opponentType || "team");
  const [position, setPosition] = useState(opponent?.position || "");
  const [tendencies, setTendencies] = useState(opponent?.tendencies || "");
  const [strengths, setStrengths] = useState(opponent?.strengths || "");
  const [weaknesses, setWeaknesses] = useState(opponent?.weaknesses || "");
  const [notes, setNotes] = useState(opponent?.notes || "");

  const createOpponent = useCreateOpponent();
  const updateOpponent = useUpdateOpponent();
  const { toast } = useToast();

  const isEditing = !!opponent;
  const isPending = createOpponent.isPending || updateOpponent.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    const data: CreateOpponentInput = {
      name: name.trim(),
      opponentType,
      position: opponentType === "player" ? position.trim() || null : null,
      tendencies: tendencies.trim() || null,
      strengths: strengths.trim() || null,
      weaknesses: weaknesses.trim() || null,
      notes: notes.trim() || null,
    };

    try {
      if (isEditing) {
        await updateOpponent.mutateAsync({ id: opponent.id, updates: data });
        toast({
          title: "Opponent Updated",
          description: `${name} has been updated.`,
        });
      } else {
        await createOpponent.mutateAsync(data);
        toast({
          title: "Opponent Added",
          description: `${name} has been added to your scouting list.`,
        });
      }
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} opponent`,
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter opponent name"
          data-testid="input-opponent-name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Select value={opponentType} onValueChange={setOpponentType}>
          <SelectTrigger data-testid="select-opponent-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="team">Team</SelectItem>
            <SelectItem value="player">Player</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {opponentType === "player" && (
        <div className="space-y-2">
          <Label htmlFor="position">Position</Label>
          <Select value={position} onValueChange={setPosition}>
            <SelectTrigger data-testid="select-opponent-position">
              <SelectValue placeholder="Select position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Guard">Guard</SelectItem>
              <SelectItem value="Wing">Wing</SelectItem>
              <SelectItem value="Big">Big</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="tendencies">Tendencies</Label>
        <Textarea
          id="tendencies"
          value={tendencies}
          onChange={(e) => setTendencies(e.target.value)}
          placeholder="Describe their typical plays, movements, or patterns..."
          rows={3}
          data-testid="textarea-tendencies"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="strengths">Strengths (one per line)</Label>
        <Textarea
          id="strengths"
          value={strengths}
          onChange={(e) => setStrengths(e.target.value)}
          placeholder="Strong three-point shooting&#10;Excellent ball handling&#10;Good court vision"
          rows={3}
          className="text-green-700 dark:text-green-300"
          data-testid="textarea-strengths"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="weaknesses">Weaknesses (one per line)</Label>
        <Textarea
          id="weaknesses"
          value={weaknesses}
          onChange={(e) => setWeaknesses(e.target.value)}
          placeholder="Struggles going left&#10;Poor free throw shooter&#10;Gets winded late in games"
          rows={3}
          className="text-red-700 dark:text-red-300"
          data-testid="textarea-weaknesses"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any other observations or notes..."
          rows={3}
          data-testid="textarea-notes"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isPending} data-testid="button-submit-opponent">
          {isPending ? "Saving..." : isEditing ? "Update Opponent" : "Add Opponent"}
        </Button>
      </div>
    </form>
  );
}

function EditOpponentDialog({
  opponentId,
  isOpen,
  onClose,
}: {
  opponentId: number;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { data: opponent } = useOpponent(opponentId);

  if (!opponent) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Opponent</DialogTitle>
        </DialogHeader>
        <OpponentForm opponent={opponent} onSuccess={onClose} />
      </DialogContent>
    </Dialog>
  );
}
