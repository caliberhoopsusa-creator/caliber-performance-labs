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
  excellence: { label: "Excellence", icon: Crown },
  dedication: { label: "Dedication", icon: Star },
  leadership: { label: "Leadership", icon: Shield },
  potential: { label: "High Potential", icon: Sparkles },
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

  // Kintsugi gold vein pattern SVG
  const kintsugiPattern = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5 0L15 10M0 25L10 15L25 30M20 0L35 15L45 5M60 10L50 20L55 25M30 25L45 40L60 35M0 45L15 60M25 45L40 60M50 45L60 55M10 35L25 50M35 30L50 45M55 35L60 40' stroke='%23D4AF37' stroke-width='0.5' fill='none' opacity='0.6'/%3E%3C/svg%3E")`;

  return (
    <div className="inline-flex items-center gap-2">
      {badge && (
        <div className="relative group" data-testid="caliber-badge-display">
          {/* Main badge - Black with gold kintsugi veins */}
          <div
            className={`relative flex items-center justify-center ${sizeClasses[size]} rounded-full overflow-hidden`}
            style={{
              background: '#0a0a0a',
              boxShadow: '0 0 8px rgba(212, 175, 55, 0.3)',
            }}
          >
            {/* Kintsugi gold veins pattern */}
            <div 
              className="absolute inset-0 opacity-80"
              style={{ 
                backgroundImage: kintsugiPattern,
                backgroundSize: '30px 30px',
              }}
            />
            
            {/* Gold ring border */}
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                border: '1.5px solid transparent',
                background: 'linear-gradient(135deg, #D4AF37, #F5D76E, #D4AF37, #B8860B) border-box',
                WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
              }}
            />
            
            {/* Icon with gold gradient */}
            <IconComponent 
              className={`${iconSizes[size]} relative z-10`}
              style={{ 
                color: '#D4AF37',
                filter: 'drop-shadow(0 0 4px rgba(212, 175, 55, 0.6))',
              }}
            />
          </div>
          
          {/* Hover tooltip */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <div 
              className="backdrop-blur-sm rounded-lg px-3 py-2 shadow-xl whitespace-nowrap"
              style={{
                background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
              }}
            >
              <div className="flex items-center gap-2 text-xs font-medium">
                <Award className="h-3 w-3" style={{ color: '#D4AF37' }} />
                <span 
                  className="font-semibold"
                  style={{ 
                    background: 'linear-gradient(90deg, #D4AF37, #F5D76E, #D4AF37)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Caliber Certified
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: '#D4AF37' }}>
                {config?.label}
              </p>
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
                  className="gap-1.5 border-accent/30 text-accent hover:bg-accent/10"
                  data-testid="button-award-caliber-badge"
                >
                  <Award className="h-3.5 w-3.5" />
                  Award Caliber Badge
                </Button>
              </DialogTrigger>
              <DialogContent className="">
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
                    className="w-full bg-gradient-to-r from-accent to-accent/90 text-accent-foreground font-semibold"
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
      className="gap-1 border-accent/30 bg-gradient-to-r from-accent/10 to-accent/5 text-accent"
      data-testid="badge-caliber-inline"
    >
      <Award className="h-3 w-3" />
      Caliber Certified
    </Badge>
  );
}
