import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Pencil, Plus, Loader2, Activity, Dumbbell, Brain } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { FootballMetrics as FootballMetricsType } from "@shared/schema";
import { SportSpinner } from "@/components/SportSpinner";

interface FootballMetricsProps {
  playerId: number;
  canEdit: boolean;
}

const footballMetricsFormSchema = z.object({
  fortyYardDash: z.string().optional(),
  verticalJump: z.string().optional(),
  broadJump: z.string().optional(),
  threeConeDrill: z.string().optional(),
  shuttleTime: z.string().optional(),
  benchPressReps: z.string().optional(),
  wingspan: z.string().optional(),
  handSize: z.string().optional(),
  totalPointsSIS: z.string().optional(),
  handOnBallPct: z.string().optional(),
  adjustedTackleDepth: z.string().optional(),
  yacPerCompletion: z.string().optional(),
  separationRating: z.string().optional(),
  contestedCatchRate: z.string().optional(),
  pressureRate: z.string().optional(),
  passBlockWinRate: z.string().optional(),
  runBlockGrade: z.string().optional(),
  physicality: z.string().optional(),
  footballIQ: z.string().optional(),
  mentalToughness: z.string().optional(),
  coachability: z.string().optional(),
  leadership: z.string().optional(),
  workEthic: z.string().optional(),
  competitiveness: z.string().optional(),
  clutchPerformance: z.string().optional(),
});

type FootballMetricsFormData = z.infer<typeof footballMetricsFormSchema>;

function formatWingspan(inches: number | string | null | undefined): string {
  if (!inches) return "—";
  const totalInches = typeof inches === "string" ? parseFloat(inches) : inches;
  if (isNaN(totalInches)) return "—";
  const feet = Math.floor(totalInches / 12);
  const remainingInches = Math.round(totalInches % 12);
  return `${feet}'${remainingInches}"`;
}

function MetricDisplay({ label, value, unit = "" }: { label: string; value: string | number | null | undefined; unit?: string }) {
  const displayValue = value !== null && value !== undefined && value !== "" ? `${value}${unit}` : "—";
  return (
    <div className="flex justify-between items-center py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{displayValue}</span>
    </div>
  );
}

function TraitProgress({ label, value }: { label: string; value: number | null | undefined }) {
  const numValue = value ?? 0;
  const percentage = (numValue / 10) * 100;
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-accent">{value ?? "—"}/10</span>
      </div>
      <Progress value={percentage} className="h-2 bg-accent/10" />
    </div>
  );
}

