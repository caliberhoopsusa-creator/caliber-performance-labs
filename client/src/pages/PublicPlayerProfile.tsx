import { useRoute, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Star,
  Zap,
  Trophy,
  Crown,
  Sparkles,
  Copy,
  Mail,
  MapPin,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  User,
  Target,
  Award,
  Activity,
  MessageSquareQuote,
  Film,
  Play,
  Loader2,
  BadgeCheck,
  Ruler,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CaliberLogo } from "@/components/CaliberLogo";
import { GradeBadge } from "@/components/GradeBadge";
import { CoachRecommendations } from "@/components/CoachRecommendations";
import { useAuth } from "@/hooks/use-auth";
import { X as XIcon } from "lucide-react";

interface PublicPlayerData {
  player: {
    id: number;
    name: string;
    position: string;
    jerseyNumber: number | null;
    photoUrl: string | null;
    bannerUrl: string | null;
    sport: string;
    currentTier: string;
    totalXp: number;
    school: string | null;
    graduationYear: number | null;
    state: string | null;
    gpa: string | null;
    height: string | null;
    level: string | null;
    bio: string | null;
  };
  stats: {
    gamesPlayed: number;
    averageGrade: string;
    performanceTrend: 'improving' | 'stable' | 'declining';
    basketball: {
      ppg: number;
      rpg: number;
      apg: number;
    };
  };
  recentGames: Array<{
    id: number;
    date: string;
    opponent: string;
    grade: string | null;
    points: number;
    rebounds: number;
    assists: number;
    passingYards?: number;
    rushingYards?: number;
    receivingYards?: number;
    passingTouchdowns?: number;
    rushingTouchdowns?: number;
    receivingTouchdowns?: number;
    tackles?: number;
  }>;
  badges: Array<{
    type: string;
    earnedAt: string | null;
  }>;
  skillBadges: Array<{
    skillType: string;
    level: string;
  }>;
  accolades: Array<{
    id: number;
    type: string;
    title: string;
    season: string | null;
  }>;
  shareUrl: string;
  ogImage: string;
}

// Tier identity — one disciplined platinum treatment, distinguished only by icon.
const TIER_ICONS: Record<string, typeof Star> = {
  Rookie: Star,
  Starter: Zap,
  "All-Star": Sparkles,
  MVP: Trophy,
  "Hall of Fame": Crown,
};

const TIER_CLASS = "text-accent bg-accent/10 border-accent/30";

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatPosition(position: string | null | undefined): string {
  if (!position) return '';
  return position.split(',').map(p => p.trim()).join(' / ');
}

/** Surface conventions — keep cards uniform across the whole profile. */
const SURFACE = "rounded-2xl border border-white/[0.07] bg-white/[0.02]";
const SECTION_TITLE = "flex items-center gap-2 font-display text-lg font-bold tracking-tight";

function PublicPlayerProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-56 rounded-3xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  );
}

