import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Copy,
  Mail,
  Trophy,
  Target,
  Film,
  Play,
  Loader2,
  ChevronRight,
  MessageSquareQuote,
  X as XIcon,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getTier } from "@/lib/caliberTier";
import { CaliberLogo } from "@/components/CaliberLogo";
import { CoachRecommendations } from "@/components/CoachRecommendations";
import { ShareCaliberScoreButton } from "@/components/ShareCaliberScoreButton";
import { useAuth } from "@/hooks/use-auth";
import {
  PlayerCard,
  SectionEyebrow,
  TelemetryStrip,
  GradeBadge,
  type TelemetryItem,
  type Attribute,
} from "@/components/signal";

/**
 * PublicPlayerProfile — SIGNAL: Career Mode, Phase 1b. The career screen.
 * This is what a cold-emailed coach opens: PlayerCard hero with the real
 * Caliber Score (OvrPlate), real attribute splits from the AI rating engine,
 * verified-stat provenance from the statVerifications table, and the season
 * log as a career timeline. Every number is real — no score renders as an
 * honest RAW state, never a fake numeral.
 */

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
    performanceTrend: "improving" | "stable" | "declining";
    basketball: { ppg: number; rpg: number; apg: number };
  };
  recentGames: Array<{
    id: number;
    date: string;
    opponent: string;
    grade: string | null;
    points: number;
    rebounds: number;
    assists: number;
  }>;
  badges: Array<{ type: string; earnedAt: string | null }>;
  skillBadges: Array<{ skillType: string; level: string }>;
  accolades: Array<{ id: number; type: string; title: string; season: string | null }>;
  shareUrl: string;
  ogImage: string;
}

/** Real sub-scores from the AI rating engine — null until games exist. */
interface AiRatingData {
  overallRating: number | null;
  subScores: {
    production: number;
    efficiency: number;
    impact: number;
    defense: number;
    athletic: number;
    intangibles: number;
  } | null;
  ratingBand?: string;
  explanation?: string[];
}

/** A coach-verified game from the statVerifications table (status=verified). */
interface VerifiedGameRecord {
  id: number;
  gameId: number;
  verifierName: string;
  verifierRole: string;
  verificationMethod: string;
  verifiedAt: string | null;
}

const CONDENSED = { fontWeight: 500, fontStretch: "70%" } as const;
const DISPLAY_BLACK = {
  fontFamily: "var(--font-display)",
  fontWeight: 900,
  fontStretch: "125%",
  letterSpacing: "-0.01em",
} as const;

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatPosition(position: string | null | undefined): string {
  if (!position) return "";
  return position
    .split(",")
    .map((p) => p.trim())
    .join(" / ");
}

function formatGameDate(date: string): string {
  return new Date(date)
    .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })
    .toUpperCase();
}

/* ------------------------------------------------------------------ */
/* local pieces                                                        */
/* ------------------------------------------------------------------ */

/** Honest early-state plate — neutral silver, no invented numeral. */
function RawPlate() {
  return (
    <div
      className="angle-cut lean inline-flex shrink-0 flex-col items-center border px-4 py-2.5"
      style={{
        backgroundColor: "hsl(var(--obsidian-2))",
        borderColor: "hsl(var(--line))",
        boxShadow: "inset 0 1px 0 hsl(var(--silver) / 0.08)",
      }}
      data-testid="plate-raw"
    >
      <span
        className="leading-none"
        style={{ ...DISPLAY_BLACK, fontSize: "var(--text-stat)", color: "hsl(var(--tier-raw))" }}
      >
        RAW
      </span>
      <span
        className="mt-1 font-display text-label uppercase"
        style={{ ...CONDENSED, color: "hsl(var(--silver-lo))" }}
      >
        NO GRADED GAMES YET
      </span>
    </div>
  );
}

