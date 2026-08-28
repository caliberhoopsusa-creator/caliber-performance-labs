import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { CaliberLogo } from "@/components/CaliberLogo";
import { TheCall } from "@/components/call";
import { prefersReducedMotion, runHoverNudge, runScrollScrub } from "@/lib/motion";

/**
 * Landing — "THE CALL" (DESIGN-LANGUAGE §4.5).
 *
 * The page is ONE continuous camera move from an empty gym at 6am to the phone
 * call that changes everything. There is no separate hero section: beat 00 IS
 * the opening frame, which is what lets the camera push forward without a cut
 * anywhere on the page.
 *
 * This file owns only the page chrome — the scroll progress bar, the nav pill,
 * and the footer. The story itself lives in `components/call`.
 */

/** Reduced-motion preference, sampled once per mount (page-level flag). */
function useReducedMotionPref(): boolean {
  const [reduced] = useState(() => prefersReducedMotion());
  return reduced;
}

export default function Landing() {
  const reduced = useReducedMotionPref();
  const rootRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const signInArrowRef = useRef<HTMLSpanElement>(null);

  /* Sign-in arrow — anime.js nudge on hover AND keyboard focus. The trigger is
     the anchor wouter renders, reached from the arrow so no ref has to thread
     through <Link>. */
  useEffect(() => {
    const arrow = signInArrowRef.current;
    const trigger = arrow?.closest("a");
    if (!arrow || !trigger) return;
    return runHoverNudge({
      trigger,
      target: arrow,
      from: { x: 0 },
      to: { x: 3 },
      duration: 220,
    });
  }, []);

  /* Scroll progress bar — anime.js scrub over the full page (no framer). */
  useLayoutEffect(() => {
    if (reduced) return;
    const bar = progressRef.current;
    return runScrollScrub({
      driver: rootRef.current,
      targets: [bar],
      build: (tl) => {
        if (!bar) return;
        tl.add(bar, { scaleX: [0, 1], duration: 1000, ease: "linear" }, 0);
      },
    });
  }, [reduced]);

  /* overflow-x-clip (not -hidden) on the root: clips horizontal overhang
     WITHOUT creating a scroll container — position:sticky beats need this. */
  return (
    <div
      ref={rootRef}
      className="relative min-h-screen overflow-x-clip bg-background text-foreground"
    >
      <style>{`
        /* Metal CTA (MetalFx) — the ONE liquid-metal primary per screen.
           (WaitlistForm's "metal" variant depends on this.) */
        .btn-chrome {
          position: relative; overflow: hidden;
          background: linear-gradient(180deg, hsl(var(--silver-hi)) 0%, hsl(var(--silver)) 46%, hsl(var(--silver-lo)) 58%, hsl(var(--silver-hi)) 100%);
          color: hsl(var(--obsidian-0));
          border: 1px solid hsl(var(--crimson) / 0.55);
          box-shadow: 0 2px 12px hsl(var(--crimson-glow)), inset 0 1px 0 hsl(var(--silver-hi) / 0.85);
          transition: box-shadow .2s ease, transform .15s ease;
        }
        .btn-chrome:hover {
          box-shadow: 0 6px 24px hsl(var(--crimson) / 0.5), inset 0 1px 0 hsl(var(--silver-hi) / 0.95);
          transform: translateY(-1px);
        }
        .btn-chrome:active { transform: translateY(0); }
        .btn-chrome::after {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(115deg, transparent 32%, hsl(var(--silver-hi) / 0.65) 48%, transparent 64%);
          background-size: 250% 100%; background-position: 210% 0;
          transition: background-position .65s ease;
        }
        .btn-chrome:hover::after { background-position: -60% 0; }
        .btn-chrome:disabled { opacity: 0.6; cursor: not-allowed; }
        @media (prefers-reduced-motion: reduce) {
          .btn-chrome, .btn-chrome::after { transition: none; }
        }

        /* Silver metal sheen for the nameplate — token-only. */
        .wordmark-metal {
          background-image: linear-gradient(100deg, hsl(var(--silver-mute)) 0%, hsl(var(--silver)) 25%, hsl(var(--silver-hi)) 50%, hsl(var(--silver)) 75%, hsl(var(--silver-mute)) 100%);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
      `}</style>

      {/* scroll progress — silver into crimson (anime scrub; hidden when
          reduced — a bar that never moves is noise, not signal) */}
      {!reduced && (
        <div
          ref={progressRef}
          aria-hidden
          className="fixed left-0 right-0 top-0 z-[200] h-[2px] origin-left"
          style={{
            transform: "scaleX(1)",
            background:
              "linear-gradient(90deg, hsl(var(--silver-mute)), hsl(var(--silver)) 55%, hsl(var(--crimson)))",
          }}
        />
      )}

      {/* NAV — quiet telemetry pill: links only, no status chips */}
      <header className="fixed inset-x-0 top-5 z-[150] flex justify-center px-4">
        <nav
          aria-label="Main"
          className="flex items-center gap-1.5 rounded-md border px-2 py-1.5 backdrop-blur-xl"
          style={{
            borderColor: "hsl(var(--line))",
            backgroundColor: "hsl(var(--obsidian-0) / 0.65)",
          }}
        >
          <Link
            href="/pricing"
            className="whitespace-nowrap px-2 py-1.5 font-display text-label uppercase text-muted-foreground transition-colors hover:text-foreground sm:px-3"
            style={{ fontWeight: 500, fontStretch: "70%" }}
            data-testid="button-pricing"
          >
            Pricing
          </Link>
          <Link
            href="/scout"
            className="whitespace-nowrap px-2 py-1.5 font-display text-label uppercase text-muted-foreground transition-colors hover:text-foreground sm:px-3"
            style={{ fontWeight: 500, fontStretch: "70%" }}
            data-testid="button-scout-hub"
          >
            Scout
          </Link>
          {/* hairline divider — keeps Sign in from reading as a third peer
              tab in the pill; it is an action, not a section. */}
          <span
            aria-hidden
            className="mx-1 h-4 w-px shrink-0"
            style={{ backgroundColor: "hsl(var(--line))" }}
          />
          <Link
            href="/login"
            className="angle-cut flex shrink-0 items-center gap-1.5 whitespace-nowrap bg-foreground/10 px-2.5 py-1.5 font-display text-label uppercase text-foreground transition-colors hover:bg-foreground/20 sm:px-3.5"
            style={{ fontWeight: 500, fontStretch: "70%" }}
            data-testid="button-login"
          >
            Sign in
            {/* The span is the motion target, not the <svg>: anime maps `x` onto
                the SVG element's native `x` ATTRIBUTE, so animating the icon
                directly moves nothing. See the note in lib/motion.ts. */}
            <span ref={signInArrowRef} aria-hidden className="inline-flex">
              <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </nav>
      </header>

      <main className="relative z-10">
        <TheCall reduced={reduced} />
      </main>

      {/* FOOTER — the honest line stays */}
      <footer
        className="relative z-10 border-t px-5 py-16 sm:px-8"
        style={{ borderColor: "hsl(var(--line))" }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 grid gap-10 md:grid-cols-4">
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center gap-2.5">
                <CaliberLogo size={34} chrome />
                <span
                  className="wordmark-metal uppercase text-section"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                  }}
                >
                  Caliber
                </span>
              </div>
              <p className="max-w-xs font-body text-sm leading-relaxed text-muted-foreground">
                The performance platform for serious athletes. Track your game,
                earn your rank, get discovered.
              </p>
            </div>
            <div className="space-y-3">
              <h4
                className="font-display text-label uppercase text-foreground"
                style={{ fontWeight: 500, fontStretch: "70%" }}
              >
                Platform
              </h4>
              <Link href="/pricing" className="block font-body text-sm text-muted-foreground transition-colors hover:text-foreground" data-testid="footer-link-pricing">
                Pricing
              </Link>
              <Link href="/scout" className="block font-body text-sm text-muted-foreground transition-colors hover:text-foreground" data-testid="footer-link-scout-hub">
                Scout Hub
              </Link>
            </div>
            <div className="space-y-3">
              <h4
                className="font-display text-label uppercase text-foreground"
                style={{ fontWeight: 500, fontStretch: "70%" }}
              >
                Get Started
              </h4>
              {/* Plain anchor, not wouter's <Link>: #join is a position on THIS
                  page (BeatCall), not a route. Without this the only way to
                  reach the waitlist was to scroll all four beats. */}
              <a href="#join" className="block font-body text-sm text-muted-foreground transition-colors hover:text-foreground" data-testid="footer-link-join">
                Join the founding class
              </a>
              <Link href="/login" className="block font-body text-sm text-muted-foreground transition-colors hover:text-foreground" data-testid="footer-link-sign-in">
                Sign In
              </Link>
              <Link href="/register" className="block font-body text-sm text-muted-foreground transition-colors hover:text-foreground" data-testid="footer-link-create-account">
                Create Account
              </Link>
            </div>
          </div>
          <div
            className="flex flex-col items-center justify-between gap-3 border-t pt-8 sm:flex-row"
            style={{ borderColor: "hsl(var(--line))" }}
          >
            <span
              className="font-display text-label uppercase text-muted-foreground"
              style={{ fontWeight: 500, fontStretch: "70%" }}
            >
              &copy; {new Date().getFullYear()} Caliber Performance Labs
            </span>
            <span
              className="font-display text-label uppercase text-accent"
              style={{ fontWeight: 500, fontStretch: "70%" }}
            >
              caliber.app
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
