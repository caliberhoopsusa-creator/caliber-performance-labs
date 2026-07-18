import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { PlayerCard } from "@/components/signal";
import { addTextCounter, runScrollScrub } from "@/lib/motion";
import { METAL_TEXT_STYLE, ScrollScene } from "./shared";

/**
 * Scene 03 — THE CLIMB. The DEMO PlayerCard (relocated from the old hero) is
 * the YOU anchor: it rises in beside the board while leaderboard rows drift
 * downward past the pinned, highlighted YOU row (relative motion = you rising
 * through the board). The season rank scrubs 47 → 12 in the card's footer —
 * chrome digits, crimson #.
 *
 * Rows and card values are illustrative sample data (labeled DEMO on the card
 * and once in scene 01) — generic initials, never real users. Motion:
 * transform/opacity only; counters rewrite textContent (tabular, zero layout
 * shift). The OVR count-up restarts the first time the scene enters view.
 */

const RANK_FROM = 47;
const RANK_TO = 12;

/* Labeled product demo — sample data only, never presented as a real player. */
const DEMO_PLAYER = {
  name: "Your Name Here",
  position: "PG",
  jerseyNumber: "00",
  school: "Your School · Montana",
  score: 91,
  grades: ["A-", "B+", "A", "B+"],
} as const;

/* The board YOU rises through — final neighborhood around rank 12. */
const BOARD_ROWS = [
  { rank: 9, name: "M. OKAFOR", pos: "C", ovr: 89 },
  { rank: 10, name: "D. LARSON", pos: "SG", ovr: 88 },
  { rank: 11, name: "J. REYES", pos: "PF", ovr: 87 },
  { rank: 13, name: "T. WALKER", pos: "SG", ovr: 84 },
  { rank: 14, name: "A. BRYANT", pos: "PG", ovr: 84 },
  { rank: 15, name: "C. DUMONT", pos: "SF", ovr: 83 },
  { rank: 16, name: "R. HOLT", pos: "PG", ovr: 82 },
  { rank: 17, name: "K. NEWSOM", pos: "C", ovr: 81 },
] as const;

function BoardRow({
  rank,
  name,
  pos,
  ovr,
}: {
  rank: number | string;
  name: string;
  pos: string;
  ovr: number;
}) {
  return (
    <div
      className="grid grid-cols-[2.5rem_1fr_2.5rem_2.5rem] items-center gap-2 border-b px-3 py-2.5 font-mono sm:gap-3 sm:px-4"
      style={{ borderColor: "hsl(var(--line))", fontSize: "var(--text-data)" }}
    >
      <span className="text-muted-foreground">{rank}</span>
      <span className="truncate text-foreground/85">{name}</span>
      <span className="text-muted-foreground">{pos}</span>
      <span className="text-right text-foreground">{ovr}</span>
    </div>
  );
}

