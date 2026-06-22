import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function DebugPage() {
  const { user } = useAuth();
  const playerId = (user as any)?.playerId;

  const { data: debugData, isLoading: debugLoading, error: debugError } = useQuery<{
    collegeCount: number;
    dbConnected: boolean;
    timestamp: string;
  }>({
    queryKey: ['/api/debug'],
    retry: false,
  });

  const { data: colleges, isLoading: collegesLoading, error: collegesError } = useQuery<any[]>({
    queryKey: ['/api/colleges'],
    retry: false,
  });

  const { data: matches, isLoading: matchesLoading, error: matchesError } = useQuery<any[]>({
    queryKey: ['/api/players', playerId, 'college-matches'],
    enabled: !!playerId,
    retry: false,
  });

  const StatusIcon = ({ ok }: { ok: boolean }) =>
    ok ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />;

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      <h1 className="text-2xl font-bold">Debug Diagnostics</h1>

      <Card className="p-4 space-y-3">
        <h2 className="font-semibold text-sm uppercase text-muted-foreground">Auth Status</h2>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <StatusIcon ok={!!user} />
            <span>Authenticated: <strong>{user ? "Yes" : "No"}</strong></span>
          </div>
          {user && (
            <>
              <div className="text-muted-foreground pl-6">User ID: {(user as any).id}</div>
              <div className="text-muted-foreground pl-6">Role: {(user as any).role ?? "none"}</div>
              <div className="text-muted-foreground pl-6">Player ID: {playerId ?? "none"}</div>
            </>
          )}
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="font-semibold text-sm uppercase text-muted-foreground">DB Health</h2>
        <div className="space-y-1 text-sm">
          {debugLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : debugError ? (
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-red-400">Error: {String(debugError)}</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <StatusIcon ok={!!debugData?.dbConnected} />
                <span>DB Connected: <strong>{debugData?.dbConnected ? "Yes" : "No"}</strong></span>
              </div>
              <div className="text-muted-foreground pl-6">College count: {debugData?.collegeCount}</div>
              <div className="text-muted-foreground pl-6">Timestamp: {debugData?.timestamp}</div>
            </>
          )}
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="font-semibold text-sm uppercase text-muted-foreground">API: /api/colleges</h2>
        <div className="text-sm">
          {collegesLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : collegesError ? (
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-red-400">Error: {String(collegesError)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <StatusIcon ok={true} />
              <span>Returned <strong>{colleges?.length ?? 0}</strong> colleges</span>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="font-semibold text-sm uppercase text-muted-foreground">
          API: /api/players/{"{id}"}/college-matches
        </h2>
        <div className="text-sm">
          {!playerId ? (
            <div className="text-muted-foreground">No player ID — skipped</div>
          ) : matchesLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : matchesError ? (
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-red-400">Error: {String(matchesError)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <StatusIcon ok={true} />
              <span>Returned <strong>{matches?.length ?? 0}</strong> college matches for player {playerId}</span>
            </div>
          )}
        </div>
      </Card>

      <div className="text-xs text-muted-foreground">
        <Badge variant="outline">Debug page — not for production use</Badge>
      </div>
    </div>
  );
}
