import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "shadcn-card relative rounded-xl border border-accent/[0.08] text-card-foreground backdrop-blur-xl transition-all duration-400",
      "bg-gradient-to-br from-[hsl(220,25%,8%)] via-[hsl(220,20%,6%)] to-[hsl(220,25%,5%)]",
      "shadow-[0_4px_30px_rgba(0,0,0,0.4),0_1px_0_rgba(255,255,255,0.03)_inset,0_0_60px_rgba(234,88,12,0.02)]",
      "hover:border-accent/[0.15] hover:shadow-[0_8px_50px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.05)_inset,0_0_80px_rgba(234,88,12,0.04)]",
      "before:absolute before:inset-x-[10%] before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-accent/40 before:to-transparent",
      "after:absolute after:inset-0 after:rounded-xl after:pointer-events-none after:bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] after:bg-[size:30px_30px] after:opacity-30",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 p-6 relative",
      "border-b border-accent/[0.08] bg-gradient-to-r from-accent/[0.03] to-transparent",
      className
    )}
    {...props}
  />
));
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight font-display",
      "bg-gradient-to-b from-white to-accent/20 bg-clip-text text-transparent",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
}
