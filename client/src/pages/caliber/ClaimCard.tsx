/**
 * The claim landing: "see the card that got you invited" (pivot Section 7).
 *
 * A teammate opens this link and the first thing on the screen is the card of
 * the person who sent it. Not a logo, not a value proposition, not a signup
 * form. The card is the pitch, and the only reason this link converts is that
 * somebody they know already has one.
 *
 * Their own name sits underneath, held, waiting. The ask is "this is yours",
 * not "create an account".
 */
import { useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { CaliberCard, type CardStat } from "@/design/caliber/Card";
import { color, font, radius, DISPLAY_AXES } from "@/design/caliber/tokens";
import { computeRarity, type RarityTier } from "@shared/rarity";

interface ClaimPreview {
  placeholderName: string;
  placeholderPlayerId: number;
  referrer: {
    playerId: number;
    name: string;
    position: string;
    school: string | null;
    graduationYear: number | null;
    photoUrl: string | null;
    rarityTier: RarityTier | null;
    rarityPercentile: number | null;
    createdAt: string | null;
    grade: string | null;
    avgPoints: number | null;
    gamesPlayed: number;
  };
  alreadyClaimed: boolean;
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

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: color.court,
        color: color.bone,
        fontFamily: font.body,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        padding: "32px 16px 48px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 24 }}>
        {children}
      </div>
    </div>
  );
}

/**
 * What a referrer with no graded game looks like.
 *
 * The card silhouette, not a card. It keeps the trading card shape so the page
 * still reads as "somebody you know has one of these", without printing a
 * grade nobody has earned.
 */
function PendingPanel({ name, position }: { name: string; position: string }) {
  return (
    <div
      style={{
        border: `1px dashed ${color.chalkStrong}`,
        borderRadius: radius.card,
        padding: "28px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <span style={micro}>Grade pending</span>
      <span style={{ ...display, fontSize: 24 }}>{name}</span>
      <span style={{ fontSize: 14, color: color.fog }}>{position}</span>
      <p style={{ margin: "6px 0 0", fontSize: 14, color: color.fog, lineHeight: 1.5 }}>
        Their Caliber Grade lands after their first game. Yours can start at the
        same time.
      </p>
    </div>
  );
}

export default function ClaimCard() {
  const [, params] = useRoute("/claim/:token");
  const [, navigate] = useLocation();
  const token = params?.token ?? "";

  const { data, isLoading, isError } = useQuery<ClaimPreview>({
    queryKey: ["/api/claim", token],
    enabled: Boolean(token),
    queryFn: async () => {
      const res = await fetch(`/api/claim/${token}`);
      if (!res.ok) throw new Error("That link is not valid");
      return res.json();
    },
  });

  const claimMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/claim/${token}`, {
        method: "POST",
        credentials: "include",
      });
      if (res.status === 401) {
        /* Not signed in yet. Keep the token so the claim survives the round
           trip through signup, the same way JoinPage keeps a referral code. */
        localStorage.setItem("caliber_claim_token", token);
        navigate("/signup");
        return null;
      }
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || "Could not claim that card");
      return body;
    },
    onSuccess: (body) => {
      if (body) navigate("/");
    },
  });

  const tier: RarityTier = useMemo(() => {
    if (!data) return "rookie";
    return (
      data.referrer.rarityTier ??
      computeRarity({
        percentile: data.referrer.rarityPercentile,
        createdAt: data.referrer.createdAt,
      })
    );
  }, [data]);

  if (isLoading) {
    return (
      <Shell>
        <div
          style={{
            width: "100%", aspectRatio: "4 / 5", borderRadius: radius.card,
            border: `1px dashed ${color.chalkStrong}`,
          }}
        />
      </Shell>
    );
  }

  if (isError || !data) {
    return (
      <Shell>
        <div style={{ textAlign: "center", color: color.fog, paddingTop: 48 }}>
          <h1 style={{ ...display, fontSize: 24, color: color.bone, margin: "0 0 8px" }}>
            That link is not valid
          </h1>
          <p style={{ margin: "0 0 20px", fontSize: 15 }}>
            It may have expired, or the card may already be claimed.
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            style={{
              background: color.bone, color: color.ink, border: "none",
              borderRadius: radius.pill, padding: "14px 22px", minHeight: 48,
              fontFamily: font.body, fontSize: 16, cursor: "pointer",
            }}
          >
            See what Caliber is
          </button>
        </div>
      </Shell>
    );
  }

  const { referrer, placeholderName, alreadyClaimed } = data;
  const firstName = referrer.name.split(" ")[0];

  /* Two stats, same as every other card. A referrer with no games has no PPG,
     so the card shows a dash rather than a zero they did not earn. */
  const stats: [CardStat, CardStat] = [
    { label: "PPG", value: referrer.avgPoints === null ? "-" : referrer.avgPoints.toFixed(1) },
    { label: "GP", value: String(referrer.gamesPlayed) },
  ];

  /* The common case, not the edge case. A player builds their roster right
     after signing up, which is before they have logged a game, so most claim
     links arrive from somebody with no grade yet.
     Rendering the card anyway put a dash in the grade plate at display size,
     which reads as broken rather than as pending, and "this is their Caliber"
     is not true of a player who does not have one yet. So this says what is
     actually happening instead. Same rule as GradePending: no fabricated
     grade, and no hollow card pretending to be one. */
  const graded = referrer.grade !== null;

  return (
    <Shell>
      <header style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={micro}>{firstName} sent you this</span>
        <h1 style={{ ...display, fontSize: 26, margin: 0, textWrap: "balance" }}>
          {graded ? "This is their Caliber." : `${firstName} is on Caliber.`}
        </h1>
      </header>

      {graded ? (
        <CaliberCard
          name={referrer.name}
          position={referrer.position}
          classYear={referrer.graduationYear ? `'${String(referrer.graduationYear).slice(-2)}` : ""}
          school={referrer.school ?? ""}
          grade={referrer.grade!}
          tier={tier}
          stats={stats}
          photoUrl={referrer.photoUrl}
          profileUrl={`${window.location.host}/profile/${referrer.playerId}/public`}
          size="app"
        />
      ) : (
        <PendingPanel name={referrer.name} position={referrer.position} />
      )}

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5 }}>
          {alreadyClaimed ? (
            <>Somebody has already claimed the card held for {placeholderName}.</>
          ) : (
            <>
              We are holding a card for{" "}
              <strong style={{ color: color.bone }}>{placeholderName}</strong>.
              Claim it and your grade starts from your first game.
            </>
          )}
        </p>

        {!alreadyClaimed && (
          <button
            type="button"
            disabled={claimMutation.isPending}
            onClick={() => claimMutation.mutate()}
            style={{
              background: color.bone, color: color.ink, border: "none",
              borderRadius: radius.pill, padding: "16px 22px", minHeight: 52,
              fontFamily: font.body, fontSize: 17, cursor: "pointer",
            }}
          >
            {claimMutation.isPending ? "Claiming" : `Claim ${placeholderName.split(" ")[0]}'s card`}
          </button>
        )}

        {claimMutation.isError && (
          <p role="alert" style={{ margin: 0, fontSize: 14, color: color.red }}>
            {(claimMutation.error as Error).message}
          </p>
        )}

        <button
          type="button"
          onClick={() => navigate("/")}
          style={{
            background: "none", border: "none", color: color.fog,
            fontFamily: font.body, fontSize: 15, cursor: "pointer", minHeight: 44,
          }}
        >
          {alreadyClaimed ? "See what Caliber is" : "Not me"}
        </button>
      </section>
    </Shell>
  );
}
