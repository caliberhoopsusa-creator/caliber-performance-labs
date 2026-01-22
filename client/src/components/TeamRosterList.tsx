import { useState } from "react";
import { Link } from "wouter";
import { GradeBadge } from "@/components/GradeBadge";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { FOOTBALL_POSITION_LABELS, type FootballPosition } from "@shared/sports-config";

// Helper to format comma-separated positions with full labels
function formatPositions(position: string): string {
  return position?.split(',').map(p => p.trim()).map(pos => 
    FOOTBALL_POSITION_LABELS[pos as FootballPosition] || pos
  ).join(' / ') || position;
}

interface Player {
  id: number;
  name: string;
  position: string;
  jerseyNumber: number | null;
  gamesPlayed: number;
  ppg: number;
  rpg: number;
  apg: number;
  avgGrade: string;
}

interface TeamRosterListProps {
  players: Player[];
  teamName: string;
  compact?: boolean;
}

type SortKey = "position" | "avgGrade" | "ppg" | "rpg" | "apg";

const gradeScores: Record<string, number> = {
  'A+': 97, 'A': 94, 'A-': 90,
  'B+': 87, 'B': 84, 'B-': 80,
  'C+': 77, 'C': 74, 'C-': 70,
  'D': 65, 'F': 55
};

export function TeamRosterList({ players, teamName, compact = false }: TeamRosterListProps) {
  const [sortKey, setSortKey] = useState<SortKey>("avgGrade");
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sortedPlayers = [...players].sort((a, b) => {
    let comparison = 0;
    switch (sortKey) {
      case "position":
        comparison = a.position.localeCompare(b.position);
        break;
      case "avgGrade":
        comparison = (gradeScores[b.avgGrade] || 0) - (gradeScores[a.avgGrade] || 0);
        break;
      case "ppg":
        comparison = b.ppg - a.ppg;
        break;
      case "rpg":
        comparison = b.rpg - a.rpg;
        break;
      case "apg":
        comparison = b.apg - a.apg;
        break;
    }
    return sortAsc ? -comparison : comparison;
  });

  const SortHeader = ({ label, sortKey: key }: { label: string; sortKey: SortKey }) => (
    <button
      onClick={() => handleSort(key)}
      className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-white transition-colors"
      data-testid={`button-sort-${key}`}
    >
      {label}
      {sortKey === key && (
        sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
      )}
    </button>
  );

  return (
    <div className={cn("bg-card border border-white/5 rounded-xl overflow-hidden", compact ? "text-sm" : "")} data-testid={`roster-list-${teamName}`}>
      <div className="p-4 border-b border-white/5 bg-white/5">
        <h4 className="font-display font-bold text-white uppercase tracking-wider">
          {teamName} Roster
        </h4>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Player</span>
              </th>
              <th className="px-4 py-3 text-center">
                <SortHeader label="Pos" sortKey="position" />
              </th>
              <th className="px-4 py-3 text-center">
                <SortHeader label="Grade" sortKey="avgGrade" />
              </th>
              {!compact && (
                <>
                  <th className="px-4 py-3 text-center">
                    <SortHeader label="PPG" sortKey="ppg" />
                  </th>
                  <th className="px-4 py-3 text-center">
                    <SortHeader label="RPG" sortKey="rpg" />
                  </th>
                  <th className="px-4 py-3 text-center">
                    <SortHeader label="APG" sortKey="apg" />
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedPlayers.map((player) => (
              <tr 
                key={player.id} 
                className="hover:bg-white/5 transition-colors"
                data-testid={`row-player-${player.id}`}
              >
                <td className="px-4 py-3">
                  <Link href={`/players/${player.id}`} className="flex items-center gap-3 group">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs shrink-0">
                      {player.jerseyNumber || "#"}
                    </div>
                    <span className="font-medium text-white group-hover:text-primary transition-colors truncate">
                      {player.name}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-muted-foreground text-xs">{formatPositions(player.position)}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <GradeBadge grade={player.avgGrade} size="sm" />
                </td>
                {!compact && (
                  <>
                    <td className="px-4 py-3 text-center font-mono text-white">{player.ppg}</td>
                    <td className="px-4 py-3 text-center font-mono text-white">{player.rpg}</td>
                    <td className="px-4 py-3 text-center font-mono text-white">{player.apg}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
