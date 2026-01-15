import { useState } from "react";
import { usePlayers, useCreatePlayer } from "@/hooks/use-basketball";
import { Link } from "wouter";
import { Search, Plus, UserPlus, Trash2, ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertPlayerSchema } from "@shared/schema";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function PlayersList() {
  const { data: players, isLoading } = usePlayers();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
            <button className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0">
              <UserPlus className="w-5 h-5" />
              Add Player
            </button>
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
        <input 
          type="text" 
          placeholder="Search players by name or team..." 
          className="w-full bg-card border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlayers.map((player) => (
            <Link key={player.id} href={`/players/${player.id}`} className="group relative block h-full">
              <div className="h-full bg-card border border-white/5 rounded-2xl p-6 shadow-lg transition-all duration-300 hover:border-primary/50 hover:shadow-primary/5 hover:-translate-y-1 overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-secondary/80 p-1.5 rounded-lg text-white">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
                
                <div className="flex items-start justify-between mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-secondary to-background border-2 border-white/10 flex items-center justify-center text-2xl font-display font-bold text-white shadow-inner">
                    {player.jerseyNumber || "#"}
                  </div>
                  <div className="bg-secondary/30 px-3 py-1 rounded-full border border-white/5">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">{player.position}</span>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold font-display text-white mb-1 group-hover:text-primary transition-colors truncate">{player.name}</h3>
                <p className="text-sm text-muted-foreground mb-4 font-medium">{player.team || "No Team"} • {player.height || "N/A"}</p>
                
                <div className="pt-4 border-t border-white/5 flex justify-between items-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <span>View Analytics</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
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
