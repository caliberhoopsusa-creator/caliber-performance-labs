import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import {
  Download,
  Share2,
  Twitter,
  Crown,
  Flame,
  TrendingUp,
  Star,
  BadgeCheck,
  Lock,
  Zap,
  Sparkles,
  Crosshair,
  Trophy,
  type LucideIcon,
} from "lucide-react";
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

/**
 * Tier-based achievement identity — clean lucide iconography on a uniform
 * near-black, platinum-framed card. One restrained accent per tier (used only
 * for the icon + a faint glow), never full-card rainbow gradients.
 */
const ACHIEVEMENT_CONFIG: Record<
  string,
  { title: string; subtitle: string; icon: LucideIcon; accent: string }
> = {
  triple_double: { title: "TRIPLE DOUBLE", subtitle: "Elite Performance", icon: Crown, accent: "#e7c66b" },
  thirty_bomb: { title: "30+ POINTS", subtitle: "Bucket Machine", icon: Flame, accent: "#e0762b" },
  twenty_piece: { title: "20+ POINTS", subtitle: "Scoring Threat", icon: TrendingUp, accent: "#c6d0d8" },
  double_double: { title: "DOUBLE DOUBLE", subtitle: "All-Around Game", icon: Star, accent: "#8fb3c9" },
  efficiency_master: { title: "A+ GRADE", subtitle: "Maximum Efficiency", icon: BadgeCheck, accent: "#4ade80" },
  lockdown_defender: { title: "LOCKDOWN", subtitle: "Defensive Anchor", icon: Lock, accent: "#94a3b8" },
  hustle_king: { title: "HUSTLE KING", subtitle: "Maximum Effort", icon: Zap, accent: "#c6d0d8" },
  hot_streak_3: { title: "HOT STREAK", subtitle: "3 Games B+ or Better", icon: Flame, accent: "#e0762b" },
  hot_streak_5: { title: "ON FIRE", subtitle: "5 Games B+ or Better", icon: Flame, accent: "#ef4444" },
  clean_sheet: { title: "CLEAN SHEET", subtitle: "Zero Turnovers", icon: Sparkles, accent: "#c6d0d8" },
  sharpshooter: { title: "SHARPSHOOTER", subtitle: "50%+ from 3PT", icon: Crosshair, accent: "#60a5fa" },
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
    icon: Trophy,
    accent: "#c6d0d8",
  };
  const Icon = config.icon;

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
            text: `Check out my achievement on Caliber — ${config.title}`,
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
            className="relative w-[360px] aspect-[4/5] rounded-[1.6rem] overflow-hidden p-px"
            style={{ background: `linear-gradient(160deg, ${config.accent}66, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0.02))` }}
            data-testid="achievement-card"
          >
            <div className="relative h-full w-full rounded-[1.55rem] p-6 flex flex-col" style={{ backgroundColor: "#0a0a0b" }}>
              {/* tier glow */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-44"
                style={{ background: `radial-gradient(120% 80% at 50% 0%, ${config.accent}26, transparent 70%)` }}
              />
              {/* fine grid */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.05]"
                style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
              />

              {/* header row */}
              <div className="relative flex items-center justify-between">
                <span className="text-[0.62rem] font-semibold uppercase tracking-[0.28em]" style={{ color: "#7c8694" }}>
                  Achievement
                </span>
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl border"
                  style={{ borderColor: `${config.accent}40`, backgroundColor: `${config.accent}1a`, color: config.accent }}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2.25} />
                </span>
              </div>

              <div className="relative flex flex-1 flex-col items-center justify-center text-center">
                <Avatar className="mb-4 h-24 w-24 border" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                  {player.photoUrl && <AvatarImage src={player.photoUrl} alt={player.name} width={96} height={96} />}
                  <AvatarFallback className="text-2xl font-bold" style={{ backgroundColor: "#16171a", color: "#e7ecf0" }}>
                    {getInitials(player.name)}
                  </AvatarFallback>
                </Avatar>

                <h2 className="font-display text-xl font-bold uppercase tracking-wide" style={{ color: "#f4f6f8" }}>
                  {player.name}
                </h2>
                <p className="mt-1 text-sm" style={{ color: "#8b95a1" }}>
                  {player.position}
                  {player.team && ` · ${player.team}`}
                </p>

                <div className="mt-6 font-display text-[2.1rem] font-black uppercase leading-none tracking-tight" style={{ color: "#ffffff" }}>
                  {config.title}
                </div>
                <p className="mt-2 text-base font-medium" style={{ color: config.accent }}>
                  {config.subtitle}
                </p>

                {game && (
                  <div className="mt-6 w-full rounded-2xl border px-6 py-4" style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)" }}>
                    <div className="mb-3 text-[0.6rem] uppercase tracking-[0.2em]" style={{ color: "#6b7480" }}>
                      vs {game.opponent} · {format(new Date(game.date), "MMM d, yyyy")}
                    </div>
                    <div className="flex items-center justify-center gap-8">
                      {[
                        { v: game.points, l: "PTS" },
                        { v: game.rebounds, l: "REB" },
                        { v: game.assists, l: "AST" },
                      ].map((s) => (
                        <div key={s.l} className="text-center">
                          <div className="font-display text-2xl font-bold tabular-nums" style={{ color: "#f4f6f8" }}>{s.v}</div>
                          <div className="mt-0.5 text-[0.6rem] tracking-widest" style={{ color: "#6b7480" }}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative mt-auto flex items-center justify-between border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: "#c6d0d8" }}>
                    <span className="font-display text-xs font-black" style={{ color: "#0a0a0b" }}>C</span>
                  </div>
                  <span className="font-display text-sm font-bold uppercase tracking-[0.18em]" style={{ color: "#cdd5dd" }}>
                    Caliber
                  </span>
                </div>
                <div className="text-[0.7rem]" style={{ color: "#6b7480" }}>
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
