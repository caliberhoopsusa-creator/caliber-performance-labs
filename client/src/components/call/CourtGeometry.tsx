import type { Ref } from "react";

/**
 * CourtGeometry — the gym, drawn entirely from tokens. No photography, no
 * stock art (DESIGN-LANGUAGE §1.2: data is the decoration).
 *
 * The court is laid out in fake one-point perspective: the near baseline is
 * wide at the bottom, the sidelines converge toward a vanishing point behind
 * the far rim. That is what lets the camera "push down the floor" as the story
 * scrolls — scaling this plane reads as forward travel, not as a zoom.
 *
 * Every stroke carries `pathLength={1}` + `strokeDasharray={1}`, so a draw-on
 * is just `strokeDashoffset: [1, 0]` — no path measurement, no layout reads.
 * The JSX renders the FINAL state (offset 0, fully drawn) so reduced motion and
 * any timeline failure leave a complete court on screen.
 *
 * Elements carry `data-draw` with a band number; the camera stages the draw in
 * bands (floor first, then the key, then the rim) via a stagger.
 */

const LINE = "hsl(var(--silver) / 0.22)";
const LINE_FAINT = "hsl(var(--silver) / 0.10)";
const RIM = "hsl(var(--crimson) / 0.55)";

/** Vanishing point — everything converges here, just above the far baseline. */
const VP_X = 800;
const VP_Y = 286;

/** Floor boards: near-edge x positions that all run back to the vanishing point. */
const BOARD_X = [-260, 60, 380, 700, 900, 1220, 1540, 1860];

export function CourtGeometry({ svgRef }: { svgRef?: Ref<SVGSVGElement> }) {
  return (
    <svg
      ref={svgRef}
      aria-hidden
      className="h-full w-full"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMax slice"
      fill="none"
    >
      {/* floorboards — the faintest layer, pure depth cue */}
      <g stroke={LINE_FAINT} strokeWidth={1}>
        {BOARD_X.map((x) => (
          <line
            key={x}
            x1={x}
            y1={900}
            x2={VP_X}
            y2={VP_Y}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={0}
            data-draw="0"
          />
        ))}
      </g>

      <g stroke={LINE} strokeWidth={1.5} strokeLinecap="round">
        {/* sidelines — the two rails the camera travels between */}
        <line x1={-120} y1={900} x2={548} y2={VP_Y} pathLength={1} strokeDasharray={1} strokeDashoffset={0} data-draw="1" />
        <line x1={1720} y1={900} x2={1052} y2={VP_Y} pathLength={1} strokeDasharray={1} strokeDashoffset={0} data-draw="1" />

        {/* far baseline */}
        <line x1={548} y1={VP_Y} x2={1052} y2={VP_Y} pathLength={1} strokeDasharray={1} strokeDashoffset={0} data-draw="1" />

        {/* half-court line + center circle (squashed by perspective) */}
        <line x1={296} y1={560} x2={1304} y2={560} pathLength={1} strokeDasharray={1} strokeDashoffset={0} data-draw="2" />
        <ellipse cx={VP_X} cy={560} rx={168} ry={44} pathLength={1} strokeDasharray={1} strokeDashoffset={0} data-draw="2" />

        {/* the key — a trapezoid running back to the far baseline */}
        <path
          d={`M 660 ${VP_Y} L 940 ${VP_Y} L 1006 424 L 594 424 Z`}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={0}
          data-draw="3"
        />
        {/* free-throw circle */}
        <ellipse cx={VP_X} cy={424} rx={118} ry={30} pathLength={1} strokeDasharray={1} strokeDashoffset={0} data-draw="3" />

        {/* three-point arc */}
        <path
          d={`M 470 ${VP_Y} C 470 470, 1130 470, 1130 ${VP_Y}`}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={0}
          data-draw="3"
        />
      </g>

      {/* backboard + rim — the only warm line in the empty gym, and the thing
          the whole composition points at */}
      <g strokeLinecap="round">
        <line
          x1={726}
          y1={252}
          x2={874}
          y2={252}
          stroke={LINE}
          strokeWidth={2}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={0}
          data-draw="4"
        />
        <line
          x1={VP_X}
          y1={252}
          x2={VP_X}
          y2={276}
          stroke={LINE}
          strokeWidth={1.5}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={0}
          data-draw="4"
        />
        <ellipse
          cx={VP_X}
          cy={280}
          rx={34}
          ry={9}
          stroke={RIM}
          strokeWidth={2}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={0}
          data-draw="4"
        />
      </g>
    </svg>
  );
}
