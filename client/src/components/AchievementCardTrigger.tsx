import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AchievementCard } from "@/components/AchievementCard";
import type { Player, Game, Badge } from "@shared/schema";

interface AchievementCardTriggerProps {
  player: Player;
  game?: Game;
  badge: Badge;
  achievementType: string;
  variant?: "icon" | "button";
  className?: string;
}

export function AchievementCardTrigger({
  player,
  game,
  badge,
  achievementType,
  variant = "icon",
  className,
}: AchievementCardTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {variant === "icon" ? (
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setIsOpen(true)}
          className={className}
          data-testid={`button-share-achievement-${badge.id}`}
        >
          <Share2 className="w-4 h-4" />
        </Button>
      ) : (
        <Button
          variant="outline"
          onClick={() => setIsOpen(true)}
          className={`gap-2 ${className}`}
          data-testid={`button-share-achievement-${badge.id}`}
        >
          <Share2 className="w-4 h-4" />
          Share Achievement
        </Button>
      )}

      <AchievementCard
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        player={player}
        game={game}
        badge={badge}
        achievementType={achievementType}
      />
    </>
  );
}
