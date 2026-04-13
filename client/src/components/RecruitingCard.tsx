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
    weight?: string | number | null;
    wingspan?: string | number | null;
    gpa: string | number | null;
    city: string | null;
    state: string | null;
    currentTier: string;
    totalXp: number;
    sport?: string;
  };
  stats: {
    gamesPlayed: number;
    averageGrade: string | null;
    // Basketball stats
    ppg: number;
    rpg: number;
    apg: number;
    spg: number;
    bpg: number;
    fgPct: string;
    threePct: string;
    ftPct: string;
    tsPct?: string;
    astToRatio?: string;
    // Shared
    badgeCount: number;
    consistencyScore?: number;
  };
}

const GRADE_COLORS: Record<string, string> = {
  'A+': '#10b981', 'A': '#10b981', 'A-': '#10b981',
  'B+': '#3b82f6', 'B': '#3b82f6', 'B-': '#3b82f6',
  'C+': '#C6D0D8', 'C': '#C6D0D8', 'C-': '#C6D0D8',
  'D+': '#f97316', 'D': '#f97316', 'D-': '#f97316',
  'F': '#ef4444',
};

const statBoxStyle = {
  background: 'rgba(255,255,255,0.04)',
  borderRadius: 8,
  padding: '10px 8px',
  textAlign: 'center' as const,
  border: '1px solid rgba(255,255,255,0.06)',
};

const statLabelStyle = {
  fontSize: 9,
  color: 'rgba(255,255,255,0.35)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  marginBottom: 2,
};

