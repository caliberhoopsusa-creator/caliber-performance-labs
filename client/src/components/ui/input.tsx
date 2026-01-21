import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    // h-9 to match icon buttons and default buttons.
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-lg border border-cyan-500/[0.08] bg-gradient-to-r from-white/[0.02] to-cyan-500/[0.01] px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:border-cyan-400/30 focus-visible:bg-gradient-to-r focus-visible:from-white/[0.04] focus-visible:to-cyan-500/[0.02] focus-visible:ring-0 focus-visible:shadow-[0_0_20px_rgba(100,200,255,0.08),0_0_0_1px_rgba(100,200,255,0.1)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-300",
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
