import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearch, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  Swords, Trophy, UserPlus, Search, 
  Loader2, Crown, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";

interface CompareData {
  player1: {
    id: number;
    name: string;
    photo: string | null;
    position: string;
    team: string | null;
    sport: string;
    stats: Record<string, number>;
  };
  player2: {
    stats: Record<string, number | string>;
  } | null;
}

interface PlayerSearchResult {
  id: number;
  name: string;
  photoUrl: string | null;
  position: string;
  team: string | null;
}

const STAT_LABELS: Record<string, string> = {
  ppg: "Points/Game",
  rpg: "Rebounds/Game", 
  apg: "Assists/Game",
  spg: "Steals/Game",
  bpg: "Blocks/Game",
  tdpg: "TDs/Game",
  ypg: "Yards/Game",
  gamesPlayed: "Games Played",
};

function StatCompareRow({ label, val1, val2 }: { label: string; val1: number; val2: number | null }) {
  const p1Wins = val2 !== null && val1 > val2;
  const p2Wins = val2 !== null && val2 > val1;
  const displayLabel = STAT_LABELS[label] || label;
  
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
      <div className={cn("flex-1 text-right", p1Wins && "text-emerald-400 font-bold")}>
        <span className="text-lg">{val1}</span>
        {p1Wins && <Crown className="w-3 h-3 inline-block ml-1 text-yellow-400" />}
      </div>
      <div className="w-24 text-center">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{displayLabel}</span>
      </div>
      <div className={cn("flex-1 text-left", p2Wins && "text-emerald-400 font-bold")}>
        {val2 !== null ? (
          <>
            <span className="text-lg">{val2}</span>
            {p2Wins && <Crown className="w-3 h-3 inline-block ml-1 text-yellow-400" />}
          </>
        ) : (
          <span className="text-muted-foreground">--</span>
        )}
      </div>
    </div>
  );
}

