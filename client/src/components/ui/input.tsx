import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    // h-9 to match icon buttons and default buttons.
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-lg border border-accent/[0.1] bg-gradient-to-r from-[hsl(220,25%,8%)] to-[hsl(220,25%,6%)] px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-accent/30 focus-visible:outline-none focus-visible:border-accent/40 focus-visible:bg-gradient-to-r focus-visible:from-[hsl(220,25%,10%)] focus-visible:to-[hsl(220,25%,8%)] focus-visible:ring-0 focus-visible:shadow-[0_0_25px_rgba(234,88,12,0.12),0_0_0_1px_rgba(234,88,12,0.15)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-300 shadow-[0_2px_10px_rgba(0,0,0,0.3)_inset]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
