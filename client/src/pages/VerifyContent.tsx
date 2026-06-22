import { Shield, CheckCircle2 } from "lucide-react";
import { VerificationQueue } from "@/components/VerificationQueue";

export default function VerifyContent() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-accent" />
            <span className="font-medium text-foreground">Trust System</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Verified stats build player credibility and unlock advanced features
          </p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium text-foreground">Quick Verify</span>
          </div>
          <p className="text-sm text-muted-foreground">
            One-click verification for games you've witnessed in person
          </p>
        </div>

        <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-accent" />
            <span className="font-medium text-foreground">Team Only</span>
          </div>
          <p className="text-sm text-muted-foreground">
            You can only verify games for players on your team roster
          </p>
        </div>
      </div>

      <VerificationQueue />
    </div>
  );
}
