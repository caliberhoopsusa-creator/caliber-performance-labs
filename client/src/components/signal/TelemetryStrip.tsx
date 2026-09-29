import { Fragment } from "react";
import { cn } from "@/lib/utils";

/**
 * TelemetryStrip — JetBrains Mono ticker row of label/value pairs for hero
 * areas (last game, streak, rank delta). The "machine truth" voice.
 */

export interface TelemetryItem {
  label: string;
  /** Real data only — never a fabricated placeholder. */
  value: string | number;
}

export interface TelemetryStripProps {
  items: TelemetryItem[];
  className?: string;
  "data-testid"?: string;
}

export function TelemetryStrip({
  items,
  className,
  "data-testid": testId,
}: TelemetryStripProps) {
  if (items.length === 0) return null;

  return (
    <div
      className={cn("flex flex-wrap items-center gap-x-3 gap-y-1", className)}
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-data)",
        fontVariantNumeric: "tabular-nums lining-nums",
      }}
      data-testid={testId}
    >
      {items.map((item, i) => (
        <Fragment key={`${item.label}-${i}`}>
          {i > 0 && (
            <span aria-hidden className="select-none text-muted-foreground/50">
              /
            </span>
          )}
          <span className="whitespace-nowrap">
            <span className="uppercase tracking-wider text-muted-foreground">
              {item.label}
            </span>{" "}
            <span className="font-medium text-foreground">{item.value}</span>
          </span>
        </Fragment>
      ))}
    </div>
  );
}
