import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import caliberLogo from "@assets/Screenshot_2026-02-11_at_5.31.57_PM_1770916393022.png";

interface RecruitingCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player: {
    id: number;
    name: string;
    position: string;
    photoUrl: string | null;
    school: string | null;
    graduationYear: number | null;
    height: string | null;
    gpa: string | number | null;
    city: string | null;
    state: string | null;
    currentTier: string;
    totalXp: number;
  };
  stats: {
    gamesPlayed: number;
    averageGrade: string | null;
    ppg: number;
    rpg: number;
    apg: number;
    badgeCount: number;
  };
}

const GRADE_COLORS: Record<string, string> = {
  'A+': '#10b981', 'A': '#10b981', 'A-': '#10b981',
  'B+': '#3b82f6', 'B': '#3b82f6', 'B-': '#3b82f6',
  'C+': '#f59e0b', 'C': '#f59e0b', 'C-': '#f59e0b',
  'D+': '#f97316', 'D': '#f97316', 'D-': '#f97316',
  'F': '#ef4444',
};

export function RecruitingCard({ open, onOpenChange, player, stats }: RecruitingCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `caliber-recruit-${player.name.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: "Card Downloaded", description: "Share it on social media!" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to generate image", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/recruit/${player.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link Copied", description: "Recruiting profile link copied to clipboard" });
    } catch {
      toast({ title: "Share URL", description: url });
    }
  };

  const gradeColor = stats.averageGrade ? GRADE_COLORS[stats.averageGrade] || '#6b7280' : '#6b7280';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Recruiting Card</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <div
            ref={cardRef}
            style={{
              width: 400,
              height: 500,
              background: 'linear-gradient(145deg, #0f1419 0%, #1a1f2e 50%, #0f1419 100%)',
              padding: 0,
              fontFamily: "'Inter', sans-serif",
              position: 'relative',
              overflow: 'hidden',
            }}
            data-testid="recruiting-card-preview"
          >
            <div style={{ height: 4, background: '#E8192C', width: '100%' }} />
            
            <div style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  {player.photoUrl ? (
                    <img src={player.photoUrl} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.15)', flexShrink: 0 }}>
                      <span style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.4)', fontFamily: "'Teko', sans-serif" }}>
                        {player.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                  )}
                  <div>
                  <p style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1.1, fontFamily: "'Teko', sans-serif", textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    {player.name}
                  </p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                    {player.position} {player.height ? `· ${player.height}` : ''}
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                    {[player.school, player.graduationYear ? `Class of ${player.graduationYear}` : ''].filter(Boolean).join(' · ')}
                  </p>
                  {(player.city || player.state) && (
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>
                      {[player.city, player.state].filter(Boolean).join(', ')}
                    </p>
                  )}
                  </div>
                </div>
                
                {stats.averageGrade && (
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: gradeColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 0 20px ${gradeColor}40`,
                  }}>
                    <span style={{ fontSize: 24, fontWeight: 800, color: '#fff', fontFamily: "'Teko', sans-serif" }}>
                      {stats.averageGrade}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'PPG', value: stats.ppg.toFixed(1) },
                  { label: 'RPG', value: stats.rpg.toFixed(1) },
                  { label: 'APG', value: stats.apg.toFixed(1) },
                ].map(s => (
                  <div key={s.label} style={{
                    background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '12px 8px', textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{s.label}</p>
                    <p style={{ fontSize: 24, fontWeight: 800, color: '#fff', fontFamily: "'Teko', sans-serif" }}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, gap: 8 }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 14px', flex: 1, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Games</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: "'Teko', sans-serif" }}>{stats.gamesPlayed}</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 14px', flex: 1, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tier</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: "'Teko', sans-serif" }}>{player.currentTier}</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 14px', flex: 1, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Badges</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: "'Teko', sans-serif" }}>{stats.badgeCount}</p>
                </div>
                {player.gpa != null && (
                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 14px', flex: 1, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>GPA</p>
                    <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: "'Teko', sans-serif" }}>{Number(player.gpa).toFixed(1)}</p>
                  </div>
                )}
              </div>
              
              <div style={{ textAlign: 'center', padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: 11, color: '#E8192C', fontWeight: 600 }}>
                  caliber.app/recruit/{player.id}
                </p>
              </div>
            </div>

            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '12px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src={caliberLogo} alt="" style={{ width: 20, height: 20, opacity: 0.6 }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>Caliber Performance Labs</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 w-full">
            <Button
              onClick={handleDownload}
              disabled={isGenerating}
              className="flex-1 gap-2"
              data-testid="button-download-card"
            >
              <Download className="w-4 h-4" />
              {isGenerating ? "Generating..." : "Download Card"}
            </Button>
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="gap-2"
              data-testid="button-copy-recruit-link"
            >
              <Copy className="w-4 h-4" /> Copy Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
