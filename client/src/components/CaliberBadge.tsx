import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Award, Crown, Star, Sparkles, Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CaliberBadgeProps {
  playerId: number;
  isOwner?: boolean;
  showControls?: boolean;
  size?: "sm" | "md" | "lg";
}

const categoryConfig = {
  excellence: { label: "Excellence", icon: Crown, color: "from-amber-400 to-yellow-500" },
  dedication: { label: "Dedication", icon: Star, color: "from-blue-400 to-cyan-500" },
  leadership: { label: "Leadership", icon: Shield, color: "from-purple-400 to-pink-500" },
  potential: { label: "High Potential", icon: Sparkles, color: "from-emerald-400 to-green-500" },
};

export function CaliberBadge({ playerId, isOwner = false, showControls = false, size = "md" }: CaliberBadgeProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [category, setCategory] = useState<string>("excellence");
  const [reason, setReason] = useState("");

  const { data, isLoading } = useQuery<{ badge: any }>({
    queryKey: ["/api/players", playerId, "caliber-badge"],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}/caliber-badge`);
      return res.json();
    },
  });

  const awardMutation = useMutation({
    mutationFn: async (data: { category: string; reason: string }) => {
      return apiRequest("POST", `/api/players/${playerId}/caliber-badge`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players", playerId, "caliber-badge"] });
      toast({ title: "Caliber Badge Awarded", description: "The player has been recognized with a Caliber badge." });
      setIsDialogOpen(false);
      setReason("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to award badge", variant: "destructive" });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/players/${playerId}/caliber-badge`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players", playerId, "caliber-badge"] });
      toast({ title: "Badge Revoked", description: "The Caliber badge has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to revoke badge", variant: "destructive" });
    },
  });

  if (isLoading) return null;

  const badge = data?.badge;
  const config = badge ? categoryConfig[badge.category as keyof typeof categoryConfig] || categoryConfig.excellence : null;
  const IconComponent = config?.icon || Award;

  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-12 w-12 text-base",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-6 w-6",
  };

  if (!badge && !showControls) return null;

  return (
    <div className="inline-flex items-center gap-2">
      {badge && (
        <div className="relative group" data-testid="caliber-badge-display">
          <div
            className={`relative flex items-center justify-center ${sizeClasses[size]} rounded-full bg-gradient-to-br ${config?.color} shadow-lg ring-2 ring-white/20`}
            style={{
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent" />
            <IconComponent className={`${iconSizes[size]} text-white drop-shadow-md relative z-10`} />
            <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-white/20 to-transparent blur-sm opacity-50" />
          </div>
          
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <div className="bg-card/95 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
              <div className="flex items-center gap-2 text-xs font-medium">
                <Award className="h-3 w-3 text-amber-400" />
                <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
                  Caliber Certified
                </span>
              </div>
              {badge.reason && (
                <p className="text-xs text-muted-foreground mt-1 max-w-48 truncate">{badge.reason}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showControls && isOwner && (
        <>
          {!badge ? (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                  data-testid="button-award-caliber-badge"
                >
                  <Award className="h-3.5 w-3.5" />
                  Award Caliber Badge
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-400" />
                    Award Caliber Badge
                  </DialogTitle>
                  <DialogDescription>
                    Recognize this player with official Caliber certification.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger data-testid="select-badge-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryConfig).map(([key, cfg]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <cfg.icon className="h-4 w-4" />
                              {cfg.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Recognition Reason (optional)</label>
                    <Textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Why is this player being recognized?"
                      className="resize-none"
                      data-testid="input-badge-reason"
                    />
                  </div>
                  <Button
                    onClick={() => awardMutation.mutate({ category, reason })}
                    disabled={awardMutation.isPending}
                    className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold"
                    data-testid="button-confirm-award-badge"
                  >
                    {awardMutation.isPending ? "Awarding..." : "Award Badge"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-muted-foreground hover:text-destructive"
              onClick={() => revokeMutation.mutate()}
              disabled={revokeMutation.isPending}
              data-testid="button-revoke-caliber-badge"
            >
              <X className="h-3.5 w-3.5" />
              Revoke
            </Button>
          )}
        </>
      )}
    </div>
  );
}

export function CaliberBadgeInline({ playerId }: { playerId: number }) {
  const { data } = useQuery<{ badge: any }>({
    queryKey: ["/api/players", playerId, "caliber-badge"],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}/caliber-badge`);
      return res.json();
    },
  });

  if (!data?.badge) return null;

  return (
    <Badge
      variant="outline"
      className="gap-1 border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 text-amber-400"
      data-testid="badge-caliber-inline"
    >
      <Award className="h-3 w-3" />
      Caliber Certified
    </Badge>
  );
}
