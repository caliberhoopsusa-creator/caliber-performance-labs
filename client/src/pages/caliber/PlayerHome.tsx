/**
 * The player's logged in home (pivot Section 4A).
 *
 * Three things above the fold and nothing else: their card, the share actions,
 * and a prompt to bring their team. That is the whole loop the pivot is built
 * around, so anything else competing for the first screen is a distraction.
 *
 * Replaces the old player home, which was `/community?tab=feed`, a social feed.
 * Landing a player on someone else's content was the clearest artifact of the
 * coach first era: the player never saw their own number first.
 *
 * A player with no graded games gets the pending state, not a zero.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { CaliberCard, type CardStat } from "@/design/caliber/Card";
import { color, font, radius, DISPLAY_AXES } from "@/design/caliber/tokens";
import { computeRarity, type RarityTier } from "@shared/rarity";
import { caliberGrade, gradeToValue, type Trend } from "@shared/progression";
import GradePending from "./GradePending";

interface MeResponse {
  playerId: number | null;
}

interface ApiGame {
  grade?: string | null;
  points?: number | null;
  rebounds?: number | null;
}

interface ApiPlayer {
  id: number;
  name: string;
  position?: string | null;
  school?: string | null;
  graduationYear?: number | null;
  photoUrl?: string | null;
  rarityTier?: RarityTier | null;
  rarityPercentile?: number | null;
  createdAt?: string | null;
  trend?: Trend | null;
  games?: ApiGame[];
}


const display: React.CSSProperties = {
  fontFamily: font.display,
  fontWeight: DISPLAY_AXES.fontWeight,
  fontStretch: DISPLAY_AXES.fontStretch,
  letterSpacing: "-0.02em",
};

const action: React.CSSProperties = {
  background: "none",
  border: `1px solid ${color.chalkStrong}`,
  color: color.bone,
  borderRadius: radius.pill,
  padding: "11px 18px",
  fontFamily: font.body,
  fontSize: 14,
  cursor: "pointer",
  minHeight: 44,
};

function mean(values: number[]): number | null {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

export default function PlayerHome() {
  const [copied, setCopied] = useState<string | null>(null);

  const { data: me } = useQuery<MeResponse>({ queryKey: ["/api/users/me"], staleTime: 30000 });
  const playerId = me?.playerId ?? null;

  const { data, isLoading, isError } = useQuery<ApiPlayer>({
    queryKey: ["/api/players", playerId],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Could not load your card");
      return res.json();
    },
    enabled: playerId !== null,
  });

  const shell = (children: React.ReactNode) => (
    <div
      style={{
        background: color.court,
        color: color.bone,
        fontFamily: font.body,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        padding: "8px 0 32px",
      }}
    >
      {children}
    </div>
  );

  if (isLoading || (playerId !== null && !data && !isError)) {
    return shell(
      <div
        style={{
          width: "100%", maxWidth: 380, aspectRatio: "4 / 5",
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
      <div style={{ maxWidth: 380, textAlign: "center", color: color.fog, padding: 32 }}>
        <p style={{ marginBottom: 12 }}>We could not load your card.</p>
        <button type="button" style={action} onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>,
    );
  }

  const games = data.games ?? [];
  const graded = games.filter((g) => gradeToValue(g.grade) !== null);
  /* THE Caliber Grade is the mean of graded games, not the last one. */
  const overall = caliberGrade(games.map((g) => g.grade));

  const tier: RarityTier =
    data.rarityTier ??
    computeRarity({ percentile: data.rarityPercentile ?? null, createdAt: data.createdAt ?? null });

  // No graded film yet, so there is no grade to show. Say so rather than zero.
  if (graded.length === 0) {
    return <GradePending tier={tier} />;
  }

  const ppg = mean(games.map((g) => g.points ?? 0));
  const rpg = mean(games.map((g) => g.rebounds ?? 0));
  const fmt = (v: number | null) => (v === null ? "-" : v.toFixed(1));

  const stats: [CardStat, CardStat] = [
    { label: "PPG", value: fmt(ppg) },
    { label: "RPG", value: fmt(rpg) },
  ];

  const publicUrl = `${window.location.origin}/profile/${data.id}/public`;
  const cardUrl = `${window.location.origin}/api/players/${data.id}/card.png?size=story`;

  /* Uses the referral system that already exists: GET /api/me/referral-code
     returns a code and a /join/:code path. Section 7 builds the roster flow on
     top of it; this is the honest version of the prompt until then. */
  const copyInvite = async () => {
    try {
      const res = await fetch("/api/me/referral-code", { credentials: "include" });
      if (!res.ok) throw new Error("no code");
      const { url } = (await res.json()) as { url: string };
      await navigator.clipboard.writeText(`${window.location.origin}${url}`);
      setCopied("invite");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  };

  const copy = async (what: "link" | "image") => {
    try {
      if (what === "link") {
        await navigator.clipboard.writeText(publicUrl);
      } else {
        const blob = await (await fetch(cardUrl)).blob();
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      }
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard is blocked in plenty of contexts; open the image so the
      // player can still save it rather than seeing nothing happen.
      if (what === "image") window.open(cardUrl, "_blank");
    }
  };

  return shell(
    <>
      {/* 1. The card. */}
      <div style={{ width: "100%", maxWidth: 380 }}>
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
          profileUrl={`${window.location.host}/profile/${data.id}/public`}
          size="app"
        />
      </div>

      {/* 2. Share. */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
        <button type="button" style={action} onClick={() => copy("image")}>
          {copied === "image" ? "Copied" : "Copy image"}
        </button>
        <button type="button" style={action} onClick={() => copy("link")}>
          {copied === "link" ? "Copied" : "Copy link"}
        </button>
        <a href={cardUrl} download={`caliber-${data.id}.png`} style={{ ...action, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
          Download
        </a>
        <Link href={`/players/${data.id}/caliber`}>
          <a style={{ ...action, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
            See the back
          </a>
        </Link>
      </div>

      {/* 3. Bring the team. Uses the referral system that already exists. */}
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          border: `1px solid ${color.chalkStrong}`,
          borderRadius: radius.card,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <h2 style={{ ...display, fontSize: 22, margin: 0 }}>Bring your team</h2>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: color.fog }}>
          Your card is better with people to compare it to. Send your teammates
          their own.
        </p>
        <button
          type="button"
          onClick={copyInvite}
          style={{
            ...action,
            background: color.red,
            border: "none",
            justifyContent: "center",
            fontWeight: 600,
          }}
        >
          {copied === "invite" ? "Invite link copied" : "Invite teammates"}
        </button>
      </div>
    </>,
  );
}