/** JetBrains Mono provenance mark — real verification state only. */
function ProvenanceMark({ verified }: { verified: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap font-mono uppercase"
      style={{
        fontSize: "var(--text-data)",
        color: verified ? "hsl(var(--grade-a))" : "hsl(var(--silver-mute))",
      }}
    >
      {verified && <Check aria-hidden className="h-3 w-3" />}
      {verified ? "Verified" : "Self-reported"}
    </span>
  );
}

/** Mono label/value row for the scout readout. */
function ReadoutRow({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div
      className="flex items-baseline justify-between gap-4 border-b py-2"
      style={{ borderColor: "hsl(var(--line))" }}
    >
      <span
        className="font-display text-label uppercase"
        style={{ ...CONDENSED, color: "hsl(var(--silver-lo))" }}
      >
        {label}
      </span>
      <span
        className="text-right font-mono tabular-nums text-foreground"
        style={{ fontSize: "var(--text-data)" }}
        data-testid={testId}
      >
        {value}
      </span>
    </div>
  );
}

function PublicPlayerProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
        <Skeleton className="h-72 rounded-card" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-card" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-card" />
        <p
          className="text-center font-display text-label uppercase text-muted-foreground"
          style={CONDENSED}
        >
          TIP — coach-verified stat lines show a ✓ on the season log
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* page                                                                */
/* ------------------------------------------------------------------ */

