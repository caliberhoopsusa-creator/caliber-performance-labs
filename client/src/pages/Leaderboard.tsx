import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { api } from "@shared/routes";
import { GradeBadge, SectionEyebrow } from "@/components/signal";
import { useSport } from "@/components/SportToggle";
import { useToast } from "@/hooks/use-toast";
import {
  Trophy, Medal, Filter, X, Users, Search, Target, Share2
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkeletonLeaderboardRow } from "@/components/ui/skeleton-premium";

/**
 * Leaderboard — SIGNAL: Career Mode, Phase 2a. Ranking drama with restraint:
 * leaned Archivo rank numerals, the grade ramp for every grade, tabular
 * numerals in the table, sticky headers. The single identity moment is the
 * #1 podium card's crimson treatment — everything else stays quiet.
 */

const CONDENSED = { fontWeight: 500, fontStretch: "70%" } as const;
const DISPLAY_BLACK = {
  fontFamily: "var(--font-display)",
  fontWeight: 900,
  fontStretch: "125%",
  letterSpacing: "-0.01em",
} as const;

function formatPositions(position: string): string {
  return position?.split(',').map(p => p.trim()).join(' / ') || position;
}

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming"
];

const BASKETBALL_POSITIONS = ["Guard", "Wing", "Big"];

const LEVELS = [
  { value: "middle_school", label: "Middle School" },
  { value: "high_school", label: "High School" },
  { value: "college", label: "College" },
];

/** Podium treatment — #1 earns the crimson signal; 2 and 3 stay silver. */
const RANK_STYLES: Record<number, {
  icon: typeof Trophy;
  numeralColor: string;
  iconColor: string;
  borderColor: string;
  glow?: string;
}> = {
  1: {
    icon: Trophy,
    numeralColor: "hsl(var(--crimson))",
    iconColor: "hsl(var(--crimson))",
    borderColor: "hsl(var(--crimson) / 0.4)",
    glow: "0 0 24px hsl(var(--crimson-glow))",
  },
  2: {
    icon: Medal,
    numeralColor: "hsl(var(--silver-hi))",
    iconColor: "hsl(var(--silver))",
    borderColor: "hsl(var(--line))",
  },
  3: {
    icon: Medal,
    numeralColor: "hsl(var(--silver-lo))",
    iconColor: "hsl(var(--silver-lo))",
    borderColor: "hsl(var(--line))",
  },
};

const TABLE_COLUMNS = ["Rank", "Player", "Grade", "PPG", "RPG", "APG", "FG%", "Games"];

