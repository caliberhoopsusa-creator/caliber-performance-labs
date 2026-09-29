/**
 * The leaderboard, as a stack of cards (pivot Section 6A).
 *
 * No tables. No rows. A vertical scroll of the same card component the player
 * already recognises as their own, because the whole point of the pivot is that
 * a rank is a card you could have, not a line in a spreadsheet.
 *
 * Filters are pill chips, not a form: class year, position, state, school.
 * Tapping a card flips it to its back.
 *
 * Ingested distribution players are never listed here. They exist to make the
 * percentile honest, not to pad a ranking (Section 6B).
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CaliberCard, type CardStat } from "@/design/caliber/Card";
import { CaliberCardBack, CaliberCardFlip } from "@/design/caliber/CardBack";
import { color, font, radius, DISPLAY_AXES } from "@/design/caliber/tokens";
import { computeRarity, type RarityTier } from "@shared/rarity";
import { gradeToValue } from "@shared/progression";

interface LeaderboardRow {
  playerId: number;
  name: string;
  team: string | null;
  jerseyNumber: number | null;
  position: string | null;
  state: string | null;
  level: string | null;
  avgPoints: number;
  avgGrade: string;
  gamesPlayed: number;
  /* Present once the API carries them. Optional so this renders against the
     current response shape without pretending the fields exist. */
  school?: string | null;
  graduationYear?: number | null;
  photoUrl?: string | null;
  rarityTier?: RarityTier | null;
  /** Null when the cohort is under MIN_COHORT, so the card back says so. */
  rarityPercentile?: number | null;
  createdAt?: string | null;
}

const display: React.CSSProperties = {
  fontFamily: font.display,
  fontWeight: DISPLAY_AXES.fontWeight,
  fontStretch: DISPLAY_AXES.fontStretch,
  letterSpacing: "-0.02em",
};

