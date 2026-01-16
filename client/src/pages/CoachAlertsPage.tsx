import { AlertsCenter } from "@/components/AlertsCenter";
import { ArrowLeft, Bell } from "lucide-react";
import { Link } from "wouter";
import { Paywall } from "@/components/Paywall";

export default function CoachAlertsPage() {
  return (
    <Paywall requiredTier="coach_pro" featureName="Trend Alerts">
      <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link href="/coach/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-white transition-colors uppercase tracking-wider">
          <ArrowLeft className="w-4 h-4" /> Back to Coach Dashboard
        </Link>
      </div>
      
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
          <Bell className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display text-white uppercase tracking-wide">Coach Alerts</h1>
          <p className="text-muted-foreground text-sm">Performance alerts and notifications for your team</p>
        </div>
      </div>

      <AlertsCenter />
      </div>
    </Paywall>
  );
}