export default function Leaderboard() {
  const currentSport = useSport();
  const [stateFilter, setStateFilter] = useState<string>("");
  const [positionFilter, setPositionFilter] = useState<string>("");
  const [levelFilter, setLevelFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const sharePlayer = async (playerId: number, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/profile/${playerId}/public`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied!", description: `${name}'s profile link copied to clipboard` });
    } catch {
      toast({ title: "Copy failed", description: "Could not copy link", variant: "destructive" });
    }
  };

  const positions = BASKETBALL_POSITIONS;

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: [api.analytics.leaderboard.path, currentSport, stateFilter, positionFilter, levelFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("sport", currentSport);
      if (stateFilter) params.append("state", stateFilter);
      if (positionFilter) params.append("position", positionFilter);
      if (levelFilter) params.append("level", levelFilter);

      const url = `${api.analytics.leaderboard.path}?${params.toString()}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    }
  });

  const hasFilters = stateFilter || positionFilter || levelFilter || searchQuery;

  const clearFilters = () => {
    setStateFilter("");
    setPositionFilter("");
    setLevelFilter("");
    setSearchQuery("");
  };

  const filteredLeaderboard = useMemo(() => {
    if (!leaderboard) return [];
    if (!searchQuery) return leaderboard;
    const q = searchQuery.toLowerCase();
    return leaderboard.filter((entry: any) =>
      entry.name?.toLowerCase().includes(q) ||
      entry.team?.toLowerCase().includes(q)
    );
  }, [leaderboard, searchQuery]);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-24 md:pb-8">
        <div
          className="relative overflow-hidden rounded-card border p-6"
          style={{ backgroundColor: "hsl(var(--obsidian-1))", borderColor: "hsl(var(--line))" }}
        >
          <div className="h-8 w-48 skeleton-premium rounded mb-2" />
          <div className="h-4 w-64 skeleton-premium rounded" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonLeaderboardRow key={i} />
          ))}
        </div>
        <p
          className="text-center font-display text-label uppercase text-muted-foreground"
          style={CONDENSED}
        >
          TIP — rankings update as new games are graded
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* page header — quiet scoreboard framing */}
      <header
        className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-end md:justify-between"
        style={{ borderColor: "hsl(var(--line))" }}
      >
        <div className="min-w-0">
          <SectionEyebrow as="div">Rankings</SectionEyebrow>
          <h1
            className="lean mt-3 uppercase leading-none text-title"
            style={{ ...DISPLAY_BLACK, color: "hsl(var(--silver-hi))" }}
            data-testid="text-leaderboard-title"
          >
            Leaderboard
          </h1>
          <p className="mt-2 font-body text-body text-muted-foreground">
            Top performers ranked by average game grade
          </p>
        </div>

        <span
          className="angle-cut inline-flex w-fit shrink-0 items-center gap-1.5 border px-3 py-1.5 font-display text-label uppercase"
          style={{
            ...CONDENSED,
            color: "hsl(var(--silver))",
            borderColor: "hsl(var(--line))",
            backgroundColor: "hsl(var(--obsidian-2))",
          }}
          data-testid="badge-current-sport"
        >
          <Target aria-hidden className="h-3.5 w-3.5" style={{ color: "hsl(var(--crimson))" }} />
          Basketball
        </span>
      </header>

      {/* filters */}
      <section
        aria-label="Leaderboard filters"
        className="space-y-4 rounded-card border p-4"
        style={{ backgroundColor: "hsl(var(--obsidian-1))", borderColor: "hsl(var(--line))" }}
      >
        <div className="flex items-center justify-between">
          <span
            className="flex items-center gap-2 font-display text-label uppercase"
            style={{ ...CONDENSED, color: "hsl(var(--silver-lo))" }}
          >
            <Filter aria-hidden className="h-3.5 w-3.5" />
            Filters
          </span>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs text-accent"
              data-testid="button-clear-filters"
            >
              <X className="w-3 h-3 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              style={{ backgroundColor: "hsl(var(--obsidian-2))", borderColor: "hsl(var(--line))" }}
              data-testid="input-search"
            />
          </div>

          <Select value={stateFilter || "all"} onValueChange={(v) => setStateFilter(v === "all" ? "" : v)}>
            <SelectTrigger
              style={{ backgroundColor: "hsl(var(--obsidian-2))", borderColor: "hsl(var(--line))" }}
              data-testid="select-state-filter"
            >
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {US_STATES.map((state) => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={positionFilter || "all"} onValueChange={(v) => setPositionFilter(v === "all" ? "" : v)}>
            <SelectTrigger
              style={{ backgroundColor: "hsl(var(--obsidian-2))", borderColor: "hsl(var(--line))" }}
              data-testid="select-position-filter"
            >
              <SelectValue placeholder="All Positions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Positions</SelectItem>
              {positions.map((pos) => (
                <SelectItem key={pos} value={pos}>{pos}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={levelFilter || "all"} onValueChange={(v) => setLevelFilter(v === "all" ? "" : v)}>
            <SelectTrigger
              style={{ backgroundColor: "hsl(var(--obsidian-2))", borderColor: "hsl(var(--line))" }}
              data-testid="select-level-filter"
            >
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* podium — top three; #1 carries the only crimson moment on this screen */}
      {filteredLeaderboard.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredLeaderboard.slice(0, 3).map((entry: any, index: number) => {
            const rank = index + 1;
            const rankStyle = RANK_STYLES[rank] ?? RANK_STYLES[3];
            const Icon = rankStyle.icon;

            return (
              <motion.div
                key={entry.playerId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/profile/${entry.playerId}/public`} data-testid={`link-top-player-${index}`}>
                  <article
                    className={cn(
                      "gloss group relative h-full cursor-pointer overflow-hidden rounded-card border p-5",
                      "transition-transform duration-300 hover:scale-[1.02]",
                    )}
                    style={{
                      backgroundColor: "hsl(var(--obsidian-1))",
                      borderColor: rankStyle.borderColor,
                      boxShadow: rankStyle.glow,
                    }}
                  >
                    <div className="absolute top-3 right-3 flex items-center gap-1">
                      <button
                        onClick={(e) => sharePlayer(entry.playerId, entry.name, e)}
                        className="rounded-md p-1 opacity-60 transition-opacity hover:bg-muted group-hover:opacity-100"
                        aria-label={`Copy ${entry.name}'s profile link`}
                      >
                        <Share2 className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                      </button>
                      <Icon aria-hidden className="h-6 w-6" style={{ color: rankStyle.iconColor }} />
                    </div>

                    <div className="flex items-center gap-4">
                      {/* leaned rank numeral — the ranking drama */}
                      <div className="lean flex flex-col items-center pr-1">
                        <span
                          className="leading-none tabular-nums"
                          style={{
                            ...DISPLAY_BLACK,
                            fontSize: "clamp(2rem, 1.4rem + 2vw, 3rem)",
                            color: rankStyle.numeralColor,
                          }}
                          aria-label={rank === 1 ? "1st place" : rank === 2 ? "2nd place" : "3rd place"}
                        >
                          {rank}
                        </span>
                        <span
                          className="mt-1 font-display text-label uppercase"
                          style={{ ...CONDENSED, color: "hsl(var(--silver-mute))" }}
                        >
                          Rank
                        </span>
                      </div>

                      <div
                        className="angle-cut flex h-14 w-14 shrink-0 items-center justify-center border font-display text-lg tabular-nums"
                        style={{
                          fontWeight: 800,
                          backgroundColor: "hsl(var(--obsidian-2))",
                          borderColor: "hsl(var(--line))",
                          color: "hsl(var(--silver))",
                        }}
                      >
                        {entry.jerseyNumber || "#"}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3
                          className="truncate uppercase text-foreground"
                          style={{ ...DISPLAY_BLACK, fontSize: "clamp(0.95rem, 0.7rem + 1vw, 1.15rem)" }}
                        >
                          {entry.name}
                        </h3>
                        <p className="truncate font-body text-sm text-muted-foreground">{entry.team || "No Team"}</p>
                        <p
                          className="mt-0.5 font-mono text-muted-foreground"
                          style={{ fontSize: "var(--text-data)" }}
                        >
                          {formatPositions(entry.position)}
                        </p>
                      </div>
                    </div>

                    <div
                      className="mt-4 flex items-center justify-between border-t pt-4"
                      style={{ borderColor: "hsl(var(--line))" }}
                    >
                      <GradeBadge grade={entry.avgGrade} size="lg" />
                      <div className="text-right">
                        <p
                          className="font-display text-label uppercase"
                          style={{ ...CONDENSED, color: "hsl(var(--silver-lo))" }}
                        >
                          Games
                        </p>
                        <p className="font-mono text-lg font-medium tabular-nums text-foreground">
                          {entry.gamesPlayed}
                        </p>
                      </div>
                    </div>
                  </article>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* the full table — dense, tabular, sticky header */}
      <section
        aria-label="Full rankings"
        className="overflow-hidden rounded-card border"
        style={{ backgroundColor: "hsl(var(--obsidian-1))", borderColor: "hsl(var(--line))" }}
      >
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr>
                {TABLE_COLUMNS.map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="sticky top-0 z-10 whitespace-nowrap border-b px-4 py-3 font-display text-label uppercase md:px-6"
                    style={{
                      ...CONDENSED,
                      color: "hsl(var(--silver-lo))",
                      backgroundColor: "hsl(var(--obsidian-2))",
                      borderColor: "hsl(var(--line))",
                    }}
                  >
                    {h}
                  </th>
                ))}
                <th
                  scope="col"
                  className="sticky top-0 z-10 border-b px-4 py-3 md:px-6"
                  style={{ backgroundColor: "hsl(var(--obsidian-2))", borderColor: "hsl(var(--line))" }}
                >
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
              {filteredLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-4">
                    <EmptyState
                      icon={hasFilters ? Trophy : Users}
                      title={hasFilters ? "No Matches Found" : "No Players Yet"}
                      description={hasFilters
                        ? "No players match your current filters. Try adjusting your search criteria."
                        : "Add players and log games to see them ranked on the leaderboard."
                      }
                      action={hasFilters
                        ? { label: "Clear Filters", onClick: clearFilters }
                        : { label: "Add Players", href: "/players" }
                      }
                      variant="compact"
                    />
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filteredLeaderboard.slice(3).map((entry: any, index: number) => {
                    const rank = index + 4;
                    return (
                      <motion.tr
                        key={entry.playerId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="group border-t transition-colors duration-300 hover:bg-muted/40"
                        style={{ borderColor: "hsl(var(--line))" }}
                        data-testid={`row-leaderboard-${rank}`}
                      >
                        <td className="px-4 md:px-6 py-4">
                          <span
                            className="lean inline-block font-display text-base tabular-nums"
                            style={{ fontWeight: 800, color: "hsl(var(--silver-mute))" }}
                          >
                            {rank}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <Link href={`/profile/${entry.playerId}/public`} data-testid={`link-player-profile-${entry.playerId}`}>
                            <div className="flex items-center gap-3 cursor-pointer">
                              <div
                                className="angle-cut flex h-10 w-10 shrink-0 items-center justify-center border font-display text-sm tabular-nums"
                                style={{
                                  fontWeight: 800,
                                  backgroundColor: "hsl(var(--obsidian-2))",
                                  borderColor: "hsl(var(--line))",
                                  color: "hsl(var(--silver))",
                                }}
                              >
                                {entry.jerseyNumber || "#"}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-body font-semibold text-foreground transition-colors group-hover:text-accent">
                                  {entry.name}
                                </p>
                                <p
                                  className="truncate font-mono text-muted-foreground"
                                  style={{ fontSize: "var(--text-data)" }}
                                >
                                  {entry.team || "No Team"} · {entry.position}
                                </p>
                              </div>
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <GradeBadge grade={entry.avgGrade} size="sm" />
                        </td>
                        <td className="px-4 md:px-6 py-4 font-mono font-medium tabular-nums text-foreground">{entry.avgPoints ?? 0}</td>
                        <td className="px-4 md:px-6 py-4 font-mono tabular-nums" style={{ color: "hsl(var(--silver-lo))" }}>{entry.avgRebounds ?? 0}</td>
                        <td className="px-4 md:px-6 py-4 font-mono tabular-nums" style={{ color: "hsl(var(--silver-lo))" }}>{entry.avgAssists ?? 0}</td>
                        <td className="px-4 md:px-6 py-4 font-mono tabular-nums" style={{ color: "hsl(var(--silver-lo))" }}>{entry.fgPct ?? 0}%</td>
                        <td className="px-4 md:px-6 py-4 font-mono tabular-nums" style={{ color: "hsl(var(--silver-mute))" }}>{entry.gamesPlayed}</td>
                        <td className="px-4 md:px-6 py-4">
                          <button
                            onClick={(e) => sharePlayer(entry.playerId, entry.name, e)}
                            className="rounded-md p-1.5 opacity-60 transition-opacity hover:bg-muted group-hover:opacity-100"
                            aria-label={`Copy ${entry.name}'s profile link`}
                          >
                            <Share2 className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
