import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "whitespace-nowrap inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 badge-entrance" +
  " hover-elevate " ,
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-[0_2px_10px_rgba(234,88,12,0.3)]",
        secondary: "border-accent/[0.1] bg-gradient-to-r from-[hsl(220,25%,12%)] to-[hsl(220,25%,10%)] text-accent/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-xs",

        outline: "border border-accent/[0.15] bg-transparent text-accent shadow-xs hover:bg-accent/[0.05]",
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
