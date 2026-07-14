import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Share2, Smartphone, Square, Monitor, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getTier, tierColor } from "@/lib/caliberTier";

type CardFormat = "story" | "post" | "twitter";

const FORMATS: Record<
  CardFormat,
  { label: string; width: number; height: number; icon: typeof Smartphone; description: string }
> = {
  story: { label: "Story / Reel", width: 1080, height: 1920, icon: Smartphone, description: "9:16" },
  post: { label: "Square Post", width: 1080, height: 1080, icon: Square, description: "1:1" },
  twitter: { label: "X / Landscape", width: 1200, height: 675, icon: Monitor, description: "16:9" },
};

// Static ring geometry — no animation so html2canvas captures deterministically
const RING_R = 52;
const RING_CIRC = 2 * Math.PI * RING_R;

interface StatChip {
  label: string;
  value: string;
}

export interface ShareCaliberScoreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerName: string;
  /** e.g. "#23 · PG" — omit parts you don't have */
  playerLine?: string;
  /** 0–99 overall Caliber Score */
  score: number;
  /** real season stat chips, e.g. PPG/RPG/APG */
  statChips: StatChip[];
  gamesPlayed: number;
}

/** Static (animation-free) rendition of the signature score ring for image capture. */
function StaticScoreRing({ score, size }: { score: number; size: number }) {
  const tier = getTier(score);
  const color = tierColor(tier.cssVar);
  const offset = RING_CIRC * (1 - score / 99);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {/* soft tier glow — a blurred div, not an svg filter (html2canvas-safe) */}
      <div
        className="absolute rounded-full"
        style={{
          inset: size * -0.12,
          background: `radial-gradient(circle, ${tierColor(tier.cssVar, 0.28)} 0%, transparent 68%)`,
        }}
      />
      <svg viewBox="0 0 120 120" className="relative h-full w-full -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r={RING_R} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="9" />
        <circle
          cx="60"
          cy="60"
          r={RING_R}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={RING_CIRC}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-display font-extrabold leading-none tabular-nums"
          style={{ color, fontSize: size * 0.34 }}
        >
          {score}
        </span>
        <span
          className="font-display tracking-[0.22em] text-white/50"
          style={{ fontSize: size * 0.072, marginTop: size * 0.02 }}
        >
          OVR
        </span>
      </div>
    </div>
  );
}

/** The exported card itself, laid out per format at full pixel size. */
function ScoreCard({
  format,
  playerName,
  playerLine,
  score,
  statChips,
  gamesPlayed,
}: { format: CardFormat } & Omit<ShareCaliberScoreModalProps, "open" | "onOpenChange">) {
  const { width, height } = FORMATS[format];
  const tier = getTier(score);
  const color = tierColor(tier.cssVar);
  const isWide = format === "twitter";
  const isStory = format === "story";
  const ringSize = isStory ? 460 : isWide ? 340 : 420;

  return (
    <div
      className="relative flex overflow-hidden"
      style={{
        width,
        height,
        background: "radial-gradient(120% 90% at 50% 0%, #131316 0%, #0a0a0b 55%, #060607 100%)",
      }}
    >
      {/* tier-colored horizon line */}
      <div
        className="absolute inset-x-0 top-0"
        style={{ height: 6, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />
      {/* faint court-line arc */}
      <div
        className="absolute rounded-full border"
        style={{
          width: width * 1.1,
          height: width * 1.1,
          left: width * -0.05,
          bottom: -(width * 0.78),
          borderColor: "rgba(255,255,255,0.05)",
          borderWidth: 2,
        }}
      />

      <div
        className={cn(
          "relative z-10 flex w-full items-center",
          isWide ? "flex-row gap-16 px-24" : "flex-col justify-center text-center",
        )}
        style={!isWide ? { padding: isStory ? "140px 80px" : "80px" } : undefined}
      >
        <div className={cn("flex flex-col items-center", isWide && "shrink-0")}>
          <StaticScoreRing score={score} size={ringSize} />
          <div
            className="mt-8 font-display font-bold tracking-[0.24em]"
            style={{ color, fontSize: isStory ? 44 : 36 }}
          >
            {tier.label}
          </div>
          <div className="mt-2 font-body text-white/55" style={{ fontSize: isStory ? 30 : 24 }}>
            {tier.blurb}
          </div>
        </div>

        <div className={cn("flex flex-col", isWide ? "items-start text-left" : "items-center", !isWide && "mt-16")}>
          <div
            className="font-display font-extrabold uppercase leading-[0.95] tracking-tight text-white"
            style={{ fontSize: isStory ? 78 : isWide ? 56 : 64 }}
          >
            {playerName}
          </div>
          {playerLine && (
            <div className="mt-3 font-body font-medium text-white/60" style={{ fontSize: isStory ? 34 : 26 }}>
              {playerLine}
            </div>
          )}

          {statChips.length > 0 && (
            <div className={cn("flex gap-4", isWide ? "mt-8" : "mt-10 justify-center")}>
              {statChips.map((chip) => (
                <div
                  key={chip.label}
                  className="flex flex-col items-center rounded-2xl border px-8 py-5"
                  style={{ borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)" }}
                >
                  <span
                    className="font-display font-bold tabular-nums text-white"
                    style={{ fontSize: isStory ? 52 : 40 }}
                  >
                    {chip.value}
                  </span>
                  <span
                    className="mt-1 font-body font-semibold uppercase tracking-[0.18em] text-white/45"
                    style={{ fontSize: isStory ? 22 : 18 }}
                  >
                    {chip.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div
            className={cn("font-body text-white/40", isWide ? "mt-6" : "mt-8")}
            style={{ fontSize: isStory ? 26 : 20 }}
          >
            {gamesPlayed} game{gamesPlayed === 1 ? "" : "s"} logged · Season 2026
          </div>
        </div>
      </div>

      {/* brand footer */}
      <div
        className="absolute inset-x-0 flex items-center justify-center gap-4"
        style={{ bottom: isStory ? 72 : 40 }}
      >
        <span
          className="font-display font-extrabold uppercase tracking-[0.3em] text-white/80"
          style={{ fontSize: isStory ? 34 : 26 }}
        >
          Caliber
        </span>
        <span className="rounded-full" style={{ width: 6, height: 6, background: color }} />
        <span className="font-body text-white/45" style={{ fontSize: isStory ? 26 : 20 }}>
          Every game, graded · caliber.app
        </span>
      </div>
    </div>
  );
}

export function ShareCaliberScoreModal(props: ShareCaliberScoreModalProps) {
  const { open, onOpenChange, playerName } = props;
  const [selectedFormat, setSelectedFormat] = useState<CardFormat>("story");
  const [isWorking, setIsWorking] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const format = FORMATS[selectedFormat];
  const previewScale = Math.min(300 / format.width, 380 / format.height);

  const fileName = `caliber-score-${playerName.replace(/\s+/g, "-").toLowerCase()}-${selectedFormat}.png`;

  const renderToBlob = async (): Promise<Blob> => {
    if (!cardRef.current) throw new Error("Card not mounted");
    await document.fonts.ready;
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
      logging: false,
      width: format.width,
      height: format.height,
    });
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Canvas export failed"))), "image/png");
    });
  };

  const handleDownload = async () => {
    setIsWorking(true);
    try {
      const blob = await renderToBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = fileName;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      toast({ title: "Card downloaded", description: `${format.label} saved — post it anywhere.` });
    } catch (error) {
      console.error("Share card export failed:", error);
      toast({ title: "Export failed", description: "Could not generate the card. Try again.", variant: "destructive" });
    } finally {
      setIsWorking(false);
    }
  };

  const canNativeShare =
    typeof navigator !== "undefined" &&
    "canShare" in navigator &&
    navigator.canShare({ files: [new File([], "x.png", { type: "image/png" })] });

  const handleNativeShare = async () => {
    setIsWorking(true);
    try {
      const blob = await renderToBlob();
      const file = new File([blob], fileName, { type: "image/png" });
      await navigator.share({
        files: [file],
        title: "My Caliber Score",
        text: `My Caliber Score is ${props.score} (${getTier(props.score).label}). Every game, graded — caliber.app`,
      });
    } catch (error) {
      // AbortError = user closed the share sheet; stay quiet
      if ((error as Error).name !== "AbortError") {
        console.error("Native share failed:", error);
        toast({ title: "Share failed", description: "Could not open the share sheet. Try Download instead.", variant: "destructive" });
      }
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px] gap-0 overflow-hidden overflow-y-auto p-0 max-h-[90vh] border-white/10 bg-card">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="font-display text-lg uppercase tracking-wider">
            Share your Caliber Score
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-3">
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(FORMATS) as CardFormat[]).map((key) => {
              const fmt = FORMATS[key];
              const Icon = fmt.icon;
              const active = selectedFormat === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedFormat(key)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all",
                    active ? "border-accent/50 bg-accent/10" : "border-white/10 bg-black/20 hover:border-white/25",
                  )}
                  data-testid={`button-share-format-${key}`}
                >
                  <Icon className={cn("h-5 w-5", active ? "text-accent" : "text-muted-foreground")} />
                  <span className={cn("text-xs font-bold", active ? "text-accent" : "text-foreground")}>{fmt.label}</span>
                  <span className="text-[10px] text-muted-foreground">{fmt.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center px-4 pb-3">
          <div
            className="relative overflow-hidden rounded-xl border border-white/10 shadow-2xl"
            style={{ width: format.width * previewScale, height: format.height * previewScale }}
          >
            <div ref={cardRef} style={{ transform: `scale(${previewScale})`, transformOrigin: "top left" }}>
              <ScoreCard format={selectedFormat} {...props} />
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 bg-secondary/20 p-4 pt-3">
          <div className="flex gap-2">
            {canNativeShare && (
              <Button onClick={handleNativeShare} disabled={isWorking} className="flex-1 gap-2" data-testid="button-share-native">
                {isWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                Share
              </Button>
            )}
            <Button
              onClick={handleDownload}
              disabled={isWorking}
              variant={canNativeShare ? "outline" : "default"}
              className="flex-1 gap-2"
              data-testid="button-share-download"
            >
              {isWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download PNG
            </Button>
          </div>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            {format.width}×{format.height}px · your real season numbers, straight from your logged games
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
