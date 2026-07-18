import { useLayoutEffect, useRef } from "react";
import { Check } from "lucide-react";
import { Link } from "wouter";
import { WaitlistForm } from "@/components/WaitlistForm";
import { SectionEyebrow } from "@/components/signal";
import { runScrollScrub, stagger } from "@/lib/motion";
import { METAL_TEXT_STYLE, SceneHead } from "./shared";

/**
 * Scene 05 — THE ASK. The story's conclusion: the honest coach offer and the
 * quiet waitlist arrive as narrative payoff, then the final CTA. Normal
 * document flow (no pin — the story lands and stays); entrance is scrubbed
 * on the way in and resolves to rest. WaitlistForm wiring and the coach
 * checkbox are untouched.
 */

const COACH_POINTS = [
  "A team dashboard with every player's grades and trends",
  "Game verification, lineup analytics, and practice tracking",
  "AI scouting reports you can share with college recruiters",
];

export function SceneAsk({ reduced }: { reduced: boolean }) {
  const driverRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (reduced) return;
    const risers = Array.from(
      driverRef.current?.querySelectorAll<HTMLElement>("[data-ask-rise]") ?? [],
    );

    return runScrollScrub({
      driver: driverRef.current,
      /* reveal while entering; fully resolved by mid-viewport */
      enter: "bottom top",
      leave: "center center",
      targets: risers,
      build: (tl) => {
        if (risers.length === 0) return;
        tl.add(
          risers,
          { opacity: [0, 1], y: [22, 0], duration: 420, delay: stagger(90) },
          0,
        );
      },
    });
  }, [reduced]);

  return (
    <section
      ref={driverRef}
      className="relative px-5 py-section sm:px-8"
      id="cta"
      data-testid="section-coaches"
    >
      <div className="mx-auto max-w-6xl">
        <div data-ask-rise>
          <SectionEyebrow>05 · The Ask</SectionEyebrow>
        </div>

        <div className="mt-6 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div data-ask-rise>
              <SceneHead>
                Send a stat sheet.{" "}
                <span style={{ color: "hsl(var(--crimson))" }}>
                  Get back report cards.
                </span>
              </SceneHead>
            </div>
            <p
              data-ask-rise
              className="mt-5 max-w-xl font-body text-base leading-relaxed text-muted-foreground"
            >
              Want proof before you commit ten minutes? Send the stat sheet
              from your last game and we'll return a graded report card for
              every player within a day — free, no signup. We're early, and
              that's the opportunity: founding Montana programs get free
              access, set up personally by the founder, and a direct line to
              shape what gets built next.
            </p>
            <ul data-ask-rise className="mt-6 space-y-3">
              {COACH_POINTS.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 font-body text-sm text-foreground/85"
                >
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent/12 text-accent">
                    <Check className="h-3 w-3" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div data-ask-rise>
            <div
              className="gloss rounded-card border p-6 sm:p-7"
              style={{
                backgroundColor: "hsl(var(--obsidian-1))",
                borderColor: "hsl(var(--line))",
              }}
            >
              <p
                className="font-display text-label uppercase text-muted-foreground"
                style={{ fontWeight: 500, fontStretch: "70%" }}
              >
                Founding team access · Free
              </p>
              <p className="mt-3 font-body text-sm leading-relaxed text-muted-foreground">
                Drop your email and we'll reach out to set your program up —
                or just reply to our email with a stat sheet.
              </p>
              <WaitlistForm
                source="landing-coaches"
                variant="quiet"
                defaultCoach
                className="mt-5"
              />
            </div>
          </div>
        </div>

        {/* the final beat — the story ends where the player starts. The one
            genuine hero moment left on the page: chrome sheen carries the
            line, crimson lands only on the payoff word (operator 2026-07-17
            — "not just all red"). */}
        <div data-ask-rise className="mt-24 text-center sm:mt-28">
          <h2
            className="lean mx-auto leading-none text-hero"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              ...METAL_TEXT_STYLE,
            }}
          >
            Know your{" "}
            <span
              style={{
                color: "hsl(var(--crimson))",
                textShadow: "0 0 40px hsl(var(--crimson-glow))",
              }}
            >
              caliber
            </span>
            .
          </h2>
          <p className="mx-auto mt-6 max-w-xl font-body text-base leading-relaxed text-muted-foreground">
            Be one of the first athletes on the platform. Log a game, get
            graded, and start climbing — free.
          </p>
          <div className="mt-9 flex flex-col items-center gap-4">
            <a
              href="#join"
              className="angle-cut inline-flex h-12 items-center justify-center border px-7 font-display uppercase transition-colors hover:border-accent/60"
              style={{
                fontWeight: 800,
                fontStretch: "110%",
                fontSize: "var(--text-body)",
                letterSpacing: "0.06em",
                color: "hsl(var(--silver-hi))",
                borderColor: "hsl(var(--silver) / 0.3)",
                backgroundColor: "hsl(var(--obsidian-2))",
              }}
              data-testid="button-cta-join"
            >
              Join the founding class
            </a>
            <Link
              href="/pricing"
              className="font-display text-label uppercase text-muted-foreground transition-colors hover:text-foreground"
              style={{ fontWeight: 500, fontStretch: "70%" }}
              data-testid="button-cta-pricing"
            >
              View pricing →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