export function SceneClimb({ reduced }: { reduced: boolean }) {
  const driverRef = useRef<HTMLElement>(null);
  const cardWrapRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const youRankRef = useRef<HTMLSpanElement>(null);
  const boardWrapRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<HTMLDivElement>(null);
  const youRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLParagraphElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  /* Bumping this key remounts the PlayerCard so its OVR count-up plays when
     the scene is actually on screen — not silently at page load. */
  const [cardKey, setCardKey] = useState(0);

  useEffect(() => {
    if (reduced) return; // count-up already renders its final frame
    const driver = driverRef.current;
    if (!driver || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setCardKey((k) => k + 1);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(driver);
    return () => io.disconnect();
  }, [reduced]);

  useLayoutEffect(() => {
    if (reduced) return;
    const cardWrap = cardWrapRef.current;
    const counter = counterRef.current;
    const youRank = youRankRef.current;
    const boardWrap = boardWrapRef.current;
    const rows = rowsRef.current;
    const you = youRef.current;
    const head = headRef.current;
    const sub = subRef.current;

    return runScrollScrub({
      driver: driverRef.current,
      targets: [cardWrap, boardWrap, rows, you, head, sub],
      build: (tl) => {
        if (
          !cardWrap ||
          !counter ||
          !youRank ||
          !boardWrap ||
          !rows ||
          !you ||
          !head ||
          !sub
        )
          return;
        tl.add(head, { opacity: [0, 1], y: [12, 0], duration: 90 }, 0);
        /* YOU arrives — the demo card rises in as the scene's anchor */
        tl.add(cardWrap, { opacity: [0, 1], y: [24, 0], duration: 130 }, 30);
        tl.add(boardWrap, { opacity: [0, 1], duration: 110 }, 60);
        /* the board slides DOWN past the pinned YOU row — you're rising */
        tl.add(rows, { y: ["-34%", "18%"], duration: 820, ease: "inOutSine" }, 90);
        /* YOU settles in and its glow earns intensity as the rank climbs */
        tl.add(you, { opacity: [0, 1], y: [16, 0], duration: 120 }, 120);
        /* rank counters — the card-footer numeral and the YOU cell, in lockstep */
        addTextCounter(tl, counter, {
          from: RANK_FROM,
          to: RANK_TO,
          duration: 700,
          at: 170,
        });
        addTextCounter(tl, youRank, {
          from: RANK_FROM,
          to: RANK_TO,
          duration: 700,
          at: 170,
        });
        tl.add(sub, { opacity: [0, 1], y: [10, 0], duration: 100 }, 880);
      },
    });
  }, [reduced]);

  return (
    <ScrollScene
      eyebrow="03 · The Climb"
      heightVh={220}
      reduced={reduced}
      driverRef={driverRef}
      data-testid="scene-climb"
    >
      <p
        ref={headRef}
        className="max-w-xl font-body text-base leading-relaxed text-muted-foreground"
      >
        Every grade moves your rank. The board updates as games post — climb it.
      </p>

      <div className="mt-6 grid items-center gap-8 sm:mt-10 md:grid-cols-[minmax(0,21rem)_1fr] md:gap-12">
        {/* YOU — the labeled DEMO card; season rank scrubs in its footer */}
        <div ref={cardWrapRef} className="w-full max-w-sm">
          <PlayerCard
            key={`climb-${cardKey}`}
            name={DEMO_PLAYER.name}
            position={DEMO_PLAYER.position}
            jerseyNumber={DEMO_PLAYER.jerseyNumber}
            school={DEMO_PLAYER.school}
            score={DEMO_PLAYER.score}
            grades={[...DEMO_PLAYER.grades]}
            demo
            data-testid="demo-player-card"
            footer={
              <div
                className="border-t pt-4"
                style={{ borderColor: "hsl(var(--line))" }}
              >
                <span
                  className="font-display text-label uppercase text-muted-foreground"
                  style={{ fontWeight: 500, fontStretch: "70%" }}
                >
                  Season rank
                </span>
                <div
                  className="mt-1 leading-none"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 900,
                    fontStretch: "125%",
                    fontSize: "var(--text-stat)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                  data-testid="scene-climb-rank"
                >
                  <span aria-hidden style={{ color: "hsl(var(--crimson))" }}>
                    #
                  </span>
                  {/* chrome digits — the wordmark's metal band on the rank (§4) */}
                  <span ref={counterRef} style={METAL_TEXT_STYLE}>
                    {RANK_TO}
                  </span>
                </div>
                <p
                  className="mt-3 font-mono text-muted-foreground"
                  style={{ fontSize: "var(--text-data)" }}
                >
                  PRODUCT DEMO · sample data — your real games go here
                </p>
              </div>
            }
          />
        </div>

        {/* the board — rows drift past the pinned YOU (md+; the card carries
            the story alone on small screens, where both won't fit a pin) */}
        <div
          ref={boardWrapRef}
          className="relative hidden max-w-md overflow-hidden border md:block"
          style={{
            height: "clamp(15rem, 40vh, 19rem)",
            backgroundColor: "hsl(var(--obsidian-1) / 0.6)",
            borderColor: "hsl(var(--line))",
          }}
        >
          <div ref={rowsRef} className="absolute inset-x-0 top-1/2">
            <div className="-translate-y-1/2">
              {BOARD_ROWS.map((r) => (
                <BoardRow key={r.rank} {...r} />
              ))}
            </div>
          </div>
          {/* YOU — pinned center, crimson-earned */}
          <div
            ref={youRef}
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-y"
            style={{
              backgroundColor: "hsl(var(--obsidian-2))",
              borderColor: "hsl(var(--crimson) / 0.55)",
              boxShadow: "0 0 32px hsl(var(--crimson-glow))",
            }}
            data-testid="scene-climb-you"
          >
            <div
              className="grid grid-cols-[2.5rem_1fr_2.5rem_2.5rem] items-center gap-2 px-3 py-3 font-mono sm:gap-3 sm:px-4"
              style={{ fontSize: "var(--text-data)" }}
            >
              <span
                style={{
                  color: "hsl(var(--crimson-hot))",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <span ref={youRankRef}>{RANK_TO}</span>
              </span>
              <span className="truncate font-medium text-foreground">YOU</span>
              <span className="text-muted-foreground">PG</span>
              <span className="text-right" style={{ color: "hsl(var(--crimson-hot))" }}>
                91
              </span>
            </div>
          </div>
          {/* board fade at the edges — rows enter/exit through obsidian */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, hsl(var(--obsidian-0)) 0%, transparent 22%, transparent 78%, hsl(var(--obsidian-0)) 100%)",
            }}
          />
        </div>
      </div>

      <p
        ref={subRef}
        className="mt-8 hidden max-w-md font-body text-sm leading-relaxed text-muted-foreground sm:block"
      >
        Badges unlock on the way up — earned from real games only, never bought.
      </p>
    </ScrollScene>
  );
}
