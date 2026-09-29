import { cn } from "@/lib/utils";

/**
 * GradeBadge — SIGNAL grade chip on the fixed grade ramp.
 * Every letter step is distinct; A+ is the crimson personal-record moment
 * and gets the only permitted glow.
 */

type Size = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-6 min-w-6 px-1.5 text-xs",
  md: "h-8 min-w-8 px-2 text-sm",
  lg: "h-12 min-w-12 px-3 text-2xl",
};

/** Maps a letter grade to its ramp token. A+ is special-cased by the caller. */
function gradeVar(normalized: string): string {
  if (normalized === "A+") return "--grade-a-plus";
  if (normalized.startsWith("A")) return "--grade-a";
  if (normalized.startsWith("B")) return "--grade-b";
  if (normalized.startsWith("C")) return "--grade-c";
  if (normalized.startsWith("D")) return "--grade-d";
  return "--grade-f";
}

export interface GradeBadgeProps {
  /** Letter grade, e.g. "A+", "B-", "F". */
  grade: string;
  size?: Size;
  className?: string;
  "data-testid"?: string;
}

export function GradeBadge({
  grade,
  size = "md",
  className,
  "data-testid": testId,
}: GradeBadgeProps) {
  const normalized = grade.trim().toUpperCase();
  const cssVar = gradeVar(normalized);
  const isPersonalRecord = normalized === "A+";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md border leading-none",
        SIZE_CLASSES[size],
        className,
      )}
      style={{
        fontFamily: "var(--font-display)",
        fontWeight: 800,
        fontVariantNumeric: "tabular-nums lining-nums",
        color: `hsl(var(${cssVar}))`,
        backgroundColor: `hsl(var(${cssVar}) / 0.12)`,
        borderColor: `hsl(var(${cssVar}) / 0.35)`,
        boxShadow: isPersonalRecord
          ? "0 0 12px hsl(var(--crimson-glow)), 0 0 32px hsl(var(--crimson-glow))"
          : undefined,
      }}
      data-testid={testId}
    >
      {normalized}
    </span>
  );
}
