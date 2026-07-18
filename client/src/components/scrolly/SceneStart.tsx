import { useLayoutEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { WaitlistForm } from "@/components/WaitlistForm";
import {
  SectionEyebrow,
  TelemetryStrip,
  type TelemetryItem,
} from "@/components/signal";
import { runScrollScrub, stagger } from "@/lib/motion";
import { MonoChip, SceneHead } from "./shared";

/**
 * Scene 00 — PRESS START. The first scroll beat after the vast, quiet hero:
 * the pitch and the waitlist rise in (the information the hero deliberately
 * withholds). Normal document flow — no pin; entrance is scrubbed on the way
 * in and resolves to rest (same pattern as THE ASK).
 *
 * Owns the #join anchor (the nav CTA and THE ASK's final button point here)
 * and the platform telemetry — real counts only, quiet, under a hairline.
 */

export function SceneStart({ reduced }: { reduced: boolean }) {
  const driverRef = useRef<HTMLElement>(null);
  const { data: platformStats } = useQuery<{
    playerCount: number;
    gameCount: number;
    badgeCount: number;
    coachCount: number;
  }>({
    queryKey: ["/api/public/platform-stats"],
  });

  useLayoutEffect(() => {
    if (reduced) return;
    const risers = Array.from(
      driverRef.current?.querySelectorAll<HTMLElement>("[data-start-rise]") ??
        [],
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

  // Product truths + live platform numbers (real, never inflated).
  const telemetry: TelemetryItem[] = [
    { label: "Grade scale", value: "A–F" },
    { label: "Categories", value: 6 },
    { label: "Time to log", value: "<2 min" },
    ...(platformStats
      ? [
          { label: "Athletes", value: platformStats.playerCount },
          { label: "Games graded", value: platformStats.gameCount },
        ]
      : []),
  ];

  return (
    <section
      ref={driverRef}
      className="relative px-5 py-section sm:px-8"
      data-testid="scene-start"
    >
      <div className="mx-auto max-w-6xl">
        <div data-start-rise>
          <SectionEyebrow>00 · Press Start</SectionEyebrow>
        </div>

        <div className="mt-6 grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          {/* the pitch — what the quiet hero deliberately holds back */}
          <div className="flex flex-col items-start">
            <div data-start-rise>
              <MonoChip tone="crimson" data-testid="chip-founding-class">
                Founding class open
              </MonoChip>
            </div>

            <div data-start-rise className="mt-6">
              <SceneHead data-testid="start-headline">
                Every game,{" "}
                <span
                  style={{
                    color: "hsl(var(--crimson))",
                    textShadow: "0 0 40px hsl(var(--crimson-glow))",
                  }}
                >
                  graded.
                </span>
              </SceneHead>
            </div>

            <p
              data-start-rise
              className="mt-5 max-w-md font-body text-base leading-relaxed text-muted-foreground"
            >
              Your season, played like career mode. Log the game, watch your
              Caliber Score move, and build the graded record that gets you
              scouted — every number earned on the floor.
            </p>
          </div>

          {/* the waitlist — #join lives here (nav CTA + THE ASK anchor) */}
          <div data-start-rise>
            <div id="join" className="scroll-mt-28">
              <WaitlistForm source="landing-hero" variant="console" />
              <p
                className="mt-3 font-display text-label uppercase text-muted-foreground"
                style={{ fontWeight: 500, fontStretch: "70%" }}
              >
                Free to start · No credit card · Be one of the first
              </p>
            </div>
          </div>
        </div>

        {/* platform telemetry — honest counts, quiet, under a hairline */}
        <div
          data-start-rise
          className="mt-14 border-t pt-6"
          style={{ borderColor: "hsl(var(--line))" }}
        >
          <TelemetryStrip items={telemetry} data-testid="platform-telemetry" />
        </div>
      </div>
    </section>
  );
}
