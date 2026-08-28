import { useRef } from "react";
import { CameraField } from "./CameraField";
import { BeatDawn } from "./BeatDawn";
import { BeatGame } from "./BeatGame";
import { BeatFilm } from "./BeatFilm";
import { BeatCall } from "./BeatCall";

/**
 * TheCall — the whole landing as ONE continuous camera move (DESIGN-LANGUAGE
 * §4.5). Four beats over a single field that never cuts:
 *
 *   00 6:00 AM        an empty gym, one work light, the nameplate ignites
 *   01 THE GAME       the house lights come up; the real numbers climb
 *   02 THE FILM ROOM  the court falls away; the grade lands
 *   03 THE CALL       near-black, one ember — a program is watching
 *
 * `CameraField` is the sticky field underneath everything; each beat owns its
 * own local entrance scrub. `reduced` renders the same four beats as a static
 * editorial layout — no pinning, no scrubbing, every final state visible.
 */
export function TheCall({ reduced }: { reduced: boolean }) {
  const storyRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={storyRef} className="relative" data-testid="the-call">
      <CameraField reduced={reduced} storyRef={storyRef} />
      <div className="relative z-10">
        <BeatDawn reduced={reduced} />
        <BeatGame reduced={reduced} />
        <BeatFilm reduced={reduced} />
        <BeatCall reduced={reduced} />
      </div>
    </div>
  );
}