/** A filter pill. Pressed state is a real aria-pressed, not just a colour. */
function Chip({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        minHeight: 36,
        padding: "8px 14px",
        borderRadius: radius.pill,
        border: `1px solid ${active ? color.bone : color.chalkStrong}`,
        background: active ? color.bone : "transparent",
        color: active ? color.ink : color.bone,
        fontFamily: font.body,
        fontSize: 13,
        whiteSpace: "nowrap",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

/** One horizontally scrolling row of chips for a single facet. */
function ChipRow({
  title, options, value, onChange,
}: {
  title: string;
  options: string[];
  value: string | null;
  onChange: (next: string | null) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span
        style={{
          fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
          color: color.fog,
        }}
      >
        {title}
      </span>
      <div
        style={{
          display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4,
          scrollbarWidth: "none",
        }}
      >
        <Chip label="All" active={value === null} onClick={() => onChange(null)} />
        {options.map((o) => (
          <Chip
            key={o}
            label={o}
            active={value === o}
            onClick={() => onChange(value === o ? null : o)}
          />
        ))}
      </div>
    </div>
  );
}

export default function CaliberLeaderboard() {
  const [classYear, setClassYear] = useState<string | null>(null);
  const [position, setPosition] = useState<string | null>(null);
  const [state, setState] = useState<string | null>(null);
  const [school, setSchool] = useState<string | null>(null);
  const [flipped, setFlipped] = useState<number | null>(null);

  const { data, isLoading, isError } = useQuery<LeaderboardRow[]>({
    queryKey: ["/api/analytics/leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/leaderboard", { credentials: "include" });
      if (!res.ok) throw new Error("Could not load the leaderboard");
      return res.json();
    },
  });

  const rows = useMemo(() => data ?? [], [data]);

  /* Facet options come from the data, so a filter never offers a value that
     would return nothing. */
  const facets = useMemo(() => {
    const uniq = (xs: Array<string | null | undefined>) =>
      Array.from(new Set(xs.filter((x): x is string => Boolean(x)))).sort();
    return {
      classYears: uniq(rows.map((r) => (r.graduationYear ? `'${String(r.graduationYear).slice(-2)}` : null))),
      positions: uniq(rows.map((r) => r.position?.split(",")[0]?.trim())),
      states: uniq(rows.map((r) => r.state)),
      schools: uniq(rows.map((r) => r.school ?? r.team)),
    };
  }, [rows]);

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (classYear && (!r.graduationYear || `'${String(r.graduationYear).slice(-2)}` !== classYear)) return false;
        if (position && r.position?.split(",")[0]?.trim() !== position) return false;
        if (state && r.state !== state) return false;
        if (school && (r.school ?? r.team) !== school) return false;
        return true;
      }),
    [rows, classYear, position, state, school],
  );

  const shell = (children: React.ReactNode) => (
    <div
      style={{
        background: color.court,
        color: color.bone,
        fontFamily: font.body,
        display: "flex",
        flexDirection: "column",
        gap: 20,
        padding: "8px 0 32px",
      }}
    >
      {children}
    </div>
  );

  if (isLoading) {
    return shell(
      <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
        {[0, 1].map((i) => (
          <div
            key={i}
            style={{
              width: "100%", maxWidth: 380, aspectRatio: "4 / 5",
              borderRadius: radius.card, border: `1px dashed ${color.chalkStrong}`,
            }}
          />
        ))}
      </div>,
    );
  }

  if (isError) {
    return shell(
      <div style={{ textAlign: "center", color: color.fog, padding: 32 }}>
        <p style={{ marginBottom: 12 }}>We could not load the leaderboard.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            background: "none", border: `1px solid ${color.chalkStrong}`,
            color: color.bone, borderRadius: radius.pill, padding: "10px 18px",
            fontFamily: font.body, fontSize: 14, cursor: "pointer", minHeight: 44,
          }}
        >
          Try again
        </button>
      </div>,
    );
  }

  return shell(
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 4px" }}>
        <ChipRow title="Class year" options={facets.classYears} value={classYear} onChange={setClassYear} />
        <ChipRow title="Position" options={facets.positions} value={position} onChange={setPosition} />
        <ChipRow title="State" options={facets.states} value={state} onChange={setState} />
        <ChipRow title="School" options={facets.schools} value={school} onChange={setSchool} />
      </div>

      {filtered.length === 0 ? (
        /* Honest empty state: says what would fill it, does not fake a row. */
        <div style={{ textAlign: "center", color: color.fog, padding: "32px 16px" }}>
          <p style={{ margin: 0, fontSize: 15 }}>
            {rows.length === 0
              ? "No graded players yet. Log a game and you will be the first."
              : "Nobody matches those filters yet."}
          </p>
        </div>
      ) : (
        <ol
          style={{
            listStyle: "none", margin: 0, padding: 0,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 24,
          }}
        >
          {filtered.map((r, i) => {
            const tier: RarityTier =
              r.rarityTier ??
              computeRarity({
                percentile: r.rarityPercentile ?? null,
                createdAt: r.createdAt ?? null,
              });

            const stats: [CardStat, CardStat] = [
              { label: "PPG", value: r.avgPoints.toFixed(1) },
              { label: "GP", value: String(r.gamesPlayed) },
            ];

            const isFlipped = flipped === r.playerId;

            return (
              <li key={r.playerId} style={{ width: "100%", maxWidth: 380 }}>
                {/* Rank sits outside the card. The card front is a fixed seven
                    slots and a rank badge is not one of them. */}
                <div
                  style={{
                    display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8,
                    fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
                    color: color.fog,
                  }}
                >
                  <span style={{ ...display, fontFamily: font.number, color: color.bone }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setFlipped(isFlipped ? null : r.playerId)}
                  aria-pressed={isFlipped}
                  aria-label={`${r.name}, tap to see the back of the card`}
                  style={{
                    display: "block", width: "100%", padding: 0, border: "none",
                    background: "none", cursor: "pointer", textAlign: "left",
                  }}
                >
                  <CaliberCardFlip
                    flipped={isFlipped}
                    front={
                      <CaliberCard
                        name={r.name}
                        position={r.position ?? ""}
                        classYear={r.graduationYear ? `'${String(r.graduationYear).slice(-2)}` : ""}
                        school={r.school ?? r.team ?? ""}
                        grade={r.avgGrade}
                        tier={tier}
                        stats={stats}
                        photoUrl={r.photoUrl}
                        profileUrl={`${window.location.host}/profile/${r.playerId}/public`}
                        size="app"
                      />
                    }
                    back={
                      <CaliberCardBack
                        tier={tier}
                        statLine={[
                          { label: "PPG", value: r.avgPoints.toFixed(1) },
                          { label: "Games", value: String(r.gamesPlayed) },
                          { label: "Grade", value: r.avgGrade },
                        ]}
                        percentile={r.rarityPercentile ?? null}
                        /* The list response carries no per game history, so the
                           back says so rather than drawing an invented line. */
                        history={[]}
                      />
                    }
                  />
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </>,
  );
}
