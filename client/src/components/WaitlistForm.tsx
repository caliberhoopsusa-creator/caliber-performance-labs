import { useState } from "react";
import { Check, ArrowRight, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface WaitlistFormProps {
  /** where this form lives, stored for attribution e.g. 'landing-hero' */
  source?: string;
  className?: string;
  align?: "start" | "center";
}

export function WaitlistForm({ source = "landing", className, align = "start" }: WaitlistFormProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isCoach, setIsCoach] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [doneMessage, setDoneMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/waitlist", {
        email: email.trim(),
        source,
        role: isCoach ? "coach" : "player",
        teamName: isCoach ? teamName.trim() || null : null,
      });
      const data = await res.json().catch(() => ({}));
      setDoneMessage(data?.message || "You're in. Welcome to the founding class.");
      setDone(true);
    } catch (err) {
      toast({
        title: "Couldn't join the waitlist",
        description: err instanceof Error ? err.message.replace(/^\d+:\s*/, "") : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border border-accent/40 bg-accent/[0.07] px-5 py-4",
          align === "center" && "justify-center text-center mx-auto",
          className,
        )}
        data-testid="waitlist-success"
      >
        <span className="grid place-items-center h-8 w-8 shrink-0 rounded-full bg-accent text-accent-foreground">
          <Check className="h-4 w-4" />
        </span>
        <p className="font-body text-foreground">{doneMessage}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("w-full max-w-md", align === "center" && "mx-auto", className)}
      data-testid="waitlist-form"
    >
      <div className="flex flex-col sm:flex-row gap-2.5">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          aria-label="Email address"
          autoComplete="email"
          className="flex-1 h-12 rounded-lg border border-border bg-card/60 px-4 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-accent"
          data-testid="input-waitlist-email"
        />
        <button
          type="submit"
          disabled={submitting}
          className="btn-chrome inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg px-6 font-semibold"
          data-testid="button-waitlist-submit"
        >
          {submitting ? (
            <>Joining<Loader2 className="ml-1 h-4 w-4 animate-spin" /></>
          ) : (
            <>Join the founding class<ArrowRight className="ml-1 h-4 w-4" /></>
          )}
        </button>
      </div>

      <label className={cn("mt-3 flex items-center gap-2 text-sm text-muted-foreground cursor-pointer", align === "center" && "justify-center")}>
        <input
          type="checkbox"
          checked={isCoach}
          onChange={(e) => setIsCoach(e.target.checked)}
          className="h-4 w-4 accent-[hsl(var(--accent))]"
          data-testid="checkbox-waitlist-coach"
        />
        I'm a coach bringing a team
      </label>

      {isCoach && (
        <input
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Team / program name"
          aria-label="Team or program name"
          className="mt-2.5 w-full h-11 rounded-lg border border-border bg-card/60 px-4 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-accent"
          data-testid="input-waitlist-team"
        />
      )}
    </form>
  );
}
