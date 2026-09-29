import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * SectionEyebrow — the SIGNAL section header. Archivo Condensed caps with a
 * 24px crimson rule to the left. Replaces every ad-hoc section header.
 */

export interface SectionEyebrowProps {
  children: ReactNode;
  /** Semantic element — defaults to h2. */
  as?: "h2" | "h3" | "h4" | "div" | "span";
  className?: string;
  "data-testid"?: string;
}

export function SectionEyebrow({
  children,
  as: Tag = "h2",
  className,
  "data-testid": testId,
}: SectionEyebrowProps) {
  return (
    <Tag
      className={cn("flex items-center gap-3 uppercase", className)}
      data-testid={testId}
    >
      <span
        aria-hidden
        className="inline-block h-0.5 w-6 shrink-0"
        style={{ backgroundColor: "hsl(var(--crimson))" }}
      />
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 500,
          fontStretch: "70%",
          fontSize: "var(--text-label)",
          letterSpacing: "0.18em",
        }}
      >
        {children}
      </span>
    </Tag>
  );
}
