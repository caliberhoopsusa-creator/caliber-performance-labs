import { useRoute, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Users, Trophy, TrendingUp } from "lucide-react";

export default function JoinPage() {
  const [, params] = useRoute("/join/:code");
  const [, setLocation] = useLocation();
  const code = params?.code?.toUpperCase() ?? "";

  const { data, isLoading } = useQuery({
    queryKey: [`/api/referral/lookup/${code}`],
    queryFn: async () => {
      const res = await fetch(`/api/referral/lookup/${code}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!code,
  });

  useEffect(() => {
    if (code) {
      localStorage.setItem("caliber_ref", code);
    }
  }, [code]);

  const referrerName = data?.referrer
    ? [data.referrer.firstName, data.referrer.lastName].filter(Boolean).join(" ") || "A teammate"
    : "A teammate";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-sm w-full space-y-6 text-center">
        <div className="space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center mx-auto shadow-xl shadow-accent/25">
            <span className="text-white font-bold text-2xl font-display">C</span>
          </div>
          <h1 className="text-3xl font-bold font-display">CALIBER</h1>
        </div>

        {isLoading ? (
          <Card className="border-accent/20">
            <CardContent className="pt-6 pb-6">
              <div className="h-5 w-48 bg-muted animate-pulse rounded mx-auto" />
            </CardContent>
          </Card>
        ) : data?.valid ? (
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="pt-6 pb-6 space-y-2">
              <Users className="w-8 h-8 text-accent mx-auto" />
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{referrerName}</span> invited you to join Caliber — the #1 multi-sport performance analytics app for athletes.
              </p>
            </CardContent>
          </Card>
        ) : (
          <p className="text-sm text-muted-foreground">
            Join thousands of athletes tracking their performance on Caliber.
          </p>
        )}

        <div className="space-y-2 text-left">
          {[
            { icon: TrendingUp, text: "Performance grades after every game" },
            { icon: Trophy, text: "Earn badges and climb the leaderboard" },
            { icon: Zap, text: "College recruiting profile for coaches to find you" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
              <Icon className="w-4 h-4 text-accent shrink-0" />
              {text}
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <a href="/api/login">
            <Button size="lg" className="w-full shadow-lg shadow-accent/25">
              <Zap className="w-4 h-4 mr-2" />
              Create Free Account
            </Button>
          </a>
          <button
            onClick={() => setLocation("/")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Already have an account? Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
