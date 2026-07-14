import { useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { toPng } from "html-to-image";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Share2,
  Loader2,
  LayoutTemplate,
  Sparkles,
  Trophy,
  Star,
  Zap,
  Crown,
  Target,
  Shield,
  Crosshair,
  Grab,
  Check,
  ImageIcon,
  Lock,
} from "lucide-react";
import type { PlayerWithGames, Badge as BadgeType } from "@shared/schema";
import { TIER_THRESHOLDS, TIER_ORDER } from "@shared/schema";
import type { SkillBadge } from "@/hooks/use-basketball";
import { cn } from "@/lib/utils";

type CanvasTemplate = "classic" | "minimal" | "elite";
type CanvasFormat = "square" | "story" | "landscape";
type AccentSwatch = "blue" | "red" | "green" | "gold" | "violet";

const FORMAT_DIMS: Record<CanvasFormat, { w: number; h: number; label: string; aspect: string }> = {
  square:    { w: 480, h: 480, label: "Square",    aspect: "1 / 1" },
  story:     { w: 360, h: 640, label: "Story",     aspect: "9 / 16" },
  landscape: { w: 640, h: 360, label: "Landscape", aspect: "16 / 9" },
};

const ACCENT_SWATCHES: Record<AccentSwatch, { label: string; hex: string; hsl: string; fg: string }> = {
  blue:   { label: "Caliber Blue",  hex: "#2563eb", hsl: "221 83% 53%", fg: "#ffffff" },
  red:    { label: "Caliber Red",   hex: "#e02424", hsl: "0 76% 51%",   fg: "#ffffff" },
  green:  { label: "Caliber Green", hex: "#16a34a", hsl: "142 72% 37%", fg: "#ffffff" },
  gold:   { label: "Caliber Gold",  hex: "#d97706", hsl: "38 92% 50%",  fg: "#ffffff" },
  violet: { label: "Caliber Violet",hex: "#7c3aed", hsl: "263 70% 58%", fg: "#ffffff" },
};

const TIER_ICONS: Record<string, typeof Star> = {
  Rookie:        Star,
  Starter:       Zap,
  "All-Star":    Sparkles,
  MVP:           Trophy,
  "Hall of Fame":Crown,
};

const SKILL_ICONS: Record<string, typeof Target> = {
  sharpshooter: Crosshair,
  pure_passer:  Zap,
  bucket_getter:Target,
  glass_cleaner:Shield,
  rim_protector:Shield,
  pickpocket:   Grab,
};

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function calcAverages(games: PlayerWithGames["games"]) {
  if (!games.length) return { pts: "—", reb: "—", ast: "—", blk: "—", stl: "—", gp: 0 };
  const gp = games.length;
  const avg = (key: keyof (typeof games)[0]) =>
    (games.reduce((a, g) => a + Number(g[key] ?? 0), 0) / gp).toFixed(1);
  return { pts: avg("points"), reb: avg("rebounds"), ast: avg("assists"), blk: avg("blocks"), stl: avg("steals"), gp };
}

function gradeFromGames(games: { grade: string | null }[]): string {
  if (!games.length) return "—";
  const MAP: Record<string, number> = {
    "A+": 100, A: 95, "A-": 90, "B+": 88, B: 85, "B-": 80,
    "C+": 78, C: 75, "C-": 70, "D+": 68, D: 65, "D-": 60, F: 50,
  };
  const avg = games.reduce((a, g) => a + (MAP[g.grade?.trim().toUpperCase() ?? ""] ?? 0), 0) / games.length;
  if (avg >= 97) return "A+";
  if (avg >= 92) return "A";
  if (avg >= 87) return "A-";
  if (avg >= 84) return "B+";
  if (avg >= 81) return "B";
  if (avg >= 77) return "B-";
  if (avg >= 74) return "C+";
  if (avg >= 71) return "C";
  return "C-";
}

interface TierInfo {
  current: string;
  next: string | null;
  pct: number;
}

