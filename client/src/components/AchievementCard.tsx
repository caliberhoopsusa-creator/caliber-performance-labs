import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Download, Share2, X, Instagram, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import type { Player, Game, Badge } from "@shared/schema";
import { format } from "date-fns";

interface AchievementCardProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
  game?: Game;
  badge: Badge;
  achievementType: string;
}

const ACHIEVEMENT_CONFIG: Record<string, { title: string; subtitle: string; gradient: string; icon: string }> = {
  triple_double: {
    title: "TRIPLE DOUBLE",
    subtitle: "Elite Performance",
    gradient: "from-yellow-500 via-orange-500 to-red-500",
    icon: "👑",
  },
  thirty_bomb: {
    title: "30+ POINTS",
    subtitle: "Bucket Machine",
    gradient: "from-orange-500 via-red-500 to-pink-500",
    icon: "🔥",
  },
  twenty_piece: {
    title: "20+ POINTS",
    subtitle: "Scoring Threat",
    gradient: "from-blue-500 via-purple-500 to-pink-500",
    icon: "💪",
  },
  double_double: {
    title: "DOUBLE DOUBLE",
    subtitle: "All-Around Game",
    gradient: "from-green-500 via-teal-500 to-blue-500",
    icon: "⭐",
  },
  efficiency_master: {
    title: "A+ GRADE",
    subtitle: "Maximum Efficiency",
    gradient: "from-emerald-500 via-green-500 to-teal-500",
    icon: "💯",
  },
  lockdown_defender: {
    title: "LOCKDOWN",
    subtitle: "Defensive Anchor",
    gradient: "from-slate-500 via-gray-600 to-zinc-700",
    icon: "🔒",
  },
  hustle_king: {
    title: "HUSTLE KING",
    subtitle: "Maximum Effort",
    gradient: "from-amber-500 via-orange-500 to-red-500",
    icon: "⚡",
  },
  hot_streak_3: {
    title: "HOT STREAK",
    subtitle: "3 Games B+ or Better",
    gradient: "from-red-500 via-orange-500 to-yellow-500",
    icon: "🔥",
  },
  hot_streak_5: {
    title: "ON FIRE",
    subtitle: "5 Games B+ or Better",
    gradient: "from-red-600 via-orange-600 to-yellow-600",
    icon: "🌟",
  },
  clean_sheet: {
    title: "CLEAN SHEET",
    subtitle: "Zero Turnovers",
    gradient: "from-cyan-500 via-blue-500 to-indigo-500",
    icon: "✨",
  },
  sharpshooter: {
    title: "SHARPSHOOTER",
    subtitle: "50%+ from 3PT",
    gradient: "from-purple-500 via-pink-500 to-rose-500",
    icon: "🎯",
  },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AchievementCard({
  isOpen,
  onClose,
  player,
  game,
  badge,
  achievementType,
}: AchievementCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const config = ACHIEVEMENT_CONFIG[achievementType] || {
    title: achievementType.toUpperCase().replace(/_/g, " "),
    subtitle: "Achievement Unlocked",
    gradient: "from-primary to-orange-600",
    icon: "🏀",
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });

      const link = document.createElement("a");
      link.download = `caliber-${player.name.replace(/\s+/g, "-").toLowerCase()}-${achievementType}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast({
        title: "Card Downloaded!",
        description: "Share it on your favorite social platform",
      });
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        title: "Download Failed",
        description: "Could not generate image",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        if (navigator.share && navigator.canShare) {
          const file = new File([blob], `caliber-achievement.png`, { type: "image/png" });
          const shareData = {
            title: `${player.name} - ${config.title}`,
            text: `Check out my achievement on Caliber! ${config.title} ${config.icon}`,
            files: [file],
          };

          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            toast({ title: "Shared!", description: "Achievement shared successfully" });
          }
        } else {
          handleDownload();
        }
      }, "image/png");
    } catch (error) {
      console.error("Error sharing:", error);
      handleDownload();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/players/${player.id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied!",
      description: "Profile link copied to clipboard",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 bg-transparent border-0 shadow-none">
        <div className="flex flex-col items-center gap-4">
          <div
            ref={cardRef}
            className={`relative w-[360px] aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-br ${config.gradient} p-1`}
            data-testid="achievement-card"
          >
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative h-full w-full bg-black/80 backdrop-blur-xl rounded-xl p-6 flex flex-col">
              <div className="absolute top-4 right-4 text-4xl">{config.icon}</div>

              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <Avatar className="w-24 h-24 border-4 border-white/20 mb-4">
                  {player.photoUrl && <AvatarImage src={player.photoUrl} alt={player.name} />}
                  <AvatarFallback className="bg-gradient-to-br from-primary/50 to-primary/20 text-2xl font-bold text-white">
                    {getInitials(player.name)}
                  </AvatarFallback>
                </Avatar>

                <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wide mb-1">
                  {player.name}
                </h2>
                <p className="text-sm text-white/70 mb-6">
                  {player.position} {player.team && `• ${player.team}`}
                </p>

                <div className={`text-4xl font-display font-black bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent uppercase tracking-wider mb-2`}>
                  {config.title}
                </div>
                <p className="text-lg text-white/80 font-medium">{config.subtitle}</p>

                {game && (
                  <div className="mt-6 bg-white/10 rounded-xl px-6 py-4 backdrop-blur-sm">
                    <div className="text-xs text-white/50 uppercase tracking-wider mb-2">
                      vs {game.opponent} • {format(new Date(game.date), "MMM d, yyyy")}
                    </div>
                    <div className="flex items-center justify-center gap-6 text-white">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{game.points}</div>
                        <div className="text-xs text-white/50">PTS</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{game.rebounds}</div>
                        <div className="text-xs text-white/50">REB</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{game.assists}</div>
                        <div className="text-xs text-white/50">AST</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">C</span>
                  </div>
                  <span className="text-sm font-display font-bold text-white/80 uppercase tracking-wider">
                    Caliber
                  </span>
                </div>
                <div className="text-xs text-white/40">
                  {badge.earnedAt && format(new Date(badge.earnedAt), "MMM d, yyyy")}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleDownload}
              disabled={isGenerating}
              className="gap-2"
              data-testid="button-download-card"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button
              onClick={handleShare}
              disabled={isGenerating}
              variant="outline"
              className="gap-2"
              data-testid="button-share-card"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <Button
              onClick={handleCopyLink}
              variant="ghost"
              size="icon"
              data-testid="button-copy-link"
            >
              <Twitter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
