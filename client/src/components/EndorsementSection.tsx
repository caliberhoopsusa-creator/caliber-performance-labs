import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  MessageSquareQuote, Plus, Shield, Swords, Brain, 
  Dumbbell, Users, BookOpen, Star, Trash2, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";

interface Endorsement {
  id: number;
  playerId: number;
  coachUserId: string;
  coachName: string;
  skillCategory: string;
  content: string;
  createdAt: string;
}

const SKILL_CATEGORIES = [
  { value: "offense", label: "Offense", icon: Swords, color: "text-red-400" },
  { value: "defense", label: "Defense", icon: Shield, color: "text-blue-400" },
  { value: "leadership", label: "Leadership", icon: Star, color: "text-yellow-400" },
  { value: "work_ethic", label: "Work Ethic", icon: Dumbbell, color: "text-orange-400" },
  { value: "basketball_iq", label: "Game IQ", icon: Brain, color: "text-purple-400" },
  { value: "athleticism", label: "Athleticism", icon: Dumbbell, color: "text-emerald-400" },
  { value: "coachability", label: "Coachability", icon: BookOpen, color: "text-cyan-400" },
  { value: "teamwork", label: "Teamwork", icon: Users, color: "text-pink-400" },
];

function getCategoryInfo(category: string) {
  return SKILL_CATEGORIES.find(c => c.value === category) || SKILL_CATEGORIES[0];
}

interface EndorsementSectionProps {
  playerId: number;
  playerName: string;
}

export default function EndorsementSection({ playerId, playerName }: EndorsementSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [content, setContent] = useState("");
  const isCoach = user?.role === 'coach';

  const { data: endorsements = [], isLoading } = useQuery<Endorsement[]>({
    queryKey: ['/api/players', playerId, 'endorsements'],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}/endorsements`);
      if (!res.ok) throw new Error("Failed to fetch endorsements");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/endorsements", {
        playerId,
        skillCategory: selectedCategory,
        content,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/players', playerId, 'endorsements'] });
      setShowAddDialog(false);
      setSelectedCategory("");
      setContent("");
      toast({ title: "Endorsement Added", description: `Your endorsement for ${playerName} has been posted.` });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create endorsement.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/endorsements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/players', playerId, 'endorsements'] });
      toast({ title: "Endorsement Removed" });
    },
  });

  if (isLoading) return null;

  return (
    <div className="space-y-4" data-testid="section-endorsements">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <MessageSquareQuote className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-bold text-white">Coach Endorsements</h3>
          {endorsements.length > 0 && (
            <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 no-default-hover-elevate no-default-active-elevate">
              {endorsements.length}
            </Badge>
          )}
        </div>
        {isCoach && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 border-cyan-500/30 text-cyan-400" data-testid="button-add-endorsement">
                <Plus className="w-3 h-3" />
                Endorse
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-white/10">
              <DialogHeader>
                <DialogTitle>Endorse {playerName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Skill Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger data-testid="select-endorsement-category">
                      <SelectValue placeholder="Select a skill..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SKILL_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center gap-2">
                            <cat.icon className={cn("w-4 h-4", cat.color)} />
                            {cat.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Endorsement</Label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write a brief endorsement about this player's skills..."
                    className="min-h-[100px] bg-black/20 border-white/10"
                    maxLength={500}
                    data-testid="input-endorsement-content"
                  />
                  <p className="text-xs text-muted-foreground text-right">{content.length}/500</p>
                </div>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={!selectedCategory || !content.trim() || createMutation.isPending}
                  className="w-full gap-2"
                  data-testid="button-submit-endorsement"
                >
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquareQuote className="w-4 h-4" />}
                  Post Endorsement
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {endorsements.length === 0 ? (
        <Card className="p-6 text-center bg-black/20 border-white/5">
          <MessageSquareQuote className="w-10 h-10 mx-auto text-white/10 mb-2" />
          <p className="text-sm text-muted-foreground">
            {isCoach ? `Be the first to endorse ${playerName}!` : "No coach endorsements yet."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {endorsements.map(endorsement => {
            const catInfo = getCategoryInfo(endorsement.skillCategory);
            const CatIcon = catInfo.icon;
            const isOwn = user?.id === endorsement.coachUserId;
            
            return (
              <Card key={endorsement.id} className="p-4 bg-black/20 border-white/5" data-testid={`endorsement-${endorsement.id}`}>
                <div className="flex items-start gap-3">
                  <Avatar className="w-9 h-9 border border-white/10">
                    <AvatarFallback className="bg-cyan-500/20 text-cyan-400 text-xs font-bold">
                      {endorsement.coachName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-bold text-white">{endorsement.coachName}</span>
                      <Badge className={cn("text-[10px] no-default-hover-elevate no-default-active-elevate", catInfo.color, "bg-white/5 border-white/10")}>
                        <CatIcon className="w-3 h-3 mr-1" />
                        {catInfo.label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(endorsement.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed">{endorsement.content}</p>
                  </div>
                  {isOwn && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(endorsement.id)}
                      className="text-muted-foreground"
                      data-testid={`button-delete-endorsement-${endorsement.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
