/**
 * The CALIBER card, on a real surface.
 *
 * Route: /players/:id/caliber
 *
 * Front, back, flip, and the two share actions. This is the first player
 * surface built entirely from the CALIBER design system; the older
 * PlayerCard.tsx is still SIGNAL and is Section 4's problem.
 *
 * Every number here comes from the API. Nothing is invented: a player with no
 * graded games gets a pending card, not a zero.
 */
import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CaliberCard, type CardStat } from "@/design/caliber/Card";
import { CaliberCardBack, CaliberCardFlip, type GradePoint } from "@/design/caliber/CardBack";
import { color, font, radius, DISPLAY_AXES } from "@/design/caliber/tokens";
import { computeRarity, type RarityTier } from "@shared/rarity";
import { caliberGrade, gradeToValue, type Trend } from "@shared/progression";

interface ApiGame {
  id: number;
  date?: string | null;
  grade?: string | null;
  points?: number | null;
  rebounds?: number | null;
  assists?: number | null;
  steals?: number | null;
  blocks?: number | null;
}

interface ApiPlayer {
  id: number;
  name: string;
  position?: string | null;
  school?: string | null;
  graduationYear?: number | null;
  photoUrl?: string | null;
  highlightVideoUrl?: string | null;
  rarityTier?: RarityTier | null;
  rarityPercentile?: number | null;
  createdAt?: string | null;
  trend?: Trend | null;
  games?: ApiGame[];
}


function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function fmt(value: number | null): string {
  return value === null ? "-" : value.toFixed(1);
}

export default function CaliberCardPage() {
  const [, params] = useRoute("/players/:id/caliber");
  const playerId = Number(params?.id);
  const [flipped, setFlipped] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<ApiPlayer>({
    queryKey: ["/api/players", playerId],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Could not load this player");
      return res.json();
    },
    enabled: Number.isFinite(playerId),
  });

  const shell = (children: React.ReactNode) => (
    <div
      style={{
        minHeight: "100vh",
        background: color.court,
        color: color.bone,
        fontFamily: font.body,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        padding: 16,
      }}
    >
      {children}
    </div>
  );

  if (isLoading) {
    // Card shaped skeleton, so the page does not jump when it lands.
    return shell(
      <div
        style={{
          width: "100%", maxWidth: 420, aspectRatio: "4 / 5",
          borderRadius: radius.card, border: `1px dashed ${color.chalkStrong}`,
          display: "grid", placeItems: "center", color: color.fog, fontSize: 13,
        }}
      >
        Loading your card
      </div>,
    );
  }

  if (isError || !data) {
    return shell(
      <div style={{ maxWidth: 420, textAlign: "center", color: color.fog, paddingTop: 64 }}>
        <p style={{ marginBottom: 12 }}>We could not load this card.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            background: "none", border: `1px solid ${color.chalkStrong}`,
            color: color.bone, borderRadius: radius.pill, padding: "8px 18px",
            fontFamily: font.body, fontSize: 14, cursor: "pointer",
          }}
        >
          Try again
        </button>
      </div>,
    );
  }

  const games = data.games ?? [];
  const graded = games.filter((g) => gradeToValue(g.grade) !== null);
  /* THE Caliber Grade is the mean of graded games, not the last one. */
  const overall = caliberGrade(games.map((g) => g.grade));

  /* The tier comes from the server, which computed it against the whole cohort.
     Falling back to computeRarity covers a player who has never been through a
     recompute; it lands them on Rookie or Base, never on something earned. */
  const tier: RarityTier =
    data.rarityTier ??
    computeRarity({ percentile: data.rarityPercentile ?? null, createdAt: data.createdAt ?? null });

  const ppg = mean(games.map((g) => g.points ?? 0));
  const rpg = mean(games.map((g) => g.rebounds ?? 0));
  const apg = mean(games.map((g) => g.assists ?? 0));

  const stats: [CardStat, CardStat] = [
    { label: "PPG", value: fmt(ppg) },
    { label: "RPG", value: fmt(rpg) },
  ];

  const history: GradePoint[] = graded
    .slice()
    .reverse()
    .map((g) => ({
      at: g.date ?? new Date().toISOString(),
      value: gradeToValue(g.grade)!,
    }));

  const profileUrl = `${window.location.host}/profile/${data.id}/public`;
  const cardUrl = `${window.location.origin}/api/players/${data.id}/card.png?size=story`;

  const copy = async (what: "link" | "image") => {
    try {
      if (what === "link") {
        await navigator.clipboard.writeText(`${window.location.origin}/profile/${data.id}/public`);
      } else {
        const blob = await (await fetch(cardUrl)).blob();
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      }
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard is blocked in plenty of contexts. Fall back to opening the
      // image so the player can save it by hand rather than seeing nothing.
      if (what === "image") window.open(cardUrl, "_blank");
    }
  };

  const action: React.CSSProperties = {
    background: "none",
    border: `1px solid ${color.chalkStrong}`,
    color: color.bone,
    borderRadius: radius.pill,
    padding: "10px 18px",
    fontFamily: font.body,
    fontSize: 14,
    cursor: "pointer",
  };

  return shell(
    <>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <CaliberCardFlip
          flipped={flipped}
          front={
            <CaliberCard
              name={data.name}
              position={data.position ?? ""}
              classYear={data.graduationYear ? `'${String(data.graduationYear).slice(-2)}` : ""}
              school={data.school ?? ""}
              grade={overall?.grade ?? "-"}
              trend={data.trend ?? null}
              tier={tier}
              stats={stats}
              photoUrl={data.photoUrl}
              profileUrl={profileUrl}
              size="app"
            />
          }
          back={
            <CaliberCardBack
              tier={tier}
              statLine={[
                { label: "PPG", value: fmt(ppg) },
                { label: "RPG", value: fmt(rpg) },
                { label: "APG", value: fmt(apg) },
                { label: "Games", value: String(games.length) },
              ]}
              history={history}
              highlightUrl={data.highlightVideoUrl}
              percentile={data.rarityPercentile ?? null}
            />
          }
        />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
        <button type="button" style={action} onClick={() => setFlipped((f) => !f)}>
          {flipped ? "Show front" : "Show back"}
        </button>
        <button type="button" style={action} onClick={() => copy("image")}>
          {copied === "image" ? "Copied" : "Copy image"}
        </button>
        <button type="button" style={action} onClick={() => copy("link")}>
          {copied === "link" ? "Copied" : "Copy link"}
        </button>
        <a href={cardUrl} download={`caliber-${data.id}.png`} style={{ ...action, textDecoration: "none" }}>
          Download
        </a>
      </div>

      {graded.length === 0 && (
        <p style={{ color: color.fog, fontSize: 13, maxWidth: 420, textAlign: "center" }}>
          Your grade lands once a game is logged. Until then the card shows what we
          actually know.
        </p>
      )}
    </>,
  );
}
