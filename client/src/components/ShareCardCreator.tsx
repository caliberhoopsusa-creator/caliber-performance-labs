import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, X, Download, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type Game } from "@shared/schema";
import { format } from "date-fns";
import caliberLogo from "@assets/Screenshot_2026-02-11_at_5.31.57_PM_1770916393022.png";

interface ShareCardCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: Game;
  playerName: string;
  sport?: string;
}

const COLOR_OPTIONS = [
  { name: "white", value: "#FFFFFF" },
  { name: "amber", value: "#4f6878" },
  { name: "red", value: "#EF4444" },
  { name: "blue", value: "#3B82F6" },
  { name: "green", value: "#22C55E" },
  { name: "yellow", value: "#EAB308" },
  { name: "purple", value: "#A855F7" },
  { name: "pink", value: "#EC4899" },
];

export function ShareCardCreator({
  open,
  onOpenChange,
  game,
  playerName,
}: ShareCardCreatorProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [statColor, setStatColor] = useState("#4f6878");
  const [cardFormat, setCardFormat] = useState<'story' | 'post'>('post');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const cardWidth = cardFormat === 'story' ? 360 : 480;
  const cardHeight = cardFormat === 'story' ? 640 : 480;

  const gameDate = new Date(game.date);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `caliber-game-${game.id}.png`;
      link.href = dataUrl;
      link.click();
      toast({
        title: "Image Saved",
        description: "Your game card has been downloaded!",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
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
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `caliber-game-${game.id}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Game vs ${game.opponent}`,
          text: `Check out my game stats on Caliber!`,
        });
      } else {
        handleDownload();
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        handleDownload();
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[900px] w-[95vw] max-h-[90vh] overflow-y-auto p-0 gap-0"
        data-testid="share-card-creator-dialog"
      >
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-lg font-display uppercase tracking-wider">Create Game Card</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-4 p-4 pt-2">
          <div className="flex-1 flex items-center justify-center overflow-auto">
            <div
              ref={cardRef}
              data-testid="share-card-preview"
              style={{
                width: cardWidth,
                height: cardHeight,
                position: 'relative',
                overflow: 'hidden',
                flexShrink: 0,
                background: photoUrl
                  ? undefined
                  : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
              }}
            >
              {photoUrl && (
                <img
                  src={photoUrl}
                  alt="Background"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              )}

              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.5) 100%)',
                }}
              />

              <div
                style={{
                  position: 'relative',
                  zIndex: 1,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: cardFormat === 'story' ? '24px 20px' : '20px 24px',
                }}
              >
                <img
                  src={caliberLogo}
                  alt="Caliber"
                  style={{
                    width: cardFormat === 'story' ? 48 : 40,
                    height: cardFormat === 'story' ? 48 : 40,
                    objectFit: 'contain',
                    filter: 'brightness(0) invert(1)',
                    opacity: 0.9,
                  }}
                />

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: cardFormat === 'story' ? 16 : 10,
                    width: '100%',
                  }}
                >
                  <div style={{ textAlign: 'center' as const }}>
                    <div
                      style={{
                        color: statColor,
                        fontSize: cardFormat === 'story' ? 22 : 18,
                        fontWeight: 800,
                        textTransform: 'uppercase' as const,
                        letterSpacing: '0.05em',
                      }}
                    >
                      {playerName}
                    </div>
                    <div
                      style={{
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: cardFormat === 'story' ? 13 : 12,
                        marginTop: 3,
                      }}
                    >
                      vs {game.opponent}
                    </div>
                    <div
                      style={{
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: 11,
                        marginTop: 3,
                      }}
                    >
                      {format(gameDate, 'MMMM d, yyyy')}
                    </div>
                  </div>

                  {/* Basketball stats display */}
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: cardFormat === 'story' ? 24 : 20, width: '100%' }}>
                      <div style={{ textAlign: 'center' as const }}>
                        <div style={{ color: statColor, fontSize: cardFormat === 'story' ? 44 : 36, fontWeight: 800, lineHeight: 1 }}>{game.points}</div>
                        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginTop: 4 }}>PTS</div>
                      </div>
                      <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.2)' }} />
                      <div style={{ textAlign: 'center' as const }}>
                        <div style={{ color: statColor, fontSize: cardFormat === 'story' ? 44 : 36, fontWeight: 800, lineHeight: 1 }}>{game.rebounds}</div>
                        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginTop: 4 }}>REB</div>
                      </div>
                      <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.2)' }} />
                      <div style={{ textAlign: 'center' as const }}>
                        <div style={{ color: statColor, fontSize: cardFormat === 'story' ? 44 : 36, fontWeight: 800, lineHeight: 1 }}>{game.assists}</div>
                        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginTop: 4 }}>AST</div>
                      </div>
                    </div>
                    {(game.steals > 0 || game.blocks > 0) && (
                      <div style={{ display: 'flex', gap: 16, color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                        {game.steals > 0 && <span>STL: {game.steals}</span>}
                        {game.blocks > 0 && <span>BLK: {game.blocks}</span>}
                      </div>
                    )}
                  </>
                </div>
              </div>
            </div>
          </div>

          <div className="md:w-[260px] flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Photo Background</label>
              {photoUrl ? (
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-md border border-border overflow-hidden">
                    <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemovePhoto}
                    className="gap-1 text-destructive"
                    data-testid="button-remove-photo"
                  >
                    <X className="w-4 h-4" />
                    Remove Photo
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center gap-2 text-muted-foreground hover-elevate cursor-pointer"
                >
                  <Upload className="w-6 h-6" />
                  <span className="text-sm">Upload Your Photo</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
                data-testid="input-photo-upload"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Stat Color</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    aria-label={color.name}
                    onClick={() => setStatColor(color.value)}
                    className="rounded-full transition-all"
                    style={{
                      width: 28,
                      height: 28,
                      backgroundColor: color.value,
                      border: statColor === color.value
                        ? '3px solid currentColor'
                        : '2px solid rgba(128,128,128,0.3)',
                      boxShadow: statColor === color.value
                        ? `0 0 0 2px ${color.value}`
                        : 'none',
                    }}
                    data-testid={`button-color-${color.name}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Format</label>
              <div className="flex gap-2">
                <Button
                  variant={cardFormat === 'story' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCardFormat('story')}
                  data-testid="button-format-story"
                >
                  Story (9:16)
                </Button>
                <Button
                  variant={cardFormat === 'post' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCardFormat('post')}
                  data-testid="button-format-post"
                >
                  Post (1:1)
                </Button>
              </div>
            </div>

            <div className="flex gap-2 mt-auto">
              <Button
                onClick={handleDownload}
                disabled={isGenerating}
                className="flex-1 gap-2"
                data-testid="button-save-image"
              >
                <Download className="w-4 h-4" />
                {isGenerating ? "Saving..." : "Save Image"}
              </Button>
              <Button
                variant="outline"
                onClick={handleShare}
                disabled={isGenerating}
                className="gap-2"
                data-testid="button-share-image"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
