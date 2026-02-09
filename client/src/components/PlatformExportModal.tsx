import { useRef, useState, type ReactNode } from "react";
import html2canvas from "html2canvas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, Square, Monitor, Loader2 } from "lucide-react";
import { SiInstagram, SiTiktok, SiX } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Activity } from "lucide-react";

type PlatformFormat = "story" | "post" | "twitter";

interface FormatConfig {
  label: string;
  width: number;
  height: number;
  icon: typeof Smartphone;
  platforms: string[];
  description: string;
}

const FORMATS: Record<PlatformFormat, FormatConfig> = {
  story: {
    label: "Story / Reel",
    width: 1080,
    height: 1920,
    icon: Smartphone,
    platforms: ["Instagram Story", "TikTok"],
    description: "9:16 vertical",
  },
  post: {
    label: "Square Post",
    width: 1080,
    height: 1080,
    icon: Square,
    platforms: ["Instagram Post"],
    description: "1:1 square",
  },
  twitter: {
    label: "Twitter / X",
    width: 1200,
    height: 675,
    icon: Monitor,
    platforms: ["Twitter / X"],
    description: "16:9 landscape",
  },
};

interface PlatformExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerName: string;
  children: ReactNode;
}

export function PlatformExportModal({
  open,
  onOpenChange,
  playerName,
  children,
}: PlatformExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<PlatformFormat>("story");
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const format = FORMATS[selectedFormat];

  const previewScale = Math.min(320 / format.width, 400 / format.height);
  const previewWidth = format.width * previewScale;
  const previewHeight = format.height * previewScale;

  const handleExport = async () => {
    if (!cardRef.current) return;
    
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
        width: format.width,
        height: format.height,
      });
      
      const link = document.createElement("a");
      const platformLabel = selectedFormat === "story" ? "story" : selectedFormat === "post" ? "post" : "twitter";
      link.download = `caliber-${playerName.replace(/\s+/g, "-").toLowerCase()}-${platformLabel}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      
      toast({
        title: "Image Downloaded",
        description: `${format.label} format saved! Share it on ${format.platforms.join(" or ")}.`,
      });
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        title: "Export Failed",
        description: "Could not generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px] p-0 gap-0 bg-card border-white/10 overflow-hidden max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-lg font-display uppercase tracking-wider">
            Export for Social Media
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-4 pb-3">
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(FORMATS) as [PlatformFormat, FormatConfig][]).map(([key, fmt]) => {
              const Icon = fmt.icon;
              return (
                <div
                  key={key}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedFormat(key)}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedFormat(key)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center cursor-pointer toggle-elevate",
                    selectedFormat === key
                      ? "border-primary/50 bg-primary/10 toggle-elevated"
                      : "border-white/10 bg-black/20"
                  )}
                  data-testid={`button-format-${key}`}
                >
                  <Icon className={cn("w-5 h-5", selectedFormat === key ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("text-xs font-bold", selectedFormat === key ? "text-primary" : "text-white")}>{fmt.label}</span>
                  <span className="text-[10px] text-muted-foreground">{fmt.description}</span>
                </div>
              );
            })}
          </div>
          
          <div className="flex items-center gap-2 mt-2 justify-center">
            {selectedFormat === "story" && (
              <>
                <SiInstagram className="w-4 h-4 text-pink-400" />
                <SiTiktok className="w-4 h-4 text-white" />
              </>
            )}
            {selectedFormat === "post" && (
              <SiInstagram className="w-4 h-4 text-pink-400" />
            )}
            {selectedFormat === "twitter" && (
              <SiX className="w-4 h-4 text-white" />
            )}
            <span className="text-xs text-muted-foreground">
              {format.platforms.join(" & ")}
            </span>
          </div>
        </div>

        <div className="px-4 pb-3 flex justify-center">
          <div
            className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl"
            style={{ width: previewWidth, height: previewHeight }}
          >
            <div
              ref={cardRef}
              style={{
                width: format.width,
                height: format.height,
                transform: `scale(${previewScale})`,
                transformOrigin: "top left",
                background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)",
              }}
              className="relative overflow-hidden"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="transform" style={{ 
                  transform: `scale(${Math.min(format.width / 420, format.height / 520) * 0.85})` 
                }}>
                  {children}
                </div>
              </div>
              
              <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2 opacity-60">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center">
                  <Activity className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-black uppercase tracking-widest text-white/70">Caliber</span>
              </div>
              
              <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="p-4 pt-2 border-t border-white/10 bg-secondary/20">
          <Button
            onClick={handleExport}
            disabled={isGenerating}
            className="w-full gap-2"
            data-testid="button-export-image"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download for {format.platforms[0]}
              </>
            )}
          </Button>
          
          <p className="text-[10px] text-center text-muted-foreground mt-2">
            Image will be saved at {format.width}x{format.height}px — optimized for {format.platforms.join(" & ")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
