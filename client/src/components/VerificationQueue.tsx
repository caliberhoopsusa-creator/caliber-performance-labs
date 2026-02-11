import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Filter,
  Inbox
} from "lucide-react";
import { GameVerificationCard } from "./GameVerificationCard";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";

interface UnverifiedGame {
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
  compact?: boolean;
  maxItems?: number;
}

export function VerificationQueue({ compact = false, maxItems }: Props) {
  const [sportFilter, setSportFilter] = useState<'all' | 'basketball' | 'football'>('all');
  
  const { data: unverifiedGames, isLoading, error } = useQuery<UnverifiedGame[]>({
    queryKey: ['/api/coach/unverified-games'],
  });

  const filteredGames = useMemo(() => {
    if (!unverifiedGames) return [];
    let games = [...unverifiedGames];
    
    if (sportFilter !== 'all') {
      games = games.filter(g => g.sport === sportFilter);
    }
    
    if (maxItems) {
      games = games.slice(0, maxItems);
    }
    
    return games;
  }, [unverifiedGames, sportFilter, maxItems]);

  const basketballCount = useMemo(() => 
    unverifiedGames?.filter(g => g.sport === 'basketball').length ?? 0, 
    [unverifiedGames]
  );
  
  const footballCount = useMemo(() => 
    unverifiedGames?.filter(g => g.sport === 'football').length ?? 0, 
    [unverifiedGames]
  );

  if (isLoading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-black/60 to-black/30 border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-gradient-to-br from-black/60 to-black/30 border-white/10">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>Failed to load verification queue</span>
          </div>
          <p className="text-sm text-white/60">
            This usually happens when your session has expired. Try logging out and back in.
          </p>
          <a 
            href="/api/logout" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 hover:bg-accent/30 border border-accent/30 rounded-lg text-accent text-sm font-medium transition-colors w-fit"
            data-testid="button-logout-refresh"
          >
            Logout & Refresh
          </a>
        </div>
      </Card>
    );
  }

  const totalUnverified = unverifiedGames?.length ?? 0;

  return (
    <Card className={cn(
      "bg-gradient-to-br from-black/60 to-black/30 border-white/10",
      compact ? "p-4" : "p-6"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-accent/20 border border-accent/30">
            <Shield className="w-4 h-4 text-accent" style={{ filter: "drop-shadow(0 0 6px rgba(234, 88, 12, 0.6))" }} />
          </div>
          <h3 className="text-lg font-bold text-white">Verification Queue</h3>
          {totalUnverified > 0 && (
            <Badge 
              variant="outline" 
              className="border-amber-500/50 text-amber-400 ml-1"
            >
              {totalUnverified} pending
            </Badge>
          )}
        </div>
      </div>

      {totalUnverified > 0 && !compact && (
        <Tabs value={sportFilter} onValueChange={(v) => setSportFilter(v as typeof sportFilter)} className="mb-4">
          <TabsList className="bg-black/40">
            <TabsTrigger value="all" className="data-[state=active]:bg-accent">
              All ({totalUnverified})
            </TabsTrigger>
            <TabsTrigger value="basketball" className="data-[state=active]:bg-orange-600">
              Basketball ({basketballCount})
            </TabsTrigger>
            <TabsTrigger value="football" className="data-[state=active]:bg-green-600">
              Football ({footballCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {filteredGames.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <p className="text-muted-foreground mb-1">All caught up!</p>
          <p className="text-sm text-muted-foreground/70">No games awaiting verification</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredGames.map((game) => (
              <GameVerificationCard key={game.id} game={game} />
            ))}
          </AnimatePresence>
          
          {maxItems && totalUnverified > maxItems && (
            <p className="text-center text-sm text-muted-foreground mt-3">
              +{totalUnverified - maxItems} more games to verify
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
