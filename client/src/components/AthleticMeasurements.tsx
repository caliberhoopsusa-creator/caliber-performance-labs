import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dumbbell, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import type { AthleticMeasurement } from "@shared/schema";

interface AthleticMeasurementsProps {
  playerId: number;
  isOwnProfile: boolean;
}

function getSprintColor(val: number | null | undefined): string {
  if (val == null) return "text-muted-foreground";
  if (val < 3.3) return "text-green-500";
  if (val <= 3.6) return "text-yellow-500";
  return "text-muted-foreground";
}

function getStandingVertColor(val: number | null | undefined): string {
  if (val == null) return "text-muted-foreground";
  if (val > 30) return "text-green-500";
  if (val >= 26) return "text-yellow-500";
  return "text-muted-foreground";
}

function getMaxVertColor(val: number | null | undefined): string {
  if (val == null) return "text-muted-foreground";
  if (val > 36) return "text-green-500";
  if (val >= 32) return "text-yellow-500";
  return "text-muted-foreground";
}

function getBenchColor(val: number | null | undefined): string {
  if (val == null) return "text-muted-foreground";
  if (val > 10) return "text-green-500";
  if (val >= 5) return "text-yellow-500";
  return "text-muted-foreground";
}

function calcAthleticismScore(m: AthleticMeasurement | null): number | null {
  if (!m) return null;
  const scores: number[] = [];
  if (m.courtSprintSeconds != null) {
    scores.push(Math.max(0, Math.min(100, (4.0 - m.courtSprintSeconds) / 1.0 * 100)));
  }
  if (m.standingVerticalInches != null) {
    scores.push(Math.max(0, Math.min(100, (m.standingVerticalInches - 20) / 16 * 100)));
  }
  if (m.maxVerticalInches != null) {
    scores.push(Math.max(0, Math.min(100, (m.maxVerticalInches - 24) / 18 * 100)));
  }
  if (m.benchPressReps != null) {
    scores.push(Math.max(0, Math.min(100, m.benchPressReps / 15 * 100)));
  }
  if (scores.length === 0) return null;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-yellow-500";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}

export function AthleticMeasurements({ playerId, isOwnProfile }: AthleticMeasurementsProps) {
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [courtSprint, setCourtSprint] = useState("");
  const [standingVert, setStandingVert] = useState("");
  const [maxVert, setMaxVert] = useState("");
  const [benchPress, setBenchPress] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const { data: measurements = [], isLoading } = useQuery<AthleticMeasurement[]>({
    queryKey: ['/api/players', playerId, 'athletic-measurements'],
  });

  const latest = useMemo(() => measurements[0] || null, [measurements]);
  const athleticismScore = useMemo(() => calcAthleticismScore(latest), [latest]);

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", `/api/players/${playerId}/athletic-measurements`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/players', playerId, 'athletic-measurements'] });
      toast({ title: "Measurements logged successfully" });
      setShowForm(false);
      setCourtSprint("");
      setStandingVert("");
      setMaxVert("");
      setBenchPress("");
      setNotes("");
    },
    onError: () => {
      toast({ title: "Failed to log measurements", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/players/${playerId}/athletic-measurements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/players', playerId, 'athletic-measurements'] });
      toast({ title: "Measurement deleted" });
    },
  });

  const handleSubmit = () => {
    const data: Record<string, unknown> = {};
    if (courtSprint) data.courtSprintSeconds = parseFloat(courtSprint);
    if (standingVert) data.standingVerticalInches = parseFloat(standingVert);
    if (maxVert) data.maxVerticalInches = parseFloat(maxVert);
    if (benchPress) data.benchPressReps = parseInt(benchPress);
    if (notes.trim()) data.notes = notes.trim();

    if (Object.keys(data).length === 0 || (Object.keys(data).length === 1 && data.notes)) {
      toast({ title: "Please enter at least one measurement", variant: "destructive" });
      return;
    }
    createMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Card data-testid="athletic-measurements" className="animate-pulse">
        <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
          <Dumbbell className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">Athletic Testing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-24 bg-muted rounded-md" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="athletic-measurements">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-accent-foreground" />
          <CardTitle className="text-base">Athletic Testing</CardTitle>
        </div>
        {athleticismScore != null && (
          <div
            data-testid="athleticism-score"
            className="flex items-center gap-1.5"
          >
            <div className="relative flex items-center justify-center">
              <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18" cy="18" r="15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-muted"
                />
                <circle
                  cx="18" cy="18" r="15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeDasharray={`${athleticismScore * 0.942} 100`}
                  strokeLinecap="round"
                  className={getScoreColor(athleticismScore)}
                />
              </svg>
              <span className={`absolute text-xs font-bold ${getScoreColor(athleticismScore)}`}>
                {athleticismScore}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">Score</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Court Sprint"
            value={latest?.courtSprintSeconds != null ? `${latest.courtSprintSeconds}s` : "—"}
            colorClass={getSprintColor(latest?.courtSprintSeconds)}
          />
          <StatCard
            label="Standing Vert"
            value={latest?.standingVerticalInches != null ? `${latest.standingVerticalInches}"` : "—"}
            colorClass={getStandingVertColor(latest?.standingVerticalInches)}
          />
          <StatCard
            label="Max Vert"
            value={latest?.maxVerticalInches != null ? `${latest.maxVerticalInches}"` : "—"}
            colorClass={getMaxVertColor(latest?.maxVerticalInches)}
          />
          <StatCard
            label="Bench Press"
            value={latest?.benchPressReps != null ? `${latest.benchPressReps} reps` : "—"}
            colorClass={getBenchColor(latest?.benchPressReps)}
          />
        </div>

        {isOwnProfile && (
          <div>
            <Button
              data-testid="button-log-measurements"
              variant="outline"
              size="sm"
              onClick={() => setShowForm(!showForm)}
              className="w-full"
            >
              {showForm ? "Cancel" : "Log Measurements"}
            </Button>

            {showForm && (
              <div className="mt-3 space-y-3 p-3 rounded-md border bg-muted/30">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Court Sprint (sec)</label>
                    <Input
                      data-testid="input-court-sprint"
                      type="number"
                      step="0.01"
                      placeholder="3.25"
                      value={courtSprint}
                      onChange={(e) => setCourtSprint(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Standing Vert (in)</label>
                    <Input
                      data-testid="input-standing-vertical"
                      type="number"
                      step="0.5"
                      placeholder="28"
                      value={standingVert}
                      onChange={(e) => setStandingVert(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Max Vert (in)</label>
                    <Input
                      data-testid="input-max-vertical"
                      type="number"
                      step="0.5"
                      placeholder="34"
                      value={maxVert}
                      onChange={(e) => setMaxVert(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Bench Press (reps)</label>
                    <Input
                      data-testid="input-bench-press"
                      type="number"
                      step="1"
                      placeholder="12"
                      value={benchPress}
                      onChange={(e) => setBenchPress(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Notes (optional)</label>
                  <Textarea
                    data-testid="input-notes"
                    placeholder="Any notes about this session..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="resize-none text-sm"
                    rows={2}
                  />
                </div>
                <Button
                  data-testid="button-submit-measurements"
                  size="sm"
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                  className="w-full"
                >
                  {createMutation.isPending ? "Saving..." : "Save Measurements"}
                </Button>
              </div>
            )}
          </div>
        )}

        {measurements.length > 1 && (
          <div>
            <Button
              data-testid="button-view-history"
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center gap-1 text-muted-foreground"
            >
              {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showHistory ? "Hide History" : `View History (${measurements.length} entries)`}
            </Button>

            {showHistory && (
              <div className="mt-2 space-y-2">
                {measurements.map((m) => (
                  <div
                    key={m.id}
                    data-testid={`history-entry-${m.id}`}
                    className="flex items-center justify-between gap-2 p-2 rounded-md border text-xs"
                  >
                    <div className="flex-1 space-y-0.5">
                      <div className="text-muted-foreground">
                        {m.measuredAt ? format(new Date(m.measuredAt), "MMM d, yyyy") : "Unknown date"}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {m.courtSprintSeconds != null && <span>Sprint: {m.courtSprintSeconds}s</span>}
                        {m.standingVerticalInches != null && <span>SVert: {m.standingVerticalInches}"</span>}
                        {m.maxVerticalInches != null && <span>MVert: {m.maxVerticalInches}"</span>}
                        {m.benchPressReps != null && <span>Bench: {m.benchPressReps}</span>}
                      </div>
                      {m.notes && <div className="text-muted-foreground italic">{m.notes}</div>}
                    </div>
                    {isOwnProfile && (
                      <Button
                        data-testid={`button-delete-measurement-${m.id}`}
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(m.id)}
                        className="shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatCard({ label, value, colorClass }: { label: string; value: string; colorClass: string }) {
  return (
    <div className="rounded-md border p-2.5 text-center space-y-0.5">
      <div className={`text-lg font-bold ${colorClass}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