export default function PublicPlayerProfile() {
  const [, params] = useRoute("/profile/:id/public");
  const playerId = Number(params?.id);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [ctaDismissed, setCtaDismissed] = useState(
    () => typeof sessionStorage !== "undefined" && !!sessionStorage.getItem("joinCtaDismissed"),
  );

  const dismissCta = () => {
    sessionStorage.setItem("joinCtaDismissed", "1");
    setCtaDismissed(true);
  };

  const hasPlayerId = !!playerId && !isNaN(playerId);

  const { data, isLoading, error } = useQuery<PublicPlayerData>({
    queryKey: [`/api/players/${playerId}/public`],
    enabled: hasPlayerId,
  });

  // Same key as ShareCaliberScoreButton / CaliberScore — shares the cache.
  const { data: rating } = useQuery<AiRatingData>({
    queryKey: ["/api/players", String(playerId), "ai-rating"],
    enabled: hasPlayerId,
  });

  // Real provenance: coach-verified games from the statVerifications table.
  const { data: verifiedGames = [] } = useQuery<VerifiedGameRecord[]>({
    queryKey: [`/api/players/${playerId}/verified-games`],
    enabled: hasPlayerId,
  });

  const { data: endorsements = [] } = useQuery({
    queryKey: ["/api/players", playerId, "endorsements"],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}/endorsements`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: hasPlayerId,
  });

  const { data: highlights = [] } = useQuery({
    queryKey: ["/api/players", playerId, "highlights"],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/players/${playerId}/highlights`);
        if (!res.ok) return [];
        return res.json();
      } catch {
        return [];
      }
    },
    enabled: hasPlayerId,
  });

  useEffect(() => {
    if (data?.player) {
      document.title = `${data.player.name} - Player Profile | Caliber`;
      const metaTags = [
        { property: "og:title", content: `${data.player.name} - ${formatPosition(data.player.position)} | Caliber` },
        { property: "og:description", content: `Check out ${data.player.name}'s player profile. ${data.stats.averageGrade} grade average, ${data.stats.gamesPlayed} games played.` },
        { property: "og:image", content: data.ogImage },
        { property: "og:url", content: data.shareUrl },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: `${data.player.name} - Player Profile` },
        { name: "twitter:description", content: `${data.stats.averageGrade} grade average | ${data.player.currentTier} tier` },
      ];
      metaTags.forEach(({ property, name, content }) => {
        let meta = property
          ? document.querySelector(`meta[property="${property}"]`)
          : document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
          meta = document.createElement("meta");
          if (property) meta.setAttribute("property", property);
          if (name) meta.setAttribute("name", name);
          document.head.appendChild(meta);
        }
        meta.setAttribute("content", content);
      });
    }
  }, [data]);

  const [contactOpen, setContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    senderName: "",
    senderEmail: "",
    senderRole: "coach",
    senderSchool: "",
    message: "",
  });
  const [contactSubmitting, setContactSubmitting] = useState(false);

  const verifiedGameIds = useMemo(
    () => new Set(verifiedGames.map((v) => v.gameId)),
    [verifiedGames],
  );

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(data?.shareUrl || window.location.href);
      toast({ title: "Link Copied!", description: "Profile link copied to clipboard" });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  if (isLoading) return <PublicPlayerProfileSkeleton />;

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <div
          className="gloss max-w-md rounded-card border p-8 text-center"
          style={{ backgroundColor: "hsl(var(--obsidian-1))", borderColor: "hsl(var(--line))" }}
        >
          <SectionEyebrow as="div" className="justify-center">
            Profile
          </SectionEyebrow>
          <h2 className="mt-5 uppercase leading-none text-title" style={DISPLAY_BLACK}>
            Player not found
          </h2>
          <p className="mt-4 font-body text-sm leading-relaxed text-muted-foreground">
            This player profile doesn't exist or has been removed.
          </p>
          <Link href="/">
            <Button className="mt-6" data-testid="button-go-home">
              Go to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { player, stats, recentGames, skillBadges, accolades } = data;

  const score =
    typeof rating?.overallRating === "number" && rating.overallRating > 0
      ? Math.round(rating.overallRating)
      : null;
  const tier = score !== null ? getTier(score) : null;

  const attributes: Attribute[] | undefined = rating?.subScores
    ? [
        { label: "Production", value: Math.round(rating.subScores.production) },
        { label: "Efficiency", value: Math.round(rating.subScores.efficiency) },
        { label: "Impact", value: Math.round(rating.subScores.impact) },
        { label: "Defense", value: Math.round(rating.subScores.defense) },
        { label: "Athletic", value: Math.round(rating.subScores.athletic) },
        { label: "Intangibles", value: Math.round(rating.subScores.intangibles) },
      ]
    : undefined;

  const schoolLine =
    [player.school, player.state].filter(Boolean).join(" · ") || "School not listed";

  const verifiedCount = recentGames.filter((g) => verifiedGameIds.has(g.id)).length;
  const totalVerified = verifiedGames.length;

  const seasonTelemetry: TelemetryItem[] = [
    { label: "GP", value: stats.gamesPlayed },
    { label: "PPG", value: stats.basketball.ppg },
    { label: "RPG", value: stats.basketball.rpg },
    { label: "APG", value: stats.basketball.apg },
    ...(stats.averageGrade !== "—" ? [{ label: "Avg grade", value: stats.averageGrade }] : []),
    ...(stats.gamesPlayed >= 6
      ? [{ label: "Trend", value: stats.performanceTrend.toUpperCase() }]
      : []),
  ];

  const handleContactSubmit = async () => {
    if (!contactForm.senderName || !contactForm.senderEmail || !contactForm.message) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    setContactSubmitting(true);
    try {
      const res = await fetch(`/api/public/players/${player.id}/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to send");
      }
      toast({ title: "Inquiry Sent!", description: "Your message has been sent to the player." });
      setContactOpen(false);
      setContactForm({ senderName: "", senderEmail: "", senderRole: "coach", senderSchool: "", message: "" });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to send inquiry.",
        variant: "destructive",
      });
    } finally {
      setContactSubmitting(false);
    }
  };

  const heroAvatar = (
    <Avatar className="h-12 w-12 border sm:h-14 sm:w-14" style={{ borderColor: "hsl(var(--line))" }}>
      <AvatarImage src={player.photoUrl || undefined} alt={player.name} data-testid="img-player-photo" />
      <AvatarFallback
        className="font-display text-sm"
        style={{
          fontWeight: 800,
          backgroundColor: "hsl(var(--obsidian-3))",
          color: "hsl(var(--silver))",
        }}
      >
        {getInitials(player.name)}
      </AvatarFallback>
    </Avatar>
  );

  const provenanceFooter = (
    <p className="font-mono text-muted-foreground" style={{ fontSize: "var(--text-data)" }}>
      {totalVerified > 0 ? (
        <>
          <span style={{ color: "hsl(var(--grade-a))" }}>✓ {totalVerified}</span>
          {` of ${stats.gamesPlayed} games coach-verified`}
        </>
      ) : stats.gamesPlayed > 0 ? (
        "STATS SELF-REPORTED · coach verification pending"
      ) : (
        "Grades appear after the first logged game"
      )}
    </p>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <style>{`
        .pp-atmosphere {
          background:
            radial-gradient(52% 38% at 50% 0%, hsl(var(--crimson-deep) / 0.22), transparent 70%),
            radial-gradient(36% 30% at 85% 30%, hsl(var(--crimson-deep) / 0.10), transparent 72%);
        }
      `}</style>

      {/* sticky header — the scout actions stay one thumb away */}
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-xl"
        style={{
          borderColor: "hsl(var(--line))",
          backgroundColor: "hsl(var(--obsidian-0) / 0.8)",
        }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2" data-testid="link-header-home">
            <CaliberLogo size={26} color="hsl(var(--crimson))" />
            <span className="lean hidden uppercase text-section sm:inline" style={DISPLAY_BLACK}>
              Caliber
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ShareCaliberScoreButton playerId={playerId} size="sm" label="Score Card" />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="gap-2"
              data-testid="button-copy-link"
            >
              <Copy className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* HERO — the player card. One hero element; everything else supports it. */}
        <section
          aria-labelledby="player-name"
          className="relative isolate overflow-hidden border-b px-4 pb-10 pt-8 sm:px-6 md:pb-14 md:pt-12"
          style={{ borderColor: "hsl(var(--line))" }}
        >
          <div aria-hidden className="pp-atmosphere absolute inset-0 -z-10" />
          <div aria-hidden className="grain-overlay -z-10" />

          <div className="mx-auto grid w-full max-w-5xl items-start gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
            {/* the card — real identity, real score or honest RAW state */}
            <h1 id="player-name" className="sr-only">
              {player.name}
            </h1>
            {score !== null ? (
              <PlayerCard
                name={player.name}
                position={formatPosition(player.position)}
                jerseyNumber={player.jerseyNumber != null ? String(player.jerseyNumber) : undefined}
                school={schoolLine}
                score={score}
                attributes={attributes}
                avatar={heroAvatar}
                footer={provenanceFooter}
                className="min-w-0"
                data-testid="hero-player-card"
              />
            ) : (
              <article
                className="gloss relative min-w-0 rounded-card border p-5 sm:p-6"
                style={{
                  backgroundColor: "hsl(var(--obsidian-1))",
                  borderColor: "hsl(var(--line))",
                  boxShadow: "0 24px 64px hsl(var(--obsidian-0) / 0.6)",
                }}
                data-testid="hero-player-card-raw"
              >
                <header className="mb-5">
                  <span
                    className="font-display text-label uppercase"
                    style={{ ...CONDENSED, color: "hsl(var(--silver-lo))" }}
                  >
                    Caliber ID
                  </span>
                </header>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="shrink-0">{heroAvatar}</div>
                  <div className="lean min-w-[9rem] flex-1 pl-1">
                    <div className="lean-reset">
                      <p
                        className="uppercase leading-none text-title"
                        style={{ ...DISPLAY_BLACK, color: "hsl(var(--silver-hi))" }}
                        data-testid="text-player-name"
                      >
                        {player.name}
                      </p>
                      <p
                        className="mt-2 font-mono tabular-nums"
                        style={{ fontSize: "var(--text-data)", color: "hsl(var(--silver-lo))" }}
                      >
                        {formatPosition(player.position)}
                        {player.jerseyNumber != null ? ` · #${player.jerseyNumber}` : ""}
                      </p>
                      <p className="mt-1 font-body text-body" style={{ color: "hsl(var(--silver-lo))" }}>
                        {schoolLine}
                      </p>
                    </div>
                  </div>
                  <RawPlate />
                </div>
                <div className="mt-5 border-t pt-5" style={{ borderColor: "hsl(var(--line))" }}>
                  {provenanceFooter}
                </div>
              </article>
            )}

            {/* scout readout — why the numbers are believable + the actions */}
            <aside aria-label="Scout report" className="min-w-0">
              <SectionEyebrow as="h2">Scout Report</SectionEyebrow>

              {score !== null && rating?.ratingBand && (
                <p
                  className="mt-5 uppercase leading-none text-title"
                  style={{ ...DISPLAY_BLACK, color: "hsl(var(--silver-hi))" }}
                  data-testid="text-rating-band"
                >
                  {rating.ratingBand}
                </p>
              )}
              {score !== null && tier && (
                <p
                  className="mt-2 font-display text-label uppercase"
                  style={{ ...CONDENSED, color: `hsl(var(${tier.cssVar}))` }}
                  data-testid="text-tier-label"
                >
                  {tier.label} — {tier.blurb}
                </p>
              )}
              {score === null && (
                <p className="mt-5 font-body text-body leading-relaxed text-muted-foreground">
                  No graded games yet. The Caliber Score, attribute splits, and season log fill
                  in as real games are logged and graded — nothing here is ever estimated.
                </p>
              )}

              {rating?.explanation && rating.explanation.length > 0 && (
                <ul className="mt-4 space-y-1.5" data-testid="list-rating-explanation">
                  {rating.explanation.map((line) => (
                    <li
                      key={line}
                      className="font-mono text-muted-foreground"
                      style={{ fontSize: "var(--text-data)" }}
                    >
                      <span aria-hidden style={{ color: "hsl(var(--crimson))" }}>
                        //{" "}
                      </span>
                      {line}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-6">
                {player.graduationYear && (
                  <ReadoutRow label="Class of" value={String(player.graduationYear)} testId="text-class-year" />
                )}
                {player.height && <ReadoutRow label="Height" value={player.height} />}
                {player.gpa && <ReadoutRow label="GPA" value={player.gpa} testId="text-gpa" />}
                {player.level && (
                  <ReadoutRow label="Level" value={player.level.replace("_", " ").toUpperCase()} />
                )}
                <ReadoutRow
                  label="Verification"
                  value={
                    totalVerified > 0
                      ? `${totalVerified}/${stats.gamesPlayed} GAMES COACH-VERIFIED`
                      : stats.gamesPlayed > 0
                        ? "SELF-REPORTED"
                        : "—"
                  }
                  testId="text-verification-summary"
                />
              </div>

              {player.bio && (
                <p
                  className="mt-4 line-clamp-3 font-body text-sm leading-relaxed text-muted-foreground"
                  data-testid="text-player-bio"
                >
                  {player.bio}
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-2.5">
                <Dialog open={contactOpen} onOpenChange={setContactOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2" data-testid="button-contact-recruit">
                      <Mail className="h-4 w-4" />
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
                        <Input
                          id="senderName"
                          placeholder="Full name"
                          value={contactForm.senderName}
                          onChange={(e) => setContactForm((f) => ({ ...f, senderName: e.target.value }))}
                          data-testid="input-sender-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="senderEmail">Email *</Label>
                        <Input
                          id="senderEmail"
                          type="email"
                          placeholder="your@email.com"
                          value={contactForm.senderEmail}
                          onChange={(e) => setContactForm((f) => ({ ...f, senderEmail: e.target.value }))}
                          data-testid="input-sender-email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="senderRole">Your Role</Label>
                        <Select
                          value={contactForm.senderRole}
                          onValueChange={(v) => setContactForm((f) => ({ ...f, senderRole: v }))}
                        >
                          <SelectTrigger data-testid="select-sender-role">
                            <SelectValue />
                          </SelectTrigger>
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
                        <Input
                          id="senderSchool"
                          placeholder="Optional"
                          value={contactForm.senderSchool}
                          onChange={(e) => setContactForm((f) => ({ ...f, senderSchool: e.target.value }))}
                          data-testid="input-sender-school"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">Message *</Label>
                        <Textarea
                          id="message"
                          placeholder="Introduce yourself and your interest..."
                          rows={4}
                          value={contactForm.message}
                          onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
                          data-testid="input-message"
                        />
                      </div>
                      <Button
                        onClick={handleContactSubmit}
                        disabled={contactSubmitting}
                        className="w-full gap-2"
                        data-testid="button-submit-inquiry"
                      >
                        {contactSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                          </>
                        ) : (
                          "Send Inquiry"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  onClick={handleCopyLink}
                  className="gap-2"
                  data-testid="button-copy-scout-link"
                >
                  <Copy className="h-4 w-4" />
                  Copy Link
                </Button>
              </div>
            </aside>
          </div>
        </section>

        <div className="mx-auto max-w-5xl space-y-12 px-4 py-10 sm:px-6 md:py-14">
          {/* CAREER TIMELINE — the season log as career mode */}
          <section aria-labelledby="career-timeline-heading">
            <SectionEyebrow data-testid="eyebrow-career-timeline">
              <span id="career-timeline-heading">Career Timeline</span>
            </SectionEyebrow>
            <TelemetryStrip items={seasonTelemetry} className="mt-4" data-testid="season-telemetry" />

            {recentGames.length > 0 ? (
              <div
                className="mt-5 overflow-x-auto rounded-card border"
                style={{ backgroundColor: "hsl(var(--obsidian-1))", borderColor: "hsl(var(--line))" }}
              >
                <table className="w-full border-collapse text-left" data-testid="table-season-log">
                  <caption className="sr-only">Recent games with grades and verification status</caption>
                  <thead>
                    <tr
                      className="border-b"
                      style={{
                        backgroundColor: "hsl(var(--obsidian-2))",
                        borderColor: "hsl(var(--line))",
                      }}
                    >
                      {["Date", "Opponent", "PTS", "REB", "AST", "Grade", "Stats"].map((h, i) => (
                        <th
                          key={h}
                          scope="col"
                          className={cn(
                            "whitespace-nowrap px-4 py-2.5 font-display text-label uppercase",
                            i >= 2 && i <= 4 && "text-right",
                          )}
                          style={{ ...CONDENSED, color: "hsl(var(--silver-lo))" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody
                    className="font-mono tabular-nums"
                    style={{ fontSize: "var(--text-data)", fontVariantNumeric: "tabular-nums lining-nums" }}
                  >
                    {recentGames.map((game, idx) => (
                      <tr
                        key={game.id}
                        className={cn(idx > 0 && "border-t")}
                        style={{ borderColor: "hsl(var(--line))" }}
                        data-testid={`row-game-${game.id}`}
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {formatGameDate(game.date)}
                        </td>
                        <td className="max-w-[10rem] truncate px-4 py-3 font-body text-body text-foreground">
                          {game.opponent ? `vs ${game.opponent}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground">{game.points}</td>
                        <td className="px-4 py-3 text-right text-foreground">{game.rebounds}</td>
                        <td className="px-4 py-3 text-right text-foreground">{game.assists}</td>
                        <td className="px-4 py-3">
                          {game.grade ? (
                            <GradeBadge grade={game.grade} size="sm" data-testid={`grade-game-${game.id}`} />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <ProvenanceMark verified={verifiedGameIds.has(game.id)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                className="mt-5 rounded-card border p-8 text-center"
                style={{ backgroundColor: "hsl(var(--obsidian-1))", borderColor: "hsl(var(--line))" }}
                data-testid="empty-season-log"
              >
                <p className="font-body text-body text-muted-foreground">
                  No games recorded yet — the season log fills in as games are graded.
                </p>
              </div>
            )}
          </section>

          {/* ACHIEVEMENTS — real unlocks only */}
          {(skillBadges.length > 0 || accolades.length > 0) && (
            <section aria-labelledby="achievements-heading">
              <SectionEyebrow>
                <span id="achievements-heading">Achievements</span>
              </SectionEyebrow>
              <div className="mt-5 space-y-5">
                {skillBadges.length > 0 && (
                  <div>
                    <p
                      className="mb-2.5 font-mono uppercase text-muted-foreground"
                      style={{ fontSize: "var(--text-data)" }}
                    >
                      Skill badges
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {skillBadges.map((badge) => (
                        <span
                          key={badge.skillType}
                          className="angle-cut inline-flex items-center gap-1.5 border px-3 py-1.5 font-display text-label uppercase"
                          style={{
                            ...CONDENSED,
                            color: "hsl(var(--silver))",
                            borderColor: "hsl(var(--line))",
                            backgroundColor: "hsl(var(--obsidian-2))",
                          }}
                          data-testid={`badge-skill-${badge.skillType}`}
                        >
                          <Target aria-hidden className="h-3 w-3" style={{ color: "hsl(var(--crimson))" }} />
                          {badge.skillType.replace("_", " ")} · {badge.level}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {accolades.length > 0 && (
                  <div>
                    <p
                      className="mb-2.5 font-mono uppercase text-muted-foreground"
                      style={{ fontSize: "var(--text-data)" }}
                    >
                      Accolades
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {accolades.map((accolade) => (
                        <span
                          key={accolade.id}
                          className="angle-cut inline-flex items-center gap-1.5 border px-3 py-1.5 font-display text-label uppercase"
                          style={{
                            ...CONDENSED,
                            color: "hsl(var(--silver-hi))",
                            borderColor: "hsl(var(--line))",
                            backgroundColor: "hsl(var(--obsidian-2))",
                          }}
                          data-testid={`badge-accolade-${accolade.id}`}
                        >
                          <Trophy aria-hidden className="h-3 w-3" style={{ color: "hsl(var(--crimson))" }} />
                          {accolade.title}
                          {accolade.season ? ` (${accolade.season})` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* COACH ENDORSEMENTS — human provenance */}
          {endorsements.length > 0 && (
            <section aria-labelledby="endorsements-heading" data-testid="section-public-endorsements">
              <SectionEyebrow>
                <span id="endorsements-heading">Coach Endorsements ({endorsements.length})</span>
              </SectionEyebrow>
              <div className="mt-5 grid gap-3">
                {endorsements.map((e: any) => (
                  <blockquote
                    key={e.id}
                    className="rounded-card border p-4"
                    style={{ backgroundColor: "hsl(var(--obsidian-1))", borderColor: "hsl(var(--line))" }}
                    data-testid={`public-endorsement-${e.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <MessageSquareQuote
                        aria-hidden
                        className="mt-0.5 h-4 w-4 shrink-0"
                        style={{ color: "hsl(var(--crimson))" }}
                      />
                      <div className="min-w-0">
                        <p className="font-body text-sm leading-relaxed text-foreground/85">{e.content}</p>
                        <footer
                          className="mt-2 font-mono uppercase text-muted-foreground"
                          style={{ fontSize: "var(--text-data)" }}
                        >
                          — {e.coachName}
                          {e.skillCategory ? ` · ${String(e.skillCategory).replace("_", " ")}` : ""}
                        </footer>
                      </div>
                    </div>
                  </blockquote>
                ))}
              </div>
            </section>
          )}

          {/* HIGHLIGHT CLIPS */}
          {highlights.length > 0 && (
            <section aria-labelledby="highlights-heading" data-testid="section-public-highlights">
              <SectionEyebrow>
                <span id="highlights-heading">Highlight Clips ({highlights.length})</span>
              </SectionEyebrow>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {highlights.map((clip: any) => (
                  <div
                    key={clip.id}
                    className="overflow-hidden rounded-card border"
                    style={{ backgroundColor: "hsl(var(--obsidian-1))", borderColor: "hsl(var(--line))" }}
                    data-testid={`public-highlight-${clip.id}`}
                  >
                    {clip.thumbnailUrl ? (
                      <div className="relative aspect-video" style={{ backgroundColor: "hsl(var(--obsidian-2))" }}>
                        <img
                          src={clip.thumbnailUrl}
                          alt={clip.title || "Highlight"}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div
                            className="flex h-12 w-12 items-center justify-center rounded-full border"
                            style={{
                              backgroundColor: "hsl(var(--obsidian-0) / 0.8)",
                              borderColor: "hsl(var(--line))",
                            }}
                          >
                            <Play className="ml-0.5 h-5 w-5 text-foreground" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="flex aspect-video items-center justify-center"
                        style={{ backgroundColor: "hsl(var(--obsidian-2))" }}
                      >
                        <Film className="h-10 w-10" style={{ color: "hsl(var(--silver-mute))" }} />
                      </div>
                    )}
                    <div className="p-3">
                      <h3 className="truncate font-body text-sm font-semibold text-foreground">
                        {clip.title || "Highlight Clip"}
                      </h3>
                      {clip.description && (
                        <p className="mt-1 line-clamp-2 font-body text-xs text-muted-foreground">
                          {clip.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* closing scout actions */}
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" onClick={handleCopyLink} className="gap-2" data-testid="button-copy-profile-link">
              <Copy className="h-4 w-4" />
              Copy Profile Link
            </Button>
            <Link href="/">
              <Button variant="outline" size="lg" className="w-full gap-2 sm:w-auto" data-testid="button-view-in-app">
                View in Caliber
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Coach recommendations (existing recruiter-facing module) */}
          <section className="border-t pt-10" style={{ borderColor: "hsl(var(--line))" }}>
            <CoachRecommendations playerId={player.id} isCoachViewing={false} showWriteForm={false} />
          </section>
        </div>
      </main>

      <footer
        className="relative z-10 border-t px-4 py-8 text-center"
        style={{ borderColor: "hsl(var(--line))" }}
      >
        <div className="mb-2 flex items-center justify-center gap-2">
          <CaliberLogo size={22} color="hsl(var(--crimson))" />
          <span className="lean uppercase text-section" style={DISPLAY_BLACK}>
            Caliber
          </span>
        </div>
        <p className="font-display text-label uppercase text-muted-foreground" style={CONDENSED}>
          Every game, graded
        </p>
      </footer>

      {/* Sticky "Join Caliber" CTA for non-authenticated visitors */}
      {!isAuthenticated && !ctaDismissed && (
        <div className="pb-safe fixed bottom-0 left-0 right-0 z-50 p-3">
          <div
            className="mx-auto flex max-w-lg items-center gap-3 rounded-card border px-4 py-3 backdrop-blur-xl"
            style={{
              backgroundColor: "hsl(var(--obsidian-2) / 0.92)",
              borderColor: "hsl(var(--line))",
              boxShadow: "0 12px 40px hsl(var(--obsidian-0) / 0.7)",
            }}
          >
            <CaliberLogo size={24} color="hsl(var(--crimson))" />
            <p className="flex-1 font-body text-sm text-foreground">
              <span className="font-semibold">{player.name}</span> tracks stats on Caliber.{" "}
              <span className="text-muted-foreground">Get your own free profile.</span>
            </p>
            <a href="/api/login">
              <Button size="sm" className="shrink-0" data-testid="button-join-cta">
                Sign Up Free
              </Button>
            </a>
            <button
              onClick={dismissCta}
              aria-label="Dismiss"
              className="shrink-0 rounded-md p-1 transition-colors hover:bg-muted"
              data-testid="button-dismiss-cta"
            >
              <XIcon className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
