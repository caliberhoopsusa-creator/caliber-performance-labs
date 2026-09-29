import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Share2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { ShareCaliberScoreModal } from "@/components/ShareCaliberScoreModal";

interface AiRatingResponse {
  overallRating: number | null;
}

interface PublicProfileResponse {
  player: {
    name: string;
    position: string | null;
    jerseyNumber: number | null;
  };
  stats: {
    gamesPlayed: number;
    basketball: {
      ppg: number;
      rpg: number;
      apg: number;
    };
  };
}

interface ShareCaliberScoreButtonProps {
  playerId: number | string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  label?: string;
}

/** "PG, SG" → "PG / SG" (matches the public profile's position formatting). */
function formatPosition(position: string | null | undefined): string {
  if (!position) return "";
  return position
    .split(",")
    .map((p) => p.trim())
    .join(" / ");
}

/**
 * Connected trigger for the shareable Caliber Score card. Fetches the player's
 * real AI rating and season averages, and renders nothing until a score exists —
 * the card only ever shows numbers earned from logged games.
 */
export function ShareCaliberScoreButton({
  playerId,
  variant = "outline",
  size = "default",
  className,
  label = "Share My Score",
}: ShareCaliberScoreButtonProps) {
  const [open, setOpen] = useState(false);
  const hasPlayerId = playerId != null && playerId !== "" && !Number.isNaN(Number(playerId));

  // Same query keys as CaliberScore / PublicPlayerProfile so the cache is shared.
  const { data: rating } = useQuery<AiRatingResponse>({
    queryKey: ["/api/players", String(playerId), "ai-rating"],
    enabled: hasPlayerId,
  });

  const { data: profile } = useQuery<PublicProfileResponse>({
    queryKey: [`/api/players/${playerId}/public`],
    enabled: hasPlayerId,
  });

  const score = rating?.overallRating;
  if (!hasPlayerId || typeof score !== "number" || score <= 0 || !profile) {
    return null;
  }

  const { player, stats } = profile;
  const playerLine = [
    player.jerseyNumber ? `#${player.jerseyNumber}` : null,
    formatPosition(player.position) || null,
  ]
    .filter(Boolean)
    .join(" · ");

  const statChips = [
    { label: "PPG", value: String(stats.basketball.ppg) },
    { label: "RPG", value: String(stats.basketball.rpg) },
    { label: "APG", value: String(stats.basketball.apg) },
  ];

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
        data-testid="button-share-caliber-score"
      >
        <Share2 className="w-4 h-4 mr-2" />
        {label}
      </Button>
      <ShareCaliberScoreModal
        open={open}
        onOpenChange={setOpen}
        playerName={player.name}
        playerLine={playerLine || undefined}
        score={Math.max(0, Math.min(99, Math.round(score)))}
        statChips={statChips}
        gamesPlayed={stats.gamesPlayed}
      />
    </>
  );
}