export function FootballMetrics({ playerId, canEdit }: FootballMetricsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: metrics, isLoading } = useQuery<FootballMetricsType | null>({
    queryKey: ["/api/players", playerId, "football-metrics"],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}/football-metrics`);
      if (!res.ok) throw new Error("Failed to fetch football metrics");
      return res.json();
    },
    enabled: !!playerId,
  });

  const form = useForm<FootballMetricsFormData>({
    resolver: zodResolver(footballMetricsFormSchema),
    defaultValues: {
      fortyYardDash: "",
      verticalJump: "",
      broadJump: "",
      threeConeDrill: "",
      shuttleTime: "",
      benchPressReps: "",
      wingspan: "",
      handSize: "",
      totalPointsSIS: "",
      handOnBallPct: "",
      adjustedTackleDepth: "",
      yacPerCompletion: "",
      separationRating: "",
      contestedCatchRate: "",
      pressureRate: "",
      passBlockWinRate: "",
      runBlockGrade: "",
      physicality: "",
      footballIQ: "",
      mentalToughness: "",
      coachability: "",
      leadership: "",
      workEthic: "",
      competitiveness: "",
      clutchPerformance: "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FootballMetricsFormData) => {
      const payload: Record<string, number | null> = {};
      
      const decimalFields = [
        "fortyYardDash", "verticalJump", "threeConeDrill", "shuttleTime",
        "wingspan", "handSize", "totalPointsSIS", "handOnBallPct",
        "adjustedTackleDepth", "yacPerCompletion", "separationRating",
        "contestedCatchRate", "pressureRate", "passBlockWinRate", "runBlockGrade"
      ];
      
      const integerFields = [
        "broadJump", "benchPressReps", "physicality", "footballIQ",
        "mentalToughness", "coachability", "leadership", "workEthic",
        "competitiveness", "clutchPerformance"
      ];

      decimalFields.forEach((field) => {
        const value = data[field as keyof FootballMetricsFormData];
        payload[field] = value && value.trim() !== "" ? parseFloat(value) : null;
      });

      integerFields.forEach((field) => {
        const value = data[field as keyof FootballMetricsFormData];
        payload[field] = value && value.trim() !== "" ? parseInt(value, 10) : null;
      });

      const res = await apiRequest("PUT", `/api/players/${playerId}/football-metrics`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players", playerId, "football-metrics"] });
      setIsDialogOpen(false);
      toast({ title: "Metrics updated", description: "Football metrics saved successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save metrics.", variant: "destructive" });
    },
  });

  const handleOpenDialog = () => {
    if (metrics) {
      form.reset({
        fortyYardDash: metrics.fortyYardDash?.toString() ?? "",
        verticalJump: metrics.verticalJump?.toString() ?? "",
        broadJump: metrics.broadJump?.toString() ?? "",
        threeConeDrill: metrics.threeConeDrill?.toString() ?? "",
        shuttleTime: metrics.shuttleTime?.toString() ?? "",
        benchPressReps: metrics.benchPressReps?.toString() ?? "",
        wingspan: metrics.wingspan?.toString() ?? "",
        handSize: metrics.handSize?.toString() ?? "",
        totalPointsSIS: metrics.totalPointsSIS?.toString() ?? "",
        handOnBallPct: metrics.handOnBallPct?.toString() ?? "",
        adjustedTackleDepth: metrics.adjustedTackleDepth?.toString() ?? "",
        yacPerCompletion: metrics.yacPerCompletion?.toString() ?? "",
        separationRating: metrics.separationRating?.toString() ?? "",
        contestedCatchRate: metrics.contestedCatchRate?.toString() ?? "",
        pressureRate: metrics.pressureRate?.toString() ?? "",
        passBlockWinRate: metrics.passBlockWinRate?.toString() ?? "",
        runBlockGrade: metrics.runBlockGrade?.toString() ?? "",
        physicality: metrics.physicality?.toString() ?? "",
        footballIQ: metrics.footballIQ?.toString() ?? "",
        mentalToughness: metrics.mentalToughness?.toString() ?? "",
        coachability: metrics.coachability?.toString() ?? "",
        leadership: metrics.leadership?.toString() ?? "",
        workEthic: metrics.workEthic?.toString() ?? "",
        competitiveness: metrics.competitiveness?.toString() ?? "",
        clutchPerformance: metrics.clutchPerformance?.toString() ?? "",
      });
    } else {
      form.reset();
    }
    setIsDialogOpen(true);
  };

  const onSubmit = (data: FootballMetricsFormData) => {
    updateMutation.mutate(data);
  };

  const radarData = metrics ? [
    { trait: "Physicality", value: metrics.physicality ?? 0 },
    { trait: "Football IQ", value: metrics.footballIQ ?? 0 },
    { trait: "Mental Tough", value: metrics.mentalToughness ?? 0 },
    { trait: "Coachability", value: metrics.coachability ?? 0 },
    { trait: "Leadership", value: metrics.leadership ?? 0 },
    { trait: "Work Ethic", value: metrics.workEthic ?? 0 },
    { trait: "Competitive", value: metrics.competitiveness ?? 0 },
    { trait: "Clutch", value: metrics.clutchPerformance ?? 0 },
  ] : [];

  if (isLoading) {
    return (
      <Card data-testid="football-metrics-loading">
        <CardContent className="flex items-center justify-center py-12">
          <SportSpinner size="md" sport="football" />
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card data-testid="football-metrics-empty">
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <Activity className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground text-center">No football metrics recorded yet.</p>
          {canEdit && (
            <Button onClick={handleOpenDialog} data-testid="button-add-metrics">
              <Plus className="h-4 w-4 mr-2" />
              Add Metrics
            </Button>
          )}
        </CardContent>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Football Metrics</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <MetricsFormFields form={form} />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel-metrics">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-metrics">
                    {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Metrics
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </Card>
    );
  }

  const hasQualitativeData = radarData.some(d => d.value > 0);

  return (
    <div className="space-y-6" data-testid="football-metrics-container">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Football Metrics</h2>
        {canEdit && (
          <Button variant="outline" size="sm" onClick={handleOpenDialog} data-testid="button-edit-metrics">
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card data-testid="card-combine-scores">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Dumbbell className="h-5 w-5 text-accent" />
              Combine Scores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <MetricDisplay label="40-Yard Dash" value={metrics.fortyYardDash} unit="s" />
            <MetricDisplay label="Vertical Jump" value={metrics.verticalJump} unit='"' />
            <MetricDisplay label="Broad Jump" value={metrics.broadJump} unit='"' />
            <MetricDisplay label="3-Cone Drill" value={metrics.threeConeDrill} unit="s" />
            <MetricDisplay label="Shuttle Time" value={metrics.shuttleTime} unit="s" />
            <MetricDisplay label="Bench Press" value={metrics.benchPressReps} unit=" reps" />
            <MetricDisplay label="Wingspan" value={formatWingspan(metrics.wingspan)} />
            <MetricDisplay label="Hand Size" value={metrics.handSize} unit='"' />
          </CardContent>
        </Card>

        <Card data-testid="card-advanced-analytics">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-accent" />
              Advanced Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <MetricDisplay label="Total Points SIS" value={metrics.totalPointsSIS} />
            <MetricDisplay label="Hand On-Ball %" value={metrics.handOnBallPct} unit="%" />
            <MetricDisplay label="Adj. Tackle Depth" value={metrics.adjustedTackleDepth} unit=" yds" />
            <MetricDisplay label="YAC per Completion" value={metrics.yacPerCompletion} unit=" yds" />
            <MetricDisplay label="Separation Rating" value={metrics.separationRating} />
            <MetricDisplay label="Contested Catch Rate" value={metrics.contestedCatchRate} unit="%" />
            <MetricDisplay label="Pressure Rate" value={metrics.pressureRate} unit="%" />
            <MetricDisplay label="Pass Block Grade" value={metrics.passBlockWinRate} />
            <MetricDisplay label="Run Block Grade" value={metrics.runBlockGrade} />
          </CardContent>
        </Card>

        <Card data-testid="card-qualitative-traits">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5 text-accent" />
              Qualitative Traits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <TraitProgress label="Physicality" value={metrics.physicality} />
            <TraitProgress label="Football IQ" value={metrics.footballIQ} />
            <TraitProgress label="Mental Toughness" value={metrics.mentalToughness} />
            <TraitProgress label="Coachability" value={metrics.coachability} />
            <TraitProgress label="Leadership" value={metrics.leadership} />
            <TraitProgress label="Work Ethic" value={metrics.workEthic} />
            <TraitProgress label="Competitiveness" value={metrics.competitiveness} />
            <TraitProgress label="Clutch Performance" value={metrics.clutchPerformance} />
          </CardContent>
        </Card>
      </div>

      {hasQualitativeData && (
        <Card data-testid="card-traits-radar">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Trait Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                  <PolarGrid stroke="rgba(234, 88, 12, 0.2)" />
                  <PolarAngleAxis
                    dataKey="trait"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 10]}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  />
                  <Radar
                    name="Traits"
                    dataKey="value"
                    stroke="hsl(24, 95%, 53%)"
                    fill="rgba(234, 88, 12, 0.3)"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Football Metrics</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <MetricsFormFields form={form} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel-metrics">
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-metrics">
                  {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Metrics
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricsFormFields({ form }: { form: ReturnType<typeof useForm<FootballMetricsFormData>> }) {
  return (
    <>
      <div>
        <h3 className="text-sm font-semibold text-accent mb-3 flex items-center gap-2">
          <Dumbbell className="h-4 w-4" />
          Combine Scores
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fortyYardDash"
            render={({ field }) => (
              <FormItem>
                <FormLabel>40-Yard Dash (sec)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" placeholder="4.45" data-testid="input-forty-yard" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="verticalJump"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vertical Jump (in)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.1" placeholder="38.5" data-testid="input-vertical" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="broadJump"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Broad Jump (in)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" placeholder="124" data-testid="input-broad-jump" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="threeConeDrill"
            render={({ field }) => (
              <FormItem>
                <FormLabel>3-Cone Drill (sec)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" placeholder="6.85" data-testid="input-three-cone" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shuttleTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shuttle Time (sec)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" placeholder="4.12" data-testid="input-shuttle" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="benchPressReps"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bench Press (reps)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" placeholder="25" data-testid="input-bench-press" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="wingspan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Wingspan (in)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.25" placeholder="78.5" data-testid="input-wingspan" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="handSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hand Size (in)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.25" placeholder="9.75" data-testid="input-hand-size" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-accent mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Advanced Analytics
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="totalPointsSIS"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Points SIS</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.1" placeholder="25.5" data-testid="input-total-points-sis" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="handOnBallPct"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hand On-Ball %</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.1" placeholder="15.5" data-testid="input-hand-on-ball" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="adjustedTackleDepth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adj. Tackle Depth</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.1" placeholder="3.5" data-testid="input-tackle-depth" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="yacPerCompletion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>YAC per Completion</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.1" placeholder="5.2" data-testid="input-yac" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="separationRating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Separation Rating (0-100)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.1" placeholder="75" data-testid="input-separation" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contestedCatchRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contested Catch Rate %</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.1" placeholder="55.5" data-testid="input-contested-catch" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pressureRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pressure Rate %</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.1" placeholder="32.5" data-testid="input-pressure-rate" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="passBlockWinRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pass Block Grade (0-100)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.1" placeholder="85" data-testid="input-pass-block" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="runBlockGrade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Run Block Grade (0-100)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.1" placeholder="78" data-testid="input-run-block" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-accent mb-3 flex items-center gap-2">
          <Brain className="h-4 w-4" />
          Qualitative Traits (1-10 scale)
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="physicality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Physicality</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="1" max="10" placeholder="8" data-testid="input-physicality" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="footballIQ"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Football IQ</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="1" max="10" placeholder="7" data-testid="input-football-iq" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="mentalToughness"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mental Toughness</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="1" max="10" placeholder="9" data-testid="input-mental-toughness" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="coachability"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Coachability</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="1" max="10" placeholder="8" data-testid="input-coachability" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="leadership"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Leadership</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="1" max="10" placeholder="7" data-testid="input-leadership" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="workEthic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Ethic</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="1" max="10" placeholder="9" data-testid="input-work-ethic" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="competitiveness"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Competitiveness</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="1" max="10" placeholder="8" data-testid="input-competitiveness" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="clutchPerformance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Clutch Performance</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="1" max="10" placeholder="7" data-testid="input-clutch" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </>
  );
}
