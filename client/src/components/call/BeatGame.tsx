import { useLayoutEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { TelemetryStrip, type TelemetryItem } from "@/components/signal";
import { addTextCounter, runScrollScrub, stagger } from "@/lib/motion";
import { ScrollScene, SceneHead, MonoChip } from "./shared";

/**
 * Beat 01 — THE GAME. The house lights come up. The pitch lands, and the
 * platform's real numbers count up under it.
 *
 * Every number here is live from `/api/public/platform-stats` — the video-game
 * feel never invents video-game data (DESIGN-LANGUAGE §1.6). While the query is
 * in flight the counters simply do not render; nothing is faked or placeheld
 * with a plausible-looking figure.
 */

export function BeatGame({ reduced }: { reduced: boolean }) {
  const driverRef = useRef<HTMLElement>(null);

  const { data: stats } = useQuery<{
    playerCount: number;
    gameCount: number;
    badgeCount: number;
    coachCount: number;
  }>({ queryKey: ["/api/public/platform-stats"] });

  useLayoutEffect(() => {
    if (reduced) return;
    const root = driverRef.current;
    if (!root) return;

    const risers = Array.from(root.querySelectorAll<HTMLElement>("[data-rise]"));
    const counters = Array.from(root.querySelectorAll<HTMLElement>("[data-count]"));

    return runScrollScrub({
      driver: root,
      enter: "bottom top",
      leave: "center center",
      targets: [...risers, ...counters],
      build: (tl) => {
        if (risers.length > 0) {
          tl.add(
            risers,
            { opacity: [0, 1], y: [24, 0], duration: 420, delay: stagger(90) },
            0,
          );
        }
        /* numerals climb as the lights do — real values only */
        counters.forEach((el, i) => {
          const to = Number(el.dataset.count ?? "0");
          if (!Number.isFinite(to)) return;
          addTextCounter(tl, el, { from: 0, to, duration: 520, at: 180 + i * 70 });
        });
      },
    });
  }, [reduced, stats]);

  const telemetry: TelemetryItem[] = [
    { label: "Grade scale", value: "A–F" },
    { label: "Categories", value: 6 },
    { label: "Time to log", value: "<2 min" },
  ];

  return (
    <ScrollScene
      eyebrow="01 · The game"
      heightVh={210}
      reduced={reduced}
      driverRef={driverRef}
      maxWidth="56rem"
      data-testid="beat-game"
    >
      <div data-rise>
        <SceneHead data-testid="game-headline">Then the lights come on.</SceneHead>
      </div>

      <p
        data-rise
        className="mt-5 max-w-xl font-body text-base leading-relaxed text-muted-foreground"
      >
        Log the game in under two minutes. Every possession becomes a number,
        every number becomes a record that holds up when a coach asks where it
        came from.
      </p>

      <div data-rise className="mt-8">
        <TelemetryStrip items={telemetry} />
      </div>

      {/* live platform counts — rendered only once the real values arrive */}
      {stats ? (
        <div
          data-rise
          className="mt-10 flex flex-wrap items-end gap-x-12 gap-y-6 border-t pt-8"
          style={{ borderColor: "hsl(var(--line))" }}
          data-testid="game-live-counts"
        >
          <LiveCount value={stats.playerCount} label="Athletes on the platform" />
          <LiveCount value={stats.gameCount} label="Games graded" />
          <LiveCount value={stats.badgeCount} label="Badges available" />
        </div>
      ) : null}

      <div data-rise className="mt-8">
        <MonoChip>Live platform numbers · never inflated</MonoChip>
      </div>
    </ScrollScene>
  );
}

function LiveCount({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <span
        data-count={value}
        className="block tabular-nums leading-none text-stat"
        style={{
          fontFamily: "var(--font-athletic)",
          fontWeight: 900,
          fontStretch: "125%",
          color: "hsl(var(--silver-hi))",
        }}
      >
        {value}
      </span>
      <span
        className="mt-2 block font-display text-label uppercase text-muted-foreground"
        style={{ fontWeight: 500, fontStretch: "70%" }}
      >
        {label}
      </span>
    </div>
  );
}
