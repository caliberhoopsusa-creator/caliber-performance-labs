import { motion } from "framer-motion";
import { Shield, CheckCircle2, ClipboardCheck } from "lucide-react";
import { VerificationQueue } from "@/components/VerificationQueue";

export default function CoachVerify() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
          <ClipboardCheck className="w-8 h-8 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold uppercase tracking-tight text-foreground">
            Game Verification
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Review and verify player-submitted game statistics
          </p>
        </div>
      </div>

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
    </motion.div>
  );
}
