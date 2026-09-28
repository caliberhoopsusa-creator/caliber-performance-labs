/**
 * The state a player lands in immediately after sign up (pivot Section 4B).
 *
 * A brand new player has no games, so there is no grade and no stat line. The
 * honest options were a zero or a silhouette, and a zero reads as a judgement
 * on a player who has not been judged yet. So this shows the shape of the card
 * they are about to get, using their own rarity outline treatment, and says
 * plainly when it lands.
 *
 * No fabricated grade, no placeholder numbers, no progress bar pretending to
 * know how far along the grading is.
 */
import { useState } from "react";
import { color, font, radius, PHOTO_ASPECT, DISPLAY_AXES } from "@/design/caliber/tokens";
import { rarityDefinition, type RarityTier } from "@shared/rarity";
import { gradePendingCopy } from "./landingCopy";

export interface GradePendingProps {
  /** A new account is Rookie for 30 days, so this is almost always "rookie". */
  tier?: RarityTier;
  /** Already opted in, for example on a revisit. */
  notified?: boolean;
  onGetNotified?: () => void | Promise<void>;
  onUploadAnother?: () => void;
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

/** The card silhouette: real slot geometry, nothing filled in. */
function Silhouette({ tier }: { tier: RarityTier }) {
  const def = rarityDefinition(tier);
  const outline =
    tier === "rookie"
      ? `1px dashed ${color.chalkStrong}`
      : `1px solid ${color.chalkStrong}`;

  const slot = (height: number | string, label?: string) => (
    <div
      style={{
        height,
        borderRadius: radius.soft,
        background: "rgba(245,241,232,0.05)",
        display: "grid",
        placeItems: "center",
      }}
    >
      {label ? <span style={micro}>{label}</span> : null}
    </div>
  );

  return (
    <div
      data-caliber-card="pending"
      data-tier={tier}
      aria-label={gradePendingCopy.silhouetteLabel}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: 24,
        border: outline,
        borderRadius: radius.card,
        background: color.court,
      }}
    >
      <span
        style={{
          ...micro,
          position: "absolute",
          top: 16,
          left: 16,
          border: `1px solid ${color.chalkStrong}`,
          borderRadius: radius.soft,
          padding: "3px 8px",
          ...display,
          fontSize: 11,
        }}
      >
        {def.label}
      </span>

      {/* Slot 2: the photo window, at the real 4:5. */}
      <div style={{ border: `1px solid ${color.chalk}`, padding: 4, marginTop: 20 }}>
        <div style={{ aspectRatio: String(PHOTO_ASPECT), background: "rgba(245,241,232,0.05)" }} />
      </div>

      {/* Slots 3 and 4. */}
      {slot(30)}
      {slot(12)}

      {/* Slot 5: where the grade will land. The only labelled slot. */}
      <div
        style={{
          borderTop: `1px solid ${color.chalk}`,
          borderBottom: `1px solid ${color.chalk}`,
          padding: "20px 0",
          display: "grid",
          placeItems: "center",
        }}
      >
        <span style={micro}>{gradePendingCopy.silhouetteLabel}</span>
      </div>

      {/* Slot 6. */}
      <div style={{ display: "flex", gap: 20 }}>
        {slot(28)}
        {slot(28)}
      </div>
    </div>
  );
}

export default function GradePending({
  tier = "rookie",
  notified = false,
  onGetNotified,
  onUploadAnother,
}: GradePendingProps) {
  const [optedIn, setOptedIn] = useState(notified);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleNotify = async () => {
    if (optedIn || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      await onGetNotified?.();
      setOptedIn(true);
    } catch {
      // Say so rather than silently doing nothing.
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
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
        padding: "32px 20px 64px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 360 }}>
        <Silhouette tier={tier} />
      </div>

      <div style={{ maxWidth: 360, textAlign: "center", display: "flex", flexDirection: "column", gap: 10 }}>
        <h1 style={{ ...display, fontSize: 32, margin: 0, textWrap: "balance" }}>
          {gradePendingCopy.heading}
        </h1>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: color.fog }}>
          {gradePendingCopy.body}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 360 }}>
        <button
          type="button"
          onClick={handleNotify}
          disabled={optedIn || busy}
          style={{
            background: optedIn ? "transparent" : color.red,
            color: color.bone,
            border: optedIn ? `1px solid ${color.chalkStrong}` : "none",
            borderRadius: radius.pill,
            padding: "14px 24px",
            fontSize: 16,
            fontWeight: 600,
            fontFamily: font.body,
            cursor: optedIn || busy ? "default" : "pointer",
            opacity: busy ? 0.7 : 1,
          }}
        >
          {optedIn ? gradePendingCopy.ctaDone : gradePendingCopy.primaryCta}
        </button>

        {failed && (
          <p role="alert" style={{ margin: 0, fontSize: 13, color: color.red, textAlign: "center" }}>
            That did not go through. Please try again.
          </p>
        )}

        <button
          type="button"
          onClick={onUploadAnother}
          style={{
            background: "none",
            border: `1px solid ${color.chalkStrong}`,
            color: color.bone,
            borderRadius: radius.pill,
            padding: "12px 24px",
            fontSize: 15,
            fontFamily: font.body,
            cursor: "pointer",
          }}
        >
          {gradePendingCopy.secondary}
        </button>
      </div>
    </div>
  );
}
