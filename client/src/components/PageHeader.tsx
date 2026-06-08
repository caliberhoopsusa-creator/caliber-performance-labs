import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * PageHeader — the single, shared page-title pattern for the whole app.
 *
 * Continuity backbone: every in-app surface (dashboard, profile, highlights,
 * recruiting, scout) opens with this so the platform reads as one product
 * instead of a stack of separately-built screens.
 *
 * Design language (Caliber):
 *  - Dark-first, platinum accent (never amber/rainbow), red reserved for action.
 *  - Mono "eyebrow" label · display title · quiet muted description.
 *  - One hairline rule under the header. No decorative blobs, no emoji.
 */
export interface PageHeaderProps {
  /** Small uppercase mono label above the title (e.g. "Recruiting"). */
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Optional leading icon, shown in a platinum-tinted tile. */
  icon?: LucideIcon;
  /** Right-aligned actions (buttons, toggles). */
  actions?: React.ReactNode;
  /** Optional compact stat strip rendered under the header rule. */
  stats?: Array<{ label: string; value: React.ReactNode }>;
  className?: string;
  /** Hide the hairline divider when the page renders its own. */
  divider?: boolean;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
  stats,
  className,
  divider = true,
}: PageHeaderProps) {
  return (
    <header className={cn("relative", className)}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          {Icon && (
            <span className="mt-0.5 hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-accent/10 sm:flex">
              <Icon className="h-5 w-5 text-accent" />
            </span>
          )}
          <div className="min-w-0">
            {eyebrow && (
              <span className="flex items-center gap-2 font-label text-accent">
                <span className="h-px w-5 bg-accent/60" />
                {eyebrow}
              </span>
            )}
            <h1
              className="mt-2 font-display text-3xl font-bold tracking-[-0.02em] text-foreground md:text-4xl"
              data-testid="page-title"
            >
              {title}
            </h1>
            {description && (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>
        )}
      </div>

      {stats && stats.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.05] sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-background/40 px-5 py-4">
              <div className="font-display text-2xl font-bold tracking-tight tabular-nums">
                {s.value}
              </div>
              <div className="mt-1 font-label text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {divider && <div className="mt-7 h-px w-full bg-white/[0.07]" />}
    </header>
  );
}

export default PageHeader;
