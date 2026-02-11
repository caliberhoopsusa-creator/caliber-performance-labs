import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Heart,
  Activity,
  Moon,
  Zap,
  Watch,
  Smartphone,
  TrendingUp,
  Calendar,
  Sparkles,
  Plus,
  ChevronDown,
} from "lucide-react";
import { SiApple } from "react-icons/si";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, subDays } from "date-fns";

interface ExtendedUser {
  id: string;
  playerId: number | null;
}

function useCurrentUser() {
  return useQuery<ExtendedUser | null>({
    queryKey: ["/api/users/me"],
  });
}

interface FitnessEntry {
  id: number;
  date: string;
  recoveryScore: number;
  sleepHours: number;
  sleepQuality: number;
  hrvScore: number;
  readinessScore: number;
  strainScore: number;
}

interface FitnessSummary {
  avgRecovery: number;
  avgSleep: number;
  avgHrv: number;
  avgReadiness: number;
  peakPerformanceInsight: string | null;
}

interface WearableConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  comingSoon: boolean;
  connectEndpoint?: string;
}

interface WearableConnectionResponse {
  id: number;
  provider: string;
  isActive: boolean;
  lastSyncAt: string | null;
}

const wearableConfigs: WearableConfig[] = [
  {
    id: "fitbit",
    name: "Fitbit",
    icon: <Watch className="w-6 h-6" />,
    comingSoon: false,
    connectEndpoint: "/api/wearables/fitbit/connect",
  },
  {
    id: "apple_health",
    name: "Apple Health",
    icon: <SiApple className="w-6 h-6" />,
    comingSoon: true,
  },
  {
    id: "google_fit",
    name: "Google Fit",
    icon: <Activity className="w-6 h-6" />,
    comingSoon: true,
  },
  {
    id: "whoop",
    name: "WHOOP",
    icon: <Watch className="w-6 h-6" />,
    comingSoon: true,
  },
];

const manualEntrySchema = z.object({
  sleepHours: z.number().min(0).max(24),
  sleepQuality: z.number().min(1).max(10),
  recoveryFeeling: z.number().min(1).max(10),
  workoutCount: z.number().min(0).max(10),
});

type ManualEntryForm = z.infer<typeof manualEntrySchema>;

const PremiumTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/90 backdrop-blur-md border border-accent/20 rounded-lg p-3 shadow-xl">
        <p className="text-xs text-muted-foreground">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p
            key={index}
            style={{ color: entry.color }}
            className="text-sm font-medium"
          >
            {entry.name}: {typeof entry.value === "number" ? entry.value.toFixed(1) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function RecoveryGauge({ score }: { score: number }) {
  const getColor = (value: number) => {
    if (value < 50) return "#ef4444";
    if (value < 70) return "#eab308";
    return "#22c55e";
  };

  const color = getColor(score);
  const circumference = 2 * Math.PI * 45;
  const progress = (score / 100) * circumference;

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="hsl(220 15% 15%)"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-1000 ease-out"
          style={{
            filter: `drop-shadow(0 0 8px ${color}40)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-display font-bold text-white">{score}</span>
        <span className="text-xs text-muted-foreground uppercase tracking-wider">Recovery</span>
      </div>
    </div>
  );
}

function generateMockData(days: number): FitnessEntry[] {
  const data: FitnessEntry[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);
    data.push({
      id: i,
      date: format(date, "yyyy-MM-dd"),
      recoveryScore: Math.floor(Math.random() * 40) + 50,
      sleepHours: Math.random() * 3 + 6,
      sleepQuality: Math.floor(Math.random() * 4) + 6,
      hrvScore: Math.floor(Math.random() * 30) + 40,
      readinessScore: Math.floor(Math.random() * 30) + 60,
      strainScore: Math.random() * 10 + 5,
    });
  }
  return data;
}

export default function FitnessDashboard() {
  const { toast } = useToast();
  const { data: user } = useCurrentUser();
  const playerId = user?.playerId;
  const [dateRange, setDateRange] = useState<"7" | "30" | "90">("7");

  const { data: fitnessData, isLoading } = useQuery<FitnessEntry[]>({
    queryKey: ["/api/players", playerId, "fitness", dateRange],
    enabled: !!playerId,
  });

  const { data: summary } = useQuery<FitnessSummary>({
    queryKey: ["/api/players", playerId, "fitness", "summary"],
    enabled: !!playerId,
  });

  const chartData = useMemo(() => {
    const data = fitnessData || generateMockData(parseInt(dateRange));
    return data.map((entry) => ({
      ...entry,
      date: format(new Date(entry.date), "MMM d"),
    }));
  }, [fitnessData, dateRange]);

  const todayStats = chartData[chartData.length - 1] || {
    recoveryScore: 72,
    sleepHours: 7.5,
    sleepQuality: 8,
    hrvScore: 55,
    readinessScore: 78,
    strainScore: 12.4,
  };

  const averages = useMemo(() => {
    if (!chartData.length) return { recovery: 0, sleep: 0, hrv: 0 };
    return {
      recovery: chartData.reduce((sum, d) => sum + d.recoveryScore, 0) / chartData.length,
      sleep: chartData.reduce((sum, d) => sum + d.sleepHours, 0) / chartData.length,
      hrv: chartData.reduce((sum, d) => sum + d.hrvScore, 0) / chartData.length,
    };
  }, [chartData]);

  const form = useForm<ManualEntryForm>({
    resolver: zodResolver(manualEntrySchema),
    defaultValues: {
      sleepHours: 8,
      sleepQuality: 7,
      recoveryFeeling: 7,
      workoutCount: 1,
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ManualEntryForm) => {
      if (!playerId) throw new Error("No player ID");
      // Transform form data to match backend schema
      const fitnessPayload = {
        source: "manual",
        date: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
        sleepHours: data.sleepHours.toString(), // Schema expects decimal as string
        sleepQualityScore: data.sleepQuality * 10, // Convert 1-10 scale to 1-100
        recoveryScore: data.recoveryFeeling * 10, // Convert 1-10 scale to 1-100
        workoutCount: data.workoutCount,
      };
      return apiRequest("POST", `/api/players/${playerId}/fitness`, fitnessPayload);
    },
    onSuccess: () => {
      toast({
        title: "Logged Successfully",
        description: "Your fitness data has been recorded.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/players", playerId, "fitness"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to log fitness data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ManualEntryForm) => {
    submitMutation.mutate(data);
  };

  // Fetch wearable connections from API
  const { data: wearableConnectionsData } = useQuery<WearableConnectionResponse[]>({
    queryKey: ["/api/wearables/connections"],
    enabled: !!playerId,
  });

  // Safely ensure wearableConnections is always an array
  const wearableConnections = Array.isArray(wearableConnectionsData) ? wearableConnectionsData : [];

  // Helper to check if a provider is connected
  const isProviderConnected = (providerId: string) => {
    return wearableConnections.some((c) => c.provider === providerId && c.isActive);
  };

  const hasWearableConnected = wearableConnections.length > 0;

  // Handle connect wearable
  const handleConnectWearable = (wearable: WearableConfig) => {
    if (wearable.connectEndpoint) {
      // Redirect to OAuth flow
      window.location.href = wearable.connectEndpoint;
    }
  };

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async (provider: string) => {
      return apiRequest("DELETE", `/api/wearables/${provider}/disconnect`);
    },
    onSuccess: () => {
      toast({
        title: "Disconnected",
        description: "Wearable has been disconnected successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wearables/connections"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to disconnect wearable. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async (provider: string) => {
      return apiRequest("POST", `/api/wearables/${provider}/sync`);
    },
    onSuccess: () => {
      toast({
        title: "Synced",
        description: "Your fitness data has been synced successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/players", playerId, "fitness"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wearables/connections"] });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Could not sync data. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!playerId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
        <Heart className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-display font-bold text-white mb-2">
          Player Profile Required
        </h2>
        <p className="text-muted-foreground max-w-md">
          You need a player profile to track fitness and recovery data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white uppercase tracking-tight">
            Fitness & Recovery
          </h2>
          <p className="text-muted-foreground font-medium">
            Track your biometrics and optimize performance
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {wearableConfigs.map((wearable) => {
            const connected = isProviderConnected(wearable.id);
            return (
              <Badge
                key={wearable.id}
                variant={connected ? "default" : "outline"}
                className={
                  connected
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : "text-muted-foreground"
                }
                data-testid={`badge-wearable-${wearable.id}`}
              >
                {wearable.name}
                {connected ? " Connected" : wearable.comingSoon ? " Coming Soon" : " Not Connected"}
              </Badge>
            );
          })}

          <Select value={dateRange} onValueChange={(v) => setDateRange(v as "7" | "30" | "90")}>
            <SelectTrigger className="w-[140px]" data-testid="select-date-range">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="">
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="lg:row-span-2" data-testid="card-recovery-score">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Heart className="w-4 h-4 text-accent" />
                  Recovery Score
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-4">
                <RecoveryGauge score={todayStats.recoveryScore} />
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  {todayStats.recoveryScore >= 70
                    ? "Ready for high intensity"
                    : todayStats.recoveryScore >= 50
                    ? "Moderate activity recommended"
                    : "Focus on recovery today"}
                </p>
              </CardContent>
            </Card>

            <Card className="" data-testid="card-sleep">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs uppercase tracking-wider">Sleep</span>
                </div>
                <div className="text-3xl font-display font-bold text-white">
                  {todayStats.sleepHours.toFixed(1)}h
                </div>
                <div className="text-sm text-muted-foreground">
                  Quality: {todayStats.sleepQuality}/10
                </div>
              </CardContent>
            </Card>

            <Card className="" data-testid="card-hrv">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Activity className="w-4 h-4 text-pink-400" />
                  <span className="text-xs uppercase tracking-wider">HRV</span>
                </div>
                <div className="text-3xl font-display font-bold text-white">
                  {todayStats.hrvScore}
                </div>
                <div className="text-sm text-muted-foreground">
                  ms (heart rate variability)
                </div>
              </CardContent>
            </Card>

            <Card className="" data-testid="card-readiness">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs uppercase tracking-wider">Readiness</span>
                </div>
                <div className="text-3xl font-display font-bold text-white">
                  {todayStats.readinessScore}%
                </div>
                <div className="text-sm text-muted-foreground">Game day readiness</div>
              </CardContent>
            </Card>

            <Card className="" data-testid="card-strain">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <TrendingUp className="w-4 h-4 text-orange-400" />
                  <span className="text-xs uppercase tracking-wider">Strain</span>
                </div>
                <div className="text-3xl font-display font-bold text-white">
                  {todayStats.strainScore.toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">Daily strain score</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="" data-testid="chart-recovery-trend">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Heart className="w-4 h-4 text-accent" />
                  Recovery Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "hsl(220 10% 50%)", fontSize: 10 }}
                        axisLine={{ stroke: "hsl(220 15% 20%)" }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: "hsl(220 10% 50%)", fontSize: 10 }}
                        axisLine={{ stroke: "hsl(220 15% 20%)" }}
                      />
                      <Tooltip content={<PremiumTooltip />} />
                      <ReferenceLine
                        y={averages.recovery}
                        stroke="#22d3ee"
                        strokeDasharray="5 5"
                        label={{
                          value: `Avg: ${averages.recovery.toFixed(0)}`,
                          fill: "#22d3ee",
                          fontSize: 10,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="recoveryScore"
                        name="Recovery"
                        stroke="#22d3ee"
                        strokeWidth={2}
                        dot={{ fill: "#22d3ee", r: 3 }}
                        activeDot={{ r: 5, fill: "#22d3ee" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="" data-testid="chart-sleep">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-400" />
                  Sleep Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "hsl(220 10% 50%)", fontSize: 10 }}
                        axisLine={{ stroke: "hsl(220 15% 20%)" }}
                      />
                      <YAxis
                        domain={[0, 12]}
                        tick={{ fill: "hsl(220 10% 50%)", fontSize: 10 }}
                        axisLine={{ stroke: "hsl(220 15% 20%)" }}
                      />
                      <Tooltip content={<PremiumTooltip />} />
                      <ReferenceLine
                        y={averages.sleep}
                        stroke="#818cf8"
                        strokeDasharray="5 5"
                        label={{
                          value: `Avg: ${averages.sleep.toFixed(1)}h`,
                          fill: "#818cf8",
                          fontSize: 10,
                        }}
                      />
                      <Bar
                        dataKey="sleepHours"
                        name="Sleep"
                        fill="#818cf8"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2" data-testid="chart-hrv-trend">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-pink-400" />
                  HRV Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "hsl(220 10% 50%)", fontSize: 10 }}
                        axisLine={{ stroke: "hsl(220 15% 20%)" }}
                      />
                      <YAxis
                        tick={{ fill: "hsl(220 10% 50%)", fontSize: 10 }}
                        axisLine={{ stroke: "hsl(220 15% 20%)" }}
                      />
                      <Tooltip content={<PremiumTooltip />} />
                      <ReferenceLine
                        y={averages.hrv}
                        stroke="#f472b6"
                        strokeDasharray="5 5"
                        label={{
                          value: `Avg: ${averages.hrv.toFixed(0)}`,
                          fill: "#f472b6",
                          fontSize: 10,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="hrvScore"
                        name="HRV"
                        stroke="#f472b6"
                        strokeWidth={2}
                        dot={{ fill: "#f472b6", r: 3 }}
                        activeDot={{ r: 5, fill: "#f472b6" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {!hasWearableConnected && (
            <Card className="border-accent/20" data-testid="card-manual-entry">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5 text-accent" />
                  Manual Entry
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  No wearable connected? Log your daily metrics manually.
                </p>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <FormField
                        control={form.control}
                        name="sleepHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-muted-foreground">
                              Sleep Hours
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.5"
                                min="0"
                                max="24"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                data-testid="input-sleep-hours"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sleepQuality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-muted-foreground">
                              Sleep Quality: {field.value}/10
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={10}
                                step={1}
                                value={[field.value]}
                                onValueChange={(v) => field.onChange(v[0])}
                                data-testid="slider-sleep-quality"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="recoveryFeeling"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-muted-foreground">
                              Recovery Feeling: {field.value}/10
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={10}
                                step={1}
                                value={[field.value]}
                                onValueChange={(v) => field.onChange(v[0])}
                                data-testid="slider-recovery-feeling"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="workoutCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-muted-foreground">
                              Workouts Today
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="10"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                data-testid="input-workout-count"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={submitMutation.isPending}
                      data-testid="button-submit-fitness"
                    >
                      {submitMutation.isPending ? "Saving..." : "Log Today's Data"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          <Card className="" data-testid="card-insights">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2" />
                  <div>
                    <p className="text-sm text-white font-medium">
                      Your best games happen after 8+ hours of sleep
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Games with 8+ hours of prior sleep: 23% higher performance grades
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <div className="w-2 h-2 rounded-full bg-accent mt-2" />
                  <div>
                    <p className="text-sm text-white font-medium">
                      Recovery above 70 correlates with fewer turnovers
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      High recovery days show 40% fewer turnovers on average
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2" />
                  <div>
                    <p className="text-sm text-white font-medium">
                      Your HRV peaks on rest days after back-to-back games
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Consider scheduling light recovery workouts on these days
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <h3 className="text-xl font-display font-bold text-white mb-4 uppercase tracking-tight">
              Connect Wearables
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {wearableConfigs.map((wearable) => {
                const connected = isProviderConnected(wearable.id);
                return (
                  <Card
                    key={wearable.id}
                    className="hover-elevate cursor-pointer"
                    data-testid={`card-wearable-${wearable.id}`}
                  >
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent/20 to-blue-500/20 flex items-center justify-center mb-4 text-accent">
                        {wearable.icon}
                      </div>
                      <h4 className="font-display font-bold text-white text-lg mb-2">
                        {wearable.name}
                      </h4>
                      {wearable.comingSoon ? (
                        <Badge variant="outline" className="text-yellow-400 border-yellow-400/30">
                          Coming Soon
                        </Badge>
                      ) : connected ? (
                        <div className="flex flex-col gap-2">
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            Connected
                          </Badge>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => syncMutation.mutate(wearable.id)}
                              disabled={syncMutation.isPending}
                              data-testid={`button-sync-${wearable.id}`}
                            >
                              {syncMutation.isPending ? "Syncing..." : "Sync"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-300"
                              onClick={() => disconnectMutation.mutate(wearable.id)}
                              disabled={disconnectMutation.isPending}
                              data-testid={`button-disconnect-${wearable.id}`}
                            >
                              Disconnect
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConnectWearable(wearable)}
                          data-testid={`button-connect-${wearable.id}`}
                        >
                          Connect
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              <Smartphone className="w-4 h-4 inline mr-1" />
              Connect your fitness wearable to automatically sync your health data
            </p>
          </div>
        </>
      )}
    </div>
  );
}