const statValueStyle = {
  fontSize: 20,
  fontWeight: 800,
  color: '#fff',
  fontFamily: "'Teko', sans-serif",
  lineHeight: 1.2,
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

  const measurables: string[] = [];
  if (player.height) measurables.push(player.height);
  if (player.weight) measurables.push(`${player.weight} lbs`);
  if (player.wingspan) measurables.push(`${player.wingspan}" WS`);

  const basketballRow1 = [
    { label: 'PPG', value: stats.ppg.toFixed(1) },
    { label: 'RPG', value: stats.rpg.toFixed(1) },
    { label: 'APG', value: stats.apg.toFixed(1) },
    { label: 'SPG', value: stats.spg.toFixed(1) },
    { label: 'BPG', value: stats.bpg.toFixed(1) },
  ];

  const basketballRow2 = [
    { label: 'FG%',  value: stats.fgPct   || '—' },
    { label: '3PT%', value: stats.threePct || '—' },
    { label: 'FT%',  value: stats.ftPct   || '—' },
  ];

  const hasRow2Data = stats.fgPct !== '—' || stats.threePct !== '—' || stats.ftPct !== '—';

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
              background: 'linear-gradient(145deg, #0f1419 0%, #1a1f2e 50%, #0f1419 100%)',
              fontFamily: "'Inter', sans-serif",
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
            data-testid="recruiting-card-preview"
          >
            {/* Top accent bar */}
            <div style={{ height: 4, background: '#4f6878', width: '100%', flexShrink: 0 }} />

            {/* Main content */}
            <div style={{ padding: '20px 24px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Header: photo + info + grade */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  {player.photoUrl ? (
                    <img src={player.photoUrl} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.15)', flexShrink: 0 }} crossOrigin="anonymous" />
                  ) : (
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.15)', flexShrink: 0 }}>
                      <span style={{ fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.4)', fontFamily: "'Teko', sans-serif" }}>
                        {player.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.1, fontFamily: "'Teko', sans-serif", textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                      {player.name}
                    </p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>
                      {player.position}{measurables.length > 0 ? ` · ${measurables.join(' · ')}` : ''}
                    </p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                      {[player.school, player.graduationYear ? `Class of ${player.graduationYear}` : ''].filter(Boolean).join(' · ')}
                    </p>
                    {(player.city || player.state) && (
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>
                        {[player.city, player.state].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                {stats.averageGrade && (
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: gradeColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 0 20px ${gradeColor}40`, flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: "'Teko', sans-serif" }}>
                      {stats.averageGrade}
                    </span>
                  </div>
                )}
              </div>

              {/* Sport badge */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: 'rgba(79,104,120,0.2)', border: '1px solid rgba(79,104,120,0.4)',
                  borderRadius: 4, padding: '2px 8px',
                }}>
                  <span style={{ fontSize: 9, color: '#4f6878', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>
                    Basketball
                  </span>
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 4, padding: '2px 8px',
                }}>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {player.currentTier} Tier
                  </span>
                </div>
              </div>

              {/* Row 1: Main stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                {basketballRow1.map(s => (
                  <div key={s.label} style={statBoxStyle}>
                    <p style={statLabelStyle}>{s.label}</p>
                    <p style={statValueStyle}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Row 2: Shooting stats */}
              {hasRow2Data && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {basketballRow2.map(s => (
                    <div key={s.label} style={{
                      ...statBoxStyle,
                      ...(s.value !== '—' ? {
                        background: 'rgba(232, 25, 44, 0.08)',
                        border: '1px solid rgba(232, 25, 44, 0.15)',
                      } : {}),
                    }}>
                      <p style={statLabelStyle}>{s.label}</p>
                      <p style={{ ...statValueStyle, fontSize: 18, color: s.value !== '—' ? '#fff' : 'rgba(255,255,255,0.3)' }}>{s.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Row 3: Advanced stats */}
              {(
                <div style={{ display: 'grid', gridTemplateColumns: player.gpa != null ? '1fr 1fr 1fr 1fr 1fr' : '1fr 1fr 1fr 1fr', gap: 6 }}>
                  <div style={statBoxStyle} data-testid="stat-ts-pct">
                    <p style={statLabelStyle}>TS%</p>
                    <p style={{ ...statValueStyle, fontSize: 18, color: stats.tsPct && stats.tsPct !== '—' ? '#10b981' : 'rgba(255,255,255,0.3)' }}>
                      {stats.tsPct || '—'}
                    </p>
                  </div>
                  <div style={statBoxStyle} data-testid="stat-ast-to">
                    <p style={statLabelStyle}>AST/TO</p>
                    <p style={{ ...statValueStyle, fontSize: 18 }}>{stats.astToRatio || '—'}</p>
                  </div>
                  <div style={statBoxStyle}>
                    <p style={statLabelStyle}>Games</p>
                    <p style={{ ...statValueStyle, fontSize: 18 }}>{stats.gamesPlayed}</p>
                  </div>
                  {player.gpa != null && (
                    <div style={statBoxStyle}>
                      <p style={statLabelStyle}>GPA</p>
                      <p style={{ ...statValueStyle, fontSize: 18 }}>{Number(player.gpa).toFixed(1)}</p>
                    </div>
                  )}
                  <div style={statBoxStyle}>
                    <p style={statLabelStyle}>Badges</p>
                    <p style={{ ...statValueStyle, fontSize: 18 }}>{stats.badgeCount}</p>
                  </div>
                </div>
              )}

              {/* Consistency bar */}
              {stats.consistencyScore != null && (
                <div data-testid="section-consistency-bar">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <p style={{ ...statLabelStyle, marginBottom: 0 }}>Consistency</p>
                    <p style={{ fontSize: 12, fontWeight: 700, color: stats.consistencyScore >= 70 ? '#10b981' : stats.consistencyScore >= 40 ? '#C6D0D8' : '#ef4444', fontFamily: "'Teko', sans-serif" }} data-testid="text-consistency-score">
                      {stats.consistencyScore}/100
                    </p>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
                    <div style={{
                      height: 4, borderRadius: 2,
                      width: `${stats.consistencyScore}%`,
                      background: stats.consistencyScore >= 70 ? '#10b981' : stats.consistencyScore >= 40 ? '#C6D0D8' : '#ef4444',
                    }} />
                  </div>
                </div>
              )}

              {/* Profile URL */}
              <div style={{ textAlign: 'center', padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: 11, color: '#4f6878', fontWeight: 600 }}>
                  caliber.app/recruit/{player.id}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '10px 24px', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(0,0,0,0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src={caliberLogo} alt="" style={{ width: 18, height: 18, opacity: 0.6 }} />
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>Caliber Performance Labs</span>
              </div>
              {stats.averageGrade && (
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Verified Stats
                </span>
              )}
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
