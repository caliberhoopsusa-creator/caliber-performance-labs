import { useLayoutEffect, useRef } from "react";
import { runScrollScrub, stagger } from "@/lib/motion";
import { MonoChip, ScrollScene } from "./shared";

/**
 * Scene 01 — THE GAME. A stat line types itself out in JetBrains Mono as you
 * scroll (scroll back and it untypes). Sparse: just the numbers on obsidian.
 *
 * "Typing" = per-character opacity snaps staggered along the scrub — pure
 * opacity (compositor rule), fully reversible, no layout shift (the full
 * line always occupies its space). Carries the story's ONE demo-data label.
 */

const STAT_WORDS = ["14 PTS", "·", "6 REB", "·", "3 AST", "·", "TUESDAY NIGHT"];

export function SceneGame({ reduced }: { reduced: boolean }) {
  const driverRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLSpanElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    if (reduced) return;
    const chip = chipRef.current;
    const caret = caretRef.current;
    const sub = subRef.current;
    const chars = Array.from(
      stageRef.current?.querySelectorAll<HTMLElement>("[data-char]") ?? [],
    );

    return runScrollScrub({
      driver: driverRef.current,
      targets: [chip, caret, sub, ...chars],
      build: (tl) => {
        if (!chip || !caret || !sub || chars.length === 0) return;
        /* demo-data label first — the honesty chip opens the story */
        tl.add(chip, { opacity: [0, 1], y: [10, 0], duration: 70 }, 0);
        tl.add(caret, { opacity: [0, 1], duration: 30 }, 90);
        /* the stat line types (each char snaps on over ~1.4% of the scene) */
        tl.add(
          chars,
          {
            opacity: [0, 1],
            duration: 14,
            delay: stagger(620 / chars.length),
          },
          140,
        );
        /* the human line lands once the numbers are down */
        tl.add(sub, { opacity: [0, 1], y: [14, 0], duration: 120 }, 830);
      },
    });
  }, [reduced]);

  return (
    <ScrollScene
      eyebrow="01 · The Game"
      heightVh={200}
      reduced={reduced}
      driverRef={driverRef}
      data-testid="scene-game"
    >
      <div ref={stageRef}>
        <MonoChip chipRef={chipRef} data-testid="chip-demo-story">
          Product demo — sample season
        </MonoChip>

        <p
          className="mt-10 font-mono uppercase leading-snug text-foreground"
          style={{ fontSize: "var(--text-stat)", letterSpacing: "0.02em" }}
          data-testid="scene-game-statline"
        >
          {STAT_WORDS.map((word, wi) => (
            <span key={wi}>
              <span className="inline-block whitespace-nowrap">
              {Array.from(word).map((ch, ci) => (
                <span key={ci} data-char>
                  {ch === " " ? " " : ch}
                </span>
              ))}
              </span>
              {wi < STAT_WORDS.length - 1 ? " " : null}
            </span>
          ))}
          <span
            ref={caretRef}
            aria-hidden
            className="ml-2 inline-block h-[0.85em] w-[0.45em] translate-y-[0.12em] animate-pulse bg-accent motion-reduce:animate-none"
          />
        </p>

        <p
          ref={subRef}
          className="mt-8 max-w-md font-body text-base leading-relaxed text-muted-foreground"
        >
          Every game starts as a stat line. Log yours in under two minutes —
          or let the AI pull it straight from film.
        </p>
      </div>
    </ScrollScene>
  );
}
