import { useRef } from "react";
import { Atmosphere } from "./Atmosphere";
import { SceneGame } from "./SceneGame";
import { SceneGrade } from "./SceneGrade";
import { SceneClimb } from "./SceneClimb";
import { SceneScout } from "./SceneScout";
import { SceneAsk } from "./SceneAsk";

/**
 * ScrollyStory — everything below the landing fold as ONE scroll-driven
 * story (DESIGN-LANGUAGE §4.5): five scenes scrubbed by scroll over a single
 * continuous gradient atmosphere. The hero above melts to obsidian at its
 * bottom edge; the atmosphere picks up from obsidian — one camera move.
 *
 *   01 THE GAME   a stat line types itself out
 *   02 THE GRADE  the ring draws, the B+ stamps
 *   03 THE CLIMB  the rank rises through the board
 *   04 THE SCOUT  interest fills, pings land
 *   05 THE ASK    the honest coach offer + waitlist + final CTA
 *
 * `reduced` renders the same story as a static editorial layout — normal
 * flow, no pinning, every scene's final state visible.
 */
export function ScrollyStory({ reduced }: { reduced: boolean }) {
  const storyRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={storyRef}
      className="relative border-t"
      style={{ borderColor: "hsl(var(--line))" }}
      data-testid="scrolly-story"
    >
      <Atmosphere reduced={reduced} storyRef={storyRef} />
      <div className="relative z-10">
        <SceneGame reduced={reduced} />
        <SceneGrade reduced={reduced} />
        <SceneClimb reduced={reduced} />
        <SceneScout reduced={reduced} />
        <SceneAsk reduced={reduced} />
      </div>
    </div>
  );
}
