import * as React from "react";
import { Link } from "wouter";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * In-house animated link / CTA primitives for the marketing surface.
 *
 * A brand-matched, dependency-free replacement for the kind of "animated link"
 * pack you'd pull from a component registry: pure CSS hover choreography
 * (underline reveals, icon slides, fill swipes, vertical swaps) tuned to the
 * Caliber dark / platinum system. No JS animation cost — everything rides on
 * `group-hover` + transforms.
 */

type Variant =
  | "underline" // underline grows from the left
  | "center" // underline grows from the center out
  | "slide" // trailing arrow slides in on hover
  | "fill" // pill fills with platinum, label inverts
  | "swap"; // label slides up, a duplicate rises into place

export interface AnimatedLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: Variant;
  /** Render the trailing arrow as a diagonal (↗) instead of a straight (→). */
  diagonal?: boolean;
  children: React.ReactNode;
}

const base =
  "group relative inline-flex items-center gap-1.5 font-medium tracking-tight outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm";

export function AnimatedLink({
  href,
  variant = "underline",
  diagonal = false,
  className,
  children,
  ...rest
}: AnimatedLinkProps) {
  const Arrow = diagonal ? ArrowUpRight : ArrowRight;
  const external = /^https?:\/\//.test(href);

  const inner = (() => {
    switch (variant) {
      case "underline":
        return (
          <>
            <span className="relative">
              {children}
              <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-current transition-transform duration-300 ease-expo group-hover:scale-x-100" />
            </span>
          </>
        );
      case "center":
        return (
          <span className="relative">
            {children}
            <span className="absolute -bottom-0.5 left-0 h-px w-full origin-center scale-x-0 bg-current transition-transform duration-300 ease-expo group-hover:scale-x-100" />
          </span>
        );
      case "slide":
        return (
          <>
            <span className="relative overflow-hidden">
              {children}
              <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-current transition-transform duration-300 ease-expo group-hover:scale-x-100" />
            </span>
            <Arrow className="h-4 w-4 shrink-0 transition-transform duration-300 ease-expo group-hover:translate-x-1" />
          </>
        );
      case "fill":
        return (
          <span className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-full border border-white/15 px-5 py-2">
            <span className="absolute inset-0 translate-y-[101%] bg-accent transition-transform duration-300 ease-expo group-hover:translate-y-0" />
            <span className="relative z-10 transition-colors duration-300 group-hover:text-accent-foreground">
              {children}
            </span>
            <Arrow className="relative z-10 h-4 w-4 shrink-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-accent-foreground" />
          </span>
        );
      case "swap":
        return (
          <span className="relative inline-grid overflow-hidden">
            <span className="col-start-1 row-start-1 transition-transform duration-300 ease-expo group-hover:-translate-y-[120%]">
              {children}
            </span>
            <span
              aria-hidden
              className="col-start-1 row-start-1 translate-y-[120%] text-accent transition-transform duration-300 ease-expo group-hover:translate-y-0"
            >
              {children}
            </span>
          </span>
        );
    }
  })();

  const content = (
    <span className={cn(base, className)} {...(rest as any)}>
      {inner}
    </span>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return <Link href={href}>{content}</Link>;
}

export default AnimatedLink;
