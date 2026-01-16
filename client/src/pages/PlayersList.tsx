import { useState } from "react";
import { usePlayers, useCreatePlayer, useDeletePlayer } from "@/hooks/use-basketball";
import { Link } from "wouter";
import { Search, Plus, UserPlus, Trash2, ChevronRight, MoreVertical, Pencil, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertPlayerSchema } from "@shared/schema";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function PlayersList() {
  const { data: players, isLoading } = usePlayers();
  const { mutate: deletePlayer, isPending: isDeleting } = useDeletePlayer();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<{ id: number; name: string } | null>(null);

  const handleDeletePlayer = (playerId: number, playerName: string) => {
    deletePlayer(playerId, {
      onSuccess: () => {
        toast({
          title: "Player Removed",
          description: `${playerName} has been removed from your roster.`,
        });
        setPlayerToDelete(null);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to delete player. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  const filteredPlayers = players?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.team?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white uppercase tracking-tight">Roster</h2>
          <p className="text-muted-foreground font-medium">Manage your team and player profiles</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-add-player">
              <UserPlus className="w-5 h-5" />
              Add Player
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display uppercase tracking-wide">New Player</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Add a player to your roster to start tracking their stats.
              </DialogDescription>
            </DialogHeader>
            <CreatePlayerForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input 
          type="text" 
          placeholder="Search players by name or team..." 
          className="w-full bg-card border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-muted-foreground"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-players"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-2xl bg-card/30">
          <div className="bg-secondary/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No players found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6">
            {search ? "Try adjusting your search terms." : "Get started by adding players to your roster."}
          </p>
          {!search && (
            <Button onClick={() => setIsDialogOpen(true)} variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
              Add First Player
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlayers.map((player) => (
              <div key={player.id} className="group relative h-full">
                <div className="h-full bg-card border border-white/5 rounded-2xl p-6 shadow-lg transition-all duration-300 hover:border-primary/50 hover:shadow-primary/5 overflow-hidden">
                  <div className="absolute top-3 right-3 z-20">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-8 h-8 text-muted-foreground hover:text-white"
                          data-testid={`button-player-menu-${player.id}`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-white/10 text-white">
                        <DropdownMenuItem
                          onClick={() => navigate(`/players/${player.id}`)}
                          className="gap-2 cursor-pointer"
                          data-testid={`menu-view-player-${player.id}`}
                        >
                          <Eye className="w-4 h-4" /> View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate(`/players/${player.id}?edit=true`)}
                          className="gap-2 cursor-pointer"
                          data-testid={`menu-edit-player-${player.id}`}
                        >
                          <Pencil className="w-4 h-4" /> Edit Profile
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem
                          onClick={() => setPlayerToDelete({ id: player.id, name: player.name })}
                          className="gap-2 cursor-pointer text-red-400 focus:text-red-300 focus:bg-red-500/10"
                          data-testid={`menu-delete-player-${player.id}`}
                        >
                          <Trash2 className="w-4 h-4" /> Delete Player
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <Link href={`/players/${player.id}`} className="block">
                    <div className="flex items-start justify-between mb-6 pr-8">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-secondary to-background border-2 border-white/10 flex items-center justify-center text-2xl font-display font-bold text-white shadow-inner">
                        {player.jerseyNumber || "#"}
                      </div>
                      <div className="bg-secondary/30 px-3 py-1 rounded-full border border-white/5">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">{player.position}</span>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold font-display text-white mb-1 group-hover:text-primary transition-colors truncate">{player.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4 font-medium">{player.team || "No Team"} • {player.height || "N/A"}</p>
                  </Link>
                  
                  <div className="pt-4 border-t border-white/5 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/players/${player.id}`)}
                      className="flex-1 gap-1.5"
                      data-testid={`button-view-player-${player.id}`}
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/players/${player.id}?edit=true`)}
                      className="flex-1 gap-1.5"
                      data-testid={`button-edit-player-${player.id}`}
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPlayerToDelete({ id: player.id, name: player.name })}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/30"
                      data-testid={`button-delete-player-${player.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <AlertDialog open={!!playerToDelete} onOpenChange={(open) => !open && setPlayerToDelete(null)}>
            <AlertDialogContent className="bg-card border-white/10 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-display">Remove Player</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  Are you sure you want to remove <span className="text-white font-semibold">{playerToDelete?.name}</span> from your roster? 
                  This will also delete all of their game history and stats. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-secondary/30 border-white/10 text-white hover:bg-secondary/50">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => playerToDelete && handleDeletePlayer(playerToDelete.id, playerToDelete.name)}
                  disabled={isDeleting}
                  className="bg-red-500 hover:bg-red-600 text-white"
                  data-testid="button-confirm-delete"
                >
                  {isDeleting ? "Removing..." : "Remove Player"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}

function CreatePlayerForm({ onSuccess }: { onSuccess: () => void }) {
  const { mutate, isPending } = useCreatePlayer();
  
  const form = useForm<z.infer<typeof insertPlayerSchema>>({
    resolver: zodResolver(insertPlayerSchema),
    defaultValues: {
      name: "",
      position: "Guard",
      height: "",
      team: "",
      jerseyNumber: undefined,
    }
  });

  const onSubmit = (data: z.infer<typeof insertPlayerSchema>) => {
    mutate(data, {
      onSuccess: () => {
        form.reset();
        onSuccess();
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
      <div className="space-y-2">
        <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Full Name</label>
        <Input {...form.register("name")} placeholder="LeBron James" className="bg-secondary/30 border-white/10 text-white placeholder:text-white/20" />
        {form.formState.errors.name && <p className="text-red-400 text-xs">{form.formState.errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Position</label>
          <Select onValueChange={(val) => form.setValue("position", val)} defaultValue="Guard">
            <SelectTrigger className="bg-secondary/30 border-white/10 text-white">
              <SelectValue placeholder="Position" />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10 text-white">
              <SelectItem value="Guard">Guard</SelectItem>
              <SelectItem value="Wing">Wing</SelectItem>
              <SelectItem value="Big">Big</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Jersey #</label>
          <Input 
            type="number" 
            {...form.register("jerseyNumber", { valueAsNumber: true })} 
            placeholder="23" 
            className="bg-secondary/30 border-white/10 text-white placeholder:text-white/20" 
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Height</label>
          <Input {...form.register("height")} placeholder="6'8" className="bg-secondary/30 border-white/10 text-white placeholder:text-white/20" />
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Team</label>
          <Input {...form.register("team")} placeholder="Lakers" className="bg-secondary/30 border-white/10 text-white placeholder:text-white/20" />
        </div>
      </div>

      <DialogFooter className="pt-4">
        <Button type="submit" disabled={isPending} className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90">
          {isPending ? "Adding..." : "Add to Roster"}
        </Button>
      </DialogFooter>
    </form>
  );
}