function calcTierProgress(xp: number): TierInfo {
  const tiers = TIER_ORDER;
  let current: string = tiers[0];
  let next: string | null = null;
  for (let i = 0; i < tiers.length; i++) {
    if (xp >= TIER_THRESHOLDS[tiers[i]]) current = tiers[i];
  }
  const idx = tiers.indexOf(current as (typeof TIER_ORDER)[number]);
  next = idx < tiers.length - 1 ? tiers[idx + 1] : null;
  const currentThresh = TIER_THRESHOLDS[current as keyof typeof TIER_THRESHOLDS];
  const nextThresh = next ? TIER_THRESHOLDS[next as keyof typeof TIER_THRESHOLDS] : currentThresh;
  const pct = next ? Math.min(100, ((xp - currentThresh) / (nextThresh - currentThresh)) * 100) : 100;
  return { current, next, pct };
}

/* ─────────────────────────────────────────────────────────────
   CARD TEMPLATES
   All cards use inline styles (not Tailwind) so html-to-image
   captures them correctly. No Tailwind JIT purging issues.
───────────────────────────────────────────────────────────── */

function ClassicCard({
  player,
  accent,
  dims,
  grade,
  avgs,
  tierInfo,
  skillBadges,
}: {
  player: PlayerWithGames;
  accent: (typeof ACCENT_SWATCHES)[AccentSwatch];
  dims: { w: number; h: number };
  grade: string;
  avgs: ReturnType<typeof calcAverages>;
  tierInfo: TierInfo;
  skillBadges: SkillBadge[];
}) {
  const TierIcon = TIER_ICONS[tierInfo.current] ?? Star;
  const padding = Math.round(dims.w * 0.055);
  const isWide = dims.w > dims.h;

  return (
    <div
      style={{
        width: dims.w,
        height: dims.h,
        background: `linear-gradient(145deg, hsl(222 47% 7%) 0%, hsl(220 38% 10%) 55%, hsl(222 40% 8%) 100%)`,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding,
        fontFamily: "'Geist', 'Inter', sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, transparent 0%, ${accent.hex} 40%, ${accent.hex} 60%, transparent 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -80,
          right: -80,
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent.hex}22 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -40,
          left: -40,
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent.hex}14 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: isWide ? 12 : 20 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div
            style={{
              width: isWide ? 64 : 80,
              height: isWide ? 64 : 80,
              borderRadius: 14,
              overflow: "hidden",
              border: `2px solid ${accent.hex}50`,
              background: `linear-gradient(135deg, ${accent.hex}40, ${accent.hex}18)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {player.photoUrl ? (
              <img src={player.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: isWide ? 22 : 28, fontWeight: 800, color: accent.hex, letterSpacing: -1 }}>
                {getInitials(player.name)}
              </span>
            )}
          </div>
          <div
            style={{
              position: "absolute",
              bottom: -4,
              right: -4,
              width: 22,
              height: 22,
              borderRadius: 6,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TierIcon style={{ width: 12, height: 12, color: accent.hex }} />
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            {player.jerseyNumber != null && (
              <span style={{ fontSize: 13, fontWeight: 800, color: accent.hex }}>#{player.jerseyNumber}</span>
            )}
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: accent.hex,
                background: `${accent.hex}20`,
                border: `1px solid ${accent.hex}40`,
                padding: "2px 8px",
                borderRadius: 4,
              }}
            >
              {player.position}
            </span>
          </div>
          <div style={{ fontSize: isWide ? 20 : 26, fontWeight: 800, color: "#fff", letterSpacing: -0.5, lineHeight: 1.1 }}>
            {player.name}
          </div>
          {player.team && (
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{player.team}</div>
          )}
          {player.school && (
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{player.school}</div>
          )}
        </div>

        <div style={{ flexShrink: 0, textAlign: "center" }}>
          <div
            style={{
              width: isWide ? 48 : 56,
              height: isWide ? 48 : 56,
              borderRadius: 10,
              background: grade.startsWith("A") ? "#16a34a" : grade.startsWith("B") ? "#2563eb" : "#d97706",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: isWide ? 20 : 24,
              fontWeight: 800,
              color: "#fff",
            }}
          >
            {grade}
          </div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, marginTop: 3 }}>
            Grade
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isWide ? "repeat(5, 1fr)" : "repeat(3, 1fr)",
          gap: 8,
          marginBottom: isWide ? 14 : 18,
        }}
      >
        {(isWide
          ? [["PTS", avgs.pts], ["REB", avgs.reb], ["AST", avgs.ast], ["BLK", avgs.blk], ["STL", avgs.stl]]
          : [["PTS", avgs.pts], ["REB", avgs.reb], ["AST", avgs.ast]]
        ).map(([label, val]) => (
          <div
            key={label}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              padding: isWide ? "10px 4px" : "14px 4px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: isWide ? 20 : 26,
                fontWeight: 800,
                color: "#fff",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1,
              }}
            >
              {val}
            </div>
            <div
              style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.4)",
                textTransform: "uppercase",
                letterSpacing: 1.2,
                marginTop: 4,
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      {skillBadges.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase",
              letterSpacing: 1.2,
              marginBottom: 6,
            }}
          >
            Skill Badges
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {skillBadges.slice(0, isWide ? 5 : 4).map((b) => {
              const Icon = SKILL_ICONS[b.skillType] ?? Target;
              return (
                <div
                  key={b.skillType}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 6,
                    padding: "3px 8px",
                  }}
                >
                  <Icon style={{ width: 10, height: 10, color: accent.hex }} />
                  <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 0.8 }}>
                    {b.currentLevel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TierIcon style={{ width: 14, height: 14, color: accent.hex }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: accent.hex }}>{tierInfo.current}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>
              {player.totalXp?.toLocaleString() ?? "0"} XP
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, opacity: 0.4 }}>
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              background: `${accent.hex}30`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: 800,
              color: accent.hex,
            }}
          >
            C
          </div>
          <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1.5 }}>
            Caliber
          </span>
        </div>
      </div>
    </div>
  );
}

function MinimalCard({
  player,
  accent,
  dims,
  grade,
  avgs,
  tierInfo,
}: {
  player: PlayerWithGames;
  accent: (typeof ACCENT_SWATCHES)[AccentSwatch];
  dims: { w: number; h: number };
  grade: string;
  avgs: ReturnType<typeof calcAverages>;
  tierInfo: TierInfo;
}) {
  const TierIcon = TIER_ICONS[tierInfo.current] ?? Star;
  const padding = Math.round(dims.w * 0.07);
  const isWide = dims.w > dims.h;

  return (
    <div
      style={{
        width: dims.w,
        height: dims.h,
        background: "#fafafa",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding,
        fontFamily: "'Geist', 'Inter', sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, transparent 0%, ${accent.hex} 40%, ${accent.hex} 60%, transparent 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent.hex}10 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: isWide ? 14 : 24 }}>
        <div
          style={{
            width: isWide ? 56 : 72,
            height: isWide ? 56 : 72,
            borderRadius: "50%",
            overflow: "hidden",
            border: `2px solid ${accent.hex}30`,
            background: `${accent.hex}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {player.photoUrl ? (
            <img src={player.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: isWide ? 20 : 24, fontWeight: 800, color: accent.hex }}>
              {getInitials(player.name)}
            </span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: isWide ? 18 : 22, fontWeight: 800, color: "#0f172a", letterSpacing: -0.5, lineHeight: 1.1 }}>
            {player.name}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: accent.hex }}>{player.position}</span>
            {player.team && <span style={{ fontSize: 11, color: "#64748b" }}>· {player.team}</span>}
            {player.jerseyNumber != null && (
              <span style={{ fontSize: 11, color: "#94a3b8" }}>#{player.jerseyNumber}</span>
            )}
          </div>
          {player.school && (
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{player.school}</div>
          )}
        </div>

        <div
          style={{
            flexShrink: 0,
            width: isWide ? 44 : 52,
            height: isWide ? 44 : 52,
            borderRadius: 10,
            border: `2px solid ${accent.hex}40`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: isWide ? 18 : 22,
            fontWeight: 800,
            color: accent.hex,
          }}
        >
          {grade}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isWide ? "repeat(5, 1fr)" : "repeat(3, 1fr)",
          gap: 10,
          marginBottom: isWide ? 14 : 20,
        }}
      >
        {(isWide
          ? [["PTS", avgs.pts], ["REB", avgs.reb], ["AST", avgs.ast], ["BLK", avgs.blk], ["STL", avgs.stl]]
          : [["PTS", avgs.pts], ["REB", avgs.reb], ["AST", avgs.ast]]
        ).map(([label, val]) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: isWide ? 22 : 30,
                fontWeight: 800,
                color: "#0f172a",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1,
              }}
            >
              {val}
            </div>
            <div
              style={{
                width: "100%",
                height: 2,
                background: `${accent.hex}30`,
                margin: "6px 0",
                borderRadius: 1,
              }}
            />
            <div style={{ fontSize: 9, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1.2 }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <TierIcon style={{ width: 13, height: 13, color: accent.hex }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: accent.hex }}>{tierInfo.current}</span>
          <span style={{ fontSize: 10, color: "#94a3b8" }}>{player.totalXp?.toLocaleString() ?? "0"} XP</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, opacity: 0.5 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1.5 }}>
            Caliber
          </span>
        </div>
      </div>
    </div>
  );
}