export default function ChallengePage() {
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const challengerIdStr = searchParams.get("p");
  const challengerId = challengerIdStr ? parseInt(challengerIdStr) : null;
  const { user } = useAuth();
  
  const [opponentId, setOpponentId] = useState<number | null>(user?.playerId || null);
  const [playerSearch, setPlayerSearch] = useState("");

  const { data: compareData, isLoading } = useQuery<CompareData>({
    queryKey: ['/api/challenges/compare', challengerId, opponentId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (challengerId) params.set("player1", String(challengerId));
      if (opponentId) params.set("player2", String(opponentId));
      const res = await fetch(`/api/challenges/compare?${params}`);
      if (!res.ok) throw new Error("Failed to load challenge");
      return res.json();
    },
    enabled: !!challengerId,
  });

  const { data: searchResults = [] } = useQuery<PlayerSearchResult[]>({
    queryKey: ['/api/players', 'search', playerSearch],
    queryFn: async () => {
      const res = await fetch(`/api/players?search=${encodeURIComponent(playerSearch)}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: playerSearch.length >= 2,
  });

  if (!challengerId) {
    return (
      <div className="text-center py-20">
        <Swords className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold text-white mb-2" data-testid="text-invalid-challenge">Invalid Challenge</h2>
        <p className="text-muted-foreground">This challenge link appears to be broken.</p>
        <Link href="/">
          <Button className="mt-4" data-testid="button-go-home">Go Home</Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const p1 = compareData?.player1;
  const p2 = compareData?.player2;
  const sport = p1?.sport || 'basketball';
  const statKeys = sport === 'basketball' 
    ? ['ppg', 'rpg', 'apg', 'spg', 'bpg'] 
    : ['tdpg', 'ypg'];

  let p1Wins = 0;
  let p2Wins = 0;
  if (p1 && p2) {
    for (const key of statKeys) {
      const v1 = Number(p1.stats[key]) || 0;
      const v2 = Number(p2.stats[key]) || 0;
      if (v1 > v2) p1Wins++;
      else if (v2 > v1) p2Wins++;
    }
  }

  return (
    <div className="pb-24 md:pb-8 max-w-2xl mx-auto space-y-6" data-testid="page-challenge">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-950/40 via-black/40 to-blue-950/40 border border-white/10">
        <div className="absolute inset-0 opacity-10" />
        <div className="relative z-10 p-6 text-center">
          <Swords className="w-10 h-10 mx-auto text-yellow-400 mb-2" style={{ filter: "drop-shadow(0 0 12px rgba(234,179,8,0.5))" }} />
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-wider">
            <span className="bg-gradient-to-r from-red-400 via-yellow-400 to-blue-400 bg-clip-text text-transparent" data-testid="text-challenge-title">
              Head to Head Challenge
            </span>
          </h1>
          <p className="text-muted-foreground mt-1">Can you beat their stats?</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 bg-gradient-to-br from-red-950/20 to-black/20 border-red-500/20 text-center" data-testid="card-challenger">
          <Avatar className="w-16 h-16 mx-auto mb-2 border-2 border-red-500/30">
            <AvatarImage src={p1?.photo || undefined} />
            <AvatarFallback className="bg-red-500/20 text-red-400 text-lg font-bold">
              {p1?.name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          <h3 className="text-lg font-bold text-white" data-testid="text-challenger-name">{p1?.name || 'Unknown'}</h3>
          <p className="text-xs text-muted-foreground">{p1?.position} {p1?.team ? `- ${p1.team}` : ''}</p>
          <Badge className="mt-2 bg-red-500/10 text-red-400 border-red-500/20 no-default-hover-elevate no-default-active-elevate">
            <Swords className="w-3 h-3 mr-1" />
            Challenger
          </Badge>
          {p2 && <p className={cn("text-2xl font-black mt-2", p1Wins > p2Wins ? "text-emerald-400" : "text-red-400")} data-testid="text-p1-wins">{p1Wins}</p>}
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-950/20 to-black/20 border-blue-500/20 text-center" data-testid="card-opponent">
          {p2 ? (
            <>
              <Avatar className="w-16 h-16 mx-auto mb-2 border-2 border-blue-500/30">
                <AvatarImage src={String(p2.stats.photo) || undefined} />
                <AvatarFallback className="bg-blue-500/20 text-blue-400 text-lg font-bold">
                  {String(p2.stats.name)?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-bold text-white" data-testid="text-opponent-name">{String(p2.stats.name)}</h3>
              <p className="text-xs text-muted-foreground">{p2.stats.position} {p2.stats.team ? `- ${p2.stats.team}` : ''}</p>
              <Badge className="mt-2 bg-blue-500/10 text-blue-400 border-blue-500/20 no-default-hover-elevate no-default-active-elevate">
                <Shield className="w-3 h-3 mr-1" />
                Defender
              </Badge>
              <p className={cn("text-2xl font-black mt-2", p2Wins > p1Wins ? "text-emerald-400" : "text-red-400")} data-testid="text-p2-wins">{p2Wins}</p>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-4">
              <UserPlus className="w-10 h-10 text-blue-400/30 mb-2" />
              <p className="text-sm text-muted-foreground mb-3">Select your player</p>
              
              {user?.playerId && user.playerId !== challengerId ? (
                <Button 
                  size="sm" 
                  onClick={() => setOpponentId(user.playerId!)}
                  className="gap-1.5"
                  data-testid="button-accept-challenge"
                >
                  <Swords className="w-3 h-3" />
                  Accept Challenge
                </Button>
              ) : (
                <div className="w-full space-y-2 px-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                    <Input
                      placeholder="Search player..."
                      value={playerSearch}
                      onChange={(e) => setPlayerSearch(e.target.value)}
                      className="h-8 pl-7 text-xs bg-black/20 border-white/10"
                      data-testid="input-search-opponent"
                    />
                  </div>
                  {searchResults.filter(p => p.id !== challengerId).slice(0, 3).map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setOpponentId(p.id); setPlayerSearch(""); }}
                      className="w-full flex items-center gap-2 p-1.5 rounded-md bg-white/5 cursor-pointer text-left hover-elevate"
                      data-testid={`button-select-player-${p.id}`}
                    >
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={p.photoUrl || undefined} />
                        <AvatarFallback className="text-[10px] bg-blue-500/20 text-blue-400">{p.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-white truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {p1 && (
        <Card className="bg-black/20 border-white/10 overflow-visible" data-testid="card-stats-comparison">
          <div className="p-4 border-b border-white/10 bg-gradient-to-r from-red-950/20 via-black/20 to-card">
            <h3 className="text-center text-sm font-bold uppercase tracking-wider text-white">
              Stats Comparison (Last 10 Games)
            </h3>
          </div>
          <div className="p-4">
            <StatCompareRow 
              label="gamesPlayed" 
              val1={Number(p1.stats.gamesPlayed)} 
              val2={p2 ? Number(p2.stats.gamesPlayed) : null} 
            />
            {statKeys.map(key => (
              <StatCompareRow
                key={key}
                label={key}
                val1={Number(p1.stats[key]) || 0}
                val2={p2 ? Number(p2.stats[key]) || 0 : null}
              />
            ))}
          </div>
          
          {p2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-4 text-center border-t",
                p1Wins > p2Wins 
                  ? "bg-gradient-to-r from-red-950/30 to-red-950/10 border-red-500/20" 
                  : p2Wins > p1Wins 
                    ? "bg-gradient-to-r from-blue-950/30 to-blue-950/10 border-blue-500/20"
                    : "bg-gradient-to-r from-yellow-950/20 to-yellow-950/10 border-yellow-500/20"
              )}
            >
              <Trophy className={cn("w-6 h-6 mx-auto mb-1",
                p1Wins > p2Wins ? "text-red-400" : p2Wins > p1Wins ? "text-blue-400" : "text-yellow-400"
              )} />
              <p className="text-sm font-bold text-white" data-testid="text-winner">
                {p1Wins > p2Wins 
                  ? `${p1.name} wins ${p1Wins}-${p2Wins}!` 
                  : p2Wins > p1Wins 
                    ? `${p2.stats.name} wins ${p2Wins}-${p1Wins}!`
                    : "It's a tie!"}
              </p>
            </motion.div>
          )}
        </Card>
      )}

      {!p2 && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Share this link with a friend to challenge them!
          </p>
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
            }}
            className="gap-2"
            data-testid="button-copy-challenge-link"
          >
            Copy Challenge Link
          </Button>
        </div>
      )}
    </div>
  );
}
