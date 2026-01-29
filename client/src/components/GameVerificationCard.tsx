import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Clock, 
  User, 
  Calendar, 
  Target,
  Shield,
  Video,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface GameData {
  id: number;
  playerId: number;
  playerName: string;
  playerPosition: string;
  sport: string;
  date: string;
  opponent: string;
  result: string | null;
  points?: number;
  rebounds?: number;
  assists?: number;
  passingYards?: number;
  rushingYards?: number;
  receivingYards?: number;
  tackles?: number;
  verificationStatus: string | null;
}

interface Props {
  game: GameData;
  onVerified?: () => void;
}

const VERIFICATION_METHODS = [
  { value: 'in_person', label: 'In Person', icon: User },
  { value: 'game_film', label: 'Game Film', icon: Video },
  { value: 'official_scoresheet', label: 'Official Scoresheet', icon: FileText },
];

export function GameVerificationCard({ game, onVerified }: Props) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState('in_person');

  const quickVerify = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', `/api/games/${game.id}/quick-verify`, {
        verificationMethod,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coach/unverified-games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/players', game.playerId, 'verified-games'] });
      toast({
        title: "Game Verified",
        description: `${game.playerName}'s game vs ${game.opponent} has been verified.`,
      });
      onVerified?.();
    },
    onError: () => {
      toast({
        title: "Verification Failed",
        description: "Could not verify this game. Please try again.",
        variant: "destructive",
      });
    },
  });

  const isBasketball = game.sport === 'basketball';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      layout
    >
      <Card className="p-4 bg-gradient-to-br from-black/60 to-black/30 border-white/10 hover:border-cyan-500/30 transition-colors">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-white truncate" data-testid={`text-player-name-${game.id}`}>
                {game.playerName}
              </span>
              <Badge variant="outline" className="text-xs border-white/20 capitalize">
                {game.playerPosition}
              </Badge>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  isBasketball ? "border-orange-500/30 text-orange-400" : "border-green-500/30 text-green-400"
                )}
              >
                {isBasketball ? "Basketball" : "Football"}
              </Badge>
            </div>
            
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(game.date).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Target className="w-3.5 h-3.5" />
                vs {game.opponent}
              </span>
              {game.result && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    game.result.startsWith('W') ? "border-emerald-500/30 text-emerald-400" : "border-red-500/30 text-red-400"
                  )}
                >
                  {game.result}
                </Badge>
              )}
            </div>

            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3"
              >
                <div className="grid grid-cols-3 gap-2 py-2 border-t border-white/10">
                  {isBasketball ? (
                    <>
                      <div className="text-center p-2 rounded bg-white/5">
                        <p className="text-xs text-muted-foreground">Points</p>
                        <p className="text-lg font-bold text-white">{game.points ?? 0}</p>
                      </div>
                      <div className="text-center p-2 rounded bg-white/5">
                        <p className="text-xs text-muted-foreground">Rebounds</p>
                        <p className="text-lg font-bold text-white">{game.rebounds ?? 0}</p>
                      </div>
                      <div className="text-center p-2 rounded bg-white/5">
                        <p className="text-xs text-muted-foreground">Assists</p>
                        <p className="text-lg font-bold text-white">{game.assists ?? 0}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-center p-2 rounded bg-white/5">
                        <p className="text-xs text-muted-foreground">Pass Yds</p>
                        <p className="text-lg font-bold text-white">{game.passingYards ?? 0}</p>
                      </div>
                      <div className="text-center p-2 rounded bg-white/5">
                        <p className="text-xs text-muted-foreground">Rush Yds</p>
                        <p className="text-lg font-bold text-white">{game.rushingYards ?? 0}</p>
                      </div>
                      <div className="text-center p-2 rounded bg-white/5">
                        <p className="text-xs text-muted-foreground">Tackles</p>
                        <p className="text-lg font-bold text-white">{game.tackles ?? 0}</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-3">
                  <label className="text-xs text-muted-foreground mb-1 block">Verification Method</label>
                  <Select value={verificationMethod} onValueChange={setVerificationMethod}>
                    <SelectTrigger className="bg-black/40 border-white/10" data-testid={`select-method-${game.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VERIFICATION_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          <span className="flex items-center gap-2">
                            <method.icon className="w-4 h-4" />
                            {method.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              onClick={() => quickVerify.mutate()}
              disabled={quickVerify.isPending}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400"
              data-testid={`button-verify-${game.id}`}
            >
              {quickVerify.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Verify
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
              className="text-muted-foreground hover:text-white"
              data-testid={`button-expand-${game.id}`}
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {game.verificationStatus === 'pending' && (
          <div className="flex items-center gap-1 mt-2 text-xs text-amber-400">
            <Clock className="w-3 h-3" />
            Pending review
          </div>
        )}
      </Card>
    </motion.div>
  );
}