function EliteCard({
  player,
  accent,
  dims,
  grade,
  avgs,
  tierInfo,
  skillBadges,
}: {
  player: PlayerWithGames;
  accent: (typeof ACCENT_SWATCHES)[AccentSwatch];
  dims: { w: number; h: number };
  grade: string;
  avgs: ReturnType<typeof calcAverages>;
  tierInfo: TierInfo;
  skillBadges: SkillBadge[];
}) {
  const TierIcon = TIER_ICONS[tierInfo.current] ?? Crown;
  const padding = Math.round(dims.w * 0.055);
  const isWide = dims.w > dims.h;
  const isStory = dims.h > dims.w;

  return (
    <div
      style={{
        width: dims.w,
        height: dims.h,
        background: `linear-gradient(160deg, hsl(222 60% 6%) 0%, hsl(240 45% 9%) 40%, hsl(222 55% 7%) 100%)`,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding,
        fontFamily: "'Geist', 'Inter', sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `repeating-linear-gradient(
            0deg,
            rgba(255,255,255,0.012) 0px,
            rgba(255,255,255,0.012) 1px,
            transparent 1px,
            transparent 32px
          ), repeating-linear-gradient(
            90deg,
            rgba(255,255,255,0.012) 0px,
            rgba(255,255,255,0.012) 1px,
            transparent 1px,
            transparent 32px
          )`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent 0%, ${accent.hex} 30%, #fff 50%, ${accent.hex} 70%, transparent 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -60,
          right: isStory ? "50%" : -40,
          width: isStory ? 360 : 300,
          height: isStory ? 360 : 300,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent.hex}2a 0%, transparent 65%)`,
          pointerEvents: "none",
          transform: isStory ? "translateX(50%)" : undefined,
        }}
      />

      {isStory ? (
        <>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 12, marginBottom: 28 }}>
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                overflow: "hidden",
                border: `2px solid ${accent.hex}60`,
                background: `linear-gradient(135deg, ${accent.hex}40, ${accent.hex}18)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {player.photoUrl ? (
                <img src={player.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 36, fontWeight: 800, color: accent.hex }}>{getInitials(player.name)}</span>
              )}
            </div>
            <div>
              {player.jerseyNumber != null && (
                <div style={{ fontSize: 13, fontWeight: 700, color: accent.hex, marginBottom: 4 }}>#{player.jerseyNumber}</div>
              )}
              <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: -1, lineHeight: 1 }}>{player.name}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                {player.position}{player.team ? ` · ${player.team}` : ""}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
            {[["PTS", avgs.pts], ["REB", avgs.reb], ["AST", avgs.ast]].map(([lbl, val]) => (
              <div
                key={lbl}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${accent.hex}25`,
                  borderRadius: 12,
                  padding: "16px 8px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1.5, marginTop: 6 }}>{lbl}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
            {[["BLK", avgs.blk], ["STL", avgs.stl]].map(([lbl, val]) => (
              <div
                key={lbl}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${accent.hex}25`,
                  borderRadius: 12,
                  padding: "12px 8px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1.5, marginTop: 5 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: isWide ? 12 : 22 }}>
            <div
              style={{
                width: isWide ? 64 : 84,
                height: isWide ? 64 : 84,
                borderRadius: isWide ? 12 : 18,
                overflow: "hidden",
                border: `2px solid ${accent.hex}50`,
                background: `linear-gradient(135deg, ${accent.hex}40, ${accent.hex}18)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {player.photoUrl ? (
                <img src={player.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: isWide ? 22 : 32, fontWeight: 800, color: accent.hex }}>{getInitials(player.name)}</span>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 5, flexWrap: "wrap" }}>
                {player.jerseyNumber != null && (
                  <span style={{ fontSize: 12, fontWeight: 800, color: accent.hex }}>#{player.jerseyNumber}</span>
                )}
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    color: "#fff",
                    background: `${accent.hex}35`,
                    border: `1px solid ${accent.hex}55`,
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}
                >
                  {player.position}
                </span>
              </div>
              <div
                style={{
                  fontSize: isWide ? 20 : 28,
                  fontWeight: 900,
                  color: "#fff",
                  letterSpacing: -0.8,
                  lineHeight: 1,
                  textTransform: "uppercase",
                }}
              >
                {player.name}
              </div>
              {(player.team || player.school) && (
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>
                  {[player.team, player.school].filter(Boolean).join(" · ")}
                </div>
              )}
            </div>

            <div
              style={{
                flexShrink: 0,
                width: isWide ? 50 : 60,
                height: isWide ? 50 : 60,
                borderRadius: 12,
                background: `linear-gradient(135deg, ${accent.hex}40, ${accent.hex}20)`,
                border: `1px solid ${accent.hex}50`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
              }}
            >
              <div style={{ fontSize: isWide ? 20 : 26, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{grade}</div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1 }}>Grade</div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isWide ? "repeat(5, 1fr)" : "repeat(3, 1fr)",
              gap: 8,
              marginBottom: isWide ? 14 : 18,
            }}
          >
            {(isWide
              ? [["PTS", avgs.pts], ["REB", avgs.reb], ["AST", avgs.ast], ["BLK", avgs.blk], ["STL", avgs.stl]]
              : [["PTS", avgs.pts], ["REB", avgs.reb], ["AST", avgs.ast]]
            ).map(([label, val]) => (
              <div
                key={label}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${accent.hex}20`,
                  borderRadius: 12,
                  padding: isWide ? "10px 4px" : "16px 4px",
                  textAlign: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: `linear-gradient(to bottom, ${accent.hex}08, transparent)`,
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    fontSize: isWide ? 20 : 28,
                    fontWeight: 800,
                    color: "#fff",
                    fontVariantNumeric: "tabular-nums",
                    lineHeight: 1,
                    position: "relative",
                  }}
                >
                  {val}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: "rgba(255,255,255,0.4)",
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                    marginTop: 5,
                    position: "relative",
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {skillBadges.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 7 }}>
            Skill Badges
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {skillBadges.slice(0, isWide ? 5 : 4).map((b) => {
              const Icon = SKILL_ICONS[b.skillType] ?? Target;
              return (
                <div
                  key={b.skillType}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    background: `${accent.hex}18`,
                    border: `1px solid ${accent.hex}35`,
                    borderRadius: 6,
                    padding: "3px 8px",
                  }}
                >
                  <Icon style={{ width: 10, height: 10, color: accent.hex }} />
                  <span style={{ fontSize: 9, fontWeight: 600, color: "#fff", textTransform: "uppercase", letterSpacing: 0.8, opacity: 0.8 }}>
                    {b.currentLevel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TierIcon style={{ width: 14, height: 14, color: accent.hex }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: accent.hex, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {tierInfo.current}
            </div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>
              {player.totalXp?.toLocaleString() ?? "0"} XP
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              background: `${accent.hex}30`,
              border: `1px solid ${accent.hex}40`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: 900,
              color: accent.hex,
            }}
          >
            C
          </div>
          <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.8 }}>
            Caliber
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */

export default function CanvasPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);

  const [template, setTemplate] = useState<CanvasTemplate>("classic");
  const [format, setFormat] = useState<CanvasFormat>("square");
  const [accentKey, setAccentKey] = useState<AccentSwatch>("blue");
  const [isExporting, setIsExporting] = useState(false);

  const playerId = user?.playerId;

  const { data: player, isLoading } = useQuery<PlayerWithGames>({
    queryKey: [`/api/players/${playerId}`],
    enabled: !!playerId,
  });

  const { data: skillBadgesRaw } = useQuery<SkillBadge[]>({
    queryKey: [`/api/players/${playerId}/skill-badges`],
    enabled: !!playerId,
  });

  const unlockedSkillBadges = (skillBadgesRaw ?? []).filter(
    (b) => b.currentLevel !== "none"
  );

  const dims = FORMAT_DIMS[format];
  const accent = ACCENT_SWATCHES[accentKey];
  const avgs = player ? calcAverages(player.games ?? []) : calcAverages([]);
  const grade = player ? gradeFromGames(player.games ?? []) : "—";
  const tierInfo = player ? calcTierProgress(player.totalXp ?? 0) : { current: "Rookie", next: "Starter", pct: 0 };

  const handleExport = useCallback(
    async (mode: "download" | "share") => {
      if (!cardRef.current || !player) return;
      setIsExporting(true);
      try {
        const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });

        if (mode === "download") {
          const link = document.createElement("a");
          link.download = `caliber-${player.name.replace(/\s+/g, "-").toLowerCase()}-canvas.png`;
          link.href = dataUrl;
          link.click();
          toast({ title: "Canvas saved", description: "Your player card has been downloaded." });
        } else {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const file = new File([blob], `caliber-canvas.png`, { type: "image/png" });
          if (navigator.share && navigator.canShare?.({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `${player.name} · Caliber`,
              text: `Check out my player card on Caliber!`,
            });
          } else {
            const link = document.createElement("a");
            link.download = `caliber-${player.name.replace(/\s+/g, "-").toLowerCase()}-canvas.png`;
            link.href = dataUrl;
            link.click();
            toast({ title: "Canvas saved", description: "Sharing not supported — image downloaded instead." });
          }
        }
      } catch {
        toast({ title: "Export failed", description: "Unable to generate image. Try again.", variant: "destructive" });
      } finally {
        setIsExporting(false);
      }
    },
    [player, toast]
  );

  const renderCard = () => {
    if (!player) return null;
    const cardProps = { player, accent, dims: { w: dims.w, h: dims.h }, grade, avgs, tierInfo, skillBadges: unlockedSkillBadges };
    if (template === "classic") return <ClassicCard {...cardProps} />;
    if (template === "minimal") return <MinimalCard {...cardProps} />;
    return <EliteCard {...cardProps} />;
  };

  if (!playerId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 px-4" data-testid="canvas-no-player">
        <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <Lock className="w-6 h-6 text-accent" aria-hidden="true" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-display font-bold text-foreground">Player Profile Required</h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            Create a player profile to access the Canvas studio and generate your shareable stat card.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-canvas">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <LayoutTemplate className="w-5 h-5 text-accent" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold text-foreground tracking-wide">Canvas Studio</h1>
          <p className="text-xs text-muted-foreground">Design and share your player profile card</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <aside className="space-y-5" aria-label="Canvas controls">

          <section className="rounded-xl border border-border bg-card/80 p-4 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Template</h2>
            <div className="grid grid-cols-3 gap-2">
              {(["classic", "minimal", "elite"] as CanvasTemplate[]).map((t) => {
                const labels = { classic: "Classic", minimal: "Minimal", elite: "Elite" };
                const icons = { classic: Star, minimal: LayoutTemplate, elite: Crown };
                const Icon = icons[t];
                return (
                  <button
                    key={t}
                    onClick={() => setTemplate(t)}
                    aria-pressed={template === t}
                    className={cn(
                      "relative flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-all duration-200 cursor-pointer",
                      template === t
                        ? "border-accent/60 bg-accent/10 text-accent"
                        : "border-border bg-muted/30 text-muted-foreground hover:border-accent/30 hover:text-foreground"
                    )}
                    data-testid={`template-btn-${t}`}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    <span className="text-xs font-medium">{labels[t]}</span>
                    {template === t && (
                      <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-accent flex items-center justify-center">
                        <Check className="w-2 h-2 text-white" aria-hidden="true" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card/80 p-4 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Format</h2>
            <Tabs value={format} onValueChange={(v) => setFormat(v as CanvasFormat)}>
              <TabsList className="w-full bg-muted/60 border border-border">
                {(["square", "story", "landscape"] as CanvasFormat[]).map((f) => (
                  <TabsTrigger
                    key={f}
                    value={f}
                    className="flex-1 text-xs data-[state=active]:bg-accent/15 data-[state=active]:text-accent data-[state=active]:border-accent/30 data-[state=active]:font-semibold capitalize"
                    data-testid={`format-tab-${f}`}
                  >
                    {FORMAT_DIMS[f].label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <p className="text-[10px] text-muted-foreground/70">
              {format === "square" ? "480 × 480px — Instagram post, Twitter" :
               format === "story" ? "360 × 640px — Instagram / TikTok story" :
               "640 × 360px — Twitter header, YouTube thumbnail"}
            </p>
          </section>

          <section className="rounded-xl border border-border bg-card/80 p-4 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Accent Color</h2>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(ACCENT_SWATCHES) as AccentSwatch[]).map((key) => {
                const swatch = ACCENT_SWATCHES[key];
                return (
                  <button
                    key={key}
                    onClick={() => setAccentKey(key)}
                    aria-label={`Set accent to ${swatch.label}`}
                    aria-pressed={accentKey === key}
                    className="relative w-9 h-9 rounded-full border-2 transition-transform duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
                    style={{
                      backgroundColor: swatch.hex,
                      borderColor: accentKey === key ? swatch.hex : "transparent",
                      transform: accentKey === key ? "scale(1.15)" : "scale(1)",
                      boxShadow: accentKey === key ? `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${swatch.hex}` : undefined,
                    }}
                    data-testid={`accent-swatch-${key}`}
                  >
                    {accentKey === key && (
                      <Check className="w-3.5 h-3.5 text-white absolute inset-0 m-auto" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">{ACCENT_SWATCHES[accentKey].label}</p>
          </section>

          <section className="rounded-xl border border-border bg-card/80 p-4 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stats Preview</h2>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-4 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : player ? (
              <div className="grid grid-cols-3 gap-2">
                {[["PTS", avgs.pts], ["REB", avgs.reb], ["AST", avgs.ast]].map(([lbl, val]) => (
                  <div key={lbl} className="text-center rounded-lg bg-muted/40 py-2">
                    <div className="text-base font-bold font-display text-foreground tabular-nums">{val}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{lbl}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No player data found.</p>
            )}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px] px-2">{grade} avg grade</Badge>
              <Badge variant="secondary" className="text-[10px] px-2">{avgs.gp} games</Badge>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => handleExport("download")}
              disabled={isExporting || !player}
              className="gap-2"
              data-testid="btn-export-download"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="w-4 h-4" aria-hidden="true" />
              )}
              Save
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport("share")}
              disabled={isExporting || !player}
              className="gap-2 border-accent/30 text-accent hover:bg-accent/10"
              data-testid="btn-export-share"
            >
              <Share2 className="w-4 h-4" aria-hidden="true" />
              Share
            </Button>
          </div>
        </aside>

        <div className="flex flex-col items-center gap-4" data-testid="canvas-preview-area">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" aria-hidden="true" />
            Live Preview
          </div>

          <div
            className="relative flex items-center justify-center w-full"
            style={{ minHeight: Math.min(dims.h, 520) + 32 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${template}-${format}-${accentKey}`}
                initial={{ opacity: 0, scale: 0.97, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: -8 }}
                transition={{ duration: 0.22, ease: [0.34, 1.2, 0.64, 1] }}
                className="relative"
                style={{
                  maxWidth: "100%",
                  maxHeight: 520,
                  aspectRatio: dims.aspect,
                }}
              >
                <div
                  className="rounded-xl overflow-hidden shadow-xl-soft ring-1 ring-border/60"
                  style={{
                    width: "100%",
                    height: "100%",
                    maxWidth: dims.w,
                    aspectRatio: dims.aspect,
                  }}
                >
                  {isLoading ? (
                    <div
                      className="w-full h-full bg-muted animate-pulse flex items-center justify-center"
                      style={{ aspectRatio: dims.aspect }}
                    >
                      <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                    </div>
                  ) : player ? (
                    <div
                      ref={cardRef}
                      style={{
                        width: dims.w,
                        height: dims.h,
                        transform: `scale(${Math.min(1, 520 / Math.max(dims.w, dims.h))})`,
                        transformOrigin: "top left",
                      }}
                    >
                      {renderCard()}
                    </div>
                  ) : (
                    <div
                      className="w-full h-full bg-muted/50 border border-border rounded-xl flex flex-col items-center justify-center gap-3"
                      style={{ aspectRatio: dims.aspect }}
                    >
                      <ImageIcon className="w-10 h-10 text-muted-foreground" aria-hidden="true" />
                      <p className="text-sm text-muted-foreground">No player data yet</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-6 text-xs text-muted-foreground/60">
            <span>{dims.w} × {dims.h}px</span>
            <span>·</span>
            <span className="capitalize">{template} template</span>
            <span>·</span>
            <span>{ACCENT_SWATCHES[accentKey].label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
