/**
 * Name your teammates, right after you finish your own profile (Section 7).
 *
 * This is the loop: the people most likely to want a Caliber card are the four
 * players standing next to you in the team photo, and you are the only person
 * who can name them. Each one becomes a claimable placeholder, and the link
 * you send opens on YOUR card, because the card is the pitch.
 *
 * Deliberately skippable and deliberately capped. Adding a teammate creates a
 * profile for a real teenager who has not agreed to anything yet, so this is a
 * roster, not a contact list to be harvested. The copy says what happens to
 * them rather than hiding it behind "invite friends".
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { color, font, radius, DISPLAY_AXES } from "@/design/caliber/tokens";
import { BASKETBALL_POSITIONS } from "@shared/sports-config";

/** Matches MAX_ROSTER_SIZE on the server. A roster, not a mailing list. */
const MAX_TEAMMATES = 15;
const BLANK = { name: "", position: "" as string };

export interface RosterRow {
  playerId: number;
  name: string;
  position: string;
  claimed: boolean;
  claimUrl: string;
}

const display: React.CSSProperties = {
  fontFamily: font.display,
  fontWeight: DISPLAY_AXES.fontWeight,
  fontStretch: DISPLAY_AXES.fontStretch,
  letterSpacing: "-0.02em",
};

const micro: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: color.fog,
};

const fieldStyle: React.CSSProperties = {
  background: "transparent",
  border: `1px solid ${color.chalkStrong}`,
  borderRadius: radius.pill,
  color: color.bone,
  fontFamily: font.body,
  fontSize: 15,
  minHeight: 44,
  padding: "10px 14px",
  width: "100%",
};

export interface RosterPromptProps {
  /** Where to go when the player is done or skips. Defaults to their home. */
  onDone?: () => void;
}

export default function RosterPrompt({ onDone }: RosterPromptProps) {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const done = onDone ?? (() => navigate("/"));
  const [rows, setRows] = useState([{ ...BLANK }, { ...BLANK }, { ...BLANK }]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  const { data: roster = [] } = useQuery<RosterRow[]>({
    queryKey: ["/api/me/roster"],
    queryFn: async () => {
      const res = await fetch("/api/me/roster", { credentials: "include" });
      if (!res.ok) throw new Error("Could not load your roster");
      return res.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: async (teammates: Array<{ name: string; position: string }>) => {
      const res = await fetch("/api/me/roster", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teammates }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Could not add those teammates");
      }
      return res.json();
    },
    onSuccess: () => {
      setRows([{ ...BLANK }, { ...BLANK }, { ...BLANK }]);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["/api/me/roster"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const filled = rows.filter((r) => r.name.trim() && r.position);
  const remaining = MAX_TEAMMATES - roster.length;

  const update = (index: number, patch: Partial<typeof BLANK>) =>
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const copyLink = async (row: RosterRow) => {
    try {
      await navigator.clipboard.writeText(row.claimUrl);
      setCopied(row.playerId);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("Could not copy that link. Long press it to copy instead.");
    }
  };

  return (
    <div
      style={{
        background: color.court,
        color: color.bone,
        fontFamily: font.body,
        display: "flex",
        flexDirection: "column",
        gap: 24,
        /* The mobile bottom nav and the FAB are fixed over the bottom of the
           viewport, and they sat on top of the primary button. Clear them. */
        padding: "16px 0 120px",
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      <header style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={micro}>Your roster</span>
        <h1 style={{ ...display, fontSize: 28, margin: 0, textWrap: "balance" }}>
          Who do you play with?
        </h1>
        <p style={{ margin: 0, fontSize: 15, color: color.fog, lineHeight: 1.5 }}>
          Name your teammates and we hold a card for each of them. They stay
          private until that person claims theirs, and the link opens on your
          card.
        </p>
      </header>

      {roster.length > 0 && (
        <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={micro}>Held for {roster.length}</span>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {roster.map((r) => (
              <li
                key={r.playerId}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: 12, padding: "12px 14px", borderRadius: radius.card,
                  border: `1px solid ${color.chalkStrong}`,
                }}
              >
                <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                  <span style={{ fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.name}
                  </span>
                  <span style={{ ...micro, color: r.claimed ? color.bone : color.fog }}>
                    {r.claimed ? "Claimed" : `${r.position} · not claimed yet`}
                  </span>
                </span>
                {!r.claimed && (
                  <button
                    type="button"
                    onClick={() => copyLink(r)}
                    style={{
                      background: "none", border: `1px solid ${color.chalkStrong}`,
                      color: color.bone, borderRadius: radius.pill, padding: "8px 14px",
                      fontFamily: font.body, fontSize: 13, cursor: "pointer",
                      minHeight: 44, whiteSpace: "nowrap",
                    }}
                  >
                    {copied === r.playerId ? "Copied" : "Copy link"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {remaining > 0 ? (
        <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rows.map((row, i) => (
            <div key={i} style={{ display: "flex", gap: 8 }}>
              <input
                value={row.name}
                onChange={(e) => update(i, { name: e.target.value })}
                placeholder="Teammate's name"
                aria-label={`Teammate ${i + 1} name`}
                maxLength={80}
                style={{ ...fieldStyle, flex: 2 }}
              />
              <select
                value={row.position}
                onChange={(e) => update(i, { position: e.target.value })}
                aria-label={`Teammate ${i + 1} position`}
                style={{ ...fieldStyle, flex: 1 }}
              >
                <option value="">Pos</option>
                {BASKETBALL_POSITIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          ))}

          {rows.length < remaining && (
            <button
              type="button"
              onClick={() => setRows((prev) => [...prev, { ...BLANK }])}
              style={{
                alignSelf: "flex-start", background: "none", border: "none",
                color: color.fog, fontFamily: font.body, fontSize: 14,
                cursor: "pointer", minHeight: 44, padding: 0,
                textDecoration: "underline",
              }}
            >
              Add another
            </button>
          )}
        </section>
      ) : (
        <p style={{ margin: 0, fontSize: 14, color: color.fog }}>
          That is a full roster. {MAX_TEAMMATES} is the limit.
        </p>
      )}

      {error && (
        <p role="alert" style={{ margin: 0, fontSize: 14, color: color.red }}>
          {error}
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          type="button"
          disabled={filled.length === 0 || addMutation.isPending}
          onClick={() => addMutation.mutate(filled)}
          style={{
            background: filled.length === 0 ? "transparent" : color.bone,
            color: filled.length === 0 ? color.fog : color.ink,
            border: `1px solid ${filled.length === 0 ? color.chalkStrong : color.bone}`,
            borderRadius: radius.pill, padding: "14px 20px", minHeight: 48,
            fontFamily: font.body, fontSize: 16,
            cursor: filled.length === 0 ? "default" : "pointer",
          }}
        >
          {addMutation.isPending
            ? "Holding cards"
            : filled.length === 0
              ? "Add a teammate to continue"
              : `Hold ${filled.length} card${filled.length === 1 ? "" : "s"}`}
        </button>

        <button
          type="button"
          onClick={done}
          style={{
            background: "none", border: "none", color: color.fog,
            fontFamily: font.body, fontSize: 15, cursor: "pointer", minHeight: 44,
          }}
        >
          {roster.length > 0 ? "Done" : "Skip for now"}
        </button>
      </div>
    </div>
  );
}
