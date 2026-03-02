import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  UserPlus,
  Check,
  X,
  Loader2,
  Link2,
  Copy,
  Shield,
  Clock,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GuardianLink } from "@shared/schema";

function InviteFamilyMember({ playerId }: { playerId: number }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const { data: inviteData, isLoading } = useQuery<{ code: string; playerId: number }>({
    queryKey: ["/api/players", playerId, "family-invite-code"],
  });

  const handleCopy = async () => {
    if (!inviteData?.code) return;
    try {
      await navigator.clipboard.writeText(inviteData.code);
      setCopied(true);
      toast({ title: "Copied!", description: "Invite code copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Copy failed",
        description: "Please manually copy the code.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-4" data-testid="invite-family-member">
      <div className="flex items-center gap-2 mb-3">
        <Heart className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold uppercase tracking-wide">Invite Family Member</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Share this code with a parent or guardian so they can follow your progress on their Family Dashboard.
      </p>
      {isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : inviteData?.code ? (
        <div className="flex gap-2">
          <Input
            value={inviteData.code}
            readOnly
            className="font-mono uppercase flex-1 text-center font-bold tracking-wider"
            data-testid="text-invite-code"
          />
          <Button
            variant="outline"
            onClick={handleCopy}
            data-testid="button-copy-invite-code"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Unable to generate invite code.</p>
      )}
    </Card>
  );
}

interface GuardianLinkManagerProps {
  mode: "guardian" | "player";
  playerId?: number;
}

export function GuardianLinkManager({ mode, playerId }: GuardianLinkManagerProps) {
  const [inviteCode, setInviteCode] = useState("");
  const [relationship, setRelationship] = useState("parent");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingRequests, isLoading: loadingPending } = useQuery<GuardianLink[]>({
    queryKey: ["/api/guardian/pending"],
    enabled: mode === "player",
  });

  const { data: guardians, isLoading: loadingGuardians } = useQuery<GuardianLink[]>({
    queryKey: ["/api/players", playerId, "guardians"],
    enabled: mode === "player" && !!playerId,
  });

  const requestLinkMutation = useMutation({
    mutationFn: async (data: { inviteCode?: string; playerId?: number; relationship: string }) => {
      return await apiRequest("POST", "/api/guardian/request", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guardian/players"] });
      setInviteCode("");
      toast({
        title: "Request Sent",
        description: "Your link request has been sent to the player for approval.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send link request",
        variant: "destructive",
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (linkId: number) => {
      return await apiRequest("PATCH", `/api/guardian/links/${linkId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guardian/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players", playerId, "guardians"] });
      toast({ title: "Approved", description: "Guardian link has been approved." });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve link",
        variant: "destructive",
      });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (linkId: number) => {
      return await apiRequest("PATCH", `/api/guardian/links/${linkId}/revoke`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guardian/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/guardian/players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players", playerId, "guardians"] });
      toast({ title: "Revoked", description: "Guardian link has been revoked." });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke link",
        variant: "destructive",
      });
    },
  });

  const handleSubmitCode = () => {
    if (!inviteCode.trim()) {
      toast({
        title: "Missing Code",
        description: "Please enter an invite code.",
        variant: "destructive",
      });
      return;
    }
    requestLinkMutation.mutate({ inviteCode: inviteCode.trim(), relationship });
  };

  if (mode === "guardian") {
    return (
      <Card className="p-4" data-testid="guardian-link-manager">
        <div className="flex items-center gap-2 mb-3">
          <Link2 className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold uppercase tracking-wide">Link a Player</h3>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Enter invite code (e.g., FAM-A1B2C3)"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            className="uppercase flex-1 font-mono"
            data-testid="input-invite-code"
          />
          <Button
            onClick={handleSubmitCode}
            disabled={requestLinkMutation.isPending}
            data-testid="button-link-player"
          >
            {requestLinkMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4 mr-1" />
            )}
            Link
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Ask your player for their invite code from their profile settings.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="player-guardian-manager">
      {playerId && <InviteFamilyMember playerId={playerId} />}
      {loadingPending ? (
        <Card className="p-4">
          <Skeleton className="h-5 w-40 mb-3" />
          <Skeleton className="h-10 w-full" />
        </Card>
      ) : pendingRequests && pendingRequests.length > 0 ? (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-yellow-500" />
            <h3 className="text-sm font-semibold uppercase tracking-wide">
              Pending Requests ({pendingRequests.length})
            </h3>
          </div>
          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-secondary/20 px-3 py-2"
                data-testid={`pending-request-${req.id}`}
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium capitalize">{req.relationship}</span>
                  <Badge variant="outline" className="text-xs">
                    Pending
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => approveMutation.mutate(req.id)}
                    disabled={approveMutation.isPending}
                    data-testid={`button-approve-${req.id}`}
                  >
                    <Check className="w-4 h-4 text-green-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => revokeMutation.mutate(req.id)}
                    disabled={revokeMutation.isPending}
                    data-testid={`button-deny-${req.id}`}
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {loadingGuardians ? (
        <Card className="p-4">
          <Skeleton className="h-5 w-40 mb-3" />
          <Skeleton className="h-10 w-full" />
        </Card>
      ) : guardians && guardians.length > 0 ? (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold uppercase tracking-wide">
              Linked Guardians ({guardians.filter((g) => g.status === "approved").length})
            </h3>
          </div>
          <div className="space-y-2">
            {guardians
              .filter((g) => g.status === "approved")
              .map((guardian) => (
                <div
                  key={guardian.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-secondary/20 px-3 py-2"
                  data-testid={`guardian-${guardian.id}`}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-accent" />
                    <span className="text-sm font-medium capitalize">{guardian.relationship}</span>
                    <Badge variant="secondary" className="text-xs">
                      Active
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => revokeMutation.mutate(guardian.id)}
                    disabled={revokeMutation.isPending}
                    data-testid={`button-revoke-${guardian.id}`}
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