export default function PublicPlayerProfile() {
  const [, params] = useRoute("/profile/:id/public");
  const [, setLocation] = useLocation();
  const playerId = Number(params?.id);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [ctaDismissed, setCtaDismissed] = useState(() =>
    typeof sessionStorage !== 'undefined' && !!sessionStorage.getItem('joinCtaDismissed')
  );

  const dismissCta = () => {
    sessionStorage.setItem('joinCtaDismissed', '1');
    setCtaDismissed(true);
  };

  const { data, isLoading, error } = useQuery<PublicPlayerData>({
    queryKey: [`/api/players/${playerId}/public`],
    enabled: !!playerId,
  });

  const { data: endorsements = [] } = useQuery({
    queryKey: ['/api/players', playerId, 'endorsements'],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}/endorsements`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!playerId && !isNaN(playerId),
  });

  const { data: highlights = [] } = useQuery({
    queryKey: ['/api/players', playerId, 'highlights'],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/players/${playerId}/highlights`);
        if (!res.ok) return [];
        return res.json();
      } catch { return []; }
    },
    enabled: !!playerId && !isNaN(playerId),
  });

  useEffect(() => {
    if (data?.player) {
      document.title = `${data.player.name} - Player Profile | Caliber`;

      const metaTags = [
        { property: 'og:title', content: `${data.player.name} - ${formatPosition(data.player.position)} | Caliber` },
        { property: 'og:description', content: `Check out ${data.player.name}'s player profile. ${data.stats.averageGrade} grade average, ${data.stats.gamesPlayed} games played.` },
        { property: 'og:image', content: data.ogImage },
        { property: 'og:url', content: data.shareUrl },
        { property: 'og:type', content: 'profile' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: `${data.player.name} - Player Profile` },
        { name: 'twitter:description', content: `${data.stats.averageGrade} grade average | ${data.player.currentTier} tier` },
      ];

      metaTags.forEach(({ property, name, content }) => {
        let meta = property
          ? document.querySelector(`meta[property="${property}"]`)
          : document.querySelector(`meta[name="${name}"]`);

        if (!meta) {
          meta = document.createElement('meta');
          if (property) meta.setAttribute('property', property);
          if (name) meta.setAttribute('name', name);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      });
    }
  }, [data]);

  const [contactOpen, setContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ senderName: '', senderEmail: '', senderRole: 'coach', senderSchool: '', message: '' });
  const [contactSubmitting, setContactSubmitting] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(data?.shareUrl || window.location.href);
      toast({ title: "Link Copied!", description: "Profile link copied to clipboard" });
    } catch {
      toast({ title: "Failed to copy", description: "Could not copy link to clipboard", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <PublicPlayerProfileSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <div className={cn(SURFACE, "p-8 text-center max-w-md")}>
          <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2 font-display">Player Not Found</h2>
          <p className="text-muted-foreground mb-5">This player profile doesn't exist or has been removed.</p>
          <Link href="/">
            <Button data-testid="button-go-home">Go to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { player, stats, recentGames, skillBadges, accolades } = data;
  const TierIcon = TIER_ICONS[player.currentTier] || Star;
  const firstName = player.name.split(' ')[0];

  const handleContactSubmit = async () => {
    if (!contactForm.senderName || !contactForm.senderEmail || !contactForm.message) {
      toast({ title: "Missing Fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setContactSubmitting(true);
    try {
      const res = await fetch(`/api/public/players/${player.id}/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to send');
      }
      toast({ title: "Inquiry Sent!", description: "Your message has been sent to the player." });
      setContactOpen(false);
      setContactForm({ senderName: '', senderEmail: '', senderRole: 'coach', senderSchool: '', message: '' });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to send inquiry.", variant: "destructive" });
    } finally {
      setContactSubmitting(false);
    }
  };

  const TrendIcon = stats.performanceTrend === 'improving' ? TrendingUp :
                    stats.performanceTrend === 'declining' ? TrendingDown : Minus;
  const trendColor = stats.performanceTrend === 'improving' ? 'text-emerald-400' :
                     stats.performanceTrend === 'declining' ? 'text-red-400' : 'text-muted-foreground';

  const statStrip = [
    { label: "PPG", value: stats.basketball.ppg },
    { label: "RPG", value: stats.basketball.rpg },
    { label: "APG", value: stats.basketball.apg },
    { label: "Games", value: stats.gamesPlayed },
  ];

  const metaItems = [
    player.school && { icon: GraduationCap, text: player.school },
    player.graduationYear && { icon: CalendarDays, text: `Class of ${player.graduationYear}` },
    player.state && { icon: MapPin, text: player.state },
    player.height && { icon: Ruler, text: player.height },
  ].filter(Boolean) as Array<{ icon: typeof MapPin; text: string }>;

  const ContactDialog = (
    <Dialog open={contactOpen} onOpenChange={setContactOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-[hsl(var(--cta))] text-white hover:bg-[hsl(var(--cta))]/90" data-testid="button-contact-recruit">
          <Mail className="w-4 h-4" />
          Contact for Recruiting
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contact {player.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="senderName">Your Name *</Label>
            <Input id="senderName" placeholder="Full name" value={contactForm.senderName} onChange={e => setContactForm(f => ({ ...f, senderName: e.target.value }))} data-testid="input-sender-name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="senderEmail">Email *</Label>
            <Input id="senderEmail" type="email" placeholder="your@email.com" value={contactForm.senderEmail} onChange={e => setContactForm(f => ({ ...f, senderEmail: e.target.value }))} data-testid="input-sender-email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="senderRole">Your Role</Label>
            <Select value={contactForm.senderRole} onValueChange={v => setContactForm(f => ({ ...f, senderRole: v }))}>
              <SelectTrigger data-testid="select-sender-role"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="coach">Coach</SelectItem>
                <SelectItem value="recruiter">Recruiter</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="senderSchool">School/Organization</Label>
            <Input id="senderSchool" placeholder="Optional" value={contactForm.senderSchool} onChange={e => setContactForm(f => ({ ...f, senderSchool: e.target.value }))} data-testid="input-sender-school" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea id="message" placeholder="Introduce yourself and your interest..." rows={4} value={contactForm.message} onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))} data-testid="input-message" />
          </div>
          <Button onClick={handleContactSubmit} disabled={contactSubmitting} className="w-full gap-2" data-testid="button-submit-inquiry">
            {contactSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : "Send Inquiry"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ambient platinum wash */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[420px]"
        style={{ background: "radial-gradient(ellipse 70% 100% at 50% 0%, hsl(var(--accent) / 0.08), transparent 70%)" }}
      />

      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-background/70 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <CaliberLogo size={26} />
            <span className="font-display text-base font-bold tracking-tight">Caliber</span>
          </Link>
          <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-2" data-testid="button-copy-link">
            <Copy className="w-4 h-4" /> Share
          </Button>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-6 space-y-5 pb-16">
        {/* ───── Hero ───── */}
        <section className={cn(SURFACE, "relative overflow-hidden")} data-testid="profile-hero">
          {/* banner / fallback */}
          <div className="relative h-36 md:h-52">
            {player.bannerUrl ? (
              <img src={player.bannerUrl} alt="" className="h-full w-full object-cover" data-testid="img-player-banner" />
            ) : (
              <div
                className="h-full w-full"
                style={{ background: "radial-gradient(120% 140% at 80% 0%, hsl(var(--accent) / 0.18), transparent 55%), linear-gradient(180deg, #101113, #0a0a0b)" }}
              />
            )}
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 30%, hsl(var(--background)) 98%)" }} />
          </div>

          <div className="px-5 pb-6 md:px-7">
            <div className="-mt-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              {/* identity */}
              <div className="flex items-end gap-4">
                <div className="relative shrink-0">
                  <Avatar className="h-24 w-24 rounded-2xl border border-white/10 bg-background md:h-28 md:w-28" >
                    <AvatarImage src={player.photoUrl || undefined} alt={player.name} className="rounded-2xl object-cover" data-testid="img-player-photo" />
                    <AvatarFallback className="rounded-2xl bg-white/[0.04] text-2xl font-bold text-foreground">
                      {getInitials(player.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className={cn("absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-xl border", TIER_CLASS)}>
                    <TierIcon className="h-4 w-4" />
                  </span>
                </div>

                <div className="min-w-0 pb-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    {player.jerseyNumber != null && (
                      <span className="font-display text-sm font-bold text-accent">#{player.jerseyNumber}</span>
                    )}
                    <Badge variant="outline" className="border-white/12 text-foreground/80 text-[0.65rem] uppercase tracking-wide">
                      {formatPosition(player.position)}
                    </Badge>
                    <Badge variant="outline" className="border-white/12 text-foreground/80 text-[0.65rem] uppercase tracking-wide" data-testid="badge-sport-basketball">
                      Basketball
                    </Badge>
                    {(player as any).verifiedAthlete && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[0.65rem] font-medium text-emerald-400">
                        <BadgeCheck className="h-3 w-3" /> Verified
                      </span>
                    )}
                  </div>
                  <h1 className="truncate font-display text-3xl font-bold tracking-[-0.02em] md:text-4xl" data-testid="text-player-name">
                    {player.name}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                    {metaItems.map((m, i) => (
                      <span key={i} className="flex items-center gap-1.5">
                        <m.icon className="h-3.5 w-3.5 text-accent/70" />
                        {m.text}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* grade + trend */}
              <div className="flex items-center gap-5 md:pb-1">
                <div className="text-center">
                  <div className="mb-2 font-label text-muted-foreground">Overall</div>
                  <span data-testid="badge-overall-grade"><GradeBadge grade={stats.averageGrade} size="lg" /></span>
                </div>
                <div className="h-12 w-px bg-white/[0.08]" />
                <div className="text-center">
                  <div className="mb-2 font-label text-muted-foreground">Trend</div>
                  <div className={cn("flex items-center gap-1.5 font-medium", trendColor)} data-testid="indicator-trend">
                    <TrendIcon className="h-5 w-5" />
                    <span className="text-sm capitalize">{stats.performanceTrend}</span>
                  </div>
                </div>
              </div>
            </div>

            {player.bio && (
              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground" data-testid="text-player-bio">
                {player.bio}
              </p>
            )}
          </div>
        </section>

        {/* ───── Recruit CTA ───── */}
        <section className={cn(SURFACE, "relative overflow-hidden p-5 md:p-6")} data-testid="card-scout-me">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full"
            style={{ background: "radial-gradient(circle, hsl(var(--accent) / 0.12), transparent 70%)", filter: "blur(20px)" }}
          />
          <div className="relative flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className={cn(SECTION_TITLE)}>
                <Target className="h-5 w-5 text-accent" />
                Recruiting {firstName}?
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {[player.school, player.graduationYear && `Class of ${player.graduationYear}`, player.state].filter(Boolean).join(' · ')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {ContactDialog}
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast({ title: "Profile Link Copied", description: "Share this link with coaches and recruiters." });
                }}
                className="gap-2"
                data-testid="button-copy-scout-link"
              >
                <Copy className="h-4 w-4" /> Copy Link
              </Button>
            </div>
          </div>
        </section>

        {/* ───── Stat strip ───── */}
        <section className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.05] md:grid-cols-4">
          {statStrip.map((s) => (
            <div key={s.label} className="bg-background/40 px-5 py-5 text-center" data-testid={`stat-${s.label.toLowerCase()}`}>
              <div className="font-display text-3xl font-bold tabular-nums">{s.value}</div>
              <div className="mt-1 font-label text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </section>

        {/* ───── Recruiting info + recent games ───── */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <section className={cn(SURFACE, "p-5 md:p-6")}>
            <h2 className={cn(SECTION_TITLE, "mb-5")}>
              <GraduationCap className="h-5 w-5 text-accent" /> Recruiting Info
            </h2>
            <dl className="divide-y divide-white/[0.06]">
              {[
                player.graduationYear && { k: "Class Year", v: String(player.graduationYear), accent: true },
                player.gpa && { k: "GPA", v: player.gpa },
                player.level && { k: "Level", v: player.level.replace('_', ' ') },
                player.height && { k: "Height", v: player.height },
              ].filter(Boolean).map((row: any) => (
                <div key={row.k} className="flex items-center justify-between py-3 first:pt-0">
                  <dt className="text-sm text-muted-foreground">{row.k}</dt>
                  <dd className={cn("font-medium capitalize", row.accent ? "text-accent" : "text-foreground")}>{row.v}</dd>
                </div>
              ))}
            </dl>
            <Button className="mt-5 w-full gap-2" variant="outline" onClick={() => setLocation('/community?tab=messages')} data-testid="button-contact-player">
              <Mail className="h-4 w-4" /> Contact Player
            </Button>
          </section>

          <section className={cn(SURFACE, "p-5 md:p-6")}>
            <h2 className={cn(SECTION_TITLE, "mb-5")}>
              <Activity className="h-5 w-5 text-accent" /> Recent Games
            </h2>
            {recentGames.length > 0 ? (
              <div className="space-y-2">
                {recentGames.map((game) => (
                  <div
                    key={game.id}
                    className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                    data-testid={`highlight-game-${game.id}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">vs {game.opponent}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm tabular-nums text-muted-foreground">{game.points} pts</span>
                      <GradeBadge grade={game.grade || 'C'} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">No games recorded yet</div>
            )}
          </section>
        </div>

        {/* ───── Achievements ───── */}
        {(skillBadges.length > 0 || accolades.length > 0) && (
          <section className={cn(SURFACE, "p-5 md:p-6")}>
            <h2 className={cn(SECTION_TITLE, "mb-5")}>
              <Award className="h-5 w-5 text-accent" /> Achievements
            </h2>
            <div className="space-y-5">
              {skillBadges.length > 0 && (
                <div>
                  <div className="mb-2.5 font-label text-muted-foreground">Skill Badges</div>
                  <div className="flex flex-wrap gap-2">
                    {skillBadges.map((badge) => (
                      <span
                        key={badge.skillType}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs capitalize text-foreground/85"
                        data-testid={`badge-skill-${badge.skillType}`}
                      >
                        <Target className="h-3 w-3 text-accent" />
                        {badge.skillType.replace('_', ' ')}
                        <span className="text-muted-foreground">· {badge.level}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {accolades.length > 0 && (
                <div>
                  <div className="mb-2.5 font-label text-muted-foreground">Accolades</div>
                  <div className="flex flex-wrap gap-2">
                    {accolades.map((accolade) => (
                      <span
                        key={accolade.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/[0.07] px-3 py-1.5 text-xs text-accent"
                        data-testid={`badge-accolade-${accolade.id}`}
                      >
                        <Trophy className="h-3 w-3" />
                        {accolade.title}
                        {accolade.season && <span className="text-accent/60">· {accolade.season}</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ───── Endorsements ───── */}
        {endorsements.length > 0 && (
          <section className="space-y-4" data-testid="section-public-endorsements">
            <h2 className={SECTION_TITLE}>
              <MessageSquareQuote className="h-5 w-5 text-accent" />
              Coach Endorsements
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">{endorsements.length}</span>
            </h2>
            <div className="grid gap-3">
              {endorsements.map((e: any) => (
                <div key={e.id} className={cn(SURFACE, "p-4")} data-testid={`public-endorsement-${e.id}`}>
                  <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9 border border-white/10">
                      <AvatarFallback className="bg-accent/15 text-xs font-bold text-accent">
                        {e.coachName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold">{e.coachName}</span>
                        <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                          {e.skillCategory?.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-foreground/70">{e.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ───── Highlights ───── */}
        {highlights.length > 0 && (
          <section className="space-y-4" data-testid="section-public-highlights">
            <h2 className={SECTION_TITLE}>
              <Film className="h-5 w-5 text-accent" />
              Highlight Clips
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">{highlights.length}</span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {highlights.map((clip: any) => (
                <div key={clip.id} className={cn(SURFACE, "group overflow-hidden")} data-testid={`public-highlight-${clip.id}`}>
                  {clip.thumbnailUrl ? (
                    <div className="relative aspect-video bg-black/40">
                      <img src={clip.thumbnailUrl} alt={clip.title || 'Highlight'} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-background/80">
                          <Play className="ml-0.5 h-5 w-5 text-foreground" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-white/[0.02]">
                      <Film className="h-10 w-10 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="p-3.5">
                    <h4 className="truncate text-sm font-semibold">{clip.title || 'Highlight Clip'}</h4>
                    {clip.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{clip.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ───── Bottom actions ───── */}
        <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
          <Button size="lg" onClick={handleCopyLink} className="gap-2" data-testid="button-copy-profile-link">
            <Copy className="h-4 w-4" /> Copy Profile Link
          </Button>
          <Link href="/">
            <Button variant="outline" size="lg" className="w-full gap-2 sm:w-auto" data-testid="button-view-in-app">
              View in Caliber <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <section className="border-t border-white/[0.06] pt-10">
          <CoachRecommendations playerId={player.id} isCoachViewing={false} showWriteForm={false} />
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/[0.06] py-7 text-center text-sm text-muted-foreground">
        <div className="mb-2 flex items-center justify-center gap-2">
          <CaliberLogo size={22} />
          <span className="font-display font-bold tracking-tight">Caliber</span>
        </div>
        <p>The performance platform for serious athletes.</p>
      </footer>

      {/* Sticky "Join Caliber" CTA for non-authenticated visitors */}
      {!isAuthenticated && !ctaDismissed && (
        <div className="fixed inset-x-0 bottom-0 z-50 p-3 pb-safe">
          <div className="mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-white/10 bg-background/90 px-4 py-3 shadow-2xl backdrop-blur-xl">
            <CaliberLogo size={28} />
            <p className="flex-1 text-sm">
              <span className="font-semibold">{player.name}</span> tracks stats on Caliber.{" "}
              <span className="text-muted-foreground">Get your own free profile.</span>
            </p>
            <a href="/api/login">
              <Button size="sm" className="shrink-0 bg-[hsl(var(--cta))] text-white hover:bg-[hsl(var(--cta))]/90">
                Sign Up Free
              </Button>
            </a>
            <button onClick={dismissCta} className="shrink-0 rounded-md p-1 transition-colors hover:bg-white/[0.06]" aria-label="Dismiss">
              <XIcon className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
