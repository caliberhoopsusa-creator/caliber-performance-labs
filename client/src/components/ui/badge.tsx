import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "whitespace-nowrap inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" +
  " hover-elevate " ,
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-primary to-cyan-500 text-primary-foreground shadow-[0_2px_10px_rgba(0,212,255,0.3)]",
        secondary: "border-cyan-500/[0.1] bg-gradient-to-r from-[hsl(220,25%,12%)] to-[hsl(220,25%,10%)] text-cyan-200/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-xs",

        outline: "border border-cyan-500/[0.15] bg-transparent text-cyan-300 shadow-xs hover:bg-cyan-500/[0.05]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants }
